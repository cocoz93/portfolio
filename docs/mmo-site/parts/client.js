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
function tx(p,x,y,t,size,col,w,anc,fam){
  p.appendChild(el("text",{x:x,y:y,"font-size":String(size),fill:col,"font-weight":w||"600",
    "text-anchor":anc||"start","font-family":fam||"var(--sans)"},t));
}
function bx(p,x,y,w,ht,fill,stroke,rx){
  p.appendChild(el("rect",{x:x,y:y,width:w,height:ht,rx:(rx==null?9:rx),
    fill:fill||"none",stroke:stroke||"none"}));
}
function plate(p,x,y,w,ht){ p.appendChild(el("rect",{class:"cl-plate",x:x,y:y,width:w,height:ht,rx:12})); }
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
  /* no·t·s 는 목차 줄이 쓰고, d 는 오른쪽 판 머리의 설명 줄이다.
     d 를 배열로 두는 것은 SVG 가 자동 줄바꿈을 안 해서다 — 줄을 손으로 끊어 둔다.
     ※ 줄을 늘리면 그 아래 그림의 시작 y(각 그리개의 첫 숫자)도 같이 내려야 한다. */
  items:{
    env:{no:"1", t:"어디서 재는가", s:"코어를 가르고, 회선을 걷어냈다",
      d:["코어를 나눠 두지 않으면 부하 클라가 서버 코어를 뺏어 간다 — 서버가 느려진 게 아니라 측정이 느려진 것인데,",
         "지표만 봐서는 구분이 안 된다. 회선도 같은 이유로 걷어냈다."]},
    /* 셋(목차 곁말 s · 머리 설명 d · 그림 옆 글)이 층을 나눠 갖는다 — s 는 규칙, d 는 그래서
       무엇이 달라지나, 그림 옆은 왜 그 값이냐. 한때 셋이 같은 말을 해서 화면에 두 번씩 찍혔다. */
    map:{no:"2", t:"맵과 시야", s:"내 섹터와 이웃 여덟 칸에만 보낸다",
      d:["그래서 한 사람이 받는 양은 시야 안 인원만큼이다 —",
         "동접이 늘면 사람마다 받는 양도 같이 는다."]},
    bot:{no:"3", t:"더미 5,000이 하는 일", s:"다섯 스레드가 나눠 들고, 봇은 매 틱 주사위",
      d:["봇 하나는 매 틱 1~100 중 하나를 굴려 행동을 정한다 —",
         "확률이 따로 도는 게 아니라 한 주사위의 구간을 나눠 갖는다."]},
    thr:{no:"4", t:"측정기가 병목이면 안 된다", s:"5,000에서 막힌 게 서버인지 더미인지",
      d:["서버가 5,000에서 막힌 게 아니라 더미가 5,000을 못 만든 것일 수 있다.",
         "그래서 더미는 자기가 밀리는지를 먼저 잰다."]}
  }
};
var LOAD_ORDER=["env","map","bot","thr"];

/* 오른쪽 판은 880×420 이다(액자 안 오른쪽 칸). 머리(이름 + 설명 두 줄)까지가 y 100 이고,
   그 아래를 각 그리개가 쓴다. 넷이 같은 머리를 쓰므로 고른 것이 바뀌어도 윗줄이 안 움직인다. */
function loadHead(g,it){
  bx(g,0,0,880,420,"#0f1522","#1e2739",14);
  tx(g,24,42,it.no,15,"#6cc7ff","800",null,"var(--mono)");
  tx(g,46,42,it.t,15,"#eef2fb","800");
  it.d.forEach(function(ln,j){ tx(g,24,66+j*17,ln,9.5,"#5d6c85","600"); });
}
/* 회선 이사 넷 — env 와 (좁은 화면의) 어디서도 같은 표를 쓴다 */
var LOAD_HOP=[["v1","공인 IP 브릿지","474 Mbps","폐기"],["v2","사설 LAN 정적IP","940 Mbps","폐기"],
              ["v3","공유기 NAT","940 Mbps","폐기"],["v4","한 PC loopback","—","현재"]];
var LOAD_GUARD=[["더미 루프 p99","3.9 ms","예산 40ms 의 10%",1],
                ["송신 버퍼 넘침","0 건","더미가 밀리지 않았다",1],
                ["만든 접속 수","목표치 그대로","모자라면 부하가 거짓",0],
                ["교차 확인","스레드 ×2 → 왕복 그대로","더미는 병목이 아니다",1]];

/* ── 1 어디서 재는가 ── 한 PC 안에서 코어를 가르고, 회선은 네 번 옮겨 끝내 걷어냈다 */
function loadEnv(g){
  tx(g,24,116,"서버 PC 한 대 · i9-10900 · 10코어 20스레드",10,"#8496b3","700");
  var bw=56, st=70, x0=24;
  for(var i=0;i<10;i++){
    var srv=(i<6), cx=x0+i*st;
    bx(g,cx,140,bw,44,srv?"#1f4f74":"#6b4718",srv?"#3a7fb5":"#c98a34",7);
    tx(g,cx+bw/2,169,String(i),14,"#eaf3ff","800","middle","var(--mono)");
  }
  var c1=x0+2.5*st+bw/2, c2=x0+7.5*st+bw/2;
  tx(g,c1,134,"서버 프로세스",11,"#9ad4ff","800","middle");
  tx(g,c2,134,"부하 클라 프로세스",11,"#ffcf8a","800","middle");
  tx(g,c1,202,"ServerCores = 0-5",9.5,"#5d6c85","600","middle","var(--mono)");
  tx(g,c2,202,"ClientCores = 6-9",9.5,"#5d6c85","600","middle","var(--mono)");
  /* loopback — 두 무리가 랜선도 공유기도 안 타고 메모리 복사로 오간다 */
  g.appendChild(el("path",{d:"M "+(c1+10)+" 224 L "+(c2-10)+" 224",stroke:"#6cc7ff",
    "stroke-width":"1.6",fill:"none","stroke-dasharray":"6 4"}));
  g.appendChild(el("polygon",{points:c2+",224 "+(c2-12)+",219 "+(c2-12)+",229",fill:"#6cc7ff"}));
  g.appendChild(el("polygon",{points:c1+",224 "+(c1+12)+",219 "+(c1+12)+",229",fill:"#ffb648"}));
  tx(g,(c1+c2)/2,218,"loopback 127.0.0.1 · 랜선도 공유기도 안 탄다",9.5,"#8496b3","700","middle","var(--mono)");
  tx(g,24,266,"여기까지 온 길 — 회선이 천장이면 서버를 잴 수 없다",10,"#8496b3","700");
  LOAD_HOP.forEach(function(hp,j){
    var hx=24+j*209, live=(j===3);
    bx(g,hx,278,196,58,live?"#111f31":"#0f1522",live?"#2c5f85":"#1e2739",9);
    tx(g,hx+14,300,hp[0]+"  "+hp[1],10,live?"#eef2fb":"#6f7f99","700");
    tx(g,hx+14,322,hp[2],11.5,live?"#6cc7ff":"#8496b3","800",null,"var(--mono)");
    tx(g,hx+182,322,hp[3],9,live?"#57d694":"#5d6c85","700","end");
    if(j<3) tx(g,hx+202,310,"›",12,"#3c4a63","800","middle");
  });
  tx(g,24,372,"동접 1,500에서 무너졌을 때 틱은 예산 안이었다 — 서버가 한가한데 왕복만 1초였다",9.5,"#5d6c85","600");
}

/* ── 2 맵과 시야 ── 격자는 왼쪽, 넓다는 사실을 말하는 큰 값 둘은 오른쪽 */
function loadMap(g){
  var MX=24, MY=116, MS=42;                        /* 6×6 → 252px */
  bx(g,MX,MY,MS*6,MS*6,"#0f1522","#233047",4);
  for(var q=1;q<6;q++){
    g.appendChild(el("line",{x1:MX+q*MS,y1:MY,x2:MX+q*MS,y2:MY+MS*6,stroke:"#1c2942","stroke-width":"1"}));
    g.appendChild(el("line",{x1:MX,y1:MY+q*MS,x2:MX+MS*6,y2:MY+q*MS,stroke:"#1c2942","stroke-width":"1"}));
  }
  g.appendChild(el("rect",{x:MX+2*MS,y:MY+2*MS,width:MS*3,height:MS*3,fill:"rgba(108,199,255,.07)",
    stroke:"#6cc7ff","stroke-width":"1.4","stroke-dasharray":"7 5"}));
  /* 봇 점 — 결정적 배치(프레임마다 흔들리면 안 된다) */
  var seed=7;
  function rr(){ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; }
  for(var k=0;k<150;k++){
    var px=MX+5+rr()*(MS*6-10), py=MY+5+rr()*(MS*6-10);
    var iv=(px>MX+2*MS&&px<MX+5*MS&&py>MY+2*MS&&py<MY+5*MS);
    g.appendChild(el("circle",{cx:px.toFixed(1),cy:py.toFixed(1),r:iv?3.2:2.4,
      fill:iv?"#6cc7ff":"#33507a",opacity:iv?".95":".55"}));
  }
  g.appendChild(el("circle",{cx:MX+3.5*MS,cy:MY+3.5*MS,r:6.5,fill:"#ffb648",
    stroke:"#0d1220","stroke-width":"1.6"}));
  tx(g,24,392,"점선 안 = 내 시야 3×3 · 밖은 보내지도 받지도 않는다",10,"#6cc7ff","700");
  tx(g,310,130,"맵 120×120 · 섹터 20 → 6×6 = 36칸",10,"#8496b3","700");
  bx(g,310,146,264,88,"#0f1522","#1e2739",10);
  tx(g,330,176,"시야가 맵의",10,"#5d6c85","600");
  tx(g,330,216,"25%",30,"#6cc7ff","800",null,"var(--mono)");
  bx(g,594,146,262,88,"#0f1522","#1e2739",10);
  tx(g,614,176,"한 사람이 받는 팬아웃",10,"#5d6c85","600");
  tx(g,614,216,"922",30,"#ffb648","800",null,"var(--mono)");
  tx(g,614,254,"동접 5,000 기준 실측",9,"#5d6c85","600");
  tx(g,310,300,"시야가 이렇게 넓은 것은 의도다 —",10,"#8496b3","700");
  tx(g,310,320,"실제 게임보다 밀도가 높아야 적은 동접으로",9.5,"#5d6c85","600");
  tx(g,310,338,"서버 병목이 빨리 드러난다.",9.5,"#5d6c85","600");
}

/* ── 3 더미 5,000이 하는 일 ── 왼쪽은 누가 몇을 드는가, 오른쪽은 그 하나가 매 틱 뭘 하는가 */
function loadBot(g){
  tx(g,24,120,"5,000명을 다섯 스레드가 나눠 든다",11.5,"#c3cfe0","800");
  for(var t=0;t<5;t++){
    var ty=136+t*26;
    bx(g,24,ty,30,20,"#3a2c14","rgba(255,182,72,.45)",5);
    tx(g,39,ty+14,"#"+t,10,"#ffcf8a","800","middle","var(--mono)");
    for(var w=0;w<10;w++) bx(g,66+w*17,ty+5,13,10,"#1f4f74",null,3);
    tx(g,254,ty+14,"1,000명",10,"#8496b3","700",null,"var(--mono)");
    tx(g,404,ty+14,"소켓 1,000",9,"#5d6c85","600","end","var(--mono)");
  }
  tx(g,24,292,"스레드를 늘리면 서버 코어를 뺏는다 —",9.5,"#5d6c85","600");
  tx(g,24,310,"담당 인원을 늘리는 쪽을 택했다.",9.5,"#5d6c85","600");
  /* 한 판 안에 이야기가 둘이라 세로선으로 끊는다 */
  g.appendChild(el("line",{x1:440,y1:112,x2:440,y2:392,stroke:"#26324a","stroke-width":"1"}));
  tx(g,470,120,"매 틱 주사위 하나 — 40ms 마다",11.5,"#c3cfe0","800");
  tx(g,856,120,"끝 5% = 존 이동",9,"#6f88ad","700","end");
  function bar(y,label,segs){
    tx(g,470,y-8,label,10,"#8496b3","700");
    var x=470, W=386;
    segs.forEach(function(sg){
      var w=W*sg[0]/100;
      g.appendChild(el("rect",{x:x,y:y,width:w,height:28,fill:sg[1],
        rx:(x===470||x+w>=470+W-1)?4:0}));
      if(w>44) tx(g,x+w/2,y+19,sg[3],10,sg[2]||"#0d1220","800","middle","var(--mono)");
      x+=w;
    });
  }
  /* 초록은 여기서 뺐다 — 초록은 4 번 판의 '합격' 색이다. 같은 이유로 '정지' 의 빨강도 걷었다 */
  bar(158,"서 있을 때",[[75,"#6cc7ff",null,"이동 75"],[20,"#ffb648",null,"채팅 20"],[5,"#4e6f9c",null,"5"]]);
  bar(232,"걷고 있을 때",[[20,"#5b7194",null,"정지 20"],[80,"#2b3a52","#c3cfe0","계속 이동 80"]]);
  /* '확률이 따로 도는 게 아니라…' 는 여기 있었는데 머리 설명 둘째 줄과 글자까지 같아 걷어냈다 */
  tx(g,470,300,"하트비트는 20초 고정이고 서버 타임아웃은 60초다.",9.5,"#5d6c85","600");
}

/* ── 4 측정기가 병목이면 안 된다 ── 판정 넷도 세로로 읽힌다 */
function loadThr(g){
  LOAD_GUARD.forEach(function(gd,j){
    var y=116+j*72;
    bx(g,24,y,832,64,gd[3]?"#0f1a15":"#0f1522",gd[3]?"rgba(87,214,148,.3)":"#1e2739",10);
    tx(g,44,y+28,gd[0],12,"#eef2fb","800");
    tx(g,44,y+48,gd[2],9.5,"#8496b3","600");
    tx(g,836,y+38,gd[1],13,gd[3]?"#57d694":"#9ad4ff","800","end","var(--mono)");
  });
}

var LOAD_DRAW={env:loadEnv, map:loadMap, bot:loadBot, thr:loadThr};
function drawLoad(key){
  var s=document.getElementById("sc-load");
  while(s.firstChild) s.removeChild(s.firstChild);
  var g=el("g",{}); s.appendChild(g);
  var it=LOAD.items[key];
  loadHead(g,it);
  LOAD_DRAW[key](g);
  s.setAttribute("aria-label", it.t+" — "+it.d.join(" "));
}

/* 목차 줄 — 누르면 오른쪽 판이 통째로 바뀐다. 칩 줄(.cl-chips)과 설명 줄(.cr-note)은
   이 목차가 둘 다 대신하므로 2-3 에서는 없앴다. */
function wireLoadIndex(){
  var ix=document.getElementById("ix-load");
  function sel(k){
    drawLoad(k);
    [].forEach.call(ix.querySelectorAll("button"),function(b){
      var on=(b.getAttribute("data-it")===k);
      b.classList.toggle("act",on); b.setAttribute("aria-pressed",on?"true":"false"); });
  }
  LOAD_ORDER.forEach(function(k){
    var it=LOAD.items[k];
    var b=h("button",{type:"button","data-it":k,"aria-pressed":"false"});
    b.appendChild(h("i",{},it.no));
    b.appendChild(h("b",{},it.t));
    b.appendChild(h("span",{},it.s));
    b.addEventListener("click",function(){ sel(k); });
    ix.appendChild(b);
  });
  sel(LOAD_ORDER[0]);
  var a=document.createElement("a");
  a.className="cr-more"; a.target="_blank"; a.rel="noopener"; a.href=NOTION_HUB;
  a.innerHTML="자세히 — 테스트 환경 · 컨텐츠 부하 검증 <em>노션 ↗</em>";
  document.getElementById("mo-load").appendChild(a);
}

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

/* 하위 탭 전환은 tabs.js 하나만 맡는다 — 여기에 있던 옛 핸들러(data-p/.pane)는 지웠다.
   그 코드는 이미 죽어 있었고(data-p·.pane 둘 다 페이지에 없다) 살아 있던 한 줄은
   .subtab 전체의 act 를 갈아치웠다. paint() 보다 뒤에 돌아 클래스의 최종 결정권을 쥔 채
   aria-selected 는 안 건드리는 자리라, 하위 탭을 늘리면 조용히 어긋난다. */
})();
