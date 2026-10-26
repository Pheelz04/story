// LAMBA desktop app (Electron main process).
// Starts the LAMBA Express server inside the app on 127.0.0.1, then opens it in a window.
// Your videos and profile are saved in %APPDATA%\LAMBA\data on Windows.
const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const PREFERRED_PORT = 47821; // fixed port keeps the app's origin stable between launches

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

let mainWindow = null;
let baseUrl = null;

async function startBackend() {
  process.env.LAMBA_DATA_DIR = path.join(app.getPath('userData'), 'data');
  process.env.LAMBA_CLIENT_DIST = path.join(__dirname, 'client', 'dist');
  const serverEntry = pathToFileURL(path.join(__dirname, 'server', 'src', 'index.js')).href;
  const { startServer } = await import(serverEntry);
  try {
    const { port } = await startServer({ port: PREFERRED_PORT, host: '127.0.0.1' });
    return `http://127.0.0.1:${port}`;
  } catch (err) {
    if (err.code !== 'EADDRINUSE') throw err;
    const { port } = await startServer({ port: 0, host: '127.0.0.1' }); // any free port
    return `http://127.0.0.1:${port}`;
  }
}

const isInternal = (url) => url.startsWith(baseUrl);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: '#0b0b10',
    title: 'LAMBA',
    icon: path.join(__dirname, 'build', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Share links (X, WhatsApp, …) and any outside link open in the user's browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url) && !isInternal(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isInternal(url)) {
      event.preventDefault();
      if (/^https?:/i.test(url)) shell.openExternal(url);
    }
  });

  mainWindow.loadURL(baseUrl);
}

function buildMenu() {
  const template = [
    {
      label: 'LAMBA',
      submenu: [
        { label: 'Home', accelerator: 'CmdOrCtrl+1', click: () => mainWindow?.loadURL(`${baseUrl}/`) },
        { label: 'Studio', accelerator: 'CmdOrCtrl+2', click: () => mainWindow?.loadURL(`${baseUrl}/studio`) },
        { label: 'Community Gallery', accelerator: 'CmdOrCtrl+3', click: () => mainWindow?.loadURL(`${baseUrl}/gallery`) },
        { label: 'Profile', accelerator: 'CmdOrCtrl+4', click: () => mainWindow?.loadURL(`${baseUrl}/profile`) },
        { type: 'separator' },
        {
          label: 'Open data folder',
          click: () => shell.openPath(path.join(app.getPath('userData'), 'data'))
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About LAMBA',
          click: () =>
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About LAMBA',
              message: `LAMBA ${app.getVersion()}`,
              detail: 'AI Video Studio — create, remix and share AI videos.'
            })
        }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.on('second-instance', () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
});

app.whenReady().then(async () => {
  try {
    baseUrl = await startBackend();
  } catch (err) {
    dialog.showErrorBox('LAMBA could not start', String(err?.stack || err));
    app.quit();
    return;
  }
  buildMenu();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
