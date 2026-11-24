/* 실제로 디코딩된 음악의 출력단에 측정기만 연결한다. 게임의 재생 함수는 그대로 사용한다. */
const assert=require('node:assert/strict');

async function attachScoreMeter(page){
  await page.addInitScript(()=>{
    const wires=new WeakMap(), tracks=[];
    const connect=AudioNode.prototype.connect, start=AudioBufferSourceNode.prototype.start;
    AudioNode.prototype.connect=function(target,...args){
      wires.set(this,target);return connect.call(this,target,...args);
    };
    AudioBufferSourceNode.prototype.start=function(...args){
      if(this.loop&&this.buffer.duration>1){
        const bus=wires.get(wires.get(this)),meter=this.context.createAnalyser();
        connect.call(bus,meter);
        const record={source:this,bus,meter,ended:false};tracks.push(record);
        this.addEventListener('ended',()=>{record.ended=true;meter.disconnect();});
      }
      return start.apply(this,args);
    };
    window.readScore=()=>tracks.map(({source,bus,meter,ended})=>{
      const data=new Float32Array(512);meter.getFloatTimeDomainData(data);
      return {duration:source.buffer.duration,level:bus.gain.value,peak:Math.max(...data.map(Math.abs)),state:source.context.state,ended};
    });
  });
}

async function waitForAudibleCue(page,duration){
  return page.waitForFunction(expected=>{
    const latest=window.readScore().at(-1);
    return latest&&!latest.ended&&latest.state==='running'&&Math.abs(latest.duration-expected)<.15&&latest.peak>.001;
  },duration);
}

async function checkMusic(browser,origin,entry){
  const page=await browser.newPage({viewport:{width:360,height:720},hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await attachScoreMeter(page);
  const button=name=>page.getByRole('button',{name,exact:true});
  const waitForCue=duration=>waitForAudibleCue(page,duration);
  try{
    await page.goto(origin+entry+'#redsea');
    assert.deepEqual(await page.evaluate(()=>readScore()),[]);
    assert(await button('음악 듣기').isVisible());
    await button('음악 듣기').tap();await waitForCue(29.09);
    await button('뒤쪽 길 보기').tap();await waitForCue(20);
    await button('앞바다 보기').tap();await waitForCue(29.09);
    await page.waitForFunction(()=>readScore().filter(t=>!t.ended).length===1);
    await button('뒤쪽 길 보기').tap();await waitForCue(20);
    await button('음악 끄기').tap();
    await page.waitForFunction(()=>readScore().every(t=>t.ended||t.state!=='running'));
    await page.reload();await button('앞바다 보기').tap();
    assert(await button('음악 켜기').isVisible());assert.deepEqual(await page.evaluate(()=>readScore()),[]);
    await button('음악 켜기').tap();await waitForCue(29.09);
    await button('모세가 전한 말 살피기').tap();await button('바다 가운데로').tap();await waitForCue(24.61);
    const slider=page.getByRole('slider');await slider.focus();await page.keyboard.press('End');await waitForCue(18.23);
    await page.waitForFunction(()=>readScore().filter(t=>!t.ended).length===1);
    await button('건너온 바다 돌아보기').tap();await button('노랫소리를 따라가기').tap();
    await button('장단 들어 보기').tap();
    await page.waitForFunction(()=>readScore().at(-1).level<.14);
    await page.waitForFunction(()=>readScore().at(-1).level>.39);
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
    await page.waitForFunction(()=>readScore().every(t=>t.ended||t.state!=='running'));
    await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await waitForCue(18.23);
    await button('홍해 탐험 일지 열기').tap();
    await page.getByText('무엇이 두려웠을까',{exact:true}).click();
    await page.locator('.rs-frame[data-view="rear"] img').waitFor();
    await waitForCue(18.23);
    await button('탐험 입구').tap();
    await page.waitForFunction(()=>readScore().every(t=>t.state==='closed'));
    assert.deepEqual(errors,[]);
  }finally{await page.close();}
}
module.exports={checkMusic,attachScoreMeter,waitForAudibleCue};
