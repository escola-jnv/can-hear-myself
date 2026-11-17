# App Windows (Tauri)

Ainda não inicializado. Para criar o projeto Tauri (precisa de Rust só na máquina de desenvolvimento):

```bash
cd desktop
npm create tauri-app@latest -- --template vanilla
```

Depois:
- Copie `src-tauri/tauri.conf.json` daqui sobre o gerado.
- Coloque o servidor empacotado em `src-tauri/binaries/chm-server-x86_64-pc-windows-msvc.exe`.
- Ative os plugins: `tauri-plugin-shell` (sidecar) e `tauri-plugin-autostart` (iniciar com o Windows).
