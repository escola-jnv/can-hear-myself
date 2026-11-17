/** Repertório e música atual. Qualquer músico pode trocar. */
const normalizeBpm = (bpm) => {
  let b = Number(bpm);
  if (!b || b <= 0) return null;
  while (b < 100) b *= 2; // regra: BPM sempre acima de 100
  return Math.round(b);
};

class Setlist {
  constructor(store) {
    this.store = store;
    this.current = null;
  }

  songs() {
    return this.store.read('songs.json', []);
  }

  addSong({ name, key, bpm }) {
    const songs = this.songs();
    const song = {
      id: `s${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: name ? String(name).trim() : 'Sem título',
      key: key ? String(key).trim() : '',
      bpm: normalizeBpm(bpm)
    };
    songs.push(song);
    this.store.write('songs.json', songs);
    return song;
  }

  setCurrent(songId) {
    if (!songId) {
      this.current = null;
      return null;
    }
    const song = this.songs().find((s) => s.id === songId);
    if (!song) {
      this.current = null;
      return null;
    }
    this.current = song;
    return song;
  }

  setSongs(songs) {
    this.store.write('songs.json', Array.isArray(songs) ? songs : []);
    return this.songs();
  }

  removeSong(songId) {
    let songs = this.songs();
    songs = songs.filter((s) => s.id !== songId);
    this.store.write('songs.json', songs);
    if (this.current && this.current.id === songId) {
      this.current = null;
    }
    return songs;
  }

  reorderSongs(fromIndex, toIndex) {
    const songs = this.songs();
    if (fromIndex < 0 || fromIndex >= songs.length || toIndex < 0 || toIndex >= songs.length) {
      return songs;
    }
    const [moved] = songs.splice(fromIndex, 1);
    songs.splice(toIndex, 0, moved);
    this.store.write('songs.json', songs);
    return songs;
  }
}

module.exports = { Setlist, normalizeBpm };
