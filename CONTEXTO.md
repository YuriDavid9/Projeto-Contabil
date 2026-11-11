# Contexto do projeto

- **Projeto:** AutoContábil Hub (Ferramentas Fiscais Locais + Catálogo de Ferramentas + Portal de Notícias).
- **Autor e mantenedor:** Yuri David (Yuri Monteiro).
- **Arquitetura:** Aplicação web estática, modular (ES Modules), 100% client-side para as ferramentas contábeis/fiscais, sem build nem bundler, estilizada com Tailwind CSS via CDN.
- **Execução local:** `python3 -m http.server 8080` na raiz do repositório.
- **Testes automatizados:** `npm test` (testes unitários em `tests/hub.test.js` via `node:test`, sem dependências externas) e `python tests/smoke_test.py` (smoke test E2E + guarda de privacidade e codificação UTF-8).

## Estado atual e decisões registradas

1. **Estrutura e Publicação (Fase 1):**
   - Todos os arquivos da aplicação residem na raiz (`index.html`, `styles.css`, `README.md`, `js/`), deixando apenas `.vscode/settings.json` na pasta `.vscode/`.
   - O **Catálogo de Ferramentas** é a tela principal de `index.html` (sem o botão "Abrir App" no cabeçalho), e a barra de ferramentas interna (`#tool-back-bar`) permite alternar entre os módulos com suporte completo a teclado e ARIA (`role="tablist"`, `role="tab"`, `aria-controls`, `tabindex`).
2. **Utilitários e Lógica (`js/utils.js` — Fase 2):**
   - `parseMoney`: considera negativo apenas hífen no início (`^\s*-`), no fim (`-\s*$`), parênteses `(100,00)` ou sufixo `D` (débito), evitando transformar strings como `"12-03"` em valores negativos.
   - `csvCell`: prefixa apóstrofo (`'`) apenas quando o primeiro caractere é `=`, `+`, `-`, `@`, `\t` ou `\r` em células não numéricas, preservando números negativos e textos com hífen interno (`"Pgto Beta - NF 7712"`).
3. **Conciliador Bancário (`js/conciliadorModule.js` — Fase 3):**
   - Substituídos cálculos repetidos de `Date` por `dayDiff()` de `js/utils.js`.
   - Tolerância padrão em `index.html` (`#cb-tol`) ajustada para `2` dias.
   - Fase de divergência exige `similarity > 0` mesmo quando a diferença é `<= R$ 1,00`.
   - Detecção de possíveis duplicidades no extrato e no razão (mesma data, mesmo valor e descrição igual/similar), sinalizando `"possível duplicidade"` na coluna `obs` e exibindo contagem/aviso sem remover automaticamente.
   - `parseOFX`: desduplica transações pelo `FITID` dentro do mesmo arquivo (informando quantas foram ignoradas) e lê `TRNAMT` com ponto decimal padrão (tratando vírgula apenas quando não há ponto).
4. **Extrator de XML (`js/xmlModule.js` — Fase 4):**
   - Classificação explícita de `cStat` (`100`/`150` = Autorizada; `101`/`151`/`135` = Cancelada; `110`/`301`/`302` = Denegada), exibindo selo na tabela e no modal e excluindo canceladas/denegadas dos KPIs de faturamento e impostos.
   - Conferência de totais lendo `vSeg` e `vOutro` (`vProd + vFrete + vSeg + vOutro + vST + vIPI - vDesc` vs `vNF` e soma dos itens vs `vProd`, tolerância `0.05`), gerando aviso `"totais não conferem"`.
   - Busca de `nProt`, `cStat` e `chNFe` restrita a `protNFe/infProt`, e leitura dos itens restrita a `det`.
   - CSV exportado inclui as colunas `"Status"` e `"Aviso de conferência"`.
5. **Organizador Fiscal (`js/organizadorModule.js` — Fase 5):**
   - Regex `NOISE` enxuta apenas para ruídos reais de arquivo (`final`, `scan`, `whatsapp`, `copia`, `image` etc.), preservando nomes como `"Mar Azul"` e `"Dez Distribuidora"`.
   - Nome base limitado a 120 caracteres sem extensão (incluindo sufixos de desduplicação `_2`, `_3`).
   - Progresso exibido no botão `#og-zip` e aviso quando o lote ultrapassa 300 MB.
6. **Qualidade, Acessibilidade, Testes e CI (Fases 6 e 7):**
   - Módulo dedicado `js/modal.js` com gerenciamento de foco (focus trap com `Tab`/`Shift+Tab` e devolução do foco ao fechar).
   - Contêiner `#toasts` com `role="status"` e `aria-live="polite"`.
   - Nota transparente sobre privacidade e carregamento de bibliotecas visuais via CDN no rodapé e no `README.md`.
   - **Suíte `tests/hub.test.js` (`node --test`)** e workflow `.github/workflows/test.yml` ativos ao lado de `.github/workflows/static-smoke.yml`.

## Pendências

- Configurar `CONTACT_ENDPOINT` e `CONTACT_EMAIL` em `js/contactModule.js`.
- Rodar `sql/migrations/2026-11-11_hardening.sql` no SQL Editor do Supabase.
