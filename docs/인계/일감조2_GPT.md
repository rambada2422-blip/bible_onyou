상태: 끝
AI: GPT(Codex)
시작: 2026-11-20 14:14 KST
줄: 조사 줄 · 참고 문서
단계: 일감 조-2 · 2D와 도구 코드 지도
브랜치: relay/docs
기준 main: 1aaa86d7cf725a741a8a4115aa673d84fbf0b1d8

## 한 일

- [2D와 도구 코드 지도](../참고/코드지도_2D와_도구.md)를 작성했다. 2D의 불러오는 순서, 파일별 역할과 찾아갈 함수, 빌드·점검·자동 조작·2D 그림 생성·Blender 도구의 입력과 출력 위치를 실제 소스에서 확인했다.
- 현재 요단 강의 JPG와 예전 SVG 생성기를 구분해서 적었다. 압도 장면 배치 자동 조작은 현재 전체 점검의 고정 목록 밖에 있어 따로 실행하는 명령을 기록했다.

## 직접 실행한 명령

| 명령 | 결과 |
|---|---|
| `node tools/build.js` | 종료 코드 0. 그림 12개, 위치 자료 5개, `dist/preview.html` 생성 확인. |
| `node tools/build3d.js` | 종료 코드 0. `dist/preview3d.html` 생성 확인. |
| `node tools/art-src/gen_alt02.js dist/alt02-jo2.svg` | 종료 코드 0. 63,582바이트 SVG와 `alt02-state-main` 확인. |

## 바뀐 파일

- `docs/참고/코드지도_2D와_도구.md`
- `docs/인계/일감조2_GPT.md`

## 점검 결과

`node tools/check.js`

```text
점검 종류: 빠른 · 통과 4/4
점검 결과: 합격
```

## 남은 일

조-2의 남은 작업은 없다. 브라우저 자동 조작과 Blender 모델 생성은 소스로 실행 방법을 확인했다.
