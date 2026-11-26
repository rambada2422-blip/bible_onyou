// 8~10세 떨기나무 이야기의 '글에서 찾기' 대목을 지나간다 (web/js/content.js 머리말의 find).
// 대목 글 속의 찾을 말을 모두 누르고, 찾은 뒤의 화면 ('다음' 단추)이 나올 때까지 기다린다. 지나간 찾기 대목 수를 돌려준다.
async function passFindWords(page) {
  let passed = 0;
  for (let guard = 0; guard < 10 && await page.locator('.narr.findtext').count(); guard++) {
    const left = page.locator('.narr.findtext .find-word:not(.found)');
    if (await left.count()) { await left.first().click(); continue; }
    await page.locator('.narr.findtext').waitFor({ state: 'detached' });
    passed++;
  }
  return passed;
}

module.exports = { passFindWords };
