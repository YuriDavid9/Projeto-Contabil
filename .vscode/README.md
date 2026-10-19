# AutoContábil Hub

Suíte web de produtividade contábil, fiscal e financeira — **100% client-side**. Nenhum XML, extrato ou documento sai do computador do usuário.

- **Módulo 1** – Extrator & Consolidador de XML (NF-e mod. 55 / NFC-e mod. 65) → exporta CSV (`;`, BOM UTF-8, abre direto no Excel).
- **Módulo 2** – Conciliador Bancário (OFX/CSV × Razão) em 4 fases → relatório de auditoria em CSV.
- **Módulo 3** – Organizador & Renomeador Fiscal → manifesto De/Para (CSV) + ZIP com nomes e pastas padronizados (JSZip).

Arquivo único: `index.html` (Tailwind CSS e JSZip via CDN). Sem build, sem dependências locais.

## Testar localmente

```bash
# opção 1: abrir direto
# dê dois cliques em index.html

# opção 2: servidor local (recomendado)
python3 -m http.server 8080
# ou: npx serve .
# abra http://localhost:8080
```

Clique em **Carregar Lote de Demonstração**, **Carregar Simulação de Conciliação** e **Carregar 6 Exemplos Caóticos** para ver cada módulo funcionando. Requer internet apenas para carregar Tailwind, JSZip e a fonte Inter pelos CDNs.

### Formatos aceitos
- **OFX**: tags `STMTTRN`, `TRNAMT`, `DTPOSTED`, `MEMO`/`NAME`.
- **CSV**: separador `;`, `,` ou tab; colunas `data; descrição; valor` (ou `débito`/`crédito`). Entradas positivas, saídas negativas.

## Publicar no GitHub

```bash
git init
git add index.html README.md
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
