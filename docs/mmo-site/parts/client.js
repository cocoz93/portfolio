/* ═══════════ 클라이언트 탭 — 그림·계기판·카드 ═══════════ */
(function(){
"use strict";
var NS="http://www.w3.org/2000/svg";
function el(t,a,txt){ var e=document.createElementNS(NS,t); for(var k in a) e.setAttribute(k,a[k]);
  if(txt!=null) e.textContent=txt; return e; }
function h(t,a,txt){ var e=document.createElement(t); for(var k in a) e.setAttribute(k,a[k]);
  if(txt!=null) e.textContent=txt; return e; }

/* ※ 아이소 블록(cube) 헬퍼는 여기 있었다. 두 그림이 다 평면 도식으로 바뀌면서 부르는 곳이 없어졌다 —
   서버 탭 구조도의 아이소 블록은 그쪽 스크립트가 따로 갖고 있으므로 이것과 무관하다. */

/* ═══════════ ② 안전성 그림 ═══════════ */
var SAFE={
  dash:[["에코 처리량","3,791,301","건/초","동접 1,000 · 25분",1],
        ["왕복 평균","17","ms","최대 47ms",0],
        ["무결성 위반","0","건","9,478만 건 중",1],
        ["접속 · 해제","6,777","회","서버발 끊김 0",0]],
  items:{
    step:{t:"남의 자 → 내 자",
      n:"내가 만들지 않은 도구로 먼저 재고, 그다음 내가 만든 것으로 다시 잰다. 내 코드와 내 테스트가 같이 틀리는 상황을 막는 유일한 방법이다."},
    echo:{t:"보낸 값이 그대로 오는가",
      n:"패킷마다 순차 번호를 싣고 남는 자리는 정해진 규칙으로 채운다. 받을 때 같은 규칙으로 다시 만들어 통째로 비교한다 — 틀리면 카운터만 올리고 지나가지 않고 그 자리에서 멈춘다. 계속 돌리면 링버퍼가 덮이면서 증거가 사라진다."},
    gate:{t:"0이어야 하는 넷",
      n:"이 넷 중 하나라도 0이 아니면 부하가 아니라 라이브러리 결함 신호로 본다. 탐지기가 진짜 잡는지도 확인했다 — 패딩 씨앗을 한 칸 밀어 결함을 일부러 넣었더니 첫 패킷에서 걸렸다."},
    atk:{t:"일부러 이상하게 보내기",
      n:"비정상 패킷에 서버가 어떻게 반응하는지 본다. 통과 기준은 하나 — 그 세션만 끊고 서버는 살아 있을 것. 안 끊으면 방어가 작동하지 않은 것이라 실패로 본다. 끊는 게 정답인 시험이다."}
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

function drawSafe(){
  var s=document.getElementById("sc-safe"), g=el("g",{}); s.appendChild(g);

  /* ═══ 띠 1 — 검증 사다리 두 칸. 위아래로 놓아 '1 다음 2' 가 위치로 읽히게 ═══ */
  var sg=el("g",{class:"cl-hit","data-it":"step"}); g.appendChild(sg);
  plate(sg,6,8,1168,140);
  var LADDER=[
    {y:22,tag:"STEP 1",col:"#6cc7ff",dim:"#1f4f74",
     who:"게임코디 제공 Echo 더미",wsub:"남의 자 — 내가 만들지 않은 도구",
     tgt:"네트워크 라이브러리",tsub:"내가 만든 것",ok:"부하 통과"},
    {y:88,tag:"STEP 2",col:"#ffb648",dim:"#6b4718",
     who:"직접 만든 에코 하네스",wsub:"내 자 — 무결성 검사·공격까지 얹었다",
     tgt:"Step 1 을 통과한 라이브러리",tsub:"같은 것을 다시",ok:"정상 동작"}
  ];
  LADDER.forEach(function(L){
    /* 단계 이름표 */
    bx(sg,14,L.y,74,54,"#0f1522",L.col,8);
    tx(sg,51,L.y+23,L.tag,10.5,L.col,"800","middle","var(--mono)");
    tx(sg,51,L.y+40,"검증",10,"#5d6c85","600","middle");
    /* 재는 쪽 */
    bx(sg,98,L.y,296,54,"#0f1522","#1e2739",9);
    bx(sg,98,L.y,4,54,L.col,null,2);
    tx(sg,114,L.y+22,L.who,12.5,"#eef2fb","800");
    tx(sg,114,L.y+40,L.wsub,10,"#8496b3","600");
    /* 에코 — 갔다가 그대로 온다 */
    arrow(sg,406,586,L.y+18,"#6cc7ff",2);
    tx(sg,496,L.y+13,"보낸다",9.5,"#9ad4ff","700","middle","var(--mono)");
    arrow(sg,586,406,L.y+40,"#57d694",2);
    tx(sg,496,L.y+53,"그대로 온다",9.5,"#8ff0c0","700","middle","var(--mono)");
    /* 재는 대상 */
    bx(sg,598,L.y,296,54,"#0f1522","#1e2739",9);
    bx(sg,598,L.y,4,54,"#57d694",null,2);
    tx(sg,614,L.y+22,L.tgt,12.5,"#eef2fb","800");
    tx(sg,614,L.y+40,L.tsub,10,"#8496b3","600");
    /* 판정 */
    arrow(sg,902,932,L.y+27,"#3c4a63",1.6);
    bx(sg,940,L.y+8,120,38,"#0f1a15","rgba(87,214,148,.4)",9);
    tx(sg,1000,L.y+32,"✔ "+L.ok,11.5,"#57d694","800","middle");
  });
  /* 두 칸을 잇는 세로 레일 — 위 칸을 통과해야 아래 칸이 시작된다 */
  sg.appendChild(el("path",{d:"M 51 76 L 51 88",stroke:"#3c4a63","stroke-width":"1.6",fill:"none"}));
  tx(sg,1090,52,"동시 접속",9.5,"#5d6c85","600","middle");
  tx(sg,1090,68,"1,000",15,"#eef2fb","800","middle","var(--mono)");
  tx(sg,1090,112,"패킷 크기",9.5,"#5d6c85","600","middle");
  tx(sg,1090,128,"12~256 B",12,"#9ad4ff","800","middle","var(--mono)");

  /* ═══ 띠 2 — 에코 한 통의 구성을 띠로 ═══
     폭은 실제 바이트 비율이 아니다(4B 를 비율대로 그리면 9px 라 라벨이 안 들어간다).
     패딩이 압도적으로 길다는 것만 폭으로 말하고, 정확한 값은 상자 안 숫자가 갖는다. */
  var eg=el("g",{class:"cl-hit","data-it":"echo"}); g.appendChild(eg);
  plate(eg,6,156,1168,62);
  var SEG=[["헤더","4 B","#2b3a52","#c3cfe0",48],
           ["에코 값","8 B","#1f4f74","#9ad4ff",92],
           ["패딩  0~244 B","같은 씨앗 = 같은 바이트","#3a2c14","#ffcf8a",560]];
  var sx0=98;
  SEG.forEach(function(sgm){
    bx(eg,sx0,170,sgm[4],34,sgm[2],null,4);
    tx(eg,sx0+sgm[4]/2,185,sgm[0],10,sgm[3],"800","middle");
    tx(eg,sx0+sgm[4]/2,198,sgm[1],8.5,"#8496b3","600","middle","var(--mono)");
    sx0+=sgm[4]+3;
  });
  tx(eg,98,164,"보내는 한 통",9.5,"#5d6c85","600");
  arrow(eg,812,872,187,"#57d694",2);
  bx(eg,880,170,190,34,"#0f1a15","rgba(87,214,148,.4)",8);
  tx(eg,975,185,"memcmp 통째로 비교",10,"#8ff0c0","800","middle");
  tx(eg,975,198,"틀리면 그 자리에서 멈춘다",8.5,"#8496b3","600","middle");
  tx(eg,1090,190,"오프셋까지 기록",9,"#5d6c85","600","middle");

  /* ═══ 띠 3 — 0이어야 하는 넷 ═══ */
  var gg=el("g",{class:"cl-hit","data-it":"gate"}); g.appendChild(gg);
  plate(gg,6,226,1168,74);
  tx(gg,98,240,"하나라도 0이 아니면 부하가 아니라 라이브러리 결함 신호로 본다",9.5,"#5d6c85","600");
  var GATES=[["서버발 끊김","세션 관리"],["바이트 훼손","링버퍼·묶음 경계"],
             ["순서 역전","유실·뒤섞임"],["에코 타임아웃","500ms 기준"]];
  GATES.forEach(function(t,i){
    var x=98+i*245;
    bx(gg,x,246,228,46,"#0f1a15","rgba(87,214,148,.3)",10);
    tx(gg,x+30,280,"0",30,"#57d694","800","middle","var(--mono)");
    tx(gg,x+56,268,t[0],11.5,"#eef2fb","800");
    tx(gg,x+56,283,t[1],9,"#8496b3","600");
  });

  /* ═══ 띠 4 — 일부러 이상하게 보내기 ═══ */
  var ag=el("g",{class:"cl-hit","data-it":"atk"}); g.appendChild(ag);
  plate(ag,6,306,1168,58);
  tx(ag,98,320,"통과 기준은 하나 — 그 세션만 끊고 서버는 살아 있을 것",9.5,"#5d6c85","600");
  var ATK=[["크기 조작","0 · 3 · 4097 · 65535","즉시 끊김"],
           ["패킷 폭주","상한 해제","지연만 상승"],
           ["접속 후 침묵","무송신","60초 타임아웃"],
           ["큐 압박","안 받고 보내기","큐 넘침 끊김"]];
  ATK.forEach(function(t,i){
    var x=98+i*245;
    bx(ag,x,326,228,32,"#1a1113","rgba(255,107,82,.3)",8);
    tx(ag,x+12,340,t[0],10.5,"#ff9a8d","800");
    tx(ag,x+12,352,t[1],8.5,"#8496b3","600","start","var(--mono)");
    tx(ag,x+216,347,t[2],9,"#c3cfe0","700","end");
  });
}

/* ═══════════ ③ 부하 그림 ═══════════ */
var LOAD={
  dash:[["만드는 동접","5,000","명","스레드당 1,000",0],
        ["시나리오 틱","40","ms","서버와 같은 주기",0],
        ["더미 루프 p99","3.9","ms","예산 40ms의 10%",1],
        ["송신 버퍼 넘침","0","건","더미가 밀리지 않음",1]],
  items:{
    env:{t:"어디서 재는가",
      n:"코어를 나눠 두지 않으면 부하 클라가 서버 코어를 뺏어 간다. 그러면 서버가 느려진 게 아니라 측정이 느려진 것인데, 지표만 봐서는 구분이 안 된다. 회선도 같은 이유로 걷어냈다 — 동접 1,500에서 무너졌을 때 틱은 예산 안이었고, 원인은 회선 업로드 상한 473.94 Mbps였다."},
    bot:{t:"봇 한 마리가 하는 일",
      n:"매 틱 1~100 중 하나를 굴려 행동을 정한다. 확률이 따로 도는 게 아니라 한 주사위의 구간을 나눠 갖는다. 하트비트는 20초 고정이고 서버 타임아웃은 60초다."},
    map:{t:"맵과 시야",
      n:"내 섹터와 이웃 여덟 칸, 그 안의 사람에게만 보낸다. 시야가 맵의 25%나 되는 건 의도다 — 실제 게임보다 밀도가 높아야 적은 동접으로 서버 병목이 빨리 드러난다."},
    thr:{t:"측정기가 병목이면 안 된다",
      n:"서버가 5,000에서 막힌 게 아니라 더미가 5,000을 못 만든 것일 수 있다. 그래서 더미는 자기가 밀리는지를 먼저 잰다. 스레드당 인원을 절반으로 줄여 스레드를 두 배로 만들어도 왕복 지연이 그대로면, 더미는 병목이 아니다."}
  }
};
function drawLoad(){
  var s=document.getElementById("sc-load"), g=el("g",{}); s.appendChild(g);

  /* ═══ 자리 0 — 어디서 재는가. 옛 ④ 테스트 환경 탭이 이 띠로 들어왔다 ═══ */
  var vg=el("g",{class:"cl-hit","data-it":"env"}); g.appendChild(vg);
  plate(vg,6,8,1168,164);
  /* 한 PC 안에서 코어를 갈랐다 */
  bx(vg,24,36,600,124,"#0f1522","#1e2739",10);
  tx(vg,40,54,"서버 PC 한 대 · i9-10900 · 10코어 20스레드",10.5,"#8496b3","700");
  tx(vg,208,74,"서버 프로세스",11,"#9ad4ff","800","middle");
  tx(vg,484,74,"부하 클라 프로세스",11,"#ffcf8a","800","middle");
  for(var i=0;i<10;i++){
    var srv=(i<6), cx0=40+i*56;
    bx(vg,cx0,80,48,36,srv?"#1f4f74":"#6b4718",srv?"#3a7fb5":"#c98a34",6);
    tx(vg,cx0+24,104,String(i),12.5,"#eaf3ff","800","middle","var(--mono)");
  }
  tx(vg,208,132,"ServerCores = 0-5",9.5,"#5d6c85","600","middle","var(--mono)");
  tx(vg,484,132,"ClientCores = 6-9",9.5,"#5d6c85","600","middle","var(--mono)");
  /* loopback — 두 무리가 메모리 복사로 오간다 */
  vg.appendChild(el("path",{d:"M 214 148 L 470 148",stroke:"#6cc7ff","stroke-width":"1.6",
    fill:"none","stroke-dasharray":"6 4"}));
  vg.appendChild(el("polygon",{points:"478,148 466,143 466,153",fill:"#6cc7ff"}));
  vg.appendChild(el("polygon",{points:"206,148 218,143 218,153",fill:"#ffb648"}));
  tx(vg,342,144,"loopback 127.0.0.1 · 랜선도 공유기도 안 탄다",9.5,"#8496b3","700","middle","var(--mono)");
  /* 여기까지 온 길 — 회선을 걷어내며 네 번 옮겼다 */
  tx(vg,648,54,"여기까지 온 길 — 회선이 천장이면 서버를 잴 수 없다",10.5,"#8496b3","700");
  var HOP=[["v1","공인 IP 브릿지","474","Mbps","폐기"],
           ["v2","사설 LAN 정적IP","940","Mbps","폐기"],
           ["v3","공유기 NAT","940","Mbps","폐기"],
           ["v4","한 PC loopback","—","","현재"]];
  HOP.forEach(function(hp,j){
    var x=648+j*130, live=(j===3);
    bx(vg,x,68,118,64,live?"#111f31":"#0f1522",live?"#2c5f85":"#1e2739",9);
    tx(vg,x+11,85,hp[0],9.5,live?"#6cc7ff":"#4a5568","800",null,"var(--mono)");
    tx(vg,x+11,101,hp[1],9.5,live?"#eef2fb":"#6f7f99","700");
    tx(vg,x+11,120,hp[2]+(hp[3]?" "+hp[3]:""),11,live?"#6cc7ff":"#8496b3","800",null,"var(--mono)");
    tx(vg,x+107,120,hp[4],9,live?"#57d694":"#5d6c85","700","end");
    if(j<3) tx(vg,x+123,101,"›",11,"#3c4a63","800","middle");
  });
  tx(vg,648,152,"동접 1,500에서 무너졌을 때 틱은 예산 안이었다 — 서버가 한가한데 왕복만 1초였다",9.5,"#5d6c85","600");

  /* ═══ 맵과 시야 ═══ */
  var mg=el("g",{class:"cl-hit","data-it":"map"}); g.appendChild(mg);
  plate(mg,6,180,384,246);
  var MX=34, MY=214, MS=30;                       /* 6×6 → 180px */
  tx(mg,MX+MS*3,204,"맵 120×120 · 섹터 20 → 6×6 = 36칸",10,"#8496b3","700","middle");
  bx(mg,MX,MY,MS*6,MS*6,"#0f1522","#233047",4);
  for(var q=1;q<6;q++){
    mg.appendChild(el("line",{x1:MX+q*MS,y1:MY,x2:MX+q*MS,y2:MY+MS*6,stroke:"#1c2942","stroke-width":"1"}));
    mg.appendChild(el("line",{x1:MX,y1:MY+q*MS,x2:MX+MS*6,y2:MY+q*MS,stroke:"#1c2942","stroke-width":"1"}));
  }
  mg.appendChild(el("rect",{x:MX+2*MS,y:MY+2*MS,width:MS*3,height:MS*3,fill:"rgba(108,199,255,.07)",
    stroke:"#6cc7ff","stroke-width":"1.4","stroke-dasharray":"6 4"}));
  /* 봇 점 — 결정적 배치(프레임마다 흔들리면 안 된다) */
  var seed=7;
  function rr(){ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; }
  for(var k=0;k<150;k++){
    var px2=MX+4+rr()*(MS*6-8), py2=MY+4+rr()*(MS*6-8);
    var inView=(px2>MX+2*MS&&px2<MX+5*MS&&py2>MY+2*MS&&py2<MY+5*MS);
    mg.appendChild(el("circle",{cx:px2.toFixed(1),cy:py2.toFixed(1),r:inView?2.2:1.7,
      fill:inView?"#6cc7ff":"#33507a",opacity:inView?".95":".55"}));
  }
  mg.appendChild(el("circle",{cx:MX+3.5*MS,cy:MY+3.5*MS,r:4.6,fill:"#ffb648",
    stroke:"#0d1220","stroke-width":"1.4"}));
  tx(mg,MX+MS*3,MY+MS*6+20,"점선 안 = 내 시야 3×3 · 밖은 보내지도 받지도 않는다",9.5,"#6cc7ff","700","middle");
  /* 시야가 넓다는 사실을 숫자로 — 표 대신 큰 값 둘 */
  bx(mg,238,236,140,58,"#0f1522","#1e2739",9);
  tx(mg,308,256,"시야가 맵의",9,"#5d6c85","600","middle");
  tx(mg,308,280,"25%",21,"#6cc7ff","800","middle","var(--mono)");
  bx(mg,238,302,140,58,"#0f1522","#1e2739",9);
  tx(mg,308,322,"한 사람이 받는 팬아웃",9,"#5d6c85","600","middle");
  tx(mg,308,346,"922",21,"#ffb648","800","middle","var(--mono)");
  tx(mg,308,372,"동접 5,000 기준 실측",8.5,"#5d6c85","600","middle");

  /* ═══ 봇 한 마리 — 매 틱 주사위 하나 ═══ */
  var dg2=el("g",{class:"cl-hit","data-it":"bot"}); g.appendChild(dg2);
  plate(dg2,398,180,384,120);
  tx(dg2,418,200,"매 틱 주사위 하나 — 40ms 마다",11,"#eef2fb","800");
  function bar(y,label,segs){
    tx(dg2,418,y-5,label,9.5,"#8496b3","700");
    var x=418, W=344;
    segs.forEach(function(sg){
      var w=W*sg[0]/100;
      dg2.appendChild(el("rect",{x:x,y:y,width:w,height:22,fill:sg[1],
        rx:(x===418||x+w>=418+W-1)?3:0}));
      if(w>40) tx(dg2,x+w/2,y+15,sg[3],9.5,sg[2]||"#0d1220","800","middle","var(--mono)");
      x+=w;
    });
  }
  bar(222,"서 있을 때",[[75,"#6cc7ff",null,"이동 75"],[20,"#ffb648",null,"채팅 20"],[5,"#57d694",null,"5"]]);
  /* 5% 조각은 폭이 17px 라 이름이 안 들어간다 — 초록이 무엇인지 라벨 줄 오른쪽에서 밝혀 준다 */
  tx(dg2,762,217,"끝 초록 5% = 존 이동",8.5,"#57d694","700","end");
  bar(268,"걷고 있을 때",[[20,"#ff6b52",null,"정지 20"],[80,"#2b3a52","#c3cfe0","계속 이동 80"]]);

  /* ═══ 측정기가 병목이면 안 된다 — 5,000을 만드는 쪽과 그 자기검사 ═══ */
  var tg=el("g",{class:"cl-hit","data-it":"thr"}); g.appendChild(tg);
  plate(tg,398,306,384,120);
  tx(tg,418,326,"5,000명을 다섯 스레드가 나눠 든다",11,"#eef2fb","800");
  /* 간격 16 · 시작 330 — 17 로 두면 마지막 줄(#4)의 '1,000명' 이 아래 각주와 붙어 겹쳤다 */
  for(var t=0;t<5;t++){
    var ty=330+t*16;
    bx(tg,418,ty,20,13,"#3a2c14","rgba(255,182,72,.45)",4);
    tx(tg,428,ty+10,"#"+t,8.5,"#ffcf8a","800","middle","var(--mono)");
    for(var w2=0;w2<10;w2++) bx(tg,446+w2*12,ty+3,9,7,"#1f4f74",null,2);
    tx(tg,586,ty+10,"1,000명",9,"#8496b3","700",null,"var(--mono)");
    tx(tg,762,ty+10,"소켓 1,000",8.5,"#5d6c85","600","end","var(--mono)");
  }
  tx(tg,418,421,"스레드를 늘리면 서버 코어를 뺏는다 — 담당 인원을 늘리는 쪽을 택했다",8.5,"#5d6c85","600");

  var ng=el("g",{class:"cl-hit","data-it":"thr"}); g.appendChild(ng);
  plate(ng,790,180,384,246);
  tx(ng,810,202,"측정기가 병목이면 안 된다",12,"#eef2fb","800");
  tx(ng,810,218,"5,000에서 막힌 게 서버인지 더미인지 먼저 가른다",9,"#5d6c85","600");
  var GUARD=[["더미 루프 p99","3.9 ms","예산 40ms 의 10%",1],
             ["송신 버퍼 넘침","0 건","더미가 밀리지 않았다",1],
             ["만든 접속 수","목표치 그대로","모자라면 부하가 거짓",0],
             ["교차 확인","스레드 ×2 → 왕복 그대로","더미는 병목이 아니다",1]];
  GUARD.forEach(function(gd,j){
    var y=230+j*48;
    bx(ng,810,y,344,40,gd[3]?"#0f1a15":"#0f1522",gd[3]?"rgba(87,214,148,.3)":"#1e2739",9);
    tx(ng,824,y+18,gd[0],10.5,"#eef2fb","800");
    tx(ng,824,y+32,gd[2],8.5,"#8496b3","600");
    tx(ng,1140,y+24,gd[1],11,gd[3]?"#57d694":"#9ad4ff","800","end","var(--mono)");
  });
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
   맨 끝에 노션으로 보내는 문을 하나 달아 둔다 — 자세한 것은 전부 그쪽에 있다. */
var NOTION_HUB="https://feline-vacation-d6d.notion.site/36216a0b9f59801e9508dc51b4863f46";
function wireWide(scId,chId,noteId,DATA,order,linkLabel){
  var ch=document.getElementById(chId), note=document.getElementById(noteId);
  function sel(k,i){
    note.innerHTML="";
    var em=h("i",{},"보기 "+(i+1)), p=h("p",{},DATA.items[k].n);
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
  ch.appendChild(a);
  sel(order[0],0);
}

/* 기동 */
drawSafe(); paintDash("d-safe",SAFE.dash);
wireWide("sc-safe","ch-safe","nt-safe",SAFE,["step","echo","gate","atk"],"에코 더미 · 스트레스 테스트");
drawLoad(); paintDash("d-load",LOAD.dash);
wireWide("sc-load","ch-load","nt-load",LOAD,["env","bot","map","thr"],"테스트 환경 · 컨텐츠 부하 검증");

document.querySelectorAll(".subtab").forEach(function(b){
  b.addEventListener("click",function(){
    document.querySelectorAll(".subtab").forEach(function(x){x.classList.toggle("act",x===b)});
    var id=b.getAttribute("data-p");
    document.querySelectorAll(".pane").forEach(function(p){p.classList.toggle("act",p.id==="p-"+id)});
  });
});
})();
