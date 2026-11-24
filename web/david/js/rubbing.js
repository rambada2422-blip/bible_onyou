/* D04 · 탐험대의 엔게디 탁본 수첩 */
(function () {
  'use strict';

  const grid = 12;
  const target = 105;
  const size = 480;
  const unit = size / grid;
  const bandRows = grid / 3;
  const images = { robe: 'media/rubbing-robe.webp', hem: 'media/rubbing-hem.webp' };
  const choices = { robe: 'jonathan-robe', hem: 'saul-hem' };
  function other(id) { return id === 'robe' ? 'hem' : 'robe'; }
  function restore(raw = {}) {
    raw = raw || {};
    const first = raw.first === 'hem' ? 'hem' : 'robe';
    const marks = {};
    for (const id of ['robe', 'hem']) {
      const list = raw.marks && raw.marks[id];
      marks[id] = Array.isArray(list) ? [...new Set(list.filter(n => Number.isInteger(n) && n >= 0 && n < grid * grid))] : [];
    }
    const page = raw.page === 1 && marks[first].length >= target ? 1 : 0;
    return { first, marks, page, finished: page === 1 && marks[other(first)].length >= target && raw.finished === true };
  }

  function specimen(sc, id) { return sc.choices.find(c => c.id === choices[id]); }

  function paper(el, id, marks) {
    const picture = el('img', { src: images[id], alt: '', draggable: 'false' });
    const canvas = el('canvas', { width: size, height: size, 'aria-hidden': 'true' });
    const ink = canvas.getContext('2d');
    const brush = document.createElement('canvas');
    brush.width = brush.height = unit * 2;
    const tip = brush.getContext('2d');
    const feather = tip.createRadialGradient(unit, unit, unit * .61, unit, unit, unit);
    feather.addColorStop(0, '#000'); feather.addColorStop(1, 'transparent');
    tip.fillStyle = feather; tip.fillRect(0, 0, brush.width, brush.height);

    function reveal(cell) {
      const x = (cell % grid + .5) * unit, y = (Math.floor(cell / grid) + .5) * unit;
      ink.drawImage(brush, x - unit, y - unit);
    }
    function drawPaper() {
      ink.globalCompositeOperation = 'source-over';
      ink.fillStyle = '#f4e6c8'; ink.fillRect(0, 0, size, size);
      if (picture.naturalWidth) {
        ink.save();
        ink.globalAlpha = .18; ink.filter = 'grayscale(1)';
        ink.drawImage(picture, 0, 0, size, size); ink.restore();
      }
      ink.globalCompositeOperation = 'destination-out';
      marks.forEach(reveal);
    }
    picture.addEventListener('load', drawPaper);
    drawPaper();

    const sheet = el('div', { class: 'rub-paper' }, picture, canvas);
    return { sheet, picture, canvas, reveal };
  }

  function journal(el, sc, record) {
    const saved = restore(record);
    return el('details', { class: 'rub-keepsake' }, el('summary', { text: '내가 뜬 두 탁본 펼치기' }),
      prints(el, sc, saved.first, saved.marks));
  }

  function prints(el, sc, first, marks) {
    return el('div', { class: 'rub-prints' }, [first, other(first)].map(id => {
      const item = specimen(sc, id);
      const art = marks ? paper(el, id, marks[id]).sheet : el('img', { src: images[id], alt: item.label });
      return el('figure', {}, art,
        el('figcaption', {}, el('strong', { text: item.label }), el('small', { text: item.ref })));
    }));
  }

  function render(ctx, sc, buttons) {
    const el = ctx.el, run = ctx.state.rubbing;
    const id = run.page ? other(run.first) : run.first;
    const item = specimen(sc, id);
    const marks = run.marks[id], seen = new Set(marks);
    const { sheet, picture, canvas, reveal } = paper(el, id, marks);
    const meter = el('progress', { max: 100, 'aria-label': '이 탁본의 진행률' });
    const percent = el('span', { class: 'rub-percent', 'aria-hidden': 'true' });
    const progress = el('div', { class: 'rub-progress' }, meter, percent);
    const status = el('p', { class: 'field-feedback', role: 'status' });
    const bands = ['위쪽', '가운데', '아래쪽'].map((name, i) => el('button', { type: 'button',
      'data-rub-band': i, 'aria-label': name + ' 문지르기', on: { click: () => rubBand(i) } }, name));
    const controls = el('div', { class: 'rub-controls' },
      el('small', { text: '단추로 문지르기' }), el('div', { class: 'rub-bands' }, bands));
    const next = el('button', { type: 'button', class: 'btn brass', 'data-action': 'next-rubbing', on: { click: () => {
      run.page = 1; ctx.saveState(); ctx.render();
      ctx.root.querySelector('.rub-title').focus({ preventScroll: true });
    } } }, '둘째 탁본 뜨기 ›');
    const questionTitle = el('h3', { tabindex: '-1', text: sc.question });
    const question = el('section', { class: 'robe-question' }, el('span', { class: 'ref', text: sc.ref }),
      questionTitle, el('div', { class: 'choices' }, buttons));
    const pair = prints(el, sc, run.first);
    const title = el('h2', { class: 'rub-title', tabindex: '-1', text: '엔게디 탁본 수첩' });
    const counter = el('span', { class: 'rub-counter', text: run.page ? '둘째 장' : '첫째 장' });
    const tools = el('div', { class: 'rub-tools' }, progress, status, controls, next, question);

    function update() {
      const done = seen.size >= target;
      const both = done && run.page === 1;
      const value = Math.min(100, Math.floor(seen.size * 100 / target));
      meter.value = value; percent.textContent = value + '%';
      sheet.classList.toggle('developed', done);
      sheet.hidden = both; pair.hidden = !both;
      canvas.hidden = done; progress.hidden = done; controls.hidden = done;
      bands.forEach((button, i) => {
        const start = i * grid * bandRows;
        button.disabled = marks.filter(n => n >= start && n < start + grid * bandRows).length === grid * bandRows;
      });
      next.hidden = !done || both; question.hidden = !both;
      tools.classList.toggle('developed', done);
      if (done) {
        picture.alt = item.label;
        status.textContent = both ? '두 천의 원그림과 장절을 비교해요.' : item.label + ' · ' + item.ref;
      } else if (!status.textContent) {
        status.textContent = '종이를 손가락으로 쓸어 천의 무늬를 떠 보세요.';
      }
    }
    function mark(x, y) {
      if (x < 0 || x >= grid || y < 0 || y >= grid) return;
      const cell = y * grid + x;
      if (seen.has(cell)) return;
      seen.add(cell); marks.push(cell); reveal(cell);
    }
    function finishStroke(before) {
      if (seen.size === before) return;
      ctx.saveState(); update();
      if (seen.size >= target) (run.page ? questionTitle : next).focus({ preventScroll: true });
    }
    function rubBand(i) {
      const before = seen.size;
      for (let y = i * bandRows; y < (i + 1) * bandRows; y++) {
        for (let x = 0; x < grid; x++) mark(x, y);
      }
      finishStroke(before);
    }
    function stamp(x, y) {
      const col = Math.floor(x), row = Math.floor(y);
      for (let j = row - 1; j <= row + 1; j++) {
        for (let i = col - 1; i <= col + 1; i++) {
          if (Math.hypot(i + .5 - x, j + .5 - y) <= 1.5) mark(i, j);
        }
      }
    }
    let pointer = null, last = null;
    function stroke(ev) {
      const box = canvas.getBoundingClientRect();
      if (!box.width || !box.height || seen.size >= target) return;
      const x = Math.max(0, Math.min(grid, (ev.clientX - box.left) * grid / box.width));
      const y = Math.max(0, Math.min(grid, (ev.clientY - box.top) * grid / box.height));
      const from = last || { x, y };
      const steps = Math.max(1, Math.ceil(Math.hypot(x - from.x, y - from.y) * 2));
      const before = seen.size;
      for (let n = 1; n <= steps; n++) stamp(from.x + (x - from.x) * n / steps, from.y + (y - from.y) * n / steps);
      last = { x, y }; finishStroke(before);
    }
    canvas.addEventListener('pointerdown', ev => {
      if (!ev.isPrimary || ev.button !== 0) return;
      pointer = ev.pointerId; last = null; canvas.setPointerCapture(pointer); stroke(ev);
    });
    canvas.addEventListener('pointermove', ev => { if (ev.pointerId === pointer) stroke(ev); });
    canvas.addEventListener('pointerup', ev => { if (ev.pointerId === pointer) stroke(ev); });
    canvas.addEventListener('lostpointercapture', () => { pointer = null; last = null; });

    const film = el('video', { controls: true, playsinline: true, muted: true, preload: 'none',
      poster: 'media/rubbing-poster.webp', src: 'media/rubbing.mp4', 'aria-label': '두 탁본이 차례로 드러나는 무음 영상' });
    const movie = el('details', { class: 'lookout-film' }, el('summary', { text: '두 탁본 영상 보기' }), film);
    movie.addEventListener('toggle', () => { if (!movie.open) film.pause(); });
    update();
    return el('section', { class: 'rub-panel', 'data-field': 'D04' },
      el('header', { class: 'rub-heading' }, title, el('small', { text: '탐험대 이야기' }), counter),
      el('div', { class: 'rub-work' }, sheet, pair), tools, movie);
  }

  window.BO_DAVID.rubbing = { restore, other, render, journal };
})();
