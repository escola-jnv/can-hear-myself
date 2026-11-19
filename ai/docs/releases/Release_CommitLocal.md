# v0.2.2 — Palco Afinado (commit local)

Resumo do ciclo para o próximo commit seguindo `ai/skills/release-github/SKILL.md`.

## Destaques da versão

1. **QR Code no Painel do Técnico**: Exibição do QR Code na tela inicial para conexão rápida dos músicos aos retornos pelo celular, com modal para ampliar.
2. **Escala 0 a 10 e Proporção Sonora**: Escala de volume expandida de 0 a 10 (nível 0 = mudo, 1 = -30 dB até 10 = +10 dB, default no nível 7).
3. **Correção do Master Auxiliar na Ui24R**: Ajuste do fader master do fone no retorno auxiliar via driver Soundcraft Ui24R.
4. **Prevenção de Zoom no iPhone / Mobile**: Bloqueio de zoom indesejado ao dar duplo toque em botões e faders em dispositivos iOS / mobile.
5. **Ícone por Canal no Painel do Técnico**: Seletor de ícone personalizável por canal no painel de configuração, com novos ícones integrados (`mic`, `qr-code`).

## Commits sugeridos (um objetivo por commit)

1. `v0.2.2 [mesa] fix: ajusta master do fone aux na Ui24R e amplia escala de volume para 0-10`
   - `server/drivers/ui24r/index.js`, `server/core/mix.js`, `tests/core/defaults.test.js`, `tests/core/mix.test.js`
2. `v0.2.2 [musico] feat: escala 0-10 no app, prevencao de zoom no iOS e icones de canais`
   - `public/index.html`, `public/css/app.css`, `public/js/ui/level-row.js`, `public/js/app.js`, `public/js/icons.js`, `public/js/lucide-lite.js`, `build/gen-icons.js`
3. `v0.2.2 [tecnico] feat: exibe QR code para conexao e seletor de icones por canal`
   - `public/tecnico.html`, `public/js/qrcode.min.js`, `server/index.js`, `config/example.config.json`
4. `v0.2.2 [docs] chore: atualiza versao para 0.2.2, regras de negocio e changelog`
   - `package.json`, `package-lock.json`, `server/version.js`, `docs/regras-de-negocio.md`, `docs/changelogs/index.json`, `docs/changelogs/0.2.2.json`, `ai/docs/releases/Release_CommitLocal.md`

## Antes de comitar

- Quarteto de versão sincronizado em 0.2.2.
- `npm test` → 20 testes, 0 falhas.
