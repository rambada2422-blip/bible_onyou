// 샤론은 양 떼를 찍은 뒤 물음 1 앞에서 처음 나와 자기소개를 한다 (docs/11 7.1. 8~10세는 두 화면).
async function passSharonIntro(page) {
  const panel = page.locator('.panel3');
  await panel.locator('[data-sharon-intro], [data-detector-quiz="0"]').first().waitFor();
  for (let i = 0; i < 3 && await panel.locator('[data-sharon-intro]').count(); i++)
    await panel.getByRole('button', { name: '다음', exact: true }).click();
  await panel.locator('[data-detector-quiz="0"]').waitFor();
}

async function photographFlock(page) {
  await page.evaluate(() => {
    const [x, z] = BO3D.world.P.flock;
    BO3D.debug.goto(x + 6, z + 6);
    BO3D.debug.yaw(-3 * Math.PI / 4);
  });
  // 카메라는 이동한 주인공을 뒤따라 보간된다. 한 프레임 안에 즉시 도착하지 않는다.
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: '사진 찍기' }).click();
  await passSharonIntro(page);
}

module.exports = { photographFlock, passSharonIntro };
