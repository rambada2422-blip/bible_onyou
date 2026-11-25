/* D09 성전을 위해 드린 예물 · 예루살렘에서 드린 예물과 기뻐하는 백성의 세 모습을 비춰 수첩에 담는다. */
(function () {
  'use strict';
  const art = 'media/temple-gifts.webp';
  const stops = [
    { id: 'vessels', name: '금과 은 예물', ref: '대상 29:6–7', note: '지도자들이 성전을 위해 기쁜 마음으로 드린 금과 은이에요.', x: 23, y: 60 },
    { id: 'rejoice', name: '함께 기뻐한 백성', ref: '대상 29:9', note: '백성과 다윗 왕이 기쁜 마음으로 드리며 크게 기뻐했어요.', x: 50, y: 38 },
    { id: 'materials', name: '성전 건축 재료', ref: '대상 29:2, 7–8', note: '성전을 짓기 위해 모은 돌과 나무와 여러 재료예요.', x: 82, y: 62 }
  ];

  function orderFor(dir) {
    return dir === 'reverse' ? [2, 1, 0] : [0, 1, 2];
  }

  function restore(raw) {
    raw = raw || {};
    const dir = raw.dir === 'reverse' ? 'reverse' : 'forward';
    const order = orderFor(dir);
    const focus = Number.isInteger(raw.focus) && raw.focus >= 0 && raw.focus < stops.length ? raw.focus : order[0];
    const shots = [];
    for (const id of Array.isArray(raw.shots) ? raw.shots : []) {
      if (typeof id === 'string' && stops.some(s => s.id === id) && shots.indexOf(id) === -1) shots.push(id);
    }
    return { dir, focus, shots, finished: raw.finished === true && shots.length === stops.length };
  }

  function next(prev) {
    const dir = prev && prev.dir === 'forward' ? 'reverse' : 'forward';
    return restore({ dir });
  }

  function position(node, x, y) {
    node.style.setProperty('--well-x', x + '%');
    node.style.setProperty('--well-y', y + '%');
  }

  function collection(el, shots) {
    const ordered = shots.map(id => stops.find(s => s.id === id))
      .concat(stops.filter(s => shots.indexOf(s.id) === -1));
    return el('ol', { class: 'table-collection well-collection gifts-collection', 'aria-label': '성전 예물 빛수첩' }, ordered.map((stop, i) => {
      const done = shots.indexOf(stop.id) !== -1;
      const tile = el('li', { class: done ? 'collected' : '' },
        done ? el('span', { class: 'well-crop gifts-crop' }, el('img', { src: art, alt: '' })) : null,
        el('span', { class: 'table-caption', text: (done ? (i + 1) + '. ' : '') + stop.name }));
      if (done) position(tile, stop.x, stop.y);
      return tile;
    }));
  }

  function journal(el, rawShots) {
    const { shots } = restore({ shots: rawShots });
    if (shots.length !== stops.length) return null;
    return el('details', { class: 'table-keepsake well-keepsake gifts-keepsake' },
      el('summary', { text: '내가 비춘 성전 예물 세 장면' }),
      collection(el, shots));
  }

  function render(ctx, sc, choices) {
    const el = ctx.el, run = ctx.state.templeGifts;
    const count = el('span', { class: 'table-count' });
    const feedback = el('p', { class: 'field-feedback', role: 'status', 'aria-atomic': 'true' });
    const pins = stops.map((stop, idx) => {
      const pin = el('button', {
        type: 'button',
        class: 'well-pin gifts-pin',
        'data-gifts-pin': stop.id,
        'aria-label': stop.name + ' (' + stop.ref + ')',
        on: { click: () => {
          if (run.shots.length === stops.length) return;
          if (run.focus === idx && run.shots.indexOf(stop.id) === -1) {
            capture();
          } else {
            run.focus = idx;
            ctx.saveState();
            paint();
          }
        } }
      }, el('span', { class: 'well-pin-dot', 'aria-hidden': 'true' }), el('span', { class: 'well-pin-label', text: stop.name }));
      pin.style.left = stop.x + '%';
      pin.style.top = stop.y + '%';
      return pin;
    });

    const board = el('div', { class: 'well-board gifts-board', role: 'group', 'aria-label': '성전을 위해 드린 예물과 기뻐하는 백성 관찰판' },
      el('img', { class: 'table-art', src: art, draggable: 'false', alt: '성전을 위해 드린 금과 은 예물과 함께 기뻐하는 백성 삽화' }),
      pins);

    board.addEventListener('keydown', event => {
      if (run.shots.length === stops.length) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        stepFocus(1);
        pins[run.focus].focus();
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        stepFocus(-1);
        pins[run.focus].focus();
      }
    });

    const move = el('button', { type: 'button', class: 'btn plain', 'data-gifts-action': 'move', on: { click: () => stepFocus(1) } }, '다음 모습 비추기');
    const take = el('button', { type: 'button', class: 'btn brass', 'data-gifts-action': 'take', on: { click: capture } }, '수첩에 담기');
    const controls = el('div', { class: 'table-controls' }, move, take);
    const notebook = el('div', { class: 'table-notebook' });
    const title = el('h3', { tabindex: '-1', text: sc.question });
    const question = el('section', { class: 'robe-question table-question' },
      el('span', { class: 'ref', text: sc.ref }), title, el('div', { class: 'choices' }, choices));

    function stepFocus(delta) {
      const order = orderFor(run.dir);
      const pos = order.indexOf(run.focus);
      run.focus = order[(pos + delta + order.length) % order.length];
      ctx.saveState();
      paint();
    }

    function describe() {
      const stop = stops[run.focus];
      const has = run.shots.indexOf(stop.id) !== -1;
      return stop.name + ' (' + stop.ref + ') · ' + (has ? '이미 수첩에 담았어요.' : stop.note);
    }

    function capture() {
      if (run.shots.length === stops.length) return;
      const stop = stops[run.focus];
      if (run.shots.indexOf(stop.id) !== -1) {
        feedback.textContent = stop.name + ' · 이미 수첩에 담았어요. 다른 모습을 골라 보세요.';
        return;
      }
      run.shots.push(stop.id);
      ctx.saveState();
      paint();
      if (run.shots.length === stops.length) {
        feedback.textContent = '세 장면을 모두 담았어요. 이제 지도자들이 기쁜 마음으로 가져온 것을 골라요.';
        title.focus();
      } else {
        feedback.textContent = stop.name + ' 그림을 담았어요.';
      }
    }

    function paint() {
      const solved = run.shots.length === stops.length;
      count.textContent = run.shots.length + ' / ' + stops.length + '곳';
      controls.hidden = solved;
      question.hidden = !solved;
      pins.forEach((pin, idx) => {
        const stop = stops[idx];
        const done = run.shots.indexOf(stop.id) !== -1;
        pin.classList.toggle('active', !solved && run.focus === idx);
        pin.classList.toggle('collected', done);
        pin.disabled = solved;
        pin.setAttribute('aria-pressed', String(done));
      });
      notebook.replaceChildren(collection(el, run.shots));
      if (!solved) feedback.textContent = describe();
    }

    const movie = el('video', { src: 'media/temple-gifts.mp4', poster: art, controls: true, muted: true,
      playsinline: true, preload: 'none', 'aria-label': '성전을 위해 드린 금과 은 예물과 기뻐하는 백성을 살펴보는 자막 영상' });
    const film = el('details', { class: 'lookout-film' }, el('summary', { text: '성전 예물 영상 보기' }), movie);
    film.addEventListener('toggle', () => { if (!film.open) movie.pause(); });

    paint();
    return el('section', { class: 'table-panel well-panel gifts-panel', 'data-field': 'D09' },
      el('header', { class: 'table-heading' },
        el('div', {}, el('small', { text: '탐험대 그림 놀이 · ' + (run.dir === 'reverse' ? '재료에서 예물로' : '예물에서 재료로') }),
          el('h2', { text: '성전 예물 빛수첩' })),
        count),
      board,
      el('div', { class: 'table-side' }, notebook, feedback, controls, question),
      film);
  }

  window.BO_DAVID.templeGifts = { restore, next, render, journal };
})();
