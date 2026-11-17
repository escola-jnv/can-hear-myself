# Can Hear Myself

Cada músico controla a própria mix de fone pelo celular. Servidor local no PC da igreja, integrado ao Proskë.

## Rodar o executável Windows (.exe autônomo)

Você pode rodar diretamente o executável independente (com Node embutido, sem precisar ter Node instalado no PC da igreja):

- **Aplicativo Desktop (recomendado para o usuário)**:
  Basta dar dois cliques em `can-hear-myself.exe`.
  - **Zero terminal preto**: não assusta o usuário com telas de comando.
  - **Node embutido**: roda em segundo plano mesmo sem Node.js instalado na máquina.
  - **Janela Web App dedicada**: abre direto a janela do aplicativo sem barras de navegação ou abas.
  - **Encerramento limpo**: ao fechar a janela no "X", o servidor em segundo plano fecha automaticamente.

- **Modo Terminal / CLI (para depuração)**:
  Se quiser ver os logs em tempo real no prompt de comando:
  ```bash
  .\can-hear-myself-cli.exe --port 3000 --mixer ui24r
  ```

Para gerar novamente os executáveis:
```bash
npm run build:exe
```

## Rodar em desenvolvimento (com mesa virtual)

```bash
npm install
copy config\example.config.json config\app.config.json
npm start
```

Abra no celular (mesma rede Wi-Fi): `http://IP-DO-PC:3000`
Painel do técnico: `http://IP-DO-PC:3000/tecnico.html`

Com `"mixer": { "model": "mock" }` o app usa a **mesa virtual**: nada de equipamento, e cada comando aparece no terminal.

## Estrutura

| Pasta | O que tem |
| --- | --- |
| `server/core` | Regras de negócio (não sabe qual mesa está ligada) |
| `server/drivers` | Um driver por mesa: ui24r, x32, xair, mock |
| `server/realtime` | WebSocket com celulares e painel |
| `server/storage` | Leitura e escrita dos JSON em `data/` |
| `server/sync` | Sincronização com o Proskë (setlist, stems) |
| `public` | App do músico e painel do técnico (HTML/CSS/JS puros) |
| `desktop` | App Windows (Tauri) com o painel do servidor |
| `docs` | Fonte única de verdade, regras, protocolo, decisões |
| `data` | Dados do cliente (fora do Git) |

## Regras de organização

- `server/core` nunca importa um driver específico.
- `public` só fala com o servidor, nunca com a mesa.
- Regra de negócio nova vai primeiro em `docs/regras-de-negocio.md`.
- Decisão importante vira um arquivo em `docs/decisoes/`.
