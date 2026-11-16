#!/usr/bin/env node
/* 목회자 감수 자료 생성기 (갈래 pack, 2026-11-16)
 *
 *   node tools/make_review_pack.js          → docs/감수/ 아래 파일을 다시 만든다
 *   node tools/make_review_pack.js --check  → 만들지 않고 숫자 대조만 보여 준다
 *
 * 읽는 것(읽기만): content/ot/OT-NN.json 40개, content/ot/eras.json, content/ot/_verify/era-N.md,
 *   web3d/js/scene_*.js 머리말, docs/00_공통규칙서.md(3절·13절), docs/감수/미해결_분류.json(있으면).
 * 만드는 것: docs/감수/README.md, 감수자료.html(휴대폰·컴퓨터, 표시 저장·내보내기), 감수자료_인쇄용.html(A4),
 *   먼저볼30_인쇄용.html, 참고_장면전체글_인쇄용.html, md/시대NN.md, 항목목록.json, 미해결_전체.md
 *
 * 원칙: 게임에 나오는 문장은 자료에서 글자 그대로 옮긴다(바꿔 쓰지 않는다). 성경 본문은 싣지 않는다(장절만).
 *       내용이 바뀌면 이 스크립트를 다시 돌린다. 같은 내용이면 같은 파일이 나온다(날짜를 넣지 않는다).
 *       검사는 node tools/test/check_review_pack.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs', '감수');
const CHECK_ONLY = process.argv.includes('--check');
const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const sha = (s) => crypto.createHash('sha1').update(s).digest('hex');

/* ───────── 1. 읽기 ───────── */
const scenes = [];
for (let i = 1; i <= 40; i++) scenes.push(JSON.parse(rd('content/ot/OT-' + String(i).padStart(2, '0') + '.json')));
const erasDoc = JSON.parse(rd('content/ot/eras.json'));
const rules = rd('docs/00_공통규칙서.md');
const classPath = path.join(OUT, '미해결_분류.json');
const CLASS = fs.existsSync(classPath) ? JSON.parse(fs.readFileSync(classPath, 'utf8')) : {};

/* 검증자 항목이 가리키는 게임 글의 자리(하위 에이전트가 지금 자료에서 찾아 적은 것). 없으면 붙이지 않는다 */
const atPath = path.join(OUT, '미해결_자리.json');
const AT = fs.existsSync(atPath) ? JSON.parse(fs.readFileSync(atPath, 'utf8')) : {};
/* 화면 사진(tools/test/make_review_images.py가 만든 것). 있으면 싣고, 없으면 글만 싣는다 */
const IMG_DIR = path.join(OUT, '화면');
const hasImg = (f) => fs.existsSync(path.join(IMG_DIR, f));
const imgLine = (f, cap) => ({ k: cap, v: '', g: false, img: f });
let MD_IMG_PREFIX = '../화면/';
const WHO = { choeon: '최온', hyu: '휴', onwoo: '온우', doctor: '최현 박사', narr: '해설' };
const TIER = { t1: '8~10세', t2: '11~13세', t3: '14~19세' };
const TIERS = ['t1', 't2', 't3'];
const who = (w) => WHO[w] || w;

/* 규칙서의 한 소절(### N.N …)을 글자 그대로 */
function ruleSection(no) {
  const lines = rules.split('\n');
  const s = lines.findIndex((l) => l.startsWith('### ' + no + ' '));
  if (s < 0) throw new Error('규칙서에서 ' + no + '절을 찾지 못함');
  let e = s + 1;
  while (e < lines.length && !/^#{2,3} /.test(lines[e])) e++;
  return { title: lines[s].replace(/^### /, ''), body: lines.slice(s + 1, e).filter((l) => l.trim() !== '') };
}

/* 코드에 박혀 있는 한국어 글(아이에게 보이는 화면 글). 작은따옴표 글 가운데 한글이 든 것을 차례대로 뽑는다 */
const KEYNAME = { name: '이름', desc: '설명', hint: '찾는 실마리', title: '제목', label: '보기', prompt: '물음', q: '물음', text: '글', back: '끝난 뒤 글', place: '곳', lookText: '다시 읽기 안내', sceneDoneText: '떠나기 전 안내', why: '풀이', ok: '맞혔을 때', no: '다시 볼 때' };
function koStrings(src) {
  const out = [], seen = new Set();
  const code = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  const re = /(?:([A-Za-z_]\w*)\s*:\s*)?'((?:[^'\\\n]|\\.)*)'/g;
  let m;
  while ((m = re.exec(code))) {
    const t = m[2].replace(/\\'/g, "'").replace(/\\n/g, ' ').trim();
    if (!/[가-힣]/.test(t) || seen.has(t)) continue;
    seen.add(t); out.push({ key: m[1] || '', text: t });
  }
  return out;
}
const codeLines = (list, sub) => list.map((x) => G(KEYNAME[x.key] || '', x.text, { sub: sub !== false }));
function slice(src, from, to) { const a = src.indexOf(from); if (a < 0) throw new Error('코드에서 찾지 못함: ' + from); const b = to ? src.indexOf(to, a + from.length) : -1; return src.slice(a, b < 0 ? undefined : b); }
function headComment(src) { const end = src.indexOf('*/'); return src.slice(0, end).split('\n').map((l) => l.replace(/^\/\*\s?/, '').replace(/^\s\*\s?/, '').replace(/\s+$/, '')).filter((l) => l !== ''); }
/* 머리말에서 만드는 사람만 아는 말(파일 이름, 좌표)을 뺀다 */
const DEV_LINE = /game\.js|GLB|scenes\.md|새 3D 장면은|이 장면만의 것|world\.js|^방향:|단위는 미터|타임머신에 이름을 잘못 넣었을 때/;
const cleanHead = (lines) => lines.filter((l) => !DEV_LINE.test(l)).map((l) => l.replace(/\s*\(content\/ot\/OT-\d\d\.json design3d\)/, '').replace(/\s*\((?:[+-][XZ]|화면 앞, -Z)\)/g, ''));

/* 3D 장면 설정 파일의 머리말 */
const scene3d = {};
/* 장면표(docs/09)의 3D 대표 12장면. 그 밖의 3D 장면 파일은 자동 작업 갈래가 더한 것(대표 결재지 마1) */
const BASE3D = ['OT-03', 'OT-05', 'OT-09', 'OT-11', 'OT-13', 'OT-18', 'OT-19', 'OT-21', 'OT-26', 'OT-30', 'OT-36', 'OT-39'];
fs.readdirSync(path.join(ROOT, 'web3d/js')).filter((f) => /^scene_.*\.js$/.test(f)).sort().forEach((f) => {
  const src = rd('web3d/js/' + f);
  const end = src.indexOf('*/');
  const head = src.slice(0, end).split('\n').map((l) => l.replace(/^\/\*\s?/, '').replace(/^\s\*\s?/, '').replace(/\s+$/, '')).filter((l) => l !== '');
  const m = head[0].match(/OT-(\d\d)/);
  if (m) scene3d['OT-' + m[1]] = { file: 'web3d/js/' + f, head: cleanHead(head), strings: koStrings(src) };
});
const EXTRA3D = Object.keys(scene3d).filter((id) => !BASE3D.includes(id)).sort();

/* 검증 기록의 "미해결" */
function parseUnresolved(era) {
  const lines = rd('content/ot/_verify/era-' + era + '.md').split('\n');
  const out = [];
  let h2 = '', scene = null;
  const isItem = (l) => /^\s*(-|\d+\.)\s+/.test(l);
  const strip = (l) => l.replace(/^\s*(-|\d+\.)\s+/, '');
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    let m = L.match(/^(#{1,4})\s+(.*)$/);
    if (m) {
      const lvl = m[1].length, t = m[2];
      const om = t.match(/^OT-(\d\d)/);
      const isUn = /^(미해결|감수 때 물을 것|두 시대에 공통으로)/.test(t);
      if (lvl <= 2) { h2 = t; scene = om ? 'OT-' + om[1] : null; }
      else if (!isUn) scene = om ? 'OT-' + om[1] : null;
      if (!isUn) continue;
      const items = [];
const byIdLive = (id) => items.find((x) => x.id === id);
      let j = i + 1;
      while (j < lines.length && !/^#{1,4}\s/.test(lines[j])) {
        if (isItem(lines[j])) items.push(strip(lines[j]));
        else if (/^\s{2,}\S/.test(lines[j]) && items.length) items[items.length - 1] += ' ' + lines[j].trim();
        j++;
      }
      items.forEach((x) => out.push({ era, h2, scene, text: x, line: i + 1 }));
      continue;
    }
    m = L.match(/^미해결(\([^)]*\))?\s*:?\s*(.*)$/);
    if (m) {
      const rest = m[2].trim();
      if (rest) { if (!/^없음/.test(rest)) out.push({ era, h2, scene, text: rest, line: i + 1 }); continue; }
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === '') j++;
      const items = [];
      while (j < lines.length && (isItem(lines[j]) || (/^\s{2,}\S/.test(lines[j]) && items.length))) {
        if (isItem(lines[j]) && !/^\s{2,}/.test(lines[j])) items.push(strip(lines[j]));
        else items[items.length - 1] += ' ' + lines[j].trim();
        j++;
      }
      items.forEach((x) => out.push({ era, h2, scene, text: x, line: i + 1 }));
    }
  }
  out.forEach((x) => { x.key = sha(x.text).slice(0, 10); });
  return out;
}
/* 검증 기록에서 "(높음)" 지적이 있었던 곳 */
function parseHigh(era) {
  const lines = rd('content/ot/_verify/era-' + era + '.md').split('\n');
  const out = [];
  let scene = null;
  lines.forEach((L) => {
    const m = L.match(/^(#{1,4})\s+(.*)$/);
    if (m) { const om = m[2].match(/^OT-(\d\d)/); scene = om ? 'OT-' + om[1] : null; return; }
    if (/^\s*\d+\.\s*\(높음\)/.test(L) && scene) out.push({ scene, text: L.replace(/^\s*\d+\.\s*/, '') });
  });
  return out;
}
let unresolved = [], highs = [];
for (let e = 1; e <= 10; e++) { unresolved = unresolved.concat(parseUnresolved(e)); highs = highs.concat(parseHigh(e)); }

/* ───────── 2. 항목 만들기 ───────── */
/* 줄(line): { k: 이름표, v: 글(게임 문장은 글자 그대로), t: 나이 단계, g: true면 게임에 나오는 글, ref: 장절, sub: 작은 글 } */
const items = [];
const byIdLive = (id) => items.find((x) => x.id === id);
function add(it) { it.lines = it.lines.filter(Boolean); items.push(it); return it; }
const G = (k, v, extra) => Object.assign({ k, v, g: true }, extra || {});
const N = (k, v, extra) => Object.assign({ k, v, g: false }, extra || {});
const tierLines = (obj, label) => TIERS.filter((t) => obj && obj[t] != null).map((t) => G((label ? label + ' ' : '') + TIER[t], obj[t], { t }));

/* 물음 하나(find·multi·order·match)를 줄로 */
function qLines(q, tier, label) {
  const L = [];
  const lab = (label ? label + ' ' : '') + (tier ? TIER[tier] : '');
  const refs = q.refs ? q.refs.join(' · ') : q.ref;
  const kind = { find: '찾아 읽고 고르기', multi: '여러 개 고르기', order: '순서 맞추기', match: '구절과 내용 잇기' }[q.type] || q.type;
  L.push(G(lab + ' · ' + kind, q.prompt, { t: tier, ref: refs }));
  if (q.confirm) {
    L.push(G('물음', q.confirm.prompt, { t: tier, sub: true }));
    q.confirm.options.forEach((o) => L.push(G(o.ok ? '맞는 보기' : '다른 보기', o.label, { t: tier, sub: true, ref: o.ok ? '' : o.basis, opt: o.ok ? 'ok' : 'no' })));
  }
  if (q.items) q.items.forEach((x, i) => L.push(G('차례 ' + (i + 1), x, { t: tier, sub: true })));
  if (q.pairs) q.pairs.forEach((p) => L.push(G('잇기', p.text, { t: tier, sub: true, ref: p.ref })));
  if (q.after) L.push(G('이은 뒤 글', q.after, { t: tier, sub: true }));
  return L;
}

/* 원칙(규칙서) */
const RULE_ITEMS = [
  ['3.1', '무엇을 근거로 삼는지의 차례입니다: 성경 본문 → 웨스트민스터 표준문서 → 허용 저자 7인. 지금 게임의 글은 성경 본문만 근거로 썼습니다.'],
  ['3.2', '참고할 수 있는 저자 7인과 그 단서입니다. 지금은 원문을 확인하지 못해 한 곳도 인용하지 않았습니다.'],
  ['3.3', '성경에 없는 것을 만들지 않는다, 하나님을 형상으로 그리지 않는다, 아이들은 목격자다. 이 게임 전체의 울타리입니다. (천사도 그리지 않기로 좁게 정해 두었습니다.)'],
  ['3.5', '아래 주제가 들어간 장면과 물음은 목사님이 보시기 전에는 확정하지 않습니다.'],
  ['13.2', '타임머신이 고장 나 그 시대의 평범한 재료(떨어진 것)를 주워 고친다는 설정입니다. 성경 내용이 아닌 "탐험대 이야기"로 표시합니다. 거룩한 것·기적에 속한 것은 재료로 쓰지 않습니다.'],
  ['13.3', '모세·다윗 같은 성경 인물이 아이들과 함께 걷습니다. 그 인물은 성경에 기록된 자기 말만(풀어 쓴 간접 서술과 장절로) 합니다.'],
  ['13.4', '지금 아이들이 궁금해할 물음에 "최현 박사"(지어낸 인물)가 성경 장절을 근거로 답합니다. 성경 인물의 입으로 답하게 하지 않습니다. 모두 감수 대상입니다.'],
  ['13.5', '모든 물음은 성경책을 펴야 답할 수 있게 했습니다. 나이에 따라 한 절 / 범위 / 떨어진 여러 곳을 읽습니다.'],
  ['13.6', '아이들이 그 시대 사람들의 "평범한 일"을 돕습니다(예: 유월절 밤 허리띠·신·지팡이 챙기기). 거룩한 행위와 기적은 돕지 않고 곁에서 봅니다. 도운 뒤 본문으로 뜻을 깨닫는 단계가 있습니다.'],
  ['13.7', '본문에 적힌 일이 없는 장면은 사건 곁의 일상 일(짐 나르기, 길 비켜 주기 등)을 돕습니다. 성경 사건이 아니므로 "탐험대 이야기"로 표시합니다.'],
  ['13.8', '물음의 놀이 방식을 섞고, 3D 절정 장면에 소리·흔들림 같은 간접 연출을 더했습니다. 하나님의 형상과 음성은 만들지 않습니다.']
];
RULE_ITEMS.forEach(([no, sum]) => {
  const sec = ruleSection(no);
  add({ id: '원칙·' + no, group: 'rule', kind: 'rule', label: '원칙', title: sec.title, refs: '규칙서 ' + no + '절', core: true,
    lines: [N('한 줄 요약', sum)].concat(sec.body.map((b) => N('규칙서', b.replace(/^- /, ''), { sub: true }))) });
});
/* 공통: 비상 착륙 이야기 */
add({ id: '공통·비상착륙', group: 'rule', kind: 'story', label: '탐험대 이야기', title: '처음 이야기 "' + erasDoc.story.title + '"', refs: '성경 내용 아님(탐험대 이야기)', core: true,
  lines: erasDoc.story.lines.map((l) => G(who(l.who), l.text)).concat([G('화면 아래 안내', erasDoc.story.rule)]) });

/* 공통: 읽어 주기, 마무리, 화면 글, 인물 */
add({ id: '공통·읽어주기', group: 'rule', kind: 'common', label: '공통', title: '8~10세의 "읽어 주기" 단추', refs: '규칙서 13.8과 견주어', core: true,
  lines: [N('무엇인가', '8~10세 단계에서는 대목 글 옆에 "읽어 주기" 단추가 있어, 누르면 휴대폰에 들어 있는 한국어 목소리(기계 음성)가 그 글을 읽습니다. 게임이 따로 녹음한 소리는 없습니다.'),
    N('여쭙는 것', '대목 글에는 하나님이 하신 말씀을 풀어 옮긴 문장("하나님은 …라고 하셨어요")도 있습니다. 이런 글을 기계 목소리가 읽는 것이 원칙 13.8의 "하나님의 음성은 소리로 만들지 않는다"에 어긋나지 않는다고 보아도 될까요? (지금 기본값: 읽어 줌. 해설자가 글을 읽는 것으로 봄)')] });
(function () {
  const t3 = scenes.map((d) => d.close.t3.prompt.replace(d.ref, '(본문 범위)'));
  const same = new Set(t3).size === 1;
  add({ id: '공통·마무리', group: 'rule', kind: 'common', label: '공통', title: '장면의 마무리: 기도 · 실천 · 기록 (규칙서 3.5의 "14~19세 삶에 적용 질문")', refs: '규칙서 3.5, 5절', core: true,
    lines: [N('지금 상태', '14~19세의 "삶에 적용" 질문은 **아직 쓰지 않았습니다.** 지금 들어 있는 것은 사실을 적는 기록 물음 한 가지뿐이며' + (same ? ' 40장면이 같은 문장입니다(본문 범위만 다름).' : ' 장면마다 조금씩 다릅니다.') + ' 그 아래에 "뜻과 삶의 적용을 묻는 질문은 목사님 감수를 마친 뒤 이 자리에 열립니다."라는 글이 보입니다.'),
      G('14~19세 기록 물음(40장면 공통 꼴)', same ? t3[0] : scenes[0].close.t3.prompt, { t: 't3' }),
      N('8~10세', '한 문장 기도. 장면마다 다른 문장은 시대별 "마무리" 항목에 모았습니다.'),
      N('11~13세', '한 주 실천 한 가지(대개 그 장면의 몇 절을 소리 내어 읽기). 시대별 "마무리" 항목에 모았습니다.'),
      N('보이는 때', '마무리는 장면의 맨 끝, 말씀 카드 아래에 나옵니다. 시대의 마지막 장면에서만 펼쳐져 있고 다른 장면에서는 "마무리 펼치기"를 눌러야 보입니다.'),
      N('여쭙는 것', '① 기도문과 실천의 꼴을 이대로 써도 될까요? ② 14~19세의 적용 질문을 넣을지, 넣는다면 어떤 방향으로 할지 의견을 적어 주세요(지금 기본값: 넣지 않고 기록 물음만).')] });
})();
(function () {
  const dir = path.join(ROOT, 'tools/blender/people');
  const lines = [N('무엇인가', '3D 장면에 나오는 성경 인물의 생김새 설정입니다. 수염과 옷 색은 본문이 말하지 않아 정한 것입니다. 색 이름 옆의 네모가 실제 색입니다(인쇄하면 흐릴 수 있습니다). 모세·여호수아·제사장은 이 방식보다 먼저 만들어져 설정 글이 따로 없습니다.')];
  const CN = { ROBE: '겉옷', TUNIC: '속옷', BEARD: '수염', HAIR: '머리', BELT: '띠', STAFF: '지팡이' };
  fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort().forEach((f) => {
    const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    lines.push(G('', j.note, {}));
    const sw = Object.keys(CN).filter((k) => j.colors && j.colors[k]).map((k) => CN[k] + ' ' + j.colors[k]).join(' · ');
    if (hasImg('인물_' + f.replace('.json', '.jpg'))) lines.push(imgLine('인물_' + f.replace('.json', '.jpg'), '게임에 나오는 모습(앞·옆·뒤)'));
    lines.push(N('색', sw + (j.beard ? ' · 수염 모양 ' + ({ full: '긴 수염', short: '짧은 수염', none: '없음' }[j.beard] || j.beard) : ''), { sub: true, swatch: true }));
  });
  [['moses', '모세'], ['joshua', '여호수아'], ['priest', '제사장']].forEach(([f, nm]) => { if (hasImg('인물_' + f + '.jpg')) { lines.push(N('', nm + ' (설정 글 없이 먼저 만든 인물)')); lines.push(imgLine('인물_' + f + '.jpg', nm + ': 게임에 나오는 모습')); } });
  add({ id: '공통·인물', group: 'rule', kind: 'common', label: '공통', title: '3D 인물의 옷 색·수염·소품 (본문에 없는 생김새)', refs: 'tools/blender/people', core: true, lines });
})();
(function () {
  const KEYW = /성경|하나님|여호와|감수|믿음|기도|말씀|지켜|바늘|기록|본문|구절|절에|목사|사건|평범한|손대지|실천|기념/;
  const files = [['web3d/js/ui.js', '물음에 답할 때 뜨는 글'], ['web3d/js/story.js', '이야기 카드 화면의 글'], ['web3d/js/game.js', '3D 탐험 화면의 글']];
  const a = [N('무엇인가', '장면 자료가 아니라 게임 틀에 들어 있어 **모든 장면에서 똑같이 뜨는 글**입니다. 틀린 보기를 골랐을 때의 안내("타임머신 바늘이 엇나갔어요"), 동행·돕기·뜻 묻기의 안내, "감수 전" 표시, 보상 설명 등입니다. 글 가운데가 끊긴 곳은 그 자리에 장절이나 이름이 들어갑니다.'),
    N('여쭙는 것', '① 틀렸을 때의 말투가 아이에게 맞는지 ② "감수 전" 표시 글은 감수를 마친 뒤 지울지, 다른 글로 바꿀지.')], b = [];
  files.forEach(([f, name]) => {
    const st = koStrings(rd(f));
    a.push(N(name, '', { head: true })); b.push(N(name, '', { head: true }));
    st.forEach((x) => (KEYW.test(x.text) ? a : b).push(G('', x.text, { sub: true })));
  });
  add({ id: '공통·화면글', group: 'rule', kind: 'common', label: '공통', title: '모든 장면에 똑같이 뜨는 글(성경·신앙에 닿는 것)', refs: '규칙서 4.2, 13.5, 13.8', core: true, fold: true, lines: a });
  add({ id: '공통·화면글참고', group: 'rule', kind: 'rest', label: '그 밖의 글(참고)', title: '단추 이름, 조작 안내, 탐험대 이야기의 고정 글', refs: '', core: false, fold: true, lines: b });
})();
/* 시대 추리(요단 강): 호렙 장면 뒤 "다른 이름으로 가 보기"에서 갈 수 있는 곳 */
(function () {
  const c3 = rd('web3d/js/content3d.js'), c2 = rd('web/js/content.js');
  const L = [N('무엇인가', '호렙 산 장면(OT-09)을 마친 뒤 "다른 이름으로 가 보기"를 누르면, 타임머신에 넣을 이름을 고르는 물음이 나옵니다. 모세가 아닌 이름을 고르면 요단 강을 건너는 장면(수 3:1-17)에 도착하고, 아이는 단서를 사진으로 찍어 "여기가 언제 어디인지"를 추리한 뒤 돌아옵니다. 규칙서 2절 "잘못된 선택"의 방식이며, 구약 40장면과는 따로 있는 길입니다.'),
    N('여쭙는 것', '① "잘못 간 길"이라는 틀로 성경의 다른 장면을 보여 주는 방식 ② 언약궤를 덮개로 덮은 모습으로 그린 것(민 4:5-6) ③ 아래 글과 배치. 이 길을 공개판에서 닫는 것이 낫다고 보시면 "뺌"으로 표시해 주세요.'),
    N('3D 배치 메모', '', { head: true })];
  cleanHead(headComment(rd('web3d/js/jordan.js'))).forEach((h) => L.push(N('', h, { sub: true })));
  L.push(N('이름 고르기 물음', '', { head: true })); codeLines(koStrings(slice(c2, '  route: {', '  scenes: {'))).forEach((x) => L.push(x));
  L.push(N('요단 강 장면의 글(3D)', '', { head: true })); codeLines(koStrings(slice(c3, '  jordan: {'))).forEach((x) => L.push(x));
  L.push(N('돌아오는 관문과 말씀 카드(시범판 자료 ALT-02를 함께 씀)', '', { head: true })); codeLines(koStrings(slice(c2, "'ALT-02': {", "'ALT-03': {"))).forEach((x) => L.push(x));
  L.push(N('이름 고르기 앞에 보여 주는 배경(시범판 자료 EX-00. 3D 게임은 이 가운데 넷째 대목을 씀)', '', { head: true })); codeLines(koStrings(slice(c2, "'EX-00': {", "'EX-01': {"))).forEach((x) => L.push(x));
  add({ id: '추리·요단강', group: 'rule', kind: 'common', label: '시대 추리', title: '요단 강 시대 추리 (이름을 잘못 넣으면 가는 곳)', refs: '수 3:1-17, 출 2:23-25, 3:10', core: true, fold: true, lines: L });
})();

/* 대표 결재 자료 가운데 목사님께 여쭐 것으로 표시된 것(pastorItem)은 감수 자료의 표시 항목으로도 싣는다 */
const SIGN = JSON.parse(fs.readFileSync(path.join(OUT, '대표_결재_자료.json'), 'utf8'));
SIGN.decisions.filter((d) => d.pastorItem).forEach((d) => add({ id: '여쭘·' + d.id, group: 'rule', kind: 'common', label: '대표가 여쭙는 것', title: d.pastor, refs: '대표 결재지 ' + d.id, core: true, askMarks: true,
  lines: [N('배경', d.q), N('지금', d.now), N('대표에게 드린 추천', d.rec + ' — ' + d.why)] }));

const eraName = {};
erasDoc.eras.forEach((e) => { eraName[e.era] = e.name; });

/* 검증 기록의 글에서 자료 이름(영어)을 우리말로 푼다. 뜻은 바꾸지 않는다 */
const JARGON = [[/`/g, ''], [/\bt1\b/g, '8~10세 글'], [/\bt2\b/g, '11~13세 글'], [/\bt3\b/g, '14~19세 글'], [/\bfindref\b/g, '장절 찾기 물음'], [/\bfind\b/g, '찾아 읽고 고르기'], [/\bmulti\b/g, '여러 개 고르기'], [/\border\b/g, '순서 맞추기'], [/\bmatch\b/g, '구절과 내용 잇기'],
  [/design3d\.never/g, '그리지 않는 것 목록'], [/design3d\.people/g, '화면 설계의 사람 목록'], [/design3d\.props/g, '화면 설계의 물건 목록'], [/design3d\.god/g, '하나님 표현 메모'], [/design3d/g, '화면 설계 메모'], [/review\.required/g, '감수 필수 표시'], [/review\.topics|\btopics\b/g, '감수 주제'],
  [/\bbasis\b/g, '근거 장절'], [/\bquests\b(\[\d\])?/g, '탐지기 물음'], [/\bgates\b/g, '관문'], [/mission\.today|\btoday\b/g, '오늘의 물음'], [/\bcompanion\b/g, '동행 인물'], [/\bmaterials\b/g, '재료'], [/\bbeats\b/g, '대목'], [/help\.steps|\bhelp\b/g, '현장 돕기'], [/\bwatch\b/g, '곁에서 보기'], [/\bstay\b/g, '함께 머물기'], [/\bask\b/g, '뜻 묻기'], [/\bdo\b/g, '손으로 하는 돕기'], [/\bnt\b/g, '신약 연결'], [/\bcall\b/g, '박사의 통신'], [/\bcards\b/g, '말씀 카드'], [/\bclose\b/g, '마무리'], [/\bsay\b/g, '아이의 말'], [/\bfound\b/g, '있는 곳 글'], [/\bafter\b/g, '뒤 글'], [/\bopen\b/g, '펼 곳'], [/\bref\b/g, '장절']];
const plain = (t) => JARGON.reduce((a, [re, to]) => a.replace(re, to), t);
/* 자리(경로)를 사람 말로: beats.1.text.t1 → "대목 2 · 8~10세" */
function pathLabel(pth) {
  const p = pth.split('.'), T = { t1: '8~10세', t2: '11~13세', t3: '14~19세' };
  const tier = p.filter((x) => T[x]).map((x) => T[x])[0];
  const num = (i) => (/^\d+$/.test(p[i]) ? Number(p[i]) + 1 : '');
  let w;
  if (p[0] === 'beats') w = '대목 ' + num(1) + (p[2] === 'say' ? ' · 아이의 말' : '');
  else if (p[0] === 'gates') w = '관문 물음 ' + num(2) + (p.includes('options') ? ' · 보기' : p.includes('items') ? ' · 차례 항목' : p.includes('pairs') ? ' · 잇기' : p.includes('after') ? ' · 이은 뒤 글' : '');
  else if (p[0] === 'quests') w = '탐지기 물음 ' + num(1) + (p.includes('options') ? ' · 보기' : '');
  else if (p[0] === 'cards') w = '말씀 카드 ' + num(1);
  else if (p[0] === 'close') w = '마무리';
  else if (p[0] === 'title') w = '장면 제목';
  else if (p[0] === 'place') w = '곳';
  else if (p[0] === 'design3d') w = { god: '하나님 표현', never: '그리지 않는 것', people: '화면 설계의 사람', props: '화면 설계의 물건', place: '화면 설계의 곳', terrain: '화면 설계의 땅' }[p[1]] || '화면 설계';
  else if (p[0] === 'review') w = '감수 주제';
  else if (p[0] === 'mission') {
    if (p[1] === 'today') w = '오늘의 물음 ' + num(2) + (p[3] === 'q' ? ' · 물음' : ' · 답');
    else if (p[1] === 'companion') w = p[2] === 'talks' ? '동행 문답 ' + num(3) + (p[4] === 'ask' ? ' · 아이의 물음' : ' · 답') : '동행 인물';
    else if (p[1] === 'materials') w = '재료 ' + num(2) + ({ name: '', how: ' · 얻는 방법', use: ' · 박사의 말', line: ' · 아이의 말' }[p[3]] || '');
    else if (p[1] === 'call') w = '박사의 통신';
    else if (p[1] === 'help') w = p[2] === 'steps' ? '현장 돕기 단계 ' + num(3) + (p[4] === 'nt' ? ' · 신약 연결' : p[4] === 'answer' ? ' · 뜻 묻기의 답' : p[4] === 'read' ? (p.includes('options') ? ' · 성경 읽기 물음의 보기' : ' · 성경 읽기 물음') : p[4] === 'ask' ? ' · 아이의 물음' : p[4] === 'title' ? ' · 제목' : p[4] === 'tasks' ? ' · 누르는 일' : p[4] === 'done' ? ' · 마친 뒤 말' : '') : '돕는 상대';
    else w = '임무';
  } else w = pth;
  return w + (tier ? ' · ' + tier : '');
}
function atLines(u, sid) {
  const a = AT[u.key]; if (!a) return [];
  const L = [];
  (a.at || []).forEach((raw) => {
    const m = raw.match(/^(OT-\d\d):(.*)$/), sc = m ? m[1] : sid, pth = m ? m[2] : raw;
    const d = scenes.find((x) => x.id === sc); if (!d) return;
    const v = pth.split('.').reduce((o, k) => (o == null ? o : o[k]), d);
    if (typeof v !== 'string' || !v) { console.warn('자리 없음(건너뜀): ' + u.key + ' ' + raw); return; }
    L.push(G('지금 게임의 글 · ' + (sc !== sid ? sc + ' ' : '') + pathLabel(pth), v, { sub: true }));
  });
  if (a.note) L.push(N('덧붙임', a.note, { sub: true }));
  return L;
}
function openLines(u, sid) {
  return [N('검증 기록(' + u.h2.replace(/\s*\(.*$/, '') + ')', plain(u.text))].concat(atLines(u, sid));
}
function sceneItems(d) {
  const sid = d.id, base = { scene: sid, era: d.era, group: 'scene' };
  const req = !!d.review.required;
  const m = d.mission, steps = m.help.steps;
  const idOf = (suffix) => sid + '·' + suffix;

  /* 대목 글: 감수 필수 장면은 표시하는 항목, 그 밖의 장면은 참고 */
  add(Object.assign({}, base, { id: idOf('대목'), kind: 'beats', label: '대목 글(장면 전체)', title: '대목 ' + d.beats.length + '개', refs: d.ref, core: req, fold: true,
    lines: [].concat.apply([], d.beats.map((b, i) => [N('대목 ' + (i + 1), '', { ref: b.ref, head: true })].concat(tierLines(b.text)).concat([G(who(b.say.who) + '의 말', b.say.text, { sub: true })]))) }));

  /* 동행 인물 문답 */
  if (m.companion && m.companion.talks) {
    const c = m.companion;
    c.talks.forEach((t, i) => add(Object.assign({}, base, { id: idOf('동행' + (i + 1)), kind: 'talk', label: '동행 인물 문답', title: c.who + '에게 묻기', refs: t.ref, core: true,
      lines: [N('동행 인물', c.who + ' (이 자리에 있다는 근거 ' + c.ref + ', ' + (c.when === 'before' ? '사건 앞' : '사건과 관문 뒤') + '에 문답)'),
        G(who(t.ask.who) + '의 물음', t.ask.text)].concat(tierLines(t.answer, '답')).concat([N('아이가 펼 곳', t.open)]) })));
  }
  /* 손으로 하는 돕기 */
  /* 검증자가 대표에게 넘긴 돕기 물음(미해결_분류.json의 under)을 그 돕기 항목 아래에도 참고로 붙인다 */
  const repAsk = (tag) => unresolved.filter((u) => u.scene === sid).map((u, k) => [u, k]).filter(([u]) => CLASS[u.key] && CLASS[u.key].under === tag)
    .map(([u, k]) => N('대표에게 넘긴 물음(참고, ' + idOf('미해결' + (k + 1)) + ')', CLASS[u.key].ask + ' 검증자는 이것을 운영 문제로 보아 대표 결재지에 올렸습니다. 신학 판단이 필요하다고 보시면 적는 칸에 적어 주세요.', { sub: true }));
  steps.filter((s) => s.kind === 'do').forEach((s, i) => add(Object.assign({}, base, { id: idOf('돕기' + (i + 1)), kind: 'do', label: '손으로 하는 돕기', title: s.title, refs: s.basis, core: true,
    lines: [N('돕는 상대', m.help.who)].concat(tierLines(s.text)).concat(s.tasks.map((x, j) => G('누르는 일 ' + (j + 1), x, { sub: true }))).concat([G('마친 뒤 ' + who(s.done.who) + '의 말', s.done.text, { sub: true })]).concat(repAsk('돕기' + (i + 1))) })));
  /* 뜻 묻기 */
  steps.filter((s) => s.kind === 'ask').forEach((s) => {
    add(Object.assign({}, base, { id: idOf('뜻'), kind: 'ask', label: '뜻 묻기', title: s.title, refs: s.basis, core: true,
      lines: [G(who(s.ask.who) + '의 물음', s.ask.text), N('답하는 사람', s.by)].concat(tierLines(s.answer, '답'))
        .concat([N('성경을 펴서 뜻 확인하기', '', { head: true })]).concat([].concat.apply([], TIERS.map((t) => qLines(s.read[t], t, '')))) }));
    if (s.nt) add(Object.assign({}, base, { id: idOf('신약'), kind: 'nt', label: '신약 연결', title: '14~19세에게만 보임 · 화면에 "감수 전" 표시', refs: s.nt.ref, core: true,
      lines: [G('14~19세', s.nt.text, { t: 't3' }), N('보이는 때', '뜻 묻기의 성경 읽기 물음을 맞힌 뒤에 뜹니다. 위 글은 문장 전체가 화면에 그대로 나옵니다("…감수를 마친 뒤 확정한다" 같은 문장이 들어 있으면 그것도 보입니다).')] }));
  });
  /* 오늘의 물음 */
  m.today.forEach((t, i) => add(Object.assign({}, base, { id: idOf('오늘' + (i + 1)), kind: 'today', label: '오늘의 물음', title: '최현 박사가 답함', refs: t.refs.join(' · '), core: true,
    lines: [G('물음', t.q)].concat(tierLines(t.a, '답')) })));
  /* 화면 설정 */
  const s3 = scene3d[sid];
  const scr = [G('하나님 표현', d.design3d.god)].concat(d.design3d.never.map((x) => G('그리지 않는 것', x, { sub: true })));
  if (s3) {
    if (!d.design3d.build) scr.push(N('지금 상태', '3D 장면 파일은 있으나 장면 자료에서 꺼져 있어, 아이에게는 이야기 카드로 나옵니다(대표 결재지 마1). 켜면 아래 설정대로 3D로 나옵니다.'));
    scr.push(N('3D 장면을 만들며 정한 것(본문에 맞춘 점, 감수가 필요한 설정)', '', { head: true }));
    s3.head.forEach((h) => scr.push(N('', h, { sub: true })));
    if (sid === 'OT-09') {
      const w = rd('web3d/js/world.js');
      (w.slice(0, w.indexOf('function rng')).match(/\/\*[\s\S]*?\*\//g) || []).forEach((c) => c.replace(/^\/\*\s*|\s*\*\/$/g, '').split('\n').map((l) => l.replace(/^\s*\*\s?/, '').trim()).filter((l) => l && !DEV_LINE.test(l)).forEach((l) => scr.push(N('', l, { sub: true }))));
      scr.push(N('', '본문에 없어 정한 것: 떨기나무와 언덕의 자리, 모세가 올라가는 길(완만한 서쪽 어깨), 떨기나무 앞에 선 모세의 뒷모습, 양 떼의 수(40마리), 압도 장면 영상(불붙은 떨기나무를 올려다보는 영상에 자막 두 줄, 효과음이 멎고 낮은 음악).', { sub: true }));
      scr.push(N('호렙 산 3D에만 나오는 글(영상 자막 포함)', '', { head: true }));
      const c3 = rd('web3d/js/content3d.js');
      codeLines(koStrings(c3.slice(0, c3.indexOf('  jordan: {')))).forEach((x) => scr.push(x));
    }
    const pics = [1, 2, 3].map((k) => sid + '_' + k + '.jpg').filter(hasImg);
    if (pics.length) { scr.push(N('화면 사진(사건을 지켜보는 동안의 화면. 컴퓨터에서 휴대폰 크기로 찍음)', '', { head: true })); pics.forEach((f, i) => scr.push(imgLine(f, sid + ' 지켜보기 화면 ' + (i + 1)))); }
    scr.push(N('3D 화면에만 나오는 글(도착 글, 사진 도감의 이름·설명, 안내)', '', { head: true }));
    codeLines(s3.strings).forEach((x) => scr.push(x));
  }
  add(Object.assign({}, base, { id: idOf(s3 ? '3D' : '화면'), kind: s3 ? 'scene3d' : 'screen', label: s3 ? '3D 설정' : '화면 원칙', title: s3 ? '3D로 만든 장면: 본문에 없는 배치·생김새' : '이야기 카드 장면: 하나님 표현과 그리지 않는 것', refs: d.ref, core: !!s3 || req, fold: true,
    lines: scr }));
  /* 나머지 글(참고): 통신, 재료, 관문, 탐지기 물음, 곁에서 보기·머물기, 말씀 카드, 장소 */
  const rest = [];
  rest.push(N('최현 박사의 통신(탐험대 이야기)', '', { head: true }));
  tierLines(m.call).forEach((x) => rest.push(x));
  rest.push(N('수리 재료(탐험대 이야기)', '', { head: true }));
  m.materials.forEach((x) => {
    rest.push(G('재료', x.name, { ref: x.basis }));
    rest.push(G('박사의 말', x.use, { sub: true })); rest.push(G('얻는 방법', x.how, { sub: true })); rest.push(G('얻었을 때 아이의 말', x.line, { sub: true }));
  });
  rest.push(N('관문 물음', '', { head: true }));
  TIERS.forEach((t) => d.gates[t].forEach((q, i) => qLines(q, t, '관문 ' + (i + 1)).forEach((x) => rest.push(x))));
  if (d.quests) {
    rest.push(N('3D 탐지기 물음', '', { head: true }));
    d.quests.forEach((q, i) => {
      rest.push(G('부품 ' + (i + 1), q.name, { sub: false })); rest.push(G('부품', q.part, { sub: true })); rest.push(G('있는 곳', q.found, { sub: true }));
      rest.push(G(who(q.say.who) + '의 말', q.say.text, { sub: true })); rest.push(G('찾았을 때', q.line, { sub: true }));
      TIERS.forEach((t) => qLines(q.q[t], t, '탐지기 ' + (i + 1)).forEach((x) => rest.push(x)));
    });
  }
  const others = steps.filter((s) => s.kind === 'watch' || s.kind === 'stay');
  if (others.length) rest.push(N('곁에서 보기 · 함께 머물기', '', { head: true }));
  others.forEach((s) => {
    rest.push(G(s.kind === 'watch' ? '보기' : '머물기', s.title, { ref: s.basis }));
    tierLines(s.text).forEach((x) => rest.push(Object.assign(x, { sub: true })));
    if (s.wait) rest.push(G('단추 글', s.wait, { sub: true }));
    if (s.say) rest.push(G(who(s.say.who) + '의 말', s.say.text, { sub: true }));
  });
  rest.push(N('말씀 카드', '', { head: true }));
  d.cards.forEach((c) => rest.push(G('카드', c.title, { ref: c.ref })));
  rest.push(N('곳과 사람(설계 메모, 화면에 그릴 때의 근거)', '', { head: true }));
  rest.push(G('곳', d.place)); rest.push(G('곳(설계)', d.design3d.place)); rest.push(G('땅', d.design3d.terrain));
  d.design3d.people.forEach((x) => rest.push(G('사람', x, { sub: true })));
  d.design3d.props.forEach((x) => rest.push(G('물건', x, { sub: true })));
  if (d.design3d.epic) rest.push(G('절정 장면', d.design3d.epic.why, { sub: true }));
  /* 3D 갈래가 3D로 바꾸며 따로 보관한 원래 값(_story_only, _card, _card3dc 등 밑줄로 시작하는 칸). 지금 화면에는 안 나오고 3D를 끄면 돌아온다 */
  Object.keys(d).filter((k) => k.startsWith('_')).forEach((k) => {
    rest.push(N('3D 장면으로 바꾸며 따로 보관한 원래 글(' + k + '). 지금 화면에는 나오지 않고, 그 장면의 3D를 끄면 이 글로 돌아갑니다', '', { head: true }));
    const walk = (o, pth) => { if (typeof o === 'string') { if (o) rest.push(G('보관 · ' + pth, o, { sub: true })); } else if (o && typeof o === 'object') Object.keys(o).forEach((x) => walk(o[x], pth + '.' + x)); };
    walk(d[k], k);
  });
  add(Object.assign({}, base, { id: idOf('기타'), kind: 'rest', label: '그 밖의 글(참고)', title: '통신·재료·관문·탐지기 물음·곁에서 보기·말씀 카드', refs: d.ref, core: false, fold: true, lines: rest }));
  /* 미해결 */
  const pastorOpen = [];
  unresolved.filter((u) => u.scene === sid).forEach((u, i) => {
    const c0 = CLASS[u.key]; if (c0 && c0.to === '목회자') pastorOpen.push([idOf('미해결' + (i + 1)), c0.ask]);
  });
  const beatsIt = byIdLive(idOf('대목'));
  if (pastorOpen.length) { beatsIt.lines.unshift(N('', '이 장면에서 검증자가 여쭌 것 ' + pastorOpen.length + '가지는 아래 "검증자가 남긴 것" 항목에 따로 있습니다. 대목 글을 고치실 때는 "대목 몇, 몇 세 글"인지 적어 주세요.')); beatsIt.asks = pastorOpen; }
  unresolved.filter((u) => u.scene === sid).forEach((u, i) => {
    const c = CLASS[u.key] || { to: '미분류', ask: '', why: '' };
    add(Object.assign({}, base, { id: idOf('미해결' + (i + 1)), kind: 'open', label: '검증자가 남긴 것', title: c.ask || '검증자가 감수 때 확인해 달라고 남긴 것', refs: '', core: c.to === '목회자' || c.to === '미분류', to: c.to, same: c.same || '', why: c.why || '', ukey: u.key,
      lines: openLines(u, sid) }));
  });
}
erasDoc.eras.forEach((e) => {
  add({ id: '시대' + e.era + '·안내', group: 'era', era: e.era, kind: 'era', label: '시대 안내', title: e.era + '. ' + e.name, refs: '', core: true,
    lines: [G('최현 박사의 통신(탐험대 이야기)', e.intro), N('"이 사이에 성경이 기록한 곳"으로 보여 주는 장절(요약 없이 장절만)', e.between.join(' · '))].concat(e.between.map((b) => G('', b, { hide: true }))) });
  add({ id: '시대' + e.era + '·마무리', group: 'era', era: e.era, kind: 'close', label: '마무리(기도·실천)', title: '이 시대 장면들의 한 문장 기도(8~10세)와 한 주 실천(11~13세). 꼴은 "공통·마무리"에서', refs: '', core: true,
    lines: [].concat.apply([], scenes.filter((d) => d.era === e.era).map((d) => [N(d.id + ' ' + d.title, '', { head: true, ref: d.ref }), G('8~10세 기도', d.close.t1.text, { t: 't1', sub: true }), G('11~13세 실천', d.close.t2.text, { t: 't2', sub: true }), G('14~19세 기록 물음', d.close.t3.prompt, { t: 't3', sub: true })])) });
  scenes.filter((d) => d.era === e.era).forEach(sceneItems);
  unresolved.filter((u) => !u.scene && u.era === e.era).forEach((u, i) => {
    const c = CLASS[u.key] || { to: '미분류', ask: '', why: '' };
    add({ id: '시대' + e.era + '·미해결' + (i + 1), group: 'era', era: e.era, kind: 'open', label: '검증자가 남긴 것', title: c.ask || '검증자가 남긴 것(시대 공통)', refs: '', core: c.to === '목회자' || c.to === '미분류', to: c.to, same: c.same || '', why: c.why || '', ukey: u.key,
      lines: openLines(u, null) });
  });
});

/* 글자 수(읽는 시간 어림) */
items.forEach((it) => { it.chars = it.lines.reduce((a, l) => a + (l.hide ? 0 : (l.v || '').length), 0); });
const byId = {}; items.forEach((it) => { if (byId[it.id]) throw new Error('항목 번호 겹침 ' + it.id); byId[it.id] = it; });
const sceneById = {}; scenes.forEach((d) => { sceneById[d.id] = d; });

/* ───────── 3. 먼저 볼 30항목 ───────── */
/* 급한 순서(독립 검증 A-5·A-6 반영): ① 신약 연결 16곳(규칙서 3.5·13.6) ② 검증자가 목회자 판단이 필요하다고 남긴 것 가운데 규칙서 3.5의 주제
 *  (어린 나이의 글에 둔 심판·죽음, 주권과 책임, 신약적 의미, 범죄한 아담의 동행, 창조를 지켜보는 틀)에 닿는 14가지. 손으로 고른 목록이며, 항목이 없어지면 멈춘다. */
const FIRST_OPEN = [
  ['OT-10·미해결1', '장자의 죽음을 8~10세 글에 둔 것'], ['OT-10·미해결2', '주권과 책임(출 11:10)'], ['OT-11·미해결2', '심판 장면을 어린 나이 글에 둔 것'],
  ['OT-02·미해결2', '죽음과 저주의 말씀을 8~10세 글에 둔 것'], ['OT-02·미해결1', '창 3:15(신약적 의미)'], ['OT-02·미해결3', '범죄한 아담을 동행 인물로 둔 것'],
  ['OT-03·미해결1', '홍수의 죽음을 8~10세 글에 둔 것'], ['OT-29·미해결1', '주권과 책임(왕상 12:15)'], ['OT-29·미해결5', '주권과 책임(왕상 12:24)'],
  ['OT-31·미해결1', '하나님이 뜻을 돌이키셨다는 표현'], ['OT-32·미해결1', '진노를 8~10세 글에 둔 것'], ['OT-35·미해결5', '진노를 8~10세에게 묻는 것'],
  ['OT-37·미해결3', '하나님의 주권(다른 나라 왕의 마음)'], ['OT-01·미해결2', '창조를 "지켜보기" 틀에 넣은 것']];
items.forEach((it) => { it.pscore = 0; it.pwhy = ''; if (it.kind === 'nt') { it.pscore = 100; it.pwhy = '구약 사건과 그리스도·신약의 연결(규칙서 3.5, 13.6)'; } });
FIRST_OPEN.forEach(([id, why], i) => { const it = byId[id]; if (!it || !it.core) throw new Error('먼저 볼 항목이 없거나 목회자 항목이 아님: ' + id); it.pscore = 90 - i; it.pwhy = why; });
const first30 = items.filter((it) => it.pscore > 0).sort((a, b) => b.pscore - a.pscore || items.indexOf(a) - items.indexOf(b)).slice(0, 30);
first30.forEach((it, i) => { it.pri = i + 1; });
/* 감수 범위를 먼저 정할 것: "이 장면을 감수 필수로 할지"를 묻는 검증자의 물음 */
const scopeItems = items.filter((it) => it.kind === 'open' && it.core && /감수 필수/.test(it.title) && !it.pri);

/* ───────── 4. 숫자 대조 ───────── */
const REQ_N = scenes.filter((d) => d.review.required).length;
const TABLE_REQ = rd('docs/09_구약전체_장면표.md').split('\n').filter((l) => /\| OT-\d\d \|/.test(l) && /\|\s*예[^|]*\|\s*$/.test(l)).length;
const cnt = (k) => items.filter((it) => it.kind === k).length;
const scenesWith = (k) => new Set(items.filter((it) => it.kind === k).map((it) => it.scene)).size;
const COUNTS = [
  ['오늘의 물음', scenesWith('today') + '장면 / 물음 ' + cnt('today') + '개', '40(장면)', scenesWith('today') === 40, '진행표는 장면 수(40)를 적었다. 물음은 장면마다 1~2개여서 ' + cnt('today') + '개다'],
  ['뜻 묻기', String(cnt('ask')), '40', cnt('ask') === 40, ''],
  ['신약 연결', String(cnt('nt')), '16', cnt('nt') === 16, ''],
  ['손으로 하는 돕기', String(cnt('do')), '42', cnt('do') === 42, ''],
  ['마무리(기도·실천·기록 물음)', scenes.length + '장면(시대별 ' + cnt('close') + '항목으로 모음)', '40(장면마다 하나)', cnt('close') === 10, '진행표에 수가 따로 없다'],
  ['14~19세 "삶에 적용" 질문(규칙서 3.5)', '0', '—', true, '아직 쓰지 않았다. 지금은 사실을 적는 기록 물음 한 가지뿐이다("공통·마무리" 항목에서 방향을 여쭘)'],
  ['코드에 들어 있는 화면 글', (byId['공통·화면글'].lines.length + byId['공통·화면글참고'].lines.length + byId['추리·요단강'].lines.length) + '줄 + 3D 장면 12개의 도감·안내', '—', true, '장면 자료가 아니라 게임 코드에 있는 글. 독립 검증의 지적으로 더함'],
  ['동행 인물 문답', scenesWith('talk') + '장면 / 문답 ' + cnt('talk') + '개', '—', true, '진행표에 수가 없다. 동행 인물이 없는 장면 ' + (40 - scenesWith('talk')) + '개(본문에 그 장면에서 말한 사람이 없음)'],
  ['3D 설정', String(cnt('scene3d')), '12(3D 장면)' + (EXTRA3D.length ? ' + 장면표 밖 ' + EXTRA3D.length : ''), cnt('scene3d') === 12 + EXTRA3D.length && BASE3D.every((id) => scene3d[id]),
    '호렙 산(OT-09) 포함' + (EXTRA3D.length ? '. 장면표 밖에 새로 만든 3D 장면: ' + EXTRA3D.join('·') + '(대표 결재지 마1)' : '')],
  ['검증자가 남긴 것(미해결)', String(cnt('open')), '—', true, '검증 기록 10개에서 뽑은 전체. 분류는 아래'],
  ['감수 필수 장면', String(REQ_N), '장면표(`docs/09`) "예" ' + TABLE_REQ, REQ_N === TABLE_REQ, '']
];
const openBy = {}; items.filter((it) => it.kind === 'open').forEach((it) => { openBy[it.to] = (openBy[it.to] || 0) + 1; });
const coreItems = items.filter((it) => it.core);
const CPM = 500; /* 꼼꼼히 읽을 때 1분에 읽는 글자 수(어림) */
const mins = (list) => Math.round(list.reduce((a, it) => a + it.chars, 0) / CPM);
const VERSION = sha(JSON.stringify(items.map((it) => [it.id, it.title, it.to, it.lines.map((l) => [l.k, l.v, l.ref])]))).slice(0, 8);

if (CHECK_ONLY) { printCounts(); process.exit(COUNTS.every((c) => c[3]) ? 0 : 1); }
function printCounts() {
  COUNTS.forEach((c) => console.log((c[3] ? '맞음 ' : '다름 ') + c[0] + ': 뽑은 수 ' + c[1] + ' / 진행표 ' + c[2] + (c[4] ? ' — ' + c[4] : '')));
  console.log('미해결 분류: ' + Object.keys(openBy).map((k) => k + ' ' + openBy[k]).join(' · '));
  console.log('표시할 항목 ' + coreItems.length + '개, 글자 ' + coreItems.reduce((a, it) => a + it.chars, 0) + ' (어림 ' + mins(coreItems) + '분) · 전체 항목 ' + items.length + '개 · 자료 판 ' + VERSION);
}

/* ───────── 5. 글(md) ───────── */
const KIND_ORDER = ['beats', 'talk', 'do', 'ask', 'nt', 'today', 'close', 'scene3d', 'screen', 'open', 'rest'];
const RULE_N = RULE_ITEMS.length;
const pastorView = (it) => it.kind !== 'open' || it.core;
const refTxt = (l) => (l.ref ? ' (' + l.ref + ')' : '');
/* 표시 칸의 이름: 검증자의 물음은 "지금대로 / 바꿈 / 의논", 나머지는 "그대로 / 고침 / 뺌" */
const marks = (it) => (it.kind === 'open' || it.askMarks ? ['지금대로', '바꿈', '의논 필요'] : ['그대로', '고침', '뺌']);
function mdItem(it) {
  const o = [];
  o.push('#### ' + it.id + ' · ' + it.label + (it.pri ? ' · ★먼저 볼 ' + it.pri : '') + (it.core ? '' : ' · 참고'));
  o.push('');
  if (it.title) o.push('*' + it.title + '*' + (it.refs ? ' — ' + it.refs : ''));
  it.lines.forEach((l) => {
    if (l.hide) return;
    if (l.head) { o.push('- **' + l.k + '**' + refTxt(l)); return; }
    if (l.img) { o.push('  - ![' + l.k + '](' + MD_IMG_PREFIX + l.img + ')'); return; }
    o.push((l.sub ? '  - ' : '- ') + (l.k ? l.k + ': ' : '') + l.v + refTxt(l));
  });
  if (it.core) { o.push(''); o.push('표시: ' + marks(it).map((x) => '☐ ' + x).join(' ') + ' 　적을 칸: '); }
  o.push('');
  return o.join('\n');
}
function sceneHead(d) {
  return '### ' + d.id + ' ' + d.title + ' (' + d.ref + ')\n\n- 곳: ' + d.place + '\n- 감수 필수: ' + (d.review.required ? '예 — ' + d.review.topics.join(' / ') : '아니오') + '\n- 화면: ' + (scene3d[d.id] ? '3D 장면' : '이야기 카드') + ' · 감수 상태: ' + d.review.status + '\n';
}
function eraMd(e) {
  const o = ['# 감수 자료 · 시대 ' + e.era + '. ' + e.name, '', '자료 판 `' + VERSION + '` · `node tools/make_review_pack.js`가 만든 파일입니다(손으로 고치지 않습니다). 게임에 나오는 문장은 글자 그대로이고, 성경 본문은 싣지 않았습니다(장절만).', ''];
  items.filter((it) => it.group === 'era' && it.era === e.era && it.kind !== 'open').forEach((it) => o.push(mdItem(it)));
  scenes.filter((d) => d.era === e.era).forEach((d) => {
    o.push(sceneHead(d));
    const list = items.filter((it) => it.scene === d.id && pastorView(it)).sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
    list.forEach((it) => o.push(mdItem(it)));
  });
  const eo = items.filter((it) => it.group === 'era' && it.era === e.era && it.kind === 'open' && it.core);
  if (eo.length) { o.push('### 시대 ' + e.era + ' 공통으로 검증자가 남긴 것\n'); eo.forEach((it) => o.push(mdItem(it))); }
  return o.join('\n');
}

const GUIDE = {
  what: [
    '이 게임은 8~19세 아이들이 구약 40장면을 탐험하며 **자기 성경책을 직접 펴서** 답을 찾게 만든 게임입니다. 아직 아이들에게 공개하지 않았고, 목사님 감수를 마치기 전에는 공개하지 않습니다. 기준은 성경과 웨스트민스터 표준문서(신앙고백, 대·소요리문답)입니다.',
    '글은 성경 본문과 두 차례 이상 대조했습니다. 다만 대조한 본문은 **개역한글과 KJV**이고, **개역개정과는 대조하지 못했습니다**(사용 허락 전이라 본문을 갖고 있지 않습니다). 아이들이 펴는 책은 개역개정이니, 낱말이나 표기가 목사님 성경과 다르면 알려 주세요.',
    '**신학 판단은 하지 않고 목사님께 남겨 두었습니다.** 이 자료가 그 목록입니다.'
  ],
  how: [
    '항목마다 **그대로 / 고침 / 뺌** 가운데 하나를 골라 주세요. "고침"과 "뺌"에는 한 줄만 적어 주셔도 됩니다(어떻게 고칠지, 왜 빼는지).',
    '**그대로**: 이대로 아이들에게 보여도 된다. **고침**: 적어 주신 대로 고친 뒤 쓴다. **뺌**: 아이들에게 보이지 않는다.',
    '"검증자가 남긴 것"과 "대표가 여쭙는 것" 항목은 물음의 꼴이라 표시가 다릅니다: **지금대로**(지금 되어 있는 대로 둔다) / **바꿈**(적어 주신 대로 바꾼다) / **의논 필요**.',
    '"검증자가 남긴 것"의 아래 글은 검증 기록을 옮긴 것입니다(자료 이름만 우리말로 풀었습니다). 그 장면의 글은 같은 장면의 "대목 글"과 다른 항목에 그대로 있습니다. 기록 속의 "위·아래 …"는 검증 기록 안의 다른 곳을 가리키고, "대목 0"처럼 0부터 센 곳도 있으니 **장절로 찾아 주세요.** 그 아래 "지금 게임의 글"은 그 물음이 가리키는 지금 게임의 문장을 자동으로 찾아 붙인 것이라 일부만 실렸을 수 있습니다. 검증 기록과 지금 자료가 다르면 "덧붙임"이 지금 상태를 알려 드립니다.',
    '원칙(규칙) 항목에서는 **그대로 = 이 원칙에 동의, 고침 = 조건을 달아 동의, 뺌 = 이 방식은 쓰지 않는다**는 뜻입니다. 원칙에서 "뺌"이 나오면 그 원칙에 딸린 장면 항목은 보실 필요가 없습니다.',
    '휴대폰·컴퓨터에서는 `감수자료.html`을 열면 표시한 것이 그 기기에 저장되고, "내보내기"로 글로 뽑아 보내실 수 있습니다. 종이가 편하시면 `감수자료_인쇄용.html`을 인쇄해 주세요(전체는 A4 약 240쪽으로 많습니다. `먼저볼30_인쇄용.html`은 원칙과 먼저 볼 30항목만으로 약 30쪽입니다).',
    '성경 본문은 싣지 않았습니다(사용 허락 전). 장절을 보시고 성경책에서 확인해 주세요.',
    '3D 장면과 인물의 화면 사진은 전체 감수 자료(`감수자료.html`, `감수자료_인쇄용.html`)에 몇 장씩 실었습니다(컴퓨터에서 휴대폰 크기로 찍은 것). 움직임과 소리는 사진으로 알 수 없으니, 직접 보셔야 판단되는 것은 메모로 남겨 주세요(대표가 미리보기 화면을 보여 드릴 수 있습니다).'
  ],
  order: [
    '① **원칙과 공통 항목**: 여기서 방향이 정해집니다.',
    '② **감수 범위**: 지금 "감수 필수 아님"으로 둔 장면을 필수로 올릴지 묻는 물음 몇 가지.',
    '③ **먼저 볼 30항목**: 가장 급한 것만 모았습니다. 시간이 넉넉하지 않으시면 ①②③을 먼저 보시고, 나머지는 나누어 보셔도 됩니다.',
    '④ **시대별 10묶음**: 감수 필수 장면부터, 나머지는 여유 있을 때.'
  ],
  flow: [
    '도착: 최현 박사의 통신(탐험대 이야기). 무엇이 고장 났고 무엇을 도울지.',
    '(동행 인물의 말이 사건보다 앞이면 여기서 동행 문답)',
    '대목: 사건을 차례로 지켜봄. 대목 사이에 **곁에서 보기 · 함께 머물기 · 손으로 하는 돕기**가 끼어 있음. 하나님의 말씀이 나오는 대목에는 "성경책에서 직접 읽어요"와 펼 장절이 뜸.',
    '관문: 성경을 펴야 답할 수 있는 물음 둘. 틀리면 "틀렸습니다" 대신 읽을 곳을 다시 보여 줌(다른 곳의 내용을 고르면 "타임머신 바늘이 엇나갔어요").',
    '(동행 인물의 말이 사건 중이나 뒤이면 여기서 동행 문답)',
    '뜻 묻기: 그 일의 뜻을 묻고, 성경 읽기 물음을 맞히면 14~19세에게만 **신약 연결**이 뜸("목사님 감수 전" 표시와 함께).',
    '수리 재료를 얻음(탐험대 이야기) → **오늘의 물음**(최현 박사가 답함, "감수 전" 표시) → 말씀 카드 → **마무리**(기도·실천·기록. 시대의 마지막 장면이 아니면 접혀 있음).',
    '3D 장면(12개)은 같은 내용을 걸어 다니며 봅니다. 차례가 조금 달라, 탐지기 물음(재료 찾기)이 사건을 지켜보기보다 먼저 나옵니다. 사진을 찍으면 도감 설명이 뜹니다.'
  ]
};

function readmeMd() {
  const o = [];
  o.push('# 목회자 감수 자료 (바이블 온유 · 구약 40장면)', '');
  o.push('## 한 장 안내 (목사님께)', '');
  GUIDE.what.forEach((x) => o.push(x, ''));
  o.push('### 무엇을, 얼마나', '');
  o.push('| 묶음 | 항목 수 | 걸리는 시간(어림) |', '|---|---|---|');
  const row = (name, list) => o.push('| ' + name + ' | ' + list.length + ' | 약 ' + fmtMin(mins(list)) + ' |');
  row('① 원칙 ' + RULE_N + '가지와 공통 항목', items.filter((it) => it.group === 'rule' && it.core));
  row('② 감수 범위를 정하는 물음', scopeItems);
  row('③ 먼저 볼 30항목', first30);
  row('④ 감수 필수 장면 ' + REQ_N + '개의 표시 항목(③과 겹치는 것 포함)', coreItems.filter((it) => it.scene && sceneById[it.scene].review.required));
  row('⑤ 나머지 장면 ' + (40 - REQ_N) + '개의 표시 항목', coreItems.filter((it) => it.scene && !sceneById[it.scene].review.required));
  row('⑥ 시대 안내·마무리 등 시대마다 하나씩인 항목', coreItems.filter((it) => !it.scene && it.group !== 'rule'));
  row('전체(표시할 항목, ①④⑤⑥을 더한 수. ②③은 그 안에서 고른 것)', coreItems);
  o.push('', TIME_NOTE, '');
  o.push('### 표시하는 방법', ''); GUIDE.how.forEach((x) => o.push('- ' + x)); o.push('');
  o.push('### 보시는 순서(권함)', ''); GUIDE.order.forEach((x) => o.push('- ' + x)); o.push('');
  o.push('### 한 장면이 흘러가는 차례 (그 글이 언제 보이는지)', ''); GUIDE.flow.forEach((x, i) => o.push((i + 1) + '. ' + x)); o.push('');
  o.push('글 앞의 "8~10세 / 11~13세 / 14~19세"는 그 나이 단계의 아이에게 보이는 글입니다. 세 단계의 사실은 같고 깊이만 다릅니다.', '');
  o.push('### 항목의 종류', '');
  o.push('| 종류 | 무엇인가 | 수 |', '|---|---|---|');
  [['대목 글(장면 전체)', '장면의 사건을 나이 단계별로 풀어 쓴 글. 감수 필수 장면만 표시 항목이고, 나머지는 참고로 실었습니다', cnt('beats')],
    ['동행 인물 문답', '성경 인물이 아이의 물음에 "기록된 자기 말"로 답하는 곳', cnt('talk')],
    ['손으로 하는 돕기', '아이가 그 시대 사람들의 평범한 일을 돕는 단계', cnt('do')],
    ['뜻 묻기', '도운 뒤 그 일의 뜻을 본문으로 깨닫는 단계', cnt('ask')],
    ['신약 연결', '구약 사건을 신약 장절과 잇는 글(14~19세만)', cnt('nt')],
    ['오늘의 물음', '지금 아이가 궁금해할 물음과 최현 박사의 답', cnt('today')],
    ['마무리(기도·실천)', '8~10세 기도, 11~13세 실천, 14~19세 기록 물음. 시대별로 모았습니다', cnt('close')],
    ['공통 · 시대 추리', '읽어 주기, 마무리의 꼴, 3D 인물의 생김새, 모든 장면에 똑같이 뜨는 글, 요단 강 시대 추리', items.filter((it) => it.kind === 'common' && !it.id.startsWith('여쭘·')).length],
    ['대표가 여쭙는 것', '대표 결재지에서 목사님 판단이 섞여 넘긴 것(원칙과 공통 항목 묶음 안. 표시는 지금대로 / 바꿈 / 의논 필요)', items.filter((it) => it.id.startsWith('여쭘·')).length],
    ['3D 설정 / 화면 원칙', '하나님을 어떻게 표현하는지, 무엇을 그리지 않는지, 본문에 없는 배치', cnt('scene3d') + ' / ' + cnt('screen')],
    ['검증자가 남긴 것', '본문 대조를 한 검증자가 "감수 때 정해 달라"고 남긴 것', (openBy['목회자'] || 0) + (openBy['미분류'] || 0)],
    ['그 밖의 글(참고)', '관문 물음, 탐지기 물음, 재료, 곁에서 보기 등. 표시 항목은 아니지만 빠짐없이 실었습니다', cnt('rest')]
  ].forEach((r) => o.push('| ' + r.join(' | ') + ' |'));
  o.push('');
  o.push('## 파일', '');
  o.push('| 파일 | 쓰임 |', '|---|---|');
  o.push('| `감수자료.html` | 휴대폰·컴퓨터에서 읽고 표시. 표시는 그 기기에 저장되고 "내보내기"로 글로 뽑습니다 |');
  o.push('| `감수자료_인쇄용.html` | A4 인쇄(원칙 → 먼저 볼 30 → 시대별). 브라우저의 인쇄에서 "PDF로 저장"도 됩니다 |');
  o.push('| `먼저볼30_인쇄용.html` | 먼저 볼 30항목만 A4로 |');
  o.push('| `참고_장면전체글_인쇄용.html` | 대목 글과 그 밖의 글 전부(참고용, 깁니다) |');
  o.push('| `md/시대01.md` ~ `md/시대10.md` | 같은 내용의 글 파일(시대별, 참고 글 포함) |');
  o.push('| `항목목록.json` | 항목 번호와 그 글이 장면 자료의 어디에 있는지(감수 결과를 반영할 때 씁니다) |');
  o.push('| `미해결_분류.json` · `미해결_전체.md` | 검증자가 남긴 것 ' + cnt('open') + '건을 목회자/대표/코드/이미 풀림으로 나눈 것과 그 까닭 |');
  o.push('| `대표_결재지.md` · `.html` | 대표가 정할 것(검증자가 대표에게 넘긴 것 포함) |');
  o.push('| `개역개정_신청_준비.md` | 성경 본문 사용 허락 신청 준비(보내지 않음) |');
  o.push('', '이번 감수의 범위는 구약 40장면(3D 게임, `web3d/`)과 거기서 갈 수 있는 요단 강 시대 추리입니다. 출애굽기 시범판(`web/`, 2D)은 범위가 아니며 아이들에게 공개하지 않습니다.');
  o.push('');
  o.push('## 뽑은 수와 진행표의 수 대조', '');
  o.push('| 항목 | 뽑은 수 | 진행표(`docs/11`)의 수 | 맞는가 | 까닭 |', '|---|---|---|---|---|');
  COUNTS.forEach((c) => o.push('| ' + c[0] + ' | ' + c[1] + ' | ' + c[2] + ' | ' + (c[3] ? '맞음' : '**다름**') + ' | ' + c[4] + ' |'));
  o.push('', '검증자가 남긴 것 ' + cnt('open') + '건의 분류: ' + Object.keys(openBy).sort().map((k) => k + ' ' + openBy[k]).join(' · ') + '. "목회자"와 "미분류"만 표시 항목으로 실었고, "대표"는 `대표_결재지.md`로, "코드"·"풀림"·"같음"은 `미해결_전체.md`에 까닭과 함께 적었습니다.', '');
  o.push('만드는 방법(만드는 사람용): 이 폴더의 파일은 `node tools/make_review_pack.js`가 장면 자료와 게임 코드에서 뽑아 만듭니다(자료 판 `' + VERSION + '`). 내용이 바뀌면 다시 돌리면 되고 손으로 고치지 않습니다. 검사는 `node tools/test/check_review_pack.js`, 화면 점검은 `node tools/test/shot_review_pack.js`.', '');
  o.push('## 감수 범위를 먼저 정할 것', '', '지금 "감수 필수 아님"으로 둔 장면 가운데, 검증자가 필수로 올릴지 물은 것입니다. 글은 그 장면의 시대 묶음에 있습니다.', '');
  scopeItems.forEach((it) => o.push('- **' + it.id + '** ' + it.title));
  o.push('');
  o.push('## 먼저 볼 30항목', '');
  o.push(FIRST_NOTE, '');
  o.push('| 순서 | 항목 번호 | 장면 | 종류 | 왜 먼저인가 |', '|---|---|---|---|---|');
  first30.forEach((it) => o.push('| ' + it.pri + ' | ' + it.id + ' | ' + sceneById[it.scene].title + ' (' + sceneById[it.scene].ref + ') | ' + it.label + ' | ' + it.pwhy + ' |'));
  o.push('');
  o.push('## 원칙 ' + RULE_N + '가지와 공통 항목', '', '규칙서(`docs/00_공통규칙서.md`) 3절과 13절(대표 결정, 목회자 감수 전)에서 목사님이 먼저 보실 것을 옮겼습니다. "규칙서" 줄은 규칙서의 글 그대로입니다. 그 뒤는 모든 장면에 걸치는 공통 항목입니다.', '');
  items.filter((it) => it.group === 'rule').forEach((it) => o.push(mdItem(it)));
  return o.join('\n');
}
const TIME_NOTE = '시간은 1분에 ' + CPM + '자를 읽는다고 보고 글자 수로만 어림한 것입니다. **성경을 펴 보시는 시간은 넣지 않았으니 실제로는 두세 배가 걸릴 수 있습니다.**';
const FIRST_NOTE = '뽑은 기준: ① 신약 연결 16곳(규칙서 3.5·13.6. 구약 사건을 신약 장절과 잇는 한두 문장) ② 검증자가 목회자의 판단이 필요하다고 남긴 것 가운데 규칙서 3.5의 주제에 닿는 14가지(어린 나이의 글에 둔 심판·죽음, 주권과 책임, 창 3:15, 범죄한 아담의 동행, 뜻을 돌이키심, 창조를 지켜보는 틀).';
function fmtMin(m) { return m < 60 ? m + '분' : Math.floor(m / 60) + '시간 ' + (m % 60 ? (m % 60) + '분' : ''); }

function unresolvedMd() {
  const o = ['# 검증자가 남긴 것(미해결) 전체와 분류', '', '자료 판 `' + VERSION + '`. 검증 기록(`content/ot/_verify/era-N.md`)의 "미해결" ' + cnt('open') + '건을 스크립트로 뽑고, 분류(`미해결_분류.json`)를 붙였습니다. 분류는 작성 과정을 보지 않은 에이전트가 지금의 장면 자료를 열어 보고 정한 것이며, 신학 판단은 하지 않았습니다.', '',
    '- **목회자**: 감수 자료에 표시 항목으로 실음 · **대표**: `대표_결재지.md`로 · **코드**: 화면·코드로 고칠 일(총괄에게) · **풀림**: 뒤 회차에서 이미 고쳐짐 · **같음**: 다른 항목과 같은 문제 · **미분류**: 분류가 없어 목회자 항목으로 실음', ''];
  ['목회자', '미분류', '대표', '코드', '풀림', '같음'].forEach((to) => {
    const list = items.filter((it) => it.kind === 'open' && it.to === to);
    if (!list.length) return;
    o.push('## ' + to + ' (' + list.length + ')', '');
    list.forEach((it) => {
      o.push('- **' + it.id + '**' + (it.title && it.to !== '풀림' && it.to !== '같음' && it.to !== '코드' ? ' ' + it.title : '') + (it.same ? ' (같은 항목: ' + (items.find((x) => x.ukey === it.same) || { id: it.same }).id + ')' : ''));
      o.push('  - ' + it.lines[0].k + ': ' + it.lines[0].v);
      if (it.why) o.push('  - 분류 까닭: ' + it.why);
    });
    o.push('');
  });
  return o.join('\n');
}

/* ───────── 6. HTML ───────── */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inl = (s) => esc(s).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>');
function htmlLines(it) {
  return it.lines.map((l) => {
    if (l.hide) return '';
    const ref = l.ref ? ' <span class="rf">' + esc(l.ref) + '</span>' : '';
    if (l.head) return '<p class="hd">' + esc(l.k) + ref + '</p>';
    if (l.img) return '<figure><img alt="' + esc(l.k) + '" loading="lazy" src="data:image/jpeg;base64,' + fs.readFileSync(path.join(IMG_DIR, l.img)).toString('base64') + '"><figcaption>' + esc(l.k) + '</figcaption></figure>';
    const cls = ['ln', l.sub ? 'sub' : '', l.g ? 'g' : 'n', l.t || '', l.opt || ''].filter(Boolean).join(' ');
    const v = l.swatch ? esc(l.v).replace(/#[0-9A-Fa-f]{6}/g, (c) => '<i class="sw" style="background:' + c + '"></i>') : (l.g ? esc(l.v) : inl(l.v));
    return '<p class="' + cls + '">' + (l.k ? '<span class="k">' + esc(l.k) + '</span> ' : '') + '<span class="v">' + v + '</span>' + ref + '</p>';
  }).join('\n');
}
function htmlItem(it, mode) {
  const print = mode === 'print';
  const mark = !it.core ? '' : print
    ? '<div class="pm">' + marks(it).map((x) => '<span>☐ ' + x + '</span>').join('') + '<span class="wr">적을 칸</span></div>'
    : '<div class="mk" data-id="' + esc(it.id) + '" data-lab="' + marks(it).join('|') + '"><label><input type="radio" name="m-' + esc(it.id) + '" value="ok"><span>' + marks(it)[0] + '</span></label><label><input type="radio" name="m-' + esc(it.id) + '" value="fix"><span>' + marks(it)[1] + '</span></label><label><input type="radio" name="m-' + esc(it.id) + '" value="del"><span>' + marks(it)[2] + '</span></label><button type="button" class="clr" title="표시 지우기">지움</button><textarea rows="1" placeholder="적을 칸(고칠 말, 빼는 까닭)"></textarea></div>';
  const body = htmlLines(it);
  const cls = ['it', 'k-' + it.kind, it.core ? 'core' : 'ref', it.pri ? 'pri' : ''].filter(Boolean).join(' ');
  const head = '<header><span class="code">' + esc(it.id) + '</span><span class="kd">' + esc(it.label) + '</span>' + (it.pri && !print ? '<span class="star">먼저 볼 ' + it.pri + '</span>' : '') + (it.refs ? '<span class="rf">' + esc(it.refs) + '</span>' : '') + '</header>' + (it.title ? '<p class="tt">' + esc(it.title) + '</p>' : '');
  const inner = it.fold && !print ? '<details><summary>' + esc(it.label) + ' 펼치기 (' + it.chars + '자)</summary>' + body + '</details>' : body;
  return '<article class="' + cls + '" id="' + esc(it.id) + '" data-scene="' + esc(it.scene || '') + '">' + head + inner + mark + '</article>';
}
function htmlSceneHead(d) {
  return '<h3 id="' + d.id + '">' + esc(d.id + ' ' + d.title) + ' <span class="rf">' + esc(d.ref) + '</span></h3><p class="sm">' + (d.review.required ? '<b class="req">감수 필수</b> ' + esc(d.review.topics.join(' / ')) : '감수 필수 아님') + ' · ' + (scene3d[d.id] ? '3D 장면' : '이야기 카드') + ' · ' + esc(d.place) + '</p>';
}
const CSS_COMMON = `
:root{--bg:#faf8f3;--card:#fff;--ink:#1f2328;--mut:#5d6570;--line:#e3ddd0;--acc:#1f6f5c;--warn:#a23b2a;--soft:#f1ede3;--star:#8a5a00}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.65 -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR","Noto Sans CJK KR",sans-serif;word-break:keep-all;overflow-wrap:anywhere}
h1{font-size:1.45rem;margin:.2em 0}h2{font-size:1.25rem;margin:1.6em 0 .5em;padding-top:.4em;border-top:3px solid var(--acc)}h3{font-size:1.08rem;margin:1.5em 0 .2em}
.rf{color:var(--acc);font-size:.86em;white-space:normal}.sm{color:var(--mut);font-size:.9em;margin:.1em 0 .6em}.req{color:var(--warn)}
.it{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin:10px 0}
.it header{display:flex;flex-wrap:wrap;gap:4px 8px;align-items:baseline}
.code{font-weight:700;font-size:.9em}.kd{background:var(--soft);border-radius:6px;padding:0 6px;font-size:.84em}.star{background:#fff3cf;color:var(--star);border-radius:6px;padding:0 6px;font-size:.8em;font-weight:700}
.tt{margin:.15em 0 .3em;color:var(--mut);font-size:.9em}
.ln{margin:.3em 0}.ln.sub{margin-left:1em;font-size:.95em}.ln .k{color:var(--mut);font-size:.82em;margin-right:2px}
.ln.g .v{font-weight:500}.ln.n .v{color:#3b4350}.ln.ok .k{color:var(--acc);font-weight:700}
.sw{display:inline-block;width:1.1em;height:1.1em;border:1px solid #888;border-radius:3px;vertical-align:-.2em;margin:0 2px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
figure{margin:.4em 0 .4em 1em;display:inline-block;vertical-align:top;max-width:calc(100% - 1em)}figure img{max-width:100%;height:auto;border:1px solid var(--line);border-radius:6px;display:block}figcaption{font-size:.78em;color:var(--mut)}
.hd{margin:.7em 0 .1em;font-weight:700;font-size:.9em;border-bottom:1px dashed var(--line)}
table{border-collapse:collapse;width:100%;font-size:.92em}th,td{border:1px solid var(--line);padding:4px 6px;text-align:left;vertical-align:top}th{background:var(--soft)}
code{background:var(--soft);padding:0 4px;border-radius:4px;font-size:.9em}
`;
const CSS_SCREEN = `
main{max-width:860px;margin:0 auto;padding:0 16px 120px}
.top{position:sticky;top:0;z-index:5;background:var(--bg);border-bottom:1px solid var(--line);padding:6px 16px}
.top .row{max-width:860px;margin:0 auto;display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.top b{font-size:.9em}.bar{flex:1 1 90px;height:8px;background:var(--line);border-radius:4px;overflow:hidden;min-width:60px}.bar i{display:block;height:100%;background:var(--acc);width:0}
button,select{font:inherit;font-size:.88em;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:8px;padding:5px 9px;min-height:36px}
button.pr{background:var(--acc);color:#fff;border-color:var(--acc)}
details>summary{cursor:pointer;color:var(--acc);font-size:.9em;padding:4px 0}
.mk{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:8px;padding-top:8px;border-top:1px solid var(--line)}
.mk label{display:inline-flex;align-items:center}.mk input{position:absolute;opacity:0;width:1px;height:1px}
.mk label span{border:1px solid var(--line);border-radius:999px;padding:5px 13px;min-height:36px;display:inline-flex;align-items:center;font-size:.9em;background:var(--card)}
.mk input:focus-visible+span{outline:2px solid var(--acc)}
.mk input[value=ok]:checked+span{background:var(--acc);color:#fff;border-color:var(--acc)}
.mk input[value=fix]:checked+span{background:#8a5a00;color:#fff;border-color:#8a5a00}
.mk input[value=del]:checked+span{background:var(--warn);color:#fff;border-color:var(--warn)}
.mk .clr{border:0;background:none;color:var(--mut);text-decoration:underline;padding:4px;min-height:32px}
.mk textarea{flex:1 1 100%;font:inherit;font-size:.92em;border:1px solid var(--line);border-radius:8px;padding:6px 8px;resize:vertical;min-height:38px;background:#fffdf8;color:var(--ink)}
.it.done{border-left:5px solid var(--acc)}.it.fix{border-left:5px solid #8a5a00}.it.del{border-left:5px solid var(--warn)}
body.f-pri .it:not(.pri),body.f-req .sc:not(.rq),body.f-todo .it.done,body.f-todo .it.fix,body.f-todo .it.del,body.f-todo .it.ref,body.f-pri .ref{display:none}
body.f-pri .sc.nopri,body.f-pri .noprisec{display:none}
nav.toc{display:flex;flex-wrap:wrap;gap:6px;margin:.6em 0}nav.toc a{border:1px solid var(--line);border-radius:8px;padding:4px 8px;text-decoration:none;color:var(--ink);background:var(--card);font-size:.88em}
dialog{border:1px solid var(--line);border-radius:12px;max-width:min(680px,94vw);width:100%;padding:14px}
dialog textarea{width:100%;height:42vh;font:13px/1.5 ui-monospace,Menlo,Consolas,monospace}
.note{background:var(--soft);border-radius:10px;padding:8px 12px;font-size:.93em}
@media (prefers-color-scheme:dark){:root{--bg:#16181b;--card:#1f2226;--ink:#e8e6e1;--mut:#a3a9b3;--line:#363a40;--acc:#58c2a8;--warn:#ef8d7c;--soft:#2a2e33;--star:#f0c661}.star{background:#4a3a10}.ln.n .v{color:#c3c8d0}.mk textarea{background:#1a1c1f}}
@media print{.top,.mk .clr,nav.toc{display:none}main{max-width:none;padding:0}.it{break-inside:avoid}}
`;
const CSS_PRINT = `
@page{size:A4;margin:14mm 13mm}
figure{width:31%;margin:.3em .8% .3em 0;break-inside:avoid}figure img{max-height:62mm;width:auto;max-width:100%}
body{font-size:10.5pt;line-height:1.5;background:#fff}
main{padding:0}h1{font-size:17pt}h2{font-size:14pt;break-before:page}h2.first{break-before:auto}h3{font-size:12pt;break-after:avoid}
.it{border:1px solid #bbb;border-radius:0;padding:5px 8px;margin:6px 0;break-inside:avoid}
.it.long{break-inside:auto}
.pm{display:flex;gap:14px;margin-top:5px;padding-top:4px;border-top:1px solid #ccc;font-size:10pt}.pm .wr{flex:1;border-bottom:1px solid #888;color:#777;font-size:8.5pt}
.ln{margin:.15em 0}.sm{margin-bottom:.3em}
.cover{break-after:page}
`;
const JS_SCREEN = `
(function(){
var KEY='bo-review-'+document.body.getAttribute('data-version').slice(0,0)+'v1',st={};
try{st=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){st={}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){document.getElementById('savewarn').hidden=false}}
var mks=[].slice.call(document.querySelectorAll('.mk')),total=mks.length;
function paint(mk){var id=mk.getAttribute('data-id'),s=st[id]||{},a=mk.parentNode;
  [].forEach.call(mk.querySelectorAll('input'),function(i){i.checked=(i.value===s.m)});
  var ta=mk.querySelector('textarea');if(ta.value!==(s.n||''))ta.value=s.n||'';
  a.classList.toggle('done',s.m==='ok');a.classList.toggle('fix',s.m==='fix');a.classList.toggle('del',s.m==='del');}
function count(){var n=0,c={ok:0,fix:0,del:0};mks.forEach(function(mk){var s=st[mk.getAttribute('data-id')];if(s&&s.m){n++;c[s.m]++}});
  document.getElementById('cnt').textContent='표시 '+n+' / '+total;document.getElementById('bari').style.width=(total?100*n/total:0)+'%';return{n:n,c:c}}
mks.forEach(function(mk){var id=mk.getAttribute('data-id');paint(mk);
  mk.addEventListener('change',function(e){if(e.target.type==='radio'){st[id]=st[id]||{};st[id].m=e.target.value;save();paint(mk);count()}});
  mk.querySelector('textarea').addEventListener('input',function(e){st[id]=st[id]||{};st[id].n=e.target.value;if(!st[id].m&&!st[id].n)delete st[id];save()});
  mk.querySelector('.clr').addEventListener('click',function(){delete st[id];save();paint(mk);count()});});
count();
/* 걸러 보기 */
[].forEach.call(document.querySelectorAll('.sc'),function(sc){if(!sc.querySelector('.it.pri'))sc.classList.add('nopri')});
var sel=document.getElementById('flt');
sel.addEventListener('change',function(){document.body.className=sel.value?('f-'+sel.value):'';window.scrollTo(0,0)});
/* 내보내기 */
var LAB={ok:'그대로',fix:'고침',del:'뺌'},IX={ok:0,fix:1,del:2};function lab(mk,m){var a=(mk.getAttribute('data-lab')||'').split('|');return a[IX[m]]||LAB[m]}
function exportText(){var r=count(),L=[];L.push('바이블 온유 감수 표시');L.push('자료 판: '+document.body.getAttribute('data-version'));
  L.push('표시 '+r.n+' / 전체 '+total+' (그대로 '+r.c.ok+' · 고침 '+r.c.fix+' · 뺌 '+r.c.del+')');
  ['fix','del'].forEach(function(m){L.push('');L.push('== '+{fix:'고침 · 바꿈',del:'뺌 · 의논 필요'}[m]+' ==');mks.forEach(function(mk){var id=mk.getAttribute('data-id'),s=st[id];if(s&&s.m===m)L.push('['+id+'] '+lab(mk,m)+' | '+(s.n||'').replace(/\\n/g,' / '))})});
  L.push('');L.push('== 표시 없이 적기만 한 것 ==');mks.forEach(function(mk){var id=mk.getAttribute('data-id'),s=st[id];if(s&&!s.m&&s.n)L.push('['+id+'] 메모 | '+s.n.replace(/\\n/g,' / '))});
  L.push('');L.push('== 그대로 · 지금대로 ==');var ok=[];mks.forEach(function(mk){var id=mk.getAttribute('data-id'),s=st[id];if(s&&s.m==='ok')ok.push('['+id+'] '+lab(mk,'ok')+' | '+(s.n||'').replace(/\\n/g,' / '))});L=L.concat(ok);
  return L.join('\\n')}
function importText(t){var n=0,REV={'그대로':'ok','고침':'fix','뺌':'del','지금대로':'ok','바꿈':'fix','의논 필요':'del','메모':''};t.split(/\\r?\\n/).forEach(function(line){var m=line.match(/^\\[([^\\]]+)\\]\\s*(그대로|고침|뺌|지금대로|바꿈|의논 필요|메모)\\s*\\|?\\s*(.*)$/);if(!m)return;var id=m[1];if(!document.getElementById(id))return;st[id]={};if(REV[m[2]])st[id].m=REV[m[2]];if(m[3])st[id].n=m[3].replace(/ \\/ /g,'\\n');n++});save();mks.forEach(paint);count();return n}
var dlg=document.getElementById('dlg'),box=document.getElementById('box'),msg=document.getElementById('msg');
document.getElementById('exp').addEventListener('click',function(){box.value=exportText();msg.textContent='';if(dlg.showModal)dlg.showModal();else dlg.setAttribute('open','')});
document.getElementById('cpy').addEventListener('click',function(){box.select();var ok=false;try{ok=document.execCommand('copy')}catch(e){}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(box.value).then(function(){msg.textContent='복사했습니다. 문자나 메일에 붙여 넣어 보내 주세요.'},function(){msg.textContent=ok?'복사했습니다.':'복사가 안 되면 글상자를 길게 눌러 전체 선택 후 복사해 주세요.'})}else msg.textContent=ok?'복사했습니다.':'글상자를 길게 눌러 전체 선택 후 복사해 주세요.'});
document.getElementById('dwn').addEventListener('click',function(){try{var b=new Blob([box.value],{type:'text/plain;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='감수표시_'+document.body.getAttribute('data-version')+'.txt';document.body.appendChild(a);a.click();a.remove();msg.textContent='파일로 저장했습니다.'}catch(e){msg.textContent='이 기기에서는 파일 저장이 안 됩니다. 복사를 써 주세요.'}});
document.getElementById('imp').addEventListener('click',function(){var n=importText(box.value);msg.textContent=n+'개 항목의 표시를 불러왔습니다.'});
document.getElementById('cls').addEventListener('click',function(){if(dlg.close)dlg.close();else dlg.removeAttribute('open')});
document.getElementById('rst').addEventListener('click',function(){if(confirm('이 기기에 저장된 표시를 모두 지울까요? 되돌릴 수 없습니다.')){st={};save();mks.forEach(paint);count();box.value=exportText()}});
window.__review={exportText:exportText,importText:importText,state:function(){return st}};
})();
`;
function guideHtml(print) {
  const o = [];
  o.push('<section id="guide"' + (print ? ' class="cover"' : '') + '><h1>바이블 온유 · 목회자 감수 자료</h1><p class="sm">구약 40장면 · 자료 판 ' + VERSION + ' · 감수 상태: 40장면 모두 미감수</p>');
  GUIDE.what.forEach((x) => o.push('<p>' + inl(x) + '</p>'));
  o.push('<h3>무엇을, 얼마나</h3><table><tr><th>묶음</th><th>항목 수</th><th>걸리는 시간(어림)</th></tr>');
  const row = (name, list) => o.push('<tr><td>' + name + '</td><td>' + list.length + '</td><td>약 ' + fmtMin(mins(list)) + '</td></tr>');
  row('① 원칙 ' + RULE_N + '가지와 공통 항목', items.filter((it) => it.group === 'rule' && it.core));
  row('② 감수 범위를 정하는 물음', scopeItems);
  row('③ 먼저 볼 30항목', first30);
  row('④ 감수 필수 장면 ' + REQ_N + '개의 표시 항목(③과 겹침)', coreItems.filter((it) => it.scene && sceneById[it.scene].review.required));
  row('⑤ 나머지 장면 ' + (40 - REQ_N) + '개의 표시 항목', coreItems.filter((it) => it.scene && !sceneById[it.scene].review.required));
  row('⑥ 시대 안내·마무리 등 시대마다 하나씩인 항목', coreItems.filter((it) => !it.scene && it.group !== 'rule'));
  row('전체(표시할 항목, ①④⑤⑥을 더한 수. ②③은 그 안에서 고른 것)', coreItems);
  o.push('</table><p class="sm">' + inl(TIME_NOTE) + '</p>');
  o.push('<h3>표시하는 방법</h3><ul>');
  GUIDE.how.filter((x, i) => !(print && i === 5)).forEach((x) => o.push('<li>' + inl(x) + '</li>'));
  if (print) o.push('<li>종이에서는 항목 아래의 ☐에 표시하고 "적을 칸"에 적어 주세요. 항목 번호(예: OT-10·오늘1)만 불러 주셔도 됩니다.</li>');
  o.push('</ul><h3>보시는 순서(권함)</h3><ul>');
  GUIDE.order.forEach((x) => o.push('<li>' + inl(x) + '</li>'));
  o.push('</ul><h3>한 장면이 흘러가는 차례 (그 글이 언제 보이는지)</h3><ol>');
  GUIDE.flow.forEach((x) => o.push('<li>' + inl(x) + '</li>'));
  o.push('</ol><p class="sm">글 앞의 "8~10세 / 11~13세 / 14~19세"는 그 나이 단계의 아이에게 보이는 글입니다. 굵은 글은 게임에 나오는 문장 그대로이고, 옅은 글은 설명입니다. 초록 글자는 근거 장절입니다.</p></section>');
  return o.join('\n');
}
function first30Html(print, fullScope) {
  const mode = print ? 'print' : 'screen';
  const o = [fullScope ? '<section id="scope" class="noprisec"><h2>감수 범위를 먼저 정할 것</h2><p class="sm">지금 "감수 필수 아님"으로 둔 장면 가운데, 검증자가 필수로 올릴지 물은 것입니다. 여기서 표시해 주세요.</p>' + scopeItems.map((it) => htmlItem(it, mode)).join('\n') + '</section>' : '<section id="scope" class="noprisec"><h2' + (print ? '' : ' class="first"') + '>감수 범위를 먼저 정할 것</h2><p class="sm">지금 "감수 필수 아님"으로 둔 장면 가운데, 검증자가 필수로 올릴지 물은 것입니다. 표시는 그 항목에서 합니다.</p><ul>' +
    scopeItems.map((it) => '<li>' + (print ? '<b>' + esc(it.id) + '</b>' : '<a href="#' + esc(it.id) + '">' + esc(it.id) + '</a>') + ' ' + esc(it.title) + '</li>').join('') + '</ul></section>',
    '<section id="first30"><h2>먼저 볼 30항목</h2><p class="sm">' + inl(FIRST_NOTE) + '</p>'];
  if (print) first30.forEach((it) => { o.push('<p class="sm"><b>' + it.pri + '.</b> ' + esc(sceneById[it.scene].id + ' ' + sceneById[it.scene].title + ' (' + sceneById[it.scene].ref + ')') + ' · ' + esc(it.pwhy) + '</p>'); o.push(htmlItem(it, mode)); });
  else {
    o.push('<table><tr><th>순서</th><th>항목</th><th>장면</th><th>왜 먼저인가</th></tr>');
    first30.forEach((it) => o.push('<tr><td>' + it.pri + '</td><td><a href="#' + esc(it.id) + '">' + esc(it.id) + '</a><br>' + esc(it.label) + '</td><td>' + esc(sceneById[it.scene].title) + '</td><td>' + esc(it.pwhy) + '</td></tr>'));
    o.push('</table><p class="sm">위 "걸러 보기"에서 <b>먼저 볼 30</b>을 고르면 이 항목들만 차례로 보입니다.</p>');
  }
  o.push('</section>');
  return o.join('\n');
}
function rulesHtml(mode, coreOnly) {
  return '<section id="rules" class="noprisec"><h2>원칙 ' + RULE_N + '가지와 공통 항목</h2><p class="sm">규칙서 3절과 13절(대표 결정, 목회자 감수 전)에서 먼저 보실 것을 옮겼습니다. "규칙서" 줄은 규칙서의 글 그대로입니다. 그 뒤는 모든 장면에 걸치는 공통 항목과 요단 강 시대 추리입니다.</p>' + items.filter((it) => it.group === 'rule' && (!coreOnly || it.core)).map((it) => htmlItem(it, mode)).join('\n') + (coreOnly ? '<p class="sm">참고 항목(공통·화면글참고)은 전체 감수 자료에 있습니다.</p>' : '') + '</section>';
}
function erasHtml(mode, filter) {
  const print = mode === 'print';
  const o = [];
  erasDoc.eras.forEach((e) => {
    o.push('<section class="era" id="era' + e.era + '"><h2>시대 ' + e.era + '. ' + esc(e.name) + '</h2>');
    items.filter((it) => it.group === 'era' && it.era === e.era && it.kind !== 'open' && filter(it)).forEach((it) => o.push(htmlItem(it, mode)));
    scenes.filter((d) => d.era === e.era).forEach((d) => {
      const list = items.filter((it) => it.scene === d.id && filter(it)).sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
      if (!list.length) return;
      o.push('<div class="sc' + (d.review.required ? ' rq' : '') + '">' + htmlSceneHead(d));
      list.forEach((it) => o.push(htmlItem(it, mode).replace('class="it ', it.chars > 1500 && print ? 'class="it long ' : 'class="it ')));
      o.push('</div>');
    });
    const eo = items.filter((it) => it.group === 'era' && it.era === e.era && it.kind === 'open' && filter(it));
    if (eo.length) { o.push('<div class="sc"><h3>시대 ' + e.era + ' 공통으로 검증자가 남긴 것</h3>'); eo.forEach((it) => o.push(htmlItem(it, mode))); o.push('</div>'); }
    o.push('</section>');
  });
  return o.join('\n');
}
function countsHtml() {
  return '<section id="counts" class="noprisec"><h2>뽑은 수와 진행표의 수 대조</h2><table><tr><th>항목</th><th>뽑은 수</th><th>진행표의 수</th><th>맞는가</th><th>까닭</th></tr>' +
    COUNTS.map((c) => '<tr><td>' + esc(c[0]) + '</td><td>' + esc(c[1]) + '</td><td>' + esc(c[2]) + '</td><td>' + (c[3] ? '맞음' : '<b class="req">다름</b>') + '</td><td>' + esc(c[4]) + '</td></tr>').join('') +
    '</table><p class="sm">검증자가 남긴 것 ' + cnt('open') + '건의 분류: ' + esc(Object.keys(openBy).sort().map((k) => k + ' ' + openBy[k]).join(' · ')) + '. 목회자·미분류만 표시 항목으로 실었습니다.</p></section>';
}
function page(title, css, body, js) {
  return '<!doctype html>\n<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>' + esc(title) + '</title><style>' + css + '</style></head>\n<body data-version="' + VERSION + '">\n' + body + (js ? '\n<script>' + js + '</script>' : '') + '\n</body></html>\n';
}
/* 표시 항목이면서 감수 대상(목회자)인 것만. 화면용은 참고 글도 접어서 함께 */
const screenFilter = pastorView;
const printFilter = (it) => it.core;
const refFilter = (it) => it.kind === 'beats' || it.kind === 'rest' || (it.kind === 'screen' && !it.core);

function screenHtml() {
  const top = '<div class="top"><div class="row"><b id="cnt">표시 0 / 0</b><span class="bar"><i id="bari"></i></span><select id="flt" aria-label="걸러 보기"><option value="">전체</option><option value="pri">먼저 볼 30</option><option value="req">감수 필수 장면만</option><option value="todo">아직 표시 안 한 것</option></select><button type="button" class="pr" id="exp">내보내기</button></div></div>';
  const toc = '<nav class="toc"><a href="#guide">안내</a><a href="#rules">원칙</a><a href="#scope">감수 범위</a><a href="#first30">먼저 볼 30</a>' + erasDoc.eras.map((e) => '<a href="#era' + e.era + '">' + e.era + '. ' + esc(e.name) + '</a>').join('') + '<a href="#counts">숫자 대조</a></nav>';
  const dlg = '<dialog id="dlg"><h3 style="margin-top:0">표시 내보내기 · 불러오기</h3><p class="sm">아래 글을 복사해 문자·메일로 보내 주세요. 다른 기기에서 이어 하시려면 그 기기의 이 창에 글을 붙여 넣고 "불러오기"를 누르세요.</p><textarea id="box" spellcheck="false"></textarea><p id="msg" class="sm" role="status"></p><p><button type="button" class="pr" id="cpy">글 복사</button> <button type="button" id="dwn">파일로 저장</button> <button type="button" id="imp">불러오기</button> <button type="button" id="rst">모두 지우기</button> <button type="button" id="cls">닫기</button></p></dialog>';
  const body = top + '<main>' + guideHtml(false) + '<p class="note" id="savewarn" hidden>이 기기에서는 표시가 저장되지 않습니다(사생활 보호 모드 등). 창을 닫기 전에 "내보내기"로 글을 복사해 두세요.</p><p class="note">표시는 <b>이 기기의 이 브라우저에만</b> 저장됩니다. 서버로 보내지 않습니다. 다 하셨거나 중간에라도 "내보내기"로 글을 뽑아 보내 주세요.</p>' + toc + rulesHtml('screen') + first30Html(false) + erasHtml('screen', screenFilter) + countsHtml() + '</main>' + dlg;
  return page('바이블 온유 · 목회자 감수 자료', CSS_COMMON + CSS_SCREEN, body, JS_SCREEN);
}
function printHtml() {
  const body = '<main>' + guideHtml(true) + rulesHtml('print').replace('<h2>', '<h2 class="first">') + first30Html(true) + erasHtml('print', (it) => printFilter(it) && it.kind !== 'beats') + countsHtml() +
    '<p class="sm">감수 필수 장면의 대목 글 전체는 길어서 <code>참고_장면전체글_인쇄용.html</code>에 따로 실었습니다. 대목 글에 대한 표시는 그 파일의 항목 번호(예: OT-10·대목)로 적어 주세요.</p></main>';
  return page('바이블 온유 · 목회자 감수 자료(인쇄용)', CSS_COMMON + CSS_PRINT, body, '');
}
function first30PrintHtml() {
  return page('바이블 온유 · 먼저 볼 30항목(인쇄용)', CSS_COMMON + CSS_PRINT, '<main>' + guideHtml(true) + rulesHtml('print', true).replace('<h2>', '<h2 class="first">') + first30Html(true, true) + '</main>', '');
}
function refPrintHtml() {
  const body = '<main><section class="cover"><h1>바이블 온유 · 참고: 장면 전체 글</h1><p class="sm">자료 판 ' + VERSION + '</p><p>감수 자료의 표시 항목에 넣지 않은 글을 빠짐없이 실었습니다: 대목 글(8~10세·11~13세·14~19세), 최현 박사의 통신, 수리 재료, 관문 물음, 3D 탐지기 물음, 곁에서 보기·함께 머물기, 말씀 카드, 화면 원칙. <b>감수 필수 장면의 대목 글</b>은 표시 항목입니다(☐가 있습니다).</p></section>' + items.filter((it) => it.group === 'rule' && !it.core).map((it) => htmlItem(it, 'print')).join('\n') + erasHtml('print', refFilter) + '</main>';
  return page('바이블 온유 · 참고: 장면 전체 글(인쇄용)', CSS_COMMON + CSS_PRINT, body, '');
}

/* ───────── 6.5 대표 결재지 ───────── */
(function () {
  const covered = new Set();
  SIGN.decisions.forEach((d) => (d.covers || []).forEach((id) => { if (!byId[id]) throw new Error('결재 자료가 가리키는 항목이 없음: ' + id); covered.add(id); }));
  /* 검증자가 대표에게 넘긴 것 가운데 위 결정에 묶이지 않은 것은 '라' 묶음에 자동으로 싣는다 */
  let n = 0;
  items.filter((it) => it.kind === 'open' && it.to === '대표' && !covered.has(it.id)).forEach((it) => {
    n++;
    SIGN.decisions.push({ id: '라' + n, sec: 'D', q: it.title, rec: '지금대로', why: '검증 기록에 남은 것 가운데, 신학 판단보다 놀이 설계에 가깝다고 이 작업에서 분류한 것입니다. 지금대로 두면 더 할 일이 없고, 바꾸면 그 장면의 작성과 본문 대조를 다시 합니다.', now: '지금대로', src: it.id + (it.scene ? ' · ' + sceneById[it.scene].title : ''), auto: true });
  });
})();
const signCount = (sec) => SIGN.decisions.filter((d) => d.sec === sec).length;
function signMd() {
  const o = ['# 대표 결재지 (바이블 온유)', '', '> **🟡 내부 결정 · 대표가 정할 것 ' + SIGN.decisions.length + '가지** (예/아니오 또는 지금대로/바꿈으로 답할 수 있게 썼고, 추천과 까닭을 붙였습니다. 가4·가7은 여러 가지를 한 줄에 묶었습니다.)',
    '> - 급한 것은 **"가" 묶음 ' + signCount('A') + '가지**입니다. 나머지는 모두 지금대로 두기를 추천하므로, 다르게 하실 것만 표시하셔도 됩니다.',
    '> - 신학 판단이 섞인 것은 여기서 정하지 않고 **목회자 감수 자료로 옮겼습니다**("목회자에게" 칸).',
    '> - **추천대로 하시면 드는 돈은 없습니다.** 돈과 이어진 것은 가5·가6(개역개정 사용료)과 마7·마20(서버·자기 주소 운영비)이며, 모두 "돈이 들지 않는 쪽"을 추천했습니다. 밖으로 나가는 일(목사님께 자료 드리기, 공회 문의, 아이 시험)은 대표가 직접 하시는 일로 적었습니다.', '',
    '자료 판 `' + VERSION + '` · `docs/감수/대표_결재_자료.json`을 고치고 `node tools/make_review_pack.js`를 돌리면 다시 만들어집니다. 휴대폰에서는 `대표_결재지.html`을 열어 표시하고 "내보내기"로 글을 뽑을 수 있습니다.', ''];
  SIGN.sections.forEach((sec) => {
    const list = SIGN.decisions.filter((d) => d.sec === sec.key);
    if (!list.length) return;
    o.push('## ' + sec.title + ' (' + list.length + ')', ''); if (sec.lead) o.push(sec.lead, '');
    o.push('| # | 정할 것 | 추천 | 까닭 | 지금 기본값 | 답 |', '|---|---|---|---|---|---|');
    list.forEach((d) => o.push('| ' + d.id + ' | ' + d.q + (d.fill ? '<br>' + d.fill : '') + (d.pastor ? '<br>**목회자에게**: ' + d.pastor : '') + (d.covers ? '<br><sub>함께 정리되는 검증자 항목: ' + d.covers.join(', ') + '</sub>' : '') + ' | **' + d.rec + '** | ' + d.why + ' | ' + d.now + '<br><sub>' + d.src + '</sub> | ' + (d.auto ? '☐ 지금대로 ☐ 바꿈' : '☐ 예 ☐ 아니오') + ' |'));
    o.push('');
  });
  o.push('## 목회자에게 옮긴 것', '', '아래는 대표가 정하기보다 목사님의 판단이 먼저 필요한 것이어서 감수 자료에 넣었습니다.', '');
  ['공통·읽어주기', '공통·마무리', '추리·요단강'].forEach((id) => o.push('- **' + id + '** ' + byId[id].title));
  scopeItems.forEach((it) => o.push('- **' + it.id + '** ' + it.title));
  ['OT-30·미해결4', 'OT-05·미해결7'].forEach((id) => o.push('- **' + id + '** ' + byId[id].title));
  o.push('', '검증자가 남긴 것 가운데 화면·코드로 고치면 되는 일 ' + (openBy['코드'] || 0) + '건은 대표가 정할 것이 없어 총괄에게 넘겼습니다(`미해결_전체.md`의 "코드" 절).', '');
  return o.join('\n');
}
function signHtml() {
  const o = ['<div class="top"><div class="row"><b id="cnt">표시 0 / 0</b><span class="bar"><i id="bari"></i></span><select id="flt" hidden><option value=""></option></select><button type="button" class="pr" id="exp">내보내기</button></div></div><main>',
    '<section id="guide"><h1>대표 결재지</h1><p class="sm">바이블 온유 · 자료 판 ' + VERSION + '</p>',
    '<div class="note"><b>🟡 내부 결정 · 대표가 정할 것 ' + SIGN.decisions.length + '가지</b><ul><li>급한 것은 <b>"가" 묶음 ' + signCount('A') + '가지</b>입니다. 나머지는 모두 "예(지금대로)"를 추천하므로 다르게 하실 것만 표시하셔도 됩니다.</li><li>신학 판단이 섞인 것은 여기서 정하지 않고 목회자 감수 자료로 옮겼습니다.</li><li><b>추천대로 하시면 드는 돈은 없습니다.</b> 돈과 이어진 것은 가5·가6(개역개정 사용료)과 마7·마20(서버·자기 주소 운영비)입니다. 밖으로 나가는 일(목사님께 자료 드리기, 공회 문의, 아이 시험)은 대표가 직접 하시는 일입니다.</li><li>표시는 이 기기에만 저장됩니다. 다 하신 뒤 "내보내기"의 글을 복사해 보내 주세요.</li></ul></div></section>'];
  SIGN.sections.forEach((sec) => {
    const list = SIGN.decisions.filter((d) => d.sec === sec.key);
    if (!list.length) return;
    o.push('<section><h2>' + esc(sec.title) + ' (' + list.length + ')</h2>' + (sec.lead ? '<p class="sm">' + esc(sec.lead) + '</p>' : ''));
    list.forEach((d) => o.push('<article class="it core" id="' + esc(d.id) + '"><header><span class="code">' + esc(d.id) + '</span><span class="star">추천: ' + esc(d.rec) + '</span></header><p class="ln g"><span class="v">' + esc(d.q) + '</span></p>' +
      '<p class="ln n sub"><span class="k">까닭</span> <span class="v">' + esc(d.why) + '</span></p><p class="ln n sub"><span class="k">지금 기본값</span> <span class="v">' + esc(d.now) + '</span></p>' +
      (d.pastor ? '<p class="ln n sub"><span class="k">목회자에게</span> <span class="v">' + esc(d.pastor) + '</span></p>' : '') + (d.fill ? '<p class="ln n sub"><span class="k">채울 것</span> <span class="v">' + esc(d.fill) + '</span></p>' : '') +
      '<p class="sm">' + esc(d.src) + (d.covers ? ' · 함께 정리: ' + esc(d.covers.join(', ')) : '') + '</p>' +
      '<div class="mk" data-id="' + esc(d.id) + '" data-lab="' + (d.auto ? '지금대로|바꿈' : '예|아니오') + '|더 알아보고"><label><input type="radio" name="m-' + esc(d.id) + '" value="ok"><span>' + (d.auto ? '지금대로' : '예') + '</span></label><label><input type="radio" name="m-' + esc(d.id) + '" value="fix"><span>' + (d.auto ? '바꿈' : '아니오') + '</span></label><label><input type="radio" name="m-' + esc(d.id) + '" value="del"><span>더 알아보고</span></label><button type="button" class="clr">지움</button><textarea rows="1" placeholder="적을 칸(날짜, 이름, 다르게 할 내용)"></textarea></div></article>'));
    o.push('</section>');
  });
  o.push('</main><dialog id="dlg"><h3 style="margin-top:0">결재 내보내기 · 불러오기</h3><textarea id="box" spellcheck="false"></textarea><p id="msg" class="sm" role="status"></p><p><button type="button" class="pr" id="cpy">글 복사</button> <button type="button" id="dwn">파일로 저장</button> <button type="button" id="imp">불러오기</button> <button type="button" id="rst">모두 지우기</button> <button type="button" id="cls">닫기</button></p></dialog>');
  const js = JS_SCREEN.replace("'bo-review-'", "'bo-sign-'").replace('바이블 온유 감수 표시', '바이블 온유 대표 결재').replace("{fix:'고침 · 바꿈',del:'뺌 · 의논 필요'}", "{fix:'아니오 · 바꿈',del:'더 알아보고'}").replace('== 그대로 · 지금대로 ==', '== 예 · 지금대로 ==').replace("'그대로':'ok',", "'예':'ok','아니오':'fix','더 알아보고':'del','그대로':'ok',").replace('(그대로|고침|뺌|', '(예|아니오|더 알아보고|그대로|고침|뺌|').replace("'감수표시_'", "'대표결재_'");
  return page('바이블 온유 · 대표 결재지', CSS_COMMON + CSS_SCREEN + '@media print{.mk textarea{border:0;border-bottom:1px solid #888;border-radius:0}.it{break-inside:avoid}}', o.join('\n'), js);
}

/* ───────── 7. 쓰기 ───────── */
function itemsJson() {
  return JSON.stringify({ version: VERSION, note: '감수 자료의 항목 목록. node tools/make_review_pack.js 가 만든다. core=목회자가 표시하는 항목, src=그 글이 있는 곳', counts: COUNTS.map((c) => ({ name: c[0], got: c[1], expect: c[2], ok: c[3] })),
    items: items.map((it) => ({ id: it.id, kind: it.kind, label: it.label, scene: it.scene || null, era: it.era || null, core: !!it.core, first30: it.pri || 0, to: it.to || undefined, ukey: it.ukey || undefined, ask: it.kind === 'open' ? it.title : undefined, chars: it.chars,
      src: it.scene ? 'content/ot/' + it.scene + '.json' : it.group === 'rule' ? (it.kind === 'story' ? 'content/ot/eras.json' : 'docs/00_공통규칙서.md') : 'content/ot/eras.json' })) }, null, 1) + '\n';
}
fs.mkdirSync(path.join(OUT, 'md'), { recursive: true });
const W = (rel, s) => fs.writeFileSync(path.join(OUT, rel), s);
MD_IMG_PREFIX = '화면/';
W('README.md', readmeMd() + '\n');
MD_IMG_PREFIX = '../화면/';
erasDoc.eras.forEach((e) => W('md/시대' + String(e.era).padStart(2, '0') + '.md', eraMd(e) + '\n'));
W('미해결_전체.md', unresolvedMd() + '\n');
W('감수자료.html', screenHtml());
W('감수자료_인쇄용.html', printHtml());
W('먼저볼30_인쇄용.html', first30PrintHtml());
W('참고_장면전체글_인쇄용.html', refPrintHtml());
W('항목목록.json', itemsJson());
W('대표_결재지.md', signMd() + '\n');
W('대표_결재지.html', signHtml());
printCounts();
console.log('만든 곳: docs/감수/ (README.md, 감수자료.html, 감수자료_인쇄용.html, 먼저볼30_인쇄용.html, 참고_장면전체글_인쇄용.html, md/시대01~10.md, 항목목록.json, 미해결_전체.md)');
