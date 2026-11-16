// 3D 장면의 무게를 잰다(지시서 4.1의 5, polish 갈래). 사용:
//   node tools/test/perf3d.js [--beats] [--shots <폴더>] [--file <미리보기.html>] [--quality <0~3>] [--json <파일>] [장면들...]
// 장면마다 도착 화면과 지켜보기에서 한 화면의 그리기 호출 수(calls, 그림자·후처리 포함), 삼각형 수(tris), 기하·텍스처 수, 초당 장면 수(fps)를 잰다.
//   --beats  지켜보기의 모든 대목을 차례로 재고(대목마다 게임 시간 6초 동안 여러 번), 가장 무거운 값을 낸다. 없으면 첫 대목만.
//   --shots  도착 화면과 대목마다 화면을 찍는다(고치기 전·후를 같은 게임 시각에 찍어 견주려고). 파일 이름: <장면>-arrive.png, <장면>-b<대목>.png
//   --file   다른 미리보기 파일로 잰다(고치기 전 판과 견줄 때).
// 이 컴퓨터는 GPU 없이 그리므로 fps의 절대값은 휴대폰과 다르다. 같은 조건에서 호렙 산과 견주는 데만 쓴다.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const enter3d = require('./lib/enter.js');
const argv = process.argv.slice(2), opt = { beats: false, shots: null, file: '/home/user/bible_onyou/dist/preview3d.html', quality: null, json: null }, ids = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--beats') opt.beats = true;
  else if (argv[i] === '--shots') opt.shots = argv[++i];
  else if (argv[i] === '--file') opt.file = path.resolve(argv[++i]);
  else if (argv[i] === '--quality') opt.quality = Number(argv[++i]);
  else if (argv[i] === '--json') opt.json = argv[++i];
  else ids.push(argv[i]);
}
if (!ids.length) ids.push('OT-09', 'OT-18', 'OT-11', 'OT-26', 'OT-19', 'OT-30', 'OT-03', 'OT-13', 'OT-05', 'OT-21', 'OT-36', 'OT-39');
if (opt.shots) fs.mkdirSync(opt.shots, { recursive: true });
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const rows = [];
  for (const id of ids) {
    const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })).newPage();
    const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    await p.addInitScript(() => { window.BO3D_TEST = true; });
    await p.goto('file://' + opt.file + '#fps'); await p.waitForTimeout(2500);
    const fps = () => p.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); function f() { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else res(Math.round(n / ((performance.now() - t0) / 1000) * 10) / 10); } requestAnimationFrame(f); }));
    const info = () => p.evaluate(() => BO3D.debug.render());
    const simNow = () => p.evaluate(() => (BO3D.debug.now ? BO3D.debug.now() : -1));
    const shot = async (name) => { if (opt.shots) await p.screenshot({ path: path.join(opt.shots, id + '-' + name + '.png') }); };
    /* 게임 시간으로 sec초가 흐를 때까지 기다리며 그동안 가장 무거운 값을 모은다(게임 시각을 모르는 옛 판은 실제 시간으로) */
    const watch = async (sec) => {
      const t0 = await simNow(), r0 = Date.now(), w = { calls: 0, tris: 0 };
      for (let k = 0; k < 400; k++) {
        const r = await info(); if (r.calls > w.calls) w.calls = r.calls; if (r.tris > w.tris) w.tris = r.tris; w.geo = r.geo; w.tex = r.tex; if (r.glow !== undefined) w.glow = Math.max(w.glow || 0, r.glow);
        const t = await simNow();
        if (t0 >= 0 ? t - t0 >= sec : Date.now() - r0 >= sec * 1000) break;
        if (Date.now() - r0 > 90000) break;
        await p.waitForTimeout(250);
      }
      return w;
    };
    try {
      await enter3d(p, 1, id);
      if (id === 'OT-09') { await p.waitForTimeout(600); await p.click('.route-opts .btn:has-text("모세")'); }   /* 호렙 산은 시대 추리(누구를 만나러 가나)를 거친다(walk3d.js와 같게) */
      await p.waitForSelector('text=출발하자', { timeout: 60000 });
      if (opt.quality !== null) await p.evaluate((q) => BO3D.debug.quality && BO3D.debug.quality(q, false), opt.quality);
      await p.click('text=출발하자'); await p.waitForTimeout(800);
      await p.evaluate(() => { const o = document.querySelector('.overlay3'); if (o) o.hidden = true; });
      await p.waitForTimeout(1500);
      const a = Object.assign({ fps: await fps() }, await info());
      await shot('arrive');
      let e = null; const beats = [];
      try {   /* 지켜보기(호렙 산은 압도 장면 영상을 거쳐 늦게 열린다) */
        await p.evaluate(() => BO3D.debug.lookup());
        await p.waitForSelector('.panel3:not([hidden])', { timeout: 90000 }); await p.waitForTimeout(3000);
        e = Object.assign({ fps: await fps() }, await info());
        if (opt.beats || opt.shots) {
          const sc = await p.evaluate(() => { const s = BO3D.debug.scene(); return { e0: s.eventStart, n: BO3D.ot && BO3D.ot.scenes[s.id] ? BO3D.ot.scenes[s.id].beats.length : 0 }; });
          const canJump = await p.evaluate(() => !!BO3D.debug.beat);
          for (let i = sc.e0; i < sc.n && canJump; i++) {
            await p.evaluate((k) => BO3D.debug.beat(k), i);
            const w = await watch(6);
            await shot('b' + i);
            const w2 = opt.beats ? await watch(8) : w;   /* 긴 움직임(걸어가기, 무너짐)의 뒤쪽도 본다 */
            if (opt.beats) await shot('b' + i + 'x');
            beats.push({ i, calls: Math.max(w.calls, w2.calls), tris: Math.max(w.tris, w2.tris), glow: Math.max(w.glow || 0, w2.glow || 0) });
          }
        }
      } catch (x) { if (!e) e = null; else console.log(id, '대목 재기 중 멈춤:', x.message.split('\n')[0]); }
      const worst = beats.reduce((m, x) => (x.calls > m.calls ? x : m), { calls: 0, tris: 0, i: -1 });
      rows.push({ id, a, e, beats, worst, errs: errs.length });
      console.log(id, '도착', JSON.stringify(a), '지켜보기', e ? JSON.stringify(e) : '(재지 못함)', beats.length ? '대목별 calls ' + beats.map((x) => x.i + ':' + x.calls).join(' ') + ' 삼각형 최대 ' + Math.max(...beats.map((x) => x.tris)) : '', '오류', errs.length, errs.slice(0, 3).join(' | '));
    } catch (x) { console.log(id, 'FAIL', x.message.split('\n')[0]); rows.push({ id, fail: x.message.split('\n')[0] }); }
    await p.context().close();
  }
  const base = rows.find((r) => r.id === 'OT-09' && r.a);
  if (base) {
    const ref = base.e || base.a, at = base.e ? '지켜보기' : '도착';
    console.log('\n호렙 산(' + at + ') 대비: 장면, calls 배, tris 배, fps 배 (각 장면의 큰 쪽 값)');
    rows.filter((r) => r.a).forEach((r) => { const w = r.e && r.e.calls > r.a.calls ? r.e : r.a; console.log(r.id, (w.calls / ref.calls).toFixed(2), (w.tris / ref.tris).toFixed(2), (w.fps / ref.fps).toFixed(2)); });
  }
  if (opt.json) fs.writeFileSync(opt.json, JSON.stringify(rows, null, 1));
  await b.close();
})();
