const test = require('node:test');
const assert = require('node:assert');
const Mix = require('../../server/core/mix');
const MockDriver = require('../../server/drivers/mock');
const config = require('../../config/example.config.json');

test('sem preset, master, clique e talkback começam no nível 7', () => {
  const mix = new Mix(config, new MockDriver({ quiet: true }));
  assert.deepStrictEqual(mix.snapshot(1).fixed, { master: 7, click: 7, talkback: 7 });
});
