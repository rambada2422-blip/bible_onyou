/* D05 · 헤브론 기억 카드 */
(function () {
  'use strict';

  const images = { town: 'media/hebron-town.webp', judah: 'media/hebron-judah.webp', elders: 'media/hebron-elders.webp' };
  const layouts = [
    { picture: ['town', 'judah', 'elders'], clue: ['elders', 'town', 'judah'] },
    { picture: ['elders', 'town', 'judah'], clue: ['town', 'judah', 'elders'] },
    { picture: ['judah', 'elders', 'town'], clue: ['elders', 'judah', 'town'] },
    { picture: ['town', 'elders', 'judah'], clue: ['judah', 'elders', 'town'] }
  ];
  const names = { picture: '그림', clue: '단서' };
  const ids = layouts[0].picture;

  function restore(raw) {
    raw = raw || {};
    const layout = Number.isInteger(raw.layout) && layouts[raw.layout] ? raw.layout : 0;
    const found = Array.isArray(raw.found) ? [...new Set(raw.found.filter(id => ids.includes(id)))] : [];
    const available = id => ids.includes(id) && !found.includes(id) ? id : null;
    const picture = available(raw.picture);
    const clue = raw.clue === picture ? null : available(raw.clue);
    const phase = found.length === ids.length && ['later', 'done'].includes(raw.phase) ? raw.phase : 'pairs';
    return { layout, found, picture, clue, phase };
  }
  function next(run) { return restore({ layout: (run.layout + 1) % layouts.length }); }

  function entries(sc) {
    const items = { town: { title: sc.place, clue: '두 만남이 있었던 곳', ref: sc.ref } };
    for (const choice of sc.choices) {
      items[choice.id] = { title: choice.label, clue: choice.sub.replace(sc.place + ' · ', ''), ref: choice.ref };
    }
    return items;
  }

  function album(el, sc, order) {
    const items = entries(sc);
    return el('div', { class: 'hm-album' }, order.map(id =>
      el('figure', {}, el('img', { src: images[id], alt: '' }),
        el('figcaption', {}, el('strong', { text: items[id].title }), el('span', { text: items[id].clue }),
          el('small', { text: items[id].ref })))));
  }

  function journal(el, sc, saved) {
    const order = restore({ found: saved }).found;
    if (order.length !== ids.length) return null;
    return el('details', { class: 'hm-keepsake' }, el('summary', { text: '내가 찾은 짝 순서로 펼치기' }), album(el, sc, order));
  }

  function render(ctx, sc, choices) {
    const el = ctx.el, run = ctx.state.hebronCards, items = entries(sc);
    const counter = el('span', { class: 'hm-count' });
    const header = el('header', { class: 'hm-head' }, el('div', {},
      el('small', { text: '탐험대 이야기' }), el('h2', { text: '헤브론 기억 카드' })), counter);
    header.style.backgroundImage = 'linear-gradient(90deg,#223d3ded,#23392c6e),url("' + images.town + '")';
    const status = el('p', { class: 'field-feedback', role: 'status', 'aria-atomic': 'true' });
    const retry = el('button', { type: 'button', class: 'hm-retry', 'data-action': 'cover-cards', on: { click: cover } }, '두 장 다시 덮기');
    const title = el('h3', { tabindex: '-1', text: sc.question });
    const question = el('section', { class: 'robe-question hm-question' },
      el('span', { class: 'ref', text: sc.step1Ref }), title, el('div', { class: 'choices' }, choices));
    const cards = [];
    function row(kind) {
      const buttons = layouts[run.layout][kind].map((id, index) => {
        const item = items[id];
        const back = el('span', { class: 'hm-back', 'aria-hidden': 'true' }, el('i', {}));
        const front = el('span', { class: 'hm-front' }, kind === 'picture'
          ? [el('img', { src: images[id], alt: '' }), el('strong', { text: item.title })]
          : [el('strong', { text: item.clue }), el('small', { text: item.ref })]);
        const button = el('button', { type: 'button', class: 'hm-card', 'data-kind': kind, 'data-slot': index,
          on: { click: () => flip(kind, id) } }, back, front);
        cards.push({ button, kind, id, index, back, front });
        return button;
      });
      return el('section', { class: 'hm-row', 'aria-label': names[kind] + ' 카드' },
        el('h3', { text: names[kind] + ' 카드' }), el('div', { class: 'hm-trio' }, buttons));
    }
    const deck = el('div', { class: 'hm-deck' }, row('picture'), row('clue'));
    const collection = album(el, sc, ids);
    function paint(lastMatch) {
      const solved = run.found.length === ids.length;
      const mismatch = !!(run.picture && run.clue);
      for (const { button, kind, id, index, back, front } of cards) {
        const matched = run.found.includes(id);
        const open = matched || run[kind] === id;
        const description = kind === 'picture' ? items[id].title : items[id].clue + ' · ' + items[id].ref;
        front.hidden = !open; back.hidden = open;
        button.setAttribute('aria-label', names[kind] + ' ' + (index + 1) + '번 · ' + (open ? description : '뒤집기') + (matched ? ' · 맞춘 짝' : ''));
        button.setAttribute('aria-pressed', String(open));
        button.classList.toggle('matched', matched);
        button.disabled = matched || mismatch;
      }
      counter.textContent = run.found.length + ' / 3짝';
      deck.hidden = solved; collection.hidden = !solved; question.hidden = !solved;
      retry.hidden = !mismatch;
      if (solved) status.textContent = '세 짝을 모두 찾았어요.';
      else if (mismatch) status.textContent = items[run.picture].title + ' 그림의 단서는 ‘' + items[run.picture].clue + '’예요. 다시 덮고 찾아봐요.';
      else if (lastMatch) status.textContent = items[lastMatch].title + ' 짝을 찾았어요!';
      else if (run.picture) status.textContent = '단서 카드에서 ' + items[run.picture].ref + ' 표시를 찾아요.';
      else if (run.clue) status.textContent = items[run.clue].title + ' 그림을 찾아요.';
      else status.textContent = '그림 한 장과 단서 한 장을 뒤집어 짝을 찾아요.';
    }

    function flip(kind, id) {
      if ((run.picture && run.clue) || run.found.includes(id)) return;
      run[kind] = run[kind] === id ? null : id;
      const matched = run.picture && run.picture === run.clue;
      if (matched) {
        run.found.push(id);
        run.picture = null; run.clue = null;
      }
      ctx.saveState(); paint(matched ? id : null);
      if (!question.hidden) title.focus({ preventScroll: true });
      else if (!retry.hidden) retry.focus({ preventScroll: true });
      else if (matched) deck.querySelector('button:not(:disabled)').focus({ preventScroll: true });
    }
    function cover() {
      const first = cards.find(card => card.kind === 'picture' && card.id === run.picture);
      run.picture = null; run.clue = null;
      ctx.saveState(); paint();
      first.button.focus({ preventScroll: true });
    }

    const video = el('video', { controls: true, muted: true, playsinline: true, preload: 'none',
      poster: images.town, src: 'media/hebron-meetings.mp4', 'aria-label': '헤브론의 장소, 첫 번째 만남과 나중 만남을 보여 주는 자막 영상' });
    const film = el('details', { class: 'lookout-film' }, el('summary', { text: '두 만남 영상 보기' }), video);
    film.addEventListener('toggle', () => { if (!film.open) video.pause(); });
    paint();
    return el('section', { class: 'hm-panel', 'data-field': 'D05' }, header, deck, collection,
      el('div', { class: 'hm-tools' }, status, retry, question), film);
  }

  window.BO_DAVID.hebronCards = { restore, next, render, journal, album };
})();
