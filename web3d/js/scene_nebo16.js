/* 3D 장면 설정: OT-16 느보 산에서 모세의 마지막 (신 34:1-12). 모압 평지와 느보 산. (자동 작업 3d-a. 장면표의 3D 12장면 밖의 추가 제안)
 * 방향: 서쪽이 -X, 북쪽이 -Z. 느보 산(비스가 꼭대기)은 동쪽. 그 서쪽 아래가 모압 평지와 이스라엘의 진, 더 서쪽에 요단, 그 건너에 여리고, 맨 끝에 서해.
 *   아이들은 산 아래(산기슭과 평지의 가장자리)에서만 다닌다. 실제 거리를 크게 줄여서 만들었다.
 * 본문에 맞춘 점 (content/ot/OT-16.json design3d)
 *  - 모세가 모압 평지에서 느보 산으로 올라가 여리고 맞은편 비스가 꼭대기에 이른다(34:1). 아이들은 따라 올라가지 않고 산 아래에서 본다.
 *  - 여호와께서 보이신 땅(34:1-3): 길르앗에서 단까지, 납달리·에브라임·므낫세의 땅, 서해까지의 유다 땅, 남방, 종려의 성읍 여리고의 골짜기 평지에서 소알까지.
 *    꼭대기에서 보이는 풍경은 화면으로만 보여 준다(천천히 둘러본다. 본문은 방위를 말하지 않는다). 아이들은 모세 곁에 서지 않는다. 땅의 이름을 풍경 위에 적지 않는다.
 *    모세는 뒷모습으로 서 있다(34:7: 눈이 흐리지 않고 기력이 쇠하지 않았다. 늙고 쇠약하게 그리지 않는다). 빛이나 사람 모양을 곁에 두지 않는다.
 *  - 34:5-7(죽음과 장사)은 보여 주지 않는다. 그 대목부터 모세는 보이지 않고, 산꼭대기는 비어 있다. 골짜기와 무덤은 만들지 않는다(성경은 여기까지 말한다).
 *  - 이스라엘 자손이 모압 평지에서 삼십 일 애곡한다(34:8). 멀리서, 저녁 빛과 글로만. 우는 얼굴과 소리는 만들지 않는다.
 *  - 여호수아가 백성 앞에 선다(34:9). 안수하는 장면은 만들지 않는다(이미 안수했다고 한다).
 * 감수가 필요한 설정: 산의 높이와 모양, 오르는 길, 진과 요단과 여리고의 자리(줄인 거리), 서해를 옅은 물빛으로 둔 것, 꼭대기에서 보이는 풍경을 화면으로 보여 주는 것,
 *   34:5 뒤로 모세를 보이지 않게 한 것, 애곡 대목의 저녁 빛, 모세와 여호수아의 생김새.
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  BO3D.scene3d = BO3D.scene3d || {};
  BO3D.scene3d['OT-16'] = function (api) {
    var T = THREE, M2 = BO3D.models2 || {}, MO = BO3D.models || {}, PR = BO3D.props, FX = api.FX, R = PR.rng(1634);
    function sm(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
    function hash(ix, iz) { var n = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453; return n - Math.floor(n); }
    function noise(x, z) {
      var ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
      var a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
    var SUM = [60, -3], CAMP = [-176, 12], CAMP_R = 32, RIVER = -300, JER = [-352, 24], JOS = [-132, 8];
    /* 모세가 오르는 길: 진의 가장자리 → 산기슭(아이들이 다니는 곳의 북쪽 바깥) → 꼭대기 */
    var PATH = [[-136, -30], [-104, -38], [-64, -40], [-28, -34], [10, -22], [38, -10], [SUM[0], SUM[1]]], PLEN = [0], k0;
    for (k0 = 1; k0 < PATH.length; k0++) PLEN.push(PLEN[k0 - 1] + Math.hypot(PATH[k0][0] - PATH[k0 - 1][0], PATH[k0][1] - PATH[k0 - 1][1]));
    function pathAt(s) { s = Math.max(0, Math.min(PLEN[PLEN.length - 1], s)); for (var k = 1; k < PATH.length; k++) if (s <= PLEN[k]) { var t = (s - PLEN[k - 1]) / (PLEN[k] - PLEN[k - 1]); return [PATH[k - 1][0] + (PATH[k][0] - PATH[k - 1][0]) * t, PATH[k - 1][1] + (PATH[k][1] - PATH[k - 1][1]) * t, Math.atan2(PATH[k][0] - PATH[k - 1][0], PATH[k][1] - PATH[k - 1][1])]; } return [SUM[0], SUM[1], -Math.PI / 2]; }
    function pathDist(x, z) { var best = 1e9; for (var k = 0; k + 1 < PATH.length; k++) { var a0 = PATH[k], b0 = PATH[k + 1], vx = b0[0] - a0[0], vz = b0[1] - a0[1], t = Math.max(0, Math.min(1, ((x - a0[0]) * vx + (z - a0[1]) * vz) / (vx * vx + vz * vz))); best = Math.min(best, Math.hypot(x - a0[0] - vx * t, z - a0[1] - vz * t)); } return best; }
    /* 땅: 동쪽의 산(꼭대기 약 58m) → 서쪽 평지 → 요단의 낮은 물길 → 여리고의 평지 → 낮은 산지 → 서해 */
    function height(x, z) {
      var r = Math.hypot((x - SUM[0]) / 1.15, (z - SUM[1]) / 1.5), m = sm(105, 6, r);   /* 산의 발치는 x = -61쯤. 그 서쪽은 평지 */
      var h = 58 * Math.pow(m, 1.5) + sm(110, 260, x) * 26 * (1 - m) + 0.7 * noise(x * 0.05 + 2, z * 0.05 + 5) * 0.5 + 9 * (noise(x * 0.035 + 4, z * 0.035) - 0.5) * 4 * m * (1 - m);   /* 산비탈의 굴곡 */
      h -= 2.6 * sm(16, 5, Math.abs(x - RIVER));                                    /* 요단의 물길 */
      h += sm(-390, -450, x) * (4 + 7 * noise(x * 0.02 + 9, z * 0.02) + 24 * sm(110, 300, Math.abs(z)) * (0.5 + noise(x * 0.015, z * 0.015 + 2))) * sm(-600, -530, x);   /* 강 건너의 산지. 가운데(서해 쪽)는 낮다 */   /* 강 건너의 낮은 산지(유다 쪽) */
      h -= sm(-590, -610, x) * 5;                                                    /* 서해 쪽으로 낮아진다 */
      h += sm(260, 420, Math.abs(z)) * 16 * noise(x * 0.012, z * 0.012 + 3) * sm(-560, -480, x);   /* 북쪽·남쪽 먼 땅의 둔덕 */
      return h;
    }
    function walkable(x, z) { return x >= -106 && x <= -68 && z >= -26 && z <= 28; }   /* 산 아래 평지(산비탈에는 오르지 않는다) */

    var scene = new T.Scene();
    scene.background = new T.Color('#EADFC4'); scene.fog = new T.Fog('#E6DCC2', 260, 1250);
    var skyG = new T.SphereGeometry(640, 24, 14), sp = skyG.attributes.position, sc = new Float32Array(sp.count * 3), cc = new T.Color(), top = new T.Color('#6FA6CC'), hor = new T.Color('#F1E6CA'), i;
    for (i = 0; i < sp.count; i++) { var tt = Math.max(0, sp.getY(i) / 640); cc.copy(hor).lerp(top, sm(0.02, 0.7, tt)); sc[i * 3] = cc.r; sc[i * 3 + 1] = cc.g; sc[i * 3 + 2] = cc.b; }
    skyG.setAttribute('color', new T.BufferAttribute(sc, 3));
    var skyM = new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false }), sky = new T.Mesh(skyG, skyM); sky.position.x = -160; scene.add(sky);
    var g = new T.PlaneGeometry(1040, 900, 208, 150); g.rotateX(-Math.PI / 2); g.translate(-200, 0, 0);
    var pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new T.Color(), pl1 = new T.Color('#CDB47C'), pl2 = new T.Color('#BFA66E'), rock = new T.Color('#A58C6A'), rockT = new T.Color('#93806A'), grn = new T.Color('#8E9E58'), far = new T.Color('#8C9A5E'), road = new T.Color('#DCC696');
    for (i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i), y = height(x, z); pos.setY(i, y);
      c.copy(pl1).lerp(pl2, noise(x * 0.07, z * 0.07));
      c.lerp(grn, sm(60, 14, Math.abs(x - RIVER)) * 0.75);                          /* 요단 가의 푸른 띠 */
      if (x < RIVER - 14) c.lerp(grn, sm(90, 20, Math.hypot(x - JER[0], z - JER[1])) * 0.6);   /* 여리고 둘레의 평지 */
      if (x < RIVER - 30) c.lerp(far, 0.35 + 0.5 * noise(x * 0.03, z * 0.03 + 8));   /* 강 건너의 땅은 푸르다 */
      if (y > 4 && x > -60) c.lerp(rock, sm(4, 22, y)); if (y > 40) c.lerp(rockT, sm(40, 58, y)); if (y > 4 && x > -60) c.lerp(rockT, 0.4 * sm(0.45, 0.8, noise(x * 0.11 + 5, z * 0.11)));
      c.lerp(road, sm(3.2, 1.2, pathDist(x, z)) * 0.6);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3)); g.computeVertexNormals();
    var ground = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 })); ground.receiveShadow = true; scene.add(ground);
    /* 요단(멀리 가는 물줄기)과 서해(맨 끝의 옅은 물빛). 물결·기적 없음 */
    var water = new T.MeshStandardMaterial({ color: '#5F9CC0', roughness: 0.35, metalness: 0.05 });
    var jor = new T.Mesh(new T.PlaneGeometry(20, 900), water); jor.rotation.x = -Math.PI / 2; jor.position.set(RIVER, -1.5, 0); scene.add(jor);
    var sea = new T.Mesh(new T.PlaneGeometry(140, 900), new T.MeshStandardMaterial({ color: '#5E96C2', roughness: 0.3 })); sea.rotation.x = -Math.PI / 2; sea.position.set(-664, -2.6, 0); scene.add(sea);
    var hemi = new T.HemisphereLight('#DCEFF2', '#B59A66', 0.64); scene.add(hemi);
    var sun = new T.DirectionalLight('#FFF0CF', 0.74); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    var ss = sun.shadow.camera; ss.left = -26; ss.right = 26; ss.top = 26; ss.bottom = -26; ss.near = 1; ss.far = 150; sun.shadow.bias = -0.0015;
    scene.add(sun); scene.add(sun.target);
    function put(o, x, z, lift) { o.position.set(x, height(x, z) + (lift || 0), z); scene.add(o); return o; }
    function near(x, z, p, r) { return Math.hypot(x - p[0], z - p[1]) < r; }
    var statics = [];
    function keep(o, x, z, lift) { o.position.set(x, height(x, z) + (lift || 0), z); statics.push(o); return o; }
    if (MO.rock) for (i = 0; i < 46; i++) { var ro = MO.rock(1600 + i); ro.scale.multiplyScalar(0.5 + R() * 1.6); var rx = -110 + R() * 260, rz = -150 + R() * 300; if (near(rx, rz, CAMP, CAMP_R + 8) || pathDist(rx, rz) < 4 || near(rx, rz, SUM, 6) || near(rx, rz, JOS, 22)) continue; put(ro, rx, rz, -0.1); }
    if (MO.shrub) for (i = 0; i < 28; i++) { var sh = MO.shrub(160 + i), hx = -260 + R() * 330, hz = -150 + R() * 300; if (near(hx, hz, CAMP, CAMP_R + 8) || pathDist(hx, hz) < 4 || near(hx, hz, JOS, 22)) continue; put(sh, hx, hz, -0.05); }
    /* 모압 평지의 진(민 33:48-49, 신 34:8) */
    for (i = 0; i < 70; i++) { var a = R() * 6.28, rr = Math.sqrt(R()) * CAMP_R, tn = PR.tent(i + 160); keep(tn, CAMP[0] + Math.cos(a) * rr, CAMP[1] + Math.sin(a) * rr * 1.5); tn.rotation.y = R() * 6.28; }
    /* 종려의 성읍 여리고(34:3): 강 건너 멀리 */
    var city = null; try { if (M2.jericho) city = M2.jericho(); } catch (e) { city = null; }
    if (!city) { city = new T.Group(); var w0 = new T.Mesh(new T.BoxGeometry(80, 9, 30), new T.MeshStandardMaterial({ color: '#B8946A', flatShading: true })); w0.position.y = 4.5; city.add(w0); }
    city.rotation.y = Math.PI / 2; put(city, JER[0], JER[1]);
    if (M2.palm) for (i = 0; i < 16; i++) { var pm = M2.palm(i + 30); pm.scale.setScalar(1.3); put(pm, JER[0] + 8 + R() * 26, JER[1] + (R() * 2 - 1) * 70); }
    scene.add(PR.mergeStatic(statics));

    /* 이스라엘 자손(34:8)과 여호수아(34:9): 진의 동쪽 가장자리에, 멀리서 */
    var crowd = [];
    for (i = 0; i < 40; i++) {
      var o = null; try { if (M2.israelite) o = M2.israelite(i * 19 + 7); } catch (e2) { o = null; }
      if (!o) o = PR.soldier(i, '#7A6A4A', null);
      put(o.group, JOS[0] - 5 - hash(i, 1) * 16, JOS[1] - 11 + hash(i, 2) * 22); o.ry = hash(i, 3) * 6.28; o.group.rotation.y = o.ry; crowd.push(o);
    }
    var joshua = { group: api.fallback('#4E6A4A', 1.75, 0.27), update: function () {} }, moses = { group: api.fallback('#9C5438', 1.75, 0.27), update: function () {} };
    put(joshua.group, JOS[0], JOS[1]); joshua.group.rotation.y = -Math.PI / 2; put(moses.group, PATH[0][0], PATH[0][1]);
    function swap(holder, nm) { nm.group.position.copy(holder.group.position); nm.group.rotation.copy(holder.group.rotation); nm.group.visible = holder.group.visible; scene.remove(holder.group); scene.add(nm.group); return nm; }
    api.person(BO3D.glbData && BO3D.glbData.moses_nebo ? 'moses_nebo' : 'moses', function (nm) { moses = swap(moses, nm); });   /* 지팡이 없는 모세(신 34:7) */
    api.person('joshua', function (nm) { joshua = swap(joshua, nm); });

    var phase = 'idle', climbS = 0, climbing = false, tod = 0, todWant = 0, panT = 0, mourn = false, ca = new T.Color(), cb = new T.Color();
    var TOD = [['#EADFC4', '#FFFFFF', 0.64, 0.74, '#FFF0CF'], ['#EBC79C', '#F0C8A0', 0.56, 0.6, '#FFC48A'], ['#8E8AA0', '#9A94B4', 0.44, 0.3, '#C8B4D8']];   /* 0 낮, 1 기운 해, 2 저녁 */
    function applyTod() {
      var k = Math.min(1.999, Math.max(0, tod)), A = TOD[Math.floor(k)], B = TOD[Math.floor(k) + 1], t = k - Math.floor(k);
      ca.set(A[0]); cb.set(B[0]); ca.lerp(cb, t); scene.background.copy(ca); scene.fog.color.copy(ca);
      ca.set(A[1]); cb.set(B[1]); skyM.color.copy(ca.lerp(cb, t)); hemi.intensity = A[2] + (B[2] - A[2]) * t; sun.intensity = A[3] + (B[3] - A[3]) * t; ca.set(A[4]); cb.set(B[4]); sun.color.copy(ca.lerp(cb, t));
    }
    function mosesAt(s) { var q = pathAt(s); moses.group.position.set(q[0], height(q[0], q[1]), q[1]); moses.group.rotation.y = q[2]; }
    /* 대목마다 모든 상태를 처음부터 정한다 */
    function setPhase(p) {
      phase = p; climbing = false; mourn = false; panT = 0; moses.group.visible = true; todWant = 0;
      if (p === 'idle') { climbS = 0; mosesAt(0); tod = 0; applyTod(); }
      if (p === 'climb') { climbS = Math.max(climbS, 0); climbing = true; }                                  /* 34:1 */
      if (p === 'top' || p === 'word') { climbS = PLEN[PLEN.length - 1]; mosesAt(climbS); moses.group.rotation.y = -Math.PI / 2; }   /* 34:1-4: 꼭대기에서 서쪽을 본다 */
      if (p === 'gone' || p === 'mourn' || p === 'after') { moses.group.visible = false; todWant = p === 'mourn' ? 2 : 1; mourn = p === 'mourn'; }   /* 34:5 뒤: 모세는 보이지 않는다 */
    }
    function v3(x, y, z) { return new T.Vector3(x, y, z); }
    /* 지켜보기 카메라: 틀이 화면을 위로 20% 올려 주므로 볼 것(t)을 거의 그대로 겨눈다 */
    function cam(p, up, t) {
      var py = height(p[0], p[1]) + up, d = Math.hypot(t[0] - p[0], t[2] - p[1]), el = Math.atan2(t[1] + height(t[0], t[2]) - py, d) - 0.04;
      return { pos: [p[0], py, p[1]], look: [t[0], py + d * Math.tan(el), t[2]] };
    }
    if (FX) FX.sortLayers(scene);
    var PH = ['climb', 'top', 'word', 'gone', 'mourn', 'after'];

    return {
      id: 'OT-16', scene: scene, sun: sun, sunOff: [-32, 50, 28],
      height: height, walkable: walkable,
      edge: function (x, z) {
        if (x > -68) return { who: 'onwoo', text: '산 위로는 따라가지 말자. 그 땅을 보이시는 것은 여호와께서 모세에게 하시는 일이야.' };
        if (x < -106) return { who: 'hyu', text: '진 안쪽으로는 들어가지 말자. 우리는 떨어져서 지켜보는 사람이야.' };
        if (z < -26) return { who: 'hyu', text: '저 길은 모세가 산으로 오르는 길이야. 길은 비워 두자.' };
        return { who: 'hyu', text: '여기서 너무 멀리 가지는 말자.' };
      },
      P: { start: [-86, 8], machine: [-80, 18], machineRot: 1.9,
        /* 재료가 놓인 곳(quests[i].found): 느보 산 쪽 산 아래의 빈 땅(모세가 오르는 길에서 16m 넘게 떨어짐) / 모압 평지 쪽 / 평지 끝 산 아래의 빈 땅 */
        parts: [[-74, -22], [-102, 20], [-71, 8]], lookSpot: [-71, 8],
        look: { focus: SUM, mid: [10, -12], dy: 3, backE: 7, upE: 2.4 } },
      eventCam: function (i) {
        var hs = height(SUM[0], SUM[1]);
        if (i === 1) { var u = sm(1.5, 22, panT), zz = -300 + 600 * u, dl = Math.hypot(390, zz), dx = -390 / dl, dz = zz / dl; return { pos: [SUM[0] - dx * 5.5 - dz * 1.2, hs + 2.7, SUM[1] - dz * 5.5 + dx * 1.2], look: [SUM[0] - 390, hs - 56, SUM[1] + zz] }; }   /* 34:1-3: 건너편의 땅을 한쪽 끝에서 다른 쪽 끝까지 천천히 둘러본다 */
        if (i === 2) return { pos: [SUM[0] + 6.6, hs + 4.3, SUM[1] + 0.9], look: [JER[0] + 30, hs - 62, JER[1] - 6] };   /* 34:4: 모세의 뒷모습 너머로 요단과 건너편의 땅 */                                                                    /* 34:4: 건너편의 땅 */
        if (i === 3) return cam([-150, 90], 18, [SUM[0] - 30, 16, SUM[1]]);                                                                                                     /* 34:5-7: 산 아래에서 올려다본다. 꼭대기는 비어 있다 */
        if (i === 4) return cam([JOS[0] + 20, 22], 5, [JOS[0] - 8, 1.2, JOS[1]]);                                                                                                   /* 34:8-9 */
        if (i === 5) return cam([-200, 46], 22, [SUM[0] - 60, 6, SUM[1]]);                                                                                                   /* 34:10-12 */
        return null;
      },
      detector: '탐지기', askLabel: '탐지기 물음 풀기',
      intro: { text: '타임머신이 넓은 평지 끝, 산 아래에 내려앉았어요. 동쪽에는 높은 산이, 서쪽 평지에는 장막들이 보여요.', say: { who: 'hyu', text: '우리는 산 아래에서만 다니자.' } },
      lookText: '느보 산 이야기를 성경에서 찾아 읽은 뒤 다시 골라 보세요.',
      partBeats: [0, null], eventStart: 1,
      beatNote: function (i) {
        if (i === 1 || i === 2) return '우리는 산 아래에 있어요. 비스가 꼭대기에서 보이는 땅은 화면으로만 봐요. 실제 땅은 훨씬 넓고 멀어요.';
        if (i === 4) return '이 뒤로 모세의 모습은 보여 주지 않아요. 백성 앞에 선 사람은 눈의 아들 여호수아예요.';
        if (i >= 3) return '성경은 여기까지 말해요. 이 뒤로 모세의 모습은 보여 주지 않아요.';
        return null;
      },
      sceneDoneText: '느보 산 이야기를 끝까지 지켜봐야 떠날 수 있어요.',
      dex: [
        { id: 'nebo', name: '느보 산 비스가 꼭대기', desc: '모세가 모압 평지에서 올라간, 여리고 맞은편의 산꼭대기', ref: '신 34:1', hint: '동쪽의 높은 산을 담아 보세요.', range: 400, crop: 0.7, pos: function () { return v3(SUM[0], height(SUM[0], SUM[1]) - 6, SUM[1]); } },
        { id: 'moses', name: '모세', desc: '죽을 때 백이십 세였으나 눈이 흐리지 않았고 기력이 쇠하지 않았다', ref: '신 34:7', hint: '산으로 오르는 길을 보세요.', range: 220, crop: 0.3,
          visible: function () { return moses.group.visible; }, pos: function () { return v3(moses.group.position.x, moses.group.position.y + 1.1, moses.group.position.z); } },
        { id: 'camp', name: '모압 평지의 진', desc: '이스라엘 자손은 모압 평지에서 삼십 일 동안 모세를 위해 애곡했다', ref: '신 34:8', hint: '서쪽 평지의 장막들을 담아 보세요.', range: 200, pos: function () { return v3(CAMP[0], 1.5, CAMP[1]); } },
        { id: 'joshua', name: '눈의 아들 여호수아', desc: '모세가 안수했으므로 지혜의 영이 충만했다', ref: '신 34:9', hint: '진의 가장자리, 백성 앞에 서 있어요.', range: 60, crop: 0.3, pos: function () { return v3(JOS[0], height(JOS[0], JOS[1]) + 1.1, JOS[1]); } },
        { id: 'jericho', name: '종려의 성읍 여리고', desc: '여호와께서 모세에게 보이신 땅 가운데, 여리고 골짜기의 평지', ref: '신 34:3', hint: '서쪽 평지 너머 멀리 보이는 성읍이에요.', range: 700, crop: 0.5, pos: function () { return v3(JER[0], height(JER[0], JER[1]) + 5, JER[1]); } }
      ],
      reset: function () { setPhase('idle'); },
      partFound: function (i) { if (i === 0) setPhase('climb'); },
      partContinue: function () {},
      lookupPose: function () {},
      /* 대목 번호(OT-16.json): 0 = 34:1, 1 = 34:1-3, 2 = 34:4, 3 = 34:5-7, 4 = 34:8-9, 5 = 34:10-12 */
      beatPose: function (i) { setPhase(PH[i] || 'idle'); },
      update: function (dt, now) {
        if (Math.abs(tod - todWant) > 0.003) { tod += (todWant - tod) * Math.min(1, dt * 1.2); applyTod(); }
        var mv = false;
        if (climbing && climbS < PLEN[PLEN.length - 1]) { climbS = Math.min(PLEN[PLEN.length - 1], climbS + 2.3 * dt); mosesAt(climbS); mv = true; if (climbS >= PLEN[PLEN.length - 1]) moses.group.rotation.y = -Math.PI / 2; }
        if (phase === 'top') panT += dt;
        if (moses.update) moses.update(dt, mv);
        if (joshua.update) joshua.update(dt, false);
        crowd.forEach(function (o) {
          var want = mourn || phase === 'after' ? Math.atan2(JOS[0] - o.group.position.x, JOS[1] - o.group.position.z) : o.ry;   /* 34:9: 여호수아의 말을 듣는다 */
          o.group.rotation.y = want; if (o.update) o.update(dt, 0, now);
        });
      },
      audio: function (A) { A.setFlock(999); A.setFire(999); },
      menuCam: function (camera, now) { var a2 = now * 0.05; camera.position.set(-96 + Math.sin(a2) * 6, 7, 26); camera.lookAt(SUM[0], 30, SUM[1]); },
      debug: { phase: function () { return { phase: phase, tod: tod, climbS: climbS, moses: moses.group.visible, panT: panT }; }, arrived: function () { return phase !== 'idle'; } }
    };
  };
})();
