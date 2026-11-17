# Protocolo WebSocket (celular/painel ↔ servidor)

Mensagens JSON: `{ "type": "...", ...dados }`

## Celular → servidor
| type | dados |
| --- | --- |
| `hello` | `{ role: "musician"\|"tech"\|"panel" }` |
| `join` | `{ person, instrument, aux }` |
| `setGroupLevel` | `{ group, step }` |
| `setFixedLevel` | `{ target: "master"\|"click"\|"talkback", step }` |
| `nudgeChannel` | `{ channel, deltaDb }` (ajuste fino) |
| `savePreset` / `loadPreset` | `{ name? }` |
| `help` | `{ reason: 1..5 }` |
| `helpSeen` | `{ id }` (técnico) |
| `setSong` | `{ songId }` |

## Servidor → celular
| type | dados |
| --- | --- |
| `state` | estado completo da aux da pessoa |
| `auxTaken` | `{ aux, by }` |
| `song` | `{ id, name, key, bpm }` |
| `helpUpdate` | `{ id, status }` |
| `mixer` | `{ connected }` |
| `log` | linha do log (painel) |
