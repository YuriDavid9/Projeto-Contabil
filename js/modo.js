import { GLOSSARIO } from './glossario.js';

const STORAGE_KEY = 'ach_modo';
let modo = 'guiado';

function getModo() { return modo; }

function t(chave) {
  return GLOSSARIO[chave]?.[modo] ?? chave;
}

function setModo(novoModo, persistir = true) {
  modo = novoModo === 'completo' ? 'completo' : 'guiado';
  document.body.dataset.modo = modo;
  document.querySelectorAll('[data-t]').forEach((element) => {
    const valor = t(element.dataset.t);
    if (valor !== element.dataset.t) element.textContent = valor;
  });
  document.dispatchEvent(new CustomEvent('modo:alterado', { detail: { modo } }));
  if (persistir) {
    try { localStorage.setItem(STORAGE_KEY, modo); } catch { /* Storage indisponível: a interface continua funcionando. */ }
  }
  return modo;
}

function modoSalvo() {
  try {
    const valor = localStorage.getItem(STORAGE_KEY);
    return valor === 'completo' || valor === 'guiado' ? valor : null;
  } catch { return null; }
}

export { getModo, setModo, t, modoSalvo };
