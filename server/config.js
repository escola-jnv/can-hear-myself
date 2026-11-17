const fs = require('fs');
const path = require('path');

const candidates = [
  path.join(process.cwd(), 'config', 'app.config.json'),
  path.join(path.dirname(process.execPath), 'config', 'app.config.json'),
  path.join(__dirname, 'config', 'app.config.json'),
  path.join(__dirname, '..', 'config', 'app.config.json'),
  path.join(process.cwd(), 'config', 'example.config.json'),
  path.join(path.dirname(process.execPath), 'config', 'example.config.json'),
  path.join(__dirname, 'config', 'example.config.json'),
  path.join(__dirname, '..', 'config', 'example.config.json'),
];

const file = candidates.find((c) => {
  try { return fs.existsSync(c); } catch { return false; }
});

let config;
if (file) {
  config = JSON.parse(fs.readFileSync(file, 'utf8'));
} else {
  // Config padrão embutida no bundle
  config = require('../config/example.config.json');
}

// Parâmetros via linha de comando (ex: --port 3000 --mixer ui24r --ip 10.10.1.1)
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && args[i + 1]) config.port = Number(args[++i]);
  else if (args[i] === '--mixer' && args[i + 1]) config.mixer.model = args[++i];
  else if (args[i] === '--ip' && args[i + 1]) config.mixer.ip = args[++i];
}

if (process.env.MIXER) config.mixer.model = process.env.MIXER;
if (process.env.PORT) config.port = Number(process.env.PORT);

module.exports = config;
