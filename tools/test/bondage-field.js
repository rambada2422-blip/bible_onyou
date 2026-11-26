const assert=require('node:assert/strict');
const path=require('node:path');
const button=(page,name)=>page.getByRole('button',{name,exact:true});
async function collectBrickPair(page){
  if(!await page.locator('.by-prints').count())return;
  await button(page,'짚 섞인 흙과 나무틀 살펴보기').click();
  await button(page,'말리는 벽돌 살펴보기').click();
}
async function resumeField(page){
  await page.reload();
  const resume=button(page,'이어서 탐험하기');
  if(await resume.isVisible())await resume.click();
}
async function playBrickField(page,out){
  const btn=n=>button(page,n);
  const point=ref=>page.locator('.wf-dialog [data-verse="'+ref+'"]');
  const picture=page.locator('.by-picture img');
  await picture.evaluate(img=>img.decode());
  assert(await picture.evaluate(img=>img.naturalWidth>=1000));
  await btn('짓고 있는 성 살펴보기').click();
  assert.match(await page.locator('.by-caption').innerText(),/새 왕/);
  await btn('운반 중인 벽돌 바구니 살펴보기').click();
  await btn('성으로 오르는 운반길 살펴보기').click();
  assert(await btn('부르짖음의 기록으로').isDisabled());
  await btn('짚 섞인 흙과 나무틀 살펴보기').focus();await page.keyboard.press('Enter');
  await resumeField(page);assert.equal(await btn('짚 섞인 흙과 나무틀 살펴보기').getAttribute('aria-pressed'),'true');
  await btn('말리는 벽돌 살펴보기').click();await picture.evaluate(img=>img.decode());
  if(out)await page.screenshot({path:path.join(out,'ex00-clay.png')});
  await btn('부르짖음의 기록으로').click();await btn('앞서 본 벽돌 일터').click();await resumeField(page);
  assert.match(await picture.getAttribute('alt'),/나무틀/);
  await btn('백성이 부르짖은 때로 돌아가기').click();
  await btn('서로 손을 잡은 백성 살펴보기').click();assert(await point('2:23').evaluate(n=>n===document.activeElement));
  await btn('닫기').click();await page.locator('dialog').waitFor({state:'detached'});
  await btn('하나님이 들으신 일 · 출 2:24').click();
  assert(await point('2:24').evaluate(n=>n===document.activeElement));
  assert.equal(await point('2:24').locator('span').innerText(),'하나님이 그 고통 소리를 들으시고 아브라함과 이삭과 야곱에게 세운 그 언약을 기억하사');
  await page.keyboard.press('Escape');await page.locator('dialog').waitFor({state:'detached'});
  if(out)await page.screenshot({path:path.join(out,'ex00-cry.png')});
  await btn('다음으로 가는 관문').click();await page.locator('.q-prompt,.findref').first().waitFor();
}
module.exports={collectBrickPair,playBrickField};
