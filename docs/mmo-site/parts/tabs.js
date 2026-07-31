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
  function paint(){
    /* 숨기기 '전에' 설계 씬이 화면 어디에 얼마 크기로 있었는지 잰다 — 숨긴 뒤에는 0 이 나온다.
       병목 지도가 바로 이 자리에 겹쳐 시작해야 '그림이 그대로 있다가 변한다' 가 된다. */
    const pb=document.getElementById("p-build"), sc=document.getElementById("scene");
    const fromRect=(!pb.hidden && top==="mmo" && sub==="bneck") ? sc.getBoundingClientRect() : null;
    tabs.forEach(function(t){ var on=(t.getAttribute("data-tab")===top);
      t.className = on ? "tab act" : "tab"; t.setAttribute("aria-selected", on?"true":"false"); });
    subs.forEach(function(t){ var on=(t.getAttribute("data-sub")===sub);
      t.className = on ? "subtab act" : "subtab"; t.setAttribute("aria-selected", on?"true":"false"); });
    subs2.forEach(function(t){ var on=(t.getAttribute("data-csub")===csub);
      t.className = on ? "subtab act" : "subtab"; t.setAttribute("aria-selected", on?"true":"false"); });
    subbar.hidden  = (top!=="mmo");
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

})();
