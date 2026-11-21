/* 2D 시범판의 저장과 공통 도구. */
(function () {
  'use strict';
  var C = BO.content, IC = BO.icons, ART = BO.art || {};
  var KEY = 'bo_demo_v1';
  var root = document.getElementById('app');
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 저장 (이 기기에만, 실패해도 게임은 돌아간다) ── */
  function fresh() { return { v: 1, tier: null, char: null, done: {}, cards: [], notes: {}, routed: false }; }
  function isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }
  function validSave(saved) {
    if (!isRecord(saved) || saved.v !== 1) return false;
    var unselected = saved.tier === null && saved.char === null;
    var selected = C.tiers.some(function (tier) { return tier.id === saved.tier; }) &&
      typeof saved.char === 'string' && Object.prototype.hasOwnProperty.call(C.chars, saved.char);
    return (unselected || selected) &&
      typeof saved.routed === 'boolean' &&
      isRecord(saved.done) && Object.keys(saved.done).every(function (id) { return typeof saved.done[id] === 'boolean'; }) &&
      Array.isArray(saved.cards) && saved.cards.every(function (card) {
        return isRecord(card) && typeof card.ref === 'string' && typeof card.title === 'string' &&
          typeof card.scene === 'string' && typeof card.bonus === 'boolean';
      }) &&
      isRecord(saved.notes) && Object.keys(saved.notes).every(function (id) {
        return Object.prototype.hasOwnProperty.call(C.scenes, id) && typeof saved.notes[id] === 'string';
      });
  }
  var previousSave = null;
  function load() {
    try {
      previousSave = localStorage.getItem(KEY);
      var saved = JSON.parse(previousSave);
      if (validSave(saved)) return saved;
    } catch (e) { /* 저장 값이 깨졌거나 저장소를 열 수 없는 환경 */ }
    return fresh();
  }
  function save() {
    try {
      // 오래 열어 둔 탭이 다른 탭의 새 탐험을 덮지 않게 한다.
      if (localStorage.getItem(KEY) !== previousSave) return;
      var data = JSON.stringify(app.state);
      if (data === previousSave) return;
      localStorage.setItem(KEY, data);
      previousSave = data;
    } catch (e) { /* 저장이 막혀 있어도 현재 화면에서 계속 탐험한다. */ }
  }

  /* ── 작은 도구 ── */
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
  function tx(v) { return typeof v === 'string' ? v : (v[app.state.tier] || v.t2); }
  var uriCache = {};
  function uri(key) {
    if (!ART[key]) return '';
    return uriCache[key] || (uriCache[key] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ART[key]));
  }
  function pic(key, cls, alt) {
    if (!ART[key]) return el('span', { class: (cls || '') + ' noart', 'aria-hidden': 'true' });
    return el('img', { class: cls || '', src: uri(key), alt: alt || '' });
  }
  function icon(name) { var s = el('span', { html: IC[name] || '' }); return s.firstChild; }
  function refChip(ref, dark) { return el('span', { class: 'ref' + (dark ? ' dark' : '') }, icon('bookline'), ref); }
  function show(node) {
    root.className = 'app ' + (app.state.tier || 't2');
    root.replaceChildren(node);
  }
  function tierInfo() { return C.tiers.filter(function (t) { return t.id === app.state.tier; })[0]; }
  function bookName(ref) {
    return ref.replace(/^출 /, '출애굽기 ').replace(/^창 /, '창세기 ').replace(/^수 /, '여호수아 ').replace(/(\d+):/, '$1장 ').replace(/$/, '절');
  }
  /* ── 시간 이동 연출 ── */
  function warp(kicker, title, sub, then) {
    var o = el('div', { class: 'warp sky fadein', role: 'status' },
      el('div', { class: 'in' },
        pic('timemachine', '', ''),
        el('div', { class: 'k', text: kicker }),
        el('h2', { text: title }),
        sub ? el('p', { text: sub }) : null));
    root.appendChild(o);
    setTimeout(then, reduced ? 700 : 1700);
  }

  var app = BO.app2d = {
    state: load(), fresh: fresh, save: save,
    el: el, add: add, tx: tx, pic: pic, icon: icon, refChip: refChip,
    show: show, tierInfo: tierInfo, bookName: bookName, warp: warp
  };
})();
