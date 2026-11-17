# Mesas de som: drivers e busca automática

## Drivers disponíveis

| Modelo (`mixer.model`) | Mesa | Situação |
| --- | --- | --- |
| `mock` | Mesa virtual (testes, imprime cada comando no terminal) | Pronto |
| `ui24r` | Soundcraft Ui24R (WebSocket, `soundcraft-ui-connection`) | Inicial, **não testado na mesa real** |
| `x32` | Behringer X32 / Midas M32 (OSC, porta 10023) | A implementar |
| `xair` | Behringer X Air / XR18 (OSC, porta 10024) | A implementar |

## Como criar um driver

1. Crie `server/drivers/<modelo>/index.js`.
2. Exporte uma classe que estende `MixerDriver` (`server/drivers/driver.interface.js`).
3. Implemente: `connect()`, `disconnect()`, `setAuxSend(aux, channel, db)`, `setAuxMaster(aux, db)`, `muteAuxSend(aux, channel, muted)` e, se a mesa tiver, `setTempo(bpm)`.
4. Emita `"status"` com `{ connected: boolean }` ao conectar e desconectar.
5. Registre o modelo em `server/drivers/index.js`.
6. Crie testes em `tests/` usando a mesa virtual como referência.

`db = null` significa mutar o envio. Nunca envie valor acima de `config.maxDb` (o núcleo já limita).

## Busca automática da mesa (`server/discovery/find-mixer.js`)

Usada pelo Painel do Técnico (rota `/api/mixer/scan`, só no PC do servidor).

- Monta a lista de IPs das redes reais do PC (ignora placas virtuais: Hyper-V, WSL, Docker, VirtualBox).
- Sempre inclui `10.10.1.1`, o IP padrão do Wi-Fi da própria Ui24R.
- Ui24R: testa conexão HTTP nos IPs.
- X32 / X Air: envia `/xinfo` por OSC em broadcast e espera resposta.
- Retorna `{ mixers: [...], scannedCount }`.
