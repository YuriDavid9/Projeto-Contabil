import { esc } from '../utils.js';
import { getSessionAndProfile, signOut } from './auth.js';

export async function initPortalLayout(activePage = 'noticias') {
  const headerEl = document.getElementById('portal-header');
  const footerEl = document.getElementById('portal-footer');

  const { user, profile } = await getSessionAndProfile();
  const isAdmin = profile?.role === 'admin';
  const displayName = profile?.display_name || 'Contador';

  if (headerEl) {
    const linkClass = (page) =>
      activePage === page
        ? 'bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs lg:text-sm font-semibold transition'
        : 'text-slate-200 hover:bg-slate-700/70 hover:text-white px-3 py-2 rounded-lg text-xs lg:text-sm font-semibold transition';

    headerEl.innerHTML = `
      <header class="bg-slate-900 text-white sticky top-0 z-40 shadow-lg">
        <div class="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <a href="noticias.html" class="flex items-center gap-3 group">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-400 grid place-items-center font-extrabold text-lg shadow">AC</div>
            <div>
              <span class="block text-lg font-extrabold leading-tight tracking-tight">AutoContábil <span class="text-emerald-400">Hub</span> — Notícias</span>
              <span class="hidden md:block text-[11px] text-slate-400 leading-tight">Portal informativo e comunidade contábil</span>
            </div>
          </a>
          <div class="flex flex-wrap items-center gap-2">
            <nav class="flex items-center gap-1 bg-slate-800 p-1 rounded-xl" aria-label="Navegação do portal">
              <a href="index.html" class="${linkClass('ferramentas')}">🧰 Catálogo de Ferramentas</a>
              <a href="noticias.html" class="${linkClass('noticias')}">📰 Notícias</a>
              ${isAdmin ? `<a href="admin.html" class="${linkClass('admin')}">⚙️ Painel</a>` : ''}
            </nav>
            <div class="flex items-center gap-2 ml-auto sm:ml-2 text-xs lg:text-sm">
              ${
                user
                  ? `<span class="text-slate-300 font-medium px-2">Olá, <strong class="text-white">${esc(displayName)}</strong>${isAdmin ? ' <span class="ml-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded px-1.5 py-0.5 text-[10px] uppercase font-bold">Admin</span>' : ''}</span>
                     <button id="portal-logout-btn" type="button" class="rounded-lg border border-slate-600 hover:border-slate-400 text-slate-200 hover:text-white px-3 py-1.5 font-semibold transition">Sair</button>`
                  : `<a href="entrar.html" class="${activePage === 'entrar' ? 'bg-emerald-600 text-white' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900'} font-bold rounded-lg px-3.5 py-2 transition">Entrar / Criar conta</a>`
              }
            </div>
          </div>
        </div>
      </header>
    `;

    const logoutBtn = document.getElementById('portal-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        logoutBtn.disabled = true;
        logoutBtn.textContent = 'Saindo...';
        try {
          await signOut();
          window.location.href = 'noticias.html';
        } catch {
          window.location.reload();
        }
      });
    }
  }

  if (footerEl) {
    footerEl.innerHTML = `
      <footer class="bg-slate-900 text-slate-300 mt-12">
        <div class="max-w-7xl mx-auto px-4 py-8 grid md:grid-cols-3 gap-6 text-sm">
          <div>
            <p class="font-extrabold text-white text-base">AutoContábil <span class="text-emerald-400">Hub</span> — Notícias</p>
            <p class="text-slate-400 mt-1">As ferramentas do Hub processam seus arquivos localmente no navegador. O portal de notícias utiliza conta e comentários armazenados em servidor seguro.</p>
          </div>
          <div>
            <p class="font-semibold text-white mb-1">Aviso importante</p>
            <p class="text-slate-400">O conteúdo publicado tem caráter meramente informativo e não substitui a consulta à legislação oficial nem a orientação do contador responsável.</p>
          </div>
          <div>
            <p class="font-semibold text-white mb-1">Yuri David</p>
            <a class="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-xl px-4 py-2 transition" target="_blank" rel="noopener noreferrer" href="https://wa.me/5583986398472?text=Ol%C3%A1%20Yuri!%20Vim%20pelo%20AutoCont%C3%A1bil%20Hub.">💬 WhatsApp: (83) 98639-8472</a>
            <p class="text-slate-400 mt-2">Yuri David • João Pessoa - PB</p>
          </div>
        </div>
        <div class="border-t border-slate-800 px-4 py-3 text-center text-xs text-slate-400">
          <a class="hover:text-white underline" href="index.html">Ferramentas</a><span class="mx-2" aria-hidden="true">·</span>
          <a class="hover:text-white underline" href="noticias.html">Notícias</a><span class="mx-2" aria-hidden="true">·</span>
          <a class="hover:text-white underline" href="privacidade.html">Privacidade</a><span class="mx-2" aria-hidden="true">·</span>
          <a class="hover:text-white underline" href="termos.html">Termos</a>
        </div>
      </footer>
    `;
  }

  return { user, profile, isAdmin };
}

