#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const version = pkg.version;
const tag = `v${version}`;

console.log(`=== Publicação de Release: ${tag} ===\n`);

function run(cmd, desc) {
  console.log(`> [${desc}] ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit', cwd: ROOT });
  } catch (err) {
    console.error(`\n❌ Falha ao executar: ${cmd}`);
    process.exit(1);
  }
}

// 1. Conferir quarteto de versão
console.log('1. Conferindo quarteto de versão...');
let serverVersion = '';
try {
  serverVersion = require('../server/version.js').APP_VERSION;
} catch (e) {}

let changelogVersion = '';
try {
  changelogVersion = require('../docs/changelogs/index.json')[0];
} catch (e) {}

if (serverVersion !== version || changelogVersion !== version) {
  console.warn(`⚠️ Aviso: versões não estão sincronizadas no quarteto!`);
  console.warn(`  package.json: ${version}`);
  console.warn(`  server/version.js: ${serverVersion}`);
  console.warn(`  docs/changelogs/index.json: ${changelogVersion}`);
} else {
  console.log(`  ✓ Versão consistente no quarteto: ${version}`);
}

// 2. Executar testes
console.log('\n2. Executando testes automatizados...');
run('npm test', 'Testes');

// 3. Status Git
const status = execSync('git status -s', { cwd: ROOT, encoding: 'utf8' }).trim();
if (status) {
  console.log('\n3. Arquivos pendentes para commit:');
  console.log(status);
  console.log('\nAdicionando arquivos rastreados...');
  run('git add -u', 'Git add atualizados');
  
  const customMsg = process.argv[2] || `v${version} [build] chore: release ${tag}`;
  run(`git commit -m "${customMsg}"`, 'Git commit');
} else {
  console.log('\n3. Diretório de trabalho limpo.');
}

// 4. Criar Tag
console.log(`\n4. Criando tag anotada ${tag}...`);
let tagExists = false;
try {
  const existingTags = execSync('git tag', { cwd: ROOT, encoding: 'utf8' }).split('\n').map(t => t.trim());
  tagExists = existingTags.includes(tag);
} catch (e) {}

if (tagExists) {
  console.log(`Tag ${tag} já existe localmente. Atualizando apontamento para o HEAD...`);
  run(`git tag -f -a ${tag} -m "${tag} — Release"`, 'Atualizar tag');
} else {
  run(`git tag -a ${tag} -m "${tag} — Release"`, 'Criar tag');
}

// 5. Enviar para o GitHub
console.log('\n5. Enviando código e tag para o GitHub...');
run('git push origin main', 'Push main');
run(`git push -f origin ${tag}`, `Push tag ${tag}`);

console.log(`\n===============================================================`);
console.log(`🚀 SUCESSO! Código e tag ${tag} enviados para o GitHub!`);
console.log(`\nO GitHub Actions foi iniciado automaticamente.`);
console.log(`Ele irá:`);
console.log(`  1. Compilar os binários Windows no runner`);
console.log(`  2. Publicar a Release oficial no GitHub`);
console.log(`  3. Anexar apenas o EXE para download direto`);
console.log(`\nAcompanhe o build em:`);
console.log(`  https://github.com/escola-jnv/can-hear-myself/actions`);
console.log(`\nPágina de download para os usuários (apenas o EXE):`);
console.log(`  https://github.com/escola-jnv/can-hear-myself/releases`);
console.log(`  Link direto do .exe: https://github.com/escola-jnv/can-hear-myself/releases/latest/download/can-hear-myself.exe`);
console.log(`===============================================================\n`);
