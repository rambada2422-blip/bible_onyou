#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { parseArgs } = require('node:util');

const filmFolder = 'videos/exodus-plagues';
// 검사 결과의 의미가 바뀌면 기존 SHA를 한 번 다시 확인합니다.
const checkerVersion = 2;
const teams = {
  '01-04': 'gpt/plague-films-01-04',
  '05-07': 'antigravity/plague-films-05-07',
  '08-10': 'claude/plague-films-08-10',
};
const help = `열재앙 영상 새 납품 확인 (Node.js 18 이상, Git, ffprobe 필요)

사용법  node tools/watch-plague-deliveries.js --once --state-dir 폴더 [--remote 원격]

  --once           이번 한 번만 확인합니다. 반복 실행은 스케줄러에서 설정합니다.
  --state-dir 폴더  다음 실행에도 사용할 폴더. state.json과 events.jsonl을 남깁니다.
  --remote 원격     현재 저장소의 원격 이름, Git URL 또는 로컬 원격 경로 (기본값 origin)
  --help           이 도움말 표시

팀 브랜치 ${Object.values(teams).join(', ')}를 조회합니다.
새 커밋의 ${filmFolder} 바로 아래 MP4를 임시 폴더에 받아 기술 검사합니다.
원격과 현재 저장소는 읽기만 합니다. 기술 검사 결과와 마지막 접수 상태를 기록합니다.
육안 대조가 필요한 납품은 review-needed로 기록하여 합격과 구분합니다.
기술 검사 결과의 판정 방식이 바뀌면 같은 커밋도 한 번 다시 검사합니다.
원격 또는 실행 오류가 있으면 코드 2, 이번 조회를 마치면 코드 0으로 끝납니다.`;

function git(args, options = {}) {
  return spawnSync('git', args, {
    encoding: 'utf8', timeout: 60_000, maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }, ...options,
  });
}

function gitOutput(result, stage, remote = '') {
  if (result.status === 0 && !result.error) return result.stdout;
  let detail = (result.stderr || result.error?.message || '').trim().split('\n')[0];
  if (remote) detail = detail.replaceAll(remote, '[원격]');
  throw new Error(`${stage}${detail ? ` (${detail.slice(0, 220)})` : ''}`);
}

function resolveRemote(value) {
  const configured = git(['remote', 'get-url', '--', value]);
  if (configured.error?.code === 'ENOENT') throw new Error('git을 찾을 수 없습니다. PATH를 확인하세요.');
  const location = configured.status === 0 ? configured.stdout.trim() : value;
  if (!location || location.startsWith('-')) throw new Error('원격 이름 또는 경로를 확인하세요.');
  return !path.isAbsolute(location) && /^[^/\\]+:/.test(location) ? location : path.resolve(location);
}

function livePoll(pid) {
  if (!Number.isSafeInteger(pid) || pid < 1) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code !== 'ESRCH';
  }
}

function lockState(dir) {
  const candidate = fs.mkdtempSync(path.join(dir, '.poll-'));
  const owner = `${process.pid}-${path.basename(candidate).slice('.poll-'.length)}`;
  const lock = path.join(dir, '.poll.lock');
  function removeEmptyLock() {
    try {
      fs.rmdirSync(lock);
    } catch (error) {
      if (!['ENOENT', 'ENOTEMPTY', 'EEXIST'].includes(error.code)) throw error;
    }
  }
  try {
    fs.writeFileSync(path.join(candidate, owner), '');
    try {
      fs.renameSync(candidate, lock);
    } catch (error) {
      if (!['EEXIST', 'ENOTEMPTY', 'EPERM'].includes(error.code) || !fs.existsSync(lock)) throw error;
      const previous = fs.readdirSync(lock).find((entry) => /^\d+-\w+$/.test(entry));
      if (previous && livePoll(Number(previous.split('-')[0]))) {
        throw new Error('이 상태 폴더에서 이미 접수를 확인하고 있습니다.');
      }
      // 오래된 소유 파일만 지워 다른 실행이 방금 잡은 잠금을 보호합니다.
      if (previous) fs.rmSync(path.join(lock, previous), { force: true });
      removeEmptyLock();
      fs.renameSync(candidate, lock);
    }
  } finally {
    fs.rmSync(candidate, { recursive: true, force: true });
  }
  return () => {
    fs.rmSync(path.join(lock, owner), { force: true });
    removeEmptyLock();
  };
}

function createStore(dir, remote) {
  const stateFile = path.join(dir, 'state.json');
  const eventsFile = path.join(dir, 'events.jsonl');
  const remoteId = createHash('sha256').update(remote).digest('hex');
  let state = { version: 1, remoteId, teams: {} };
  try {
    state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (state?.version !== 1 || !state.teams || state.remoteId !== remoteId) {
    throw new Error('기존 상태 형식 또는 원격이 다릅니다. 상태 폴더를 확인하세요.');
  }
  function save(event) {
    const pending = `${stateFile}.${process.pid}.tmp`;
    fs.writeFileSync(pending, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
    fs.renameSync(pending, stateFile);
    if (event) fs.appendFileSync(eventsFile, `${JSON.stringify(event)}\n`, { mode: 0o600 });
  }
  return { state, save };
}

function remoteHeads(remote) {
  const refs = Object.values(teams).map((branch) => `refs/heads/${branch}`);
  const output = gitOutput(git(['ls-remote', '--heads', '--', remote, ...refs]), '원격 브랜치 조회 실패', remote);
  const heads = new Map();
  for (const row of output.split('\n').filter(Boolean)) {
    const [sha, ref] = row.split('\t');
    if (!/^[a-f0-9]{40,64}$/.test(sha) || !refs.includes(ref)) throw new Error('원격 브랜치 응답을 읽을 수 없습니다.');
    heads.set(ref.slice('refs/heads/'.length), sha);
  }
  return heads;
}

function createStaging(remote) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plague-poll-'));
  const repo = path.join(dir, 'objects.git');
  const run = (args, options) => git([`--git-dir=${repo}`, ...args], options);
  const cleanup = () => fs.rmSync(dir, { recursive: true, force: true });
  try {
    gitOutput(git(['init', '--quiet', '--bare', repo]), '임시 Git 저장소 초기화 실패');
    gitOutput(run(['remote', 'add', 'delivery', remote]), '임시 원격 등록 실패', remote);
  } catch (error) {
    cleanup();
    throw error;
  }

  function receive(group, sha) {
    // 트리만 먼저 받아 최상위 MP4에 해당하는 블롭만 따로 읽습니다.
    gitOutput(run(['fetch', '--quiet', '--depth=1', '--no-tags', '--filter=blob:none', 'delivery', sha]), '새 납품 커밋 받기 실패', remote);
    const treeEntry = gitOutput(run(['ls-tree', sha, '--', filmFolder]), '영상 폴더 조회 실패');
    const tree = /^040000 tree ([a-f0-9]+)\t/.exec(treeEntry)?.[1];
    const folder = fs.mkdtempSync(path.join(dir, `${group}-`));
    if (!tree) return folder;
    const files = gitOutput(run(['ls-tree', '-z', tree]), '영상 파일 목록 조회 실패');
    for (const entry of files.split('\0')) {
      const match = /^100(?:644|755) blob ([a-f0-9]+)\t([^/\\]+\.mp4)$/s.exec(entry);
      if (!match) continue;
      const [, oid, name] = match;
      const fd = fs.openSync(path.join(folder, name), 'wx', 0o600);
      try {
        gitOutput(run(['cat-file', 'blob', oid], { stdio: ['ignore', fd, 'pipe'] }), `영상 읽기 실패 (${name})`, remote);
      } finally {
        fs.closeSync(fd);
      }
    }
    return folder;
  }
  return { receive, cleanup };
}

function check(group, dir) {
  const cli = path.join(__dirname, 'check-plague-films.js');
  const result = spawnSync(process.execPath, [cli, '--strict', '--review', '--group', group, '--dir', dir], {
    encoding: 'utf8', timeout: 300_000, maxBuffer: 1024 * 1024,
  });
  const { status: exitCode, stdout, stderr } = result;
  const statuses = { 0: 'pass', 1: 'fail', 3: 'review-needed' };
  if (result.error || !statuses[exitCode]) {
    throw new Error(`기술 검사 실행 실패 (${result.error?.message ?? stderr.trim()})`);
  }
  return { exitCode, result: statuses[exitCode], stdout, stderr };
}

function poll(remote, dir) {
  const { state, save } = createStore(dir, remote);
  const at = new Date().toISOString();
  let heads;
  try {
    heads = remoteHeads(remote);
  } catch (error) {
    state.lastPoll = { at, status: 'remote-error', detail: error.message };
    save(state.lastPoll);
    throw error;
  }

  let staging;
  let failed = false;
  try {
    for (const [group, branch] of Object.entries(teams)) {
      const team = state.teams[group] ??= { branch };
      const sha = heads.get(branch);
      if (!sha) {
        const alreadyMissing = team.lastObserved?.status === 'missing';
        team.lastObserved = { at, status: 'missing' };
        if (!alreadyMissing) save({ ...team.lastObserved, group, branch });
        console.log(`미도착  ${group} · ${branch}`);
        continue;
      }
      const sameSha = team.lastCheck?.sha === sha;
      if (sameSha && team.lastCheck.checkerVersion === checkerVersion) {
        team.lastObserved = { at, status: 'unchanged', sha };
        console.log(`변경 없음  ${group} · ${sha}`);
        continue;
      }

      try {
        staging ??= createStaging(remote);
        const result = check(group, staging.receive(group, sha));
        team.lastCheck = { sha, checkedAt: new Date().toISOString(), checkerVersion, ...result };
        team.lastObserved = { at, status: 'checked', sha };
        save({ ...team.lastObserved, group, branch, check: team.lastCheck });
        console.log(`${sameSha ? '판정 방식 변경 재검사' : '새 납품'}  ${group} · ${sha}\n${result.stdout.trimEnd()}`);
      } catch (error) {
        failed = true;
        team.lastObserved = { at, status: 'error', sha, detail: error.message };
        save({ ...team.lastObserved, group, branch });
        console.error(`접수 오류  ${group} · ${sha} · ${error.message}`);
      }
    }
  } finally {
    staging?.cleanup();
  }
  state.lastPoll = { at, status: failed ? 'partial-error' : 'ok' };
  save();
  return failed ? 2 : 0;
}

function run(args) {
  let values;
  try {
    ({ values } = parseArgs({ args, options: {
      once: { type: 'boolean' }, 'state-dir': { type: 'string' },
      remote: { type: 'string', default: 'origin' }, help: { type: 'boolean', short: 'h' },
    } }));
  } catch {
    throw new Error('옵션을 확인하세요. 사용법은 --help로 확인할 수 있습니다.');
  }
  if (values.help) {
    console.log(help);
    return 0;
  }
  if (!values.once || !values['state-dir']) throw new Error('--once와 --state-dir 폴더가 필요합니다.');
  const remote = resolveRemote(values.remote);
  const dir = path.resolve(values['state-dir']);
  fs.mkdirSync(dir, { recursive: true });
  const unlock = lockState(dir);
  try {
    return poll(remote, dir);
  } finally {
    unlock();
  }
}

try {
  process.exitCode = run(process.argv.slice(2));
} catch (error) {
  console.error(`접수 오류  ${error.message}`);
  process.exitCode = 2;
}
