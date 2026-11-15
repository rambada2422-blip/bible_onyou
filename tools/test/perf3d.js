// 3D 장면이 호렙 산보다 무거워지지 않았는지 비교한다(지시서 4.1의 5). 사용: node tools/test/perf3d.js [장면들...]
// 장면마다 도착 화면과 지켜보기 첫 대목에서 그리기 호출 수(calls), 삼각형 수(tris), 기하·텍스처 수, 초당 장면 수(fps)를 잰다.
// 이 컴퓨터는 GPU 없이 그리므로 fps의 절대값은 휴대폰과 다르다. 같은 조건에서 호렙 산과 견주는 데만 쓴다.
const { chromium } = require('playwright');
const enter3d = require('./lib/enter.js');
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['OT-09', 'OT-18', 'OT-11', 'OT-26', 'OT-19', 'OT-30', 'OT-03', 'OT-13', 'OT-05', 'OT-21', 'OT-36', 'OT-39'];
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const rows = [];
  for (const id of ids) {
    const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })).newPage();
    const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    await p.addInitScript(() => { window.BO3D_TEST = true; });
    await p.goto('file:///home/user/bible_onyou/dist/preview3d.html#fps'); await p.waitForTimeout(2500);
    const fps = () => p.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); function f() { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else res(Math.round(n / ((performance.now() - t0) / 1000) * 10) / 10); } requestAnimationFrame(f); }));
    try {
      await enter3d(p, 1, id);
      if (id === 'OT-09') { /* 호렙 산은 타임머신 이름 고르기를 거친다: 첫 보기로 넘어간다 */
        for (let i = 0; i < 6 && !(await p.$('text=출발하자')); i++) { const c = await p.$('.overlay3:not([hidden]) .choice'); if (c) await c.click(); const n = await p.$('.overlay3:not([hidden]) .sheet-foot .btn.onpaper'); if (n) await n.click(); await p.waitForTimeout(800); }
      }
      await p.waitForSelector('text=출발하자', { timeout: 60000 }); await p.click('text=출발하자'); await p.waitForTimeout(800);
      await p.evaluate(() => { const o = document.querySelector('.overlay3'); if (o) o.hidden = true; });
      await p.waitForTimeout(1500);
      const a = Object.assign({ fps: await fps() }, await p.evaluate(() => BO3D.debug.render()));
      await p.evaluate(() => BO3D.debug.lookup());
      await p.waitForSelector('.panel3:not([hidden])', { timeout: 60000 }); await p.waitForTimeout(3000);
      const e = Object.assign({ fps: await fps() }, await p.evaluate(() => BO3D.debug.render()));
      rows.push({ id, a, e, errs: errs.length });
      console.log(id, '도착', JSON.stringify(a), '지켜보기', JSON.stringify(e), '오류', errs.length);
    } catch (x) { console.log(id, 'FAIL', x.message.split('\n')[0]); rows.push({ id, fail: x.message.split('\n')[0] }); }
    await p.context().close();
  }
  const base = rows.find((r) => r.id === 'OT-09' && r.a);
  if (base) {
    console.log('\n호렙 산 대비(지켜보기): 장면, calls 배, tris 배, fps 배');
    rows.filter((r) => r.e).forEach((r) => console.log(r.id, (r.e.calls / base.e.calls).toFixed(2), (r.e.tris / base.e.tris).toFixed(2), (r.e.fps / base.e.fps).toFixed(2)));
  }
  await b.close();
})();
