// 오프라인·홈 화면 설치 준비 점검(play 갈래): 한 파일 미리보기(dist/preview3d.html)가 인터넷 없이 어디까지 되는지 잰다.
// 사용: node tools/test/offlineCheck.js
// 보는 것: 파일 크기, 인터넷으로 가져오려는 것(글꼴 등), 인터넷을 끊고 열어 장면 하나를 끝까지 하고 다시 열어도 진행이 남는지.
const { chromium } = require('playwright');
const fs = require('fs');
const doHelp = require('./lib/help.js'), solve = require('./lib/solve.js');
(async () => {
  const file = '/home/user/bible_onyou/dist/preview3d.html', html = fs.readFileSync(file, 'utf8');
  console.log('파일 크기', (fs.statSync(file).size / 1048576).toFixed(1) + 'MB');
  const ext = [...new Set((html.match(/(?:src|href)=["'](https?:\/\/[^"']+)["']/g) || []).map((x) => x.replace(/^(?:src|href)=["']|["']$/g, '')))];
  console.log('페이지가 인터넷에서 가져오려는 것(src·href):', ext.length ? ext.join(' , ') : '없음');
  console.log('홈 화면 설치 표시: manifest', /rel=["']manifest/.test(html) ? '있음' : '없음', '· apple-touch-icon', /apple-touch-icon/.test(html) ? '있음' : '없음', '· theme-color', /theme-color/.test(html) ? '있음' : '없음', '· 서비스 워커 등록', /serviceWorker\.register/.test(html) ? '있음' : '없음');
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await ctx.setOffline(true);
  const p = await ctx.newPage(); await p.addInitScript(() => { window.BO3D_TEST = true; });
  const errs = [], failed = [];
  p.on('pageerror', (e) => errs.push(e.message)); p.on('requestfailed', (r) => failed.push(r.url().slice(0, 80)));
  await p.goto('file://' + file); await p.waitForTimeout(3000);
  console.log('인터넷 없이 열 때 못 가져온 것:', [...new Set(failed)].join(' , ') || '없음');
  const fonts = await p.evaluate(() => document.fonts.size);
  console.log('받아 온 글꼴 수:', fonts, fonts ? '' : '(인터넷이 없으면 Jua·고운돋움·고운바탕 대신 기기의 기본 한글 글꼴로 보인다)');
  await p.click('.tier >> nth=1'); await p.click('text=탐험 시작'); await p.waitForTimeout(300);
  const st = () => p.evaluate(() => BO3D.story.debug.state());
  const next = async () => { await p.click('.ot3 .sheet-foot .btn >> nth=-1'); await p.waitForTimeout(60); };
  while ((await st()).screen === 'intro') await next();
  await p.click('.otc[data-id="OT-01"]'); await p.waitForFunction(() => BO3D.story.debug.state().screen === 'play');
  for (let g = 0; g < 60; g++) {
    const s = await st();
    if (s.k === 'gate' || s.k === 'quest') await solve(p, false);
    if (s.k === 'mat') await p.evaluate(() => { const k = BO3D.story.debug.seek(); if (k !== null) document.querySelectorAll('.ot3 .seek-t')[k].click(); });
    if (s.k === 'help') await doHelp(p);
    if (s.k === 'finish') break;
    await next();
  }
  const done1 = (await st()).done;
  await p.reload(); await p.waitForTimeout(2500);
  const done2 = await p.evaluate(() => Object.keys(BO3D.story.debug.pg().done).length);
  console.log('인터넷 없이 장면 하나 끝까지:', done1 === 1 ? '됨' : '안 됨', '· 다시 열어도 진행이 남음:', done2 === 1 ? '됨' : '안 됨', '· 오류', errs.length, errs.slice(0, 3).join(' / '));
  const video = await p.evaluate(() => !!document.querySelector('video'));
  console.log('떨기나무 영상(assets/vision_bush.mp4)은 한 파일 밖에 있다. 미리보기 옆에 그 파일이 없으면 영상 없이 진행한다(코드가 건너뜀). 지금 페이지의 video 요소:', video ? '있음' : '아직 없음(3D 호렙 장면에서만 만든다)');
  await b.close(); process.exit(errs.length || done1 !== 1 || done2 !== 1 ? 1 : 0);
})();
