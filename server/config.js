const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'config');
const file = fs.existsSync(path.join(dir, 'app.config.json'))
  ? path.join(dir, 'app.config.json')
  : path.join(dir, 'example.config.json');

const config = JSON.parse(fs.readFileSync(file, 'utf8'));
if (process.env.MIXER) config.mixer.model = process.env.MIXER;
if (process.env.PORT) config.port = Number(process.env.PORT);

module.exports = config;
