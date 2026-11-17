const { WebSocketServer } = require('ws');

/** Envia e recebe mensagens dos celulares, do técnico e do painel. */
class Hub {
  constructor(server, onMessage) {
    this.wss = new WebSocketServer({ server });
    this.nextId = 1;
    this.wss.on('connection', (ws) => {
      ws.id = this.nextId++;
      ws.on('message', (raw) => {
        let msg; try { msg = JSON.parse(raw); } catch { return; }
        onMessage(ws, msg).catch((err) => this.send(ws, { type: 'error', message: err.message }));
      });
      ws.on('close', () => onMessage(ws, { type: 'close' }).catch(() => {}));
    });
  }
  send(ws, msg) { if (ws.readyState === 1) ws.send(JSON.stringify(msg)); }
  broadcast(msg, filter = () => true) { for (const ws of this.wss.clients) if (filter(ws)) this.send(ws, msg); }
}

module.exports = Hub;
