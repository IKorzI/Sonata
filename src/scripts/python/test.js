import { spawn } from 'child_process';
import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const startPyPath = path.resolve(__dirname, './start.py');
const dataJsonPath = path.resolve(__dirname, './test_data.json');
const up2Mock = path.resolve(__dirname, '../../../');

let testData;
try {
    const rawData = fs.readFileSync(dataJsonPath, 'utf8');
    testData = JSON.parse(rawData);
} catch (err) {
    console.error('Error reading data.json:', err.message);
    process.exit(1);
}

const pyProcess = spawn('py', [startPyPath, up2Mock], { cwd: __dirname });

const rl = readline.createInterface({
    input: pyProcess.stdout,
    terminal: false
});

rl.on('line', (line) => {
    console.log('\n[SERVER OUT] ➔', line);
    try {
        const parsed = JSON.parse(line);
        console.log('Parsed JSON:', JSON.stringify(parsed, null, 2));
    } catch (e) {
        // If the server returned a regular print(), ignore the parsing error
    }
});

pyProcess.stderr.on('data', (data) => {
    console.error('\n[SERVER ERROR] ➔', data.toString());
});

pyProcess.on('close', (code) => {
    console.log(`\nThe server exited with the code: ${code}`);
    process.exit(code);
});

const requests = Array.isArray(testData) ? testData : [testData];

requests.forEach((data, index) => {
    const reqId = index + 1;
    
    const payloadObj = {
        reqId: reqId,
        isTest: true,
        data: data
    };
    
    const payload = JSON.stringify(payloadObj) + '\n';
    
    setTimeout(() => {
        console.log(`\nSending a request #${reqId}...`);
        pyProcess.stdin.write(payload);
    }, index * 500); 
});