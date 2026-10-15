function bundleClamp(value,min=0,max=1){return Math.min(max,Math.max(min,value));}
function bundlePreviewFrame(program){
  const send=program.segments.find(segment=>segment.row===1&&segment.phase==='outlet');
  const frame=bundleFrame(send.start+send.duration*.5,program);
  for(const row of frame.rows){row.opacity=1;row.gray=0;}
  frame.phase='송신 요청 중 · 같은 Msg 4개 · 호출 4회 → 1회';frame.preview=true;
  return frame;
}
function bundleEase(value){const p=bundleClamp(value);return p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;}
function bundleLight(value,rest=.28,peak=.46){const p=bundleClamp(value);return rest+(peak-rest)*4*p*(1-p);}
function bundleQueueLamp(state,index){
  const strength=Math.max(state.queueLights[index],state.sendLight);
  const alpha=.30+.50*strength,remaining=1-state.drains[index];
  return {strength,alpha,remaining,effectiveAlpha:alpha*remaining};
}
function applyProtocolHeader(header,progress,set){
  if(!header)return;
  set(header.mask,{width:header.width*progress});set(header.fill,{opacity:bundleLight(progress,.18,.28)});
  set(header.label,{opacity:.38+.62*progress});
}
function createBundleProgram(compact=false){
  const segments=[];let cursor=0;
  const actors=['1','2','3','4'],transfer=400;
  function add(row,phase,duration,actor=-1){
    const name=row===0?'변경 전':'변경 후',subject=actor>=0?`이동 ${actors[actor]} · `:'';
    const captions={warm:'이동 준비',move:subject+'한 칸 이동',source:subject+'좌표 전달',message:`Msg ${actors[actor]} 생성`,copy:`Msg ${actors[actor]} → SendQ`,queue:`Msg ${actors[actor]} 적재`,hold:row===0?'큐 비움 · 다음 이동':`Msg ${actors[actor]} 보관`,tick:'틱 끝 · Msg 4개 누적',outlet:row===0?`WSASend · ${actor+1}번째 호출`:'WSASend · 누적 데이터 한 번에 요청',release:row===0?`Msg ${actor+1} 빠져나감`:'Msg 4개 빠져나감',rowEnd:'송신 요청 완료',switch:'변경 후 · 같은 경로 다시 이동',compare:'완료 · 같은 Msg 4개 · 호출 4회 → 1회'};
    const label=phase==='switch'||phase==='compare'?captions[phase]:`${name} · ${captions[phase]}`;
    segments.push({id:`${row}-${phase}-${actor}-${segments.length}`,row,phase,actor,start:cursor,end:cursor+duration,duration,label});cursor+=duration;
  }
  add(0,'warm',400);
  for(let actor=0;actor<4;actor++){
    add(0,'move',400,actor);add(0,'source',transfer,actor);add(0,'message',400,actor);
    add(0,'copy',transfer,actor);add(0,'queue',400,actor);add(0,'outlet',transfer,actor);add(0,'release',200,actor);add(0,'hold',160,actor);
  }
  add(0,'rowEnd',400);add(1,'switch',400);add(1,'warm',400);
  for(let actor=0;actor<4;actor++){
    add(1,'move',400,actor);add(1,'source',transfer,actor);add(1,'message',400,actor);
    add(1,'copy',transfer,actor);add(1,'queue',400,actor);add(1,'hold',160,actor);
  }
  add(1,'tick',600);add(1,'outlet',transfer);add(1,'release',200);add(1,'rowEnd',400);add(1,'compare',400);
  return {segments,end:cursor,compact};
}
function locateBundleSegment(time,program){
  const t=bundleClamp(time,0,program.end);
  const index=program.segments.findIndex(segment=>t<segment.end);
  if(index<0)return {index:program.segments.length-1,progress:1};
  const segment=program.segments[index];return {index,progress:bundleClamp((t-segment.start)/segment.duration)};
}
function bundleFrame(time,program){
  const t=bundleClamp(time,0,program.end),position=locateBundleSegment(t,program),current=program.segments[position.index];
  const makeRow=()=>({moves:[0,0,0,0],packets:[0,0,0,0],queue:[0,0,0,0],queueLights:[0,0,0,0],sendLight:0,drains:[0,0,0,0],calls:0,source:null,copy:null,outlet:null,opacity:1,gray:0,focus:-1,copies:0});
  const rows=[makeRow(),makeRow()];rows[1].opacity=.28;rows[1].gray=1;
  for(let index=0;index<=position.index;index++){
    const segment=program.segments[index],raw=index===position.index?position.progress:1,p=bundleEase(raw),row=rows[segment.row],live=index===position.index&&t<program.end;
    if(segment.phase==='move'){row.moves[segment.actor]=p;if(live)row.focus=segment.actor;}
    if(segment.phase==='message')row.packets[segment.actor]=p;
    if(segment.phase==='queue'){
      row.queue[segment.actor]=p;
      const age=t-segment.end;
      row.queueLights[segment.actor]=age<0?p:age<=200?1:1-bundleEase((age-200)/200);
    }
    if(segment.phase==='outlet'&&raw>0)row.calls=segment.row===0?segment.actor+1:1;
    if(segment.phase==='release'){
      if(segment.row===0)row.drains[segment.actor]=p;
      else row.drains=[p,p,p,p];
    }
    if(segment.phase==='switch'){
      rows[0].opacity=1-.72*p;rows[0].gray=p;rows[1].opacity=.28+.72*p;rows[1].gray=1-p;
    }
    if(segment.phase==='compare'){rows[0].opacity=.28+.72*p;rows[0].gray=1-p;}
    if(live){
      if(segment.phase==='source')row.source={index:segment.actor,progress:p,opacity:1};
      if(segment.phase==='message')row.source={index:segment.actor,progress:1,opacity:1-p};
      if(segment.phase==='copy')row.copy={index:segment.actor,progress:p,opacity:1};
      if(segment.phase==='queue')row.copy={index:segment.actor,progress:1,opacity:1-p};
      if(segment.phase==='outlet'){row.outlet={index:0,progress:p,opacity:1};row.sendLight=bundleEase(raw*4);}
      if(segment.phase==='release'){row.outlet={index:0,progress:1,opacity:1-p};row.sendLight=1-p;}
    }
  }
  for(const row of rows)row.copies=row.queue.filter((value,index)=>value>=1&&row.drains[index]<1).length;
  const phase=t>=program.end?'완료 · 같은 Msg 4개 · 호출 4회 → 1회':current.label;
  return {time:t,phase,rows,segment:position.index,progress:position.progress,done:t>=program.end,activeRow:t>=program.end?'both':current.phase==='switch'?'switch':current.row===0?'before':'after'};
}
function bundleCharacterPose(character,moves){
  let step=3,progress=1;
  for(let index=0;index<4;index++)if(moves[index]<1){step=index;progress=moves[index];break;}
  const from=character.positions[step],to=character.positions[step+1];
  return {x:from[0]+(to[0]-from[0])*progress,y:from[1]+(to[1]-from[1])*progress,step,progress,direction:character.directions[step]};
}
function bundleGrayMatrix(amount){
  const p=bundleClamp(amount),rgb=[.2126,.7152,.0722],values=[];
  for(let row=0;row<3;row++){for(let col=0;col<3;col++)values.push((row===col?1-p:0)+p*rgb[col]);values.push(0,0);}
  values.push(0,0,0,1,0);return values.join(' ');
}
function bundlePolar(cx,cy,r,degrees){const angle=degrees*Math.PI/180;return [cx+Math.cos(angle)*r,cy+Math.sin(angle)*r];}
function bundleArc(region,progress){
  const p=bundleClamp(progress);if(p<=1e-7)return '';
  const {cx,cy,outer,inner,a,b}=region,end=a+(b-a)*p;
  const p1=bundlePolar(cx,cy,outer,a),p2=bundlePolar(cx,cy,outer,end),p3=bundlePolar(cx,cy,inner,end),p4=bundlePolar(cx,cy,inner,a);
  return `M${p1.join(',')} A${outer},${outer} 0 0 1 ${p2.join(',')} L${p3.join(',')} A${inner},${inner} 0 0 0 ${p4.join(',')} Z`;
}
function bundlePathPoint(points,progress){
  const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));
  let distance=lengths.reduce((sum,length)=>sum+length,0)*bundleClamp(progress);
  for(let i=0;i<lengths.length;i++){
    if(distance<=lengths[i]||i===lengths.length-1){const part=lengths[i]?bundleClamp(distance/lengths[i]):0;return [points[i][0]+(points[i+1][0]-points[i][0])*part,points[i][1]+(points[i+1][1]-points[i][1])*part];}
    distance-=lengths[i];
  }
  return points.at(-1);
}
function applyBundleFrame(scene,frame,set){
  for(let rowIndex=0;rowIndex<2;rowIndex++){
    const meta=scene.rows[rowIndex],state=frame.rows[rowIndex];
    set(meta.group,{opacity:state.opacity});set(meta.matrix,{values:bundleGrayMatrix(state.gray)});
    const character=meta.character,pose=bundleCharacterPose(character,state.moves),base=character.positions[0];
    set(character.sprite,{transform:`translate(${pose.x-base[0]} ${pose.y-base[1]})`});
    const moving=state.focus>=0&&state.moves[state.focus]>0&&state.moves[state.focus]<1;
    const facing=moving?character.directions[state.focus]:'south';
    set(character.face,{href:`#bundle-mage-${character.kind}-${facing}`,'data-facing':facing});
    meta.movementArrows?.forEach((id,index)=>{
      const p=state.moves[index],opacity=state.focus===index ? .6*Math.min(1,p/.15,(1-p)/.15) : 0;
      set(id,{opacity});
    });
    for(const [id,index,opacity] of [[character.sourceCell,pose.step,1-pose.progress],[character.targetCell,pose.step+1,pose.progress]]){
      const [x,y]=character.coordinates[index];set(id,{x:character.grid.x+x*character.cellW+1,y:character.grid.y+y*character.cellH+1,opacity});
    }
    meta.packets.forEach((packet,index)=>{
      const p=state.packets[index],handoff=state.queue[index];
      set(packet.contentGroup,{opacity:1-.45*handoff});
      set(packet.mask,{width:packet.width*p});set(packet.fill,{opacity:bundleLight(p)*(1-.4*handoff)});
      if(!packet.suppressStroke)set(packet.base,{stroke:p>0&&scene.material==='outline'?'var(--pcb-active)':'var(--pcb-edge)'});
      packet.normal.forEach((id,labelIndex)=>set(id,{opacity:rowIndex===1&&labelIndex>=2?p:.38+.62*p}));packet.ink.forEach(id=>set(id,{opacity:p>0?1:0}));
      if(packet.header){
        const header=packet.header;set(header.mask,{width:header.width*p});
        set(header.fill,{opacity:bundleLight(p,.14,.22)});
        header.normal.forEach(id=>set(id,{opacity:.38+.62*p}));header.ink.forEach(id=>set(id,{opacity:p>0?1:0}));
      }
      applyProtocolHeader(packet.protocolHeader,p,set);
    });
    meta.queue.forEach((region,index)=>{
      const lamp=bundleQueueLamp(state,index);
      set(region.id,{d:bundleArc(region,state.queue[index]),'fill-opacity':lamp.alpha,opacity:state.queue[index]>0?lamp.remaining:0});
      set(meta.queueRims[index],{opacity:state.queue[index]>0?lamp.strength*lamp.remaining:0});
    });
    meta.queueBands?.forEach((region,index)=>set(region.id,{d:bundleArc(region,state.queue[index]),opacity:state.queue[index]>0?1-state.drains[index]:0}));
    meta.queueLabels.forEach((id,index)=>{
      const filled=state.drains[index]<1&&state.queue[index]>=.55;
      const lamp=bundleQueueLamp(state,index),ink=lamp.effectiveAlpha>.51?'var(--pcb-char-ink)':(meta.queueInk||'var(--pcb-text)');
      set(id,{fill:filled?ink:'var(--pcb-muted)',opacity:filled?.42+.58*lamp.remaining:.42});
    });
    set(meta.queueCount,{fill:state.copies?'var(--pcb-text)':'var(--pcb-muted)'},`${state.copies}개`);
    set(meta.callCount,{fill:state.outlet?'var(--pcb-active)':'var(--pcb-muted)'},`${state.calls}회`);
    set(meta.outletLabel,{fill:state.outlet?'var(--pcb-active)':'var(--pcb-muted)'});
    set(meta.outletLight,{opacity:state.sendLight});
    if(meta.kernelBoundary){
      const crossed=state.outlet&&state.outlet.progress>=meta.boundaryProgress;
      set(meta.kernelBoundary,{stroke:crossed?'var(--pcb-active)':'var(--pcb-track)'});
      set(meta.kernelLabel,{fill:crossed?'var(--pcb-active)':'var(--pcb-muted)'});
    }
    for(const [beams,active] of [[meta.sourceBeams,state.source],[meta.copyBeams,state.copy],[meta.outletBeams,state.outlet]])beams.forEach((beam,index)=>{
      const selected=active&&index===active.index,p=selected?active.progress:0,opacity=selected?active.opacity:0;
      const [x,y]=bundlePathPoint(beam.points,p);
      set(beam.trace,{'stroke-dashoffset':beam.length*(1-p),opacity:.8*opacity});
      set(beam.head,{x:x-(beam.headWidth||7)/2,y:y-(beam.headHeight||7)/2,opacity:p>0&&p<1?opacity:0});
    });
  }
}
