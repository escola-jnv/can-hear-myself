# App Windows (Tauri) — planejado

Hoje o `can-hear-myself.exe` já abre o Painel do Técnico numa janela própria (Edge/Chrome em modo app).
O Tauri vem depois, para ícone na bandeja, início com o Windows e instalador.

A janela do Tauri **não tem painel próprio**: `panel/index.html` só redireciona para `http://localhost:3000/tecnico.html`,
para existir um único Painel do Técnico (`public/tecnico.html`).

Para iniciar (Rust só na máquina de desenvolvimento):

```bash
cd desktop
npm create tauri-app@latest -- --template vanilla
```

Depois:
- Copie `src-tauri/tauri.conf.json` daqui sobre o gerado.
- O servidor empacotado já é copiado para `src-tauri/binaries/` pelo `npm run build:exe`.
- Ative os plugins `tauri-plugin-shell` (sidecar) e `tauri-plugin-autostart` (iniciar com o Windows).
