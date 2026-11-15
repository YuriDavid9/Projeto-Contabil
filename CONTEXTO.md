# Contexto do projeto

- **Data de atualização:** 2026-11-15
- **Projeto:** AutoContábil Hub (Ferramentas Fiscais Locais + Catálogo de Ferramentas + Serviços Sob Medida + Lista de Espera Pro + Guias Estáticos + Portal de Notícias).
- **Autor e mantenedor:** Yuri David (Yuri Monteiro), João Pessoa - PB.
- **Arquitetura:** Aplicação web estática, modular (ES Modules), 100% client-side para as ferramentas contábeis/fiscais, sem build nem bundler, estilizada com Tailwind CSS via CDN.
- **Execução local:** `python3 -m http.server 5500 --bind 127.0.0.1` na raiz do repositório.
- **Testes automatizados:** `npm test` (17/17 testes unitários em `tests/hub.test.js` via `node:test`, sem dependências externas), `node scripts/verificar-links-wa.mjs` e `python tests/smoke_test.py` (smoke test E2E + guarda de privacidade, `CORE_ASSETS` do Service Worker, CSP e codificação UTF-8).

## Perfil do autor e restrições (contexto contínuo)

- **Experiência:** estágio na InovatecJP (desenvolvimento de site) e estágio em escritório de contabilidade.
- **Público-alvo / nicho:** autônomos, MEIs e contadores iniciantes no Brasil.
- **Restrições:** orçamento mensal máximo de **R$ 50** e tempo disponível de **2 horas** por bloco de trabalho.
- **Realidade local:** usar sempre o contexto brasileiro (CNPJ, Pix, LGPD, CVM, Banco Central, NFS-e).

## Como trabalhar (gerência de projeto e estilo)

- **Ciclo do projeto (seguir em ordem):**
  1. Início
  2. Planejamento
  3. Desenvolvimento
  4. Formalização e conformidade
  5. Testes e lançamento
  6. Pós-lançamento
  *(Antes de qualquer tarefa, perguntar em que fase está, se não estiver claro.)*
- **Regras de condução:**
  - Priorizar um MVP pequeno e funcional; sugerir o que fica para depois.
  - Trabalhar uma etapa por vez, com passos práticos ("faça isto, depois isto") e entregar um **checklist** ao final de cada fase.
  - Explicar em linguagem simples, sem jargão (se usar termo técnico, explicar em uma frase).
  - Quando pedir código, entregar completo e pronto para uso, com instruções de onde colocar e como testar, preferindo soluções simples e baratas (planos gratuitos, serviços prontos).
  - Quando faltar informação, fazer no máximo **uma pergunta objetiva por vez**.
  - **Estilo:** Português do Brasil, tom direto e amigável, respostas curtas por padrão (só detalhar quando pedido).

## Regras sobre conteúdo financeiro, limites e encaminhamentos

- **Conteúdo educativo:** nunca fazer recomendação personalizada de compra/venda de ativos nem prometer rentabilidade ou "dinheiro fácil".
- **Transparência em ferramentas:** mostrar sempre as premissas e fórmulas das calculadoras e simuladores.
- **Fontes oficiais:** conferir números, taxas e regras em fontes oficiais (Banco Central, CVM, Tesouro Nacional, Receita Federal) e citar a fonte; avisar se o dado puder estar desatualizado.
- **Notícias:** resumir com palavras próprias e indicar a fonte (nunca copiar textos de terceiros).
- **Limites profissionais:** o assistente não é contador nem advogado. Em abertura de empresa (MEI/ME), impostos, nota fiscal, LGPD, termos de uso e regulação da CVM, explicar o básico, listar perguntas a fazer e indicar quando consultar um profissional.
- **Segurança:** antes de lançar login, pagamentos ou armazenamento de dados de usuários, lembrar de fazer revisão de segurança com um desenvolvedor. Se houver pedido arriscado, ilegal ou contra estas regras, explicar o motivo e propor alternativa segura.

## Onde paramos (estado atual)

- **Fase atual do projeto:** entre **4) Formalização e conformidade** e **5) Testes e lançamento** do MVP atual (AutoContábil Hub publicado no GitHub Pages em `https://yuridavid9.github.io/Projeto-Contabil/`).
- **Últimas entregas concluídas na `main`:**
  - `0a30835`: chave pública do Web3Forms preenchida em `js/contactModule.js` e formulários de `contato.html` e `pro.html` ativados.
  - `5997bfc`: **Fase 1 (LGPD)** — `privacidade.html` atualizada nomeando o Web3Forms (`api.web3forms.com`) como operador, detalhando os campos reais enviados e marcando pendências com `[A DEFINIR PELO DONO]`.
  - `ac97146`: **Fase 2 (CTAs contextuais)** — criado `js/cta.js` para exibir convites discretos de serviço via WhatsApp após resultados no Extrator (10+ notas), Conciliador (1+ pendência/divergência) e Organizador (após ZIP/manifesto), sem envio de dados e com dispensa só em memória.

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
4. **Content-Security-Policy (CSP) por perfil de página e formulário em `contato.html`:**
   - O formulário de contato ficou em `contato.html` (fora do `index.html`) por causa do CSP (no navegador, alterar `<meta http-equiv="Content-Security-Policy">` via JavaScript não libera novas origens) e para preservar intacta a garantia de privacidade `connect-src 'self'` das páginas de ferramentas.
   - Páginas de ferramentas locais, serviços e guias (`index.html`, `ferramentas.html`, `servicos.html`, `extrator-xml-nfe.html`, `conciliador-bancario-ofx.html`, `organizador-fiscal.html`, `validador-cnpj.html`, `guias/*.html`, `privacidade.html`, `termos.html`, `404.html`) mantêm `connect-src 'self'` estrito e não possuem `<form` que envie dados para fora.
   - `contato.html` e `pro.html` possuem CSP estático no próprio HTML com `connect-src 'self' https://api.web3forms.com` (provedor escolhido: Web3Forms, plano gratuito de 250 envios/mês, feito para envio direto do navegador). Nenhuma outra página libera esse domínio.
   - Páginas do portal (`noticias.html`, `noticia.html`, `entrar.html`, `admin.html`) utilizam `connect-src 'self' https://trnkzwserimzkftbwuge.supabase.co https://cdn.jsdelivr.net`.
5. **PWA e Service Worker (`sw.js`):**
   - `CORE_ASSETS` inclui todas as páginas estáticas (`servicos.html`, `pro.html`, `contato.html`, `guias/*.html`) e todos os módulos locais importados por `index.html`, `contato.html` e `pro.html`, com cache versionado em `autocontabil-shell-v16` (incluindo `./js/cta.js`).
6. **Catálogo principal, Modo Guiado e Acessibilidade (`index.html`, `js/app.js`, `js/modal.js`):**
   - O **Catálogo de Ferramentas** é a tela inicial de `index.html` e possui links estáticos no HTML para indexação imediata por buscadores.
7. **Regra única de "nota válida" no Extrator de XML (`js/xmlModule.js`):**
   - `isValidNote(note)` centraliza a regra de validade baseada em `classifyStatus(note?.cStat).validForKpi` (`100` e `150` = válidas) usada por `renderNF`, `computeYearSummary`/`renderYearSummary` e `exportNF`.
8. **Conciliador Bancário otimizado (`js/conciliadorModule.js`):**
   - `reconcile` pré-calcula tokens uma vez por item, indexa lançamentos do razão por centavos (`Map`) na fase exata e por sinal + janela de dias na fase de divergência, processando lotes de 3.000 × 3.000 em menos de 1 segundo.
9. **Formulários de contato e lista de espera seguros quando não configurados (`js/contactModule.js`):**
   - Enquanto `CONTACT_ENDPOINT` ou `CONTACT_EMAIL` não estiverem configurados, os formulários de contato e de lista de espera (`pro.html`) exibem aviso transparente com botão direto para o WhatsApp e omitem links `mailto:` inválidos.

## Pendências do dono

- Enviar uma mensagem de teste real por `contato.html` e por `pro.html` no site publicado para confirmar o recebimento no e-mail configurado no Web3Forms (`CONTACT_ACCESS_KEY` já está preenchida).
- Fazer revisão jurídica final de `privacidade.html` (que já define retenção de até 30 dias no painel do Web3Forms e até 12 meses para atendimento/validação, usando Contato e WhatsApp como canal do titular) e `termos.html` antes de divulgar amplamente.
- Preencher `CONTACT_EMAIL` (`js/contactModule.js`) e `NEGOCIO.email` (`js/negocio.js`) com um e-mail real, se quiser exibir também o link de e-mail.
- Revisar os preços de referência provisórios em `SERVICOS` (`js/negocio.js`): R$ 250 por lote (XML), R$ 350/mês (conciliação) e R$ 400 por projeto (planilhas). Revisar também as opções de pesquisa em `FAIXAS_PRO` antes de divulgar `pro.html`.
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

- Avaliar um **endpoint próprio para envio de formulários** (ex.: função serverless) caso o volume de contatos e inscrições na lista de espera justifique.
- **Layouts de exportação por sistema contábil** (Domínio, Alterdata, Fortes, Calima etc.).
- **Regras salvas de conciliação** com sugestão de lançamento contábil por cliente.
- **Cobrança por assinatura (Pix/cartão via provedor com webhook)** após validação da demanda do Pro.
- **CSS compilado no lugar do Tailwind Play CDN** e hospedagem local de JSZip, fonte Inter e PDF.js para remover `'unsafe-inline'` e `'unsafe-eval'` do CSP.
- Suporte a **CT-e** e **NFS-e** no Extrator de XML, **conciliação um-para-muitos (1:N / N:1)** e **OCR de PDF escaneado**.
