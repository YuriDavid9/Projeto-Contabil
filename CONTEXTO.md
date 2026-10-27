# Contexto do projeto

- **Projeto:** AutoContábil Hub (Ferramentas Fiscais Locais + Catálogo de Ferramentas + Portal de Notícias).
- **Autor e mantenedor:** Yuri David (Yuri Monteiro).
- **Arquitetura:** Aplicação web estática, modular (ES Modules), sem build, estilizada com Tailwind CSS via CDN.
- **Execução local:** `python3 -m http.server 5500 --bind 127.0.0.1` na raiz do repositório.

## Estado atual

1. **Catálogo como Tela Principal e Páginas Explicativas de Ferramentas (concluído):**
   - `index.html` exibe o **Catálogo de Ferramentas** como tela principal (busca por texto, filtro por área `Fiscal`, `Contábil`, `Financeiro`, selo de processamento 100% local e aviso informativo), sem o antigo botão "Abrir App" nem a barra horizontal de abas de ferramentas no topo; todas as ferramentas são abertas a partir dos cards do catálogo.
   - `js/ferramentas/catalogo.js` centraliza os metadados completos das ferramentas (`slug`, `nome`, `resumo`, `icone`, `area`, `publico`, `pagina`, `abrirEm`, `status`, `passos`, `formatos`, `exemploDemo`, `limitacoes`, `faq`).
   - As 4 páginas explicativas (`extrator-xml-nfe.html`, `conciliador-bancario-ofx.html`, `organizador-fiscal.html` e `validador-cnpj.html`) seguem um molde único com: o que faz e para quem, passo a passo, formatos aceitos, exemplo real dos lotes de demonstração, privacidade e limitações, FAQ em `<details>` e dados estruturados JSON-LD (`SoftwareApplication` + `FAQPage`).
   - `sitemap.xml` e `sw.js` (`autocontabil-shell-v10`) incluem `ferramentas.html`, `organizador-fiscal.html` e `js/ferramentas/catalogo.js`.
2. **Isolamento, Privacidade e Smoke Test:**
   - `tests/smoke_test.py` verifica automaticamente que nenhuma página de ferramenta (`index.html`, `ferramentas.html`, `extrator-xml-nfe.html`, `conciliador-bancario-ofx.html`, `organizador-fiscal.html`, `validador-cnpj.html`) nem seus módulos JS importam ou mencionam `supabase` ou `js/portal`.
   - O smoke test valida também os fluxos de `index.html`, os filtros de `ferramentas.html` e a estrutura + JSON-LD (`SoftwareApplication` e `FAQPage`) das 4 páginas explicativas.
3. **Portal de Notícias (`js/portal/` + Supabase):**
   - `noticias.html`, `noticia.html`, `entrar.html` e `admin.html` operam de forma isolada com autenticação e RLS no Supabase.

## Próximos passos (Fase 2 das Ferramentas)

- Adição de novas ferramentas ao catálogo e migração gradual da interface de cada ferramenta para sua própria página dedicada, uma por vez.
