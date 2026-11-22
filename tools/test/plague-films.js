const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { mkdtempSync, readFileSync, rmSync, writeFileSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const cli = path.resolve(__dirname, '../check-plague-films.js');

function ffmpeg(args) {
  const result = spawnSync('ffmpeg', ['-v', 'error', '-y', ...args], { encoding: 'utf8', timeout: 30_000 });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
}

function smallFilm(file, color, options = []) {
  ffmpeg([
    '-f', 'lavfi', '-i', `color=${color}:size=720x1080:rate=24:duration=6`,
    '-an', '-c:v', 'libx264', '-preset', 'ultrafast', '-threads', '2', '-pix_fmt', 'yuv420p', ...options, file,
  ]);
}

function check(args, status) {
  const result = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', timeout: 30_000 });
  assert.equal(result.status, status, result.stderr || result.stdout || result.error?.message);
  return result.stdout;
}

test('정해진 파일명과 기술 규격으로 납품 검사', (t) => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'plague-films-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const clip = (number) => path.join(dir, `plague-${number}.mp4`);
  const args = ['--dir', dir, '--group', '05-07'];

  const missing = check([...args, '--progress', '--review'], 0);
  assert.match(missing, /미도착  plague-05\.mp4[\s\S]*미도착  plague-06\.mp4[\s\S]*미도착  plague-07\.mp4/);
  assert.match(missing, /미도착  안티그래비티 합본 plague-05-07-review\.mp4/);
  assert.doesNotMatch(missing, /plague-(04|08)\.mp4/);
  check([...args, '--strict'], 1);
  check(['--progress', '--strict'], 2);
  assert.match(check(['--help'], 0), /--review-file 구간=경로/);

  smallFilm(clip('05'), 'red');
  smallFilm(clip('06'), 'green', [
    '-vf', 'settb=1/12288,setpts=PTS+128*eq(N\\,40)', '-fps_mode', 'vfr',
    '-enc_time_base', '1:12288', '-video_track_timescale', '12288', '-bsf:v', 'setts=duration=512',
  ]);
  smallFilm(clip('07'), 'blue', ['-frames:v', '143']);
  const mixed = check([...args, '--strict'], 1);
  assert.match(mixed, /합격  plague-05\.mp4/);
  assert.match(mixed, /불합격  plague-06\.mp4[^\n]*고정 24fps 위반/);
  assert.doesNotMatch(mixed, /plague-06\.mp4[^\n]*(?:전체 프레임 수|파일 길이)/);
  assert.match(mixed, /불합격  plague-07\.mp4[^\n]*전체 프레임 수 143개/);

  ffmpeg([
    '-i', clip('05'), '-f', 'lavfi', '-i', 'anullsrc', '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'copy', '-c:a', 'aac', '-shortest', clip('06'),
  ]);
  writeFileSync(clip('07'), readFileSync(clip('05')).subarray(0, 4096));
  const tampered = check([...args, '--strict'], 1);
  assert.match(tampered, /불합격  plague-06\.mp4[^\n]*트랙 1개[^\n]*오디오/);
  assert.match(tampered, /불합격  plague-07\.mp4[^\n]*디코딩 실패/);
  assert.match(check(args, 0), /결과  합격 1 · 미도착 0 · 불합격 2/);
});
