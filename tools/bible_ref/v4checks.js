// 넓힌 기계 검사(validate_ot.js --v4). 3차 전수 대조(자동 작업 2026-11-16~17)에서 더했다.
// 장면 자료 하나(d)를 받아 [{level, code, where, msg}]를 돌려준다.
//   level 'ERR'  : 기계가 확실히 말할 수 있는 잘못(없는 장절, 물음 글의 장절과 ref가 다름, 같은 보기가 두 번 등)
//   level 'CHK'  : 사람이 읽고 가려야 하는 것(숫자·이름이 본문에 안 보임, 본문과 10글자 이상 같음, 차례가 어긋나 보임 등).
//                  읽어 보고 문제없다고 가린 것은 content/ot/_verify/v4_확인됨.json 에 까닭과 함께 적으면 다시 나오지 않는다.
// 본문을 싣지 않는다. ref/bible(.gitignore)이 있어야 돈다.
const R = require('./ref.js');
const BOOKS = R.BOOKS;
const FULL = {}; BOOKS.forEach((b) => { FULL[b[1]] = b[0]; });
const ABBR = BOOKS.map((b) => b[0]).sort((a, b) => b.length - a.length);
const CANON = /^\S+ \d+:\d+(-(\d+:)?\d+)?$/;

function norm(s) { return String(s).replace(/[\s.,!?'"“”‘’·:;()\-~]/g, ''); }
function lcs(a, b) {
  let best = 0, prev = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    const cur = new Array(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j++) if (a[i - 1] === b[j - 1]) { cur[j] = prev[j - 1] + 1; if (cur[j] > best) best = cur[j]; }
    prev = cur;
  }
  return best;
}
function lcsStr(a, b) {            // 가장 긴 공통 연속 부분(글자)
  let best = 0, end = 0, prev = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    const cur = new Array(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j++) if (a[i - 1] === b[j - 1]) { cur[j] = prev[j - 1] + 1; if (cur[j] > best) { best = cur[j]; end = i; } }
    prev = cur;
  }
  return a.slice(end - best, end);
}
const vkey = (b, c, v) => b + ':' + c + ':' + v;
function keysOf(ref) {             // 장절 → 절 열쇠 목록
  const r = R.parse(ref), v = r && R.verses(ref);
  if (!r || !v || v.bad) return null;
  return v.list.map((x) => vkey(r.book, x.c, x.v));
}
function textOf(ref, lang) { const v = R.parse(ref) && R.verses(ref); return v ? v.list.map((x) => x[lang || 'krv']).join(' ') : ''; }

/* ---------- 숫자 뽑기 ---------- */
const SINO = { 일: 1, 이: 2, 삼: 3, 사: 4, 오: 5, 육: 6, 칠: 7, 팔: 8, 구: 9 };
function sinoVal(s) {              // "삼백이십" → 320. 읽을 수 없으면 null
  let total = 0, sec = 0, cur = 0;
  for (const ch of s) {
    if (ch in SINO) cur = SINO[ch];
    else if (ch === '십') { sec += (cur || 1) * 10; cur = 0; }
    else if (ch === '백') { sec += (cur || 1) * 100; cur = 0; }
    else if (ch === '천') { sec += (cur || 1) * 1000; cur = 0; }
    else if (ch === '만') { total += ((sec + cur) || 1) * 10000; sec = 0; cur = 0; }
    else return null;
  }
  return total + sec + cur;
}
const NATIVE = { 열한: 11, 열두: 12, 열세: 13, 열네: 14, 다섯: 5, 여섯: 6, 일곱: 7, 여덟: 8, 아홉: 9, 열: 10, 두: 2, 세: 3, 네: 4, 스무: 20, 스물: 20, 서른: 30, 마흔: 40, 쉰: 50, 둘: 2, 셋: 3, 넷: 4, 열둘: 12 };
const COUNTER = '명|사람|개|번|바퀴|마리|아들|딸|날|째|쌍|가지|지파|해|달|살|배|권|마디|줄|겹|조각|덩이|그루|필|척|채|벌|자루|돌|기둥|무더기|떼|집|왕|형제|제사장|정탐|족장|방백|규빗|세겔|달란트|길|편|진|대|층|칸|종|친구|용사|장|주|주일|주야|년|일|세|시|월';
function numsKo(text) {
  const out = new Set();
  let s = String(text)
    .replace(/\d+\s*~\s*\d+\s*세/g, ' ')                 // 나이 단계
    .replace(/[가-힣]+ \d+:\d+(-(\d+:)?\d+)?/g, ' ')      // 창 1:1
    .replace(/\d+:\d+(-(\d+:)?\d+)?/g, ' ')                  // 책 이름 없이 적은 11:4
    .replace(/\d+\s*장/g, ' ').replace(/\d+\s*절/g, ' ').replace(/\d+\s*(편|문)/g, ' ')
    .replace(/만일|천사|십일조|만나|만약|만족|천막|천천히|이만큼|그만|만에|천지|백성|사천왕|일만 악/g, ' ');
  (s.match(/\d[\d,]*/g) || []).forEach((x) => out.add(+x.replace(/,/g, '')));
  s = s.replace(/\d[\d,]*/g, ' ');
  // 한자어 수: "일백 오십", "삼백", "사십 일"(끝의 낱글자 일은 날로 본다)
  const re = /[일이삼사오육칠팔구십백천만]+(?: [일이삼사오육칠팔구십백천만]+)*/g; let m;
  while ((m = re.exec(s))) {
    let parts = m[0].split(' ');
    while (parts.length > 1 && /^[일이삼사오육칠팔구]$/.test(parts[parts.length - 1]) && !/^[일이삼사오육칠팔구]$/.test(parts[parts.length - 2])) {
      // "사십 일"의 일(날), "이십 오"의 오(다섯)를 가르기 어렵다: 끝이 '일'이면 날로 보고 뗀다
      if (parts[parts.length - 1] === '일') parts.pop(); else break;
    }
    const joined = parts.join('');
    if (!/[십백천만]/.test(joined)) continue;
    const before = s[m.index - 1] || ' ';
    if (/[가-힣]/.test(before)) continue;               // 낱말 가운데(예: "제사장")는 건너뛴다
    const after = s[m.index + m[0].length] || ' ';
    if (/[가-힣]/.test(after) && !'명년일세배개규달번째인마살주편여쯤이을은의과도에로씩가'.includes(after)) continue;   // "만드시", "천지"처럼 다른 낱말의 첫 글자
    if (joined.length === 1 && !/^ ?(명|년|일|배|인|번|개|세겔|규빗|달란트)/.test(s.slice(m.index + m[0].length, m.index + m[0].length + 4))) continue;   // 낱글자 십·백·천·만은 단위가 뒤따를 때만(천 조각, ~만 해도 를 거른다)
    const v = sinoVal(joined); if (v && v > 1) out.add(v);
  }
  // 낱글자 한자어 수 + 단위: "칠 일", "삼 년", "제 칠 일"
  const re2 = /(^|[^가-힣])(삼|사|오|육|칠|팔|구) ?(일|년|명|세|달|개월|월|배|규빗|째|시)(?![가-힣])/g;
  while ((m = re2.exec(s))) out.add(SINO[m[2]]);
  // 우리말 수
  const re3 = new RegExp('(^|[^가-힣])(열한|열두|열세|열네|다섯|여섯|일곱|여덟|아홉|열|두|세|네|스무|스물|서른|마흔|쉰) ?(' + COUNTER + ')', 'g');
  while ((m = re3.exec(s))) out.add(NATIVE[m[2]]);
  const re4 = /(^|[^가-힣])(열한|열두|열둘|다섯|여섯|일곱|여덟|아홉)(?![가-힣]*[다요])/g;
  while ((m = re4.exec(s))) out.add(NATIVE[m[2]]);
  const re5 = /(^|[^가-힣])(둘|셋|넷)(이|을|은|째|씩|과|로|의|도|만|,| |$)/g;
  while ((m = re5.exec(s))) out.add(NATIVE[m[2]]);
  return out;
}
const EN = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, threescore: 60, fourscore: 80, twain: 2, both: 2, twice: 2, thrice: 3 };
const ENORD = { second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12, thirteenth: 13, fourteenth: 14, fifteenth: 15, twentieth: 20, thirtieth: 30, fortieth: 40, fiftieth: 50 };
function numsEn(text) {
  const out = new Set();
  const w = String(text).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/);
  let total = 0, cur = 0, on = false;
  const flush = () => { if (on) { const v = total + cur; if (v > 1) out.add(v); } total = 0; cur = 0; on = false; };
  for (let i = 0; i < w.length; i++) {
    const t = w[i];
    if (/^\d+$/.test(t)) { flush(); out.add(+t); continue; }
    if (t in EN) {
      /* "seven and thirty"처럼 앞뒤가 바뀐 꼴, "two hundred fifty" 모두 더한다. 단 "two, three"처럼 이어지는 낱수는 따로 */
      if (on && cur > 0 && cur < 20 && EN[t] < 20 && w[i - 1] !== 'and') { flush(); }
      cur += EN[t]; on = true; continue;
    }
    if (t === 'hundred') { cur = (cur || 1) * 100; on = true; continue; }
    if (t === 'thousand') { total += (cur || 1) * 1000; cur = 0; on = true; continue; }
    if (t in ENORD) { cur += ENORD[t]; on = true; flush(); continue; }
    if (t === 'and' && on && (w[i + 1] in EN || w[i + 1] === 'hundred' || w[i + 1] in ENORD)) continue;
    if ((t === 'an' || t === 'a') && (w[i + 1] === 'hundred' || w[i + 1] === 'thousand')) continue;
    flush();
  }
  flush();
  return out;
}

/* ---------- 이름(인물·곳) ---------- */
const NAMES = ('아담 하와 가인 아벨 노아 야벳 아브람 아브라함 사래 사라 하갈 이스마엘 리브가 야곱 에서 요셉 르우벤 베냐민 보디발 므낫세 에브라임 모세 아론 미리암 이드로 여호수아 갈렙 라합 아간 드보라 바락 기드온 요아스 삼손 들릴라 나오미 보아스 오르바 엘리멜렉 오벳 한나 엘가나 브닌나 사무엘 사울 다윗 골리앗 이새 엘리압 요나단 나단 솔로몬 르호보암 여로보암 아합 이세벨 엘리야 엘리사 호세아 히스기야 산헤립 랍사게 이사야 요시야 힐기야 사반 훌다 예레미야 느부갓네살 시드기야 여호야긴 여호야김 느부사라단 다니엘 다리오 고레스 스룹바벨 예수아 에스라 느헤미야 아닥사스다 에스더 모르드개 하만 아하수에로 와스디 산발랏 도비야 말라기 ' +
  '에덴 아라랏 바벨 시날 하란 가나안 세겜 벧엘 모리아 애굽 고센 호렙 미디안 숙곳 에담 비하히롯 믹돌 바알스본 르비딤 가데스 바란 요단 여리고 길갈 싯딤 사르단 에발 그리심 오브라 므깃도 소라 가사 베들레헴 모압 실로 라마 미스바 소고 아세가 엘라 에베스담밈 예루살렘 시온 헤브론 갈멜 사마리아 이스르엘 앗수르 니느웨 할라 하볼 고산 메대 바벨론 리블라 수산 바사 블레셋 아말렉 미디안 암몬 에돔 헷 아모리 브리스 히위 여부스 기르가스 갈대아 우르 그랄 브엘세바 도단 르우엘 십보라 게르솜 훌 나답 아비후 엘르아살 비느하스 발람 발락 시혼 옥 라반 레아 라헬 빌하 실바 디나 므두셀라 에녹 라멕 데라 나홀 롯 멜기세덱 아비멜렉 이삭 유다 시므온 레위 잇사갈 스불론 납달리 아셀').split(/\s+/).filter(Boolean);
const NAMESET = Array.from(new Set(NAMES)).sort((a, b) => b.length - a.length);
/* 다른 낱말과 겹치기 쉬운 이름은 뒤에 붙는 글자를 본다 */
const AMBIG = { 이삭: /이삭(을 줍|을 주|줍|밭| 줍)/, 유다: null, 옥: /옥(?![이은을과에의 ,.])/, 훌: /훌(?![이은을과에의 ,.])/, 롯: /롯(?![이은을과에의 ,.도])/, 헷: /헷(?! )/, 레위: null, 길: null, 에서: /./, 바란: /바란(?! )/, 라마: /라마(?![에로를 ,.의])/, 사라: /사라(지|졌|질|진)/, 하란: null, 오벳: null };
function namesIn(text) {
  const out = new Set(); let s = String(text);
  NAMESET.forEach((n) => {
    if (n === '에서') return;                               // 조사와 가릴 수 없다
    let i = s.indexOf(n);
    while (i >= 0) {
      const before = s[i - 1] || ' ', ctx = s.slice(i, i + n.length + 3);
      const bad = (AMBIG[n] && AMBIG[n].test(ctx)) || (n.length <= 2 && /[가-힣]/.test(before)) || (n === '옥' || n === '훌' || n === '롯' || n === '헷' ? /[가-힣]/.test(before) : false);
      if (!bad) out.add(n);
      i = s.indexOf(n, i + n.length);
    }
  });
  return out;
}

/* ---------- 겹침 점수(풀어 쓴 글과 절을 견주는 어림) ---------- */
function bigrams(s) { const a = norm(s), o = new Set(); for (let i = 0; i < a.length - 1; i++) o.add(a.slice(i, i + 2)); return o; }
function score(text, verseText) { const a = bigrams(text), b = bigrams(verseText); if (!a.size) return 0; let n = 0; a.forEach((x) => { if (b.has(x)) n++; }); return n / a.size; }

/* ---------- 물음 글에 적힌 장절 읽기 ---------- */
function proseRefs(prompt) {       // "출애굽기 12장 21절부터 23절까지" → {books:[출], cv:Set("12:21","12:23")}
  const s = String(prompt), books = [];
  Object.keys(FULL).sort((a, b) => b.length - a.length).forEach((n) => { if (s.includes(n) && !books.some((x) => x.name.includes(n))) books.push({ name: n, ab: FULL[n], at: s.indexOf(n) }); });
  const cv = new Set(), chapters = new Set(); let ch = null;
  const re = /(\d+)\s*(장|절|~|-|,|과|와|부터|에서)?/g; let m;
  const tokens = [];
  while ((m = re.exec(s))) tokens.push({ n: +m[1], unit: m[2] || '', at: m.index });
  tokens.forEach((t, i) => {
    if (t.unit === '장') { ch = t.n; chapters.add(t.n); return; }
    if (ch === null) return;
    /* 절로 보는 수: 바로 뒤가 절이거나, 뒤따르는 토막 안에서 절로 끝나는 나열(21~23절, 12절과 13절, 1, 3절) */
    let isVerse = t.unit === '절';
    if (!isVerse && ['~', '-', ',', '과', '와', '부터', '에서'].includes(t.unit)) { const nx = tokens[i + 1]; if (nx && nx.unit !== '장' && nx.at - t.at < 12) isVerse = true; }
    if (isVerse) cv.add(ch + ':' + t.n);
  });
  return { books, cv, chapters };
}
function endpoints(ref) { const r = R.parse(ref); if (!r) return []; const v = R.verses(ref); const last = v && v.list.length ? v.list[v.list.length - 1] : { c: r.c2, v: r.v2 }; return [r.c1 + ':' + r.v1, last.c + ':' + last.v]; }

/* ---------- 장면 하나 ---------- */
function checkScene(d) {
  const out = [];
  const F = (level, code, where, msg) => out.push({ level, code, where, msg });
  const beats = d.beats || [];
  const sceneKeys = new Set();
  const addKeys = (ref) => { const k = keysOf(ref); if (k) k.forEach((x) => sceneKeys.add(x)); };
  addKeys(d.ref); beats.forEach((b) => addKeys(b.ref));
  const beatRefs = [d.ref].concat(beats.map((b) => b.ref)).filter((r) => r && R.parse(r));
  const sceneKrv = beatRefs.map((r) => textOf(r, 'krv')).join(' '), sceneKjv = beatRefs.map((r) => textOf(r, 'kjv')).join(' ');
  const sceneVerses = []; beatRefs.forEach((r) => { const v = R.verses(r); if (v) v.list.forEach((x) => sceneVerses.push(x.krv)); });
  const inScene = (ref) => { const k = keysOf(ref); return !!k && k.every((x) => sceneKeys.has(x)); };
  const partlyInScene = (ref) => { const k = keysOf(ref); return !!k && k.some((x) => sceneKeys.has(x)); };
  const sceneNumsKo = numsKo(sceneKrv), sceneNumsEn = numsEn(sceneKjv), sceneNames = namesIn(sceneKrv);

  /* 1) 장절 표기 형식과, 글 속에 적힌 장절이 실제로 있는지 */
  const refField = (ref, where) => { if (typeof ref === 'string' && !CANON.test(ref)) F('ERR', '표기', where, `장절 표기가 "책약어 장:절(-절|-장:절)" 꼴이 아님: "${ref}"`); };
  const scanInline = (s, where) => {
    const t = String(s);
    const re = new RegExp('(^|[^가-힣])(' + ABBR.join('|') + ') ?(\\d+):(\\d+)(?:[-~–]((?:\\d+:)?\\d+))?', 'g'); let m;
    while ((m = re.exec(t))) {
      const raw = m[0].replace(/^[^가-힣]/, '');
      if (!/^[가-힣]+ \d+:\d+(-(\d+:)?\d+)?$/.test(raw)) { F('ERR', '표기', where, `글 속 장절 표기가 한 가지 꼴이 아님: "${raw}"`); continue; }
      const k = keysOf(raw); if (!k || !k.length) F('ERR', '없는절', where, `글 속 장절이 실제로 없음: "${raw}"`);
    }
    const re2 = new RegExp('(' + Object.keys(FULL).sort((a, b) => b.length - a.length).join('|') + ') ?(\\d+)장 ?(\\d+)절', 'g');
    while ((m = re2.exec(t))) { const ref = `${FULL[m[1]]} ${m[2]}:${m[3]}`; const k = keysOf(ref); if (!k || !k.length) F('ERR', '없는절', where, `글 속 장절이 실제로 없음: "${m[0]}"`); }
  };

  /* 2) 사실 글: 숫자·이름이 본문에 있는지, 본문과 10글자 이상 같은지 */
  const factCheck = (text, where, refs, opt) => {
    opt = opt || {};
    const rs = (refs || []).filter((r) => r && R.parse(r) && R.verses(r));
    const ownKrv = rs.map((r) => textOf(r, 'krv')).join(' '), ownKjv = rs.map((r) => textOf(r, 'kjv')).join(' ');
    const ownKo = numsKo(ownKrv), ownEn = numsEn(ownKjv), ownNames = namesIn(ownKrv);
    if (!opt.noNum) numsKo(text).forEach((n) => {
      if (ownKo.has(n) || ownEn.has(n)) return;
      if (rs.length && (sceneNumsKo.has(n) || sceneNumsEn.has(n))) { if (!opt.story) F('CHK', '숫자-절밖', where, `숫자 ${n}이(가) 적힌 장절(${rs.join(', ')})에는 안 보이고 장면의 다른 절에 있음`); return; }
      if (!rs.length && (sceneNumsKo.has(n) || sceneNumsEn.has(n))) return;
      F('CHK', '숫자', where, `숫자 ${n}이(가) 근거 본문(${rs.join(', ') || '장면 범위'})에 안 보임`);
    });
    if (!opt.noName) namesIn(text).forEach((n) => {
      if (ownNames.has(n) || sceneNames.has(n)) return;
      F('CHK', '이름', where, `"${n}"이(가) 근거 본문(${rs.join(', ') || '장면 범위'})과 장면 범위에 안 보임`);
    });
    if (!opt.noCopy) {
      const a = norm(text); let best = 0, br = '', bs = '';
      const tryRef = (r) => { const v = R.verses(r); if (v) v.list.forEach((x) => { const n = lcs(a, norm(x.krv)); if (n > best) { best = n; br = `${r.split(' ')[0]} ${x.c}:${x.v}`; bs = lcsStr(a, norm(x.krv)); } }); };
      rs.forEach(tryRef); beatRefs.forEach(tryRef);
      if (best >= 10) F('CHK', '같은글', where, `본문과 ${best}글자가 그대로 같음(${br}): "${bs}"`);
    }
  };

  /* 3) 물음 */
  const question = (q, where, tier, scope) => {
    if (!q) return;
    const refs = (q.refs || [q.ref]).filter(Boolean);
    refs.forEach((r, i) => refField(r, `${where}.ref${q.refs ? 's[' + i + ']' : ''}`));
    /* 정답 근거 장절이 장면의 본문 범위 안인가 */
    refs.forEach((r) => { if (R.parse(r) && !inScene(r)) F('CHK', '범위밖', where, `읽을 곳 ${r}이(가) 이 장면의 본문 범위(대목들의 장절) 밖${partlyInScene(r) ? '으로 걸침' : ''}`); });
    /* 물음 글에 적힌 책·장·절이 ref와 같은가 */
    if (q.prompt && refs.length && q.type !== 'findref') {
      const p = proseRefs(q.prompt), exp = new Set(), expBooks = new Set();
      refs.forEach((r) => { endpoints(r).forEach((x) => exp.add(x)); const pr = R.parse(r); if (pr) expBooks.add(BOOKS[pr.book][0]); });
      if (p.cv.size) {
        const miss = [...exp].filter((x) => !p.cv.has(x)), extra = [...p.cv].filter((x) => !exp.has(x));
        /* 범위 안의 절을 낱낱이 부른 글(12절과 13절과 14절)은 넘어간다 */
        const allKeys = new Set(); refs.forEach((r) => { const v = R.verses(r); if (v) v.list.forEach((x) => allKeys.add(x.c + ':' + x.v)); });
        const extraBad = extra.filter((x) => !allKeys.has(x));
        if (miss.length || extraBad.length) F('ERR', '글과ref', where, `물음 글의 장절(${[...p.cv].join(', ')})과 ref(${refs.join(', ')})가 다름`);
      } else if (p.chapters.size) {
        const chs = new Set(); refs.forEach((r) => { const pr = R.parse(r); if (pr) { chs.add(pr.c1); chs.add(pr.c2); } });
        if ([...p.chapters].some((c) => !chs.has(c))) F('ERR', '글과ref', where, `물음 글의 장(${[...p.chapters].join(', ')})과 ref(${refs.join(', ')})가 다름`);
      }
      p.books.forEach((b) => { if (!expBooks.has(b.ab)) F('ERR', '글과ref', where, `물음 글의 책(${b.name})과 ref(${refs.join(', ')})의 책이 다름`); });
      if (!p.books.length && !p.cv.size && !p.chapters.size) F('CHK', '글에장절없음', where, '물음 글에 읽을 곳(책·장·절)이 적혀 있지 않음');
    }
    /* 14~19세: 떨어진 두 곳 이상 */
    if (tier === 't3' && q.refs && q.refs.length >= 2) {
      const ks = q.refs.map(keysOf);
      for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) {
        if (!ks[i] || !ks[j]) continue;
        if (ks[i].some((x) => ks[j].includes(x))) F('ERR', '겹친곳', where, `refs의 두 곳이 겹침: ${q.refs[i]}, ${q.refs[j]}`);
        else {
          const last = ks[i][ks[i].length - 1].split(':').map(Number), first = ks[j][0].split(':').map(Number);
          const last2 = ks[j][ks[j].length - 1].split(':').map(Number), first2 = ks[i][0].split(':').map(Number);
          if ((last[0] === first[0] && last[1] === first[1] && first[2] - last[2] === 1) || (last2[0] === first2[0] && last2[1] === first2[1] && first2[2] - last2[2] === 1)) F('CHK', '이웃절', where, `refs의 두 곳이 바로 이웃한 절(떨어진 두 곳이 아님): ${q.refs[i]}, ${q.refs[j]}`);
        }
      }
    }
    const refText = refs.map((r) => textOf(r, 'krv')).join(' ');
    const options = (o, ww) => {
      if (!Array.isArray(o)) return;
      const seen = {};
      o.forEach((x, k) => {
        const lab = norm(x.label || '');
        if (seen[lab] !== undefined) F('ERR', '같은보기', `${ww}[${k}]`, `같은 보기가 두 번 나옴: "${x.label}"`); seen[lab] = k;
        scanInline(x.label, `${ww}[${k}]`);
        if (x.ok) { factCheck(x.label, `${ww}[${k}](정답)`, refs, { noCopy: false }); }
        else {
          if (x.basis && x.basis !== '본문에 없음') {
            refField(x.basis, `${ww}[${k}].basis`);
            const bk = keysOf(x.basis), qk = [].concat(...refs.map((r) => keysOf(r) || []));
            if (bk && bk.length && bk.every((y) => qk.includes(y)) && (tier === 't1' || q.type === 'multi')) F('CHK', '보기근거가읽을곳', `${ww}[${k}]`, `맞지 않는 보기 "${x.label}"의 근거 ${x.basis}이(가) 읽으라고 한 절 그 자체임(그 절에 있는 내용이면 맞는 보기)`);
            /* 근거 장절에 그 보기의 숫자·이름이 있는지 */
            const bt = textOf(x.basis, 'krv'), be = textOf(x.basis, 'kjv');
            const bn = numsKo(bt), ben = numsEn(be), bnames = namesIn(bt);
            numsKo(x.label).forEach((n) => { if (!bn.has(n) && !ben.has(n)) F('CHK', '보기근거-숫자', `${ww}[${k}]`, `보기 "${x.label}"의 숫자 ${n}이(가) 근거 ${x.basis}에 안 보임`); });
            namesIn(x.label).forEach((n) => { if (!bnames.has(n)) F('CHK', '보기근거-이름', `${ww}[${k}]`, `보기 "${x.label}"의 "${n}"이(가) 근거 ${x.basis}에 안 보임`); });
            if (bt && score(x.label, bt) < 0.12) F('CHK', '보기근거-낮은겹침', `${ww}[${k}]`, `보기 "${x.label}"과 근거 ${x.basis} 본문의 겹침이 아주 낮음(그 절에 이 내용이 있는지 읽어 볼 것)`);
          } else if (x.basis === '본문에 없음' && refText) {
            /* "본문에 없음"이라 한 보기가 읽을 곳의 본문과 많이 겹치면 사실은 본문에 있는 내용일 수 있다 */
            const s = score(x.label, refText), s2 = score(x.label, sceneKrv);
            if (s >= 0.6 && norm(x.label).length >= 4) F('CHK', '없음인데겹침', `${ww}[${k}]`, `"본문에 없음" 보기 "${x.label}"이(가) 읽을 곳 본문과 많이 겹침(${Math.round(s * 100)}%)`);
            else if (s2 >= 0.75 && norm(x.label).length >= 5) F('CHK', '없음인데겹침-장면', `${ww}[${k}]`, `"본문에 없음" 보기 "${x.label}"이(가) 장면 본문과 많이 겹침(${Math.round(s2 * 100)}%)`);
          }
        }
      });
    };
    if (q.type === 'choice') options(q.options, where + '.options');
    if (q.type === 'find' || q.type === 'multi') { if (q.confirm) { scanInline(q.confirm.prompt, where + '.confirm.prompt'); options(q.confirm.options, where + '.confirm.options'); } }
    if (q.type === 'order' && Array.isArray(q.items) && refs[0] && R.verses(refs[0])) {
      const vs = R.verses(refs[0]).list; let prev = -1, prevItem = '';
      const pos = q.items.map((it) => { let b = -1, bs = 0, second = 0; vs.forEach((x, i) => { const s = score(it, x.krv); if (s > bs) { second = bs; bs = s; b = i; } else if (s > second) second = s; }); return { b, bs, second }; });
      q.items.forEach((it, i) => {
        factCheck(it, `${where}.items[${i}]`, refs);
        const p = pos[i];
        if (p.bs < 0.15) F('CHK', '차례-안보임', `${where}.items[${i}]`, `차례 항목 "${it}"이(가) 범위 ${refs[0]}의 어느 절과도 겹침이 낮음`);
        else if (p.b < prev && p.bs - p.second > 0.08) F('CHK', '차례', `${where}.items[${i}]`, `차례 항목 "${it}"이(가) 가장 닮은 절(${vs[p.b].c}:${vs[p.b].v})이 앞 항목 "${prevItem}"의 절(${vs[prev].c}:${vs[prev].v})보다 앞`);
        if (p.bs >= 0.15) { if (p.b >= prev) { prev = p.b; prevItem = it; } }
      });
    }
    if (q.type === 'match' && Array.isArray(q.pairs)) {
      q.pairs.forEach((x, k) => {
        refField(x.ref, `${where}.pairs[${k}].ref`);
        factCheck(x.text, `${where}.pairs[${k}]`, [x.ref]);
        const own = score(x.text, textOf(x.ref, 'krv'));
        q.pairs.forEach((y, j) => { if (j !== k) { const o = score(x.text, textOf(y.ref, 'krv')); if (o > own + 0.08) F('CHK', '잇기', `${where}.pairs[${k}]`, `"${x.text}"이(가) 제 짝 ${x.ref}보다 ${y.ref}와 더 닮음(${Math.round(own * 100)}% < ${Math.round(o * 100)}%)`); } });
        if (own < 0.12) F('CHK', '잇기-낮은겹침', `${where}.pairs[${k}]`, `"${x.text}"과 ${x.ref} 본문의 겹침이 아주 낮음`);
      });
      if (q.after) factCheck(q.after, where + '.after', refs);
    }
    if (q.type === 'findref' && q.after) factCheck(q.after, where + '.after', []);
  };

  /* ---- 장면을 돈다 ---- */
  refField(d.ref, 'ref');
  let prevStart = null;
  beats.forEach((b, i) => {
    const w = `beats[${i}]`;
    refField(b.ref, w + '.ref'); if (b.open) refField(b.open, w + '.open');
    const k = keysOf(b.ref);
    if (k && k.length) {
      const st = k[0].split(':').map(Number);
      if (prevStart && (st[0] < prevStart[0] || (st[0] === prevStart[0] && (st[1] < prevStart[1] || (st[1] === prevStart[1] && st[2] < prevStart[2]))))) F('CHK', '대목차례', w, `대목의 장절 ${b.ref}이(가) 앞 대목보다 앞선 곳(본문의 차례대로인지 볼 것)`);
      prevStart = st;
    }
    if (b.open) { const ok = keysOf(b.open); if (ok && k && !ok.every((x) => k.includes(x))) F('CHK', '펼곳', w, `펼 곳(open) ${b.open}이(가) 그 대목의 장절 ${b.ref} 밖`); }
    if (b.text) ['t1', 't2', 't3'].forEach((t) => { if (b.text[t]) { factCheck(b.text[t], `${w}.text.${t}`, [b.ref]); scanInline(b.text[t], `${w}.text.${t}`); } });
    if (b.text) triCheck(b.text, w + '.text');
    if (b.say && b.say.text) { factCheck(b.say.text, w + '.say', [b.ref], { noCopy: false }); scanInline(b.say.text, w + '.say'); }
  });
  function triCheck(o, where) {      /* 세 단계의 숫자·이름이 어긋나지 않는가: t1·t2에 있는 숫자·이름이 t3에도 있는가 */
    if (!o || !o.t3) return;
    const n3 = numsKo(o.t3), m3 = namesIn(o.t3), n2 = numsKo(o.t2 || ''), m2 = namesIn(o.t2 || '');
    ['t1', 't2'].forEach((t) => {
      if (!o[t]) return;
      numsKo(o[t]).forEach((n) => { if (!n3.has(n)) F('CHK', '단계-숫자', `${where}.${t}`, `숫자 ${n}이(가) ${t}에는 있고 t3에는 없음(세 단계의 사실이 같은지 볼 것)`); });
      namesIn(o[t]).forEach((n) => { if (!m3.has(n)) F('CHK', '단계-이름', `${where}.${t}`, `"${n}"이(가) ${t}에는 있고 t3에는 없음`); });
    });
    if (o.t1) { numsKo(o.t1).forEach((n) => { if (o.t2 && !n2.has(n) && n3.has(n)) F('CHK', '단계-숫자', `${where}.t1`, `숫자 ${n}이(가) t1·t3에는 있고 t2에는 없음`); }); }
  }
  ['t1', 't2', 't3'].forEach((t) => ((d.gates && d.gates[t]) || []).forEach((q, i) => question(q, `gates.${t}[${i}]`, t)));
  (d.quests || []).forEach((q, i) => {
    ['t1', 't2', 't3'].forEach((t) => question(q.q && q.q[t], `quests[${i}].q.${t}`, t));
    ['line', 'found'].forEach((k) => { if (q[k]) scanInline(q[k], `quests[${i}].${k}`); });
    if (q.say && q.say.text) factCheck(q.say.text, `quests[${i}].say`, [], { noCopy: false });
  });
  (d.cards || []).forEach((c, i) => { refField(c.ref, `cards[${i}].ref`); if (R.parse(c.ref) && !inScene(c.ref)) F('CHK', '범위밖', `cards[${i}]`, `말씀 카드 ${c.ref}이(가) 장면의 본문 범위 밖`); if (c.title) factCheck(c.title, `cards[${i}].title`, [c.ref], { noCopy: true }); });
  const c = d.close || {};
  ['t1', 't2', 't3'].forEach((t) => { const s = c[t] && (c[t].text || c[t].prompt); if (s) { scanInline(s, `close.${t}`); factCheck(s, `close.${t}`, [], { noCopy: false });
    const p = proseRefs(s); p.books.forEach((b) => { p.cv.forEach((cv) => { const ref = `${b.ab} ${cv}`; if (p.books.length === 1 && R.parse(ref) && keysOf(ref) && !inScene(ref)) F('CHK', '범위밖', `close.${t}`, `마무리 글이 읽으라고 한 ${ref}이(가) 장면의 본문 범위 밖`); }); }); } });
  const m = d.mission;
  if (m) {
    ['t1', 't2', 't3'].forEach((t) => { if (m.call && m.call[t]) { scanInline(m.call[t], `mission.call.${t}`); factCheck(m.call[t], `mission.call.${t}`, [], { story: true }); } });
    (m.materials || []).forEach((x, i) => { refField(x.basis, `mission.materials[${i}].basis`); if (R.parse(x.basis) && !inScene(x.basis)) F('CHK', '범위밖', `mission.materials[${i}]`, `재료의 근거 ${x.basis}이(가) 장면의 본문 범위 밖`); ['name', 'use', 'how', 'line'].forEach((k) => { if (x[k]) { scanInline(x[k], `mission.materials[${i}].${k}`); factCheck(x[k], `mission.materials[${i}].${k}`, [x.basis], { story: true }); } }); });
    const cp = m.companion;
    if (cp) {
      refField(cp.ref, 'mission.companion.ref');
      (cp.talks || []).forEach((x, i) => {
        const w = `mission.companion.talks[${i}]`;
        refField(x.ref, w + '.ref'); refField(x.open, w + '.open');
        if (R.parse(x.ref) && !inScene(x.ref)) F('CHK', '범위밖', w, `동행 문답의 장절 ${x.ref}이(가) 장면의 본문 범위 밖`);
        const ok = keysOf(x.open), rk = keysOf(x.ref); if (ok && rk && !ok.every((y) => rk.includes(y))) F('CHK', '펼곳', w, `펼 곳(open) ${x.open}이(가) 그 문답의 장절 ${x.ref} 밖`);
        if (x.answer) { ['t1', 't2', 't3'].forEach((t) => { if (x.answer[t]) { factCheck(x.answer[t], `${w}.answer.${t}`, [x.ref]); scanInline(x.answer[t], `${w}.answer.${t}`); } }); triCheck(x.answer, w + '.answer'); }
        if (x.ask && x.ask.text) factCheck(x.ask.text, w + '.ask', [x.ref], { story: true });
      });
    }
    const h = m.help;
    if (h && Array.isArray(h.steps)) h.steps.forEach((x, i) => {
      const w = `mission.help.steps[${i}]`;
      refField(x.basis, w + '.basis');
      if (R.parse(x.basis) && !inScene(x.basis)) F('CHK', '범위밖', w, `돕기 단계의 근거 ${x.basis}이(가) 장면의 본문 범위 밖`);
      /* 돕기의 때: 근거 절이 그 단계가 나오는 대목보다 뒤의 일이면 아직 일어나지 않은 일을 돕는 셈 */
      if (Number.isInteger(x.after) && beats[x.after]) {
        const bk = keysOf(beats[x.after].ref), sk = keysOf(x.basis);
        if (bk && sk && bk.length && sk.length) {
          const cmp = (a, b) => { const p = a.split(':').map(Number), q = b.split(':').map(Number); return p[0] - q[0] || p[1] - q[1] || p[2] - q[2]; };
          if (cmp(sk[0], bk[bk.length - 1]) > 0) F('CHK', '돕기의때', w, `돕기 단계의 근거 ${x.basis}이(가) 그 단계가 나오는 대목(${beats[x.after].ref})보다 뒤의 절`);
        }
      }
      if (x.text) { ['t1', 't2', 't3'].forEach((t) => { if (x.text[t]) { factCheck(x.text[t], `${w}.text.${t}`, [x.basis]); scanInline(x.text[t], `${w}.text.${t}`); } }); triCheck(x.text, w + '.text'); }
      if (x.done && x.done.text) factCheck(x.done.text, w + '.done', [x.basis], { story: true });
      if (x.say && x.say.text) factCheck(x.say.text, w + '.say', [x.basis]);
      if (x.kind === 'ask') {
        if (x.answer) { ['t1', 't2', 't3'].forEach((t) => { if (x.answer[t]) { factCheck(x.answer[t], `${w}.answer.${t}`, [x.basis]); scanInline(x.answer[t], `${w}.answer.${t}`); } }); triCheck(x.answer, w + '.answer'); }
        ['t1', 't2', 't3'].forEach((t) => question(x.read && x.read[t], `${w}.read.${t}`, t));
        if (x.nt) {
          refField(x.nt.ref, w + '.nt.ref');
          const k = keysOf(x.nt.ref);
          if (!k || !k.length) F('ERR', '없는절', w + '.nt', `신약 장절이 실제로 없음: "${x.nt.ref}"`);
          else {
            const nk = textOf(x.nt.ref, 'krv'), a = norm(x.nt.text || ''), n = lcs(a, norm(nk));
            if (n >= 10) F('CHK', '같은글', w + '.nt.text', `신약 본문과 ${n}글자가 그대로 같음(${x.nt.ref}): "${lcsStr(a, norm(nk))}"`);
            const kn = numsKo(nk), en = numsEn(textOf(x.nt.ref, 'kjv'));
            numsKo(x.nt.text || '').forEach((v) => { if (!kn.has(v) && !en.has(v)) F('CHK', '숫자', w + '.nt.text', `숫자 ${v}이(가) ${x.nt.ref}에 안 보임`); });
            scanInline(x.nt.text, w + '.nt.text');
          }
        }
      }
    });
    (m.today || []).forEach((x, i) => {
      const w = `mission.today[${i}]`;
      (x.refs || []).forEach((r, k) => refField(r, `${w}.refs[${k}]`));
      if (x.a) { ['t1', 't2', 't3'].forEach((t) => { if (x.a[t]) { factCheck(x.a[t], `${w}.a.${t}`, x.refs || []); scanInline(x.a[t], `${w}.a.${t}`); } }); triCheck(x.a, w + '.a'); }
    });
  }
  return out;
}

/* ---------- 시대 안내(eras.json) ---------- */
function checkEras(E, scenes) {
  const out = [], F = (level, code, where, msg) => out.push({ level, code, where, msg });
  const cmp = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
  const used = {};      // 절 열쇠 → 어디서 썼나
  scenes.forEach((d) => (d.beats || []).concat([{ ref: d.ref }]).forEach((b) => { const k = keysOf(b.ref); if (k) k.forEach((x) => { used[x] = d.id; }); }));
  (E.eras || []).forEach((e) => {
    let prev = null;
    (e.between || []).forEach((ref, i) => {
      const w = `eras[${e.era}].between[${i}]`;
      if (!CANON.test(ref)) F('ERR', '표기', w, `장절 표기가 한 가지 꼴이 아님: "${ref}"`);
      const k = keysOf(ref);
      if (!k || !k.length) { F('ERR', '없는절', w, `실제로 없는 장절: "${ref}"`); return; }
      const hit = k.find((x) => used[x] && /^OT/.test(used[x])); if (hit) F('ERR', '겹침', w, `${ref}이(가) ${used[hit]}의 본문과 겹침`);
      const dup = k.find((x) => used[x] && !/^OT/.test(used[x])); if (dup) F('ERR', '겹침', w, `${ref}이(가) 다른 "사이" 구간(${used[dup]})과 겹침`);
      k.forEach((x) => { if (!used[x]) used[x] = ref; });
      const st = k[0].split(':').map(Number);
      if (prev && cmp(st, prev) < 0) F('CHK', '사이차례', w, `${ref}이(가) 앞 구간보다 앞선 곳(성경의 차례대로인지 볼 것)`);
      prev = k[k.length - 1].split(':').map(Number);
    });
    /* 시대의 이름과 여는 말은 탐험대 이야기다: 숫자가 들어 있으면 사람이 본다 */
    numsKo(e.intro || '').forEach((n) => F('CHK', '숫자', `eras[${e.era}].intro`, `여는 말에 숫자 ${n}`));
  });
  /* 장면과 "사이" 구간 사이에 비는 장(같은 책 안에서)이 있는지: 일부러 뺀 것인지 사람이 본다 */
  const byBook = {};
  Object.keys(used).forEach((x) => { const p = x.split(':').map(Number); (byBook[p[0]] = byBook[p[0]] || new Set()).add(p[1]); });
  Object.keys(byBook).forEach((b) => {
    const chs = [...byBook[b]].sort((a, c) => a - c), miss = [];
    for (let c = chs[0]; c <= chs[chs.length - 1]; c++) if (!byBook[b].has(c)) miss.push(c);
    if (miss.length) F('CHK', '빈장', 'eras', `${BOOKS[b][1]}: 장면에도 "사이"에도 없는 장 ${miss.join(', ')}`);
    /* 절 단위로 비는 곳 */
    chs.forEach((c) => {
      const v = R.verses(`${BOOKS[b][0]} ${c}`); if (!v) return;
      const gaps = v.list.filter((x) => !used[vkey(+b, c, x.v)]).map((x) => x.v);
      if (gaps.length && gaps.length < v.list.length) F('CHK', '빈절', 'eras', `${BOOKS[b][1]} ${c}장: 장면에도 "사이"에도 없는 절 ${gaps[0]}~${gaps[gaps.length - 1]}(${gaps.length}절)`);
    });
  });
  return out;
}

module.exports = { checkScene, checkEras, numsKo, numsEn, namesIn, proseRefs, score };
