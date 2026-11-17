const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const esbuild = require('esbuild');
const { inject } = require('postject');

const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const CACHE_DIR = path.join(__dirname, '.cache');
const EMBEDDED_ASSETS_FILE = path.join(ROOT, 'server', 'embedded-assets.js');
const BUNDLE_FILE = path.join(CACHE_DIR, 'server.bundle.cjs');
const SEA_CONFIG_FILE = path.join(CACHE_DIR, 'sea-config.json');
const SEA_BLOB_FILE = path.join(CACHE_DIR, 'sea-prep.blob');
const TEMP_EXE_FILE = path.join(CACHE_DIR, 'server.exe');

const OUTPUT_TARGETS = [
  path.join(ROOT, 'can-hear-myself.exe'),
  path.join(ROOT, 'desktop', 'src-tauri', 'binaries', 'chm-server-x86_64-pc-windows-msvc.exe'),
  path.join(ROOT, 'desktop', 'src-tauri', 'binaries', 'chm-server.exe'),
];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

function getFiles(dir, base = '') {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.join(base, entry.name).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      results = results.concat(getFiles(full, rel));
    } else if (entry.isFile() && !entry.name.endsWith('.gitkeep')) {
      results.push({ full, rel: '/' + rel });
    }
  }
  return results;
}

async function build() {
  console.log('=== Iniciando build do executável Node SEA (Windows) ===\n');
  const startTime = Date.now();

  fs.mkdirSync(CACHE_DIR, { recursive: true });

  // 1. Gerar embedded-assets.js com todos os arquivos de public/
  console.log('[1/5] Mapeando arquivos estáticos de public/...');
  const publicFiles = getFiles(PUBLIC_DIR);
  const assetsMap = {};
  for (const item of publicFiles) {
    const ext = path.extname(item.full).toLowerCase();
    const data = fs.readFileSync(item.full);
    assetsMap[item.rel] = {
      type: MIME_TYPES[ext] || 'application/octet-stream',
      data: data.toString('base64'),
    };
    console.log(`  + ${item.rel} (${data.length} bytes)`);
  }

  const assetsCode = `// Gerado automaticamente pelo build-server.js\nmodule.exports = ${JSON.stringify(assetsMap, null, 2)};\n`;
  fs.writeFileSync(EMBEDDED_ASSETS_FILE, assetsCode, 'utf8');
  console.log(`  -> Salvo em server/embedded-assets.js\n`);

  // 2. Empacotar o servidor com esbuild
  console.log('[2/5] Empacotando servidor com esbuild...');
  await esbuild.build({
    entryPoints: [path.join(ROOT, 'server', 'index.js')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    outfile: BUNDLE_FILE,
    logLevel: 'info',
  });
  console.log(`  -> Bundle criado em: ${BUNDLE_FILE} (${(fs.statSync(BUNDLE_FILE).size / 1024).toFixed(1)} KB)\n`);

  // 3. Gerar o blob do Node SEA
  console.log('[3/5] Gerando o blob do Node SEA...');
  const seaConfig = {
    main: BUNDLE_FILE,
    output: SEA_BLOB_FILE,
    disableExperimentalSEAWarning: true,
  };
  fs.writeFileSync(SEA_CONFIG_FILE, JSON.stringify(seaConfig, null, 2), 'utf8');

  execSync(`"${process.execPath}" --experimental-sea-config "${SEA_CONFIG_FILE}"`, {
    stdio: 'inherit',
    cwd: ROOT,
  });
  console.log(`  -> Blob SEA gerado: ${SEA_BLOB_FILE} (${(fs.statSync(SEA_BLOB_FILE).size / 1024).toFixed(1)} KB)\n`);

  // 4. Injetar blob no binário do Node.js
  console.log('[4/5] Injetando código no executável do Node.js com postject...');
  // CHM_NODE_BINARY permite gerar o .exe de Windows a partir de outra máquina
  // (o node.exe precisa ser da MESMA versão do Node que gerou o blob).
  const nodeBinary = process.env.CHM_NODE_BINARY || process.execPath;
  console.log(`  Fonte Node: ${nodeBinary}`);
  fs.copyFileSync(nodeBinary, TEMP_EXE_FILE);

  const blobData = fs.readFileSync(SEA_BLOB_FILE);
  await inject(TEMP_EXE_FILE, 'NODE_SEA_BLOB', blobData, {
    overwrite: true,
    sentinelFuse: 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2',
  });
  console.log('  -> Injeção concluída com sucesso!\n');

  // 5. Copiar executável para os destinos
  console.log('[5/5] Distribuindo executável gerado...');
  for (const target of OUTPUT_TARGETS) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(TEMP_EXE_FILE, target);
    const sizeMb = (fs.statSync(target).size / (1024 * 1024)).toFixed(2);
    console.log(`  -> ${path.relative(ROOT, target)} (${sizeMb} MB)`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n=== Executável gerado com sucesso em ${elapsed}s! ===`);
  console.log('\nPara executar diretamente:');
  console.log('  .\\can-hear-myself.exe');
  console.log('Ou com opções personalizadas:');
  console.log('  .\\can-hear-myself.exe --port 3000 --mixer ui24r --ip 10.10.1.1\n');
}

build().catch((err) => {
  console.error('\nErro ao gerar o executável:', err);
  process.exit(1);
});
