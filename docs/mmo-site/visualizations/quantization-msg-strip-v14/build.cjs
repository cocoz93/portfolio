// E 좌표 양자화 — 시안 2(한 명 · Msg 띠에서 값과 칸 수가 같이 바뀜)를 재생 그림으로 만든다.
// 골격은 A~D와 같다: 변경 전·후 두 줄, 캐릭터 이동 지도 → Msg → SendQ. 실행: node build.cjs
// 수치 근거: MMO_Zone/Shared/Protocol/Protocol.h 의 QuantizePos(v * 512 + 0.5f) · SectorUpdateEntry(qx/qy uint16)
const fs = require("node:fs"), path = require("node:path"), os = require("node:os"), crypto = require("node:crypto"), { execFileSync } = require("node:child_process");
const dir = __dirname, ROOT_ID = "quantization-msg-strip-v14";
const FONT_DIR = path.resolve(dir, "../../../fonts");
const C = { bg: "#0d1421", surface: "#151f2c", edge: "#354b61", track: "#7895ae", text: "#eef2fb", muted: "#a8b8ca", active: "#238fff", focus: "#0066d6", soft: "#1b3a50", empty: "#172536", header: "#1d2a3a", gold: "#f5b13d", ink: "#0a0f1a" };
const PAL = { o: "#08121e", l: "#dce9f3", m: "#dce9f3", d: "#617e9a", a: C.active, b: C.active, c: "#2579ad", v: "#17466a", s: "#ecd0b5", t: "#bd947a" };
// 마법사 그림은 B 그림(sector-bundle-held-pulse-v26)과 같은 도트를 쓴다
const bScene = fs.readFileSync(path.resolve(dir, "../sector-bundle-held-pulse-v26/scene.js"), "utf8");
const pixels = JSON.parse(bScene.match(/const pixels=(\[[^\]]*\]);/)[1]);
pixels[33] = "    omo   oooooooo  ooooooo"; pixels[34] = "    ooo    ddddo    oddddoo"; pixels[35] = "                    oddddo";
// 이동 중에는 B처럼 진행 방향(동쪽) 옆모습을 보이고, 멈추면 정면으로 돌아온다
const eastPixels = eval(bScene.match(/const east=(\[[\s\S]*?\])\.map/)[1]).map(row => row.padEnd(32, " ").slice(0, 32));
const X0 = 72.1257, Y0 = 24.33333;           // 이동 전 좌표 — 한 칸(1타일) 동쪽으로 움직여 73.12570이 된다
const QX = Math.floor((X0 + 1) * 512 + 0.5), QY = Math.floor(Y0 * 512 + 0.5);
if (QX !== 37440 || QY !== 12459) throw new Error(`양자화 값 불일치 ${QX} ${QY}`);

function svgWriter() {
  const o = [], esc = s => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;");
  const attrs = a => Object.entries(a).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => ` ${k}="${esc(v)}"`).join("");
  const w = {
    o, raw: s => o.push(s),
    rect: (x, y, wd, h, a = {}) => o.push(`<rect${attrs({ x, y, width: wd, height: h, rx: a.rx ?? 4, fill: a.fill ?? C.surface, stroke: a.stroke ?? C.edge, "stroke-width": a.sw ?? 1, "stroke-dasharray": a.dash, "data-k": a.k, opacity: a.opacity })}/>`),
    text: (x, y, s, a = {}) => o.push(`<text${attrs({ x, y, class: a.mono ? "q-mono" : null, "font-size": a.size ?? 13, "font-weight": a.weight ?? 500, fill: a.fill ?? C.text, "text-anchor": a.anchor ?? "start", "dominant-baseline": "central", "data-k": a.k, opacity: a.opacity })}>${esc(s)}</text>`),
    line: (pts, a = {}) => {
      o.push(`<polyline points="${pts.map(p => p.join(",")).join(" ")}" fill="none" stroke="${a.stroke ?? C.track}" stroke-width="1.4" stroke-linejoin="round"/>`);
      if (a.pins !== false) [pts[0], pts.at(-1)].forEach(p => o.push(`<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="${C.bg}" stroke="${a.stroke ?? C.track}" stroke-width="1.4"/>`));
    },
    group: (a, fn) => { o.push(`<g${attrs(a)}>`); fn(); o.push("</g>"); },
    wizard: (x, y, size, a = {}) => {
      o.push(`<g transform="translate(${x} ${y}) scale(${size / 32})" shape-rendering="crispEdges"${a.k ? ` data-k="${a.k}" opacity="${a.opacity ?? 1}"` : ""}>`);
      // 같은 색이 가로로 이어지는 픽셀은 사각형 하나로 묶는다(B 그림과 같은 방식)
      (a.rows ?? pixels).forEach((row, r) => { for (let c = 0; c < 32;) { let e = c + 1; while (e < 32 && row[e] === row[c]) e++; if (PAL[row[c]]) o.push(`<rect x="${c}" y="${r}" width="${e - c + .02}" height="1.02" fill="${PAL[row[c]]}"/>`); c = e; } });
      o.push("</g>");
    },
    // 펄스 점 — 경로는 data-path0/1/2(지도→칩 앞 · 칩 구간 · 칩 뒤→Msg)에 실어 두고 재생기가 따라 움직인다
    pulse: (k, paths) => o.push(`<circle data-k="${k}" r="4.5" cx="${paths[0][0][0]}" cy="${paths[0][0][1]}" fill="${C.active}" stroke="${C.text}" stroke-width="1" opacity="0"${paths.map((p, i) => ` data-path${i}="${esc(JSON.stringify(p))}"`).join("")}/>`),
  };
  return w;
}
// 바이트 칸: 빈 바탕 위에 채움(파랑=변경 전, 금색=변경 후)을 얹고, 재생기가 채움과 값의 불투명도를 올린다
function byteCells(g, k, x, y, n, cw, h, value, gold, noBase) {
  if (!noBase) g.rect(x, y, n * cw, h, { fill: C.empty, stroke: C.edge, rx: 2 });
  g.group({ "data-k": `fill-${k}`, opacity: 1 }, () => {
    g.rect(x, y, n * cw, h, { fill: gold ? C.gold : C.focus, stroke: gold ? C.gold : C.active, rx: 2 });
    for (let i = 1; i < n; i++) [[y, y + 5], [y + h - 5, y + h]].forEach(([a, b]) => g.raw(`<line x1="${x + i * cw}" x2="${x + i * cw}" y1="${a}" y2="${b}" stroke="${gold ? "#8a5a12" : "#7fb6f0"}" stroke-width="1.2"/>`));
    g.text(x + n * cw / 2, y + h / 2 + 1, value, { size: 13, weight: 700, mono: true, anchor: "middle", fill: gold ? C.ink : C.text });
  });
}
// Msg 좌표 칸 — 두 줄 모두 먼저 x·y float(4B씩, 파랑)으로 찬다. 변경 후 줄만 그다음 Msg 안에서
// 칸 수·값·이름·색이 함께 바뀌어 qx·qy(2B씩, 금색)가 되고, 남는 자리(−4B 점선)가 드러난다
function msgSlots(g, r, x0, sy, cw, bh, labDy) {
  const fv = [(X0 + 1).toFixed(5), Y0.toFixed(5)], qv = [QX, QY], labs = [["x", "qx"], ["y", "qy"]];
  const label = (x, y, t, k, extra) => g.raw(`<text x="${x}" y="${y}" class="q-mono" font-size="12" font-weight="500" fill="${C.muted}" text-anchor="middle" dominant-baseline="central"${k ? ` data-k="${k}"` : ""}${extra || ""}>${t}</text>`);
  const ticks = (n, w, color) => { for (let i = 1; i < n; i++) [[0, 5], [bh - 5, bh]].forEach(([a, b]) => g.raw(`<line x1="${i * w / n}" x2="${i * w / n}" y1="${a}" y2="${b}" stroke="${color}" stroke-width="1.2" vector-effect="non-scaling-stroke"/>`)); };
  for (let i = 0; i < 2; i++) {
    const wa = 4 * cw, xa = x0 + i * (wa + 6);
    if (!r) {
      g.rect(xa, sy, wa, bh, { fill: C.empty, stroke: C.edge, rx: 2 });
      byteCells(g, `0-${i}`, xa, sy, 4, cw, bh, fv[i], false, true);
      label(xa + wa / 2, sy - labDy, labs[i][0]); label(xa + wa / 2, sy + bh + labDy, "4B");
      continue;
    }
    const wb = 2 * cw, xb = x0 + i * (wb + 6), ca = xa + wa / 2, cb = xb + wb / 2;
    const anim = ` data-x0="${xa}" data-x1="${xb}" data-w0="${wa}" data-w1="${wb}" data-y="${sy}"`, canim = ` data-x0="${ca}" data-x1="${cb}"`;
    g.raw(`<rect x="${xb}" y="${sy}" width="${wb}" height="${bh}" rx="2" fill="${C.empty}" stroke="${C.edge}" stroke-width="1" data-k="slot-${i}"${anim}/>`);
    g.group({ "data-k": `fill-1-${i}`, opacity: 1 }, () => {
      // 칸 모양은 4B 폭 기준으로 그려 가로로만 줄인다 — 선 굵기는 non-scaling-stroke로 유지
      g.raw(`<g data-k="morph-${i}" transform="translate(${xb} ${sy}) scale(${wb / wa} 1)"${anim}>`);
      g.raw(`<g data-k="mblue-${i}" opacity="0"><rect x="0" y="0" width="${wa}" height="${bh}" rx="2" fill="${C.focus}" stroke="${C.active}" stroke-width="1" vector-effect="non-scaling-stroke"/>`); ticks(4, wa, "#7fb6f0"); g.raw("</g>");
      g.raw(`<g data-k="mgold-${i}" opacity="1"><rect x="0" y="0" width="${wa}" height="${bh}" rx="2" fill="${C.gold}" stroke="${C.gold}" stroke-width="1" vector-effect="non-scaling-stroke"/>`); ticks(2, wa, "#8a5a12"); g.raw("</g>");
      g.raw("</g>");
      g.raw(`<text x="${cb}" y="${sy + bh / 2 + 1}" class="q-mono" font-size="13" font-weight="700" fill="${C.text}" text-anchor="middle" dominant-baseline="central" data-k="mtf-${i}" opacity="0"${canim}>${fv[i]}</text>`);
      g.raw(`<text x="${cb}" y="${sy + bh / 2 + 1}" class="q-mono" font-size="13" font-weight="700" fill="${C.ink}" text-anchor="middle" dominant-baseline="central" data-k="mti-${i}" opacity="1"${canim}>${qv[i]}</text>`);
    });
    label(cb, sy - labDy, labs[i][1], `slotlab-${i}`, `${canim} data-t0="${labs[i][0]}" data-t1="${labs[i][1]}"`);
    label(cb, sy + bh + labDy, "2B", `slotb-${i}`, `${canim} data-t0="4B" data-t1="2B"`);
  }
  if (r) ghostCells(g, x0 + 2 * (2 * cw + 6), sy, 4, cw, bh, sy - labDy);
}
function ghostCells(g, x, y, n, cw, h, labelY) {
  g.group({ "data-k": "ghost", opacity: 1 }, () => {
    g.rect(x, y, n * cw, h, { fill: "none", stroke: C.edge, dash: "4 3", rx: 2 });
    for (let i = 1; i < n; i++) [[y, y + 5], [y + h - 5, y + h]].forEach(([a, b]) => g.raw(`<line x1="${x + i * cw}" x2="${x + i * cw}" y1="${a}" y2="${b}" stroke="${C.edge}" stroke-width="1.2"/>`));
    g.text(x + n * cw / 2, y + h / 2 + 1, "−4B", { size: 13, weight: 600, mono: true, anchor: "middle", fill: C.muted });
    g.text(x + n * cw / 2, labelY, "줄어든 자리", { size: 12, anchor: "middle", fill: C.muted });
  });
}
function ring(g, r, cx, cy, R, ri, filled, bigSize) {
  const seg = (i, a) => {
    const a0 = (-90 + i * 45 + 2.5) * Math.PI / 180, a1 = (-90 + (i + 1) * 45 - 2.5) * Math.PI / 180;
    const p = (rad, t) => [cx + rad * Math.cos(t), cy + rad * Math.sin(t)].map(v => v.toFixed(1)).join(",");
    g.raw(`<path d="M${p(R, a0)} A${R},${R} 0 0 1 ${p(R, a1)} L${p(ri, a1)} A${ri},${ri} 0 0 0 ${p(ri, a0)} Z" fill="${a.fill}" stroke="${a.stroke}" stroke-width="1"${a.k ? ` data-k="${a.k}" opacity="1"` : ""}/>`);
  };
  for (let i = 0; i < 8; i++) seg(i, { fill: C.empty, stroke: C.edge });
  for (let i = 0; i < filled; i++) seg(i, { fill: C.focus, stroke: C.active, k: `seg-${r}-${i}` });
  g.text(cx, cy - 7, `${filled * 4}B`, { size: bigSize, weight: 700, mono: true, anchor: "middle", k: `ringtxt-${r}` });
  g.text(cx, cy + 15, "좌표 대기", { size: 12, anchor: "middle", fill: C.muted });
}
function mapBox(g, r, x, y, s, capX, capY) {
  // 톤은 A·B 지도와 같게: 배경색 바탕 + 1.5 테두리, 네 모서리 꺾쇠(0.55), 안쪽 9 들여 흐린 격자(0.45)
  g.rect(x, y, s, s, { fill: C.bg, stroke: C.edge, sw: 1.5, rx: 1.5 });
  for (const [px, py, sx, sy] of [[x - 4, y - 4, 1, 1], [x + s + 4, y - 4, -1, 1], [x - 4, y + s + 4, 1, -1], [x + s + 4, y + s + 4, -1, -1]])
    g.raw(`<path d="M${px} ${py + sy * 7}L${px} ${py}L${px + sx * 7} ${py}" fill="none" stroke="${C.muted}" stroke-width="1.5" opacity=".55"/>`);
  const gx = x + 9, gy = y + 9, gs = s - 18, cell = gs / 3;
  g.raw(`<rect x="${gx}" y="${gy}" width="${gs}" height="${gs}" fill="none" stroke="${C.edge}" stroke-width="1.5" opacity=".45"/>`);
  for (let i = 1; i < 3; i++) g.raw(`<path d="M${gx + cell * i} ${gy}L${gx + cell * i} ${gy + gs}M${gx} ${gy + cell * i}L${gx + gs} ${gy + cell * i}" stroke="${C.edge}" stroke-width="1.5" opacity=".45"/>`);
  // 칸 배경은 캐릭터를 따라가지 않는다 — B처럼 출발 칸은 흐려지고 도착 칸은 진해지며 제자리에서 교차한다
  g.rect(gx + 1, gy + cell + 1, cell - 2, cell - 2, { fill: C.soft, stroke: "none", rx: 0, k: `cellsrc-${r}`, opacity: 0 });
  g.rect(gx + cell + 1, gy + cell + 1, cell - 2, cell - 2, { fill: C.soft, stroke: "none", rx: 0, k: `celldst-${r}`, opacity: 1 });
  // 이동 화살표 — B와 같이 두 칸 중심 사이 22%~73% 구간, 이동하는 동안만 보인다
  const ay = gy + cell * 1.5, a0 = gx + cell * .5 + cell * .22, a1 = gx + cell * .5 + cell * .73;
  g.group({ "data-k": `arrow-${r}`, opacity: 0 }, () => {
    g.raw(`<path d="M${a0} ${ay}L${a1} ${ay}" fill="none" stroke="${C.track}" stroke-width="1.5"/><polyline points="${a1 - 4},${ay - 3} ${a1},${ay} ${a1 - 4},${ay + 3}" fill="none" stroke="${C.track}" stroke-width="1.5"/>`);
  });
  // 최종 자리 = 가운데 칸. 재생 처음엔 한 칸 서쪽에서 출발한다
  g.group({ "data-k": `wiz-${r}`, "data-cell": cell, transform: "translate(0 0)" }, () => {
    g.wizard(gx + cell + 2, gy + cell + 1, cell - 4, { k: `face-s-${r}` });
    g.wizard(gx + cell + 2, gy + cell + 1, cell - 4, { k: `face-e-${r}`, rows: eastPixels, opacity: 0 });
  });
  g.text(capX, capY, "서버 좌표 (float)", { size: 12, anchor: "middle", fill: C.muted });
  g.text(capX, capY + 17, `${(X0 + 1).toFixed(5)}, ${Y0.toFixed(5)}`, { size: 12, anchor: "middle", fill: C.muted, mono: true, k: `cap-${r}` });
}
const TITLES = [["변경 전 · float 그대로 복사", C.text], ["변경 후 · ×512 반올림 후 uint16", C.gold]];

// 넓은 화면 — 시안 2 배치 그대로(958 × 584)
function wide() {
  const W = 958, H = 584, ROW = [52, 326], g = svgWriter();
  g.text(108, 26, "캐릭터 이동", { anchor: "middle", weight: 700 });
  g.text(499, 26, "이동 메시지", { anchor: "middle", fill: C.muted });
  g.text(810, 26, "SendQ · 링버퍼", { anchor: "middle", weight: 700 });
  g.raw(`<line x1="20" x2="${W - 20}" y1="${ROW[1] - 20}" y2="${ROW[1] - 20}" stroke="${C.edge}"/>`);
  [0, 1].forEach(r => g.group({ "data-k": `row-${r}`, opacity: 1 }, () => {
    const top = ROW[r], mx = 24, my = top + 36, s = 168, midY = my + s / 2;
    g.text(240, top + 14, TITLES[r][0], { size: 15, weight: 700, fill: TITLES[r][1] });
    mapBox(g, r, mx, my, s, mx + s / 2, my + s + 20);
    const cx = 340, cy = top + 70, cw = 26, bh = 34, cardW = 318, sy = cy + 48, mapR = mx + s + 6;
    g.rect(cx, cy, cardW, 104);
    g.text(cx + 12, cy + 16, "Msg", { size: 13, weight: 700 });
    g.rect(cx + 12, sy, 62, bh, { fill: C.header, stroke: C.edge, rx: 2 }); g.text(cx + 43, sy + bh / 2 + 1, "Header", { size: 12, fill: C.muted, anchor: "middle" });
    msgSlots(g, r, cx + 82, sy, cw, bh, 12);
    const cx2 = 810, cy2 = top + 120, R = 64;
    g.line([[mapR, midY], [cx, midY]]);
    g.pulse(`pin-${r}`, [[[mapR, midY], [cx, midY]]]);
    g.line([[cx + cardW, cy2], [cx2 - R - 4, cy2]]);
    g.pulse(`pout-${r}`, [[[cx + cardW, cy2], [cx2 - R - 4, cy2]]]);
    ring(g, r, cx2, cy2, R, 38, r ? 1 : 2, 22);
    g.line([[cx2 + R + 4, cy2], [W - 12, cy2]]);
    g.text(cx2 + R + 8, cy2 - 12, "WSASend", { size: 11, fill: C.muted });
  }));
  return { W, H, markup: g.o.join("") };
}

// 좁은 화면 — A~D 좁은 배치와 같게 지도 → Msg → SendQ를 위에서 아래로 한 줄로 쌓는다(400 × 1120)
function narrow() {
  const W = 400, H = 1120, ROW = [12, 572], g = svgWriter();
  g.raw(`<line x1="12" x2="${W - 12}" y1="${ROW[1] - 12}" y2="${ROW[1] - 12}" stroke="${C.edge}"/>`);
  [0, 1].forEach(r => g.group({ "data-k": `row-${r}`, opacity: 1 }, () => {
    const top = ROW[r], s = 150, mx = (W - s) / 2, my = top + 58, midY = my + s / 2, mapR = mx + s + 6, vx = 330;
    g.text(16, top + 14, TITLES[r][0], { size: 15, weight: 700, fill: TITLES[r][1] });
    g.text(W / 2, top + 40, "캐릭터 이동", { size: 12, anchor: "middle", fill: C.muted });
    mapBox(g, r, mx, my, s, W / 2, my + s + 20);
    const cx = 16, cy = top + 270, cw = 24, bh = 30, sy = cy + 40, cardW = 368;
    g.rect(cx, cy, cardW, 98);
    g.text(cx + 12, cy + 16, "Msg", { size: 13, weight: 700 });
    g.rect(cx + 12, sy, 52, bh, { fill: C.header, stroke: C.edge, rx: 2 }); g.text(cx + 38, sy + bh / 2 + 1, "Header", { size: 12, fill: C.muted, anchor: "middle" });
    msgSlots(g, r, cx + 72, sy, cw, bh, 11);
    // 지도 → Msg: 지도 아래 좌표 글자를 피해 오른쪽으로 돌아 내려온다
    g.line([[mapR, midY], [vx, midY], [vx, cy]]);
    g.pulse(`pin-${r}`, [[[mapR, midY], [vx, midY], [vx, cy]]]);
    // Msg → SendQ: Msg 아래 왼쪽에서 내려와 링 왼쪽으로 들어간다(B 좁은 배치와 같은 방향)
    const rx = W / 2, ry = top + 470, R = 56, mb = cy + 98, lx = 60;
    g.text(rx, ry - R - 18, "SendQ · 링버퍼", { size: 12, anchor: "middle", fill: C.muted });
    g.line([[lx, mb], [lx, ry], [rx - R - 4, ry]]);
    g.pulse(`pout-${r}`, [[[lx, mb], [lx, ry], [rx - R - 4, ry]]]);
    ring(g, r, rx, ry, R, 34, r ? 1 : 2, 20);
    g.line([[rx + R + 4, ry], [W - 12, ry]]);
    g.text(rx + R + 8, ry - 12, "WSASend", { size: 11, fill: C.muted });
  }));
  return { W, H, markup: g.o.join("") };
}

const controller = `(function(){
  "use strict";
  var root=document.getElementById(${JSON.stringify(ROOT_ID)});if(!root)return;
  var X0=${X0},Y0=${Y0.toFixed(5)};
  // 변경 전·후를 동시에 재생한다(A 그림과 같은 방식). [줄, 단계, 시작, 길이] 단위 ms
  // 두 줄은 Msg에 float이 찰 때까지 똑같고, 변경 후 줄만 Msg 안에서 qx·qy로 바뀐다(morph). SendQ로는 두 줄이 같은 순간에 보낸다
  var PLAN=[[0,"move",350,650],[0,"src",1000,700],[0,"write",1700,700],[0,"copy",3400,650],[0,"queue",4050,600],
    [1,"move",350,650],[1,"src",1000,700],[1,"write",1700,700],[1,"morph",2450,600],[1,"ghost",3050,300],[1,"copy",3400,650],[1,"queue",4050,600]];
  var HOLD=450,SEGS=PLAN.map(function(s){return {row:s[0],phase:s[1],start:s[2],dur:s[3],end:s[2]+s[3]};});
  var END=SEGS.reduce(function(a,s){return Math.max(a,s.end);},0)+HOLD;
  function clamp(v){return v<0?0:v>1?1:v;}
  function ease(p){p=clamp(p);return p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;}
  function row(){return {move:0,pulseIn:null,pulseOut:null,cells:[0,0],morph:0,ghost:0,queue:0,dim:0};}
  function frame(t){
    var rows=[row(),row()];
    for(var i=0;i<SEGS.length;i++){
      var s=SEGS[i];if(t<s.start)continue;
      var raw=clamp((t-s.start)/s.dur),p=ease(raw),live=t<s.end,R=rows[s.row];
      switch(s.phase){
        case "move":R.move=p;break;
        case "src":if(live)R.pulseIn={seg:0,p:raw};break;
        case "write":R.cells=[ease(raw*2),ease(raw*2-1)];break;
        case "morph":R.morph=p;break;
        case "ghost":R.ghost=p;break;
        case "copy":if(live)R.pulseOut=raw;break;
        case "queue":R.queue=p;break;
      }
    }
    return rows;
  }
  function along(pts,p){
    var len=0,i,segs=[];for(i=1;i<pts.length;i++){var d=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);segs.push(d);len+=d;}
    var want=len*clamp(p);for(i=0;i<segs.length;i++){if(want<=segs[i]||i===segs.length-1){var k=segs[i]?Math.min(1,want/segs[i]):1;return [pts[i][0]+(pts[i+1][0]-pts[i][0])*k,pts[i][1]+(pts[i+1][1]-pts[i][1])*k];}want-=segs[i];}
    return pts[pts.length-1];
  }
  var boards=Array.prototype.slice.call(root.querySelectorAll("svg[data-board]"));
  function set(el,k,v){if(el)el.setAttribute(k,v);}
  function apply(rows){
    boards.forEach(function(svg){
      function q(k){return svg.querySelector('[data-k="'+k+'"]');}
      rows.forEach(function(R,r){
        set(q("row-"+r),"opacity",(1-.72*R.dim).toFixed(3));
        var wiz=q("wiz-"+r);set(wiz,"transform","translate("+(-(1-R.move)*parseFloat(wiz.getAttribute("data-cell"))).toFixed(2)+" 0)");
        var moving=R.move>0&&R.move<1;set(q("face-s-"+r),"opacity",moving?0:1);set(q("face-e-"+r),"opacity",moving?1:0);
        set(q("cellsrc-"+r),"opacity",(1-R.move).toFixed(3));set(q("celldst-"+r),"opacity",R.move.toFixed(3));
        set(q("arrow-"+r),"opacity",moving?(.6*Math.min(1,R.move/.15,(1-R.move)/.15)).toFixed(3):0);
        var cap=q("cap-"+r);if(cap)cap.textContent=(X0+R.move).toFixed(5)+", "+Y0.toFixed(5);
        var pin=q("pin-"+r);
        if(R.pulseIn){var xy=along(JSON.parse(pin.getAttribute("data-path"+R.pulseIn.seg)),R.pulseIn.p);set(pin,"cx",xy[0].toFixed(1));set(pin,"cy",xy[1].toFixed(1));set(pin,"opacity",1);}else set(pin,"opacity",0);
        var pout=q("pout-"+r);
        if(R.pulseOut!==null){var xy2=along(JSON.parse(pout.getAttribute("data-path0")),R.pulseOut);set(pout,"cx",xy2[0].toFixed(1));set(pout,"cy",xy2[1].toFixed(1));set(pout,"opacity",1);}else set(pout,"opacity",0);
        for(var i=0;i<2;i++)set(q("fill-"+r+"-"+i),"opacity",R.cells[i].toFixed(3));
        var n=r?1:2,filled=0;
        for(var j=0;j<n;j++){var v=clamp(R.queue*n-j);set(q("seg-"+r+"-"+j),"opacity",v.toFixed(3));if(v>=1)filled++;}
        var txt=q("ringtxt-"+r);if(txt)txt.textContent=(filled*4)+"B";
        if(r===1){set(q("ghost"),"opacity",R.ghost.toFixed(3));
          var m=R.morph;
          function mix(el,a,b){return parseFloat(el.getAttribute(a))+(parseFloat(el.getAttribute(b))-parseFloat(el.getAttribute(a)))*m;}
          for(var k=0;k<2;k++){
            var sl=q("slot-"+k),mo=q("morph-"+k),x=mix(sl,"data-x0","data-x1"),w=mix(sl,"data-w0","data-w1"),c=(x+w/2).toFixed(2);
            set(sl,"x",x.toFixed(2));set(sl,"width",w.toFixed(2));
            set(mo,"transform","translate("+x.toFixed(2)+" "+mo.getAttribute("data-y")+") scale("+(w/parseFloat(mo.getAttribute("data-w0"))).toFixed(4)+" 1)");
            // 파랑 float → 금색 정수. 글자는 겹치지 않게 앞 절반에 사라지고 뒤 절반에 나타난다
            var gold=clamp((m-.35)/.3);set(q("mblue-"+k),"opacity",(1-gold).toFixed(3));set(q("mgold-"+k),"opacity",gold.toFixed(3));
            set(q("mtf-"+k),"opacity",clamp(1-m*2).toFixed(3));set(q("mti-"+k),"opacity",clamp(m*2-1).toFixed(3));
            ["mtf-","mti-","slotlab-","slotb-"].forEach(function(p){set(q(p+k),"x",c);});
            [q("slotlab-"+k),q("slotb-"+k)].forEach(function(el){el.textContent=el.getAttribute(m<.5?"data-t0":"data-t1");});
          }
        }
      });
    });
  }
  var playBtn=root.querySelector('[data-action="play"]'),resetBtn=root.querySelector('[data-action="reset"]'),speedBtn=root.querySelector('[data-action="speed"]');
  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var t=END,playing=false,speed=1,last=0,raf=0;
  function render(){apply(frame(t));playBtn.textContent=playing?"❚❚":"▶";playBtn.setAttribute("aria-label",playing?"일시정지":"재생");}
  function tick(now){t=Math.min(END,t+(now-last)*speed);last=now;if(t>=END)playing=false;render();if(playing)raf=requestAnimationFrame(tick);}
  function play(){if(reduce){t=END;render();return;}if(t>=END)t=0;playing=true;last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);render();}
  function pause(){playing=false;cancelAnimationFrame(raf);render();}
  playBtn.addEventListener("click",function(){playing?pause():play();});
  resetBtn.addEventListener("click",function(){t=0;play();});
  var speeds=[{label:"1×",rate:1},{label:"1.5×",rate:1.5},{label:"0.5×",rate:.5}],si=0;
  speedBtn.addEventListener("click",function(){si=(si+1)%speeds.length;speed=speeds[si].rate;speedBtn.textContent=speeds[si].label;speedBtn.setAttribute("aria-label","재생 속도: "+speeds[si].label);});
  // 폭 700 미만이면 좁은 배치(B 그림과 같은 기준)
  function layout(){root.setAttribute("data-layout",root.clientWidth<700?"narrow":"wide");}
  layout();if(typeof ResizeObserver==="function")new ResizeObserver(layout).observe(root);else window.addEventListener("resize",layout);
  // 처음 화면은 완성 상태 — 누르지 않아도 변경 전·후 차이가 보이게
  render();
  window.__quantizationFigure={end:END,seek:function(ms){pause();t=Math.max(0,Math.min(END,ms));render();},frame:frame};
})();`;

const wideBoard = wide(), narrowBoard = narrow();
const board = (b, cls, label) => `<svg class="q-board ${cls}" data-board="${cls}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${b.W} ${b.H}" role="img" aria-label="${label}">${b.markup}</svg>`;
const LABEL = "변경 전에는 float 좌표 x·y를 4바이트씩 Msg에 복사해 좌표가 8바이트, 변경 후에는 ×512 반올림한 uint16 qx·qy를 2바이트씩 담아 4바이트";
const body = `<div id="${ROOT_ID}" data-layout="wide" aria-label="E 그림 · 좌표 양자화 변경 전·후">
  <div class="viz-controls">
    <button class="btn" type="button" data-action="play" aria-label="재생">▶</button>
    <button class="btn" type="button" data-action="reset" aria-label="처음부터 재생">↺</button>
    <button class="btn" type="button" data-action="speed" aria-label="재생 속도: 1×">1×</button>
  </div>
  ${board(wideBoard, "wide", LABEL)}
  ${board(narrowBoard, "narrow", LABEL)}
</div>`;

// 글꼴 — 이 그림에 쓰는 글자만 잘라 넣는다
const chars = [...new Set((body + controller.replace(/^\s*\/\/.*$/gm, "")).replace(/<[^>]*>/g, " ") + "0123456789.,:B×−▶❚↺ ")].join("");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "qfont-")), textFile = path.join(tmp, "chars.txt");
fs.writeFileSync(textFile, chars, "utf8");
const fontFace = (family, file) => {
  const out = path.join(tmp, family + ".woff2");
  execFileSync("python", ["-m", "fontTools.subset", path.join(FONT_DIR, file), `--text-file=${textFile}`, "--flavor=woff2", "--layout-features=*", `--output-file=${out}`]);
  return `@font-face{font-family:${family};src:url("data:font/woff2;base64,${fs.readFileSync(out).toString("base64")}") format("woff2");font-weight:100 900;font-display:block}`;
};
const fonts = fontFace("PCB-Pretendard", "PretendardVariable.woff2") + "\n" + fontFace("PCB-Mono", "JetBrainsMono.woff2");
fs.rmSync(tmp, { recursive: true, force: true });

const css = `${fonts}
#${ROOT_ID}{width:100%;max-width:958px;margin:0 auto;background:${C.bg}}
#${ROOT_ID} .q-board{display:block;width:100%;height:auto}
#${ROOT_ID}[data-layout="wide"] .q-board.narrow,#${ROOT_ID}[data-layout="narrow"] .q-board.wide{display:none}
#${ROOT_ID} text{font-family:PCB-Pretendard,"Malgun Gothic",sans-serif}
#${ROOT_ID} .q-mono{font-family:PCB-Mono,PCB-Pretendard,monospace;font-variant-numeric:tabular-nums}
#${ROOT_ID} .viz-controls{display:flex;align-items:center;gap:8px}
#${ROOT_ID} .btn{font-family:PCB-Pretendard,"Malgun Gothic",sans-serif;font-size:13px;font-weight:600;padding:8px 12px;border-radius:7px;border:1px solid ${C.edge};color:${C.text};background:${C.surface};cursor:pointer;min-width:40px}
#${ROOT_ID} .btn[data-action="play"]{background:#46b1ff;border-color:#46b1ff;color:${C.ink}}`;
const html = `<meta charset="UTF-8">\n<style>\n${css}\n</style>\n${body}\n<script>\n${controller}\n</script>\n`;
new Function(controller); // 문법 확인
fs.writeFileSync(path.join(dir, "quantization.html"), html);
console.log(JSON.stringify({ bytes: Buffer.byteLength(html), durationMs: Math.max(...eval(controller.match(/var PLAN=(\[[\s\S]*?\]\]);/)[1]).map(s => s[2] + s[3])) + 450, qx: QX, qy: QY, glyphs: chars.length, sha256: crypto.createHash("sha256").update(html).digest("hex") }));
