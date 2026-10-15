function bundleArrivalPulse(time,eventTime){
  if(!Number.isFinite(eventTime))return 0;
  const age=time-eventTime;
  if(age<=0||age>=450)return 0;
  if(age<40)return bundleEase(age/40);
  if(age<=150)return 1;
  return 1-bundleEase((age-150)/300);
}
function bundleFlashEvents(program){
  const rows=Array.from({length:2},()=>({queue:[Infinity,Infinity,Infinity,Infinity],message:[Infinity,Infinity,Infinity,Infinity],send:[],bundle:Infinity}));
  for(const segment of program.segments){
    const row=rows[segment.row];
    if(segment.phase==='queue'&&segment.actor>=0)row.queue[segment.actor]=segment.end;
    if(segment.phase==='message')row.message[segment.actor]=segment.end;
    if(segment.phase==='outlet')row.send.push(segment.start);
    if(segment.phase==='bundle')row.bundle=segment.end;
  }
  return rows;
}
function applyArrivalFlashes(scene,frame,set){
  const ringMode=__RING_MODE__;
  if(!scene.flashEvents)scene.flashEvents=bundleFlashEvents(createBundleProgram(scene.compact));
  for(let rowIndex=0;rowIndex<2;rowIndex++){
    const meta=scene.rows[rowIndex],state=frame.rows[rowIndex],events=scene.flashEvents[rowIndex];
    if(ringMode){
      const sending=Math.max(0,...events.send.map(time=>bundleArrivalPulse(frame.time,time)));
      meta.queue.forEach((region,index)=>{
        const strength=Math.max(bundleArrivalPulse(frame.time,events.queue[index]),sending);
        const remaining=1-state.drains[index],loaded=state.queue[index]>0;
        set(region.flash,{d:bundleArc(region,state.queue[index]),opacity:loaded?strength*remaining:0});
        set(meta.queueRims[index],{opacity:loaded?strength*remaining:0});
        if(remaining>0&&state.queue[index]>=.55)set(meta.queueLabels[index],{fill:strength>=.5?'var(--pcb-char-ink)':'var(--pcb-text)'});
      });
    }else{
      const completed=rowIndex===1?bundleArrivalPulse(frame.time,events.bundle):0;
      meta.packets.forEach((packet,index)=>{
        const arrived=state.packets[index]>=1;
        const strength=arrived?Math.max(bundleArrivalPulse(frame.time,events.message[index]),completed):0;
        set(packet.flash,{opacity:strength});
        const ink=strength>=.5?'var(--pcb-char-ink)':'var(--pcb-text)';
        for(const id of [...packet.normal,...packet.ink])set(id,{fill:ink});
      });
    }
  }
}
