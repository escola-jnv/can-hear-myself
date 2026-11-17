const { MixerDriver } = require('../driver.interface');

/** Behringer/Midas via OSC (porta 10023 no X32/M32, 10024 no X Air). A implementar. */
class Driver extends MixerDriver {
  async connect() { throw new Error('Driver x32 ainda não implementado'); }
}

module.exports = Driver;
