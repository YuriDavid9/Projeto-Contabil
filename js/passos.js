function passos({ atual, total, rotulos = {} }) {
  const nome = rotulos[atual] || `Passo ${atual} de ${total}`;
  return `<nav class="guiado-passos" aria-label="Etapas"><p aria-live="polite"><strong>Passo ${atual} de ${total}</strong>${nome.startsWith('Passo ') ? '' : ` · ${nome}`}</p><div><button type="button" data-passo="voltar" ${atual <= 1 ? 'disabled' : ''}>Voltar</button><button type="button" data-passo="continuar" ${atual >= total ? 'disabled' : ''}>Continuar</button></div></nav>`;
}

function ativarPassos(root, onChange) {
  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-passo]');
    if (!button || button.disabled) return;
    onChange(button.dataset.passo === 'voltar' ? -1 : 1);
  });
}

function mostrarPasso(root, atual) {
  const sections = [...root.querySelectorAll('[data-passo-conteudo]')];
  sections.forEach((section, index) => {
    const visible = index + 1 === atual;
    section.hidden = !visible;
    section.setAttribute('aria-current', visible ? 'step' : 'false');
  });
  return sections.length;
}

export { passos, ativarPassos, mostrarPasso };
