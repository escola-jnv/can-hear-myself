const { WebSocketServer } = require('ws');

/** Envia e recebe mensagens dos celulares, do técnico e do painel. */
class Hub {
  constructor(server, onMessage) {
    this.wss = new WebSocketServer({ server });
    this.nextId = 1;
    // Erros do servidor HTTP (ex.: porta ocupada) são tratados em server/index.js
    this.wss.on('error', () => {});
    this.wss.on('connection', (ws, req) => {
      ws.id = this.nextId++;
      ws.userAgent = req && req.headers ? req.headers['user-agent'] : null;
      const ip = (req && req.socket && req.socket.remoteAddress) || '';
      // true quando a conexão vem do próprio PC do servidor (painel aberto no computador da mesa)
      ws.isLocal = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
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
