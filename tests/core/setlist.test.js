const test = require('node:test');
const assert = require('node:assert');
const { normalizeBpm } = require('../../server/core/setlist');

test('BPM abaixo de 100 é dobrado', () => {
  assert.strictEqual(normalizeBpm(50), 100);
  assert.strictEqual(normalizeBpm(69), 138);
  assert.strictEqual(normalizeBpm(120), 120);
});
