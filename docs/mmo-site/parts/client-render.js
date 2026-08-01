/* ═══════════ ① 클라이언트 — 콘솔 / 웹 실제 실행 녹화 ═══════════
   전에는 이 자리에서 시뮬레이션 한 벌을 돌려 캔버스 두 장에 다시 그렸다(콘솔 문자판 + 픽셀 렌더).
   규칙(맵 120×120 · 섹터 20 · 시야 = 내 섹터 ±1 · 틱 40ms)을 실물과 같게 맞춰 놨어도, 보는 사람에게
   재현은 결국 그림이다. 그래서 실제로 서버를 띄우고 두 클라이언트로 접속해 녹화한 영상으로 바꿨다.
   재현 코드(서버 틱 · 도착 지연 · 데드레커닝 · 문자판 · 픽셀 렌더 약 650줄)는 통째로 걷어냈다.

   ── 여기 남은 일 셋 ──
   ① 규격 여섯 칸, ② 판이 보일 때만 재생 — 숨은 판에서 두 영상이 돌면 화면에 없는 그림에 디코딩을 쓴다,
   ③ 이 화면으로 들어올 때마다 진입 애니를 처음부터(1-1 이 웨이브를 다시 트는 것과 같은 자리).
   판 크기·이름표 자리 계산은 전부 CSS 가 한다(히어로 66.6% 의 근거는 CSS 쪽 주석 참고).
   진입 애니의 길이·방향·곡선도 전부 CSS 다 — 여기는 켜고 끄는 일만 한다. */
(function(){
"use strict";
var pane=document.getElementById("p-crender");
if(!pane) return;
var vids=[document.getElementById("vd-con"),document.getElementById("vd-web")];
var RM=matchMedia("(prefers-reduced-motion:reduce)").matches;

/* ═══ 규격 여섯 값 ═══
   ※ 한때 여기에 칩 넷(두 화면 한 서버 · 데드레커닝 · 묶음 되풀기 · 릴레이 43줄)과 그 설명 문단이
   있었다. 눌러야 보이는 글은 안 읽힌다 — 알맹이는 통째로 노션 쪽으로 넘겼다(맨 아래 링크).
   서버 무수정·릴레이 43줄도 각주에 한 줄로 남겨 뒀다가 걷어냈다. 이 탭이 보여줄 것은 화면이다.
   값은 규격이라 각주 줄(.f)이 필요 없다. 마지막 칸만 숫자가 없어서 .t 로 넣는다.
   판이 놓이는 자리는 panel-client.html 이 들고 있다 — 여기는 값만 채운다.
   ※ 판 머리줄('규격 · 세 화면 공통')은 걷어냈다. 액자 머리줄이 같은 말을 이미 한다.
   시야는 '±1' 이 아니라 '3×3' 이다. 둘은 같은 말이지만(내 섹터와 이웃 여덟), ±1 은 무엇에
   대한 ±1 인지를 라벨이 안 말해 준다. 웹 화면에 격자가 보이는 판이라 칸 수로 적는 편이 읽힌다. */
(function(){
  var rows=[["맵","120×120",""],
            ["섹터","20","칸 · 36개"],
            ["시야","3×3","섹터"],
            ["서버 틱","40","ms"],
            ["콘솔 화면","80×21","문자"],
            ["더미 부하",null,"이동 · 채팅"]];
  var d=document.getElementById("d-render");
  rows.forEach(function(r){
    var t=document.createElement("div"); t.className="cl-tile";
    t.innerHTML='<div class="l"></div><div class="v"></div>';
    t.querySelector(".l").textContent=r[0];
    var v=t.querySelector(".v");
    if(r[1]==null){
      var s=document.createElement("span"); s.className="t"; s.textContent=r[2]; v.appendChild(s);
    }else{
      var n=document.createElement("span"); n.className="n"; n.textContent=r[1]; v.appendChild(n);
      if(r[2]){ var u=document.createElement("span"); u.className="u"; u.textContent=r[2]; v.appendChild(u); }
    }
    d.appendChild(t);
  });
})();

/* ═══ 재생 — 판이 보이는 동안만 ═══
   창구 이름(__crenderPlay)은 그대로 뒀다 — 상위 탭 그리기(paint)가 이미 이 이름으로 부른다.
   멈춤은 탭 쪽에 새 호출을 심지 않고, 판의 hidden 이 바뀌는 것을 여기서 직접 본다. */
function kick(v){ var p=v.play(); if(p&&p["catch"]) p["catch"](function(){}); }
function play(){ if(RM) return; vids.forEach(kick); }
function stop(){ vids.forEach(function(v){ if(!v.paused) v.pause(); }); }

/* ═══ 진입 — 판이 제 자리에서 창처럼 열린다 ═══
   ENTER 는 맨 뒤 요소가 끝나는 시각이다(CSS 의 .cr-foot 지연 .46s + 길이 .48s).
   그 뒤에 .cr-in 을 떼는 것은 will-change 로 띄워 둔 레이어를 내리기 위해서다
   (영상 판 둘이 GPU 메모리를 계속 물지 않게).
   ※ 한때는 이유가 하나 더 있었다 — 판이 액자 밖에서 미끄러져 들어오던 시절에는 그동안
     액자가 판을 잘라 줘야 해서, 애니가 끝나면 그 overflow 를 되돌려 컷의 그림자를 살렸다.
     제자리에서 커지는 지금은 밖으로 나가는 것이 없어 자를 일 자체가 없다.
   CSS 를 고쳐 길이를 바꾸면 이 숫자도 같이 고칠 것. */
var ENTER=940+140, enterTimer=0;
function enter(){
  if(RM) return;
  pane.classList.remove("cr-in");
  void pane.offsetWidth;          /* 뗐다 붙이는 것을 브라우저가 인식하도록 강제 리플로우 */
  pane.classList.add("cr-in");
  clearTimeout(enterTimer);
  enterTimer=setTimeout(function(){ pane.classList.remove("cr-in"); }, ENTER);
}
/* 탭 전환 코드가 이 이름으로 부른다 — 영상 깨우기와 진입 애니가 한 창구를 쓴다.
   판의 hidden 을 보는 아래 MutationObserver 에는 안 얹는다: 그쪽은 tabs.js 가 hidden 을
   내리는 순간 따로 한 번 더 돌아서, 얹으면 같은 애니가 두 번 시작한다. */
window.__crenderPlay=function(){ play(); enter(); };
if(window.MutationObserver){
  new MutationObserver(function(){ if(pane.hidden) stop(); else play(); })
    .observe(pane,{attributes:true,attributeFilter:["hidden"]});
}
/* 저절로 도는 영상은 멈출 방법이 있어야 한다 — 컨트롤 바는 화면을 어지럽히므로 화면 자체를 누르게 한다.
   (움직임을 줄이도록 설정한 방문자에게는 자동재생을 안 걸지만, 눌러서 보는 길은 남긴다) */
vids.forEach(function(v){ v.addEventListener("click",function(){ if(v.paused) kick(v); else v.pause(); }); });
/* 첫 로드에 이 탭이 열려 있는 경우(딥링크 #crender). tabs.js 는 이 조각보다 먼저라
   그때의 paint() 는 __crenderPlay 를 아직 못 찾는다 — wave.js 가 같은 이유로 스스로 한 번
   재생하는 것과 같은 자리다. */
if(!pane.hidden){ play(); enter(); }
})();
