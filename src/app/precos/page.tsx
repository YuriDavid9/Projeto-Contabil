import React from 'react';
import Link from 'next/link';

export default function PrecosPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
      <div className="text-center max-w-3xl mx-auto">
        <span className="inline-block bg-indigo-50 text-indigo-700 font-bold text-xs px-3 py-1 rounded-lg mb-2">
          PLANOS TRANSPARENTES E ACESSÍVEIS
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
          Comece grátis e cresça no seu ritmo
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2">
          Sem letras miúdas e sem fidelidade. Nosso objetivo é tornar a rotina entre o MEI e o contador muito mais leve.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Plano 1: MEI Gratuito */}
        <div className="bg-white rounded-3xl border border-slate-200 p-7 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-slate-500">
              Para começar agora
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
              MEI Essencial
            </h2>
            <p className="text-3xl font-extrabold text-slate-900 mt-4">
              R$ 0 <span className="text-sm font-normal text-slate-500">/ mês</span>
            </p>
            <p className="text-xs text-slate-600 mt-2">
              Ideal para o MEI organizar seu extrato todo mês sem pagar nada.
            </p>

            <ul className="mt-6 space-y-2.5 text-sm text-slate-700">
              <li>✅ Upload de extrato OFX e CSV</li>
              <li>✅ Classificação automática com explicações simples</li>
              <li>✅ Geração de relatório em PDF e Excel/CSV</li>
              <li>✅ Checklist mensal de obrigações do MEI</li>
            </ul>
          </div>

          <Link
            href="/entrar"
            className="mt-8 block text-center rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 text-sm transition"
          >
            Começar grátis agora
          </Link>
        </div>

        {/* Plano 2: Empresa / MEI Pro (Futuro) */}
        <div className="bg-white rounded-3xl border-2 border-indigo-600 p-7 shadow-md flex flex-col justify-between relative">
          <div>
            <span className="inline-block bg-indigo-600 text-white text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-md mb-2">
              Em breve • Mais recursos
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900">
              MEI & Pequena Empresa Pro
            </h2>
            <p className="text-3xl font-extrabold text-slate-900 mt-4">
              R$ 29,90 <span className="text-sm font-normal text-slate-500">/ mês</span>
            </p>
            <p className="text-xs text-slate-600 mt-2">
              Para quem movimenta mais de uma conta bancária e quer histórico anual completo.
            </p>

            <ul className="mt-6 space-y-2.5 text-sm text-slate-700">
              <li>✅ Tudo do plano Essencial</li>
              <li>✅ Múltiplos bancos no mesmo mês</li>
              <li>✅ Organização automática de XML de Notas Fiscais</li>
              <li>✅ Alertas inteligentes do teto do MEI</li>
            </ul>
          </div>

          <Link
            href="/entrar"
            className="mt-8 block text-center rounded-2xl border-2 border-indigo-600 text-indigo-700 hover:bg-indigo-50 font-bold py-3 px-4 text-sm transition"
          >
            Usar versão gratuita do MVP
          </Link>
        </div>

        {/* Plano 3: Contador Parceiro */}
        <div className="bg-slate-900 text-white rounded-3xl p-7 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-emerald-400">
              Para Escritórios e Contadores
            </span>
            <h2 className="text-2xl font-extrabold mt-1">
              Contador Parceiro
            </h2>
            <p className="text-3xl font-extrabold mt-4">
              Grátis no MVP{' '}
              <span className="block text-xs font-normal text-slate-400 mt-1">
                (Futuro: planos por carteira de clientes)
              </span>
            </p>
            <p className="text-xs text-slate-300 mt-2">
              Receba os extratos dos seus clientes já padronizados e economize horas de digitação.
            </p>

            <ul className="mt-6 space-y-2.5 text-sm text-slate-200">
              <li>✅ Painel centralizado de clientes MEI e MPE</li>
              <li>✅ Download em lote de relatórios CSV/Excel e PDF</li>
              <li>✅ Observações do cliente em cada fechamento</li>
              <li>✅ Status de conferência contábil</li>
            </ul>
          </div>

          <Link
            href="/entrar"
            className="mt-8 block text-center rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3 px-4 text-sm transition"
          >
            Criar conta de Contador
          </Link>
        </div>
      </div>
    </div>
  );
}
