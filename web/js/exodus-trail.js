/* 탐험대가 수첩 조각을 돌려 기록을 잇는 놀이. 판의 길은 실제 지리가 아니다. */
(function () {
  'use strict';
  const app = BO.app2d, el = app.el;
  const friends = [['choeon', '최온'], ['hyu', '휴'], ['onwoo', '온우']];
  // 각 경로는 왼쪽에서 들어와 오른쪽으로 나간다. 배열의 값은 4열 판에서의 칸 번호다.
  const spreads = [
    {title:'홍해 건너편', range:'출 14–15장', theme:'sea', path:[4, 5, 1, 2, 6, 7], pins:[1, 3, 5],
      entries:[
        ['바다 앞에 갇히다', '출 14:5–14', '백성이 떠났다는 말을 듣고 바로와 그의 신하들이 마음이 변했다.'],
        ['바다 사이의 마른 길', '출 14:21–22', '이스라엘 자손이 바다 가운데를 마른 땅으로 걸어갔고, 양쪽에서 물이 벽처럼 섰다.'],
        ['소고를 든 미리암', '출 14:30–31, 15:20–21', '그날 하나님이 이스라엘을 애굽 사람의 손에서 구원하셨다. 미리암과 여인들이 바닷가에서 소고를 들고 춤춘다.']
      ]},
    {title:'광야의 샘', range:'출 15–17장', theme:'sand', path:[8, 4, 5, 9, 10, 6, 2, 3], pins:[1, 4, 7],
      entries:[
        ['엘림의 샘과 종려나무', '출 15:27', '샘가의 물결과 흔들리는 종려나무 잎 아래에 야영지가 보인다.'],
        ['아침에 거두는 만나', '출 16:13–18', '이슬이 걷힌 뒤 땅 위의 작은 것들을 사람들이 각자의 그릇에 담는다.'],
        ['바위에서 흐른 물', '출 17:5–6', '호렙의 바위에서 나온 물이 메마른 자갈 사이로 흘러간다.']
      ]},
    {title:'시내산의 기록', range:'출 20–32장', theme:'mount', path:[0, 4, 8, 9, 5, 6, 10, 11], pins:[2, 4, 7],
      entries:[
        ['십계명을 듣는 백성', '출 20:1–21'],
        ['시내산에서 맺은 언약', '출 24:3–8'],
        ['금송아지', '출 32:1–8']
      ]},
    {title:'성막의 마지막 장', range:'출 34–40장', theme:'weave', path:[8, 9, 5, 4, 0, 1, 2, 6, 10, 11], pins:[2, 6, 9],
      entries:[
        ['두 돌판을 들고 내려오는 모세', '출 34:28–30', '모세가 돌판 둘을 들고 산에서 내려온다.'],
        ['성막을 짓는 손길', '출 36:8–13'],
        ['장막 위에 머문 구름', '출 40:34–38', '성막 위에 구름이 머물고 주위에 이스라엘 진영이 보인다.']
      ]}
  ];
  const sides = ['위', '오른쪽', '아래', '왼쪽'];
  const opposite = side => (side + 2) % 4;
  function direction(a, b) { return [-4, 1, 4, -1].indexOf(b - a); }
  function layout(spread, flipped) {
    const path = spread.path.map(cell => flipped ? (2 - Math.floor(cell / 4)) * 4 + cell % 4 : cell);
    return path.map((cell, i) => {
      const inlet = i ? direction(cell, path[i - 1]) : 3;
      const outlet = i + 1 < path.length ? direction(cell, path[i + 1]) : 1;
      const period = opposite(inlet) === outlet ? 2 : 4;
      return {cell, inlet, outlet, period};
    });
  }
  function newPage(spread, index, flipped) {
    const tiles = layout(spread, flipped);
    return {flipped, turns:0, found:0, rotation:tiles.map((tile, i) =>
      i === 0 && index === 0 && !flipped ? 0 : (i * 3 + index + (flipped ? 2 : 1)) % tile.period)};
  }
  function validPage(page, spread) {
    if (!page || typeof page.flipped !== 'boolean' || !Number.isSafeInteger(page.turns) || page.turns < 0 ||
        !Number.isInteger(page.found) || page.found < 0 || page.found > 3 || !Array.isArray(page.rotation)) return false;
    const tiles = layout(spread, page.flipped);
    return page.rotation.length === tiles.length && tiles.every((t, i) => Number.isInteger(page.rotation[i]) && page.rotation[i] >= 0 && page.rotation[i] < t.period);
  }
  function state() {
    let s = app.state.exodusTrail;
    if (!s || !Array.isArray(s.pages) || !Number.isInteger(s.index) || !spreads[s.index]) s = app.state.exodusTrail = {index:0, pages:[]};
    s.pages.length = spreads.length;
    spreads.forEach((spread, i) => {
      if (!validPage(s.pages[i], spread)) s.pages[i] = newPage(spread, i, false);
    });
    if (!Array.isArray(s.best)) s.best = [];
    return s;
  }
  function btn(text, action, cls) { return el('button', {type:'button', class:cls, on:{click:action}}, text); }
  function open(leave, fromSea) {
    const s = state();
    if (fromSea && s.index === 0 && !s.book && s.review === undefined) s.index = 1;
    function recordCount(i) {
      if (cleared(i) || (i === 0 && app.state.redSea && app.state.redSea.finished === true)) return 3;
      return s.pages[i].found;
    }
    function count() { return spreads.reduce((n, _, i) => n + recordCount(i), 0); }
    function cleared(i) { return Number.isSafeInteger(s.best[i]) && s.best[i] >= 0; }
    function notebook(focus) {
      s.book = true; app.save();
      const heading = el('h1', {tabindex:'-1'}, count() === 12 ? '완성한 출애굽기 수첩' : '탐험대의 출애굽기 수첩');
      const list = el('div', {class:'xt-pages'});
      if (count() === 12) {
        if (s.restored) list.append(el('p', {class:'xt-restored'}, '열두 기록을 시간 순서로 복원했어요.'));
        list.append(btn(s.restored ? '열두 기록 다시 섞기' : '열두 기록 복원하기', () => {
          s.review = 0; restore(true);
        }, 'xt-primary'));
      }
      spreads.forEach((spread, i) => {
        const available = recordCount(i);
        const group = el('section', {class:'xt-entry'}, el('h2', {}, spread.title), el('small', {}, spread.range));
        for (const entry of spread.entries.slice(0, available)) {
          group.append(el('details', {}, el('summary', {}, entry[0]), app.refChip(entry[1]), entry[2] ? el('p', {}, entry[2]) : null));
        }
        if (available < 3) group.append(el('p', {}, '남은 기록 ' + (3 - available) + '장'));
        if (i === 0 || recordCount(i - 1) === 3) group.append(btn(cleared(i) ? '이 판 다시 맞추기' : '이 판 이어 맞추기', () => {
          if (cleared(i) && s.pages[i].rotation.every(n => n === 0)) s.pages[i] = newPage(spread, i, !s.pages[i].flipped);
          s.index = i; board(true);
        }, 'xt-action'));
        list.append(group);
      });
      app.show(el('main', {class:'screen xt-screen xt-book'}, el('nav', {class:'xt-nav'}, btn('탐험 입구', leave, 'xt-link'), btn('홍해 본편', app.openRedSea, 'xt-link'), btn('놀이판', () => board(true), 'xt-link')),
        el('div', {class:'xt-scroll'}, el('header', {class:'xt-head'}, el('p', {}, '『탐험대 이야기』'), heading, el('p', {}, '모은 기록 ' + count() + ' / 12')), list)));
      if (focus) heading.focus({preventScroll:true});
    }
    function restore(focus) {
      if (!Number.isInteger(s.review) || s.review < 0 || s.review >= 12 || count() !== 12) {
        delete s.review; notebook(focus); return;
      }
      app.save();
      const index = Math.floor(s.review / 3), target = s.review % 3;
      const spread = spreads[index], entries = spread.entries;
      const heading = el('h1', {tabindex:'-1'}, spread.title);
      const feedback = el('p', {class:'xt-message', role:'status'}, '흩어진 기록을 일어난 순서대로 다시 꽂아 봐.');
      const remaining = el('div', {class:'xt-picks'});
      const placed = el('ol', {class:'xt-placed', 'aria-label':'복원한 순서'}, entries.slice(0, target).map(entry => el('li', {}, entry[0])));
      const order = index % 2 ? [1,2,0] : [2,0,1];
      order.filter(i => i >= target).forEach(i => {
        const entry = entries[i];
        const choice = btn(entry[0], () => {
          if (i !== target) {
            feedback.textContent = '온우 · 이 기록은 ' + entry[1] + '에 있어. 먼저 ' + entries[target][1] + '의 기록을 찾아봐.';
            return;
          }
          if (++s.review === 12) {
            delete s.review; s.restored = true; notebook(true);
          } else restore(true);
        }, 'xt-action');
        remaining.append(el('div', {}, choice, el('details', {}, el('summary', {}, '장절 보기'), app.refChip(entry[1]))));
      });
      app.show(el('main', {class:'screen xt-screen xt-' + spread.theme},
        el('nav', {class:'xt-nav'}, btn('탐험 입구', leave, 'xt-link'), btn('홍해 본편', app.openRedSea, 'xt-link'), btn('내 수첩', () => { delete s.review; notebook(true); }, 'xt-link')),
        el('div', {class:'xt-scroll'}, el('header', {class:'xt-head'}, el('p', {}, '『탐험대 이야기』 기록 복원 · ' + s.review + ' / 12'), heading), placed, feedback, remaining)));
      if (focus) heading.focus({preventScroll:true});
    }
    function board(focus) {
      s.book = false;
      const index = s.index, spread = spreads[index], page = s.pages[index], tiles = layout(spread, page.flipped);
      const heading = el('h1', {tabindex:'-1'}, spread.title);
      const cells = el('div', {class:'xt-grid', role:'group', 'aria-label':'돌려서 잇는 수첩 조각'});
      const buttons = [], lines = [];
      const hints = btn('끊긴 조각 찾기', () => {
        const first = page.rotation.findIndex(n => n !== 0);
        if (first < 0) return;
        buttons[first].focus();
        buttons[first].classList.add('xt-hint');
        message.textContent = '휴 · 테두리가 빛나는 조각을 돌려 봐. 금빛 선이 더 길어질 거야.';
      }, 'xt-action');
      const message = el('p', {class:'xt-message', role:'status', 'aria-live':'polite'});
      const stamps = el('div', {class:'xt-stamps'});
      const actions = el('div', {class:'xt-actions'});
      const left = tiles[0].cell, right = tiles[tiles.length - 1].cell;
      for (let cell = 0; cell < 12; cell++) {
        const n = tiles.findIndex(tile => tile.cell === cell);
        if (n < 0) { cells.append(el('span', {class:'xt-terrain', 'aria-hidden':'true'})); continue; }
        const tile = tiles[n], pin = spread.pins.indexOf(n);
        const node = btn('', () => {
          page.rotation[n] = (page.rotation[n] + 1) % tile.period;
          page.turns++;
          update(n);
        }, 'xt-cell');
        const drawn = el('span', {class:'xt-line', 'aria-hidden':'true'}, el('i', {class:'arm side-' + tile.inlet}), el('i', {class:'arm side-' + tile.outlet}));
        node.append(drawn, el('span', {class:'xt-pin', 'aria-hidden':'true'}, pin >= 0 ? String(pin + 1) : ''));
        if (cell === left || cell === right) node.append(el('span', {class:'xt-gate ' + (cell === left ? 'enter' : 'exit'), 'aria-hidden':'true'}, cell === left ? '시작' : '끝'));
        buttons[n] = node; lines[n] = drawn; cells.append(node);
      }
      const counter = el('span', {});
      function update(turned) {
        let joined = page.rotation.findIndex(r => r !== 0);
        if (joined < 0) joined = tiles.length;
        const previous = page.found;
        const found = spread.pins.filter(i => i < joined).length;
        page.found = Math.max(previous, found);
        const finished = joined === tiles.length;
        buttons.forEach((node, i) => {
          const r = page.rotation[i], t = tiles[i], pin = spread.pins.indexOf(i);
          lines[i].style.transform = 'rotate(' + r * 90 + 'deg)';
          node.classList.toggle('joined', i < joined);
          node.classList.remove('xt-hint');
          node.setAttribute('aria-label', (Math.floor(t.cell / 4) + 1) + '행 ' + (t.cell % 4 + 1) + '열, ' +
            [sides[(t.inlet + r) % 4], sides[(t.outlet + r) % 4]].join('와 ') + ' 연결' +
            (pin >= 0 ? ', 기록 ' + (pin + 1) : '') + (i < joined ? ', 이어짐' : '') + ', 돌리기');
          // 완성된 판은 기록을 읽거나 다음 판으로 간다.
          node.disabled = finished;
        });
        if (finished && (!cleared(index) || page.turns < s.best[index])) s.best[index] = page.turns;
        counter.textContent = '기록 ' + page.found + '/3 · ' + page.turns + '번 돌림';
        if (turned === undefined || previous !== page.found || finished) {
          stamps.replaceChildren();
          spread.entries.slice(0, page.found).forEach((entry, i) => {
            const detail = el('details', {}, el('summary', {}, String(i + 1) + ' · ' + entry[0]), app.refChip(entry[1]), entry[2] ? el('p', {}, entry[2]) : null);
            detail.open = i === page.found - 1;
            stamps.append(detail);
          });
        }
        message.textContent = finished ? '온우 · 세 기록이 이어졌어! 수첩에 붙여 둘게.' :
          page.found > previous ? '온우 · 새 기록을 찾았어! ' + spread.entries[page.found - 1][0] :
          turned === undefined ? '최온 · 시작에서 끝까지 선을 이어 봐. 조각을 누르면 오른쪽으로 돌아가.' :
          '시작에서 ' + joined + '칸 이어졌어요. 이어진 선은 금빛이에요.';
        actions.replaceChildren();
        if (finished) {
          const next = btn(index < spreads.length - 1 ? '다음 장 펼치기' : '완성한 수첩 열기', () => {
            if (index === spreads.length - 1) notebook(true);
            else { s.index++; board(true); }
          }, 'xt-primary');
          actions.append(next);
          if (turned !== undefined) next.focus({preventScroll:true});
        } else actions.append(hints);
        app.save();
      }
      const crew = el('div', {class:'xt-crew', 'aria-label':'함께하는 탐험대'}, friends.map(f =>
        el('span', {}, app.pic(f[0] + '-avatar', '', ''), f[1])));
      app.show(el('main', {class:'screen xt-screen xt-' + spread.theme},
        el('nav', {class:'xt-nav'}, btn('탐험 입구', leave, 'xt-link'), btn('홍해 본편', app.openRedSea, 'xt-link'), btn('내 수첩', () => notebook(true), 'xt-link')),
        el('div', {class:'xt-scroll'}, el('header', {class:'xt-head'}, el('p', {}, '『탐험대 이야기』 길 잇기 · ' + (index + 1) + ' / ' + spreads.length), heading,
          el('div', {class:'xt-byline'}, el('span', {}, spread.range), crew)),
          el('section', {class:'xt-play'}, el('div', {class:'xt-boardlabel'}, el('strong', {}, '수첩 조각 맞추기'), counter), cells, message, stamps, actions))));
      update();
      if (focus) heading.focus({preventScroll:true});
    }
    if (s.review !== undefined) restore(false); else if (s.book) notebook(false); else board(false);
  }
  app.exodusTrail = {open};
})();
