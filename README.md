# AutoContábil Hub

Suíte web de produtividade contábil, fiscal e financeira — **100% client-side**. Nenhum XML, extrato ou documento sai do computador do usuário.

- **Módulo 1** – Extrator & Consolidador de XML (NF-e mod. 55 / NFC-e mod. 65) → exporta CSV (`;`, BOM UTF-8, abre direto no Excel).
- **Módulo 2** – Conciliador Bancário (OFX/CSV × Razão) em 4 fases → relatório de auditoria em CSV.
- **Módulo 3** – Organizador & Renomeador Fiscal → manifesto De/Para (CSV) + ZIP com nomes e pastas padronizados (JSZip).

O projeto é modular: `index.html` carrega os estilos de `styles.css` e os módulos JavaScript de `js/`. Tailwind CSS, JSZip e a fonte Inter são carregados via CDN. Não há etapa de build nem dependências locais.

## Testar localmente

```bash
# Windows
py -m http.server 8080
# macOS/Linux
python3 -m http.server 8080
```

Também é possível usar `npx serve .` ou a extensão Live Server do VS Code. Depois de iniciar o servidor, abra http://localhost:8080. O site não funciona ao abrir `index.html` diretamente, pois os módulos ES precisam ser carregados por HTTP. É necessária conexão com a internet para os recursos via CDN.

Clique em **Carregar Lote de Demonstração**, **Simulação** e **Carregar exemplos** para testar os três módulos.

### Formatos aceitos
- **OFX**: tags `STMTTRN`, `TRNAMT`, `DTPOSTED`, `MEMO`/`NAME`.
- **CSV**: separador `;`, `,` ou tab; colunas `data; descrição; valor` (ou `débito`/`crédito`). Entradas positivas, saídas negativas.

## Publicar no GitHub

```bash
git init
git add .
git commit -m "AutoContábil Hub: versão inicial"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/autocontabil-hub.git
git push -u origin main
```

(Crie antes o repositório vazio `autocontabil-hub` em github.com/new.)

## Deploy gratuito (menos de 5 minutos)

**Vercel** — vercel.com → *Add New → Project* → importe o repositório → *Framework Preset: Other* → *Deploy*. (Ou `npx vercel --prod` na pasta.)

**Netlify** — app.netlify.com → *Add new site → Import an existing project* → escolha o repositório → deixe *Build command* vazio e *Publish directory* `.` → *Deploy*. (Ou arraste a pasta em app.netlify.com/drop.)

**GitHub Pages** — repositório → *Settings → Pages* → *Source: Deploy from a branch* → `main` / `(root)` → *Save*. URL: `https://SEU-USUARIO.github.io/autocontabil-hub/`.

## Contato

Yuri Monteiro • WhatsApp: (83) 98639-8472 • João Pessoa - PB
