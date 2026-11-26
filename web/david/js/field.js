/* 탐험대 수첩 · 두 자리 관찰과 관찰등 */
(function () {
  'use strict';
  const sides = ['왼쪽', '오른쪽'];

  function bounded(value, max, fallback) {
    return Number.isInteger(value) && value >= 0 && value <= max ? value : fallback;
  }

  function positions(values) {
    return Array.isArray(values) ? [...new Set(values.filter(v => v === 0 || v === 1))] : [];
  }

  function lookoutState(raw = {}) {
    return { side: bounded(raw.side, 1, 0), notes: positions(raw.notes), slide: bounded(raw.slide, 100, 10), finished: raw.finished === true };
  }

  function lampState(raw = {}) {
    const fitted = raw.fitted === true && raw.turn === 1;
    return { turn: bounded(raw.turn, 3, 0), last: bounded(raw.last, 3, null),
      fitted, lit: fitted ? bounded(raw.lit, 1, null) : null, order: fitted ? positions(raw.order) : [], finished: raw.finished === true };
  }

  function button(el, id, label, click) {
    return el('button', { type: 'button', class: 'field-button', 'data-field-action': id, on: { click } }, label);
  }

  function lookoutWindow(ctx, side) {
    const el = ctx.el;
    const window = el('div', { class: 'lookout-window', 'aria-hidden': 'true' },
      el('img', { class: 'lookout-hills', src: 'media/david-hills.webp', alt: '', draggable: 'false' }),
      el('img', { class: 'lookout-objects', src: 'media/lookout-objects.webp', alt: '', draggable: 'false' }),
      el('span', { class: 'lookout-curtain' }));
    window.style.setProperty('--side', side);
    return window;
  }

  function lastRecord(ctx, sc) {
    const entry = ctx.state.journal[sc.id];
    return entry && entry.fieldNote ? ctx.el('p', { class: 'field-memory', text: '지난 수첩 · ' + entry.fieldNote }) : null;
  }

  function record(ctx, sc, round, note) {
    round.finished = true;
    ctx.recordDiscovery(sc, '『탐험대 이야기』 ' + note);
    ctx.state.journal[sc.id].fieldNote = note;
    ctx.state.step = 'done';
    ctx.saveState();
    ctx.render();
  }

  function procession(ctx, sc, pages) {
    const el = ctx.el, data = ctx.state.lookout;
    const scene = lookoutWindow(ctx, data.side);
    const feedback = el('p', { class: 'field-feedback', role: 'status' });
    const viewButtons = sides.map((side, index) => button(el, 'side-' + index, side + ' 자리', () => move(index)));
    const views = el('div', { class: 'field-controls', on: { keydown: ev => {
      if (!['ArrowLeft', 'ArrowRight'].includes(ev.key)) return;
      ev.preventDefault();
      const side = Number(ev.key === 'ArrowRight');
      move(side);
      viewButtons[side].focus();
    } } }, viewButtons);
    const capture = button(el, 'trace', '이 자리 기록하기', () => {
      if (!data.notes.includes(data.side)) data.notes.push(data.side);
      ctx.saveState();
      update();
      if (data.notes.length === 2) desk.focus();
      else viewButtons[1 - data.side].focus();
    });

    const desk = el('div', { class: 'overlay-desk', tabindex: '0', role: 'group',
      'aria-label': '온우의 두 기록. 종이를 끌거나 종이와 가운데 표식을 차례로 눌러요.' },
      el('div', { class: 'record-paper paper-fixed' }, lookoutWindow(ctx, 1)),
      el('div', { class: 'record-paper paper-moving' }, lookoutWindow(ctx, 0)),
      el('span', { class: 'paper-target', 'aria-hidden': 'true', text: '＋' }));
    const slider = el('input', { type: 'range', min: '0', max: '100', value: data.slide,
      'aria-label': '두 기록 겹치기', on: { input: ev => setSlide(Number(ev.target.value)) } });
    const overlay = el('div', { class: 'field-overlay' },
      el('p', { text: '온우와 두 장의 ＋를 맞춰요. 종이를 끌거나 종이와 가운데 ＋를 차례로 눌러요.' }), desk, slider);
    const evidence = el('div', { class: 'field-evidence' },
      pages.map(pg => el('p', {}, el('span', { class: 'field-note-symbol', html: ctx.ART.icon(pg.icon) }),
        el('strong', { text: pg.ref }), ' · ' + pg.fact)),
      button(el, 'keep-views', '일지에 두 자리 기록하기', () => {
        const order = data.notes.map(i => sides[i] + ' 자리').join(' → ');
        record(ctx, sc, data, order + '에서 본 궤와 장막의 기록을 포개었어요.');
      }));
    let drag = null, armed = false;
    function setSlide(value) {
      const n = Math.min(100, Math.max(0, Math.round(value)));
      data.slide = n;
      ctx.saveState();
      update();
    }
    desk.addEventListener('pointerdown', ev => {
      if (!ev.isPrimary || ev.button !== 0) return;
      ev.preventDefault();
      drag = { id: ev.pointerId, x: ev.clientX, start: data.slide, moved: false };
      desk.setPointerCapture(ev.pointerId);
    });
    desk.addEventListener('pointermove', ev => {
      if (!drag || drag.id !== ev.pointerId) return;
      const dx = ev.clientX - drag.x;
      if (Math.abs(dx) > 4) drag.moved = true;
      if (drag.moved) setSlide(drag.start + dx / desk.clientWidth * 100 / 0.64);
    });
    desk.addEventListener('pointerup', ev => {
      if (!drag || drag.id !== ev.pointerId) return;
      const tap = !drag.moved;
      drag = null;
      if (!tap) { armed = false; return; }
      const box = desk.getBoundingClientRect();
      if (armed && Math.abs((ev.clientX - box.left) / box.width - 0.5) < 0.18) {
        armed = false;
        setSlide(50);
      } else {
        armed = true;
        feedback.textContent = '종이를 잡았어요. 가운데 ＋를 눌러요.';
      }
    });
    desk.addEventListener('pointercancel', () => { drag = null; armed = false; });

    function move(side) {
      data.side = side;
      ctx.saveState();
      update();
    }
    function update() {
      scene.style.setProperty('--side', data.side);
      viewButtons.forEach((btn, i) => btn.setAttribute('aria-pressed', String(i === data.side)));
      const captured = data.notes.includes(data.side);
      capture.disabled = captured;
      capture.textContent = captured ? sides[data.side] + ' 기록함 ✓' : '이 자리 기록하기';
      overlay.hidden = data.notes.length !== 2;
      evidence.hidden = overlay.hidden || Math.abs(data.slide - 50) > 3;
      slider.value = data.slide;
      desk.style.setProperty('--shift', ((data.slide - 50) * 0.64) + '%');
      desk.classList.toggle('aligned', !evidence.hidden);
      feedback.textContent = !evidence.hidden ? '두 표식이 만났어요. 수첩에 장절이 열렸어요.'
        : overlay.hidden ? sides[data.side] + ' 자리 · ' + pages[data.side].title + (captured ? ' ✓ 다른 자리에서도 기록해요.' : ' · 이 단서를 기록해요.')
          : '두 자리의 기록을 모았어요.';
    }
    update();
    const film = el('details', { class: 'lookout-film' },
      el('summary', { text: '두 자리 관찰 영상 보기' }),
      el('video', { controls: true, playsinline: true, muted: true, preload: 'none',
        'aria-label': '왼쪽과 오른쪽에서 본 궤와 장막', poster: 'media/lookout-poster.webp', src: 'media/lookout.mp4' }));
    film.addEventListener('toggle', () => { if (!film.open) film.querySelector('video').pause(); });
    return el('section', { class: 'field-panel', 'data-field': sc.id },
      el('div', { class: 'field-heading' }, el('h2', { text: '행렬을 보는 두 자리' }), el('small', { text: '탐험대 이야기' })),
      scene, views, capture, feedback, overlay, evidence, lastRecord(ctx, sc), film);
  }

  function lamp(ctx, sc, cards) {
    const el = ctx.el, data = ctx.state.lamp;
    const joint = el('span', { class: 'lamp-joint' });
    const diagram = el('div', { class: 'lamp-wiring', role: 'img' },
      el('span', { class: 'lamp-lead' }), joint, el('span', { class: 'lamp-socket' }),
      el('span', { class: 'lamp-head' }));
    const readout = el('p', { class: 'field-feedback', role: 'status' });
    const rotate = button(el, 'rotate', '조각 돌리기 ↻', () => {
      data.last = data.turn;
      data.turn = (data.turn + 1) % 4;
      commit();
    });
    const undo = button(el, 'undo', '한 번 되돌리기', () => {
      data.turn = data.last;
      data.last = null;
      commit();
    });
    const fit = button(el, 'fit', '홈에 끼우기', () => {
      if (data.turn !== 1) { readout.textContent = '선 끝을 왼쪽 선과 아래 홈에 맞춰요.'; return; }
      data.fitted = true;
      commit();
      targets[0].focus();
    });
    const targets = cards.map((card, index) => button(el, 'light-' + index,
      el('span', {}, el('span', { class: 'lamp-clue-icon', html: ctx.ART.icon(card.icon) }), card.title),
      () => {
        data.lit = index;
        if (!data.order.includes(index)) data.order.push(index);
        commit();
      }));
    const spread = el('div', { class: 'lamp-pages' }, targets);
    const refs = el('div', { class: 'field-evidence' });
    const keep = button(el, 'keep-light', '관찰 순서를 일지에 남기기', () => {
      record(ctx, sc, data, data.order.map(i => cards[i].title).join(' → ') + ' 순서로 빛을 비추었어요.');
    });
    function commit() { ctx.saveState(); update(); }
    function update() {
      joint.style.transform = 'rotate(' + ((data.turn - 1) * 90) + 'deg)';
      diagram.classList.toggle('lit', data.fitted);
      const directions = ['아래·오른쪽', '왼쪽·아래', '위·왼쪽', '오른쪽·위'];
      const line = '조각 끝 방향 · ' + directions[data.turn];
      diagram.setAttribute('aria-label', line);
      rotate.disabled = fit.disabled = data.fitted;
      undo.disabled = data.fitted || data.last === null;
      spread.classList.toggle('powered', data.fitted);
      spread.style.setProperty('--beam-end', data.lit === 1 ? '77%' : data.lit === 0 ? '23%' : '50%');
      targets.forEach((btn, i) => {
        btn.disabled = !data.fitted;
        btn.setAttribute('aria-pressed', String(data.lit === i));
      });
      refs.replaceChildren(...data.order.map((i, n) => el('p', {},
        el('strong', { text: (n + 1) + '. ' + cards[i].title }), ' · ' + cards[i].ref)));
      refs.hidden = !data.order.length;
      keep.hidden = data.order.length !== 2;
      readout.textContent = !data.fitted ? line + ' · 왼쪽 선과 아래 홈을 이어요.'
        : data.lit === null ? '등이 켜졌어요. 먼저 비출 그림을 골라요.' : cards[data.lit].title + ' · ' + cards[data.lit].ref;
    }
    update();
    return el('section', { class: 'field-panel lamp-panel', 'data-field': sc.id },
      el('div', { class: 'field-heading' }, el('h2', { text: '휴의 관찰등' }), el('small', { text: '탐험대 이야기' })),
      diagram, el('div', { class: 'field-controls' }, rotate, undo, fit), readout, spread, refs, keep, lastRecord(ctx, sc));
  }

  const hints = {
    'temple-gifts': ['휴 · 그림에서 비추고 싶은 곳을 골라 봐.', '밝아진 모습을 수첩에 담아 봐.', '다른 곳을 비춰 봐. 세 모습을 담으면 물음이 열려.'],
    D08: ['온우 · 지도에서 먼저 살펴보고 싶은 곳을 눌러 봐.', '다른 곳을 누르면 방문 순서대로 선이 이어져.', '숫자가 없는 곳을 찾아봐. 세 곳을 잇고 나면 물음이 열려.'],
    D07: ['휴 · 식탁에 놓인 둥근 빵을 찾아봐.', '그릇 안에 보랏빛 포도가 보여.', '식탁 앞에 걸친 천의 줄무늬도 살펴봐.'],
    D05: ['휴 · 그림 한 장과 단서 한 장을 뒤집어 봐.', '첫 번째 만남과 나중 만남의 장절이 달라.', '장소 그림과 짝이 되는 단서도 있어.'],
    D04: ['휴 · 종이 위를 왼쪽에서 오른쪽으로 문질러 봐.', '아직 옅은 곳을 찾아 손가락을 움직여 봐.', '위쪽, 가운데, 아래쪽 단추로도 탁본을 뜰 수 있어.'],
    D03: ['휴 · 동그란 화살표가 있는 조각을 눌러 봐.', '푸른 천과 두 친구의 손이 이어지게 돌려 봐.', '완성 그림을 한 번 펼쳐서 비교해 봐.'],
    D01: ['최온 · 양이 가운데 보이면 수첩에 담아 봐.', '양옆의 화살표로도 들판을 둘러볼 수 있어.', '올리브나무와 돌담, 바위 곁을 살펴봐.'],
    D02: ['최온 · 화살표를 누르면 자리가 바뀌어.', '사진 찍기를 눌러 지금 보이는 돌을 담아 봐.', '다른 자리에서도 찍고 수첩에 넣을 한 장을 골라 봐.'],
    D06: ['온우 · 지금 자리에서 보이는 단서를 기록해 봐.', '다른 자리로 옮겨 한 번 더 기록해 봐.', '두 기록의 ＋가 만나도록 종이를 옮겨 봐.'],
    D09: ['휴 · 왼쪽 선과 아래 홈을 살펴봐.', '조각을 돌려 두 끝이 맞으면 끼워 봐.', '불이 켜지면 두 그림에 차례로 비춰 봐.']
  };
  let hintTimers = [], activeKey = '', acted = false;
  function clearTimers() { hintTimers.forEach(clearTimeout); hintTimers = []; }
  function attachHints(ctx, panel, sceneId) {
    clearTimers();
    const activity = panel && (panel.dataset.hints || sceneId);
    const key = panel ? activity + ctx.state.ageTier : '';
    if (key !== activeKey) { activeKey = key; acted = false; }
    if (!panel) return;
    const el = ctx.el;
    let index = 0;
    const note = el('span', { role: 'status' });
    function reveal() {
      note.textContent = hints[activity][index];
      index = (index + 1) % hints[activity].length;
    }
    const help = button(el, 'hint', '동료 힌트', reveal);
    const hintRow = el('div', { class: 'field-hint' }, help, note);
    panel.querySelector('.field-feedback, .brook-camera-status').after(hintRow);
    function cancel() { acted = true; clearTimers(); }
    panel.addEventListener('click', cancel, true);
    panel.addEventListener('pointerdown', cancel, true);
    panel.addEventListener('keydown', ev => { if (ev.key !== 'Tab') cancel(); }, true);
    if (!acted) {
      const waits = { t1: [10, 20, 30], t2: [15, 30, 45], t3: [25] };
      hintTimers = waits[ctx.state.ageTier].map(sec => setTimeout(reveal, sec * 1000));
    }
  }
  window.BO_DAVID.field = { procession, lamp, lookoutState, lampState, attachHints };
})();
