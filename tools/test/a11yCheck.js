// 접근성 점검(play 갈래): 주요 화면을 찍고, 글자마다 글자색·크기·자리(네모)를 적어 낸다. 색 대비는 a11yContrast.py가 찍은 화면에서 바탕색을 읽어 계산한다.
// 사용: node tools/test/a11yCheck.js <저장 폴더> [단계 0~2]   →   python3 tools/test/a11yContrast.py <저장 폴더>
// 함께 보는 것: 글자 크기 12px 미만, 이름표(aria-label·글) 없는 단추, 누를 곳 44px 미만, 움직임 줄이기 설정에서 남는 움직임.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const out = process.argv[2] || '/tmp/a11y', ti = Number(process.argv[3] || '0');
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })).newPage();
  await p.addInitScript(() => { window.BO3D_TEST = true; });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file:///home/user/bible_onyou/dist/preview3d.html'); await p.waitForTimeout(2500); await p.evaluate(() => document.fonts.ready);
  const pages = [];
  const grab = async (name) => {
    await p.waitForTimeout(350);
    const data = await p.evaluate(() => {
      const root = document.querySelector('.ot3:not([hidden])') || document.querySelector('.overlay3:not([hidden])') || document.body;
      const vis = (e) => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 1 && r.height > 1 && r.bottom > 0 && r.top < innerHeight && r.left >= 0 && r.right <= innerWidth + 1 && s.visibility !== 'hidden' && +s.opacity > 0.3; };
      const texts = [];
      const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walk.nextNode()) {
        const n = walk.currentNode, t = n.textContent.trim(); if (!t) continue;
        const e = n.parentElement; if (!e || !vis(e)) continue;
        let op = 1; for (let a = e; a && a !== document.body; a = a.parentElement) op *= +getComputedStyle(a).opacity;
        const rg = document.createRange(); rg.selectNodeContents(n); const r = rg.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || r.top < 0 || r.bottom > innerHeight) continue;
        const sc = e.closest('.sheet-body, .otmap, .overlay3'); if (sc) { const q = sc.getBoundingClientRect(); if (r.top < q.top || r.bottom > q.bottom) continue; }   /* 스크롤에 가려진 글은 뺀다 */
        const s = getComputedStyle(e);
        let z = 1; for (let a = e; a; a = a.parentElement) z *= +(getComputedStyle(a).zoom || 1);
        texts.push({ t: t.slice(0, 30), cls: (e.className && e.className.baseVal === undefined ? e.className : e.tagName) || e.tagName, color: s.color, size: parseFloat(s.fontSize) * z, bold: +s.fontWeight >= 700, op, dis: !!e.closest('[disabled]'), x: r.left, y: r.top, w: r.width, h: r.height });
      }
      const btns = [...root.querySelectorAll('button, input, textarea, summary')].filter(vis);
      const noname = btns.filter((e) => !(e.getAttribute('aria-label') || e.textContent.trim() || e.getAttribute('placeholder'))).map((e) => e.className || e.tagName);
      const small = btns.map((e) => ({ r: e.getBoundingClientRect(), t: (e.getAttribute('aria-label') || e.textContent).trim().slice(0, 16) })).filter((x) => x.r.width < 43.5 || x.r.height < 43.5).map((x) => x.t + ' ' + Math.round(x.r.width) + '×' + Math.round(x.r.height));
      const anim = [...root.querySelectorAll('*')].filter((e) => vis(e) && getComputedStyle(e).animationName !== 'none' && getComputedStyle(e).animationIterationCount === 'infinite').map((e) => e.className || e.tagName);
      return { texts, noname, small, anim };
    });
    await p.screenshot({ path: path.join(out, name + '.png') });
    pages.push(Object.assign({ name }, data));
  };
  const next = async () => { await p.click('.ot3 .sheet-foot .btn >> nth=-1'); await p.waitForTimeout(80); };
  const st = () => p.evaluate(() => BO3D.story.debug.state());
  await p.click('.tier >> nth=' + ti); await grab('menu');
  await p.click('text=탐험 시작'); await grab('intro1'); await next(); await next(); await grab('intro3'); await next();
  await grab('map');
  await p.evaluate(() => { BO3D.story.debug.unlockAll(); BO3D.story.openMap(); });
  await p.click('.otc[data-id="OT-10"]'); await p.waitForFunction(() => BO3D.story.debug.state().screen === 'play');
  const doHelp = require('./lib/help.js'), solve = require('./lib/solve.js'), seen = {};
  for (let g = 0; g < 60; g++) {
    const s = await st();
    if (!seen[s.k + '0']) { seen[s.k + '0'] = 1; await grab('play-' + s.k); }
    if (s.k === 'gate' || s.k === 'quest') { await solve(p, !seen.wrong); seen.wrong = 1; if (!seen[s.k + '1']) { seen[s.k + '1'] = 1; await grab('play-' + s.k + '-answered'); } }
    if (s.k === 'mat') await p.evaluate(async () => { const k = BO3D.story.debug.seek(); if (k !== null) document.querySelectorAll('.ot3 .seek-t')[k].click(); });
    if (s.k === 'help') { const h = await doHelp(p); if (h && !seen['h' + h.kind]) { seen['h' + h.kind] = 1; await grab('play-help-' + h.kind); } }
    if (s.k === 'finish') break;
    await next();
  }
  await p.click('.ot3 .sheet-foot .btn >> nth=1'); await p.waitForTimeout(150);
  await p.evaluate(() => BO3D.story.openMap()); await p.waitForTimeout(100);
  await p.click('.ot3 button:has-text("탐험 일지")'); await grab('journal-cards');
  await p.click('.ot3 [data-tab="notes"]'); await grab('journal-notes');
  await p.evaluate(() => BO3D.story.openMap()); await p.click('.ot3 button:has-text("수리 현황")'); await grab('repair');
  await p.evaluate(() => BO3D.story.openMap()); await p.click('.ot3 button:has-text("설정")'); await grab('settings');
  await p.evaluate(() => BO3D.story.openAdult()); await grab('adult');
  await p.evaluate(() => { document.querySelector('.ot3 .otmap').scrollTop = 700; }); await grab('adult-2');
  fs.writeFileSync(path.join(out, 'texts.json'), JSON.stringify(pages));
  console.log('화면', pages.length, '· 글 조각', pages.reduce((a, x) => a + x.texts.length, 0), '· 오류', errs.length, errs.join(' / '));
  const uniq = (k) => [...new Set(pages.flatMap((x) => x[k].map((v) => x.name + ': ' + v)))];
  console.log('이름표 없는 단추:', uniq('noname').join(' ; ') || '없음');
  console.log('44px 미만:', uniq('small').join(' ; ') || '없음');
  console.log('움직임 줄이기에서도 도는 움직임:', uniq('anim').join(' ; ') || '없음');
  await b.close(); process.exit(errs.length ? 1 : 0);
})();
