/* 개역성경 KorRV · Public Domain · scrollmapper/bible_databases 59b18c5af5845728c275d5b7178ad0d024172b1f */
(function () {
  'use strict';
  const app=BO.app2d, el=app.el;
  const verses={
    "9:1": "여호와께서 모세에게 이르시되 바로에게 들어가서 그에게 이르라 히브리 사람의 하나님 여호와께서 말씀하시기를 내 백성을 보내라 그들이 나를 섬길 것이니라",
    "9:2": "네가 만일 그들 보내기를 거절하고 억지로 잡아 두면",
    "9:3": "여호와의 손이 들에 있는 네 생축 곧 말과 나귀와 약대와 우양에게 더하리니 심한 악질이 있을 것이며",
    "9:4": "여호와가 이스라엘의 생축과 애굽의 생축을 구별하리니 이스라엘 자손에 속한 것은 하나도 죽지 아니하리라 하셨다 하라 하시고",
    "9:5": "여호와께서 기한을 정하여 가라사대 여호와가 내일 이 땅에서 이 일을 행하리라 하시더니",
    "9:6": "이튿날에 여호와께서 이 일을 행하시니 애굽의 모든 생축은 죽었으나 이스라엘 자손의 생축은 하나도 죽지 아니한지라",
    "9:7": "바로가 보내어 본즉 이스라엘의 생축은 하나도 죽지 아니하였더라 그러나 바로의 마음이 완강하여 백성을 보내지 아니하니라"
  };
  const clues=BO.palaceWatchScenes[4].clues;
  const spots=[
    {id:'halter',x:34,y:80,label:clues[0].name,note:clues[0].note},
    {id:'rail',x:65,y:56,label:clues[1].name,note:clues[1].note}
  ];
  const herd={id:'herd',x:49,y:74,label:'살아 있는 소와 송아지',note:'이스라엘 쪽 들에서 소와 송아지를 기록했어요.'};
  const labels={warning:'경고에 나온 들',preview:'이튿날의 기록',halter:spots[0].label,rail:spots[1].label,herd:herd.label,record:'이스라엘 가축의 기록',king:'바로의 결정'};
  const photo=(key,alt)=>el('img',{src:BO.palaceWatchImages?.[key] || 'assets/palace-watch/'+key+'.jpg',alt,draggable:'false'});
  const button=(label,click)=>el('button',{type:'button',class:'pf-action',on:{click}},label);
  function page(ref,close){app.openFieldScroll('9:1–7',verses,ref,close);}
  function field(hero,slot,view,s,openBook,switchView,shutter){
    const marks=app.state.palace.cattleMarks ||= {};
    const title=el('b',{class:'pf-place'}),status=el('p',{class:'pf-feedback',role:'status'});
    const tools=el('div',{class:'pf-tools'},title);
    slot.replaceChildren(tools);hero.dataset.cattleView=view;
    function mark(id){marks[id]=true;app.save();}
    function openRecord(key,ref){mark(key);openBook(ref);}
    function tabs(options,selected,saveKey,name){
      const group=el('div',{class:'cattle-tabs',role:'group','aria-label':name});
      for(const [key,label] of options){
        const tab=button(label,()=>{
          s[saveKey]=key;app.save();switchView(key);
          slot.querySelector('.cattle-tabs [aria-pressed="true"]').focus({preventScroll:true});
        });
        tab.setAttribute('aria-pressed',String(selected===key));group.append(tab);
      }
      return group;
    }
    if(view==='warning'||view==='preview'){
      const warning=view==='warning';
      const ref=warning?'9:4':'9:5';
      const pic=warning?photo('cattle-before','푸른 들에 서 있는 살아 있는 소'):photo('halter','빈 우리 앞, 주인의 손에 남은 고삐');
      title.textContent=warning?'경고에 나온 두 무리':'이튿날 · 우리 앞';
      const control=el('button',{type:'button',class:'pf-pin','aria-label':warning?'들에 있는 소 살펴보기':'고삐의 기록 펼치기',
        style:warning?'left:38%;top:59%':'left:34%;top:74%',on:{click:()=>openRecord(warning?'warning':'preview',ref)}},el('span',{'aria-hidden':'true'}));
      hero.replaceChildren(pic,control);
      status.textContent=warning?'『탐험대 이야기』 최온과 소를 짚어 보세요. 말씀에서 어느 쪽 가축을 말씀하시는지 찾아보세요.':
        '최온과 주인 손을 살펴본 뒤, 예상 하나를 골라 무슨 일이 있었는지 영상으로 보세요.';
      tools.append(status);return null;
    }
    if(view==='pen'||view==='herd'){
      const pen=view==='pen',targets=pen?spots:[herd];
      title.textContent=pen?'휴의 관찰경 · 애굽의 빈 우리':'휴의 관찰경 · 이스라엘의 들';
      tools.append(tabs([['pen','빈 우리'],['herd','가축 떼']],view,'cattlePlace','휴의 관찰 장소'));
      const frame=el('span',{class:'cattle-frame','aria-hidden':'true'});
      const surface=el('div',{class:'cattle-finder',tabindex:'0',role:'group','aria-label':'관찰경 · 방향키로 초점 이동, 엔터로 찍기'},
        photo(pen?'halter':'cattle',pen?'빈 울타리 곁에서 주인이 끝이 빈 고삐를 쥐고 서 있다':'이스라엘의 들에서 소와 양이 풀을 먹고 있다'),frame);
      const counter=el('span',{class:'cattle-count','aria-hidden':'true'});
      hero.replaceChildren(surface,counter);
      const aimKey=pen?'cattlePenAim':'cattleHerdAim';
      const stored=s[aimKey];
      let x=Number.isFinite(stored?.x)?stored.x:50,y=Number.isFinite(stored?.y)?stored.y:42;
      const current=()=>targets.find(p=>Math.abs(x-p.x)<=13 && Math.abs(y-p.y)<=15);
      const capture=button('사진 찍기',take);
      const hint=button('초점 안내',()=>{
        const spot=targets.find(p=>!marks[p.id]) || targets[0];
        move(spot.x,spot.y);commit();
        capture.focus({preventScroll:true});
      });
      function commit(){s[aimKey]={x,y};app.save();}
      function move(nx,ny){
        x=Math.round(Math.min(92,Math.max(8,nx)));y=Math.round(Math.min(88,Math.max(12,ny)));
        frame.style.left=x+'%';frame.style.top=y+'%';
        const p=current();frame.classList.toggle('in-focus',!!p);
        const count=targets.filter(p=>marks[p.id]).length;
        counter.textContent='촬영 '+count+'/'+targets.length;
        status.textContent=p ? '초점 · '+p.label+(marks[p.id]?' · 촬영한 자리':' · 사진을 찍어 보세요.') :
          (pen?'주인 손과 울타리 안을 차례로 찾아보세요.':'들에서 소와 송아지를 찾아보세요.');
      }
      function take(){
        const spot=current();
        if(!spot){status.textContent='사진 속 대상을 누르거나 초점 안내를 써 보세요.';return;}
        commit();mark(spot.id);shutter();move(x,y);
        status.textContent=spot.note+' · '+counter.textContent;
      }
      function point(event){
        const box=surface.getBoundingClientRect();
        move((event.clientX-box.left)*100/box.width,(event.clientY-box.top)*100/box.height);
      }
      surface.addEventListener('pointerdown',event=>{
        if(!event.isPrimary||event.button!==0)return;
        surface.setPointerCapture(event.pointerId);point(event);commit();
      });
      surface.addEventListener('pointermove',event=>{if(surface.hasPointerCapture(event.pointerId))point(event);});
      surface.addEventListener('lostpointercapture',commit);
      surface.addEventListener('keydown',event=>{
        const offsets={ArrowLeft:[-6,0],ArrowRight:[6,0],ArrowUp:[0,-6],ArrowDown:[0,6]};
        if(offsets[event.key]){event.preventDefault();const [dx,dy]=offsets[event.key];move(x+dx,y+dy);commit();}
        else if(event.key==='Enter'||event.key===' '){event.preventDefault();take();}
      });
      move(x,y);
      tools.append(capture,hint,status);
      if(!pen)tools.append(button('가축 기록 · 출 9:6',()=>openRecord('record','9:6')));
      return pen?'palace-cattle-pen':'palace-cattle-herd';
    }
    const king=view==='king';
    title.textContent=king?'확인한 뒤 · 바로':'사람을 보내 확인한 일';
    hero.replaceChildren(photo('cattle-king','왕궁에서 바로 앞에 사람이 서 있는 모습'));
    tools.append(tabs([['report','확인한 소식'],['king','바로의 결정']],view,'cattleEnd','온우의 기록 대조'));
    if(king){
      status.textContent='온우와 7절에서 바로가 확인한 일과 그 뒤의 결정을 읽어 보세요.';
      tools.append(button('바로의 결정 · 출 9:7',()=>openRecord('king','9:7')));
    }else{
      status.textContent='온우와 이스라엘 가축의 기록을 확인하고 바로 쪽으로 시선을 옮겨 보세요.';
      tools.append(button('가축 기록 · 출 9:6',()=>openRecord('record','9:6')));
    }
    tools.append(status);return king?null:'palace-court';
  }
  function journal(openBook){
    const marks=app.state.palace.cattleMarks;
    if(!marks||!Object.keys(marks).length)return null;
    const entry=el('section',{class:'pf-entry'},el('h3',{},'빈 우리와 살아 있는 가축'),el('p',{},'『탐험대 이야기』 관찰 기록'),
      el('ul',{},Object.entries(labels).filter(([key])=>marks[key]).map(([,label])=>el('li',{},label))));
    if(marks.record&&marks.king)entry.append(button('말씀 인장 · 출 9:6–7',()=>openBook('9:7')));
    return entry;
  }
  app.palaceCattle={verses,page,field,journal};
})();
