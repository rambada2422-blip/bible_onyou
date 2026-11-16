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
  var G = function () { return BO3D.game || null; };
  /* 장면 배경음악(bgm.js·bgmplan.js, 2026-11-16). 표에 그 칸이 있으면 틀고 true, 없으면 false(예전 소리 그대로) */
  function bgm(id, part) {
    var b = BO3D.bgm, p = BO3D.bgmPlan;
    if (!b || !p || !p[id] || !p[id][part]) return false;
    try { b.play(id, part); } catch (e) { return false; }
    return true;
  }
  function bgmStop() { if (BO3D.bgm) { try { BO3D.bgm.stop(); } catch (e) { /* 무시 */ } } }
  /* 이야기 카드에도 소리 끄기 버튼: 효과음과 배경음악을 함께 끈다(3D의 버튼과 같은 상태를 쓴다) */
  function sndBtn() {
    var f = FX(), m0 = !!(f && f.audio && f.audio.isMuted());
    var b = el('button', { class: 'ot-snd', 'aria-label': m0 ? '소리 켜기' : '소리 끄기', 'aria-pressed': String(m0), on: { click: function () {
      var a = FX() && FX().audio; if (!a) return;
      var m = !a.isMuted(); a.mute(m); if (BO3D.bgm) BO3D.bgm.mute(m);
      b.setAttribute('aria-pressed', String(m)); b.setAttribute('aria-label', m ? '소리 켜기' : '소리 끄기');
    } } }, icon('speaker'));
    return b;
  }

  /* ── 진행 저장 (이 기기에만) ── */
  var KEY = 'bo3d.ot.v1', PG = {};
  function load() { try { PG = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { PG = {}; } ['done', 'mats', 'notes'].forEach(function (k) { if (!PG[k] || typeof PG[k] !== 'object') PG[k] = {}; }); }
  /* 놀이 기록(흥미 분석의 이탈 지점 재기, 이 기기에만 저장, 이름 없음): 화면마다 머문 시간, 2초 안에 넘긴 화면, 마지막 화면 */
  var LOGK = 'bo3d.log.v1', LOG = [];
  try { LOG = JSON.parse(localStorage.getItem(LOGK) || '[]') || []; } catch (e) { LOG = []; }
  var lastMark = null;
  function mark(where) {
    var t = Date.now();
    if (lastMark) { LOG.push({ w: lastMark.w, ms: t - lastMark.t, at: lastMark.t }); if (LOG.length > 800) LOG = LOG.slice(-800); try { localStorage.setItem(LOGK, JSON.stringify(LOG)); } catch (e) { /* 저장 못 하면 이번만 */ } }
    lastMark = where ? { w: where, t: t } : null;
  }
  try { window.addEventListener('pagehide', function () { if (lastMark) { var w = lastMark.w; mark(null); LOG.push({ w: w, exit: 1, at: Date.now() }); try { localStorage.setItem(LOGK, JSON.stringify(LOG)); } catch (e) { /* 무시 */ } } }); } catch (e) { /* 무시 */ }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(PG)); } catch (e) { /* 저장할 수 없는 환경이면 이번 방문 동안만 기억한다 */ } }
  load();

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
  function speakBtn(text) {
    if (S.tier !== 't1' || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return null;
    return el('button', { class: 'speak3', 'aria-label': '읽어 주기', on: { click: function () { try { speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(text); u.lang = 'ko-KR'; u.rate = 0.95; speechSynthesis.speak(u); } catch (e) { /* 음성이 없으면 조용히 */ } } } }, '🔊 읽어 주기');
  }
  function beatNodes(b) {
    return [el('div', { class: 'narr-meta' }, refChip(b.ref), speakBtn(tx(b.text))), el('p', { class: 'narr', text: tx(b.text) }),
      b.say ? U.say(b.say.who, b.say.text) : null,
      b.open ? el('div', { class: 'openbible' }, icon('book'), el('span', {}, '하나님이 하신 말씀은 성경책에서 직접 읽어요. ', el('b', { text: U.bookName(U.openFor ? U.openFor(b, S.tier) : b.open) }))) : null];
  }

  /* ── 화면 틀: 위는 시대 풍경, 아래는 아이보리 시트 ── */
  var cur = { screen: 'none', id: null, step: 0, steps: [], k: '' };
  function show(kind, eraKey, top, body, foot, opts) {
    opts = opts || {};
    box.replaceChildren();
    box.className = 'ot3 ' + kind + (opts.tall ? ' tall' : '');
    if (eraKey) add(box, el('div', { class: 'ot-stage', html: ART ? ART.art(eraKey, opts.art) : '' }));
    if (top) add(box, el('div', { class: 'ot-top pad' }, top));
    var b = el('div', { class: 'sheet-body pad' }), f = el('div', { class: 'sheet-foot pad' });
    add(b, body); add(f, foot);
    add(box, el('div', { class: 'ot-sheet sheet' }, b, f));
    box.hidden = false; b.scrollTop = 0;
    return b;
  }
  function topBar(label) {
    return [el('button', { class: 'ot-back', 'aria-label': '시대 지도', on: { click: function () { openMap(); } } }, icon('arrow'), el('span', { text: '시대 지도' })),
      label ? el('span', { class: 'place', text: label }) : null, sndBtn()];
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
    function step() {
      var last = i === st.lines.length - 1;
      show('intro', 'patriarchs', null,
        [el('div', { class: 'eyebrow dark', text: '탐험대 이야기' }), el('h2', { class: 'ot-title', text: st.title }),
          st.lines.slice(0, i + 1).map(line), last ? el('p', { class: 'den-msg ot-rule', text: st.rule }) : null],
        btn(last ? '시대 지도 보기' : '다음', function () { if (last) { PG.seenIntro = 1; save(); then(); } else { i++; step(); } }, 'wide'));
    }
    step();
  }

  /* ── 시대 지도 ── */
  function openMap(scrollTo) {
    enterStory(); bgmStop();
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
        btn('수리 현황', openRepair, 'quiet'), btn('비상 착륙 이야기', function () { intro(function () { openMap(); }); }, 'quiet'),
        btn(PG.unlockAll ? '시대 잠금 다시 켜기' : '모든 시대 열기(부모·교사)', function () { PG.unlockAll = !PG.unlockAll; save(); openMap(); }, 'quiet'),
        /#log/.test(location.hash) ? btn('놀이 기록 보기', openLog, 'quiet') : null,
        BO3D.bgmCredits ? btn('음악 출처', openCredits, 'quiet') : null,
        btn('처음 화면', function () { closeAll(); var g = G(); if (g) g.menu(); }, 'quiet')),
      el('p', { class: 'fine', text: '감수 전 시험판입니다. 모든 장면은 목사님 감수를 마치기 전이며, 아이들에게 공개하지 않습니다.' }));
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
  /* 놀이 기록 보기(주소 끝 #log): 장면별 머문 시간, 2초 안에 넘긴 화면 수, 나간 곳 */
  function openLog() {
    cur.screen = 'log';
    var by = {}, exits = [];
    LOG.forEach(function (x) { var id = String(x.w || '').split(' ')[0]; if (x.exit) { exits.push(x.w); return; } var o = by[id] || (by[id] = { n: 0, quick: 0, ms: 0 }); o.n++; o.ms += x.ms; if (x.ms < 2000) o.quick++; });
    var rows = Object.keys(by).sort().map(function (k) { var o = by[k]; return el('tr', {}, el('td', { text: k }), el('td', { text: String(o.n) }), el('td', { text: o.quick + ' (' + Math.round(o.quick / o.n * 100) + '%)' }), el('td', { text: Math.round(o.ms / 1000) + '초' })); });
    var ta = el('textarea', { readonly: '', 'aria-label': '기록 원본' }); ta.value = JSON.stringify(LOG);
    box.replaceChildren(el('div', { class: 'otmap pad' }, el('div', { class: 'eyebrow', text: '아이 시험용 · 이 기기에만 저장' }), el('h1', { class: 'den-title', text: '놀이 기록' }),
      el('table', { class: 'logt' }, el('tr', {}, el('th', { text: '장면' }), el('th', { text: '화면' }), el('th', { text: '2초 안에 넘김' }), el('th', { text: '머문 시간' })), rows),
      el('p', { class: 'den-lead', text: '나간 곳: ' + (exits.slice(-10).join(', ') || '없음') }), ta,
      el('div', { class: 'otmap-foot' }, btn('기록 지우기', function () { LOG = []; try { localStorage.removeItem(LOGK); } catch (e) { /* 무시 */ } openLog(); }, 'quiet'), btn('시대 지도', function () { openMap(); }, 'quiet'))));
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
        el('h3', { class: 'ot-h3', text: '장면 사이에 성경이 기록한 곳' }),
        el('p', { class: 'ot-soft', text: '이 탐험에서는 장면으로 보지 않지만, 성경은 이 사이에도 이야기를 기록했어요. 성경책에서 직접 찾아 읽어 보세요.' }),
        el('div', { class: 'ot-refs' }, e.between.map(function (r) { return el('span', { class: 'ref', text: U.bookName(r) }); }))],
      [btn('지도로', function () { openMap(n); }, 'plain'), btn('첫 장면으로', function () { openScene(e.scenes[0]); })]);
  }

  /* ── 장면 들어가기: 타임머신 이동 → (3D가 있으면 고르기) → 이야기 카드 ── */
  function warp(title, sub, fn) {
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
          btn('걸어서 탐험 (3D)', function () { warp(d.title, U.bookName(d.ref), function () { closeAll(); var g = G(); if (g) g.start3d(id); }); })]);
      return;
    }
    warp(d.title, U.bookName(d.ref), function () { play(id); });
  }

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
    var f = FX(); if (f && f.audio) { try { f.audio.start(); if (!bgm(id, 'story')) f.audio.pad(true); } catch (e) { /* 무시 */ } }
    render();
  }
  var KICK = { talk: '동행', beat: '지켜보기', help: '현장 돕기', gate: '다음으로 가는 관문', quest: '재료 찾기', mat: '재료 얻기', today: '오늘의 물음' };
  function nOf(k) { return cur.steps.filter(function (s) { return s.k === k; }).length; }
  function render() {
    var d = sc(cur.id), e = eraOf(d.era), s = cur.steps[cur.step], m = d.mission || {};
    cur.k = s.k; mark(cur.id + ' ' + s.k + (s.i !== undefined ? s.i : ''));
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
      body = helpNodes(m.help, m.help.steps[s.i], kick, ok); gated = true;
      var hn = cur.screen === 'seg' && cur.helpNote ? cur.helpNote(m.help.steps[s.i].after) : null;
      if (hn) body.splice(2, 0, el('div', { class: 'note story3' }, el('span', {}, el('small', { text: '탐험대 이야기' }), el('b', { text: hn }))));   /* 3D에서 때가 앞선 돕기(되돌아보는 대목 뒤)를 밝힌다 */
    } else if (s.k === 'gate') {
      var q = (d.gates[S.tier] || d.gates.t2)[s.i];
      body = [el('div', { class: 'q-kicker', text: kick }), U.blockFor(q, ok, 'og' + s.i)]; gated = true;
    } else if (s.k === 'quest') {
      var Q = d.quests[s.i], mt = m.materials[s.i], qq = Q.q[S.tier] || Q.q.t2, got = el('div', {});
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
      if (!next) nb = btn('계속', function () { closeAll(); if (fin) fin(); });
      show('seg', null, null, body, [prev, nb]);
      return;
    }
    show('play', e.key, topBar('시대 ' + e.era + ' · ' + d.title), body, [prev, nb], { art: artOpts(d, s) });
  }
  /* 창조 장면은 대목마다 지어진 것만 그린다(eraart.js) */
  function artOpts(d, s) {
    if (d.id !== 'OT-01') return null;
    if (s.k === 'arrive') return { stage: 0 };
    if (s.k === 'beat') return { stage: s.i };
    if (s.k === 'help') { var ha = d.mission.help.steps[s.i].after; if (typeof ha === 'number') return { stage: ha }; }   /* 돕기 단계는 그 앞 대목까지 지어진 것만 */
    return { stage: 9 };
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
    /* 성경을 읽어야 답이 나온다(규칙서 13.9): 먼저 성경을 펴서 물음에 답하고, 그다음에 본문에 기록된 말로 뜻을 듣는다 */
    var ans = el('div', { class: 'otans fadein' }, el('b', { text: hs.by || h.who }), el('p', { text: tx(hs.answer) }), refChip(hs.basis));
    return head.concat([U.say(hs.ask.who, hs.ask.text),
      doctor('먼저 성경책을 펴서 직접 찾아보자. 찾은 다음에 그 뜻을 함께 볼게.', '탐험대 이야기 · 최현 박사'),
      U.blockFor(hs.read[S.tier] || hs.read.t2, function () { if (nt) got.replaceChildren(ans, nt); else got.replaceChildren(ans); ok(); got.scrollIntoView({ block: 'nearest' }); }, 'oh' + hs.title.length), got]);
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
          tiles.forEach(function (x) { x.disabled = true; }); b.classList.add('hit');
          msg.textContent = tries === 1 ? '한 번에 찾았어요!' : tries + '번 만에 찾았어요!';
          take(mm); got.replaceChildren(matCard(mm, null)); ok(); got.scrollIntoView({ block: 'nearest' }); mark(cur.id + ' seek-found');
        } else {
          b.disabled = true; b.classList.add('miss');
          var dist = Math.abs((k % 3) - (spot % 3)) + Math.abs(Math.floor(k / 3) - Math.floor(spot / 3));
          msg.textContent = dist === 1 ? '삐삐삐! 아주 가까워요.' : '삐… 조금 멀어요. 다른 곳을 눌러 보세요.';
        }
      } } });
      return b;
    });
    return [el('div', { class: 'eyebrow dark', text: '탐험대 이야기 · 재료 찾기' }), msg, el('div', { class: 'seek' }, tiles), got];
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
    PG.done[d.id] = { t: S.tier }; save();
    bgm(d.id, 'after');
    var kids_ = [el('div', { class: 'q-kicker', text: '탐험을 마치며' }),
      el('p', { class: 'q-prompt', text: '탐험 일지에 말씀 카드가 들어왔어요.' }),
      el('div', { class: 'vcards' }, d.cards.map(function (cd) {
        return el('div', { class: 'vcard pop' }, el('div', { class: 'r', text: cd.ref }), el('div', { class: 't', text: cd.title }), el('div', { class: 'm', text: d.title + ' · 성경책에서 직접 읽어 보세요' }));
      }))];
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
    var nextBtn = nx ? btn(sc(nx).era !== d.era ? '다음 시대로' : '다음 장면', function () { if (sc(nx).era !== d.era) openEra(sc(nx).era); else openScene(nx); }) : btn('시대 지도', function () { openMap(); });
    cur.k = 'finish';
    show('play', e.key, topBar('시대 ' + e.era + ' · ' + d.title), kids_, [btn('시대 지도', function () { openMap(d.era); }, 'plain'), nextBtn]);
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

  /* ── 음악 출처 (CC BY 4.0: 제목·작가·출처·라이선스 링크·바꾼 점을 보여 준다. 자료는 bgmplan.js의 BO3D.bgmCredits) ── */
  function openCredits() {
    var c = BO3D.bgmCredits; if (!c) return;
    cur.screen = 'credits';
    var rows = c.titles.map(function (t) {
      return el('div', { class: 'credit' }, el('b', { text: '"' + t + '" ' + c.author }), el('span', { text: c.license }));
    });
    box.replaceChildren(el('div', { class: 'otmap pad' },
      el('div', { class: 'eyebrow', text: '만든 사람들' }), el('h1', { class: 'den-title', text: '음악 출처' }),
      el('p', { class: 'den-lead', text: '이 게임의 배경음악 ' + c.titles.length + '곡은 Kevin MacLeod가 만들고 누구나 쓸 수 있게 공개한 곡이에요.' }),
      el('div', { class: 'credits' }, rows),
      el('p', { class: 'fine' }, el('a', { href: c.licenseUrl, target: '_blank', rel: 'noopener', text: c.licenseUrl })),
      el('p', { class: 'fine', text: c.changesKo }), el('p', { class: 'fine', text: c.changes }),
      el('div', { class: 'otmap-foot' }, btn('시대 지도', function () { openMap(); }, 'wide'))));
    box.className = 'ot3 map'; box.hidden = false;
  }

  function closeAll() { box.hidden = true; box.replaceChildren(); cur.screen = 'none'; cur.seg = null; }

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
    PG.done[id] = { t: S.tier, d3: 1 };
    mats(id).forEach(function (x) { PG.mats[id + ':' + x.key] = 1; });
    save();
  }

  BO3D.story = {
    fixedEras: function () { return OT.eras.filter(function (e) { var em = eraMats(e); return em.all && em.got === em.all; }).length; },   /* 아지트 꾸미기 해금에 쓴다 */
    open: function () { openMap(); }, openMap: openMap, openScene: openScene, play: play, complete3d: complete3d, close: closeAll, segment: segment, take: function (id, key) { PG.mats[id + ':' + key] = 1; save(); },
    reset: function () { PG = {}; save(); load(); },
    debug: {
      state: function () { return { screen: cur.screen, id: cur.id, step: cur.step, k: cur.k, n: cur.steps.length, done: doneCount(), mats: matCount(), total: MAT_TOTAL }; },
      fast: function () { window.BO3D_TEST = true; },
      /* 지금 화면의 물음(관문·재료 찾기). 자동 시험이 답을 고를 때 쓴다 */
      seek: function () { var s = cur.steps[cur.step], d = cur.id && sc(cur.id); return s && s.k === 'mat' ? seekSpot(d.mission.materials[s.i]) : null; },
      unlockAll: function () { PG.unlockAll = true; save(); },
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
