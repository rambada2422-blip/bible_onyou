/* node tools/build-genesis-e58.js */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const source = read('docs/창세기/본편/E58.md');
const play = source.split('## 플레이 원고\n')[1].split('## 아이용 요약')[0];
const stages = [];
const journal = [];
const choices = [];
for (const line of play.split(/\r?\n/)) {
  const header = line.match(/^### 칸 (\d+) ·/);
  if (header) {
    assert.equal(Number(header[1]), stages.length + 1);
    stages.push([]);
    continue;
  }
  const spoken = line.match(/^- \*\*(어른|최온|쉼)\*\*( 『탐험대 이야기』)?: (.*)$/);
  if (spoken) {
    const [, role, story, body] = spoken;
    const [text, note] = body.split(' (어른 도움말: ');
    stages.at(-1).push({ role, story: !!story, text, note: note ? note.replace(/\)$/, '') : '' });
  }
  const choice = line.match(/^  - \*\*(.+)\*\* → 칸 (\d+)(?:으)?로 간다\./);
  if (choice) choices.push({ label: choice[1], to: Number(choice[2]) });
  const entry = line.match(/^  - (다른 장면을 다녀왔으면: )?\*\*(.+)\*\* · (.+)$/);
  if (entry) journal.push({ detour: !!entry[1], title: entry[2], text: entry[3] });
}
function rowsBetween(start, end) {
  return source.split(start)[1].split(end)[0].split('\n')
    .filter(line => line.startsWith('|')).slice(2)
    .map(line => line.slice(1, -1).split('|').map(cell => cell.trim()));
}
const help = rowsBetween('## 어른이 고를 수 있는 도움말', '## 아이가 물을 때의 답');
const questions = rowsBetween('## 아이가 물을 때의 답', '## 회차 연결');
const decisions = rowsBetween('## 대표와 목회자가 정할 것', '## 별도 내용 검증');
assert.equal(decisions.length, 7);
assert.equal(questions.length, 24);
assert.equal(stages.length, 9);
assert.equal(stages.flat().filter(l => l.role !== '쉼').length, 43);
assert.equal(stages.flat().filter(l => l.role === '쉼').length, 12);
assert.deepEqual(choices.map(c => c.to), [3, 4]);
assert.equal(journal.length, 4);
const fallback = /지난 일지가 없으면 "([^"]+)"/.exec(stages[0][2].note)[1];
const retry = /이 줄 대신 "([^"]+)"/.exec(stages[1][4].note)[1];
const retryPrompt = /같은 카드를 또 고르면 '([^']+)'/.exec(stages[1][4].note)[1];
const prayer = /^- \(원하면\) 한 문장 기도: (.+)$/m.exec(play)[1];
const stopNote = help.find(([when]) => when.includes('놀라거나'))[1];
const data = { stages, choices, journal, help, questions, decisions, fallback, retry, retryPrompt, prayer, stopNote };
const media = fs.readFileSync(path.join(__dirname, 'genesis-e58/notebook.webp')).toString('base64');
const timeMachine = fs.readFileSync(path.join(root, 'web/assets/char/timemachine.svg')).toString('base64');
const json = JSON.stringify(data).replace(/</g, '\\u003c');
const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>E58 · 잔의 표 | 창세기 내부 검토</title>
<style>${read('tools/genesis-e58/style.css')}</style></head>
<body><main><header><span>성경 탐험대 <b>창세기</b></span><small>목회자 검토용 · 미감수</small></header>
<div id="app"></div></main><template id="cover"><img class="cover" src="data:image/webp;base64,${media}" alt="가림 종이와 연필을 얹은 탐험 일지"></template>
<template id="time-machine"><img class="time-machine" width="88" height="88" alt="탐험대 이야기의 타임머신" src="data:image/svg+xml;base64,${timeMachine}"></template>
<script type="application/json" id="manuscript">${json}</script>
<script>${read('tools/genesis-e58/reader.js')}</script></body></html>\n`;
const dist = path.join(root, 'dist');
fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(path.join(dist, 'genesis-e58.html'), html);
console.log('E58 검토본 · 아홉 칸, 대사 43줄, 쉼 12곳 · dist/genesis-e58.html');
