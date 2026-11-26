const assert = require('node:assert/strict');
const {pathToFileURL} = require('node:url');
const {chromium} = require(require.resolve('playwright', {paths: [process.cwd(), __dirname]}));

async function countAdvances(page, prior, detour) {
  if (prior) await page.getByLabel('E57 일지 있음').check();
  const action = name => page.locator('[data-action="' + name + '"]');
  await action('start').click();
  let count = 0;
  let visited = false;
  for (let step = 0; step < 100; step++) {
    if (await page.locator('[data-mode="done"]').count()) {
      assert.equal(visited, detour);
      return count;
    }
    if (await action('choice-3').isVisible()) {
      const turnAside = detour && !visited;
      await action(turnAside ? 'choice-3' : 'choice-4').click();
      if (turnAside) {
        await page.locator('[data-stage="3"]').waitFor();
        visited = true;
      }
    } else {
      await action('advance').click();
      count++;
    }
  }
  throw new Error('E58 끝 일지에 도착하지 못했습니다.');
}

async function checkHome(page) {
  const count = await page.getByRole('button').evaluateAll(buttons =>
    buttons.filter(button => {
      const rect = button.getBoundingClientRect();
      return rect.width && rect.height && rect.top < innerHeight && rect.bottom > 0;
    }).length);
  assert(count <= 4, '첫 화면에 보이는 단추 ' + count + '개. 목표는 네 개 이하입니다.');
  const start = page.locator('[data-action="journey-start"]');
  const box = await start.boundingBox();
  assert(box && box.y >= 0 && box.y + box.height <= 640, '스크롤 전에 시작 단추 전체가 보여야 합니다.');
  await start.click();
  await page.getByRole('slider', {name: '들판 망원경 방향'}).press('Space');
  await page.locator('[data-action="home"]').click();
  const resume = page.locator('[data-action="journey-resume"]');
  const resumedBox = await resume.boundingBox();
  assert(resumedBox && resumedBox.y >= 0 && resumedBox.y + resumedBox.height <= 640, '이어서 하기 위치');
  await resume.click();
  assert.equal(await page.evaluate(() => BO_DAVID.debug.state().pasture.seen.length), 1);
}

async function main() {
  const [job, filename] = process.argv.slice(2);
  const browser = await chromium.launch();
  try {
    const rows = [];
    const cases = job === 'entry' ? [[false,false]] : [[false,false],[false,true],[true,false],[true,true]];
    for (const [prior, detour] of cases) {
      const page = await browser.newPage({offline: true, viewport: {width: 360, height: 640}});
      page.setDefaultTimeout(8000);
      try {
        await page.goto(pathToFileURL(filename).href);
        if (job === 'entry') await checkHome(page);
        else rows.push([prior ? '있음' : '없음', detour ? '우회' : '직행', await countAdvances(page, prior, detour)]);
      } finally { await page.close(); }
    }
    console.log(JSON.stringify(rows));
  } finally { await browser.close(); }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
