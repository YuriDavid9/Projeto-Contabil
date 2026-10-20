import {
  $, $$, esc, brl, fmtDateTime, fmtDoc, fmtChave, parseMoney, parseDateAny, readFileText, toast, showMsgs,
  bindDrop, kpi, downloadCSV, n2, r2, stamp, xmlEsc, toCSV, loadSheetJS, normalizeCNPJ
} from './utils.js';

const NF = { notas: [], q: '', page: 1, size: 10, model: '', start: '', end: '', cfop: '' };

function calcDV(value) {
  let weight = 2;
  let sum = 0;
  for (let index = value.length - 1; index >= 0; index--) {
    sum += (value.charCodeAt(index) - 48) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

function buildDemoXML(data) {
  const vProd = r2(data.itens.reduce((total, item) => total + item.q * item.vu, 0));
  const vICMS = r2(vProd * data.icms);
  const vPIS = r2(vProd * 0.0165);
  const vCOFINS = r2(vProd * 0.076);
  const frete = data.frete || 0;
  const vNF = r2(vProd + frete);
  const base = `25${data.dt.slice(2, 4)}${data.dt.slice(5, 7)}${data.emit.doc}${data.mod}${String(data.serie).padStart(3, '0')}${String(data.nNF).padStart(9, '0')}1${String(data.cNF).padStart(8, '0')}`;
  const chave = base + calcDV(base);
  const destDoc = data.dest.doc.length === 14 ? `<CNPJ>${data.dest.doc}</CNPJ>` : `<CPF>${data.dest.doc}</CPF>`;
  const dets = data.itens.map((item, index) => `<det nItem="${index + 1}"><prod><cProd>${1000 + index}</cProd><xProd>${xmlEsc(item.desc)}</xProd><NCM>${item.ncm || '19059090'}</NCM><CFOP>${data.cfop || 5102}</CFOP><uCom>UN</uCom><qCom>${item.q.toFixed(4)}</qCom><vUnCom>${item.vu.toFixed(2)}</vUnCom><vProd>${r2(item.q * item.vu).toFixed(2)}</vProd></prod></det>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><NFe><infNFe Id="NFe${chave}" versao="4.00">
<ide><cUF>25</cUF><natOp>${xmlEsc(data.natOp || 'VENDA DE MERCADORIA')}</natOp><mod>${data.mod}</mod><serie>${data.serie}</serie><nNF>${data.nNF}</nNF><dhEmi>${data.dt}T${data.hora}:00-03:00</dhEmi></ide>
<emit><CNPJ>${data.emit.doc}</CNPJ><xNome>${xmlEsc(data.emit.nome)}</xNome><enderEmit><xMun>João Pessoa</xMun><UF>PB</UF></enderEmit></emit>
<dest>${destDoc}<xNome>${xmlEsc(data.dest.nome)}</xNome></dest>
${dets}
<total><ICMSTot><vBC>${vProd.toFixed(2)}</vBC><vICMS>${vICMS.toFixed(2)}</vICMS><vProd>${vProd.toFixed(2)}</vProd><vFrete>${frete.toFixed(2)}</vFrete><vDesc>0.00</vDesc><vPIS>${vPIS.toFixed(2)}</vPIS><vCOFINS>${vCOFINS.toFixed(2)}</vCOFINS><vNF>${vNF.toFixed(2)}</vNF></ICMSTot></total>
</infNFe></NFe><protNFe versao="4.00"><infProt><tpAmb>1</tpAmb><chNFe>${chave}</chNFe><nProt>1252600${data.nNF}</nProt><cStat>100</cStat></infProt></protNFe></nfeProc>`;
}

const DEMO_NFES = [
  { mod: 55, serie: 1, nNF: 1458, cNF: 11223344, dt: '2026-10-02', hora: '11:20', icms: 0.18, emit: { doc: '11222333000181', nome: 'Distribuidora Alfa de Alimentos LTDA' }, dest: { doc: '44555666000122', nome: 'Mercadinho Bom Preço ME' }, itens: [{ desc: 'Arroz Tipo 1 5kg', q: 40, vu: 27.9 }, { desc: 'Feijão Carioca 1kg', q: 60, vu: 8.45 }] },
  { mod: 55, serie: 1, nNF: 1459, cNF: 22334455, dt: '2026-10-05', hora: '09:05', icms: 0.18, frete: 85, emit: { doc: '11222333000181', nome: 'Distribuidora Alfa de Alimentos LTDA' }, dest: { doc: '55666777000133', nome: 'Supermercado Costa Verde LTDA' }, itens: [{ desc: 'Óleo de Soja 900ml', q: 100, vu: 7.2 }, { desc: 'Açúcar Cristal 1kg', q: 80, vu: 4.6 }] },
  { mod: 55, serie: 2, nNF: 9031, cNF: 33445566, dt: '2026-10-08', hora: '15:48', icms: 0.12, cfop: 5102, emit: { doc: '66777888000144', nome: 'Tech Informática e Suprimentos EIRELI' }, dest: { doc: '77888999000155', nome: 'Escritório Contábil Monteiro & Associados' }, itens: [{ desc: 'Notebook 14" 16GB', q: 3, vu: 3290, ncm: '84713012' }, { desc: 'Mouse sem fio', q: 10, vu: 59.9, ncm: '84716053' }] },
  { mod: 65, serie: 1, nNF: 20877, cNF: 44556677, dt: '2026-10-12', hora: '18:31', icms: 0.18, natOp: 'VENDA AO CONSUMIDOR', emit: { doc: '88999000000166', nome: 'Farmácia Vida Nova LTDA' }, dest: { doc: '12345678909', nome: 'JOAO DA SILVA' }, itens: [{ desc: 'Dipirona 1g 10cp', q: 2, vu: 12.9, ncm: '30049099' }, { desc: 'Protetor Solar FPS50', q: 1, vu: 54.9, ncm: '33049910' }, { desc: 'Soro Fisiológico 500ml', q: 3, vu: 6.5, ncm: '30049099' }] },
  { mod: 55, serie: 1, nNF: 3302, cNF: 55667788, dt: '2026-10-15', hora: '10:12', icms: 0.18, emit: { doc: '99000111000177', nome: 'Papelaria Central do Nordeste LTDA' }, dest: { doc: '77888999000155', nome: 'Escritório Contábil Monteiro & Associados' }, itens: [{ desc: 'Resma Papel A4 500fls', q: 25, vu: 24.9, ncm: '48025610' }, { desc: 'Pasta Suspensa (cx 50)', q: 6, vu: 79.9, ncm: '48203000' }] }
];

function parseNFe(xmlText, fileName) {
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('XML malformado ou corrompido');
  const first = (root, tag) => (root ? root.getElementsByTagName(tag)[0] || null : null);
  const textOf = (root, tag) => {
    const element = first(root, tag);
    return element ? element.textContent.trim() : '';
  };
  const numericOf = (root, tag) => {
    const value = parseFloat(textOf(root, tag));
    return Number.isNaN(value) ? 0 : value;
  };
  const inf = first(doc, 'infNFe');
  if (!inf) throw new Error('não é uma NF-e/NFC-e (tag infNFe ausente — pode ser evento, inutilização ou resumo)');
  const chave = ((inf.getAttribute('Id') || '').replace(/^NFe/i, '') || textOf(doc, 'chNFe')).replace(/[^0-9A-Za-z]/g, '').toUpperCase();
  const chaveValid = /^[0-9A-Z]{44}$/i.test(chave) && Number(chave[43]) === calcDV(chave.slice(0, 43));
  const ide = first(inf, 'ide');
  const emit = first(inf, 'emit');
  const dest = first(inf, 'dest');
  const tot = first(inf, 'ICMSTot');
  if (!tot) throw new Error('totais (ICMSTot) não encontrados');
  const documentOf = (element) => textOf(element, 'CNPJ') || textOf(element, 'CPF') || textOf(element, 'idEstrangeiro');
  const itens = [...inf.getElementsByTagName('det')].map((item) => {
    const product = first(item, 'prod');
    return {
      n: item.getAttribute('nItem') || '',
      cod: textOf(product, 'cProd'),
      desc: textOf(product, 'xProd'),
      ncm: textOf(product, 'NCM'),
      cfop: textOf(product, 'CFOP'),
      un: textOf(product, 'uCom'),
      q: numericOf(product, 'qCom'),
      vu: numericOf(product, 'vUnCom'),
      v: numericOf(product, 'vProd')
    };
  });

  return {
    arquivo: fileName,
    chave,
    mod: textOf(ide, 'mod') || chave.slice(20, 22),
    serie: textOf(ide, 'serie'),
    nNF: textOf(ide, 'nNF'),
    emissao: textOf(ide, 'dhEmi') || textOf(ide, 'dEmi'),
    natOp: textOf(ide, 'natOp'),
    emit: { nome: textOf(emit, 'xNome'), doc: documentOf(emit), fant: textOf(emit, 'xFant') },
    dest: { nome: textOf(dest, 'xNome') || 'Consumidor não identificado', doc: documentOf(dest) },
    vProd: numericOf(tot, 'vProd'),
    vNF: numericOf(tot, 'vNF'),
    vICMS: numericOf(tot, 'vICMS'),
    vPIS: numericOf(tot, 'vPIS'),
    vCOFINS: numericOf(tot, 'vCOFINS'),
    vBC: numericOf(tot, 'vBC'),
    vFrete: numericOf(tot, 'vFrete'),
    vDesc: numericOf(tot, 'vDesc'),
    vST: numericOf(tot, 'vST'),
    vIPI: numericOf(tot, 'vIPI'),
    protocolo: textOf(doc, 'nProt'),
    cStat: textOf(first(doc, 'infProt'), 'cStat'),
    chaveValid,
    itens
  };
}

function addNotas(entries) {
  const errors = [];
  let imported = 0;
  let duplicates = 0;
  const seen = new Set(NF.notas.map((note) => note.chave));

  for (const entry of entries) {
    try {
      const note = parseNFe(entry.text, entry.name);
      if (!note.chaveValid) errors.push(`${entry.name}: chave de acesso inválida (44 dígitos e DV incorreto) — nota importada com aviso.`);
      if (!['100', '150'].includes(note.cStat)) errors.push(`${entry.name}: situação fiscal cStat ${note.cStat || 'ausente'} diferente de 100/150 — confira a nota.`);
      const key = note.chave || `${entry.name}${note.nNF}`;
      if (seen.has(key)) {
        duplicates++;
        continue;
      }
      seen.add(key);
      NF.notas.push(note);
      imported++;
    } catch (error) {
      errors.push(`${entry.name}: ${error.message}`);
    }
  }

  if (duplicates) errors.push(`${duplicates} nota(s) duplicada(s) (mesma chave de acesso) foram ignoradas.`);
  showMsgs('#xml-msgs', errors);
  NF.page = 1;
  renderNF();
  if (imported) toast(`${imported} nota(s) importada(s).`, 'ok');
}

async function handleXmlFiles(files) {
  const entries = [];
  try {
    for (const file of files) {
      if (/\.zip$/i.test(file.name)) {
        if (typeof JSZip === 'undefined') throw new Error('JSZip não carregou; conecte-se à internet e tente novamente.');
        const archive = await JSZip.loadAsync(file);
        for (const [name, item] of Object.entries(archive.files)) {
          if (!item.dir && /\.xml$/i.test(name)) entries.push({ name, text: await item.async('string') });
        }
      } else if (/\.xml$/i.test(file.name) || file.type.includes('xml')) {
        entries.push({ name: file.name, text: await readFileText(file) });
      }
    }
  } catch (error) {
    showMsgs('#xml-msgs', [`Falha ao ler arquivos: ${error.message}`], 'err');
    return;
  }

  if (!entries.length) {
    toast('Selecione arquivos .xml ou um .zip com XMLs.', 'warn');
    return;
  }
  addNotas(entries);
}

function nfFiltered() {
  const query = NF.q.trim().toLowerCase();
  const digitsQuery = query.replace(/\D/g, '');
  const normalizedDocumentQuery = normalizeCNPJ(query);

  const list = NF.notas.filter((note) => {
    if (NF.model && note.mod !== NF.model) return false;
    const emissionDate = parseDateAny(note.emissao) || '';
    if (NF.start && emissionDate < NF.start) return false;
    if (NF.end && emissionDate > NF.end) return false;
    if (NF.cfop && !note.itens.some((item) => item.cfop === NF.cfop)) return false;
    if (!query) return true;
    const searchable = [note.emit.nome, note.dest.nome, note.nNF, note.chave, note.arquivo].some((value) => String(value).toLowerCase().includes(query));
    const documentMatches = digitsQuery && [note.emit.doc, note.dest.doc, note.chave, note.nNF].some((value) => String(value).includes(digitsQuery));
    const cnpjMatches = normalizedDocumentQuery && [note.emit.doc, note.dest.doc].some((value) => normalizeCNPJ(value).includes(normalizedDocumentQuery));
    return searchable || documentMatches || cnpjMatches;
  });

  return list.sort((a, b) => (b.emissao || '').localeCompare(a.emissao || ''));
}

function renderNF() {
  const cfopSelect = $('#xml-filter-cfop');
  if (cfopSelect) {
    const cfops = [...new Set(NF.notas.flatMap((note) => note.itens.map((item) => item.cfop).filter(Boolean)))].sort();
    cfopSelect.innerHTML = '<option value="">Todos</option>' + cfops.map((cfop) => `<option value="${esc(cfop)}">${esc(cfop)}</option>`).join('');
    cfopSelect.value = cfops.includes(NF.cfop) ? NF.cfop : '';
    if (!cfopSelect.value) NF.cfop = '';
  }
  const sum = (key) => r2(NF.notas.reduce((total, note) => total + note[key], 0));

  $('#xml-kpis').innerHTML = [
    kpi('Total de Notas', NF.notas.length, `${NF.notas.filter((note) => note.mod === '55').length} NF-e • ${NF.notas.filter((note) => note.mod === '65').length} NFC-e`, 'indigo'),
    kpi('Faturamento Total', brl(sum('vNF')), `Produtos: ${brl(sum('vProd'))}`, 'emerald'),
    kpi('Total ICMS', brl(sum('vICMS')), 'soma de vICMS', 'amber'),
    kpi('Total PIS / COFINS', brl(sum('vPIS') + sum('vCOFINS')), `PIS ${brl(sum('vPIS'))} • COFINS ${brl(sum('vCOFINS'))}`, 'slate')
  ].join('');

  $('#xml-export').disabled = !NF.notas.length;
  $('#xml-xlsx').disabled = !NF.notas.length;

  const list = nfFiltered();
  const pages = Math.max(1, Math.ceil(list.length / NF.size));
  NF.page = Math.min(NF.page, pages);
  const start = (NF.page - 1) * NF.size;
  const slice = list.slice(start, NF.page * NF.size);

  $('#xml-tbody').innerHTML = slice.length ? slice.map((note) => `
    <tr class="hover:bg-slate-50 ${note.chaveValid && ['100', '150'].includes(note.cStat) ? '' : 'bg-amber-50'}">
      <td class="px-3 py-2"><span class="text-[11px] font-bold rounded-md px-1.5 py-0.5 ${note.mod === '65' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'}">${esc(note.mod)}</span>${!note.chaveValid ? '<span class="ml-1 text-[10px] font-semibold text-rose-700" title="Chave de acesso inválida">Chave inválida</span>' : ''}${!['100', '150'].includes(note.cStat) ? `<span class="ml-1 text-[10px] font-semibold text-rose-700" title="Confira a situação fiscal">cStat ${esc(note.cStat || 'ausente')}</span>` : ''}</td>
      <td class="px-3 py-2 font-semibold whitespace-nowrap">${esc(note.nNF)} <span class="text-slate-400 font-normal">/ ${esc(note.serie)}</span></td>
      <td class="px-3 py-2 whitespace-nowrap">${esc(fmtDateTime(note.emissao))}</td>
      <td class="px-3 py-2 min-w-[14rem]"><div class="font-medium">${esc(note.emit.nome)}</div><div class="text-xs text-slate-500">${esc(fmtDoc(note.emit.doc))}</div></td>
      <td class="px-3 py-2 min-w-[14rem]"><div>${esc(note.dest.nome)}</div><div class="text-xs text-slate-500">${esc(fmtDoc(note.dest.doc))}</div></td>
      <td class="px-3 py-2 text-right whitespace-nowrap">${brl(note.vProd)}</td>
      <td class="px-3 py-2 text-right whitespace-nowrap font-semibold">${brl(note.vNF)}</td>
      <td class="px-3 py-2 text-right whitespace-nowrap">${brl(note.vICMS)}</td>
      <td class="px-3 py-2 text-right whitespace-nowrap">${brl(note.vPIS)}</td>
      <td class="px-3 py-2 text-right whitespace-nowrap">${brl(note.vCOFINS)}</td>
      <td class="px-3 py-2"><button data-act="xml-view" data-key="${esc(note.chave || note.arquivo)}" class="text-indigo-600 hover:text-indigo-800 font-semibold text-xs whitespace-nowrap">Inspecionar</button></td>
    </tr>
  `).join('') : `<tr><td colspan="11" class="px-4 py-10 text-center text-slate-500">${NF.notas.length ? 'Nenhuma nota corresponde à busca.' : 'Nenhuma nota carregada. Arraste arquivos XML ou use o lote de demonstração.'}</td></tr>`;

  const from = list.length ? start + 1 : 0;
  const to = Math.min(NF.page * NF.size, list.length);
  const pageButton = (page, label, disabled, active) => `<button data-act="xml-page" data-p="${page}" ${disabled ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg border text-sm ${active ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 hover:bg-slate-100'} disabled:opacity-40 disabled:cursor-not-allowed">${label}</button>`;

  let pageNumbers = '';
  for (let page = Math.max(1, NF.page - 2); page <= Math.min(pages, NF.page + 2); page++) {
    pageNumbers += pageButton(page, page, false, page === NF.page);
  }

  $('#xml-pager').innerHTML = `<span>Mostrando ${from}–${to} de ${list.length}</span><div class="flex gap-1">${pageButton(NF.page - 1, '‹', NF.page <= 1)}${pageNumbers}${pageButton(NF.page + 1, '›', NF.page >= pages)}</div>`;
}

function showNFModal(key) {
  const note = NF.notas.find((item) => (item.chave || item.arquivo) === key);
  if (!note) return;

  const detailRow = (label, value) => `<div><dt class="text-xs text-slate-500">${esc(label)}</dt><dd class="font-medium break-words">${value}</dd></div>`;
  const modal = $('#modal');
  if (!modal) return;
  window.modal.open(`${note.mod === '65' ? 'NFC-e' : 'NF-e'} nº ${note.nNF} • Série ${note.serie}`, `
    <dl class="grid sm:grid-cols-2 gap-3 mb-4">
      ${detailRow('Chave de acesso', `<span class="font-mono text-xs">${esc(fmtChave(note.chave))}</span> <button data-act="copy" data-v="${esc(note.chave)}" class="text-indigo-600 text-xs font-semibold ml-1">copiar</button>`)}
      ${detailRow('Emissão', esc(fmtDateTime(note.emissao)))}
      ${detailRow('Emitente', `${esc(note.emit.nome)}<br><span class="text-xs text-slate-500">${esc(fmtDoc(note.emit.doc))}</span>`)}
      ${detailRow('Destinatário', `${esc(note.dest.nome)}<br><span class="text-xs text-slate-500">${esc(fmtDoc(note.dest.doc))}</span>`)}
      ${detailRow('Natureza da operação', esc(note.natOp || '—'))}
      ${detailRow('Protocolo / Status', `${esc(note.protocolo || '—')} ${note.cStat ? '• cStat ' + esc(note.cStat) : ''}`)}
      ${detailRow('Arquivo', esc(note.arquivo))}
    </dl>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
      ${[['vProd', note.vProd], ['vFrete', note.vFrete], ['vDesc', note.vDesc], ['vNF', note.vNF], ['vBC ICMS', note.vBC], ['vICMS', note.vICMS], ['vPIS', note.vPIS], ['vCOFINS', note.vCOFINS]]
        .map(([label, value]) => `<div class="bg-slate-50 rounded-xl p-2.5"><div class="text-[11px] text-slate-500">${label}</div><div class="font-bold">${brl(value)}</div></div>`).join('')}
    </div>
    <h4 class="font-bold mb-1">Itens (${note.itens.length})</h4>
    <div class="overflow-x-auto border border-slate-200 rounded-xl"><table class="w-full text-xs">
      <thead class="bg-slate-100 text-left text-slate-500"><tr><th class="p-2">#</th><th class="p-2">Descrição</th><th class="p-2">NCM</th><th class="p-2">CFOP</th><th class="p-2 text-right">Qtd</th><th class="p-2 text-right">Unit.</th><th class="p-2 text-right">Total</th></tr></thead>
      <tbody>${note.itens.map((item) => `<tr class="border-t border-slate-100"><td class="p-2">${esc(item.n)}</td><td class="p-2">${esc(item.desc)}</td><td class="p-2">${esc(item.ncm)}</td><td class="p-2">${esc(item.cfop)}</td><td class="p-2 text-right">${item.q.toLocaleString('pt-BR')}</td><td class="p-2 text-right">${brl(item.vu)}</td><td class="p-2 text-right font-semibold">${brl(item.v)}</td></tr>`).join('')}</tbody>
    </table></div>`);
}

function exportNF() {
  const filteredNotes = nfFiltered();
  const head = ['Modelo', 'Número NF', 'Série', 'Data/Hora Emissão', 'Chave de Acesso', 'Emitente - Razão Social', 'Emitente - CNPJ/CPF', 'Destinatário - Razão Social', 'Destinatário - CNPJ/CPF', 'Valor Produtos (vProd)', 'Valor Total NF (vNF)', 'ICMS (vICMS)', 'PIS (vPIS)', 'COFINS (vCOFINS)', 'Arquivo'];
  const rows = filteredNotes.map((note) => [note.mod === '65' ? '65 - NFC-e' : '55 - NF-e', note.nNF, note.serie, fmtDateTime(note.emissao), note.chave, note.emit.nome, fmtDoc(note.emit.doc), note.dest.nome, fmtDoc(note.dest.doc), n2(note.vProd), n2(note.vNF), n2(note.vICMS), n2(note.vPIS), n2(note.vCOFINS), note.arquivo]);
  const totals = filteredNotes.reduce((accumulator, note) => ({
    vProd: accumulator.vProd + note.vProd,
    vNF: accumulator.vNF + note.vNF,
    vICMS: accumulator.vICMS + note.vICMS,
    vPIS: accumulator.vPIS + note.vPIS,
    vCOFINS: accumulator.vCOFINS + note.vCOFINS
  }), { vProd: 0, vNF: 0, vICMS: 0, vPIS: 0, vCOFINS: 0 });

  rows.push([], ['TOTAL (filtrados)', `${filteredNotes.length} notas`, '', '', '', '', '', '', '', n2(totals.vProd), n2(totals.vNF), n2(totals.vICMS), n2(totals.vPIS), n2(totals.vCOFINS), '']);
  downloadCSV([head, ...rows], `consolidado_nfe_${stamp()}.csv`);
  toast('Planilha exportada.', 'ok');
}

function exportNFXLSX() {
  const button = $('#xml-xlsx');
  const previousLabel = button.textContent;
  button.disabled = true;
  button.textContent = 'Carregando exportador…';

  loadSheetJS().then((XLSX) => {
    const notes = nfFiltered();
    const noteRows = [
      ['Modelo', 'Número NF', 'Série', 'Emissão', 'Chave', 'Chave válida', 'cStat', 'Emitente', 'CNPJ/CPF emitente', 'Destinatário', 'CNPJ/CPF destinatário', 'vProd', 'vNF', 'ICMS', 'PIS', 'COFINS', 'Arquivo'],
      ...notes.map((note) => [note.mod, note.nNF, note.serie, note.emissao, note.chave, note.chaveValid ? 'Sim' : 'Não', note.cStat, note.emit.nome, note.emit.doc, note.dest.nome, note.dest.doc, note.vProd, note.vNF, note.vICMS, note.vPIS, note.vCOFINS, note.arquivo])
    ];
    const itemRows = [
      ['Modelo', 'Número NF', 'Série', 'Emissão', 'Chave', 'Emitente', 'NCM', 'CFOP', 'Código', 'Produto', 'Unidade', 'Quantidade', 'Valor unitário', 'Total do item'],
      ...notes.flatMap((note) => note.itens.map((item) => [note.mod, note.nNF, note.serie, note.emissao, note.chave, note.emit.nome, item.ncm, item.cfop, item.cod, item.desc, item.un, item.q, item.vu, item.v]))
    ];
    const summaryRows = [['Grupo', 'Referência', 'Notas', 'Itens', 'Total de produtos', 'Total da NF por grupo (não rateado por CFOP)']];
    const appendSummary = (label, getKeys, byCFOP = false) => {
      const groups = new Map();
      notes.forEach((note) => {
        const keys = [...new Set(getKeys(note).filter(Boolean))];
        keys.forEach((key) => {
          const items = byCFOP ? note.itens.filter((item) => item.cfop === key) : note.itens;
          const group = groups.get(key) || { notes: new Set(), items: 0, vProd: 0, vNF: 0 };
          group.notes.add(note.chave || note.arquivo);
          group.items += items.length;
          group.vProd += byCFOP ? items.reduce((total, item) => total + item.v, 0) : note.vProd;
          if (!byCFOP) group.vNF += note.vNF;
          groups.set(key, group);
        });
      });
      groups.forEach((group, key) => summaryRows.push([label, key, group.notes.size, group.items, r2(group.vProd), byCFOP ? '' : r2(group.vNF)]));
    };
    appendSummary('CFOP', (note) => note.itens.map((item) => item.cfop), true);
    appendSummary('Emitente', (note) => [note.emit.nome]);
    appendSummary('Mês', (note) => [(parseDateAny(note.emissao) || '').slice(0, 7)]);

    const workbook = XLSX.utils.book_new();
    [['Notas', noteRows], ['Itens', itemRows], ['Resumo', summaryRows]].forEach(([name, rows]) => {
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), name);
    });
    XLSX.writeFile(workbook, `consolidado_nfe_${stamp()}.xlsx`);
    toast('XLSX com as abas Notas, Itens e Resumo exportado.', 'ok');
  }).catch((error) => toast(error.message, 'err')).finally(() => {
    button.disabled = !NF.notas.length;
    button.textContent = previousLabel;
  });
}

function initXmlModule() {
  bindDrop($('#xml-drop'), $('#xml-input'), handleXmlFiles);
  $('#xml-demo').addEventListener('click', () => {
    addNotas(DEMO_NFES.map((data) => ({ name: `demo_${data.mod}_${data.nNF}.xml`, text: buildDemoXML(data) })));
  });
  $('#xml-clear').addEventListener('click', () => { NF.notas = []; showMsgs('#xml-msgs', []); renderNF(); });
  $('#xml-export').addEventListener('click', exportNF);
  $('#xml-xlsx').addEventListener('click', exportNFXLSX);
  $('#xml-search').addEventListener('input', (event) => { NF.q = event.target.value; NF.page = 1; renderNF(); });
  $('#xml-size').addEventListener('change', (event) => { NF.size = +event.target.value; NF.page = 1; renderNF(); });
  $('#xml-filter-model').addEventListener('change', (event) => { NF.model = event.target.value; NF.page = 1; renderNF(); });
  $('#xml-filter-start').addEventListener('change', (event) => { NF.start = event.target.value; NF.page = 1; renderNF(); });
  $('#xml-filter-end').addEventListener('change', (event) => { NF.end = event.target.value; NF.page = 1; renderNF(); });
  $('#xml-filter-cfop').addEventListener('change', (event) => { NF.cfop = event.target.value; NF.page = 1; renderNF(); });
  renderNF();
}

export { initXmlModule, buildDemoXML, parseNFe, calcDV, NF, renderNF, showNFModal };
