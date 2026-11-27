// 오프라인 배포 파일을 360px 화면에서 정상 입구부터 아홉 현장 수첩까지 검증한다.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { openOfflineBundle } = require('../game-server');
const { chromium, firefox, webkit } = require('playwright');
(async () => {
  const out = process.argv[2] || path.resolve('dist/check/expedition');
  const file = process.argv[3] || path.resolve('dist/expedition.html');
  fs.mkdirSync(out, { recursive: true });
  const engine = { chromium, firefox, webkit }[process.argv[4] || 'chromium'];
  const browser = await engine.launch(
    process.env.EXPEDITION_BROWSER_PATH ? { executablePath: process.env.EXPEDITION_BROWSER_PATH } : {}
  );
  try {
    const ctx = await browser.newContext({
      offline: engine === chromium,
      viewport: { width: 360, height: 640 }
    });
    // 파일 탐색 자체를 제한하는 엔진에서는 외부 요청을 모두 막은 상태로 파일을 연다.
    if (engine !== chromium) await ctx.route(/^https?:/, (route) => route.abort());
    const errors = [];
    ctx.on('weberror', (event) => errors.push(event.error().message));
    ctx.setDefaultTimeout(5500);
    const p = await openOfflineBundle(ctx, file, '#guided');
    const by = (name) => p.getByRole('button', { name, exact: true });
    const click = (name) => by(name).click();
    const next = () => p.getByRole('button', { name: /^다음 현장/ }).click();
    const shot = (name) => p.screenshot({ path: path.join(out, name + '.png'), fullPage: true });
    const text = async (selector, pattern) => assert.match(await p.locator(selector).innerText(), pattern);
    await p.evaluate(() => document.fonts.ready);
    await shot('01-cover');
    await click('애굽 일터로 출발 →');
    await click('흙더미');
    await text('.notice', /짚단부터/);
    const a = await by('짚단').boundingBox(),
      b = await by('흙더미').boundingBox();
    await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await p.mouse.down();
    await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 10 });
    await p.mouse.up();
    for (const [a, b] of [
      ['반죽', '이기기'],
      ['이긴 흙', '나무틀'],
      ['벽돌', '말림터']
    ]) {
      await click(a);
      await click(b);
    }
    await next();
    await click('누이 곁');
    await text('.notice', /옆 자리/);
    await click('갈대 틈');
    await click('굽은 길');
    await p.reload();
    await click('떠난 현장 이어가기 →');
    await text('.meter', /갈대 틈.*굽은 길/);
    await click('그늘길');
    await click('누이 곁');
    await click('궁의 신하');
    await text('.notice', /어머니/);
    await click('누이가 데려온 어머니');
    await click('바로의 딸');
    await text('.panel', /자라자/);
    await next();
    await click('떨기 곁에서 듣기');
    await click('모세가 돌아간 애굽으로');
    await p.locator('.backdrop').evaluate((img) => img.decode());
    for (let i = 0; i < 3; i++) {
      await click('한 동작씩');
      await click('한 동작씩');
      await p.locator('.stage').click({ position: { x: 18, y: 42 } });
      await click('사진 찍기');
      await text('.notice', /벗어났다/);
      await click('가운데');
      if (!i) await shot('02-frog');
      await click('사진 찍기');
      if (i < 2) await p.locator('.backdrop').evaluate((img) => img.decode());
    }
    assert.equal(await p.locator('.photo-strip img').count(), 3);
    await next();
    await click('집 안에서 기다리기');
    await click('일행과 출발');
    await click('뒤쪽 진영');
    await click('바람 부는 물가');
    for (let i = 1; i <= 3; i++) await click('발자국 ' + i);
    for (let i = 0; i < 3; i++) await click('소고 치기');
    await click('내 소고 가락 다시 치기');
    await next();
    await click('햇볕 길 두 걸음');
    await click('햇볕 길 두 걸음');
    await click('햇볕 길 두 걸음');
    await text('.notice', /느려졌다/);
    await shot('03-heat');
    await click('물을 나누고 쉬기');
    await click('그늘 길 한 걸음');
    await click('햇볕 길 두 걸음');
    await text('.panel', /그늘 길 1번/);
    await next();
    await click('산 아래 진영으로');
    for (const name of ['금고리', '산길', '진영']) await click(name);
    await click('성막 지을 천을 모아 달라');
    await text('.notice', /뒤의 기록/);
    await click('앞서 인도할 신을 만들어 달라');
    await next();
    for (const [a, b] of [
      ['하나님이 말씀하신 까닭', '모세가 한 말 듣기'],
      ['모세의 첫 간구', '산 아래로 내려가기'],
      ['진영을 내려다보기', '송아지와 춤추는 사람들'],
      ['이튿날의 산길', '다시 올라간 이유 기록']
    ]) {
      if (a === '진영을 내려다보기') await click('먼 진영 소리 듣기');
      await click(a);
      if (a === '진영을 내려다보기') {
        await click('싸우는 군대');
        await text('.notice', /여호수아/);
      }
      await click(b);
    }
    await next();
    await click('짐을 꾸려 떠나기');
    await text('.notice', /머물자/);
    for (const name of ['진을 치고 머물기', '짐을 꾸려 떠나기', '진을 치고 머물기', '짐을 꾸려 떠나기'])
      await click(name);
    await next();
    for (let i = 0; i < 12; i++) {
      const shade = p.getByRole('button', { name: /^(그늘 길 한 걸음|일행과 천천히)$/ });
      await shade.click();
    }
    await click('완성한 수첩 열기');
    assert.equal(await p.locator('.entry').count(), 9);
    await text('#pages', /사십 년/);
    await text('#pages', /금고리 → 산길 → 진영/);
    await p.locator('.entry').nth(1).locator('summary').click();
    await text('.entry:nth-of-type(2)', /출 2:10/);
    await shot('04-journal');
    await click('닫기');
    await p.reload();
    await click('완성한 수첩 열기');
    assert.equal(await p.locator('.entry .photo-strip img').count(), 3);
    await click('닫기');
    await p.getByRole('button', { name: /흙을 빚는 손/ }).click();
    await click('원정 첫 화면');
    await click('완성한 수첩 열기');
    assert.equal(await p.locator('.entry').count(), 9);
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    console.log('출애굽기 원정 · 오프라인 9/9, 실제 드래그·개구리 사진 3장·이어하기·수첩 재진입 · no errors');
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
