export const NEGOCIO = {
  nome: 'AutoContábil Hub',
  responsavel: 'Yuri David',
  cidade: 'João Pessoa - PB',
  whatsapp: '5583986398472',
  email: null,
  dominio: null
};

export const SERVICOS = [
  {
    slug: 'consolidacao-xml-nfe',
    titulo: 'Consolidação de lotes de XML de NF-e/NFC-e em planilha pronta para conferência fiscal',
    paraQuem: 'Escritórios de contabilidade, setores fiscais e empresas que recebem dezenas ou centenas de arquivos XML por mês.',
    problema: 'Conferir chaves, protocolos, CFOPs, itens e totais de impostos manualmente consome horas da equipe no fechamento mensal.',
    entrega: 'Planilha organizada (CSV/XLSX) com cabeçalho das notas, itens detalhados, resumo por CFOP e apontamento de notas canceladas, denegadas ou com divergência de soma.',
    prazoTipico: 'Combinado conforme o volume de arquivos e a rotina do escritório.',
    precoAPartirDe: null,
    ferramentaRelacionada: {
      nome: 'Extrator de XML (NF-e/NFC-e)',
      url: 'extrator-xml-nfe.html',
      appUrl: 'index.html#xml'
    }
  },
  {
    slug: 'conciliacao-bancaria-mensal',
    titulo: 'Conciliação bancária mensal (extrato × razão) com relatório de pendências',
    paraQuem: 'Profissionais de BPO financeiro, contadores e pequenas empresas que precisam cruzar extratos OFX/CSV com o controle interno ou razão contábil.',
    problema: 'Tarifas bancárias esquecidas, lançamentos duplicados e diferenças de centavos atrasam o fechamento contábil e geram retrabalho.',
    entrega: 'Papel de trabalho estruturado separando lançamentos conciliados, divergências de valor, pendências bancárias, pendências internas e possíveis duplicidades.',
    prazoTipico: 'Definido na proposta conforme a quantidade de contas bancárias e lançamentos mensais.',
    precoAPartirDe: null,
    ferramentaRelacionada: {
      nome: 'Conciliador Bancário (OFX/CSV)',
      url: 'conciliador-bancario-ofx.html',
      appUrl: 'index.html#conciliador'
    }
  },
  {
    slug: 'automacao-planilhas-rotinas',
    titulo: 'Automação de planilhas e rotinas contábeis sob medida',
    paraQuem: 'Escritórios contábeis, equipes financeiras e empresas que repetem todo mês a mesma limpeza, conversão ou cruzamento manual de planilhas e documentos.',
    problema: 'Processos manuais repetitivos em planilhas aumentam o risco de erro de digitação e tomam tempo que poderia ser dedicado à análise.',
    entrega: 'Planilha inteligente, conversor ou ferramenta local sob medida adaptada ao layout e à necessidade específica da sua operação, com instruções de uso.',
    prazoTipico: 'Combinado após análise inicial do fluxo atual e definição do escopo.',
    precoAPartirDe: null,
    ferramentaRelacionada: {
      nome: 'Catálogo de Ferramentas',
      url: 'ferramentas.html',
      appUrl: 'index.html'
    }
  }
];

export const FAIXAS_PRO = [
  'Até R$ 49/mês',
  'Entre R$ 50 e R$ 99/mês',
  'Entre R$ 100 e R$ 199/mês',
  'Acima de R$ 200/mês (uso em equipe/escritório)',
  'Prefiro contratar apenas serviço avulso sob medida'
];

export function formatPrecoServico(precoAPartirDe) {
  if (precoAPartirDe === null || precoAPartirDe === undefined) {
    return 'Solicitar orçamento';
  }
  const clean = String(precoAPartirDe).trim();
  if (!clean) return 'Solicitar orçamento';
  if (typeof precoAPartirDe === 'number' && Number.isFinite(precoAPartirDe) && precoAPartirDe > 0) {
    return `A partir de R$ ${precoAPartirDe.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return clean.startsWith('A partir de') ? clean : `A partir de ${clean}`;
}

export function isNegocioEmailConfigured(email = NEGOCIO.email) {
  const clean = String(email ?? '').trim();
  if (!clean || !clean.includes('@')) return false;
  if (/EXEMPLO\.COM|SEU_EMAIL/i.test(clean)) return false;
  return true;
}

export function buildWhatsappLink({ origem, servico } = {}, whatsappNumber = NEGOCIO.whatsapp) {
  const phone = String(whatsappNumber || NEGOCIO.whatsapp).replace(/\D/g, '');
  const cleanOrigem = String(origem ?? '').replace(/[ \t]+/g, ' ').trim();
  const cleanServico = String(servico ?? '').replace(/[ \t]+/g, ' ').trim();

  let message = 'Olá Yuri! Vim pelo AutoContábil Hub';
  if (cleanOrigem) {
    const sufixoHub = /autocont[aá]bil\s*hub/i.test(cleanOrigem) ? '' : ' do AutoContábil Hub';
    message = `Olá Yuri! Vim pelo ${cleanOrigem}${sufixoHub}`;
  }
  if (cleanServico) {
    message += ` e quero falar sobre ${cleanServico}.`;
  } else {
    message += ' e gostaria de falar sobre serviços sob medida.';
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
