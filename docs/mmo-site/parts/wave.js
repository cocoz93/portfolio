/* ═══════════ 등장 웨이브 — 좌하(클라) → 우상(MySQL) 대각선 팝인 (factory-v3식 · 3.9배속) ═══════════ */
(function(){
  const RMx=matchMedia("(prefers-reduced-motion:reduce)").matches;
  const scene=document.getElementById("scene");
  const stage=scene && scene.closest(".stage");
  /* 흐름 시작을 이제 이 IIFE 가 쥐고 있다 — 여기서 그냥 빠져나가면 데이터가 영영 안 흐른다 */
  if(!scene||!stage){ if(window.__flowStart) window.__flowStart(); return; }
  const body=document.body, SPAN=460;   /* factory-v3의 1800ms → 3.9배속 (900 → 692 → 460) */
  const sel="#lyr-plat>*,#lyr-shad>*,#lyr-lane>*,#lyr-build>*,#lyr-lbl>*";
  const els=[].slice.call(scene.querySelectorAll(sel));
  if(!els.length){ if(window.__flowStart) window.__flowStart(); return; }
  let H=500; try{ H=scene.getBBox().height||500; }catch(e){}
  /* 흐름축 f = cx + (H - cy) : 좌하일수록 작고(먼저), 우상일수록 큼(나중) → 대각선 스윕 */
  const info=els.map(function(el){ let cx=0,cy=0; try{ const b=el.getBBox(); cx=b.x+b.width/2; cy=b.y+b.height/2; }catch(e){} return {el:el,f:cx+(H-cy)}; });
  const fs=info.map(function(o){return o.f;});
  const fmin=Math.min.apply(null,fs), fmax=Math.max.apply(null,fs), range=(fmax-fmin)||1;
  info.forEach(function(o){ o.el.style.animationDelay=Math.round((o.f-fmin)/range*SPAN)+"ms"; });
  const replay=document.createElement("button");
  replay.type="button"; replay.className="stage-replay"; replay.textContent="↻ 다시 재생";
  stage.appendChild(replay);
  /* 웨이브가 완전히 끝나는 시점 = 맨 뒤 요소의 지연(SPAN) + 요소 하나의 애니 길이(160ms = CSS 의 scenePop).
     +100 은 마지막 칸이 자리를 잡은 걸 눈이 확인하는 짬 — 데이터는 그 뒤에 흐른다.
     이 짬은 속도를 올려도 그대로 둔다: 애니가 아니라 '눈이 따라잡는 시간' 이라 배속 대상이 아니다. */
  const WAVE=SPAN+160+100;
  let holdTimer=0;
  function play(){
    if(RMx){ body.classList.remove("pop-armed","pop-run","pop-hold"); return; }
    /* 흐름은 멈추고(Stop) 처음으로 되돌린 뒤(Reset) 감춘다(pop-hold).
       예전엔 Reset 만 하고 멈추지는 않아, 되돌리자마자 루프가 다시 칩을 뿜어
       구조가 아직 팝인하는 중에 데이터가 먼저 떠다녔다. */
    if(window.__flowStop)  window.__flowStop();
    if(window.__flowReset) window.__flowReset();
    body.classList.add("pop-hold");
    body.classList.remove("pop-run");
    body.classList.add("pop-armed");
    void stage.offsetWidth;   /* armed 상태를 브라우저가 인식하도록 강제 리플로우 */
    body.classList.add("pop-run");
    clearTimeout(holdTimer);
    /* 구역 순회(세션 1회)는 웨이브가 끝나고 데이터가 한 박자 흐른 뒤에 돈다 — 구조가 다 서고 흐르는
       '평소 모습' 을 먼저 봐야, 순회가 '그 화면을 구역별로 쪼갠 것' 으로 읽힌다.
       다만 예약은 여기, 웨이브를 켜는 자리에서 한다. 순회 쪽이 예약한 순간부터 사용자 입력을 듣기
       때문이다 — 웨이브가 도는 동안 누가 노드를 눌렀다면 순회는 아예 시작하지 않는다. */
    if(window.__zoneTourArm) window.__zoneTourArm(WAVE+800);
    holdTimer=setTimeout(function(){
      body.classList.remove("pop-hold");
      if(window.__flowStart) window.__flowStart();
    }, WAVE);
  }
  replay.addEventListener("click", play);
  /* 탭 전환 코드(앞의 IIFE, 다른 스코프)가 '설계 · 구현' 으로 돌아올 때마다 이걸 부른다.
     '다시 재생' 버튼과 완전히 같은 길을 타야 두 경우의 순서가 어긋나지 않는다. */
  window.__scenePlay=play;
  play();
})();
