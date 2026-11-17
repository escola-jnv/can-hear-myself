/** Quem está conectado e em qual aux. Uma pessoa por aux. */
class Sessions {
  constructor() {
    this.byAux = new Map();
  }

  join(aux, info) {
    const current = this.byAux.get(aux);
    if (current && current.clientId !== info.clientId) {
      return { ok: false, takenBy: current.person };
    }
    this.byAux.set(aux, info);
    return { ok: true };
  }

  leave(clientId) {
    for (const [aux, s] of this.byAux) {
      if (s.clientId === clientId) this.byAux.delete(aux);
    }
  }

  list() {
    return [...this.byAux.entries()].map(([aux, s]) => ({
      aux,
      person: s.person,
      instrument: s.instrument,
      device: s.device || 'Desconhecido'
    }));
  }

  count() {
    return this.byAux.size;
  }
}

module.exports = Sessions;
