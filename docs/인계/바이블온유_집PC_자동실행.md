# 집 PC에서 바이블 온유 자동 작업 켜기

Windows의 현재 사용자 계정으로 실행한다. Git, Python 3.10 이상(`py -3`), Node.js 20 이상, 저장소를 읽을 수 있는 GitHub 로그인이 필요하다. 스크립트가 무료 PDF·브라우저 검사 도구를 개인 폴더에 설치한다.

## 처음 한 번

1. Claude Code를 쓰려면 집 PC 터미널에서 `claude auth login`으로 **개인 유료 구독**에 로그인한다. Claude 설정의 Usage에서 사용 크레딧(Extra usage/Usage credits)과 자동 충전을 끈다. `claude auth status`에서 `claude.ai` 로그인인지 확인한다. [Claude 구독에서 CLI 사용](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan) · [사용 크레딧 설정](https://support.claude.com/en/articles/12429409-manage-usage-credits-for-paid-claude-plans)
2. Antigravity **CLI**를 설치하고 터미널에서 `agy`를 한 번 열어 개인 Google 구독으로 로그인한다. 계정의 **AI Credit Overages**를 **Never**로 설정한다. 아래 설치 명령의 `-AntigravitySubscription`은 CLI의 개인 OAuth와 `useG1Credits=false`도 설정한다. 이미 구성된 기업/API 프로필이 있으면 등록을 보류한다. [Antigravity CLI 설치·인증](https://antigravity.google/docs/cli/install/) · [구독과 초과 사용](https://antigravity.google/docs/plans/) · [비대화형 실행](https://antigravity.google/docs/cli/headless/)
3. PowerShell에서 아래를 실행한다. 기존 게임 폴더와 다른 새 폴더를 사용한다. 이미 이 자동 실행용 폴더가 있으면 그 안에서 `git pull --ff-only` 후 마지막 줄을 실행한다.

```powershell
git clone --branch antigravity/david-week https://github.com/rambada2422-blip/bible_onyou.git "$env:USERPROFILE\bible-onyou-runner"
Set-Location "$env:USERPROFILE\bible-onyou-runner"
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\tools\onyou_queue\install-windows.ps1 -ClaudeSubscription -AntigravitySubscription
```

각 구독 스위치는 **해당 개인 구독 로그인과 초과 사용 해제를 직접 확인했다**는 뜻이다. 한쪽만 준비됐으면 그쪽 스위치만 붙인다. 두 스위치를 모두 생략하면 새 설치에서는 로컬 작업부터 시작한다. 이미 등록한 계정의 결제 설정이나 로그인 계정을 바꿀 때는 먼저 아래의 `disable`을 실행한다. Claude의 계정 단위 초과 사용 스위치는 사용자가 설정 화면에서 확인한다.

설치가 끝나면 Windows 작업 스케줄러의 `BibleOnyouQueue`가 즉시 시작한다. 같은 사용자로 로그인하면 다시 시작하고 5분마다 실행기 상태를 확인한다. 채팅창과 PowerShell을 닫아도 작동한다. PC가 꺼져 있거나 절전 중이면 작업은 디스크에 남고 다음 실행에서 이어간다.

## 상태와 결과

```powershell
Get-ScheduledTaskInfo BibleOnyouQueue
py -3 .\tools\onyou_queue\runner.py status
Get-Content "$env:LOCALAPPDATA\BibleOnyou\events.jsonl" -Tail 15 -Encoding UTF8
```

| 위치 | 들어 있는 것 |
|---|---|
| `%LOCALAPPDATA%\BibleOnyou\queue.sqlite3` | 카드 목록, 의존 순서, 실행·검증 위치, 서비스별 재시도 시각, 완료 기록 |
| `%LOCALAPPDATA%\BibleOnyou\events.jsonl` | 작업별 시작·실행·검증·통과·대기 기록. `ts`는 Unix 초 단위 |
| `%LOCALAPPDATA%\BibleOnyou\background.log` | 실행기 자체 오류 |
| `%LOCALAPPDATA%\BibleOnyou\tasks\작업ID\` | 전용 Git 작업 폴더 `work`, 중간 변경·남은 일 `handoff.txt`, 결과 파일 |
| `onyou-queue/작업ID` | 검증을 통과한 담당 서비스 작업의 **집 PC 로컬 Git 브랜치**. `git branch --list 'onyou-queue/*'`로 확인 |

예를 들어 `tasks\david-offline-baseline\work\dist\david.html`은 외부 연결 없이 열 수 있다. C29의 아이용·진행자용 PDF는 `tasks\genesis-c29\work\docs\창세기\연속\`에, 인쇄면 미리보기 PNG는 `tasks\genesis-c29-print-proof\`에 생긴다.

## 실행 규칙

- 작업 카드는 [자동 실행 목록](../../tools/onyou_queue/cards.json)에 있다. 검증에 통과한 카드만 후속 작업을 연다. 원격 담당 브랜치에 이미 결과가 있으면 로컬에서 검사하고 인수한다. 총괄 브랜치에 등록한 새 카드는 가동 중 10분마다 읽는다. 실행기가 아는 검사 종류에 해당하는 카드부터 받는다.
- 공식 `claude -p`와 `agy -p`를 사용한다. API 키·클라우드 과금 환경 변수는 전달하지 않는다. Claude의 개인 구독 인증 방식과 Antigravity의 개인 OAuth·크레딧 설정을 호출 전에 확인한다. Codex 쪽의 배정·검증은 PC의 로컬 코드로 실행한다.
- 일시적인 연결 오류에는 대기 시간을 늘려 재시도한다. 한도 응답에 재시도 시각이나 간격이 있으면 그 값을 따른다. 값이 없으면 5분부터 최대 한 시간 간격으로 다시 시도한다. 같은 작업을 받을 수 있는 다른 서비스는 같은 작업 폴더와 인계 기록을 이어 쓴다. 두 구독이 모두 대기해도 준비된 로컬 작업은 계속 진행한다.
- C29 인쇄 제작과 다윗 구현은 양쪽에서 인수할 수 있다. C29의 독립 내용 대조는 창세기 담당 Claude에게 배정한다. 담당 브랜치에 검증 진행 표시가 있고 최근 활동이 있으면 결과를 먼저 기다린다. 최종 목회자 감수, 실물 시험, 기관 연락처 확정은 대표·목회자 결정을 기다린다.
- 일반 검증이 세 번 실패하면 해당 카드만 `blocked`로 남는다. 오류를 해결한 뒤 `py -3 .\tools\onyou_queue\runner.py retry 작업ID`로 그 카드만 다시 열 수 있다. 한도와 일시적인 서비스 오류는 자동 재개한다.
- 구독 호출을 끄려면 `py -3 .\tools\onyou_queue\runner.py disable claude` 또는 `disable antigravity`를 실행한다. 다음 호출부터 적용된다. 다시 켤 때는 초과 사용 해제 상태를 확인한 뒤 `enable 서비스이름 --confirmed-no-overages`를 쓴다. 설치 폴더와 상태 폴더를 유지해야 연결된 작업 폴더와 완료 기록을 이어 쓸 수 있다.

## 총괄 실행 기록 · 2026년 11월 25일

기존 `claude/auto-integration`의 인계에는 이전 여덟 갈래의 종료가 기록돼 있었다. 해당 브랜치의 GitHub 검사는 push와 PR에 반응하고, 기존 Codex 검토 스크립트는 단일 명령을 실행했다. 현재 창세기·다윗 인계에서 검증 뒤 다음 서비스를 깨우는 PC 실행기는 찾지 못했다. [이전 통합 인계](https://github.com/rambada2422-blip/bible_onyou/blob/4d1712b973aa49d8e6c6a1ace9e150dabc676789/docs/auto/integration_진행.md)

총괄 작업 환경에서 창세기 색인 66/66 대조가 통과하자 다윗 HTML 제작이 자동으로 시작됐고 D09 실조작도 통과했다. 이어 담당 브랜치의 실제 C29 놀이판과 답지를 읽어 한글 렌더·네 보기·두 정답과 장절을 확인했고, 다음 카드에서 아이용 1면과 진행자용 2면의 미리보기 PNG를 만들었다. 같은 상태 DB를 다시 연 실행은 이미 통과한 카드를 건너뛰었다. C29 내용 검증과 목회자 감수는 별도로 추적한다. [검사한 C29 원고와 PDF 폴더](https://github.com/rambada2422-blip/bible_onyou/tree/97ad500ee268ec90c53556e703ca396bf04aa857/docs/창세기/연속)

한쪽 한도 후 다른 서비스 인수, 양쪽 한도 후 예약 시각 도래, 검증 단계에서 재시작, 실패한 카드의 후속 차단, API 인증 거부는 모의 서비스 응답으로 점검했다. 이 환경에는 집 PC와 두 공식 CLI의 로그인 세션이 연결돼 있지 않아 실제 구독 호출·집 PC 예약 작업 가동은 집에서 확인해야 한다.
