'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getSavedUserProfile, saveUserProfileLocal, getSupabaseClient } from '@/lib/supabase/client';
import { UserProfile } from '@/types/saas';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    setUser(getSavedUserProfile());
  }, [pathname]);

  async function handleLogout() {
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    } catch {
      // Ignora caso esteja apenas em sessão demo local
    }
    saveUserProfileLocal(null);
    setUser(null);
    router.push('/');
  }

  const navLinkClass = (href: string) => {
    const active = pathname === href || (href !== '/' && pathname?.startsWith(href));
    return active
      ? 'bg-indigo-600 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm'
      : 'text-slate-200 hover:bg-slate-800 hover:text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition';
  };

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-lg border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-400 grid place-items-center font-extrabold text-lg shadow">
              AC
            </div>
            <div>
              <span className="block text-lg font-extrabold leading-tight tracking-tight">
                AutoContábil <span className="text-emerald-400">SaaS</span>
              </span>
              <span className="hidden sm:block text-[11px] text-slate-400 leading-tight">
                Ponte simples entre o MEI e o seu Contador
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex flex-wrap items-center gap-1.5 bg-slate-800/90 p-1.5 rounded-2xl" aria-label="Navegação principal">
          <Link href="/" className={navLinkClass('/')}>
            Início
          </Link>
          <Link href="/mei" className={navLinkClass('/mei')}>
            🏢 Área da Empresa / MEI
          </Link>
          <Link href="/mei/extratos" className={navLinkClass('/mei/extratos')}>
            📄 Organizar Extrato
          </Link>
          <Link href="/contador" className={navLinkClass('/contador')}>
            👩‍💼 Área do Contador
          </Link>
          <Link href="/precos" className={navLinkClass('/precos')}>
            Planos
          </Link>
        </nav>

        <div className="flex items-center gap-2 self-end lg:self-auto">
          {user ? (
            <div className="flex items-center gap-2.5 text-xs sm:text-sm">
              <div className="text-right">
                <span className="block font-bold text-white leading-tight">{user.displayName}</span>
                <span className="inline-block text-[11px] text-emerald-300 font-semibold">
                  {user.accountType === 'contador' ? 'Conta Contador' : 'Conta Empresa / MEI'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-slate-600 hover:border-slate-400 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white transition"
              >
                Sair
              </button>
            </div>
          ) : (
            <Link
              href="/entrar"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl px-4 py-2 text-xs sm:text-sm transition shadow-sm"
            >
              Entrar / Criar conta grátis
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
