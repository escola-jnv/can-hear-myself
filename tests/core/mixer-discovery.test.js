const test = require('node:test');
const assert = require('node:assert');
const { getScanTargets, findMixer, detectMixer, isSoundcraftResponse } = require('../../server/discovery/find-mixer');

test('getScanTargets retorna lista de IPs incluindo o hotspot padrão da Ui24R (10.10.1.1)', () => {
  const targets = getScanTargets();
  assert(Array.isArray(targets.ips), 'ips deve ser array');
  assert(targets.ips.includes('10.10.1.1'), 'deve incluir 10.10.1.1');
  assert(targets.ips.length > 0, 'deve ter pelo menos 1 IP para varredura');
  assert(Array.isArray(targets.broadcasts), 'broadcasts deve ser array');
  assert(targets.broadcasts.includes('255.255.255.255'), 'deve incluir 255.255.255.255');
});

test('findMixer executa varredura e retorna estrutura esperada', async () => {
  const result = await findMixer({ ips: ['127.0.0.1'], broadcasts: [], waitMs: 50 });
  assert(Array.isArray(result.mixers), 'mixers deve ser um array');
  assert(typeof result.scannedCount === 'number', 'scannedCount deve ser um número');
  assert.strictEqual(result.scannedCount, 1);
});

test('isSoundcraftResponse detecta assinaturas típicas da Ui24R', () => {
  assert.strictEqual(isSoundcraftResponse('HTTP/1.1 200 OK\r\nServer: Soundcraft\r\n<title>Ui24R</title>'), true);
  assert.strictEqual(isSoundcraftResponse('HTTP/1.1 302 Found\r\nLocation: /ui-app/index.html'), true);
  assert.strictEqual(isSoundcraftResponse('HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nUiWebTracker'), true);
  assert.strictEqual(isSoundcraftResponse('HTTP/1.1 404 Not Found\r\nApache Server'), false);
});

test('detectMixer resolve mock para IP vazio ou local', async () => {
  const rMock = await detectMixer('mock');
  assert.strictEqual(rMock.model, 'mock');
  assert.strictEqual(rMock.ip, 'local');

  const rLocal = await detectMixer('local');
  assert.strictEqual(rLocal.model, 'mock');

  const rEmpty = await detectMixer('');
  assert.strictEqual(rEmpty.model, 'mock');
});
