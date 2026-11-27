// A continuous first-person crossing. Only the travellers' choices are fictional.
(() => {
  'use strict';
  if (['#road', '#road-arrival', '#guided'].includes(location.hash)) return;
  const fromJourney = location.hash === '#crossing-journey';
  const by = (id) => document.getElementById('cx-' + id);
  const root = document.getElementById('crossing');
  root.hidden = false;
  document.body.classList.add('on-crossing');
  const stage = by('view'),
    art = createCrossingArt(stage),
    key = 'onyou.crossing.v1';
  const limit = 128,
    clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const fresh = () => ({
    v: 1,
    z: 0,
    x: 0,
    light: false,
    traveler: false,
    route: '',
    gusts: 0,
    ended: false,
    started: false,
    sound: true
  });
  function load() {
    try {
      const r = JSON.parse(localStorage.getItem(key));
      if (r?.v === 1 && Number.isFinite(r.x) && Number.isFinite(r.z) && r.z >= 0 && r.z <= limit)
        return { ...fresh(), ...r, x: clamp(r.x, -1, 1) };
    } catch {}
    return fresh();
  }
  let s = load(),
    mode = 'title',
    timeline = 0,
    time = 0,
    prev = null,
    lastSave = -1,
    lastPlace = '',
    caption = '',
    captionUntil = 0;
  let looking = false,
    tilt = 0,
    lookSeconds = 0;
  let speed = 0,
    brace = 0,
    grip = 0,
    heldAction = false,
    left = false,
    right = false,
    dash = false,
    autoDash = false;
  let aim = null,
    drag = null,
    steering = 0,
    beat = 0,
    lastFoot = -1,
    hitRock = null,
    activeGust = -1,
    wind = 0,
    oldWind = 0;
  let loadedArt = false,
    lastWait = -10,
    controlLabel = '';
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  let rhythm = [],
    echoTimers = [];
  const music = new Audio();
  music.preload = 'none';
  music.loop = true;
  music.volume = 0.32;
  let audio = null,
    windNode = null,
    windVolume = null;
  function wakeSound() {
    if (!s.sound) return;
    try {
      if (!audio) {
        audio = new (window.AudioContext || window.webkitAudioContext)();
        const buffer = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate),
          a = buffer.getChannelData(0);
        let smooth = 0;
        for (let i = 0; i < a.length; i++) {
          smooth = 0.94 * smooth + 0.06 * (Math.random() * 2 - 1);
          a[i] = smooth * 2.1;
        }
        windNode = audio.createBufferSource();
        windNode.buffer = buffer;
        windNode.loop = true;
        windVolume = audio.createGain();
        windVolume.gain.value = 0.07;
        windNode.connect(windVolume).connect(audio.destination);
        windNode.start();
      }
      audio.resume().catch(() => {});
    } catch {}
    if (mode === 'walk' && !document.hidden) {
      if (!music.getAttribute('src')) music.src = assets.seaSound;
      music.play().catch(() => {});
    }
  }
  function quiet() {
    music.pause();
    if (windVolume && audio) windVolume.gain.setTargetAtTime(0, audio.currentTime, 0.12);
  }
  function note(freq, length, gain = 0.12, pan = 0, type = 'sine', drop = 0.55) {
    if (!audio || audio.state !== 'running' || !s.sound || document.hidden) return;
    const osc = audio.createOscillator(),
      env = audio.createGain(),
      at = audio.currentTime;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    osc.frequency.exponentialRampToValueAtTime(freq * drop, at + length);
    env.gain.setValueAtTime(0.001, at);
    env.gain.exponentialRampToValueAtTime(gain, at + 0.012);
    env.gain.exponentialRampToValueAtTime(0.001, at + length);
    osc.connect(env);
    if (audio.createStereoPanner) {
      const p = audio.createStereoPanner();
      p.pan.value = pan;
      env.connect(p).connect(audio.destination);
    } else env.connect(audio.destination);
    osc.start(at);
    osc.stop(at + length + 0.02);
  }
  function soundButton() {
    by('sound').textContent = s.sound ? '소리 켬' : '소리 끔';
    by('sound').setAttribute('aria-pressed', String(s.sound));
  }
  function save() {
    try {
      localStorage.setItem(key, JSON.stringify(s));
    } catch {}
  }
  function resetInput() {
    left = right = dash = heldAction = false;
    drag = null;
    aim = null;
    steering = 0;
    grip = 0;
    autoDash = false;
  }
  function showMode(m) {
    mode = m;
    root.dataset.mode = m;
    by('cover').hidden = m !== 'title';
    by('play').hidden = m !== 'walk';
    by('pause').hidden = m !== 'walk';
    by('panel').hidden = !['pause', 'end'].includes(m);
    by('look').hidden = m !== 'walk';
    by('play').querySelector('.cx-controls').hidden = false;
    music.volume = 0.32;
    if (m !== 'walk') {
      speed = 0;
      looking = false;
      tilt = 0;
      resetInput();
      quiet();
    }
    by('look').setAttribute('aria-pressed', String(looking));
    by('look').textContent = '물벽 올려보기';
  }
  function say(text, seconds = 3.6) {
    caption = text;
    captionUntil = time + seconds;
    if (caption !== by('message').textContent) by('message').textContent = text;
  }
  function place() {
    if (s.z < 32) return '바닷길 어귀';
    if (s.z < 66)
      return s.route === 'shelf' ? '바위 그늘길' : s.route === 'open' ? '트인 모랫길' : '갈라지는 길';
    if (s.z < 95) return '가장 좁은 물목';
    return '새벽의 건너편';
  }
  function context() {
    if (!s.light && Math.abs(21 - s.z) < 8 && Math.abs(s.x + 0.75) < 0.47) return '등불에 답하기';
    if (!s.traveler && Math.abs(82 - s.z) < 8 && Math.abs(s.x - 0.77) < 0.44) return '짐 함께 들기';
    return '몸 낮추기';
  }
  function refresh() {
    const where = place();
    if (where !== lastPlace) {
      by('place').textContent = where;
      lastPlace = where;
    }
    const z = Math.floor(s.z);
    const remaining = limit - z + ' m';
    if (by('metres').textContent !== remaining) by('metres').textContent = remaining;
    by('progress').style.width = (s.z / limit) * 100 + '%';
    const action = context(),
      label = grip > 0 ? '들어 올리기 ' + Math.round(grip * 100) + '%' : action;
    if (label !== controlLabel) {
      by('use').textContent = label;
      controlLabel = label;
    }
    by('use').classList.toggle('near', action !== '몸 낮추기');
    const pace = autoDash || dash ? '걷기' : '달리기';
    if (by('pace').textContent !== pace) by('pace').textContent = pace;
    if (caption && time > captionUntil) say('', 0);
  }
  function panel(title, body, kicker, buttons) {
    by('eyebrow').textContent = kicker;
    by('heading').textContent = title;
    by('detail').textContent = body;
    const list = by('choices');
    list.replaceChildren();
    buttons.forEach(([text, action], i) => {
      const b = document.createElement('button');
      b.textContent = text;
      if (!i) b.className = 'cx-primary';
      b.onclick = action;
      list.append(b);
    });
    list.firstChild?.focus({ preventScroll: true });
  }
  function road(arrival = false) {
    location.hash = arrival ? 'road-arrival' : 'road';
  }
  function begin() {
    const resume = s.started && !s.ended;
    if (s.ended) {
      const sound = s.sound;
      s = fresh();
      s.sound = sound;
      timeline = 0;
      lastFoot = -1;
      lastSave = -1;
      activeGust = -1;
      hitRock = null;
      wind = oldWind = brace = 0;
      lastWait = -10;
    }
    clearEcho();
    s.started = true;
    showMode('walk');
    wakeSound();
    save();
    by('start').blur();
    refresh();
    say(
      resume ? '걸음을 멈췄던 자리에서 이어 간다.' : '저 왼쪽, 누군가 등불을 들었다. 좌우로 길을 골라 보자.',
      5
    );
  }
  function pause() {
    if (mode !== 'walk') return;
    save();
    showMode('pause');
    panel('잠시 멈춘 길', place() + ' · 건너편까지 ' + Math.ceil(limit - s.z) + ' m', '홍해', [
      [
        '계속 걷기',
        () => {
          showMode('walk');
          wakeSound();
          say('');
        }
      ],
      ['조작 보기', instructions],
      ['일곱 현장 원정', () => road()]
    ]);
  }
  function instructions() {
    panel(
      '바닷길에서',
      '앞으로는 저절로 걷는다. 좌우 단추나 A·D로 방향을 바꾸고, W를 누르거나 달리기를 켜면 속도가 붙는다.\n돌풍에는 바위 뒤를 지나거나 행동 단추를 길게 눌러 몸을 낮춘다. 등불이나 동료 옆에서는 같은 단추로 돕는다.',
      '조작',
      [
        [
          '계속 걷기',
          () => {
            showMode('walk');
            wakeSound();
          }
        ],
        ['원정으로', () => road()]
      ]
    );
  }
  function clearEcho() {
    echoTimers.forEach(clearTimeout);
    echoTimers = [];
  }
  function stroke(rim, reply = false) {
    beat = 1;
    note(
      rim ? 310 : 148,
      rim ? 0.13 : 0.34,
      reply ? 0.24 : 0.36,
      reply ? 0.55 : -0.27,
      rim ? 'triangle' : 'sine',
      rim ? 0.52 : 0.38
    );
    if (reply) note(rim ? 585 : 370, 0.21, 0.047, -0.18, 'triangle', 0.86);
  }
  function echo(sequence) {
    clearEcho();
    const start = sequence[0].at;
    sequence.forEach((hit, index) => {
      echoTimers.push(
        setTimeout(
          () => {
            if (mode !== 'end' || document.hidden) return;
            stroke(hit.rim, true);
            by('eyebrow').textContent =
              '건너편의 답가   ' +
              sequence
                .slice(0, index + 1)
                .map((h) => (h.rim ? '딱' : '둥'))
                .join('  ');
          },
          460 + hit.at - start
        )
      );
    });
  }
  function drum(rim = false) {
    wakeSound();
    clearEcho();
    stroke(rim);
    const now = performance.now(),
      last = rhythm[rhythm.length - 1];
    if (rhythm.length === 3) rhythm = [];
    rhythm.push({ rim, at: rhythm.length ? last.at + clamp(now - last.real, 140, 950) : 0, real: now });
    by('eyebrow').textContent = '내 소고   ' + rhythm.map((h) => (h.rim ? '딱' : '둥')).join('  ');
    if (rhythm.length === 3) {
      s.song = rhythm.map(({ rim, at }) => ({ rim, at }));
      save();
      echo(s.song);
      by('detail').textContent =
        '내 가락에 건너편의 소고가 답한다.\n미리암과 여인들이 소고를 들고 춤추었다.  출 15:20–21';
    }
  }
  function ending() {
    s.z = limit;
    s.ended = true;
    save();
    showMode('end');
    rhythm = [];
    clearEcho();
    note(330, 0.55, 0.1);
    panel(
      '건너편의 노래',
      s.light
        ? '등불을 들었던 동료와 짐을 나눠 진 나그네가 곁에 섰다.'
        : '나그네가 내려놓은 짐 옆에서 첫 소고 소리가 들린다.',
      '출애굽기 14:21–22 · 15:20–21',
      [
        ['소고 두드리기', () => drum(false)],
        ['테두리 치기', () => drum(true)],
        [fromJourney ? '원정에서 계속' : '일곱 현장 원정', () => road(fromJourney)],
        ['다른 길로 건너기', begin],
        [
          '본문 단서',
          () => {
            clearEcho();
            const words = fieldVerses[3].map(([ref, verse]) => ref + '  ' + verse).join('\n\n');
            panel(
              '바다와 건너편',
              words + '\n\n등불 동료와 짐을 나누는 나그네는 탐험을 위해 만든 인물이다.',
              '개역성경 · 출애굽기',
              [['건너편으로 돌아가기', ending]]
            );
          }
        ]
      ]
    );
  }
  function actDown() {
    if (mode !== 'walk' || heldAction) return;
    heldAction = true;
    const what = context();
    if (what === '등불에 답하기') {
      s.light = true;
      note(485, 0.28, 0.12, -0.58, 'triangle', 0.94);
      say('불빛이 돌아섰다. 붉은 옷의 동료가 바람을 피할 길을 앞장선다.', 4.4);
      save();
    } else if (what === '짐 함께 들기') say('손을 놓지 말고 함께 들어 올려 보자.', 2.4);
  }
  function actUp() {
    heldAction = false;
    if (grip > 0 && grip < 1) say('조금만 더. 행동 단추를 길게 눌러 보자.', 2.7);
    grip = 0;
  }
  function squall(dt) {
    const prevWind = wind;
    const phase = (timeline + 1.2) % 9.2;
    const inPass = s.z > 28 && s.z < 117;
    wind = inPass ? Math.max(0, Math.min((phase - 5.6) / 0.75, 1, (8.8 - phase) / 0.8)) : 0;
    if (inPass && phase > 4.1 && phase < 5.6 && activeGust !== Math.floor((timeline + 1.2) / 9.2)) {
      activeGust = Math.floor((timeline + 1.2) / 9.2);
      if (!heldAction && !(s.z >= 72 && !s.traveler)) say('천이 팽팽해진다. 곧 옆바람이 온다.', 1.6);
      note(91, 0.65, 0.08, -0.7, 'sine', 0.75);
    }
    const lee =
      (s.route === 'shelf' && s.z < 65 && s.x < -0.34) ||
      art.rockRows.some(([x, z]) => s.z > z && s.z - z < 5.8 && Math.abs(s.x - x) < 0.46);
    if (wind > 0.6 && prevWind <= 0.6 && (lee || heldAction)) {
      s.gusts++;
      say(lee ? '바위가 바람을 막아 준다.' : '몸을 낮추자 바람이 머리 위로 지나간다.', 2.1);
    }
    const target = heldAction && context() === '몸 낮추기' ? 1 : 0;
    brace += (target - brace) * Math.min(1, dt * 8);
    if (windVolume && audio && s.sound)
      windVolume.gain.setTargetAtTime(0.08 + wind * (lee ? 0.13 : 0.72), audio.currentTime, 0.22);
    oldWind = lee ? 0 : wind;
    if (!lee && wind > 0 && brace < 0.5) s.x = clamp(s.x + wind * dt * 0.39, -1, 1);
  }
  function look() {
    if (mode !== 'walk') return;
    looking = !looking;
    lookSeconds = 0;
    resetInput();
    by('look').textContent = looking ? '길로 시선 돌리기' : '물벽 올려보기';
    by('look').setAttribute('aria-pressed', String(looking));
    by('play').querySelector('.cx-controls').hidden = looking;
    music.volume = looking ? 0.14 : 0.32;
    say(looking ? '물벽 안쪽에 무언가 움직인다.' : '', 2.2);
  }
  function advance(dt) {
    tilt += ((looking ? 1 : 0) - tilt) * (still.matches ? 1 : Math.min(1, dt * 6));
    if (looking) {
      speed = 0;
      lookSeconds += dt;
      if (lookSeconds > 1.2 && !s.school) {
        s.school = true;
        say('물살을 가로지르는 작은 물고기 떼.', 3.2);
        save();
      }
      if (caption && time > captionUntil) say('');
      return;
    }
    timeline += dt;
    let axis = (right ? 1 : 0) - (left ? 1 : 0) + steering;
    if (axis) aim = null;
    if (aim !== null && !axis) {
      const step = dt * 1.9,
        dist = aim - s.x;
      s.x += clamp(dist, -step, step);
      if (Math.abs(dist) <= step) aim = null;
    }
    s.x = clamp(s.x + clamp(axis, -1, 1) * dt * 1.42, -1, 1);
    squall(dt);
    const what = context(),
      lifting = heldAction && what === '짐 함께 들기';
    if (lifting) {
      grip = Math.min(1, grip + dt / 1.15);
      if (grip >= 1) {
        s.traveler = true;
        grip = 0;
        heldAction = false;
        say('짐이 가벼워졌다. 이제 함께 걸을 수 있다.', 3.6);
        note(294, 0.36, 0.16, 0.6, 'triangle', 0.94);
        save();
      }
    } else grip = 0;
    if (!s.route && s.z >= 36) {
      s.route = s.x < 0 ? 'shelf' : 'open';
      say(
        s.route === 'shelf'
          ? '바위 그늘길. 왼편에 붙으면 바람이 잦아든다.'
          : '트인 모랫길. 바람이 잦을 때 달리면 빠르다.',
        4
      );
      save();
    }
    let target = (dash || autoDash ? 6.9 : 3.2) * (s.route === 'open' && s.z > 37 && s.z < 66 ? 1.24 : 1);
    target *= 1 - oldWind * 0.72;
    target *= 1 - brace * 0.78;
    if (s.z > 74 && !s.traveler) target *= 0.67;
    if (lifting || (!s.traveler && s.z >= 80.5)) target = 0;
    if (!s.traveler && s.z >= 80 && timeline - lastWait > 4.8) {
      say(
        what === '짐 함께 들기'
          ? '행동 단추를 길게 눌러 짐 한쪽을 들어 주자.'
          : '오른쪽에 멈춘 사람이 있다. 곁으로 다가가 보자.',
        4.4
      );
      lastWait = timeline;
    }
    const rock = art.rockRows.find(
      ([x, z, scale]) => z - s.z <= 3.1 && z - s.z > 0.1 && Math.abs(s.x - x) < 0.28 * scale
    );
    if (rock) {
      target = 0;
      if (hitRock !== rock || time > captionUntil) {
        const preferred = s.x < rock[0] ? -1 : 1;
        const side = rock[0] > 0.55 ? -1 : rock[0] < -0.55 ? 1 : preferred;
        say((side < 0 ? '왼쪽' : '오른쪽') + ' 모래를 누르면 바위턱을 돌아간다.', 4);
        if (hitRock !== rock) note(79, 0.15, 0.11);
        hitRock = rock;
      }
    } else hitRock = null;
    speed += (target - speed) * Math.min(1, dt * (target === 0 ? 16 : 4));
    let next = s.z + speed * dt;
    if (rock) next = Math.min(next, rock[1] - 0.3);
    if (!s.traveler) next = Math.min(next, 80.6);
    const old = s.z;
    s.z = next;
    if (old < 28.3 && s.z >= 28.3) say('왼쪽 붉은 천은 바위 그늘길. 오른쪽은 탁 트인 지름길이다.', 5.5);
    if (old < 70 && s.z >= 70) {
      say('오른쪽에서 짐 내려놓는 소리가 났다.', 4);
      note(122, 0.24, 0.23, 0.85);
    }
    if (old < 111 && s.z >= 111) {
      say('바람 너머로 소고 소리가 들린다.', 3.5);
      note(165, 0.31, 0.16, 0.38);
    }
    const foot = Math.floor(s.z / 1.18);
    if (foot !== lastFoot && speed > 0.45) {
      lastFoot = foot;
      note(67 + (foot % 3) * 12, 0.095, 0.065, foot % 2 ? 0.26 : -0.26);
    }
    if (s.z >= limit) {
      ending();
      return;
    }
    if (Math.abs(s.z - lastSave) >= 1) {
      save();
      lastSave = s.z;
    }
    refresh();
  }
  function frame(ts) {
    const dt = prev === null ? 0 : Math.min((ts - prev) / 1000, 0.065);
    prev = ts;
    if (!document.hidden && loadedArt) {
      if (mode !== 'pause') time += dt;
      if (mode === 'walk') advance(dt);
      beat = Math.max(0, beat - dt * 2);
      art.draw({
        look: tilt,
        mode,
        z: mode === 'title' ? 0 : s.z,
        x: s.x,
        time,
        wind: mode === 'walk' ? wind : 0,
        still: still.matches,
        light: s.light,
        traveler: s.traveler,
        grip,
        blocked:
          mode === 'walk' && hitRock
            ? {
                aim: clamp(
                  hitRock[0] +
                    (hitRock[0] > 0.55 ? -1 : hitRock[0] < -0.55 ? 1 : s.x < hitRock[0] ? -1 : 1) * 0.59,
                  -1,
                  1
                )
              }
            : null,
        brace: mode === 'walk' ? brace : 0,
        motion: Math.min(speed / 3.2, 1),
        beat,
        silent: mode !== 'walk'
      });
    }
    requestAnimationFrame(frame);
  }
  function holdButton(id, down, up) {
    const el = by(id);
    let skipClick = false;
    el.onpointerdown = (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      skipClick = true;
      down();
    };
    el.onpointerup = el.onpointercancel = el.onlostpointercapture = () => up();
    el.onclick = () => {
      if (skipClick) {
        skipClick = false;
        return;
      }
      down();
      if (id === 'use' && context() === '짐 함께 들기') {
        heldAction = true;
      } else setTimeout(up, 230);
    };
  }
  function steerButton(id, sign) {
    let origin = 0;
    holdButton(
      id,
      () => {
        origin = s.x;
        aim = null;
        if (sign < 0) left = true;
        else right = true;
      },
      () => {
        if (!(sign < 0 ? left : right)) return;
        if (Math.abs(s.x - origin) < 0.32) aim = clamp(origin + sign * 0.43, -1, 1);
        if (sign < 0) left = false;
        else right = false;
      }
    );
  }
  steerButton('left', -1);
  steerButton('right', 1);
  holdButton('use', actDown, actUp);
  by('pace').onclick = () => {
    autoDash = !autoDash;
    refresh();
  };
  by('pause').onclick = pause;
  by('look').onclick = look;
  by('start').onclick = begin;
  by('sound').onclick = () => {
    s.sound = !s.sound;
    soundButton();
    if (s.sound) wakeSound();
    else quiet();
    save();
  };
  stage.onpointerdown = (e) => {
    if (mode !== 'walk') return;
    stage.setPointerCapture(e.pointerId);
    drag = { x: e.clientX, y: e.clientY, moved: false };
  };
  stage.onpointermove = (e) => {
    if (drag !== null) {
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 8) drag.moved = true;
      steering = clamp(dx / Math.min(innerWidth * 0.19, 92), -1, 1);
    }
  };
  stage.onpointerup = (e) => {
    if (drag && !drag.moved) {
      const target = art.pick(e.clientX, e.clientY);
      aim = target.x;
      if (target.person && context() === '등불에 답하기') {
        actDown();
        actUp();
      }
    }
    drag = null;
    steering = 0;
  };
  stage.onpointercancel = () => {
    drag = null;
    steering = 0;
  };
  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (mode === 'pause' && k === 'escape') {
      by('choices').querySelector('button').click();
      return;
    }
    if (mode !== 'walk') return;
    if (!['a', 'arrowleft', 'd', 'arrowright', 'w', 'arrowup', ' ', 'e', 'escape', 'p', 'q'].includes(k))
      return;
    e.preventDefault();
    if (k === 'escape' || k === 'p') {
      if (!e.repeat) pause();
    } else if (k === 'q') {
      if (!e.repeat) look();
    } else if (looking) return;
    else if (k === 'a' || k === 'arrowleft') left = true;
    else if (k === 'd' || k === 'arrowright') right = true;
    else if (k === 'w' || k === 'arrowup') dash = true;
    else if (!e.repeat) actDown();
  });
  addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'a' || k === 'arrowleft') left = false;
    if (k === 'd' || k === 'arrowright') right = false;
    if (k === 'w' || k === 'arrowup') dash = false;
    if (k === ' ' || k === 'e') actUp();
  });
  document.addEventListener('visibilitychange', () => {
    prev = null;
    if (document.hidden) {
      if (mode === 'walk') pause();
      quiet();
    }
  });
  addEventListener('blur', () => {
    if (mode === 'walk') pause();
  });
  addEventListener('pagehide', () => {
    if (s.started) save();
    quiet();
  });
  addEventListener('hashchange', () => {
    location.reload();
  });
  by('road').textContent = fromJourney ? '원래 지도 돌아가기' : '일곱 현장 원정';
  try {
    if (!fromJourney && JSON.parse(localStorage.getItem('onyou.exodus.road.v1'))?.s)
      by('road').textContent = '기존 원정 이어가기';
  } catch {}
  soundButton();
  showMode('title');
  by('start').innerHTML =
    (s.ended ? '다시 건너기' : s.started ? '바닷길 이어 걷기' : '길에 들어서기') +
    ' <span aria-hidden="true">→</span>';
  if (s.ended) {
    const shore = document.createElement('button');
    shore.textContent = '건너편 다시 보기';
    shore.onclick = ending;
    by('road').before(shore);
  }
  art.ready.then(() => {
    loadedArt = true;
  });
  requestAnimationFrame(frame);
})();
