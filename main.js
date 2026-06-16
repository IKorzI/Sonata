import { app, BrowserWindow, ipcMain, Menu } from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import "./src/scripts/utils.js";
import "./src/scripts/language.js";
import "./src/scripts/session/package-of-documents.js";
import "./src/scripts/session/empty-statements.js";
import "./src/scripts/session/report.js";
import "./src/scripts/session/debtors.js";
import "./src/scripts/hours/based-on-the-first-month.js";
import "./src/scripts/hours/summary-of-teachers.js";
import "./src/scripts/other/other.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV?.trim() === "development";

let mainWindow;

ipcMain.on("window-action", (event, action) => {
  if (action === "minimize") {
    mainWindow.minimize();
  } else if (action === "close") {
    mainWindow.close();
  }
});

process.on("uncaughtException", (err) => {
  console.error("[EXCEPTION]", err);
});

function createWindow() {
  let windowWidth = 0;
  let windowHeight = 0;
  if (isDev) {
    windowWidth = 2000 + 4;
    windowHeight = 1000 + 4;
  } else {
    windowWidth = 1000 + 4;
    windowHeight = 600 + 4;
  }

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    frame: false,
    resizable: false,
    transparent: true,
    icon: path.join(__dirname, "public/icon.ico"),
    webPreferences: {
      backgroundThrottling: false,
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  if (isDev) {
    console.log("================(Development mode)================");
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.once("did-finish-load", () => {
      mainWindow.webContents.openDevTools({ mode: "right" });
    });

    // Context menu handling
    mainWindow.webContents.on("context-menu", (event, params) => {
      const menu = Menu.buildFromTemplate([
        {
          label: "Inspect the element",
          click: () => {
            mainWindow.webContents.openDevTools({ mode: "right" });
            setTimeout(() => {
              mainWindow.webContents.inspectElement(params.x, params.y);
            }, 100);
          },
        },
        {
          label: "Reload the interface",
          click: () => {
            mainWindow.webContents.reload();
          },
        },
        {
          label: "Restart the program",
          click: () => {
            const restartFile = path.join(__dirname, "restart.flag");
            fs.writeFileSync(restartFile, Date.now().toString());
          },
        },
      ]);

      menu.popup();
    });
  } else if (process.env.E2E_TEST === 'true') {
    mainWindow.loadFile(path.join(__dirname, "dist-vite", "index.html"));
  } else {
    mainWindow.loadFile(path.join(__dirname, "dist", "index.html"));
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
