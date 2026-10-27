// Catálogo centralizado de ferramentas do AutoContábil Hub.
// IMPORTANTE: Este módulo NÃO deve importar nada de js/portal/ nem carregar Supabase.
// Estrutura pronta para expansão futura (campos opcionais: passos, formatos, limitacoes, faq).

export const AREAS_FERRAMENTAS = [
  { slug: 'todas', nome: 'Todas as áreas' },
  { slug: 'fiscal', nome: 'Fiscal' },
  { slug: 'contabil', nome: 'Contábil' },
  { slug: 'financeiro', nome: 'Financeiro' }
];

export const CATALOGO_FERRAMENTAS = [
  {
    slug: 'extrator-xml-nfe',
    nome: 'Extrator de XML (NF-e/NFC-e)',
    resumo: 'Extraia e consolide dados de notas fiscais eletrônicas (modelos 55 e 65), valide chaves de acesso, filtre por CFOP ou período e exporte para CSV ou Excel.',
    icone: '📄',
    area: 'fiscal',
    publico: 'Contadores, analistas fiscais e empresários que precisam conferir lotes de XMLs ou ZIPs rapidamente.',
    pagina: 'extrator-xml-nfe.html',
    abrirEm: 'index.html#xml',
    status: 'disponivel',
    passos: [],
    faq: []
  },
  {
    slug: 'conciliador-bancario-ofx',
    nome: 'Conciliador Bancário (OFX/CSV)',
    resumo: 'Compare extratos bancários OFX ou CSV com os lançamentos do razão contábil, identifique divergências, possíveis duplicidades e vincule pares manualmente.',
    icone: '🏦',
    area: 'contabil',
    publico: 'Profissionais de BPO financeiro e departamento contábil na conferência mensal de contas.',
    pagina: 'conciliador-bancario-ofx.html',
    abrirEm: 'index.html#conciliador',
    status: 'disponivel',
    passos: [],
    faq: []
  },
  {
    slug: 'organizador-fiscal',
    nome: 'Organizador Fiscal de Documentos',
    resumo: 'Padronize nomes de arquivos, organize documentos por competência e tipo (XML, PDF, extratos) e gere um pacote ZIP estruturado pronto para o escritório.',
    icone: '🗂️',
    area: 'fiscal',
    publico: 'Clientes de contabilidade, MEIs e equipes administrativas que separam documentos mensais.',
    pagina: 'index.html#organizador',
    abrirEm: 'index.html#organizador',
    status: 'disponivel',
    passos: [],
    faq: []
  },
  {
    slug: 'validador-cnpj',
    nome: 'Validador de CNPJ, CPF e Chave NF-e',
    resumo: 'Verifique instantaneamente os dígitos verificadores de CNPJ (inclusive o novo padrão alfanumérico), CPF e chaves de 44 dígitos de NF-e/NFC-e.',
    icone: '🔍',
    area: 'fiscal',
    publico: 'Qualquer profissional que precise conferir cadastros e chaves antes de escriturar ou emitir documentos.',
    pagina: 'validador-cnpj.html',
    abrirEm: 'index.html#utilitarios',
    status: 'disponivel',
    passos: [],
    faq: []
  },
  {
    slug: 'utilitarios-contabeis',
    nome: 'Utilitários e Conversores',
    resumo: 'Conjunto de ferramentas rápidas no navegador: conversor de extrato OFX para CSV, mesclagem de planilhas CSV e resumo informativo de limite anual do MEI.',
    icone: '🧰',
    area: 'financeiro',
    publico: 'Analistas financeiros, contadores e microempreendedores em rotinas de apoio diário.',
    pagina: 'index.html#utilitarios',
    abrirEm: 'index.html#utilitarios',
    status: 'disponivel',
    passos: [],
    faq: []
  }
];
