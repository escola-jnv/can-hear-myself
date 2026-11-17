# v0.2.0 — Palco Afinado (commit local)

Resumo do ciclo, para o próximo commit seguindo `ai/skills/release-github/SKILL.md`.

## Commits sugeridos (um objetivo por commit)

1. `v0.2.0 [mesa] fix: trocar mesa e buscar mesa so no computador do servidor`
   - server/index.js, server/realtime/hub.js
2. `v0.2.0 [ajuda] feat: tecnico marca pedido de ajuda como resolvido`
   - server/index.js, public/tecnico.html
3. `v0.2.0 [musico] feat: botao salvar minha mix e icones leves`
   - public/index.html, public/js/app.js, public/css/app.css, public/js/lucide-lite.js, build/gen-icons.js
4. `v0.2.0 [mix] fix: mix padrao tudo no nivel 3 e restaura funcoes de inicializacao da aux`
   - server/core/mix.js, tests/core/mix.test.js, tests/core/defaults.test.js, tests/core/help.test.js
5. `v0.2.0 [repertorio] improvement: confirmar troca de musica no painel`
   - public/tecnico.html
6. `v0.2.0 [docs] docs: protocolo, API HTTP, drivers, build, regras e changelog 0.2.0`
   - README.md, docs/*, ai/*
7. `v0.2.0 [infraestrutura] chore: versao 0.2.0, scripts e lockfile`
   - package.json, package-lock.json, server/version.js, .gitignore

## Antes de comitar

- Apagar `public/js/lucide.min.js` (substituído por `lucide-lite.js`), `build/gui_test.txt` e `build/node_gui.exe`.
- `git status -s` sem `??` necessários de fora (atenção: `server/app-window.js`, `server/version.js`, `public/js/icons.js`, `public/js/lucide-lite.js`, `build/gen-icons.js`, `docs/api-http.md`, `docs/changelogs/`, `ai/`).
- `npm test` → 15 testes, 0 falhas.
