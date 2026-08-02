/* ═══════════ 2-2 안전성 그림 — 장면 데이터 + 그리는 코드 ═══════════
   이 조각이 따로 있는 까닭은 편집기(mmo-safe-edit.html)와 같은 코드로 그리기 위해서다.
   편집기가 그림 코드를 복제해 들고 있으면 본편을 고칠 때마다 둘이 어긋난다 — 1-1 구조도의
   mmo-edit.html 이 그 상태다. 여기서는 편집기가 이 파일을 <script src> 로 그대로 읽는다.

   ── 나누는 선 ──
   · 이 파일  = 장면 데이터(SCENE) + 그것을 SVG 로 옮기는 코드
   · client.js = 데이터를 들고 draw/place 를 부르는 쪽, 그리고 칩 클릭 같은 페이지 동작
   편집기가 뱉는 Export 는 아래 SCENE 과 같은 모양이라, client.js 의 SCENE 자리에 통째로
   갈아 끼우면 반영된다.

   ── 좌표 ──
   u = 계단이 뻗는 쪽(오른쪽 위) · v = 그 직각(오른쪽 아래) · z = 높이.
   단(step)의 u·z 가 판 하나의 자리이고, 판 위에 놓이는 것들은 그 판을 기준으로 잰 오프셋이다.
   그래서 판을 옮기면 위에 실린 것이 통째로 따라온다. */
(function(){
"use strict";
var NS="http://www.w3.org/2000/svg";
function el(t,a,txt){ var e=document.createElementNS(NS,t); for(var k in a) e.setAttribute(k,a[k]);
  if(txt!=null) e.textContent=txt; return e; }

/* ═══ 아이소 투영 ═══
   투영 상수는 서버 탭 구조도(scene.js)와 같은 값이다. 1-1·1-2 가 아이소 3D 인데 2-2 만 평면
   도식이면 같은 사이트로 안 읽힌다 — 평면 안에서 배치만 바꾼 시안이 셋 반려된 뒤 내린 결론이다. */
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

/* ═══ 색 ═══ 덩어리는 [윗면, 왼면, 오른면] 세 짝이다 */
var PAL={
  net  :["#63afe6","#1b4870","#2b6597"],      /* 내 라이브러리 — 파랑 */
  dum  :["#e0a04a","#6b4718","#a8752c"],      /* 내가 만든 더미 — 주황 */
  gray :["#7d8ba3","#333d4e","#4d596e"],      /* 남이 만든 도구 — 무채 */
  crowd:["#4f7cb4","#1e3a54","#2d5276"]       /* 더미가 만드는 여러 명 */
};
var ZPAL={
  out:{top:"#161d2b",side:"#0f1522",edge:"#93a5c2"},   /* 남의 도구가 선 판 — 무채 */
  net:{top:"#111a2b",side:"#0b111d",edge:"#6cc7ff"}
};
var INK={ recv:"#6cc7ff", send:"#ffb648", fg:"#eef2fb", sub:"#8496b3", grn:"#57d694" };

/* ═══ 기본 장면 ═══
   ── 아래 SCENE 은 편집기의 Export 로 통째로 갈아 끼우는 자리다 ──
   그래서 값 설명을 안쪽에 달지 않고 여기 모아 둔다(붙여넣으면 안쪽 주석은 사라지므로).

   vb      무대가 덮는 구간. 얹는 것 셋의 자리는 이 구간을 기준으로 백분율로 잰다.
           ※ 재지 않고 숫자로 둔다. 이 화면은 페이지가 열릴 때 숨어 있어서(1-1 이 첫 화면)
             getBBox() 로 재면 0 이 나온다 — 액자가 14.4x66.7 로 뭉개지고 세로가 6249px 로
             늘어나 그림이 화면 밖으로 밀려났다. 2-2 를 탭으로 열면 빈 액자만 보이던 것이 이것.
             대신 그림을 키우거나 옮기면 vb 도 같이 봐야 한다(액자가 따라오지 않는다).
   pad.l   액자를 무대 왼쪽 밖으로 더 넓히는 폭. 제목·계기판을 카드 왼쪽 끝까지 당기려고 둔다.
           무대는 카드 폭의 82% 라 양옆에 각각 138px 이 논다. 제목이 그 빈 자리로 가려면 액자가
           거기까지 나가 있어야 한다(액자 밖은 잘린다). 그래서 액자를 왼쪽으로 pad.l 만큼 넓히고,
           draw 가 그림틀 자체도 같은 폭만큼 왼쪽으로 빼낸다 — 늘어난 액자와 늘어난 그림틀이
           맞물려 계단은 픽셀 하나 안 움직이고, 왼쪽에 그릴 자리만 생긴다.
           ※ 값을 바꾸면 panel-client.html 의 sc-safe viewBox 도 같이 고칠 것(= vb.x-pad.l, vb.w+pad.l)
   bb      그림 요소 전체의 왼쪽 위 — 제목 자리의 기준
   title   왼쪽 위 한 줄. dx·dy 는 bb 에서 잰 값
   plate   판 하나의 크기(세 단이 같다). v=판이 시작하는 깊이 · h=판 두께
           wordU 는 판 폭 대비 STEP 글씨 자리(0~1), wordV 는 그 깊이
   lane    왕복 통로. gap=덩어리에서 띄우는 여백 · hw=통로 반폭
   ramp    승계 경사로. dv=판에서 잰 깊이 · dz=판 위 높이 · tip=화살촉 길이 · hw=띠 반폭
   overlay 그림 위에 얹는 HTML 넷의 자리. x·y 가 null 이면 제목 밑에서 잰다.
           네 값 다 카드 안쪽 40px 선에 맞춰 잡았다 — 제목·계기판이 왼쪽 위 40px,
           보기 칩·설명 줄이 오른쪽 아래 40px. 두 묶음이 마주 보는 구석을 하나씩 잡고,
           그 사이 대각선을 계단이 지나간다.
           오른쪽 묶음(칩 → 설명 → 노션 문)을 대각선 바로 밑에 두는 시안과 렌더로 대 봤다.
           아래 구석 쪽을 택한 까닭은 맨 아래 문의 밑선(889)이 STEP 1 판 밑선(889)과 같은 선에
           서기 때문이다 — 아래쪽 두 덩어리가 바닥을 나눠 가진다. 위로 올린 시안은 밑에 125px 이
           통째로 비어 떠 보였다. 셋 사이 간격은 11px 로 같다(y 로 맞춘 값이라 눈으로 확인할 것).
           ※ 설명 줄 높이가 곧 아래 여백이다. 넷 다 두 줄이라 고정인데(client.js SAFE.items),
             한 줄만 늘어도 아래로 밀린다. 늘릴 거면 여기 y 를 같이 올릴 것
           ※ 얹는 것은 HTML 이라 액자 밖에 놓여도 잘리지 않는다(잘리는 건 SVG 안의 것뿐).
             오른쪽 묶음의 x 가 액자 오른쪽 끝(1272)을 넘는 것이 그래서 괜찮다
   steps   단 하나 = 판 하나. u·z 가 판의 자리이고, 그 위에 실리는 것은 판에서 잰 오프셋이다
           a=왼쪽(무엇으로 재나) · b=오른쪽(무엇을 재나) · j=판정 한 줄 · jc=판정 색
           a/b 의 du·dv 는 판 기준 자리, w·d·h 는 크기, lab 은 이름표 자리(dy 만 화면 픽셀)
           b.crowd 를 주면 그 위에 작은 덩어리를 n×n 으로 올린다(한 대가 여러 명을 만든다) */
var SCENE={
  vb:{x:300, y:96, w:972, h:580},
  pad:{l:107},
  bb:{x:316.9, y:141.1},
  title:{t:"검증이 끝난 것만 다음 단의 도구가 된다", size:30, dx:-104, dy:-1},
  plate:{v:-50, w:262, d:186, h:14, wordU:.28, wordV:13, wordSize:26},
  lane:{gap:8, hw:9},
  ramp:{dv:22, dz:7, tip:14, hw:13},
  overlay:{
    dash :{id:"d-safe",  x:null, y:null, w:300, lpad:1},
    chips:{id:"ch-safe", x:953,  y:543,  w:406},
    note :{id:"nt-safe", x:953,  y:574,  w:406},
    more :{id:"mo-safe", x:953,  y:630,  w:406}
  },
  steps:[
   {k:"s1", tag:"STEP 1", u:-150, z:0, pal:"out", jc:"grn",
    a:{t:"게임코디 Echo 더미", s:"남이 만든 도구", c:"gray",
       du:18, dv:56, w:66, d:70, h:28, lab:{du:51, dv:126, dz:86, dy:0}},
    b:{t:"내 네트워크 라이브러리", s:"이번에 잴 것", c:"net",
       du:176, dv:54, w:68, d:72, h:28, lab:{du:210, dv:56, dz:0, dy:34}},
    j:"동접 1,000 · 25분 부하 통과"},
   {k:"s2", tag:"STEP 2", u:128, z:54, pal:"net", jc:"grn",
    a:{t:"검증된 라이브러리", s:"STEP 1 을 통과한 것", c:"net",
       du:18, dv:56, w:66, d:70, h:28, lab:{du:51, dv:126, dz:86, dy:0}},
    b:{t:"내가 만든 에코 더미", s:"무결성 검사 · 공격 시험", c:"dum",
       du:176, dv:54, w:68, d:72, h:28, lab:{du:210, dv:56, dz:0, dy:34},
       crowd:{n:5, gap:11, size:9, du:5, dv:5}},
    j:"결함을 넣었더니 첫 패킷에서 걸렸다"},
   {k:"s3", tag:"STEP 3", u:406, z:108, pal:"net", jc:"recv",
    a:{t:"검증된 더미 + 시나리오", s:"STEP 2 를 통과한 것", c:"dum",
       du:18, dv:56, w:66, d:70, h:28, lab:{du:51, dv:126, dz:86, dy:0}},
    b:{t:"서버 + 컨텐츠 전체", s:"이동 · 시야 · 채팅", c:"net",
       du:176, dv:54, w:68, d:72, h:28, lab:{du:210, dv:56, dz:0, dy:34}},
    j:"동접 5,000 — 2-3 부하 검증"}
  ]
};

/* ═══ 그리기 ═══ svg 를 비우고 D(장면)를 그려 넣는다 */
function draw(s,D){
  while(s.firstChild) s.removeChild(s.firstChild);
  /* 액자는 무대보다 왼쪽으로 pad.l 만큼 길고, 그림틀도 같은 폭만큼 왼쪽으로 빠져 있다.
     둘이 같은 값이라 배율이 그대로고(계단이 안 움직인다), 무대 왼쪽 여백에 제목을 그릴 수 있다.
     ※ 좁은 화면에서는 무대가 카드 전폭이라 왼쪽에 뺄 자리가 없다 — client.css 의 1200px
       분기가 이 두 줄을 !important 로 되돌린다(액자만 넓은 채로 남아 그림이 한 단 작아진다). */
  var padL=(D.pad&&D.pad.l)||0;
  s.setAttribute("viewBox",(D.vb.x-padL)+" "+D.vb.y+" "+(D.vb.w+padL)+" "+D.vb.h);
  s.style.width=((D.vb.w+padL)/D.vb.w*100).toFixed(3)+"%";
  s.style.marginLeft=(-padL/D.vb.w*100).toFixed(3)+"%";
  var P=D.plate, STEP=D.steps;
  var RECV=INK.recv, SEND=INK.send, FG=INK.fg, SUB=INK.sub, GRN=INK.grn;
  function pal(k){ return PAL[k]||PAL.gray; }

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

  /* 판 — 뒤(높은 단)부터 그려야 앞 단이 위로 온다 */
  for(var i=STEP.length-1;i>=0;i--){
    var S=STEP[i], zp=ZPAL[S.pal]||ZPAL.net, zg=el("g",{}); gZone.appendChild(zg);
    iprism(zg,S.u,P.v,P.w,P.d,S.z-P.h,P.h,[zp.top,zp.side,zp.side]);
    zg.appendChild(el("line",{x1:ipx(S.u,P.v+P.d),y1:ipy(S.u,P.v+P.d,S.z),
      x2:ipx(S.u+P.w,P.v+P.d),y2:ipy(S.u+P.w,P.v+P.d,S.z),stroke:zp.edge,"stroke-width":"1.6",opacity:".42"}));
    zg.appendChild(el("line",{x1:ipx(S.u+P.w,P.v),y1:ipy(S.u+P.w,P.v,S.z),
      x2:ipx(S.u+P.w,P.v+P.d),y2:ipy(S.u+P.w,P.v+P.d,S.z),stroke:zp.edge,"stroke-width":"1.6",opacity:".42"}));
    var wg=el("g",{transform:ifloor(S.u+P.w*P.wordU,P.v+P.wordV,S.z)});   /* 판에 누운 STEP 글씨 */
    wg.appendChild(el("text",{x:"0",y:"8.8","text-anchor":"middle","font-size":String(P.wordSize),
      "font-weight":"900","letter-spacing":"1.56","font-family":"var(--sans)",
      fill:zp.edge,opacity:".34"},S.tag));
    zg.appendChild(wg);
  }
  /* 칩이 켜는 자리 — 판 셋은 판 윗면, 합격 기준은 왕복 통로. 색은 client.css 가 쥔다 */
  STEP.forEach(function(S){
    var hg=el("g",{class:"cl-hit","data-it":S.k}); gZone.appendChild(hg);
    ipoly(hg,[[S.u,P.v,S.z],[S.u+P.w,P.v,S.z],[S.u+P.w,P.v+P.d,S.z],[S.u,P.v+P.d,S.z]],null,{class:"cl-safep"});
  });
  /* 합격 기준은 판 하나가 아니라 세 단을 가로지르는 잣대다 — 그래서 판이 아니라 왕복 통로를 켠다.
     통로 바닥은 덩어리보다 아래, 테두리는 맨 위라 층을 건너야 해서 같은 data-it 을 둘로 나눴다
     (wireWide 가 .cl-hit 을 전부 순회하므로 둘이 같이 켜진다). */
  var gateLow=el("g",{class:"cl-hit","data-it":"gate"}); gBuild.appendChild(gateLow);
  var gateTop=el("g",{class:"cl-hit","data-it":"gate"});

  STEP.forEach(function(S){
    var bg=el("g",{}); gBuild.appendChild(bg);
    var A=S.a, B=S.b, au=S.u+A.du, bu=S.u+B.du, av=P.v+A.dv, bv=P.v+B.dv;
    shadow(au,av,A.w,A.d,S.z);   iprism(bg,au,av,A.w,A.d,S.z,A.h,pal(A.c),true);
    shadow(bu,bv,B.w,B.d,S.z);   iprism(bg,bu,bv,B.w,B.d,S.z,B.h,pal(B.c),true);
    if(B.crowd){
      var C=B.crowd, cu=[];
      for(var c=0;c<C.n;c++) for(var r=0;r<C.n;r++) cu.push([bu+C.du+c*C.gap, bv+C.dv+r*C.gap]);
      cu.sort(function(p,q){ return idepth(p[0],p[1])-idepth(q[0],q[1]); });
      cu.forEach(function(p){ iprism(bg,p[0],p[1],C.size,C.size,S.z+B.h,C.size,PAL.crowd); });
    }
    /* 두 덩어리 사이를 통째로 쓰는 왕복 — 이 단이 무엇으로 재는지가 여기 있다.
       통로는 왼쪽 덩어리의 한가운데 깊이에 놓인다(av + A.d/2). */
    var u1=au+A.w+D.lane.gap, u2=bu-D.lane.gap, cv=av+A.d/2, z=S.z, hw=D.lane.hw;
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
  for(var r=0;r<STEP.length-1;r++){
    var A2=STEP[r], B2=STEP[r+1], R=D.ramp, vA=P.v+R.dv;
    var uA=A2.u+A2.b.du+A2.b.w, uB=B2.u+B2.a.du+6;
    var du=(uB-R.tip)-uA, Ln=Math.hypot(du,0), pv=Ln?du/Ln*R.hw:0;
    ipoly(gRamp,[[uA,vA+pv,A2.z+R.dz],[uB-R.tip,vA+pv,B2.z+R.dz],
                 [uB-R.tip,vA-pv,B2.z+R.dz],[uA,vA-pv,A2.z+R.dz]],
      pal(A2.b.c)[2],{opacity:".55"});
    ipoly(gRamp,[[uB-R.tip,vA-12,B2.z+R.dz],[uB-R.tip,vA+12,B2.z+R.dz],[uB,vA,B2.z+R.dz]],GRN);
  }

  /* 이름·판정 */
  STEP.forEach(function(S){
    var A=S.a, B=S.b;
    var ax=ipx(S.u+A.lab.du,P.v+A.lab.dv), ay=ipy(S.u+A.lab.du,P.v+A.lab.dv,S.z+A.lab.dz)+(A.lab.dy||0);
    lb(ax,ay,A.t,13.5,FG,"800");  lb(ax,ay+15,A.s,10.5,GRN,"700");
    var bx=ipx(S.u+B.lab.du,P.v+B.lab.dv), by=ipy(S.u+B.lab.du,P.v+B.lab.dv,S.z+B.lab.dz)+(B.lab.dy||0);
    lb(bx,by,B.t,13.5,FG,"800"); lb(bx,by+15,B.s,10.5,SUB,"600");
    lb(bx,by+33,"✔ "+S.j,11,INK[S.jc]||GRN,"700");
  });
  gBuild.appendChild(gateTop);

  /* ── 왼쪽 위 — 이 그림이 무슨 말을 하는지 한 줄 ──
     한때 아래에 설명 두 줄('그래서 첫 도구는 내가 만들지 않은 것이어야 한다' 외)이 더 있었다.
     제목이 이미 그 말을 하고 있어서 걷어냈고, 대신 남은 한 줄을 18 → 30 으로 키웠다.
     크기를 올릴 때 같이 손봐야 하는 것이 셋이다 — 안 맞추면 커진 만큼 어색해진다:
       · 자간을 죈다(-0.02em). 페이지의 다른 큰 제목(.cr-hd b)이 쓰는 값이다.
       · 기준선을 (size-18)*.55 만큼 내린다. 글자는 기준선 위로 자라므로 그냥 키우면 위 여백을 판다.
       · 아래 계기판이 시작하는 높이도 같은 비율로 민다(titleDrop). 안 밀면 제목에 달라붙는다. */
  var T=D.title, tx=D.bb.x+T.dx, ty0=D.bb.y+T.dy;
  gLbl.appendChild(el("text",{x:tx.toFixed(1),y:(ty0+(T.size-18)*.55).toFixed(1),
    "font-size":String(T.size), fill:FG,"font-weight":"800","text-anchor":"start",
    "font-family":"var(--sans)","letter-spacing":(-0.02*T.size).toFixed(2)},T.t));
  return s;
}

/* 계기판이 시작하는 높이 — 제목 크기를 따라 내려간다 */
function titleDrop(D){ return 32*D.title.size/18+(D.title.size-18)*.55; }

/* 얹는 것 넷의 자리를 잰다 → [{id, left, marginTop, width, lpad}] (백분율 문자열)
   얹는 것은 무대(.sf-stage) 안에 놓이므로 % 의 기준이 무대 폭이고, 무대가 덮는 액자 구간이
   vb 다(액자 전체가 아니다 — 왼쪽 pad.l 은 무대 밖이라 그쪽 자리는 % 가 음수로 나온다).
   marginTop 을 쓰는 까닭도 같다 — 그 % 는 높이가 아니라 폭 기준이라 그림 높이가 폭을 따라간다.
   왼쪽 위에는 잰 자리 셋, 오른쪽 아래 빈 삼각형에는 보기 칩 · 설명을 세로로 쌓는다.
   x 928 은 STEP 2 이름표(x 852~1080)를 피해 잡은 값이다. */
function place(D){
  var T=D.title, dx=D.bb.x+T.dx, dy=D.bb.y+T.dy+titleDrop(D), out=[];
  ["dash","chips","note","more"].forEach(function(k){
    var o=D.overlay[k]; if(!o) return;
    var x=(o.x==null)?dx:o.x, y=(o.y==null)?dy:o.y;
    out.push({id:o.id, key:k, x:x, y:y, w:o.w, lpad:!!o.lpad,
      left:((x-D.vb.x)/D.vb.w*100).toFixed(3)+"%",
      marginTop:((y-D.vb.y)/D.vb.w*100).toFixed(3)+"%",
      width:(o.w/D.vb.w*100).toFixed(3)+"%"});
  });
  return out;
}

/* 얹는 것을 실제 DOM 에 앉힌다(편집기는 place 만 쓰고 이쪽은 안 쓴다).
   계기판만 왼쪽으로 1.195cqw 당긴다 — 기둥 선과 안여백을 빼야 글자 왼쪽이 제목과 한 선에 선다. */
function apply(D,doc){
  place(D).forEach(function(p){
    var e=(doc||document).getElementById(p.id); if(!e) return;
    e.style.left=p.lpad?("calc("+p.left+" - 1.195cqw)"):p.left;
    e.style.marginTop=p.marginTop;
    e.style.width=p.width;
  });
}

function clone(o){ return JSON.parse(JSON.stringify(o)); }

window.SafeScene={
  SCENE:SCENE, draw:draw, place:place, apply:apply, clone:clone,
  titleDrop:titleDrop, PAL:PAL, ZPAL:ZPAL, INK:INK,
  iso:{ipx:ipx, ipy:ipy, ipt:ipt, ipoly:ipoly, iprism:iprism, ifloor:ifloor, idepth:idepth, el:el}
};
})();
