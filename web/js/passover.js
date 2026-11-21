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
  var preparation = [
    ['문', '출 12:3-7, 12-13', '가족마다 어린 양을 준비했어요. 이스라엘 백성은 그 피를 문 양옆의 기둥과 위쪽 가로대에 발랐어요. 하나님은 그 표가 있는 집을 지나가겠다고 하셨어요.'],
    ['식탁', '출 12:8', '그 밤에 불에 구운 고기를 무교병과 쓴 나물과 함께 먹었어요. 무교병은 누룩을 넣지 않은 빵이에요.'],
    ['떠날 차림', '출 12:11, 27-28', '허리띠를 띠고 신을 신고 손에 지팡이를 들도록 하셨어요. 백성은 하나님이 모세와 아론에게 명령하신 대로 행했어요.']
  ];
  var night = ['열 번째 재앙', '출 12:29-32', '그날 밤 애굽의 처음 난 자들이 죽고 온 땅에 큰 슬픔이 있었어요. 바로는 모세와 아론을 불러 이스라엘 백성에게 떠나라고 했어요.'];
  var departure = ['애굽을 떠나다', '출 12:34-39', '백성은 아직 부풀지 않은 반죽을 싸서 멨어요. 아이들과 여러 무리, 양과 소도 함께 라암셋을 떠나 숙곳으로 갔어요.'];
  var end = 12;
  function valid(s) {
    return s && Number.isInteger(s.step) && s.step >= 0 && s.step <= end &&
      Number.isInteger(s.seen) && s.seen >= 0 && s.seen <= 7;
  }
  function completed() { var s = app.state.passover; return valid(s) && s.step === end; }
  function button(label, action, cls) {
    return el('button', {class: cls || 'btn onpaper', on: {click: action}}, label);
  }
  function record(row) {
    return el('details', {class:'po-record'}, el('summary', {}, row[0]), app.refChip(row[1]), el('p', {}, row[2]));
  }
  function open(back, returnTo) {
    returnTo = returnTo || '시간표';
    var s = app.state.passover;
    if (!valid(s)) s = app.state.passover = {step:0, seen:0};
    s.active = true; app.save();
    function leave() { s.active = false; app.save(); back(); }
    function advance() { s.step++; delete s.matched; app.save(); render(true); }
    function render(focus) {
      var step = s.step, river = step < 9, meal = step === 9;
      var art = river ? 'ex06-bank' : meal ? 'ex07-table' : 'ex08-door';
      var chapter = river ? '아홉 가지 재앙' : meal ? '유월절을 준비하다' : step < end ? '그 밤, 애굽에서 나오다' : '탐험 기록';
      var h = el('h2', {tabindex:'-1'}, chapter), body = el('div', {class:'po-body'}), foot = [];
      if (river) {
        var row = plagues[step], matched = s.matched === true;
        body.append(el('h3', {}, (step + 1) + '번째 재앙'), el('p', {}, row[2]), app.refChip(row[1]));
        if (matched) {
          body.append(el('p', {class:'po-match'}, '찾은 기록 · ' + row[0]));
          foot.push(button(step === 8 ? '유월절을 준비하는 집으로' : '다음 재앙 살펴보기', advance));
        } else {
          var status = el('p', {class:'po-hint', role:'status'}, '이 단서와 맞는 재앙을 고르세요.');
          body.append(status, el('details', {class:'po-record'}, el('summary', {}, '이름 먼저 확인하기'), el('p', {}, row[0])));
          var start = step - step % 3;
          [2,0,1].forEach(function (offset) {
            var index = start + offset;
            var option = button(plagues[index][0], function () {
              if (index === step) { s.matched = true; app.save(); render(true); }
              else { status.textContent = '단서를 다시 읽거나 성경에서 ' + row[1] + '을 찾아보세요.'; option.disabled = true; }
            }, 'opt');
            body.append(option);
          });
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
      } else if (step < end) {
        var event = step === 10 ? night : departure;
        body.append(el('h3', {}, event[0]), el('p', {}, event[2]), app.refChip(event[1]));
        foot.push(button(step === 10 ? '떠나는 길 살펴보기' : '탐험 기록 모아보기', advance));
      } else {
        body.append(el('h3', {}, '열 가지 재앙과 유월절'), el('p', {}, '이름을 눌러 그때의 기록과 장절을 다시 읽어 보세요.'));
        plagues.concat(preparation, [night, departure]).forEach(function (row) { body.append(record(row)); });
        foot.push(button(returnTo + '로 돌아가기', leave));
      }
      app.show(el('div', {class:'screen po-screen'},
        el('div', {class:'page-head pad'}, button('← ' + returnTo, leave, 'pillbtn'), el('span', {}, '감수용 미리보기')),
        el('main', {class:'po-scroll'}, el('div', {class:'po-land'}, app.pic(art, '', ''),
          el('div', {class:'po-title'}, el('small', {}, river ? '출애굽기 7–10장' : '출애굽기 11–12장'), h)), body),
        foot.length ? el('div', {class:'sheet-foot pad'}, foot) : null));
      if (focus) h.focus({preventScroll:true});
    }
    render(false);
  }
  app.passover = {open:open, completed:completed, resuming:function () {
    return valid(app.state.passover) && app.state.passover.active === true;
  }};
})();
