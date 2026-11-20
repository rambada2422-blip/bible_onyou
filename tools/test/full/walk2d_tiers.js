const { spawnSync } = require('node:child_process');
const path = require('node:path');

const outputFolder = process.argv[2];
if (!outputFolder) {
  console.error('첫 번째 인자로 화면 사진을 저장할 폴더를 지정하세요.');
  process.exit(1);
}

const walk = path.join(__dirname, '..', 'walk2d.js');
const tiers = [
  { index: '0', id: 't1', label: '8~10세' },
  { index: '2', id: 't3', label: '14~19세' },
];
let failed = false;

// 11~13세는 전체 점검의 기존 시험이 맡는다. 같은 경로를 나머지 두 나이로 걷는다.
for (const { index, id, label } of tiers) {
  console.log(`2D ${label} 시범판 자동 조작`);
  const result = spawnSync(process.execPath, [walk, index, '모세', path.resolve(outputFolder, id)], {
    encoding: 'utf8',
    timeout: 8 * 60 * 1000,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  // 기존 시험은 화면 오류를 출력한 뒤에도 0으로 끝날 수 있다.
  const expected = new RegExp(`^${id} shots: [1-9]\\d* no errors$`, 'm');
  if (result.error || result.status !== 0 || !expected.test(result.stdout || '')) {
    const reason = result.error?.code === 'ETIMEDOUT'
      ? '제한 시간 안에 끝나지 않았습니다.'
      : '끝까지 진행했고 화면 오류가 없다는 결과를 확인하지 못했습니다.';
    console.error(`실패 · ${label} ${reason}`);
    failed = true;
  }
}

process.exitCode = failed ? 1 : 0;
