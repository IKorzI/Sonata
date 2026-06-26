import { ipcMain, BrowserWindow, app, clipboard, dialog } from "electron";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import { spawn, execSync } from "child_process";
import { startBackendFunc } from "../utils.js";
import { lng } from "../language.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pathStart = path.resolve(__dirname, "../start.exe");

let isSaving = false;
let isDialogOpen = false;
let excelMonitorInterval = null;
let lastClipboardText = "";
let isExcelGloballyLocked = false;

async function spawnCustomSaveDialog(params) {
  if (process.env.E2E_TEST === "true") {
    return {
      canceled: false,
      path: path.join(__dirname, "..", "..", "..", "test", params.defaultName),
      scale: 2,
    };
  }

  isDialogOpen = true;

  return new Promise((resolve) => {
    // Using an external C# dialog instead of the standard dialog.showSaveDialog.
    // Allows bypassing potential native UI limitations and implementing specific window logic.
    const exePath = path.join(__dirname, "CustomSaveDialog.exe");

    const child = spawn(exePath, params);
    let output = "";

    child.stdout.on("data", (data) => (output += data.toString("utf8")));

    child.on("error", (spawnError) => {
      console.error("Error:", spawnError);
    });

    child.stderr.on("data", (data) => {
      console.error(`C# Dialog Stderr Error: ${data.toString("utf8")}`);
    });

    child.on("close", (code) => {
      isDialogOpen = false;
      console.log(`Exit with code: ${code}. Output:`, output.trim());

      try {
        const result = JSON.parse(output.trim());
        resolve(result);
      } catch (e) {
        console.error("Error parsing JSON. Output:", output);
        resolve({ canceled: true });
      }
    });
  });
}

async function lockExcel() {
  return new Promise((resolve) => {
    // Blocking user interaction with Excel via the COM object ($app.Interactive = $false).
    // Prevents accidental user clicks that could disrupt the copy/export process.
    const ps = spawn("powershell.exe", [
      "-NoProfile",
      "-Command",
      `try { $app = [System.Runtime.InteropServices.Marshal]::GetActiveObject('Excel.Application'); if ($app) { $app.Interactive = $false; Write-Host 'LOCKED' } } catch { Write-Host 'NO_EXCEL' }`,
    ]);
    let output = "";
    ps.stdout.on("data", (data) => (output += data.toString()));
    ps.on("close", () => {
      const result = output.trim();
      if (result.includes("LOCKED")) {
        isExcelGloballyLocked = true;
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
      `try { $app = [System.Runtime.InteropServices.Marshal]::GetActiveObject('Excel.Application'); if ($app) { $app.Interactive = $true } } catch {}`,
    ]);
    ps.on("close", () => {
      isExcelGloballyLocked = false;
      resolve();
    });
  });
}

function emergencyUnlockExcelSync() {
  if (!isExcelGloballyLocked) return;

  try {
    // A synchronous call (execSync) is critically necessary here.
    // This ensures that Excel unlocking completes before the Node.js process fully terminates (crashes).
    execSync(
      `powershell.exe -NoProfile -Command "try { $app = [System.Runtime.InteropServices.Marshal]::GetActiveObject('Excel.Application'); if ($app) { $app.Interactive = $true } } catch {}"`,
      {
        stdio: "ignore",
        timeout: 3000,
      },
    );
    isExcelGloballyLocked = false;
    console.log("Excel was urgently unlocked before closing the process.");
  } catch (err) {
    // Ignoring the error since the application is already in the process of crashing
  }
}

async function showTopMostMessageBox(options) {
  return new Promise((resolve) => {
    const isError = options.type === "error";
    const icon = isError ? "Error" : "Information";

    const safeTitle = (options.title || "").replace(/"/g, "'");
    const safeMessage = (options.message || "").replace(/"/g, "'");
    const safeDetail = (options.detail || "")
      .replace(/"/g, "'")
      .replace(/\\/g, "\\\\");

    const script = `
      Add-Type -AssemblyName System.Windows.Forms;
      $msg = "${safeMessage}" + [Environment]::NewLine + [Environment]::NewLine + "${safeDetail}";
      [System.Windows.Forms.MessageBox]::Show($msg, "${safeTitle}", 0, [System.Windows.Forms.MessageBoxIcon]::${icon}, 0, [System.Windows.Forms.MessageBoxOptions]::ServiceNotification);
    `;

    const ps = spawn("powershell.exe", ["-NoProfile", "-Command", script]);
    ps.on("close", () => resolve());
  });
}

async function renderAndTransform(finalPath, scale = 5) {
  const tempImgPath = path.join(
    app.getPath("temp"),
    `excel-temp-img-${Date.now()}.png`,
  );
  const tempScriptPath = path.join(
    app.getPath("temp"),
    `export-excel-${Date.now()}.ps1`,
  );
  let isExcelLocked = false;

  try {
    // The script uses a workaround for the Excel COM object:
    // copies the selection as a picture (CopyPicture), creates a temporary hidden chart (Chart),
    // pastes the picture into it, and exports it to the disk.
    const psScript = `
      param([string]$savePath, [double]$scale)
      [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
      $hiddenExcel = $null
      $activeExcel = $null

      try {
          try {
              $activeExcel = [System.Runtime.InteropServices.Marshal]::GetActiveObject('Excel.Application')
          } catch {
              Write-Host 'NO_EXCEL'
              exit 0
          }

          if ($null -eq $activeExcel) {
              Write-Host 'NO_EXCEL'
              exit 0
          }

          $activeExcel.Interactive = $false
          Write-Host 'LOCKED'

          $sel = $activeExcel.Selection
          if ($null -eq $sel) { throw 'No selection in active Excel.' }

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

          if (-not $pasted) { throw 'Failed to paste image into hidden chart.' }

          if ($chart.Shapes.Count -gt 0) {
              $shape = $chart.Shapes.Item(1)
              $shape.LockAspectRatio = $false
              $shape.Left = 0
              $shape.Top = 0
              $shape.Width = $w
              $shape.Height = $h
          }

          $chart.Export($savePath, 'PNG')
          $tempWb.Close($false)
          
          Write-Host 'SUCCESS'
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

    fs.writeFileSync(tempScriptPath, "\ufeff" + psScript, "utf8");

    const psResult = await new Promise((resolve) => {
      const ps = spawn("powershell.exe", [
        "-ExecutionPolicy",
        "Bypass",
        "-NoProfile",
        "-File",
        tempScriptPath,
        "-savePath",
        tempImgPath,
        "-scale",
        scale.toString(),
      ]);

      let output = "";
      ps.stdout.on("data", (data) => (output += data.toString()));
      ps.stderr.on("data", (data) =>
        console.error("PS Error:", data.toString()),
      );
      ps.on("close", () => resolve(output));
    });

    if (psResult.includes("NO_EXCEL")) {
      console.log("Script stopped: No active Excel process found..");
      return;
    }

    if (psResult.includes("LOCKED")) {
      isExcelLocked = true;
    }

    if (!psResult.includes("SUCCESS")) {
      throw new Error("Error executing export in PowerShell: " + psResult);
    }

    await startBackendFunc({
      id: "other--other--screenshot--transform",
      tempPath: tempImgPath,
      finalPath: finalPath,
    });

    fs.unlink(tempScriptPath, () => {});
    fs.unlink(tempImgPath, () => {});

    clipboard.clear();
    lastClipboardText = "";

    if (isExcelLocked) {
      await unlockExcel();
    }

    await showTopMostMessageBox({
      type: "info",
      title: lng.renderAndTransform.done.title,
      message: lng.renderAndTransform.done.message,
      detail: `${lng.renderAndTransform.done.detail}\n${finalPath}`,
      buttons: ["OK"],
    });
  } catch (err) {
    fs.unlink(tempScriptPath, () => {});
    fs.unlink(tempImgPath, () => {});

    clipboard.clear();
    lastClipboardText = "";

    if (isExcelLocked) {
      await unlockExcel();
    }

    console.error("Critical save chain error:", err);
    await showTopMostMessageBox({
      type: "error",
      title: lng.renderAndTransform.undone.title,
      message: lng.renderAndTransform.undone.message,
      detail: err.message,
      buttons: ["OK"],
    });
  }
}

function startExcelMonitor(intervalMs = 800) {
  if (excelMonitorInterval) return;

  excelMonitorInterval = setInterval(() => {
    try {
      if (isSaving) return;

      const currentText = clipboard.readText();

      if (currentText && currentText !== lastClipboardText) {
        lastClipboardText = currentText;

        setTimeout(async () => {
          const formats = clipboard.availableFormats();

          if (formats.includes("text/html")) {
            const rawBuffer = clipboard.readBuffer("HTML Format");
            const rawHtml = rawBuffer ? rawBuffer.toString("utf8") : "";
            const htmlString = rawHtml || clipboard.readHTML() || "";

            if (htmlString && htmlString.indexOf("<html") !== -1) {
              const htmlStartIndex = htmlString.indexOf("<html");
              const currentHtml = htmlString.substring(htmlStartIndex);

              // Heuristic check: trying to determine if the copied HTML belongs specifically to Excel,
              // by checking for the presence of specific classes and namespaces generated by MS Office.
              const isFromExcel =
                /<td[^>]*class=['"]?xl/i.test(currentHtml) ||
                currentHtml.includes("mso-") ||
                currentHtml.includes("msohtmlclip") ||
                currentHtml.includes(
                  "urn:schemas-microsoft-com:office:excel",
                ) ||
                currentHtml.includes("Excel.Sheet");

              if (isFromExcel) {
                isSaving = true;
                let isLockedBeforeDialog = false;

                try {
                  const lockStatus = await lockExcel();
                  if (lockStatus.includes("NO_EXCEL")) {
                    console.log("Excel is closed or unavailable.");
                    return;
                  }
                  isLockedBeforeDialog = true;

                  const defaultName = `${lng.customSaveDialog.defaultName}.png`;
                  const dialogTitle = lng.customSaveDialog.dialogTitle;
                  const qualityText = lng.customSaveDialog.qualityText;
                  const dialogResult = await spawnCustomSaveDialog([
                    defaultName,
                    dialogTitle,
                    qualityText,
                  ]);

                  if (dialogResult.path && !dialogResult.canceled) {
                    await renderAndTransform(
                      dialogResult.path,
                      dialogResult.scale,
                    );
                    isLockedBeforeDialog = false;
                  } else {
                    console.log("Save cancelled by user.");
                  }
                } catch (dialogErr) {
                  console.error("Dialog box error:", dialogErr);
                } finally {
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
      console.error("Critical buffer error:", err);
    }
  }, intervalMs);
}

async function screenshotMode(isMode) {
  if (isMode) {
    startExcelMonitor(1000);
  } else if (excelMonitorInterval) {
    clearInterval(excelMonitorInterval);
    excelMonitorInterval = null;
    lastClipboardText = "";
    isSaving = false;
  }
}

ipcMain.handle("screenshotMode", async (event, isMode) => {
  screenshotMode(isMode);
});

// Global error and OS signal handlers for guaranteed Excel unlocking.
process.on("uncaughtException", (error) => {
  console.error("Critical error (uncaughtException):", error);
  emergencyUnlockExcelSync();
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Raw Promise:", reason);
  emergencyUnlockExcelSync();
  process.exit(1);
});

["SIGINT", "SIGTERM", "SIGQUIT"].forEach((signal) => {
  process.on(signal, () => {
    emergencyUnlockExcelSync();
    process.exit(0);
  });
});

app.on("before-quit", () => {
  emergencyUnlockExcelSync();
});
