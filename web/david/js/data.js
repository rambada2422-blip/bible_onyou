/* 바이블 온유 · 다윗 탐험 데이터 (D01~D07 + D08·D09 및 보충 장면) */
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
      diff: '이 장면은 요나단이 친구 다윗에게 자기 겉옷을 선물로 준 때야.'
    },
    'brook-stones': {
      id: 'brook-stones',
      title: '시냇가의 돌',
      ref: '삼상 17:40',
      art: 'brook-stones',
      badge: '시냇가의 돌',
      fact: '다윗이 시냇가에서 매끄러운 돌 다섯을 골랐어.',
      diff: '이 장면은 다윗이 시냇가에서 매끄러운 돌 다섯을 주운 때야.'
    },
    'hebron-elders': {
      id: 'hebron-elders',
      title: '이스라엘의 장로들 (나중 만남)',
      ref: '삼하 5:3',
      art: 'hebron-elders',
      badge: '장소: 헤브론 · 나중 만남',
      fact: '이스라엘의 모든 장로가 헤브론에 와서 다윗에게 기름을 부어 이스라엘의 왕으로 삼았어.',
      diff: '이 만남은 유다 사람들이 먼저 왕으로 세운 뒤, 나중에 헤브론에서 일어난 두 번째 만남이야.'
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
        { id: 'jonathan-robe', label: '요나단의 겉옷', sub: '요나단이 다윗에게 준 겉옷', icon: 'robe', detour: 'jonathan-robe' }
      ],
      discovery: '양을 치던 다윗이 불려 왔고, 사무엘이 그에게 기름을 부었어.',
      journalRef: '삼상 16:11–13'
    },
    {
      id: 'D02',
      title: '시냇가의 다섯 돌',
      ref: '삼상 17:38–40, 45',
      place: '엘라 골짜기 시냇가',
      art: 'D02',
      mode: 'stones',
      question: '다윗이 시냇가에서 고른 건 무엇일까?',
      choices: [
        { id: 'stones', label: '매끄러운 돌', sub: '시냇가에서 고른 돌', icon: 'stone', ok: true },
        { id: 'jonathan-robe', label: '요나단의 겉옷', sub: '요나단이 다윗에게 준 겉옷', icon: 'robe', detour: 'jonathan-robe' }
      ],
      discovery: '다윗이 고른 돌은 다섯이야. 45절에서 다윗이 누구의 이름으로 나아간다고 했는지 찾아보자.',
      journalRef: '삼상 17:38–40, 45'
    },
    {
      id: 'D03',
      title: '친구가 건넨 겉옷',
      ref: '삼상 18:1–4, 20:41–42',
      place: '사울의 집과 들판',
      art: 'D03',
      mode: 'order',
      question: '요나단이 다윗에게 건넨 것은 무엇일까?',
      choices: [
        { id: 'self-robe', label: '자기 겉옷', sub: '요나단이 다윗에게 건넨 겉옷', icon: 'robe', ok: true },
        { id: 'brook-stones', label: '시냇가의 돌', sub: '시냇가에서 고른 돌', icon: 'stone', detour: 'brook-stones' }
      ],
      orderItems: [
        { id: 'gift', label: '선물을 준 때', ref: '삼상 18:1–4' },
        { id: 'farewell', label: '두 친구가 헤어진 때', ref: '삼상 20:41–42' }
      ],
      discovery: '요나단이 자기 겉옷을 다윗에게 주었고, 두 친구는 나중에 서로 인사하며 헤어졌어.',
      journalRef: '삼상 18:1–4, 20:41–42'
    },
    {
      id: 'D04',
      title: '굴 밖에서 보인 옷자락',
      ref: '삼상 24:8–12',
      place: '엔게디 굴 밖',
      art: 'D04',
      question: '다윗이 사울에게 보여 준 것은 무엇일까?',
      choices: [
        { id: 'saul-hem', label: '사울의 겉옷 자락', sub: '사울의 옷에서 베어 낸 자락', icon: 'hem', ok: true },
        { id: 'jonathan-robe', label: '요나단의 겉옷', sub: '요나단이 다윗에게 준 겉옷', icon: 'robe', detour: 'jonathan-robe' }
      ],
      discovery: '다윗은 옷자락을 보여 주며 사울을 살려 두었다고 말했어.',
      journalRef: '삼상 24:8–12'
    },
    {
      id: 'D05',
      title: '헤브론의 두 만남',
      ref: '삼하 2:1–4, 5:1–5',
      step1Ref: '삼하 2:4',
      place: '헤브론',
      art: 'D05',
      mode: 'hebron',
      question: '헤브론에서 먼저 다윗을 왕으로 세운 사람들은 누구였을까?',
      choices: [
        { id: 'judah', label: '유다 사람들', sub: '헤브론 · 첫 번째 만남', icon: 'crown', ok: true },
        { id: 'elders', label: '이스라엘의 장로들', sub: '헤브론 · 나중 만남', icon: 'person', detour: 'hebron-elders' }
      ],
      discovery: '헤브론에서 먼저 유다 사람들이, 그 뒤 이스라엘의 장로들이 다윗을 왕으로 세웠어.',
      journalRef: '삼하 2:1–4, 5:1–5'
    },
    {
      id: 'D06',
      title: '다윗 성으로 온 궤',
      ref: '삼하 6:12–15, 17–19',
      place: '다윗 성',
      art: 'D06',
      mode: 'ark',
      question: '행렬이 다윗 성으로 메고 온 것은 무엇일까?',
      choices: [
        { id: 'ark', label: '하나님의 궤', sub: '행렬이 메고 온 궤', icon: 'ark', ok: true },
        { id: 'brook-stones', label: '시냇가의 돌', sub: '시냇가에서 고른 돌', icon: 'stone', detour: 'brook-stones' }
      ],
      discovery: '행렬이 하나님의 궤를 다윗 성으로 메고 왔고, 다윗이 마련한 장막 안에 두었어.',
      journalRef: '삼하 6:12–15, 17–19'
    },
    {
      id: 'D07',
      title: '왕의 식탁',
      ref: '삼하 9:1, 6–7, 10–13',
      place: '예루살렘 왕궁',
      art: 'D07',
      question: '다윗의 식탁에서 늘 함께 먹게 된 사람은 누구였을까?',
      choices: [
        { id: 'mephibosheth', label: '요나단의 아들 므비보셋', sub: '다윗이 불러 식탁에 맞은 사람', icon: 'table', ok: true },
        { id: 'jonathan', label: '요나단', sub: '다윗에게 겉옷을 주었던 친구', icon: 'robe', detour: 'jonathan-robe' }
      ],
      discovery: '다윗은 친구 요나단을 기억하고 그의 아들을 식탁에 맞았어.',
      journalRef: '삼하 9:1, 6–7, 10–13'
    },
    {
      id: 'D08',
      title: '베들레헴 성문 곁 우물',
      ref: '삼하 23:13–17',
      place: '베들레헴 성문 곁',
      art: 'D08',
      question: '세 사람이 다윗에게 가져온 것은 무엇일까?',
      choices: [
        { id: 'well-water', label: '우물물', sub: '베들레헴 성문 곁 우물에서 길어 온 물', icon: 'water', ok: true },
        { id: 'brook-stones', label: '시냇가의 돌', sub: '시냇가에서 고른 돌', icon: 'stone', detour: 'brook-stones' }
      ],
      discovery: '세 사람이 베들레헴 성문 곁 우물물을 가져왔고, 다윗은 마시지 않고 그 물을 여호와께 부어 드렸어.',
      journalRef: '삼하 23:13–17'
    },
    {
      id: 'D09',
      title: '성전을 위해 드린 예물',
      ref: '대상 29:6–9',
      place: '예루살렘',
      art: 'D09',
      question: '지도자들이 기쁜 마음으로 가져온 것은 무엇일까?',
      choices: [
        { id: 'gold-silver', label: '금과 은', sub: '성전을 위해 기쁜 마음으로 드린 예물', icon: 'gold', ok: true },
        { id: 'brook-stones', label: '시냇가의 돌', sub: '시냇가에서 고른 돌', icon: 'stone', detour: 'brook-stones' }
      ],
      discovery: '지도자들이 기쁜 마음으로 금과 은을 드렸어. 9절에서 백성이 기뻐한 모습도 찾아보자.',
      journalRef: '대상 29:6–9'
    }
  ];

  window.BO_DAVID.data = {
    supplements: SUPPLEMENTS,
    scenes: SCENES
  };
})();
