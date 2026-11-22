const assert = require('node:assert/strict');
const { spawn, spawnSync } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { setTimeout: delay } = require('node:timers/promises');

const watch = path.resolve(__dirname, '../watch-plague-deliveries.js');
const check = path.resolve(__dirname, '../check-plague-films.js');

test('새 접수만 검사하고 원격 오류와 실행 중단 뒤에 이어서 확인', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plague-poll-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const work = path.join(dir, 'work');
  const remote = path.join(dir, 'remote.git');
  const observer = path.join(dir, 'observer.git');
  const stateDir = path.join(dir, 'state');
  const clips = path.join(work, 'videos/exodus-plagues');
  const args = [watch, '--once', '--state-dir', stateDir];

  function command(exe, argv, cwd = dir, status = 0, env = process.env) {
    const result = spawnSync(exe, argv, { cwd, env, encoding: 'utf8', timeout: 90_000 });
    assert.equal(result.status, status, result.stderr || result.stdout || result.error?.message);
    return result;
  }
  const poll = (status = 0) => command(process.execPath, args, work, status);
  const state = (folder = stateDir) => JSON.parse(fs.readFileSync(path.join(folder, 'state.json'), 'utf8'));
  const events = () => fs.readFileSync(path.join(stateDir, 'events.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  const git = (...gitArgs) => command('git', gitArgs, work).stdout.trim();
  function tracedPoll(cwd, folder, label, gitEnv = {}) {
    const trace = path.join(dir, `${label}.trace`);
    const result = command(process.execPath, [watch, '--once', '--state-dir', folder], cwd, 0, {
      ...process.env, ...gitEnv, GIT_TRACE2_EVENT: trace,
    });
    const gitCommands = fs.readFileSync(trace, 'utf8').trim().split('\n').map(JSON.parse)
      .filter((entry) => entry.event === 'cmd_name').map((entry) => entry.name);
    assert.equal(gitCommands.filter((name) => name === 'ls-remote').length, 1);
    return { stdout: result.stdout, gitCommands };
  }
  const commit = (message) => {
    git('add', '.');
    git('commit', '--quiet', '-m', message);
    git('push', '--quiet', 'origin', 'HEAD');
    return git('rev-parse', 'HEAD');
  };

  command('git', ['init', '--quiet', '--bare', remote]);
  command('git', ['-C', remote, 'config', 'uploadpack.allowFilter', 'true']);
  command('git', ['-C', remote, 'config', 'uploadpack.allowReachableSHA1InWant', 'true']);
  command('git', ['init', '--quiet', '--bare', observer]);
  command('git', ['remote', 'add', 'origin', remote], observer);
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
  const missingCommit = tracedPoll(observer, stateDir, 'missing-commit');
  assert.match(missingCommit.stdout, /미도착  plague-05\.mp4/);
  assert.ok(missingCommit.gitCommands.includes('fetch'));
  assert.equal(state().teams['05-07'].lastCheck.result, 'fail');
  assert.equal(state().teams['05-07'].lastCheck.sha, partial);
  assert.equal(state().teams['05-07'].lastCheck.source, 'remote');

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
  const original = fs.readFileSync(clip);
  fs.writeFileSync(clip, '작업 트리에만 있는 미커밋 파일');
  const refs = git('show-ref');
  const localDelivery = tracedPoll(work, stateDir, 'local');
  assert.match(localDelivery.stdout, /새 납품  05-07[\s\S]*합격 4 · 미도착 0 · 불합격 0/);
  assert.ok(!localDelivery.gitCommands.includes('fetch'));
  assert.equal(fs.readFileSync(clip, 'utf8'), '작업 트리에만 있는 미커밋 파일');
  assert.equal(git('show-ref'), refs);
  fs.writeFileSync(clip, original);
  const localCheck = state().teams['05-07'].lastCheck;
  assert.equal(localCheck.source, 'local');
  assert.equal(localCheck.result, 'pass');
  assert.equal(localCheck.sha, delivered);

  command('git', ['fetch', '--quiet', '--depth=1', '--no-tags', '--filter=blob:none', 'origin', delivered], observer);
  const blob = git('rev-parse', `${delivered}:videos/exodus-plagues/plague-05.mp4`);
  const offlineGit = { ...process.env, GIT_NO_LAZY_FETCH: '1', GIT_ALLOW_PROTOCOL: '' };
  command('git', ['cat-file', '-e', `${delivered}^{commit}`], observer, 0, offlineGit);
  command('git', ['cat-file', '-e', blob], observer, 1, offlineGit);
  const fallbackState = path.join(dir, 'fallback-state');
  const observerConfig = fs.readFileSync(path.join(observer, 'config'), 'utf8');
  const remoteDelivery = tracedPoll(observer, fallbackState, 'missing-blob', { GIT_DIR: observer, GIT_COMMON_DIR: observer });
  assert.ok(remoteDelivery.gitCommands.includes('fetch'));
  const remoteCheck = state(fallbackState).teams['05-07'].lastCheck;
  assert.equal(remoteCheck.source, 'remote');
  assert.equal(remoteCheck.sha, delivered);
  assert.equal(remoteCheck.result, localCheck.result);
  const removeTempPath = (stdout) => stdout.replace(/^개별 영상 폴더 .*\n/m, '');
  assert.equal(removeTempPath(remoteCheck.stdout), removeTempPath(localCheck.stdout));
  command('git', ['cat-file', '-e', blob], observer, 1, offlineGit);
  assert.equal(fs.readFileSync(path.join(observer, 'config'), 'utf8'), observerConfig);

  assert.match(poll().stdout, new RegExp(`변경 없음  05-07 · ${delivered}`));
  assert.deepEqual(events().filter((event) => event.status === 'checked').map(({ sha }) => sha), [partial, delivered]);

  const legacy = state();
  delete legacy.teams['05-07'].lastCheck.checkerVersion;
  legacy.teams['05-07'].lastCheck.result = 'review-needed';
  fs.writeFileSync(path.join(stateDir, 'state.json'), JSON.stringify(legacy));
  assert.match(poll().stdout, new RegExp(`판정 방식 변경 재검사  05-07 · ${delivered}`));
  assert.equal(state().teams['05-07'].lastCheck.result, 'pass');
  assert.equal(state().teams['05-07'].lastCheck.checkerVersion, 2);
  assert.match(poll().stdout, new RegExp(`변경 없음  05-07 · ${delivered}`));
  assert.deepEqual(events().filter((event) => event.status === 'checked').map(({ sha }) => sha), [partial, delivered, delivered]);

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
  assert.deepEqual(events().filter((event) => event.status === 'checked').map(({ sha }) => sha), [partial, delivered, delivered, updated]);

  const unexpected = path.join(dir, 'unexpected.mp4');
  command('ffmpeg', [
    '-v', 'error', '-f', 'lavfi', '-i', 'color=yellow:size=720x1080:rate=24:duration=6',
    '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-threads', '2', unexpected,
  ]);
  fs.writeFileSync(playlist, [clip, unexpected, clip].map((file) => `file '${file}'\n`).join(''));
  command('ffmpeg', [
    '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', playlist, '-vf', 'eq=brightness=0.01',
    '-c:v', 'libx264', '-preset', 'ultrafast', '-threads', '2', path.join(clips, 'plague-05-07-review.mp4'),
  ]);
  const needsReview = commit('합본을 다시 압축하면서 다른 장면을 삽입');
  const direct = command(process.execPath, [check, '--strict', '--group', '05-07', '--dir', clips, '--review'], work, 3);
  const hold = /결과  합격 3 · 미도착 0 · 불합격 0 · 육안 대조 필요 1/;
  assert.match(direct.stdout, hold);
  assert.match(poll().stdout, hold);
  assert.equal(state().teams['05-07'].lastCheck.sha, needsReview);
  assert.equal(state().teams['05-07'].lastCheck.exitCode, 3);
  assert.equal(state().teams['05-07'].lastCheck.result, 'review-needed');
  assert.equal(events().at(-1).check.result, 'review-needed');
  assert.equal(git('status', '--porcelain'), '');
});
