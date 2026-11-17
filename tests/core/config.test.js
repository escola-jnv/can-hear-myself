const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');

test('config carrega example e permite canais por grupo', () => {
  const config = require('../../config/example.config.json');
  assert(Array.isArray(config.groups), 'deve ter array de groups');
  assert(config.fixed && config.fixed.click, 'deve ter config fixed de click');
  assert(config.channelNames && typeof config.channelNames === 'object', 'deve ter channelNames');
  assert.strictEqual(config.channelNames['1'], 'Bumbo');
});
