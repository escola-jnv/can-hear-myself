# Gerar o executável

1. `node build/build-server.js` — empacota o servidor num único `.exe` (Node SEA) em `desktop/src-tauri/binaries/`.
2. `cd desktop && npx tauri build` — gera o instalador Windows (precisa de Rust só na máquina de desenvolvimento).

O PC da igreja só instala o instalador; não precisa de Node nem Rust.
