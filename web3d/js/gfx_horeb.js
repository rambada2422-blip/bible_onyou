/* 호렙(OT-09) 그래픽 시험 (2026-11-17, docs/20_호렙_그래픽시험.md).
 * 엔진(three.js r128)은 그대로 두고 이 장면 하나만 화면 품질과 연출을 올려 전후를 비교한다.
 *
 * 이 파일이 하는 일 (모두 호렙 장면 안에서만):
 *   1) 화면 설정: 색 보정(ACES)과 sRGB 출력, 하늘빛·땅빛·해 다시 맞추기, 그림자 다듬기.
 *      renderer 설정은 12장면이 함께 쓰므로 enter()에서 켜고 leave()에서 원래 값으로 되돌린다(game.js가 장면을 그리기 직전에 부른다).
 *   2) 그림 입히기: 코드로 그린 무늬(CanvasTexture, 외부 그림 없음)를 땅·바위·나무껍질·양털·천에 입힌다.
 *      모형에는 UV가 없어서, 자리(월드·물체 좌표)로 무늬를 세 방향에서 입힌다(삼면 투영).
 *   3) 살아 있는 느낌: 풀·잎 흔들림, 마른 풀 포기, 발밑 먼지, 떠다니는 빛 먼지.
 *
 * 다른 장면이 바뀌지 않게 하는 방법:
 *   - 모형 재질(models.js의 공용 재질 포함)은 고치지 않는다. 호렙 장면의 물체에만 "복제한 재질"을 끼운다(scan).
 *   - 색: 기존 화면은 색을 선형으로 바꾸지 않고 그대로 내보냈다. sRGB 출력을 켜면 색이 허옇게 뜨므로,
 *     복제한 재질의 셰이더에서 "지금까지 보이던 색"을 선형으로 바꾼 뒤 조명을 계산한다(색이 씻기지 않는다).
 *   - 후처리(FX.Post)는 렌더 타깃을 거친다. r128에서 색 보정은 재질 셰이더에서(타깃에도) 적용되고,
 *     출력 색 공간은 타깃의 texture.encoding을 따른다. 그래서 enter()에서 post.encoding을 sRGB로 바꾸고 leave()에서 되돌린다.
 *
 * 신학 규칙: 새 형상·광채 인물을 만들지 않는다. 아이들 몸에 빛을 더하지 않는다. 떨기나무의 불은 기존 연출 그대로이고 밝기만 맞춘다.
 *           빛 먼지는 공중에 떠다니는 작은 먼지일 뿐이고, 떨기나무 언덕 둘레에는 띄우지 않는다.
 */
window.BO3D = window.BO3D || {};
(function () {
  'use strict';
  var T = window.THREE;
  if (!T) return;
  var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a += 0x6D2B79F5; var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }

  /* ── 모형에 이름표만 붙인다(겉모습은 그대로). 호렙 장면이 어떤 물체에 어떤 무늬를 입힐지 알기 위해서다 ── */
  (function tagModels() {
    var M = BO3D.models; if (!M) return;
    ['rock', 'shrub', 'acacia', 'bush', 'sheep', 'kid', 'moses', 'timeMachine'].forEach(function (k) {
      var f = M[k]; if (!f || f.gfxTag) return;
      M[k] = function () {
        var o = f.apply(this, arguments), g = o && (o.isObject3D ? o : o.group);
        if (g) g.userData.gfx = k;
        return o;
      };
      M[k].gfxTag = true;
    });
  })();

  /* ── 코드로 그리는 무늬 (이어 붙여도 이음매가 없다) ── */
  function tnoise(seed) {
    var R = rng(seed), tab = new Float32Array(4096), i;
    for (i = 0; i < 4096; i++) tab[i] = R();
    return function (x, y, px, py, salt) {
      var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
      var u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
      var x0 = ((ix % px) + px) % px, x1 = (x0 + 1) % px, y0 = ((iy % py) + py) % py, y1 = (y0 + 1) % py;
      var sx = (salt || 0) * 13, sy = (salt || 0) * 7;
      var a = tab[((y0 + sy) & 63) * 64 + ((x0 + sx) & 63)], b = tab[((y0 + sy) & 63) * 64 + ((x1 + sx) & 63)];
      var c = tab[((y1 + sy) & 63) * 64 + ((x0 + sx) & 63)], d = tab[((y1 + sy) & 63) * 64 + ((x1 + sx) & 63)];
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };
  }
  function fbm(n, u, v, px, py, oct, salt) {
    var s = 0, a = 0.5, t = 0, k, f = 1;
    for (k = 0; k < oct; k++) { s += a * n(u * px * f, v * py * f, px * f, py * f, (salt || 0) + k); t += a; a *= 0.5; f *= 2; }
    return s / t;
  }
  /* fn(u, v, x, y) -> [r, g, b] (0..1). 채널마다 평균을 0.5로 맞춰 무늬가 전체 밝기를 바꾸지 않게 한다(keep: 맞추지 않을 채널) */
  function makeTex(size, fn, keep, aniso) {
    var cv = document.createElement('canvas'); cv.width = cv.height = size;
    var cx = cv.getContext('2d'), im = cx.createImageData(size, size), d = im.data;
    var buf = new Float32Array(size * size * 3), sum = [0, 0, 0], x, y, i = 0, c, p;
    for (y = 0; y < size; y++) for (x = 0; x < size; x++) {
      p = fn(x / size, y / size, x, y);
      buf[i] = p[0]; buf[i + 1] = p[1]; buf[i + 2] = p[2]; sum[0] += p[0]; sum[1] += p[1]; sum[2] += p[2]; i += 3;
    }
    for (c = 0; c < 3; c++) sum[c] = (keep && keep[c]) ? 0 : 0.5 - sum[c] / (size * size);
    for (i = 0, p = 0; i < buf.length; i += 3, p += 4) {
      d[p] = clamp(Math.round((buf[i] + sum[0]) * 255), 0, 255); d[p + 1] = clamp(Math.round((buf[i + 1] + sum[1]) * 255), 0, 255);
      d[p + 2] = clamp(Math.round((buf[i + 2] + sum[2]) * 255), 0, 255); d[p + 3] = 255;
    }
    cx.putImageData(im, 0, 0);
    var t = new T.CanvasTexture(cv);
    t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = aniso || 1;
    return t;
  }
  var TEX = null;
  function textures(maxAniso) {
    if (TEX) return TEX;
    var N = tnoise(9031), R = rng(77123);
    /* 모래: R·G = 바람결의 기울기(빛을 받는 방향을 바꾼다), B = 밝기 무늬(알갱이·결) */
    var S = 512, h = new Float32Array(S * S), al = new Float32Array(S * S), x, y, u, v;
    for (y = 0; y < S; y++) for (x = 0; x < S; x++) {
      u = x / S; v = y / S;
      var warp = fbm(N, u, v, 4, 4, 3, 1);
      var rip = 0.5 + 0.5 * Math.sin(6.28318 * (9 * v + 1.7 * warp + u));
      rip = rip * rip * (3 - 2 * rip);
      var mask = 0.1 + 0.9 * smooth(0.42, 0.66, fbm(N, u, v, 2, 2, 3, 5));
      var grain = fbm(N, u, v, 32, 32, 2, 9), patch = fbm(N, u, v, 8, 8, 3, 3);
      h[y * S + x] = rip * mask + grain * 0.3;
      var spk = R(), dot = spk < 0.012 ? -0.38 : (spk > 0.988 ? 0.3 : 0);   /* 굵은 모래알 */
      al[y * S + x] = 0.5 + (patch - 0.5) * 0.5 + (rip - 0.5) * 0.12 * mask + (grain - 0.5) * 0.6 + (R() - 0.5) * 0.16 + dot;
    }
    var sand = makeTex(S, function (u, v, x, y) {
      var xl = (x + S - 1) % S, xr = (x + 1) % S, yu = (y + S - 1) % S, yd = (y + 1) % S;
      return [0.5 + (h[y * S + xr] - h[y * S + xl]) * 3.6, 0.5 + (h[yd * S + x] - h[yu * S + x]) * 3.6, al[y * S + x]];
    }, [1, 1, 0], Math.min(4, maxAniso || 1));
    /* 바위: R = 옅은 층 + 얼룩(옆면), G = 얼룩 + 금(윗면), B = 층진 결만(산과 언덕의 큰 지층) */
    var rock = makeTex(256, function (u, v) {
      var st = fbm(N, u, v, 2, 10, 3, 11), line = 1 - smooth(0, 0.09, Math.abs(((st * 7) % 1) - 0.5));
      var sp = (fbm(N, u, v, 32, 32, 2, 14) - 0.5) * 0.5 + (R() - 0.5) * 0.14;
      var rd = 1 - Math.abs(2 * fbm(N, u, v, 5, 5, 3, 17) - 1), crack = smooth(0.9, 0.985, rd);
      var blot = (fbm(N, u, v, 4, 4, 2, 21) - 0.5) * 0.4;
      var stv = smooth(0.35, 0.65, st);
      return [0.5 + (stv - 0.5) * 0.3 - line * 0.14 - crack * 0.1 + sp + blot * 0.5, 0.5 - crack * 0.3 + sp * 1.2 + blot, 0.5 + (stv - 0.5) * 0.6 - line * 0.32 + blot * 0.3];
    });
    /* 나무껍질: 세로로 갈라진 골 */
    var bark = makeTex(256, function (u, v) {
      var g = fbm(N, u, v, 14, 2, 3, 25), r = 1 - Math.abs(2 * g - 1), k = 0.5 + (smooth(0.55, 0.95, r) - 0.5) * 0.9 - smooth(0.2, 0.0, r) * 0.25 + (R() - 0.5) * 0.12;
      return [k, k, 0.5];
    });
    /* 양털: 곱슬한 털 뭉치(세포 무늬). 뭉치 가운데는 밝고 사이 골은 어둡다 */
    function cells(n, seed) {
      var Rc = rng(seed), pts = [], i;
      for (i = 0; i < n * n; i++) pts.push([Rc(), Rc(), Rc()]);
      return function (u, v) {
        var cx = Math.floor(u * n), cy = Math.floor(v * n), best = 9, tone = 0, dx, dy, i, j, q, px, py, d;
        for (j = -1; j <= 1; j++) for (i = -1; i <= 1; i++) {
          q = pts[(((cy + j) % n + n) % n) * n + (((cx + i) % n + n) % n)];
          px = (cx + i + 0.15 + q[0] * 0.7) / n - u; py = (cy + j + 0.15 + q[1] * 0.7) / n - v; d = Math.sqrt(px * px + py * py) * n;
          if (d < best) { best = d; tone = q[2]; }
        }
        return [best, tone];
      };
    }
    var wc = cells(9, 4401);
    var wool = makeTex(256, function (u, v) {
      var c = wc(u, v), sw = Math.sin((u + v) * 60 + c[1] * 9 + fbm(N, u, v, 8, 8, 2, 31) * 9) * 0.06;
      var k = 0.66 - smooth(0.25, 0.72, c[0]) * 0.5 + (c[1] - 0.5) * 0.1 + sw * (1 - smooth(0.4, 0.7, c[0]));
      return [k, k, 0.5];
    });
    /* 천: 날실과 씨실이 번갈아 위로 올라오는 짜임 */
    var weave = makeTex(128, function (u, v) {
      var n = 8, a = u * n, b = v * n, ia = Math.floor(a), ib = Math.floor(b), fa = a - ia, fb = b - ib, over = (ia + ib) & 1;
      var t = over ? Math.sin(Math.PI * fa) * (0.7 + 0.3 * Math.sin(Math.PI * fb)) : Math.sin(Math.PI * fb) * (0.7 + 0.3 * Math.sin(Math.PI * fa));
      var k = 0.5 + (t - 0.6) * 0.75 + (over ? 0.05 : -0.05) + (R() - 0.5) * 0.08;
      return [k, k, 0.5];
    });
    /* 잎 무더기: 작은 잎 덩이 */
    var lc = cells(12, 5503);
    var leafy = makeTex(256, function (u, v) {
      var c = lc(u, v), k = 0.62 - smooth(0.2, 0.75, c[0]) * 0.45 + (c[1] - 0.5) * 0.3;
      return [k, k, 0.5];
    });
    TEX = { sand: sand, rock: rock, bark: bark, wool: wool, weave: weave, leafy: leafy };
    return TEX;
  }

  /* ── 재질 셰이더에 끼워 넣는 조각 ── */
  var VARY = 'varying vec3 vGfxP;\nvarying vec3 vGfxN;\n';
  var TRI = [
    'float gfxTri(sampler2D tx, vec3 p, vec3 n, float s) {',
    '  vec3 w = abs(n); w = w * w * w; w /= (w.x + w.y + w.z + 1e-5);',
    '  return texture2D(tx, p.zy * s).r * w.x + texture2D(tx, p.xz * s).g * w.y + texture2D(tx, p.xy * s).r * w.z;',
    '}'].join('\n');
  var OBJ = 'vGfxP = position; vGfxN = normal;';
  var WORLD = 'vGfxP = (modelMatrix * vec4(position, 1.0)).xyz; vGfxN = normalize(mat3(modelMatrix) * normal);';
  /* 바람: 높이 있는 곳일수록 더 흔들린다 */
  function sway(amp, y0, y1) {
    return ['{ vec3 gW = (modelMatrix * vec4(position, 1.0)).xyz;',
      '  float gS = sin(uGfxT * 1.7 + gW.x * 0.9 + gW.z * 0.6) + 0.45 * sin(uGfxT * 3.3 + gW.x * 1.7 - gW.z * 1.1);',
      '  float gH = smoothstep(' + y0.toFixed(2) + ', ' + y1.toFixed(2) + ', position.y) * uGfxWind * ' + amp.toFixed(3) + ';',
      '  transformed.x += gS * gH; transformed.z += cos(uGfxT * 1.3 + gW.z * 0.8) * gH * 0.6; }'].join('\n');
  }
  var KIND = {
    plain: {},
    sky: { noTone: true },
    /* 땅: 윗면은 모래(결·알갱이), 가파른 면은 층진 바위 */
    ground: {
      tex: ['sand', 'rock'], vary: WORLD,
      frag: [
        'vec3 gN = normalize(vGfxN);',
        'float gTop = smoothstep(0.6, 0.86, gN.y);',
        'vec4 gS = texture2D(tGfxA, vGfxP.xz * 0.4);',
        'float gM = texture2D(tGfxA, vGfxP.xz * 0.021 + vec2(0.37, 0.11)).b;',
        'float gDist = length(vViewPosition);',
        'float gFar = smoothstep(90.0, 30.0, gDist);',
        /* 가파른 면: 큰 지층(높이를 따라 쌓인 층)은 멀리서도 보이고, 잔무늬는 가까이에서만 보인다. 무늬가 되풀이되어 보이지 않게 한 방향으로만 입힌다 */
        'float gR = texture2D(tGfxB, vec2((vGfxP.x + vGfxP.z) * 0.013, vGfxP.y * 0.052)).b;',
        'float gD = texture2D(tGfxB, vec2((vGfxP.x + vGfxP.z) * 0.13, vGfxP.y * 0.19)).r;',
        'float gSand = 1.0 + (gS.b - 0.5) * 0.6 * gFar + (gM - 0.5) * 0.36;',
        'float gRock = 1.0 + (gR - 0.5) * 0.6 + (gD - 0.5) * 0.55 * smoothstep(60.0, 14.0, gDist);',
        'diffuseColor.rgb *= mix(gRock, gSand, gTop);'].join('\n'),
      norm: 'normal = normalize(normal + (viewMatrix * vec4(-(gS.r - 0.5), 0.0, (gS.g - 0.5), 0.0)).xyz * (1.15 * gTop * gFar * smoothstep(0.34, 0.6, gM)));'   /* 바람결은 군데군데만 */
    },
    rock: { tex: ['rock'], vary: WORLD, frag: 'diffuseColor.rgb *= 1.0 + (gfxTri(tGfxA, vGfxP, normalize(vGfxN), 0.55) - 0.5) * 0.85;', tri: true },
    bark: { tex: ['bark'], vary: OBJ, frag: 'diffuseColor.rgb *= 1.0 + (gfxTri(tGfxA, vGfxP, normalize(vGfxN), 1.3) - 0.5) * 0.9;', tri: true },
    canopy: { tex: ['leafy'], vary: OBJ, frag: 'diffuseColor.rgb *= 1.0 + (gfxTri(tGfxA, vGfxP, normalize(vGfxN), 0.9) - 0.5) * 0.75;', tri: true, vert: sway(0.05, 1.6, 4.2), time: true },
    leaf: { vert: sway(0.035, 0.05, 0.7), time: true },
    bushleaf: { vert: sway(0.014, 0.3, 1.5), time: true },
    /* 양: 털(밝은 곳)에만 곱슬 무늬. 얼굴과 다리(어두운 곳)는 그대로. 꼬리와 귀는 flock.js가 주는 값으로 움직인다 */
    wool: {
      tex: ['wool'], vary: OBJ, tri: true,
      frag: ['float gK = 1.0;', '#ifdef USE_COLOR', 'gK = smoothstep(0.38, 0.62, dot(vColor.rgb, vec3(0.3, 0.6, 0.1)));', '#endif',
        'diffuseColor.rgb *= 1.0 + (gfxTri(tGfxA, vGfxP, normalize(vGfxN), 2.6) - 0.5) * 0.6 * gK;'].join('\n'),
      attr: 'attribute float aPart;\nattribute vec2 aAnim;\n',
      vert: ['if (aPart > 0.5 && aPart < 1.5) {',
        '  vec3 gPv = vec3(0.0, 0.45, -0.39); vec3 gD = transformed - gPv; float gC = cos(aAnim.x), gSn = sin(aAnim.x);',
        '  transformed = gPv + vec3(gC * gD.x + gSn * gD.z, gD.y, -gSn * gD.x + gC * gD.z);',
        '} else if (aPart > 1.5) {',
        '  float gSg = aPart > 2.5 ? 1.0 : -1.0; vec3 gPv = vec3(gSg * 0.066, 0.085, 0.13); vec3 gD = transformed - gPv;',
        '  float gA = -gSg * aAnim.y, gC = cos(gA), gSn = sin(gA);',
        '  transformed = gPv + vec3(gC * gD.x - gSn * gD.y, gSn * gD.x + gC * gD.y, gD.z);',
        '}'].join('\n')
    },
    /* 천: 옷감의 짜임 */
    cloth: { tex: ['weave'], vary: OBJ, frag: 'diffuseColor.rgb *= 1.0 + (gfxTri(tGfxA, vGfxP, normalize(vGfxN), 5.5) - 0.5) * 0.4;', tri: true },
    /* 아이들: 옷·가방에만 짜임. 살갗(models.js의 SKIN, SKIN_SH, 볼)은 색의 비율로 가려낸다 */
    kid: {
      tex: ['weave'], vary: OBJ, tri: true,
      frag: ['float gK = 1.0;', '#ifdef USE_COLOR',
        'float gRG = vColor.r / max(vColor.g, 1e-3), gGB = vColor.g / max(vColor.b, 1e-3);',
        'if ((abs(gRG - 1.188) < 0.014 && abs(gGB - 1.210) < 0.014) || (abs(gRG - 1.304) < 0.014 && abs(gGB - 1.281) < 0.014) || (abs(gRG - 1.432) < 0.02 && abs(gGB - 1.186) < 0.02)) gK = 0.0;',
        'gK *= smoothstep(0.26, 0.36, dot(vColor.rgb, vec3(0.3, 0.6, 0.1)));',   /* 머리카락처럼 어두운 곳은 거의 그대로 */
        '#endif',
        'diffuseColor.rgb *= 1.0 + (gfxTri(tGfxA, vGfxP, normalize(vGfxN), 11.0) - 0.5) * 0.26 * gK;'].join('\n')
    },
    /* 마른 풀 포기(InstancedMesh). 끝으로 갈수록 더 흔들린다 */
    grass: {
      time: true,
      norm: 'normal = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);',   /* 앞뒤 어느 쪽에서 봐도 땅과 같은 빛을 받는다 */
      vert: ['{ vec3 gW = (modelMatrix * instanceMatrix * vec4(position, 1.0)).xyz;',
        '  float gS = sin(uGfxT * 2.1 + gW.x * 1.3 + gW.z * 0.9) + 0.5 * sin(uGfxT * 4.3 + gW.x * 2.1 - gW.z * 1.7);',
        '  float gH = position.y * position.y * uGfxWind * 1.1;',
        '  transformed.x += gS * gH; transformed.z += cos(uGfxT * 1.6 + gW.z * 1.1) * gH * 0.7; }'].join('\n')
    }
  };
  function inject(sh, kind, U, lit) {
    var K = KIND[kind] || KIND.plain, tex = textures(U.aniso), fd = '', vd = '';
    if (K.vary) { vd += VARY; fd += VARY; }
    if (K.attr) vd += K.attr;
    if (K.time) { vd += 'uniform float uGfxT;\nuniform float uGfxWind;\n'; sh.uniforms.uGfxT = U.time; sh.uniforms.uGfxWind = U.wind; }
    if (K.tex) {
      fd += 'uniform sampler2D tGfxA;\n'; sh.uniforms.tGfxA = { value: tex[K.tex[0]] };
      if (K.tex[1]) { fd += 'uniform sampler2D tGfxB;\n'; sh.uniforms.tGfxB = { value: tex[K.tex[1]] }; }
    }
    if (K.tri) fd += TRI + '\n';
    if (vd) sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + vd);
    if (K.vary || K.vert) sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + (K.vary || '') + '\n' + (K.vert || ''));
    var f = sh.fragmentShader;
    /* 지금까지 화면에 보이던 색(재질 색 x 꼭짓점 색)을 선형으로 바꿔 조명을 계산한다 */
    /* sRGB → 선형은 pow 대신 값이 거의 같은 다항식으로 계산한다(화소마다 하는 일이라 가볍게) */
    var conv = (K.frag ? K.frag + '\n' : '') + '{ vec3 gC = max(diffuseColor.rgb, vec3(0.0)); diffuseColor.rgb = gC * (gC * (gC * 0.305306011 + 0.682171111) + 0.012522878); }';
    /* 색 보정(ACES)은 밝은 색의 물을 조금 뺀다. 빛을 받는 재질은 바탕색을 그만큼 진하게 해서 원래 색감을 지킨다 */
    if (lit) { conv += '\ndiffuseColor.rgb = max(mix(vec3(dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722))), diffuseColor.rgb, uGfxSat), vec3(0.0));'; fd += 'uniform float uGfxSat;\n'; sh.uniforms.uGfxSat = U.sat; }
    if (f.indexOf('#include <color_fragment>') >= 0) f = f.replace('#include <color_fragment>', '#include <color_fragment>\n' + conv);
    else if (f.indexOf('#include <map_fragment>') >= 0) f = f.replace('#include <map_fragment>', '#include <map_fragment>\n' + conv);
    if (fd) f = f.replace('#include <common>', '#include <common>\n' + fd);
    f = f.replace('vec3 totalEmissiveRadiance = emissive;', 'vec3 totalEmissiveRadiance = emissive * (emissive * (emissive * 0.305306011 + 0.682171111) + 0.012522878);');
    if (K.norm) f = f.replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + K.norm);
    sh.fragmentShader = f;
  }

  /* ── 호렙 장면 하나의 그래픽 ──
   * o: { scene, env: { sun, hemi }, W: BO3D.world, FX } */
  function horeb(o) {
    var scene = o.scene, sun = o.env.sun, hemi = o.env.hemi, W = o.W, P = W.P, FX = o.FX || BO3D.fx || null;
    var SOFT = FX ? FX.SOFT : 2;
    var U = { time: { value: 0 }, wind: { value: REDUCED ? 0.25 : 1 }, sat: { value: 1.22 }, aniso: 1 };
    var clones = {}, pairs = [], own = [];

    function patched(mat, kind) {
      var key = mat.uuid + ':' + kind, c = clones[key];
      if (c) return c;
      c = mat.clone();
      var lit = !!mat.isMeshStandardMaterial;
      c.onBeforeCompile = function (sh) { inject(sh, kind, U, lit); };
      c.customProgramCacheKey = function () { return 'gfxHoreb:' + kind + (lit ? ':lit' : ''); };
      if (KIND[kind] && KIND[kind].noTone) c.toneMapped = false;
      clones[key] = c;
      pairs.push({ a: mat, b: c, op: mat.opacity, ei: mat.emissiveIntensity, vis: mat.visible });
      return c;
    }
    function kindOf(obj, tag, mat) {
      if (tag === 'ground') return 'ground';
      if (tag === 'sky') return 'sky';
      if (!mat.isMeshStandardMaterial || mat.transparent) return 'plain';
      if (tag === 'rock') return 'rock';
      if (tag === 'shrub') return mat.side === T.DoubleSide ? 'leaf' : 'plain';
      if (tag === 'acacia') return obj.parent && obj.parent.children.indexOf(obj) === 0 ? 'bark' : 'canopy';
      if (tag === 'bush') return mat.side === T.DoubleSide ? 'bushleaf' : 'plain';
      if (tag === 'sheep') return 'wool';
      if (tag === 'kid') return 'kid';
      if (tag === 'moses') return mat.side === T.DoubleSide ? 'cloth' : 'plain';
      return 'plain';
    }
    function fix(obj, tag) {
      var m = obj.material, i;
      if (!m) return;
      function one(mm) { return (!mm || mm.isShaderMaterial || mm.gfxOwn) ? mm : patched(mm, kindOf(obj, tag, mm)); }
      if (Array.isArray(m)) { for (i = 0; i < m.length; i++) m[i] = one(m[i]); } else obj.material = one(m);
      if (tag === 'rock' && obj.isMesh) obj.receiveShadow = true;   /* 바위에도 그림자가 드리운다 */
    }
    /* 장면에 새로 들어온 물체(아이들, 바뀐 모세, 날아간 양털 등)에도 같은 처리를 한다. 매 화면 한 번 훑는다 */
    function walk(obj, tag) {
      var ud = obj.userData; if (ud.gfx) tag = ud.gfx;
      if (!ud.gfxDone) { ud.gfxDone = true; if (obj.isLight) light(obj); else fix(obj, tag); }
      var ch = obj.children, i;
      for (i = 0; i < ch.length; i++) walk(ch[i], tag);
    }
    function scan() { walk(scene, null); }

    /* ── 빛: 해는 따뜻하게 세게, 그늘은 하늘빛으로 푸르게 ── */
    function light(l) {
      if (l === sun || l === hemi) return;
      /* 떨기나무의 불빛 등: 지금 보이던 색을 선형으로 바꾸고, 새 밝기 기준에 맞춰 조금 세게 */
      l.color.convertSRGBToLinear().multiplyScalar(2.4);
    }
    sun.color.setRGB(1.0, 0.82, 0.6); sun.intensity = 2.5;
    hemi.color.setRGB(0.6, 0.74, 0.98); hemi.groundColor.setRGB(0.78, 0.5, 0.29); hemi.intensity = 0.58;
    /* 그림자: 1024 → 1536(1.5배 촘촘). 2048은 이 컴퓨터에서 초당 장면 수가 더 떨어져 쓰지 않았다(잰 값은 docs/20). 해가 아이를 따라 움직여도 그림자 가장자리가 떨리지 않게 격자에 맞춘다 */
    var SHADOW = o.shadow || (/gfxshadow=(\d+)/.test(location.hash) ? Number(/gfxshadow=(\d+)/.exec(location.hash)[1]) : 1536), BOX = 22;   /* 주소 끝 #gfxshadow=1024 는 비교 측정용 */
    sun.shadow.mapSize.set(SHADOW, SHADOW);
    var sc = sun.shadow.camera; sc.left = -BOX; sc.right = BOX; sc.top = BOX; sc.bottom = -BOX; sc.updateProjectionMatrix();
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.035;
    if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
    var vr = new T.Vector3(), vu = new T.Vector3(), vd = new T.Vector3(), UP = new T.Vector3(0, 1, 0);
    function snapShadow() {
      var tp = sun.target.position, sp = sun.position, tx = (BOX * 2) / SHADOW;
      vd.subVectors(sp, tp).normalize(); vr.crossVectors(UP, vd).normalize(); vu.crossVectors(vd, vr);
      var a = tp.dot(vr), b = tp.dot(vu), da = a - Math.round(a / tx) * tx, db = b - Math.round(b / tx) * tx;
      tp.addScaledVector(vr, -da).addScaledVector(vu, -db); sp.addScaledVector(vr, -da).addScaledVector(vu, -db);
    }

    /* ── 마른 풀 포기와 잔돌 (각각 그리기 1번) ── */
    var R = rng(60309), H = W.height;
    function near(x, z, p, r) { var dx = x - p[0], dz = z - p[1]; return dx * dx + dz * dz < r * r; }
    function ownMat(m, kind) {
      m.onBeforeCompile = function (sh) { inject(sh, kind, U, true); };
      m.customProgramCacheKey = function () { return 'gfxHoreb:' + kind + ':lit'; };
      m.gfxOwn = true; return m;
    }
    function addOwn(obj) { obj.userData.gfxDone = true; obj.layers.set(SOFT); scene.add(obj); own.push(obj); return obj; }
    (function grass() {
      var pos = [], nor = [], col = [], b, k;
      for (b = 0; b < 9; b++) {
        var a = b * 0.6981 + R() * 0.5, ca = Math.cos(a), sa = Math.sin(a), h = 0.11 + R() * 0.13, w = 0.01 + R() * 0.008, lean = 0.04 + R() * 0.09, r0 = R() * 0.035;
        var bx = ca * r0, bz = sa * r0, px = -sa * w, pz = ca * w;
        var v = [[bx - px, 0, bz - pz], [bx + px, 0, bz + pz], [bx + ca * lean * 0.45 - px * 0.6, h * 0.55, bz + sa * lean * 0.45 - pz * 0.6], [bx + ca * lean * 0.45 + px * 0.6, h * 0.55, bz + sa * lean * 0.45 + pz * 0.6], [bx + ca * lean, h, bz + sa * lean]];
        [[0, 1, 2], [1, 3, 2], [2, 3, 4]].forEach(function (t) {
          for (k = 0; k < 3; k++) { var q = v[t[k]], s = 0.74 + 0.34 * (q[1] / h); pos.push(q[0], q[1], q[2]); nor.push(0, 1, 0); col.push(s, s, s); }
        });
      }
      var g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
      var spots = [], tries = 0, x, z, want = REDUCED ? 500 : 900;
      while (spots.length < want && tries++ < 9000) {
        /* 양 떼가 풀을 뜯는 두 곳 둘레는 촘촘하게, 나머지 들판은 듬성듬성 */
        var pick = R();
        if (pick < 0.3) { var aa = R() * 6.283, rr = Math.sqrt(R()) * 11; x = P.flock[0] + Math.cos(aa) * rr; z = P.flock[1] + Math.sin(aa) * rr; }
        else if (pick < 0.48) { var ab = R() * 6.283, rb = Math.sqrt(R()) * 9; x = P.flockGraze[0] + Math.cos(ab) * rb; z = P.flockGraze[1] + Math.sin(ab) * rb; }
        else { x = (R() * 2 - 1) * 58; z = 8 + (R() * 2 - 1) * 58; if (fbm(TN, x * 0.01 + 3, z * 0.01 + 3, 8, 8, 2, 40) < 0.5) continue; }
        if (!W.walkable(x, z) || W.hill(x, z) > 0.25 || near(x, z, P.start, 2.2) || near(x, z, P.machine, 3.2) || near(x, z, P.lookSpot, 2)) continue;
        spots.push([x, z]);
      }
      var im = new T.InstancedMesh(g, ownMat(new T.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, side: T.DoubleSide }), 'grass'), spots.length);
      var m4 = new T.Matrix4(), q4 = new T.Quaternion(), e = new T.Euler(), s3 = new T.Vector3(), p3 = new T.Vector3(), c = new T.Color();
      var tones = ['#B8A860', '#A9A055', '#C4B26A', '#9CA05A', '#B2A45E', '#8F9A52'];
      spots.forEach(function (sp, i) {
        e.set(0, R() * 6.283, 0); q4.setFromEuler(e); var s = 0.8 + R() * 0.7; s3.set(s, s * (0.8 + R() * 0.5), s); p3.set(sp[0], H(sp[0], sp[1]) - 0.01, sp[1]);
        im.setMatrixAt(i, m4.compose(p3, q4, s3)); im.setColorAt(i, c.set(tones[Math.floor(R() * tones.length)]).multiplyScalar(0.9 + R() * 0.14));
      });
      im.receiveShadow = true; im.frustumCulled = false;
      addOwn(im);
    })();
    (function pebbles() {
      var g = new T.IcosahedronGeometry(1, 0), n = 260, i, x, z, k = 0;
      var im = new T.InstancedMesh(g, ownMat(new T.MeshStandardMaterial({ roughness: 1, metalness: 0, flatShading: true }), 'plain'), n);
      var m4 = new T.Matrix4(), q4 = new T.Quaternion(), e = new T.Euler(), s3 = new T.Vector3(), p3 = new T.Vector3(), c = new T.Color();
      var tones = ['#A9805C', '#8E6A4C', '#B89470', '#9A7458', '#C2A07A'];
      for (i = 0; i < 4000 && k < n; i++) {
        x = (R() * 2 - 1) * 46; z = 12 + (R() * 2 - 1) * 46;
        if (!W.walkable(x, z) || near(x, z, P.start, 1.5)) continue;
        var s = 0.02 + Math.pow(R(), 2.4) * 0.07;
        e.set(R() * 3, R() * 6.283, R() * 3); q4.setFromEuler(e); s3.set(s * (1 + R() * 0.6), s * 0.6, s); p3.set(x, H(x, z) + s * 0.15, z);
        im.setMatrixAt(k, m4.compose(p3, q4, s3)); im.setColorAt(k, c.set(tones[Math.floor(R() * tones.length)])); k++;
      }
      im.count = k; im.receiveShadow = true; im.frustumCulled = false;
      addOwn(im);
    })();

    /* ── 떠다니는 빛 먼지: 카메라 둘레의 상자 안을 천천히 떠다닌다(그리기 1번). 줄인 움직임 설정이면 띄우지 않는다 ── */
    var motes = null;
    if (!REDUCED) (function () {
      var n = 90, seed = new Float32Array(n * 4), pos = new Float32Array(n * 3), i;
      for (i = 0; i < n * 4; i++) seed[i] = R();
      var g = new T.BufferGeometry();
      g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new T.BufferAttribute(seed, 4));
      g.boundingSphere = new T.Sphere(new T.Vector3(), 1e5);
      var m = new T.ShaderMaterial({
        uniforms: { uT: U.time, uCam: { value: new T.Vector3() }, uScale: { value: 800 }, uHoly: { value: new T.Vector3(P.bush[0], 0, P.bush[1]) } },
        vertexShader: ['attribute vec4 aSeed; uniform float uT; uniform vec3 uCam; uniform float uScale; uniform vec3 uHoly; varying float vA;',
          'void main(){',
          '  vec3 box = vec3(16.0, 4.5, 16.0);',
          '  vec3 p = aSeed.xyz * box + vec3(uT * 0.16 + sin(uT * 0.21 + aSeed.w * 30.0) * 0.7, uT * 0.03 + sin(uT * 0.33 + aSeed.w * 17.0) * 0.5, cos(uT * 0.19 + aSeed.w * 11.0) * 0.7);',
          '  vec3 q = mod(p - uCam, box) - box * 0.5;',
          '  vec3 e = abs(q) / (box * 0.5);',
          '  p = q + uCam - vec3(0.0, 1.2, 0.0);',
          '  vec4 mv = viewMatrix * vec4(p, 1.0);',
          '  float tw = 0.55 + 0.45 * sin(uT * (0.7 + aSeed.w) + aSeed.w * 40.0);',
          '  vA = tw * (1.0 - smoothstep(0.7, 1.0, max(e.x, max(e.y, e.z)))) * smoothstep(1.2, 3.0, -mv.z) * smoothstep(9.0, 15.0, distance(p.xz, uHoly.xz));',
          '  gl_PointSize = clamp(uScale * (0.012 + 0.014 * aSeed.w) / -mv.z, 1.0, 7.0);',
          '  gl_Position = projectionMatrix * mv;',
          '}'].join('\n'),
        fragmentShader: ['precision highp float; varying float vA;',
          'void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.1, d) * vA * 0.4;',
          '  gl_FragColor = vec4(vec3(1.0, 0.95, 0.8) * a, a); }'].join('\n'),
        transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false
      });
      motes = new T.Points(g, m); motes.frustumCulled = false; motes.renderOrder = 30;
      addOwn(motes);
    })();

    /* ── 발밑 먼지: 걷는 아이·모세·양의 발에서 모래 먼지가 작게 일어난다(그리기 1번) ── */
    var dust = null;
    if (!REDUCED) (function () {
      var n = 56, pos = new Float32Array(n * 3), life = new Float32Array(n * 2), p = [], i, head = 0;
      for (i = 0; i < n; i++) { p.push({ t: 1, d: 1, vx: 0, vy: 0, vz: 0, s: 0 }); pos[i * 3 + 1] = -99; life[i * 2] = 1; }
      var g = new T.BufferGeometry();
      g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aLife', new T.BufferAttribute(life, 2));
      g.boundingSphere = new T.Sphere(new T.Vector3(), 1e5);
      var m = new T.ShaderMaterial({
        uniforms: { uScale: { value: 800 } },
        vertexShader: ['attribute vec2 aLife; uniform float uScale; varying float vA;',
          'void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0);',
          '  vA = smoothstep(0.0, 0.12, aLife.x) * pow(1.0 - aLife.x, 1.6);',
          '  gl_PointSize = min(uScale * aLife.y * (0.45 + aLife.x) / -mv.z, 120.0);',
          '  gl_Position = projectionMatrix * mv; }'].join('\n'),
        fragmentShader: ['precision highp float; varying float vA;',
          'void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d); a = a * a * vA * 0.42;',
          '  gl_FragColor = vec4(vec3(0.93, 0.8, 0.6) * a, a); }'].join('\n'),
        transparent: true, depthWrite: false, blending: T.CustomBlending, blendSrc: T.OneFactor, blendDst: T.OneMinusSrcAlphaFactor, premultipliedAlpha: true, fog: false
      });
      var pts = new T.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 3;
      addOwn(pts);
      dust = {
        mat: m,
        puff: function (x, y, z, size) {
          var q = p[head], k = head; head = (head + 1) % n;
          q.t = 0; q.d = 0.7 + R() * 0.5; q.vx = (R() - 0.5) * 0.5; q.vz = (R() - 0.5) * 0.5; q.vy = 0.25 + R() * 0.3;
          pos[k * 3] = x + (R() - 0.5) * 0.2; pos[k * 3 + 1] = y + 0.05; pos[k * 3 + 2] = z + (R() - 0.5) * 0.2; life[k * 2] = 0; life[k * 2 + 1] = size * (0.8 + R() * 0.5);
        },
        step: function (dt) {
          for (var k = 0; k < n; k++) {
            var q = p[k]; if (q.t >= 1) continue;
            q.t = Math.min(1, q.t + dt / q.d); q.vy *= 1 - dt * 1.5;
            pos[k * 3] += q.vx * dt; pos[k * 3 + 1] += q.vy * dt; pos[k * 3 + 2] += q.vz * dt; life[k * 2] = q.t;
            if (q.t >= 1) pos[k * 3 + 1] = -99;
          }
          g.attributes.position.needsUpdate = true; g.attributes.aLife.needsUpdate = true;
        }
      };
    })();
    var walkers = {}, flockT = 0;
    function feet(id, pos, dt, every, size) {
      var w = walkers[id] || (walkers[id] = { x: pos.x, z: pos.z, t: 0 });
      var dx = pos.x - w.x, dz = pos.z - w.z, sp = Math.sqrt(dx * dx + dz * dz) / Math.max(dt, 0.001);
      w.x = pos.x; w.z = pos.z;
      if (sp < 1.2 || sp > 12) { w.t = 0; return; }
      w.t += dt; if (w.t >= every) { w.t = 0; dust.puff(pos.x - dx * 2, pos.y, pos.z - dz * 2, size); }
    }

    /* ── game.js가 부르는 것 ── */
    var saved = null, rdr = null;
    function enter(renderer, post) {
      rdr = renderer;
      saved = { tm: renderer.toneMapping, ex: renderer.toneMappingExposure, oe: renderer.outputEncoding, pe: post ? post.encoding : null, ps: post ? post.strength : null };
      U.aniso = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1;
      renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = EXPOSURE; renderer.outputEncoding = T.sRGBEncoding;
      if (post) { post.encoding = T.sRGBEncoding; post.strength = 0.66; }
      scan();
    }
    function leave(renderer, post) {
      if (!saved) return;
      renderer.toneMapping = saved.tm; renderer.toneMappingExposure = saved.ex; renderer.outputEncoding = saved.oe;
      if (post) { post.encoding = saved.pe; post.strength = saved.ps; }
      saved = null;
    }
    /* ctx: { kids: { choeon, hyu, onwoo }, moses: Vector3, mosesWalking, flock } */
    function update(dt, now, ctx) {
      U.time.value = now;
      scan();
      for (var i = 0; i < pairs.length; i++) {   /* 게임이 원래 재질의 값을 바꾸면(타임머신 등불 등) 복제한 재질도 따라간다 */
        var pr = pairs[i], a = pr.a, b = pr.b;
        if (a.opacity !== pr.op) { pr.op = b.opacity = a.opacity; }
        if (a.emissiveIntensity !== pr.ei) { pr.ei = b.emissiveIntensity = a.emissiveIntensity; }
        if (a.visible !== pr.vis) { pr.vis = b.visible = a.visible; }
      }
      if (dust && ctx) {
        var k;
        if (ctx.kids) for (k in ctx.kids) if (ctx.kids[k] && ctx.kids[k].group && ctx.kids[k].group.visible) feet(k, ctx.kids[k].group.position, dt, 0.2, 0.34);
        if (ctx.moses) feet('moses', ctx.moses, dt, 0.3, 0.36);
        if (ctx.flock && ctx.flock.walkers) {
          flockT += dt;
          if (flockT > 0.09) { flockT = 0; var s = ctx.flock.walkers(R()); if (s) dust.puff(s.x, s.y, s.z, 0.3); }
        }
        dust.step(dt);
      }
    }
    function render(camera, renderer) {
      snapShadow();
      var hpx = renderer.domElement.height;
      if (motes) { motes.material.uniforms.uCam.value.copy(camera.position); motes.material.uniforms.uScale.value = hpx; }
      if (dust) dust.mat.uniforms.uScale.value = hpx;
    }
    /* 맞춤용(시험 스크립트가 값을 바꿔 가며 찍는다) */
    function tune(t) {
      if (t.sun !== undefined) sun.intensity = t.sun; if (t.sunC) sun.color.setRGB(t.sunC[0], t.sunC[1], t.sunC[2]);
      if (t.hemi !== undefined) hemi.intensity = t.hemi; if (t.skyC) hemi.color.setRGB(t.skyC[0], t.skyC[1], t.skyC[2]); if (t.groundC) hemi.groundColor.setRGB(t.groundC[0], t.groundC[1], t.groundC[2]);
      if (t.sat !== undefined) U.sat.value = t.sat;
      if (t.exposure !== undefined) { EXPOSURE = t.exposure; if (rdr) rdr.toneMappingExposure = EXPOSURE; }
    }
    return { enter: enter, leave: leave, update: update, render: render, tune: tune,
      debug: function () { return { on: !!saved, clones: Object.keys(clones).length, own: own.length, reduced: REDUCED, shadow: SHADOW }; } };
  }
  var TN = tnoise(1207), EXPOSURE = 0.64;

  BO3D.gfx = { horeb: horeb, textures: textures, REDUCED: REDUCED };
})();
