// 원근을 공유하는 타일, 소품, 인물. 화면의 같은 변환을 터치 좌표에도 쓴다.
function makeRoadArt(canvas) {
  const ctx = canvas.getContext('2d');
  const climates = {
    amber: ['#41333e', '#ab6847', '#e2ad73', '#b68e62', '#c7a875', '#986549', '#704e42'],
    blue: ['#223a47', '#517578', '#b9be9c', '#b5a47d', '#c6b688', '#806f57', '#625747'],
    heat: ['#645f65', '#b48762', '#f4c67e', '#d9b47b', '#ebc990', '#ae895c', '#88684d'],
    dusk: ['#282c40', '#67576a', '#cf926e', '#b7a386', '#c9b193', '#897259', '#635b55']
  };
  const vistas = {
    kiln: 'yard',
    reeds: 'nile',
    frogs: 'frogBank',
    sea: 'walls',
    desert: 'desert',
    ridge: 'sinai',
    years: 'tents'
  };
  let landscape = null,
    backgroundFor = '';
  let layout,
    reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const noise = (x, y, n = 0) => {
    const f = Math.sin(x * 127.1 + y * 311.7 + n * 73.17) * 43758.5453;
    return f - Math.floor(f);
  };
  function poly(points, fill, stroke) {
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }
  function line(points, color, thickness = 1) {
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  function oval(x, y, rx, ry, fill) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }
  function box(x, y, w, d, h, colors) {
    const base = [
      [x, y],
      [x + w, y + w * 0.5],
      [x + w - d, y + (w + d) * 0.5],
      [x - d, y + d * 0.5]
    ];
    const top = base.map(([a, b]) => [a, b - h]);
    poly([top[1], top[2], base[2], base[1]], colors[2]);
    poly([top[2], top[3], base[3], base[2]], colors[1]);
    poly(top, colors[0]);
  }
  const sunBrick = ['#cc895d', '#ad6a47', '#824a38'],
    timber = ['#a8794a', '#805635', '#5f412e'];
  function shadow(x, y, rx = 14) {
    oval(x - 3, y + 2, rx, rx * 0.35, 'rgba(64,45,37,.25)');
  }
  function ground(x, y, tile, palette, time, map) {
    const water = tile === '~',
      shore = tile === '=',
      sandy = ['heat', 'dusk'].includes(map.light);
    ctx.save();
    const seed = noise(x, y);
    const surface = water
      ? seed > 0.5
        ? '#477f81'
        : '#427879'
      : shore
        ? '#d2b58f'
        : palette[seed > 0.7 ? 4 : 3];
    poly(
      [
        [0, -12],
        [24, 0],
        [0, 12],
        [-24, 0]
      ],
      surface
    );
    if (x === map.rows[0].length - 1)
      poly(
        [
          [24, 0],
          [0, 12],
          [0, 22],
          [24, 10]
        ],
        water ? '#37676c' : palette[6]
      );
    if (y === map.rows.length - 1)
      poly(
        [
          [-24, 0],
          [0, 12],
          [0, 22],
          [-24, 10]
        ],
        water ? '#568789' : palette[5]
      );
    for (let i = 0; i < (water ? 3 : 9); i++) {
      const a = noise(x, y, i + 1) * 0.86 + 0.07,
        b = noise(x, y, i + 12) * 0.86 + 0.07;
      const px = (a - b) * 24,
        py = (a + b - 1) * 12;
      if (water)
        line(
          [
            [px, py],
            [px + 4 + 2 * Math.sin(time * 1.8 + seed * 15 + i), py - 0.5]
          ],
          i === 0 ? '#9eb7a7' : '#629696',
          0.8
        );
      else if (seed > 0.7 && i < 2 && sandy)
        line(
          [
            [px - 3, py + 1],
            [px, py],
            [px + 4, py + 0.2]
          ],
          '#c5a57d',
          0.65
        );
      else oval(px, py, noise(x, y, i + 30) * 1.2 + 0.35, 0.55, i % 3 === 0 ? '#9b825e66' : '#f0d4a55c');
    }
    ctx.restore();
  }
  function rock(seed, sunSide) {
    shadow(sunSide ? -sunSide * 4 : 0, 0);
    const h = 10 + seed * 9;
    poly(
      [
        [-17, 2],
        [-12, -h + 3],
        [0, -h - 3],
        [11, -h],
        [17, -2],
        [4, 5]
      ],
      '#938575'
    );
    poly(
      [
        [-17, 2],
        [-12, -h + 3],
        [-2, -h + 2],
        [3, 4]
      ],
      sunSide === 1 ? '#8b8072' : '#c6b092'
    );
    poly(
      [
        [-2, -h + 2],
        [0, -h - 3],
        [11, -h],
        [5, -h + 5]
      ],
      '#c4b295'
    );
    poly(
      [
        [5, -h + 5],
        [11, -h],
        [17, -2],
        [4, 5]
      ],
      sunSide === 1 ? '#bba485' : '#65625a'
    );
    if (sunSide === -1) {
      line(
        [
          [-16, 1],
          [-12, -h + 3],
          [-1, -h - 2]
        ],
        '#ffe6a8',
        1.7
      );
    } else if (sunSide === 1) {
      line(
        [
          [1, -h - 2],
          [11, -h],
          [16, -2]
        ],
        '#ffe6a8',
        1.7
      );
    }
    line(
      [
        [-10, -h + 5],
        [-6, -h + 3],
        [-3, -h + 6]
      ],
      '#887c6c',
      0.7
    );
  }
  function palm(seed, time) {
    const h = 32 + seed * 12,
      bend = 4 + seed * 5;
    shadow(-4, 2, 19);
    poly(
      [
        [-3, 1],
        [0, -h * 0.48],
        [bend - 2, -h],
        [bend + 2, -h],
        [4, -h * 0.45],
        [3, 2]
      ],
      '#815c3e'
    );
    for (let j = 1; j < 8; j++)
      line(
        [
          [(j * bend) / 9 - 1, (-h * j) / 9],
          [(j * bend) / 9 + 2, (-h * j) / 9 - 1]
        ],
        '#b39763',
        1.1
      );
    const sway = Math.sin(time * 1.2 + seed * 10) * 1.2;
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 + 0.2,
        dx = Math.cos(a) * 22,
        dy = Math.sin(a) * 10;
      const color = ['#4a6244', '#73825a', '#3c6151', '#96a16b'][i % 4];
      const points = [];
      for (let k = 0; k <= 10; k++) {
        const f = k / 10;
        points.push([bend + dx * f + sway * f, -h + dy * f + f * f * 13 - Math.sin(f * Math.PI) * 9]);
      }
      line(points, color, 1.4);
      for (let k = 1; k <= 8; k++) {
        const [px, py] = points[k];
        const len = 5 * (1 - k / 12);
        poly(
          [
            [px, py],
            [px + dx * 0.09 - 2, py + len + 2],
            [px + dx * 0.13, py + 1]
          ],
          color
        );
      }
    }
  }
  function building(seed) {
    shadow(-4, 2, 22);
    const h = 16 + Math.floor(seed * 9);
    box(0, -10, 20, 21, h, ['#d9b387', '#b78b67', '#997253']);
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 3; j++) {
        if ((i + j) % 3 === 0) continue;
        const x = -17 + i * 4,
          y = -h + 4 + j * 5 + (x + 19) * 0.5;
        line(
          [
            [x, y],
            [x + 3, y + 1.5]
          ],
          '#987351',
          0.7
        );
      }
    box(0, -10 - h, 21, 22, 2, ['#e0bd8c', '#c99e77', '#a6805b']);
    poly(
      [
        [5, 6],
        [5, -3],
        [10, -5.5],
        [10, 3.5]
      ],
      '#634b3c'
    );
    line(
      [
        [-14, -h + 5],
        [-4, -h + 10]
      ],
      '#ebca96',
      1.2
    );
    for (let z = 0; z < 3; z++)
      box(z * 5.5, -10 + z * 2.75 - h - 2, 3.5, 2, 2.5, ['#dfbb85', '#bb9269', '#956b52']);
    if (seed > 0.4) {
      line(
        [
          [-15, -h + 3],
          [-16, 1]
        ],
        '#805839',
        1.1
      );
      line(
        [
          [-10, -h + 5],
          [-11, 4]
        ],
        '#805839',
        1.1
      );
      for (let j = 0; j < 5; j++)
        line(
          [
            [-15 - j * 0.15, -h + 5 + j * 3],
            [-10 - j * 0.15, -h + 7 + j * 3]
          ],
          '#debb86',
          0.8
        );
    } else {
      poly(
        [
          [3, -h + 4],
          [13, -h - 1],
          [16, -h + 3],
          [6, -h + 9]
        ],
        '#658a82'
      );
      line(
        [
          [5, -h + 8],
          [16, -h + 3]
        ],
        '#b1ac7e',
        1.1
      );
    }
  }
  function tent() {
    shadow(0, 0, 20);
    for (const x of [-15, 14])
      line(
        [
          [x, -12],
          [x, 4]
        ],
        '#805d3c',
        1.5
      );
    poly(
      [
        [-20, -10],
        [-3, -26],
        [14, -19],
        [20, -3]
      ],
      '#9d634b'
    );
    poly(
      [
        [-20, -10],
        [-3, -26],
        [7, -7],
        [-4, -1]
      ],
      '#c59466'
    );
    for (let x = -13; x <= 1; x += 5)
      line(
        [
          [x, -13 + (x + 13) * -0.4],
          [x + 4, -6 + (x + 13) * 0.24]
        ],
        '#e4bb84',
        1.2
      );
    line(
      [
        [-19, -10],
        [-24, 3]
      ],
      '#765f48',
      0.8
    );
    line(
      [
        [20, -3],
        [24, 6]
      ],
      '#765f48',
      0.8
    );
  }
  function reeds(seed, time) {
    for (let i = 0; i < 12; i++) {
      let x = (noise(i, seed, 2) - 0.5) * 25,
        y = (noise(i, seed, 3) - 0.5) * 7;
      const h = 10 + noise(i, seed, 4) * 14,
        s = Math.sin(time + i) * 1.2;
      line(
        [
          [x, y],
          [x - 2, y - h * 0.55],
          [x + s + 2, y - h]
        ],
        i % 2 ? '#69794e' : '#8b9762',
        1.3
      );
      if (i % 3 === 0)
        line(
          [
            [x + s + 2, y - h],
            [x + s + 2, y - h - 3]
          ],
          '#745b3c',
          2
        );
    }
  }
  function person(x, y, color, dir, time, moving, lead) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir < 0 ? -1 : 1, 1);
    const walk = moving ? Math.sin(time * 14) * 2.3 : 0;
    shadow(0, 0, 7);
    ctx.translate(0, moving ? -Math.abs(walk) * 0.35 : 0);
    line(
      [
        [-2, -5],
        [-3, walk],
        [0, walk + 0.4]
      ],
      '#352d2c',
      2
    );
    line(
      [
        [2, -5],
        [3, -walk],
        [5, -walk]
      ],
      '#44352e',
      2
    );
    poly(
      [
        [-3, -13],
        [1, -15],
        [4, -12],
        [5, -4],
        [-4, -4]
      ],
      color
    );
    poly(
      [
        [-3, -13],
        [-1, -13],
        [-2, -5],
        [-4, -4]
      ],
      'rgba(245,218,174,.44)'
    );
    line(
      [
        [2, -12],
        [4, -8],
        [5, -7 + walk * 0.3]
      ],
      '#b88b66',
      1.8
    );
    oval(0.5, -16, 3.1, 3.5, '#c89771');
    poly(
      [
        [-3, -16],
        [-3, -19],
        [1, -20],
        [4, -18],
        [4, -16],
        [1, -17]
      ],
      lead ? '#315e68' : '#514139'
    );
    if (lead) {
      line(
        [
          [-3, -13],
          [1, -12],
          [4, -13]
        ],
        '#e3aa5a',
        2
      );
      poly(
        [
          [-2, -12],
          [-5, -8],
          [-4, -14]
        ],
        '#d9a35a'
      );
    }
    ctx.restore();
  }
  function cart(loaded) {
    shadow(0, 1);
    oval(-8, 3, 3, 4, '#4c4334');
    oval(8, 2, 3, 4, '#4c4334');
    box(0, -8, 13, 13, 5, timber);
    line(
      [
        [10, -1],
        [17, 2]
      ],
      '#75553b',
      2
    );
    if (loaded)
      for (let j = 0; j < 4; j++)
        box(((j % 2) - Math.floor(j / 2)) * 4, -10 + ((j % 2) + Math.floor(j / 2)) * 1.9, 5, 4, 3, sunBrick);
    else box(0, -8, 7, 7, 1, ['#584838', '#644d3e', '#6b513d']);
    oval(-8, 3, 1.2, 1.4, '#bc946a');
    oval(8, 2, 1.2, 1.4, '#bc946a');
  }
  function basket() {
    shadow(0, 0, 8);
    oval(0, -2, 8, 4, '#a77448');
    oval(0, -4, 8, 3, '#e3c18d');
    oval(0, -5, 4.5, 1.7, '#e9d7ac');
    for (let i = -5; i < 7; i += 3)
      line(
        [
          [i, -2],
          [i + 1, 0]
        ],
        '#c79a62',
        0.7
      );
  }
  function drum() {
    oval(0, -2, 7, 5, '#ac744f');
    oval(0, -4, 7, 4, '#e8c28a');
  }
  function frog(x, y, jump, dir) {
    ctx.save();
    ctx.translate(x, y);
    oval(0, 0, 5 - jump, 1.4, '#273e3a77');
    ctx.scale(dir, 1);
    ctx.translate(0, -jump * 11);
    line(
      [
        [-1, -2],
        [-5, -3],
        [-5 - jump * 4, 1 + jump * 2]
      ],
      '#536a44',
      1.8
    );
    oval(0, -3, 4, 2.5, '#809252');
    oval(3, -4, 2.5, 1.8, '#b0a961');
    oval(4, -5, 1, 1, '#38452e');
    ctx.restore();
  }
  function landmark(ch, map, state, seed, time, sunSide) {
    if (ch === 'P') palm(seed, time);
    else if (ch === '#') building(seed);
    else if (ch === '^') rock(seed, map.id === 'desert' ? sunSide : 0);
    else if (ch === 'r') reeds(seed, time);
    else if (ch === ':' || ch === 'X' || ch === 'Y') tent();
    else if (ch === 'B') {
      reeds(seed, time);
      basket();
    } else if (ch === 'L') {
      box(0, -8, 13, 11, 4, timber);
      oval(0, -3, 8, 3.5, '#a76644');
      box(-4, -7, 5, 4, 2, sunBrick);
    } else if (ch === 'D') {
      for (let j = 0; j < 6; j++)
        box(((j % 3) - Math.floor(j / 3)) * 4, -7 + ((j % 3) + Math.floor(j / 3)) * 2, 4, 3, 2.5, sunBrick);
    } else if (ch === 'J') {
      for (let i = -2; i <= 2; i++) box(i * 3, -5 + i * 1.3, 2, 13, 3, timber);
    } else if (ch === 'K') {
      box(0, -6, 13, 11, 9, ['#b98b63', '#9c724e', '#815b44']);
      oval(0, -14, 5, 2, '#4d4038');
    } else if (ch === 'H' || ch === 'A' || ch === 'S') {
      if (!state.flags[ch]) person(0, 0, ch === 'H' ? '#b87851' : '#7c998b', 0, time, false, false);
    } else if (ch === 'R') {
      box(0, -7, 11, 10, 3, ['#a5765c', '#89664f', '#735540']);
      for (let j = 0; j < 4; j++) {
        ctx.strokeStyle = '#f2c771';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(j * 2 - 3, -6 + (j % 2), 2, 1.3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (ch === 'T' || ch === 'V') {
      rock(seed);
      if (ch === 'V') box(-5, -6, 5, 8, 1.7, ['#dbcaad', '#baa58b', '#9c907f']);
    } else if (ch === 'E' && map.id === 'sea') drum();
    else if (ch === 'E') {
      oval(0, 0, 12, 5, '#72a29b');
      reeds(seed, time);
    } else if (ch === 'F') reeds(seed, time);
  }
  function vista(w, h, pal, time, night, sunSide) {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, pal[0]);
    bg.addColorStop(0.42, pal[1]);
    bg.addColorStop(1, night ? '#252f3a' : pal[2]);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const sunX = w * (sunSide === -1 ? 0.24 : 0.76),
      sunY = h * 0.19;
    const glow = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, w * 0.35);
    glow.addColorStop(0, night ? '#b8d2ca42' : '#ffe4a575');
    glow.addColorStop(1, '#ffe4a500');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    oval(sunX, sunY, w * 0.026, w * 0.026, night ? '#ced6c4' : '#ffe1a6');
    if (landscape?.complete && landscape.naturalWidth) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      const im = landscape,
        sw = im.naturalWidth,
        sh = Math.min(im.naturalHeight * 0.66, (sw * h * 0.66) / w);
      ctx.drawImage(im, 0, 0, sw, sh, 0, 0, w, h * 0.64);
      ctx.restore();
      const glaze = ctx.createLinearGradient(0, 0, 0, h * 0.65);
      glaze.addColorStop(0, '#35302622');
      glaze.addColorStop(0.55, pal[1] + '22');
      glaze.addColorStop(1, pal[1]);
      ctx.fillStyle = glaze;
      ctx.fillRect(0, 0, w, h * 0.65);
    }
    for (let j = 0; j < 3; j++) {
      const pts = [[0, h]];
      for (let i = 0; i <= 26; i++)
        pts.push([
          (w * i) / 26,
          h * (0.32 + j * 0.125) + Math.sin(i * 0.68 + j) * h * 0.043 + noise(i, j) * h * 0.075
        ]);
      pts.push([w, h]);
      poly(pts, ['#86776d55', '#665e585c', '#61554c60'][j]);
    }
    for (let j = 0; j < 28; j++) {
      let x = ((noise(j, 7) + time * 0.003 * ((j % 3) + 1)) % 1) * w,
        y = noise(j, 2) * h;
      oval(x, y, j % 5 === 0 ? 1.7 : 1, j % 5 === 0 ? 1.2 : 0.7, '#ffdfab63');
    }
  }
  function transform(w, h, map, hero, overview) {
    const cols = map.rows[0].length,
      rows = map.rows.length;
    const k = Math.min(
      w / (overview ? cols + rows + 1 : w < 600 ? 10.8 : 14.5),
      h / (overview ? 12.4 : 8.4),
      65
    );
    const a = (cols - rows) * 0.5,
      b = (cols + rows - 2) * 0.5;
    const overflow = Math.max(0, (cols + rows) * k - w + 50) * 0.5;
    const shift = overview ? 0 : Math.max(-overflow, Math.min(overflow, (hero.x - hero.y - a) * k * 0.88));
    return {
      k,
      ox: w / 2 - a * k - shift,
      oy: h * 0.59 - b * k * 0.5 - (overview ? 0 : (hero.x + hero.y - b) * k * 0.2)
    };
  }
  const projected = (x, y) => ({
    x: layout.ox + (x - y) * layout.k,
    y: layout.oy + (x + y) * layout.k * 0.5
  });
  function cellAt(clientX, clientY) {
    if (!layout) return null;
    const r = canvas.getBoundingClientRect(),
      u = (clientX - r.left - layout.ox) / layout.k,
      v = (clientY - r.top - layout.oy) / (layout.k * 0.5);
    return { x: Math.round((u + v) / 2), y: Math.round((v - u) / 2) };
  }
  function draw(map, s, ui, now) {
    const rect = canvas.getBoundingClientRect(),
      w = rect.width,
      h = rect.height;
    if (!w || !h) return;
    const d = Math.min(devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(w * d) || canvas.height !== Math.round(h * d)) {
      canvas.width = Math.round(w * d);
      canvas.height = Math.round(h * d);
    }
    ctx.setTransform(d, 0, 0, d, 0, 0);
    const time = reduced || ui.paused ? 0 : now / 1000;
    let f = ui.motion && !reduced ? Math.min(1, (now - ui.motion.at) / 170) : 1;
    f = 1 - Math.pow(1 - f, 2);
    const hero = { x: s.x, y: s.y };
    if (ui.motion) {
      hero.x = ui.motion.x + (s.x - ui.motion.x) * f;
      hero.y = ui.motion.y + (s.y - ui.motion.y) * f;
    }
    const night = map.id === 'years' && s.turn % 12 >= 6;
    const pal = climates[night ? 'blue' : map.light];
    if (backgroundFor !== map.id) {
      backgroundFor = map.id;
      landscape = new Image();
      landscape.src = assets[vistas[map.id]];
    }
    layout = transform(w, h, map, hero, ui.overview);
    vista(w, h, pal, time, night, map.id === 'desert' ? ui.sunSide : 0);
    const tiles = [];
    map.rows.forEach((row, y) => Array.from(row).forEach((ch, x) => tiles.push({ x, y, ch, depth: x + y })));
    tiles.sort((a, b) => a.depth - b.depth);
    const place = (x, y, paint) => {
      const pt = projected(x, y);
      ctx.save();
      ctx.translate(pt.x, pt.y);
      ctx.scale(layout.k / 24, layout.k / 24);
      paint();
      ctx.restore();
    };
    tiles.forEach(({ x, y, ch }) =>
      place(x, y, () => {
        ground(x, y, ch, pal, time, map);
        const shaded = ui.shade(x, y);
        if (shaded && ['desert', 'years'].includes(map.id))
          poly(
            [
              [-22, 0],
              [0, -11],
              [22, 0],
              [0, 11]
            ],
            map.id === 'desert' ? '#365b6588' : '#50747b62'
          );
        else if (map.id === 'desert' && ui.nextShade?.(x, y)) {
          const soon = ui.sunLeft === 1;
          poly(
            [
              [-19, 0],
              [0, -9.5],
              [19, 0],
              [0, 9.5]
            ],
            soon ? '#38616c3a' : '#38616c1c'
          );
          ctx.strokeStyle = soon ? '#244e59e0' : '#4369729c';
          ctx.lineWidth = soon ? 1.5 : 1;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(-19, 0);
          ctx.lineTo(0, -9.5);
          ctx.lineTo(19, 0);
          ctx.lineTo(0, 9.5);
          ctx.closePath();
          ctx.stroke();
          ctx.setLineDash([]);
        }
        if (ui.route.some((p) => p.x === x && p.y === y)) oval(0, 0, 2, 1.1, '#fff1be');
        if (map.signs[ch]) {
          ctx.strokeStyle = s.flags[ch] ? '#8aa98d' : '#f5d995';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 2]);
          ctx.beginPath();
          ctx.ellipse(0, 0, 14, 6, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      })
    );
    if (ui.ghost?.length) {
      const path = ui.ghost.map(([x, y]) => {
        const p = projected(x, y);
        return [p.x, p.y];
      });
      ctx.setLineDash([3, 4]);
      line(path, '#316e74b5', 2);
      ctx.setLineDash([]);
    }
    const actors = [
      ...tiles.map((t) => ({ ...t, paint: () => landmark(t.ch, map, s, noise(t.x, t.y), time, ui.sunSide) }))
    ];
    if (map.id === 'kiln') {
      const c = { ...s.cart };
      if (ui.motion?.cart) {
        c.x = ui.motion.cart.x + (c.x - ui.motion.cart.x) * f;
        c.y = ui.motion.cart.y + (c.y - ui.motion.cart.y) * f;
      }
      actors.push({ x: c.x, y: c.y, depth: c.x + c.y + 0.22, paint: () => cart(s.loaded) });
      for (const [j, [x, y]] of [
        [0.2, 1.5],
        [7.7, 1.7],
        [0.1, 5.1],
        [7.5, 5.9]
      ].entries()) {
        actors.push({
          x,
          y,
          depth: x + y + 0.3,
          paint: () => {
            const lift = (Math.sin(time * 1.4 + j) + 1) * 1.1;
            person(
              0,
              lift * 0.4,
              ['#976b56', '#557777', '#a36e4b', '#718569'][j],
              j % 2 ? 1 : -1,
              time,
              false,
              false
            );
            box(3, -6 - lift, 5, 3, 2, sunBrick);
          }
        });
      }
    }
    if (map.id === 'frogs') {
      for (const o of ui.frogs) {
        actors.push({ x: o.x, y: o.y, depth: o.x + o.y + 0.3, paint: () => frog(0, 0, o.h, o.dir) });
      }
    }
    if (map.id === 'sea') {
      for (const [j, id] of ['A', 'H'].entries())
        if (s.flags[id])
          actors.push({
            x: hero.x - 0.25 - j * 0.22,
            y: hero.y + 0.3,
            depth: hero.x + hero.y + 0.18,
            paint: () => person(-1, 0, j ? '#b87851' : '#7c998b', 0, time, f < 1, false)
          });
    }
    actors.push({
      x: hero.x,
      y: hero.y,
      depth: hero.x + hero.y + 0.5,
      paint: () => {
        ctx.strokeStyle = '#ffe5a3';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, 1, 8, 3.4, 0, 0, Math.PI * 2);
        ctx.stroke();
        person(0, 0, '#29778b', s.face || 1, time, f < 1, true);
      }
    });
    actors.sort((a, b) => a.depth - b.depth);
    actors.forEach((a) =>
      place(a.x, a.y, () => {
        if (a.ch && ['P', '#', '^'].includes(a.ch)) {
          const pt = projected(a.x, a.y),
            height = layout.k * (a.ch === 'P' ? 1.9 : 1);
          const overlaps = (o) => {
            const q = projected(o.x, o.y);
            return (
              a.depth > o.x + o.y &&
              Math.abs(q.x - pt.x) < layout.k * 0.81 &&
              pt.y - q.y < height &&
              pt.y >= q.y
            );
          };
          if (overlaps(hero) || (s.cart && overlaps(s.cart))) ctx.globalAlpha = 0.33;
        }
        a.paint();
      })
    );
    if (map.id === 'years') {
      const pt = projected(s.x, s.y);
      const lift = ui.cloud;
      ctx.save();
      ctx.globalAlpha = 0.72;
      for (let i = 0; i < 6; i++)
        oval(
          w * 0.42 + i * 9,
          h * (lift ? 0.14 : 0.28) + Math.sin(i) * 4,
          15,
          6,
          night ? '#f3b976' : '#e9e1cf'
        );
      ctx.restore();
    }
    if (map.id === 'kiln') {
      const pos = projected(
        s.loaded ? ui.points.D.x : ui.points.L.x,
        s.loaded ? ui.points.D.y : ui.points.L.y
      );
      ctx.fillStyle = '#ffe5a3';
      const yy = pos.y - layout.k * 0.58 + Math.sin(time * 2) * 1.6;
      poly(
        [
          [pos.x, yy],
          [pos.x - 3, yy - 5],
          [pos.x + 3, yy - 5]
        ],
        '#fff0bf'
      );
    }
    function tag(pos, words, accent) {
      const pt = projected(pos.x, pos.y);
      ctx.font = 'bold ' + (w < 500 ? 11 : 13) + 'px Dodum, sans-serif';
      const tw = ctx.measureText(words).width;
      const px = Math.max(tw * 0.5 + 6, Math.min(w - tw * 0.5 - 6, pt.x)),
        py = pt.y - layout.k * 0.78;
      ctx.fillStyle = '#1a2a2ce8';
      ctx.fillRect(px - tw / 2 - 5, py - 13, tw + 10, 18);
      ctx.fillStyle = accent;
      ctx.textAlign = 'center';
      ctx.fillText(words, px, py);
      ctx.textAlign = 'left';
    }
    if (map.id === 'kiln' && !s.delivered) {
      tag(s.loaded ? ui.points.D : ui.points.L, s.loaded ? '말림터' : '흙 작업대', '#ffdd99');
      if (s.turn < 2) tag(s.cart, '빈 수레', '#e8f5e9');
    }
    if (ui.bump && now < ui.bump.until) {
      const pt = projected(ui.bump.x, ui.bump.y);
      line(
        [
          [pt.x - 6, pt.y - 10],
          [pt.x + 6, pt.y + 2]
        ],
        '#873e29',
        4
      );
      line(
        [
          [pt.x + 6, pt.y - 10],
          [pt.x - 6, pt.y + 2]
        ],
        '#873e29',
        4
      );
    }
    const vignette = ctx.createRadialGradient(
      w * 0.5,
      h * 0.52,
      Math.min(w, h) * 0.3,
      w * 0.5,
      h * 0.52,
      Math.max(w, h) * 0.65
    );
    vignette.addColorStop(0, '#131a1a00');
    vignette.addColorStop(1, '#151f256b');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }
  return { draw, cellAt, projected };
}
