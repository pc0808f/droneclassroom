// T-102 headless validation — 9 action blocks
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:3000/';
const OUT = 'C:\\github\\droneclassroom\\screenshots';

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

function takeShot(name, url, waitMs = 4000) {
    return new Promise((resolve) => {
        const file = path.join(OUT, name);
        const args = [
            '--headless',
            '--disable-gpu',
            '--no-sandbox',
            '--hide-scrollbars',
            '--window-size=1280,800',
            `--virtual-time-budget=${waitMs}`,
            `--screenshot=${file}`,
            url,
        ];
        const proc = spawn(CHROME, args, { stdio: 'ignore' });
        proc.on('exit', (code) => {
            const ok = code === 0 && fs.existsSync(file);
            const size = ok ? fs.statSync(file).size : 0;
            console.log(`[${ok ? 'OK' : 'FAIL'}] ${name} (${size} bytes) exit=${code}`);
            resolve({ name, ok, file, size });
        });
        proc.on('error', (err) => {
            console.log(`[ERROR] ${name}: ${err.message}`);
            resolve({ name, ok: false });
        });
    });
}

(async () => {
    console.log('=== T-102 headless validation ===\n');

    // 1. 預設 manual，無 Blockly
    const s1 = await takeShot('t102-1-default-manual.png', URL, 4000);

    // 2. 切到 program，顯示 9 個 blocks 的 toolbox
    const s2 = await takeShot('t102-2-program-9blocks.png', URL + '?mode=program', 5000);

    // 3. 執行程式 (starter = takeoff 8 → forward 2 → rotateCW 90 → land)
    const s3 = await takeShot('t102-3-program-mid.png', URL + '?mode=program&autorun', 3500);

    // 4. 程式執行到尾
    const s4 = await takeShot('t102-4-program-end.png', URL + '?mode=program&autorun', 7000);

    // 5. level 1-5 + program
    const s5 = await takeShot('t102-5-level-1-5.png', URL + '?mode=program', 5000);

    console.log('\n=== Summary ===');
    const all = [s1, s2, s3, s4, s5];
    const passed = all.filter(x => x.ok && x.size > 5000).length;
    console.log(`${passed}/${all.length} screenshots valid (>5KB)`);
    process.exit(passed === all.length ? 0 : 1);
})();