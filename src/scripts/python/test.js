import { spawn } from 'child_process';
import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Указываем пути к файлам. Если скрипт лежит в другой папке, поправь относительные пути
const startPyPath = path.resolve(__dirname, './start.py');
const dataJsonPath = path.resolve(__dirname, './test_data.json');
const up2Mock = path.resolve(__dirname, '../../../'); // Заглушка для sys.argv[1]

// Читаем тестовые данные (может быть как один объект info, так и массив объектов)
let testData;
try {
    const rawData = fs.readFileSync(dataJsonPath, 'utf8');
    testData = JSON.parse(rawData);
} catch (err) {
    console.error('❌ Ошибка чтения data.json:', err.message);
    process.exit(1);
}

// 1. Запускаем сервер напрямую через python (не exe)
// Убедись, что 'python' прописан в PATH (в Windows обычно так).
const pyProcess = spawn('py', [startPyPath, up2Mock], { cwd: __dirname });

const rl = readline.createInterface({
    input: pyProcess.stdout,
    terminal: false
});

// 3. Выводим в консоль всё, что возвращает сервер
rl.on('line', (line) => {
    console.log('\n[SERVER OUT] ➔', line);
    try {
        const parsed = JSON.parse(line);
        console.log('📦 Распарсенный JSON:', JSON.stringify(parsed, null, 2));
    } catch (e) {
        // Если сервер вернул обычный print(), игнорируем ошибку парсинга
    }
});

pyProcess.stderr.on('data', (data) => {
    console.error('\n[SERVER ERROR] ➔', data.toString());
});

pyProcess.on('close', (code) => {
    console.log(`\n🛑 Сервер завершил работу с кодом ${code}`);
    process.exit(code);
});

// 2. Отсылаем данные из data.json
// Приводим данные к массиву, чтобы было удобно гонять сразу пачку тестов
const requests = Array.isArray(testData) ? testData : [testData];

requests.forEach((data, index) => {
    const reqId = index + 1;
    
    // Оборачиваем в конверт
    const payloadObj = {
        reqId: reqId,
        isTest: true,
        data: data
    };
    
    const payload = JSON.stringify(payloadObj) + '\n';
    
    // Отправляем запросы с небольшой задержкой на случай массива данных
    setTimeout(() => {
        console.log(`\n📤 Отправка запроса #${reqId}...`);
        pyProcess.stdin.write(payload);
    }, index * 500); 
});