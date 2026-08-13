/* ═══════════ 병목 탭 — 실험 카드 열두 장 + 계기판 ═══════════
   한 화면에서 끝난다: 지도(왼쪽) · 카드 열두 장과 계기판(오른쪽).
   지도는 위 코드가 이미 갖고 있다. 여기서 더하는 것은 둘뿐이다 —
     ① 카드 열두 장: 번호 · 판정 · 이름 · 동접 고리 (노션 실측 보고서와 1:1)
     ② 계기판: 고른 카드의 before → after
   위 코드의 IIFE 안으로 들어가지 않는다. 연결은 실험 배열(window.__EXPS)과
   위 코드가 만들어 둔 핀 마크업(#bnpins .pin[data-loc]) 둘뿐이다 — 한 방향이라 훅이 없다.
   (한때 핀 클릭을 이쪽으로 넘기는 window.__bnPickLoc 이 있었는데, 핀에서 클릭을 걷어내며 같이 지웠다.) */
(function(){
"use strict";
var RM = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* 여섯 칸은 실험마다 공통으로 잰 것만 둔다.
   dir −1 작을수록 좋음 · 0 좋고 나쁨을 여기서 정하지 않음.

   동접·송신 메시지·송신량을 0 으로 둔 이유: 이 셋은 실험마다 성격이 다르다. Send Coalescing 에서는
   양쪽을 같게 맞춘 통제값이고(변하면 실험이 틀린 것), 섹터 묶음에서는 송신 메시지가 −73% 인 게 성과다.
   같은 칸을 어떤 실험에선 초록으로, 어떤 실험에선 빨강으로 칠할 근거가 계기판에는 없다 —
   좋고 나쁨은 카드의 성과 한 줄이 말한다. 여기서는 변화량만 부호 그대로 적는다. */
/* ld:1 인 둘은 값이 bm/am 이 아니라 e.ld 에서 온다(scene.js 의 LOAD 표 = 노션 '측정부하' 토글).
   노션이 부하를 다섯 칸으로 적는데 그중 송신 메시지·송신량은 여기 이미 있었으므로,
   빠져 있던 평균 패킷·소켓 호출을 데려와 여섯 칸이 되었다. 남은 하나(팬아웃)는 통제 지표라
   끄고/켜고가 없다 — 이 판에 칸으로 세우지 않고 위 라벨 줄에 적는다. */
/* 배열 순서가 곧 판의 자리다 — 세 칸씩 두 줄(bneck.css 의 .bx-dash).
   아랫줄 셋은 곱으로 묶인다: **송신 메시지 × 평균 패킷 = 송신량**
   (⑪ 10,890,000 건/s × 92.4B = 1,006MB/s. 열두 장 전부 이 식이 맞는다).
   한때 윗줄이 동접·송신 메시지·송신량이고 평균 패킷이 아랫줄 첫 칸이었는데, 곱하는 셋이
   줄에 걸쳐 갈려서 곱이라는 것이 안 보였다. 셋을 한 줄에 모으고 윗줄에는 성격이 다른
   셋을 둔다 — 부하가 어디였나(동접) · 몇 번 불렀나(소켓 호출) · 그래서 걸렸나(틱 p99).
   덤으로 판정 지표인 틱 p99 가 여섯 칸의 맨 끝이 아니라 윗줄 오른쪽 끝으로 온다. */
var MET = [
  {k:"ccu",  n:"동접",    u:"명",     dir:0},
  {k:"sock", n:"소켓 호출", u:"회/s",  dir:-1, ld:1},
  {k:"tick", n:"틱 p99",  u:"ms",     dir:-1},
  {k:"pps",  n:"송신 메시지", u:"건/s", dir:0},
  {k:"pkt",  n:"평균 패킷", u:"B",     dir:0,  ld:1},
  {k:"send", n:"송신량",  u:"MB/s",   dir:0}
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
  if(typeof v==="string") return v;      /* ⑩ 소켓 호출처럼 범위로 적힌 값은 그대로 */
  if(k==="pps"){
    var man = (big==null) ? v>=1e6 : big;
    return man ? fmt(Math.round(v/1e4),0)+"만" : fmt(v/1e3,d==null?decOf(v/1e3):d)+"k";
  }
  /* 소켓 호출은 2.4만~12.3만 사이에 다 들어간다. pps 처럼 1e6 에서 단위를 갈면 열둘이 전부 k 인데
     노션은 페이지마다 k 와 만 을 섞어 썼다 — 여기서는 k 하나로 통일한다(같은 칸을 세로로 훑는 곳이라
     단위가 바뀌면 크기 비교가 끊긴다).
     소수는 **한 자리로 못 박는다**. 원값이 24,386 처럼 정확값이면 그대로 세었다가 24.386k 가 되고,
     10만을 넘으면 자리가 0 이 되어 같은 칸에서 98.2k → 100k 로 짝이 갈린다. 여기서 읽을 것은
     '몇 만 번대인가' 뿐이라 한 자리면 충분하고, 그래야 열두 장을 세로로 훑을 때 자가 안 바뀐다. */
  if(k==="sock") return fmt(v/1e3, 1)+"k";
  return fmt(v,d==null?decOf(v):d);
}
/* 부호는 값이 실제로 움직인 방향 그대로다 — 틱 p99 65.3 → 9.2ms 는 −86%.
   한때 여기서 '좋아진 정도' 로 부호를 뒤집어 +86% 로 적었는데, 노션 표기(−86%)와 부호가 반대로
   갈려 같은 실험이 두 곳에서 다르게 읽혔다. 좋고 나쁨은 부호가 아니라 색이 맡는다. */
function pct(b,a){
  if(b==null||a==null||!b) return null;
  if(typeof b==="string"||typeof a==="string") return null;   /* 범위 값은 뺄 수가 없다 */
  return (a-b)/b*100;
}
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
function roll(T,k,to,dur,dFix){
  var el=T.n, from=T.v;
  T.seq=(T.seq||0)+1;
  var my=T.seq;
  if(to==null){ el.textContent="—"; T.v=null; return; }
  /* 범위로 적힌 값(⑩ 소켓 호출)은 굴릴 수가 없다 — 그대로 앉히고 다음 롤의 출발점도 없앤다 */
  if(typeof to==="string"){ el.textContent=to; T.v=null; return; }
  if(typeof from==="string") from=null;
  var big=(k==="pps") ? to>=1e6 : null;      /* 구르는 내내 도착값의 단위를 쓴다 */
  /* dFix = 이 칸의 끄고·켜고가 함께 쓰기로 한 소수 자리(paintDash 가 정한다). 도착값만 보고 세면
     짝이 갈린다 — 98.3k → 98k, 92.2 → 94 처럼 같은 칸 안에서 정밀도가 달라 보인다. */
  var d=(dFix!=null) ? dFix
        : decOf(k==="pps"  ? (to>=1e6?Math.round(to/1e4):to/1e3)
              : k==="sock" ? to/1e3          /* 화면에 찍히는 것은 k 로 나눈 값이다 */
              : to);
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
  return {el:t,n:$(".n",t),un:$(".u",t),g:$(".g",t),w:$(".w",t),a:$(".a",t),
          fr:$(".fr",t),c:$(".bx-chip",t),M:M,v:0};
});
/* ═══ 막대의 눈금 = 지금 ═══
   한때 '그 실험 안에서의 대비' 였다(둘 중 큰 쪽이 100%). 그러면 둘 중 하나는 무조건 꽉 차고,
   안 변한 칸은 양쪽이 다 꽉 찬다 — 동접 200 짜리 실험도 막대가 가득해서 '최대' 로 보였다.
   막대가 길이를 말하는데 그 길이가 아무 뜻도 없던 것이다.

   이제 눈금은 하나다: **현황판(지금 참인 값)이 100%**. 열두 실험이 같은 자 위에 서므로
   막대 길이가 곧 '이 실험이 어느 부하 지점이었나' 가 된다 — ① 은 거의 비어 있고 ⑪ 은 꽉 찬다.
   그 자체가 이 탭의 이야기다(동접 200 에서 5,200 까지 부하를 올려온 순서).

   두 가지만 예외다.
   ① 틱 p99 는 현황판이 아니라 **예산 40ms** 가 100% 다. 다른 지표는 부하가 오르면 같이 오르지만
      틱은 넘으면 안 되는 선이 따로 있다(노션도 '39.7/40 · 여유 1%' 로 적는다). 그래야 76ms 가
      '예산의 190%' 로 읽힌다 — 현황판을 기준 삼으면 그냥 '현황판보다 크다' 가 되어 뜻이 약하다.
   ② 눈금을 넘는 값은 100% 에서 자르되 칸에 over 를 붙여 끝을 막는다. 안 그러면 '딱 맞게 찼다' 와
      '넘쳐서 잘렸다' 가 같은 그림이 된다.
   값이 있는데 눈금 대비 1% 도 안 되는 칸(① 송신량 = 1.62/947)은 최소 폭을 남긴다. 0 으로 두면
   값이 없는 칸(⑤ 소켓 호출)과 그림이 같아진다. */
var NOWE=(window.__EXPS||[]).filter(function(e){ return e.s===0;   })[0];   /* 현황판 */
var SUME=(window.__EXPS||[]).filter(function(e){ return e.s===0.2; })[0];   /* 결론 — 부하 두 칸의 지금 값 */
var SCALE={
  ccu : NOWE&&NOWE.am ? NOWE.am.ccu  : null,
  pps : NOWE&&NOWE.am ? NOWE.am.pps  : null,
  send: NOWE&&NOWE.am ? NOWE.am.send : null,
  pkt : SUME&&SUME.ld ? SUME.ld.pkt  : null,
  sock: SUME&&SUME.ld ? SUME.ld.sock : null,
  tick: 40                       /* 게임 루프 예산 — 이 한 값만 상수다 */
};
function paintDash(it){
  tiles.forEach(function(T){
    var M=T.M, bv, av;
    if(M.ld){
      /* 부하 표는 '끄고' 값 하나에 '켜고' 를 옵션으로 붙인 꼴이다(노션의 회색 괄호 표기).
         ※ 켜고가 없을 때 같은 값을 양쪽에 넣어 '±0%' 로 그리면 안 된다. 노션의 괄호는 그 실험이
           **새 정보를 줄 때만** 붙는 표기라(안 붙었다고 값이 안 변했다는 보장이 아니다),
           ±0% 는 원문에 없는 주장이 된다. 그래서 켜고가 없으면 왼쪽을 비우고 값 하나만 세운다 —
           화살표도 퍼센트도 없이 '이 실험을 돌린 부하는 이 값이었다' 까지만 말한다. */
      var L=it.ld, has2 = !!(L && L[M.k+"2"]!=null);
      av = L ? (has2 ? L[M.k+"2"] : L[M.k]) : null;
      bv = (has2 && it.bm!=null) ? L[M.k] : null;
    }else{
      bv = it.bm?it.bm[M.k]:null;
      av = it.am?it.am[M.k]:null;
    }
    var p=pct(bv,av);
    /* 범위 문자열은 크기가 없으니 막대를 비운다 — 0 폭 막대가 '0 이다' 로 읽히지 않게
       아래에서 칸 자체를 none 으로 죽이지는 않는다(값은 분명히 있다).
       ※ 이 선언은 반드시 아래 dFix 보다 위에 있어야 한다. 한때 아래에 있었는데 호이스팅으로
         undefined 인 채 읽혀 dFix 가 늘 null 이었고, 그 바람에 소수가 통째로 날아갔다(82.6k → 83k). */
    var num = typeof bv!=="string" && typeof av!=="string";
    /* 눈금은 위 SCALE(현황판·예산). 못 구한 지표만 예전처럼 그 실험 안에서 잰다. */
    var top=(num && SCALE[M.k]) ? SCALE[M.k] : (num ? (Math.max(bv||0,av||0)||1) : 1);
    function barW(v){
      if(!num || v==null) return 0;
      var r=v/top*100;
      return r>100 ? 100 : (r<1.2 ? 1.2 : r);     /* 넘치면 자르고, 너무 작으면 흔적을 남긴다 */
    }
    var over = !!(num && av!=null && av/top>1.001);   /* 아래 className 재설정 뒤에 붙인다 */
    /* 부하에서 온 두 칸만 자리를 맞춘다. 나머지 넷은 원래 데이터가 짝끼리 같은 자리로 적혀 있어
       손댈 것이 없고, 송신 메시지는 만/k 경계 때문에 도착값 기준이라는 제 규칙이 따로 있다. */
    var dFix=null;
    if(M.k==="pkt" && num){          /* 소켓 호출은 fmtV 가 한 자리로 못 박으므로 여기서 잴 것이 없다 */
      var dOf=function(x){ return x==null ? 0 : decOf(x); };
      dFix=Math.max(dOf(bv), dOf(av));
    }
    roll(T,M.k,av,460,dFix);
    T.w.style.width=barW(bv)+"%";
    T.a.style.width=barW(av)+"%";
    /* 두 막대는 같은 홈에서 왼쪽 끝을 공유하고 켜고(.a)가 뒤 DOM 이라 위에 그려진다. 값이 줄어든
       실험은 끄고(.w)의 꼬리가 뒤로 남아 두 겹이 보이지만, **늘어난 실험은 켜고가 끄고를 통째로
       덮어** 한 겹으로 보인다 — ⑩ 소켓 호출 99,000 → 122,000(+23%)이 그랬다. 그때만 끄고를
       위로 올려 '끄고는 여기까지였다' 를 남긴다(줄어드는 쪽은 지금 그림이 이미 맞으므로 안 건드린다).
       ※ 1.5%p 문턱을 두는 이유: 조금이라도 크면 올리게 했더니 ⑩ 의 틱 p99(39.6 → 39.7 · +0.3%)
         까지 회색이 덮어 **막대가 통째로 회색으로 죽었다**. 그 정도 차이는 어차피 막대에 안
         나타나므로(칸 폭 ≈ 276px 에서 0.25%p = 0.7px) % 배지에 맡기고 색을 지키는 편이 낫다. */
    var wpc=barW(bv), apc=barW(av);
    T.g.classList.toggle("up", !!(num && bv!=null && av!=null && apc-wpc>1.5));
    /* 안 잰 지표는 단위까지 지운다 — 값이 '—' 인데 'MB/s' 만 남으면 0 을 잰 것처럼 보인다 */
    T.un.textContent=(av==null?"":M.u);
    /* 왼쪽에 비교값이 없는 이유가 둘이라 말이 다르다 — 실험은 했는데 그 지표만 안 잡은 것,
       그리고 애초에 A/B 가 아니라 한 부하에서 본 진단(또는 종합)인 것. */
    T.fr.textContent=(!num ? ""            /* 범위 값 — 왼쪽에 또 같은 문자열을 적지 않는다 */
      /* 부하 칸이 통째로 빈 것은 '이 실험과 무관한 지표' 라는 뜻이 아니다 — 둘 다 그때 분명히
         존재하던 값인데 남아 있지 않은 것이다.
           ⑤ 소켓 호출  — 붕괴 평형 구간이라 그 런만 원본 지표가 저장되지 않았다(다른 세 값은
                          동접 1,000 실측에서 환산했는데 이것은 환산도 못 했다)
           ⑦ 평균 패킷  — 그 페이지가 부하 줄에 트래픽 대신 스레드별 CPU 를 적었다
         그래서 '없음' 이 아니라 '기록 없음' 이다. 한때 '그 보고서에 없음' 이었는데 그러면
         '이 지표는 이 실험에 안 맞는다' 와 '보고서가 잘못했다' 사이에서 뜻이 안 잡혔다.
         이유가 서로 다른 것은 카드의 ↗ 노션 원문이 맡는다(이 줄은 .6rem 이라 길면 옆 칸과 어긋난다). */
      : (M.ld && av==null) ? "기록 없음"
      : bv!=null ? fmtV(M.k,bv,dFix)+" →"
      : it.st==="dg" ? "이 부하에서 관측"
      : it.st==="sum" ? "지금 값"
      : M.ld ? "이 실험의 부하"          /* 켜고가 없는 부하 값 — 견줄 짝이 없다 */
      : "이 시기 미수집");
    T.c.textContent=pctTxt(p);
    /* 색은 방향이 정해진 지표(dir≠0)에만 붙는다 — 부호는 값 그대로, 좋고 나쁨은 dir 이 판단 */
    var good = (p==null||M.dir===0||Math.abs(p)<0.5) ? 0 : (p*M.dir>0 ? 1 : -1);
    T.c.className="bx-chip "+(good>0?"up":good<0?"dn":"fl");
    /* className 을 통째로 갈아 끼우므로 over 는 반드시 이 뒤에 붙인다 — 앞에 붙이면 여기서 지워진다 */
    T.el.className="bx-tile "+(av==null?"none":good>0?"good":good<0?"bad":"");
    if(over) T.el.classList.add("over");
  });
}

/* ═══ 카드 열두 장 ═══
   한 장에 셋만 적는다: 번호 · 판정 · 이름. 그리고 오른쪽 끝에 동접을 말하는 고리 하나.
   결과 수치는 카드에 없다 — 한때 '송신 호출 −94%' 같은 성과 한 줄을 넣었는데, 열두 장이
   저마다 다른 지표를 외치면 훑을 때 이름이 뒤로 밀리고 서로 견줄 수도 없었다(실험마다 잰 지표가 다르다).
   무엇이 얼마나 바뀌었나는 아래 계기판이 고른 한 장에 대해서만 말하고, 나머지는 노션 원문이 맡는다.
   색도 고른 카드에만 켠다 — 열둘이 저마다 판정색을 띠면 어느 것이 열려 있는지가 색으로 안 짚인다.

   ↗ 도 카드에서 걷어냈다 — 열두 장이 같은 기호를 하나씩 달고 있었는데 열리는 것은 고른 하나뿐이라,
   판 아래 한 짝(#bn-more)으로 모으고 주소만 갈아 끼운다(아래 show).
   고리의 눈금은 계기판 막대와 같은 SCALE.ccu(현황판) 다 — 같은 지표에 자를 두 벌 두지 않는다.
   숫자를 지운 자리라 값은 aria-label 로 남긴다(화면에는 라벨 줄의 '200 → 5,200' 이 눈금을 말한다). */
function ringPct(ccu){
  var top = SCALE.ccu || 5000;
  return Math.min(100, Math.round(ccu / top * 100));
}
function build(){
  var body=document.getElementById("bnc-b"); if(!body) return;
  body.innerHTML=EXPS.map(function(e){
    var ccu=(e.am&&e.am.ccu) ? e.am.ccu : null;
    return '<div class="rc k-'+e.st+'" data-s="'+e.s+'" data-loc="'+e.loc+'"'+
      ' tabindex="0" role="button" aria-pressed="false">'+
      '<span class="r1"><span class="no">'+e.no+'</span>'+
      '<span class="st">'+(ST[e.st]||"")+'</span></span>'+
      '<span class="nm">'+e.n+'</span>'+
      (ccu!=null ? '<span class="cq" style="--p:'+ringPct(ccu)+'" role="img"'+
                   ' aria-label="동접 '+ccu.toLocaleString("ko-KR")+'명"></span>' : '')+
      '</div>';
  }).join("");
}
build();

/* ═══ 지도 핀 ═══
   번호는 자리가 아니라 실험이 갖는다 — 고른 카드의 번호가 그 자리 핀에만 들어간다.
   핀은 읽는 표시일 뿐 누르는 것이 아니다(2026-08-04에 클릭을 걷어냈다 — 고르는 곳은 카드 한 군데다).
   그래서 '실측 카드가 없는 자리' 를 따로 표시할 일도 없어졌다: 고른 자리만 밝고 나머지는 흐리다. */
var curLoc=null, curNo="";
/* 튕기는 조건은 '자리가 바뀔 때' 가 아니라 '고른 실험이 바뀔 때' 다 — 한 자리에 실험이 여럿이라
   (송신 경로에 넷) 자리로만 보면 그 넷 사이를 오갈 때 지도가 아무 반응도 안 한다.
   배지 번호는 바뀌는데 정작 그 번호가 어디 떴는지를 눈이 못 따라가는 것이 원래 증상이었다. */
var lastPop=null;
function paintPins(){
  var pins=document.querySelectorAll("#bnpins .pin"), lit=null;
  [].forEach.call(pins,function(g){
    var on = g.getAttribute("data-loc")===curLoc;
    g.classList.toggle("lit",on);
    g.classList.toggle("dim",!on);
    if(on) lit=g;
    var t=g.querySelector(".pin-no"); if(t) t.textContent=on?curNo:"";
  });
  var key=curLoc+"/"+curNo;
  if(lit && key!==lastPop){
    lastPop=key;
    /* 클래스는 한 핀에만 남긴다 — 안 지우면 지나온 자리마다 쌓여, 다음에 그 자리를 고를 때
       'remove 후 add' 가 같은 프레임에 묻혀 애니가 재시작되지 않는다. */
    var prev=document.querySelector("#bnpins .pin.pop"); if(prev) prev.classList.remove("pop");
    lit.getBoundingClientRect();   /* 강제 리플로우 — 없으면 같은 핀을 다시 고를 때 애니가 안 돈다 */
    lit.classList.add("pop");
  }
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

/* 팬아웃 = 한 번 보낼 때 대상이 몇 명인가. 열두 실험이 전부 OFF/ON 을 같게 맞추고 재는 통제
   지표라 '끄고 → 켜고' 가 없다 — 계기판에 칸으로 세우면 홀로 화살표가 없어 빈 칸으로 보인다.
   그래서 라벨 줄 오른쪽에 조건으로 적는다(동접이 그렇듯 이것도 '어떤 부하였나' 에 속한다). */
/* hint = 이 카드의 여섯 칸을 곧이곧대로 읽으면 안 되는 사정. 넷뿐이라 상수로 두지 않고
   그 카드에만 붙였다(scene.js EXPS). 화면에 자리를 새로 내지 않고 팬아웃 뒤에 이어 붙인다 —
   둘 다 '이 값들이 어떤 조건에서 나온 것인가' 라 한 줄에 같이 서는 것이 맞다.
     ⑤ 부하가 실측이 아니라 환산 · ⑦·⑪ 여섯 칸이 스윕의 어느 지점인지
     ⑧ 틱만 P1 구간이고 나머지는 P1+P2 누적이라는 것 */
function paintFan(it){
  var el=document.getElementById("bx-fan"); if(!el) return;
  var f=it.ld&&it.ld.fan, s=[];
  if(f) s.push("팬아웃 "+f.toLocaleString("ko-KR")+" 대상/회");
  if(it.hint) s.push(it.hint);
  el.textContent = s.join("  ·  ");
}

/* 판 아래 나가는 문 — 카드마다 있던 ↗ 를 한 짝으로 모은 것이라 고를 때마다 주소가 바뀐다.
   실험 이름을 문구에 넣지 않는 이유는 폭이다. 이름이 긴 카드(⑤ ⑨)에서 줄이 접히면
   계기판과의 간격이 그 카드에서만 벌어진다 — 무엇의 보고서인지는 바로 위 계기판 라벨이 말한다. */
function paintMore(it){
  var a=document.getElementById("bn-more"); if(!a) return;
  if(it.nt){ a.href=it.nt; a.hidden=false;
             a.setAttribute("aria-label", it.n+" 실측 보고서 — 노션에서 열기"); }
  else { a.removeAttribute("href"); a.hidden=true; }
}

/* ═══ 고르기 ═══ */
function show(it){
  if(!it) return;
  paintDash(it);
  paintFan(it);
  paintMore(it);
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

/* 카드 안에는 이제 링크가 없다 — 노션으로 나가는 문은 판 아래 한 짝뿐이라, 새 탭을 여는
   클릭과 카드를 고르는 클릭이 겹칠 일이 없어졌다(그것을 갈라 내던 예외 처리도 같이 지웠다). */
document.addEventListener("click", function(e){
  if(!e.target.closest) return;
  var c=e.target.closest("#bnc-b .rc");
  if(c){ show(byS(c.getAttribute("data-s"))); }
}, false);
document.addEventListener("keydown", function(e){
  if(e.key!=="Enter" && e.key!==" ") return;
  if(!e.target.closest) return;
  var c=e.target.closest("#bnc-b .rc");
  if(c){ e.preventDefault(); show(byS(c.getAttribute("data-s"))); }
}, false);

show(EXPS[0]);
setTimeout(function(){ show(EXPS[0]); paintPins(); }, 400);   /* 진입 애니가 카드를 연 뒤 한 번 더 */
})();
