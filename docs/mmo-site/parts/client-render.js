/* ═══════════ ① 클라이언트 — 콘솔 / 웹 실제 실행 녹화 ═══════════
   전에는 이 자리에서 시뮬레이션 한 벌을 돌려 캔버스 두 장에 다시 그렸다(콘솔 문자판 + 픽셀 렌더).
   규칙(맵 120×120 · 섹터 20 · 시야 = 내 섹터 ±1 · 틱 40ms)을 실물과 같게 맞춰 놨어도, 보는 사람에게
   재현은 결국 그림이다. 그래서 실제로 서버를 띄우고 두 클라이언트로 접속해 녹화한 영상으로 바꿨다.
   재현 코드(서버 틱 · 도착 지연 · 데드레커닝 · 문자판 · 픽셀 렌더 약 650줄)는 통째로 걷어냈다.

   ── 여기 남은 일 둘 ──
   ① 규격 여섯 칸, ② 판이 보일 때만 재생 — 숨은 판에서 두 영상이 돌면 화면에 없는 그림에 디코딩을 쓴다.
   판 크기·이름표 자리 계산은 전부 CSS 가 한다(히어로 66.6% 의 근거는 CSS 쪽 주석 참고). */
(function(){
"use strict";
var pane=document.getElementById("p-crender");
if(!pane) return;
var vids=[document.getElementById("vd-con"),document.getElementById("vd-web")];
var RM=matchMedia("(prefers-reduced-motion:reduce)").matches;

/* ═══ 규격 여섯 칸 ═══
   ※ 한때 여기에 칩 넷(두 화면 한 서버 · 데드레커닝 · 묶음 되풀기 · 릴레이 43줄)과 그 설명 문단이
   있었다. 눌러야 보이는 글은 안 읽힌다 — 알맹이는 통째로 노션 쪽으로 넘겼다(맨 아래 링크).
   서버 무수정·릴레이 43줄도 각주에 한 줄로 남겨 뒀다가 걷어냈다. 이 탭이 보여줄 것은 화면이다.
   값은 규격이라 각주 줄(.f)이 필요 없다. 마지막 칸만 숫자가 없어서 .t 로 넣는다. */
(function(){
  var rows=[["맵","120×120",""],
            ["섹터","20","칸 · 36개"],
            ["시야","±1","섹터"],
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
window.__crenderPlay=play;
if(window.MutationObserver){
  new MutationObserver(function(){ if(pane.hidden) stop(); else play(); })
    .observe(pane,{attributes:true,attributeFilter:["hidden"]});
}
/* 저절로 도는 영상은 멈출 방법이 있어야 한다 — 컨트롤 바는 화면을 어지럽히므로 화면 자체를 누르게 한다.
   (움직임을 줄이도록 설정한 방문자에게는 자동재생을 안 걸지만, 눌러서 보는 길은 남긴다) */
vids.forEach(function(v){ v.addEventListener("click",function(){ if(v.paused) kick(v); else v.pause(); }); });
if(!pane.hidden) play();
})();
