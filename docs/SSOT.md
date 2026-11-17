# Single Source of Truth

A versão viva deste documento está no Claude Docs ("App de Retorno Ui24R — Single Source of Truth").
Ao tomar uma decisão, registre lá e crie um arquivo em `docs/decisoes/`.

Resumo:
- Servidor local Node.js no PC da igreja; celulares acessam por IP local.
- Front-end HTML/CSS/JS puros, leve, funciona em celulares antigos. Ícones: só os usados (`public/js/lucide-lite.js`, ~6 KB, gerado por `npm run icons`).
- Camada de drivers por mesa (Ui24R primeiro; X32/M32 e X Air via OSC; mesa virtual para testes).
- Grupos virtuais + ajuste por canal; 5 níveis + ajuste fino.
- Presets por pessoa + instrumento + aux (botão "Salvar").
- Pedido de ajuda com 5 tipos (aberto → visto → resolvido); repertório no Painel do Técnico.
- Ações que mexem na mesa/configuração só no PC do servidor.
- Distribuição: `.exe` único (Node SEA) que abre o Painel do Técnico numa janela própria; Tauri planejado.
- Integração com o Proskë (Supabase); stems em Cloudflare R2, cache local, motor de áudio nativo (futuro).

Documentos:
- `docs/regras-de-negocio.md` — regras do produto
- `docs/protocolo-ws.md` — mensagens em tempo real
- `docs/api-http.md` — rotas HTTP
- `docs/drivers.md` — mesas e busca automática
- `docs/build.md` — como gerar o `.exe`
- `docs/changelogs/` — notas de cada versão
- `ai/skills/release-github/SKILL.md` — como comitar, versionar e publicar
