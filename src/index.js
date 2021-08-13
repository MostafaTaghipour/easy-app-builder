const {
  app,
  BrowserWindow,
  Menu,
  nativeImage,
  MenuItem,
  dialog,
  Notification,
} = require('electron');
const {is} = require('electron-util');
const path = require('path');
const pie = require('puppeteer-in-electron');
const puppeteer = require('puppeteer-core');
const WhatsApp = require('whatsapp-web-electron.js');
const contextMenu = require('electron-context-menu');

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

require('@electron/remote/main').initialize();

// Add an item to the context menu that appears only when you click on an image
// if (is.development)
//   contextMenu({
//     prepend: (params, browserWindow) => [],
//   });

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}

const initPuppeteer = async () => {
  await pie.initialize(app);
};

initPuppeteer();

let mainWindow;
const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 1000,
    height: 700,
    title: 'Easy App Builder',
    icon: `${__dirname}/assets/images/icon.png`,
    webPreferences: {
      devTools: is.development,
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'main.html'));

  mainWindow.webContents.on(
    'new-window',
    function (evt, url, frameName, disposition, options, additionalFeatures) {
      evt.preventDefault();

      if (options.width == 800 && options.height == 600) {
        new BrowserWindow({
          width: 950,
          height: 650,
          minWidth: 950,
          height: 650,
          webPreferences: {
            devTools: is.development,
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
          },
        }).loadURL(url);
      }
    },
  );

  // Open the DevTools.
  // if (is.development) mainWindow.webContents.openDevTools({mode: 'bottom'});

  // app menu
  var menu = Menu.getApplicationMenu();

  menu.items.find((item) => item.role === "help").visible = false; 

  menu.append(
    new MenuItem({
      label: 'Easy App builder',
      submenu: [
        {
          label: 'Preferences',
          click() {
            // new BrowserWindow({
            //   width: 1000,
            //   height: 700,
            //   minWidth: 1000,
            //   height: 700,
            // }).loadFile(path.join(__dirname, "preferences.html"));
            mainWindow.loadFile(path.join(__dirname, 'preferences.html'));
          },
        },
        {
          label: 'Generate Results',
          click() {
            mainWindow.loadFile(path.join(__dirname, 'result.html'));
          },
        },
        {
          label: 'Help',
          click() {
            new BrowserWindow({
              width: 950,
              height: 650,
              minWidth: 950,
              height: 650,
              webPreferences: {
                devTools: is.development,
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true,
              },
            }).loadFile(path.join(__dirname, 'help.html'));
          },
        },
        {type: 'separator'},
        {
          label: 'Exit',
          click() {
            app.quit();
          },
        },
      ],
    }),
  );

  Menu.setApplicationMenu(menu);
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// if (is.development)
//   try {
//     require('electron-reloader')(module);
//   } catch (_) {}
