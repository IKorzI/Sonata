const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const XLSX = require('xlsx');

const XLSX_PATH = 'D:/test/1.xlsx';
const BAT_PATH = 'D:/test/1.bat';
const TMP_SCRIPT_PATH = 'D:/test/temp_runner.docbuilder';

function convertAllSheets() {
    try {
        console.log('Анализ структуры файла XLSX...');
        const workbook = XLSX.readFile(XLSX_PATH, { bookSheets: true });
        const sheetNames = workbook.SheetNames;
        
        console.log(`Найдено листов: ${sheetNames.length} (${sheetNames.join(', ')})`);

        sheetNames.forEach((sheetName) => {
            console.log(`Конвертация листа: "${sheetName}"...`);
            
            // Формируем чистый JS-код для ONLYOFFICE DocumentBuilder
            const builderContent = [
                'builder.OpenFile("D:/test/1.xlsx");',
                'var oSheets = Api.GetSheets();',
                'for (var i = 0; i < oSheets.length; i++) {',
                `    if (oSheets[i].GetName() === "${sheetName}") {`,
                '        oSheets[i].Active = true;',
                '        break;',
                '    }',
                '}',
                `builder.SaveFile("pdf", "D:/test/${sheetName}.pdf");`,
                'builder.CloseFile();'
            ].join('\n');

            // Записываем файл напрямую из Node.js (никаких проблем с кодировкой и % в BAT)
            fs.writeFileSync(TMP_SCRIPT_PATH, builderContent, 'utf8');
            
            // Вызываем батник (передавать аргумент больше не нужно, скрипт уже готов)
            execSync(`"${BAT_PATH}"`, { stdio: 'inherit', cwd: 'D:\\test' });
        });

        // Чистим за собой временный файл после окончания всего процесса
        if (fs.existsSync(TMP_SCRIPT_PATH)) {
            fs.unlinkSync(TMP_SCRIPT_PATH);
        }

        console.log('Вся книга успешно сконвертирована в отдельные PDF!');
    } catch (error) {
        console.error('Ошибка в процессе координации JS:', error.message);
    }
}

convertAllSheets();