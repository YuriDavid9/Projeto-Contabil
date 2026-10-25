const STORAGE_KEY = 'ach-ajuda-aberta-v1';

function ajuda({ oQueE, ondeEncontro, oQueAcontece }, id = 'ajuda') {
  let open = true;
  try { open = localStorage.getItem(STORAGE_KEY) !== 'fechada'; } catch { /* O componente funciona sem armazenamento. */ }
  const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  return `<details class="guiado-ajuda" data-ajuda="${safe(id)}" ${open ? 'open' : ''}><summary>Ajuda: entenda este passo</summary><div class="guiado-ajuda-conteudo"><h3>O que é isso?</h3><p>${safe(oQueE)}</p><h3>Onde eu encontro?</h3><p>${safe(ondeEncontro)}</p><h3>O que acontece com meus arquivos?</h3><p>${safe(oQueAcontece || 'Nada sai do seu computador. Os arquivos originais não são alterados.')}</p></div></details>`;
}

function lembrarAjuda(event) {
  if (!event.target.matches('details[data-ajuda]')) return;
  try { localStorage.setItem(STORAGE_KEY, event.target.open ? 'aberta' : 'fechada'); } catch { /* Preferência temporária nesta visita. */ }
}

document.addEventListener('toggle', lembrarAjuda, true);
export { ajuda };
