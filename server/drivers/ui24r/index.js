const { MixerDriver } = require('../driver.interface');

/**
 * Soundcraft Ui24R via soundcraft-ui-connection.
 * Conferir na documentação da biblioteca os nomes exatos da API antes de usar em produção.
 */
class Ui24rDriver extends MixerDriver {
  async connect() {
    const { SoundcraftUI } = require('soundcraft-ui-connection');
    this.conn = new SoundcraftUI(this.options.ip);
    this.conn.status$.subscribe((s) => this.setStatus(String(s.type).toUpperCase() === 'OPEN'));
    await this.conn.connect();
  }
  async disconnect() { if (this.conn) await this.conn.disconnect(); }
  async setAuxSend(aux, channel, db) {
    const send = this.conn.aux(aux).input(channel);
    if (db === null) return send.mute();
    send.unmute(); send.setFaderLevelDB(db);
  }
  async setAuxMaster(aux, db) {
    const master = this.conn.aux(aux);
    if (db === null) return master.mute();
    master.unmute(); master.setFaderLevelDB(db);
  }
  async muteAuxSend(aux, channel, muted) {
    const send = this.conn.aux(aux).input(channel);
    muted ? send.mute() : send.unmute();
  }
}

module.exports = Ui24rDriver;
