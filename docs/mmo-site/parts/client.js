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
       늘릴 거면 넷을 같이 늘리고 overlay.more 의 y 도 같이 볼 것
     ※ 지금은 넷 다 두 줄이다(보기를 '합격 기준 → 단계 셋' 으로 다시 짜면서 줄까지 맞췄다).
       줄 수가 어긋나면 바로 밑의 노션 문(overlay.more, y 고정)과 글자가 겹친다 — 렌더로 확인했다.
       한 줄에서 두 줄로 늘리면서 safe-scene.js 의 chips·note y 를 16 씩 올렸다(more 는 그대로) */
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
    bot:{no:"3", t:"더미 5,000이 하는 일",
      d:"봇은 매틱 1~100 랜덤으로 행동 결정."},
    thr:{no:"4", t:"측정기가 병목이면 안 된다",
      d:"서버가 5,000에서 막힌 게 아니라 더미가 5,000을 못 만든 것일 수 있다. 그래서 더미는 자기가 밀리는지를 먼저 잰다."},
    /* 회선은 한때 ① 코어 배분 판의 오른쪽 절반이었다. 제목이 왼쪽 절반(코어)만 가리키는 데다
       loopback 이 그 판에 두 번 있었다 — 왼쪽 화살표 라벨과 오른쪽 v4 카드. 항목을 가르니
       제목과 내용이 각각 맞아떨어지고, '랜선도 공유기도 안 탄다' 도 제 자리(v4 옆)로 왔다. */
    line:{no:"5", t:"회선",
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

/* ── 1 코어 배분 ── 한 PC 의 코어 열 개를 서버 여섯 · 부하 클라 넷으로 가른다 */
function loadEnv(g){
  tx(g,24,18,"서버 PC 한 대 · i9-10900 · 10코어 20스레드",9.5,"#8496b3","700");
  /* ── 두 무리를 위아래로 갈라 놓는다 ──
     한때 서버 0~5 와 클라 6~9 가 좌우로 서고 그 틈을 가로 화살표가 지났다. 코어 열 개가 한 줄이라
     판을 가로로 다 먹었다. 위아래로 세우면 0 과 6 이 같은 열에 서서 '한 PC 의 코어를 둘로 갈랐다'
     가 그대로 읽힌다.
     ── 왼쪽 정렬이다 ──
     회선 이사(⑤)가 이 판에서 나가면서 오른쪽 절반이 통째로 비었다. 그래서 기둥을 판 한가운데
     세워 봤는데(x0 260), 판 제목·설명·환경 줄이 다 왼쪽 정렬이라 읽는 축이 둘로 갈렸다 —
     글은 왼쪽에서 시작하는데 그림만 가운데서 시작한다. 오른쪽이 비는 것보다 축이 갈리는 쪽이
     더 눈에 걸린다. 남는 오른쪽은 여백으로 둔다. */
  var bw=50, st=62, x0=24;                          /* 서버 24..384(6칸) · 클라 24..260(4칸) */
  for(var i=0;i<10;i++){
    var srv=(i<6), cx=x0+(srv?i:(i-6))*st, cy=srv?58:190;
    bx(g,cx,cy,bw,40,srv?"#1f4f74":"#6b4718",srv?"#3a7fb5":"#c98a34",7);
    tx(g,cx+bw/2,cy+26,String(i),11,"#eaf3ff","800","middle","var(--mono)");
  }
  tx(g,24,46,"서버 프로세스",9.5,"#9ad4ff","800");
  tx(g,24,114,"ServerCores = 0-5",8,"#5d6c85","600",null,"var(--mono)");
  tx(g,24,178,"부하 클라 프로세스",9.5,"#ffcf8a","800");
  tx(g,24,246,"ClientCores = 6-9",8,"#5d6c85","600",null,"var(--mono)");
  /* 두 줄 사이를 지나는 수직 양방향 화살표 — 촉의 색이 향하는 쪽 무리의 색이다.
     x 142 는 위아래 줄이 함께 덮는 구간(24..260)의 한가운데다. 서버 줄(24..384) 기준으로
     잡으면 촉이 클라 줄 밖으로 나가 무엇과 무엇을 잇는지가 흐려진다. */
  g.appendChild(el("path",{d:"M 142 134 L 142 154",stroke:"#6cc7ff","stroke-width":"1.3",
    fill:"none","stroke-dasharray":"4 4"}));
  g.appendChild(el("polygon",{points:"142,124 137,136 147,136",fill:"#6cc7ff"}));
  g.appendChild(el("polygon",{points:"142,164 137,152 147,152",fill:"#c98a34"}));
  /* '랜선도 공유기도 안 탄다' 는 ⑤ 회선 판으로 보냈다 — 그쪽 v4 옆이 제자리다 */
  tx(g,170,146,"loopback 127.0.0.1",8,"#8496b3","700",null,"var(--mono)");
}

/* ── 5 회선 ── 네 번 옮겨 끝내 걷어낸 이력. 가로 한 줄이라 '›' 가 순서를 뜻한다 */
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

/* ── 3 더미 5,000이 하는 일 ── 왼쪽은 누가 몇을 드는가, 오른쪽은 그 하나가 매 틱 뭘 하는가 */
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
  tx(g,856,22,"끝 5% = 존 이동",8,"#6f88ad","700","end");
  function bar(y,label,segs){
    tx(g,390,y-9,label,9,"#8496b3","700");
    var x=390, W=466;
    segs.forEach(function(sg){
      var w=W*sg[0]/100;
      g.appendChild(el("rect",{x:x,y:y,width:w,height:24,fill:sg[1],
        rx:(x===390||x+w>=390+W-1)?4:0}));
      if(w>44) tx(g,x+w/2,y+16,sg[3],9,sg[2]||"#0d1220","800","middle","var(--mono)");
      x+=w;
    });
  }
  /* 초록은 여기서 뺐다 — 초록은 4 번 판의 '합격' 색이다. 같은 이유로 '정지' 의 빨강도 걷었다 */
  bar(64,"서 있을 때",[[75,"#6cc7ff",null,"이동 75"],[20,"#ffb648",null,"채팅 20"],[5,"#4e6f9c",null,"5"]]);
  bar(140,"걷고 있을 때",[[20,"#5b7194",null,"정지 20"],[80,"#2b3a52","#c3cfe0","계속 이동 80"]]);
  /* '확률이 따로 도는 게 아니라…' 는 여기 있었는데 판 설명과 글자까지 같아 걷어냈다 */
  tx(g,390,212,"하트비트는 20초 고정이고 서버 타임아웃은 60초다.",8.5,"#5d6c85","600");
}

/* ── 4 측정기가 병목이면 안 된다 ── 판정 넉 줄 */
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
  var a=document.createElement("a");
  a.className="cr-more"; a.target="_blank"; a.rel="noopener"; a.href=NOTION_HUB;
  a.innerHTML="자세히 — 테스트 환경 · 컨텐츠 부하 검증 <em>노션 ↗</em>";
  document.getElementById("mo-load").appendChild(a);
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
   맨 끝에 노션으로 보내는 문을 하나 달아 둔다 — 자세한 것은 전부 그쪽에 있다.
   moreId 를 주면 그 문을 칩 줄이 아니라 따로 받은 자리에 단다. 2-2 가 그렇다 — 거기서는 칩
   상자가 좁아(406) 문이 둘째 줄로 밀려, 고르는 줄과 나가는 문이 한 덩어리로 보였다.
   ※ 지금 이 함수를 쓰는 곳은 2-2 하나다. 2-3 은 목차형으로 바뀌면서 wireLoadIndex 로 갈라졌다. */
var NOTION_HUB="https://feline-vacation-d6d.notion.site/36216a0b9f59801e9508dc51b4863f46";
function wireWide(scId,chId,noteId,DATA,order,linkLabel,moreId){
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
  var a=document.createElement("a");
  a.className="cr-more"; a.target="_blank"; a.rel="noopener"; a.href=NOTION_HUB;
  a.innerHTML="자세히 — "+linkLabel+' <em>노션 ↗</em>';
  (moreId&&document.getElementById(moreId)||ch).appendChild(a);
  sel(order[0],0);
}

/* 기동 */
drawSafe(); paintDash("d-safe",SAFE.dash);
safePicker();
/* tabs.js 는 이 조각보다 먼저 돌아서 첫 paint() 때는 __safePlay 가 아직 없다 —
   주소에 #csafe 를 달고 들어온 경우가 그렇다. 그때만 여기서 한 번 재생한다(이중 재생 없음). */
if(!document.getElementById("p-csafe").hidden) safePlay();
wireWide("sc-safe","ch-safe","nt-safe",SAFE,["gate","s1","s2","s3"],"에코 더미 · 스트레스 테스트","mo-safe");
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
