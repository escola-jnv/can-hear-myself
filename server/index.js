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

let embeddedAssets = {};
try { embeddedAssets = require('./embedded-assets'); } catch {}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

function findPublicDir() {
  const candidates = [
    path.join(process.cwd(), 'public'),
    path.join(path.dirname(process.execPath), 'public'),
    path.join(__dirname, 'public'),
    path.join(__dirname, '..', 'public')
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c) && fs.statSync(c).isDirectory()) return c;
    } catch {}
  }
  return null;
}

const store = new Store();
const driver = createDriver(config.mixer.model, config.mixer);
const mix = new Mix(config, driver);
const sessions = new Sessions();
const presets = new Presets(store);
const help = new Help();
const setlist = new Setlist(store);
let hub;
const log = new ActivityLog(store, (line) => hub && hub.broadcast({ type: 'log', line }, (ws) => ws.role !== 'musician'));

function isLocalRequest(req) {
  const ip = (req.socket && req.socket.remoteAddress) || '';
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
}

function buildStatus(req) {
  const urls = localUrls();
  const list = sessions.list();
  return {
    mixer: { model: config.mixer.model, ip: config.mixer.ip, connected: driver.connected },
    port: config.port,
    urls,
    musicianUrls: urls.length ? urls : [`http://localhost:${config.port}`],
    techUrls: (urls.length ? urls : [`http://localhost:${config.port}`]).map((u) => `${u}/tecnico.html`),
    connectedCount: list.length,
    sessions: list,
    song: setlist.current,
    help: help.open_(),
    log: log.recent.slice(-100),
    canEditConfig: req ? isLocalRequest(req) : false,
  };
}

const server = http.createServer((req, res) => {

  if (req.url === '/api/config') {
    if (req.method === 'POST') {
      if (!isLocalRequest(req)) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: 'O mapeamento só pode ser alterado no computador do servidor.' }));
      }
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (Array.isArray(data.groups)) config.groups = data.groups;
          if (data.fixed && typeof data.fixed === 'object') config.fixed = data.fixed;
          if (Array.isArray(data.auxes)) config.auxes = data.auxes;
          if (data.channelNames && typeof data.channelNames === 'object') config.channelNames = data.channelNames;

          const configDir = fs.existsSync(path.join(process.cwd(), 'config'))
            ? path.join(process.cwd(), 'config')
            : path.join(path.dirname(process.execPath), 'config');
          fs.mkdirSync(configDir, { recursive: true });
          const configFile = path.join(configDir, 'app.config.json');
          fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf8');

          if (hub) {
            hub.broadcast({
              type: 'configUpdate',
              config: {
                levels: config.levels,
                groups: config.groups,
                auxes: config.auxes,
                fixed: config.fixed,
                channelNames: config.channelNames || {}
              }
            });
          }
          log.add({ person: 'técnico', action: 'atualizou mapeamento de canais' });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: true }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, error: err.message }));
        }
      });
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      levels: config.levels,
      groups: config.groups,
      auxes: config.auxes,
      fixed: config.fixed,
      channelNames: config.channelNames || {}
    }));
  }
  if (req.url === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(buildStatus(req)));
  }
  const rel = req.url === '/' ? '/index.html' : decodeURIComponent(req.url.split('?')[0]);
  const publicDir = findPublicDir();
  if (publicDir) {
    const file = path.normalize(path.join(publicDir, rel));
    if (file.startsWith(publicDir) && fs.existsSync(file) && fs.statSync(file).isFile()) {
      return fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404); return res.end('Não encontrado'); }
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
        res.end(data);
      });
    }
  }

  // Fallback para arquivos estáticos embutidos no executável
  const embedded = embeddedAssets[rel];
  if (embedded) {
    const buf = Buffer.isBuffer(embedded.data)
      ? embedded.data
      : Buffer.from(embedded.data, 'base64');
    res.writeHead(200, { 'Content-Type': embedded.type || TYPES[path.extname(rel)] || 'application/octet-stream' });
    return res.end(buf);
  }

  res.writeHead(404);
  res.end('Não encontrado');
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
    case 'setChannelLevel': {
      if (!who) return;
      const r = await mix.setChannelLevel(who.aux, Number(msg.channel), Number(msg.step));
      const chName = (config.channelNames && config.channelNames[msg.channel]) || `canal ${msg.channel}`;
      if (r.ok) log.add({ person: who.person, action: 'nível de canal', target: chName, value: r.step, aux: who.aux });
      return hub.send(ws, { type: 'state', ...mix.snapshot(who.aux), who });
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
  console.log('==================================================');
  console.log('  Can Hear Myself - Servidor Local');
  console.log('==================================================');
  console.log(`Mesa configurada: ${config.mixer.model} (${config.mixer.ip || 'local'})`);
  console.log(`Porta: ${config.port}`);
  console.log('\nEndereços para acesso na rede local:');
  const urls = localUrls();
  if (urls.length === 0) {
    console.log(`  Local: http://localhost:${config.port}`);
  } else {
    for (const u of urls) {
      console.log(`  Celulares: ${u}`);
      console.log(`  Técnico:   ${u}/tecnico.html`);
    }
  }
  console.log('==================================================\n');
  openDashboard();
  try {
    await driver.connect();
  } catch (e) {
    console.error(`Falha ao conectar na mesa: ${e.message}`);
  }
});

function openDashboard() {
  if (process.argv.includes('--no-open') || process.env.CHM_NO_OPEN) return;
  const url = `http://localhost:${config.port}/tecnico.html`;
  const { exec } = require('child_process');
  const cmd = process.platform === 'win32' ? `start "" "${url}"`
    : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
  exec(cmd, (err) => {
    if (err) console.log(`Abra o painel do técnico no navegador: ${url}`);
    else console.log(`Painel do técnico aberto: ${url}`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`A porta ${config.port} já está em uso. O servidor provavelmente já está aberto.`);
    openDashboard();
    setTimeout(() => process.exit(1), 3000);
  } else {
    console.error(err);
  }
});

module.exports = { server };
