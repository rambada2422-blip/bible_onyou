/* 성경 탐험대 시범판 — 화면과 진행.
 * 데이터: content.js / 그림: art.js(tools/build.js가 만든다) / 작은 아이콘: icons.js
 * 원칙(docs/00_공통규칙서.md): 틀렸다는 표현을 쓰지 않는다. 모르면 성경책을 펴게 한다.
 */
(function () {
  'use strict';
  var C = BO.content, IC = BO.icons, ART = BO.art || {}, META = BO.artMeta || {};
  var KEY = 'bo_demo_v1';
  var root = document.getElementById('app');
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 저장 (이 기기에만, 실패해도 게임은 돌아간다) ── */
  function fresh() { return { v: 1, tier: null, char: null, done: {}, cards: [], notes: {}, routed: false }; }
  function load() {
    try { var r = JSON.parse(localStorage.getItem(KEY)); if (r && r.v === 1) return r; } catch (e) { /* 저장소를 못 쓰는 환경 */ }
    return fresh();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* 무시 */ } }
  var S = load();

  /* ── 작은 도구 ── */
  function el(tag, props) {
    var n = document.createElement(tag), i, k;
    props = props || {};
    for (k in props) {
      if (k === 'class') n.className = props[k];
      else if (k === 'text') n.textContent = props[k];
      else if (k === 'html') n.innerHTML = props[k];
      else if (k === 'on') { for (var ev in props.on) n.addEventListener(ev, props.on[ev]); }
      else if (props[k] !== null && props[k] !== undefined && props[k] !== false) n.setAttribute(k, props[k]);
    }
    for (i = 2; i < arguments.length; i++) add(n, arguments[i]);
    return n;
  }
  function add(n, kid) {
    if (kid === null || kid === undefined || kid === false) return;
    if (Array.isArray(kid)) kid.forEach(function (x) { add(n, x); });
    else n.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
  }
  function tx(v) { return typeof v === 'string' ? v : (v[S.tier] || v.t2); }
  var uriCache = {};
  function uri(key) {
    if (!ART[key]) return '';
    return uriCache[key] || (uriCache[key] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ART[key]));
  }
  function pic(key, cls, alt) {
    if (!ART[key]) return el('span', { class: (cls || '') + ' noart', 'aria-hidden': 'true' });
    return el('img', { class: cls || '', src: uri(key), alt: alt || '' });
  }
  function icon(name) { var s = el('span', { html: IC[name] || '' }); return s.firstChild; }
  function refChip(ref, dark) { return el('span', { class: 'ref' + (dark ? ' dark' : '') }, icon('bookline'), ref); }
  function show(node) {
    root.className = 'app ' + (S.tier || 't2');
    root.replaceChildren(node);
  }
  function tierInfo() { return C.tiers.filter(function (t) { return t.id === S.tier; })[0]; }
  function bookName(ref) {
    return ref.replace(/^출 /, '출애굽기 ').replace(/^창 /, '창세기 ').replace(/^수 /, '여호수아 ').replace(/(\d+):/, '$1장 ').replace(/$/, '절');
  }
  function speak(text) {
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'ko-KR'; u.rate = 0.9;
      window.speechSynthesis.speak(u);
    } catch (e) { /* 읽어주기를 못 쓰는 환경 */ }
  }
  var canSpeak = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

  /* ── 시간 이동 연출 ── */
  function warp(kicker, title, sub, then) {
    var o = el('div', { class: 'warp sky fadein', role: 'status' },
      el('div', { class: 'in' },
        pic('timemachine', '', ''),
        el('div', { class: 'k', text: kicker }),
        el('h2', { text: title }),
        sub ? el('p', { text: sub }) : null));
    root.appendChild(o);
    setTimeout(then, reduced ? 700 : 1700);
  }

  /* ════════════ 처음 화면 ════════════ */
  function renderTitle() {
    show(el('div', { class: 'screen sky title-screen pad' },
      el('div', { class: 'title-top' },
        el('div', { class: 'eyebrow', text: '출애굽기 편 · ' + C.version }),
        el('h1', { class: 'game-title', text: '성경 탐험대' }),
        el('p', { class: 'game-sub', text: '타임머신을 타고 성경의 그 자리로' })),
      el('div', {},
        pic('timemachine', 'tm-hero', '타임머신'),
        el('div', { class: 'trio' },
          pic('choeon-full', '', '최온'), pic('onwoo-full', '', '온우'), pic('hyu-full', '', '휴'))),
      el('div', { class: 'title-actions' },
        el('button', { class: 'btn wide', on: { click: function () { (S.tier && S.char) ? renderHub() : renderSetup(); } } },
          (S.tier && S.char) ? '이어서 탐험하기' : '탐험 시작'),
        el('button', { class: 'btn wide quiet', on: { click: renderGuide } }, '구성 안내 (선생님·부모님용)'),
        el('p', { class: 'fine', text: '감수 전 시범 화면입니다. 성경 본문은 싣지 않고 장절만 안내합니다.' }))));
  }

  /* ════════════ 단계·주인공 고르기 ════════════ */
  function renderSetup() {
    var tier = S.tier, ch = S.char, picked = !!S.char;
    var line = el('p', { class: 'char-line' });
    var go = el('button', { class: 'btn wide', on: { click: function () { S.tier = tier; S.char = ch; save(); renderHub(); } } }, '출발 준비 완료');
    var tierBtns = C.tiers.map(function (t) {
      return el('button', { class: 'tier', 'aria-pressed': 'false', on: { click: function () { tier = t.id; if (!picked) ch = t.char; sync(); } } },
        el('span', { class: 'age', text: t.label }), el('span', { class: 'nm', text: t.name }), el('span', { class: 'ds', text: t.desc }));
    });
    var ids = ['choeon', 'hyu', 'onwoo'];
    var charBtns = ids.map(function (id) {
      var c = C.chars[id];
      return el('button', { class: 'char', 'aria-pressed': 'false', on: { click: function () { ch = id; picked = true; sync(); } } },
        pic(id + '-full', '', ''), el('span', { class: 'nm', text: c.name }), el('span', { class: 'ag', text: c.age + '살' }));
    });
    function sync() {
      C.tiers.forEach(function (t, i) { tierBtns[i].setAttribute('aria-pressed', String(t.id === tier)); });
      ids.forEach(function (id, i) { charBtns[i].setAttribute('aria-pressed', String(id === ch)); });
      line.textContent = ch ? C.chars[ch].name + ': “' + C.chars[ch].line + '”' : '함께 갈 친구를 골라 주세요.';
      go.disabled = !(tier && ch);
    }
    sync();
    show(el('div', { class: 'screen sky setup pad' },
      el('h2', { text: '몇 살 탐험대인가요?' }),
      el('p', { class: 'lead', text: '같은 장면을 보지만 질문과 성경 찾는 방법이 달라져요.' }),
      el('div', { class: 'tier-list' }, tierBtns),
      el('h2', { text: '누가 되어 탐험할까요?' }),
      el('div', { class: 'char-row' }, charBtns),
      line, go));
  }

  /* ════════════ 시간표 ════════════ */
  function renderHub() {
    var nextId = null;
    C.timeline.forEach(function (n) { if (!nextId && n.playable && !S.done[n.id]) nextId = n.id; });
    var items = C.timeline.map(function (n, i) {
      var done = !!S.done[n.id];
      var cls = 'node ' + (n.playable ? 'play' : 'locked') + (done ? ' done' : '') + (n.id === nextId ? ' next' : '');
      var dot = el('span', { class: 'dot' }, done ? icon('check') : (n.playable ? String(i + 1) : icon('lock')));
      var body = [dot,
        el('span', { class: 'tt' }, el('b', { text: n.title }), el('span', { text: n.ref })),
        el('span', { class: 'st', text: n.playable ? (done ? '다시 보기' : '출발') : '감수 후 열림' })];
      if (!n.playable) return el('li', {}, el('div', { class: cls }, body));
      return el('li', {}, el('button', { class: cls, on: { click: function () { depart(n.id); } } }, body));
    });
    var c = C.chars[S.char], t = tierInfo();
    show(el('div', { class: 'screen sky hub' },
      el('div', { class: 'hub-head pad' },
        pic(S.char + '-avatar', 'avatar', ''),
        el('div', { class: 'who' }, el('b', { text: c.name + ' 탐험대원' }), el('span', { text: t.label + ' · ' + t.name })),
        el('button', { class: 'pillbtn', on: { click: renderJournal } }, icon('journal'), '일지 ' + S.cards.length),
        el('button', { class: 'pillbtn', on: { click: renderSetup } }, '단계')),
      el('div', { class: 'hub-body pad' },
        el('div', { class: 'hub-hero' },
          pic('timemachine', '', ''),
          el('div', {}, el('h2', { text: '출애굽기 시간표' }),
            el('p', { text: '놋쇠 다이얼이 가리키는 장면으로 떠나요. 다음 장면으로 가려면 성경을 알아야 해요.' }))),
        el('ol', { class: 'tl' }, items),
        el('p', { class: 'hub-note', text: '시범판에는 목사님 감수가 필요 없는 세 장면만 열려 있습니다.' }),
        el('div', {},
          el('button', { class: 'linkbtn', on: { click: function () { S.routed = false; save(); renderRoute(); } } }, '목적지 다시 고르기'), ' · ',
          el('button', { class: 'linkbtn', on: { click: renderGuide } }, '구성 안내'), ' · ',
          el('button', { class: 'linkbtn', on: { click: function () { S = fresh(); save(); renderTitle(); } } }, '처음부터 다시')))));
  }
  function depart(id) {
    if (id === 'EX-01' && !S.routed) { renderRoute(); return; }
    var sc = C.scenes[id];
    warp('시간 이동', sc.place, sc.ref, function () { runScene(id); });
  }

  /* ════════════ 다음 목적지 정하기 ════════════ */
  function renderRoute() {
    var opts = C.route.options.map(function (o) {
      return el('button', { class: 'btn wide', on: { click: function () {
        if (o.to === 'EX-01') { S.routed = true; save(); }
        warp('시간 이동', o.label + '의 시대로', '타임머신이 이름을 따라 시대를 찾고 있어요.', function () { runScene(o.to); });
      } } }, o.label);
    });
    show(el('div', { class: 'screen sky setup pad' },
      el('div', { style: 'display:flex;justify-content:center' }, pic('timemachine', 'tm-hero', '')),
      el('h2', { text: '다음 목적지' }),
      el('p', { class: 'lead', style: 'font-size:16.5px;line-height:1.6;color:#E6ECFA', text: tx(C.route.prompt) }),
      el('div', { class: 'tier-list' }, opts),
      el('button', { class: 'btn wide quiet', on: { click: renderHub } }, '시간표로 돌아가기')));
  }

  /* ════════════ 장면 ════════════ */
  function runScene(id) {
    var sc = C.scenes[id];
    var gates = sc.alt ? [] : (sc.gates[S.tier] || []);
    var steps = [{ k: 'arrive' }];
    sc.beats.forEach(function (b, i) { steps.push({ k: 'beat', i: i }); });
    if (sc.alt) { steps.push({ k: 'spot' }); steps.push({ k: 'back' }); steps.push({ k: 'cards' }); }
    else {
      gates.forEach(function (g, i) { steps.push({ k: 'gate', g: g, i: i }); });
      steps.push({ k: 'cards' }); steps.push({ k: 'close' });
    }
    var idx = 0;

    var artBox = el('div', { class: 'art', html: ART[sc.art] || '' });
    var svg = artBox.querySelector('svg');
    var dots = el('div', { class: 'dots' });
    var hots = el('div', {});
    var stage = el('div', { class: 'stage' }, artBox,
      el('div', { class: 'hud pad' },
        el('button', { class: 'iconbtn', 'aria-label': '시간표로 돌아가기', on: { click: renderHub } }, icon('back')),
        el('div', { class: 'where' }, el('span', { class: 'place', text: sc.place }), refChip(sc.ref, true))),
      dots, hots);
    var body = el('div', { class: 'sheet-body pad' });
    var foot = el('div', { class: 'sheet-foot pad' });
    show(el('div', { class: 'screen scene' }, stage, el('div', { class: 'sheet' }, body, foot)));

    function setState(name) {
      if (!svg || !name) return;
      var pre = sc.art + '-state-';
      Array.prototype.forEach.call(svg.querySelectorAll('[id^="' + pre + '"]'), function (g) {
        g.style.display = g.id === pre + name ? 'inline' : 'none';
      });
    }
    function region(rid) {
      var m = META[sc.art];
      if (!m || !m.regions) return null;
      return m.regions.filter(function (r) { return r.id === rid; })[0] || null;
    }
    function mapRect(r) { /* viewBox 900x1200, slice */
      var W = stage.clientWidth, H = stage.clientHeight;
      var s = Math.max(W / 900, H / 1200), ox = (W - 900 * s) / 2, oy = (H - 1200 * s) / 2;
      return { x: ox + r.x * s, y: oy + r.y * s, w: r.w * s, h: r.h * s, W: W, H: H };
    }
    function setFocus(rid) {
      if (!svg) return;
      var r = rid && region(rid);
      if (!r) { svg.style.transform = 'none'; return; }
      var m = mapRect(r), px = m.x + m.w / 2, py = m.y + m.h / 2, z = 1.32;
      var tx_ = (m.W / 2 - px) * 0.7, ty_ = (m.H * 0.46 - py) * 0.7;
      tx_ = Math.min(px * (z - 1), Math.max(-(m.W - px) * (z - 1), tx_));
      ty_ = Math.min(py * (z - 1), Math.max(-(m.H - py) * (z - 1), ty_));
      svg.style.transformOrigin = px + 'px ' + py + 'px';
      svg.style.transform = 'translate(' + tx_ + 'px,' + ty_ + 'px) scale(' + z + ')';
    }
    function setDots(n, cur) {
      dots.replaceChildren();
      for (var i = 0; i < n; i++) dots.appendChild(el('i', { class: i === cur ? 'on' : '' }));
    }
    function compact(on) { stage.classList.toggle('compact', !!on); if (on) setFocus(null); }
    function fill(kids, footKids) {
      body.replaceChildren(); foot.replaceChildren(); hots.replaceChildren();
      add(body, kids); add(foot, footKids);
      body.scrollTop = 0;
      body.classList.remove('arrive');
    }
    function nextBtn(label, disabled) {
      var b = el('button', { class: 'btn onpaper', on: { click: next } }, label || '다음');
      if (disabled) b.disabled = true;
      return b;
    }
    function next() { idx++; if (idx >= steps.length) finish(); else step(); }
    function prev() { if (idx > 0) { idx--; step(); } }

    function step() {
      var st = steps[idx];
      if (st.k === 'arrive') return stepArrive();
      if (st.k === 'beat') return stepBeat(sc.beats[st.i], st.i);
      if (st.k === 'gate') return stepGate(st.g, st.i, gates.length);
      if (st.k === 'spot') return stepSpot();
      if (st.k === 'back') return stepBack();
      if (st.k === 'cards') return stepCards();
      if (st.k === 'close') return stepClose();
    }

    function stepArrive() {
      compact(false); setDots(0, 0); setFocus(null);
      if (sc.beats[0].state) setState(sc.beats[0].state);
      fill([
        el('div', { class: 'kicker', text: sc.alt ? '타임머신이 멈춘 곳' : '도착했어요' }),
        el('h2', { text: sc.place }),
        el('p', { text: sc.alt ? '어? 가려던 곳과 조금 달라 보여요. 먼저 둘러봐요.' : sc.title }),
        refChip(sc.ref)
      ], nextBtn('둘러보기'));
      body.classList.add('arrive');
    }

    function stepBeat(b, i) {
      compact(false); setDots(sc.beats.length, i);
      setState(b.state);
      requestAnimationFrame(function () { setFocus(b.focus); });
      var text = tx(b.text), who = b.say && C.chars[b.say.who];
      fill([
        el('div', { class: 'narr-meta' }, refChip(b.ref),
          (S.tier === 't1' && canSpeak) ? el('button', { class: 'readbtn', on: { click: function () { speak(text); } } }, icon('speaker'), '읽어 줘') : null),
        el('p', { class: 'narr', text: text }),
        b.say ? el('div', { class: 'say' }, pic(b.say.who + '-avatar', 'avatar', ''),
          el('div', { class: 'bubble' }, el('b', { text: who.name, style: 'color:' + who.color }), b.say.text)) : null,
        b.open ? el('div', { class: 'openbible' }, icon('book'),
          el('span', {}, '하나님이 하신 말씀은 성경책에서 직접 읽어요. ', el('b', { text: bookName(b.open) }))) : null
      ], [i > 0 ? el('button', { class: 'btn plain', on: { click: prev } }, '이전') : null,
        nextBtn(i === sc.beats.length - 1 ? (sc.alt ? '단서를 찾아보자' : '다음으로 가는 관문') : '다음')]);
    }

    /* ── 관문 부품 ── */
    function goodNote(ref, text) {
      return el('div', { class: 'note good fadein' }, el('b', { text: text || '성경에 그렇게 기록되어 있어요.' }), ref ? refChip(ref) : null);
    }
    function lookNote(ref, text) {
      return el('div', { class: 'note look fadein' }, el('b', { text: '성경에서 확인해 볼까요?' }),
        el('span', { text: text || '성경책을 펴서 읽은 뒤 다시 골라 보세요.' }), ref ? refChip(ref) : null);
    }
    function choiceBlock(q, ref, onOk) {
      var pics = q.options.some(function (o) { return o.icon; });
      var noteBox = el('div', {});
      var btns = q.options.map(function (o) {
        var b = el('button', { class: 'opt', on: { click: function () {
          if (o.ok) {
            btns.forEach(function (x) { x.disabled = true; if (x !== b) x.classList.add('rest'); });
            b.classList.add('ok');
            noteBox.replaceChildren(goodNote(ref));
            onOk();
          } else {
            b.classList.add('rest'); b.disabled = true;
            noteBox.replaceChildren(lookNote(ref));
          }
          noteBox.scrollIntoView({ block: 'nearest' });
        } } }, o.icon ? icon(o.icon) : null, el('span', { text: o.label }));
        return b;
      });
      return [el('p', { class: 'q-prompt', text: q.prompt }), el('div', { class: 'opts' + (pics ? ' pics' : '') }, btns), noteBox];
    }
    function findrefBlock(q, onOk) {
      var ch = el('input', { id: 'in-ch-' + id + '-' + idx, type: 'text', inputmode: 'numeric', 'aria-label': '장', autocomplete: 'off', maxlength: '3' });
      var vs = el('input', { id: 'in-vs-' + id + '-' + idx, type: 'text', inputmode: 'numeric', 'aria-label': '절', autocomplete: 'off', maxlength: '3' });
      var noteBox = el('div', {});
      var check = el('button', { class: 'btn plain', on: { click: function () {
        var v = parseInt(ch.value, 10) + ':' + parseInt(vs.value, 10);
        if (q.accept.indexOf(v) >= 0) {
          ch.disabled = vs.disabled = check.disabled = true;
          noteBox.replaceChildren(goodNote(null, '맞게 찾았어요. ' + q.book + ' ' + ch.value.trim() + '장 ' + vs.value.trim() + '절.'));
          onOk();
        } else {
          noteBox.replaceChildren(el('div', { class: 'note look fadein' }, el('b', { text: '그 절에는 다른 내용이 적혀 있어요.' }), el('span', { text: q.hint })));
        }
        noteBox.scrollIntoView({ block: 'nearest' });
      } } }, '확인');
      return [el('p', { class: 'q-prompt', text: q.prompt }),
        el('div', { class: 'refin' }, el('span', { text: q.book }), ch, el('span', { text: '장' }), vs, el('span', { text: '절' }), check),
        noteBox];
    }
    function findBlock(q, onOk) {
      var after = el('div', { style: 'display:flex;flex-direction:column;gap:12px' });
      var readBtn = el('button', { class: 'btn plain', on: { click: function () {
        readBtn.disabled = true; readBtn.textContent = '읽었어요';
        add(after, choiceBlock(q.confirm, q.ref, onOk));
        after.scrollIntoView({ block: 'nearest' });
      } } }, '찾아서 읽었어요');
      return [el('div', { class: 'findcard' }, icon('book'),
        el('div', {}, el('div', { class: 'big', text: bookName(q.ref) }), el('p', { text: tx(q.prompt) }))),
        readBtn, after];
    }
    function orderBlock(q, onOk) {
      var n = q.items.length, perm = [], i;
      for (i = 1; i < n; i += 2) perm.push(i);
      for (i = n - 1 - ((n - 1) % 2); i >= 0; i -= 2) perm.push(i);
      var picked = [], noteBox = el('div', {});
      var btns = perm.map(function (orig) {
        var num = el('span', { class: 'num', text: '' });
        var b = el('button', { class: 'opt', 'aria-pressed': 'false', on: { click: function () {
          if (picked.indexOf(orig) >= 0) return;
          picked.push(orig); num.textContent = String(picked.length); b.setAttribute('aria-pressed', 'true');
          if (picked.length === n) check();
        } } }, num, el('span', { text: q.items[orig] }));
        b._num = num;
        return b;
      });
      function reset() { picked = []; btns.forEach(function (b) { b._num.textContent = ''; b.setAttribute('aria-pressed', 'false'); b.classList.remove('ok'); }); }
      function check() {
        var ok = picked.every(function (v, k) { return v === k; });
        if (ok) {
          btns.forEach(function (b) { b.classList.add('ok'); b.disabled = true; });
          resetBtn.disabled = true;
          noteBox.replaceChildren(goodNote(q.ref, '성경에 기록된 순서예요.'));
          onOk();
        } else {
          noteBox.replaceChildren(lookNote(q.ref, '순서를 다시 살펴볼까요? 성경책을 차례로 읽으며 다시 눌러 보세요.'));
          reset();
        }
        noteBox.scrollIntoView({ block: 'nearest' });
      }
      var resetBtn = el('button', { class: 'btn plain', on: { click: function () { reset(); noteBox.replaceChildren(); } } }, '다시 놓기');
      return [el('p', { class: 'q-prompt', text: q.prompt }), el('div', { class: 'opts' }, btns), resetBtn, noteBox];
    }
    function multiBlock(q, onOk) {
      var noteBox = el('div', {});
      var btns = q.options.map(function (o) {
        var b = el('button', { class: 'opt', 'aria-pressed': 'false', on: { click: function () {
          b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
        } } }, el('span', { class: 'mark' }, icon('check')), el('span', { text: o.label }));
        return b;
      });
      var check = el('button', { class: 'btn plain', on: { click: function () {
        var ok = q.options.every(function (o, k) { return (btns[k].getAttribute('aria-pressed') === 'true') === !!o.ok; });
        if (ok) {
          btns.forEach(function (b, k) { b.disabled = true; b.classList.add(q.options[k].ok ? 'ok' : 'rest'); });
          check.disabled = true;
          noteBox.replaceChildren(el('div', { class: 'note good fadein' }, el('b', { text: '다른 점을 모두 찾았어요.' }),
            el('div', { style: 'display:flex;gap:6px;flex-wrap:wrap' }, q.options.filter(function (o) { return o.ref; }).map(function (o) { return refChip(o.ref); }))));
          onOk();
        } else {
          noteBox.replaceChildren(el('div', { class: 'note look fadein' }, el('b', { text: '다시 살펴볼까요?' }),
            el('span', { text: '방금 본 장면에 있었던 것만 골라 보세요.' })));
        }
        noteBox.scrollIntoView({ block: 'nearest' });
      } } }, '확인');
      return [el('p', { class: 'q-prompt', text: q.prompt }), el('div', { class: 'opts' }, btns), check, noteBox];
    }
    function hotspotBlock(q, onOk) {
      var found = 0;
      var list = el('div', { class: 'found-list' });
      var rows = q.items.map(function (it, k) {
        var row = el('div', { class: 'it wait' }, el('span', { text: '단서 ' + (k + 1) + ': 아직 못 찾았어요' }));
        list.appendChild(row);
        return row;
      });
      function place() {
        hots.replaceChildren();
        q.items.forEach(function (it, k) {
          var r = region(it.region) || { x: 150 + k * 250, y: 500, w: 160, h: 160 };
          var m = mapRect(r), d = Math.max(64, Math.min(120, Math.max(m.w, m.h) * 0.8));
          var b = el('button', { class: 'hot' + (it.found ? ' found' : ''), 'aria-label': '단서 ' + (k + 1),
            style: 'left:' + (m.x + m.w / 2 - d / 2) + 'px;top:' + (m.y + m.h / 2 - d / 2) + 'px;width:' + d + 'px;height:' + d + 'px',
            on: { click: function () {
              if (it.found) return;
              it.found = true; found++; b.classList.add('found');
              rows[k].className = 'it fadein';
              rows[k].replaceChildren(el('span', {}, it.text + ' '), refChip(it.ref));
              if (found === q.items.length) onOk();
            } } });
          hots.appendChild(b);
        });
      }
      q.items.forEach(function (it) { it.found = false; });
      setTimeout(place, 520);
      window.addEventListener('resize', place);
      return [el('p', { class: 'q-prompt', text: q.prompt }), list];
    }
    function blockFor(q, onOk) {
      if (q.type === 'choice') return choiceBlock(q, q.ref, onOk);
      if (q.type === 'find') return findBlock(q, onOk);
      if (q.type === 'findref') return findrefBlock(q, onOk);
      if (q.type === 'order') return orderBlock(q, onOk);
      if (q.type === 'multi') return multiBlock(q, onOk);
      if (q.type === 'hotspots') return hotspotBlock(q, onOk);
      return [];
    }

    function stepGate(q, i, n) {
      compact(true); setDots(0, 0);
      var nb = nextBtn(i === n - 1 ? '관문 통과' : '다음 관문', true);
      fill([el('div', { class: 'q-kicker', text: '다음으로 가는 관문 ' + (i + 1) + ' / ' + n }), blockFor(q, function () { nb.disabled = false; })], nb);
    }
    function stepSpot() {
      var q = sc.spot[S.tier];
      var isHot = q.type === 'hotspots';
      compact(!isHot); setDots(0, 0); setFocus(null);
      var nb = nextBtn('성경에서 확인하기', true);
      fill([el('div', { class: 'q-kicker', text: '어긋난 단서 찾기' }), blockFor(q, function () { nb.disabled = false; })], nb);
    }
    function stepBack() {
      compact(true); setDots(0, 0);
      var nb = nextBtn('다음', true);
      fill([el('div', { class: 'q-kicker', text: '타임머신 다시 맞추기' }),
        findBlock({ ref: sc.back.ref, prompt: sc.back.prompt, confirm: sc.back.confirm }, function () { nb.disabled = false; })], nb);
    }
    function stepCards() {
      compact(true); setDots(0, 0);
      fill([
        el('div', { class: 'q-kicker', text: sc.alt ? '돌아가는 길에 찾은 말씀' : '말씀 카드' }),
        el('p', { class: 'q-prompt', text: sc.alt ? '길을 잘못 들었지만, 성경의 다른 장면을 직접 보고 왔어요.' : '탐험 일지에 말씀 카드가 들어왔어요.' }),
        el('div', { class: 'vcards' }, sc.cards.map(function (c) { return cardNode(c, sc, true); }))
      ], nextBtn(sc.alt ? '모세가 있는 곳으로' : '다음'));
      sc.cards.forEach(function (c) {
        if (!S.cards.some(function (x) { return x.ref === c.ref; })) S.cards.push({ ref: c.ref, title: c.title, scene: sc.title, bonus: !!c.bonus });
      });
      save();
    }
    function stepClose() {
      compact(true);
      var c = sc.close[S.tier], kids = [];
      if (c.kind === 'prayer') kids.push(el('div', { class: 'closebox' }, el('h3', { text: '한 문장 기도' }), el('p', { text: c.text })));
      if (c.kind === 'practice') kids.push(el('div', { class: 'closebox' }, el('h3', { text: '이번 주 실천 한 가지' }), el('p', { text: c.text })));
      if (c.kind === 'note') {
        var ta = el('textarea', { id: 'note-' + id, 'aria-label': '기록', placeholder: '여기에 적으면 탐험 일지에 남아요.' });
        ta.value = S.notes[id] || '';
        ta.addEventListener('input', function () { S.notes[id] = ta.value; save(); });
        kids.push(el('div', { class: 'closebox' }, el('h3', { text: '탐험 기록' }), el('p', { text: c.prompt }), ta));
        kids.push(el('p', { class: 'pending', text: '뜻과 삶의 적용을 묻는 질문은 목사님 감수를 마친 뒤 이 자리에 열립니다.' }));
      }
      fill([el('div', { class: 'q-kicker', text: '탐험을 마치며' }), kids],
        nextBtn(id === 'EX-00' ? '다음 목적지 정하기' : '시간표로 돌아가기'));
    }
    function finish() {
      if (sc.alt) {
        S.routed = true; save();
        var to = C.scenes['EX-01'];
        warp('목적지를 다시 맞췄어요', to.place, to.ref, function () { runScene('EX-01'); });
        return;
      }
      S.done[id] = true; save();
      if (id === 'EX-00' && !S.routed) renderRoute(); else renderHub();
    }
    step();
  }

  function cardNode(c, sc, pop) {
    return el('div', { class: 'vcard' + (pop ? ' pop' : '') },
      el('div', { class: 'r', text: c.ref }), el('div', { class: 't', text: c.title }),
      el('div', { class: 'm', text: (sc ? sc.title : c.scene) + ' · 성경책에서 직접 읽어 보세요' }),
      c.bonus ? el('span', { class: 'tag', text: '돌아가는 길에 찾은 말씀' }) : null);
  }

  /* ════════════ 탐험 일지 ════════════ */
  function pageHead(title, back) {
    return el('div', { class: 'page-head pad' },
      el('button', { class: 'iconbtn', 'aria-label': '돌아가기', on: { click: back } }, icon('back')),
      el('h2', { text: title }));
  }
  function renderJournal() {
    var notes = Object.keys(S.notes).filter(function (k) { return S.notes[k] && S.notes[k].trim(); });
    show(el('div', { class: 'screen page' },
      pageHead('탐험 일지', renderHub),
      el('div', { class: 'page-body pad' },
        el('section', {}, el('h3', { text: '말씀 카드 ' + S.cards.length + '장' }),
          S.cards.length ? el('div', { class: 'vcards' }, S.cards.map(function (c) { return cardNode(c, null, false); }))
            : el('p', { class: 'empty', text: '장면을 탐험하면 직접 찾은 말씀이 여기에 모여요.' })),
        el('section', { class: 'notes' }, el('h3', { text: '내가 적은 기록' }),
          notes.length ? notes.map(function (k) { return el('div', { class: 'n' }, el('small', { text: C.scenes[k].ref }), el('p', { text: S.notes[k] })); })
            : el('p', { class: 'empty', text: '14~19세 단계에서 장면을 마치며 적은 글이 여기에 남아요.' })))));
  }

  /* ════════════ 구성 안내 (어른용) ════════════ */
  function renderGuide() {
    function sec(title) { var s = el('section', {}, el('h3', { text: title })); for (var i = 1; i < arguments.length; i++) add(s, arguments[i]); return s; }
    function table(head, rows) {
      return el('div', { class: 'tblwrap' }, el('table', {},
        el('thead', {}, el('tr', {}, head.map(function (h) { return el('th', { text: h }); }))),
        el('tbody', {}, rows.map(function (r) { return el('tr', {}, r.map(function (c) { return el('td', {}, c); })); }))));
    }
    show(el('div', { class: 'screen page' },
      pageHead('구성 안내', function () { (S.tier && S.char) ? renderHub() : renderTitle(); }),
      el('div', { class: 'page-body pad' },
        sec('이 시범 화면에서 볼 수 있는 것',
          el('p', { text: '세 아이(최온 10세, 휴 13세, 온우 16세)가 타임머신을 타고 성경의 장소에 가서 사건을 지켜봅니다. 목회자 감수가 필요 없다고 분류한 세 장면과, 목적지를 잘못 골랐을 때 가는 두 장면을 실제로 해 볼 수 있습니다.' }),
          el('p', { text: '시간표 화면의 “단계” 버튼으로 나이 단계를 바꾸면 같은 장면이 어떻게 달라지는지 비교할 수 있습니다.' })),
        sec('한 장면의 흐름',
          el('ol', { class: 'steps' },
            el('li', {}, el('span', {}, el('b', { text: '도착 ' }), '타임머신이 장소와 시대에 도착합니다.')),
            el('li', {}, el('span', {}, el('b', { text: '목격 ' }), '본문에 기록된 사건을 장절과 함께 차례로 지켜봅니다.')),
            el('li', {}, el('span', {}, el('b', { text: '관문 ' }), '본문에 근거한 질문에 답해야 다음으로 넘어갑니다.')),
            el('li', {}, el('span', {}, el('b', { text: '성경 찾기 ' }), '모르면 장절 안내를 받아 자기 성경책에서 찾습니다.')),
            el('li', {}, el('span', {}, el('b', { text: '기록 ' }), '찾은 구절이 탐험 일지의 말씀 카드로 남습니다.')))),
        sec('나이 단계별 차이',
          table(['', '8~10세', '11~13세', '14~19세'], [
            ['글', '한두 문장, 큰 글씨, 읽어 주기', '두세 문장', '본문에 가까운 서술'],
            ['질문', '그림 보고 고르기', '순서 맞추기, 고르기', '절을 스스로 찾아 적기'],
            ['성경 찾기', '장절을 알려 줌', '장절을 알려 줌', '주제만 알려 줌'],
            ['마무리', '한 문장 기도', '한 주간 실천', '기록 쓰기']
          ]),
          el('p', { text: '사실관계는 세 단계가 같고, 깊이와 표현만 달라집니다.' })),
        sec('목적지를 잘못 골랐을 때',
          el('p', { text: '첫 장면을 마치면 타임머신에 넣을 이름을 고릅니다. 모세가 아닌 이름을 고르면 실패로 처리하지 않고, 성경에 실제 있는 그 사람의 장면으로 갑니다. 그 장면도 본문 그대로 보여 주되, 가려던 곳과 다른 단서를 아이가 찾게 합니다. 이후 성경책에서 출애굽기 3장 4절을 확인하고 원래 장면으로 돌아옵니다.' }),
          table(['고른 이름', '도착하는 장면', '근거'], [
            ['여호수아', '요단 강을 건너는 백성', '수 3:7-17'],
            ['요셉', '요셉이 애굽을 다스리게 됨', '창 41:37-46']
          ]),
          el('p', { text: '바울을 골라 선교여행 장면으로 가는 경우는 성령의 말씀과 안수가 나오므로 감수 후에 넣습니다.' })),
        sec('지킨 원칙',
          el('ul', {},
            el('li', { text: '하나님은 어떤 형상으로도 그리지 않고 불, 구름, 빛만 그립니다.' }),
            el('li', { text: '하나님의 말씀은 지어내지 않고 간접 서술로만 적으며, 실제 문장은 성경책에서 읽게 합니다.' }),
            el('li', { text: '성경 본문은 싣지 않고 장절만 안내합니다. (개역개정 사용 허락 전)' }),
            el('li', { text: '세 아이는 끝까지 목격자이며 사건에 끼어들지 않습니다.' }),
            el('li', { text: '틀렸다는 표현, 점수, 개인 순위가 없습니다.' }),
            el('li', { text: '뜻과 적용을 묻는 질문은 감수 전이라 비워 두었습니다.' }))),
        sec('장면 목록과 상태',
          table(['장면', '본문', '상태'], C.timeline.map(function (n) {
            return [n.title, n.ref, el('span', { class: 'badge ' + (n.playable ? 'go' : 'hold'), text: n.playable ? '시범 화면 있음' : '감수 대기' })];
          })),
          el('p', { text: '열세 장면 가운데 열 장면은 하나님의 주권, 재앙과 심판, 유월절의 의미 같은 주제가 있어 감수를 마친 뒤 만듭니다.' })))));
  }

  renderTitle();
})();
