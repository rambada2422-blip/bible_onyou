/* 게임 상태와 화면 안내. game.js가 공유 상태 G를 전달하고 초기화 순서를 정한다. */
BO3D.gameModules = BO3D.gameModules || {};
BO3D.gameModules.ui = function (G) {
  'use strict';
  var objText, toastEl, panelBody, panelFoot, panel;

  G.showWebGLNotice = function () {
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
    G.base.hidden = true; G.stick.x = G.stick.y = 0; G.stick.id = null;
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

  /* 물음과 보기 순서는 승인된 horeb 자료에서 읽는다. */
  function detectorQuestion(item, index, onReady) {
    var data = G.C3.horeb, sharon = G.C3.sharon, tier = G.S.tier, q = item.q[tier], solved = false;
    var split = q.prompt.search(/[.?] /);
    var speech = sharonSay('ask', split === -1 ? q.prompt : q.prompt.slice(0, split + 1));
    var continuation = split === -1 ? null : G.el('p', { class: 'q-prompt', text: q.prompt.slice(split + 2) });
    var noteBox = G.el('div', {});
    function answer() {
      showPanel([G.goodNote(item.okRef[tier])], btn('다음', function () {
        var found = sharon.found[index];
        showPanel([G.el('div', { class: 'q-kicker', text: '탐험대 이야기' }),
          sharonSay('joy', tier === 't1' && found.t1 ? found.t1 : found.text)], btn('계속 탐험하기', onReady));
      }));
    }
    var opts = q.options.map(function (option) {
      var b = G.el('button', { class: 'opt', on: { click: function () {
        if (solved) return;
        if (option.ok) { solved = true; answer(); }
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
    showPanel([
      G.el('div', { class: 'q-kicker', 'data-detector-quiz': String(index), text: sharon.kicker + ' ' + (index + 1) + ' / ' + data.quiz.length }),
      G.el('div', { class: 'narr-meta' }, tier === 't2' ? G.refChip(item.ref) : G.el('span', { text: data.bookHint[tier] })),
      speech, continuation, G.el('div', { class: 'opts' }, opts), noteBox
    ], []);
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
    G.hud = G.el('div', { class: 'hud3 pad', hidden: '' },
      G.el('div', { class: 'row' }, G.place_, G.hudRef),
      G.el('div', { class: 'row' }, G.count, G.partCount, G.clueCount),
      G.el('div', { class: 'obj' }, G.icon('compass'), objText), G.track);
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
  };
};
