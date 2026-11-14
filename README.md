# bible_onyou

성경의 장소를 탐험하는 휴대폰용 스토리 RPG (8~19세). 현재 단계는 출애굽기 시범판.

## 문서

- [docs/00_공통규칙서.md](docs/00_공통규칙서.md): 모든 작업 전에 읽는 기준 문서
- [docs/01_출애굽기_장면목록.md](docs/01_출애굽기_장면목록.md): 장면별 근거 장절과 감수 필수 여부
- [docs/02_그림_스타일가이드.md](docs/02_그림_스타일가이드.md): 그림 규칙과 파일 규격
- [docs/05_본제작_지시서.md](docs/05_본제작_지시서.md): 본 제작 작업 순서와 결정 사항
- [docs/08_협업운영지침.md](docs/08_협업운영지침.md): 대표·GPT·Claude Code 협업 방식과 보고 형식
- [tools/codex_review/README.md](tools/codex_review/README.md): Codex 2차 검토(읽기 전용) 실행 방법

## 시범 화면

`web/` 폴더가 게임 화면이다. 설치할 것 없이 `web/index.html`을 브라우저로 열면 된다.

| 위치 | 내용 |
|---|---|
| `web/js/content.js` | 장면 대본, 질문, 정답 장절 (나이 단계별) |
| `web/js/app.js` | 화면과 진행 |
| `web/css/app.css` | 화면 디자인 |
| `web/assets/` | 배경 그림과 캐릭터 그림 (SVG) |
| `web/js/art.js` | 그림을 한 파일로 묶은 것. 직접 고치지 않는다 |

그림을 바꾼 뒤에는 묶음 파일을 다시 만든다.

```bash
node tools/build.js
```

이 명령은 `dist/preview.html`(한 파일짜리 미리보기)도 함께 만든다.

## 3D 한 장면 샘플

`web3d/` 폴더는 떨기나무 장면을 3D로 만든 샘플이다. 주인공을 직접 움직여 탐험하는 구조를 확인하기 위한 것이며, 그래픽은 코드로 만든 단순한 3D다. `web3d/index.html`을 브라우저로 열면 된다.

| 위치 | 내용 |
|---|---|
| `web3d/js/world.js` | 지형, 하늘, 빛, 소품 배치. 떨기나무 언덕(호렙 산줄기 끝)과 모세가 걷는 길 |
| `web3d/js/flock.js` | 양 떼 40마리 (한 번에 그려 휴대폰에서도 가볍다) |
| `web3d/js/models.js` | 세 아이, 모세, 양, 떨기나무, 타임머신 등 3D 모델 |
| `web3d/js/content3d.js` | 부품 찾기 성경 물음, 압도 장면 자막, 시대 추리 문구 |
| `web3d/js/fx.js` | 불꽃, 빛 번짐, 합성 소리(바람·불·양 울음·정적·조용한 음악) |
| `web3d/assets/vision_bush.mp4` | 압도 장면 영상 (Blender로 미리 그린 것. 있으면 올려다보기 뒤에 재생, 없으면 건너뜀) |
| `web3d/js/game.js` | 조작, 카메라, 진행, 화면 위 안내 |
| `web3d/vendor/` | three.js r128 (MIT 라이선스) |

대본은 2D 시범판과 같은 `web/js/content.js`를 쓴다. 한 파일짜리 미리보기는 아래 명령으로 만든다.

```bash
node tools/build3d.js
```

자동 점검: `node tools/test/walk3d.js <단계 0~2> <저장 폴더>` (자세한 것은 `tools/test/README.md`).
휴대폰에서 장소 이름을 세 번 빠르게 누르거나 주소 끝에 `#fps`를 붙이면 초당 장면 수가 보인다.

## 압도 장면 영상 (Blender)

- `tools/blender/bush_vision.py`: 불붙은 떨기나무 장면(사실적인 덤불, 불, 바위, 모세). `--shots A,B,C,D`로 정지 화면을 뽑는다.
- `tools/blender/vision_video.py`: 같은 장면을 층으로 나눠 그린 뒤 합쳐 30초 영상(`vision_bush.mp4`)을 만든다. 약 3~4시간.
- `tools/blender/moses_real.py`: 영상용 사실적 모세(뒷모습과 윤곽만 보인다. 얼굴은 만들지 않는다).
- bpy 설치: `uv venv --python 3.13 venv && VIRTUAL_ENV=venv uv pip install bpy`

사실적 3D 외주 제작의 비용 자료는 [docs/04_외주_시세조사.md](docs/04_외주_시세조사.md)에 있다.
