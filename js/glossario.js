const GLOSSARIO = {
  vProd: { completo: 'vProd', guiado: 'Valor dos produtos' },
  vNF: { completo: 'vNF', guiado: 'Valor total da nota' },
  vICMS: { completo: 'vICMS', guiado: 'ICMS (imposto estadual)' },
  vPIS: { completo: 'vPIS', guiado: 'PIS e COFINS (impostos federais)' },
  vCOFINS: { completo: 'vCOFINS', guiado: 'PIS e COFINS (impostos federais)' },
  inicio: { completo: 'Início', guiado: 'Início' },
  xml: { completo: 'Extrator de XML', guiado: 'Entender minhas notas fiscais' },
  conciliador: { completo: 'Conciliador Bancário', guiado: 'Conferir banco e anotações' },
  organizador: { completo: 'Organizador Fiscal', guiado: 'Organizar documentos' }
};

const AJUDA_GUIADO = {
  notas: { oQueE: 'A nota fiscal registra uma venda. O arquivo da nota guarda as informações que aparecem nela.', ondeEncontro: 'Procure no e-mail, no sistema onde as notas são emitidas ou peça o arquivo ao contador.', oQueAcontece: 'O site apenas lê os arquivos no seu computador. Os originais não são alterados.' },
  banco: { oQueE: 'O extrato é a lista de entradas e saídas da conta. Suas anotações podem estar numa planilha.', ondeEncontro: 'No aplicativo ou site do banco, procure Extrato e depois Exportar ou Baixar. O caminho muda de banco para banco.', oQueAcontece: 'Nada sai do seu computador. Os arquivos originais não são alterados.' },
  documentos: { oQueE: 'São fotos, comprovantes, boletos, notas, recibos e outros documentos da empresa.', ondeEncontro: 'Procure na galeria do celular, no WhatsApp, no e-mail ou na pasta Downloads.', oQueAcontece: 'Os originais não mudam. Você recebe cópias com nomes organizados.' }
};

const TERMOS_GUIADOS = [
  ['Nota fiscal', 'Documento que registra uma venda. Exemplo: nota de uma compra para sua empresa.'],
  ['Arquivo da nota (XML)', 'Arquivo digital com os dados da nota. Exemplo: o contador pode enviar por e-mail.'],
  ['Extrato', 'Lista de entradas e saídas da conta. Exemplo: pagamentos e valores recebidos.'],
  ['Planilha (CSV)', 'Arquivo com linhas e colunas que abre em programas de planilha.'],
  ['Arquivo compactado (ZIP)', 'Uma pasta reunida em um arquivo. Exemplo: documentos separados por mês.'],
  ['Comprovante', 'Registro de um pagamento ou transferência. Exemplo: comprovante de Pix.'],
  ['Boleto', 'Cobrança com valor e data para pagar. Exemplo: conta de energia.'],
  ['Recibo', 'Confirmação de que alguém recebeu um pagamento.'],
  ['Guia de imposto', 'Documento usado para pagar um imposto. Exemplo: guia mensal do MEI.'],
  ['Chave da nota', 'Número que identifica uma nota fiscal. Exemplo: permite localizar aquela nota.'],
  ['Imposto', 'Valor informado na nota ou em uma cobrança oficial.'],
  ['MEI', 'Categoria simplificada de empresa. Exemplo: profissional que trabalha por conta própria.']
];

const DICIONARIO_BOLSO = [
  {
    termo: 'DAS (Guia do MEI / Simples)',
    area: 'MEI',
    explicacao: 'Documento único mensal usado pelo MEI e por empresas do Simples Nacional para pagar seus impostos.',
    exemplo: 'Vence normalmente no dia 20 de cada mês referente ao mês anterior.'
  },
  {
    termo: 'DASN-Simei',
    area: 'MEI',
    explicacao: 'Declaração Anual de Faturamento do MEI, entregue até 31 de maio informando tudo o que foi vendido ou prestado no ano anterior.',
    exemplo: 'Mesmo o MEI que teve faturamento R$ 0,00 precisa entregar a declaração anual.'
  },
  {
    termo: 'NF-e, NFC-e e NFS-e',
    area: 'Fiscal',
    explicacao: 'Três tipos de nota fiscal eletrônica: NF-e (modelo 55, vendas/produtos), NFC-e (modelo 65, varejo/consumidor) e NFS-e (prestação de serviços).',
    exemplo: 'Comércio atacadista emite NF-e; loja para consumidor final emite NFC-e; prestador de serviço emite NFS-e.'
  },
  {
    termo: 'Arquivo XML da Nota',
    area: 'Fiscal',
    explicacao: 'É o arquivo digital oficial da nota fiscal com assinatura eletrônica e validade jurídica (o PDF/DANFE é apenas um resumo impresso).',
    exemplo: 'O Ajuste SINIEF 07/05 exige guardar o arquivo .xml pelo prazo legal.'
  },
  {
    termo: 'CFOP (Código Fiscal de Operações)',
    area: 'Fiscal',
    explicacao: 'Código de 4 números que identifica o tipo da operação na nota fiscal (compra, venda, devolução, dentro ou fora do estado).',
    exemplo: 'CFOPs iniciados em 5 (ex.: 5102) indicam saídas dentro do mesmo estado; iniciados em 6 indicam para outro estado.'
  },
  {
    termo: 'cStat (Status SEFAZ)',
    area: 'Fiscal',
    explicacao: 'Código numérico retornado pela SEFAZ no protocolo do XML que diz se a nota vale ou não.',
    exemplo: '100 ou 150 = Autorizada; 101 = Cancelada; 110 = Uso Denegado.'
  },
  {
    termo: 'Arquivo OFX (Extrato Bancário)',
    area: 'Financeiro',
    explicacao: 'Formato padronizado de extrato digital que os bancos exportam para conciliação automática, evitando digitação manual.',
    exemplo: 'No internet banking da conta PJ, escolha Exportar Extrato no formato OFX.'
  },
  {
    termo: 'Razão Contábil',
    area: 'Contábil',
    explicacao: 'Relatório do sistema contábil que mostra, conta por conta, todas as movimentações registradas pela contabilidade.',
    exemplo: 'Na conciliação bancária (ITG 2000), cruzamos o extrato OFX do banco com o razão da conta Banco.'
  },
  {
    termo: 'CNPJ Alfanumérico',
    area: 'Contábil',
    explicacao: 'Novo padrão da Receita Federal (IN RFB nº 2.229/2024) em que as 12 primeiras posições do CNPJ poderão conter letras e números.',
    exemplo: 'Os CNPJs atuais apenas numéricos continuam válidos e não mudam.'
  },
  {
    termo: 'IBS e CBS (Reforma Tributária)',
    area: 'Fiscal',
    explicacao: 'Novos tributos sobre consumo que substituirão gradualmente ICMS, ISS, PIS e COFINS durante o período de transição.',
    exemplo: 'CBS é federal e IBS é compartilhado entre estados e municípios.'
  }
];

function normalizeGlossarySearch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function filterDicionarioBolso(termos = DICIONARIO_BOLSO, query = '', area = '') {
  const list = Array.isArray(termos) ? termos : [];
  const cleanQuery = normalizeGlossarySearch(query);
  const cleanArea = normalizeGlossarySearch(area);

  return list.filter((item) => {
    if (cleanArea && cleanArea !== 'todos' && normalizeGlossarySearch(item.area) !== cleanArea) {
      return false;
    }
    if (!cleanQuery) return true;
    const haystack = normalizeGlossarySearch(`${item.termo} ${item.area} ${item.explicacao} ${item.exemplo}`);
    return haystack.includes(cleanQuery);
  });
}

export { GLOSSARIO, AJUDA_GUIADO, TERMOS_GUIADOS, DICIONARIO_BOLSO, filterDicionarioBolso };
