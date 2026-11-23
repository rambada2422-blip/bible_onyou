// 재생 단추를 누른 뒤 실제 디코딩과 마지막 프레임까지의 탐색을 확인한다.
const assert = require('node:assert/strict');

async function playToEnding(page, number, seconds) {
  const player = page.locator('video');
  const file = String(number).padStart(2, '0') + '.mp4';
  await page.waitForFunction(() => {
    const video = document.querySelector('video');
    return video && (video.error || video.currentTime > 0.1);
  });
  const media = await player.evaluate(video => ({
    error: video.error?.message, url: video.currentSrc, duration: video.duration,
    width: video.videoWidth, height: video.videoHeight
  }));
  assert.ifError(media.error);
  assert.equal(new URL(media.url).origin, new URL(page.url()).origin);
  assert(new URL(media.url).pathname.endsWith('/videos/exodus-palace/' + file));
  assert.equal(Math.round(media.duration), seconds);
  assert.deepEqual([media.width, media.height], [1920, 1080]);
  await player.evaluate(video => { video.currentTime = video.duration - 0.35; });
}

module.exports = { playToEnding };
