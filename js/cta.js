import { esc } from './utils.js';
import { NEGOCIO } from './negocio.js';

const CTA_CONFIG = {
  xml: {
    texto: 'Faz isso todo mês? Eu faço a consolidação para o seu escritório — a partir de R$ 250 por lote.',
    botao: '💬 Falar no WhatsApp'
  },
  conciliador: {
    texto: 'Conciliação mensal feita por mim, a partir de R$ 350/mês.',
    botao: '💬 Falar no WhatsApp'
  },
  organizador: {
    texto: 'Quer isso rodando automático? Automação de planilhas e rotinas, a partir de R$ 400 por projeto.',
    botao: '💬 Falar no WhatsApp'
  }
};

const dismissedCTAs = new Set();

export function montarLinkCTA(tipo, contagem, whatsappNumber = NEGOCIO.whatsapp) {
  if (!Object.prototype.hasOwnProperty.call(CTA_CONFIG, tipo)) return null;
  if (typeof contagem !== 'number' || !Number.isFinite(contagem) || contagem < 0 || !Number.isInteger(contagem)) {
    return null;
  }

  const phone = String(whatsappNumber || NEGOCIO.whatsapp).replace(/\D/g, '');
  if (!phone) return null;

  let message = '';
  if (tipo === 'xml') {
    message = `Olá Yuri! Consolidei ${contagem} ${contagem === 1 ? 'nota' : 'notas'} no Extrator de XML do AutoContábil Hub e queria automatizar isso todo mês.`;
  } else if (tipo === 'conciliador') {
    message = `Olá Yuri! Rodei uma conciliação no Conciliador Bancário do AutoContábil Hub e encontrei ${contagem} ${contagem === 1 ? 'pendência ou divergência' : 'pendências ou divergências'}. Quero saber sobre a conciliação mensal.`;
  } else if (tipo === 'organizador') {
    message = `Olá Yuri! Organizei ${contagem} ${contagem === 1 ? 'documento' : 'documentos'} no Organizador Fiscal do AutoContábil Hub e queria automatizar essa rotina.`;
  }

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  return url.startsWith('https://wa.me/') ? url : null;
}

export function isCTADismissed(tipo) {
  return dismissedCTAs.has(tipo);
}

export function dismissCTA(tipo) {
  dismissedCTAs.add(tipo);
}

export function resetCTADismissals() {
  dismissedCTAs.clear();
}

export function shouldShowCTA(tipo, contagem) {
  if (isCTADismissed(tipo)) return false;
  if (!montarLinkCTA(tipo, contagem)) return false;
  if (tipo === 'xml') return contagem >= 10;
  if (tipo === 'conciliador') return contagem >= 1;
  if (tipo === 'organizador') return contagem >= 1;
  return false;
}

export function buildCTAHtml(tipo, contagem, whatsappNumber = NEGOCIO.whatsapp) {
  if (!shouldShowCTA(tipo, contagem)) return '';
  const href = montarLinkCTA(tipo, contagem, whatsappNumber);
  const config = CTA_CONFIG[tipo];
  if (!href || !href.startsWith('https://wa.me/') || !config) return '';

  return `
    <div role="region" aria-label="Serviço sob medida" class="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <p class="text-sm font-semibold text-slate-900 leading-snug">${esc(config.texto)}</p>
      <div class="flex flex-wrap items-center gap-2 shrink-0">
        <a href="${esc(href)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center rounded-xl bg-emerald-700 hover:bg-emerald-800 px-3.5 py-2 text-xs sm:text-sm font-bold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2">${esc(config.botao)}</a>
        <a href="servicos.html" class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white hover:bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2">Ver serviços</a>
        <a href="pro.html" class="inline-flex items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 text-xs font-semibold text-indigo-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2">Entrar na lista do Pro</a>
        <button type="button" data-cta-close="${esc(tipo)}" aria-label="Fechar convite de serviço" class="inline-flex items-center justify-center rounded-lg px-2 py-1.5 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-emerald-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2">×</button>
      </div>
    </div>
  `;
}

export function renderCTACard(container, tipo, contagem) {
  if (!container) return false;
  const html = buildCTAHtml(tipo, contagem);
  if (!html) {
    container.innerHTML = '';
    container.hidden = true;
    return false;
  }

  container.innerHTML = html;
  container.hidden = false;

  const closeBtn = container.querySelector('[data-cta-close]');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      dismissCTA(tipo);
      container.innerHTML = '';
      container.hidden = true;
    });
  }
  return true;
}
