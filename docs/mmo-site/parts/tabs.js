(function(){
  /* 탭은 2단이다: 상위(mmo·mo·shooter·misc) 아래 mmo 만 하위(intro·build·bneck)를 갖는다.
     (mo·shooter 의 하위 줄은 각자 판 안에 있고 mo.js · intro.js 가 연다 — 여기선 안 건드린다.)
     1-2(bneck)는 판 셋이 같이 열린다 — 병목 지도(p-bneck) · 핵심 최적화(p-optimization) · 결과(p-crender).
     (넓은 화면은 2026-11-20 부터 그중 하나만 보인다 — 아래 showBn)
     (옛 하위 optimization(1-3 핵심 최적화)은 2026-10-27 에 1-2 아래로 내렸다.)
     한때 상위 탭 'dummy'(클라이언트)와 그 아래 2-1~2-3 하위 줄이 따로 있었다. 지금은 2-1 실행 화면
     녹화(p-crender)만 남아 1-2 맨 아래 결과 판이 됐다(10-23~27 에는 1-1 구조도 아래에 붙어 있었다).
     패널은 전부 그대로 형제로 두고 보이기만 두 값의 조합으로 정한다 —
     패널을 그룹 div 로 감싸면 p-build.hidden 이 false 인 채 부모만 숨어서
     칩 애니(pBuild.hidden 검사)가 안 보이는 화면에서 계속 돈다. */
  const tabs=[].slice.call(document.querySelectorAll(".tab"));
  /* 반드시 [data-sub] 로 좁힌다 — 클라 하위 줄도 같은 .subtab 클래스라, 안 좁히면 2-1~2-3 을
     누를 때 아래 subs 클릭 핸들러까지 함께 돌아 sub = getAttribute("data-sub") = null 이 된다.
     그 순간 화면은 클라 탭이라 멀쩡해 보이지만, MMO 탭으로 돌아오면 1-1·1-2 어느 쪽도 아니어서
     두 패널이 다 숨은 빈 화면이 뜬다. */
  const subs=[].slice.call(document.querySelectorAll(".subtab[data-sub]"));
  const subbar=document.getElementById("subtabs");
  /* 구역 필터는 이 줄의 오른쪽 끝에 살지만 1-1 화면 전용이다 —
     1-2 나 다른 상위 탭에서는 눌러도 아무 일이 없는 버튼이 되므로 숨긴다.
     줄 높이는 .subtabs 의 min-height 가 잡아 두어 숨겨도 화면이 튀지 않는다. */
  const zonebar=document.getElementById("zonebar");
  let top="mmo", sub="intro";   /* 첫 화면 = 소개(11-17 · 그 전엔 전체 구조였다) */
  /* 하위 줄 글자를 활성 상위 탭에 물린다 — 왼쪽 끝(--tabx)이 그 탭과 같아야 소속이 보인다.
     줄 자체는 화면 폭을 다 쓴다(바닥선이 끝까지 가야 하므로) — 움직이는 건 안쪽 여백뿐이다.
     offsetLeft 는 offsetParent 에 따라 기준이 흔들려서 탭줄과의 상대 좌표로 잰다.
     창이 좁아 탭줄이 두 줄로 접히면(활성 탭이 마지막 줄이 아니면) 그 좌표를 따라가는 게 뜻을
     잃으므로 body.subdetach 로 들여쓰기를 포기한다. */
  const tabrow=document.querySelector(".tabrow"), tabsNav=document.querySelector(".tabs");
  const wrapEl=document.querySelector(".wrap");
  function alignSub(){
    const at=document.querySelector(".tab.act");
    if(!at||!tabrow||!tabsNav||!wrapEl) return;
    const ar=at.getBoundingClientRect();
    wrapEl.style.setProperty("--tabx", Math.round(ar.left-tabrow.getBoundingClientRect().left)+"px");
    document.body.classList.toggle("subdetach",
      Math.abs(ar.bottom-tabsNav.getBoundingClientRect().bottom) > 2);
  }
  addEventListener("resize", alignSub);
  /* 폰트가 늦게 얹히면 탭 폭이 바뀌어 좌표가 어긋난다 — 딥링크(#dummy 등)로 둘째·셋째 탭이
     처음부터 활성인 경우에 실제로 틀어진다. 글꼴이 준비된 뒤 한 번 더 잰다. */
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(alignSub);
  /* 탭을 옮기면 주소창 끝도 같이 바뀐다 — 새로고침·즐겨찾기·링크 넘기기가 보던 화면으로 돌아온다.
     아래 딥링크(읽기)의 짝이다. 읽기만 있고 쓰기가 없어서, 주소는 늘 첫 화면 하나뿐이었다.
     첫 화면(소개)만 표시가 없다 — 기본값을 주소에 적으면 같은 화면에 주소가 둘 생긴다
     (포폴 홈에서 들어온 사람은 표시 없음, 탭 눌러 되돌아온 사람은 #intro).
     pushState 가 아니라 replaceState 인 까닭: 쌓으면 탭을 누른 횟수만큼 방문기록이 생겨
     들어온 페이지로 나가려면 뒤로가기를 그만큼 눌러야 한다.
     첫 paint() 에서는 부르지 않는다(booted) — 들고 들어온 주소를 그 자리에서 지우면
     노션 등에 걸어 둔 #bneck 딥링크가 통째로 무의미해진다. */
  let booted=false;
  function syncHash(){
    if(!booted) return;
    const h = (top==="mmo")   ? (sub==="intro" ? "" : sub)
            :                   top;
    history.replaceState(null, "", h ? "#"+h : location.pathname+location.search);
  }
  /* 1-2 판 셋을 한 화면씩(2026-11-20) — 넓은 화면(기둥이 있는 1280 이상)에서는 병목 지도 · 핵심 최적화 · 실서버 화면 중
     하나만 보인다. 사용자 요청 「스크롤 안 내려도 한 화면에」 — 11-18 에 셋을 한 쪽에 이어 붙였던 것(아래 왼쪽 기둥 주석)을 나눴다.
     고르는 것은 기둥의 1-2 차례다. 1-2 로 들어오면 늘 병목 지도부터(paint).
     세 판의 hidden 은 그대로 두고(1-2 면 셋 다 열림) .wrap 의 data-bn 하나로 CSS 가 나머지를 끈다(common.css 같은 날 주석) —
     hidden 을 만지면 예열(scene.js prewarm) · 녹화 재생(client-render.js) · 핵심 최적화 그림 장전(optimization.js)이
     「판이 열렸다」로 읽는 값이 같이 흔들린다. 좁은 화면은 그 CSS 가 안 걸려 예전처럼 이어 붙은 채 스크롤한다 —
     그래서 좁은 화면이면 false 를 돌려주고, 부른 쪽이 예전처럼 그 판까지 내려 준다.
     quiet = 딥링크로 처음 열 때 — 들고 온 주소를 그대로 두고 움직임도 걸지 않는다. */
  const SPLIT=matchMedia("(min-width:1280px)");
  function showBn(id, quiet){
    if(!SPLIT.matches) return false;
    const was=wrapEl.dataset.bn;
    wrapEl.dataset.bn=id;
    if(quiet) return true;
    if(scrollY>0) scrollTo(0,0);
    if(was===id) return true;
    /* 다른 탭 전환과 같은 0.24초 페이드(아래 탭 전환 페이드 IIFE) — 그쪽은 원래 단추를 누를 때만 걸려 여기서 직접 건다 */
    const el=document.getElementById(id);
    if(el && el.animate && !matchMedia("(prefers-reduced-motion: reduce)").matches)
      el.animate([{opacity:0},{opacity:1}],{duration:240, easing:"ease-out"});
    const h = id==="p-crender" ? "crender"
            : id==="p-optimization" ? (window.__optimizationHash ? window.__optimizationHash() : "optimization")
            : "bneck";
    if(booted) history.replaceState(null, "", "#"+h);
    return true;
  }
  window.__bnShow=showBn;
  function paint(){
    /* 숨기기 '전에' 설계 씬이 화면 어디에 얼마 크기로 있었는지 잰다 — 숨긴 뒤에는 0 이 나온다.
       병목 지도가 바로 이 자리에 겹쳐 시작해야 '그림이 그대로 있다가 변한다' 가 된다.
       이 값은 곧 '1-1 에서 1-2 로 건너왔다' 는 표시이기도 하다 — 없으면 scene.js 가 전환 애니를
       통째로 건너뛴다. 그래서 조건이 둘 더 붙는다:
         booted  — 첫 paint(#bneck 딥링크로 곧장 들어온 경우)를 뺀다. 전환 애니가 하는 말은
                   '방금 보던 그 구조가 이 지도로 변한다' 인데, 그 사람은 설계 화면을 본 적이 없다.
                   남는 것은 1.9초 기다림뿐이라 지도를 바로 띄운다.
         !pb.hidden — 직전 화면이 실제로 1-1 이었을 것(클라이언트·링크 탭에서 건너오면 false). */
    const pb=document.getElementById("p-build"), sc=document.getElementById("scene");
    const fromRect=(booted && !pb.hidden && top==="mmo" && sub==="bneck") ? sc.getBoundingClientRect() : null;
    tabs.forEach(function(t){ var on=(t.getAttribute("data-tab")===top);
      t.className = on ? "tab act" : "tab"; t.setAttribute("aria-selected", on?"true":"false"); });
    subs.forEach(function(t){ var on=(t.getAttribute("data-sub")===sub);
      t.className = on ? "subtab act" : "subtab"; t.setAttribute("aria-selected", on?"true":"false"); });
    subbar.hidden  = (top!=="mmo");
    if(zonebar) zonebar.hidden = !(top==="mmo" && sub==="build");
    /* 1-1 의 나가는 문은 2026-10-27 에 씬 왼쪽 아래(#p-build 안)로 내려가 판과 함께 숨는다 — 여기서 따로 끄지 않는다 */
    alignSub();   /* 활성 탭이 방금 바뀌었으니 하위 줄 들여쓰기도 그 탭에 맞춘다 */
    document.getElementById("p-build").hidden = !(top==="mmo" && sub==="build");
    document.getElementById("p-bneck").hidden = !(top==="mmo" && sub==="bneck");
    document.getElementById("p-optimization").hidden = !(top==="mmo" && sub==="bneck");   /* 1-2 아래 */
    document.getElementById("p-crender").hidden = !(top==="mmo" && sub==="bneck");   /* 1-2 맨 아래 */
    if(top==="mmo" && sub==="bneck") wrapEl.dataset.bn="p-bneck";   /* 넓은 화면은 셋 중 병목 지도부터(위 showBn) */
    document.getElementById("p-intro").hidden = !(top==="mmo" && sub==="intro");
    document.getElementById("p-mo").hidden    = (top!=="mo");
    document.getElementById("p-shooter").hidden = (top!=="shooter");
    document.getElementById("p-misc").hidden  = (top!=="misc");
    if(window.__optimizationVisibility)window.__optimizationVisibility(top==="mmo"&&sub==="bneck");
    /* 구조도 화면으로 올 때마다 구역 강조는 전체로 — 켜 둔 구역을 들고 다니지 않는다 */
    if(top==="mmo" && sub==="build" && window.resetZone) window.resetZone();
    /* 이 화면으로 (다시) 들어올 때는 첫 로드와 똑같이 '구조가 먼저 서고 데이터가 흐른다' 를 다시 보여준다.
       그냥 흐름만 되살리면, 돌아온 순간 칩이 이미 화면 한복판을 지나가고 있다 —
       무엇이 어디서 출발해 어디로 가는지가 이 그림의 요지인데 그 시작을 놓치게 된다.
       __scenePlay 가 흐름 정지 → 처음으로 되돌리기 → 등장 웨이브 → 웨이브가 끝난 뒤 흐름 시작까지 한다.
       첫 로드에서는 이 IIFE 가 웨이브 IIFE 보다 먼저라 __scenePlay 가 아직 없다 —
       그때는 웨이브 IIFE 가 스스로 한 번 재생하므로 흐름만 켜 두면 된다(이중 재생 없음). */
    if(top==="mmo" && sub==="build"){
      if(window.__scenePlay) window.__scenePlay();
      else if(window.__flowStart) window.__flowStart();
    }
    /* 병목 지도로 들어올 때마다 '설계 → 청사진' 전환 애니를 처음부터.
       설계 씬이 있던 자리를 넘겨줘야 그 자리에 그대로 겹친 채 시작한다(위에서 숨기기 전에 재 뒀다) */
    if(top==="mmo" && sub==="bneck" && window.playBneckIntro) window.playBneckIntro(fromRect);
    /* 두 실행 녹화는 숨은 동안 멈춰 있다(화면에 없는 그림을 디코딩할 이유가 없다).
       1-2 로 들어올 때 장전해 두면, 맨 아래 결과 판까지 내려와 화면에 걸리는 순간
       client-render.js 가 재생과 진입 애니를 건다. */
    if(top==="mmo" && sub==="bneck" && window.__crenderPlay) window.__crenderPlay();
    syncHash();
  }
  tabs.forEach(function(t){ t.addEventListener("click",function(){ top=t.getAttribute("data-tab"); paint(); }); });
  subs.forEach(function(t){ t.addEventListener("click",function(){ top="mmo"; sub=t.getAttribute("data-sub"); paint(); }); });
  /* 해시 딥링크 — #bneck 은 하위 탭이라 상위까지 같이 열어 준다 */
  const h0=(location.hash||"").replace("#","");
  let toOpt=false, toRender=false;
  if(h0==="intro"||h0==="build"||h0==="bneck"){ top="mmo"; sub=h0; }
  /* 옛 1-3 컨텐츠 주소(#content)는 소개 판으로 — 11-17 에 소개와 합쳐졌다 */
  else if(h0==="content"){ top="mmo"; sub="intro"; }
  /* 옛 1-3 주소(#optimization · #optimization-<그림>)는 1-2 를 열고 핵심 최적화 판까지 내려 준다 */
  else if(h0==="optimization"||h0.indexOf("optimization-")===0){ top="mmo"; sub="bneck"; toOpt=true; }
  else if(h0==="mo"||h0==="shooter"||h0==="misc"){ top=h0; }
  /* 옛 클라이언트 탭 주소(#dummy · #crender · #csafe · #cload · #cenv)는 노션 등에 걸려 있을 수 있어
     전부 1-2 로 열고 맨 아래 결과 판(실행 화면 녹화)까지 내려 준다. #csafe·#cload·#cenv 는 뺀 자리였다 */
  else if(h0==="dummy"||h0==="crender"||h0==="csafe"||h0==="cload"||h0==="cenv"){ top="mmo"; sub="bneck"; toRender=true; }
  paint();
  /* 넓은 화면은 그 판 하나를 바로 연다(showBn). 좁은 화면은 이어 붙은 쪽에서 그 판까지 내린다 —
     글꼴·그림이 다 얹힌 뒤에 내려야 자리가 안 어긋난다 */
  if(toRender && !showBn("p-crender", true)) addEventListener("load", function(){
    document.getElementById("p-crender").scrollIntoView({block:"start"}); });
  if(toOpt && !showBn("p-optimization", true)) addEventListener("load", function(){
    document.getElementById("p-optimization").scrollIntoView({block:"start"}); });
  booted=true;   /* 여기서부터는 사람이 탭을 누른 것이므로 주소를 따라가게 한다 */

})();

/* 맨 위로(2026-10-28) — 1-2 에서 하위 탭 줄이 화면 위에 붙어 있을 때만 켜고, 파란 호로 내려온 정도를 보인다.
   '붙어 있다' = 줄의 위끝이 화면 위끝(0)에 닿았고 페이지가 내려가 있다. 1-2 가 아니면 CSS 가 아예 안 그린다.
   탭을 바꾸면 스크롤 없이 페이지 길이가 바뀌므로 탭 클릭 뒤에도 한 번 다시 잰다. */
(function(){
  const btn=document.querySelector(".subtop"), bar=document.getElementById("subtabs");
  if(!btn||!bar) return;
  const arc=btn.querySelector(".subtop-arc"), C=106.8;   /* 둘레 = 2π×17 — mmo.src.html 의 dasharray 와 같은 값 */
  let queued=false;
  function update(){
    queued=false;
    const max=document.documentElement.scrollHeight-innerHeight;
    const p=max>0 ? Math.min(1, Math.max(0, scrollY/max)) : 0;
    btn.classList.toggle("on", scrollY>0 && bar.getBoundingClientRect().top<=0.5);
    if(arc) arc.setAttribute("stroke-dashoffset", (C*(1-p)).toFixed(1));
  }
  function req(){ if(!queued){ queued=true; requestAnimationFrame(update); } }
  addEventListener("scroll", req, {passive:true});
  addEventListener("resize", req);
  document.addEventListener("click", function(e){ if(e.target.closest(".tab,.subtab")) setTimeout(req, 0); });
  btn.addEventListener("click", function(){
    scrollTo({top:0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"});
  });
  update();
})();

/* 아래로(2026-10-28) — 맨 밑 결과 판(#p-crender)의 아래끝이 화면 안에 들어오기 전까지 켜 둔다.
   누르면 아직 위끝이 화면 위쪽에 안 닿은 다음 판으로 — 핵심 최적화 → 결과 판. 둘 다 지났으면 결과 판 끝으로.
   1-2 가 아니면 CSS 가 안 그리지만 잴 대상(#p-crender)이 숨어 있으면 높이가 0 이라 끄는 쪽으로 떨어진다. */
(function(){
  const btn=document.querySelector(".subdown");
  if(!btn) return;
  const last=document.getElementById("p-crender");
  const stops=["p-optimization","p-crender"].map(function(id){ return document.getElementById(id); }).filter(Boolean);
  let queued=false;
  function update(){
    queued=false;
    const r=last ? last.getBoundingClientRect() : null;
    btn.classList.toggle("on", !!r && r.height>0 && r.bottom>innerHeight+2);
    btn.classList.toggle("idle", scrollY<40);
  }
  function req(){ if(!queued){ queued=true; requestAnimationFrame(update); } }
  addEventListener("scroll", req, {passive:true});
  addEventListener("resize", req);
  addEventListener("load", req);
  document.addEventListener("click", function(e){ if(e.target.closest(".tab,.subtab")) setTimeout(req, 0); });
  btn.addEventListener("click", function(){
    const smooth=matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    /* 62 = 위에 붙는 하위 탭 줄 높이(common.css scroll-padding-top) — 그 밑에 선 판은 이미 '도착한' 판이다 */
    const next=stops.find(function(el){ return el.getBoundingClientRect().top>70; });
    if(next) next.scrollIntoView({block:"start", behavior:smooth});
    else if(last) last.scrollIntoView({block:"end", behavior:smooth});
  });
  update();
})();

/* 왼쪽 기둥(2026-11-18) — 상위 탭 · 하위 탭 · 소개 판 목록을 한 줄기로 그린다(넓은 화면만, common.css .side).
   단추를 새로 정의하지 않는다: 원래 단추(.tab · .subtab · .gi-it)의 이름을 읽어 오고, 누르면 원래 단추를 대신 누른다.
   그래서 판 여닫기 · 주소 · 애니는 지금까지처럼 tabs.js · mo.js · intro.js 가 맡고, 좁은 화면의 원래 두 줄과 행동이 같다.
   켜짐 표시는 원래 단추의 .act 를 지켜보다(MutationObserver) 따라 칠한다 — 딥링크 · 다른 스크립트가 바꿔도 같이 바뀐다.
   펼침은 켜진 상위 탭 하나만 — 접힌 탭까지 다 펼치면 세 겹이 다시 한 화면에 쌓인다.
   켜진 상위 탭을 다시 누르면 그 묶음을 접고, 또 누르면 편다(2026-11-23 · folded) — 사용자 「버튼저거 한번 더누르면 아래 접히는게 나을듯?」.
   이름 옆 ▾ 가 「접힌다」를 말하는데 눌러도 아무 일이 없었다. 원래 탭은 이미 켜져 있어 누르지 않는다. 다른 상위 탭으로 가면 접어 둔 것은 잊는다.
   그 탭 안의 목록(소개 판 목록 · 1-2 차례)은 하위 탭과 상관없이 늘 펼친다(2026-11-18). 하위 탭을 바꿀 때마다 목록이 접히고 펴지면
   누른 단추가 커서 밑에서 147px 튀었다(1920×900 실측). 다 펼쳐도 MMORPG 기둥은 711px 라 높이 720 화면에 든다.
   대신 안 보는 하위 탭의 목록은 켜짐을 칠하지 않는다(link 의 gate) — 칠하면 「전체 구조」와 「개요」가 같이 켜져 보인다.
   그 목록 칸을 누르면 하위 탭부터 연다 — 안 열면 숨은 판 안에서만 골라져 화면이 그대로다.
   1-2 는 판 셋이 한 쪽에 이어 붙는다(위 paint) — 쪽을 나누지 않고 기둥에 차례만 단다(2026-11-18).
   나누면 아래 두 판은 눌러야만 보이지만, 이어 두면 스크롤만으로 셋이 다 지나간다. 차례는 「아래에 뭐가 있나」만 알린다.
   → 2026-11-20 나눴다(사용자 요청 「스크롤 안 내려도 한 화면에」 · 위 showBn). 기둥은 넓은 화면에만 서므로 기둥이 보이면 늘 나뉜 상태다 —
     차례를 누르면 그 판 하나로 바뀌고, 켜짐은 스크롤 위치가 아니라 지금 고른 판(.wrap 의 data-bn)을 따른다. 판 이름은 여기 SECT 한 곳에만 적는다. */
(function(){
  const side=document.getElementById("side"); if(!side) return;
  const wrap=document.querySelector(".wrap");
  const SUB={mmo:"subtabs", mo:"mosub", shooter:"shsub"};      /* 상위 탭 → 그 하위 줄 */
  const LIST={mmo:"p-intro", mo:"p-mo", shooter:"p-shooter"};  /* 상위 탭 → 소개 판 목록이 든 판 */
  const SECT={bneck:[["p-bneck","병목 지도"],["p-optimization","핵심 최적화"],["p-crender","실서버 화면"]]};   /* MMORPG 하위 → 그 쪽의 판 차례 */
  const pairs=[], grps=[], spies=[];
  let folded=null;   /* 접어 둔 상위 탭(원래 단추) — 켜진 탭에서만 뜻이 있다(sync) */
  function mk(tag, cls, html){ const e=document.createElement(tag); e.className=cls; if(html!=null) e.innerHTML=html; if(tag==="button") e.type="button"; return e; }
  function link(p, o, lift, gate){
    pairs.push([p,o,gate]);
    p.addEventListener("click", function(){
      /* 켜진 상위 탭을 다시 누름 = 그 묶음 접기 · 펴기(위 머리 주석). 묶음이 없는 탭(링크 모음)은 지금처럼 원래 탭을 누른다 */
      if(o.classList.contains("act") && grps.some(function(x){ return x[2]===p; })){ folded=(folded===o) ? null : o; sync(); return; }
      const open = !!gate && !gate.classList.contains("act");   /* 목록 칸인데 그 하위 탭이 꺼져 있다 */
      if(open) gate.click();
      o.click();
      /* 기둥은 화면에 붙어 따라오므로 긴 판(병목 개선) 아래에서도 누를 수 있다 — 판을 바꿨으면 새 판의 맨 위부터 */
      if((lift || open) && scrollY>0) scrollTo(0,0);
    });
  }
  document.querySelectorAll(".tabrow .tab").forEach(function(t){
    const k=t.getAttribute("data-tab");
    const b=mk("button","sd-t"); b.appendChild(mk("b","",t.querySelector("b").innerHTML)); b.appendChild(mk("span","",t.querySelector("span").innerHTML));
    side.appendChild(b); link(b,t,true);
    const bar=SUB[k] && document.getElementById(SUB[k]); if(!bar) return;
    const g=mk("div","sd-grp"); side.appendChild(g);
    const ind=mk("div","sd-ind"); ind.setAttribute("aria-hidden","true"); g.appendChild(ind);   /* 파란 바탕(아래 place) — 칸보다 먼저 넣어야 칸 글자 밑에 칠해진다 */
    grps.push([g,t,b,ind]);
    bar.querySelectorAll(".subtab").forEach(function(s,i){
      const sb=mk("button","sd-s",s.innerHTML); g.appendChild(sb); link(sb,s,true);
      const sec=(k==="mmo") && SECT[s.getAttribute("data-sub")];
      if(sec){
        const l=mk("div","sd-list"); g.appendChild(l);
        sec.forEach(function(x,j){
          const el=document.getElementById(x[0]); if(!el) return;
          const lb=mk("button","sd-l"); lb.textContent=x[1]; l.appendChild(lb); spies.push([lb,el,s]);
          lb.addEventListener("click", function(){
            if(!s.classList.contains("act")) s.click();
            if(window.__bnShow && window.__bnShow(x[0])) return;   /* 넓은 화면 = 판을 바꾼다. 아래는 창을 막 줄였을 때의 예전 길 */
            const smooth=matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
            /* 첫 판은 쪽 맨 위 — 판 위끝에 맞추면 그 위 여백만큼 덜 올라간다 */
            if(j===0) scrollTo({top:0, behavior:smooth}); else el.scrollIntoView({block:"start", behavior:smooth});
          });
        });
      }
      if(i!==0) return;
      const gi=document.querySelector("#"+LIST[k]+" .gi"); if(!gi) return;
      const l=mk("div","sd-list"); g.appendChild(l);
      gi.querySelectorAll(".gi-it").forEach(function(it){ const lb=mk("button","sd-l",it.innerHTML); l.appendChild(lb); link(lb,it,false,s); });
    });
  });
  /* 켜진 프로젝트 덮기 그림(2026-11-24 · 모양 · 값 · 고른 경위는 common.css .sd-t · .sd-cover 주석) — 띠 위끝부터 묶음 끝 10px 아래까지
     그 프로젝트의 게임 화면 한 장을 깐다. 그림은 사용자가 시안 여덟 판에서 골랐다 — 상자(1920 창 191 × 380~549)에 맞춰 세로로 자르고 주인공은 오른쪽 위.
       mmo     = 마을 장터 · media/mmo-town.jpg 의 (620,0)–(840,632)
       mo      = 전사 번개 · 불길 · 사용자 녹스 녹화(11-23 13:28 · 22초쯤)의 (600,230)–(820,716)
       shooter = 실제 맵에서 총 겨눈 뒷모습 · 사용자가 무적 판에서 직접 찍은 사진(11-24)의 (381,180)–(665,745) — 이름표 · 조준점 · 체력 막대는 잘라 냈다
     열쇠는 원래 단추의 data-tab. 표에 없는 탭(링크 모음)은 그림이 없다(묶음도 없어 띠도 안 된다 — common.css).
     자리는 place 끝에서 재고, 묶음이 펴지고 접히는 동안은 ResizeObserver 가 매 프레임 다시 잰다 — 묶음 높이가 바뀌면 그 아래 띠도 움직인다.
     처음 놓을 때는 그대로, 프로젝트를 바꿀 때만 새 그림이 흐릿하게 나타난다(.in). 기둥이 안 서는 폭에서는 끈다. */
  const COVER={mmo:"media/side-mmo.jpg", mo:"media/side-mo.jpg", shooter:"media/side-shooter.jpg"};
  const cov=mk("div","sd-cover"); cov.setAttribute("aria-hidden","true"); side.prepend(cov);
  Object.keys(COVER).forEach(function(k){ new Image().src=COVER[k]; });   /* 처음 바꿀 때 그림 없는 상자가 비치지 않게 미리 받아 둔다 */
  function cover(){
    const x=side.offsetWidth ? grps.find(function(x){ return x[1].classList.contains("act"); }) : null;
    const k=x && x[1].getAttribute("data-tab"), src=k && COVER[k];
    cov.classList.toggle("on", !!src); if(!src) return;
    if(cov.dataset.k!==k){
      const first=!cov.dataset.k; cov.dataset.k=k; cov.style.setProperty("--img", 'url("'+src+'")');
      if(!first){ cov.classList.remove("in"); void cov.offsetWidth; cov.classList.add("in"); }
    }
    /* 기둥은 스크롤되는 상자라 위치는 내용 기준(scrollTop 더함) — 기둥 안에서 스크롤해도 그림이 칸과 같이 움직인다 */
    const sr=side.getBoundingClientRect(), a=x[2].getBoundingClientRect(), b=x[0].getBoundingClientRect();
    cov.style.left=(a.left-sr.left-side.clientLeft)+"px"; cov.style.top=(a.top-sr.top-side.clientTop+side.scrollTop)+"px";
    cov.style.width=a.width+"px"; cov.style.height=(b.bottom-a.top+10)+"px";
  }
  if(window.ResizeObserver){ const ro=new ResizeObserver(cover); side.querySelectorAll(".sd-t, .sd-grp").forEach(function(e){ ro.observe(e); }); }
  /* 지금 보는 칸의 파란 바탕(2026-11-23) — 칸마다 칠하지 않고 묶음마다 하나(.sd-ind)를 가장 깊은 켜진 칸 자리로 옮긴다.
     미끄러지는 움직임은 common.css 의 transition(사용자가 움직임 시안 1 · 2 · 4 를 골랐다 — 까닭은 common.css .sd-grp 주석).
     접힌 묶음도 잰다 — 높이만 0 이고 칸은 그대로 놓여 있어서(common.css .sd-grp[hidden]) 펼칠 때 바탕이 이미 제자리에 있다.
     jump = 미끄러지지 않고 바로 놓기 — 처음 놓을 때 · 창 크기가 바뀌었을 때(낮은 창 규칙이 글자를 줄인다) · 글꼴이 늦게 와서 칸 높이가 바뀌었을 때.
     기둥이 안 서는 폭(display:none)에서는 잴 수 없어 건너뛴다 — 창을 넓히면 resize 가 다시 부른다.
     MMORPG 병목 개선을 누르면 sync 에서 한 번(차례 칸이 아직 안 켜져 하위 탭 자리) · 다음 프레임 spy 에서 한 번(병목 지도 자리) 옮긴다 —
     첫 목표는 16ms 만에 바뀌어 눈에는 병목 지도로 곧장 가는 한 번으로 보인다 */
  const PILL=".sd-s.act:not(:has(+ .sd-list .sd-l.act)), .sd-l.act";
  function place(jump){
    if(!side.offsetWidth) return;
    grps.forEach(function(x){
      const d=x[3], it=x[0].querySelector(PILL);
      d.classList.toggle("on", !!it); if(!it) return;
      const j=jump || !d.style.height;
      if(j) d.style.transition="none";
      /* offsetTop 은 정수로 반올림돼 칸 위치가 소수점이면 바탕이 1px 어긋났다(낮은 창 · 1920 에서 렌더 대조) — 소수점째 잰다 */
      const r=it.getBoundingClientRect(), q=x[0].getBoundingClientRect();
      d.style.left=(r.left-q.left)+"px"; d.style.width=r.width+"px"; d.style.top=(r.top-q.top)+"px"; d.style.height=r.height+"px";
      if(j){ void d.offsetHeight; d.style.transition=""; }
    });
    cover();
  }
  function sync(){
    pairs.forEach(function(x){ const on=x[1].classList.contains("act") && (!x[2] || x[2].classList.contains("act")); x[0].classList.toggle("act",on);
      if(on) x[0].setAttribute("aria-current","true"); else x[0].removeAttribute("aria-current"); });
    if(folded && !folded.classList.contains("act")) folded=null;
    grps.forEach(function(x){ const open=x[1].classList.contains("act") && folded!==x[1]; x[0].hidden=!open; x[2].setAttribute("aria-expanded", String(open)); });
    place();
    spyReq();   /* 하위 탭이 바뀌면 스크롤 없이 쪽 길이가 바뀐다 */
  }
  /* 지금 보는 판 = 고른 판(.wrap 의 data-bn · 위 showBn). 숨은 판은 세지 않는다.
     (11-18~11-20 판 셋을 이어 붙였을 때는 스크롤 위치로 골랐다 — 위끝이 화면 40% 선을 넘어 올라온 판 중 마지막.)
     하위 탭(병목 개선)이 꺼져 있으면 판이 보여도 세지 않는다 — scene.js prewarm 이 첫 전환을 덜려고 숨은 #p-bneck 을
     두 프레임 열어 두는데(opacity .01), 그 사이에 여기가 돌면 소개 화면에서 「병목 지도」가 켜진 채 남았다
     (목록을 늘 펼친 뒤 드러남 · 화면 크기마다 나왔다 안 나왔다 하는 타이밍 문제, 2026-11-18). */
  let sq=false;
  function spy(){
    sq=false;
    const vis=spies.filter(function(x){ return x[2].classList.contains("act") && !x[1].hidden; });
    let cur=null;
    if(vis.length && side.offsetWidth){
      const bn=wrap.dataset.bn;
      cur = vis.find(function(x){ return x[1].id===bn; }) || vis[0];
    }
    spies.forEach(function(x){ const on=(x===cur); x[0].classList.toggle("act",on);
      if(on) x[0].setAttribute("aria-current","true"); else x[0].removeAttribute("aria-current"); });
    place();
  }
  function spyReq(){ if(!sq){ sq=true; requestAnimationFrame(spy); } }
  addEventListener("resize", spyReq);   /* 창을 넓혀 기둥이 막 섰을 때 */
  addEventListener("resize", function(){ place(true); });
  if(document.fonts) document.fonts.ready.then(function(){ place(true); });
  const mo=new MutationObserver(sync);
  pairs.forEach(function(x){ mo.observe(x[1],{attributes:true, attributeFilter:["class"]}); });
  if(wrap) mo.observe(wrap,{attributes:true, attributeFilter:["data-bn"]});   /* 차례를 눌러 판을 바꿨다 */
  sync();
})();

/* 탭 전환 페이드(2026-11-20) — 원래 단추(.tabrow .tab · .subtab · .gi-it)를 누르면 새로 보이게 된 판이
   0.24초 동안 흐릿하게 나타난다. 왼쪽 기둥은 원래 단추를 대신 누르므로 저절로 같이 걸린다.
   시안 넷(A 페이드 · B 떠오르기 · C 방향 밀기 · D 겹쳐 바꾸기)을 실제 판에 얹어 비교하고 A 를 골랐다(사용자 선택).
   D 는 섞이는 중간에 구조도와 게임 화면 글자가 겹쳐 보였고, A 가 이 페이지의 차분한 톤에 가장 가깝다.
   - 병목 개선으로 들어갈 때는 걸지 않는다 — 구조도가 병목 지도로 펴지는 장면(playBneckIntro)이 이미 전환이다.
     그래서 TGT 에 #p-bneck 줄기(#p-optimization · #p-crender)가 없다. 새 판을 더하면 여기도 넣을 것.
   - 새로 보이게 된 것 중 가장 바깥 것 하나만 — 상위 탭을 바꾸면 판(#p-mo) · 그 안 하위 판(#mo-intro) · 카드(.gi-card)가
     한꺼번에 보이게 되는데, 다 흐리게 하면 투명도가 곱해져 끝이 늦게 밝아진다.
   - 재는 때를 rAF 로 미룬다 — 원래 단추의 처리(판 여닫기)가 끝난 뒤, 새 판이 처음 그려지기 전에 걸어야 번쩍임이 없다.
   - 기둥의 목록 칸은 원래 단추를 둘(하위 탭 → 목록) 연달아 누른다 — 첫 누름에서 한 번만 재서 두 번 걸리지 않게.
   - 소개 판 그림은 흐리게 하지 않고 옛 그림을 위에 한 장 남겨 걷어 낸다 — 판 바탕(#05080e)이 비쳐 깜빡여 보이지 않게.
   - 움직임 줄이기 설정이면 아무것도 안 한다. */
(function(){
  const RM=matchMedia("(prefers-reduced-motion: reduce)");
  const TGT="#p-intro,#p-build,#p-mo,#p-shooter,#p-misc,.mo-pane,.sh-pane,.gi-card";
  function vis(){ return [].slice.call(document.querySelectorAll(TGT)).filter(function(e){ return e.getClientRects().length>0; }); }
  let before=null;
  function run(){
    const was=before; before=null;
    const now=vis().filter(function(e){ return was.indexOf(e)<0; });
    now.forEach(function(e){
      if(now.some(function(o){ return o!==e && o.contains(e); })) return;
      e.animate([{opacity:0},{opacity:1}],{duration:240, easing:"ease-out", id:"tabfade"});
    });
  }
  function ghost(b){
    const img=b.closest(".gi").querySelector(".gi-fr img"); if(!img) return;
    const g=img.cloneNode(); g.alt=""; g.setAttribute("aria-hidden","true"); g.style.pointerEvents="none";
    img.parentNode.appendChild(g);
    requestAnimationFrame(function(){   /* 새 그림이 풀린 뒤에 걷어야 빈 바탕이 안 비친다 */
      const p=img.decode ? img.decode().catch(function(){}) : Promise.resolve();
      p.then(function(){ g.animate([{opacity:1},{opacity:0}],{duration:320, easing:"ease", fill:"forwards", id:"tabfade-img"}).onfinish=function(){ g.remove(); }; });
    });
  }
  document.addEventListener("click", function(e){
    const b=e.target.closest && e.target.closest(".tabrow .tab,.subtab,.gi-it");
    if(!b || b.classList.contains("act") || RM.matches) return;
    if(b.dataset.sub==="bneck") return;
    if(b.classList.contains("gi-it")) ghost(b);
    if(!before){ before=vis(); requestAnimationFrame(run); }
  }, true);
})();
