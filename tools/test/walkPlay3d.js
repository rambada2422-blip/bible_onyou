// 3D 장면과 보상·기록 화면의 연결 자동 점검(play 갈래). 장면을 끝까지 걷지 않고 아래만 본다.
//  ① 탐지기 물음을 한 번 엇나간 뒤 맞히면 부모·교사 화면용 기록(OT-NN:tN:part0)이 남는지
//  ② 사진기 단추로 찍으면 이 기기의 사진 도감에 그 장면 사진이 남고, 탐험 일지 "사진 도감"에 보이는지
//  ③ 8~10세에서 3D 시트(도착 안내·탐지기 물음·재료 패널·도감) 아래에 읽어 주기 단추가 있는지
//  ④ 폭 320·360·390·430에서 위쪽 안내·탐지기 물음·재료 패널·도감·아지트(깃발 색 12개)가 옆으로 넘치거나 화면 밖으로 나가지 않고,
//     단추가 44px 이상인지. 시트가 스크롤해야 하는지는 문제로 치지 않고 길이만 적는다.
// 사용: node tools/test/walkPlay3d.js <단계 0~2> <저장 폴더> [장면 OT-18]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const enter3d = require('./lib/enter.js');
const ti = Number(process.argv[2] || '0'), out = process.argv[3] || '/tmp/walkPlay3d', id = process.argv[4] || 'OT-18';
const WIDTHS = [[320, 568], [360, 640], [390, 844], [430, 932]];
fs.mkdirSync(out, { recursive: true });
(async () => {
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  const b = await chromium.launch({ proxy, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })).newPage();
  await p.addInitScript(() => { window.BO3D_TEST = true; });
  const errs = [], probs = [], notes = []; let n = 0;
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  const need = (ok, msg) => { if (!ok) probs.push(msg); };
  const shot = async (l) => { n++; await p.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '-' + l + '.png') }); };
  const tier = ['t1', 't2', 't3'][ti];
  // 3D 화면 점검: 보이는 것 가운데 옆으로 넘침, 화면 밖, 작은 단추, 잘린 글, 시트 스크롤 길이, 읽어 주기 단추
  const look = () => p.evaluate(() => {
    const ui = document.getElementById('ui');
    const vis = (e) => { if (!e || e.closest('[hidden]')) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const name = (e) => ((e.getAttribute('aria-label') || e.textContent || e.className || e.tagName) + '').trim().replace(/\s+/g, ' ').slice(0, 18);
    const boxes = [...ui.querySelectorAll('.hud3, .overlay3, .panel3, .toast3, .sheet-body, .sheet-foot, .den3ov, .sws, .dexgrid')].filter(vis);
    const over = boxes.filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.className.split(' ')[0]);
    const btns = [...ui.querySelectorAll('button')].filter((e) => vis(e) && !e.disabled);
    const sws = [...ui.querySelectorAll('.sws button')].filter(vis);
    const small = btns.concat(sws.filter((e) => e.disabled)).filter((e) => { const r = e.getBoundingClientRect(); return r.height < 43.5 || r.width < 43.5; })
      .map((e) => { const r = e.getBoundingClientRect(); return name(e) + ' ' + Math.round(r.width) + '×' + Math.round(r.height); });
    /* 스크롤되는 상자 안에서 아래로 가려진 것은 화면 밖으로 치지 않는다(옆으로 나간 것만) */
    const scroller = (e) => { for (let a = e.parentElement; a && a !== ui; a = a.parentElement) { const s = getComputedStyle(a).overflowY; if ((s === 'auto' || s === 'scroll') && a.scrollHeight > a.clientHeight + 1) return a; } return null; };
    const outside = [...ui.querySelectorAll('button, .hud3, .toast3, .panel3, .sheet, .frame, .dexcell, .slot')].filter(vis)
      .filter((e) => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 || r.left < -1 || ((r.top < -1 || r.bottom > innerHeight + 1) && !scroller(e)); }).map(name);
    const cut = [...ui.querySelectorAll('.hud3 *, .toast3 *, .sheet-foot .btn, .slot b, .frame span')].filter(vis)
      .filter((e) => e.children.length === 0 && getComputedStyle(e).textOverflow === 'ellipsis' && e.scrollWidth > e.clientWidth + 1).map(name);
    const scroll = [...ui.querySelectorAll('.sheet-body, .den3ov')].filter(vis).map((e) => e.scrollHeight - e.clientHeight).filter((d) => d > 2);
    const sheets = [...ui.querySelectorAll('.panel3, .overlay3.sheet3')].filter(vis);
    const noSpeak = sheets.filter((s) => !s.querySelector('.sheet-foot .speak3')).map((s) => s.className.split(' ')[0]);
    return { over, small, outside, cut, scroll: scroll.length ? Math.max.apply(null, scroll) : 0, sheets: sheets.length, noSpeak, sw: sws.length };
  });
  const canSpeak = await (async () => { await p.goto('file:///home/user/bible_onyou/dist/preview3d.html'); await p.waitForTimeout(2500); await p.evaluate(() => document.fonts.ready); return p.evaluate(() => BO3D.ui.canSpeak()); })();
  // 같은 화면을 네 가지 폭으로 바꿔 가며 본다(끝나면 390×844로 돌아온다)
  const widths = async (where, more) => {
    for (const [w, h] of WIDTHS) {
      await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(350);
      const r = await look(), at = where + ' ' + w + '×' + h;
      if (r.over.length) probs.push(at + ': 옆으로 넘침 ' + r.over.join(','));
      if (r.outside.length) probs.push(at + ': 화면 밖으로 나감 ' + r.outside.join(' / '));
      if (r.small.length) probs.push(at + ': 누르기 어려운 단추 ' + r.small.join(' / '));
      if (r.cut.length) probs.push(at + ': 잘린 글 ' + r.cut.join(' / '));
      if (ti === 0 && canSpeak && r.noSpeak.length) probs.push(at + ': 8~10세 시트에 읽어 주기 단추가 없음 ' + r.noSpeak.join(','));
      if (more) more(r, at);
      notes.push(at + ' · 시트 ' + r.sheets + ' · 스크롤 ' + r.scroll + 'px');
      await shot(where.replace(/\s+/g, '_') + '-' + w);
    }
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(350);
  };
  const st = () => p.evaluate(() => BO3D.debug.state());
  const segs = async () => { for (let i = 0; i < 12; i++) { const on = await p.evaluate(() => !!(BO3D.story && BO3D.story.debug.state().screen === 'seg')); if (!on) return; await p.click('.ot3 .sheet-foot .btn >> nth=-1'); await p.waitForTimeout(250); } };

  await enter3d(p, ti, id);
  await p.waitForSelector('text=출발하자', { timeout: 60000 }); await p.waitForTimeout(1500);
  const info = await p.evaluate(() => BO3D.debug.scene());
  need(info.id === id, '다른 장면이 열림: ' + info.id);
  const D = await p.evaluate((sid) => BO3D.ot.scenes[sid], id);
  await widths('도착 안내');
  await p.click('text=출발하자'); await p.waitForTimeout(500);
  await segs();

  // ① 탐지기 물음: 먼저 엇나간 뒤 맞힌다
  await p.waitForSelector('.overlay3:not([hidden]) .q-kicker', { timeout: 20000 });
  await widths('탐지기 물음');
  const q = D.quests[0].q[tier] || D.quests[0].q.t2;
  const r1 = await p.evaluate(async (q) => {
    const sc = document.querySelector('.overlay3'), wait = () => new Promise((r) => setTimeout(r, 60));
    const pick = async (lb) => { const o = [...sc.querySelectorAll('.opt')].find((x) => x.textContent.trim().endsWith(lb.trim())); if (o) { o.click(); await wait(); } return !!o; };
    const readBtn = async () => { const rb = [...sc.querySelectorAll('.btn')].find((x) => x.textContent === '찾아서 읽었어요'); if (rb) { rb.click(); await wait(); } };
    let missed = false;
    if (q.type === 'choice') { missed = await pick(q.options.find((o) => !o.ok).label); await pick(q.options.find((o) => o.ok).label); }
    else if (q.type === 'find') { await readBtn(); missed = await pick(q.confirm.options.find((o) => !o.ok).label); await pick(q.confirm.options.find((o) => o.ok).label); }
    else if (q.type === 'order') { for (const it of [...q.items].reverse()) await pick(it); missed = true; for (const it of q.items) await pick(it); }
    else if (q.type === 'findref') { const ins = sc.querySelectorAll('.refin input'), b = sc.querySelector('.refin .btn'); ins[0].value = '99'; ins[1].value = '99'; b.click(); await wait(); missed = true; const cv = q.accept[0].split(':'); ins[0].value = cv[0]; ins[1].value = cv[1]; b.click(); await wait(); }
    return { type: q.type, missed, look: !!sc.querySelector('.note.look, .note.detour'), good: !!sc.querySelector('.note.good') };
  }, q);
  need(r1.missed && r1.good, '탐지기 물음(' + r1.type + '): 엇나간 뒤 맞히지 못함 ' + JSON.stringify(r1));
  await shot('quiz-after-miss');
  const P1 = await p.evaluate(() => BO3D.story.debug.pg());
  const key = id + ':' + tier + ':part0';
  if (r1.missed) need(P1.q[key] && P1.q[key].m >= 1, '기록: 탐지기 물음에서 엇나간 것이 ' + key + '로 남지 않음 ' + JSON.stringify(P1.q));
  await p.click('text=찾으러 가기'); await p.waitForTimeout(800);

  // ④ 걷는 화면(위쪽 안내·사진기·도감 단추)
  await widths('걷는 화면');

  // ② 사진: 카메라를 여덟 방향으로 돌려 가며 도감에 하나라도 담길 때까지 찍는다
  let got = [];
  for (let k = 0; k < 16 && !got.length; k++) {
    await p.evaluate((a) => BO3D.debug.yaw(a), (k % 8) * Math.PI / 4); await p.waitForTimeout(700);
    if (k === 8) { await p.evaluate(() => { const s = BO3D.debug.scene(); BO3D.debug.goto(s.P.machine[0] + 3, s.P.machine[1] + 6); }); await p.waitForTimeout(700); }
    await p.click('.cam3'); await p.waitForTimeout(600);
    got = await p.evaluate(() => BO3D.debug.dex());
  }
  need(got.length > 0, '사진: 여러 방향으로 찍어도 도감에 담기지 않음');
  await shot('photo');
  const saved = await p.evaluate((sid) => { const x = BO3D.story.debug.dex()[sid] || {}; return Object.keys(x).map((k) => ({ k, n: x[k].n, r: x[k].r, img: (x[k].img || '').slice(0, 15) })); }, id);
  need(got.every((g) => saved.some((s) => s.k === g)), '사진 도감: 찍은 사진이 이 기기에 남지 않음 ' + JSON.stringify(saved));
  need(saved.length && saved.every((s) => s.img.indexOf('data:image/jpeg') === 0), '사진 도감: 사진 그림이 비어 있음 ' + JSON.stringify(saved));

  // ④ 도감 시트
  await p.click('.dex3'); await p.waitForTimeout(400);
  need(await p.evaluate(() => !document.querySelector('.overlay3').hidden && !!document.querySelector('.overlay3 .dexgrid')), '도감: 열리지 않음');
  await widths('도감');
  await p.click('.overlay3 .sheet-foot .btn:has-text("닫기")'); await p.waitForTimeout(300);

  // ④ 아지트(깃발 색 12개). 재료를 주우면 다음 물음이 열리므로 그 전에 본다
  await p.evaluate(() => { const s = BO3D.debug.scene(); BO3D.debug.goto(s.P.machine[0] - 2, s.P.machine[1] - 3); }); await p.waitForTimeout(900);
  if (await p.evaluate(() => [...document.querySelectorAll('.den3')].some((x) => !x.hidden))) {
    await p.click('.den3:not([hidden])'); await p.waitForTimeout(500);
    await widths('아지트', (r, w) => { if (r.sw !== 12) probs.push(w + ': 깃발 색 단추가 12개가 아님 ' + r.sw); });
    await p.click('text=밖으로 나가기'); await p.waitForTimeout(300);
  } else probs.push('아지트: 타임머신 곁에서도 "타임머신에 타기" 단추가 보이지 않음 ' + JSON.stringify(await st()));

  // ④ 재료 패널: 첫 재료 자리로 옮겨 줍는다(걷지 않고)
  const at = info.parts[0].at;
  await p.evaluate(([x, z]) => BO3D.debug.goto(x, z), at); await p.waitForTimeout(1500);
  if ((await st()).state === 'caption') {
    need(await p.evaluate(() => !document.querySelector('.panel3').hidden), '재료 패널: 보이지 않음');
    await widths('재료 패널');
    await p.click('text=계속 탐험하기'); await p.waitForTimeout(500);
    await segs();
  } else probs.push('재료 1을 줍지 못함 ' + JSON.stringify(await st()));

  // ② 탐험 일지 "사진 도감"에 이 장면 사진이 보이는지(3D에서 나와 시대 지도로)
  await p.evaluate(() => BO3D.story.openMap()); await p.waitForTimeout(400);   /* 3D에서 시대 지도로 나오는 길(걸린 시간이 여기서 멈춘다) */
  await p.click('.ot3 button:has-text("탐험 일지")'); await p.waitForTimeout(200);
  await p.click('.ot3 [data-tab="photos"]'); await p.waitForTimeout(300);
  const cells = await p.evaluate(() => [...document.querySelectorAll('.ot3 .dexcell')].map((c) => ({ img: !!c.querySelector('img'), t: c.innerText.replace(/\s+/g, ' ').slice(0, 60) })));
  const names = saved.map((s) => s.n);
  need(cells.length >= saved.length && names.every((nm) => cells.some((c) => c.img && c.t.includes(nm))), '탐험 일지: 사진 도감에 3D에서 찍은 사진이 보이지 않음 ' + JSON.stringify(cells));
  await shot('journal-photos');
  // 3D에서 보낸 시간이 기록에 남는지(부모·교사 화면의 걸린 시간)
  const P2 = await p.evaluate(() => BO3D.story.debug.pg());
  need(P2.time[id] > 0, '기록: 3D에서 보낸 시간이 남지 않음 ' + JSON.stringify(P2.time));

  console.log(id, tier, '· 찍은 화면', n, '· 읽어 주기', canSpeak ? '있음' : '이 브라우저에는 음성이 없음', '· 도감', saved.map((s) => s.k).join(','));
  console.log(notes.join('\n'));
  console.log('문제', probs.length, probs.slice(0, 40).join('\n'));
  console.log('오류', errs.length, errs.slice(0, 8).join('\n'));
  await b.close();
  process.exit(probs.length || errs.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
