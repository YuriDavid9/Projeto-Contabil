'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CATEGORY_META,
  calculateSummary,
  getDemoStatementTransactions,
  parseCsvContent,
  parseOfxContent,
} from '@/lib/parsers/bankStatementParser';
import {
  downloadOrganizedCsv,
  formatCurrencyBRL,
  formatDateBR,
  openPrintablePdfReport,
} from '@/lib/exporters/reportExporter';
import {
  getSavedUserProfile,
  loginAsDemoProfile,
  saveStatementBatch,
} from '@/lib/supabase/client';
import {
  BankTransaction,
  StatementBatch,
  TransactionCategory,
  UserProfile,
} from '@/types/saas';
import { EducationalTip } from '@/components/ui/EducationalTip';

export default function MeiExtratosPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [bankName, setBankName] = useState('Banco Cora / Nubank PJ (Exemplo)');
  const [referenceMonth, setReferenceMonth] = useState('2026-10');
  const [sourceFilename, setSourceFilename] = useState('extrato-exemplo-mei.ofx');
  const [sourceFormat, setSourceFormat] = useState<'OFX' | 'CSV' | 'DEMO'>('DEMO');
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [filterCategory, setFilterCategory] = useState<'todas' | TransactionCategory>('todas');
  const [clientNotes, setClientNotes] = useState(
    'Transferência do dia 18/10 foi retirada para minha conta pessoal. Todas as vendas PIX tiveram nota emitida.'
  );
  const [statusMessage, setStatusMessage] = useState<{
    type: 'ok' | 'info' | 'err';
    text: string;
  } | null>(null);

  useEffect(() => {
    let profile = getSavedUserProfile();
    if (!profile) {
      profile = loginAsDemoProfile('mei');
    }
    setUser(profile);

    // Carrega o exemplo inicial para que o usuário já veja como fica organizado
    const demo = getDemoStatementTransactions();
    setBankName(demo.bankName);
    setReferenceMonth(demo.referenceMonth);
    setTransactions(demo.transactions);
  }, []);

  function handleLoadDemo() {
    const demo = getDemoStatementTransactions();
    setBankName(demo.bankName);
    setReferenceMonth(demo.referenceMonth);
    setSourceFilename('extrato-exemplo-mei.ofx');
    setSourceFormat('DEMO');
    setTransactions(demo.transactions);
    setStatusMessage({
      type: 'info',
      text: 'Carregamos um extrato de exemplo com 11 movimentações comuns de um MEI para você ver como tudo fica organizado.',
    });
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lowerName = file.name.toLowerCase();

    if (lowerName.endsWith('.ofx') || /<OFX>/i.test(text) || /<STMTTRN>/i.test(text)) {
      const parsed = parseOfxContent(text);
      if (!parsed.transactions.length) {
        setStatusMessage({
          type: 'err',
          text: 'Não encontramos movimentações válidas neste arquivo OFX. Verifique se baixou o extrato do período correto.',
        });
        return;
      }
      setBankName(parsed.bankName);
      setReferenceMonth(parsed.referenceMonth);
      setSourceFilename(file.name);
      setSourceFormat('OFX');
      setTransactions(parsed.transactions);
      setStatusMessage({
        type: 'ok',
        text: `Pronto! Lemos ${parsed.transactions.length} movimentações do arquivo "${file.name}" e já separamos por categoria.`,
      });
    } else {
      const parsed = parseCsvContent(text);
      if (!parsed.transactions.length) {
        setStatusMessage({
          type: 'err',
          text: 'Não conseguimos ler linhas de movimentação neste CSV. Certifique-se de que o arquivo possui Data, Descrição e Valor.',
        });
        return;
      }
      setBankName(parsed.bankName);
      setReferenceMonth(parsed.referenceMonth);
      setSourceFilename(file.name);
      setSourceFormat('CSV');
      setTransactions(parsed.transactions);
      setStatusMessage({
        type: 'ok',
        text: `Pronto! Lemos ${parsed.transactions.length} movimentações da planilha "${file.name}" e classificamos automaticamente.`,
      });
    }
  }

  function handleCategoryChange(txId: string, newCat: TransactionCategory) {
    setTransactions((prev) =>
      prev.map((tx) =>
        tx.id === txId
          ? {
              ...tx,
              category: newCat,
              plainExplanation: CATEGORY_META[newCat].shortMeaning,
              confidenceNote: 'Ajustado manualmente por você.',
            }
          : tx
      )
    );
  }

  const summary = calculateSummary(transactions);

  function buildCurrentBatch(
    status: 'organized' | 'sent_to_accountant' = 'organized'
  ): StatementBatch {
    return {
      id: `batch-${referenceMonth}-${sourceFilename.replace(/[^a-z0-9]/gi, '')}`,
      clientId: user?.id || 'demo-mei-001',
      clientName: user?.displayName || 'Carlos Silva',
      clientCompany: user?.companyName || 'Carlos Silva Panificação MEI',
      clientCnpj: user?.cnpj || '45.123.789/0001-90',
      referenceMonth,
      bankName,
      sourceFilename,
      sourceFormat,
      status,
      summary,
      transactions,
      clientNotes: clientNotes.trim(),
      sentAt: status === 'sent_to_accountant' ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
    };
  }

  function handleSendToAccountant() {
    const batch = buildCurrentBatch('sent_to_accountant');
    saveStatementBatch(batch);
    setStatusMessage({
      type: 'ok',
      text: 'Relatório salvo e enviado para a Área do Contador! Seu contador já pode visualizar e baixar este fechamento.',
    });
  }

  const filteredTransactions =
    filterCategory === 'todas'
      ? transactions
      : transactions.filter((t) => t.category === filterCategory);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Topo com migalha de pão e título */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/mei"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-800 mb-2"
          >
            ← Voltar ao Dashboard da Empresa / MEI
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Organizador de Extrato Bancário
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            Envie o arquivo do seu banco (OFX ou CSV). Nós separamos tudo e preparamos o relatório que o seu contador precisa.
          </p>
        </div>
      </div>

      {/* Passo 1: Upload do Extrato + Explicação */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6 items-center">
          <div>
            <span className="inline-block bg-indigo-50 text-indigo-700 font-bold text-xs px-3 py-1 rounded-lg mb-2">
              ETAPA 1 DE 3 • ESCOLHA SEU EXTRATO
            </span>
            <h2 className="text-xl font-extrabold text-slate-900">
              Coloque aqui o arquivo do seu banco
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 mb-4 leading-relaxed">
              No aplicativo do seu banco (Nubank, Inter, Cora, Itaú, Bradesco, BB), vá em <strong>Extrato → Exportar</strong> e escolha o formato <strong>OFX</strong> ou <strong>CSV</strong>.
            </p>

            <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50/40 hover:bg-indigo-50/80 hover:border-indigo-500 p-6 text-center transition">
              <div className="text-3xl mb-2">📥</div>
              <span className="block font-extrabold text-slate-900 text-sm sm:text-base">
                Clique para escolher seu extrato (.OFX ou .CSV)
              </span>
              <span className="block text-xs text-slate-500 mt-1">
                Leitura instantânea e segura. Seus números são organizados na hora.
              </span>
              <input
                type="file"
                accept=".ofx,.csv,text/csv,application/x-ofx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleLoadDemo}
                className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2 text-xs sm:text-sm transition"
              >
                🔄 Recarregar Extrato de Exemplo (MEI)
              </button>
              <span className="text-xs text-slate-500">
                Arquivo atual: <strong>{sourceFilename}</strong> ({bankName})
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <EducationalTip
              title="Qual a diferença entre OFX e PDF?"
              variant="emerald"
            >
              <p>
                O PDF é como uma &ldquo;foto&rdquo; do extrato, difícil para o sistema do contador somar. Já o arquivo <strong>OFX</strong> ou <strong>CSV</strong> vem com as datas e valores prontos para organizar sem erro de digitação!
              </p>
            </EducationalTip>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`mt-5 rounded-2xl border px-4 py-3 text-xs sm:text-sm font-semibold ${
              statusMessage.type === 'ok'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : statusMessage.type === 'err'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-indigo-50 border-indigo-200 text-indigo-900'
            }`}
          >
            {statusMessage.text}
          </div>
        )}
      </section>

      {/* Passo 2: Resumo Automático das 4 Categorias + Explicações */}
      <section className="space-y-4">
        <div>
          <span className="inline-block bg-indigo-50 text-indigo-700 font-bold text-xs px-3 py-1 rounded-lg mb-1">
            ETAPA 2 DE 3 • ENTENDA E CONFIRA A CLASSIFICAÇÃO
          </span>
          <h2 className="text-xl font-extrabold text-slate-900">
            Como o seu dinheiro se movimentou em {referenceMonth}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Separamos suas movimentações em 4 grupos simples. Clique em qualquer grupo para filtrar a lista abaixo.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() =>
              setFilterCategory(filterCategory === 'receita' ? 'todas' : 'receita')
            }
            className={`text-left rounded-2xl border p-5 transition shadow-sm ${
              filterCategory === 'receita'
                ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/40'
                : 'bg-white border-slate-200 hover:border-emerald-400'
            }`}
          >
            <span className="text-xs font-bold uppercase text-emerald-700">
              1. Receitas (Vendas)
            </span>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">
              {formatCurrencyBRL(summary.totalIncome)}
            </p>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {CATEGORY_META.receita.shortMeaning}
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              setFilterCategory(filterCategory === 'despesa' ? 'todas' : 'despesa')
            }
            className={`text-left rounded-2xl border p-5 transition shadow-sm ${
              filterCategory === 'despesa'
                ? 'border-rose-600 ring-2 ring-rose-500/20 bg-rose-50/40'
                : 'bg-white border-slate-200 hover:border-rose-400'
            }`}
          >
            <span className="text-xs font-bold uppercase text-rose-700">
              2. Despesas da Empresa
            </span>
            <p className="text-2xl font-extrabold text-rose-700 mt-1">
              {formatCurrencyBRL(summary.totalExpense)}
            </p>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {CATEGORY_META.despesa.shortMeaning}
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              setFilterCategory(
                filterCategory === 'transferencia' ? 'todas' : 'transferencia'
              )
            }
            className={`text-left rounded-2xl border p-5 transition shadow-sm ${
              filterCategory === 'transferencia'
                ? 'border-sky-600 ring-2 ring-sky-500/20 bg-sky-50/40'
                : 'bg-white border-slate-200 hover:border-sky-400'
            }`}
          >
            <span className="text-xs font-bold uppercase text-sky-700">
              3. Transferências Próprias
            </span>
            <p className="text-2xl font-extrabold text-sky-700 mt-1">
              {formatCurrencyBRL(summary.totalTransfer)}
            </p>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {CATEGORY_META.transferencia.shortMeaning}
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              setFilterCategory(filterCategory === 'outros' ? 'todas' : 'outros')
            }
            className={`text-left rounded-2xl border p-5 transition shadow-sm ${
              filterCategory === 'outros'
                ? 'border-amber-600 ring-2 ring-amber-500/20 bg-amber-50/40'
                : 'bg-white border-slate-200 hover:border-amber-400'
            }`}
          >
            <span className="text-xs font-bold uppercase text-amber-800">
              4. Outros (Conferir)
            </span>
            <p className="text-2xl font-extrabold text-amber-800 mt-1">
              {formatCurrencyBRL(summary.totalOther)}
            </p>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {CATEGORY_META.outros.shortMeaning}
            </p>
          </button>
        </div>
      </section>

      {/* Tabela Clara de Movimentações Organizadas */}
      <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
              Movimentações Organizadas ({filteredTransactions.length})
            </h3>
            <p className="text-xs text-slate-500">
              Se alguma classificação automática precisar de ajuste, basta trocar na coluna &ldquo;O que foi isso?&rdquo;.
            </p>
          </div>
          {filterCategory !== 'todas' && (
            <button
              type="button"
              onClick={() => setFilterCategory('todas')}
              className="self-start sm:self-auto rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700"
            >
              Mostrar todas as categorias
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Descrição no Banco & Explicação Simples</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3">O que foi isso? (Classificação)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3.5 whitespace-nowrap font-semibold text-slate-700">
                    {formatDateBR(tx.date)}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-bold text-slate-900">{tx.description}</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      💬 {tx.plainExplanation}
                    </p>
                  </td>
                  <td
                    className={`px-4 py-3.5 text-right whitespace-nowrap font-extrabold ${
                      tx.amount >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {formatCurrencyBRL(tx.amount)}
                  </td>
                  <td className="px-4 py-3.5">
                    <select
                      value={tx.category}
                      onChange={(e) =>
                        handleCategoryChange(
                          tx.id,
                          e.target.value as TransactionCategory
                        )
                      }
                      aria-label={`Classificação para ${tx.description}`}
                      className={`w-full rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none ${
                        CATEGORY_META[tx.category].badgeClass
                      }`}
                    >
                      <option value="receita">Receita (Venda / Serviço)</option>
                      <option value="despesa">Despesa da Empresa</option>
                      <option value="transferencia">
                        Transferência / Retirada Pessoal
                      </option>
                      <option value="outros">Outros (Dúvida)</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Passo 3: Observação + Botões para Baixar PDF/Excel ou Enviar ao Contador */}
      <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg">
        <span className="inline-block bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-xs px-3 py-1 rounded-lg mb-2">
          ETAPA 3 DE 3 • ENTREGUE PRONTO AO SEU CONTADOR
        </span>
        <h2 className="text-xl sm:text-2xl font-extrabold">
          Gere seu relatório organizado ou envie direto para a contabilidade
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
          Você pode deixar um recado rápido abaixo se quiser explicar algum lançamento específico para o seu contador.
        </p>

        <div className="mt-4">
          <label
            htmlFor="client-notes"
            className="block text-xs font-bold uppercase tracking-wide text-slate-300 mb-1.5"
          >
            Recado opcional para o seu contador
          </label>
          <textarea
            id="client-notes"
            rows={2}
            value={clientNotes}
            onChange={(e) => setClientNotes(e.target.value)}
            placeholder="Ex.: A transferência do dia 18 foi retirada para minha conta pessoal..."
            className="w-full rounded-2xl border border-slate-700 bg-slate-800/90 text-white px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => openPrintablePdfReport(buildCurrentBatch('organized'))}
            className="rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold px-5 py-3.5 text-xs sm:text-sm transition shadow-sm"
          >
            📄 Gerar e Baixar Relatório em PDF
          </button>

          <button
            type="button"
            onClick={() => downloadOrganizedCsv(buildCurrentBatch('organized'))}
            className="rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold px-5 py-3.5 text-xs sm:text-sm transition shadow-sm"
          >
            📊 Baixar Planilha Excel / CSV
          </button>

          <button
            type="button"
            onClick={handleSendToAccountant}
            className="rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-6 py-3.5 text-xs sm:text-sm transition shadow-sm"
          >
            🚀 Enviar direto para a Área do Contador
          </button>
        </div>
      </section>
    </div>
  );
}
