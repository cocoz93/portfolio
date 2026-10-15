const refClamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const refEase=v=>{v=refClamp(v);return v*v*(3-2*v);};
function refPulse(time,event){const age=time-event;if(!Number.isFinite(event)||age<=0||age>=890)return 0;if(age<40)return refEase(age/40);if(age<=540)return 1;return 1-refEase((age-540)/350);}
function createRefProgram(){
  const segments=[];let end=0;
  const add=(row,phase,duration,actor=0)=>{duration=Math.round(duration/(row===0?1.25:1));const segment={row,phase,actor,start:end,end:end+duration,duration,index:segments.length};segments.push(segment);end=segment.end;};
  add(0,'prepare',300);add(0,'move',750);
  for(let i=0;i<3;i++){add(0,'source',350,i);add(0,'build',650,i);add(0,'hold',550,i);add(0,'addref',550,i);add(0,'copy',700,i);add(0,'hold',550,i);add(0,'return',550,i);}
  add(-1,'switch',700);add(1,'prepare',300);add(1,'move',750);add(1,'source',350);add(1,'build',650);add(1,'hold',550);add(1,'addref',650);
  for(let i=0;i<3;i++){add(1,'copy',700,i);add(1,'hold',550,i);}
  add(1,'return',550);add(1,'hold',650);add(-1,'done',650);
  return {segments,end};
}
function refRow(after){return {after,move:0,moving:false,builds:0,copies:0,packets:Array.from({length:after?1:3},()=>({fill:0,ref:0,alive:false,built:false,freed:false,born:Infinity,refEvent:Infinity,op:'',opEvent:Infinity})),queues:[0,0,0],queueEvents:[Infinity,Infinity,Infinity],subEvents:[Infinity,Infinity,Infinity],source:[0,0,0],copy:[0,0,0]};}
function refSegment(time,program){const index=Math.max(0,program.segments.findIndex(s=>time<s.end));const segment=program.segments[time>=program.end?program.segments.length-1:index];return {index:segment.index,progress:refClamp((time-segment.start)/segment.duration)};}
function refFrame(time,program){
  time=refClamp(time,0,program.end);const rows=[refRow(false),refRow(true)];let current=program.segments[0],progress=0;
  for(const s of program.segments){if(time<s.start)break;current=s;const p=refClamp((time-s.start)/s.duration),done=p>=1;progress=p;
    if(s.row>=0){const r=rows[s.row],packet=r.packets[s.row===0?s.actor:0];
      if(s.phase==='move'){r.move=refEase(p);r.moving=p>0&&!done;}
      if(s.phase==='source'&&!done)r.source[s.row===0?s.actor:0]=p;
      if(s.phase==='build'&&p>0){packet.fill=refEase(p);packet.ref=1;packet.alive=true;if(done){packet.built=true;packet.born=s.end;r.builds++;}}
      if(s.phase==='addref'&&p>0){packet.ref=s.row===0?2:4;packet.refEvent=s.start;packet.op=s.row===0?'AddRef()':'AddRef(3)';packet.opEvent=s.start;}
      if(s.phase==='copy'){
        if(!done)r.copy[s.actor]=p;r.queues[s.actor]=refEase(refClamp((p-.7)/.3));
        if(done){r.copies++;r.queueEvents[s.actor]=s.end;r.subEvents[s.actor]=s.end;packet.ref--;packet.refEvent=s.end;packet.op='';}
      }
      if(s.phase==='return'&&p>0){packet.ref=0;packet.alive=false;packet.freed=true;packet.refEvent=s.start;packet.op='SubRef()';packet.opEvent=s.start;}
    }
    if(!done)break;
  }
  let opacity=[.24,.24];if(current.row>=0)opacity[current.row]=1;else if(current.phase==='switch')opacity=[1-.76*refEase(progress),.24+.76*refEase(progress)];else opacity=[1,1];
  const r=current.row>=0?rows[current.row]:null,actor=current.actor+1,prefix=current.row===0?'변경 전':'변경 후';
  let phase='완료 · 생성·직렬화 3회 → 1회 · SendQ 적재 3회 → 3회';
  if(current.row>=0){const phases={prepare:'섹터 이동 준비',move:'캐릭터가 섹터 경계를 통과',source:'같은 캐릭터 정보를 전달',build:current.row===0?`세션 ${actor}용 Msg 생성·직렬화`:'공유 Msg를 한 번만 생성·직렬화',hold:r.copies>0?'SendQ에 바이트 사본 유지':'직렬화된 데이터 유지',addref:current.row===0?'AddRef() · Ref 1 → 2':'AddRef(3) · Ref 1 → 4',copy:`세션 ${actor} SendQ에 Copy → SubRef()`,return:current.row===0?`Msg ${actor} · SubRef() · Ref 1 → 0 · 풀 반환`:'빌더 소유권 SubRef() · Ref 1 → 0 · 풀 반환'};phase=`${prefix} · ${phases[current.phase]}`;}
  else if(current.phase==='switch')phase='변경 후 · 한 Msg를 재사용';
  return {time,rows,opacity,phase,segment:current,progress,preview:false};
}
function refPreview(program){const rows=[refRow(false),refRow(true)];rows.forEach((r,row)=>{r.move=1;r.builds=row===0?3:1;r.packets.forEach(p=>{p.fill=1;p.ref=row===0?1:4;p.alive=true;p.built=true;});});return {time:program.end,rows,opacity:[1,1],phase:'같은 정보 · 수신자 3명 예시 · 생성·직렬화 3회 → 1회',preview:true};}
function refPoint(points,progress){let length=0;const lengths=points.slice(1).map((p,i)=>{const n=Math.hypot(p[0]-points[i][0],p[1]-points[i][1]);length+=n;return n;});let distance=refClamp(progress)*length;for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]||i===lengths.length-1){const p=lengths[i]?distance/lengths[i]:0;return [points[i][0]+(points[i+1][0]-points[i][0])*p,points[i][1]+(points[i+1][1]-points[i][1])*p];}distance-=lengths[i];}return points.at(-1);}
function applyRefFrame(scene,frame,set){
  const C={active:'var(--pcb-active)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',dark:'var(--pcb-char-ink)'};
  function paintBeam(b,p){const on=p>0&&p<1,[x,y]=refPoint(b.points,p);set(b.line,{opacity:on?1:0,'stroke-dashoffset':b.length*(1-p)});set(b.head,{opacity:on?1:0,x:x-3,y:y-3});}
  for(let row=0;row<2;row++){
    const meta=scene.rows[row],state=frame.rows[row],character=meta.character;set(meta.group,{opacity:frame.opacity[row],filter:frame.opacity[row]===1?'none':'url(#serial-sharing-focus-v2-off)'});
    const a=character.positions[0],b=character.positions[1],x=a[0]+(b[0]-a[0])*state.move,y=a[1];
    set(character.face,{href:`#bundle-mage-${character.kind}-${state.moving?'east':'south'}`,transform:`translate(${x} ${y}) scale(${character.size/32})`,'data-facing':state.moving?'east':'south'});set(character.highlight,{x:x-16,opacity:.18});set(character.arrow,{opacity:state.moving?1:0});
    let poolFlash=0;
    for(let i=0;i<meta.packets.length;i++){
      const packet=meta.packets[i],s=state.packets[i],readFlash=Math.max(0,...packet.readEvents.map(time=>refPulse(frame.time,time))),flash=Math.max(refPulse(frame.time,s.born),readFlash)*(s.alive?1:0),refFlash=refPulse(frame.time,s.refEvent),opFlash=refPulse(frame.time,s.opEvent);
      set(packet.mask,{width:(packet.w-12)*s.fill});set(packet.fill,{opacity:s.alive?.72:0});set(packet.flash,{opacity:flash});set(packet.body,{fill:s.alive?(flash>=.5?C.dark:C.text):C.muted},s.freed?'풀 반환':'동일 정보');
      set(packet.ref,{fill:refFlash>.2?C.active:s.alive?C.text:C.muted},String(s.ref));
      const consuming=state.subEvents.some(time=>time===s.refEvent)&&refFlash>0;
      set(packet.op,{fill:opFlash>.2||consuming?C.active:C.muted},frame.preview?(row===1?'AddRef(3)':''):s.op||(consuming?'SubRef()':''));
      const returning=!frame.preview&&frame.segment.row===row&&frame.segment.phase==='return'&&(row===1||frame.segment.actor===i)?frame.progress:0;paintBeam(meta.returns[i],returning);
      if(s.freed)poolFlash=Math.max(poolFlash,refPulse(frame.time,s.refEvent));
    }
    if(row===1){
      const s=state.packets[0],countPulse=refPulse(frame.time,s.refEvent);
      for(const slot of meta.ownerSlots){const alive=slot.owner===0?s.ref>0:frame.preview||s.ref>=1+4-slot.owner,flash=alive?countPulse:0;set(slot.fill,{opacity:alive?.72:0});set(slot.flash,{opacity:flash});set(slot.label,{fill:alive?(flash>=.5?C.dark:C.text):C.muted});}
    }
    for(let i=0;i<3;i++){
      const q=meta.queues[i],n=state.queues[i],d=scene.arc(q.cx,q.cy,q.r,q.inner,q.a,q.a+(q.b-q.a)*Math.max(.001,n)),flash=refPulse(frame.time,state.queueEvents[i]),subFlash=refPulse(frame.time,state.subEvents[i]);
      set(q.fill,{d,opacity:n>0?.72:0});set(q.flash,{d,opacity:n>0?flash:0});set(q.label,{fill:n>=1?C.text:C.muted},n>=1?'Msg':'0');set(q.sub,{fill:C.muted},'');set(meta.cues[i],{fill:state.copy[i]>0?C.active:C.muted},row===1&&state.copy[i]>0?'Copy':'');paintBeam(meta.copy[i],state.copy[i]);if(meta.source[i])paintBeam(meta.source[i],state.source[i]);
    }
    set(meta.pool.flash,{opacity:poolFlash});set(meta.pool.label,{fill:poolFlash>=.5?C.dark:C.muted});set(meta.created,{},`생성·직렬화 ${state.builds}회`);set(meta.enqueued,{},`적재 ${state.copies}회`);
  }
}
