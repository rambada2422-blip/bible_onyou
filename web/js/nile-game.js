/* 나일강 항해 수첩. 물길과 수집 기록은 기존 성경 탐험 저장에 함께 남는다. */
(function () {
  'use strict';
  const app = BO.app2d, el = app.el;
  const {directions, sail, start, trace, hint} = BO.nileRoutes;
  const last = list => list[list.length - 1];
  // 지도의 놀이와 구분해, 왕궁 본편에서 이미 읽을 수 있는 기록을 순서대로 펼친다.
  const riverPages = [
    {title:'백성의 부르짖음', beat:0}, {title:'모세와 아론의 부탁', beat:1},
    {title:'바로의 대답', beat:2}, {title:'강가에서 물을 찾는 사람들', beat:5}
  ];

  const lockPages = [
    {title:'강에서 온 경고', beat:0}, {title:'바로의 약속', beat:2}, {title:'개구리가 떠난 뒤', beat:5}
  ];

  function open(leave, selected) {
    const requested = new URLSearchParams(location.search).get('course');
    const course = selected || (['locks', 'river'].includes(requested) ? requested : app.state.nileCourse);
    const isLockCourse = course === 'locks';
    const routes = isLockCourse ? BO.nileRoutes.locks : BO.nileRoutes.routes;
    const pages = isLockCourse ? lockPages : riverPages;
    const storageKey = isLockCourse ? 'nileLocks' : 'nile';
    const old = app.state[storageKey] || {};
    const records = routes.map((route, i) => {
      const oldRecord = old.records?.[i];
      return oldRecord && Number.isSafeInteger(oldRecord.best) && oldRecord.best > 0
        ? {best:oldRecord.best, flower:oldRecord.flower === true} : null;
    });
    let unlocked = records.findIndex(record => !record);
    if (unlocked < 0) unlocked = routes.length - 1;
    let index = Number.isInteger(old.index) && old.index >= 0 && old.index <= unlocked ? old.index : 0;
    let moves = Array.isArray(old.moves) ? old.moves : [];
    let route = routes[index];
    let path = trace(route, moves);
    moves = moves.slice(0, path.length - 1);
    let moving = 0, sound = old.sound === true, context;
    function heading() { return last(moves.filter(action => action !== 'turn')) || 'up'; }
    let direction = heading(), pointer, animation = 0, firstFocus = true;
    const events = new AbortController();
    function save() {
      app.state.nileCourse = isLockCourse ? 'locks' : 'river';
      app.state[storageKey] = {index, moves, records, sound};
      app.save();
    }
    function button(label, css, action) {
      return el('button', {type:'button', class:css, on:{click:action}}, label);
    }
    function depart() {
      stopMotion(); events.abort(); observer.disconnect();
      if (context) context.close().catch(() => {});
      if (journal.open) journal.close();
    }
    function switchCourse() {
      const target = isLockCourse ? 'river' : 'locks';
      if (requested) {
        const url = new URL(location.href);
        url.searchParams.set('course', target);
        try { history.replaceState(null, '', url); } catch (_) { /* 파일의 주소 변경이 제한될 수 있다. */ }
      }
      depart();
      open(leave, target);
    }
    const back = button('왕궁 이야기', 'river-nav-link', () => { depart(); leave(); });
    const journalButton = button('항해 일지', 'river-nav-link', openJournal);
    const soundButton = button('', 'river-tool', () => {
      sound = !sound; save(); updateSound();
      if (sound) tone(440);
    });
    function updateSound() {
      soundButton.textContent = sound ? '소리 켬' : '소리 끔';
      soundButton.setAttribute('aria-pressed', String(sound));
    }
    function tone(frequency, delay = 0) {
      if (!sound) return;
      try {
        context ||= new (window.AudioContext || window.webkitAudioContext)();
        if (context.state === 'suspended') context.resume().catch(() => {});
        const osc = context.createOscillator(), gain = context.createGain();
        const t = context.currentTime + delay;
        osc.type = 'sine'; osc.frequency.setValueAtTime(frequency, t);
        gain.gain.setValueAtTime(.001, t); gain.gain.exponentialRampToValueAtTime(.07, t + .018);
        gain.gain.exponentialRampToValueAtTime(.001, t + .23);
        osc.connect(gain); gain.connect(context.destination);
        osc.start(t); osc.stop(t + .25);
      } catch (_) { /* 음향 장치 없이도 항해할 수 있다. */ }
    }

    const routeNo = el('p', {class:'river-kicker'});
    const name = el('h1', {tabindex:'-1', class:'river-name'});
    const status = el('p', {class:'river-status', role:'status', 'aria-live':'polite'});
    const counter = el('span'), flower = el('span');
    const canvas = el('canvas', {class:'river-canvas', role:'img'});
    const board = el('div', {class:'river-map'}, canvas);
    const highlights = el('div', {class:'river-gate-highlights', 'aria-hidden':'true'});
    board.append(highlights);
    function signalGates() {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      highlights.replaceChildren(...route.gates.map(gate => {
        const ring = el('i', {class:'river-gate-ring'});
        ring.style.left = ((gate.x + .5) * 100 / route.rows[0].length) + '%';
        ring.style.top = ((gate.y + .5) * 100 / route.rows.length) + '%';
        ring.addEventListener('animationend', () => ring.remove(), {once:true});
        return ring;
      }));
    }
    const directionsBar = el('div', {class:'river-pad', role:'group', 'aria-label':'노 젓기'});
    const keys = {};
    for (const [key, info] of Object.entries(directions)) {
      keys[key] = button(info.arrow, 'river-key key-' + key, () => move(key));
      keys[key].setAttribute('aria-label', info.label + ' 방향으로 노 젓기');
      directionsBar.append(keys[key]);
    }
    const wheel = button('바퀴 돌리기', 'river-wheel', () => move('turn'));
    wheel.setAttribute('aria-keyshortcuts', 'G');
    const gateState = el('span', {class:'river-gate-state'});
    const gatePanel = el('div', {class:'river-gate-panel', hidden:true}, gateState, wheel);
    const undo = button('한 수 되돌리기', 'river-tool', undoMove);
    const assist = button('물길 힌트', 'river-tool', () => {
      const dir = hint(route, last(path));
      if (!dir) return;
      if (dir === 'turn') {
        wheel.classList.add('river-hinted');
        status.textContent = '지금 이 자리에서 바퀴를 한번 돌려 보세요.';
      } else {
        keys[dir].classList.add('river-hinted');
        status.textContent = '나루로 가려면 ' + directions[dir].label + ' 방향으로 저어 봐요.';
      }
    });
    const tools = el('div', {class:'river-tools'}, undo, assist, soundButton);
    const goal = el('p', {class:'river-goal'}, '노를 저으면 갈대밭이나 강가까지 미끄러져요. 노란 깃발에 닿으세요.');
    const controls = el('div', {class:'river-controls'}, gatePanel, directionsBar,
      el('p', {class:'river-input-note'}, '방향 단추 · 밀기 · 방향키'));
    const result = el('section', {class:'river-result', hidden:true});
    const journal = el('dialog', {class:'river-journal', 'aria-label':'항해 일지'});
    const screen = el('main', {class:isLockCourse ? 'river-screen river-locks' : 'river-screen'},
      el('nav', {class:'river-nav'}, back, el('span', {}, '나일강 탐험대'), journalButton),
      el('div', {class:'river-layout'},
        el('div', {class:'river-chart'}, routeNo, name, board,
          el('div', {class:'river-stats'}, counter, flower)),
        el('section', {class:'river-cockpit'}, goal, controls, result, status, tools)),
      journal);
    app.show(screen);
    screen.parentElement.classList.add('river-app');

    function openJournal(revealIndex) {
      if (journal.open) return;
      const list = el('ol', {class:'river-log-list'});
      routes.forEach((r, i) => {
        const rec = records[i];
        const item = el('li', {}, el('strong', {}, r.name), el('span', {}, rec
          ? '가장 짧은 항해 ' + rec.best + '수 · ' + (rec.flower ? '연꽃 기록' : '연꽃 미발견')
          : i === index ? '항해 중' : '미탐험'));
        if (rec) {
          const page = pages[i], beat = BO.palaceChapters[isLockCourse ? 1 : 0].beats[page.beat];
          const detail = el('details', {class:'river-entry'},
            el('summary', {}, page.title), el('p', {}, beat.words), app.refChip(beat.ref, true));
          detail.open = revealIndex === i;
          item.append(detail);
        }
        if (rec && last(path).arrived && i !== index) {
          item.append(button('다시 항해', 'river-tool', () => { journal.close(); begin(i); }));
        }
        list.append(item);
      });
      journal.replaceChildren(el('h2', {}, isLockCourse ? '수문 항해 일지' : '항해 일지'),
        button(isLockCourse ? '첫 네 물길로' : '수문 탐험으로', 'river-course-link', switchCourse), list, button('물길로 돌아가기', 'river-primary', () => journal.close()));
      journal.showModal();
    }
    journal.addEventListener('close', () => journalButton.focus({preventScroll:true}));
    function stopMotion() {
      if (animation) cancelAnimationFrame(animation);
      animation = 0; moving = 0;
    }
    function paint(pos = last(path), found = pos.found) {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!(w && h)) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(w * dpr), height = Math.round(h * dpr);
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      const ctx = canvas.getContext('2d');
      ctx.setTransform(width / route.rows[0].length, 0, 0, height / route.rows.length, 0, 0);
      BO.drawNileBoard(ctx, {rows:route.rows, boat:pos, lotus:route.lotus, dock:route.dock, direction, found, gateOpen:last(path).gateOpen});
    }
    const observer = new ResizeObserver(() => { if (!moving) paint(); });
    observer.observe(canvas);
    function describe() {
      const p = last(path);
      const coord = point => (point.y + 1) + '행 ' + (point.x + 1) + '열';
      let mapLabel = '배 ' + coord(p) + ', 나루 ' + coord(route.dock) + ', 연꽃 ' + coord(route.lotus);
      if (isLockCourse) {
        const atWheel = route.rows[p.y][p.x] === 'T';
        const gold = p.gateOpen ? '황금 수문 열림' : '황금 수문 닫힘';
        const blue = route.paired ? (p.gateOpen ? ' · 푸른 수문 닫힘' : ' · 푸른 수문 열림') : '';
        gatePanel.hidden = false;
        gateState.textContent = gold + blue;
        wheel.disabled = !atWheel || moving || p.arrived;
        wheel.classList.remove('river-hinted');
        const gates = route.gates.map(g => (g.type === 'A' ? '황금 수문 ' : '푸른 수문 ') + coord(g));
        mapLabel += ', 바퀴 ' + route.wheels.map(coord).join(', ') + ', ' + gates.join(', ') + ', ' + gold + blue;
      }
      canvas.setAttribute('aria-label', mapLabel);
      counter.textContent = (isLockCourse ? '항해  ' : '노 젓기  ') + moves.length + '수';
      flower.textContent = p.found ? '✿  연꽃 발견' : '✿  연꽃 미발견';
      flower.classList.toggle('flower-found', p.found);
      for (const [dir, key] of Object.entries(keys)) {
        key.setAttribute('aria-disabled', String(!sail(route, p, dir)));
        key.classList.remove('river-hinted');
      }
      undo.disabled = moves.length === 0;
      assist.disabled = p.arrived;
    }
    function showStage() {
      highlights.replaceChildren();
      routeNo.textContent = (isLockCourse ? '수문 탐험' : '나일강 물길') + '  ·  ' +
        String(index + 1).padStart(2, '0') + ' / ' + String(routes.length).padStart(2, '0');
      if (isLockCourse) goal.textContent = route.paired
        ? '바퀴를 돌리면 두 수문이 번갈아 열려요. 노란 깃발로 가 보세요.'
        : '구리 바퀴까지 노를 저으세요. 거기서 수문을 열고 노란 깃발로 가요.';
      name.textContent = route.name;
      board.style.setProperty('--river-cols', route.rows[0].length);
      board.style.setProperty('--river-rows', route.rows.length);
      const atDock = last(path).arrived;
      goal.hidden = controls.hidden = atDock;
      result.hidden = !atDock;
      if (atDock) {
        const next = index < routes.length - 1
          ? button('다음 물길', 'river-primary', () => begin(index + 1))
          : button('완성한 항해 일지', 'river-primary', openJournal);
        result.replaceChildren(el('h2', {}, '나루에 도착했어요!'),
          el('p', {}, last(path).found ? '이번 물길의 연꽃을 일지에 그렸어요.' : '연꽃을 지나는 또 다른 길도 있어요.'),
          next, button('이 물길 다시 타기', 'river-tool', () => begin(index)));
        result.append(button('발견한 기록 · ' + pages[index].title, 'river-discovery', () => openJournal(index)));
        if (index === routes.length - 1) {
          result.append(button(isLockCourse ? '첫 네 물길로' : '수문 탐험으로', 'river-course-link', switchCourse));
        }
        if (!firstFocus) next.focus({preventScroll:true});
      }
      status.textContent = atDock ? '' : '연꽃을 지나 나루에 닿으면 일지에 꽃이 남아요.';
      describe(); paint(); updateSound();
      if (firstFocus) name.focus({preventScroll:true});
      firstFocus = false;
    }
    function begin(i) {
      stopMotion(); route = routes[i]; index = i;
      path = [start(route)]; moves = []; direction = 'up';
      save(); showStage(); name.focus({preventScroll:true});
    }
    function undoMove() {
      if (!moves.length) return;
      stopMotion(); const action = moves.pop(); path.pop(); direction = heading();
      save(); showStage(); status.textContent = action === 'turn' ? '바퀴를 돌리기 전으로 돌아왔어요.' : '노를 젓기 전 자리예요.';
    }
    function move(dir) {
      if (moving || journal.open || last(path).arrived) return;
      const before = last(path), next = sail(route, before, dir);
      if (!next) { status.textContent = '그쪽은 막혔어요. 다른 방향으로 저어 봐요.'; return; }
      moves.push(dir); path.push(next);
      if (dir === 'turn') {
        save(); describe(); paint(); signalGates(); tone(330); tone(440, .08);
        status.textContent = '문이 움직였어요. 다음엔 어디에서 배가 멈출까요?';
        return;
      }
      direction = dir;
      if (next.arrived) {
        const prior = records[index];
        records[index] = {best:Math.min(prior?.best ?? Infinity, moves.length), flower:next.found || !!prior?.flower};
      }
      moving = 1; save(); tone(247); describe();
      const distance = Math.abs(next.x - before.x) + Math.abs(next.y - before.y);
      const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 130 + 64 * distance;
      const started = performance.now();
      function frame(time) {
        const part = duration ? Math.min(1, Math.max(0, (time - started) / duration)) : 1;
        const t = part * (2 - part);
        const pos = {x:before.x + (next.x - before.x) * t, y:before.y + (next.y - before.y) * t};
        const toFlower = Math.abs(route.lotus.x - before.x) + Math.abs(route.lotus.y - before.y);
        paint(pos, before.found || (next.found && t * distance >= toFlower));
        if (part < 1) { animation = requestAnimationFrame(frame); return; }
        animation = 0; moving = 0;
        describe();
        if (next.arrived) { tone(392); tone(523, .13); showStage(); }
        else if (route.rows[next.y][next.x] === 'T') status.textContent = '바퀴에 닿았어요. 돌리거나 그대로 노를 저을 수 있어요.';
        else if (next.found && !before.found) { tone(523); status.textContent = '연꽃을 발견했어요! 이제 나루까지 데려가요.'; }
        else status.textContent = '배가 멈췄어요. 다음 방향을 골라 보세요.';
      }
      frame(started);
    }
    const keyMap = {ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right', w:'up', s:'down', a:'left', d:'right'};
    window.addEventListener('keydown', event => {
      if (journal.open || event.altKey || event.ctrlKey || event.metaKey) return;
      if (isLockCourse && event.key.toLowerCase() === 'g') {
        if (!wheel.disabled && !event.repeat) move('turn');
        return;
      }
      if (!Object.hasOwn(keyMap, event.key)) return;
      event.preventDefault();
      if (!event.repeat) move(keyMap[event.key]);
    }, {signal:events.signal});
    canvas.addEventListener('pointerdown', e => {
      if (!e.isPrimary || e.button !== 0) return;
      pointer = {x:e.clientX, y:e.clientY};
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointercancel', () => { pointer = null; });
    canvas.addEventListener('pointerup', e => {
      if (!pointer || !e.isPrimary) return;
      const dx = e.clientX - pointer.x, dy = e.clientY - pointer.y;
      pointer = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 16) {
        if (isLockCourse && !wheel.disabled) {
          const rect = canvas.getBoundingClientRect();
          const x = Math.floor((e.clientX - rect.left) * route.rows[0].length / rect.width);
          const y = Math.floor((e.clientY - rect.top) * route.rows.length / rect.height);
          if (x === last(path).x && y === last(path).y) move('turn');
        }
        return;
      }
      move(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up');
    });
    if (isLockCourse || selected || app.state.nileCourse) save();
    showStage();
  }
  app.nile = {open};
})();
