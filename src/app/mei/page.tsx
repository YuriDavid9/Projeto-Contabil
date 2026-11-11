'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getMeiChecklist,
  getSavedUserProfile,
  listStatementBatches,
  loginAsDemoProfile,
  toggleMeiChecklistItem,
} from '@/lib/supabase/client';
import {
  downloadOrganizedCsv,
  formatCurrencyBRL,
  openPrintablePdfReport,
} from '@/lib/exporters/reportExporter';
import { MeiChecklistItem, StatementBatch, UserProfile } from '@/types/saas';
import { EducationalTip } from '@/components/ui/EducationalTip';

const MEI_ANNUAL_LIMIT = 81000;

export default function MeiDashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [batches, setBatches] = useState<StatementBatch[]>([]);
  const [checklist, setChecklist] = useState<MeiChecklistItem[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('2026-10');

  useEffect(() => {
    let profile = getSavedUserProfile();
    if (!profile) {
      profile = loginAsDemoProfile('mei');
    }
    setUser(profile);
    setBatches(listStatementBatches());
    setChecklist(getMeiChecklist(selectedMonth));
  }, [selectedMonth]);

  function handleToggleTask(key: string) {
    const updated = toggleMeiChecklistItem(key, selectedMonth);
    setChecklist(updated);
  }

  const latestBatch = batches[0] || null;
  const totalRevenueAllBatches = batches.reduce(
    (acc, b) => acc + (b.summary?.totalIncome || 0),
    0
  );
  const meiLimitPercent = Math.min(
    100,
    Math.round((totalRevenueAllBatches / MEI_ANNUAL_LIMIT) * 100)
  );
  const completedTasksCount = checklist.filter((t) => t.completed).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Cabeçalho de boas-vindas da Empresa / MEI */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-bold text-indigo-700 mb-2">
            🏢 Área da Empresa / MEI
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Olá, {user?.displayName || 'Empreendedor(a)'}!
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            {user?.companyName || 'Sua Empresa MEI'}{' '}
            {user?.cnpj ? `• CNPJ ${user.cnpj}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/mei/extratos"
            className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 py-3.5 text-sm shadow-md shadow-indigo-600/20 transition"
          >
            + Enviar e Organizar Extrato (OFX / CSV)
          </Link>
        </div>
      </div>

      {/* Explicação simples do painel */}
      <EducationalTip
        title="Para que serve este painel?"
        variant="indigo"
      >
        <p>
          Aqui você acompanha de um jeito simples quanto entrou de <strong>vendas (Receitas)</strong>, quanto saiu com <strong>contas da empresa (Despesas)</strong> e o que falta fazer no mês para manter seu CNPJ 100% em dia com o seu contador.
        </p>
      </EducationalTip>

      {/* Indicadores do último extrato organizado */}
      {latestBatch && (
        <section aria-label="Resumo do último extrato organizado">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Resumo do último extrato ({latestBatch.referenceMonth})
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Origem: <strong>{latestBatch.bankName}</strong> ({latestBatch.sourceFilename})
              </p>
            </div>
            <Link
              href="/mei/extratos"
              className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-800 underline"
            >
              Ver todas as movimentações detalhadas →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                Receitas (Vendas/Serviços)
              </span>
              <p className="text-2xl font-extrabold text-emerald-700 mt-1">
                {formatCurrencyBRL(latestBatch.summary.totalIncome)}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Dinheiro que entrou de clientes. Conta para o faturamento do MEI.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-rose-200 p-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wide text-rose-700">
                Despesas da Empresa
              </span>
              <p className="text-2xl font-extrabold text-rose-700 mt-1">
                {formatCurrencyBRL(latestBatch.summary.totalExpense)}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Pagamentos de fornecedores, luz, internet, guia DAS e tarifas.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-sky-200 p-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wide text-sky-700">
                Transferências / Pessoal
              </span>
              <p className="text-2xl font-extrabold text-sky-700 mt-1">
                {formatCurrencyBRL(latestBatch.summary.totalTransfer)}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Retiradas para sua conta pessoal ou dinheiro guardado em CDB/caixinha.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
                Sobra Operacional do Mês
              </span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {formatCurrencyBRL(latestBatch.summary.netResult)}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Receitas menos Despesas da empresa neste extrato.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Termômetro educativo do Limite Anual do MEI */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Termômetro do Limite Anual do MEI (Informativo)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              O limite de faturamento bruto anual do MEI é de <strong>R$ 81.000,00</strong> (média de R$ 6.750,00 por mês em vendas).
            </p>
          </div>
          <span className="inline-block bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs px-3 py-1.5 rounded-xl">
            {formatCurrencyBRL(totalRevenueAllBatches)} de R$ 81.000,00 ({meiLimitPercent}%)
          </span>
        </div>

        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all"
            style={{ width: `${Math.max(4, meiLimitPercent)}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-2.5">
          💡 <strong>Importante saber:</strong> O limite do MEI considera tudo o que a empresa <strong>vendeu (Receitas)</strong> no ano, e não apenas o lucro que sobrou. Por isso separar transferências pessoais de vendas reais no extrato é tão importante!
        </p>
      </section>

      {/* Grid Principal: Checklist Mensal do MEI + Extratos Enviados ao Contador */}
      <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6">
        {/* Checklist Mensal de Obrigações do MEI */}
        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                ✅ Checklist Mensal do MEI
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Marque o que você já fez neste mês ({completedTasksCount} de {checklist.length} concluídas).
              </p>
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              aria-label="Selecionar mês do checklist"
              className="rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm font-semibold bg-slate-50"
            >
              <option value="2026-10">Outubro / 2026</option>
              <option value="2026-11">Novembro / 2026</option>
            </select>
          </div>

          <div className="space-y-3">
            {checklist.map((item) => (
              <label
                key={item.key}
                className={`flex items-start gap-3.5 rounded-2xl border p-4 cursor-pointer transition ${
                  item.completed
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-slate-50/70 border-slate-200 hover:border-indigo-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => handleToggleTask(item.key)}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`text-sm font-extrabold ${
                        item.completed ? 'line-through text-slate-500' : 'text-slate-900'
                      }`}
                    >
                      {item.title}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                      📅 {item.dueDayHint}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {item.simpleExplanation}
                  </p>
                  <p className="text-[11px] text-indigo-700 font-medium mt-1">
                    <strong>Por que importa:</strong> {item.whyItMatters}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* Histórico de Extratos e Relatórios para o Contador */}
        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              📂 Meus Extratos Organizados
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 mb-4">
              Baixe o relatório em PDF ou Excel a qualquer hora para mandar ao seu contador.
            </p>

            <div className="space-y-3">
              {batches.map((b) => (
                <div
                  key={b.id}
                  className="rounded-2xl border border-slate-200 p-4 bg-slate-50/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-sm text-slate-900">
                      Competência {b.referenceMonth}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md ${
                        b.status === 'sent_to_accountant'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {b.status === 'sent_to_accountant'
                        ? '✓ Enviado ao Contador'
                        : 'Organizado'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {b.bankName} • {b.summary.transactionCount} movimentações
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openPrintablePdfReport(b)}
                      className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 text-xs transition"
                    >
                      📄 Relatório PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadOrganizedCsv(b)}
                      className="rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold px-3 py-1.5 text-xs transition"
                    >
                      📊 Baixar Excel/CSV
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              href="/mei/extratos"
              className="block w-full text-center rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 text-xs sm:text-sm transition"
            >
              Organizar novo extrato bancário →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
