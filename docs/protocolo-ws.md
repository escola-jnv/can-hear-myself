# Protocolo WebSocket (celular / painel ↔ servidor)

Conexão: `ws://IP-DO-SERVIDOR:3000` (mesma porta do HTTP).
Mensagens em JSON: `{ "type": "...", ...dados }`.

Quem manda cada mensagem é identificado pelo `hello`:
- `musician`: celular do músico (`index.html`)
- `tech`: Painel do Técnico (`tecnico.html`)

Conexões vindas do **próprio PC do servidor** (`127.0.0.1` / `::1`) são marcadas como locais.
Ações que mexem na mesa ou na configuração geral só são aceitas delas.

## Cliente → servidor

| type | Quem envia | Dados | O que faz |
| --- | --- | --- | --- |
| `hello` | todos | `{ role: "musician" \| "tech" }` | Identifica o cliente. O servidor responde com `mixer`, `song`, `songs` e, para o técnico, `sessions` e `helpList`. |
| `join` | músico | `{ person, instrument, aux, device? }` | Entra numa aux. Carrega o preset salvo ou a mix padrão (tudo no nível 3). Responde `state` ou `auxTaken`. |
| `setGroupLevel` | músico | `{ group, step }` | Nível (0–4) de um grupo virtual. |
| `setChannelLevel` | músico | `{ channel, step }` | Nível (0–4) de um canal individual (ajuste por peça). |
| `setFixedLevel` | músico | `{ target: "master" \| "click" \| "talkback", step }` | Nível dos controles fixos do topo. |
| `nudgeChannel` | músico | `{ channel, deltaDb }` | Ajuste fino em dB de um canal. |
| `savePreset` | músico | `{ name? }` | Salva a mix atual (pessoa + instrumento + aux). Responde `presetSaved`. |
| `loadPreset` | músico | `{ name? }` | Recarrega uma mix salva. Responde `state`. |
| `help` | músico | `{ reason: 1..5 }` | Abre pedido de ajuda. |
| `helpSeen` | técnico | `{ id }` | Marca o pedido como visto ("Técnico a caminho"). |
| `helpResolve` | técnico | `{ id }` | Encerra o pedido. |
| `setSong` | técnico | `{ songId }` | Troca a música atual (o painel pede confirmação). |
| `addSong` | técnico | `{ name, key, bpm }` | Cadastra música (BPM abaixo de 100 é dobrado). |
| `removeSong` | técnico | `{ songId }` | Remove música do repertório. |
| `reorderSongs` | técnico | `{ fromIndex, toIndex }` | Muda a ordem do repertório. |
| `setSongs` | técnico | `{ songs: [...] }` | Substitui o repertório inteiro. |
| `setMixer` | técnico **local** | `{ model, ip }` | Troca a mesa (`mock`, `ui24r`, `x32`, `xair`). Recusado se vier de outro aparelho. |

## Servidor → cliente

| type | Para quem | Dados |
| --- | --- | --- |
| `state` | músico | Mix da aux: `{ groups, channels, fixed, offsets, who, warning? }` |
| `auxTaken` | músico | `{ aux, by }` — a aux já tem dono |
| `presetSaved` | músico | `{ name }` |
| `configUpdate` | todos | `{ config: { levels, groups, auxes, fixed, channelNames } }` — mapeamento mudou |
| `mixer` | todos | `{ connected, model, ip }` |
| `song` | todos | `{ id, name, key, bpm }` — música atual |
| `songs` | todos | `{ songs: [...] }` — repertório |
| `helpUpdate` | músico da aux + técnicos | `{ id, status: "aberto" \| "visto" \| "resolvido" }` |
| `help` | técnicos | `{ request }` — pedido novo |
| `helpList` | técnico (no `hello`) | `{ requests: [...] }` — pedidos em aberto |
| `sessions` | técnicos | `{ sessions: [{ aux, person, instrument, device }] }` |
| `log` | técnicos | `{ line: { at, person, action, target?, value?, aux? } }` |
| `error` | quem pediu | `{ message }` |
