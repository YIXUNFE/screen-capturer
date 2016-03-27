'use strict';

const electron = require('electron');
const app = electron.app;  // Module to control application life.
const dialog = electron.dialog;
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null,
  subWindow = null,
  fs = require('fs'),
  globalShortcut = require('global-shortcut'),
  clipboard = require('electron').clipboard,
  ipc = require('electron').ipcMain;
  
// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform != 'darwin') {
    app.quit();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 92, height: 36, 
    resizable: false, 
    frame: false,
    alwaysOnTop: true,
    //fullscreen: true,
    skipTaskbar: true
  });
  
  //add shortcut
  globalShortcut.register('ctrl+shift+q', function () {
    mainWindow.webContents.send('global-shortcut-quit', 1);
  });
  globalShortcut.register('ctrl+shift+c', function () {
    mainWindow.webContents.send('global-shortcut-capture', 1);
  });
  
  
  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
  
  ipc.on('close', function () {
    app.quit()
  })
  
  ipc.on('create-sub-window', function (e, wh) {
    subWindow = new BrowserWindow({width: wh[0], height: wh[1], fullscreen: true, resizable: false, skipTaskbar: true, frame: false, alwaysOnTop: true})
    //subWindow.webContents.openDevTools()
    subWindow.loadURL('file://' + __dirname + '/sub.html')
    mainWindow.hide()
  })
  
  ipc.on('close-subwindow', function () {
    subWindow.close()
    mainWindow.show()
  })
  
  ipc.on('cut', function (e, arg) {
    subWindow.capturePage(arg, function (image) {
      clipboard.writeImage(image)
      subWindow.close()
      mainWindow.show()
    })
  })
  
  ipc.on('save-to-fs', function (e, arg) {
    subWindow.capturePage(arg, function (image) {
      subWindow.setAlwaysOnTop(false)
      dialog.showSaveDialog({title: '请选择保存路径', defaultPath: 'E:/', filters: [
        { name: 'Images', extensions: ['png'] }
      ]}, function (p) {
        fs.writeFile(p, image.toPng(), function () {
          subWindow.close()
          mainWindow.show()
        })
      })
    })
  })
});