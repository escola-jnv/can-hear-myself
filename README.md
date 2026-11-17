# Can Hear Myself

Cada músico controla a própria mix de fone pelo celular. Servidor local no PC da igreja, integrado ao Proskë.

## Usar na igreja (Windows)

1. Dê dois cliques em `can-hear-myself.exe` (não precisa instalar Node).
2. O **Painel do Técnico** abre numa janela própria, sem terminal, e mostra o endereço para os músicos.
3. Os músicos, na mesma rede Wi-Fi da mesa, abrem esse endereço no celular.
4. Ao fechar a janela no "X", o servidor também fecha.

Para ver os logs em tempo real (depuração), use a versão de terminal:

```bash
.\can-hear-myself-cli.exe --port 3000 --mixer ui24r
```

Se aparecer "a porta já está em uso", o servidor já está aberto. Detalhes de erro ficam em `data\logs\erros.log`.

## Desenvolvimento

```bash
npm install
copy config\example.config.json config\app.config.json
npm run mock        # servidor com a mesa virtual
npm test            # testes
npm run build:exe   # gera o can-hear-myself.exe
```

- Músicos: `http://IP-DO-PC:3000`
- Técnico: `http://IP-DO-PC:3000/tecnico.html`

## Estrutura

| Pasta | O que tem |
| --- | --- |
| `server/core` | Regras de negócio (não sabe qual mesa está ligada) |
| `server/drivers` | Um driver por mesa: ui24r, x32, xair, mock |
| `server/discovery` | Busca automática da mesa na rede |
| `server/realtime` | WebSocket com celulares e painel |
| `server/storage` | Leitura e escrita dos JSON em `data/` |
| `server/sync` | Sincronização com o Proskë (futuro) |
| `public` | App do músico e Painel do Técnico (HTML/CSS/JS puros) |
| `desktop` | App Windows com Tauri (planejado) |
| `build` | Geração do `.exe` e dos ícones |
| `docs` | Regras, protocolo, API, drivers, build, decisões e changelogs |
| `ai` | Skills e resumos de release |
| `data` | Dados do cliente: presets e logs (fora do Git) |

## Documentação

- [Regras de negócio](docs/regras-de-negocio.md)
- [Protocolo WebSocket](docs/protocolo-ws.md)
- [API HTTP](docs/api-http.md)
- [Mesas e drivers](docs/drivers.md)
- [Gerar o executável](docs/build.md)
- [Como comitar e publicar](ai/skills/release-github/SKILL.md)

## Regras de organização

- `server/core` nunca importa um driver específico.
- `public` só fala com o servidor, nunca com a mesa.
- Regra de negócio nova vai primeiro em `docs/regras-de-negocio.md`.
- Decisão importante vira um arquivo em `docs/decisoes/`.
- Versão e commits seguem `ai/skills/release-github/SKILL.md`.
