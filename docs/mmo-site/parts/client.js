/* ═══════════ 클라이언트 탭 — 그림·계기판·카드 ═══════════ */
(function(){
"use strict";
var NS="http://www.w3.org/2000/svg";
function el(t,a,txt){ var e=document.createElementNS(NS,t); for(var k in a) e.setAttribute(k,a[k]);
  if(txt!=null) e.textContent=txt; return e; }
function h(t,a,txt){ var e=document.createElement(t); for(var k in a) e.setAttribute(k,a[k]);
  if(txt!=null) e.textContent=txt; return e; }

/* ═══════════ 아이소 투영 — 2-2 안전성 그림이 쓴다 ═══════════
   투영 상수는 서버 탭 구조도(scene.js)와 같은 값이다. 1-1·1-2 가 아이소 3D 인데 2-2 만 평면
   도식이면 같은 사이트로 안 읽힌다 — 평면 안에서 배치만 바꾼 시안이 셋 반려된 뒤 내린 결론이다.
   ※ 여기 있던 옛 아이소 헬퍼는 두 그림이 평면으로 바뀌며 지웠던 것인데, 2-2 가 다시 쓴다. */
var KX=.86, KY=.46, OX=560, OY=560, YAW=-12;
var AXLEN=KX/Math.cos(Math.PI/4), ELEV=KY/(AXLEN*Math.sin(Math.PI/4));
var YU=(45+YAW)*Math.PI/180, YV=(135+YAW)*Math.PI/180;
var AX=AXLEN*Math.cos(YU), BX=AXLEN*Math.cos(YV);
var AY=-AXLEN*Math.sin(YU)*ELEV, BY=-AXLEN*Math.sin(YV)*ELEV;
function ipx(u,v){ return OX+AX*u+BX*v; }
function ipy(u,v,z){ return OY+AY*u+BY*v-(z||0); }
function ipt(u,v,z){ return ipx(u,v).toFixed(1)+","+ipy(u,v,z||0).toFixed(1); }
function ipoly(p,pts,fill,extra){
  var a={points:pts.map(function(q){ return ipt(q[0],q[1],q[2]||0); }).join(" ")};
  if(fill) a.fill=fill;                       /* 색을 CSS 에 맡기는 폴리곤은 fill 을 아예 안 준다 */
  if(extra) for(var k in extra) a[k]=extra[k];
  var e=el("polygon",a); p.appendChild(e); return e;
}
/* 직육면체 하나 — 윗면·왼면·오른면 셋을 색만 달리해 세운다 */
function iprism(p,u,v,w,d,z0,ht,c,rim){ var t=z0+ht;
  ipoly(p,[[u,v,t],[u+w,v,t],[u+w,v,z0],[u,v,z0]],c[2]);
  ipoly(p,[[u,v,t],[u,v+d,t],[u,v+d,z0],[u,v,z0]],c[1]);
  ipoly(p,[[u,v,t],[u+w,v,t],[u+w,v+d,t],[u,v+d,t]],c[0]);
  if(rim) p.appendChild(el("polyline",{points:[[u+w,v,t],[u+w,v+d,t],[u,v+d,t]]
    .map(function(q){ return ipt(q[0],q[1],q[2]); }).join(" "),fill:"none",
    stroke:"rgba(255,255,255,.14)","stroke-width":"1"}));
}
/* 바닥에 눕히는 변환 — 판 위 STEP 글씨가 판과 같은 평면에 누워야 3D 로 읽힌다 */
function ifloor(u,v,z){ return "matrix("+AX.toFixed(4)+","+AY.toFixed(4)+","
  +(-BX).toFixed(4)+","+(-BY).toFixed(4)+","+ipx(u,v).toFixed(2)+","+ipy(u,v,z||0).toFixed(2)+")"; }
/* 화면 깊이 — 겹치는 작은 덩어리를 뒤에서부터 그리려고 쓴다 */
function idepth(u,v){ return AY*u+BY*v; }

/* ═══════════ ② 안전성 그림 ═══════════ */
/* 계기판이 성과 수치가 아니라 PC 두 대인 이유 — 2-2 는 서버 PC 와 클라 PC 를 나눠 돌린 시험이고
   2-3 은 한 PC loopback 이다. 조건이 다른데 머리에 안 적어 두면 두 탭의 수치를 같은 자로 읽는다. */
var SAFE={
  dash:[["서버 PC","i9-10900","10C / 20T","Windows 10 · RAM 32GB · NIC Intel I225-V",0],
        ["부하 클라 PC","i7-6700","4C / 8T","Windows 10 · RAM 16GB · NIC Intel I219-V",0],
        ["기가 인터넷의 업로드 상한","474","Mbps","이 시험은 여유 — 병목 실험에서 여기 막혀 회선을 걷어냈다 (2-3 은 한 PC loopback)",0],
        ["무결성 위반 · 서버발 끊김","0","건","9,478만 통 중 · 결함을 심으면 첫 패킷에서 걸린다",1]],
  items:{
    s1:{t:"남이 만든 도구",
      n:"먼저 남이 만든 도구로 잰다. 게임코디 Echo 더미는 10바이트 고정이라, 번호 하나를 보내고 그대로 돌아오는지만 본다. 접속이 되는가 · 서버가 먼저 끊지 않는가 · 보낸 값과 받은 값이 같은가. 이 셋이 합격선이고, 동접 1,000 으로 25분을 버텼다."},
    s2:{t:"내가 만든 도구",
      n:"①을 통과한 라이브러리 위에서 이번엔 내가 만든 더미를 검증한다. 패킷은 12~256바이트로 들쭉날쭉하고 남는 자리는 정해진 규칙으로 채운다 — 받을 때 같은 규칙으로 다시 만들어 통째로 비교한다. 어긋나면 어디서 틀렸는지 바이트까지 남기고 그 자리에서 멈춘다. 일부러 이상한 패킷을 보내는 공격 시험도 여기서 같이 한다."},
    gate:{t:"합격 기준",
      n:"넷 다 0이어야 한다. 서버가 먼저 끊음 · 바이트 훼손 · 순서 역전 · 왕복 시간 초과 — 하나라도 0이 아니면 부하 탓이 아니라 라이브러리 결함으로 본다. 검사기가 진짜 잡는지도 확인했다. 채우는 규칙을 한 칸 어긋나게 심었더니 첫 패킷에서 걸렸다."},
    s3:{t:"다음은 2-3",
      n:"검증이 끝난 더미에 게임 시나리오를 얹어 서버 전체를 잰다. 동접 5,000 · 이동 · 시야 · 채팅 — 이 단의 자세한 이야기는 2-3 부하 검증에 있다."}
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
   무엇을 고쳐도 "그게 그거"로 보였다(평면 안에서 배치만 바꾼 시안 셋이 반려됐다). */
function drawSafe(){
  var s=document.getElementById("sc-safe");
  var ZOUT={top:"#161d2b",side:"#0f1522",edge:"#93a5c2"};   /* 남의 도구가 선 판 — 무채 */
  var ZNET={top:"#111a2b",side:"#0b111d",edge:"#6cc7ff"};
  var NETC =["#63afe6","#1b4870","#2b6597"];                /* 내 라이브러리 — 파랑 */
  var DUMC =["#e0a04a","#6b4718","#a8752c"];                /* 내가 만든 더미 — 주황 */
  var GRAYC=["#7d8ba3","#333d4e","#4d596e"];                /* 남이 만든 도구 — 무채 */
  var CROWD=["#4f7cb4","#1e3a54","#2d5276"];
  var RECV="#6cc7ff", SEND="#ffb648", FG="#eef2fb", SUB="#8496b3", GRN="#57d694";
  var PV=-50, PW=262, PD=186;                               /* 판 — 세 단이 같은 크기 */

  var dfs=el("defs",{});
  dfs.innerHTML='<filter id="sfShadow" x="-40%" y="-40%" width="180%" height="180%">'
    +'<feGaussianBlur stdDeviation="6"/></filter>';
  s.appendChild(dfs);
  /* 레이어 — 판 · 그림자 · 경사로 · 덩어리 · 글자. 뒤에 그린 것이 위로 온다 */
  var gZone=el("g",{}), gShad=el("g",{}), gRamp=el("g",{}), gBuild=el("g",{}), gLbl=el("g",{});
  [gZone,gShad,gRamp,gBuild,gLbl].forEach(function(gg){ s.appendChild(gg); });
  function shadow(u,v,w,d,z){ gShad.appendChild(el("ellipse",
    {cx:ipx(u+w/2,v+d/2), cy:ipy(u+w/2,v+d/2,z||0)+5, rx:(w+d)*.36, ry:(w+d)*.12,
     fill:"#04060c", opacity:".40", filter:"url(#sfShadow)"})); }
  function lb(x,y,t,size,col,w,anc){
    gLbl.appendChild(el("text",{x:x.toFixed(1),y:y.toFixed(1),"font-size":String(size),fill:col,
      "font-weight":w||"700","text-anchor":anc||"middle","font-family":"var(--sans)"},t)); }

  var STEP=[
   {k:"s1", tag:"STEP 1", u:-150, z:0,
    a:{t:"게임코디 Echo 더미", s:"남이 만든 도구", c:GRAYC},
    b:{t:"내 네트워크 라이브러리", s:"이번에 잴 것", c:NETC},
    j:"동접 1,000 · 25분 부하 통과"},
   {k:"s2", tag:"STEP 2", u:128, z:54,
    a:{t:"검증된 라이브러리", s:"STEP 1 을 통과한 것", c:NETC},
    b:{t:"내가 만든 에코 더미", s:"무결성 검사 · 공격 시험", c:DUMC, crowd:1},
    j:"결함을 넣었더니 첫 패킷에서 걸렸다"},
   {k:"s3", tag:"STEP 3", u:406, z:108,
    a:{t:"검증된 더미 + 시나리오", s:"STEP 2 를 통과한 것", c:DUMC},
    b:{t:"서버 + 컨텐츠 전체", s:"이동 · 시야 · 채팅", c:NETC},
    j:"동접 5,000 — 2-3 부하 검증"}
  ];

  /* 판 — 뒤(높은 단)부터 그려야 앞 단이 위로 온다 */
  for(var i=STEP.length-1;i>=0;i--){
    var S=STEP[i], pal=(i===0)?ZOUT:ZNET, zg=el("g",{}); gZone.appendChild(zg);
    iprism(zg,S.u,PV,PW,PD,S.z-14,14,[pal.top,pal.side,pal.side]);
    zg.appendChild(el("line",{x1:ipx(S.u,PV+PD),y1:ipy(S.u,PV+PD,S.z),
      x2:ipx(S.u+PW,PV+PD),y2:ipy(S.u+PW,PV+PD,S.z),stroke:pal.edge,"stroke-width":"1.6",opacity:".42"}));
    zg.appendChild(el("line",{x1:ipx(S.u+PW,PV),y1:ipy(S.u+PW,PV,S.z),
      x2:ipx(S.u+PW,PV+PD),y2:ipy(S.u+PW,PV+PD,S.z),stroke:pal.edge,"stroke-width":"1.6",opacity:".42"}));
    var wg=el("g",{transform:ifloor(S.u+PW*.28,PV+13,S.z)});   /* 판에 누운 STEP 글씨 */
    wg.appendChild(el("text",{x:"0",y:"8.8","text-anchor":"middle","font-size":"26",
      "font-weight":"900","letter-spacing":"1.56","font-family":"var(--sans)",
      fill:pal.edge,opacity:".34"},S.tag));
    zg.appendChild(wg);
  }
  /* 칩이 켜는 자리 — 판 셋은 판 윗면, 합격 기준은 왕복 통로. 색은 client.css 가 쥔다 */
  STEP.forEach(function(S){
    var hg=el("g",{class:"cl-hit","data-it":S.k}); gZone.appendChild(hg);
    ipoly(hg,[[S.u,PV,S.z],[S.u+PW,PV,S.z],[S.u+PW,PV+PD,S.z],[S.u,PV+PD,S.z]],null,{class:"cl-safep"});
  });
  /* 합격 기준은 판 하나가 아니라 세 단을 가로지르는 잣대다 — 그래서 판이 아니라 왕복 통로를 켠다.
     통로 바닥은 덩어리보다 아래, 테두리는 맨 위라 층을 건너야 해서 같은 data-it 을 둘로 나눴다
     (wireWide 가 .cl-hit 을 전부 순회하므로 둘이 같이 켜진다). */
  var gateLow=el("g",{class:"cl-hit","data-it":"gate"}); gBuild.appendChild(gateLow);
  var gateTop=el("g",{class:"cl-hit","data-it":"gate"});

  STEP.forEach(function(S){
    var bg=el("g",{}); gBuild.appendChild(bg);
    var au=S.u+18, bu=S.u+PW-86, vv=PV+56;
    shadow(au,vv,66,70,S.z);      iprism(bg,au,vv,66,70,S.z,28,S.a.c,true);
    shadow(bu,vv-2,68,72,S.z);    iprism(bg,bu,vv-2,68,72,S.z,28,S.b.c,true);
    if(S.b.crowd){                                  /* 한 대가 여러 명을 만든다 — 더미 5×5 */
      var cu=[];
      for(var c=0;c<5;c++) for(var r=0;r<5;r++) cu.push([bu+5+c*11, vv+3+r*11]);
      cu.sort(function(p,q){ return idepth(p[0],p[1])-idepth(q[0],q[1]); });
      cu.forEach(function(p){ iprism(bg,p[0],p[1],9,9,S.z+28,9,CROWD); });
    }
    /* 두 덩어리 사이를 통째로 쓰는 왕복 — 이 단이 무엇으로 재는지가 여기 있다 */
    var u1=au+74, u2=bu-8, cv=vv+35, z=S.z, hw=9;
    ipoly(gateLow,[[u1,cv-hw,z],[u2,cv-hw,z],[u2,cv+hw,z],[u1,cv+hw,z]],"#16243a",{class:"cl-lane"});
    ipoly(bg,[[u2,cv-hw-4,z],[u2,cv+hw+4,z],[u2+15,cv,z]],RECV);
    ipoly(bg,[[u1,cv-hw-4,z],[u1,cv+hw+4,z],[u1-15,cv,z]],SEND);
    var n=Math.max(2,Math.round((u2-u1)/26));
    for(var q=1;q<n;q++){ var qu=u1+(u2-u1)*q/n;
      iprism(bg,qu-3.5,cv-3.5,7,7,z,5,[RECV,"#0b1726","#122238"]); }
    /* 강조 테두리는 통로 바깥으로 띄운다 — 안을 덮으면 화살촉 색(보냄·받음)과
       그 위 패킷이 탁해진다(2배로 확대해 확인했다). 안쪽은 바닥색만 밝힌다. */
    ipoly(gateTop,[[u1-20,cv,z],[u1,cv-hw-9,z],[u2,cv-hw-9,z],
                   [u2+20,cv,z],[u2,cv+hw+9,z],[u1,cv+hw+9,z]],null,{class:"cl-safep"});
    var mx=ipx((u1+u2)/2,cv), my=ipy((u1+u2)/2,cv,z+46);
    lb(mx,my,"에코",12,RECV,"800");
    lb(mx,my+13,"보내고 그대로 받는다",9,SUB,"600");
  });

  /* 승계 — 통과한 대상이 경사로를 타고 올라가 다음 단의 도구가 된다 */
  for(var r=0;r<2;r++){
    var A=STEP[r], B=STEP[r+1], vA=PV+22;
    var uA=(A.u+PW-86)+68, uB=(B.u+18)+6;
    var du=(uB-14)-uA, dv=0, Ln=Math.hypot(du,dv), pv=du/Ln*13;
    ipoly(gRamp,[[uA,vA+pv,A.z+7],[uB-14,vA+pv,B.z+7],[uB-14,vA-pv,B.z+7],[uA,vA-pv,A.z+7]],
      (r===0)?"#2b6597":"#a8752c",{opacity:".55"});
    ipoly(gRamp,[[uB-14,vA-12,B.z+7],[uB-14,vA+12,B.z+7],[uB,vA,B.z+7]],GRN);
  }

  /* 이름·판정 */
  STEP.forEach(function(S,i){
    var au=S.u+18, bu=S.u+PW-86, vv=PV+56;
    var ax=ipx(au+33,vv+70), ay=ipy(au+33,vv+70,S.z+86);
    lb(ax,ay,S.a.t,13.5,FG,"800");  lb(ax,ay+15,S.a.s,10.5,GRN,"700");
    var bx2=ipx(bu+34,vv), by2=ipy(bu+34,vv,S.z)+34;
    lb(bx2,by2,S.b.t,13.5,FG,"800"); lb(bx2,by2+15,S.b.s,10.5,SUB,"600");
    lb(bx2,by2+33,"✔ "+S.j,11,i===2?RECV:GRN,"700");
  });
  /* 왼쪽 위 — 이 그림이 무슨 말을 하는지 세 줄 */
  [[338,168,"검증이 끝난 것만 다음 단의 도구가 된다",18],
   [338,192,"그래서 첫 도구는 내가 만들지 않은 것이어야 한다.",11.5],
   [338,210,"내 코드와 내 테스트가 같이 틀리는 상황을 막는 유일한 방법이다.",11.5]]
  .forEach(function(l){ lb(l[0],l[1],l[2],l[3],l[3]>14?FG:SUB,l[3]>14?"800":"600","start"); });
  gBuild.appendChild(gateTop);
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
wireWide("sc-safe","ch-safe","nt-safe",SAFE,["s1","s2","gate","s3"],"에코 더미 · 스트레스 테스트");
drawLoad(); paintDash("d-load",LOAD.dash);
wireWide("sc-load","ch-load","nt-load",LOAD,["env","bot","map","thr"],"테스트 환경 · 컨텐츠 부하 검증");

/* 하위 탭 전환은 tabs.js 하나만 맡는다 — 여기에 있던 옛 핸들러(data-p/.pane)는 지웠다.
   그 코드는 이미 죽어 있었고(data-p·.pane 둘 다 페이지에 없다) 살아 있던 한 줄은
   .subtab 전체의 act 를 갈아치웠다. paint() 보다 뒤에 돌아 클래스의 최종 결정권을 쥔 채
   aria-selected 는 안 건드리는 자리라, 하위 탭을 늘리면 조용히 어긋난다. */
})();
