const { MixerDriver } = require('../driver.interface');

/**
 * Soundcraft Ui24R via soundcraft-ui-connection.
 */
class Ui24rDriver extends MixerDriver {
  async connect() {
    try {
      const { SoundcraftUI } = require('soundcraft-ui-connection');
      this.conn = new SoundcraftUI(this.options.ip);
      this.conn.status$.subscribe((s) => this.setStatus(String(s.type).toUpperCase() === 'OPEN'));
      await this.conn.connect();
    } catch (err) {
      console.warn(`[ui24r] Falha ao conectar em ${this.options.ip}:`, err.message);
      this.setStatus(false);
    }
  }

  async disconnect() {
    if (this.conn) {
      try {
        await this.conn.disconnect();
      } catch {}
      this.conn = null;
    }
    this.setStatus(false);
  }

  async setAuxSend(aux, channel, db) {
    if (!this.conn) return;
    try {
      const send = this.conn.aux(aux).input(channel);
      if (db === null) return send.mute();
      send.unmute();
      send.setFaderLevelDB(db);
    } catch (err) {
      console.warn(`[ui24r] Falha ao ajustar aux ${aux} canal ${channel}:`, err.message);
    }
  }

  async setAuxMaster(aux, db) {
    if (!this.conn) return;
    try {
      const master = this.conn.master.aux(aux);
      if (db === null) return master.mute();
      master.unmute();
      master.setFaderLevelDB(db);
    } catch (err) {
      console.warn(`[ui24r] Falha ao ajustar master aux ${aux}:`, err.message);
    }
  }

  async muteAuxSend(aux, channel, muted) {
    if (!this.conn) return;
    try {
      const send = this.conn.aux(aux).input(channel);
      muted ? send.mute() : send.unmute();
    } catch (err) {
      console.warn(`[ui24r] Falha ao mutar aux ${aux} canal ${channel}:`, err.message);
    }
  }
}

module.exports = Ui24rDriver;
