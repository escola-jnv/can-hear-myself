const test = require('node:test');
const assert = require('node:assert');
const { Setlist, normalizeBpm } = require('../../server/core/setlist');

class MemoryStore {
  constructor() { this.data = {}; }
  read(f, def) { return this.data[f] || def; }
  write(f, val) { this.data[f] = val; }
}

test('BPM abaixo de 100 é dobrado', () => {
  assert.strictEqual(normalizeBpm(50), 100);
  assert.strictEqual(normalizeBpm(69), 138);
  assert.strictEqual(normalizeBpm(120), 120);
});

test('Setlist adiciona, reordena e remove músicas', () => {
  const store = new MemoryStore();
  const setlist = new Setlist(store);

  const s1 = setlist.addSong({ name: 'Música 1', key: 'G', bpm: 120 });
  const s2 = setlist.addSong({ name: 'Música 2', key: 'D', bpm: 130 });
  const s3 = setlist.addSong({ name: 'Música 3', key: 'Em', bpm: 70 }); // 70 dobrado para 140

  assert.strictEqual(setlist.songs().length, 3);
  assert.strictEqual(setlist.songs()[2].bpm, 140);

  // Reordenar: mover Música 3 (index 2) para o topo (index 0)
  setlist.reorderSongs(2, 0);
  assert.strictEqual(setlist.songs()[0].name, 'Música 3');
  assert.strictEqual(setlist.songs()[1].name, 'Música 1');
  assert.strictEqual(setlist.songs()[2].name, 'Música 2');

  // Set current song
  setlist.setCurrent(s2.id);
  assert.strictEqual(setlist.current.name, 'Música 2');

  // Remover Música 2
  setlist.removeSong(s2.id);
  assert.strictEqual(setlist.songs().length, 2);
  assert.strictEqual(setlist.current, null); // limpa se a música atual foi removida
});
