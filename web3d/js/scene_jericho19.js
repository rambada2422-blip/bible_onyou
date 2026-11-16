/* 3D 장면 설정: OT-19 여리고 성이 무너지다 (수 6:1-27).
 * 간접 연출(규칙서 13.8, 2026-11-16, 감수 전): 성벽이 무너져 내릴 때 합성 땅울림과 화면 흔들림. 움직임 줄이기 설정이면 흔들지 않는다.
 * 방향: 여리고 성은 북쪽(-Z), 이스라엘 진은 남쪽(+Z). 세 아이는 진 쪽, 성과 행렬에서 멀리 떨어진 곳에서만 다닌다.
 * 본문에 맞춘 점 (content/ot/OT-19.json design3d)
 *  - 성은 굳게 닫혀 있다(수 6:1). 성을 도는 행렬의 차례: 무장한 사람들 → 양각 나팔을 든 제사장 일곱 → 언약궤를 멘 제사장들 → 후군(수 6:8-9, 6:13).
 *  - 엿새 동안 날마다 한 번, 일곱째 날 새벽에 일곱 번 돈다(수 6:3-4, 6:14-15). 행렬은 말하거나 외치지 않는다(수 6:10).
 *  - 나팔 소리와 외침 뒤에 성벽이 무너져 내린다(수 6:20). 땅이 갈라지거나 흔들리지 않는다. 성벽 조각이 바깥으로 쓰러져 가라앉는다.
 *  - 깔리는 사람, 싸움, 주검, 불타는 성 안은 그리지 않는다(수 6:21, 6:24는 글로만). 무너진 뒤 성 안으로 들어가는 모습도 그리지 않는다.
 *  - 궤는 덮개로 덮여 있고 빛나지 않는다. 하나님은 말씀 자막으로만. 라합의 집과 붉은 줄은 그리지 않는다.
 * 감수가 필요한 설정: 성의 크기와 성벽 높이, 성 둘레 길, 진의 자리, 행렬의 사람 수(일부만 그림), 궤를 멘 제사장 수(넷), 여호수아의 자리,
 *   일곱 바퀴를 빠르게 돌려 보여 주는 것, 성벽이 바깥쪽으로 쓰러져 가라앉는 모양(본문은 무너져 내렸다고만 한다).
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  BO3D.scene3d = BO3D.scene3d || {};
  BO3D.scene3d['OT-19'] = function (api) {
    var T = THREE, M2 = BO3D.models2 || {}, PR = BO3D.props, FX = api.FX, R = PR.rng(1906);
    function sm(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
    function hash(ix, iz) { var n = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453; return n - Math.floor(n); }
    function noise(x, z) {
      var ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
      var a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
    var CITY = [0, -62], A = 30, B = 22, PATH_A = 47, PATH_B = 39;
    function ell(x, z, a, b) { var dx = (x - CITY[0]) / a, dz = (z - CITY[1]) / b; return Math.sqrt(dx * dx + dz * dz); }
    /* 땅: 평지, 성이 선 둔덕, 멀리 서쪽 산 */
    function height(x, z) {
      var h = 0.4 + 0.35 * noise(x * 0.05 + 2, z * 0.05 + 9);
      var e = ell(x, z, A + 6, B + 6); h += 3.2 * sm(1.25, 0.82, e);
      h += sm(-170, -260, z) * 30 * (0.5 + 0.6 * noise(x * 0.02, 4)) + sm(150, 230, Math.abs(x)) * 10 * noise(3, z * 0.02);
      return h;
    }
    function walkable(x, z) { return x >= 20 && x <= 58 && z >= 0 && z <= 46; }

    var scene = new T.Scene();
    scene.background = new T.Color('#F1E3C2'); scene.fog = new T.Fog('#EEDDBA', 80, 330);
    var skyG = new T.SphereGeometry(560, 24, 14), sp = skyG.attributes.position, sc = new Float32Array(sp.count * 3), cc = new T.Color(), top = new T.Color('#79AFCF'), hor = new T.Color('#F4E6C4'), i;
    for (i = 0; i < sp.count; i++) { var tt = Math.max(0, sp.getY(i) / 560); cc.copy(hor).lerp(top, sm(0.02, 0.7, tt)); sc[i * 3] = cc.r; sc[i * 3 + 1] = cc.g; sc[i * 3 + 2] = cc.b; }
    skyG.setAttribute('color', new T.BufferAttribute(sc, 3));
    var skyM = new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false }); scene.add(new T.Mesh(skyG, skyM));
    var g = new T.PlaneGeometry(560, 520, 170, 160); g.rotateX(-Math.PI / 2);
    var pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new T.Color(), sand = new T.Color('#D9BE88'), grass = new T.Color('#A9B270'), mound = new T.Color('#C7A070'), hill = new T.Color('#B49A8E');
    for (i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i) - 40; pos.setZ(i, z); var y = height(x, z); pos.setY(i, y);
      c.copy(sand).lerp(grass, sm(0.45, 0.8, noise(x * 0.04 + 5, z * 0.04)) * 0.6);
      if (ell(x, z, A + 6, B + 6) < 1.2) c.lerp(mound, 0.6);
      if (y > 6) c.lerp(hill, sm(6, 22, y));
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3)); g.computeVertexNormals();
    var ground = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 })); ground.receiveShadow = true; scene.add(ground);
    var hemi = new T.HemisphereLight('#DCEFF2', '#A99A6A', 0.64); scene.add(hemi);
    var sun = new T.DirectionalLight('#FFF0CF', 0.74); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    var ss = sun.shadow.camera; ss.left = -26; ss.right = 26; ss.top = 26; ss.bottom = -26; ss.near = 1; ss.far = 150; sun.shadow.bias = -0.0015;
    scene.add(sun); scene.add(sun.target);
    function put(o, x, z, lift) { o.position.set(x, height(x, z) + (lift || 0), z); scene.add(o); return o; }
    function std(cl) { return new T.MeshStandardMaterial({ color: cl, flatShading: true, roughness: 0.95 }); }

    /* 성: 둔덕 위의 집들(지붕 평평), 둘레의 성벽 조각과 망대. 성문은 닫혀 있다(수 6:1) */
    var houseM = [std('#E2C090'), std('#D6AE7C'), std('#EACB9A'), std('#CBA070')], wallM = std('#C2905F'), wallM2 = std('#AD7850'), capM = std('#D6AA76'), doorM = std('#5A3A22');
    for (i = 0; i < 70; i++) {
      var a = R() * 6.28, rr = Math.sqrt(R()) * 0.8, hx = CITY[0] + Math.cos(a) * A * rr, hz = CITY[1] + Math.sin(a) * B * rr, hw = 3 + R() * 3, hh = 2.5 + R() * 2.5;
      var hs = new T.Mesh(new T.BoxGeometry(hw, hh, 2.5 + R() * 3), houseM[i % 4]); hs.castShadow = true; put(hs, hx, hz, hh / 2 - 0.2); hs.rotation.y = R() * 0.6;
    }
    var segs = [], NSEG = 34, WH = 8.5;
    for (i = 0; i < NSEG; i++) {
      var t0 = (i / NSEG) * 6.283, t1 = ((i + 1) / NSEG) * 6.283, x0 = CITY[0] + Math.cos(t0) * A, z0 = CITY[1] + Math.sin(t0) * B, x1 = CITY[0] + Math.cos(t1) * A, z1 = CITY[1] + Math.sin(t1) * B;
      var len = Math.sqrt((x1 - x0) * (x1 - x0) + (z1 - z0) * (z1 - z0)) + 0.4, mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
      var pivot = new T.Group(), seg = new T.Group(); pivot.rotation.order = 'YXZ';   /* 쓰러질 때 조각마다 바깥쪽으로(Y 다음 X) */
      var wall = new T.Mesh(new T.BoxGeometry(len, WH, 2.4), i % 3 ? wallM : wallM2); wall.position.y = WH / 2; wall.castShadow = true; seg.add(wall);
      for (var k = 0; k < 4; k++) { var cr = new T.Mesh(new T.BoxGeometry(len / 8, 0.8, 2.5), capM); cr.position.set(-len / 2 + len / 8 * (k * 2 + 0.5), WH + 0.4, 0); seg.add(cr); }
      if (i % 5 === 0) { var tw = new T.Mesh(new T.BoxGeometry(4.2, WH + 3, 4.2), wallM2); tw.position.y = (WH + 3) / 2; tw.castShadow = true; seg.add(tw); }
      if (i === Math.round(NSEG * 0.25)) { var dr = new T.Mesh(new T.BoxGeometry(3.2, 4.6, 0.3), doorM); dr.position.set(0, 2.3, 1.25); seg.add(dr); }
      /* 바깥쪽 밑동을 축으로 쓰러진다: pivot은 바깥 모서리에 */
      seg.position.z = -1.2; pivot.add(seg);
      put(pivot, mx, mz, -0.3);
      var nx = Math.cos((t0 + t1) / 2) / A, nz = Math.sin((t0 + t1) / 2) / B, nl = Math.sqrt(nx * nx + nz * nz);
      pivot.rotation.y = Math.atan2(-(nx / nl), -(nz / nl)) + Math.PI; /* 로컬 +Z가 바깥쪽 */
      pivot.translateZ(1.2);
      segs.push({ pivot: pivot, y0: pivot.position.y, delay: hash(i, 4) * 0.8, fall: 0 });
    }
    /* 무너질 때의 흙먼지(장면의 효과. 본문에 없는 일은 더하지 않는다: 흔들림·불·빛줄기 없음) */
    var dcv = document.createElement('canvas'); dcv.width = dcv.height = 64;
    var dcx = dcv.getContext('2d'), dgr = dcx.createRadialGradient(32, 32, 0, 32, 32, 32);
    dgr.addColorStop(0, 'rgba(255,255,255,0.9)'); dgr.addColorStop(0.5, 'rgba(255,255,255,0.35)'); dgr.addColorStop(1, 'rgba(255,255,255,0)'); dcx.fillStyle = dgr; dcx.fillRect(0, 0, 64, 64);
    var dustM = new T.PointsMaterial({ color: '#D9C29A', size: 7, map: new T.CanvasTexture(dcv), transparent: true, opacity: 0, depthWrite: false });
    var dg = new T.BufferGeometry(), dp = [];
    for (i = 0; i < 260; i++) { var da = R() * 6.28; dp.push(CITY[0] + Math.cos(da) * (A + R() * 6), 1 + R() * 9, CITY[1] + Math.sin(da) * (B + R() * 6)); }
    dg.setAttribute('position', new T.Float32BufferAttribute(dp, 3)); var dust = new T.Points(dg, dustM); scene.add(dust);

    /* 진의 장막 (수 6:11, 6:14) */
    var RET_X = -12;
    for (i = 0; i < 60; i++) {
      var tx = -80 + R() * 130, tz = 22 + R() * 56;
      if (tx > 10 && tz < 50) continue;
      if (Math.abs(tx - RET_X) < 4.5) { R(); continue; }   /* 행렬이 진으로 돌아오는 길(6:11, 6:14)에는 장막을 두지 않는다(다른 장막의 자리는 그대로) */
      var tn = PR.tent(i + 40); put(tn, tx, tz); tn.rotation.y = R() * 6.28;
    }

    /* 행렬: 무장한 사람들 → 양각 나팔을 든 제사장 일곱 → 언약궤를 멘 제사장 넷 → 후군 (수 6:8-9) */
    var marchers = [], SP = 1.7;
    function person(kind, k) {
      var o = null;
      try {
        if (kind === 'priest' && M2.priestSimple) o = M2.priestSimple(k % 2 ? 'L' : 'R');
        else if (M2.israelite) o = M2.israelite(k * 17 + 3, { kind: 'man', carry: 'none' });   /* 무장한 사람들과 후군(6:9): 어른 남자 */
      } catch (e) { o = null; }
      if (!o) o = { group: api.fallback(kind === 'priest' ? '#F3EEE2' : '#7A6A54', 1.7, 0.22), update: function () {} };
      scene.add(o.group); return o;
    }
    var order = [], n;
    for (n = 0; n < 14; n++) order.push({ kind: 'armed' });
    for (n = 0; n < 7; n++) order.push({ kind: 'horn' });
    order.push({ kind: 'ark' });
    for (n = 0; n < 12; n++) order.push({ kind: 'rear' });
    var ark = null;
    try { if (M2.arkCovered) ark = M2.arkCovered(); } catch (e) { ark = null; }
    if (!ark) { ark = new T.Group(); var ab = new T.Mesh(new T.BoxGeometry(0.69, 0.69, 1.14), std('#2F5FA8')); ab.position.y = 0.345; ark.add(ab); }
    scene.add(ark);
    var hornM = std('#D8C7A0'), spearM = std('#6B4A2A');
    order.forEach(function (o, k) {
      o.s = -k * SP * (o.kind === 'ark' ? 1 : 1); o.k = k;
      if (o.kind === 'ark') {
        o.bearers = [0, 1, 2, 3].map(function (q) { var pr = person('priest', q); pr.lx = (q % 2 ? -1 : 1) * 0.58; pr.lz = q < 2 ? 1.25 : -1.25; return pr; });
      } else {
        o.p = person(o.kind === 'horn' ? 'priest' : 'man', k);
        if (o.kind === 'horn') { var hn = new T.Mesh(new T.ConeGeometry(0.06, 0.55, 6), hornM); hn.rotation.x = -1.2; hn.position.set(0, 1.5, 0.35); o.p.group.add(hn); }
        if (o.kind === 'armed') { var spr = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 2.2, 5), spearM); spr.position.set(0.32, 1.3, 0.05); o.p.group.add(spr); }
      }
    });
    var lapS = 0, marching = false, lapsLeft = 0, speed = 2.2;
    function pathPos(s) {
      var L = Math.PI * (3 * (PATH_A + PATH_B) - Math.sqrt((3 * PATH_A + PATH_B) * (PATH_A + 3 * PATH_B))); /* 둘레 근사 */
      var th = Math.PI / 2 + (s / L) * 6.2832;
      return [CITY[0] + Math.cos(th) * PATH_A, CITY[1] + Math.sin(th) * PATH_B, th, L];
    }
    var START = pathPos(0);
    /* 한 바퀴를 돈 뒤 진으로 돌아오는 길(수 6:11 "진영으로 들어와서 진영에서 자니라", 6:14 "진영으로 돌아오니라").
       성 둘레 길의 시작점에서 서쪽으로 비켜, 진(장막들) 안으로 들어간다. 앞선 사람이 가장 깊이 들어가고, 맨 뒤(후군)까지 모두 장막 사이에 들어선 뒤 멈춘다 */
    var RET = [[START[0], START[1]], [RET_X, START[1] + 8], [RET_X, 82]], RET_L = [], RET_LEN = 0, homing = false, homeBase = 0;
    for (n = 1; n < RET.length; n++) { var rdx = RET[n][0] - RET[n - 1][0], rdz = RET[n][1] - RET[n - 1][1]; RET_L.push(Math.sqrt(rdx * rdx + rdz * rdz)); RET_LEN += RET_L[n - 1]; }
    function retPos(d) {
      for (var q = 0; q < RET_L.length; q++) {
        if (d <= RET_L[q] || q === RET_L.length - 1) { var a = RET[q], b = RET[q + 1], u = Math.min(1, Math.max(0, d / RET_L[q])); return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, Math.atan2(b[0] - a[0], b[1] - a[1])]; }
        d -= RET_L[q];
      }
    }
    function placeMarch(dt) {
      order.forEach(function (o) {
        var s = lapS + o.s, pp = pathPos(s), hd = Math.atan2(-Math.sin(pp[2]) * PATH_A, Math.cos(pp[2]) * PATH_B), on = s >= 0;
        var vis = on || marching;
        /* 출발 전에는 진 쪽(남쪽 성 둘레 길 시작점 뒤)에 줄지어 선다 */
        var x = pp[0], z = pp[1];
        if (homing && s - homeBase >= 0) { var rp = retPos(Math.min(RET_LEN, s - homeBase)); x = rp[0]; z = rp[1]; hd = rp[2]; }   /* 진으로 돌아오는 중 */
        else if (s < 0) { x = START[0] - 12 - (o.k % 3) * 1.4; z = START[1] + 8 - s * 0.6; hd = Math.PI; }   /* 출발 전에는 서쪽(아이들 반대쪽)에 줄지어 선다 */
        if (o.kind === 'ark') {
          ark.position.set(x, height(x, z) + 1.0, z); ark.rotation.y = hd;
          o.bearers.forEach(function (pr) {
            var cx = x + Math.cos(hd) * pr.lx + Math.sin(hd) * pr.lz, cz = z - Math.sin(hd) * pr.lx + Math.cos(hd) * pr.lz;
            pr.group.position.set(cx, height(cx, cz), cz); pr.group.rotation.y = hd; if (pr.update) pr.update(dt, marching ? 1 : 0);
          });
        } else {
          o.p.group.position.set(x, height(x, z), z); o.p.group.rotation.y = hd; o.p.group.visible = vis;
          if (o.p.update) o.p.update(dt, marching && s >= 0 ? 1.1 : 0);
        }
      });
    }
    /* 여호수아 (수 6:6): 진 앞에 서 있다 */
    var josh = { group: api.fallback('#A8322C', 1.76, 0.26), update: function () {} };
    put(josh.group, 6, 14); josh.group.rotation.y = Math.PI;
    api.person('joshua', function (nm) { nm.group.position.copy(josh.group.position); nm.group.rotation.y = Math.PI; scene.remove(josh.group); scene.add(nm.group); josh = nm; });

    var phase = 'closed', fallT = -1, dawn = 0, dawnWant = 0;
    var DAY = { bg: '#F1E3C2', sky: '#FFFFFF', hi: 0.64, si: 0.74, sc: '#FFF0CF' }, DAWN = { bg: '#E9BFA2', sky: '#F2C8B0', hi: 0.5, si: 0.5, sc: '#FFC890' };
    var ca = new T.Color(), cb = new T.Color();
    function applyDawn() {
      ca.set(DAY.bg); cb.set(DAWN.bg); ca.lerp(cb, dawn); scene.background.copy(ca); scene.fog.color.copy(ca);
      ca.set(DAY.sky); cb.set(DAWN.sky); skyM.color.copy(ca.lerp(cb, dawn)); hemi.intensity = DAY.hi + (DAWN.hi - DAY.hi) * dawn;
      ca.set(DAY.sc); cb.set(DAWN.sc); sun.color.copy(ca.lerp(cb, dawn)); sun.intensity = DAY.si + (DAWN.si - DAY.si) * dawn;
    }
    function setPhase(p) {
      phase = p;
      if (p !== 'fall' && p !== 'after') { fallT = -1; segs.forEach(function (sg) { sg.pivot.rotation.x = 0; sg.pivot.position.y = sg.y0; }); dustM.opacity = 0; }   /* '이전'으로 돌아올 때 */
      if (homing && p !== 'after') { homing = false; lapS = 0; }   /* 진에 돌아와 있던 행렬은 다음 날 진 앞 줄에서 다시 나선다 */
      if (p === 'closed') { marching = false; lapS = 0; lapsLeft = 0; fallT = -1; dawnWant = 0; dawn = 0; applyDawn(); segs.forEach(function (sg) { sg.fall = 0; sg.pivot.rotation.x = 0; sg.pivot.position.y = sg.y0; sg.pivot.visible = true; }); dustM.opacity = 0; }
      if (p === 'march1' || p === 'march6') { homing = false; lapS = 0; }   /* 그날의 한 바퀴는 진 앞 줄에서 처음부터('이전'으로 돌아와도) */
      if (p === 'march1') { marching = true; lapsLeft = 1; speed = 2.4; dawnWant = 0; }          /* 수 6:11: 한 번 */
      if (p === 'march6') { marching = true; lapsLeft = 1; speed = 4.2; dawnWant = 0; }          /* 수 6:14: 엿새 동안(한 바퀴로 보여 줌). 돈 뒤 진으로 돌아온다 */
      if (p === 'march7') { marching = true; lapsLeft = 7; speed = 16; dawnWant = 1; }           /* 수 6:15: 새벽, 일곱 번(빠르게) */
      if (p === 'fall') { var L7 = pathPos(0)[3]; marching = false; lapS = Math.max(lapS, Math.ceil((lapS - order[order.length - 1].s) / L7) * L7); dawnWant = 1; if (fallT < 0) fallT = -2.5; }   /* 수 6:20: 일곱 바퀴를 마친 뒤 나팔과 외침, 그 뒤 무너진다(-2.5초는 그 사이) */
      if (p === 'after') { marching = false; dawnWant = 0.4; if (fallT < 0) fallT = 99; }
    }
    function v3(x, y, z) { return new T.Vector3(x, y, z); }
    placeMarch(0);
    if (FX) FX.sortLayers(scene);

    return {
      id: 'OT-19', scene: scene, sun: sun, sunOff: [-30, 50, 30],
      height: height, walkable: walkable,
      edge: function (x, z) {
        if (z < 0 || x < 14) return { who: 'onwoo', text: '성 쪽으로는 더 가지 말자. 우리는 멀리서 지켜보는 사람이야.' };
        if (z > 46) return { who: 'hyu', text: '진 안쪽으로는 들어가지 말자.' };
        return null;
      },
      P: { start: [44, 34], machine: [52, 40], machineRot: -0.6,
        /* 재료가 놓인 곳(quests[i].found): 굳게 닫힌 성 쪽(멀찍이) / 이스라엘 진 쪽 / 성벽이 보이는 쪽(진으로 돌아가는 쪽) */
        parts: [[30, 4], [50, 42], [22, 14]], lookSpot: [22, 14],
        look: { focus: CITY, mid: [10, -30], dy: 6, backE: 8, upE: 4 } },
      eventLook: function (i) {
        if (i === 2) { var gp = order[6].p.group.position; return { focus: [gp.x, gp.z], mid: [gp.x, gp.z], dy: 1.4, backE: 8, upE: 4 }; }   /* 행렬의 앞쪽(성 둘레, 진으로 돌아올 때도)을 따라간다 */
        if (i === 3) return { focus: CITY, mid: [12, -30], dy: 5, backE: 9, upE: 4.5 };
        if (i === 4) return { focus: CITY, mid: CITY, dy: 5, backE: 10, upE: 5 };
        return { focus: CITY, mid: [8, -20], dy: 4, backE: 9, upE: 4.5 };
      },
      detector: '탐지기', askLabel: '탐지기 물음 풀기',
      intro: { text: '타임머신이 넓은 평지에 내려앉았어요. 멀리 성벽으로 둘린 성이 보여요.', say: { who: 'hyu', text: '성에서 멀리 떨어진 진 쪽에서만 다니자.' } },
      lookText: '여리고 성 이야기를 성경에서 찾아 읽은 뒤 다시 골라 보세요.',
      partBeats: [0, 1], eventStart: 2,
      sceneDoneText: '여리고 성 장면을 끝까지 지켜봐야 떠날 수 있어요.',
      dex: [
        { id: 'jericho', name: '여리고 성', desc: '이스라엘 자손 때문에 굳게 닫혀 드나드는 사람이 없던 성', ref: '수 6:1', hint: '북쪽 멀리 보이는 성을 담아 보세요.', range: 260, crop: 0.7, pos: function () { return v3(CITY[0], height(CITY[0], CITY[1]) + 6, CITY[1]); } },
        { id: 'horns', name: '양각 나팔을 든 제사장들', desc: '양각 나팔 일곱을 들고 여호와의 궤 앞에서 간 제사장 일곱', ref: '수 6:8', hint: '성을 도는 행렬을 보세요.', range: 120, crop: 0.4,
          pos: function () { var o = order[16], g = o.p.group; if (g.visible) return v3(g.position.x, g.position.y + 1.4, g.position.z); var pp = pathPos(lapS + o.s); return v3(pp[0], height(pp[0], pp[1]) + 1.4, pp[1]); } },
        { id: 'ark', name: '여호와의 언약궤', desc: '제사장들이 메고 성을 돈 여호와의 궤', ref: '수 6:6', hint: '나팔 부는 제사장들 뒤를 보세요.', range: 120, crop: 0.4, pos: function () { return v3(ark.position.x, ark.position.y + 0.4, ark.position.z); } },
        { id: 'joshua', name: '여호수아', desc: '제사장들에게 언약궤를 메게 한 사람', ref: '수 6:6', hint: '진 앞에 서 있어요.', range: 40, crop: 0.36, pos: function () { var p = josh.group.position; return v3(p.x, p.y + 1.1, p.z); } }
      ],
      reset: function () { setPhase('closed'); },
      partFound: function () {},
      partContinue: function () {},
      lookupPose: function () { if (phase === 'closed') placeMarch(0); },
      /* 대목 번호(OT-19.json): 2 = 6:12-14, 3 = 6:15-19, 4 = 6:20, 5 = 6:21-25, 6 = 6:26-27. 0·1은 재료를 찾을 때 */
      beatPose: function (i) { setPhase(i <= 1 ? 'closed' : i === 2 ? 'march6' : i === 3 ? 'march7' : i === 4 ? 'fall' : 'after'); },
      update: function (dt, now) {
        if (Math.abs(dawn - dawnWant) > 0.003) { dawn += (dawnWant - dawn) * Math.min(1, dt * 0.5); applyDawn(); }
        if (marching) {
          var L = pathPos(0)[3], before = Math.floor(lapS / L);
          lapS += speed * dt;
          if (homing) { if (lapS - homeBase >= RET_LEN) { lapS = homeBase + RET_LEN; marching = false; } }
          else if (Math.floor(lapS / L) > before) { lapsLeft--; if (lapsLeft <= 0) { lapS = Math.ceil(lapS / L) * L;
            if (phase === 'march1' || phase === 'march6') { homing = true; homeBase = lapS; }   /* 날마다 한 번 돈 뒤 진으로 돌아온다(6:11, 6:14) */
            else marching = false; } }
        }
        placeMarch(dt);
        if ((phase === 'fall' || phase === 'after') && fallT > -3) {
          var fallPrev = fallT; fallT += dt;
          if (fallPrev < 0 && fallT >= 0 && phase === 'fall') { if (FX) FX.audio.rumble(4, 0.75); if (api.shake) api.shake(0.45, 3); }   /* 성벽이 무너져 내릴 때 땅울림과 흔들림(수 6:20, 간접 연출) */
          segs.forEach(function (sg) {
            var u = Math.min(1, Math.max(0, (fallT - sg.delay) / 2.2)), e = u * u;
            sg.pivot.rotation.x = e * 1.2; sg.pivot.position.y = sg.y0 - e * 5.5;
          });
          dustM.opacity = fallT < 99 ? Math.max(0, Math.min(0.55, (fallT - 0.3) * 0.5) - Math.max(0, fallT - 5) * 0.08) : 0;
          dust.position.y = Math.min(3, fallT * 0.4);
        }
        if (josh.update) josh.update(dt, false);
      },
      audio: function (A) { A.setFlock(999); A.setFire(999); },
      menuCam: function (camera, now) { var a = now * 0.05; camera.position.set(40 + Math.sin(a) * 9, 9, 40); camera.lookAt(CITY[0], 6, CITY[1]); },
      debug: { phase: function () { return { phase: phase, lap: lapS, marching: marching, fall: fallT, homing: homing, home: homing ? Math.max(0, lapS - homeBase) / RET_LEN : 0 }; }, arrived: function () { return phase !== 'closed'; } }
    };
  };
})();
