const { app, BrowserWindow, Tray, nativeImage, Menu, screen, ipcMain } = require("electron");
const path = require("path");
const activeWindow = require('active-win');

let mainWindow = null;
let tray = null;

// Handler for mouse events
ipcMain.on("set-ignore-mouse-events", (event, ignore, options) => {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(ignore, options);
  }
});

// Handler to get Spotify window title
ipcMain.handle('get-spotify-info', async () => {
  try {
    const windows = await activeWindow.getOpenWindows();
    
    // Look for Spotify window
    for (const window of windows) {
      if (window.owner && window.owner.name && 
          window.owner.name.toLowerCase().includes('spotify')) {
        // Spotify format: "Artist - Song - Spotify" or just "Spotify" when paused
        const title = window.title;
        if (title && title !== 'Spotify') {
          // Remove " - Spotify" from the end
          const musicInfo = title.replace(' - Spotify', '');
          return musicInfo;
        }
        return 'Paused';
      }
    }
    
    // If no Spotify window found, try active window as fallback
    const active = await activeWindow();
    if (active && active.owner && active.owner.name && 
        active.owner.name.toLowerCase().includes('spotify')) {
      const title = active.title;
      if (title && title !== 'Spotify') {
        return title.replace(' - Spotify', '');
      }
      return 'Paused';
    }
    
    return null;
  } catch (error) {
    console.error('Error getting Spotify info:', error);
    return null;
  }
});

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width } = primaryDisplay.workAreaSize;
  const windowWidth = width;
  const windowHeight = 160;

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
    },
    alwaysOnTop: false,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    acceptFirstMouse: true,
    ignoreMouseEvents: false,
  });

  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  mainWindow.setAlwaysOnTop(false);
  mainWindow.loadFile(path.join(__dirname, "index.html"));

  // Hide window instead of closing
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  setupTray();
}

function setupTray() {
  let icon;
  try {
    const iconPath = path.join(__dirname, "assets", "icons", "main-icon.png");
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      throw new Error("Icon not found");
    }
  } catch (error) {
    console.log("Tray icon not found, using fallback");
    icon = nativeImage.createFromDataURL(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    );
  }

  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  tray.setToolTip("System Info Bar");

  tray.on("click", () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show/Hide",
      click: () => {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: "separator" },
    { 
      label: "Exit", 
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    },
  ]);

  tray.setContextMenu(contextMenu);
}

// Performance optimizations
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});