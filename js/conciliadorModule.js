import { $, esc, brl, fmtISODate, parseMoney, parseDateAny, readFileText, toast, showMsgs, bindDrop, kpi, r2, stamp, downloadCSV, n2, norm, splitCSV } from './utils.js';

const CB = { bank: [], ledger: [], rows: [], filter: 'all', seq: 1 };
const STATUS = {
  ok: { label: 'Conciliado', cls: 'bg-emerald-100 text-emerald-800', order: 0 },
  div: { label: 'Divergência de Valor', cls: 'bg-amber-100 text-amber-800', order: 1 },
  pb: { label: 'Pendência Bancária', cls: 'bg-rose-100 text-rose-800', order: 2 },
  pi: { label: 'Pendência Interna', cls: 'bg-violet-100 text-violet-800', order: 3 }
};

const STOP = new Set(['PIX', 'TED', 'DOC', 'PAGTO', 'PAGAMENTO', 'PGTO', 'RECEBIMENTO', 'RECEBIDO', 'RECEBTO', 'COMPRA', 'DEBITO', 'CREDITO', 'TRANSF', 'TRANSFERENCIA', 'FORNECEDOR', 'CLIENTE', 'BOLETO', 'LTDA', 'EIRELI', 'EPP', 'CNPJ', 'CPF', 'COM', 'PARA', 'DEB', 'CRED', 'REF', 'NFE', 'DEPOSITO', 'ENVIADO', 'ENVIADA', 'EFETUADO']);

function tokens(value) {
  return [...new Set(norm(value).toUpperCase().replace(/[^A-Z0-9]+/g, ' ').split(' ').filter((token) => token.length >= 3 && !STOP.has(token) && !/^\d+$/.test(token)))];
}

function sim(a, b) {
  const left = tokens(a);
  const right = tokens(b);
  let count = 0;
  for (const item of left) {
    if (right.some((value) => item === value || (item.length >= 5 && value.length >= 5 && item.slice(0, 5) === value.slice(0, 5)))) count++;
  }
  return count;
}

function mkTx(date, description, amount, extra = {}) {
  const value = r2(amount);
  return { id: CB.seq++, date, desc: String(description || '').trim() || '(sem descrição)', amount: value, cents: Math.round(value * 100), ...extra };
}

function parseOFX(text) {
  const output = [];
  const getField = (content, tag) => {
    const match = new RegExp(`<${tag}>\\s*([^<\\r\\n]*)`, 'i').exec(content);
    return match ? match[1].trim() : '';
  };

  const pattern = /<STMTTRN>([\s\S]*?)(?=<\/STMTTRN>|<STMTTRN>|<\/BANKTRANLIST>|$)/gi;
  let match;
  while ((match = pattern.exec(text))) {
    const body = match[1];
    const date = parseDateAny(getField(body, 'DTPOSTED'));
    const raw = getField(body, 'TRNAMT');
    const amount = raw.includes(',') ? parseMoney(raw) : parseFloat(raw);
    if (!date || Number.isNaN(amount)) continue;
    const desc = [getField(body, 'NAME'), getField(body, 'MEMO')].filter(Boolean).join(' - ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>');
    output.push(mkTx(date, desc, amount, { fitid: getField(body, 'FITID') }));
  }
  return output;
}

function parseTxCSV(text) {
  const rows = splitCSV(text);
  if (!rows.length) return [];
  const headers = rows[0].map((header) => norm(header).toLowerCase().trim());
  const findIndex = (matcher) => headers.findIndex((header) => matcher.test(header));
  let dateIndex = findIndex(/^(data|date|dt)/);
  let textIndex = findIndex(/descri|hist|memo|lancamento|favorecido|nome/);
  let valueIndex = findIndex(/^(valor|amount|vlr|montante)/);
  const debitIndex = findIndex(/debito|saida/);
  const creditIndex = findIndex(/credito|entrada/);

  let start = 1;
  const hasHeader = dateIndex > -1 || valueIndex > -1 || debitIndex > -1 || creditIndex > -1;
  if (!hasHeader) {
    dateIndex = 0;
    textIndex = 1;
    valueIndex = 2;
    start = 0;
  } else {
    if (dateIndex < 0) dateIndex = 0;
    if (textIndex < 0) textIndex = 1;
  }

  const output = [];
  for (const row of rows.slice(start)) {
    const date = parseDateAny(row[dateIndex]);
    if (!date) continue;
    let value = NaN;
    if (valueIndex > -1) value = parseMoney(row[valueIndex]);
    if (Number.isNaN(value) && (debitIndex > -1 || creditIndex > -1)) {
      const debit = parseMoney(row[debitIndex] ?? '');
      const credit = parseMoney(row[creditIndex] ?? '');
      value = (Number.isNaN(credit) ? 0 : Math.abs(credit)) - (Number.isNaN(debit) ? 0 : Math.abs(debit));
    }
    if (Number.isNaN(value)) continue;
    output.push(mkTx(date, row[textIndex] || 'Lançamento', value));
  }

  return output;
}

async function loadTxFile(file, kind) {
  const text = await readFileText(file);
  let list = [];
  if (/\.ofx$/i.test(file.name) || /<OFX>|<STMTTRN>/i.test(text)) {
    list = parseOFX(text);
  } else {
    list = parseTxCSV(text);
  }

  if (!list.length) {
    showMsgs('#cb-msgs', [`${file.name}: nenhuma transação válida encontrada. Verifique o formato (OFX com STMTTRN ou CSV com data;descrição;valor).`], 'err');
    return;
  }

  showMsgs('#cb-msgs', []);
  if (kind === 'bank') CB.bank = list; else CB.ledger = list;
  CB.rows = [];
  renderCB();
  toast(`${list.length} lançamento(s) carregado(s).`, 'ok');
}

function suggestEntry(entry) {
  const description = norm(entry.desc).toUpperCase();
  if (/TARIFA|TAR\s|CESTA|PACOTE|MANUT/.test(description)) return 'Lançar tarifa: D – Despesas Bancárias / C – Banco c/ Movimento.';
  if (/IOF/.test(description)) return 'Lançar IOF: D – Despesas Financeiras (IOF) / C – Banco c/ Movimento.';
  if (/RENDIMENTO|REND |APLIC|JUROS|CDB/.test(description)) return 'Lançar rendimento: D – Banco c/ Movimento / C – Receitas Financeiras.';
  return entry.cents >= 0 ? 'Entrada sem lançamento no razão: identificar o cliente/origem e contabilizar.' : 'Saída sem lançamento no razão: identificar o favorecido e contabilizar.';
}

function reconcile(bank, ledger, options = {}) {
  const tol = options.tol ?? 3;
  const divDays = options.divDays ?? 10;
  const rows = [];
  const usedBank = new Set();
  const usedLedger = new Set();

  const assign = (candidates, status, descriptionFn) => {
    candidates.sort((a, b) => b.score - a.score);
    for (const candidate of candidates) {
      if (usedBank.has(candidate.bank.id) || usedLedger.has(candidate.ledger.id)) continue;
      usedBank.add(candidate.bank.id);
      usedLedger.add(candidate.ledger.id);
      rows.push({
        status,
        b: candidate.bank,
        l: candidate.ledger,
        diff: candidate.bank.cents - candidate.ledger.cents,
        obs: descriptionFn(candidate)
      });
    }
  };

  const exactMatches = [];
  for (const bankItem of bank) {
    for (const ledgerItem of ledger) {
      if (bankItem.cents !== ledgerItem.cents) continue;
      const diffDays = Math.abs(parseDateAny(bankItem.date) && parseDateAny(ledgerItem.date) ? new Date(`${bankItem.date}T00:00:00Z`).getTime() - new Date(`${ledgerItem.date}T00:00:00Z`).getTime() : 0) / 86400000;
      if (diffDays <= tol) exactMatches.push({ bank: bankItem, ledger: ledgerItem, score: sim(bankItem.desc, ledgerItem.desc) * 10 - diffDays });
    }
  }
  assign(exactMatches, 'ok', (candidate) => {
    const diffDays = Math.abs(new Date(`${candidate.bank.date}T00:00:00Z`).getTime() - new Date(`${candidate.ledger.date}T00:00:00Z`).getTime()) / 86400000;
    return diffDays ? `Valor exato; datas com ${diffDays} dia(s) de diferença.` : 'Valor e data exatos.';
  });

  const divergenceMatches = [];
  for (const bankItem of bank) {
    if (usedBank.has(bankItem.id)) continue;
    for (const ledgerItem of ledger) {
      if (usedLedger.has(ledgerItem.id) || Math.sign(bankItem.cents) !== Math.sign(ledgerItem.cents)) continue;
      const diffDays = Math.abs(new Date(`${bankItem.date}T00:00:00Z`).getTime() - new Date(`${ledgerItem.date}T00:00:00Z`).getTime()) / 86400000;
      const similarity = sim(bankItem.desc, ledgerItem.desc);
      const diff = Math.abs(bankItem.cents - ledgerItem.cents);
      const ratio = diff / Math.max(Math.abs(ledgerItem.cents), 1);
      if (diffDays <= divDays && ((similarity > 0 && ratio <= 0.25) || diff <= 100)) {
        divergenceMatches.push({ bank: bankItem, ledger: ledgerItem, score: similarity * 10 - diffDays - ratio * 10 });
      }
    }
  }
  assign(divergenceMatches, 'div', (candidate) => {
    const difference = (candidate.bank.cents - candidate.ledger.cents) / 100;
    const magnitude = Math.abs(difference);
    if (magnitude < 1) return 'Diferença de centavos (arredondamento/digitação).';
    return candidate.bank.cents > candidate.ledger.cents ? `Extrato maior que o razão: possível juros ou multa de ${brl(magnitude)}.` : `Extrato menor que o razão: possível desconto ou abatimento de ${brl(magnitude)}.`;
  });

  for (const bankItem of bank) {
    if (!usedBank.has(bankItem.id)) rows.push({ status: 'pb', b: bankItem, l: null, diff: bankItem.cents, obs: suggestEntry(bankItem) });
  }

  for (const ledgerItem of ledger) {
    if (!usedLedger.has(ledgerItem.id)) rows.push({ status: 'pi', b: null, l: ledgerItem, diff: -ledgerItem.cents, obs: 'Lançado no razão e ainda não compensado no extrato (cheque em trânsito, boleto a vencer ou lançamento indevido?).' });
  }

  rows.sort((a, b) => STATUS[a.status].order - STATUS[b.status].order || ((a.b || a.l).date).localeCompare((b.b || b.l).date));
  return rows;
}

function cbStats() {
  const rows = CB.rows;
  const byStatus = (status) => rows.filter((row) => row.status === status);
  const ok = byStatus('ok');
  const divergence = byStatus('div');
  const pendingBank = byStatus('pb');
  const pendingInternal = byStatus('pi');
  const bankTotal = CB.bank.reduce((total, item) => total + item.cents, 0) / 100;
  const ledgerTotal = CB.ledger.reduce((total, item) => total + item.cents, 0) / 100;
  const audited = ok.reduce((total, row) => total + Math.abs(row.b.cents), 0) / 100;
  const divergenceValue = divergence.reduce((total, row) => total + Math.abs(row.diff), 0) / 100;
  const pendingBankValue = pendingBank.reduce((total, row) => total + row.diff, 0) / 100;
  const pendingInternalValue = pendingInternal.reduce((total, row) => total + row.l.cents, 0) / 100;
  return { ok, divergence, pendingBank, pendingInternal, bankN: CB.bank.length, ledN: CB.ledger.length, pct: CB.bank.length ? (ok.length / CB.bank.length) * 100 : 0, audited, divergenceValue, pendingBankValue, pendingInternalValue, netBank: r2(bankTotal), netLedger: r2(ledgerTotal) };
}

function renderCB() {
  $('#cb-bank-count').textContent = CB.bank.length;
  $('#cb-led-count').textContent = CB.ledger.length;

  const renderList = (items, withDelete = false) => items.length ? items.map((item) => `
    <tr class="border-b border-slate-100">
      <td class="px-2 py-1 whitespace-nowrap text-slate-500">${fmtISODate(item.date)}</td>
      <td class="px-2 py-1">${esc(item.desc)}</td>
      <td class="px-2 py-1 text-right whitespace-nowrap font-semibold ${item.cents < 0 ? 'text-rose-600' : 'text-emerald-700'}">${brl(item.amount)}</td>
      ${withDelete ? `<td class="px-1"><button data-act="cb-del" data-id="${item.id}" class="text-slate-400 hover:text-rose-600" title="Remover">×</button></td>` : ''}
    </tr>
  `).join('') : '<tr><td class="p-3 text-center text-slate-400">vazio</td></tr>';

  $('#cb-bank-tbody').innerHTML = renderList(CB.bank);
  $('#cb-led-tbody').innerHTML = renderList(CB.ledger, true);

  const stats = cbStats();
  const hasData = CB.rows.length > 0;
  $('#cb-export').disabled = !hasData;

  if (!hasData) {
    $('#cb-kpis').innerHTML = '';
    $('#cb-bar').innerHTML = '';
    $('#cb-filters').innerHTML = '';
    $('#cb-tbody').innerHTML = '<tr><td colspan="9" class="px-4 py-10 text-center text-slate-500">Carregue o extrato e o razão (ou use a simulação) e clique em “Executar Conciliação”.</td></tr>';
    return;
  }

  $('#cb-kpis').innerHTML = [
    kpi('% Conciliado', `${stats.pct.toFixed(1).replace('.', ',')}%`, `${stats.ok.length} de ${stats.bankN} lançamentos do extrato`, stats.pct >= 80 ? 'emerald' : 'amber'),
    kpi('Valor Auditado', brl(stats.audited), 'volume conciliado (|entradas|+|saídas|)', 'indigo'),
    kpi('Divergências', `${stats.divergence.length} • ${brl(stats.divergenceValue)}`, 'soma das diferenças a ajustar', 'amber'),
    kpi('Pendências', `${stats.pendingBank.length + stats.pendingInternal.length}`, `Banco: ${stats.pendingBank.length} (${brl(stats.pendingBankValue)}) • Interna: ${stats.pendingInternal.length} (${brl(stats.pendingInternalValue)})`, 'rose')
  ].join('');

  const total = stats.ok.length + stats.divergence.length + stats.pendingBank.length + stats.pendingInternal.length || 1;
  const width = (count) => `${((count / total) * 100).toFixed(1)}%`;
  $('#cb-bar').innerHTML = `<div class="bg-white rounded-2xl border border-slate-200 p-4"><div class="flex h-3 rounded-full overflow-hidden bg-slate-100">
    <div class="bg-emerald-500" style="width:${width(stats.ok.length)}"></div>
    <div class="bg-amber-400" style="width:${width(stats.divergence.length)}"></div>
    <div class="bg-rose-500" style="width:${width(stats.pendingBank.length)}"></div>
    <div class="bg-violet-500" style="width:${width(stats.pendingInternal.length)}"></div>
  </div>
  <p class="text-xs text-slate-600 mt-2">Saldo líquido do extrato: <b>${brl(stats.netBank)}</b> • do razão: <b>${brl(stats.netLedger)}</b> • diferença: <b>${brl(r2(stats.netBank - stats.netLedger))}</b> (explicada por divergências e pendências abaixo).</p></div>`;

  const chip = (key, label, count) => `<button data-act="cb-filter" data-k="${key}" class="px-3 py-1.5 rounded-full text-xs font-semibold border ${CB.filter === key ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-300 hover:bg-slate-100'}">${label} (${count})</button>`;
  $('#cb-filters').innerHTML = [chip('all', 'Todos', CB.rows.length), ...Object.entries(STATUS).map(([key, value]) => chip(key, value.label, CB.rows.filter((row) => row.status === key).length))].join('');

  const visibleRows = CB.rows.filter((row) => CB.filter === 'all' || row.status === CB.filter);
  const valueCell = (entry) => entry ? `<td class="px-3 py-2 text-right whitespace-nowrap font-semibold ${entry.cents < 0 ? 'text-rose-600' : 'text-emerald-700'}">${brl(entry.amount)}</td>` : '<td class="px-3 py-2 text-right text-slate-300">—</td>';

  $('#cb-tbody').innerHTML = visibleRows.map((row) => `<tr class="hover:bg-slate-50 align-top">
    <td class="px-3 py-2"><span class="text-[11px] font-bold rounded-md px-2 py-0.5 whitespace-nowrap ${STATUS[row.status].cls}">${STATUS[row.status].label}</span></td>
    <td class="px-3 py-2 whitespace-nowrap">${row.b ? fmtISODate(row.b.date) : '—'}</td>
    <td class="px-3 py-2 min-w-[11rem]">${row.b ? esc(row.b.desc) : '<span class="text-slate-300">—</span>'}</td>
    ${valueCell(row.b)}
    <td class="px-3 py-2 whitespace-nowrap">${row.l ? fmtISODate(row.l.date) : '—'}</td>
    <td class="px-3 py-2 min-w-[11rem]">${row.l ? esc(row.l.desc) : '<span class="text-slate-300">—</span>'}</td>
    ${valueCell(row.l)}
    <td class="px-3 py-2 text-right whitespace-nowrap ${row.diff ? 'font-bold text-amber-700' : 'text-slate-400'}">${row.status === 'ok' ? '—' : brl(row.diff / 100)}</td>
    <td class="px-3 py-2 text-xs text-slate-600 min-w-[16rem]">${esc(row.obs)}</td>
  </tr>`).join('');
}

function runCB() {
  if (!CB.bank.length && !CB.ledger.length) {
    toast('Carregue extrato e razão primeiro.', 'warn');
    return;
  }

  const tol = Math.max(0, +$('#cb-tol').value || 0);
  const divDays = Math.max(1, +$('#cb-divdays').value || 10);
  CB.rows = reconcile(CB.bank, CB.ledger, { tol, divDays });
  CB.filter = 'all';
  renderCB();
  toast('Conciliação concluída.', 'ok');
}

function exportCB() {
  const stats = cbStats();
  const head = ['Status', 'Data Extrato', 'Descrição Extrato', 'Valor Extrato', 'Data Razão', 'Descrição Razão', 'Valor Razão', 'Diferença (Extrato − Razão)', 'Observação'];
  const rows = CB.rows.map((row) => [STATUS[row.status].label, row.b ? fmtISODate(row.b.date) : '', row.b ? row.b.desc : '', row.b ? n2(row.b.amount) : '', row.l ? fmtISODate(row.l.date) : '', row.l ? row.l.desc : '', row.l ? n2(row.l.amount) : '', row.status === 'ok' ? '0,00' : n2(row.diff / 100), row.obs]);
  rows.push([], ['RESUMO DA AUDITORIA'], ['% Conciliado', `${stats.pct.toFixed(1).replace('.', ',')}%`], ['Valor auditado', n2(stats.audited)], ['Conciliados', stats.ok.length], ['Divergências de valor', stats.divergence.length, 'Total a ajustar', n2(stats.divergenceValue)], ['Pendências bancárias', stats.pendingBank.length, 'Saldo', n2(stats.pendingBankValue)], ['Pendências internas', stats.pendingInternal.length, 'Saldo', n2(stats.pendingInternalValue)], ['Saldo líquido extrato', n2(stats.netBank)], ['Saldo líquido razão', n2(stats.netLedger)]);
  downloadCSV([head, ...rows], `auditoria_conciliacao_${stamp()}.csv`);
  toast('Relatório baixado.', 'ok');
}

function loadCBDemo() {
  CB.seq = 1;
  const create = (day, description, value) => mkTx(`2026-10-${day}`, description, value);
  CB.bank = [
    create('01', 'PIX RECEBIDO ALFA COMERCIO LTDA', 4500),
    create('02', 'TED FORNECEDOR BETA DISTRIBUIDORA', -2350.90),
    create('05', 'PAGTO BOLETO ENERGISA PB', -1287.45),
    create('06', 'PIX RECEBIDO GAMMA SERVICOS ME', 3200),
    create('07', 'TED FORNECEDOR DELTA MATERIAIS', -1815.37),
    create('08', 'PAGTO BOLETO IMOBILIARIA SOL ALUGUEL', -3075),
    create('09', 'TARIFA PACOTE SERVICOS PJ', -89.90),
    create('10', 'PIX RECEBIDO EPSILON TECNOLOGIA', 6780),
    create('12', 'RENDIMENTO APLICACAO CDB', 112.38),
    create('13', 'DARF PIS COFINS 09/2026', -1640.22),
    create('14', 'IOF OPERACAO CREDITO', -23.17),
    create('15', 'TED FORNECEDOR ZETA LOGISTICA', -980),
    create('16', 'PIX RECEBIDO THETA CONSULTORIA', 2150)
  ];

  CB.ledger = [
    create('01', 'Recebimento Alfa Comércio Ltda - NF 1458', 4500),
    create('02', 'Pgto Beta Distribuidora - NF 7712', -2350.90),
    create('04', 'Energia elétrica Energisa - out/26', -1287.45),
    create('06', 'Recebimento Gamma Serviços ME', 3200),
    create('07', 'Pgto Delta Materiais - NF 5531', -1815.00),
    create('08', 'Aluguel Imobiliária Sol - out/26', -3000),
    create('09', 'Recebimento Epsilon Tecnologia - NF 1459', 6780),
    create('13', 'DARF PIS/COFINS competência 09/2026', -1640.22),
    create('15', 'Pgto Zeta Logística - frete', -980),
    create('16', 'Recebimento Theta Consultoria', 2100),
    create('16', 'Pgto Iota Embalagens - cheque 000412', -1420),
    create('18', 'Recebimento Kappa Comércio - a compensar', 5300),
    create('19', 'Seguro Lambda Seguros - boleto', -640)
  ];

  showMsgs('#cb-msgs', []);
  runCB();
}

function initConciliadorModule() {
  bindDrop($('#cb-bank-drop'), $('#cb-bank-input'), (files) => files[0] && loadTxFile(files[0], 'bank'));
  bindDrop($('#cb-led-drop'), $('#cb-led-input'), (files) => files[0] && loadTxFile(files[0], 'ledger'));

  $('#cb-demo').addEventListener('click', loadCBDemo);
  $('#cb-run').addEventListener('click', runCB);
  $('#cb-export').addEventListener('click', exportCB);
  $('#cb-bank-clear').addEventListener('click', () => { CB.bank = []; CB.rows = []; renderCB(); });
  $('#cb-led-clear').addEventListener('click', () => { CB.ledger = []; CB.rows = []; renderCB(); });

  $('#cb-led-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const date = $('#cb-f-date').value;
    const value = parseMoney($('#cb-f-val').value.replace('-', ''));
    if (!date || Number.isNaN(value) || value === 0) {
      toast('Informe data e valor válidos.', 'warn');
      return;
    }
    CB.ledger.push(mkTx(date, $('#cb-f-desc').value, Math.abs(value) * +$('#cb-f-dir').value));
    $('#cb-f-desc').value = '';
    $('#cb-f-val').value = '';
    CB.rows = [];
    renderCB();
  });

  renderCB();
}

export { initConciliadorModule, CB, reconcile, loadTxFile, renderCB };
