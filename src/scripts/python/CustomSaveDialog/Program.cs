using System;
using System.Text;
using Microsoft.WindowsAPICodePack.Dialogs;
using Microsoft.WindowsAPICodePack.Dialogs.Controls;

namespace CustomSaveDialog
{
    class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            Console.OutputEncoding = Encoding.UTF8;

            try
            {
                // Изменено имя по умолчанию на "Скриншот.png"
                string defaultName = args.Length > 0 ? args[0] : "Скриншот.png";

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
                    scaleComboBox.SelectedIndex = 4; // По умолчанию 5

                    CommonFileDialogGroupBox groupBox = new CommonFileDialogGroupBox("Качество (масштаб)");
                    groupBox.Items.Add(scaleComboBox);
                    dialog.Controls.Add(groupBox);

                    if (dialog.ShowDialog() == CommonFileDialogResult.Ok)
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
            }
            catch (Exception ex)
            {
                string escapedError = ex.Message.Replace("\\", "\\\\").Replace("\"", "\\\"");
                Console.WriteLine($"{{\"canceled\": true, \"error\": \"{escapedError}\"}}");
            }
        }
    }
}