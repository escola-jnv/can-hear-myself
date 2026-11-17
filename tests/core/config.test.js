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
});
