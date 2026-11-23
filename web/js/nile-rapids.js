/* 탐험대의 일지를 배달하는 선택 도전. 한 칸씩 움직이고 물때에 따라 샛길이 열린다. */
(function () {
  'use strict';
  const app = BO.app2d, el = app.el;
  const {courier:route, directions, start, sail} = BO.nileRoutes;
  const period = 2400;
  const penalty = 1500;
  const dispatchWindow = 8000;
  const defaultMessage = '윗길로 연꽃을 챙길까요, 가운데로 깃발까지 곧장 갈까요?';
  const timeText = ms => (ms / 1000).toFixed(1) + '초';
  const clock = (mode, r) => mode === 'express' ? r.elapsed / period : r.beats / 2;
  const bankedTime = r => Math.round(r.elapsed + r.hits * penalty);

  function fresh() {
    return {...start(route), moves:0, beats:0, hits:0, elapsed:0, channels:0, rope:true, armed:false, direction:'right'};
  }
  function restore(s) {
    const tile = s && route.rows[s.y]?.[s.x];
    if (!tile || tile === '#' || !Number.isInteger(s.x) || !Number.isInteger(s.y) ||
        ![s.moves,s.hits,s.beats].every(v => Number.isSafeInteger(v) && v >= 0) ||
        !Number.isFinite(s.elapsed) || s.elapsed < 0) return fresh();
    return {...fresh(), x:s.x,y:s.y,found:s.found === true,arrived:tile === 'D',
      moves:s.moves,beats:s.beats,hits:s.hits,elapsed:s.elapsed,
      channels:[1,2,3].includes(s.channels) ? s.channels : 0,rope:s.rope === true,
      armed:s.rope === true && s.armed === true, direction:Object.hasOwn(directions,s.direction) ? s.direction : 'right'};
  }
  function open(back) {
    const saved = app.state.nileCourier || {};
    let mode = saved.mode === 'practice' ? 'practice' : 'express';
    const runs = {express:restore(saved.express),practice:restore(saved.practice)};
    const best = {};
    for (const kind of ['express','practice']) {
      for (const cargo of ['letter','flower','stamp']) {
        const key = kind + '-' + cargo;
        if (Number.isFinite(saved.best?.[key]) && saved.best[key] > 0) best[key] = saved.best[key];
      }
    }
    let run = runs[mode], tickingSince = null, tick = null, transition = null, frameId = null;
    let paused = !run.arrived && (run.moves > 0 || run.beats > 0), notice = defaultMessage;
    let pointer = null, lastTideLabel = '', shownPhase = 0;
    const events = new AbortController();
    const button = (label,css,fn) => el('button',{type:'button',class:css,on:{click:fn}},label);
    const heading = el('h1',{class:'river-name',tabindex:'-1'},route.name);
    const canvas = el('canvas',{class:'river-canvas',role:'img'});
    const board = el('div',{class:'river-map courier-map'},canvas);
    board.style.setProperty('--river-cols',route.rows[0].length);
    board.style.setProperty('--river-rows',route.rows.length);
    const timerLabel = el('span');
    const cargo = el('span');
    const phaseLabel = el('span',{class:'courier-tide-label'});
    const fill = el('span',{class:'courier-tide-fill'});
    const tideMeter = el('div',{class:'courier-meter'},phaseLabel,el('div',{class:'courier-tide-track','aria-hidden':'true'},fill));
    const note = el('p',{class:'river-status courier-note',role:'status'});
    const modes = el('div',{class:'courier-modes',role:'group','aria-label':'항해 방식'});
    const modeButtons = {};
    for (const [id,title] of [['practice','물살 연습'],['express','급행 배달']]) {
      modeButtons[id] = button(title,'courier-mode',() => changeMode(id));
      modes.append(modeButtons[id]);
    }
    const pad = el('div',{class:'river-pad',role:'group','aria-label':'노 젓기'});
    for (const [key,d] of Object.entries(directions)) {
      const btn = button(d.arrow,'river-key key-'+key,() => move(key));
      btn.setAttribute('aria-label', d.label+' 방향으로 노 젓기');
      pad.append(btn);
    }
    const ropeButton = button('밧줄 잡기','courier-rope',toggleRope);
    ropeButton.setAttribute('aria-keyshortcuts','R');
    const waitButton = button('물때 넘기기','river-tool',waitBeat);
    const retryButton = button('즉시 재도전','river-tool',restart);
    const playTools = el('div',{class:'courier-actions'},ropeButton,waitButton,retryButton);
    const controls = el('div',{class:'courier-controls'},pad,playTools);
    const pauseButton = button('잠깐 쉬기','river-nav-link',() => paused ? resume() : pause());
    const leave = button('물길로','river-nav-link',() => {
      pause(); events.abort(); observer.disconnect(); cancelPaint(); back();
    });
    const overlay = el('div',{class:'courier-pause',hidden:true},
      el('div',{},button('항해 이어가기','river-primary',resume),button('처음부터 배달','river-tool',restart)));
    board.append(overlay);
    const result = el('section',{class:'river-result',hidden:true});
    const goal = el('p',{class:'river-goal courier-goal'});
    const shell = el('main',{class:'river-screen courier-screen'},
      el('nav',{class:'river-nav'},leave,modes,pauseButton),
      el('div',{class:'river-layout'},el('div',{class:'river-chart'},
        heading,board,el('div',{class:'river-stats'},timerLabel,cargo),tideMeter),
        el('section',{class:'river-cockpit'},goal,controls,result,note)));
    app.show(shell); shell.parentElement.classList.add('river-app','courier-app');
    function persist() {
      app.state.nileCourier = {mode,express:{...runs.express},practice:{...runs.practice},best:{...best}};
      app.save();
    }
    function sample(now = performance.now()) {
      if (tickingSince !== null) {
        run.elapsed += Math.max(0,now-tickingSince);
        tickingSince = now;
      }
    }
    function cancelPaint() {
      if (tick !== null) clearInterval(tick);
      if (frameId !== null) cancelAnimationFrame(frameId);
      tick = frameId = null; transition = null;
    }
    function startClock() {
      if (mode !== 'express' || tickingSince !== null || paused || run.arrived) return;
      tickingSince = performance.now();
      tick = setInterval(() => { sample(); paint(); },100);
    }
    function paint() {
      const beat = clock(mode,run), phase = Math.floor(beat)%2, frac = beat%1;
      shownPhase = phase;
      const width = Math.round(canvas.clientWidth*Math.min(devicePixelRatio || 1,2));
      const height = Math.round(canvas.clientHeight*Math.min(devicePixelRatio || 1,2));
      if (width && height) {
        if (canvas.width!==width || canvas.height!==height) {canvas.width=width;canvas.height=height;}
        const ctx=canvas.getContext('2d');
        ctx.setTransform(width/route.rows[0].length,0,0,height/route.rows.length,0,0);
        let boat = run;
        if (transition) {
          const pct = Math.min(1,(performance.now()-transition.t)/95);
          boat = {x:transition.x+(run.x-transition.x)*pct, y:transition.y+(run.y-transition.y)*pct};
          if (pct>=1) transition=null;
        }
        BO.drawNileBoard(ctx,{rows:route.rows,boat,lotus:route.lotus,dock:route.dock,direction:run.direction,
          found:run.found,tide:{phase,progress:frac,shield:run.armed}});
      }
      fill.style.transform='scaleX('+(1-frac)+')';
      const tide = phase===0 ? '왼쪽 물살이 세요' : '오른쪽 물살이 세요';
      if (lastTideLabel!==tide) { phaseLabel.textContent=tide; lastTideLabel=tide; }
      const score = bankedTime(run);
      let timing = '항해  '+run.beats+'수';
      if (mode==='express') {
        timing = !run.arrived && score<dispatchWindow ? '종까지  '+timeText(dispatchWindow-score)
          : (run.arrived ? '배달 기록  ' : '종 울림 · ')+timeText(score);
      }
      if (timerLabel.textContent!==timing) timerLabel.textContent=timing;
    }
    function animate(x,y) {
      if (frameId!==null) cancelAnimationFrame(frameId);
      transition = matchMedia('(prefers-reduced-motion: reduce)').matches ? null : {x,y,t:performance.now()};
      function frame() {
        frameId=null; paint();
        if (transition) frameId=requestAnimationFrame(frame);
      }
      frame();
    }
    function update() {
      for (const id of Object.keys(modeButtons)) modeButtons[id].setAttribute('aria-pressed',String(id===mode));
      ropeButton.disabled=!run.rope || paused || run.arrived;
      ropeButton.setAttribute('aria-pressed',String(run.armed));
      ropeButton.textContent=run.armed ? '밧줄 잡음' : run.rope ? '밧줄 잡기' : '밧줄 사용함';
      waitButton.hidden=mode!=='practice';
      retryButton.hidden=mode!=='express' || !run.hits || paused;
      overlay.hidden=!paused; controls.hidden=goal.hidden=run.arrived; result.hidden=!run.arrived;
      pauseButton.textContent=paused ? '계속하기' : '잠깐 쉬기';
      pauseButton.disabled=run.arrived;
      cargo.textContent=run.found ? '✿  연꽃 우편' : '✉  탐험 일지';
      goal.textContent=mode==='express' ? '8초 안에 두 물살을 막힘없이 건너면 급행 도장을 받아요.' :
        '한 칸씩 배달해요. 두 수마다 물살이 바뀌고, 제자리에서 기다릴 수도 있어요.';
      if (!run.arrived) {
        note.textContent=notice;
      } else note.textContent='';
      canvas.setAttribute('aria-label','배 '+(run.y+1)+'행 '+(run.x+1)+'열, 깃발 4행 8열, 연꽃 1행 5열');
      paint();
    }
    function pause() {
      sample(); tickingSince=null; cancelPaint();
      paused=!run.arrived; persist(); update();
    }
    function resume() {
      if (!paused) return;
      paused=false;
      if (run.moves || run.beats) startClock();
      update();
    }
    function changeMode(id) {
      if (id===mode) return;
      sample(); tickingSince=null; cancelPaint();
      mode=id; run=runs[id]; paused=!run.arrived && (run.moves>0 || run.beats>0);
      notice=defaultMessage; persist();
      if (run.arrived) finish(false); else update();
    }
    function restart() {
      cancelPaint(); tickingSince=null; run=runs[mode]=fresh(); paused=false;
      notice=defaultMessage; persist(); update(); heading.focus({preventScroll:true});
    }
    function finish(newDelivery) {
      tickingSince=null; cancelPaint(); paused=false;
      const key=mode+'-'+(run.found ? 'flower':'letter');
      const score=mode==='express' ? bankedTime(run) : run.beats;
      if (newDelivery && (!best[key] || score<best[key])) best[key]=score;
      const stamped = mode==='express' && score<=dispatchWindow && run.channels===3 && run.hits===0;
      if (newDelivery && stamped && (!best['express-stamp'] || score<best['express-stamp'])) best['express-stamp']=score;
      const fmt = n => mode==='express' ? timeText(n) : n+'수';
      const again = button('다시 배달하기','river-primary',restart);
      result.replaceChildren(el('h2',{},run.found ? '연꽃 우편 도착!' : '탐험 일지 배달 완료!'),
        el('p',{},'이번 '+fmt(score)+' · '+(run.hits ? '물살에 '+run.hits+'번 막힘' : '물살을 말끔히 통과')),
        el('p',{class:'courier-best'},(run.found ? '연꽃 우편' : '일지')+' 개인 최고  '+fmt(best[key] || score)),
        again);
      if (mode==='express') {
        if (stamped) result.prepend(el('strong',{class:'courier-stamp'},'급행 도장 획득'));
        else if (best['express-stamp']) result.append(el('p',{class:'courier-best'},'보유한 급행 도장 · '+timeText(best['express-stamp'])));
      }
      persist(); update();
      if (newDelivery) again.focus({preventScroll:true});
    }
    function toggleRope() {
      if (paused || run.arrived || !run.rope) return;
      run.armed=!run.armed;
      notice=run.armed ? '밧줄을 잡았어요. 다음에 센 물살로 들어갈 때 써요.' : '밧줄을 챙겨 두었어요.';
      sample(); persist(); update();
    }
    function waitBeat() {
      if (paused || run.arrived || mode!=='practice') return;
      run.beats++; notice='한 수 기다렸어요. 물살을 살펴보세요.'; persist(); update();
    }
    function move(dir) {
      if (paused || run.arrived) return;
      const next=sail(route,run,dir);
      if (!next) {notice='갈대밭이에요. 열린 물길을 골라 보세요.'; update();return;}
      sample(); startClock();
      const phase=shownPhase; // 마지막으로 보여 준 물살을 기준으로 입력을 판정한다.
      const tile=route.rows[next.y][next.x];
      const strong=tile===(phase===0 ? '~' : '=');
      if (strong && !run.armed) {
        run.hits++;run.beats++;
        const splash=el('span',{class:'courier-splash','aria-hidden':'true'});
        splash.style.left=(next.x+.5)*100/route.rows[0].length+'%';
        splash.style.top=(next.y+.5)*100/route.rows.length+'%';
        board.append(splash);splash.addEventListener('animationend',()=>splash.remove(),{once:true});
        notice=mode==='express' ? '센 물살! 기록에 1.5초가 더해졌어요. 흰 거품이 걷힐 때 저어 보세요.' :
          '센 물살에 막혔어요. 잠시 기다리거나 밧줄을 잡아 보세요.';
        persist(); update(); return;
      }
      const {x,y,found} = run;
      Object.assign(run,next,{direction:dir,moves:run.moves+1,beats:run.beats+1});
      if (tile==='~') run.channels|=1;
      if (tile==='=') run.channels|=2;
      if (strong) {run.rope=false;run.armed=false;}
      notice = strong ? '밧줄로 물살을 건넜어요!' : !found && run.found ? '연꽃 우편을 챙겼어요. 이제 나루로!' : '깃발 나루로 일지를 가져가세요.';
      if (run.arrived) { finish(true);return; }
      persist(); update(); animate(x,y);
    }
    const keyMap={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',a:'left',s:'down',d:'right'};
    window.addEventListener('keydown',e=>{
      if (e.altKey||e.ctrlKey||e.metaKey||e.repeat) return;
      if (Object.hasOwn(keyMap,e.key)) {e.preventDefault();move(keyMap[e.key]);}
      else if(e.key.toLowerCase()==='r') toggleRope();
      else if(e.key==='Escape') paused ? resume() : pause();
    },{signal:events.signal});
    canvas.addEventListener('pointerdown',e=>{
      if(!e.isPrimary||e.button!==0)return;
      pointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointercancel',()=>{pointer=null;});
    canvas.addEventListener('pointerup',e=>{
      if(!pointer||!e.isPrimary)return;
      const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer=null;
      if(Math.max(Math.abs(dx),Math.abs(dy))<16)return;
      move(Math.abs(dx)>Math.abs(dy) ? (dx>0?'right':'left') : (dy>0?'down':'up'));
    });
    document.addEventListener('visibilitychange',()=>{if(document.hidden && !run.arrived) pause();},{signal:events.signal});
    window.addEventListener('pagehide',pause,{signal:events.signal});
    const observer=new ResizeObserver(paint);observer.observe(canvas);
    if (run.arrived) finish(false); else update();
    heading.focus({preventScroll:true});
  }
  app.nileRapids={open};
})();
