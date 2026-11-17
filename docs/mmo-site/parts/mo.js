/* ═══ MO 서버(녹스) — 하위 탭 넷의 여닫기와 그 안의 고르기(구조 상자 · 병목 차수 · 컨텐츠) ═══
   다른 조각과 바깥 스코프를 나누지 않는다 — 이 파일 안에서 끝난다.
   병목 수치 출처 = Nox_MatchServer 최적화 반복 기록(64방 · 5분 · 세 판 중앙값) · 부하 한계 기록(11-15). */
(function(){
"use strict";
const M='media/';

/* 전체 구조 — 상자 이름(data-n) → [제목, 하는 일, 이어지는 곳] */
const N={
 launcher:['런처','WebView2 창 · 가입 · 로그인 · 자동 로그인. 로그인되면 게임을 띄운다.','HTTPS로 로그인 서버와만 말한다'],
 client:['정품 클라','2000년 정품(GOG 판매본) 그대로에 접속용 DLL만 붙인다.','남이 정한 패킷에 바이트 단위로 맞춰야 붙는다'],
 auth:['로그인 서버','HTTPS · 계정 · 암호 확인 · 로그인 시도 제한 · 계정 정지.','MySQL 계정 테이블'],
 lobby:['라우터 → 로비','라우터(4005)가 로비(4000)로 보낸다. 원작 로비 형식 그대로 · 대화방 · 방 목록 · 랭크 매칭 · 점수 · 전적.','들어갈 때 쓰는 입장 토큰에 서명'],
 chat:['채팅 서버','귓속말만 맡는 프로세스(4020). 정지된 계정은 DB에서 읽어 막는다.','로비와 따로 떠 있어 로비가 바빠도 귓속말은 안 밀린다'],
 game:['게임 서버','UDP · 30Hz 고정 틱 · 서버 하나가 방 N개를 돌린다. 원작은 방장 PC가 서버였다.','로비가 서명한 입장 토큰을 확인하고 들인다'],
 db:['MySQL','계정 · 점수 · 전적.','로그인 · 로비 · 채팅 서버가 쓴다. 게임 서버는 DB를 직접 안 만진다']
};
const ms=document.getElementById('ms-card');
function node(k){
  document.querySelectorAll('#mo-build .nd').forEach(g=>g.classList.toggle('act',g.dataset.n===k));
  const d=N[k];
  ms.innerHTML='<div class="mo-k">전체 구조</div><h3>'+d[0]+'</h3><p>'+d[1]+'</p><div class="sv">'+d[2]+'</div>';
}
document.querySelectorAll('#mo-build .nd').forEach(g=>g.addEventListener('click',()=>node(g.dataset.n)));
node('game');

/* 병목 개선 — [차수, 이름, 틱 합(ms/초 · 중앙값), 변화, 그 뒤 닿은 방 수, 병목 자리, 고친 것, 같은 결과 확인, 커밋]
   6차는 틱 합이 오히려 올랐다(128.7 → 135.8 · 까닭 미결). 판정은 틱 밖 게임 바쁨으로 했다 — 그래서 막대 색을 가른다(.up) */
const B=[
 ['기준','처음 잰 값',288.4,'','','','','',''],
 ['1차','시야 거르기',276.9,'−4.0%','','바닥 물건 소개 <code>AppendAoiStatics</code> — 틱의 21.4%','거리부터 보고 반경 안인 것만 「이미 소개했나」를 찾는다','패킷 종류별 개수 대조 폭 안 · 손실 0','b4d7a11'],
 ['2차','장애물 칸 색인',232.1,'−16.2%','224방','걸음 <code>UpdatePlayerMovement</code> 안 장애물 고리 — 17.0%','걸음마다 장애물 303개를 다 보던 것을 칸 색인으로 둘레만','패킷 대조 폭 안 · 손실 0','3740fd8'],
 ['3차','바닥 물건 칸 색인',200.3,'−13.7%','240방','<code>AppendAoiStatics</code> + <code>CollectAoiExits</code> — 21.4% + 12.0%','바닥 물건도 칸 색인 — 들어옴은 반경 칸만, 나감은 소개해 둔 것만, 차례는 전과 같게','시험 3,074자리 다름 0 · 일부러 틀린 판 7개 모두 걸림 · 패킷 대조 폭 안','663d716'],
 ['4차','별칭 찾기 묶음',154.9,'−22.7%','272방','<code>AliasTable::FindByObject</code> — <code>FillEntry</code> 13.4% 안','별칭 칸을 번호별로 묶어 그 묶음만 찾는다','시험 20만 걸음 다름 0 · 틀린 판 3개 걸림 · 패킷 대조 폭 안','394e40e'],
 ['5차','소개 배열',128.7,'−16.9%','','들어옴의 <code>introAt.count</code>(<code>std::map</code> 찾기) — 게임 스레드 20.4%','소개 기록을 번호 오름차순 배열로 — 이분 찾기','시험 20만 번 다름 0 · 틀린 판 3개 걸림 · 패킷 대조 같음','f5980db'],
 ['6차','인원 캐시',135.8,'게임 바쁨 −17.4%','','<code>CRoomManager::SeatCounts</code> — 틱 밖 빈 방 닫기 19.5%','방별 인원을 세션표 고칠 때 같이 고쳐 두고 참조로','판정 값 = 게임 바쁨(틱 밖) 221.8 → 183.2 · 틱 합은 오름(미결)','78e24f6'],
 ['7차','목록 재사용',117.5,'−13.5%','320방+','사람마다 · 틱마다 새로 잡던 목록 할당 — 할당 · 풀기 8.8%','목록을 버리지 않고 비워서 다시 쓴다','틀린 판 5개 걸림 · 패킷 대조 폭 안 · 손실 0','4ec1f6b']
];
const rows=document.getElementById('mb-rows'),mbc=document.getElementById('mb-card');
B.forEach((r,i)=>{
  const w=(r[2]/B[0][2]*100).toFixed(1);
  const b=document.createElement('button');
  b.type='button';b.className='mb-r'+(i===0?' base':'')+(i===6?' up':'');b.dataset.i=i;
  b.innerHTML='<span class="nm"><i>'+r[0]+'</i>'+r[1]+'</span>'
    +'<span class="tr"><b style="width:'+w+'%"></b>'+(r[4]?'<span class="rm" style="left:calc('+w+'% - 30px)">→ '+r[4]+'</span>':'')+'</span>'
    +'<span class="v">'+r[2].toFixed(1)+'<small>'+(r[3]||'ms/초')+'</small></span>';
  if(i>0)b.addEventListener('click',()=>step(i));
  rows.appendChild(b);
});
function step(i){
  rows.querySelectorAll('.mb-r').forEach(b=>b.classList.toggle('act',+b.dataset.i===i));
  const r=B[i];
  mbc.innerHTML='<div class="mo-k">'+r[0]+'</div><h3>'+r[1]+'</h3><dl>'
    +'<dt>병목 자리</dt><dd>'+r[5]+'</dd><dt>고친 것</dt><dd>'+r[6]+'</dd>'
    +'<dt>틱 합</dt><dd><b>'+B[i-1][2].toFixed(1)+' → '+r[2].toFixed(1)+'</b> ms/초 · '+r[3]+'</dd>'
    +'<dt>같은 결과</dt><dd>'+r[7]+'</dd><dt>커밋</dt><dd><code>'+r[8]+'</code></dd></dl>';
}
step(4);

/* 컨텐츠 — [묶음, 이름, 그림, 설명, 서버 쪽]
   사람 확인이 안 끝난 것(런처 · 대화방 · 귓속말 · 시간 제한)과 아직 못 찍은 것(웹 가입 · 점수 ±10)은 뺐다.
   닫히거나 찍히면 이 표에 줄을 더한다 — 묶음이 같은 줄은 붙여 둘 것(묶음 머리글을 줄 순서로 만든다) */
const C=[
 ['로비','방 목록',M+'mo-rooms.jpg','방을 만들고, 목록에서 골라 들어간다. 방 여러 개가 한 게임 서버에서 같이 돈다.','<b>로비</b> — 방 목록 · <b>게임 서버</b> — 방 N개'],
 ['매칭','랭크 매칭',M+'mo-rank.jpg','버튼 → 줄 서기 → 상대를 찾으면 수락 창 10초 → 둘 다 수락하면 랭크 방.','<b>로비</b> — 줄 · 수락 시간 · 방 만들기'],
 ['기록','전적 검색',M+'mo-record.jpg','이름을 넣으면 요약과 최근 20판.','<b>로비</b> → MySQL 전적']
];
const list=document.getElementById('mc-list'),img=document.getElementById('mc-img'),mcc=document.getElementById('mc-card');
let g0=null,gEl=null;
C.forEach((c,i)=>{
  if(c[0]!==g0){gEl=document.createElement('div');gEl.className='mc-g';gEl.innerHTML='<span class="mo-k">'+c[0]+'</span>';list.appendChild(gEl);g0=c[0];}
  const b=document.createElement('button');
  b.type='button';b.className='mc-it';b.dataset.i=i;
  b.innerHTML='<i>'+String(i+1).padStart(2,'0')+'</i>'+c[1];
  b.addEventListener('click',()=>pick(i));
  gEl.appendChild(b);
});
function pick(i){
  const c=C[i];
  list.querySelectorAll('.mc-it').forEach(b=>b.classList.toggle('act',+b.dataset.i===i));
  img.src=c[2];img.alt=c[1]+' 화면';
  mcc.innerHTML='<div class="mo-k">'+String(i+1).padStart(2,'0')+' · '+c[0]+'</div><h3>'+c[1]+'</h3><p>'+c[3]+'</p><div class="sv">'+c[4]+'</div>';
}
pick(1);

/* 하위 탭 — ?mo=build 처럼 주소로 바로 열 수 있다(상위 탭은 #mo 가 연다 · tabs.js) */
const KEYS=['intro','build','bneck','content'];
const subs=[...document.querySelectorAll('#mosub .subtab')];
function sub(k){
  subs.forEach(s=>{const on=s.dataset.mo===k;s.classList.toggle('act',on);s.setAttribute('aria-selected',on?'true':'false');});
  KEYS.forEach(x=>{document.getElementById('mo-'+x).hidden=(x!==k);});
}
subs.forEach(s=>s.addEventListener('click',()=>sub(s.dataset.mo)));
const q=new URLSearchParams(location.search).get('mo');
sub(KEYS.includes(q)?q:'intro');
})();
