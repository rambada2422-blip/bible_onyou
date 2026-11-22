/* 모세와 바로의 대화 탐험. 아이는 말을 듣고 근거를 찾는 목격자다. */
(function () {
  'use strict';
  const app = BO.app2d, el = app.el, chapters = BO.palaceChapters;
  const palaceArt = 'ex04-palace';
  function valid(s) {
    return s && Number.isInteger(s.chapter) && chapters[s.chapter] &&
      Number.isInteger(s.beat) && !!chapters[s.chapter].beats[s.beat];
  }
  function open(from, leave) {
    let s = app.state.palace;
    if (!valid(s)) s = app.state.palace = {chapter:0, beat:0};
    s.active = true;
    s.from = from;
    app.save();
    let video, narration;
    function stopNarration() {
      if (!narration) return;
      const {player, button, caption, label} = narration;
      narration = null;
      player.pause();
      caption.textContent = label;
      button.setAttribute('aria-pressed', 'false');
    }
    function listenButton(clip, label, status) {
      const caption = el('span', {}, label);
      const button = el('button', {class:'readbtn', 'aria-pressed':'false', on:{click:function () {
        const wasPlaying = narration && narration.button === button;
        stopNarration();
        if (wasPlaying) return;
        if (video) video.pause();
        status.hidden = true;
        const url = BO.palaceAudio ? BO.palaceAudio[clip] : 'assets/audio/palace/' + clip + '.mp3';
        const player = new Audio(url);
        narration = {player, button, caption, label};
        caption.textContent = '그만 듣기';
        button.setAttribute('aria-pressed', 'true');
        function finish(failed) {
          if (!narration || narration.player !== player) return;
          stopNarration();
          if (failed) {
            status.textContent = '목소리를 불러오지 못했어요. 듣기 단추를 다시 눌러 주세요.';
            status.hidden = false;
          }
        }
        player.addEventListener('ended', () => finish(false), {once:true});
        player.addEventListener('error', () => finish(true), {once:true});
        player.play().catch(() => finish(true));
      }}}, app.icon('speaker'), caption);
      return button;
    }
    function hide() { if (document.hidden) stopNarration(); }
    document.addEventListener('visibilitychange', hide);
    window.addEventListener('pagehide', stopNarration);
    function stop() {
      stopNarration();
      app.stopReading();
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
        video = null;
      }
    }
    function go(chapter, beat) {
      stop();
      s.chapter = chapter;
      s.beat = beat;
      delete s.choice;
      app.save();
      draw(true);
    }
    function exit() {
      stop();
      document.removeEventListener('visibilitychange', hide);
      window.removeEventListener('pagehide', stopNarration);
      s.active = false;
      app.save();
      leave();
    }
    function draw(focus) {
      const chapter = chapters[s.chapter], beat = chapter.beats[s.beat];
      const final = s.chapter === chapters.length - 1 && s.beat === chapter.beats.length - 1;
      // 한밤중의 부름에는 빛이 드는 낮 왕궁 대신 닫힌 문을 보여 준다.
      const showAudience = s.chapter !== 9 && (beat.who || s.chapter === 0 && !beat.film);
      const image = showAudience ? palaceArt : chapter.art;
      const heading = el('h1', {tabindex:'-1'}, chapter.title);
      const hero = el('div', {class:'palace-picture'}, app.pic(image, '', image === palaceArt ?
        '왕 앞에 선 모세와 아론. 왼쪽의 두 형제와 오른쪽의 바로가 마주 보고 있어요.' : chapter.title));
      const panel = el('section', {class:'palace-panel'});
      const role = beat.who || (beat.options ? '단서 맞추기' : beat.film ? '그때 일어난 일' : '이야기');
      const kind = el('p', {class:'palace-speaker'}, role);
      if (beat.who) kind.append(el('span', {class:'palace-retelling'}, '본문을 풀어 쓴 대화'));
      const words = el('p', {class:'palace-words'}, beat.words);
      if (beat.who) panel.classList.add(beat.who === '바로' ? 'palace-king' : 'palace-moses');
      panel.append(kind, words);
      const readStatus = el('p', {role:'status', class:'palace-status', hidden:true});
      const sources = el('div', {class:'palace-sources'}, app.refChip(beat.ref));
      const clip = [s.chapter + 1, s.beat + 1].map(n => String(n).padStart(2, '0')).join('-');
      sources.append(listenButton(clip, '읽어 줘', readStatus));
      panel.append(sources, readStatus);

      function advance() {
        if (final) { s.finished = true; exit(); }
        else if (s.beat + 1 < chapter.beats.length) go(s.chapter, s.beat + 1);
        else go(s.chapter + 1, 0);
      }
      const nextChapter = s.beat === chapter.beats.length - 1;
      const next = el('button', {class:'btn onpaper', on:{click:advance}},
        final ? '이야기 마치기' : nextChapter ? '다음 재앙으로' : chapter.beats[s.beat + 1].film ? '재앙 장면으로' : '다음');
      if (beat.options) {
        const options = el('div', {class:'palace-options', role:'group', 'aria-label':beat.words});
        const answer = el('p', {class:'palace-feedback', role:'status'});
        const listenToAnswer = el('div', {class:'palace-answer-listen'});
        function showChoice() {
          const chosen = Number.isInteger(s.choice) && s.choice >= 0 && s.choice < beat.options.length;
          Array.from(options.children).forEach((b, i) => b.setAttribute('aria-pressed', String(chosen && i === s.choice)));
          next.disabled = !chosen || s.choice !== beat.answer;
          answer.textContent = chosen ? s.choice === beat.answer ? beat.evidence : beat.hint : '';
          listenToAnswer.replaceChildren();
          if (chosen) {
            const kind = s.choice === beat.answer ? 'evidence' : 'hint';
            listenToAnswer.append(listenButton(clip + '-' + kind, '풀이 듣기', readStatus));
          }
        }
        beat.options.forEach((label, i) => options.append(el('button', {class:'palace-option', on:{click:function () {
          stopNarration(); s.choice = i; app.save(); showChoice();
          answer.scrollIntoView({block:'nearest'});
        }}}, label)));
        panel.append(options, answer, listenToAnswer);
        showChoice();
      }
      if (beat.film) {
        // 동의한 장면 한 편만 요청한다. 영상이 막혀도 위의 글로 계속할 수 있다.
        const notice = el('p', {class:'palace-status', role:'status'});
        function play() {
          stopNarration();
          app.stopReading();
          if (video) { video.pause(); video.removeAttribute('src'); video.load(); }
          const player = el('video', {controls:true, playsinline:true, preload:'none', tabindex:'0', 'aria-label':chapter.title + ' 영상'});
          video = player;
          player.addEventListener('play', stopNarration);
          hero.replaceChildren(player);
          player.addEventListener('error', function () {
            if (video !== player || !player.hasAttribute('src')) return;
            notice.textContent = '영상을 불러오지 못했어요. 다시 누르거나 글로 계속할 수 있어요.';
            playButton.textContent = '영상 다시 불러오기'; playButton.hidden = false;
          });
          player.addEventListener('ended', function () {
            if (video === player) notice.textContent = '영상을 다 보았어요. 다음으로 갈 수 있어요.';
          });
          playButton.hidden = true;
          notice.textContent = '';
          player.src = chapter.url;
          player.play().catch(function () {
            if (video === player && !player.error) notice.textContent = '영상의 재생 단추를 눌러 주세요.';
          });
          player.focus();
        }
        const playButton = el('button', {class:'palace-film-play', on:{click:play}}, '영상 보기 · 12초');
        panel.append(playButton, notice);
      }
      const previous = el('button', {class:'btn plain', on:{click:function () {
        if (s.beat) go(s.chapter, s.beat - 1);
        else go(s.chapter - 1, chapters[s.chapter - 1].beats.length - 1);
      }}}, '이전');
      previous.disabled = s.chapter === 0 && s.beat === 0;
      const footer = el('div', {class:'sheet-foot pad palace-foot'}, previous, next);
      if (final) panel.append(el('button', {class:'palace-restart', on:{click:() => go(0, 0)}}, '첫 대화 다시 읽기'));
      const filmIndex = chapter.beats.findIndex(b => b.film);
      const when = beat.film ? '재앙 장면' : s.beat < filmIndex ? '재앙이 일어나기 전' : '재앙이 일어난 뒤';
      const section = el('main', {class:'palace-scroll'}, el('div', {class:'palace-headline'},
        el('p', {class:'palace-chapter'}, (s.chapter + 1) + ' / 10 · ' + when), heading), hero, panel);
      const nav = el('div', {class:'palace-nav pad'}, el('button', {class:'pillbtn', on:{click:exit}},
        from === 'passover' ? '← 탐험으로' : '← 돌아가기'), el('span', {}, '모세와 바로의 대화'));
      app.show(el('div', {class:'screen palace-screen'}, nav, section, footer));
      if (focus) heading.focus({preventScroll:true});
    }
    if (s.finished && s.chapter === chapters.length - 1 && s.beat === chapters[s.chapter].beats.length - 1) {
      // 끝에서 나간 다음에는 아이가 다시 처음부터 읽을 수 있다.
      s.finished = false;
      go(0, 0);
    } else draw(true);
  }
  app.palace = {open, resuming:() => valid(app.state.palace) && app.state.palace.active === true};
})();
