const test = require('node:test');
const assert = require('node:assert');
const { Help } = require('../../server/core/help');

test('pedido de ajuda vai de aberto → visto → resolvido e sai da lista', () => {
  const h = new Help();
  const r = h.open({ person: 'Gio', instrument: 'Voz', aux: 1 }, 1);
  assert.strictEqual(r.status, 'aberto');
  assert.strictEqual(h.seen(r.id).status, 'visto');
  assert.strictEqual(h.resolve(r.id).status, 'resolvido');
  assert.strictEqual(h.open_().length, 0);
});
