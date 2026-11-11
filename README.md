# AutoContábil Hub

Suíte web modular 100% client-side para apoiar rotinas contábeis, fiscais e financeiras, acompanhada do **Catálogo de Ferramentas** (`index.html` / `ferramentas.html`) e do **Portal de Notícias** (`noticias.html`).

- **Ferramentas locais (`index.html`, `ferramentas.html` e páginas explicativas):** XMLs, extratos OFX/CSV e documentos PDF são processados **100% localmente no navegador** (seus arquivos não são enviados a servidores; as bibliotecas de interface são carregadas de CDN e nenhum script de banco de dados ou autenticação é carregado nessas páginas).
- **Portal de Notícias (`noticias.html`, `noticia.html`, `entrar.html`, `admin.html`):** utiliza banco de dados e autenticação em nuvem (**Supabase**) apenas para leitura de notícias, contas de usuários e comentários.
- **Formulário de contato:** envia somente a mensagem informada após configurar o provedor em `js/contactModule.js`.

## Estrutura Modular

- `index.html` apresenta o **Catálogo de Ferramentas** como tela principal e hospeda os painéis das ferramentas locais (`#xml`, `#conciliador`, `#organizador`, `#utilitarios`, `#contato`); `styles.css` contém os estilos compartilhados.
- `js/app.js` coordena a navegação entre o catálogo e as abas das ferramentas, atalhos de teclado e modos de visualização.
- `js/utils.js` reúne funções utilitárias puras (moeda, datas, CSV com BOM UTF-8 e separador `;`, similaridade, normalização) e helpers de interface.
- `js/xmlModule.js` — **Extrator de XML (NF-e/NFC-e):** importa XMLs e pacotes ZIP, valida chave de 44 dígitos, protocolo (`cStat`) e conferência de totais, filtra dados e exporta CSV/XLSX. Inclui botão **"Carregar Lote de Demonstração"**.
- `js/conciliadorModule.js` — **Conciliador Bancário:** concilia extratos OFX/CSV com o razão contábil por tolerância de dias e similaridade, detecta possíveis duplicidades e permite vínculo manual. Inclui botão **"Simulação"**.
- `js/organizadorModule.js` — **Organizador Fiscal:** padroniza nomes de arquivos fiscais, extrai metadados de XML/PDF e gera pacote ZIP estruturado com árvore de pastas. Inclui botão **"Carregar exemplos"**.
- `js/modal.js` controla abertura, fechamento, foco e armadilha de teclado (`Tab`) do modal de inspeção.
- `js/utilitiesModule.js` e `js/contactModule.js` fornecem validadores (CNPJ alfanumérico, CPF, chave NF-e), conversores OFX/CSV e formulário de contato.
- `js/ferramentas/catalogo.js` centraliza os itens do catálogo e links para as páginas explicativas (`extrator-xml-nfe.html`, `conciliador-bancario-ofx.html`, `organizador-fiscal.html`, `validador-cnpj.html`).

Não há etapa de build nem bundler. Seus arquivos não são enviados; as bibliotecas de interface são carregadas de CDN (Tailwind CSS, JSZip e fonte Inter; SheetJS e PDF.js sob demanda).

## Executar localmente

Como o projeto utiliza módulos ES (`<script type="module">`), **não abra o `index.html` diretamente via `file://`**. Inicie um servidor HTTP local na raiz do repositório:

```powershell
python3 -m http.server 8080
```

Abra no navegador:
- http://localhost:8080 — Catálogo de Ferramentas e suíte principal (teste cada módulo clicando em **"Carregar Lote de Demonstração"**, **"Simulação"** e **"Carregar exemplos"**);
- http://localhost:8080/noticias.html — Portal de Notícias.

## Testes automatizados

Para rodar os testes unitários das funções puras e módulos (Node.js nativo, sem dependências externas):

```powershell
npm test
```

Para rodar o teste de fumaça E2E e a guarda de privacidade/codificação:

```powershell
python tests/smoke_test.py
```

## Publicação

O projeto é estático e servido diretamente da raiz do repositório oficial (`https://github.com/YuriDavid9/Projeto-Contabil`):

1. Faça push das alterações para a branch `main` em https://github.com/YuriDavid9/Projeto-Contabil.
2. Em **Settings → Pages**, mantenha **Source: Deploy from a branch**, branch `main` e pasta `/(root)`.
3. O site publicado fica disponível em `https://yuridavid9.github.io/Projeto-Contabil/`.

## Contato

Yuri David • WhatsApp: (83) 98639-8472 • João Pessoa - PB
