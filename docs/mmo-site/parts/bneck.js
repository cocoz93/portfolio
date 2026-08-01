/* ═══════════ 병목 탭 — 계기판 + 카드 상세 ═══════════
   한 화면에서 끝난다: 계기판(위) · 지도(왼쪽) · 카드(오른쪽).
   지도와 카드는 위 코드가 이미 갖고 있다. 여기서 더하는 것은 둘뿐이다 —
     ① 계기판: 고른 실험의 before → after
     ② 카드 안 상세: 결과 · 한 일 · 부연
   위 코드의 IIFE 안으로 들어가지 않는다. 연결은 DOM 델리게이션 하나뿐이고,
   실험 배열(window.__EXPS)은 위 코드가 그대로 내준 것이다. 핀과 레일 버튼은 전역이 아니라
   위 코드가 만들어 둔 마크업(#bnpins .pin[data-loc], #bnc-nav button[data-loc])으로 잡는다. */
(function(){
"use strict";
var RM = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* 네 칸은 실험마다 공통으로 잰 것만 둔다. 나머지(그 실험에서만 의미 있는 지표)는 아래 상세 표로 간다.
   dir −1 작을수록 좋음 · 0 좋고 나쁨을 여기서 정하지 않음.

   동접·송신 메시지·송신량을 0 으로 둔 이유: 이 셋은 실험마다 성격이 다르다. Send Coalescing 에서는
   양쪽을 같게 맞춘 통제값이고(변하면 실험이 틀린 것), 섹터 묶음에서는 송신 메시지가 −73% 인 게 성과다.
   같은 칸을 어떤 실험에선 초록으로, 어떤 실험에선 빨강으로 칠할 근거가 계기판에는 없다 —
   좋고 나쁨은 아래 상세의 Δ 가 지표별로 말한다. 여기서는 변화량만 부호 그대로 적는다. */
var MET = [
  {k:"ccu",  n:"동접",    u:"명",     dir:0},
  {k:"pps",  n:"송신 메시지", u:"건/s", dir:0},
  {k:"send", n:"송신량",  u:"MB/s",   dir:0},
  {k:"tick", n:"틱 p99",  u:"ms",     dir:-1}
];

var EXPS = (window.__EXPS||[]).slice().sort(function(a,b){ return a.s-b.s; });
if(!EXPS.length) return;

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
    /* 왼쪽에 비교값이 없는 이유가 셋이라 말이 다르다 — 실험은 했는데 그 지표만 안 잡은 것,
       실험 자체를 A/B 로 돌린 적이 없는 것, 그리고 애초에 A/B 가 아니라 한 부하에서 본 진단인 것. */
    T.fr.textContent=(bv==null
      ? (it.st==="na" ? "잰 적 없음" : it.st==="dg" ? "이 부하에서 관측"
       : (it.st==="now"||it.st==="sum") ? "지금 값" : it.st==="fix" ? "" : "이 시기 미수집")
      : fmtV(M.k,bv)+" →");
    T.c.textContent=pctTxt(p);
    /* 색은 방향이 정해진 지표(dir≠0)에만 붙는다 — 부호는 값 그대로, 좋고 나쁨은 dir 이 판단 */
    var good = (p==null||M.dir===0||Math.abs(p)<0.5) ? 0 : (p*M.dir>0 ? 1 : -1);
    T.c.className="bx-chip "+(good>0?"up":good<0?"dn":"fl");
    T.el.className="bx-tile "+(av==null?"none":good>0?"good":good<0?"bad":"");
  });
}

/* ═══ 카드 안 상세 ═══
   fillCard 는 #bnc-b 의 안쪽만 갈아 끼우므로, 형제로 끼워 두면 자리 이동에도 살아남는다.
   자리 설명(why)은 카드가 이미 위에 갖고 있으니 여기서는 되풀이하지 않는다.
   #bx-det 는 이제 HTML 에 미리 있다(계기판 뒤 순서를 지키려고) — 아래 만드는 가지는 안 탄다. */
function detEl(){
  var d=document.getElementById("bx-det");
  if(!d){
    var body=document.getElementById("bnc-b"); if(!body) return null;
    d=document.createElement("div"); d.className="bx-det"; d.id="bx-det";
    body.parentNode.insertBefore(d, body.nextSibling);
  }
  return d;
}
var LB={ok:"한 일", rj:"접은 이유", dg:"본 것", na:"한 일", now:"판정 기준", sum:"내역", fix:"쓰는 법"};
function paintDet(it){
  var d=detEl(); if(!d) return;
  function fld(l,v){ return v ? '<div class="fd"><span class="l">'+l+'</span><span class="v">'+v+'</span></div>' : ''; }
  d.className="bx-det "+it.st;
  var left=(it.cond?'<div class="cd">'+it.cond+'</div>':'')+fld(LB[it.st],it.m)+fld("부연",it.ex);
  /* 네 칸에 안 들어가는 지표 — 실험마다 다르므로 표로 붙인다(노션 A/B 표 그대로).
     끄고·켜고를 한 칸에 합친 것은 폭 때문이다: 카드가 지도 옆 310px 짜리 한 열이라
     네 열로 벌리면 지표 이름이 두 줄로 접힌다. */
  var right="";
  if(it.ab && it.ab.length){
    right='<table class="bx-ab"><colgroup><col class="a"><col class="b"><col class="c"></colgroup>'+
       '<thead><tr><th>지표</th><th>'+(it.abh||"끄고 → 켜고")+
       '</th><th>Δ</th></tr></thead><tbody>'+
       it.ab.map(function(r){ var g=r[4]||0;   /* 좋고 나쁨은 지표마다 다르다 — 행이 직접 갖는다 */
         /* 끄고 값이 비어 있으면 A/B 가 아니라 그냥 값 하나다 — 화살표를 붙이면 변화로 읽힌다 */
         var mid = r[1]==="" ? r[2] : r[1]+" → "+r[2];
         return '<tr><td>'+r[0]+'</td><td>'+mid+'</td>'+
                '<td class="'+(g>0?"g":g<0?"b":"")+'">'+r[3]+'</td></tr>'; }).join("")+
       '</tbody></table>';
  }
  /* 결론은 전폭, 그 아래를 둘로 나눈다 — 위아래로 쌓으면 표가 카드 밖으로 밀려 스크롤 뒤에 숨는다 */
  d.innerHTML='<div class="rv">'+(it.r||"")+'</div>'+
              '<div class="cols"><div>'+left+'</div><div>'+right+'</div></div>';
}

function show(it){
  if(!it) return;
  paintDash(it); paintDet(it);
  var body=document.getElementById("bnc-b");
  if(body) [].forEach.call(body.querySelectorAll("[data-s]"), function(b){
    b.classList.toggle("selx", +b.getAttribute("data-s")===it.s); });
}
function byS(s){ return EXPS.filter(function(e){ return e.s===s; })[0]; }
function firstOf(loc){ return EXPS.filter(function(e){ return e.loc===loc; })[0]; }

/* 접힌 배치(창 1600 이하)에서는 카드가 지도 아래로 내려가 첫 화면 밖에 있다.
   그 상태로 핀이나 레일을 누르면 화면에서 아무 일도 안 일어난 것처럼 보인다 — 카드를 끌어올린다.
   세 칸 배치에서는 카드가 이미 옆에 보이므로 아무것도 하지 않는다(판정은 화면 밖인지 하나로 한다,
   창 폭을 다시 재서 분기점을 JS 에도 적어 두면 CSS 와 두 곳에서 갈린다). */
function bnScrollIntoView(){
  var card=document.getElementById("bncard"); if(!card||card.hidden) return;
  var r=card.getBoundingClientRect();
  if(r.top < innerHeight-100) return;          /* 이미 보인다 */
  /* scrollIntoView(block:"start") 는 카드 윗줄을 화면 맨 위에 붙여 레일까지 위로 밀어낸다.
     90px 만 남겨 두면 레일 아랫줄이 걸쳐 보여서, 다른 자리로 옮길 길이 화면에 남는다. */
  scrollTo({top:scrollY+r.top-90, behavior:RM?"auto":"smooth"});
}

/* 한 화면이므로 지도·카드·계기판이 같은 선택을 본다 */
document.addEventListener("click", function(e){
  if(!e.target.closest) return;
  var ex=e.target.closest("#bnc-b [data-s]");
  if(ex){ show(byS(+ex.getAttribute("data-s"))); return; }
  var loc=e.target.closest("#bnc-nav button[data-loc], #bnpins .pin");
  if(loc){ var L=loc.getAttribute("data-loc");
    setTimeout(function(){ show(firstOf(L)); bnScrollIntoView(); }, 0); }   /* 카드가 다시 그려진 뒤에 */
}, false);

show(EXPS[0]);
setTimeout(function(){ show(EXPS[0]); }, 400);   /* 진입 애니가 카드를 연 뒤 한 번 더 */
})();
