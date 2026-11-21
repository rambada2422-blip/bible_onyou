/* EX-06~08 감수용 탐험. 본문 사실과 장절은 docs/01_출애굽기_장면목록.md에서 가져온다. */
(function () {
  'use strict';
  var app = BO.app2d, el = app.el;
  var plagues = [
    ['물이 피가 됨', '출 7:14-25', '강물이 변해 물고기가 죽고 강물을 마실 수 없게 되었어요.'],
    ['개구리', '출 8:1-15', '강에서 올라온 동물이 애굽 땅을 덮었어요. 집과 마당과 밭에도 있었어요.'],
    ['이', '출 8:16-19', '땅의 티끌이 작은 벌레가 되어 사람과 가축에게 붙었어요. 요술사들은 같은 일을 할 수 없었어요.'],
    ['파리', '출 8:20-32', '벌레 떼가 애굽 사람들의 집에 가득했어요. 이스라엘 백성이 사는 고센 땅은 구별되었어요.'],
    ['가축의 돌림병', '출 9:1-7', '들에 있던 애굽의 가축은 심한 돌림병으로 죽었어요. 이스라엘 자손의 가축은 하나도 죽지 않았어요.'],
    ['악성 종기', '출 9:8-12', '화덕의 재를 날린 뒤 사람과 가축의 피부에 종기가 생겼어요.'],
    ['우박', '출 9:18-26', '하늘에서 무거운 우박이 내렸어요. 바로의 신하 가운데 여호와의 말씀을 두려워한 이들은 종과 가축을 집으로 피하게 했어요. 이스라엘 자손이 있는 고센 땅에는 우박이 없었어요.'],
    ['메뚜기', '출 10:1-20', '동풍에 실려 온 곤충 떼가 우박 뒤에 남은 밭의 식물을 먹었어요.'],
    ['흑암', '출 10:21-29', '사흘 동안 애굽에 어둠이 덮였지만 이스라엘 자손이 사는 곳에는 빛이 있었어요.']
  ];
  // EX-06에서 자세히 관찰할 세 사건. 장소별 설명은 일지의 요약과 별개로 보여 준다.
  var lookouts = {
    0: [
      {place:'강물', ref:'출 7:20-21', text:'나일강 물이 피로 변했어요. 사람들은 강물을 마실 수 없었어요.',
        art:'plague-water', alt:'검붉은 강물에 떠 있는 물고기', guide:'강물 색이 어떻게 달라졌는지, 물고기는 어떻게 되었는지 찾아보세요.'},
      {place:'강가', ref:'출 7:24', text:'애굽 사람들은 마실 물을 찾으려고 강 둘레를 팠어요.',
        art:'plague-digging', alt:'강가에 몸을 굽히고 땅을 파는 사람들', guide:'강물을 마실 수 없게 된 사람들이 강가에서 무엇을 하는지 찾아보세요.'}
    ],
    3: [
      {place:'애굽의 집', ref:'출 8:21, 24', text:'바로의 궁과 신하들의 집에 파리 떼가 가득했어요.',
        art:'plague-flies', alt:'집과 그 너머 궁 둘레에 몰린 파리 떼', guide:'파리 떼가 어디에 가득한지 찾아보세요.'},
      {place:'고센 땅', ref:'출 8:22-24', text:'하나님은 자기 백성이 머무는 고센 땅에는 파리 떼가 없을 것이라고 하셨어요.',
        art:'plague-goshen', alt:'파리 떼가 없는 고센의 집들과 밭', guide:'하나님이 구별하신 고센 땅에도 파리 떼가 있는지 살펴보세요.'}
    ],
    8: [
      {place:'애굽 땅', ref:'출 10:22-23', text:'사흘 동안 어둠이 덮여 사람들이 서로 볼 수 없었어요.',
        art:'plague-darkness', alt:'불빛도 사람도 보이지 않는 어두운 골목', guide:'애굽 땅에서는 사람들이 서로 볼 수 있는지 살펴보세요.'},
      {place:'이스라엘 자손이 사는 곳', ref:'출 10:23', text:'같은 때에 이스라엘 자손이 사는 곳에는 빛이 있었어요.',
        art:'plague-light', alt:'집들 사이가 환한 빈 골목', guide:'같은 때에 이스라엘 자손이 사는 곳은 어떤지 살펴보세요.'}
    ]
  };
  var shortViews = [
    null, 'plague-frogs', 'plague-dust', null, 'plague-yard', 'plague-kiln',
    'plague-hail', 'plague-locusts', null
  ];
  var acts = ['강과 땅', '애굽과 고센', '하늘과 어둠'];
  var findings = [
    ['요술사들도 같은 일을 했어요.', '출 7:22'],
    ['개구리가 사라지자 바로는 백성을 보내겠다는 약속을 거두었어요.', '출 8:8, 15'],
    ['요술사들은 바로에게 이것이 하나님의 권능이라고 말했어요.', '출 8:19'],
    ['바로는 광야로 가더라도 너무 멀리 가지 말라고 했어요.', '출 8:28'],
    ['바로는 사람을 보내 이스라엘의 가축이 살아 있는지 확인했어요.', '출 9:7'],
    ['요술사들도 종기 때문에 모세 앞에 설 수 없었어요.', '출 9:11'],
    ['우박이 그치자 바로는 또다시 백성을 보내지 않았어요.', '출 9:34-35'],
    ['서풍이 불어 메뚜기 떼를 홍해로 몰아냈어요.', '출 10:19'],
    ['바로는 가축을 두고 가라 했지만, 모세는 가축도 함께 가야 한다고 했어요.', '출 10:24-26']
  ];
  var preparation = [
    ['문', '출 12:3-7, 13, 23, 28', '가족마다 어린 양을 준비했어요. 그 피를 문 양옆 기둥과 위쪽 가로대에 발랐어요. 하나님은 그 피를 보시면 그 집을 넘어가겠다고 하셨어요.'],
    ['식탁', '출 12:8-9', '그 밤에 불에 구운 고기를 무교병과 쓴 나물과 함께 먹었어요. 무교병은 누룩을 넣지 않은 빵이에요.'],
    ['떠날 차림', '출 12:11, 27-28', '허리띠를 띠고 신을 신고 손에 지팡이를 들도록 하셨어요. 백성은 하나님이 모세와 아론에게 명령하신 대로 행했어요.']
  ];
  var nightfall = '그날 밤 애굽의 처음 난 자들과 가축의 처음 난 것들이 죽었어요. 피를 바른 이스라엘 자손의 집에는 재앙이 내려 멸하는 일이 없었어요. 애굽 사람들은 크게 울었어요.';
  var summons = '바로는 밤에 모세와 아론을 불러 이스라엘 백성에게 양과 소를 데리고 떠나라고 했어요.';
  var night = ['열 번째 재앙', '출 12:13, 23, 27, 29-32', nightfall + ' ' + summons];
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
  function showPlagueNotes(trigger, count) {
    var dialog = el('dialog', {class:'po-notes', 'aria-labelledby':'po-notes-title'});
    var close = button('탐험으로 돌아가기', function () { dialog.close(); });
    var list = el('div', {class:'po-note-list'});
    plagues.slice(0, count).forEach(function (row, i) {
      var entry = record(row);
      entry.setAttribute('name', 'po-open-note');
      entry.querySelector('summary').textContent = (i + 1) + '번째 · ' + row[0];
      entry.addEventListener('toggle', function () {
        if (!entry.open || entry.querySelector('.po-note-art')) return;
        var pictures = el('div', {class:'po-note-art'});
        if (lookouts[i]) {
          lookouts[i].forEach(function (spot) {
            pictures.append(el('figure', {}, app.pic(spot.art, '', spot.alt), el('figcaption', {}, spot.place)));
          });
        } else {
          pictures.append(app.pic(shortViews[i], '', row[0]));
        }
        entry.append(pictures);
      });
      list.prepend(entry);
    });
    var title = el('h2', {id:'po-notes-title', tabindex:'-1'}, '지금까지 본 재앙');
    dialog.append(title, list, close);
    trigger.closest('.po-screen').append(dialog);
    dialog.addEventListener('close', function () {
      dialog.remove();
      trigger.focus({preventScroll:true});
    }, {once:true});
    dialog.showModal();
    title.focus({preventScroll:true});
  }
  function exploreRoom(s, land, body, advance) {
    var positions = ['왼쪽', '가운데', '오른쪽'];
    var pins = el('div', {class:'po-pins', role:'group', 'aria-label':'그림 속 세 단서'});
    var chips = el('ul', {class:'po-chips', 'aria-label':'발견한 단서'});
    var detail = el('div', {class:'po-detail po-clue', role:'status'});
    var next = button('그 밤의 기록으로', advance);
    function reveal(i) {
      var found = 0;
      preparation.forEach(function (row, j) {
        var known = Boolean(s.seen & (1 << j)), pin = pins.children[j];
        if (known) found++;
        pin.textContent = known ? '✓' : '✦';
        pin.setAttribute('aria-label', known ? row[0] + ' 단서 다시 보기' : positions[j] + ' 단서 살펴보기');
        pin.setAttribute('aria-pressed', String(j === i));
        chips.children[j].textContent = known ? '✓ ' + row[0] : '미발견';
        chips.children[j].classList.toggle('found', known);
      });
      if (i >= 0) {
        var row = preparation[i];
        detail.replaceChildren(el('b', {}, row[0]), app.refChip(row[1]), el('p', {}, row[2]));
      } else {
        detail.textContent = '마지막 재앙이 예고되었어요. 그 밤 한밤중이 되기 전, 이스라엘 가정이 어떻게 준비했는지 세 가지 단서를 살펴보세요.';
      }
      next.disabled = found !== 3;
      next.textContent = found === 3 ? '그 밤의 기록으로' : '단서 ' + (3-found) + '개 더 찾아보세요 · ' + found + '/3';
    }
    preparation.forEach(function (_, i) {
      var pin = button('✦', function () {
        s.seen |= 1 << i; s.mealLook = i; app.save(); reveal(i);
      }, 'po-pin');
      pins.append(pin);
      chips.append(el('li'));
    });
    land.append(pins);
    body.append(chips, detail, next);
    var last = s.mealLook;
    if (!Number.isInteger(last) || last < 0 || last > 2 || !(s.seen & (1 << last))) {
      last = preparation.findIndex(function (_, i) { return s.seen & (1 << i); });
    }
    reveal(last);
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
      var spots = lookouts[step];
      var art = meal ? 'ex07-room' : step === 10 ? 'plague-midnight' : 'ex08-door';
      if (river) art = spots ? spots[0].art : shortViews[step];
      var act = Math.floor(step / 3);
      var chapter = river ? acts[act] : meal ? '유월절을 준비하다' : step < end ? '그 밤, 애굽에서 나오다' : '탐험 기록';
      var plagueTitle = river && (step + 1) + '번째 재앙 · ' + plagues[step][0];
      var caption = river ? '아홉 가지 재앙 · ' + ['첫째', '둘째', '셋째'][act] + ' 묶음' : '출애굽기 11–12장';
      if (spots) caption += ' · ' + chapter;
      var h = el('h2', {tabindex:'-1'}, spots ? plagueTitle : chapter);
      var body = el('div', {class:'po-body'}), foot = [];
      var picture = el('div', {class:'po-picture'}, spots ? null : app.pic(art, '', step === 10 ? '한밤중 사람이 없는 집의 닫힌 문' : ''));
      var land = el('div', {class:'po-land'}, spots ? null : picture,
        el('div', {class:'po-title'}, el('small', {}, caption), h));
      land.dataset.view = art;
      var availableNotes = meal ? plagues.length : 0;
      var notesButton = button('본 재앙 보기', function (event) {
        showPlagueNotes(event.currentTarget, availableNotes);
      }, 'pillbtn po-notes-toggle');
      notesButton.hidden = !availableNotes;
      if (river) {
        var row = plagues[step];
        land.dataset.act = String(act + 1);
        var segments = el('div', {class:'po-segments', 'aria-hidden':'true'});
        plagues.forEach(function () { segments.append(el('i')); });
        var count = el('strong'), trail = el('div', {class:'po-trail'}, segments, count);
        var finding = el('aside', {class:'po-finding'}, el('small', {}, '목격 기록'),
          el('p', {}, findings[step][0]), app.refChip(findings[step][1]));
        function markRecorded(done) {
          var total = step + (done ? 1 : 0);
          availableNotes = total;
          notesButton.hidden = !total;
          count.textContent = total + ' / 9 기록';
          Array.from(segments.children).forEach(function (cell, i) {
            cell.classList.toggle('filled', i < total);
            cell.classList.toggle('current', i === step);
          });
          finding.hidden = !done;
        }
        markRecorded(!spots);
        body.append(trail);
        if (!spots) body.append(el('h3', {}, plagueTitle));
        var nextPlague = button(step === 8 ? '유월절을 준비하는 집으로' : '다음 재앙 살펴보기', advance);
        foot.push(nextPlague);
        if (spots) {
          // 이전 판에서 이미 이름을 맞힌 기록도 다음 장면으로 곧바로 이어진다.
          var seen = s.matched === true ? 3 : (s.observed & 3);
          var evidence = el('div', {class:'po-detail', role:'status'}, app.refChip(row[1]), el('p', {}, row[2]));
          var choices = el('div', {class:'po-spots', role:'group', 'aria-label':'관찰할 곳', 'aria-describedby':'po-spot-hint'});
          var hint = el('p', {class:'po-spot-hint', id:'po-spot-hint'}, '먼저 살펴보고 싶은 그림을 눌러 보세요.');
          function showSpot(i) {
            var spot = spots[i];
            picture.replaceChildren(app.pic(spot.art, '', spot.alt));
            land.dataset.view = spot.art;
            Array.from(choices.children).forEach(function (control, j) {
              control.setAttribute('aria-pressed', String(j === i));
              control.querySelector('span').textContent = (seen & (1 << j) ? '✓ ' : '') + spots[j].place;
            });
            evidence.replaceChildren(el('b', {}, spot.place), app.refChip(spot.ref), el('p', {}, spot.text));
            if (app.state.tier === 't1') evidence.append(el('p', {class:'po-guide'}, spot.guide));
            hint.textContent = seen === 3 ? '두 곳을 살펴봤어요.' : '이제 ‘' + spots[1 - i].place + '’ 그림을 눌러 보세요.';
            evidence.append(picture);
            nextPlague.disabled = seen !== 3;
            markRecorded(seen === 3);
          }
          spots.forEach(function (spot, i) {
            var control = button(el('span', {}, spot.place), function () {
              seen |= 1 << i; s.observed = seen; s.lookingAt = i; app.save();
              showSpot(i);
            }, 'po-spot');
            control.prepend(app.pic(spot.art, '', ''));
            control.setAttribute('aria-pressed', 'false');
            choices.append(control);
          });
          land.append(el('div', {class:'po-places'}, hint, choices));
          body.append(evidence);
          nextPlague.disabled = seen !== 3;
          if (seen) {
            var lastSpot = seen === 2 || (seen === 3 && s.lookingAt === 1) ? 1 : 0;
            showSpot(lastSpot);
          }
        } else {
          body.append(app.refChip(row[1]), el('p', {}, row[2]));
        }
        if (app.state.tier !== 't1' || ![0, 2, 3, 7, 8].includes(step)) body.append(finding);
      } else if (meal) {
        exploreRoom(s, land, body, advance);
      } else if (step === 10) {
        body.append(el('h3', {}, night[0]), app.refChip('출 12:13, 23, 27, 29-30'), el('p', {}, nightfall));
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
        foot.push(button('탐험 기록 다시 읽기', advance));
      } else {
        body.append(el('h3', {}, '열 가지 재앙과 유월절'), el('p', {}, '이름을 눌러 그때의 기록과 장절을 다시 읽어 보세요.'));
        plagues.concat(preparation, [night, departure]).forEach(function (row) { body.append(record(row)); });
        if (!readOnly) body.append(button('처음부터 다시 둘러보기', replay));
        foot.push(button(returnTo + '로 돌아가기', leave));
      }
      var sceneClass = meal ? ' po-meal' : river ? ' po-river' : '';
      if (spots) sceneClass += ' po-compare';
      app.show(el('div', {class:'screen po-screen' + sceneClass},
        el('div', {class:'page-head pad'}, button('← ' + returnTo, leave, 'pillbtn'), notesButton, el('span', {}, '감수용 미리보기')),
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
