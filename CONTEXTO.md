# Contexto do projeto

- **Projeto:** AutoContábil Hub (Ferramentas Fiscais Locais + Portal de Notícias).
- **Autor e mantenedor:** Yuri David (Yuri Monteiro).
- **Arquitetura:** Aplicação web estática, modular (ES Modules), sem build, estilizada com Tailwind CSS via CDN.
- **Execução local:** `python3 -m http.server 5500 --bind 127.0.0.1` na raiz do repositório (porta `5500` adotada para evitar conflito local com a porta `8080`).

## Estado atual (Fase 1 a 5 concluídas)

1. **Isolamento e Privacidade das Ferramentas:**
   - `index.html` e os módulos em `js/*Module.js` processam XML, OFX/CSV e PDF **100% localmente no navegador**, sem carregar o cliente do Supabase.
   - `index.html` possui apenas um link HTML simples (`<a href="noticias.html">`) apontando para o portal.
2. **Banco de Dados e Segurança (Supabase):**
   - Estrutura criada em `sql/schema.sql` e categorias/exemplos em `sql/seed.sql`.
   - Segurança baseada em **RLS (Row Level Security)** diretamente no PostgreSQL: visitantes leem notícias publicadas e comentários ativos; usuários autenticados comentam (com rate limit de 20s no banco) e apagam os próprios comentários; somente `admin` cria/edita/exclui notícias e oculta comentários.
   - `js/portal/config.js` contém apenas `SUPABASE_URL` e a chave pública (`anon` / `sb_publishable_...`).
3. **Páginas do Portal (`js/portal/`):**
   - `entrar.html` + `js/portal/auth.js`: login, cadastro com nome de exibição e recuperação de senha.
   - `noticias.html` + `js/portal/posts.js`: listagem pública com filtro por categoria, busca por texto e paginação.
   - `noticia.html` + `js/portal/comments.js`: leitura de notícia com Markdown sanitizado via `DOMPurify` e seção de comentários em texto puro (`textContent`).
   - `admin.html` + `js/portal/admin.js`: painel administrativo com CRUD de notícias, gerador de slug, barra Markdown com pré-visualização ao vivo e moderação de comentários.
4. **Páginas Legais e Diretrizes:**
   - `privacidade.html` e `termos.html` atualizados com cláusulas do portal, LGPD e caráter informativo das notícias.
   - `CLAUDE.md` criado com as regras permanentes de segurança e privacidade.

## Próximos passos / Pendências futuras

- Configurar um servidor **SMTP próprio** no Supabase (ex.: Resend ou Brevo) antes de divulgar amplamente o cadastro de usuários, devido ao limite baixo de envio de e-mails por hora do plano gratuito do Supabase.
- Substituir ou excluir as 3 notícias `[EXEMPLO]` pelo painel administrativo quando escrever as primeiras notícias reais.
- Revisar `privacidade.html` e `termos.html` com apoio jurídico antes de uso comercial amplo.
- Fazer backup periódico do banco pelo painel do Supabase.
