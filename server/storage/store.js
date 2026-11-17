const fs = require('fs');
const path = require('path');

/** Leitura e escrita de JSON em data/. Escrita atômica para não corromper arquivos. */
class Store {
  constructor(root = path.join(__dirname, '..', '..', 'data')) { this.root = root; }
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
