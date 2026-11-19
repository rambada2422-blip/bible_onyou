/* 게임 상태와 화면 안내. game.js가 공유 상태 G를 전달하고 초기화 순서를 정한다. */
BO3D.gameModules = BO3D.gameModules || {};
BO3D.gameModules.ui = function (G) {
  'use strict';
  var objText, toastEl, panelBody, panelFoot, panel;


  function setObjective(t) { objText.textContent = t; }
  function toast(html, who) {
    toastEl.replaceChildren();
    if (who) { G.add(toastEl, [G.avatar(who), G.el('span', {}, G.el('b', { text: G.C.chars[who].name + ' ', style: 'color:' + G.C.chars[who].color }), html)]); }
    else G.add(toastEl, G.el('span', { text: html }));
    toastEl.hidden = false; toastEl.classList.remove('show'); void toastEl.offsetWidth; toastEl.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(function () { toastEl.hidden = true; }, 4200);
  }
  function hideToast() { clearTimeout(toast.t); toastEl.hidden = true; }
  function showPanel(kids_, foot) {
    panelBody.replaceChildren(); panelFoot.replaceChildren();
    G.add(panelBody, kids_); G.add(panelFoot, foot);
    panel.hidden = false; panelBody.scrollTop = 0;
    G.base.hidden = true; G.stick.x = G.stick.y = 0; G.stick.id = null;
  }
  function hidePanel() { panel.hidden = true; }
  function btn(label, fn, cls) { return G.el('button', { class: 'btn ' + (cls || 'onpaper'), on: { click: fn } }, label); }

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
  G.hideToast = hideToast;
  G.showPanel = showPanel;
  G.hidePanel = hidePanel;
  G.btn = btn;
  G.beatNodes = beatNodes;
  return function initUi() {
    /* ── 상태 ── */
    G.state = 'menu';         /* menu | explore | caption | event | gates | end | free */
    G.step = 0;               /* 0: 양 떼, 1: 산기슭 길목, 2: 언덕 아래 */
    G.quizReady = false;
    G.camYaw = Math.PI, G.camPitchH = 1.45, G.camDist = 7.4, G.lastDrag = -9, G.now = 0;
    G.camPos = new G.T.Vector3(), G.camLook = new G.T.Vector3(), G.camLookT = new G.T.Vector3();
    G.stick = { x: 0, y: 0, id: null, bx: 0, by: 0 }, G.drag = { id: null, x: 0 }, G.keys = {};
    G.trail = [], G.mosesWalking = false, G.mosesArrived = false, G.lastToast = -9, G.evIdx = 2, G.pspeed = 0;
    G.baseFov = 62, G.viewShift = 0;
    G.OBJ = (G.C3 && G.C3.horeb)
      ? G.C3.horeb.quiz.map(function (q) { return q.objective; })
      : ['양 떼에서 조금 떨어진 곳에서 부품을 찾아보자', '산기슭 길목에서 부품을 찾아보자', '떨기나무가 있는 언덕 아래에서 부품을 찾아보자'];

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
      var m = !G.FX.audio.isMuted(); G.FX.audio.mute(m); G.snd.setAttribute('aria-pressed', String(m)); G.snd.setAttribute('aria-label', m ? '소리 켜기' : '소리 끄기');
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
