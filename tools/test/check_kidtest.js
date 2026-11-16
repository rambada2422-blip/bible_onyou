#!/usr/bin/env node
/* 아이 시험 집계 도구의 계산 시험 (갈래 pack). node tools/test/check_kidtest.js
 * docs/아이시험/집계도구.html 안의 계산 부분(<script id="calc">)을 꺼내 꾸민 자료로 돌려, docs/12_아이시험_계획.md의 통과 기준·판정과 같은지 본다. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..', '..');
const html = fs.readFileSync(path.join(ROOT, 'docs/아이시험/집계도구.html'), 'utf8');
const src = html.match(/<script id="calc">([\s\S]*?)<\/script>/)[1];
const mod = { exports: {} }; vm.runInNewContext(src, { module: mod, Math, JSON, Number, Object, Array, isNaN, Error });
const C = mod.exports;
let fail = 0; const ok = (c, m) => { console.log((c ? '통과 ' : '실패 ') + m); if (!c) fail++; };
const Z = (o) => Object.assign({ no: '', child: 1, tier: 't1', ver: 'new', seg: 1 }, Object.fromEntries(C.FIELDS.map((k) => [k, 0])), o);
const it = (o) => C.items(C.pool([Z(o)]));

/* 1) 돕기 단계 지도가 지금 장면 자료와 같은가 */
const map = {};
for (let i = 1; i <= 40; i++) { const id = 'OT-' + String(i).padStart(2, '0'); const st = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/ot', id + '.json'), 'utf8')).mission.help.steps; map[id] = { d: st.map((s, j) => (s.kind === 'do' ? j : -1)).filter((j) => j >= 0), a: st.map((s, j) => (s.kind === 'ask' ? j : -1)).filter((j) => j >= 0) }; }
ok(JSON.stringify(map) === JSON.stringify(C.HELPMAP), '돕기·뜻 묻기 단계 번호가 장면 자료(content/ot)와 같다');

/* 2) 놀이 기록 읽기: 손으로 센 값과 견줌 */
const t = 1700000000000;
const log = [
  { w: 'OT-10 arrive', ms: 5000, at: t }, { w: 'OT-10 beat0', ms: 1500, at: t + 5000 }, { w: 'OT-10 beat1', ms: 1900, at: t + 6500 }, { w: 'OT-10 beat4', ms: 8000, at: t + 8400 },
  { w: 'OT-10 help0', ms: 4000, at: t + 16400 }, { w: 'OT-10 help1', ms: 12000, at: t + 20400 }, { w: 'OT-10 help3', ms: 21000, at: t + 32400 },
  { w: 'OT-10 gate0', ms: 40000, at: t + 53400 }, { w: 'OT-10 gate1', ms: 50000, at: t + 93400 }, { w: 'OT-10 help4', ms: 30000, at: t + 143400 },
  { w: 'OT-10 mat0', ms: 9000, at: t + 173400 }, { w: 'OT-10 seek-found', ms: 3000, at: t + 182400 }, { w: 'OT-10 today0', ms: 7000, at: t + 185400 }, { w: 'OT-10 finish', ms: 18000, at: t + 192400 },
  { w: 'OT-10 finish', exit: 1, at: t + 210400 }, { w: 'OT-11 arrive', ms: 1000, at: t + 700000 }, { w: 'OT-11 finish', ms: 4000, at: t + 701000 }, { w: 'map', ms: 500, at: t + 705000 }
];
const r = C.fromLog(JSON.stringify(log));
ok(r.screens === 15 && r.quick === 3, '본 화면 15(재료 찾은 순간 표시는 세지 않음), 2초 안 넘김 3 (얻은 값 ' + r.screens + ', ' + r.quick + ')');
ok(r.doN === 2 && r.doFast === 1, '돕기 2(help1·help3), 15초 안 1 (얻은 값 ' + r.doN + ', ' + r.doFast + ')');
ok(r.qN === 3 && r.qSec === 120, '장절 물음 3(관문 2 + 뜻 묻기 1), 합 120초 (얻은 값 ' + r.qN + ', ' + r.qSec + ')');
ok(r.matGot === 1 && r.closeN === 2 && r.closeSec === 22 && r.sceneDone === 2 && r.fin10 === 1, '재료 1, 마무리 2회 22초, 마친 장면 2, 10분 안 1 (얻은 값 ' + [r.matGot, r.closeN, r.closeSec, r.sceneDone, r.fin10].join(', ') + ')');
let threw = false; try { C.fromLog('{"a":1}'); } catch (e) { threw = true; } ok(threw, '목록이 아닌 글은 받지 않는다');

/* 3) 항목별 통과 기준의 경계 */
ok(it({ wrong: 1, quit10: 0, wrongDone: 1 })[0].pass === null, '항목 1: 오답 화면이 1회면 기회 없음');
ok(it({ wrong: 5, quit10: 1, wrongDone: 4 })[0].pass === true, '항목 1: 포기 20%·끝까지 80%는 통과(경계)');
ok(it({ wrong: 5, quit10: 2, wrongDone: 4 })[0].pass === false, '항목 1: 포기 40%는 미달');
ok(it({ wrong: 5, quit10: 1, wrongDone: 3 })[0].pass === false, '항목 1: 끝까지 60%는 미달');
ok(it({ matGot: 0 })[1].pass === null, '항목 2: 재료 0회면 기회 없음');
ok(it({ matGot: 1, opened: 1, sceneDone: 4, nextPicked: 3 })[1].pass === true, '항목 2: 1회 엶·75%는 통과(경계)');
ok(it({ matGot: 1, opened: 0, sceneDone: 4, nextPicked: 4 })[1].pass === false, '항목 2: 스스로 연 적 없으면 미달');
ok(it({ matGot: 1, opened: 2, sceneDone: 4, nextPicked: 2 })[1].pass === false, '항목 2: 다음 장면 50%는 미달');
ok(it({ screens: 20, quick: 3, doN: 5, doFast: 4 })[2].pass === true, '항목 3: 2초 15%·돕기 80%는 통과(경계)');
ok(it({ screens: 20, quick: 4, doN: 5, doFast: 5 })[2].pass === false, '항목 3: 2초 20%는 미달');
ok(it({ screens: 20, quick: 1, doN: 5, doFast: 3 })[2].pass === false, '항목 3: 돕기 60%는 미달');
ok(it({ screens: 20, quick: 1 })[2].pass === true, '항목 3: 돕기 단계가 없으면 2초 넘김만으로 본다');
ok(it({ climaxN: 20, climaxSkip: 3, closeN: 2, closeSec: 30 })[3].pass === true, '항목 4: 85%·평균 15초는 통과(경계)');
ok(it({ climaxN: 20, climaxSkip: 4, closeN: 2, closeSec: 40 })[3].pass === false, '항목 4: 80%는 미달');
ok(it({ climaxN: 2, climaxSkip: 0, closeN: 2, closeSec: 20 })[3].pass === false, '항목 4: 마무리 평균 10초는 미달');
ok(it({})[3].pass === null, '항목 4: 절정도 마무리도 없으면 기회 없음');
ok(it({ qN: 4, qSec: 180, fin10: 1 })[4].pass === true, '항목 5: 평균 45초·1장면은 통과(경계)');
ok(it({ qN: 4, qSec: 184, fin10: 1 })[4].pass === false, '항목 5: 평균 46초는 미달');
ok(it({ qN: 4, qSec: 100, fin10: 0 })[4].pass === false, '항목 5: 10분 안에 마친 장면이 없으면 미달');

/* 3.5) 앞뒤가 안 맞는 수 */
ok(C.checkInput(Z({ wrong: 2, wrongDone: 5 })).length > 0 && C.checkInput(Z({ climaxN: 1, climaxSkip: 3 })).length > 0 && C.checkInput(Z({ screens: 5, quick: 9 })).length > 0, '그중 칸이 전체보다 크면 받지 않는다(끝까지 5/오답 2, 그만둠 3/들어감 1, 넘김 9/화면 5)');
ok(C.checkInput(Z({ closeSec: 4 })).length > 0, '마무리 초만 있고 마무리 화면 수가 0이면 받지 않는다');
ok(C.checkInput(Z({ wrong: 5, quit10: 1, wrongDone: 4, screens: 20, quick: 3, closeN: 1, closeSec: 20 })).length === 0, '앞뒤가 맞는 수는 받는다');
ok(C.RELIABLE.indexOf('closeSec') < 0 && C.RELIABLE.indexOf('doFast') < 0 && C.RELIABLE.indexOf('fin10') < 0 && C.RELIABLE.indexOf('sceneDone') < 0, '놀이 기록에서 마무리 초·돕기 15초·마친 장면·10분 안은 자동으로 채우지 않는다(3D를 걸은 시간이 섞임)');
(function () { const one = { matGot: 1, opened: 1, sceneDone: 1, nextPicked: 1, qN: 2, qSec: 60, fin10: 1 }, none = { matGot: 1, opened: 0, sceneDone: 0, nextPicked: 0, qN: 2, qSec: 60, fin10: 0 };
  const L = [1, 2, 3, 4, 5, 6].map((c) => Z(Object.assign({ child: c }, c === 1 ? one : none)));
  const pc = C.perChild(L); ok(pc[1].pass === 1 && pc[1].chance === 6 && pc[4].pass === 1, '아이별로 보면: 6명 가운데 1명만 열고 마친 경우 항목 2·5는 1명만 통과로 나온다'); })();

/* 4) 판정 */
const demo = C.demoData();
const P = (v) => C.pool(demo.filter((x) => x.ver === v));
const v1 = C.verdict(P('prev'), P('new'));
ok(v1.code === 'A' && v1.passN === 5, '꾸민 자료(개선 판이 좋은 경우): 통과 5/5, 2초 넘김 45% → 10% → "진단이 맞았다" (얻은 값 ' + v1.code + ', ' + v1.passN + ')');
ok(C.items(P('prev')).filter((x) => x.pass === true).length === 0, '꾸민 자료의 앞 판은 통과 0');
const mk = (o) => C.pool([Z(o)]);
const good = { wrong: 5, quit10: 0, wrongDone: 5, matGot: 1, opened: 1, sceneDone: 1, nextPicked: 1, screens: 100, quick: 10, doN: 1, doFast: 1, climaxN: 1, closeN: 1, closeSec: 20, qN: 2, qSec: 60, fin10: 1 };
ok(C.verdict(mk({ screens: 100, quick: 20 }), mk(good)).code === 'A', '판정 A: 4개 이상 통과 + 2초 넘김이 꼭 절반(20% → 10%)이면 맞음');
ok(C.verdict(mk({ screens: 100, quick: 19 }), mk(good)).code === 'none', '판정: 2초 넘김이 절반보다 많으면(19% → 10%) A가 아님');
ok(C.verdict(mk({ screens: 100, quick: 40 }), mk(Object.assign({}, good, { quit10: 3, opened: 0 }))).code === 'none', '판정: 통과가 3개면 A가 아님');
const bad = Object.assign({}, good, { qN: 2, qSec: 122, quitAll: 4, quitBible: 2 });
ok(C.verdict(mk({ screens: 100, quick: 10 }), mk(bad)).code === 'B', '판정 B: 물음 평균 61초 + 포기의 절반이 성경 찾던 순간이면 반대 가설');
ok(C.verdict(mk({ screens: 100, quick: 10 }), mk(Object.assign({}, bad, { qSec: 120 }))).code === 'none', '판정: 평균이 꼭 60초면 B가 아님(60초를 넘어야 함)');
ok(C.verdict(mk({ screens: 100, quick: 10 }), mk(Object.assign({}, bad, { quitBible: 1 }))).code === 'none', '판정: 성경 찾던 순간이 포기의 25%면 B가 아님');
ok(C.verdict(mk({ screens: 100, quick: 40 }), mk(bad)).code === 'both', '두 조건이 함께 맞으면 "사람이 정한다"');
ok(C.verdict(mk({}), mk(good)).code === 'none', '앞 판 자료가 없으면 견줄 수 없어 A가 아님');

/* 5) 표본 확인 */
ok(C.sampleWarnings(demo).length === 0, '꾸민 자료(6명, 단계마다 2명, 번갈아 보기)는 표본 경고 없음');
const w = C.sampleWarnings(demo.filter((x) => x.child <= 3));
ok(w.some((x) => /6명 이상/.test(x)) && w.some((x) => /14~19세/.test(x)), '3명만 넣으면 인원·나이 단계 경고가 나온다');
ok(C.sampleWarnings(demo.map((x) => Object.assign({}, x, { seg: 3 - x.seg }))).some((x) => /홀수/.test(x)), '번갈아 보는 순서가 뒤집히면 경고가 나온다');
ok(!/이름|연락처|사진/.test(JSON.stringify(demo)) && !/id="name"|type="email"|type="tel"/.test(html), '도구에 이름·연락처·사진을 받는 칸이 없다');
console.log(fail ? '\n실패 ' + fail + '건' : '\n모두 통과');
process.exit(fail ? 1 : 0);
