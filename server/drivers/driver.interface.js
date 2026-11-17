const { EventEmitter } = require('events');

/** Contrato que todo driver de mesa implementa. Valores em dB; null = -infinito. */
class MixerDriver extends EventEmitter {
  constructor(options = {}) { super(); this.options = options; this.connected = false; }
  async connect() { throw new Error('connect() não implementado'); }
  async disconnect() {}
  async setAuxSend(aux, channel, db) { throw new Error('setAuxSend() não implementado'); }
  async setAuxMaster(aux, db) { throw new Error('setAuxMaster() não implementado'); }
  async muteAuxSend(aux, channel, muted) { throw new Error('muteAuxSend() não implementado'); }
  async setTempo(bpm) {}
  setStatus(connected) { this.connected = connected; this.emit('status', { connected }); }
}

module.exports = { MixerDriver };
