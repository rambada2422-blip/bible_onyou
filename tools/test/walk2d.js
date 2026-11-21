// 사용: node walk.js <tierIndex 0-2> <routeLabel> <outDir> [url] [dsf]
const { chromium } = require('playwright');
const { gameOrigin, proxy } = require('./game-server');
const path = require('path');
const fs = require('fs');
const args = process.argv.slice(2);
const ti = args[0], routeLabel = args[1], out = args[2];
const dsf = Number(args[4] || '1');
fs.mkdirSync(out, { recursive: true });

(async () => {
  const b = await chromium.launch({ proxy });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dsf });
  const p = await ctx.newPage();
  const errs = [];
  const log = [];
  let n = 0;
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  const shot = async (label) => {
    n++;
    const f = String(n).padStart(2, '0') + '-' + label + '.png';
    await p.screenshot({ path: path.join(out, f) });
    log.push(f);
  };
  const url = args[3] || (await gameOrigin(b)) + '/index.html';
  await p.goto(url);
  await p.waitForTimeout(1200);
  await p.evaluate(() => document.fonts.ready);
  const C = await p.evaluate(() => BO.content);
  const tier = C.tiers[Number(ti)].id;
  await shot('title');
  await p.click('text=탐험 시작');
  await p.click('.tier >> nth=' + ti);
  await shot('setup');
  await p.click('text=출발 준비 완료');
  await shot('hub');

  const allQ = [];
  for (const sc of Object.values(C.scenes)) {
    for (const g of ((sc.gates || {})[tier] || [])) allQ.push(g);
    if (sc.spot) allQ.push(sc.spot[tier]);
    if (sc.back) allQ.push({ type: 'find', confirm: sc.back.confirm, prompt: sc.back.prompt[tier], ref: sc.back.ref });
  }
  let triedWrong = false;
  async function solveChoice(q) {
    const wrong = q.options.find((o) => !o.ok);
    if (wrong && !triedWrong) {
      triedWrong = true;
      await p.click('.opt:has-text("' + wrong.label + '")');
      await p.waitForTimeout(250);
      await shot('gate-look');
    }
    await p.click('.opt:has-text("' + q.options.find((o) => o.ok).label + '")');
  }
  async function solve() {
    const prompts = await p.$$eval('.q-prompt, .findcard p', (els) => els.map((e) => e.textContent));
    const pageText = await p.$eval('.sheet-body', (e) => e.textContent);
    const cands = allQ.filter((g) => prompts.includes(g.prompt));
    const q = cands.find((g) => !g.options || g.options.every((o) => pageText.includes(o.label))) || cands[0];
    if (!q) throw new Error('관문을 못 찾음: ' + prompts.join(' | '));
    if (q.type === 'choice') await solveChoice(q);
    else if (q.type === 'find') {
      await shot('find');
      await p.click('text=찾아서 읽었어요');
      await p.waitForTimeout(200);
      const txt2 = await p.$eval('.sheet-body', (e) => e.textContent);
      const q2 = cands.find((g) => g.confirm && g.confirm.options.every((o) => txt2.includes(o.label))) || q;
      await solveChoice(q2.confirm);
    } else if (q.type === 'order') {
      await shot('order');
      for (const it of q.items) await p.click('.opt:has-text("' + it + '")');
    } else if (q.type === 'findref') {
      await shot('findref');
      const cv = q.accept[0].split(':');
      const ins = await p.$$('.refin input');
      await ins[0].fill('9');
      await ins[1].fill('99');
      await p.click('.refin .btn');
      await p.waitForTimeout(200);
      await shot('findref-look');
      await ins[0].fill(cv[0]);
      await ins[1].fill(cv[1]);
      await p.click('.refin .btn');
    } else if (q.type === 'multi') {
      await shot('multi');
      for (const o of q.options.filter((x) => x.ok)) await p.click('.opt:has-text("' + o.label + '")');
      await p.click('.sheet-body .btn.plain');
    } else if (q.type === 'hotspots') {
      await p.waitForTimeout(900);
      await shot('hotspots');
      const hs = await p.$$('.hot');
      for (const h of hs) { await h.click(); await p.waitForTimeout(150); }
    }
    await p.waitForTimeout(300);
    await shot('gate-ok');
  }
  async function playScene(label) {
    await p.waitForSelector('.screen.scene', { timeout: 8000 });
    await p.waitForTimeout(700);
    for (let guard = 0; guard < 60; guard++) {
      if (!(await p.$('.screen.scene'))) return;
      const btn = await p.$('.sheet-foot .btn.onpaper');
      const disabled = await btn.evaluate((x) => x.disabled);
      if (disabled) { await solve(); continue; }
      const kick = await p.$eval('.sheet-body', (e) => (e.querySelector('.q-kicker, .kicker') || {}).textContent || 'beat');
      await p.waitForTimeout(kick === 'beat' ? 1500 : 350);
      await shot(label + '-' + kick.replace(/[^가-힣a-z0-9]+/gi, '_').slice(0, 14));
      const txt = await btn.textContent();
      await btn.click();
      await p.waitForTimeout(300);
      if (/시간표로|목적지 정하기|모세가 있는/.test(txt)) { await p.waitForTimeout(400); return; }
    }
    throw new Error('장면이 끝나지 않음: ' + label);
  }
  await p.click('.node.play >> nth=0');
  await p.waitForTimeout(600);
  await shot('warp');
  await playScene('ex00');
  await p.waitForSelector('text=다음 목적지');
  await shot('route');
  await p.click('.tier-list .btn:has-text("' + routeLabel + '")');
  if (routeLabel !== '모세') { await playScene('alt'); await p.waitForTimeout(2200); }
  await playScene('ex01');
  await p.waitForSelector('.hub');
  await shot('hub2');
  await p.click('.node.play >> nth=2');
  await playScene('ex09');
  await p.waitForSelector('.hub');
  await shot('hub3');
  await p.click('text=일지');
  await p.waitForTimeout(300);
  await shot('journal');
  await p.click('.page-head .iconbtn');
  await p.click('text=구성 안내');
  await p.waitForTimeout(300);
  await shot('guide');
  console.log(tier, 'shots:', n, errs.length ? '\nERR ' + errs.join('\n') : 'no errors');
  console.log(log.join(' '));
  await b.close();
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
