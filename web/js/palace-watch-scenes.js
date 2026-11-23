/* 탐험대의 관찰 질문과 사진 좌표. 성경의 전후 기록은 왕궁의 검토된 대목을 가리킨다. */
(function () {
  'use strict';
  const clue = (x, y, name, note) => ({x, y, name, note});
  const record = (beat, photo) => ({beat, photo});
  BO.palaceWatchScenes = [
    {
      photo:'jar', place:'나일강가', ref:'출 7:20–24', call:'강가에 물을 뜨러 온 사람들을 봐. 무엇을 일지에 남길까?',
      clues:[clue(23,59,'기울인 물항아리','항아리를 기울였는데 잔에 물줄기가 보이지 않아.'), clue(86,56,'붉게 변한 강물','사람들 뒤로 흐르는 강물의 빛깔을 기록했어.')],
      question:'강물이 변한 뒤, 바로는 모세와 아론의 말을 들었을까?', guesses:['귀를 기울였을 것 같아','여전히 듣지 않았을 것 같아'],
      before:record(2,'audience'), after:record(6,'throne')
    },
    {
      photo:'kitchen', place:'집 안의 화덕', ref:'출 8:3–6', call:'개구리가 어디까지 들어왔는지 같이 찾아보자.',
      clues:[clue(39,85,'반죽판 위의 개구리','반죽을 놓는 판에 개구리가 올라와 있어.'), clue(89,41,'화덕 앞의 개구리','빵을 굽는 화덕 앞까지 개구리가 왔어.')],
      question:'바로가 기도를 부탁하며 한 약속은 어떻게 됐을까?', guesses:['약속을 지켰을 것 같아','마음을 바꿨을 것 같아'],
      before:record(2,'plea'), after:record(5,'turned')
    },
    {
      photo:'shepherd', place:'목자의 우리', ref:'출 8:16–19', call:'목자 곁에서 살펴보자. 누가 이 작은 벌레로 힘들어했을까?',
      clues:[clue(35,46,'어깨를 긁는 목자','목자가 일을 멈추고 어깨에 손을 댔어.'), clue(80,57,'몸을 비비는 염소','목자 옆의 염소도 고개를 들어 몸을 비비고 있어.')],
      question:'요술사들도 이를 생기게 할 수 있었을까?', guesses:['이번에도 해냈을 것 같아','이번에는 못 했을 것 같아'],
      before:record(0,'shepherd'), after:record(1,'magicians')
    },
    {
      photo:'covered', place:'가족의 식탁', ref:'출 8:20–24', call:'파리 떼가 들어온 집이야. 가족이 무엇을 하는지 살펴봐.',
      clues:[clue(42,68,'음식을 덮는 천','식탁 위 음식을 지키려고 천을 덮고 있어.'), clue(61,40,'파리를 쫓는 손','식탁 가까이에서 파리를 쫓아내는 모습이 보여.')],
      question:'파리 떼가 떠난 뒤, 백성은 광야로 떠났을까?', guesses:['떠났을 것 같아','더 기다렸을 것 같아'],
      before:record(2,'court'), after:record(4,'refusal')
    },
    {
      photo:'halter', place:'비어 있는 우리', ref:'출 9:5–7', call:'가축을 돌보던 사람 손에 무엇이 남았는지 보자.',
      clues:[clue(34,74,'주인 손에 남은 고삐','주인은 고삐를 쥐고 있는데 그 끝에 가축이 없어.'), clue(72,50,'비어 있는 울타리 안','울타리 안에 있어야 할 가축이 보이지 않아.')],
      question:'바로가 이스라엘 쪽 가축을 확인하면 어떤 소식이 돌아올까?', guesses:['그곳도 가축을 잃었을 것 같아','그곳 가축은 살아 있을 것 같아'],
      before:record(0,'halter'), after:record(2,'cattle')
    },
    {
      photo:'workshop', place:'일을 멈춘 작업장', ref:'출 9:8–12', call:'잠깐, 여기는 왜 이렇게 조용할까? 멈춘 일의 흔적을 찾아봐.',
      clues:[clue(66,54,'팔을 감싸 쥔 사람','하던 일을 멈추고 한쪽 팔을 감싸고 있어.'), clue(83,80,'내려놓은 연장','작업대에 연장이 놓인 채로 남아 있어.')],
      question:'이 일이 있고 나서 바로는 모세와 아론의 말을 들었을까?', guesses:['들었을 것 같아','듣지 않았을 것 같아'],
      before:record(0,'workshop'), after:record(1,'refusal')
    },
    {
      photo:'barley', place:'우박이 지나간 자리', ref:'출 9:25, 31–32', call:'우박 소리가 멎었어. 밭에는 무슨 흔적이 남았을까?',
      clues:[clue(39,17,'꺾인 보리 이삭','줄기가 꺾여 이삭이 땅에 닿았어.'), clue(22,78,'흙 위의 우박 알갱이','흰 알갱이 옆에 보리가 쓰러져 있어. 두 가지를 함께 그렸어.')],
      question:'우박이 그치면 바로가 백성을 보내 주겠다는 약속을 지킬까?', guesses:['이번에는 보낼 것 같아','또 붙잡을 것 같아'],
      before:record(2,'plea'), after:record(4,'clearfield')
    },
    {
      photo:'twig', place:'메뚜기가 지나간 밭', ref:'출 10:12–15', call:'우박 뒤에 남아 있던 것들은 어떻게 됐을까? 밭을 들여다봐.',
      clues:[clue(57,32,'잎이 사라진 줄기','손에 든 줄기에 푸른 잎이 거의 보이지 않아.'), clue(58,81,'빈 수확 바구니','바구니 안에 담긴 열매가 보이지 않아.')],
      question:'서풍이 불어 메뚜기가 떠나면 백성도 떠나게 될까?', guesses:['백성도 떠날 것 같아','백성은 남게 될 것 같아'],
      before:record(2,'throne'), after:record(4,'wind')
    },
    {
      photo:'darkroom', place:'빛이 사라진 방', ref:'출 10:21–23', call:'어둠 속에서 잠시 눈을 익혀 봐. 방 안에 누가 보이니?',
      clues:[clue(34,61,'웅크리고 앉은 아이','아이가 무릎을 세운 채 앉아 있어.'), clue(83,57,'벽에 기댄 사람','가까이에 다른 사람이 있는데도 서로 바라보지 못해.')],
      question:'가축까지 데려가야 한다는 모세의 대답을 듣고 바로는 어떻게 했을까?', guesses:['가축도 데려가게 했을 것 같아','백성을 보내지 않았을 것 같아'],
      before:record(1,'flock'), after:record(3,'refusal')
    },
    {
      photo:'road', place:'애굽을 떠나는 길', ref:'출 12:31–32, 37–38', call:'가족들이 함께 길을 나섰어. 조용히 그 길을 지켜보자.',
      clues:[clue(20,64,'사람들 곁의 가축','행렬 옆에서 가축들도 같은 길을 걷고 있어.'), clue(63,78,'어른과 함께 걷는 아이들','어른들 사이에 작은 발걸음들이 보여.')],
      question:'앞서 남자들만 가라고 했던 바로가 마지막 밤에는 누구를 보내라고 했을까?', guesses:['어른들만 떠나라고 했을 것 같아','백성과 가축 모두 떠나라고 했을 것 같아'],
      before:record(2,'release'), after:record(4,'road')
    }
  ];
})();
