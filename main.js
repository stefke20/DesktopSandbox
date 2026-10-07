// Electron main process: window modes (window / desktop strip / wallpaper),
// tray menu, click-through "watch only" mode and a global shortcut.
const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, screen, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

const CONFIG_FILE = () => path.join(app.getPath('userData'), 'desktop-config.json');
const SHORTCUT = 'CommandOrControl+Alt+G';

let cfg = { mode: 'window', alwaysOnTop: false, stripHeight: 0.3, bounds: null, clickThrough: false };
let win = null;
let tray = null;
let biomes = [];
let quitting = false;

function loadConfig() {
  try { Object.assign(cfg, JSON.parse(fs.readFileSync(CONFIG_FILE(), 'utf8'))); } catch (e) { /* first run */ }
}
function saveConfig() {
  try { fs.writeFileSync(CONFIG_FILE(), JSON.stringify(cfg, null, 2)); } catch (e) { /* ignore */ }
}

function windowOptions(mode) {
  const display = screen.getPrimaryDisplay();
  const wa = display.workArea;
  const base = {
    backgroundColor: '#0b0d14',
    show: false,
    title: 'Pixel Terrarium',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  };
  if (mode === 'strip') {
    const h = Math.round(wa.height * cfg.stripHeight);
    return Object.assign(base, {
      x: wa.x, y: wa.y + wa.height - h, width: wa.width, height: h,
      frame: false, resizable: false, movable: false, skipTaskbar: true, hasShadow: false,
      alwaysOnTop: cfg.alwaysOnTop,
    });
  }
  if (mode === 'wallpaper') {
    const b = display.bounds;
    return Object.assign(base, {
      x: b.x, y: b.y, width: b.width, height: b.height,
      frame: false, resizable: false, movable: false, skipTaskbar: true, hasShadow: false,
      // On Linux and macOS a "desktop" window sits behind all other windows like a wallpaper.
      ...(process.platform === 'linux' || process.platform === 'darwin' ? { type: 'desktop' } : {}),
    });
  }
  const bounds = cfg.bounds || { width: 1280, height: 720 };
  return Object.assign(base, bounds, { minWidth: 480, minHeight: 270, alwaysOnTop: cfg.alwaysOnTop });
}

function createWindow() {
  const mode = cfg.mode;
  win = new BrowserWindow(windowOptions(mode));
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  win.once('ready-to-show', () => {
    if (mode === 'wallpaper') win.showInactive();
    else win.show();
    applyClickThrough();
  });
  const remember = () => {
    if (cfg.mode === 'window' && win && !win.isMinimized() && !win.isMaximized()) {
      cfg.bounds = win.getBounds();
      saveConfig();
    }
  };
  win.on('resized', remember);
  win.on('moved', remember);
  win.on('close', (e) => {
    // frameless modes keep running in the tray
    if (!quitting && cfg.mode !== 'window' && tray) { e.preventDefault(); win.hide(); }
  });
  win.on('closed', () => { win = null; });
}

function setMode(mode) {
  if (!['window', 'strip', 'wallpaper'].includes(mode) || mode === cfg.mode && win) return;
  cfg.mode = mode;
  if (mode === 'window') cfg.clickThrough = false;
  saveConfig();
  const old = win;
  win = null;
  if (old) { old.removeAllListeners('close'); old.destroy(); }
  createWindow();
  buildTray();
}

function applyClickThrough() {
  if (!win) return;
  if (cfg.clickThrough) win.setIgnoreMouseEvents(true, { forward: true });
  else win.setIgnoreMouseEvents(false);
  send({ type: 'state', state: state() });
}

function setClickThrough(on) {
  cfg.clickThrough = !!on;
  saveConfig();
  applyClickThrough();
  buildTray();
}

function state() {
  return {
    mode: cfg.mode,
    alwaysOnTop: cfg.alwaysOnTop,
    clickThrough: cfg.clickThrough,
    stripHeight: cfg.stripHeight,
    openAtLogin: app.getLoginItemSettings().openAtLogin,
    shortcut: SHORTCUT,
  };
}

function send(cmd) {
  if (win && !win.isDestroyed()) win.webContents.send('command', cmd);
}

function buildTray() {
  if (!tray) {
    const img = nativeImage.createFromPath(path.join(__dirname, 'assets', 'tray.png')).resize({ width: 16, height: 16 });
    tray = new Tray(img);
    tray.setToolTip('Pixel Terrarium');
    tray.on('click', () => { if (win) { win.show(); if (cfg.clickThrough) setClickThrough(false); } });
  }
  const weather = [['auto', 'Automatic'], ['clear', 'Clear'], ['cloudy', 'Cloudy'], ['rain', 'Rain'], ['storm', 'Thunderstorm'], ['drylightning', 'Dry lightning'], ['windy', 'Windy'], ['snow', 'Snow'], ['sandstorm', 'Sandstorm'], ['ashfall', 'Ash fall'], ['fog', 'Fog']];
  const events = [['volcano', 'Volcano eruption'], ['abduction', 'Alien abduction'], ['tornado', 'Tornado'], ['blackhole', 'Black hole'], ['radiation', 'Radiation storm'], ['hurricane', 'Hurricane'], ['solarflare', 'Solar flare'], ['drought', 'Drought'], ['monsoon', 'Monsoon']];
  const menu = Menu.buildFromTemplate([
    { label: 'Play god  (Ctrl+Alt+G)', type: 'checkbox', checked: !cfg.clickThrough, click: (i) => setClickThrough(!i.checked) },
    { label: 'Show / hide controls', click: () => send({ type: 'toggle-ui' }) },
    { label: 'Pause / resume', click: () => send({ type: 'pause' }) },
    { type: 'separator' },
    {
      label: 'Biome',
      submenu: biomes.length ? biomes.map((b) => ({ label: `${b.icon}  ${b.name}`, click: () => send({ type: 'biome', id: b.id }) })) : [{ label: '(loading)', enabled: false }],
    },
    { label: 'Weather', submenu: weather.map(([id, label]) => ({ label, click: () => send({ type: 'weather', id }) })) },
    { label: 'Special event', submenu: events.map(([id, label]) => ({ label, click: () => send({ type: 'event', id }) })) },
    {
      label: 'Time',
      submenu: [['Sunrise', 0.25], ['Noon', 0.5], ['Sunset', 0.75], ['Midnight', 0]].map(([label, value]) => ({ label, click: () => send({ type: 'time', value }) })),
    },
    { type: 'separator' },
    {
      label: 'Display',
      submenu: [
        { label: 'Window', type: 'radio', checked: cfg.mode === 'window', click: () => setMode('window') },
        { label: 'Desktop strip', type: 'radio', checked: cfg.mode === 'strip', click: () => setMode('strip') },
        { label: 'Full-screen wallpaper', type: 'radio', checked: cfg.mode === 'wallpaper', click: () => setMode('wallpaper') },
      ],
    },
    { label: 'Always on top', type: 'checkbox', checked: cfg.alwaysOnTop, click: (i) => setAlwaysOnTop(i.checked) },
    { label: 'Start with computer', type: 'checkbox', checked: app.getLoginItemSettings().openAtLogin, click: (i) => app.setLoginItemSettings({ openAtLogin: i.checked }) },
    { type: 'separator' },
    { label: 'Quit', click: () => { quitting = true; app.quit(); } },
  ]);
  tray.setContextMenu(menu);
}

function setAlwaysOnTop(on) {
  cfg.alwaysOnTop = !!on;
  saveConfig();
  if (win) win.setAlwaysOnTop(cfg.alwaysOnTop);
  buildTray();
}

// ---------------------------------------------------------------- IPC
ipcMain.handle('get-state', () => state());
ipcMain.on('set-mode', (_e, mode) => setMode(mode));
ipcMain.on('set-always-on-top', (_e, on) => setAlwaysOnTop(on));
ipcMain.on('set-click-through', (_e, on) => setClickThrough(on));
ipcMain.on('set-open-at-login', (_e, on) => { app.setLoginItemSettings({ openAtLogin: !!on }); buildTray(); });
ipcMain.on('set-strip-height', (_e, v) => {
  cfg.stripHeight = Math.min(0.8, Math.max(0.1, +v || 0.3));
  saveConfig();
  if (cfg.mode === 'strip' && win) {
    const wa = screen.getPrimaryDisplay().workArea;
    const h = Math.round(wa.height * cfg.stripHeight);
    win.setBounds({ x: wa.x, y: wa.y + wa.height - h, width: wa.width, height: h });
  }
});
ipcMain.on('set-biomes', (_e, list) => {
  if (Array.isArray(list)) biomes = list.slice(0, 64).map((b) => ({ id: String(b.id), name: String(b.name), icon: String(b.icon || '') }));
  buildTray();
});
ipcMain.on('quit', () => { quitting = true; app.quit(); });

// ---------------------------------------------------------------- lifecycle
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!win) return;
    if (cfg.clickThrough) setClickThrough(false);
    win.show();
    win.focus();
  });
  app.whenReady().then(() => {
    loadConfig();
    createWindow();
    buildTray();
    globalShortcut.register(SHORTCUT, () => setClickThrough(!cfg.clickThrough));
    const refit = () => {
      if (!win || cfg.mode === 'window') return;
      const o = windowOptions(cfg.mode);
      win.setBounds({ x: o.x, y: o.y, width: o.width, height: o.height });
    };
    screen.on('display-metrics-changed', refit);
    screen.on('display-added', refit);
    screen.on('display-removed', refit);
  });
  app.on('before-quit', () => { quitting = true; });
  app.on('will-quit', () => globalShortcut.unregisterAll());
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
  app.on('activate', () => { if (!win) createWindow(); });
}
