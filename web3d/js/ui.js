/* 화면 부품 공용 모음: 3D 장면(game.js)과 이야기 카드(story.js)가 함께 쓴다.
 * 관문 물음 네 가지(choice·find·order·findref)는 2D 시범판과 같은 방식이다. 오답 표현은 쓰지 않는다(규칙서 4.2).
 * 나이 단계와 고른 아이는 BO3D.S에 있다(게임 전체가 같은 것을 본다).
 */
(function () {
  'use strict';
  window.BO3D = window.BO3D || {};
  var IC = (window.BO && BO.icons) || {}, C = (window.BO && BO.content) || {};
  var S = BO3D.S = BO3D.S || { tier: 't2', ch: 'hyu' };
  var BOOKS = [['창', '창세기'], ['출', '출애굽기'], ['레', '레위기'], ['민', '민수기'], ['신', '신명기'], ['수', '여호수아'], ['삿', '사사기'], ['룻', '룻기'],
    ['삼상', '사무엘상'], ['삼하', '사무엘하'], ['왕상', '열왕기상'], ['왕하', '열왕기하'], ['대상', '역대상'], ['대하', '역대하'], ['스', '에스라'], ['느', '느헤미야'],
    ['에', '에스더'], ['욥', '욥기'], ['시', '시편'], ['잠', '잠언'], ['전', '전도서'], ['아', '아가'], ['사', '이사야'], ['렘', '예레미야'], ['애', '예레미야애가'],
    ['겔', '에스겔'], ['단', '다니엘'], ['호', '호세아'], ['욜', '요엘'], ['암', '아모스'], ['옵', '오바댜'], ['욘', '요나'], ['미', '미가'], ['나', '나훔'], ['합', '하박국'],
    ['습', '스바냐'], ['학', '학개'], ['슥', '스가랴'], ['말', '말라기']];
  var BOOK = {}; BOOKS.forEach(function (b) { BOOK[b[0]] = b[1]; });

  function el(tag, props) {
    var n = document.createElement(tag), i, k;
    props = props || {};
    for (k in props) {
      if (k === 'class') n.className = props[k];
      else if (k === 'text') n.textContent = props[k];
      else if (k === 'html') n.innerHTML = props[k];
      else if (k === 'on') { for (var ev in props.on) n.addEventListener(ev, props.on[ev]); }
      else if (props[k] !== null && props[k] !== undefined && props[k] !== false) n.setAttribute(k, props[k]);
    }
    for (i = 2; i < arguments.length; i++) add(n, arguments[i]);
    return n;
  }
  function add(n, kid) {
    if (kid === null || kid === undefined || kid === false) return;
    if (Array.isArray(kid)) kid.forEach(function (x) { add(n, x); });
    else n.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
  }
  function tx(v) { return typeof v === 'string' ? v : (v[S.tier] || v.t2); }
  function icon(name) { return el('span', { html: IC[name] || '' }).firstChild; }
  function refChip(ref, dark) { return el('span', { class: 'ref' + (dark ? ' dark' : '') }, icon('bookline'), ref); }
  function avatar(key) {
    var AV = BO3D.avatars || {};
    if (!AV[key]) return el('span', { class: 'avatar' });
    var img = el('img', { class: 'avatar', alt: '', src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(AV[key]) });
    /* 탐험대 장비(growth.js): 1단계 모자 배지, 2단계 깃발 배지와 놋쇠 테두리, 3단계 손목 탐지기 배지. 세 아이가 함께 바뀐다 */
    var g = BO3D.growth, n = g ? g.stage() : 0;
    if (!n) return img;
    if (n >= 2) img.className = 'avatar g2';
    return el('span', { class: 'avw' }, img, el('i', { class: 'av-badge', html: g.svg[n >= 3 ? 'wrist' : n >= 2 ? 'flag' : 'hat'] }));
  }
  /* 보기 섞기(성장 시스템 설계 보완-3·보완2-6): 물음마다 고정된 차례. 보기 객체 사본 하나로 그리기·채점·안내를 모두 한다 */
  function shuffled(arr, key) {
    var a = arr.slice(), h = 7, i;
    key = String(key || '');
    for (i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 2147483647;
    if (!h) h = 1;
    for (i = a.length - 1; i > 0; i--) { h = (h * 48271) % 2147483647; var k = h % (i + 1), t = a[i]; a[i] = a[k]; a[k] = t; }
    return a;
  }
  function optKey(q) { return (q.prompt || '') + '|' + q.options.map(function (o) { return o.label; }).join('|'); }
  /* "출 3:5" → "출애굽기 3장 5절", "출 3:1-12" → "출애굽기 3장 1-12절", "창 1:1-2:3" → "창세기 1장 1절-2장 3절" */
  function bookName(ref) {
    var m = /^(\S+) (\d+)(?::(\d+))?(?:-(?:(\d+):)?(\d+))?$/.exec(String(ref || '').trim());
    if (!m || !BOOK[m[1]]) return String(ref || '');
    var b = BOOK[m[1]], s = b + ' ' + m[2] + '장';
    if (!m[3]) return m[5] ? s + '-' + m[5] + '장' : s;
    if (m[4]) return s + ' ' + m[3] + '절-' + m[4] + '장 ' + m[5] + '절';
    return s + ' ' + m[3] + (m[5] ? '-' + m[5] : '') + '절';
  }
  function bookOf(ref) { var m = /^(\S+) /.exec(String(ref || '')); return m && BOOK[m[1]] ? BOOK[m[1]] : ''; }
  function chapterOf(ref) { var m = /^(\S+) (\d+)/.exec(String(ref || '')); return m && BOOK[m[1]] ? BOOK[m[1]] + ' ' + m[2] + '장' : ''; }
  function say(who, text) {
    var c = C.chars && C.chars[who];
    return el('div', { class: 'say' }, avatar(who), el('div', { class: 'bubble' }, el('b', { text: c ? c.name : '', style: c ? 'color:' + c.color : '' }), text));
  }

  function chips(ref) { return ref ? (Array.isArray(ref) ? el('div', { class: 'ot-refs' }, ref.map(function (r) { return refChip(r); })) : refChip(ref)) : null; }
  function goodNote(ref, text) { return el('div', { class: 'note good fadein' }, el('b', { text: text || '성경에 그렇게 기록되어 있어요.' }), chips(ref)); }
  function lookNote(ref, text) {
    return el('div', { class: 'note look fadein' }, el('b', { text: '성경에서 확인해 볼까요?' }), el('span', { text: text || '성경책을 펴서 읽은 뒤 다시 골라 보세요.' }), chips(ref));
  }
  /* 엇나간 바늘(규칙서 13.8, 2절의 "잘못된 선택"을 가볍게): 고른 보기가 성경의 다른 곳에 실제로 있는 내용이면 그곳으로 잠깐 엇나갔다가 돌아온다 */
  /* 지금 장면의 본문 범위(장면을 열 때 setScene). 엇나간 곳이 같은 장면 안이면 안내 글을 달리한다(시대 3·4 독립 대조, 2026-11-16) */
  var sceneRefs = [];
  var matchRefs = [];
  function setScene(d) {
    sceneRefs = d ? [d.ref].concat((d.beats || []).map(function (b) { return b.ref; })).filter(Boolean) : [];
    matchRefs = []; ((d && d.gates && d.gates.t3) || []).forEach(function (q) { if (q.type === 'match') q.pairs.forEach(function (p) { matchRefs.push(p.ref); }); });
  }
  /* 대목의 '성경책에서 직접 읽어요' 장절: 14~19세 잇기의 구절과 같으면 짝이 드러나므로 대목의 범위를 보여 준다(규칙서 13.9, 독립 대조 2026-11-16) */
  function openFor(b, tier) { return b.open && tier === 't3' && matchRefs.indexOf(b.open) >= 0 ? b.ref : b.open; }
  function span(ref) {   /* '출 16:1-36', '창 12:4-13:2', '출 16' → {b, s, e} (장*1000+절) */
    var m = /^(\S+) (\d+)(?::(\d+))?(?:-(?:(\d+):)?(\d+))?$/.exec(String(ref || '').trim());
    if (!m) return null;
    var c1 = +m[2], v1 = m[3] ? +m[3] : 0, c2, v2;
    if (!m[3]) { c2 = m[5] ? +m[5] : c1; v2 = 999; } else if (m[4]) { c2 = +m[4]; v2 = +m[5]; } else { c2 = c1; v2 = m[5] ? +m[5] : v1; }
    return { b: m[1], s: c1 * 1000 + v1, e: c2 * 1000 + v2 };
  }
  function inScene(ref) {
    var x = span(ref); if (!x) return false;
    return sceneRefs.some(function (r) { var y = span(r); return y && y.b === x.b && x.s >= y.s && x.s <= y.e; });
  }
  function detourNote(basis, ref) {
    var here = inScene(basis);
    return el('div', { class: 'note detour fadein' },
      el('b', { text: '타임머신 바늘이 엇나갔어요!' }),
      el('span', { text: here ? '바늘이 ' + bookName(basis) + ' 쪽으로 흔들렸어요. 그 절은 이 장면의 다른 대목이에요. 물음이 말한 절에는 없어요. 두 절을 읽어 보고, 물음이 말한 절로 돌아와 다시 골라 보세요.'
        : '바늘이 ' + bookName(basis) + ' 쪽으로 흔들렸어요. 그곳은 이 장면과 다른 이야기예요. 그 절도 읽어 보고, 이 장면의 본문으로 돌아와 다시 골라 보세요.' }),
      el('div', { class: 'ot-refs' }, refChip(basis), ref ? (Array.isArray(ref) ? ref.map(function (r) { return refChip(r); }) : refChip(ref)) : null));
  }
  function realBasis(o) { return o && o.basis && o.basis !== '본문에 없음' ? o.basis : null; }
  function choiceBlock(q, ref, onOk) {
    var pics = q.options.some(function (o) { return o.icon; }), noteBox = el('div', {}), opts = shuffled(q.options, optKey(q));
    var btns = opts.map(function (o) {
      var b = el('button', { class: 'opt', on: { click: function () {
        if (o.ok) { btns.forEach(function (x) { x.disabled = true; if (x !== b) x.classList.add('rest'); }); b.classList.add('ok'); noteBox.replaceChildren(goodNote(ref)); onOk(); }
        else { b.classList.add('rest'); b.disabled = true; noteBox.replaceChildren(realBasis(o) ? detourNote(o.basis, ref) : lookNote(q.lookRef !== undefined ? q.lookRef : ref, q.lookText)); }
        noteBox.scrollIntoView({ block: 'nearest' });
      } } }, o.icon && IC[o.icon] ? icon(o.icon) : null, el('span', { text: o.label }));
      return b;
    });
    return [q.hidePrompt ? null : el('p', { class: 'q-prompt', text: q.prompt }), el('div', { class: 'opts' + (pics ? ' pics' : '') }, btns), noteBox];
  }
  /* 성경을 읽어야 답이 나오는 물음(규칙서 13.9): 물음을 먼저 보여 주고, 읽을 장절은 힌트로 준다 */
  function askLine(text) { return el('p', { class: 'q-ask', text: text }); }
  function hintCard(refs, prompt, label) { return el('div', { class: 'findcard' }, icon('book'), el('div', {}, el('small', { class: 'hint-k', text: label || '힌트' }), refs.map(function (r) { return el('div', { class: 'big', text: bookName(r) }); }), el('p', { text: tx(prompt) }))); }
  /* 읽을 곳을 먼저 보여 주고, 찾아 읽은 뒤에 묻는다(규칙서 13.5). refs가 있으면 떨어진 여러 곳을 함께 읽는다 */
  function findBlock(q, onOk) {
    var refs = q.refs || [q.ref], after = el('div', { style: 'display:flex;flex-direction:column;gap:12px' });
    var cq = Object.assign({}, q.confirm, { hidePrompt: true });
    var rb = el('button', { class: 'btn plain', on: { click: function () { rb.disabled = true; rb.textContent = '읽었어요'; add(after, choiceBlock(cq, q.refs ? refs : q.ref, onOk)); after.scrollIntoView({ block: 'nearest' }); } } }, '찾아서 읽었어요');
    return [askLine(q.confirm.prompt), hintCard(refs, q.prompt), rb, after];
  }
  function findrefBlock(q, onOk, idp) {
    var ch = el('input', { id: 'g-ch-' + idp, type: 'text', inputmode: 'numeric', 'aria-label': '장', autocomplete: 'off', maxlength: '3' });
    var vs = el('input', { id: 'g-vs-' + idp, type: 'text', inputmode: 'numeric', 'aria-label': '절', autocomplete: 'off', maxlength: '3' });
    var noteBox = el('div', {});
    var check = el('button', { class: 'btn plain', on: { click: function () {
      var c0 = parseInt(ch.value, 10), v0 = parseInt(vs.value, 10), v = c0 + ':' + v0;
      if (!(c0 > 0) || !(v0 > 0)) { noteBox.replaceChildren(el('div', { class: 'note look fadein' }, el('b', { text: '장과 절을 숫자로 적어 보세요.' }), el('span', { text: q.hint }))); return; }
      if (q.accept.indexOf(v) >= 0) { ch.disabled = vs.disabled = check.disabled = true; noteBox.replaceChildren(goodNote(null, '맞게 찾았어요. ' + q.book + ' ' + ch.value.trim() + '장 ' + vs.value.trim() + '절.')); onOk(); }
      else noteBox.replaceChildren(el('div', { class: 'note look fadein' }, el('b', { text: '그 장과 절에서는 찾는 내용을 확인하지 못했어요. 다시 찾아볼까요?' }), el('span', { text: q.hint })));
      noteBox.scrollIntoView({ block: 'nearest' });
    } } }, '확인');
    return [el('p', { class: 'q-prompt', text: q.prompt }), el('div', { class: 'refin' }, el('span', { text: q.book }), ch, el('span', { text: '장' }), vs, el('span', { text: '절' }), check), noteBox];
  }
  function readCard(refs, prompt) { return hintCard(refs, prompt, '읽을 곳'); }
  /* 여러 개 고르기(8~10세, 규칙서 13.8): 한 절을 찾아 읽고, 맞는 것을 모두 고른다 */
  function multiBlock(q, onOk) {
    var after = el('div', { style: 'display:flex;flex-direction:column;gap:12px' }), cq = q.confirm;
    var rb = el('button', { class: 'btn plain', on: { click: function () {
      rb.disabled = true; rb.textContent = '읽었어요';
      var noteBox = el('div', {});
      var opts = shuffled(cq.options, optKey(cq));
      var btns = opts.map(function (o) {
        var b = el('button', { class: 'opt', 'aria-pressed': 'false', on: { click: function () { b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); } } },
          el('span', { class: 'mark', html: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5 L6.5 12 L13 4.5" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' }), el('span', { text: o.label }));
        return b;
      });
      var check = el('button', { class: 'btn plain', on: { click: function () {
        var picked = opts.filter(function (o, k) { return btns[k].getAttribute('aria-pressed') === 'true'; });
        var good = opts.every(function (o, k) { return (btns[k].getAttribute('aria-pressed') === 'true') === !!o.ok; });
        if (good) { btns.forEach(function (b, k) { b.disabled = true; b.classList.add(opts[k].ok ? 'ok' : 'rest'); }); check.disabled = true; noteBox.replaceChildren(goodNote(q.ref, '맞는 것을 모두 찾았어요.')); onOk(); }
        else {
          var wrong = picked.filter(function (o) { return !o.ok && realBasis(o); })[0];
          noteBox.replaceChildren(wrong ? detourNote(wrong.basis, q.ref) : lookNote(q.ref, picked.some(function (o) { return !o.ok; }) ? '그 절에 없는 것이 섞여 있어요. 다시 읽고 골라 보세요.' : '그 절에 나오는 것이 더 있어요. 다시 읽고 모두 골라 보세요.'));
        }
        noteBox.scrollIntoView({ block: 'nearest' });
      } } }, '다 골랐어요');
      add(after, [el('div', { class: 'opts' }, btns), check, noteBox]);
      after.scrollIntoView({ block: 'nearest' });
    } } }, '찾아서 읽었어요');
    return [askLine(cq.prompt), hintCard([q.ref], q.prompt), rb, after];
  }
  /* 잇기(14~19세, 규칙서 13.8): 떨어진 여러 곳을 찾아 읽고, 구절마다 맞는 내용을 잇는다 */
  function matchBlock(q, onOk) {
    var noteBox = el('div', {}), sel = null, done = 0;
    var order = q.pairs.map(function (p, k) { return k; }); order.push(order.shift()); if (order.length > 2) order.reverse();   /* 내용 쪽은 차례를 섞어 보여 준다 */
    var left = q.pairs.map(function (p) {
      var b = el('button', { class: 'opt mref', 'aria-pressed': 'false', on: { click: function () { if (b.disabled) return; left.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); b.setAttribute('aria-pressed', 'true'); sel = p; } } }, icon('bookline'), el('span', { text: p.ref }));
      return b;
    });
    var right = order.map(function (k) {
      var p = q.pairs[k];
      var b = el('button', { class: 'opt mtext', on: { click: function () {
        if (b.disabled) return;
        if (!sel) { noteBox.replaceChildren(el('div', { class: 'note look fadein' }, el('b', { text: '먼저 구절을 골라요.' }), el('span', { text: '왼쪽의 구절 하나를 누른 뒤, 그 구절에 맞는 내용을 눌러 보세요.' }))); return; }
        if (sel === p) {
          var lb = left[q.pairs.indexOf(p)]; lb.disabled = true; lb.classList.add('ok'); lb.setAttribute('aria-pressed', 'false'); b.disabled = true; b.classList.add('ok'); sel = null; done++;
          if (done === q.pairs.length) { noteBox.replaceChildren(goodNote(q.refs, q.after || '구절마다 맞게 이었어요.')); onOk(); } else noteBox.replaceChildren();
        } else noteBox.replaceChildren(lookNote(sel.ref, '그 구절에는 그 내용이 없어요. ' + bookName(sel.ref) + '을 다시 읽어 볼까요?'));
        noteBox.scrollIntoView({ block: 'nearest' });
      } } }, el('span', { text: p.text }));
      return b;
    });
    return [readCard(q.refs, q.prompt), el('div', { class: 'match3' }, el('div', { class: 'opts' }, left), el('div', { class: 'opts' }, right)), noteBox];
  }
  function orderBlock(q, onOk) {
    var n = q.items.length, perm = [], i, picked = [], noteBox = el('div', {});
    for (i = 1; i < n; i += 2) perm.push(i);
    for (i = n - 1 - ((n - 1) % 2); i >= 0; i -= 2) perm.push(i);
    var btns = perm.map(function (orig) {
      var num = el('span', { class: 'num', text: '' });
      var b = el('button', { class: 'opt', 'aria-pressed': 'false', on: { click: function () {
        if (picked.indexOf(orig) >= 0) return;
        picked.push(orig); num.textContent = String(picked.length); b.setAttribute('aria-pressed', 'true');
        if (picked.length === n) check();
      } } }, num, el('span', { text: q.items[orig] }));
      b._num = num; return b;
    });
    function reset() { picked = []; btns.forEach(function (b) { b._num.textContent = ''; b.setAttribute('aria-pressed', 'false'); }); }
    function check() {
      if (picked.every(function (v, k) { return v === k; })) { btns.forEach(function (b) { b.classList.add('ok'); b.disabled = true; }); rb.disabled = true; noteBox.replaceChildren(goodNote(q.ref, '성경에 기록된 순서예요.')); onOk(); }
      else { noteBox.replaceChildren(lookNote(q.lookRef !== undefined ? q.lookRef : q.ref, '순서를 다시 살펴볼까요? 성경책을 차례로 읽으며 다시 눌러 보세요.')); reset(); }
      noteBox.scrollIntoView({ block: 'nearest' });
    }
    var rb = el('button', { class: 'btn plain', on: { click: function () { reset(); noteBox.replaceChildren(); } } }, '다시 놓기');
    return [q.ref ? readCard([q.ref], q.prompt) : el('p', { class: 'q-prompt', text: q.prompt }), el('div', { class: 'opts' }, btns), rb, noteBox];   /* 읽을 곳을 먼저 보여 준다(13.5) */
  }
  function blockFor(q, onOk, idp) {
    if (q.type === 'choice') return choiceBlock(q, q.ref, onOk);
    if (q.type === 'find') return findBlock(q, onOk);
    if (q.type === 'findref') return findrefBlock(q, onOk, idp);
    if (q.type === 'order') return orderBlock(q, onOk);
    if (q.type === 'multi') return multiBlock(q, onOk);
    if (q.type === 'match') return matchBlock(q, onOk);
    return [];
  }
  /* 잘못 골랐을 때 보여 주는 장절: 8~10세는 장까지, 11~13세는 장절, 14~19세는 장절 없이 주제만 (규칙서 5절) */
  function quizTier(q, t3text) {
    var c = {}, k; for (k in q) c[k] = q[k];
    if (S.tier === 't1') c.lookRef = (q.ref || '').replace(/:.*$/, '장');
    else if (S.tier === 't3') { c.lookRef = ''; c.lookText = t3text || '이 이야기를 성경에서 찾아 읽은 뒤 다시 골라 보세요.'; }
    return c;
  }
  function btn(label, fn, cls) { return el('button', { class: 'btn ' + (cls || 'onpaper'), on: { click: fn } }, label); }

  BO3D.ui = { S: S, el: el, add: add, tx: tx, icon: icon, refChip: refChip, avatar: avatar, say: say, bookName: bookName, bookOf: bookOf, chapterOf: chapterOf, books: BOOKS,
    goodNote: goodNote, lookNote: lookNote, choiceBlock: choiceBlock, findBlock: findBlock, findrefBlock: findrefBlock, orderBlock: orderBlock, blockFor: blockFor, quizTier: quizTier, btn: btn,
    setScene: setScene, inScene: inScene, openFor: openFor, shuffled: shuffled, optKey: optKey };
})();
