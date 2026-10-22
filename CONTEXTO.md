# Contexto do projeto

- Projeto: AutoContábil Hub.
- Autor e mantenedor: Yuri David.
- Aplicação web estática, modular, sem build; os arquivos fiscais são processados no navegador.
- Para executar localmente, use `python3 -m http.server 8080` na raiz do repositório.
- O formulário de contato é o único fluxo que pode enviar dados a um serviço externo, depois de configurado em `js/contactModule.js`.

- Estrutura conferida: `index.html` e `styles.css` na raiz, módulos ES em `js/` e apenas `settings.json` em `.vscode/`. Caminhos relativos permanecem corretos; nenhum movimento foi necessário nesta etapa.
- O README descreve a estrutura modular e usa `python3 -m http.server 8080` como método local.
