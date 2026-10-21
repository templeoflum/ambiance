// main.cjs — Electron main process
// Creates the frameless "radio" window, loads the renderer, persists state on close.
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { load, save } = require('./main/store.cjs');

let win = null;
let lastState = null;

function createRadio() {
  const state = load('radio');
  lastState = { ...state };

  const { x, y, width, height } = {
    x: state.position.x,   // null → Electron centres
    y: state.position.y,
    width: state.size.width,
    height: state.size.height,
  };

  win = new BrowserWindow({
    x,
    y,
    width,
    height,
    frame: false,               // fully frameless — the surface IS the device
    resizable: true,
    minimizable: false,
    maximizable: false,
    transparent: false,
    backgroundColor: '#1e1812',
    hasShadow: true,
    alwaysOnTop: false,
    show: true,
    title: 'AMB · Radio',
    webPreferences: {
      nodeIntegration: true,    // renderer can read local files
      contextIsolation: false,
      webSecurity: false,       // local audio file access
      preload: null,
    },
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Periodic state capture (throttled; final save on close)
  win.on('moved', () => {
    const [px, py] = win.getPosition();
    lastState = { ...lastState, position: { x: px, y: py } };
  });
  win.on('resized', () => {
    const [pw, ph] = win.getSize();
    lastState = { ...lastState, size: { width: pw, height: ph } };
  });

  win.on('closed', () => {
    try { save('radio', lastState); } catch {}
  });
}

app.whenReady().then(createRadio);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (win === null) createRadio();
});

// IPC: renderer → main control channel
const { ipcMain } = require('electron');

// On-surface QUIT button → actually quit the app
ipcMain.on('app:quit', () => {
  app.quit();
});

// Save state from renderer (best-effort, also saved on window close)
ipcMain.on('device:save', (_e, patch) => {
  lastState = { ...lastState, ...patch };
  save('radio', lastState);
});
