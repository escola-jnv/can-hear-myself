# Gerar o executável

## 1. Gerar o servidor em `.exe` (Node SEA com Node embutido)

Execute na raiz do projeto:

```bash
npm run build:exe
```
ou:
```bash
node build/build-server.js
```

O script realiza automaticamente:
1. Mapeia e embute todos os arquivos estáticos de `public/` em memória (`server/embedded-assets.js`), garantindo que o `.exe` funcione de forma 100% autônoma até se for copiado para outra máquina ou pasta sem arquivos auxiliares.
2. Faz o bundle do servidor e de suas dependências (`ws`, `soundcraft-ui-connection`, etc.) usando `esbuild`.
3. Prepara a imagem SEA (Single Executable Application) do Node.js.
4. Injeta o runtime do Node SEA no binário usando `postject`.
5. Gera os executáveis prontos:
   - `can-hear-myself.exe` (na raiz do projeto, para execução direta no Windows)
   - `desktop/src-tauri/binaries/chm-server-x86_64-pc-windows-msvc.exe` (sidecar para Tauri)
   - `desktop/src-tauri/binaries/chm-server.exe` (sidecar padrão)

### Executando o `.exe`

Basta dar dois cliques no `can-hear-myself.exe` ou rodar via terminal:

```bash
.\can-hear-myself.exe
```

Parâmetros opcionais via CLI:
```bash
.\can-hear-myself.exe --port 3000 --mixer ui24r --ip 10.10.1.1
```

## 2. Gerar o instalador Windows completo com Tauri (opcional)

```bash
cd desktop && npx tauri build
```
Gera o instalador final `.msi`/`.exe` para Windows.
