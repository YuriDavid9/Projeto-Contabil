# AutoContábil Hub

Aplicação web modular para apoiar tarefas contábeis, fiscais e financeiras, acompanhada do **Portal de Notícias do AutoContábil Hub**.

- **Ferramentas locais (`index.html`):** XMLs, extratos OFX/CSV e documentos PDF são processados **100% localmente no navegador** (nenhum arquivo sai do computador e nenhum script do banco de dados é carregado nessas páginas).
- **Portal de Notícias (`noticias.html`, `noticia.html`, `entrar.html`, `admin.html`):** utiliza banco de dados e autenticação em nuvem (**Supabase**) apenas para leitura de notícias, contas de usuários e comentários.
- **Formulário de contato:** envia somente a mensagem informada após configurar o provedor em `js/contactModule.js`.

## Arquitetura

- `index.html` contém as abas das ferramentas locais; `styles.css` contém os estilos compartilhados.
- `js/xmlModule.js` extrai NF-e/NFC-e, importa XML/ZIP, valida chave/cStat, filtra dados e exporta CSV/XLSX.
- `js/conciliadorModule.js` concilia OFX/CSV, permite vínculo manual, aviso de duplicados e armazenamento local opt-in.
- `js/organizadorModule.js` organiza arquivos, extrai texto de PDFs quando possível e salva regras no navegador.
- `js/contactModule.js` controla o formulário de contato; `js/utilitiesModule.js` fornece validadores, conversores, mesclagem e cálculo estimado.
- `js/app.js` coordena a navegação das ferramentas; `js/modo.js`, `js/glossario.js`, `js/ajuda.js` e `js/passos.js` controlam os modos Guiado e Completo.
- `noticias.html`, `noticia.html`, `entrar.html` e `admin.html` compõem o Portal de Notícias, apoiados pelos módulos exclusivos em `js/portal/` (`config.js`, `supabase.js`, `auth.js`, `layout.js`, `posts.js`, `comments.js` e `admin.js`).
- `sql/schema.sql` e `sql/seed.sql` guardam a estrutura do banco PostgreSQL (Supabase), gatilhos e políticas de segurança RLS (Row Level Security).
- `privacidade.html`, `termos.html`, `404.html`, `manifest.webmanifest` e `sw.js` são as páginas institucionais e recursos de publicação/PWA.

Não há build nem dependências locais. Tailwind CSS, JSZip, Inter, Supabase JS, Marked e DOMPurify vêm de CDN; SheetJS e PDF.js são carregados sob demanda.

## Executar localmente

Na raiz do repositório, inicie um servidor HTTP local (os módulos ES precisam de `http://`, não funcionam abrindo o arquivo direto com duplo clique):

```powershell
python3 -m http.server 5500 --bind 127.0.0.1
```

Abra http://localhost:5500 para as ferramentas ou http://localhost:5500/noticias.html para o portal de notícias. *(Você também pode usar a extensão Live Server do VS Code).*

## Publicar

O projeto é estático e não precisa de comando de build.

1. No GitHub, abra **Settings → Pages**.
2. Escolha **Deploy from a branch**, branch `main`, pasta `/(root)` e salve.
3. No painel do **Supabase** (*Authentication → URL Configuration*), defina o **Site URL** para `https://yuridavid9.github.io/Projeto-Contabil` e mantenha `https://yuridavid9.github.io/Projeto-Contabil/entrar.html` em **Redirect URLs**.

## Contato

Yuri David • WhatsApp: (83) 98639-8472 • João Pessoa - PB
