const test = require('node:test');
const assert = require('node:assert');

test('config carrega example e permite canais por grupo', () => {
  const config = require('../../config/example.config.json');
  assert(Array.isArray(config.groups), 'deve ter array de groups');
  assert(config.fixed && config.fixed.click, 'deve ter config fixed de click');
  assert(config.channelNames && typeof config.channelNames === 'object', 'deve ter channelNames');
  assert.strictEqual(config.channelNames['1'], 'BAIXO');
  assert.strictEqual(config.channelNames['13'], 'KICK');
  assert.strictEqual(config.channelNames['21'], 'CLICK');
  assert.strictEqual(config.channelNames['7'], 'TALKBACK');
  assert(Array.isArray(config.auxes), 'deve ter array de auxes');
  assert.strictEqual(config.auxes.length, 7);
  assert.strictEqual(config.auxes[0].name, 'DRUM');
  assert.strictEqual(config.auxes[1].name, 'BASS');
  assert.strictEqual(config.auxes[2].name, 'GUITARRA');
  assert.strictEqual(config.auxes[3].name, 'VIOLAO');
  assert.strictEqual(config.auxes[4].name, 'VOZ 1');
  assert.strictEqual(config.auxes[5].name, 'VOZ 2');
  assert.strictEqual(config.auxes[6].name, 'KEYS');
});
