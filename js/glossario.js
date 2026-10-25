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

export { GLOSSARIO, AJUDA_GUIADO, TERMOS_GUIADOS };
