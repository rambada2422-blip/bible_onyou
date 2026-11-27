/* 2D 시범판의 시작 화면, 시간표, 일지와 안내.
 * 데이터: content.js / 그림: art.js(tools/build.js가 만든다) / 작은 아이콘: icons.js
 * 원칙(docs/00_공통규칙서.md): 틀렸다는 표현을 쓰지 않는다. 모르면 성경책을 펴게 한다.
 */
(function () {
  'use strict';
  var app = BO.app2d, C = BO.content;
  var el = app.el, add = app.add, tx = app.tx, pic = app.pic, icon = app.icon;
  var show = app.show, tierInfo = app.tierInfo, warp = app.warp, save = app.save, fresh = app.fresh;
  var cardNode = app.cardNode;

  /* ════════════ 처음 화면 ════════════ */
  function markScene(hash) {
    try { history.replaceState(null, '', hash); } catch (_) { /* 주소를 쓸 수 없는 환경 */ }
  }
  function entrance() {
    markScene('#home');
    if (app.state.char && app.state.tier) renderHub(); else renderTitle();
  }
  app.openExodusTrail = function () {
    markScene('#exodus'); app.exodusTrail.open(entrance);
  };
  function openField(mountain,showShelf,entry) {
    markScene(mountain?'#sinai':'#wilderness');
    app.wilderness.open(entrance, function () {
      markScene('#exodus'); app.exodusTrail.open(entrance, false, true, mountain);
    }, showShelf === true, mountain,entry);
  }
  app.openWilderness = function (showShelf) { openField(false,showShelf); };
  app.openSinai = function () { openField(true,false); };
  app.openRedSea = function (coastEntry) {
    const revisit = coastEntry === true && app.state.redSea?.chapter > 0;
    const entry = coastEntry === 'walk' ? 1 : coastEntry === 'drum' ? 2 : 0;
    const sideTrip = Boolean(entry && app.state.redSea);
    if (!revisit && !sideTrip) markScene('#redsea');
    app.redSea.open(entrance, function () {
      markScene('#exodus'); app.exodusTrail.open(entrance, true);
    }, {coastEntry:coastEntry === true,revisit,entry,sideTrip});
  };
  function openPassoverFromHub() {
    if (!location.hash) { app.passover.open(renderHub); return; }
    markScene('#passover'); app.passover.open(entrance, '탐험 입구');
  }
  app.openPassoverRoom = function () {
    markScene('#passover');
    app.passover.open(entrance, '탐험 입구', false, true);
  };
  app.openPillars = function () {
    markScene('#pillar');
    if (app.state.char && app.state.tier) depart('EX-09'); else renderSetup();
  };
  function openPalace(from,entryChapter) {
    if (location.hash === '#passover') { from = 'room'; markScene('#palace'); }
    else if (entryChapter===undefined && ['#home','#pillar','#horeb','#palace-first','#palace-frogs'].includes(location.hash)) markScene('#palace');
    app.palace.open(from, function () {
      if (from === 'room') { markScene('#passover'); app.passover.open(entrance, '탐험 입구'); }
      else if (from === 'passover') openPassoverFromHub();
      else if (['#palace','#palace-first','#palace-frogs'].includes(location.hash)) entrance();
      else if (app.state.char && app.state.tier) renderHub();
      else renderTitle();
    }, entryChapter);
  }
  app.openPalace = openPalace;
  app.openNile = function () {
    markScene('#nile');
    app.nile.open(function () {
      markScene('#palace');
      openPalace(app.palace.resuming() ? app.state.palace.from : 'hub');
    });
  };
  function continueJourney() {
    if (app.palace.resuming()) { openPalace(app.state.palace.from); return; }
    if (app.passover.resuming()) { app.passover.open(renderHub); return; }
    var journey = app.savedJourney();
    if (journey) runScene(journey.id, journey);
    else renderHub();
  }
  function openExpedition() { location.assign('expedition.html'); }
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
        el('button', {class:'btn wide', on:{click:openExpedition}}, '구름을 따라 · 출애굽기 원정'),
        el('button', { class: 'btn wide', on: { click: function () { (app.state.tier && app.state.char) ? continueJourney() : renderSetup(); } } },
          (app.state.tier && app.state.char) ? '이어서 탐험하기' : '탐험 시작'),
        app.wilderness.inMountain() ? el('button', {class:'btn wide quiet', on:{click:app.openSinai}}, '시내산 본편 이어 보기') : null,
        app.state.wilderness ? el('button', {class:'btn wide quiet', on:{click:app.openWilderness}}, '광야 본편 이어 보기') : null,
        app.state.redSea ? el('button', {class:'btn wide quiet', on:{click:app.openRedSea}}, '홍해 본편 이어 보기') : null,
        app.state.exodusTrail ? el('button', {class:'btn wide quiet', on:{click:app.openExodusTrail}}, '세 친구의 길 잇기 계속하기') : null,
        el('button', { class: 'btn wide quiet', on: { click: renderGuide } }, '구성 안내 (선생님·부모님용)'),
        el('p', { class: 'fine', text: '감수 전 시범 화면입니다. 광야 답사에서는 말씀 두루마리를 펼쳐 볼 수 있어요.' }))));
  }

  /* ════════════ 단계·주인공 고르기 ════════════ */
  function renderSetup() {
    var tier = app.state.tier, ch = app.state.char, picked = !!app.state.char;
    var line = el('p', { class: 'char-line' });
    var go = el('button', { class: 'btn wide', on: { click: function () {
      if (tier !== app.state.tier) {
        delete app.state.journey;
        delete app.state.pausedJourneys;
      }
      app.state.tier = tier; app.state.char = ch; save();
      if (location.hash === '#brickfield') depart('EX-00');
      else if (location.hash === '#horeb') openHoreb();
      else if (location.hash === '#pillar') depart('EX-09'); else renderHub();
    } } }, '출발 준비 완료');
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
    if (['#pillar','#brickfield','#horeb'].includes(location.hash)) markScene('#home');
    var nextId = null;
    var detours = C.route.options.filter(function (option) {
      return C.scenes[option.to].alt && app.savedJourney(option.to);
    });
    C.timeline.forEach(function (n) { if (!nextId && n.playable && !app.state.done[n.id]) nextId = n.id; });
    var items = C.timeline.map(function (n, i) {
      var done = !!app.state.done[n.id];
      var cls = 'node ' + (n.playable ? 'play' : 'locked') + (done ? ' done' : '') + (n.id === nextId ? ' next' : '');
      var dot = el('span', { class: 'dot' }, done ? icon('check') : (n.playable ? String(i + 1) : icon('lock')));
      var status = n.playable ? (done ? '다시 보기' : '출발') : '감수 후 열림';
      if (n.playable && app.savedJourney(n.id)) status = '이어서 탐험하기';
      var body = [dot,
        el('span', { class: 'tt' }, el('b', { text: n.title }), el('span', { text: n.ref })),
        el('span', { class: 'st', text: status })];
      if (!n.playable) return el('li', { hidden: true }, el('div', { class: cls }, body));
      return el('li', {}, el('button', { class: cls, on: { click: function () { depart(n.id); } } }, body));
    });
    var locked = items.filter(function (_, i) { return !C.timeline[i].playable; });
    var toggle = el('button', { class: 'pillbtn', 'aria-expanded': 'false', 'aria-controls': 'journey-list',
      on: { click: function () {
        var expand = toggle.getAttribute('aria-expanded') === 'false';
        locked.forEach(function (row) { row.hidden = !expand; });
        toggle.setAttribute('aria-expanded', String(expand));
        toggle.textContent = expand ? '갈 수 있는 장면만 보기' : '전체 여정 보기';
      } } }, '전체 여정 보기');
    var c = C.chars[app.state.char], t = tierInfo();
    var entryCount = (app.state.wilderness?.earned?.filter?.(v => v === true).length || 0) + (app.state.redSea && app.state.redSea.finished ? 1 : 0) + app.state.cards.length + writtenNotes().length + (app.passover.completed() ? 1 : 0);
    C.route.options.forEach(function (option) { entryCount += app.journalClues(option.to).length; });
    show(el('div', { class: 'screen sky hub' },
      el('div', { class: 'hub-head pad' },
        pic(app.state.char + '-avatar', 'avatar', ''),
        el('div', { class: 'who' }, el('b', { text: c.name + ' 탐험대원' }), el('span', { text: t.label + ' · ' + t.name })),
        el('button', {class:'pillbtn', on:{click:openExpedition}}, '출애굽기 원정'),
        el('button', { class: 'pillbtn', on: { click: function () { renderJournal(renderHub); } } }, icon('journal'), '일지 ' + entryCount),
        el('button', { class: 'pillbtn', on: { click: renderSetup } }, '단계')),
      el('div', { class: 'hub-body pad' },
        el('div', { class: 'hub-hero' },
          pic('timemachine', '', ''),
          el('div', {}, el('h2', { text: '출애굽기 시간표' }),
            el('p', { text: '열린 장면은 원하는 순서로 둘러볼 수 있어요.' }))),
        detours.map(function (option) {
          return el('button', { class: 'btn wide', on: { click: function () { depart(option.to); } } }, option.label + ' · 이어서 탐험하기');
        }),
        el('button', { class: 'btn wide', on: { click: function () { openPalace('hub'); } } }, '모세와 바로의 대화 · 열 재앙 영상'),
        el('button', { class: 'btn wide', on: { click: openPassoverFromHub } }, '열 가지 재앙과 유월절 · 감수용 미리보기'),
        el('button', {class:'btn wide', on:{click:app.openRedSea}}, '홍해 본편 · 바닷가에서 미리암의 노래까지'),
        el('button', {class:'btn wide', on:{click:app.openSinai}}, '시내산 본편 · 산 앞의 진영과 금송아지'),
        el('button', {class:'btn wide', on:{click:app.openWilderness}}, '광야 본편 · 마라에서 반석까지'),
        el('button', {class:'btn wide', on:{click:app.openExodusTrail}}, '홍해에서 성막까지 · 세 친구의 길 잇기'),
        locked.length ? toggle : null,
        el('ol', { class: 'tl', id: 'journey-list' }, items),
        el('p', { class: 'hub-note', text: '본편 세 장면을 탐험할 수 있어요. 재앙과 유월절은 감수용 미리보기에서 살펴보세요.' }),
        el('div', {},
          el('button', { class: 'linkbtn', on: { click: function () { app.state.routed = false; save(); renderRoute(); } } }, '목적지 다시 고르기'), ' · ',
          el('button', { class: 'linkbtn', on: { click: renderGuide } }, '구성 안내'), ' · ',
          el('button', { class: 'linkbtn', on: { click: function () { app.state = fresh(); save(); renderTitle(); } } }, '처음부터 다시')))));
  }
  function runScene(id, journey) {
    if (id === 'EX-00' && location.hash === '#home') markScene('#brickfield');
    if (id === 'EX-01' && location.hash === '#home') markScene('#horeb');
    app.runScene(id, renderHub, renderRoute, journey, openClueJournal);
  }
  function openClueJournal(id) {
    renderJournal(function () {
      runScene(id, app.savedJourney(id));
      var link = document.querySelector('.sheet-foot .journal-link');
      if (link) link.focus();
    }, id);
  }
  function travelTo(id, title, description) {
    var journey = app.rememberArrival(id);
    warp('시간 이동', title, description, function () { runScene(id, journey); });
  }
  function openHoreb() {
    if (!app.state.tier || !app.state.char) { renderSetup(); return; }
    var journey = app.savedJourney('EX-01');
    if (journey) runScene('EX-01', journey);
    else travelTo('EX-01', C.scenes['EX-01'].place, C.scenes['EX-01'].ref);
  }
  function depart(id) {
    var journey = app.savedJourney(id);
    if (journey) { runScene(id, journey); return; }
    if (id === 'EX-01' && !app.state.routed) { renderRoute(); return; }
    var sc = C.scenes[id];
    travelTo(id, sc.place, sc.ref);
  }

  /* ════════════ 다음 목적지 정하기 ════════════ */
  function renderRoute() {
    if (location.hash === '#brickfield') markScene('#home');
    var opts = C.route.options.map(function (o) {
      return el('button', { class: 'btn wide', on: { click: function () {
        if (o.to === 'EX-01') app.state.routed = true;
        travelTo(o.to, o.label + '의 시대로', '타임머신이 이름을 따라 시대를 찾고 있어요.');
      } } }, o.label);
    });
    show(el('div', { class: 'screen sky setup pad' },
      el('div', { style: 'display:flex;justify-content:center' }, pic('timemachine', 'tm-hero', '')),
      el('h2', { text: '다음 목적지' }),
      el('p', { class: 'lead', style: 'font-size:16.5px;line-height:1.6;color:#E6ECFA', text: tx(C.route.prompt) }),
      el('div', { class: 'tier-list' }, opts),
      el('button', { class: 'btn wide quiet', on: { click: renderHub } }, '시간표로 돌아가기')));
  }

  /* ════════════ 탐험 일지 ════════════ */
  function pageHead(title, back, backLabel) {
    return el('div', { class: 'page-head pad' },
      el('button', { class: 'iconbtn', 'aria-label': backLabel || '돌아가기', on: { click: back } }, icon('back')),
      el('h2', { text: title }));
  }
  function writtenNotes() {
    return Object.keys(app.state.notes).filter(function (k) { return app.state.notes[k].trim(); });
  }
  function renderJournal(back, sceneId) {
    var notes = writtenNotes(), selected;
    var groups = C.route.options.map(function (option) {
      var items = app.journalClues(option.to);
      if (!items.length) return null;
      var group = app.questions.clueNotes(items, [pic(C.scenes[option.to].art, 'clue-thumb', ''), option.label + ' · 단서 ' + items.length + '개']);
      if (option.to === sceneId) { group.open = true; selected = group; }
      return group;
    }).filter(Boolean);
    show(el('div', { class: 'screen page' },
      pageHead('탐험 일지', back, sceneId ? '말씀 카드로 돌아가기' : '돌아가기'),
      el('div', { class: 'page-body pad' },
        app.state.wilderness?.earned?.includes?.(true) ? el('button', {class:'btn wide onpaper', on:{click:() => app.openWilderness(true)}}, '광야 답사 기록과 말씀 인장') : null,
        app.state.redSea && app.state.redSea.finished ? el('details', {class:'po-record'}, el('summary', {}, '홍해 · 건너편에서 부른 노래'), app.refChip('출 14:30–31, 15:1, 15:20–21'), el('p', {}, '그날 하나님이 이스라엘을 애굽 사람의 손에서 구원하셨다. 모세와 이스라엘 자손이 하나님께 노래했다.')) : null,
        app.passover.completed() ? el('button', { class: 'btn wide onpaper', on: { click: function () { app.passover.open(function () { renderJournal(back, sceneId); }, '일지', true); } } }, '열 가지 재앙과 유월절 · 탐험 기록') : null,
        groups.length ? el('section', { class: 'journal-clues' }, el('h3', { text: '내가 찾은 단서' }), groups) : null,
        el('section', {}, el('h3', { text: '말씀 카드 ' + app.state.cards.length + '장' }),
          app.state.cards.length ? el('div', { class: 'vcards' }, app.state.cards.map(function (c) { return cardNode(c, null, false); }))
            : el('p', { class: 'empty', text: '장면을 탐험하면 직접 찾은 말씀이 여기에 모여요.' })),
        el('section', { class: 'notes' }, el('h3', { text: '내가 적은 기록' }),
          notes.length ? notes.map(function (k) { return el('div', { class: 'n' }, el('small', { text: C.scenes[k].ref }), el('p', { text: app.state.notes[k] })); })
            : el('p', { class: 'empty', text: '14~19세 단계에서 장면을 마치며 적은 글이 여기에 남아요.' })))));
    if (selected) selected.querySelector('summary').focus();
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
      pageHead('구성 안내', function () { (app.state.tier && app.state.char) ? renderHub() : renderTitle(); }),
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
            ['여호수아', '요단 강을 건너는 백성', '수 3:1-17'],
            ['요셉', '요셉이 애굽을 다스리게 됨', '창 41:37-46']
          ]),
          el('p', { text: '바울을 골라 선교여행 장면으로 가는 경우는 성령의 말씀과 안수가 나오므로 감수 후에 넣습니다.' })),
        sec('지킨 원칙',
          el('ul', {},
            el('li', { text: '하나님은 어떤 형상으로도 그리지 않고 불, 구름, 빛만 그립니다.' }),
            el('li', { text: '하나님의 말씀은 지어내지 않고 간접 서술로만 적으며, 실제 문장은 성경책이나 말씀 두루마리에서 읽습니다.' }),
            el('li', { text: '광야 답사의 두루마리에는 개역성경(KorRV)의 본문과 장절을 함께 표시합니다.' }),
            el('li', { text: '세 아이는 끝까지 목격자이며 사건에 끼어들지 않습니다.' }),
            el('li', { text: '틀렸다는 표현, 점수, 개인 순위가 없습니다.' }),
            el('li', { text: '뜻과 적용을 묻는 질문은 감수 전이라 비워 두었습니다.' }))),
        sec('장면 목록과 상태',
          table(['장면', '본문', '상태'], C.timeline.map(function (n) {
            return [n.title, n.ref, el('span', { class: 'badge ' + (n.playable ? 'go' : 'hold'), text: n.playable ? '시범 화면 있음' : '감수 대기' })];
          })),
          el('p', { text: '재앙과 유월절의 세 장면은 시간표의 감수용 미리보기에서 살펴볼 수 있습니다. 본편 공개는 목회자 감수 뒤에 진행합니다.' })))));
  }

  // 외부의 같은 페이지 링크도 새 입구로 진입한다. 내부 이동은 replaceState라 이 이벤트를 보내지 않는다.
  window.addEventListener('hashchange', function () {
    if (['#home','#brickfield','#horeb','#pillar','#palace','#palace-first','#palace-frogs','#passover','#redsea','#redsea-coast','#redsea-walk','#redsea-drum','#wilderness','#marah','#elim','#manna','#manna-rest','#rock','#sinai','#sinai-camp','#calf','#exodus','#nile',''].includes(location.hash)) location.reload();
  });
  if (location.hash === '#nile' || (!location.hash && document.body.dataset.start === 'nile')) app.openNile();
  else if (location.hash === '#brickfield') {
    if (app.state.tier && app.state.char) depart('EX-00'); else renderSetup();
  }
  else if (location.hash === '#horeb') openHoreb();
  else if (location.hash === '#pillar') app.openPillars();
  else if (location.hash === '#calf') openField(true,false,'calf');
  else if (location.hash === '#sinai-camp') openField(true,false,'sinai');
  else if (location.hash === '#sinai') app.openSinai();
  else if (location.hash === '#manna-rest') openField(false,false,'sabbath');
  else if (['#marah','#elim','#manna','#rock'].includes(location.hash)) openField(false,false,location.hash.slice(1));
  else if (location.hash === '#wilderness') app.openWilderness();
  else if (location.hash === '#redsea-walk') app.openRedSea('walk');
  else if (location.hash === '#redsea-drum') app.openRedSea('drum');
  else if (location.hash === '#redsea-coast') app.openRedSea(true);
  else if (location.hash === '#redsea') app.openRedSea();
  else if (location.hash === '#exodus') app.openExodusTrail();
  else if (location.hash === '#passover') app.passover.open(entrance, '탐험 입구');
  else if (location.hash === '#home') entrance();
  else if (location.hash === '#palace-first') openPalace('hub',0);
  else if (location.hash === '#palace-frogs') openPalace('hub',1);
  else if (location.hash === '#palace' || document.body.dataset.start === 'palace') {
    openPalace(app.palace.resuming() ? app.state.palace.from : 'hub');
  }
  else renderTitle();
})();
