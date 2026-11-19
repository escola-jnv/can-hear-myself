// Gera public/js/lucide-lite.js só com os ícones Lucide usados pelo app.
// Uso: npm run icons   (precisa do pacote "lucide" instalado como devDependency)
const fs = require('fs');
const path = require('path');

// Ícones usados no app do músico (index.html, app.js, levelRow). Adicione aqui quando usar um novo.
const WANT = [
  'check', 'check-circle', 'chevron-left', 'chevron-right', 'circle-help', 'clock', 'drum',
  'music-2', 'refresh-cw', 'user-plus', 'mic', 'mic-vocal', 'guitar', 'guitar-electric', 'clef-bass',
  'piano', 'music', 'disc-3', 'play', 'volume-x', 'headphones', 'mic-off', 'timer', 'hand',
  'volume-2', 'headset', 'save', 'x', 'qr-code', 'pin', 'pin-off', 'arrow-up', 'arrow-down',
  'arrow-up-down', 'grip-vertical', 'rotate-ccw',
];

const { icons } = require('lucide');
const toKey = (n) => n.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
const esc = (v) => String(v).replace(/"/g, '&quot;');

const out = {};
const missing = [];
for (const name of WANT) {
  const node = icons[toKey(name)];
  if (!node) { missing.push(name); continue; }
  out[name] = node.map(([tag, attrs]) =>
    `<${tag}${Object.entries(attrs).filter(([a]) => a !== 'key').map(([a, v]) => ` ${a}="${esc(v)}"`).join('')}/>`
  ).join('');
}
if (missing.length) { console.error('Ícones não encontrados no Lucide:', missing.join(', ')); process.exit(1); }

const js = `// Subconjunto dos ícones Lucide (licença ISC) usados pelo app. ARQUIVO GERADO: não edite à mão.
// Para adicionar um ícone: inclua o nome em build/gen-icons.js e rode "npm run icons".
(function () {
  var ICONS = ${JSON.stringify(out)};
  function svg(name, cls) {
    var body = ICONS[name] || ICONS.music;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-' + name + (cls ? ' ' + cls : '') + '">' + body + '</svg>';
  }
  function createIcons() {
    var els = document.querySelectorAll('i[data-lucide]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var wrap = document.createElement('span');
      wrap.innerHTML = svg(el.getAttribute('data-lucide'), el.getAttribute('class'));
      el.parentNode.replaceChild(wrap.firstChild, el);
    }
  }
  window.lucide = { createIcons: createIcons, svg: svg };
})();
`;
const target = path.join(__dirname, '..', 'public', 'js', 'lucide-lite.js');
fs.writeFileSync(target, js);
console.log(`lucide-lite.js gerado: ${WANT.length} ícones, ${(js.length / 1024).toFixed(1)} KB`);
