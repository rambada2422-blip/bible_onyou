/* 게임 상태와 화면 안내. game.js가 공유 상태 G를 전달하고 초기화 순서를 정한다. */
BO3D.gameModules = BO3D.gameModules || {};
BO3D.gameModules.ui = function (G) {
  'use strict';
  var objText, toastEl, panelBody, panelFoot, panel;

  function hideLoading() {
    var ld = document.getElementById('loading3');
    if (ld) ld.remove();
  }

  G.showWebGLNotice = function () {
    hideLoading();
    G.canvas.hidden = true;
    G.ui.replaceChildren(G.el('main', { class: 'webgl-notice', 'aria-labelledby': 'webgl-title' },
      G.el('div', {},
        G.el('h1', { id: 'webgl-title', text: '이 기기에서는 3D 탐험을 열 수 없어요' }),
        G.el('p', { text: '다른 휴대폰이나 컴퓨터에서 다시 열어 주세요.' }))));
  };

  G.setMuted = function (muted) {
    if (G.FX) G.FX.audio.mute(muted);
    G.snd.setAttribute('aria-pressed', String(muted));
    G.snd.setAttribute('aria-label', muted ? '소리 켜기' : '소리 끄기');
  };
  function setObjective(t) { objText.textContent = t; }
  function toast(html, who) {
    // 첫 탐험의 알림은 도움말과 거리 표시 바로 아래에 놓는다.
    if (G.cur === 'horeb' && G.state === 'explore' && G.step === 0) G.hud.appendChild(toastEl);
    else G.ui.insertBefore(toastEl, G.dexBtn);
    toastEl.replaceChildren();
    if (who) { G.add(toastEl, [G.avatar(who), G.el('span', {}, G.el('b', { text: G.C.chars[who].name + ' ', style: 'color:' + G.C.chars[who].color }), html)]); }
    else G.add(toastEl, G.el('span', { text: html }));
    toastEl.hidden = false; toastEl.classList.remove('show'); void toastEl.offsetWidth; toastEl.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(function () { toastEl.hidden = true; }, 4200);
  }
  function showPanel(kids_, foot) {
    panelBody.replaceChildren(); panelFoot.replaceChildren();
    G.add(panelBody, kids_); G.add(panelFoot, foot);
    panel.hidden = false; panelBody.scrollTop = 0;
    G.releaseControls();
  }
  function hidePanel() { panel.hidden = true; }
  function btn(label, fn, cls) { return G.el('button', { class: 'btn ' + (cls || 'onpaper'), on: { click: fn } }, label); }

  function sharonSay(face, line) {
    var sharon = G.C3.sharon;
    return G.el('div', { class: 'say sharon-say' }, G.sharonFace(face),
      G.el('div', { class: 'bubble' },
        G.el('b', { text: sharon.name, style: 'color:' + sharon.color }),
        G.el('span', { class: 'sharon-line', text: line })));
  }

  function sharonGloss(gloss) {
    var tier = G.S.tier;
    return G.el('section', { class: 'sharon-gloss', 'data-sharon-gloss': gloss.id },
      G.el('div', { class: 'q-kicker' }, G.icon('bookline'), G.C3.sharon.glossKicker),
      sharonSay('avatar', gloss.text[tier]),
      G.el('div', { class: 'narr-meta' }, gloss.refs[tier].map(function (ref) { return G.refChip(ref); })));
  }

  function fieldPhoto(onIdentify) {
    if (!G.dex.sheep) return null;
    var photo = G.el('img', { alt: '', src: G.dex.sheep });
    if (!G.flockMarks.length) {
      photo.alt = '광야에서 직접 찍은 동물 무리';
      return G.el('figure', { class: 'field-observation' }, photo, G.el('figcaption', {},
        G.el('b', { text: '내가 찍은 사진' }), '사진을 살펴보고 보기에서 골라요.'));
    }
    var young = G.S.tier === 't1', x = 0.5, y = 0.5;
    var marker = G.el('i', { class: 'field-sight', hidden: true, 'aria-hidden': 'true' });
    var message = G.el('span', { role: 'status', text: young ? '돌보던 동물을 사진에서 짚거나 보기에서 골라요.' : '사진 속 동물을 찾아보고, 성경에서 주인을 확인해요.' });
    function aim(left, top) {
      x = Math.max(0, Math.min(1, left)); y = Math.max(0, Math.min(1, top));
      marker.style.left = (x * 100) + '%'; marker.style.top = (y * 100) + '%'; marker.hidden = false;
    }
    var picture = G.el('button', { type: 'button', class: 'field-photo', 'aria-label': '사진에서 동물 찾기',
      'aria-describedby': 'field-photo-keys', on: {
        keydown: function (e) {
          var moves = { ArrowLeft: [-1,0], ArrowRight: [1,0], ArrowUp: [0,-1], ArrowDown: [0,1] };
          var move = moves[e.key];
          if (move) { e.preventDefault(); aim(x + 0.06 * move[0], y + 0.06 * move[1]); }
        },
        click: function (e) {
          var rect = picture.getBoundingClientRect();
          if (e.detail) aim((e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height);
          else aim(x, y);
          var hit = G.flockMarks.some(function (p) {
            return Math.hypot(x - p[0] / 1000, y - p[1] / 1000) <= Math.max(p[2] / 1000, 12 / rect.width);
          });
          marker.classList.toggle('found', hit);
          if (!hit) { message.textContent = '그곳에는 동물이 보이지 않아요. 다른 곳을 짚어 보세요.'; return; }
          if (young) onIdentify();
          /* 11~13세 보기에서는 '양 떼'가 정답에만 들어 있다. 물음 1의 답이 먼저 보이지 않게 동물 이름을 말하지 않는다 (대표 2026-11-21).
             14~19세는 물음에 이미 양 떼가 있고 보기가 사람이라 '누구의 것'만 묻는다. */
          else message.textContent = G.S.tier === 't2' ? '동물 무리를 찾았어요. 누구의 무엇이었는지 성경에서 확인하고 보기에서 골라요.'
            : '동물 무리를 찾았어요. 누구의 것이었는지 성경에서 확인하고 보기에서 골라요.';
        }
      } }, photo, marker);
    return G.el('figure', { class: 'field-observation' }, picture, G.el('figcaption', {},
      G.el('b', { text: '내가 찍은 사진' }), message,
      G.el('small', { id: 'field-photo-keys', text: '키보드는 방향키로 조준하고 Enter로 확인해요.' })));
  }

  /* 물음과 보기 순서는 승인된 horeb 자료에서 읽는다.
   * 샤론이 처음 말하는 물음 1 앞에서 자기소개를 한다 (docs/11 7.1, 7.2의 2·3번 글. 8~10세는 두 화면).
   * 세 물음 모두 맞힌 뒤에는 성경 표시와 샤론의 안내를 두 화면으로 나눈다 (docs/11 7.3). */
  function detectorQuestion(item, index, onReady, savedPage) {
    var data = G.C3.horeb, sharon = G.C3.sharon, tier = G.S.tier, q = item.q[tier], solved = false;
    var split = q.prompt.search(/[.?] /);
    var speech = sharonSay('ask', split === -1 ? q.prompt : q.prompt.slice(0, split + 1));
    var continuation = split === -1 ? null : G.el('p', { class: 'q-prompt', text: q.prompt.slice(split + 2) });
    var noteBox = G.el('div', {});
    function showSharon() {
      G.rememberDetectorAnswer(index, 'sharon');
      var found = sharon.found[index];
      showPanel([G.el('div', { class: 'q-kicker', text: '탐험대 이야기' }),
        sharonSay('joy', tier === 't1' && found.t1 ? found.t1 : found.text)], btn('계속 탐험하기', onReady));
    }
    function showReference() {
      G.rememberDetectorAnswer(index, 'reference');
      showPanel([G.goodNote(item.okRef[tier])], btn('다음', showSharon));
    }
    if (savedPage === 'reference') { showReference(); return; }
    if (savedPage === 'sharon') { showSharon(); return; }
    function correct() {
      if (solved) return;
      solved = true;
      showReference();
    }
    var opts = q.options.map(function (option) {
      var b = G.el('button', { class: 'opt', on: { click: function () {
        if (solved) return;
        if (option.ok) correct();
        else {
          b.classList.add('rest'); b.disabled = true;
          if (!noteBox.firstChild) {
            var ask = speech.querySelector('[data-sharon="ask"]');
            var cheer = G.sharonFace('cheer');
            if (ask) ask.remove();
            if (cheer) speech.prepend(cheer);
            noteBox.appendChild(G.lookNote());
          }
          noteBox.scrollIntoView({ block: 'nearest' });
        }
      } } }, G.el('span', { text: option.label }));
      return b;
    });
    function showQuestion() {
      if (index === 0) G.rememberDetectorAnswer(index, 'question');
      showPanel([
        G.el('div', { class: 'q-kicker', 'data-detector-quiz': String(index), text: sharon.kicker + ' ' + (index + 1) + ' / ' + data.quiz.length }),
        G.el('div', { class: 'narr-meta' }, tier === 't2' ? G.refChip(item.ref) : G.el('span', { text: data.bookHint[tier] })),
        speech, continuation, index === 0 ? fieldPhoto(correct) : null, G.el('div', { class: 'opts' }, opts), noteBox
      ], []);
    }
    function introPage(lines, next) {
      showPanel([G.el('div', { class: 'q-kicker', 'data-sharon-intro': '', text: '탐험대 이야기' }),
        lines.map(function (line) { return sharonSay('avatar', line); })], btn('다음', next));
    }
    var intro = sharon.intro[tier];
    if (index !== 0 || savedPage === 'question') showQuestion();
    else if (tier === 't1') introPage([intro[0]], function () { introPage([intro[1]], showQuestion); });
    else introPage(intro, showQuestion);
  }

  function beatNodes(b) {
    var who = b.say && G.C.chars[b.say.who];
    return [
      G.el('div', { class: 'narr-meta' }, G.refChip(b.ref)),
      G.el('p', { class: 'narr', text: G.tx(b.text) }),
      b.say ? G.el('div', { class: 'say' }, G.avatar(b.say.who), G.el('div', { class: 'bubble' }, G.el('b', { text: who.name, style: 'color:' + who.color }), b.say.text)) : null,
      b.open ? G.el('div', { class: 'openbible' }, G.icon('book'), G.el('span', {}, '하나님이 하신 말씀은 성경책에서 직접 읽어요. ', G.el('b', { text: G.bookName(b.open) }))) : null
    ];
  }

  G.setObjective = setObjective;
  G.toast = toast;
  G.showPanel = showPanel;
  G.hidePanel = hidePanel;
  G.btn = btn;
  G.sharonSay = sharonSay;
  G.sharonGloss = sharonGloss;
  G.detectorQuestion = detectorQuestion;
  G.beatNodes = beatNodes;
  return function initUi() {
    /* ── 상태 ── */
    G.state = 'menu';         /* menu | detector | explore | caption | event | gates | end | free */
    G.step = 0;               /* 지금 찾는 부품과 이어질 말씀 조각 (0~2) */
    G.camYaw = Math.PI, G.camPitchH = 1.45, G.camDist = 7.4, G.lastDrag = -9, G.now = 0;
    G.camPos = new G.T.Vector3(), G.camLook = new G.T.Vector3(), G.camLookT = new G.T.Vector3();
    G.stick = { x: 0, y: 0, id: null, bx: 0, by: 0 }, G.drag = { id: null, x: 0 }, G.keys = {};
    G.trail = [], G.mosesWalking = false, G.mosesArrived = false, G.lastToast = -9, G.evIdx = 2, G.pspeed = 0;
    G.baseFov = 62, G.viewShift = 0;

    /* ── 화면 위 UI ── */
    G.place_ = G.el('span', { class: 'place', text: G.SC.place });
    objText = G.el('span', { text: '' });
    G.count = G.el('span', { class: 'count', text: '말씀 조각 0 / 3' });
    G.partCount = G.el('span', { class: 'count teal', text: '부품 0 / 3' });
    G.trackArrow = G.el('i', {}, G.icon('arrow')), G.trackText = G.el('span', { text: '' });
    G.track = G.el('div', { class: 'track3', hidden: '' }, G.trackArrow, G.trackText);
    G.hudRef = G.refChip(G.SC.ref, true), G.clueCount = G.el('span', { class: 'count teal', hidden: '', text: '단서 0 / 5' });
    G.flockHelp = btn('어떻게 하나요?', G.showFlockHelp, 'flock-help');
    G.flockHelp.hidden = true;
    G.hud = G.el('div', { class: 'hud3 pad', hidden: '' },
      G.el('div', { class: 'row' }, G.place_, G.hudRef),
      G.el('div', { class: 'row' }, G.count, G.partCount, G.clueCount),
      G.el('div', { class: 'obj' }, G.icon('compass'), objText), G.flockHelp, G.track);
    G.knob = G.el('i', {}), G.base = G.el('div', { class: 'stick', hidden: '' }, G.knob);
    G.hint = G.el('div', { class: 'hint', hidden: '' }, '왼쪽 아래를 누른 채 밀면 걸어요. 오른쪽을 밀면 둘러봐요. 사진기 버튼으로 본 것을 찍어 도감에 담아요.');
    toastEl = G.el('div', { class: 'toast3', hidden: '' });
    panelBody = G.el('div', { class: 'sheet-body pad' }), panelFoot = G.el('div', { class: 'sheet-foot pad' });
    panel = G.el('div', { class: 'panel3 sheet', hidden: '' }, panelBody, panelFoot);
    G.overlay = G.el('div', { class: 'overlay3', hidden: '' });
    G.touch = G.el('div', { class: 'touch3' });
    G.snd = G.el('button', { class: 'snd3', hidden: '', 'aria-label': '소리 끄기', 'aria-pressed': 'false', on: { click: function () {
      G.setMuted(!G.FX.audio.isMuted()); G.checkpoint();
    } } }, G.icon('speaker'));
    G.dexLabel = G.el('span', { text: '도감 0 / 5' });
    G.dexBtn = G.el('button', { class: 'dex3', hidden: '', on: { click: function () { if (G.cur === 'jordan') G.openClues(); else G.openDex(); } } }, G.icon('journal'), G.dexLabel);
    G.camBtn = G.el('button', { class: 'cam3', hidden: '', 'aria-label': '사진 찍기', on: { click: function () { G.wantShot = true; } } }, G.icon('camera'));
    G.flash = G.el('div', { class: 'flash3', hidden: '' });
    G.denBtn = G.el('button', { class: 'den3', hidden: '', on: { click: function () { G.openDen(); } } }, '타임머신에 타기');
    G.dedBtn = G.el('button', { class: 'den3', hidden: '', on: { click: function () { G.startDeduce(); } } }, '추리하기');
    G.add(G.ui, [G.touch, G.hud, G.base, G.hint, toastEl, G.dexBtn, G.camBtn, G.denBtn, G.dedBtn, G.snd, G.flash, panel, G.overlay]);
    hideLoading();
  };
};
