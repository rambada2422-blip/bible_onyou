/* D08 베들레헴 성문 곁 우물 · 우물에서 아둘람 굴까지 세 지점을 살펴 수첩에 담는다. */
(function () {
  'use strict';
  const art = 'media/well-trail.webp';
  const stops = [
    { id: 'well', name: '성문 곁 우물', ref: '삼하 23:15', note: '베들레헴 성문 곁 돌우물과 물항아리예요.', x: 19, y: 58 },
    { id: 'path', name: '세 사람이 온 길', ref: '삼하 23:16', note: '세 사람이 물을 길어 언덕길을 따라 걸어왔어요.', x: 51, y: 53 },
    { id: 'cave', name: '아둘람 굴 산성', ref: '삼하 23:13–16', note: '다윗이 있던 산성에서 그 물을 여호와께 바쳐 쏟았어요.', x: 83, y: 56 }
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

  function drawTrail(layer, shots) {
    const points = shots.map(id => stops.find(stop => stop.id === id));
    const segments = points.map((stop, i) => {
      if (i === 0) return 'M ' + stop.x + ' ' + stop.y;
      const prev = points[i - 1];
      const midX = (prev.x + stop.x) / 2;
      const midY = Math.min(prev.y, stop.y) - Math.abs(prev.x - stop.x) / 2;
      return 'Q ' + midX + ' ' + midY + ' ' + stop.x + ' ' + stop.y;
    });
    layer.querySelectorAll('path').forEach(path => path.setAttribute('d', segments.join(' ')));
  }

  function trailLayer(el, shots) {
    const layer = el('span', { class: 'well-trail-line', 'aria-hidden': 'true',
      html: '<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path class="trail-border"/><path class="trail-ink"/></svg>' });
    drawTrail(layer, shots);
    return layer;
  }

  function collection(el, shots) {
    const ordered = shots.map(id => stops.find(s => s.id === id))
      .concat(stops.filter(s => shots.indexOf(s.id) === -1));
    return el('ol', { class: 'table-collection well-collection', 'aria-label': '우물 길 그림 수첩' }, ordered.map((stop, i) => {
      const done = shots.indexOf(stop.id) !== -1;
      const tile = el('li', { class: done ? 'collected' : '' },
        done ? el('span', { class: 'well-crop' }, el('img', { src: art, alt: '' })) : null,
        el('span', { class: 'table-caption', text: (done ? (i + 1) + '. ' : '') + stop.name }));
      if (done) position(tile, stop.x, stop.y);
      return tile;
    }));
  }

  function journal(el, rawShots) {
    const { shots } = restore({ shots: rawShots });
    if (shots.length !== stops.length) return null;
    const markers = shots.map((id, i) => {
      const stop = stops.find(item => item.id === id);
      const marker = el('span', { class: 'well-route-number', 'aria-hidden': 'true', text: String(i + 1) });
      position(marker, stop.x, stop.y);
      return marker;
    });
    return el('details', { class: 'table-keepsake well-keepsake' },
      el('summary', { text: '내가 담은 우물 길 세 장면' }),
      el('div', { class: 'well-board' },
        el('img', { class: 'table-art', src: art, alt: '내가 살펴본 순서로 이은 세 지점' }),
        trailLayer(el, shots), markers),
      collection(el, shots));
  }

  function render(ctx, sc, choices) {
    const el = ctx.el, run = ctx.state.wellTrail;
    const count = el('span', { class: 'table-count' });
    const feedback = el('p', { class: 'field-feedback', role: 'status', 'aria-atomic': 'true' });
    const pins = stops.map((stop, idx) => {
      const pin = el('button', {
        type: 'button',
        class: 'well-pin',
        'data-well-pin': stop.id,
        'aria-label': stop.name + ' (' + stop.ref + ')',
        on: { click: () => {
          if (run.shots.length === stops.length) return;
          run.focus = idx;
          capture();
        } }
      }, el('span', { class: 'well-pin-dot', 'aria-hidden': 'true' }), el('span', { class: 'well-pin-label', text: stop.name }));
      pin.style.left = stop.x + '%';
      pin.style.top = stop.y + '%';
      return pin;
    });

    const trail = trailLayer(el, run.shots);
    const board = el('div', { class: 'well-board', role: 'group', 'aria-label': '베들레헴 성문 곁 우물에서 아둘람 굴까지 지도' },
      el('img', { class: 'table-art', src: art, draggable: 'false', alt: '베들레헴 성문 곁 우물과 언덕길, 아둘람 굴 산성 삽화' }),
      trail, pins);

    board.addEventListener('keydown', event => {
      const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      const index = pins.indexOf(event.target);
      if (!delta || index < 0 || run.shots.length === stops.length) return;
      event.preventDefault();
      moveTo(index + delta);
      pins[run.focus].focus();
    });

    const move = el('button', { type: 'button', class: 'btn plain', 'data-well-action': 'move', on: { click: () => moveTo(run.focus + (run.dir === 'reverse' ? -1 : 1)) } }, '다음 지점 보기');
    const take = el('button', { type: 'button', class: 'btn brass', 'data-well-action': 'take', on: { click: capture } }, '수첩에 담기');
    const controls = el('details', { class: 'well-alt-controls' },
      el('summary', { text: '단추로 지점 고르기' }),
      el('div', { class: 'table-controls' }, move, take));
    const notebook = el('div', { class: 'table-notebook' });
    const title = el('h3', { tabindex: '-1', text: sc.question });
    const question = el('section', { class: 'robe-question table-question' },
      el('span', { class: 'ref', text: sc.ref }), title, el('div', { class: 'choices' }, choices));

    function moveTo(index) {
      run.focus = (index + stops.length) % stops.length;
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
        ctx.saveState();
        paint();
        feedback.textContent = stop.name + ' · 이미 수첩에 담았어요. 다른 지점을 골라 보세요.';
        return;
      }
      run.shots.push(stop.id);
      drawTrail(trail, run.shots);
      ctx.saveState();
      paint();
      if (run.shots.length === stops.length) {
        feedback.textContent = '세 장면을 모두 담았어요. 이제 세 사람이 가져온 것을 골라요.';
        title.focus();
      } else {
        feedback.textContent = run.shots.length + '번째 · ' + stop.name + '. ' + stop.note;
      }
    }

    function paint() {
      const solved = run.shots.length === stops.length;
      count.textContent = run.shots.length + ' / ' + stops.length + '곳';
      controls.hidden = solved;
      question.hidden = !solved;
      pins.forEach((pin, idx) => {
        const stop = stops[idx];
        const order = run.shots.indexOf(stop.id);
        const done = order !== -1;
        pin.classList.toggle('active', !solved && run.focus === idx);
        pin.classList.toggle('collected', done);
        pin.disabled = solved;
        pin.setAttribute('aria-pressed', String(done));
        pin.setAttribute('aria-label', stop.name + ' (' + stop.ref + ')' + (done ? ' · ' + (order + 1) + '번째 기록' : ''));
        pin.firstElementChild.textContent = done ? String(order + 1) : '';
      });
      notebook.replaceChildren(collection(el, run.shots));
      if (!solved) feedback.textContent = describe();
    }

    const movie = el('video', { src: 'media/well-trail.mp4', poster: art, controls: true, muted: true,
      playsinline: true, preload: 'none', 'aria-label': '베들레헴 우물에서 아둘람 굴까지 세 곳을 살펴보는 자막 영상' });
    const film = el('details', { class: 'lookout-film' }, el('summary', { text: '우물 길 영상 보기' }), movie);
    film.addEventListener('toggle', () => { if (!film.open) movie.pause(); });

    paint();
    return el('section', { class: 'table-panel well-panel', 'data-field': 'D08' },
      el('header', { class: 'table-heading' },
        el('div', {}, el('h2', { text: '우물 길 수첩' }),
          el('small', { text: '세 곳을 눌러 내가 살펴본 길을 이어요.' })),
        count),
      board,
      el('div', { class: 'table-side' }, notebook, feedback, controls, question),
      film);
  }

  window.BO_DAVID.wellTrail = { restore, next, render, journal };
})();
