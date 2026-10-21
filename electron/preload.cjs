const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('luminoriaDesktop', {
  isDesktop: true,
  platform: process.platform,
  version: '1.0.0',
});
