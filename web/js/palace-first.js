/* 첫 방문의 일터, 물을 구하는 강가, 왕의 반응. 조작 대상은 탐험대가 보는 자리다. */
(function () {
  'use strict';
  const app = BO.app2d, el = app.el;
  const views = {
    yard:{group:'bondage',img:'yard',place:'애굽의 벽돌 일터',alt:'성벽으로 무거운 바구니를 나르는 일꾼들'},
    audience:{img:'audience',place:'왕궁 · 모세와 아론',alt:'왕 앞에 선 모세와 아론'},
    throne:{img:'throne',place:'왕궁 · 바로',alt:'왕좌에 앉아 있는 바로'},
    clay:{group:'bondage',img:'clay',place:'벽돌을 만드는 작업대',alt:'짚 섞인 흙을 다지는 나무틀과 줄지어 말리는 벽돌'},
    jar:{img:'jar',place:'나일 강가 · 물항아리',alt:'잔 위에 기울인 항아리와 그 뒤로 보이는 붉은 강물'},
    bank:{art:'plague-digging',place:'나일 강가 · 물을 찾는 자리',alt:'강가에 몸을 굽히고 땅을 파는 사람들'}
  };
  const labels = {
    load:'벽돌 바구니', mold:'나무틀', bricks:'말리는 벽돌', jar:'기울인 물항아리',
    bank:'강가에 쌓인 흙', king:'왕좌의 금빛 팔걸이'
  };
  function state() {
    const palace = app.state.palace;
    if (!Array.isArray(palace.firstMarks)) palace.firstMarks = [];
    return palace.firstMarks;
  }
  function record(key) {
    const marks = state();
    if (!marks.includes(key)) { marks.push(key); app.save(); }
  }
  function page(ref, closed) {
    app.openFieldScroll('2:23–25, 3:7–10, 5:1–9, 7:4–5, 7:19–24', BO.palaceFirstVerses, ref, closed);
  }
  function picture(view) {
    const d = views[view];
    if (d.art) return app.pic(d.art,'',d.alt);
    const src = d.group === 'bondage' ? BO.bondageImages?.[d.img] || 'assets/bondage/'+d.img+'.webp' :
      BO.palaceWatchImages?.[d.img] || 'assets/palace-watch/'+d.img+'.jpg';
    return el('img',{src,alt:d.alt,draggable:'false'});
  }
  function display(hero, view) {
    hero.dataset.firstView = view;
    hero.replaceChildren(picture(view));
  }
  function field(hero, view, openBook, onChange) {
    display(hero,view);
    const info=el('div',{class:'pf-tools'});
    const caption=el('p',{class:'pf-feedback',role:'status'});
    const pins=[];
    function pin(key,x,y,tap) {
      const btn=el('button',{type:'button',class:'pf-pin','aria-label':labels[key]+' 살펴보기',
        style:'left:clamp(23px,'+x+'%,calc(100% - 23px));top:clamp(23px,'+y+'%,calc(100% - 23px))',
        on:{click:()=>{
          record(key); btn.setAttribute('aria-pressed','true'); tap();
        }}},el('span',{'aria-hidden':'true'}));
      btn.dataset.mark=key;
      btn.setAttribute('aria-pressed',String(state().includes(key)));hero.append(btn);pins.push(btn);
    }
    function put(text) { caption.textContent=text; }
    const scene=BO.palaceWatchScenes[0];
    const relay=(label,fn)=>el('button',{type:'button',class:'pf-action',on:{click:fn}},label);
    if(view==='yard'){
      const show=()=>put('최온의 수첩 · '+labels.load);
      pin('load',31,73,show);
      if(state().includes('load'))show();else put('최온과 함께 일꾼이 나르는 바구니를 찾아보세요.');
    } else if(view==='clay'){
      const show=()=>{
        const found=['mold','bricks'].filter(k=>state().includes(k));
        hero.classList.toggle('pf-linked',found.length===2);
        put(found.length===2?'휴의 작업대 기록 · 나무틀과 말리는 벽돌을 한 쌍으로 담았어요.':
          found.length?'휴의 작업대 기록 · '+labels[found[0]]+'을 담았어요. 다른 자리도 찾아보세요.':'휴와 함께 나무틀에서 벽돌까지 손가락으로 잇거나 두 자리를 눌러 보세요.');
      };
      pin('mold',31,78,show);pin('bricks',79,74,show);show();
      for(const start of pins){
        start.addEventListener('pointerdown',e=>{
          if(e.isPrimary && e.button===0)start.setPointerCapture(e.pointerId);
        });
        start.addEventListener('pointerup',e=>{
          if(!e.isPrimary || !start.hasPointerCapture(e.pointerId))return;
          const end=document.elementFromPoint(e.clientX,e.clientY)?.closest('.pf-pin');
          if(end!==start && pins.includes(end)){
            for(const pin of pins){record(pin.dataset.mark);pin.setAttribute('aria-pressed','true');}
            show();
          }
        });
      }
    } else if(view==='jar'){
      const clue=scene.clues[0];
      pin('jar',clue.x,clue.y,()=>put(clue.note));
      put(state().includes('jar')?clue.note:'최온과 함께 물을 뜨러 온 사람의 항아리를 살펴보세요.');
      info.append(relay('물을 찾으러 간 자리 보기',()=>onChange('bank')));
    } else if(view==='bank'){
      pin('bank',19,84,()=>openBook('7:24'));
      put('사람들이 파낸 흙이 어디에 쌓였나요? 온우와 그 자리를 눌러 기록을 펼쳐 보세요.');
      info.append(relay('물항아리로 돌아가기',()=>onChange('jar')));
    } else if(view==='throne' && onChange){
      pin('king',54,76,()=>openBook('7:22'));
      put('온우와 왕좌의 금빛 팔걸이를 찾아보세요. 바로가 어떻게 했는지 말씀에서 확인할 수 있어요.');
      info.append(relay('나일 강가 다시 보기',()=>onChange('jar')));
    }
    info.prepend(el('b',{class:'pf-place'},views[view].place));
    if(pins.length)info.append(caption);
    return info;
  }
  function journal(notes, openBook) {
    const marks=Array.isArray(app.state.palace.firstMarks) ? app.state.palace.firstMarks : [];
    if(!marks.length && !notes[0]?.done)return null;
    const item=el('section',{class:'pf-entry'},el('h3',{},'첫 왕궁 방문과 나일 강가'));
    if(marks.length)item.append(el('p',{},'『탐험대 이야기』 현장에서 찾은 흔적'),el('ul',{},Object.keys(labels).filter(k=>marks.includes(k)).map(k=>el('li',{},labels[k]))));
    if(notes[0]?.done || marks.includes('bank') && marks.includes('king')){
      item.append(el('button',{type:'button',class:'watch-primary',on:{click:()=>openBook('7:22')}},'말씀 인장 · 출 7:22–24'));
    }
    return item;
  }
  const titles=['백성의 부르짖음','왕궁에 선 모세와 아론','바로의 첫 대답','짚까지 구해야 하는 일터','모세와 아론의 부탁','나일 강가에서 일어난 일','바로는 어떻게 했을까?'];
  app.palaceFirst={field,journal,page,titles};
})();
