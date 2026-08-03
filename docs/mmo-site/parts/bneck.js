/* ═══════════ 병목 탭 — 실험 카드 열두 장 + 계기판 ═══════════
   한 화면에서 끝난다: 지도(왼쪽) · 카드 열두 장과 계기판(오른쪽).
   지도는 위 코드가 이미 갖고 있다. 여기서 더하는 것은 둘뿐이다 —
     ① 카드 열두 장: 번호 · 판정 · 이름 · 성과 한 줄 (노션 실측 보고서와 1:1)
     ② 계기판: 고른 카드의 before → after
   위 코드의 IIFE 안으로 들어가지 않는다. 연결은 실험 배열(window.__EXPS)과
   위 코드가 만들어 둔 핀 마크업(#bnpins .pin[data-loc]) 둘뿐이다 — 한 방향이라 훅이 없다.
   (한때 핀 클릭을 이쪽으로 넘기는 window.__bnPickLoc 이 있었는데, 핀에서 클릭을 걷어내며 같이 지웠다.) */
(function(){
"use strict";
var RM = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* 네 칸은 실험마다 공통으로 잰 것만 둔다.
   dir −1 작을수록 좋음 · 0 좋고 나쁨을 여기서 정하지 않음.

   동접·송신 메시지·송신량을 0 으로 둔 이유: 이 셋은 실험마다 성격이 다르다. Send Coalescing 에서는
   양쪽을 같게 맞춘 통제값이고(변하면 실험이 틀린 것), 섹터 묶음에서는 송신 메시지가 −73% 인 게 성과다.
   같은 칸을 어떤 실험에선 초록으로, 어떤 실험에선 빨강으로 칠할 근거가 계기판에는 없다 —
   좋고 나쁨은 카드의 성과 한 줄이 말한다. 여기서는 변화량만 부호 그대로 적는다. */
var MET = [
  {k:"ccu",  n:"동접",    u:"명",     dir:0},
  {k:"pps",  n:"송신 메시지", u:"건/s", dir:0},
  {k:"send", n:"송신량",  u:"MB/s",   dir:0},
  {k:"tick", n:"틱 p99",  u:"ms",     dir:-1}
];
/* 카드에 서는 것은 노션 실측 보고서가 있는 열둘뿐이다(scene.js 의 NOTION_EXP 가 no·nt 를 붙인다).
   현황판 · 동접별 트래픽 · 정정 이력 · 미측정 3건은 배열에는 있으나 카드로 서지 않는다. */
var EXPS = (window.__EXPS||[]).filter(function(e){ return e.no; })
             .sort(function(a,b){ return a.no-b.no; });
if(!EXPS.length) return;
var ST={ok:"채택", rj:"기각", dg:"진단", sum:"결론"};

function $(s,r){ return (r||document).querySelector(s); }
/* 노션에 적힌 표기를 그대로 되살린다 — 반올림해서 다른 숫자로 만들지 않는다.
   그래서 자릿수를 고정하지 않고 값이 원래 갖고 있는 소수 자릿수를 쓴다. */
function decOf(v){ var s=String(v), i=s.indexOf("."); return i<0?0:s.length-i-1; }
function fmt(v,d){ return v.toLocaleString("ko-KR",{minimumFractionDigits:d,maximumFractionDigits:d}); }
/* 송신 메시지는 실험에 따라 8만/s 에서 1000만/s 까지 벌어진다. 노션도 그 폭에 맞춰
   초반은 k, 후반은 만 으로 적었으므로 같은 경계를 쓴다.
   ※ big — 구르는 동안 단위를 바꾸지 않기 위한 못이다. 경계(1e6)를 값마다 따로 판단하면
     83k → 1,005만 으로 굴러갈 때 852k 다음 프레임이 100만 이 되어 **숫자가 852 → 100 으로
     뚝 떨어진다**(단위가 바뀌었으니 실제로는 계속 늘고 있는데도). 값이 거꾸로 가는 것처럼
     보이는 그 한 프레임이 '음수로 튄다' 로 읽혔다. 도착값의 단위로 전 구간을 통일한다.
   ※ d — 마찬가지로 도착값 기준 자릿수다. 여기서 v 의 자릿수를 세면 보간 중간값의 부동소수가
     그대로 나와 '112.80547454814322k' 같은 것이 찍힌다(실측). */
function fmtV(k,v,d,big){
  if(v==null) return "—";
  if(k==="pps"){
    var man = (big==null) ? v>=1e6 : big;
    return man ? fmt(Math.round(v/1e4),0)+"만" : fmt(v/1e3,d==null?decOf(v/1e3):d)+"k";
  }
  return fmt(v,d==null?decOf(v):d);
}
/* 부호는 값이 실제로 움직인 방향 그대로다 — 틱 p99 65.3 → 9.2ms 는 −86%.
   한때 여기서 '좋아진 정도' 로 부호를 뒤집어 +86% 로 적었는데, 노션 표기(−86%)와 부호가 반대로
   갈려 같은 실험이 두 곳에서 다르게 읽혔다. 좋고 나쁨은 부호가 아니라 색이 맡는다. */
function pct(b,a){ if(b==null||a==null||!b) return null; return (a-b)/b*100; }
function pctTxt(p){ return p==null ? "—" : (Math.abs(p)<0.5 ? "±0%" : (p>0?"+":"−")+Math.round(Math.abs(p))+"%"); }
/* 값 굴리기. 숫자가 튀던 두 가지를 여기서 막는다.
   ① q 를 [0,1] 로 가둔다. rAF 가 넘겨주는 now 는 '이 프레임이 시작한 시각' 이라,
      프레임 처리 도중에 찍은 t0 보다 **앞설 수 있다**. 하한이 없으면 q<0 → e=1-(1-q)³<0 이 되어
      값이 출발점에서 목표 반대쪽으로 벗어난다 — 동접 200 → 5,000 처럼 폭이 큰 칸에서
      한 프레임 동안 음수가 찍히던 것이 이것이다.
   ② 새 롤이 시작되면 이전 루프를 세운다(T.seq). 카드를 연달아 누르면 멈추지 않은 옛 루프와
      새 루프가 같은 칸에 번갈아 써서 숫자가 앞뒤로 왔다 갔다 한다.
   시작값은 목표값이 아니라 **지금 화면에 있는 값**에서 이어받는다(T.v 를 매 프레임 갱신) —
   구르는 도중에 눌러도 보이던 자리에서 이어져야 튀지 않는다. */
function roll(T,k,to,dur){
  var el=T.n, from=T.v;
  T.seq=(T.seq||0)+1;
  var my=T.seq;
  if(to==null){ el.textContent="—"; T.v=null; return; }
  var big=(k==="pps") ? to>=1e6 : null;      /* 구르는 내내 도착값의 단위를 쓴다 */
  var d=decOf(k==="pps"?(to>=1e6?Math.round(to/1e4):to/1e3):to);
  if(RM || document.hidden || from==null || from===to){ el.textContent=fmtV(k,to,d,big); T.v=to; return; }
  var t0=performance.now();
  (function step(now){
    if(T.seq!==my) return;                       /* 더 새 롤이 시작됐다 */
    var q=Math.max(0,Math.min(1,(now-t0)/dur)), e=1-Math.pow(1-q,3);
    var v=from+(to-from)*e;
    /* 네 지표(동접·건/s·MB/s·ms)는 음수가 없는 값이다. 위 두 방어로 −가 나올 산술 경로는
       막았지만, 굳이 바닥을 한 번 더 까는 것은 값이 아니라 화면을 지키기 위해서다 —
       구르는 중에 한 프레임이라도 −가 스치면 그 칸의 숫자를 다시 못 믿는다. */
    if(v<0) v=0;
    T.v=v;
    el.textContent=fmtV(k,v,d,big);
    if(q<1) requestAnimationFrame(step); else T.v=to;
  })(t0);
}

/* ═══ 계기판 ═══ */
var tiles = MET.map(function(M){
  var t=document.createElement("div"); t.className="bx-tile";
  t.innerHTML='<div class="l">'+M.n+'</div>'+
    '<div class="v"><span class="n">0</span><span class="u">'+M.u+'</span></div>'+
    '<div class="g"><i class="w"></i><i class="a"></i></div>'+
    '<div class="f"><span class="fr">—</span><span class="bx-chip fl">±0%</span></div>';
  $("#bx-dash").appendChild(t);
  return {el:t,n:$(".n",t),un:$(".u",t),w:$(".w",t),a:$(".a",t),fr:$(".fr",t),c:$(".bx-chip",t),M:M,v:0};
});
/* 막대는 절대 눈금이 아니라 그 실험 안에서의 대비다.
   실험끼리 자릿수가 100배 벌어지므로(1.62 MB/s ↔ 947 MB/s) 공통 눈금으로는 아무것도 안 보인다.
   둘 중 큰 쪽을 가득 채우고 나머지를 그 비율로 그린다 — 읽어야 할 것은 '끄고 대비 켜고' 뿐이다. */
function paintDash(it){
  tiles.forEach(function(T){
    var M=T.M, bv=it.bm?it.bm[M.k]:null, av=it.am?it.am[M.k]:null, p=pct(bv,av);
    roll(T,M.k,av,460);
    var top=Math.max(bv||0,av||0)||1;
    T.w.style.width=(bv==null?0:bv/top*100)+"%";
    T.a.style.width=(av==null?0:av/top*100)+"%";
    /* 안 잰 지표는 단위까지 지운다 — 값이 '—' 인데 'MB/s' 만 남으면 0 을 잰 것처럼 보인다 */
    T.un.textContent=(av==null?"":M.u);
    /* 왼쪽에 비교값이 없는 이유가 둘이라 말이 다르다 — 실험은 했는데 그 지표만 안 잡은 것,
       그리고 애초에 A/B 가 아니라 한 부하에서 본 진단(또는 종합)인 것. */
    T.fr.textContent=(bv==null
      ? (it.st==="dg" ? "이 부하에서 관측" : it.st==="sum" ? "지금 값" : "이 시기 미수집")
      : fmtV(M.k,bv)+" →");
    T.c.textContent=pctTxt(p);
    /* 색은 방향이 정해진 지표(dir≠0)에만 붙는다 — 부호는 값 그대로, 좋고 나쁨은 dir 이 판단 */
    var good = (p==null||M.dir===0||Math.abs(p)<0.5) ? 0 : (p*M.dir>0 ? 1 : -1);
    T.c.className="bx-chip "+(good>0?"up":good<0?"dn":"fl");
    T.el.className="bx-tile "+(av==null?"none":good>0?"good":good<0?"bad":"");
  });
}

/* ═══ 카드 열두 장 ═══
   한 장에 네 가지만 적는다: 번호 · 판정 · 동접 · 이름. 그리고 노션으로 나가는 ↗ 하나.
   결과 수치는 카드에 없다 — 한때 '송신 호출 −94%' 같은 성과 한 줄을 넣었는데, 열두 장이
   저마다 다른 지표를 외치면 훑을 때 이름이 뒤로 밀리고 서로 견줄 수도 없었다(실험마다 잰 지표가 다르다).
   무엇이 얼마나 바뀌었나는 아래 계기판이 고른 한 장에 대해서만 말하고, 나머지는 노션 원문이 맡는다.
   색도 고른 카드에만 켠다 — 열둘이 저마다 판정색을 띠면 어느 것이 열려 있는지가 색으로 안 짚인다. */
function build(){
  var body=document.getElementById("bnc-b"); if(!body) return;
  body.innerHTML=EXPS.map(function(e){
    var ccu=(e.am&&e.am.ccu) ? e.am.ccu.toLocaleString("ko-KR") : "5,000";
    return '<div class="rc k-'+e.st+'" data-s="'+e.s+'" data-loc="'+e.loc+'"'+
      ' tabindex="0" role="button" aria-pressed="false">'+
      '<span class="r1"><span class="no">'+e.no+'</span>'+
      '<span class="st">'+(ST[e.st]||"")+'</span>'+
      '<span class="cc">'+ccu+'</span>'+
      (e.nt ? '<a class="go" href="'+e.nt+'" target="_blank" rel="noopener"'+
              ' aria-label="'+e.n+' 실측 보고서 — 노션에서 열기">↗</a>' : '')+
      '</span>'+
      '<span class="nm">'+e.n+'</span></div>';
  }).join("");
}
build();

/* ═══ 지도 핀 ═══
   번호는 자리가 아니라 실험이 갖는다 — 고른 카드의 번호가 그 자리 핀에만 들어간다.
   핀은 읽는 표시일 뿐 누르는 것이 아니다(2026-08-04에 클릭을 걷어냈다 — 고르는 곳은 카드 한 군데다).
   그래서 '실측 카드가 없는 자리' 를 따로 표시할 일도 없어졌다: 고른 자리만 밝고 나머지는 흐리다. */
var curLoc=null, curNo="";
function paintPins(){
  var pins=document.querySelectorAll("#bnpins .pin");
  [].forEach.call(pins,function(g){
    var on = g.getAttribute("data-loc")===curLoc;
    g.classList.toggle("lit",on);
    g.classList.toggle("dim",!on);
    var t=g.querySelector(".pin-no"); if(t) t.textContent=on?curNo:"";
  });
}
/* 핀은 병목 탭에 처음 들어올 때(scene.js 의 build) 꽂힌다 — 이 스크립트가 도는 시점에는 아직 없다.
   그래서 꽂히는 것을 한 번만 기다렸다가 그때 칠한다(칠하고 나면 관찰을 끊는다). */
var pinHost=document.getElementById("bnpins");
if(pinHost && typeof MutationObserver==="function"){
  var mo=new MutationObserver(function(){
    if(pinHost.querySelector(".pin")){ mo.disconnect(); paintPins(); }
  });
  mo.observe(pinHost,{childList:true,subtree:true});
}

/* ═══ 고르기 ═══ */
function show(it){
  if(!it) return;
  paintDash(it);
  curLoc=it.loc; curNo=String(it.no);
  var body=document.getElementById("bnc-b");
  if(body) [].forEach.call(body.querySelectorAll(".rc"), function(c){
    var on = c.getAttribute("data-s")===String(it.s);
    c.classList.toggle("on", on);
    c.setAttribute("aria-pressed", on?"true":"false");
  });
  paintPins();
}
function byS(s){ return EXPS.filter(function(e){ return String(e.s)===String(s); })[0]; }

document.addEventListener("click", function(e){
  if(!e.target.closest) return;
  /* 카드 안 ↗ 는 노션으로 나가는 링크다 — 고르기까지 같이 일어나면 새 탭이 열리는 동시에
     뒤에 남은 화면이 바뀌어, 돌아왔을 때 무엇을 눌렀는지가 어긋난다. */
  if(e.target.closest("#bnc-b .rc a")) return;
  var c=e.target.closest("#bnc-b .rc");
  if(c){ show(byS(c.getAttribute("data-s"))); }
}, false);
document.addEventListener("keydown", function(e){
  if(e.key!=="Enter" && e.key!==" ") return;
  if(!e.target.closest) return;
  if(e.target.closest("#bnc-b .rc a")) return;
  var c=e.target.closest("#bnc-b .rc");
  if(c){ e.preventDefault(); show(byS(c.getAttribute("data-s"))); }
}, false);

show(EXPS[0]);
setTimeout(function(){ show(EXPS[0]); paintPins(); }, 400);   /* 진입 애니가 카드를 연 뒤 한 번 더 */
})();
