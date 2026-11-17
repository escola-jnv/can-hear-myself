const { EventEmitter } = require('events');

/** Contrato que todo driver de mesa implementa. Valores em dB; null = -infinito. */
class MixerDriver extends EventEmitter {
  constructor(options = {}) { super(); this.options = options; this.connected = false; }
  async connect() {}
  async disconnect() {}
  async setAuxSend(aux, channel, db) {}
  async setAuxMaster(aux, db) {}
  async muteAuxSend(aux, channel, muted) {}
  async setTempo(bpm) {}
  setStatus(connected) { this.connected = connected; this.emit('status', { connected }); }
}

module.exports = { MixerDriver };
