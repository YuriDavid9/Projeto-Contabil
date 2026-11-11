# Contexto do projeto

- **Data de atualização:** 2026-11-11
- **Projeto:** AutoContábil Hub (Ferramentas Fiscais Locais + Catálogo de Ferramentas + Serviços Sob Medida + Guias Estáticos + Portal de Notícias).
- **Autor e mantenedor:** Yuri David (Yuri Monteiro), João Pessoa - PB.
- **Arquitetura:** Aplicação web estática, modular (ES Modules), 100% client-side para as ferramentas contábeis/fiscais, sem build nem bundler, estilizada com Tailwind CSS via CDN.
- **Execução local:** `python3 -m http.server 8080` na raiz do repositório.
- **Testes automatizados:** `npm test` (testes unitários em `tests/hub.test.js` via `node:test`, sem dependências externas) e `python tests/smoke_test.py` (smoke test E2E + guarda de privacidade, `CORE_ASSETS` do Service Worker, CSP e codificação UTF-8).

## Negócio e intenção

- **Intenção principal:** gerar renda para o autor trabalhando 100% remoto, sem quebrar a promessa de privacidade das ferramentas locais.
- **Estratégia de monetização em 3 etapas:**
  1. **Serviço sob medida (`servicos.html` + `js/negocio.js`):** automação contábil, consolidação de lotes de XML, conciliação bancária mensal e planilhas inteligentes sob medida, usando as ferramentas gratuitas como vitrine aberta. É a primeira fonte de receita.
  2. **Plano Pro validado (`pro.html`):** lista de espera para validar se escritórios e profissionais pagariam por assinatura antes de construir cobrança e recursos avançados.
  3. **SEO e conteúdo estático (`guias/`):** guias técnicos HTML estáticos com base em fontes oficiais (CONFAZ, Receita Federal e CFC) que atraem buscas orgânicas para as ferramentas gratuitas, para os serviços sob medida e para a lista de espera.
- **Por que não há cobrança automática ainda:** antes de construir infraestrutura de pagamento recorrente, é essencial validar a demanda real com contadores e fechar os primeiros projetos sob medida.

## Decisões

1. **Preservação do MVP SaaS na branch `saas-mvp` (`0e5201f`):**
   - O MVP antigo em Next.js + Supabase (painéis MEI/contador, página de preços e `sql/saas_mvp_schema.sql`) foi preservado na branch `saas-mvp` (`0e5201f`, revertido da `main` em `ce86dcf`) e não voltou à `main` porque enviava extratos bancários para a nuvem, contradizendo a promessa de privacidade 100% local das ferramentas gratuitas.
   - Partes reaproveitáveis no futuro: classificação de extratos em `src/lib/parsers/bankStatementParser.ts`, textos de preços e o schema de vínculo contador-cliente.
2. **Configuração do negócio e medição de origem sem scripts de rastreamento (`js/negocio.js`):**
   - `NEGOCIO`, `SERVICOS` (com `precoAPartirDe: null` por padrão, exibindo `"Solicitar orçamento"`) e `FAIXAS_PRO` ficam centralizados em `js/negocio.js`.
   - `buildWhatsappLink({ origem, servico })` gera links `https://wa.me/5583986398472?text=...` identificando a página/ferramenta de origem na própria mensagem de WhatsApp, permitindo medir quais páginas geram contato sem carregar analytics ou pixels de terceiros.
3. **Portal Supabase isolado e segurança do banco (`js/portal/` e `sql/`):**
   - Nenhum script de `js/portal/` nem SDK do Supabase é carregado em `index.html`, `servicos.html`, `guias/` ou nas páginas das ferramentas locais.
   - A versão do SDK `@supabase/supabase-js` em `js/portal/supabase.js` é fixada em `2.119.0`.
   - As funções puras do portal residem em `js/portal/pure.js`, permitindo que `npm test` rode 100% offline.
   - Em `public.comments`, `authenticated` possui `GRANT INSERT (post_id, user_id, body)` restrito, o trigger `comments_rate_limit()` força `new.created_at := now()` e `new.hidden := false`, e a policy `comments_insert` exige que o post exista e esteja `published`.
   - Em `public.posts`, constraints `posts_source_url_check` e `posts_cover_url_check` exigem URLs `http://` ou `https://`.
4. **Content-Security-Policy (CSP) por perfil de página:**
   - Páginas de ferramentas locais, serviços e guias (`index.html`, `ferramentas.html`, `servicos.html`, `extrator-xml-nfe.html`, `conciliador-bancario-ofx.html`, `organizador-fiscal.html`, `validador-cnpj.html`, `guias/*.html`, `privacidade.html`, `termos.html`, `404.html`) utilizam `connect-src 'self'`.
   - `pro.html` possui CSP próprio que adiciona em `connect-src` apenas a origem do `CONTACT_ENDPOINT` quando configurado.
   - Páginas do portal (`noticias.html`, `noticia.html`, `entrar.html`, `admin.html`) utilizam `connect-src 'self' https://trnkzwserimzkftbwuge.supabase.co https://cdn.jsdelivr.net`.
5. **PWA e Service Worker (`sw.js`):**
   - `CORE_ASSETS` inclui todas as páginas estáticas (`servicos.html`, `pro.html`, `guias/*.html`) e todos os módulos locais importados por `index.html` (incluindo `./js/modal.js` e `./js/negocio.js`), com cache versionado em `autocontabil-shell-v14`.
6. **Catálogo principal, Modo Guiado e Acessibilidade (`index.html`, `js/app.js`, `js/modal.js`):**
   - O **Catálogo de Ferramentas** é a tela inicial de `index.html` e possui links estáticos no HTML para indexação imediata por buscadores.
7. **Regra única de "nota válida" no Extrator de XML (`js/xmlModule.js`):**
   - `isValidNote(note)` centraliza a regra de validade baseada em `classifyStatus(note?.cStat).validForKpi` (`100` e `150` = válidas) usada por `renderNF`, `computeYearSummary`/`renderYearSummary` e `exportNF`.
8. **Conciliador Bancário otimizado (`js/conciliadorModule.js`):**
   - `reconcile` pré-calcula tokens uma vez por item, indexa lançamentos do razão por centavos (`Map`) na fase exata e por sinal + janela de dias na fase de divergência, processando lotes de 3.000 × 3.000 em menos de 1 segundo.
9. **Formulários de contato e lista de espera seguros quando não configurados (`js/contactModule.js`):**
   - Enquanto `CONTACT_ENDPOINT` ou `CONTACT_EMAIL` não estiverem configurados, os formulários de contato e de lista de espera (`pro.html`) exibem aviso transparente com botão direto para o WhatsApp e omitem links `mailto:` inválidos.

## Pendências do dono

- Definir preços iniciais (`precoAPartirDe`) e, se desejar exibir, o `email` e `dominio` em `js/negocio.js`.
- Configurar `CONTACT_ENDPOINT` e `CONTACT_EMAIL` em `js/contactModule.js` (e adicionar o domínio do endpoint em `connect-src` de `pro.html` e da página de contato quando ativar).
- Rodar `sql/migrations/2026-11-11_hardening.sql` no SQL Editor do Supabase.
- Confirmar enquadramento fiscal/CNAE e emissão de nota fiscal de serviço (NFS-e) com o contador.
- Avaliar registro de domínio próprio `.com.br`.
- Conversar com 5 a 10 contadores/analistas fiscais antes de construir o AutoContábil Pro.
- Elaborar política de reembolso e direito de arrependimento (art. 49 do CDC) antes de cobrar assinatura.

## Métricas para acompanhar manualmente

- **Conversas iniciadas por origem:** identificadas automaticamente pelo texto inicial da mensagem no WhatsApp (`"Vim pelo Extrator de XML..."`, `"Vim pela Página de Serviços..."`, etc.).
- **Orçamentos enviados:** quantidade e valor das propostas enviadas após a conversa inicial.
- **Projetos fechados:** serviços sob medida contratados e entregues.
- **Cadastros na lista de espera do Pro:** manifestações de interesse via `pro.html` ou WhatsApp, agrupadas por sistema contábil e faixa mensal.

## Para depois

- **Layouts de exportação por sistema contábil** (Domínio, Alterdata, Fortes, Calima etc.).
- **Regras salvas de conciliação** com sugestão de lançamento contábil por cliente.
- **Cobrança por assinatura (Pix/cartão via provedor com webhook)** após validação da demanda do Pro.
- **CSS compilado no lugar do Tailwind Play CDN** e hospedagem local de JSZip, fonte Inter e PDF.js para remover `'unsafe-inline'` e `'unsafe-eval'` do CSP.
- Suporte a **CT-e** e **NFS-e** no Extrator de XML, **conciliação um-para-muitos (1:N / N:1)** e **OCR de PDF escaneado**.
