# API HTTP do servidor local

Base: `http://IP-DO-SERVIDOR:3000`. Todas as respostas são JSON.
"Só local" = aceito apenas quando o pedido vem do próprio PC do servidor; de outro aparelho responde `403`.

| Método | Rota | Acesso | O que faz |
| --- | --- | --- | --- |
| GET | `/api/status` | qualquer um | Versão, mesa, endereços (`musicianUrls`, `techUrls`), conectados (`connectedCount`, `sessions`), música atual, repertório, pedidos de ajuda abertos, últimas 100 linhas do log e `canEditConfig`. |
| GET | `/api/config` | qualquer um | Níveis, grupos, saídas aux, canais fixos, nomes dos canais e mesa. |
| POST | `/api/config` | **só local** | Salva o mapeamento (`groups`, `fixed`, `auxes`, `channelNames`) em `config/app.config.json` e avisa todos com `configUpdate`. |
| GET | `/api/mixer/scan` | **só local** | Procura mesas na rede (ver `docs/drivers.md`). |
| POST | `/api/mixer/connect` | **só local** | `{ model, ip }` — conecta noutra mesa. |

Arquivos estáticos (`/`, `/tecnico.html`, `/js/...`, `/css/...`) vêm da pasta `public/` ou, no `.exe`, de dentro do próprio executável.
