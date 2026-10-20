import { $, $$ } from './utils.js';
import { initXmlModule, NF, renderNF, showNFModal } from './xmlModule.js';
import { initConciliadorModule, CB, renderCB } from './conciliadorModule.js';
import { initOrganizadorModule, OG, renderOG } from './organizadorModule.js';

function openTab(name) {
  const tabName = ['xml', 'conciliador', 'organizador'].includes(name) ? name : 'xml';
  $$('.tab-btn').forEach((button) => {
    const selected = button.dataset.tab === tabName;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  $$('.tab-panel').forEach((panel) => panel.classList.toggle('hidden', panel.id !== `panel-${tabName}`));
  if (location.hash !== `#${tabName}`) history.replaceState(null, '', `#${tabName}`);
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

$$('.tab-btn').forEach((button) => button.addEventListener('click', () => openTab(button.dataset.tab)));
const tabList = $('[role="tablist"]');
if (tabList) tabList.addEventListener('keydown', (event) => {
  const tabs = $$('.tab-btn');
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
openTab(location.hash.slice(1) || 'xml');
