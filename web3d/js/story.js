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

  /* ── 진행 저장 (이 기기에만) ── */
  var KEY = 'bo3d.ot.v1', PG = {};
  function load() { try { PG = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { PG = {}; } ['done', 'mats', 'notes'].forEach(function (k) { if (!PG[k] || typeof PG[k] !== 'object') PG[k] = {}; }); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(PG)); } catch (e) { /* 저장할 수 없는 환경이면 이번 방문 동안만 기억한다 */ } }
  load();

  function sc(id) { return OT.scenes[id]; }
  function eraOf(n) { return OT.eras.filter(function (e) { return e.era === n; })[0]; }
  function mats(id) { var m = sc(id).mission; return m && m.materials ? m.materials : []; }
  var MAT_TOTAL = OT.order.reduce(function (a, id) { var n = mats(id).length; return a + (n || (sc(id).has3d ? 3 : 1)); }, 0);
  function matCount() { return Object.keys(PG.mats).length; }
  function doneCount() { return OT.order.filter(function (id) { return PG.done[id]; }).length; }
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
      label ? el('span', { class: 'place', text: label }) : null];
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
    enterStory();
    if (!PG.seenIntro) { intro(function () { openMap(); }); return; }
    cur.screen = 'map'; cur.id = null;
    var eras = OT.eras.map(function (e) {
      var cards = e.scenes.map(function (id) {
        var d = sc(id), done = PG.done[id];
        return el('button', { class: 'otc' + (done ? ' done' : ''), 'data-id': id, on: { click: function () { openScene(id); } } },
          el('span', { class: 'n', text: id.replace('OT-', '') }),
          el('span', { class: 'tt' }, el('b', { text: d.title }), el('small', { text: U.bookName(d.ref) })),
          el('span', { class: 'bd' }, d.has3d ? el('i', { class: 'b3', text: '3D' }) : null, d.review && d.review.required ? el('i', { class: 'br', text: '감수 필수' }) : null, done ? el('i', { class: 'bk', text: '마침' }) : null));
      });
      var nd = e.scenes.filter(function (id) { return PG.done[id]; }).length;
      return el('section', { class: 'ote', id: 'ote-' + e.era },
        el('button', { class: 'ote-h', on: { click: function () { openEra(e.era); } } },
          el('span', { class: 'ote-art', html: ART ? ART.art(e.key, { align: 'bottom' }) : '' }),
          el('span', { class: 'ote-t' }, el('small', { text: '시대 ' + e.era }), el('b', { text: e.name }), el('em', { text: nd + ' / ' + e.scenes.length + ' 장면 · 시대 안내 보기' }))),
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
      el('p', { class: 'den-lead', text: '어느 장면이든 골라 들어갈 수 있어요. 차례대로 가면 구약의 흐름이 이어져요.' }),
      eras,
      el('div', { class: 'otmap-foot' },
        btn('수리 현황', openRepair, 'quiet'), btn('비상 착륙 이야기', function () { intro(function () { openMap(); }); }, 'quiet'),
        btn('처음 화면', function () { closeAll(); var g = G(); if (g) g.menu(); }, 'quiet')),
      el('p', { class: 'fine', text: '감수 전 시험판입니다. 모든 장면은 목사님 감수를 마치기 전이며, 아이들에게 공개하지 않습니다.' }));
    box.appendChild(list);
    box.hidden = false;
    if (scrollTo) { var t = document.getElementById('ote-' + scrollTo); if (t) list.scrollTop = t.offsetTop - 8; }
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
    d.beats.forEach(function (b, i) { st.push({ k: 'beat', i: i }); });
    if (cp && cp.when === 'after') cp.talks.forEach(function (t, i) { st.push({ k: 'talk', i: i }); });
    (d.gates[S.tier] || d.gates.t2).forEach(function (q, i) { st.push({ k: 'gate', i: i }); });
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
  var KICK = { talk: '동행', beat: '지켜보기', gate: '다음으로 가는 관문', quest: '재료 찾기', mat: '재료 얻기', today: '오늘의 물음' };
  function nOf(k) { return cur.steps.filter(function (s) { return s.k === k; }).length; }
  function render() {
    var d = sc(cur.id), e = eraOf(d.era), s = cur.steps[cur.step], m = d.mission || {};
    cur.k = s.k;
    var last = cur.step === cur.steps.length - 1, next = cur.steps[cur.step + 1];
    var kick = s.k in KICK ? KICK[s.k] + ' ' + (s.i + 1) + ' / ' + nOf(s.k) : '';
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
      var mm = m.materials[s.i]; take(mm);
      body = [el('div', { class: 'q-kicker', text: kick }), matCard(mm, null)];
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
    return { stage: 9 };
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
    var kids_ = [el('div', { class: 'q-kicker', text: '탐험을 마치며' }),
      el('p', { class: 'q-prompt', text: '탐험 일지에 말씀 카드가 들어왔어요.' }),
      el('div', { class: 'vcards' }, d.cards.map(function (cd) {
        return el('div', { class: 'vcard pop' }, el('div', { class: 'r', text: cd.ref }), el('div', { class: 't', text: cd.title }), el('div', { class: 'm', text: d.title + ' · 성경책에서 직접 읽어 보세요' }));
      }))];
    if (c.kind === 'prayer') kids_.push(el('div', { class: 'closebox' }, el('h3', { text: '한 문장 기도' }), el('p', { text: c.text })));
    if (c.kind === 'practice') kids_.push(el('div', { class: 'closebox' }, el('h3', { text: '이번 주 실천 한 가지' }), el('p', { text: c.text })));
    if (c.kind === 'note') {
      var ta = el('textarea', { id: 'ot-note', 'aria-label': '기록', placeholder: '여기에 적어 보세요. 이 기기에만 저장돼요.' });
      ta.value = PG.notes[d.id] || '';
      ta.addEventListener('input', function () { PG.notes[d.id] = ta.value.slice(0, 2000); save(); });
      kids_.push(el('div', { class: 'closebox' }, el('h3', { text: '탐험 기록' }), el('p', { text: c.prompt }), ta));
      kids_.push(el('p', { class: 'pending', text: '뜻과 삶의 적용을 묻는 질문은 목사님 감수를 마친 뒤 이 자리에 열립니다.' }));
    }
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

  function closeAll() { box.hidden = true; box.replaceChildren(); cur.screen = 'none'; cur.seg = null; }

  /* ── 3D 장면 안에서 쓰는 조각: 동행 문답(앞·뒤)과 오늘의 물음을 3D 화면 위의 시트로 보여 준다 ──
   * kinds: 'before' | 'after' | 'today'. 보여 줄 것이 없으면 바로 done()을 부른다. */
  function segment(id, kind, done) {
    var d = sc(id), m = d && d.mission, st = [];
    if (m && m.companion && (kind === 'before' || kind === 'after') && (m.companion.when === 'after' ? 'after' : 'before') === kind) m.companion.talks.forEach(function (t, i) { st.push({ k: 'talk', i: i }); });
    if (m && m.today && kind === 'today') m.today.forEach(function (x, i) { st.push({ k: 'today', i: i }); });
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
    open: function () { openMap(); }, openMap: openMap, openScene: openScene, play: play, complete3d: complete3d, close: closeAll, segment: segment, take: function (id, key) { PG.mats[id + ':' + key] = 1; save(); },
    reset: function () { PG = {}; save(); load(); },
    debug: {
      state: function () { return { screen: cur.screen, id: cur.id, step: cur.step, k: cur.k, n: cur.steps.length, done: doneCount(), mats: matCount(), total: MAT_TOTAL }; },
      fast: function () { window.BO3D_TEST = true; },
      /* 지금 화면의 물음(관문·재료 찾기). 자동 시험이 답을 고를 때 쓴다 */
      q: function () {
        var s = cur.steps[cur.step], d = cur.id && sc(cur.id);
        if (!s || !d) return null;
        if (s.k === 'gate') return (d.gates[S.tier] || d.gates.t2)[s.i];
        if (s.k === 'quest') return d.quests[s.i].q[S.tier] || d.quests[s.i].q.t2;
        return null;
      }
    }
  };
})();
