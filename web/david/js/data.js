/* 바이블 온유 · 다윗 탐험 데이터 (D01부터 차례로 확장) */
window.BO_DAVID = window.BO_DAVID || {};
(function () {
  'use strict';

  var SUPPLEMENTS = {
    'jonathan-robe': {
      id: 'jonathan-robe',
      title: '요나단의 겉옷',
      ref: '삼상 18:3–4',
      art: 'jonathan-robe',
      badge: '요나단의 겉옷',
      fact: '요나단이 자기 겉옷을 다윗에게 주었어.',
      diff: '이 겉옷은 나중에 사울의 아들 요나단이 친구 다윗에게 선물로 준 옷이야.'
    },
    'brook-stones': {
      id: 'brook-stones',
      title: '시냇가의 돌',
      ref: '삼상 17:40',
      art: 'brook-stones',
      badge: '시냇가의 돌',
      fact: '다윗이 시냇가에서 매끄러운 돌 다섯을 골랐어.',
      diff: '이 돌은 다윗이 시냇가에서 주워 목자의 주머니에 넣은 돌이야.'
    }
  };

  var SCENES = [
    {
      id: 'D01',
      title: '양을 치던 다윗',
      ref: '삼상 16:11–13',
      place: '베들레헴',
      art: 'D01',
      question: '사무엘이 기름을 부을 때 무엇을 가져왔을까?',
      choices: [
        { id: 'horn', label: '기름이 든 뿔', sub: '사무엘이 들고 온 것', icon: 'horn', ok: true },
        { id: 'jonathan-robe', label: '요나단의 겉옷', sub: '친구가 준 겉옷', icon: 'robe', detour: 'jonathan-robe' }
      ],
      discovery: '양을 치던 다윗이 불려 왔고, 사무엘이 그에게 기름을 부었어.',
      journalRef: '삼상 16:11–13'
    }
  ];

  window.BO_DAVID.data = {
    supplements: SUPPLEMENTS,
    scenes: SCENES
  };
})();
