const test = require('node:test');
const assert = require('node:assert');
const Mix = require('../../server/core/mix');
const MockDriver = require('../../server/drivers/mock');
const config = require('../../config/example.config.json');

test('grupo move todos os canais para o dB do nível', async () => {
  const d = new MockDriver({ quiet: true }); const mix = new Mix(config, d);
  await mix.setGroupLevel(3, 'bateria', 2);
  for (const ch of [13, 14, 15, 16, 17, 18, 19, 20]) assert.strictEqual(d.sends[`3:${ch}`], -25.6);
});

test('ajuste fino mantém o balanço relativo', async () => {
  const d = new MockDriver({ quiet: true }); const mix = new Mix(config, d);
  await mix.nudgeChannel(3, 13, 3);    // kick (ch 13) +3 dB
  await mix.setGroupLevel(3, 'bateria', 1); // grupo em -30
  assert.strictEqual(d.sends['3:13'], -27);
  assert.strictEqual(d.sends['3:14'], -30);
});

test('nível 0 muta o envio', async () => {
  const d = new MockDriver({ quiet: true }); const mix = new Mix(config, d);
  await mix.setGroupLevel(3, 'baixo', 0);
  assert.strictEqual(d.sends['3:1'], null); // baixo está no ch 1
});

test('modo stop não deixa passar do máximo', async () => {
  const d = new MockDriver({ quiet: true }); const mix = new Mix(config, d);
  await mix.nudgeChannel(3, 13, 3);
  const r = await mix.setGroupLevel(3, 'bateria', 10); // 10 dB + 3 > máximo
  assert.strictEqual(r.ok, false);
});

test('ajusta nível individual de canal de forma independente', async () => {
  const d = new MockDriver({ quiet: true }); const mix = new Mix(config, d);
  await mix.setGroupLevel(3, 'bateria', 2);
  assert.strictEqual(d.sends['3:14'], -25.6); // Caixa (ch 14) em -25.6
  await mix.setChannelLevel(3, 14, 10);      // Caixa para nível 10 (+10 dB)
  assert.strictEqual(d.sends['3:14'], 10);
  assert.strictEqual(d.sends['3:13'], -25.6); // Bumbo (ch 13) continua em -25.6
  assert.strictEqual(mix.auxState(3).channels[14], 10);
});

test('ao mudar o master do grupo, NÃO influencia o volume de cada peça', async () => {
  const d = new MockDriver({ quiet: true }); const mix = new Mix(config, d);
  // Peça configurada individualmente
  await mix.setChannelLevel(3, 13, 8); // Kick = 8
  await mix.setChannelLevel(3, 14, 6); // Caixa = 6
  assert.strictEqual(mix.auxState(3).channels[13], 8);
  assert.strictEqual(mix.auxState(3).channels[14], 6);

  // Muda o master do grupo para o nível padrão
  await mix.setGroupLevel(3, 'bateria', 7);

  // Volumes de cada peça continuam inalterados
  assert.strictEqual(mix.auxState(3).channels[13], 8);
  assert.strictEqual(mix.auxState(3).channels[14], 6);
  assert.strictEqual(mix.auxState(3).groups['bateria'], 7);
});

test('ao mudar o volume da peça, NÃO influencia o volume do master', async () => {
  const d = new MockDriver({ quiet: true }); const mix = new Mix(config, d);
  // Master configurado
  await mix.setGroupLevel(3, 'bateria', 7);
  assert.strictEqual(mix.auxState(3).groups['bateria'], 7);

  // Muda o volume de uma peça
  await mix.setChannelLevel(3, 14, 10); // Caixa = 10

  // Master do grupo continua inalterado em 7
  assert.strictEqual(mix.auxState(3).groups['bateria'], 7);
  assert.strictEqual(mix.auxState(3).channels[14], 10);
});
