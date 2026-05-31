using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Forms;
using Microsoft.WindowsAPICodePack.Dialogs;
using Microsoft.WindowsAPICodePack.Dialogs.Controls;

namespace CustomSaveDialog
{
    class Program
    {
        // Ищем окно по имени класса (XLMAIN - это главный класс окна Excel)
        [DllImport("user32.dll", SetLastError = true)]
        static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        static extern bool SetForegroundWindow(IntPtr hWnd);

        [DllImport("user32.dll")]
        static extern IntPtr GetForegroundWindow();

        [DllImport("user32.dll", SetLastError = true)]
        static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

        [DllImport("kernel32.dll")]
        static extern uint GetCurrentThreadId();

        [DllImport("user32.dll")]
        static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);

        static void ForceForeground(IntPtr hWnd)
        {
            if (hWnd == IntPtr.Zero) return;
            IntPtr foreWindow = GetForegroundWindow();
            if (foreWindow == hWnd) return;

            uint dummyProcessId;
            uint foreThread = GetWindowThreadProcessId(foreWindow, out dummyProcessId);
            uint appThread = GetCurrentThreadId();

            if (foreThread != appThread)
            {
                AttachThreadInput(foreThread, appThread, true);
                SetForegroundWindow(hWnd);
                AttachThreadInput(foreThread, appThread, false);
            }
            else
            {
                SetForegroundWindow(hWnd);
            }
        }

        [STAThread]
        static void Main(string[] args)
        {
            Console.OutputEncoding = Encoding.UTF8;

            try
            {
                string defaultName = args.Length > 0 ? args[0] : "Скриншот.png";

                using (Form topMostForm = new Form())
                {
                    topMostForm.Size = new System.Drawing.Size(1, 1);
                    topMostForm.ShowInTaskbar = false;
                    topMostForm.StartPosition = FormStartPosition.CenterScreen;
                    topMostForm.FormBorderStyle = FormBorderStyle.None;
                    topMostForm.Opacity = 0.0;
                    topMostForm.TopMost = true;
                    topMostForm.Show();

                    ForceForeground(topMostForm.Handle);

                    using (CommonSaveFileDialog dialog = new CommonSaveFileDialog())
                    {
                        dialog.Title = "Сохранить скриншот Excel";
                        dialog.DefaultExtension = "png";
                        dialog.Filters.Add(new CommonFileDialogFilter("PNG Image", "*.png"));
                        dialog.DefaultFileName = defaultName;

                        CommonFileDialogComboBox scaleComboBox = new CommonFileDialogComboBox("scaleCombo");
                        for (int i = 1; i <= 10; i++)
                        {
                            scaleComboBox.Items.Add(new CommonFileDialogComboBoxItem(i.ToString()));
                        }
                        scaleComboBox.SelectedIndex = 4;

                        CommonFileDialogGroupBox groupBox = new CommonFileDialogGroupBox("Качество (масштаб)");
                        groupBox.Items.Add(scaleComboBox);
                        dialog.Controls.Add(groupBox);

                        if (dialog.ShowDialog(topMostForm.Handle) == CommonFileDialogResult.Ok)
                        {
                            int scale = scaleComboBox.SelectedIndex + 1;
                            string escapedPath = dialog.FileName.Replace("\\", "\\\\").Replace("\"", "\\\"");
                            Console.WriteLine($"{{\"canceled\": false, \"path\": \"{escapedPath}\", \"scale\": {scale}}}");
                        }
                        else
                        {
                            Console.WriteLine("{\"canceled\": true}");
                        }
                    }

                    // Прячем форму ДО того, как процесс завершится
                    topMostForm.Hide();
                }
            }
            catch (Exception ex)
            {
                string escapedError = ex.Message.Replace("\\", "\\\\").Replace("\"", "\\\"");
                Console.WriteLine($"{{\"canceled\": true, \"error\": \"{escapedError}\"}}");
            }
            finally
            {
                // Находим Excel и вбиваем фокус в него
                IntPtr excelWindow = FindWindow("XLMAIN", null);
                if (excelWindow != IntPtr.Zero)
                {
                    ForceForeground(excelWindow);
                    // Эта микро-задержка предотвращает активацию Electron
                    // Она дает Windows время обработать смену фокуса до смерти процесса
                    Thread.Sleep(50);
                }
            }
        }
    }
}