#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const { statSync } = require('node:fs');
const path = require('node:path');
const { parseArgs } = require('node:util');

const fps = 24;
const thumbnailBytes = 16 * 24 * 3;
const defaultDir = path.resolve(__dirname, '../videos/exodus-plagues');
const films = [12, 6, 6, 12, 6, 6, 6, 6, 12, 16].map((seconds, index) => ({
  name: `plague-${String(index + 1).padStart(2, '0')}.mp4`,
  seconds,
}));
const groups = [
  { id: '01-04', team: 'GPT', films: films.slice(0, 4), review: 'gpt-review-01-04.mp4' },
  { id: '05-07', team: '안티그래비티', films: films.slice(4, 7), review: 'plague-05-07-review.mp4' },
  { id: '08-10', team: 'Claude', films: films.slice(7), review: 'plague-08-10-review.mp4' },
];

const help = `열 가지 재앙 영상 납품 점검 (Node.js 18 이상, ffprobe 필요)

사용법  node tools/check-plague-films.js [옵션]

  --progress               접수 현황과 기술 검사 결과를 출력 (기본값)
  --strict                 미도착 또는 불합격이면 코드 1, 육안 대조가 필요하면 코드 3
  --group all|01-04|05-07|08-10
                           전체(기본값), GPT, 안티그래비티, Claude 중 선택
  --dir 폴더               개별 영상 폴더 (기본값은 저장소의 videos/exodus-plagues)
  --review                 선택한 구간의 기본 팀 합본도 검사
  --review-file 구간=경로  해당 팀 합본 경로를 직접 지정 (여러 번 사용 가능)
  --help                   이 도움말 표시

개별 파일은 plague-01.mp4부터 plague-10.mp4까지 번호 순으로 검사합니다.
팀 합본의 기본 파일명은 ${groups.map((group) => group.review).join(', ')}입니다.
직접 지정한 팀 합본은 --review 없이도 검사하며, 상대 경로는 현재 폴더를 기준으로 합니다.
합본과 개별 영상이 모두 기술 검사에 합격하면 ffmpeg로 디코딩한 프레임의 해시를 대조합니다.
해시가 다르면 구간별 화면 유사도로 순서를 확인합니다. 순서를 확인하기 어려우면 육안 대조가 필요합니다.
엄격 검사에서 미도착이나 불합격이 함께 있으면 코드 1이 우선합니다.
진척 확인은 파일별 상태를 표시하고 조회가 끝나면 코드 0으로 끝납니다.
명령 사용이나 실행 환경에 문제가 있으면 두 모드 모두 코드 2로 끝납니다.
검사 중 파일을 읽기만 합니다.`;

function readOptions(args) {
  let values;
  try {
    ({ values } = parseArgs({ args, options: {
      progress: { type: 'boolean' },
      strict: { type: 'boolean' },
      group: { type: 'string', default: 'all' },
      dir: { type: 'string', default: defaultDir },
      review: { type: 'boolean' },
      'review-file': { type: 'string', multiple: true, default: [] },
      help: { type: 'boolean', short: 'h' },
    } }));
  } catch (error) {
    const option = error.message.match(/'([^']+)'/)?.[1];
    throw new Error(`옵션을 확인하세요${option ? ` (${option})` : ''}.`);
  }
  if (values.help) return { help: true };
  if (values.progress && values.strict) throw new Error('--progress와 --strict는 하나만 선택하세요.');
  const selected = groups.filter((group) => values.group === 'all' || values.group === group.id);
  if (!selected.length) throw new Error('--group은 all, 01-04, 05-07, 08-10 중 하나여야 합니다.');
  if (!values.dir) throw new Error('--dir에 폴더 경로를 입력하세요.');

  const reviewPaths = new Map();
  for (const value of values['review-file']) {
    const match = /^(01-04|05-07|08-10)=(.+)$/s.exec(value);
    if (!match) throw new Error('--review-file은 구간=경로 형식이어야 합니다.');
    const [, id, file] = match;
    if (!selected.some((group) => group.id === id)) throw new Error(`선택한 구간에 ${id} 합본이 포함되지 않습니다.`);
    if (reviewPaths.has(id)) throw new Error(`${id} 합본 경로가 두 번 지정되었습니다.`);
    reviewPaths.set(id, path.resolve(file));
  }
  return { selected, dir: path.resolve(values.dir), strict: values.strict, review: values.review, reviewPaths };
}

function probe(file) {
  const result = spawnSync('ffprobe', [
    '-v', 'error', '-err_detect', 'explode', '-protocol_whitelist', 'file', '-f', 'mov', '-threads', '2',
    '-show_streams', '-show_format', '-show_frames', '-show_entries', [
      'stream=codec_type,codec_name,width,height,pix_fmt,time_base,start_pts,duration_ts',
      'stream_disposition=attached_pic', 'format=duration', 'format_tags=major_brand,compatible_brands',
      'frame=pts,duration,pkt_duration,width,height,pix_fmt',
    ].join(':'), '-of', 'json', '-i', file,
  ], { encoding: 'utf8', timeout: 60_000, maxBuffer: 8 * 1024 * 1024 });
  if (result.error?.code === 'ENOENT') throw new Error('ffprobe를 찾을 수 없습니다. PATH를 확인하세요.');
  if (result.error?.code === 'ETIMEDOUT') return { issues: ['ffprobe 검사가 60초 안에 끝나지 않았습니다.'] };
  if (result.error || result.status !== 0 || result.stderr.trim()) {
    const detail = (result.stderr || '').trim().split('\n')[0].slice(0, 240);
    return { issues: [`MP4 읽기 또는 디코딩 실패${detail ? ` (${detail})` : ''}`] };
  }
  try {
    return { data: JSON.parse(result.stdout) };
  } catch {
    return { issues: ['ffprobe 결과를 읽을 수 없습니다.'] };
  }
}

function isMp4(format) {
  const { major_brand: major = '', compatible_brands: compatible = '' } = format.tags ?? {};
  const mp4Brand = /^(?:iso[m2-9]|mp4[12]|avc[13]|M4[VP] |MSNV|dash|cmf[cs])$/;
  // MOV, MP4, 3GP는 ffprobe에서 같은 디멀티플렉서를 사용합니다.
  if (major === 'qt  ' || /^(?:3g|mj2|mjp2)/.test(major)) return false;
  return [major, ...(compatible.match(/.{4}/g) ?? [])].some((brand) => mp4Brand.test(brand));
}

function checkTiming(stream, frames, seconds, issues) {
  const expectedCount = seconds * fps;
  if (frames.length !== expectedCount) {
    issues.push(`전체 프레임 수 ${frames.length}개 (기준 ${expectedCount}개)`);
  }

  const [numerator, denominator] = (stream.time_base ?? '').split('/').map(Number);
  const scale = fps * numerator;
  if (!Number.isSafeInteger(scale) || !Number.isSafeInteger(denominator) || scale <= 0 || denominator < scale) {
    issues.push('24fps 표시 시각을 판정할 수 없는 시간 단위');
    return;
  }
  if (stream.duration_ts * numerator !== seconds * denominator) {
    issues.push(`영상 트랙 길이 ${stream.duration_ts * numerator / denominator || '확인 불가'}초 (기준 ${seconds}초)`);
  }
  if (!frames.length) return;

  const firstPts = frames[0].pts;
  if (!Number.isSafeInteger(firstPts) || firstPts !== stream.start_pts) {
    issues.push('영상 트랙 시작과 첫 프레임 표시 시각이 일치하지 않습니다.');
    return;
  }
  // 1/24초를 정수 틱으로 표현할 수 없는 시간 단위는 반올림 오차를 허용합니다.
  const tolerance = denominator % scale === 0 ? 0 : scale - 1;
  const irregular = frames.findIndex((frame, index) => {
    const duration = frame.duration ?? frame.pkt_duration;
    return !Number.isSafeInteger(frame.pts)
      || (index > 0 && frame.pts <= frames[index - 1].pts)
      || Math.abs((frame.pts - firstPts) * scale - index * denominator) > tolerance
      || (duration !== undefined && Math.abs(duration * scale - denominator) > tolerance);
  });
  if (irregular >= 0) issues.push(`고정 24fps 위반 (${irregular + 1}번째 프레임의 표시 시각 또는 길이)`);
}

function inspect(file, seconds) {
  try {
    if (!statSync(file).isFile()) return { status: '불합격', issues: ['일반 파일이 아닙니다.'] };
  } catch (error) {
    if (error.code === 'ENOENT') return { status: '미도착', issues: [] };
    return { status: '불합격', issues: [`파일을 열 수 없습니다 (${error.code}).`] };
  }

  const result = probe(file);
  if (result.issues) return { status: '불합격', issues: result.issues };
  const { format = {}, streams = [], frames = [] } = result.data;
  const issues = [];
  if (!isMp4(format)) issues.push('MP4 컨테이너가 아닙니다.');
  if (Number(format.duration) !== seconds) {
    issues.push(`파일 길이 ${format.duration ?? '확인 불가'}초 (기준 ${seconds}초)`);
  }
  const [stream] = streams;
  if (streams.length !== 1 || stream.codec_type !== 'video' || stream.disposition?.attached_pic) {
    const types = { video: '영상', audio: '오디오', subtitle: '자막', data: '데이터', attachment: '첨부' };
    const found = streams.map((track) => types[track.codec_type] ?? '기타').join(', ');
    issues.push(`영상 트랙 1개만 필요 (발견 ${streams.length}개${found ? ` · ${found}` : ''})`);
    return { status: '불합격', issues };
  }

  if (stream.codec_name !== 'h264') issues.push(`코덱 ${stream.codec_name ?? '확인 불가'} (기준 H.264)`);
  if (stream.width !== 720 || stream.height !== 1080) issues.push(`해상도 ${stream.width}×${stream.height} (기준 720×1080)`);
  if (stream.pix_fmt !== 'yuv420p') issues.push(`픽셀 형식 ${stream.pix_fmt ?? '확인 불가'} (기준 yuv420p)`);
  const badFrame = frames.findIndex((frame) => frame.width !== 720 || frame.height !== 1080 || frame.pix_fmt !== 'yuv420p');
  if (badFrame >= 0) issues.push(`${badFrame + 1}번째 프레임의 해상도 또는 픽셀 형식이 규격과 다릅니다.`);
  checkTiming(stream, frames, seconds, issues);
  return { status: issues.length ? '불합격' : '합격', issues };
}

function decodeFrames(file, mode) {
  const output = mode === 'hash'
    ? ['-c:v', 'rawvideo', '-pix_fmt', 'yuv420p', '-f', 'framehash', '-hash', 'sha256']
    : ['-vf', 'scale=16:24:flags=area', '-c:v', 'rawvideo', '-pix_fmt', 'rgb24', '-f', 'rawvideo'];
  const result = spawnSync('ffmpeg', [
    '-v', 'error', '-xerror', '-protocol_whitelist', 'file', '-f', 'mov', '-threads', '2', '-noautorotate', '-i', file,
    '-map', '0:v:0', '-threads', '1', '-fps_mode', 'passthrough', ...output, 'pipe:1',
  ], { timeout: 60_000, maxBuffer: 8 * 1024 * 1024 });
  if (result.error?.code === 'ENOENT') throw new Error('ffmpeg를 찾을 수 없습니다.');
  if (result.error || result.status !== 0) throw new Error(`프레임 비교 자료를 읽을 수 없습니다 (${path.basename(file)}).`);
  if (mode === 'hash') {
    return result.stdout.toString('utf8').split('\n').filter((line) => /^\s*0,/.test(line))
      .map((line) => line.slice(line.lastIndexOf(',') + 1).trim());
  }
  return Array.from({ length: result.stdout.length / thumbnailBytes }, (_, index) => {
    return result.stdout.subarray(index * thumbnailBytes, (index + 1) * thumbnailBytes);
  });
}

function compareThumbnails(reference, review, offset) {
  // 시작과 끝을 포함하여 구간마다 고르게 분산된 아홉 프레임을 비교합니다.
  for (let sample = 0; sample < 9; sample++) {
    const index = Math.round(sample * (reference.length - 1) / 8);
    let difference = 0;
    for (let channel = 0; channel < thumbnailBytes; channel++) {
      difference += Math.abs(reference[index][channel] - review[offset + index][channel]);
    }
    if (difference > 6 * thumbnailBytes) return false;
  }
  return true;
}

function identifyOrder(references, review, compare) {
  const order = [];
  let offset = 0;
  while (offset < review.length) {
    const matches = references.filter(({ frames }) => frames.length <= review.length - offset && compare(frames, review, offset));
    if (matches.length !== 1) return null;
    order.push(matches[0].name);
    offset += matches[0].frames.length;
  }
  return order.join(' → ');
}

function compareReview(films, dir, file, seconds) {
  const expected = films.map(({ name }) => name).join(' → ');
  const read = (mode) => {
    const references = films.map(({ name, seconds }) => ({ name, seconds, frames: decodeFrames(path.join(dir, name), mode) }));
    const review = decodeFrames(file, mode);
    if (references.some((film) => film.frames.length !== film.seconds * fps) || review.length !== seconds * fps) {
      throw new Error('순서 대조에서 디코딩한 프레임 수가 기술 검사 결과와 다릅니다.');
    }
    return { references, review };
  };

  const { references, review } = read('hash');
  const expectedFrames = references.flatMap(({ frames }) => frames);
  if (expectedFrames.every((hash, index) => hash === review[index])) {
    return { status: '합격', issues: [`원본과 동일한 순서 · 전체 ${review.length}프레임 해시 일치`] };
  }
  const hashOrder = identifyOrder(references, review, (frames, combined, offset) => {
    return frames.every((hash, index) => hash === combined[offset + index]);
  });
  if (hashOrder && hashOrder !== expected) {
    return { status: '불합격', issues: [`합본 순서 또는 반복 오류 (프레임 해시로 확인: ${hashOrder})`] };
  }

  const thumbnails = read('thumbnail');
  const similarOrder = identifyOrder(thumbnails.references, thumbnails.review, compareThumbnails);
  if (similarOrder === expected) {
    return { status: '합격', issues: ['화면 유사도로 구간 순서 일치 · 원본과 일부 프레임 해시 다름'] };
  }
  const detail = similarOrder ? `화면 유사도상 순서 불일치 의심: ${similarOrder}` : '프레임 해시 불일치 · 화면 유사도로 구간 순서 확인 불가';
  return { status: '육안 대조 필요', issues: [detail] };
}

function run(args) {
  const options = readOptions(args);
  if (options.help) {
    console.log(help);
    return 0;
  }
  const counts = { 합격: 0, 미도착: 0, 불합격: 0, '육안 대조 필요': 0 };
  const filmStatus = new Map();
  function show(label, seconds, { status, issues }) {
    counts[status]++;
    const detail = issues.length ? ` · ${issues.join(' / ')}` : '';
    console.log(`${status}  ${label} · ${seconds}초 · ${seconds * fps}프레임${detail}`);
  }

  console.log(`열재앙 영상 ${options.strict ? '승인 전 기술 검사' : '진척 확인'} · ${options.selected.map((group) => group.id).join(', ')}`);
  console.log(`개별 영상 폴더  ${options.dir}`);
  for (const group of options.selected) {
    for (const { name, seconds } of group.films) {
      const result = inspect(path.join(options.dir, name), seconds);
      filmStatus.set(name, result.status);
      show(name, seconds, result);
    }
  }
  for (const group of options.selected) {
    const reviewFile = options.reviewPaths.get(group.id);
    if (!options.review && !reviewFile) continue;
    const seconds = group.films.reduce((total, film) => total + film.seconds, 0);
    const file = reviewFile ?? path.join(options.dir, group.review);
    let result = inspect(file, seconds);
    if (result.status === '합격') {
      if (group.films.every(({ name }) => filmStatus.get(name) === '합격')) {
        result = compareReview(group.films, options.dir, file, seconds);
      } else {
        result.issues.push('순서 대조 보류 · 개별 영상 미도착 또는 기술 불합격');
      }
    }
    show(`${group.team} 합본 ${reviewFile ?? group.review}`, seconds, result);
  }
  const summary = Object.entries(counts).map(([status, count]) => `${status} ${count}`).join(' · ');
  console.log(`결과  ${summary}`);
  if (!options.strict) return 0;
  if (counts.미도착 || counts.불합격) return 1;
  return counts['육안 대조 필요'] ? 3 : 0;
}

try {
  process.exitCode = run(process.argv.slice(2));
} catch (error) {
  console.error(`실행 오류  ${error.message}`);
  console.error('사용법은 --help로 확인하세요.');
  process.exitCode = 2;
}
