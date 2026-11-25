(() => {
  'use strict';
  const book = JSON.parse(document.querySelector('#manuscript').textContent);
  const app = document.querySelector('#app');
  const key = 'onyou.genesis.E58.rehearsal.v1';
  const fields = ['잔을 넣으라고 시킨 사람', '시킨 대로 한 사람', '넣으라고 한 것 · 은(　)', '잔이 나온 자루의 임자', '형들이 간 곳'];
  const fresh = () => ({ mode:'start', stage:1, line:0, prior:false, detour:false, entries:Array(10).fill('') });
  function restore() {
    const empty = fresh();
    try {
      const s = JSON.parse(localStorage.getItem(key));
      if (!s || !['start','play','pause','done'].includes(s.mode) || !Number.isInteger(s.stage) || !book.stages[s.stage-1] ||
          !Number.isInteger(s.line) || !book.stages[s.stage-1][s.line] || (s.mode === 'done' && s.stage !== 9)) return empty;
      return { mode:s.mode, stage:s.stage, line:s.line, prior:s.prior === true, detour:s.detour === true,
        entries:empty.entries.map((_, i) => typeof s.entries?.[i] === 'string' ? s.entries[i].slice(0,60) : '') };
    } catch { return empty; }
  }
  let state = restore();
  function save() { try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* In-memory play remains available. */ } }
  function el(tag, text, cls) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  }
  function button(text, action, fn, cls) {
    const node = el('button', text, cls);
    node.type = 'button'; node.dataset.action = action; node.addEventListener('click', fn);
    return node;
  }
  function panel(title) {
    const box = el('details');
    box.append(el('summary',title));
    return box;
  }
  function helpTable(title, rows) {
    const box = panel(title);
    for (const [label, answer, ref] of rows) {
      const item = panel(label);
      item.append(el('p',answer),el('small',ref));
      box.append(item);
    }
    return box;
  }
  function reviewNotes() {
    const box = panel('대표와 목회자가 정할 것 · 7건');
    for (const [issue, current, recommendation] of book.decisions) {
      const item = panel(issue);
      item.append(el('h3','현재 원고'),el('p',current),el('h3','검토 의견'),el('p',recommendation));
      box.append(item);
    }
    return box;
  }
  function switchMode(mode) { state.mode = mode; save(); render(); }
  function go(stage, line = 0) { state.stage = stage; state.line = line; save(); render(); }
  function fieldCount() {
    if ((state.stage === 4 && state.line === book.stages[3].length - 1) || state.stage === 5) return 3;
    if (state.stage === 6) {
      if (state.line < 3) return 3;
      return state.line === book.stages[5].length - 1 ? 5 : 4;
    }
    return state.stage > 6 ? 5 : 0;
  }
  function notebook(count) {
    const section = el('fieldset', '', 'notebook');
    section.append(el('legend','잔의 표'));
    fields.slice(0, count).forEach((name, i) => {
      const row = el('div','','entry');
      [name, '절 번호'].forEach((title, j) => {
        const label = el('label', title);
        const input = el('input');
        const index = i * 2 + j;
        input.maxLength = 60;
        input.value = state.entries[index]; input.dataset.entry = String(index);
        if (j) input.setAttribute('aria-label',name + ' · 절 번호');
        input.addEventListener('input', () => { state.entries[index] = input.value; save(); });
        label.append(input); row.append(label);
      });
      section.append(row);
    });
    return section;
  }
  function recordList() {
    const list = el('ul','','list');
    for (const entry of book.journal.filter(e => !e.detour || state.detour)) {
      const li = el('li','','record');
      li.append(el('strong',entry.title),el('span',entry.text));
      list.append(li);
    }
    return list;
  }
  function maskGuide() {
    const box = panel('어른용 · 실물 성경 가림 위치');
    const diagram = el('div','','mask');
    const blocks = state.stage === 3
      ? [['앞뒤 절과 맞은쪽 덮기',true],['창을 낸 종이 · 창세기 42장 29절',false]]
      : [['창세기 44장 1~13절',false],['14절 위 소제목 · 띠 종이로 덮기',true],
        ['14~17절',false],['18절부터 45장까지 · 가림 종이로 덮기',true]];
    blocks.forEach(([text, covered]) => diagram.append(el('div',text,covered ? 'strip' : '')));
    box.append(diagram,el('small','절 번호로 본 배치 예시입니다. 사용하시는 성경의 단과 쪽에서 종이 위치를 확인하세요.'));
    if (state.stage !== 3) {
      const label = el('label','','mask-option');
      const check = el('input'); check.type='checkbox';
      label.append(check, '검토안 비교 · 9절도 띠 종이로 덮기');
      const first = diagram.firstChild;
      const nine = el('div','9절 · 띠 종이','strip');
      const rest = el('div','10~13절');
      check.addEventListener('change', () => {
        if (check.checked) {
          first.textContent = '창세기 44장 1~8절'; first.after(nine,rest);
        } else {
          first.textContent = '창세기 44장 1~13절'; nine.remove(); rest.remove();
        }
      });
      box.append(label);
    }
    return box;
  }
  function advance() {
    const {stage, line} = state;
    if (stage === 1 && !state.prior && line === 2) return go(2);
    if (line + 1 < book.stages[stage-1].length) return go(stage, line + 1);
    if (stage === 9) return switchMode('done');
    if (stage === 3) { state.detour = true; return go(2); }
    go(stage + 1);
  }
  function start(page) {
    page.append(document.querySelector('#cover').content.cloneNode(true),el('p','창세기 44장 1~17절','stage'),el('h1','E58 · 잔의 표'));
    page.append(el('p','원고의 두 경로를 어른이 직접 따라가는 검토본입니다. 쉼에서는 다음 줄을 누를 때까지 기다립니다.'));
    const options = el('fieldset','','options');
    options.append(el('legend','지난 탐험 일지'));
    for (const [value, label] of [[false,'E57 일지 없음'],[true,'E57 일지 있음']]) {
      const choice = el('label');
      const input = el('input'); input.type='radio'; input.name='prior'; input.checked = state.prior === value;
      input.addEventListener('change', () => { state.prior=value; save(); });
      choice.append(input, label); options.append(choice);
    }
    page.append(options,helpTable('시작 전 어른 도움말',book.help),reviewNotes());
    const actions = el('div','','actions');
    actions.append(button('검토 시작','start',() => switchMode('play'),'primary')); page.append(actions);
  }
  function play(page) {
    const {stage, line} = state;
    const script = book.stages[stage-1];
    const current = script[line];
    const head = el('div','','progress-label');
    head.append(el('b','칸 ' + stage + ' / 9'),el('span',(line + 1) + ' / ' + script.length + '줄'));
    const meter = el('progress'); meter.max = script.length; meter.value = line + 1; meter.setAttribute('aria-label','현재 칸 읽기');
    const label = current.story ? current.role + ' · 탐험대 이야기' : current.role;
    let speech = current.text;
    if (current.role === '쉼') speech = '찾거나 대답할 때까지 기다려요.';
    if (stage === 1 && line === 2 && !state.prior) speech = book.fallback;
    if (stage === 2 && line === 4) {
      if (state.detour) speech = book.retry;
      else if (!state.prior) speech = speech.replace(/^이번에도 /,'');
    }
    page.append(head,meter);
    if (stage === 1 || stage === 3) page.append(document.querySelector('#time-machine').content.cloneNode(true));
    page.append(el('p',label,'role'),el('h1',speech,'line'));
    if (stage === 3 && line === script.length - 2) page.append(el('p',book.journal.find(e => e.detour).text,'record'));
    if (stage === 7 && line === 2) page.append(el('p','고른 카드 · ' + book.choices.find(c => c.to === 4).label,'record'));
    const count = fieldCount();
    if (count) {
      const writing = stage === 4 || stage === 6 && (line === 3 || line === script.length - 1) || stage === 8 && line === 0 || stage === 9;
      if (writing) page.append(notebook(count));
      else {
        const box = panel('작성 중인 잔의 표');
        box.append(notebook(count)); page.append(box);
      }
    }
    if (stage === 9) page.append(recordList());
    const actions = el('div','','actions');
    if (line > 0) actions.append(button('이전 줄','back',() => go(stage,line - 1)));
    if (stage === 2 && line === script.length - 1) {
      const grid = el('div','','choice-grid');
      const status = el('p'); status.id='message'; status.setAttribute('role','status');
      for (const option of book.choices) grid.append(button(option.label,'choice-' + option.to,() => {
        if (state.detour && option.to === 3) { status.textContent=book.retryPrompt; return; }
        go(option.to);
      },'choice'));
      page.append(grid,status);
    } else {
      const text = stage === 9 ? '일지 마치기' : current.role === '쉼' ? '기다렸어요 · 계속' : '다음';
      actions.append(button(text,'advance',advance,'primary'));
    }
    page.append(actions);
    if (stage === 3 || stage >= 4 && stage <= 7) page.append(maskGuide());
    const guide = panel('어른용 · 읽기 도움말');
    if (current.role === '쉼') guide.append(el('p',current.text,'hint'));
    if (current.note) guide.append(el('p',current.note,'hint'));
    guide.append(helpTable('진행을 멈추거나 걱정할 때',book.help),helpTable('아이가 물을 때',book.questions));
    page.append(guide,button('잠시 멈추기','pause',() => switchMode('pause')));
  }
  function render(focus = true) {
    const page = el('section','','page');
    page.dataset.mode = state.mode; page.dataset.stage = state.stage; page.dataset.line = state.line;
    if (state.mode === 'start') start(page);
    if (state.mode === 'play') play(page);
    if (state.mode === 'pause') {
      page.append(el('h1','잠시 멈췄어요'),el('p','칸 ' + state.stage + '에서 이어갈 수 있습니다.'));
      if (state.stage >= 2 && state.stage <= 5) page.append(el('h3','어른용 · 멈출 때'),el('p',book.stopNote,'hint'));
      const actions = el('div','','actions');
      actions.append(button('이어서 검토','resume',() => switchMode('play'),'primary')); page.append(actions);
    }
    if (state.mode === 'done') {
      page.append(el('p','E58 · 창세기 44장','stage'),el('h1','완성한 탐험 일지'),notebook(5),el('h3','원고와 대조하기'),recordList());
      const prayer = panel('원하면 · 한 문장 기도'); prayer.append(el('p',book.prayer));
      page.append(prayer,reviewNotes(),button('새 검토 시작','restart',() => { state = fresh(); switchMode('start'); }));
    }
    app.replaceChildren(page);
    const heading = page.querySelector('h1');
    heading.tabIndex = -1;
    if (focus) { heading.focus({preventScroll:true}); window.scrollTo(0,0); }
  }
  render(false);
})();
