const test = require('node:test');
const assert = require('node:assert');
const Mix = require('../../server/core/mix');
const MockDriver = require('../../server/drivers/mock');
const config = require('../../config/example.config.json');

test('grupo move todos os canais para o dB do nível', async () => {
  const d = new MockDriver({ quiet: true }); const mix = new Mix(config, d);
  await mix.setGroupLevel(3, 'bateria', 2);
  for (const ch of [1, 2, 3, 4]) assert.strictEqual(d.sends[`3:${ch}`], -10);
});

test('ajuste fino mantém o balanço relativo', async () => {
  const d = new MockDriver({ quiet: true }); const mix = new Mix(config, d);
  await mix.nudgeChannel(3, 1, 3);    // kick +3 dB
  await mix.setGroupLevel(3, 'bateria', 1); // grupo em -20
  assert.strictEqual(d.sends['3:1'], -17);
  assert.strictEqual(d.sends['3:2'], -20);
});

test('nível 0 muta o envio', async () => {
  const d = new MockDriver({ quiet: true }); const mix = new Mix(config, d);
  await mix.setGroupLevel(3, 'baixo', 0);
  assert.strictEqual(d.sends['3:5'], null);
});

test('modo stop não deixa passar do máximo', async () => {
  const d = new MockDriver({ quiet: true }); const mix = new Mix(config, d);
  await mix.nudgeChannel(3, 1, 3);
  const r = await mix.setGroupLevel(3, 'bateria', 4); // 0 dB + 3 > máximo
  assert.strictEqual(r.ok, false);
});
