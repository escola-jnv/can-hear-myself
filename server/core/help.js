const REASONS = {
  1: 'Não estou me ouvindo',
  2: 'Problema no fone',
  3: 'Problema no instrumento ou microfone',
  4: 'Música ou clique errado',
  5: 'Outro',
};

class Help {
  constructor() { this.requests = []; this.nextId = 1; }
  open(who, reason) {
    if (!REASONS[reason]) throw new Error(`Motivo inválido: ${reason}`);
    const req = { id: this.nextId++, ...who, reason, label: REASONS[reason], status: 'aberto', at: new Date().toISOString() };
    this.requests.push(req);
    return req;
  }
  seen(id) { const r = this.requests.find((x) => x.id === id); if (r) r.status = 'visto'; return r; }
  resolve(id) { const r = this.requests.find((x) => x.id === id); if (r) r.status = 'resolvido'; return r; }
  open_() { return this.requests.filter((r) => r.status !== 'resolvido'); }
}

module.exports = { Help, REASONS };
