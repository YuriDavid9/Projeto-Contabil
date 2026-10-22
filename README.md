# AutoContábil Hub

Aplicação web modular para apoiar tarefas contábeis, fiscais e financeiras. XMLs, extratos e documentos são processados localmente no navegador. **Exceção:** o formulário da aba Contato envia somente a mensagem e os dados informados, após configurar um provedor de formulário.

## Arquitetura

- `index.html` contém as abas, formulários e tabelas; `styles.css` contém os estilos locais.
- `js/xmlModule.js` extrai NF-e/NFC-e, importa XML/ZIP, valida chave/cStat, filtra dados e exporta CSV/XLSX.
- `js/conciliadorModule.js` concilia OFX/CSV, permite vínculo manual, aviso de duplicados e armazenamento local opt-in.
- `js/organizadorModule.js` organiza arquivos, extrai texto de PDFs quando possível e salva regras no navegador.
- `js/contactModule.js` controla o formulário de contato; `js/utilitiesModule.js` fornece validadores, conversores, mesclagem e cálculo estimado.
- `js/app.js` coordena a navegação; `js/modo.js` e `js/glossario.js` controlam as apresentações Guiado e Completo; `js/config.js` concentra o limite anual exibido no resumo informativo do MEI.
- `privacidade.html`, `termos.html`, `404.html`, `manifest.webmanifest` e `sw.js` são as páginas institucionais e recursos de publicação/PWA.

Não há build nem dependências locais. Tailwind CSS, JSZip e Inter vêm de CDN; SheetJS e PDF.js são carregados sob demanda quando os recursos são usados. A primeira carga desses recursos precisa de internet. `.vscode/` é reservado às configurações do editor.

## Executar localmente

Na raiz do repositório, inicie um servidor HTTP:

```powershell
python3 -m http.server 8080
```

Abra http://localhost:8080. Os módulos ES precisam de HTTP.

Teste as abas **Extrator de XML**, **Conciliador Bancário**, **Organizador Fiscal**, **Contato** e **Utilitários**. Os botões de demonstração do XML, **Simulação** e **Carregar exemplos** preenchem tabelas sem enviar documentos.

### Configurar contato

Em `js/contactModule.js`, configure `CONTACT_ENDPOINT` e `CONTACT_ACCESS_KEY`. O padrão segue Web3Forms (`https://api.web3forms.com/submit`); para Formspree, troque o endpoint e adapte o formato do payload se necessário. Em um site estático, qualquer chave presente no JavaScript fica visível ao visitante: use apenas uma chave pública apropriada e as proteções oferecidas pelo provedor. O endpoint placeholder não envia mensagens. Atualize também `SEU_EMAIL@EXEMPLO.COM` para habilitar o fallback por e-mail.

### Formatos

- **OFX:** tags `STMTTRN`, `TRNAMT`, `DTPOSTED`, `MEMO`/`NAME`.
- **CSV:** separadores `;`, `,` ou tab; colunas de data, descrição e valor, ou débito/crédito. Use aspas CSV para campos que contenham o delimitador.
- **XML:** arquivos NF-e/NFC-e individuais ou ZIP contendo XMLs.
- **PDF:** somente extração de texto; imagens digitalizadas não passam por OCR.

## Publicar

O projeto é estático e não precisa de comando de build.

1. No GitHub, abra **Settings → Pages**.
2. Escolha **Deploy from a branch**, branch `main`, pasta `/(root)` e salve.
3. As URLs públicas já apontam para `https://yuridavid9.github.io/Projeto-Contabil/`. Atualize canonical, sitemap e robots caso o usuário ou o nome do repositório mude.

Páginas informativas disponíveis: `validador-cnpj.html`, `extrator-xml-nfe.html` e `conciliador-bancario-ofx.html`.

Vercel e Netlify também funcionam com comando de build vazio e pasta de publicação `.`.

### PWA e métricas

`sw.js` faz cache dos arquivos locais para navegação offline após a primeira carga. Bibliotecas e fontes de CDN ainda precisam estar disponíveis no navegador. Métricas estão desativadas; há um exemplo comentado de GoatCounter no `index.html`. Se ativá-lo, configure o domínio e atualize `privacidade.html` para explicar o serviço e os dados medidos.

### Teste automatizado

O workflow `.github/workflows/static-smoke.yml` instala Playwright apenas no runner do GitHub Actions e verifica abas, demonstrações e erros de console. Não adiciona build ou dependência ao projeto local.

## Contato

Yuri David • WhatsApp: (83) 98639-8472 • João Pessoa - PB

