# Gerar o executável

## 1. Servidor em `.exe` (Node SEA, com Node embutido)

Na raiz do projeto:

```bash
npm run build:exe
```

O script (`build/build-server.js`):
1. Embute todos os arquivos de `public/` dentro do executável (`server/embedded-assets.js`, gerado — não vai para o Git).
2. Faz o bundle do servidor e dependências com `esbuild`.
3. Gera o blob SEA e injeta no `node.exe` com `postject`.
4. Copia o resultado para:
   - `can-hear-myself.exe` (raiz)
   - `desktop/src-tauri/binaries/chm-server-x86_64-pc-windows-msvc.exe` e `chm-server.exe` (sidecar do Tauri)

### Gerar o `.exe` de Windows a partir de outro sistema

Use o `node.exe` da **mesma versão** do Node que roda o build:

```bash
npm pack node-win-x64@$(node -v | tr -d v) && tar xzf node-win-x64-*.tgz
CHM_NODE_BINARY=package/bin/node.exe npm run build:exe
```

### Ícones

O app usa só os ícones listados em `build/gen-icons.js`. Para incluir um novo, adicione o nome lá e rode:

```bash
npm run icons
```

## 2. Rodar o `.exe`

Dois cliques em `can-hear-myself.exe`. O Painel do Técnico abre sozinho.

Opções:

```bash
can-hear-myself.exe --port 3001 --mixer ui24r --ip 10.10.1.1 --no-open
```

- Se a porta já estiver em uso, o programa avisa e abre o painel do servidor que já está rodando.
- Erros ficam em `data\logs\erros.log`.
- O Windows pode avisar "editor desconhecido" (o `.exe` não é assinado): **Mais informações → Executar assim mesmo**.

## 3. Instalador com Tauri (planejado)

Ainda não inicializado — ver `desktop/README.md`.
