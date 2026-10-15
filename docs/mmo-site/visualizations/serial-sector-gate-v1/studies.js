function createPoolStudyScene(width, style){
  const scene=createSectorReuseScene(width,style);
  scene.style=style;
  for(const row of scene.rows)for(let i=0;i<row.copies.length;i++){
    const m=row.messages[row.messages.length===1?0:i],q=row.queues[i],copy=row.copies[i],bus=(m.right+q.left)/2;
    // Data leaves the centered output pin; one height change uses two right angles.
    copy.points=studyOrthogonalPoints([[m.right-12,m.cy],[bus,m.cy],[bus,q.cy],[q.left-4,q.cy]]);
    copy.length=studyBeam(copy.points).length;
  }
  return scene;
}
function studyRange(value,from,to){return reuseEase((value-from)/(to-from));}
function studyPath(points){return points.map((p,i)=>`${i?'L':'M'}${p.join(' ')}`).join(' ');}
function studyBeam(points){let length=0;for(let i=1;i<points.length;i++)length+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);return {points,length};}
function studyOrthogonalPoints(points){
  const result=[];
  for(const point of points){
    if(result.length&&point[0]===result.at(-1)[0]&&point[1]===result.at(-1)[1])continue;
    while(result.length>1){const a=result.at(-2),b=result.at(-1);if((a[0]===b[0]&&b[0]===point[0]&&(b[1]-a[1])*(point[1]-b[1])>=0)||(a[1]===b[1]&&b[1]===point[1]&&(b[0]-a[0])*(point[0]-b[0])>=0))result.pop();else break;}
    result.push(point);
  }
  return result;
}
function studySlotPoints(a,m,startX,endX,compact){
  const y=m.y+(compact?13:15),bus=a.allocationTrunk.rawPoints[1][0];
  return studyOrthogonalPoints([[startX,a.pool.outputY],[bus,a.pool.outputY],[bus,y],[endX,y]]);
}
function applyPoolStudyFrame(scene,state,set){
  applySectorFrame(scene,state,set);
  for(let row=0;row<2;row++){
    const a=scene.rows[row],r=state.rows[row],pool=a.pool,transfer=r.transfer;
    if(row===1&&a.reuseCaption){const ref=r.messages[0].ref;set(a.reuseCaption,{},ref>1?'빌더 1 + 수신자 '+(ref-1):ref===1?'빌더 1':'Ref 0 · 풀 반환');}
    for(let recipient=0;recipient<3;recipient++){
      const w=scene.worlds[row],n=w.notices[recipient];
      const intensity=r.activeRecipient===recipient?r.noticeProgress[recipient]*r.noticeOpacity:0;
      // All target paths stay complete; only the current recipient changes color.
      set(n.baseTrace,{opacity:.5*r.targetsOpacity});set(n.baseHead,{opacity:.5*r.targetsOpacity});
      set(n.trace,{opacity:intensity,'stroke-dashoffset':0});
      set(n.head,{opacity:intensity,points:n.headPoints});
      set(w.halos[recipient],{opacity:.12+.88*intensity});
      // Shared Msg construction precedes recipient processing and needs no per-recipient pool request.
      if(row===1){set(a.requests[recipient].carrier,{opacity:0});set(a.requests[recipient].trace,{opacity:0});}
    }
    const leased=r.messages.some(m=>m.live)||transfer?.kind==='return'||transfer?.kind==='allocation'&&transfer.p>=.3;
    const allocating=transfer?.kind==='allocation',returning=transfer?.kind==='return';
    const allocationP=allocating?Math.max(0,(transfer.p-.3)/.7):0;
    const returnP=returning?transfer.p:0;
    const atPool=allocating&&transfer.p>=.3&&allocationP<.18||returning&&returnP>.82;
    const returnedCount=r.returned.filter(Boolean).length;
    set(pool.count,{},allocating&&transfer.p>=.3?'할당 중':returning?'반납 중':leased?'사용 중':returnedCount?'반납 완료':'대기');
    set(pool.flash,{opacity:0});
    set(pool.slotFill,{opacity:leased?.16:.6});
    set(pool.indicator,{opacity:leased?1:0});
    set(pool.slotActive,{opacity:atPool?1:0});
    set(pool.card,{opacity:scene.style==='card'?(leased?.25:1):leased?.25:1,transform:'translate(0 0)'});
    set(pool.gateLeft,{transform:'translate(0 0)'});set(pool.gateRight,{transform:'translate(0 0)'});
    if(scene.style==='slot'){
      const active=transfer?transfer.actor:r.messages.findIndex(m=>m.live),ready=active>=0&&(!transfer||returning||transfer.p>=.3);
      if(ready){const headerY=a.messages[active].y+(scene.compact?13:15),bus=a.allocationTrunk.rawPoints[1][0];set(a.allocationTrunk.id,{d:studyPath(studyOrthogonalPoints([[pool.right+2,pool.outputY],[bus,pool.outputY],[bus,headerY]]))});for(let j=0;j<a.allocationBranches.length;j++)set(a.allocationBranches[j].id,{d:studyPath([[bus,a.messages[j].y+(scene.compact?13:15)],[a.messages[j].left-4,a.messages[j].y+(scene.compact?13:15)]])});}
    }
    for(let i=0;i<a.messages.length;i++){
      const m=a.messages[i],f=r.messages[i],isTransfer=transfer?.actor===i;
      const incoming=isTransfer&&allocating&&transfer.p>=.3,outgoing=isTransfer&&returning;
      const p=incoming?allocationP:outgoing?returnP:0;
      const alloc=a.allocations[i],ret=a.returns[i],extras=a.study[i];
      set(alloc.carrier,{opacity:0});set(ret.carrier,{opacity:0});set(alloc.trace,{opacity:0});set(ret.trace,{opacity:0});
      set(extras.token,{opacity:0});set(extras.tokenClip,{x:-30,y:-13,width:60,height:26});
      set(extras.ribbon,{opacity:0});set(extras.arrow,{opacity:0});
      set(extras.outline,{opacity:0});set(extras.front,{opacity:0});
      set(extras.msgClip,{x:m.x-6,y:m.y,width:m.w+12,height:m.h});
      set(m.group,{opacity:f.live?1:0,transform:'translate(0 0)','clip-path':`url(#${extras.msgClipPath})`});
      if(incoming||outgoing){
        const destinationY=scene.style==='slot'?m.y+(scene.compact?13:15):m.dataCy;
        const points=scene.style==='slot'?studySlotPoints(a,m,pool.right+3,m.left-3,scene.compact):scene.cutCorners([[pool.right+3,pool.cy],[a.allocationTrunk.rawPoints[1][0],pool.cy],[a.allocationTrunk.rawPoints[1][0],destinationY],[m.left-3,destinationY]]);
        const beam=studyBeam(outgoing?[...points].reverse():points);
        // The allocation rail expresses ownership; queue Copy stays unchanged.
        const signalT=scene.style==='slot'?studyRange(p,.12,.76):incoming?studyRange(p,.12,.55):studyRange(p,.4,.84);
        const signalVisible=scene.style==='slot'?p>.12&&p<.78:incoming?p>.12&&p<.62:p>.4&&p<.91;
        const end=reusePoint(beam,signalT),start=reusePoint(beam,Math.max(0,signalT-1/beam.length));
        const dx=end[0]-start[0],dy=end[1]-start[1],angle=Math.atan2(dy,dx)*180/Math.PI;
        set(extras.ribbon,{opacity:signalVisible?.9:0,d:pathSlice(beam,Math.max(0,signalT-48/beam.length),signalT)});
        set(extras.arrow,{opacity:signalVisible?1:0,transform:`translate(${end.join(' ')}) rotate(${angle})`});
        if(scene.style==='slot'){
          // Fixed-size labeled lease: no shrinking lettering along the narrow bus.
          const route=studyBeam(studySlotPoints(a,m,pool.cx,m.x+35,scene.compact));
          const t=incoming?studyRange(p,.05,.76):1-studyRange(p,.22,.92),point=reusePoint(route,t);
          // Header text has identical size, baseline and position at hand-off.
          const handoff=incoming?studyRange(p,.76,.9):studyRange(p,.06,.22);
          const tokenVisible=incoming?p<.9:p>.06&&p<1;
          const alpha=incoming?studyRange(p,0,.08)*(1-handoff):handoff*(1-studyRange(p,.92,1));
          set(extras.token,{opacity:tokenVisible?alpha:0,transform:`translate(${point[0]} ${point[1]})`});
          // The full buffer occupies its final bounds throughout the hand-off.
          set(m.group,{opacity:incoming?handoff:1-handoff});
          set(pool.card,{opacity:incoming?1-studyRange(p,0,.16):studyRange(p,.86,1)});
          set(pool.slotFill,{opacity:.16});
        }else if(scene.style==='gate'){
          const opened=incoming?studyRange(p,.02,.18)*(1-studyRange(p,.62,.82)):studyRange(p,.45,.62)*(1-studyRange(p,.85,1));
          set(pool.gateLeft,{transform:`translate(${-9*opened} 0)`});set(pool.gateRight,{transform:`translate(${9*opened} 0)`});
          const reveal=incoming?studyRange(p,.48,.88):1-studyRange(p,.02,.4);
          set(extras.msgClip,{x:m.x-6,y:m.y,width:(m.w+12)*reveal,height:m.h});
          set(m.group,{opacity:1});
          const frontX=m.x-6+(m.w+12)*reveal;
          set(extras.front,{opacity:reveal>.01&&reveal<.99?1:0,d:`M${frontX} ${m.y}L${frontX} ${m.bottom}`});
          set(pool.slotActive,{opacity:opened});
          set(pool.card,{opacity:incoming?1-studyRange(p,.15,.3):studyRange(p,.85,1)});
        }else{
          // Pool tray and full-size buffer use matching short, vertical strokes.
          const lift=incoming?studyRange(p,.02,.22)*(1-studyRange(p,.8,1)):studyRange(p,.65,.83)*(1-studyRange(p,.84,1));
          set(pool.card,{opacity:incoming?1-studyRange(p,.22,.4):studyRange(p,.65,.85),transform:`translate(0 ${-9*lift})`});
          const reveal=incoming?studyRange(p,.52,.91):1-studyRange(p,.02,.4);
          set(extras.msgClip,{x:m.x-6,y:m.y,width:m.w+12,height:m.h*reveal});
          set(m.group,{opacity:1,transform:`translate(0 ${incoming?8*(1-reveal):-8*(1-reveal)})`});
          const frontY=m.y+m.h*reveal+(incoming?8*(1-reveal):-8*(1-reveal));
          set(extras.front,{opacity:reveal>.01&&reveal<.99?1:0,d:`M${m.x} ${frontY}L${m.right} ${frontY}`});
          set(pool.slotActive,{opacity:lift});
        }
        if(incoming){set(m.content,{opacity:0});if(row===1)set(m.ref,{opacity:1,transform:'translate(0 0)'},'Ref 1');}
        if(outgoing){
          // Serialized bytes remain in the three SendQs after the source is freed.
          set(m.content,{opacity:1-studyRange(p,0,.12)});set(m.rim,{opacity:0});
          if(row===1)set(m.ref,{opacity:1,transform:'translate(0 0)'},'Ref 0');
        }
      }
    }
  }
}
