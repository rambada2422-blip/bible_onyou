/* D01 · 탐험대 망원경 */
(function () {
  'use strict';

  const sheep = [
    { id: 'grazing', label: '풀을 뜯는 양', image: 'media/sheep-grazing.webp' },
    { id: 'lamb', label: '귀를 세운 어린양', image: 'media/sheep-lamb.webp' },
    { id: 'resting', label: '앉아 쉬는 양', image: 'media/sheep-resting.webp' }
  ];
  const places = [
    { name: '올리브나무 곁', x: 24, bottom: 17 },
    { name: '돌담 앞', x: 50, bottom: 25 },
    { name: '바위 곁', x: 76, bottom: 14 }
  ];
  function clampPan(value) {
    return Math.max(0, Math.min(100, Math.round(value)));
  }
  function restore(raw) {
    raw = raw || {};
    const seen = Array.isArray(raw.seen) ? [...new Set(raw.seen.filter(id => sheep.some(s => s.id === id)))] : [];
    return {
      pan: Number.isFinite(raw.pan) ? clampPan(raw.pan) : 50,
      layout: [0, 1, 2].includes(raw.layout) ? raw.layout : 0,
      seen,
      finished: seen.length === sheep.length && raw.finished === true
    };
  }
  function label(id) { return sheep.find(s => s.id === id).label; }

  function render(ctx, sc, choices) {
    const el = ctx.el, run = ctx.state.pasture;
    const flock = places.map((place, index) => sheep[(index + run.layout) % sheep.length]);
    const animals = flock.map((s, i) => {
      const image = el('img', { class: 'meadow-sheep', src: s.image, alt: '', draggable: 'false', 'data-sheep': s.id });
      image.style.left = places[i].x + '%';
      image.style.bottom = places[i].bottom + '%';
      return image;
    });
    const world = el('div', { class: 'meadow-world', 'aria-hidden': 'true' },
      el('img', { class: 'meadow-land', src: 'media/pasture.webp', alt: '', draggable: 'false' }), animals);
    const count = el('span', { class: 'meadow-count' });
    const lens = el('div', { class: 'meadow-lens', role: 'slider', tabindex: '0',
      'aria-label': '들판 망원경 방향', 'aria-valuemin': '0', 'aria-valuemax': '100' },
      world, el('div', { class: 'meadow-glass', 'aria-hidden': 'true' }),
      el('div', { class: 'meadow-frame', 'aria-hidden': 'true' }), count);
    const notice = el('p', { class: 'field-feedback', role: 'status', 'aria-atomic': 'true' });
    function control(action, text, listener, name) {
      return el('button', { type: 'button', class: 'meadow-button', 'data-pasture-action': action,
        'aria-label': name, on: { click: listener } }, text);
    }
    const left = control('left', '‹', () => panTo(run.pan - 10), '망원경을 왼쪽으로');
    const right = control('right', '›', () => panTo(run.pan + 10), '망원경을 오른쪽으로');
    const log = control('observe', '수첩에 담기', observe);
    const stamps = sheep.map(s => el('li', { 'data-stamp': s.id },
      el('img', { src: s.image, alt: '' }), el('span', { text: s.label })));
    const title = el('h3', { tabindex: '-1', text: sc.question });
    const question = el('section', { class: 'meadow-question' },
      el('span', { class: 'ref', text: sc.ref }), title, el('div', { class: 'choices' }, choices));

    let drag = null;

    function currentPlace() {
      // The panorama is twice as wide as the lens. Its centre sweeps from 25% to 75%.
      const centre = 25 + run.pan / 2;
      return places.findIndex(p => Math.abs(p.x - centre) <= 6);
    }
    function paint() {
      world.style.transform = 'translateX(' + (-run.pan / 2) + '%)';
      const index = currentPlace();
      const description = index < 0 ? '들판을 조금 더 살펴봐요.' : places[index].name + ' · ' + flock[index].label;
      lens.setAttribute('aria-valuenow', run.pan);
      lens.setAttribute('aria-valuetext', description);
      lens.classList.toggle('in-focus', index >= 0);
      left.setAttribute('aria-disabled', String(run.pan === 0));
      right.setAttribute('aria-disabled', String(run.pan === 100));
      const recorded = index >= 0 && run.seen.includes(flock[index].id);
      log.disabled = index < 0 || recorded;
      log.textContent = recorded ? '수첩에 담았어요 ✓' : '수첩에 담기';
      const message = description + (recorded ? ' · 기록함' : '');
      if (notice.textContent !== message) notice.textContent = message;
      count.textContent = run.seen.length + ' / ' + sheep.length;
      stamps.forEach((stamp, i) => {
        const found = run.seen.includes(sheep[i].id);
        stamp.classList.toggle('recorded', found);
        stamp.setAttribute('aria-label', sheep[i].label + (found ? ' 기록함' : ' 찾는 중'));
      });
      question.hidden = run.seen.length !== sheep.length;
    }
    function panTo(value) {
      const next = clampPan(value);
      if (next === run.pan) return;
      run.pan = next;
      paint();
      if (!drag) ctx.saveState();
    }
    function observe() {
      const i = currentPlace();
      if (i < 0 || run.seen.includes(flock[i].id)) return;
      run.seen.push(flock[i].id);
      ctx.saveState();
      paint();
      if (!question.hidden) title.focus();
      else lens.focus({ preventScroll: true });
    }

    // Keep a horizontal swipe from swallowing the next tap on the notebook button.
    lens.addEventListener('touchmove', ev => {
      if (drag && drag.moved && ev.cancelable) ev.preventDefault();
    }, { passive: false });
    lens.addEventListener('pointerdown', ev => {
      if (!ev.isPrimary || ev.button !== 0) return;
      drag = { id: ev.pointerId, x: ev.clientX, pan: run.pan, moved: false, target: ev.target.dataset.sheep };
      lens.setPointerCapture(ev.pointerId);
    });
    lens.addEventListener('pointermove', ev => {
      if (!drag || drag.id !== ev.pointerId) return;
      const dx = ev.clientX - drag.x;
      if (Math.abs(dx) > 4) drag.moved = true;
      if (drag.moved) panTo(drag.pan - dx / lens.clientWidth * 100);
    });
    function endDrag() {
      if (drag && drag.moved) ctx.saveState();
      drag = null;
    }
    lens.addEventListener('pointerup', ev => {
      if (!drag || drag.id !== ev.pointerId) return;
      const tap = !drag.moved && drag.target;
      endDrag();
      if (tap) {
        const i = flock.findIndex(s => s.id === tap);
        if (i === currentPlace()) observe();
        else panTo((places[i].x - 25) * 2);
      }
    });
    lens.addEventListener('lostpointercapture', endDrag);
    lens.addEventListener('keydown', ev => {
      switch (ev.key) {
        case 'ArrowLeft': panTo(run.pan - 10); break;
        case 'ArrowRight': panTo(run.pan + 10); break;
        case 'Home': panTo(0); break;
        case 'End': panTo(100); break;
        case 'Enter': case ' ': observe(); break;
        default: return;
      }
      ev.preventDefault();
    });
    const video = el('video', { controls: true, playsinline: true, muted: true, preload: 'none',
      'aria-label': '베들레헴 들판을 한 바퀴 보는 무음 영상', poster: 'media/pasture-poster.webp', src: 'media/pasture.mp4' });
    const film = el('details', { class: 'lookout-film' }, el('summary', { text: '들판 한 바퀴 영상 보기' }), video);
    film.addEventListener('toggle', () => { if (!film.open) video.pause(); });
    paint();
    return el('section', { class: 'meadow-panel', 'data-field': 'D01' },
      el('header', { class: 'meadow-heading' }, el('h2', { text: '베들레헴 들판 망원경' }), el('small', { text: '탐험대 이야기' })),
      lens,
      el('div', { class: 'meadow-controls' }, left, log, right),
      el('p', { class: 'meadow-guide', text: '들판을 밀어 양을 가운데 맞추고 수첩에 담아요.' }),
      notice, el('ul', { class: 'meadow-stamps', 'aria-label': '양 관찰 수첩' }, stamps),
      question, film);
  }

  window.BO_DAVID.pasture = { restore, render, label };
})();
