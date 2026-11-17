const os = require('os');
const net = require('net');
const dgram = require('dgram');

/**
 * Filtra interfaces virtuais que costumam ter redes gigantes (ex: Hyper-V, WSL, Docker).
 */
function isVirtualInterface(name) {
  const n = name.toLowerCase();
  return n.includes('vethernet') || n.includes('wsl') || n.includes('docker') || n.includes('vbox') || n.includes('virtual');
}

/**
 * Obtém os IPs da sub-rede local para varredura e endereços de broadcast.
 */
function getScanTargets() {
  const ifaces = os.networkInterfaces();
  const candidateInterfaces = [];

  for (const [name, list] of Object.entries(ifaces)) {
    for (const info of list || []) {
      if (info.family === 'IPv4' && !info.internal) {
        candidateInterfaces.push({ name, ...info });
      }
    }
  }

  // Se houver interfaces reais (Wi-Fi, Ethernet), ignorar as virtuais
  const realInterfaces = candidateInterfaces.filter((i) => !isVirtualInterface(i.name));
  const activeInterfaces = realInterfaces.length > 0 ? realInterfaces : candidateInterfaces;

  const ipsToScan = new Set();
  const broadcastIps = new Set(['255.255.255.255']);

  // O IP padrão de fábrica do hotspot Wi-Fi da Soundcraft Ui24R é 10.10.1.1
  ipsToScan.add('10.10.1.1');

  for (const iface of activeInterfaces) {
    const parts = iface.address.split('.').map(Number);
    if (parts.length !== 4) continue;

    const prefix = `${parts[0]}.${parts[1]}.${parts[2]}.`;
    broadcastIps.add(`${prefix}255`);

    for (let host = 1; host <= 254; host++) {
      ipsToScan.add(`${prefix}${host}`);
    }
  }

  return {
    ips: Array.from(ipsToScan),
    broadcasts: Array.from(broadcastIps)
  };
}

/**
 * Testa se um IP é uma mesa Soundcraft Ui (porta 80 HTTP).
 */
function probeSoundcraft(ip, timeout = 400) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resolved = false;
    let data = '';

    const done = (res) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      try { socket.destroy(); } catch {}
      resolve(res);
    };

    const timer = setTimeout(() => done(null), timeout + 50);

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      socket.write(`GET / HTTP/1.1\r\nHost: ${ip}\r\nUser-Agent: CanHearMyself\r\nConnection: close\r\n\r\n`);
    });

    socket.on('data', (chunk) => {
      data += chunk.toString('utf8');
      if (data.length > 4096) checkContent();
    });

    socket.on('end', () => checkContent());
    socket.on('timeout', () => done(null));
    socket.on('error', () => done(null));

    function checkContent() {
      const lower = data.toLowerCase();
      if (lower.includes('soundcraft') || lower.includes('ui24') || lower.includes('ui16') || lower.includes('ui12')) {
        let name = 'Soundcraft Ui24R';
        if (lower.includes('ui16')) name = 'Soundcraft Ui16';
        else if (lower.includes('ui12')) name = 'Soundcraft Ui12';
        return done({ model: 'ui24r', name, ip });
      }
      if (data.startsWith('HTTP/') && (lower.includes('harman') || lower.includes('ui-app'))) {
        return done({ model: 'ui24r', name: 'Soundcraft Ui24R', ip });
      }
      done(null);
    }
  });
}

/**
 * Executa probes com limite de concorrência para não saturar a rede.
 */
async function scanSoundcraftList(ips, concurrency = 60) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < ips.length) {
      const currentIp = ips[index++];
      try {
        const found = await probeSoundcraft(currentIp);
        if (found) results.push(found);
      } catch {}
    }
  }

  const workers = [];
  for (let i = 0; i < Math.min(concurrency, ips.length); i++) {
    workers.push(worker());
  }
  await Promise.all(workers);
  return results;
}

/**
 * Varre mesas Behringer / Midas via OSC (/xinfo) em broadcast e unicast nas portas 10023 e 10024.
 */
function scanBehringerOsc(broadcasts, waitMs = 1000) {
  return new Promise((resolve) => {
    const results = [];
    const seenIps = new Set();
    const ports = [10023, 10024];
    const sockets = [];

    const oscMessage = Buffer.from('/xinfo\0\0', 'ascii');

    let closed = false;
    const finish = () => {
      if (closed) return;
      closed = true;
      sockets.forEach((s) => {
        try { s.close(); } catch {}
      });
      resolve(results);
    };

    setTimeout(finish, waitMs);

    ports.forEach((port) => {
      try {
        const client = dgram.createSocket('udp4');
        sockets.push(client);

        client.on('message', (msg, rinfo) => {
          try {
            const str = msg.toString('latin1');
            if (str.startsWith('/xinfo')) {
              const parts = str.split('\0').filter((s) => s.trim().length > 0);
              const args = parts.filter((p) => !p.startsWith('/') && !p.startsWith(','));
              const mixerIp = (args[0] && /^\d+\.\d+\.\d+\.\d+$/.test(args[0])) ? args[0] : rinfo.address;
              const mixerName = args[1] || '';
              const mixerModel = args[2] || (port === 10024 ? 'XR18' : 'X32');
              const mixerVer = args[3] || '';

              const key = `${mixerIp}:${port}`;
              if (!seenIps.has(key)) {
                seenIps.add(key);
                const isXAir = port === 10024 || /XR|XAIR|X18/i.test(mixerModel);
                results.push({
                  model: isXAir ? 'xair' : 'x32',
                  name: `Behringer ${mixerModel}${mixerName ? ' (' + mixerName + ')' : ''}${mixerVer ? ' v' + mixerVer : ''}`,
                  ip: mixerIp
                });
              }
            }
          } catch {}
        });

        client.on('error', () => {});

        client.bind(0, () => {
          try {
            client.setBroadcast(true);
            broadcasts.forEach((bcast) => {
              client.send(oscMessage, 0, oscMessage.length, port, bcast, () => {});
            });
            client.send(oscMessage, 0, oscMessage.length, port, '10.10.1.1', () => {});
          } catch {}
        });
      } catch {}
    });
  });
}

/**
 * Procura a mesa na rede local.
 * - Ui24R: testar HTTP na porta 80 dos IPs da sub-rede e no 10.10.1.1.
 * - X32/X Air: enviar "/xinfo" via OSC em broadcast e escutar respostas.
 */
async function findMixer(options = {}) {
  const targets = getScanTargets();
  const ips = options.ips || targets.ips;
  const broadcasts = options.broadcasts || targets.broadcasts;

  const [oscMixers, httpMixers] = await Promise.all([
    scanBehringerOsc(broadcasts, options.waitMs || 1000),
    scanSoundcraftList(ips, options.concurrency || 60)
  ]);

  const all = [...httpMixers, ...oscMixers];
  const unique = [];
  const seen = new Set();

  for (const m of all) {
    const k = `${m.model}:${m.ip}`;
    if (!seen.has(k)) {
      seen.add(k);
      unique.push(m);
    }
  }

  return {
    mixers: unique,
    scannedCount: ips.length
  };
}

module.exports = { findMixer, getScanTargets };
