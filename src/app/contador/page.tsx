'use client';

import React, { useEffect, useState } from 'react';
import {
  listStatementBatches,
  saveStatementBatch,
} from '@/lib/supabase/client';
import {
  downloadOrganizedCsv,
  formatCurrencyBRL,
  formatDateBR,
  openPrintablePdfReport,
} from '@/lib/exporters/reportExporter';
import { CATEGORY_META } from '@/lib/parsers/bankStatementParser';
import { StatementBatch } from '@/types/saas';
import { EducationalTip } from '@/components/ui/EducationalTip';

export default function ContadorDashboardPage() {
  const [batches, setBatches] = useState<StatementBatch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loaded = listStatementBatches();
    setBatches(loaded);
    if (loaded[0]) {
      setSelectedBatchId(loaded[0].id);
    }
  }, []);

  const filteredBatches = batches.filter((b) => {
    if (!searchTerm.trim()) return true;
    const target = `${b.clientCompany} ${b.clientName} ${b.clientCnpj} ${b.referenceMonth}`.toLowerCase();
    return target.includes(searchTerm.toLowerCase());
  });

  const activeBatch =
    batches.find((b) => b.id === selectedBatchId) || filteredBatches[0] || null;

  function handleMarkReviewed(batch: StatementBatch) {
    const nextStatus = batch.status === 'reviewed' ? 'sent_to_accountant' : 'reviewed';
    const updatedList = saveStatementBatch({ ...batch, status: nextStatus });
    setBatches(updatedList);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Cabeçalho da Área do Contador */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-block bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-xs px-3 py-1 rounded-lg mb-2">
            👩‍💼 PAINEL DO CONTADOR PARCEIRO
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            Central de Clientes e Extratos Recebidos
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Visualize os extratos já organizados pelos seus clientes MEI e pequenas empresas e baixe os relatórios prontos para escrituração.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-800/90 border border-slate-700 rounded-2xl px-4 py-3 text-xs">
          <div>
            <span className="block text-slate-400">Clientes ativos no mês</span>
            <strong className="text-lg font-extrabold text-white">
              {batches.length} empresas
            </strong>
          </div>
        </div>
      </div>

      <EducationalTip
        title="Como o cliente envia o extrato para esta tela?"
        variant="emerald"
      >
        <p>
          Na <strong>Área da Empresa / MEI</strong>, seu cliente importa o arquivo OFX ou CSV do banco, revisa em linguagem simples o que foi venda, despesa ou retirada pessoal, e clica em <strong>&ldquo;Enviar para o Contador&rdquo;</strong>. O lote aparece imediatamente na lista abaixo!
        </p>
      </EducationalTip>

      <div className="grid lg:grid-cols-[0.95fr_1.45fr] gap-6 items-start">
        {/* Coluna Esquerda: Lista de Clientes e Lotes Enviados */}
        <section className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Clientes e Fechamentos Mensais
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Selecione um cliente para inspecionar as movimentações ou baixar os arquivos.
            </p>
          </div>

          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar cliente por nome, empresa ou CNPJ..."
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs sm:text-sm focus:border-indigo-500 focus:outline-none"
          />

          <div className="space-y-3">
            {filteredBatches.map((batch) => {
              const isSelected = activeBatch?.id === batch.id;
              return (
                <button
                  key={batch.id}
                  type="button"
                  onClick={() => setSelectedBatchId(batch.id)}
                  className={`w-full text-left rounded-2xl border p-4 transition ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/15'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-sm text-slate-900">
                      {batch.clientCompany}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        batch.status === 'reviewed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {batch.status === 'reviewed'
                        ? '✓ Conferido'
                        : 'Aguardando conferência'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Responsável: {batch.clientName} • CNPJ: {batch.clientCnpj}
                  </p>
                  <div className="mt-2.5 pt-2.5 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-indigo-700">
                      Competência: {batch.referenceMonth} ({batch.bankName})
                    </span>
                    <span className="font-bold text-emerald-700">
                      Receitas: {formatCurrencyBRL(batch.summary.totalIncome)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Coluna Direita: Detalhes do Extrato Selecionado */}
        {activeBatch ? (
          <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-slate-900">
                    {activeBatch.clientCompany}
                  </h2>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {activeBatch.referenceMonth}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  CNPJ: <strong>{activeBatch.clientCnpj}</strong> • Banco:{' '}
                  <strong>{activeBatch.bankName}</strong> • Arquivo:{' '}
                  <code>{activeBatch.sourceFilename}</code>
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openPrintablePdfReport(activeBatch)}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 text-xs sm:text-sm transition"
                >
                  📄 Baixar PDF
                </button>
                <button
                  type="button"
                  onClick={() => downloadOrganizedCsv(activeBatch)}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 text-xs sm:text-sm transition"
                >
                  📊 Baixar Planilha CSV/Excel
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkReviewed(activeBatch)}
                  className="rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold px-3.5 py-2 text-xs sm:text-sm transition"
                >
                  {activeBatch.status === 'reviewed'
                    ? 'Reabrir conferência'
                    : '✓ Marcar como Conferido'}
                </button>
              </div>
            </div>

            {/* Resumo numérico do cliente */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200 p-3.5">
                <span className="text-[11px] font-bold uppercase text-emerald-800">
                  Receitas (Vendas)
                </span>
                <p className="text-lg font-extrabold text-emerald-800 mt-0.5">
                  {formatCurrencyBRL(activeBatch.summary.totalIncome)}
                </p>
              </div>
              <div className="rounded-2xl bg-rose-50/70 border border-rose-200 p-3.5">
                <span className="text-[11px] font-bold uppercase text-rose-800">
                  Despesas PJ
                </span>
                <p className="text-lg font-extrabold text-rose-800 mt-0.5">
                  {formatCurrencyBRL(activeBatch.summary.totalExpense)}
                </p>
              </div>
              <div className="rounded-2xl bg-sky-50/70 border border-sky-200 p-3.5">
                <span className="text-[11px] font-bold uppercase text-sky-800">
                  Transf. / Sócio
                </span>
                <p className="text-lg font-extrabold text-sky-800 mt-0.5">
                  {formatCurrencyBRL(activeBatch.summary.totalTransfer)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5">
                <span className="text-[11px] font-bold uppercase text-slate-600">
                  Resultado Líquido
                </span>
                <p className="text-lg font-extrabold text-slate-900 mt-0.5">
                  {formatCurrencyBRL(activeBatch.summary.netResult)}
                </p>
              </div>
            </div>

            {activeBatch.clientNotes && (
              <div className="rounded-2xl bg-amber-50/80 border border-amber-200 p-4 text-xs sm:text-sm text-amber-950">
                <strong>💬 Observação enviada pelo cliente:</strong>{' '}
                {activeBatch.clientNotes}
              </div>
            )}

            {/* Tabela de lançamentos enviados */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-3.5 py-2.5">Data</th>
                    <th className="px-3.5 py-2.5">Histórico Bancário</th>
                    <th className="px-3.5 py-2.5">Categoria Informada</th>
                    <th className="px-3.5 py-2.5 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeBatch.transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="px-3.5 py-2.5 whitespace-nowrap font-medium text-slate-700">
                        {formatDateBR(tx.date)}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <p className="font-semibold text-slate-900">
                          {tx.description}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {tx.plainExplanation}
                        </p>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span
                          className={`inline-block rounded-lg border px-2.5 py-0.5 text-[11px] font-bold ${
                            CATEGORY_META[tx.category].badgeClass
                          }`}
                        >
                          {CATEGORY_META[tx.category].label}
                        </span>
                      </td>
                      <td
                        className={`px-3.5 py-2.5 text-right whitespace-nowrap font-extrabold ${
                          tx.amount >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {formatCurrencyBRL(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-500">
            Nenhum lote de extrato selecionado.
          </div>
        )}
      </div>
    </div>
  );
}
