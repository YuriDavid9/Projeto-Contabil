import { $, $$, esc, fmtISODate, parseMoney, parseDateAny, readFileText, toast, showMsgs, bindDrop, n2, stamp, downloadCSV, norm, toCSV } from './utils.js';

const OG = { docs: [], seq: 1 };
const RULES_KEY = 'autocontabil-organizador-rules-v1';
const TIPOS = ['PIX', 'NFE', 'BOLETO', 'RECIBO', 'GUIA', 'EXTRATO', 'CONTRATO', 'COMPROVANTE', 'DOCUMENTO'];
const TIPO_RE = [
  ['PIX', /pix/],
  ['NFE', /\b(nfe?|nfs|danfe|nota[\s_-]?fiscal)\b/],
  ['BOLETO', /boleto/],
  ['RECIBO', /recibo/],
  ['GUIA', /\b(darf|das|gps|dae|guia|fgts|inss|gnre)\b/],
  ['EXTRATO', /extrato/],
  ['CONTRATO', /contrato/],
  ['COMPROVANTE', /compr|pagto|pagamento|transf/]
];
const NOISE = /\b(final|scan|scanner|img|image|imagem|whatsapp|copia|cópia|copy|novo|nova|documento|doc|arquivo|v\d+|at|pdf|jpg|jpeg|png|banco|out|nov|dez|jan|fev|mar|abr|mai|jun|jul|ago|set)\b/gi;

function guessMeta(name, lastMod) {
  const base = name.replace(/\.[^.]+$/, '');
  let data = null;
  let match;

  if ((match = base.match(/(20\d{2})[-_.]?(0[1-9]|1[0-2])[-_.]?(0[1-9]|[12]\d|3[01])/))) {
    data = `${match[1]}-${match[2]}-${match[3]}`;
  } else if ((match = base.match(/(0[1-9]|[12]\d|3[01])[-_.](0[1-9]|1[0-2])[-_.](20\d{2})/))) {
    data = `${match[3]}-${match[2]}-${match[1]}`;
  } else {
    const date = new Date(lastMod || Date.now());
    data = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  const low = norm(base).toLowerCase().replace(/[_\-.]+/g, ' ');
  let tipo = 'DOCUMENTO';
  for (const [value, regex] of TIPO_RE) {
    if (regex.test(low)) {
      tipo = value;
      break;
    }
  }

  let valor = '';
  const valueMatch = base.match(/(?:r\$|valor)[\s_-]*([\d.]+,\d{2}|\d+(?:\.\d{2})?)/i);
  if (valueMatch) {
    const parsed = parseMoney(valueMatch[1]);
    if (!Number.isNaN(parsed)) valor = String(Math.abs(parsed));
  }

  let rest = norm(base)
    .replace(/(20\d{2})[-_.]?\d{2}[-_.]?\d{2}/g, ' ')
    .replace(/\d{2}[-_.]\d{2}[-_.]20\d{2}/g, ' ')
    .replace(/(?:r\$|valor)[\s_-]*[\d.,]+/gi, ' ')
    .replace(/\(\d+\)/g, ' ')
    .replace(/[_\-.]+/g, ' ')
    .replace(/\d+/g, ' ');

  TIPO_RE.forEach(([, regex]) => {
    rest = rest.replace(new RegExp(regex.source, 'gi'), ' ');
  });

  rest = rest.replace(/\bpis\b|\bcofins\b|\bicms\b/gi, ' ');
  rest = rest.replace(NOISE, ' ').replace(/\s+/g, ' ').trim();

  const fornecedor = rest.length >= 3 ? rest.split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : '';
  return { data, tipo, fornecedor, valor };
}

function slug(value) {
  return norm(value).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || '';
}

function buildName(documentItem, template) {
  const [year, month, day] = (documentItem.data || '0000-00-00').split('-');
  const map = {
    AAAA: year,
    MM: month,
    DD: day,
    TIPO: slug(documentItem.tipo).toUpperCase(),
    FORNECEDOR: slug(documentItem.fornecedor) || 'SEM-FORNECEDOR',
    VALOR: documentItem.valor && !Number.isNaN(+documentItem.valor) ? n2(+documentItem.valor) : ''
  };

  let name = template.replace(/\{(\w+)\}/g, (_, key) => map[key] ?? '').replace(/[\\/:*?"<>|]+/g, '-').replace(/_{2,}/g, '_').replace(/-{3,}/g, '--').replace(/^[_\-\s]+|[_\-\s]+$/g, '');
  return `${name || 'documento'}.${documentItem.ext}`;
}

function folderOf(documentItem, mode) {
  const [year, month] = (documentItem.data || '0000-00').split('-');
  const fornecedor = slug(documentItem.fornecedor) || 'SEM-FORNECEDOR';
  const folders = {
    anomes: `${year}-${month}`,
    fornecedor,
    'anomes-fornecedor': `${year}-${month}/${fornecedor}`,
    none: ''
  };
  return folders[mode] ?? '';
}

let pdfJSLoader;
function loadPDFJS() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (!pdfJSLoader) {
    pdfJSLoader = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        if (!window.pdfjsLib) return reject(new Error('PDF.js não inicializou.'));
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      };
      script.onerror = () => reject(new Error('PDF.js não carregou. Verifique a conexão e tente novamente.'));
      document.head.appendChild(script);
    });
  }
  return pdfJSLoader;
}

async function extractPdfText(file) {
  const pdfjs = await loadPDFJS();
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(' '));
  }
  return pages.join('\n');
}

function detectPdfMetadata(text) {
  const cnpjMatch = text.match(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/);
  const dateMatch = text.match(/(?:emiss[aã]o|emitido\s+em|vencimento|vcto\.?)[^\d]{0,40}(\d{2}[/.\-]\d{2}[/.\-]\d{4}|\d{4}-\d{2}-\d{2})/i) || text.match(/\b(\d{2}[/.\-]\d{2}[/.\-]\d{4})\b/);
  const valueMatch = text.match(/(?:valor\s+total|total\s+(?:do\s+documento|a\s+pagar|geral)|valor\s+cobrado)[^\d]{0,40}(?:R\$\s*)?([\d.]+,\d{2}|\d+\.\d{2})/i);
  const cnpj = cnpjMatch ? cnpjMatch[0].replace(/\D/g, '') : '';
  const data = dateMatch ? parseDateAny(dateMatch[1]) || '' : '';
  const parsedValue = valueMatch ? parseMoney(valueMatch[1]) : NaN;
  const valor = Number.isFinite(parsedValue) ? String(Math.abs(parsedValue)) : '';
  return { cnpj, data, valor, detected: Boolean(cnpj || data || valor) };
}

function readSavedRules() {
  try {
    const rules = JSON.parse(localStorage.getItem(RULES_KEY) || '[]');
    return Array.isArray(rules) ? rules : [];
  } catch {
    return [];
  }
}

function renderSavedRules(selectedName = $('#og-saved-rules').value) {
  const select = $('#og-saved-rules');
  const rules = readSavedRules();
  select.innerHTML = rules.length
    ? rules.map((rule) => `<option value="${esc(rule.name)}">${esc(rule.name)}</option>`).join('')
    : '<option value="">Nenhuma regra salva</option>';
  if (rules.some((rule) => rule.name === selectedName)) select.value = selectedName;
}

function saveOGRule() {
  const name = $('#og-rule-name').value.trim();
  if (!name) return toast('Informe um nome para a regra.', 'warn');
  try {
    const rules = readSavedRules();
    const rule = { name, template: ogTemplate(), treeMode: $('#og-tree-mode').value };
    const index = rules.findIndex((entry) => entry.name.toLowerCase() === name.toLowerCase());
    if (index < 0) rules.push(rule); else rules[index] = rule;
    localStorage.setItem(RULES_KEY, JSON.stringify(rules));
    renderSavedRules(name);
    toast('Regra salva neste navegador.', 'ok');
  } catch {
    toast('Não foi possível salvar a regra neste navegador.', 'err');
  }
}

function loadOGRule() {
  const rule = readSavedRules().find((entry) => entry.name === $('#og-saved-rules').value);
  if (!rule) return toast('Selecione uma regra salva.', 'warn');
  const isPreset = [...$('#og-rule').options].some((option) => option.value === rule.template);
  $('#og-rule').value = isPreset ? rule.template : 'custom';
  $('#og-custom').value = rule.template;
  $('#og-custom').classList.toggle('hidden', isPreset);
  $('#og-tree-mode').value = rule.treeMode;
  refreshOGNames();
  toast('Regra carregada.', 'ok');
}

function deleteOGRule() {
  const name = $('#og-saved-rules').value;
  if (!name) return toast('Selecione uma regra salva.', 'warn');
  try {
    localStorage.setItem(RULES_KEY, JSON.stringify(readSavedRules().filter((rule) => rule.name !== name)));
    renderSavedRules();
    toast('Regra apagada.', 'ok');
  } catch {
    toast('Não foi possível apagar a regra salva.', 'err');
  }
}

function renderTree(plan) {
  if (!plan.length) {
    $('#og-tree').innerHTML = '<p class="text-slate-400 text-sm">A árvore aparecerá aqui.</p>';
    return;
  }

  const root = {};
  plan.forEach(({ path }) => {
    let node = root;
    path.split('/').forEach((part, index, segments) => {
      if (index === segments.length - 1) {
        (node.__files ||= []).push(part);
      } else {
        node = node[part] ||= {};
      }
    });
  });

  const draw = (node) => '<ul>' + Object.keys(node).filter((key) => key !== '__files').sort().map((key) => `<li>📁 <b>${esc(key)}/</b>${draw(node[key])}</li>`).join('') + (node.__files || []).sort().map((file) => `<li class="text-xs break-all">📄 ${esc(file)}</li>`).join('') + '</ul>';
  $('#og-tree').innerHTML = `<div>📦 <b>lote_padronizado/</b>${draw(root)}</div>`;
}

function ogTemplate() {
  const rule = $('#og-rule').value;
  if (rule === 'custom') return $('#og-custom').value || '{AAAA}-{MM}-{DD}_{TIPO}_{FORNECEDOR}';
  return rule;
}

function ogPlan() {
  const template = ogTemplate();
  const mode = $('#og-tree-mode').value;
  const used = new Set();
  return OG.docs.map((documentItem) => {
    let name = buildName(documentItem, template);
    let folder = folderOf(documentItem, mode);
    let path = (folder ? `${folder}/` : '') + name;
    let index = 2;
    while (used.has(path.toLowerCase())) {
      const base = buildName(documentItem, template).replace(/\.[^.]+$/, '');
      name = `${base}_${index++}.${documentItem.ext}`;
      path = (folder ? `${folder}/` : '') + name;
    }
    used.add(path.toLowerCase());
    return { d: documentItem, name, folder, path };
  });
}

function renderOG() {
  const plan = ogPlan();
  $('#og-manifest').disabled = !plan.length;
  $('#og-zip').disabled = !plan.length;

  $('#og-tbody').innerHTML = plan.length ? plan.map(({ d, name }) => `<tr class="${d.fornecedor ? '' : 'bg-amber-50'} align-top">
    <td class="px-3 py-2 min-w-[11rem] text-xs text-slate-600 break-all">${esc(d.orig)}${d.demo ? ' <span class="text-[10px] bg-slate-200 rounded px-1">demo</span>' : ''}${d.detected ? ' <span class="mt-1 inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">Detectado automaticamente</span>' : ''}</td>
    <td class="px-3 py-2"><input type="date" data-og="${d.id}" data-f="data" value="${esc(d.data)}" class="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"></td>
    <td class="px-3 py-2"><input type="text" inputmode="numeric" data-og="${d.id}" data-f="cnpj" value="${esc(d.cnpj || '')}" placeholder="CNPJ" class="w-36 rounded-lg border border-slate-300 px-2 py-1 text-xs"></td>
    <td class="px-3 py-2"><select data-og="${d.id}" data-f="tipo" class="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs">${TIPOS.map((tipo) => `<option ${tipo === d.tipo ? 'selected' : ''}>${tipo}</option>`).join('')}</select></td>
    <td class="px-3 py-2"><input type="text" data-og="${d.id}" data-f="fornecedor" value="${esc(d.fornecedor)}" placeholder="Fornecedor…" class="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"></td>
    <td class="px-3 py-2"><input type="text" inputmode="decimal" data-og="${d.id}" data-f="valor" value="${d.valor ? esc(n2(+d.valor)) : ''}" placeholder="0,00" class="w-24 rounded-lg border border-slate-300 px-2 py-1 text-xs"></td>
    <td class="px-3 py-2 min-w-[12rem] font-mono text-[11px] text-emerald-700 font-semibold break-all" data-newname="${d.id}">${esc(name)}</td>
    <td class="px-3 py-2"><button data-act="og-del" data-id="${d.id}" class="text-slate-400 hover:text-rose-600">×</button></td>
  </tr>`).join('') : '<tr><td colspan="8" class="px-4 py-10 text-center text-slate-500">Fila vazia. Arraste documentos ou carregue os exemplos.</td></tr>';

  renderTree(plan);
}

function refreshOGNames() {
  const plan = ogPlan();
  plan.forEach(({ d, name }) => {
    const element = $(`[data-newname="${d.id}"]`);
    if (element) element.textContent = name;
  });
  renderTree(plan);
}

function manifestRows(plan) {
  const head = ['Nome Original', 'Novo Nome', 'Pasta Sugerida', 'Caminho Completo', 'Data', 'CNPJ', 'Tipo', 'Fornecedor', 'Valor', 'Tamanho (KB)'];
  return [head, ...plan.map(({ d, name, folder, path }) => [d.orig, name, folder || '(raiz)', path, fmtISODate(d.data), d.cnpj || '', d.tipo, d.fornecedor, d.valor ? n2(+d.valor) : '', d.size ? (d.size / 1024).toFixed(1).replace('.', ',') : ''])];
}

async function demoBlob(documentItem, newName) {
  const label = `ARQUIVO DE DEMONSTRACAO - ${newName}`;
  if (documentItem.ext === 'pdf') {
    const stream = `BT /F1 14 Tf 50 780 Td (${label.replace(/[()\\]/g, '\\$&').replace(/[^\x20-\x7E]/g, '?')}) Tj ET`;
    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [];
    objects.forEach((object, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const start = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
    return new Blob([pdf], { type: 'application/pdf' });
  }

  if (['jpg', 'jpeg', 'png'].includes(documentItem.ext)) {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 200;
    const context = canvas.getContext('2d');
    context.fillStyle = '#f1f5f9';
    context.fillRect(0, 0, 600, 200);
    context.fillStyle = '#334155';
    context.font = '16px sans-serif';
    context.fillText('Arquivo de demonstração', 20, 70);
    context.font = '12px sans-serif';
    context.fillText(newName, 20, 100);
    return await new Promise((resolve) => canvas.toBlob(resolve, documentItem.ext === 'png' ? 'image/png' : 'image/jpeg', 0.9));
  }

  return new Blob([label], { type: 'text/plain' });
}

async function zipOG() {
  if (typeof JSZip === 'undefined') {
    toast('Biblioteca JSZip não carregou (verifique a conexão).', 'err');
    return;
  }

  const plan = ogPlan();
  if (!plan.length) return;

  const button = $('#og-zip');
  const previousLabel = button.textContent;
  button.disabled = true;
  button.textContent = '⏳ Gerando ZIP…';

  try {
    const zip = new JSZip();
    for (const item of plan) {
      zip.file(item.path, item.d.demo ? await demoBlob(item.d, item.name) : item.d.file);
    }
    zip.file('manifesto_de_para.csv', toCSV(manifestRows(plan)));
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `documentos_padronizados_${stamp()}.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast('ZIP gerado com manifesto De/Para.', 'ok');
  } catch (error) {
    toast('Falha ao gerar ZIP: ' + error.message, 'err');
  } finally {
    button.disabled = false;
    button.textContent = previousLabel;
  }
}

async function handleOGFiles(files) {
  if (!files.length) return;
  const items = [];
  const warnings = [];
  for (const file of files) {
    const ext = (/\.([^.]+)$/.exec(file.name) || ['','bin'])[1].toLowerCase();
    const item = {
      id: OG.seq++,
      file,
      demo: false,
      orig: file.name,
      ext,
      size: file.size,
      cnpj: '',
      detected: false,
      ...guessMeta(file.name, file.lastModified)
    };
    if (ext === 'pdf') {
      try {
        Object.assign(item, detectPdfMetadata(await extractPdfText(file)));
      } catch (error) {
        warnings.push(`${file.name}: ${error.message} Os campos permanecem editáveis.`);
      }
    }
    items.push(item);
  }
  OG.docs.push(...items);
  showMsgs('#og-msgs', warnings, warnings.length ? 'err' : 'warn');
  renderOG();
  toast(`${files.length} arquivo(s) na fila.`, 'ok');
}

function loadOGDemo() {
  const demoEntries = [
    ['comprovante_pix_final_12.pdf', '2026-10-07', 'PIX', 'Delta Materiais', '1815.37'],
    ['SCAN_20261012_0001.pdf', '2026-10-12', 'NFE', 'Alfa Comercio', '4500'],
    ['IMG_8841.jpg', '2026-10-08', 'RECIBO', 'Imobiliaria Sol', '3075'],
    ['boleto energisa out (2).pdf', '2026-10-05', 'BOLETO', 'Energisa', '1287.45'],
    ['NOVO_documento (3).pdf', '2026-10-13', 'GUIA', 'Receita Federal', '1640.22'],
    ['WhatsApp Image 2026-10-09 at 14.22.51.jpeg', '2026-10-09', 'COMPROVANTE', 'Banco Bradesco', '89.9']
  ];

  OG.docs.push(...demoEntries.map(([orig, data, tipo, fornecedor, valor]) => ({
    id: OG.seq++,
    file: null,
    demo: true,
    orig,
    ext: orig.split('.').pop().toLowerCase(),
    size: 0,
    data,
    tipo,
    fornecedor,
    valor
  })));
  renderOG();
  toast('6 exemplos carregados (metadados simulados, como se lidos por OCR).', 'ok');
}

function initOrganizadorModule() {
  bindDrop($('#og-drop'), $('#og-input'), handleOGFiles);
  renderSavedRules('');
  $('#og-save-rule').addEventListener('click', saveOGRule);
  $('#og-load-rule').addEventListener('click', loadOGRule);
  $('#og-delete-rule').addEventListener('click', deleteOGRule);
  $('#og-demo').addEventListener('click', loadOGDemo);
  $('#og-clear').addEventListener('click', () => { OG.docs = []; renderOG(); });
  $('#og-manifest').addEventListener('click', () => { downloadCSV(manifestRows(ogPlan()), `manifesto_de_para_${stamp()}.csv`); toast('Manifesto exportado.', 'ok'); });
  $('#og-zip').addEventListener('click', zipOG);
  $('#og-rule').addEventListener('change', () => {
    $('#og-custom').classList.toggle('hidden', $('#og-rule').value !== 'custom');
    refreshOGNames();
  });
  $('#og-custom').addEventListener('input', refreshOGNames);
  $('#og-tree-mode').addEventListener('change', refreshOGNames);
  $('#og-tbody').addEventListener('input', (event) => {
    const target = event.target;
    const id = +target.dataset.og;
    if (!id) return;
    const item = OG.docs.find((entry) => entry.id === id);
    if (!item) return;
    if (target.dataset.f === 'valor') {
      const value = parseMoney(target.value);
      item.valor = Number.isNaN(value) ? '' : String(Math.abs(value));
    } else {
      item[target.dataset.f] = target.value;
    }
    refreshOGNames();
  });
  renderOG();
}

export { initOrganizadorModule, OG, ogPlan, manifestRows, renderOG, detectPdfMetadata };
