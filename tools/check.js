#!/usr/bin/env node
/* 한 줄 점검. 작업을 넘기기 전에 어느 AI든 이 명령을 돌리고 마지막 요약을 진행판에 적는다.
 *   node tools/check.js          빠른 점검: 문법, 묶기(빌드), 바뀐 파일 목록
 *   node tools/check.js --full   전체 점검: 위에 더해 게임을 처음부터 끝까지 자동으로 조작 (10~25분)
 * 마지막 줄이 "점검 결과: 합격"이면 통과다. 화면 사진은 dist/check/ 에 남는다.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const full = process.argv.includes('--full');
const rows = [];
const add = (name, state, note) => { rows.push([name, state, note || '']); console.log(state, name, note ? '· ' + note : ''); };
const run = (args, ms) => spawnSync('node', args, { cwd: root, encoding: 'utf8', timeout: ms || 120000 });
const last = (s) => (s || '').trim().split('\n').filter(Boolean).slice(-3).join(' / ').slice(0, 300);

/* 1. 문법 */
const skip = (f) => /vendor|art\.js$|avatars\.js$|glbdata\.js$/.test(f);
const jsFiles = [];
for (const dir of ['web/js', 'web3d/js', 'tools', 'tools/test']) {
  const d = path.join(root, dir);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d)) if (f.endsWith('.js') && !skip(f)) jsFiles.push(path.join(dir, f));
}
const bad = jsFiles.filter((f) => run(['--check', f]).status !== 0);
add('문법 (' + jsFiles.length + '개 파일)', bad.length ? '❌' : '✅', bad.join(', '));

/* 2. 묶기 */
for (const b of ['tools/build.js', 'tools/build3d.js']) {
  const r = run([b]);
  add('묶기 ' + b, r.status === 0 ? '✅' : '❌', r.status === 0 ? '' : last(r.stderr || r.stdout));
}

/* 3. 바뀐 파일 (main과 비교). 내용 파일이 바뀌었으면 알린다 */
const guarded = ['web/js/content.js', 'web3d/js/content3d.js', 'docs/00_공통규칙서.md', 'docs/01_출애굽기_장면목록.md'];
let changed = [];
try {
  const git = (a) => { const r = spawnSync('git', ['-c', 'core.quotepath=off'].concat(a), { cwd: root, encoding: 'utf8' }); if (r.status !== 0) throw new Error('git'); return r.stdout.split('\n').filter(Boolean); };
  let base = '';
  for (const b of ['origin/main', 'main']) { try { git(['rev-parse', '--verify', '-q', b]); base = b; break; } catch (e) { /* 다음 후보 */ } }
  const set = new Set();
  if (base) git(['diff', '--name-only', base + '...HEAD']).forEach((f) => set.add(f));
  git(['status', '--porcelain']).forEach((l) => set.add(l.slice(3).replace(/^"|"$/g, '')));
  changed = [...set];
  add('바뀐 파일 ' + changed.length + '개', '✅', changed.slice(0, 12).join(', ') + (changed.length > 12 ? ' …' : ''));
  const hit = changed.filter((f) => guarded.includes(f));
  if (hit.length) add('내용 파일이 바뀜', '⚠️', hit.join(', ') + ' → Claude가 쓰고 별도 검증을 거쳐야 한다 (AGENTS.md 업무 분담)');
} catch (e) { add('바뀐 파일', '⚠️', 'git을 쓸 수 없어 확인하지 못함'); }

/* 4. 전체 점검: 자동 조작 */
if (full) {
  let hasPw = true;
  try { require.resolve('playwright'); } catch (e) { hasPw = false; }
  if (!hasPw) add('자동 조작', '⚠️', 'Playwright가 없어 실행하지 못함. 통과로 치지 않는다');
  else {
    const out = path.join(root, 'dist/check');
    fs.rmSync(out, { recursive: true, force: true });
    const walks = [
      ['2D 시범판', ['tools/test/walk2d.js', '1', '모세', path.join(out, '2d')]],
      ['2D 호렙 현장·말씀 인장', ['tools/test/full/horeb-witness2d.js', path.join(out, 'horeb2d')]],
      ['홍해 본편', ['tools/test/red-sea.js', path.join(out, 'red-sea')]],
      ['광야·시내산 본편', ['tools/test/wilderness.js', path.join(out, 'wilderness')]],
      ['출애굽기 수첩', ['tools/test/exodus-trail.js', path.join(out, 'exodus-trail')]],
      ['사진형 배경', ['tools/test/bgraster.js', path.join(out, 'bgraster')]],
      ['3D 호렙 산', ['tools/test/walk3d.js', '1', path.join(out, 'horeb')]],
      ['3D 요단 강', ['tools/test/walkJ.js', '1', path.join(out, 'jordan')]],
      ['첫 왕궁과 나일 강가', ['tools/test/full/palace-first.js', path.join(out, 'palace-first')]]
    ];
    for (const [name, args] of walks) {
      const t0 = Date.now();
      const r = run(args, 20 * 60 * 1000);
      const text = (r.stdout || '') + (r.stderr || '');
      const ok = r.status === 0 && /no errors/.test(text) && !/\nERR |FAIL/.test(text);
      add('자동 조작 ' + name, ok ? '✅' : '❌', Math.round((Date.now() - t0) / 1000) + '초' + (ok ? '' : ' · ' + (r.error ? String(r.error.message) : last(text))));
    }
  }
}

const fail = rows.filter((r) => r[1] === '❌').length;
const warn = rows.filter((r) => r[1] === '⚠️').length;
console.log('\n점검 종류: ' + (full ? '전체' : '빠른') + ' · 통과 ' + rows.filter((r) => r[1] === '✅').length + '/' + rows.length + (warn ? ' · 확인 필요 ' + warn : ''));
console.log('점검 결과: ' + (fail ? '불합격' : warn ? '합격 (확인 필요 ' + warn + '건)' : '합격'));
process.exit(fail ? 1 : 0);
