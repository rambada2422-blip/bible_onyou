#!/usr/bin/env node
/* 아이 시험 자료 화면 점검 (갈래 pack). node tools/test/shot_kidtest.js <저장 폴더>
 * 집계도구.html을 390×844에서 열어 꾸민 자료·놀이 기록 붙여 넣기·판정·내보내기/불러오기를 확인하고, 인쇄물은 A4 쪽수를 센다. */
'use strict';
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const DIR = path.join(__dirname, '..', '..', 'docs', '아이시험');
const out = process.argv[2] || '/tmp/kidtest_shots'; fs.mkdirSync(out, { recursive: true });
let fail = 0; const ok = (c, m) => { console.log((c ? '통과 ' : '실패 ') + m); if (!c) fail++; };
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('dialog', (d) => d.accept());
  await p.goto('file://' + path.join(DIR, '집계도구.html'));
  ok((await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 0, '390 폭에서 옆으로 넘치지 않는다');
  await p.screenshot({ path: path.join(out, 'k1_top.png') });
  await p.click('#demo');
  ok((await p.locator('#list tbody tr').count()) === 12, '꾸민 자료 12구간이 표에 들어간다');
  ok(/진단이 맞았다/.test(await p.locator('#verdict').textContent()), '꾸민 자료의 판정: 진단이 맞았다');
  ok((await p.locator('#warn').textContent()) === '', '꾸민 자료는 표본 경고가 없다');
  await p.locator('#sum').scrollIntoViewIfNeeded(); await p.screenshot({ path: path.join(out, 'k2_result.png') });
  /* 한 구간을 손으로: 놀이 기록 붙여 넣기 */
  const t = 1700000000000;
  const log = [{ w: 'OT-11 arrive', ms: 4000, at: t }, { w: 'OT-11 beat0', ms: 1000, at: t + 4000 }, { w: 'OT-11 help0', ms: 9000, at: t + 5000 }, { w: 'OT-11 gate0', ms: 30000, at: t + 14000 }, { w: 'OT-11 finish', ms: 20000, at: t + 44000 }];
  await p.fill('#no', '7-1'); await p.fill('#child', '7'); await p.selectOption('#ver', 'prev'); await p.fill('#log', JSON.stringify(log)); await p.click('#parse');
  ok((await p.inputValue('#screens')) === '5' && (await p.inputValue('#quick')) === '1' && (await p.inputValue('#doN')) === '1' && (await p.inputValue('#qSec')) === '30', '놀이 기록에서 화면 5, 2초 넘김 1, 돕기 1, 물음 30초를 채운다');
  await p.locator('#parse').scrollIntoViewIfNeeded(); await p.screenshot({ path: path.join(out, 'k3_parsed.png') });
  await p.fill('#wrong', '2'); await p.fill('#wrongDone', '2'); await p.click('#addbtn');
  ok((await p.locator('#list tbody tr').count()) === 13, '넣은 구간이 13개가 된다');
  ok(/아이 7/.test(await p.locator('#warn').textContent()), '한 판만 넣은 아이 7에 대한 표본 경고가 나온다');
  await p.click('#exp'); const dump = await p.inputValue('#io');
  await p.reload(); ok((await p.locator('#list tbody tr').count()) === 13, '다시 열어도 13구간이 남아 있다');
  await p.click('#wipe'); ok((await p.locator('#list tbody tr').count()) === 0, '모두 지우기');
  await p.fill('#io', dump); await p.click('#imp'); ok((await p.locator('#list tbody tr').count()) === 13, '불러오기로 13구간이 돌아온다');
  await p.fill('#log', '이건 기록이 아님'); await p.click('#parse'); ok(/읽지 못했습니다/.test(await p.locator('#pmsg').textContent()), '잘못 붙여 넣으면 알려 준다');
  await p.click('#wipe');
  ok(errs.length === 0, '화면 오류 없음' + (errs.length ? ': ' + errs.join(' / ') : ''));
  for (const f of ['관찰지', '진행순서카드', '부모안내문', '교사부모_한장안내']) {
    const q = await b.newPage(); await q.goto('file://' + path.join(DIR, f + '.html'));
    const pdf = path.join(out, f + '.pdf'); await q.pdf({ path: pdf, format: 'A4', printBackground: true });
    const pages = (fs.readFileSync(pdf, 'latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    const want = { '관찰지': 1, '진행순서카드': 2, '부모안내문': 1, '교사부모_한장안내': 1 }[f];
    ok(pages === want, f + ': A4 ' + pages + '쪽 (바라는 쪽수 ' + want + ')');
    await q.emulateMedia({ media: 'print' }); await q.setViewportSize({ width: 794, height: 1123 }); await q.screenshot({ path: path.join(out, 'p_' + f + '.png'), fullPage: true });
    const m = await b.newPage({ viewport: { width: 390, height: 844 } }); await m.goto('file://' + path.join(DIR, f + '.html'));
    ok((await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 0, f + ': 390 폭에서 옆으로 넘치지 않는다');
    await m.screenshot({ path: path.join(out, 'm_' + f + '.png') }); await m.close(); await q.close();
  }
  await b.close(); console.log(fail ? '실패 ' + fail + '건' : '모두 통과', '· 화면: ' + out); process.exit(fail ? 1 : 0);
})();
