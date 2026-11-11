import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8 text-sm">
        <div>
          <p className="font-extrabold text-white text-base">
            AutoContábil <span className="text-emerald-400">SaaS</span>
          </p>
          <p className="text-slate-400 mt-2 leading-relaxed">
            Plataforma simples e educativa para MEIs, pequenas empresas e contadores. Organize seus extratos bancários sem complicação e envie relatórios claros para a sua contabilidade.
          </p>
        </div>

        <div>
          <p className="font-bold text-white mb-2">Navegação rápida</p>
          <ul className="space-y-1.5 text-slate-400">
            <li>
              <Link href="/mei" className="hover:text-white transition">
                Dashboard da Empresa / MEI
              </Link>
            </li>
            <li>
              <Link href="/mei/extratos" className="hover:text-white transition">
                Organizar Extrato Bancário (OFX e CSV)
              </Link>
            </li>
            <li>
              <Link href="/contador" className="hover:text-white transition">
                Painel do Contador Parceiro
              </Link>
            </li>
            <li>
              <Link href="/precos" className="hover:text-white transition">
                Planos e Preços
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="font-bold text-white mb-2">Transparência e Privacidade</p>
          <p className="text-slate-400 leading-relaxed">
            Seus dados financeiros pertencem exclusivamente a você. Nenhum relatório é compartilhado sem a sua autorização expressa.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-slate-300">
            <Link href="/privacidade" className="underline hover:text-white">
              Política de Privacidade (LGPD)
            </Link>
            <span>•</span>
            <Link href="/termos" className="underline hover:text-white">
              Termos de Uso
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 px-4 py-4 text-center text-xs text-slate-400">
        AutoContábil • Ferramenta educativa e organizacional de apoio. Não substitui o trabalho técnico do seu contador.
      </div>
    </footer>
  );
}
