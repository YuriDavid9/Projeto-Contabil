# AutoContábil Hub

Suíte web modular 100% client-side para apoiar rotinas contábeis, fiscais e financeiras, acompanhada do **Catálogo de Ferramentas** (`index.html` / `ferramentas.html`), da página de **Serviços Sob Medida** (`servicos.html`), da lista de espera do **AutoContábil Pro** (`pro.html`), da página dedicada de **Contato** (`contato.html`), dos **Guias Práticos** (`guias/`) e do **Portal de Notícias** (`noticias.html`).

- **Ferramentas locais, Serviços e Guias (`index.html`, `ferramentas.html`, `servicos.html`, `guias/*.html` e páginas explicativas):** XMLs, extratos OFX/CSV e documentos PDF são processados **100% localmente no navegador** (seus arquivos não são enviados a servidores; nenhum script de banco de dados, analytics ou pixel de rastreamento é carregado nessas páginas, não há formulários de envio externo e o `Content-Security-Policy` restringe `connect-src` estritamente a `'self'`).
- **Formulário de contato (`contato.html`) e Lista de espera do AutoContábil Pro (`pro.html`):** ficam em páginas separadas das ferramentas para preservar o CSP estrito do `index.html`. Enquanto o provedor de formulário não estiver configurado em `js/contactModule.js`, ambos exibem um aviso transparente e direcionam o contato para o WhatsApp com identificação da página de origem.
- **Portal de Notícias (`noticias.html`, `noticia.html`, `entrar.html`, `admin.html`):** utiliza banco de dados e autenticação em nuvem (**Supabase**) apenas para leitura de notícias, contas de usuários e comentários.

## Estrutura Modular

- `index.html` apresenta o **Catálogo de Ferramentas** como tela principal (com HTML estático indexável) e hospeda os painéis das ferramentas locais (`#xml`, `#conciliador`, `#organizador`, `#utilitarios`, `#contato`); `styles.css` contém os estilos compartilhados.
- `servicos.html` apresenta os serviços remotos sob medida (consolidação de XML, conciliação bancária mensal e automação de planilhas), processo em 4 etapas e FAQ honesto sobre privacidade/LGPD.
- `pro.html` apresenta as funcionalidades em validação do **AutoContábil Pro** e a lista de espera sem cobrança.
- `contato.html` hospeda o formulário de contato isolado das páginas de ferramentas, reutilizando `js/contactModule.js`.
- `guias/` reúne os guias estáticos para SEO com referências a fontes oficiais (`guias/index.html`, `guias/como-consolidar-xml-nfe-excel.html`, `guias/como-conciliar-extrato-ofx-razao-contabil.html`, `guias/cnpj-alfanumerico-o-que-muda-como-validar.html`).
- `js/negocio.js` centraliza os dados do negócio (`NEGOCIO`), a lista de serviços (`SERVICOS`), as faixas de preço para validação (`FAIXAS_PRO`) e a função pura `buildWhatsappLink({ origem, servico })`.
- `js/app.js` coordena a navegação entre o catálogo e as abas das ferramentas, atalhos de teclado e modos de visualização.
- `js/utils.js` reúne funções utilitárias puras (moeda, datas, CSV com BOM UTF-8 e separador `;`, similaridade, normalização) e helpers de interface.
- `js/xmlModule.js` — **Extrator de XML (NF-e/NFC-e):** importa XMLs e pacotes ZIP, valida chave de 44 dígitos, protocolo (`cStat` unificado via `isValidNote`) e conferência de totais, filtra dados, gera resumo anual para MEI e exporta CSV/XLSX. Inclui botão **"Carregar Lote de Demonstração"**.
- `js/conciliadorModule.js` — **Conciliador Bancário:** concilia extratos OFX/CSV com o razão contábil com indexação por centavos e sinal, detecta possíveis duplicidades e permite vínculo manual. Inclui botão **"Simulação"**.
- `js/organizadorModule.js` — **Organizador Fiscal:** padroniza nomes de arquivos fiscais, extrai metadados de XML/PDF e gera pacote ZIP estruturado com árvore de pastas. Inclui botão **"Carregar exemplos"**.
- `js/modal.js` controla abertura, fechamento, foco e armadilha de teclado (`Tab`) do modal de inspeção.
- `js/utilitiesModule.js` e `js/contactModule.js` fornecem validadores (CNPJ alfanumérico, CPF, chave NF-e), conversores OFX/CSV e os formulários de contato e lista de espera.
- `js/ferramentas/catalogo.js` centraliza os itens do catálogo e links para as páginas explicativas (`extrator-xml-nfe.html`, `conciliador-bancario-ofx.html`, `organizador-fiscal.html`, `validador-cnpj.html`).
- `js/portal/` reúne os módulos exclusivos do Portal de Notícias (`supabase.js`, `pure.js`, `auth.js`, `posts.js`, `comments.js`, `admin.js`), e `sql/` contém o schema (`sql/schema.sql`) e migrações idempotentes (`sql/migrations/2026-11-11_hardening.sql`).

## Como configurar `js/negocio.js`, WhatsApp e formulários

1. **Dados do negócio e preços dos serviços (`js/negocio.js`):**
   - Edite `NEGOCIO` para atualizar dados de contato ou preencher `email` e `dominio` (enquanto `email: null`, nenhum link de e-mail é exibido em `servicos.html`).
   - Em `SERVICOS`, cada oferta tem `precoAPartirDe` (hoje com valores de referência provisórios, exibidos como `"A partir de R$ ..."` em `servicos.html`). Para voltar a `"Solicitar orçamento"`, use `null`. Ao mudar um valor, atualize também o selo correspondente no HTML estático de `servicos.html` (o teste confere).
   - Em `FAIXAS_PRO`, revise as faixas de pesquisa de demanda antes de divulgar `pro.html`.
2. **Como trocar o número de WhatsApp em todo o site:**
   - Altere `NEGOCIO.whatsapp` em `js/negocio.js` (apenas dígitos com DDI + DDD, ex.: `'5583986398472'`).
   - Rode `node scripts/verificar-links-wa.mjs --atualizar` para atualizar todos os atributos `href="https://wa.me/..."` estáticos nos arquivos `.html` e `node scripts/verificar-links-wa.mjs` para validar que todos os links usam o mesmo número e identificam a origem.
3. **Como ativar os formulários de contato e lista de espera (`contato.html` e `pro.html`):**
   - O provedor já está escolhido e liberado no CSP dessas duas páginas: **Web3Forms** (`https://api.web3forms.com/submit`).
   - Gere a access key gratuita em https://web3forms.com com o e-mail que deve receber as mensagens e cole em `CONTACT_ACCESS_KEY` (`js/contactModule.js`). A chave é pública por definição do provedor. Opcionalmente, preencha `CONTACT_EMAIL` para exibir o link de e-mail como alternativa.
   - Para trocar de provedor, altere `CONTACT_ENDPOINT` e troque `https://api.web3forms.com` no `connect-src` de `contato.html` e `pro.html` (e **somente** nesses dois arquivos). Nunca altere o `connect-src 'self'` de `index.html` ou das páginas de ferramentas.

## Executar localmente

Como o projeto utiliza módulos ES (`<script type="module">`), **não abra o `index.html` diretamente via `file://`**. Inicie um servidor HTTP local na raiz do repositório:

```powershell
python3 -m http.server 8080
```

Abra no navegador:
- http://localhost:8080 — Catálogo de Ferramentas e suíte principal;
- http://localhost:8080/servicos.html — Serviços sob medida;
- http://localhost:8080/pro.html — Lista de espera do AutoContábil Pro;
- http://localhost:8080/contato.html — Página de contato;
- http://localhost:8080/guias/ — Guias práticos;
- http://localhost:8080/noticias.html — Portal de Notícias.

## Testes automatizados

Para rodar os testes unitários das funções puras e módulos (Node.js nativo, 100% offline):

```powershell
npm test
```

Para rodar o teste de fumaça E2E e as guardas de privacidade, CSP, `CORE_ASSETS` do Service Worker e codificação UTF-8:

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
