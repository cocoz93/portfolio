// Digest OFF still aggregates movement at tick end; only chat enqueues immediately.
function createMatchedBeforeProgram(){
  const segments=[];let end=0;function add(phase,ms,item=-1,rx=-1,q=-1,action=-1,last=false){segments.push({phase,item,rx,q,action,last,start:end,end:end+ms});end+=ms;}
  function broadcast(item){add('born',450,item);add('stored',400,item);add('prepare',400,item);add('ready',280,item);add('targets',650,item);
    for(const sector of RECEIVE_SECTORS){if(!AFTER_SELECTED[sector.cell].some(p=>p.id===AFTER_PACKETS[item].id))continue;for(let i=0;i<sector.residents.length;i++){const q=sector.residents[i];add('select',300,item,sector.cell,q);add('deliver',350,item,sector.cell,q);add('hold',item===1?700:280,item,sector.cell,q,-1,item===1&&i===sector.residents.length-1);}}
    add('release',250,item);
  }
  add('idle',300);add('move',550,-1,-1,-1,0);add('settle',200,-1,-1,-1,0);broadcast(0);
  add('move',550,-1,-1,-1,1);add('settle',200,-1,-1,-1,1);add('tick-end',650);broadcast(1);add('done',700,1,2);return {segments,end};
}
function matchedBeforeFrame(time,program){
  const clamp=p=>Math.max(0,Math.min(1,p)),ease=p=>p*p*(3-2*p),f={...newFrame(time,program),packet:-1,buffer:0};
  for(const s of program.segments){
    if(time<s.start)break;const progress=clamp((time-s.start)/(s.end-s.start)),complete=time>=s.end;
    if(s.phase==='move'){moveActor(f,ACTOR_MOVES[s.action],progress);f.dirty=true;f.rx=-1;}
    if(s.phase==='tick-end'){f.tick=true;f.rx=-1;}
    if(s.phase==='born'){f.rx=-1;f.packet=s.item;f.buffer=0;f.source[s.item]=ease(progress);if(complete)f.generated[s.item]=1;if(s.item===1)f.dirty=false;}
    if(s.phase==='prepare'){f.buffer=ease(progress);f.source[s.item]=1-ease(progress);}
    if(s.phase==='ready')f.buffer=1;
    if(s.phase==='targets')f.targets=ease(progress);
    if(s.rx>=0)f.rx=s.rx;
    if(s.phase==='deliver'&&complete){f.queues[s.q].push(AFTER_PACKETS[s.item].id);f.calls[s.q]++;}
    if(s.phase==='hold'&&s.item===1){f.completed[s.q]=ease(progress);if(s.last)f.sectorCompleted[s.rx]=ease(progress);}
    if(s.phase==='release'){f.source[s.item]=0;f.buffer=1-ease(progress);}
    if(!complete){f.step=s.phase;f.progress=progress;f.item=s.item;f.q=s.q;f.action=s.action;f.moving=s.phase==='move';f.facing=f.moving?ACTOR_MOVES[s.action].facing:'south';
      const p=AFTER_PACKETS[s.item],recipient=s.q>=0?RECIPIENTS[s.q].id:'',labels={idle:'왼쪽 맨 아래에서 시작',move:ACTOR_MOVES[s.action]?.facing==='north'?'A 위로 이동 · dirty 등록':'A 오른쪽 이동 · 최종 상태 갱신',settle:'이동 완료 · Msg 생성 대기',born:p?.type==='채팅'?'A 채팅! · Msg 1 생성':'틱 끝 · 최종 이동 Msg 2 생성',stored:'Msg '+p?.id+' 준비',prepare:'Msg '+p?.id+' → 직렬화 버퍼',ready:'Msg '+p?.id+' 준비 완료',targets:'유효범위 주민 순회',select:recipient+' 순회',deliver:'Msg '+p?.id+' → '+recipient+' SendQ',hold:recipient+' · Msg '+p?.id+' 적재 완료',release:'수신자별 적재 완료 · Msg 해제','tick-end':'틱 끝 · dirty A의 최종 이동 상태 읽기',done:'같은 Msg를 개별 적재 완료'};
      f.phase='변경 전 · '+labels[s.phase];break;
    }
  }
  if(f.done){f.step='done';f.item=1;f.q=-1;}return f;
}
function applyMatchedBeforeFrame(scene,f,set){
  applyAfterFrame(scene,{...f,joined:[f.buffer,0]},set);
  const C={active:'var(--pcb-active)',edge:'var(--pcb-edge)',muted:'var(--pcb-muted)',text:'var(--pcb-text)',bg:'var(--pcb-bg)'},p=AFTER_PACKETS[f.packet],d=scene.digest,row=d.rows[0];
  set(d.title,{},p?'Msg '+p.id:'Msg');set(row.group,{opacity:p&&f.buffer>0?1:0});set(row.data,{width:130*f.buffer});set(row.label,{fill:f.buffer>.9?C.bg:C.text},p?'A '+packetAction(p):'');set(d.rim,{stroke:f.buffer===1?C.active:C.edge});set(d.count,{fill:C.muted},f.buffer>0?'Msg마다 개별 적재':'Msg 준비');
  if(f.step==='prepare'){const msg=scene.sourceMsgs[f.packet],route=[[msg.x+36,msg.y+12],[row.x+33,row.cy]],point=afterPoint(route,f.progress);set(scene.carrierBox,{x:-8,width:16});set(scene.carrierText,{},String(p.id));set(scene.carrier,{opacity:1,transform:`translate(${point[0]} ${point[1]})`});}
  const stage=['prepare','ready'].includes(f.step)?2:['select','deliver','hold','release','done'].includes(f.step)?3:1;
  for(let i=1;i<=3;i++)set(scene.kind+'-stage-'+i,{fill:i===stage?C.active:C.muted});
}
function createComparisonProgram(){const before=createMatchedBeforeProgram(),after=createAfterProgram(),gap=700;return {before,after,gap,end:before.end+gap+after.end};}
function comparisonFrame(time,program){
  const afterStart=program.before.end+program.gap,done=time>=program.end;
  return {before:matchedBeforeFrame(Math.min(time,program.before.end),program.before),after:afterFrame(Math.max(0,time-afterStart),program.after),active:done?'both':time<program.before.end?'before':time<afterStart?'transition':'after',phase:done?'완료 · 같은 Msg 유지 · S1·S2 적재 2회 → 1회':time<program.before.end?matchedBeforeFrame(time,program.before).phase:time<afterStart?'변경 전 완료 · 변경 후 비교':afterFrame(time-afterStart,program.after).phase};
}
function comparisonPanelWidth(width){return Math.max(320,Math.round(width));}
