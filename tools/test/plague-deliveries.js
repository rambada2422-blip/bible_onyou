const assert = require('node:assert/strict');
const { spawn, spawnSync } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { setTimeout: delay } = require('node:timers/promises');

const watch = path.resolve(__dirname, '../watch-plague-deliveries.js');

test('새 접수만 검사하고 원격 오류와 실행 중단 뒤에 이어서 확인', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plague-poll-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const work = path.join(dir, 'work');
  const remote = path.join(dir, 'remote.git');
  const stateDir = path.join(dir, 'state');
  const clips = path.join(work, 'videos/exodus-plagues');
  const args = [watch, '--once', '--state-dir', stateDir];

  function command(exe, argv, cwd = dir, status = 0) {
    const result = spawnSync(exe, argv, { cwd, encoding: 'utf8', timeout: 90_000 });
    assert.equal(result.status, status, result.stderr || result.stdout || result.error?.message);
    return result;
  }
  const poll = (status = 0) => command(process.execPath, args, work, status);
  const state = () => JSON.parse(fs.readFileSync(path.join(stateDir, 'state.json'), 'utf8'));
  const events = () => fs.readFileSync(path.join(stateDir, 'events.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  const git = (...gitArgs) => command('git', gitArgs, work).stdout.trim();
  const commit = (message) => {
    git('add', '.');
    git('commit', '--quiet', '-m', message);
    git('push', '--quiet', 'origin', 'HEAD');
    return git('rev-parse', 'HEAD');
  };

  command('git', ['init', '--quiet', '--bare', remote]);
  command('git', ['-C', remote, 'config', 'uploadpack.allowFilter', 'true']);
  command('git', ['-C', remote, 'config', 'uploadpack.allowReachableSHA1InWant', 'true']);
  command('git', ['init', '--quiet', '--initial-branch=antigravity/plague-films-05-07', work]);
  git('config', 'user.name', 'Film QA test');
  git('config', 'user.email', 'film-qa@example.invalid');
  git('remote', 'add', 'origin', remote);

  const missing = poll();
  assert.match(missing.stdout, /미도착  01-04[\s\S]*미도착  05-07[\s\S]*미도착  08-10/);
  assert.equal(state().teams['05-07'].lastObserved.status, 'missing');

  fs.mkdirSync(path.join(clips, 'nested'), { recursive: true });
  fs.writeFileSync(path.join(clips, 'nested/plague-05.mp4'), '이 위치의 파일은 접수하지 않음');
  const partial = commit('하위 폴더의 파일만 추가');
  assert.match(poll().stdout, /미도착  plague-05\.mp4/);
  assert.equal(state().teams['05-07'].lastCheck.result, 'fail');
  assert.equal(state().teams['05-07'].lastCheck.sha, partial);

  const clip = path.join(clips, 'plague-05.mp4');
  command('ffmpeg', [
    '-v', 'error', '-f', 'lavfi', '-i', 'color=green:size=720x1080:rate=24:duration=6',
    '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-threads', '2', clip,
  ]);
  for (const number of ['06', '07']) fs.copyFileSync(clip, path.join(clips, `plague-${number}.mp4`));
  const playlist = path.join(dir, 'playlist.txt');
  fs.writeFileSync(playlist, `file '${clip}'\n`.repeat(3));
  command('ffmpeg', ['-v', 'error', '-f', 'concat', '-safe', '0', '-i', playlist, '-c:v', 'copy', path.join(clips, 'plague-05-07-review.mp4')]);
  const delivered = commit('팀 개별 파일과 합본 납품');
  assert.match(poll().stdout, /새 납품  05-07[\s\S]*합격 4 · 미도착 0 · 불합격 0/);
  assert.equal(state().teams['05-07'].lastCheck.result, 'pass');
  assert.equal(state().teams['05-07'].lastCheck.sha, delivered);
  assert.match(poll().stdout, new RegExp(`변경 없음  05-07 · ${delivered}`));
  assert.deepEqual(events().filter((event) => event.status === 'checked').map(({ sha }) => sha), [partial, delivered]);

  const offlineRemote = path.join(dir, 'offline.git');
  fs.renameSync(remote, offlineRemote);
  const offline = poll(2);
  assert.match(offline.stderr, /원격 브랜치 조회 실패/);
  assert.doesNotMatch(offline.stdout, /미도착/);
  assert.equal(state().lastPoll.status, 'remote-error');
  assert.equal(state().teams['05-07'].lastCheck.sha, delivered);
  fs.renameSync(offlineRemote, remote);

  git('commit', '--quiet', '--allow-empty', '-m', '같은 영상에 새 커밋');
  git('push', '--quiet', 'origin', 'HEAD');
  const updated = git('rev-parse', 'HEAD');
  const worker = spawn(process.execPath, args, { cwd: work, stdio: 'ignore' });
  const stopped = once(worker, 'close');
  const lock = path.join(stateDir, '.poll.lock');
  for (let tries = 0; !fs.existsSync(lock) && tries < 200; tries++) await delay(10);
  assert.match(fs.readdirSync(lock)[0], new RegExp(`^${worker.pid}-`));
  assert.match(poll(2).stderr, /이미 접수를 확인하고 있습니다/);
  assert.equal(worker.kill('SIGKILL'), true);
  assert.deepEqual(await stopped, [null, 'SIGKILL']);
  assert.equal(state().teams['05-07'].lastCheck.sha, delivered);

  assert.match(poll().stdout, new RegExp(`새 납품  05-07 · ${updated}`));
  assert.equal(state().teams['05-07'].lastCheck.sha, updated);
  assert.deepEqual(events().filter((event) => event.status === 'checked').map(({ sha }) => sha), [partial, delivered, updated]);
  assert.equal(git('status', '--porcelain'), '');
});
