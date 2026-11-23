/* 바이블 온유 · 다윗 탐험 실행 엔진 (독립 실행형, 저장 키: bibleOnyou.david.v1)
 * D01~D09 및 다윗 놀이 1~5 (시냇가 돌밭 관찰 창, 겉옷의 두 장면 수첩 펼침면, 왕의 식탁 수첩 탐색 지도, 단서 그림 기록과 다시 놀기, 시작 화면 체험 한 판 바로 시작)
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'bibleOnyou.david.v1';
  var DATA = window.BO_DAVID.data;
  var ART = window.BO_DAVID.art;
  var root = document.getElementById('app');

  /* 놀이 1(D02): 판마다 달라지는 시냇가 돌밭 돌(1~5)과 잔자갈(P1~P3) 배치 3종 */
  var BROOK_LAYOUTS = [
    ['s1', 'p1', 's2', 's3', 'p2', 's4', 'p3', 's5'],
    ['p1', 's3', 's1', 'p2', 's5', 's2', 's4', 'p3'],
    ['s4', 's1', 'p2', 's5', 'p1', 's3', 'p3', 's2']
  ];

  /* A01(D01): 『탐험대 이야기』 목자의 물건 찾기 — 인물·물건 두 관찰 지점 */
  var D01_SPOTS = [
    {
      id: 'shepherd',
      kind: '인물 단서',
      coverLabel: '베들레헴 들판 덮개',
      title: '양을 치던 다윗',
      ref: '삼상 16:11',
      detail: '들판에서 양을 치던 막내아들 다윗이 불려 왔어.',
      zoomArt: 'd01-shepherd',
      icon: 'person'
    },
    {
      id: 'horn',
      kind: '물건 단서',
      coverLabel: '사무엘의 물건 덮개',
      title: '기름이 든 뿔',
      ref: '삼상 16:13',
      detail: '사무엘이 기름이 든 뿔을 가져와 다윗에게 기름을 부었어.',
      zoomArt: 'd01-horn',
      icon: 'horn'
    }
  ];

  /* A02(D01): 다시 놀기마다 달라지는 단서 자리 배치 4종 */
  var D01_LAYOUTS = [
    { order: ['shepherd', 'horn'], dir: 'row', label: '기본 가로 배치' },
    { order: ['horn', 'shepherd'], dir: 'row', label: '좌우 자리 바꿈' },
    { order: ['shepherd', 'horn'], dir: 'col', label: '위아래 세로 배치' },
    { order: ['horn', 'shepherd'], dir: 'col', label: '위아래 자리 바꿈' }
  ];

  function getD01Layout(seed) {
    return D01_LAYOUTS[Math.abs(seed || 0) % D01_LAYOUTS.length];
  }

  function defaultState() {
    return {
      view: 'home',       /* home | scene | detour | journal | guardian */
      sceneId: null,
      step: 'choose',     /* choose | stones | order | hebron2 | ark2 | done */
      detourId: null,
      d01Opened: [],      /* A01(D01): 열어 본 덮개 ['shepherd', 'horn'] */
      d01ZoomId: null,    /* A01(D01): 현재 확대 중인 관찰 지점 */
      d01FirstCover: null,/* A01(D01): 이번 판에 먼저 연 덮개 */
      d01PickedClue: null,/* A01(D01): 일지로 가져간 단서 */
      d01FirstRecord: null,/* A02(D01): 처음 완주한 판의 일지 기록(다시 놀기에도 보존) */
      d01LastSlot: null,  /* A02(D01): 이번 판에 고른 자리 정보 { seed, slotIdx, clueId, clueTitle } */
      d01ShowFirstArt: false, /* A02(D01): 처음 본 그림 다시 보기 펼침 여부 */
      d01History: [],     /* A02(D01): 판별 선택 자리 기록 */
      stonesFound: [],
      brookSpots: [],     /* 현재 판의 시냇가 돌밭 배치 (s1~s5, p1~p3) */
      brookOpened: [],    /* 열어 본 돌밭 칸 인덱스 */
      lastSpotIdx: null,  /* 방금 살펴본 돌밭 관찰 창 위치 */
      orderList: [],
      orderPick: null,
      orderMsg: '',
      hebronFirstDone: false,
      tableFolds: [],     /* 놀이 3(D07): 펼친 수첩 날개 ['son', 'table'] */
      detoursVisited: [], /* 부모·교사 화면용: 거쳐 온 다른 단서 기록 (sceneId:detourId) */
      seeds: {},          /* 놀이 4: 장면별 다시 놀기 배치 번호 */
      telemetry: {        /* 놀이 5: 첫 선택 및 다시 놀기 기록 */
        firstAction: null,
        replayCount: 0
      },
      journal: {}         /* sceneId -> { id, title, ref, discovery, clueIcon, extra? } */
    };
  }

  function getSeed(st, sceneId) {
    return (st.seeds && typeof st.seeds[sceneId] === 'number') ? st.seeds[sceneId] : 0;
  }

  function makeBrookSpots(seed) {
    return BROOK_LAYOUTS[Math.abs(seed || 0) % BROOK_LAYOUTS.length].slice();
  }

  function makeInitialOrderList(sc, seed) {
    if (!sc || !sc.orderItems) return [];
    var ids = sc.orderItems.map(function (o) { return o.id; });
    /* 첫 판은 역순(['farewell','gift']), 다시 놀기에서는 시작 배치 경로가 달라진다 */
    return (seed % 2 === 1) ? ids.slice() : ids.slice().reverse();
  }

  function loadState() {
    var base = defaultState();
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return base;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return base;
      if (['home', 'scene', 'detour', 'journal', 'guardian'].indexOf(parsed.view) !== -1) base.view = parsed.view;
      if (typeof parsed.sceneId === 'string') base.sceneId = parsed.sceneId;
      if (['choose', 'stones', 'order', 'hebron2', 'ark2', 'done'].indexOf(parsed.step) !== -1) base.step = parsed.step;
      if (typeof parsed.detourId === 'string') base.detourId = parsed.detourId;
      if (Array.isArray(parsed.d01Opened)) {
        base.d01Opened = parsed.d01Opened.filter(function (v, i, a) { return (v === 'shepherd' || v === 'horn') && a.indexOf(v) === i; });
      }
      if (parsed.d01ZoomId === 'shepherd' || parsed.d01ZoomId === 'horn') base.d01ZoomId = parsed.d01ZoomId;
      if (parsed.d01FirstCover === 'shepherd' || parsed.d01FirstCover === 'horn') base.d01FirstCover = parsed.d01FirstCover;
      if (parsed.d01PickedClue === 'shepherd' || parsed.d01PickedClue === 'horn') base.d01PickedClue = parsed.d01PickedClue;
      if (parsed.d01FirstRecord && typeof parsed.d01FirstRecord === 'object') base.d01FirstRecord = parsed.d01FirstRecord;
      if (parsed.d01LastSlot && typeof parsed.d01LastSlot === 'object') base.d01LastSlot = parsed.d01LastSlot;
      base.d01ShowFirstArt = !!parsed.d01ShowFirstArt;
      if (Array.isArray(parsed.d01History)) base.d01History = parsed.d01History.slice(-10);
      if (Array.isArray(parsed.stonesFound)) {
        base.stonesFound = parsed.stonesFound.filter(function (v, i, a) { return typeof v === 'number' && a.indexOf(v) === i; });
      }
      if (Array.isArray(parsed.brookSpots) && parsed.brookSpots.length === 8) {
        base.brookSpots = parsed.brookSpots.slice();
      }
      if (Array.isArray(parsed.brookOpened)) {
        base.brookOpened = parsed.brookOpened.filter(function (v, i, a) { return typeof v === 'number' && a.indexOf(v) === i; });
      }
      if (typeof parsed.lastSpotIdx === 'number') base.lastSpotIdx = parsed.lastSpotIdx;
      if (Array.isArray(parsed.orderList)) base.orderList = parsed.orderList.slice();
      base.hebronFirstDone = !!parsed.hebronFirstDone;
      if (Array.isArray(parsed.tableFolds)) {
        base.tableFolds = parsed.tableFolds.filter(function (v, i, a) { return (v === 'son' || v === 'table') && a.indexOf(v) === i; });
      }
      if (Array.isArray(parsed.detoursVisited)) {
        base.detoursVisited = parsed.detoursVisited.filter(function (v, i, a) { return typeof v === 'string' && a.indexOf(v) === i; });
      }
      if (parsed.seeds && typeof parsed.seeds === 'object') base.seeds = parsed.seeds;
      if (parsed.telemetry && typeof parsed.telemetry === 'object') {
        base.telemetry.firstAction = parsed.telemetry.firstAction || null;
        base.telemetry.replayCount = Number(parsed.telemetry.replayCount || 0);
      }
      if (parsed.journal && typeof parsed.journal === 'object') base.journal = parsed.journal;
      if ((base.view === 'scene' || base.view === 'detour') && !getScene(base.sceneId)) {
        base.view = 'home';
        base.sceneId = null;
      }
      if (base.view === 'detour' && !DATA.supplements[base.detourId]) {
        base.view = 'scene';
        base.detourId = null;
      }
      if (base.sceneId === 'D02' && base.brookSpots.length !== 8) {
        base.brookSpots = makeBrookSpots(getSeed(base, 'D02'));
      }
    } catch (e) { /* 저장이 깨져 있어도 기본 상태로 연다 */ }
    return base;
  }

  var state = loadState();

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        view: state.view,
        sceneId: state.sceneId,
        step: state.step,
        detourId: state.detourId,
        d01Opened: state.d01Opened,
        d01ZoomId: state.d01ZoomId,
        d01FirstCover: state.d01FirstCover,
        d01PickedClue: state.d01PickedClue,
        d01FirstRecord: state.d01FirstRecord,
        d01LastSlot: state.d01LastSlot,
        d01ShowFirstArt: state.d01ShowFirstArt,
        d01History: state.d01History,
        stonesFound: state.stonesFound,
        brookSpots: state.brookSpots,
        brookOpened: state.brookOpened,
        lastSpotIdx: state.lastSpotIdx,
        orderList: state.orderList,
        hebronFirstDone: state.hebronFirstDone,
        tableFolds: state.tableFolds,
        detoursVisited: state.detoursVisited,
        seeds: state.seeds,
        telemetry: state.telemetry,
        journal: state.journal
      }));
    } catch (e) { /* 저장 불가 환경 무시 */ }
  }

  function getScene(id) {
    for (var i = 0; i < DATA.scenes.length; i++) {
      if (DATA.scenes[i].id === id) return DATA.scenes[i];
    }
    return null;
  }

  function sceneClueIcon(scene) {
    if (!scene || !scene.choices) return 'stone';
    for (var i = 0; i < scene.choices.length; i++) {
      if (scene.choices[i].ok && scene.choices[i].icon) return scene.choices[i].icon;
    }
    return 'stone';
  }

  function el(tag, attrs) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'text') node.textContent = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'on') {
          Object.keys(v).forEach(function (ev) { node.addEventListener(ev, v[ev]); });
        } else {
          node.setAttribute(k, v === true ? '' : String(v));
        }
      });
    }
    for (var i = 2; i < arguments.length; i++) {
      var child = arguments[i];
      if (child === null || child === undefined || child === false) continue;
      if (Array.isArray(child)) {
        child.forEach(function (c) { if (c) node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
      } else {
        node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
      }
    }
    return node;
  }

  function journalCount() {
    return Object.keys(state.journal).length;
  }

  function recordFirstAction(tag) {
    if (!state.telemetry.firstAction) {
      state.telemetry.firstAction = tag;
    }
  }

  function recordDiscovery(scene, extra) {
    var icon = sceneClueIcon(scene);
    if (state.journal[scene.id]) {
      /* 이미 기록된 장면은 중복 추가하지 않고 최신 문구와 단서 그림만 유지한다. */
      state.journal[scene.id].title = scene.title;
      state.journal[scene.id].ref = scene.journalRef || scene.ref;
      state.journal[scene.id].place = scene.place || '';
      state.journal[scene.id].discovery = scene.discovery;
      state.journal[scene.id].clueIcon = icon;
      if (extra) state.journal[scene.id].extra = extra;
      saveState();
      return;
    }
    state.journal[scene.id] = {
      id: scene.id,
      title: scene.title,
      ref: scene.journalRef || scene.ref,
      place: scene.place || '',
      discovery: scene.discovery,
      clueIcon: icon,
      extra: extra || null
    };
    saveState();
  }

  function openScene(sceneId, isReplay) {
    var sc = getScene(sceneId);
    if (!sc) return;
    if (isReplay) {
      state.seeds[sc.id] = getSeed(state, sc.id) + 1;
      state.telemetry.replayCount = (state.telemetry.replayCount || 0) + 1;
    }
    var seed = getSeed(state, sc.id);
    state.view = 'scene';
    state.sceneId = sc.id;
    state.step = 'choose';
    state.detourId = null;
    state.d01Opened = [];
    state.d01ZoomId = null;
    state.d01FirstCover = null;
    state.d01PickedClue = null;
    state.stonesFound = [];
    state.brookSpots = makeBrookSpots(seed);
    state.brookOpened = [];
    state.lastSpotIdx = null;
    state.orderList = makeInitialOrderList(sc, seed);
    state.orderPick = null;
    state.orderMsg = '';
    state.hebronFirstDone = false;
    state.tableFolds = [];
    saveState();
    render();
  }

  function replayCurrentScene() {
    if (!state.sceneId) return;
    var sc = getScene(state.sceneId);
    if (!sc) return;
    state.seeds[sc.id] = getSeed(state, sc.id) + 1;
    state.telemetry.replayCount = (state.telemetry.replayCount || 0) + 1;
    var seed = getSeed(state, sc.id);
    state.detourId = null;
    state.d01Opened = [];
    state.d01ZoomId = null;
    state.d01FirstCover = null;
    state.d01PickedClue = null;
    state.stonesFound = [];
    state.brookSpots = makeBrookSpots(seed);
    state.brookOpened = [];
    state.lastSpotIdx = null;
    state.orderList = makeInitialOrderList(sc, seed);
    state.orderPick = null;
    state.orderMsg = '';
    state.hebronFirstDone = false;
    state.tableFolds = [];
    /* 다시 놀기에서는 해당 장면의 핵심 수첩 놀이로 바로 들어가 다른 배치를 체험하게 한다 */
    if (sc.mode === 'stones') state.step = 'stones';
    else if (sc.mode === 'order') state.step = 'order';
    else state.step = 'choose';
    saveState();
    render();
  }

  function startQuickTrial() {
    recordFirstAction('quick-trial:D02');
    openScene('D02', false);
    state.step = 'stones';
    saveState();
    render();
  }

  function openDetour(detourId) {
    state.view = 'detour';
    state.detourId = detourId;
    if (state.sceneId && detourId) {
      var key = state.sceneId + ':' + detourId;
      if (state.detoursVisited.indexOf(key) === -1) state.detoursVisited.push(key);
    }
    saveState();
    render();
  }

  function openGuardian() {
    state.view = 'guardian';
    saveState();
    render();
  }

  function returnFromDetour() {
    state.view = 'scene';
    state.detourId = null;
    saveState();
    render();
  }

  function openJournal() {
    state.view = 'journal';
    saveState();
    render();
  }

  function goHome() {
    state.view = 'home';
    state.detourId = null;
    saveState();
    render();
  }

  function renderTopbar(title, leftBtn, rightBtn) {
    return el('header', { class: 'topbar' },
      leftBtn || null,
      el('div', { class: 'topbar-title', text: title }),
      rightBtn || null
    );
  }

  function renderSceneCard(sc) {
    var done = !!state.journal[sc.id];
    var rec = state.journal[sc.id];
    return el('button', {
      class: 'scene-card' + (done ? ' done' : ''),
      'data-scene': sc.id,
      on: { click: function () { recordFirstAction('scene:' + sc.id); openScene(sc.id, false); } }
    },
      el('div', { class: 'scene-badge', text: done ? '완료' : sc.id }),
      el('div', { class: 'scene-info' },
        el('div', { class: 'scene-name', text: sc.title }),
        el('div', { class: 'scene-meta' },
          el('span', { class: 'ref', text: sc.ref }),
          sc.place ? el('span', { class: 'tag', text: sc.place }) : null,
          done ? el('span', { class: 'scene-state', text: '일지에 기록됨' }) : null
        )
      ),
      done && rec && rec.clueIcon ? el('div', { class: 'scene-clue-mini', html: ART.icon(rec.clueIcon) }) : null
    );
  }

  function renderHome() {
    var doneCount = journalCount();
    var total = DATA.scenes.length;
    var mainScenes = DATA.scenes.filter(function (sc) { return sc.group !== 'extra'; });
    var extraScenes = DATA.scenes.filter(function (sc) { return sc.group === 'extra'; });

    root.replaceChildren(
      renderTopbar('다윗의 일곱 관찰', null,
        el('button', { class: 'topbtn brass', 'data-action': 'journal', on: { click: openJournal } }, '탐험 일지 ' + doneCount + '/' + total)
      ),
      el('main', { class: 'home-body' },
        el('section', { class: 'hero' },
          el('div', { class: 'hero-kicker', text: '8~10세 성경 탐험' }),
          el('h1', { text: '다윗의 발자취를 살펴보자' }),
          el('p', { text: '장면을 골라 단서를 살펴보고, 성경 장절을 확인해 탐험 일지에 남겨 보세요.' }),
          el('div', { class: 'progress-row' },
            el('span', { class: 'progress-pill', text: '발견 기록 ' + doneCount + ' / ' + total }),
            el('button', {
              class: 'trial-btn',
              'data-action': 'quick-trial',
              on: { click: startQuickTrial }
            }, '체험 한 판 바로 시작 (시냇가 돌밭 · 『탐험대 이야기』)')
          )
        ),
        el('div', { class: 'section-head', text: '다윗의 일곱 관찰 (D01~D07)' }),
        el('div', { class: 'scene-list' }, mainScenes.map(renderSceneCard)),
        extraScenes.length ? el('div', { class: 'section-head', text: '더 보기 · 추가 관찰 (D08~D09)' }) : null,
        extraScenes.length ? el('div', { class: 'scene-list' }, extraScenes.map(renderSceneCard)) : null,
        el('div', { class: 'guardian-bar' },
          el('button', {
            class: 'btn plain',
            'data-action': 'guardian-guide',
            on: { click: openGuardian }
          }, '부모·교사 동반 읽기 및 진도 안내')
        )
      )
    );
  }

  function handleChoice(sc, choice) {
    recordFirstAction(sc.id + ':choice:' + choice.id);
    if (choice.detour) {
      openDetour(choice.detour);
      return;
    }
    if (!choice.ok) return;
    if (sc.mode === 'stones') {
      state.step = 'stones';
      if (!state.brookSpots || state.brookSpots.length !== 8) {
        state.brookSpots = makeBrookSpots(getSeed(state, sc.id));
      }
      saveState();
      render();
    } else if (sc.mode === 'order') {
      state.step = 'order';
      if (!state.orderList.length && sc.orderItems) {
        state.orderList = makeInitialOrderList(sc, getSeed(state, sc.id));
      }
      saveState();
      render();
    } else if (sc.mode === 'hebron') {
      state.hebronFirstDone = true;
      state.step = 'hebron2';
      saveState();
      render();
    } else if (sc.mode === 'ark') {
      state.step = 'ark2';
      saveState();
      render();
    } else if (sc.id === 'D07') {
      state.tableFolds = ['son', 'table'];
      recordDiscovery(sc, '수첩 연결: 요나단의 아들 므비보셋(삼하 9:6–7) ↔ 왕의 식탁(삼하 9:10–13)');
      state.step = 'done';
      saveState();
      render();
    } else {
      recordDiscovery(sc);
      state.step = 'done';
      saveState();
      render();
    }
  }

  /* 놀이 3(D07): 접힌 수첩을 양방향으로 펼쳐 '요나단의 아들'과 '왕의 식탁' 두 단서를 연결 */
  function renderD07FoldMap(sc) {
    var seed = getSeed(state, 'D07');
    var folds = [
      {
        id: 'son',
        dir: (seed % 2 === 0) ? '서쪽 날개' : '북쪽 날개',
        title: '요나단의 아들',
        sub: '삼하 9:6–7 · 므비보셋',
        icon: 'person'
      },
      {
        id: 'table',
        dir: (seed % 2 === 0) ? '동쪽 날개' : '남쪽 날개',
        title: '왕의 식탁',
        sub: '삼하 9:10–13 · 늘 함께 먹음',
        icon: 'table'
      }
    ];
    if (seed % 2 === 1) folds.reverse();

    var foldNodes = folds.map(function (f) {
      var opened = state.tableFolds.indexOf(f.id) !== -1;
      return el('button', {
        class: 'fold-wing' + (opened ? ' opened' : ''),
        'data-fold': f.id,
        'aria-expanded': String(opened),
        on: {
          click: function () {
            recordFirstAction('D07:fold:' + f.id);
            if (state.tableFolds.indexOf(f.id) === -1) {
              state.tableFolds.push(f.id);
            }
            if (state.tableFolds.indexOf('son') !== -1 && state.tableFolds.indexOf('table') !== -1) {
              recordDiscovery(sc, '수첩 연결: ' + (state.tableFolds[0] === 'son' ? '요나단의 아들 → 왕의 식탁' : '왕의 식탁 → 요나단의 아들') + ' (삼하 9:6–13)');
              state.step = 'done';
            }
            saveState();
            render();
          }
        }
      },
        el('div', { class: 'fold-dir', text: f.dir + (opened ? ' · 펼쳐짐 ✓' : ' · 펼치기') }),
        el('div', { class: 'fold-main' },
          el('span', { class: 'fold-icon', html: ART.icon(f.icon) }),
          el('div', { class: 'fold-text' },
            el('span', { class: 'fold-title', text: f.title }),
            el('span', { class: 'fold-sub', text: opened ? f.sub : '눌러서 수첩 펼치기' })
          )
        )
      );
    });

    return el('section', { class: 'notebook-map', 'data-notebook-map': 'D07' },
      el('div', { class: 'one-line-guide', text: '『탐험대 이야기』 수첩의 두 날개를 어느 쪽부터든 펼쳐 두 단서를 이어 보자.' }),
      el('div', { class: 'fold-grid' }, foldNodes)
    );
  }

  /* A01(D01): 『탐험대 이야기』 목자의 물건 찾기 — 수첩 안 두 덮개 관찰 지점과 즉시 확대 창 */
  function getD01Spot(id) {
    for (var i = 0; i < D01_SPOTS.length; i++) {
      if (D01_SPOTS[i].id === id) return D01_SPOTS[i];
    }
    return null;
  }

  function renderD01Notebook(sc) {
    var seed = getSeed(state, 'D01');
    var layout = getD01Layout(seed);
    var spots = layout.order.map(getD01Spot);

    var coverNodes = spots.map(function (sp, idx) {
      var opened = state.d01Opened.indexOf(sp.id) !== -1;
      var active = state.d01ZoomId === sp.id;
      var slotLabel = layout.dir === 'col' ? (idx === 0 ? '위쪽 창' : '아래쪽 창') : (idx === 0 ? '왼쪽 창' : '오른쪽 창');
      return el('button', {
        class: 'd01-cover' + (opened ? ' opened' : '') + (active ? ' active' : ''),
        'data-d01-cover': sp.id,
        'data-d01-slot': String(idx),
        'aria-expanded': String(opened),
        'aria-pressed': String(active),
        on: {
          click: function () {
            recordFirstAction('D01:cover:' + sp.id);
            if (state.d01Opened.indexOf(sp.id) === -1) state.d01Opened.push(sp.id);
            if (!state.d01FirstCover) state.d01FirstCover = sp.id;
            state.d01ZoomId = sp.id;
            saveState();
            render();
          },
          keydown: function (ev) {
            if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight' || ev.key === 'ArrowUp' || ev.key === 'ArrowDown') {
              ev.preventDefault();
              var other = root.querySelector('[data-d01-slot="' + ((idx + 1) % 2) + '"]');
              if (other) other.focus();
            }
          }
        }
      },
        el('div', { class: 'd01-cover-top' },
          el('span', { class: 'd01-cover-kind', text: slotLabel + ' · ' + sp.kind }),
          el('span', { class: 'd01-cover-state', text: active ? '확대 중' : (opened ? '열림' : '덮개 열기') })
        ),
        el('div', { class: 'd01-cover-main' },
          el('span', { class: 'fold-icon', html: ART.icon(sp.icon) }),
          el('div', { class: 'fold-text' },
            el('span', { class: 'fold-title', text: opened ? sp.title : sp.coverLabel }),
            el('span', { class: 'fold-sub', text: opened ? (sp.ref + ' · 눌러서 크게 보기') : '눌러서 덮개 들기' })
          )
        )
      );
    });

    var activeSpot = state.d01ZoomId ? getD01Spot(state.d01ZoomId) : null;
    var activeSlotIdx = activeSpot ? layout.order.indexOf(activeSpot.id) : -1;
    var zoomPanel;
    if (activeSpot) {
      zoomPanel = el('div', { class: 'd01-zoom-panel', 'data-d01-zoom': activeSpot.id },
        el('div', { class: 'd01-zoom-head' },
          el('span', { class: 'tag', text: '확대 관찰 · ' + activeSpot.kind }),
          el('span', { class: 'ref', text: activeSpot.ref })
        ),
        el('div', { class: 'd01-zoom-art', html: ART.zoom(activeSpot.zoomArt) }),
        el('div', { class: 'd01-zoom-title', text: activeSpot.title }),
        el('p', { class: 'd01-zoom-detail', text: activeSpot.detail }),
        el('button', {
          class: 'btn brass d01-take-btn',
          'data-action': 'd01-bring-journal',
          'data-d01-pick': activeSpot.id,
          on: {
            click: function () {
              var firstSpot = getD01Spot(state.d01FirstCover) || activeSpot;
              state.d01PickedClue = activeSpot.id;
              if (!state.d01FirstRecord) {
                state.d01FirstRecord = {
                  clueId: activeSpot.id,
                  clueTitle: activeSpot.title,
                  firstCover: firstSpot.id,
                  zoomArt: activeSpot.zoomArt,
                  ref: activeSpot.ref,
                  seed: seed,
                  slotIdx: activeSlotIdx
                };
              }
              state.d01LastSlot = {
                seed: seed,
                layout: layout.label,
                slotIdx: activeSlotIdx,
                clueId: activeSpot.id,
                clueTitle: activeSpot.title,
                ref: activeSpot.ref
              };
              state.d01History.push(state.d01LastSlot);
              var extraMsg = state.d01FirstRecord && seed > 0
                ? ('처음 판 기록 보존: ' + state.d01FirstRecord.clueTitle + '(' + state.d01FirstRecord.ref + ') / 이번 판(' + layout.label + ' #' + (activeSlotIdx + 1) + '번 자리): ' + activeSpot.title)
                : ('『탐험대 이야기』 수첩 관찰: 먼저 연 덮개(' + firstSpot.kind + ') → 일지로 가져온 단서(' + activeSpot.title + ' · ' + activeSpot.ref + ')');
              recordDiscovery(sc, extraMsg);
              state.step = 'done';
              saveState();
              render();
            }
          }
        }, '\'' + activeSpot.title + '\' 단서를 일지로 가져오기')
      );
    } else {
      zoomPanel = el('div', { class: 'd01-zoom-empty', 'data-d01-zoom': 'none' },
        seed > 0
          ? ('단서 자리가 바뀌었어요(' + layout.label + '). 다시 펼칠 창을 골라 눌러 보세요.')
          : '덮개를 하나 들면 그 자리의 단서가 바로 확대돼요.'
      );
    }

    var firstRec = state.d01FirstRecord;
    var firstRecBlock = null;
    if (firstRec) {
      firstRecBlock = el('div', { class: 'd01-memory-bar', 'data-d01-memory': 'true' },
        el('div', { class: 'd01-memory-row' },
          el('span', { class: 'd01-memory-text', text: '전 판 일지 기록 보존: ' + firstRec.clueTitle + ' (' + firstRec.ref + ')' }),
          el('button', {
            class: 'd01-memory-btn',
            'data-action': 'd01-toggle-first-art',
            'aria-pressed': String(!!state.d01ShowFirstArt),
            on: {
              click: function () {
                state.d01ShowFirstArt = !state.d01ShowFirstArt;
                saveState();
                render();
              }
            }
          }, state.d01ShowFirstArt ? '처음 그림 접기' : '처음 본 그림 다시 보기')
        ),
        state.d01ShowFirstArt ? el('div', { class: 'd01-first-preview', 'data-d01-first-preview': 'true' },
          el('div', { class: 'd01-zoom-art', html: ART.zoom(firstRec.zoomArt) }),
          el('div', { class: 'd01-memory-cap', text: '처음 판에서 확인한 그림 · ' + firstRec.clueTitle + ' (' + firstRec.ref + ')' })
        ) : null
      );
    }

    return el('section', {
      class: 'notebook-map d01-board',
      'data-d01-board': 'true',
      'data-d01-seed': String(seed),
      'data-d01-layout': layout.dir + ':' + layout.order.join(',')
    },
      el('div', { class: 'one-line-guide', text: seed > 0
        ? ('『탐험대 이야기』 ' + layout.label + ' — 바뀐 자리에서 다시 펼칠 창을 골라 보자.')
        : '『탐험대 이야기』 수첩의 덮개 둘 중 어느 쪽부터든 열어 확대하고, 하나를 골라 일지로 가져가자.' }),
      firstRecBlock,
      el('div', { class: 'fold-grid d01-cover-grid dir-' + layout.dir }, coverNodes),
      zoomPanel
    );
  }

  function renderChooseStep(sc) {
    var seed = getSeed(state, sc.id);
    var list = sc.choices.slice();
    if (seed % 2 === 1) list.reverse();
    var choiceNodes = list.map(function (ch) {
      return el('button', {
        class: 'choice-card',
        'data-choice': ch.id,
        on: { click: function () { handleChoice(sc, ch); } }
      },
        el('div', { class: 'choice-icon', html: ART.icon(ch.icon) }),
        el('div', { class: 'choice-text' },
          el('span', { class: 'choice-label', text: ch.label }),
          ch.sub ? el('span', { class: 'choice-sub', text: ch.sub }) : null
        )
      );
    });
    return [
      el('div', { class: 'meta-row' },
        el('span', { class: 'ref', text: sc.step1Ref || sc.ref }),
        sc.place ? el('span', { class: 'tag', text: '장소: ' + sc.place }) : null,
        seed > 0 ? el('span', { class: 'tag', text: '다시 놀기 배치 #' + (seed + 1) }) : null
      ),
      sc.teamNote ? el('p', { class: 'team-note', 'data-team-note': sc.id, text: sc.teamNote }) : null,
      el('h2', { class: 'question', text: sc.question }),
      sc.artNote ? el('p', { class: 'subnote', text: sc.artNote }) : null,
      sc.id === 'D01' ? renderD01Notebook(sc) : null,
      sc.id === 'D07' ? renderD07FoldMap(sc) : null,
      el('div', { class: 'choices' }, choiceNodes)
    ];
  }

  /* 놀이 1(D02): 『탐험대 이야기』 시냇가 돌밭 관찰 창. 첫 입력은 반드시 매끄러운 돌 하나를 드러낸다. */
  function activateBrookSpot(sc, spotIdx) {
    if (!state.brookSpots || state.brookSpots.length !== 8) {
      state.brookSpots = makeBrookSpots(getSeed(state, sc.id));
    }
    var item = state.brookSpots[spotIdx];
    /* 첫 입력 보장: 아직 찾은 돌이 하나도 없을 때 잔자갈 칸을 처음 누르면 가장 가까운 돌과 자리를 바꿔 첫 입력이 항상 돌을 드러내게 한다 */
    if (state.stonesFound.length === 0 && state.brookOpened.length === 0 && item && item.charAt(0) === 'p') {
      for (var i = 0; i < state.brookSpots.length; i++) {
        if (state.brookSpots[i].charAt(0) === 's') {
          var tmp = state.brookSpots[spotIdx];
          state.brookSpots[spotIdx] = state.brookSpots[i];
          state.brookSpots[i] = tmp;
          item = state.brookSpots[spotIdx];
          break;
        }
      }
    }
    state.lastSpotIdx = spotIdx;
    if (state.brookOpened.indexOf(spotIdx) === -1) {
      state.brookOpened.push(spotIdx);
    }
    if (item && item.charAt(0) === 's') {
      var num = Number(item.slice(1));
      recordFirstAction('D02:stone:' + num);
      if (state.stonesFound.indexOf(num) === -1) {
        state.stonesFound.push(num);
        if (state.stonesFound.length >= 5) {
          recordDiscovery(sc, '『탐험대 이야기』 시냇가 돌밭 관찰 창에서 매끄러운 돌 다섯을 모두 확인함 (배치 #' + (getSeed(state, sc.id) + 1) + ')');
          state.step = 'done';
        }
      }
    } else {
      recordFirstAction('D02:pebble:' + spotIdx);
    }
    saveState();
    render();
  }

  function renderStonesStep(sc) {
    if (!state.brookSpots || state.brookSpots.length !== 8) {
      state.brookSpots = makeBrookSpots(getSeed(state, sc.id));
    }
    var count = state.stonesFound.length;
    var seed = getSeed(state, sc.id);
    var lensStatus = '시냇가 돌밭 칸을 골라 누르면 관찰 창으로 돌을 살펴볼 수 있어요.';
    if (typeof state.lastSpotIdx === 'number' && state.brookSpots[state.lastSpotIdx]) {
      var lastCode = state.brookSpots[state.lastSpotIdx];
      lensStatus = lastCode.charAt(0) === 's'
        ? ('관찰 창 #' + (state.lastSpotIdx + 1) + ': 시냇가 돌밭에서 매끄러운 돌 ' + lastCode.slice(1) + '번을 찾았어요!')
        : ('관찰 창 #' + (state.lastSpotIdx + 1) + ': 여기는 울퉁불퉁한 잔자갈이에요. 다른 돌밭 칸을 살펴보세요.');
    }

    var spotBtns = state.brookSpots.map(function (code, idx) {
      var isStone = code.charAt(0) === 's';
      var stoneNum = isStone ? Number(code.slice(1)) : null;
      var opened = isStone ? (state.stonesFound.indexOf(stoneNum) !== -1) : (state.brookOpened.indexOf(idx) !== -1);
      var attrs = {
        class: 'stone-btn brook-spot' + (opened ? (isStone ? ' picked' : ' pebble-opened') : ''),
        'data-spot': String(idx),
        'data-spot-kind': isStone ? 'stone' : 'pebble',
        'aria-pressed': String(opened),
        on: {
          click: function () { activateBrookSpot(sc, idx); },
          keydown: function (ev) {
            if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') {
              ev.preventDefault();
              var next = root.querySelector('[data-spot="' + ((idx + 1) % 8) + '"]');
              if (next) next.focus();
            } else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') {
              ev.preventDefault();
              var prev = root.querySelector('[data-spot="' + ((idx + 7) % 8) + '"]');
              if (prev) prev.focus();
            }
          }
        }
      };
      if (isStone) attrs['data-stone'] = String(stoneNum);

      /* 열어 보기 전에는 모든 칸이 '돌밭 1~8'로 보여 아이가 직접 위치를 골라 살펴보게 한다 */
      var labelText = !opened ? ('돌밭 ' + (idx + 1)) : (isStone ? ('돌 ' + stoneNum + ' ✓') : '잔자갈');
      var visualIcon = 'stone';

      return el('button', attrs,
        el('span', { class: 'spot-visual', html: ART.icon(visualIcon) }),
        el('span', { class: 'spot-label', text: labelText })
      );
    });

    return [
      el('div', { class: 'meta-row' },
        el('span', { class: 'ref', text: sc.ref }),
        el('span', { class: 'tag', text: '관찰한 돌 ' + count + ' / 5' }),
        el('span', { class: 'tag', text: '『탐험대 이야기』' }),
        seed > 0 ? el('span', { class: 'tag', text: '새 돌밭 배치 #' + (seed + 1) }) : null
      ),
      el('h2', { class: 'question', text: '시냇가 돌밭 관찰 창에서 매끄러운 돌 다섯을 찾아보자.' }),
      el('p', { class: 'subnote one-line-guide', text: lensStatus }),
      el('div', { class: 'stones-grid brook-window', 'data-brook-seed': String(seed) }, spotBtns)
    ];
  }

  /* 놀이 2(D03): 수첩 펼침면의 두 장면 조각. 터치/마우스 끌기, 두 번 탭, 한 번 탭 맞바꾸기, 키보드 집기·놓기 지원 */
  function swapOrderPieces(idxA, idxB) {
    if (idxA === idxB || idxA < 0 || idxB < 0 || idxA >= state.orderList.length || idxB >= state.orderList.length) return;
    var tmp = state.orderList[idxA];
    state.orderList[idxA] = state.orderList[idxB];
    state.orderList[idxB] = tmp;
    state.orderPick = null;
    state.orderMsg = '';
    saveState();
  }

  function renderOrderStep(sc) {
    var map = {};
    sc.orderItems.forEach(function (it) { map[it.id] = it; });
    var seed = getSeed(state, sc.id);
    var dragFromIdx = null;
    var pointerStartIdx = null;

    var nodes = state.orderList.map(function (id, idx) {
      var it = map[id];
      var selected = state.orderPick === idx;
      var edgeLabel = it.id === 'gift' ? '왼쪽 이음새 · 겉옷' : '오른쪽 이음새 · 작별';
      var iconKey = it.id === 'gift' ? 'robe' : 'person';

      return el('button', {
        class: 'order-card spread-piece' + (selected ? ' selected' : ''),
        'data-order-id': it.id,
        'data-slot-idx': String(idx),
        draggable: 'true',
        'aria-pressed': String(selected),
        on: {
          click: function () {
            recordFirstAction('D03:order-click:' + it.id);
            state.orderMsg = '';
            if (state.orderPick === null) {
              state.orderPick = idx;
            } else if (state.orderPick === idx) {
              state.orderPick = null;
            } else {
              swapOrderPieces(state.orderPick, idx);
            }
            render();
          },
          dblclick: function () {
            /* 두 번 탭(더블클릭)하면 다른 칸과 즉시 자리를 맞바꾼다 */
            recordFirstAction('D03:order-dblclick:' + it.id);
            swapOrderPieces(idx, (idx + 1) % state.orderList.length);
            render();
          },
          pointerdown: function () {
            pointerStartIdx = idx;
          },
          pointerup: function (ev) {
            if (pointerStartIdx !== null && typeof document.elementFromPoint === 'function') {
              var hit = document.elementFromPoint(ev.clientX, ev.clientY);
              var slotNode = hit && hit.closest ? hit.closest('[data-slot-idx]') : null;
              if (slotNode) {
                var targetIdx = Number(slotNode.getAttribute('data-slot-idx'));
                if (!isNaN(targetIdx) && targetIdx !== pointerStartIdx) {
                  swapOrderPieces(pointerStartIdx, targetIdx);
                  pointerStartIdx = null;
                  render();
                }
              }
            }
            pointerStartIdx = null;
          },
          keydown: function (ev) {
            if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp' || ev.key === 'ArrowRight' || ev.key === 'ArrowDown') {
              ev.preventDefault();
              var otherIdx = (idx + 1) % state.orderList.length;
              if (state.orderPick === idx) {
                swapOrderPieces(idx, otherIdx);
                render();
                var moved = root.querySelector('[data-slot-idx="' + otherIdx + '"]');
                if (moved) moved.focus();
              } else {
                var target = root.querySelector('[data-slot-idx="' + otherIdx + '"]');
                if (target) target.focus();
              }
            }
          },
          dragstart: function (ev) {
            dragFromIdx = idx;
            state.orderPick = idx;
            if (ev.dataTransfer) {
              ev.dataTransfer.effectAllowed = 'move';
              ev.dataTransfer.setData('text/plain', String(idx));
            }
          },
          dragover: function (ev) {
            ev.preventDefault();
          },
          drop: function (ev) {
            ev.preventDefault();
            var from = dragFromIdx;
            if (from === null && ev.dataTransfer) {
              from = Number(ev.dataTransfer.getData('text/plain'));
            }
            if (typeof from === 'number' && !isNaN(from) && from !== idx) {
              swapOrderPieces(from, idx);
              render();
            }
          }
        }
      },
        el('div', { class: 'spread-top' },
          el('div', { class: 'order-num', text: String(idx + 1) }),
          el('div', { class: 'piece-icon', html: ART.icon(iconKey) }),
          el('span', { class: 'seam-badge', text: edgeLabel })
        ),
        el('div', { class: 'order-info' },
          el('span', { class: 'order-title', text: it.label }),
          el('span', { class: 'order-hint', text: it.ref })
        )
      );
    });

    return [
      el('div', { class: 'meta-row' },
        el('span', { class: 'ref', text: sc.ref }),
        el('span', { class: 'tag', text: '『탐험대 이야기』' }),
        seed > 0 ? el('span', { class: 'tag', text: '수첩 펼침면 #' + (seed + 1) }) : null
      ),
      el('h2', { class: 'question', text: '수첩 펼침면에서 두 장면 조각을 순서대로 이어 붙여 보자.' }),
      el('p', { class: 'subnote one-line-guide', text: '조각을 끌거나 탭·두 번 탭·키보드 엔터로 자리를 바꿔 보세요.' }),
      el('div', { class: 'order-list notebook-spread', 'data-spread-seed': String(seed) }, nodes),
      state.orderMsg ? el('div', { class: 'order-msg', text: state.orderMsg }) : null,
      el('div', { class: 'actions' },
        el('button', {
          class: 'btn brass',
          'data-action': 'check-order',
          on: { click: function () {
            var expected = sc.orderItems.map(function (o) { return o.id; });
            var ok = expected.every(function (id, i) { return state.orderList[i] === id; });
            if (ok) {
              recordDiscovery(sc, sc.orderItems.map(function (o) { return o.label + ' (' + o.ref + ')'; }).join(' → '));
              state.step = 'done';
              state.orderMsg = '';
              saveState();
              render();
            } else {
              state.orderMsg = '조각을 집어 옮겨 보자. 선물을 먼저 주고(삼상 18:1–4), 나중에 헤어졌어(삼상 20:41–42).';
              render();
            }
          } }
        }, '순서 확인하기')
      )
    ];
  }

  function renderHebron2Step(sc) {
    return [
      el('div', { class: 'meta-row' },
        el('span', { class: 'ref', text: '삼하 2:4 · 첫 번째 만남 완료' }),
        el('span', { class: 'tag', text: '장소: 헤브론' })
      ),
      el('div', { class: 'discovery-box' },
        el('div', { class: 'discovery-kicker', text: '첫 번째 만남 (삼하 2:4 · 헤브론)' }),
        el('div', { class: 'discovery-text', text: '먼저 유다 사람들이 헤브론에 와서 다윗을 유다의 왕으로 세웠어.' })
      ),
      el('h2', { class: 'question', text: '그 뒤 헤브론에 와서 다윗을 이스라엘의 왕으로 세운 사람들은 누구였을까?' }),
      el('div', { class: 'choices' },
        el('button', {
          class: 'choice-card',
          'data-choice': 'israel-elders-next',
          on: { click: function () {
            recordDiscovery(sc, '첫 번째 만남: 유다 사람들(삼하 2:4 · 헤브론) / 나중 만남: 이스라엘의 장로들(삼하 5:1–5 · 헤브론)');
            state.step = 'done';
            saveState();
            render();
          } }
        },
          el('div', { class: 'choice-icon', html: ART.icon('horn') }),
          el('div', { class: 'choice-text' },
            el('span', { class: 'choice-label', text: '이스라엘의 장로들' }),
            el('span', { class: 'choice-sub', text: '삼하 5:1–5 · 헤브론의 나중 만남' })
          )
        )
      )
    ];
  }

  function renderArk2Step(sc) {
    return [
      el('div', { class: 'meta-row' },
        el('span', { class: 'ref', text: '삼하 6:17' }),
        el('span', { class: 'tag', text: '궤가 들어옴' })
      ),
      el('h2', { class: 'question', text: '궤가 다윗 성에 들어온 다음, 어디에 두었을까?' }),
      el('div', { class: 'choices' },
        el('button', {
          class: 'choice-card',
          'data-choice': 'david-tent',
          on: { click: function () {
            recordDiscovery(sc, '단서: 하나님의 궤 → 다윗이 마련한 장막 (삼하 6:17)');
            state.step = 'done';
            saveState();
            render();
          } }
        },
          el('div', { class: 'choice-icon', html: ART.icon('tent') }),
          el('div', { class: 'choice-text' },
            el('span', { class: 'choice-label', text: '다윗이 마련한 장막' }),
            el('span', { class: 'choice-sub', text: '삼하 6:17 · 궤를 둔 자리' })
          )
        )
      )
    ];
  }

  function renderDoneStep(sc) {
    var idx = DATA.scenes.indexOf(sc);
    var nextSc = idx >= 0 && idx + 1 < DATA.scenes.length ? DATA.scenes[idx + 1] : null;
    var saved = state.journal[sc.id];
    var clueIcon = (saved && saved.clueIcon) ? saved.clueIcon : sceneClueIcon(sc);
    return [
      el('div', { class: 'meta-row' },
        el('span', { class: 'ref', text: sc.journalRef || sc.ref }),
        sc.place ? el('span', { class: 'tag', text: '장소: ' + sc.place }) : null
      ),
      el('section', { class: 'discovery-box', 'data-discovery': sc.id },
        el('div', { class: 'discovery-head' },
          el('div', { class: 'discovery-clue-art', 'data-clue-icon': clueIcon, html: ART.icon(clueIcon) }),
          el('div', { class: 'discovery-kicker', text: '단서 그림을 탐험 일지에 기록했어요' })
        ),
        el('p', { class: 'discovery-text', text: sc.discovery }),
        saved && saved.extra ? el('p', { class: 'discovery-note', text: saved.extra }) : null
      ),
      el('div', { class: 'actions' },
        nextSc
          ? el('button', { class: 'btn brass', 'data-action': 'next-scene', on: { click: function () { openScene(nextSc.id, false); } } }, '다음 장면: ' + nextSc.title)
          : el('button', { class: 'btn brass', 'data-action': 'go-home', on: { click: goHome } }, '장면 목록으로'),
        el('button', { class: 'btn plain', 'data-action': 'replay-scene', on: { click: replayCurrentScene } }, '다른 배치로 다시 놀기'),
        el('button', { class: 'btn', 'data-action': 'open-journal', on: { click: openJournal } }, '탐험 일지 보기')
      )
    ];
  }

  function renderScene() {
    var sc = getScene(state.sceneId);
    if (!sc) { goHome(); return; }
    var body;
    if (state.step === 'stones') body = renderStonesStep(sc);
    else if (state.step === 'order') body = renderOrderStep(sc);
    else if (state.step === 'hebron2') body = renderHebron2Step(sc);
    else if (state.step === 'ark2') body = renderArk2Step(sc);
    else if (state.step === 'done') body = renderDoneStep(sc);
    else body = renderChooseStep(sc);

    root.replaceChildren(
      renderTopbar(sc.id + ' · ' + sc.title,
        el('button', { class: 'topbtn', 'data-action': 'home', on: { click: goHome } }, '목록'),
        el('button', { class: 'topbtn brass', 'data-action': 'journal', on: { click: openJournal } }, '일지 ' + journalCount())
      ),
      el('div', { class: 'play-layout' },
        el('div', { class: 'stage' },
          el('div', { html: ART.scene(sc.art) }),
          el('div', { class: 'stage-chips' },
            el('span', { class: 'ref', text: sc.ref }),
            sc.place ? el('span', { class: 'tag', text: sc.place }) : null
          )
        ),
        el('main', { class: 'sheet' }, body)
      )
    );
  }

  function renderDetour() {
    var sc = getScene(state.sceneId);
    var sup = DATA.supplements[state.detourId];
    if (!sc || !sup) { returnFromDetour(); return; }
    var diffText = (sup.diffByScene && sup.diffByScene[sc.id]) ? sup.diffByScene[sc.id] : sup.diff;

    root.replaceChildren(
      renderTopbar('다른 장면 · ' + sup.title,
        el('button', { class: 'topbtn', 'data-action': 'return', on: { click: returnFromDetour } }, '돌아가기'),
        null
      ),
      el('div', { class: 'play-layout' },
        el('div', { class: 'stage' },
          el('div', { html: ART.scene(sup.art) }),
          el('div', { class: 'stage-chips' },
            el('span', { class: 'ref warm', text: sup.ref }),
            el('span', { class: 'tag', text: sup.badge })
          )
        ),
        el('main', { class: 'sheet' },
          el('section', { class: 'detour-box', 'data-detour': sup.id },
            el('div', { class: 'detour-kicker', text: sup.badge + ' · ' + sup.ref }),
            el('p', { class: 'detour-fact', text: sup.fact }),
            el('p', { class: 'detour-diff', text: diffText })
          ),
          el('div', { class: 'detour-backref' },
            el('span', { text: '원래 보던 장면: ' + sc.title }),
            el('span', { class: 'ref', text: sc.step1Ref || sc.ref })
          ),
          el('div', { class: 'actions' },
            el('button', { class: 'btn brass', 'data-action': 'retry-choice', on: { click: returnFromDetour } }, '다시 찾아보기')
          )
        )
      )
    );
  }

  function renderJournal() {
    var entries = DATA.scenes.filter(function (sc) { return !!state.journal[sc.id]; }).map(function (sc) {
      var rec = state.journal[sc.id];
      var clueIcon = rec.clueIcon || sceneClueIcon(sc);
      return el('article', { class: 'journal-item', 'data-journal-id': sc.id },
        el('div', { class: 'journal-head' },
          el('div', { class: 'journal-title-row' },
            el('span', { class: 'journal-clue-icon', 'data-journal-clue': clueIcon, html: ART.icon(clueIcon) }),
            el('h3', { class: 'journal-title', text: sc.id + ' · ' + sc.title })
          ),
          el('span', { class: 'ref', text: sc.journalRef || rec.ref })
        ),
        sc.place ? el('div', { class: 'journal-sub', text: '장소: ' + sc.place }) : null,
        el('p', { class: 'journal-fact', text: sc.discovery }),
        rec.extra ? el('p', { class: 'journal-sub', text: rec.extra }) : null,
        el('button', {
          class: 'journal-open',
          'data-reopen': sc.id,
          on: { click: function () { openScene(sc.id, false); } }
        }, '이 장면 다시 보기')
      );
    });

    root.replaceChildren(
      renderTopbar('탐험 일지 (' + entries.length + ' / ' + DATA.scenes.length + ')',
        el('button', { class: 'topbtn', 'data-action': 'home', on: { click: goHome } }, '목록'),
        el('button', { class: 'topbtn', 'data-action': 'guardian-guide', on: { click: openGuardian } }, '부모·교사')
      ),
      el('main', { class: 'journal-body' },
        entries.length ? entries : el('div', { class: 'journal-empty', text: '아직 기록된 발견이 없어요. 장면을 골라 단서를 찾아보세요.' })
      )
    );
  }

  function renderGuardian() {
    var doneScenes = DATA.scenes.filter(function (sc) { return !!state.journal[sc.id]; });
    var foundRefs = doneScenes.map(function (sc) { return sc.id + ' ' + (sc.journalRef || sc.ref); });
    var detourLabels = (state.detoursVisited || []).map(function (pair) {
      var parts = pair.split(':');
      var sc = getScene(parts[0]);
      var sup = DATA.supplements[parts[1]];
      if (!sc || !sup) return pair;
      return sc.id + '(' + sc.title + ') → ' + sup.title + '(' + sup.ref + ') 확인 후 복귀';
    });

    var noteItems = DATA.scenes.map(function (sc) {
      var done = !!state.journal[sc.id];
      return el('article', { class: 'journal-item', 'data-guardian-scene': sc.id },
        el('div', { class: 'journal-head' },
          el('h3', { class: 'journal-title', text: sc.id + ' · ' + sc.title + (done ? ' (완료)' : ' (미완료)') }),
          el('span', { class: 'ref', text: sc.ref })
        ),
        el('div', { class: 'journal-sub', text: '나이 단계: ' + sc.tier + ' · 장소: ' + sc.place + ' · 감수: ' + sc.reviewState + (sc.reviewRequired ? ' (감수 필수)' : '') }),
        sc.id === 'D02'
          ? el('p', { class: 'journal-fact', text: '부모·교사 동반 읽기 안내: 게임은 시냇가에서 돌 다섯을 고르고 45절을 확인하는 데까지만 다룹니다. 아이가 성경책을 펼 때 이어지는 삼상 17:46–51은 부모·교사가 옆에서 함께 읽으며 설명해 주세요.' })
          : (sc.pastorNote ? el('p', { class: 'journal-fact', text: '부모·교사 참고: ' + sc.pastorNote }) : null)
      );
    });

    root.replaceChildren(
      renderTopbar('부모·교사 안내',
        el('button', { class: 'topbtn', 'data-action': 'home', on: { click: goHome } }, '목록'),
        el('button', { class: 'topbtn brass', 'data-action': 'journal', on: { click: openJournal } }, '일지 ' + doneScenes.length)
      ),
      el('main', { class: 'journal-body' },
        el('section', { class: 'discovery-box', 'data-guardian-summary': 'true' },
          el('div', { class: 'discovery-kicker', text: '8~10세 성경 찾기 · 부모·교사 동반 안내 (공통 규칙서 2·5절)' }),
          el('p', { class: 'discovery-text', text: '진도: ' + doneScenes.length + ' / ' + DATA.scenes.length + ' 장면 완료' }),
          el('p', { class: 'discovery-note', text: '찾은 구절: ' + (foundRefs.length ? foundRefs.join(', ') : '아직 없음') }),
          el('p', { class: 'discovery-note', text: '거쳐 온 다른 단서(어긋남 대조): ' + (detourLabels.length ? detourLabels.join(' / ') : '아직 없음') }),
          el('p', { class: 'discovery-note', text: '놀이 5 관찰 기록(기기 내 저장): 첫 선택 = ' + (state.telemetry.firstAction || '없음') + ' · 다시 놀기 횟수 = ' + (state.telemetry.replayCount || 0) + '회' })
        ),
        noteItems
      )
    );
  }

  function render() {
    if (state.view === 'scene') renderScene();
    else if (state.view === 'detour') renderDetour();
    else if (state.view === 'journal') renderJournal();
    else if (state.view === 'guardian') renderGuardian();
    else renderHome();
  }

  window.BO_DAVID.debug = {
    state: function () { return JSON.parse(JSON.stringify(state)); },
    storageKey: STORAGE_KEY,
    verifyData: function () {
      var issues = [];
      if (!DATA || !Array.isArray(DATA.scenes) || DATA.scenes.length !== 9) issues.push('scenes count !== 9');
      DATA.scenes.forEach(function (sc) {
        if (!sc.id || !sc.ref || !sc.tier || !sc.place || !sc.question || !sc.discovery) issues.push(sc.id + ': missing core field');
        if (!sc.teamNote || sc.teamNote.indexOf('『탐험대 이야기』') === -1) issues.push(sc.id + ': missing teamNote label');
        if (typeof sc.reviewRequired !== 'boolean' || !sc.reviewState) issues.push(sc.id + ': missing section 8 review metadata');
        (sc.choices || []).forEach(function (ch) {
          if (!ch.ref) issues.push(sc.id + '.' + ch.id + ': missing choice ref');
        });
      });
      return { ok: issues.length === 0, count: DATA.scenes.length, issues: issues };
    }
  };

  render();
})();
