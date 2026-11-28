/* 사진 속 흔적, 아이의 예상, 검토된 성경 대목을 한 장의 탐험 일지에 연결한다. */
(function () {
  'use strict';
  const app = BO.app2d, el = app.el, scenes = BO.palaceWatchScenes;
  const people = BO.content.chars;
  const button = (label, action, css = '') => el('button', {type:'button', class:css, on:{click:action}}, label);
  const selected = value => value === 0 || value === 1;
  function team() {
    return el('span', {class:'watch-team'}, ...Object.keys(people).map(id =>
      el('span', {}, app.pic(id + '-avatar', '', ''), people[id].name)));
  }
  function attach(chapterNo, pause, listenButton, openBook, state) {
    const chapter = BO.palaceChapters[chapterNo], scene = scenes[chapterNo];
    const main = app.state.palace;
    if (!Array.isArray(main.watchNotes)) main.watchNotes = [];
    const notes = main.watchNotes;
    const note = notes[chapterNo] || {};
    function save() { notes[chapterNo] = note; app.save(); }
    function startStep() {
      if (note.done && selected(note.pick) && selected(note.guess)) return 'done';
      if (selected(note.guess) && selected(note.pick)) return 'compare';
      return selected(note.pick) ? 'picked' : 'field';
    }
    let step = startStep();
    const dialog = el('dialog', {class:'watch-dialog', 'aria-label':'탐험대 관찰 수첩'});
    const body = el('div', {class:'watch-body'});
    let film;
    function stopFilm() {
      if (!film) return;
      const player = film; film = null;
      player.pause(); player.removeAttribute('src'); player.load();
    }
    function filmControl(photo) {
      const label = '영상 함께 보기 · ' + chapter.seconds + '초';
      const status = el('span', {role:'status', class:'watch-help'});
      const toggle = button(label, () => {
        if (film) { stopFilm(); render(); return; }
        const player = el('video', {controls:true, playsinline:true, 'aria-label':chapter.title+' 영상'});
        film = player; photo.replaceChildren(player);
        toggle.textContent = '사진으로 돌아가기'; status.textContent = '';
        function restore(message) {
          if (player !== film) return;
          stopFilm(); render();
          if (message) body.append(el('p', {role:'status'}, message));
          body.querySelector('.watch-spot, .watch-film-control button')?.focus({preventScroll:true});
        }
        player.addEventListener('ended', () => restore('이제 사진에서 흔적을 살펴볼 수 있어.'));
        player.addEventListener('error', () => restore('영상을 불러오지 못했어요. 사진에서 계속 살펴볼 수 있어요.'));
        player.src = chapter.url;
        player.play().catch(() => { if (film === player) status.textContent = '영상의 재생 단추를 눌러 주세요.'; });
      });
      return el('div', {class:'watch-film-control'}, toggle, status);
    }
    const close = button('왕궁으로', () => dialog.close(), 'watch-close');
    const title = el('h2', {tabindex:'-1'});
    dialog.append(el('header', {class:'watch-head'}, el('div', {}, el('small', {}, '『탐험대 이야기』'), title, team()), close), body);
    const launch = button('', () => open('scene'), 'watch-launch');
    const journal = button('탐험 일지', () => open('journal'), 'watch-journal-btn');
    const label = el('b', {});
    launch.append(team(), label);
    function updateLauncher() {
      label.textContent = note.done ? '발견 다시 보기' : selected(note.pick) ? '관찰 이어가기' : '함께 관찰하기';
    }
    updateLauncher();
    dialog.addEventListener('close', () => { stopFilm(); pause(); delete state.watchView; app.save(); updateLauncher(); });
    function change(next) {
      step = next;
      state.watchView = next;
      app.save(); render(); title.focus({preventScroll:true}); dialog.scrollTop = 0;
    }
    function open(view) {
      if (!dialog.open) dialog.showModal();
      pause();
      change(view === 'scene' ? startStep() : view);
    }
    function picture(key, description) {
      const images = BO.palaceWatchImages;
      const src = images ? images[key] : 'assets/palace-watch/' + key + '.jpg';
      return el('div', {class:'watch-photo'}, el('img', {src, alt:description}));
    }
    function speech(id, text) {
      return el('div', {class:'watch-speech'}, app.pic(id + '-avatar', '', ''),
        el('div', {}, el('strong', {}, people[id].name), el('p', {}, text)));
    }
    function evidence(which) {
      return chapter.beats[scene[which].beat];
    }
    function entry(i) {
      const n = notes[i], data = scenes[i], ch = BO.palaceChapters[i];
      const item = el('article', {class:'watch-entry'}, el('h3', {}, ch.title),
        el('p', {}, el('strong', {}, '내가 찾은 흔적'), data.clues[n.pick].name));
      if (selected(n.guess)) item.append(el('p', {}, el('strong', {}, '내 예상'), data.guesses[n.guess]));
      if (n.done) {
        const outcome = ch.beats[data.after.beat];
        item.append(el('p', {}, el('strong', {}, '성경에서 확인'), outcome.words), app.refChip(outcome.ref));
      }
      return item;
    }
    function render() {
      stopFilm(); pause(); body.replaceChildren();
      title.textContent = step === 'journal' ? '우리 탐험 일지' : scene.place;
      if (step === 'journal') {
        const entries = scenes.flatMap((_, i) => selected(notes[i]?.pick) ? [entry(i)] : []);
        const fieldEntries=[app.palaceFirst.journal(notes,openBook),app.palaceFrogs.journal(openBook),
          app.palaceDust.journal(openBook),app.palaceFlies.journal(openBook),app.palaceCattle.journal(openBook),app.palaceKiln.journal(openBook)].filter(Boolean);
        body.append(entries.length || fieldEntries.length ? el('div', {class:'watch-pages'}, ...fieldEntries, ...entries) :
          speech('hyu', '현장에서 눈에 띄는 흔적을 하나 골라 줘. 우리 첫 장에 남겨 둘게.'),
          button('이 장면 살펴보기', () => change(startStep()), 'watch-primary'));
        return;
      }
      if (step === 'done') {
        body.append(speech('hyu', '네가 고른 흔적과, 온우와 함께 확인한 대목을 한 장에 모았어.'),
          entry(chapterNo), button('다른 흔적 살펴보기', () => change('field')),
          button('전체 일지 펼치기', () => change('journal'), 'watch-primary'));
        return;
      }
      if (step === 'field' || step === 'picked') {
        const photo = picture(scene.photo, scene.place);
        body.append(photo);
        if (step === 'field') {
          scene.clues.forEach((clue, i) => {
            const mark = button('', () => {
              note.pick = i;
              if (!note.done) { delete note.guess; delete note.beforeSeen; delete note.afterSeen; }
              save(); change('picked');
            }, 'watch-spot');
            mark.setAttribute('aria-label', clue.name + ' 살펴보기');
            mark.style.left = 'clamp(23px, ' + clue.x + '%, calc(100% - 23px))';
            mark.style.top = 'clamp(23px, ' + clue.y + '%, calc(100% - 23px))'; photo.append(mark);
          });
          body.append(speech('choeon', scene.call), el('p', {class:'watch-help'}, '사진에서 먼저 살펴볼 곳을 눌러 봐.'));
        } else {
          const clue = scene.clues[note.pick];
          body.append(speech('hyu', clue.note), el('p', {class:'watch-saved'}, '일지에 그린 흔적 · ' + clue.name),
            button('다른 곳도 보기', () => change('field')),
            note.done ? button('바꾼 흔적 일지에서 보기', () => change('done'), 'watch-primary') :
              button('다음 일 예상하기', () => change('predict'), 'watch-primary'));
        }
        body.append(el('small', {class:'watch-cite'}, '이야기 배경 · ' + scene.ref), filmControl(photo));
        return;
      }
      if (step === 'predict') {
        body.append(speech('onwoo', scene.question));
        scene.guesses.forEach((guess, i) => body.append(button(guess, () => {
          note.guess = i; note.beforeSeen = true; save(); change('before');
        }, 'watch-guess')));
        return;
      }
      // 두 탭 모두 읽고 나면 내 예상과 실제 사건을 일지에 이어 붙일 수 있다.
      const which = step === 'compare' ? (note.afterSeen ? 'after' : 'before') : step;
      const beat = evidence(which);
      const tabs = el('div', {class:'watch-tabs', role:'group', 'aria-label':'장면 비교'});
      [['before','앞선 기록'],['after','그 뒤의 기록']].forEach(([key, name]) => {
        const tab = button(name, () => { note[key + 'Seen'] = true; save(); change(key); });
        tab.setAttribute('aria-pressed', String(which === key)); tabs.append(tab);
      });
      const audioStatus = el('p', {role:'status', hidden:true});
      const clip = [chapterNo + 1, scene[which].beat + 1].map(n => String(n).padStart(2, '0')).join('-');
      body.append(tabs, picture(scene[which].photo, chapter.title + ' · ' + beat.ref),
        speech('onwoo', which === 'before' ? '먼저 이 대목을 읽어 보자. 그 뒤의 기록도 펼쳐 봐.' : '우리가 예상한 일과 어떻게 이어지는지 살펴봐.'),
        el('div', {class:'watch-scripture'}, el('strong', {}, beat.who || '성경 이야기'), el('p', {}, beat.words), app.refChip(beat.ref), listenButton(clip, '본문 듣기', audioStatus), audioStatus),
        el('p', {class:'watch-saved'}, '내 예상 · ' + scene.guesses[note.guess]));
      if (note.beforeSeen && note.afterSeen) body.append(button('두 장면을 일지에 잇기', () => {
        note.done = true; save(); change('done');
      }, 'watch-primary'));
    }
    const bar = el('div', {class:'watch-strip'}, launch, journal);
    return {bar, dialog, open:() => open('scene'), resume() {
      const view = state.watchView;
      if (view === 'journal' || view === 'field') open(view);
      else if (view === 'predict' && selected(note.pick)) open(view);
      else if ((view === 'before' || view === 'after') && selected(note.pick) && selected(note.guess)) open(view);
      else if (view) open('scene');
    }};
  }
  app.palaceWatch = {attach};
})();
