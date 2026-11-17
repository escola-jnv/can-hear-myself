const { MixerDriver } = require('../driver.interface');

/** Mesa virtual: guarda tudo em memória e imprime cada comando no terminal. */
class MockDriver extends MixerDriver {
  constructor(options) { super(options); this.sends = {}; this.masters = {}; this.quiet = options.quiet; }
  log(msg) { if (!this.quiet) console.log(`[mesa virtual] ${msg}`); }
  async connect() { this.setStatus(true); this.log('conectada'); }
  async disconnect() { this.setStatus(false); this.log('desconectada'); }
  async setAuxSend(aux, channel, db) {
    this.sends[`${aux}:${channel}`] = db;
    this.log(`aux ${aux}, canal ${channel}, ${db === null ? 'mute' : db.toFixed(1) + ' dB'}`);
  }
  async setAuxMaster(aux, db) { this.masters[aux] = db; this.log(`aux ${aux}, master ${db === null ? 'mute' : db + ' dB'}`); }
  async muteAuxSend(aux, channel, muted) { this.log(`aux ${aux}, canal ${channel}, ${muted ? 'mute' : 'unmute'}`); }
  async setTempo(bpm) { this.log(`tempo dos efeitos: ${bpm} BPM`); }
  /** Simula queda de conexão (para testar o aviso vermelho). */
  simulateDrop(ms = 5000) { this.setStatus(false); setTimeout(() => this.setStatus(true), ms); }
}

module.exports = MockDriver;
