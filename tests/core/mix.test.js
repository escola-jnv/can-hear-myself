const test = require('node:test');
const assert = require('node:assert');
const Mix = require('../../server/core/mix');
const MockDriver = require('../../server/drivers/mock');
const config = require('../../config/example.config.json');

test('grupo move todos os canais para o dB do nível', async () => {
  const d = new MockDriver({ quiet: true }); const mix = new Mix(config, d);
  await mix.setGroupLevel(3, 'bateria', 2);
  for (const ch of [13, 14, 15, 16, 17, 18, 19, 20]) assert.strictEqual(d.sends[`3:${ch}`], -10);
});

test('ajuste fino mantém o balanço relativo', async () => {
  const d = new MockDriver({ quiet: true }); const mix = new Mix(config, d);
  await mix.nudgeChannel(3, 13, 3);    // kick (ch 13) +3 dB
  await mix.setGroupLevel(3, 'bateria', 1); // grupo em -20
  assert.strictEqual(d.sends['3:13'], -17);
  assert.strictEqual(d.sends['3:14'], -20);
});

test('nível 0 muta o envio', async () => {
  const d = new MockDriver({ quiet: true }); const mix = new Mix(config, d);
  await mix.setGroupLevel(3, 'baixo', 0);
  assert.strictEqual(d.sends['3:1'], null); // baixo está no ch 1
});

test('modo stop não deixa passar do máximo', async () => {
  const d = new MockDriver({ quiet: true }); const mix = new Mix(config, d);
  await mix.nudgeChannel(3, 13, 3);
  const r = await mix.setGroupLevel(3, 'bateria', 4); // 0 dB + 3 > máximo
  assert.strictEqual(r.ok, false);
});

test('ajusta nível individual de canal de forma independente', async () => {
  const d = new MockDriver({ quiet: true }); const mix = new Mix(config, d);
  await mix.setGroupLevel(3, 'bateria', 2);
  assert.strictEqual(d.sends['3:14'], -10); // Caixa (ch 14) em -10
  await mix.setChannelLevel(3, 14, 4);      // Caixa para nível 4 (0 dB)
  assert.strictEqual(d.sends['3:14'], 0);
  assert.strictEqual(d.sends['3:13'], -10); // Bumbo (ch 13) continua em -10
  assert.strictEqual(mix.auxState(3).channels[14], 4);
});

test('ao mudar o master do grupo, NÃO influencia o volume de cada peça', async () => {
  const d = new MockDriver({ quiet: true }); const mix = new Mix(config, d);
  // Peça configurada individualmente
  await mix.setChannelLevel(3, 13, 4); // Kick = 4
  await mix.setChannelLevel(3, 14, 1); // Caixa = 1
  assert.strictEqual(mix.auxState(3).channels[13], 4);
  assert.strictEqual(mix.auxState(3).channels[14], 1);

  // Muda o master do grupo
  await mix.setGroupLevel(3, 'bateria', 3);

  // Volumes de cada peça continuam inalterados
  assert.strictEqual(mix.auxState(3).channels[13], 4);
  assert.strictEqual(mix.auxState(3).channels[14], 1);
  assert.strictEqual(mix.auxState(3).groups['bateria'], 3);
});

test('ao mudar o volume da peça, NÃO influencia o volume do master', async () => {
  const d = new MockDriver({ quiet: true }); const mix = new Mix(config, d);
  // Master configurado
  await mix.setGroupLevel(3, 'bateria', 2);
  assert.strictEqual(mix.auxState(3).groups['bateria'], 2);

  // Muda o volume de uma peça
  await mix.setChannelLevel(3, 14, 4); // Caixa = 4

  // Master do grupo continua inalterado em 2
  assert.strictEqual(mix.auxState(3).groups['bateria'], 2);
  assert.strictEqual(mix.auxState(3).channels[14], 4);
});
