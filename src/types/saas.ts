export type AccountRole = 'mei' | 'contador';

export type TransactionCategory = 'receita' | 'despesa' | 'transferencia' | 'outros';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  accountType: AccountRole;
  companyName?: string;
  cnpj?: string;
  accountantEmail?: string;
  createdAt: string;
}

export interface BankTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // positivo = entrada, negativo = saída
  category: TransactionCategory;
  plainExplanation: string;
  confidenceNote: string;
}

export interface StatementSummary {
  totalIncome: number;
  totalExpense: number;
  totalTransfer: number;
  totalOther: number;
  netResult: number;
  transactionCount: number;
}

export interface StatementBatch {
  id: string;
  clientId: string;
  clientName: string;
  clientCompany: string;
  clientCnpj: string;
  referenceMonth: string; // YYYY-MM
  bankName: string;
  sourceFilename: string;
  sourceFormat: 'OFX' | 'CSV' | 'DEMO';
  status: 'organized' | 'sent_to_accountant' | 'reviewed';
  summary: StatementSummary;
  transactions: BankTransaction[];
  clientNotes?: string;
  sentAt?: string;
  createdAt: string;
}

export interface MeiChecklistItem {
  key: string;
  title: string;
  simpleExplanation: string;
  whyItMatters: string;
  dueDayHint: string;
  completed: boolean;
}
