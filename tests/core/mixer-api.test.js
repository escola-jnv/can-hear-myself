const test = require('node:test');
const assert = require('node:assert');
const { setMixer } = require('../../server/index');

test('setMixer altera o modelo e IP da mesa dinamicamente em modo mock', async () => {
  const resultMock = await setMixer('mock', '127.0.0.1');
  assert.strictEqual(resultMock.model, 'mock');
  assert.strictEqual(resultMock.ip, '127.0.0.1');
  assert.strictEqual(resultMock.connected, true);

  const resultMock2 = await setMixer('mock', 'local');
  assert.strictEqual(resultMock2.model, 'mock');
  assert.strictEqual(resultMock2.ip, 'local');
  assert.strictEqual(resultMock2.connected, true);
});
