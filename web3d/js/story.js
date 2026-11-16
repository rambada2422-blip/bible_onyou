/* 구약 전체의 흐름: 탐험대 이야기(비상 착륙) → 시대 지도(10개 시대, 40장면) → 장면.
 * 3D가 없는 장면은 이야기 카드로 보여 준다: 도착(최현 박사의 통신) → 동행 문답 → 지켜보기 → 관문 → 재료 얻기 → 오늘의 물음 → 말씀 카드 → 마무리.
 * 자료는 web3d/js/otdata.js(tools/build_ot.js가 content/ot/에서 만든다). 진행은 이 기기에만 저장한다(localStorage).
 * 규칙: 성경 본문은 싣지 않고 장절만. 탐험대 이야기(최현 박사, 재료, 타임머신)는 "탐험대 이야기"로 표시해 본문과 구분한다(규칙서 12절·13절).
 */
(function () {
  'use strict';
  var U = BO3D.ui, OT = BO3D.ot, ART = BO3D.eraArt;
  if (!U || !OT) return;
  var S = U.S, C = BO.content, el = U.el, add = U.add, tx = U.tx, btn = U.btn, refChip = U.refChip, icon = U.icon;
  var root = document.getElementById('game');
  var box = el('div', { class: 'ot3', hidden: '' });
  root.appendChild(box);
  var FX = function () { return BO3D.fx || null; };
  U.applySet();   /* 소리 끄기 설정을 소리 장치(fx.js)에 알린다 */
  var G = function () { return BO3D.game || null; };

  /* ── 진행 저장 (이 기기에만) ── */
  var KEY = 'bo3d.ot.v1', PG = {};
  function load() { try { PG = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { PG = {}; } ['done', 'mats', 'notes', 'q', 'time'].forEach(function (k) { if (!PG[k] || typeof PG[k] !== 'object' || Array.isArray(PG[k])) PG[k] = {}; }); }
  /* 놀이 기록(흥미 분석의 이탈 지점 재기, 이 기기에만 저장, 이름 없음): 화면마다 머문 시간, 2초 안에 넘긴 화면, 마지막 화면 */
  var LOGK = 'bo3d.log.v1', LOG = [];
  try { LOG = JSON.parse(localStorage.getItem(LOGK) || '[]') || []; } catch (e) { LOG = []; }
  var lastMark = null;
  function mark(where) {
    var t = Date.now();
    if (lastMark) { addTime(String(lastMark.w).split(' ')[0], t - lastMark.t); LOG.push({ w: lastMark.w, ms: t - lastMark.t, at: lastMark.t }); if (LOG.length > 800) LOG = LOG.slice(-800); try { localStorage.setItem(LOGK, JSON.stringify(LOG)); } catch (e) { /* 저장 못 하면 이번만 */ } }
    lastMark = where ? { w: where, t: t } : null;
  }
  var t3dWas = null;   /* 창을 가렸을 때 3D 안이었으면, 돌아왔을 때 3D 시간을 다시 센다 */
  /* 창을 닫거나 가릴 때(휴대폰 홈 단추는 보통 visibilitychange만 온다): 화면 시간과 3D 시간을 멈추고 "나간 곳"에 남긴다. 돌아오면 3D 시간을 다시 센다 */
  function onHide() {
    var in3d = t3d ? t3d.id : null;
    try { stop3d(); U.stopSpeak(); } catch (e0) { /* 무시 */ }
    if (in3d) t3dWas = in3d;
    if (lastMark) { var w = lastMark.w; mark(null); LOG.push({ w: w, exit: 1, at: Date.now() }); }
    else if (in3d) LOG.push({ w: in3d + '·3D', exit: 1, at: Date.now() });   /* 3D 안에서 나간 것도 "나간 곳"에 */
    try { localStorage.setItem(LOGK, JSON.stringify(LOG)); } catch (e) { /* 무시 */ }
  }
  function onShow() { if (t3dWas && !t3d) { var g = G(); if (g && g.in3d && g.in3d()) t3d = { id: t3dWas, t: Date.now() }; } t3dWas = null; }
  try {
    window.addEventListener('pagehide', onHide);
    window.addEventListener('pageshow', function (ev) { if (ev.persisted) onShow(); });
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') onHide(); else onShow(); });
  } catch (e) { /* 무시 */ }
  function exit3d(kind) { if (t3d) { LOG.push({ w: t3d.id + '·3D', exit: kind || 1, at: Date.now() }); try { localStorage.setItem(LOGK, JSON.stringify(LOG)); } catch (e) { /* 무시 */ } } }   /* 3D 도중 "지도"로 나감(game.js askMap) */
  function save() { try { localStorage.setItem(KEY, JSON.stringify(PG)); } catch (e) { /* 저장할 수 없는 환경이면 이번 방문 동안만 기억한다 */ } }
  load();
  /* 어른용 화면에 쓰는 기록(이 기기에만, 이름 없음): 장면별 걸린 시간, 물음마다 엇나간 횟수, 마친 날 */
  var IDLE = 5 * 60 * 1000;   /* 한 화면에 5분 넘게 머문 시간은 5분으로 센다(자리를 비운 시간) */
  function addTime(id, ms) { if (!/^OT-\d\d$/.test(id) || !(ms > 0)) return; PG.time[id] = (PG.time[id] || 0) + Math.min(ms, IDLE); save(); }
  function missFor(id, key, ref) { return function () { var k = id + ':' + S.tier + ':' + key, o = PG.q[k] || (PG.q[k] = { m: 0 }); o.m++; if (ref) o.r = ref; save(); }; }
  function setDone(id, extra) { var o = extra || {}; o.t = S.tier; o.at = Date.now(); if (PG.done[id] && PG.done[id].first) o.first = PG.done[id].first; else o.first = (PG.done[id] && PG.done[id].at) || o.at; PG.done[id] = o; if (!PG.start) PG.start = o.at; save(); }
  var t3d = null;   /* 3D 장면에 머문 시간 */
  function stop3d() { if (t3d) { PG.time[t3d.id] = (PG.time[t3d.id] || 0) + Math.min(Date.now() - t3d.t, 45 * 60 * 1000); save(); t3d = null; } }   /* 3D는 화면 구분이 없어 한 번에 45분까지만 센다 */
  /* 사진 도감(3D 장면에서 찍은 사진)을 이 기기에 남긴다. 설명은 장면 설정의 글(본문 사실과 장절)을 그대로 함께 적어 둔다 */
  var DEXK = 'bo3d.dex.v1', DX = {};
  try { DX = JSON.parse(localStorage.getItem(DEXK) || '{}') || {}; } catch (e) { DX = {}; }
  function saveDex() {
    try { localStorage.setItem(DEXK, JSON.stringify(DX)); return; } catch (e) { /* 자리가 모자람 */ }
    /* 자리가 모자라면 오래된 사진부터 그림만 빼고(이름·설명·장절은 남김) 들어갈 때까지 다시 넣는다. 여덟 번에 나눠 뺀다 */
    var old = [];
    Object.keys(DX).forEach(function (id) { Object.keys(DX[id]).forEach(function (k) { if (DX[id][k].img) old.push([DX[id][k].t || 0, id, k]); }); });
    old.sort(function (a, b) { return a[0] - b[0]; });
    var copy = JSON.parse(JSON.stringify(DX)), step = Math.max(1, Math.ceil(old.length / 8));
    for (var i = 0; i < old.length; i += step) {
      old.slice(i, i + step).forEach(function (x) { copy[x[1]][x[2]].img = ''; });
      try { localStorage.setItem(DEXK, JSON.stringify(copy)); return; } catch (e2) { /* 더 뺀다 */ }
    }
  }
  function saveShot(id, d, img) { if (!d || !d.id) return; (DX[id] || (DX[id] = {}))[d.id] = { n: d.name, d: d.desc, r: d.ref || '', img: img || '', t: Date.now() }; saveDex(); }
  function shotCount() { return Object.keys(DX).reduce(function (a, id) { return a + Object.keys(DX[id]).length; }, 0); }

  function sc(id) { return OT.scenes[id]; }
  function eraOf(n) { return OT.eras.filter(function (e) { return e.era === n; })[0]; }
  function mats(id) { var m = sc(id).mission; return m && m.materials ? m.materials : []; }
  var MAT_TOTAL = OT.order.reduce(function (a, id) { var n = mats(id).length; return a + (n || (sc(id).has3d ? 3 : 1)); }, 0);
  function matCount() { return Object.keys(PG.mats).length; }
  function doneCount() { return OT.order.filter(function (id) { return PG.done[id]; }).length; }
  function eraOpen(n) { if (n <= 1 || PG.unlockAll) return true; var pe = eraOf(n - 1); return pe.scenes.some(function (id) { return PG.done[id]; }); }
  function eraMats(e) { var all = 0, got = 0; e.scenes.forEach(function (id) { mats(id).forEach(function (x) { all++; if (PG.mats[id + ':' + x.key]) got++; }); }); return { all: all, got: got }; }
  function nextOf(id) { var i = OT.order.indexOf(id); return i >= 0 && i < OT.order.length - 1 ? OT.order[i + 1] : null; }

  /* ── 작은 그림 ── */
  var DOC_SVG = '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="23" fill="#2F7C74"/><rect x="15" y="16" width="18" height="22" rx="4" fill="#FBF7EE"/><circle cx="24" cy="31" r="3" fill="#2F7C74"/><rect x="19" y="20" width="10" height="5" rx="1.5" fill="#7AD0C8"/><path d="M24 16 V8" stroke="#FBF7EE" stroke-width="2.4" stroke-linecap="round"/><path d="M17 9 Q24 3 31 9" stroke="#F7D774" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M13 6 Q24 -2 35 6" stroke="#F7D774" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/></svg>';
  var MAT_SVG = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 20 Q24 12 38 20 L35 40 Q24 45 13 40 Z" fill="#C9A769"/><path d="M14 22 Q24 17 34 22" stroke="#8A6A3A" stroke-width="2" fill="none"/><path d="M17 15 Q24 6 31 15" stroke="#8A6A3A" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="24" cy="30" r="4" fill="#E9B44C"/></svg>';
  /* 받침이 있으면 b(과·은), 없으면 a(와·는) */
  function josa(w, a, b) { var c = String(w).charCodeAt(String(w).length - 1); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? b : a; }
  function svgSpan(svg, cls) { return el('span', { class: cls, html: svg }); }
  function doctor(text, kicker) {
    return el('div', { class: 'comm3' }, svgSpan(DOC_SVG, 'doc'),
      el('div', {}, el('small', { text: kicker || '탐험대 이야기 · 최현 박사의 통신' }), el('p', { text: text })));
  }
  function story(text) { return el('div', { class: 'note story3' }, icon('compass'), el('span', {}, el('small', { text: '탐험대 이야기' }), el('b', { text: text }))); }
  function beatNodes(b) {
    return [el('div', { class: 'narr-meta' }, refChip(b.ref)), el('p', { class: 'narr', text: tx(b.text) }),
      b.say ? U.say(b.say.who, b.say.text) : null,
      b.open ? el('div', { class: 'openbible' }, icon('book'), el('span', {}, '하나님이 하신 말씀은 성경책에서 직접 읽어요. ', el('b', { text: U.bookName(b.open) }))) : null];
  }

  /* ── 화면 틀: 위는 시대 풍경, 아래는 아이보리 시트 ── */
  var cur = { screen: 'none', id: null, step: 0, steps: [], k: '' };
  function show(kind, eraKey, top, body, foot, opts) {
    opts = opts || {};
    if (kind === 'era' || kind === 'pick') mark(null);   /* 기록하지 않는 화면(시대 안내·3D 고르기)에서는 앞 화면의 시간을 닫는다(pack 갈래 2차 검증) */
    box.replaceChildren();
    box.className = 'ot3 ' + kind + (opts.tall ? ' tall' : '');
    if (eraKey) add(box, el('div', { class: 'ot-stage', html: ART ? ART.art(eraKey, opts.art) : '' }));
    if (top) add(box, el('div', { class: 'ot-top pad' }, top));
    var b = el('div', { class: 'sheet-body pad' }), f = el('div', { class: 'sheet-foot pad' });
    U.stopSpeak();
    add(b, body); add(f, [U.speakBtn(function () { return b; }), foot]);
    add(box, el('div', { class: 'ot-sheet sheet' }, b, f));
    box.hidden = false; b.scrollTop = 0;
    if (U.moreHint) U.moreHint(b, f);   /* 글이 아래로 더 있으면 "아래에 더 있어요" */
    return b;
  }
  function topBar(label) {
    return [el('button', { class: 'ot-back', 'aria-label': '시대 지도', on: { click: function () { openMap(); } } }, icon('arrow'), el('span', { text: '시대 지도' })),
      label ? el('span', { class: 'place', text: label }) : null, sndBtn()];
  }
  /* 소리 끄기·켜기(설정과 같은 값). 이야기 카드 위쪽 오른쪽 */
  function sndBtn() {
    var b = el('button', { class: 'ot-snd', 'aria-label': U.set.snd ? '소리 끄기' : '소리 켜기', 'aria-pressed': String(!U.set.snd), on: { click: function () {
      U.set.snd = U.set.snd ? 0 : 1; U.saveSet(); b.setAttribute('aria-pressed', String(!U.set.snd)); b.setAttribute('aria-label', U.set.snd ? '소리 끄기' : '소리 켜기');
    } } }, icon('speaker'));
    return b;
  }
  function enterStory() {
    root.className = 'g3 app ' + S.tier;
    var g = G(); if (g) g.toStory();
  }

  /* ── 처음: 비상 착륙 (탐험대 이야기) ── */
  function intro(then) {
    cur.screen = 'intro';
    var st = OT.story, i = 0;
    function line(l) {
      if (l.who === 'doctor') return doctor(l.text);
      if (l.who === 'narr') return el('p', { class: 'narr', text: l.text });
      return U.say(l.who, l.text);
    }
    /* 첫 1분 안내를 세 걸음으로(전에는 줄마다 한 번씩 네 번): ① 무슨 일이 났나 ② 어떻게 하나 ③ 준비물(성경책). 걸음마다 한 화면에 들어오게 */
    var cut = Math.min(2, st.lines.length - 1), N = 3;
    function step() {
      var last = i === N - 1, body;
      if (i === 0) body = st.lines.slice(0, cut).map(line);
      else if (i === 1) body = [st.lines.slice(cut).map(line), el('p', { class: 'den-msg ot-rule', text: st.rule })];
      else body = [el('div', { class: 'ready3' }, el('b', { text: '시작하기 전에' }),
        el('span', {}, icon('bookline'), '성경책을 곁에 펴 두세요. 물음이 나오면 성경책에서 찾아 읽고 답해요.'),
        S.tier === 't1' ? el('span', {}, icon('compass'), '찾기 어려우면 부모님이나 선생님과 함께 찾아요.') : null,
        el('span', {}, icon('journal'), '장면을 마치면 탐험 일지에 말씀 카드가 들어와요. 언제든 쉬어 가도 진행은 이 기기에 남아요.'))];
      show('intro', 'patriarchs', null,
        [el('div', { class: 'eyebrow dark', text: '탐험대 이야기 ' + (i + 1) + ' / ' + N }), el('h2', { class: 'ot-title', text: i === N - 1 ? '준비됐나요?' : st.title }), body],
        [i > 0 ? btn('이전', function () { i--; step(); }, 'plain') : null, btn(last ? '시대 지도 보기' : '다음', function () { if (last) { PG.seenIntro = 1; save(); then(); } else { i++; step(); } })]);
    }
    step();
  }

  /* ── 시대 지도 ── */
  function openMap(scrollTo) {
    stop3d(); U.stopSpeak(); U.onMiss = null; mark(null); ambience(null);
    enterStory();
    if (!PG.seenIntro) { intro(function () { openMap(); }); return; }
    cur.screen = 'map'; cur.id = null;
    var eras = OT.eras.map(function (e) {
      var open = eraOpen(e.era), em = eraMats(e), fixed = em.all && em.got === em.all;
      var cards = e.scenes.map(function (id) {
        var d = sc(id), done = PG.done[id];
        return el('button', { class: 'otc' + (done ? ' done' : '') + (open ? '' : ' locked'), 'data-id': id, on: { click: function () { if (open) openScene(id); else lockNote(e); } } },
          el('span', { class: 'n', text: id.replace('OT-', '') }),
          el('span', { class: 'tt' }, el('b', { text: d.title }), el('small', { text: U.bookName(d.ref) })),
          el('span', { class: 'bd' }, d.has3d ? el('i', { class: 'b3', text: '3D' }) : null, d.review && d.review.required ? el('i', { class: 'br', text: '감수 필수' }) : null, done ? el('i', { class: 'bk', text: '마침' }) : null));
      });
      var nd = e.scenes.filter(function (id) { return PG.done[id]; }).length;
      return el('section', { class: 'ote' + (open ? '' : ' locked'), id: 'ote-' + e.era },
        el('button', { class: 'ote-h', on: { click: function () { if (open) openEra(e.era); else lockNote(e); } } },
          el('span', { class: 'ote-art', html: ART ? ART.art(e.key, { align: 'bottom' }) : '' }),
          el('span', { class: 'ote-t' }, el('small', { text: '시대 ' + e.era + (open ? '' : ' · 잠김') }), el('b', { text: e.name }),
            el('em', { text: open ? nd + ' / ' + e.scenes.length + ' 장면 · 부속 ' + em.got + ' / ' + em.all + (fixed ? ' · 수리 끝!' : '') : '앞 시대의 장면 하나를 마치면 열려요' }))),
        el('div', { class: 'otcs' }, cards));
    });
    box.replaceChildren();
    box.className = 'ot3 map';
    var list = el('div', { class: 'otmap pad' },
      el('div', { class: 'eyebrow', text: '구약 전체 · 10개 시대 40장면' }),
      el('h1', { class: 'den-title', text: '시대 지도' }),
      el('div', { class: 'otstat' },
        el('span', { class: 'count teal', text: '마친 장면 ' + doneCount() + ' / ' + OT.order.length }),
        el('span', { class: 'count', text: '모은 재료 ' + matCount() + ' / ' + MAT_TOTAL })),
      repairMeter(),
      el('p', { class: 'den-lead', text: '시대마다 타임머신 부속을 고쳐요. 앞 시대의 장면 하나를 마치면 다음 시대로 가는 길이 열려요.' }),
      eras,
      el('div', { class: 'otmap-foot' },
        btn('탐험 일지', function () { openJournal(); }, 'quiet'), btn('수리 현황', openRepair, 'quiet'),
        btn('설정', function () { openSettings(function () { openMap(); }); }, 'quiet'), btn('비상 착륙 이야기', function () { intro(function () { openMap(); }); }, 'quiet'),
        btn('부모·교사 화면', openAdultGate, 'quiet'),
        /#log/.test(location.hash) ? btn('놀이 기록 보기', openLog, 'quiet') : null,
        btn('처음 화면', function () { closeAll(); var g = G(); if (g) g.menu(); }, 'quiet')),
      el('p', { class: 'fine', text: '감수 전 시험판입니다. 모든 장면은 목사님 감수를 마치기 전이며, 아이들에게 공개하지 않습니다.' }));
    /* 읽어 주기(8~10세는 늘): 지도 전체가 아니라 진도와 열린 시대·장면 이름만 읽는다 */
    var sb = U.speakBtn(function () {
      var open = OT.eras.filter(function (e) { return eraOpen(e.era); }), shut = OT.eras.length - open.length;
      return el('div', {}, el('p', { text: '시대 지도' }), el('p', { text: '마친 장면 ' + doneCount() + ' / ' + OT.order.length + '. 모은 재료 ' + matCount() + ' / ' + MAT_TOTAL }),
        open.map(function (e) {   /* 아직 마치지 않은 장면이 있는 열린 시대 가운데 앞의 둘만 장면 이름까지, 나머지는 시대 이름과 마친 수만(짧게) */
          var nd = e.scenes.filter(function (id) { return PG.done[id]; }).length, front = open.filter(function (x) { return x.scenes.some(function (id) { return !PG.done[id]; }); }).slice(0, 2);
          return el('p', { text: '시대 ' + e.era + ', ' + e.name + '. ' + (front.indexOf(e) >= 0 ? e.scenes.map(function (id) { return sc(id).title + (PG.done[id] ? ', 마침' : ''); }).join('. ') : e.scenes.length + '장면 가운데 ' + nd + '장면 마침') });
        }),
        shut ? el('p', { text: '아직 열리지 않은 시대가 ' + shut + '개 있어요. 앞 시대의 장면 하나를 마치면 다음 시대로 가는 길이 열려요.' }) : null);
    });
    if (sb) { sb.classList.add('float'); list.insertBefore(sb, list.firstChild); }
    box.appendChild(list);
    box.hidden = false;
    if (scrollTo) { var t = document.getElementById('ote-' + scrollTo); if (t) list.scrollTop = t.offsetTop - 8; }
  }

  /* 타임머신 수리 막대: 시대마다 부속 하나. 그 시대의 재료를 다 모으면 부속이 고쳐진다(탐험대 이야기) */
  function repairMeter() {
    var cells = OT.eras.map(function (e) { var em = eraMats(e), r = em.all ? em.got / em.all : 0; return el('span', { class: 'rm-cell' + (r >= 1 ? ' full' : ''), title: '시대 ' + e.era }, el('i', { style: 'height:' + Math.round(r * 100) + '%' })); });
    var fixed = OT.eras.filter(function (e) { var em = eraMats(e); return em.all && em.got === em.all; }).length;
    return el('div', { class: 'rmeter' }, el('div', { class: 'rm-row' }, cells), el('small', { text: '탐험대 이야기 · 타임머신 부속 ' + fixed + ' / ' + OT.eras.length + ' 고침 (재료 ' + matCount() + ' / ' + MAT_TOTAL + ')' }));
  }
  function lockNote(e) {
    var nb = box.querySelector('.lock-note'); if (nb) nb.remove();
    var t = el('div', { class: 'note look lock-note fadein' }, el('b', { text: '아직 열리지 않았어요' }), el('span', { text: '시대 ' + (e.era - 1) + '의 장면 하나를 마치면 "' + e.name + '" 시대로 가는 길이 열려요.' }));
    var sec = document.getElementById('ote-' + e.era); if (sec) sec.insertBefore(t, sec.children[1]);
  }
  /* 아이 시험용(주소 끝 #log일 때만): 다음 아이를 위해 이 기기의 진행·사진·놀이 기록을 모두 지운다. 두 번 눌러야 지운다(pack 갈래 2차 검증) */
  /* 이 기기의 진행·사진·놀이 기록·영상 본 표시를 모두 지우고, 이미 만든 3D 장면이 기억하던 사진·깃발도 잊게 한다(부모·교사 화면과 시험용 지우기가 함께 쓴다) */
  function wipeAll() {
    lastMark = null; t3d = null; t3dWas = null; PG = {}; save(); load(); DX = {}; LOG = [];
    try { localStorage.removeItem(DEXK); localStorage.removeItem(LOGK); for (var i = localStorage.length - 1; i >= 0; i--) { var k = localStorage.key(i); if (k && k.indexOf('bo3d.vision.') === 0) localStorage.removeItem(k); } } catch (e) { /* 무시 */ }
    var g = BO3D.game; if (g && g.forget) { try { g.forget(); } catch (e2) { /* 무시 */ } }
  }
  function testWipe() {
    if (!/#log/.test(location.hash)) return null;
    var b = btn('진행 지우기(시험용)', function () {
      if (!b.getAttribute('data-sure')) { b.setAttribute('data-sure', '1'); b.textContent = '정말 지울까요? 한 번 더 누르면 진행·사진·놀이 기록을 모두 지워요'; return; }
      wipeAll(); openLog(true);
    }, 'quiet');
    return b;
  }
  /* 놀이 기록 보기(주소 끝 #log): 장면별 머문 시간, 2초 안에 넘긴 화면 수, 나간 곳 */
  function openLog(adult) {   /* adult: 부모·교사 화면(어른 확인)에서 왔을 때만 지우는 단추를 보인다(아이 시험 중 아이가 지우지 않게) */
    adult = adult === true;
    mark(null);   /* 놀이 기록을 보는 동안 앞 화면의 시간이 늘지 않게(pack 갈래 2차 검증) */
    cur.screen = 'log';
    var by = {}, exits = [];
    LOG.forEach(function (x) { var id = String(x.w || '').split(' ')[0]; if (x.exit) { exits.push(x.w); return; } var o = by[id] || (by[id] = { n: 0, quick: 0, ms: 0 }); o.n++; o.ms += x.ms; if (x.ms < 2000) o.quick++; });
    var rows = Object.keys(by).sort().map(function (k) { var o = by[k]; return el('tr', {}, el('td', { text: k }), el('td', { text: String(o.n) }), el('td', { text: o.quick + ' (' + Math.round(o.quick / o.n * 100) + '%)' }), el('td', { text: Math.round(o.ms / 1000) + '초' })); });
    var ta = el('textarea', { readonly: '', 'aria-label': '기록 원본' }); ta.value = JSON.stringify(LOG);
    box.replaceChildren(el('div', { class: 'otmap pad' }, el('div', { class: 'eyebrow', text: '아이 시험용 · 이 기기에만 저장' }), el('h1', { class: 'den-title', text: '놀이 기록' }),
      el('table', { class: 'logt' }, el('tr', {}, el('th', { text: '장면' }), el('th', { text: '화면' }), el('th', { text: '2초 안에 넘김' }), el('th', { text: '머문 시간' })), rows),
      el('p', { class: 'den-lead', text: '나간 곳: ' + (exits.slice(-10).join(', ') || '없음') }), ta,
      el('div', { class: 'otmap-foot' }, adult ? btn('기록 지우기', function () { mark(null); LOG = []; lastMark = null; try { localStorage.removeItem(LOGK); } catch (e) { /* 무시 */ } openLog(true); }, 'quiet') : null, adult ? testWipe() : null,
        btn('부모·교사 화면', openAdultGate, 'quiet'), btn('시대 지도', function () { openMap(); }, 'quiet')),
      adult ? null : el('p', { class: 'fine', text: '기록을 지우려면 부모·교사 화면에서 "놀이 기록"을 여세요.' })));
    box.className = 'ot3 map'; box.hidden = false;
  }

  /* ── 시대 안내: 최현 박사의 통신과 "이 사이에 성경이 기록한 곳"(장절만) ── */
  function openEra(n) {
    cur.screen = 'era';
    var e = eraOf(n);
    show('era', e.key, topBar('시대 ' + e.era + ' · ' + e.name),
      [el('div', { class: 'eyebrow dark', text: '시대 ' + e.era }), el('h2', { class: 'ot-title', text: e.name }),
        doctor(e.intro),
        el('h3', { class: 'ot-h3', text: '이 시대에서 볼 장면' }),
        el('div', { class: 'found-list' }, e.scenes.map(function (id) { return el('div', { class: 'it' }, el('span', { text: sc(id).title + ' ' }), refChip(sc(id).ref)); })),
        /* 장면 사이의 기록은 접어 둔다(작은 화면에서 시대 안내가 길어 스크롤이 컸다). 펼치면 그대로 보인다 */
        e.between && e.between.length ? el('p', { class: 'ot-soft betweenlead', text: '이 탐험에서는 장면으로 보지 않지만, 성경은 장면 사이에도 이야기를 기록했어요. 성경책에서 직접 찾아 읽어 보세요.' }) : null,
        e.between && e.between.length ? el('details', { class: 'closefold betweenfold' }, el('summary', {}, el('span', { text: '장면 사이에 성경이 기록한 곳 (' + e.between.length + '곳)' }), el('span', { class: 'foldhint nospeak', text: ' 펼치기' })),
          el('div', { class: 'ot-refs' }, e.between.map(function (r) { return el('span', { class: 'ref', text: U.bookName(r) }); }))) : null],
      [btn('지도로', function () { openMap(n); }, 'plain'), btn('첫 장면으로', function () { openScene(e.scenes[0]); })]);
  }

  /* ── 장면 들어가기: 타임머신 이동 → (3D가 있으면 고르기) → 이야기 카드 ── */
  function warp(title, sub, fn) {
    mark(null);   /* 이동 화면은 앞 화면(마침 등)의 시간에 넣지 않는다(독립 검증 ⑥) */
    cur.screen = 'warp';
    box.replaceChildren(el('div', { class: 'otwarp pad' }, el('div', { class: 'eyebrow', text: '탐험대 이야기 · 시간 이동' }), el('h1', { class: 'den-title', text: title }), el('p', { class: 'den-lead', text: sub }), el('div', { class: 'otwarp-ring' })));
    box.className = 'ot3 warpbox'; box.hidden = false;
    var f = FX(); if (f && f.audio) { try { f.audio.chime(); } catch (e) { /* 소리 없이 진행 */ } }
    setTimeout(fn, BO3D_FAST() ? 50 : 1200);
  }
  function BO3D_FAST() { return !!window.BO3D_TEST; }
  function openScene(id) {
    enterStory();
    var d = sc(id), e = eraOf(d.era);
    if (!eraOpen(e.era)) { openMap(e.era); lockNote(e); return; }
    if (U.setScene) U.setScene(d);   /* 엇나간 바늘이 같은 장면 안인지 알게 */
    var g3 = BO3D.scenes3d && BO3D.scenes3d[id];
    if (g3) {
      cur.screen = 'pick'; cur.id = id;
      show('pick', e.key, topBar('시대 ' + e.era + ' · ' + e.name),
        [el('div', { class: 'eyebrow dark', text: id + ' · 시대 ' + e.era }), el('h2', { class: 'ot-title', text: d.title }), refChip(d.ref),
          el('p', { class: 'ot-soft', text: '이 장면은 직접 걸어 다니며 볼 수 있어요. 휴대폰이 느리면 이야기 카드로 볼 수도 있어요.' })],
        [btn('이야기 카드로', function () { warp(d.title, U.bookName(d.ref), function () { play(id); }); }, 'plain'),
          btn('걸어서 탐험 (3D)', function () { warp(d.title, U.bookName(d.ref), function () { closeAll(); t3d = { id: id, t: Date.now() }; var g = G(); if (g) g.start3d(id); }); })]);
      return;
    }
    warp(d.title, U.bookName(d.ref), function () { play(id); });
  }

  /* ── 이야기 카드의 분위기 소리(합성 소리, fx.js). 본문이 그 대목에 있다고 말하는 것만, 그 대목을 지켜보는 동안에만 깐다: 물·센 바람·밤·모인 무리.
   * 표에 없는 장면·대목은 낮은 바람과 화음만 난다. 도착·관문·재료 찾기·오늘의 물음·마침 화면에서는 끈다.
   * 만들지 않는 것: 하나님의 음성, 말씀 낭독, 찬송, 우레·나팔처럼 하나님이 나타나심에 속한 소리, 싸움·우상 잔치·원망하거나 거역하는 무리의 소리,
   * 죽음·심판·애통 대목의 소리, 본문에 바람이 없는데 "광야니까" 넣는 바람(독립 대조 2026-11-16: 처음 표 17줄 가운데 7줄을 빼고 10줄을 대목 단위로 좁힘).
   * on: 소리 종류마다 켜는 대목 번호(0부터). basis: 근거 장절. ── */
  var AMB = {
    'OT-01': { basis: '창 1:2', on: { water: [0, 1, 2, 3, 4] } },          /* 수면(1:2), 물이 모여 바다가 됨(1:9-10), 물의 생물(1:20-22) */
    'OT-03': { basis: '창 7:17-18', on: { water: [3, 4] } },               /* 물이 불어난 대목(7:17-24)과 물이 줄어드는 대목(8:1-14)만 */
    'OT-07': { basis: '창 28:11', on: { night: [0, 1, 2, 3, 4] } },        /* 해가 져서 거기서 밤을 지냄. 아침(28:18)부터는 끈다 */
    'OT-11': { basis: '출 14:21', on: { water: [0, 1, 2, 3, 4, 5, 6], gale: [4] } },   /* 바닷가(14:2). 큰 동풍은 그 대목(14:21-22)만 */
    'OT-17': { basis: '수 2:2-5', on: { night: [1, 2, 3, 4, 5] } },        /* "이 밤에", "어두워 성문을 닫을 때" */
    'OT-18': { basis: '수 3:15', on: { water: [0, 1] } },                  /* 요단이 언덕에 넘침. 물이 그친 대목(3:16)부터는 끈다 */
    'OT-20': { basis: '수 24:1', on: { crowd: [0] } },                     /* 모든 지파가 세겜에 모인 대목만. 말씀을 전하는 대목부터는 끈다 */
    'OT-21': { basis: '삿 7:9', on: { night: [4, 5] } },                   /* "그 밤에"(7:9-18). 나팔과 싸움 대목(7:19-22)은 끈다 */
    'OT-29': { basis: '왕상 12:3', on: { crowd: [0, 1] } },                /* 온 회중이 와서 말한 대목(12:1-5)만 */
    'OT-31': { basis: '욘 1:4', on: { water: [1, 2], gale: [1] } }         /* 바다 위의 큰 바람과 폭풍(1:4-12), 바다가 그치기까지(1:13-17) */
  };
  function ambFor(id, bi) { var a = id && AMB[id], out = []; if (a && typeof bi === 'number') Object.keys(a.on).forEach(function (k) { if (a.on[k].indexOf(bi) >= 0) out.push(k); }); return out; }
  function ambience(id, bi) { var f = FX(); if (f && f.audio && f.audio.ambience) { try { f.audio.ambience(ambFor(id, bi)); } catch (e) { /* 소리 없이 진행 */ } } }

  /* ── 이야기 카드 재생 ── */
  function buildSteps(d) {
    var m = d.mission || null, st = [{ k: 'arrive' }], cp = m && m.companion;
    if (cp && cp.when !== 'after') cp.talks.forEach(function (t, i) { st.push({ k: 'talk', i: i }); });
    /* 현장 돕기(규칙서 13.6): 대목 뒤에 끼우고, 뜻을 묻는 단계는 관문 뒤에 둔다(관문의 답을 미리 듣지 않게) */
    var hp = m && m.help && m.help.steps ? m.help.steps : [];
    d.beats.forEach(function (b, i) { st.push({ k: 'beat', i: i }); hp.forEach(function (h, j) { if (h.after === i) st.push({ k: 'help', i: j }); }); });
    (d.gates[S.tier] || d.gates.t2).forEach(function (q, i) { st.push({ k: 'gate', i: i }); });
    /* 사건 뒤의 문답은 관문 뒤에 둔다: 문답의 장절이 관문 물음의 답을 미리 알려 주지 않게(2026-11-15 임무 독립 대조) */
    if (cp && cp.when === 'after') cp.talks.forEach(function (t, i) { st.push({ k: 'talk', i: i }); });
    /* 뜻 묻기(현장 돕기의 ask)는 동행 문답 뒤에: 본문에서 뒤에 한 말을 먼저 묻지 않게(독립 대조 지적) */
    hp.forEach(function (h, j) { if (h.after === 'gates') st.push({ k: 'help', i: j }); });
    var ms = m ? m.materials || [] : [];
    if (ms.length === 3 && d.quests && d.quests.length === 3) ms.forEach(function (x, i) { st.push({ k: 'quest', i: i }); });
    else ms.forEach(function (x, i) { st.push({ k: 'mat', i: i }); });
    if (m && m.today) m.today.forEach(function (x, i) { st.push({ k: 'today', i: i }); });
    st.push({ k: 'finish' });
    return st;
  }
  function play(id) {
    var d = sc(id);
    cur.screen = 'play'; cur.id = id; cur.steps = buildSteps(d); cur.step = 0;
    var f = FX(); if (f && f.audio) { try { f.audio.start(); f.audio.pad(true); } catch (e) { /* 무시 */ } }
    render();
  }
  var KICK = { talk: '동행', beat: '지켜보기', help: '현장 돕기', gate: '다음으로 가는 관문', quest: '재료 찾기', mat: '재료 얻기', today: '오늘의 물음' };
  function nOf(k) { return cur.steps.filter(function (s) { return s.k === k; }).length; }
  function render() {
    var d = sc(cur.id), e = eraOf(d.era), s = cur.steps[cur.step], m = d.mission || {};
    cur.k = s.k; U.onMiss = null;
    if (cur.screen !== 'seg') {   /* 3D 안의 조각은 3D 시간(t3d)으로만 센다(겹쳐 세지 않게). 분위기 소리도 이야기 카드에서만 */
      mark(cur.id + ' ' + s.k + (s.i !== undefined ? s.i : ''));
      var hb = s.k === 'help' ? m.help.steps[s.i].after : null;
      ambience(cur.id, s.k === 'beat' ? s.i : (typeof hb === 'number' ? hb : null));
    } else mark(cur.id + '·3D ' + s.k + (s.i !== undefined ? s.i : ''));   /* 3D 안의 문답·돕기 화면은 이름을 달리 기록한다(장면별 걸린 시간에는 넣지 않음: 첫 낱말이 OT-NN이 아님) */
    var last = cur.step === cur.steps.length - 1, next = cur.steps[cur.step + 1];
    var kick = s.k in KICK ? KICK[s.k] + ' ' + (s.i + 1) + ' / ' + (s.k === 'help' ? m.help.steps.length : nOf(s.k)) : '';
    var nextLabel = !next ? '' : (next.k === 'gate' && s.k !== 'gate' ? '다음으로 가는 관문' : (next.k === 'finish' ? '탐험 마치기' : '다음'));
    var nb = next ? btn(nextLabel, go) : null, body = [], gated = false;
    var prev = (s.k === 'beat' || s.k === 'talk') && cur.step > 0 && cur.steps[cur.step - 1].k !== 'arrive' ? btn('이전', function () { cur.step--; render(); }, 'plain') : null;
    function ok() { if (nb) nb.disabled = false; }
    if (s.k === 'arrive') {
      body = [el('div', { class: 'eyebrow dark', text: d.id + ' · 시대 ' + e.era + ' ' + e.name }), el('h2', { class: 'ot-title', text: d.title }),
        el('div', { class: 'ot-meta' }, refChip(d.ref), el('span', { class: 'ot-place', text: d.place })),
        doctor(m.call ? tx(m.call) : '도착했어! 장면을 끝까지 지켜보고, 수리에 쓸 재료를 찾아보자. 사건이 일어나는 자리에는 다가가지 말자.'),
        (m.materials && m.materials.length) ? el('p', { class: 'ot-soft', text: '이 장면에서 구할 재료 ' + m.materials.length + '가지' }) : null,
        d.review && d.review.required ? el('p', { class: 'pending', text: '목사님 감수가 꼭 필요한 장면이에요(감수 전).' }) : null];
      if (nb) nb.textContent = m.companion && m.companion.when !== 'after' ? '함께 걷기' : '지켜보러 가기';
    } else if (s.k === 'talk') {
      var cp = m.companion, t = cp.talks[s.i];
      body = [el('div', { class: 'q-kicker', text: kick + ' · ' + cp.who }),
        s.i === 0 ? el('p', { class: 'ot-soft', text: cp.who + josa(cp.who, '와', '과') + ' 함께 걸어요. ' + cp.who + josa(cp.who, '는', '은') + ' 성경에 기록된 자기 말만 해요. 실제 말은 성경책에서 읽어요.' }) : null,
        U.say(t.ask.who, t.ask.text),
        el('div', { class: 'otans' }, el('b', { text: cp.who }), el('p', { text: tx(t.answer) }), refChip(t.ref)),
        el('div', { class: 'openbible' }, icon('book'), el('span', {}, cp.who + '의 말은 성경책에서 직접 읽어요. ', el('b', { text: U.bookName(t.open) })))];
    } else if (s.k === 'beat') {
      body = [el('div', { class: 'q-kicker', text: kick }), beatNodes(d.beats[s.i])];
    } else if (s.k === 'help') {
      U.onMiss = missFor(cur.id, 'help' + s.i);
      body = helpNodes(m.help, m.help.steps[s.i], kick, ok); gated = true;
      var hn = cur.screen === 'seg' && cur.helpNote ? cur.helpNote(m.help.steps[s.i].after) : null;
      if (hn) body.splice(2, 0, el('div', { class: 'note story3' }, el('span', {}, el('small', { text: '탐험대 이야기' }), el('b', { text: hn }))));   /* 3D에서 때가 앞선 돕기(되돌아보는 대목 뒤)를 밝힌다 */
    } else if (s.k === 'gate') {
      var q = (d.gates[S.tier] || d.gates.t2)[s.i];
      U.onMiss = missFor(cur.id, 'gate' + s.i);
      body = [el('div', { class: 'q-kicker', text: kick }), U.blockFor(q, ok, 'og' + s.i)]; gated = true;
    } else if (s.k === 'quest') {
      var Q = d.quests[s.i], mt = m.materials[s.i], qq = Q.q[S.tier] || Q.q.t2, got = el('div', {});
      U.onMiss = missFor(cur.id, 'quest' + s.i);
      body = [el('div', { class: 'eyebrow dark', text: '탐험대 이야기' }), el('div', { class: 'q-kicker', text: kick + ' · ' + mt.name }),
        el('div', { class: 'bibleq3' }, icon('bookline'), el('span', { text: '성경 물음 · ' + (S.tier === 't1' ? U.chapterOf(qq.ref || d.ref) : (S.tier === 't2' ? U.bookName(qq.ref || d.ref) : U.bookOf(d.ref) + '에서 찾아보세요')) })),
        U.blockFor(U.quizTier(qq), function () { got.replaceChildren(matCard(mt, Q)); take(mt); ok(); got.scrollIntoView({ block: 'nearest' }); }, 'oq' + s.i), got];
      gated = true;
    } else if (s.k === 'mat') {
      var mm = m.materials[s.i];
      if (PG.mats[cur.id + ':' + mm.key]) body = [el('div', { class: 'q-kicker', text: kick }), matCard(mm, null)];
      else { body = [el('div', { class: 'q-kicker', text: kick }), seekNodes(mm, ok)]; gated = true; }
    } else if (s.k === 'today') {
      var td = m.today[s.i];
      body = [el('div', { class: 'q-kicker', text: kick }),
        el('div', { class: 'today3' }, el('small', { text: '지금 우리가 궁금한 것' }), el('b', { text: td.q })),
        doctor(tx(td.a), '최현 박사의 대답 · 근거는 성경 장절'),
        el('div', { class: 'ot-refs' }, td.refs.map(function (r) { return refChip(r); })),
        el('p', { class: 'pending', text: '오늘의 물음은 목사님 감수를 마치기 전이에요.' })];
    } else if (s.k === 'finish') {
      finish(d); return;
    }
    if (nb && gated) nb.disabled = true;
    if (cur.screen === 'seg') {
      var fin = cur.seg;
      if (!next) { nb = btn('계속', function () { closeAll(); if (fin) fin(); }); if (gated) nb.disabled = true; }   /* 3D 안의 현장 돕기 조각도 마쳐야 계속(ok()가 이 단추를 연다) */
      show('seg', null, null, body, [prev, nb]);
      return;
    }
    show('play', e.key, topBar(d.title), body, [prev, nb], { art: artOpts(d, s) });
  }
  /* 배경: 장면과 대목을 알려 주면 그 대목의 그림을 그린다(sceneart.js, 없으면 시대 풍경). at은 도착 -1, 대목 번호, 대목이 다 끝난 뒤 'end'.
     창조 장면은 대목마다 지어진 것만 그린다(eraart.js의 stage) */
  function artOpts(d, s) {
    var at = 'end', ha, cp = d.mission && d.mission.companion;
    if (s.k === 'arrive' || (s.k === 'talk' && cp && cp.when !== 'after')) at = -1;
    else if (s.k === 'beat') at = s.i;
    else if (s.k === 'help') { ha = d.mission.help.steps[s.i].after; if (typeof ha === 'number') at = ha; }   /* 돕기 단계는 그 앞 대목까지 지어진 것만 */
    var o = { scene: d.id, at: at };
    if (d.id === 'OT-01') o.stage = s.k === 'arrive' ? 0 : (typeof at === 'number' && at >= 0 ? at : 9);
    return o;
  }
  /* 현장 돕기 한 단계(규칙서 13.6). do: 본문에 그 사람들이 했다고 적힌 평범한 일을 누르며 돕는다 / watch: 거룩한 행위는 곁에서 본다
     stay: 함께 기다린다 / ask: 그 뜻을 묻고, 본문에 기록된 말로 답을 듣고, 성경을 펴서 확인한다 */
  function helpNodes(h, hs, kick, ok) {
    var head = [el('div', { class: 'eyebrow dark', text: '탐험대 이야기 · 현장 돕기' }), el('div', { class: 'q-kicker', text: kick + ' · ' + hs.title })];
    var got = el('div', { class: 'help-got' });
    if (hs.kind === 'do') {
      var left = hs.tasks.length;
      var tasks = hs.tasks.map(function (t) {
        var b = el('button', { class: 'opt help-task', 'aria-pressed': 'false', on: { click: function () {
          if (b.getAttribute('aria-pressed') === 'true') return;
          b.setAttribute('aria-pressed', 'true'); b.disabled = true; left--;
          if (!left) { got.replaceChildren(U.say(hs.done.who, hs.done.text)); ok(); got.scrollIntoView({ block: 'nearest' }); }
        } } }, el('span', { class: 'mark', html: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5 L6.5 12 L13 4.5" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' }), el('span', { text: t }));
        return b;
      });
      return head.concat([el('p', { class: 'narr', text: tx(hs.text) }), el('div', { class: 'narr-meta' }, refChip(hs.basis)),
        el('p', { class: 'ot-soft', text: '눌러서 해 보세요. 성경의 사건은 바꾸지 않고, 곁에서 평범한 일만 해요.' }), el('div', { class: 'opts' }, tasks), got]);
    }
    if (hs.kind === 'watch') {
      setTimeout(ok, 0);
      return head.concat([el('p', { class: 'narr', text: tx(hs.text) }), el('div', { class: 'narr-meta' }, refChip(hs.basis)),
        el('div', { class: 'note look' }, el('b', { text: '지켜봐요' }), el('span', { text: '우리는 손대지 않고 지켜봐요. 성경에 적힌 일은 성경에 적힌 대로 일어나요.' })),
        hs.say ? U.say(hs.say.who, hs.say.text) : null]);
    }
    if (hs.kind === 'stay') {
      var wb = el('button', { class: 'btn plain', on: { click: function () { wb.disabled = true; got.replaceChildren(hs.say ? U.say(hs.say.who, hs.say.text) : story('기다렸어요.')); ok(); got.scrollIntoView({ block: 'nearest' }); } } }, hs.wait);
      return head.concat([el('p', { class: 'narr', text: tx(hs.text) }), el('div', { class: 'narr-meta' }, refChip(hs.basis)), wb, got]);
    }
    /* ask: 아이가 묻고 → 본문에 기록된 말로 답을 듣고 → 성경을 펴서 뜻을 확인한다 */
    var nt = hs.nt && S.tier === 't3' ? el('div', { class: 'note story3' }, el('span', {}, el('small', { text: '신약과 이어 읽기 · 목사님 감수 전' }), el('b', { text: hs.nt.text }), el('div', { class: 'ot-refs' }, refChip(hs.nt.ref)))) : null;
    return head.concat([U.say(hs.ask.who, hs.ask.text),
      el('div', { class: 'otans' }, el('b', { text: hs.by || h.who }), el('p', { text: tx(hs.answer) }), refChip(hs.basis)),
      doctor('그 뜻을 성경에서 직접 확인해 보자. 성경책을 펴서 읽어 봐.', '탐험대 이야기 · 최현 박사'),
      U.blockFor(hs.read[S.tier] || hs.read.t2, function () { if (nt) got.replaceChildren(nt); ok(); got.scrollIntoView({ block: 'nearest' }); }, 'oh' + hs.title.length), got]);
  }
  /* 숨은 재료 찾기(탐험대 이야기): 탐지기가 가까우면 빠르게, 멀면 느리게 울린다. 여섯 곳 가운데 하나에 숨어 있다 */
  var SEEK_ICONS = ['rock', 'sand', 'grass', 'rock', 'grass', 'sand'];
  function seekSpot(mm) { var h = 0, k = cur.id + mm.key; for (var i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) % 9973; return h % 6; }
  function seekNodes(mm, ok) {
    var spot = seekSpot(mm), got = el('div', {}), msg = el('p', { class: 'seek-msg', text: '탐지기가 이 근처를 가리켜요. 땅을 눌러 ' + mm.name + josa(mm.name, '를', '을') + ' 찾아보세요.' }), tries = 0;
    var tiles = [0, 1, 2, 3, 4, 5].map(function (k) {
      var b = el('button', { class: 'seek-t ' + SEEK_ICONS[k], 'aria-label': (k + 1) + '번 땅', on: { click: function () {
        if (b.disabled) return; tries++;
        if (k === spot) {
          tiles.forEach(function (x) { x.disabled = true; }); b.classList.add('hit'); grid.classList.add('found');
          msg.textContent = '찾았어요!';   /* 몇 번 만에 찾았는지는 말하지 않는다(운을 칭찬하거나 횟수를 점수처럼 보이지 않게, 6절 점검) */
          take(mm); got.replaceChildren(matCard(mm, null)); ok(); got.scrollIntoView({ block: 'nearest' }); mark(cur.id + ' seek-found');
        } else {
          b.disabled = true; b.classList.add('miss');
          var dist = Math.abs((k % 3) - (spot % 3)) + Math.abs(Math.floor(k / 3) - Math.floor(spot / 3));
          msg.textContent = dist === 1 ? '삐삐삐! 아주 가까워요.' : '삐… 조금 멀어요. 다른 곳을 눌러 보세요.';
        }
      } } });
      return b;
    });
    var grid = el('div', { class: 'seek' }, tiles);
    return [el('div', { class: 'eyebrow dark', text: '탐험대 이야기 · 재료 찾기' }), msg, grid, got];
  }
  function go() { if (cur.step < cur.steps.length - 1) { cur.step++; render(); } }
  function take(mt) { if (mt && mt.key) { PG.mats[cur.id + ':' + mt.key] = 1; save(); } }
  function matCard(mt, Q) {
    return el('div', { class: 'matcard fadein' },
      el('div', { class: 'mh' }, svgSpan(MAT_SVG, 'mi'), el('div', {}, el('small', { text: '탐험대 이야기 · 재료를 얻었어요' }), el('b', { text: mt.name })), refChip(mt.basis)),
      U.say(S.ch, mt.line),
      el('p', { class: 'ot-soft', text: mt.how }),
      doctor(mt.use, '최현 박사'),
      Q && Q.q && Q.q[S.tier] && Q.q[S.tier].after ? el('div', { class: 'note good' }, el('b', { text: Q.q[S.tier].after })) : null);
  }
  function finish(d) {
    var c = d.close[S.tier] || d.close.t2, e = eraOf(d.era), nx = nextOf(d.id);
    setDone(d.id); ambience(null);
    var kids_ = [el('div', { class: 'q-kicker', text: '탐험을 마치며' }),
      el('p', { class: 'q-prompt', text: '탐험 일지에 말씀 카드가 들어왔어요.' }),
      el('div', { class: 'vcards fin' }, d.cards.map(function (cd) {   /* 마침 화면에서는 카드를 작게, 되풀이되던 "성경책에서 직접 읽어 보세요"는 아래 한 번만(작은 화면 스크롤 줄이기) */
        return el('div', { class: 'vcard pop' }, el('div', { class: 'r', text: cd.ref }), el('div', { class: 't', text: cd.title }));
      })),
      el('p', { class: 'vcards-m', text: '말씀은 성경책에서 직접 찾아 읽어 보세요.' })];
    var lastOfEra = e.scenes[e.scenes.length - 1] === d.id, closeAt = kids_.length;
    if (c.kind === 'prayer') kids_.push(el('div', { class: 'closebox' }, el('h3', { text: '한 문장 기도' }), el('p', { text: c.text })));
    if (c.kind === 'practice') kids_.push(el('div', { class: 'closebox' }, el('h3', { text: '이번 주 실천 한 가지' }), el('p', { text: c.text })));
    if (c.kind === 'note') {
      var ta = el('textarea', { id: 'ot-note', 'aria-label': '기록', placeholder: '여기에 적어 보세요. 이 기기에만 저장돼요.' });
      ta.value = PG.notes[d.id] || '';
      ta.addEventListener('input', function () { PG.notes[d.id] = ta.value.slice(0, 2000); save(); });
      kids_.push(el('div', { class: 'closebox' }, el('h3', { text: '탐험 기록' }), el('p', { text: c.prompt }), ta));
      kids_.push(el('p', { class: 'pending', text: '뜻과 삶의 적용을 묻는 질문은 목사님 감수를 마친 뒤 이 자리에 열립니다.' }));
    }
    /* 시대의 마지막 장면이 아니면 마무리(기도·실천·기록)를 접어 둔다(흥미 분석: 40장면 모두 같은 마무리) */
    if (!lastOfEra && kids_.length > closeAt) { var inner = kids_.splice(closeAt); kids_.push(el('details', { class: 'closefold' }, el('summary', { text: '마무리 펼치기 · ' + (c.kind === 'prayer' ? '한 문장 기도' : c.kind === 'practice' ? '이번 주 실천' : '탐험 기록') }), inner)); }
    var got = mats(d.id);
    kids_.push(el('div', { class: 'closebox reward3' }, el('h3', { text: '탐험대 이야기' }),
      el('p', { text: (got.length ? '이 장면에서 재료 ' + got.length + '가지(' + got.map(function (x) { return x.name; }).join(', ') + ')를 얻었어요. ' : '') + '모은 재료 ' + matCount() + ' / ' + MAT_TOTAL + '. 과거에는 아무것도 남기지 않았어요.' })));
    kids_.push(el('p', { class: 'ot-soft', text: '오늘은 여기까지 해도 좋아요. 진행은 이 기기에 저장돼요.' }));
    var nextBtn = nx ? btn(sc(nx).era !== d.era ? '다음 시대로' : '다음 장면', function () { if (sc(nx).era !== d.era) openEra(sc(nx).era); else openScene(nx); }) : btn('시대 지도', function () { openMap(); });
    cur.k = 'finish';
    /* 마침 화면의 그림: 그 장면의 끝 그림(art 갈래 sceneart.js가 있으면). 없으면 그림 함수가 scene·at을 모른 채 시대 풍경을 그린다. 창조(OT-01)는 다 지어진 단계 */
    show('play', e.key, topBar(d.title), kids_, [btn('시대 지도', function () { openMap(d.era); }, 'plain'), nextBtn], { art: d.id === 'OT-01' ? { scene: d.id, at: 'end', stage: 9 } : { scene: d.id, at: 'end' } });
  }

  /* ── 수리 현황: 모은 재료 (탐험대 이야기) ── */
  function openRepair() {
    cur.screen = 'repair';
    var rows = OT.eras.map(function (e) {
      var items = [];
      e.scenes.forEach(function (id) { mats(id).forEach(function (x) { var has = PG.mats[id + ':' + x.key]; items.push(el('div', { class: 'slot' + (has ? ' on' : '') }, svgSpan(MAT_SVG, 'mi'), el('b', { text: has ? x.name : '?' }), el('span', { text: has ? sc(id).title : '아직 못 얻었어요' }))); }); });
      return el('div', {}, el('h2', { text: '시대 ' + e.era + ' · ' + e.name }), items.length ? el('div', { class: 'slots' }, items) : el('p', { class: 'den-msg', text: '재료 정보가 아직 준비되지 않았어요.' }));
    });
    box.replaceChildren(el('div', { class: 'otmap pad' },
      el('div', { class: 'eyebrow', text: '탐험대 이야기' }), el('h1', { class: 'den-title', text: '타임머신 수리 현황' }),
      el('p', { class: 'den-lead', text: '모은 재료 ' + matCount() + ' / ' + MAT_TOTAL + '. 그 시대의 평범한 재료로 부속을 대신 만들어요. 기념품은 가져오지 않아요.' }),
      rows, el('div', { class: 'otmap-foot' }, btn('시대 지도', function () { openMap(); }, 'wide'))));
    box.className = 'ot3 map'; box.hidden = false;
  }

  /* ── 어두운 바탕의 한 장짜리 화면(일지·설정·어른용)의 틀 ── */
  function page(kind, kids_) {
    U.stopSpeak(); mark(null);
    var pg = el('div', { class: 'otmap pad ' + kind }, kids_);
    if (kind === 'journal' || kind === 'settings') { var sb = U.speakBtn(function () { return pg; }); if (sb) { sb.classList.add('float'); pg.insertBefore(sb, pg.firstChild); } }
    box.replaceChildren(pg); box.className = 'ot3 map'; box.hidden = false; pg.scrollTop = 0;
    return pg;
  }
  function dateText(ms) { if (!ms) return ''; var d = new Date(ms); return d.getFullYear() + '. ' + (d.getMonth() + 1) + '. ' + d.getDate() + '.'; }
  function minText(ms) { var sec = Math.round((ms || 0) / 1000); return sec < 60 ? sec + '초' : Math.floor(sec / 60) + '분' + (sec % 60 ? ' ' + (sec % 60) + '초' : ''); }
  function tierLabel(t) { var x = (C.tiers || []).filter(function (y) { return y.id === t; })[0]; return x ? x.label : ''; }
  function doneIds() { return OT.order.filter(function (id) { return PG.done[id]; }); }
  function cardCount() { return doneIds().reduce(function (a, id) { return a + sc(id).cards.length; }, 0); }
  var CARD_TOTAL = OT.order.reduce(function (a, id) { return a + sc(id).cards.length; }, 0);

  /* ── 탐험 일지: 말씀 카드 모음(장절만), 사진 도감, 내 기록. 모은 것을 다시 본다(규칙서 2절 보상, 4.1 기록, 12절) ── */
  var jtab = 'cards';
  function openJournal(tab) {
    enterStory();
    if (tab) jtab = tab;
    cur.screen = 'journal'; cur.id = null;
    var tabs = [['cards', '말씀 카드'], ['photos', '사진 도감'], ['notes', '내 기록']].map(function (t) {
      return el('button', { class: 'jtab', 'aria-pressed': String(jtab === t[0]), 'data-tab': t[0], on: { click: function () { openJournal(t[0]); } } }, t[1]);
    });
    var body = [];
    if (jtab === 'cards') {
      body.push(el('p', { class: 'den-lead', text: '장면을 마칠 때마다 말씀 카드가 들어와요. 카드에는 장절만 적혀 있어요. 말씀은 성경책에서 직접 찾아 읽어요.' }));
      OT.eras.forEach(function (e) {
        var got = e.scenes.filter(function (id) { return PG.done[id]; }), all = e.scenes.reduce(function (a, id) { return a + sc(id).cards.length; }, 0), n = got.reduce(function (a, id) { return a + sc(id).cards.length; }, 0);
        body.push(el('h2', { text: '시대 ' + e.era + ' · ' + e.name + ' (' + n + ' / ' + all + ')' }));
        if (!got.length) { body.push(el('p', { class: 'den-msg jempty', text: '아직 다녀오지 않았어요.' })); return; }
        body.push(el('div', { class: 'vcards' }, got.map(function (id) {
          return sc(id).cards.map(function (cd) { return el('div', { class: 'vcard' }, el('div', { class: 'r', text: cd.ref }), el('div', { class: 't', text: cd.title }), el('div', { class: 'm', text: sc(id).title + ' · 성경책에서 직접 읽어 보세요' })); });
        })));
      });
    } else if (jtab === 'photos') {
      body.push(el('p', { class: 'den-lead', text: '걸어서 탐험하는 장면(3D)에서 사진기 단추로 찍은 사진이에요. 과거에서 가져오는 것은 사진과 기록, 그리고 수리에 쓰는 재료뿐이에요. 사진은 이 기기에만 남아요.' }));
      var ids = OT.order.filter(function (id) { return DX[id] && Object.keys(DX[id]).length; });
      if (!ids.length) body.push(el('p', { class: 'den-msg jempty', text: '아직 찍은 사진이 없어요. 시대 지도에서 "3D" 표시가 있는 장면을 걸어서 탐험하면 사진을 찍을 수 있어요.' }));
      ids.forEach(function (id) {
        body.push(el('h2', { text: sc(id).title }));
        body.push(el('div', { class: 'dexgrid' }, Object.keys(DX[id]).map(function (k) {
          var o = DX[id][k];
          return el('div', { class: 'dexcell' }, o.img ? el('img', { src: o.img, alt: o.n }) : el('div', { class: 'ph', text: '' }), el('b', { text: o.n }), el('span', { text: o.d }), o.r ? refChip(o.r) : null);
        })));
      });
    } else {
      body.push(el('p', { class: 'den-lead', text: '장면을 마칠 때 받은 한 문장 기도와 실천, 내가 적은 기록이에요. 이 기기에만 저장돼요.' }));
      var dn = doneIds();
      if (!dn.length) body.push(el('p', { class: 'den-msg jempty', text: '아직 마친 장면이 없어요.' }));
      dn.forEach(function (id) {
        var d = sc(id), o = PG.done[id], c = d.close[o.t] || d.close.t2, kids_ = [el('small', { text: [d.id.replace('OT-', ''), dateText(o.at), o.d3 ? '걸어서 탐험' : ''].filter(Boolean).join(' · ') }), el('b', { text: d.title }), el('div', { class: 'ot-refs' }, refChip(d.ref, true))];
        if (c.kind === 'prayer') kids_.push(el('p', {}, el('i', { text: '한 문장 기도 ' }), c.text));
        if (c.kind === 'practice') kids_.push(el('p', {}, el('i', { text: '이번 주 실천 ' }), c.text));
        if (c.kind === 'note') {
          var ta = el('textarea', { 'aria-label': d.title + ' 기록', placeholder: '여기에 적어 보세요. 이 기기에만 저장돼요.' }); ta.value = PG.notes[id] || '';
          ta.addEventListener('input', function () { PG.notes[id] = ta.value.slice(0, 2000); save(); });
          kids_.push(el('p', {}, el('i', { text: '탐험 기록 ' }), c.prompt)); kids_.push(ta);
        }
        var ms = mats(id).filter(function (x) { return PG.mats[id + ':' + x.key]; });
        if (ms.length) kids_.push(el('p', { class: 'jmat' }, el('i', { text: '탐험대 이야기 · 얻은 재료 ' }), ms.map(function (x) { return x.name; }).join(', ')));
        body.push(el('div', { class: 'jnote' }, kids_));
      });
    }
    page('journal', [el('div', { class: 'eyebrow', text: '이 기기에만 저장' }), el('h1', { class: 'den-title', text: '탐험 일지' }),
      el('div', { class: 'otstat' },
        el('span', { class: 'count teal', text: '다녀온 장면 ' + doneCount() + ' / ' + OT.order.length }),
        el('span', { class: 'count', text: '말씀 카드 ' + cardCount() + ' / ' + CARD_TOTAL }),
        el('span', { class: 'count', text: '사진 ' + shotCount() })),
      el('div', { class: 'jtabs' }, tabs), body,
      el('div', { class: 'otmap-foot' }, btn('수리 현황', openRepair, 'quiet'), btn('시대 지도', function () { openMap(); }, 'quiet'))]);
  }

  /* ── 설정: 글자 크기, 소리, 읽어 주기 (이 기기에만) ── */
  function openSettings(back) {
    cur.screen = 'settings';
    function seg3(label, key, opts) {
      return el('div', { class: 'setrow' }, el('b', { text: label }), el('div', { class: 'setopts' }, opts.map(function (o) {
        return el('button', { class: 'jtab', 'aria-pressed': String(U.set[key] === o[0]), 'data-set': key + o[0], on: { click: function () { U.set[key] = o[0]; U.saveSet(); openSettings(back); } } }, o[1]);
      })));
    }
    page('settings', [el('div', { class: 'eyebrow', text: '이 기기에만 저장' }), el('h1', { class: 'den-title', text: '설정' }),
      seg3('글자 크기', 'fs', [[0, '보통'], [1, '크게'], [2, '아주 크게']]),
      el('div', { class: 'setsample sheet-body' }, el('p', { class: 'narr', text: '이 크기로 이야기를 읽어요. 성경책을 곁에 펴 두세요.' })),
      seg3('소리', 'snd', [[1, '켜기'], [0, '끄기']]),
      U.canSpeak() ? seg3('읽어 주기 단추', 'read', [[0, '8~10세만'], [1, '모든 나이']]) : el('p', { class: 'den-msg', text: '이 기기에서는 읽어 주기를 쓸 수 없어요.' }),
      el('p', { class: 'den-lead', text: '글자 크기는 이야기 글, 일지·지도, 처음 화면, 3D의 위쪽 안내와 말풍선 글을 키워요. 이야기 시트 아래 단추의 글은 그대로예요. 읽어 주기는 화면의 글을 기기의 목소리로 읽어요(한국어 음성이 있는 기기에서). 성경 말씀은 읽어 주지 않아요. 말씀은 성경책에서 직접 읽어요.' }),
      el('div', { class: 'otmap-foot' }, btn('돌아가기', function () { if (back) back(); else openMap(); }, 'wide'))]);
  }

  /* ── 진행 내보내기·가져오기: 기기를 바꿀 때 글로 복사해 옮긴다. 이름·연락처는 들어 있지 않다. 사진은 커서 옮기지 않는다 ── */
  function exportCode() { return 'BO1:' + btoa(unescape(encodeURIComponent(JSON.stringify({ v: 1, pg: PG })))); }
  function num(v, max) { v = +v; return isFinite(v) && v > 0 ? Math.min(Math.floor(v), max) : 0; }   /* 가져온 숫자는 유한한 양수만, 상한까지 */
  function parseCode(txt) {
    var NOWMAX = Date.now() + 86400000;
    var m = /BO1:([A-Za-z0-9+\/=]+)/.exec(String(txt || '').replace(/\s+/g, ''));
    if (!m) return null;
    try {
      var o = JSON.parse(decodeURIComponent(escape(atob(m[1])))), pg = o && o.pg, out = { done: {}, mats: {}, notes: {}, q: {}, time: {} };
      if (!o || o.v !== 1 || !pg || typeof pg !== 'object') return null;
      /* 아는 장면·재료만 받는다(다른 글이 섞여 들어오지 않게) */
      OT.order.forEach(function (id) {
        var dn = pg.done && pg.done[id];
        if (dn && typeof dn === 'object' && !Array.isArray(dn)) out.done[id] = { t: /^t[123]$/.test(dn.t) ? dn.t : 't2', at: num(dn.at, NOWMAX), first: num(dn.first, NOWMAX) || num(dn.at, NOWMAX) }, dn.d3 && (out.done[id].d3 = 1);
        mats(id).forEach(function (x) { if (pg.mats && pg.mats[id + ':' + x.key]) out.mats[id + ':' + x.key] = 1; });
        if (pg.notes && typeof pg.notes[id] === 'string') out.notes[id] = pg.notes[id].slice(0, 2000);
        if (pg.time && num(pg.time[id], 360000000)) out.time[id] = num(pg.time[id], 360000000);
      });
      Object.keys(pg.q || {}).forEach(function (k) { var x = pg.q[k]; if (/^OT-\d\d:t[123]:(gate|quest|help|part)\d+$/.test(k) && x && num(x.m, 9999)) out.q[k] = { m: num(x.m, 9999) }; });
      if (pg.seenIntro) out.seenIntro = 1; if (pg.unlockAll) out.unlockAll = true; if (num(pg.start, NOWMAX)) out.start = num(pg.start, NOWMAX);
      return out;
    } catch (e) { return null; }
  }
  function moveNodes() {
    var out = el('textarea', { readonly: '', hidden: '', class: 'movet', 'aria-label': '내보낼 글' }), msg = el('p', { class: 'den-msg', 'aria-live': 'polite' });
    var inp = el('textarea', { class: 'movet', 'aria-label': '가져올 글', placeholder: '다른 기기에서 복사한 글을 여기에 붙여 넣어요.' }), msg2 = el('p', { class: 'den-msg', 'aria-live': 'polite' }), apply = el('div', {});
    return [el('h2', { text: '진행 옮기기 (기기를 바꿀 때)' }),
      el('p', { class: 'den-lead', text: '이 기기의 진행을 글로 바꿔 복사한 뒤, 새 기기의 이 화면에 붙여 넣어요. 글에는 이름이나 연락처가 없어요. 14~19세가 적은 탐험 기록은 들어 있어요. 사진은 옮겨지지 않아요.' }),
      el('div', { class: 'otmap-foot' }, btn('내보낼 글 만들기', function () {
        out.value = exportCode(); out.hidden = false; out.focus(); out.select();
        var done = function (ok) { msg.textContent = ok ? '복사했어요. 새 기기에서 붙여 넣으세요.' : '글을 길게 눌러 모두 고른 뒤 복사하세요.'; };
        try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(out.value).then(function () { done(true); }, function () { done(false); }); else done(document.execCommand && document.execCommand('copy')); } catch (e) { done(false); }
      }, 'quiet')), out, msg,
      inp, el('div', { class: 'otmap-foot' }, btn('가져올 글 확인', function () {
        var pg = parseCode(inp.value); apply.replaceChildren();
        if (!pg) { msg2.textContent = '글을 알아볼 수 없어요. "BO1:"으로 시작하는 글을 처음부터 끝까지 붙여 넣었는지 봐 주세요.'; return; }
        var nd = Object.keys(pg.done).length, nm = Object.keys(pg.mats).length;
        msg2.textContent = '가져올 진행: 마친 장면 ' + nd + ', 재료 ' + nm + '. 지금 이 기기의 진행(마친 장면 ' + doneCount() + ', 재료 ' + matCount() + ')은 이것으로 바뀌어요.';
        apply.replaceChildren(el('div', { class: 'otmap-foot' }, btn('이 진행으로 바꾸기', function () { PG = pg; save(); load(); openAdult(); var t = box.querySelector('.movemsg'); if (t) t.textContent = '진행을 가져왔어요.'; }, 'quiet')));
      }, 'quiet')), msg2, apply, el('p', { class: 'den-msg movemsg', 'aria-live': 'polite' })];
  }

  /* ── 부모·교사 화면: 진도, 찾은 구절, 여러 번 엇나간 물음, 장면별 걸린 시간(규칙서 2절). 이 기기의 기록만 보여 준다 ── */
  var adultQ = null;
  function openAdultGate() {
    cur.screen = 'adultgate';
    var a = 12 + Math.floor(Math.random() * 8), b = 3 + Math.floor(Math.random() * 7); adultQ = a * b;
    var inp = el('input', { id: 'adult-in', type: 'text', inputmode: 'numeric', autocomplete: 'off', maxlength: '4', 'aria-label': '답' }), msg = el('p', { class: 'den-msg', 'aria-live': 'polite' });
    function tryIt() { if (parseInt(inp.value, 10) === adultQ) openAdult(); else { msg.textContent = '답이 달라요. 이 화면은 부모님이나 선생님이 보는 곳이에요.'; inp.value = ''; } }
    inp.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') tryIt(); });
    page('adultgate', [el('div', { class: 'eyebrow', text: '부모·교사용' }), el('h1', { class: 'den-title', text: '어른 확인' }),
      el('p', { class: 'den-lead', text: '이 화면은 부모님과 선생님이 보는 곳이에요. 아래 곱셈의 답을 적어 주세요.' }),
      el('div', { class: 'adultq' }, el('b', { text: a + ' × ' + b + ' = ' }), inp),
      msg, el('div', { class: 'otmap-foot' }, btn('시대 지도', function () { openMap(); }, 'quiet'), btn('확인', tryIt, 'quiet'))]);
  }
  /* 엇나간 기록의 열쇠('OT-10:t1:gate0')로 물음 글과 읽을 곳을 찾는다 */
  function qOf(key) {
    var m = /^(OT-\d\d):(t[123]):(gate|quest|help|part)(\d+)$/.exec(key), d = m && sc(m[1]), q = null, i = m ? +m[4] : 0;
    if (!d) return null;
    try {
      if (m[3] === 'gate') q = (d.gates[m[2]] || d.gates.t2)[i];
      else if (m[3] === 'quest' || m[3] === 'part') q = d.quests[i].q[m[2]] || d.quests[i].q.t2;
      else { var hs = d.mission.help.steps[i]; q = hs.read[m[2]] || hs.read.t2; }
    } catch (e) { q = null; }
    if (!q) return null;
    var pr = q.confirm && q.confirm.prompt ? q.confirm.prompt : q.prompt; if (pr && typeof pr !== 'string') pr = pr[m[2]] || pr.t2;
    return { d: d, tier: m[2], kind: { gate: '관문', quest: '재료 찾기 물음', part: '탐지기 물음', help: '뜻 묻기' }[m[3]], prompt: pr || '', refs: q.refs || (q.ref ? [q.ref] : [d.ref]) };
  }
  function openAdult() {
    enterStory();
    cur.screen = 'adult'; cur.id = null;
    var dn = doneIds(), lastAt = dn.reduce(function (a, id) { return Math.max(a, PG.done[id].at || 0); }, 0);
    var byTier = {}; dn.forEach(function (id) { var t = PG.done[id].t; byTier[t] = (byTier[t] || 0) + 1; });
    var eraRows = OT.eras.map(function (e) {
      var em = eraMats(e), nd = e.scenes.filter(function (id) { return PG.done[id]; }).length, ms = e.scenes.reduce(function (a, id) { return a + (PG.time[id] || 0); }, 0);
      return el('tr', {}, el('td', { text: e.era + '. ' + e.name }), el('td', { text: nd + ' / ' + e.scenes.length }), el('td', { text: em.got + ' / ' + em.all }), el('td', { text: ms ? minText(ms) : '-' }));
    });
    var refRows = dn.map(function (id) {
      var d = sc(id);
      return el('div', { class: 'arow' }, el('b', { text: d.id.replace('OT-', '') + ' ' + d.title }), el('small', { text: [tierLabel(PG.done[id].t), dateText(PG.done[id].at), PG.time[id] ? minText(PG.time[id]) : ''].filter(Boolean).join(' · ') }),
        el('div', { class: 'ot-refs' }, [d.ref].concat(d.cards.map(function (c) { return c.ref; })).filter(function (r, k, a) { return a.indexOf(r) === k; }).map(function (r) { return refChip(r, true); })));
    });
    var stuck = Object.keys(PG.q).map(function (k) { return { k: k, m: PG.q[k].m, q: qOf(k) }; }).filter(function (x) { return x.q && x.m >= 2; }).sort(function (a, b) { return b.m - a.m; }).slice(0, 30);
    var stuckRows = stuck.map(function (x) {
      return el('div', { class: 'arow' }, el('b', { text: x.q.d.id.replace('OT-', '') + ' ' + x.q.d.title + ' · ' + x.q.kind }), el('small', { text: tierLabel(x.q.tier) + ' · 엇나간 횟수 ' + x.m }),
        el('p', { text: x.q.prompt }), el('div', { class: 'ot-refs' }, x.q.refs.map(function (r) { return refChip(r, true); })));
    });
    var slow = OT.order.filter(function (id) { return PG.time[id]; }).map(function (id) { return el('tr', {}, el('td', { text: id.replace('OT-', '') + ' ' + sc(id).title }), el('td', { text: minText(PG.time[id]) }), el('td', { text: PG.done[id] ? '마침' : '하는 중' })); });
    var wipe = btn('이 기기의 진행 지우기', function () {
      if (wipe.getAttribute('data-sure')) { wipeAll(); openAdult(); }   /* 영상 본 표시와 3D 장면이 기억하던 사진·깃발까지(독립 검증 ⑥) */
      else { wipe.setAttribute('data-sure', '1'); wipe.textContent = '정말 지울까요? 한 번 더 누르면 모두 지워요'; }
    }, 'quiet');
    page('adult', [el('div', { class: 'eyebrow', text: '부모·교사용 · 이 기기의 기록만' }), el('h1', { class: 'den-title', text: '부모·교사 화면' }),
      el('p', { class: 'den-lead', text: '이 기기에서 한 탐험의 기록이에요. 이름이나 연락처는 받지 않고, 기록은 어른이 아래 “진행 옮기기”로 직접 옮기지 않는 한 이 기기 밖으로 나가지 않아요. 점수나 순위가 아니라, 아이가 어디까지 읽었고 어디에서 머뭇거렸는지 함께 보기 위한 것이에요.' }),
      el('h2', { text: '진도' }),
      el('div', { class: 'otstat' }, el('span', { class: 'count teal', text: '마친 장면 ' + dn.length + ' / ' + OT.order.length }), el('span', { class: 'count', text: '모은 재료 ' + matCount() + ' / ' + MAT_TOTAL }), el('span', { class: 'count', text: '말씀 카드 ' + cardCount() + ' / ' + CARD_TOTAL })),
      el('p', { class: 'den-msg', text: dn.length ? (lastAt ? '처음 한 날 ' + dateText(PG.start || lastAt) + ' · 마지막으로 한 날 ' + dateText(lastAt) + ' · ' : '날짜 기록 없음(전 판에서 마친 장면) · ') + '나이 단계: ' + Object.keys(byTier).sort().map(function (t) { return tierLabel(t) + ' ' + byTier[t] + '장면'; }).join(', ') : '아직 마친 장면이 없어요.' }),
      el('table', { class: 'logt' }, el('tr', {}, el('th', { text: '시대' }), el('th', { text: '장면' }), el('th', { text: '재료' }), el('th', { text: '걸린 시간' })), eraRows),
      el('h2', { text: '찾은 구절 (마친 장면의 본문과 말씀 카드)' }),
      refRows.length ? refRows : el('p', { class: 'den-msg jempty', text: '아직 없어요.' }),
      el('h2', { text: '두 번 이상 엇나간 물음 (함께 다시 읽어 볼 곳)' }),
      el('p', { class: 'den-lead', text: '두 번 이상 엇나간 물음이에요. 아이와 함께 그 장절을 다시 읽어 보세요.' }),
      stuckRows.length ? stuckRows : el('p', { class: 'den-msg jempty', text: '두 번 이상 엇나간 물음이 없어요.' }),
      el('h2', { text: '장면별 걸린 시간' }),
      slow.length ? el('table', { class: 'logt' }, el('tr', {}, el('th', { text: '장면' }), el('th', { text: '시간' }), el('th', { text: '상태' })), slow) : el('p', { class: 'den-msg jempty', text: '아직 없어요.' }),
      el('p', { class: 'den-lead', text: '한 화면에 5분 넘게 머문 시간은 5분으로 계산해요(자리를 비운 시간). 걸어서 탐험(3D)은 한 번에 45분까지만 계산해요.' }),
      el('h2', { text: '시대 잠금' }),
      el('p', { class: 'den-lead', text: '앞 시대의 장면 하나를 마치면 다음 시대가 열려요. 반에서 한 시대만 함께 볼 때는 모두 열어 둘 수 있어요.' }),
      el('div', { class: 'otmap-foot' }, btn(PG.unlockAll ? '시대 잠금 다시 켜기' : '모든 시대 열기', function () { PG.unlockAll = !PG.unlockAll; save(); openAdult(); }, 'quiet')),
      moveNodes(),
      el('h2', { text: '그 밖에' }),
      el('div', { class: 'otmap-foot' }, btn('놀이 기록', function () { openLog(true); }, 'quiet'), wipe, btn('시대 지도', function () { openMap(); }, 'quiet'))]);
  }

  function closeAll() { mark(null); U.stopSpeak(); U.onMiss = null; box.hidden = true; box.replaceChildren(); cur.screen = 'none'; cur.seg = null; }   /* 3D로 들어갈 때·처음 화면으로 나갈 때·3D 안 조각을 닫을 때 앞 화면의 시간을 닫는다 */

  /* ── 3D 장면 안에서 쓰는 조각: 동행 문답(앞·뒤)과 오늘의 물음을 3D 화면 위의 시트로 보여 준다 ──
   * kinds: 'before' | 'after' | 'today'. 보여 줄 것이 없으면 바로 done()을 부른다. */
  function segment(id, kind, done, helpNote) {
    var d = sc(id), m = d && d.mission, st = [];
    cur.helpNote = helpNote || null;   /* 3D 장면 설정의 helpNote(돕기의 때 안내) */
    if (m && m.companion && (kind === 'before' || kind === 'after') && (m.companion.when === 'after' ? 'after' : 'before') === kind) m.companion.talks.forEach(function (t, i) { st.push({ k: 'talk', i: i }); });
    if (m && m.today && kind === 'today') m.today.forEach(function (x, i) { st.push({ k: 'today', i: i }); });
    if (m && m.help && /^help:/.test(kind)) m.help.steps.forEach(function (h, i) { if (String(h.after) === kind.slice(5)) st.push({ k: 'help', i: i }); });   /* 3D의 현장 돕기 */
    if (!st.length) { done(); return; }
    cur.screen = 'seg'; cur.id = id; cur.steps = st; cur.step = 0; cur.seg = done;
    render();
  }

  /* 3D 장면을 마치면 game.js가 부른다 */
  function complete3d(id) {
    setDone(id, { d3: 1 }); stop3d();
    mats(id).forEach(function (x) { PG.mats[id + ':' + x.key] = 1; });
    save();
  }

  BO3D.story = {
    fixedEras: function () { return OT.eras.filter(function (e) { var em = eraMats(e); return em.all && em.got === em.all; }).length; },   /* 아지트 꾸미기 해금에 쓴다 */
    open: function () { openMap(); }, openMap: openMap, openJournal: openJournal, openSettings: openSettings, openAdult: openAdult,
    /* game.js(3D)가 쓰는 기록: 엇나감, 사진, 14~19세 기록 */
    missFor: missFor, saveShot: saveShot, shots: function (id) { var o = {}, x = DX[id] || {}; Object.keys(x).forEach(function (k) { o[k] = x[k].img || ''; }); return o; },
    leave3d: stop3d, exit3d: exit3d,
    note: function (id, v) { if (v === undefined) return PG.notes[id] || ''; PG.notes[id] = String(v).slice(0, 2000); save(); }, openScene: openScene, play: play, complete3d: complete3d, close: closeAll, segment: segment, take: function (id, key) { PG.mats[id + ':' + key] = 1; save(); },
    reset: function () { PG = {}; save(); load(); },
    debug: {
      state: function () { return { screen: cur.screen, id: cur.id, step: cur.step, k: cur.k, n: cur.steps.length, done: doneCount(), mats: matCount(), total: MAT_TOTAL }; },
      fast: function () { window.BO3D_TEST = true; },
      /* 지금 화면의 물음(관문·재료 찾기). 자동 시험이 답을 고를 때 쓴다 */
      seek: function () { var s = cur.steps[cur.step], d = cur.id && sc(cur.id); return s && s.k === 'mat' ? seekSpot(d.mission.materials[s.i]) : null; },
      unlockAll: function () { PG.unlockAll = true; save(); },
      amb: function () { return AMB; }, stepKind: function (i) { return cur.steps[i] ? cur.steps[i].k : null; }, adultAnswer: function () { return adultQ; }, pg: function () { return JSON.parse(JSON.stringify(PG)); }, exportCode: exportCode, parseCode: parseCode, dex: function () { return DX; },
      log: function () { return LOG; },
      help: function () { var s = cur.steps[cur.step], d = cur.id && sc(cur.id); return s && s.k === 'help' ? d.mission.help.steps[s.i] : null; },
      q: function () {
        var s = cur.steps[cur.step], d = cur.id && sc(cur.id);
        if (!s || !d) return null;
        if (s.k === 'gate') return (d.gates[S.tier] || d.gates.t2)[s.i];
        if (s.k === 'quest') return d.quests[s.i].q[S.tier] || d.quests[s.i].q.t2;
        if (s.k === 'help') { var hs = d.mission.help.steps[s.i]; return hs.kind === 'ask' ? (hs.read[S.tier] || hs.read.t2) : null; }
        return null;
      }
    }
  };
})();
