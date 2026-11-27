// 현장 조작. 게임 진행과 수첩 저장은 app.js에서 맡는다.
const fieldGames = {};
function brick(g) {
  const { p, stage, art, prop, pin, task, action, step, finish, tell, tone } = g;
  const guide = [
    ['짚을 흙으로 가져오기', '짚단을 집어 흙더미까지 끌어 보자.'],
    ['흙을 골고루 이기기', '흙 안에서 손을 좌우로 움직여, 짚이 고르게 섞이게 하자.'],
    ['나무틀에 채우기', '이긴 흙을 동료가 잡은 빈 틀에 옮겨 담자.'],
    ['벽돌을 건네기', '틀에서 나온 벽돌을 오른쪽 말림터로 옮기자.']
  ];
  const n = p.step;
  art(n ? 'clay' : 'yard');
  prop('floor');
  prop(n === 3 ? 'brick-prop' : 'brick-prop mould', n === 3 ? 51 : 70, 75);
  const spots = [
    [22, 72, 55, 68],
    [48, 67, 66, 67],
    [35, 70, 70, 75],
    [51, 75, 85, 61]
  ];
  const [x, y, tx, ty] = spots[n];
  const names = [
    ['짚단', '흙더미'],
    ['반죽', '이기기'],
    ['이긴 흙', '나무틀'],
    ['벽돌', '말림터']
  ];
  const [source, dest] = names[n];
  task(...guide[n]);
  const moved = () => {
    tone('tap');
    if (n === 3) finish();
    else step(['짚이 흙 속에 들어갔다.', '흙에 짚이 고루 섞였다.', '동료가 틀을 들어 올렸다.'][n]);
  };
  let selected = false;
  const choose = () => {
    selected = true;
    piece.classList.add('visited');
    tell(dest + ' 쪽으로 옮겨 보자.');
  };
  const piece = pin(source, x, y, choose);
  const target = pin(dest, tx, ty, () => (selected ? moved() : tell(source + '부터 잡아 보자.')));
  // 화면 위 끌기와 두 번 눌러 옮기기가 같은 작업을 수행한다.
  piece.style.touchAction = 'none';
  let drag;
  piece.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, y: e.clientY };
    piece.setPointerCapture(e.pointerId);
  });
  piece.addEventListener('pointermove', (e) => {
    if (!drag || Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 5) return;
    const r = stage.getBoundingClientRect();
    piece.style.left = Math.max(6, Math.min(94, (100 * (e.clientX - r.left)) / r.width)) + '%';
    piece.style.top = Math.max(12, Math.min(88, (100 * (e.clientY - r.top)) / r.height)) + '%';
  });
  piece.addEventListener('pointerup', (e) => {
    if (!drag) return;
    const distance = Math.hypot(e.clientX - drag.x, e.clientY - drag.y);
    drag = null;
    const r = target.getBoundingClientRect();
    if (
      distance > 10 &&
      ((n === 1 && distance > 35) ||
        (e.clientX >= r.left - 14 &&
          e.clientX <= r.right + 14 &&
          e.clientY >= r.top - 14 &&
          e.clientY <= r.bottom + 14))
    ) {
      moved();
      return;
    }
    piece.style.left = x + '%';
    piece.style.top = y + '%';
  });
  piece.addEventListener('pointercancel', () => {
    drag = null;
    piece.style.left = x + '%';
    piece.style.top = y + '%';
  });
  action('손동작 도움말', () => tell(source + '을 한 번 누른 뒤 ' + dest + ' 단추를 눌러도 된다.'), true);
}
fieldGames.brick = brick;

const bankPoints = [
  [12, 77],
  [27, 44],
  [35, 80],
  [49, 60],
  [69, 80],
  [69, 35],
  [88, 60]
];
const bankEdges = [
  [1, 2],
  [0, 3],
  [0, 3],
  [1, 2, 4, 5],
  [3, 6],
  [3, 6],
  [4, 5]
];
function trail(g, points, visited, edges) {
  const canvas = document.createElement('canvas');
  canvas.className = 'track';
  canvas.width = 800;
  canvas.height = 450;
  canvas.setAttribute('aria-hidden', 'true');
  g.stage.append(canvas);
  const c = canvas.getContext('2d');
  function line(a, b) {
    c.beginPath();
    c.moveTo(points[a][0] * 8, points[a][1] * 4.5);
    c.lineTo(points[b][0] * 8, points[b][1] * 4.5);
    c.stroke();
  }
  c.lineCap = 'round';
  c.setLineDash([6, 8]);
  c.lineWidth = 3;
  c.strokeStyle = '#ffefc5cc';
  edges.forEach((neighbors, i) => neighbors.filter((j) => j > i).forEach((j) => line(i, j)));
  c.strokeStyle = '#183f3b';
  c.lineWidth = 8;
  c.setLineDash([]);
  visited.slice(1).forEach((j, i) => line(visited[i], j));
  c.strokeStyle = '#ffd780';
  c.lineWidth = 4;
  visited.slice(1).forEach((j, i) => line(visited[i], j));
}
function river(g) {
  const { p, task, pin, prop, tell, save, render, finish, meter } = g;
  const path = p.path || [0],
    at = path.at(-1);
  const names = ['강둑', '높은 둑', '갈대 틈', '굽은 길', '모래턱', '그늘길', '누이 곁'];
  if (at === 6) {
    const scenes = [
      [
        '갈대 사이의 울음',
        '바로의 딸이 상자를 열어 우는 아기를 보고 불쌍히 여겼다. 누가 아기에게 젖을 먹일 수 있을까?',
        '누이가 데려온 어머니',
        '출 2:5–9',
        'nile'
      ],
      [
        '아이가 자란 뒤',
        '친어머니가 아기를 길렀다. 자란 아이를 데려간 곳에서 그를 아들로 삼은 사람이 누구인지 확인하자.',
        '바로의 딸',
        '출 2:9–10',
        'court'
      ]
    ];
    const [heading, words, name, ref, photo] = scenes[p.step];
    g.art(photo);
    task(heading, words);
    meter(ref);
    if (!p.step) prop('basket', 66, 58);
    pin(name, 61, 68, () => (p.step === 0 ? g.step('시간이 흘렀다. 모세가 자란 뒤의 기록이다.') : finish()));
    pin(p.step === 0 ? '궁의 신하' : '바로', 23, 55, () =>
      tell(
        p.step === 0
          ? '누이가 어머니를 부르러 갔다. 출 2:8을 확인해 보자.'
          : '출 2:10에서 아이에게 이름을 준 사람을 찾아보자.'
      )
    );
    return;
  }
  task('강둑을 따라가기', '점선으로 이어진 옆 자리를 눌러 가자. 높은 둑과 갈대 틈에서 보이는 모습이 다르다.');
  prop('basket', 66, 58);
  trail(g, bankPoints, path, bankEdges);
  const details = [
    '강둑에서 출발했다.',
    '높은 둑 너머, 갈대 사이의 상자가 보인다.',
    '갈대가 흔들리며 바구니 가장자리가 드러난다.',
    '물소리를 따라 굽은 길에 닿았다.',
    '물에서 한 걸음 물러선 모래턱이다.',
    '그늘 사이로 누이가 지켜보는 자리가 보인다.'
  ];
  bankPoints.forEach(([x, y], i) => {
    const b = pin(names[i], x, y, () => {
      if (!bankEdges[at].includes(i)) {
        tell(i === at ? '지금 서 있는 자리다.' : '먼저 점선으로 이어진 옆 자리를 골라 보자.');
        return;
      }
      const back = path.indexOf(i);
      p.path = back >= 0 ? path.slice(0, back + 1) : [...path, i];
      save();
      render(i === 6 ? '물가에 닿았다. 바로의 딸이 상자를 발견한다.' : details[i]);
    });
    b.classList.toggle('visited', i === at);
    if (i === at) b.setAttribute('aria-current', 'step');
  });
  meter('발자국  ' + path.map((i) => names[i]).join(' › '));
}
fieldGames.river = river;

// 몸을 접고 펴는 뒷다리와 땅 위 그림자를 따로 그려 도약 높이를 읽게 한다.
function drawFrog(c, x, y, size, height, direction) {
  c.save();
  c.translate(x, y);
  c.scale(direction * size, size);
  function oval(x, y, rx, ry, fill, rotation = 0) {
    c.beginPath();
    c.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
    c.fillStyle = fill;
    c.fill();
  }
  function leg(points, width, color) {
    c.beginPath();
    c.moveTo(...points[0]);
    for (const [x, y] of points.slice(1)) c.lineTo(x, y);
    c.lineWidth = width;
    c.strokeStyle = color;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.stroke();
  }
  oval(0, 2, 18 - height * 5, 4, 'rgba(30,30,20,.36)');
  c.translate(0, -height * 46);
  leg(
    [
      [-3, -3],
      [-14, -6],
      [-18 - height * 13, 3 + height * 5],
      [-24 - height * 15, 3 + height * 7]
    ],
    4,
    '#514b2c'
  );
  leg(
    [
      [5, -4],
      [12, 0],
      [16 + height * 6, 2 - height * 4]
    ],
    3,
    '#718542'
  );
  oval(-2, -7, 13, 8, '#354b30', -0.17);
  oval(0, -9, 12, 6, '#899647', -0.17);
  oval(9, -11, 8, 6, '#667e3e', -0.15);
  oval(10, -15, 3.4, 3, '#b3ba64');
  oval(11, -15, 1.6, 1.6, '#1e2d22');
  oval(-5, -8, 3.5, 1.7, '#5e673a');
  oval(0, -11, 2, 1.3, '#a9a755');
  c.restore();
}
function frogs(g) {
  const { p, art, stage, task, action, tell, step, finish, dispose, tone, prop, meter, save } = g;
  if (!p.called) {
    art('bush');
    task(
      '호렙에서 들린 부르심',
      '세월이 흘러 모세는 미디안에서 양 떼를 돌보고 있다. 가시떨기가 불타는데도 사라지지 않는다. 가까이에서 그 자리의 말씀을 찾아보자.'
    );
    g.meter('호렙 · 출 3:1–10');
    if (!p.heardCall) {
      g.pin('떨기 곁에서 듣기', 50, 66, () => {
        p.heardCall = true;
        save();
        g.render();
      });
      return;
    }
    g.evidence(
      '출 3:7–10',
      '하나님은 백성의 고통과 부르짖음을 아셨고, 모세를 바로에게 보내 백성을 이끌어 내게 하셨다.'
    );
    action('모세가 돌아간 애굽으로', () => {
      p.called = true;
      save();
      g.render('바로는 백성을 보내라는 말을 거절했다. 이제 둘째 재앙의 현장을 살펴보자.');
    });
    return;
  }
  const n = p.step;
  art(['frogBank', 'frogs', 'kitchen'][n]);
  task(
    ['강가의 첫 도약', '마당으로 뛰어든 개구리', '부엌에서의 마지막 한 장'][n],
    '그림을 눌러 관찰창을 옮기고, 안으로 뛰어든 개구리를 찍자. 느리게 보고 싶으면 ‘한 동작씩’을 누르자.'
  );
  const scope = prop('scope', 50, 59);
  const canvas = document.createElement('canvas');
  canvas.className = 'frogview';
  canvas.setAttribute('aria-hidden', 'true');
  stage.append(canvas);
  let aim = 1,
    aimX = 0.5,
    aimY = 0.59,
    frame = 0,
    manual = matchMedia('(prefers-reduced-motion: reduce)').matches,
    raf = 0;
  const stamp = performance.now(),
    centers = [0.24, 0.5, 0.76],
    names = ['왼쪽', '가운데', '오른쪽'];
  let visibleFrogs = [],
    lastLanding = 0;
  const meterEl = meter('');
  if (p.snapshots?.length) {
    const prev = prop('photo', 85, 81, 'img');
    prev.src = p.snapshots.at(-1);
    prev.alt = '직전에 찍은 개구리 사진';
  }
  function paint(now) {
    const r = stage.getBoundingClientRect(),
      w = Math.round(r.width),
      h = Math.round(r.height);
    if (!w || !h) return;
    const d = Math.min(2, devicePixelRatio || 1);
    if (canvas.width !== Math.round(w * d) || canvas.height !== Math.round(h * d)) {
      canvas.width = Math.round(w * d);
      canvas.height = Math.round(h * d);
    }
    const c = canvas.getContext('2d');
    c.setTransform(d, 0, 0, d, 0, 0);
    c.clearRect(0, 0, w, h);
    const t = manual ? frame / 2 : (now - stamp) / 1250;
    const landing = Math.floor(t);
    if (landing !== lastLanding) {
      lastLanding = landing;
      if (!document.getElementById('records').open) tone('croak');
    }
    visibleFrogs = [];
    function jump(t, level, scale) {
      const cycle = ((t % 4) + 4) % 4,
        part = Math.floor(cycle),
        a = Math.max(0, Math.min(1, (cycle - part - 0.15) / 0.72));
      const stops = [0, 1, 2, 1, 0],
        left = centers[stops[part]],
        right = centers[stops[part + 1]],
        x = left + (right - left) * a;
      const height = Math.sin(a * Math.PI),
        size = scale * Math.min(w / 360, 1.6);
      visibleFrogs.push({ x: x * w, y: level * h - (height * 46 + 8) * size, r: 8 * size });
      drawFrog(c, x * w, level * h, size, height, right >= left ? 1 : -1);
    }
    jump(t + 0.85, 0.77, 0.49);
    jump(t + 2.15, 0.48, 0.4);
    jump(t, 0.68, 0.94);
    meterEl.textContent = '관찰창  ' + names[aim] + '   ·   사진 ' + n + '/3';
  }
  function loop(t) {
    paint(t);
    raf = requestAnimationFrame(loop);
  }
  if (manual) paint(stamp);
  else raf = requestAnimationFrame(loop);
  dispose(() => cancelAnimationFrame(raf));
  const resizer = new ResizeObserver(() => paint(performance.now()));
  resizer.observe(stage);
  dispose(() => resizer.disconnect());
  function target(i, x = centers[i], y = 0.59) {
    aim = i;
    aimX = x;
    aimY = y;
    scope.style.left = x * 100 + '%';
    scope.style.top = y * 100 + '%';
    paint(performance.now());
    tell(names[i] + '으로 관찰창을 옮겼다.');
  }
  names.forEach((name, i) => action(name, () => target(i), true));
  stage.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    const r = stage.getBoundingClientRect(),
      x = Math.max(0.08, Math.min(0.92, (e.clientX - r.left) / r.width)),
      y = Math.max(0.08, Math.min(0.92, (e.clientY - r.top) / r.height));
    target(Math.max(0, Math.min(2, Math.round((x - 0.24) / 0.26))), x, y);
  });
  const shutter = () => {
    paint(performance.now());
    const sw = stage.clientWidth,
      sh = stage.clientHeight,
      radius = scope.offsetWidth / 2;
    if (!visibleFrogs.some((f) => Math.hypot(f.x - aimX * sw, f.y - aimY * sh) <= radius + f.r)) {
      tell('개구리가 관찰창에서 벗어났다. 다음 착지 자리를 기다려 보자.');
      return;
    }
    const picture = document.createElement('canvas');
    picture.width = 196;
    picture.height = 128;
    const shot = picture.getContext('2d'),
      back = stage.querySelector('.backdrop');
    if (!back.complete || !back.naturalWidth) {
      tell('풍경이 나타나면 다시 셔터를 눌러 보자.');
      return;
    }
    {
      const sw = stage.clientWidth,
        sh = stage.clientHeight,
        k = Math.max(sw / back.naturalWidth, sh / back.naturalHeight);
      const patch = sw * 0.46,
        left = Math.max(0, Math.min(sw - patch, aimX * sw - patch / 2)),
        top = Math.max(0, Math.min(sh - (patch * 128) / 196, sh * aimY - (patch * 128) / 196 / 2));
      shot.scale(196 / patch, 196 / patch);
      shot.translate(-left, -top);
      shot.drawImage(
        back,
        (sw - back.naturalWidth * k) / 2,
        (sh - back.naturalHeight * k) / 2,
        back.naturalWidth * k,
        back.naturalHeight * k
      );
      shot.drawImage(canvas, 0, 0, sw, sh);
      try {
        (p.snapshots ||= []).push(picture.toDataURL('image/jpeg', 0.8));
      } catch {
        /* 이 브라우저에서 사진 저장이 제한되면 위치를 기록한다. */
      }
    }
    p.photos = [...(p.photos || []), names[aim]];
    tone('photo');
    if (n === 2) finish();
    else step('한 장 기록했다. 다음 장소의 발소리를 따라가자.');
  };
  const camera = g.pin('사진 찍기', 83, 85, shutter);
  camera.classList.add('shutter');
  camera.addEventListener('click', (e) => e.stopPropagation());
  action(
    '한 동작씩',
    () => {
      if (!manual) {
        manual = true;
        cancelAnimationFrame(raf);
      }
      frame = (frame + 1) % 8;
      paint(performance.now());
      tell('도약을 한 동작에서 멈췄다. 다시 눌러 다음 모습을 보자.');
    },
    true
  );
}
fieldGames.frogs = frogs;

function sea(g) {
  const { p, art, task, pin, step, finish, tell, tone, prop, action } = g;
  const n = p.step;
  if (!p.departed) {
    art(p.sawDoor ? 'departing' : 'door');
    if (!p.sawDoor) {
      task(
        '유월절 밤, 집에서 길을 준비하기',
        '개구리 재앙 뒤에도 바로는 계속 거절했다. 마지막 재앙을 앞두고 이스라엘 가족들이 하나님의 말씀대로 문설주와 인방에 표를 한 집에 머물렀다.'
      );
      g.meter('유월절 밤 · 출 12:21–28');
      pin('집 안에서 기다리기', 49, 65, () => {
        p.sawDoor = true;
        g.save();
        g.render();
      });
    } else {
      task(
        '떠나는 일행 따라잡기',
        '밤중에 바로가 모세와 아론을 불러 백성과 함께 떠나라고 했다. 길 위의 일행을 찾아 애굽에서 출발하자.'
      );
      g.meter('애굽을 나서다 · 출 12:31–42');
      pin('일행과 출발', 59, 66, () => {
        p.departed = true;
        g.save();
        g.render();
      });
    }
    return;
  }
  if (n === 0) {
    art('sea');
    task(
      '밤바람의 방향 찾기',
      '추격대의 소리가 뒤에서 들린다. 그림에서 바람이 거세게 부는 물가를 짚어 보자.'
    );
    pin('뒤쪽 진영', 24, 68, () => tell('뒤에는 추격대가 있다. 앞의 바닷가를 살펴보자.'));
    pin('바람 부는 물가', 74, 56, () => step('밤새 동풍이 불었다. 앞에 마른 길이 보인다.'));
  } else if (n <= 3) {
    art('walls');
    task('마른 땅을 건너기', '물벽 사이로 이어진 발자국을 따라 일행과 건너자.');
    const coords = [
      [21, 79],
      [48, 65],
      [71, 49]
    ];
    trail(
      g,
      coords,
      Array.from({ length: n - 1 }, (_, i) => i),
      [[1], [0, 2], [1]]
    );
    coords.forEach(([x, y], i) => {
      const b = pin('발자국 ' + (i + 1), x, y, () =>
        i === n - 1
          ? step('일행과 함께 한 걸음 더 건넜다.')
          : tell('지금 선 자리와 가까운 발자국부터 따라가자.')
      );
      if (i < n - 1) b.classList.add('visited');
    });
  } else {
    art('song');
    task(
      '건너편에서 소고 울리기',
      '방금까지 들리던 바람 대신 소고가 울린다. 원하는 간격으로 세 번 두드려 일행과 기쁨을 나누자.'
    );
    const drum = prop('drum', 51, 65, 'img');
    drum.src = assets.drum;
    drum.alt = '';
    const beat = () => {
      const now = Date.now();
      if (p.lastBeat) (p.rhythm ||= []).push(Math.max(160, Math.min(1400, now - p.lastBeat)));
      p.lastBeat = now;
      tone('drum');
      if (n === 6) finish();
      else step('둥! ' + (n - 3) + '/3');
    };
    const beatControl = pin('소고 치기', 51, 72, beat);
    if (n > 4) beatControl.classList.add('pulse-beat');
  }
}
fieldGames.sea = sea;

function caravan(g, longWalk) {
  const { p, stage, art, task, prop, meter, action, tell, render, save, finish, tone } = g;
  const end = longWalk ? 12 : 7;
  const label = longWalk ? '긴 여정' : '샘까지';
  task(
    longWalk ? '여러 해를 함께 걷기' : '일행과 샘까지 걷기',
    '그림의 걷기 단추를 꾹 누르면 전진한다. 볕에 지치면 그늘로 방향을 바꾸거나 일행과 물을 나누자.'
  );
  const haze = prop('heat'),
    sun = prop('sun'),
    mirage = prop('mirage');
  const spots = [
    [10, 74],
    [28, 60],
    [47, 69],
    [66, 47],
    [87, 58]
  ];
  trail(g, spots, [], [[1], [0, 2], [1, 3], [2, 4], [3]]);
  const mark = prop('caravan', 10, 74);
  mark.setAttribute('aria-hidden', 'true');
  for (let j = 0; j < 3; j++) {
    const person = document.createElement('i');
    mark.append(person);
  }
  if (longWalk) prop('stars');
  const time = longWalk ? prop('years-badge', 66, 28) : null;
  const meterEl = meter('');
  let timer,
    walkButton,
    turnButton,
    fastButton,
    slowButton,
    running = false,
    ignoreClick = false;
  function night() {
    return longWalk && Math.floor((p.distance || 0) / 3) % 2 === 1;
  }
  function update() {
    const distance = p.distance || 0,
      heat = p.heat || 0,
      water = p.water ?? 2,
      isNight = night();
    const view = !longWalk && distance >= 5 ? 'oasis' : longWalk && isNight ? 'tents' : 'desert';
    if (stage.dataset.view !== view) {
      stage.dataset.view = view;
      art(view);
    }
    stage.classList.toggle('night', isNight);
    stage.classList.toggle('hot', !isNight && heat >= 3);
    stage.querySelector('.backdrop').style.transform =
      'scale(1.08) translateX(' + (3 - (distance / end) * 6) + '%)';
    haze.style.opacity = isNight ? '.12' : String(0.45 + heat * 0.1);
    mirage.style.visibility = isNight ? 'hidden' : 'visible';
    sun.style.left = 14 + (distance / end) * 62 + '%';
    const pos = Math.min(4, (distance / end) * 4),
      i = Math.min(3, Math.floor(pos)),
      blend = pos - i;
    mark.style.left = spots[i][0] + (spots[i + 1][0] - spots[i][0]) * blend + '%';
    mark.style.top =
      spots[i][1] + (spots[i + 1][1] - spots[i][1]) * blend + (p.lane === 'shade' ? -4 : 2) + '%';
    if (time)
      time.textContent = distance ? '약 ' + Math.floor((distance / end) * 40) + '년째' : '여정의 시작';
    meterEl.textContent = (isNight ? '별빛' : '볕') + ' · 열기 ' + heat + '/5 · 물 ' + water + '/2';
    g.status(label + '  ' + distance + ' / ' + end + '걸음');
    turnButton.textContent = p.lane === 'shade' ? '햇볕 길로 ↗' : '그늘 길로 ↗';
    turnButton.setAttribute('aria-pressed', String(p.lane === 'shade'));
    walkButton.textContent = p.lane === 'shade' ? '그늘로 꾹 걷기' : '앞으로 꾹 걷기';
    fastButton.textContent = isNight ? '별빛 따라 두 걸음' : '햇볕 길 두 걸음';
    slowButton.textContent = isNight ? '일행과 천천히' : '그늘 길 한 걸음';
  }
  function stop() {
    clearInterval(timer);
    running = false;
    stage.classList.remove('walking');
  }
  function move(fast) {
    const heat = p.heat || 0,
      isNight = night();
    if (heat >= 4 && fast && !isNight) {
      stop();
      tell('발걸음이 느려졌다. 그늘에서 한 걸음 걷거나 물을 나누자.');
      return;
    }
    p.distance = Math.min(end, (p.distance || 0) + (fast ? 2 : 1));
    p.heat = Math.min(5, Math.max(0, heat + (isNight ? -1 : fast ? 2 : -1)));
    if (!fast) p.shade = (p.shade || 0) + 1;
    tone('tap');
    if (p.distance === end) {
      stop();
      finish();
      return;
    }
    save();
    update();
    tell(
      isNight
        ? '별빛 아래 일행의 걸음이 다시 맞았다.'
        : fast
          ? '뜨거운 바람을 맞으며 두 걸음 나아갔다.'
          : '그늘에서 숨을 고르며 한 걸음 나아갔다.'
    );
  }
  turnButton = g.pin('그늘 길로 ↗', 79, 19, () => {
    p.lane = p.lane === 'shade' ? 'sun' : 'shade';
    save();
    update();
    tell(p.lane === 'shade' ? '그늘 쪽으로 방향을 바꿨다.' : '햇볕 길로 방향을 바꿨다.');
  });
  walkButton = g.pin('앞으로 꾹 걷기', 77, 82, () => {
    if (ignoreClick) {
      ignoreClick = false;
      return;
    }
    move(p.lane !== 'shade');
  });
  walkButton.classList.add('walkpad');
  walkButton.style.touchAction = 'none';
  walkButton.addEventListener('pointerdown', (e) => {
    if (!e.isPrimary || e.button !== 0) return;
    ignoreClick = false;
    stop();
    running = true;
    walkButton.setPointerCapture(e.pointerId);
    stage.classList.add('walking');
    timer = setInterval(() => {
      if (running) {
        ignoreClick = true;
        move(p.lane !== 'shade');
      }
    }, 530);
  });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture'])
    walkButton.addEventListener(name, stop);
  g.dispose(stop);
  // 누르고 있는 동안 앱이 뒤로 가면 이동도 멈춘다.
  const pauseHidden = () => {
    if (document.hidden || document.getElementById('records').open) stop();
  };
  document.addEventListener('visibilitychange', pauseHidden);
  g.dispose(() => document.removeEventListener('visibilitychange', pauseHidden));
  const pauseDialog = new MutationObserver(pauseHidden);
  pauseDialog.observe(document.getElementById('records'), { attributes: true, attributeFilter: ['open'] });
  g.dispose(() => pauseDialog.disconnect());
  fastButton = action('햇볕 길 두 걸음', () => move(true));
  slowButton = action('그늘 길 한 걸음', () => move(false), true);
  action(
    '물을 나누고 쉬기',
    () => {
      const water = p.water ?? 2,
        heat = p.heat || 0;
      if (!water || !heat) {
        tell(!water ? '물주머니가 비었다. 그늘 길로 갈 수 있다.' : '아직 발걸음이 가볍다. 물을 아껴 두자.');
        return;
      }
      p.water = water - 1;
      p.heat = Math.max(0, heat - 3);
      p.shared = (p.shared || 0) + 1;
      save();
      update();
      tell('물주머니를 돌려 마셨다. 열기가 ' + p.heat + '로 떨어졌다.');
    },
    true
  );
  update();
}
fieldGames.desert = (g) => caravan(g, false);
fieldGames.years = (g) => caravan(g, true);

const campEvidence = [
  {
    name: '산길',
    x: 21,
    y: 35,
    art: 'sinai',
    text: '모세가 산에서 더디 내려오자 백성은 그에게 무슨 일이 생겼는지 모르겠다고 했다.',
    ref: '출 32:1'
  },
  {
    name: '금고리',
    x: 50,
    y: 62,
    art: 'rings',
    text: '백성은 아론에게 앞서 인도할 신을 만들라고 했다. 아론은 그들이 가져온 금고리로 송아지를 만들었다.',
    ref: '출 32:1–4'
  },
  {
    name: '진영',
    x: 77,
    y: 48,
    art: 'tablets',
    text: '백성은 송아지를 애굽에서 이끌어 낸 신이라 부르고 제사를 드렸다. 출 20:2–5에서 들은 말씀과 다른 선택이었다.',
    ref: '출 32:4–6'
  }
];
function camp(g) {
  const { p, art, task, pin, action, tell, save, render, finish, meter } = g;
  if (!p.covenant) {
    art('tents');
    task(
      '산 앞에 진을 치기',
      '애굽에서 나온 셋째 달에 이 산에 닿았다. 백성은 다른 신을 섬기지 말라는 말씀을 듣고 언약을 맺었다. 산 위에 올라간 모세는 사십 주야를 머물렀다.'
    );
    meter('시내 광야 · 출 19:1–2, 20:2–5, 24:3–8·18');
    pin('산 아래 진영으로', 53, 68, () => {
      p.covenant = true;
      save();
      render('모세가 더디 내려오자 진영에 사람들이 모였다.');
    });
    return;
  }
  const found = p.found || [],
    current = campEvidence[p.last];
  art(current ? current.art : 'rings');
  task(
    '세 곳의 증거 모으기',
    '산길, 금고리, 진영을 원하는 순서로 조사하자. 사람들이 했던 말을 찾으면 세 기록을 이을 수 있다.'
  );
  campEvidence.forEach((v, i) => {
    const b = pin(v.name, v.x, v.y, () => {
      p.last = i;
      p.found = [...new Set([...found, i])];
      save();
      render();
    });
    if (found.includes(i)) b.classList.add('visited');
  });
  if (current) g.evidence(current.ref, current.text);
  meter('조사한 곳  ' + found.length + ' / 3');
  if (found.length === 3) {
    g.status('백성이 아론에게 모였을 때 무엇을 부탁했을까?');
    action('앞서 인도할 신을 만들어 달라', finish);
    action(
      '성막 지을 천을 모아 달라',
      () => tell('성막 재료는 뒤의 기록이다. 산길과 금고리의 말을 다시 살펴보자.'),
      true
    );
  }
}
fieldGames.camp = camp;
const mountainStops = [
  {
    name: '산 위',
    art: 'sinai',
    ref: '출 32:7–10',
    text: '하나님은 백성이 명하신 길에서 빨리 떠나 송아지를 만들고 절하며 제사한 일을 말씀하셨다. 그 일로 진노하셨다.',
    target: '하나님이 말씀하신 까닭',
    x: 62,
    y: 37
  },
  {
    name: '산 위의 간구',
    art: 'sinai',
    ref: '출 32:11–14',
    text: '모세는 애굽에서 이끌어 내신 백성과 조상들에게 하신 약속을 들어 간구했다. 하나님은 말씀하신 재앙을 내리지 않으셨다.',
    target: '모세의 첫 간구',
    x: 40,
    y: 54
  },
  {
    // 출 32:15–19. 진영에 가까이 이르기 전에 들은 소리, 그 소리를 두고 두 사람이 한 말, 가까이 가서 본 모습을 나누어 둔다.
    name: '산을 내려오는 길',
    art: 'tablets',
    target: '진영을 내려다보기',
    x: 71,
    y: 49,
    caption: '산 아래 진영 쪽에서 백성이 떠드는 소리가 들린다.',
    said: '여호수아는 백성이 떠드는 소리를 듣고 진영에서 싸우는 소리가 난다고 했다. 모세는 이긴 자의 노래도 진 자의 부르짖음도 아니고, 자기가 듣기에는 노래하는 소리라고 답했다.',
    seen: '모세는 진영에 가까이 이르러 송아지와 춤추는 것을 보았다. 크게 노하여 손에 든 판들을 산 아래로 던져 깨뜨렸다.'
  },
  {
    name: '이튿날',
    art: 'intercede',
    ref: '출 32:30–35',
    text: '다음 날 모세는 백성에게 큰 죄를 지었다고 말하고 다시 하나님께 올라가 용서를 구했다. 뒤이어 본문은 백성이 벌을 받은 일도 기록한다.',
    target: '이튿날의 산길',
    x: 54,
    y: 58
  }
];
// 소리만 듣고 남기는 추측의 보기. 고른 문구를 그대로 저장한다.
const campGuesses = ['싸움 소리 같다', '노랫소리 같다'];
function mountain(g) {
  const { p, art, task, pin, action, step, finish, meter } = g;
  const n = p.step,
    v = mountainStops[n],
    listening = n === 2 && p.heardCamp && !p.open;
  art(n === 2 && !p.open ? 'sinai' : v.art);
  // 소리를 쓰지 않는 사람도 상황을 읽도록 진행 표시 아래에 자막을 붙인다.
  meter(v.name + '   ' + (n + 1) + ' / 4' + (listening ? '\n자막 · ' + v.caption : ''));
  const next = () => {
    p.open = false;
    if (n === 3) finish();
    else step();
  };
  if (n === 2) {
    ridgeWitness(g, v, next);
    return;
  }
  task('산길의 증언 듣기', '산길의 표식을 눌러 그곳에서 누가 무엇을 말했는지 듣자.');
  if (!p.open) {
    pin(v.target, v.x, v.y, () => {
      p.open = true;
      g.save();
      g.render();
    });
    return;
  }
  g.evidence(v.ref, v.text);
  action(['모세가 한 말 듣기', '산 아래로 내려가기', '', '다시 올라간 이유 기록'][n], next);
}
// 출 32:15–19. 능선을 열기 전에는 들은 소리와 내 추측만 보이고, 연 뒤에 두 사람의 말과 본 모습이 함께 보인다.
function ridgeWitness(g, v, next) {
  const { p, stage, task, pin, action, tell } = g;
  const guess = typeof p.guess === 'string' ? p.guess : '';
  const mine = () => g.evidence('내 추측 · 소리만 듣고', guess || '추측을 남기지 않고 진영을 내려다보았다.');
  if (p.open) {
    task(
      '들린 소리와 본 모습 구별하기',
      '소리만 듣고 남긴 내 추측, 진영에 가까이 이르기 전에 두 사람이 한 말, 가까이 가서 본 모습을 나누어 읽자.'
    );
    stage.classList.toggle('camp-close', !p.wide);
    action(
      p.wide ? '진영 가까이 보기' : '돌판까지 넓게 보기',
      () => {
        p.wide = !p.wide;
        g.save();
        g.render();
      },
      true
    );
    mine();
    g.evidence('두 사람이 한 말 · 출 32:17–18', v.said);
    g.evidence('직접 본 모습 · 출 32:19', v.seen);
    g.status('모세가 돌판을 깨뜨리기 직전에 직접 본 것은?');
    action('송아지와 춤추는 사람들', next);
    action(
      '싸우는 군대',
      () =>
        tell('싸운다는 말은 여호수아가 소리를 듣고 한 말이다. 출 32:19에서 모세가 본 모습을 다시 확인하자.'),
      true
    );
    return;
  }
  if (!p.heardCamp) {
    task(
      '들린 소리와 본 모습 구별하기',
      '모세가 두 판을 손에 들고 산에서 내려온다. 여호수아도 함께 있다. 진영에 가까이 이르기 전, 먼저 들려오는 소리에 귀를 기울이자.'
    );
    pin('먼 진영 소리 듣기', 44, 48, () => {
      p.heardCamp = true;
      g.tone('distant');
      g.save();
      g.render('자막 · ' + v.caption);
    });
    return;
  }
  task(
    '들린 소리와 본 모습 구별하기',
    guess
      ? '소리만 듣고 내 추측을 남겼다. 산길을 손가락으로 밀거나 진영을 눌러 실제 모습을 확인하자.'
      : '진영이 보이기 전에 소리만 듣고 내 추측을 남겨 보자. 산길을 손가락으로 밀거나 진영을 누르면 실제 모습이 보인다.'
  );
  if (guess) mine();
  const reveal = () => {
    p.open = true;
    g.save();
    g.render();
  };
  stage.classList.add('ridge');
  let start = null;
  stage.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('button')) start = e.clientX;
  });
  stage.addEventListener('pointerup', (e) => {
    if (start !== null && Math.abs(e.clientX - start) > 48) reveal();
    start = null;
  });
  stage.addEventListener('pointercancel', () => {
    start = null;
  });
  pin(v.target, v.x, v.y, reveal);
  // 보기는 누른 자리에서 펼친다. 고르기 전에는 저장하지 않는다.
  const chooser = action(
    guess ? '추측 다시 고르기' : '내 추측 남기기',
    () => {
      g.status('진영이 보이기 전, 이 소리는 어떻게 들리는가?');
      const choices = campGuesses.map((label) =>
        action(label, () => {
          p.guess = label;
          g.save();
          g.render('내 추측을 남겼다 · ' + label);
        })
      );
      chooser.replaceWith(...choices);
      choices[0].focus({ preventScroll: true });
    },
    !!guess
  );
  action(
    '소리 다시 듣기',
    () => {
      g.tone('distant');
      tell('자막 · ' + v.caption);
    },
    true
  );
}
fieldGames.mountain = mountain;
function cloud(g) {
  const { p, stage, task, prop, meter, action, step, finish, tell } = g;
  const n = p.step,
    lifted = n === 1 || n === 3,
    night = n === 2;
  stage.classList.toggle('night', night);
  const shape = prop('cloud-shape');
  shape.style.top = lifted ? '17%' : '48%';
  if (night) {
    shape.style.background = '#ffc577';
    shape.style.boxShadow = '0 0 32px #ffb85e';
  }
  meter(
    night ? '밤 · 성막 위에 보이는 불' : lifted ? '낮 · 구름이 위로 떠오른다' : '낮 · 구름이 장막을 덮는다'
  );
  task('성막 위를 살피기', '일행이 짐을 챙길 때인지 진을 칠 때인지, 구름의 높이를 보고 결정하자.');
  function decide(leave) {
    if (leave !== lifted) {
      tell(
        lifted
          ? '구름이 떠올랐다. 진을 걷고 길을 떠날 때다.'
          : '아직 구름이 성막 위에 있다. 일행과 이곳에 머물자.'
      );
      return;
    }
    if (n === 3) finish();
    else step(leave ? '일행이 길을 나섰다. 새 야영지에 닿았다.' : '함께 진을 치고 다음 하늘을 기다렸다.');
  }
  action('진을 치고 머물기', () => decide(false), true);
  action('짐을 꾸려 떠나기', () => decide(true));
}
fieldGames.cloud = cloud;
