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

/* ═══ 레일 치수·색 ═══ 1-1 구조도(scene.js)에서 그대로 가져온 값이다.
   같은 사이트에서 레일이 두 가지 모양이면 2-2 만 다른 그림으로 읽힌다 — 아이소 투영을 맞춘 것과 같은 이유다.
   scene.js 대응: SUB_W 10(줄 하나 폭) · SUB_GAP 4 · SEAM 22(이음선 간격) · K 4.0(셰브론 꺾임 깊이)
                  LTINT.recv #16243a · LTINT.send #2a2412 · 이음선 #4e6390 .42
                  그루브 모서리 — 화면 위쪽은 그늘 #060a13 .6, 아래쪽은 빛 #55688f .28 */
var SEAM=22, SEAM_K=4.0, SEAM_COL="#4e6390";
var RIM_UP="#060a13", RIM_DN="#55688f";
/* 한 레일에 흐르는 칩 수와 크기. 1-1 의 칩은 화면 반폭 5 = 월드 한 변 5/KX ≒ 5.8 이라 반변 2.9 다 */
var CHIPN=3, CHIPH=2.9;

/* ═══ 색 ═══ 덩어리는 [윗면, 왼면, 오른면] 세 짝이다 */
var PAL={
  net  :["#63afe6","#1b4870","#2b6597"],      /* 내 라이브러리 — 파랑 */
  dum  :["#e0a04a","#6b4718","#a8752c"],      /* 내가 만든 더미 — 주황 */
  gray :["#7d8ba3","#333d4e","#4d596e"],      /* 이미 검증된 더미 — 무채 */
  crowd:["#4f7cb4","#1e3a54","#2d5276"]       /* 더미가 만드는 여러 명 */
};
var ZPAL={
  out:{top:"#161d2b",side:"#0f1522",edge:"#93a5c2"},   /* 밖에서 가져온 도구가 선 판 — 무채 */
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
   bb      그림 요소 전체의 왼쪽 위
   plate   판 하나의 크기(세 단이 같다). v=판이 시작하는 깊이 · h=판 두께
           wordU 는 판 폭 대비 STEP 글씨 자리(0~1), wordV 는 그 깊이
   lane    왕복 레일 둘. gap=덩어리에서 띄우는 여백 · hw=레일 하나의 반폭 · sep=두 레일 중심 사이
           위(먼 쪽)가 보내는 길, 아래(가까운 쪽)가 돌아오는 길이다 — v 가 클수록 화면 위로 간다
           hw 5 · sep 14 는 1-1 구조도의 다중 레일 치수 그대로다(줄 폭 10 · 줄 간격 4)
   ramp    승계 경사로. dv=판에서 잰 깊이 · dz=판 위 높이 · tip=화살촉 길이 · hw=띠 반폭
   overlay 그림 위에 얹는 HTML 넷의 자리.
           ── 한때 제목도 여기 있었다 ──
           처음에는 SVG 안에 그린 글자였고(size 30), 다음에는 이 목록의 다섯째였다. 지금은 카드
           밖 HTML 제목이다(parts/panel-client.html 의 .cr-title) — 2-1 과 카드 윗변까지 맞추려면
           제목이 카드 밖에 있어야 했다. 제목이 빠지면서 vb 위쪽도 그만큼 잘라 냈고(96 → 138),
           계기판이 제목이 비운 자리로 올라왔다(y 200 → 148 · x 212.9 → 205.6). 두 값은 2-1 에
           맞춘 것이다 — y 는 카드 안 첫 글줄 높이, x 는 계기판 기둥선을 카드 안여백 선에 세우는 값.
           넷 다 카드 안쪽 여백 선에 맞춰 잡았다 — 계기판이 왼쪽 위, 보기 칩·설명 줄이 오른쪽 아래.
           두 묶음이 마주 보는 구석을 하나씩 잡고, 그 사이 대각선을 계단이 지나간다.
           ※ 오른쪽 묶음의 x 1029 는 '오른쪽 끝을 카드 안여백 선에 붙인' 값이다(옛 953 에서 +76).
             설명 상자 폭을 406 → 331 로 줄이면서 오른쪽 끝이 그만큼 왼쪽으로 당겨졌는데, x 를
             안 옮기면 오른쪽 구석이 통째로 빈다. 폭을 다시 건드리면 이 x 도 같이 봐야 한다.
           오른쪽 묶음(칩 → 설명 → 노션 문)을 대각선 바로 밑에 두는 시안과 렌더로 대 봤다.
           아래 구석 쪽을 택한 까닭은 맨 아래 문의 밑선(889)이 STEP 1 판 밑선(889)과 같은 선에
           서기 때문이다 — 아래쪽 두 덩어리가 바닥을 나눠 가진다. 위로 올린 시안은 밑에 125px 이
           통째로 비어 떠 보였다. 셋 사이 간격은 11px 로 같다(y 로 맞춘 값이라 눈으로 확인할 것).
           ※ 폭은 칩 줄이 406, 설명·문이 331 로 서로 다르다. 칩 줄은 알약 넷이 차지하는 만큼만
             쓰고(406 안에서 남는다), 설명·문은 그 알약 줄의 오른쪽 끝에 맞춘 값이 331 이다 —
             넷을 다 406 으로 두면 설명 상자만 칩 줄보다 오른쪽으로 삐져나온다.
             더 줄이는 쪽은 290 에서 보기 ②(가장 긴 문구)가 세 줄이 되어 아래 문과 겹친다(실측).
           ※ 설명 줄 높이가 곧 아래 여백이다. 넷 다 두 줄이라 고정인데(client.js SAFE.items),
             한 줄만 늘어도 밑의 more 와 글자가 겹친다(more 의 y 는 고정이다).
             설명을 한 줄에서 두 줄로 늘렸을 때는 more 를 내리지 않고 chips·note 를 16 씩 올렸다
             (543·574 → 527·558) — more 를 내리면 밑선 정렬이 깨지고, 이렇게 하면 셋 사이 간격까지 그대로다
           ※ 얹는 것은 HTML 이라 액자 밖에 놓여도 잘리지 않는다(잘리는 건 SVG 안의 것뿐).
             오른쪽 묶음의 x 가 액자 오른쪽 끝(1272)을 넘는 것이 그래서 괜찮다
   steps   단 하나 = 판 하나. u·z 가 판의 자리이고, 그 위에 실리는 것은 판에서 잰 오프셋이다
           a=왼쪽(무엇으로 재나) · b=오른쪽(무엇을 재나) · j=판정 한 줄 · jc=판정 색
           a/b 의 du·dv 는 판 기준 자리, w·d·h 는 크기, lab 은 이름표 자리(dy 만 화면 픽셀)
           b.crowd 를 주면 그 위에 작은 덩어리를 n×n 으로 올린다(한 대가 여러 명을 만든다)
           ※ STEP 3 만 b.lab.dy 가 48 이다(나머지는 34) — 부제에 '존이동' 이 붙어 넉 자 늘면서
             판 오른쪽 모서리 선이 글자 사이를 관통했다. 라벨 세 줄을 통째로 선 밑으로 내린 값이다
             (2 배 확대로 확인. 눈금 하나짜리 차이라 100% 렌더에서는 잘 안 보인다) */
var SCENE={
  vb:{x:300, y:138, w:972, h:538},
  pad:{l:107},
  bb:{x:316.9, y:141.1},
  plate:{v:-50, w:262, d:186, h:14, wordU:.28, wordV:13, wordSize:26},
  lane:{gap:8, hw:5, sep:14},
  ramp:{dv:22, dz:7, tip:14, hw:13},
  overlay:{
    dash :{id:"d-safe",  x:205.6, y:148, w:300, lpad:1},
    chips:{id:"ch-safe", x:1029, y:527,  w:406},
    note :{id:"nt-safe", x:1029, y:558,  w:331},
    more :{id:"mo-safe", x:1029, y:614,  w:331}
  },
  steps:[
   {k:"s1", tag:"STEP 1", u:-150, z:0, pal:"out", jc:"grn",
    a:{t:"게임코디 Echo 더미", s:"이미 검증된 더미", c:"gray",
       du:18, dv:56, w:66, d:70, h:28, lab:{du:51, dv:126, dz:86, dy:0}},
    b:{t:"내 네트워크 라이브러리", s:"이번에 잴 것", c:"net",
       du:176, dv:54, w:68, d:72, h:28, lab:{du:210, dv:56, dz:0, dy:34}},
    j:"동접 1,000, STEP1 통과"},
   {k:"s2", tag:"STEP 2", u:128, z:54, pal:"net", jc:"grn",
    a:{t:"내 네트워크 라이브러리", s:"STEP 1 을 통과한 것", c:"net",
       du:18, dv:56, w:66, d:70, h:28, lab:{du:51, dv:126, dz:86, dy:0}},
    b:{t:"커스텀 에코더미", s:"무결성 검사 · 공격 시험", c:"dum",
       du:176, dv:54, w:68, d:72, h:28, lab:{du:210, dv:56, dz:0, dy:34},
       crowd:{n:5, gap:11, size:9, du:5, dv:5}},
    j:"결함 주입, 첫 패킷에서 검출"},
   {k:"s3", tag:"STEP 3", u:406, z:108, pal:"net", jc:"recv",
    a:{t:"더미 클라이언트", s:"STEP 2 를 통과한 것", c:"dum",
       du:18, dv:56, w:66, d:70, h:28, lab:{du:51, dv:126, dz:86, dy:0}},
    b:{t:"서버 + 컨텐츠 전체", s:"이동 · 시야 · 채팅 · 존이동", c:"net",
       du:176, dv:54, w:68, d:72, h:28, lab:{du:210, dv:56, dz:0, dy:48}},
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
  /* 마지막 인자 par 는 '어느 자루에 넣을까' 다. 층(gShad·gLbl)은 그대로 두고 그 안에서 단별로
     한 겹 더 싼다 — 애니가 단위로 켜고 끄려면 단마다 자루가 하나씩 있어야 하고, 반투명한 것
     (그림자 .40 · 경사로 .55 · 판 글씨 .34)은 자기 자신에 애니를 걸면 opacity 가 1 로 덮인다. */
  function shadow(u,v,w,d,z,par){ (par||gShad).appendChild(el("ellipse",
    {cx:ipx(u+w/2,v+d/2), cy:ipy(u+w/2,v+d/2,z||0)+5, rx:(w+d)*.36, ry:(w+d)*.12,
     fill:"#04060c", opacity:".40", filter:"url(#sfShadow)"})); }
  function lb(x,y,t,size,col,w,anc,par){
    (par||gLbl).appendChild(el("text",{x:x.toFixed(1),y:y.toFixed(1),"font-size":String(size),fill:col,
      "font-weight":w||"700","text-anchor":anc||"middle","font-family":"var(--sans)"},t)); }
  var LG={};   /* 단별 글자 자루 — 덩어리 루프에서 만들고 이름·판정 루프에서 다시 쓴다 */

  /* 판 — 뒤(높은 단)부터 그려야 앞 단이 위로 온다 */
  for(var i=STEP.length-1;i>=0;i--){
    var S=STEP[i], zp=ZPAL[S.pal]||ZPAL.net, zg=el("g",{"data-st":S.k}); gZone.appendChild(zg);
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
    /* data-st 를 여기에도 단다 — 안 달면 칩이 켜 둔 테두리만 단이 서기 전부터 혼자 떠 있다.
       칠하는 폴리곤(.cl-safep)이 아니라 자루에 다는 것이 중요하다: 폴리곤에 직접 애니를 걸면
       keyframes 끝의 opacity:1 이 '평소엔 안 보인다'(.cl-hit .cl-safep{opacity:0})를 덮어써서
       테두리가 영영 켜진 채로 남는다. */
    var hg=el("g",{class:"cl-hit","data-it":S.k,"data-st":S.k}); gZone.appendChild(hg);
    ipoly(hg,[[S.u,P.v,S.z],[S.u+P.w,P.v,S.z],[S.u+P.w,P.v+P.d,S.z],[S.u,P.v+P.d,S.z]],null,{class:"cl-safep"});
  });
  /* 합격 기준은 판 하나가 아니라 세 단을 가로지르는 잣대다 — 그래서 판이 아니라 왕복 통로를 켠다.
     통로 바닥은 덩어리보다 아래, 테두리는 맨 위라 층을 건너야 해서 같은 data-it 을 둘로 나눴다
     (wireWide 가 .cl-hit 을 전부 순회하므로 둘이 같이 켜진다). */
  var gateLow=el("g",{class:"cl-hit","data-it":"gate"}); gBuild.appendChild(gateLow);
  var gateTop=el("g",{class:"cl-hit","data-it":"gate"});

  STEP.forEach(function(S){
    var bg=el("g",{"data-st":S.k}); gBuild.appendChild(bg);
    var sg=el("g",{"data-st":S.k}); gShad.appendChild(sg);
    var lg=el("g",{"data-st":S.k}); gLbl.appendChild(lg); LG[S.k]=lg;
    var A=S.a, B=S.b, au=S.u+A.du, bu=S.u+B.du, av=P.v+A.dv, bv=P.v+B.dv;
    shadow(au,av,A.w,A.d,S.z,sg);   iprism(bg,au,av,A.w,A.d,S.z,A.h,pal(A.c),true);
    shadow(bu,bv,B.w,B.d,S.z,sg);   iprism(bg,bu,bv,B.w,B.d,S.z,B.h,pal(B.c),true);
    if(B.crowd){
      var C=B.crowd, cu=[];
      for(var c=0;c<C.n;c++) for(var r=0;r<C.n;r++) cu.push([bu+C.du+c*C.gap, bv+C.dv+r*C.gap]);
      cu.sort(function(p,q){ return idepth(p[0],p[1])-idepth(q[0],q[1]); });
      cu.forEach(function(p){ iprism(bg,p[0],p[1],C.size,C.size,S.z+B.h,C.size,PAL.crowd); });
    }
    /* 두 덩어리 사이를 통째로 쓰는 왕복 — 이 단이 무엇으로 재는지가 여기 있다.
       한 줄로 갔다 오는 대신 레일을 둘 깐다. 가는 길과 오는 길이 따로 있으면 '왕복' 이 멈춰 있는
       그림에서도 읽힌다 — 화살촉이 서로 반대 끝을 가리키기 때문이다.
       레일 짝의 한가운데(cv)는 왼쪽 덩어리의 한가운데 깊이다(av + A.d/2). */
    var u1=au+A.w+D.lane.gap, u2=bu-D.lane.gap, cv=av+A.d/2, z=S.z;
    var hw=D.lane.hw, sep=D.lane.sep||0;
    /* v 가 클수록 화면 위(먼 쪽)라 보내는 길이 위, 돌아오는 길이 아래로 온다 */
    var RAIL=[{k:"snd", v:cv+sep/2, col:SEND, tint:"#2a2412", dir: 1},   /* 보냄 — 왼 → 오 */
              {k:"rcv", v:cv-sep/2, col:RECV, tint:"#16243a", dir:-1}];  /* 받음 — 오 → 왼 */
    /* 칩이 도는 구간과 그 이동량(화면 픽셀). v·z 가 고정이고 u 만 움직이므로 화면에서도 직선이라
       이동이 순수 평행이동이다 — transform 하나로 끝난다. 두 방향 다 왼쪽 끝에 그려 두고
       --dx·--dy 만큼 오른쪽으로 미는데, 돌아오는 쪽은 CSS 가 그 끝에서 거꾸로 재생한다(sfRcv). */
    var cu0=u1+4, cu9=u2-4, cz=z+2;
    var pdx=(ipx(cu9,cv)-ipx(cu0,cv)).toFixed(1), pdy=(ipy(cu9,cv,cz)-ipy(cu0,cv,cz)).toFixed(1);
    RAIL.forEach(function(R){
      /* 레일 바닥만 단 자루 밖에 산다 — '합격 기준' 칩이 여섯 레일을 한꺼번에 켜려면 .cl-hit 안에
         있어야 해서다. 그래서 자루 대신 자기 자신에 data-st 를 달아 애니가 단을 알아보게 한다
         (fill 만 쓰는 폴리곤이라 opacity 애니에 잃을 것이 없다).
         sf-rsnd·sf-rrcv 는 '이 레일이 가는 길인가 오는 길인가' — 바닥색과 결함 검출 시안이 이걸로 갈린다. */
      ipoly(gateLow,[[u1,R.v-hw,z],[u2,R.v-hw,z],[u2,R.v+hw,z],[u1,R.v+hw,z]],R.tint,
        {class:"cl-lane sf-r"+R.k,"data-st":S.k});
      /* 그루브 모서리 — 채널이 바닥에 파여 있어 보이게. +v 쪽이 화면 위라 그쪽이 그늘이다 */
      [[hw,RIM_UP,".6"],[-hw,RIM_DN,".28"]].forEach(function(E){
        bg.appendChild(el("line",{x1:ipx(u1,R.v+E[0]).toFixed(1),y1:ipy(u1,R.v+E[0],z).toFixed(1),
          x2:ipx(u2,R.v+E[0]).toFixed(1),y2:ipy(u2,R.v+E[0],z).toFixed(1),
          stroke:E[1],"stroke-width":"1",opacity:E[2]}));
      });
      /* 이음선(셰브론) — 화살촉을 따로 얹지 않고 이 선이 방향을 말한다(1-1 과 같은 방식).
         레일마다 제 진행 쪽으로 꺾이므로, 멈춘 그림에서도 두 레일이 서로 반대로 흐르는 게 보인다. */
      for(var d=SEAM; d<(u2-u1)-2; d+=SEAM){ var su=u1+d;
        bg.appendChild(el("polyline",{points:[[su,R.v+hw],[su+R.dir*SEAM_K,R.v],[su,R.v-hw]]
          .map(function(q){ return ipt(q[0],q[1],z); }).join(" "),
          fill:"none",stroke:SEAM_COL,"stroke-width":"1","stroke-linejoin":"round",opacity:".42"}));
      }
      /* 흐르는 칩 — 1-1 과 같이 바닥에 누운 납작한 사각형이다(입체 덩어리가 아니다).
         한 알이 아니라 셋이 줄지어 간다. 평소엔 opacity 0 이라 안 보이고, 켜는 것은 CSS 다.
         data-ci 는 줄 안에서 몇 번째인가 — 출발을 조금씩 늦추는 데 쓰고, 결함 검출 시안은
         '첫 패킷' 을 이 값으로 집어낸다.
         단 이름을 data-st 가 아니라 data-pk 로 다는 까닭 — 칩은 '단이 서는' 애니에 끼면 안 된다.
         [data-st] 로 한꺼번에 잡히는 자리라 이름을 갈라 둔다. */
      for(var c=0;c<CHIPN;c++){
        var pg=el("g",{class:"sf-pk sf-"+R.k,"data-pk":S.k,"data-ci":String(c),opacity:"0",
          style:"--dx:"+pdx+"px; --dy:"+pdy+"px; --ci:"+c});
        ipoly(pg,[[cu0-CHIPH,R.v-CHIPH,cz],[cu0+CHIPH,R.v-CHIPH,cz],
                  [cu0+CHIPH,R.v+CHIPH,cz],[cu0-CHIPH,R.v+CHIPH,cz]],R.col);
        bg.appendChild(pg);
      }
    });
    /* 강조 테두리는 레일 바깥으로 띄운다 — 안을 덮으면 레일 바닥색(보냄 갈색 · 받음 남색)과
       그 위를 흐르는 칩이 탁해진다(2배로 확대해 확인했다). 안쪽은 바닥색만 밝힌다.
       테두리는 레일마다가 아니라 둘을 통째로 두른다 — 합격 기준은 왕복 한 벌에 매기는 것이다.
       gateTop 자체는 세 단이 함께 쓰는 .cl-hit 이라 거기에는 data-st 를 못 달고,
       그 안에 단별 자루를 하나 더 둔다(.cl-hit .cl-safep 은 자손 선택자라 한 겹 더 싸도 그대로 듣는다) */
    var gtw=el("g",{"data-st":S.k}); gateTop.appendChild(gtw);
    var ohw=sep/2+hw+9;
    ipoly(gtw,[[u1-20,cv,z],[u1,cv-ohw,z],[u2,cv-ohw,z],
                   [u2+20,cv,z],[u2,cv+ohw,z],[u1,cv+ohw,z]],null,{class:"cl-safep"});
    var mx=ipx((u1+u2)/2,cv), my=ipy((u1+u2)/2,cv,z+46);
    lb(mx,my,"에코",12,RECV,"800",null,lg);
    lb(mx,my+13,"보내고 그대로 받는다",9,SUB,"600",null,lg);
  });

  /* 승계 — 통과한 대상이 경사로를 타고 올라가 다음 단의 도구가 된다 */
  for(var r=0;r<STEP.length-1;r++){
    var A2=STEP[r], B2=STEP[r+1], R=D.ramp, vA=P.v+R.dv;
    /* 경사로는 올라가 닿는 쪽(다음 단)의 data-st 를 단다 — 애니에서 '다음 단이 열리는 신호' 라서 */
    var rg=el("g",{class:"sf-ramp","data-st":B2.k}); gRamp.appendChild(rg);
    var uA=A2.u+A2.b.du+A2.b.w, uB=B2.u+B2.a.du+6;
    var du=(uB-R.tip)-uA, Ln=Math.hypot(du,0), pv=Ln?du/Ln*R.hw:0;
    ipoly(rg,[[uA,vA+pv,A2.z+R.dz],[uB-R.tip,vA+pv,B2.z+R.dz],
                 [uB-R.tip,vA-pv,B2.z+R.dz],[uA,vA-pv,A2.z+R.dz]],
      pal(A2.b.c)[2],{opacity:".55"});
    ipoly(rg,[[uB-R.tip,vA-12,B2.z+R.dz],[uB-R.tip,vA+12,B2.z+R.dz],[uB,vA,B2.z+R.dz]],GRN);
  }

  /* 이름·판정 */
  STEP.forEach(function(S){
    var A=S.a, B=S.b, lg=LG[S.k]||gLbl;
    var ax=ipx(S.u+A.lab.du,P.v+A.lab.dv), ay=ipy(S.u+A.lab.du,P.v+A.lab.dv,S.z+A.lab.dz)+(A.lab.dy||0);
    lb(ax,ay,A.t,13.5,FG,"800",null,lg);  lb(ax,ay+15,A.s,10.5,GRN,"700",null,lg);
    var bx=ipx(S.u+B.lab.du,P.v+B.lab.dv), by=ipy(S.u+B.lab.du,P.v+B.lab.dv,S.z+B.lab.dz)+(B.lab.dy||0);
    lb(bx,by,B.t,13.5,FG,"800",null,lg); lb(bx,by+15,B.s,10.5,SUB,"600",null,lg);
    /* 판정줄만 따로 잡아 둔다 — 애니가 '단이 통과했다' 를 마지막에 찍는 자리다 */
    lb(bx,by+33,"✔ "+S.j,11,INK[S.jc]||GRN,"700",null,lg);
    lg.lastChild.setAttribute("class","sf-judge");
  });
  gBuild.appendChild(gateTop);

  /* ※ 탭 제목은 여기서 그리지 않는다 — 2-1 과 카드 윗변까지 맞추려고 카드 밖 HTML 로 꺼냈다
     (parts/panel-client.html 의 .cr-title). 위 SCENE.overlay 주석에 경위가 있다. */
  return s;
}

/* 얹는 것 넷의 자리를 잰다 → [{id, left, marginTop, width, lpad}] (백분율 문자열)
   얹는 것은 무대(.sf-stage) 안에 놓이므로 % 의 기준이 무대 폭이고, 무대가 덮는 액자 구간이
   vb 다(액자 전체가 아니다 — 왼쪽 pad.l 은 무대 밖이라 그쪽 자리는 % 가 음수로 나온다).
   marginTop 을 쓰는 까닭도 같다 — 그 % 는 높이가 아니라 폭 기준이라 그림 높이가 폭을 따라간다.
   왼쪽 위에는 계기판, 오른쪽 아래 빈 삼각형에는 보기 칩 · 설명을 세로로 쌓는다.
   오른쪽 묶음의 x 는 SCENE.overlay 에 있다(지금 1029). 세로로는 STEP 2 이름표보다 한참 아래라
   가로로 겹칠 일이 없다 — 옛 928 시절의 '이름표를 피한 값' 이라는 제약은 지금은 안 걸린다. */
function place(D){
  var out=[];
  ["dash","chips","note","more"].forEach(function(k){
    var o=D.overlay[k]; if(!o) return;
    out.push({id:o.id, key:k, x:o.x, y:o.y, w:o.w, lpad:!!o.lpad,
      left:((o.x-D.vb.x)/D.vb.w*100).toFixed(3)+"%",
      marginTop:((o.y-D.vb.y)/D.vb.w*100).toFixed(3)+"%",
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
  PAL:PAL, ZPAL:ZPAL, INK:INK,
  iso:{ipx:ipx, ipy:ipy, ipt:ipt, ipoly:ipoly, iprism:iprism, ifloor:ifloor, idepth:idepth, el:el}
};
})();
