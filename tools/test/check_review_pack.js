#!/usr/bin/env node
/* 감수 자료 검사 (갈래 pack). node tools/test/check_review_pack.js
 *  1) 생성기를 다시 돌려도 파일이 바뀌지 않는가(= 저장소의 자료가 지금 장면 자료와 같은가)
 *  2) 장면 자료(content/ot/OT-NN.json)의 모든 글이 감수 자료에 "글자 그대로" 들어 있는가
 *     — 생성기와 따로, JSON의 글 잎을 모두 훑어 화면용 HTML·인쇄용 HTML 두 개·md에서 찾는다
 *  3) 뽑은 수가 진행표의 수와 맞는가, 표시 칸 수가 항목 목록과 같은가, 성경 본문 폴더(ref/)를 읽지 않는가
 */
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.join(__dirname, '..', '..'), OUT = path.join(ROOT, 'docs', '감수');
let fail = 0;
const ok = (c, msg) => { console.log((c ? '통과 ' : '실패 ') + msg); if (!c) fail++; };
const files = ['README.md', '감수자료.html', '감수자료_인쇄용.html', '먼저볼30_인쇄용.html', '참고_장면전체글_인쇄용.html', '항목목록.json', '미해결_전체.md']
  .concat(Array.from({ length: 10 }, (_, i) => 'md/시대' + String(i + 1).padStart(2, '0') + '.md'));
const before = files.map((f) => fs.readFileSync(path.join(OUT, f), 'utf8'));
const run = cp.spawnSync('node', [path.join(ROOT, 'tools/make_review_pack.js')], { encoding: 'utf8' });
ok(run.status === 0, '생성기가 오류 없이 돈다');
const after = files.map((f) => fs.readFileSync(path.join(OUT, f), 'utf8'));
const changed = files.filter((f, i) => before[i] !== after[i]);
ok(changed.length === 0, '다시 만들어도 파일이 같다' + (changed.length ? ' (바뀐 파일: ' + changed.join(', ') + ' → 다시 커밋해야 함)' : ''));

const text = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, '\n').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const A = (f) => after[files.indexOf(f)];
const screen = text(A('감수자료.html'));
const print = text(A('감수자료_인쇄용.html')) + text(A('참고_장면전체글_인쇄용.html'));
const md = files.filter((f) => f.startsWith('md/')).map(A).join('\n') + A('README.md');

/* 글이 아닌 값(종류·열쇠·이름표)과, 자료에 싣지 않기로 한 것 */
const SKIP_KEYS = new Set(['id', 'key', 'focus', 'type', 'kind', 'who', 'when', 'status', 'sources', 'open']);
let leaves = 0; const miss = { screen: [], print: [], md: [] };
function walk(o, p, key, sid) {
  if (Array.isArray(o)) return o.forEach((x, i) => walk(x, p + '[' + i + ']', key, sid));
  if (o && typeof o === 'object') return Object.keys(o).forEach((k) => walk(o[k], p + '.' + k, k, sid));
  if (typeof o !== 'string' || o === '' || (key === 'after' && o === 'gates')) return;
  if (SKIP_KEYS.has(key) && !(key === 'who' && /\.(help|companion)\.who$/.test(p)) && !(key === 'open' && /talks\[\d+\]\.open$/.test(p))) return;
  leaves++;
  if (!screen.includes(o)) miss.screen.push(sid + p);
  if (!print.includes(o)) miss.print.push(sid + p);
  if (!md.includes(o)) miss.md.push(sid + p);
}
for (let i = 1; i <= 40; i++) { const id = 'OT-' + String(i).padStart(2, '0'); walk(JSON.parse(fs.readFileSync(path.join(ROOT, 'content/ot', id + '.json'), 'utf8')), '', '', id); }
const eras = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/ot/eras.json'), 'utf8'));
walk({ story: eras.story, eras: eras.eras.map((e) => ({ intro: e.intro, between: e.between })) }, '', '', 'eras');
['screen', 'print', 'md'].forEach((k) => ok(miss[k].length === 0, '장면 자료의 글 ' + leaves + '개가 ' + { screen: '화면용 HTML', print: '인쇄용 HTML(감수자료 + 참고)', md: 'md' }[k] + '에 글자 그대로 있다' + (miss[k].length ? ' — 빠진 것 ' + miss[k].length + '개: ' + miss[k].slice(0, 8).join(', ') : '')));

const list = JSON.parse(A('항목목록.json'));
ok(list.counts.every((c) => c.ok), '뽑은 수가 진행표·장면표의 수와 맞다 (' + list.counts.filter((c) => c.expect !== '—').map((c) => c.name + ' ' + c.got).join(', ') + ')');
const core = list.items.filter((x) => x.core).length;
const mk = (A('감수자료.html').match(/class="mk"/g) || []).length;
ok(mk === core, '화면용의 표시 칸 수(' + mk + ')가 표시 항목 수(' + core + ')와 같다');
const pm = (A('감수자료_인쇄용.html').match(/class="pm"/g) || []).length + (A('참고_장면전체글_인쇄용.html').match(/class="pm"/g) || []).length;
ok(pm === core + 30, '인쇄용 두 파일의 표시 칸 수(' + pm + ')가 표시 항목 수 + 먼저 볼 30에 한 번 더 실린 30(' + (core + 30) + ')과 같다');
ok(list.items.filter((x) => x.first30).length === 30, '먼저 볼 항목이 30개다');
ok(new Set(list.items.map((x) => x.id)).size === list.items.length, '항목 번호가 겹치지 않는다 (' + list.items.length + '개)');
const gen = fs.readFileSync(path.join(ROOT, 'tools/make_review_pack.js'), 'utf8');
ok(!/['"`]ref\//.test(gen) && !/bible_ref/.test(gen), '생성기가 성경 본문(ref/)을 읽지 않는다');
ok(!/감수 완료/.test(after.join('\n').replace(/감수 완료\(날짜, 감수자\)/g, '')), '어디에도 "감수 완료"라고 쓰지 않았다');
console.log(fail ? '\n실패 ' + fail + '건' : '\n모두 통과');
process.exit(fail ? 1 : 0);
