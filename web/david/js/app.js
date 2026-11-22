/* 바이블 온유 · 다윗 탐험 실행 엔진 (독립 실행형, 저장 키: bibleOnyou.david.v1) */
(function () {
  'use strict';

  var STORAGE_KEY = 'bibleOnyou.david.v1';
  var DATA = window.BO_DAVID.data;
  var ART = window.BO_DAVID.art;
  var root = document.getElementById('app');

  function defaultState() {
    return {
      view: 'home',       /* home | scene | detour | journal */
      sceneId: null,
      step: 'choose',     /* choose | stones | order | hebron2 | ark2 | done */
      detourId: null,
      stonesFound: [],
      orderList: [],
      orderPick: null,
      orderMsg: '',
      hebronFirstDone: false,
      journal: {}         /* sceneId -> { id, title, ref, discovery, extra? } */
    };
  }

  function loadState() {
    var base = defaultState();
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return base;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return base;
      if (['home', 'scene', 'detour', 'journal'].indexOf(parsed.view) !== -1) base.view = parsed.view;
      if (typeof parsed.sceneId === 'string') base.sceneId = parsed.sceneId;
      if (['choose', 'stones', 'order', 'hebron2', 'ark2', 'done'].indexOf(parsed.step) !== -1) base.step = parsed.step;
      if (typeof parsed.detourId === 'string') base.detourId = parsed.detourId;
      if (Array.isArray(parsed.stonesFound)) {
        base.stonesFound = parsed.stonesFound.filter(function (v, i, a) { return typeof v === 'number' && a.indexOf(v) === i; });
      }
      if (Array.isArray(parsed.orderList)) base.orderList = parsed.orderList.slice();
      base.hebronFirstDone = !!parsed.hebronFirstDone;
      if (parsed.journal && typeof parsed.journal === 'object') base.journal = parsed.journal;
      if ((base.view === 'scene' || base.view === 'detour') && !getScene(base.sceneId)) {
        base.view = 'home';
        base.sceneId = null;
      }
      if (base.view === 'detour' && !DATA.supplements[base.detourId]) {
        base.view = 'scene';
        base.detourId = null;
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
        stonesFound: state.stonesFound,
        orderList: state.orderList,
        hebronFirstDone: state.hebronFirstDone,
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

  function recordDiscovery(scene, extra) {
    if (state.journal[scene.id]) {
      /* 이미 기록된 장면은 중복 저장하지 않는다. */
      if (extra && !state.journal[scene.id].extra) state.journal[scene.id].extra = extra;
      saveState();
      return;
    }
    state.journal[scene.id] = {
      id: scene.id,
      title: scene.title,
      ref: scene.journalRef || scene.ref,
      place: scene.place || '',
      discovery: scene.discovery,
      extra: extra || null
    };
    saveState();
  }

  function openScene(sceneId) {
    var sc = getScene(sceneId);
    if (!sc) return;
    state.view = 'scene';
    state.sceneId = sc.id;
    state.step = 'choose';
    state.detourId = null;
    state.stonesFound = [];
    state.orderList = sc.orderItems ? sc.orderItems.map(function (o) { return o.id; }).reverse() : [];
    state.orderPick = null;
    state.orderMsg = '';
    state.hebronFirstDone = false;
    saveState();
    render();
  }

  function openDetour(detourId) {
    state.view = 'detour';
    state.detourId = detourId;
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

  function renderHome() {
    var doneCount = journalCount();
    var total = DATA.scenes.length;
    var cards = DATA.scenes.map(function (sc) {
      var done = !!state.journal[sc.id];
      return el('button', {
        class: 'scene-card' + (done ? ' done' : ''),
        'data-scene': sc.id,
        on: { click: function () { openScene(sc.id); } }
      },
        el('div', { class: 'scene-badge', text: done ? '완료' : sc.id }),
        el('div', { class: 'scene-info' },
          el('div', { class: 'scene-name', text: sc.title }),
          el('div', { class: 'scene-meta' },
            el('span', { class: 'ref', text: sc.ref }),
            sc.place ? el('span', { class: 'tag', text: sc.place }) : null,
            done ? el('span', { class: 'scene-state', text: '일지에 기록됨' }) : null
          )
        )
      );
    });

    root.replaceChildren(
      renderTopbar('다윗의 일곱 관찰', null,
        el('button', { class: 'topbtn brass', 'data-action': 'journal', on: { click: openJournal } }, '탐험 일지 ' + doneCount + '/' + total)
      ),
      el('main', { class: 'home-body' },
        el('section', { class: 'hero' },
          el('div', { class: 'hero-kicker', text: '8~10세 성경 탐험' }),
          el('h1', { text: '다윗의 발자취를 살펴보자' }),
          el('p', { text: '장면을 골라 단서를 만지고, 성경 장절을 확인해 탐험 일지에 남겨 보세요.' }),
          el('div', { class: 'progress-row' },
            el('span', { class: 'progress-pill', text: '발견 기록 ' + doneCount + ' / ' + total })
          )
        ),
        el('div', { class: 'scene-list' }, cards)
      )
    );
  }

  function handleChoice(sc, choice) {
    if (choice.detour) {
      openDetour(choice.detour);
      return;
    }
    if (!choice.ok) return;
    if (sc.mode === 'stones') {
      state.step = 'stones';
      saveState();
      render();
    } else if (sc.mode === 'order') {
      state.step = 'order';
      if (!state.orderList.length && sc.orderItems) {
        state.orderList = sc.orderItems.map(function (o) { return o.id; }).reverse();
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
    } else {
      recordDiscovery(sc);
      state.step = 'done';
      saveState();
      render();
    }
  }

  function renderChooseStep(sc) {
    var choiceNodes = sc.choices.map(function (ch) {
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
        sc.place ? el('span', { class: 'tag', text: '장소: ' + sc.place }) : null
      ),
      el('h2', { class: 'question', text: sc.question }),
      el('div', { class: 'choices' }, choiceNodes)
    ];
  }

  function renderStonesStep(sc) {
    var count = state.stonesFound.length;
    var btns = [1, 2, 3, 4, 5].map(function (num) {
      var picked = state.stonesFound.indexOf(num) !== -1;
      return el('button', {
        class: 'stone-btn' + (picked ? ' picked' : ''),
        'data-stone': String(num),
        'aria-pressed': String(picked),
        on: { click: function () {
          if (state.stonesFound.indexOf(num) === -1) {
            state.stonesFound.push(num);
            if (state.stonesFound.length >= 5) {
              recordDiscovery(sc);
              state.step = 'done';
            }
            saveState();
            render();
          }
        } }
      },
        el('span', { html: ART.icon('stone') }),
        el('span', { text: picked ? '돌 ' + num + ' ✓' : '돌 ' + num })
      );
    });
    return [
      el('div', { class: 'meta-row' },
        el('span', { class: 'ref', text: sc.ref }),
        el('span', { class: 'tag', text: '관찰한 돌 ' + count + ' / 5' })
      ),
      el('h2', { class: 'question', text: '시냇가의 매끄러운 돌 다섯을 하나씩 눌러 살펴보자.' }),
      el('p', { class: 'subnote', text: '같은 돌을 다시 눌러도 한 번만 세어져요.' }),
      el('div', { class: 'stones-grid' }, btns)
    ];
  }

  function renderOrderStep(sc) {
    var map = {};
    sc.orderItems.forEach(function (it) { map[it.id] = it; });
    var nodes = state.orderList.map(function (id, idx) {
      var it = map[id];
      var selected = state.orderPick === idx;
      return el('button', {
        class: 'order-card' + (selected ? ' selected' : ''),
        'data-order-id': it.id,
        'aria-pressed': String(selected),
        on: { click: function () {
          state.orderMsg = '';
          if (state.orderPick === null) {
            state.orderPick = idx;
          } else if (state.orderPick === idx) {
            state.orderPick = null;
          } else {
            var tmp = state.orderList[state.orderPick];
            state.orderList[state.orderPick] = state.orderList[idx];
            state.orderList[idx] = tmp;
            state.orderPick = null;
            saveState();
          }
          render();
        } }
      },
        el('div', { class: 'order-num', text: String(idx + 1) }),
        el('div', { class: 'order-info' },
          el('span', { class: 'order-title', text: it.label }),
          el('span', { class: 'order-hint', text: it.ref })
        )
      );
    });
    return [
      el('div', { class: 'meta-row' }, el('span', { class: 'ref', text: sc.ref })),
      el('h2', { class: 'question', text: '두 일을 먼저 일어난 순서대로 놓아 보자.' }),
      el('p', { class: 'subnote', text: '카드 두 개를 차례로 누르면 서로 자리가 바뀌어요.' }),
      el('div', { class: 'order-list' }, nodes),
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
              state.orderMsg = '두 카드를 눌러 순서를 바꿔 보자. 선물을 먼저 주고, 나중에 헤어졌어.';
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
        el('div', { class: 'discovery-text', text: '유다 사람들이 헤브론에 와서 먼저 다윗에게 기름을 부어 왕으로 세웠어.' })
      ),
      el('h2', { class: 'question', text: '그 뒤 헤브론에 와서 다윗을 온 이스라엘의 왕으로 세운 사람들은 누구였을까?' }),
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
          el('div', { class: 'choice-icon', html: ART.icon('crown') }),
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
    return [
      el('div', { class: 'meta-row' },
        el('span', { class: 'ref', text: sc.journalRef || sc.ref }),
        sc.place ? el('span', { class: 'tag', text: '장소: ' + sc.place }) : null
      ),
      el('section', { class: 'discovery-box', 'data-discovery': sc.id },
        el('div', { class: 'discovery-kicker', text: '탐험 일지에 기록했어요' }),
        el('p', { class: 'discovery-text', text: sc.discovery }),
        saved && saved.extra ? el('p', { class: 'discovery-note', text: saved.extra }) : null
      ),
      el('div', { class: 'actions' },
        el('button', { class: 'btn brass', 'data-action': 'open-journal', on: { click: openJournal } }, '탐험 일지 보기'),
        nextSc
          ? el('button', { class: 'btn', 'data-action': 'next-scene', on: { click: function () { openScene(nextSc.id); } } }, '다음 장면: ' + nextSc.title)
          : el('button', { class: 'btn plain', 'data-action': 'go-home', on: { click: goHome } }, '장면 목록으로')
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
            el('p', { class: 'detour-diff', text: sup.diff })
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
      return el('article', { class: 'journal-item', 'data-journal-id': sc.id },
        el('div', { class: 'journal-head' },
          el('h3', { class: 'journal-title', text: sc.id + ' · ' + rec.title }),
          el('span', { class: 'ref', text: rec.ref })
        ),
        rec.place ? el('div', { class: 'journal-sub', text: '장소: ' + rec.place }) : null,
        el('p', { class: 'journal-fact', text: rec.discovery }),
        rec.extra ? el('p', { class: 'journal-sub', text: rec.extra }) : null,
        el('button', {
          class: 'journal-open',
          'data-reopen': sc.id,
          on: { click: function () { openScene(sc.id); } }
        }, '이 장면 다시 보기')
      );
    });

    root.replaceChildren(
      renderTopbar('탐험 일지 (' + entries.length + ' / ' + DATA.scenes.length + ')',
        el('button', { class: 'topbtn', 'data-action': 'home', on: { click: goHome } }, '목록'),
        null
      ),
      el('main', { class: 'journal-body' },
        entries.length ? entries : el('div', { class: 'journal-empty', text: '아직 기록된 발견이 없어요. 장면을 골라 단서를 찾아보세요.' })
      )
    );
  }

  function render() {
    if (state.view === 'scene') renderScene();
    else if (state.view === 'detour') renderDetour();
    else if (state.view === 'journal') renderJournal();
    else renderHome();
  }

  window.BO_DAVID.debug = {
    state: function () { return JSON.parse(JSON.stringify(state)); },
    storageKey: STORAGE_KEY
  };

  render();
})();
