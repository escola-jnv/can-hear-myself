const test = require('node:test');
const assert = require('node:assert');
const config = require('../../config/example.config.json');

function findInstrumentGroup(instrumentName, groups) {
  if (!instrumentName || !groups || !groups.length) return null;
  const normInst = String(instrumentName).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const normId = String(g.id || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const normName = String(g.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (normInst === 'voz' && (normId.indexOf('voz') !== -1 || normName.indexOf('voz') !== -1 || normId.indexOf('vocal') !== -1)) {
      return g.id;
    }
    if (normInst === 'violao' && (normId.indexOf('viol') !== -1 || normName.indexOf('viol') !== -1)) {
      return g.id;
    }
    if (normInst === 'guitarra' && (normId.indexOf('guit') !== -1 || normName.indexOf('guit') !== -1)) {
      return g.id;
    }
    if (normInst === 'baixo' && (normId.indexOf('baix') !== -1 || normName.indexOf('baix') !== -1 || normId.indexOf('bass') !== -1)) {
      return g.id;
    }
    if (normInst === 'teclado' && (normId.indexOf('tecl') !== -1 || normName.indexOf('tecl') !== -1 || normId.indexOf('key') !== -1)) {
      return g.id;
    }
    if (normInst === 'bateria' && (normId.indexOf('bater') !== -1 || normName.indexOf('bater') !== -1 || normId.indexOf('drum') !== -1)) {
      return g.id;
    }
    if (normId.indexOf(normInst) !== -1 || normInst.indexOf(normId) !== -1 || normName.indexOf(normInst) !== -1) {
      return g.id;
    }
  }
  return null;
}

function getDefaultChannelOrder(instrument, groups = config.groups) {
  const order = [];
  order.push('fixed:master');
  order.push('fixed:talkback');
  order.push('fixed:click');

  const myGroupId = findInstrumentGroup(instrument, groups);
  if (myGroupId) {
    order.push('group:' + myGroupId);
  }

  if (groups) {
    groups.forEach((g) => {
      const key = 'group:' + g.id;
      if (order.indexOf(key) === -1) {
        order.push(key);
      }
    });
  }

  return order;
}

test('ordem padrão: master em 1, talk em 2, click em 3, voz em 4 para músico de voz', () => {
  const order = getDefaultChannelOrder('Voz');
  assert.strictEqual(order[0], 'fixed:master');
  assert.strictEqual(order[1], 'fixed:talkback');
  assert.strictEqual(order[2], 'fixed:click');
  assert.strictEqual(order[3], 'group:vozes');
  assert.ok(order.length >= 7);
});

test('ordem padrão prioriza o instrumento correto (guitarra, bateria, teclado, baixo, violão)', () => {
  assert.strictEqual(getDefaultChannelOrder('Guitarra')[3], 'group:guitarras');
  assert.strictEqual(getDefaultChannelOrder('Bateria')[3], 'group:bateria');
  assert.strictEqual(getDefaultChannelOrder('Teclado')[3], 'group:teclados');
  assert.strictEqual(getDefaultChannelOrder('Baixo')[3], 'group:baixo');
  assert.strictEqual(getDefaultChannelOrder('Violão')[3], 'group:violao');
});
