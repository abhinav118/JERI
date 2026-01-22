import { app, BrowserWindow, ipcMain, session } from 'electron';
import { join } from 'path';
import { BrowserManager } from './browserManager';
import { CDPManager } from './cdp';

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

let mainWindow: BrowserWindow | null = null;
let browserManager: BrowserManager | null = null;

function createWindow(): void {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Need this for preload to work properly
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 10, y: 10 },
    backgroundColor: '#1e1e2e',
    show: false,
  });

  // Initialize browser manager
  browserManager = new BrowserManager(mainWindow);

  // Initialize CDP manager (sets up IPC handlers in constructor)
  new CDPManager(() => browserManager?.getActiveWebContents() || null);

  // Handle window resize to update BrowserView bounds
  mainWindow.on('resize', () => {
    browserManager?.resizeView();
  });

  // Load the renderer
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();

    // Create initial tab
    browserManager?.createTab('https://www.google.com');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    browserManager = null;
  });
}

// Handle app lifecycle
app.whenReady().then(() => {
  // Set up content security policy
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; img-src 'self' data: blob: https: http:;"],
      },
    });
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handler for getting app info
ipcMain.handle('get-app-info', () => {
  return {
    version: app.getVersion(),
    platform: process.platform,
  };
});

