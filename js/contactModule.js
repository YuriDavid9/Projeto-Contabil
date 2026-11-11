import { $, esc, toast } from './utils.js';
import { FAIXAS_PRO, buildWhatsappLink } from './negocio.js';

// Provedor escolhido: Web3Forms (plano gratuito com 250 envios/mês, feito para envio direto do navegador).
// Para ativar: gere a access key em https://web3forms.com com o e-mail que deve receber as mensagens
// e cole em CONTACT_ACCESS_KEY. A access key é pública por definição do provedor (não é segredo).
// Enquanto CONTACT_ACCESS_KEY estiver vazia, contato.html e pro.html mostram o aviso com o WhatsApp.
const CONTACT_ENDPOINT = 'https://api.web3forms.com/submit';
const CONTACT_ACCESS_KEY = '';
const CONTACT_EMAIL = 'SEU_EMAIL@EXEMPLO.COM';
const WHATSAPP_URL = buildWhatsappLink({ origem: 'Formulário de Contato' });
let lastAttemptAt = 0;

function isContactEmailConfigured(email = CONTACT_EMAIL) {
  const value = String(email || '').trim();
  if (!value || !value.includes('@')) return false;
  if (/SEU_EMAIL|EXEMPLO\.COM/i.test(value)) return false;
  return true;
}

function isContactEndpointConfigured(endpoint = CONTACT_ENDPOINT, accessKey = CONTACT_ACCESS_KEY) {
  const url = String(endpoint || '').trim();
  if (!url.startsWith('https://') || /COLOQUE_AQUI/i.test(url)) return false;
  if (url.includes('api.web3forms.com') && !String(accessKey || '').trim()) return false;
  return true;
}

function isContactConfigured(endpoint = CONTACT_ENDPOINT, email = CONTACT_EMAIL, accessKey = CONTACT_ACCESS_KEY) {
  return isContactEndpointConfigured(endpoint, accessKey) && isContactEmailConfigured(email);
}

function buildContactAlternativesHtml(email = CONTACT_EMAIL, whatsappUrl = WHATSAPP_URL) {
  const links = [];
  if (isContactEmailConfigured(email)) {
    links.push(`<a class="font-semibold underline" href="mailto:${esc(email)}">Enviar por e-mail</a>`);
  }
  links.push(`<a class="font-semibold underline" href="${esc(whatsappUrl)}" target="_blank" rel="noopener">Falar pelo WhatsApp</a>`);
  return `<div class="mt-3 flex flex-wrap gap-3">${links.join('')}</div>`;
}

function showContactMessage(message, kind = 'info', showAlternatives = false) {
  const box = $('#contact-status');
  const styles = {
    info: 'bg-sky-50 border-sky-200 text-sky-800',
    ok: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    err: 'bg-rose-50 border-rose-200 text-rose-800'
  };
  if (!box) return;
  const alternatives = showAlternatives ? buildContactAlternativesHtml(CONTACT_EMAIL, WHATSAPP_URL) : '';
  box.innerHTML = `<div class="border rounded-xl px-4 py-3 text-sm ${styles[kind] || styles.info}">${esc(message)}${alternatives}</div>`;
}

function initContactModule() {
  const form = $('#contact-form');
  if (!form) return;

  if (!isContactEndpointConfigured(CONTACT_ENDPOINT, CONTACT_ACCESS_KEY)) {
    form.innerHTML = `
      <div class="space-y-3 text-sm text-slate-700">
        <p class="font-semibold text-slate-900">O formulário está em configuração. Fale conosco pelo WhatsApp.</p>
        <div>
          <a class="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-900 hover:bg-emerald-400 transition" href="${esc(WHATSAPP_URL)}" target="_blank" rel="noopener">💬 Falar pelo WhatsApp</a>
        </div>
      </div>`;
    return;
  }

  const button = $('#contact-submit');
  const submitLabel = button.textContent;
  const honeypot = $('#contact-website');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const message = String(data.get('message') || '').trim();
    if (message.length < 10) {
      $('#contact-message').setCustomValidity('Escreva uma mensagem com pelo menos 10 caracteres.');
      $('#contact-message').reportValidity();
      $('#contact-message').setCustomValidity('');
      return;
    }

    if (honeypot?.value) {
      showContactMessage('Mensagem recebida. Obrigado pelo contato.', 'ok');
      form.reset();
      toast('Mensagem recebida.', 'ok');
      return;
    }

    const remaining = 30000 - (Date.now() - lastAttemptAt);
    if (remaining > 0) {
      showContactMessage(`Aguarde ${Math.ceil(remaining / 1000)} segundos antes de tentar novamente.`, 'err', true);
      return;
    }

    button.disabled = true;
    button.textContent = 'Enviando…';
    showContactMessage('Enviando sua mensagem…');
    toast('Enviando mensagem…');

    try {
      const payload = Object.fromEntries(['name', 'email', 'subject', 'message'].map((key) => [key, String(data.get(key) || '').trim()]));
      payload.consent = data.get('consent') === 'on';
      payload.botcheck = '';
      if (CONTACT_ACCESS_KEY) payload.access_key = CONTACT_ACCESS_KEY;
      lastAttemptAt = Date.now();
      const response = await fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) throw new Error(result.message || 'O serviço não aceitou a mensagem.');
      showContactMessage('Mensagem enviada. Obrigado pelo contato!', 'ok');
      toast('Mensagem enviada com sucesso.', 'ok');
      form.reset();
    } catch (error) {
      console.warn('Contact form submission failed:', error);
      showContactMessage('Não foi possível enviar a mensagem agora. Use o canal alternativo abaixo.', 'err', true);
      toast('Falha ao enviar. Use uma das alternativas de contato.', 'err');
    } finally {
      const wait = Math.max(0, 30000 - (Date.now() - lastAttemptAt));
      if (wait) {
        button.textContent = `Tente novamente em ${Math.ceil(wait / 1000)}s`;
        setTimeout(() => {
          button.disabled = false;
          button.textContent = submitLabel;
        }, wait);
      } else {
        button.disabled = false;
        button.textContent = submitLabel;
      }
    }
  });
}

function initProWaitlistModule() {
  const form = $('#pro-waitlist-form');
  if (!form) return;

  const faixaSelect = $('#pro-faixa');
  if (faixaSelect && Array.isArray(FAIXAS_PRO)) {
    faixaSelect.innerHTML = '<option value="">Selecione uma faixa de valor</option>' +
      FAIXAS_PRO.map((faixa) => `<option value="${esc(faixa)}">${esc(faixa)}</option>`).join('');
  }

  const proWaUrl = buildWhatsappLink({
    origem: 'Lista de Espera AutoContábil Pro',
    servico: 'interesse no AutoContábil Pro (em validação)'
  });

  if (!isContactEndpointConfigured(CONTACT_ENDPOINT, CONTACT_ACCESS_KEY)) {
    const notice = $('#pro-unconfigured-notice');
    if (notice) {
      notice.classList.remove('hidden');
      const waLink = notice.querySelector('[data-pro-wa]');
      if (waLink) waLink.href = proWaUrl;
    }
    const fields = $('#pro-form-fields');
    if (fields) fields.classList.add('hidden');
    return;
  }

  const button = $('#pro-submit');
  const submitLabel = button ? button.textContent : 'Entrar na lista de espera';
  const honeypot = $('#pro-website');
  const statusBox = $('#pro-status');

  const showProStatus = (msg, kind = 'info', showAlt = false) => {
    if (!statusBox) return;
    const styles = {
      info: 'bg-sky-50 border-sky-200 text-sky-800',
      ok: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      err: 'bg-rose-50 border-rose-200 text-rose-800'
    };
    const alternatives = showAlt ? buildContactAlternativesHtml(CONTACT_EMAIL, proWaUrl) : '';
    statusBox.innerHTML = `<div class="border rounded-xl px-4 py-3 text-sm ${styles[kind] || styles.info}">${esc(msg)}${alternatives}</div>`;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    if (honeypot?.value) {
      showProStatus('Interesse registrado na lista de espera. Obrigado!', 'ok');
      form.reset();
      return;
    }

    const remaining = 30000 - (Date.now() - lastAttemptAt);
    if (remaining > 0) {
      showProStatus(`Aguarde ${Math.ceil(remaining / 1000)} segundos antes de tentar novamente.`, 'err', true);
      return;
    }

    const data = new FormData(form);
    if (button) {
      button.disabled = true;
      button.textContent = 'Enviando…';
    }
    showProStatus('Registrando seu interesse…', 'info');

    try {
      const payload = {
        tipo: 'lista_espera_pro',
        subject: 'Lista de espera AutoContábil Pro',
        name: String(data.get('name') || '').trim(),
        email: String(data.get('email') || '').trim(),
        sistema_contabil: String(data.get('sistema_contabil') || '').trim(),
        quantidade_clientes: String(data.get('quantidade_clientes') || '').trim(),
        faixa_mensal: String(data.get('faixa_mensal') || '').trim(),
        consent: data.get('consent') === 'on',
        botcheck: ''
      };
      if (CONTACT_ACCESS_KEY) payload.access_key = CONTACT_ACCESS_KEY;
      lastAttemptAt = Date.now();
      const response = await fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'O serviço não aceitou o envio.');
      }
      showProStatus('Cadastro recebido! Avisaremos você por e-mail se o AutoContábil Pro for lançado.', 'ok');
      form.reset();
    } catch (error) {
      console.warn('Pro waitlist submission failed:', error);
      showProStatus('Não foi possível enviar pelo formulário agora. Registre seu interesse pelo WhatsApp abaixo.', 'err', true);
    } finally {
      const wait = Math.max(0, 30000 - (Date.now() - lastAttemptAt));
      if (button) {
        if (wait) {
          button.textContent = `Tente novamente em ${Math.ceil(wait / 1000)}s`;
          setTimeout(() => {
            button.disabled = false;
            button.textContent = submitLabel;
          }, wait);
        } else {
          button.disabled = false;
          button.textContent = submitLabel;
        }
      }
    }
  });
}

export {
  initContactModule,
  initProWaitlistModule,
  isContactConfigured,
  isContactEmailConfigured,
  isContactEndpointConfigured,
  buildContactAlternativesHtml,
  CONTACT_ENDPOINT
};
