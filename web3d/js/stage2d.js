/* 겹친 그림 무대(2D): 이야기 카드의 위쪽 그림을, 끌어 보고 눌러 보는 무대로 바꾼다 (2026-11-18 그래픽 협업 시범, 첫 장면 OT-12 시내 산).
 * - 그림은 겹쳐 놓고 다른 속도로 움직인다(하늘 → 산 → 구름·연기·불 → 광야와 진 → 사람).
 * - 산·광야·백성·모세는 그림 파일(BO3D.img2d, tools/build3d.js가 web3d/assets/img/*.webp를 묶는다)을 쓰고,
 *   그림이 없거나 불러오지 못하면 코드로 그린 임시 그림으로 대신한다(오류 없이 진행).
 * - 하늘·구름·연기·불·번개·경계 표시·옷은 코드로 그린다.
 * - 규칙: 하나님과 천사의 형상 없음, 하나님의 음성 없음, 나팔 부는 이 없음, 돌판 없음. 경계는 물건으로 그리지 않고 화면 점선으로만.
 *   아이들은 목격자: 끌어서 둘러보고, 본 것을 수첩에 담고, 백성과 함께 서고 물러선다.
 * - 글과 감수 태그는 content/ot/threads/stage12.json.
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  var U = BO3D.ui, el = U.el;
  var W = 1536, HZ = 563, C0 = 768, PM = 0.75;   /* 광야 그림의 폭, 지평선, 기준 중심, 산의 겹침 속도 */
  var MT = { x: 85, y: -68, k: 0.86 };           /* 산 그림을 놓는 자리(왼쪽 위)와 크기. 산의 아래 끝은 광야 그림 뒤로 들어간다 */
  var PEAK = { x: MT.x + 1176 * MT.k, y: MT.y + 96 * MT.k };
  function T() { return (BO3D.ot && BO3D.ot.threads && BO3D.ot.threads.stage12) || null; }
  function calm() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function fast() { return !!window.BO3D_TEST; }
  function snd(name, a, b) { try { var au = BO3D.fx && BO3D.fx.audio; if (au && au[name]) { au.start(); au[name](a, b); } } catch (e) { /* 소리 없이 진행 */ } }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function hex(c) { return [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16)]; }
  function mix(a, b, t) { var x = hex(a), y = hex(b); return 'rgb(' + Math.round(lerp(x[0], y[0], t)) + ',' + Math.round(lerp(x[1], y[1], t)) + ',' + Math.round(lerp(x[2], y[2], t)) + ')'; }

  /* ── 그림: 실제 그림이 있으면 그것을, 없으면 임시 그림을 쓴다 ── */
  var IMGS = {};
  function cv(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function poly(g, pts, fill) { g.fillStyle = fill; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); g.fill(); }
  function phMountain() {
    var c = cv(1536, 1024), g = c.getContext('2d');
    poly(g, [[0, 823], [0, 700], [120, 660], [240, 690], [360, 700], [360, 823]], '#A9A0C6');
    poly(g, [[300, 823], [560, 520], [760, 300], [960, 130], [1180, 96], [1330, 150], [1470, 330], [1536, 420], [1536, 823]], '#B8744A');
    poly(g, [[560, 520], [760, 300], [960, 130], [1180, 96], [1100, 260], [860, 420], [640, 600]], '#E0AD6C');
    poly(g, [[300, 823], [640, 600], [1100, 560], [1536, 640], [1536, 823]], '#7A5066');
    return c;
  }
  function phPlain() {
    var c = cv(1536, 1024), g = c.getContext('2d'), r = rng(12), i;
    var top = []; for (i = 0; i <= 1536; i += 64) top.push([i, HZ + Math.sin(i / 190) * 9 + Math.sin(i / 67) * 4]);
    poly(g, top.concat([[1536, 1024], [0, 1024]]), '#E4BE7E');
    poly(g, [[0, 640], [400, 622], [900, 650], [1536, 630], [1536, 1024], [0, 1024]], '#DDB272');
    poly(g, [[0, 800], [500, 770], [1100, 815], [1536, 790], [1536, 1024], [0, 1024]], '#D2A463');
    for (i = 0; i < 13; i++) {   /* 장막: 낮고 넓은 어두운 천 */
      var d = r(), x = 40 + r() * 470, y = 585 + d * 150, w = 60 + d * 70, h = 26 + d * 30;
      poly(g, [[x - w / 2, y], [x - w * 0.3, y - h], [x + w * 0.3, y - h], [x + w / 2, y]], d > 0.5 ? '#5B4636' : '#6E5846');
      poly(g, [[x + w * 0.05, y], [x + w * 0.3, y - h], [x + w / 2, y]], '#4A382B');
    }
    for (i = 0; i < 26; i++) { var rx = r() * 1536, ry = 660 + r() * 340, rr = 4 + r() * 10; poly(g, [[rx - rr, ry], [rx - rr * 0.3, ry - rr * 0.9], [rx + rr * 0.7, ry - rr * 0.6], [rx + rr, ry]], '#B98A55'); }
    poly(g, [[60, 1024], [90, 930], [190, 900], [300, 940], [330, 1024]], '#9A6238'); poly(g, [[190, 900], [300, 940], [330, 1024], [230, 1024]], '#7E4E2C');
    poly(g, [[1230, 1024], [1260, 950], [1360, 925], [1450, 960], [1470, 1024]], '#9A6238');
    return c;
  }
  var ROBES = ['#F2E8D2', '#9A6238', '#6F8448', '#A65A4A', '#4C5B7E', '#C9A769'];
  function person(g, x, y, h, robe, head) {   /* 뒷모습: 통옷과 머리쓰개. 얼굴은 그리지 않는다 */
    var w = h * 0.34;
    g.fillStyle = robe; g.beginPath(); g.moveTo(x - w * 0.42, y - h * 0.78); g.lineTo(x + w * 0.42, y - h * 0.78); g.lineTo(x + w * 0.5, y); g.lineTo(x - w * 0.5, y); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,.14)'; g.beginPath(); g.moveTo(x + w * 0.08, y - h * 0.78); g.lineTo(x + w * 0.42, y - h * 0.78); g.lineTo(x + w * 0.5, y); g.lineTo(x + w * 0.14, y); g.closePath(); g.fill();
    g.fillStyle = head; g.beginPath(); g.arc(x, y - h * 0.86, h * 0.13, 0, 6.3); g.fill();
    g.beginPath(); g.moveTo(x - h * 0.13, y - h * 0.86); g.lineTo(x + h * 0.13, y - h * 0.86); g.lineTo(x + h * 0.16, y - h * 0.66); g.lineTo(x - h * 0.16, y - h * 0.66); g.closePath(); g.fill();
  }
  function phPeople() {
    var c = cv(1536, 1024), g = c.getContext('2d'), r = rng(31), list = [], i;
    for (i = 0; i < 34; i++) list.push({ x: 90 + r() * 1356, y: 720 + r() * 250, kid: r() < 0.22, c: Math.floor(r() * ROBES.length) });
    list.sort(function (a, b) { return a.y - b.y; });
    list.forEach(function (p) { var h = (p.kid ? 150 : 250) * (0.8 + (p.y - 720) / 250 * 0.25); person(g, p.x, p.y, h, ROBES[p.c], p.c === 0 ? '#C9A769' : '#F2E8D2'); });
    return c;
  }
  function phMoses() { var c = cv(1024, 1536), g = c.getContext('2d'); person(g, 512, 1460, 1380, '#8E4A32', '#F2E8D2'); return c; }
  var PH = { ot12_mountain: phMountain, ot12_plain_camp: phPlain, ot12_people: phPeople, ot12_moses: phMoses };
  function pic(name) {
    var r = IMGS[name]; if (r) return r;
    r = IMGS[name] = { d: PH[name](), real: false };
    var s = BO3D.img2d && BO3D.img2d[name];
    if (s) { var im = new Image(); im.onload = function () { r.d = im; r.real = true; }; im.onerror = function () { /* 임시 그림 그대로 */ }; im.src = s; }
    return r;
  }

  /* ── 장면의 대목마다 무대가 어떤 모습인지 ── */
  var CAM = {
    camp: { cx: 470, top: -110, vh: 1040 }, mid: { cx: 700, top: -110, vh: 1040 }, foot: { cx: 1010, top: -110, vh: 1040 },
    event: { cx: 1020, top: -470, vh: 1400 }, storm: { cx: 1030, top: -300, vh: 1230 }, afar: { cx: 768, top: -600, vh: 1640 }
  };
  var PPL = { camp: { x: 600, y: 742 }, foot: { x: 1010, y: 716 }, far: { x: 640, y: 770 } };
  var KEYS = {
    arrive: { cam: 'camp', people: 'camp', hint: 'look', free: 1 },
    beat0: { cam: 'camp', people: 'camp', hint: 'look', free: 1 },
    beat1: { cam: 'mid', people: 'camp', moses: 'camp', free: 1 },
    beat2: { cam: 'foot', people: 'camp', moses: 'camp', bound: 1, free: 1 },
    help0: { cam: 'camp', people: 'camp', moses: 'camp', bound: 1, mode: 'wash', need: 1 },
    beat3: { cam: 'event', people: 'camp', moses: 'camp', bound: 1, storm: 1, mode: 'days', need: 1, tall: 1 },
    help1: { cam: 'event', people: 'camp', moses: 'camp', bound: 1, storm: 1, mode: 'walk', need: 1, tall: 1 },
    beat4: { cam: 'storm', people: 'foot', moses: 'foot', bound: 1, storm: 1, quiet: 1 },
    beat5: { cam: 'storm', people: 'foot', moses: 'foot', bound: 1, storm: 1, quiet: 1 },
    beat6: { cam: 'storm', people: 'foot', moses: 'foot', bound: 1, storm: 1, mode: 'back', need: 1, tall: 1 },
    help2: { cam: 'afar', people: 'far', bound: 1, storm: 1, mode: 'moses', tall: 1 },
    after: { cam: 'afar', people: 'far', bound: 1, storm: 1, quiet: 1 }
  };
  function conf(key) { return KEYS[key] || KEYS.after; }

  var st = null;   /* 지금 무대의 상태 */
  function fresh(id) {
    return { id: id, key: '', K: KEYS.arrive, done: {}, cam: { cx: 470, top: -110, vh: 1040 }, camTo: null,
      sky: 0, storm: 0, stormTo: 0, bound: 0, people: { x: 600, y: 742, tr: 0 }, pplTo: null, moses: { x: 0, y: 0, k: 1, a: 0 }, mosesTo: null, mosesWalk: -1,
      mode: 'free', t: 0, days: -1, note: {}, bolt: null, nextBolt: 2, thunderAt: -1, hornAt: 4, hornOn: -9, smoke: [], back: 0, walk: 0, wash: 0, washP: 0, toastAt: -9,
      spots: [], cb: null, quake: 0 };
  }

  /* ── 화면 요소 ── */
  var node = null, canvas = null, g2 = null, ov = {}, cssW = 0, cssH = 0, dpr = 1, raf = 0, lastT = 0;
  function build() {
    if (node) return;
    canvas = el('canvas', { 'aria-label': '시내 산 앞의 그림. 끌어서 둘러볼 수 있어요.' });
    ov.day = el('div', { class: 'st2-day', hidden: '' });
    ov.note = el('div', { class: 'st2-note', hidden: '' });
    ov.hint = el('div', { class: 'st2-hint', hidden: '' });
    ov.toast = el('div', { class: 'st2-toast', hidden: '' });
    ov.go = el('button', { class: 'st2-go', hidden: '', on: { click: function () { nudge(); } } });
    ov.wash = el('div', { class: 'st2-wash', hidden: '' });
    node = el('div', { class: 'st2' }, canvas, ov.day, ov.wash, ov.note, ov.hint, ov.toast, ov.go);
    g2 = canvas.getContext('2d');
    canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  }
  function setHint(text) { if (!text) { ov.hint.hidden = true; return; } ov.hint.textContent = text; ov.hint.hidden = false; }
  function toast(text) { ov.toast.textContent = text; ov.toast.hidden = false; st.toastAt = st.t; }

  /* ── 대목에 들어감 ── */
  function enter(id, key, cb) {
    build();
    if (!st || st.id !== id) st = fresh(id);
    var K = conf(key), first = st.key === '';
    st.key = key; st.K = K; st.cb = cb || null; st.spots = [];
    st.camTo = { cx: CAM[K.cam].cx, top: CAM[K.cam].top, vh: CAM[K.cam].vh, t: first ? 1 : 0, from: { cx: st.cam.cx, top: st.cam.top, vh: st.cam.vh } };
    st.stormTo = K.storm ? 1 : 0; st.boundTo = K.bound ? 1 : 0;
    st.pplTo = PPL[K.people || 'camp'];
    st.mosesTo = K.moses ? { x: PPL[K.moses].x + 150, y: PPL[K.moses].y - 6, a: 1 } : null;
    st.mosesWalk = -1;
    if (first) { st.people.x = st.pplTo.x; st.people.y = st.pplTo.y; }
    ov.day.hidden = true; ov.note.hidden = true; ov.go.hidden = true; ov.wash.hidden = true; ov.wash.replaceChildren(); ov.toast.hidden = true;
    setHint(null);
    var done = !!st.done[key];
    st.mode = K.mode && !done ? K.mode : (K.free ? 'free' : 'still');
    if (K.hint === 'look' && T()) setHint(T().look.hint);
    if (K.mode === 'wash' && !done) startWash();
    if (K.mode === 'days') { if (done) { st.sky = 0; st.days = 9; showNote(); } else startDays(); }
    if (K.mode === 'walk') { if (done) { st.people.x = PPL.foot.x; st.people.y = PPL.foot.y; st.pplTo = PPL.foot; st.mosesTo = { x: PPL.foot.x + 150, y: PPL.foot.y - 6, a: 1 }; } else { st.walk = 0; setHint(T().walk.hint); ov.go.textContent = T().walk.button; ov.go.hidden = false; } }
    if (K.mode === 'back') { if (done) { st.back = 1; } else { st.back = 0; setHint(T().back.hint); ov.go.textContent = T().back.button; ov.go.hidden = false; } }
    if (K.mode === 'moses') { st.mosesWalk = 0; st.moses.x = PPL.far.x + 190; st.moses.y = PPL.far.y - 20; st.moses.a = 1; st.moses.k = 1; st.mosesTo = null; }
    if (!K.storm) { st.sky = 0; st.days = -1; }
    if (K.storm && K.mode !== 'days' && st.storm < 0.5) { st.storm = 1; }   /* 중간부터 들어와도 셋째 날의 모습 */
    if (!raf) { lastT = 0; raf = requestAnimationFrame(frame); }
    return node;
  }
  function finish(sayObj, sound) {
    if (!st || st.done[st.key]) return;
    st.done[st.key] = 1; st.mode = st.K.free ? 'free' : 'still';
    ov.go.hidden = true; setHint(null);
    snd(sound || 'fanfare');
    var cb = st.cb; if (cb) cb(sayObj || null);
  }

  /* 옷 빨기(출 19:14): 옷을 문지르면 먼지가 빠진다. 세 벌 */
  function startWash() {
    var Tw = T().wash, n = 0, prog = 0, lastX = null, lastY = null;
    var cloth = el('div', { class: 'st2-cloth' }, el('i', { class: 'dirt' })), basin = el('div', { class: 'st2-basin' }, el('i', { class: 'water' }), cloth);
    var count = el('div', { class: 'st2-count', text: '0 / ' + Tw.count }), line = el('div', { class: 'st2-line' });
    function paint() { cloth.firstChild.style.opacity = String(1 - prog); cloth.classList.toggle('clean', prog >= 1); }
    function add(v) {
      if (prog >= 1) return; prog = clamp(prog + v, 0, 1); paint();
      if (prog >= 1) {
        n++; count.textContent = n + ' / ' + Tw.count; snd('pop'); line.appendChild(el('i', {}));
        if (n >= Tw.count) { setTimeout(function () { ov.wash.hidden = true; finish(null, 'ding'); }, fast() ? 0 : 500); return; }
        setTimeout(function () { prog = 0; paint(); }, fast() ? 0 : 600);
      }
    }
    cloth.addEventListener('pointerdown', function (e) { lastX = e.clientX; lastY = e.clientY; try { cloth.setPointerCapture(e.pointerId); } catch (x) { /* 무시 */ } add(0.12); e.preventDefault(); });
    cloth.addEventListener('pointermove', function (e) { if (lastX === null) return; var d = Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY); lastX = e.clientX; lastY = e.clientY; add(d / 520); });
    cloth.addEventListener('pointerup', function () { lastX = null; }); cloth.addEventListener('pointercancel', function () { lastX = null; });
    st.washAdd = add;
    ov.wash.replaceChildren(line, basin, count); ov.wash.hidden = false; setHint(Tw.hint);
  }

  /* 이틀 넘기기(탐험대 장치) → 셋째 날 아침 → 수첩 */
  function startDays() { st.days = 0; st.daysT = 0; st.storm = 0; st.stormTo = 0; st.note = {}; ov.day.hidden = false; ov.day.textContent = T().days.names[0]; setHint(T().days.label); }
  function showNote() {
    var Tn = T().note;
    ov.note.replaceChildren.apply(ov.note, Tn.items.map(function (it) { return el('span', { class: 'st2-chip' + (st.note[it.key] || st.done[st.key] ? ' on' : ''), 'data-k': it.key }, el('i', { class: 'ic ' + it.key }), el('b', { text: it.name })); }));
    ov.note.hidden = false;
    if (!st.done[st.key]) { st.mode = 'note'; setHint(Tn.hint); }
  }
  function record(k) {
    if (st.mode !== 'note' || st.note[k]) return;
    st.note[k] = 1; snd('pop');
    var c = ov.note.querySelector('[data-k="' + k + '"]'); if (c) c.classList.add('on');
    var Tn = T().note;
    if (Tn.items.every(function (it) { return st.note[it.key]; })) finish(Tn.done);
  }
  /* 끌기를 못 하는 아이를 위한 단추: 누를 때마다 조금씩 */
  function nudge() { if (st.mode === 'walk') walkBy(0.22); else if (st.mode === 'back') backBy(0.34); }
  function walkBy(v) { st.walk = clamp(st.walk + v, 0, 1); if (st.walk >= 1) { st.pplTo = PPL.foot; st.mosesTo = { x: PPL.foot.x + 150, y: PPL.foot.y - 6, a: 1 }; finish(null, 'ding'); } }   /* 산기슭에 선 채로 있는다 */
  function backBy(v) { st.back = clamp(st.back + v, 0, 1); if (st.back >= 1) finish(T().back.done, 'ding'); }

  /* ── 손가락 ── */
  var ptr = null;
  function pos(e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function down(e) { if (!st) return; var p = pos(e); ptr = { id: e.pointerId, x: p.x, y: p.y, sx: p.x, sy: p.y, moved: 0 }; try { canvas.setPointerCapture(e.pointerId); } catch (x) { /* 무시 */ } }
  function move(e) {
    if (!ptr || !st) return;
    var p = pos(e), dx = p.x - ptr.x, dy = p.y - ptr.y, s = cssH / st.cam.vh;
    ptr.moved += Math.abs(dx) + Math.abs(dy); ptr.x = p.x; ptr.y = p.y;
    if (st.mode === 'free' && !st.camTo) { panBy(-dx / s); if (Math.abs(dx) > 1) setHint(null); }
    else if (st.mode === 'walk' && dx > 0) walkBy(dx / (cssW * 1.5));
    else if (st.mode === 'back' && dy > 0) backBy(dy / (cssH * 0.55));
  }
  function up() {
    if (!ptr || !st) { ptr = null; return; }
    var tap = ptr.moved < 12, x = ptr.sx, y = ptr.sy; ptr = null;
    if (tap && st.mode === 'note') for (var i = 0; i < st.spots.length; i++) { var h = st.spots[i]; if (Math.hypot(h.x - x, h.y - y) < h.r + 14) { record(h.k); break; } }
  }
  function vw() { return st.cam.vh * cssW / cssH; }
  function panBy(d) {
    var v = vw(), lo = v / 2, hi = W - v / 2, lim = hi;
    if (v >= W) { st.cam.cx = W / 2; return; }
    var nx = st.cam.cx + d;
    if (nx > lim && st.bound > 0.5 && st.t - st.toastAt > 2.5 && T()) toast(T().bound.text);
    st.cam.cx = clamp(nx, lo, lim);
  }

  /* ── 그리기 ── */
  function X(wx, p) { var s = cssH / st.cam.vh; return cssW / 2 + (wx - st.cam.cx * p - C0 * (1 - p)) * s; }
  function Y(wy) { return (wy - st.cam.top) * cssH / st.cam.vh; }
  var SKY = [['#7EC8D8', '#F4E3BC'], ['#5A4A82', '#F0935A'], ['#101A36', '#2B3A66'], ['#24223A', '#6E6480']];
  /* 빽빽한 구름: 산 위를 덮는 넓은 띠(위)와, 산꼭대기 둘레에 자욱한 연기(아래, 옅게) */
  var CLOUDS = (function () { var r = rng(77), a = []; for (var i = 0; i < 46; i++) { var u = r(); a.push({ x: PEAK.x - 580 + r() * 1160, y: PEAK.y - 430 + u * 320, rx: 150 + r() * 190, ry: 52 + r() * 50, ph: r() * 6.3, tone: u < 0.34 ? 0 : u < 0.7 ? 1 : 2 }); } a.sort(function (p, q) { return p.y - q.y; }); return a; })();
  var VEIL = (function () { var r = rng(41), a = []; for (var i = 0; i < 12; i++) a.push({ x: PEAK.x - 420 + r() * 840, y: PEAK.y - 40 + r() * 210, rx: 120 + r() * 120, ry: 44 + r() * 30, ph: r() * 6.3 }); return a; })();
  var STARS = (function () { var r = rng(5), a = []; for (var i = 0; i < 46; i++) a.push([r(), r() * 0.55, 0.6 + r() * 1.2]); return a; })();
  function frame(now) {
    raf = 0;
    if (!node || !node.isConnected || !st) return;   /* 무대가 화면에서 빠지면 멈춘다 */
    var dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0.016; lastT = now;
    if (fast()) dt *= 6;
    var w = node.clientWidth, h = node.clientHeight;
    if (w && h) {
      if (w !== cssW || h !== cssH) { cssW = w; cssH = h; dpr = Math.min(2, window.devicePixelRatio || 1); canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
      update(dt); draw();
    }
    raf = requestAnimationFrame(frame);
  }
  function update(dt) {
    var K = st.K, q = calm();
    st.t += dt;
    node.classList.toggle('noting', st.mode === 'note' || !ov.note.hidden);
    if (st.camTo) {
      var c = st.camTo; c.t = Math.min(1, c.t + dt / 0.9); var e = ease(c.t);
      st.cam.cx = lerp(c.from.cx, c.cx, e); st.cam.top = lerp(c.from.top, c.top, e); st.cam.vh = lerp(c.from.vh, c.vh, e);
      if (c.t >= 1) st.camTo = null;
    }
    var v = vw(); if (v >= W) st.cam.cx = W / 2; else st.cam.cx = clamp(st.cam.cx, v / 2, W - v / 2);
    st.bound += ((st.boundTo || 0) - st.bound) * Math.min(1, dt * 3);
    /* 이틀 넘기기: 낮 → 저녁 → 밤을 두 번 지나 셋째 날 아침 */
    if (st.mode === 'days') {
      st.daysT += dt / (q ? 0.2 : 5.2); var u = st.daysT, names = T().days.names;
      if (u >= 1) { st.sky = 0; st.days = 9; st.stormTo = 1; ov.day.textContent = names[2]; showNote(); }
      else { var ph = u * 2 % 1; st.sky = ph < 0.35 ? ph / 0.35 : ph < 0.65 ? 1 + (ph - 0.35) / 0.3 : 2 - (ph - 0.65) / 0.35 * 2; if (st.sky < 0) st.sky = 0; ov.day.textContent = names[u < 0.5 ? 0 : 1]; }
    }
    st.storm += (st.stormTo - st.storm) * Math.min(1, dt * (st.mode === 'note' ? 0.9 : 2.5));
    /* 사람 */
    if (st.mode === 'walk') { var e2 = ease(st.walk); st.people.x = lerp(PPL.camp.x, PPL.foot.x, e2); st.people.y = lerp(PPL.camp.y, PPL.foot.y, e2); st.moses.x = st.people.x + 150; st.moses.y = st.people.y - 6; st.moses.a = 1; }
    else if (K.mode === 'back') { var e3 = ease(st.back); st.people.x = lerp(PPL.foot.x, PPL.far.x, e3); st.people.y = lerp(PPL.foot.y, PPL.far.y, e3);
      if (!st.camTo) { st.cam.cx = lerp(CAM.storm.cx, CAM.afar.cx, e3); st.cam.top = lerp(CAM.storm.top, CAM.afar.top, e3); st.cam.vh = lerp(CAM.storm.vh, CAM.afar.vh, e3); } }
    else if (st.pplTo) { st.people.x += (st.pplTo.x - st.people.x) * Math.min(1, dt * 2.2); st.people.y += (st.pplTo.y - st.people.y) * Math.min(1, dt * 2.2); }
    if (st.mosesWalk >= 0) {   /* 모세만 짙은 어둠 쪽으로(출 20:21). 어둠의 안쪽은 보이지 않는다 */
      st.mosesWalk = Math.min(1, st.mosesWalk + dt / (q ? 0.3 : 6)); var m = ease(st.mosesWalk);
      st.moses.x = lerp(PPL.far.x + 190, PEAK.x - 150, m); st.moses.y = lerp(PPL.far.y - 20, 640, m); st.moses.k = lerp(1, 0.5, m); st.moses.a = m < 0.72 ? 1 : 1 - (m - 0.72) / 0.28;
    } else if (st.mode !== 'walk') {
      if (st.mosesTo) { st.moses.x += (st.mosesTo.x - st.moses.x) * Math.min(1, dt * 2.2); st.moses.y += (st.mosesTo.y - st.moses.y) * Math.min(1, dt * 2.2); st.moses.a += (1 - st.moses.a) * Math.min(1, dt * 3); st.moses.k = 1; if (st.moses.x === 0) { st.moses.x = st.mosesTo.x; st.moses.y = st.mosesTo.y; } }
      else st.moses.a += (0 - st.moses.a) * Math.min(1, dt * 3);
    }
    st.people.tr = K.mode === 'back' && !q ? (1 - st.back) : 0;
    /* 셋째 날: 번개·우레·나팔 소리·연기·흔들림 */
    var on = st.storm > 0.6, loud = on && !K.quiet;
    if (on) {
      if (st.t >= st.nextBolt) {
        var r = Math.random, bx = PEAK.x - 420 + r() * 840, by = PEAK.y - 120 + r() * 50, pts = [[bx, by]], n = 5 + Math.floor(r() * 3);
        for (var i = 1; i <= n; i++) pts.push([bx + (r() - 0.5) * 150, by + i * (46 + r() * 22)]);
        st.bolt = { pts: pts, t: 0, flash: loud && !q };
        st.nextBolt = st.t + (K.quiet ? 6 + r() * 4 : 2.6 + r() * 1.6); st.thunderAt = st.t + 0.35;
      }
      if (st.thunderAt > 0 && st.t >= st.thunderAt) { st.thunderAt = -1; st.thunderOn = st.t; if (loud) snd('rumble', 1.7, 0.36); }
      if (st.t >= st.hornAt) { st.hornAt = st.t + (K.quiet ? 99 : 6.4); st.hornOn = st.t; if (loud) snd('horn', 3.6, 0.1 + 0.05 * Math.min(1, st.t / 30)); }   /* 점점 커진다(출 19:19) */
      if (st.bolt) { st.bolt.t += dt; if (st.bolt.t > 1.7) st.bolt = null; }
      if (!q && st.smoke.length < 26 && Math.random() < dt * 9) st.smoke.push({ x: PEAK.x - 300 + Math.random() * 600, y: PEAK.y + 10 + Math.random() * 260, r: 26 + Math.random() * 20, t: 0, life: 3.2 + Math.random() * 1.8, dx: (Math.random() - 0.5) * 16 });
      st.quake = loud && !q ? 1 : 0;
    } else { st.bolt = null; st.quake = 0; }
    for (var j = st.smoke.length - 1; j >= 0; j--) { var sm = st.smoke[j]; sm.t += dt; sm.y -= 52 * dt; sm.x += sm.dx * dt; sm.r += 20 * dt; if (sm.t > sm.life || !on) st.smoke.splice(j, 1); }
    if (!ov.toast.hidden && st.t - st.toastAt > 2.4) ov.toast.hidden = true;
  }
  function blob(x, y, rx, ry, fill) { g2.fillStyle = fill; g2.beginPath(); g2.ellipse(x, y, rx, ry, 0, 0, 6.3); g2.fill(); }
  function draw() {
    var s = cssH / st.cam.vh, g = g2, K = st.K, sto = st.storm, q = calm(), i;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, cssW, cssH);
    /* 1. 하늘 */
    var a = Math.floor(clamp(st.sky, 0, 2)), b = Math.min(2, a + 1), f = clamp(st.sky - a, 0, 1), top = mix(SKY[a][0], SKY[b][0], f), bot = mix(SKY[a][1], SKY[b][1], f);
    var hy = Y(HZ + 20), gr = g.createLinearGradient(0, 0, 0, Math.max(40, hy));
    gr.addColorStop(0, mixc(top, SKY[3][0], sto)); gr.addColorStop(1, mixc(bot, SKY[3][1], sto));
    g.fillStyle = gr; g.fillRect(0, 0, cssW, cssH);
    if (st.sky > 1.2 && sto < 0.5) { g.fillStyle = '#FBF7EE'; g.globalAlpha = clamp(st.sky - 1.2, 0, 0.8); STARS.forEach(function (p) { g.fillRect(p[0] * cssW, p[1] * hy, p[2], p[2]); }); g.globalAlpha = 1; }
    if (sto < 0.6) { var sunY = lerp(HZ - 520, HZ + 40, clamp(st.sky, 0, 1.25) / 1.25), sx = X(430, 0.3), sy = Y(sunY); g.globalAlpha = (1 - sto / 0.6) * (st.sky > 1.3 ? 0 : 1); blob(sx, sy, 62 * s, 62 * s, 'rgba(255,236,170,.45)'); blob(sx, sy, 40 * s, 40 * s, '#FFF1C4'); g.globalAlpha = 1; }
    /* 2. 땅의 바탕 */
    g.fillStyle = '#D2A463'; g.fillRect(0, Y(HZ + 30), cssW, cssH);
    /* 3. 산(셋째 날에는 흔들린다, 출 19:18) */
    var qx = st.quake ? Math.sin(st.t * 61) * 2.2 + Math.sin(st.t * 37) * 1.4 : 0, qy = st.quake ? Math.sin(st.t * 53) * 1.2 : 0;
    var M = pic('ot12_mountain').d, mx = X(MT.x, PM) + qx, my = Y(MT.y) + qy;
    g.drawImage(M, mx, my, 1536 * MT.k * s, 1024 * MT.k * s);
    if (sto > 0.02) {
      var px = X(PEAK.x, PM) + qx, py = Y(PEAK.y) + qy;
      /* 4. 불(출 19:18): 산꼭대기의 불꽃. 형상을 만들지 않는 뾰족한 불꽃 몇 가닥. 끝은 구름 속에 가린다 */
      g.globalAlpha = sto;
      /* 가운데가 높고 옆으로 낮아지는 한 덩이의 불. 가지런한 톱니 모양이 되지 않게 높이와 폭을 다르게 한다 */
      var FJ = [0.9, 1.18, 0.82, 1.1, 0.86, 1.15, 0.92];
      for (i = -3; i <= 3; i++) { var fx = px + i * 46 * s, fh = (250 - Math.abs(i) * 52) * FJ[i + 3] * (1 + (q ? 0 : 0.16 * Math.sin(st.t * 5.1 + i * 1.7))) * s, fw = (48 - Math.abs(i) * 4) * s; poly(g, [[fx - fw, py + 50 * s], [fx - fw * 0.25, py - fh * 0.5], [fx + fw * 0.1, py - fh], [fx + fw * 0.55, py - fh * 0.4], [fx + fw, py + 50 * s]], (i + 3) % 2 ? '#EA6A2A' : '#F08A2E'); }
      for (i = -2; i <= 2; i++) { var gx = px + i * 42 * s, gh = (150 - Math.abs(i) * 40) * FJ[i + 2] * (1 + (q ? 0 : 0.2 * Math.sin(st.t * 6.3 + i * 2.3))) * s; poly(g, [[gx - 26 * s, py + 50 * s], [gx - 4 * s, py - gh], [gx + 26 * s, py + 50 * s]], '#F7B733'); }
      /* 5. 연기(가마의 연기처럼 오르고, 산에 자욱하다) */
      VEIL.forEach(function (c) { g.globalAlpha = sto * 0.42; var dv = q ? 0 : Math.sin(st.t * 0.3 + c.ph) * 12; blob(X(c.x + dv, PM) + qx, Y(c.y), c.rx * s, c.ry * s, '#5A5468'); });
      st.smoke.forEach(function (m) { g.globalAlpha = sto * 0.5 * Math.sin(Math.min(1, m.t / m.life) * 3.14); blob(X(m.x, PM), Y(m.y), m.r * s, m.r * 0.8 * s, '#6E6672'); });
      /* 6. 빽빽한 구름(출 19:16): 납작한 덩이를 겹친다. 얼굴이나 사람처럼 보이는 모양을 만들지 않는다 */
      var tones = ['#34304A', '#4A4563', '#625C7C'];
      CLOUDS.forEach(function (c) { g.globalAlpha = sto; var dx2 = q ? 0 : Math.sin(st.t * 0.22 + c.ph) * 16; blob(X(c.x + dx2, PM), Y(c.y), c.rx * s, c.ry * s, tones[c.tone]); });
      g.globalAlpha = 1;
      /* 7. 번개 */
      if (st.bolt && st.bolt.t < (q ? 1.2 : 0.34)) {
        g.lineJoin = 'round'; g.lineCap = 'round';
        [['rgba(255,240,190,.28)', 16], ['#FFF6D0', 6]].forEach(function (L) { g.strokeStyle = L[0]; g.lineWidth = Math.max(2, L[1] * s); g.beginPath();
          st.bolt.pts.forEach(function (p, k) { var bx2 = X(p[0], PM), by2 = Y(p[1]); if (k) g.lineTo(bx2, by2); else g.moveTo(bx2, by2); }); g.stroke(); });
      }
    }
    /* 8. 광야와 진 */
    var P = pic('ot12_plain_camp').d;
    g.drawImage(P, X(0, 1), Y(0), W * s, 1024 * s);
    g.fillStyle = '#D2A463'; if (Y(1024) < cssH) g.fillRect(0, Y(1022), cssW, cssH - Y(1022));
    /* 9. 경계(출 19:12): 물건으로 그리지 않고 화면 점선으로만 보인다 */
    if (st.bound > 0.02) {
      g.globalAlpha = st.bound; g.strokeStyle = '#7AD0C8'; g.lineWidth = Math.max(2, 5 * s); g.setLineDash([16 * s, 12 * s]); g.beginPath();
      for (i = 0; i <= 20; i++) { var bw = 690 + (i / 20) * 860, byy = 642 + Math.pow(1 - i / 20, 2) * 30; if (i) g.lineTo(X(bw, 1), Y(byy)); else g.moveTo(X(bw, 1), Y(byy)); }
      g.stroke(); g.setLineDash([]);
      var lx = X(900, 1), ly = Y(656), lab = T() ? T().bound.label : '경계';
      if (lx > -40 && lx < cssW + 40) { g.font = '700 ' + Math.max(11, 30 * s) + 'px Jua, sans-serif'; var tw = g.measureText(lab).width; g.fillStyle = 'rgba(14,23,48,.72)'; rr(lx - tw / 2 - 9, ly - 12, tw + 18, 24, 12); g.fillStyle = '#7AD0C8'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(lab, lx, ly + 1); }
      g.globalAlpha = 1;
    }
    /* 10. 사람: 백성과 모세(뒷모습) */
    var PP = pic('ot12_people').d, pw = 470, phh = pw * 563 / 1536, jx = st.people.tr ? Math.sin(st.t * 47) * 1.6 * st.people.tr : 0;
    var MS = pic('ot12_moses').d, mh = 190 * st.moses.k, mw = mh * 1024 / 1536;
    if (st.moses.a > 0.01 && st.moses.y < st.people.y) { g.globalAlpha = st.moses.a; g.drawImage(MS, X(st.moses.x - mw / 2, 1), Y(st.moses.y - mh * 0.95), mw * s, mh * s); g.globalAlpha = 1; }
    g.drawImage(PP, 0, 461, 1536, 563, X(st.people.x - pw / 2 + jx, 1), Y(st.people.y - phh * 0.91), pw * s, phh * s);
    if (st.moses.a > 0.01 && st.moses.y >= st.people.y) { g.globalAlpha = st.moses.a; g.drawImage(MS, X(st.moses.x - mw / 2, 1), Y(st.moses.y - mh * 0.95), mw * s, mh * s); g.globalAlpha = 1; }
    /* 11. 셋째 날의 어두움과 불빛 */
    if (sto > 0.02) {
      g.fillStyle = 'rgba(30,26,52,' + (0.3 * sto).toFixed(3) + ')'; g.fillRect(0, 0, cssW, cssH);
      var glx = X(PEAK.x, PM), gly = Y(PEAK.y + 20), rg = g.createRadialGradient(glx, gly, 0, glx, gly, 420 * s);
      rg.addColorStop(0, 'rgba(255,170,70,' + (0.42 * sto).toFixed(3) + ')'); rg.addColorStop(1, 'rgba(255,170,70,0)');
      g.fillStyle = rg; g.fillRect(0, 0, cssW, cssH);
      if (st.bolt && st.bolt.flash && st.bolt.t < 0.09) { g.fillStyle = 'rgba(255,250,230,.22)'; g.fillRect(0, 0, cssW, cssH); }
    }
    /* 12. 수첩에 담을 것: 빛나는 동그라미 */
    st.spots = [];
    if (st.mode === 'note' && sto > 0.75) {
      if (!st.note.cloud) spot('cloud', X(PEAK.x - 330, PM), Y(PEAK.y - 200));
      if (!st.note.bolt && st.bolt && st.bolt.t < 1.7) spot('bolt', X(st.bolt.pts[3][0], PM), Y(st.bolt.pts[3][1]));
      if (!st.note.thunder && st.thunderOn && st.t - st.thunderOn < 2.2) spot('thunder', X(PEAK.x + 250, PM), Y(PEAK.y - 300));
      if (!st.note.horn && st.t - st.hornOn < 3.6) spot('horn', X(PEAK.x + 60, PM), Y(PEAK.y + 300));
    }
  }
  function mixc(rgb, hexc, t) { if (t <= 0) return rgb; var m = rgb.match(/\d+/g), y = hex(hexc); return 'rgb(' + Math.round(lerp(+m[0], y[0], t)) + ',' + Math.round(lerp(+m[1], y[1], t)) + ',' + Math.round(lerp(+m[2], y[2], t)) + ')'; }
  function rr(x, y, w, h, r) { g2.beginPath(); g2.moveTo(x + r, y); g2.arcTo(x + w, y, x + w, y + h, r); g2.arcTo(x + w, y + h, x, y + h, r); g2.arcTo(x, y + h, x, y, r); g2.arcTo(x, y, x + w, y, r); g2.closePath(); g2.fill(); }
  function spot(k, x, y) {
    var g = g2, r = 24, pu = calm() ? 0 : (st.t * 1.4) % 1;
    x = clamp(x, r + 6, cssW - r - 6); y = clamp(y, r + 96, cssH - r - 130);   /* 위의 날짜 표시와 아래의 수첩을 가리지 않게 */
    st.spots.push({ k: k, x: x, y: y, r: r });
    g.strokeStyle = '#E9B44C'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, r, 0, 6.3); g.stroke();
    g.globalAlpha = 1 - pu; g.beginPath(); g.arc(x, y, r + pu * 14, 0, 6.3); g.stroke(); g.globalAlpha = 1;
    g.fillStyle = 'rgba(14,23,48,.55)'; g.beginPath(); g.arc(x, y, r - 2, 0, 6.3); g.fill();
    g.strokeStyle = '#FBF7EE'; g.fillStyle = '#FBF7EE'; g.lineWidth = 2.4; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath();
    if (k === 'bolt') { g.moveTo(x + 3, y - 12); g.lineTo(x - 6, y + 1); g.lineTo(x + 2, y + 1); g.lineTo(x - 3, y + 12); g.stroke(); }
    else if (k === 'cloud') { g.arc(x - 6, y + 2, 6, 0, 6.3); g.arc(x + 2, y - 3, 8, 0, 6.3); g.arc(x + 8, y + 3, 5, 0, 6.3); g.fill(); }
    else { /* 소리: 퍼지는 물결. 우레는 세 줄, 나팔 소리는 두 줄과 점 */
      var n = k === 'thunder' ? 3 : 2; for (var i = 0; i < n; i++) { g.beginPath(); g.arc(x - 9, y, 6 + i * 6, -0.9, 0.9); g.stroke(); }
      if (k === 'horn') { g.beginPath(); g.arc(x - 9, y, 2.4, 0, 6.3); g.fill(); }
    }
  }

  BO3D.stage2d = {
    /* 이 장면에 무대가 있는지. 그림판을 쓸 수 없으면 예전 글 카드로 진행한다 */
    has: function (id) { var t = T(); if (!t || t.scene !== id) return false; try { return !!document.createElement('canvas').getContext('2d'); } catch (e) { return false; } },
    begin: function (id) { st = fresh(id); },
    key: function (s) { return s.k + (s.i !== undefined ? s.i : ''); },
    need: function (key) { var K = conf(key); return !!(K.need && !(st && st.done[key])); },
    tall: function (key) { return !!conf(key).tall; },
    enter: enter,
    text: T,
    /* 이 대목에서 손으로 하는 일의 안내 글과 감수 태그 */
    tip: function (key) { var K = conf(key), t = T(); return K.mode === 'wash' ? t.wash : K.mode === 'days' ? t.note : K.mode === 'walk' ? t.walk : K.mode === 'back' ? t.back : null; },
    debug: {
      state: function () { return st ? { id: st.id, key: st.key, mode: st.mode, done: Object.keys(st.done), storm: Math.round(st.storm * 100) / 100, sky: Math.round(st.sky * 100) / 100, cam: { cx: Math.round(st.cam.cx), top: Math.round(st.cam.top), vh: Math.round(st.cam.vh) }, people: { x: Math.round(st.people.x), y: Math.round(st.people.y) }, moses: { x: Math.round(st.moses.x), a: Math.round(st.moses.a * 100) / 100 }, note: Object.keys(st.note), walk: st.walk, back: st.back, size: [cssW, cssH] } : null; },
      real: function () { var o = {}; Object.keys(PH).forEach(function (k) { o[k] = !!(IMGS[k] && IMGS[k].real); }); return o; },
      spots: function () { var r = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 }; return st ? st.spots.map(function (h) { return { k: h.k, x: h.x + r.left, y: h.y + r.top }; }) : []; },
      /* 자동 시험: 지금 대목의 손으로 하는 일을 마친다 */
      finish: function () {
        if (!st || st.done[st.key] || !st.K.need) return false;
        if (st.mode === 'wash') { ov.wash.hidden = true; finish(null); }
        else if (st.K.mode === 'days') { st.daysT = 1; st.sky = 0; st.days = 9; st.storm = 1; st.stormTo = 1; showNote(); T().note.items.forEach(function (it) { st.note[it.key] = 1; }); finish(T().note.done); showNote(); }
        else if (st.mode === 'walk') walkBy(1); else if (st.mode === 'back') backBy(1);
        return true;
      }
    }
  };
})();
