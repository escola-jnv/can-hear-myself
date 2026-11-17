const test = require('node:test');
const assert = require('node:assert');
const Sessions = require('../../server/core/sessions');

test('não deixa duas pessoas na mesma aux', () => {
  const s = new Sessions();
  assert.ok(s.join(3, { clientId: 1, person: 'Gio' }).ok);
  const r = s.join(3, { clientId: 2, person: 'Ana' });
  assert.strictEqual(r.ok, false); assert.strictEqual(r.takenBy, 'Gio');
});
