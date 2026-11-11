import { BankTransaction, StatementSummary, TransactionCategory } from '@/types/saas';

export const CATEGORY_META: Record<
  TransactionCategory,
  {
    label: string;
    shortMeaning: string;
    accountantTip: string;
    badgeClass: string;
  }
> = {
  receita: {
    label: 'Receita (Entrada de Vendas/Serviços)',
    shortMeaning: 'Dinheiro que entrou porque você vendeu um produto ou prestou um serviço.',
    accountantTip: 'Soma no faturamento mensal da empresa (conta para o limite anual do MEI).',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  despesa: {
    label: 'Despesa (Gasto da Empresa)',
    shortMeaning: 'Contas pagas para manter o negócio funcionando (fornecedores, luz, internet, DAS, tarifas).',
    accountantTip: 'Ajuda o contador a comprovar os custos da empresa e calcular o lucro real.',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  transferencia: {
    label: 'Transferência / Movimentação Própria',
    shortMeaning: 'Dinheiro transferido entre contas suas, guardado em caixinha/CDB ou retirada pessoal.',
    accountantTip: 'Importante separar para o contador não confundir transferência própria com venda nova.',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  outros: {
    label: 'Outros (Conferir)',
    shortMeaning: 'Movimentação com descrição genérica que vale uma olhada rápida.',
    accountantTip: 'Se souber do que se trata, você pode mudar a categoria com um clique na lista.',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
};

function normalizeText(value: string): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function classifyTransaction(
  description: string,
  amount: number
): {
  category: TransactionCategory;
  plainExplanation: string;
  confidenceNote: string;
} {
  const norm = normalizeText(description);

  // 1. Transferências entre contas próprias, investimentos ou retiradas de sócio/MEI
  if (
    /mesma titularidade|conta propria|aplicacao|resgate|cdb|poupanca|caixinha|rdb|pro-labore|retirada socio|transf entre contas/.test(
      norm
    )
  ) {
    return {
      category: 'transferencia',
      plainExplanation:
        amount >= 0
          ? 'Parece um resgate de dinheiro guardado ou transferência vinda de outra conta sua (não é venda).'
          : 'Parece dinheiro guardado em aplicação ou transferido para sua conta pessoal.',
      confidenceNote: 'Identificado automaticamente pelo termo de transferência/aplicação.',
    };
  }

  // 2. Entradas (Valores positivos)
  if (amount > 0) {
    if (/estorno|devolucao|reembolso/.test(norm)) {
      return {
        category: 'outros',
        plainExplanation: 'Entrada por estorno ou devolução de um pagamento anterior.',
        confidenceNote: 'Verifique se refere a uma compra cancelada.',
      };
    }

    if (/pix receb|recebimento|venda|cartao|stone|pagseguro|mercadopago|cielo|rede|boleto receb|cliente|nf/.test(norm)) {
      return {
        category: 'receita',
        plainExplanation: 'Dinheiro recebido de cliente por venda ou serviço prestado.',
        confidenceNote: 'Classificado como Receita de vendas/serviços.',
      };
    }

    return {
      category: 'receita',
      plainExplanation: 'Entrada de dinheiro na conta da empresa. Se não foi venda (ex.: dinheiro seu colocado na conta), mude para Transferência.',
      confidenceNote: 'Entrada positiva classificada por padrão como Receita.',
    };
  }

  // 3. Saídas (Valores negativos)
  if (/das mei|simples nacional|darf|imposto|sefaz|prefeitura|taxa|tarifa|iof|manutencao conta|cesta/.test(norm)) {
    return {
      category: 'despesa',
      plainExplanation: 'Pagamento de guia de imposto (como o DAS do MEI) ou tarifa cobrada pelo banco.',
      confidenceNote: 'Imposto ou tarifa bancária identificada.',
    };
  }

  if (
    /fornecedor|energia|energisa|enel|cemig|agua|sabesp|internet|vivo|claro|tim|aluguel|boleto|compra|pagamento|pix enviado|uber|combustivel|papelaria|estoque|mercadoria/.test(
      norm
    )
  ) {
    return {
      category: 'despesa',
      plainExplanation: 'Pagamento de conta do dia a dia da empresa (fornecedor, serviço ou insumo).',
      confidenceNote: 'Despesa operacional identificada.',
    };
  }

  if (/transf|ted|doc/.test(norm)) {
    return {
      category: 'transferencia',
      plainExplanation: 'Saída por transferência. Confira se foi para sua conta pessoal (Transferência) ou pagamento de fornecedor (Despesa).',
      confidenceNote: 'Transferência bancária: confirme o destino.',
    };
  }

  return {
    category: 'despesa',
    plainExplanation: 'Saída de dinheiro da conta. Caso tenha sido uma retirada para uso pessoal, altere para "Transferência".',
    confidenceNote: 'Saída classificada como Despesa.',
  };
}

export function calculateSummary(transactions: BankTransaction[]): StatementSummary {
  let totalIncome = 0;
  let totalExpense = 0;
  let totalTransfer = 0;
  let totalOther = 0;

  for (const tx of transactions) {
    if (tx.category === 'receita') {
      totalIncome += Math.abs(tx.amount);
    } else if (tx.category === 'despesa') {
      totalExpense += Math.abs(tx.amount);
    } else if (tx.category === 'transferencia') {
      totalTransfer += Math.abs(tx.amount);
    } else {
      totalOther += Math.abs(tx.amount);
    }
  }

  return {
    totalIncome: Number(totalIncome.toFixed(2)),
    totalExpense: Number(totalExpense.toFixed(2)),
    totalTransfer: Number(totalTransfer.toFixed(2)),
    totalOther: Number(totalOther.toFixed(2)),
    netResult: Number((totalIncome - totalExpense).toFixed(2)),
    transactionCount: transactions.length,
  };
}

function parseBrOrIsoNumber(raw: string): number {
  const cleaned = String(raw || '').trim().replace(/\s+/g, '');
  if (!cleaned) return 0;
  if (cleaned.includes(',') && cleaned.includes('.')) {
    return Number(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
  }
  if (cleaned.includes(',')) {
    return Number(cleaned.replace(',', '.')) || 0;
  }
  return Number(cleaned) || 0;
}

function parseFlexibleDate(raw: string): string {
  const clean = String(raw || '').trim();
  const ofxMatch = clean.match(/^(\d{4})(\d{2})(\d{2})/);
  if (ofxMatch) {
    return `${ofxMatch[1]}-${ofxMatch[2]}-${ofxMatch[3]}`;
  }
  const brMatch = clean.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) {
    return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
  }
  const isoMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }
  return new Date().toISOString().slice(0, 10);
}

export function parseOfxContent(content: string): {
  bankName: string;
  referenceMonth: string;
  transactions: BankTransaction[];
} {
  const orgMatch = content.match(/<ORG>([^<\r\n]+)/i);
  const bankIdMatch = content.match(/<BANKID>([^<\r\n]+)/i);
  const bankName = orgMatch?.[1]?.trim() || (bankIdMatch ? `Banco ${bankIdMatch[1].trim()}` : 'Extrato OFX');

  const blocks = content.split(/<STMTTRN>/i).slice(1);
  const transactions: BankTransaction[] = [];

  blocks.forEach((block, index) => {
    const dtMatch = block.match(/<DTPOSTED>([^<\r\n]+)/i);
    const amtMatch = block.match(/<TRNAMT>([^<\r\n]+)/i);
    const memoMatch = block.match(/<MEMO>([^<\r\n]+)/i);
    const nameMatch = block.match(/<NAME>([^<\r\n]+)/i);

    const date = parseFlexibleDate(dtMatch?.[1] || '');
    const amount = parseBrOrIsoNumber(amtMatch?.[1] || '0');
    const description = (memoMatch?.[1] || nameMatch?.[1] || 'Movimentação bancária').trim();

    if (!amount && !description) return;

    const classification = classifyTransaction(description, amount);
    transactions.push({
      id: `ofx-${index + 1}-${Date.now()}`,
      date,
      description,
      amount,
      category: classification.category,
      plainExplanation: classification.plainExplanation,
      confidenceNote: classification.confidenceNote,
    });
  });

  const referenceMonth = transactions[0]?.date?.slice(0, 7) || new Date().toISOString().slice(0, 7);
  return { bankName, referenceMonth, transactions };
}

export function parseCsvContent(content: string): {
  bankName: string;
  referenceMonth: string;
  transactions: BankTransaction[];
} {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { bankName: 'Planilha CSV', referenceMonth: new Date().toISOString().slice(0, 7), transactions: [] };
  }

  const delimiter = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].split(delimiter).map((h) => normalizeText(h.replace(/^"|"$/g, '')));

  const dateIdx = Math.max(0, headers.findIndex((h) => /data|dt|date/.test(h)));
  const descIdx = Math.max(
    dateIdx === 0 ? 1 : 0,
    headers.findIndex((h) => /hist|descr|memo|lancamento|detalhe|nome/.test(h))
  );
  const valIdx = headers.findIndex((h) => /valor|amount|total|vlr/.test(h));

  const transactions: BankTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map((c) => c.replace(/^"|"$/g, '').trim());
    if (cols.length < 2) continue;

    const date = parseFlexibleDate(cols[dateIdx] || cols[0]);
    const description = cols[descIdx] || cols[1] || 'Lançamento CSV';
    const amount = parseBrOrIsoNumber(cols[valIdx >= 0 ? valIdx : 2] || '0');

    if (amount === 0 && !description) continue;

    const classification = classifyTransaction(description, amount);
    transactions.push({
      id: `csv-${i}-${Date.now()}`,
      date,
      description,
      amount,
      category: classification.category,
      plainExplanation: classification.plainExplanation,
      confidenceNote: classification.confidenceNote,
    });
  }

  const referenceMonth = transactions[0]?.date?.slice(0, 7) || new Date().toISOString().slice(0, 7);
  return { bankName: 'Extrato CSV Importado', referenceMonth, transactions };
}

export function getDemoStatementTransactions(): {
  bankName: string;
  referenceMonth: string;
  transactions: BankTransaction[];
} {
  const rawItems: Array<{ date: string; description: string; amount: number }> = [
    { date: '2026-10-02', description: 'PIX RECEBIDO - Cliente Mariana Costa (Serviço prestado)', amount: 1450.0 },
    { date: '2026-10-05', description: 'RECEBIMENTO MAQUININHA STONE - Vendas Cartão', amount: 2380.5 },
    { date: '2026-10-07', description: 'PAGAMENTO BOLETO - Distribuidora Alfa (Mercadorias)', amount: -890.0 },
    { date: '2026-10-10', description: 'CONTA DE ENERGIA - Energisa Outubro', amount: -245.9 },
    { date: '2026-10-12', description: 'INTERNET FIBRA EMPRESARIAL - Vivo Empresas', amount: -119.9 },
    { date: '2026-10-15', description: 'PIX RECEBIDO - Pedro Henrique Ltda (NF 42)', amount: 1920.0 },
    { date: '2026-10-18', description: 'TRANSF MESMA TITULARIDADE - Retirada para conta pessoal', amount: -1500.0 },
    { date: '2026-10-20', description: 'PAGAMENTO DAS MEI - Documento de Arrecadação do Simples', amount: -75.9 },
    { date: '2026-10-22', description: 'APLICACAO CDB LIQUIDEZ DIARIA - Caixinha Reserva', amount: -500.0 },
    { date: '2026-10-25', description: 'TARIFA BANCARIA - Pacote de Serviços PJ', amount: -29.9 },
    { date: '2026-10-28', description: 'PIX RECEBIDO - Ana Beatriz (Encomenda Especial)', amount: 780.0 },
  ];

  const transactions: BankTransaction[] = rawItems.map((item, idx) => {
    const c = classifyTransaction(item.description, item.amount);
    return {
      id: `demo-${idx + 1}`,
      date: item.date,
      description: item.description,
      amount: item.amount,
      category: c.category,
      plainExplanation: c.plainExplanation,
      confidenceNote: c.confidenceNote,
    };
  });

  return {
    bankName: 'Banco Cora / Nubank PJ (Exemplo)',
    referenceMonth: '2026-10',
    transactions,
  };
}
