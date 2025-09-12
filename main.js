const { app, BrowserWindow, Tray, nativeImage, Menu, screen, ipcMain } = require("electron")
const path = require("path")

let mainWindow = null
let tray = null

ipcMain.on("set-ignore-mouse-events", (event, ignore, options) => {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(ignore, options)
  }
})

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize
  const windowWidth = width
  const windowHeight = 32

  const x = 0
  const y = 0

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: x,
    y: y,
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
  })

  mainWindow.setIgnoreMouseEvents(true, { forward: true })
  mainWindow.setAlwaysOnTop(false)
  mainWindow.loadFile(path.join(__dirname, "index.html"))
  
  setupTray()
}

function setupTray() {
  let icon
  try {
    const iconPath = path.join(__dirname, 'assets', 'icons', 'tray-icon.png')
    icon = nativeImage.createFromPath(iconPath)
    if (icon.isEmpty()) {
      throw new Error('Icona non trovata')
    }
  } catch (error) {
    console.log('Icona del tray non trovata, uso icona di fallback')
    icon = nativeImage.createFromDataURL(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    )
  }

  tray = new Tray(icon.resize({ width: 16, height: 16 }))
  tray.setToolTip("Minimal Utility Bar")

  tray.on("click", () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
  })

  const contextMenu = Menu.buildFromTemplate([
    { 
      label: "Mostra/Nascondi", 
      click: () => {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
      }
    },
    { type: "separator" },
    { label: "Esci", click: () => app.quit() }
  ])
  
  tray.setContextMenu(contextMenu)
}

app.commandLine.appendSwitch("disable-background-timer-throttling")
app.commandLine.appendSwitch("disable-renderer-backgrounding")
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows")

app.whenReady().then(() => {
  createWindow()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})