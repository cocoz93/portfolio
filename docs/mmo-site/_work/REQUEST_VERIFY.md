# 요청서 — 병목 탭 수치 검사기 만들기

## 배경 (왜 이걸 시키는지)

`portfolio/docs/mmo-site` 의 병목 탭(`#bneck`)은 실험 카드 16 장이고, 각 카드를 누르면 계기판
여섯 칸(동접 · 소켓 호출 · 틱 p99 · 송신 메시지 · 평균 패킷 · 송신량)이 그려진다.
값의 출처는 노션 실측 보고서와 측정 CSV 두 가지다.

이 수치들을 여러 차례 손봤는데, **자가검증할 때마다 새로운 종류의 결함이 나왔다.**
매번 검사 기준이 달랐기 때문이다 :

| 회차 | 그때 쓴 기준 | 그래서 나온 것 |
|---|---|---|
| 1 | 값이 노션과 같은가 | 값 불일치 몇 건 |
| 2 | 값끼리 곱이 맞는가 | 출처 없이 지어낸 값 1 건 (⑩) |
| 3 | 화면이 참조하는 경로가 맞는가 | 눈금 여섯 칸 중 셋만 기준이 바뀌어 있었다 |
| 4 | 같은 런을 쓰는 카드끼리 같은가 | ⑭ 와 ⑮ 가 같은 런을 다른 숫자로 말하고 있었다 |

**중요** : 3·4 회차에서 나온 것은 "노션 표 전부와 포폴 값 전부를 대조" 해도 잡히지 않는다.
개별 값은 노션과 정확히 일치했고, 깨진 것은 **값끼리의 관계**였기 때문이다.
(⑭ 는 노션이 만 단위로 반올림한 값이 다른 팔에 붙어 있었고, ⑭·⑮ 는 노션 두 페이지가
같은 런을 각각 다르게 반올림해 적어서 양쪽 다 대조를 통과했다.)

그래서 **사람이 눈으로 대조하는 방식을 그만두고, 규칙을 스크립트로 고정**하려 한다.
앞으로 "검증해" 는 `node verify.mjs` 한 줄이 되고, 새 규칙이 생기면 스크립트에 추가한다.

---

## 할 일

### 1단계 — 출처를 데이터로 승격

지금은 각 값의 출처(CSV 런 라벨 · 노션 어느 절)가 **주석에만** 적혀 있다.
기계가 읽을 수 없으니 규칙 R1·R3 을 검사할 수 없다.

`parts/scene.js` 의 카드마다 `src` 필드를 추가한다. 주석에 이미 적힌 근거를 옮기는 작업이고,
**주석은 지우지 말고 그대로 둔다**(왜 그 값인지는 주석이 설명한다).

```js
src:{ bm:"RMB_IOCP_D1_CC5600", am:"RMC4_IOCP_D1_CC5600" },   // CSV 런이 근거일 때
src:{ bm:"notion:3ac1…#1절", am:"notion:3ac1…#1절" },        // 노션 표가 근거일 때
src:{ bm:null, am:"RMDU_IOCP_D1_CC7200(유효 2rep)" },        // 한쪽 팔이 없으면 null
```

- 주석에 런 라벨이 없는 카드는 `notion:<페이지id>` 까지만 적고 CSV 런은 `null`.
- `LOAD` 표(부하 행)의 출처도 같은 방식으로 붙인다. 표 구조를 바꾸기 싫으면
  `LOAD_SRC` 같은 별도 표로 빼도 된다 — 형태는 알아서 정하되 **기계가 읽을 수 있으면 된다**.

### 2단계 — 검사기

`docs/mmo-site/_work/verify.mjs` 를 만든다. 실행은 `node _work/verify.mjs` (cwd = `docs/mmo-site`).

`scene.js` 는 브라우저용이라 `window.__EXPS` 에 배열을 넣는 형태다. node 에서는 이렇게 읽는다 :

```js
const src = fs.readFileSync('parts/scene.js', 'utf8');
const w = {};
new Function('window', src)(w);       // 다른 전역을 건드리면 스텁을 늘릴 것
const EXPS = w.__EXPS;
```

CSV 는 `C:\Users\USER\Desktop\MyGit\MMO\Monitoring\metrics_out\window_metrics.csv`,
긴 형식이고 열은 `TimeUtc,RunLabel,WindowMin,Metric,Value,Unit,Role,LowerIsBetter`.
런 라벨의 rep 는 접미사 `_r1` `_r2` 이고 **rep 평균**을 쓴다.

---

## 검사 규칙

각 규칙에 아래 "실제로 이걸로 잡혔던 것" 을 회귀 테스트로 넣으면 좋다.

| ID | 규칙 | 이걸로 잡혔던 것 |
|---|---|---|
| **R1** | 계기판에 서는 모든 값에 `src` 가 있어야 한다. 출처 없는 값 = 위반 | ⑩ 의 송신 메시지가 근거 없이 들어가 있었다 |
| **R2** | `송신 메시지 × 평균 패킷 = 송신량` (오차 ≤ 0.5%). 세 값이 다 있는 모든 팔에서 검사 | ⑭ 가 `1,305만 × 94.9 = 1,239` 인데 옆 칸은 `1,249` 였다 |
| **R3** | `src` 가 같은 런을 가리키는 서로 다른 카드/팔은 **같은 값**이어야 한다 | ⑭ 와 ⑮ 의 '끄고' 가 같은 런인데 소켓 135.1k vs 135.2k |
| **R4** | 눈금(`bneck.js` 의 `SCALE`) 여섯 칸이 **한 런**에서 와야 한다 | 셋은 7,200 · 둘은 5,600 · 하나는 상수로 갈라져 있었다 |
| **R5** | 값이 있으면 값 라벨, 없으면 "이 시기 미수집" 라벨. 값이 있는데 미수집이라 적히거나 그 반대면 위반 | ⑫ 가 값을 넣고도 "미수집" 이라 적고 있었다 |
| **R6** | `_work/BNECK_SYNC_SPEC.md` 의 노션 대조표와 값이 일치해야 한다 | 최초 동기화 때의 값 불일치들 |
| **R7** | 하드코딩된 개수 문구가 실제 카드 수와 맞아야 한다 (`parts/*.js`, `parts/*.css`, `parts/*.html`, `mmo.src.html` 의 "실험 N 건" · "열여섯" 류) | 카드를 12 → 16 으로 늘렸는데 주석·라벨이 12 로 남아 있었다 |

**CSV 지표 이름 함정** — `tick_p99` 가 아니라 **`tick_p99_ms`** 다. 정확 일치로 물으면 빈 결과가 나와
"측정 안 했다" 로 오판하게 된다. 쓰는 이름은 :
`send_pps` · `wsa_send_rate` · `avg_pkt_bytes` · `send_mbytes_rate` · `tick_p99_ms` · `tick_avg_ms` · `broadcast_targets_per_call`

계기판 여섯 칸의 키는 `bneck.js` 의 `MET` 에 있다 : `ccu` `sock` `tick` `pps` `pkt` `send`.

---

## 통과 기준

- 위반 0 이면 `PASS` 를 찍고 exit 0, 하나라도 있으면 목록을 찍고 exit 1.
- 위반 한 줄 형식 : `[R3] ⑮ bm.sock — 같은 런 RMB_…_CC5600 인데 ⑭ 는 135070, 여기는 135200`
- 규칙별로 몇 건을 검사했는지도 한 줄씩 찍을 것. 검사 대상이 0 건인 규칙은 **통과가 아니라 경고**로
  구분해서 찍는다 (조용히 0 건 통과하면 검사기가 죽은 걸 모른다).

---

## 하지 말 것

- **값을 고치지 말 것.** 위반은 찾아서 보고만 한다. 고칠지는 사용자가 정한다.
- 노션에 다시 접속하지 말 것. 노션 값의 정본은 `_work/BNECK_SYNC_SPEC.md` 다.
- `index.html` 을 직접 고치지 말 것 — 빌드 산출물이다(`build.ps1 -NoSync` 로 생성).
- 카드의 기존 한글 주석을 지우거나 요약하지 말 것.
- `parts/*` 는 **BOM 없는 UTF-8 + CRLF** 다. 편집 후 줄바꿈을 정규화할 것.

## 참고 파일

| 무엇 | 경로 (repo = `C:\Users\USER\Desktop\MyGit\portfolio`) |
|---|---|
| 카드 데이터 | `docs/mmo-site/parts/scene.js` (`EXPS` · `LOAD` · `NOTION_EXP` · `PINS`) |
| 렌더·눈금 | `docs/mmo-site/parts/bneck.js` (`MET` · `SCALE` · `paintDash`) |
| 노션 대조표 | `docs/mmo-site/_work/BNECK_SYNC_SPEC.md` |
| 지금까지의 작업·검증 기록 | `docs/mmo-site/_work/BNECK_SYNC_STATE.md` (P7 절에 최근 4 건) |
| 측정 CSV | `C:\Users\USER\Desktop\MyGit\MMO\Monitoring\metrics_out\window_metrics.csv` |
| 빌드 | `cd docs/mmo-site && powershell -File build.ps1 -NoSync` |

## 다 만든 뒤

1. 검사기를 돌려 지금 상태의 위반 목록을 보고할 것 (고치지 말고 목록만).
2. `BNECK_SYNC_STATE.md` 에 "검사기 도입" 절을 추가하고, 앞으로 자가검증은 이 스크립트로
   대체한다고 적을 것.
3. 커밋·push 하지 말 것.
