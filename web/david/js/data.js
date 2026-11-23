/* 바이블 온유 · 다윗 탐험 데이터 (D01~D07 + 더 보기 D08·D09 및 보충 장면)
 * 공통 규칙서 8절 메타데이터: 나이 단계(tier), 보기별 근거 장절(ref), 감수 필수 여부(reviewRequired), 감수 상태(reviewState), 목회자 감수 메모(pastorNote) 포함.
 */
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
      diff: '이 장면은 요나단이 친구 다윗에게 자기 겉옷을 선물로 준 때야.',
      diffByScene: {
        D01: '이 장면은 요나단이 겉옷을 준 때야. 사무엘이 베들레헴에서 다윗에게 기름을 부을 때는 기름이 든 뿔을 가져왔어.',
        D02: '이 장면은 요나단이 겉옷을 준 때야. 다윗이 골짜기 시냇가에서 고른 것은 매끄러운 돌 다섯이야.',
        D04: '이 겉옷은 친구 요나단이 다윗에게 선물한 옷이야. 굴 밖에서 다윗이 보여 준 것은 사울의 겉옷 자락이야.',
        D07: '이때 겉옷을 준 사람은 요나단 자신이야. 식탁에 온 사람은 그의 아들 므비보셋이야.'
      }
    },
    'brook-stones': {
      id: 'brook-stones',
      title: '시냇가의 돌',
      ref: '삼상 17:40',
      art: 'brook-stones',
      badge: '시냇가의 돌',
      fact: '다윗이 시냇가에서 매끄러운 돌 다섯을 골랐어.',
      diff: '이 장면은 다윗이 시냇가에서 매끄러운 돌 다섯을 고른 때야.',
      diffByScene: {
        D03: '이 장면은 다윗이 시냇가에서 매끄러운 돌 다섯을 고른 때야. 친구 요나단이 다윗에게 건넨 것은 자기 겉옷이야.',
        D06: '이 장면은 다윗이 시냇가에서 매끄러운 돌 다섯을 고른 때야. 다윗 성으로 메고 온 것은 하나님의 궤야.',
        D08: '이 장면은 다윗이 시냇가에서 매끄러운 돌 다섯을 고른 때야. 세 사람이 베들레헴 성문 곁에서 길어 온 것은 우물물이야.',
        D09: '이 장면은 다윗이 시냇가에서 매끄러운 돌 다섯을 고른 때야. 지도자들이 성전을 위해 기쁜 마음으로 드린 것은 금과 은이야.'
      }
    },
    'hebron-elders': {
      id: 'hebron-elders',
      title: '이스라엘의 장로들 (나중 만남)',
      ref: '삼하 5:3',
      art: 'hebron-elders',
      badge: '장소: 헤브론 · 나중 만남',
      fact: '나중에 이스라엘의 장로들이 헤브론으로 찾아와 다윗을 이스라엘의 왕으로 세웠어.',
      diff: '유다의 왕이 된 지 칠 년 반 뒤, 헤브론에서 이스라엘의 왕으로 세운 나중 만남이야.',
      diffByScene: {
        D05: '유다의 왕이 된 지 칠 년 반 뒤, 헤브론에서 이스라엘의 왕으로 세운 나중 만남이야. 먼저 다윗을 유다의 왕으로 세운 사람들은 유다 사람들이야.'
      }
    }
  };

  var SCENES = [
    {
      id: 'D01',
      group: 'main',
      tier: '8~10세 (t1)',
      title: '양을 치던 다윗',
      ref: '삼상 16:11–13',
      place: '베들레헴',
      art: 'D01',
      teamNote: '『탐험대 이야기』 최온: "들판에 양들이 보여!" · 온우: "삼상 16:11–13을 펴서 사무엘이 무엇을 가져왔는지 찾아보자."',
      question: '사무엘이 기름을 부을 때 무엇을 가져왔을까?',
      choices: [
        { id: 'horn', label: '기름이 든 뿔', sub: '사무엘이 들고 온 것', ref: '삼상 16:13', icon: 'horn', ok: true },
        { id: 'jonathan-robe', label: '요나단의 겉옷', sub: '요나단이 다윗에게 준 겉옷', ref: '삼상 18:4', icon: 'robe', detour: 'jonathan-robe' }
      ],
      discovery: '양을 치던 다윗이 불려 왔고, 사무엘이 그에게 기름을 부었어.',
      journalRef: '삼상 16:11–13',
      reviewRequired: false,
      reviewState: '목회자 감수 전'
    },
    {
      id: 'D02',
      group: 'main',
      tier: '8~10세 (t1)',
      title: '시냇가의 다섯 돌',
      ref: '삼상 17:38–40, 45',
      place: '엘라 골짜기 시냇가',
      art: 'D02',
      teamNote: '『탐험대 이야기』 최온: "시냇가에 매끄러운 돌들이 있어!" · 휴: "수첩 관찰 창으로 다섯 개를 하나씩 세어 적자."',
      mode: 'stones',
      question: '다윗이 시냇가에서 고른 건 무엇일까?',
      choices: [
        { id: 'stones', label: '매끄러운 돌', sub: '시냇가에서 고른 돌', ref: '삼상 17:40', icon: 'stone', ok: true },
        { id: 'jonathan-robe', label: '요나단의 겉옷', sub: '요나단이 다윗에게 준 겉옷', ref: '삼상 18:4', icon: 'robe', detour: 'jonathan-robe' }
      ],
      discovery: '다윗이 고른 돌은 다섯이야. 45절에서 다윗이 누구의 이름으로 나아간다고 했는지 찾아보자.',
      journalRef: '삼상 17:38–40, 45',
      reviewRequired: true,
      reviewState: '목회자 감수 전',
      pastorNote: '삼상 17:46–51의 전투·참수 장면은 게임에서 직접 묘사하지 않으며, 성경 본문은 부모·교사와 함께 읽도록 안내함(공통 규칙서 4절·6절).'
    },
    {
      id: 'D03',
      group: 'main',
      tier: '8~10세 (t1)',
      title: '친구가 건넨 겉옷',
      ref: '삼상 18:1–4, 20:41–42',
      place: '사울 앞과 들판',
      art: 'D03',
      teamNote: '『탐험대 이야기』 휴: "수첩에 두 장면 조각이 놓여 있어." · 온우: "삼상 18장과 20장을 펴서 어느 일이 먼저인지 맞춰 보자."',
      mode: 'order',
      question: '요나단이 다윗에게 건넨 것은 무엇일까?',
      choices: [
        { id: 'self-robe', label: '자기 겉옷', sub: '요나단이 다윗에게 건넨 겉옷', ref: '삼상 18:4', icon: 'robe', ok: true },
        { id: 'brook-stones', label: '시냇가의 돌', sub: '시냇가에서 고른 돌', ref: '삼상 17:40', icon: 'stone', detour: 'brook-stones' }
      ],
      orderItems: [
        { id: 'gift', label: '선물을 준 때', ref: '삼상 18:1–4' },
        { id: 'farewell', label: '두 친구가 헤어진 때', ref: '삼상 20:41–42' }
      ],
      discovery: '요나단이 자기 겉옷을 다윗에게 주었고, 두 친구는 나중에 눈물을 흘리며 작별 인사를 했어.',
      journalRef: '삼상 18:1–4, 20:41–42',
      reviewRequired: false,
      reviewState: '목회자 감수 전',
      pastorNote: '두 사건 순서 놓기(선물을 준 때 → 헤어진 때)의 연령 적합성(8~10세 t1 vs 11~12세 t2) 확인.'
    },
    {
      id: 'D04',
      group: 'main',
      tier: '8~10세 (t1)',
      title: '굴 밖에서 보인 옷자락',
      ref: '삼상 24:8–12',
      place: '엔게디 굴 밖',
      art: 'D04',
      teamNote: '『탐험대 이야기』 최온: "굴 밖에서 다윗이 옷자락을 들어 보이고 있어." · 온우: "삼상 24:8–12에서 누구의 겉옷 자락인지 확인해 보자."',
      question: '다윗이 사울에게 보여 준 것은 무엇일까?',
      choices: [
        { id: 'saul-hem', label: '사울의 겉옷 자락', sub: '사울의 옷에서 베어 낸 자락', ref: '삼상 24:4, 11', icon: 'hem', ok: true },
        { id: 'jonathan-robe', label: '요나단의 겉옷', sub: '요나단이 다윗에게 준 겉옷', ref: '삼상 18:4', icon: 'robe', detour: 'jonathan-robe' }
      ],
      discovery: '다윗은 옷자락을 보여 주며 사울을 살려 두었다고 말했어.',
      journalRef: '삼상 24:8–12',
      reviewRequired: true,
      reviewState: '목회자 감수 전',
      pastorNote: '삼상 24:4–7의 맥락(여호와의 기름 부음 받은 자와 하나님의 주권·심판)을 교사·부모 가이드에서 함께 다루는지 목회자 감수 필수.'
    },
    {
      id: 'D05',
      group: 'main',
      tier: '8~10세 (t1)',
      title: '헤브론의 두 만남',
      ref: '삼하 2:1–4, 5:1–5',
      step1Ref: '삼하 2:4',
      place: '헤브론',
      art: 'D05',
      teamNote: '『탐험대 이야기』 휴: "두 번 다 장소가 헤브론이야!" · 온우: "삼하 2:4와 5:3을 차례로 펴서 먼저 온 사람들을 구별해 보자."',
      mode: 'hebron',
      question: '헤브론에서 먼저 다윗을 왕으로 세운 사람들은 누구였을까?',
      choices: [
        { id: 'judah', label: '유다 사람들', sub: '헤브론 · 첫 번째 만남', ref: '삼하 2:4', icon: 'horn', ok: true },
        { id: 'elders', label: '이스라엘의 장로들', sub: '헤브론 · 나중 만남', ref: '삼하 5:3', icon: 'person', detour: 'hebron-elders' }
      ],
      discovery: '먼저 유다 사람들이 다윗을 유다의 왕으로, 그 뒤 이스라엘의 장로들이 이스라엘의 왕으로 세웠어.',
      journalRef: '삼하 2:1–4, 5:1–5',
      reviewRequired: false,
      reviewState: '목회자 감수 전'
    },
    {
      id: 'D06',
      group: 'main',
      tier: '8~10세 (t1)',
      title: '다윗 성으로 온 궤',
      ref: '삼하 6:12–15, 17–19',
      place: '다윗 성',
      art: 'D06',
      teamNote: '『탐험대 이야기』 최온: "청색 천으로 덮인 궤가 다윗 성으로 들어오고 있어." · 휴: "삼하 6:17에서 궤를 어디에 두었는지 따라가 보자."',
      artNote: '그림 참고: 궤의 청색 덮개는 민수기 4:5–6에 근거해 그렸어요.',
      mode: 'ark',
      question: '행렬이 다윗 성으로 메고 온 것은 무엇일까?',
      choices: [
        { id: 'ark', label: '하나님의 궤', sub: '행렬이 메고 온 궤', ref: '삼하 6:12–13', icon: 'ark', ok: true },
        { id: 'brook-stones', label: '시냇가의 돌', sub: '시냇가에서 고른 돌', ref: '삼상 17:40', icon: 'stone', detour: 'brook-stones' }
      ],
      discovery: '행렬이 하나님의 궤를 다윗 성으로 메고 왔고, 다윗이 마련한 장막 안에 두었어.',
      journalRef: '삼하 6:12–15, 17–19',
      reviewRequired: true,
      reviewState: '목회자 감수 전',
      pastorNote: '삼하 6:6–7(웃사 사건과 하나님의 거룩하심)을 건너뛰고 12절부터 읽는 범위 선택 및 청색 덮개(민 4:5–6) 표현에 대한 목회자 감수 필수.'
    },
    {
      id: 'D07',
      group: 'main',
      tier: '8~10세 (t1)',
      title: '왕의 식탁',
      ref: '삼하 9:1, 6–7, 10–13',
      place: '예루살렘 왕궁',
      art: 'D07',
      teamNote: '『탐험대 이야기』 휴: "접힌 수첩 양쪽 날개에 단서가 하나씩 적혀 있어." · 온우: "삼하 9:6–13을 펴서 두 단서를 이어 보자."',
      question: '다윗의 식탁에서 늘 함께 먹게 된 사람은 누구였을까?',
      choices: [
        { id: 'mephibosheth', label: '요나단의 아들 므비보셋', sub: '다윗이 불러 식탁에서 함께 먹은 사람', ref: '삼하 9:7, 13', icon: 'table', ok: true },
        { id: 'jonathan', label: '요나단', sub: '다윗에게 겉옷을 주었던 친구', ref: '삼상 18:4', icon: 'robe', detour: 'jonathan-robe' }
      ],
      discovery: '다윗은 친구 요나단 때문에 그의 아들을 늘 식탁에서 함께 먹게 했어.',
      journalRef: '삼하 9:1, 6–7, 10–13',
      reviewRequired: false,
      reviewState: '목회자 감수 전'
    },
    {
      id: 'D08',
      group: 'extra',
      tier: '8~10세 (t1)',
      title: '베들레헴 성문 곁 우물',
      ref: '삼하 23:13–17',
      place: '아둘람 굴 (다윗이 있던 산성)',
      art: 'D08',
      teamNote: '『탐험대 이야기』 최온: "세 사람이 길어 온 우물물이야." · 온우: "삼하 23:13–17에서 다윗이 어디에 있었고 그 물을 어떻게 했는지 찾아보자."',
      question: '세 사람이 다윗에게 가져온 것은 무엇일까?',
      choices: [
        { id: 'well-water', label: '우물물', sub: '베들레헴 성문 곁 우물에서 길어 온 물', ref: '삼하 23:15–16', icon: 'water', ok: true },
        { id: 'brook-stones', label: '시냇가의 돌', sub: '시냇가에서 고른 돌', ref: '삼상 17:40', icon: 'stone', detour: 'brook-stones' }
      ],
      discovery: '세 사람이 베들레헴 성문 곁 우물물을 가져왔고, 다윗은 그 물을 마시지 않고 여호와께 바쳐 쏟았어.',
      journalRef: '삼하 23:13–17',
      reviewRequired: true,
      reviewState: '목회자 감수 전',
      pastorNote: '삼하 23:16–17에서 다윗이 물을 여호와께 바쳐 쏟은 이유(생명을 걸고 간 사람들의 피와 같다는 비유)를 부모·교사가 함께 설명하도록 목회자 감수 필수.'
    },
    {
      id: 'D09',
      group: 'extra',
      tier: '8~10세 (t1)',
      title: '성전을 위해 드린 예물',
      ref: '대상 29:6–9',
      place: '예루살렘',
      art: 'D09',
      teamNote: '『탐험대 이야기』 최온: "성전을 위해 가져온 예물들이 모였어!" · 온우: "대상 29:6–9를 펴서 무엇을 드렸는지 확인해 보자."',
      question: '지도자들이 기쁜 마음으로 가져온 것은 무엇일까?',
      choices: [
        { id: 'gold-silver', label: '금과 은', sub: '성전을 위해 기쁜 마음으로 드린 예물', ref: '대상 29:6–7', icon: 'gold', ok: true },
        { id: 'brook-stones', label: '시냇가의 돌', sub: '시냇가에서 고른 돌', ref: '삼상 17:40', icon: 'stone', detour: 'brook-stones' }
      ],
      discovery: '지도자들이 기쁜 마음으로 금과 은을 드렸어. 9절에서 백성이 기뻐한 모습도 찾아보자.',
      journalRef: '대상 29:6–9',
      reviewRequired: false,
      reviewState: '목회자 감수 전'
    }
  ];

  window.BO_DAVID.data = {
    supplements: SUPPLEMENTS,
    scenes: SCENES
  };
})();
