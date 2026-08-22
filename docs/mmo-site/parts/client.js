/* ═══════════ 클라이언트 탭 — 그림·계기판·카드 ═══════════ */
(function(){
"use strict";
var NS="http://www.w3.org/2000/svg";
function el(t,a,txt){ var e=document.createElementNS(NS,t); for(var k in a) e.setAttribute(k,a[k]);
  if(txt!=null) e.textContent=txt; return e; }
function h(t,a,txt){ var e=document.createElement(t); for(var k in a) e.setAttribute(k,a[k]);
  if(txt!=null) e.textContent=txt; return e; }

/* ═══════════ ② 안전성 그림 ═══════════ */
/* 계기판이 성과 수치가 아니라 PC 두 대인 이유 — 2-2 는 서버 PC 와 클라 PC 를 나눠 돌린 시험이고
   2-3 은 한 PC loopback 이다. 조건이 다른데 머리에 안 적어 두면 두 탭의 수치를 같은 자로 읽는다. */
/* 계기판은 잰 자리(전제)만 든다. 성과 '무결성 위반 0건' 을 판으로 떼어 오른쪽 아래에 세워 둔 적이
   있는데, 같은 말이 이미 그림 안에 두 번 있어 걷어냈다 — STEP 2 의 '결함 주입, 첫 패킷에서
   검출' 과 보기 ③ 합격 기준. */
var SAFE={
  dash:[["서버 PC","i9-10900","10C / 20T","Windows 10 · RAM 32GB · NIC Intel I225-V",0],
        ["부하 클라 PC","i7-6700","4C / 8T","Windows 10 · RAM 16GB · NIC Intel I219-V",0],
        ["기가 인터넷의 업로드 상한","474","Mbps","이 시험은 여유 — 병목 실험에서 여기 막혀 회선을 걷어냈다 (2-3 은 한 PC loopback)",0]],
  /* ── 설명 넷은 길이를 맞춘다 ──
     상자를 카드 오른쪽 아래 구석에 붙여 놨는데(safe-scene.js 의 overlay), 위를 고정하고 아래로
     자라는 구조라 줄 수가 곧 아래 여백이다. 넷이 145·180·142·88자이던 때 아래 여백이 보기마다
     60 → 18.6px 로 출렁였다(보기②가 4줄). 그래서 그림이 이미 하는 말을 먼저 걷어냈고 —
     걷어낸 것: '먼저 검증된 더미로 잰다'(보기 버튼 이름) · '동접 1,000'(STEP 1 판정줄) ·
     '①을 통과한'(STEP 2 이름표) · '결함 주입, 첫 패킷에서 검출'(STEP 2 판정줄) ·
     '동접 5,000 · 이동 · 시야 · 채팅'(STEP 3 이름표와 판정줄) —
     그러고도 78·85·78·55자로 두 줄씩이라 읽기 전에 글 덩어리로 보였다. 그래서 한 번 더 죄었다:
     문장을 잇지 않고 끊고, 조사와 되풀이를 덜어내고, 셋씩 나열되는 것은 가운뎃점만 남겼다.
     ※ 여기 글을 늘릴 일이 생기면 넷의 줄 수가 어긋나는 순간 아래 여백이 다시 출렁인다.
       늘릴 거면 넷을 같이 늘릴 것
     ※ 지금은 넷 다 두 줄이다(보기를 '합격 기준 → 단계 셋' 으로 다시 짜면서 줄까지 맞췄다).
       한 줄에서 두 줄로 늘리면서 safe-scene.js 의 chips·note y 를 16 씩 올렸다.
       (아래에 있던 노션 문은 소탭 줄로 옮겨 갔다 — 이제 이 글 밑에서 겹칠 것은 없다) */
  /* n 이 배열이면 줄을 그대로 나눠 찍는다(wireWide 가 <br> 로 잇는다). 2-3 은 문단 하나라 문자열이다 */
  items:{
    gate:{t:"합격 기준",
      n:["모든 더미에서 에러 0",
         "바이트 훼손, 순서 역전, 왕복 초과, 비정상 끊김"]},
    s1:{t:"검증된 더미",
      n:["네트워크 라이브러리 검증 (멀티스레드 환경)",
         "서버가 먼저 끊지 않는지 / 보낸 값이 그대로 오는지 / 접속 수가 맞는지"]},
    s2:{t:"커스텀 더미",
      n:["12~256바이트 가변으로 테스트",
         "마찬가지로 네트워크 라이브러리 검증"]},
    s3:{t:"더미 클라이언트",
      n:["실제 컨텐츠 부하 (이동·시야·채팅·존이동)",
         "성능 한계 측정 (tick·RTT·송신량)"]}
  }
};
/* ── 전폭 그림에서 되풀어 쓰는 조각들 ── */
/* ── 글자 배율 ──
   tx 를 쓰는 곳은 2-3 그림 넷뿐이라 크기를 여기 한 줄로 쥔다.
   왜 필요했나: 이 그림은 viewBox 880 이 판 폭으로 펴지면서 배율이 1.5~1.7 붙는다. 그래서
   코드에 적힌 10 이 화면에서는 15~17px 이 된다 — 한때 1-1 씬(최소 18px)과 맞추려고 1.36 까지
   올렸는데, 그러면 이 판의 본문 글자가 판 설명(.cl-bd 14.4px)의 1.5 배가 되어 그림이 글보다
   커졌다. 지금은 1.10 이다: 9.5 → 17.5px 로 판 설명보다 한 뼘 크다(그림 속 글자는 배경이
   복잡해 본문보다 조금 커야 읽힌다). 기준을 1-1 씬에서 같은 판 안의 글로 바꾼 셈이다.
   ※ 좌표는 이 배율에 맞춰 다시 잡았다 — 배율만 내리면 줄 사이가 벌어져 판이 헐렁해진다. */
var LOAD_FS=1.10;
function tx(p,x,y,t,size,col,w,anc,fam){
  p.appendChild(el("text",{x:x,y:y,"font-size":String(Math.round(size*LOAD_FS*10)/10),
    fill:col,"font-weight":w||"600",
    "text-anchor":anc||"start","font-family":fam||"var(--sans)"},t));
}
function bx(p,x,y,w,ht,fill,stroke,rx){
  p.appendChild(el("rect",{x:x,y:y,width:w,height:ht,rx:(rx==null?9:rx),
    fill:fill||"none",stroke:stroke||"none"}));
}
function plate(p,x,y,w,ht){ p.appendChild(el("rect",{class:"cl-plate",x:x,y:y,width:w,height:ht,rx:12})); }
/* 합격 표시 — 동그라미 안 체크. 4 번 판이 넉 줄에 하나씩 단다.
   글꼴의 ✓ 를 안 쓰는 까닭: 이 사이트의 두 글꼴에 그 글자가 없어 폴백이 나고, 폴백된 글자는
   크기·굵기가 옆 글자와 따로 논다(같은 함정이 loadThr 주석에 mono 한글로 적혀 있다). */
function chk(p,cx,cy){
  p.appendChild(el("circle",{cx:cx,cy:cy,r:8.5,fill:"rgba(87,214,148,.12)",
    stroke:"#57d694","stroke-width":"1"}));
  p.appendChild(el("polyline",{points:(cx-3.8)+","+cy+" "+(cx-1.1)+","+(cy+3)+" "+(cx+4.2)+","+(cy-3.5),
    fill:"none",stroke:"#57d694","stroke-width":"1.6","stroke-linecap":"round","stroke-linejoin":"round"}));
}
/* 오른쪽을 가리키는 화살표 하나 */
function arrow(p,x1,x2,y,col,wd){
  p.appendChild(el("path",{d:"M "+x1+" "+y+" L "+(x2-7)+" "+y,stroke:col,"stroke-width":String(wd||2),fill:"none"}));
  p.appendChild(el("polygon",{points:x2+","+y+" "+(x2-8)+","+(y-5)+" "+(x2-8)+","+(y+5),fill:col}));
}

/* 아이소 3단 계단 — 통과한 것만 다음 단의 도구가 된다는 순서를 판 높이로 말한다.
   옛 그림은 네 띠짜리 평면 도식이었다. 정보는 다 있었지만 1-1·1-2 와 세계가 달라
   무엇을 고쳐도 "그게 그거"로 보였다(평면 안에서 배치만 바꾼 시안 셋이 반려됐다).
   ── 그리는 코드와 자리 숫자는 parts/safe-scene.js 에 있다 ──
   편집기 mmo-safe-edit.html 이 그 파일을 그대로 읽어 같은 그림을 그린다. 배치를 고칠 일이
   생기면 여기가 아니라 그쪽 SCENE 을 고친다(편집기의 Export 가 그 모양으로 나온다). */
function drawSafe(){
  var S=window.SafeScene; if(!S) return;
  S.draw(document.getElementById("sc-safe"), S.SCENE);
  S.apply(S.SCENE);
}

/* ── 계단 애니 ── 무대에 시안 클래스를 입히고 sfa-run 으로 재생한다(규칙은 client.css).
   클래스를 뗐다 붙이는 것만으로는 다시 재생이 안 된다 — 한 프레임 안에서 떼고 붙이면
   브라우저가 바뀐 것을 모른다. 사이에 리플로우를 한 번 강제한다(wave.js 와 같은 수법). */
var SFA="c";                                     /* 고른 시안: a 차오름 · b 왕복 · c 둘 다 · d 결함검출 */
var SFA_ALL=["a","b","c","d"];
function safePlay(){
  var st=document.querySelector("#p-csafe .sf-stage"); if(!st) return;
  SFA_ALL.forEach(function(k){ st.classList.remove("sfa-"+k); });
  st.classList.remove("sfa-run");
  st.classList.add("sfa-"+SFA);
  void st.offsetWidth;
  st.classList.add("sfa-run");
}
/* 인자를 주면 시안을 바꿔 끼우고 재생한다(고르는 줄과 렌더 검증이 쓴다).
   탭 전환은 인자 없이 부르므로 고른 시안 그대로 다시 돈다. */
window.__safePlay=function(k){ if(k) SFA=k; safePlay(); };

/* 시안 고르기 줄 — 주소 끝에 ?anim 을 붙였을 때만 뜬다. 시안을 정하면 이 블록째 지운다. */
function safePicker(){
  if(!/(^|[?&])anim(&|=|$)/.test(location.search)) return;
  var NAME={a:"a 차오름", b:"b 왕복", c:"c 차오름→왕복", d:"d 결함 검출"};
  var bar=h("div",{style:"position:fixed; z-index:99; left:50%; bottom:14px; transform:translateX(-50%);"
    +"display:flex; gap:6px; align-items:center; background:#131a26; border:1px solid #28324a;"
    +"border-radius:10px; padding:6px 9px; font-size:.8rem; box-shadow:0 8px 24px rgba(0,0,0,.5)"});
  bar.appendChild(h("span",{style:"color:#8496b3; margin-right:2px"},"애니 시안"));
  SFA_ALL.forEach(function(k){
    var b=h("button",{type:"button",style:"font:inherit; cursor:pointer; border-radius:7px;"
      +"padding:4px 9px; border:1px solid #28324a; background:#1a2333; color:#eef2fb"},NAME[k]);
    b.addEventListener("click",function(){
      SFA=k;
      [].forEach.call(bar.querySelectorAll("button"),function(o){
        o.style.background="#1a2333"; o.style.borderColor="#28324a"; });
      b.style.background="#14324b"; b.style.borderColor="#2f5f86";
      safePlay();
    });
    if(k===SFA){ b.style.background="#14324b"; b.style.borderColor="#2f5f86"; }
    bar.appendChild(b);
  });
  var r=h("button",{type:"button",style:"font:inherit; cursor:pointer; border-radius:7px;"
    +"padding:4px 9px; border:1px solid #28324a; background:#0f1522; color:#8496b3"},"↻ 다시");
  r.addEventListener("click",safePlay);
  bar.appendChild(r);
  document.body.appendChild(bar);
}

/* ═══════════ ③ 부하 그림 — 왼쪽 목차로 고르고, 고른 하나가 오른쪽을 다 쓴다 ═══════════
   한때 이 탭은 판 넷을 한 화면에 늘어놓았다(위 띠 하나 + 아래 가로 세 칸). 넷을 다 보여
   주려다 보니 판마다 무게가 같아져 어디부터 볼지가 정해지지 않았다 — 눈이 좌우로 갈렸다.
   목차를 왼쪽에 세우면 읽는 축이 세로 하나가 되고, 오른쪽은 고른 것 하나가 크게 쓴다.
   대가는 분명하다: 나머지 셋은 화면에 없다. 그래서 목차 줄에 이름과 곁말을 같이 둬서,
   누르지 않아도 무엇이 있는지는 읽히게 했다.
   ── 목차가 SVG 가 아니라 HTML 인 이유 ──
   2-2 제목에서 이미 겪었다(panel-client.html 의 주석): SVG 글자는 액자 배율을 타서
   창 1280 에서 잔글씨가 된다. 목차는 늘 같은 크기로 읽혀야 한다. */
var LOAD={
  /* no·t 는 목차 줄이 쓰고, d 는 판 설명이다.
     한때 곁말(s)과 수치(k)가 더 있어 목차 줄이 석 줄짜리 카드였다 — 판 높이만큼 늘어난 카드의
     빈 속을 메우려던 것인데, 그 값들이 왼쪽에서 미리 다 말해 버려 오른쪽 판과 같은 말이 겹쳤다.
     목차는 '무엇을 고를 수 있나' 만 말한다(까닭은 client.css 의 .cl-idx).
     d 가 문자열 하나인 것은 이 글이 SVG 가 아니라 HTML(.cl-bd)이라 저절로 접히기 때문이다 —
     한때는 배열로 줄을 손수 끊었고, 줄을 하나 늘릴 때마다 아래 그림의 y 를 다 같이 내려야 했다. */
  items:{
    env:{no:"1", t:"코어 배분",
      d:"서버/클라가 루프백에서 실행되므로 코어 경쟁 이슈 제거"},
    map:{no:"2", t:"맵과 클라이언트 시야", d:""},
    bot:{no:"3", t:"더미 부하 컨텐츠",
      d:"봇은 매틱 1~100 랜덤으로 행동 결정."},
    /* 제목은 한때 '측정기가 병목이면 안 된다' 였다 — 목차 다섯 중 이것만 문장이라 결이 어긋났고,
       그 원칙은 바로 아래 설명줄이 이미 한 번 더 말한다. 목차는 '무엇을 고를 수 있나' 만 말한다. */
    thr:{no:"4", t:"더미부터 검증",
      d:"서버가 5,000에서 막힌 게 아니라 더미가 5,000을 못 만든 것일 수 있다. 그래서 더미는 자기가 밀리는지를 먼저 잰다."},
    /* 회선은 한때 ① 코어 배분 판의 오른쪽 절반이었다. 제목이 왼쪽 절반(코어)만 가리키는 데다
       loopback 이 그 판에 두 번 있었다 — 왼쪽 화살표 라벨과 오른쪽 v4 카드. 항목을 가르니
       제목과 내용이 각각 맞아떨어지고, '랜선도 공유기도 안 탄다' 도 제 자리(v4 옆)로 왔다. */
    line:{no:"5", t:"회선 한계",
      d:"회선이 천장이면 서버가 아니라 회선을 잼. 네 번 옮겨 loopback 으로 제거."}
  }
};
var LOAD_ORDER=["env","map","bot","thr","line"];

/* 그림은 880×262 만 쓴다 — 판의 배경·머리줄·설명은 HTML(.cl-body)이 맡는다.
   한때 이 셋이 다 SVG 안에 있었다. 그러면 액자 배율을 타서 창 1280 에서 잔글씨가 되고,
   설명 줄을 하나 늘릴 때마다 아래 그림의 y 를 전부 내려야 했다(2-2 제목에서 겪은 것과 같은 함정).
   ── 글자 크기는 세 단만 쓴다 ──
   머리 10.5(흰) · 본문 9.5(회색) · 잔글씨 8(어두운 회색). 큰 값(25% · 922)만 예외로 15 다.
   한때 9 부터 15 까지 여덟 단이 섞여 있어 무엇이 더 중요한지가 크기로 안 읽혔다.
   ── 2026-08 에 넉 판을 두 번 낮췄다 ──
   ① 11.5 / 10 / 8.5 · 큰 값 30 → 10.5 / 9.5 / 8 · 21. 판 안에서 제일 큰 글씨(30 → 화면 40px)가
      판 제목(22.7px)보다 커서 위계가 뒤집혔다.
   ② 그러고도 컸다 — 배율을 1.36 → 1.10 으로 내리고 큰 값도 21 → 15 로. 화면 기준으로 본문
      21.6 → 17.5px, 큰 값 47 → 27.5px 다.
   도형도 두 번 다 같이 줄였다 — 글자만 줄이면 상자만 큰 그림이 된다.
   viewBox 높이도 320 → 292 → 262 로 따라 낮췄다(줄어든 만큼 아래가 비면 '덜 채운 판' 이 된다). */
/* 회선 이사 넷 — env 와 (좁은 화면의) 어디서도 같은 표를 쓴다 */
var LOAD_HOP=[["v1","공인 IP 브릿지","474 Mbps","폐기"],["v2","사설 LAN 정적IP","940 Mbps","폐기"],
              ["v3","공유기 NAT","940 Mbps","폐기"],["v4","한 PC loopback","—","현재"]];
/* [이름, 값, 근거] — 넷 다 '더미가 병목이 아니다' 의 근거라 판정 표시도 넷 다 같다.
   한때 넷째 자리에 합격 여부(1/0)가 있어 '만든 접속 수' 만 초록이 아니었는데, 화면에서는
   그 하나만 색이 빠진 이유가 읽히지 않아 '덜 채운 칸' 으로 보였다. */
var LOAD_GUARD=[["더미 루프 p99","3.9 ms","예산 40ms 의 10%"],
                ["송신 버퍼 넘침","0 건","더미가 밀리지 않았다"],
                ["만든 접속 수","목표치 그대로","모자라면 부하가 거짓"],
                ["교차 확인","스레드 ×2 → 왕복 그대로","더미는 병목이 아니다"]];

/* ── 1 코어 배분 ── 칩 한 장이 판 전체를 쓴다. 칸 하나가 물리코어, 그 안의 둘이 논리코어다.
   ── 왜 반반(칩 | 아이소)에서 칩 한 장으로 왔나 ──
   왼쪽 칩과 오른쪽 아이소가 둘 다 '코어 열 개를 6:4 로 갈랐다' 를 그리고 있었다. 같은 말이
   두 곳에 있으면 지운다는 것이 이 사이트의 규칙이고, 마침 판이 물리/논리까지 보여야 해서
   칸이 커질 자리가 필요했다. 합치면 칸 폭이 50 → 133 이 되어 한 칸 안에 [물리 번호 + 논리 둘]
   이 다 들어간다. 아이소를 잃지만, 2-3 의 나머지 판 넷은 원래 다 평면이라 결이 오히려 맞는다.
   ── 코어 번호를 열 우선으로 매긴다 ──
   5열 2행에 0~9 를 위→아래, 왼→오른쪽 순으로 채우면 왼쪽 세 열이 0~5(서버) · 오른쪽 두 열이
   6~9(클라) 로 딱 떨어진다. 행 우선으로 채우면 6 이 아랫줄 첫 칸으로 가서 경계가 계단이 된다.
   ── 한 장의 칩 안에서 가르는 이유 ──
   열 개를 두 무리로 따로 늘어놓으면 '한 PC 를 갈랐다' 가 아니라 '기계가 둘' 로도 읽힌다 —
   바로 앞 탭(2-2)이 실제로 PC 두 대를 쓴 시험이라 이 오독은 실재한다. 한 테두리 안에서
   골 하나로 가르면 나눈 것이 '한 덩어리' 라는 게 먼저 읽힌다.
   ※ 옛 반반 그림은 __envZero(4) 로 볼 수 있다(envOld). 이 판정이 서면 진 쪽을 지운다. */
function loadEnv(g){
  if(ENV_V && ENV_VAR[ENV_V]){ ENV_VAR[ENV_V](g); return; }
  if(ENV_ZERO===4){ envOld(g); return; }
  if(ENV_ZERO){
    tx(g,24,18,"서버 PC 한 대 · i9-10900 · 10코어 20스레드",9.5,"#8496b3","700");
    zeroScene(g); return;
  }
  envHT(g);
}
/* 옛 반반 그림 — 왼쪽 칩(코어를 어떻게 갈랐나) · 오른쪽 아이소(그 둘이 무엇으로 붙나) */
function envOld(g){
  tx(g,24,18,"서버 PC 한 대 · i9-10900 · 10코어 20스레드",9.5,"#8496b3","700");
  envChip(g);
  envLink(g);
}

/* ═══ 물리/논리까지 보이는 칩 한 장 ═══
   [칸 배경, 칸 테두리, 논리 슬롯 배경, 논리 번호] — 논리 슬롯은 칸보다 어둡다.
   칸(패키지)보다 다이가 어둡고 다이보다 슬롯이 어두워야 '안으로 파였다' 가 세 겹으로 읽힌다. */
var HT_PAL={srv:["#1f4f74","#3a7fb5","#12314a","#a8d4f5"],
            cli:["#6b4718","#c98a34","#402b0e","#f2cf95"]};
/* 패키지 테두리 — 왼쪽 위 모서리를 자르고 위아래 변에 정렬 홈 둘을 판다.
   실물 LGA 의 방향 표시라, 테두리 하나만으로 '이건 CPU' 가 선다(옛 envChip 에서 가져온 형태). */
function htPackage(g,x,y,w,h){
  /* 홈 자리는 아래 통로 스터브(무리 한가운데)를 피한다 — 겹치면 홈이 통로의 이음매로 읽힌다 */
  var N=9, CUT=15, m1=Math.round(w*0.22), m2=Math.round(w*0.72);
  var p=[[x+CUT,y],[x+m1,y],[x+m1+5,y+N],[x+m1+23,y+N],[x+m1+28,y],
         [x+m2,y],[x+m2+5,y+N],[x+m2+23,y+N],[x+m2+28,y],
         [x+w,y],[x+w,y+h],[x+m2+28,y+h],[x+m2+23,y+h-N],[x+m2+5,y+h-N],[x+m2,y+h],
         [x+m1+28,y+h],[x+m1+23,y+h-N],[x+m1+5,y+h-N],[x+m1,y+h],[x,y+h],[x,y+CUT]];
  g.appendChild(el("polygon",{points:p.map(function(q){return q[0]+","+q[1];}).join(" "),
    fill:"#131b28",stroke:"#2a3550","stroke-width":"1"}));
}
/* 칸 하나 = 물리코어 하나. 왼쪽에 물리 번호(큼), 세로줄 오른쪽에 논리 슬롯 둘(작음).
   ── 왜 슬롯 둘에 번호를 다 적나 ──
   한때 이 자리에 번호 없는 막대 둘을 세웠다가 걷어냈다('스레드 둘' 이라는 뜻이 장식으로만
   남아서). 번호를 적으면 서버 무리가 논리 0~11 · 클라 무리가 12~19 로 화면에서 세어지고,
   INI 가 왜 물리 번호 하나로 둘을 함께 잡는지가 그림만으로 확인된다.
   ── 형제 둘이 같은 칸 안에 있는 것이 요지다 ──
   한 칸을 두 프로세스가 나눠 가지면 같은 물리코어의 실행 자원을 함께 쓰게 된다. 칸 색이
   통째로 하나라는 것이 '형제를 갈라 주지 않았다' 를 말한다 — 글로 적을 필요가 없다. */
/* 칸 높이가 40 밑이면 잔치수를 한 단 줄인다 — 시안 판은 세로를 아끼려고 칸이 34 다.
   큰 칸의 치수를 그대로 쓰면 물리 번호가 칸 높이를 꽉 채워 슬롯이 눌린다. */
function htCore(g,x,y,w,h,i){
  var P=(i<6)?HT_PAL.srv:HT_PAL.cli, sm=(h<40);
  var pf=sm?13:15, lx=sm?21:25, dv=sm?40:48, s0=sm?49:58, pd=sm?6:7, m=sm?6:7;
  bx(g,x,y,w,h,P[0],P[1],sm?6:7);
  tx(g,x+lx,y+h/2+(sm?5:6),String(i),pf,"#eaf3ff","800","middle","var(--mono)");
  g.appendChild(el("line",{x1:x+dv,y1:y+(sm?7:9),x2:x+dv,y2:y+h-(sm?7:9),
    stroke:P[1],"stroke-width":"1",opacity:".5"}));
  var sx=x+s0, sw=(w-s0-(sm?10:12)-pd)/2, sh=h-m*2;
  for(var k=0;k<2;k++){
    var bxx=sx+k*(sw+pd);
    bx(g,bxx,y+m,sw,sh,P[2],P[1],5);
    tx(g,bxx+sw/2,y+m+sh/2+4,String(i*2+k),sm?8.5:9.5,P[3],"700","middle","var(--mono)");
  }
}
/* 오가는 길은 칩 '아래' 다 ── loopback 은 CPU 안의 연결이 아니라 커널 네트워크 스택을 도는
   길이다. 코어 사이 골에 그리면 '코어끼리 붙어 있다' 로 읽혀 사실이 틀어진다.
   위가 보내는 길 · 아래가 돌아오는 길(2-2 아이소와 같은 규칙). */
function htFlow(g,x0,x1,y,col,right){
  g.appendChild(el("path",{d:"M "+(x0+(right?0:9))+" "+y+" L "+(x1-(right?9:0))+" "+y,
    stroke:col,"stroke-width":"1.4",fill:"none","stroke-dasharray":"5 5",opacity:".85"}));
  var tip=right?x1:x0, back=right?x1-9:x0+9;
  g.appendChild(el("polygon",{points:tip+","+y+" "+back+","+(y-4.5)+" "+back+","+(y+4.5),fill:col}));
}
/* 통로는 칩 아래 '받침 한 장' 이다 — 칩 폭을 그대로 쓴다.
   두 무리 사이만 잇는 짧은 막대로 뒀더니 판 한가운데 뜬 조각으로 보였다. 칩이 얹히는 받침이면
   칩 밖(커널)에서 오간다는 것이 층으로 읽히고, 그림 전체에 바닥이 생긴다.
   화살표의 좌우 끝은 두 무리의 한가운데다 — 선을 따로 긋지 않아도 어느 쪽에서 나가는지가 잡힌다. */
function htKernel(g,x,w,xL,xR,yTop){
  var y=yTop+8, hgt=22;
  bx(g,x,y,w,hgt,"#0d1422","#1e2739",8);
  htFlow(g,xL,xR,y+8,"#6cc7ff",1);
  htFlow(g,xL,xR,y+15,"#ffb648",0);
  tx(g,x+16,y+15,"loopback 127.0.0.1",8,"#8496b3","700",null,"var(--mono)");
}
function envHT(g){
  /* 머리줄 둘은 하는 일이 다르다 — 왼쪽은 규격, 오른쪽은 이 그림을 읽는 법이다 */
  tx(g,24,16,"서버 PC 한 대 · i9-10900 · 물리 10코어 / 논리 20스레드",9.5,"#8496b3","700");
  tx(g,856,16,"칸 하나가 물리코어 · 그 안의 둘이 논리코어",8,"#5d6c85","600","end");
  var X=24, Y=48, W=832, H=160;
  htPackage(g,X,Y,W,H);
  var dx=X+16, dy=Y+30, dw=W-32, dh=H-46;
  bx(g,dx,dy,dw,dh,"#0a1120","#233047",9);                       /* 다이 */
  var ix=dx+14, iy=dy+14, iw=dw-28, ih=dh-28, G=10, GAP=76;
  var cw=(iw-3*G-GAP)/5, ch=(ih-G)/2;
  for(var i=0;i<10;i++){
    var c=Math.floor(i/2), r=i%2;
    htCore(g,ix+c*(cw+G)+(c>=3?GAP-G:0),iy+r*(ch+G),cw,ch,i);
  }
  /* 골 한가운데 점선 — 가른 자리를 못 박는다(② ③ 판의 세로선과 같은 문법) */
  var gx=ix+3*(cw+G)-G;
  g.appendChild(el("line",{x1:gx+GAP/2,y1:dy+10,x2:gx+GAP/2,y2:dy+dh-10,
    stroke:"#5b6f92","stroke-width":"1","stroke-dasharray":"4 4"}));
  /* 각인은 잘린 모서리 반대편이다 — 왼쪽 위에 두면 컷과 글자가 한자리에서 다툰다 */
  tx(g,X+W-14,Y+19,"i9-10900",8,"#4a5a78","700","end","var(--mono)");
  /* 이름과 INI 키는 한 줄에 붙인다 — 키가 곧 그 무리의 이름표라 떨어뜨릴 이유가 없다 */
  tx(g,ix,40,"서버 프로세스",9.5,"#9ad4ff","800");
  tx(g,ix+78,40,"ServerCores = 0-5",8,"#8a9ab5","600",null,"var(--mono)");
  tx(g,ix+iw,40,"부하 클라 프로세스",9.5,"#ffcf8a","800","end");
  tx(g,ix+iw-110,40,"ClientCores = 6-9",8,"#8a9ab5","600","end","var(--mono)");
  htKernel(g,X,W,ix+(3*cw+2*G)/2,ix+iw-(2*cw+G)/2,Y+H);
  /* 이 줄이 그림의 값을 코드와 잇는다 — ServerConfig.h 가 물리 k 를 받아 0x3<<2k 로 편다 */
  tx(g,856,254,"설정은 물리코어 번호로 적고, 형제 논리코어까지 서버가 함께 잡는다",8,"#5d6c85","600","end");
}

/* ══════════════ ① 코어 배분 시안 — 손그림 설계대로 ══════════════ __envV(1) / 0 은 지금 것
   위에 CPU 한 덩어리, 그 안이 두 구역으로 갈린다. 구역 하나가 한 프로세스의 몫이고,
   구역 안 격자는 **열 하나가 물리코어 · 그 열의 위아래 두 칸이 그 코어의 논리코어 둘**이다.
   아래에 프로세스 둘이 나란히 서고, 구역에서 뻗은 꼬리가 '이 몫은 이쪽' 을 잇는다.
   두 상자 사이 왕복 화살표가 주고받는 프로토콜(loopback)이다.
   ── 코어를 프로세스 상자 안에 다시 그리지 않는다 ──
   앞선 시안들은 CPU 와 프로세스 양쪽에 코어를 그렸다. 코어는 CPU 안에만 있고 프로세스는
   '어느 구역을 쥐었나' 로만 말한다 — 그래야 한 CPU 를 갈라 나눠 썼다는 것이 흐려지지 않는다. */
var ENV_V=0;
window.__envV=function(k){ ENV_V=(k|0); drawLoad("env"); };
function envVB(h){ var s=document.getElementById("sc-load"); if(s) s.setAttribute("viewBox","0 0 880 "+h); }
/* 구역 하나. 칸마다 rect 를 그리면 맞닿은 테두리가 겹쳐 두꺼워진다 — 판을 하나 깔고 선으로 나눈다 */
function envZone(g,x,y,w,h,cols,base,P){
  bx(g,x,y,w,h,"none",P[1],8);
  var gx=x+10, gy=y+28, cw=(w-20)/cols, ch=30, gw=cw*cols;
  bx(g,gx,gy,gw,ch*2,P[2],P[1],0);
  for(var c=0;c<cols;c++){
    tx(g,gx+c*cw+cw/2,y+21,String(base+c),10.5,P[3],"800","middle","var(--mono)");
    if(c) g.appendChild(el("line",{x1:gx+c*cw,y1:gy,x2:gx+c*cw,y2:gy+ch*2,
      stroke:P[1],"stroke-width":"1",opacity:".75"}));
    for(var r=0;r<2;r++)
      tx(g,gx+c*cw+cw/2,gy+r*ch+ch/2+4.5,String((base+c)*2+r),10,"#dfe9f6","700","middle","var(--mono)");
  }
  g.appendChild(el("line",{x1:gx,y1:gy+ch,x2:gx+gw,y2:gy+ch,stroke:P[1],"stroke-width":"1",opacity:".75"}));
  return {x0:x, x1:x+w, bot:y+h};
}
/* 구역에서 프로세스로 내려가는 꼬리 — 구역 아래변 두 끝이 상자 윗변 한 점으로 모인다 */
function envZTail(g,x0,x1,y0,px,py,fill,stroke){
  g.appendChild(el("polygon",{points:x0+","+y0+" "+x1+","+y0+" "+px+","+py,fill:fill}));
  g.appendChild(el("polyline",{points:x0+","+y0+" "+px+","+py+" "+x1+","+y0,
    fill:"none",stroke:stroke,"stroke-width":"1.2","stroke-linejoin":"round"}));
}
function envZProc(g,x,y,w,h,name,ini,col,fill,stroke){
  bx(g,x,y,w,h,fill,stroke,10);
  tx(g,x+w/2,y+27,name,12,col,"800","middle");
  tx(g,x+w/2,y+46,ini,8.5,"#a9bcd6","600","middle","var(--mono)");
}
function envRough(g){
  envVB(266);
  var CX=160, CY=12, CW=560, CH=134;
  bx(g,CX,CY,CW,CH,"#131b28","#2a3550",18);
  tx(g,CX+CW/2,CY+24,"CPU",13,"#c8d6ea","800","middle");
  tx(g,CX+CW-16,CY+21,"i9-10900",8,"#4a5a78","700","end","var(--mono)");
  var zy=CY+30, zh=96;
  var zA=envZone(g,CX+24,zy,288.8,zh,6,0,HT_PAL.srv);
  var zB=envZone(g,CX+336.8,zy,199.2,zh,4,6,HT_PAL.cli);
  var py=184, ph=56, aw=316, ax=24, bx2=880-24-aw;
  envZTail(g,zA.x0,zA.x1,zA.bot,ax+aw/2,py,"rgba(58,127,181,.10)","rgba(58,127,181,.55)");
  envZTail(g,zB.x0,zB.x1,zB.bot,bx2+aw/2,py,"rgba(201,138,52,.09)","rgba(201,138,52,.55)");
  envZProc(g,ax,py,aw,ph,"서버 프로세스","ServerCores = 0-5","#9ad4ff","#101b2a","#3a7fb5");
  envZProc(g,bx2,py,aw,ph,"부하 클라 프로세스","ClientCores = 6-9","#ffcf8a","#1e1608","#c98a34");
  /* 프로토콜 왕복 — 이름표와 화살표 둘을 한 덩어리로 보고 상자 세로 한가운데에 맞춘다 */
  tx(g,440,196,"loopback 127.0.0.1",8,"#8496b3","700","middle","var(--mono)");
  htFlow(g,ax+aw+16,bx2-16,210,"#6cc7ff",1);
  htFlow(g,ax+aw+16,bx2-16,226,"#ffb648",0);
  tx(g,24,258,"열 하나가 물리코어 · 그 열의 위아래 두 칸이 논리코어 (물리 10 · 논리 20)",8,"#5d6c85","600");
  tx(g,856,258,"설정은 물리코어 번호로 적고, 형제 논리코어까지 서버가 함께 잡는다",8,"#5d6c85","600","end");
}
var ENV_VAR={1:envRough};



/* ═══ 제로베이스 시안 ═══ 왼쪽 칩 · 오른쪽 도식으로 갈라 놓던 것을 한 그림으로 합친다.
   판이 할 말은 셋뿐이다: 코어 열 개를 6:4 로 갈랐다 · 그 둘이 loopback 으로 붙는다 ·
   그래서 서로 코어를 뺏지 않는다. 나누는 세로선을 없애면 그 셋이 한 그림에서 끝난다.
   z1 칩 한 장(가른 자리에 골) · z2 칩 둘을 한 PC 가 감쌈 · z3 z1 을 아이소로 */
var ENV_ZERO=0;
window.__envZero=function(k){ ENV_ZERO=(k|0); drawLoad("env"); };
/* 칸 하나 — 색은 어느 무리인지, 번호는 실제 코어 번호다 */
function zCore(g,x,y,w,h,i){
  var srv=(i<6);
  bx(g,x,y,w,h,srv?"#1f4f74":"#6b4718",srv?"#3a7fb5":"#c98a34",6);
  tx(g,x+w/2,y+h/2+7,String(i),20,"#eaf3ff","800","middle","var(--mono)");
}
/* 가른 자리를 지나는 왕복 화살표 둘 — 위가 보내는 길, 아래가 돌아오는 길 */
function zLoop(g,x0,x1,yUp,yDn){
  [[yUp,"#6cc7ff",1],[yDn,"#ffb648",0]].forEach(function(L){
    var y=L[0], f=L[1];
    g.appendChild(el("path",{d:"M "+(x0+7)+" "+y+" L "+(x1-7)+" "+y,stroke:f,"stroke-width":"1.6",
      fill:"none","stroke-dasharray":"5 4",opacity:".85"}));
    var tip=L[2]?x1:x0, back=L[2]?x1-9:x0+9;
    g.appendChild(el("polygon",{points:tip+","+y+" "+back+","+(y-5)+" "+back+","+(y+5),fill:f}));
  });
}
/* z1 — 칩 한 장. 가른 자리를 골로 벌리고 그 골에서 둘이 오간다 */
function zeroChip(g){
  var X=24, Y=70, W=832, H=168, GAP=64;
  bx(g,X,Y,W,H,"#131b28","#2a3550",14);
  var dx=X+16, dy=Y+26, dw=W-32, dh=H-42;
  bx(g,dx,dy,dw,dh,"#0a1120","#233047",9);
  var ix=dx+14, iy=dy+14, iw=dw-28, ih=dh-28, G=10;
  var cw=(iw-G*3-GAP)/5, ch=(ih-G)/2;
  var gx=ix+3*(cw+G)-G;                       /* 골의 왼쪽 끝 */
  for(var i=0;i<10;i++){
    var c=Math.floor(i/2), r=i%2;
    var x=ix+c*(cw+G)+(c>=3?GAP-G:0), y=iy+r*(ch+G);
    zCore(g,x,y,cw,ch,i);
  }
  tx(g,X+W-14,Y+18,"i9-10900",8,"#4a5a78","700","end","var(--mono)");
  tx(g,gx+GAP/2,Y+18,"loopback 127.0.0.1",8,"#8496b3","700","middle","var(--mono)");
  zLoop(g,gx+6,gx+GAP-6,iy+ch*0.5,iy+ch+G+ch*0.5);
  tx(g,ix,Y-16,"서버 프로세스",9.5,"#9ad4ff","800");
  tx(g,ix+iw,Y-16,"부하 클라 프로세스",9.5,"#ffcf8a","800","end");
}
/* z2 — 칩 둘을 한 PC 가 감싼다. 프로세스마다 제 칩을 쥔 모양이라 '갈랐다' 가 더 세다 */
function zeroTwo(g){
  var X=24, Y=64, W=832, H=176;
  bx(g,X,Y,W,H,"none","#2a3550",14);
  tx(g,X+W-16,Y+20,"서버 PC 한 대 · loopback 127.0.0.1",8,"#4a5a78","700","end","var(--mono)");
  [[X+20,3,0,"서버 프로세스","#9ad4ff"],[X+W-20-306,2,6,"부하 클라 프로세스","#ffcf8a"]].forEach(function(P){
    var w=(P[1]===3)?430:306, x=P[0], y=Y+40, h=112;
    bx(g,x,y,w,h,"#131b28","#2a3550",12);
    var dx=x+12, dy=y+12, dw=w-24, dh=h-24;
    bx(g,dx,dy,dw,dh,"#0a1120","#233047",8);
    var G=9, cw=(dw-20-G*(P[1]-1))/P[1], ch=(dh-20-G)/2;
    for(var c=0;c<P[1];c++) for(var r=0;r<2;r++)
      zCore(g,dx+10+c*(cw+G),dy+10+r*(ch+G),cw,ch,P[2]+c*2+r);
    tx(g,x,y-10,P[3],9.5,P[4],"800");
  });
  zLoop(g,X+458,X+526,Y+80,Y+128);
}
/* z3 — z1 을 아이소로 눕힌 것. 세계는 2-2 와 같아지지만 액자가 납작해 배율이 0.55 까지 눌린다 */
function zeroIso(g){
  var S=window.SafeScene; if(!S) return;
  var I=S.iso, PAL=S.PAL, ZP=S.ZPAL, s=0.55;
  var gg=I.el("g",{transform:"translate("+(120-s*361.4).toFixed(1)+","+(50-s*215.4).toFixed(1)+") scale("+s+")"});
  g.appendChild(gg);
  I.iprism(gg,0,0,520,300,-10,10,[ZP.net.top,ZP.net.side,ZP.net.side]);
  I.iprism(gg,30,30,460,240,0,6,["#0a1120","#070c16","#080e19"]);
  var GAP=54, G=12, cw=(400-G*3-GAP)/5, cd=(180-G)/2, box=[];
  for(var i=0;i<10;i++){
    var c=Math.floor(i/2), r=i%2;
    box.push({u:60+c*(cw+G)+(c>=3?GAP-G:0), v:60+r*(cd+G), n:i});
  }
  box.sort(function(a,b){ return I.idepth(a.u,a.v)-I.idepth(b.u,b.v); });
  box.forEach(function(q){
    I.iprism(gg,q.u,q.v,cw,cd,6,14,(q.n<6)?PAL.net:PAL.dum,true);
    isoLay(I,gg,q.u+cw/2,q.v+cd/2,20,String(q.n),30,"#eaf3ff");
  });
  var gu=60+3*(cw+G)-G;
  [[cd*0.5+60,"#16243a","#6cc7ff"],[60+cd+G+cd*0.5,"#2a2412","#ffb648"]].forEach(function(L){
    I.iprism(gg,gu+4,L[0]-6,GAP-8,12,6,3,["#0d1422","#0a0f1a","#0a0f1a"]);
    for(var k=2;k>=0;k--) I.iprism(gg,gu+8+k*14,L[0]-4,8,8,9,4,[L[2],L[1],L[1]]);
  });
  isoLay(I,gg,420,285,0,"i9-10900",26,ZP.net.edge,"var(--sans)",.34);
  tx(g,120,44,"서버 프로세스",9.5,"#9ad4ff","800");
  tx(g,856,44,"부하 클라 프로세스",9.5,"#ffcf8a","800","end");
  tx(g,856,236,"loopback 127.0.0.1",8,"#8496b3","700","end","var(--mono)");
}
function zeroScene(g){
  if(ENV_ZERO===2) zeroTwo(g); else if(ENV_ZERO===3) zeroIso(g); else zeroChip(g);
}

/* ── 시안 iso ── 2-2 의 세계(아이소 3D)를 그대로 따온 것.
   투영·색·레일 치수는 safe-scene.js 가 window.SafeScene.iso 로 내주는 것을 그대로 쓴다 —
   숫자를 베껴 오면 2-2 를 고칠 때 여기만 어긋난다.
   판 하나가 서버 PC 한 대이고, 그 위에 프로세스 둘이 덩어리로 선다. 덩어리 폭이 6:4 이고
   그 위에 얹힌 코어 큐브가 여섯·넷이다. 둘 사이 왕복 통로가 loopback 이다. */
/* 누운 글씨 — 2-2 의 판 위 STEP 글씨와 같은 수법(ifloor)이다.
   아이소 평면에 붙어 눕기 때문에 기울어져도 읽힌다. */
function isoLay(I,gg,u,v,z,t,size,col,fam,op){
  var w=I.el("g",{transform:I.ifloor(u,v,z)});
  w.appendChild(I.el("text",{x:"0",y:(size*0.36).toFixed(1),"text-anchor":"middle",
    "font-size":String(size),"font-weight":"800","font-family":fam||"var(--mono)",
    fill:col,opacity:op==null?"1":String(op)},t));
  gg.appendChild(w);
}

/* ── 칩 한 장 ── 소켓에 앉는 모양이다. 왼쪽 위 모서리를 자르고 위아래 변에 정렬 홈을 판다 —
   실물 LGA 의 방향 표시라, 테두리 하나만으로 '이건 CPU' 가 선다.
   ── 크기 ──
   한때 380×176 이었는데 "크고 밋밋" 해서 320×150 으로 줄이고 안을 채웠다.
   ── 고르면서 버린 시안 둘 ──
   ⓐ 두 행 사이에 L3 캐시 띠를 눕힌 것, ⓒ 코어를 감싸는 링 버스 고리를 두른 것. 둘 다 그림은
   촘촘해졌지만 이 판이 말하는 한 문장('한 PC 의 코어 열 개를 6:4 로 갈랐다')에 안 쓰이는
   사실이라, 보는 눈이 '이건 왜 있지' 에서 한 번 멈춘다. 모서리 컷과 정렬 홈은 정보가 아니라
   형태여서 그 멈춤이 없다.
   ── 스레드 막대 둘도 뺐다 ──
   ⓐ 에서 이것만 가져와 칸마다 세워 뒀었다(머리줄의 '20스레드' 를 그림이 받게). 그런데 칸 하나에
   번호와 막대가 나란히 서니 칸이 빽빽해지고, 정작 이 판의 주인공인 코어 번호가 작아졌다.
   막대를 하나로 줄이는 길도 있었지만 그러면 '스레드 둘' 이라는 뜻이 사라져 그냥 장식이 된다.
   빼고 번호를 키웠다 — 칸 안에 하나만 있으면 그게 무엇인지 묻지 않아도 된다. */
function envChip(g){
  var X=24, Y=54, W=320, H=150, CUT=15, N=9;
  var p=[[X+CUT,Y],[X+96,Y],[X+101,Y+N],[X+119,Y+N],[X+124,Y],[X+196,Y],[X+201,Y+N],[X+219,Y+N],[X+224,Y],
         [X+W,Y],[X+W,Y+H],[X+224,Y+H],[X+219,Y+H-N],[X+201,Y+H-N],[X+196,Y+H],[X+124,Y+H],
         [X+119,Y+H-N],[X+101,Y+H-N],[X+96,Y+H],[X,Y+H],[X,Y+CUT]];
  g.appendChild(el("polygon",{points:p.map(function(q){return q[0]+","+q[1];}).join(" "),
    fill:"#131b28",stroke:"#2a3550","stroke-width":"1"}));
  /* 각인은 잘린 모서리 반대편이다 — 왼쪽 위에 두면 컷과 글자가 한자리에서 다툰다 */
  tx(g,X+W-13,Y+17,"i9-10900",8,"#4a5a78","700","end","var(--mono)");
  var dx=X+13, dy=Y+25, dw=W-26, dh=H-38;
  bx(g,dx,dy,dw,dh,"#0a1120","#233047",7);           /* 다이 — 패키지보다 한 단 어두워야 두 겹이 읽힌다 */
  var ix=dx+10, iy=dy+10, iw=dw-20, ih=dh-20, GAP=6;
  var cw=(iw-GAP*4)/5, ch=(ih-GAP)/2;
  for(var i=0;i<10;i++){
    var c=Math.floor(i/2), r=i%2, srv=(i<6);
    var x=ix+c*(cw+GAP), y=iy+r*(ch+GAP);
    bx(g,x,y,cw,ch,srv?"#1f4f74":"#6b4718",srv?"#3a7fb5":"#c98a34",5);
    tx(g,x+cw/2,y+ch/2+5,String(i),14,"#eaf3ff","800","middle","var(--mono)");
  }
  /* 서버 세 열과 클라 두 열 사이 — 칸 사이 틈 한가운데를 지난다 */
  var sx=ix+3*(cw+GAP)-GAP/2;
  g.appendChild(el("line",{x1:sx,y1:dy+6,x2:sx,y2:dy+dh-6,stroke:"#5b6f92","stroke-width":"1",
    "stroke-dasharray":"4 4"}));
}

/* ── 오른쪽 절반 ── 두 프로세스가 무엇으로 붙나. 2-2 의 세계(아이소 3D)로 그린다.
   투영·색·레일 치수는 safe-scene.js 가 window.SafeScene.iso 로 내주는 것을 그대로 쓴다 —
   숫자를 베껴 오면 2-2 를 고칠 때 여기만 어긋난다.
   자리: 월드 300×120 을 배율 0.846 으로 눌러 액자 오른쪽 절반(410..736)에 앉힌다.
   ── 여기까지 온 길 ──
   상자 둘에 화살표 하나이던 평면 도식을 여섯 벌 그려 봤지만(곧은 화살표 · U 자 · 테두리로 감싸기 ·
   커널 띠 · 커널 기둥), 어느 것도 "상자 둘과 선 하나" 를 못 벗어났다 — 그림이 아니라 표였다.
   왼쪽 칩은 평면 그대로 둔다. 한 판에 세계가 둘이지만, 칩은 코어 번호 열 개를 이고 있어야 해서
   눕히면 번호가 기울고, 이 절반은 반대로 형태가 있어야 살아난다. */
/* ── 톤 시안 ── p1·p2 는 왼쪽 칩과 같은 조형(패키지·칸·모노 번호)으로 오른쪽을 다시 짠 것.
   iso 는 지금 쓰는 2-2 세계. 정하면 진 쪽을 지운다. */
var ENV_TONE="iso";
window.__envTone=function(k){ ENV_TONE=k; drawLoad("env"); };
/* 프로세스 판 하나 — 왼쪽 칩과 같은 문법이다: 패키지 테두리 + 안쪽 다이 + 코어 칸 + 오른쪽 위 각인.
   cut 이면 칩처럼 모서리를 자르고 위아래에 정렬 홈을 판다. */
function procPanel(g,x,y,w,h,cols,base,name,pal,cut){
  if(cut){
    var N=7, m=Math.round(w*0.34), m2=Math.round(w*0.62);
    var p=[[x+13,y],[x+m,y],[x+m+5,y+N],[x+m+21,y+N],[x+m+26,y],[x+m2,y],[x+m2+5,y+N],[x+m2+21,y+N],
           [x+m2+26,y],[x+w,y],[x+w,y+h],[x+m2+26,y+h],[x+m2+21,y+h-N],[x+m2+5,y+h-N],[x+m2,y+h],
           [x+m+26,y+h],[x+m+21,y+h-N],[x+m+5,y+h-N],[x+m,y+h],[x,y+h],[x,y+13]];
    g.appendChild(el("polygon",{points:p.map(function(q){return q[0]+","+q[1];}).join(" "),
      fill:"#131b28",stroke:"#2a3550","stroke-width":"1"}));
  }else bx(g,x,y,w,h,"#131b28","#2a3550",12);
  tx(g,x+w-12,y+17,name,8,"#4a5a78","700","end");
  var dx=x+(cut?12:11), dy=y+25, dw=w-(cut?24:22), dh=h-(cut?38:36);
  bx(g,dx,dy,dw,dh,"#0a1120","#233047",7);
  var GX=9, ix=dx+9, iy=dy+9, iw=dw-18, ih=dh-18;
  var cw=(iw-GX*(cols-1))/cols, ch=(ih-GX)/2;
  for(var c=0;c<cols;c++) for(var r=0;r<2;r++){
    var cx=ix+c*(cw+GX), cy=iy+r*(ch+GX);
    bx(g,cx,cy,cw,ch,pal[0],pal[1],5);
    tx(g,cx+cw/2,cy+ch/2+5,String(base+c*2+r),14,"#eaf3ff","800","middle","var(--mono)");
  }
}
/* 왕복 레일 둘 — 위가 보내는 길, 아래가 돌아오는 길(2-2 와 같은 규칙).
   판 속으로 양 끝을 밀어 넣지 않고, 두 판 사이만 지나간다(평면이라 가릴 수가 없다) */
function procRail(g,x0,x1,y,col,dir){
  bx(g,x0,y,x1-x0,10,"#0d1422",null,5);
  var n=4, w=(x1-x0-14)/n;
  for(var k=0;k<n;k++) bx(g,x0+7+k*w,y+2.5,w*0.55,5,col,null,2.5);
}
function envToneFlat(g,cut){
  procPanel(g,412,74,184,124,3,0,"ServerCores = 0-5",["#1f4f74","#3a7fb5"],cut);
  procPanel(g,672,74,184,124,2,6,"ClientCores = 6-9",["#6b4718","#c98a34"],cut);
  procRail(g,600,668,112,"#6cc7ff");
  procRail(g,600,668,150,"#ffb648");
  tx(g,634,196,"loopback 127.0.0.1",8,"#8496b3","700","middle","var(--mono)");
  tx(g,412,60,"서버 프로세스",9.5,"#9ad4ff","800");
  tx(g,856,60,"부하 클라 프로세스",9.5,"#ffcf8a","800","end");
}
function envLink(g){
  g.appendChild(el("line",{x1:396,y1:34,x2:396,y2:230,stroke:"#26324a","stroke-width":"1"}));
  if(ENV_TONE!=="iso"){ envToneFlat(g,ENV_TONE==="p2"); return; }
  var S=window.SafeScene; if(!S) return;
  var I=S.iso, PAL=S.PAL, ZP=S.ZPAL;
  var gg=I.el("g",{transform:"translate(3.4,-243.1) scale(0.846)"});
  g.appendChild(gg);
  /* 판 — 이 한 대. 판이 곧 커널이라 주소를 여기 새긴다 */
  I.iprism(gg,0,0,300,120,-8,8,[ZP.net.top,ZP.net.side,ZP.net.side]);
  gg.appendChild(I.el("line",{x1:I.ipx(0,120),y1:I.ipy(0,120,0),x2:I.ipx(300,120),y2:I.ipy(300,120,0),
    stroke:ZP.net.edge,"stroke-width":"1.4",opacity:".42"}));
  /* 왕복 통로 — 먼 쪽이 보내는 길, 가까운 쪽이 돌아오는 길(2-2 와 같은 규칙).
     ── 덩어리보다 먼저 그린다 ──
     나중에 그리면 통로가 덩어리 위에 얹혀 '사이에 놓인 막대' 로 보인다. 먼저 그리고 양 끝을
     덩어리 속(u 95..210)까지 밀어 넣으면, 덩어리가 그 끝을 덮어 관이 안으로 들어가 보인다. */
  [[66,"#16243a","#6cc7ff"],[40,"#2a2412","#ffb648"]].forEach(function(L){
    I.iprism(gg,95,L[0],115,10,0,3,["#0d1422","#0a0f1a","#0a0f1a"]);
    for(var k=3;k>=0;k--) I.iprism(gg,120+k*18,L[0]+2,10,6,3,4,[L[2],L[1],L[1]]);
  });
  /* 덩어리 둘 — 낮은 받침이고, 그 위에 자기 코어가 솟는다.
     ── 덩어리를 낮춘 까닭 ──
     처음에는 높이 30 짜리 덩어리 위에 납작한 코어(7)를 얹었는데, 큰 상자가 주인공이 되고
     정작 세어야 할 코어가 그 위 무늬로 보였다. 덩어리를 16 으로 낮추고 코어를 20 으로 세우니
     '이 프로세스가 쥔 코어 여섯 · 넷' 이 먼저 읽힌다.
     그릴 때는 뒤(u 큰 쪽 = 화면 위)부터다 — 순서를 바꾸면 뒤 덩어리가 앞을 덮는다. */
  I.iprism(gg,190,20,100,80,0,16,PAL.dum,true);
  I.iprism(gg,15,20,100,80,0,16,PAL.net,true);
  /* 판에 누운 각인 — 자리는 덩어리 앞(v 6 · 화면에서 아래)이다.
     뒤(v 108)에 뒀더니 덩어리가 덮어 '127' 만 남았고, 크기 20 은 판 밖으로 삐져나갔다(렌더로 확인) */
  isoLay(I,gg,100,6,0,"loopback 127.0.0.1",12,ZP.net.edge,"var(--mono)",.42);
  coreTop(gg,I,PAL);
  /* 이름표는 각자 덩어리 쪽으로 갈라 둔다 — 서버는 왼쪽 위, 클라는 오른쪽 위.
     한때 둘 다 오른쪽에 세로로 세웠더니 그림에서 떨어져 붕 떴다. */
  tx(g,412,100,"서버 프로세스",9.5,"#9ad4ff","800");
  tx(g,412,120,"ServerCores = 0-5",8,"#8a9ab5","600",null,"var(--mono)");
  tx(g,856,76,"부하 클라 프로세스",9.5,"#ffcf8a","800","end");
  tx(g,856,96,"ClientCores = 6-9",8,"#8a9ab5","600","end","var(--mono)");
}
/* 덩어리 윗면에 솟는 코어 — 서버 3열 · 클라 2열, 각 2행. 번호는 왼쪽 칩과 같은 값이다 */
function coreTop(gg,I,PAL){
  [[15,3,PAL.net,0],[190,2,PAL.dum,6]].forEach(function(B){
    var pad=8, iw=100-pad*2, cw=(iw-5*(B[1]-1))/B[1], cd=(64-5)/2, box=[];
    for(var r=1;r>=0;r--) for(var c=0;c<B[1];c++)
      box.push({u:B[0]+pad+c*(cw+5), v:28+r*(cd+5), n:B[2+1]+c*2+r});
    /* ── 깊이 순으로 그린다 ──
       화면 뒤일수록 idepth 가 작다(u·v 가 클수록 위로 간다). 열을 u 오름차순으로 그렸더니
       뒤 열이 나중에 그려져 앞 열 위를 덮었다 — 코어를 높이 세우자 바로 드러났다. */
    box.sort(function(a,b){ return I.idepth(a.u,a.v)-I.idepth(b.u,b.v); });
    box.forEach(function(q){
      I.iprism(gg,q.u,q.v,cw,cd,16,20,B[2],true);
      isoLay(I,gg,q.u+cw/2,q.v+cd/2,36,String(q.n),19,"#eaf3ff");
    });
  });
}
/* ── 5 회선 한계 ── 네 번 옮겨 끝내 걷어낸 이력. 가로 한 줄이라 '›' 가 순서를 뜻한다 */
function loadLine(g){
  LOAD_HOP.forEach(function(hp,j){
    var hx=24+j*209, live=(j===3);
    bx(g,hx,40,196,110,live?"#111f31":"#0f1522",live?"#2c5f85":"#1e2739",10);
    tx(g,hx+18,74,hp[0]+"  "+hp[1],9.5,live?"#eef2fb":"#6f7f99","700");
    tx(g,hx+18,116,hp[2],15,live?"#6cc7ff":"#8496b3","800",null,"var(--mono)");
    tx(g,hx+178,116,hp[3],8,live?"#57d694":"#5d6c85","700","end");
    if(j<3) tx(g,hx+202,100,"›",12,"#3c4a63","800","middle");
  });
  /* v4 의 값이 '—' 인 까닭을 바로 아래에서 받는다 — 대역폭이 0 이 아니라 회선 자체가 없다 */
  tx(g,24,190,"v4 는 랜선도 공유기도 안 탄다 — 회선이라는 게 아예 없다.",9,"#8496b3","700");
  tx(g,24,214,"동접 1,500에서 무너졌을 때 틱은 예산 안이었다 — 서버가 한가한데 왕복만 1초였다.",8.5,"#5d6c85","600");
}

/* ── 2 맵과 클라이언트 시야 ── 격자는 왼쪽, 밀도를 말하는 큰 값 둘은 오른쪽 */
function loadMap(g){
  var MX=24, MY=20, MS=32;                         /* 6×6 → 192px */
  bx(g,MX,MY,MS*6,MS*6,"#0f1522","#233047",4);
  for(var q=1;q<6;q++){
    g.appendChild(el("line",{x1:MX+q*MS,y1:MY,x2:MX+q*MS,y2:MY+MS*6,stroke:"#1c2942","stroke-width":"1"}));
    g.appendChild(el("line",{x1:MX,y1:MY+q*MS,x2:MX+MS*6,y2:MY+q*MS,stroke:"#1c2942","stroke-width":"1"}));
  }
  g.appendChild(el("rect",{x:MX+2*MS,y:MY+2*MS,width:MS*3,height:MS*3,fill:"rgba(108,199,255,.07)",
    stroke:"#6cc7ff","stroke-width":"1.3","stroke-dasharray":"6 5"}));
  /* 봇 점 — 결정적 배치(프레임마다 흔들리면 안 된다) */
  var seed=7;
  function rr(){ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; }
  for(var k=0;k<150;k++){
    var px=MX+5+rr()*(MS*6-10), py=MY+5+rr()*(MS*6-10);
    var iv=(px>MX+2*MS&&px<MX+5*MS&&py>MY+2*MS&&py<MY+5*MS);
    g.appendChild(el("circle",{cx:px.toFixed(1),cy:py.toFixed(1),r:iv?2.5:1.9,
      fill:iv?"#6cc7ff":"#33507a",opacity:iv?".95":".55"}));
  }
  g.appendChild(el("circle",{cx:MX+3.5*MS,cy:MY+3.5*MS,r:5,fill:"#ffb648",
    stroke:"#0d1220","stroke-width":"1.3"}));
  tx(g,24,232,"점선 안 = 내 시야 3×3 · 밖은 보내지도 받지도 않는다",9,"#6cc7ff","700");
  /* 격자를 줄이자 격자 끝(216)과 계기 칸 시작(356) 사이가 140 이나 벌어져, 두 덩어리가
     한 판에 얹힌 게 아니라 따로 뜬 것처럼 보였다. 1 · 3 번 판이 쓰는 세로선으로 끊는다. */
  g.appendChild(el("line",{x1:286,y1:26,x2:286,y2:238,stroke:"#26324a","stroke-width":"1"}));
  tx(g,356,32,"맵 120×120 · 섹터 20 → 6×6 = 36칸",9.5,"#8496b3","700");
  /* 큰 값 둘은 ④ 판정 칸과 같은 계기 문법이다: 라벨 → 큰 값 → 각주.
     한때 각주가 상자 밖에 떠 있어(922 아래) 둘 중 하나만 꼬리를 단 것으로 보였다. */
  [[356,"시야가 맵의","25%","#6cc7ff","36칸 중 9칸이 내 시야"],
   [616,"한 사람이 받는 팬아웃","922","#ffb648","동접 5,000 기준 실측"]].forEach(function(t){
    bx(g,t[0],42,240,98,"#0f1522","#1e2739",10);
    tx(g,t[0]+18,68,t[1],9,"#8496b3","700");
    tx(g,t[0]+18,106,t[2],15,t[3],"800",null,"var(--mono)");
    tx(g,t[0]+18,128,t[4],8,"#5d6c85","600");
  });
  /* 계기 칸 바로 아래에 붙인다. 한때 왼쪽 격자 캡션과 같은 y 에 뒀는데, 글자가 커지자
     둘이 한 줄에 나란히 서서 '…받지도 않는다 높아야 적은 동접으로…' 로 이어 읽혔다.
     ── 문구를 '시야가 넓다' 에서 '맵에 몰아넣었다' 로 고쳤다 ──
     시야 범위(9섹터 = 60×60)는 밀도를 노려 넓힌 값이 아니라 콘솔 클라 화면(80×21)을 덮으려고
     정한 값이다(SectorManager.h 설계 주석). 25% 라는 비율은 맵이 120×120 이라서 나온다.
     즉 밀도를 만든 것은 시야가 아니라 '그 맵에 5,000 을 넣은 것' 이다. */
  tx(g,356,172,"동접 5,000을 맵 120×120 안에 몰아넣은 것은 의도 —",9,"#8496b3","700");
  tx(g,356,192,"밀도가 높아야 적은 동접으로 서버 병목이 빨리 드러남.",9,"#5d6c85","600");
}

/* 도넛 한 조각 — 12시에서 시계 방향, 각도는 백분율로 준다(0~100).
   큰 호 플래그를 절반 기준으로 켜는 것 말고는 평범한 부채꼴이다: 바깥을 시계 방향으로 긋고,
   안쪽 반지름으로 되돌아와 닫는다. */
function ringSeg(p,cx,cy,r0,r1,p0,p1,fill){
  var TAU=Math.PI*2, f=function(v){ return Math.round(v*10)/10; };
  var a0=p0/100*TAU-Math.PI/2, a1=p1/100*TAU-Math.PI/2, lg=(p1-p0)>50?1:0;
  p.appendChild(el("path",{fill:fill,d:
    "M "+f(cx+r1*Math.cos(a0))+" "+f(cy+r1*Math.sin(a0))+
    " A "+r1+" "+r1+" 0 "+lg+" 1 "+f(cx+r1*Math.cos(a1))+" "+f(cy+r1*Math.sin(a1))+
    " L "+f(cx+r0*Math.cos(a1))+" "+f(cy+r0*Math.sin(a1))+
    " A "+r0+" "+r0+" 0 "+lg+" 0 "+f(cx+r0*Math.cos(a0))+" "+f(cy+r0*Math.sin(a0))+" Z"}));
}

/* ── 3 더미 부하 컨텐츠 ── 왼쪽은 누가 몇을 드는가, 오른쪽은 그 하나가 매 틱 뭘 하는가 */
function loadBot(g){
  tx(g,24,22,"5,000명을 다섯 스레드가 나눠 든다",10.5,"#c3cfe0","800");
  for(var t=0;t<5;t++){
    var ty=42+t*29;
    bx(g,24,ty,25,19,"#3a2c14","rgba(255,182,72,.45)",4);
    tx(g,36.5,ty+13.5,"#"+t,9,"#ffcf8a","800","middle","var(--mono)");
    for(var w=0;w<10;w++) bx(g,56+w*13.5,ty+5,10,8,"#1f4f74",null,3);
    tx(g,206,ty+13.5,"1,000명",9,"#8496b3","700",null,"var(--mono)");
    tx(g,334,ty+13.5,"소켓 1,000",8,"#5d6c85","600","end","var(--mono)");
  }
  /* 한 줄로 붙인다 — 오른쪽 꼬리줄(하트비트)과 같은 높이에서 끝나야 판 아래가 고르다 */
  tx(g,24,212,"스레드를 늘리면 서버 코어를 뺏는다 — 담당 인원을 늘리는 쪽을 택했다.",8.5,"#5d6c85","600");
  /* 한 판 안에 이야기가 둘이라 세로선으로 끊는다 */
  g.appendChild(el("line",{x1:366,y1:30,x2:366,y2:228,stroke:"#26324a","stroke-width":"1"}));
  tx(g,390,22,"매 틱 주사위 하나 — 40ms 마다",10.5,"#c3cfe0","800");
  /* ── 띠 둘을 위아래로 쌓다가 도넛 둘을 나란히 세웠다 ──
     주사위는 '100 을 어떻게 가르는가' 라서 한 바퀴가 곧 한 번의 굴림이다. 띠는 그 100 을 가로로
     펴 놓은 것이라 오른쪽 끝이 무엇인지(=100 이라는 것)를 눈이 따로 재야 했다.
     가로로 나란히 두면 두 상태의 굴림이 같은 크기의 원 둘로 서서 바로 견줘진다.
     ── 이름은 구멍 안에, 값은 오른쪽 범례에 ──
     호 위에 글자를 얹으면 띠 두께(22)보다 글자가 길어 안쪽·바깥으로 삐져나온다. 구멍은 어차피
     비는 자리라 거기에 상태 이름을 넣고, 조각 이름과 값은 오른쪽에 세로로 세웠다.
     ── '끝 5% = 존 이동' 은 걷어냈다 ──
     '끝' 은 띠의 오른쪽 끝을 가리키던 말이라 원에는 가리킬 끝이 없다. 범례가 그 조각을
     '존 이동 5' 로 직접 부르므로 같은 말이 두 번이 되기도 한다. */
  var DR=58, DIN=40, GAP=0.6;                      /* 바깥·안쪽 반지름 · 조각 사이 틈(백분율) */
  function donut(cx,lx,lw,name,segs){
    var at=0;
    segs.forEach(function(sg){
      ringSeg(g,cx,122,DIN,DR,at+GAP/2,at+sg[0]-GAP/2,sg[1]); at+=sg[0];
    });
    /* 구멍 안 이름 — 원 한가운데라 가운데 정렬이고, 글자 중심을 맞추려 baseline 을 조금 내린다 */
    tx(g,cx,126,name,9,"#c3cfe0","800","middle");
    /* 범례 — 색칩 · 이름(왼쪽) · 값(오른쪽 끝). 줄 높이 28 로 가운데(122)에 맞춰 쌓는다 */
    var y0=122-(segs.length-1)*14;
    segs.forEach(function(sg,i){
      var y=y0+i*28;
      bx(g,lx,y-9,9,9,sg[1],null,2);
      tx(g,lx+15,y,sg[2],9,"#8496b3","700");
      tx(g,lx+lw,y,String(sg[0]),9.5,"#c3cfe0","800","end","var(--mono)");
    });
  }
  /* 초록은 여기서 뺐다 — 초록은 4 번 판의 '합격' 색이다. 같은 이유로 '정지' 의 빨강도 걷었다.
     ── 파랑은 둘 다 '이동' 이다 ──
     띠였을 때 '계속 이동 80' 은 어두운 남색(#2b3a52)이었다. 띠 안에서는 그것도 채워진 칸이라
     읽혔는데, 고리로 세우니 판 바탕과 붙어 '안 채워진 자리(트랙)' 로 보였다 — 80 이 도리어
     비어 보이고 20 만 값처럼 서는 뒤집힘이다(렌더로 확인). 두 원이 같은 파랑을 '이동' 에 쓰면
     색 하나만 익히면 둘 다 읽힌다. 범례 칸(lw)은 둘이 같아야 이름과 값 사이가 안 벌어진다. */
  donut(448,520,84,"서 있을 때",
    [[75,"#6cc7ff","이동"],[20,"#ffb648","채팅"],[5,"#4e6f9c","존 이동"]]);
  donut(700,772,84,"걷고 있을 때",
    [[20,"#5b7194","정지"],[80,"#6cc7ff","계속 이동"]]);
  /* '확률이 따로 도는 게 아니라…' 는 여기 있었는데 판 설명과 글자까지 같아 걷어냈다 */
  tx(g,390,212,"하트비트는 20초 고정이고 서버 타임아웃은 60초다.",8.5,"#5d6c85","600");
}

/* ── 4 더미부터 검증 ── 더미가 병목이 아니라는 근거, 판정 넉 줄 */
function loadThr(g){
  /* ── 2×2 계기 격자에서 넉 줄로 ──
     칸 넷이 200px 짜리 상자로 서 있으면 넷의 무게가 같아 '그래서 결론이 뭔가' 가 안 정해진다.
     게다가 상자마다 세 줄(이름·값·근거)뿐이라 안이 비어 큰 빈 상자로 보였다.
     줄로 눕히면 왼쪽 판정 표시 → 이름 → 값이 한 세로선 위에 모여 넷을 위에서 아래로 훑게 된다.
     ※ 한때 이 자리가 가로 넉 줄(832×64)이었다가 2×2 로 갔던 적이 있다. 그때 문제는 이름이
       왼쪽 끝 · 값이 오른쪽 끝이라 한 줄 읽을 때마다 눈이 판을 가로지른 것인데, 지금은 값을
       이름 바로 아래에 붙여 그 왕복이 없다. 오른쪽 끝으로 보내는 것은 잔글씨(근거) 하나뿐이다. */
  LOAD_GUARD.forEach(function(gd,j){
    var y=18+j*56;
    /* 줄을 상자로 감싸지 않는다 — 상자 넷은 방금 걷어낸 것이고, 경계는 가는 선 하나면 된다 */
    if(j) g.appendChild(el("line",{x1:24,y1:y-7,x2:856,y2:y-7,stroke:"#1c2942","stroke-width":"1"}));
    chk(g,40,y+25);
    /* 이름과 근거는 같은 층(작은 글씨)이라 같은 줄에 선다 — 근거만 오른쪽 끝 */
    tx(g,66,y+18,gd[0],9,"#8496b3","700");
    tx(g,856,y+18,gd[2],8,"#5d6c85","600","end");
    /* 숫자로 시작하는 값만 mono 다. 한글을 mono 에 넣으면 글꼴이 폴백돼 자간이 벌어지고
       크기도 딴 글자가 된다(이 파일 .cl-tile .u 와 .cr-hd span 에 같은 함정이 적혀 있다). */
    var num=/^[0-9]/.test(gd[1]);
    tx(g,66,y+42,gd[1],num?13.5:10.5,num?"#57d694":"#c3cfe0","800",null,num?"var(--mono)":"var(--sans)");
  });
}

var LOAD_DRAW={env:loadEnv, map:loadMap, bot:loadBot, thr:loadThr, line:loadLine};
function drawLoad(key){
  var s=document.getElementById("sc-load");
  while(s.firstChild) s.removeChild(s.firstChild);
  s.setAttribute("viewBox","0 0 880 262");     /* 시안이 액자를 늘려 놨을 수 있다(envVB) */
  var g=el("g",{}); s.appendChild(g);
  var it=LOAD.items[key];
  LOAD_DRAW[key](g);
  s.setAttribute("aria-label", it.t+" — "+it.d);
}

/* 목차 줄 — 누르면 오른쪽 판이 통째로 바뀐다. 칩 줄(.cl-chips)과 설명 줄(.cr-note)은
   이 목차가 둘 다 대신하므로 2-3 에서는 없앴다.
   줄 하나는 [번호 맨숫자][이름] 한 줄이고, 고르면 왼쪽에 세로 띠가 선다. 번호에 동그라미를
   씌우지 않는 것은 이 사이트가 이미 내린 판단이다(common.css: "도형이 하나 더 늘어난다"). */
function wireLoadIndex(){
  var ix=document.getElementById("ix-load"), bd=document.getElementById("bd-load");
  var hb=bd.querySelector(".cr-hd b"), bp=bd.querySelector(".cl-bd");
  /* first 일 때는 바꿈 애니를 안 건다 — 탭 진입 애니(.cl-in)와 겹쳐 두 번 움직인다 */
  function sel(k,first){
    var it=LOAD.items[k];
    hb.textContent=it.t; bp.textContent=it.d;
    drawLoad(k);
    [].forEach.call(ix.querySelectorAll("button"),function(b){
      var on=(b.getAttribute("data-it")===k);
      b.classList.toggle("act",on); b.setAttribute("aria-pressed",on?"true":"false"); });
    if(!first){
      /* 클래스를 뗐다 붙이는 것만으로는 다시 재생이 안 된다 — 사이에 리플로우를 강제한다
         (2-2 safePlay 와 같은 수법) */
      bd.classList.remove("cl-sw"); void bd.offsetWidth; bd.classList.add("cl-sw");
    }
  }
  LOAD_ORDER.forEach(function(k){
    var it=LOAD.items[k];
    var b=h("button",{type:"button","data-it":k,"aria-pressed":"false"});
    b.appendChild(h("i",{},it.no));
    b.appendChild(h("b",{},it.t));
    b.addEventListener("click",function(){ sel(k); });
    ix.appendChild(b);
  });
  sel(LOAD_ORDER[0],1);
}
/* 탭에 들어올 때마다 목차 넷이 차례로 서고 판이 뒤따라 열린다(tabs.js 가 부른다).
   2-2 와 같은 수법 — 클래스를 떼고 리플로우를 한 번 강제한 뒤 다시 붙인다. */
window.__loadPlay=function(){
  var p=document.getElementById("p-cload"); if(!p) return;
  /* 바꿈 애니가 남아 있으면 진입 애니와 겹친다 — 들어올 때는 늘 진입 하나만 돈다 */
  var bd=document.getElementById("bd-load"); if(bd) bd.classList.remove("cl-sw");
  p.classList.remove("cl-in"); void p.offsetWidth; p.classList.add("cl-in");
};

/* ═══════════ 공통: 계기판·카드·칩 ═══════════ */
function paintDash(id,rows){
  var d=document.getElementById(id); d.innerHTML="";
  rows.forEach(function(r){
    var t=h("div",{class:"cl-tile"+(r[4]?" ok":"")});
    t.appendChild(h("div",{class:"l"},r[0]));
    var v=h("div",{class:"v"}); v.appendChild(h("span",{class:"n"},r[1]));
    if(r[2]) v.appendChild(h("span",{class:"u"},r[2]));
    t.appendChild(v); t.appendChild(h("div",{class:"f"},r[3]));
    d.appendChild(t);
  });
}

/* 옆 카드를 안 쓰는 탭의 배선 — 고른 것이 그림에서 켜지고, 설명은 아래 한 줄로만 나온다.
   카드(표 + 긴 글)를 없앤 자리를 그림이 가져갔으므로 여기서 할 일은 강조와 한 줄 교체뿐이다.
   노션으로 보내는 문은 여기서 안 만든다 — 셋이 같은 페이지로 가던 것을 소탭 줄 오른쪽 끝
   한 짝으로 합쳤다(mmo.src.html 의 .subdoor).
   ※ 지금 이 함수를 쓰는 곳은 2-2 하나다. 2-3 은 목차형으로 바뀌면서 wireLoadIndex 로 갈라졌다. */
function wireWide(scId,chId,noteId,DATA,order){
  var ch=document.getElementById(chId), note=document.getElementById(noteId);
  function sel(k,i){
    note.innerHTML="";
    var em=h("i",{},"보기 "+(i+1)), p=h("p",{});
    /* 줄을 배열로 준 항목은 그 줄 그대로 찍는다 — .cr-note 가 가로 flex 라 <p> 를 여럿 두면
       옆으로 늘어선다. 그래서 한 <p> 안에서 <br> 로 잇는다. */
    var nn=DATA.items[k].n, ln=(typeof nn==="string")?[nn]:nn;
    ln.forEach(function(s,j){ if(j) p.appendChild(document.createElement("br"));
      p.appendChild(document.createTextNode(s)); });
    note.appendChild(em); note.appendChild(p);
    [].forEach.call(document.querySelectorAll("#"+scId+" .cl-hit"),function(gg){
      gg.classList.toggle("on", gg.getAttribute("data-it")===k); });
    [].forEach.call(ch.querySelectorAll("button"),function(b){
      b.classList.toggle("act", b.getAttribute("data-it")===k); });
  }
  order.forEach(function(k,i){
    var b=h("button",{"data-it":k}); b.appendChild(h("i",{},String(i+1)));
    b.appendChild(document.createTextNode(DATA.items[k].t));
    b.addEventListener("click",function(){ sel(k,i); });
    ch.appendChild(b);
  });
  [].forEach.call(document.querySelectorAll("#"+scId+" .cl-hit"),function(gg){
    gg.addEventListener("click",function(){
      var k=gg.getAttribute("data-it"); sel(k,order.indexOf(k)); }); });
  sel(order[0],0);
}

/* 기동 */
drawSafe(); paintDash("d-safe",SAFE.dash);
safePicker();
/* tabs.js 는 이 조각보다 먼저 돌아서 첫 paint() 때는 __safePlay 가 아직 없다 —
   주소에 #csafe 를 달고 들어온 경우가 그렇다. 그때만 여기서 한 번 재생한다(이중 재생 없음). */
if(!document.getElementById("p-csafe").hidden) safePlay();
wireWide("sc-safe","ch-safe","nt-safe",SAFE,["gate","s1","s2","s3"]);
/* 2-3 은 wireWide 를 안 쓴다 — 그쪽은 '그림 하나 + 칩으로 강조 갈아끼우기' 인데,
   여기서는 고른 것에 따라 오른쪽 판을 통째로 다시 그린다. 첫 그림도 wireLoadIndex 가 그린다. */
wireLoadIndex();
/* tabs.js 가 이 조각보다 먼저 돌아서 첫 paint() 때는 __loadPlay 가 아직 없다 —
   주소에 #cload 를 달고 들어온 경우가 그렇다. 그때만 여기서 한 번 재생한다(2-2 와 같은 처리). */
if(!document.getElementById("p-cload").hidden) window.__loadPlay();

/* 하위 탭 전환은 tabs.js 하나만 맡는다 — 여기에 있던 옛 핸들러(data-p/.pane)는 지웠다.
   그 코드는 이미 죽어 있었고(data-p·.pane 둘 다 페이지에 없다) 살아 있던 한 줄은
   .subtab 전체의 act 를 갈아치웠다. paint() 보다 뒤에 돌아 클래스의 최종 결정권을 쥔 채
   aria-selected 는 안 건드리는 자리라, 하위 탭을 늘리면 조용히 어긋난다. */
})();
