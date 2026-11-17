const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const { server, setMixer } = require('../../server/index');

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

test('HTTP API /api/mixer/connect e /api/mixer/scan respondem com CORS e JSON', async (t) => {
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  t.after(() => {
    return new Promise((resolve) => server.close(resolve));
  });

  // 1. Testa OPTIONS preflight
  const optRes = await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path: '/api/mixer/connect',
      method: 'OPTIONS',
      headers: { Origin: 'http://example.com' }
    }, resolve);
    req.on('error', reject);
    req.end();
  });
  assert.strictEqual(optRes.statusCode, 204);
  assert.strictEqual(optRes.headers['access-control-allow-origin'], '*');

  // 2. Testa POST /api/mixer/connect com modo mock
  const postData = JSON.stringify({ model: 'auto', ip: 'mock' });
  const postRes = await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path: '/api/mixer/connect',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, resolve);
    req.on('error', reject);
    req.write(postData);
    req.end();
  });

  let body = '';
  for await (const chunk of postRes) body += chunk;
  assert.strictEqual(postRes.statusCode, 200);
  const data = JSON.parse(body);
  assert.strictEqual(data.ok, true);
  assert.strictEqual(data.mixer.model, 'mock');
  assert.strictEqual(data.mixer.ip, 'local');
  await new Promise((resolve) => server.close(resolve));
});
