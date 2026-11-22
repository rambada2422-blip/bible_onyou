/* 바이블 온유 · 다윗 탐험 그림과 사물 아이콘 (인라인 SVG)
 * 신학 규칙: 하나님과 천사의 신체·손·그림자·실루엣 없음, 전투 묘사 없음, 그림 안에 글자 없음.
 */
window.BO_DAVID = window.BO_DAVID || {};
(function () {
  'use strict';

  var SCENES = {
    D01: '<svg viewBox="0 0 360 180" role="img" aria-label="베들레헴 들판의 양 떼와 기름이 든 뿔">' +
      '<rect width="360" height="180" fill="#89C4E1"/>' +
      '<path d="M0 108 Q90 86 180 102 T360 96 L360 180 L0 180 Z" fill="#C9A86B"/>' +
      '<path d="M0 126 Q110 112 220 124 T360 118 L360 180 L0 180 Z" fill="#9DAE66"/>' +
      '<g fill="#FBF7EE"><ellipse cx="78" cy="134" rx="18" ry="11"/><circle cx="94" cy="130" r="6" fill="#4B3B2B"/>' +
      '<ellipse cx="130" cy="144" rx="16" ry="10"/><circle cx="145" cy="141" r="5.5" fill="#4B3B2B"/>' +
      '<ellipse cx="290" cy="138" rx="17" ry="10"/><circle cx="275" cy="135" r="5.5" fill="#4B3B2B"/></g>' +
      '<g transform="translate(172,72)">' +
      '<path d="M12 68 C22 50 42 30 62 12 C56 26 48 48 34 68 Z" fill="#7D4F2A"/>' +
      '<ellipse cx="23" cy="68" rx="11" ry="5" fill="#4E3019"/>' +
      '<circle cx="23" cy="68" r="5" fill="#E9B44C"/></g></svg>',

    'jonathan-robe': '<svg viewBox="0 0 360 180" role="img" aria-label="접어 건네는 요나단의 겉옷">' +
      '<rect width="360" height="180" fill="#E9D6B5"/>' +
      '<rect y="128" width="360" height="52" fill="#C9A26B"/>' +
      '<path d="M115 36 L152 24 L208 24 L245 36 L262 142 L222 148 L210 72 L198 150 L162 150 L150 72 L138 148 L98 142 Z" fill="#3B5B8C"/>' +
      '<path d="M152 24 L180 48 L208 24" fill="none" stroke="#E9B44C" stroke-width="5"/>' +
      '<rect x="148" y="96" width="64" height="12" rx="4" fill="#B4532A"/>' +
      '<rect x="166" y="94" width="28" height="16" rx="3" fill="#E9B44C"/></svg>',

    'brook-stones': '<svg viewBox="0 0 360 180" role="img" aria-label="시냇가 물가와 매끄러운 돌 다섯">' +
      '<rect width="360" height="180" fill="#9AD0DE"/>' +
      '<path d="M0 95 Q120 82 240 94 T360 88 L360 180 L0 180 Z" fill="#D5B98A"/>' +
      '<path d="M0 116 Q160 100 360 122 L360 156 Q170 138 0 152 Z" fill="#5CA8BA"/>' +
      '<g fill="#7C8594" stroke="#4D5666" stroke-width="2">' +
      '<ellipse cx="86" cy="146" rx="15" ry="10"/><ellipse cx="132" cy="152" rx="14" ry="9"/>' +
      '<ellipse cx="180" cy="148" rx="16" ry="10"/><ellipse cx="228" cy="153" rx="14" ry="9"/>' +
      '<ellipse cx="274" cy="146" rx="15" ry="10"/></g></svg>'
  };

  var ICONS = {
    horn: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M8 31 C13 22 22 13 33 7 C30 15 25 25 18 33 Z" fill="#7D4F2A"/><ellipse cx="13" cy="31" rx="5.5" ry="3" fill="#E9B44C"/></svg>',
    robe: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M11 8 L16 6 L24 6 L29 8 L33 34 L25 35 L23 19 L21 35 L19 35 L17 19 L15 35 L7 34 Z" fill="#3B5B8C"/><rect x="14" y="21" width="12" height="3.5" rx="1.5" fill="#E9B44C"/></svg>',
    stone: '<svg viewBox="0 0 40 40" aria-hidden="true"><ellipse cx="20" cy="22" rx="13" ry="9" fill="#8B94A3" stroke="#535C6B" stroke-width="2"/><ellipse cx="16" cy="19" rx="4" ry="2" fill="#C6CED9"/></svg>',
    hem: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M7 12 L28 10 L33 31 L11 33 Z" fill="#8C3B3B"/><path d="M10 27 L31 25" stroke="#E9B44C" stroke-width="3"/></svg>',
    crown: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M7 29 L9 14 L16 21 L20 11 L24 21 L31 14 L33 29 Z" fill="#E9B44C" stroke="#A8741F" stroke-width="2"/></svg>',
    ark: '<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="4" y="21" width="32" height="3.5" rx="1.5" fill="#A8741F"/><rect x="10" y="12" width="20" height="15" rx="3" fill="#3F72D0" stroke="#244B96" stroke-width="2"/></svg>',
    tent: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M5 32 L20 9 L35 32 Z" fill="#C69C6D" stroke="#7D5A36" stroke-width="2"/><path d="M16 32 L20 20 L24 32 Z" fill="#3B2B1E"/></svg>',
    table: '<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="6" y="18" width="28" height="5" rx="2" fill="#8C5B32"/><rect x="9" y="23" width="4" height="11" fill="#6E4422"/><rect x="27" y="23" width="4" height="11" fill="#6E4422"/><ellipse cx="20" cy="15" rx="6" ry="3" fill="#E9B44C"/></svg>',
    person: '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="13" r="6" fill="#B88057"/><path d="M10 34 C10 25 14 21 20 21 C26 21 30 25 30 34 Z" fill="#4F6D7A"/></svg>',
    water: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 7 C20 7 30 19 30 25 A10 10 0 0 1 10 25 C10 19 20 7 20 7 Z" fill="#4DA8C4"/></svg>',
    gold: '<svg viewBox="0 0 40 40" aria-hidden="true"><ellipse cx="16" cy="25" rx="8" ry="6" fill="#E9B44C" stroke="#A8741F" stroke-width="2"/><ellipse cx="25" cy="21" rx="7" ry="5" fill="#D4DCE8" stroke="#7A8699" stroke-width="2"/></svg>'
  };

  window.BO_DAVID.art = {
    scene: function (id) { return SCENES[id] || SCENES.D01; },
    icon: function (id) { return ICONS[id] || ICONS.stone; },
    registerScenes: function (map) {
      Object.keys(map).forEach(function (k) { SCENES[k] = map[k]; });
    }
  };
})();
