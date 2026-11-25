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
    function pauseMedia() { stopNarration(); if (video) video.pause(); }
    function hide() { if (document.hidden) pauseMedia(); }
    document.addEventListener('visibilitychange', hide);
    window.addEventListener('pagehide', pauseMedia);
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
    function go(chapter, beat, startFilm=false) {
      stop();
      s.chapter = chapter;
      s.beat = beat;
      delete s.choice;
      app.save();
      draw(true, startFilm);
    }
    function detach() {
      stop();
      document.removeEventListener('visibilitychange', hide);
      window.removeEventListener('pagehide', pauseMedia);
    }
    function exit() {
      detach();
      s.active = false;
      app.save();
      leave();
    }
    function draw(focus, startFilm=false) {
      const chapter = chapters[s.chapter], beat = chapter.beats[s.beat];
      const final = s.chapter === chapters.length - 1 && s.beat === chapter.beats.length - 1;
      // 한밤중의 부름에는 빛이 드는 낮 왕궁 대신 닫힌 문을 보여 준다.
      const showAudience = s.chapter !== 9 && (beat.who || s.chapter === 0 && !beat.film);
      const image = showAudience ? palaceArt : chapter.art;
      const heading = el('h1', {tabindex:'-1'}, chapter.title);
      const hero = el('div', {class:'palace-picture'}, app.pic(image, '', image === palaceArt ?
        '왕 앞에 선 모세와 아론. 왼쪽의 두 형제와 오른쪽의 바로가 마주 보고 있어요.' : chapter.title));
      const watch = app.palaceWatch.attach(s.chapter, () => {
        stopNarration(); app.stopReading(); if (video) video.pause();
      }, listenButton);
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
      const scene = BO.palaceWatchScenes[s.chapter];
      const upcoming = chapter.beats[s.beat+1];
      const filmIndex = chapter.beats.findIndex(b => b.film);
      const quizBeforeFilm = beat.options && upcoming?.film;
      const watchLabel = '영상 보기 · ' + chapter.seconds + '초';
      const nextLabel = final ? '이야기 마치기' : nextChapter ? '다음 재앙으로' :
        upcoming.film ? '현장으로 · ' + scene.place : upcoming.options ? '단서 맞추기' :
        upcoming.who ? upcoming.who + '의 말 읽기' : '그 뒤의 기록 읽기';
      const next = el('button', {class:'btn onpaper', on:{click:() => {
        if (quizBeforeFilm) go(s.chapter,s.beat+1,true); else advance();
      }}}, quizBeforeFilm ? watchLabel : nextLabel);
      let playFilm,filmFooter;
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
          if (chosen && s.choice === beat.answer) listenToAnswer.append(el('p', {class:'palace-invite'}, quizBeforeFilm ? '그 뒤에 어떤 일이 일어났을까요? 영상에서 확인해 봐요.' : '이 답이 나온 순간을 영상에서 다시 찾아볼까요?'));
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
      if (beat.film || beat.options && !quizBeforeFilm) {
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
            if (video !== player) return;
            const outcome=chapter.beats[scene.after.beat];
            notice.replaceChildren(el('strong', {}, '영상 뒤의 기록'),el('p', {}, outcome.words),app.refChip(outcome.ref),
              el('button', {type:'button', class:'watch-after-film', on:{click:watch.open}}, '세 친구와 현장 살펴보기'));
            if(beat.film)next.textContent=nextLabel;
            playButton.textContent='영상 다시 보기'; playButton.hidden=false;
            notice.scrollIntoView({block:'nearest'});
          });
          playButton.hidden = true;
          notice.textContent = '';
          player.src = chapter.url;
          player.play().catch(function () {
            if (video === player && !player.error) notice.textContent = '영상의 재생 단추를 눌러 주세요.';
          });
          player.focus();
        }
        const playButton = el('button', {class:'palace-film-play', on:{click:()=>{
          if(beat.film && !chapter.beats[s.beat-1]?.options && ![0,1].includes(s.filmGuesses?.[s.chapter])){
            panel.querySelector('.palace-option').focus();return;
          }
          play();
        }}},  beat.film ? watchLabel : '이 답의 장면 다시 보기');
        playFilm=play;
        if (beat.film) {
          const reading=el('details',{class:'palace-reading'},el('summary',{},'글로 장면 읽기'),words,sources,readStatus);
          const invitation=el('p',{class:'palace-invite',role:'status'});
          const img=BO.palaceWatchImages?.[scene.photo] || 'assets/palace-watch/'+scene.photo+'.jpg';
          hero.replaceChildren(el('img',{src:img,alt:scene.place}));
          if (!chapter.beats[s.beat-1]?.options) {
            if (!Array.isArray(s.filmGuesses)) s.filmGuesses=[];
            const guesses=el('div',{class:'palace-options',role:'group','aria-label':scene.question});
            const sync=()=>{
              const guess=s.filmGuesses[s.chapter], picked=guess===0||guess===1;
              Array.from(guesses.children).forEach((b,i)=>b.setAttribute('aria-pressed',String(i===guess)));
              playButton.textContent=picked?watchLabel:'어떻게 될지 예상하기';
              invitation.textContent=picked?'이제 네 예상과 실제로 일어난 일을 영상에서 비교해 봐요.':'어떻게 되었을지 먼저 예상해 보세요.';
            };
            scene.guesses.forEach((label,i)=>guesses.append(el('button',{class:'palace-option',on:{click:()=>{
              s.filmGuesses[s.chapter]=i;app.save();sync();playButton.focus();
            }}},label)));
            panel.append(el('h2',{class:'palace-question'},scene.question),guesses);
            sync();
          } else invitation.textContent='강물이 변한 뒤, 사람들과 바로는 어떻게 했을까요?';
          filmFooter=playButton;
          panel.append(invitation,notice,reading);
          next.textContent='글로 이어 보기';
        } else {
          panel.append(playButton,notice);
          const sync=()=>{playButton.hidden=s.choice!==beat.answer;};
          panel.querySelector('.palace-options').addEventListener('click',sync); sync();
        }
      }
      const previous = el('button', {class:'btn plain', on:{click:function () {
        if (s.beat) go(s.chapter, s.beat - 1);
        else go(s.chapter - 1, chapters[s.chapter - 1].beats.length - 1);
      }}}, '이전');
      previous.disabled = s.chapter === 0 && s.beat === 0;
      const footer = el('div', {class:'sheet-foot pad palace-foot'}, previous, next, filmFooter);
      if(filmFooter)footer.classList.add('palace-cinema-foot');
      if (final) {
        panel.append(el('button', {class:'btn onpaper', on:{click:function () {
          detach(); s.finished = true; s.active = false; app.save(); app.openPassoverRoom();
        }}}, '유월절을 준비한 집 살펴보기'),
          el('button', {class:'palace-restart', on:{click:() => go(0, 0)}}, '첫 대화 다시 읽기'));
      }
      const when = beat.film ? '재앙 장면' : s.beat < filmIndex ? '재앙이 일어나기 전' : '재앙이 일어난 뒤';
      const section = el('main', {class:'palace-scroll'}, el('div', {class:'palace-headline'},
        el('p', {class:'palace-chapter'}, (s.chapter + 1) + ' / 10 · ' + when), heading, watch.bar,
        s.beat === 0 || beat.film ? el('p', {class:'watch-intro'}, '『탐험대 이야기』 최온 · ' + BO.palaceWatchScenes[s.chapter].call) : null), hero, panel);
      const nav = el('div', {class:'palace-nav pad'}, el('button', {class:'pillbtn', on:{click:exit}},
        from === 'passover' ? '← 탐험으로' : '← 돌아가기'), el('span', {}, '모세와 바로의 대화'),
        el('button', {class:'pillbtn palace-river-link', on:{click:function () {
          detach(); app.openNile();
        }}}, '나일강 물길 탐험'));
      app.show(el('div', {class:'screen palace-screen'}, nav, section, footer, watch.dialog));
      if (focus) heading.focus({preventScroll:true});
      watch.resume();
      if (startFilm) playFilm?.();
    }
    if (s.finished && s.chapter === chapters.length - 1 && s.beat === chapters[s.chapter].beats.length - 1) {
      // 끝에서 나간 다음에는 아이가 다시 처음부터 읽을 수 있다.
      s.finished = false;
      go(0, 0);
    } else draw(true);
  }
  app.palace = {open, resuming:() => valid(app.state.palace) && app.state.palace.active === true};
})();
