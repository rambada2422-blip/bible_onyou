async function photographFlock(page) {
  await page.evaluate(() => {
    const [x, z] = BO3D.world.P.flock;
    BO3D.debug.goto(x + 6, z + 6);
    BO3D.debug.yaw(-3 * Math.PI / 4);
  });
  // 카메라는 이동한 주인공을 뒤따라 보간된다. 한 프레임 안에 즉시 도착하지 않는다.
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: '사진 찍기' }).click();
  await page.locator('[data-detector-quiz="0"]').waitFor();
}

module.exports = { photographFlock };
