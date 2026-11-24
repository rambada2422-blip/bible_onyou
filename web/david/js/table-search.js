/* D07 왕의 식탁 · 삽화에서 내가 고른 부분을 수첩에 담는다. */
(function () {
  'use strict';
  const art = 'media/royal-table.webp';
  // Positions are percentages of the uncropped 3:2 painting.
  const details = [
    { id: 'bread', name: '둥근 빵', x: 18, y: 67, rx: 12, ry: 8 },
    { id: 'grapes', name: '포도 그릇', x: 77, y: 65, rx: 9, ry: 9 },
    { id: 'cloth', name: '줄무늬 천', x: 49, y: 83, rx: 18, ry: 14 }
  ];

  function coordinate(value, fallback) {
    return Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : fallback;
  }
  function underLens(x, y) {
    return details.find(d => ((x - d.x) / d.rx) ** 2 + ((y - d.y) / d.ry) ** 2 <= 1);
  }
  function restore(raw) {
    raw = raw || {};
    const shots = [];
    for (const shot of Array.isArray(raw.shots) ? raw.shots : []) {
      if (!shot || !Number.isFinite(shot.x) || !Number.isFinite(shot.y)) continue;
      const x = coordinate(shot.x), y = coordinate(shot.y), detail = underLens(x, y);
      if (detail && detail.id === shot.id && !shots.some(s => s.id === shot.id)) shots.push({ id: shot.id, x, y });
    }
    return { x: coordinate(raw.x, 50), y: coordinate(raw.y, 47), shots,
      finished: raw.finished === true && shots.length === details.length };
  }

  function position(node, x, y) {
    node.style.setProperty('--table-x', x + '%');
    node.style.setProperty('--table-y', y + '%');
  }
  function collection(el, shots) {
    const order = shots.map(shot => details.find(d => d.id === shot.id))
      .concat(details.filter(d => !shots.some(s => s.id === d.id)));
    return el('ol', { class: 'table-collection', 'aria-label': '그림 수첩' }, order.map((detail, i) => {
      const shot = shots[i];
      const tile = el('li', { class: shot ? 'collected' : '' },
        shot ? el('span', { class: 'table-crop' }, el('img', { src: art, alt: '' })) : null,
        el('span', { class: 'table-caption', text: (shot ? (i + 1) + '. ' : '') + detail.name }));
      if (shot) position(tile, shot.x, shot.y);
      return tile;
    }));
  }
  function journal(el, rawShots) {
    const { shots } = restore({ shots: rawShots });
    if (shots.length !== details.length) return null;
    return el('details', { class: 'table-keepsake' }, el('summary', { text: '내가 담은 식탁 그림 세 장' }), collection(el, shots));
  }

  function render(ctx, sc, choices) {
    const el = ctx.el, run = ctx.state.tableSearch;
    const count = el('span', { class: 'table-count' });
    const feedback = el('p', { class: 'field-feedback', role: 'status', 'aria-atomic': 'true' });
    const board = el('button', { type: 'button', class: 'table-board',
      'aria-label': '식탁 그림 돋보기. 방향키로 움직이고 엔터로 수첩에 담아요.' },
      el('img', { class: 'table-art', src: art, draggable: 'false', alt: '다윗과 므비보셋이 식탁에 마주 앉은 삽화' }),
      el('span', { class: 'table-zoom', 'aria-hidden': 'true' }, el('img', { src: art, alt: '', draggable: 'false' })),
      el('span', { class: 'table-ring', 'aria-hidden': 'true' }));
    const take = el('button', { type: 'button', class: 'btn brass', 'data-table-action': 'take', on: { click: capture } }, '수첩에 담기');
    const move = el('button', { type: 'button', class: 'btn plain', 'data-table-action': 'move', on: { click: () => {
      const index = details.indexOf(underLens(run.x, run.y));
      const next = details[(index + 1) % details.length];
      locate(next.x, next.y);
      settle();
    } } }, '자리 바꾸기');
    const controls = el('div', { class: 'table-controls' }, move, take);
    const notebook = el('div', { class: 'table-notebook' });
    const title = el('h3', { tabindex: '-1', text: sc.question });
    const question = el('section', { class: 'robe-question table-question' },
      el('span', { class: 'ref', text: sc.ref }), title, el('div', { class: 'choices' }, choices));

    function locate(x, y) {
      run.x = coordinate(x, run.x); run.y = coordinate(y, run.y);
      position(board, run.x, run.y);
    }
    function describeSpot() {
      const detail = underLens(run.x, run.y);
      if (!detail) return '그림을 누르거나 돋보기를 끌어 세 가지를 찾아요.';
      return detail.name + (run.shots.some(s => s.id === detail.id) ? ' · 이미 수첩에 담았어요.' : ' · 수첩에 담을 수 있어요.');
    }
    function settle() {
      ctx.saveState();
      feedback.textContent = describeSpot();
    }
    function paintBook() {
      const solved = run.shots.length === details.length;
      count.textContent = run.shots.length + ' / ' + details.length + '장';
      board.disabled = solved;
      controls.hidden = solved;
      question.hidden = !solved;
      notebook.replaceChildren(collection(el, run.shots));
      position(board, run.x, run.y);
      if (solved) feedback.textContent = '세 장을 담았어요. 이제 식탁에 함께한 사람을 찾아요.';
    }
    function capture() {
      if (board.disabled) return;
      const detail = underLens(run.x, run.y);
      if (!detail || run.shots.some(s => s.id === detail.id)) {
        feedback.textContent = detail ? describeSpot() : '돋보기 안에 빵, 포도 그릇, 천 중 하나가 보일 때 담아 보세요.';
        return;
      }
      run.shots.push({ id: detail.id, x: run.x, y: run.y });
      ctx.saveState();
      feedback.textContent = detail.name + ' 그림을 담았어요.';
      paintBook();
      if (!question.hidden) title.focus();
    }

    let pointer = null;
    function point(event) {
      const rect = board.getBoundingClientRect();
      locate((event.clientX - rect.left) * 100 / rect.width, (event.clientY - rect.top) * 100 / rect.height);
    }
    // This surface consumes touch drags. Keep a fast sweep from suppressing the next button tap.
    board.addEventListener('touchstart', event => {
      if (!board.disabled && event.cancelable) event.preventDefault();
    }, { passive: false });
    board.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0) return;
      pointer = event.pointerId;
      board.setPointerCapture(pointer);
      point(event);
    });
    board.addEventListener('pointermove', event => { if (pointer === event.pointerId) point(event); });
    board.addEventListener('pointerup', event => {
      if (pointer !== event.pointerId) return;
      point(event);
      pointer = null;
      settle();
    });
    board.addEventListener('lostpointercapture', () => {
      if (pointer !== null) { pointer = null; settle(); }
    });
    const arrows = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, -5], ArrowDown: [0, 5] };
    board.addEventListener('keydown', event => {
      const delta = arrows[event.key];
      if (!delta) return;
      event.preventDefault();
      locate(run.x + delta[0], run.y + delta[1]);
      settle();
    });
    board.addEventListener('click', event => { if (event.detail === 0) capture(); });

    const movie = el('video', { src: 'media/royal-table.mp4', poster: art, controls: true, muted: true,
      playsinline: true, preload: 'none', 'aria-label': '식탁 그림 세 곳과 두 사람을 살펴보는 자막 영상' });
    const film = el('details', { class: 'lookout-film' }, el('summary', { text: '식탁 그림 영상 보기' }), movie);
    film.addEventListener('toggle', () => { if (!film.open) movie.pause(); });
    feedback.textContent = describeSpot();
    paintBook();
    return el('section', { class: 'table-panel', 'data-field': 'D07' },
      el('header', { class: 'table-heading' }, el('div', {}, el('small', { text: '탐험대 그림 놀이' }),
        el('h2', { text: '왕의 식탁 돋보기' })), count),
      board, el('div', { class: 'table-side' }, notebook, feedback, controls, question), film);
  }
  window.BO_DAVID.tableSearch = { restore, render, journal };
})();
