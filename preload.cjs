const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  onFromBackend: (callback) => ipcRenderer.on('fromBackend', callback),

  checkFileAccess: (filePath) => ipcRenderer.invoke('check-file-access', filePath),

  minimize: () => ipcRenderer.send("window-action", "minimize"),
  close: () => ipcRenderer.send("window-action", "close"),

  saveDialog: (fileName, extension) => ipcRenderer.invoke('save-dialog', fileName, extension),
  saveFile: (sourcePath, targetPath) => ipcRenderer.invoke('save-file', sourcePath, targetPath),
  findFileWithExtension: (dir, baseName) => ipcRenderer.invoke('findFileWithExtension', dir, baseName),

  sessionPackageGetInformation: (path) => ipcRenderer.invoke('sessionPackageGetInformation', path),
  sessionPackageDataSupplement: (info) => ipcRenderer.invoke('sessionPackageDataSupplement', info),

  sessionEmptyGetInformation: (path, type) => ipcRenderer.invoke('sessionEmptyGetInformation', path, type),
  sessionEmptyDataSupplement: (info) => ipcRenderer.invoke('sessionEmptyDataSupplement', info),

  sessionReportGetInformation: (path) => ipcRenderer.invoke('sessionReportGetInformation', path),
  sessionReportDataSupplement: (info) => ipcRenderer.invoke('sessionReportDataSupplement', info),

  sessionDebtorsGetInformation: (path) => ipcRenderer.invoke('sessionDebtorsGetInformation', path),
  sessionDebtorsDataSupplement: (info) => ipcRenderer.invoke('sessionDebtorsDataSupplement', info),

  hoursBasedGetInformation: (path) => ipcRenderer.invoke('hoursBasedGetInformation', path),
  hoursBasedDataSupplement: (data) => ipcRenderer.invoke('hoursBasedDataSupplement', data),
  
  hoursSummaryGetInformation: (path) => ipcRenderer.invoke('hoursSummaryGetInformation', path),
  hoursSummaryDataSupplement: (data) => ipcRenderer.invoke('hoursSummaryDataSupplement', data),

  startBackendFunc: (info) => ipcRenderer.invoke('startBackendFunc', info),

  screenshotMode: flag => ipcRenderer.invoke('screenshotMode', flag),
  onExcelHtml: callback => ipcRenderer.on("excel-html", (event, html) => callback(html)),
  sendToMain: (channel, data) => ipcRenderer.send(channel, data),
  otherNumDenStart: (info) => ipcRenderer.invoke('otherNumDenStart', info)
});

