// All distances in the passage are metres. Actors and terrain share a vanishing point.
function createCrossingArt(canvas) {
  const g = canvas.getContext('2d', { alpha: false });
  const images = {};
  const names = [
    'mouth',
    'narrows',
    'morning',
    'above',
    'carry',
    'rock',
    'slab',
    'basalt',
    'rib',
    'streamer',
    'basket',
    'lightbearer',
    'traveler',
    'companion',
    'walk0',
    'walk1',
    'walk2',
    'walk3'
  ];
  const ready = Promise.all(
    names.map(
      (name) =>
        new Promise((resolve) => {
          const image = new Image();
          images[name] = image;
          image.onload = image.onerror = resolve;
          image.src = assets[name];
        })
    )
  );
  const rockRows = [
    // Landmarks flank the dry footing. Low outcrops that reach the path can be skirted.
    [-1.6, 7, 1.2],
    [1.45, 14, 0.95],
    [-0.08, 30, 0.8],
    [1.8, 31, 1.4],
    [-1.65, 40, 0.9],
    [0.65, 47, 1.1],
    [-1.22, 52, 0.8],
    [-0.64, 67, 1],
    [1.55, 71, 1.6],
    [-1.66, 83, 1.5],
    [0.17, 93, 0.9],
    [1.65, 99, 1.3],
    [-0.72, 105, 0.9],
    [1.5, 114, 1],
    [-1.7, 121, 1.1]
  ];
  const posts = [
    [-0.98, 10],
    [-1.05, 36],
    [1.09, 66],
    [-0.97, 88]
  ];
  const scatter = [];
  function noise(n) {
    const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return v - Math.floor(v);
  }
  for (let i = 0; i < 163; i++) {
    const side = i % 2 ? 1 : -1;
    scatter.push({
      x: side * (0.16 + noise(i + 4) * 1.8),
      z: noise(i + 1) * 146,
      size: 0.016 + noise(i + 77) * 0.052,
      tilt: noise(i + 13)
    });
  }
  let hitAreas = [];
  let w = 1,
    h = 1,
    t = 0,
    horizon = 0,
    lens = 0,
    eye = 0,
    sway = 0,
    lift = 0;
  function fit() {
    const b = canvas.getBoundingClientRect(),
      ratio = Math.min(devicePixelRatio || 1, 1.5);
    w = b.width;
    h = b.height;
    if (canvas.width !== Math.round(w * ratio) || canvas.height !== Math.round(h * ratio)) {
      canvas.width = Math.max(1, Math.round(w * ratio));
      canvas.height = Math.max(1, Math.round(h * ratio));
    }
    g.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  const smooth = (n) => {
    n = clamp(n);
    return n * n * (3 - 2 * n);
  };
  function point(x, d) {
    const k = 9 / (Math.max(-4.5, d) + 9);
    return { x: w * 0.5 + (x - eye) * lens * k + sway, y: horizon + (h * 0.95 - horizon) * k + lift * k, k };
  }
  function sprite(name, x, y, height, flip = false) {
    const im = images[name];
    if (!im?.naturalWidth || height < 1) return;
    const width = (height * im.naturalWidth) / im.naturalHeight;
    if (x + width * 0.5 < 0 || x - width * 0.5 > w) return;
    if (flip) {
      g.save();
      g.translate(x, y);
      g.scale(-1, 1);
      g.drawImage(im, -width / 2, -height, width, height);
      g.restore();
    } else g.drawImage(im, x - width / 2, y - height, width, height);
  }
  function scene(name, alpha, cam, time, cold = false) {
    const im = images[name];
    if (!im.naturalWidth || alpha <= 0) return;
    g.globalAlpha = alpha;
    const zoom = 1.02 + (cam.progress || 0) * 0.043;
    const hh = Math.max(h * 1.08, w * 0.58) * zoom,
      ww = Math.max(w * 1.12, hh * (w / h < 0.86 ? 1.3 : 1.77));
    const ix = (w - ww) * 0.5 - cam.x * Math.min(w * 0.042, 48) + sway * 0.18;
    const iy = horizon - hh * (cold ? 0.59 : 0.596) + lift * 0.14;
    g.drawImage(im, ix, iy, ww, hh);
    if (!cam.still) {
      // Ripple the crests in vertical strips. The sand and skyline stay registered.
      const sh = Math.floor(hh * 0.52),
        cols = 42;
      for (let i = 0; i < cols; i++) {
        const pos = (i + 0.5) / cols,
          edge = smooth((Math.abs(pos - 0.5) - 0.11) * 3.2);
        if (edge < 0.08) continue;
        const sw = im.naturalWidth / cols,
          dx = ix + (i * ww) / cols;
        const rise =
          (Math.sin(time * 0.83 + i * 0.4) + Math.sin(time * 1.3 + i * 0.74) * 0.4) * edge * hh * 0.0034;
        g.drawImage(im, i * sw, 0, sw + 1, im.naturalHeight * 0.52, dx, iy + rise, ww / cols + 1, sh);
      }
    }
    g.globalAlpha = 1;
  }
  function glow(x, y, r, strength) {
    const f = g.createRadialGradient(x, y, 0, x, y, r);
    f.addColorStop(0, 'rgba(255,213,128,' + strength + ')');
    f.addColorStop(0.15, 'rgba(255,165,68,' + strength * 0.48 + ')');
    f.addColorStop(1, 'rgba(233,138,52,0)');
    g.fillStyle = f;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function marker(x, y, label) {
    const fs = clamp(w * 0.018, 13, 19);
    g.save();
    g.font = '700 ' + fs + 'px Dodum, sans-serif';
    g.textAlign = 'center';
    const tw = g.measureText(label).width,
      px = clamp(x, tw / 2 + 16, w - tw / 2 - 16),
      py = clamp(y, 100, h - 120);
    g.fillStyle = 'rgba(15,27,29,.85)';
    g.fillRect(px - tw / 2 - 8, py - fs - 4, tw + 16, fs + 10);
    g.fillStyle = '#ffdda2';
    g.fillText(label, px, py);
    g.restore();
  }
  function draw(v) {
    fit();
    t = v.time;
    hitAreas = [];
    const hero = v.mode === 'title',
      end = v.mode === 'end',
      display = v.still ? 0 : t;
    eye = hero ? -0.14 : v.x;
    const motion = v.still ? 0 : v.motion;
    sway = Math.sin(v.z * 1.65) * motion * w * 0.0028;
    lift = Math.sin(v.z * 3.3) * motion * h * 0.004 + v.brace * h * 0.043;
    horizon = h * (w / h < 0.9 ? 0.528 : 0.554);
    lens = Math.min(w * 0.71, h * 0.93);
    const camera = { x: eye, progress: v.z / 130, still: v.still };
    if (end) {
      const im = images.morning;
      if (im.naturalWidth) {
        const hh = Math.max(h, w / 1.777),
          ww = hh * 1.777;
        g.drawImage(im, (w - ww) * (w / h < 1 ? 0.65 : 0.5), (h - hh) * 0.5, ww, hh);
      }
      if (v.beat > 0) {
        g.fillStyle = 'rgba(255,205,126,' + v.beat * 0.12 + ')';
        g.fillRect(0, 0, w, h);
      }
      return;
    }
    g.fillStyle = '#102526';
    g.fillRect(0, 0, w, h);
    scene('mouth', 1, camera, display);
    const inside = smooth((v.z - 23) / 23) * (1 - smooth((v.z - 91) / 31));
    scene('narrows', inside, camera, display, true);
    if (hero) {
      const size = Math.min(h * 0.64, w * 0.71);
      sprite('companion', w * (w / h < 0.85 ? 0.79 : 0.77), h * 0.89, size);
      glow(w * (w / h < 0.85 ? 0.79 : 0.77) - size * 0.19, h * 0.89 - size * 0.72, size * 0.23, 0.34);
    } else {
      const items = [];
      rockRows.forEach(([x, z, scale], i) => {
        items.push({
          type: 'rock',
          image: ['basalt', 'rib', 'slab', 'rock', 'slab', 'basalt', 'rib'][i % 7],
          x,
          z,
          scale
        });
      });
      for (const [x, z] of posts) items.push({ type: 'streamer', x, z, scale: 0.81 });
      for (const item of scatter) {
        const d = item.z - v.z;
        if (d < -4 || d > 77) continue;
        const p = point(item.x, d),
          size = h * 0.22 * item.size * p.k;
        g.fillStyle = 'rgba(53,43,32,' + clamp(p.k) * 0.65 + ')';
        g.beginPath();
        g.ellipse(p.x, p.y, Math.max(0.35, size * 1.7), Math.max(0.3, size * 0.55), -0.19, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = 'rgba(234,202,145,' + 0.26 * clamp(p.k) + ')';
        g.fillRect(p.x - size, p.y - size * 0.25, Math.max(0.5, size * 1.35), Math.max(0.45, size * 0.18));
      }
      // The two tracks converge at the horizon. Prints grow and pass underfoot as the player walks.
      for (let z = 3; z < 135; z += 2.4) {
        const d = z - v.z;
        if (d < -2 || d > 43) continue;
        const sign = Math.round(z / 2.4) % 2 ? 1 : -1,
          p = point(-0.48 + Math.sin(z * 0.078) * 0.21 + sign * 0.065, d);
        const sz = h * 0.013 * p.k;
        g.fillStyle = 'rgba(48,37,29,' + 0.26 * clamp(p.k) + ')';
        g.beginPath();
        g.ellipse(p.x, p.y, Math.max(0.3, sz * 0.44), Math.max(0.35, sz * 0.87), sign * 0.43, 0, Math.PI * 2);
        g.fill();
      }
      if (!v.traveler) items.push({ type: 'basket', x: 0.68, z: 79.5, scale: 0.47 });
      if (!v.light) items.push({ type: 'lightbearer', x: -0.75, z: 21, scale: 1.0 });
      if (!v.traveler) items.push({ type: 'traveler', x: 0.77, z: 82, scale: 1.01 });
      if (v.light && v.z < 124) {
        const lead = 5.8 + Math.sin(display * 1.5) * 0.12;
        const frame = Math.floor(v.z * 1.75) % 4;
        const ahead = rockRows.find(([x, z]) => Math.abs(x) < 1 && z > v.z && z - v.z < 16);
        const safe = ahead ? (ahead[0] > 0.1 ? -0.64 : 0.7) : -0.64;
        const turn = ahead ? smooth((16 - (ahead[1] - v.z)) / 7) : 0;
        items.push({
          type: 'walk' + frame,
          x: (-0.66 + 0.12 * Math.sin(v.z * 0.09)) * (1 - turn) + safe * turn,
          z: v.z + lead,
          scale: 0.82,
          friend: true
        });
      }

      items.sort((a, b) => b.z - a.z);
      let label = null;
      for (const item of items) {
        const d = item.z - v.z;
        if (d < -3.7 || d > 75) continue;
        const p = point(item.x, d),
          person = /lightbearer|traveler|walk/.test(item.type);
        let height = (person ? h * 0.68 : item.type === 'rock' ? h * 0.39 : h * 0.52) * p.k * item.scale;
        if (item.type === 'rock') {
          const widths = { slab: 0.97, basalt: 0.9, rib: 0.84, rock: 1.08 };
          height =
            (height * widths[item.image] * images[item.image].naturalHeight) /
            Math.max(1, images[item.image].naturalWidth);
        }
        g.globalAlpha = 1 - smooth((d - 22) / 54) * 0.9;
        const bob =
          person && !v.still
            ? Math.sin(display * (item.friend ? 6.7 : 1.9) + item.z) * height * (item.friend ? 0.006 : 0.0025)
            : 0;
        g.fillStyle = 'rgba(40,34,29,' + clamp(0.36 * p.k, 0.035, 0.34) + ')';
        g.beginPath();
        g.ellipse(
          p.x,
          p.y + 1,
          Math.max(1, height * (item.type === 'rock' ? 0.62 : 0.23)),
          Math.max(0.7, height * 0.035),
          0,
          0,
          Math.PI * 2
        );
        g.fill();
        sprite(
          item.image || item.type,
          p.x,
          p.y + bob - (item.type === 'basket' ? v.grip * height * 0.48 : 0),
          height,
          item.type === 'rock' && item.x > 0
        );
        if (!item.friend && person && d >= -3 && d < 39) {
          hitAreas.unshift({
            x: item.x,
            px: p.x,
            top: p.y - height,
            bot: p.y + 13,
            half: Math.max(24, height * 0.27)
          });
        }
        if (item.type === 'lightbearer' || item.friend)
          glow(
            p.x - height * (item.friend ? 0.13 : 0.18),
            p.y - height * (item.friend ? 0.61 : 0.8),
            Math.max(6, height * 0.22),
            0.46 + Math.sin(display * 4) * 0.07
          );
        if (!item.friend && person && d >= 0 && d < 17 && (item.type !== 'traveler' || !v.traveler)) {
          label = [p.x, p.y - height - 9, item.type === 'lightbearer' ? '흔들리는 등불' : '멈춰 선 나그네'];
        }
      }
      g.globalAlpha = 1;
      if (v.z > 23 && v.z < 36) {
        for (const [x, title] of [
          [-0.88, '바위 그늘길'],
          [0.88, '트인 모랫길']
        ]) {
          const p = point(x, 38 - v.z);
          marker(p.x, p.y - h * 0.17 * p.k, title);
        }
      }
      if (v.blocked) {
        const p = point(v.blocked.aim, 5),
          x = p.x,
          y = p.y;
        g.save();
        g.strokeStyle = '#ffe2a9';
        g.lineWidth = 2;
        g.setLineDash([4, 7]);
        g.beginPath();
        g.moveTo(w / 2, h * 0.94);
        g.quadraticCurveTo(w / 2, h * 0.87, x, y);
        g.stroke();
        g.setLineDash([]);
        g.beginPath();
        g.ellipse(x, y, 17, 5, 0, 0, Math.PI * 2);
        g.stroke();
        g.restore();
      }
      if (label && !v.silent) marker(...label);
      if (v.traveler || v.grip > 0.05) {
        const im = images.carry;
        if (im.naturalWidth) {
          const cw = Math.min(w * 0.48, h * 0.64),
            ch = (cw * im.naturalHeight) / im.naturalWidth;
          const up = v.traveler ? 1 : smooth(v.grip);
          const n = v.still ? 0 : Math.sin(v.z * 3.3) * ch * 0.027;
          g.drawImage(im, w - cw * 0.94, h - ch * 0.79 * up + n, cw, ch);
        }
      }
    }
    // Salt spray catches the light on the windward side; the dry floor stays clear.
    const gust = v.wind;
    g.lineWidth = 1;
    for (let i = 0; i < (hero ? 38 : 38 + Math.round(gust * 70)); i++) {
      const pos = noise(i + 5),
        speed = 0.022 + noise(i + 14) * 0.055;
      const xx = (((pos + display * speed * (1 + gust * 2)) % 1.14) - 0.06) * w;
      const yy = (noise(i + 30) * 0.71 + Math.sin(display * 0.73 + i) * 0.012) * h;
      g.strokeStyle = 'rgba(204,233,232,' + (0.13 + gust * 0.21) * (0.4 + noise(i + 9)) + ')';
      g.beginPath();
      g.moveTo(xx, yy);
      g.lineTo(xx + 1 + gust * w * 0.017, yy - 0.5 - gust * 1.5);
      g.stroke();
    }
    if (gust > 0) {
      g.fillStyle = 'rgba(133,183,181,' + gust * 0.12 + ')';
      g.fillRect(0, 0, w, h);
    }
    if (v.look > 0) {
      g.save();
      g.globalAlpha = v.look;
      const im = images.above;
      if (im.naturalWidth) {
        const hh = Math.max(h * 1.07, w / 1.76),
          ww = hh * (w / h < 0.9 ? 1.37 : 1.77);
        g.drawImage(
          im,
          (w - ww) * 0.41 + Math.sin(display * 0.16) * w * 0.008,
          -hh * 0.026 + (1 - v.look) * h * 0.075,
          ww,
          hh
        );
      }
      // In silhouette the school travels as a group, with a tail beat on each fish.
      for (let i = 0; i < 19; i++) {
        const flow = (display * 0.034 + noise(Math.floor(i / 6) + 33) * 0.24) % 1.45;
        const x = (flow - 0.22 + noise(i + 222) * 0.25) * w,
          y = h * (0.32 + noise(i + 116) * 0.18 + Math.sin(display * 0.4 + i) * 0.008);
        const len = Math.min(w, h) * (0.016 + noise(i + 13) * 0.013),
          tail = Math.sin(display * 4.5 + i) * len * 0.12;
        g.fillStyle = 'rgba(2,42,52,.7)';
        g.beginPath();
        g.moveTo(x + len * 0.54, y);
        g.quadraticCurveTo(x, y - len * 0.32, x - len * 0.43, y);
        g.lineTo(x - len * 0.73, y - len * 0.16 + tail);
        g.lineTo(x - len * 0.73, y + len * 0.16 + tail);
        g.lineTo(x - len * 0.43, y);
        g.quadraticCurveTo(x, y + len * 0.25, x + len * 0.54, y);
        g.fill();
      }
      g.restore();
    }
    const vign = g.createRadialGradient(
      w * 0.53,
      h * 0.52,
      h * 0.11,
      w * 0.5,
      h * 0.51,
      Math.max(w * 0.69, h * 0.78)
    );
    vign.addColorStop(0, 'rgba(3,14,20,0)');
    vign.addColorStop(1, 'rgba(1,12,19,.48)');
    g.fillStyle = vign;
    g.fillRect(0, 0, w, h);
  }
  function pick(px, py) {
    const hit = hitAreas.find((a) => Math.abs(px - a.px) <= a.half && py >= a.top - 12 && py <= a.bot);
    if (hit) return { x: hit.x, person: true };
    const k = clamp((py - horizon) / Math.max(1, h * 0.95 - horizon), 0.4, 1);
    return { x: clamp(eye + (px - w * 0.5) / (lens * k), -1, 1), person: false };
  }
  return { ready, draw, rockRows, pick };
}
