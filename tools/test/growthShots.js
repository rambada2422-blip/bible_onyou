// 성장 전후 비교(보완 3차 ⑥, docs/14 보완3-6의 V1·V2) — 8~10세가 설명 없이 차이를 알아볼 만큼 달라지는지 숫자로 본다.
// 사용: node tools/test/growthShots.js [저장 폴더]
// V1 윤곽 차이: 아이 모형을 96×96 검은 윤곽으로 앞·옆·뒤에서 그려, 앞 단계와 다른 화소 / 두 윤곽을 합친 화소. 단계마다 한 방향 이상 3% 이상.
//    3단계(손목 탐지기)는 장비가 작아, 새 장비 카드와 3D에서 보여 주는 "들여다보기" 모습으로 잰다(쉬는 모습 값도 함께 적는다).
// V2 게임 거리: 3D 요단(OT-18) 탐색 시작 화면(390×844)을 멈춘 채 단계만 바꿔 다시 그리고, 바뀐 화소 수. 150화소 이상.
// 결과: 표(콘솔·result.txt)와 나란히 놓은 비교 그림 페이지(compare.html: 새 장비 카드의 전후 그림, 3D 화면 전후).
const { chromium, previewURL } = require('./lib/runtime.js');
const path = require('path');
const fs = require('fs');
const enter3d = require('./lib/enter.js');
const out = process.argv[2] || '/tmp/growthShots';
fs.mkdirSync(out, { recursive: true });
const URL = previewURL;
const STEPS = [[0, 1, 'hat', null], [1, 2, 'flag', null], [2, 3, 'wrist', 'look']];
const NAME = { 1: '탐험 모자', 2: '탐험대 깃발', 3: '손목 탐지기' };
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })).newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { window.BO3D_TEST = true; });
  await p.goto(URL); await p.waitForTimeout(2500);
  const lines = [], probs = [], cards = [];

  /* V1 */
  const v1 = await p.evaluate((STEPS) => {
    const r = [];
    for (const k of ['choeon', 'hyu', 'onwoo']) for (const [a, c, , pose] of STEPS) {
      const row = { k, a, c, views: {} };
      for (const v of ['front', 'side', 'back']) {
        const rest = BO3D.debug.silhouetteDiff(k, a, c, v), used = pose ? BO3D.debug.silhouetteDiff(k, a, c, v, pose) : null;
        row.views[v] = { rest: rest ? rest.ratio : null, used: used ? used.ratio : null };
      }
      r.push(row);
    }
    return r;
  }, STEPS);
  lines.push('V1 윤곽 차이(96×96, 다른 화소 / 합친 윤곽) — 기준: 한 방향 이상 3% 이상');
  v1.forEach((r) => {
    const pick = (x) => (x.used != null ? x.used : x.rest), best = Math.max(...Object.values(r.views).map(pick));
    const txt = Object.entries(r.views).map(([v, x]) => v + ' ' + (x.rest * 100).toFixed(1) + '%' + (x.used != null ? '(들여다보기 ' + (x.used * 100).toFixed(1) + '%)' : '')).join(' · ');
    lines.push('  ' + r.k + ' ' + r.a + '→' + r.c + ' ' + NAME[r.c] + ': ' + txt + ' → ' + (best >= 0.03 ? '통과' : '미달'));
    if (best < 0.03) probs.push('V1 ' + r.k + ' ' + r.a + '→' + r.c + ' 윤곽 차이 ' + (best * 100).toFixed(1) + '%');
  });

  /* 새 장비 카드의 전후 그림(이야기 카드·3D 끝 카드에 나오는 것과 같은 함수) */
  for (const [a, c, part, pose] of STEPS) {
    const info = await p.evaluate(([a, c, part, pose]) => {
      const g = BO3D.growth, st = g.info(c), key = 'hyu';
      const A = BO3D.gearShot(key, a, st.view, {}), B = BO3D.gearShot(key, c, st.view, { part, pose });
      return { a: A && A.url, b: B && B.url, ring: B && B.ring, view: st.view };
    }, [a, c, part, pose]);
    ['a', 'b'].forEach((x) => { if (info[x]) fs.writeFileSync(path.join(out, 'card' + c + x + '.png'), Buffer.from(info[x].split(',')[1], 'base64')); });
    cards.push({ c, ring: info.ring, view: info.view });
  }

  /* V2: 3D 요단, 탐색 시작 화면 */
  await enter3d(p, 1, 'OT-18');
  await p.waitForSelector('text=출발하자', { timeout: 60000 }); await p.click('text=출발하자'); await p.waitForTimeout(800);
  await p.evaluate(() => { const o = document.querySelector('.overlay3'); if (o) o.hidden = true; });
  await p.waitForTimeout(1200);
  const v2 = await p.evaluate((STEPS) => {
    const D = BO3D.debug, res = [];
    D.freeze(true);
    const snap = (stage, pose) => { D.rebuild({ stage, hat: stage >= 1, flag: null }); D.kidLook(!!pose); return D.grab(); };
    const diff = (x, y) => { let n = 0; for (let i = 0; i < x.data.length; i += 4) { if (Math.abs(x.data[i] - y.data[i]) + Math.abs(x.data[i + 1] - y.data[i + 1]) + Math.abs(x.data[i + 2] - y.data[i + 2]) > 36) n++; } return n; };
    const noiseA = snap(0), noiseB = snap(0), noise = diff(noiseA, noiseB);
    for (const [a, c, , pose] of STEPS) {
      const A = snap(a), B = snap(c, pose), Br = pose ? snap(c) : null;
      res.push({ a, c, px: diff(A, B), rest: Br ? diff(A, Br) : null, urlA: A.url, urlB: B.url });
    }
    D.freeze(false);
    return { noise, res };
  }, STEPS);
  lines.push('V2 게임 거리(3D 요단 탐색 시작, 390×844, 바뀐 화소) — 기준: 150화소 이상. 같은 화면 두 번 그린 잡음 ' + v2.noise + '화소');
  v2.res.forEach((r) => {
    lines.push('  ' + r.a + '→' + r.c + ' ' + NAME[r.c] + ': ' + r.px + '화소' + (r.rest != null ? ' (쉬는 모습 ' + r.rest + '화소)' : '') + ' → ' + (r.px - v2.noise >= 150 ? '통과' : '미달'));
    if (r.px - v2.noise < 150) probs.push('V2 ' + r.a + '→' + r.c + ' ' + r.px + '화소');
    fs.writeFileSync(path.join(out, 'game' + r.c + 'a.jpg'), Buffer.from(r.urlA.split(',')[1], 'base64'));
    fs.writeFileSync(path.join(out, 'game' + r.c + 'b.jpg'), Buffer.from(r.urlB.split(',')[1], 'base64'));
  });

  /* 비교 페이지: 대표가 한 화면에서 전후를 본다(글을 가리고 아이에게 보여 주는 V3에도 쓴다) */
  const row = (c) => `<section><h2>${c}단계 · ${NAME[c]}</h2><div class="pair"><figure><img src="card${c}a.png"><figcaption>전</figcaption></figure><span>→</span><figure><img src="card${c}b.png"><figcaption>뒤</figcaption></figure></div>
<div class="pair g"><figure><img src="game${c}a.jpg"><figcaption>3D 전</figcaption></figure><figure><img src="game${c}b.jpg"><figcaption>3D 뒤</figcaption></figure></div></section>`;
  fs.writeFileSync(path.join(out, 'compare.html'), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>성장 전후 비교</title>
<style>body{font-family:sans-serif;margin:16px;background:#f6f1e6;color:#1b2540}section{margin:0 0 28px}.pair{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.pair figure{margin:0;text-align:center}.pair img{width:150px;border-radius:10px;background:#fff}.pair.g img{width:180px}h2{font-size:18px}pre{white-space:pre-wrap;font-size:12px}</style>
<h1>성장 전후 비교(보완 3차 V1·V2)</h1>${[1, 2, 3].map(row).join('')}<pre>${lines.join('\n')}</pre>`);
  fs.writeFileSync(path.join(out, 'result.txt'), lines.join('\n') + '\n\n문제 ' + probs.length + '\n' + probs.join('\n') + '\n');
  console.log(lines.join('\n'));
  console.log('문제', probs.length, probs.join('\n'));
  console.log('오류', errs.length, errs.slice(0, 5).join('\n'));
  await b.close();
  process.exit(probs.length || errs.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
