// Exposes a small, safe desktop API to the renderer.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  getState: () => ipcRenderer.invoke('get-state'),
  setMode: (mode) => ipcRenderer.send('set-mode', mode),
  setAlwaysOnTop: (on) => ipcRenderer.send('set-always-on-top', !!on),
  setClickThrough: (on) => ipcRenderer.send('set-click-through', !!on),
  setOpenAtLogin: (on) => ipcRenderer.send('set-open-at-login', !!on),
  setStripHeight: (v) => ipcRenderer.send('set-strip-height', +v),
  setBiomes: (list) => ipcRenderer.send('set-biomes', list),
  quit: () => ipcRenderer.send('quit'),
  onCommand: (cb) => ipcRenderer.on('command', (_e, cmd) => cb(cmd)),
});
