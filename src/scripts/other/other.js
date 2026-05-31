import { ipcMain, BrowserWindow, app, clipboard, dialog } from "electron";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import { spawn, execSync } from "child_process";
import { startBackendFunc } from "../utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pathStart = path.resolve(__dirname, "../start.exe");

// Глобальные переменные управления состоянием
let isSaving = false;
let isDialogOpen = false;
let excelMonitorInterval = null;
let lastClipboardText = '';
let isExcelGloballyLocked = false; // НОВЫЙ ФЛАГ

// === Вызов C# EXE вместо нативного диалога Electron ===
async function spawnCustomSaveDialog(defaultName) {
  isDialogOpen = true;

  return new Promise((resolve) => {
    const exePath = path.join(__dirname, "CustomSaveDialog.exe"); 
    console.log("Попытка запуска EXE по пути:", exePath); // ЛОГ 1: Проверяем точный путь

    const child = spawn(exePath, [defaultName]);
    let output = "";

    child.stdout.on("data", (data) => output += data.toString('utf8'));
    
    // ЛОГ 2: Выводим системные ошибки самого процесса
    child.on("error", (spawnError) => {
      console.error("Критическая ошибка запуска процесса EXE:", spawnError);
    });

    child.stderr.on("data", (data) => {
      console.error(`C# Dialog Stderr Error: ${data.toString('utf8')}`);
    });

    child.on("close", (code) => {
      isDialogOpen = false;
      console.log(`Процесс EXE завершился с кодом: ${code}. Вывод:`, output.trim()); // ЛОГ 3
      
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

async function lockExcel() {
  return new Promise((resolve) => {
    const ps = spawn("powershell.exe", [
      "-NoProfile",
      "-Command",
      `try { $app = [System.Runtime.InteropServices.Marshal]::GetActiveObject("Excel.Application"); if ($app) { $app.Interactive = $false; Write-Host "LOCKED" } } catch { Write-Host "NO_EXCEL" }`
    ]);
    let output = "";
    ps.stdout.on("data", (data) => output += data.toString());
    ps.on("close", () => {
      const result = output.trim();
      if (result.includes("LOCKED")) {
        isExcelGloballyLocked = true; // Фиксируем успешную блокировку
      }
      resolve(result);
    });
  });
}

async function unlockExcel() {
  return new Promise((resolve) => {
    const ps = spawn("powershell.exe", [
      "-NoProfile",
      "-Command",
      `try { $app = [System.Runtime.InteropServices.Marshal]::GetActiveObject("Excel.Application"); if ($app) { $app.Interactive = $true } } catch {}`
    ]);
    ps.on("close", () => {
      isExcelGloballyLocked = false; // Снимаем флаг
      resolve();
    });
  });
}

// === Синхронная разблокировка для экстренного завершения ===
function emergencyUnlockExcelSync() {
  if (!isExcelGloballyLocked) return; 
  
  try {
    execSync(`powershell.exe -NoProfile -Command "try { $app = [System.Runtime.InteropServices.Marshal]::GetActiveObject('Excel.Application'); if ($app) { $app.Interactive = $true } } catch {}"`, { 
      stdio: 'ignore', // Игнорируем вывод, чтобы не засорять консоль при падении
      timeout: 3000    // Защита от зависания самого PowerShell
    });
    isExcelGloballyLocked = false;
    console.log("⚠️ Excel был экстренно разблокирован перед закрытием процесса.");
  } catch (err) {
    // Тихо глотаем ошибку, так как приложение уже в процессе краша
  }
}

// Функция для вывода окон MessageBox гарантированно поверх всех окон БЕЗ активации Electron
async function showTopMostMessageBox(options) {
  return new Promise((resolve) => {
    const isError = options.type === 'error';
    const icon = isError ? 'Error' : 'Information';
    
    // Очищаем строки от двойных кавычек и экранируем слэши для PowerShell
    const safeTitle = (options.title || '').replace(/"/g, "'");
    const safeMessage = (options.message || '').replace(/"/g, "'");
    const safeDetail = (options.detail || '').replace(/"/g, "'").replace(/\\/g, "\\\\");

    const script = `
      Add-Type -AssemblyName System.Windows.Forms;
      $msg = "${safeMessage}" + [Environment]::NewLine + [Environment]::NewLine + "${safeDetail}";
      [System.Windows.Forms.MessageBox]::Show($msg, "${safeTitle}", 0, [System.Windows.Forms.MessageBoxIcon]::${icon}, 0, [System.Windows.Forms.MessageBoxOptions]::ServiceNotification);
    `;

    const ps = spawn("powershell.exe", ["-NoProfile", "-Command", script]);
    ps.on("close", () => resolve());
  });
}

// === Экспорт выделенного диапазона ячеек с блокировкой Excel ===
async function renderAndTransform(finalPath, scale = 5) {
  const tempImgPath = path.join(app.getPath("temp"), `excel-temp-img-${Date.now()}.png`);
  const tempScriptPath = path.join(app.getPath("temp"), `export-excel-${Date.now()}.ps1`);
  let isExcelLocked = false;

  try {
    // PowerShell-скрипт с проверкой процесса и блокировкой ввода
    const psScript = `
      param([string]$savePath, [double]$scale)
      [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
      $hiddenExcel = $null
      $activeExcel = $null

      try {
          # Проверяем, запущен ли Excel
          try {
              $activeExcel = [System.Runtime.InteropServices.Marshal]::GetActiveObject("Excel.Application")
          } catch {
              Write-Host "NO_EXCEL"
              exit 0
          }

          if ($null -eq $activeExcel) {
              Write-Host "NO_EXCEL"
              exit 0
          }

          # БЛОКИРУЕМ интерфейс Excel для пользователя
          $activeExcel.Interactive = $false
          Write-Host "LOCKED"

          $sel = $activeExcel.Selection
          if ($null -eq $sel) { throw "No selection in active Excel." }

          # Копируем текущее выделение ячеек
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

          # Создаем полностью скрытый экземпляр Excel для рендеринга
          $hiddenExcel = New-Object -ComObject Excel.Application
          $hiddenExcel.Visible = $false
          $hiddenExcel.DisplayAlerts = $false

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

          if (-not $pasted) { throw "Failed to paste image into hidden chart." }

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
          if ($hiddenExcel) {
              $hiddenExcel.Quit()
              [System.Runtime.InteropServices.Marshal]::ReleaseComObject($hiddenExcel) | Out-Null
              [System.GC]::Collect()
              [System.GC]::WaitForPendingFinalizers()
          }
      }
    `;

    fs.writeFileSync(tempScriptPath, '\ufeff' + psScript, "utf8");

    // Запускаем PowerShell и ждем выполнения экспорта
    const psResult = await new Promise((resolve) => {
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
      ps.on("close", () => resolve(output));
    });

    // Проверка наличия Excel процесса после закрытия диалога
    if (psResult.includes("NO_EXCEL")) {
      console.log("⏹ Скрипт остановлен: активный процесс Excel не найден.");
      return; // Выходим молча, без вывода окон
    }

    if (psResult.includes("LOCKED")) {
      isExcelLocked = true;
    }

    if (!psResult.includes("SUCCESS")) {
      throw new Error("Ошибка выполнения экспорта в PowerShell: " + psResult);
    }

    // Вызываем Python бекенд для финального кадрирования/редактирования
    await startBackendFunc({
      id: "other--other--screenshot--transform",
      tempPath: tempImgPath,
      finalPath: finalPath
    });

    console.log("Изображение успешно создано:", finalPath);

    // Чистим временные файлы
    fs.unlink(tempScriptPath, () => {});
    fs.unlink(tempImgPath, () => {});

    // Очищаем буфер обмена
    clipboard.clear();
    lastClipboardText = '';

    // СНИМАЕМ БЛОКИРОВКУ с Excel, если она была установлена
    if (isExcelLocked) {
      await unlockExcel();
    }

    // Вывод сообщения об успехе, когда всё полностью готово
    await showTopMostMessageBox({
      type: 'info',
      title: 'Экспорт завершен',
      message: 'Изображение успешно сохранено!',
      detail: `Файл сохранен по пути:\n${finalPath}`,
      buttons: ['OK']
    });

  } catch (err) {
    // Чистим временные файлы
    fs.unlink(tempScriptPath, () => {});
    fs.unlink(tempImgPath, () => {});

    // Очищаем буфер обмена
    clipboard.clear();
    lastClipboardText = '';

    // СНИМАЕМ БЛОКИРОВКУ с Excel, если она была установлена
    if (isExcelLocked) {
      await unlockExcel();
    }

    console.error("Критическая ошибка цепочки сохранения:", err);
    await showTopMostMessageBox({
      type: 'error',
      title: 'Ошибка',
      message: 'Не удалось сохранить изображение',
      detail: err.message,
      buttons: ['OK']
    });
  }
}

// === Мониторинг буфера обмена ===
function startExcelMonitor(intervalMs = 800) { 
  if (excelMonitorInterval) return;
  
  excelMonitorInterval = setInterval(() => {
    try {
      // Если процесс сохранения уже идет, полностью игнорируем триггеры
      if (isSaving) return;

      const currentText = clipboard.readText();

      if (currentText && currentText !== lastClipboardText) {
        lastClipboardText = currentText;

        setTimeout(async () => {
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
                isSaving = true;
                let isLockedBeforeDialog = false; // Флаг контроля блокировки
                
                try {
                  // 1. Блокируем Excel ДО появления окна
                  const lockStatus = await lockExcel();
                  if (lockStatus.includes("NO_EXCEL")) {
                    console.log("⏹ Excel закрыт или недоступен.");
                    return; // Блок finally сбросит isSaving
                  }
                  isLockedBeforeDialog = true;

                  // 2. Вызываем окно сохранения
                  const defaultName = `Скриншот.png`;
                  const dialogResult = await spawnCustomSaveDialog(defaultName);

                  if (dialogResult.path && !dialogResult.canceled) {
                    // Передаем эстафету функции сохранения (она САМА снимет блокировку в конце)
                    await renderAndTransform(dialogResult.path, dialogResult.scale);
                    isLockedBeforeDialog = false; // Снимаем ответственность с этого блока
                  } else {
                    console.log("⏹ Сохранение отменено пользователем.");
                  }
                } catch (dialogErr) {
                  console.error("Ошибка диалогового окна:", dialogErr);
                } finally {
                  // Если пользователь нажал "Отмена" или произошла ошибка до вызова renderAndTransform
                  if (isLockedBeforeDialog) {
                    await unlockExcel();
                  }
                  isSaving = false;
                }
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
    lastClipboardText = '';
    isSaving = false;
  }
}

// === IPC ===
ipcMain.handle("screenshotMode", async (event, isMode) => {
  screenshotMode(isMode);
});

// Ручной вызов (адаптирован под новые условия синхронности)
ipcMain.on("excel-html", async (event, html) => {
  if (isSaving) return;
  isSaving = true;
  let isLockedBeforeDialog = false;
  
  try {
    const lockStatus = await lockExcel();
    if (lockStatus.includes("NO_EXCEL")) return;
    isLockedBeforeDialog = true;

    const dialogResult = await spawnCustomSaveDialog(`Скриншот.png`);
    if (dialogResult.path && !dialogResult.canceled) {
      await renderAndTransform(dialogResult.path, dialogResult.scale);
      isLockedBeforeDialog = false;
    }
  } finally {
    // Разблокировка в случае отмены диалогового окна
    if (isLockedBeforeDialog) {
      await unlockExcel();
    }
    isSaving = false;
  }
});

// 1. Необработанные исключения в коде Node.js (самые частые причины крашей)
process.on("uncaughtException", (error) => {
  console.error("🔥 Критическая ошибка (uncaughtException):", error);
  emergencyUnlockExcelSync();
  process.exit(1); // Принудительно завершаем с кодом ошибки
});

process.on("unhandledRejection", (reason) => {
  console.error("🔥 Необработанный Promise:", reason);
  emergencyUnlockExcelSync();
  process.exit(1); 
});

// 2. Сигналы прерывания системы (закрытие через Диспетчер задач, Ctrl+C в консоли)
["SIGINT", "SIGTERM", "SIGQUIT"].forEach((signal) => {
  process.on(signal, () => {
    emergencyUnlockExcelSync();
    process.exit(0);
  });
});

// 3. Штатное закрытие Electron приложения
app.on("before-quit", () => {
  emergencyUnlockExcelSync();
});