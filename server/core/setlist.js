/** Repertório e música atual. Qualquer músico pode trocar. */
const normalizeBpm = (bpm) => {
  let b = Number(bpm);
  if (!b || b <= 0) return null;
  while (b < 100) b *= 2; // regra: BPM sempre acima de 100
  return Math.round(b);
};

class Setlist {
  constructor(store) { this.store = store; this.current = null; }
  songs() { return this.store.read('songs.json', []); }
  addSong({ name, key, bpm }) {
    const songs = this.songs();
    const song = { id: `s${Date.now()}`, name, key, bpm: normalizeBpm(bpm) };
    songs.push(song);
    this.store.write('songs.json', songs);
    return song;
  }
  setCurrent(songId) {
    const song = this.songs().find((s) => s.id === songId);
    if (!song) throw new Error('Música não encontrada');
    this.current = song;
    return song;
  }
}

module.exports = { Setlist, normalizeBpm };
