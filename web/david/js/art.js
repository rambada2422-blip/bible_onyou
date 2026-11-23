/* 바이블 온유 · 다윗 탐험 그림과 사물 아이콘 (인라인 SVG, D01~D09 및 보충 장면)
 * 신학 규칙: 하나님과 천사의 신체·손·그림자·실루엣 없음, 전투 묘사 없음, 그림 안에 글자 없음.
 * 언약궤(D06)는 청색 보자기로 덮인 모습(민 4:5-6)과 채로 표현한다.
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

    D02: '<svg viewBox="0 0 360 180" role="img" aria-label="시냇가 물가와 매끄러운 돌 다섯">' +
      '<rect width="360" height="180" fill="#9AD0DE"/>' +
      '<path d="M0 95 Q120 82 240 94 T360 88 L360 180 L0 180 Z" fill="#D5B98A"/>' +
      '<path d="M0 114 Q160 98 360 120 L360 156 Q170 138 0 152 Z" fill="#5CA8BA"/>' +
      '<g fill="#7C8594" stroke="#4D5666" stroke-width="2">' +
      '<ellipse cx="80" cy="145" rx="15" ry="10"/><ellipse cx="128" cy="152" rx="14" ry="9"/>' +
      '<ellipse cx="180" cy="146" rx="16" ry="10"/><ellipse cx="232" cy="152" rx="14" ry="9"/>' +
      '<ellipse cx="280" cy="145" rx="15" ry="10"/></g></svg>',

    D03: '<svg viewBox="0 0 360 180" role="img" aria-label="요나단의 겉옷과 들판 길">' +
      '<rect width="360" height="180" fill="#DCE9F2"/>' +
      '<path d="M0 118 Q180 100 360 116 L360 180 L0 180 Z" fill="#C9A86B"/>' +
      '<path d="M118 36 L152 24 L208 24 L242 36 L258 140 L220 146 L208 72 L196 148 L164 148 L152 72 L140 146 L102 140 Z" fill="#3B5B8C"/>' +
      '<path d="M152 24 L180 48 L208 24" fill="none" stroke="#E9B44C" stroke-width="5"/>' +
      '<rect x="148" y="96" width="64" height="12" rx="4" fill="#B4532A"/>' +
      '<rect x="166" y="94" width="28" height="16" rx="3" fill="#E9B44C"/></svg>',

    D04: '<svg viewBox="0 0 360 180" role="img" aria-label="바위 굴 입구와 베어 낸 겉옷 자락">' +
      '<rect width="360" height="180" fill="#D9B784"/>' +
      '<path d="M0 78 Q90 36 185 52 Q275 34 360 72 L360 180 L0 180 Z" fill="#9E7651"/>' +
      '<path d="M68 180 C68 92 104 68 148 68 C192 68 224 92 224 180 Z" fill="#3C2D23"/>' +
      '<g transform="translate(232,76)">' +
      '<path d="M8 10 L62 4 L74 68 L18 74 Z" fill="#8C3B3B"/>' +
      '<path d="M15 58 L70 52" stroke="#E9B44C" stroke-width="6"/></g></svg>',

    D05: '<svg viewBox="0 0 360 180" role="img" aria-label="헤브론 성읍 언덕과 기름 뿔">' +
      '<rect width="360" height="180" fill="#9BC8DE"/>' +
      '<path d="M0 110 Q180 78 360 112 L360 180 L0 180 Z" fill="#C9A26B"/>' +
      '<rect x="52" y="76" width="62" height="44" fill="#E6CFA3" stroke="#A68251" stroke-width="2"/>' +
      '<rect x="246" y="74" width="64" height="46" fill="#E6CFA3" stroke="#A68251" stroke-width="2"/>' +
      '<rect x="108" y="64" width="144" height="58" fill="#DFC391" stroke="#A68251" stroke-width="2"/>' +
      '<g transform="translate(152,96)">' +
      '<path d="M10 54 C22 38 40 22 58 6 C52 20 44 40 30 56 Z" fill="#7D4F2A" stroke="#4E3019" stroke-width="2"/>' +
      '<ellipse cx="20" cy="55" rx="11" ry="5" fill="#4E3019"/>' +
      '<circle cx="20" cy="55" r="5" fill="#E9B44C"/></g></svg>',

    D06: '<svg viewBox="0 0 360 180" role="img" aria-label="청색 천으로 덮인 하나님의 궤와 다윗이 마련한 장막">' +
      '<rect width="360" height="180" fill="#9AD0DE"/>' +
      '<path d="M0 124 L360 124 L360 180 L0 180 Z" fill="#D5B98A"/>' +
      '<path d="M210 132 L274 58 L338 132 Z" fill="#C69C6D" stroke="#7D5A36" stroke-width="3"/>' +
      '<path d="M256 132 L274 88 L292 132 Z" fill="#3B2B1E"/>' +
      '<rect x="44" y="106" width="148" height="8" rx="4" fill="#B9832F"/>' +
      '<rect x="76" y="74" width="84" height="54" rx="8" fill="#3F72D0" stroke="#244B96" stroke-width="3"/></svg>',

    D07: '<svg viewBox="0 0 360 180" role="img" aria-label="왕의 식탁에 차려진 음식">' +
      '<rect width="360" height="180" fill="#E8D8BC"/>' +
      '<rect y="128" width="360" height="52" fill="#C29C6A"/>' +
      '<rect x="64" y="96" width="232" height="16" rx="4" fill="#7D4F2A"/>' +
      '<rect x="86" y="112" width="16" height="52" fill="#5E3A1E"/>' +
      '<rect x="258" y="112" width="16" height="52" fill="#5E3A1E"/>' +
      '<ellipse cx="144" cy="88" rx="28" ry="12" fill="#E9B44C"/>' +
      '<ellipse cx="216" cy="90" rx="24" ry="9" fill="#B4532A"/>' +
      '<ellipse cx="216" cy="84" rx="16" ry="6" fill="#E6CFA3"/></svg>',

    D08: '<svg viewBox="0 0 360 180" role="img" aria-label="베들레헴 성문 곁 돌우물과 물그릇">' +
      '<rect width="360" height="180" fill="#8CC0DC"/>' +
      '<path d="M0 112 L360 112 L360 180 L0 180 Z" fill="#CFAF7E"/>' +
      '<rect x="26" y="48" width="96" height="74" fill="#DFC391" stroke="#9E7A4B" stroke-width="2"/>' +
      '<path d="M56 122 L56 84 A18 18 0 0 1 92 84 L92 122 Z" fill="#4A3728"/>' +
      '<ellipse cx="230" cy="116" rx="54" ry="16" fill="#8C7E6E" stroke="#5A4F44" stroke-width="3"/>' +
      '<rect x="176" y="116" width="108" height="36" fill="#9E8F7E" stroke="#5A4F44" stroke-width="3"/>' +
      '<ellipse cx="230" cy="116" rx="40" ry="10" fill="#4DA8C4"/></svg>',

    D09: '<svg viewBox="0 0 360 180" role="img" aria-label="성전을 위해 기쁜 마음으로 모은 금과 은 예물">' +
      '<rect width="360" height="180" fill="#EBDAB9"/>' +
      '<rect y="124" width="360" height="56" fill="#C9A26B"/>' +
      '<path d="M74 134 C74 102 122 96 154 134 Z" fill="#E9B44C" stroke="#A8741F" stroke-width="3"/>' +
      '<path d="M138 138 C144 96 206 92 222 138 Z" fill="#F0C662" stroke="#A8741F" stroke-width="3"/>' +
      '<path d="M206 136 C214 104 268 100 286 136 Z" fill="#D4DCE8" stroke="#7A8699" stroke-width="3"/></svg>',

    'jonathan-robe': '<svg viewBox="0 0 360 180" role="img" aria-label="요나단의 겉옷">' +
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
      '<ellipse cx="274" cy="146" rx="15" ry="10"/></g></svg>',

    'hebron-elders': '<svg viewBox="0 0 360 180" role="img" aria-label="헤브론에 모인 이스라엘의 장로들">' +
      '<rect width="360" height="180" fill="#A5C9DF"/>' +
      '<path d="M0 114 Q180 96 360 114 L360 180 L0 180 Z" fill="#CCA870"/>' +
      '<rect x="92" y="64" width="176" height="54" fill="#E6CFA3" stroke="#A68251" stroke-width="2"/>' +
      '<g fill="#4F6D7A"><circle cx="122" cy="116" r="11" fill="#B88057"/><path d="M104 156 C104 134 140 134 140 156 Z"/>' +
      '<circle cx="180" cy="112" r="12" fill="#B88057"/><path d="M160 158 C160 132 200 132 200 158 Z" fill="#3B5B8C"/>' +
      '<circle cx="238" cy="116" r="11" fill="#B88057"/><path d="M220 156 C220 134 256 134 256 156 Z" fill="#7D5A36"/></g></svg>'
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

  var ZOOMS = {
    'd01-shepherd': '<svg viewBox="0 0 240 110" role="img" aria-label="베들레헴 들판의 양 떼와 목자 지팡이 확대 그림">' +
      '<rect width="240" height="110" fill="#89C4E1"/>' +
      '<path d="M0 64 Q80 48 160 60 T240 54 L240 110 L0 110 Z" fill="#9DAE66"/>' +
      '<path d="M46 96 L64 26 C67 16 79 16 80 26" fill="none" stroke="#6E4524" stroke-width="6" stroke-linecap="round"/>' +
      '<g fill="#FBF7EE" stroke="#DDD2BE" stroke-width="1.5">' +
      '<ellipse cx="122" cy="74" rx="24" ry="15"/><circle cx="144" cy="69" r="8" fill="#4B3B2B" stroke="none"/>' +
      '<ellipse cx="182" cy="82" rx="22" ry="13"/><circle cx="163" cy="78" r="7" fill="#4B3B2B" stroke="none"/>' +
      '</g></svg>',

    'd01-horn': '<svg viewBox="0 0 240 110" role="img" aria-label="사무엘이 가져온 기름이 든 뿔 확대 그림">' +
      '<rect width="240" height="110" fill="#EFE2C4"/>' +
      '<path d="M0 84 Q120 74 240 84 L240 110 L0 110 Z" fill="#C9A86B"/>' +
      '<g transform="translate(56,12)">' +
      '<path d="M24 78 C42 52 74 28 112 8 C102 28 88 58 64 82 Z" fill="#7D4F2A" stroke="#4E3019" stroke-width="2.5"/>' +
      '<ellipse cx="44" cy="80" rx="20" ry="8" fill="#4E3019"/>' +
      '<ellipse cx="44" cy="80" rx="11" ry="4.5" fill="#E9B44C"/>' +
      '<circle cx="44" cy="74" r="4" fill="#F6D172"/>' +
      '</g></svg>'
  };

  window.BO_DAVID.art = {
    scene: function (id) { return SCENES[id] || SCENES.D01; },
    icon: function (id) { return ICONS[id] || ICONS.stone; },
    zoom: function (id) { return ZOOMS[id] || SCENES.D01; },
    registerScenes: function (map) {
      Object.keys(map).forEach(function (k) { SCENES[k] = map[k]; });
    }
  };
})();
