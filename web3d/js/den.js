/* 아지트(타임머신 "덜컹이")와 줄기 임무 — 시범(docs/17 9절, docs/18, 대표 결정 6차 2026-11-17).
 * 탐험대 이야기(창작)다. 성경 내용에는 장절을 붙이고 본문을 싣지 않는다.
 * - 조종 칸: 박사의 설계도(성경에서 찾기 → 갈 곳 표시), 휴의 일지(물음 수첩, 양을 치던 사람들, 어린 양의 기록, 재료 카드)
 * - 온실: 감람나무 잔가지를 꽂아 기른다. 실제 날짜가 아니라 마친 장면 수(시간 이동)로만 자란다(규칙서 6절)
 * - 작업대: 양털 → 실 → 끈 → 구동 줄, 남은 끈으로 매듭 줄(재는 도구)
 * - 저장: bo3d.world.v1 하나만 쓴다. 진행 자료(bo3d.ot.v1)는 읽기만 한다
 * - 감수 태그(규칙서 13.11)는 자료의 rv·why를 그대로 보인다 */
window.BO3D = window.BO3D || {};
(function () {
  'use strict';
  var BO = window.BO3D, U = BO.ui, OT = BO.ot;
  if (!U || !OT || !OT.threads) return;
  var el = U.el, add = U.add, btn = U.btn, refChip = U.refChip, rv = U.rv, S = U.S;
  var TH = OT.threads, BPS = TH.blueprints || [], GH = TH.greenhouse, BN = TH.bench, MS = TH.measure;
  var root = document.getElementById('game');
  var box = el('div', { class: 'ot3 den4', hidden: '' });
  root.appendChild(box);

  /* ── 저장 ── */
  var KEY = 'bo3d.world.v1', W = {};
  function load() {
    try { W = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { W = {}; }
    ['bp', 'craft', 'meas', 'seen'].forEach(function (k) { if (!W[k] || typeof W[k] !== 'object') W[k] = {}; });
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(W)); } catch (e) { /* 저장할 수 없으면 이번 방문 동안만 */ } }
  load();

  /* ── 진행 자료 읽기(바꾸지 않는다) ── */
  function PG() { return BO.story && BO.story.pg ? BO.story.pg() : { done: {}, mats: {} }; }
  function doneN() { var d = PG().done, n = 0; OT.order.forEach(function (id) { if (d[id]) n++; }); return n; }
  function isDone(id) { return !!PG().done[id]; }
  function matsOf(id) { var m = OT.scenes[id] && OT.scenes[id].mission; return m && m.materials ? m.materials : []; }
  /* 설계도가 찾는 재료를 가진 장면들과, 그 재료를 얻었는지 */
  function wantScenes(bp) {
    var w = bp.want, out = [];
    OT.order.forEach(function (id) {
      if (w.scenes && w.scenes.indexOf(id) < 0) return;
      matsOf(id).forEach(function (m) { if (w.match ? m.name.indexOf(w.match) >= 0 : m.name === w.name) out.push({ id: id, key: m.key, name: m.name }); });
    });
    return out;
  }
  function hasWant(bp) { var mats = PG().mats; return wantScenes(bp).some(function (x) { return mats[x.id + ':' + x.key]; }); }
  function bp(id) { return BPS.filter(function (b) { return b.id === id; })[0]; }
  var OIL = bp('oil'), BELT = bp('belt');
  function twigGot() { return !!(OIL && hasWant(OIL)); }
  function woolGot() { return !!(BELT && hasWant(BELT)); }

  /* ── 온실: 꽂은 뒤로 마친 장면 수만큼 자란다 ── */
  function planted() { return !!W.plant; }
  function plantAge() { return W.plant ? Math.max(0, doneN() - W.plant.at) : 0; }
  function plantStage() { var a = plantAge(), st = GH.stages[0]; GH.stages.forEach(function (x) { if (a >= x.at) st = x; }); return st; }
  function leaning() { return planted() && doneN() - (W.plant.turnAt || W.plant.at) >= 2 && plantAge() >= 2; }
  function fruit() { return planted() && plantStage().key === 'fruit'; }

  /* ── 방과 설계도가 보이는 때 ── */
  function room(k) { return k === 'cockpit' ? true : k === 'green' ? twigGot() : k === 'bench' ? woolGot() : false; }
  function bpShown(b) { return b.id === 'oil' ? true : (!!W.bp.oil && planted()) || woolGot(); }
  function bpDone(b) { return b.id === 'oil' ? !!W.oil : !!W.craft.belt; }
  /* 지도와 마침 화면에 보일 소식 한 줄(없으면 null) */
  function news() {
    if (OIL && !W.bp.oil) return { k: 'bp-oil', text: '박사의 설계도 첫 장이 도착했어요!', room: 'cockpit' };
    if (twigGot() && !planted()) return { k: 'green', text: '덜컹이의 뒤칸 문이 열렸어요!', room: 'green' };
    if (BELT && bpShown(BELT) && !W.bp.belt) return { k: 'bp-belt', text: '설계도 둘째 장이 도착했어요!', room: 'cockpit' };   /* 양털을 먼저 얻었어도 설계도의 성경 물음이 먼저(답을 미리 말하지 않게, 13.9) */
    if (woolGot() && !W.craft.belt) return { k: 'bench', text: '작업대에 불이 켜졌어요. 양털로 줄을 만들어요!', room: 'bench' };
    if (W.craft.belt && !W.craft.rope) return { k: 'rope', text: '남은 끈으로 매듭 줄을 만들 수 있어요.', room: 'bench' };
    if (planted() && (W.seen.plant || 0) < plantAge() && plantStage().at > (W.seen.stageAt || 0)) return { k: 'grow', text: '온실의 나무가 자랐어요!', room: 'green' };
    if (fruit() && !W.oil) return { k: 'oil', text: '열매가 익었어요. 기름을 짤 수 있어요!', room: 'green' };
    return null;
  }
  /* 설계도가 가리키는 장면(지도의 표시): 성경에서 찾은 뒤, 아직 그 재료를 못 얻었을 때만 */
  function marks() {
    var out = {};
    BPS.forEach(function (b) { if (W.bp[b.id] && !hasWant(b)) wantScenes(b).forEach(function (x) { out[x.id] = b.shadow; }); });
    return out;
  }

  /* ── 소리 ── */
  function sfx(n) { U.sfx(n); }
  var CALM = function () { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); };
  function later(fn, ms) { setTimeout(fn, window.BO3D_TEST ? Math.min(ms, 30) : ms); }

  /* ── 그림: 덜컹이 바깥 모습(도입·지도) ── */
  function extArt(o) {
    o = o || {};
    var lights = '';
    for (var i = 0; i < 10; i++) lights += '<circle class="dl' + (o.lights && o.lights[i] ? ' on' : '') + '" cx="' + (64 + i * 8) + '" cy="96" r="2.6"/>';
    return '<svg class="dk-ext" viewBox="0 0 200 150" aria-hidden="true">'
      + '<g class="dk-legs"><path d="M72 112 L58 138 M100 118 L100 140 M128 112 L142 138" /><path d="M50 139 H66 M92 141 H108 M134 139 H150"/></g>'
      + '<ellipse class="dk-body" cx="100" cy="72" rx="52" ry="50"/>'
      + '<path class="dk-band" d="M50 84 Q100 100 150 84 L150 92 Q100 108 50 92 Z"/>'
      + '<circle class="dk-win" cx="100" cy="58" r="19"/><circle class="dk-glass" cx="100" cy="58" r="14.5"/><path class="dk-shine" d="M92 50 Q97 45 104 47"/>'
      + '<g class="dk-p p-ant"><path d="M124 28 L140 8"/><circle cx="141" cy="7" r="4"/></g>'
      + '<g class="dk-p p-lamp"><path d="M84 24 Q100 10 116 24 Z"/></g>'
      + '<g class="dk-p p-gear"><circle cx="150" cy="66" r="8"/><circle class="hole" cx="150" cy="66" r="3"/></g>'
      + '<g class="dk-p p-belt"><path d="M46 60 C34 62 34 84 46 86" fill="none"/></g>'
      + '<g class="dk-lights">' + lights + '</g>'
      + '<g class="dk-eyes"><circle cx="93" cy="58" r="2.4"/><circle cx="107" cy="58" r="2.4"/><path class="dk-mouth" d="M94 65 Q100 ' + (o.sad ? 61 : 69) + ' 106 65"/></g>'
      + '</svg>';
  }

  /* ── 그림: 덜컹이 안(세 칸) ── */
  function plantSvg(key, lean, big) {
    var s = '', t = lean ? ' transform="rotate(14 50 86)"' : '';
    s += '<path class="pot" d="M32 86 H68 L63 110 H37 Z"/><path class="soil" d="M34 86 H66 L65 91 H35 Z"/>';
    s += '<g' + t + '>';
    if (key === 'twig') s += '<path class="stem" d="M50 86 V62"/><path class="lf" d="M50 70 q9 -4 12 -12 q-10 1 -12 12"/>';
    if (key === 'leaf') s += '<path class="stem" d="M50 86 V58"/><path class="lf" d="M50 70 q9 -4 12 -12 q-10 1 -12 12"/><path class="lf new" d="M50 62 q-9 -3 -12 -11 q10 0 12 11"/>';
    if (key === 'root') s += '<path class="stem" d="M50 86 V52"/><path class="lf" d="M50 70 q9 -4 12 -12 q-10 1 -12 12"/><path class="lf" d="M50 62 q-9 -3 -12 -11 q10 0 12 11"/><path class="lf" d="M50 54 q8 -5 9 -13 q-9 3 -9 13"/><path class="rt" d="M50 92 q-6 6 -9 12 M50 92 q5 7 9 11 M50 92 v14"/>';
    if (key === 'young') s += '<path class="trunk" d="M50 86 V40"/><path class="lf" d="M50 72 q12 -4 15 -14 q-12 1 -15 14 M50 62 q-12 -3 -15 -13 q12 0 15 13 M50 52 q11 -5 13 -15 q-11 3 -13 15 M50 44 q-9 -5 -10 -14 q9 3 10 14"/>';
    if (key === 'branch' || key === 'flower' || key === 'fruit') {
      s += '<path class="trunk" d="M50 86 V34 M50 62 L30 44 M50 54 L72 36 M50 44 L40 26"/>';
      s += '<g class="crown"><ellipse cx="30" cy="40" rx="13" ry="9"/><ellipse cx="72" cy="33" rx="14" ry="10"/><ellipse cx="42" cy="22" rx="13" ry="9"/><ellipse cx="56" cy="30" rx="12" ry="9"/></g>';
      if (key === 'flower') s += '<g class="blossom"><circle cx="26" cy="38" r="2.2"/><circle cx="38" cy="20" r="2.2"/><circle cx="66" cy="30" r="2.2"/><circle cx="78" cy="36" r="2.2"/><circle cx="52" cy="26" r="2.2"/></g>';
      if (key === 'fruit') s += '<g class="olive"><ellipse cx="26" cy="46" rx="2.6" ry="3.6"/><ellipse cx="40" cy="28" rx="2.6" ry="3.6"/><ellipse cx="68" cy="40" rx="2.6" ry="3.6"/><ellipse cx="80" cy="34" rx="2.6" ry="3.6"/><ellipse cx="54" cy="37" rx="2.6" ry="3.6"/></g>';
    }
    s += '</g>';
    return '<svg class="plant' + (big ? ' big' : '') + '" viewBox="0 0 100 112" aria-hidden="true">' + s + '</svg>';
  }
  function cutArt(sel) {
    var g = twigGot(), b = woolGot(), fe = BO.story && BO.story.fixedEras ? BO.story.fixedEras() : 0, lights = '', i;
    for (i = 0; i < 10; i++) lights += '<circle class="dl' + (i < fe ? ' on' : '') + '" cx="' + (58 + i * 8.2) + '" cy="140" r="2.8"/>';
    var plant = planted() ? '<g transform="translate(246 82) scale(0.66)">' + plantSvg(plantStage().key, leaning()).replace(/<\/?svg[^>]*>/g, '') + '</g>' : '<path class="pot" d="M267 138 H293 L289 156 H271 Z"/>';
    function roomRect(k, x, w, open, label, inner) {
      return '<g class="rm' + (open ? ' open' : ' shut') + (sel === k ? ' sel' : '') + '" data-room="' + k + '">'
        + '<rect class="rm-bg" x="' + x + '" y="62" width="' + w + '" height="104" rx="10"/>'
        + (open ? inner : '<path class="crack" d="M' + (x + w / 2) + ' 70 V158"/><text class="lock" x="' + (x + w / 2) + '" y="120">?</text>')
        + '<text class="rm-t" x="' + (x + w / 2) + '" y="182">' + label + '</text></g>';
    }
    var cockpit = '<rect class="dash" x="50" y="130" width="92" height="20" rx="6"/>' + lights
      + '<circle class="seat" cx="72" cy="112" r="9"/><circle class="seat" cx="96" cy="112" r="9"/><circle class="seat" cx="120" cy="112" r="9"/>'
      + '<rect class="paper" x="60" y="72" width="30" height="22" rx="2"/><path class="pl" d="M65 79 H85 M65 84 H80 M65 89 H83"/>'
      + '<rect class="book" x="102" y="74" width="26" height="18" rx="2"/><path class="pl" d="M115 74 V92"/>';
    var bench = '<rect class="table" x="160" y="132" width="72" height="8" rx="2"/><path class="leg" d="M166 140 V160 M226 140 V160"/>'
      + (W.craft.thread ? '<circle class="yarn" cx="176" cy="124" r="8"/>' : '<ellipse class="wool" cx="178" cy="126" rx="11" ry="7"/>')
      + '<g class="wheel' + (W.craft.belt ? ' spin' : '') + '"><circle cx="212" cy="96" r="15"/><path d="M212 81 V111 M197 96 H227 M201.4 85.4 L222.6 106.6 M222.6 85.4 L201.4 106.6"/></g>'
      + (W.craft.belt ? '<path class="beltl" d="M212 81 Q238 70 232 120 Q226 150 205 130 Q190 112 212 111" />' : '<path class="beltx" d="M224 108 q8 14 2 26"/>')
      + (W.craft.rope ? '<path class="ropek" d="M166 76 q10 8 20 0 q10 -8 20 0"/><circle class="kn" cx="171" cy="79" r="1.8"/><circle class="kn" cx="186" cy="76" r="1.8"/><circle class="kn" cx="201" cy="73" r="1.8"/>' : '');
    var green = '<rect class="gwin" x="252" y="70" width="56" height="34" rx="6"/><path class="gbar" d="M280 70 V104 M252 87 H308"/>' + plant
      + '<rect class="shelf" x="250" y="158" width="60" height="4" rx="2"/>';
    return '<svg class="dk-cut" viewBox="22 4 316 192" role="img" aria-label="덜컹이 안의 세 칸">'
      + '<path class="hull" d="M30 60 Q30 40 60 40 H300 Q330 40 330 60 V168 Q330 190 300 190 H60 Q30 190 30 168 Z"/>'
      + '<path class="ant" d="M300 40 L318 14"/><circle class="antb" cx="319" cy="13" r="5"/>'
      + roomRect('cockpit', 44, 104, true, '조종 칸', cockpit)
      + roomRect('bench', 154, 84, b, '작업대', bench)
      + roomRect('green', 244, 72, g, '온실', green)
      + '</svg>';
  }

  /* ── 화면 틀 ── */
  var cur = { room: 'cockpit', page: null };
  function head(title, sub) {
    return [el('div', { class: 'eyebrow', text: '탐험대 이야기 · 타임머신 덜컹이' }), el('h1', { class: 'den-title', text: title }), sub ? el('p', { class: 'den-lead', text: sub }) : null];
  }
  function doctor(text) { return el('div', { class: 'comm3' }, el('span', { class: 'doc', html: DOC_SVG }), el('div', {}, el('small', { text: '탐험대 이야기 · 최현 박사의 통신' }), el('p', { text: text }))); }
  var DOC_SVG = '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="23" fill="#2F7C74"/><rect x="15" y="16" width="18" height="22" rx="4" fill="#FBF7EE"/><circle cx="24" cy="31" r="3" fill="#2F7C74"/><rect x="19" y="20" width="10" height="5" rx="1.5" fill="#7AD0C8"/><path d="M24 16 V8" stroke="#FBF7EE" stroke-width="2.4" stroke-linecap="round"/><path d="M17 9 Q24 3 31 9" stroke="#F7D774" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
  function note(text, cls) { return el('div', { class: 'note ' + (cls || 'story3') + ' fadein' }, el('span', {}, el('small', { text: '탐험대 이야기' }), el('b', { text: text }))); }
  function toMap() { box.hidden = true; box.replaceChildren(); if (BO.story) BO.story.openMap(); }

  function open(roomKey) {
    if (BO.story && BO.story.hide) BO.story.hide();
    if (roomKey && room(roomKey)) cur.room = roomKey;
    if (!room(cur.room)) cur.room = 'cockpit';
    cur.page = null; render();
  }
  function render() {
    var art = el('div', { class: 'dk-cutw', html: cutArt(cur.room) });
    Array.prototype.forEach.call(art.querySelectorAll('.rm'), function (g) {
      g.addEventListener('click', function () {
        var k = g.getAttribute('data-room');
        if (!room(k)) { sfx('clunk'); msg.replaceChildren(note(k === 'green' ? '뒤칸 문이 잠겨 있어요. 설계도의 재료를 찾아 오면 열려요.' : '이 문은 아직 잠겨 있어요. 설계도의 재료를 찾아 오면 열려요.', 'look')); return; }
        cur.room = k; sfx('pop'); render();
      });
    });
    var msg = el('div', { class: 'dk-msg' });
    var body = cur.room === 'green' ? greenPanel() : cur.room === 'bench' ? benchPanel() : cockpitPanel();
    box.replaceChildren(el('div', { class: 'otmap pad den4-in' }, head('아지트', '방을 눌러 들어가요. 닫힌 문은 설계도의 재료를 찾아 오면 열려요.'), art, msg,
      el('div', { class: 'dk-panel', 'data-room': cur.room }, body),
      el('div', { class: 'otmap-foot' }, btn('시대 지도', toMap, 'wide'))));
    box.className = 'ot3 map den4'; box.hidden = false;
    var sc = box.querySelector('.otmap'); if (sc) sc.scrollTop = 0;
  }

  /* ── 조종 칸: 설계도와 일지 ── */
  function bpCard(b) {
    var solved = !!W.bp[b.id], got = hasWant(b), done = bpDone(b), kids;
    var headRow = el('div', { class: 'bp-h' }, el('span', { class: 'bp-n', text: '설계도 ' + b.n }), el('b', { text: b.part }), rv(b.rv, b.why));
    var shadow = el('div', { class: 'bp-shadow' + (solved ? ' known' : '') }, el('i', { class: 'bp-ico ' + b.icon }), el('span', { text: solved ? b.want.name : '? · ' + b.shadow }));
    if (done) kids = [el('p', { class: 'bp-done', text: '끼웠어요! ' + b.part + ' 완성.' })];
    else if (!solved) {
      var out = el('div', {});
      kids = [doctor(b.problem), doctor(b.ask), U.blockFor(b.find, function () {
        W.bp[b.id] = 1; save(); sfx('fanfare');
        out.replaceChildren(doctor(b.found), el('div', { class: 'note good fadein' }, el('b', { text: '지도에 갈 곳이 표시됐어요.' }), refChip(b.ref)), btn('시대 지도에서 보기', toMap, 'plain'));
        out.scrollIntoView({ block: 'nearest' });
      }, 'bp' + b.id), out];
    } else if (!got) kids = [doctor(b.found), el('p', { class: 'ot-soft', text: '지도에서 표시(🔧)가 붙은 장면을 찾아가요.' })];
    else kids = [doctor(b.got), btn(b.id === 'oil' ? '온실로' : '작업대로', function () { open(b.id === 'oil' ? 'green' : 'bench'); }, 'plain')];
    return el('div', { class: 'bp' + (done ? ' done' : ''), 'data-bp': b.id }, headRow, shadow, kids);
  }
  function cockpitPanel() {
    if (cur.page) return pagePanel();
    var bps = BPS.filter(bpShown).map(bpCard);
    var open = notesOpen(), sh = listShown(TH.shepherds), lm = listShown(TH.lamb), cards = cardsGot();
    var journal = [
      open.all.length ? jbtn('물음 수첩', open.open.length ? '열린 물음 ' + open.open.length + '개' : '모두 닫혔어요', 'notes') : null,
      sh.length ? jbtn(TH.shepherds.title, sh.length + '줄', 'shepherds') : null,
      lm.length ? jbtn(TH.lamb.title, '성경에 적힌 곳', 'lamb') : null,
      cards.length ? jbtn('재료 카드', cards.length + '장', 'cards') : null,
      W.craft.rope ? jbtn(MS.title, '매듭 줄', 'measure') : null];
    var any = journal.some(function (x) { return x; });
    return [el('h2', { class: 'dk-h', text: '박사의 설계도' }), el('div', { class: 'bps' }, bps),
      el('h2', { class: 'dk-h', text: '휴의 일지' }), any ? el('div', { class: 'jbtns' }, journal) : el('p', { class: 'den-msg', text: '장면을 다녀오면 일지에 적을 것이 생겨요.' })];
  }
  function jbtn(title, sub, page) { return el('button', { class: 'jbtn', 'data-page': page, on: { click: function () { cur.page = page; sfx('pop'); render(); } } }, el('b', { text: title }), el('small', { text: sub })); }
  function notesOpen() {
    var all = (TH.notes || []).filter(function (n) { return isDone(n.after); });
    return { all: all, open: all.filter(function (n) { return !isDone(n.closeAfter); }) };
  }
  function listShown(t) { return t && t.list ? t.list.filter(function (x) { return isDone(x.after); }) : []; }
  function cardsGot() {
    var mats = PG().mats, out = [];
    (TH.cards || []).forEach(function (c) {
      var hit = null;
      OT.order.forEach(function (id) { matsOf(id).forEach(function (m) { if (!hit && m.name.indexOf(c.match) >= 0 && mats[id + ':' + m.key]) hit = { m: m, id: id }; }); });
      if (hit) out.push({ c: c, m: hit.m, id: hit.id });
    });
    return out;
  }
  function pagePanel() {
    var back = btn('일지 덮기', function () { cur.page = null; render(); }, 'plain'), kids = [];
    if (cur.page === 'notes') {
      kids = [el('h2', { class: 'dk-h', text: '물음 수첩' })].concat(notesOpen().all.map(function (n) {
        var closed = isDone(n.closeAfter);
        return el('div', { class: 'qn' + (closed ? ' closed' : '') }, el('b', { text: n.q }), rv(n.rv, n.why),
          closed ? [el('p', { text: n.a }), refChip(n.ref)] : el('small', { text: '답은 다른 시대의 성경에 있어요. 탐험을 이어 가요.' }));
      }));
    } else if (cur.page === 'shepherds' || cur.page === 'lamb') {
      var t = TH[cur.page];
      kids = [el('h2', { class: 'dk-h' }, t.title, rv(t.rv, t.why)), el('p', { class: 'den-lead', text: t.lead })].concat(listShown(t).map(function (x) {
        return el('div', { class: 'ln' }, refChip(x.ref), x.who ? el('b', { text: x.who }) : null, el('p', { text: x.text }), x.rv || x.why ? rv(x.rv || t.rv, x.why) : null);
      }));
      if (t.nt && isDone(t.nt.after)) kids.push(el('h3', { class: 'dk-h3' }, t.nt.title, rv(t.nt.rv, t.nt.why)), t.nt.list.map(function (x) { return el('div', { class: 'ln nt' }, refChip(x.ref), el('p', { text: x.text })); }));
    } else if (cur.page === 'cards') {
      kids = [el('h2', { class: 'dk-h', text: '재료 카드' })].concat(cardsGot().map(function (x) { return matFaces(x.c, x.m); }));
    } else if (cur.page === 'measure') kids = measurePanel();
    return [kids, back];
  }
  /* 재료 카드의 네 얼굴: 왜 찾았나 · 그 시대 · 무엇을 고쳤나 · 무엇을 만들었나 */
  function matFaces(c, m) {
    return el('div', { class: 'mc4' }, el('div', { class: 'mc4-h' }, el('b', { text: m.name }), rv(c.rv, c.why2)),
      el('div', { class: 'mc4-g' },
        el('div', {}, el('small', { text: '왜 찾았나' }), el('p', { text: c.why })),
        el('div', {}, el('small', { text: '성경과 그 시대' }), el('p', { text: c.era }), el('div', { class: 'ot-refs' }, c.refs.map(function (r) { return refChip(r); }))),
        el('div', {}, el('small', { text: '무엇을 고치나' }), el('p', { text: c.fix })),
        el('div', {}, el('small', { text: '무엇을 만드나' }), el('p', { text: c.make }))));
  }
  function cardFor(name) { var c = (TH.cards || []).filter(function (x) { return name.indexOf(x.match) >= 0; })[0]; return c || null; }

  /* ── 온실 ── */
  function greenPanel() {
    var out = el('div', { class: 'dk-out' }), kids = [el('h2', { class: 'dk-h' }, '온실', rv(GH.rv, GH.why))];
    if (!planted()) {
      kids.push(note(GH.open), doctor(OIL.got), el('div', { class: 'gh-pic', html: plantSvg('none', false, true) }),
        btn(GH.plant, function () { W.plant = { at: doneN(), turnAt: doneN(), water: 0 }; W.seen.plant = 0; W.seen.stageAt = 0; save(); sfx('pop'); render(); }, 'wide'));
      return kids;
    }
    var st = plantStage(), lean = leaning(), grew = (W.seen.stageAt || 0) < st.at;
    var pic = el('div', { class: 'gh-pic' + (grew && !CALM() ? ' grow' : ''), html: plantSvg(st.key, lean, true) });
    kids.push(pic, el('p', { class: 'gh-say', text: st.say }), st.key === 'twig' ? doctor(GH.doctor) : el('p', { class: 'ot-soft', text: '지금: ' + st.name + ' · 꽂은 뒤로 장면 ' + plantAge() + '개를 다녀왔어요.' }));
    if (grew) { sfx('fanfare'); W.seen.stageAt = st.at; }
    W.seen.plant = plantAge(); save();
    if (lean) kids.push(note(GH.lean, 'look'));
    var water = btn(GH.water, function () { W.plant.water = (W.plant.water || 0) + 1; save(); sfx('pop'); pic.classList.remove('wet'); void pic.offsetWidth; pic.classList.add('wet'); out.replaceChildren(el('p', { class: 'gh-say fadein', text: '쪼르르… 잎이 반짝여요.' })); }, 'plain');
    var turn = btn(GH.turn, function () { W.plant.turnAt = doneN(); save(); sfx('pop'); render(); }, 'plain');
    kids.push(el('div', { class: 'dk-row' }, water, lean ? turn : null), out);
    if (fruit()) kids.push(pressBlock());
    return kids;
  }
  function pressBlock() {
    var P = GH.press, out = el('div', {});
    if (W.oil) return el('div', { class: 'note good' }, el('b', { text: P.done }));
    var n = 0, bar = el('div', { class: 'pressbar' }, el('i', {})), last = 0;
    var b = btn(P.label, function () {
      var t = Date.now();
      if (t - last < 350 && !window.BO3D_TEST) { out.replaceChildren(el('p', { class: 'gh-say', text: '너무 빨라요. 천천히 눌러요.' })); last = t; return; }
      last = t; n++; sfx('pop'); bar.firstChild.style.width = Math.min(100, n * 20) + '%';
      if (n >= 5) { W.oil = 1; save(); sfx('fanfare'); render(); }
    }, 'wide');
    return el('div', { class: 'press' }, el('p', { class: 'ot-soft', text: P.hint }), bar, b, out);
  }

  /* ── 작업대 ── */
  function benchPanel() {
    var C = W.craft, kids = [el('h2', { class: 'dk-h' }, '작업대', rv(BN.rv, BN.why))], out = el('div', { class: 'dk-out' });
    if (!W.bp.belt) { kids.push(note(BN.open), el('p', { class: 'ot-soft', text: '무엇을 만들지는 박사의 설계도 둘째 장에 있어요. 조종 칸에서 먼저 펴 보세요.' }), btn('조종 칸으로', function () { open('cockpit'); }, 'plain')); return kids; }
    if (!C.thread) {
      var twist = 0, len = 0, sp = el('div', { class: 'spin', html: '<i class="spd"></i><i class="thr" style="width:0"></i>' });
      var say = el('p', { class: 'gh-say', text: '' });
      var tb = btn(BN.spin.twist, function () { twist++; sfx('pop'); sp.firstChild.style.transform = 'rotate(' + (twist * 70) + 'deg)'; say.textContent = twist >= 3 ? '꼬임이 충분해요. 당겨 보세요!' : '빙글…'; }, 'plain');
      var pb = btn(BN.spin.pull, function () {
        if (twist < 3) { twist = 0; sfx('clunk'); say.textContent = BN.spin.snap; sp.classList.remove('snap'); void sp.offsetWidth; sp.classList.add('snap'); return; }
        twist = 0; len++; sfx('ding'); sp.lastChild.style.width = (len * 25) + '%'; say.textContent = BN.spin.ok;
        if (len >= 4) { C.thread = 1; save(); sfx('fanfare'); later(render, 500); }
      }, 'plain');
      kids.push(note(BELT.got), el('h3', { class: 'dk-h3', text: '1 · ' + BN.spin.title }), el('p', { class: 'ot-soft', text: BN.spin.lead }), sp, say, el('div', { class: 'dk-row' }, tb, pb));
    } else if (!C.cord) {
      var say2 = el('p', { class: 'gh-say', text: '' });
      var same = btn(BN.ply.same, function () { sfx('clunk'); say2.textContent = BN.ply.bad; same.disabled = true; }, 'plain');
      var opp = btn(BN.ply.opp, function () { C.cord = 1; save(); sfx('fanfare'); say2.textContent = BN.ply.done; later(render, 700); }, 'plain');
      kids.push(el('p', { class: 'bp-done', text: BN.spin.done }), el('h3', { class: 'dk-h3', text: '2 · ' + BN.ply.title }), el('p', { class: 'ot-soft', text: BN.ply.lead }), el('div', { class: 'dk-col' }, same, opp), say2);
    } else if (!C.belt) {
      kids.push(el('p', { class: 'bp-done', text: BN.ply.done }), el('h3', { class: 'dk-h3', text: '3 · ' + BN.fit.title }),
        btn(BN.fit.btn, function () { C.belt = 1; save(); sfx('clunk'); later(function () { sfx('fanfare'); render(); }, 350); }, 'wide'));
    } else if (!C.rope) {
      var k = 0, rope = el('div', { class: 'rope', html: '<i class="rl"></i>' });
      var kb = btn(BN.knot.btn, function () {
        k++; sfx('pop'); var d = el('i', { class: 'kn' }); d.style.left = (k * 14) + '%'; rope.appendChild(d);
        if (k >= 6) { C.rope = 1; save(); sfx('fanfare'); if (BO.game && BO.game.refreshGear) BO.game.refreshGear(); later(render, 500); }
      }, 'wide');
      kids.push(el('p', { class: 'bp-done', text: BN.fit.done }), el('h3', { class: 'dk-h3', text: '4 · ' + BN.knot.title }), el('p', { class: 'ot-soft', text: BN.knot.lead }), rope, kb);
    } else {
      kids.push(el('p', { class: 'bp-done', text: BN.fit.done }), el('p', { class: 'bp-done', text: BN.knot.done }), measurePanel());
    }
    kids.push(out);
    return kids;
  }

  /* ── 재 보기(매듭 줄) ── */
  function measurePanel() {
    var kids = [el('h3', { class: 'dk-h3' }, MS.title, rv(MS.rv, MS.why)), el('p', { class: 'ot-soft', text: MS.lead })], out = el('div', {});
    var selfDone = function () { return el('div', { class: 'meas' }, el('div', { class: 'meas-pic', html: extArt({}) + '<i class="mrope"></i>' }), el('p', { class: 'gh-say', text: MS.self.done })); };
    if (W.meas.self) kids.push(selfDone());
    else kids.push(btn(MS.self.btn, function () { W.meas.self = 1; save(); sfx('ding'); render(); }, 'plain'));
    if (isDone(MS.ark.after)) {
      kids.push(el('h3', { class: 'dk-h3' }, MS.ark.btn, rv(MS.ark.rv, MS.ark.why)));
      if (W.meas.ark) kids.push(arkPic(), el('p', { class: 'gh-say', text: MS.ark.done }), refChip(MS.ark.find.ref));
      else kids.push(U.blockFor(MS.ark.find, function () { W.meas.ark = 1; save(); sfx('fanfare'); later(render, 600); }, 'msark'));
    }
    kids.push(out);
    return kids;
  }
  function arkPic() {
    return el('div', { class: 'arkpic', html: '<svg viewBox="0 0 320 70" aria-hidden="true"><rect class="ark" x="6" y="18" width="300" height="30" rx="5"/><path class="arkl" d="M6 28 H306 M6 38 H306"/><rect class="dkm" x="6" y="54" width="10" height="5" rx="2"/><text x="20" y="60">덜컹이</text><text x="150" y="13">방주: 길이 삼백 규빗</text></svg>' });
  }

  /* ── 날아간 양털(이야기 카드용): 처음 양털을 얻을 때 한 번만 ── */
  function windWanted(name) { return !W.wind && String(name || '').indexOf('양털') >= 0; }
  function windDone() { if (!W.wind) { W.wind = 1; save(); } }
  var windSpots = null;
  function windGame(done) {
    var spots = [0, 1, 2, 3, 4, 5, 6, 7], has = [5, 6, 2], found = 0;   /* 바람이 부는 쪽(오른쪽)에 걸린다 */
    windSpots = has.slice();
    var msg = el('p', { class: 'seek-msg', text: '휘이잉! 바람이 불어 양털이 날아갔어요. 풀이 눕는 쪽을 보고 덤불을 눌러 찾아요. 0 / 3' });
    var tiles = spots.map(function (k) {
      var b = el('button', { class: 'wind-t t' + k, 'aria-label': (k + 1) + '번 덤불', on: { click: function () {
        if (b.disabled) return; b.disabled = true;
        if (has.indexOf(k) >= 0) { found++; b.classList.add('hit'); sfx('pop'); msg.textContent = found >= 3 ? '다 찾았어요! 다음부터는 꼬아서 묶어 다니자.' : '찾았어요! ' + found + ' / 3'; if (found >= 3) { windDone(); sfx('fanfare'); later(done, 700); } }
        else { b.classList.add('miss'); msg.textContent = '여기에는 없어요. 풀이 눕는 쪽으로 더 가 봐요. ' + found + ' / 3'; }
      } } }, el('i', {}));
      return b;
    });
    sfx('gust');
    return el('div', { class: 'wind3' + (CALM() ? ' calm' : '') }, el('div', { class: 'eyebrow dark', text: '탐험대 이야기 · 날아간 양털' }), msg, el('div', { class: 'wind-field' }, el('i', { class: 'grass g1' }), el('i', { class: 'grass g2' }), el('i', { class: 'grass g3' }), tiles));
  }

  /* ── 재료를 얻은 순간: 덜컹이에 끼우는 한 줄(이야기 카드·3D 공통) ── */
  function installStrip(sceneId, mat) {
    var e = null; OT.eras.forEach(function (x) { if (x.scenes.indexOf(sceneId) >= 0) e = x; });
    var all = 0, got = 0, mats = PG().mats;
    if (e) e.scenes.forEach(function (id) { matsOf(id).forEach(function (m) { all++; if (mats[id + ':' + m.key]) got++; }); });
    var pips = []; for (var i = 0; i < all; i++) pips.push(el('i', { class: 'ip' + (i < got ? ' on' : '') + (i === got - 1 ? ' new' : '') }));
    var c = cardFor(mat.name);
    return el('div', { class: 'inst3 fadein' }, el('span', { class: 'inst-dk', html: extArt({}) }),
      el('div', {}, el('small', { text: '탐험대 이야기 · 덜컹이에 끼웠어요' }), el('div', { class: 'ips' }, pips),
        el('b', { text: e ? '시대 ' + e.era + ' 부속 ' + got + ' / ' + all + (got === all ? ' · 계기판 불이 켜졌어요!' : '') : '' }),
        c ? el('small', { class: 'inst-more', text: c.make === '온실의 나무' ? '남은 한 토막은 온실에 꽂을 수 있어요.' : '남은 것으로 ' + c.make + '도 만들 수 있어요.' }) : null));
  }

  /* 탐험 도구(만든 것): 3D 모형과 기록장이 읽는다 */
  function tools() { return { rope: !!W.craft.rope }; }

  BO.den = {
    open: open, news: news, marks: marks, extArt: extArt, plantSvg: plantSvg, windWanted: windWanted, windGame: windGame, windDone: windDone,
    installStrip: installStrip, tools: tools, room: room, cardFor: cardFor,
    hide: function () { box.hidden = true; box.replaceChildren(); },
    isOpen: function () { return !box.hidden; },
    debug: {
      raw: function () { return JSON.parse(JSON.stringify(W)); }, reload: load, reset: function () { W = {}; save(); load(); },
      state: function () { return { room: cur.room, page: cur.page, open: !box.hidden, twig: twigGot(), wool: woolGot(), planted: planted(), age: plantAge(), stage: planted() ? plantStage().key : null, lean: leaning(), craft: JSON.parse(JSON.stringify(W.craft)), bp: JSON.parse(JSON.stringify(W.bp)), news: news() ? news().k : null, marks: Object.keys(marks()) }; },
      windSpots: function () { return windSpots; }, q: function (id) { var b = bp(id); return b ? b.find : null; }, ark: function () { return MS.ark.find; }
    }
  };
})();
