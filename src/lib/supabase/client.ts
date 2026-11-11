import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AccountRole, MeiChecklistItem, StatementBatch, UserProfile } from '@/types/saas';
import { calculateSummary, getDemoStatementTransactions } from '@/lib/parsers/bankStatementParser';

// Mesma instância Supabase já configurada no repositório (usa somente chave pública anon/publishable)
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://trnkzwserimzkftbwuge.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_OBTigHbU_iSuBREfGj5AjA_-rn8z-_J';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return supabaseInstance;
}

const STORAGE_KEYS = {
  USER: 'autocontabil_saas_user_v1',
  BATCHES: 'autocontabil_saas_batches_v1',
  CHECKLIST: 'autocontabil_saas_checklist_v1',
};

export const DEFAULT_MEI_CHECKLIST: MeiChecklistItem[] = [
  {
    key: 'separar_extratos',
    title: 'Baixar e organizar o extrato bancário do mês anterior',
    simpleExplanation: 'Pegue o arquivo OFX ou CSV no aplicativo do seu banco e passe aqui no organizador.',
    whyItMatters: 'Ajuda o contador a separar o que foi venda real do que foi transferência pessoal.',
    dueDayHint: 'Até o dia 5 de cada mês',
    completed: false,
  },
  {
    key: 'pagar_das',
    title: 'Pagar a guia mensal do MEI (DAS)',
    simpleExplanation: 'É o boleto único mensal do MEI (cerca de R$ 75 a R$ 81) que mantém seu CNPJ em dia e garante aposentadoria/auxílio.',
    whyItMatters: 'Evita juros, multa e impede que seu CNPJ fique irregular.',
    dueDayHint: 'Vence todo dia 20',
    completed: false,
  },
  {
    key: 'preencher_relatorio_receitas',
    title: 'Conferir o total de vendas no mês (Relatório Mensal de Receitas)',
    simpleExplanation: 'Anote quanto entrou de vendas com nota e sem nota fiscal para acompanhar o teto anual de R$ 81.000.',
    whyItMatters: 'Deixa tudo pronto para a Declaração Anual do MEI (DASN-SIMEI) sem correria.',
    dueDayHint: 'Até o dia 20 de cada mês',
    completed: false,
  },
  {
    key: 'guardar_notas_compras',
    title: 'Guardar notas fiscais de compras e comprovantes de despesas da empresa',
    simpleExplanation: 'Salve as notas de mercadorias compradas, internet, luz e insumos em uma pasta do mês.',
    whyItMatters: 'Comprova os gastos oficiais do seu negócio para a contabilidade.',
    dueDayHint: 'Ao longo do mês',
    completed: false,
  },
  {
    key: 'enviar_contador',
    title: 'Enviar o relatório organizado ao seu contador',
    simpleExplanation: 'Depois de revisar as movimentações aqui no AutoContábil, clique em "Enviar para o Contador" ou mande o PDF.',
    whyItMatters: 'Seu contador recebe tudo mastigado e consegue te orientar melhor.',
    dueDayHint: 'Até o dia 10 de cada mês',
    completed: false,
  },
];

export function getSavedUserProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export function saveUserProfileLocal(profile: UserProfile | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!profile) {
      localStorage.removeItem(STORAGE_KEYS.USER);
    } else {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));
    }
  } catch {
    // Fallback silencioso caso o navegador bloqueie storage
  }
}

export function loginAsDemoProfile(role: AccountRole): UserProfile {
  const demoProfile: UserProfile =
    role === 'mei'
      ? {
          id: 'demo-mei-001',
          email: 'contato@padariaestrela.com.br',
          displayName: 'Carlos Silva',
          accountType: 'mei',
          companyName: 'Carlos Silva Panificação MEI',
          cnpj: '45.123.789/0001-90',
          accountantEmail: 'ana.contadora@escritoriomodelo.com.br',
          createdAt: new Date().toISOString(),
        }
      : {
          id: 'demo-contador-001',
          email: 'ana.contadora@escritoriomodelo.com.br',
          displayName: 'Ana Paula Contadora (CRC-PB)',
          accountType: 'contador',
          companyName: 'Modelo Assessoria Contábil',
          cnpj: '12.987.654/0001-11',
          createdAt: new Date().toISOString(),
        };

  saveUserProfileLocal(demoProfile);
  ensureDemoBatchesSeeded();
  return demoProfile;
}

export function ensureDemoBatchesSeeded(): StatementBatch[] {
  if (typeof window === 'undefined') return [];
  try {
    const existingRaw = localStorage.getItem(STORAGE_KEYS.BATCHES);
    if (existingRaw) {
      const parsed = JSON.parse(existingRaw) as StatementBatch[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }

    const demoData = getDemoStatementTransactions();
    const initialBatch: StatementBatch = {
      id: 'batch-demo-out-2026',
      clientId: 'demo-mei-001',
      clientName: 'Carlos Silva',
      clientCompany: 'Carlos Silva Panificação MEI',
      clientCnpj: '45.123.789/0001-90',
      referenceMonth: demoData.referenceMonth,
      bankName: demoData.bankName,
      sourceFilename: 'extrato-outubro-2026.ofx',
      sourceFormat: 'DEMO',
      status: 'sent_to_accountant',
      summary: calculateSummary(demoData.transactions),
      transactions: demoData.transactions,
      clientNotes: 'Transferência do dia 18/10 foi retirada para minha conta pessoal. Todas as vendas PIX tiveram nota emitida.',
      sentAt: '2026-11-03T14:20:00.000Z',
      createdAt: '2026-11-03T14:15:00.000Z',
    };

    const secondClientBatch: StatementBatch = {
      id: 'batch-demo-studio-2026',
      clientId: 'demo-mei-002',
      clientName: 'Juliana Mendes',
      clientCompany: 'Studio Juliana Design MEI',
      clientCnpj: '38.444.222/0001-55',
      referenceMonth: '2026-10',
      bankName: 'Banco Inter PJ',
      sourceFilename: 'inter-pj-outubro.csv',
      sourceFormat: 'CSV',
      status: 'sent_to_accountant',
      summary: {
        totalIncome: 6420.0,
        totalExpense: 1480.5,
        totalTransfer: 2200.0,
        totalOther: 0,
        netResult: 4939.5,
        transactionCount: 8,
      },
      transactions: demoData.transactions.slice(0, 8),
      clientNotes: 'Extrato completo de outubro conferido.',
      sentAt: '2026-11-04T10:05:00.000Z',
      createdAt: '2026-11-04T10:00:00.000Z',
    };

    const seed = [initialBatch, secondClientBatch];
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(seed));
    return seed;
  } catch {
    return [];
  }
}

export function listStatementBatches(): StatementBatch[] {
  return ensureDemoBatchesSeeded();
}

export function saveStatementBatch(batch: StatementBatch): StatementBatch[] {
  if (typeof window === 'undefined') return [];
  const current = ensureDemoBatchesSeeded();
  const existingIdx = current.findIndex((item) => item.id === batch.id);
  let updated: StatementBatch[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = batch;
  } else {
    updated = [batch, ...current];
  }
  try {
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(updated));
  } catch {
    // Ignora erro de quota
  }
  return updated;
}

export function getMeiChecklist(referenceMonth = '2026-10'): MeiChecklistItem[] {
  if (typeof window === 'undefined') return DEFAULT_MEI_CHECKLIST;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.CHECKLIST}_${referenceMonth}`);
    if (!raw) return DEFAULT_MEI_CHECKLIST;
    const savedState = JSON.parse(raw) as Record<string, boolean>;
    return DEFAULT_MEI_CHECKLIST.map((item) => ({
      ...item,
      completed: Boolean(savedState[item.key]),
    }));
  } catch {
    return DEFAULT_MEI_CHECKLIST;
  }
}

export function toggleMeiChecklistItem(key: string, referenceMonth = '2026-10'): MeiChecklistItem[] {
  const current = getMeiChecklist(referenceMonth);
  const updated = current.map((item) =>
    item.key === key ? { ...item, completed: !item.completed } : item
  );
  if (typeof window !== 'undefined') {
    try {
      const stateMap: Record<string, boolean> = {};
      updated.forEach((item) => {
        stateMap[item.key] = item.completed;
      });
      localStorage.setItem(`${STORAGE_KEYS.CHECKLIST}_${referenceMonth}`, JSON.stringify(stateMap));
    } catch {
      // Ignora erro
    }
  }
  return updated;
}
