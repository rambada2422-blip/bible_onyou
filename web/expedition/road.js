(() => {
  'use strict';
  if (!['#road', '#road-arrival'].includes(location.hash)) return;
  const root = document.getElementById('road');
  root.hidden = false;
  document.body.classList.add('on-road');
  root.innerHTML = `<div class="rd-shell"><header class="rd-top"><div class="rd-word"><span aria-hidden="true">✧</span> 구름을 따라</div><nav><button id="rd-book">기록</button><button id="rd-menu" aria-label="원정 메뉴">☰</button></nav></header>
    <main class="rd-main"><div class="rd-heading"><div><p id="rd-place"></p><h1 id="rd-title"></h1></div><div class="rd-marker" id="rd-progress"></div></div>
    <div class="rd-frame"><canvas id="rd-world" tabindex="0" aria-label="탐험 지도. 방향키로 걷고 스페이스로 상호작용"></canvas>
    <button id="rd-zoom" aria-pressed="false" aria-label="지도 크기 바꾸기">⤢</button><div class="rd-env" id="rd-env"></div><div id="rd-toast" role="status"></div></div>
    <div class="rd-dashboard"><div class="rd-objective"><span id="rd-objective-label">지금 할 일</span><p id="rd-task"></p><div id="rd-inventory"></div></div>
    <div class="rd-controls"><div class="rd-pad" aria-label="걸을 방향"><button data-go="n" aria-label="북쪽으로 한 걸음">↗︎</button><button data-go="w" aria-label="서쪽으로 한 걸음">↖︎</button><button data-go="e" aria-label="동쪽으로 한 걸음">↘︎</button><button data-go="s" aria-label="남쪽으로 한 걸음">↙︎</button></div><div class="rd-actions"><button id="rd-act"></button><button id="rd-undo" aria-label="한 수 되돌리기">↶ 되돌리기</button></div></div></div>
    <footer class="rd-foot"><span>지면 터치로 이동 · 방향키 / WASD · Space</span><button id="rd-help">조작과 단서</button></footer></main>
    <dialog id="rd-dialog"><div id="rd-dialog-body"></div></dialog></div>`;
  const $ = (id) => document.getElementById(id);
  root.querySelector('.rd-dashboard').after($('rd-toast'));
  const canvas = $('rd-world'),
    art = makeRoadArt(canvas),
    dialog = $('rd-dialog'),
    dialogBody = $('rd-dialog-body');
  const key = 'onyou.exodus.road.v1',
    dirs = { n: [0, -1], e: [1, 0], s: [0, 1], w: [-1, 0] };
  const blocked = '#^P~Br',
    stepMs = 175;
  function points(map) {
    const result = {};
    map.rows.forEach((row, y) =>
      Array.from(row).forEach((ch, x) => {
        if (ch === '@' || ch === '*' || map.signs[ch]) result[ch] = { x, y };
      })
    );
    return result;
  }
  function initial(i, gear) {
    const p = points(roadMaps[i]);
    return {
      ...p['@'],
      turn: 0,
      cart: p['*'] || null,
      loaded: false,
      delivered: false,
      water: gear === 'flask' ? 5 : 3,
      heat: 0,
      flags: {},
      used: {},
      notes: [],
      shots: [],
      sequence: []
    };
  }
  function fresh() {
    return { v: 1, i: 0, gear: null, entries: [], s: initial(0), finished: false, undo: [], sound: false };
  }
  function load() {
    try {
      const a = JSON.parse(localStorage.getItem(key));
      if (
        a?.v === 1 &&
        roadMaps[a.i] &&
        Number.isInteger(a.s?.x) &&
        Number.isInteger(a.s?.y) &&
        Array.isArray(a.entries) &&
        Array.isArray(a.undo) &&
        a.s.flags &&
        a.s.used
      )
        return a;
    } catch {}
    return fresh();
  }
  let game = load(),
    map,
    sites,
    s,
    route = [],
    motion = null,
    zoom = false,
    bump = null,
    msgUntil = 0,
    lastPaint = 0,
    raf = 0,
    walking = null,
    manual = false,
    frogClock = 0,
    prevTime = null,
    modalClose = null,
    musicKey = '',
    saveBroken = false;
  const music = new Audio();
  music.loop = true;
  music.volume = 0.22;
  const tile = (x, y) => map.rows[y]?.[x] ?? '#',
    dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  function bind() {
    map = roadMaps[game.i];
    sites = points(map);
    s = game.s;
    manual = matchMedia('(prefers-reduced-motion: reduce)').matches;
    frogClock = 0;
    prevTime = null;
  }
  bind();
  function save() {
    try {
      localStorage.setItem(key, JSON.stringify(game));
    } catch {
      saveBroken = true;
    }
  }
  function snapshot() {
    game.undo.push(structuredClone(s));
    if (game.undo.length > 32) game.undo.shift();
  }
  function stop() {
    route = [];
    clearInterval(walking);
    walking = null;
  }
  function say(text, ms = 3600) {
    $('rd-toast').textContent = text;
    msgUntil = performance.now() + ms;
    $('rd-toast').classList.add('up');
  }
  function newEl(type, text, cls) {
    const el = document.createElement(type);
    if (text !== undefined) el.textContent = text;
    if (cls) el.className = cls;
    return el;
  }
  function btn(text, fn, cls) {
    const b = newEl('button', text, cls);
    b.onclick = fn;
    return b;
  }
  function close() {
    if (dialog.open) dialog.close();
  }
  function panel(kicker, title, words, choices, after) {
    stop();
    if (!dialog.open) {
      dialog.showModal();
    }
    if (modalClose) modalClose();
    modalClose = null;
    dialogBody.replaceChildren(newEl('small', kicker), newEl('h2', title));
    if (words) dialogBody.append(newEl('p', words));
    const ops = newEl('div', undefined, 'rd-opts');
    for (const [label, fn, cls] of choices) ops.append(btn(label, fn, cls));
    dialogBody.append(ops);
    if (after) after(dialogBody, ops);
    (ops.querySelector('button') || dialogBody).focus();
  }
  dialog.addEventListener('close', () => {
    if (modalClose) modalClose();
    modalClose = null;
    prevTime = null;
    canvas.focus({ preventScroll: true });
  });
  function tune() {
    if (!game.sound || document.hidden) {
      music.pause();
      return;
    }
    const name = [
      'riverSound',
      'riverSound',
      'riverSound',
      'seaSound',
      'marchSound',
      'campSound',
      'marchSound'
    ][game.i];
    if (name !== musicKey) {
      musicKey = name;
      music.src = assets[name];
    }
    if (music.paused) music.play().catch(() => {});
  }
  function cellShade(x, y) {
    if (tile(x, y) === ':' || ['X', 'Y'].includes(tile(x, y))) return true;
    const side = Math.floor(s.turn / 4) % 2 ? 1 : -1;
    return ['^', 'P'].includes(tile(x + side, y)) && x + side >= 0 && x + side < map.rows[0].length;
  }
  function cloudUp() {
    return s.turn % 4 >= 2;
  }
  function frogPositions() {
    if (map.id !== 'frogs') return [];
    return ['F', 'K'].map((id, i) => {
      const t = (frogClock / (i ? 1.36 : 1.65) + i * 0.43) % 2,
        leg = t % 1;
      const frac = Math.max(0, Math.min(1, (leg - 0.22) / 0.6)),
        dir = t < 1 ? 1 : -1,
        offset = dir === 1 ? frac : 1 - frac;
      return { id, x: sites[id].x + offset * 0.82, y: sites[id].y + 0.15, h: Math.sin(frac * Math.PI), dir };
    });
  }
  function frame(now) {
    if (!document.hidden && now - lastPaint >= 30) {
      if (!dialog.open && !manual && prevTime !== null) frogClock += Math.min(0.09, (now - prevTime) / 1000);
      prevTime = now;
      lastPaint = now;
      art.draw(
        map,
        s,
        {
          motion,
          overview: zoom,
          route,
          points: sites,
          bump,
          ghost: game.practice && game.bestKiln?.trail,
          shade: cellShade,
          frogs: frogPositions(),
          cloud: cloudUp(),
          paused: dialog.open
        },
        now
      );
      if (msgUntil && now >= msgUntil) {
        $('rd-toast').classList.remove('up');
        msgUntil = 0;
      }
    }
    raf = requestAnimationFrame(frame);
  }
  function near(id, r = 1) {
    return sites[id] && dist(s, sites[id]) <= r;
  }
  function available(ids, r = 1) {
    return ids
      .split('')
      .filter((id) => near(id, r))
      .sort((a, b) => dist(s, sites[a]) - dist(s, sites[b]));
  }
  function objective() {
    if (map.id === 'kiln')
      return s.delivered
        ? '해 지기 전에 챙길 장비를 골라라.'
        : s.loaded
          ? '벽돌을 실은 수레를 동쪽 말림터로 운반하라.'
          : s.cart.x === sites.L.x && s.cart.y === sites.L.y
            ? '작업대 곁에서 흙을 다져 수레에 실어라.'
            : '빈 수레를 흙 작업대 옆 표시까지 밀어라.';
    if (map.id === 'reeds' && s.flags.J && s.flags.S) return '두 시점의 기록을 잇는다.';
    if (map.id === 'sea' && s.flags.A && s.flags.H) return '두 동료와 함께 건너편의 소고에 닿아라.';
    return map.task;
  }
  function active() {
    if (game.finished) return '여정 기록 열기';
    if (s.wrap !== undefined) return '현장 기록 열기';
    switch (map.id) {
      case 'kiln':
        return s.delivered
          ? game.practice
            ? '동선 비교'
            : '장비 선택'
          : !s.loaded && near('L') && dist(s.cart, sites.L) === 0
            ? '흙 다지기'
            : dist(s, s.cart) === 1
              ? '수레 밀기'
              : '주변 살피기';
      case 'reeds':
        return available('JS', game.gear === 'lens' ? 2 : 1).length ? '관찰하기' : '시야 살피기';
      case 'frogs':
        return '셔터';
      case 'sea':
        if (!s.flags.A && !s.flags.H && s.x === sites['@'].x && s.y === sites['@'].y) return '물벽 사이로 들어가기';
        return near('E') ? '건너편 소고' : available('AH').length ? '동료 부르기' : '발자국 살피기';
      case 'desert':
        return near('E') ? '샘에 닿기' : tile(s.x, s.y) === ':' ? '물 보충' : '그늘 살피기';
      case 'ridge':
        return s.notes.length === 3
          ? '세 기록 재구성'
          : available('RTV').length
            ? '증언 기록'
            : '주변 살피기';
      case 'years':
        return near('E') ? '경계에 도착' : available('XY').length ? '구름 관찰' : '하늘 살피기';
    }
  }
  function refresh() {
    frameButton.hidden = map.id !== 'frogs' || game.finished;
    const num = String(game.i + 1).padStart(2, '0');
    $('rd-place').textContent = map.place + '  /  ' + map.ref;
    $('rd-title').textContent = map.title;
    $('rd-progress').textContent = num + ' / 07';
    $('rd-task').textContent = objective();
    $('rd-act').textContent = active();
    $('rd-undo').disabled = !game.undo.length || game.finished;
    $('rd-env').textContent =
      map.id === 'desert'
        ? '물 ' + s.water + '  ·  ' + (cellShade(s.x, s.y) ? '그늘' : '직사광선')
        : map.id === 'frogs'
          ? '포착 ' + s.shots.length + '/2'
          : map.id === 'sea'
            ? '일행 ' + (1 + Number(!!s.flags.A) + Number(!!s.flags.H)) + '/3'
            : map.id === 'ridge'
              ? '증언 ' + s.notes.length + '/3'
              : map.id === 'years'
                ? cloudUp()
                  ? '구름이 떠오른다'
                  : '구름이 머문다'
                : map.id === 'reeds'
                  ? '관찰 ' + s.notes.length + '/2'
                  : s.loaded
                    ? '수레 · 벽돌'
                    : '수레 · 비어 있음';
    $('rd-inventory').textContent = saveBroken
      ? '이 창에서만 진행이 보관된다.'
      : game.gear === 'lens'
        ? '휴대 장비  ·  관찰 렌즈'
        : game.gear === 'flask'
          ? '휴대 장비  ·  여분 물병'
          : '';
    $('rd-world').setAttribute(
      'aria-label',
      map.title + ' 지도. ' + (s.x + 1) + '열 ' + (s.y + 1) + '행. ' + objective()
    );
  }
  function spendTurn() {
    s.turn++;
  }
  function charCan(x, y) {
    return !blocked.includes(tile(x, y));
  }
  function move(dx, dy) {
    if (game.finished || dialog.open) return false;
    const x = s.x + dx,
      y = s.y + dy;
    if (!charCan(x, y)) {
      bump = { x, y, until: performance.now() + 900 };
      say('길이 끊겼다. 다른 쪽으로 돌아갈 수 있다.');
      return false;
    }
    const pushing = s.cart && s.cart.x === x && s.cart.y === y;
    if (pushing && !charCan(x + dx, y + dy)) {
      bump = { x: x + dx, y: y + dy, until: performance.now() + 900 };
      say('수레 뒤가 막혔다. 옆으로 돌아가거나 한 수를 되돌리자.');
      return false;
    }
    snapshot();
    motion = { x: s.x, y: s.y, cart: s.cart && { ...s.cart }, at: performance.now() };
    s.face = dx - dy >= 0 ? 1 : -1;
    s.x = x;
    s.y = y;
    if (map.id === 'kiln') {
      s.steps = (s.steps || 0) + 1;
      (s.trail ||= []).push([x, y]);
      if (s.trail.length > 256) s.trail.shift();
      if (pushing) s.pushes = (s.pushes || 0) + 1;
    }
    if (pushing) {
      s.cart = { x: x + dx, y: y + dy };
      if (!s.loaded && dist(s.cart, sites.L) === 0) say('수레가 작업대에 닿았다. 여기서 흙을 다질 수 있다.');
      if (s.loaded && dist(s.cart, sites.D) === 0) {
        s.delivered = true;
        if (!game.bestKiln || s.steps < game.bestKiln.steps)
          game.bestKiln = { steps: s.steps, pushes: s.pushes, trail: s.trail.slice() };
        stop();
        say('벽돌이 말림터에 도착했다. 장비 하나를 챙길 수 있다.');
      }
    }
    if (map.id === 'desert') {
      if (!cellShade(x, y)) {
        s.heat++;
        if (s.heat >= 3) {
          s.heat = 0;
          s.water--;
        }
      } else s.heat = Math.max(0, s.heat - 1);
    }
    spendTurn();
    save();
    refresh();
    if (map.id === 'desert' && s.water < 0) {
      stop();
      exhausted();
      return false;
    }
    return true;
  }
  function undo() {
    if (dialog.open) close();
    stop();
    if (!game.undo.length || game.finished) return;
    if (map.id === 'kiln') game.rewinds = (game.rewinds || 0) + 1;
    game.s = game.undo.pop();
    s = game.s;
    motion = null;
    save();
    refresh();
    say('한 수 전으로 돌아왔다.');
  }
  function restart() {
    close();
    stop();
    s = game.s = initial(game.i, game.gear);
    game.undo = [];
    game.rewinds = 0;
    motion = null;
    save();
    refresh();
    say('이 현장의 출발점이다.');
  }
  function exhausted() {
    panel(
      '광야',
      '발걸음이 멎었다',
      '지나온 경로는 기억에 남는다. 마지막 한 걸음을 바꾸거나 출발지에서 다른 길을 택할 수 있다.',
      [
        ['마지막 걸음 되돌리기', undo],
        ['현장 다시 걷기', restart, 'minor']
      ]
    );
  }
  function enqueue(target) {
    stop();
    if (dialog.open || game.finished) return;
    if (dist(s, target) === 0) {
      interact();
      return;
    }
    if (dist(s, target) === 1) {
      move(target.x - s.x, target.y - s.y);
      return;
    }
    if (!charCan(target.x, target.y) || (s.cart && dist(target, s.cart) === 0)) {
      say('그 옆의 빈 땅으로 이동한 뒤 가까이에서 조작한다.');
      return;
    }
    const start = { x: s.x, y: s.y },
      queue = [start],
      previous = new Map([[start.x + ',' + start.y, null]]);
    for (let i = 0; i < queue.length; i++) {
      const cur = queue[i];
      if (dist(cur, target) === 0) break;
      for (const [dx, dy] of Object.values(dirs)) {
        const next = { x: cur.x + dx, y: cur.y + dy },
          k = next.x + ',' + next.y;
        if (!previous.has(k) && charCan(next.x, next.y) && !(s.cart && dist(next, s.cart) === 0)) {
          previous.set(k, cur);
          queue.push(next);
        }
      }
    }
    if (!previous.has(target.x + ',' + target.y)) {
      say('그곳으로 이어진 길을 찾을 수 없다.');
      return;
    }
    for (let cur = target; dist(cur, start) > 0; cur = previous.get(cur.x + ',' + cur.y)) route.unshift(cur);
    function advance() {
      const next = route.shift();
      if (!next || !move(next.x - s.x, next.y - s.y) || !route.length) stop();
    }
    walking = setInterval(advance, stepMs);
    advance();
  }
  function finish(extra = '') {
    stop();
    s.wrap = extra;
    save();
    refresh();
    const last = game.i === roadMaps.length - 1;
    panel(
      map.ref,
      map.title,
      map.story,
      [
        [
          last ? '여정 마치기' : '다음 현장으로',
          () => {
            game.entries[game.i] = {
              id: map.id,
              turn: s.turn,
              extra,
              shots: s.shots.map((o) => ({ ...o })),
              notes: s.notes.slice()
            };
            close();
            if (last) {
              game.finished = true;
              game.undo = [];
              save();
              refresh();
              journal();
              return;
            }
            game.i++;
            game.s = initial(game.i, game.gear);
            game.undo = [];
            motion = null;
            bind();
            save();
            refresh();
            tune();
            say(roadMaps[game.i - 1].exit, 6500);
          }
        ]
      ],
      (box, ops) => {
        if (extra) box.insertBefore(newEl('p', extra, 'rd-personal'), ops);
      }
    );
  }
  function prepareBrick() {
    let start = 0,
      timer = 0;
    panel(
      '흙 작업대',
      '틀에서 놓을 순간',
      '나무틀이 차오른다. 표시가 황동 띠 안에 들어오면 손을 뗀다.',
      [],
      (box, ops) => {
        const track = newEl('div', undefined, 'rd-gauge'),
          needle = newEl('i');
        track.append(needle);
        box.insertBefore(track, ops);
        const value = () => Math.min(1, (performance.now() - start) / 1450);
        const fire = () => {
          clearInterval(timer);
          timer = 0;
          const amount = value();
          if (amount >= 0.47 && amount <= 0.82) {
            snapshot();
            s.loaded = true;
            spendTurn();
            close();
            save();
            refresh();
            say('형태가 잡혔다. 벽돌을 수레에 실었다.');
          } else {
            start = 0;
            needle.style.left = '0%';
            press.textContent = '다지기 시작';
            label.textContent =
              amount < 0.47 ? '흙이 틀 모서리까지 차지 않았다.' : '가장자리가 갈라졌다. 다시 이길 수 있다.';
          }
        };
        const begin = () => {
          start = performance.now();
          press.textContent = '지금 놓기';
          timer = setInterval(() => {
            needle.style.left = value() * 100 + '%';
          }, 20);
        };
        let suppressClick = false,
          pressedAt = 0;
        const press = btn('다지기 시작', () => {
          if (suppressClick) {
            suppressClick = false;
            return;
          }
          if (start) fire();
          else begin();
        });
        function down() {
          pressedAt = performance.now();
          if (start) {
            fire();
            pressedAt = 0;
          } else begin();
        }
        function up() {
          if (pressedAt && start && performance.now() - pressedAt > 160) fire();
          pressedAt = 0;
          suppressClick = true;
        }
        press.addEventListener('pointerdown', (e) => {
          if (e.button !== 0) return;
          press.setPointerCapture(e.pointerId);
          down();
        });
        press.addEventListener('pointerup', up);
        press.addEventListener('pointercancel', () => {
          clearInterval(timer);
          start = 0;
          pressedAt = 0;
          needle.style.left = '0%';
          press.textContent = '다지기 시작';
        });
        press.addEventListener('keydown', (e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (!e.repeat) down();
          }
        });
        press.addEventListener('keyup', (e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            up();
            suppressClick = false;
          }
        });
        const label = newEl('p', '', 'rd-feedback');
        const slow = btn(
          '손으로 고르게 누르기',
          () => {
            clearInterval(timer);
            start = 0;
            let depth = 0;
            ops.replaceChildren(
              btn('흙을 한 겹 누르기', () => {
                depth++;
                needle.style.left = depth * 20 + '%';
                label.textContent = depth < 3 ? '틀이 차오른다.' : '모서리까지 흙이 찼다.';
                if (depth === 3) {
                  snapshot();
                  s.loaded = true;
                  spendTurn();
                  close();
                  save();
                  refresh();
                  say('세 겹을 눌러 벽돌을 실었다.');
                }
              })
            );
          },
          'minor'
        );
        ops.append(press, slow);
        box.append(label);
        press.focus();
        modalClose = () => clearInterval(timer);
      }
    );
  }
  function cartCount() {
    return '이동 ' + s.steps + '걸음 · 수레 ' + s.pushes + '번 밀기 · 되돌림 ' + (game.rewinds || 0) + '번';
  }
  function practice() {
    if (!game.practice)
      game.practice = {
        i: game.i,
        s: structuredClone(s),
        undo: game.undo.slice(),
        rewinds: game.rewinds || 0,
        finished: game.finished
      };
    close();
    stop();
    game.i = 0;
    game.finished = false;
    game.s = initial(0, game.gear);
    game.undo = [];
    game.rewinds = 0;
    motion = null;
    bind();
    save();
    refresh();
    tune();
    say('이전 최단 동선이 바닥에 남아 있다. 다른 길을 시험해 보자.', 5000);
  }
  function returnToJourney() {
    const prev = game.practice;
    if (!prev) return;
    Object.assign(game, prev);
    delete game.practice;
    close();
    stop();
    motion = null;
    bind();
    save();
    refresh();
    tune();
    if (game.finished) journal();
    else say('떠났던 원정으로 돌아왔다.');
  }
  function chooseGear() {
    const result = cartCount() + '  /  내 최단 ' + (game.bestKiln?.steps ?? s.steps ?? s.turn) + '걸음';
    if (game.practice) {
      panel('수레 동선', '다시 도착한 말림터', result, [
        ['원정 복귀', returnToJourney],
        ['다른 동선으로 다시 풀기', practice, 'minor']
      ]);
      return;
    }
    panel(
      '탐험대의 장비',
      '하나만 가져갈 수 있다',
      '강둑 너머로 갈 길이 길다. 렌즈는 더 먼 곳에서 관찰할 수 있고, 물병은 광야의 식수를 두 모금 늘린다.',
      [
        [
          '관찰 렌즈',
          () => {
            game.gear = 'lens';
            save();
            finish('관찰 렌즈 · ' + result);
          }
        ],
        [
          '여분 물병',
          () => {
            game.gear = 'flask';
            save();
            finish('여분 물병 · ' + result);
          },
          'minor'
        ],
        ['다른 동선으로 다시 풀기', practice, 'minor']
      ],
      (body, ops) => body.insertBefore(newEl('p', result, 'rd-personal'), ops)
    );
  }
  function note(id, text) {
    if (!s.flags[id]) {
      snapshot();
      s.flags[id] = true;
      s.notes.push(id);
      spendTurn();
      save();
      refresh();
    }
    say(text, 5000);
  }
  function takePhoto() {
    const frogs = frogPositions(),
      range = game.gear === 'lens' ? 3.2 : 2.15;
    const frog = frogs
      .filter((f) => Math.hypot(f.x - s.x, f.y - s.y) <= range)
      .sort((a, b) => Math.hypot(a.x - s.x, a.y - s.y) - Math.hypot(b.x - s.x, b.y - s.y))[0];
    if (!frog) {
      say('렌즈 너머로 너무 작다. 강가나 부엌에 가까이 가 보자.');
      return;
    }
    if (frog.h < 0.48) {
      say('땅에 닿은 뒷다리가 접혀 있다. 다음 도약을 기다릴 수 있다.');
      return;
    }
    if (s.flags[frog.id]) {
      say('이곳의 도약은 이미 기록했다. 다른 곳의 움직임을 찾자.');
      return;
    }
    const rect = canvas.getBoundingClientRect(),
      pt = art.projected(frog.x, frog.y),
      scale = canvas.width / rect.width;
    const shot = document.createElement('canvas');
    shot.width = 164;
    shot.height = 112;
    const size = Math.min(rect.width * 0.4, 134);
    shot
      .getContext('2d')
      .drawImage(
        canvas,
        (pt.x - size / 2) * scale,
        (pt.y - size * 0.4) * scale,
        size * scale,
        size * 0.68 * scale,
        0,
        0,
        164,
        112
      );
    snapshot();
    s.flags[frog.id] = true;
    s.shots.push({ id: frog.id, url: shot.toDataURL('image/jpeg', 0.72) });
    save();
    refresh();
    if (s.shots.length === 2) finish('강가와 부엌에서 찍은 두 장을 보관했다.');
    else say('도약 한 장. 다음 장소에서 다른 한 장을 찾자.');
  }
  const proof = {
    R: '백성은 기다리다 모세에게 무슨 일이 생겼는지 모르겠다며 자신들을 이끌 신을 요구했다. 아론은 금고리를 받아 송아지를 만들었다. 출 32:1–4',
    T: '하나님은 백성이 명령을 떠나 송아지에게 절한 일을 말씀하셨다. 모세는 산 위에서 먼저 백성을 위해 간구했다. 출 32:7–14',
    V: '여호수아는 싸움으로, 모세는 노래로 들었다. 모세가 송아지와 춤을 직접 본 것은 진영에 가까이 내려온 뒤였다. 출 32:17–19'
  };
  const events = [
    ['산 위에서 백성을 위해 간구', 'T'],
    ['송아지와 춤을 직접 봄', 'V'],
    ['이튿날 다시 용서를 구함', 'N']
  ];
  function reconstruct() {
    panel(
      '출 32:11–19·30–32',
      '진영에 도착하기 전과 후',
      '세 기록을 시간 순서로 놓아라. 산 위에서 들은 소식과 산 아래에서 본 장면을 대조할 수 있다.',
      [],
      (box, ops) => {
        const seq = [];
        const display = newEl('p', '아직 놓은 기록이 없다.', 'rd-feedback');
        box.insertBefore(display, ops);
        function paint() {
          ops.replaceChildren();
          for (const [label, id] of [events[2], events[0], events[1]])
            if (!seq.includes(id))
              ops.append(
                btn(label, () => {
                  seq.push(id);
                  display.textContent = seq.map((k) => events.find((e) => e[1] === k)[0]).join(' → ');
                  paint();
                })
              );
          if (seq.length === 3)
            ops.append(
              btn('기록 대조', () => {
                if (seq.join('') === 'TVN') {
                  finish('세 증언의 조사 순서 · ' + s.notes.map((k) => map.signs[k]).join(' → '));
                } else {
                  display.textContent =
                    '출 32:11–14는 산 위의 일이다. 19절과 이튿날의 30절 사이를 다시 맞춰 보자.';
                  seq.length = 0;
                  paint();
                }
              })
            );
          if (seq.length)
            ops.append(
              btn(
                '마지막 조각 빼기',
                () => {
                  seq.pop();
                  display.textContent =
                    seq.map((k) => events.find((e) => e[1] === k)[0]).join(' → ') || '아직 놓은 기록이 없다.';
                  paint();
                },
                'minor'
              )
            );
        }
        paint();
      }
    );
  }
  function interact() {
    stop();
    if (dialog.open) return;
    if (game.finished) {
      journal();
      return;
    }
    if (s.wrap !== undefined) {
      finish(s.wrap);
      return;
    }
    switch (map.id) {
      case 'kiln':
        if (s.delivered) chooseGear();
        else if (!s.loaded && near('L') && dist(s.cart, sites.L) === 0) prepareBrick();
        else if (dist(s, s.cart) === 1) move(s.cart.x - s.x, s.cart.y - s.y);
        else say(near('L') ? '작업대에 빈 수레를 대면 틀을 쓸 수 있다.' : map.hint);
        break;
      case 'reeds': {
        const ids = available('JS', game.gear === 'lens' ? 2 : 1),
          id = ids.find((k) => !s.flags[k]) || ids[0];
        if (!id) {
          say('갈대에 시야가 가린다. 발판이나 높은 둑으로 이동하자.');
          break;
        }
        note(
          id,
          id === 'J'
            ? '수면 가까이, 상자가 갈대 사이에 놓여 있다. 출 2:3'
            : '누이가 떨어져 지켜본다. 바로의 딸이 상자를 열었다. 출 2:4–6'
        );
        if (s.flags.J && s.flags.S) finish('먼저 관찰한 자리 · ' + map.signs[s.notes[0]]);
        break;
      }
      case 'frogs':
        takePhoto();
        break;
      case 'sea': {
        if (!s.flags.A && !s.flags.H && s.x === sites['@'].x && s.y === sites['@'].y) {
          location.hash = 'crossing-journey';
          break;
        }
        if (near('E') && s.flags.A && s.flags.H) {
          celebrate();
          break;
        }
        const id = available('AH').find((k) => !s.flags[k]);
        if (id) note(id, '일행이 뒤따른다. 발자국이 하나 더 이어졌다.');
        else say(near('E') ? '건너편이다. 두 갈래에 남은 동료부터 찾자.' : map.hint);
        break;
      }
      case 'desert':
        if (near('E')) finish('남은 물 ' + s.water + '모금 · 들른 차양 ' + Object.keys(s.used).length + '곳');
        else if (tile(s.x, s.y) === ':') {
          const id = s.x + ',' + s.y;
          if (s.used[id]) {
            say('이 차양에 남겨 둔 물은 이미 챙겼다.');
            break;
          }
          snapshot();
          s.used[id] = true;
          s.water = Math.min(game.gear === 'flask' ? 5 : 3, s.water + 2);
          s.heat = 0;
          save();
          refresh();
          say('쉬면서 물을 보충했다.');
        } else
          say(
            cellShade(s.x, s.y)
              ? '지금 그늘에 서 있다. 해가 움직이기 전에 다음 길을 고르자.'
              : '현재 볕이 든 자리다. 차양 아래에서 물을 채울 수 있다.'
          );
        break;
      case 'ridge': {
        if (s.notes.length === 3) {
          reconstruct();
          break;
        }
        const ids = available('RTV'),
          id = ids.find((k) => !s.flags[k]) || ids[0];
        if (!id) {
          say(map.hint);
          break;
        }
        if (id === 'V' && dist(s, sites.V) > 0) {
          say('소리만 닿는다. 여호수아는 싸움, 모세는 노래로 들었다. 고갯마루 위에 직접 서 보자.', 5500);
          break;
        }
        note(id, proof[id]);
        panel(
          map.ref,
          map.signs[id],
          proof[id],
          [
            [
              s.notes.length === 3 ? '세 기록 재구성' : '지도 돌아가기',
              () => (s.notes.length === 3 ? reconstruct() : close())
            ]
          ],
          (box, ops) => {
            if (id === 'V') {
              const im = newEl('img');
              im.className = 'rd-witness';
              im.src = assets.tablets;
              im.alt = '산기슭 돌판 너머로 보이는 송아지와 진영';
              box.insertBefore(im, ops);
            }
          }
        );
        break;
      }
      case 'years': {
        const id = available('XYE')[0];
        if (!id) {
          say(map.hint);
          break;
        }
        if (id === 'E') {
          if (s.flags.X && s.flags.Y) finish('두 야영지를 지나 긴 행군을 마쳤다.');
          else say('이 길 앞에 아직 모이지 않은 일행이 있다.');
          break;
        }
        if (id === 'Y' && !s.flags.X) {
          say('첫 야영지의 일행이 아직 도착하지 않았다.');
          break;
        }
        if (s.flags[id]) {
          say('이곳을 떠난 기록이 남아 있다.');
          break;
        }
        if (!s.flags[id + 'rest'] && cloudUp()) {
          snapshot();
          spendTurn();
          save();
          refresh();
          say('도착한 탐험대가 다음 구름을 기다린다.');
          break;
        }
        if (!s.flags[id + 'rest']) {
          snapshot();
          s.flags[id + 'rest'] = true;
          spendTurn();
          save();
          refresh();
          say('구름이 머물러 진을 쳤다. 다음 하늘을 살피자.');
          break;
        }
        if (cloudUp()) {
          note(id, '구름이 떠올랐다. 일행이 길을 나선다.');
        } else {
          snapshot();
          spendTurn();
          save();
          refresh();
          say('구름이 아직 머문다. 한 차례 기다렸다.');
        }
        break;
      }
    }
  }
  function celebrate() {
    let beats = 0;
    panel(
      '홍해 건너편',
      '바람 뒤에 남은 소리',
      '두 동료와 건넜다. 소고로 세 박자를 건네자.',
      [],
      (box, ops) => {
        const pad = btn('소고 치기', () => {
          beats++;
          pad.textContent = '둥  ' + beats + '/3';
          if (game.sound) {
            try {
              beatAudio ||= new AudioContext();
              const o = beatAudio.createOscillator(),
                a = beatAudio.createGain();
              o.connect(a);
              a.connect(beatAudio.destination);
              o.frequency.setValueAtTime(128, beatAudio.currentTime);
              o.frequency.exponentialRampToValueAtTime(45, beatAudio.currentTime + 0.18);
              a.gain.setValueAtTime(0.17, beatAudio.currentTime);
              a.gain.exponentialRampToValueAtTime(0.001, beatAudio.currentTime + 0.2);
              o.start();
              o.stop(beatAudio.currentTime + 0.21);
            } catch {}
          }
          if (beats === 3) finish('두 갈래의 동료와 함께 건넜다.');
        });
        ops.append(pad);
        pad.focus();
      }
    );
  }
  let beatAudio;
  function journal() {
    panel(
      '출애굽기 원정',
      game.finished ? '길 끝의 기록' : '길에서 남긴 기록',
      game.entries.length ? '' : '아직 첫 현장을 걷고 있다.',
      [['지도 돌아가기', close]],
      (box, ops) => {
        if (game.previous?.length) {
          const last = newEl('details');
          last.append(newEl('summary', '이전 원정의 발자국'));
          for (const [i, v] of game.previous.entries())
            last.append(newEl('p', roadMaps[i].title + ' · ' + (v.extra || v.turn + '걸음')));
          box.insertBefore(last, ops);
        }
        for (const [i, entry] of game.entries.entries()) {
          const d = newEl('details'),
            sum = newEl('summary', roadMaps[i].title + '  ·  ' + roadMaps[i].ref);
          d.append(sum, newEl('p', roadMaps[i].story), newEl('p', entry.extra, 'rd-personal'));
          for (const photo of entry.shots || []) {
            const img = newEl('img');
            img.src = photo.url;
            img.alt = photo.id === 'F' ? '강가의 개구리' : '부엌의 개구리';
            d.append(img);
          }
          box.insertBefore(d, ops);
        }
      }
    );
  }
  function menu() {
    panel('출애굽기', '원정 메뉴', '이 기기에 자동 저장된다.', [
      ['지도 돌아가기', close],
      ['물벽 사이로', () => { location.hash = map.id === 'sea' ? 'crossing-journey' : 'crossing'; }],
      [
        '소리 ' + (game.sound ? '끄기' : '켜기'),
        () => {
          game.sound = !game.sound;
          save();
          tune();
          menu();
        },
        'minor'
      ],
      ...(map.id === 'frogs'
        ? [
            [
              '도약 한 동작씩 ' + (manual ? '끄기' : '켜기'),
              () => {
                manual = !manual;
                close();
                refresh();
                say(
                  manual
                    ? 'F 또는 한 동작 버튼으로 개구리를 한 프레임씩 움직인다.'
                    : '개구리가 다시 움직인다.'
                );
              },
              'minor'
            ]
          ]
        : []),
      ...(game.practice
        ? [['원정 복귀', returnToJourney, 'minor']]
        : game.bestKiln
          ? [['수레 동선 다시 풀기', practice, 'minor']]
          : []),
      ...(!game.finished
        ? [
            [
              '이 현장 다시 시작',
              () =>
                panel('현장 재시도', '출발점으로 돌아갈까?', '앞서 마친 현장과 장비는 보관된다.', [
                  ['다시 시작', restart],
                  ['계속 걷기', close, 'minor']
                ]),
              'minor'
            ]
          ]
        : []),
      ...(game.finished
        ? [
            [
              '다른 장비로 다시 걷기',
              () => {
                const previous = game.entries,
                  best = game.bestKiln;
                const audio = game.sound;
                game = fresh();
                game.previous = previous;
                game.bestKiln = best;
                game.sound = audio;
                close();
                bind();
                save();
                refresh();
                tune();
              },
              'minor'
            ]
          ]
        : []),
      [
        '기존 아홉 현장 열기',
        () => {
          location.hash = 'guided';
        },
        'minor'
      ]
    ]);
  }
  function tickFrog() {
    stop();
    manual = true;
    frogClock += 0.25;
    refresh();
    say('동작을 멈춰 관찰한다. 셔터 또는 F를 누를 수 있다.');
  }
  function help() {
    panel(
      map.place + ' · ' + map.ref,
      '조작과 단서',
      map.hint,
      [
        ['지도 돌아가기', close],
        ...(map.id === 'frogs'
          ? [
              [
                '도약 한 동작씩',
                () => {
                  close();
                  tickFrog();
                },
                'minor'
              ]
            ]
          : [])
      ],
      (box, ops) => {
        box.insertBefore(
          newEl(
            'p',
            '지면을 누르면 빈 길을 따라 걷는다. 수레 바로 옆에서 수레를 누르거나 방향키로 밀 수 있다. 키보드의 Space는 상호작용, Z는 한 수 되돌리기다.',
            'rd-helptext'
          ),
          ops
        );
        box.insertBefore(
          newEl(
            'p',
            '지도·도구·동료의 이동은 탐험대의 재구성이다. 사건의 본문은 기록에서 확인한다.',
            'rd-helptext'
          ),
          ops
        );
      }
    );
  }
  const frameButton = btn('한 동작', tickFrog, 'rd-freeze');
  $('rd-act').after(frameButton);
  $('rd-menu').onclick = menu;
  $('rd-book').onclick = journal;
  $('rd-help').onclick = help;
  $('rd-act').onclick = interact;
  $('rd-undo').onclick = undo;
  $('rd-zoom').onclick = () => {
    zoom = !zoom;
    $('rd-zoom').setAttribute('aria-pressed', String(zoom));
  };
  canvas.addEventListener('click', (e) => {
    const p = art.cellAt(e.clientX, e.clientY);
    if (p) enqueue(p);
  });
  root.querySelectorAll('[data-go]').forEach(
    (b) =>
      (b.onclick = () => {
        stop();
        move(...dirs[b.dataset.go]);
      })
  );
  root.querySelectorAll('[data-go]').forEach((b) => {
    const arrow = newEl('i');
    arrow.setAttribute('aria-hidden', 'true');
    b.replaceChildren(arrow);
  });
  const keys = {
    ArrowUp: 'n',
    w: 'n',
    ArrowRight: 'e',
    d: 'e',
    ArrowDown: 's',
    s: 's',
    ArrowLeft: 'w',
    a: 'w'
  };
  let lastKey = 0;
  addEventListener('keydown', (e) => {
    if (dialog.open || e.ctrlKey || e.metaKey || e.altKey || document.hidden) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (keys[k]) {
      e.preventDefault();
      if (e.repeat && performance.now() - lastKey < stepMs) return;
      lastKey = performance.now();
      stop();
      move(...dirs[keys[k]]);
    } else if (k === 'z') {
      e.preventDefault();
      undo();
    } else if (k === ' ' && (e.target === canvas || e.target === document.body)) {
      e.preventDefault();
      if (!e.repeat) interact();
    } else if (k === 'f' && map.id === 'frogs') {
      e.preventDefault();
      tickFrog();
    }
  });
  addEventListener('hashchange', () => location.reload());
  document.addEventListener('visibilitychange', () => {
    stop();
    prevTime = null;
    tune();
  });
  addEventListener('storage', (e) => {
    if (e.key !== key) return;
    stop();
    if (dialog.open) close();
    game = load();
    bind();
    motion = null;
    refresh();
    tune();
  });
  refresh();
  tune();
  raf = requestAnimationFrame(frame);
  if (location.hash === '#road-arrival' && !game.finished && map.id === 'sea') {
    try {
      const crossing = JSON.parse(localStorage.getItem('onyou.crossing.v1'));
      if (crossing?.ended && crossing.traveler) finish('물벽 사이로 · ' + (crossing.light ? '세 사람' : '두 사람') + '이 함께 건넜다.');
    } catch {}
  } else if (game.finished) journal();
  else if (map.id === 'desert' && s.water < 0) exhausted();
})();
