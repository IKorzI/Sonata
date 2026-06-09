const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  onFromBackend: (callback) => ipcRenderer.on('fromBackend', callback),

  checkFileAccess: (filePath) => ipcRenderer.invoke('check-file-access', filePath),

  minimize: () => ipcRenderer.send('window-action', 'minimize'),
  close: () => ipcRenderer.send('window-action', 'close'),

  saveDialog: (fileName, extension) => ipcRenderer.invoke('save-dialog', fileName, extension),
  saveFile: (sourcePath, targetPath) => ipcRenderer.invoke('save-file', sourcePath, targetPath),
  findFileWithExtension: (dir, baseName) => ipcRenderer.invoke('findFileWithExtension', dir, baseName),

  sessionPackageGetInformation: (path) => ipcRenderer.invoke('sessionPackageGetInformation', path),
  sessionPackageDataSupplement: (data) => ipcRenderer.invoke('sessionPackageDataSupplement', data),

  sessionEmptyGetInformation: (path, type) => ipcRenderer.invoke('sessionEmptyGetInformation', path, type),
  sessionEmptyDataSupplement: (data) => ipcRenderer.invoke('sessionEmptyDataSupplement', data),

  sessionReportGetInformation: (path) => ipcRenderer.invoke('sessionReportGetInformation', path),
  sessionReportDataSupplement: (data) => ipcRenderer.invoke('sessionReportDataSupplement', data),

  sessionDebtorsGetInformation: (path) => ipcRenderer.invoke('sessionDebtorsGetInformation', path),
  sessionDebtorsDataSupplement: (data) => ipcRenderer.invoke('sessionDebtorsDataSupplement', data),

  hoursBasedGetInformation: (path) => ipcRenderer.invoke('hoursBasedGetInformation', path),
  hoursBasedDataSupplement: (data) => ipcRenderer.invoke('hoursBasedDataSupplement', data),
  
  hoursSummaryGetInformation: (path) => ipcRenderer.invoke('hoursSummaryGetInformation', path),
  hoursSummaryDataSupplement: (data) => ipcRenderer.invoke('hoursSummaryDataSupplement', data),

  startBackendFunc: (data) => ipcRenderer.invoke('startBackendFunc', data),

  screenshotMode: flag => ipcRenderer.invoke('screenshotMode', flag),
  onExcelHtml: callback => ipcRenderer.on('excel-html', (event, html) => callback(html)),
  sendToMain: (channel, data) => ipcRenderer.send(channel, data),
  otherNumDenStart: (data) => ipcRenderer.invoke('otherNumDenStart', data)
});

