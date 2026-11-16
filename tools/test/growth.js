// 성장 시스템(탐험대 장비) 자동 점검 — docs/14 보완 2차의 시험 가운데 이야기 카드와 순수 규칙으로 볼 수 있는 것.
// 사용: node tools/test/growth.js [저장 폴더]
// T12 빛 규칙 표 · T15 보기 섞기 분포 · T28 스캔 경계 · T29 섞은 보기 채점(388문항) · T1·T7 첫 장면 보상과 반복 · T2 4장면 책갈피
// T3 8장면 스캔 · T5 미구현 단계 숨김 · T8 모든 시대 열기 · T9 새로고침 · T10 옛 저장 자료 · T11·T22 저장 실패 · T25 책갈피 이력
// (3D의 T4·T6·T13·T14·T20·T21·T23·T24는 walk3dScene.js·walk3d.js·walkJ.js의 GROWTH 줄로 본다.)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const doHelp = require('./lib/help.js');
const GR = require('./lib/growth.js');
const out = process.argv[2] || '/tmp/growth';
fs.mkdirSync(out, { recursive: true });
const URL = 'file:///home/user/bible_onyou/dist/preview3d.html';
const LATER = ['지도 통', '허리 파우치', '망원경', '완성 장비', '배낭 램프', '시간 잔광', '놋쇠 장식선', '시대 연표', '모아 보기', '인쇄본', '아카이브', '4단계', '14장면', '22장면', '30장면'];
const probs = [], log = [];
const ok = (cond, where, what) => { if (!cond) probs.push(where + ': ' + what); return !!cond; };

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  let shots = 0;
  async function open(label, opt) {
    opt = opt || {};
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    p.errs = [];
    p.on('pageerror', (e) => p.errs.push('pageerror: ' + e.message));
    p.on('console', (m) => { if (m.type() === 'error') p.errs.push('console: ' + m.text()); });
    await p.addInitScript(() => { window.BO3D_TEST = true; });
    if (opt.failStore) await p.addInitScript(() => { Storage.prototype.setItem = function () { throw new Error('QuotaExceededError(시험)'); }; });
    if (opt.seed !== undefined) await GR.seed(p, opt.seed, opt.seedOpt || {});
    p.label = label;
    await p.goto(URL); await p.waitForTimeout(2200);
    await p.evaluate(() => document.fonts.ready);
    return p;
  }
  const shot = async (p, l) => { shots++; await p.screenshot({ path: path.join(out, String(shots).padStart(2, '0') + '-' + p.label + '-' + l + '.png') }); };
  const st = (p) => p.evaluate(() => BO3D.story.debug.state());
  const next = async (p) => { await p.click('.ot3 .sheet-foot .btn >> nth=-1', { timeout: 8000 }); await p.waitForTimeout(60); };
  async function toMap(p, ti) {
    await p.click('.tier >> nth=' + ti);
    await p.click('text=탐험 시작'); await p.waitForTimeout(300);
    for (let i = 0; i < 10 && (await st(p)).screen === 'intro'; i++) await next(p);
    await p.waitForTimeout(100);
  }
  const mapText = (p) => p.evaluate(() => document.querySelector('.ot3').innerText);
  /* 이야기 카드로 한 장면을 끝까지. scan이면 재료 찾기에서 [탐지기 스캔]을 먼저 눌러 본다 */
  async function play(p, id, o) {
    o = o || {};
    await p.evaluate(() => BO3D.story.debug.unlockAll());
    await p.evaluate((sid) => BO3D.story.openScene(sid), id); await p.waitForTimeout(120);
    let s = await st(p);
    if (s.screen === 'era') { await p.click('.ot3 .sheet-foot .btn:has-text("첫 장면으로")'); await p.waitForTimeout(80); s = await st(p); }
    if (s.screen === 'pick') { await p.click('.ot3 .sheet-foot .btn:has-text("이야기 카드로")'); await p.waitForTimeout(80); }
    await p.waitForFunction(() => BO3D.story.debug.state().screen === 'play', null, { timeout: 8000 });
    const res = { scan: null };
    for (let guard = 0; guard < 70; guard++) {
      s = await st(p);
      const where = p.label + ' ' + id + ' ' + s.k;
      if (s.k === 'gate' || s.k === 'quest') {
        const r = await p.evaluate(async () => {
          const q = BO3D.story.debug.q(), sh = document.querySelector('.ot3 .sheet-body'), w = () => new Promise((r) => setTimeout(r, 30));
          const opts = () => [...sh.querySelectorAll('.opt')];
          const pick = async (lb) => { const o = opts().find((x) => x.textContent.trim().endsWith(lb.trim())); if (!o) return false; o.click(); await w(); return true; };
          const readBtn = async () => { const rb = [...sh.querySelectorAll('.btn')].find((x) => x.textContent === '찾아서 읽었어요'); if (rb) { rb.click(); await w(); } };
          if (q.type === 'choice') await pick(q.options.find((o) => o.ok).label);
          else if (q.type === 'find') { await readBtn(); await pick(q.confirm.options.find((o) => o.ok).label); }
          else if (q.type === 'multi') { await readBtn(); for (const it of q.confirm.options.filter((x) => x.ok)) await pick(it.label); [...sh.querySelectorAll('.btn')].find((x) => x.textContent === '다 골랐어요').click(); await w(); }
          else if (q.type === 'order') { for (const it of q.items) await pick(it); }
          else if (q.type === 'match') { for (const pr of q.pairs) { [...sh.querySelectorAll('.match3 .mref')].find((x) => x.textContent.trim().endsWith(pr.ref)).click(); await w(); [...sh.querySelectorAll('.match3 .mtext')].find((x) => x.textContent.trim() === pr.text.trim()).click(); await w(); } }
          else if (q.type === 'findref') { const ins = sh.querySelectorAll('.refin input'), cv = q.accept[0].split(':'); ins[0].value = cv[0]; ins[1].value = cv[1]; sh.querySelector('.refin .btn').click(); await w(); }
          return { type: q.type, good: !!sh.querySelector('.note.good') };
        });
        ok(r.good, where, '물음(' + r.type + ')을 풀지 못함');
      }
      if (s.k === 'mat') {
        const r = await p.evaluate(async (scan) => {
          const k = BO3D.story.debug.seek(); if (k === null) return { skip: 1 };
          const w = () => new Promise((r) => setTimeout(r, 40));
          const t = () => [...document.querySelectorAll('.ot3 .seek-t')], sb = document.querySelector('.ot3 .scanbtn');
          const out = { hasScan: !!sb };
          if (scan && sb) { sb.click(); await w(); out.lit = t().map((x, i) => (x.classList.contains('scan') ? i : -1)).filter((i) => i >= 0); out.spot = k; out.msg = document.querySelector('.ot3 .seek-msg').textContent; }
          t()[k].click(); await w();
          out.got = !!document.querySelector('.ot3 .matcard');
          return out;
        }, !!o.scan);
        if (!r.skip) { ok(r.got, where, '숨은 재료를 찾지 못함'); if (res.scan === null) res.scan = r; }
      }
      if (s.k === 'help') { const h = await doHelp(p); ok(h && h.enabled && h.good && h.said, where, '현장 돕기를 마치지 못함'); }
      if (s.k === 'finish') break;
      await next(p);
    }
    s = await st(p);
    ok(s.k === 'finish', p.label + ' ' + id, '마무리까지 가지 못함 ' + s.k);
    res.finish = await p.evaluate(() => {
      const box = document.querySelector('.ot3'), g = box.querySelector('.gearnew');
      const ba = g && g.querySelector('.gear-ba');
      return { gear: g ? g.innerText.replace(/\s+/g, ' ') : null, gears: box.querySelectorAll('.gearnew').length, text: box.innerText,
        ba: ba ? { imgs: [...ba.querySelectorAll('img')].filter((i) => i.src.startsWith('data:image/png') && i.naturalWidth > 0).length, ring: !!ba.querySelector('.ba-ring') } : null };
    });
    return res;
  }
  const toMapBtn = async (p) => { await p.evaluate(() => BO3D.story.openMap()); await p.waitForTimeout(150); };
  const head = (p) => p.evaluate(() => { const h = document.querySelector('.gearhead'); return h ? h.innerText.replace(/\s+/g, ' ') : null; });
  const G = (p, f) => p.evaluate(f);

  /* ── 순수 규칙: T12 빛 규칙 표, T28 스캔 경계, T15 보기 섞기 분포, T29 섞은 보기 채점 ── */
  {
    const p = await open('rule');
    const r = await p.evaluate(() => {
      const g = BO3D.growth, base = { stage: 3, fx: true, state: 'explore', overlayOpen: false, sceneAura: 'on', figuresReady: true, nearFigure: 20, inQuiet: false, visible: true, reduced: false };
      const C = (o, want, dim) => { const c = Object.assign({}, base, o), r = g.auraRule(c); return { c: JSON.stringify(o), want, got: r.on, dim: r.dim, wantDim: dim, pass: r.on === want && (dim === undefined || !!r.dim === dim) }; };
      const rows = [
        C({}, true, false), C({ state: 'free' }, true, false), C({ stage: 0 }, false), C({ stage: 1 }, false), C({ stage: 2 }, false), C({ stage: 3 }, true),
        C({ fx: false }, false), C({ state: 'event' }, false), C({ state: 'caption' }, false), C({ state: 'quiz' }, false), C({ state: 'lookup' }, false),
        C({ state: 'vision' }, false), C({ state: 'gates' }, false), C({ state: 'end' }, false), C({ state: 'end2' }, false), C({ state: 'den' }, false),
        C({ state: 'depart' }, false), C({ state: 'route' }, false), C({ state: 'deduce' }, false), C({ state: 'seg' }, false), C({ state: 'story' }, false),
        C({ state: 'menu' }, false), C({ overlayOpen: true }, false), C({ sceneAura: 'off' }, false), C({ sceneAura: 'dim' }, true, true),
        C({ figuresReady: false }, false), C({ nearFigure: 5.99 }, false), C({ nearFigure: 6 }, true), C({ nearFigure: 0 }, false), C({ nearFigure: Infinity }, true),
        C({ inQuiet: true }, false), C({ visible: false }, false), C({ reduced: true }, true, true), C({ sceneAura: 'dim', reduced: true }, true, true),
        C({ state: 'explore', stage: 3, fx: false, sceneAura: 'dim' }, false)
      ];
      const scan = []; let scanBad = 0;
      for (let spot = 0; spot < 6; spot++) for (let s = 0; s < 300; s++) {
        const set = g.scanSet('OT-' + s + ':k' + (s % 7), spot);
        const okk = set.length === 3 && set.indexOf(spot) >= 0 && new Set(set).size === 3 && set.every((x) => x >= 0 && x <= 5);
        if (!okk) { scanBad++; if (scan.length < 5) scan.push({ spot, set }); }
      }
      /* T15: 단일 정답 물음(choice·find의 확인)마다 화면 차례에서 정답 자리 */
      const pos = {}, U = BO3D.ui, QS = [];
      BO3D.ot.order.forEach((id) => {
        const d = BO3D.ot.scenes[id];
        ['t1', 't2', 't3'].forEach((t) => {
          (d.gates[t] || []).forEach((q, i) => QS.push({ id, t, w: 'gates.' + t + '[' + i + ']', q }));
          (d.quests || []).forEach((x, i) => x.q && x.q[t] && QS.push({ id, t, w: 'quests[' + i + '].' + t, q: x.q[t] }));
          (((d.mission || {}).help || {}).steps || []).forEach((h, i) => h.read && h.read[t] && QS.push({ id, t, w: 'help[' + i + '].read.' + t, q: h.read[t] }));
        });
      });
      let single = 0, multi = 0;
      QS.forEach((x) => {
        const cq = x.q.type === 'choice' ? x.q : (x.q.type === 'find' ? x.q.confirm : null);
        if (x.q.type === 'multi') multi++;
        if (!cq || cq.options.filter((o) => o.ok).length !== 1) return;
        single++;
        const sh = U.shuffled(cq.options, U.optKey(cq)), n = sh.length, k = sh.findIndex((o) => o.ok);
        pos[n] = pos[n] || []; pos[n][k] = (pos[n][k] || 0) + 1;
        /* 길이: 섞은 뒤에도 정답이 가장 긴 보기(띄어쓰기 뺀 글자)인 비율 */
        const L = (s) => s.replace(/\s/g, '').length, al = L(sh[k].label), mx = Math.max(...sh.filter((o) => !o.ok).map((o) => L(o.label)));
        pos.longest = (pos.longest || 0) + (al > mx ? 1 : 0);
      });
      return { rows, scanBad, scan, pos, single, multi, nq: QS.length };
    });
    const bad = r.rows.filter((x) => !x.pass);
    ok(r.rows.length >= 20 && !bad.length, 'T12 빛 규칙 표', bad.length + '/' + r.rows.length + ' 어긋남 ' + JSON.stringify(bad.slice(0, 4)));
    log.push('T12 빛 규칙 표: ' + (r.rows.length - bad.length) + '/' + r.rows.length + ' 기대값');
    ok(!r.scanBad, 'T28 스캔 경계', r.scanBad + '건 ' + JSON.stringify(r.scan));
    log.push('T28 스캔 경계: 숨은 자리 6경우 × 300 = 1800번, 세 곳 안에 숨은 자리 ' + (1800 - r.scanBad) + '/1800');
    const p3 = r.pos[3] || [], tot3 = p3.reduce((a, c) => a + (c || 0), 0);
    const pct = [0, 1, 2].map((k) => Math.round(1000 * (p3[k] || 0) / tot3) / 10);
    ok(pct.every((v) => v >= 25 && v <= 45), 'T15 보기 섞기', '정답 자리 ' + pct.join('/') + '%');
    log.push('T15 보기 섞기: 단일 정답 ' + r.single + '문항(3보기 ' + tot3 + ') 정답 자리 1·2·3번째 = ' + pct.join('% · ') + '% · 다른 보기 수 ' + JSON.stringify(Object.keys(r.pos).filter((k) => k !== '3' && k !== 'longest')) + ' · 섞은 뒤 정답이 가장 긴 보기 ' + r.pos.longest + '/' + r.single);

    /* T29: 화면 차례로 그려서 맞는 보기만 고르면 통과, 틀린 보기면 basis에 맞는 안내(엇나간 바늘 / 성경에서 확인) */
    const t29 = await p.evaluate(async () => {
      const U = BO3D.ui, w = () => new Promise((r) => setTimeout(r, 0)), probs = [];
      let nSingle = 0, nMulti = 0, nWrong = 0, nDetour = 0;
      const box = document.createElement('div'); box.style.cssText = 'position:fixed;left:-9999px;top:0;width:360px'; document.body.appendChild(box);
      for (const id of BO3D.ot.order) {
        const d = BO3D.ot.scenes[id]; U.setScene(d);
        for (const t of ['t1', 't2', 't3']) {
          const qs = [];
          (d.gates[t] || []).forEach((q, i) => qs.push(['gates.' + t + '[' + i + ']', q]));
          (d.quests || []).forEach((x, i) => x.q && x.q[t] && qs.push(['quests[' + i + '].' + t, x.q[t]]));
          (((d.mission || {}).help || {}).steps || []).forEach((h, i) => h.read && h.read[t] && qs.push(['help[' + i + '].read.' + t, h.read[t]]));
          for (const [wq, q] of qs) {
            const where = id + ' ' + wq;
            if (q.type !== 'choice' && q.type !== 'find' && q.type !== 'multi') continue;
            const cq = q.type === 'choice' ? q : q.confirm;
            if (q.type !== 'multi' && cq.options.filter((o) => o.ok).length !== 1) continue;
            /* 틀린 보기마다 새로 그려서 하나씩 눌러 본다 */
            const wrongs = cq.options.filter((o) => !o.ok);
            for (const wo of wrongs) {
              let passed = false; box.replaceChildren(); U.add(box, U.blockFor(q, () => { passed = true; }, 'g29'));
              const rb = [...box.querySelectorAll('.btn')].find((x) => x.textContent === '찾아서 읽었어요'); if (rb) { rb.click(); await w(); }
              const el = [...box.querySelectorAll('.opt')].find((x) => x.textContent.trim().endsWith(wo.label.trim()));
              if (!el) { probs.push(where + ': 보기를 화면에서 찾지 못함 ' + wo.label); continue; }
              el.click(); await w();
              if (q.type === 'multi') { [...box.querySelectorAll('.btn')].find((x) => x.textContent === '다 골랐어요').click(); await w(); }
              nWrong++;
              const real = wo.basis && wo.basis !== '본문에 없음', det = box.querySelector('.note.detour'), look = box.querySelector('.note.look');
              if (passed || box.querySelector('.note.good')) probs.push(where + ': 틀린 보기인데 통과 ' + wo.label);
              if (real) { if (!det || det.innerText.indexOf(U.bookName(wo.basis)) < 0) probs.push(where + ': 엇나간 바늘이 basis(' + wo.basis + ')를 가리키지 않음'); else nDetour++; }
              else if (!look || det) probs.push(where + ': "성경에서 확인" 안내가 없음');
            }
            /* 맞는 보기만 */
            let passed = false; box.replaceChildren(); U.add(box, U.blockFor(q, () => { passed = true; }, 'g29'));
            const rb = [...box.querySelectorAll('.btn')].find((x) => x.textContent === '찾아서 읽었어요'); if (rb) { rb.click(); await w(); }
            for (const o of cq.options.filter((x) => x.ok)) { const el = [...box.querySelectorAll('.opt')].find((x) => x.textContent.trim().endsWith(o.label.trim())); if (el) { el.click(); await w(); } }
            if (q.type === 'multi') { [...box.querySelectorAll('.btn')].find((x) => x.textContent === '다 골랐어요').click(); await w(); nMulti++; } else nSingle++;
            if (!box.querySelector('.note.good')) probs.push(where + ': 맞는 보기를 골랐는데 통과하지 못함');
            if (q.type !== 'multi' && !passed) probs.push(where + ': 통과 알림(onOk)이 오지 않음');
          }
        }
      }
      box.remove();
      return { probs, nSingle, nMulti, nWrong, nDetour };
    });
    t29.probs.slice(0, 20).forEach((x) => probs.push('T29 ' + x));
    log.push('T29 섞은 보기 채점: 단일 정답 ' + t29.nSingle + ' · 여러 개 고르기 ' + t29.nMulti + ' · 틀린 보기 ' + t29.nWrong + '번 눌러 봄(엇나간 바늘 ' + t29.nDetour + ') · 문제 ' + t29.probs.length);
    ok(!p.errs.length, 'rule', p.errs.slice(0, 3).join(' | '));
    await p.context().close();
  }

  /* ── T1·T7·T26: 빈 저장에서 첫 장면 → 1단계, 같은 장면 다시 → 알림 없음 ── */
  {
    const p = await open('t1');
    await toMap(p, 1);
    const h0 = await head(p);
    const m0 = await p.evaluate(() => ({ on: document.querySelectorAll('.ot3 .rm-machine .mp.on').length, all: document.querySelectorAll('.ot3 .rm-machine .mp').length, fixed: BO3D.story.progressSummary().fixedEras }));
    ok(m0.all === 10 && m0.on === m0.fixed, 'T1 타임머신 그림(보완 3차 ⑤)', JSON.stringify(m0));
    ok(h0 && h0.includes('0단계') && h0.includes('탐험 모자까지 1장면'), 'T1 지도 머리(시작)', h0);
    const r = await play(p, 'OT-01');
    ok(r.finish.gears === 1 && /탐험 모자/.test(r.finish.gear || ''), 'T1 마침 화면', '새 장비 카드 ' + r.finish.gears + ' ' + r.finish.gear);
    ok(r.finish.ba && r.finish.ba.imgs === 2 && r.finish.ba.ring, 'T1 전후 그림(보완 3차 ④)', JSON.stringify(r.finish.ba));
    await shot(p, 'finish');
    await toMapBtn(p);
    const h1 = await head(p);
    ok(h1 && h1.includes('1단계') && h1.includes('탐험대 깃발까지 3장면'), 'T1 지도 머리(1단계)', h1);
    await shot(p, 'map');
    await p.evaluate(() => BO3D.story.openRecord('cards')); await p.waitForTimeout(100);
    const nc = await p.evaluate(() => ({ shown: document.querySelectorAll('.ot3 .vcard').length, want: BO3D.ot.scenes['OT-01'].cards.length }));
    ok(nc.shown === nc.want && nc.want > 0, 'T1 기록장 말씀 카드', JSON.stringify(nc));
    await shot(p, 'record-cards');
    await p.evaluate(() => BO3D.story.openRecord('scenes')); await p.waitForTimeout(100);
    const sc = await p.evaluate(() => document.querySelectorAll('.ot3 .rec-row').length);
    ok(sc === 1, 'T1 기록장 마친 장면', sc + '줄');
    const r2 = await play(p, 'OT-01');
    ok(r2.finish.gears === 0, 'T7 반복 완료', '새 장비 카드 ' + r2.finish.gears);
    const s2 = await G(p, () => ({ done: BO3D.story.progressSummary().done, stage: BO3D.growth.stage() }));
    ok(s2.done === 1 && s2.stage === 1, 'T7 반복 완료', JSON.stringify(s2));
    log.push('T1·T7: 0단계 → OT-01 → 카드 "' + (r.finish.gear || '').slice(0, 30) + '…" · 머리 "' + h1 + '" · 말씀 카드 ' + nc.shown + ' · 다시 마침 카드 ' + r2.finish.gears);
    ok(!p.errs.length, 't1', p.errs.slice(0, 3).join(' | '));
    await p.context().close();
  }

  /* ── T2·T25: 3장면 완료 → OT-04 → 2단계, 책갈피 성경 차례, "맞힌" 없음 ── */
  {
    const p = await open('t2', { seed: 3 });
    await toMap(p, 1);
    const r = await play(p, 'OT-04');
    ok(r.finish.gears === 1 && /탐험대 깃발/.test(r.finish.gear || ''), 'T2 마침 화면', r.finish.gear);
    ok(r.finish.ba && r.finish.ba.imgs === 2 && r.finish.ba.ring, 'T2 전후 그림', JSON.stringify(r.finish.ba));
    await p.evaluate(() => BO3D.story.openRecord('marks')); await p.waitForTimeout(100);
    const m = await p.evaluate(() => {
      const g = BO3D.growth, items = g.bookmarks(), keys = items.map((x) => g.refKey(x.ref));
      let sorted = true; for (let i = 1; i < keys.length; i++) { const a = keys[i - 1], c = keys[i]; if (a[0] > c[0] || (a[0] === c[0] && (a[1] > c[1] || (a[1] === c[1] && a[2] > c[2])))) sorted = false; }
      const box = document.querySelector('.ot3');
      return { n: items.length, rows: box.querySelectorAll('.rec-mark').length, sorted, unknown: keys.filter((k) => k[0] === 999).length, text: box.innerText, legacy: items.filter((x) => x.legacy).length, ids: [...new Set(items.map((x) => x.id))] };
    });
    ok(m.n > 0 && m.rows === m.n && m.sorted && !m.unknown, 'T2 책갈피', JSON.stringify({ n: m.n, rows: m.rows, sorted: m.sorted, unknown: m.unknown }));
    ok(!/맞힌|맞혔/.test(m.text), 'T25 책갈피 글', '"맞힌" 표현이 있음');
    await shot(p, 'marks');
    log.push('T2: 3장면 → OT-04 → "' + (r.finish.gear || '').slice(0, 24) + '…" · 책갈피 ' + m.n + '곳(장면 ' + m.ids.join(',') + ', 성경 차례 ' + (m.sorted ? '맞음' : '어긋남') + ', 옛 자료 표시 ' + m.legacy + ')');
    ok(!p.errs.length, 't2', p.errs.slice(0, 3).join(' | '));
    await p.context().close();
  }

  /* ── T3·T28: 7장면 완료 → OT-08 → 3단계, 다음 장면 재료 찾기에서 스캔 ── */
  {
    const p = await open('t3', { seed: 7 });
    await toMap(p, 1);
    const r = await play(p, 'OT-08');
    ok(r.finish.gears === 1 && /손목 탐지기/.test(r.finish.gear || '') && /하나님이 주시는 능력이 아니에요/.test(r.finish.gear || ''), 'T3 마침 화면', r.finish.gear);
    ok(r.finish.ba && r.finish.ba.imgs === 2 && r.finish.ba.ring, 'T3 전후 그림', JSON.stringify(r.finish.ba));
    await shot(p, 'finish');
    const r2 = await play(p, 'OT-10', { scan: true });
    const sc = r2.scan || {};
    ok(sc.hasScan && sc.lit && sc.lit.length === 3 && sc.lit.includes(sc.spot) && sc.got, 'T3 스캔', JSON.stringify(sc));
    log.push('T3: 7장면 → OT-08 → 손목 탐지기 카드(빛 안내 포함) · OT-10 재료 찾기 스캔: 빛난 곳 ' + JSON.stringify(sc.lit) + ' 숨은 자리 ' + sc.spot + ' · 찾음 ' + sc.got);
    /* 3단계 외형: 아바타 배지 */
    const av = await p.evaluate(() => { const a = BO3D.ui.avatar('hyu'); return { cls: a.className, badge: !!a.querySelector('.av-badge svg'), g2: !!a.querySelector('.avatar.g2') }; });
    ok(av.badge && av.g2, 'T3 아바타', JSON.stringify(av));
    ok(!p.errs.length, 't3', p.errs.slice(0, 3).join(' | '));
    await p.context().close();
  }

  /* ── T5: 20장면 완료 → 4단계 이상 이름·장면 수가 어디에도 없음 ── */
  {
    const p = await open('t5', { seed: 20 });
    await toMap(p, 1);
    const texts = [['지도', await mapText(p)]];
    for (const tab of ['gear', 'scenes', 'cards', 'marks']) { await p.evaluate((t) => BO3D.story.openRecord(t), tab); await p.waitForTimeout(80); texts.push(['기록장 ' + tab, await mapText(p)]); }
    await shot(p, 'record-gear');
    await p.evaluate(() => BO3D.story.openRecord('gear')); await p.waitForTimeout(80); await shot(p, 'record-gear2');
    const r = await play(p, 'OT-21');
    texts.push(['마침 화면', r.finish.text]);
    const hits = []; texts.forEach(([w, t]) => LATER.forEach((x) => { if (t.includes(x)) hits.push(w + ':' + x); }));
    ok(!hits.length, 'T5 미구현 단계', hits.join(', '));
    const h = await (async () => { await toMapBtn(p); return head(p); })();
    ok(h && h.includes('다음 장비는 준비하고 있어요') && h.includes('3단계'), 'T5 지도 머리', h);
    log.push('T5: 20장면 → 머리 "' + h + '" · 4단계 이상 낱말 ' + hits.length + '곳');
    ok(!p.errs.length, 't5', p.errs.slice(0, 3).join(' | '));
    await p.context().close();
  }

  /* ── T8: 빈 저장에서 [모든 시대 열기] → 0단계 그대로 ── */
  {
    const p = await open('t8');
    await toMap(p, 1);
    await p.click('.ot3 .btn:has-text("모든 시대 열기")'); await p.waitForTimeout(150);
    const s = await G(p, () => ({ stage: BO3D.growth.stage(), done: BO3D.story.progressSummary().done, all: BO3D.story.progressSummary().unlockAll }));
    ok(s.stage === 0 && s.done === 0 && s.all, 'T8 모든 시대 열기', JSON.stringify(s));
    log.push('T8: 모든 시대 열기 → ' + JSON.stringify(s));
    await p.context().close();
  }

  /* ── T9: 8장면 완료, 깃발·모자를 바꾸고 새로고침 → 같은 단계, 고른 것 유지 ── */
  {
    const p = await open('t9', { seed: 8 });
    await toMap(p, 1);
    await p.evaluate(() => BO3D.story.openRecord('gear')); await p.waitForTimeout(80);
    const open0 = await G(p, () => BO3D.growth.flagsOpen());
    await p.click('.ot3 .sw:not(.locked):not(.none) >> nth=0'); await p.waitForTimeout(80);
    await p.click('.ot3 .tog >> nth=0'); await p.waitForTimeout(80);   /* 모자 벗기 */
    const before = await G(p, () => ({ stage: BO3D.growth.stage(), flag: BO3D.growth.prefs.flag(), hat: BO3D.growth.prefs.hat() }));
    await p.reload(); await p.waitForTimeout(2200);
    await toMap(p, 2);   /* 다른 나이 단계로 들어와도 */
    const after = await G(p, () => ({ stage: BO3D.growth.stage(), flag: BO3D.growth.prefs.flag(), hat: BO3D.growth.prefs.hat() }));
    ok(before.stage === 3 && before.flag && before.hat === false && JSON.stringify(before) === JSON.stringify(after), 'T9 새로고침', JSON.stringify({ before, after, open0 }));
    log.push('T9: ' + JSON.stringify(before) + ' → 새로고침 → ' + JSON.stringify(after));
    ok(!p.errs.length, 't9', p.errs.slice(0, 3).join(' | '));
    await p.context().close();
  }

  /* ── T10: 16장면 완료, 성장 키 없음 → "그동안 모은 장비" 한 번만 ── */
  {
    const p = await open('t10', { seed: 16, seedOpt: { gear: null } });
    await toMap(p, 1);
    const c1 = await p.evaluate(() => [...document.querySelectorAll('.ot3 .gearnew')].map((x) => x.innerText.replace(/\s+/g, ' ')));
    await shot(p, 'catchup');
    await p.evaluate(() => BO3D.story.openRecord('gear')); await p.waitForTimeout(60); await toMapBtn(p);
    const c2 = await p.evaluate(() => document.querySelectorAll('.ot3 .gearnew').length);
    await p.reload(); await p.waitForTimeout(2200); await toMap(p, 1);
    const c3 = await p.evaluate(() => document.querySelectorAll('.ot3 .gearnew').length);
    const st3 = await G(p, () => BO3D.growth.stage());
    ok(c1.length === 1 && /그동안 모은 장비/.test(c1[0]) && /탐험 모자/.test(c1[0]) && /탐험대 깃발/.test(c1[0]) && /손목 탐지기/.test(c1[0]) && !c2 && !c3 && st3 === 3, 'T10 옛 저장 자료', JSON.stringify({ c1, c2, c3, st3 }));
    log.push('T10: 성장 키 없는 16장면 → 단계 ' + st3 + ', 처음 지도에서 카드 ' + c1.length + '번, 다시 열 때 ' + c2 + '·' + c3);
    ok(!p.errs.length, 't10', p.errs.slice(0, 3).join(' | '));
    await p.context().close();
  }

  /* ── T11·T22: localStorage.setItem이 오류 → 장면 2개를 마쳐도 놀이 계속, 단계 계산 ── */
  {
    const p = await open('t11', { failStore: true });
    await toMap(p, 1);
    await play(p, 'OT-01');
    const r = await play(p, 'OT-02');
    await toMapBtn(p);
    const s = await G(p, () => ({ done: BO3D.story.progressSummary().done, stage: BO3D.growth.stage() }));
    const h = await head(p);
    ok(s.done === 2 && s.stage === 1 && h && h.includes('1단계'), 'T11·T22 저장 실패', JSON.stringify({ s, h }));
    ok(!p.errs.length, 'T11 저장 실패 오류', p.errs.slice(0, 3).join(' | '));
    log.push('T11·T22: 저장 실패 중 2장면 → ' + JSON.stringify(s) + ' 머리 "' + h + '" · 페이지 오류 ' + p.errs.length + ' · 둘째 장면 카드 ' + r.finish.gears);
    await p.context().close();
  }

  /* ── T25: OT-05를 8~10세로, 다시 14~19세로 → 두 단계 장절이 따로 / 옛 자료(t1만)는 한 단계 + 안내 ── */
  {
    const p = await open('t25');
    await toMap(p, 0);
    await play(p, 'OT-05');
    await p.reload(); await p.waitForTimeout(2200); await toMap(p, 2);
    await play(p, 'OT-05');
    const r = await G(p, () => { const g = BO3D.growth, tf = g.tiersFor('OT-05'), bm = g.bookmarks().filter((x) => x.id === 'OT-05'); return { tf, t1: bm.filter((x) => x.tier === 't1').length, t3: bm.filter((x) => x.tier === 't3').length, legacy: bm.filter((x) => x.legacy).length }; });
    ok(JSON.stringify(r.tf.list) === '["t1","t3"]' && !r.tf.legacy && r.t1 > 0 && r.t3 > 0 && !r.legacy, 'T25 책갈피 이력', JSON.stringify(r));
    await p.context().close();
    const q = await open('t25b', { seed: 4, seedOpt: { tier: 't1', gear: { seen: 2, tiers: {} } } });
    await toMap(q, 1);
    await q.evaluate(() => BO3D.story.openRecord('marks')); await q.waitForTimeout(80);
    const l = await q.evaluate(() => { const box = document.querySelector('.ot3'); return { fine: [...box.querySelectorAll('.fine')].map((x) => x.textContent), text: box.innerText, n: BO3D.growth.bookmarks().length, leg: BO3D.growth.bookmarks().every((x) => x.legacy && x.tier === 't1') }; });
    ok(l.n > 0 && l.leg && l.fine.some((x) => x.includes('마지막으로 마친 나이 단계')) && !/맞힌|맞혔/.test(l.text), 'T25 옛 자료', JSON.stringify({ n: l.n, leg: l.leg, fine: l.fine }));
    await shot(q, 'legacy-marks');
    log.push('T25: OT-05 t1→t3 = ' + JSON.stringify(r.tf.list) + ' (t1 장절 ' + r.t1 + ', t3 장절 ' + r.t3 + ') · 옛 자료 4장면 → 책갈피 ' + l.n + '곳 모두 t1, 안내 한 줄');
    await q.context().close();
  }

  fs.writeFileSync(path.join(out, 'log.txt'), log.join('\n') + '\n\n문제 ' + probs.length + '\n' + probs.join('\n') + '\n');
  console.log(log.join('\n'));
  console.log('문제', probs.length, probs.slice(0, 40).join('\n'));
  await b.close();
  process.exit(probs.length ? 1 : 0);
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
