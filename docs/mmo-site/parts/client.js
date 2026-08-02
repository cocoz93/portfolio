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
   있는데, 같은 말이 이미 그림 안에 두 번 있어 걷어냈다 — STEP 2 의 '결함을 넣었더니 첫 패킷에서
   걸렸다' 와 보기 ③ 합격 기준. */
var SAFE={
  dash:[["서버 PC","i9-10900","10C / 20T","Windows 10 · RAM 32GB · NIC Intel I225-V",0],
        ["부하 클라 PC","i7-6700","4C / 8T","Windows 10 · RAM 16GB · NIC Intel I219-V",0],
        ["기가 인터넷의 업로드 상한","474","Mbps","이 시험은 여유 — 병목 실험에서 여기 막혀 회선을 걷어냈다 (2-3 은 한 PC loopback)",0]],
  /* ── 설명 넷은 두 줄로 맞춘다 ──
     상자를 카드 오른쪽 아래 구석에 붙여 놨는데(safe-scene.js 의 overlay), 위를 고정하고 아래로
     자라는 구조라 줄 수가 곧 아래 여백이다. 넷이 145·180·142·88자이던 때 아래 여백이 보기마다
     60 → 18.6px 로 출렁였다(보기②가 4줄). 그래서 그림이 이미 하는 말을 걷어내 두 줄로 줄였다 —
     걷어낸 것: '먼저 남이 만든 도구로 잰다'(칩 이름) · '동접 1,000 으로 25분'(STEP 1 판정줄) ·
     '①을 통과한'(STEP 2 이름표) · '결함을 심었더니 첫 패킷에서 걸렸다'(STEP 2 판정줄) ·
     '동접 5,000 · 이동 · 시야 · 채팅'(STEP 3 이름표와 판정줄).
     ※ 여기 글을 늘릴 일이 생기면 세 줄째부터 카드 밑으로 밀린다. 늘리려면 상자 y 를 같이 올릴 것 */
  items:{
    s1:{t:"남이 만든 도구",
      n:"게임코디 Echo 더미는 10바이트 고정이다. 번호를 보내고 그대로 돌아오는지만 본다 — 접속이 되는가 · 서버가 먼저 끊지 않는가 · 보낸 값과 받은 값이 같은가."},
    s2:{t:"내가 만든 도구",
      n:"패킷은 12~256바이트로 들쭉날쭉하고 남는 자리는 정해진 규칙으로 채운다. 받을 때 같은 규칙으로 다시 만들어 통째로 비교하고, 어긋나면 바이트 자리까지 남기고 멈춘다."},
    gate:{t:"합격 기준",
      n:"넷 다 0이어야 한다 — 서버가 먼저 끊음 · 바이트 훼손 · 순서 역전 · 왕복 시간 초과. 하나라도 0이 아니면 부하 탓이 아니라 라이브러리 결함으로 본다."},
    s3:{t:"다음은 2-3",
      n:"검증이 끝난 더미에 게임 시나리오를 얹어 서버 전체를 잰다. 이 단의 자세한 이야기는 2-3 부하 검증에 있다."}
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
   맨 끝에 노션으로 보내는 문을 하나 달아 둔다 — 자세한 것은 전부 그쪽에 있다.
   moreId 를 주면 그 문을 칩 줄이 아니라 따로 받은 자리에 단다. 2-2 가 그렇다 — 거기서는 칩
   상자가 좁아(406) 문이 둘째 줄로 밀려, 고르는 줄과 나가는 문이 한 덩어리로 보였다.
   2-3 은 칩 줄이 전폭이라 같은 줄 오른쪽 끝에 붙는다(지금 그대로). */
var NOTION_HUB="https://feline-vacation-d6d.notion.site/36216a0b9f59801e9508dc51b4863f46";
function wireWide(scId,chId,noteId,DATA,order,linkLabel,moreId){
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
  (moreId&&document.getElementById(moreId)||ch).appendChild(a);
  sel(order[0],0);
}

/* 기동 */
drawSafe(); paintDash("d-safe",SAFE.dash);
wireWide("sc-safe","ch-safe","nt-safe",SAFE,["s1","s2","gate","s3"],"에코 더미 · 스트레스 테스트","mo-safe");
drawLoad(); paintDash("d-load",LOAD.dash);
wireWide("sc-load","ch-load","nt-load",LOAD,["env","bot","map","thr"],"테스트 환경 · 컨텐츠 부하 검증");

/* 하위 탭 전환은 tabs.js 하나만 맡는다 — 여기에 있던 옛 핸들러(data-p/.pane)는 지웠다.
   그 코드는 이미 죽어 있었고(data-p·.pane 둘 다 페이지에 없다) 살아 있던 한 줄은
   .subtab 전체의 act 를 갈아치웠다. paint() 보다 뒤에 돌아 클래스의 최종 결정권을 쥔 채
   aria-selected 는 안 건드리는 자리라, 하위 탭을 늘리면 조용히 어긋난다. */
})();
