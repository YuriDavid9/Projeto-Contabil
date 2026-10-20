export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
export const pad = (value) => String(value).padStart(2, '0');
export const r2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

export const brl = (value) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const n2 = (value) => Number(value || 0).toFixed(2).replace('.', ',');
export const stamp = () => {
  const d = new Date();
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
};

export function fmtISODate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return match ? `${match[3]}/${match[2]}/${match[1]}` : (iso || '—');
}

export function fmtDateTime(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(value || '');
  if (!match) return value || '—';
  return `${match[3]}/${match[2]}/${match[1]}` + (match[4] ? ` ${match[4]}:${match[5]}` : '');
}

export function fmtDoc(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 14) return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  if (digits.length === 11) return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  return value || '—';
}

export function fmtChave(value) { return String(value || '').replace(/(\d{4})(?=\d)/g, '$1 ').trim(); }

export function parseMoney(value) {
  if (typeof value === 'number') return value;
  let text = String(value ?? '').trim();
  if (!text) return NaN;
  const negative = /^\(.*\)$/.test(text) || /-/.test(text) || /\s[D]$/i.test(text);
  text = text.replace(/[^\d.,]/g, '');
  if (!text) return NaN;
  const lastComma = text.lastIndexOf(',');
  const lastDot = text.lastIndexOf('.');
  if (lastComma > -1 && lastDot > -1) {
    text = lastComma > lastDot ? text.replace(/\./g, '').replace(',', '.') : text.replace(/,/g, '');
  } else if (lastComma > -1) {
    text = text.replace(/,/g, '.');
  } else if (lastDot > -1 && /^\d{1,3}(\.\d{3})+$/.test(text)) {
    text = text.replace(/\./g, '');
  }
  const parsed = parseFloat(text);
  return Number.isNaN(parsed) ? NaN : (negative ? -parsed : parsed);
}

export function parseDateAny(value) {
  const text = String(value || '').trim();
  let match;
  if ((match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text))) return `${match[1]}-${match[2]}-${match[3]}`;
  if ((match = /^(\d{2})[\/.-](\d{2})[\/.-](\d{4})/.exec(text))) return `${match[3]}-${match[2]}-${match[1]}`;
  if ((match = /^(\d{2})[\/.-](\d{2})[\/.-](\d{2})$/.exec(text))) return `20${match[3]}-${match[2]}-${match[1]}`;
  if ((match = /^(\d{4})(\d{2})(\d{2})/.exec(text))) return `${match[1]}-${match[2]}-${match[3]}`;
  return null;
}

export function readFileText(file) {
  return file.arrayBuffer().then((buffer) => {
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(buffer).replace(/^\uFEFF/, '');
    } catch {
      return new TextDecoder('windows-1252').decode(buffer).replace(/^\uFEFF/, '');
    }
  });
}

export function toast(message, type = 'info') {
  const colors = { info: 'bg-slate-800', ok: 'bg-emerald-600', err: 'bg-rose-600', warn: 'bg-amber-600' };
  const container = $('#toasts');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `${colors[type] || colors.info} text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg fade-in max-w-sm`; 
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

export function showMsgs(selector, items, kind = 'warn') {
  const box = $(selector);
  if (!box) return;
  if (!items.length) {
    box.innerHTML = '';
    return;
  }
  const cls = kind === 'err' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-amber-50 border-amber-200 text-amber-800';
  box.innerHTML = `<div class="${cls} border rounded-xl px-4 py-3 text-sm"><ul class="list-disc ml-5 space-y-0.5">${items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></div>`;
}

export function bindDrop(zone, input, onFiles) {
  if (!zone || !input) return;
  ['dragenter', 'dragover'].forEach((eventName) => {
    zone.addEventListener(eventName, (event) => {
      event.preventDefault();
      zone.classList.add('drag-over');
    });
  });
  ['dragleave', 'drop'].forEach((eventName) => {
    zone.addEventListener(eventName, (event) => {
      event.preventDefault();
      zone.classList.remove('drag-over');
    });
  });
  zone.addEventListener('drop', (event) => onFiles([...event.dataTransfer.files]));
  input.addEventListener('change', () => {
    if (input.files) onFiles([...input.files]);
    input.value = '';
  });
}

export function kpi(label, value, sub, tone = 'indigo') {
  const tones = {
    indigo: 'text-indigo-700 bg-indigo-50',
    emerald: 'text-emerald-700 bg-emerald-50',
    amber: 'text-amber-700 bg-amber-50',
    rose: 'text-rose-700 bg-rose-50',
    slate: 'text-slate-700 bg-slate-100'
  };
  return `<div class="bg-white rounded-2xl border border-slate-200 p-4">
    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${esc(label)}</p>
    <p class="text-2xl font-extrabold mt-1 text-slate-900">${esc(value)}</p>
    <p class="text-xs mt-1 inline-block rounded-md px-1.5 py-0.5 font-medium ${tones[tone] || tones.indigo}">${esc(sub)}</p>
  </div>`;
}

export function isoToUTC(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

export function dayDiff(a, b) {
  return Math.abs(isoToUTC(a) - isoToUTC(b)) / 864e5;
}

export function norm(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function csvCell(value) {
  if (value === null || value === undefined) return '';
  let text = String(value);
  if (/^[=+@\t\r]/.test(text) || (/-/.test(text) && !/^-?[\d.,]+$/.test(text))) text = `'${text}`;
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCSV(rows) {
  return '\uFEFF' + rows.map((row) => row.map(csvCell).join(';')).join('\r\n');
}

export function downloadCSV(rows, name) {
  const blob = new Blob([toCSV(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function xmlEsc(value) {
  return String(value).replace(/[<>&"']/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[char]));
}

export function splitCSV(text) {
  const rows = [];
  let row = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ';' || char === ',' || char === '\t') {
      row.push(current);
      current = '';
      continue;
    }

    if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(current);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      current = '';
      continue;
    }

    current += char;
  }

  row.push(current);
  if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
}
