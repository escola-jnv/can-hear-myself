const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const { server, startupState } = require('../../server/index');

test('API /api/startup retorna estado inicial com 4 passos e URLs geradas', async (t) => {
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  t.after(() => {
    return new Promise((resolve) => server.close(resolve));
  });

  const res = await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path: '/api/startup',
      method: 'GET'
    }, resolve);
    req.on('error', reject);
    req.end();
  });

  assert.strictEqual(res.statusCode, 200);
  let body = '';
  for await (const chunk of res) body += chunk;
  const data = JSON.parse(body);

  assert.ok(data.phase, 'deve possuir phase');
  assert.strictEqual(data.totalSteps, 4, 'rotina deve ter 4 passos');
  assert.ok(Array.isArray(data.techUrls), 'techUrls deve ser array');
  assert.ok(Array.isArray(data.musicianUrls), 'musicianUrls deve ser array');
  assert.ok(data.mixer, 'deve possuir info da mesa');
  await new Promise((resolve) => server.close(resolve));
});
