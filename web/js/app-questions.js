/* 2D 시범판의 물음과 시대 단서. */
(function () {
  'use strict';
  var app = BO.app2d;
  var el = app.el, add = app.add, tx = app.tx, icon = app.icon, refChip = app.refChip, bookName = app.bookName;

  /* ── 관문 부품 ── */
  function goodNote(ref, text) {
    return el('div', { class: 'note good fadein' }, el('b', { text: text || '성경에 그렇게 기록되어 있어요.' }), ref ? refChip(ref) : null);
  }
  function lookNote(ref, text) {
    return el('div', { class: 'note look fadein' }, el('b', { text: '성경에서 확인해 볼까요?' }),
      el('span', { text: text || '성경책을 펴서 읽은 뒤 다시 골라 보세요.' }), ref ? refChip(ref) : null);
  }
  function choiceBlock(q, ref, onOk) {
    var pics = q.options.some(function (o) { return o.icon; });
    var noteBox = el('div', {});
    var btns = q.options.map(function (o) {
      var b = el('button', { class: 'opt', on: { click: function () {
        if (o.ok) {
          btns.forEach(function (x) { x.disabled = true; if (x !== b) x.classList.add('rest'); });
          b.classList.add('ok');
          noteBox.replaceChildren(goodNote(ref));
          onOk();
        } else {
          b.classList.add('rest'); b.disabled = true;
          noteBox.replaceChildren(lookNote(ref));
        }
        noteBox.scrollIntoView({ block: 'nearest' });
      } } }, o.icon ? icon(o.icon) : null, el('span', { text: o.label }));
      return b;
    });
    return [el('p', { class: 'q-prompt', text: q.prompt }), el('div', { class: 'opts' + (pics ? ' pics' : '') }, btns), noteBox];
  }
  function findrefBlock(q, onOk, inputSuffix) {
    var ch = el('input', { id: 'in-ch-' + inputSuffix, type: 'text', inputmode: 'numeric', 'aria-label': '장', autocomplete: 'off', maxlength: '3' });
    var vs = el('input', { id: 'in-vs-' + inputSuffix, type: 'text', inputmode: 'numeric', 'aria-label': '절', autocomplete: 'off', maxlength: '3' });
    var noteBox = el('div', {});
    var check = el('button', { class: 'btn plain', on: { click: function () {
      var v = parseInt(ch.value, 10) + ':' + parseInt(vs.value, 10);
      if (q.accept.indexOf(v) >= 0) {
        ch.disabled = vs.disabled = check.disabled = true;
        noteBox.replaceChildren(goodNote(null, '맞게 찾았어요. ' + q.book + ' ' + ch.value.trim() + '장 ' + vs.value.trim() + '절.'));
        onOk();
      } else {
        noteBox.replaceChildren(el('div', { class: 'note look fadein' }, el('b', { text: '그 절에는 다른 내용이 적혀 있어요.' }), el('span', { text: q.hint })));
      }
      noteBox.scrollIntoView({ block: 'nearest' });
    } } }, '확인');
    return [el('p', { class: 'q-prompt', text: q.prompt }),
      el('div', { class: 'refin' }, el('span', { text: q.book }), ch, el('span', { text: '장' }), vs, el('span', { text: '절' }), check),
      noteBox];
  }
  function findBlock(q, onOk) {
    var after = el('div', { style: 'display:flex;flex-direction:column;gap:12px' });
    var readBtn = el('button', { class: 'btn plain', on: { click: function () {
      readBtn.disabled = true; readBtn.textContent = '읽었어요';
      add(after, choiceBlock(q.confirm, q.ref, onOk));
      after.scrollIntoView({ block: 'nearest' });
    } } }, '찾아서 읽었어요');
    return [el('div', { class: 'findcard' }, icon('book'),
      el('div', {}, el('div', { class: 'big', text: bookName(q.ref) }), el('p', { text: tx(q.prompt) }))),
      readBtn, after];
  }
  function multiBlock(q, onOk) {
    var noteBox = el('div', {});
    var btns = q.options.map(function (o) {
      var b = el('button', { class: 'opt', 'aria-pressed': 'false', on: { click: function () {
        b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
      } } }, el('span', { class: 'mark' }, icon('check')), el('span', { text: o.label }));
      return b;
    });
    var check = el('button', { class: 'btn plain', on: { click: function () {
      var ok = q.options.every(function (o, k) { return (btns[k].getAttribute('aria-pressed') === 'true') === !!o.ok; });
      if (ok) {
        btns.forEach(function (b, k) { b.disabled = true; b.classList.add(q.options[k].ok ? 'ok' : 'rest'); });
        check.disabled = true;
        noteBox.replaceChildren(el('div', { class: 'note good fadein' }, el('b', { text: '다른 점을 모두 찾았어요.' }),
          el('div', { style: 'display:flex;gap:6px;flex-wrap:wrap' }, q.options.filter(function (o) { return o.ref; }).map(function (o) { return refChip(o.ref); }))));
        onOk();
      } else {
        noteBox.replaceChildren(el('div', { class: 'note look fadein' }, el('b', { text: '다시 살펴볼까요?' }),
          el('span', { text: '방금 본 장면에 있었던 것만 골라 보세요.' })));
      }
      noteBox.scrollIntoView({ block: 'nearest' });
    } } }, '확인');
    return [el('p', { class: 'q-prompt', text: q.prompt }), el('div', { class: 'opts' }, btns), check, noteBox];
  }
  function hotspotBlock(q, onOk, scene) {
    var hots = scene.hots;
    var found = [];
    var list = el('div', { class: 'found-list' });
    var rows = q.items.map(function (it, k) {
      var row = el('div', { class: 'it wait' }, el('span', { text: '단서 ' + (k + 1) + ': 아직 못 찾았어요' }));
      list.appendChild(row);
      return row;
    });
    q.items.forEach(function (it, k) {
      var r = scene.region(it.region) || { x: 150 + k * 250, y: 500, w: 160, h: 160 };
      var x = r.tap ? r.tap[0] : r.x + r.w / 2;
      var y = r.tap ? r.tap[1] : r.y + r.h / 2;
      var b = el('button', { class: 'hot', 'aria-label': '단서 ' + (k + 1),
        style: '--dx:' + (x - 450) + ';--dy:' + (y - 600),
        on: { click: function () {
          reveal();
          if (found.length === q.items.length) onOk();
          else scene.onFind(found);
        } } });
      function reveal() {
        b.disabled = true; b.classList.add('found'); found.push(it.region);
        rows[k].className = 'it fadein';
        rows[k].replaceChildren(el('span', {}, it.text + ' '), refChip(it.ref));
      }
      if (scene.found && scene.found.includes(it.region)) reveal();
      hots.appendChild(b);
    });
    if (found.length === q.items.length) onOk();
    return [el('p', { class: 'q-prompt', text: q.prompt }), list];
  }
  function blockFor(q, onOk, scene) {
    if (q.type === 'choice') return choiceBlock(q, q.ref, onOk);
    if (q.type === 'find') return findBlock(q, onOk);
    if (q.type === 'findref') return findrefBlock(q, onOk, scene.inputSuffix);
    if (q.type === 'order') return BO.orderQuestion(q, onOk, { el: el, goodNote: goodNote, lookNote: lookNote });
    if (q.type === 'multi') return multiBlock(q, onOk);
    if (q.type === 'hotspots') return hotspotBlock(q, onOk, scene);
    return [];
  }

  app.questions = { blockFor: blockFor, findBlock: findBlock };
})();
