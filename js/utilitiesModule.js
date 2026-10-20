import { $, brl, readFileText, toast, showMsgs, downloadCSV, loadSheetJS, norm, n2, normalizeCNPJ } from './utils.js';
import { parseOFX, parseTxCSV } from './conciliadorModule.js';
import { calcDV } from './xmlModule.js';

let ofxTransactions = [];
let mergedTransactions = [];

function setMessage(selector, message, kind = 'ok') {
  const box = $(selector);
  if (!box) return;
  if (kind === 'err' || kind === 'warn') {
    showMsgs(selector, [message], kind);
  } else {
    box.textContent = message;
    toast(message, 'ok');
  }
}

function validCPF(value) {
  const digits = String(value).replace(/\D/g, '');
  if (!/^\d{11}$/.test(digits) || /^([0-9])\1{10}$/.test(digits)) return false;
  const digit = (base, weight) => {
    const sum = [...base].reduce((total, number, index) => total + Number(number) * (weight - index), 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return digit(digits.slice(0, 9), 10) === Number(digits[9]) && digit(digits.slice(0, 10), 11) === Number(digits[10]);
}

function validCNPJ(value) {
  const digits = normalizeCNPJ(value);
  if (!/^[0-9A-Z]{12}\d{2}$/.test(digits) || /^([0-9A-Z])\1{13}$/.test(digits)) return false;
  const digit = (base, weights) => {
    const sum = [...base].reduce((total, character, index) => total + (character.charCodeAt(0) - 48) * weights[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  const first = digit(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = digit(digits.slice(0, 12) + first, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return first === Number(digits[12]) && second === Number(digits[13]);
}

function validAccessKey(value) {
  const key = String(value).replace(/[^0-9A-Za-z]/g, '').toUpperCase();
  return /^[0-9A-Z]{44}$/i.test(key) && Number(key[43]) === calcDV(key.slice(0, 43));
}

function txRows(transactions) {
  return [['Data', 'Descrição', 'Valor'], ...transactions.map((item) => [item.date, item.desc, n2(item.amount)])];
}

async function exportTransactionsXLSX(transactions, name) {
  const XLSX = await loadSheetJS();
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(txRows(transactions)), 'Transações');
  XLSX.writeFile(workbook, name);
}

function transactionKey(item) {
  return `${item.date}|${item.cents ?? Math.round(item.amount * 100)}|${norm(item.desc).toUpperCase().replace(/\s+/g, ' ').trim()}`;
}

function initUtilitiesModule() {
  const root = $('#utilities-root');
  if (!root) return;
  root.innerHTML = `
    <div class="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">Estas ferramentas rodam localmente no navegador; nenhum arquivo de extrato é enviado a servidores.</div>
    <div class="grid gap-4 xl:grid-cols-2">
      <section class="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 class="text-lg font-bold text-slate-900">Validador de documentos</h3>
        <form id="util-doc-form" class="mt-4 space-y-3">
          <label class="block text-sm font-medium text-slate-700">Tipo de documento
            <select id="util-doc-type" class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"><option value="cnpj">CNPJ</option><option value="cpf">CPF</option><option value="chave">Chave de NF-e (44 dígitos)</option></select>
          </label>
          <label class="block text-sm font-medium text-slate-700">Número
            <input id="util-doc-value" type="text" inputmode="text" autocomplete="off" class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" required>
          </label>
          <button class="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Validar</button>
        </form>
        <div id="util-doc-message" class="mt-3" aria-live="polite"></div>
      </section>
      <section class="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 class="text-lg font-bold text-slate-900">Converter OFX</h3>
        <p class="mt-1 text-sm text-slate-500">Carregue um arquivo OFX para exportar as transações em CSV ou XLSX.</p>
        <label class="mt-4 block text-sm font-medium text-slate-700">Arquivo OFX
          <input id="util-ofx-file" type="file" accept=".ofx,application/x-ofx" class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm">
        </label>
        <div class="mt-3 flex flex-wrap gap-2"><button id="util-ofx-csv" class="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white" disabled>Baixar CSV</button><button id="util-ofx-xlsx" class="rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white" disabled>Baixar XLSX</button></div>
        <div id="util-ofx-message" class="mt-3" aria-live="polite"></div>
      </section>
      <section class="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 class="text-lg font-bold text-slate-900">Mesclar extratos</h3>
        <p class="mt-1 text-sm text-slate-500">Junta arquivos OFX/CSV, ordena por data e remove duplicados por data, valor e descrição.</p>
        <label class="mt-4 block text-sm font-medium text-slate-700">Arquivos OFX ou CSV
          <input id="util-merge-files" type="file" accept=".ofx,.csv,application/x-ofx,text/csv" multiple class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm">
        </label>
        <div class="mt-3 flex flex-wrap gap-2"><button id="util-merge-csv" class="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white" disabled>Baixar CSV mesclado</button><button id="util-merge-xlsx" class="rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white" disabled>Baixar XLSX</button></div>
        <div id="util-merge-message" class="mt-3" aria-live="polite"></div>
      </section>
      <section class="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 class="text-lg font-bold text-slate-900">Multa e juros de tributos federais</h3>
        <p class="mt-1 text-sm text-slate-500">Estimativa: multa de mora de 0,33% ao dia, limitada a 20%, mais Selic acumulada e juros do mês do pagamento.</p>
        <form id="util-tax-form" class="mt-4 space-y-3">
          <label class="block text-sm font-medium text-slate-700">Valor principal (R$)
            <input id="util-tax-principal" type="number" min="0.01" step="0.01" required class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm">
          </label>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="block text-sm font-medium text-slate-700">Dias em atraso
              <input id="util-tax-days" type="number" min="0" step="1" required class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm">
            </label>
            <label class="block text-sm font-medium text-slate-700">Selic acumulada (%)
              <input id="util-tax-selic" type="number" min="0" step="0.01" required class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm">
            </label>
            <label class="block text-sm font-medium text-slate-700">Juros do mês do pagamento (%)
              <input id="util-tax-month-interest" type="number" min="0" step="0.01" value="1.00" required class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm">
            </label>
          </div>
          <p class="text-xs text-amber-800">Informe a Selic acumulada do mês seguinte ao vencimento até o mês anterior ao pagamento. O mês do pagamento usa 1,00% por padrão. Confira os valores e a regra aplicável no Sicalc antes de pagar.</p>
          <button class="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Calcular</button>
        </form>
        <div id="util-tax-message" class="mt-3" aria-live="polite"></div>
      </section>
    </div>`;

  $('#util-doc-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const value = $('#util-doc-value').value.trim();
    const type = $('#util-doc-type').value;
    const valid = type === 'cnpj' ? validCNPJ(value) : type === 'cpf' ? validCPF(value) : validAccessKey(value);
    setMessage('#util-doc-message', valid ? 'Documento válido.' : 'Documento inválido. Confira os dígitos e o dígito verificador.', valid ? 'ok' : 'err');
  });

  $('#util-ofx-file').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    ofxTransactions = [];
    $('#util-ofx-csv').disabled = true;
    $('#util-ofx-xlsx').disabled = true;
    if (!file) return;
    try {
      ofxTransactions = parseOFX(await readFileText(file));
      if (!ofxTransactions.length) throw new Error('Nenhuma transação OFX válida encontrada.');
      $('#util-ofx-csv').disabled = false;
      $('#util-ofx-xlsx').disabled = false;
      setMessage('#util-ofx-message', `${ofxTransactions.length} transações carregadas.`, 'ok');
    } catch (error) {
      setMessage('#util-ofx-message', error.message, 'err');
    }
  });
  $('#util-ofx-csv').addEventListener('click', () => downloadCSV(txRows(ofxTransactions), 'transacoes_ofx.csv'));
  $('#util-ofx-xlsx').addEventListener('click', () => exportTransactionsXLSX(ofxTransactions, 'transacoes_ofx.xlsx').catch((error) => setMessage('#util-ofx-message', error.message, 'err')));

  $('#util-merge-files').addEventListener('change', async (event) => {
    const files = [...(event.target.files || [])];
    mergedTransactions = [];
    $('#util-merge-csv').disabled = true;
    $('#util-merge-xlsx').disabled = true;
    try {
      const parsed = [];
      for (const file of files) {
        const text = await readFileText(file);
        parsed.push(...(/\.ofx$/i.test(file.name) || /<OFX>|<STMTTRN>/i.test(text) ? parseOFX(text) : parseTxCSV(text)));
      }
      const unique = new Map(parsed.map((item) => [transactionKey(item), item]));
      mergedTransactions = [...unique.values()].sort((left, right) => left.date.localeCompare(right.date));
      if (!mergedTransactions.length) throw new Error('Nenhuma transação válida foi encontrada nos arquivos.');
      $('#util-merge-csv').disabled = false;
      $('#util-merge-xlsx').disabled = false;
      setMessage('#util-merge-message', `${mergedTransactions.length} transações únicas de ${files.length} arquivo(s).`, 'ok');
    } catch (error) {
      setMessage('#util-merge-message', error.message, 'err');
    }
  });
  $('#util-merge-csv').addEventListener('click', () => downloadCSV(txRows(mergedTransactions), 'extratos_mesclados.csv'));
  $('#util-merge-xlsx').addEventListener('click', () => exportTransactionsXLSX(mergedTransactions, 'extratos_mesclados.xlsx').catch((error) => setMessage('#util-merge-message', error.message, 'err')));

  $('#util-tax-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const principal = Number($('#util-tax-principal').value);
    const days = Number($('#util-tax-days').value);
    const selic = Number($('#util-tax-selic').value);
    const paymentMonthInterest = Number($('#util-tax-month-interest').value);
    if (!(principal > 0) || !Number.isInteger(days) || days < 0 || !Number.isFinite(selic) || selic < 0 || !Number.isFinite(paymentMonthInterest) || paymentMonthInterest < 0) {
      setMessage('#util-tax-message', 'Informe principal positivo, dias inteiros não negativos, Selic acumulada e juros do mês válidos.', 'err');
      return;
    }
    const fineRate = Math.min(days * 0.0033, 0.2);
    const fine = principal * fineRate;
    const interestRate = selic + paymentMonthInterest;
    const interest = principal * (interestRate / 100);
    const total = principal + fine + interest;
    setMessage('#util-tax-message', `Estimativa — principal: ${brl(principal)} • multa (${(fineRate * 100).toFixed(2).replace('.', ',')}%): ${brl(fine)} • juros (Selic ${selic.toFixed(2).replace('.', ',')}% + mês do pagamento ${paymentMonthInterest.toFixed(2).replace('.', ',')}%): ${brl(interest)} • total estimado: ${brl(total)}. Confira no Sicalc.`, 'ok');
  });
}

export { initUtilitiesModule, validCPF, validCNPJ, validAccessKey, transactionKey };
