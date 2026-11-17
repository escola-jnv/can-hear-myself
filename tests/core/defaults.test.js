const test = require('node:test');
const assert = require('node:assert');
const Mix = require('../../server/core/mix');
const MockDriver = require('../../server/drivers/mock');
const config = require('../../config/example.config.json');

test('sem preset, master, clique e talkback começam no nível 3', () => {
  const mix = new Mix(config, new MockDriver({ quiet: true }));
  assert.deepStrictEqual(mix.snapshot(1).fixed, { master: 3, click: 3, talkback: 3 });
});
