/* D03 · 겉옷 그림 맞추기 */
(function () {
  'use strict';

  const layouts = [[0, 3, 2, 1], [2, 0, 1, 3], [1, 2, 3, 0], [3, 1, 0, 2]];
  const corners = ['왼쪽 위', '오른쪽 위', '왼쪽 아래', '오른쪽 아래'];
  const picture = 'media/robe-gift.webp';
  const description = '요나단이 내민 푸른 겉옷을 다윗이 두 손으로 받는 그림';

  function restore(raw) {
    raw = raw || {};
    const layout = Number.isInteger(raw.layout) && layouts[raw.layout] ? raw.layout : 0;
    const valid = Array.isArray(raw.turns) && raw.turns.length === 4 &&
      raw.turns.every(n => Number.isInteger(n) && n >= 0 && n < 4);
    const turns = valid ? raw.turns.slice() : layouts[layout].slice();
    return { layout, turns, finished: raw.finished === true && turns.every(n => n === 0) };
  }

  function next(run) { return restore({ layout: (run.layout + 1) % layouts.length }); }

  function journalPicture(el) {
    return el('details', { class: 'robe-keepsake' },
      el('summary', { text: '내가 맞춘 겉옷 그림 펼치기' }),
      el('img', { src: picture, alt: description, loading: 'lazy' }));
  }

  function render(ctx, sc, choices) {
    const el = ctx.el, run = ctx.state.robe;
    let comparing = false;
    // Keep clockwise movement continuous when a piece turns from 270 to 360 degrees.
    const angles = run.turns.map(n => n * 90);
    const count = el('span', { class: 'robe-count' });
    const notice = el('p', { class: 'field-feedback', role: 'status', 'aria-atomic': 'true' });
    const compare = el('button', { type: 'button', class: 'robe-compare', on: { click: () => {
      comparing = !comparing;
      paint();
    } } });
    const tiles = corners.map((corner, i) => el('button', { type: 'button', class: 'robe-piece',
      'data-robe-piece': String(i), on: { click: () => turn(i) } },
      el('span', { class: 'robe-fragment', 'aria-hidden': 'true' }),
      el('span', { class: 'robe-mark', 'aria-hidden': 'true' })));
    const reference = el('img', { class: 'robe-reference', src: picture, alt: description });
    const board = el('div', { class: 'robe-board', role: 'group', 'aria-label': '겉옷 그림 네 조각' }, tiles, reference);
    const questionTitle = el('h3', { tabindex: '-1', text: sc.question });
    const controls = el('div', { class: 'robe-tools' }, notice, compare);
    const question = el('section', { class: 'robe-question' }, el('span', { class: 'ref', text: sc.ref }),
      questionTitle, el('div', { class: 'choices' }, choices));

    function paint(lastPiece) {
      const matched = run.turns.filter(n => n === 0).length;
      const solved = matched === 4;
      board.classList.toggle('assembled', solved);
      controls.classList.toggle('complete', solved);
      reference.hidden = !(comparing || solved);
      tiles.forEach((tile, i) => {
        const locked = run.turns[i] === 0;
        tile.firstChild.style.transform = 'rotate(' + angles[i] + 'deg)';
        tile.lastChild.textContent = locked ? '✓' : '↻';
        const instruction = locked ? '맞췄어요' : (run.turns[i] * 90) + '도 · 오른쪽으로 돌리기';
        tile.setAttribute('aria-label', corners[i] + ' 조각 · ' + instruction);
        tile.setAttribute('aria-disabled', String(locked || comparing));
        tile.hidden = comparing || solved;
      });
      count.textContent = matched + ' / 4';
      compare.hidden = solved;
      compare.setAttribute('aria-pressed', String(comparing));
      compare.textContent = comparing ? '조각으로 돌아가기' : '완성 그림 보기';
      question.hidden = !solved;
      notice.textContent = solved ? '네 조각을 모두 맞췄어요. 이제 성경 물음을 풀어요.' :
        comparing ? '완성 그림을 보고 겉옷의 무늬가 이어지는 곳을 찾아요.' :
        run.turns[lastPiece] === 0 ? corners[lastPiece] + ' 조각을 맞췄어요. 남은 조각을 돌려 봐요.' :
        '그림 조각을 눌러 돌려요. 맞는 방향이 되면 멈춰요.';
    }

    function turn(i) {
      if (comparing || run.turns[i] === 0) return;
      run.turns[i] = (run.turns[i] + 1) % 4;
      angles[i] += 90;
      ctx.saveState();
      paint(i);
      if (!question.hidden) questionTitle.focus({ preventScroll: true });
    }

    const video = el('video', { controls: true, playsinline: true, muted: true, preload: 'none',
      poster: picture, src: 'media/robe-puzzle.mp4', 'aria-label': '네 조각이 돌아가 겉옷 그림이 되는 무음 영상' });
    const film = el('details', { class: 'lookout-film' }, el('summary', { text: '조각이 맞춰지는 영상 보기' }), video);
    film.addEventListener('toggle', () => { if (!film.open) video.pause(); });
    paint();
    return el('section', { class: 'robe-panel', 'data-field': 'D03' },
      el('header', { class: 'robe-heading' }, el('h2', { text: '겉옷 그림 맞추기' }),
        el('small', { text: '탐험대 이야기' }), count),
      board, el('div', { class: 'robe-sidebar' }, controls, question), film);
  }

  window.BO_DAVID.robe = { restore, next, render, journalPicture };
})();
