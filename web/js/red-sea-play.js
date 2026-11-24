/* 탐험대의 손과 발에서 나는 소리와 조작. 본문 사건은 플레이 성패와 무관하다. */
(function () {
  'use strict';
  const app=BO.app2d, el=app.el;
  function instrument(){
    let audio,noise;
    function hit(kind){
      const Type=window.AudioContext||window.webkitAudioContext;
      if(!Type)return;
      try{
        if(!audio)audio=new Type();
        if(audio.state==='suspended')audio.resume().catch(()=>{});
        const t=audio.currentTime, foot=kind==='step', rim=kind==='rim';
        const pitch=rim?310:foot?94:155, duration=rim?.105:foot?.10:.25;
        const membrane=audio.createOscillator(),body=audio.createGain();
        membrane.frequency.setValueAtTime(pitch,t);
        membrane.frequency.exponentialRampToValueAtTime(pitch*.52,t+duration);
        body.gain.setValueAtTime(.001,t);
        body.gain.exponentialRampToValueAtTime(foot?.065:.24,t+.006);
        body.gain.exponentialRampToValueAtTime(.001,t+duration);
        membrane.connect(body);body.connect(audio.destination);membrane.start(t);membrane.stop(t+duration);
        if(!noise){
          noise=audio.createBuffer(1,Math.ceil(audio.sampleRate*.13),audio.sampleRate);
          const data=noise.getChannelData(0);
          for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
        }
        const skin=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();
        skin.buffer=noise;filter.type='bandpass';filter.frequency.value=rim?2200:foot?620:920;
        gain.gain.setValueAtTime(foot?.09:rim?.30:.14,t);
        gain.gain.exponentialRampToValueAtTime(.001,t+.09);
        skin.connect(filter);filter.connect(gain);gain.connect(audio.destination);skin.start(t);skin.stop(t+.10);
      }catch(_){ /* 무음에서도 그림, 단추와 장단 표시를 사용한다. */ }
    }
    function close(){if(audio)audio.close().catch(()=>{});audio=null;noise=null;}
    return {hit,close};
  }
  function walkingButton(label,step){
    let timer,held=false;
    const control=el('button',{type:'button',class:'rs-control rs-walk'},label);
    function stop(){clearTimeout(timer);timer=null;}
    function repeat(){
      held=true;
      if(step())timer=setTimeout(repeat,215);
    }
    control.addEventListener('pointerdown',event=>{
      if(!event.isPrimary||event.button!==0)return;
      stop();held=false;
      control.setPointerCapture(event.pointerId);
      timer=setTimeout(repeat,350);
    });
    for(const event of ['pointerup','pointercancel','lostpointercapture','blur'])control.addEventListener(event,stop);
    control.addEventListener('click',event=>{if(event.detail===0||!held)step();held=false;});
    return {control,stop};
  }

  const basic=['center','rim','center'],echo=['rim','center','center','rim','center'];
  const names={center:'가운데',rim:'가장자리'};
  function drumGame({state,save,sound,controls,status,footer,done}){
    const drum=el('div',{class:'rs-drum',role:'group','aria-label':'탐험대의 소고'});
    const skin=el('img',{class:'rs-drumskin',alt:'',width:440,height:440,src:BO.redSeaImages?.drum || 'assets/red-sea/drum.webp'});
    skin.addEventListener('error',()=>skin.remove(),{once:true});drum.append(skin);
    const pads={};
    const row=el('div',{class:'rs-beats','aria-label':'장단 진행'});
    const label=el('strong',{class:'rs-wide'});
    const hear=el('button',{type:'button',class:'rs-control'},'장단 들어 보기');
    const challenge=el('button',{type:'button',class:'rs-control'});
    let sequence,timers=[];
    function advanced(){return Number.isInteger(state.echoBeat);}
    function count(){return advanced()?state.echoBeat:state.beat;}
    function stop(){
      timers.forEach(clearTimeout);timers=[];
      for(const pad of Object.values(pads))pad.classList.remove('hit');
      for(const mark of row.children)mark.classList.remove('sounding');
    }
    function flash(kind,index){
      const pad=pads[kind],mark=row.children[index];
      pad.classList.add('hit');if(mark)mark.classList.add('sounding');
      timers.push(setTimeout(()=>{pad.classList.remove('hit');if(mark)mark.classList.remove('sounding');},175));
      sound.hit(kind);
    }
    function play(){
      stop();
      sequence.forEach((kind,i)=>{
        if(i===0)flash(kind,i);
        else timers.push(setTimeout(()=>flash(kind,i),430*i));
      });
    }
    function render(message){
      sequence=advanced()?echo:basic;
      label.textContent=advanced()?'탐험대 메아리 장단':'탐험대 장단';
      row.replaceChildren(...sequence.map((kind,i)=>{
        const known=!advanced()||i<count();
        return el('span',{class:i<count()?'struck':''},known?names[kind]:String(i+1));
      }));
      challenge.hidden=state.beat!==basic.length;
      challenge.textContent=advanced()?'메아리 다시 듣고 도전하기':'메아리 장단 도전';
      status.textContent=message;
    }
    function tap(kind){
      stop();
      const i=count();flash(kind,i);
      if(i===sequence.length)return;
      if(kind!==sequence[i]){
        status.textContent=advanced()?'여기서 한 번 더. 장단을 다시 들어 봐.':'이어서 '+names[sequence[i]]+'를 두드려 봐.';
        return;
      }
      if(advanced())state.echoBeat++;else state.beat++;
      save();
      render(count()===sequence.length?'장단이 이어졌어!':'다음 박자를 두드려 봐.');
    }
    for(const kind of ['center','rim']){
      const pad=el('button',{type:'button',class:'rs-pad rs-'+kind,'aria-label':names[kind]+' 치기',on:{click:()=>tap(kind)}},names[kind]);
      pads[kind]=pad;drum.append(pad);
    }
    drum.addEventListener('click',event=>{
      if(event.target!==drum)return;
      const box=drum.getBoundingClientRect();
      const radius=Math.hypot((event.clientX-box.left)/box.width-.5,(event.clientY-box.top)/box.height-.5);
      if(radius<=.5)tap(radius<=.31?'center':'rim');
    });
    hear.addEventListener('click',play);
    challenge.addEventListener('click',()=>{
      stop();state.echoBeat=0;save();render('빛나는 자리를 기억하고 다섯 박자를 따라 해 봐.');play();
    });
    controls.append(label,el('div',{class:'rs-instrument'},drum,el('div',{class:'rs-rhythm-guide'},row,hear,challenge)));
    footer.append(done);
    render(count()===((advanced()?echo:basic).length)?'장단이 이어졌어!':
      advanced()?'다섯 박자를 다시 듣고 이어서 두드려 봐.':'가운데와 가장자리에서 다른 소리가 나. 장단을 듣고 따라 두드려 봐.');
    return stop;
  }
  BO.redSeaPlay={instrument,walkingButton,drumGame};
})();
