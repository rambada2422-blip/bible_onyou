// Independent check of the transition named in the David work card.
const { pathToFileURL } = require('node:url');
const { chromium } = require(require.resolve('playwright', {paths:[process.cwd(), __dirname]}));
(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({offline:true, viewport:{width:390,height:760}});
    await page.goto(pathToFileURL(process.argv[2]).href);
    await page.locator('[data-field-start="D01"]').click();
    const lens = page.getByRole('slider', {name:'들판 망원경 방향'});
    for (const key of ['Space','Home','Space','End','Space']) await lens.press(key);
    await page.locator('[data-choice="horn"]').click();
    await page.locator('[data-action="next-scene"]').click();
    await page.locator('[data-brook-move="left"]').waitFor({state:'visible',timeout:5000});
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
