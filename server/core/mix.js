/**
 * Regras de mix: níveis, grupos virtuais com movimento relativo em dB.
 * Não conhece a mesa: recebe um driver pelo contrato.
 */
class Mix {
  constructor(config, driver) {
    this.config = config;
    this.driver = driver;
    this.state = {}; // aux -> { groups: {id: step}, fixed: {}, offsets: {channel: db} }
    this.initialized = new Set();
    this.auxPersons = {};
  }

  getMaxStep() {
    if (this.config.levels && this.config.levels.length > 0) {
      return Math.max(...this.config.levels.map((l) => l.step));
    }
    return 10;
  }

  getDefaultLevel() {
    if (this.config.defaultLevel !== undefined) return this.config.defaultLevel;
    return 7;
  }

  defaultAuxState() {
    const def = this.getDefaultLevel();
    const groups = {};
    const channels = {};
    if (this.config.groups) {
      for (const g of this.config.groups) {
        groups[g.id] = def;
        if (g.channels) {
          for (const ch of g.channels) {
            channels[ch] = def;
          }
        }
      }
    }
    const fixed = { master: def, click: def, talkback: def };
    if (this.config.fixed) {
      for (const k of Object.keys(this.config.fixed)) {
        fixed[k] = def;
      }
    }
    return { groups, fixed, channels, offsets: {} };
  }

  auxState(aux) {
    if (!this.state[aux]) {
      this.state[aux] = this.defaultAuxState();
    }
    if (!this.state[aux].channels) this.state[aux].channels = {};
    if (!this.state[aux].groups) this.state[aux].groups = {};
    if (!this.state[aux].fixed) this.state[aux].fixed = {};
    return this.state[aux];
  }

  isInitialized(aux) {
    return this.initialized.has(aux);
  }

  async initAux(aux) {
    await this.apply(aux, this.defaultAuxState());
    this.initialized.add(aux);
  }

  getAuxPerson(aux) {
    return this.auxPersons[aux] || null;
  }

  setAuxPerson(aux, person) {
    this.auxPersons[aux] = person;
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
    const st = this.auxState(aux);
    if (!st.channels) st.channels = {};
    const max = this.config.maxDb;

    const channels = group.channels || [];
    const N = channels.length;

    if (N === 0) {
      st.groups[groupId] = step;
      return { ok: true, group: groupId, step };
    }

    const maxStep = this.getMaxStep();
    const def = this.getDefaultLevel();

    // Nível atual de cada peça e soma total
    let currentSum = 0;
    const currentLevels = {};
    for (const ch of channels) {
      const cur = st.channels[ch] !== undefined ? st.channels[ch] : (st.groups[groupId] ?? def);
      currentLevels[ch] = cur;
      currentSum += cur;
    }

    // Se nível 0 (mudo geral da bateria/grupo)
    if (step === 0) {
      if (currentSum > 0) {
        st.savedRatios = st.savedRatios || {};
        st.savedRatios[groupId] = {};
        for (const ch of channels) {
          st.savedRatios[groupId][ch] = currentLevels[ch] / currentSum;
        }
      }
      st.groups[groupId] = 0;
      for (const ch of channels) {
        st.channels[ch] = 0;
        await this.driver.setAuxSend(aux, ch, null);
      }
      return { ok: true, group: groupId, step: 0 };
    }

    // Calcula os novos níveis de cada peça baseados na proporção sobre a soma total
    const targetSum = step * N;
    const newLevels = {};
    const targets = [];

    if (currentSum === 0) {
      const ratios = (st.savedRatios && st.savedRatios[groupId]) || null;
      for (const ch of channels) {
        let newLvl = step;
        if (ratios && ratios[ch] !== undefined) {
          const minVal = ratios[ch] > 0 ? 1 : 0;
          newLvl = Math.max(minVal, Math.min(maxStep, Math.round(ratios[ch] * targetSum)));
        }
        newLevels[ch] = newLvl;
        const chDb = this.stepToDb(newLvl);
        const finalDb = this.channelDb(chDb, st.offsets[ch]);
        targets.push({ ch, db: finalDb });
      }
    } else {
      for (const ch of channels) {
        let newLvl = 0;
        if (currentLevels[ch] > 0) {
          const ratio = currentLevels[ch] / currentSum;
          newLvl = Math.max(1, Math.min(maxStep, Math.round(ratio * targetSum)));
        }
        newLevels[ch] = newLvl;
        const chDb = this.stepToDb(newLvl);
        const finalDb = this.channelDb(chDb, st.offsets[ch]);
        targets.push({ ch, db: finalDb });
      }
    }

    const over = targets.some((t) => t.db !== null && t.db > max);
    if (over && this.config.groupLimitBehavior === 'stop') {
      return { ok: false, reason: 'limite', group: groupId };
    }

    st.groups[groupId] = step;
    for (const t of targets) {
      st.channels[t.ch] = newLevels[t.ch];
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

    // Recalcular o nível geral do grupo baseado na soma/média das peças
    const group = this.config.groups.find((g) => g.channels.includes(channel));
    if (group && group.channels && group.channels.length > 0) {
      let sum = 0;
      const def = this.getDefaultLevel();
      for (const ch of group.channels) {
        const s = st.channels[ch] !== undefined ? st.channels[ch] : (st.groups[group.id] ?? def);
        sum += s;
      }
      const avg = sum / group.channels.length;
      st.groups[group.id] = Math.max(0, Math.min(this.getMaxStep(), Math.round(avg)));
    }

    const finalDb = chDb === null ? null : Math.min(this.channelDb(chDb, st.offsets[channel]), this.config.maxDb);
    await this.driver.setAuxSend(aux, channel, finalDb);
    return { ok: true, channel, step };
  }

  /** Ajuste fino: move só um canal, em passos de dB, dentro do grupo. */
  async nudgeChannel(aux, channel, deltaDb) {
    const group = this.config.groups.find((g) => g.channels.includes(channel));
    if (!group) throw new Error(`Canal ${channel} não pertence a nenhum grupo`);
    const st = this.auxState(aux);
    st.offsets[channel] = (st.offsets[channel] || 0) + deltaDb;
    const step = st.groups[group.id] ?? this.getDefaultLevel();
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
    this.initialized.add(aux);
  }
}

module.exports = Mix;
