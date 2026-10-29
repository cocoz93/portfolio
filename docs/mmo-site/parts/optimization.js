(function(){
  "use strict";
  const panel=document.getElementById("p-optimization"),viewer=document.getElementById("op-viewer");
  if(!panel||!viewer) return;
  /* 재생 파일의 별도 사본을 만들지 않는다. 현재 인라인 소스를 그대로 한 장씩 연다. */
  const figures=[
    {id:"wsasend",title:"WSASend 호출 묶기",titleLines:["WSASend","호출 묶기"],effect:"N회 → 1회",term:"Send Coalescing",experiment:2,root:"wsasend-held-pulse-v11",
     source:"visualizations/wsasend-held-pulse-v11/ring-held-pulse.html",
     summary:"같은 세션의 Msg N개를 틱 끝에 모아 한 번 호출합니다.",example:"그림은 N=4 예시",
     note:""},
    {id:"msg-bundle",title:"이동 정보 묶기",titleLines:["이동 정보","묶기"],effect:"Msg N개 → 1개",term:"Message Bundling",experiment:6,root:"sector-bundle-held-pulse-v26",
     source:"visualizations/sector-bundle-held-pulse-v26/msg-held-pulse.html",
     summary:"같은 섹터의 이동 정보 네 개를 하나의 Msg로 만듭니다.",example:"그림은 N=4 예시",
     note:"네 이동 정보는 그대로 보존합니다. 묶음 Msg에는 Header 하나와 좌표 데이터 네 개가 들어갑니다."},
    {id:"msg-sharing",title:"직렬화버퍼 재사용",titleLines:["직렬화버퍼","재사용"],effect:"Msg 생성 N회 → 1회",term:"Buffer Sharing",experiment:8,root:"serial-figure-3-interim",
     source:"visualizations/serial-sector-bank-v1/figure-3.html",
     summary:"동일한 Msg를 한 번 만들어 N명 수신자의 SendQ에 복사합니다.",
     note:"Ref는 1→4→3→2→1→0으로 줄고, 마지막에 원본을 풀에 반환합니다. SendQ에는 바이트 사본이 남습니다."},
    {id:"digest",title:"수신 섹터별 Digest",titleLines:["수신 섹터별","Digest"],effect:"N회 적재 → 1회",term:"Sector Digest",experiment:9,root:"digest-comparison-four-residents-v17",
     source:"visualizations/digest-compare-four-residents-v17/digest-compare.html",
     summary:"섹터별 Msg를 수신 섹터별로 모아 주민의 SendQ에 한 번씩 적재합니다.",
     note:"같은 수신 섹터의 주민은 동일한 Digest를 재사용합니다. 예시는 세 섹터의 주민 2/1/1명, SendQ 네 개입니다."},
    {id:"quantization",title:"좌표 양자화",titleLines:["좌표","양자화"],effect:"8B → 4B",term:"Coordinate Quantization",experiment:15,root:"quantization-msg-strip-v14",
     source:"visualizations/quantization-msg-strip-v14/quantization.html",
     summary:"서버 float은 유지하고, 전송할 좌표 부분을 8B에서 4B로 줄입니다.",
     note:"좌표에 ×512 후 반올림하여 uint16로 기록합니다. 좌표 하나당 4B→2B이며 반올림 오차가 있습니다."}
  ];
  const buttons=Array.from(panel.querySelectorAll("[data-optimization]"));
  /* 머리 글자 = 위 1-2 카드 번호. scene.js 가 NOTION_EXP 순서로 붙인 EXPS[].no 를 그대로 읽는다 */
  buttons.forEach(function(button){
    const figure=figures.find(f=>f.id===button.dataset.optimization);
    const experiment=figure&&(window.__EXPS||[]).find(e=>e.s===figure.experiment);
    const mark=button.querySelector("em");if(!mark||!experiment||!experiment.no)return;
    mark.textContent=String(experiment.no);button.title=experiment.no+" "+figure.title;
  });
  const title=document.getElementById("op-title"),summary=document.getElementById("op-summary"),note=document.getElementById("op-note");
  const heading=panel.querySelector(".op-heading"),explanation=document.getElementById("op-explanation"),example=document.getElementById("op-example");
  const report=document.getElementById("op-report"),loading=document.getElementById("op-loading"),error=document.getElementById("op-error"),openSource=document.getElementById("op-open-source");
  const hashId=location.hash.replace(/^#optimization-?/,"");
  let selected=figures.find(f=>f.id===hashId)||figures[0],frame=null,loadedId="",observer=null,resizeFrame=0,generation=0;
  function currentDocument(){try{return frame&&frame.contentDocument;}catch(e){return null;}}
  function pause(){
    const doc=currentDocument();if(!doc) return;
    Array.from(doc.querySelectorAll("button")).forEach(button=>{
      const text=button.textContent.trim();
      if(text==="일시정지"||text==="❚❚"||button.getAttribute("aria-label")?.includes("일시정지"))button.click();
    });
  }
  function disconnect(){if(observer)observer.disconnect();observer=null;if(resizeFrame)cancelAnimationFrame(resizeFrame);resizeFrame=0;}
  function hash(){return selected===figures[0]?"optimization":"optimization-"+selected.id;}
  function revealSelection(){
    const index=panel.querySelector(".op-index"),button=buttons.find(b=>b.dataset.optimization===selected.id);
    if(!button||panel.hidden||index.scrollWidth<=index.clientWidth)return;
    const left=button.getBoundingClientRect().left-index.getBoundingClientRect().left+index.scrollLeft;
    if(left<index.scrollLeft||left+button.offsetWidth>index.scrollLeft+index.clientWidth)
      index.scrollTo({left:Math.max(0,left-(index.clientWidth-button.offsetWidth)/2),behavior:"auto"});
  }
  function paint(){
    panel.dataset.figure=selected.id;
    const sideExplanation=true;
    if(sideExplanation){if(heading.parentElement!==explanation)explanation.appendChild(heading);}
    else if(heading.parentElement!==viewer.parentElement)viewer.parentElement.insertBefore(heading,viewer);
    explanation.hidden=!sideExplanation;
    title.textContent=selected.title;
    if(selected.titleLines){
      const main=document.createElement("span");main.className="op-title-main";
      selected.titleLines.forEach(function(text,index){
        if(index)main.appendChild(document.createTextNode(" "));
        const line=document.createElement("span");line.className="op-title-line";line.textContent=text;main.appendChild(line);
      });
      title.replaceChildren(main);
    }
    if(selected.effect){
      const effect=document.createElement("span");effect.className="op-effect";effect.textContent=selected.effect;title.appendChild(effect);
    }
    if(selected.term){
      const term=document.createElement("small");term.className="op-term";term.textContent=selected.term;title.appendChild(term);
    }
    summary.textContent=selected.summary;note.textContent=selected.note;note.hidden=!selected.note;
    example.textContent=selected.example||"";example.hidden=!selected.example;
    buttons.forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.optimization===selected.id)));
    const experiment=(window.__EXPS||[]).find(e=>e.s===selected.experiment);
    report.hidden=!(experiment&&experiment.nt);
    if(experiment&&experiment.nt){report.href=experiment.nt;report.setAttribute("aria-label",selected.title+" 관련 실측 보고서 — 노션에서 열기");}
    else report.removeAttribute("href");
    openSource.href=selected.source;
    requestAnimationFrame(revealSelection);
  }
  function measure(){
    resizeFrame=0;if(!frame||panel.hidden) return;
    const doc=currentDocument(),root=doc&&doc.getElementById(selected.root);if(!root) return;
    const displayScale=parseFloat(getComputedStyle(frame).zoom)||1;
    doc.documentElement.style.setProperty("--op-control-zoom",String(1/displayScale));
    const height=Math.ceil(root.getBoundingClientRect().height);
    if(height>0&&frame.style.height!==height+"px")frame.style.height=height+"px";
  }
  function queueMeasure(){if(!resizeFrame)resizeFrame=requestAnimationFrame(measure);}
  function fail(){viewer.dataset.state="error";loading.hidden=true;error.hidden=false;
    Array.from(viewer.querySelectorAll(".op-frame.op-old")).forEach(f=>f.remove());viewer.style.minHeight="";}
  function load(){
    if(panel.hidden) return;
    if(frame&&loadedId===selected.id){queueMeasure();return;}
    /* 옛 그림은 새 그림이 준비될 때까지 붙잡아 두고, 준비되면 새 그림이 그 위로 서서히 덮는다(2026-10-29).
       그냥 지우면 새 문서를 읽는 0.1~0.2초 동안 그림 칸이 빈다. 불러오는 중에 또 누르면 처음 붙잡은 그림을 계속 둔다. */
    const old=viewer.dataset.state==="ready"?frame:viewer.querySelector(".op-frame.op-old");
    pause();disconnect();
    Array.from(viewer.querySelectorAll(".op-frame")).forEach(f=>{if(f!==old)f.remove();});
    if(old){old.classList.remove("op-in");old.classList.add("op-old");if(!viewer.style.minHeight)viewer.style.minHeight=viewer.offsetHeight+"px";}
    const token=++generation,figure=selected;
    viewer.dataset.figure=figure.id;
    frame=document.createElement("iframe");frame.className="op-frame";frame.title=figure.title+" — 변경 전·후 애니메이션";
    frame.setAttribute("scrolling","no");frame.referrerPolicy="no-referrer";
    /* 제 높이를 재기 전까지는 옛 그림 높이로 선다 — 기본값 640 으로 한 번 들썩였다가 다시 바뀌지 않게 */
    if(old&&old.style.height)frame.style.height=old.style.height;
    /* 같은 저장소의 인라인 문서만 연다. 부모는 도구 모음·높이·정지만 조정한다. */
    frame.addEventListener("load",function(){
      if(token!==generation) return;
      const doc=currentDocument(),root=doc&&doc.getElementById(figure.root);if(!root){fail();return;}
      const style=doc.createElement("style");
      style.textContent=`html{color-scheme:dark}body{margin:0;background:#0d1421;overflow:hidden}
        .viz-controls{zoom:var(--op-control-zoom,1);display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0;padding:10px 20px}
        button.btn{font-family:PCB-Pretendard,"Malgun Gothic",sans-serif;font-size:13px;font-weight:600;
          line-height:1.4;padding:8px 12px;border-radius:7px;border:1px solid #354b61;color:#eef2fb;
          background:#151f2c;cursor:pointer;min-width:40px;text-align:center}button.btn:hover{border-color:#6cc7ff}
        button.btn:focus-visible{outline:2px solid #6cc7ff;outline-offset:2px}
        /* 재생 버튼만 기본 강조색(파랑)으로 칠해 그림마다 먼저 누를 곳을 하나로 정한다 — 주황은 그림 안에서 「변경 후」를 뜻해 피한다 */
        button.btn[data-action="play"]{background:#46b1ff;border-color:#46b1ff;color:#0a0f1a}
        button.btn[data-action="play"]:hover{background:#6cc7ff;border-color:#6cc7ff}
        /* 단계 문구는 0.3초 안팎으로 바뀌어 읽히지 않고, 끝 문구는 효과 문구와 같은 말이라 숨긴다 */
        .study-status,[data-status]{display:none!important}
        @media(max-width:480px){.viz-controls{padding:8px 12px}button.btn{padding:7px 10px}}
        @media(pointer:coarse){button.btn{min-height:44px}}`;
      doc.head.appendChild(style);
      const toolbar=root.querySelector(".viz-controls");
      if(toolbar)root.prepend(toolbar);
      if(typeof ResizeObserver==="function"){observer=new ResizeObserver(queueMeasure);observer.observe(root);}
      const ready=function(){if(token!==generation)return;queueMeasure();viewer.dataset.state="ready";loading.hidden=true;
        const shown=frame,held=viewer.querySelector(".op-frame.op-old");
        const drop=function(){if(held)held.remove();if(token===generation)viewer.style.minHeight="";};
        if(!held){viewer.style.minHeight="";return;}
        /* 덮는 애니가 끝난 뒤 옛 그림을 치운다 — 움직임 줄이기 설정이면 애니가 없으니 바로 */
        shown.classList.add("op-in");
        if(shown.getAnimations().length)shown.addEventListener("animationend",drop,{once:true});else drop();};
      if(doc.fonts&&doc.fonts.ready)doc.fonts.ready.then(ready);else ready();
      if(panel.hidden)pause();
    });
    frame.addEventListener("error",function(){if(token===generation)fail();});
    /* 옛 그림을 붙잡고 있으면 '불러오는 중' 문구는 띄우지 않는다 — 뜨면 옛 그림을 아래로 밀어낸다 */
    viewer.dataset.state="loading";loading.hidden=!!old;error.hidden=true;loadedId=figure.id;
    /* 같은 파일명을 다시 빌드해도 상위 문서의 변경 시각으로 그림 캐시를 갱신한다. */
    frame.src=figure.source+"?v="+encodeURIComponent(document.lastModified)+"-"+Date.now();viewer.appendChild(frame);
  }
  function select(id){
    const figure=figures.find(f=>f.id===id);if(!figure) return;
    const changed=selected!==figure;
    if(changed){pause();selected=figure;}
    paint();
    /* 오른쪽 설명도 그림과 같이 서서히 바뀐다 */
    if(changed){explanation.classList.remove("op-in");void explanation.offsetWidth;explanation.classList.add("op-in");}
    load();
    if(!panel.hidden)history.replaceState(null,"","#"+hash());
  }
  buttons.forEach(button=>button.addEventListener("click",function(){select(button.dataset.optimization);}));
  window.__optimizationHash=hash;
  window.__optimizationVisibility=function(visible){if(visible){paint();load();}else pause();};
  window.__optimizationForExperiment=function(experiment){return figures.find(f=>f.experiment===experiment);};
  /* 1-2 카드의 「원리 보기」 — 이 판은 1-2 바로 아래라 탭을 바꾸지 않고 내려오기만 한다(2026-10-27 탭에서 내림) */
  window.__optimizationShow=function(id){select(id);panel.scrollIntoView({block:"start",behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});};
  document.addEventListener("click",function(event){
    const link=event.target.closest&&event.target.closest("#bn-principle");if(!link||!link.dataset.optimization)return;
    if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    event.preventDefault();window.__optimizationShow(link.dataset.optimization);
  });
  document.addEventListener("visibilitychange",function(){if(document.hidden)pause();});
  window.addEventListener("resize",revealSelection);
  paint();if(!panel.hidden)load();
})();
