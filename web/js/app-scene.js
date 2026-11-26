/* 2D 시범판의 장면 진행과 말씀 카드. */
(function () {
  'use strict';
  var app = BO.app2d, C = BO.content, ART = BO.art || {}, META = BO.artMeta || {};
  var el = app.el, add = app.add, tx = app.tx, pic = app.pic, icon = app.icon, refChip = app.refChip;
  var show = app.show, bookName = app.bookName, warp = app.warp, save = app.save, questions = app.questions;

  var arrivalPrompts = {
    'EX-01': '그림에서 양 떼를 찾아 눌러 보세요.'
  };

  var canSpeak = 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
  var reading = null;
  function stopReading() {
    if (!reading) return;
    reading.label.textContent = '읽어 줘';
    reading.onPlay?.(false);
    reading = null;
    try { window.speechSynthesis.cancel(); } catch (e) { /* 기기에서 음성 기능을 닫은 경우 */ }
  }
  function readButton(text, status, onPlay) {
    var label = el('span', { text: '읽어 줘' });
    return el('button', { class: 'readbtn', on: { click: function () {
      if (reading) { stopReading(); return; }
      status.hidden = true;
      var current = { label: label, utterance: null, onPlay: onPlay };
      reading = current;
      onPlay?.(true);
      label.textContent = '그만 듣기';
      function finish(failed) {
        if (reading !== current) return;
        reading = null;
        onPlay?.(false);
        label.textContent = '읽어 줘';
        if (failed) {
          status.hidden = false;
          status.textContent = '지금은 소리로 읽어 줄 수 없어요.';
        }
      }
      try {
        var voice = new SpeechSynthesisUtterance(text);
        current.utterance = voice;
        voice.lang = 'ko-KR'; voice.rate = 0.9;
        voice.onend = function () { finish(false); };
        voice.onerror = function (event) { finish(event.error !== 'canceled' && event.error !== 'interrupted'); };
        window.speechSynthesis.speak(voice);
      } catch (e) { finish(true); }
    } } }, icon('speaker'), label);
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) stopReading(); });
  window.addEventListener('pagehide', stopReading);

  /* ════════════ 장면 ════════════ */
  function sceneSteps(sc) {
    var gates = sc.alt ? [] : (sc.gates[app.state.tier] || []);
    var steps = [{ k: 'arrive' }];
    sc.beats.forEach(function (b, i) { steps.push({ k: 'beat', i: i }); });
    if (sc.alt) { steps.push({ k: 'spot' }); steps.push({ k: 'back' }); steps.push({ k: 'cards' }); }
    else {
      gates.forEach(function (g, i) { steps.push({ k: 'gate', g: g, i: i }); });
      steps.push({ k: 'cards' }); steps.push({ k: 'close' });
    }
    return steps;
  }

  function stepName(st) { return st.i === undefined ? st.k : st.k + '-' + st.i; }

  function pausedJourneys() {
    var entries = app.state.pausedJourneys;
    return entries && typeof entries === 'object' && !Array.isArray(entries) ? entries : null;
  }

  function savedJourney(id) {
    var journey = app.state.journey;
    if (id !== undefined && (!journey || journey.id !== id)) {
      var paused = pausedJourneys();
      journey = paused && Object.prototype.hasOwnProperty.call(paused, id) ? paused[id] : null;
      if (!journey || journey.id !== id) return null;
    }
    if (!journey || journey.tier !== app.state.tier || typeof journey.id !== 'string' ||
        !Object.prototype.hasOwnProperty.call(C.scenes, journey.id)) return null;
    var steps = sceneSteps(C.scenes[journey.id]);
    return steps.some(function (st) { return stepName(st) === journey.step; }) ? journey : null;
  }

  function rememberJourney(journey) {
    var paused = pausedJourneys();
    if (app.state.journey && app.state.journey.id !== journey.id) {
      var previous = savedJourney();
      if (previous) {
        if (!paused) app.state.pausedJourneys = paused = {};
        paused[previous.id] = previous;
      }
    }
    if (paused && Object.prototype.hasOwnProperty.call(paused, journey.id)) {
      delete paused[journey.id];
      if (!Object.keys(paused).length) delete app.state.pausedJourneys;
    }
    app.state.journey = journey;
    save();
  }

  function rememberArrival(id) {
    var journey = savedJourney(id) || { id: id, tier: app.state.tier, step: 'arrive' };
    rememberJourney(journey);
    return journey;
  }

  function pictureClues(sc) {
    return sc.alt && sc.spot.t1.type === 'hotspots' ? sc.spot.t1.items : [];
  }
  function recordJournalClues(id, regions) {
    if (!Array.isArray(regions) || !regions.length) return;
    var journal = app.state.clueJournal || {}, previous = journal[id] || [];
    var collected = pictureClues(C.scenes[id]).map(function (item) { return item.region; })
      .filter(function (region) { return previous.includes(region) || regions.includes(region); });
    if (collected.length) {
      journal[id] = collected;
      app.state.clueJournal = journal;
    }
  }
  function restoreJournalClues() {
    var stored = app.state.clueJournal;
    delete app.state.clueJournal;
    C.route.options.forEach(function (option) {
      var id = option.to, journey = savedJourney(id);
      if (stored) recordJournalClues(id, stored[id]);
      if (journey) recordJournalClues(id, journey.found);
    });
  }
  function journalClues(id) {
    var collected = app.state.clueJournal && app.state.clueJournal[id];
    return collected ? pictureClues(C.scenes[id]).filter(function (item) { return collected.includes(item.region); }) : [];
  }

  /* ── 글에서 찾기 (content.js 머리말의 find) ── */
  function findFor(b) { return b && b.find && b.find[app.state.tier] || null; }
  function calm() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  /* 대목 글을 찾을 말과 나머지로 나눈다. 찾을 말은 글에 글자 그대로 한 번 있다. */
  function findParts(text, words) {
    var hits = [];
    words.forEach(function (w, k) {
      var at = text.indexOf(w);
      if (at >= 0) hits.push({ at: at, end: at + w.length, k: k });
    });
    hits.sort(function (a, b) { return a.at - b.at; });
    var parts = [], pos = 0;
    hits.forEach(function (h) {
      if (h.at < pos) return;
      if (h.at > pos) parts.push({ t: text.slice(pos, h.at) });
      parts.push({ t: text.slice(h.at, h.end), k: h.k });
      pos = h.end;
    });
    if (pos < text.length) parts.push({ t: text.slice(pos) });
    return parts;
  }
  function plainWords(node, t) {
    t.split(/(\s+)/).forEach(function (piece) {
      if (!piece) return;
      if (/^\s+$/.test(piece)) node.appendChild(document.createTextNode(piece));
      else node.appendChild(el('span', { class: 'w', text: piece }));
    });
  }
  function count(n) { return ['', '하나', '둘', '셋', '넷', '다섯'][n] || n + '개'; }
  function findText(text, fw, savedWords, onWord, onAll) {
    var node = el('p', { class: 'narr findtext' });
    var note = el('p', { class: 'find-note', role: 'status', 'aria-live': 'polite' });
    var words = [], hints = 0, total = fw.words.length, got = 0;
    findParts(text, fw.words).forEach(function (part) {
      if (part.k === undefined) { plainWords(node, part.t); return; }
      var w = el('button', { class: 'w find-word', type: 'button', text: part.t });
      if (savedWords.includes(part.k)) {
        w.classList.add('found');
        w.setAttribute('aria-pressed', 'true');
        got++;
      }
      w.dataset.word = part.k;
      words.push(w);
      node.appendChild(w);
    });
    if (got) note.textContent = count(got) + ' 찾았어요. ' + count(total - got) + ' 남았어요.';
    function left() { return words.filter(function (w) { return !w.classList.contains('found'); }); }
    function shine() {
      left().forEach(function (w) { w.classList.remove('nudge'); void w.offsetWidth; w.classList.add('nudge'); });
      /* 작은 화면에서 글이 아래로 잘려 있어도 찾을 말이 보이게 한다. */
      var first = left()[0];
      if (first && first.scrollIntoView) first.scrollIntoView({ block: 'nearest', behavior: calm() ? 'auto' : 'smooth' });
    }
    /* 처음에는 글을 다시 읽어 보게 하고, 두 번째부터 찾을 말을 반짝이게 한다. 다른 말을 누른 것과 아래 단추를 누른 것을 함께 센다. */
    function hint() {
      hints++;
      note.textContent = hints === 1 ? '글을 천천히 다시 읽어 볼까요?' : '반짝이는 말을 눌러 보세요.';
      if (hints > 1) shine();
      else node.scrollIntoView && node.scrollIntoView({ block: 'nearest', behavior: calm() ? 'auto' : 'smooth' });
    }
    node.addEventListener('click', function (e) {
      var w = e.target.closest('.find-word');
      if (w) {
        if (w.classList.contains('found')) return;
        w.classList.remove('nudge');
        w.classList.add('found');
        w.setAttribute('aria-pressed', 'true');
        got++;
        note.textContent = got === total ? '찾았어요!' : count(got) + ' 찾았어요. ' + count(total - got) + ' 남았어요.';
        onWord(Number(w.dataset.word), got === total);
        if (got === total) setTimeout(onAll, calm() ? 0 : 450);
        else if (document.activeElement === w && left()[0]) left()[0].focus({ preventScroll: true });
        return;
      }
      /* 글 사이의 빈 곳은 세지 않는다. */
      if (e.target.closest('.w')) hint();
    });
    return { node: node, note: note, help: function () {
      hint();
      var first = left()[0];
      if (first) first.focus({ preventScroll: true });
    } };
  }
  /* 찾은 뒤에는 찾은 말을 표시해 둔다. 다시 누를 것은 없다. */
  function foundText(text, fw) {
    var node = el('p', { class: 'narr' });
    findParts(text, fw.words).forEach(function (part) {
      if (part.k === undefined) node.appendChild(document.createTextNode(part.t));
      else node.appendChild(el('mark', { class: 'found-word', text: part.t }));
    });
    return node;
  }

  function runScene(id, renderHub, renderRoute, journey, openClueJournal) {
    var sc = C.scenes[id], steps = sceneSteps(sc);
    var idx = journey ? steps.findIndex(function (st) { return stepName(st) === journey.step; }) : 0;
    var nightOnArrival = id === 'EX-09' && journey && journey.nightOnArrival === true;
    var clueItems = pictureClues(sc);
    var found = clueItems.map(function (item) { return item.region; }).filter(function (region) {
      return journey && Array.isArray(journey.found) && journey.found.includes(region);
    });
    /* 글에서 찾기를 마친 대목 번호. 이전·다음으로 오가거나 이어서 할 때 다시 찾게 하지 않는다. */
    var wordMarks = (journey && Array.isArray(journey.marks) ? journey.marks : []).filter(function (n, k, all) {
      return typeof n === 'number' && all.indexOf(n) === k && !!findFor(sc.beats[n]);
    });
    var partialWords = {};
    sc.beats.forEach(function (b, i) {
      var task = findFor(b), stored = journey && journey.partialWords && journey.partialWords[i];
      if (task && Array.isArray(stored) && !wordMarks.includes(i)) {
        var picked = task.words.map(function (_, k) { return k; }).filter(function (k) { return stored.includes(k); });
        if (picked.length === task.words.length) wordMarks.push(i);
        else if (picked.length) partialWords[i] = picked;
      }
    });
    var field = null, horeb = null;
    var marks = journey && Number.isInteger(journey.brickMarks) ? journey.brickMarks & 3 : 0;
    var yardReview = !!(journey && journey.step === 'beat-3' && journey.yardReview);
    function remember(st) {
      var progress = { id: id, tier: app.state.tier, step: stepName(st) };
      if (id === 'EX-00' && marks) progress.brickMarks = marks;
      if (id === 'EX-00' && st.k === 'beat' && st.i === 3 && yardReview) progress.yardReview = true;
      if (wordMarks.length) progress.marks = wordMarks.slice();
      if (Object.keys(partialWords).length) progress.partialWords = Object.assign({}, partialWords);
      if (found.length) progress.found = found.slice();
      if (st.k === 'arrive' && nightOnArrival) progress.nightOnArrival = true;
      rememberJourney(progress);
    }
    function solved(nextButton) {
      nextButton.disabled = false;
      remember(steps[idx + 1]);
    }

    var artBox = id === 'EX-00'
      ? el('div', {class:'art'}, el('img', {class:'by-last-photo',src:BO.bondageImages?.cry || 'assets/bondage/cry.webp',alt:'일터에서 함께 앉은 백성'}))
      : el('div', { class: 'art', html: ART[sc.art] || '' });
    var svg = artBox.querySelector('svg');
    var dots = el('div', { class: 'dots' });
    var hots = el('div', { class: 'hot-layer' });
    var stage = el('div', { class: 'stage' }, artBox,
      el('div', { class: 'hud pad' },
        el('button', { class: 'iconbtn', 'aria-label': '시간표로 돌아가기', on: { click: function () { stopReading(); if (horeb) horeb.close(); renderHub(); } } }, icon('back')),
        el('div', { class: 'where' }, el('span', { class: 'place', text: sc.place }), refChip(sc.ref, true))),
      dots, hots);
    var body = el('div', { class: 'sheet-body pad' });
    var foot = el('div', { class: 'sheet-foot pad' });
    var normalScene = el('div', { class: 'screen scene' }, stage, el('div', { class: 'sheet' }, body, foot));
    if (id === 'EX-01') horeb = BO.horebField.create(normalScene, stage);
    if (id !== 'EX-00') show(normalScene);

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
    var view = null, lookSpot = null;
    function setFocus(rid) {
      if (!svg) return;
      var r = rid && region(rid);
      view = null;
      if (!r) { svg.style.transform = 'none'; placeLook(); return; }
      var m = mapRect(r), px = m.x + m.w / 2, py = m.y + m.h / 2, z = 1.32;
      var tx_ = (m.W / 2 - px) * 0.7, ty_ = (m.H * 0.46 - py) * 0.7;
      tx_ = Math.min(px * (z - 1), Math.max(-(m.W - px) * (z - 1), tx_));
      ty_ = Math.min(py * (z - 1), Math.max(-(m.H - py) * (z - 1), ty_));
      svg.style.transformOrigin = px + 'px ' + py + 'px';
      svg.style.transform = 'translate(' + tx_ + 'px,' + ty_ + 'px) scale(' + z + ')';
      view = { ox: px, oy: py, tx: tx_, ty: ty_, z: z };
      placeLook();
    }
    /* 이야기 중에 그림을 눌러 찾는 자리는 당겨진 그림의 그 자리에 둔다. 그림 칸 밖으로 나간 부분은 잘라 낸다. */
    function placeLook() {
      if (!lookSpot) return;
      var m = mapRect(lookSpot.r), v = view || { ox: 0, oy: 0, tx: 0, ty: 0, z: 1 };
      function at(x, o, t) { return o + t + v.z * (x - o); }
      var left = Math.max(0, at(m.x, v.ox, v.tx)), right = Math.min(m.W, at(m.x + m.w, v.ox, v.tx));
      /* 위쪽의 장소 표시와 시간표 단추는 가리지 않는다. */
      var hud = stage.querySelector('.hud .where'), roof = hud ? hud.getBoundingClientRect().bottom - stage.getBoundingClientRect().top + 4 : 0;
      var top = Math.max(roof, at(m.y, v.oy, v.ty)), bottom = Math.min(m.H, at(m.y + m.h, v.oy, v.ty));
      if (right - left < 44) { left = Math.max(0, Math.min(left, m.W - 44)); right = left + 44; }
      if (bottom - top < 44) { top = Math.max(0, Math.min(top, m.H - 44)); bottom = top + 44; }
      var st = lookSpot.target.style;
      st.left = left + 'px'; st.top = top + 'px'; st.width = (right - left) + 'px'; st.height = (bottom - top) + 'px';
    }
    function lookTarget(r, label, onFind, inStory) {
      var target = el('button', { class: 'look-target', 'aria-label': label + ' 살펴보기', on: { click: onFind },
        style: '--dx:' + (r.x + r.w / 2 - 450) + ';--dy:' + (r.y + r.h / 2 - 600) + ';--w:' + r.w + ';--h:' + r.h });
      hots.appendChild(target);
      if (inStory) { lookSpot = { target: target, r: r }; placeLook(); }
      /* 다른 곳을 누르면 찾을 곳에 고리를 띄워 알려 준다. 아무 반응 없는 화면을 남기지 않는다. */
      artBox.onclick = function () { nudge(target); };
      return target;
    }
    function nudge(target) {
      target.classList.remove('nudge');
      void target.offsetWidth;
      target.classList.add('nudge');
    }
    if (svg && window.ResizeObserver) {
      var focusSize = new ResizeObserver(function () {
        if (!stage.isConnected) { focusSize.disconnect(); return; }
        var st = steps[idx];
        if (st && st.k === 'beat') setFocus(sc.beats[st.i].focus);
      });
      focusSize.observe(stage);
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
      stopReading();
      artBox.onclick = null;
      hots.replaceChildren();
      lookSpot = null;
      var st = steps[idx];
      remember(st);
      if (horeb) horeb.render(st);
      if (id === 'EX-00' && (st.k === 'arrive' || st.k === 'beat')) {
        if (!field) field = BO.bondageField.create(sc, {
          next: next, prev: prev, leave: function () { field.close(); renderHub(); },
          mark: function (value) { marks = value; remember(steps[idx]); },
          review: function (value) { yardReview = value; remember(steps[idx]); }
        });
        if (st.k !== 'beat' || st.i !== 3) yardReview = false;
        field.render(st.k === 'arrive' ? -1 : st.i, marks, yardReview);
        return;
      }
      if (field) { field.close(); field = null; }
      if (!normalScene.isConnected) show(normalScene);
      if (st.k === 'arrive') return stepArrive();
      if (st.k === 'beat') return stepBeat(sc.beats[st.i], st.i);
      if (st.k === 'gate') return stepGate(st.g, st.i, sc.gates[app.state.tier].length);
      if (st.k === 'spot') return stepSpot();
      if (st.k === 'back') return stepBack();
      if (st.k === 'cards') return stepCards();
      if (st.k === 'close') return stepClose();
    }

    function pillarSwitch(hint, cloud, fire) {
      var button = el('button', { class: 'btn plain pillar-switch', on: { click: toggle } });
      function paint() {
        setState(nightOnArrival ? 'night' : 'day');
        hint.textContent = nightOnArrival ? '불 기둥을 누르면 낮의 광야가 보여요.' : '구름 기둥을 누르면 밤의 광야가 보여요.';
        button.textContent = nightOnArrival ? '낮 풍경 보기' : '밤 풍경 보기';
      }
      function toggle() {
        nightOnArrival = !nightOnArrival;
        paint();
        remember(steps[idx]);
      }
      artBox.onclick = function (event) {
        if ((nightOnArrival ? fire : cloud).contains(event.target)) toggle();
      };
      paint();
      return button;
    }

    function stepArrive() {
      compact(false); setDots(0, 0); setFocus(null);
      if (sc.beats[0].state) setState(sc.beats[0].state);
      var landmark = svg && arrivalPrompts[id] && region(sc.beats[0].focus);
      var hint = null, controls = [], startLabel = '둘러보기';
      if (landmark) {
        hint = el('p', { class: 'look-prompt', text: arrivalPrompts[id] });
        var drawing = svg.querySelector('#' + sc.art + '-' + landmark.id);
        var bounds = drawing ? drawing.getBBox() : { x: landmark.x, y: landmark.y, width: landmark.w, height: landmark.h };
        lookTarget({ x: bounds.x, y: bounds.y, w: bounds.width, h: bounds.height }, landmark.label, next);
      } else if (svg && clueItems.length) {
        hint = questionBlock({ type: 'hotspots', items: clueItems, prompt: '그림의 표시를 눌러 단서를 찾아보세요.' });
        startLabel = '이야기 읽기';
      } else if (id === 'EX-09' && svg) {
        var cloud = svg.querySelector('#ex09-cloud'), fire = svg.querySelector('#ex09-fire');
        if (cloud && fire) {
          hint = el('p', { class: 'look-prompt', 'aria-live': 'polite' });
          controls.push(pillarSwitch(hint, cloud, fire));
          startLabel = '광야 길 따라가기';
        }
      }
      controls.push(nextBtn(startLabel));
      fill([
        el('div', { class: 'kicker', text: sc.alt ? '타임머신이 멈춘 곳' : '도착했어요' }),
        el('h2', { text: sc.place }),
        sc.alt && hint ? null : el('p', { text: sc.alt ? '어? 가려던 곳과 조금 달라 보여요. 먼저 둘러봐요.' : sc.title }),
        hint,
        refChip(sc.ref)
      ], controls);
      body.classList.add('arrive');
    }

    function stepBeat(b, i, justFound) {
      compact(false); setDots(sc.beats.length, i);
      setState(b.state);
      setFocus(b.focus);
      var text = tx(b.text), who = b.say && C.chars[b.say.who];
      var fw = findFor(b), finding = !!fw && wordMarks.indexOf(i) < 0;
      var status = app.state.tier === 't1' && canSpeak ? el('p', { class: 'read-status', hidden: '', role: 'status' }) : null;
      var ahead = sc.beats[i + 1], spot = !finding && ahead && ahead.look && svg ? region(ahead.focus) : null, forward;
      var back = i > 0 ? el('button', { class: 'btn plain', on: { click: prev } }, '이전') : null;
      var verse = b.ref.slice(2).split('-')[0];
      var book = horeb ? el('button', { type:'button', class:'ref horeb-verse',
        on:{ click:function () { horeb.openBook(verse); } } }, icon('bookline'), '두루마리 · ' + b.ref) : refChip(b.ref);
      var meta = el('div', { class: 'narr-meta' }, book,
        status ? readButton(finding ? text + ' ' + fw.prompt : spot ? text + ' ' + tx(ahead.look) : text, status, horeb && horeb.setReading) : null);
      if (finding) {
        /* 아래 단추 자리에 찾을 말을 적는다. 누르면 글의 그 말이 반짝이고 초점이 그리로 간다. */
        var finder = findText(text, fw, partialWords[i] || [], function (k, complete) {
          if (complete) {
            wordMarks.push(i);
            delete partialWords[i];
          } else partialWords[i] = (partialWords[i] || []).concat(k);
          remember(steps[idx]);
        }, function () {
          if (!normalScene.isConnected || steps[idx].k !== 'beat' || steps[idx].i !== i || !finder.node.isConnected) return;
          stepBeat(b, i, true);
        });
        fill([meta, status, finder.node, finder.note], [back,
          el('button', { class: 'btn find-help', on: { click: finder.help } }, icon('lens'), el('span', { text: fw.prompt }))]);
        return;
      }
      if (spot) {
        var target = lookTarget(spot, spot.label, next, true);
        /* 늘 누르던 아래 단추 자리에 찾을 것을 적는다. 누르면 그림의 찾을 곳에 고리가 뜨고 초점이 그리로 간다. */
        forward = el('button', { class: 'btn look-help', on: { click: function () { nudge(target); target.focus({ preventScroll: true }); } } },
          icon('lens'), el('span', { text: tx(ahead.look) }));
      } else forward = nextBtn(i === sc.beats.length - 1 ? (sc.alt ? '단서를 찾아보자' : '다음으로 가는 관문') : '다음');
      var sayBox = b.say ? el('div', { class: 'say' + (justFound ? ' fadein' : '') }, pic(b.say.who + '-avatar', 'avatar', ''),
        el('div', { class: 'bubble' }, el('b', { text: who.name, style: 'color:' + who.color }), b.say.text)) : null;
      if (horeb && sayBox) {
        var portrait = el('div', {class:'horeb-companion'}, sayBox.firstElementChild, el('small', {text:'탐험대 이야기'}));
        sayBox.prepend(portrait);
      }
      var openBox = b.open ? el(horeb ? 'button' : 'div', { class: 'openbible' + (justFound ? ' fadein' : ''),
        on: horeb ? { click: function () { horeb.openBook(b.open.slice(2)); } } : {} }, icon('book'),
        el('span', {}, horeb ? '말씀 두루마리 열기 · ' : '하나님이 하신 말씀은 성경책에서 직접 읽어요. ', el('b', { text: bookName(b.open) }))) : null;
      fill([
        meta,
        status,
        fw ? foundText(text, fw) : el('p', { class: 'narr', text: text }),
        sayBox,
        openBox
      ], [back, forward]);
      if (justFound) {
        /* 찾은 다음 할 일(아래 단추)로 초점을 옮기고, 새로 나온 동료의 말과 성경책 안내가 아래 단추에 가리지 않게 끝까지 보여 준다. */
        forward.focus({ preventScroll: true });
        var seen = openBox || sayBox;
        if (seen && seen.scrollIntoView) seen.scrollIntoView({ block: 'end', behavior: calm() ? 'auto' : 'smooth' });
      }
    }

    function questionBlock(q, onOk) {
      return questions.blockFor(q, onOk, {
        inputSuffix: id + '-' + idx, hots: hots, region: region, found: found, arrival: steps[idx].k === 'arrive',
        onFind: function (regions) {
          found = regions.slice();
          recordJournalClues(id, found);
          remember(steps[idx]);
        }
      });
    }

    function stepGate(q, i, n) {
      compact(true); setDots(0, 0);
      var nb = nextBtn(i === n - 1 ? '관문 통과' : '다음 관문', true);
      fill([el('div', { class: 'q-kicker', text: '다음으로 가는 관문 ' + (i + 1) + ' / ' + n }), questionBlock(q, function () { solved(nb); })], nb);
    }
    function stepSpot() {
      var q = sc.spot[app.state.tier];
      var isHot = q.type === 'hotspots';
      compact(!isHot); setDots(0, 0); setFocus(null);
      var nb = nextBtn('성경에서 확인하기', true);
      var notes = isHot ? null : questions.clueNotes(clueItems.filter(function (item) { return found.includes(item.region); }));
      fill([el('div', { class: 'q-kicker', text: '어긋난 단서 찾기' }), notes, questionBlock(q, function () { solved(nb); })], nb);
    }
    function stepBack() {
      compact(true); setDots(0, 0);
      var nb = nextBtn('다음', true);
      fill([el('div', { class: 'q-kicker', text: '타임머신 다시 맞추기' }),
        questions.findBlock({ ref: sc.back.ref, prompt: sc.back.prompt, confirm: sc.back.confirm }, function () { solved(nb); })], nb);
    }
    function stepCards() {
      compact(true); setDots(0, 0);
      fill([
        el('div', { class: 'q-kicker', text: sc.alt ? '돌아가는 길에 찾은 말씀' : '말씀 카드' }),
        el('p', { class: 'q-prompt', text: found.length ? '찾은 단서 ' + found.length + '개와 말씀 카드를 탐험 일지에서 다시 볼 수 있어요.' :
          sc.alt ? '길을 잘못 들었지만, 성경의 다른 장면을 직접 보고 왔어요.' : '탐험 일지에 말씀 카드가 들어왔어요.' }),
        el('div', { class: 'vcards' }, sc.cards.map(function (c) { return cardNode(c, sc, true); }))
      ], [found.length ? el('button', { class: 'btn plain journal-link', on: { click: function () { openClueJournal(id); } } }, '단서 일지 보기') : null,
        nextBtn(sc.alt ? '모세가 있는 곳으로' : '다음')]);
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
      if (id === 'EX-09') kids.push(el('button', {class:'btn wide onpaper', on:{click:function () { finish(app.openRedSea); }}}, '홍해 본편으로'));
      if (id === 'EX-01' || id === 'EX-09') {
        kids.push(el('button', {class:'btn wide onpaper', on:{click:function () {
          finish(id === 'EX-09' ? app.openExodusTrail : function () { app.openPalace('hub'); });
        }}}, id === 'EX-09' ? '길 잇기 수첩 바로 열기' : '모세를 따라 왕궁으로'));
      }
      fill([el('div', { class: 'q-kicker', text: '탐험을 마치며' }), kids],
        nextBtn(id === 'EX-00' ? '다음 목적지 정하기' : '시간표로 돌아가기'));
    }
    function finish(onward) {
      stopReading();
      if (horeb) horeb.close();
      delete app.state.journey;
      if (sc.alt) {
        app.state.routed = true;
        var destination = rememberArrival('EX-01');
        var to = C.scenes['EX-01'];
        warp('목적지를 다시 맞췄어요', to.place, to.ref, function () { runScene('EX-01', renderHub, renderRoute, destination, openClueJournal); });
        return;
      }
      app.state.done[id] = true; save();
      if (onward) onward();
      else if (id === 'EX-00' && !app.state.routed) renderRoute(); else renderHub();
    }
    if (journey) {
      // 단서나 관문에서 바로 열어도 직전에 본 그림의 상태가 맞아야 한다.
      steps.slice(0, idx).forEach(function (st) { if (st.k === 'beat') setState(sc.beats[st.i].state); });
    }
    step();
  }

  function cardNode(c, sc, pop) {
    var card = el('div', { class: 'vcard' + (pop ? ' pop' : '') },
      el('div', { class: 'r', text: c.ref }), el('div', { class: 't', text: c.title }),
      el('div', { class: 'm', text: (sc ? sc.title : c.scene) + ' · 성경책에서 직접 읽어 보세요' }),
      c.bonus ? el('span', { class: 'tag', text: '돌아가는 길에 찾은 말씀' }) : null);
    if (c.ref === '출 2:24') card.append(el('button', {type:'button',class:'by-verse',on:{click:function () { BO.bondageField.scroll('2:24'); }}}, '말씀 인장 열기 · 출 2:24'));
    if (['출 3:5','출 3:12'].includes(c.ref)) card.append(el('button', {type:'button',class:'by-verse',on:{click:function () { BO.horebField.scroll(c.ref.slice(2)); }}}, '말씀 인장 열기 · '+c.ref));
    return card;
  }

  restoreJournalClues();
  app.journalClues = journalClues;
  app.rememberArrival = rememberArrival;
  app.runScene = runScene;
  app.savedJourney = savedJourney;
  app.cardNode = cardNode;
  app.canReadAloud = canSpeak;
  app.readButton = readButton;
  app.stopReading = stopReading;
})();
