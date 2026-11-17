/**
 * Regras de mix: níveis, grupos virtuais com movimento relativo em dB.
 * Não conhece a mesa: recebe um driver pelo contrato.
 */
class Mix {
  constructor(config, driver) {
    this.config = config;
    this.driver = driver;
    this.state = {}; // aux -> { groups: {id: step}, fixed: {}, offsets: {channel: db} }
  }

  auxState(aux) {
    if (!this.state[aux]) this.state[aux] = { groups: {}, fixed: { master: 3, click: 2, talkback: 2 }, channels: {}, offsets: {} };
    if (!this.state[aux].channels) this.state[aux].channels = {};
    return this.state[aux];
  }

  stepToDb(step) {
    const level = this.config.levels.find((l) => l.step === step);
    if (!level) throw new Error(`Nível inválido: ${step}`);
    return level.db;
  }

  /** dB final de um canal = nível do grupo + ajuste fino do canal, limitado ao máximo. */
  channelDb(groupDb, offset = 0) {
    if (groupDb === null) return null;
    return groupDb + offset;
  }

  async setGroupLevel(aux, groupId, step) {
    const group = this.config.groups.find((g) => g.id === groupId);
    if (!group) throw new Error(`Grupo desconhecido: ${groupId}`);
    const groupDb = this.stepToDb(step);
    const st = this.auxState(aux);
    const max = this.config.maxDb;

    const targets = group.channels.map((ch) => ({ ch, db: this.channelDb(groupDb, st.offsets[ch]) }));
    const over = targets.some((t) => t.db !== null && t.db > max);
    if (over && this.config.groupLimitBehavior === 'stop') {
      return { ok: false, reason: 'limite', group: groupId };
    }

    // Regra 1: Mudar o master do grupo NÃO altera o volume de cada peça (st.channels)
    st.groups[groupId] = step;
    for (const t of targets) {
      const db = t.db === null ? null : Math.min(t.db, max);
      await this.driver.setAuxSend(aux, t.ch, db);
    }
    return { ok: true, group: groupId, step };
  }

  async setChannelLevel(aux, channel, step) {
    const chDb = this.stepToDb(step);
    const st = this.auxState(aux);
    if (!st.channels) st.channels = {};
    st.channels[channel] = step;
    await this.driver.setAuxSend(aux, channel, chDb === null ? null : Math.min(chDb, this.config.maxDb));
    return { ok: true, channel, step };
  }

  /** Ajuste fino: move só um canal, em passos de dB, dentro do grupo. */
  async nudgeChannel(aux, channel, deltaDb) {
    const group = this.config.groups.find((g) => g.channels.includes(channel));
    if (!group) throw new Error(`Canal ${channel} não pertence a nenhum grupo`);
    const st = this.auxState(aux);
    st.offsets[channel] = (st.offsets[channel] || 0) + deltaDb;
    const step = st.groups[group.id] ?? 2;
    const db = this.channelDb(this.stepToDb(step), st.offsets[channel]);
    await this.driver.setAuxSend(aux, channel, db === null ? null : Math.min(db, this.config.maxDb));
    return { ok: true, channel, offset: st.offsets[channel] };
  }

  async setFixedLevel(aux, target, step) {
    const db = this.stepToDb(step);
    const st = this.auxState(aux);
    st.fixed[target] = step;
    if (target === 'master') return this.driver.setAuxMaster(aux, db);
    const fixed = this.config.fixed[target];
    if (!fixed) throw new Error(`Controle fixo desconhecido: ${target}`);
    for (const ch of fixed.channels) await this.driver.setAuxSend(aux, ch, db);
  }

  snapshot(aux) { return JSON.parse(JSON.stringify(this.auxState(aux))); }

  async apply(aux, snap) {
    this.state[aux] = { groups: {}, fixed: {}, channels: { ...(snap.channels || {}) }, offsets: { ...(snap.offsets || {}) } };
    for (const [g, s] of Object.entries(snap.groups || {})) await this.setGroupLevel(aux, g, s);
    for (const [ch, s] of Object.entries(snap.channels || {})) await this.setChannelLevel(aux, Number(ch), s);
    for (const [t, s] of Object.entries(snap.fixed || {})) await this.setFixedLevel(aux, t, s);
  }
}

module.exports = Mix;
