// The same A events are broadcast one Msg at a time, with one enqueue per recipient.
function createMatchedBeforeProgram(){
  const segments=[];let end=0;
  function add(phase,ms,item=-1,rx=-1){segments.push({phase,item,rx,start:end,end:end+ms});end+=ms;}
  add('idle',300);
  for(let item=0;item<AFTER_PACKETS.length;item++){
    if(AFTER_PACKETS[item].type==='이동'){add('move',550,item);add('settle',200,item);}
    add('born',450,item);add('stored',400,item);add('prepare',400,item);add('ready',280,item);
    if(item===0)add('targets',650,item);
    for(let rx=0;rx<3;rx++){if(!AFTER_SELECTED[rx].some(p=>p.id===AFTER_PACKETS[item].id))continue;add('select',300,item,rx);add('deliver',350,item,rx);add('hold',item===AFTER_PACKETS.length-1?700:280,item,rx);}
  }
  add('done',700,AFTER_PACKETS.length-1,2);return {segments,end};
}
function matchedBeforeFrame(time,program){
  const clamp=p=>Math.max(0,Math.min(1,p)),ease=p=>p*p*(3-2*p);
  const f={phase:'완료 · 유효범위에 맞춰 Msg 개별 적재',step:'done',progress:1,move:0,player:ACTOR_START.slice(),source:Array(AFTER_PACKETS.length).fill(0),joined:Array(AFTER_PACKETS.length).fill(0),queues:[[],[],[]],calls:[0,0,0],completed:[0,0,0],rx:-1,item:-1,packet:-1,buffer:0,targets:0,moving:false,facing:'south',done:time>=program.end};
  for(const s of program.segments){
    if(time<s.start)break;const progress=clamp((time-s.start)/(s.end-s.start)),complete=time>=s.end;
    if(s.phase==='move')moveActor(f,AFTER_PACKETS[s.item],progress);
    if(s.phase==='born'){f.source[s.item]=ease(progress);f.packet=s.item;f.buffer=0;}
    if(s.phase==='ready')f.buffer=ease(progress);
    if(s.phase==='targets')f.targets=ease(progress);
    if(s.phase==='deliver'&&complete){f.queues[s.rx].push(AFTER_PACKETS[s.item].id);f.calls[s.rx]++;}
    if(s.phase==='hold'&&s.item===AFTER_PACKETS.length-1)f.completed[s.rx]=ease(clamp((time-s.start)/650));
    if(!complete){
      f.step=s.phase;f.progress=progress;f.item=s.item;f.rx=s.rx;f.moving=s.phase==='move';f.facing=f.moving?AFTER_PACKETS[s.item].facing:'south';
      const p=AFTER_PACKETS[s.item],recipient='S'+(s.rx+1),labels={idle:'왼쪽 맨 아래에서 시작',move:p?.facing==='north'?'A가 바로 위칸으로 이동':'A가 오른쪽 칸으로 이동',settle:'이동 완료',born:'A '+(p?packetAction(p):'')+' · Msg '+p?.id+' 발생',stored:'A의 Msg '+p?.id+' 준비',prepare:'Msg '+p?.id+' → 직렬화 버퍼',ready:'Msg '+p?.id+' 준비 완료',targets:'수신 섹터 순회 준비',select:recipient+' 순회',deliver:'Msg '+p?.id+' → '+recipient+' SendQ',hold:recipient+' · Msg '+p?.id+' 적재 완료',done:'유효범위에 맞춰 개별 적재 완료'};
      f.phase='변경 전 · '+labels[s.phase];break;
    }
  }
  if(f.done){f.step='done';f.item=AFTER_PACKETS.length-1;f.rx=2;}return f;
}
function applyMatchedBeforeFrame(scene,f,set){
  applyAfterFrame(scene,{...f,joined:Array.from({length:AFTER_PACKETS.length},(_,i)=>i===0?f.buffer:0)},set);
  const C={active:'var(--pcb-active)',soft:'var(--pcb-soft)',edge:'var(--pcb-edge)',muted:'var(--pcb-muted)',text:'var(--pcb-text)',bg:'var(--pcb-bg)'},p=AFTER_PACKETS[f.packet],d=scene.digest,row=d.rows[0];
  set(d.title,{},p?'Msg '+p.id:'Msg');set(row.group,{opacity:p&&f.buffer>0?1:0});set(row.data,{width:130*f.buffer});set(row.label,{fill:f.buffer>.9?C.bg:C.text},p?'A '+packetAction(p):'');set(d.rim,{stroke:f.buffer===1?C.active:C.edge});set(d.count,{fill:C.muted},p?'수신자별 순회':'Msg 준비');
  for(let j=0;j<3;j++){
    const badge=scene.recipientMsgs[j],generated=AFTER_SELECTED[j].reduce((sum,p)=>sum+f.source[AFTER_PACKETS.findIndex(v=>v.id===p.id)],0),pending=Math.max(0,generated-f.calls[j]),amount=Math.ceil(pending),current=f.rx===j&&pending>0;
    set(badge.group,{opacity:generated>0?1:0});set(badge.label,{fill:current&&pending===1?C.bg:C.text},'Msg '+amount+'개');set(badge.data,{width:70*Math.min(1,pending),opacity:1-f.completed[j],fill:current?C.active:C.soft});set(badge.doneData,{width:amount===0?70:0,opacity:amount===0?1:f.completed[j]});set(badge.rim,{stroke:current?C.active:C.edge});
    if(generated===0){const target=scene.world.targets[j];set(target.fill,{opacity:0});set(target.rim,{opacity:0});set(target.doneFill,{opacity:0});set(target.doneRim,{opacity:0});}
  }
  if(f.step==='prepare'){
    const route=[[scene.world.x+42+f.player[0]*84,scene.world.y+42+f.player[1]*84],[row.x+33,row.cy]],point=afterPoint(route,f.progress);set(scene.trail,{opacity:0});set(scene.carrierBox,{x:-8,width:16});set(scene.carrierText,{},String(p.id));set(scene.carrier,{opacity:1,transform:`translate(${point[0]} ${point[1]})`});
  }else if(f.step==='deliver'){
    set(scene.carrierBox,{x:-24,width:48});set(scene.carrierText,{},'Msg '+p.id);
  }
  const stage=['prepare','ready'].includes(f.step)?2:['select','deliver','hold','done'].includes(f.step)?3:1;
  for(let i=1;i<=3;i++)set(scene.kind+'-stage-'+i,{fill:i===stage?C.active:C.muted});
}
function createComparisonProgram(){const before=createMatchedBeforeProgram(),after=createAfterProgram(),gap=700;return {before,after,gap,end:before.end+gap+after.end};}
function comparisonFrame(time,program){
  const afterStart=program.before.end+program.gap,done=time>=program.end;
  return {before:matchedBeforeFrame(Math.min(time,program.before.end),program.before),after:afterFrame(Math.max(0,time-afterStart),program.after),active:done?'both':time<program.before.end?'before':time<afterStart?'transition':'after',phase:done?'완료 · 같은 Msg 유지 · S1·S2 적재 3회 → 1회':time<program.before.end?matchedBeforeFrame(time,program.before).phase:time<afterStart?'변경 전 완료 · 변경 후 비교':afterFrame(time-afterStart,program.after).phase};
}
function comparisonPanelWidth(width){return Math.max(320,Math.round(width));}
