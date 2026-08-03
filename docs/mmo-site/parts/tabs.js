(function(){
  /* 탭은 2단이다: 상위(mmo·dummy·misc) 아래 mmo 만 하위(build·bneck)를 갖는다.
     패널 4장은 그대로 형제로 두고 보이기만 두 값의 조합으로 정한다 —
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
  const subs2=[].slice.call(document.querySelectorAll(".subtab[data-csub]"));
  const subbar2=document.getElementById("subtabs2");
  let top="mmo", sub="build", csub="render";
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
     첫 화면(1-1)만 표시가 없다 — 기본값을 주소에 적으면 같은 화면에 주소가 둘 생긴다
     (포폴 홈에서 들어온 사람은 표시 없음, 탭 눌러 되돌아온 사람은 #build).
     pushState 가 아니라 replaceState 인 까닭: 쌓으면 탭을 누른 횟수만큼 방문기록이 생겨
     들어온 페이지로 나가려면 뒤로가기를 그만큼 눌러야 한다.
     첫 paint() 에서는 부르지 않는다(booted) — 들고 들어온 주소를 그 자리에서 지우면
     노션 등에 걸어 둔 #bneck 딥링크가 통째로 무의미해진다. */
  let booted=false;
  function syncHash(){
    if(!booted) return;
    const h = (top==="mmo")   ? (sub==="build" ? "" : sub)
            : (top==="dummy") ? ("c"+csub)
            :                   top;
    history.replaceState(null, "", h ? "#"+h : location.pathname+location.search);
  }
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
    subs2.forEach(function(t){ var on=(t.getAttribute("data-csub")===csub);
      t.className = on ? "subtab act" : "subtab"; t.setAttribute("aria-selected", on?"true":"false"); });
    subbar.hidden  = (top!=="mmo");
    if(zonebar) zonebar.hidden = !(top==="mmo" && sub==="build");
    subbar2.hidden = (top!=="dummy");
    alignSub();   /* 활성 탭이 방금 바뀌었으니 하위 줄 들여쓰기도 그 탭에 맞춘다 */
    document.getElementById("p-build").hidden = !(top==="mmo" && sub==="build");
    document.getElementById("p-bneck").hidden = !(top==="mmo" && sub==="bneck");
    document.getElementById("p-crender").hidden = !(top==="dummy" && csub==="render");
    document.getElementById("p-csafe").hidden = !(top==="dummy" && csub==="safe");
    document.getElementById("p-cload").hidden = !(top==="dummy" && csub==="load");
    document.getElementById("p-misc").hidden  = (top!=="misc");
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
       그래서 다시 들어올 때 여기서 깨워 준다 — 안 깨우면 멈춘 한 장이 남는다. */
    if(top==="dummy" && csub==="render" && window.__crenderPlay) window.__crenderPlay();
    /* 2-2 계단도 같다 — 이 화면에 들어올 때마다 처음부터. 첫 로드에서는 이 조각이 client.js 보다
       먼저라 __safePlay 가 아직 없고, 그때는 client.js 가 스스로 한 번 재생한다. */
    if(top==="dummy" && csub==="safe" && window.__safePlay) window.__safePlay();
    /* 2-3 도 같다 — 목차 넷이 차례로 서고 판이 뒤따라 열린다. 이 탭만 애니가 없던 동안
       다른 넷은 다 움직이는데 여기만 이미 다 서 있는 채로 나타나서 혼자 튀었다
       (3번 탭에서 같은 진단으로 lkOpen 을 넣은 기록이 common.css 에 있다). */
    if(top==="dummy" && csub==="load" && window.__loadPlay) window.__loadPlay();
    syncHash();
  }
  tabs.forEach(function(t){ t.addEventListener("click",function(){ top=t.getAttribute("data-tab"); paint(); }); });
  subs.forEach(function(t){ t.addEventListener("click",function(){ top="mmo"; sub=t.getAttribute("data-sub"); paint(); }); });
  subs2.forEach(function(t){ t.addEventListener("click",function(){ top="dummy"; csub=t.getAttribute("data-csub"); paint(); }); });
  /* 해시 딥링크 — #bneck 은 하위 탭이라 상위까지 같이 열어 준다 */
  const h0=(location.hash||"").replace("#","");
  if(h0==="bneck"||h0==="build"){ top="mmo"; sub=h0; }
  else if(h0==="dummy"||h0==="misc"){ top=h0; }
  else if(h0==="csafe"||h0==="cload"||h0==="crender"){ top="dummy"; csub=h0.slice(1); }
  /* #cenv 는 옛 ④ 테스트 환경 탭이었다. 그 내용이 ③ 부하 검증의 첫 띠로 들어갔으니 그쪽으로 보낸다 */
  else if(h0==="cenv"){ top="dummy"; csub="load"; }
  paint();
  booted=true;   /* 여기서부터는 사람이 탭을 누른 것이므로 주소를 따라가게 한다 */

})();
