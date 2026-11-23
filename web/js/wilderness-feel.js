/* 같은 초상화의 입 모양과 탐험대 장비 소리. 원문을 읽는 동안에는 조용히 둔다. */
(function () {
  'use strict';
  const faces = new Map();
  function portrait(actor, expression) {
    const key=actor+'-'+expression;
    if (!faces.has(key)) {
      const xml=BO.art[actor+'-avatar'];
      if(!xml) return BO.app2d.pic(actor+'-avatar','','');
      const svg=new DOMParser().parseFromString(xml,'image/svg+xml');
      const mouth=svg.querySelector('path[stroke="#B8574B"],path[fill="#B8574B"]');
      if(mouth){
        if(mouth.nextElementSibling?.getAttribute('fill')==='#EE8E7E') mouth.nextElementSibling.remove();
        mouth.setAttribute('d', ({neutral:'M-6 28Q0 30 6 28',surprised:'M-4 28a4 5 0 1 0 8 0a4 5 0 1 0-8 0',smile:'M-9 25Q0 31 9 24Q6 40-3 35Q-7 33-9 25'})[expression]);
        mouth.setAttribute('stroke','#B8574B');mouth.setAttribute('stroke-width','2');
        mouth.style.fill=expression==='neutral'?'none':'#B8574B';
      }
      faces.set(key,'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(svg)));
    }
    return BO.app2d.el('img',{src:faces.get(key),alt:''});
  }
  function audio() {
    let ctx, bed;
    function stopBed(){if(bed){bed.stop();bed.disconnect();bed=null;}}
    function stop(){stopBed();if(ctx){ctx.close().catch(()=>{});ctx=null;}}
    function play(key,place){
      const Type=window.AudioContext||window.webkitAudioContext;
      if(!Type)return;
      try {
        if(!ctx)ctx=new Type();
        if(ctx.state==='suspended')ctx.resume().catch(()=>{});
        const t=ctx.currentTime;
        if(!bed){
          const buffer=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate), samples=buffer.getChannelData(0);
          let last=0;
          for(let i=0;i<samples.length;i++){last=.93*last+.07*(Math.random()*2-1);samples[i]=last;}
          bed=ctx.createBufferSource();bed.buffer=buffer;bed.loop=true;
          const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=place==='rock'||place==='elim'?1700:640;
          const volume=ctx.createGain();volume.gain.value=.035;
          bed.connect(filter);filter.connect(volume);volume.connect(ctx.destination);bed.start();
        }
        const notes=BO.wildField.sounds;
        (notes[key]||notes.tap).forEach((f,i)=>{
          const osc=ctx.createOscillator(),gain=ctx.createGain();
          const begin=t+i*.085, duration=key==='talk'?.035:.095;
          osc.type=key==='wood'||key==='stone'?'triangle':'sine';
          osc.frequency.setValueAtTime(f,begin);osc.frequency.exponentialRampToValueAtTime(f*.74,begin+duration);
          gain.gain.setValueAtTime(.001,begin);gain.gain.exponentialRampToValueAtTime(.075,begin+.006);gain.gain.exponentialRampToValueAtTime(.001,begin+duration);
          osc.connect(gain);gain.connect(ctx.destination);osc.start(begin);osc.stop(begin+duration+.01);
        });
      }catch(_){stop();}
    }
    return {play,stop};
  }
  BO.wildFeel={portrait,audio};
})();
