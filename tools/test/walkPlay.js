// 보상·기록·부모 교사 화면 자동 점검(play 갈래): 설정(글자 크기·소리·읽어 주기) → 장면 하나를 일부러 엇나가며 마침 →
// 탐험 일지(말씀 카드·사진 도감·내 기록) → 부모·교사 화면(어른 확인, 진도, 찾은 구절, 엇나간 물음, 걸린 시간, 시대 잠금) → 내보내기 → 지우기 → 가져오기.
// 사용: node tools/test/walkPlay.js <단계 0~2> <저장 폴더> [화면 폭 390]
// 화면마다 옆으로 넘침, 쓰지 않는 표현(4.2), 누르기 어려운 단추(44px 미만)를 본다. 끝에 문제와 오류 목록을 낸다.
const { chromium } = require('playwright');
const doHelp = require('./lib/help.js');
const solveQ = require('./lib/solve.js');
const path = require('path');
const fs = require('fs');
const ti = Number(process.argv[2] || '0'), out = process.argv[3] || '/tmp/walkPlay', W = Number(process.argv[4] || '390');
fs.mkdirSync(out, { recursive: true });
const BAN = ['틀렸', '실패', '감점', '목숨', '점수는', '순위표', '등수'];
(async () => {
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  const b = await chromium.launch({ proxy, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: W, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.addInitScript(() => { window.BO3D_TEST = true; });
  const errs = [], probs = []; let n = 0;
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  const shot = async (l) => { n++; await p.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '-' + l + '.png') }); };
  const st = () => p.evaluate(() => BO3D.story.debug.state());
  const pg = () => p.evaluate(() => BO3D.story.debug.pg());
  const need = (ok, msg) => { if (!ok) probs.push(msg); };
  const next = async () => { await p.click('.ot3 .sheet-foot .btn >> nth=-1', { timeout: 8000 }); await p.waitForTimeout(60); };
  const tap = async (text) => { await p.click('.ot3 button:has-text("' + text + '")', { timeout: 8000 }); await p.waitForTimeout(80); };
  // 화면 점검: 옆으로 넘침, 쓰지 않는 표현, 작은 단추
  const check = async (where) => {
    const r = await p.evaluate(() => {
      const box = document.querySelector('.ot3'); if (!box || box.hidden) return { hidden: true };
      const over = [...box.querySelectorAll('.sheet-body, .sheet-foot, .otmap, .ot-top')].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.className);
      const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
      const small = [...box.querySelectorAll('button')].filter((e) => vis(e) && !e.disabled).map((e) => ({ r: e.getBoundingClientRect(), t: (e.getAttribute('aria-label') || e.textContent).trim().slice(0, 20) })).filter((x) => x.r.height < 43.5 || x.r.width < 43.5).map((x) => x.t + ' ' + Math.round(x.r.width) + '×' + Math.round(x.r.height));
      const out = [...box.querySelectorAll('button, .vcard, .jnote, .arow, table, textarea, input')].filter((e) => vis(e)).filter((e) => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 || r.left < -1; }).map((e) => e.className || e.tagName);
      return { over, small, out, text: box.innerText };
    });
    if (r.hidden) { probs.push(where + ': 이야기 화면이 보이지 않음'); return; }
    if (r.over.length) probs.push(where + ': 옆으로 넘침 ' + r.over.join(','));
    if (r.out.length) probs.push(where + ': 화면 밖으로 나감 ' + r.out.join(','));
    if (r.small.length) probs.push(where + ': 누르기 어려운 단추 ' + r.small.join(' / '));
    BAN.forEach((w) => { if (r.text.includes(w)) probs.push(where + ': 쓰지 않는 표현 "' + w + '"'); });
  };

  await p.goto('file:///home/user/bible_onyou/dist/preview3d.html');
  await p.waitForTimeout(2500);
  await p.evaluate(() => document.fonts.ready);
  const canSpeak = await p.evaluate(() => BO3D.ui.canSpeak());

  // 1) 처음 화면의 설정: 글자 크기, 소리, 읽어 주기
  await p.click('.tier >> nth=' + ti);
  await p.click('.menu3 button:has-text("설정")'); await p.waitForTimeout(100);
  need((await st()).screen === 'settings', '설정: 처음 화면에서 열리지 않음');
  await shot('settings'); await check('설정');
  await p.click('.ot3 [data-set="fs2"]'); await p.waitForTimeout(80);
  need(await p.evaluate(() => document.documentElement.classList.contains('fs2')), '설정: 아주 크게를 눌러도 글자가 커지지 않음');
  await shot('settings-big'); await check('설정(아주 크게)');
  await p.click('.ot3 [data-set="snd0"]'); await p.waitForTimeout(60);
  need(await p.evaluate(() => BO3D.ui.set.snd === 0 && BO3D.fx.audio.isMuted()), '설정: 소리 끄기가 소리 장치에 닿지 않음');
  await p.click('.ot3 [data-set="snd1"]'); await p.click('.ot3 [data-set="fs0"]'); await p.waitForTimeout(60);
  need(await p.evaluate(() => !document.documentElement.classList.contains('fs2') && !BO3D.fx.audio.isMuted()), '설정: 보통·켜기로 돌아오지 않음');
  if (canSpeak && ti !== 0) { await p.click('.ot3 [data-set="read1"]'); await p.waitForTimeout(60); }
  need(await p.evaluate(() => JSON.parse(localStorage.getItem('bo3d.set.v1') || '{}').fs === 0), '설정: 이 기기에 저장되지 않음');
  await tap('돌아가기');
  need(await p.evaluate(() => document.querySelector('.ot3').hidden && !document.querySelector('.menu3').hidden), '설정: 처음 화면으로 돌아오지 않음');

  // 2) 장면 하나(OT-01)를 이야기 카드로. 첫 관문은 두 번 엇나간다
  await p.click('text=탐험 시작'); await p.waitForTimeout(300);
  while ((await st()).screen === 'intro') await next();
  await check('시대 지도'); await shot('map');
  if (canSpeak && ti === 0) {   /* 8~10세 시대 지도의 읽어 주기: 진도와 열린 시대·장면 이름만, 짧게 */
    const said = await p.evaluate(async () => { const ss = speechSynthesis, keep = ss.speak; let t = ''; ss.speak = (u) => { t = u.text; }; const b = document.querySelector('.ot3 .otmap > .speak3'); if (b) { b.click(); b.click(); } ss.speak = keep; return b ? t : null; });
    need(said !== null, '시대 지도: 8~10세인데 읽어 주기 단추가 없음');
    if (said !== null) { need(/^시대 지도\. 마친 장면 40 가운데 0/.test(said) && said.includes('하나님이 천지를 지으심') && said.length < 400, '시대 지도: 읽어 줄 글이 이상함 → ' + said.slice(0, 160)); fs.writeFileSync(path.join(out, 'speak-map.txt'), said + '\n'); }
  }
  need(await p.evaluate(() => !document.querySelector('.ot3').innerText.includes('모든 시대 열기')), '시대 지도: "모든 시대 열기"가 아이 화면에 남아 있음');
  need(await p.evaluate(() => document.querySelector('.otc[data-id="OT-05"]').classList.contains('locked')), '시대 지도: 시대 2가 처음부터 열려 있음');
  await p.click('.otc[data-id="OT-01"]'); await p.waitForTimeout(100);
  await p.waitForFunction(() => BO3D.story.debug.state().screen === 'play', null, { timeout: 8000 });
  let guard = 0, gates = 0, spoke = 0, kindsSeen = [];
  while (guard++ < 60) {
    const s = await st(); kindsSeen.push(s.k);
    const where = 'OT-01 ' + s.k + ' ' + (s.step + 1) + '/' + s.n;
    const hasSpeak = await p.evaluate(() => !!document.querySelector('.ot3 .sheet-foot .speak3'));
    if (canSpeak) { if (hasSpeak) spoke++; else probs.push(where + ': 읽어 주기 단추가 없음'); }
    if (s.k === 'arrive') {
      need(await p.evaluate(() => !!document.querySelector('.ot3 .ot-snd')), where + ': 소리 끄기 단추가 없음');
      await p.click('.ot3 .ot-snd'); need(await p.evaluate(() => BO3D.ui.set.snd === 0 && BO3D.fx.audio.isMuted()), where + ': 소리 끄기 단추가 듣지 않음');
      await p.click('.ot3 .ot-snd'); need(await p.evaluate(() => BO3D.ui.set.snd === 1 && !BO3D.fx.audio.isMuted()), where + ': 소리 켜기 단추가 듣지 않음');
      if (hasSpeak) {
        const t = await p.evaluate(() => BO3D.ui.speakText(document.querySelector('.ot3 .sheet-body')));
        need(t.length > 20 && /창세기 \d+장/.test(t) && !/창 \d+:/.test(t), where + ': 읽어 줄 글에서 장절이 풀어지지 않음 → ' + t.slice(0, 120));
        fs.writeFileSync(path.join(out, 'speak-arrive.txt'), t + '\n');
        await p.click('.ot3 .sheet-foot .speak3'); await p.waitForTimeout(50); await p.click('.ot3 .sheet-foot .speak3');
        /* 빠른 연타: 읽기 → 멈춤 → 다시 읽기. 멈춘 글의 끝 신호가 늦게 와도 단추는 "읽는 중"이어야 한다(가짜 음성으로 확인) */
        const tap3 = await p.evaluate(async () => {
          const ss = window.speechSynthesis, real = { speak: ss.speak, cancel: ss.cancel }; let curU = null;
          ss.speak = (u) => { curU = u; }; ss.cancel = () => { const u = curU; curU = null; if (u && u.onend) setTimeout(() => u.onend(), 40); };
          BO3D.ui.stopSpeak(); await new Promise((r) => setTimeout(r, 60));   /* 앞에서 누른 읽기(이 브라우저는 음성이 없어 곧바로 끝나기도 함)를 먼저 멈춘다 */
          const b = document.querySelector('.ot3 .sheet-foot .speak3'), w = (ms) => new Promise((r) => setTimeout(r, ms));
          b.click(); b.click(); b.click(); await w(120); const on = b.getAttribute('aria-pressed');
          b.click(); await w(120); const off = b.getAttribute('aria-pressed');
          ss.speak = real.speak; ss.cancel = real.cancel; return { on, off };
        });
        need(tap3.on === 'true' && tap3.off === 'false', where + ': 읽어 주기 단추를 빠르게 누르면 눌림 표시가 어긋남 ' + JSON.stringify(tap3));
      }
      await shot('arrive');
    }
    if (s.k === 'gate' || s.k === 'quest') {
      if (s.k === 'gate' && gates === 0) {   /* 맞지 않는 보기를 두 번 누른다(한 번은 공용 풀이 안에서) */
        const q = await p.evaluate(() => BO3D.story.debug.q());
        if (q.type === 'find' || q.type === 'choice') {
          await p.evaluate(async () => {
            const q = BO3D.story.debug.q(), sh = document.querySelector('.ot3 .sheet-body'), wait = () => new Promise((r) => setTimeout(r, 30));
            const rb = [...sh.querySelectorAll('.btn')].find((x) => x.textContent === '찾아서 읽었어요'); if (rb) { rb.click(); await wait(); }
            const cq = q.confirm || q, w = cq.options.filter((o) => !o.ok)[1] || cq.options.filter((o) => !o.ok)[0];
            [...sh.querySelectorAll('.opt')].find((x) => x.textContent.trim().endsWith(w.label.trim())).click(); await wait();
          });
        }
        const r = await p.evaluate(async () => {   /* 읽었어요를 이미 눌렀으므로 남은 보기에서 하나 더 엇나간 뒤 맞는 것 */
          const q = BO3D.story.debug.q(), sh = document.querySelector('.ot3 .sheet-body'), wait = () => new Promise((r) => setTimeout(r, 30)), cq = q.confirm || q;
          const el = (o) => [...sh.querySelectorAll('.opt')].find((x) => x.textContent.trim().endsWith(o.label.trim()));
          const w = cq.options.find((o) => !o.ok && !el(o).disabled); if (w) { el(w).click(); await wait(); }
          const look = !!sh.querySelector('.note.look, .note.detour');
          el(cq.options.find((o) => o.ok)).click(); await wait();
          return { look, good: !!sh.querySelector('.note.good') };
        });
        need(r.look && r.good, where + ': 엇나간 뒤 안내·통과가 되지 않음');
        await shot('gate-after-miss');
      } else { const r = await solveQ(p, false); need(r.ok && r.good, where + ': 물음을 풀지 못함'); }
      gates++;
    }
    if (s.k === 'mat') await p.evaluate(async () => { const k = BO3D.story.debug.seek(); if (k !== null) { document.querySelectorAll('.ot3 .seek-t')[k].click(); await new Promise((r) => setTimeout(r, 30)); } });
    if (s.k === 'help') { const h = await doHelp(p); need(h && h.enabled, where + ': 현장 돕기를 마치지 못함'); }
    await check(where);
    if (s.k === 'finish') break;
    await next();
  }
  await shot('finish');
  let P = await pg();
  const missKeys = Object.keys(P.q).filter((k) => P.q[k].m >= 2);
  need(missKeys.length === 1 && /^OT-01:t\d:gate0$/.test(missKeys[0]), '기록: 두 번 엇나간 물음이 기록되지 않음 ' + JSON.stringify(P.q));
  need(P.done['OT-01'] && P.done['OT-01'].at > 0, '기록: 마친 날이 없음');
  need(P.time['OT-01'] > 0, '기록: 걸린 시간이 없음');

  // 3) 탐험 일지
  await p.click('.ot3 .sheet-foot .btn >> nth=0'); await p.waitForTimeout(100);   /* 시대 지도 */
  await tap('탐험 일지');
  need((await st()).screen === 'journal', '탐험 일지: 열리지 않음');
  const cardsWant = await p.evaluate(() => BO3D.ot.scenes['OT-01'].cards.map((c) => c.ref));
  const cardsGot = await p.evaluate(() => [...document.querySelectorAll('.ot3 .vcard .r')].map((x) => x.textContent));
  need(JSON.stringify(cardsWant) === JSON.stringify(cardsGot), '탐험 일지: 말씀 카드가 마친 장면의 카드와 다름 ' + cardsGot.join(','));
  need(await p.evaluate(() => ![...document.querySelectorAll('.ot3 .vcard')].some((x) => x.innerText.length > 120)), '탐험 일지: 말씀 카드에 장절·제목 말고 긴 글이 있음');
  await shot('journal-cards'); await check('탐험 일지(말씀 카드)');
  await p.click('.ot3 [data-tab="photos"]'); await p.waitForTimeout(80);
  need(await p.evaluate(() => !!document.querySelector('.ot3 .jempty')), '탐험 일지: 사진이 없을 때 안내가 없음');
  // 사진 도감에 사진 한 장을 넣어 본다(3D에서 찍을 때 game.js가 부르는 것과 같은 길)
  await p.evaluate(() => {
    const c = document.createElement('canvas'); c.width = c.height = 176; const x = c.getContext('2d'); x.fillStyle = '#6FA8DC'; x.fillRect(0, 0, 176, 176); x.fillStyle = '#C9A769'; x.fillRect(30, 90, 116, 60);
    BO3D.story.saveShot('OT-03', { id: 'ark', name: '방주', desc: '길이 삼백, 너비 오십, 높이 삼십 규빗에 삼 층으로 지은 방주', ref: '창 6:15-16' }, c.toDataURL('image/jpeg', 0.72));
    BO3D.story.openJournal('photos');
  });
  await p.waitForTimeout(80);
  need(await p.evaluate(() => { const c = document.querySelector('.ot3 .dexcell'); return !!c && !!c.querySelector('img') && c.innerText.includes('방주') && c.innerText.includes('창 6:15-16'); }), '탐험 일지: 사진 도감에 사진·설명·장절이 보이지 않음');
  need(await p.evaluate(() => BO3D.story.shots('OT-03').ark.indexOf('data:image/jpeg') === 0), '사진 도감: 3D 장면에 돌려줄 사진이 없음');
  await shot('journal-photos'); await check('탐험 일지(사진 도감)');
  await p.click('.ot3 [data-tab="notes"]'); await p.waitForTimeout(80);
  need(await p.evaluate(() => document.querySelectorAll('.ot3 .jnote').length === 1), '탐험 일지: 내 기록에 마친 장면이 없음');
  if (ti === 2) {
    await p.fill('.ot3 .jnote textarea', '일지에서 고쳐 쓴 기록'); await p.waitForTimeout(50);
    need((await pg()).notes['OT-01'] === '일지에서 고쳐 쓴 기록', '탐험 일지: 기록을 고쳐도 저장되지 않음');
  }
  await shot('journal-notes'); await check('탐험 일지(내 기록)');
  await tap('시대 지도');

  // 4) 부모·교사 화면
  await tap('부모·교사 화면');
  need((await st()).screen === 'adultgate', '부모·교사 화면: 어른 확인 없이 열림');
  await shot('adult-gate'); await check('어른 확인');
  await p.fill('#adult-in', '1'); await tap('확인');
  need((await st()).screen === 'adultgate' && await p.evaluate(() => document.querySelector('.ot3').innerText.includes('답이 달라요')), '어른 확인: 다른 답으로도 열림');
  await p.fill('#adult-in', String(await p.evaluate(() => BO3D.story.debug.adultAnswer()))); await tap('확인');
  need((await st()).screen === 'adult', '부모·교사 화면: 맞는 답으로 열리지 않음');
  const adult = await p.evaluate(() => document.querySelector('.ot3').innerText);
  need(adult.includes('마친 장면 1 / 40'), '부모·교사 화면: 진도가 맞지 않음');
  need(cardsWant.every((r) => adult.includes(r)), '부모·교사 화면: 찾은 구절(장절)이 빠짐');
  need(adult.includes('엇나간 횟수 2'), '부모·교사 화면: 여러 번 엇나간 물음이 보이지 않음');
  need(/01 .+\n?.*\d+(초|분)/.test(adult), '부모·교사 화면: 장면별 걸린 시간이 보이지 않음');
  await shot('adult'); await check('부모·교사 화면');
  await p.evaluate(() => { document.querySelector('.ot3 .otmap').scrollTop = 600; }); await shot('adult-2');
  await p.evaluate(() => { document.querySelector('.ot3 .otmap').scrollTop = 99999; }); await shot('adult-3');
  await tap('모든 시대 열기');
  need((await pg()).unlockAll === true, '부모·교사 화면: 모든 시대 열기가 듣지 않음');
  // 내보내기 → 지우기 → 가져오기
  await tap('내보낼 글 만들기');
  const code = await p.evaluate(() => document.querySelector('.ot3 textarea.movet[readonly]').value);
  need(/^BO1:[A-Za-z0-9+/=]+$/.test(code), '내보내기: 글이 만들어지지 않음');
  need(!/[가-힣]/.test(code), '내보내기: 글에 읽을 수 있는 글자가 그대로 들어 있음');
  const before = await pg();
  await tap('이 기기의 진행 지우기'); need(Object.keys((await pg()).done).length === 1, '지우기: 한 번 눌렀는데 지워짐'); await tap('정말 지울까요');
  P = await pg(); need(Object.keys(P.done).length === 0 && Object.keys(P.mats).length === 0, '지우기: 두 번 눌러도 지워지지 않음');
  await p.fill('.ot3 textarea.movet:not([readonly])', '아무 글'); await tap('가져올 글 확인');
  need(await p.evaluate(() => document.querySelector('.ot3').innerText.includes('글을 알아볼 수 없어요')), '가져오기: 엉뚱한 글을 받아들임');
  await p.fill('.ot3 textarea.movet:not([readonly])', '앞에 붙은 글 ' + code.slice(0, 40) + '\n' + code.slice(40) + ' '); await tap('가져올 글 확인');
  need(await p.evaluate(() => document.querySelector('.ot3').innerText.includes('마친 장면 1')), '가져오기: 확인 글에 가져올 진행이 보이지 않음');
  await shot('import-confirm');
  await tap('이 진행으로 바꾸기');
  P = await pg();
  need(JSON.stringify(P.done) === JSON.stringify(before.done) && JSON.stringify(P.mats) === JSON.stringify(before.mats) && JSON.stringify(P.notes) === JSON.stringify(before.notes) && P.unlockAll === true && JSON.stringify(P.time) === JSON.stringify(before.time), '가져오기: 진행이 내보낸 것과 다름');
  need(Object.keys(P.q).length === Object.keys(before.q).length, '가져오기: 엇나간 기록이 다름');
  await check('부모·교사 화면(가져온 뒤)');
  // 나쁜 글(모르는 장면, 긴 글)은 걸러진다
  const bad = await p.evaluate(() => { const c = 'BO1:' + btoa(unescape(encodeURIComponent(JSON.stringify({ v: 1, pg: { done: { 'OT-99': { t: 't1' }, 'OT-02': { t: 'zz', at: 5 } }, mats: { 'OT-01:없는것': 1 }, notes: { 'OT-02': 'x'.repeat(5000), 'OT-77': 'y' }, q: { '<img>': { m: 3 } } } })))); const o = BO3D.story.debug.parseCode(c); return { done: Object.keys(o.done), t: o.done['OT-02'].t, mats: Object.keys(o.mats).length, note: o.notes['OT-02'].length, notes: Object.keys(o.notes).length, q: Object.keys(o.q).length }; });
  need(bad.done.join() === 'OT-02' && bad.t === 't2' && bad.mats === 0 && bad.note === 2000 && bad.notes === 1 && bad.q === 0, '가져오기: 모르는 장면·재료·긴 글을 거르지 못함 ' + JSON.stringify(bad));
  await tap('놀이 기록'); need((await st()).screen === 'log', '놀이 기록: 열리지 않음'); await check('놀이 기록'); await shot('log');
  await tap('시대 지도');
  need(await p.evaluate(() => !document.querySelector('.otc[data-id="OT-05"]').classList.contains('locked')), '시대 지도: 모든 시대 열기 뒤에도 시대 2가 잠겨 있음');
  need(await p.evaluate(() => !BO3D.story.debug.dex()['OT-03']), '지우기: 사진 도감이 지워지지 않음');
  await p.evaluate(() => BO3D.story.saveShot('OT-03', { id: 'ark', name: '방주', desc: '길이 삼백, 너비 오십, 높이 삼십 규빗에 삼 층으로 지은 방주', ref: '창 6:15-16' }, ''));
  // 다시 열어도(새로 고침) 기록이 남아 있다
  await p.reload(); await p.waitForTimeout(2000);
  P = await pg(); need(P.done['OT-01'] && Object.keys(P.q).length >= 1, '새로 고침 뒤 기록이 사라짐');
  need(await p.evaluate(() => !!BO3D.story.debug.dex()['OT-03']), '새로 고침 뒤 사진 도감이 사라짐');

  console.log('단계', ti, '· 폭', W, '· 지나온 화면', kindsSeen.join('>'), '· 읽어 주기 단추', canSpeak ? spoke + '/' + kindsSeen.length : '이 브라우저에는 음성이 없음', '· 찍은 화면', n);
  console.log('문제', probs.length, probs.slice(0, 40).join('\n'));
  console.log('오류', errs.length, errs.slice(0, 10).join('\n'));
  await b.close();
  process.exit(probs.length || errs.length ? 1 : 0);
})();
