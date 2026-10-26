# Diretrizes de Desenvolvimento e Segurança (CLAUDE.md)

Este documento reúne as regras inegociáveis do projeto **AutoContábil Hub** que devem ser seguidas em qualquer manutenção futura:

## 1. Privacidade Absoluta nas Ferramentas Locais
- **NUNCA carregue o Supabase** (nem qualquer script de `js/portal/`) dentro do `index.html` ou dos módulos de ferramentas (`js/xmlModule.js`, `js/conciliadorModule.js`, `js/organizadorModule.js`, `js/utilitiesModule.js`).
- Os arquivos fiscais do usuário (XML, OFX, CSV, PDF) **jamais** podem sair do navegador.
- No `index.html`, a única ligação com o portal é um link HTML simples (`<a href="noticias.html">`).

## 2. Segurança de Chaves (Supabase)
- O arquivo `js/portal/config.js` deve conter **exclusivamente** a `SUPABASE_URL` e a chave pública `SUPABASE_ANON_KEY` (`anon` / `publishable`).
- **JAMAIS** coloque a chave `service_role` / `secret` ou a senha do banco PostgreSQL em qualquer arquivo do projeto, commit ou variável de front-end.
- Toda a segurança de leitura e escrita depende do **RLS (Row Level Security)** definido em `sql/schema.sql`. Nunca desative o RLS nas tabelas `profiles`, `categories`, `posts` ou `comments`.

## 3. Sanitização Contra XSS (HTML Malicioso)
- **Notícias (Markdown):** todo conteúdo Markdown (`content_md`) deve passar obrigatoriamente por `renderSafeMarkdown()` (`marked` + `DOMPurify.sanitize`) antes de ser inserido com `innerHTML`. Todos os links externos gerados devem receber `rel="noopener noreferrer"`.
- **Comentários e campos de texto:** comentários (`comments.body`), nomes de exibição (`display_name`), títulos e resumos devem ser exibidos **sempre como texto puro** usando `textContent` ou a função `esc()` de `js/utils.js` — nunca como HTML bruto.

## 4. Arquitetura Simples (Sem Build)
- O projeto utiliza HTML estático + Tailwind CSS via CDN + JavaScript em módulos ES (`type="module"`).
- Não introduza bundlers (Webpack, Vite) ou frameworks sem necessidade explícita.
- Para testar localmente no Windows/PowerShell, use `python3 -m http.server 5500 --bind 127.0.0.1` (a porta `8080` pode conflitar com processos locais como o cliente Steam).
