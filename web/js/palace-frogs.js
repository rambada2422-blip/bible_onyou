/* 집 안의 두 흔적과 바로의 약속을 탐험대 관찰 기록으로 잇는다. */
(function () {
  'use strict';
  const app = BO.app2d, el = app.el;
  const scene = BO.palaceWatchScenes[1];
  const chapter = BO.palaceChapters[1];
  const views = {
    bank: ['frog-bank','나일강 갈대밭','갈대를 붙잡고 물가에 나온 개구리들','palace-river'],
    kitchen: ['kitchen','화덕이 있는 집','반죽판 위와 화덕 곁에 개구리가 있고 가족이 손을 멈춘 모습','palace-frogs-kitchen'],
    plea: ['plea','왕궁에서 한 약속','바로와 모세가 마주 앉은 왕궁','palace-court'],
    audience: ['audience','왕궁에서 오간 말','바로 앞에 선 모세와 아론','palace-court'],
    yard: ['frog-yard','재앙이 그친 뒤의 마당','바깥 들로 통하는 문이 열린 조용한 마당','palace-frogs-yard'],
    turned: ['turned','숨을 돌린 뒤의 바로','바로가 궁의 기둥 곁에서 바깥을 향하고 있는 모습',null]
  };
  const titles = ['모세가 전할 경고','개구리는 어디까지 왔을까?','바로가 한 약속','기도할 때를 묻다','바로가 정한 때','재앙이 그친 뒤','바로는 약속을 지켰을까?'];
  const beats = ['bank','bank','plea','audience','plea','yard','turned'];
  function page(ref, close) {
    app.openFieldScroll('8:1–15, 12:31–32',BO.palaceFrogVerses,ref,close);
  }
  function choice(label,fn) {
    return el('button',{type:'button',class:'pf-action',on:{click:fn}},label);
  }
  function field(hero, slot, view, s, openBook, switchView, shutter) {
    const [key,place,alt] = views[view];
    const notes = app.state.palace.frogMarks ||= {};
    const picture = el('img',{src:BO.palaceWatchImages?.[key] || 'assets/palace-watch/'+key+'.jpg',alt,draggable:'false'});
    hero.dataset.frogView = view;
    hero.replaceChildren(picture);
    const feedback = el('p',{class:'pf-feedback',role:'status'});
    const tools = el('div',{class:'pf-tools'},el('b',{class:'pf-place'},place));
    function pin(label,x,y,onClick) {
      const control = el('button',{type:'button',class:'pf-pin','aria-label':label,
        style:'left:clamp(23px,'+x+'%,calc(100% - 23px));top:clamp(23px,'+y+'%,calc(100% - 23px))',
        on:{click:onClick}},el('span',{'aria-hidden':'true'}));
      hero.append(control);
      return control;
    }
    function remember(k) { notes[k]=true; app.save(); }
    if (view === 'bank') {
      feedback.textContent = '『탐험대 이야기』 최온과 갈대 줄기에 매달린 개구리를 찾아보세요.';
      pin('갈대 줄기 살펴보기',14,49,()=>{remember('bank');openBook('8:3');});
    } else if (view === 'kitchen') {
      const keys = ['dough','oven'];
      const pins = scene.clues.map((clue,i)=>pin(clue.name,clue.x,clue.y,()=>{
        remember(keys[i]); s.frogLens=keys[i]; app.save(); shutter(); updateLens(); reset.focus({preventScroll:true});
      }));
      const reset = choice('부엌 전체 보기',()=>{
        delete s.frogLens; app.save(); updateLens(); pins[notes.dough && !notes.oven ? 1 : 0].focus({preventScroll:true});
      });
      function updateLens() {
        const i=keys.indexOf(s.frogLens);
        const count=keys.filter(k=>notes[k]).length;
        const clue=scene.clues[i];
        // 확대된 흔적을 가운데로 옮기되, 사진 가장자리 너머의 빈 공간은 보이지 않게 한다.
        const origin=p=>Math.min(100,Math.max(0,(2.25*p-50)/1.25));
        picture.style.transformOrigin=clue ? origin(clue.x)+'% '+origin(clue.y)+'%' : '';
        picture.classList.toggle('frog-zoom',!!clue);
        pins.forEach((control,n)=>{
          control.hidden=!!clue;
          control.setAttribute('aria-pressed',String(!!notes[keys[n]]));
        });
        reset.hidden=!clue;
        feedback.textContent=(clue ? clue.note : '휴의 관찰경으로 반죽판과 화덕을 각각 확대해 보세요.')+
          ' · 관찰 기록 '+count+'/2';
      }
      tools.append(reset); updateLens();
    } else if (s.beat === 5 || s.beat === 6) {
      const records={yard:['마당','8:13'],plea:['앞서 한 약속','8:8'],turned:['그 뒤의 반응','8:15']};
      const [label,ref]=records[view];
      if(view==='yard') feedback.textContent='온우와 마당의 기록을 펼친 뒤, 왕궁에서 한 약속과 그 뒤의 반응을 견주어 보세요.';
      else if(view==='plea')feedback.textContent='본문을 풀어 쓴 대화 · 바로　'+chapter.beats[2].words;
      else feedback.textContent='온우와 출애굽기 8장 15절을 펼쳐 바로가 어떻게 했는지 확인해 보세요.';
      const tabs=el('div',{class:'frog-records',role:'group','aria-label':'온우의 관찰 기록'});
      for(const [dest,[title]] of Object.entries(records)){
        const tab=choice(title,()=>{
          s.frogCompare=dest; app.save(); switchView(dest);
          slot.querySelector('[aria-pressed="true"]').focus({preventScroll:true});
        });
        tab.setAttribute('aria-pressed',String(dest===view));tabs.append(tab);
      }
      tools.append(tabs,choice(label+' 원문 · 출 '+ref,()=>{remember(view);openBook(ref);}));
    }
    if(feedback.textContent)tools.append(feedback);slot.replaceChildren(tools);
    return views[view][3];
  }
  function journal(openBook) {
    const m=app.state.palace.frogMarks;
    if(!m || !Object.keys(m).length)return null;
    const labels={bank:'갈대 줄기',dough:'반죽판',oven:'화덕',yard:'재앙이 그친 마당',plea:'앞서 한 약속',turned:'그 뒤의 반응'};
    const entry=el('section',{class:'pf-entry'},el('h3',{},'개구리가 뒤덮은 집'),el('p',{},'『탐험대 이야기』 관찰 기록'),
      el('ul',{},Object.entries(labels).filter(([k])=>m[k]).map(([,name])=>el('li',{},name))));
    if(m.plea && m.turned)entry.append(choice('말씀 인장 · 출 8:8, 15',()=>openBook('8:15')));
    return entry;
  }
  app.palaceFrogs={titles,beats,field,page,journal};
})();
