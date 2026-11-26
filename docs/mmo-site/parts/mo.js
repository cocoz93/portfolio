/* ═══ MO 서버(녹스) — 하위 탭 셋의 여닫기와 그 안의 고르기(구조 상자 · 병목 차수) ═══
   소개 판(게임 소개 + 컨텐츠 목록)의 고르기는 intro.js 가 한다 — 표도 스크립트가 아니라 panel-mo.html 마크업에 있다(11-17).
   다른 조각과 바깥 스코프를 나누지 않는다 — 이 파일 안에서 끝난다.
   병목 수치 출처 = Nox_MatchServer 최적화 반복 기록(64방 · 5분 · 세 판 중앙값) · 부하 한계 기록(11-15). */
(function(){
"use strict";

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

/* 액자 영상(11-25) — 직업 소개 · 일반 대전 · 랭크 매칭. 영상은 목록 단추나 세부(.gi-sub)의 data-vid 로 intro.js 가 액자에 바로 붙인 video 하나를 같이 쓴다.
   이 파일이 intro.js 보다 먼저 실려 그 video 가 아직 없다 — 그래서 쓸 때마다 찾고, 시각 변화는 액자에서 붙잡기 단계로 받는다(미디어 이벤트는 거품이 안 올라온다).
   직업 소개(11-25 5판) — 슈팅 서버 판처럼 세부 아이콘으로 한 편씩 고른다(둥근 판 · 고르기 · 틀기는 intro.js). 여기는 그 카드가 보이는 동안
   영상을 되풀지 않게 하고(영상은 검게 끝나고, 아이콘을 다시 누르면 처음부터 — 끝난 영상에 play 하면 처음으로 간다) 지금 편의 개요 직업 줄(.mo-jobs li)을 켠다.
   옛 「이어 보기」(아래 세 칸 막대 · 카드 줄 · 로고 표지)는 걷었다 — 로고는 영상 앞에 붙였다(5판 1초 · 11-26 6판 「나」 1.3초).
   흐름 카드(.mo-flow) — 그 영상 시각으로 카드의 차례 줄(data-t = 영상 초)을 켜고, 줄을 누르면 그 시각으로 보낸다.
   11-26 펼침 띠 — 흐름 카드가 보이면 판이 한 칸으로 내려가는 건 mo.css(:has)가 한다. 여기는 칸 막대(.done · --p)만 더 채운다.
   액자 비율 — 세 영상 다 16:9 라 영상 카드가 보이면 16:9, 아니면 마크업 값(4:3).
   소리(11-25 16:10) — intro.js 영상은 소리 없이 튼다(자동 재생 규칙). 영상 카드가 보일 때만 액자에 .mo-snd 단추를 띄워 켜고 끄며,
   영상 카드를 떠나면 다시 끈다(개요로 갔다 와도 갑자기 소리가 나지 않게). 영상 카드끼리 옮길 때는 켠 상태를 이어 간다 */
(function(){
  const flows=[...document.querySelectorAll('#mo-intro .mo-flow')], job=document.getElementById('mo-job-card');
  const cards=flows.concat(job?[job]:[]); if(!cards.length) return;
  const fr=cards[0].closest('.gi').querySelector('.gi-fr');
  const vid=()=>[...fr.children].find(e=>e.tagName==='VIDEO');   // 액자 바로 아래 video(intro.js 가 만든 것)
  const steps=c=>[...c.querySelectorAll('.mo-steps button')];
  const snd=fr.querySelector('.mo-snd');
  const subs=job?[...job.querySelectorAll('.gi-sub')]:[], lines=[...fr.closest('.gi').querySelectorAll('.mo-jobs li')];
  /* 짝이 어긋나면 엉뚱한 줄이 켜진다 — 조용히 넘기지 말고 콘솔에 남긴다(줄 켜기만 손을 뗀다) */
  const paired=subs.length===lines.length; if(!paired) console.error('직업 소개 짝 어긋남', subs.length, lines.length);
  let cur=null, vcard=null;   // 보이는 흐름 카드 · 보이는 영상 카드(흐름 또는 직업)
  function setSnd(on){
    const v=vid(); if(v) v.muted=!on;
    if(snd){ snd.setAttribute('aria-pressed',on?'true':'false'); snd.textContent=on?'소리 끄기':'소리 켜기'; }
  }
  /* 11-26 펼침 띠 — 지난 칸 .done(막대 다 참) · 지금 칸 .on + --p(그 칸 시작 ~ 다음 칸 시작 사이 진행, 마지막 칸은 영상 끝까지) */
  function mark(){
    const v=vid(); if(!cur) return;
    const t=v?v.currentTime:0, bs=steps(cur); let k=0;
    bs.forEach((b,i)=>{ if(t>=+b.dataset.t) k=i; });
    bs.forEach((b,i)=>{ b.classList.toggle('on',i===k); b.classList.toggle('done',i<k); if(i===k) b.setAttribute('aria-current','step'); else b.removeAttribute('aria-current'); });
    const a=+bs[k].dataset.t, e=k+1<bs.length?+bs[k+1].dataset.t:((v&&v.duration)||a);
    bs[k].style.setProperty('--p',(e>a?Math.max(0,Math.min(1,(t-a)/(e-a)))*100:0).toFixed(1)+'%');
  }
  function jobLine(){
    if(!paired) return;
    const k=(job&&!job.hidden)?subs.findIndex(s=>!s.hidden):-1;
    lines.forEach((l,i)=>l.classList.toggle('on',i===k));
  }
  function sync(){
    cur=flows.find(c=>!c.hidden)||null;
    const onJob=!!(job&&!job.hidden);
    vcard=cur||(onJob?job:null);
    if(vcard) fr.style.setProperty('--gi-ar','16/9'); else fr.style.removeProperty('--gi-ar');
    const v=vid(); if(v) v.loop=!onJob;   // intro.js 는 늘 되풀게 만든다 — 직업 편만 끝에서 멈춘다
    if(snd){ snd.hidden=!vcard; if(!vcard) setSnd(false); }
    mark(); jobLine();
  }
  if(snd) snd.addEventListener('click',()=>{
    const v=vid(); if(!v||!vcard) return;
    setSnd(v.muted);
    if(v.paused){ const p=v.play(); if(p&&p.catch) p.catch(()=>{}); }
  });
  ['timeupdate','seeked','emptied'].forEach(n=>fr.addEventListener(n,e=>{ if(e.target===vid()) mark(); },true));
  flows.forEach(c=>steps(c).forEach(b=>b.addEventListener('click',()=>{
    const v=vid(); if(!v||c.hidden) return;
    v.currentTime=+b.dataset.t; const p=v.play(); if(p&&p.catch) p.catch(()=>{});
    mark();
  })));
  const mo=new MutationObserver(sync);
  cards.concat(subs).forEach(c=>mo.observe(c,{attributes:true,attributeFilter:['hidden']}));
  sync();
})();

/* 하위 탭 — ?mo=build 처럼 주소로 바로 열 수 있다(상위 탭은 #mo 가 연다 · tabs.js).
   옛 ?mo=content 는 소개로 연다 — 11-17 에 컨텐츠가 소개 판 목록으로 합쳐졌다 */
const KEYS=['intro','build','bneck'];
const subs=[...document.querySelectorAll('#mosub .subtab')];
function sub(k){
  subs.forEach(s=>{const on=s.dataset.mo===k;s.classList.toggle('act',on);s.setAttribute('aria-selected',on?'true':'false');});
  KEYS.forEach(x=>{document.getElementById('mo-'+x).hidden=(x!==k);});
}
subs.forEach(s=>s.addEventListener('click',()=>sub(s.dataset.mo)));
const q=new URLSearchParams(location.search).get('mo');
sub(KEYS.includes(q)?q:'intro');   /* content 를 포함한 나머지는 전부 소개 */
})();
