/* EX-06~08 감수용 탐험. 본문 사실과 장절은 docs/01_출애굽기_장면목록.md에서 가져온다. */
(function () {
  'use strict';
  var app = BO.app2d, el = app.el;
  var plagues = [
    ['물이 피가 됨', '출 7:14-25', '강물이 변해 물고기가 죽고 강물을 마실 수 없게 되었어요.'],
    ['개구리', '출 8:1-15', '강에서 올라온 동물이 집과 침실, 반죽 그릇까지 들어갔어요.'],
    ['이', '출 8:16-19', '땅의 티끌이 작은 벌레가 되어 사람과 가축에게 붙었어요. 요술사들은 같은 일을 할 수 없었어요.'],
    ['파리', '출 8:20-32', '벌레 떼가 애굽 사람들의 집에 가득했어요. 이스라엘 백성이 사는 고센 땅은 구별되었어요.'],
    ['가축의 돌림병', '출 9:1-7', '들에 있던 애굽의 가축에게 병이 닥쳤어요. 이스라엘 자손의 가축은 하나도 죽지 않았어요.'],
    ['악성 종기', '출 9:8-12', '화덕의 재를 날린 뒤 사람과 가축의 피부에 종기가 생겼어요.'],
    ['우박', '출 9:13-35', '하늘에서 얼음덩이가 내렸어요. 경고를 들은 바로의 신하들 가운데 종과 가축을 집으로 피하게 한 이들도 있었어요.'],
    ['메뚜기', '출 10:1-20', '동풍에 실려 온 곤충 떼가 우박 뒤에 남은 밭의 식물을 먹었어요.'],
    ['흑암', '출 10:21-29', '사흘 동안 애굽에 어둠이 덮였지만 이스라엘 자손이 사는 곳에는 빛이 있었어요.']
  ];
  // EX-06에서 자세히 관찰할 세 사건. 장소별 설명은 일지의 요약과 별개로 보여 준다.
  var lookouts = {
    0: [
      ['강물', '출 7:20-21', '나일강 물이 피로 변했어요. 사람들은 강물을 마실 수 없었어요.', 'ex06-bank', 'water'],
      ['강가', '출 7:24', '애굽 사람들은 마실 물을 찾으려고 강 둘레를 팠어요.', 'ex06-bank', 'shore']
    ],
    3: [
      ['애굽의 집', '출 8:24', '바로의 궁과 신하들의 집에 파리 떼가 가득했어요.', 'ex08-door', 'flies'],
      ['고센 땅', '출 8:22-23', '하나님은 자기 백성이 머무는 고센 땅에는 파리 떼가 없을 것이라고 하셨어요.', 'ex06-bank', 'clear']
    ],
    8: [
      ['애굽 땅', '출 10:22-23', '사흘 동안 어둠이 덮여 사람들이 서로 볼 수 없었어요.', 'ex08-door', 'dark'],
      ['이스라엘 자손이 사는 곳', '출 10:23', '같은 때에 이스라엘 자손이 사는 곳에는 빛이 있었어요.', 'ex07-table', 'light']
    ]
  };
  var shortViews = [
    null, ['ex07-table', 'table'], ['ex06-bank', 'shore'], null,
    ['ex06-bank', 'clear'], ['ex08-door', 'clear'], ['ex06-bank', 'storm'],
    ['ex06-bank', 'field'], null
  ];
  var preparation = [
    ['문', '출 12:3-7, 12-13', '가족마다 어린 양을 준비했어요. 이스라엘 백성은 그 피를 문 양옆의 기둥과 위쪽 가로대에 발랐어요. 하나님은 그 표가 있는 집을 지나가겠다고 하셨어요.'],
    ['식탁', '출 12:8', '그 밤에 불에 구운 고기를 무교병과 쓴 나물과 함께 먹었어요. 무교병은 누룩을 넣지 않은 빵이에요.'],
    ['떠날 차림', '출 12:11, 27-28', '허리띠를 띠고 신을 신고 손에 지팡이를 들도록 하셨어요. 백성은 하나님이 모세와 아론에게 명령하신 대로 행했어요.']
  ];
  var nightfall = '그날 밤 애굽의 처음 난 자들과 가축의 처음 난 것들이 죽었어요. 애굽 사람들은 크게 울었어요.';
  var summons = '바로는 밤에 모세와 아론을 불러 이스라엘 백성에게 양과 소를 데리고 떠나라고 했어요.';
  var night = ['열 번째 재앙', '출 12:29-32', nightfall + ' ' + summons];
  var departure = ['애굽을 떠나다', '출 12:34-39', '백성은 아직 부풀지 않은 반죽을 싸서 멨어요. 아이들과 여러 무리, 양과 소도 함께 라암셋을 떠나 숙곳으로 갔어요.'];
  var end = 12;
  function valid(s) {
    return s && Number.isInteger(s.step) && s.step >= 0 && s.step <= end &&
      Number.isInteger(s.seen) && s.seen >= 0 && s.seen <= 7;
  }
  function completed() { var s = app.state.passover; return valid(s) && (s.step === end || s.recorded === true); }
  function button(label, action, cls) {
    return el('button', {class: cls || 'btn onpaper', on: {click: action}}, label);
  }
  function record(row) {
    return el('details', {class:'po-record'}, el('summary', {}, row[0]), app.refChip(row[1]), el('p', {}, row[2]));
  }
  function open(back, returnTo, readOnly) {
    returnTo = returnTo || '시간표';
    var s = app.state.passover;
    if (!valid(s)) s = app.state.passover = {step:0, seen:0};
    if (!readOnly) { s.active = true; app.save(); }
    function leave() {
      if (!readOnly) { s.active = false; app.save(); }
      back();
    }
    function replay() {
      s = app.state.passover = {step:0, seen:0, recorded:true, active:true};
      app.save(); render(true);
    }
    function advance() { s.step++; delete s.matched; delete s.observed; delete s.lookingAt; delete s.summons; app.save(); render(true); }
    function render(focus) {
      var step = readOnly ? end : s.step, river = step < 9, meal = step === 9;
      var art = river ? 'ex06-bank' : meal ? 'ex07-table' : 'ex08-door';
      var chapter = river ? '아홉 가지 재앙' : meal ? '유월절을 준비하다' : step < end ? '그 밤, 애굽에서 나오다' : '탐험 기록';
      var h = el('h2', {tabindex:'-1'}, chapter), body = el('div', {class:'po-body'}), foot = [];
      var picture = el('div', {class:'po-picture'}, app.pic(art, '', ''));
      var land = el('div', {class:'po-land'}, picture,
        el('div', {class:'po-title'}, el('small', {}, river ? '출애굽기 7–10장' : '출애굽기 11–12장'), h));
      function setView(key, appearance) {
        if (key !== art) { art = key; picture.replaceChildren(app.pic(key, '', '')); }
        land.dataset.view = appearance;
      }
      if (river) {
        var row = plagues[step], spots = lookouts[step];
        body.append(el('h3', {}, (step + 1) + '번째 재앙 · ' + row[0]));
        var nextPlague = button(step === 8 ? '유월절을 준비하는 집으로' : '다음 재앙 살펴보기', advance);
        foot.push(nextPlague);
        if (spots) {
          // 이전 판에서 이미 이름을 맞힌 기록도 다음 장면으로 곧바로 이어진다.
          var seen = s.matched === true ? 3 : (s.observed & 3);
          var evidence = el('div', {class:'po-detail', role:'status'});
          var choices = el('div', {class:'po-spots', role:'group', 'aria-label':'관찰할 곳'});
          function showSpot(i) {
            var spot = spots[i];
            setView(spot[3], spot[4]);
            Array.from(choices.children).forEach(function (control, j) {
              control.setAttribute('aria-pressed', String(j === i));
              control.textContent = (seen & (1 << j) ? '✓ ' : '') + spots[j][0];
            });
            evidence.replaceChildren(el('b', {}, spot[0]), app.refChip(spot[1]), el('p', {}, spot[2]));
            nextPlague.disabled = seen !== 3;
          }
          spots.forEach(function (spot, i) {
            var control = button(spot[0], function () {
              seen |= 1 << i; s.observed = seen; s.lookingAt = i; app.save();
              showSpot(i);
            }, 'opt po-spot');
            control.setAttribute('aria-pressed', 'false');
            choices.append(control);
          });
          body.append(el('p', {}, '두 곳을 눌러 그곳에서 어떤 일이 있었는지 살펴보세요.'), choices, evidence);
          nextPlague.disabled = seen !== 3;
          if (seen) {
            var lastSpot = seen === 2 || (seen === 3 && s.lookingAt === 1) ? 1 : 0;
            showSpot(lastSpot);
          } else setView(spots[0][3], 'overview');
        } else {
          setView(shortViews[step][0], shortViews[step][1]);
          body.append(app.refChip(row[1]), el('p', {}, row[2]));
        }
      } else if (meal) {
        body.append(el('p', {}, '마지막 재앙이 예고되었어요. 그 밤이 오기 전, 이스라엘 가정이 어떻게 준비했는지 세 가지 단서를 살펴보세요.'), app.refChip('출 11:1, 12:1-13'));
        var note = el('div', {class:'po-detail', role:'status'});
        var next = button('그 밤의 기록으로', advance);
        next.disabled = s.seen !== 7;
        preparation.forEach(function (row, i) {
          var mark = 1 << i;
          var item = button((s.seen & mark ? '✓ ' : '') + row[0], function () {
            s.seen |= mark; app.save(); item.textContent = '✓ ' + row[0];
            note.replaceChildren(el('b', {}, row[0]), app.refChip(row[1]), el('p', {}, row[2]));
            next.disabled = s.seen !== 7;
          }, 'opt');
          body.append(item);
        });
        body.append(note); foot.push(next);
      } else if (step === 10) {
        body.append(el('h3', {}, night[0]), app.refChip('출 12:29-30'), el('p', {}, nightfall));
        if (s.summons === true) {
          body.append(el('h3', {class:'po-summons', tabindex:'-1'}, '바로의 부름'), app.refChip('출 12:31-32'), el('p', {}, summons));
          foot.push(button('떠나는 길 살펴보기', advance));
        } else {
          foot.push(button('바로의 소식 읽기', function () {
            s.summons = true; app.save(); render(false);
            document.querySelector('.po-summons').focus();
          }));
        }
      } else if (step === 11) {
        body.append(el('h3', {}, departure[0]), el('p', {}, departure[2]), app.refChip(departure[1]));
        foot.push(button('탐험 기록 모아보기', advance));
      } else {
        body.append(el('h3', {}, '열 가지 재앙과 유월절'), el('p', {}, '이름을 눌러 그때의 기록과 장절을 다시 읽어 보세요.'));
        plagues.concat(preparation, [night, departure]).forEach(function (row) { body.append(record(row)); });
        if (!readOnly) body.append(button('처음부터 다시 둘러보기', replay));
        foot.push(button(returnTo + '로 돌아가기', leave));
      }
      app.show(el('div', {class:'screen po-screen'},
        el('div', {class:'page-head pad'}, button('← ' + returnTo, leave, 'pillbtn'), el('span', {}, '감수용 미리보기')),
        el('main', {class:'po-scroll'}, land, body),
        foot.length ? el('div', {class:'sheet-foot pad'}, foot) : null));
      if (focus) h.focus({preventScroll:true});
    }
    render(false);
  }
  app.passover = {open:open, completed:completed, resuming:function () {
    return valid(app.state.passover) && app.state.passover.active === true;
  }};
})();
