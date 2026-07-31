# parts/ — 조각과 갈래

`mmo.src.html`(셸)이 `<!--#include … -->` 로 이 조각들을 부르고, `build.ps1` 이 합쳐 `index.html` 을 만든다.
쪼갠 목적은 **갈래별 동시 작업**이다. 한 사람이 작업할 때는 신경 쓸 것이 없다.

## 갈래는 둘이다 (셋이 아니다)

| 갈래 | 조각 |
|---|---|
| **서버** — 설계 탭 + 병목 탭 | `common.css` `bneck.css` `bneck-tail.css` `panel-build.html` `panel-bneck.html` `scene.js` `wave.js` `bneck.js` |
| **클라** — 클라이언트 3개 하위탭 | `client.css` `panel-client.html` `client-render.js` `client.js` |
| **공통** — 단독 작업만 | 셸 `mmo.src.html` · `tabs.js` |

설계 탭과 병목 탭은 **갈래로 못 나눈다.** 병목 지도를 그리는 코드가 씬 IIFE 안에 중첩돼 바깥 스코프
(`paintZones` `PJ` `wireify` 등)를 그대로 쓰고, `#p-bneck` 안을 채우고 지우는 것도 `scene.js` 다.
실험 수치(`EXPS`)와 핀 정의(`PINS`)도 `scene.js` 에 있어서, 병목 수치 한 줄을 고치려 해도 씬 파일을 연다.

`bneck-tail.css` 는 병목 규칙인데 `client.css` **뒤**에 온다. 순서가 곧 우선순위라서 그렇다
(원문 주석: "되돌리는 쪽도 그 뒤여야 이긴다"). 위로 올리면 화면이 깨진다. 그 안 `.cl-dash.spec` 한 줄만 클라 것이다.

## 병렬 중에는 못 바꾸는 것

1. **조각 순서** — 셸이 들고 있다. `__scenePlay` 가 아직 없을 때 웨이브가 스스로 재생하는 식의
   순서 의존이 있어서, 마커 순서를 바꾸면 첫 로드 애니가 조용히 깨진다.
2. **window 훅** — `__flowStart` `__flowStop` `__flowReset` `__scenePlay` `__zoneTourArm`
   `resetZone` `playBneckIntro` `__EXPS` `__crenderPlay`. 이름·인자를 바꾸려면 단독 작업으로.
3. **DOM id** — `#p-build` `#p-bneck` `#p-crender` `#p-csafe` `#p-cload` `#p-misc` `#scene`.
   `tabs.js` 가 전부 하드코딩한다.
4. **마크업 계약** — `scene.js` 가 만들고 `bneck.js` 가 읽는다:
   `button.exp[data-s]` · `.pin[data-loc]` · `#bnc-nav button[data-loc]` · `#bncard[hidden]`.
5. **양쪽에 적힌 같은 값** — 한쪽만 고치면 어긋난다:
   `1.34s`(scene.js ↔ bneck.css ↔ common.css) · `190ms`(common.css ↔ wave.js `SPAN+190+100`) ·
   `380ms` 구역순회(scene.js ↔ common.css `.22s`) · `300ms` fillCard ↔ `400ms` 재적용(bneck.js).
6. **클래스 접두어** — 병목 `.bn-*` `.bx-*` / 클라 `.cl-*` `.cr-*`.
   `.exp .rs .nm .card .stage .hit .cap .panel` 은 이미 공유 중이니 새로 만들지 말 것.

## 산출물은 병합 뒤 한 번만 빌드

`index.html` 과 (풀 빌드면) `portfolio.html` 은 빌드 산출물이다. 병렬 브랜치에서 각자 빌드해 커밋하면
594KB 파일이 통째로 충돌한다. 작업 중에는 `build.ps1 -Fast`(→ `_preview.html`, gitignore 됨)로 보고,
**합친 뒤 한 번만** 풀 빌드해서 커밋한다.

## 조각을 옮겼을 때 확인법

순수 이동(내용 무변경)이라면 재빌드한 `index.html` 의 sha256 이 이동 전과 **같아야 한다.**
폰트 서브셋은 결정적이라 이 비교가 성립한다(같은 입력 → 같은 woff2 바이트, 실측 확인).
해시가 달라졌다면 줄이 새거나 줄바꿈이 바뀐 것이다 — 조각은 BOM 없는 UTF-8 · CRLF 를 지킨다.
