/* 2D와 3D 관문에서 성경 장절을 같은 방식으로 확인한다. */
(function () {
  'use strict';

  function readNumber(field, unit) {
    var value = field.value.trim().normalize('NFKC');
    if (value.endsWith(unit)) value = value.slice(0, -1).trim();
    return /^\d{1,3}$/.test(value) && Number(value) > 0 ? Number(value) : null;
  }

  BO.referenceInput = function (q, onOk, el, goodNote, chapterId, verseId) {
    var ch = el('input', { id: chapterId, type: 'text', inputmode: 'numeric', enterkeyhint: 'next',
      'aria-label': '장', autocomplete: 'off', on: { keydown: function (event) {
        if (event.key === 'Enter' && !event.isComposing && event.keyCode !== 229) {
          event.preventDefault();
          vs.focus();
        }
      } } });
    var vs = el('input', { id: verseId, type: 'text', inputmode: 'numeric', enterkeyhint: 'done', 'aria-label': '절', autocomplete: 'off' });
    var note = el('div', { role: 'status' });
    var check = el('button', { class: 'btn plain', type: 'submit' }, '확인');

    function submit(event) {
      event.preventDefault();
      if (check.disabled) return;
      var chapter = readNumber(ch, '장'), verse = readNumber(vs, '절');
      if (chapter === null || verse === null) {
        note.replaceChildren(el('div', { class: 'note look fadein' }, el('b', { text: '장과 절을 숫자로 적어 주세요.' })));
        (chapter === null ? ch : vs).focus();
      } else if (q.accept.includes(chapter + ':' + verse)) {
        ch.disabled = vs.disabled = check.disabled = true;
        note.replaceChildren(goodNote(null, '맞게 찾았어요. ' + q.book + ' ' + chapter + '장 ' + verse + '절.'));
        onOk();
      } else {
        note.replaceChildren(el('div', { class: 'note look fadein' }, el('b', { text: '그 절에는 다른 내용이 적혀 있어요.' }), el('span', { text: q.hint })));
      }
      note.scrollIntoView({ block: 'nearest' });
    }
    return [el('p', { class: 'q-prompt', text: q.prompt }),
      el('form', { class: 'refin', on: { submit: submit } }, el('span', { text: q.book }), ch, el('span', { text: '장' }), vs, el('span', { text: '절' }), check),
      note];
  };
})();
