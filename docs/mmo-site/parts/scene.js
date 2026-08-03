/* ═══════════ 씬: 배치 에디터(mmo-edit.html) Export를 데이터로 재구성 ═══════════
   LAYOUT/RAILS/LABELS = 에디터에서 배치한 좌표. 칩 흐름(Stage2)도 이 RAILS에서 경로를 뽑아 쓰므로,
   에디터에서 레일을 다시 그어 Export만 갈아끼우면 애니메이션까지 같이 따라온다. */
(function(){
const SVGNS="http://www.w3.org/2000/svg";
const svg=document.getElementById("scene");
function el(t,a,txt){ const e=document.createElementNS(SVGNS,t);
  if(a) for(const k in a) e.setAttribute(k,a[k]);
  if(txt!=null) e.textContent=txt; return e; }

/* 아이소 투영 */
const KX=0.86, KY=0.46, OX=560, OY=560;
/* ═══ 요각(YAW) — 바닥을 수직축 둘레로 몇 도 돌려서 보느냐 ═══
   0 이면 옛 좌우대칭 아이소, 음수면 시계방향. −12 는 GAME 판을 조금 더 정면으로 돌린 자세다.
   KX·KY 는 45° 대칭일 때의 값이라 각도를 넣으려면 한 단계 되돌려야 한다:
     AXLEN = 축 한 칸이 화면에서 갖는 길이      = KX / cos45
     ELEV  = 카메라 고도의 sin                  = KY / (AXLEN·sin45)
   축의 월드 방위 ψ 에 대해   x = AXLEN·cosψ ,  y = −AXLEN·sinψ·ELEV   (u축 ψ=45+YAW · v축 ψ=135+YAW)
   YAW=0 을 넣으면 ax=KX, bx=−KX, ay=by=−KY 로 옛 값이 그대로 나온다 — 되돌리려면 이 한 줄만 0 으로. */
const YAW=-12;
const AXLEN=KX/Math.cos(Math.PI/4), ELEV=KY/(AXLEN*Math.sin(Math.PI/4));
const YU=(45+YAW)*Math.PI/180, YV=(135+YAW)*Math.PI/180;
/* 아이소 기준 기저 — PJ 는 평면 사본을 뽑는 동안 잠시 FPJ 로 바뀐다.
   '바닥 위 앞뒤 순서', '어느 모서리가 화면 위인가', '바닥에 누운 칩 모양' 처럼
   두 사본이 반드시 같은 답을 내야 하는 계산은 PJ 가 아니라 이 값을 본다(평면에서 판정이 뒤집히면 전환 애니가 어긋난다). */
const ISO={ax:AXLEN*Math.cos(YU),               bx:AXLEN*Math.cos(YV),
           ay:-AXLEN*Math.sin(YU)*ELEV,         by:-AXLEN*Math.sin(YV)*ELEV};
/* ═══ 투영을 상수가 아니라 값으로 들고 있는 이유 ═══
   병목 지도는 같은 씬을 '위에서 내려다본 평면' 으로 한 벌 더 그린다(전환 애니의 도착 그림).
   두 그림은 배치·도형이 같고 투영만 다르므로, 투영을 이렇게 일반형으로 빼 두면
   드로잉 코드를 한 줄도 안 고치고 같은 함수로 두 벌을 뽑을 수 있다.
       px = cx + ax·u + bx·v
       py = cy + ay·u + by·v − kz·z
   아이소  : ax=KX  bx=−KX  cx=OX / ay=−KY by=−KY cy=OY / kz=1
   평면    : ax=S   bx=0    cx=… / ay=0    by=−S   cy=…  / kz=0  ← 높이가 사라져 발자국만 남는다
   PJ.iso 는 YAW=0 일 때만 켜지는 지름길이다(대칭이라야 (u−v)·KX 로 접힌다).
   칩 흐름 루프가 매 프레임 부르는 자리라 곱셈 두 번을 아끼는 뜻인데, 각도를 주면 일반형으로 가야 맞다. */
const PJ={iso:(YAW===0), ax:ISO.ax, bx:ISO.bx, cx:OX, ay:ISO.ay, by:ISO.by, cy:OY, kz:1};
const px=(u,v)=>PJ.iso?OX+(u-v)*KX:PJ.cx+PJ.ax*u+PJ.bx*v;
const py=(u,v,z)=>PJ.iso?OY-(u+v)*KY-(z||0):PJ.cy+PJ.ay*u+PJ.by*v-PJ.kz*(z||0);
const P=(u,v,z)=>px(u,v).toFixed(1)+","+py(u,v,z).toFixed(1);
function poly(pts,fill,extra){ return el("polygon",Object.assign(
  {points:pts.map(p=>P(p[0],p[1],p[2]||0)).join(" "),fill},extra||{})); }
/* ═══ 와이어프레임(청사진) — 병목 지도 전용 ═══
   배치·각도·도형은 설계 탭과 똑같고, 면을 칠하는 방식만 바꾼다:
   면은 바탕에 가까운 어두운 값으로 채우고(뒤가 안 비치게) 그 위에 격자선을 긋는다.
   WSTEP = 격자 한 칸(월드 단위). 0 이면 외곽선만 — 구역 판처럼 넓은 면에 쓴다
   (판에 같은 칸을 주면 칸 수가 폭발해 그림이 촘촘해진다).
   WIRE=0 이면 아래 prism 은 옛 경로 그대로라 설계 탭은 픽셀 단위로 지금과 같다. */
let WIRE=0, WSTEP=26;
/* ═══ 평면 모드 — 병목 지도의 '도착 그림'을 뽑을 때만 1 ═══
   투영(PJ)만 바꿔서는 안 되고 값 몇 개를 같이 갈아야 평면도로 읽힌다(라벨 자리·구역 글자·접지 그림자).
   ※ 절대 규칙: 여기서 바뀌는 것은 '값' 뿐이다. 도형을 더하거나 빼면 아이소 그림과 요소 수가 어긋나
      전환 애니(같은 자리끼리 값을 이어 붙인다)가 통째로 성립하지 않는다.
      빼고 싶은 것이 있으면 지우지 말고 opacity 를 0 으로 둘 것 — 그러면 보간이 알아서 페이드로 만든다. */
let FLAT=0;
const WF={fill:"rgba(120,195,255,.055)", edge:"rgba(150,210,255,.62)", grid:"rgba(140,205,255,.30)"};
const WFO={t:"#16283f", l:"#0b1726", r:"#0f2033"};   /* 면 3개의 명도 3단 — 이래야 상자 모양이 남는다 */
function wireBox(g,u,v,w,d,z0,t){
  const st=WSTEP>0?WSTEP:1e9;
  const nu=Math.max(1,Math.round(w/st)), nv=Math.max(1,Math.round(d/st)), nz=Math.max(1,Math.round((t-z0)/st));
  const F=(pts,k)=>poly(pts,WFO[k],{stroke:WF.edge,"stroke-width":.7,"stroke-linejoin":"round",class:"wf"});
  const L=(a,b)=>g.appendChild(el("line",{x1:px(a[0],a[1]),y1:py(a[0],a[1],a[2]),
    x2:px(b[0],b[1]),y2:py(b[0],b[1],b[2]),stroke:WF.grid,"stroke-width":.55}));
  const top=F([[u,v,t],[u+w,v,t],[u+w,v+d,t],[u,v+d,t]],"t");
  [F([[u,v,t],[u+w,v,t],[u+w,v,z0],[u,v,z0]],"r"),
   F([[u,v,t],[u,v+d,t],[u,v+d,z0],[u,v,z0]],"l"), top].forEach(e=>g.appendChild(e));
  for(let i=1;i<nu;i++){ const x=u+w*i/nu; L([x,v,t],[x,v+d,t]); L([x,v,t],[x,v,z0]); }
  for(let i=1;i<nv;i++){ const y=v+d*i/nv; L([u,y,t],[u+w,y,t]); L([u,y,t],[u,y,z0]); }
  for(let i=1;i<nz;i++){ const z=z0+(t-z0)*i/nz; L([u,v,z],[u+w,v,z]); L([u,v,z],[u,v+d,z]); }
  return top; }
/* prism 을 안 거치고 직접 그린 잔여 도형(시계 문자판·큐 홈·칸)도 같은 선으로 통일한다.
   하나하나 고치는 대신 다 그린 뒤에 훑는다 — 노드 draw() 를 건드리면 설계 탭까지 바뀐다. */
function wireify(host,isRail){
  [].slice.call(host.querySelectorAll("polygon,rect,circle,ellipse,path")).forEach(function(e){
    if(e.getAttribute("class")==="wf") return;
    /* 교차 레일 밑에 깔던 '어두운' 그림자는 밝은 칠로 뒤집히면 빛 덩어리가 된다 → 뺀다 */
    if(isRail&&e.getAttribute("fill")==="#05080f"){ e.parentNode.removeChild(e); return; }
    e.setAttribute("fill",isRail?"rgba(110,190,255,.13)":WF.fill);       /* 레일은 판 격자에 묻히지 않게 한 단계 밝게 */
    e.setAttribute("stroke",isRail?"rgba(170,222,255,.5)":WF.grid);
    e.setAttribute("stroke-width",isRail?".8":".55");
    e.removeAttribute("opacity"); e.removeAttribute("filter"); });
  /* 레일에서만 polyline 까지 받는다 = 셰브론 이음선. 몸통 쪽(isRail=false)의 polyline 은
     상자 윗면 모서리(class="rim") 라, 같이 받으면 청사진에서 상자가 무너진다. */
  [].slice.call(host.querySelectorAll(isRail?"line,polyline":"line")).forEach(function(e){
    /* 레일 이음선·그루브 모서리는 채널 외곽선과 겹쳐 그냥 촘촘해 보인다 */
    if(isRail){ e.parentNode.removeChild(e); return; }
    e.setAttribute("stroke",WF.grid); e.removeAttribute("opacity"); }); }

function prism(g,u,v,w,d,z0,h,c,rim){ const t=z0+h;
  if(WIRE) return wireBox(g,u,v,w,d,z0,t);
  g.appendChild(poly([[u,v,t],[u+w,v,t],[u+w,v,z0],[u,v,z0]],c[2]));
  g.appendChild(poly([[u,v,t],[u,v+d,t],[u,v+d,z0],[u,v,z0]],c[1]));
  const top=poly([[u,v,t],[u+w,v,t],[u+w,v+d,t],[u,v+d,t]],c[0],{class:"top"}); g.appendChild(top);
  if(rim) g.appendChild(el("polyline",{class:"rim",
    points:[[u+w,v,t],[u+w,v+d,t],[u,v+d,t]].map(p=>P(p[0],p[1],p[2])).join(" ")}));
  return top; }   /* 윗면을 돌려줌 — Stage2에서 IOCP 워커 처리 하이라이트에 씀 */

/* defs: 그림자 소프트닝 */
(function(){ const defs=el("defs");
  defs.innerHTML='<filter id="softShadow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="6"/></filter>';
  svg.appendChild(defs); })();

/* 레이어 (등장 웨이브가 잡을 수 있게 lyr-* id).
   칩 레이어 2장은 일부러 id를 안 준다 = 등장 웨이브 대상에서 제외(구조가 먼저 서고 데이터가 흐름).
   대신 class="chips" 를 준다 — 웨이브가 도는 동안 이 두 장을 통째로 감추는 데 쓴다(CSS 의 .pop-hold).
   gChipBack=건물 뒤(레일 위를 달리다 건물에 가림) / gChip=건물 앞(적재·묶음 등 '얹히는' 것) */
const gZone=el("g"), gShad=el("g"), gLane=el("g"), gChipBack=el("g"), gBuild=el("g"), gChip=el("g"), gLbl=el("g");
[gZone,gShad,gLane,gChipBack,gBuild,gChip,gLbl].forEach(g=>svg.appendChild(g));
gZone.id="lyr-plat"; gShad.id="lyr-shad"; gLane.id="lyr-lane"; gBuild.id="lyr-build"; gLbl.id="lyr-lbl";
gChipBack.setAttribute("class","chips"); gChip.setAttribute("class","chips");
/* 정적 레이어(구역·그림자·레일·몸통·라벨)를 어느 그룹에 그릴지 — 병목 지도가 같은 코드를 다른 SVG 로 재사용한다 */
let TZ=gZone, TS=gShad, TR=gLane, TB=gBuild, TL=gLbl;

/* 팔레트 */
const GAME =["#f4c862","#7d5a1c","#b3842a"];
const CROWD=["#4f7cb4","#1e3a54","#2d5276"];
const NET  =["#63afe6","#1b4870","#2b6597"];
const DBBOX=["#3f8f68","#154029","#1f5f40"];
/* DB 워커 스레드 = 저장 계열이되 MySQL(DBBOX)보다 한 단계 죽인 톤 — 외부 저장소와 헷갈리면 안 된다 */
const DBW    =["#2f7a56","#0d2b1d","#1a4b35"];
const DBPLATE=["#1e3a2b","#0a1710","#132b1e"];   /* DB 워커 큐 판·슬랩 (SwapQ 판의 저장 계열 버전) */
const RECV="#6cc7ff", SEND="#ffb648", STORE="#57d694";

/* 등장 웨이브가 레이어의 '직계 자식' opacity를 1로 덮어쓰므로(scenePop 100%{opacity:1} + fill both),
   반투명이 살아야 하는 요소는 반드시 래퍼 g 안에 넣는다. 래퍼가 애니메이션을 받고, 자식 opacity는 보존. */
/* 그림자는 draw() 안에서 gShad 로 바로 들어가 나중에 보면 어느 노드 것인지 알 길이 없다 →
   지금 그리는 노드의 구역을 여기 걸어 두고 물려준다(구역 강조에서 몸통과 같이 죽어야 한다) */
let drawZone="";
function addShad(node){ const g=el("g"); if(drawZone) g.setAttribute("data-z",drawZone);
  g.appendChild(node); TS.appendChild(g); }
/* 평면도에는 접지 그림자가 없다(빛이 정면이라 그림자가 도형 밑에 완전히 숨는다).
   지우지 않고 opacity 만 0 으로 두는 것이 규칙 — 전환 애니가 이 값을 보간해 저절로 사라지게 한다. */
function shadow(u,v,w,d){ addShad(el("ellipse",
  {cx:px(u+w/2,v+d/2), cy:py(u+w/2,v+d/2,0)+5, rx:(w+d)*.38, ry:(w+d)*.13,
   fill:"#04060c", opacity:FLAT?0:.42, filter:"url(#softShadow)"})); }

/* ═══ 에디터 Export 데이터 ═══ */
/* mysql 이 383,148 이 아니라 386,150 인 이유: 이 값이라야 중심이 (410,170) 이 되어
   위 줄(타이밍휠·DB 워커 v=170)과 오른쪽 열(게임 루프 u=410)에 정확히 얹힌다.
   예전 값에서는 중심이 (407,168) 이라 dbw→mysql 레일만 1.2° 기울어 있었다 —
   아이소에서는 안 보이지만 평면도에서는 유일하게 축을 벗어난 선이 된다. */
const LAYOUT={ mysql:{u:386,v:150}, dbw:{u:273,v:148}, game:{u:380,v:20}, sector:{u:310,v:-70},
  swapq:{u:310,v:42}, iocp:{u:190,v:50}, send:{u:168,v:-92}, accept:{u:55,v:36}, clients:{u:-27,v:21}, timer:{u:190,v:170} };
const RAILS=[
  {from:"clients",to:"accept",color:"recv"},
  {from:"accept",to:"iocp",color:"recv"},
  {from:"iocp",to:"swapq",color:"recv"},
  {from:"swapq",to:"game",color:"recv"},
  {from:"send",to:"clients",color:"recv",lanes:3,cross:true,pts:[{u:-14,v:-70}]},   /* 클라 복귀 구간 — 레인은 파랑 계열(사용자 확정), 복귀 칩은 주황 유지.
     u 는 clients 의 '히트박스 중심'(LAYOUT −27 + 26/2 = −14) 이어야 마지막 구간이 수직으로 곧게 선다 —
     레일 끝점은 LAYOUT 이 아니라 center() = L.u + hit.w/2 다(accept 70 · iocp 190 과 같은 규칙).
     무리를 줄이면서 이 값을 안 따라가면 끝점이 무리 오른쪽 끝으로 밀려 마지막 구간이 30° 로 눕는다. */
  {from:"game",to:"dbw",color:"store",pts:[{u:410,v:70},{u:410,v:130},{u:310,v:130}]},
  {from:"dbw",to:"mysql",color:"store"},
  {from:"game",to:"sector",color:"send",lanes:3,cross:true,pts:[{u:410,v:-70}]},
  {from:"sector",to:"send",color:"send",lanes:3},   /* 워커 3개로 가는 고정 파이프 — 세션마다 uniqueId%3 배정 */
  {from:"iocp",to:"timer",color:"recv",pts:[{u:190,v:170}]},
  {from:"accept",to:"timer",color:"recv",pts:[{u:70,v:170}]},   /* u 를 Accept 의 '중심'(70) 과 맞춰야 첫 구간이 수직으로 곧게 떨어진다 — 레일 끝점은 LAYOUT(55) 이 아니라 히트박스 중심이다(iocp 도 같은 규칙으로 190) */
];
/* dbw·game 오프셋은 BODY(몸통 확대) 를 올리면서 다시 잡은 값 — 커진 몸통에 글자가 얹히지 않게.
   BODY 를 더 키우면 이 둘부터 다시 확인할 것(가장 먼저 부딪히는 라벨이다). */
const LABELS={ mysql:{dx:5,dy:-32}, dbw:{dx:2,dy:-62}, game:{dx:50,dy:-32}, sector:{dx:41,dy:-18},
  swapq:{dx:49,dy:6}, iocp:{dx:20,dy:39}, send:{dx:52,dy:43}, accept:{dx:-52,dy:-26}, clients:{dx:0,dy:78}, timer:{dx:41,dy:-44} };
/* 평면에서만 다시 잡는 라벨.
   아이소에서는 라벨을 '몸통 높이만큼 띄운 자리' 에 놓는데, 평면에서는 그 높이가 없어서
   대부분이 자기 발자국 위로 주저앉는다. 게다가 아이소에서 비어 있던 옆자리가
   평면에서는 옆 노드 자리가 되기도 한다 — 실제로 부딪힌 곳:
     accept  왼쪽으로 빼 뒀는데 평면에서는 그 자리가 클라이언트 무리 한복판이다 → 위로
     swapq   오른쪽으로 빼 뒀는데 그쪽이 게임 루프 발자국이다 → 가운데 위로
     mysql·dbw  블록 위가 'DATA BASE' 바닥 글자 자리다 → 각각 오른쪽·아래로
     timer   위로 빼면 문자판(지름 76)과 판 윗변 사이에 3px 밖에 안 남는다 → 문자판 왼쪽으로.
             높이는 Accept→타이밍휠 레일(v=170)보다 위로 — 그 자리에 두면 얇은 선이 글자를 관통해 취소선처럼 보인다
     clients 무리 아래는 도킹한 복귀 레일이 끝나는 자리다 → 무리 위(판 윗변과 무리 사이)로.
             덤으로 지도 왼쪽 위 빈 자리가 채워져 위 줄(타이밍휠·DB 워커·MySQL)과 균형이 맞는다
   여기 없는 둘(game·sector)만 원래 오프셋 그대로도 안 겹친다. */
const FLABELS={ mysql:{dx:85,dy:-8}, dbw:{dx:2,dy:28}, swapq:{dx:0,dy:-41}, iocp:{dx:20,dy:59},
  send:{dx:52,dy:50}, accept:{dx:0,dy:-48}, clients:{dx:0,dy:-213}, timer:{dx:-120,dy:-30} };
/* clients 만 36 → 78 로 내렸다: 무리를 판 크기에 맞게 키우면서 옛 자리가 큐브 한가운데가 됐다.
   78 = 무리의 화면상 아래끝(-v 끝 큐브 바닥) 바로 밑 — 판 앞꼭지 안쪽에 세 줄이 다 들어온다. */
/* timer 는 오른쪽 위로 비켜 둔다(41,-44). 시계 문자판이 넓어서(반지름 R*KX≈32) 세로로만 띄우면
   dy 가 -40 아래로 내려오는 순간 부제가 눈금·가운데 축에 얹힌다 — dx 를 41 로 뺀 지금도 -12 는 문자판을 관통한다.
   즉 이 노드는 dx·dy 를 따로 못 본다: 가로로 비켜도 세로 여유(-40 이상)는 그대로 필요하다. */
/* 구역 바닥(스레드 그룹) — 얕은 색판 + 앞·오른쪽 테두리 + 바닥에 눕힌 이름.
   name = 바닥 글자 · lu,lv = 그 글자의 중앙 · ws = 크기 · wo = 진하기 (전부 mmo-edit.html 에서 조정) */
const ZPAL={ net:  {top:"#111a2b",side:"#0b111d",edge:"#6cc7ff"},
             game: {top:"#1b1710",side:"#131009",edge:"#ffb648"},
             store:{top:"#0f1b17",side:"#0a1210",edge:"#57d694"},
             /* gray 는 바탕색(#0d1220)과 거의 같아 안 보였다 → 확실히 밝은 중립으로 */
             gray: {top:"#18202f",side:"#111827",edge:"#93a5c2"},
             /* 수신/응답/저장 3색과 안 겹치는 4번째 색조 (현재 쓰는 구역 없음) */
             violet:{top:"#1b1533",side:"#120e24",edge:"#a78bfa"},
             /* outside = 서버 밖(클라이언트). 실선·밝은 중립 — 색을 안 주고 밝기로만 구분.
                dash:true 를 붙이면 점선 테두리 버전이 된다 */
             outside:{top:"#161d2b",side:"#0f1522",edge:"#93a5c2"} };
/* 글자를 +u 방향(화면 오른쪽 위)으로 눕히면서 자리·크기를 다시 잡았다.
   이 방향에서는 글자 길이가 판의 '폭(w)' 을 먹는다 — 앞의 -v 방향일 때는 '깊이(d)' 를 먹었다.
   클라(120)·네트워크(200) 판은 폭이 깊이(320)보다 좁아서, 그만큼 글자를 줄여야 한다(CLIENT 40→26).
   그리고 이 방향은 건물·레일·노드 이름표를 정면으로 통과한다. 실제로 부딪힌 곳:
     - 클라 판 앞쪽(v≈-80) = send→clients 복귀 3레인이 지나가 글자 꼬리를 덮는다
     - 저장 판 위 = MySQL·DB 워커가 판을 거의 채워 글자가 통째로 가린다
   그래서 넷 다 판 위를 비우고 판 밖으로 뺐다. 어느 쪽으로 뺄지는 그 판의 뒤가 비었는지로 갈린다:
     - 뒤 줄(+v, lv 251) : NETWORK · DATA BASE
     - 앞 줄(-v)          : GAME — 게임 판 뒤는 저장 판이 차지해 뒤로 뺄 자리가 없다
                            CLIENT — 뒤에 두면 NETWORK 와 한 줄에 붙어 'CLIENT NETWORK' 로 이어 읽힌다
   줄 맞춤은 lv 를 같게 두는 것으로 끝나지 않는다 — (lu,lv) 는 글자의 '중앙'이라,
   크기(ws)가 다르면 lv 가 같아도 글자의 윗변·밑변이 어긋난다.
     - 뒤 줄(둘 다 ws 40) : lv 251 로 같으면 밑변까지 저절로 맞는다 — 밑선 기준 정렬.
     - 앞 줄(CLIENT 40 · GAME 50) : lv 를 둘 다 -132 로 두면 윗변이 3.6 어긋난다(CLIENT -114.6 / GAME -111.0).
       윗선을 맞추려고 GAME 만 -136 으로 내렸다. 크기를 건드리면 이 값도 다시 잡을 것
       (윗변 = lv - (ws*0.34 - 대문자높이), 대문자높이는 ws 40 에서 31 · 50 에서 38 — 실측값).
   앞 줄이 -147 이 아니라 -132 인 것은 -147 이면 CLIENT 꼬리가 viewBox 아래끝(672)을 넘어 잘리기 때문.
   판을 벗어난 덕에 크기는 40~50 까지 올렸다(판 위에 두면 26 이 한계였다).
   ※ 이 방향(+u)에서는 같은 줄의 판 이름들이 일직선으로 늘어선다 — 가로로 붙으면 한 문장처럼 읽힌다.
     뒤 줄이 특히 빠듯하다: NETWORK(212.5) + DATA BASE(228.9) = 441.4 인데 두 판의 u 범위는 440 뿐이라,
     lu 를 판 중앙(140 / 370)에 두면 간격이 10 도 안 남아 'NETWORKDATA BASE' 한 덩어리로 읽힌다.
     그래서 뒤 줄 두 개는 각자 다른 기준으로 잡아 간격 54 를 벌어 둔다:
       - DATA BASE 365 = 마지막 글자 E 의 오른쪽 끝을 저장 판 끝변(u 480)에 맞춘 값
         (E 끝 = lu + 115.3, letter-spacing 반쪽 0.8 을 뺀 자리).
       - NETWORK 90 = 거기서 왼쪽으로 더 뺀 자리. 판 중앙(140)으로 되돌리면 간격이 다시 무너진다.
     앞 줄 CLIENT 30 은 클라 판 끝(20)과 네트워크 판 시작(40) 사이, 두 판 경계의 한가운데다.
     글자를 키우거나 이름을 늘릴 거면 이 계산부터 다시 할 것. */
/* f = 평면(병목 지도)에서 쓰는 자리·크기. 위 값들은 아이소에서 '판 밖' 으로 빼 둔 것이라
   평면으로 펴면 판에서 한참 떨어진 허공에 남는다. 평면에서는 판 위가 비어서 안에 넣을 수 있다:
     CLIENT  무리와 판 앞변 사이   NETWORK 노드 두 줄 사이
     GAME    송신 큐와 게임 사이   DATA BASE 판 윗변의 오른쪽
   셋은 ws28, DATA BASE 만 22 다. 저장 판은 220×100 으로 다른 판(200×320·200×200)보다 얕고,
   윗변 왼쪽은 DB 워커 몸통이 차지한다 — 이 몸통은 히트박스 밖(판 뒤 +v 로 27)이라 좌표만 봐서는 안 보인다.
   방 크기에 글자 크기가 따라가는 것은 평면도에서 오히려 자연스럽다.
   레일이 글자를 가로지르는 자리가 있는데, 구역 글자는 맨 뒤 레이어(gZone)라 레일이 위로 지나간다 = 의도. */
const ZONES=[
  {u:-52, v:-100,w:72, d:320,color:"outside",name:"CLIENT",  lu:30, lv:-132, ws:40, wo:.3, f:{lu:-16,lv:-85, ws:18}},
  {u:40, v:-100,w:200,d:320,color:"net",  name:"NETWORK", lu:90, lv:251, ws:40, wo:.3, f:{lu:140,lv:112, ws:28}},
  /* 게임 판은 저장 판과 좌우 변을, 클라·네트워크 판과 아래 변을 공유한다.
     아이소에서는 원근이 어긋남을 덮어 줘서 262/-98/200 이어도 안 보였는데,
     평면도에서는 변이 2px·18px 씩 어긋난 게 그대로 드러난다. 지금은 네 판의 틈이 전부 20 이다.
     폭이 220 이 아니라 240 인 것은 바닥 글자 때문이다 — 220 에서는 'DATA BASE' 의 마지막 E 가
     판 오른쪽 선을 7px 넘었다. 글자를 줄이는 대신 판을 늘렸다(오른쪽은 비어 있던 자리다).
     ※ 글자 폭은 눈대중이나 계산식으로 잡으면 틀린다 — 반드시 렌더에서 text 의 getBBox 로 잴 것.
       계산식(대문자 0.62em)은 실제보다 7px 좁게 나왔다. */
  {u:260,v:-100,w:240,d:200,color:"game", name:"GAME",    lu:354,lv:-136, ws:50, wo:.3, f:{lu:322,lv:-3,  ws:28}},
  {u:260,v:120, w:240,d:100,color:"store",name:"DATA BASE", lu:365,lv:251, ws:40, wo:.3, f:{lu:420,lv:207,ws:22}} ];
/* ── 구역 강조용: 노드가 어느 구역 판 위에 서 있는지 = LAYOUT 좌표가 그 판 사각형 안인지로 판정 ──
   표를 따로 두지 않는 이유: 에디터에서 노드를 옮기면 구역도 저절로 따라와야 하기 때문.
   지금 10개 전부 판 하나에만 걸린다(겹치면 먼저 선언된 판을 따른다). */
function zoneOf(name){ const L=LAYOUT[name]; if(!L) return "";
  for(let i=0;i<ZONES.length;i++){ const z=ZONES[i];
    if(L.u>=z.u&&L.u<=z.u+z.w&&L.v>=z.v&&L.v<=z.v+z.d) return z.color; }
  return ""; }
/* 레일은 '양 끝 중 하나라도 그 구역'이면 살아 있어야 한다(구역 밖으로 나가는 흐름이 보이라고) → 둘 다 적는다 */
function zonesOf(){ const out=[];
  for(let i=0;i<arguments.length;i++){ const z=zoneOf(arguments[i]); if(z&&out.indexOf(z)<0) out.push(z); }
  return out.join(" "); }
/* 바닥에 눕힌 글자 — (u,v) 평면에 얹는 아핀 변환. 진행 방향은 +u(화면 오른쪽 위)로 고정이고,
   글자 아래쪽이 -v(화면 오른쪽 아래)를 향한다.
   ※ 바닥에 누운 글자가 똑바로 읽히는 방향은 이 판에서 딱 둘뿐이다 — 지금의 +u, 그리고 예전 -v.
      나머지 둘(-u, +v)로 돌리면 글자가 거꾸로 서거나 좌우가 뒤집힌다(행렬식 부호). */
const ZW_LS=.04;   /* 자간(em) — 여기 한 줄로 네 구역 글자 간격이 같이 움직인다 */
/* 앞 두 열 = 글자의 가로축이 향할 방향(+u), 뒤 두 열 = 세로축(−v).
   투영에서 바로 뽑으므로 평면에서는 저절로 matrix(S,0,0,S,…) = 기울기 없는 순수 확대가 된다.
   아이소에서는 옛 상수식 matrix(KX,−KY,KX,KY,…) 와 같은 값이다. */
function floorMat(u,v){ return "matrix("+PJ.ax.toFixed(4)+","+PJ.ay.toFixed(4)+","
  +(-PJ.bx).toFixed(4)+","+(-PJ.by).toFixed(4)+","+px(u,v).toFixed(2)+","+py(u,v,0).toFixed(2)+")"; }
/* 바닥에 눕히는 변환 — 위 floorMat 과 달리 v 축을 뒤집지 않는다(글자가 아니라 도형용).
   안쪽을 (u,v) 로 그리면 투영이 알아서 눕혀 준다. 바닥에 놓인 '원' 처럼
   화면 좌표로는 축정렬 타원이 될 수 없는 도형이 이걸 쓴다(요각이 들어가면 기울어진 타원이 된다).
   z 를 주면 그 높이의 면에 얹는다. 전환 애니는 transform 안 숫자 6개를 그대로 보간한다. */
function floorTf(u,v,z){ return "matrix("+PJ.ax.toFixed(4)+","+PJ.ay.toFixed(4)+","
  +PJ.bx.toFixed(4)+","+PJ.by.toFixed(4)+","+px(u,v).toFixed(2)+","+py(u,v,z||0).toFixed(2)+")"; }

/* Stage2 애니메이션이 잡아 쓸 노드 내부 참조 — 각 draw()에서 채운다 */
let gameBeacon=null, sectorCells=null, iocpCells=null, twGeo=null;
/* 통째 스왑 순간에 번쩍일 요소들 — [요소, 평소 색] 쌍. 그 색에서 시작해 원래 색으로 식는다.
   SwapQ·DB 큐는 칸 위에 칩이 쌓여 칸만 밝히면 가려진다 → 홈(파인 자리)도 함께 넣는다. */
let swapqLit=null, dbwLit=null;

/* 큐 노드(SwapQ · 송신 큐) 공통 치수.
   SLOT = 크기 5 칩의 실제 한 변(=5/KX). 슬롯 폭·칩 간격·스왑 이동량이 전부 이 값에서 나온다
   — 임의 값을 쓰면 쌓인 칩 사이가 벌어지거나 슬롯과 어긋난다. */
const SLOT=+(5/KX).toFixed(2);          /* ≈5.81 */
const Q_HEAD=0.9+SLOT/2;                /* 칸막이 옆 첫 칸의 중심 */
const SQ_N=4, SQ_HW=27;                 /* SwapQ: 칸 4개(공유 쪽), 판 반폭 */
const DBQ_N=5;                          /* DB 워커 큐: 칸 5개 */
/* 큐 판 반폭은 눈대중이 아니라 칸 수에서 나온다 = 첫 칸 + 나머지 칸 + 칸 반쪽 + 여백 2.8.
   SwapQ(칸4 → 27)·송신 큐(칸3 → 21) 가 이미 이 값이라, DB 도 같은 식으로 뽑아야 셋이 한 식구로 보인다. */
const DBQ_HW=Math.round(Q_HEAD+(DBQ_N-1)*SLOT+SLOT/2+2.8);   /* = 33 */

/* ═══ 몸통 확대 배수 ═══
   레일·칩·큐 칸은 손대지 않는다 — 이 셋은 서로 물려 있어서(칩 크기 → SLOT → 칸 폭 → 판 반폭,
   칩 크기 → 레인 폭) 하나만 키우면 칩이 칸이나 레일 밖으로 삐져나온다.
   그래서 '건물'만 키운다: 노드 중심(레일 끝점)을 고정한 채 크기만 곱하므로 배치는 그대로다.
   1 로 두면 원래 크기로 정확히 돌아온다. */
const BODY=1.18;
const bw=w=>w*BODY;                      /* 크기 */
const bo=(u,w)=>u-w*(BODY-1)/2;          /* 중심을 유지하려면 시작 좌표를 이만큼 당긴다 */

/* ═══ 노드 정의 (몸통 그리기 + 히트박스 + 라벨 내용). 좌표는 LAYOUT, 라벨 오프셋은 LABELS ═══
   hit=[ox,oy,w,d,hz]  lab={anch,lines:[[text,size,color,weight,offY],...]}  card=상세카드 키 */
const NODES=[
  /* 외부 저장소라 주변부인데 덩치가 3위였다(게임 루프 앵커와 경쟁) → 54×44×34 에서 한 단계 낮춤 */
  { name:"mysql", card:"mysql", hit:[0,0,48,40,24],
    lab:{anch:"middle",lines:[["MySQL",14,"#eef2fb","800",0],["주기 UPSERT",11,"#8496b3","600",15]]},
    draw(g,u,v){ const x=bo(u,48), y=bo(v,40), W=bw(48), D=bw(40), H=bw(8); shadow(x,y,W,D);
      prism(g,x,y,W,D,0,H,DBBOX,true); prism(g,x,y,W,D,H,H,DBBOX,true); prism(g,x,y,W,D,H*2,H,DBBOX,true); } },
  /* SwapQ·송신 큐와 같은 양식(판 + 파인 홈 + 가운데 칸막이 + 쌓이는 칸), 색만 저장 계열.
     실제 코드도 같은 패턴이다 — CDBWorker 는 SendWorker 를 복제해서
     게임스레드가 push, 워커스레드가 swap-out 으로 큐를 통째 인출한다(DBWorker.h).
     홈 축 = MySQL 로 나가는 축(+u), 쌓이는 칸은 그 반대쪽(-u) = 게임에서 오는 쪽.
     워커 큐브는 홈 '뒤'(+v)에 세운다 — 앞(-v)에 두면 높이가 홈을 덮어 큐가 안 보인다. */
  { name:"dbw", card:"dbw", hit:[37-DBQ_HW,11,2*DBQ_HW,22,4],
    lab:{anch:"middle",lines:[["DB 워커",14,"#eef2fb","800",0],["통째 인출 · 배치 UPSERT",10.5,"#8496b3","600",15]]},
    draw(g,u,v){ const CU=u+37, HW=DBQ_HW, GD=5, Z=3.4, cy=v+22;   /* CU,cy = 노드 중심(레일 끝점) */
      const PT=a=>a.map(p=>P(p[0],p[1],p[2]||0)).join(" ");
      shadow(CU-HW,cy-11,2*HW,22);
      prism(g,CU-HW,cy-11,2*HW,22,0,Z,DBPLATE,true);
      const groove=el("polygon",{points:PT([[CU-HW+2.5,cy-GD,Z],[CU+HW-2.5,cy-GD,Z],[CU+HW-2.5,cy+GD,Z],[CU-HW+2.5,cy+GD,Z]]),
        fill:"#0d2018",stroke:"#2c6a4a","stroke-width":.7,opacity:.9});
      g.appendChild(groove); dbwLit=[[groove,"#0d2018"]];
      prism(g,CU-1.1,cy-GD,2.2,2*GD,Z,1.4,["#57d694","#1b5b3c","#2a7d55"],true);   /* 칸막이 = 인출 경계 */
      for(let i=0;i<DBQ_N;i++){ const cu=CU-Q_HEAD-i*SLOT;           /* 쌓이는 칸은 게임 쪽(-u) */
        const e=el("polygon",{fill:"#122a1e",stroke:"#2a5741","stroke-width":.7,
          points:PT([[cu-SLOT/2,cy-4,Z+0.35],[cu+SLOT/2,cy-4,Z+0.35],[cu+SLOT/2,cy+4,Z+0.35],[cu-SLOT/2,cy+4,Z+0.35]])});
        g.appendChild(e); dbwLit.push([e,"#122a1e"]); }
      /* DB 워커 스레드 몸통 — 판 바로 뒤(칩이 앞을 지난다). 슬랩 앞변 = 판 뒷변이라 이음새가 딱 맞는다.
         몸통 17×11×14 = Send 워커 상자와 같은 치수(둘 다 '워커 스레드 하나'), 슬랩은 IOCP 와 같은 여백 6.
         저장 초록이되 MySQL(DBBOX)보다 한 단계 어두운 톤 — 바로 뒤 스택과 값이 갈려야 안 뭉친다.
         판·홈·칸은 칩에 물려 있어 그대로, 워커 몸통만 BODY 배(앞변은 판 뒷변에 붙여 두고 뒤로만 커진다) */
      const sx=bo(CU+18.5,29), sy=cy+11;
      shadow(sx,sy,bw(29),bw(23));
      prism(g,sx,sy,bw(29),bw(23),-bw(2),bw(3),DBPLATE);
      prism(g,sx+bw(6),sy+bw(6),bw(17),bw(11),bw(1),bw(14),DBW,true); } },
  { name:"game", card:"loop", hit:[0,0,60,60,58],
    lab:{anch:"start",lines:[["게임 루프",18,"#ffe0a0","800",0],["단일 코어 · 25fps 틱",12,"#c9b48c","600",19],["◆ BOTTLENECK",11,"#ffb648","800",40]]},
    draw(g,u,v){ const w=bw(60),d=bw(60),h=bw(58), x=bo(u,60), y=bo(v,60); shadow(x,y,w,d);
      prism(g,x,y,w,d,0,h,GAME,true);
      g.appendChild(el("polygon",{points:[[x,y],[x+w,y],[x+w,y+d],[x,y+d]].map(p=>P(p[0],p[1],h)).join(" "),
        fill:"none",stroke:"#ffe0a0","stroke-width":1.6,opacity:.9}));
      const tx=px(x+w/2,y+d/2), ty=py(x+w/2,y+d/2,h);
      g.appendChild(el("line",{class:"beacon",x1:tx,y1:ty,x2:tx,y2:ty-bw(24),stroke:"#ffb648","stroke-width":2.4}));
      gameBeacon=el("circle",{class:"beacon",cx:tx,cy:ty-bw(29),r:bw(5),fill:"#ffd88a"}); g.appendChild(gameBeacon); } },
  /* 송신 핸드오프 = SwapQ 와 같은 '통째 스왑' 큐가 워커 수(3)만큼.
       게임: perWorker[uniqueId%K] 로 나눠 담고 워커별 락 1회로 append
       워커: local.swap(worker.queue) 로 락 1회에 통째 인출
     홈 3개를 레인 3줄과 같은 간격(SUB_W+SUB_GAP=14)에 파서 파이프와 1:1로 물린다.
     색은 이 구간 레인(응답 send)에 맞춘 주황 계열 — 칸 색 #1d1409/#c98c2e 는 애니가 그대로 쓴다. */
  { name:"sector", card:"send", hit:[-21,-22,42,44,4],
    lab:{anch:"start",lines:[["송신 큐 ×3",12.5,"#eef2fb","800",0],["워커별 통째 스왑",10.5,"#8496b3","600",15]]},
    draw(g,u,v){ const HW=21, HD=22, LANE=14, GD=5, Z=3.4; sectorCells=[];
      const PT=a=>a.map(p=>P(p[0],p[1],p[2]||0)).join(" ");
      shadow(u-HW,v-HD,2*HW,2*HD);
      prism(g,u-HW,v-HD,2*HW,2*HD,0,Z,["#332613","#160e04","#241a0b"],true);
      const made=[];
      for(let k=1;k>=-1;k--){ const cv=v+k*LANE, idx=(1-k)*3;   /* 뒤(v 큰 것)부터 */
        g.appendChild(el("polygon",{points:PT([[u-HW+2.5,cv-GD,Z],[u+HW-2.5,cv-GD,Z],[u+HW-2.5,cv+GD,Z],[u-HW+2.5,cv+GD,Z]]),
          fill:"#1d1407",stroke:"#4a3718","stroke-width":.7,opacity:.9}));       /* 파인 홈 = 큐 하나 */
        /* 칸막이 = 스왑 경계(공유↔로컬). 낮은 벽으로 세운다 — 평평한 색 띠로 두면 쌓인 칩과 붙어 안 보인다 */
        prism(g,u-1.1,cv-GD,2.2,2*GD,Z,1.4,["#ffb648","#7d5a1c","#b3842a"],true);
        /* 쌓이는 자리 3칸 — 게임에서 오는 쪽(+u)에. 폭=간격=SLOT 이라 서로 붙는다 */
        for(let i=0;i<3;i++){ const cu=u+Q_HEAD+i*SLOT, e=el("polygon",{fill:"#1d1409",stroke:"#553f1c","stroke-width":.7,
          points:PT([[cu-SLOT/2,cv-4,Z+0.35],[cu+SLOT/2,cv-4,Z+0.35],[cu+SLOT/2,cv+4,Z+0.35],[cu-SLOT/2,cv+4,Z+0.35]])});
          g.appendChild(e); made[idx+i]=e; } }
      for(let i=0;i<9;i++) sectorCells.push(made[i]); } },
  /* 송신 큐와 같은 양식(판 + 파인 홈 + 가운데 칸막이 + 쌓이는 칸), 색만 수신 계열.
     홈은 1개 — 공유 큐(칸막이 왼쪽, IOCP가 쌓음) ↔ 로컬 큐(오른쪽, 게임이 빼감).
     판 중심 v = 노드 v+8 이라 IOCP·게임과 같은 축선에 놓인다(레일이 안 기운다). */
  { name:"swapq", card:"iocp", hit:[-SQ_HW,-3,2*SQ_HW,22,4],
    lab:{anch:"middle",lines:[["SwapQ",13.5,"#cfe0f2","800",0],["통째 스왑 · 락 1회",10.5,"#93a9cd","600",14]]},
    draw(g,u,v){ const HW=SQ_HW, GD=5, Z=3.4, cy=v+8;
      const PT=a=>a.map(p=>P(p[0],p[1],p[2]||0)).join(" ");
      shadow(u-HW,cy-11,2*HW,22);
      prism(g,u-HW,cy-11,2*HW,22,0,Z,["#22314c","#0d1524","#182640"],true);
      const groove=el("polygon",{points:PT([[u-HW+2.5,cy-GD,Z],[u+HW-2.5,cy-GD,Z],[u+HW-2.5,cy+GD,Z],[u-HW+2.5,cy+GD,Z]]),
        fill:"#101a2c",stroke:"#33507e","stroke-width":.7,opacity:.9});
      g.appendChild(groove); swapqLit=[[groove,"#101a2c"]];
      prism(g,u-1.1,cy-GD,2.2,2*GD,Z,1.4,["#8ad4ff","#1b4870","#2b6597"],true);   /* 칸막이 = 스왑 경계 */
      for(let i=0;i<SQ_N;i++){ const cu=u-Q_HEAD-i*SLOT;            /* 쌓이는 칸은 IOCP 쪽(-u) */
        const e=el("polygon",{fill:"#16223a",stroke:"#2c4266","stroke-width":.7,
          points:PT([[cu-SLOT/2,cy-4,Z+0.35],[cu+SLOT/2,cy-4,Z+0.35],[cu+SLOT/2,cy+4,Z+0.35],[cu-SLOT/2,cy+4,Z+0.35]])});
        g.appendChild(e); swapqLit.push([e,"#16223a"]); } } },
  { name:"iocp", card:"iocp", hit:[-23,-22,46,44,16],
    lab:{anch:"middle",lines:[["IOCP 워커",14.5,"#eef2fb","800",0],["×4 · 병렬 파싱",11,"#6cc7ff","700",16]]},
    draw(g,u,v){ prism(g,u-bw(23),v-bw(22),bw(46),bw(44),-bw(2),bw(3),["#1c2b45","#0e1626","#152238"]);
      const cells=[[-17,-16],[1,-16],[-17,1],[1,1]].map(c=>[u+bw(c[0]), v+bw(c[1])])
        .sort((a,b)=>DEPTH(a[0],a[1])-DEPTH(b[0],b[1]));
      iocpCells=cells.map(c=>({u:c[0]+bw(8), v:c[1]+bw(7.5),
        top:prism(g,c[0],c[1],bw(16),bw(15),0,bw(16),NET,true)})); } },
  /* IOCP 워커 큐브(16×15×16)와 같은 급이어야 하는데 혼자 작았다 → 17×11×14.
     높이만 올리면 앞 상자가 뒤를 덮어 한 덩어리로 보이므로 간격도 같이 벌린다(8/22/36 → 6/21/36) */
  { name:"send", card:"send", hit:[0,0,44,44,17],
    lab:{anch:"middle",lines:[["Send 워커 ×3",14.5,"#eef2fb","800",0],["uniqueId%3 · WSASend",11,"#8496b3","600",15]]},
    draw(g,u,v){ const x=bo(u,44), y=bo(v,44); prism(g,x,y,bw(44),bw(44),-bw(2),bw(3),["#20304e","#101a2c","#16233b"]);
      /* 뒤(v큰 것)부터 — 앞 상자가 가리게 */
      [36,21,6].forEach(dv=>prism(g,x+bw(6),y+bw(dv-3),bw(17),bw(11),bw(3),bw(14),NET,true)); } },
  { name:"accept", card:"accept", hit:[0,0,30,28,20],
    lab:{anch:"middle",lines:[["Accept",14,"#eef2fb","800",0],["blocking accept",10.5,"#8496b3","600",15]]},
    draw(g,u,v){ const x=bo(u,30), y=bo(v,28);
      shadow(x,y,bw(30),bw(28)); prism(g,x,y,bw(30),bw(28),0,bw(20),NET,true); } },
  { name:"clients", card:"client", hit:[0,0,26,58,11],
    lab:{anch:"middle",lines:[["클라이언트",14.5,"#eef2fb","800",0],["×5,000",12,RECV,"700",16],["동시 접속",11,"#8496b3","600",31]]},
    /* 무리 범위 — 판이 120×320 이던 시절에는 5×5 로는 너무 작아 판이 비어 보여 6×11 로 키웠다.
       지금은 판을 72×320 으로 좁혔으므로(왼쪽 여백 회수) 무리도 3열로 같이 줄인다 —
       판만 좁히면 무리가 넘치고, 무리만 줄이면 판이 다시 빈다.
       한쪽으로만 늘리면 무리가 판 한 귀퉁이로 쏠리므로(+v 는 화면 왼쪽 위, -v 는 오른쪽 아래) 양쪽으로 늘린다.
       -v 쪽을 -18 에서 끊는 건 그 앞이 send→클라 복귀 3레인이 내려오는 자리이기 때문 — 레인을 큐브로 덮으면
       응답이 클라로 돌아가는 마지막 구간이 사라진다. 라벨 자리(LABELS.clients.dy)도 이 -v 끝에 맞춰 잡혀 있다. */
    /* 무리의 '열'(가로 자리)은 send→클라 복귀 3레인에 맞춘다 — 레인 한 줄이 열 하나로 그대로 꽂힌다.
       열 중심 = 레일 중심선(center) ± LOFF, 큐브 폭 bw(9)=10.6 ≒ 레인 폭 10 이라 줄과 열이 같은 굵기로 보인다.
       그래서 열 간격은 bw(14)=16.5 가 아니라 레인 간격 그대로 14 다 — 레인은 몸통 배수(BODY)를 안 받으니
       예전처럼 cu 를 14 씩 띄우면(=세계좌표 16.5) 세 줄과 세 열이 갈수록 벌어져 어긋난다.
       세로(행)는 맞출 상대가 없으므로 예전 값(cv 14 간격 = 세계좌표 16.5) 그대로. */
    grid(L){ const cu=L.u+this.hit[0]+this.hit[2]/2, y=bo(L.v,58), S=bw(9), col=[], row=[];
      for(let i=-1;i<=1;i++) col.push(cu+i*LOFF-S/2);
      for(let cv=-18;cv<=126;cv+=14) row.push(y+bw(cv));
      return {col,row,S}; },
    /* 레일이 멈추는 자리 = 무리 바깥 테두리.
       다른 노드는 몸통 하나라 레일이 중심까지 들어가도 몸통에 가려 안 보이는데,
       클라는 무리가 히트박스의 5배라 중심까지 오면 무리 한복판을 세로로 가른다
       (평면도에서는 큐브가 속이 비어 그 선이 그대로 보인다).
       draw 와 같은 grid() 에서 뽑으므로 무리를 키우면 도킹도 따라온다 — 예전에는 '마지막 큐브가 놓이는 자리'가
       아니라 루프 상한(CU1·CV1)으로 계산해서, 오른쪽으로 14 · 아래로 4.7 만큼 실제 무리 밖에서 잘렸다. */
    dock(L){ const G=this.grid(L);
      return [G.col[0], G.row[0], G.col[2]+G.S, G.row[G.row.length-1]+G.S]; },
    draw(g,u,v){ const G=this.grid({u,v}), cubes=[];
      G.col.forEach(x=>G.row.forEach(y=>cubes.push([x,y])));
      cubes.sort((a,b)=>DEPTH(a[0],a[1])-DEPTH(b[0],b[1]));
      cubes.forEach(p=>prism(g,p[0],p[1],G.S,G.S,0,bw(11),CROWD)); } },
  { name:"timer", card:"iocp", hit:[-22,-22,44,44,4],
    lab:{anch:"middle",lines:[["Timing Wheel",13,"#eef2fb","800",0],["×1 · 하트비트",10.5,"#8496b3","600",15]]},
    /* 문자판은 바닥에 놓인 원이다. 예전에는 화면 좌표에 축정렬 타원(rx=R·ax, ry=−R·by)으로 그렸는데,
       그 모양은 좌우대칭 아이소에서만 맞다 — 요각이 들어가면 실제로는 기울어진 타원이라
       판은 돌아가는데 문자판만 안 돌아 바닥에서 떠 보인다. 그래서 바닥 변환(floorTf) 안에
       '진짜 원' 으로 그리고 눕히는 일은 투영에 맡긴다. 선 굵기는 변환에 안 눌리게 non-scaling-stroke.
       (평면 사본에서는 이 변환이 등배라 옛날처럼 정원이 된다 — 보이는 결과는 그대로.) */
    draw(g,u,v){ const R=bw(32), tf=floorTf(u,v,bw(4));
      const shg=el("g",{transform:"translate(0,5) "+tf});
      shg.appendChild(el("ellipse",{cx:0,cy:0,rx:R*1.1,ry:R*1.1,fill:"#05070d",opacity:FLAT?0:.42}));
      addShad(shg);
      prism(g,u-bw(22),v-bw(22),bw(44),bw(44),0,bw(4),["#2a3450","#141c30","#1d2740"]);
      const dial=el("g",{transform:tf}); twGeo={tf:tf, R:R*1.02};
      dial.appendChild(el("circle",{cx:0,cy:0,r:R*1.02,fill:"#101828",stroke:"#3a4864",
        "stroke-width":1.4,"vector-effect":"non-scaling-stroke"}));
      for(let i=0;i<12;i++){ const a=i/12*Math.PI*2;
        dial.appendChild(el("line",{x1:Math.cos(a)*R*0.78,y1:Math.sin(a)*R*0.78,
          x2:Math.cos(a)*R*0.96,y2:Math.sin(a)*R*0.96,stroke:"#46577a","stroke-width":1.3,
          opacity:.7,"vector-effect":"non-scaling-stroke"})); }
      dial.appendChild(el("circle",{cx:0,cy:0,r:bw(3.5),fill:"#cfe0f2"}));
      g.appendChild(dial); } },
];
/* 히트박스·라벨 높이도 몸통과 같이 키운다 — 중심(레일 끝점)은 그대로.
   큐 3종은 몸통을 안 키웠으니(칩에 물림) 제외한다. */
const BODY_KEEP={swapq:1, sector:1, dbw:1};
if(BODY!==1) NODES.forEach(n=>{ if(BODY_KEEP[n.name]) return; const h=n.hit;
  h[0]-=h[2]*(BODY-1)/2; h[2]*=BODY; h[1]-=h[3]*(BODY-1)/2; h[3]*=BODY; h[4]*=BODY; });
const byName={}; NODES.forEach(n=>byName[n.name]=n);
function center(n){ const L=LAYOUT[n.name], h=n.hit; return [L.u+h[0]+h[2]/2, L.v+h[1]+h[3]/2]; }
/* 노드에 dock 사각형이 있으면 레일 끝점을 그 경계로 끌어낸다(안까지 안 들어간다).
   레일 방향은 그대로라 축 정렬이 안 깨진다 — 옛 '부착점(anchors)' 실패의 원인이 방향 변경이었다.
   칩 경로도 railPath 에서 나오므로 같이 짧아진다. */
function dockTrim(n,pts,iE,iN){
  if(!n||!n.dock) return;
  const R=n.dock(LAYOUT[n.name]), E=pts[iE], N=pts[iN];
  const du=N[0]-E[0], dv=N[1]-E[1];
  if(E[0]<R[0]||E[0]>R[2]||E[1]<R[1]||E[1]>R[3]) return;   /* 애초에 안에 없으면 둘 것 없다 */
  let t=1;
  const hit=(s,x,y)=>{ if(s>0&&s<t&&x>=R[0]-.01&&x<=R[2]+.01&&y>=R[1]-.01&&y<=R[3]+.01) t=s; };
  if(du) [R[0],R[2]].forEach(x=>{ const s=(x-E[0])/du; hit(s,x,E[1]+dv*s); });
  if(dv) [R[1],R[3]].forEach(y=>{ const s=(y-E[1])/dv; hit(s,E[0]+du*s,y); });
  if(t<1) pts[iE]=[E[0]+du*t, E[1]+dv*t];
}
function railPath(r){ const A=center(byName[r.from]), B=center(byName[r.to]);
  const pts=[A].concat((r.pts||[]).map(p=>[p.u,p.v])).concat([B]);
  dockTrim(byName[r.from], pts, 0, 1);
  dockTrim(byName[r.to],   pts, pts.length-1, pts.length-2);
  return pts; }

/* ── 구역 바닥 (맨 뒤) — 구역 1개 = 래퍼 g 1개(테두리 반투명이 등장 웨이브에 안 덮이게) ── */
function paintZones(){ ZONES.forEach(z=>{ const p=ZPAL[z.color]||ZPAL.net, g=el("g",{"data-z":z.color});
  prism(g,z.u,z.v,z.w,z.d,-6,6,[p.top,p.side,p.side]);
  const ea=p.dash?{"stroke-dasharray":"6 5"}:{};
  g.appendChild(el("line",Object.assign({x1:px(z.u,z.v+z.d),y1:py(z.u,z.v+z.d,0),
    x2:px(z.u+z.w,z.v+z.d),y2:py(z.u+z.w,z.v+z.d,0),stroke:p.edge,"stroke-width":1.6,opacity:.42},ea)));
  g.appendChild(el("line",Object.assign({x1:px(z.u+z.w,z.v),y1:py(z.u+z.w,z.v,0),
    x2:px(z.u+z.w,z.v+z.d),y2:py(z.u+z.w,z.v+z.d,0),stroke:p.edge,"stroke-width":1.6,opacity:.42},ea)));
  /* 구역 이름은 바닥에 눕혀서 — 판·레일과 같은 평면에 깔리고 건물이 앞을 가리면 깊이감이 된다.
     래퍼 g 안이라 등장 웨이브가 opacity 를 덮어쓰지 않는다(반투명 유지) */
  if(z.name){ const fz=(FLAT&&z.f)||z, s=+fz.ws||24, ls=ZW_LS*s, wg=el("g",{transform:floorMat(fz.lu,fz.lv)});
    wg.appendChild(el("text",{x:(ls/2).toFixed(1),y:(s*.34).toFixed(1),"text-anchor":"middle",
      "font-size":s,"font-weight":"900","letter-spacing":ls.toFixed(2),
      "font-family":"var(--sans)",fill:p.edge,opacity:(z.wo!=null?z.wo:.22)},z.name));
    g.appendChild(wg); }
  TZ.appendChild(g); }); }
paintZones();

/* ── 레일: 초기 디자인 방식 ──
   선이 아니라 '폭 있는 바닥 채널'. 채움은 흐름색을 거의 다 뺀 아주 어두운 tint라 정지 상태에서는 조용하고,
   색은 그 위를 흐르는 칩이 낸다. 일정 간격 이음선으로 컨베이어/통로 질감. */
const RCOL={recv:RECV,send:SEND,store:STORE};
const LTINT={recv:"#16243a", send:"#2a2412", store:"#12281c"};   /* 초기본 RTINT/STINT/GTINT 그대로 */
/* 폴리라인 하나를 따라 '폭 있는 띠' 를 통째로 그린다(바닥 + 꺾임 패치 + 그루브 모서리).
   교차 레일은 줄마다 이걸 한 번씩 불러서, 나중에 그린 줄이 앞 줄을 덮게 = 위로 지나가게 한다.
   knee(꺾임 좌표들)를 주면 그 반경 안쪽 구간에만 줄 밑에 살짝 넓은 어두운 띠를 먼저 깐다
   — 겹친 자리에서 어느 줄이 위인지 보이라고. 직선 구간의 모습은 그대로다. */
/* 채널 모서리 두 줄 중 어느 쪽이 '화면 위' 인가 — 그림자/빛을 나눠 칠하는 기준.
   바닥 오프셋 (pu,pv) 가 화면에서 세로로 얼마나 가는가 = ay·pu + by·pv (음수면 위).
   반드시 '아이소' 기저(ISO)로 재야 한다. 현재 PJ 로 재면 평면 사본에서는 ay 가 0 이라
   세로 레일에서 두 값이 같아져 판정이 뒤집히고, 아이소 그림과 평면 그림의 '같은 자리' 선이
   서로 반대쪽 모서리가 되어 전환 애니에서 선 하나가 레일을 가로질러 미끄러진다.
   (YAW=0 이면 ay=by=−KY 라 옛 식 (pu+pv)>=0 과 완전히 같은 결과다.) */
const UPSIGN=(pu,pv)=>(ISO.ay*pu+ISO.by*pv<=0?1:-1);
/* 바닥 위 앞뒤 순서(뒤에 있는 것부터 그린다) — 화면에서 위에 놓이는 쪽이 뒤다.
   옛 식은 (u+v) 내림차순이었는데 그것도 대칭일 때만 맞다. 같은 이유로 ISO 로 잰다. */
const DEPTH=(u,v)=>ISO.ay*u+ISO.by*v;
const XSHADE=.45, XSHADE_R=38, XSHADE_W=2.5;
function ribbon(g,pts,w,tint,knee){ const S=[], h=w/2;
  if(knee) knee.forEach(function(C){ const hs=h+XSHADE_W;
    for(let i=1;i<pts.length;i++){ const A=pts[i-1], B=pts[i];
      const du=B[0]-A[0], dv=B[1]-A[1], L=Math.hypot(du,dv); if(L<0.5) continue;
      const ux=du/L, uy=dv/L, wx=A[0]-C[0], wy=A[1]-C[1];
      const b=wx*ux+wy*uy, c=wx*wx+wy*wy-XSHADE_R*XSHADE_R, disc=b*b-c; if(disc<=0) continue;
      const t0=Math.max(0,-b-Math.sqrt(disc)), t1=Math.min(L,-b+Math.sqrt(disc)); if(t1<=t0) continue;
      const P0=[A[0]+ux*t0,A[1]+uy*t0], P1=[A[0]+ux*t1,A[1]+uy*t1], pu=-uy, pv=ux;
      g.appendChild(poly([[P0[0]+pu*hs,P0[1]+pv*hs],[P1[0]+pu*hs,P1[1]+pv*hs],
        [P1[0]-pu*hs,P1[1]-pv*hs],[P0[0]-pu*hs,P0[1]-pv*hs]],"#05080f",{opacity:String(XSHADE)})); } });
  for(let i=1;i<pts.length;i++){ const A=pts[i-1], B=pts[i];
    const du=B[0]-A[0], dv=B[1]-A[1], L=Math.hypot(du,dv); if(L<0.5) continue;
    S.push({A,B,L,pu:-dv/L,pv:du/L}); }
  S.forEach(s=>g.appendChild(poly([[s.A[0]+s.pu*h,s.A[1]+s.pv*h],[s.B[0]+s.pu*h,s.B[1]+s.pv*h],
    [s.B[0]-s.pu*h,s.B[1]-s.pv*h],[s.A[0]-s.pu*h,s.A[1]-s.pv*h]],tint)));
  for(let i=1;i<pts.length-1;i++){ const q=pts[i];
    g.appendChild(poly([[q[0]-h,q[1]-h],[q[0]+h,q[1]-h],[q[0]+h,q[1]+h],[q[0]-h,q[1]+h]],tint)); }
  S.forEach(s=>{ const upSign = UPSIGN(s.pu,s.pv);
    [[1,true],[-1,false]].forEach(q=>{ const e=q[0]*upSign*h, up=q[1];
      g.appendChild(el("line",{x1:px(s.A[0]+s.pu*e,s.A[1]+s.pv*e),y1:py(s.A[0]+s.pu*e,s.A[1]+s.pv*e,0),
        x2:px(s.B[0]+s.pu*e,s.B[1]+s.pv*e),y2:py(s.B[0]+s.pu*e,s.B[1]+s.pv*e,0),
        stroke:up?"#060a13":"#55688f","stroke-width":1,opacity:up?.6:.28})); }); }); }
const LANE_W=10, SEAM=22, SUB_W=10, SUB_GAP=4;   /* SUB_*: lanes>1(다중 파이프)일 때 줄 하나 폭/간격 — 줄 폭=일반 레인과 동일 */
/* 줄 하나가 중심선에서 벗어난 거리. 여기서 선언하는 이유는 클라 무리의 열 간격(grid())이 이 값을 쓰는데,
   그 grid() 가 바로 아래 paintRails()/paintBodies() 에서 불리기 때문 — 칩 쪽(R_*_L)에서 선언하면 늦다. */
const LOFF=SUB_W+SUB_GAP;
/* ── 이음선(셰브론) — 통로가 어느 쪽으로 흐르는지 ──
   가로로 곧게 긋던 이음선을 진행 쪽으로 얕게 꺾은 것이다. 마커를 새로 얹지 않고 있던 선의
   모양만 바꾼 것이라 도형 수가 안 늘고, 정지 상태의 조용함도 그대로다.
   (cu,cv)=이음선 중심 · (eu,ev)=진행 단위 · (pu,pv)=진행 수직 단위 · offs=줄 중심들 · subW=줄 하나 폭
   ※ 전체 폭을 한 번에 가로지르지 않고 '줄마다' 그린다. 한 줄로 그으면 3레인처럼 넓은 레일에서
     꺾임이 그만큼 커져 지그재그 울타리로 보인다(실측). 줄마다면 폭이 달라도 각도가 같다.
   ※ K(꺾임 깊이)는 줄 폭이 아니라 고정값이다 — 위와 같은 이유.
   ※ line 이 아니라 polyline 인 것에 딸린 곳이 둘 있다:
     - 병목 청사진의 wireify() 는 레일에서 line 을 지운다. 이 선도 같은 이유로 지워야 해서 거기서 polyline 도 받는다.
     - 평면화 보간은 태그가 1:1 로 맞아야 도는데, 아이소·평면 두 벌을 같은 코드가 그리므로 그대로 맞는다. */
function seamAt(g,cu,cv,eu,ev,pu,pv,offs,subW){
  const h=subW/2, K=4.0;
  offs.forEach(c=>{ const bu=cu+pu*c, bv=cv+pv*c;
    g.appendChild(el("polyline",{points:[[bu+pu*h,bv+pv*h],[bu+eu*K,bv+ev*K],[bu-pu*h,bv-pv*h]]
      .map(q=>P(q[0],q[1],0)).join(" "),fill:"none",stroke:"#4e6390","stroke-width":1,
      "stroke-linejoin":"round",opacity:.42})); }); }
function paintRails(){
RAILS.forEach(r=>{ const path=railPath(r), tint=LTINT[r.color]||LTINT.recv,
    g=el("g",{"data-z":zonesOf(r.from,r.to)});
  const NL=r.lanes||1;                                   /* 레일 줄 수 — 기본 1 */
  const subW = NL>1 ? SUB_W : LANE_W;
  const totW = NL>1 ? NL*SUB_W+(NL-1)*SUB_GAP : LANE_W;  /* 전체 폭(패치·이음선 기준) */
  const offs=[]; for(let i=0;i<NL;i++) offs.push((i-(NL-1)/2)*(SUB_W+SUB_GAP));
  const segs=[];
  for(let i=1;i<path.length;i++){ const A=path[i-1], B=path[i];
    const du=B[0]-A[0], dv=B[1]-A[1], L=Math.hypot(du,dv);
    if(L<0.5) continue;
    segs.push({A,B,du,dv,L, pu:-dv/L, pv:du/L}); }       /* pu,pv = 진행 수직 단위벡터 */
  /* 교차 레일 — 세그먼트별로 자르지 않고 줄마다 통째로 그린다(그래야 겹침이 보인다).
     이음선은 교차 구간에선 건너뛴다 — 서로 지나가는 줄을 한 다발로 묶어 보이면 안 되니까. */
  if(r.cross && NL>1){
    const knee=path.slice(1,-1);
    const skip=(cu,cv)=>knee.some(q=>Math.hypot(cu-q[0],cv-q[1])<totW);
    offs.forEach(c=>ribbon(g, offsetPath(path,c,true), subW, tint, knee));
    segs.forEach(s=>{
      for(let d=SEAM; d<s.L-2; d+=SEAM){ const t=d/s.L, cu=s.A[0]+s.du*t, cv=s.A[1]+s.dv*t;
        if(skip(cu,cv)) continue;
        seamAt(g,cu,cv,s.du/s.L,s.dv/s.L,s.pu,s.pv,offs,subW); } });
    TR.appendChild(g); return; }
  /* 1) 통로 바닥 — 줄 수만큼 나란히 */
  segs.forEach(s=>offs.forEach(c=>{ const h=subW/2;
    g.appendChild(poly([[s.A[0]+s.pu*(c+h),s.A[1]+s.pv*(c+h)],[s.B[0]+s.pu*(c+h),s.B[1]+s.pv*(c+h)],
      [s.B[0]+s.pu*(c-h),s.B[1]+s.pv*(c-h)],[s.A[0]+s.pu*(c-h),s.A[1]+s.pv*(c-h)]],tint)); }));
  /* 2) 꺾이는 지점을 정사각 패치로 메움(안 그러면 바깥쪽에 홈이 생김) — 전체 폭 기준 */
  for(let i=1;i<path.length-1;i++){ const q=path[i], h=totW/2;
    g.appendChild(poly([[q[0]-h,q[1]-h],[q[0]+h,q[1]-h],[q[0]+h,q[1]+h],[q[0]-h,q[1]+h]],tint)); }
  /* 3) 이음선 — 줄마다 진행 쪽으로 꺾인 셰브론(seamAt) */
  segs.forEach(s=>{
    for(let d=SEAM; d<s.L-2; d+=SEAM){ const t=d/s.L, cu=s.A[0]+s.du*t, cv=s.A[1]+s.dv*t;
      seamAt(g,cu,cv,s.du/s.L,s.dv/s.L,s.pu,s.pv,offs,subW); } });
  /* 4) 채널 모서리 음영(그루브) — 줄마다: 화면상 위 모서리=그림자·아래=빛 */
  segs.forEach(s=>{ const upSign = UPSIGN(s.pu,s.pv);
    offs.forEach(c=>{ [[1,true],[-1,false]].forEach(q=>{ const e=c+q[0]*upSign*subW/2, up=q[1];
      g.appendChild(el("line",{x1:px(s.A[0]+s.pu*e,s.A[1]+s.pv*e),y1:py(s.A[0]+s.pu*e,s.A[1]+s.pv*e,0),
        x2:px(s.B[0]+s.pu*e,s.B[1]+s.pv*e),y2:py(s.B[0]+s.pu*e,s.B[1]+s.pv*e,0),
        stroke:up?"#060a13":"#55688f","stroke-width":1,opacity:up?.6:.28})); }); }); });
  TR.appendChild(g); }); }
paintRails();

/* ── 노드 몸통 (뒤→앞) ── */
function paintBodies(){
NODES.slice().sort((a,b)=>{ const A=LAYOUT[a.name],B=LAYOUT[b.name]; return DEPTH(A.u,A.v)-DEPTH(B.u,B.v); })
  .forEach(n=>{ const L=LAYOUT[n.name], g=el("g");
    drawZone=zoneOf(n.name); if(drawZone) g.setAttribute("data-z",drawZone);   /* 몸통 안에서 부르는 shadow() 도 이 값을 물려받는다 */
    /* 어느 조각이 어느 노드의 것인가를 적어 두는 표. 값은 구역이 아니라 노드다 —
       Timing Wheel·SwapQ 는 card:"iocp" 라 IOCP 워커와 한 덩어리로 묶인다.
       지금은 이 값을 보는 CSS 가 없다(노드 단위 강조는 노드 상세 카드와 함께 걷어냈다). 되살릴 때 쓴다. */
    if(n.card) g.setAttribute("data-node",n.card);
    n.draw(g,L.u,L.v); TB.appendChild(g); });
drawZone=""; }   /* 노드 그리기가 끝났으므로 되돌린다 — 뒤에서 addShad 를 부르는 곳은 없지만 상태를 남기지 않는다 */
paintBodies();

/* ── 라벨 (LABELS 오프셋 · texts 배열이 있으면 해당 줄 글자를 덮어씀 — 에디터에서 수정한 문구) ── */
function paintLabels(){
NODES.forEach(n=>{ const c=center(n), az=n.hit[4]||0, base=LABELS[n.name]||{dx:0,dy:0},
    fo=FLAT&&FLABELS[n.name], off=fo?{dx:fo.dx,dy:fo.dy,texts:base.texts}:base;
  const ax=px(c[0],c[1])+off.dx, ay=py(c[0],c[1],az)+off.dy, z=zoneOf(n.name);
  /* 이름표에도 같은 표를 붙인다 — 도형만 살리면 이름이 죽은 채로 남아 무엇이 켜진 건지 안 읽힌다 */
  n.lab.lines.forEach((ln,i)=> TL.appendChild(el("text",Object.assign({x:ax.toFixed(1),y:(ay+ln[4]).toFixed(1),
    "text-anchor":n.lab.anch||"middle","font-size":ln[1],"font-weight":ln[3]||"800",fill:ln[2],"font-family":"var(--sans)",
    "data-z":z}, n.card?{"data-node":n.card}:null),
    (off.texts&&off.texts[i]!=null)?off.texts[i]:ln[0]))); }); }
paintLabels();

/* ═══ 노드와 그 설계 문서 ═══ */
/* 이 페이지는 미끼다 — 여기서 다 설명하지 않고 노션 문서로 보낸다. 그래서 노드마다 남기는 것은
   sum(한 줄로 '무엇을 하는가') 과 docs(그 노드의 설계 문서) 둘뿐이다. '왜 그렇게 했는가' 를 적던
   impl 문단은 걷어냈다: 그 내용이 곧 문서의 내용이라, 여기 적으면 미끼를 미리 까먹는 셈이었다.

   어느 구역인지는 여기 안 적는다 — ZI[].nodes 가 이미 갖고 있어서, 두 곳에 두면 어긋난다(옛 zone 필드를 지운 이유).
   docs = [제목, 노션 페이지 id, (선택) 한 줄]. id 는 대시 없는 32자로, NOTION 앞에 붙여 공개 주소가 된다.
   정본은 노션 DB "네트워크 라이브러리 설계&구현" — 페이지를 옮기거나 이름을 바꾸면 여기도 같이 고칠 것.
   ※ 'dirty 선별·주기 batch 저장' 은 독립 페이지가 아니라 DB Thread 문서 안의 설계 결정 ②④ 다.
     두 줄로 두면 같은 페이지로 가는 링크가 둘이 되므로 한 줄로 합치고, 무엇이 들었는지는 꼬리표로 적었다. */
const NOTION="https://feline-vacation-d6d.notion.site/";
const ND={
  client:{nm:"클라이언트",x:"×5,000",sum:"인덱스 슬롯 세션 · sessionId 로 ABA 차단",
    docs:[["세션 관리 방식과 세션 ABA 문제 해결","34116a0b9f59805ca586d7c8c3597545"]]},
  accept:{nm:"Accept",x:"×1",sum:"수락 전담 1개 · AcceptEx 미사용",
    docs:[["AcceptThread 분리 (AcceptEx 미사용)","34116a0b9f59802eaf47c3ff8e15e082"]]},
  iocp:{nm:"IOCP 워커",x:"×4",   /* 씬 라벨과 같은 값 — 운영 INI WorkerThreads=4 */sum:"완료 통지 파싱 → 공유 큐 · 틱마다 swap 1회",
    docs:[["세션당 Recv/Send 1회 제한","34116a0b9f5980839d4ad67dc23f9996"],
          ["Timing Wheel (타임아웃)","35816a0b9f59804db9bff9d6679696bc"],
          ["Worker→Game SwapQ","37316a0b9f5980429473c20365f71778"]]},
  send:{nm:"Send 워커",x:"×3",sum:"uniqueId%3 고정 배분 → WSASend",
    docs:[["SendThread 분리 유무와 이슈","34116a0b9f5980cca5f2e65b5122a6fe"]]},
  loop:{nm:"게임 루프",x:"×1",sum:"단일 코어 · 섹터 격자 AOI · viewlist 미채택",
    docs:[["섹터/맵 크기 · viewlist 미채택 이유","37b16a0b9f5980b9b4d5d0734909b4a9"]]},
  dbw:{nm:"DB 워커",x:"×1",sum:"dirty 선별 · 주기 batch · accountId%K 로 확장 가능",
    /* 꼬리표에 sum 과 겹치는 'dirty 선별' 은 안 적는다 — 바로 윗줄이 이미 하는 말이라 두 줄이 같아 보인다.
       그 문서에만 있는 것을 고른다(설계 결정 표 ④⑥⑦⑨). */
    /* 꼬리표는 한 줄까지다 — 카드에서 부제가 달린 문서는 이것 하나뿐이라, 두 줄이 되면
       그 자리만 문단처럼 보인다. 열 가지를 다 적을 자리가 아니라 맛보기 두 개면 된다. */
    docs:[["DB Thread 분리 및 저장 설계","39516a0b9f59809fb782d3265404a0fa",
           "설계 결정 10가지 — 배치 핸드오프 · 백프레셔"]]},
  mysql:{nm:"MySQL",x:"",sum:"주기적 스냅샷 UPSERT 로 영속화",docs:[]}
};
/* ═══ 구역 개요 — 구역 버튼을 누르면 오른쪽 열에 뜨는 단 하나의 화면 ═══
   구역 버튼은 원래 '강조만' 하는 버튼이었다. 무엇이 밝아졌는지는 보이는데 그게 무슨 구역인지는
   안 알려 주고 있었다. 그래서 이미 보이는 버튼(구역)에 개요를 달았고, 지금은 그 개요가 노드와
   설계 문서 링크까지 한 화면에 담는다 — 씬은 한 번도 안 눌러도 된다.
   키는 씬의 구역 키(data-z)와 같은 문자열이라 CSS·강조 코드와 같은 말을 쓴다. */
/* lead 는 한 줄이다(길어도 두 줄). 원래는 두세 문장이었는데, 뒷문장이 하는 말을 바로 아래
   노드 줄이 다시 하고 있었다 — 문단을 읽고 목록을 또 읽는 셈이라 카드가 길어 보였다.
   지운 뒷문장과 그 말을 이미 하고 있는 자리:
     클라 "부담이 어디서 갈리는지는 아래 세 구역이 정한다" → 구역 버튼 넷이 그대로 보여 준다
     네트워크 "게임 스레드는 네트워크 일을 하지 않는다"    → 씬의 구역 분리 + 게임 카드의 '한 코어'
     DB   "dirty 만 골라 batch … swap 한 번으로 UPSERT"    → 노드 줄 'dirty 선별 · 주기 batch',
                                                            'MySQL — 주기적 스냅샷 UPSERT 로 영속화'
   숫자도 마찬가지다. 클라의 '5,000' 은 제목 옆(동시 5,000)과 노드(×5,000)가 이미 두 번 말한다. */
const ZI={
  outside:{nm:"클라이언트",ac:"#93a5c2",sub:"동시 5,000",
    lead:"서버 밖이다. 이동 · 채팅을 보내는 <b>부하 클라이언트</b>.",
    nodes:["client"]},
  net:{nm:"네트워크",ac:"var(--net)",sub:"스레드 8",
    lead:"수락 · 수신 · 송신을 <b>세 갈래 전담 스레드</b>로 나눈다.",
    nodes:["accept","iocp","send"]},
  game:{nm:"게임",ac:"var(--game)",sub:"스레드 1",
    /* '한 코어' '25fps' '병목' 셋 다 안 적는다 — 강조된 씬의 게임 루프 이름표가 세 줄로 그대로
       말하고 있다("게임 루프 / 단일 코어 · 25fps 틱 / ◆ BOTTLENECK", scene.js NODES). 카드에는
       그 이름표가 못 하는 말만 남긴다: 다른 스레드에는 게임 로직이 없다는 것. */
    lead:"게임 로직 <b>전부</b>가 이 한 코어에서 돈다.",
    nodes:["loop"]},
  store:{nm:"데이터베이스",ac:"var(--store)",sub:"스레드 1",
    lead:"저장이 게임 스레드를 <b>막지 않게</b> 한다.",
    nodes:["dbw","mysql"]}
};
const card=document.getElementById("card"), cbd=document.getElementById("cardbd");
function closeCard(){ if(card) card.classList.remove("on"); }

/* 구역 개요 — 구역 버튼이 여는 단 하나의 화면이다. 씬 강조는 구역 버튼(apply)이 이미 걸어 놨으므로
   여기서는 글만 채운다.
   옛 구조는 여기서 '상세 ▸' 를 한 번 더 눌러야 노드 상세 카드가 떴고, 문서 제목은 그 안에 글자로만
   있었다 — 두 번 눌러도 노션에 못 갔다. 이 페이지는 미끼이므로 그 반대가 맞다: 문서를 첫 화면으로
   끌어올리고, 제목 자체를 노션으로 나가는 링크로 만든다. 클릭 두 번이 한 번이 되고, 도착지가 생긴다.
   라벨(.k)도 안 붙인다 — '구역 개요' 는 바로 밑 제목('네트워크')과 '이 구역의 노드 3' 이 이미 하는 말이었다. */
/* brief=true 는 진입 순회가 쓰는 미리보기다 — 제목과 한 줄까지만 짓고 멈춘다.
   순회 중에 카드를 통째로 띄우면 두 가지가 깨진다: 카드 높이가 구역마다 199~437px 이라
   2.5초 사이 240px 씩 늘었다 줄고(실측), 네트워크 칸에서는 문서 링크 다섯 개가 620ms 스쳐 간다.
   못 읽고 못 누르는 링크는 어포던스가 아니라 소음이다. 제목+한 줄이면 네 칸 높이가 같아져
   깜빡임이 없고, 알리려던 것('버튼을 누르면 오른쪽에 이 글이 뜬다')은 그대로 전해진다. */
function openZone(z,brief){ const Z=ZI[z]; if(!Z||!card) return;
  /* 라벨에 문서 수까지 적는다 — 같은 한 줄로 '여기서 몇 개가 노션으로 나가는가' 를 먼저 알린다 */
  const nd=Z.nodes.reduce(function(s,k){ return s+((ND[k]&&ND[k].docs)?ND[k].docs.length:0); },0);
  let h='<h3>'+Z.nm+'<span>'+Z.sub+'</span></h3>'+
        '<p class="cl">'+Z.lead+'</p>';
  /* 순회본에도 이 라벨은 남긴다 — 목록을 안 펴도 '여기 문서가 다섯' 이 숫자로 먼저 간다.
     '버튼을 누르면 펼쳐진다' 같은 안내는 붙이지 않는다. 순회가 버튼을 대신 눌러 보이는 것과
     같은 말이라, 씬 위에 있던 안내 한 줄('구역을 고르면 …')을 지웠을 때와 같은 이유다. */
  h+='<div class="lb">노드 '+Z.nodes.length+(nd?' · 설계 문서 '+nd:'')+'</div>';
  if(brief){ cbd.innerHTML=h;
    card.style.setProperty("--ac", Z.ac); card.classList.add("on"); return; }
  h+=Z.nodes.map(function(k){ const n=ND[k]; if(!n) return "";
    let s='<div class="zn-it"><span class="t">'+n.nm+(n.x?'<em>'+n.x+'</em>':'')+'</span>'+
          '<span class="d">'+n.sum+'</span>';
    /* 링크는 새 탭으로 — 미끼를 물어도 이 페이지는 뒤에 남아 있어야 다른 구역도 마저 본다 */
    s+=n.docs.map(function(d){
      return '<a class="dl" href="'+NOTION+d[1]+'" target="_blank" rel="noopener">'+
             '<span class="ic">▸</span><span class="t2">'+d[0]+
             (d[2]?'<span class="sd">'+d[2]+'</span>':'')+'</span><span class="go">↗</span></a>'; }).join("");
    if(!n.docs.length) s+='<div class="dnone">저장소 자체라 별도 문서가 없다 — 설계는 DB 워커에</div>';
    return s+'</div>'; }).join("");
  /* 카드는 문서 링크에서 끝난다. 한때 맨 아래에 '이 구역에서 잰 실험 N건 → 1-2 병목·실험' 을 달았는데,
     누를 수 없는 글이면서 화살표로 이동을 흉내 냈다 — 실제 이동은 늘 보이는 1-2 탭이 맡는다. */
  cbd.innerHTML=h;
  card.style.setProperty("--ac", Z.ac);   /* 왼쪽 세로선 색 = 씬에서 살아남은 도형 색 */
  card.classList.add("on"); }

/* 닫기는 곧 강조 해제다. 옛날엔 '노드 상세 → 구역 개요 → 전체' 로 한 칸씩 물러났는데,
   중간 단계가 사라져 물러날 곳이 하나뿐이다. 카드 안의 닫기 줄도 없앴으므로 입구는 Esc 와
   구역 버튼(토글) 둘이다 — 그래서 키 리스너는 카드 유무와 무관하게 건다. */
function backCard(){
  if(svg && svg.getAttribute("data-zone") && window.resetZone){ window.resetZone(); return; }
  closeCard(); }
document.addEventListener("keydown",function(e){ if(e.key==="Escape") backCard(); });
/* 도형 위 투명 히트박스(gHit)는 걷어냈다. 노드로 들어가는 입구는 구역 개요 하나뿐이다.
   NODES[].hit 는 남는다: 클릭 판정이 아니라 노드의 상자 크기라서, 중심점(center)·라벨 위치·
   BODY 축소가 전부 이 값을 쓴다. */

/* ═══════════════ Stage 2 — 칩 흐름 (경로는 전부 RAILS에서 뽑아 씀) ═══════════════
   수신 : 클라 → Accept → IOCP 워커 → SwapQ 공유 큐에 적재
   스왑 : 공유 큐가 차면 통째로 로컬 큐로 미끄러짐(락 1회) → 게임으로 하나씩 드레인
   응답 : 게임 → 송신 큐 3개에 칩이 하나씩 도착할 때마다 칸 하나씩 적재 → 아홉 칸이 차면 파이프별로 3개씩 출발 → 도착한 것이 같은 파이프로 클라 복귀
   저장 : 게임 → DB 워커 큐에 dirty 적재 → 가득 차면 통째로 인출돼 MySQL로 (SwapQ와 같은 메커니즘)
   타임아웃 : 수신 칩이 Accept·IOCP 를 지날 때마다 Timing Wheel 로 등록 신호가 하나씩 (휠 바늘 회전 + 링 점멸)
   ※ 레일 굵기/색은 건드리지 않는다. 칩만 얹는다. */
const RMOT=matchMedia("(prefers-reduced-motion:reduce)").matches;

/* ── 경로 유틸: (u,v) 웨이포인트 → 누적 길이 세그먼트 ── */
function seg(wp){ const s=[]; let tot=0;
  for(let i=1;i<wp.length;i++){ const du=wp[i][0]-wp[i-1][0], dv=wp[i][1]-wp[i-1][1], l=Math.hypot(du,dv);
    s.push({a:wp[i-1],b:wp[i],l,acc:tot}); tot+=l; } return {s,tot,wp}; }
/* 경로 시작보다 뒤(음수 거리)는 첫 구간 방향으로 뒤로 연장해서 그린다.
   큐 안에 놓인 칩이 '출발선 뒤'에 서 있다가 그대로 밀려 나오게 하는 데 쓴다. */
function atExt(R,d){ if(d>=0||!R.s.length) return at(R,d);
  const s=R.s[0], ux=(s.b[0]-s.a[0])/s.l, uy=(s.b[1]-s.a[1])/s.l;
  return [s.a[0]+ux*d, s.a[1]+uy*d]; }
function at(R,d){ if(!R.s.length) return [0,0];
  d=Math.max(0,Math.min(d,R.tot));
  let gi=R.s.findIndex(x=>d<=x.acc+x.l); if(gi<0) gi=R.s.length-1;
  const g=R.s[gi], t=g.l?(d-g.acc)/g.l:0;
  return [g.a[0]+(g.b[0]-g.a[0])*t, g.a[1]+(g.b[1]-g.a[1])*t]; }
/* ── 3줄 파이프: 줄마다 '자기 경로'를 미리 만든다 ──
   예전엔 칩이 중심선 거리로 달리면서 수직 오프셋만 받았다. 그러면 꺾임에서 바깥 줄이
   안쪽보다 훨씬 긴 호를 같은 시간에 돌아야 해서 그 구간만 두 배 넘게 빨라졌다(눈에 띔).
   중심선을 줄 간격만큼 평행이동한 폴리라인을 만들어 두면(꺾임은 두 직선의 교점 = 마이터),
   각 줄이 자기 길이를 같은 속도로 달리므로 어느 줄도 빨라지지 않는다. */
function offsetPath(wp,off,cross){
  if(!off) return wp.slice();
  const L=[]; let k=0;
  for(let i=1;i<wp.length;i++){ const a=wp[i-1], b=wp[i];
    const du=b[0]-a[0], dv=b[1]-a[1], l=Math.hypot(du,dv); if(l<0.5) continue;
    /* cross = 꺾일 때마다 오프셋 부호를 뒤집는다 → 바깥 두 줄이 자리를 맞바꾸며 X 로 겹친다.
       마이터(두 직선의 교점) 계산은 그대로라 꺾임이 자연스럽고, 덤으로 세 줄 길이가 똑같아진다
       (게임→송신큐 192/220/248 → 220 셋, Send→클라 312/340/368 → 340 셋). */
    const o = cross ? (k%2 ? -off : off) : off; k++;
    const ou=-dv/l*o, ov=du/l*o;                           /* 진행방향의 수직 = 레일 그릴 때와 같은 부호 */
    L.push({p:[a[0]+ou,a[1]+ov], q:[b[0]+ou,b[1]+ov], d:[du/l,dv/l]}); }
  if(!L.length) return wp.slice();
  const out=[L[0].p];
  for(let i=1;i<L.length;i++){ const A=L[i-1], B=L[i];
    const cr=A.d[0]*B.d[1]-A.d[1]*B.d[0];
    if(Math.abs(cr)<1e-6){ out.push(B.p); continue; }       /* 나란한 두 구간 = 꺾임 아님 */
    const t=((B.p[0]-A.p[0])*B.d[1]-(B.p[1]-A.p[1])*B.d[0])/cr;
    out.push([A.p[0]+A.d[0]*t, A.p[1]+A.d[1]*t]); }
  out.push(L[L.length-1].q);
  return out; }
function lanePaths(R,cross){ return [-LOFF,0,LOFF].map(o=>seg(offsetPath(R.wp,o,cross))); }
/* RAILS에서 경로를 꺼내 이어붙임 — 레일을 옮기면 칩 경로도 같이 따라옴 */
function wpOf(f,t){ const r=RAILS.find(x=>x.from===f&&x.to===t); return r?railPath(r):null; }
function route(){ let wp=[];
  for(let i=0;i<arguments.length;i++){ const w=wpOf(arguments[i][0],arguments[i][1]); if(!w) continue;
    wp = wp.length ? wp.concat(w.slice(1)) : w.slice(); }
  return seg(wp); }
function mix(a,b,t){ a=parseInt(a.slice(1),16); b=parseInt(b.slice(1),16);
  const ar=a>>16,ag=(a>>8)&255,ab=a&255, br=b>>16,bg=(b>>8)&255,bb=b&255;
  return "#"+((1<<24)+((Math.round(ar+(br-ar)*t))<<16)+((Math.round(ag+(bg-ag)*t))<<8)
    +Math.round(ab+(bb-ab)*t)).toString(16).slice(1); }
/* 칩 = 바닥에 누운 정사각형. 옛 코드는 '마름모(가로 s · 세로 s·KY/KX)' 로 못 박혀 있었는데,
   그 모양은 좌우대칭 아이소일 때만 바닥 정사각형과 일치한다. 요각이 들어가면 평행사변형이라
   같은 식으로 그리면 칩이 레일·큐 칸과 미세하게 어긋난다(슬롯에 쌓을수록 벌어진다).
   그래서 두 축을 그대로 세워 그린다. s 의 뜻은 그대로 둔다(호출부 숫자를 안 건드리려고):
   s = 옛 마름모의 가로 반폭 → 월드 한 변 = s/KX. 그 절반이 축 방향 반벡터다.
   YAW=0 이면 CH_P=(0,−KY/KX)·s, CH_Q=(1,0)·s 가 되어 옛 마름모와 꼭짓점까지 같다. */
const CH_P=[(ISO.ax+ISO.bx)/(2*KX), (ISO.ay+ISO.by)/(2*KX)];
const CH_Q=[(ISO.ax-ISO.bx)/(2*KX), (ISO.ay-ISO.by)/(2*KX)];
function setChip(e,x,y,s){ e.setAttribute("points",
  (x+s*CH_P[0]).toFixed(1)+","+(y+s*CH_P[1]).toFixed(1)+" "+
  (x+s*CH_Q[0]).toFixed(1)+","+(y+s*CH_Q[1]).toFixed(1)+" "+
  (x-s*CH_P[0]).toFixed(1)+","+(y-s*CH_P[1]).toFixed(1)+" "+
  (x-s*CH_Q[0]).toFixed(1)+","+(y-s*CH_Q[1]).toFixed(1)); }
/* z = 이 칩이 타는 레일의 구역(구역 강조에서 레일과 같이 살고 죽으라고) — 레일이 두 구역에 걸치면 둘 다 적는다 */
function pool(n,fill,layer,z){ const a=[];
  for(let i=0;i<n;i++){ const e=el("polygon",{points:"0,0",fill,opacity:"0","data-z":z||""});
    layer.appendChild(e); a.push({e,st:"wait",d:0,delay:0}); } return a; }
function emit(p){ return p.find(c=>c.st==="wait"); }
/* 양끝 페이드 */
function fade(d,tot,inL,outL){ return Math.max(0,Math.min(1,d/inL,(tot-d)/outL)); }

const R_RECV = route(["clients","accept"],["accept","iocp"],["iocp","swapq"]);
const R_DRAIN= route(["swapq","game"]);
const R_FAN  = route(["game","sector"]);
const R_BUND = route(["sector","send"]);
const R_OUT  = route(["send","clients"]);
const R_DIRTY= route(["game","dbw"]);
const R_STORE= route(["dbw","mysql"]);
const R_TWA  = route(["accept","timer"]);
const R_TWI  = route(["iocp","timer"]);
/* 응답 왕복 3구간은 줄이 3개 — 줄별 경로를 미리 뽑아 둔다(lane 0/1/2 = 안쪽/가운데/바깥). LOFF 는 레일 폭 옆에서 선언 */
const R_FAN_L=lanePaths(R_FAN,true), R_BUND_L=lanePaths(R_BUND), R_OUT_L=lanePaths(R_OUT,true);
/* 교차하면 fan 줄 i 는 송신 큐의 반대쪽 홈에 도착한다 — 칸 채우기 인덱스를 뒤집어 준다 */
const FAN_END=[2,1,0];
/* 드레인 칩이 레이어를 갈아타는 지점.
   SwapQ 판 위에 있는 동안은 건물 앞(gChip)이어야 판에 안 가리고, 판을 벗어난 뒤에는
   건물 뒤(gChipBack)여야 게임 큐브가 칩을 가린다 — 다른 칩들과 같은 규칙.
   한 레이어로는 둘 다 안 된다: 건물은 (u+v) 내림차순이라 SwapQ 가 게임 큐브보다 나중에
   그려지므로, 그 사이에 끼워 넣으면 '큐브 위 + 판 아래' 가 되어 정확히 반대가 된다.
   기준 = 판 +u 끝(SQ_HW) + 칩 반폭(6) → 칩이 판을 완전히 벗어난 뒤에 갈아탄다. */
const DRAIN_HOP=SQ_HW+6;

/* 수신 칩만 구역이 고정이 아니다 — 레일 셋(클라→Accept→IOCP→SwapQ)을 잇달아 타면서 구역이 바뀐다.
   그래서 출발할 때 첫 구간 값으로 시작하고, Accept·IOCP 를 지날 때 아래 프레임 루프에서 갈아 끼운다. */
const recvChips = pool(11, RECV,      gChipBack, zonesOf("clients","accept"));
/* 드레인은 출발할 때만 건물 앞(gChip) — 큐 안에서 출발해 SwapQ 판 위를 지나야 해서.
   판을 벗어나면 gChipBack 으로 옮겨 게임 큐브 뒤로 들어간다(DRAIN_HOP) */
const drainChips= pool(10, "#9adcff", gChip,     zonesOf("swapq","game"));
const fanChips  = pool(13, SEND,      gChipBack, zonesOf("game","sector"));
const bundChips = pool(12, SEND,      gChipBack, zonesOf("sector","send"));   /* 큐 3개 × 3개 = 한 번에 9개가 나간다 */
/* 복귀 구간(send→클라)이 길어 앞 묶음이 아직 가는 중에 다음 묶음이 출발한다 —
   풀이 모자라면 emit 이 null 을 돌려줘 어떤 줄은 3개, 어떤 줄은 1개만 나가 불규칙해 보인다 */
const outChips  = pool(27, RECV,      gChipBack, zonesOf("send","clients"));   /* Send 워커에서 클라로 — 그 구간 레일과 같은 파랑 */
const dirtyChips= pool(8,  STORE,     gChipBack, zonesOf("game","dbw"));
/* 인출된 것들은 판 위(큐 안)에서 출발하므로 드레인과 같은 이유로 건물 앞(gChip) */
const saveChips = pool(10, "#7fe6b0", gChip,     zonesOf("dbw","mysql"));
/* 수신 칩이 Accept·IOCP 를 지날 때마다 하나씩 나가므로(0.3초 간격 × 두 경로) 한 레일에 8개쯤이 동시에 떠 있다 */
const twChips   = pool(20, "#7fa8d8", gChipBack, zonesOf("accept","iocp","timer"));

/* ── SwapQ: 공유 큐(칸막이 왼쪽)에 쌓였다가 통째로 로컬 큐(오른쪽)로 ── */
const QMAX=SQ_N, SQ={u:LAYOUT.swapq.u, v:LAYOUT.swapq.v+8};   /* v+8 = 판 중심(=IOCP·게임과 같은 축선) */
let qShared=0;
/* 쌓였다 한꺼번에 나가는 칩은 이동 중에도 서로 붙어 있어야 한다.
   → 시간 지연(delay)이 아니라 **거리**를 한 칸(SLOT)씩 뒤로 밀어 출발시킨다(d = -i*SLOT).
     시간으로 벌리면 지연이 프레임 단위로 반올림돼(0.045s 를 60fps 로 = 0.05s) 매번 사이가 벌어진다. */
const pile=[]; for(let i=0;i<QMAX;i++){ const e=el("polygon",{points:"0,0",fill:"#9adcff",opacity:"0",
    "data-z":zoneOf("swapq")});   /* 쌓인 자리는 SwapQ 판 위 = 게임 구역 */
  gChip.appendChild(e); pile.push(e); }
/* 수신 칩이 SwapQ 판에 올라서는 지점 — 여기서부터 건물 앞(gChip) 레이어로 올린다.
   드레인 칩의 DRAIN_HOP 과 같은 처리를 방향만 뒤집은 것이다(저쪽은 판을 벗어날 때 뒤로 간다).
   이게 없으면 칩이 판 뒤로 들어가 한 번 사라졌다가 칸에 다시 나타나 '버퍼링'처럼 보인다. */
const SWAP_ON=R_RECV.tot-(SQ_HW+6);
/* 칸 i 의 중심까지의 경로 거리 — 칸은 IOCP 쪽(-u)으로 자라니 뒤 칸일수록 일찍 멈춘다.
   칩은 자기가 들어갈 칸에 닿는 순간 그대로 쌓인다 = 도착과 적재 사이에 빈 시간이 없다. */
const slotD=i=>R_RECV.tot-(Q_HEAD+i*SLOT);

/* ── 송신 큐 ×3: 아홉 칸이 다 차면 통째로 ── */
/* 칸은 '칩이 실제로 도착할 때' 찬다. 게임이 세 줄로 동시에 보내므로 세 큐가 같이 한 칸씩
   차오른다(세션마다 워커가 고정 — uniqueId%3). secN[k] = 큐 k 에 쌓인 칸 수(0~3).
   아홉 칸이 다 찬 뒤 다음 것이 도착하면 그때 9개가 통째로 나간다. */
const SEC_ROWS=3; let secN=[0,0,0], secFlash=0;
const secTotal=()=>secN[0]+secN[1]+secN[2];

/* ── DB 워커 큐: 게임이 dirty 를 쌓고, 워커가 통째로 인출해 MySQL 로 ──
   SwapQ 와 완전히 같은 메커니즘(코드도 같은 패턴이다 — DBWorker.h 가 SendWorker 를 복제했다).
   판 중심 = 레일 끝점(노드 중앙)이라, 인출된 덩어리는 dbw→mysql 레일을 그대로 탄다. */
const DQ={u:LAYOUT.dbw.u+37, v:LAYOUT.dbw.v+22};
/* 드레인 칩과 같은 처리(DRAIN_HOP 참고). DB 큐 판 위에서는 건물 앞(gChip)이라야 판에 안 가리고,
   판을 벗어난 뒤에는 건물 뒤(gChipBack)라야 MySQL 블록이 칩을 가린다.
   기준 = 판 +u 끝(DBQ_HW) + 칩 반폭(6). 예전엔 블록 앞에서 경로를 잘랐는데(STORE_END),
   그러면 '블록 뒤로 들어간다'가 아니라 '블록 앞에서 사라진다'로 보인다. */
const STORE_HOP=DBQ_HW+6;
let qStore=0;
const dpile=[]; for(let i=0;i<DBQ_N;i++){ const e=el("polygon",{points:"0,0",fill:"#7fe6b0",opacity:"0",
    "data-z":zoneOf("dbw")});   /* 쌓인 자리는 DB 워커 큐 판 위 = 저장 구역 */
  gChip.appendChild(e); dpile.push(e); }

/* ── 통째 스왑 순간의 번쩍 — 세 큐(SwapQ · 송신 큐 ×3 · DB 워커 큐)가 같은 신호를 쓴다.
   '한 칸씩 차다가 어느 순간 통째로 빠진다' 가 이 그림이 말하려는 것이라, 그 순간에만 칸 전체가 한 번 달아오른다.
   한 곳에만 있으면 '왜 여기만?' 이 되므로 세 곳 다 같은 길이(FLASH_T)·같은 방식으로 켠다. */
const FLASH_T=0.40; let swapFlash=0, storeFlash=0;

/* ── Timing Wheel: 바늘 + 등록 신호 링 ── */
let twPing=0, twHand=null, twRing=null;
/* 바늘·링은 Timing Wheel 문자판에 얹히는 것이라 그 노드와 같은 구역(네트워크)으로 묶는다 */
/* 문자판과 같은 바닥 변환(twGeo.tf) 위에 얹는다 — 안쪽 좌표는 바닥 기준이라 반지름이 하나면 된다 */
if(twGeo){ const twZ=zoneOf("timer");
  twRing=el("ellipse",{cx:0,cy:0,rx:twGeo.R,ry:twGeo.R,transform:twGeo.tf,
    fill:"none",stroke:"#8ad4ff","stroke-width":1.6,opacity:".25",
    "vector-effect":"non-scaling-stroke","data-z":twZ});
  twHand=el("polygon",{points:"0,0",transform:twGeo.tf,fill:"#cfe0f2",opacity:".9","data-z":twZ});
  gChip.appendChild(twRing); gChip.appendChild(twHand); }

const pBuild=document.getElementById("p-build");
let run=false, prev=0, t=0, tRecv=0, tFan=0, tDirty=0;
/* 예약해 둔 다음 프레임의 번호. 멈췄다 다시 켤 때 옛 루프가 남아 두 겹으로 도는 것을 막으려고 들고 있는다 */
let rafId=0;
/* 인과 게이트: 데이터의 출발점은 클라이언트 하나 — 게임에 도착해야 응답·저장이 시작된다.
   타임아웃 등록은 게이트가 아니라 수신 칩 자체가 그 지점을 지날 때 일으킨다(아래 twFire) */
let feedGame=false;
const D_ACCEPT=R_RECV.s[0].l;                          /* 수신 경로 첫 구간 끝 = Accept */
const D_IOCP  =R_RECV.s[1].acc+R_RECV.s[1].l;          /* 두 구간 끝 = IOCP 워커 */
/* 수신 칩이 지나는 레일 셋의 구역 — 위 두 지점이 그대로 레일 경계라 여기서 칩의 data-z 를 넘긴다 */
const RECV_Z=[zonesOf("clients","accept"), zonesOf("accept","iocp"), zonesOf("iocp","swapq")];
/* 타임아웃 등록 신호 하나 — alt 0=Accept 경로, 1=IOCP 경로.
   실제로도 accept 때 휠에 등록하고, 그 뒤 수신이 완료될 때마다 갱신한다. */
function twFire(alt){ const c=emit(twChips); if(c){ c.st="flow"; c.d=0; c.alt=alt; } }
/* 큐에서 나가기 — 줄 3개(=9개)가 파이프별로 붙어서 출발. 자리가 모자라면 0 을 돌려준다 */
function queueOut(){ let sent=0;
  for(let k=0;k<3;k++) for(let i=0;i<SEC_ROWS;i++){ const b=emit(bundChips);
    if(b){ b.st="flow"; b.d=-i*SLOT; b.delay=0; b.lane=k; sent++; } }
  return sent; }
/* SwapQ 에서 나가기 — 쌓여 있던 자리 그대로(음수 거리) 한 덩어리가 게임까지 */
function swapOut(){ let rel=0;
  drainChips.forEach(dr=>{ if(rel<QMAX && dr.st==="wait"){
    dr.st="flow"; dr.d=-(Q_HEAD+rel*SLOT); dr.delay=0; rel++; } });
  return rel; }
/* DB 큐에서 나가기 — 같은 방식. 쌓여 있던 자리에서 그대로 MySQL 까지 한 덩어리로 */
function storeOut(){ let rel=0;
  saveChips.forEach(sv=>{ if(rel<DBQ_N && sv.st==="wait"){
    sv.st="flow"; sv.d=-(Q_HEAD+rel*SLOT); sv.delay=0; rel++; } });
  return rel; }

function frame(now){
  if(!run) return;
  /* 다른 탭을 보는 동안은 루프 자체를 세운다.
     예전에는 계산만 건너뛰고 rAF 는 계속 걸었는데, 그러면 아무 일도 안 하면서 초당 60번
     프레임 수명주기를 깨운다(도형 1,800개짜리 문서라 공짜가 아니다).
     다시 켜는 것은 탭 전환 쪽(paint)이 맡는다 — 켜는 사람이 없으면 흐름이 영영 안 돈다. */
  if(pBuild && pBuild.hidden){ run=false; rafId=0; return; }
  const dt=Math.min(.05,(now-prev)/1000); prev=now; t+=dt;

  /* ── 방출 (수신만 무조건 — 나머지는 클라 데이터가 그 지점에 닿은 뒤부터) ── */
  tRecv+=dt;  if(tRecv>=0.30){ tRecv-=0.30; const c=emit(recvChips);
    if(c){c.st="flow";c.d=0;c.twA=0;c.twI=0; c.e.setAttribute("data-z",RECV_Z[0]);} }   /* 다시 첫 구간 구역으로 */
  if(feedGame){
    /* 게임 루프는 한 틱에 세 워커 몫을 한꺼번에 넘긴다 — 줄 3개로 동시에 출발.
       레일이 교차하면서 세 줄 길이가 같아졌으므로(220 셋) 셋이 나란히 가서 같이 도착한다.
       큐 하나당 주기는 예전(0.24×3)과 같은 0.72초라 채우고 비우는 리듬은 그대로다. */
    tFan+=dt;   if(tFan>=0.72){ tFan-=0.72;
      for(let k=0;k<3;k++){ const c=emit(fanChips); if(c){ c.st="flow"; c.d=0; c.lane=k; } } }
    /* 큐가 알아서 쌓고 내보내므로 방출을 막을 필요가 없다(옛 batch 상자 시절의 게이트 제거) */
    tDirty+=dt; if(tDirty>=0.52){ tDirty-=0.52; const c=emit(dirtyChips); if(c){c.st="flow";c.d=0;} } }

  /* ── 수신: 클라 → Accept → IOCP → SwapQ (자기 칸에 닿는 순간 그대로 적재) ── */
  recvChips.forEach(c=>{ if(c.st!=="flow"){ c.e.setAttribute("opacity","0"); return; }
    c.d+=125*dt;
    /* 지나가는 길에 타임아웃 등록 신호를 하나씩 떨어뜨린다 — 칩 하나당 Accept 에서 한 번, IOCP 에서 한 번.
       같은 지점이 구역 경계이기도 해서, 구역 강조용 data-z 도 여기서 다음 레일 값으로 갈아 끼운다
       (수신 칩만 레일 셋을 잇달아 타므로 고정값을 주면 죽은 구역 위를 밝게 날아간다) */
    if(!c.twA && c.d>=D_ACCEPT){ c.twA=1; twFire(0); c.e.setAttribute("data-z",RECV_Z[1]); }
    if(!c.twI && c.d>=D_IOCP  ){ c.twI=1; twFire(1); c.e.setAttribute("data-z",RECV_Z[2]); }
    /* 판에 올라서면 건물 앞으로 — 판 뒤로 숨었다 나오는 끊김이 없어진다 */
    const front=(c.d>=SWAP_ON);
    if(c.front!==front){ c.front=front; (front?gChip:gChipBack).appendChild(c.e); }
    /* 4칸이 찬 상태에서 하나 더 오면 그때 통째로 나간다(= 스왑). 방금 온 것부터 다시 쌓인다 */
    if(c.d>=slotD(qShared>=QMAX?0:qShared)){ c.st="wait"; c.e.setAttribute("opacity","0");
      if(qShared>=QMAX){ if(swapOut()===QMAX){ qShared=1; swapFlash=1; } }
      else qShared++;
      return; }
    const p=at(R_RECV,c.d); setChip(c.e,px(p[0],p[1]),py(p[0],p[1],front?3.9:3),5);
    /* 판 위에서는 페이드 없이 또렷하게 — 쌓인 칩(opacity 1)과 밝기가 이어져야 한 알로 읽힌다 */
    c.e.setAttribute("opacity",front?"1":fade(c.d,R_RECV.tot,18,16).toFixed(2)); });

  /* IOCP 워커 처리 반짝 효과는 사용자 요청으로 제거(2026-07-26) — 칸은 정적 유지 */

  /* ── 스왑(swapOut) 은 '가득 찬 뒤 하나 더 도착'하는 순간 위 수신 처리에서 일으킨다 ──
     쌓여 있던 자리(= 경로 시작보다 뒤, 음수 거리)에서 그대로 출발시켜 한 덩어리가
     칸막이를 넘어 게임까지 끊김 없이 간다. '통째·락 1회'는 줄이 안 흩어지는 걸로 읽힌다. */
  /* 쌓여 있는 것 — 칩 크기 5 는 레일 위를 흐르던 것과 동일(같은 패킷), 간격 SLOT 이라 서로 붙는다 */
  pile.forEach((e,i)=>{ if(i>=qShared){ e.setAttribute("opacity","0"); return; }
    const u=SQ.u-Q_HEAD-i*SLOT; setChip(e,px(u,SQ.v),py(u,SQ.v,3.9),5); e.setAttribute("opacity","1"); });
  drainChips.forEach(c=>{ if(c.st!=="flow"){ c.e.setAttribute("opacity","0"); return; }
    c.d+=120*dt;
    if(c.d>=R_DRAIN.tot){ c.st="wait"; c.e.setAttribute("opacity","0"); feedGame=true; return; }
    /* 판을 벗어나는 순간 건물 뒤 레이어로 옮긴다 → 그다음부터는 게임 큐브에 가려 들어간다 */
    const front=(c.d<DRAIN_HOP);
    if(c.front!==front){ c.front=front; (front?gChip:gChipBack).appendChild(c.e); }
    const p=atExt(R_DRAIN,c.d); setChip(c.e,px(p[0],p[1]),py(p[0],p[1],3.9),5);
    /* 큐브가 가려 주므로 페이드는 짧게 — 끝까지 또렷하게 가다가 큐브 뒤로 들어간다 */
    c.e.setAttribute("opacity",(c.d<0?1:fade(c.d,R_DRAIN.tot,1,8)).toFixed(2)); });

  /* ── 응답: 게임 → 송신 큐 3개 ──
     칩 하나가 도착하면 그 큐의 칸 하나가 찬다(도착 시점 = 칸 채워지는 시점).
     아홉 칸이 다 차 있다가 하나 더 도착하면 그때 9개가 통째로 나간다. */
  fanChips.forEach(c=>{ if(c.st!=="flow"){ c.e.setAttribute("opacity","0"); return; }
    const RL=R_FAN_L[c.lane||0];
    c.d+=125*dt;
    if(c.d>=RL.tot){ c.st="wait"; c.e.setAttribute("opacity","0");
      const k=FAN_END[c.lane||0];      /* 교차 뒤 실제로 도착하는 큐 */
      if(secTotal()>=SEC_ROWS*3){                                        /* 가득 → 통째로 내보내고 방금 것부터 다시 */
        if(queueOut()){ secN=[0,0,0]; secN[k]=1; secFlash=1; } }
      else if(secN[k]<SEC_ROWS) secN[k]++;
      return; }
    const p=at(RL,c.d); setChip(c.e,px(p[0],p[1]),py(p[0],p[1],3),4.6);
    c.e.setAttribute("opacity",fade(c.d,RL.tot,16,14).toFixed(2)); });

  if(sectorCells){
    if(secFlash>0){ secFlash=Math.max(0,secFlash-dt/FLASH_T);
      const fl=mix("#1d1409","#ffe0a0",secFlash);
      sectorCells.forEach(e=>e.setAttribute("fill",fl)); }
    /* 칸 순서: 인덱스 i 에서 i/3 = 어느 큐인지, i%3 = 그 큐 안에서 몇 번째 칸인지 */
    else sectorCells.forEach((e,i)=>e.setAttribute("fill", (i%3)<secN[(i/3)|0]?"#c98c2e":"#1d1409")); }
  /* SwapQ·DB 큐도 같은 신호 — 다만 이 둘은 '찬 칸' 표시를 쌓인 칩이 하므로 칸 색은 평소엔 정적이다.
     감쇠가 0 에 닿는 프레임에 mix(평소색,hot,0)=평소색 이 그대로 칠해져 원래대로 돌아온다. */
  if(swapFlash>0 && swapqLit){ swapFlash=Math.max(0,swapFlash-dt/FLASH_T);
    swapqLit.forEach(p=>p[0].setAttribute("fill",mix(p[1],"#bfe4ff",swapFlash))); }
  if(storeFlash>0 && dbwLit){ storeFlash=Math.max(0,storeFlash-dt/FLASH_T);
    dbwLit.forEach(p=>p[0].setAttribute("fill",mix(p[1],"#a8f0c8",storeFlash))); }

  /* 큐에서 나온 것들: 각자 파이프로 송신 큐 → Send 워커. 도착한 것이 같은 파이프로 복귀 칩 발사 */
  bundChips.forEach(c=>{ if(c.st!=="flow"){ c.e.setAttribute("opacity","0"); return; }
    if(c.delay>0){ c.delay-=dt; c.e.setAttribute("opacity","0"); return; }
    const RL=R_BUND_L[c.lane||0];
    c.d+=130*dt;
    if(c.d<0){ c.e.setAttribute("opacity","0"); return; }
    if(c.d>=RL.tot){ c.st="wait"; c.e.setAttribute("opacity","0");
      /* 넘긴 거리를 그대로 이어받아 출발 — 프레임 경계에서 잘리지 않아 복귀 칩도 붙어서 간다(속도도 같게 130) */
      const o=emit(outChips); if(o){ o.st="flow"; o.d=c.d-RL.tot; o.delay=0; o.lane=c.lane; } return; }
    const p=at(RL,c.d); setChip(c.e,px(p[0],p[1]),py(p[0],p[1],4),5);
    c.e.setAttribute("opacity",fade(c.d,RL.tot,12,12).toFixed(2)); });
  outChips.forEach(c=>{ if(c.st!=="flow"){ c.e.setAttribute("opacity","0"); return; }
    if(c.delay>0){ c.delay-=dt; c.e.setAttribute("opacity","0"); return; }
    const RL=R_OUT_L[c.lane||0];
    c.d+=130*dt; if(c.d>=RL.tot){ c.st="wait"; c.e.setAttribute("opacity","0"); return; }
    const p=at(RL,c.d); setChip(c.e,px(p[0],p[1]),py(p[0],p[1],3),5);
    c.e.setAttribute("opacity",fade(c.d,RL.tot,16,16).toFixed(2)); });

  /* ── 저장: 게임 → DB 워커 큐에 적재 → 가득 차면 통째로 인출돼 MySQL로 ── */
  dirtyChips.forEach(c=>{ if(c.st!=="flow"){ c.e.setAttribute("opacity","0"); return; }
    c.d+=95*dt;
    if(c.d>=R_DIRTY.tot){ c.st="wait"; c.e.setAttribute("opacity","0");
      /* 5칸이 찬 상태에서 하나 더 오면 그때 통째로 나간다. 방금 온 것부터 다시 쌓인다 */
      if(qStore>=DBQ_N){ if(storeOut()===DBQ_N){ qStore=1; storeFlash=1; } }
      else qStore++;
      return; }
    const p=at(R_DIRTY,c.d); setChip(c.e,px(p[0],p[1]),py(p[0],p[1],3),5);
    c.e.setAttribute("opacity",fade(c.d,R_DIRTY.tot,18,14).toFixed(2)); });
  /* 쌓여 있는 것 — 칸막이 반대쪽(-u)으로 자란다. SwapQ 와 같은 치수(칩 5 · 간격 SLOT) */
  dpile.forEach((e,i)=>{ if(i>=qStore){ e.setAttribute("opacity","0"); return; }
    const u=DQ.u-Q_HEAD-i*SLOT; setChip(e,px(u,DQ.v),py(u,DQ.v,3.9),5); e.setAttribute("opacity","1"); });
  saveChips.forEach(c=>{ if(c.st!=="flow"){ c.e.setAttribute("opacity","0"); return; }
    c.d+=110*dt;
    if(c.d>=R_STORE.tot){ c.st="wait"; c.e.setAttribute("opacity","0"); return; }
    const front=(c.d<STORE_HOP);
    if(c.front!==front){ c.front=front; (front?gChip:gChipBack).appendChild(c.e); }
    const p=atExt(R_STORE,c.d); setChip(c.e,px(p[0],p[1]),py(p[0],p[1],3.9),5);
    c.e.setAttribute("opacity",(c.d<0?1:fade(c.d,R_STORE.tot,1,8)).toFixed(2)); });

  /* ── 타임아웃 등록: Accept·IOCP → Timing Wheel ── */
  twChips.forEach(c=>{ if(c.st!=="flow"){ c.e.setAttribute("opacity","0"); return; }
    const R=c.alt?R_TWI:R_TWA;
    c.d+=105*dt;
    if(c.d>=R.tot){ c.st="wait"; c.e.setAttribute("opacity","0"); twPing=1; return; }
    const p=at(R,c.d); setChip(c.e,px(p[0],p[1]),py(p[0],p[1],3),3.8);
    c.e.setAttribute("opacity",(0.75*fade(c.d,R.tot,16,16)).toFixed(2)); });
  /* 바늘도 바닥 좌표로 그린다(요소에 twGeo.tf 가 걸려 있다). −sin 인 이유: 바닥의 v 축은
     화면에서 왼쪽 위로 가므로, 그냥 (cos,sin) 을 쓰면 시계바늘이 반시계로 돈다. */
  if(twHand){ const a=t*0.9-Math.PI/2;
    const ex=Math.cos(a)*twGeo.R*0.86, ey=-Math.sin(a)*twGeo.R*0.86;
    const L=Math.hypot(ex,ey)||1, nx=-ey/L*2, ny=ex/L*2;
    twHand.setAttribute("points", ex.toFixed(1)+","+ey.toFixed(1)+" "
      +nx.toFixed(1)+","+ny.toFixed(1)+" "
      +(-nx).toFixed(1)+","+(-ny).toFixed(1));
    /* 등록 신호가 잦아졌으므로(수신 칩마다 두 번) 감쇠를 짧게 — 안 그러면 링이 계속 켜진 채 맥동이 안 보인다 */
    twPing=Math.max(0,twPing-dt/0.28);
    twRing.setAttribute("opacity",(0.22+0.50*twPing).toFixed(2)); }

  /* 게임 루프 비콘 맥박 — 병목 앵커 */
  if(gameBeacon){ const s=Math.max(0,Math.sin(t*4));
    gameBeacon.setAttribute("r",(4.4+1.5*s).toFixed(2));
    gameBeacon.setAttribute("opacity",(0.62+0.38*s).toFixed(2)); }

  rafId=requestAnimationFrame(frame);
}
/* 흐름 시작·정지 훅 — 구조가 먼저 서고 데이터가 흐른다.
   '언제' 시작할지는 등장 웨이브 쪽(맨 아래 IIFE)이 쥔다. 첫 로드와 '다시 재생' 이 같은 길을 타야
   두 경우의 순서가 어긋나지 않는다 — 예전엔 첫 로드만 1250ms 타이머로 늦추고 다시 재생은 안 늦춰서,
   구조가 아직 팝인하는 중에 칩이 먼저 떠다녔다. */
window.__flowStop =function(){ run=false; cancelAnimationFrame(rafId); rafId=0; };
window.__flowStart=function(){ if(RMOT) return; run=true; prev=performance.now();
  cancelAnimationFrame(rafId); rafId=requestAnimationFrame(frame); };
/* '다시 재생' 훅: 흐름을 처음부터 — 클라에서 출발하는 인과 순서가 다시 보이게 */
window.__flowReset=function(){
  [recvChips,drainChips,fanChips,bundChips,outChips,dirtyChips,saveChips,twChips]
    .forEach(p=>p.forEach(c=>{ c.st="wait"; c.e.setAttribute("opacity","0"); }));
  qShared=0; secN=[0,0,0]; secFlash=0; qStore=0; twPing=0; swapFlash=0; storeFlash=0;
  pile.forEach(e=>e.setAttribute("opacity","0"));    /* SwapQ 쌓인 칸 — qShared 를 0 으로 되돌리면 칸도 비워야 짝이 맞는다 */
  dpile.forEach(e=>e.setAttribute("opacity","0"));
  feedGame=false; tRecv=tFan=tDirty=0;
};

/* ═══════════ 병목 탭: 병목 지도 — 완성된 씬을 복제(고스트)하고 병목 핀을 얹는다 ═══════════
   재렌더 대신 cloneNode: 칩 애니 시작(1.25s) 전에 동기 실행되므로 칩 레이어를 아예 빼고 복제 = 정적 씬.
   핀 좌표는 getBBox가 아니라 px/py 수식으로 계산 → hidden 패널 안이어도 안전. */
(function(){
  const bn=document.getElementById("bnscene"); if(!bn) return;
  const bs=document.getElementById("bnsolid"), bp=document.getElementById("bnpins");
  const stage=document.querySelector(".bn-stage");
  /* ═══ 이 판은 첫 화면에 안 보인다 → 첫 페인트 뒤로 미룬다 ═══
     지도 두 벌(보이는 것)과 평면 사본 두 벌, 값 추출까지 합쳐 20ms 이고 도형이 1,077개다.
     그런데 처음 열리는 것은 '설계 · 구현' 탭이라 이 판은 그때 단 한 픽셀도 안 그려진다.
     그래서 브라우저가 한가해질 때 짓고, 그 전에 사용자가 병목 탭을 누르면 그 자리에서 바로 짓는다.
     (미리 짓기가 먼저 끝나는 게 보통이라, 누르는 순간에 짓는 일은 거의 없다.) */
  let built=false, setFlat=function(){}, MORPHABLE=false, realIntro=function(){};
  const pinEls={};

  /* ═══ 실험 데이터 — 노션 [병목지점 개선] 이 정본이다 ═══
     오른쪽 패널이 유일한 표시 자리다. 예전에는 지도 아래에 카드 목록이 한 벌 더 있었고 이 패널은
     그것을 복제해 썼다. 목록을 걷어내면서 데이터도 이리로 옮겼다. loc = 핀 번호(어느 자리의 실험인지).

     값은 전부 그 실험을 돌린 시점의 A/B 실측(bm=끄고 잰 값 → am=켜고 잰 값)이고,
     노션 해당 페이지의 표에서 그대로 옮겼다. 한때 이 자리에는 2300 → 5500 으로 매끄럽게 오르는
     '누적 곡선' 이 들어 있었는데, 그건 실측이 아니라 그림을 위해 채워 넣은 값이었다. 걷어냈다.

     실험마다 잰 동접이 다르다(200 → 5200). 그래서 실험끼리 값을 이어 붙이면 안 되고,
     계기판도 '그 실험 한 건의 끄고 → 켜고' 만 보여준다.
       st  ok 채택 · rj 기각 · dg 진단(판정 없음) · na 실측 없음
           now 지금 참인 값 · sum 종합 결론 · fix 정정 이력 — 이 셋은 실험이 아니라 '자리 0(현재)' 에 모인다
       null 은 그 시점에 수집하지 않은 지표다 — 추정치로 메우지 않는다.
       ab  그 실험에서만 의미 있는 지표(공통 4칸에 안 들어가는 것)를 노션 표 그대로 */
  const EXPS=[
    /* ── 자리 0 = 현재. 실험이 아니라 '지금 무엇이 참인가' 를 모아 두는 칸이다.
       각 실험 카드가 보여 주는 것은 그 실험을 돌린 시점의 값이라, 마지막 카드의 5,200 을
       현재값으로 오해하기 쉽다. 그걸 막는 자리다. ── */
    {s:0, loc:"0", n:"현황판", st:"now",
     r:"안정 동접 ~5,000 · 붕괴 직전 ~5,200",
     cond:"단일 게임스레드 · 단일 맵(120×120, 섹터 20 → 36칸) · 루프백 · 봇 부하 · i9-10900(서버 물리 6 / 클라 물리 4)",
     m:"판정 기준은 둘뿐이다 — 틱 p99 가 40ms 예산 안에 있고, 부하 클라의 송신 버퍼가 한 번도 안 찰 것",
     ex:"각 실험 카드의 숫자는 그 실험 시점의 값이고 이력으로 남긴다. 두 값이 다르면 이 칸이 맞다. 지금 병목은 게임 루프 단일 코어 — 그중 멤버십 팬아웃이 틱의 78~87%다",
     bm:null, am:{ccu:5000,pps:10130000,send:947,tick:39.7},
     abh:"동접 5,000 기준",
     ab:[["소켓 호출","","12.3만 /s","",0],
         ["평균 패킷 크기","","93.5 B","",0],
         ["팬아웃","","922 tgt/call","",0],
         ["코어당 수용","","~1,470명","",0],
         ["예산 여유","","~1%","39.7/40",0]]},

    {s:0.1, loc:"0", n:"동접별 트래픽", st:"now",
     r:"송신량은 동접의 제곱에 붙는다",
     cond:"루프백 실측 · 4,000~5,500 ClientCount 스윕 · 6,000~6,500 K3 천장 스윕",
     m:"사람이 늘면 보낼 대상도 같이 늘어, 나가는 양은 사람 수의 제곱으로 자란다",
     ex:"5,500까지 제곱 예측과 오차 ±1%. 6,000부터 그 선을 못 따라가는 게 붕괴의 지문이다(평균 패킷도 93 → 77 B)",
     bm:null, am:{ccu:5000,pps:10020000,send:938,tick:null},
     abh:"송신 메시지 · 송신량 MB/s",
     ab:[["4,000","","644만 · 599","4.8 Gbps",0],
         ["4,500","","813만 · 759","6.1 Gbps",0],
         ["5,000 안정","","1,002만 · 938","7.5 Gbps",0],
         ["5,500","","1,201만 · 1,127","9.0 Gbps",0],
         ["6,000 붕괴","","1,382만 · 1,170","−13%",-1],
         ["6,500 붕괴","","1,558만 · 1,203","−24%",-1]]},

    {s:0.2, loc:"0", n:"결론 — 수평 확장으로", st:"sum",
     r:"맵당 3.4코어 · 근본 벽은 팬아웃",
     cond:"실측은 단일 맵·루프백 기준. 맵 샤딩과 실제 NIC 포화점은 설계·추정이다",
     m:"한 맵을 돌리는 데 드는 코어를 쪼개 보면 송신이 대부분이다 — 게임 0.53 + 송신 2.36 + IOCP 0.5",
     ex:"지금까지의 최적화는 전부 CPU 를 줄인 것이지 나가는 바이트를 못 줄였다(섹터 묶음은 틱 −83%에 송신량 −7%). 다음 벽인 대역폭은 적게·작게 보내야만 넘는다",
     /* A/B 가 아니라 종합이라 끄고(bm)가 없다 — 계기판은 이 null 을 보고 '지금 값' 으로 적는다.
        켜고 자리에 넣은 넷은 노션 결론 페이지의 「지금 참인 값」 그대로다(동접 5,000 기준).
        한때 여기까지 null 이라 여섯 칸 중 넷이 비어 있었는데, 그 페이지가 그 값을 갖고 있는데도
        화면만 비는 꼴이었다. 현황판(s:0)과 같은 값인 것은 맞다 — 그쪽은 카드로 서지 않으므로
        화면에서 겹치지 않는다. */
     bm:null, am:{ccu:5000,pps:10130000,send:947,tick:39.7},
     abh:"항목 → 값",
     ab:[["맵당 코어","","3.4","송신 2.36",0],
         /* 1,400 이 아니라 1,470 이다 — 5,000 ÷ 맵당 3.4코어 = 1,470.6. 노션 결론 페이지도
            「지금 참인 값」에 '코어당 ~1470명(맵당 3.4코어)' 으로 적고, 바로 위 현황판 카드도
            같은 값을 쓴다. 한 화면에 같은 지표가 두 값이던 것을 맞췄다(2026-08-04 대조). */
         ["코어당 수용","","~1,470명","",0],
         ["와이어 pps","","≈63만","1500B",0],
         ["1G NIC 이면","","~1,800명","",0],
         ["5,000 받으려면","","10G 이상","",0]]},

    {s:0.3, loc:"0", n:"정정 이력", st:"fix",
     r:"뒤집힌 결론도 지우지 않는다",
     cond:"착시(당시 측정이 틀림) 2건 · 뒤집힘(당시엔 맞았고 이후 최적화가 무효화) 3건",
     m:"각 실험 페이지는 그때 그대로 두고, 무엇이 왜 바뀌었는지만 여기 모은다",
     ex:"성격이 다르기 때문에 나눠 적는다 — 착시는 그때도 틀린 것이고, 뒤집힘은 그때는 맞았는데 나중 최적화가 전제를 지운 것이다",
     bm:null, am:null,
     abh:"실제",
     ab:[["천장 5,500 (착시)","","~5,000 / ~5,200","분배 쏠림",-1],
         ["병목 위치 (뒤집힘)","","5단계 연쇄","그때마다 참",0],
         ["RIO 기대치 (뒤집힘)","","−17% ~ +38%","회계 이동",-1],
         ["K4 금지 (뒤집힘)","","재현 안 됨","금지 아님",0],
         /* 노션 「정정 이력」 §5. 한때 이 줄이 빠져 있어 위 cond 도 '착시 1건' 이었다(2026-08-04 대조).
            평균 패킷 93→77 B 를 배칭이 깨진 것으로 읽었으나 배칭은 오히려 심화됐고(WSASend 회당
            7.8→18.4 KB), 붕괴 미달 폭도 유입×팬아웃 기준으로 다시 세어 −24% 가 아니라 −20% 였다. */
         ["붕괴 구간 서술 (착시)","","배칭은 심화 · −20%","−24% 아님",-1]]},

    {s:1, loc:"1", n:"SendQ Lock-Free", st:"rj",
     r:"이득 없이 비용만 늘었다",
     cond:"동접 200 · 맵 1 · 송신 메시지 82.6k건/s · 틱 40ms",
     m:"락을 없애 보려 했으나, 애초에 기다리는 락이 없었다 — 한 쪽만 넣고 한 쪽만 빼는 큐라 경합 자체가 없다",
     ex:"일의 양은 통제됐고(위 네 칸이 그대로다) 오른 것은 비용뿐이다. 틱 p99 71 → 76ms 는 근사치 표기다",
     bm:{ccu:200,pps:82600,send:1.62,tick:71}, am:{ccu:200,pps:83000,send:1.63,tick:76},
     ab:[["broadcast_sync/틱","2.59","2.82 ms","+9%",-1],
         ["game_logic/틱","3.73","4.31 ms","+15%",-1],
         ["넣기 1회당","849","911 ns","+62 ns",-1],
         ["틱 p50","~30","~31 ms","±0%",0]]},

    {s:2, loc:"1", n:"Send Coalescing", st:"ok",
     r:"송신 호출 −94% · 틱 p99 65→9ms",
     cond:"동접 200 · 송신 메시지 ≈83k건/s · 평균 19.7 B · 틱 40ms · Nagle On",
     m:"보낼 것이 생길 때마다 부르던 WSASend 를, 틱 끝에 세션별로 모아 한 번만 부른다",
     ex:"줄어든 틱의 83%가 송신 구간이다. 줄인 것은 호출 횟수지 보내는 양이 아니다",
     bm:{ccu:200,pps:83000,send:1.63,tick:65.3}, am:{ccu:200,pps:83000,send:1.63,tick:9.2},
     ab:[["소켓 호출(WSASend)","82,133","4,877 /s","−94%",1],
         ["한 번에 묶인 버퍼","1.00","17.07개","×17",1],
         ["network_dispatch/틱","20.19","0.31 ms","−98%",1],
         ["틱 p50","29.8","3.1 ms","−90%",1]]},

    {s:3, loc:"1", n:"SendThread 분리", st:"ok",
     r:"틱 p99 −56% · 전체 CPU 는 그대로",
     cond:"동접 1,000 · 별도 PC + WAN(상한 474 Mbps, 루프백 실험과 절대치 비교 불가) · 송신 메시지·송신량은 백업 지표에서 사후 역산",
     m:"송신을 게임 틱에서 떼어 전용 스레드로 넘겼다 — 틱의 74%가 보내는 데 쓰이고 있었다",
     ex:"일을 옮긴 것이지 늘린 게 아니라는 근거가 전체 CPU 다. 게임 루프의 송신 비중은 74.5% → 0.08% 로 사라졌다",
     bm:{ccu:1000,pps:2080000,send:41,tick:39.18}, am:{ccu:1000,pps:2080000,send:41,tick:17.38},
     ab:[["틱 평균","19.46","4.93 ms","−75%",1],
         ["틱 p50","16.40","3.39 ms","−79%",1],
         ["게임루프 CPU","0.463","0.109 코어","−76%",1],
         ["시스템 전체 CPU","0.548","0.537 코어","−0.011",0]]},

    {s:4, loc:"1", n:"SO_SNDBUF=0", st:"rj",
     r:"전체 CPU +75% · 순손해",
     cond:"동접 1,000 · 팬아웃 184 tgt/call · WAN(상한 474 Mbps, 루프백과 비교 불가) · 송신 메시지는 사후 역산",
     m:"커널 송신버퍼를 0으로 두면 복사가 없어지는 게 아니라 IOCP 워커 쪽으로 옮겨간다",
     ex:"틱만 보면 나아진 것처럼 보인다. 전체 CPU 를 합쳐 보고서야 손해가 드러났다 — 송신 실험은 워커 CPU 를 같이 봐야 한다",
     /* 송신 메시지는 양쪽 같다 — 노션 부하 토글이 '위 작업량 지표는 A/B 양쪽 동일' 이라고 못 박고
        A/B 표에는 그 행 자체가 없다. 한때 켜고를 207만으로 적어 두었는데 근거가 없었다(2026-08-04 대조). */
     bm:{ccu:1000,pps:2080000,send:41,tick:37.42}, am:{ccu:1000,pps:2080000,send:41,tick:34.49},
     ab:[["틱 평균","15.37","13.53 ms","−12%",1],
         ["시스템 전체 CPU","0.442","0.773 코어","+75%",-1],
         ["IOCP 워커 CPU","0.078","0.455 코어","5.8배",-1],
         ["송신 경합","0","12,422 /s","발생",-1]]},

    {s:5, loc:"1", n:"1,500 동접 붕괴 — 회선 상한", st:"dg",
     r:"서버가 아니라 회선이 천장이었다",
     cond:"동접 1,500 시도 / 실접속 833 · WAN 측정의 마지막(상한 473.94 Mbps) · 부하 수치는 환산",
     m:"동접을 1,000에서 1,500으로 올리자 무너졌다. 서버를 뜯기 전에 어디가 막혔는지부터 쟀다",
     ex:"틱은 예산 안인데 왕복이 1초였다 — 서버가 한가한데 지연만 터지면 바깥을 봐야 한다. 이 런만 원본이 없어 동접 1,000 실측을 세션수·팬아웃으로 옮긴 값이다",
     /* 동접은 시도값 1,500 이 아니라 **실접속 833** 이다. 나머지 값이 전부 833 기준이라 그렇다 —
        노션이 '동접 1,000 실측을 세션수(833/1000)·팬아웃(223/184)으로 환산했다' 고 적었으므로
        송신 메시지 210만도 팬아웃 223 도 833 에서 나온 수다. 여기서 동접만 1,500 으로 두면
        한 카드 안에 두 기준이 섞인다(⑦·⑪ 에서 고친 것과 같은 문제).
        시도값은 카드 이름('1,500 동접 붕괴')이 이미 말하고 있어, 배지가 833 이면
        '1,500 을 붙이려 했는데 833 만 남았다' 가 한 화면에서 읽힌다. */
     bm:null, am:{ccu:833,pps:2100000,send:41,tick:19},
     hint:"부하는 실측이 아니라 동접 1,000 에서 환산",
     abh:"동접 1,000 → 1,500",
     /* 왼쪽이 0.9 였다. 그건 SendThread 를 켜기 전 값이다(6월 백업 CSV `A_baseline` 0.898).
        이 실험은 ③ SendThread 채택 뒤라 같은 조건의 동접 1,000 값은 0 이다(`B_sendthread`).
        0.9 와 견주면 '켜기 전' 과 '켠 뒤' 를 비교하는 셈이 되어 시점이 어긋난다. */
     ab:[["송신 경합","0","5,533 /s","폭증",-1],
         /* 왼쪽을 0 으로 두었었는데 근거가 없다 — 동접 1,000 시절에는 이 지표를 아예 안 쟀다
            (6월 백업 CSV 의 A_baseline·B_sendthread 에 send_queue_overflow 항목이 없다).
            노션도 1,500 의 26 만 적고 1,000 값은 병기하지 않았다(옆 두 행은 병기했는데 이 행만 없다). */
         ["송신 큐 넘침","","26 /s","이 시기 처음 잼",-1],
         ["팬아웃 tgt/call","184","223","+21%",0]]},

    {s:6, loc:"3", n:"섹터 묶음 패킷", st:"ok",
     r:"틱 p99 −83% · 복사 −81%",
     cond:"동접 2,000 · 팬아웃 370 tgt/call · 섹터 평균 ~55명 · 틱 40ms",
     m:"틱 끝에 섹터별로 한 번 묶어 보낸다 — 복사 횟수에 상한이 생긴다",
     ex:"패킷 수를 −73% 줄였는데 송신량은 −7% 다. 크기가 +242% 늘어 곱이 거의 그대로 남았다 — 이 묶음은 CPU 를 줄인 것이지 대역폭을 줄인 게 아니다",
     bm:{ccu:2000,pps:8280000,send:163,tick:57.4}, am:{ccu:2000,pps:2260000,send:152,tick:9.95},
     ab:[["broadcast 호출","19,602","3,310 /s","−83%",1],
         ["복사(gathercopy)","15.7","3.0 ms","−81%",1],
         ["게임루프 CPU","0.50","0.16 코어","−67%",1],
         ["평균 패킷 크기","19.6","67.1 B","+242%",1]]},

    {s:7, loc:"1", n:"IOCP 워커 12 → 4", st:"ok",
     r:"왕복 p99 143 → 102ms · 재현성 회복",
     cond:"동접 4,000 · 워커×송신 네 조합 교차 · 각 3회 · 단일 PC 루프백",
     m:"노는 워커 여덟 개가 일을 나눠 갖는 게 아니라 지연을 만들고 있었다 — 줄였다",
     ex:"같은 축의 워커4+송신4 는 파국이었다(왕복 688ms·배칭 붕괴). 금지 조합으로 못 박았다가, 이후 재스윕에서 재현되지 않아 딱지를 뗐다",
     /* 한때 양쪽 다 870만 · 615 였는데, 그 둘은 **3차 스윕**(송신 스레드 1·2·4)의 근사치다
        — 노션 3절의 '몇 개를 두든 전달량은 같다 · 약 870만/s · 약 615 MB/s' 가 그것이다.
        이 카드의 A/B 축은 4차(워커 12→4)이므로 같은 런에서 다시 셌다:
        wsa_send_rate ÷ send_per_pkt = 송신 메시지, × avg_pkt_bytes = 송신량
        (C4000_WT12_K2 r3 · C4000_WT4_K2 r1 = 각 3회 중앙값 런).
        결과 869만 → 873만 · 614 → 619 로, 노션 4-2 절이 4차 송신량을 619 로 적은 것과 맞는다. */
     bm:{ccu:4000,pps:8690000,send:614,tick:66.4}, am:{ccu:4000,pps:8730000,send:619,tick:54.5},
     hint:"동접 2,500→4,000 스윕의 4,000 지점",
     abh:"워커12·송신2 → 워커4·송신2",
     ab:[["왕복 p99","143","102 ms","−28%",1],
         ["주기 평균","40.3","35.1 ms","−13%",1],
         ["3회 편차","48~185","0.2 ms","재현성",1],
         /* 노션엔 시스템 CPU 가 없다. 실측 CSV 로는 3회 **평균**이 2.98 → 2.88 인데, 이 카드가
            스스로 밝힌 방식은 3회 **중앙값**이라 그 축으로 다시 세면 2.95 → 2.88 이다.
            카드가 말한 방식과 값을 맞춘다(system_cpu_total · C4000_WT12_K2 → C4000_WT4_K2). */
         ["시스템 CPU","2.95","2.88 코어","−2%",1]]},

    {s:8, loc:"2", n:"멤버십 팬아웃 묶음", st:"ok",
     r:"섹터 JOIN/LEAVE −68% · 게임루프 0.86→0.49 코어",
     cond:"동접 4,000 · 팬아웃 738 tgt/call · 멤버십 송신 414만/s · 3rep 중앙값",
     m:"나갈 대상을 먼저 합치고(중복 제거), 들어온 것도 한 버퍼에 모아 처리한다",
     ex:"두 단계를 이은 값이다 — 아웃바운드 −28%, 인바운드 −52%. 노션도 밝혀 두었듯 서로 다른 런을 이은 누적 근사치이지 한 번에 연속으로 잰 값이 아니다",
     /* 틱만 P1 구간(59.7 → 55.2)이다. 나머지 넷은 노션 부하 줄대로 P1 끄고 → P2 켜고 누적인데,
        틱은 그렇게 이을 수 없다 — 두 런의 이음매가 안 맞기 때문이다. 다른 지표는 P1 켜고와
        P2 끄고가 재현된다(871만↔871만 · 99,266↔99,262 · 619↔620, ±0.2%). 틱만 55.2↔39.9 로
        15.3ms(38%) 벌어져서, 59.7 → 39.6 으로 이으면 P2 가 하지 않은 15ms 를 성과로 돌리게 된다
        (그 −34% 중 실제 효과는 P1 −7.5% + P2 −0.8% 뿐이다).
        두 런의 감소율을 곱해 '둘 다 켠 값' 을 추정하면 54.8ms 로 P1 실측 55.2 와 0.4ms 차이라,
        없는 숫자를 만들 이유도 없다. 이 사정은 hint 로 화면에 적는다. */
     bm:{ccu:4000,pps:8710000,send:614,tick:59.7}, am:{ccu:4000,pps:6540000,send:606,tick:55.2},
     hint:"틱은 P1 구간만 — P1·P2 는 다른 런",
     ab:[["JOIN/LEAVE / 틱","19.5","6.2 ms","−68%",1],
         /* 36.2 → 20.4 였다. 그건 P1 끄고와 P2 켜고를 이은 값이라 배지의 틱(P1 구간)과 축이
            달랐다 — 한 카드가 두 기준을 쓰고 있었다. 이음매도 P1 켜고 31.0 대 P2 끄고 28.1 로
            2.9ms(9%) 어긋난다. 노션이 누적으로 이어 준 지표는 JOIN/LEAVE 와 gameloop 둘뿐이다.
            배지와 같은 P1 축으로 통일한다(노션 P1 표: tick avg 36.2 → 31.0 · −15%). */
         ["틱 평균","36.2","31.0 ms","−15%",1],
         ["게임루프 CPU","0.86","0.49 코어","−43%",1],
         ["평균 패킷 크기","71","93 B","+30%",1]]},

    {s:9, loc:"3", n:"브로드캐스트 수신섹터 묶음", st:"ok",
     r:"복사 −88% · 게임루프 0.57→0.21 코어",
     /* 27만이 아니라 18만이다 — 27만은 동접 5,000 값이 4,000 페이지에 들어온 것이었다.
        실측(DIGEST_A_off 3rep 중앙): 6,098 calls/s ÷ 25틱 = 244콜/틱 × 737.6명 = 17.99만.
        5,000 에서는 297콜 × 922명 = 27.4만이라, 노션 분해 줄의 '295콜 × 923명 = 27만' 은
        숫자가 틀린 게 아니라 다른 부하점 값이다. 팬아웃÷동접 = 0.1845 로도 4,000 → 738 이 맞다. */
     cond:"동접 4,000 · 팬아웃 738 tgt/call · 대상 18만 회/틱 · 3rep 중앙값",
     m:"대상마다 세션을 붙잡고 검사하던 고정비를, 받는 섹터별로 이어 붙여 한 번에 접었다",
     ex:"세션당 넣기가 18만 → 4천으로 줄었다(세션당 1회라 동접 수와 같다). 틱 p99 는 −52% 인데 송신량은 −2.6% — 접은 것은 CPU 고정비이지 나가는 바이트가 아니다",
     bm:{ccu:4000,pps:6590000,send:607,tick:39.8}, am:{ccu:4000,pps:6290000,send:591,tick:19.1},
     ab:[["broadcast 복사/틱","15.9","1.90 ms","−88%",1],
         ["network/틱","14.1","0.36 ms","−97%",1],
         ["틱 평균","24.0","9.0 ms","−62%",1],
         ["게임루프 CPU","0.57","0.21 코어","−64%",1]]},

    {s:10, loc:"1", n:"송신 워커 K2 → K3", st:"ok",
     r:"왕복 p99 187 → 138ms · 워커 포화 해소",
     cond:"동접 5,000 · IOCP 워커 4 고정 · 3rep 중앙값 · 단일 PC 루프백",
     m:"송신 워커 둘이 나란히 포화라 하나 늘렸다. 세션을 워커에 나누는 기준도 uniqueId 로 고쳐 균등하게 만들었다",
     ex:"틱은 그대로다 — 천장을 올린 게 아니라 왕복만 줄였다. 넷으로 늘리면 잉여 워커가 경합만 보태 171ms 로 되레 나빠진다",
     bm:{ccu:5000,pps:10010000,send:938,tick:39.6}, am:{ccu:5000,pps:10050000,send:940,tick:39.7},
     abh:"워커 2개 → 3개",
     ab:[["왕복 p99","187","138 ms","−26%",1],
         ["워커 최대 CPU","1.00","0.82 코어","포화 해소",1],
         ["워커당 밀린 양","2,500","1,667건","−33%",1],
         ["소켓 호출","99k","122k /s","+23%",-1]]},

    {s:11, loc:"2", n:"게임스레드 코어 격리", st:"rj",
     r:"천장이 한 명도 안 올랐다",
     cond:"동접 5,200 · 켜고/끄고 각각 천장 스윕 · 단일 PC 루프백 · i9-10900(서버 물리 0–5)",
     m:"게임 스레드에 코어를 통째로 주면 송신이 밀어내던 캐시를 지킬 수 있으리라 봤다",
     ex:"게임 루프는 5% 가벼워졌는데 천장은 한 명도 안 올랐다. 과부하에선 켠 쪽이 더 무너진다 — 코어 하나에 묶여 탈출구를 잃는다. 천장을 정하는 건 CPU 여유가 아니라 멤버십 팬아웃이다",
     bm:{ccu:5200,pps:11020000,send:1030,tick:39.8}, am:{ccu:5200,pps:10890000,send:1006,tick:39.9},
     hint:"천장 스윕 5,200 지점(부하 줄은 5,000 기준)",
     abh:"끄고 → 켜고",
     ab:[["접속 천장","~5,200","~5,200명","불변",-1],
         ["과부하(5,400) 틱 p99","57.6","97.8 ms","+70%",-1],
         /* 노션은 이 칸을 Δ 한 값으로만 적는다(3절 ① 표 `gameloop_cpu | −5%`). 한때 웹이
            0.531 → 0.503 이라는 절대값 쌍을 들고 있었는데 노션에도 실측 CSV 에도 없는 수다
            — 0.503/0.531 = −5.3% 라 Δ 에 맞춰 지어낸 값으로 보인다. 참고로 CEIL_cc5000 실측은
            0.5234 → 0.5076(−3.0%)로 노션의 −5% 와도 다르다(그쪽은 3rep 중앙값, CSV 는 r1 뿐).
            없는 숫자를 만들지 않고 노션이 가진 만큼만 적는다. */
         ["게임루프 CPU","","−5%","절대값은 노션 미기재",1],
         ["5,400 송신 메시지/s","1,171만","1,154만","−1.5%",-1],
         ["5,400 평균 패킷","93.1","90.1 B","−3.2%",-1]]},

    {s:21, loc:"4", n:"Worker→Game SwapQ", st:"na",
     r:"실측 데이터 없음",
     m:"틱마다 queue::swap 한 번으로 큐를 통째 인출 — 락 1회 · 복사 없음",
     ex:"구현은 들어가 있으나 A/B 로 잰 적이 없다. 노션 [병목지점 개선] 에 해당 실측 페이지가 없고 Monitoring/metrics_out 에도 로그가 없다",
     bm:null, am:null},

    {s:22, loc:"5", n:"세션당 I/O 1회 + Timing Wheel", st:"na",
     r:"실측 데이터 없음",
     m:"세션마다 Recv/Send 를 1회로 제한 · 타임아웃은 바퀴를 돌려 O(1) 로",
     ex:"구현은 들어가 있으나 A/B 로 잰 적이 없다. 노션 [병목지점 개선] 에 해당 실측 페이지가 없고 Monitoring/metrics_out 에도 로그가 없다",
     bm:null, am:null},

    {s:23, loc:"6", n:"dirty 선별 batch 저장", st:"na",
     r:"실측 데이터 없음",
     m:"바뀐 것만 골라 주기마다 묶어 UPSERT — 게임 스레드는 기다리지 않는다",
     ex:"구현은 들어가 있으나 A/B 로 잰 적이 없다. 노션 [병목지점 개선] 에 해당 실측 페이지가 없고 Monitoring/metrics_out 에도 로그가 없다",
     bm:null, am:null},
  ];
  /* ═══ 카드 열두 장 = 노션 실측 보고서 열두 편 ═══
     이 순서가 곧 카드 번호(①~⑫)이고, 병목이 옮겨간 순서다 — 노션 DB "병목지점 개선" 의
     작성 순서와 같다(동접 200 에서 5,200 까지 부하를 올리며 잰 차례).
     id 는 대시 없는 32자로, NOTION 앞에 붙여 공개 주소가 된다(위 설계 문서와 같은 규칙).
     EXPS 항목에 직접 적지 않고 여기서 붙이는 이유: 이 표가 '카드에 서는 열둘' 의 정본이라
     한 곳만 보면 무엇이 서고 무엇이 안 서는지 알 수 있다. 여기 없는 항목(현황판 · 동접별 트래픽 ·
     정정 이력 · 미측정 3건)은 노션에 대응 페이지가 없어 카드로 세우지 않는다. */
  const NOTION_EXP=[
    [1,   "37916a0b9f5980c5818cd8ac945907d1"],   /* SendQ Lock-Free */
    [2,   "37a16a0b9f5980288727da59996693b1"],   /* Send Coalescing */
    [3,   "37b16a0b9f5980ba9f6fc17c6ab0fb3b"],   /* SendThread 분리 */
    [4,   "38016a0b9f5980fab79cfcbc29c60fa1"],   /* SO_SNDBUF=0 */
    [5,   "38116a0b9f598158a563ffc13b1e0b5c"],   /* 1,500 동접 붕괴 */
    [6,   "38316a0b9f598004ab16e8d64f3a7b9c"],   /* 섹터 묶음 패킷 */
    [7,   "38a16a0b9f598130a9fcf0da9017798a"],   /* IOCP 워커 12 → 4 */
    [8,   "39b16a0b9f5980548d14f2afe4cead7c"],   /* 멤버십 팬아웃 묶음 */
    [9,   "39b16a0b9f59809b9155c081cd253537"],   /* 브로드캐스트 수신섹터 묶음 */
    [10,  "3a016a0b9f5980af9f98d6e614ddb9a0"],   /* 송신 워커 K2 → K3 */
    [11,  "3a116a0b9f5980f69c06c8a25aadf867"],   /* 게임스레드 코어 격리 */
    [0.2, "3a516a0b9f5981639321d22af4aa2d38"]    /* 결론 — 수평 확장으로 */
  ];
  NOTION_EXP.forEach(function(r,i){
    const e=EXPS.filter(function(x){ return x.s===r[0]; })[0];
    if(e){ e.no=i+1; e.nt=NOTION+r[1]; }
  });

  /* ═══ 측정 부하 — 노션 각 페이지 콜아웃의 '측정부하' 토글에서 옮겨온 값 ═══
     위 NOTION_EXP 와 같은 자리에 두는 이유는 출처가 같아서다. 노션이 다섯 칸(팬아웃 ·
     송신 메시지 · 평균 패킷 · 송신량 · 소켓 호출)을 고정 순서로 쓰는데, 가운데 둘(송신 메시지 ·
     송신량)은 이미 계기판이 bm/am 으로 들고 있다 — 여기서는 나머지 셋만 받는다.

     칸 뜻:  [s, 팬아웃, 평균 패킷 B(끄고), 평균 패킷 B(켜고), 소켓 호출/s(끄고), 소켓 호출/s(켜고)]
     팬아웃에 켜고 값이 없는 것은 그것이 통제 지표이기 때문이다 — 열두 실험 전부 OFF/ON 을
     같게 맞추고 잰다(보내는 일의 양은 그대로 두고 보내는 방식만 바꾼 것이 실험이라는 뜻).

     null 은 '그 페이지가 그 값을 안 적었다' 이지 0 이 아니다.
       ⑤ 1,500 붕괴 — 이 런만 원본 지표가 안 남아 부하가 실측이 아니라 환산이다(소켓 호출은 아예 없다)
       켜고 자리의 빈칸 — 그 페이지가 '변경 후' 를 안 적은 것이다. **값이 안 변했다는 뜻이 아니다** —
         노션의 회색 괄호는 새 정보를 줄 때만 붙는 표기라, 없다고 불변이 보장되지 않는다.
         그래서 계기판도 그 칸을 ±0% 로 그리지 않고 값 하나만 세운다(bneck.js paintDash 의 has2). */
  const LOAD=[
    [1,     37, 19.7, 19.6,  82600, null],
    [2,     37, 19.7, null,  82133, 4877],
    [3,    184, 19.7, null,  24400, null],
    [4,    184, 19.7, null,  24386, 23571],
    [5,    223, 19.7, null,   null, null],
    [6,    370, 19.6, 67.1,  51371, 48831],
    /* ⑦ 은 동접 2,500 → 4,000 스윕이라 노션 부하 줄이 **시작점(2,500) 기준**으로 적혀 있다
       (팬아웃 463 · 소켓 5.5만). 그런데 카드에 찍히는 동접은 결과를 잰 4,000 이라, 그대로 옮기면
       한 카드 안에서 세 칸만 다른 부하가 된다. 여섯 칸을 **동접 4,000 한 지점**으로 맞춘다 —
       노션도 끝점 팬아웃을 738 로 적어 두었고, 나머지는 실측 CSV 3회 중앙값이다
       (C4000_WT12_K2 → C4000_WT4_K2 · session_count 4,000). */
    [7,    738, 70.6, 70.9,  98236, 100349],
    [8,    738,   71,   93,  98276, 98031],
    [9,    738, 92.2, 94.0,  98813, 97522],
    /* ⑩ 부하 줄은 소켓 호출을 99k~122k 범위로 적었지만, 3절 표에는 K2 99k · K3 122k 로 나뉘어
       있다. 이 카드의 A/B 가 K2 → K3 이므로 범위가 아니라 그 둘이 맞다. */
    [10,   923, 93.4, null,  99000, 122000],
    /* ⑪ 도 ⑦ 과 같은 이유로 옮겼다. 노션 부하 줄은 동접 5,000 기준(팬아웃 922 · 93.5 B · 12.3만)
       인데 카드가 보여 주는 결과는 5,200 지점이다(천장·붕괴 경계 발췌). 여섯 칸을 5,200 으로
       맞춘다 — 실측 CSV CEIL_cc5200_A_off → B_on(session_count 5,201). */
    [11,   962, 93.5, 92.4, 125618, 118672],
    [0.2,  922, 93.5, null, 123000, null]
  ];
  LOAD.forEach(function(r){
    const e=EXPS.filter(function(x){ return x.s===r[0]; })[0];
    if(e) e.ld={fan:r[1], pkt:r[2], pkt2:r[3], sock:r[4], sock2:r[5]};
  });
  window.__EXPS=EXPS;   /* 아래층(계기판·카드)이 같은 배열을 그대로 본다 — 수치를 두 벌 두지 않는다 */

  /* ═══ 핀 클릭 → 오른쪽 패널 교체 ═══
     예전에는 아래 실험 목록으로 스크롤해 카드를 번쩍이게 했다. 그건 '지도에서 눈을 떼게' 만든다 —
     어느 자리를 눌렀는지 확인하려면 다시 올라와야 했다. 지도를 그대로 둔 채 옆에서 갈아 끼우는 쪽이 맞다. */
  const bnCard=document.getElementById("bncard");
  let pinDefs=[];        /* buildBody 가 PINS 를 만들면서 채운다 — 아래 전환 줄이 이 배열을 쓴다 */
  /* 짓기와 켜기를 가른다: 전환 애니는 진입하는 프레임에 미리 짓고(fillCard) 1.34s 에 켜기만 한다.
     핀·전환줄 클릭은 예전처럼 openCard 하나로 둘 다 한다. */
  /* 카드 안을 채우는 일은 이제 없다 — 열두 장은 bneck.js 가 한 번 지어 두고 그대로 서 있는다.
     여기서 하는 것은 자리 잡기뿐이다: hidden 을 떼면 이 프레임에 배치·래스터가 끝나고,
     1.34s 의 '켜기' 는 합성 단계의 알파 한 값만 바꾼다(아래 진입 시계 주석 참조). */
  function fillCard(){ if(bnCard) bnCard.hidden=false; }
  /* 사용자가 닫는 조작은 없다(닫으면 실험이 화면에서 사라진다). 이건 탭에 다시 들어올 때
     진입 애니 동안만 감춰 두는 용도다.
     ※ 여기서 핀의 lit 도 같이 껐었는데, 다시 켜 주는 곳이 없어서 탭을 나갔다 오면 배지 번호가
       사라진 채로 남았다(카드 쪽 .rc.on 은 그대로인데 지도만 꺼져 서로 어긋난다). 핀 클릭이
       카드를 열던 시절의 잔재다 — 그때는 카드를 닫으면 핀도 꺼야 짝이 맞았다.
       지금은 카드가 늘 열려 있으므로 고른 자리도 계속 켜져 있는 것이 맞다. 진입 애니가
       그 위로 다시 한 번 떨어뜨리는 것뿐이다. */
  function closeCard(){
    if(!bnCard) return;
    bnCard.classList.remove("on"); bnCard.hidden=true;
  }
  function build(){ if(built) return; built=true; buildBody(); }
  function buildBody(){
  /* 복제(cloneNode)가 아니라 같은 코드를 이 SVG 로 한 번 더 돌린다 — 면을 칠하는 방식이 달라서 복제로는 안 된다.
     배치·각도·도형은 설계 탭과 완전히 같고, 청사진으로 칠하는 것만 다르다.

     씬을 두 벌 그리되 서로 '다른 SVG 판' 에 그린다:
       #bnsolid = 설계 탭과 똑같은 모습   ← 전환 애니의 출발 프레임
       #bnscene = 청사진                  ← 도착 프레임(평소 보이는 것)
       #bnpins  = 핀만
     청사진은 도형 자체가 와이어(wireBox)라, filter 만 꺼서는 설계 탭 색이 나오지 않는다.
     '설계 → 병목' 으로 변하는 장면을 만들려면 설계 모습 한 벌이 실제로 있어야 한다.
     판을 나눠 두는 이유는 성능이다 — 한 SVG 안에서 무엇 하나라도 움직이면 그 SVG 전체를 다시 그린다.
     판을 나누면 움직이는 것은 HTML 요소의 transform/opacity 뿐이라 이미 그려 둔 그림을 옮기기만 한다. */
  /* 판 한 벌 = 레이어 5장. 같은 구성으로 아이소·평면 두 번 그린다(뒤에서 값끼리 이어 붙이려고). */
  function plate(host,wire){
    const root=el("g"), L=[el("g"),el("g"),el("g"),el("g"),el("g")];
    L.forEach(function(x){ root.appendChild(x); });
    const oz=TZ, osh=TS, orl=TR, ob=TB, ol=TL;
    TZ=L[0]; TR=L[2]; TB=L[3]; TL=L[4];
    /* 청사진에 접지 그림자는 없다 → 어디에도 안 붙는 g 로 흘려보낸다(그래서 레이어가 4장으로 보인다) */
    TS = wire ? el("g") : L[1];
    if(wire){ WIRE=1;
      WSTEP=0;  paintZones();                  /* 구역 판은 격자 없이 면만 */
      WSTEP=26; paintRails(); paintBodies(); paintLabels();
      WIRE=0;
    } else { paintZones(); paintRails(); paintBodies(); paintLabels(); }
    TZ=oz; TS=osh; TR=orl; TB=ob; TL=ol;
    if(wire){
      wireify(L[3],false); wireify(L[2],true);
      /* 비콘 자리는 핀 ②가 대신함 */
      [].slice.call(root.querySelectorAll(".beacon")).forEach(function(e){ e.parentNode.removeChild(e); });
    }
    if(host) host.appendChild(root);
    return root;
  }

  /* ═══ 평면 투영 — 위에서 똑바로 내려다본 자세 ═══
     u 는 화면 오른쪽, v 는 화면 위. 아이소에서 회전만으로 갈 수 있는 조합이 이것뿐이라
     전환 도중 그림이 뒤집히지 않는다(u 오른쪽·v 아래는 거울상이라 중간에 뒤집힘이 생긴다).
     배치를 격자에 맞춰 놨던 덕에 펴면 세 줄이 된다:
       위   Timing Wheel · DB 워커 · MySQL
       가운데 클라 → Accept → IOCP → SwapQ → 게임 루프   (수신)
       아래  Send 워커 ← 송신 큐                          (응답)
     1.36 과 원점 두 개는 '구역판 + 발자국 + 라벨' 을 전부 넣고 판 한가운데 오도록 푼 값이다.
     원점(cx·cy)에 52·18 이 더해져 있는 것은 요각(YAW=−12) 때문에 옮긴 viewBox 를 따라간 것이다 —
     평면 그림 자체는 각도와 무관하므로, 창이 움직인 만큼 같이 움직여야 화면에서 제자리에 남는다. */
  const FPJ={iso:false, ax:1.36, bx:0, cx:443.84, ay:0, by:-1.36, cy:514.25, kz:0};
  const fx=function(u){ return FPJ.cx+FPJ.ax*u; };
  const fy=function(v){ return FPJ.cy+FPJ.by*v; };

  /* draw() 는 애니메이션이 잡아 쓸 참조를 전역에 남긴다 — 두 번째 그리기가 덮으면 설계 탭 애니가 죽는다 */
  const keep=[gameBeacon,sectorCells,iocpCells,twGeo,swapqLit,dbwLit];
  const solid=plate(bs,false), ghost=plate(bn,true);   /* ① 설계 모습  ② 청사진 — 둘 다 아이소 */
  solid.setAttribute("class","solid"); ghost.setAttribute("class","ghost");
  /* ③④ 같은 두 벌을 평면으로. 문서에 안 붙인다 — 숫자만 빼 쓰고 버릴 그림이다. */
  const OPJ={}; for(var pk in PJ) OPJ[pk]=PJ[pk];
  for(var fk in FPJ) PJ[fk]=FPJ[fk];
  FLAT=1;
  const solidF=plate(null,false), ghostF=plate(null,true);
  FLAT=0;
  for(var rk in OPJ) PJ[rk]=OPJ[rk];
  gameBeacon=keep[0]; sectorCells=keep[1]; iocpCells=keep[2]; twGeo=keep[3]; swapqLit=keep[4]; dbwLit=keep[5];

  /* 청사진의 단색 물들이기는 원래 CSS filter 한 줄이었다. 그런데 474개 요소를 담은 그룹에 필터가 걸리면
     브라우저가 프레임마다 그룹을 통째로 오프스크린에 다시 그린 뒤 색변환을 한다 —
     전환 애니(마스크가 매 프레임 바뀜)에서 이게 그대로 겹쳐 화면이 툭툭 끊겼다.
     같은 색변환을 그릴 때 한 번만 계산해 칠해 두면 결과는 같고, 상시 렌더 비용은 0 이 된다.
     CM = brightness(1.06)·saturate(2.4)·hue-rotate(168deg)·sepia(1)·grayscale(1) 을 하나로 접은 행렬
     (다섯 함수 모두 선형이라 3×3 하나로 접힌다. 값이 255를 넘으면 브라우저와 똑같이 자른다). */
  const CM=[0.17084,0.57473,0.05802, 0.29129,0.97991,0.09892, 0.40592,1.36553,0.13785];
  function blueprint(c){
    if(!c||c==="none"||c.indexOf("url(")===0) return null;
    let r,g,b,a=null;
    if(c.charAt(0)==="#"){ let h=c.slice(1);
      if(h.length===3) h=h.charAt(0)+h.charAt(0)+h.charAt(1)+h.charAt(1)+h.charAt(2)+h.charAt(2);
      r=parseInt(h.slice(0,2),16); g=parseInt(h.slice(2,4),16); b=parseInt(h.slice(4,6),16);
    } else { const m=c.match(/rgba?\(([^)]+)\)/); if(!m) return null;
      const p=m[1].split(",").map(parseFloat); r=p[0]; g=p[1]; b=p[2]; if(p.length>3) a=p[3]; }
    if(isNaN(r)||isNaN(g)||isNaN(b)) return null;
    const ch=function(i){ return Math.max(0,Math.min(255,Math.round(CM[i]*r+CM[i+1]*g+CM[i+2]*b))); };
    const o=ch(0)+","+ch(3)+","+ch(6);
    return a===null ? "rgb("+o+")" : "rgba("+o+","+a+")";
  }
  [].slice.call(ghost.querySelectorAll("*")).forEach(function(e){
    ["fill","stroke"].forEach(function(k){
      const n=blueprint(e.getAttribute(k)); if(n) e.setAttribute(k,n); }); });

  /* ═══════════ 평면화 — 아이소 그림과 평면 그림 사이를 오간다 ═══════════
     아이소를 평면으로 펴는 것은 기하가 바뀌는 일이라 CSS transform 으로는 안 된다.
     높이 z 가 화면 세로에 섞여 있어서, 평면을 펴는 변환이 건물 높이까지 같이 펴 버린다.
     그렇다고 매 프레임 씬을 다시 그릴 수도 없다(판 두 벌 ≈950개 도형).

     그래서 두 그림을 미리 그려 놓고 '숫자만' 이어 붙인다.
     같은 코드가 만든 두 트리라 요소가 1:1 로 맞고, 자리마다 값이 어떻게 달라지는지만 표로 떠 두면
     매 프레임 할 일은 곱셈과 문자열 조립뿐이다.
     ※ 두 그림 사이를 직선으로 오가면 중간 프레임도 전부 멀쩡한 평행투영이 된다(2×3 행렬이면 다 유효).
       카메라를 실제로 돌리는 경로도 만들어 봤는데, 도중에 직사각형의 대각선이 세로로 서면서
       그림 세로가 414 → 561 로 부풀어 판을 넘었다. 직선 경로는 428 → 474 로 단조롭게 는다. */
  const MATTR=["points","x1","y1","x2","y2","cx","cy","rx","ry","r","x","y",
               "transform","font-size","letter-spacing","opacity"];
  const NUMS=/-?\d*\.?\d+(?:e[-+]?\d+)?/g;
  const tracks=[]; let mism=0;
  function collect(a,b){
    if(!a||!b||a.tagName!==b.tagName){ mism++; return; }
    for(let i=0;i<MATTR.length;i++){ const k=MATTR[i];
      const va=a.getAttribute(k), vb=b.getAttribute(k);
      if(va==null||vb==null||va===vb) continue;
      const na=va.match(NUMS), nb=vb.match(NUMS);
      if(!na||!nb||na.length!==nb.length){ mism++; continue; }
      tracks.push({e:a, k:k, p:va.split(NUMS), f:na.map(Number), t:nb.map(Number)});
    }
    const ca=a.children, cb=b.children;
    if(ca.length!==cb.length){ mism++; return; }
    for(let i=0;i<ca.length;i++) collect(ca[i],cb[i]);
  }
  collect(solid,solidF); collect(ghost,ghostF);
  /* 두 트리가 안 맞으면(드로잉 코드에 도형을 더한 것이다) 애니를 포기하고 평면으로 고정한다 —
     어긋난 채 이어 붙이면 엉뚱한 도형끼리 섞여 그림이 무너진다. */
  MORPHABLE = (mism===0 && tracks.length>0);
  setFlat = function(k){
    if(!MORPHABLE) return;
    for(let i=0;i<tracks.length;i++){ const tr=tracks[i], f=tr.f, t=tr.t, p=tr.p;
      let s=p[0];
      for(let j=0;j<f.length;j++) s += Math.round((f[j]+(t[j]-f[j])*k)*100)/100 + p[j+1];
      tr.e.setAttribute(tr.k,s); }
  };
  if(!MORPHABLE && window.console) console.warn("[bneck] 평면화 보간 불가 — 두 그림의 구조가 다르다",mism);

  /* 핀 3곳 = 실험이 실제로 붙었던 자리 (카드 배지 1·2·3과 1:1).
     핀 이름은 노드 라벨과 겹치지 않게 '병목 현상'으로 짓는다(게임 루프 옆에 또 게임 루프 금지) */
  const HOT="#ff6b52";
  /* 좌표는 평면 기준이다 — 핀은 평면화가 거의 끝난 뒤에 꽂히므로 도중 자세를 따라다닐 필요가 없다.
     지면에 놓인 테는 평면에서 정원이 된다(아이소의 rx:ry=2:1 눌린 타원이 아니라).
     ②만 막대를 76 으로 세운 것은, 게임 루프 라벨이 그 자리 오른쪽에 있어 배지 이름표와 붙기 때문. */
  /* why = 이 자리가 왜 병목이었나. 실험 이름만으로는 '왜 하필 여기' 가 안 보인다 —
     지도에서 핀을 누르는 이유가 이 한 줄이다(실험 목록은 아래에 있던 것을 그대로 옮겨 온 것뿐이므로). */
  const PINS=[
    /* sub(부제)는 아래에서 실험 배열을 세어 채운다 — 여기 적지 않는다.
       자리 0 은 지도에 꽂을 핀이 없다(특정 지점이 아니라 전체의 현재값이다) — nopin 으로 표시한다. */
    {n:"0", name:"현재", nopin:true, u:0, v:0, h:0, rx:0, side:1,
     why:"카드마다 찍힌 동접은 그 실험을 돌린 시점의 부하다. 마지막 카드의 5,200 을 지금 값으로 읽지 않도록, 현재 참인 값을 여기 따로 둔다."},
    {n:"1", name:"송신 경로",        u:190, v:-70, h:60, rx:15, side:-1,
     why:"송신이 게임 틱에 매달려 있었다 — 클라 수만큼 늘어나는 send 호출을 틱이 그대로 떠안는 자리."},
    {n:"2", name:"멤버십 팬아웃",    u:410, v:50,  h:76, rx:20, side:1,
     why:"게임 루프 안에서 도는 대상 계산이라 틱 시간을 직접 먹는다 — 단일 코어의 예산을 깎아먹던 자리."},
    {n:"3", name:"브로드캐스트 복사", u:310, v:-70, h:54, rx:17, side:1,
     why:"한 번 만든 패킷을 대상 수만큼 다시 복사했다 — 동접이 오를수록 복사가 제곱으로 붙던 자리."},
    /* ④ 막대를 100 으로 세운 것은 ② 와 같은 이유다 — SwapQ 라벨이 그 자리 바로 옆에 있어
       기본 높이로는 배지 이름표가 노드 이름과 붙는다. ⑥ 도 DB 워커 라벨 때문에 한 칸 더 세웠다. */
    {n:"4", name:"큐 넘김",          u:310, v:42,  h:100,rx:14, side:-1,
     why:"워커가 쌓고 게임 루프가 빼 가는 공유 큐 — 틱마다 건드리는 자리라 락이 그대로 틱에 실린다."},
    {n:"5", name:"수신 길목",        u:190, v:50,  h:56, rx:15, side:-1,
     why:"완료 통지를 받아 파싱하는 길목 — 세션마다 I/O 를 겹쳐 걸면 워커끼리 서로 밀리던 자리."},
    {n:"6", name:"저장 경로",        u:273, v:148, h:64, rx:13, side:1,
     why:"저장이 게임 스레드를 붙잡으면 틱이 통째로 밀린다 — 주기마다 한 번씩 걸리던 자리."},
  ];
  /* 자리별 부제(채택 n · 기각 n)는 손으로 적지 않고 실험 배열에서 센다 —
     실험이 늘 때마다 두 곳을 같이 고쳐야 하면 언젠가 반드시 어긋난다. */
  PINS.forEach(function(p){
    const c={ok:0,rj:0,dg:0,na:0,now:0,sum:0,fix:0};
    EXPS.forEach(function(e){ if(e.loc===p.n) c[e.st]++; });
    p.sub=[c.ok&&"채택 "+c.ok, c.rj&&"기각 "+c.rj, c.dg&&"진단 "+c.dg, c.na&&"미측정 "+c.na,
           c.now&&"현재 "+c.now, c.sum&&"결론 "+c.sum, c.fix&&"정정 "+c.fix]
          .filter(Boolean).join(" · ");
  });
  pinDefs=PINS; window.__PINS=PINS;
  /* 톤이 화면 전체에서 '한 번에' 바뀌면 두 그림을 겹쳐 놓고 밝기만 만진 것으로 보인다.
     좌하(클라) → 우상(MySQL) 대각선으로 번지게 한다 — 패킷이 들어오는 자리에서 시작해 흐름을 따라간다.
     설계 탭 등장 웨이브와 같은 축·같은 등속이라 두 화면이 같은 문법으로 읽힌다.
     방향은 CSS 마스크가 갖고 있으므로(bnGrow) 여기서 잡을 좌표가 없다.
     ※ 한때 원형이었고, 그 중심을 병목 1번지(게임 루프)에 뒀다가 클라이언트로 옮긴 적이 있다.
       지금은 방향이 대각선 하나로 고정돼 그 선택 자체가 사라졌다. */
  const VX=359, VY=190, VW=805, VH=500;          /* 이 SVG 의 viewBox = 그림이 차지하는 칸 그대로.
                                                    panel-bneck.html 의 viewBox 세 개와 반드시 같은 값 */

  const gPins=el("g",{class:"pins"}); bp.appendChild(gPins);
  PINS.forEach(function(p,i){
    if(p.nopin) return;              /* 자리 0(현재)은 지도에 꽂을 지점이 없다 — 칩 줄에만 선다 */
    const x=fx(p.u), yb=fy(p.v), yt=yb-p.h;
    /* 핀은 누르는 것이 아니다 — 자리를 짚는 표시일 뿐이다(2026-08-04).
       한때 '이 자리에서 잰 첫 실험' 으로 가는 입구였는데, 그 실험 카드가 오른쪽에 열두 장 다 펼쳐져
       있으므로 같은 일을 하는 입구가 둘이었다. 게다가 핀 쪽은 한 자리에 실험이 여럿일 때 첫 것만
       열려 덜 정확했고, 여섯 중 셋(큐 넘김 · 수신 길목 · 저장 경로)은 실측 카드가 없어 눌러도
       아무 일이 안 났다. 고르는 일은 카드가 혼자 맡는다. */
    const g=el("g",{class:"pin","data-loc":p.n});
    /* 땅이 다 펴진 뒤에 꽂는다 — 아직 기울어 있는 땅에 평면 좌표의 핀이 먼저 서면 자리가 어긋나 보인다.
       꽂는 순서는 배지 번호 순서다. 카드 1·2·3 과 짝이라 세는 순서가 먼저다. */
    g.style.animationDelay=(1.34+i*0.08)+"s";
    g.appendChild(el("ellipse",{class:"pin-base",cx:x,cy:yb,rx:p.rx,ry:p.rx,fill:"none",stroke:HOT,"stroke-width":1.6,opacity:".85"}));
    const pulse=el("ellipse",{class:"pin-pulse",cx:x,cy:yb,rx:p.rx,ry:p.rx,fill:"none",stroke:HOT,"stroke-width":1.4});
    pulse.style.animationDelay=(i*0.55)+"s"; g.appendChild(pulse);
    g.appendChild(el("line",{x1:x,y1:yb-2,x2:x,y2:yt+11,stroke:HOT,"stroke-width":1.6,opacity:".7"}));
    /* 배지 바깥에 한 겹 띄운 테. 채운 점만 있으면 지도 위의 여느 도형과 크기로만 다른데, 띄운 테가
       있으면 '표시하려고 그린 것' 으로 읽힌다. 바닥의 파문(pin-pulse)과는 자리가 다르다 —
       파문은 지면 테(cy:yb)에서 퍼지고 이 테는 막대 위 배지(cy:yt)를 두른다. */
    g.appendChild(el("circle",{class:"pin-halo",cx:x,cy:yt,r:15,fill:"none",stroke:HOT,"stroke-width":1.2,opacity:".65"}));
    /* 배지는 속을 채운다. 한때 어두운 속(#241014)에 붉은 테 1.8 이었는데, 그러면 핀이 지도와 같은
       조형(가는 선으로 그린 원)이 되어 색만 다를 뿐 형태로는 안 갈렸다 — 지도에는 이미 원이 여럿이다
       (타이밍 휠 · 게임 루프 · 송신 큐). 채운 점은 면적을 가지므로 선 그림 위에서 바로 이긴다. */
    g.appendChild(el("circle",{class:"pin-badge",cx:x,cy:yt,r:11,fill:HOT,stroke:"#ffe0d6","stroke-width":1.4}));
    /* 배지 안은 비운 채로 꽂는다 — 번호는 자리가 아니라 실험이 갖는다.
       오른쪽 카드를 고르면 그 자리 핀에만 그 카드 번호가 들어온다(bneck.js 가 이 text 를 갈아 끼운다).
       글자는 채운 배지 위에 얹히므로 붉은색이 아니라 아주 어두운 색이라야 읽힌다. */
    g.appendChild(el("text",{class:"pin-no",x:x,y:yt+4.5,"text-anchor":"middle","font-size":13,"font-weight":"800",fill:"#1b0a06","font-family":"var(--mono)"},""));
    const tx=x+p.side*19, anch=p.side>0?"start":"end";
    g.appendChild(el("text",{x:tx,y:yt-1,"text-anchor":anch,"font-size":12.5,"font-weight":"800",fill:"#ffd9cf","font-family":"var(--sans)"},p.name));
    g.appendChild(el("text",{x:tx,y:yt+13,"text-anchor":anch,"font-size":10,"font-weight":"600",fill:"#9aa7bd","font-family":"var(--sans)"},p.sub));
    gPins.appendChild(g); pinEls[p.n]=g;
  });
  /* 전환 애니 재생 — 탭 코드(다른 스코프)가 '병목 · 실험' 으로 들어올 때마다 부른다.
     클래스를 뺐다가 강제 리플로우 뒤 다시 걸어야 두 번째 진입부터도 처음부터 재생된다.

     여기서 재는 값은 카메라 하나뿐이다 — fromRect(방금까지 보이던 설계 탭 씬의 위치·크기)에
     그대로 겹치는 transform. 상수로 못 박는다: 설계 씬은 .stage(최대 1860) 폭을 다 쓰고
     병목 그림은 그 63% 만 쓰므로, 창 크기마다 어긋나는 폭이 달라진다(viewBox 만 보고 계산하면 틀린다).
     번지는 쪽은 마스크 위치를 %로 미는 것이라 판 크기를 안 봐도 된다 — 그래서 잴 것이 없다. */
  const tilt=stage.querySelector(".bn-tilt");
  let bnTimer=0, bnRaf=0, bnOpen=0, bnFill=0;

  /* ── 평면화 구동 ──
     CSS 로는 못 하는 유일한 조각이라 여기만 rAF 다. 그래서 '모션 줄이기' 도 직접 막아야 한다
     (다른 연출은 전역 CSS 규칙 한 줄이 다 꺼 주지만 rAF 는 안 꺼진다). */
  /* 시계 (전부 클릭 기준):
       0.14~0.86s 카메라 안착   ← CSS. 여기서 끝나야 평면화가 고정 배율에서 돈다
       0.00~0.86s 청사진 번지기 ← CSS 마스크
       0.86~1.58s 평면화        ← 여기 rAF
       1.34s      핀 드랍·카드  ← 평면화가 거의 끝난 뒤. 핀 좌표가 '평면 기준' 이라 순서를 지켜야 한다
     ※ 끊김을 잡으려고 이 길이를 1200ms 로 늘려 본 적이 있는데, 원인은 길이가 아니라 카메라와 겹친 것이었다.
       카메라를 앞으로 뺀 뒤로는 720ms 로도 매끄럽다 — 원래 속도가 더 낫다고 판단해 되돌렸다.
     FLAT_DUR 을 건드리면 핀 지연(1.34)·카드 켜기(1340)·BN_TOTAL 을 같은 폭으로 함께 옮길 것.
     ※ BN_TOTAL 1860 → 2140. 핀은 1.34s 부터 0.08s 간격으로 여섯이 차례로 떨어지고 한 개가 0.30s
       걸리므로, 마지막 핀은 1.82s 에 시작해 2.12s 에 끝난다. 1860 에 .bn-enter 를 떼면 그 핀은
       공중에서 규칙을 잃고 제자리로 점프했다(꽂히다 만다). 진입의 끝은 마지막 핀이 앉는 시각이다. */
  const FLAT_AT=860, FLAT_DUR=720, BN_TOTAL=2140;
  const RMB=matchMedia("(prefers-reduced-motion:reduce)").matches;
  const panel=document.getElementById("p-bneck");
  /* CSS 카메라 안착과 같은 곡선(cubic-bezier(.22,.61,.36,1))을 그대로 계산한다.
     이제 두 움직임이 시간상 이어 달리므로, 곡선이 같아야 '한 동작이 계속된다' 로 읽힌다. */
  function bnEase(t){
    const x1=.22,y1=.61,x2=.36,y2=1;
    const cx=3*x1, bx=3*(x2-x1)-cx, ax=1-cx-bx;
    const cy=3*y1, by=3*(y2-y1)-cy, ay=1-cy-by;
    let u=t;
    for(let i=0;i<6;i++){ const d=(3*ax*u+2*bx)*u+cx; if(!d) break;
      const e=((ax*u+bx)*u+cx)*u-t; if(Math.abs(e)<1e-5) break; u-=e/d; }
    return ((ay*u+by)*u+cy)*u;
  }
  let flatRaf=0;
  function startFlatten(){
    cancelAnimationFrame(flatRaf);
    if(RMB||!MORPHABLE){ setFlat(1); return; }
    const t0=performance.now();
    flatRaf=requestAnimationFrame(function step(now){
      /* 도중에 탭을 떠나면 남은 프레임을 굴릴 이유가 없다 — 결과만 앉히고 끝낸다 */
      if(panel&&panel.hidden){ setFlat(1); return; }
      const e=now-t0;
      if(e<FLAT_AT){ flatRaf=requestAnimationFrame(step); return; }
      const k=Math.min(1,(e-FLAT_AT)/FLAT_DUR);
      setFlat(bnEase(k));
      if(k<1) flatRaf=requestAnimationFrame(step);
    });
  }
  setFlat(1);   /* 평소 모습 = 평면. 전환 애니는 여기서 아이소로 되돌렸다가 다시 편다 */

  realIntro=function(fromRect){
    stage.classList.remove("bn-enter","bn-hold"); void stage.getBoundingClientRect();
    /* 크기는 레이아웃 값(clientWidth/offsetHeight)으로 잰다 — getBoundingClientRect 는 기울기(rotateX)가
       반영된 '보이는' 상자라 그 값으로 판 크기를 잡으면 두 판이 어긋난다. 전환 1단계에는 기울기가 없다. */
    /* 폭은 판(.bn-stage)이 아니라 그림(.bn-tilt = 판의 63%)에서 잰다.
       카메라 배율이 '이 그림을 설계 씬 크기에 맞추는' 값이라, 판 폭으로 재면 1/0.63 만큼 어긋난다. */
    const sr=stage.getBoundingClientRect(), W=tilt.clientWidth, H=tilt.offsetHeight;
    if(W>0 && H>0){
      const st=stage.style;
      /* 카메라는 판 전체(.bn-cam)를 옮긴다 — 원점이 왼쪽 위라 계산이 화면 px 그대로다.
         지도를 왼쪽에 붙인 것(.bn-shift)은 sr 에 이미 들어 있어 여기서 따로 뺄 것이 없다.

         맞춰야 하는 것은 판이 아니라 '그림' 이다. 두 씬은 같은 그림을 다른 창(viewBox)으로 잘라 보여 준다
         — 설계는 259 부터 1042칸, 병목은 212 부터 900칸. 그래서 판 폭만 맞추면(옛 fromRect.width/W)
         그림 한 칸의 크기가 서로 달라, 겹쳐 놓아도 15% 안팎으로 어긋난 채 시작했다.
           u = 설계 씬에서 그림 한 칸이 몇 px 인가
           k = 병목 판을 그 칸 크기로 만드는 배율        (k·W/VW = u)
           tx = 판 왼쪽을 맞춘 뒤, 창 시작점 차이(212−259 칸)만큼 더 민다
         세로는 두 창의 시작점이 같아(172) 보정할 것이 없다. */
      const svb=svg && svg.viewBox && svg.viewBox.baseVal;     /* 설계 씬(#scene)의 viewBox */
      if(fromRect && fromRect.width>0 && svb && svb.width>0){
        const u=fromRect.width/svb.width;
        st.setProperty("--bn-t0",
          "translate("+((fromRect.left-sr.left)+(VX-svb.x)*u)+"px,"+
                       ((fromRect.top -sr.top )+(VY-svb.y)*u)+"px) scale("+(u*VW/W)+")");
      } else st.setProperty("--bn-t0","none");
    }
    clearTimeout(bnTimer); clearTimeout(bnOpen); clearTimeout(bnFill); cancelAnimationFrame(bnRaf); cancelAnimationFrame(flatRaf);
    /* ── 설계 탭에서 넘어온 것이 아니면 전환을 통째로 건너뛴다 ──
       이 애니가 하는 말은 '방금 보던 그 구조가 이 지도로 변한다' 하나뿐이다. 그러려면 직전 화면이
       1-1 이어야 성립한다 — 클라이언트 탭에서 건너오는 사람에게는 겹칠 그림이 없으니, 같은 1.86초가
       '들어올 때마다 기다려야 하는 시간' 으로만 남는다.
       판정은 fromRect 하나로 끝난다: tabs.js 가 '지금 설계 패널이 보이는 중일 때만' 그 씬의 자리를
       재서 넘기므로(paint 의 !pb.hidden), 값이 있다는 것이 곧 1-1 → 1-2 다.
       건너뛸 때는 평소 모습(평면·청사진 전체)으로 바로 앉힌다. bn-enter 를 안 붙였으므로
       마스크·카메라·핀 드랍 애니는 규칙째 걸리지 않고, 핀 파문만 제 주기로 돈다. */
    if(!fromRect){
      setFlat(1);
      fillCard();
      if(bnCard) bnCard.classList.add("on");   /* 0.35s 페이드는 남긴다 — 없으면 판이 뚝 나타난다 */
      return;
    }
    /* 애니는 걸되 시계는 세워 둔다 — 지금 이 프레임이 패널을 처음 배치하고 그리는 비싼 프레임이다.
       그리기가 끝난 다음 프레임에 시계를 켜야 초반이 안 잘린다. */
    stage.classList.add("bn-enter","bn-hold");
    if(!RMB) setFlat(0);       /* 출발 자세 = 아이소. 설계 탭에서 보던 그 그림 그대로 겹친다 */
    bnRaf=requestAnimationFrame(function(){ bnRaf=requestAnimationFrame(function(){
      stage.classList.remove("bn-hold");
      startFlatten();          /* CSS 시계를 푸는 바로 그 프레임에 같이 출발시킨다 */
      /* 오른쪽 패널은 핀 1이 꽂히는 시점에 같이 들어온다 — '핀이 박히고 그 내용이 옆에 열린다' 한 동작.
         더 일찍 띄우면 아직 변형 중인 지도 옆에서 패널만 따로 떠 있는 장면이 된다.
         다만 '짓기' 와 '켜기' 는 나눠 둔다:
           0.30s  짓기 — 이 구간은 마스크만 훑고 지나가는 중이라(평면화는 0.86s 부터) 메인 스레드가 비어 있다.
                        여기서 배치하고 레이어로 구워 둔다.
           1.34s  켜기 — 남은 일은 합성 단계의 알파 한 값뿐. 핀 드랍과 같은 시각이다.
         한 박자로 1.34s 에 다 하면 그 프레임이 평면화·핀 드랍과 겹쳐 전환 한복판이 통째로 밀린다.
         반대로 진입 프레임에 몰아넣어도 안 된다 — 거기는 이미 도형 950개를 처음 그리는 프레임이다. */
      bnFill=setTimeout(function(){ fillCard(); }, RMB?0:300);
      bnOpen=setTimeout(function(){ if(bnCard) bnCard.classList.add("on"); }, RMB?0:1340);
      /* 끝나면 클래스를 뗀다 — 그래야 핀 펄스(무한 반복)가 이 시점부터 처음 주기로 시작한다 */
      bnTimer=setTimeout(function(){ stage.classList.remove("bn-enter"); },BN_TOTAL);
    }); });
  };
  }   /* ← buildBody 끝 */

  /* 탭 코드(다른 스코프)가 '병목 · 실험' 으로 들어올 때마다 부른다. 아직 안 지었으면 여기서 짓는다. */
  window.playBneckIntro=function(fromRect){ build(); closeCard(); realIntro(fromRect); };
  /* ═══ 첫 전환이 유독 한 번 멈칫하던 이유 = '지어 두기' 만으로는 모자랐다 ═══
     실측(창 1584×905 · dpr 1 · 새 프로필): 첫 전환에서 프레임 하나가 83ms(=5프레임 유실).
     두 번째·세 번째 전환은 최대 17ms 로 깨끗했다. long task 는 0 — 즉 JS 가 아니라 그리기 쪽이다.
     display:none 인 판은 지어 놔도 레이아웃도 래스터도 안 된다. 탭을 누른 그 프레임에
     도형 900여 개를 처음 래스터하느라 밀린 것이다(한 번 미리 그려 두고 재니 83 → 33ms 로 떨어졌다).
     그래서 한가할 때 두 프레임만 실제로 그려 본다: 흐름에서 빼고(absolute) 거의 투명하게 올렸다 내린다
     — 문서 높이가 안 변하니 스크롤이 안 튀고, opacity .01 이라 눈에도 안 띈다. */
  var warmAt=-1e9;
  function prewarm(){
    var pb=document.getElementById("p-bneck"); if(!pb) return;
    if(performance.now()-warmAt<1500) return;      /* 마우스가 들락거려도 두 프레임짜리 예열이 겹치지 않게 */
    warmAt=performance.now();
    /* 이미 병목 탭에 들어와 있으면(딥링크 #bneck 이거나 예열 전에 눌렀다) 벌써 그려진 뒤다 —
       여기서 손대면 보이는 판을 두 프레임 흔드는 꼴이 된다. */
    if(!pb.hidden) return;
    var st=pb.style;
    st.position="absolute"; st.left="0"; st.right="0"; st.top="0";
    st.opacity="0.01"; st.pointerEvents="none";
    pb.hidden=false;
    requestAnimationFrame(function(){ requestAnimationFrame(function(){
      /* 두 프레임 사이에 사용자가 탭을 눌렀을 수도 있다 — 그때는 판을 도로 숨기면 안 된다.
         (탭 코드가 hidden 을 이미 false 로 만들어 뒀으므로 자리 잡는 값만 되돌린다.) */
      var live=document.querySelector('.subtab[data-sub="bneck"]');
      if(!(live&&live.classList.contains("act"))) pb.hidden=true;
      st.position=st.left=st.right=st.top=st.opacity=st.pointerEvents="";
    }); });
  }
  /* 브라우저가 한가해지는 첫 순간에 미리 지어 둔다 — 그래야 탭을 눌렀을 때 짓느라 멈칫하지 않는다.
     requestIdleCallback 이 없는 브라우저(사파리 구버전)는 짧은 타이머로 대신한다.
     예열은 짓기와 같은 작업에 붙이지 않는다 — 한 프레임에 몰면 등장 웨이브가 도는 중에 겹친다. */
  var idle=window.requestIdleCallback||function(f){ setTimeout(f,300); };
  idle(function(){ build(); idle(prewarm,{timeout:2000}); },{timeout:1200});
  /* 한가할 때 해 둔 예열은 시간이 지나면 효과가 옅어진다 — 숨은 판의 래스터 타일은 브라우저가 회수한다.
     실측: 처음 83ms → 한가할 때 예열 50ms → 누르기 직전에 예열 33ms(=1프레임).
     그래서 '누르기 직전' 을 잡는다. 정거장에 마우스가 얹히거나 키보드 초점이 오면 그때 한 번 더 데운다.
     클릭까지 보통 100~300ms 라 타일이 살아 있는 동안 눌린다. */
  var subB=document.querySelector('.subtab[data-sub="bneck"]');
  if(subB) ["pointerenter","focus"].forEach(function(ev){
    subB.addEventListener(ev,function(){ build(); prewarm(); },{passive:true}); });
})();

/* ═══════════ 구역 강조 — 버튼이 하는 일은 #scene 에 data-zone 을 거는 것뿐 ═══════════
   무엇이 밝고 어두운지는 전부 CSS 가 요소의 data-z 를 보고 고른다. 그래서 칩처럼 달리는 도중
   구역이 바뀌는 요소도(수신 칩) data-z 만 갈아 끼우면 알아서 따라온다 — 여기서 다시 훑을 필요가 없다. */
(function(){
  const bar=document.querySelector(".zonebar"); if(!bar||!svg) return;
  const btns=[].slice.call(bar.querySelectorAll(".zb"));
  /* 카드가 오른쪽 열이 아니라 씬 위에 얹히는 폭 — 기준값은 common.css 의 .card 미디어쿼리와 같은 680 이다 */
  const cardOverlay=matchMedia("(max-width:680px)");
  function apply(z){
    if(z) svg.setAttribute("data-zone",z); else svg.removeAttribute("data-zone");
    btns.forEach(function(b){ const on=(b.getAttribute("data-z")||"")===z;
      b.classList.toggle("act",on); b.setAttribute("aria-pressed",on?"true":"false"); });
    closeCard();   /* 열려 있던 상세 카드가 죽은 노드의 것일 수 있다 — 강조를 바꿀 때는 접는다 */
    /* 구역을 골랐으면 그 개요를 같은 자리에 띄운다. '전체'(z="")는 강조 해제라 아무것도 안 띄운다 —
       네 버튼 중 하나만 다른 성격의 글을 갖는 것을 피한다.
       진입 순회 중에도 띄운다. 한때 막아 뒀는데, 그러면 순회가 알리려던 것의 절반만 보여 준다 —
       씬이 어두워지는 것만 보이고 정작 버튼의 결과물인 오른쪽 글은 2.5초 내내 빈칸이었다.
       대신 순회본은 미리보기(brief)다: 620ms 에 다 읽힐 만큼만 짓는다(openZone 주석).
       단 좁은 화면(≤680px)에서는 순회 중에 안 띄운다. 거기서는 카드가 오른쪽 열이 아니라
       씬 위에 얹히는 판이라(common.css 의 max-width:680px), 씬 높이 162px 을 카드 138px 이
       거의 덮는다(실측) — 순회가 보여 주려던 강조가 카드 뒤로 사라진다. 눌러서 여는 것은 그대로다. */
    if(z && !(tourOn && cardOverlay.matches)) openZone(z,tourOn);
  }
  btns.forEach(function(b){ b.addEventListener("click",function(){
    const z=b.getAttribute("data-z")||"";
    /* 같은 버튼을 다시 누르면 전체로 — 따로 '해제' 조작을 두지 않는다 */
    apply(svg.getAttribute("data-zone")===z?"":z); }); });
  /* 탭을 옮겼다 '설계 · 구현' 으로 돌아오면 강조는 항상 전체로 되돌린다.
     구역 하나만 켜 둔 채 나갔다 오면 다시 왔을 때 '그림이 반쯤 꺼진 화면' 부터 보게 된다.
     탭 전환 코드는 뒤의 IIFE(다른 스코프)에 있어 여기서 창에 걸어 준다. */
  window.resetZone=function(){ tourStop(false); apply(""); };

  /* ── 진입 구역 순회 ──
     이 버튼들은 눌러 보기 전에는 무엇이 달라지는지 알 수 없다 — 들어온 사람에게 한 바퀴만 대신 눌러 준다.
     순회도 반드시 apply() 를 그대로 탄다: 버튼의 .act 가 같이 옮겨 다녀야 '저 버튼이 이 화면을 만든다' 로
     읽힌다. 씬만 바꾸면 화면이 저절로 깜빡이는 것으로 보이고, 그러면 어포던스는 하나도 전달되지 않는다.

     끊는 조건을 넉넉히 둔 이유가 따로 있다: 순회가 도는 동안은 구역 버튼이 저절로 옮겨 다니므로,
     사용자가 누르려던 버튼이 손끝에서 바뀌어 버린다. 그래서 사용자 입력 한 번이면 끝낸다 —
     이미 돌고 있었으면 전체로 되돌리고,
     아직 예약뿐이었으면 예약만 버린다(화면은 손댄 적이 없으니 되돌릴 것도 없다).
     받는 곳은 capture 라 클릭보다 먼저다. 구역 버튼을 눌러 끝난 경우에도 순서가 맞는다 —
     먼저 순회가 풀리고, 뒤이어 그 버튼의 click 이 얹힌다. */
  /* TOUR_HOLD = 한 구역에 머무는 시간. 페이드(#scene [data-z] 의 transition, .22s)와 한 쌍으로 움직인다 —
     머무는 시간이 페이드보다 넉넉해야 칸마다 '다 켜진 화면' 이 한 박자 보인다.
     380 → 620 (전체 1.5초 → 2.5초). 380 일 때는 페이드 220 을 빼고 '다 켜진 화면' 이 160ms 뿐이라,
     씬이 저 혼자 깜빡이는 것으로 보이고 정작 알리려던 것 — 오른쪽 끝 구역 버튼이 같이 옮겨 다닌다는 사실 —
     을 따라갈 틈이 없었다. 620 이면 그 틈이 400ms 로 늘어 눈이 씬에서 버튼으로 한 번 건너갈 수 있다.
     더 늘리지 않는 이유: 순회는 사용자가 아직 아무것도 안 한 시간이라, 길어질수록 '멈춘 페이지' 가 된다. */
  const TOUR=["outside","net","game","store"], TOUR_HOLD=620;
  const TOUR_EV=["pointerdown","keydown","wheel","touchstart"];
  const tourRM=matchMedia("(prefers-reduced-motion:reduce)").matches;
  const pBuild=document.getElementById("p-build");
  let tourTimer=0, tourOn=false, tourArmed=false, tourWait=false;
  function onUser(){ tourStop(true); }
  function tourStop(restore){
    clearTimeout(tourTimer);
    TOUR_EV.forEach(function(ev){ window.removeEventListener(ev,onUser,true); });
    const wasOn=tourOn;
    tourArmed=false; tourOn=false;
    /* 되돌리기는 '이미 구역을 걸어 놓은 경우' 에만 — 예약 단계에서 취소된 것뿐이라면 화면은 손댄 적이 없다.
       여기서 무조건 apply("") 를 부르면 그 안의 closeCard() 가, 방금 사용자가 연 상세 카드를 닫아 버린다. */
    if(restore&&wasOn) apply("");
  }
  /* 부르는 쪽은 뒤의 웨이브 IIFE — 웨이브를 시작하는 그 자리에서 '예약' 하고, delay 뒤에 순회가 돈다.
     예약을 웨이브가 끝난 뒤에 걸면 안 된다: 그러면 웨이브가 도는 동안 들어온 입력을 못 받아서,
     이미 노드를 누르며 화면을 쓰고 있는 사람에게 순회가 뒤늦게 화면을 뺏는다. 예약한 순간부터 듣는다. */
  window.__zoneTourArm=function(delay){
    if(tourOn||tourArmed||tourRM) return;
    /* 지금 안 보이는 화면이면 소진하지 않는다 — 해시 딥링크(#bneck)로 열면 첫 play() 때 여기가 숨어 있다.
       나중에 '설계 · 구현' 으로 들어오면 그때 다시 불리므로, 여기서 표를 쓰지 않고 그냥 돌려보낸다. */
    if(pBuild&&pBuild.hidden) return;
    /* 배경 탭으로 열린 경우 — 이력서·메일의 링크를 ctrl+클릭 하면 흔하다. 지금 돌리면 아무도 못 보고
       표만 날아간다. 여기는 탭 전환처럼 다시 불러 주는 쪽이 없으므로(play() 는 진입할 때만 돈다)
       화면이 앞으로 나오는 순간을 직접 기다렸다가 한 번만 다시 예약한다(웨이브는 이미 끝났으니 짧게). */
    if(document.hidden){
      if(tourWait) return;
      tourWait=true;
      document.addEventListener("visibilitychange",function once(){
        if(document.hidden) return;
        document.removeEventListener("visibilitychange",once);
        tourWait=false; window.__zoneTourArm(900);
      });
      return;
    }
    /* 한때 세션에 한 번이었다(sessionStorage "mmoZoneTour"). 지금은 이 화면에 들어올 때마다 돈다 —
       순회가 알리려는 것은 '오른쪽 끝 버튼이 이 화면을 만든다' 인데, 첫 진입 한 번은 웨이브 직후라
       그림에 눈이 팔려 놓치고 지나가기 쉽다. 매번 돌려도 방해가 크지 않은 근거는 바로 아래 TOUR_EV 다 —
       입력 한 번이면 그 자리에서 끊기므로, 사람이 무언가 하려는 순간에는 알아서 비켜선다. */
    tourArmed=true;
    /* passive — 아무것도 막지 않고 순회만 끊는다. wheel 을 non-passive 로 걸면 스크롤이 한 박자 늦는다.
       (remove 는 capture 만 맞으면 되므로 해제 쪽은 그대로 true) */
    TOUR_EV.forEach(function(ev){ window.addEventListener(ev,onUser,{capture:true,passive:true}); });
    tourTimer=setTimeout(function(){
      if(!tourArmed) return;                                   /* 예약 중에 입력이 들어왔다 */
      if(pBuild&&pBuild.hidden){ tourStop(false); return; }
      tourOn=true;
      let i=0;
      (function step(){
        if(!tourOn) return;
        if(pBuild&&pBuild.hidden){ tourStop(true); return; }    /* 도중에 탭을 옮기면 전체로 되돌리고 끝 */
        if(i>=TOUR.length){ apply(""); tourStop(false); return; }   /* 마지막은 반드시 '전체' */
        apply(TOUR[i++]);
        tourTimer=setTimeout(step,TOUR_HOLD);
      })();
    }, delay);
  };
})();
})();
