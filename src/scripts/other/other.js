import { ipcMain, BrowserWindow, app, clipboard } from "electron";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { startBackendFunc } from "../utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pathStart = path.resolve(__dirname, "../start.exe");

// Глобальные переменные перенесены наверх для безопасного доступа из любой функции
const htmlQueue = [];
let isProcessing = false;
let isDialogOpen = false;
let excelMonitorInterval = null;
let lastClipboardText = '';

// === Вызов C# EXE вместо нативного диалога Electron ===
async function spawnCustomSaveDialog(defaultName) {
  isDialogOpen = true;

  return new Promise((resolve) => {
    const exePath = path.join(__dirname, "CustomSaveDialog.exe"); 
    const child = spawn(exePath, [defaultName]);
    let output = "";

    child.stdout.on("data", (data) => output += data.toString('utf8'));
    child.stderr.on("data", (data) => console.error(`C# Dialog Error: ${data}`));

    child.on("close", (code) => {
      isDialogOpen = false;
      try {
        const result = JSON.parse(output.trim());
        resolve(result);
      } catch (e) {
        console.error("Ошибка парсинга ответа от EXE. Вывод:", output);
        resolve({ canceled: true });
      }
    });
  });
}

// === Прямой экспорт через скрытый экземпляр Excel (PowerShell) ===
async function renderAndTransform(html, finalPath, scale = 5) {
  try {
    const tempImgPath = path.join(app.getPath("temp"), `excel-temp-img-${Date.now()}.png`);
    
    // PowerShell-скрипт (ПОЛНОСТЬЮ НА АНГЛИЙСКОМ)
    const psScript = `
      param([string]$savePath, [double]$scale)
      
      [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
      
      $hiddenExcel = $null

      try {
          # 1. Берем АКТИВНЫЙ Excel пользователя только для копирования
          $activeExcel = [System.Runtime.InteropServices.Marshal]::GetActiveObject("Excel.Application")
          
          $sel = $activeExcel.Selection
          if ($null -eq $sel) { throw "No selection in active Excel." }

          # Копируем вектор
          [void]$sel.CopyPicture(1, -4147)

          $baseW = $sel.Width
          $baseH = $sel.Height
          $maxDim = 8000
          $limitTriggered = $false

          if ($baseW * $scale -gt $maxDim) {
              $scale = $maxDim / $baseW
              $limitTriggered = $true
          }
          if ($baseH * $scale -gt $maxDim) {
              $newScale = $maxDim / $baseH
              if ($newScale -lt $scale) {
                  $scale = $newScale
                  $limitTriggered = $true
              }
          }

          if ($limitTriggered) {
              $scale = [Math]::Floor($scale / 0.5) * 0.5
              if ($scale -le 0) { $scale = 0.5 }
          }

          $w = $baseW * $scale
          $h = $baseH * $scale

          # 2. Создаем НОВЫЙ, ПОЛНОСТЬЮ СКРЫТЫЙ экземпляр Excel
          $hiddenExcel = New-Object -ComObject Excel.Application
          $hiddenExcel.Visible = $false
          $hiddenExcel.DisplayAlerts = $false

          # Вся работа с книгами идет в невидимке
          $tempWb = $hiddenExcel.Workbooks.Add()
          $tempWs = $tempWb.Sheets.Item(1)

          $chartObj = $tempWs.ChartObjects().Add(0, 0, $w, $h)
          $chart = $chartObj.Chart
          
          $chartObj.Border.LineStyle = -4142

          $chartObj.Activate()
          $chart.ChartArea.Select()

          Start-Sleep -Milliseconds 300

          $pasted = $false
          $retryCount = 0
          while (-not $pasted -and $retryCount -lt 10) {
              try {
                  [void]$chart.Paste()
                  $pasted = $true
              } catch {
                  Start-Sleep -Milliseconds 200
                  $retryCount++
              }
          }

          if (-not $pasted) {
              throw "Failed to paste image into hidden chart."
          }

          if ($chart.Shapes.Count -gt 0) {
              $shape = $chart.Shapes.Item(1)
              $shape.LockAspectRatio = $false
              $shape.Left = 0
              $shape.Top = 0
              $shape.Width = $w
              $shape.Height = $h
          }

          $chart.Export($savePath, "PNG")

          $tempWb.Close($false)
          
          Write-Host "SUCCESS"
      } catch {
          Write-Host "ERROR: $($_.Exception.Message)"
          exit 1
      } finally {
          # 3. ЖЕСТКАЯ ОЧИСТКА: Убиваем скрытый процесс
          if ($hiddenExcel) {
              $hiddenExcel.Quit()
              [System.Runtime.InteropServices.Marshal]::ReleaseComObject($hiddenExcel) | Out-Null
              
              [System.GC]::Collect()
              [System.GC]::WaitForPendingFinalizers()
          }
      }
    `;

    // Сохраняем скрипт во временный файл
    const tempScriptPath = path.join(app.getPath("temp"), `export-excel-${Date.now()}.ps1`);
    fs.writeFileSync(tempScriptPath, '\ufeff' + psScript, "utf8");

    // Запускаем PowerShell
    await new Promise((resolve, reject) => {
      const ps = spawn("powershell.exe", [
        "-ExecutionPolicy", "Bypass",
        "-NoProfile",
        "-File", tempScriptPath,
        "-savePath", tempImgPath,
        "-scale", scale.toString()
      ]);

      let output = "";
      ps.stdout.on("data", data => output += data.toString());
      ps.stderr.on("data", data => console.error("PS Error:", data.toString()));

      ps.on("close", code => {
        if (code === 0 && output.includes("SUCCESS")) {
          resolve(true);
        } else {
          reject(new Error("Ошибка выполнения макроса PowerShell: " + output));
        }
      });
    });

    // Удаляем временный ps1 скрипт
    fs.unlink(tempScriptPath, () => {});

    // === НОВОЕ: Очистка буфера обмена ОС ===
    clipboard.clear();
    lastClipboardText = ''; // Сбрасываем кэш монитора

    // Вызываем Python бекенд для дальнейшей обработки
    await startBackendFunc({
      id: "other--other--screenshot--transform",
      tempPath: tempImgPath,
      finalPath: finalPath
    });

    // Удаляем временную картинку
    fs.unlink(tempImgPath, () => {});
    console.log("Изображение успешно создано напрямую из скрытого Excel:", finalPath);

  } catch (err) {
    console.error("Ошибка обработки (PowerShell/Python):", err);
  }
}

// === Обработка очереди ===
async function processQueue() {
  if (isProcessing) return;
  isProcessing = true;

  while (htmlQueue.length > 0) {
    const html = htmlQueue.shift();

    while (isDialogOpen) await new Promise(r => setTimeout(r, 100));

    const defaultName = `Скриншот.png`;
    
    // Вызываем EXE
    const dialogResult = await spawnCustomSaveDialog(defaultName);

    // Обрабатываем ответ
    if (dialogResult.path && !dialogResult.canceled) {
      await renderAndTransform(html, dialogResult.path, dialogResult.scale);
    } else {
      console.log("⏹ Сохранение отменено пользователем.");
    }
  }

  isProcessing = false;
}

// === Мониторинг буфера обмена ===
function startExcelMonitor(intervalMs = 800) { 
  if (excelMonitorInterval) return;
  
  excelMonitorInterval = setInterval(() => {
    try {
      const currentText = clipboard.readText();

      if (currentText && currentText !== lastClipboardText) {
        lastClipboardText = currentText;

        setTimeout(() => {
          const formats = clipboard.availableFormats();
          
          if (formats.includes('text/html')) {
            const rawBuffer = clipboard.readBuffer('HTML Format');
            const rawHtml = rawBuffer ? rawBuffer.toString('utf8') : '';
            
            const htmlString = rawHtml || clipboard.readHTML() || '';

            if (htmlString && htmlString.indexOf('<html') !== -1) {
              const htmlStartIndex = htmlString.indexOf('<html');
              const currentHtml = htmlString.substring(htmlStartIndex);

              const isFromExcel = (
                /<td[^>]*class=['"]?xl/i.test(currentHtml) ||
                currentHtml.includes("mso-") ||
                currentHtml.includes("msohtmlclip") ||
                currentHtml.includes("urn:schemas-microsoft-com:office:excel") ||
                currentHtml.includes("Excel.Sheet")
              );

              if (isFromExcel) {
                htmlQueue.push(currentHtml);
                processQueue();
              }
            }
          }
        }, 400); 
      }
    } catch (err) {
      console.error('Критическая ошибка буфера:', err);
    }
  }, intervalMs);
}

async function screenshotMode(isMode) {
  if (isMode) {
    startExcelMonitor(1000);
  } else if (excelMonitorInterval) {
    clearInterval(excelMonitorInterval);
    excelMonitorInterval = null;
    lastClipboardText = ''; // Сбрасываем кэш при выключении режима
  }
}

// === IPC ===
ipcMain.handle("screenshotMode", async (event, isMode) => {
  screenshotMode(isMode);
});

// На случай ручной отправки html
ipcMain.on("excel-html", async (event, html) => {
  htmlQueue.push(html);
  processQueue();
});