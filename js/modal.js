import { $ } from './utils.js';

let previouslyFocused = null;
const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const modal = {
  open(title, html) {
    const titleEl = $('#modal-title');
    const bodyEl = $('#modal-body');
    const modalEl = $('#modal');
    if (!titleEl || !bodyEl || !modalEl) return;

    previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    titleEl.textContent = title;
    bodyEl.innerHTML = html;
    modalEl.classList.remove('hidden');
    modalEl.setAttribute('aria-hidden', 'false');

    const closeBtn = $('#modal-close') || modalEl.querySelector(FOCUSABLE_SELECTOR);
    if (closeBtn instanceof HTMLElement) closeBtn.focus();
  },
  close() {
    const modalEl = $('#modal');
    if (!modalEl || modalEl.classList.contains('hidden')) return;
    modalEl.classList.add('hidden');
    modalEl.setAttribute('aria-hidden', 'true');
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      previouslyFocused.focus();
      previouslyFocused = null;
    }
  }
};

function initModal() {
  const modalButton = $('#modal-close');
  if (modalButton) modalButton.addEventListener('click', modal.close);
  const modalEl = $('#modal');
  if (modalEl) {
    modalEl.addEventListener('click', (event) => {
      if (event.target.id === 'modal') modal.close();
    });
  }
  document.addEventListener('keydown', (event) => {
    const activeModal = $('#modal');
    if (!activeModal || activeModal.classList.contains('hidden')) return;
    if (event.key === 'Escape') {
      modal.close();
      return;
    }
    if (event.key === 'Tab') {
      const focusables = [...activeModal.querySelectorAll(FOCUSABLE_SELECTOR)].filter((el) => el instanceof HTMLElement && el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
}

export { modal, initModal };
