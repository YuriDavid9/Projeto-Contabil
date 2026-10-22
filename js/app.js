import { $, $$ } from './utils.js';
import { initXmlModule, NF, renderNF, showNFModal } from './xmlModule.js';
import { initConciliadorModule, CB, renderCB } from './conciliadorModule.js';
import { initOrganizadorModule, OG, renderOG } from './organizadorModule.js';
import { initContactModule } from './contactModule.js';
import { initUtilitiesModule } from './utilitiesModule.js';
import { getModo, setModo, modoSalvo } from './modo.js';

const TAB_METADATA = {
  inicio: ['Início', 'Escolha uma tarefa para consultar documentos, comparar movimentos ou organizar arquivos.'],
  xml: ['Extrator de XML', 'Extraia e consolide dados de NF-e e NFC-e localmente no navegador.'],
  conciliador: ['Conciliador Bancário', 'Compare OFX e CSV com o razão contábil no navegador.'],
  organizador: ['Organizador Fiscal', 'Padronize nomes e organize documentos fiscais localmente.'],
  contato: ['Contato', 'Entre em contato com o desenvolvedor do AutoContábil Hub.'],
  utilitarios: ['Utilitários', 'Valide documentos, converta extratos e estime encargos tributários.']
};

function updatePageMetadata(tabName) {
  const [label, description] = TAB_METADATA[tabName];
  const title = `AutoContábil Hub | ${label}`;
  document.title = title;
  $('#meta-description')?.setAttribute('content', description);
  $('#og-title')?.setAttribute('content', title);
  $('#og-description')?.setAttribute('content', description);
  $('#twitter-title')?.setAttribute('content', title);
  $('#twitter-description')?.setAttribute('content', description);
}

function openTab(name) {
  const allowed = getModo() === 'guiado' ? ['xml', 'conciliador', 'organizador'] : ['xml', 'conciliador', 'organizador', 'contato', 'utilitarios'];
  const tabName = name === 'inicio' && getModo() === 'guiado' ? 'inicio' : (allowed.includes(name) ? name : 'xml');
  $$('.tab-btn').forEach((button) => {
    const selected = button.dataset.tab === tabName;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  $$('.tab-panel').forEach((panel) => {
    const selected = panel.id === `panel-${tabName}`;
    panel.hidden = !selected;
    panel.classList.toggle('hidden', !selected);
  });
  updatePageMetadata(tabName);
  if (location.hash !== `#${tabName}`) history.replaceState(null, '', `#${tabName}`);
}

function showModePrompt() {
  const overlay = $('#modo-overlay');
  overlay.hidden = false;
  $('#modo-guiado').focus();
}

function chooseMode(value) {
  setModo(value);
  $('#modo-overlay').hidden = true;
  $('#modo-toggle').textContent = `Modo: ${value === 'guiado' ? 'Guiado' : 'Completo'} ⇄ ${value === 'guiado' ? 'Completo' : 'Guiado'}`;
  if (value === 'guiado') openTab('inicio');
  else openTab(location.hash.slice(1) || 'xml');
  renderNF();
  renderCB();
  renderOG();
}

const modal = {
  open(title, html) {
    const titleEl = $('#modal-title');
    const bodyEl = $('#modal-body');
    if (!titleEl || !bodyEl) return;
    titleEl.textContent = title;
    bodyEl.innerHTML = html;
    const modalEl = $('#modal');
    if (modalEl) {
      modalEl.classList.remove('hidden');
      modalEl.setAttribute('aria-hidden', 'false');
    }
  },
  close() {
    const modalEl = $('#modal');
    if (modalEl) {
      modalEl.classList.add('hidden');
      modalEl.setAttribute('aria-hidden', 'true');
    }
  }
};

window.modal = modal;

const modalButton = $('#modal-close');
if (modalButton) modalButton.addEventListener('click', modal.close);
const modalEl = $('#modal');
if (modalEl) modalEl.addEventListener('click', (event) => { if (event.target.id === 'modal') modal.close(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') modal.close(); });

$('#modo-guiado').addEventListener('click', () => chooseMode('guiado'));
$('#modo-completo').addEventListener('click', () => chooseMode('completo'));
$('#modo-fechar').addEventListener('click', () => chooseMode('guiado'));
$('#modo-toggle').addEventListener('click', () => chooseMode(getModo() === 'guiado' ? 'completo' : 'guiado'));
$('#modo-overlay').addEventListener('click', (event) => { if (event.target.id === 'modo-overlay') chooseMode('guiado'); });
document.addEventListener('keydown', (event) => {
  const overlay = $('#modo-overlay');
  if (overlay.hidden) return;
  if (event.key === 'Escape') chooseMode('guiado');
  if (event.key === 'Tab') {
    const choices = [$('#modo-guiado'), $('#modo-completo'), $('#modo-fechar')];
    const first = choices[0];
    const last = choices[choices.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
document.querySelectorAll('[data-go]').forEach((button) => button.addEventListener('click', () => openTab(button.dataset.go)));

const selectedMode = modoSalvo();
if (selectedMode) {
  setModo(selectedMode, false);
  $('#modo-toggle').textContent = `Modo: ${selectedMode === 'guiado' ? 'Guiado' : 'Completo'} ⇄ ${selectedMode === 'guiado' ? 'Completo' : 'Guiado'}`;
} else showModePrompt();

$$('.tab-btn').forEach((button) => button.addEventListener('click', () => openTab(button.dataset.tab)));
const tabList = $('[role="tablist"]');
if (tabList) tabList.addEventListener('keydown', (event) => {
  const tabs = $$('.tab-btn').filter((button) => getModo() === 'guiado' ? !button.classList.contains('so-completo') : !button.classList.contains('so-guiado'));
  const currentIndex = tabs.indexOf(document.activeElement);
  if (currentIndex < 0) return;

  let nextIndex;
  if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
  else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  else if (event.key === 'Home') nextIndex = 0;
  else if (event.key === 'End') nextIndex = tabs.length - 1;
  else return;

  event.preventDefault();
  tabs[nextIndex].focus();
  openTab(tabs[nextIndex].dataset.tab);
});
window.addEventListener('hashchange', () => openTab(location.hash.slice(1)));

document.addEventListener('click', (event) => {
  const actionTarget = event.target.closest('[data-act]');
  if (!actionTarget) return;

  const { act } = actionTarget.dataset;

  switch (act) {
    case 'xml-view':
      showNFModal(actionTarget.dataset.key);
      break;
    case 'xml-page':
      NF.page = +actionTarget.dataset.p;
      renderNF();
      break;
    case 'copy':
      navigator.clipboard?.writeText(actionTarget.dataset.v).then(() => console.log('copiado'), () => console.log('falha ao copiar'));
      break;
    case 'cb-filter':
      CB.filter = actionTarget.dataset.k;
      renderCB();
      break;
    case 'cb-del':
      CB.ledger = CB.ledger.filter((item) => item.id !== +actionTarget.dataset.id);
      CB.rows = [];
      renderCB();
      break;
    case 'og-del':
      OG.docs = OG.docs.filter((item) => item.id !== +actionTarget.dataset.id);
      renderOG();
      break;
    default:
      break;
  }
});

initXmlModule();
initConciliadorModule();
initOrganizadorModule();
initContactModule();
initUtilitiesModule();
openTab(selectedMode === 'completo' ? (location.hash.slice(1) || 'xml') : (location.hash.slice(1) || 'inicio'));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (location.protocol === 'https:') {
      navigator.serviceWorker.register('./sw.js').catch((error) => console.warn('Service worker indisponível:', error.message));
      return;
    }
    const scope = new URL('./', location.href).href;
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.filter((registration) => registration.scope === scope).map((registration) => registration.unregister())))
      .catch((error) => console.warn('Não foi possível remover o service worker local antigo:', error.message));
  });
}
