// Run with node tools/build-genesis-review.js. Only dist/ receives the review files.
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const schedule = 'docs/창세기/창세기_본편_회차표.md';
const g06 = 'docs/창세기/G06.md';
const changes = [
  { episode: 51, before: '유다 집안에 지켜지지 않은 약속과', after: '유다가 기다리라고 한 말과 셀라가 자란 뒤의 일을 살펴보고,', ref: '창 38:11, 14, 25–26' },
  { episode: 54, before: '언제 요셉을 떠올렸는지', after: '언제 요셉의 일을 바로에게 말했는지', ref: '창 41:8–13' },
  { episode: 56, before: '누가 집에 남았는지', after: '누가 아버지 곁에 남았는지', ref: '창 42:3–4, 24' },
  { episode: 57, before: '유다가 한 약속을', after: '유다가 아버지에게 한 말을', ref: '창 43:8–9, 15' }
];
const beforeLine = '요셉은 서른 살에 바로 왕을 섬기게 되었어요. 그 뒤 요셉은 애굽 온 땅을 두루 다녔어요.';
const afterLine = beforeLine.replace('서른 살에 ', '');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function verify(condition, message) {
  if (!condition) throw new Error(message);
}
function patchFor(file, original, candidate, tmp) {
  for (const [side, content] of [['a', original], ['b', candidate]]) {
    const dest = path.join(tmp, side, file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, content);
  }
  const result = spawnSync('git', ['-c', 'core.quotepath=false', 'diff', '--no-index', '--no-prefix',
    '--no-ext-diff', '--', 'a/' + file, 'b/' + file], { cwd: tmp, encoding: 'utf8' });
  verify(result.status === 1 && result.stdout.includes('@@'), result.stderr || '검토용 차이를 만들 수 없습니다.');
  return result.stdout;
}

const original = read(schedule);
const lines = original.split('\n');
const rows = new Map();
for (const [index, line] of lines.entries()) {
  const match = /^\| (\d+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|$/.exec(line);
  if (!match) continue;
  const number = Number(match[1]);
  verify(!rows.has(number), '중복된 회차 ' + number);
  rows.set(number, { number, index, ref: match[2], title: match[3], description: match[4] });
}

const proposals = changes.map(change => {
  const row = rows.get(change.episode);
  verify(row && row.description.split(change.before).length === 2,
    '현재 회차표를 다시 대조하세요. E' + change.episode);
  const candidate = row.description.replace(change.before, change.after);
  lines[row.index] = lines[row.index].replace('| ' + row.description + ' |', '| ' + candidate + ' |');
  return { title: 'E' + row.number + ' · ' + row.title, source: '회차표 ' + row.number + '행',
    ref: change.ref, before: row.description, after: candidate };
});

const originalG06 = read(g06);
const g06lines = originalG06.split('\n');
const copies = g06lines.filter(line => line.includes(beforeLine));
verify(originalG06.split(beforeLine).length === 3 && copies.length === 2 && copies[0].startsWith('- **어른**: ') && copies[1].startsWith('1. '),
  'G06 칸 1의 진행 대사와 녹음 원고를 다시 대조하세요.');
proposals.push({ title: 'G06 · 요셉의 나이', source: '칸 1 진행 대사 · 녹음 대본 1번',
  ref: '창 41:46 · E55 고르기', before: beforeLine, after: afterLine });

const sample = Array.from({ length: 9 }, (_, i) => {
  const row = rows.get(45 + i);
  verify(row, '검토할 회차가 없습니다. E' + (45 + i));
  return { number: row.number, title: row.title, ref: row.ref };
});
const template = read('docs/인계/창세기_E57_목회자검토.html');
const policy = read('web/genesis/reading-order.js');
const data = JSON.stringify({ sample, proposals }).replace(/</g, '\\u003c');
function embedScript(html, id, contents) {
  const pattern = new RegExp('(<script[^>]* id="' + id + '">)[\\s\\S]*?(<\\/script>)');
  verify(pattern.test(html), '검토 화면에 묶을 자리가 없습니다. ' + id);
  return html.replace(pattern, (_, open, close) => open + contents + close);
}
const html = embedScript(embedScript(template, 'reading-order', policy), 'source', data);
const dist = path.join(root, 'dist');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'genesis-proposals-'));
try {
  const patch = patchFor(schedule, original, lines.join('\n'), tmp)
    + patchFor(g06, originalG06, originalG06.replaceAll(beforeLine, afterLine), tmp);
  const check = spawnSync('git', ['apply', '--check', '-'], { cwd: root, encoding: 'utf8', input: patch });
  verify(check.status === 0, check.stderr || '검토용 패치 대조 실패');
  fs.mkdirSync(dist, { recursive: true });
  fs.writeFileSync(path.join(dist, 'genesis-e57-review.html'), html);
  fs.writeFileSync(path.join(dist, 'genesis-e57-proposed.patch'), patch);
  console.log('목회자 검토 파일 생성 · dist/genesis-e57-review.html · dist/genesis-e57-proposed.patch');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
