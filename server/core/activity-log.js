/** Log de atividade: quem mudou o quê e quando. Um arquivo por dia. */
class ActivityLog {
  constructor(store, onEntry = () => {}) { this.store = store; this.onEntry = onEntry; this.recent = []; }
  add(entry) {
    const line = { at: new Date().toISOString(), ...entry };
    this.recent.push(line);
    if (this.recent.length > 200) this.recent.shift();
    const day = line.at.slice(0, 10);
    this.store.append(`logs/${day}.jsonl`, JSON.stringify(line));
    this.onEntry(line);
    return line;
  }
}

module.exports = ActivityLog;
