# Contexto do projeto

- **Data de atualização:** 2026-11-11
- **Projeto:** AutoContábil Hub (Ferramentas Fiscais Locais + Catálogo de Ferramentas + Portal de Notícias).
- **Autor e mantenedor:** Yuri David (Yuri Monteiro).
- **Arquitetura:** Aplicação web estática, modular (ES Modules), 100% client-side para as ferramentas contábeis/fiscais, sem build nem bundler, estilizada com Tailwind CSS via CDN.
- **Execução local:** `python3 -m http.server 8080` na raiz do repositório.
- **Testes automatizados:** `npm test` (testes unitários em `tests/hub.test.js` via `node:test`, sem dependências externas) e `python tests/smoke_test.py` (smoke test E2E + guarda de privacidade, `CORE_ASSETS` do Service Worker, CSP e codificação UTF-8).

## Decisões

1. **Portal Supabase isolado e segurança do banco (`js/portal/` e `sql/`):**
   - Nenhum script de `js/portal/` nem SDK do Supabase é carregado em `index.html` ou nas páginas das ferramentas locais.
   - A versão do SDK `@supabase/supabase-js` em `js/portal/supabase.js` é fixada em `2.119.0`.
   - As funções puras de validação, geração de slug e tradução de erros do portal residem em `js/portal/pure.js` (reexportadas em `admin.js`, `comments.js` e `auth.js`), permitindo que `npm test` rode 100% offline.
   - Em `public.comments`, usuários `authenticated` possuem `GRANT INSERT (post_id, user_id, body)` restrito às colunas seguras, o trigger `comments_rate_limit()` força `new.created_at := now()` e `new.hidden := false`, e a policy `comments_insert` exige que o post alvo exista e esteja com `status = 'published'`.
   - Em `public.posts`, constraints `posts_source_url_check` e `posts_cover_url_check` e validações no cliente exigem URLs `http://` ou `https://`.
2. **Content-Security-Policy (CSP) por perfil de página:**
   - Páginas de ferramentas locais (`index.html`, `ferramentas.html`, `extrator-xml-nfe.html`, `conciliador-bancario-ofx.html`, `organizador-fiscal.html`, `validador-cnpj.html`, `privacidade.html`, `termos.html`, `404.html`) utilizam `connect-src 'self'` (bloqueando conexões de dados externas).
   - Páginas do portal (`noticias.html`, `noticia.html`, `entrar.html`, `admin.html`) utilizam `connect-src 'self' https://trnkzwserimzkftbwuge.supabase.co https://cdn.jsdelivr.net`.
3. **PWA e Service Worker (`sw.js`):**
   - `CORE_ASSETS` inclui todos os módulos locais importados pela árvore de `index.html` (incluindo `./js/modal.js`), verificado automaticamente em `tests/hub.test.js` e `tests/smoke_test.py`.
   - Cache versionado em `autocontabil-shell-v11`.
4. **Catálogo principal, Modo Guiado e Acessibilidade (`index.html`, `js/app.js`, `js/modal.js`):**
   - O **Catálogo de Ferramentas** é a tela inicial de `index.html`, com suporte a modo guiado (passo a passo educativo em linguagem simples) e modo contador/compacto.
   - A barra interna (`#tool-back-bar`), os modais (`js/modal.js` com focus trap) e os toasts (`role="status"`, `aria-live="polite"`) seguem boas práticas de acessibilidade por teclado e leitores de tela.
5. **Regra única de "nota válida" no Extrator de XML (`js/xmlModule.js`):**
   - A função `isValidNote(note)` centraliza a regra de validade baseada em `classifyStatus(note?.cStat).validForKpi` (`100` e `150` = válidas; `101`, `151`, `135` = canceladas; `110`, `301`, `302` = denegadas; qualquer outro `cStat` preenchido é tratado como não autorizado para KPIs).
   - `renderNF`, `computeYearSummary`/`renderYearSummary` e `exportNF` usam exclusivamente `isValidNote(note)` para somar faturamento, impostos e contagens do resumo anual.
6. **Conciliador Bancário otimizado (`js/conciliadorModule.js`):**
   - `reconcile` pré-calcula os tokens de descrição uma única vez por item, indexa lançamentos do razão por centavos exatos (`Map`) na fase exata e por sinal + filtro de janela de dias e razão de valor antes de calcular similaridade na fase de divergência.
   - `findItemDuplicates` agrupa por `date|cents` e é executada uma única vez por conciliação.
   - Em lotes com mais de 1.000 lançamentos (`extrato + razão`), `runCB` exibe aviso de processamento e cede um tick ao navegador antes de conciliar.
7. **Formulário de contato seguro quando não configurado (`js/contactModule.js`):**
   - Enquanto `CONTACT_ENDPOINT` ou `CONTACT_EMAIL` contiverem valores de espaço reservado (`COLOQUE_AQUI`, `SEU_EMAIL`, `EXEMPLO.COM`), o módulo exibe um aviso claro com botão direto para o WhatsApp e omite links `mailto:` inválidos.

## Pendências

- Configurar `CONTACT_ENDPOINT` e `CONTACT_EMAIL` em `js/contactModule.js`.
- Rodar `sql/migrations/2026-11-11_hardening.sql` no SQL Editor do Supabase.
- Publicar no GitHub Pages (ou confirmar que o deploy da branch `main` na raiz `/(root)` está ativo).
- Migrar o Tailwind Play CDN para CSS compilado e hospedar localmente JSZip, fonte Inter e PDF.js para remover `'unsafe-inline'` e `'unsafe-eval'` do CSP.

## Para depois

- Suporte a **CT-e** e **NFS-e** no Extrator de XML.
- **Conciliação um-para-muitos (1:N e N:1)** no Conciliador Bancário.
- **OCR de PDF escaneado** no Organizador Fiscal de Documentos.
