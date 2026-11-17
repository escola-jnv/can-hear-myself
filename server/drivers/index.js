const drivers = {
  mock: () => require('./mock'),
  ui24r: () => require('./ui24r'),
  x32: () => require('./x32'),
  xair: () => require('./xair'),
};

function createDriver(model, options) {
  const load = drivers[model];
  if (!load) throw new Error(`Mesa desconhecida: ${model}`);
  const Driver = load();
  return new Driver(options);
}

module.exports = { createDriver, models: Object.keys(drivers) };
