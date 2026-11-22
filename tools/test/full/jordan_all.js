// 요단 강 시대 추리를 나이 단계 셋(t1, t2, t3)과 화면 둘(390x844, 390x664)에서 끝까지 점검한다.
// 사용: node tools/test/full/jordan_all.js <사진을 둘 폴더>
const { spawn } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const outRoot = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, 'dist/check/jordan-all');
const walk = path.join(__dirname, '..', 'walkJ.js');

const tiers = [
  { index: '0', id: 't1', label: '8~10세' },
  { index: '1', id: 't2', label: '11~13세' },
  { index: '2', id: 't3', label: '14~19세' },
];
const viewports = ['390x844', '390x664'];

const cases = [];
for (const tier of tiers) {
  for (const vp of viewports) {
    cases.push({ ...tier, vp });
  }
}

function runCase(c) {
  return new Promise((resolve) => {
    const outDir = path.join(outRoot, `${c.id}_${c.vp}`);
    const t0 = Date.now();
    const child = spawn(process.execPath, [walk, c.index, outDir], {
      env: { ...process.env, BO_VIEWPORT: c.vp, BO_CHECK_LAYOUT: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '', stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    const timer = setTimeout(() => { child.kill(); }, 8 * 60 * 1000);
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      const sec = Math.round((Date.now() - t0) / 1000);
      const expected = new RegExp(`^${c.id} shots: [1-9]\\d* .*no errors$`, 'm');
      const ok = code === 0 && !signal && expected.test(stdout);
      const summary = (stdout.trim().split(/\r?\n/).pop() || '').trim();
      console.log(`${ok ? '✅' : '❌'} 요단 강 ${c.label}(${c.id}) ${c.vp} · ${sec}초 · ${summary || stderr.trim()}`);
      if (!ok) {
        if (stdout) console.error(stdout.trim());
        if (stderr) console.error(stderr.trim());
      }
      resolve(ok);
    });
  });
}

(async () => {
  const results = [];
  const concurrency = 2;
  let idx = 0;
  async function worker() {
    while (idx < cases.length) {
      const c = cases[idx++];
      results.push(await runCase(c));
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  const passed = results.filter(Boolean).length;
  console.log(`jordan_all: ${passed}/${cases.length} passed`);
  process.exitCode = passed === cases.length ? 0 : 1;
})();
