// Catálogo centralizado de ferramentas do AutoContábil Hub.

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
    passos: [
      'Abra o Extrator de XML clicando no botão "Abrir ferramenta" ou acesse a aba correspondente no aplicativo.',
      'Arraste seus arquivos .xml individuais ou um pacote .zip contendo várias notas fiscais (ou clique em "Carregar Lote de Demonstração" para testar).',
      'Filtre as notas por modelo (55 ou 65), intervalo de datas de emissão, CFOP ou busque por emitente, CNPJ e número.',
      'Confira os indicadores consolidados (total faturado, ICMS, PIS, COFINS e alertas de dígito verificador ou protocolo) e exporte para CSV ou XLSX.'
    ],
    formatos: [
      'Arquivos XML de NF-e (modelo 55) e NFC-e (modelo 65) no layout 4.00 com a tag <infNFe>.',
      'Arquivos compactados (.zip) contendo múltiplos arquivos XML de notas fiscais.',
      'Exportação dos dados consolidados em planilha CSV (separador ponto e vírgula, UTF-8 com BOM) ou Excel (.xlsx com 3 abas: Notas, Itens e Resumo CFOP).'
    ],
    exemploDemo: 'O lote de demonstração inclui 5 notas fictícias de outubro/2026 (ex.: NF 1458 e 1459 da Distribuidora Alfa de Alimentos LTDA, NF 9031 da Tech Informática, NFC-e 20877 da Farmácia Vida Nova e NF 3302 da Papelaria Central), permitindo testar filtros por CFOP 5102, visualização de itens e exportação para Excel sem precisar de arquivos próprios.',
    limitacoes: [
      'A leitura depende da integridade estrutural do XML; arquivos de eventos (cancelamento, carta de correção) ou inutilização sem a tag <infNFe> são recusados com aviso.',
      'A validação da chave de 44 dígitos confere o dígito verificador matemático (módulo 11) e o código cStat presente no próprio arquivo, sem consultar a SEFAZ em tempo real.',
      'A exportação em XLSX carrega a biblioteca SheetJS sob demanda via CDN na primeira utilização.'
    ],
    faq: [
      {
        pergunta: 'Meus arquivos XML são enviados para algum servidor?',
        resposta: 'Não. Toda a leitura do XML e da pasta ZIP ocorre 100% dentro do seu próprio navegador usando APIs nativas (DOMParser e FileReader). Nenhum documento sai do seu computador.'
      },
      {
        pergunta: 'O extrator consulta se a nota foi cancelada na SEFAZ?',
        resposta: 'Não. A ferramenta lê o status de protocolo (cStat) gravado dentro do próprio arquivo XML importado e valida o dígito verificador da chave de 44 dígitos, mas não faz conexão externa com os servidores da SEFAZ.'
      },
      {
        pergunta: 'Quais abas são geradas ao exportar para Excel (XLSX)?',
        resposta: 'O arquivo XLSX é gerado com 3 abas organizadas: a primeira com o cabeçalho e totais de cada nota, a segunda detalhando todos os produtos/itens (NCM, CFOP, quantidade e valores) e a terceira com o resumo consolidado por CFOP.'
      }
    ]
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
    passos: [
      'Acesse o Conciliador Bancário pelo botão "Abrir ferramenta".',
      'Importe o extrato bancário (formato OFX ou CSV) de um lado e a planilha CSV do razão ou controle interno do outro (ou clique em "Simulação" para carregar os 13 lançamentos de exemplo).',
      'Defina a tolerância de dias para datas próximas e clique em conciliar para classificar automaticamente os pares.',
      'Revise as divergências de valor, pendências e avisos de duplicidade, faça vínculos manuais quando necessário e baixe o relatório em CSV ou XLSX colorido por status.'
    ],
    formatos: [
      'Extratos bancários no padrão OFX (contendo blocos <STMTTRN>, <DTPOSTED>, <TRNAMT> e <MEMO>/<NAME>).',
      'Planilhas CSV separadas por ponto e vírgula (;), vírgula (,) ou tabulação, com coluna única de valor ou colunas separadas de débito/saída e crédito/entrada.',
      'Exportação do relatório de auditoria em CSV ou planilha Excel (.xlsx) com cores por status de conciliação.'
    ],
    exemploDemo: 'A simulação carrega 13 lançamentos bancários e 13 registros internos de outubro/2026 (como PIX de Alfa Comércio Ltda de R$ 4.500,00, boleto Energisa de R$ -1.287,45, diferença de valor no aluguel da Imobiliária Sol e tarifas bancárias sem lançamento no razão), demonstrando cada status da auditoria.',
    limitacoes: [
      'Arquivos CSV com cabeçalhos fora do padrão podem exigir ajuste simples nos títulos das colunas (Data, Descrição e Valor).',
      'A aproximação por data e semelhança de texto apenas sugere pares; a confirmação final antes da escrituração contábil cabe sempre ao profissional.',
      'A opção "Lembrar dados neste navegador" é desativada por padrão (opt-in) e salva apenas no armazenamento local (localStorage) do próprio dispositivo.'
    ],
    faq: [
      {
        pergunta: 'Como o conciliador encontra os lançamentos correspondentes?',
        resposta: 'Ele cruza primeiro lançamentos com mesmo valor em centavos e datas dentro da tolerância configurada, avaliando também palavras-chave da descrição. Quando encontra datas e descrições compatíveis com valores diferentes, sinaliza como Divergência de Valor.'
      },
      {
        pergunta: 'Posso conciliar manualmente dois lançamentos que têm descrições diferentes?',
        resposta: 'Sim. Basta selecionar uma pendência bancária e uma pendência interna na tela e confirmar o vínculo manual. O par passa a aparecer com o status "Conciliado manualmente".'
      },
      {
        pergunta: 'Os dados do meu extrato bancário ficam salvos na internet?',
        resposta: 'Nunca. O processamento é totalmente local no seu navegador. Mesmo se você marcar a opção de lembrar dados, eles ficam restritos ao armazenamento local do seu navegador e podem ser apagados com um clique.'
      }
    ]
  },
  {
    slug: 'organizador-fiscal',
    nome: 'Organizador Fiscal de Documentos',
    resumo: 'Padronize nomes de arquivos, organize documentos por competência e tipo (XML, PDF, extratos) e gere um pacote ZIP estruturado pronto para o escritório.',
    icone: '🗂️',
    area: 'fiscal',
    publico: 'Clientes de contabilidade, MEIs e equipes administrativas que separam documentos mensais.',
    pagina: 'organizador-fiscal.html',
    abrirEm: 'index.html#organizador',
    status: 'disponivel',
    passos: [
      'Abra o Organizador Fiscal clicando em "Abrir ferramenta".',
      'Arraste seus comprovantes, boletos, notas e guias (PDF, XML, JPG, PNG) para a fila ou clique em "Carregar exemplos" para testar.',
      'Escolha o padrão de nomenclatura (ex.: {AAAA}-{MM}-{DD}_{TIPO}_{FORNECEDOR}) e o modelo de pastas (por Ano-Mês e/ou Fornecedor).',
      'Ajuste na tabela qualquer data, CNPJ, tipo, fornecedor ou valor e clique em "Baixar ZIP Padronizado" para gerar o pacote com o manifesto De/Para em CSV.'
    ],
    formatos: [
      'Documentos em PDF (com extração local de texto para sugerir CNPJ, data, tipo e valor quando o PDF possui camada de texto), XML, imagens (JPG, PNG) e extratos.',
      'Saída em arquivo compactado (.zip) contendo as pastas organizadas e a planilha manifesto_de_para.csv.',
      'Exportação avulsa do manifesto De/Para em formato CSV.'
    ],
    exemploDemo: 'O lote de demonstração simula 6 arquivos com nomes despadronizados comuns do dia a dia (como "comprovante_pix_final_12.pdf", "SCAN_20261012_0001.pdf" e "WhatsApp Image 2026-10-09...jpeg") e mostra instantaneamente como ficam renomeados e agrupados em pastas por competência.',
    limitacoes: [
      'Arquivos PDF escaneados como imagem pura (sem texto selecionável) não passam por OCR; nesses casos, os metadados são sugeridos pelo nome do arquivo e podem ser preenchidos manualmente na tabela.',
      'A ferramenta cria um novo arquivo ZIP organizado para download e não altera nem apaga os arquivos originais na pasta do seu computador.'
    ],
    faq: [
      {
        pergunta: 'O Organizador altera meus arquivos originais no computador?',
        resposta: 'Não. Seus arquivos originais permanecem intactos onde estão. A ferramenta gera um novo pacote .zip contendo as cópias renomeadas e organizadas em pastas, além de uma planilha De/Para.'
      },
      {
        pergunta: 'O que é o arquivo manifesto_de_para.csv incluído no ZIP?',
        resposta: 'É uma planilha de controle que lista o nome original de cada arquivo ao lado do novo nome padronizado, pasta de destino, data, CNPJ, tipo, fornecedor e valor, facilitando a conferência pelo escritório contábil.'
      },
      {
        pergunta: 'Posso salvar meu próprio padrão de nomes para usar todo mês?',
        resposta: 'Sim. Você pode criar uma máscara personalizada usando variáveis como {AAAA}, {MM}, {DD}, {TIPO}, {FORNECEDOR} e {VALOR} e salvá-la no seu navegador para reutilizar nos meses seguintes.'
      }
    ]
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
    passos: [
      'Abra a aba de Utilitários clicando em "Abrir ferramenta".',
      'No bloco "Validador de documentos", selecione o tipo de identificador: CNPJ, CPF ou Chave de NF-e (44 dígitos).',
      'Digite ou cole o número (com ou sem pontuação, espaços ou traços).',
      'Clique em "Validar" para conferir imediatamente se a estrutura e os dígitos verificadores estão corretos.'
    ],
    formatos: [
      'CNPJ numérico tradicional (14 dígitos) e novo formato de CNPJ alfanumérico (12 caracteres alfanuméricos + 2 dígitos verificadores numéricos).',
      'CPF de 11 dígitos (com ou sem máscara de pontos e hífen).',
      'Chave de acesso de NF-e e NFC-e com 44 posições.'
    ],
    exemploDemo: 'Você pode testar diretamente com os CNPJs fictícios usados nas demonstrações do Hub, como 11.222.333/0001-81 (válido), ou alterar o último dígito para ver o alerta imediato de erro de digitação.',
    limitacoes: [
      'A verificação calcula matematicamente os dígitos verificadores (módulo 11) no navegador; ela não consulta a situação cadastral na Receita Federal, Sintegra ou SEFAZ.',
      'Um número matematicamente válido não garante que a empresa esteja ativa ou que a nota fiscal esteja autorizada.'
    ],
    faq: [
      {
        pergunta: 'O validador já aceita o novo CNPJ alfanumérico?',
        resposta: 'Sim. O cálculo de módulo 11 implementado segue a regra técnica para converter letras e números pelos seus códigos ASCII (subtraindo 48), validando tanto CNPJs atuais quanto o padrão alfanumérico.'
      },
      {
        pergunta: 'Preciso remover pontos, barras ou traços antes de colar?',
        resposta: 'Não é necessário. A ferramenta ignora automaticamente espaços, pontos, barras e hífens antes de validar os caracteres.'
      },
      {
        pergunta: 'Os números consultados ficam registrados em algum banco de dados?',
        resposta: 'Não. O cálculo ocorre instantaneamente em memória no seu navegador e nenhum CNPJ, CPF ou chave é transmitido pela rede.'
      }
    ]
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
    formatos: [],
    exemploDemo: '',
    limitacoes: [],
    faq: []
  }
];
