const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const config = require('./config');
const { createDriver } = require('./drivers');
const Store = require('./storage/store');
const Hub = require('./realtime/hub');
const Mix = require('./core/mix');
const Sessions = require('./core/sessions');
const { Presets } = require('./core/presets');
const { Help } = require('./core/help');
const { Setlist } = require('./core/setlist');
const ActivityLog = require('./core/activity-log');

const PUBLIC = path.join(__dirname, '..', 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json' };

const store = new Store();
const driver = createDriver(config.mixer.model, config.mixer);
const mix = new Mix(config, driver);
const sessions = new Sessions();
const presets = new Presets(store);
const help = new Help();
const setlist = new Setlist(store);
let hub;
const log = new ActivityLog(store, (line) => hub && hub.broadcast({ type: 'log', line }, (ws) => ws.role !== 'musician'));

const server = http.createServer((req, res) => {
  if (req.url === '/api/config') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ levels: config.levels, groups: config.groups, auxes: config.auxes, fixed: config.fixed }));
  }
  if (req.url === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ mixer: { model: config.mixer.model, ip: config.mixer.ip, connected: driver.connected }, urls: localUrls(), sessions: sessions.list(), song: setlist.current, help: help.open_(), log: log.recent.slice(-50) }));
  }
  const rel = req.url === '/' ? '/index.html' : decodeURIComponent(req.url.split('?')[0]);
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Não encontrado'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});

hub = new Hub(server, async (ws, msg) => {
  const who = ws.who;
  switch (msg.type) {
    case 'hello':
      ws.role = msg.role || 'musician';
      hub.send(ws, { type: 'mixer', connected: driver.connected });
      if (setlist.current) hub.send(ws, { type: 'song', ...setlist.current });
      return;
    case 'join': {
      const aux = Number(msg.aux);
      const r = sessions.join(aux, { clientId: ws.id, person: msg.person, instrument: msg.instrument });
      if (!r.ok) return hub.send(ws, { type: 'auxTaken', aux, by: r.takenBy });
      ws.who = { person: msg.person, instrument: msg.instrument, aux };
      const saved = presets.load(ws.who);
      if (saved) await mix.apply(aux, saved);
      log.add({ person: msg.person, action: 'entrou', aux, instrument: msg.instrument });
      return hub.send(ws, { type: 'state', ...mix.snapshot(aux), who: ws.who });
    }
    case 'setGroupLevel': {
      if (!who) return;
      const r = await mix.setGroupLevel(who.aux, msg.group, Number(msg.step));
      if (r.ok) log.add({ person: who.person, action: 'nível do grupo', target: msg.group, value: r.step, aux: who.aux });
      return hub.send(ws, { type: 'state', ...mix.snapshot(who.aux), who, warning: r.ok ? undefined : r.reason });
    }
    case 'setFixedLevel':
      if (!who) return;
      await mix.setFixedLevel(who.aux, msg.target, Number(msg.step));
      log.add({ person: who.person, action: 'nível', target: msg.target, value: msg.step, aux: who.aux });
      return hub.send(ws, { type: 'state', ...mix.snapshot(who.aux), who });
    case 'nudgeChannel':
      if (!who) return;
      await mix.nudgeChannel(who.aux, Number(msg.channel), Number(msg.deltaDb));
      log.add({ person: who.person, action: 'ajuste fino', target: `canal ${msg.channel}`, value: msg.deltaDb, aux: who.aux });
      return hub.send(ws, { type: 'state', ...mix.snapshot(who.aux), who });
    case 'savePreset':
      if (!who) return;
      presets.save(who, msg.name, mix.snapshot(who.aux));
      log.add({ person: who.person, action: 'salvou preset', target: msg.name || 'padrao', aux: who.aux });
      return hub.send(ws, { type: 'presetSaved', name: msg.name || 'padrao' });
    case 'loadPreset': {
      if (!who) return;
      const p = presets.load(who, msg.name);
      if (p) await mix.apply(who.aux, p);
      return hub.send(ws, { type: 'state', ...mix.snapshot(who.aux), who });
    }
    case 'help': {
      if (!who) return;
      const req = help.open(who, Number(msg.reason));
      log.add({ person: who.person, action: 'pediu ajuda', target: req.label, aux: who.aux });
      hub.broadcast({ type: 'help', request: req }, (c) => c.role !== 'musician');
      return hub.send(ws, { type: 'helpUpdate', id: req.id, status: req.status });
    }
    case 'helpSeen': {
      const req = help.seen(Number(msg.id));
      if (req) hub.broadcast({ type: 'helpUpdate', id: req.id, status: req.status }, (c) => c.who && c.who.aux === req.aux || c.role !== 'musician');
      return;
    }
    case 'setSong': {
      const song = setlist.setCurrent(msg.songId);
      if (song.bpm) await driver.setTempo(song.bpm);
      log.add({ person: who ? who.person : 'técnico', action: 'trocou a música', target: song.name });
      return hub.broadcast({ type: 'song', ...song });
    }
    case 'addSong': {
      const song = setlist.addSong(msg);
      return hub.broadcast({ type: 'songs', songs: setlist.songs(), added: song });
    }
    case 'close':
      if (who) log.add({ person: who.person, action: 'saiu', aux: who.aux });
      sessions.leave(ws.id);
      return;
  }
});

driver.on('status', ({ connected }) => hub.broadcast({ type: 'mixer', connected }));

function localUrls() {
  const urls = [];
  for (const list of Object.values(os.networkInterfaces())) for (const i of list || [])
    if (i.family === 'IPv4' && !i.internal) urls.push(`http://${i.address}:${config.port}`);
  return urls;
}

server.listen(config.port, async () => {
  console.log(`Can Hear Myself rodando. Mesa: ${config.mixer.model}`);
  for (const u of localUrls()) console.log(`  Celulares: ${u}   Técnico: ${u}/tecnico.html`);
  try { await driver.connect(); } catch (e) { console.error(`Falha ao conectar na mesa: ${e.message}`); }
});

module.exports = { server };
