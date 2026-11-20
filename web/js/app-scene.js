/* 2D 시범판의 장면 진행과 말씀 카드. */
(function () {
  'use strict';
  var app = BO.app2d, C = BO.content, ART = BO.art || {}, META = BO.artMeta || {};
  var el = app.el, add = app.add, tx = app.tx, pic = app.pic, icon = app.icon, refChip = app.refChip;
  var show = app.show, bookName = app.bookName, warp = app.warp, save = app.save, questions = app.questions;

  function speak(text) {
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'ko-KR'; u.rate = 0.9;
      window.speechSynthesis.speak(u);
    } catch (e) { /* 읽어주기를 못 쓰는 환경 */ }
  }
  var canSpeak = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

  /* ════════════ 장면 ════════════ */
  function runScene(id, renderHub, renderRoute) {
    var sc = C.scenes[id];
    var gates = sc.alt ? [] : (sc.gates[app.state.tier] || []);
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
    var hots = el('div', { class: 'hot-layer' });
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
      body.replaceChildren(); foot.replaceChildren();
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
      hots.replaceChildren();
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
          (app.state.tier === 't1' && canSpeak) ? el('button', { class: 'readbtn', on: { click: function () { speak(text); } } }, icon('speaker'), '읽어 줘') : null),
        el('p', { class: 'narr', text: text }),
        b.say ? el('div', { class: 'say' }, pic(b.say.who + '-avatar', 'avatar', ''),
          el('div', { class: 'bubble' }, el('b', { text: who.name, style: 'color:' + who.color }), b.say.text)) : null,
        b.open ? el('div', { class: 'openbible' }, icon('book'),
          el('span', {}, '하나님이 하신 말씀은 성경책에서 직접 읽어요. ', el('b', { text: bookName(b.open) }))) : null
      ], [i > 0 ? el('button', { class: 'btn plain', on: { click: prev } }, '이전') : null,
        nextBtn(i === sc.beats.length - 1 ? (sc.alt ? '단서를 찾아보자' : '다음으로 가는 관문') : '다음')]);
    }

    function questionBlock(q, onOk) {
      return questions.blockFor(q, onOk, {
        inputSuffix: id + '-' + idx, hots: hots, region: region
      });
    }

    function stepGate(q, i, n) {
      compact(true); setDots(0, 0);
      var nb = nextBtn(i === n - 1 ? '관문 통과' : '다음 관문', true);
      fill([el('div', { class: 'q-kicker', text: '다음으로 가는 관문 ' + (i + 1) + ' / ' + n }), questionBlock(q, function () { nb.disabled = false; })], nb);
    }
    function stepSpot() {
      var q = sc.spot[app.state.tier];
      var isHot = q.type === 'hotspots';
      compact(!isHot); setDots(0, 0); setFocus(null);
      var nb = nextBtn('성경에서 확인하기', true);
      fill([el('div', { class: 'q-kicker', text: '어긋난 단서 찾기' }), questionBlock(q, function () { nb.disabled = false; })], nb);
    }
    function stepBack() {
      compact(true); setDots(0, 0);
      var nb = nextBtn('다음', true);
      fill([el('div', { class: 'q-kicker', text: '타임머신 다시 맞추기' }),
        questions.findBlock({ ref: sc.back.ref, prompt: sc.back.prompt, confirm: sc.back.confirm }, function () { nb.disabled = false; })], nb);
    }
    function stepCards() {
      compact(true); setDots(0, 0);
      fill([
        el('div', { class: 'q-kicker', text: sc.alt ? '돌아가는 길에 찾은 말씀' : '말씀 카드' }),
        el('p', { class: 'q-prompt', text: sc.alt ? '길을 잘못 들었지만, 성경의 다른 장면을 직접 보고 왔어요.' : '탐험 일지에 말씀 카드가 들어왔어요.' }),
        el('div', { class: 'vcards' }, sc.cards.map(function (c) { return cardNode(c, sc, true); }))
      ], nextBtn(sc.alt ? '모세가 있는 곳으로' : '다음'));
      sc.cards.forEach(function (c) {
        if (!app.state.cards.some(function (x) { return x.ref === c.ref; })) app.state.cards.push({ ref: c.ref, title: c.title, scene: sc.title, bonus: !!c.bonus });
      });
      save();
    }
    function stepClose() {
      compact(true);
      var c = sc.close[app.state.tier], kids = [];
      if (c.kind === 'prayer') kids.push(el('div', { class: 'closebox' }, el('h3', { text: '한 문장 기도' }), el('p', { text: c.text })));
      if (c.kind === 'practice') kids.push(el('div', { class: 'closebox' }, el('h3', { text: '이번 주 실천 한 가지' }), el('p', { text: c.text })));
      if (c.kind === 'note') {
        var ta = el('textarea', { id: 'note-' + id, 'aria-label': '기록', placeholder: '여기에 적으면 탐험 일지에 남아요.' });
        ta.value = app.state.notes[id] || '';
        ta.addEventListener('input', function () { app.state.notes[id] = ta.value; save(); });
        kids.push(el('div', { class: 'closebox' }, el('h3', { text: '탐험 기록' }), el('p', { text: c.prompt }), ta));
        kids.push(el('p', { class: 'pending', text: '뜻과 삶의 적용을 묻는 질문은 목사님 감수를 마친 뒤 이 자리에 열립니다.' }));
      }
      fill([el('div', { class: 'q-kicker', text: '탐험을 마치며' }), kids],
        nextBtn(id === 'EX-00' ? '다음 목적지 정하기' : '시간표로 돌아가기'));
    }
    function finish() {
      if (sc.alt) {
        app.state.routed = true; save();
        var to = C.scenes['EX-01'];
        warp('목적지를 다시 맞췄어요', to.place, to.ref, function () { runScene('EX-01', renderHub, renderRoute); });
        return;
      }
      app.state.done[id] = true; save();
      if (id === 'EX-00' && !app.state.routed) renderRoute(); else renderHub();
    }
    step();
  }

  function cardNode(c, sc, pop) {
    return el('div', { class: 'vcard' + (pop ? ' pop' : '') },
      el('div', { class: 'r', text: c.ref }), el('div', { class: 't', text: c.title }),
      el('div', { class: 'm', text: (sc ? sc.title : c.scene) + ' · 성경책에서 직접 읽어 보세요' }),
      c.bonus ? el('span', { class: 'tag', text: '돌아가는 길에 찾은 말씀' }) : null);
  }

  app.runScene = runScene;
  app.cardNode = cardNode;
})();
