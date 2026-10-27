import { $, $$, esc, norm } from './utils.js';
import { initXmlModule, NF, renderNF, showNFModal } from './xmlModule.js';
import { initConciliadorModule, CB, renderCB } from './conciliadorModule.js';
import { initOrganizadorModule, OG, renderOG } from './organizadorModule.js';
import { initContactModule } from './contactModule.js';
import { initUtilitiesModule } from './utilitiesModule.js';
import { CATALOGO_FERRAMENTAS, AREAS_FERRAMENTAS } from './ferramentas/catalogo.js';
import { getModo, setModo, modoSalvo } from './modo.js';
import { ajuda } from './ajuda.js';
import { AJUDA_GUIADO, TERMOS_GUIADOS } from './glossario.js';

const TAB_METADATA = {
  catalogo: ['Catálogo de Ferramentas', 'Catálogo de ferramentas contábeis, fiscais e financeiras gratuitas com processamento 100% local no navegador.'],
  xml: ['Extrator de XML', 'Extraia e consolide dados de NF-e e NFC-e localmente no navegador.'],
  conciliador: ['Conciliador Bancário', 'Compare OFX e CSV com o razão contábil no navegador.'],
  organizador: ['Organizador Fiscal', 'Padronize nomes e organize documentos fiscais localmente.'],
  contato: ['Contato', 'Entre em contato com o desenvolvedor do AutoContábil Hub.'],
  utilitarios: ['Utilitários', 'Valide documentos, converta extratos e estime encargos tributários.']
};

const VALID_TABS = ['catalogo', 'xml', 'conciliador', 'organizador', 'utilitarios', 'contato'];

const AREA_LABELS = {
  fiscal: { nome: 'Fiscal', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  contabil: { nome: 'Contábil', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  financeiro: { nome: 'Financeiro', cls: 'bg-amber-50 text-amber-800 border-amber-200' }
};

function updatePageMetadata(tabName) {
  const [label, description] = TAB_METADATA[tabName] || TAB_METADATA.catalogo;
  const title = tabName === 'catalogo' ? `${label} | AutoContábil Hub` : `AutoContábil Hub | ${label}`;
  document.title = title;
  $('#meta-description')?.setAttribute('content', description);
  $('#og-title')?.setAttribute('content', title);
  $('#og-description')?.setAttribute('content', description);
  $('#twitter-title')?.setAttribute('content', title);
  $('#twitter-description')?.setAttribute('content', description);
}

function normalizeTabName(rawName) {
  const clean = String(rawName || '').trim().toLowerCase();
  if (!clean || clean === 'inicio' || clean === 'ferramentas' || clean === 'catalogo') return 'catalogo';
  return VALID_TABS.includes(clean) ? clean : 'catalogo';
}

function openTab(name) {
  const tabName = normalizeTabName(name);
  const isCatalogo = tabName === 'catalogo';

  $$('.tab-panel').forEach((panel) => {
    const selected = panel.id === `panel-${tabName}`;
    panel.hidden = !selected;
    panel.classList.toggle('hidden', !selected);
  });

  const backBar = $('#tool-back-bar');
  if (backBar) {
    backBar.classList.toggle('hidden', isCatalogo);
  }

  const modoToggle = $('#modo-toggle');
  if (modoToggle) {
    const hasGuidedMode = ['xml', 'conciliador', 'organizador'].includes(tabName);
    modoToggle.classList.toggle('hidden', !hasGuidedMode);
  }

  const navCatalogo = $('#tab-catalogo');
  if (navCatalogo) {
    if (isCatalogo) {
      navCatalogo.setAttribute('aria-current', 'page');
      navCatalogo.className = 'bg-indigo-600 text-white px-3.5 py-2 rounded-lg text-xs lg:text-sm font-semibold transition';
    } else {
      navCatalogo.removeAttribute('aria-current');
      navCatalogo.className = 'text-slate-200 hover:bg-slate-700/70 hover:text-white px-3.5 py-2 rounded-lg text-xs lg:text-sm font-semibold transition';
    }
  }

  if (isCatalogo) {
    document.body.dataset.modo = 'completo';
  } else {
    document.body.dataset.modo = getModo();
  }

  updatePageMetadata(tabName);

  if (isCatalogo) {
    if (location.hash) {
      history.replaceState(null, '', location.pathname + location.search);
    }
  } else if (location.hash !== `#${tabName}`) {
    history.replaceState(null, '', `#${tabName}`);
  }
}

function initCatalogo() {
  const buscaInput = $('#catalogo-busca');
  const filtrosContainer = $('#catalogo-filtros-area');
  const gridEl = $('#catalogo-grid');
  const vazioEl = $('#catalogo-vazio');
  const limparBtn = $('#btn-limpar-catalogo');

  if (!buscaInput || !filtrosContainer || !gridEl || !vazioEl) return;

  let areaAtiva = 'todas';

  function renderFilterButtons() {
    filtrosContainer.innerHTML = '';
    AREAS_FERRAMENTAS.forEach((area) => {
      const ativo = area.slug === areaAtiva;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.area = area.slug;
      btn.setAttribute('aria-pressed', String(ativo));
      btn.className = ativo
        ? 'px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-sm transition'
        : 'px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition';
      btn.textContent = area.nome;
      btn.addEventListener('click', () => {
        areaAtiva = area.slug;
        renderFilterButtons();
        renderCards();
      });
      filtrosContainer.appendChild(btn);
    });
  }

  function renderCards() {
    const termo = norm(buscaInput.value.trim()).toLowerCase();

    const filtradas = CATALOGO_FERRAMENTAS.filter((item) => {
      const bateArea = areaAtiva === 'todas' || item.area === areaAtiva;
      if (!bateArea) return false;
      if (!termo) return true;
      const alvo = norm(`${item.nome} ${item.resumo} ${item.publico} ${item.area}`).toLowerCase();
      return alvo.includes(termo);
    });

    gridEl.innerHTML = '';

    if (!filtradas.length) {
      gridEl.classList.add('hidden');
      vazioEl.classList.remove('hidden');
      return;
    }

    vazioEl.classList.add('hidden');
    gridEl.classList.remove('hidden');

    filtradas.forEach((item) => {
      const badgeInfo = AREA_LABELS[item.area] || { nome: item.area, cls: 'bg-slate-100 text-slate-700 border-slate-200' };
      const disponivel = item.status === 'disponivel';
      const temPaginaDedicada = item.pagina && item.pagina !== item.abrirEm;
      const targetTab = item.abrirEm && item.abrirEm.includes('#') ? item.abrirEm.split('#')[1] : '';
      const titleHref = item.pagina || item.abrirEm;
      const titleTargetTab = !temPaginaDedicada && targetTab ? `data-go="${esc(targetTab)}"` : '';

      const card = document.createElement('article');
      card.dataset.cardSlug = item.slug;
      card.dataset.cardArea = item.area;
      card.className = 'bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 transition p-6 shadow-sm flex flex-col justify-between';

      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="text-3xl" aria-hidden="true">${esc(item.icone)}</span>
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-bold px-2.5 py-0.5 rounded-md border ${badgeInfo.cls}">${esc(badgeInfo.nome)}</span>
              ${
                disponivel
                  ? '<span class="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">Disponível</span>'
                  : '<span class="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">Em breve</span>'
              }
            </div>
          </div>
          <h2 class="text-lg font-extrabold text-slate-900 leading-snug">
            <a href="${esc(titleHref)}" ${titleTargetTab} class="hover:text-indigo-600 transition">${esc(item.nome)}</a>
          </h2>
          <p class="text-sm text-slate-600 mt-2 leading-relaxed">${esc(item.resumo)}</p>
          <p class="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
            <strong class="text-slate-700">Para quem:</strong> ${esc(item.publico)}
          </p>
        </div>
        <div class="mt-5 pt-3 flex flex-wrap items-center gap-2">
          ${
            disponivel
              ? `<a href="${esc(item.abrirEm)}" ${targetTab ? `data-go="${esc(targetTab)}"` : ''} class="flex-1 text-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl py-2.5 px-4 text-xs sm:text-sm transition">Abrir ferramenta →</a>`
              : `<span class="flex-1 text-center bg-slate-200 text-slate-500 font-bold rounded-xl py-2.5 px-4 text-xs sm:text-sm cursor-not-allowed">Em breve</span>`
          }
          ${
            temPaginaDedicada
              ? `<a href="${esc(item.pagina)}" class="rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold py-2.5 px-3.5 text-xs sm:text-sm transition">Como funciona</a>`
              : ''
          }
        </div>
      `;

      gridEl.appendChild(card);
    });
  }

  buscaInput.addEventListener('input', renderCards);
  limparBtn?.addEventListener('click', () => {
    buscaInput.value = '';
    areaAtiva = 'todas';
    renderFilterButtons();
    renderCards();
  });

  renderFilterButtons();
  renderCards();
}

function chooseMode(value) {
  setModo(value);
  const overlay = $('#modo-overlay');
  if (overlay) overlay.hidden = true;
  const modoToggle = $('#modo-toggle');
  if (modoToggle) {
    modoToggle.textContent = `Modo: ${value === 'guiado' ? 'Guiado' : 'Completo'} ⇄ ${value === 'guiado' ? 'Completo' : 'Guiado'}`;
  }
  const currentTab = normalizeTabName(location.hash.slice(1));
  if (currentTab === 'catalogo') {
    document.body.dataset.modo = 'completo';
  }
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

$('#modo-guiado')?.addEventListener('click', () => chooseMode('guiado'));
$('#modo-completo')?.addEventListener('click', () => chooseMode('completo'));
$('#modo-fechar')?.addEventListener('click', () => chooseMode('guiado'));
$('#modo-toggle')?.addEventListener('click', () => chooseMode(getModo() === 'guiado' ? 'completo' : 'guiado'));
$('#modo-overlay')?.addEventListener('click', (event) => { if (event.target.id === 'modo-overlay') chooseMode('guiado'); });

const initialMode = modoSalvo() || 'completo';
setModo(initialMode, false);
const modoToggleBtn = $('#modo-toggle');
if (modoToggleBtn) {
  modoToggleBtn.textContent = `Modo: ${initialMode === 'guiado' ? 'Guiado' : 'Completo'} ⇄ ${initialMode === 'guiado' ? 'Completo' : 'Guiado'}`;
}

window.addEventListener('hashchange', () => openTab(location.hash.slice(1)));

document.addEventListener('click', (event) => {
  const goTarget = event.target.closest('[data-go]');
  if (goTarget) {
    event.preventDefault();
    openTab(goTarget.dataset.go);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

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

initCatalogo();
initXmlModule();
initConciliadorModule();
initOrganizadorModule();
initContactModule();
initUtilitiesModule();

const contextualHelp = { 'panel-xml': AJUDA_GUIADO.notas, 'panel-conciliador': AJUDA_GUIADO.banco, 'panel-organizador': AJUDA_GUIADO.documentos };
Object.entries(contextualHelp).forEach(([id, content]) => {
  const panel = document.getElementById(id);
  const title = panel?.querySelector('h2');
  if (title && !panel.querySelector('[data-ajuda]')) title.insertAdjacentHTML('afterend', ajuda(content, id));
});

const technicalTables = ['xml-tbody', 'cb-bank-tbody', 'cb-led-tbody', 'cb-tbody', 'og-tbody'];
function setGuidedTableDetails(modo = getModo()) {
  technicalTables.forEach((tbodyId) => {
    const tbody = document.getElementById(tbodyId);
    const table = tbody?.closest('table');
    if (!table) return;
    const wrapper = table.closest('.overflow-x-auto');
    if (!wrapper) return;
    const existing = wrapper.parentElement?.classList.contains('guiado-detalhes') ? wrapper.parentElement : null;
    if (modo === 'guiado' && !existing) {
      const details = document.createElement('details');
      details.className = 'guiado-detalhes';
      details.innerHTML = '<summary>Ver detalhes</summary>';
      wrapper.before(details);
      details.append(wrapper);
    } else if (modo === 'completo' && existing) {
      existing.before(wrapper);
      existing.remove();
    }
  });
}
setGuidedTableDetails();
document.addEventListener('modo:alterado', (event) => setGuidedTableDetails(event.detail.modo));

const glossary = $('#glossario-dialog');
if (glossary) glossary.querySelector('dl').innerHTML = TERMOS_GUIADOS.map(([term, explanation]) => `<dt>${esc(term)}</dt><dd>${esc(explanation)}</dd>`).join('');
$('#ajuda-global')?.addEventListener('click', () => glossary?.showModal());
$('#glossario-fechar')?.addEventListener('click', () => glossary?.close());
glossary?.addEventListener('click', (event) => { if (event.target === glossary) glossary.close(); });

document.querySelectorAll('#xml-demo, #cb-demo, #og-demo').forEach((button) => {
  button.addEventListener('click', () => {
    const panel = button.closest('.tab-panel');
    let note = panel?.querySelector('.aviso-exemplo');
    if (!note) {
      note = document.createElement('p');
      note.className = 'aviso-exemplo';
      note.textContent = 'Estes dados são de exemplo, inventados para você ver como funciona.';
      button.closest('.mb-4, .bg-white')?.prepend(note);
    }
    if (note) note.hidden = false;
  });
});

openTab(location.hash.slice(1) || 'catalogo');

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
