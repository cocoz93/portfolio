/* ═══════════ 병목 탭 — 고른 실험 한 장 + 넘기기 ═══════════
   한 화면에서 끝난다: 지도(왼쪽) · 고른 실험 한 장과 넘기는 장치(오른쪽).
   지도는 위 코드가 이미 갖고 있다. 여기서 더하는 것은 셋이다 —
     ① 한 장: 판정 · 이름 · 대표 지표 하나(눈금 고리 + 전 → 후) · 두 줄 설명 · 노션 원문
     ② 넘기기: 이전·다음 단추 · 동접 막대 · 번호 1~16 (노션 실측 보고서와 1:1)
     ③ 지도 핀: 고른 실험의 번호를 그 자리 배지에 넣고, 앞 자리에서 테가 건너간다
   위 코드의 IIFE 안으로 들어가지 않는다. 연결은 실험 배열(window.__EXPS)과
   위 코드가 만들어 둔 핀 마크업(#bnpins .pin[data-loc]) 둘뿐이다 — 한 방향이라 훅이 없다.
   (한때 핀 클릭을 이쪽으로 넘기는 window.__bnPickLoc 이 있었는데, 핀에서 클릭을 걷어내며 같이 지웠다.)

   ※ 한때(2026-10-26 까지) ① 이 '카드 열여섯 장 + 계기판 여섯 칸' 이었다. 계기판은 실험마다 같은
     여섯 지표(동접 · 소켓 호출 · 틱 p99 · 송신 메시지 · 평균 패킷 · 송신량)를 끄고 → 켜고로 세웠는데,
     면접관이 머무는 시간에 여섯 숫자를 다 읽지 않았고, 정작 그 실험의 성과는 여섯 칸에 흩어져 있었다.
     그래서 실험마다 **결과 지표 하나**를 골라(scene.js 의 FACE 표) 크게 세운다.
     여섯 지표 값(bm · am · ld)은 scene.js 에 그대로 있다 — 검사기(_work/verify.mjs)가 계속 본다. */
(function(){
"use strict";
var RM = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* 카드에 서는 것은 노션 실측 보고서가 있는 열여섯뿐이다(scene.js 의 NOTION_EXP 가 no·nt 를 붙인다).
   현황판 · 동접별 트래픽 · 정정 이력 · 미측정 3건은 배열에는 있으나 카드로 서지 않는다. */
var EXPS = (window.__EXPS||[]).filter(function(e){ return e.no; })
             .sort(function(a,b){ return a.no-b.no; });
if(!EXPS.length) return;
var ST={ok:"채택", rj:"기각", dg:"진단", sum:"결론"};

function $(s,r){ return (r||document).querySelector(s); }

/* ═══ 색 ═══
   판정색은 옛 카드의 왼쪽 띠 색 그대로다(채택 초록 · 기각 빨강 · 진단 노랑 · 결론 흰색).
   판에서 판정색이 서는 자리는 판정 글자와 고른 막대 둘뿐이다 — 숫자는 판정이 아니라 고리 색이 맡는다.
   고리 색(SGC)은 그 대표 지표가 좋아졌나(1) · 나빠졌나(−1) · 평평한가(0)다. 판정과 같지 않을 수 있다 —
   ⑭ 는 기각인데 송신량이 +0.7% 로 평평해서 회색이다(scene.js FACE 의 g). */
var COL={ok:"#3fbe7c", rj:"#e0705f", dg:"#d8a94b", sum:"#ffffff"};
var SGC={"1":"#46b1ff","-1":"#ff8a78","0":"#93a6bd"};
/* 고리가 없는 카드(⑤ 진단 · ⑯ 결론)의 한 줄 결론 색 */
var VC={rj:"#ff9a8d", dg:"#e0b45c"};

/* ═══ 눈금 고리 ═══
   토막 마흔 개, 한 토막 = 켜기 전 값의 2.5%. 줄었으면 줄어든 몫만큼 위에서부터 시계 방향으로 칠한다.
   남은 몫도 바탕보다 한 단계 밝게 둔다 — 바탕에 묻히면 '86% 줄었다' 가 아니라 '원이 조금 끊겼다' 로
   읽힌다. 줄어든 몫이 끝나는 자리에는 흰 선 하나를 긋는다.
   늘었으면(기각에 많다) 원 바깥 얇은 띠를 늘어난 몫만큼 칠한다 — 원 안을 칠하면 '줄었다' 와 그림이 같아진다.
   안팎 테두리 한 줄씩이 고리의 모양을 잡는다. 시안 단계에서 바깥에 눈금 마흔 개를 둘렀었는데,
   토막과 같은 2.5% 간격을 한 번 더 그린 것이라 테두리로 바꿨다(2026-10-26). */
var N=40, GAP=1.7;
/* 0° = 위, 시계 방향 */
function arc(c,r,a0,a1,col,w,cls){
  function p(a){ var t=(a-90)*Math.PI/180; return (c+r*Math.cos(t)).toFixed(2)+' '+(c+r*Math.sin(t)).toFixed(2); }
  return '<path class="'+cls+'" d="M'+p(a0)+' A'+r+' '+r+' 0 0 1 '+p(a1)+'" fill="none" style="stroke:'+col+'" stroke-width="'+w+'"/>';
}
function tick(c,r0,r1,a,col,w){
  var t=(a-90)*Math.PI/180, x=Math.cos(t), y=Math.sin(t);
  return '<line x1="'+(c+r0*x).toFixed(2)+'" y1="'+(c+r0*y).toFixed(2)+'" x2="'+(c+r1*x).toFixed(2)+'" y2="'+(c+r1*y).toFixed(2)+'" stroke="'+col+'" stroke-width="'+w+'"/>';
}
function ring(M){
  var q=M.a/M.b, k=Math.round(Math.abs(1-q)*N), h='<svg class="bx-ring" viewBox="0 0 180 180" aria-hidden="true">';
  h+='<circle cx="90" cy="90" r="'+(q>1?89:79)+'" fill="none" stroke="#3a4863" stroke-width="1.2"/>';
  h+='<circle cx="90" cy="90" r="53" fill="none" stroke="#2a3650" stroke-width="1"/>';
  for(var i=0;i<N;i++) h+=arc(90,66,i*360/N+GAP,(i+1)*360/N-GAP,"#2e3b56",17,"sg");
  if(q>1) for(var j=0;j<Math.min(k,N);j++) h+=arc(90,82,j*360/N+GAP,(j+1)*360/N-GAP,"#1f2a40",6,"sg ex");
  if(q<1&&k>0&&k<N) h+=tick(90,53,79,k*360/N,"#e8eef7",1.6);
  var big=String(M.d).length>5;
  h+='<text class="dv" x="90" y="'+(big?97:100)+'" text-anchor="middle" style="fill:'+SGC[M.g]+';font:800 '+(big?20:29)+'px var(--sans);letter-spacing:-.02em">'+M.d+'</text>';
  return h+'</svg>';
}
/* 토막을 차례로 칠하고 가운데 숫자를 0 부터 센다 — 숫자 꼴이 아닌 것('불변')은 세지 않는다 */
function play(svg,M,anim){
  var q=M.a/M.b, k=Math.round(Math.abs(1-q)*N), col=SGC[M.g];
  var lit = q<1 ? [].slice.call(svg.querySelectorAll(".sg:not(.ex)"),0,k) : [].slice.call(svg.querySelectorAll(".sg.ex"));
  lit.forEach(function(p,i){ if(anim) p.style.transitionDelay=(i*16)+"ms"; else p.style.transition="none"; });
  var go=function(){ lit.forEach(function(p){ p.style.stroke=col; }); };
  if(anim) requestAnimationFrame(function(){ requestAnimationFrame(go); }); else go();
  var dv=svg.querySelector(".dv"), m=String(M.d).match(/^([+−-]?)([\d.]+)(%)$/);
  if(!anim||!m) return;
  var to=parseFloat(m[2]), dp=(m[2].split(".")[1]||"").length, t0=performance.now(), dur=Math.max(300,lit.length*16+200);
  (function step(now){ var f=Math.max(0,Math.min(1,(now-t0)/dur)), e=1-Math.pow(1-f,3);
    if(!svg.isConnected) return;               /* 그새 다른 실험을 골랐다 */
    dv.textContent=(e>0?m[1]:"")+(to*e).toFixed(dp)+m[3]; if(f<1) requestAnimationFrame(step); })(t0);
}

/* ═══ 판 짓기 — 한 번만 짓고, 고를 때마다 글자와 고리만 갈아 끼운다 ═══ */
var card=document.getElementById("bncard"), body=document.getElementById("bnc-b");
if(!body) return;
var CHL='<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var CHR='<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
/* 위에서 아래로 한 방향으로 읽힌다: 판정 → 이름 → 숫자 → 설명 → 원문 → 넘기기 → 전체 목록.
   한때 맨 위에 판정과 노션 링크만 선 머리 줄이 있었다 — 판정은 이름 위로, 링크는 설명 아래로
   짝 옆에 붙이고 그 줄을 지웠다. 빠진 높이는 고리가 먹는다. */
body.innerHTML=
  '<div class="bx-mid"><div class="bx-hero">'+
    '<div class="bx-rw"></div>'+
    '<div class="bx-tx">'+
      '<div class="bx-st"></div><div class="bx-nm"></div>'+
      '<div class="bx-kl"></div>'+
      '<div class="bx-ba"><s></s><span class="ar">→</span><span><b></b> <span class="u"></span></span></div>'+
      '<div class="bx-big"></div><div class="bx-sub"></div>'+
      '<div class="bx-m"></div><div class="bx-out"></div>'+
    '</div>'+
  '</div></div>'+
  /* 넘기는 장치 셋: 이전·다음(이름을 단 단추) → 동접 막대 → 번호. 막대와 번호는 같은 열여섯 칸이라
     바로 붙인다 — 붙어 있어야 '이 막대가 이 번호 실험의 동접' 이 설명 없이 읽힌다. */
  '<div class="bx-foot">'+
    '<div class="bx-pg"><button type="button" class="p" data-d="-1">'+CHL+'<span class="w"><span class="k">이전</span><span class="t"></span></span></button>'+
      '<button type="button" class="n" data-d="1"><span class="w"><span class="k">다음</span><span class="t"></span></span>'+CHR+'</button></div>'+
    '<div class="bx-strip"><span class="bx-tag"></span></div>'+
    '<div class="bx-nums"></div>'+
  '</div>';
var P={};
["mid","hero","rw","tx","st","nm","kl","ba","big","sub","m","out","pg","strip","tag","nums"].forEach(function(k){ P[k]=$(".bx-"+k,body); });
/* 노션 원문 · 원리 그림으로 나가는 두 문을 설명 바로 아래로 옮긴다(셸에는 판 끝에 서 있다) */
["bn-more","bn-principle"].forEach(function(id){ var a=document.getElementById(id); if(a) P.out.appendChild(a); });

/* 막대 높이 = 그 실험의 동접(가장 높은 실험이 꽉 참). 빈 막대 = 기각 */
function ccuOf(e){ return (e.am&&e.am.ccu)||(e.bm&&e.bm.ccu)||0; }
var CMAX=Math.max.apply(null,EXPS.map(ccuOf))||1;
EXPS.forEach(function(e,i){
  var b=document.createElement("button");
  b.type="button"; b.textContent=e.no; b.setAttribute("data-i",i); b.setAttribute("aria-label",e.no+"번 "+e.n);
  P.nums.appendChild(b);
  var c=document.createElement("i");
  c.setAttribute("data-i",i); c.className=e.st==="rj"?"rj":"";
  c.title=e.no+" · "+e.n+" · 동접 "+ccuOf(e).toLocaleString("ko-KR");
  c.style.setProperty("--h",(ccuOf(e)/CMAX).toFixed(3));
  c.style.setProperty("--bd",(i*45)+"ms");   /* 들어올 때 왼쪽부터 차례로 솟는 지연(bneck.css .bn-enter) */
  P.strip.appendChild(c);
});
var BARS=P.strip.querySelectorAll("i"), NUMS=P.nums.querySelectorAll("button");

/* ═══ 한 장 칠하기 ═══ */
/* 띄어 쓴 조사('WSASend 를')가 줄 머리로 떨어지지 않게 앞 낱말에 묶는다 — 설명은 두 줄로 고르게 접힌다(text-wrap:balance) */
function bind(s){ return String(s).replace(/ (?=(를|을|은|는|이|가|의|에|로|으로|와|과)(\s|$))/g," "); }
function paintCard(it,fresh){
  var M=it.km;
  P.st.textContent=ST[it.st]||""; P.st.style.color=COL[it.st]||"";
  P.nm.textContent=it.n;
  P.m.textContent=bind(it.ms||it.m||"");
  [P.rw,P.kl,P.ba].forEach(function(x){ x.hidden=!M; });
  P.big.hidden=!!M;
  if(M){
    P.kl.textContent=M.lab;
    var at=String(M.at).match(/^([~≥]?[\d,.]+)\s*(.*)$/)||[0,M.at,""];
    $("s",P.ba).textContent=M.bt; $("b",P.ba).textContent=at[1]; $(".u",P.ba).textContent=at[2];
    P.rw.innerHTML=ring(M);
    play($("svg",P.rw),M,fresh&&!RM);
    P.sub.hidden=true;
  }else{
    /* 끄고/켜고가 없는 카드 — 고리 자리 없이 성과 줄을 한 줄 결론으로 세운다 */
    var seg=String(it.r||"").split(" · ");
    P.big.textContent=seg[0]; P.big.style.color=VC[it.st]||"var(--net)";
    P.sub.textContent=seg.slice(1).join(" · "); P.sub.hidden=seg.length<2;
    P.rw.innerHTML="";
  }
}
/* 처음과 끝에서는 돌아가지 않는다 — 1번의 '이전' 에 16번이 서면 순서가 있는 목록이 고리처럼 읽힌다.
   그 쪽 단추는 지우지 않고 흐리게 잠근다(disabled) — 지우면 남은 단추가 두 칸을 다 먹어 폭이 출렁인다.
   ※ 2026-10-29 전에는 자리만 남기고 비웠다(visibility). 1번 장에서 왼쪽 칸이 통째로 비어
     '이전' 이 있다는 것 자체가 안 보였다. 잠긴 쪽은 머리글을 '현재' 로 바꾸고 지금 실험 이름을 단다
     — 갈 곳 대신 '지금 여기' 를 말해 처음·끝이 읽힌다. */
function paintNav(it){
  var i=EXPS.indexOf(it), pv=EXPS[i-1], nx=EXPS[i+1];
  var bp=$(".p",P.pg), bn=$(".n",P.pg);
  bp.disabled=!pv; bn.disabled=!nx;
  $(".k",bp).textContent=pv?"이전":"현재"; $(".t",bp).textContent=(pv||it).no+". "+(pv||it).n;
  $(".k",bn).textContent=nx?"다음":"현재"; $(".t",bn).textContent=(nx||it).no+". "+(nx||it).n;
  [].forEach.call(NUMS,function(b,k){ b.classList.toggle("on",k===i); b.setAttribute("aria-pressed",k===i?"true":"false"); });
  [].forEach.call(BARS,function(c,k){
    var on=k===i, rj=EXPS[k].st==="rj";
    c.classList.toggle("on",on);
    c.style.background = on ? (rj?"transparent":COL[EXPS[k].st]) : "";
    c.style.boxShadow = on&&rj ? "inset 0 0 0 2px "+COL.rj : "";
  });
  /* 고른 막대 위 꼬리표 — 막대 높이가 동접이라는 것을 범례 없이 알린다 */
  P.tag.innerHTML='동접 <b>'+ccuOf(it).toLocaleString("ko-KR")+'</b>';
  P.tag.style.setProperty("--h",BARS[i].style.getPropertyValue("--h"));
}

/* ═══ 크기 맞추기 ═══
   두 칸일 때 판은 지도와 키가 같다 — 남는 높이는 고리가 먹고, 넘치면 고리가 먼저 줄어든다.
   쌓였을 때(좁은 화면)는 판이 제 내용 높이로 닫히고 고리는 폭에 맞춘다(휴대폰 폭은 이름 옆 작은 고리).
   판이 hidden 인 동안(진입 애니 전)은 잴 수가 없다 — 판이 서는 순간 ResizeObserver 가 다시 부른다. */
var PHONE=matchMedia("(max-width:560px)");
function fit(){
  var tilt=$("#p-bneck .bn-tilt");
  if(!card||card.hidden||!tilt||!cur||!card.offsetParent) return;
  var stacked = card.getBoundingClientRect().top > tilt.getBoundingClientRect().bottom-4;
  card.style.height = stacked ? "" : tilt.offsetHeight+"px";
  var sv=$("svg",P.rw);
  if(sv){
    var S = PHONE.matches ? 112
          : stacked ? Math.min(220, Math.round(P.hero.clientWidth*.42))
          : Math.max(140, Math.min(240, P.mid.clientHeight-16, Math.round(P.hero.clientWidth*.46)));
    /* 상한 300 → 240 (2026-10-28) — 300 이면 숫자 하나 담는 고리가 이름·수치 글 덩어리(261px)보다 커서
       눈이 고리에 먼저 갔다. 이름·큰 숫자는 그대로 둔다(같이 키운 판은 어색해 되돌림) */
    /* 판 폭의 46% 로도 묶는다 — 높이로만 정하면 판이 좁은 폭(58 39 · 1440)에서 고리가 295px 로 커져
       글 칸이 178px 로 눌리고 「SO_SNDBUF=0」 처럼 끊을 수 없는 이름이 넘쳤다(2026-10-27 실측) */
    sv.style.width=sv.style.height=S+"px";
    /* 고리가 글보다 키가 커서 넘치면 고리를 줄인다 — 글 키 아래로는 줄여 봐야 소용없다 */
    var over=P.hero.offsetHeight-P.mid.clientHeight;
    if(!stacked && over>0 && S>P.tx.offsetHeight){
      S=Math.max(140, P.tx.offsetHeight, S-over); sv.style.width=sv.style.height=S+"px"; }
    /* '전 → 후' 는 한 줄로 — 넘칠 때만 큰 숫자를 줄인다(⑪ '~5,200 명' · ⑭ '1,249 MB/s' 처럼 긴 값) */
    var bb=$("b",P.ba); bb.style.fontSize="";
    var fz=parseFloat(getComputedStyle(bb).fontSize);
    while(P.ba.scrollWidth>P.ba.clientWidth+1 && fz>20){ fz-=2; bb.style.fontSize=fz+"px"; }
  }
  /* 그래도 넘치면 글이 지도보다 키가 큰 폭이다(≈1260 아래) — 판을 넘친 만큼만 지도보다 길게 둔다.
     글을 자르거나 겹치게 두는 것보다 판 아래가 지도보다 조금 내려가는 쪽이 낫다. */
  /* ※ scrollHeight 로 재면 안 된다 — .bx-mid 가 가운데 정렬이라 넘친 몫이 위아래로 반씩 갈리고,
       scrollHeight 는 아래쪽 반만 센다(그러면 판을 반만 늘려 위가 잘린 채 남는다). 묶음의 키로 잰다. */
  var spill=P.hero.offsetHeight-P.mid.clientHeight;
  if(!stacked && spill>0) card.style.height=(tilt.offsetHeight+spill)+"px";
  var bar=BARS[EXPS.indexOf(cur)], cw=P.tag.offsetWidth, sw=P.strip.clientWidth;
  P.tag.style.left=Math.max(0,Math.min(sw-cw, bar.offsetLeft+bar.offsetWidth/2-cw/2))+"px";
}
if(typeof ResizeObserver==="function"){
  var ro=new ResizeObserver(function(){ fit(); });
  if(card) ro.observe(card);
  var tilt0=$("#p-bneck .bn-tilt"); if(tilt0) ro.observe(tilt0);
}
addEventListener("resize",fit);
if(PHONE.addEventListener) PHONE.addEventListener("change",fit);
if(document.fonts&&document.fonts.ready) document.fonts.ready.then(fit);

/* ═══ 지도 핀 ═══
   번호는 자리가 아니라 실험이 갖는다 — 고른 카드의 번호가 그 자리 핀에만 들어간다.
   핀은 읽는 표시일 뿐 누르는 것이 아니다(2026-08-04에 클릭을 걷어냈다 — 고르는 곳은 카드 한 군데다).
   그래서 '실측 카드가 없는 자리' 를 따로 표시할 일도 없어졌다: 고른 자리만 밝고 나머지는 흐리다. */
var curLoc=null, curNo="";
/* 튕기는 조건은 '자리가 바뀔 때' 가 아니라 '고른 실험이 바뀔 때' 다 — 한 자리에 실험이 여럿이라
   (송신 경로에 넷) 자리로만 보면 그 넷 사이를 오갈 때 지도가 아무 반응도 안 한다.
   배지 번호는 바뀌는데 정작 그 번호가 어디 떴는지를 눈이 못 따라가는 것이 원래 증상이었다. */
var lastPop=null;
/* 켜기는 따로 둔다 — 건너가는 동안은 앞 자리를 켠 채 두고, 테가 닿는 순간 새 자리를 켠다.
   ※ 예전에는 누르는 순간 새 자리를 켜고 나서 테를 날렸다. 그러면 날아가는 테는 이미 꺼진 자리에서
     출발해 이미 켜진 자리로 가는 셈이라, 어디에도 안 붙은 빨간 원이 빈 칸에 떠 보였다(2026-10-27 7→8). */
function litPin(){
  var lit=null;
  [].forEach.call(document.querySelectorAll("#bnpins .pin"),function(g){
    var on = g.getAttribute("data-loc")===curLoc;
    g.classList.toggle("lit",on);
    g.classList.toggle("dim",!on);
    if(on) lit=g;
    var t=g.querySelector(".pin-no"); if(t) t.textContent=on?curNo:"";
  });
  return lit;
}
function paintPins(){
  var lit=document.querySelector('#bnpins .pin[data-loc="'+curLoc+'"]');
  var key=curLoc+"/"+curNo;
  if(lit && key!==lastPop){
    lastPop=key;
    /* 진입 애니 중(핀이 막 꽂히는 중)이거나 모션 줄이기면 예전처럼 배지만 튕긴다 */
    var stage=$("#p-bneck .bn-stage");
    if(RM || (stage&&stage.classList.contains("bn-enter"))){ stopHop(); litPin(); popPin(lit); }
    /* 출발점은 '지금 켜져 있는 자리' 다 — 연달아 눌러 앞 건너가기가 끊겼으면 아직 앞 자리가 켜져 있다 */
    else hop(document.querySelector("#bnpins .pin.lit"),lit);
  }
  else { stopHop(); litPin(); }
}
/* 클래스는 한 핀에만 남긴다 — 안 지우면 지나온 자리마다 쌓여, 다음에 그 자리를 고를 때
   'remove 후 add' 가 같은 프레임에 묻혀 애니가 재시작되지 않는다. */
function popPin(g){
  var prev=document.querySelector("#bnpins .pin.pop"); if(prev) prev.classList.remove("pop");
  g.getBoundingClientRect();   /* 강제 리플로우 — 없으면 같은 핀을 다시 고를 때 애니가 안 돈다 */
  g.classList.add("pop");
}

/* ═══ 자리 건너가기 — 앞에 고른 자리에서 새 자리로 테가 건너간다 ═══
   고를 때 지도가 하던 일은 배지 튕김 하나였다. 그러면 '어디' 는 보여도 눈이 그 자리를 찾아야 한다 —
   오른쪽 판을 넘기는 동안 지도는 곁눈으로 보는 그림이라, 바뀐 자리로 시선을 끌어 줄 움직임이 필요하다.
     · 앞 자리의 바닥 테가 포물선을 그리며 새 자리로 날아간다(거리에 비례 · 0.38~0.70초로 묶는다)
     · 닿는 순간 배지 튕김 · 바닥 파문 · 부품 윤곽이 그려진다
     · 같은 자리 안에서 넘기면(송신 경로에 넷) 건너갈 곳이 없으니 튕김과 윤곽만
   ❌ 한때 패킷이 실제 배선을 따라 그 자리로 흘러 들어갔다(2026-10-27 하루). 클라에서 출발하는 길은
     실험 내용과 상관이 없어 정보가 없다는 판정으로 걷어냈다 — 길 좌표(PINS flow · data-flow)도 같이 지웠다.
     그보다 앞선 시안에서 핀이 다시 꽂히기 · 부품이 수치만큼 식기 등도 기각됐다
     ('식기' 는 오른쪽 고리와 같은 말을 한 번 더 한다).
   연달아 누르면 앞 움직임은 그 자리에서 끊는다 — 안 끊으면 떠난 자리에 테와 윤곽이 남는다. */
var NS="http://www.w3.org/2000/svg", FL=null;
function stopHop(){
  if(!FL) return;
  cancelAnimationFrame(FL.raf);
  FL.dots.forEach(function(d){ if(d.parentNode) d.parentNode.removeChild(d); });
  var s=FL.g.querySelector(".pin-slab");
  if(s){ s.style.strokeDasharray="";
         if(s.getAnimations) s.getAnimations().forEach(function(a){ a.cancel(); }); }
  FL=null;
}
function mk(t,a){ var e=document.createElementNS(NS,t); for(var k in a) e.setAttribute(k,a[k]); return e; }
/* 바닥 파문 한 번 — 평소 도는 파문(pin-pulse)과 같은 자리(지면 테)에서 한 번 크게 */
function ripple(g){
  var b=g.querySelector(".pin-base"); if(!b) return;
  var r=mk("ellipse",{cx:b.getAttribute("cx"),cy:b.getAttribute("cy"),rx:b.getAttribute("rx"),ry:b.getAttribute("ry"),
                       fill:"none",stroke:"#ff6b52","stroke-width":1.6});
  r.style.transformBox="fill-box"; r.style.transformOrigin="center"; r.style.opacity=0;
  g.insertBefore(r,b);
  r.animate([{transform:"scale(.6)",opacity:.95},{transform:"scale(2.6)",opacity:0}],{duration:620,easing:"cubic-bezier(.2,.7,.3,1)"})
    .onfinish=function(){ if(r.parentNode) r.parentNode.removeChild(r); };
}
/* 부품 윤곽이 한 바퀴 그려진 뒤 속이 찬다(.pin-slab 의 평소 채움 .16 에서 멈춘다) */
function outline(s){
  var L=s.getTotalLength();
  s.style.strokeDasharray=L;
  s.animate([{strokeDashoffset:L,fillOpacity:0},{strokeDashoffset:0,fillOpacity:0,offset:.65},{strokeDashoffset:0,fillOpacity:.16}],
            {duration:620,easing:"ease-in-out"});
}
function hop(a,b){
  stopHop();
  var sl=b.querySelector(".pin-slab");
  if(typeof b.animate!=="function"){ popPin(b); return; }
  var ba=a&&a!==b&&a.querySelector(".pin-base"), bb=b.querySelector(".pin-base");
  if(!ba||!bb){ FL={g:b,dots:[],raf:0}; litPin(); popPin(b); if(sl) outline(sl); return; }
  var x0=+ba.getAttribute("cx"), y0=+ba.getAttribute("cy"), x1=+bb.getAttribute("cx"), y1=+bb.getAttribute("cy");
  /* 테 크기도 앞 자리 → 새 자리로 바꿔 간다 — 출발 크기로 내려앉으면 새 자리 테와 어긋난 두 원이 된다 */
  var r0=+ba.getAttribute("rx"), r1=+bb.getAttribute("rx");
  var me=FL={g:b,dots:[],raf:0};
  var ring=mk("ellipse",{rx:r0,ry:r0,fill:"none",stroke:"#ff6b52","stroke-width":2});
  b.parentNode.appendChild(ring); me.dots.push(ring);
  var t0=performance.now(), dur=Math.max(380,Math.min(700,Math.hypot(x1-x0,y1-y0)/0.9));
  (function step(now){
    if(FL!==me) return;
    var t=Math.min(1,(now-t0)/dur), e=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2, r=r0+(r1-r0)*e;
    ring.setAttribute("cx",x0+(x1-x0)*e); ring.setAttribute("cy",y0+(y1-y0)*e-Math.sin(Math.PI*e)*28);
    ring.setAttribute("rx",r); ring.setAttribute("ry",r);
    if(t<1){ me.raf=requestAnimationFrame(step); return; }
    if(ring.parentNode) ring.parentNode.removeChild(ring); me.dots=[];
    litPin(); popPin(b); ripple(b); if(sl) outline(sl);
  })(t0);
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

/* 나가는 문 둘 — 노션 원문(고를 때마다 주소가 바뀐다)과, 그 실험에 원리 그림이 있으면 바로 아래 핵심 최적화 판(옛 1-3 탭).
   실험 이름을 문구에 넣지 않는 이유는 폭이다 — 무엇의 보고서인지는 바로 위 이름이 말한다. */
function paintMore(it){
  var principle=document.getElementById("bn-principle");
  var figure=window.__optimizationForExperiment&&window.__optimizationForExperiment(it.s);
  if(principle){principle.hidden=!figure;
    if(figure){principle.href="#optimization-"+figure.id;principle.dataset.optimization=figure.id;
      principle.setAttribute("aria-label",figure.title+" — 핵심 최적화 그림 보기");}
    else {principle.removeAttribute("href");delete principle.dataset.optimization;}}
  var a=document.getElementById("bn-more"); if(!a) return;
  if(it.nt){ a.href=it.nt; a.hidden=false;
             a.setAttribute("aria-label", it.n+" 실측 보고서 — 노션에서 열기"); }
  else { a.removeAttribute("href"); a.hidden=true; }
}

/* ═══ 고르기 ═══ */
var cur=null;
function show(it){
  if(!it) return;
  var fresh=it!==cur; cur=it;
  paintCard(it,fresh);
  paintNav(it);
  paintMore(it);
  curLoc=it.loc; curNo=String(it.no);
  paintPins();
  fit();
}
function go(d){ var j=EXPS.indexOf(cur)+d; if(j>=0&&j<EXPS.length) show(EXPS[j]); }
/* 진입 애니(scene.js)가 판을 켜는 순간 부른다 — 판이 투명한 동안 고리 칠하기·숫자 세기가 이미 끝나 버려서
   아무도 못 봤다(2026-10-29). 고리를 새로 지어 칠하기 전으로 되돌리고 다시 칠한다.
   새로 짓는 것은 토막 마흔여 개뿐이라 켜는 프레임에 얹어도 된다 — 짓기를 0.30s 로 미뤄 둔 판 전체(≈950개)와 다르다.
   (0.30s 에 미리 되돌려 두면 안 된다 — 첫 로드의 400ms 재적용(아래 맨 끝)이 그 사이에 다시 칠해 버린다.)
   고리 크기는 옛 고리에서 그대로 옮긴다 — fit() 이 svg 에 직접 박는 값이라 새로 지으면 빠져서 고리가 사라진다.
   fit() 을 다시 부르지 않는 것은 그게 배치를 읽어 켜는 프레임을 무겁게 하기 때문이다(판 크기는 그새 안 바뀐다). */
window.bneckRing=function(){
  var M=cur&&cur.km; if(!M) return;
  var old=$("svg",P.rw), S=old&&old.style.width;
  P.rw.innerHTML=ring(M);
  var sv=$("svg",P.rw); if(S) sv.style.width=sv.style.height=S;
  play(sv,M,!RM);
};

body.addEventListener("click", function(e){
  var t=e.target.closest&&e.target.closest("button[data-d], .bx-nums button, .bx-strip i");
  if(!t) return;
  if(t.hasAttribute("data-d")) go(+t.getAttribute("data-d"));
  else show(EXPS[+t.getAttribute("data-i")]);
}, false);
/* 키보드 ← → 로도 넘긴다 — 판이 화면에 보일 때만(다른 탭·입력칸의 화살표를 가로채지 않게) */
document.addEventListener("keydown", function(e){
  if(e.key!=="ArrowLeft" && e.key!=="ArrowRight") return;
  if(e.altKey||e.ctrlKey||e.metaKey||e.shiftKey) return;
  if(e.target.closest && e.target.closest("input,textarea,select,[contenteditable]")) return;
  if(!card||card.hidden||!card.offsetParent) return;
  var r=card.getBoundingClientRect(); if(r.bottom<0||r.top>innerHeight) return;
  go(e.key==="ArrowLeft"?-1:1);
}, false);

/* 처음 서는 카드는 ② Send Coalescing(2026-10-31) — 번호 순(=실험 순)의 맨 앞 ① 은 기각이라
   탭을 열자마자 빨간 +7% 가 먼저 섰다. 순서는 그대로 두고 처음 고른 자리만 옮긴다(없으면 맨 앞). */
var FIRST=EXPS.filter(function(e){ return e.no===2; })[0]||EXPS[0];
show(FIRST);
setTimeout(function(){ show(cur||FIRST); paintPins(); }, 400);   /* 진입 애니가 판을 연 뒤 한 번 더 */
})();
