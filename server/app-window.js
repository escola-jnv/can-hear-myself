const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execSync, exec } = require('child_process');

/**
 * Procura um executável de navegador baseado em Chromium (Edge, Chrome, Brave)
 * no sistema para rodar em modo aplicativo (--app=URL).
 */
function findChromiumBrowser() {
  if (process.platform === 'win32') {
    const candidates = [
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      path.join(process.env.LOCALAPPDATA || '', 'Microsoft\\Edge\\Application\\msedge.exe'),
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
      'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      path.join(process.env.LOCALAPPDATA || '', 'BraveSoftware\\Brave-Browser\\Application\\brave.exe'),
    ];
    for (const p of candidates) {
      if (p && fs.existsSync(p)) return p;
    }
    return null;
  }

  if (process.platform === 'darwin') {
    const candidates = [
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    return null;
  }

  if (process.platform === 'linux') {
    const candidates = [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/usr/bin/microsoft-edge',
      '/usr/bin/microsoft-edge-stable',
      '/usr/bin/brave-browser',
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    return null;
  }

  return null;
}

/**
 * Exibe uma caixa de diálogo nativa do Windows sem abrir janela de terminal.
 */
function showNativeDialog(title, message, type = 'info') {
  if (process.platform === 'win32') {
    try {
      const iconCode = type === 'error' ? 16 : type === 'warning' ? 48 : 64;
      const escapedMsg = String(message).replace(/"/g, '""').replace(/\r?\n/g, '" & vbCrLf & "');
      const escapedTitle = String(title).replace(/"/g, '""');
      const vbs = `MsgBox "${escapedMsg}", ${iconCode}, "${escapedTitle}"`;
      const vbsPath = path.join(os.tmpdir(), `chm-dialog-${Date.now()}.vbs`);
      fs.writeFileSync(vbsPath, vbs, 'utf8');
      execSync(`wscript //nologo "${vbsPath}"`, { windowsHide: true });
      try { fs.unlinkSync(vbsPath); } catch {}
      return;
    } catch {}
  }
  console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
}

/**
 * Configura o log em arquivo (data/logs/server.log) para manter histórico
 * mesmo quando executado sem terminal visível.
 */
function setupFileLogging() {
  try {
    const baseDir = process.pkg || process.execPath.toLowerCase().endsWith('can-hear-myself.exe')
      ? path.dirname(process.execPath)
      : process.cwd();
    const logDir = path.join(baseDir, 'data', 'logs');
    fs.mkdirSync(logDir, { recursive: true });
    const logFile = path.join(logDir, 'server.log');
    const logStream = fs.createWriteStream(logFile, { flags: 'a' });

    const origLog = console.log;
    const origError = console.error;

    console.log = function (...args) {
      const line = `[${new Date().toISOString()}] [INFO] ${args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ')}\n`;
      try { logStream.write(line); } catch {}
      try { origLog.apply(console, args); } catch {}
    };

    console.error = function (...args) {
      const line = `[${new Date().toISOString()}] [ERROR] ${args.map((a) => (typeof a === 'object' ? (a && a.stack ? a.stack : JSON.stringify(a)) : a)).join(' ')}\n`;
      try { logStream.write(line); } catch {}
      try { origError.apply(console, args); } catch {}
    };
  } catch {}
}

/**
 * Abre a janela web no próprio exe ("fake app"), sem barras de navegação,
 * sem abas e sem URL bar.
 * Quando o usuário fechar a janela, chama onExit() para encerrar o servidor.
 */
function openAppWindow(url, options = {}) {
  const browser = findChromiumBrowser();
  const width = options.width || 1200;
  const height = options.height || 800;

  if (browser) {
    const profileDir = path.join(
      process.env.LOCALAPPDATA || os.tmpdir(),
      'CanHearMyself',
      'app_profile'
    );
    try { fs.mkdirSync(profileDir, { recursive: true }); } catch {}

    const args = [
      `--app=${url}`,
      `--user-data-dir=${profileDir}`,
      `--window-size=${width},${height}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-sync',
      '--disable-features=Translate',
      '--app-id=br.com.proske.canhearmyself'
    ];

    console.log(`Iniciando janela do aplicativo com ${path.basename(browser)}...`);
    const child = spawn(browser, args, {
      detached: false,
      stdio: 'ignore',
      windowsHide: false
    });

    child.on('error', (err) => {
      console.error('Falha ao abrir janela web dedicada:', err.message);
      fallbackOpen(url);
    });

    child.on('exit', (code) => {
      console.log(`Janela do aplicativo foi fechada (código ${code}).`);
      if (typeof options.onExit === 'function') {
        options.onExit(code);
      }
    });

    return child;
  }

  console.log('Navegador Chromium não encontrado. Abrindo no navegador padrão...');
  fallbackOpen(url);
  return null;
}

function fallbackOpen(url) {
  const cmd = process.platform === 'win32'
    ? `start "" "${url}"`
    : process.platform === 'darwin'
    ? `open "${url}"`
    : `xdg-open "${url}"`;
  exec(cmd, (err) => {
    if (err) console.error('Erro ao abrir URL:', err.message);
  });
}

module.exports = {
  findChromiumBrowser,
  showNativeDialog,
  setupFileLogging,
  openAppWindow
};
