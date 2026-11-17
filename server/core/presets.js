/** Presets: chave pessoa + instrumento + aux. */
const key = ({ person, instrument, aux }) =>
  [person, instrument, aux].map((v) => String(v).toLowerCase().replace(/[^a-z0-9]+/g, '-')).join('__');

class Presets {
  constructor(store) { this.store = store; }
  save(who, name, snapshot) {
    const all = this.store.read(`presets/${key(who)}.json`, {});
    all[name || 'padrao'] = { ...snapshot, savedAt: new Date().toISOString() };
    this.store.write(`presets/${key(who)}.json`, all);
  }
  load(who, name) {
    const all = this.store.read(`presets/${key(who)}.json`, {});
    return all[name || 'padrao'] || null;
  }
  list(who) { return Object.keys(this.store.read(`presets/${key(who)}.json`, {})); }
}

module.exports = { Presets, presetKey: key };
