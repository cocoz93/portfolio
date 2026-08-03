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
(`paintZones` `PJ` `wireify` 등)를 그대로 쓰고, `#p-bneck` 안을 열고 닫는 것도 `scene.js` 다.
실험 수치(`EXPS`)와 핀 정의(`PINS`), 노션 주소 표(`NOTION_EXP`)도 `scene.js` 에 있어서,
병목 수치 한 줄을 고치려 해도 씬 파일을 연다.

`bneck-tail.css` 는 병목 규칙인데 `client.css` **뒤**에 온다. 순서가 곧 우선순위라서 그렇다 —
같은 특이도로 겹치는 짝이 앞뒤 양쪽에 있다: `.bn-stage` grid(bneck.css ↔ bneck-tail.css, 근거는
common.css 의 "여기 두면 grid 선언보다 먼저 와서 못 이긴다") · `.cl-dash.spec`(client.css 는 6열,
bneck-tail.css 는 760px 이하 3열). 위로 올리면 좁은 화면에서 규격 칸이 6열로 남는다.
그 안 `.cl-dash.spec` 한 줄만 클라 것이다.

## 병렬 중에는 못 바꾸는 것

1. **조각 순서** — 셸이 들고 있다. `__scenePlay` 가 아직 없을 때 웨이브가 스스로 재생하는 식의
   순서 의존이 있어서, 마커 순서를 바꾸면 첫 로드 애니가 조용히 깨진다.
2. **window 훅** — `__flowStart` `__flowStop` `__flowReset` `__scenePlay` `__zoneTourArm`
   `resetZone` `playBneckIntro` `__EXPS` `__PINS` `__crenderPlay`.
   이름·인자를 바꾸려면 단독 작업으로.
   (`__bnPickLoc` 은 2026-08-04 에 없앴다 — 핀에서 클릭을 걷어내면서 부를 곳이 사라졌다.)
3. **DOM id** — `#p-build` `#p-bneck` `#p-crender` `#p-csafe` `#p-cload` `#p-misc` `#scene`
   `#subtabs` `#subtabs2`. `tabs.js` 가 전부 하드코딩한다.
4. **마크업 계약** — 병목 탭은 셋이 물려 있다.
   - `scene.js` 가 만들고 `bneck.js` 가 읽는다: `.pin[data-loc]` 과 그 안의 `text.pin-no`
     (배지 번호는 비어 나오고, 고른 카드의 번호를 bneck.js 가 넣는다).
   - `scene.js` 가 붙이고 `bneck.js` 가 쓴다: `EXPS[].no`(카드 번호) · `EXPS[].nt`(노션 주소).
     둘 다 `NOTION_EXP` 표가 정본 — 이 표에 있는 실험만 카드로 선다.
   - 셸이 두고 둘이 나눠 쓴다: `#bncard[hidden]`(scene.js 가 열고 닫음) · `#bnc-b`(bneck.js 가 채움).
5. **두 파일이 함께 지켜야 하는 수치** — 둘로 나뉜다.
   - *같은 값이라 한쪽만 고치면 어긋나는 것*: `1.34s`(scene.js 초 1560 · 밀리초 1671 ↔ bneck.css 145
     — scene.js 안에서도 두 벌이다) · `160ms`(common.css `.16s` ↔ wave.js `SPAN+160+100`)
   - *크기 관계라 같이 조정해야 하는 것*: 구역순회 `TOUR_HOLD 380ms`(scene.js) **>** 페이드 `.22s`(common.css) ·
     카드 짓기 `300ms`(scene.js `fillCard`) **<** 재적용 `400ms`(bneck.js) ·
     진입 끝 `BN_TOTAL 2140ms`(scene.js) **≥** 마지막 핀이 앉는 시각 `1.34s + 6×0.08s + 0.30s = 2.12s`
     (핀 지연 간격은 scene.js `animationDelay`, 드롭 길이는 common.css `bnPinDrop`).
     작으면 마지막 핀이 공중에서 규칙을 잃고 제자리로 점프한다 — 핀을 더 꽂거나 간격을 늘리면 여기부터 볼 것.
6. **클래스 접두어** — 병목 `.bn-*` `.bx-*`(카드 한 장은 `.rc`) / 클라 `.cl-*` `.cr-*`.
   `.card .stage .hit .panel` 은 이미 공유 중이니 새로 만들지 말 것.

## 산출물은 병합 뒤 한 번만 빌드

`index.html` 과 (풀 빌드면) `portfolio.html` 은 빌드 산출물이다. 병렬 브랜치에서 각자 빌드해 커밋하면
594KB 파일이 통째로 충돌한다. 작업 중에는 `build.ps1 -Fast`(→ `_preview.html`, gitignore 됨)로 보고,
**합친 뒤 한 번만** 풀 빌드해서 커밋한다.

## 조각을 옮겼을 때 확인법

순수 이동(내용 무변경)이라면 재빌드한 `index.html` 의 sha256 이 이동 전과 **같아야 한다.**
재빌드는 `-NoSync` 로 — 풀 빌드는 `sync-scene.ps1` 까지 불러 `portfolio.html` 을 건드리는데,
그쪽은 렌더 결과라 같은 입력에도 값이 흔들린다.
폰트 서브셋은 결정적이라 이 비교가 성립한다(같은 입력 → 같은 woff2 바이트, 실측 확인).
해시가 달라졌다면 줄이 새거나 줄바꿈이 바뀐 것이다 — 조각은 BOM 없는 UTF-8 · CRLF 를 지킨다.
