(function(){
  "use strict";
  const panel=document.getElementById("p-optimization"),viewer=document.getElementById("op-viewer");
  if(!panel||!viewer) return;
  /* 재생 파일의 별도 사본을 만들지 않는다. 현재 인라인 소스를 그대로 한 장씩 연다. */
  const figures=[
    {id:"wsasend",title:"WSASend 호출 묶기",experiment:2,root:"wsasend-held-pulse-v11",
     source:"visualizations/wsasend-held-pulse-v11/ring-held-pulse.html",
     summary:"같은 Msg 4개를 보내되, 틱 끝에 모아 WSASend를 한 번 호출합니다.",
     note:"SendQ에 누적한 데이터를 한 번에 요청합니다. 그림의 4→1은 호출 횟수입니다."},
    {id:"msg-bundle",title:"이동 정보 묶기",experiment:6,root:"sector-bundle-held-pulse-v26",
     source:"visualizations/sector-bundle-held-pulse-v26/msg-held-pulse.html",
     summary:"같은 섹터의 이동 정보 네 개를 하나의 Msg로 만듭니다.",
     note:"네 이동 정보는 그대로 보존합니다. 묶음 Msg에는 Header 하나와 좌표 데이터 네 개가 들어갑니다."},
    {id:"msg-sharing",title:"직렬화버퍼 재사용",experiment:8,root:"serial-figure-3-interim",
     source:"visualizations/serial-sector-bank-v1/figure-3.html",
     summary:"동일한 Msg를 한 번 만들어 세 수신자의 SendQ에 복사합니다.",
     note:"Ref는 1→4→3→2→1→0으로 줄고, 마지막에 원본을 풀에 반환합니다. SendQ에는 바이트 사본이 남습니다."},
    {id:"digest",title:"수신 섹터별 Digest",experiment:9,root:"digest-comparison-four-residents-v17",
     source:"visualizations/digest-compare-four-residents-v17/digest-compare.html",
     summary:"섹터별 Msg를 수신 섹터별로 모아 주민의 SendQ에 한 번씩 적재합니다.",
     note:"같은 수신 섹터의 주민은 동일한 Digest를 재사용합니다. 예시는 세 섹터의 주민 2/1/1명, SendQ 네 개입니다."},
    {id:"quantization",title:"좌표 양자화",experiment:15,root:"quantization-value-change-v13",
     source:"visualizations/quantization-value-change-v13/quantization.html",
     summary:"서버 float은 유지하고, 전송할 좌표 부분을 8B에서 4B로 줄입니다.",
     note:"좌표에 ×512 후 반올림하여 uint16로 기록합니다. 좌표 하나당 4B→2B이며 반올림 오차가 있습니다."}
  ];
  const buttons=Array.from(panel.querySelectorAll("[data-optimization]"));
  const title=document.getElementById("op-title"),summary=document.getElementById("op-summary"),note=document.getElementById("op-note");
  const report=document.getElementById("op-report"),loading=document.getElementById("op-loading"),error=document.getElementById("op-error"),openSource=document.getElementById("op-open-source");
  const hashId=location.hash.replace(/^#optimization-?/,"");
  let selected=figures.find(f=>f.id===hashId)||figures[0],frame=null,loadedId="",observer=null,resizeFrame=0,generation=0;
  function currentDocument(){try{return frame&&frame.contentDocument;}catch(e){return null;}}
  function pause(){
    const doc=currentDocument();if(!doc) return;
    Array.from(doc.querySelectorAll("button")).forEach(button=>{if(button.textContent.trim()==="일시정지")button.click();});
  }
  function disconnect(){if(observer)observer.disconnect();observer=null;if(resizeFrame)cancelAnimationFrame(resizeFrame);resizeFrame=0;}
  function hash(){return selected===figures[0]?"optimization":"optimization-"+selected.id;}
  function paint(){
    title.textContent=selected.title;summary.textContent=selected.summary;note.textContent=selected.note;
    buttons.forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.optimization===selected.id)));
    const experiment=(window.__EXPS||[]).find(e=>e.s===selected.experiment);
    report.hidden=!(experiment&&experiment.nt);
    if(experiment&&experiment.nt){report.href=experiment.nt;report.setAttribute("aria-label",selected.title+" 관련 실측 보고서 — 노션에서 열기");}
    else report.removeAttribute("href");
    openSource.href=selected.source;
  }
  function measure(){
    resizeFrame=0;if(!frame||panel.hidden) return;
    const doc=currentDocument(),root=doc&&doc.getElementById(selected.root);if(!root) return;
    const height=Math.ceil(root.getBoundingClientRect().height);
    if(height>0&&frame.style.height!==height+"px")frame.style.height=height+"px";
  }
  function queueMeasure(){if(!resizeFrame)resizeFrame=requestAnimationFrame(measure);}
  function fail(){viewer.dataset.state="error";loading.hidden=true;error.hidden=false;}
  function load(){
    if(panel.hidden) return;
    if(frame&&loadedId===selected.id){queueMeasure();return;}
    pause();disconnect();if(frame)frame.remove();
    const token=++generation,figure=selected;
    frame=document.createElement("iframe");frame.className="op-frame";frame.title=figure.title+" — 변경 전·후 애니메이션";
    frame.setAttribute("scrolling","no");frame.referrerPolicy="no-referrer";
    /* 같은 저장소의 인라인 문서만 연다. 부모는 도구 모음·높이·정지만 조정한다. */
    frame.addEventListener("load",function(){
      if(token!==generation) return;
      const doc=currentDocument(),root=doc&&doc.getElementById(figure.root);if(!root){fail();return;}
      const style=doc.createElement("style");
      style.textContent=`html{color-scheme:dark}body{margin:0;background:#0d1421;overflow:hidden}
        .viz-controls{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:12px 20px}
        button.btn{font-family:PCB-Pretendard,"Malgun Gothic",sans-serif;font-size:13px;font-weight:500;
          line-height:1.4;padding:8px 12px;border-radius:7px;border:1px solid #354b61;color:#eef2fb;
          background:#151f2c;cursor:pointer}button.btn:hover{border-color:#6cc7ff}
        button.btn:focus-visible{outline:2px solid #6cc7ff;outline-offset:2px}
        .text-small,[data-status],.sector-status{font-size:12px;line-height:1.5;color:#a8b8ca}
        .viz-controls .sector-state-line{margin:0;flex:1 1 220px;text-align:right}
        @media(max-width:480px){.viz-controls{padding:12px}}
        @media(pointer:coarse){button.btn{min-height:44px}}`;
      doc.head.appendChild(style);
      const toolbar=root.querySelector(".viz-controls");
      if(toolbar){const state=root.querySelector(".sector-state-line");if(state)toolbar.appendChild(state);root.prepend(toolbar);}
      if(typeof ResizeObserver==="function"){observer=new ResizeObserver(queueMeasure);observer.observe(root);}
      const ready=function(){if(token!==generation)return;queueMeasure();viewer.dataset.state="ready";loading.hidden=true;};
      if(doc.fonts&&doc.fonts.ready)doc.fonts.ready.then(ready);else ready();
      if(panel.hidden)pause();
    });
    frame.addEventListener("error",function(){if(token===generation)fail();});
    viewer.dataset.state="loading";loading.hidden=false;error.hidden=true;loadedId=figure.id;
    frame.src=figure.source;viewer.appendChild(frame);
  }
  function select(id){
    const figure=figures.find(f=>f.id===id);if(!figure) return;
    if(selected!==figure){pause();selected=figure;}
    paint();load();
    if(!panel.hidden)history.replaceState(null,"","#"+hash());
  }
  buttons.forEach(button=>button.addEventListener("click",function(){select(button.dataset.optimization);}));
  window.__optimizationHash=hash;
  window.__optimizationVisibility=function(visible){if(visible){paint();load();}else pause();};
  window.__optimizationForExperiment=function(experiment){return figures.find(f=>f.experiment===experiment);};
  window.__optimizationShow=function(id){select(id);const tab=document.querySelector('.subtab[data-sub="optimization"]');if(tab)tab.click();window.scrollTo({top:0,behavior:"auto"});};
  document.addEventListener("click",function(event){
    const link=event.target.closest&&event.target.closest("#bn-principle");if(!link||!link.dataset.optimization)return;
    if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    event.preventDefault();window.__optimizationShow(link.dataset.optimization);
  });
  document.addEventListener("visibilitychange",function(){if(document.hidden)pause();});
  paint();if(!panel.hidden)load();
})();
