import { $, esc, toast } from './utils.js';

// Configure these values before enabling contact submissions in production.
const CONTACT_ENDPOINT = 'COLOQUE_AQUI_O_ENDPOINT';
const CONTACT_ACCESS_KEY = '';
const CONTACT_EMAIL = 'SEU_EMAIL@EXEMPLO.COM';
const WHATSAPP_URL = 'https://wa.me/5583986398472';
let lastAttemptAt = 0;

function showContactMessage(message, kind = 'info', showAlternatives = false) {
  const box = $('#contact-status');
  const styles = {
    info: 'bg-sky-50 border-sky-200 text-sky-800',
    ok: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    err: 'bg-rose-50 border-rose-200 text-rose-800'
  };
  if (!box) return;
  const alternatives = showAlternatives
    ? `<div class="mt-3 flex flex-wrap gap-3"><a class="font-semibold underline" href="mailto:${CONTACT_EMAIL}">Enviar por e-mail</a><a class="font-semibold underline" href="${WHATSAPP_URL}" target="_blank" rel="noopener">Falar pelo WhatsApp</a></div>`
    : '';
  box.innerHTML = `<div class="border rounded-xl px-4 py-3 text-sm ${styles[kind] || styles.info}">${esc(message)}${alternatives}</div>`;
}

function initContactModule() {
  const form = $('#contact-form');
  if (!form) return;
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

    const accessKeyRequired = CONTACT_ENDPOINT.includes('api.web3forms.com');
    if (!CONTACT_ENDPOINT.startsWith('https://') || CONTACT_ENDPOINT.includes('COLOQUE_AQUI') || (accessKeyRequired && !CONTACT_ACCESS_KEY)) {
      console.warn('Contact form is not configured. Set CONTACT_ENDPOINT and, for Web3Forms, CONTACT_ACCESS_KEY in js/contactModule.js.');
      showContactMessage('O envio por formulário está indisponível no momento. Use o e-mail ou o WhatsApp abaixo.', 'err', true);
      toast('Envio por formulário indisponível. Use um canal alternativo.', 'err');
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
      showContactMessage('Não foi possível enviar a mensagem agora. Use o e-mail ou o WhatsApp abaixo.', 'err', true);
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

export { initContactModule };
