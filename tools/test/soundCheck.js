// 소리 점검(play 갈래): 이야기 카드의 분위기 소리(물·센 바람·밤·무리)를 화면 없는 소리 장치로 6초씩 만들어 크기를 재고,
// 장면에 들어가면 표(story.js AMB)대로 켜지고 지도로 나오면 꺼지는지, 단추 소리·소리 끄기가 듣는지 본다.
// 사용: node tools/test/soundCheck.js <저장 폴더>     (저장 폴더에 들어 볼 수 있는 wav 파일을 남긴다)
// 귀로 듣는 확인은 아니다. 조용하지 않은지, 찢어지게 크지 않은지(최댓값), 종류마다 높낮이가 다른지만 숫자로 본다.
const { chromium } = require('playwright');
const path = require('path');
const doHelp = require('./lib/help.js');
const fs = require('fs');
const out = process.argv[2] || '/tmp/soundCheck';
fs.mkdirSync(out, { recursive: true });
function wav(samples, rate) {
  const b = Buffer.alloc(44 + samples.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + samples.length * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((v, i) => b.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(v * 32767))), 44 + i * 2));
  return b;
}
(async () => {
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  const b = await chromium.launch({ proxy, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })).newPage();
  await p.addInitScript(() => { window.BO3D_TEST = true; });
  const errs = [], probs = [];
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  const need = (ok, msg) => { if (!ok) probs.push(msg); };
  await p.goto('file:///home/user/bible_onyou/dist/preview3d.html');
  await p.waitForTimeout(2500);

  // 1) 종류마다 6초를 만들어 잰다
  const rows = [];
  for (const kind of ['water', 'gale', 'night', 'crowd']) {
    const r = await p.evaluate(async (kind) => {
      const A = BO3D.fx.audio, rate = 22050, sec = 6, c = new OfflineAudioContext(1, rate * sec, rate);
      const a = A.ambBuild(c, c.destination, kind); a.out.gain.value = a.level;
      if (kind === 'night') A.ambChirps(c, a.out, 0, sec);
      const buf = await c.startRendering(), d = buf.getChannelData(0);
      let peak = 0, sq = 0, zc = 0, lo = 0, hi = 0;
      for (let i = rate; i < d.length; i++) { const v = d[i]; peak = Math.max(peak, Math.abs(v)); sq += v * v; if (i && (d[i - 1] < 0) !== (v < 0)) zc++; }
      const n = d.length - rate, rms = Math.sqrt(sq / n);
      /* 1초마다의 크기(커졌다 작아지는지) */
      const sec1 = []; for (let s = 1; s < sec; s++) { let q = 0; for (let i = s * rate; i < (s + 1) * rate; i++) q += d[i] * d[i]; sec1.push(Math.sqrt(q / rate)); }
      return { kind, peak, rms, zcHz: zc / 2 / (n / rate), swing: Math.max(...sec1) / Math.max(1e-9, Math.min(...sec1)), data: Array.from(d) };
    }, kind);
    fs.writeFileSync(path.join(out, kind + '.wav'), wav(r.data, 22050));
    rows.push(r);
    need(r.rms > 0.004, kind + ': 너무 작다(rms ' + r.rms.toFixed(4) + ')');
    need(r.rms < 0.3, kind + ': 너무 크다(rms ' + r.rms.toFixed(4) + ')');
    need(r.peak < 0.95, kind + ': 소리가 찢어질 만큼 크다(최댓값 ' + r.peak.toFixed(2) + ')');
    console.log(kind.padEnd(6), '· 평균 크기', r.rms.toFixed(4), '· 최댓값', r.peak.toFixed(3), '· 높낮이(영점 지나는 수)', Math.round(r.zcHz) + 'Hz', '· 커졌다 작아짐', r.swing.toFixed(2) + '배');
  }
  const z = Object.fromEntries(rows.map((r) => [r.kind, r.zcHz]));
  need(z.night > z.crowd || z.crowd > z.water, '종류마다 높낮이가 다르지 않다 ' + JSON.stringify(z));

  // 2) 장면에 들어가면 표대로 켜지고, 나오면 꺼진다
  const amb = await p.evaluate(() => BO3D.story.debug.amb());
  const known = ['water', 'gale', 'night', 'crowd'];
  need(Object.values(amb).every((v) => Object.keys(v.on).every((k) => known.includes(k)) && /^\S+ \d+:\d+/.test(v.basis)), '분위기 소리 표에 모르는 종류나 장절 없는 줄이 있다');
  const nb = await p.evaluate(() => Object.fromEntries(Object.keys(BO3D.story.debug.amb()).map((id) => [id, BO3D.ot.scenes[id].beats.length])));
  need(Object.keys(amb).every((id) => Object.values(amb[id].on).every((a) => a.every((i) => i >= 0 && i < nb[id]))), '분위기 소리 표에 없는 대목 번호가 있다');
  await p.click('.tier >> nth=1'); await p.click('text=탐험 시작'); await p.waitForTimeout(200);
  while ((await p.evaluate(() => BO3D.story.debug.state().screen)) === 'intro') { await p.click('.ot3 .sheet-foot .btn >> nth=-1'); await p.waitForTimeout(50); }
  await p.evaluate(() => { BO3D.story.debug.unlockAll(); BO3D.story.openMap(); });
  for (const id of ['OT-11', 'OT-02', 'OT-21']) {
    await p.evaluate((id) => BO3D.story.play(id), id); await p.waitForTimeout(200);
    need((await p.evaluate(() => BO3D.fx.audio.ambState())).on.length === 0, id + ': 도착 화면에서 분위기 소리가 켜져 있다');
    let guard = 0, seen = [];
    while (guard++ < 40) {
      const st = await p.evaluate(() => BO3D.story.debug.state());
      if (st.k !== 'arrive' && st.k !== 'beat' && st.k !== 'talk' && st.k !== 'help') break;
      const s = await p.evaluate(() => BO3D.fx.audio.ambState());
      if (st.k === 'beat') {
        const bi = await p.evaluate(() => { const c = BO3D.story.debug.state(); let n = -1; for (let i = 0; i <= c.step; i++) if (BO3D.story.debug.stepKind(i) === 'beat') n++; return n; });
        const want = Object.keys((amb[id] || { on: {} }).on).filter((k) => amb[id].on[k].includes(bi)).join();
        need(s.on.join() === want, id + ' 대목 ' + bi + ': 켜진 소리가 표와 다르다 (' + s.on.join() + ' ≠ ' + want + ')');
        seen.push(bi + ':' + (s.on.join('+') || '-'));
      }
      if (st.k === 'help') await doHelp(p);
      await p.click('.ot3 .sheet-foot .btn >> nth=-1'); await p.waitForTimeout(60);
    }
    need((await p.evaluate(() => BO3D.fx.audio.ambState())).on.length === 0, id + ': 관문에서 분위기 소리가 꺼지지 않는다');
    console.log(id, '· 대목별 분위기 소리', seen.join(' '));
    await p.evaluate(() => BO3D.story.openMap()); await p.waitForTimeout(80);
  }
  // 3) 소리 끄기
  await p.evaluate(() => { BO3D.ui.set.snd = 0; BO3D.ui.saveSet(); });
  need(await p.evaluate(() => BO3D.fx.audio.isMuted()), '소리 끄기 설정이 소리 장치에 닿지 않는다');
  await p.evaluate(() => { BO3D.fx.audio.tick(); BO3D.ui.set.snd = 1; BO3D.ui.saveSet(); BO3D.fx.audio.tick(); });
  need(!(await p.evaluate(() => BO3D.fx.audio.isMuted())), '소리 켜기가 듣지 않는다');
  // 4) 만들지 않는 소리: 낭독·음성에 쓰일 수 있는 장치가 소리 묶음에 없다
  const names = await p.evaluate(() => Object.keys(BO3D.fx.audio));
  need(!names.some((n) => /voice|speech|hymn|psalm|sing/i.test(n)), '소리 묶음에 음성·찬송으로 읽히는 이름이 있다: ' + names.join(','));

  console.log('문제', probs.length, probs.join('\n'));
  console.log('오류', errs.length, errs.slice(0, 10).join('\n'));
  await b.close();
  process.exit(probs.length || errs.length ? 1 : 0);
})();
