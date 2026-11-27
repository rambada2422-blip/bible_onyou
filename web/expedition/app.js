(() => {
  'use strict';
  if (location.hash !== '#guided') return;
  const key = 'onyou.exodus.expedition.v1',
    root = document.getElementById('game');
  const book = document.getElementById('records'),
    pages = document.getElementById('pages');
  const fresh = () => ({ v: 1, records: [], progress: { step: 0 }, sound: false });
  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      if (
        data?.v === 1 &&
        Array.isArray(data.records) &&
        data.records.length <= chapters.length &&
        data.records.every((r) => r && typeof r.memory === 'string') &&
        Number.isInteger(data.progress?.step) &&
        data.progress.step >= 0
      )
        return data;
    } catch {
      /* 저장을 사용할 수 없어도 현재 탐험은 계속된다. */
    }
    return fresh();
  }
  let state = load(),
    index = 0,
    mode = 'home',
    replay = null,
    cleanup = [],
    notice = '',
    storageFailed = false;
  const progress = () => replay || state.progress;
  const audio = new Audio();
  audio.loop = true;
  audio.volume = 0.24;
  let tune = '',
    synth;
  function syncSound() {
    const btn = document.getElementById('sound');
    btn.textContent = state.sound ? '소리 끄기' : '소리 켜기';
    btn.setAttribute('aria-pressed', String(state.sound));
    const name =
      mode === 'home'
        ? 'marchSound'
        : ['river', 'frogs'].includes(chapters[index].game)
          ? 'riverSound'
          : chapters[index].game === 'sea'
            ? 'seaSound'
            : ['camp', 'mountain', 'cloud'].includes(chapters[index].game)
              ? 'campSound'
              : 'marchSound';
    if (!state.sound || document.hidden) {
      audio.pause();
      return;
    }
    if (tune !== name) {
      tune = name;
      audio.src = assets[name];
    }
    if (audio.paused) audio.play().catch(() => {});
  }
  function tone(kind) {
    if (!state.sound || document.hidden) return;
    try {
      synth ||= new (window.AudioContext || window.webkitAudioContext)();
      if (synth.state === 'suspended') synth.resume().catch(() => {});
      const now = synth.currentTime;
      if (kind === 'distant' || kind === 'croak') {
        // 멀리서 나는 웅성거림과 개구리의 짧은 두 소리. 인물 대사를 재현하지 않는다.
        const crowd = kind === 'distant',
          length = crowd ? 1.15 : 0.14;
        const noise = synth.createBuffer(1, Math.ceil(synth.sampleRate * length), synth.sampleRate);
        const samples = noise.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
        for (const delay of crowd ? [0, 0.18] : [0, 0.15]) {
          const voice = synth.createBufferSource(),
            band = synth.createBiquadFilter(),
            amp = synth.createGain(),
            t = now + delay;
          voice.buffer = noise;
          band.type = 'bandpass';
          band.Q.value = crowd ? 1.8 : 4.5;
          band.frequency.setValueAtTime(crowd ? 480 : 740, t);
          band.frequency.exponentialRampToValueAtTime(crowd ? 340 : 300, t + length);
          amp.gain.setValueAtTime(0.001, t);
          amp.gain.exponentialRampToValueAtTime(crowd ? 0.15 : 0.22, t + length * 0.2);
          amp.gain.exponentialRampToValueAtTime(0.001, t + length);
          voice.connect(band);
          band.connect(amp);
          amp.connect(synth.destination);
          voice.start(t);
        }
        return;
      }
      const osc = synth.createOscillator(),
        gain = synth.createGain();
      osc.type = kind === 'photo' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(kind === 'drum' ? 145 : kind === 'photo' ? 540 : 320, now);
      osc.frequency.exponentialRampToValueAtTime(kind === 'drum' ? 48 : 160, now + 0.14);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
      osc.connect(gain);
      gain.connect(synth.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      /* 소리를 지원하지 않는 브라우저 */
    }
  }
  function save() {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      storageFailed = true;
    }
    document.getElementById('count').textContent = state.records.length + '/9';
  }
  function node(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function button(label, fn, cls = 'action') {
    const b = node('button', cls, label);
    b.type = 'button';
    b.addEventListener('click', fn);
    return b;
  }
  function image(name, cls, alt = '') {
    const img = node('img', cls);
    img.src = assets[name];
    img.alt = alt;
    img.draggable = false;
    return img;
  }
  function reset() {
    cleanup.forEach((fn) => fn());
    cleanup = [];
    root.replaceChildren();
    syncSound();
  }
  function headingFocus() {
    const h = root.querySelector('h1');
    h.tabIndex = -1;
    h.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
  function home(focus = false) {
    mode = 'home';
    replay = null;
    reset();
    const count = state.records.length,
      finished = count === chapters.length;
    const hero = node('section', 'hero'),
      copy = node('div', 'herotext');
    hero.append(image('cover', '', '강을 건넌 일행이 맞은편 바닷가를 바라보는 모습'), copy);
    copy.append(
      node('span', 'overline', '출애굽기 현장 탐험'),
      node('h1', '', '구름을 따라'),
      node(
        'p',
        '',
        finished
          ? '애굽 일터에서 광야의 끝까지, 아홉 현장의 기록을 모았다.'
          : '흙 묻은 손으로 벽돌을 건네고, 갈대 사이 작은 바구니를 따라 광야로 떠나는 여정.'
      ),
      button(
        finished
          ? '완성한 수첩 열기'
          : count || state.started
            ? '떠난 현장 이어가기  →'
            : '애굽 일터로 출발  →',
        () => (finished ? openBook() : enter(count)),
        'primary'
      )
    );
    const h = node('div', 'route-head');
    h.append(node('h2', '', '원정길'), node('span', '', count + ' / 9개 현장 기록'));
    const list = node('ol', 'route');
    chapters.forEach((c, i) => {
      const item = node('li'),
        b = button('', () => enter(i), '');
      b.append(
        node('b', '', String(i + 1).padStart(2, '0')),
        node('span', '', c.name),
        node('small', '', i < count ? '다시 탐험' : i === count ? '여기서 출발' : '')
      );
      if (i > count) b.disabled = true;
      if (i === count) b.classList.add('current');
      item.append(b);
      list.append(item);
    });
    root.append(hero, h, list);
    if (focus) headingFocus();
  }
  function enter(i) {
    if (!Number.isInteger(i) || i < 0 || i >= chapters.length || i > state.records.length) return;
    index = i;
    mode = 'play';
    replay = i < state.records.length ? { step: 0 } : null;
    state.started = true;
    save();
    render();
    headingFocus();
  }
  function memory(p) {
    switch (chapters[index].game) {
      case 'sea':
        return '건너편에서 직접 두드린 소고 가락';
      case 'river':
        return (p.path || []).includes(2)
          ? '갈대 틈으로 돌아 누이 곁까지 걸었다.'
          : '높은 둑으로 올라 누이 곁까지 걸었다.';
      case 'frogs':
        return '개구리 사진의 위치 · ' + (p.photos || []).join(' → ');
      case 'desert':
      case 'years':
        return '그늘 길 ' + (p.shade || 0) + '번 · 물을 함께 마신 횟수 ' + (p.shared || 0) + '번';
      case 'camp':
        return '내 조사 순서 · ' + p.found.map((i) => campEvidence[i].name).join(' → ');
      default:
        return '';
    }
  }
  function photoStrip(item) {
    const strip = node('div', 'photo-strip');
    (item.snapshots || []).forEach((url, i) => {
      if (typeof url !== 'string' || !url.startsWith('data:image/jpeg;base64,')) return;
      const fig = node('figure'),
        img = node('img');
      img.src = url;
      img.alt = ['강가', '마당', '부엌'][i] + '에서 찍은 개구리';
      fig.append(img, node('figcaption', '', ['강가', '마당', '부엌'][i]));
      strip.append(fig);
    });
    return strip;
  }
  function rhythmButton(item) {
    let timers = [];
    const b = button(
      '내 소고 가락 다시 치기',
      () => {
        timers.forEach(clearTimeout);
        timers = [];
        const beats = [0, item.rhythm[0], item.rhythm[0] + item.rhythm[1]];
        const hit = (i) => {
          b.textContent = '둥 ' + ['● ○ ○', '○ ● ○', '○ ○ ●'][i];
          tone('drum');
        };
        beats.forEach((t, i) =>
          timers.push(
            setTimeout(() => {
              if (b.isConnected) hit(i);
            }, t)
          )
        );
        timers.push(
          setTimeout(() => {
            b.textContent = '내 소고 가락 다시 치기';
          }, beats[2] + 420)
        );
      },
      'action secondary'
    );
    return b;
  }
  function finish() {
    const p = progress(),
      item = { memory: memory(p) };
    if (p.snapshots?.length) item.snapshots = p.snapshots;
    if (p.rhythm?.length === 2) item.rhythm = p.rhythm;
    if (index === state.records.length) {
      state.records.push(item);
      state.progress = { step: 0 };
      save();
    }
    mode = 'result';
    reset();
    const v = chapters[index];
    const header = node('div', 'stage-head'),
      group = node('div');
    group.append(
      node(
        'span',
        'location',
        (replay ? '다시 찾은 단서  ' : '탐험 수첩에 붙인 단서  ') + (index + 1) + ' / 9'
      ),
      node('h1', '', v.clue)
    );
    header.append(group);
    const grid = node('div', 'stage-grid'),
      scene = node('div', 'stage'),
      panel = node('section', 'panel');
    const wrapArt = ['clay', 'court', 'kitchen', 'song', 'oasis', 'rings', 'intercede', 'tents', 'tents'];
    scene.append(image(wrapArt[index], 'backdrop', ''), node('span', 'place-tag', v.place));
    panel.append(
      node('span', 'chapter-tag', v.ref),
      node('h2', '', '현장에서 찾은 기록'),
      node('p', '', v.record)
    );
    if (index < chapters.length - 1 && !replay) {
      const bridge = node('details', 'reading');
      bridge.append(node('summary', '', '다음 현장 이야기'), node('p', '', chapters[index + 1].intro));
      panel.append(bridge);
    }
    if (item.memory) panel.append(node('p', 'feedback-row', item.memory));
    if (item.snapshots) panel.append(photoStrip(item));
    if (item.rhythm) panel.append(rhythmButton(item));
    panel.append(verseDetails(index));
    const row = node('div', 'actions');
    if (replay && item.memory) {
      const update = button(
        '이번 탐험으로 이 장 바꾸기',
        () => {
          state.records[index] = item;
          save();
          update.textContent = '이번 기록을 수첩에 붙였다';
          update.disabled = true;
        },
        'action secondary'
      );
      row.append(update);
    }
    row.append(
      button(
        index === chapters.length - 1
          ? '완성한 수첩 열기'
          : replay
            ? '원정길로 돌아가기'
            : '다음 현장 · ' + chapters[index + 1].place.split(' · ').at(-1),
        () => {
          if (index === chapters.length - 1) {
            home();
            openBook();
          } else if (replay) home(true);
          else enter(index + 1);
        },
        'primary'
      )
    );
    panel.append(row);
    grid.append(scene, panel);
    root.append(header, grid);
    headingFocus();
  }
  function verseDetails(i) {
    const d = node('details', 'reading');
    d.append(node('summary', '', '성경 단서 펼치기'));
    for (const [ref, words] of fieldVerses[i])
      d.append(node('p', 'ref', ref + ' · 개역성경 (KorRV)'), node('blockquote', '', words));
    return d;
  }
  function render(message = '') {
    notice = message;
    const c = chapters[index],
      p = progress(),
      focusId = document.activeElement?.dataset?.fieldControl;
    reset();
    const head = node('div', 'stage-head'),
      title = node('div');
    title.append(node('span', 'location', c.place), node('h1', '', c.name));
    const progressMark = node('div', 'chapter-no'),
      pips = node('div', 'pips');
    pips.setAttribute('aria-hidden', 'true');
    chapters.forEach((_, i) => pips.append(node('i', i <= index ? 'on' : '')));
    progressMark.append(pips, node('span', 'ref', '현장 ' + (index + 1) + ' / 9'));
    head.append(title, progressMark);
    const grid = node('div', 'stage-grid'),
      stage = node('section', 'stage'),
      panel = node('section', 'panel');
    stage.setAttribute('aria-label', c.place + ' 놀이판');
    const bg = image(c.art, 'backdrop');
    stage.append(bg, node('span', 'place-tag', c.place.split(' · ').at(-1)));
    const label = node('span', 'chapter-tag', '탐험대의 임무'),
      h2 = node('h2'),
      instruction = node('p'),
      evidenceBox = node('div'),
      statusBox = node('div', 'feedback-row'),
      actions = node('div', 'actions'),
      live = node('div', 'notice');
    live.setAttribute('role', 'status');
    live.textContent = notice;
    panel.append(label, h2, instruction, evidenceBox, statusBox, actions, live);
    const history = node('details', 'journal-note');
    history.append(
      node('summary', '', '이곳에 오기까지 · ' + c.ref),
      node('p', '', c.intro),
      verseDetails(index)
    );
    panel.append(history);
    if (storageFailed)
      panel.append(node('p', 'ref', '이 브라우저에서 저장할 수 없어 이번 창에서만 이어진다.'));
    grid.append(stage, panel);
    root.append(head, grid);
    function prop(cls, x, y, tag = 'div') {
      const a = node(tag, 'prop ' + cls);
      if (x !== undefined) a.style.left = x + '%';
      if (y !== undefined) a.style.top = y + '%';
      stage.append(a);
      return a;
    }
    function control(label, fn, cls) {
      const b = button(label, fn, cls);
      b.dataset.fieldControl = label;
      return b;
    }
    const opts = {
      p,
      stage,
      prop,
      save,
      render,
      finish,
      tone,
      dispose: (fn) => cleanup.push(fn),
      art: (name) => {
        bg.src = assets[name];
      },
      pin: (name, x, y, fn) => {
        const b = control(name, fn, 'pin');
        b.style.left = x + '%';
        b.style.top = y + '%';
        stage.append(b);
        return b;
      },
      action: (name, fn, secondary = false) => {
        const b = control(name, fn, 'action' + (secondary ? ' secondary' : ''));
        actions.append(b);
        return b;
      },
      task: (title, text) => {
        h2.textContent = title;
        instruction.textContent = text;
      },
      status: (text) => {
        statusBox.textContent = text;
      },
      evidence: (ref, text) => {
        const e = node('div', 'record');
        e.append(node('b', 'token', ref), node('p', '', text));
        evidenceBox.append(e);
      },
      meter: (text) => {
        const m = node('div', 'meter', text);
        stage.append(m);
        return m;
      },
      tell: (text) => {
        live.textContent = text;
      },
      step: (text) => {
        p.step++;
        save();
        render(text);
      }
    };
    fieldGames[c.game](opts);
    if (focusId) {
      const next = Array.from(root.querySelectorAll('[data-field-control]')).find(
        (e) => e.dataset.fieldControl === focusId
      );
      if (next) next.focus({ preventScroll: true });
      else {
        h2.tabIndex = -1;
        h2.focus({ preventScroll: true });
      }
    }
  }
  function openBook() {
    pages.replaceChildren();
    const count = state.records.length;
    pages.append(node('p', 'minor', count + ' / 9개 현장 기록'));
    if (!count) pages.append(node('p', '', '첫 벽돌을 건네면 일터의 기록이 이곳에 남는다.'));
    state.records.forEach((r, i) => {
      const v = chapters[i],
        sec = node('section', 'entry');
      sec.append(node('small', '', v.ref), node('h3', '', v.clue), node('p', '', v.record));
      if (r.memory) sec.append(node('p', 'feedback-row', r.memory));
      if (r.snapshots) sec.append(photoStrip(r));
      if (r.rhythm) sec.append(rhythmButton(r));
      sec.append(verseDetails(i), node('small', '', v.note));
      pages.append(sec);
    });
    book.showModal();
    document.getElementById('close').focus();
  }
  document.getElementById('journal').onclick = openBook;
  document.getElementById('close').onclick = () => book.close();
  document.getElementById('home').onclick = () => home(true);
  document.getElementById('sound').onclick = () => {
    state.sound = !state.sound;
    save();
    syncSound();
    if (state.sound) tone('tap');
  };
  window.addEventListener('storage', (event) => {
    if (event.key !== key) return;
    state = load();
    document.getElementById('count').textContent = state.records.length + '/9';
    const wasOpen = book.open;
    if (wasOpen) book.close();
    if (mode === 'play' && (replay || index === state.records.length)) render();
    else home();
    if (wasOpen) openBook();
  });
  document.addEventListener('visibilitychange', syncSound);
  document.getElementById('count').textContent = state.records.length + '/9';
  const roadLink = node('a', 'road-return', '길 위의 탐험으로');
  roadLink.href = '#road';
  document.querySelector('.mast-inner').append(roadLink);
  addEventListener('hashchange', () => location.reload());
  home();
})();
