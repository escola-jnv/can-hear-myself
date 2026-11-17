const fs = require('fs');
const path = require('path');

function getDefaultStoreDir() {
  if (process.env.CHM_DATA_DIR) return process.env.CHM_DATA_DIR;
  const candidates = [
    path.join(process.cwd(), 'data'),
    path.join(path.dirname(process.execPath), 'data'),
  ];
  for (const c of candidates) {
    try { if (fs.existsSync(c)) return c; } catch {}
  }
  try {
    const devData = path.join(__dirname, '..', '..', 'data');
    if (fs.existsSync(devData)) return devData;
  } catch {}
  return path.join(process.cwd(), 'data');
}

/** Leitura e escrita de JSON em data/. Escrita atômica para não corromper arquivos. */
class Store {
  constructor(root = getDefaultStoreDir()) { this.root = root; }
  full(rel) { const p = path.join(this.root, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); return p; }
  read(rel, fallback) {
    try { return JSON.parse(fs.readFileSync(this.full(rel), 'utf8')); } catch { return fallback; }
  }
  write(rel, data) {
    const p = this.full(rel); const tmp = `${p}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2)); fs.renameSync(tmp, p);
  }
  append(rel, line) { fs.appendFileSync(this.full(rel), line + '\n'); }
}

module.exports = Store;
