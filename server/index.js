const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const config = require('./config');
const { createDriver } = require('./drivers');
const { findMixer } = require('./discovery/find-mixer');
const Store = require('./storage/store');
const Hub = require('./realtime/hub');
const Mix = require('./core/mix');
const Sessions = require('./core/sessions');
const { Presets } = require('./core/presets');
const { Help } = require('./core/help');
const { Setlist } = require('./core/setlist');
const ActivityLog = require('./core/activity-log');
const { APP_VERSION, RELEASE_NAME } = require('./version');
const { openAppWindow, showNativeDialog, setupFileLogging } = require('./app-window');

setupFileLogging();

/** Mantém a janela aberta no Windows para a pessoa conseguir ler o erro quando em console. */
function holdWindowAndExit(code) {
  // Fecha sozinho depois de 60 s, ou antes se a pessoa apertar Enter.
  setTimeout(() => process.exit(code), 60000);
  try {
    if (process.platform === 'win32' && process.stdin.isTTY) {
      console.log('\nPressione Enter para fechar esta janela.');
      process.stdin.resume();
      process.stdin.once('data', () => process.exit(code));
    }
  } catch {}
}

function writeCrashLog(err) {
  try {
    const dir = path.join(path.dirname(process.execPath), 'data', 'logs');
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, 'erros.log'), `[${new Date().toISOString()}] ${err && err.stack || err}\n`);
  } catch {}
}

process.on('uncaughtException', (err) => {
  console.error('\nERRO: o servidor parou.');
  console.error(err && err.message ? err.message : err);
  writeCrashLog(err);
  if (!process.stdin.isTTY && process.platform === 'win32') {
    showNativeDialog('Can Hear Myself - Erro', `O servidor encontrou um erro:\n${err && err.message ? err.message : err}\n\nConsulte data/logs/erros.log para mais detalhes.`, 'error');
    process.exit(1);
  } else {
    holdWindowAndExit(1);
  }
});

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
let driver = createDriver(config.mixer.model, config.mixer);
const mix = new Mix(config, driver);
const sessions = new Sessions();
const presets = new Presets(store);
const help = new Help();
const setlist = new Setlist(store);
let hub;
const log = new ActivityLog(store, (line) => hub && hub.broadcast({ type: 'log', line }, (ws) => ws.role !== 'musician'));

function attachDriverEvents(d) {
  d.on('status', ({ connected }) => {
    if (hub) {
      hub.broadcast({
        type: 'mixer',
        connected,
        model: config.mixer.model,
        ip: config.mixer.ip
      });
    }
  });
}
attachDriverEvents(driver);

function saveAppConfig() {
  try {
    const configDir = fs.existsSync(path.join(process.cwd(), 'config'))
      ? path.join(process.cwd(), 'config')
      : path.join(path.dirname(process.execPath), 'config');
    fs.mkdirSync(configDir, { recursive: true });
    const configFile = path.join(configDir, 'app.config.json');
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf8');
  } catch (err) {
    console.error('Erro ao salvar app.config.json:', err.message);
  }
}

async function setMixer(model, ip) {
  if (driver) {
    try { await driver.disconnect(); } catch {}
  }
  config.mixer.model = model;
  if (ip !== undefined && ip !== null) config.mixer.ip = ip;
  saveAppConfig();

  driver = createDriver(config.mixer.model, config.mixer);
  mix.driver = driver;
  attachDriverEvents(driver);

  try {
    await driver.connect();
  } catch (err) {
    console.error(`Falha ao conectar na mesa (${model} @ ${config.mixer.ip}): ${err.message}`);
  }

  if (hub) {
    hub.broadcast({
      type: 'mixer',
      connected: driver.connected,
      model: config.mixer.model,
      ip: config.mixer.ip
    });
  }

  log.add({ person: 'técnico', action: 'alterou mesa', target: `${config.mixer.model} (${config.mixer.ip || 'local'})` });

  return {
    model: config.mixer.model,
    ip: config.mixer.ip,
    connected: driver.connected
  };
}

function isLocalRequest(req) {
  const ip = (req.socket && req.socket.remoteAddress) || '';
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
}

function parseDeviceFromUA(ua) {
  if (!ua) return 'Desconhecido';
  if (/Android/i.test(ua)) {
    const m = ua.match(/Android[^;]+;\s*([^;)]+)\s*(?:Build|[;)])/i);
    if (m && m[1] && m[1].trim().toLowerCase() !== 'k' && m[1].trim().length > 2) return m[1].trim();
    return 'Android';
  }
  if (/iPhone/i.test(ua)) {
    const v = ua.match(/OS (\d+[_.]\d+)/);
    return 'iPhone' + (v ? ` (iOS ${v[1].replace('_', '.')})` : '');
  }
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Windows/i.test(ua)) return 'PC Windows';
  if (/Macintosh/i.test(ua)) return 'Mac';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Celular / Web';
}

function buildStatus(req) {
  const urls = localUrls();
  const list = sessions.list();
  return {
    version: APP_VERSION,
    releaseName: RELEASE_NAME,
    mixer: { model: config.mixer.model, ip: config.mixer.ip, connected: driver.connected },
    port: config.port,
    urls,
    musicianUrls: urls.length ? urls : [`http://localhost:${config.port}`],
    techUrls: (urls.length ? urls : [`http://localhost:${config.port}`]).map((u) => `${u}/tecnico.html`),
    connectedCount: list.length,
    sessions: list,
    song: setlist.current,
    songs: setlist.songs(),
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
          if (data.mixer && typeof data.mixer === 'object') {
            if (data.mixer.model) config.mixer.model = data.mixer.model;
            if (data.mixer.ip !== undefined) config.mixer.ip = data.mixer.ip;
          }

          saveAppConfig();

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
      channelNames: config.channelNames || {},
      mixer: config.mixer
    }));
  }

  if (req.url.startsWith('/api/mixer/') && !isLocalRequest(req)) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: false, error: 'A mesa só pode ser trocada no computador do servidor.' }));
  }

  if (req.url === '/api/mixer/scan') {
    findMixer()
      .then((result) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, ...result }));
      })
      .catch((err) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      });
    return;
  }

  if (req.url === '/api/mixer/connect' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const model = (data.model || 'mock').toLowerCase();
        const ip = data.ip !== undefined ? data.ip : (model === 'mock' ? 'local' : '10.10.1.1');
        const mixerStatus = await setMixer(model, ip);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, mixer: mixerStatus }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
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
      hub.send(ws, {
        type: 'mixer',
        connected: driver.connected,
        model: config.mixer.model,
        ip: config.mixer.ip
      });
      if (setlist.current) hub.send(ws, { type: 'song', ...setlist.current });
      hub.send(ws, { type: 'songs', songs: setlist.songs() });
      if (ws.role === 'tech') {
        hub.send(ws, { type: 'sessions', sessions: sessions.list() });
        hub.send(ws, { type: 'helpList', requests: help.open_() });
      }
      return;
    case 'join': {
      const aux = Number(msg.aux);
      const device = msg.device || parseDeviceFromUA(ws.userAgent);
      const r = sessions.join(aux, { clientId: ws.id, person: msg.person, instrument: msg.instrument, device });
      if (!r.ok) return hub.send(ws, { type: 'auxTaken', aux, by: r.takenBy });
      ws.who = { person: msg.person, instrument: msg.instrument, aux, device };
      const saved = presets.load(ws.who);
      if (saved) {
        await mix.apply(aux, saved);
        mix.setAuxPerson(aux, msg.person);
      } else if (!mix.isInitialized(aux) || mix.getAuxPerson(aux) !== msg.person) {
        await mix.initAux(aux);
        mix.setAuxPerson(aux, msg.person);
      }
      log.add({ person: msg.person, action: 'entrou', aux, instrument: msg.instrument });
      hub.broadcast({ type: 'sessions', sessions: sessions.list() }, (c) => c.role !== 'musician');
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
      if (song && song.bpm) await driver.setTempo(song.bpm);
      log.add({ person: who ? who.person : 'técnico', action: 'trocou a música', target: song ? song.name : 'nenhuma' });
      return hub.broadcast({ type: 'song', ...(song || { id: null, name: '—', key: '', bpm: '' }) });
    }
    case 'addSong': {
      const song = setlist.addSong(msg);
      log.add({ person: who ? who.person : 'técnico', action: 'adicionou música', target: song.name });
      return hub.broadcast({ type: 'songs', songs: setlist.songs(), added: song });
    }
    case 'reorderSongs': {
      const songs = setlist.reorderSongs(Number(msg.fromIndex), Number(msg.toIndex));
      return hub.broadcast({ type: 'songs', songs });
    }
    case 'removeSong': {
      const songs = setlist.removeSong(msg.songId);
      log.add({ person: who ? who.person : 'técnico', action: 'removeu música' });
      hub.broadcast({ type: 'songs', songs });
      if (!setlist.current) hub.broadcast({ type: 'song', id: null, name: '—', key: '', bpm: '' });
      return;
    }
    case 'setSongs': {
      const songs = setlist.setSongs(msg.songs);
      return hub.broadcast({ type: 'songs', songs });
    }
    case 'setMixer': {
      if (!ws.isLocal) {
        return hub.send(ws, { type: 'error', message: 'A mesa só pode ser trocada no computador do servidor.' });
      }
      const model = (msg.model || 'mock').toLowerCase();
      const ip = msg.ip !== undefined ? msg.ip : (model === 'mock' ? 'local' : '10.10.1.1');
      await setMixer(model, ip);
      return;
    }
    case 'helpResolve': {
      const req = help.resolve(Number(msg.id));
      if (req) {
        log.add({ person: 'técnico', action: 'resolveu pedido de ajuda', target: req.label, aux: req.aux });
        hub.broadcast({ type: 'helpUpdate', id: req.id, status: req.status }, (c) => (c.who && c.who.aux === req.aux) || c.role !== 'musician');
      }
      return;
    }
    case 'close':
      if (who) log.add({ person: who.person, action: 'saiu', aux: who.aux });
      sessions.leave(ws.id);
      hub.broadcast({ type: 'sessions', sessions: sessions.list() }, (c) => c.role !== 'musician');
      return;
  }
});

function localUrls() {
  const urls = [];
  for (const list of Object.values(os.networkInterfaces())) for (const i of list || [])
    if (i.family === 'IPv4' && !i.internal) urls.push(`http://${i.address}:${config.port}`);
  return urls;
}

const isRunningDirectly = require.main === module
  || (typeof process.isSea === 'function' && process.isSea())
  || (!require.main && !process.argv.some((a) => a.includes('test')));

if (isRunningDirectly) {
  server.listen(config.port, async () => {
    console.log('==================================================');
    console.log(`  Can Hear Myself v${APP_VERSION} — ${RELEASE_NAME}`);
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
}

function openDashboard() {
  if (process.argv.includes('--no-open') || process.argv.includes('--headless') || process.env.CHM_NO_OPEN || process.env.NODE_ENV === 'test' || process.argv.some(a => a.includes('--test'))) return;
  const url = `http://localhost:${config.port}/tecnico.html`;
  openAppWindow(url, {
    width: 1200,
    height: 800,
    onExit: () => {
      if (!process.argv.includes('--keep-alive')) {
        console.log('Janela do aplicativo fechada. Encerrando servidor Can Hear Myself...');
        process.exit(0);
      }
    }
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nA porta ${config.port} já está em uso: o servidor provavelmente já está aberto.`);
    console.error('Abrindo o painel do servidor que já está rodando...');
    openDashboard();
    if (process.platform === 'win32' && process.stdin.isTTY) {
      holdWindowAndExit(1);
    } else {
      process.exit(0);
    }
  } else {
    console.error(err);
    writeCrashLog(err);
    if (!process.stdin.isTTY && process.platform === 'win32') {
      showNativeDialog('Can Hear Myself - Erro', `Falha ao iniciar servidor:\n${err.message}`, 'error');
      process.exit(1);
    } else {
      holdWindowAndExit(1);
    }
  }
});

module.exports = { server, setMixer, saveAppConfig };
