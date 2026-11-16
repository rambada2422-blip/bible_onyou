/* 3D 장면 설정: OT-12 시내 산에서 주신 열 가지 말씀 (출 19:1-20:21). 시내 광야, 시내 산 앞. (자동 작업 3d-a. 장면표의 3D 12장면 밖의 추가 제안)
 * 간접 연출(규칙서 13.8, 감수 전): 우레는 낮은 울림 소리, 번개는 하늘과 구름이 번쩍이는 빛, 온 산의 진동은 땅울림 소리와 화면 흔들림으로만. 움직임 줄이기 설정이면 흔들지 않고 번쩍임도 약하게 한다.
 *   하나님의 음성(19:19, 20:1)과 나팔 소리(19:16, 19:19)는 소리로 만들지 않는다. 말씀하시는 대목(20:1-17)에는 우레·땅울림 소리도 내지 않는다(음성처럼 들리지 않게).
 * 방향: 산이 -Z 쪽(화면 앞쪽 멀리). 장막들은 서쪽과 남쪽, 백성은 가운데. 아이들은 진의 동쪽 가장자리(+X)에서만 다닌다(산 둘레의 경계에서 먼 곳).
 * 본문에 맞춘 점 (content/ot/OT-12.json design3d)
 *  - 이스라엘은 광야에, 산 앞에 장막을 쳤다(19:2).
 *  - 모세가 와서 백성의 장로들을 불러 말씀을 전한다(19:7). 모세가 산으로 올라가는 모습(19:3, 19:20)은 만들지 않는다(글로만).
 *  - 산 둘레의 경계(19:12, 19:23)는 그 말씀이 나오는 대목부터 보인다.
 *  - 셋째 날 아침, 산 위에 우레와 번개와 빽빽한 구름이 있다(19:16). 모세가 백성을 이끌고 진에서 나오고 백성은 산기슭에 선다(19:17. 경계 바깥).
 *    연기가 가마 연기처럼 오르고 온 산이 크게 진동한다(19:18). 불(19:18)은 구름과 연기 속에서 비치는 붉은 빛으로만. 모양은 둥근 덩이뿐이다.
 *  - 말씀하시는 동안(20:1-17) 백성은 산기슭에 서 있다. 말씀은 글로만.
 *  - 백성이 떨며 멀리 선다(20:18, 20:21). 모세는 백성에게 말한 뒤(20:20) 짙은 어둠 쪽으로 가까이 간다(20:21). 연기 속으로 들어가면 보이지 않는다(안쪽은 보여 주지 않는다).
 *  - 산 위에는 구름·연기·불빛뿐이다. 산꼭대기의 모세, 돌판, 나팔과 부는 이, 천사, 경계를 넘는 사람은 없다.
 * 감수가 필요한 설정: 경계의 생김새(낮은 말뚝)와 산에서 떨어진 거리, 산의 높이와 모양, 진과 장막의 자리, 사람 수(일부만 그림), 장로의 수(일곱 사람만 그림), 모세의 생김새와 선 자리,
 *   구름·연기·불빛의 빛깔과 크기, 번개를 빛으로만 그린 것, 말씀하시는 대목에 소리를 내지 않은 것, 백성이 물러선 거리, 모세가 연기 속으로 들어가 보이지 않게 한 것, 빤 옷(19:14)을 그리지 않은 것.
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  BO3D.scene3d = BO3D.scene3d || {};
  BO3D.scene3d['OT-12'] = function (api) {
    var T = THREE, M2 = BO3D.models2 || {}, MO = BO3D.models || {}, PR = BO3D.props, PA = BO3D.props3da || {}, FX = api.FX, R = PR.rng(1219);
    var calm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    function sm(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
    function hash(ix, iz) { var n = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453; return n - Math.floor(n); }
    function noise(x, z) {
      var ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
      var a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
    /* 자리: 산꼭대기, 산의 반지름·높이, 경계의 반지름, 산기슭에 선 자리(앞줄 가운데), 멀리 물러선 자리, 진 앞의 모세, 진의 가운데 */
    var PEAK = [-8, -190], MR = 125, MH = 64, BR = 133, FOOT = [12, -50], FAR = [12, -27], MOS = [12, -4], CAMP = [-22, 46], CAMP_R = 38;
    function height(x, z) {
      var h = 0.5 * noise(x * 0.05 + 2, z * 0.05 + 5) + 0.25 * Math.sin(x * 0.04) * Math.cos(z * 0.035);
      var m = sm(MR, 0, Math.hypot(x - PEAK[0], z - PEAK[1]));
      h += MH * Math.pow(m, 1.15) * (0.86 + 0.28 * noise(x * 0.035 + 9, z * 0.035 + 3));
      h += sm(0, 0.35, m) * ((noise(x * 0.1 + 1, z * 0.1 + 7) - 0.5) * 9 + (noise(x * 0.23, z * 0.23 + 4) - 0.5) * 3.5);     /* 바위산의 울퉁불퉁함 */
      h += sm(170, 290, Math.hypot(x, z - 20)) * 9 * noise(x * 0.02, z * 0.02 + 3);
      return h;
    }
    function walkable(x, z) { return x >= 24 && x <= 60 && z >= -12 && z <= 40; }

    var scene = new T.Scene();
    scene.background = new T.Color('#F1DCB2'); scene.fog = new T.Fog('#EED8AE', 90, 440);
    var skyG = new T.SphereGeometry(600, 24, 14), sp = skyG.attributes.position, sc = new Float32Array(sp.count * 3), cc = new T.Color(), top = new T.Color('#6FA6CC'), hor = new T.Color('#F6E3BC'), i;
    for (i = 0; i < sp.count; i++) { var tt = Math.max(0, sp.getY(i) / 600); cc.copy(hor).lerp(top, sm(0.02, 0.7, tt)); sc[i * 3] = cc.r; sc[i * 3 + 1] = cc.g; sc[i * 3 + 2] = cc.b; }
    skyG.setAttribute('color', new T.BufferAttribute(sc, 3));
    var skyM = new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false }); scene.add(new T.Mesh(skyG, skyM));
    var g = new T.PlaneGeometry(640, 640, 180, 180); g.rotateX(-Math.PI / 2); g.translate(0, 0, -40);
    var pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new T.Color(), s1 = new T.Color('#E2BC7C'), s2 = new T.Color('#D3AA6C'), rk1 = new T.Color('#A07A62'), rk2 = new T.Color('#7C5E50');
    for (i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i), y = height(x, z); pos.setY(i, y);
      c.copy(s1).lerp(s2, noise(x * 0.08, z * 0.08));
      if (y > 2.5) { c.lerp(rk1, sm(2.5, 12, y)); c.lerp(rk2, sm(10, 50, y) * (0.35 + 0.65 * noise(x * 0.09, z * 0.09))); }      /* 산의 바위 빛 */
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3)); g.computeVertexNormals();
    var ground = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 })); ground.receiveShadow = true; scene.add(ground);
    var hemi = new T.HemisphereLight('#D9EEF2', '#B98A55', 0.62); scene.add(hemi);
    var sun = new T.DirectionalLight('#FFE9C4', 0.72); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    var ss = sun.shadow.camera; ss.left = -26; ss.right = 26; ss.top = 26; ss.bottom = -26; ss.near = 1; ss.far = 150; sun.shadow.bias = -0.0015;
    scene.add(sun); scene.add(sun.target);
    function put(o, x, z, lift) { o.position.set(x, height(x, z) + (lift || 0), z); scene.add(o); return o; }
    function near(x, z, p, r) { return Math.hypot(x - p[0], z - p[1]) < r; }
    function open(x, z) { return x > -26 && x < 64 && z > -70 && z < 24; }     /* 백성이 서고 지나는 곳, 아이들이 다니는 곳은 비워 둔다 */
    var statics = [];
    if (MO.rock) for (i = 0; i < 46; i++) { var ro = MO.rock(1200 + i); ro.scale.multiplyScalar(0.5 + R() * 1.5); var rx = -150 + R() * 300, rz = -150 + R() * 220; if (near(rx, rz, CAMP, CAMP_R + 6) || open(rx, rz) || (rx > 20 && rz > 20 && rz < 44)) continue; put(ro, rx, rz, -0.1); }
    if (MO.shrub) for (i = 0; i < 20; i++) { var sh = MO.shrub(120 + i), hx = -140 + R() * 280, hz = -60 + R() * 150; if (near(hx, hz, CAMP, CAMP_R + 6) || open(hx, hz) || (hx > 20 && hz > 20 && hz < 44)) continue; put(sh, hx, hz, -0.05); }
    /* 산 앞에 친 진의 장막들(19:2). 장막의 천 재질은 다섯 가지를 함께 쓴다(그리기 호출을 줄인다) */
    var tentMat = {};
    for (i = 0; i < 70; i++) {
      var a = R() * 6.28, rr = Math.sqrt(R()) * CAMP_R, tx = CAMP[0] + Math.cos(a) * rr, tz = CAMP[1] + Math.sin(a) * rr;
      if (tx > 19 || (tx > -26 && tz < 25)) continue;
      var tn = PR.tent(i + 120), cl = tn.children[0], key = '#' + cl.material.color.getHexString(); if (!tentMat[key]) tentMat[key] = cl.material; cl.material = tentMat[key];
      tn.position.set(tx, height(tx, tz), tz); tn.rotation.y = R() * 6.28; statics.push(tn);
    }
    scene.add(PR.mergeStatic(statics));
    /* 산 둘레의 경계(19:12, 19:23): 낮은 말뚝을 띄엄띄엄. 그 말씀이 나오는 대목부터 보인다 */
    var stakeList = [];
    for (i = -31; i <= 31; i++) { var sa = i * 0.04, sx = PEAK[0] + Math.sin(sa) * BR, sz = PEAK[1] + Math.cos(sa) * BR, stq = PA.stake ? PA.stake() : new T.Group(); stq.position.set(sx, height(sx, sz), sz); stakeList.push(stq); }
    var stakes = PR.mergeStatic(stakeList); stakes.visible = false; scene.add(stakes);

    /* 산 위의 빽빽한 구름(19:16), 산에 자욱한 연기와 가마 연기처럼 오르는 연기(19:18): 둥근 덩이를 한 번에 그린다. 그림자 없음 */
    var TOPY = height(PEAK[0], PEAK[1]), NC = 76, NB = 44, NS = 30, puff = PA.puffs ? PA.puffs(NC + NB + NS, { seg: 14 }) : null, pd = [];
    for (i = 0; i < NC; i++) {   /* 산 위쪽을 덮은 구름: 산비탈 바로 위에 얹혀 서로 겹친 덩이들 */
      var ca0 = i * 2.39996, cr0 = Math.sqrt((i + 0.5) / NC) * 54, cx0 = PEAK[0] + Math.cos(ca0) * cr0, cz0 = PEAK[1] + Math.sin(ca0) * cr0 * 0.9;
      pd.push({ x: cx0, y: height(cx0, cz0) + 4 + R() * 7, z: cz0, r: 10.5 + R() * 5 - cr0 * 0.05, fy: 0.7, ph: R() * 6.28, col: cr0 < 20 ? '#B08878' : ['#9A9CA8', '#A6A8B2', '#8C8E9C'][i % 3] });
    }
    for (i = 0; i < NB; i++) {   /* 산에 자욱한 연기: 산비탈 아래쪽에 두 줄로 이어진 낮은 덩이들 */
      var row = i % 2, ba = -1.25 + (Math.floor(i / 2) / (NB / 2 - 1)) * 2.5 + (R() - 0.5) * 0.06, bd = (row ? 92 : 72) + (R() - 0.5) * 8, bx = PEAK[0] + Math.sin(ba) * bd, bz = PEAK[1] + Math.cos(ba) * bd;
      pd.push({ x: bx, y: height(bx, bz) + 1.5 + R() * 2, z: bz, r: 7.5 + R() * 3, fy: 0.5, ph: R() * 6.28, col: i % 3 ? '#96949A' : '#88868E' });
    }
    if (puff) scene.add(puff.mesh);
    /* 불(19:18): 구름과 연기 속에서 비치는 붉은 빛으로만. 모양 없는 둥근 덩이 몇 개가 구름에 묻혀 있다 */
    var NE = 5, ember = PA.puffs ? PA.puffs(NE, { basic: true, fog: false, color: '#FF8A3A', seg: 10 }) : null, ed = [];
    for (i = 0; i < NE; i++) { var ea = i / NE * 6.28 + 0.6, er = i ? 7 + R() * 8 : 0, ex = PEAK[0] + Math.cos(ea) * er, ez = PEAK[1] + Math.sin(ea) * er * 0.7; ed.push({ x: ex, y: height(ex, ez) + 5 + R() * 4, z: ez, r: 5 + R() * 2, ph: R() * 6.28 }); }
    if (ember) { if (FX) ember.mesh.layers.set(FX.GLOW); scene.add(ember.mesh); }
    var glow = new T.PointLight('#FF8A40', 0, 110, 1.4); glow.position.set(PEAK[0], TOPY + 16, PEAK[1] + 14); scene.add(glow);     /* 구름과 연기에 비치는 불빛 */

    /* 백성(19:2, 19:8): 진 앞 → 산기슭(19:17) → 멀리(20:18). 마흔네 사람만 그린다 */
    var crowd = [], COLS = 11;
    function person(seed, opt) { var o = null; try { if (M2.israelite) o = M2.israelite(seed, opt); } catch (e) { o = null; } return o || PR.soldier(seed, '#7A6A4A', null); }
    for (i = 0; i < 44; i++) {
      var o = person(i * 13 + 7), cn = i % COLS, rw = Math.floor(i / COLS), jx = (hash(i, 3) - 0.5) * 1.1, jz = (hash(i, 5) - 0.5) * 1.0;
      o.home = [-22 + hash(i, 1) * 28, 1 + hash(i, 2) * 20];
      o.foot = [FOOT[0] + (cn - 5) * 2.3 + jx, FOOT[1] + rw * 2.6 + jz];
      o.far = [FAR[0] + (cn - 5) * 2.3 + jx, FAR[1] + rw * 2.6 + jz];
      o.gather = [MOS[0] + (cn - 5) * 1.9 + jx * 0.6, MOS[1] - 6 - rw * 2.2 + jz * 0.6];
      o.ry = hash(i, 7) * 6.28; put(o.group, o.home[0], o.home[1]); o.group.rotation.order = 'YXZ'; crowd.push(o);
      o.group.traverse(function (m) { if (m.isMesh) m.castShadow = false; });   /* 그리기 호출을 줄이려고 백성은 그림자를 그리지 않는다(장로와 모세만 그린다) */
    }
    /* 백성의 장로들(19:7): 일곱 사람만. 모세 앞(서쪽)에 둥글게 모여 선다 */
    var elders = [];
    for (i = 0; i < 7; i++) {
      var eo = person(i * 31 + 900, { kind: 'man', carry: 'none' }), an = Math.PI * (0.62 + i * 0.127);
      eo.home = [4 + hash(i, 11) * 5, 3 + hash(i, 12) * 6];
      eo.meet = [MOS[0] + Math.cos(an) * 3.1, MOS[1] + Math.sin(an) * 3.1];
      eo.foot = [FOOT[0] + (i - 3) * 2.3, FOOT[1] + 4 * 2.6]; eo.far = [FAR[0] + (i - 3) * 2.3, FAR[1] + 4 * 2.6];
      eo.gather = [MOS[0] + (i - 3) * 1.9, MOS[1] - 4]; eo.ry = hash(i, 13) * 6.28; put(eo.group, eo.home[0], eo.home[1]); eo.group.rotation.order = 'YXZ'; elders.push(eo);
    }
    var all = crowd.concat(elders);
    /* 모세(Blender) */
    var moses = { group: api.fallback('#9C5438', 1.75, 0.27), update: function () {} };
    put(moses.group, MOS[0], MOS[1]); moses.group.rotation.order = 'YXZ';
    api.person('moses', function (nm) { nm.group.position.copy(moses.group.position); nm.group.rotation.copy(moses.group.rotation); nm.group.rotation.order = 'YXZ'; nm.group.visible = moses.group.visible; scene.remove(moses.group); scene.add(nm.group); moses = nm; });

    var phase = 'idle', evT = 0, prevT = 0, storm = 0, stormWant = 0, cloudK = 0, cloudWant = 0, smokeK = 0, smokeWant = 0, fireK = 0, fireWant = 0;
    var mode = 'home', meet = false, lookAtMoses = false, mosesTo = null, mosesWalk = false, flash = 0, nextFlash = 99, windOn = -1, ca = new T.Color(), cb = new T.Color();
    var M_FOOT = [FOOT[0], FOOT[1] - 3.2], M_FAR = [FAR[0], FAR[1] - 5], M_DARK = [9, -108], HIDE_Z = -93;
    function applySky() {
      var f = Math.min(1, flash) * (calm ? 0.3 : 1);
      ca.set('#F1DCB2'); cb.set('#4A4852'); ca.lerp(cb, storm); cb.set('#C9CEE6'); ca.lerp(cb, f * 0.55); scene.background.copy(ca); scene.fog.color.copy(ca);
      ca.set('#FFFFFF'); cb.set('#565460'); ca.lerp(cb, storm); cb.set('#E6EAFF'); skyM.color.copy(ca.lerp(cb, f * 0.6));
      hemi.intensity = 0.62 - 0.2 * storm + f * 0.55; sun.intensity = 0.72 - 0.52 * storm; ca.set('#FFE9C4'); cb.set('#B4B8CC'); sun.color.copy(ca.lerp(cb, storm));
      if (puff) puff.mat.emissiveIntensity = 0.1 + f * 0.5;
    }
    function setAt(o, p) { o.group.position.set(p[0], height(p[0], p[1]), p[1]); o.at = p; }
    function faceTo(o, p) { o.group.rotation.y = Math.atan2(p[0] - o.group.position.x, p[1] - o.group.position.z); }
    function target(o) { return mode === 'foot' ? o.foot : mode === 'far' ? o.far : mode === 'gather' ? o.gather : (meet && o.meet) ? o.meet : o.home; }
    function snapAll() { all.forEach(function (o) { setAt(o, target(o)); }); }
    function setWeather(k) { storm = stormWant = cloudK = cloudWant = smokeK = smokeWant = fireK = fireWant = k; flash = 0; applySky(); }
    /* 대목마다 모든 상태를 처음부터 정한다('이전'으로 돌아와도 뒤 대목의 것이 남지 않게) */
    function setPhase(p) {
      phase = p; evT = prevT = 0; meet = false; lookAtMoses = false; mosesTo = null; mosesWalk = false; nextFlash = 99; mode = 'home';
      moses.group.visible = true; moses.group.rotation.set(0, -Math.PI / 2, 0); setAt(moses, MOS);
      stakes.visible = !(p === 'idle' || p === 'camp' || p === 'elders');
      if (p === 'elders') { meet = true; }                                                              /* 19:7 */
      if (p === 'ready') { mode = 'gather'; lookAtMoses = true; }                                       /* 19:14-15: 모세가 백성에게 이른다 */
      if (p === 'idle' || p === 'camp' || p === 'elders' || p === 'ready') { setWeather(0); snapAll(); }
      if (p === 'third') { setWeather(0); mode = 'home'; snapAll(); stormWant = 1; cloudWant = 1; mode = 'foot'; mosesTo = M_FOOT; nextFlash = 0.3; }   /* 19:16-18 */
      if (p === 'words1' || p === 'words2') { setWeather(1); mode = 'foot'; snapAll(); setAt(moses, M_FOOT); moses.group.rotation.y = Math.PI; nextFlash = 5; }   /* 20:1-17 */
      if (p === 'afar') { setWeather(1); mode = 'foot'; snapAll(); mode = 'far'; setAt(moses, M_FAR); moses.group.rotation.y = 0; nextFlash = 0.5; }              /* 20:18-21 */
    }
    function at(t) { return prevT < t && evT >= t; }
    function thunder(v) { if (FX && FX.audio) FX.audio.rumble(2.4, v); }
    function v3(x, y, z) { return new T.Vector3(x, y, z); }
    /* 지켜보기 카메라: 틀이 지켜보기 동안 화면을 위로 20% 올려 주므로(글 상자 자리), 자리 p에서 to 쪽을, 수평에서 deg도 올려다본다 */
    function cam(p, up, to, deg) {
      var py = height(p[0], p[1]) + up, dx = to[0] - p[0], dz = to[1] - p[1], d = Math.hypot(dx, dz) || 1, L = 100;
      return { pos: [p[0], py, p[1]], look: [p[0] + dx / d * L, py + L * Math.tan(deg * Math.PI / 180), p[1] + dz / d * L] };
    }
    if (FX) FX.sortLayers(scene);
    var PH = ['camp', 'elders', 'ready', 'third', 'words1', 'words2', 'afar'];

    return {
      id: 'OT-12', scene: scene, sun: sun, sunOff: [-32, 50, 28],
      height: height, walkable: walkable,
      edge: function (x, z) {
        if (z < -12) return { who: 'onwoo', text: '산 쪽으로는 더 가지 말자. 산 둘레에는 넘지 말아야 할 경계가 있어.' };
        if (x < 24) return { who: 'hyu', text: '장막들 안쪽으로는 들어가지 말자. 우리는 진 가장자리에서 지켜보는 사람이야.' };
        return { who: 'hyu', text: '진에서 너무 멀리 가지는 말자.' };
      },
      P: { start: [46, 14], machine: [53, 20], machineRot: -1.2,
        /* 재료가 놓인 곳(quests[i].found): 진의 가장자리(산에서 먼 쪽) / 진 바깥의 광야 쪽 / 산이 바라보이는 진 가장자리(경계에서 먼 곳) */
        parts: [[40, 34], [57, 2], [30, -8]], lookSpot: [30, -8],
        look: { focus: FOOT, mid: PEAK, dy: 16, backE: 7, upE: 3.2 } },
      /* 지켜보기의 카메라: 아이들이 다니는 동쪽 가장자리 쪽에서 본다 */
      eventCam: function (i) {
        if (i === 2) return cam([15, 22], 2.0, [9, -150], 6);       /* 모세와 백성, 그 너머 산기슭의 경계와 산 */
        if (i === 3) return cam([16, 6], 2.4, [6, -150], 4);      /* 산기슭에 선 백성과 구름에 덮인 산 */
        if (i === 4) return cam([20, -8], 4, PEAK, 16);             /* 산 위의 구름과 연기와 불빛 */
        if (i === 5) return cam([14, -30], 1.9, [6, -150], 2.5);      /* 산기슭에 선 백성의 뒤에서 */
        if (i === 6) return cam([15, 4], 2.6, [10, -150], 3);       /* 멀리 선 백성과 어둠 쪽으로 가는 모세 */
        return null;
      },
      detector: '탐지기', askLabel: '탐지기 물음 풀기',
      intro: { text: '타임머신이 넓은 광야에 내려앉았어요. 장막이 많이 서 있고, 저 앞에 큰 산이 보여요.', say: { who: 'hyu', text: '장막들 바깥 가장자리에서만 다니자. 산 쪽으로는 가지 않는 거야.' } },
      lookText: '시내 산 이야기를 성경에서 찾아 읽은 뒤 다시 골라 보세요.',
      partBeats: [0, 1], eventStart: 2,
      beatNote: function (i) {
        if (i === 1) return '모세가 산으로 올라가 말씀을 받은 일은 글로 읽어요. 우리는 진에서, 장로들 앞에 선 모세를 봐요.';
        if (i === 3) return '나팔 소리와 하나님의 음성은 소리로 만들지 않았어요. 성경책에서 읽어요.';
        if (i === 4 || i === 5) return '하나님의 말씀은 소리로 만들지 않았어요. 성경책을 펴서 직접 읽어요.';
        if (i === 6) return '짙은 어둠 안쪽은 보여 주지 않아요. 성경은 여기까지 말해요.';
        return null;
      },
      sceneDoneText: '시내 산 이야기를 끝까지 지켜봐야 떠날 수 있어요.',
      dex: [
        { id: 'sinai', name: '시내 산', desc: '이스라엘이 그 앞 광야에 장막을 친 산. 셋째 날에 여호와께서 온 백성이 보는 앞에서 강림하시겠다고 하신 산', ref: '출 19:11', hint: '저 앞의 큰 산을 담아 보세요.', range: 600, crop: 0.8, pos: function () { return v3(PEAK[0], TOPY * 0.6, PEAK[1] + 30); } },
        { id: 'camp', name: '이스라엘의 진', desc: '이스라엘은 르비딤을 떠나 시내 광야에 이르러 산 앞에 장막을 쳤다', ref: '출 19:2', hint: '장막들을 담아 보세요.', range: 140, pos: function () { return v3(CAMP[0] + 14, 1.5, CAMP[1] - 6); } },
        { id: 'moses', name: '모세', desc: '와서 백성의 장로들을 불러 여호와께서 명하신 말씀을 모두 전한 사람', ref: '출 19:7', hint: '진 앞, 사람들 가까이에 서 있어요.', range: 60, crop: 0.4,
          visible: function () { return moses.group.visible; }, pos: function () { var p = moses.group.position; return v3(p.x, p.y + 1.1, p.z); } },
        { id: 'bounds', name: '산 둘레의 경계', desc: '백성을 위하여 산 사방에 정한 경계. 아무도 산에 오르거나 경계를 넘지 말라고 하셨다', ref: '출 19:12', hint: '경계의 말씀이 나온 뒤에 산기슭 쪽을 담아 보세요.', range: 160, crop: 0.6,
          visible: function () { return stakes.visible; }, pos: function () { return v3(PEAK[0] + 10, height(PEAK[0] + 10, PEAK[1] + BR) + 0.6, PEAK[1] + BR); } },
        { id: 'cloud', name: '빽빽한 구름과 연기', desc: '셋째 날 아침 산 위에 우레와 번개와 빽빽한 구름이 있었고, 연기가 가마 연기처럼 올랐다', ref: '출 19:16', hint: '셋째 날 아침이 된 뒤에 산 위를 담아 보세요.', range: 600, crop: 0.8,
          visible: function () { return cloudK > 0.6; }, pos: function () { return v3(PEAK[0], TOPY + 6, PEAK[1]); } }
      ],
      reset: function () { setPhase('idle'); },
      partFound: function (i) { if (i === 0) setPhase('camp'); if (i === 1) setPhase('elders'); },
      partContinue: function () {},
      lookupPose: function () {},
      /* 대목 번호(OT-12.json): 0 = 19:1-2, 1 = 19:3-8, 2 = 19:9-15, 3 = 19:16-25, 4 = 20:1-11, 5 = 20:12-17, 6 = 20:18-21 */
      beatPose: function (i) { setPhase(PH[i] || 'idle'); },
      update: function (dt, now) {
        prevT = evT; evT += dt;
        var stormy = phase === 'third' || phase === 'afar', quiet = phase === 'words1' || phase === 'words2';
        if (phase === 'third') {
          if (evT > 3) { smokeWant = 1; fireWant = 1; }
          if (at(4.2)) { if (FX && FX.audio) { FX.audio.rumble(5, 0.7); FX.audio.thud(0.5); } if (api.shake) api.shake(0.35, 4); }   /* 19:18: 온 산이 크게 진동한다(간접 연출) */
        }
        if (phase === 'afar' && at(3.5)) { mosesTo = M_DARK; mosesWalk = true; }                                                    /* 20:21 */
        /* 번개(19:16, 20:18): 하늘과 구름이 번쩍인다. 우레 소리는 말씀하시는 대목에서는 내지 않는다 */
        if ((stormy || quiet) && evT >= nextFlash) { flash = stormy ? 1 : 0.6; nextFlash = evT + (stormy ? 4 + R() * 3 : 8 + R() * 4); if (stormy) thunder(evT < 1 ? 0.5 : 0.32); }
        var chg = false;
        if (Math.abs(storm - stormWant) > 0.003) { storm += (stormWant - storm) * Math.min(1, dt * 1.1); chg = true; }
        if (flash > 0) { flash = Math.max(0, flash - dt * 3.2); chg = true; }
        if (chg) applySky();
        cloudK += (cloudWant - cloudK) * Math.min(1, dt * 0.9); smokeK += (smokeWant - smokeK) * Math.min(1, dt * 0.7); fireK += (fireWant - fireK) * Math.min(1, dt * 0.7);
        if (puff) {
          puff.mesh.visible = cloudK > 0.01 || smokeK > 0.01;
          if (puff.mesh.visible) {
            var k, q, kk;
            for (k = 0; k < NC + NB; k++) { q = pd[k]; kk = k < NC ? sm(k / NC * 0.5, k / NC * 0.5 + 0.5, cloudK) : sm(0, 1, smokeK); puff.put(k, q.x, q.y + Math.sin(now * 0.25 + q.ph) * 0.8, q.z, q.r * kk, q.col, q.fy); }
            for (k = 0; k < NS; k++) {   /* 가마 연기처럼 위로 오르는 연기 */
              var u = (now * 0.03 + k / NS) % 1, fd = sm(0, 0.1, u) * sm(1, 0.8, u);
              puff.put(NC + NB + k, PEAK[0] + Math.sin(k * 2.4) * 5 + u * u * 30, TOPY + 12 + u * 100, PEAK[1] + Math.cos(k * 1.7) * 5, (8 + u * 13) * fd * smokeK, k % 2 ? '#6C6A72' : '#787680', 0.8);
            }
            puff.commit();
          }
        }
        if (ember) {
          ember.mesh.visible = fireK > 0.01;
          if (ember.mesh.visible) { for (var e2 = 0; e2 < NE; e2++) { var w = ed[e2]; ember.put(e2, w.x, w.y, w.z, w.r * fireK * (0.9 + 0.1 * Math.sin(now * 3.1 + w.ph))); } ember.commit(); ember.mat.color.setRGB(1, 0.5 + 0.08 * Math.sin(now * 5.3), 0.2); }
        }
        glow.intensity = fireK * (1.5 + 0.25 * Math.sin(now * 4.3) + 0.15 * Math.sin(now * 9.1));
        /* 백성과 장로들 */
        var trem = (phase === 'third' || phase === 'afar') && !calm;                                   /* 19:16, 20:18: 떨었다 */
        all.forEach(function (o, n) {
          var to = target(o), p = o.group.position, dx = to[0] - p.x, dz = to[1] - p.z, d = Math.hypot(dx, dz), mv = d > 0.35;
          if (d > 0.02) { var f = Math.min(1, dt * 0.95); p.x += dx * f; p.z += dz * f; p.y = height(p.x, p.z); }
          if (mv) o.group.rotation.y = Math.atan2(dx, dz);
          else if (mode === 'gather') faceTo(o, MOS);
          else if (mode !== 'home') faceTo(o, phase === 'afar' && moses.group.visible && evT < 3.5 ? [M_FAR[0], M_FAR[1]] : PEAK);
          else if ((meet && o.meet) || lookAtMoses) faceTo(o, MOS);
          else o.group.rotation.y = o.ry;
          o.group.rotation.z = trem && !mv ? Math.sin(now * 23 + n * 1.7) * 0.012 : 0;
          if (o.update) o.update(dt, mv ? 1.1 : 0, now);
        });
        /* 모세 */
        var mp = moses.group.position, walking = false;
        if (mosesTo) {
          var mx = mosesTo[0] - mp.x, mz = mosesTo[1] - mp.z, md = Math.hypot(mx, mz);
          if (md > 0.3) {
            if (mosesWalk) { var st = Math.min(md, 3.1 * dt); mp.x += mx / md * st; mp.z += mz / md * st; } else { var f2 = Math.min(1, dt * 0.95); mp.x += mx * f2; mp.z += mz * f2; }
            mp.y = height(mp.x, mp.z); moses.group.rotation.y = Math.atan2(mx, mz); walking = true;
          } else if (phase === 'third') moses.group.rotation.y = Math.PI;                                /* 산 쪽을 향해 선다 */
        } else if (phase === 'elders') moses.group.rotation.y = -Math.PI / 2; else if (phase === 'ready') moses.group.rotation.y = Math.PI;
        moses.group.visible = !(phase === 'afar' && mp.z < HIDE_Z);                                      /* 연기 속으로 들어가면 보이지 않는다(20:21) */
        if (moses.update) moses.update(dt, walking);
      },
      audio: function (A) { A.setFlock(999); A.setFire(999); var w2 = storm > 0.5 ? 1 : 0; if (w2 !== windOn && A.wind) { windOn = w2; A.wind(w2 ? 0.28 : 0.16); } },
      menuCam: function (camera, now) { var a2 = now * 0.05; camera.position.set(40 + Math.sin(a2) * 8, 8, 20); camera.lookAt(PEAK[0], 26, PEAK[1]); },
      debug: { phase: function () { return { phase: phase, storm: storm, cloud: cloudK, smoke: smokeK, fire: fireK, stakes: stakes.visible, mode: mode, moses: [moses.group.position.x, moses.group.position.z, moses.group.visible] }; }, arrived: function () { return phase !== 'idle'; } }
    };
  };
})();
