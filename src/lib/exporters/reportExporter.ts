import { StatementBatch } from '@/types/saas';
import { CATEGORY_META } from '@/lib/parsers/bankStatementParser';

export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

export function formatDateBR(isoDate: string): string {
  const parts = String(isoDate || '').split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function downloadOrganizedCsv(batch: StatementBatch): void {
  const header = [
    'Data',
    'Descricao Original no Extrato',
    'Valor (R$)',
    'Classificacao para o Contador',
    'Explicacao Simples',
  ];

  const rows = batch.transactions.map((tx) => [
    formatDateBR(tx.date),
    `"${tx.description.replace(/"/g, '""')}"`,
    tx.amount.toFixed(2).replace('.', ','),
    `"${CATEGORY_META[tx.category].label}"`,
    `"${tx.plainExplanation.replace(/"/g, '""')}"`,
  ]);

  const summaryBlock = [
    [],
    ['RESUMO DO MES PARA A CONTABILIDADE', batch.referenceMonth],
    ['Empresa / MEI', `"${batch.clientCompany || batch.clientName}"`],
    ['CNPJ', `"${batch.clientCnpj || 'Não informado'}"`],
    ['Banco / Origem', `"${batch.bankName}"`],
    ['Total de Receitas (Vendas/Servicos)', batch.summary.totalIncome.toFixed(2).replace('.', ',')],
    ['Total de Despesas da Empresa', batch.summary.totalExpense.toFixed(2).replace('.', ',')],
    ['Total de Transferencias / Movimentacoes Proprias', batch.summary.totalTransfer.toFixed(2).replace('.', ',')],
    ['Outros a Conferir', batch.summary.totalOther.toFixed(2).replace('.', ',')],
    ['Resultado Operacional (Receitas - Despesas)', batch.summary.netResult.toFixed(2).replace('.', ',')],
  ];

  const csvContent =
    '\uFEFF' +
    [header.join(';'), ...rows.map((r) => r.join(';')), ...summaryBlock.map((r) => r.join(';'))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `relatorio-contabil-${batch.referenceMonth}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function openPrintablePdfReport(batch: StatementBatch): void {
  const printWindow = window.open('', '_blank', 'width=960,height=800');
  if (!printWindow) {
    alert('Permita pop-ups no navegador para gerar o relatório em PDF.');
    return;
  }

  const rowsHtml = batch.transactions
    .map(
      (tx) => `
      <tr>
        <td>${formatDateBR(tx.date)}</td>
        <td>
          <strong>${tx.description}</strong>
          <div class="sub">${tx.plainExplanation}</div>
        </td>
        <td>${CATEGORY_META[tx.category].label}</td>
        <td style="text-align:right;font-weight:700;color:${tx.amount >= 0 ? '#047857' : '#be123c'}">
          ${formatCurrencyBRL(tx.amount)}
        </td>
      </tr>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Relatório Bancário Organizado — ${batch.referenceMonth}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 32px; line-height: 1.45; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; }
        h1 { margin: 0; font-size: 22px; color: #1e1b4b; }
        .meta { font-size: 13px; color: #475569; margin-top: 4px; }
        .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        .card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; background: #f8fafc; }
        .card-title { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; }
        .card-value { font-size: 18px; font-weight: 800; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #f1f5f9; text-align: left; padding: 10px; border-bottom: 2px solid #cbd5e1; font-size: 11px; text-transform: uppercase; color: #334155; }
        td { padding: 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
        .sub { font-size: 11px; color: #64748b; margin-top: 2px; }
        .footer { margin-top: 24px; font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        @media print { .no-print { display: none; } body { margin: 12px; } }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom:16px;padding:12px;background:#eef2ff;border:1px solid #c7d2fe;border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:13px;color:#312e81;"><strong>Dica:</strong> Na janela de impressão, escolha <strong>"Salvar como PDF"</strong> para baixar o arquivo pronto para o seu contador.</span>
        <button onclick="window.print()" style="background:#4f46e5;color:#fff;border:0;padding:8px 16px;border-radius:6px;font-weight:700;cursor:pointer;">Salvar em PDF / Imprimir</button>
      </div>
      <div class="header">
        <div>
          <h1>Relatório de Extrato Organizado para Contabilidade</h1>
          <div class="meta">Empresa / MEI: <strong>${batch.clientCompany || batch.clientName}</strong> • CNPJ: <strong>${batch.clientCnpj || 'Não informado'}</strong></div>
          <div class="meta">Banco: <strong>${batch.bankName}</strong> • Competência: <strong>${batch.referenceMonth}</strong></div>
        </div>
        <div style="text-align:right;font-size:12px;color:#475569;">
          <strong>AutoContábil</strong><br>
          Gerado em ${new Date().toLocaleDateString('pt-BR')}
        </div>
      </div>

      <div class="cards">
        <div class="card">
          <div class="card-title">Receitas (Vendas)</div>
          <div class="card-value" style="color:#047857;">${formatCurrencyBRL(batch.summary.totalIncome)}</div>
        </div>
        <div class="card">
          <div class="card-title">Despesas da Empresa</div>
          <div class="card-value" style="color:#be123c;">${formatCurrencyBRL(batch.summary.totalExpense)}</div>
        </div>
        <div class="card">
          <div class="card-title">Transferências Próprias</div>
          <div class="card-value" style="color:#0369a1;">${formatCurrencyBRL(batch.summary.totalTransfer)}</div>
        </div>
        <div class="card">
          <div class="card-title">Saldo Operacional</div>
          <div class="card-value">${formatCurrencyBRL(batch.summary.netResult)}</div>
        </div>
      </div>

      ${
        batch.clientNotes
          ? `<div style="margin-bottom:18px;padding:12px;background:#f8fafc;border-left:4px solid #6366f1;font-size:12px;"><strong>Observações do cliente para o contador:</strong> ${batch.clientNotes}</div>`
          : ''
      }

      <table>
        <thead>
          <tr>
            <th style="width:90px;">Data</th>
            <th>Descrição e Explicação</th>
            <th style="width:210px;">Classificação Sugerida</th>
            <th style="width:120px;text-align:right;">Valor</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="footer">
        Relatório organizado automaticamente pelo AutoContábil para facilitar a conferência contábil. Documento auxiliar informativo — sujeito à validação do contador responsável.
      </div>
      <script>setTimeout(() => window.print(), 350);</script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
