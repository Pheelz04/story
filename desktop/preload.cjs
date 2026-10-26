// Tells the web app it is running inside the desktop app (hides "Install app", skips the service worker).
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('lambaNative', {
  platform: 'desktop',
  os: process.platform
});
