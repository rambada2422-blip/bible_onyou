#!/usr/bin/env node
/* 감수 자료 화면 점검 (갈래 pack). node tools/test/shot_review_pack.js <저장 폴더>
 * 390×844 휴대폰 화면에서 감수자료.html을 열어: 넘침 없음, 표시 → 저장 → 다시 열어도 남음, 내보내기 글, 불러오기, 걸러 보기를 확인하고 화면을 찍는다.
 * 인쇄용 세 파일은 A4 PDF로 만들어 쪽수를 센다(PDF는 저장 폴더에만 두고 저장소에 넣지 않는다). */
'use strict';
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '..', '..'), OUT = path.join(ROOT, 'docs', '감수');
const dir = process.argv[2] || '/tmp/review_shots';
fs.mkdirSync(dir, { recursive: true });
let fail = 0; const ok = (c, m) => { console.log((c ? '통과 ' : '실패 ') + m); if (!c) fail++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  const url = 'file://' + path.join(OUT, '감수자료.html');
  await p.goto(url);
  await p.screenshot({ path: path.join(dir, 'm1_top.png') });
  const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(over <= 0, '390 폭에서 옆으로 넘치지 않는다 (넘침 ' + over + 'px)');
  const total = await p.locator('.mk').count();
  await p.locator('#OT-10·신약'.replace(/([·])/g, '\\$1')).scrollIntoViewIfNeeded().catch(() => {});
  const it = p.locator('[id="OT-10·신약"]');
  await it.scrollIntoViewIfNeeded();
  await it.locator('label:has(input[value=fix]) span').click();
  await it.locator('textarea').fill('시험: 고칠 말을 여기에 적음');
  await p.locator('[id="OT-10·오늘1"] label:has(input[value=ok]) span').click();
  await p.locator('[id="원칙·13.3"] label:has(input[value=del]) span').click();
  await it.scrollIntoViewIfNeeded();
  await p.screenshot({ path: path.join(dir, 'm2_item_marked.png') });
  ok((await p.locator('#cnt').textContent()) === '표시 3 / ' + total, '표시 수가 맞게 센다: ' + (await p.locator('#cnt').textContent()));
  await p.reload();
  ok((await p.locator('#cnt').textContent()) === '표시 3 / ' + total, '다시 열어도 표시가 남아 있다');
  ok(await p.locator('[id="OT-10·신약"] input[value=fix]').isChecked(), '고침 표시가 그 항목에 남아 있다');
  await p.locator('#exp').click();
  const txt = await p.locator('#box').inputValue();
  ok(/\[OT-10·신약\] 고침 \| 시험: 고칠 말을 여기에 적음/.test(txt) && /\[원칙·13\.3\] 뺌/.test(txt) && /\[OT-10·오늘1\] 그대로/.test(txt) && /표시 3 \/ /.test(txt), '내보낸 글에 세 표시와 적은 말이 들어 있다');
  await p.screenshot({ path: path.join(dir, 'm3_export.png') });
  fs.writeFileSync(path.join(dir, 'export_sample.txt'), txt);
  /* 다른 기기라고 보고: 저장을 지우고 불러오기 */
  await p.locator('#cls').click();
  await p.evaluate(() => localStorage.clear()); await p.reload();
  ok((await p.locator('#cnt').textContent()) === '표시 0 / ' + total, '저장을 지우면 0이 된다');
  await p.locator('#exp').click(); await p.locator('#box').fill(txt); await p.locator('#imp').click();
  ok(/3개 항목/.test(await p.locator('#msg').textContent()), '불러오기로 세 표시가 돌아온다: ' + (await p.locator('#msg').textContent()));
  await p.locator('#cls').click();
  ok((await p.locator('#cnt').textContent()) === '표시 3 / ' + total, '불러온 뒤 표시 수 3');
  /* 걸러 보기 */
  await p.selectOption('#flt', 'pri');
  const vis = await p.evaluate(() => [].filter.call(document.querySelectorAll('.it'), (e) => e.offsetParent !== null).length);
  ok(vis === 30, '"먼저 볼 30"을 고르면 30항목만 보인다 (' + vis + ')');
  await p.screenshot({ path: path.join(dir, 'm4_first30.png') });
  await p.selectOption('#flt', 'req');
  const sc = await p.evaluate(() => [].filter.call(document.querySelectorAll('.sc'), (e) => e.offsetParent !== null && e.querySelector('h3[id^=OT]')).length);
  ok(sc === 24, '"감수 필수 장면만"을 고르면 24장면이 보인다 (' + sc + ')');
  await p.selectOption('#flt', '');
  await p.locator('[id="OT-10·대목"] summary').click();
  await p.locator('[id="OT-10·대목"]').scrollIntoViewIfNeeded();
  await p.screenshot({ path: path.join(dir, 'm5_beats_open.png') });
  await p.locator('[id="OT-11·3D"]').scrollIntoViewIfNeeded();
  await p.screenshot({ path: path.join(dir, 'm6_3d.png') });
  ok(errs.length === 0, '화면 오류 없음' + (errs.length ? ': ' + errs.join(' / ') : ''));
  /* 넓은 화면 */
  const w = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await w.goto(url); await w.screenshot({ path: path.join(dir, 'w1_top.png') });
  /* 인쇄용 */
  const { execSync } = require('child_process');
  for (const f of ['감수자료_인쇄용', '먼저볼30_인쇄용', '참고_장면전체글_인쇄용'].concat((process.argv[3] || '').split(',').filter(Boolean))) {
    const q = await b.newPage();
    await q.goto('file://' + path.join(f.includes('/') ? ROOT : OUT, f + '.html'));
    const pdf = path.join(dir, path.basename(f) + '.pdf');
    await q.pdf({ path: pdf, format: 'A4', printBackground: true });
    let pages = '?';
    try { pages = (fs.readFileSync(pdf, 'latin1').match(/\/Type\s*\/Page[^s]/g) || []).length; } catch (e) {}
    console.log('인쇄 ' + f + ': A4 ' + pages + '쪽, ' + Math.round(fs.statSync(pdf).size / 1024) + 'KB');
    await q.emulateMedia({ media: 'print' }); await q.setViewportSize({ width: 794, height: 1123 });
    await q.screenshot({ path: path.join(dir, 'p_' + path.basename(f) + '_1.png') });
    await q.close();
  }
  await b.close();
  console.log(fail ? '실패 ' + fail + '건' : '모두 통과', '· 화면: ' + dir);
  process.exit(fail ? 1 : 0);
})();
