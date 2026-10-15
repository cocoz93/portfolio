function createReuseProgram(){
  const segments=[];let time=0;
  function add(row,phase,actor,duration){duration/=row===0?1.25:1;const s={row,phase,actor,start:time,end:time+duration,duration};segments.push(s);time=s.end;}
  for(let row=0;row<2;row++){
    add(row,'prepare',0,300);add(row,'move',0,720);add(row,'settle',0,220);
    if(row===0){
      for(let i=0;i<3;i++){
        add(row,'recipient',i,500);add(row,'allocate',i,1200);add(row,'build',i,420);
        add(row,'copy',i,600);add(row,'hold',i,700);add(row,'release',i,1000);add(row,'rest',i,140);
      }
      add(row,'done',0,350);
    }else{
      add(row,'allocate',0,840);add(row,'build',0,420);add(row,'addref',0,500);
      for(let i=0;i<3;i++){add(row,'recipient',i,500);add(row,'copy',i,600);add(row,'hold',i,700);}
      add(row,'release',0,1000);add(row,'done',0,700);
    }
  }
  add(-1,'done',0,450);return {segments,end:time};
}
function reuseEase(p){p=Math.max(0,Math.min(1,p));return p*p*(3-2*p);}
function sectorFrame(time,program,preview=false){
  const clamp=v=>Math.max(0,Math.min(1,v));
  const state={time:Math.max(0,Math.min(program.end,time)),preview,activeRow:-1,focusTransition:1,finishTransition:1,phase:'같은 알림 · Msg 생성 3회 → 1회',rows:[0,1].map(row=>({
    messages:Array.from({length:row===0?3:1},()=>({live:preview,build:preview?1:0,ref:preview?(row===0?1:4):0,refAt:-99999,pulseAt:-99999})),
    queues:[0,0,0].map(()=>({filled:preview,pulseAt:-99999})),returned:[false,false,false],copy:null,transfer:null,
    created:preview?(row===0?3:1):0,copies:preview?3:0,worldMove:preview?1:0,moving:false,contextFocus:preview?1:.8,
    selected:false,activeRecipient:-1,noticeProgress:[0,0,0],noticeOpacity:0,targetsOpacity:preview?1:0
  }))};
  if(preview)return state;
  for(const s of program.segments){
    if(state.time<s.start)break;
    const p=clamp((state.time-s.start)/s.duration),done=state.time>=s.end;
    if(s.row<0){state.activeRow=-1;state.finishTransition=reuseEase(p);state.phase='완료 · Msg 생성 3회 → 1회 · 세 SendQ의 사본은 유지';continue;}
    const r=state.rows[s.row],m=r.messages[s.row===0?s.actor:0],label=s.row===0?'변경 전':'변경 후';
    state.activeRow=s.row;state.focusTransition=1;
    if(s.phase==='prepare'){
      state.focusTransition=reuseEase(p);state.phase=label+' · 이동 준비';
    }else if(s.phase==='move'){
      r.worldMove=reuseEase(p);r.moving=!done;r.contextFocus=1;state.phase=label+' · A가 왼쪽 중앙에서 가운데 중앙으로 이동';
    }else if(s.phase==='settle'){
      r.targetsOpacity=reuseEase(p);r.contextFocus=1-.34*reuseEase(p);state.phase=label+' · 섹터 이동 완료';
    }else if(s.phase==='recipient'){
      r.activeRecipient=s.actor;r.noticeProgress=[0,0,0];r.noticeProgress[s.actor]=reuseEase(p);r.noticeOpacity=1;
      r.contextFocus=.66+.34*reuseEase(p);state.phase=label+' · S'+(s.actor+1)+' 수신자 처리';
    }else if(s.phase==='allocate'){
      if(s.row===0){
        m.ref=p>=.3?1:0;r.contextFocus=1-.34*reuseEase(p/.3);
        state.phase=label+' · '+(p<.3?'S'+(s.actor+1)+' 요청 → Msg 풀':'Msg '+(s.actor+1)+' 할당');
        if(p>=.3)r.created=s.actor+1;
      }else{
        m.ref=1;r.created=1;state.phase='변경 후 · 공용 Msg 하나 할당';
      }
      if(done){m.live=true;r.transfer=null;}else r.transfer={kind:'allocation',actor:s.row===0?s.actor:0,p:s.row===0?p:.3+.7*p};
    }else if(s.phase==='build'){
      m.live=true;m.build=reuseEase(p);m.ref=1;r.contextFocus=.66;state.phase=label+' · A 정보를 직렬화';if(done)m.pulseAt=s.end;
    }else if(s.phase==='addref'){
      m.ref=4;m.refAt=s.start;state.phase='변경 후 · AddRef(3) · Ref 1 → 4';
    }else if(s.phase==='copy'){
      if(s.row===0)m.ref=2;
      r.contextFocus=s.row===0?.66:1-.34*reuseEase(p/.3);
      state.phase=label+' · '+(s.row===0?'Msg '+(s.actor+1):'같은 Msg')+' → S'+(s.actor+1)+' SendQ';
      if(done){r.queues[s.actor].filled=true;r.queues[s.actor].pulseAt=s.end;r.copies=s.actor+1;m.ref=s.row===0?1:3-s.actor;m.refAt=s.end;m.pulseAt=s.end;r.copy=null;}
      else r.copy={actor:s.actor,p,duration:s.duration};
    }else if(s.phase==='hold'){
      state.phase=label+' · '+(s.row===0?'S'+(s.actor+1)+' 적재 완료 · Copy 후 SubRef':(s.actor+1)+'회 사용 · Ref '+m.ref+' · 원본 유지');
      if(s.row===1){r.noticeOpacity=1-reuseEase((p-.7)/.3);if(done){r.activeRecipient=-1;r.noticeProgress=[0,0,0];}}
    }else if(s.phase==='release'){
      m.ref=0;m.refAt=s.start;m.live=false;state.phase=label+' · '+(s.row===0?'Msg '+(s.actor+1)+' 반환':'마지막 SubRef · Ref 0 → 풀 반환');
      if(s.row===0)r.noticeOpacity=1-reuseEase((p-.85)/.15);
      if(done){r.returned[s.row===0?s.actor:0]=true;r.transfer=null;r.activeRecipient=-1;r.noticeProgress=[0,0,0];r.noticeOpacity=0;}
      else r.transfer={kind:'return',actor:s.row===0?s.actor:0,p};
    }else if(s.phase==='rest'||s.phase==='done'){
      r.activeRecipient=-1;r.noticeProgress=[0,0,0];r.noticeOpacity=0;
    }
  }
  return state;
}
