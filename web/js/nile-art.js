/* 나일강 미니어처. 정적인 강과 갈대밭은 보관하고 배의 움직임만 다시 그린다. */
(function () {
  'use strict';

  const TAU = Math.PI * 2;
  let scenery;

  function noise(x, y, salt) {
    const n = Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453;
    return n - Math.floor(n);
  }

  function oval(ctx, x, y, rx, ry, fill, angle = 0) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, angle, 0, TAU);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function line(ctx, points, color, width) {
    ctx.beginPath();
    ctx.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  function shape(ctx, points, color) {
    ctx.beginPath();
    ctx.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function water(ctx, rows) {
    const w = rows[0].length, h = rows.length;
    const wash = ctx.createLinearGradient(0, h, w, 0);
    wash.addColorStop(0, '#075c63');
    wash.addColorStop(0.48, '#15767a');
    wash.addColorStop(1, '#4d9f93');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
    // Broken current marks keep the spaces countable without a heavy checkerboard.
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if ((x + y) % 2 === 0) {
          ctx.fillStyle = 'rgba(176,241,205,.045)';
          ctx.fillRect(x, y, 1, 1);
        }
        if (rows[y][x] === '#') continue;
        const k = noise(x, y, 2);
        const px = x + 0.16 + k * 0.45;
        const py = y + 0.28 + noise(x, y, 3) * 0.42;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.bezierCurveTo(px + 0.07, py + 0.023, px + 0.14, py - 0.055, px + 0.23, py - 0.05);
        ctx.strokeStyle = 'rgba(179,245,217,.32)';
        ctx.lineWidth = 0.016;
        ctx.stroke();
        if (k > 0.56) line(ctx, [px + 0.08, py + 0.055, px + 0.17, py + 0.039], 'rgba(182,245,223,.24)', 0.012);
        if (x && y) oval(ctx, x, y, 0.024, 0.019, 'rgba(185,238,210,.32)');
      }
    }
  }

  function shore(ctx, rows, x, y) {
    const sand = (col, row) => rows[row] && rows[row][col] === '#';
    const l = sand(x - 1, y) ? 0 : 0.045;
    const r = sand(x + 1, y) ? 1 : 0.955;
    const t = sand(x, y - 1) ? 0 : 0.048;
    const b = sand(x, y + 1) ? 1 : 0.92;
    const tl = l && t ? 0.22 : 0, tr = r < 1 && t ? 0.24 : 0;
    const bl = l && b < 1 ? 0.21 : 0, br = r < 1 && b < 1 ? 0.21 : 0;
    ctx.beginPath();
    ctx.moveTo(l + tl, t);
    ctx.lineTo(r - tr, t);
    ctx.quadraticCurveTo(r, t, r, t + tr);
    ctx.lineTo(r, b - br);
    ctx.quadraticCurveTo(r, b, r - br, b);
    ctx.lineTo(l + bl, b);
    ctx.quadraticCurveTo(l, b, l, b - bl);
    ctx.lineTo(l, t + tl);
    ctx.quadraticCurveTo(l, t, l + tl, t);
    ctx.closePath();
  }

  function reeds(ctx, x, y, scale, variation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    oval(ctx, 0.055, 0.014, 0.21, 0.060, 'rgba(65,75,38,.25)', -0.18);
    for (let i = 0; i < 7; i++) {
      const a = (i - 3) * 0.29;
      const length = 0.25 + noise(i, variation, 2) * 0.22;
      const dx = Math.sin(a) * length, dy = -Math.cos(a) * length;
      const base = (i - 3) * 0.017;
      shape(ctx, [base - 0.025, 0.015, base + dx * 0.25 - 0.019, dy * 0.52,
        base + dx, dy, base + dx * 0.50 + 0.024, dy * 0.46, base + 0.018, 0.02],
      ['#365641', '#54764a', '#678648', '#3c6948', '#799052', '#527b4d', '#406047'][i]);
      if (i === 1 || i === 4) {
        line(ctx, [base, -0.008, base + dx, dy], '#a5a367', 0.013);
        oval(ctx, base + dx * 0.94, dy * 0.95, 0.029, 0.066, '#805d39', a);
        oval(ctx, base + dx * 0.94 - 0.008, dy * 0.97, 0.008, 0.037, '#bb9252', a);
      }
    }
    ctx.restore();
  }

  function shoals(ctx, rows) {
    const sand = [];
    rows.forEach((row, y) => Array.from(row).forEach((c, x) => {
      if (c === '#') sand.push([x, y]);
    }));
    // A shared shoreline pass keeps adjoining sand tiles one island.
    for (const [dy, color, stroke] of [[0.08, '#86c6ac', 0.09], [0.055, '#347969', 0.036], [0.025, '#b49259', 0]]) {
      for (const [x, y] of sand) {
        ctx.save();
        ctx.translate(x, y + dy);
        shore(ctx, rows, x, y);
        ctx.fillStyle = color;
        ctx.fill();
        if (stroke) {
          ctx.strokeStyle = color;
          ctx.lineWidth = stroke;
          ctx.stroke();
        }
        ctx.restore();
      }
    }
    for (const [x, y] of sand) {
      ctx.save();
      ctx.translate(x, y);
      shore(ctx, rows, x, y);
      const sandWash = ctx.createLinearGradient(0, 0, 0.24, 1);
      sandWash.addColorStop(0, '#e3cb8a');
      sandWash.addColorStop(1, '#ccad6e');
      ctx.fillStyle = sandWash;
      ctx.fill();
      ctx.restore();
    }
    for (const [x, y] of sand) {
      const v = noise(x, y, 6);
      ctx.save();
      ctx.translate(x, y);
      for (let j = 0; j < 7; j++) {
        const sx = 0.18 + noise(x, y, j + 10) * 0.64;
        const sy = 0.18 + noise(y, x, j + 21) * 0.61;
        oval(ctx, sx, sy, j % 2 ? 0.019 : 0.030, 0.012, j % 2 ? '#b49c64' : '#ead599', -0.22);
      }
      reeds(ctx, 0.30 + v * 0.19, 0.62, 0.94 + v * 0.13, v);
      if (v > 0.38) reeds(ctx, 0.71, 0.68, 0.63, v + 7);
      else {
        oval(ctx, 0.74, 0.69, 0.105, 0.053, '#b49663');
        oval(ctx, 0.726, 0.66, 0.103, 0.068, '#c4b081', -0.22);
        oval(ctx, 0.699, 0.632, 0.064, 0.019, '#e5d4a3', -0.22);
      }
      ctx.restore();
    }
  }

  function dock(ctx, point) {
    ctx.save();
    ctx.translate(point.x + 0.50, point.y + 0.50);
    const glow = ctx.createRadialGradient(0.15, -0.17, 0.015, 0.15, -0.17, 0.55);
    glow.addColorStop(0, 'rgba(255,210,91,.64)');
    glow.addColorStop(1, 'rgba(246,201,78,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-0.5, -0.5, 1, 1);
    oval(ctx, 0.01, 0.24, 0.39, 0.075, '#216567');
    // A broad jetty of individual boards and tied pilings.
    shape(ctx, [-0.33, 0.15, 0.30, 0.11, 0.36, 0.23, -0.30, 0.28], '#584329');
    for (let i = 0; i < 5; i++) {
      const px = -0.32 + i * 0.127;
      shape(ctx, [px, -0.062, px + 0.117, -0.075, px + 0.166, 0.169, px + 0.049, 0.182], i % 2 ? '#d0a362' : '#e4b978');
      line(ctx, [px + 0.035, -0.04, px + 0.074, 0.13], '#ab824f', 0.014);
    }
    for (const x of [-0.32, 0.31]) {
      line(ctx, [x, 0.24, x, -0.06], '#69492e', 0.072);
      oval(ctx, x, -0.057, 0.044, 0.025, '#f5cf84');
      line(ctx, [x - 0.028, 0.008, x + 0.031, 0.002], '#ecba72', 0.024);
    }
    line(ctx, [0.19, 0.05, 0.19, -0.42], '#483f2e', 0.054);
    line(ctx, [0.18, 0.045, 0.18, -0.42], '#f1c16d', 0.018);
    shape(ctx, [0.18, -0.405, -0.05, -0.406, -0.21, -0.33, -0.09, -0.28, -0.14, -0.218, 0.18, -0.25], '#f9b941');
    shape(ctx, [0.18, -0.36, -0.11, -0.314, -0.055, -0.29, 0.18, -0.313], '#fff1ad');
    oval(ctx, 0.19, -0.43, 0.039, 0.035, '#ffe9a4');
    ctx.restore();
  }

  function flower(ctx, point, found) {
    ctx.save();
    ctx.translate(point.x + 0.5, point.y + 0.53);
    ctx.beginPath();
    ctx.ellipse(0, 0.03, 0.40, 0.29, 0, 0, TAU);
    ctx.lineWidth = found ? 0.022 : 0.014;
    ctx.strokeStyle = found ? '#b7e0c2' : '#8cc7ab';
    ctx.stroke();
    oval(ctx, 0.09, 0.13, 0.25, 0.11, '#255e53', -0.16);
    oval(ctx, 0.10, 0.10, 0.24, 0.10, '#749964', -0.16);
    shape(ctx, [0.07, 0.11, 0.30, 0.04, 0.28, 0.095], '#477b65');
    oval(ctx, -0.17, 0.09, 0.12, 0.062, '#97b679', 0.22);
    function petal(x, y, a, size, color) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.scale(size, size);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-0.106, -0.075, -0.084, -0.188, 0, -0.29);
      ctx.bezierCurveTo(0.07, -0.205, 0.11, -0.081, 0, 0);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    }
    const colors = found ? ['#9ebaae', '#bdd3bc', '#d2dfc5'] : ['#c17eab', '#e8a5cb', '#ffe2ee'];
    petal(-0.025, 0.073, -1.03, 0.96, colors[0]);
    petal(-0.01, 0.07, 0.97, 0.97, colors[0]);
    petal(-0.028, 0.058, -0.55, 1, colors[1]);
    petal(-0.022, 0.065, 0.50, 0.99, colors[1]);
    petal(-0.021, 0.064, 0, 1.1, colors[2]);
    oval(ctx, -0.019, 0.045, 0.058, 0.04, '#efca64');
    ctx.restore();
  }

  function skiff(ctx, point, direction) {
    const angle = {right:0, down:Math.PI / 2, left:Math.PI, up:-Math.PI / 2}[direction] || 0;
    ctx.save();
    ctx.translate(point.x + 0.5, point.y + 0.54);
    oval(ctx, 0.040, 0.065, 0.40, 0.145, 'rgba(0,52,58,.48)', angle);
    ctx.save();
    ctx.rotate(angle);
    for (let i = 0; i < 2; i++) {
      line(ctx, [-0.28, 0.07 + i * 0.05, -0.43, 0.11 + i * 0.06], '#a2d5c1', 0.017);
      line(ctx, [-0.31, -0.08 - i * 0.04, -0.46, -0.10 - i * 0.06], '#82bbad', 0.015);
    }
    ctx.beginPath();
    ctx.moveTo(-0.425, -0.018);
    ctx.bezierCurveTo(-0.28, -0.23, 0.22, -0.23, 0.455, -0.035);
    ctx.bezierCurveTo(0.26, 0.223, -0.24, 0.213, -0.425, -0.018);
    ctx.fillStyle = '#5d432f';
    ctx.fill();
    ctx.strokeStyle = '#f1d39a';
    ctx.lineWidth = 0.033;
    ctx.stroke();
    oval(ctx, 0.005, -0.007, 0.305, 0.123, '#cb965b');
    for (const x of [-0.20, 0.03, 0.23]) line(ctx, [x, -0.109, x, 0.089], '#765037', 0.039);
    line(ctx, [0.10, -0.12, -0.17, 0.22], '#684b36', 0.037);
    oval(ctx, -0.18, 0.24, 0.039, 0.077, '#efc481', 0.64);
    ctx.restore();
    // The mast stays upright in the miniature view as the hull turns below it.
    line(ctx, [0.01, 0.06, 0.023, -0.438], '#4b4332', 0.045);
    const sail = ctx.createLinearGradient(-0.25, -0.21, 0.2, -0.06);
    sail.addColorStop(0, '#ac4939');
    sail.addColorStop(0.56, '#e76e47');
    sail.addColorStop(1, '#ffe0a0');
    ctx.beginPath();
    ctx.moveTo(0.023, -0.414);
    ctx.bezierCurveTo(-0.026, -0.35, -0.198, -0.125, -0.322, -0.044);
    ctx.quadraticCurveTo(-0.091, 0.008, 0.215, -0.073);
    ctx.quadraticCurveTo(0.089, -0.294, 0.023, -0.414);
    ctx.fillStyle = sail;
    ctx.fill();
    ctx.strokeStyle = '#744633';
    ctx.lineWidth = 0.018;
    ctx.stroke();
    line(ctx, [0.018, -0.377, -0.062, -0.054], '#ffcf94', 0.017);
    line(ctx, [-0.32, -0.043, 0.207, -0.071], '#f2ce92', 0.024);
    ctx.restore();
  }

  function backdrop(ctx, rows, landing) {
    water(ctx, rows);
    shoals(ctx, rows);
    dock(ctx, landing);
  }

  window.BO = window.BO || {};
  window.BO.drawNileBoard = function (ctx, board) {
    const {rows, boat, lotus, dock:landing, found, direction} = board;
    const width = rows[0].length, height = rows.length;
    const scale = Math.max(1, Math.round(Math.hypot(ctx.getTransform().a, ctx.getTransform().b)));
    const key = [rows.join('/'), landing.x, landing.y, scale].join(':');
    if (!scenery || key !== scenery.key) {
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const layer = canvas.getContext('2d');
      layer.scale(scale, scale);
      layer.lineCap = layer.lineJoin = 'round';
      backdrop(layer, rows, landing);
      scenery = {key, canvas};
    }
    ctx.save();
    ctx.lineCap = ctx.lineJoin = 'round';
    ctx.drawImage(scenery.canvas, 0, 0, width, height);
    flower(ctx, lotus, found);
    skiff(ctx, boat, direction);
    ctx.restore();
  };
})();
