/* ═══ 소개 판 — 목록을 누르면 그림과 카드가 바뀐다(세 상위 탭 공통 · 짜임은 intro.css) ═══
   표를 스크립트에 두지 않고 마크업이 다 들고 있다 — 버튼 n번째(.gi-it) = 카드 n번째(.gi-card),
   그림은 버튼의 data-img · data-alt. 판마다 줄을 더할 때 HTML 만 고치면 된다. */
(function(){
"use strict";
document.querySelectorAll(".gi").forEach(function(gi){
  const its=[].slice.call(gi.querySelectorAll(".gi-it"));
  const cards=[].slice.call(gi.querySelectorAll(".gi-card"));
  const img=gi.querySelector(".gi-fr img");
  /* 짝이 어긋나면 엉뚱한 카드가 뜬다 — 조용히 넘기지 말고 콘솔에 남긴다 */
  if(its.length!==cards.length||!img){ console.error("소개 판 짝 어긋남", gi.closest("section").id, its.length, cards.length); return; }
  function pick(i){
    its.forEach(function(b,k){ const on=(k===i); b.classList.toggle("act",on); b.setAttribute("aria-pressed",on?"true":"false"); });
    cards.forEach(function(c,k){ c.hidden=(k!==i); });
    img.src=its[i].dataset.img; img.alt=its[i].dataset.alt||"";
  }
  its.forEach(function(b,i){ b.addEventListener("click",function(){ pick(i); }); });
  pick(0);
});

/* 하위 탭 줄 — 자기 스크립트가 없는 판(슈팅 서버)용.
   <nav data-panes="sh"> 안의 버튼 data-pane="intro" 가 #sh-intro 를 연다.
   MMORPG 하위 줄은 tabs.js(data-sub), 녹스는 mo.js(data-mo)가 따로 맡는다. */
document.querySelectorAll("nav[data-panes]").forEach(function(nav){
  const pre=nav.dataset.panes, bs=[].slice.call(nav.querySelectorAll("[data-pane]"));
  function sub(k){
    bs.forEach(function(b){ const on=(b.dataset.pane===k); b.classList.toggle("act",on); b.setAttribute("aria-selected",on?"true":"false");
      const p=document.getElementById(pre+"-"+b.dataset.pane); if(p) p.hidden=!on; });
  }
  bs.forEach(function(b){ b.addEventListener("click",function(){ sub(b.dataset.pane); }); });
  if(bs.length) sub(bs[0].dataset.pane);
});

/* 구조 상자 고르기 — 자기 스크립트가 없는 판(슈팅 서버 전체 구조)용. 짜임은 녹스 판의 .ms(mo.css)를 빌린다.
   .ms[data-pick] 안 상자 .nd[data-n="k"] 를 누르면 같은 data-n 의 카드(.mo-card)만 보인다. 처음엔 마크업의 .nd.act */
document.querySelectorAll(".ms[data-pick]").forEach(function(ms){
  const nds=[].slice.call(ms.querySelectorAll(".nd[data-n]"));
  const cards=[].slice.call(ms.querySelectorAll(".mo-card[data-n]"));
  /* 카드가 없는 상자는 눌러도 빈 칸이 된다 — 조용히 넘기지 말고 콘솔에 남긴다 */
  nds.forEach(function(g){ if(!cards.some(function(c){ return c.dataset.n===g.dataset.n; })) console.error("구조 상자 카드 없음", g.dataset.n); });
  function pick(k){
    nds.forEach(function(g){ g.classList.toggle("act",g.dataset.n===k); });
    cards.forEach(function(c){ c.hidden=(c.dataset.n!==k); });
  }
  nds.forEach(function(g){ g.addEventListener("click",function(){ pick(g.dataset.n); }); });
  const first=ms.querySelector(".nd.act")||nds[0];
  if(first) pick(first.dataset.n);
});
})();
