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
        // Find the window by class name (XLMAIN is the main class of the Excel window)
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
                string defaultName = args.Length > 0 ? args[0] : "Screenshot.png";
                string dialogTitle = args.Length > 1 ? args[1] : "Save Excel screenshot";
                string qualityText = args.Length > 2 ? args[2] : "Quality (scale)";

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
                        dialog.Title = dialogTitle;
                        dialog.DefaultExtension = "png";
                        dialog.Filters.Add(new CommonFileDialogFilter("PNG Image", "*.png"));
                        dialog.DefaultFileName = defaultName;

                        CommonFileDialogComboBox scaleComboBox = new CommonFileDialogComboBox("scaleCombo");
                        for (int i = 1; i <= 10; i++)
                        {
                            scaleComboBox.Items.Add(new CommonFileDialogComboBoxItem(i.ToString()));
                        }
                        scaleComboBox.SelectedIndex = 4;

                        CommonFileDialogGroupBox groupBox = new CommonFileDialogGroupBox(qualityText);
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

                    // Hide the form BEFORE the process is complete
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
                // Find Excel and enter focus into it
                IntPtr excelWindow = FindWindow("XLMAIN", null);
                if (excelWindow != IntPtr.Zero)
                {
                    ForceForeground(excelWindow);
                    // This micro-delay prevents Electron from activating.
                    // It gives Windows time to process the focus change before the process dies.
                    Thread.Sleep(50);
                }
            }
        }
    }
}