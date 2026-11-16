/* 탐험대 장비 성장(docs/14 성장시스템 설계, 보완 1·2차, 대표 승인 2026-11-16)
 * - 성장 단계는 저장하지 않는다. 이야기 카드의 진행 요약(BO3D.story.progressSummary: 메모리의 진행 자료)에서 계산한다.
 *   진행 자료(bo3d.ot.v1)는 읽지도 쓰지도 않는다.
 * - 이 모듈이 쓰는 키는 bo3d.gear.v1 하나: 빛 효과, 고른 깃발 색, 모자, 마지막으로 본 단계, 장면별로 마친 나이 단계.
 * - 성장은 탐험대 장비의 성장이다. 신앙·정답률·속도·나이·캐릭터와 무관하다. 세 아이가 함께 바뀐다.
 * - 단계는 외형과 기능이 모두 구현된 것(ready)만 게임에 보인다. 구현 안 된 단계는 이름도 장면 수도 보이지 않는다.
 * - 빛은 타임머신 장비의 빛(창작)이다. 켜고 끄는 규칙은 auraRule 하나로 정한다(보완-4, 보완2-3). */
window.BO3D = window.BO3D || {};
(function () {
  var BO = window.BO3D;
  var KEY = 'bo3d.gear.v1', G = {};
  function load() {
    try { G = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { G = {}; }
    if (!G.tiers || typeof G.tiers !== 'object') G.tiers = {};
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(G)); } catch (e) { /* 저장할 수 없으면 이번 방문 동안만 기억한다 */ } }
  load();

  /* 단계표(보완2-5). ready: 외형과 기능을 모두 구현한 단계만 true */
  var STAGES = [
    { n: 1, at: 1, key: 'hat', name: '탐험 모자', fn: '탐험 기록장', ready: true,
      d: { t1: '탐험 모자를 썼어요! 탐험 기록장에 말씀 카드가 모여요.',
        t2: '탐험 모자와 탐험 기록장이 생겼어요. 마친 장면과 말씀 카드를 기록장에서 다시 보고, 그 장면으로 다시 갈 수 있어요.',
        t3: '장비 1단계: 탐험 모자 · 탐험 기록장(마친 장면, 말씀 카드 앨범, 다시 가기).' } },
    { n: 2, at: 4, key: 'badge', name: '어깨 표식', fn: '성경 책갈피', ready: true,
      d: { t1: '어깨 표식이 생겼어요! 책갈피에서 찾아 읽은 곳을 다시 볼 수 있어요.',
        t2: '어깨 표식과 성경 책갈피가 생겼어요. 마친 장면에서 찾아 읽은 장절이 성경 차례대로 책갈피에 모여요.',
        t3: '장비 2단계: 어깨 표식 · 성경 책갈피(마친 장면의 물음 장절을 성경 차례로).' } },
    { n: 3, at: 8, key: 'wrist', name: '손목 탐지기', fn: '탐지기 스캔 · 도감 탐지', ready: true,
      d: { t1: '손목 탐지기가 생겼어요! 재료 찾기에서 "탐지기 스캔"을 눌러 보세요.',
        t2: '손목 탐지기가 생겼어요. 재료 찾기에서 가까운 세 곳을 알려 주고, 3D에서는 사진에 담을 것이 가까우면 알려 줘요.',
        t3: '장비 3단계: 손목 탐지기 · 재료 찾기 스캔(후보 세 곳), 3D 도감 탐지.' },
      light: '손목 탐지기의 빛은 타임머신 장비에서 나는 빛이에요. 하나님이 주시는 능력이 아니에요.' },
    { n: 4, at: 14, key: 'lamp', name: '배낭 램프', fn: '시대 연표', ready: false },
    { n: 5, at: 22, key: 'trail', name: '시간 잔광', fn: '책갈피 모아 보기', ready: false },
    { n: 6, at: 30, key: 'trim', name: '놋쇠 장식선', fn: '탐험 기록 인쇄본', ready: false },
    { n: 7, at: 40, key: 'final', name: '완성 장비', fn: '완성 아카이브', ready: false }
  ];
  var READY = STAGES.filter(function (s) { return s.ready; });

  function summary() {
    var s = BO.story && BO.story.progressSummary ? BO.story.progressSummary() : null;
    return s || { done: 0, doneIds: [], tierOf: {}, fixedEras: 0, matsGot: 0, matsTotal: 0, unlockAll: false };
  }
  function stageAt(done) { var st = 0; READY.forEach(function (x) { if (done >= x.at) st = x.n; }); return st; }
  function stage() { return stageAt(summary().done); }
  function info(n) { return STAGES.filter(function (x) { return x.n === n; })[0] || null; }
  /* 다음 목표: 구현된 다음 단계만. 없으면 null("다음 장비는 준비하고 있어요") */
  function next() {
    var done = summary().done, nx = READY.filter(function (x) { return x.at > done; })[0];
    return nx ? { stage: nx, left: nx.at - done } : null;
  }
  /* 아직 보여 주지 않은 단계(새 장비 알림·옛 저장 자료의 "그동안 모은 장비") */
  function pending() { var seen = G.seen || 0, st = stage(); return READY.filter(function (x) { return x.n > seen && x.n <= st; }); }
  function markSeen() { var st = stage(); if ((G.seen || 0) < st) { G.seen = st; save(); } }

  /* 장면을 마칠 때 그 나이 단계를 덧붙인다(책갈피 이력, 보완2-4) */
  function noteComplete(id, tier) {
    if (!id || !tier) return;
    var l = G.tiers[id] || (G.tiers[id] = []);
    if (l.indexOf(tier) < 0) { l.push(tier); save(); }
  }
  /* 장면의 마친 나이 단계: 기록이 없으면(옛 저장 자료) 진행 자료의 마지막 단계 하나 */
  function tiersFor(id) {
    var l = G.tiers[id];
    if (l && l.length) return { list: l.slice(), legacy: false };
    var t = summary().tierOf[id];
    return { list: t ? [t] : [], legacy: !!t };
  }

  /* 성경 책갈피: 마친 장면에서 찾아 읽은 물음의 장절(성경 차례). 몇 번 만에 맞혔는지는 기록하지도 보여 주지도 않는다 */
  function questionsOf(d, t) {
    var out = [];
    function push(q, kind) {
      if (!q) return;
      var refs = q.refs || (q.ref ? [q.ref] : []);
      var label = q.confirm ? q.confirm.prompt : (q.type === 'order' ? '일어난 차례 맞추기' : q.type === 'match' ? '구절과 내용 잇기' : '');
      refs.forEach(function (r) { out.push({ ref: r, label: label, kind: kind }); });
    }
    ((d.gates || {})[t] || []).forEach(function (q) { push(q, '관문'); });
    (d.quests || []).forEach(function (x) { push(x.q && x.q[t], '탐지기 물음'); });
    (((d.mission || {}).help || {}).steps || []).forEach(function (h) { push(h.read && h.read[t], '뜻 묻기'); });
    return out;
  }
  function refKey(ref) {
    var U = BO.ui, books = (U && U.books) || [];
    var m = /^(\S+) (\d+)(?::(\d+))?/.exec(String(ref || ''));
    var bi = -1; if (m) books.forEach(function (b, i) { if (b[0] === m[1]) bi = i; });
    return m ? [bi < 0 ? 999 : bi, +m[2], m[3] ? +m[3] : 0] : [999, 0, 0];
  }
  function bookmarks() {
    var OT = BO.ot; if (!OT) return [];
    var s = summary(), items = [];
    s.doneIds.forEach(function (id) {
      var d = OT.scenes[id], tf = tiersFor(id); if (!d) return;
      tf.list.forEach(function (t) {
        questionsOf(d, t).forEach(function (x) { items.push({ ref: x.ref, label: x.label, kind: x.kind, id: id, title: d.title, tier: t, legacy: tf.legacy }); });
      });
    });
    items.sort(function (a, b) { var ka = refKey(a.ref), kb = refKey(b.ref); return ka[0] - kb[0] || ka[1] - kb[1] || ka[2] - kb[2] || (a.id < b.id ? -1 : 1); });
    return items;
  }

  /* 깃발 색(시대 수리마다 하나씩, 기존 아지트 규칙과 같음: 처음에 1색, 수리 1번에 1색) */
  var FLAGS = [null, '#EE7B62', '#2F9C95', '#4E5FB0', '#F7D774', '#9C6ADE', '#E35D8C', '#5BAE5A', '#E8913A', '#3E8FD4', '#C8A15A', '#7A8794'];
  function flagsOpen() { return 2 + summary().fixedEras; }      /* 열린 칸 수(없음 칸 포함) */

  var prefs = {
    fx: function () { return G.fx !== false; },
    setFx: function (v) { G.fx = !!v; save(); },
    hat: function () { return G.hat !== false; },
    setHat: function (v) { G.hat = !!v; save(); },
    flag: function () { var c = G.flag || null, k = FLAGS.indexOf(c); return k >= 0 && k < flagsOpen() ? c : null; },
    setFlag: function (c) { G.flag = c || null; save(); }
  };

  /* 재료 찾기 스캔: 숨은 자리를 꼭 넣고 두 곳을 더해 세 곳(어느 것이 숨은 자리인지는 알려 주지 않는다) */
  function scanSet(seedStr, spot) {
    var h = 7; for (var i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) % 9973;
    var others = [0, 1, 2, 3, 4, 5].filter(function (k) { return k !== spot; });
    var a = others[h % others.length]; others.splice(others.indexOf(a), 1);
    var b = others[(h * 7 + 3) % others.length];
    return [spot, a, b].sort();
  }

  /* 빛(타임머신 장비의 빛) 규칙: 모두 만족할 때만 켠다. 어기면 그 순간 바로 끈다(보완2-3).
   * ctx = { stage, fx, state, overlayOpen, figuresReady, nearFigure(m), inQuiet, sceneAura, visible, reduced } */
  var AURA_STATES = { explore: 1, free: 1 };
  var NEAR_FIGURE = 6;   /* 게임 연출의 안전장치(성경이 정한 경계가 아님) */
  function auraRule(c) {
    if (!(c.stage >= 3)) return { on: false, reason: 'stage' };
    if (c.fx === false) return { on: false, reason: 'fx-off' };
    if (!AURA_STATES[c.state]) return { on: false, reason: 'state:' + c.state };
    if (c.overlayOpen) return { on: false, reason: 'overlay' };
    if (c.sceneAura === 'off') return { on: false, reason: 'scene-off' };
    if (c.figuresReady === false) return { on: false, reason: 'figures-loading' };
    if (typeof c.nearFigure === 'number' && c.nearFigure < NEAR_FIGURE) return { on: false, reason: 'near-figure' };
    if (c.inQuiet) return { on: false, reason: 'quiet-zone' };
    if (c.visible === false) return { on: false, reason: 'hidden' };
    return { on: true, dim: c.sceneAura === 'dim' || !!c.reduced, reason: 'ok' };
  }

  /* 장비 그림(2D 배지·새 장비 카드). 성경의 물건이 아니라 탐험대 장비 */
  var SVG = {
    hat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 15c3 1.6 15 1.6 18 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M7 15c0-4 2-7 5-7s5 3 5 7" fill="currentColor"/></svg>',
    badge: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M7.5 13.5c1.5-1.6 3-1.6 4.5 0s3 1.6 4.5 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    wrist: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="7" width="12" height="10" rx="2.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M9 12h2l1-2 1 4 1-2h1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  BO.growth = {
    STAGES: STAGES, stage: stage, stageAt: stageAt, info: info, next: next, pending: pending, markSeen: markSeen,
    noteComplete: noteComplete, tiersFor: tiersFor, bookmarks: bookmarks, refKey: refKey,
    FLAGS: FLAGS, flagsOpen: flagsOpen, prefs: prefs, scanSet: scanSet, auraRule: auraRule, NEAR_FIGURE: NEAR_FIGURE, svg: SVG,
    summary: summary,
    debug: { raw: function () { return JSON.parse(JSON.stringify(G)); }, reload: load }
  };
})();
