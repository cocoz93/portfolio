/* ═══ 소개 판 — 목록을 누르면 그림과 카드가 바뀐다(세 상위 탭 공통 · 짜임은 intro.css) ═══
   표를 스크립트에 두지 않고 마크업이 다 들고 있다 — 버튼 n번째(.gi-it) = 카드 n번째(.gi-card),
   그림은 버튼의 data-img · data-alt. 판마다 줄을 더할 때 HTML 만 고치면 된다.
   세부 메뉴(2026-11-23 슈팅 서버) — 카드 안에 .gi-sub 가 있으면 그 단추를 고를 때 액자 왼쪽 끝에 반투명 세로 띠 메뉴(.gi-menu)를 띄운다.
   다른 묶음의 세부도 숨은 칸(.gi-off)으로 단추 차례대로 띠에 넣어 칸 높이로 묶음 차례가 읽히게 한다(자리 계산은 intro.css).
   보이는 메뉴 칸(button) n번째 = .gi-sub n번째, 이름은 data-label. 고른 세부의 data-img · data-vid · data-wip 가 액자를, 그 세부 글이 카드를 채운다.
   data-vid = 그림 자리에 소리 없이 반복하는 영상(data-img 는 첫 장면) · data-wip = 「준비 중」 딱지(그림도 없으면 빈 액자 가운데).
   영상 · 메뉴 · 딱지 요소는 그런 카드가 있는 판에만 만든다 — MMORPG · 녹스 판은 예전 그대로다. */
(function(){
"use strict";
document.querySelectorAll(".gi").forEach(function(gi){
  const its=[].slice.call(gi.querySelectorAll(".gi-it"));
  const cards=[].slice.call(gi.querySelectorAll(".gi-card"));
  const img=gi.querySelector(".gi-fr img");
  /* 짝이 어긋나면 엉뚱한 카드가 뜬다 — 조용히 넘기지 말고 콘솔에 남긴다 */
  if(its.length!==cards.length||!img){ console.error("소개 판 짝 어긋남", gi.closest("section").id, its.length, cards.length); return; }
  const fr=img.parentNode;
  const subs=cards.map(function(c){ return [].slice.call(c.querySelectorAll(".gi-sub")); });
  const media=[].concat.apply(its, subs);   /* 액자를 채우는 쪽 = 단추와 세부 */
  let vid=null, wip=null, menu=null;
  if(media.some(function(e){ return e.dataset.vid; })){
    vid=document.createElement("video"); vid.muted=true; vid.loop=true; vid.playsInline=true; vid.setAttribute("playsinline","");
    vid.preload="none"; vid.hidden=true; fr.appendChild(vid);
    /* 판이 숨거나(다른 탭) 화면 밖이면 멈춘다 — 안 보이는 영상이 계속 풀리지 않게 */
    if("IntersectionObserver" in window) new IntersectionObserver(function(es){ es.forEach(function(e){
      if(vid.hidden) return;
      if(e.isIntersecting) play(); else vid.pause();
    }); }).observe(fr);
  }
  if(media.some(function(e){ return e.dataset.wip!=null; })){ wip=document.createElement("span"); wip.className="gi-wip"; wip.hidden=true; fr.appendChild(wip); }
  if(subs.some(function(s){ return s.length; })){ menu=document.createElement("nav"); menu.className="gi-menu"; menu.setAttribute("aria-label","세부 항목"); menu.hidden=true; fr.appendChild(menu); }
  function play(){ const p=vid.play(); if(p&&p.catch) p.catch(function(){}); }
  function show(e){
    const src=e.dataset.img||"", v=e.dataset.vid||"";
    if(src) img.src=src; else img.removeAttribute("src");
    img.alt=e.dataset.alt||""; img.hidden=!src||!!v;
    fr.classList.toggle("gi-empty", !src && !v);
    if(vid){
      if(v){ vid.poster=src; if(vid.getAttribute("src")!==v) vid.src=v; vid.setAttribute("aria-label", img.alt); vid.hidden=false; play(); }
      else { vid.pause(); vid.hidden=true; }
    }
    if(wip){ const t=e.dataset.wip; wip.hidden=(t==null); if(t!=null) wip.textContent=t||"영상 준비 중"; }
  }
  function pickSub(ss, j){
    ss.forEach(function(s,k){ s.hidden=(k!==j); });
    [].forEach.call(menu.querySelectorAll("button"), function(b,k){ const on=(k===j); b.classList.toggle("act",on); b.setAttribute("aria-pressed",on?"true":"false"); });
    show(ss[j]);
  }
  function pick(i){
    its.forEach(function(b,k){ const on=(k===i); b.classList.toggle("act",on); b.setAttribute("aria-pressed",on?"true":"false"); });
    cards.forEach(function(c,k){ c.hidden=(k!==i); });
    const ss=subs[i];
    if(menu) menu.hidden=!ss.length;
    if(!ss.length){ show(its[i]); return; }
    menu.textContent="";
    let lead=true;   /* 세부 있는 첫 묶음 — 그 뒤 묶음의 첫 칸 위에 틈(.gi-gap) */
    subs.forEach(function(gs,g){
      if(!gs.length) return;
      gs.forEach(function(s,j){
        const mine=(g===i), b=document.createElement(mine?"button":"span");
        b.className="gi-mi"+(mine?"":" gi-off")+(j===0&&!lead?" gi-gap":"");
        b.textContent=s.dataset.label||("세부 "+(j+1));
        if(mine){ b.type="button"; b.addEventListener("click", function(){ pickSub(ss,j); }); } else b.setAttribute("aria-hidden","true");
        menu.appendChild(b);
      });
      lead=false;
    });
    pickSub(ss,0);   /* 단추를 고르면 첫 세부부터 */
  }
  its.forEach(function(b,i){ b.addEventListener("click",function(){ pick(i); }); });
  pick(0);
  /* 그림 위에 얹는 판(.gi-over) — 가장 긴 카드가 그림 안에 안 들어가면 카드를 그림 아래로 내린다(.gi-low, intro.css).
     카드마다 짜임이 바뀌면 단추를 누를 때 판이 튀어서 판 전체를 가장 긴 카드로 정한다. 판이 숨어 있으면(높이 0) 재지 않는다 */
  if(gi.classList.contains("gi-over")){
    const box=gi.querySelector(".gi-cards");
    const fit=function(){
      gi.classList.remove("gi-low");
      if(!fr.offsetHeight || getComputedStyle(box).position!=="absolute") return;
      const tall=Math.max.apply(null, cards.map(function(c){ const h=c.hidden; c.hidden=false; const v=c.offsetHeight; c.hidden=h; return v; }));
      gi.classList.toggle("gi-low", tall + 44 > fr.offsetHeight);   /* 44 = 카드 위 22 + 아래 여백 22 */
    };
    if("ResizeObserver" in window) new ResizeObserver(fit).observe(fr); else addEventListener("resize", fit);
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  }
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
