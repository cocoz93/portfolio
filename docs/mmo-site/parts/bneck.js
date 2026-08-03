/* ═══════════ 병목 탭 — 실험 카드 열두 장 + 계기판 ═══════════
   한 화면에서 끝난다: 지도(왼쪽) · 카드 열두 장과 계기판(오른쪽).
   지도는 위 코드가 이미 갖고 있다. 여기서 더하는 것은 둘뿐이다 —
     ① 카드 열두 장: 번호 · 판정 · 이름 · 성과 한 줄 (노션 실측 보고서와 1:1)
     ② 계기판: 고른 카드의 before → after
   위 코드의 IIFE 안으로 들어가지 않는다. 연결은 실험 배열(window.__EXPS)과
   위 코드가 만들어 둔 핀 마크업(#bnpins .pin[data-loc])뿐이고,
   핀 클릭이 이쪽으로 넘어오는 길만 훅 하나로 낸다(window.__bnPickLoc). */
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
   초반은 k, 후반은 만 으로 적었으므로 같은 경계를 쓴다. */
function fmtV(k,v,d){
  if(v==null) return "—";
  if(k==="pps") return v>=1e6 ? fmt(Math.round(v/1e4),0)+"만" : fmt(v/1e3,decOf(v/1e3))+"k";
  return fmt(v,d==null?decOf(v):d);
}
/* 부호는 값이 실제로 움직인 방향 그대로다 — 틱 p99 65.3 → 9.2ms 는 −86%.
   한때 여기서 '좋아진 정도' 로 부호를 뒤집어 +86% 로 적었는데, 노션 표기(−86%)와 부호가 반대로
   갈려 같은 실험이 두 곳에서 다르게 읽혔다. 좋고 나쁨은 부호가 아니라 색이 맡는다. */
function pct(b,a){ if(b==null||a==null||!b) return null; return (a-b)/b*100; }
function pctTxt(p){ return p==null ? "—" : (Math.abs(p)<0.5 ? "±0%" : (p>0?"+":"−")+Math.round(Math.abs(p))+"%"); }
function roll(el,k,from,to,dur){
  if(to==null){ el.textContent="—"; return; }
  var d=decOf(k==="pps"?(to>=1e6?Math.round(to/1e4):to/1e3):to);
  if(RM || document.hidden || from==null || from===to){ el.textContent=fmtV(k,to,d); return; }
  var t0=performance.now();
  (function step(now){ var q=Math.min(1,(now-t0)/dur), e=1-Math.pow(1-q,3);
    el.textContent=fmtV(k,from+(to-from)*e,d); if(q<1) requestAnimationFrame(step); })(t0);
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
    roll(T.n,M.k,T.v,av,460); T.v=av;
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
   한 장에 네 가지만 적는다: 번호 · 판정 · 동접 · 이름 · 성과 한 줄.
   측정 조건과 A/B 표는 카드에 없다 — 그 자리는 노션 원문(↗)이 맡는다.
   색은 고른 카드에만 켠다. 열둘이 저마다 판정색을 띠고 있으면 어느 것이 열려 있는지가
   색으로는 안 짚이고, 훑을 때도 초록·빨강 열두 덩어리가 먼저 들어와 이름이 뒤로 밀린다. */
function build(){
  var body=document.getElementById("bnc-b"); if(!body) return;
  body.innerHTML=EXPS.map(function(e){
    /* 성과 줄은 노션의 결론(r)에서 앞 조각만 쓴다 — 카드 폭 200px 에 한 줄로 들어가는 길이다.
       한글이 섞이면 mono 에서 글자마다 글꼴이 폴백돼 자간이 벌어진다(범례·캡션과 같은 규칙). */
    var hit=(e.r||"").split(" · ")[0];
    var ccu=(e.am&&e.am.ccu) ? e.am.ccu.toLocaleString("ko-KR") : "5,000";
    return '<div class="rc k-'+e.st+'" data-s="'+e.s+'" data-loc="'+e.loc+'"'+
      ' tabindex="0" role="button" aria-pressed="false">'+
      '<span class="r1"><span class="no">'+e.no+'</span>'+
      '<span class="st">'+(ST[e.st]||"")+'</span>'+
      '<span class="cc">'+ccu+'</span>'+
      (e.nt ? '<a class="go" href="'+e.nt+'" target="_blank" rel="noopener"'+
              ' aria-label="'+e.n+' 실측 보고서 — 노션에서 열기">↗</a>' : '')+
      '</span>'+
      '<span class="nm">'+e.n+'</span>'+
      '<span class="hit'+(/[가-힣]/.test(hit)?' ko':'')+'">'+hit+'</span></div>';
  }).join("");
}
build();

/* ═══ 지도 핀 ═══
   번호는 자리가 아니라 실험이 갖는다 — 고른 카드의 번호가 그 자리 핀에만 들어간다.
   실측 카드가 없는 자리(큐 넘김 · 수신 길목 · 저장 경로)는 늘 흐리고 누를 수도 없다:
   눌러도 갈 카드가 없는데 손가락 모양만 뜨면 눌러 본 사람이 고장으로 읽는다. */
var FIRST={};   /* 자리 → 그 자리의 첫 카드 (핀을 눌렀을 때 가는 곳) */
EXPS.forEach(function(e){ if(!FIRST[e.loc]) FIRST[e.loc]=e; });
var curLoc=null, curNo="";
function paintPins(){
  var pins=document.querySelectorAll("#bnpins .pin");
  [].forEach.call(pins,function(g){
    var L=g.getAttribute("data-loc"), has=!!FIRST[L], on=has&&L===curLoc;
    g.classList.toggle("lit",on);
    g.classList.toggle("dim",!on);
    if(!has){ g.classList.add("nodata"); g.removeAttribute("tabindex"); g.removeAttribute("role"); }
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

/* 접힌 배치(창 1600 이하)에서는 카드가 지도 아래로 내려가 첫 화면 밖에 있다.
   그 상태로 핀을 누르면 화면에서 아무 일도 안 일어난 것처럼 보인다 — 카드를 끌어올린다.
   두 칸 배치에서는 카드가 이미 옆에 보이므로 아무것도 하지 않는다(판정은 화면 밖인지 하나로 한다,
   창 폭을 다시 재서 분기점을 JS 에도 적어 두면 CSS 와 두 곳에서 갈린다). */
function bnScrollIntoView(){
  var card=document.getElementById("bncard"); if(!card||card.hidden) return;
  var r=card.getBoundingClientRect();
  if(r.top < innerHeight-100) return;          /* 이미 보인다 */
  scrollTo({top:scrollY+r.top-90, behavior:RM?"auto":"smooth"});
}

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

/* 지도 핀 → 그 자리의 첫 카드. scene.js 가 핀 클릭에서 부른다(그쪽은 이 파일을 모른다). */
window.__bnPickLoc=function(loc){
  var it=FIRST[loc]; if(!it) return;
  show(it); bnScrollIntoView();
};

show(EXPS[0]);
setTimeout(function(){ show(EXPS[0]); paintPins(); }, 400);   /* 진입 애니가 카드를 연 뒤 한 번 더 */
})();
