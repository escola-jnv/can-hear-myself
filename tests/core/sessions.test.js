const test = require('node:test');
const assert = require('node:assert');
const Sessions = require('../../server/core/sessions');

test('não deixa duas pessoas na mesma aux', () => {
  const s = new Sessions();
  assert.ok(s.join(3, { clientId: 1, person: 'Gio', instrument: 'Voz', device: 'iPhone 14' }).ok);
  const r = s.join(3, { clientId: 2, person: 'Ana', instrument: 'Teclado', device: 'Android' });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.takenBy, 'Gio');

  const list = s.list();
  assert.strictEqual(list.length, 1);
  assert.strictEqual(list[0].person, 'Gio');
  assert.strictEqual(list[0].device, 'iPhone 14');
});
