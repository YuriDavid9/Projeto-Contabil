# Contexto do projeto

- **Projeto:** AutoContábil Hub (Ferramentas Fiscais Locais + Catálogo de Ferramentas + Portal de Notícias).
- **Autor e mantenedor:** Yuri David (Yuri Monteiro).
- **Arquitetura:** Aplicação web estática, modular (ES Modules), sem build, estilizada com Tailwind CSS via CDN.
- **Execução local:** `python3 -m http.server 5500 --bind 127.0.0.1` na raiz do repositório.

## Estado atual

1. **Catálogo e Hub de Ferramentas (Fase 1 concluída):**
   - `js/ferramentas/catalogo.js` centraliza os metadados das ferramentas (`slug`, `nome`, `resumo`, `icone`, `area`, `publico`, `pagina`, `abrirEm`, `status`, e campos opcionais `passos` e `faq` prontos para expansão).
   - `ferramentas.html` renderiza o catálogo com busca por texto, filtro por área (`Fiscal`, `Contábil`, `Financeiro`), selo de processamento 100% local e aviso informativo, usando cabeçalho e rodapé estáticos sem qualquer dependência de `js/portal/` ou Supabase.
   - O botão "🧰 Ferramentas" em `js/portal/layout.js` e os links de navegação nas páginas explicativas/institucionais apontam para `ferramentas.html`.
   - `sitemap.xml` e `sw.js` (`autocontabil-shell-v8`) incluem `ferramentas.html` e `js/ferramentas/catalogo.js`.
2. **Isolamento, Privacidade e Smoke Test:**
   - `tests/smoke_test.py` verifica automaticamente que nenhuma página de ferramenta (`index.html`, `ferramentas.html`, `extrator-xml-nfe.html`, `conciliador-bancario-ofx.html`, `validador-cnpj.html`) nem seus módulos JS importam ou mencionam `supabase` ou `js/portal`.
   - O smoke test também valida a renderização de `index.html` (modos Guiado e Completo) e de `ferramentas.html` (contagem de cards e filtros por área), com versão do Playwright fixada em `.github/workflows/static-smoke.yml`.
3. **Portal de Notícias (`js/portal/` + Supabase):**
   - `noticias.html`, `noticia.html`, `entrar.html` e `admin.html` operam de forma isolada com autenticação e RLS no Supabase.

## Próximos passos

1. **Padronização das páginas explicativas de cada ferramenta:** reescrever `extrator-xml-nfe.html`, `conciliador-bancario-ofx.html` e `validador-cnpj.html` e criar a página dedicada do Organizador Fiscal num molde único (o que faz e para quem, passo a passo, formatos aceitos, exemplo com dados de demonstração, privacidade, limitações, FAQ e JSON-LD `FAQPage` + `SoftwareApplication`).
2. **Ampliar `sitemap.xml`, `sw.js` e `tests/smoke_test.py`** para cobrir as novas páginas explicativas.
3. **Fase 2 das ferramentas:** adição de novas ferramentas e migração gradual da interface de cada ferramenta para sua própria página, uma por vez.
