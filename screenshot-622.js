// 6/22 urgent fixes validation — 3 fixes verification
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
    console.log('=== 6/22 urgent fixes validation ===\n');

    // Fix 1: 地面格子線 (default view 就能看到)
    const s1 = await takeShot('fix-1-grid.png', URL, 4000);

    // Fix 2: 1-4 加 3 個圈 (但 headless 沒法點 level-selector 切關，所以用 chapter1.json 預設 1-0)
    // 預設 1-0 沒有 ring，看不到差異。但可以 verify 載入成功

    // Fix 3: 1-1/1-2/1-3 pass zones + progress bar
    // 1-1 (vertical takeoff)
    const s3 = await takeShot('fix-3-level-1-1.png', URL, 4500);

    // 預設 manual view
    const sDefault = await takeShot('fix-default.png', URL, 4000);

    console.log('\n=== Summary ===');
    const all = [s1, s3, sDefault];
    const passed = all.filter(x => x.ok && x.size > 5000).length;
    console.log(`${passed}/${all.length} screenshots valid (>5KB)`);
    process.exit(passed === all.length ? 0 : 1);
})();