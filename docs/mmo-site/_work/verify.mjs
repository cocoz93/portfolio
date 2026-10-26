/* ═══════════ 병목 탭 수치 검사기 ═══════════
   실행 : node _work/verify.mjs      (경로는 이 파일 기준이라 cwd 는 아무데나 둬도 된다)

   왜 있나 — 값을 손볼 때마다 매번 다른 기준으로 눈검사를 해서, 그때마다 새로운 종류의 결함이
   나왔다. 개별 값이 노션과 일치해도 **값끼리의 관계**가 깨질 수 있다는 것이 요점이다
   (같은 런을 두 카드가 다른 숫자로 말하거나, 눈금 여섯 칸이 서로 다른 부하점에서 오거나).
   그래서 기준을 사람이 아니라 아래 규칙에 박아 둔다.

   R0  검사기가 보는 자리(화면이 대표 지표·설명을 읽는 배선 · 카드 수)가 그대로인가  ← 검사기가 죽는 것을 막는 자리
   R1  실험 데이터의 여섯 지표 값마다 출처(src)가 있는가
   R2  송신 메시지 × 평균 패킷 = 송신량 (오차 ≤ 0.5%)
   R3  같은 출처를 가리키는 값끼리 같은가
   R6  BNECK_SYNC_SPEC.md(노션 대조 정본)와 값이 같은가
   R7  하드코딩된 개수 문구가 실제 카드 수와 맞는가
   R8  카드가 크게 세우는 대표 지표(scene.js FACE)가 가리킨 값과 맞는가 — 부호 · 퍼센트 · 판정과 고리 색

   ※ R4(눈금 여섯 칸이 한 런) · R5(값과 라벨의 짝)는 2026-10-26 에 걷었다. 둘 다 화면의 계기판
     여섯 칸(bneck.js 의 SCALE · paintDash 라벨)을 보던 규칙인데, 오른쪽 판이 '한 장 + 대표 지표 하나' 로
     바뀌며 계기판이 없어졌다. 여섯 지표 값 자체(bm · am · ld)는 scene.js 에 남아 R1~R3 · R6 이 계속 본다.

   ※ 이 검사기는 **값을 고치지 않는다.** 찾아서 보고만 한다. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, "..");                    /* docs/mmo-site */
const CSV_PATH = process.env.MMO_METRICS_CSV ||
  "C:\\Users\\USER\\Desktop\\MyGit\\MMO\\Monitoring\\metrics_out\\window_metrics.csv";
const rd = p => fs.readFileSync(path.join(SITE, p), "utf8");

/* ── 보고 판 ── */
const RULES = [
  ["R0", "검사 전제"], ["R1", "출처"], ["R2", "곱셈 정합"], ["R3", "같은 런 같은 값"],
  ["R6", "명세 대조"], ["R7", "개수 문구"], ["R8", "대표 지표"]
];
const S = {};
RULES.forEach(([id]) => S[id] = { n: 0, viol: [], warn: [] });
const viol = (id, where, msg) => S[id].viol.push(`[${id}] ${where} — ${msg}`);
const warn = (id, where, msg) => S[id].warn.push(`${where} — ${msg}`);
const nf = v => v == null ? "—" : (typeof v === "number"
  ? v.toLocaleString("ko-KR", { maximumFractionDigits: 4 }) : String(v));

/* ═══ scene.js 읽기 — 브라우저용 파일이라 DOM 을 흉내 낸 스텁 위에서 돌린다 ═══
   window.__EXPS 를 넣는 자리가 `document.getElementById("bnscene")` 가 있어야 지나가는
   IIFE 안이라(없으면 early return), 스텁은 무엇을 물어도 자기 자신을 돌려주는 Proxy 로 둔다. */
function loadEXPS(srcText) {
  const stub = new Proxy(function () {}, {
    get(t, k) { if (k === Symbol.toPrimitive) return () => 0; if (k === "length") return 0; return stub; },
    set() { return true; }, apply() { return stub; }, construct() { return stub; }, has() { return true; }
  });
  const g = globalThis;
  const keep = { document: g.document, matchMedia: g.matchMedia, requestAnimationFrame: g.requestAnimationFrame,
                 cancelAnimationFrame: g.cancelAnimationFrame, getComputedStyle: g.getComputedStyle };
  g.document = stub;
  g.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });
  g.requestAnimationFrame = () => 0;
  g.cancelAnimationFrame = () => {};
  g.getComputedStyle = () => stub;
  const w = { addEventListener() {}, removeEventListener() {}, matchMedia: g.matchMedia,
              requestAnimationFrame: g.requestAnimationFrame, innerWidth: 1920, innerHeight: 1080,
              performance, setTimeout, location: { hash: "" },
              console: { log() {}, warn() {}, error() {} } };
  const cw = console.warn, cl = console.log;
  console.warn = () => {}; console.log = () => {};          /* 씬이 콘솔에 남기는 말을 삼킨다 */
  try { new Function("window", srcText)(w); }
  finally { console.warn = cw; console.log = cl; Object.assign(g, keep); }
  return w.__EXPS;
}

/* ═══ 실험 데이터의 여섯 지표 ═══
   ld:1 인 둘은 값이 bm/am 이 아니라 LOAD 표(e.ld)에서 온다.
   ※ 한때 bneck.js 계기판(MET)의 사본이었고 R0 이 둘을 대조했다. 계기판을 걷은 뒤(2026-10-26)로는
     화면 쪽 원본이 없다 — 이 목록이 곧 scene.js 실험 데이터의 지표 목록이다. */
const MET = [
  { k: "ccu",  n: "동접" },        { k: "sock", n: "소켓 호출", ld: 1 }, { k: "tick", n: "틱 p99" },
  { k: "pps",  n: "송신 메시지" }, { k: "pkt",  n: "평균 패킷", ld: 1 }, { k: "send", n: "송신량" }
];

const tag = e => e.no ? String.fromCharCode(0x245F + e.no) : `s:${e.s}(${e.n})`;
const CSVMET = { ccu: "session_count", sock: "wsa_send_rate", tick: "tick_p99_ms",
                 pps: "send_pps", pkt: "avg_pkt_bytes", send: "send_mbytes_rate" };

/* 한 카드의 계기판 열두 자리(여섯 칸 × 끄고·켜고)를 값·출처와 함께 편다.
   ld 칸의 규칙은 옛 계기판(bneck.js paintDash · 2026-10-26 까지)과 같다 — 켜고 값이 없으면 켜고 자리에 끄고 값 하나만 세우고,
   그때 끄고 자리는 비운다. 그래서 그 칸의 출처도 '끄고' 쪽이다. */
function cells(e) {
  const out = [];
  for (const M of MET) for (const arm of ["bm", "am"]) {
    let v = null, src;
    const ex = e.srcOf && e.srcOf[M.k];
    if (M.ld) {
      const L = e.ld, D = e.ldsrc;
      if (L) {
        const has2 = L[M.k + "2"] != null;
        if (arm === "am") { v = has2 ? L[M.k + "2"] : L[M.k]; src = D ? (has2 ? D.on : D.off) : undefined; }
        else { const show = has2 && e.bm != null; v = show ? L[M.k] : null; src = show ? (D ? D.off : undefined) : null; }
      }
    } else {
      const o = e[arm]; v = o && o[M.k] != null ? o[M.k] : null;
      src = e.src ? e.src[arm] : undefined;
    }
    if (ex && ex[arm] !== undefined) src = ex[arm];
    out.push({ e, M, arm, v, src });
  }
  return out;
}
/* "notion" 약칭을 그 카드의 페이지 id 로 편다(NOTION_EXP 가 붙여 둔 e.nt 에서 뽑는다) */
function resolveSrc(e, s) {
  if (s == null) return s;
  if (s === "notion" || s.startsWith("notion#")) {
    const m = e.nt && e.nt.match(/[?&]p=([0-9a-f]{32})/);
    if (!m) return { err: "'notion' 약칭인데 이 카드엔 노션 페이지가 없다" };
    return "notion:" + m[1] + s.slice(6);
  }
  return s;
}

/* ═══ R1 — 실험 데이터의 여섯 지표 값마다 출처가 있어야 한다 ═══ */
function ruleR1(cards) {
  const out = [];
  for (const e of cards) {
    if (!e.src) { out.push([tag(e), "src 필드가 없다"]); continue; }
    for (const c of cells(e)) {
      if (c.v == null) continue;
      const r = resolveSrc(e, c.src);
      if (c.src === undefined) out.push([`${tag(e)} ${c.arm}.${c.M.k}`, `값 ${nf(c.v)} 인데 출처 칸이 아예 없다`]);
      else if (c.src === null)  out.push([`${tag(e)} ${c.arm}.${c.M.k}`, `값 ${nf(c.v)} 인데 출처가 null 이다`]);
      else if (r && r.err)      out.push([`${tag(e)} ${c.arm}.${c.M.k}`, r.err]);
    }
  }
  return out;
}
/* ═══ R2 — 송신 메시지 × 평균 패킷 = 송신량 ═══
   곱셈이 0.5% 를 넘는데도 위반이 아닌 자리가 둘 있다. 사이트가 만든 오차가 아니라 **노션 원문의
   반올림**이고, 2026-08-19 3축 대조(노션 전문 ↔ 실측 CSV ↔ 사이트)에서 그렇게 판정됐다.
   그냥 두면 매 실행이 FAIL 이라, 진짜 곱셈 결함이 새로 생겨도 이 둘에 묻힌다.
   그래서 참고로 내리되 — **세 값을 그대로 적어 둔다.** 이 자리의 수가 하나라도 바뀌면 예외가
   저절로 풀려 다시 위반으로 뜬다(값을 고쳐 놓고 예외만 남는 것을 막는 자리다). */
const R2_OK = [
  { s: 5, arm: "am", pps: 2100000, pkt: 19.7, send: 41,
    why: "노션 원문 그대로 — 이 카드의 부하 세 값은 애초에 동접 1,000 실측에서 환산한 것이다" },
  { s: 8, arm: "bm", pps: 8710000, pkt: 71, send: 614,
    why: "노션이 평균 패킷을 71 B 로 반올림했다 — CSV 값 70.59 면 614.8 로 닫힌다" }
];
function ruleR2(cards) {
  const out = [], note = []; let n = 0;
  for (const e of cards) {
    const C = cells(e);
    for (const arm of ["bm", "am"]) {
      const g = k => (C.find(c => c.arm === arm && c.M.k === k) || {}).v;
      const pps = g("pps"), pkt = g("pkt"), send = g("send");
      if (pps == null || pkt == null || send == null) continue;
      n++;
      const calc = pps * pkt / 1e6, d = (calc - send) / send * 100;
      if (Math.abs(d) <= 0.5) continue;
      const row = [`${tag(e)} ${arm}`,
        `${nf(pps)} × ${nf(pkt)}B = ${calc.toFixed(1)} MB/s 인데 송신량 칸은 ${nf(send)} (${d > 0 ? "+" : "−"}${Math.abs(d).toFixed(2)}%)`];
      const ok = R2_OK.find(x => x.s === e.s && x.arm === arm &&
        x.pps === pps && x.pkt === pkt && x.send === send);
      if (ok) note.push([row[0], row[1] + " · " + ok.why]);
      else out.push(row);
    }
  }
  out.n = n; out.note = note; return out;
}
/* ═══ R3 — 같은 출처를 가리키는 값끼리 같아야 한다 ═══
   출처 문자열이 곧 '어느 측정점' 이다. 노션 페이지는 A/B 두 열을 한 페이지에 담으므로
   끄고·켜고를 `#끄고` `#켜고` 로 갈라 적는다 — 그래서 여기서는 팔을 따로 볼 필요가 없다. */
function ruleR3(cards) {
  const g = new Map(), out = [];
  for (const e of cards) for (const c of cells(e)) {
    if (c.v == null || c.src == null) continue;
    const r = resolveSrc(e, c.src); if (!r || r.err) continue;
    const key = r + " ‖ " + c.M.k;
    if (!g.has(key)) g.set(key, []);
    g.get(key).push({ who: `${tag(e)} ${c.arm}.${c.M.k}`, v: c.v, src: r });
  }
  let n = 0;
  for (const [key, arr] of g) {
    if (arr.length < 2) continue;
    n += arr.length - 1;
    const first = arr[0];
    for (const x of arr.slice(1)) if (x.v !== first.v)
      out.push([x.who, `같은 런 ${x.src} 인데 ${first.who.split(" ")[0]} 는 ${nf(first.v)}, 여기는 ${nf(x.v)}`]);
  }
  out.n = n;
  /* 참고 — 같은 기저 런인데 rep 조합·표기가 달라 따로 노는 자리 */
  const base = new Map();
  for (const [key, arr] of g) {
    const [src, k] = key.split(" ‖ ");
    if (src.startsWith("notion")) continue;
    const b = src.split("+")[0].replace(/_r\d+$/, "") + " ‖ " + k;
    if (!base.has(b)) base.set(b, new Map());
    base.get(b).set(src, arr[0]);
  }
  out.note = [];
  for (const [b, m] of base) {
    if (m.size < 2) continue;
    const vs = [...m.entries()];
    const mx = Math.max(...vs.map(x => x[1].v)), mn = Math.min(...vs.map(x => x[1].v));
    if (mn && (mx - mn) / mn > 0.005)
      out.note.push([b.split(" ‖ ")[0] + " " + b.split(" ‖ ")[1],
        vs.map(x => `${x[0]}=${nf(x[1].v)}`).join(" / ") + ` — ${((mx - mn) / mn * 100).toFixed(1)}% 차(rep 조합이 다르면 정상)`]);
  }
  return out;
}
/* ═══ R8 — 카드가 크게 세우는 대표 지표(scene.js FACE)가 가리킨 값과 맞는가 ═══
   FACE 표는 값을 적지 않고 가리키기만 한다(tick:1 → bm/am.tick · row → ab 표의 그 줄). 그래서 여기서 보는 것은
   '가리킨 곳을 찾았나' 와 '찾은 값끼리의 관계' 다 —
     · km 이 undefined  = 표에 없거나 가리킨 줄을 못 찾았다(ab 줄 이름이 바뀌면 조용히 빠진다)
     · null(고리 없음)은 진단·결론만 — 끄고/켜고가 있는 실험이 고리를 잃으면 숫자 없는 카드가 된다
     · 퍼센트 표기는 전 → 후로 다시 잰 값과 부호가 같고, 차이가 표기의 마지막 자리 한 칸 안이어야 한다
       (노션 원문 표기를 그대로 쓰므로 반올림 차는 허용한다 — ⑫ +7.2% 는 다시 재면 7.26%)
     · 수가 아닌 표기('불변')는 전후가 0.5% 안이어야 한다
     · 채택이면 고리 색이 '좋아짐'(1), 기각이면 '좋아짐' 이 아니어야 한다 */
function ruleR8(cards) {
  const out = []; let n = 0;
  for (const e of cards.filter(x => x.no)) {
    n++;
    if (e.km === undefined) { out.push([tag(e), "대표 지표가 없다 — FACE 표에 없거나 가리킨 줄(row · tick)을 못 찾았다"]); continue; }
    if (!e.ms) out.push([tag(e), "두 줄 설명(ms)이 없다"]);
    if (e.km === null) {
      if (e.st !== "dg" && e.st !== "sum") out.push([tag(e), `판정이 ${e.st} 인데 고리 없는 카드(null)다 — 끄고/켜고가 있는 실험이다`]);
      continue;
    }
    const M = e.km;
    if (!(M.b > 0) || !(M.a >= 0)) { out.push([tag(e), `전 ${nf(M.b)} · 후 ${nf(M.a)} — 고리 비율(후 ÷ 전)을 못 잰다`]); continue; }
    const m = String(M.d).match(/^([+−-])([\d.]+)%$/);
    if (m) {
      const shown = (m[1] === "+" ? 1 : -1) * parseFloat(m[2]), calc = (M.a - M.b) / M.b * 100;
      const unit = Math.pow(10, -((m[2].split(".")[1] || "").length));
      if (Math.sign(calc) !== Math.sign(shown)) out.push([tag(e), `부호가 반대다 — ${M.bt} → ${M.at} 는 ${calc > 0 ? "+" : "−"} 인데 표기는 ${M.d}`]);
      else if (Math.abs(calc - shown) > unit) out.push([tag(e), `표기 ${M.d} 인데 ${M.bt} → ${M.at} 로 다시 재면 ${calc.toFixed(2)}% (허용 ±${unit})`]);
    } else if (Math.abs(M.a - M.b) / M.b > 0.005) {
      out.push([tag(e), `'${M.d}' 는 수가 아닌 표기인데 전후가 0.5% 넘게 다르다 (${M.bt} → ${M.at})`]);
    }
    if (e.st === "ok" && M.g !== 1) out.push([tag(e), `채택인데 고리 색이 '좋아짐'(1)이 아니다 (g=${M.g})`]);
    if (e.st === "rj" && M.g === 1) out.push([tag(e), "기각인데 고리 색이 '좋아짐'(1)이다"]);
  }
  out.n = n; return out;
}/* ═══ R6 — 명세(BNECK_SYNC_SPEC.md)의 노션 대조표와 값이 같아야 한다 ═══
   범위는 bm·am 네 값과 LOAD 다섯 값이다(ab 표는 서술이 섞여 있어 여기서 안 본다).
   명세는 2026-08-18 채집분이라, 그 뒤 정정한 값은 여기서 '다르다' 로 뜬다 —
   그건 검사기가 아니라 사람이 판단할 자리다(명세를 갱신할지, 사이트를 되돌릴지). */
function parseSpec(text) {
  const cards = new Map(), load = new Map();
  const num = t => t === "null" ? null : Number(t);
  /* ① 카드 블록 : 헤더에 s:N 이 적힌 절 안의 bm:/am: */
  const blocks = [...text.matchAll(/(^|\n)#+ [^\n]*?`?s:([0-9.]+)`?[^\n]*\n([\s\S]*?)(?=\n#|$)/g)];
  for (const b of blocks) {
    const s = Number(b[2]), body = b[3];
    const get = key => {
      const m = body.match(new RegExp("(?:^|[\\s,{])" + key + ":\\s*(null|\\{[^}]*\\})"));
      if (!m) return undefined;
      if (m[1] === "null") return null;
      const o = {};
      for (const kv of m[1].slice(1, -1).split(",")) {
        const p = kv.split(":"); if (p.length < 2) continue;
        o[p[0].trim()] = num(p[1].trim());
      }
      return o;
    };
    const bm = get("bm"), am = get("am");
    /* 명세가 '`LOAD` 행 없음' 이라고 못 박은 카드(⑫)만 따로 기억한다. 나머지 카드의 부하 행이
       명세에 없는 것은 '없어야 한다' 가 아니라 '그때 손대지 않아 다시 적지 않았다' 는 뜻이다. */
    const noload = /`LOAD`\s*행\s*\*\*없음\*\*/.test(body);
    if (bm !== undefined || am !== undefined || noload) cards.set(s, { bm, am, noload });
  }
  /* ② LOAD 행 : 문서 어디에 있든 여섯 칸 배열이면 받는다(뒤에 나온 것이 이긴다 = 최종형) */
  for (const m of text.matchAll(/\[\s*([0-9.]+)\s*,\s*([0-9.]+|null)\s*,\s*([0-9.]+|null)\s*,\s*([0-9.]+|null)\s*,\s*([0-9.]+|null)\s*,\s*([0-9.]+|null)\s*\]/g))
    load.set(Number(m[1]), { fan: num(m[2]), pkt: num(m[3]), pkt2: num(m[4]), sock: num(m[5]), sock2: num(m[6]) });
  return { cards, load };
}
function ruleR6(cards, spec) {
  const out = []; let n = 0;
  const sf = v => v === null ? "null(안 적음)" : nf(v);
  const by = new Map(cards.map(e => [e.s, e]));
  for (const [s, want] of spec.cards) {
    const e = by.get(s); if (!e) { out.push([`s:${s}`, "명세에 있는 카드가 사이트에 없다"]); continue; }
    for (const arm of ["bm", "am"]) {
      const w = want[arm]; if (w === undefined) continue;
      const got = e[arm];
      if (w === null) { n++; if (got !== null) out.push([`${tag(e)} ${arm}`, "명세는 null 인데 사이트는 값이 있다"]); continue; }
      if (got == null) { n++; out.push([`${tag(e)} ${arm}`, "명세엔 값이 있는데 사이트는 null"]); continue; }
      for (const k in w) { n++; if (w[k] !== got[k])
        out.push([`${tag(e)} ${arm}.${k}`, `명세 ${sf(w[k])} · 사이트 ${sf(got[k])}`]); }
    }
    if (want.noload) { n++; if (e.ld) out.push([`${tag(e)} LOAD`, "명세는 '부하 행 없음' 인데 사이트엔 행이 있다"]); }
  }
  for (const [s, want] of spec.load) {
    const e = by.get(s); if (!e) continue;
    if (!e.ld) { out.push([`s:${s} LOAD`, "명세엔 부하 행이 있는데 사이트엔 없다"]); continue; }
    for (const k of ["fan", "pkt", "pkt2", "sock", "sock2"]) { n++; if (want[k] !== e.ld[k])
      out.push([`${tag(e)} LOAD.${k}`, `명세 ${sf(want[k])} · 사이트 ${sf(e.ld[k])}`]); }
  }
  out.n = n; return out;
}
/* ═══ R7 — 하드코딩된 개수 문구가 실제 카드 수와 맞아야 한다 ═══
   한글 수사는 병목 판을 말하는 파일에서만 센다(다른 탭에도 '열넷' 같은 말이 있다).
   '한때·그때·2026-08-04' 처럼 시점을 박아 둔 줄은 위반이 아니라 참고로 뺀다 — 옛일을
   적은 문장은 옛 숫자가 맞다. 앞 두 줄까지 같이 보는 것은 주석이 여러 줄에 걸치기 때문이다. */
const KO = { "열둘": 12, "열두": 12, "열셋": 13, "열세": 13, "열넷": 14, "열네": 14,
             "열다섯": 15, "열여섯": 16, "열일곱": 17, "열여덟": 18 };
const MARK = /한때|그때|예전|옛|당시|시절|무렵|처음|예정|나머지|\d{4}-\d{2}-\d{2}/;
function ruleR7(files, want) {
  const out = [], note = []; let n = 0;
  for (const f of files) {
    const lines = f.text.split(/\r?\n/);
    lines.forEach((L, i) => {
      const ctx = lines.slice(Math.max(0, i - 2), i + 1).join(" ");
      const hits = [];
      for (const m of L.matchAll(/실험\S{0,2}\s*(\d{1,3})\s*건/g)) hits.push([Number(m[1]), m[0]]);
      if (f.ko) for (const m of L.matchAll(/(열둘|열두|열셋|열세|열넷|열네|열다섯|열여섯|열일곱|열여덟)/g)) hits.push([KO[m[1]], m[1]]);
      /* '카드 N장' 은 병목 판만 쓰는 말이 아니다(1-1 에도 '실험 카드 4장' 이 있다) →
         병목 세 파일에서만 센다. */
      if (f.ko2) for (const m of L.matchAll(/카드\s*(\d{1,3})\s*장/g)) hits.push([Number(m[1]), m[0]]);
      for (const [got, txt] of hits) {
        n++;
        if (got === want) continue;
        const row = [`${f.path}:${i + 1}`, `'${txt}' — 카드는 ${want} 장이다`];
        (MARK.test(ctx) ? note : out).push(row);
      }
    });
  }
  out.n = n; out.note = note; return out;
}

/* ═══ 실측 CSV — 출처 라벨이 실재하는지 확인하고, 값도 참고로 대 본다 ═══
   지표 이름 함정 : `tick_p99` 가 아니라 **`tick_p99_ms`** 다. 정확 일치로 물으면 빈 결과가
   나와 '측정 안 했다' 로 오판한다. rep(`_r1` `_r2`)은 평균으로 접는다. */
function loadCSV(p) {
  if (!fs.existsSync(p)) return null;
  const txt = fs.readFileSync(p, "utf8").replace(/^\uFEFF/, "");
  const rows = new Map();
  for (const line of txt.split(/\r?\n/)) {
    if (!line || line.startsWith('"TimeUtc"')) continue;
    const c = line.replace(/^"|"$/g, "").split('","');
    if (c.length < 5) continue;
    const run = c[1], met = c[3], v = Number(c[4]);
    if (!isFinite(v)) continue;
    if (!rows.has(run)) rows.set(run, new Map());
    const m = rows.get(run);
    if (!m.has(met)) m.set(met, []);
    m.get(met).push(v);
  }
  return rows;
}
function specRuns(csv, spec) {
  const out = [];
  for (const part of spec.split("+")) {
    if (/_r\d+$/.test(part)) { if (!csv.has(part)) return { missing: part }; out.push(part); }
    else {
      const rs = [...csv.keys()].filter(k => k.replace(/_r\d+$/, "") === part);
      if (!rs.length) return { missing: part };
      out.push(...rs);
    }
  }
  return { runs: out };
}
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
function csvValue(csv, runs, met) {
  const vs = runs.map(r => csv.get(r).get(met)).filter(Boolean).map(mean);
  return vs.length ? mean(vs) : null;
}

/* ═══════════ 실행 ═══════════ */
const SCENE = rd("parts/scene.js");
const BNECK = rd("parts/bneck.js");
const EXPS = loadEXPS(SCENE);
if (!EXPS || !EXPS.length) { console.error("scene.js 에서 __EXPS 를 못 읽었다 — 스텁을 늘려야 한다."); process.exit(2); }
const CARDS = EXPS.filter(e => e.no).sort((a, b) => a.no - b.no);
const NCARD = CARDS.length;

/* ═══ 회귀 시험 — 규칙마다 '실제로 이걸로 잡혔던 것' 을 다시 넣어 본다 ═══
   규칙이 조용히 0 건을 통과하면 검사기가 죽은 것을 모른다. 그래서 매 실행마다 돌린다. */
function selftest(cards, spec) {
  const cl = x => JSON.parse(JSON.stringify(x));
  const T = [];
  const t = (name, fn) => { let ok = false, err = ""; try { ok = fn(); } catch (e) { err = e.message; } T.push([name, ok, err]); };

  t("R1 ⑩ 출처 없이 들어간 값", () => {
    const c = cl(cards); c.find(x => x.s === 10).src.am = null;
    return ruleR1(c).some(r => r[0].startsWith("⑩"));
  });
  t("R2 ⑭ 1,305만 × 94.9 ≠ 1,249", () => {
    const c = cl(cards); c.find(x => x.s === 14).am.pps = 13055000;
    return ruleR2(c).some(r => r[0].startsWith("⑭"));
  });
  /* 옛 시험은 '⑮ 끄고 소켓 135.2k (⑭ 는 135.07k)' 였다 — 두 카드가 `RMB_..._CC5600` 한 런을
     같이 가리키던 시절의 짝이다. 2026-08-20 재측정으로 ⑮ 가 6,600 으로 옮겨 그 짝이 없어졌고,
     지금 같은 출처를 공유하는 자리는 ⑮ 켜고 ↔ ⑯(결론)이다 — 둘 다 노션 3절 9B 를 가리킨다.
     잡으려는 결함은 그대로다 : **같은 런을 두 카드가 다른 숫자로 말하는 것.** */
  t("R3 ⑮ 켜고 송신량 1,300 (⑯ 은 1,326 — 같은 노션 3절 9B)", () => {
    const c = cl(cards); c.find(x => x.s === 15).am.send = 1300;
    return ruleR3(c).some(r => r[0].startsWith("⑮"));
  });
  /* R2 예외는 '값까지 적어 둔' 것이 요점이다 — 값이 바뀌면 예외가 풀려야 한다.
     안 그러면 수를 고쳐 놓고 예외만 남아 곱셈 결함이 영영 안 보인다. */
  t("R2 예외가 값이 바뀌면 풀린다 (⑧ 송신량 614 → 600)", () => {
    const c = cl(cards); c.find(x => x.s === 8).bm.send = 600;
    return ruleR2(c).some(r => r[0].startsWith("⑧"));
  });
  t("R2 예외가 지금 값에는 걸린다 (⑧ 그대로면 참고로 내려간다)", () => {
    const r = ruleR2(cl(cards));
    return !r.some(x => x[0].startsWith("⑧")) && (r.note || []).some(x => x[0].startsWith("⑧"));
  });
  /* R8 — 대표 지표. 아래 넷은 실제로 났던 결함이 아니라 '나면 이렇게 보인다' 를 넣어 본 것이다
     (규칙이 2026-10-26 에 새로 생겼다). 0 건 통과가 '결함 없음' 인지 '규칙이 죽음' 인지 가르는 자리다. */
  t("R8 ⑫ 표기 +7.2% 를 +9% 로 (다시 재면 7.26%)", () => {
    const c = cl(cards); c.find(x => x.s === 12).km.d = "+9%";
    return ruleR8(c).some(r => r[0].startsWith("⑫"));
  });
  t("R8 ⑭ 부호 뒤집힘 +0.7% → −0.7%", () => {
    const c = cl(cards); c.find(x => x.s === 14).km.d = "−0.7%";
    return ruleR8(c).some(r => r[0].startsWith("⑭"));
  });
  t("R8 ⑦ 가리킨 ab 줄을 못 찾음(줄 이름이 바뀌면 km 이 undefined)", () => {
    const c = cl(cards); delete c.find(x => x.s === 7).km;
    return ruleR8(c).some(r => r[0].startsWith("⑦"));
  });
  t("R8 ② 채택 실험이 고리를 잃음(km null)", () => {
    const c = cl(cards); c.find(x => x.s === 2).km = null;
    return ruleR8(c).some(r => r[0].startsWith("②"));
  });
  t("R6 명세와 다른 값", () => {
    const s2 = { cards: new Map([[13, { am: { ccu: 9999 } }]]), load: new Map() };
    return ruleR6(cards, s2).length > 0;
  });
  t("R7 '카드 열두 장' 잔존", () =>
    ruleR7([{ path: "x.css", text: "/* 카드 열두 장 아래 */", ko: 1 }], 16).length > 0);
  t("R7 '실험 12건' 잔존", () =>
    ruleR7([{ path: "x.html", text: "실험 12건과 계기판", ko: 0 }], 16).length > 0);
  return T;
}

/* ── R0 : 검사기가 보는 자리가 그대로인가 ── */
{
  /* 화면(bneck.js)이 대표 지표와 두 줄 설명을 이 이름으로 읽어야 R8 이 같은 것을 검사한다.
     ※ 한때 여기서 계기판 정의(MET)·라벨 문구·ldnote 배선을 대조했다 — 계기판을 걷으며(2026-10-26) 같이 걷었다. */
  S.R0.n++; if (!/it\.km\b/.test(BNECK)) viol("R0", "bneck.js paintCard", "대표 지표(it.km)를 읽지 않는다 — R8 이 화면과 다른 것을 보게 된다");
  S.R0.n++; if (!/it\.ms\b/.test(BNECK)) viol("R0", "bneck.js paintCard", "두 줄 설명(it.ms)을 읽지 않는다");
  S.R0.n++; if (!/FACE\.forEach/.test(SCENE)) viol("R0", "scene.js FACE", "카드 얼굴 표를 실험에 붙이는 자리가 없다");  S.R0.n++;
  if (!/window\.__EXPS\|\|\[\]\)\.filter\(function\(e\)\{ return e\.no; \}\)/.test(BNECK))
    warn("R0", "bneck.js", "카드로 서는 조건(e.no)이 바뀐 것 같다 — 검사 대상 목록을 다시 볼 것");
  S.R0.n++;
  if (NCARD !== 16) warn("R0", "카드 수", `${NCARD} 장이다(직전 기준 16). 개수 문구 규칙(R7)이 이 수를 쓴다`);
}

/* ── R1~R3 · R6~R8 ── */
const r1 = ruleR1(EXPS); S.R1.n = EXPS.reduce((a, e) => a + cells(e).filter(c => c.v != null).length, 0);
r1.forEach(x => viol("R1", x[0], x[1]));
const r2 = ruleR2(EXPS); S.R2.n = r2.n; r2.forEach(x => viol("R2", x[0], x[1]));
(r2.note || []).forEach(x => warn("R2", x[0], x[1]));
const r3 = ruleR3(EXPS); S.R3.n = r3.n; r3.forEach(x => viol("R3", x[0], x[1]));
(r3.note || []).forEach(x => warn("R3", x[0], x[1]));
let spec = null;
try { spec = parseSpec(fs.readFileSync(path.join(HERE, "BNECK_SYNC_SPEC.md"), "utf8")); }
catch { warn("R6", "BNECK_SYNC_SPEC.md", "명세를 못 읽었다"); }
if (spec) { const r6 = ruleR6(EXPS, spec); S.R6.n = r6.n; r6.forEach(x => viol("R6", x[0], x[1])); }
/* R7 대상 : 요청서가 정한 네 갈래. 한글 수사(ko)는 병목 판을 말하는 파일에서만 센다. */
const R7FILES = [
  ...fs.readdirSync(path.join(SITE, "parts")).filter(f => /\.(js|css|html)$/.test(f)).map(f => "parts/" + f),
  "mmo.src.html"
];
const KOSET = /^(parts\/(bneck|bneck-tail|panel-bneck|scene|common)\.|mmo\.src\.html)/;
const BNSET = /^parts\/(bneck|bneck-tail|panel-bneck)\./;
const r7 = ruleR7(R7FILES.map(p => ({ path: p, text: rd(p), ko: KOSET.test(p) ? 1 : 0, ko2: BNSET.test(p) ? 1 : 0 })), NCARD);
S.R7.n = r7.n; r7.forEach(x => viol("R7", x[0], x[1]));
(r7.note || []).forEach(x => warn("R7", x[0], x[1] + " · 시점을 박아 둔 줄이라 옛 숫자가 맞을 수 있다"));
const r8 = ruleR8(EXPS); S.R8.n = r8.n; r8.forEach(x => viol("R8", x[0], x[1]));

/* ── 실측 CSV 대조 ── */
const csv = loadCSV(CSV_PATH);
const csvNote = [];
if (!csv) warn("R1", "실측 CSV", `${CSV_PATH} 를 못 읽어 런 라벨 실재 확인을 건너뛰었다`);
else {
  for (const e of EXPS) for (const c of cells(e)) {
    if (c.v == null || c.src == null) continue;
    const r = resolveSrc(e, c.src);
    if (!r || r.err || String(r).startsWith("notion")) continue;
    const rr = specRuns(csv, r);
    if (rr.missing) { viol("R1", `${tag(e)} ${c.arm}.${c.M.k}`, `출처 런 '${rr.missing}' 이 실측 CSV 에 없다`); continue; }
    const cv = csvValue(csv, rr.runs, CSVMET[c.M.k]);
    if (cv == null) continue;
    const d = (c.v - cv) / cv * 100;
    if (Math.abs(d) > 2) csvNote.push(`  ${tag(e)} ${c.arm}.${c.M.k} — 화면 ${nf(c.v)} · CSV(${r}) ${nf(+cv.toFixed(3))} · ${d > 0 ? "+" : "−"}${Math.abs(d).toFixed(1)}%`);
  }
}

/* ── 회귀 시험 ── */
const T = selftest(EXPS, spec);
const tbad = T.filter(x => !x[1]);

/* ═══ 보고 ═══ */
const L = [];
L.push("── 병목 탭 수치 검사기 ─────────────────────────────");
L.push(`카드 ${NCARD} 장 · 지표 ${MET.length} 종 · 값 ${S.R1.n} 개`);
L.push("");
let nv = 0;
for (const [id, name] of RULES) {
  const s = S[id]; nv += s.viol.length;
  L.push(s.n === 0
    ? `⚠  ${id} ${name.padEnd(9)} 검사 대상 0 건 — 규칙이 헛돌고 있다(확인 필요)`
    : `${s.viol.length ? "✗" : "·"}  ${id} ${name.padEnd(9)} 검사 ${String(s.n).padStart(4)} 건 · 위반 ${s.viol.length}`);
  s.viol.forEach(v => L.push("     " + v));
  s.warn.forEach(w => L.push("     ↳ 참고 " + w));
}
if (csvNote.length) {
  L.push("");
  L.push("실측 CSV 와 2% 넘게 벌어진 칸 (참고 — 노션 표기나 다른 rep 축을 쓴 자리일 수 있다)");
  csvNote.forEach(x => L.push(x));
}
L.push("");
L.push(`회귀 시험 ${T.length - tbad.length}/${T.length} 통과` + (tbad.length ? "  ✗" : ""));
tbad.forEach(x => L.push(`     ✗ ${x[0]} — 이 규칙이 옛 결함을 못 잡는다${x[2] ? " (" + x[2] + ")" : ""}`));
L.push("");
L.push(nv === 0 && !tbad.length ? "PASS" : `FAIL — 위반 ${nv} 건${tbad.length ? ` · 죽은 규칙 ${tbad.length} 개` : ""}`);
console.log(L.join("\n"));
process.exit(nv === 0 && !tbad.length ? 0 : 1);
