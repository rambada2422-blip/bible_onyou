/* 2D와 3D의 같은 호렙 관문에서 고른 순서를 직접 고칠 수 있게 한다. */
(function () {
  'use strict';
  BO.orderQuestion = function (q, onOk, ui) {
    var el = ui.el, picked = [], shuffled = [], i;
    var note = el('div', { role: 'status' });
    for (i = 1; i < q.items.length; i += 2) shuffled.push(i);
    for (i = q.items.length - 1 - ((q.items.length - 1) % 2); i >= 0; i -= 2) shuffled.push(i);

    var numbers = q.items.map(function () { return el('span', { class: 'num' }); });
    var buttons = q.items.map(function (label, index) {
      return el('button', { class: 'opt', 'aria-pressed': 'false', on: { click: function () {
        var position = picked.indexOf(index);
        if (position < 0) picked.push(index);
        else picked.splice(position, 1);
        render();
        if (picked.length === q.items.length) check();
      } } }, numbers[index], el('span', { text: label }));
    });
    var reset = el('button', { class: 'btn plain', on: { click: function () {
      picked = [];
      render();
    } } }, '다시 놓기');

    function render() {
      note.replaceChildren();
      buttons.forEach(function (button, index) {
        var position = picked.indexOf(index);
        numbers[index].textContent = position < 0 ? '' : String(position + 1);
        button.setAttribute('aria-pressed', String(position >= 0));
      });
    }
    function check() {
      if (picked.every(function (value, index) { return value === index; })) {
        buttons.forEach(function (button) { button.classList.add('ok'); button.disabled = true; });
        reset.disabled = true;
        note.replaceChildren(ui.goodNote(q.ref, '성경에 기록된 순서예요.'));
        onOk();
      } else {
        note.replaceChildren(ui.lookNote(q.ref, '성경책에서 순서를 살펴보세요. 옮길 장면을 눌러 뺀 뒤, 원하는 차례에 다시 눌러 보세요.'));
      }
      note.scrollIntoView({ block: 'nearest' });
    }
    return [el('p', { class: 'q-prompt', text: q.prompt }),
      el('p', { class: 'order-hint', text: '번호가 붙은 장면을 다시 누르면 선택에서 빠져요.' }),
      el('div', { class: 'opts' }, shuffled.map(function (index) { return buttons[index]; })), reset, note];
  };
})();
