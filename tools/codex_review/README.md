# Codex 2차 검토 (읽기 전용)

Claude Code가 개발하고, OpenAI Codex는 **필요할 때만 수동으로 부르는 독립 2차 검토자**로 쓴다. 운영 규칙은 `docs/08_협업운영지침.md` 9절에 있다.

- Codex는 코드를 읽기만 한다. 수정, 패치, 커밋, 자동 반복은 하지 않는다. `/codex:rescue`와 `--write`, 승인 우회와 전체 접근 옵션은 쓰지 않는다.
- Codex의 지적은 Claude가 따로 재검증한다. 수정은 대표 승인 뒤에 Claude가 한다.
- 로그인은 ChatGPT 계정 장치 코드로 한다. 인증 정보는 작업 환경의 Codex 전용 홈(`/opt/codex-iso/home`)에만 생기고, 저장소와 채팅에는 두지 않는다. API 키 과금은 쓰지 않는다.

## 필요한 것
- 작업 환경 네트워크에서 `auth.openai.com`과 `chatgpt.com`을 허용해야 한다(클라우드 개인 환경 `bible_onyou`에 설정돼 있음). `api.openai.com`은 필요 없다.
- 리눅스 작업 환경, root 권한. `unshare`, `setpriv`, `nobody` 사용자가 있어야 한다.

## 순서
```bash
sudo tools/codex_review/setup.sh            # 1. Codex 0.167.2 설치(없을 때만), 저장소 복사본 새로 받기, 실행기 설치
/opt/codex-iso/run.sh /opt/codex-iso/pretest.sh   # 2. 격리 시험: 원본이 안 보이는지, 토큰 변수가 없는지, 쓰기가 막혔는지
/opt/codex-iso/run.sh codex login --device-auth   # 3. 새 작업 환경일 때만. 화면의 코드를 대표가 입력
/opt/codex-iso/run.sh codex exec --sandbox read-only -C /opt/codex-iso/repo --json --color never "<검토 지시>" < /dev/null > 결과.jsonl   # 4. 리뷰
```
5. 원본과 복사본의 파일 지문을 리뷰 전후로 비교한다. Codex 세션 기록(`/opt/codex-iso/home/.codex/sessions`)에서 실제 적용된 `sandbox_policy: read-only`와 실제로 읽은 범위를 확인한다.
6. Claude가 지적을 하나씩 재검증하고 보고한다.

## 주의
- `< /dev/null`을 빼면 Codex가 입력을 기다리며 멈춘다.
- 복사본에는 **커밋된 상태만** 들어간다.
- 작업 환경이 새로 만들어지면 Codex 프로그램, 복사본, 로그인이 모두 사라진다. 이때는 1~3단계를 다시 한다.
- 격리(`run.sh`)는 네 겹이다. ① 새 마운트 공간에서 원본·인증 경로를 숨기고 복사본을 읽기 전용으로 붙인다 ② `nobody` 사용자로 실행한다 ③ 최소 환경 변수만 넘긴다 ④ Codex 샌드박스를 `read-only`로 둔다. 2026-11-14 첫 실험에서 네 겹 모두 시험을 통과했다.
