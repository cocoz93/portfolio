  function contact(x,y,side,parent) {
    const horizontal=side==="left"||side==="right";
    return rect(x+(side==="left"?-7:horizontal?-1:-3),y+(horizontal?-3:side==="top"?-7:-1),horizontal?8:6,horizontal?6:8,{fill:"var(--pcb-pin)","data-role":"contact-pad"},parent);
  }
  function drawRow(index,offset,width,mobile) {
    const parent=node("g",{"data-role":"animation-row","data-row":index},scene),after=index===1;
    const row={index,parent,msgs:[],slots:[],slotLabels:[],outgoing:[]};
    const mapW=mobile?128:146,msgW=112,msgH=28,msgGap=34,r=58,inner=34,reqW=108,reqH=120;
    const gap=(width-48-mapW-msgW-2*r-reqW)/3;
    const map={x:24,y:offset+(mobile?60:67),w:mapW,h:mapW};
    const msgX=mobile?width-24-msgW:map.x+mapW+gap;
    const cy=offset+(mobile?292:140),cx=mobile?82:msgX+msgW+gap+r;
    const reqX=mobile?width-24-reqW:cx+r+gap,reqY=cy-reqH/2;
    const msgY=offset+(mobile?60:75),msgCenters=Array.from({length:4},(_,i)=>msgY+i*msgGap+msgH/2);
    const padding=10,innerX=map.x+padding,innerY=map.y+padding,iw=map.w-2*padding,ih=map.h-2*padding;
    row.points=[{x:innerX+iw/4,y:innerY+ih/4},{x:innerX+iw*3/4,y:innerY+ih/4},{x:innerX+iw*3/4,y:innerY+ih*3/4},{x:innerX+iw/4,y:innerY+ih*3/4}];
    textAt(after?"변경 후":"변경 전",24,offset+18,14,after?"pcb-accent pcb-row-label":"pcb-muted pcb-row-label",parent,"start");
    textAt("캐릭터 이동",map.x+map.w/2,offset+44,12,"pcb-muted",parent);
    textAt("이동 메시지",msgX+msgW/2,offset+44,12,"pcb-muted",parent);
    textAt("SendQ",mobile?cx-10:cx,mobile?offset+216:offset+44,12,"pcb-muted pcb-mono",parent,mobile?"end":"middle");
    textAt("WSASend",reqX+reqW/2,mobile?offset+216:offset+44,12,"pcb-muted pcb-mono",parent);
    rect(map.x,map.y,map.w,map.h,{fill:"var(--pcb-bg)",stroke:"var(--pcb-edge)","stroke-width":1.8},parent);
    line(`M${innerX+iw/2} ${innerY} V${innerY+ih} M${innerX} ${innerY+ih/2} H${innerX+iw}`,{stroke:"var(--pcb-edge)",opacity:.35},parent);
    const routeR=10,ps=row.points;
    for(let i=0;i<4;i++){
      const a=ps[i],b=ps[(i+1)%4],dx=Math.sign(b.x-a.x),dy=Math.sign(b.y-a.y);
      const sx=a.x+dx*18,sy=a.y+dy*18,ex=b.x-dx*18,ey=b.y-dy*18;
      line(`M${sx} ${sy} L${ex} ${ey}`,{opacity:.7},parent);
      const points=dx===1?`${ex-4},${ey-3} ${ex},${ey} ${ex-4},${ey+3}`:dx===-1?`${ex+4},${ey-3} ${ex},${ey} ${ex+4},${ey+3}`:dy===1?`${ex-3},${ey-4} ${ex},${ey} ${ex+3},${ey-4}`:`${ex-3},${ey+4} ${ex},${ey} ${ex+3},${ey+4}`;
      node("polyline",{points,fill:"none",stroke:"var(--pcb-track)","stroke-width":1.8,opacity:.7},parent);
    }
    row.waypoints=ps.map((p,i)=>{
      const g=node("g",{},parent);
      node("circle",{cx:p.x,cy:p.y,r:routeR,fill:"var(--pcb-bg)",stroke:"var(--pcb-muted)","stroke-width":1.8},g);
      textAt(String(i+1),p.x,p.y,12,"pcb-number pcb-muted",g);
      return g;
    });
    row.character=makeSprite(parent,mobile?34:38);
    row.character.sprite.setAttribute("data-role","character");
    row.character.sprite.setAttribute("data-row",index);
    row.characterLabel=textAt("4",0,0,12,"pcb-accent pcb-mono",parent);
    row.input=[];row.toQueue=[];
    const inputRail=mobile?(map.x+map.w+msgX)/2:msgX-22,outputRail=mobile?width-16:msgX+msgW+22;
    contact(map.x+map.w,mobile?map.y+map.h/2:cy,"right",parent);
    for(let i=0;i<4;i++){
      const y=msgY+i*msgGap;
      const dIn=`M${map.x+map.w} ${mobile?map.y+map.h/2:cy} H${inputRail} V${msgCenters[i]} H${msgX-7}`;
      const input=trace(dIn,parent,{label:String(i+1)});
      input.beam.setAttribute("data-role","input-transfer");input.beam.setAttribute("data-row",index);input.beam.setAttribute("data-message",i);
      row.input.push(input);
      contact(msgX,msgCenters[i],"left",parent);contact(msgX+msgW,msgCenters[i],"right",parent);
      const body=rect(msgX,y,msgW,msgH,{fill:"var(--pcb-surface)","stroke-width":0},parent);
      const clipId=`wsasend-bus-msg-clip-${index}-${i}`,clip=node("clipPath",{id:clipId},svg.querySelector("defs"));
      rect(msgX+1,y+1,msgW-2,msgH-2,{},clip);
      const fill=rect(msgX+1,y+1,0,msgH-2,{fill:"var(--pcb-active)","clip-path":`url(#${clipId})`,"data-role":"message-fill","data-row":index,"data-message":i},parent);
      const frames=[line(`M${msgX} ${y} H${msgX+msgW}`,{stroke:"var(--pcb-edge)"},parent),line(`M${msgX} ${y+msgH} H${msgX+msgW}`,{stroke:"var(--pcb-edge)"},parent)];
      const label=textAt(`Msg ${i+1}`,msgX+msgW/2,msgCenters[i],13,"pcb-mono",parent);
      const inkClipId=clipId+"-ink",inkClip=node("clipPath",{id:inkClipId},svg.querySelector("defs"));
      const mask=rect(msgX+1,y+1,0,msgH-2,{},inkClip);
      const inkLabel=textAt(label.textContent,msgX+msgW/2,msgCenters[i],13,"pcb-mono",parent);
      inkLabel.style.fill="var(--pcb-bg)";inkLabel.setAttribute("clip-path",`url(#${inkClipId})`);
      row.msgs.push({body,fill,label,inkLabel,mask,frames,y,w:msgW,h:msgH});
      const dOut=mobile?`M${msgX+msgW+7} ${msgCenters[i]} H${outputRail} V${offset+202} H${cx} V${cy-r-7}`:`M${msgX+msgW+7} ${msgCenters[i]} H${outputRail} V${cy} H${cx-r-7}`;
      const queue=arrow(dOut,mobile?cx:cx-r-7,mobile?cy-r-7:cy,mobile?"down":"right",parent,{label:String(i+1)});
      queue.beam.setAttribute("data-role","queue-transfer");queue.beam.setAttribute("data-row",index);queue.beam.setAttribute("data-message",i);
      row.toQueue.push(queue);
    }
    const junctions=mobile?[[inputRail,map.y+map.h/2],[outputRail,msgCenters[1]],[outputRail,msgCenters[2]]]:[[inputRail,cy],[outputRail,cy]];
    for(const [x,y] of junctions)rect(x-2,y-2,4,4,{fill:"var(--pcb-track)","data-role":"junction-pad"},parent);
    contact(mobile?cx:cx-r,mobile?cy-r:cy,mobile?"top":"left",parent);
    for(let i=0;i<8;i++){
      const a=-180+i*45+1.5,b=a+42;
      const slot=node("path",{d:ringPath(cx,cy,r,inner,a,b),fill:"var(--pcb-empty)",stroke:"var(--pcb-edge)","stroke-width":1.8,"data-role":"queue-slot","data-row":index},parent);
      row.slots.push(slot);
      if(i<4){
        const p=polar(cx,cy,(r+inner)/2,-180+i*45+22.5),label=textAt(String(i+1),p[0],p[1],12,"pcb-mono",parent);
        label.style.fill="var(--pcb-bg)";label.setAttribute("opacity",0);label.setAttribute("data-role","queue-slot-number");label.setAttribute("data-row",index);
        row.slotLabels.push(label);
      }
    }
    row.queueTitle=textAt(after?"누적":"즉시",cx,cy-5,17,"pcb-emphasis",parent);
    row.queueSub=textAt("0개 대기",cx,cy+18,12,"pcb-muted",parent);
    row.queueSub.setAttribute("data-role","queue-pending");row.queueSub.setAttribute("data-row",index);
    row.reqBody=rect(reqX,reqY,reqW,reqH,{fill:"var(--pcb-surface)","stroke-width":0},parent);
    row.reqFrames=[line(`M${reqX} ${reqY} H${reqX+reqW}`,{stroke:"var(--pcb-edge)"},parent),line(`M${reqX} ${reqY+reqH} H${reqX+reqW}`,{stroke:"var(--pcb-edge)"},parent)];
    rect(reqX+1,reqY+3,2,reqH-6,{fill:"var(--pcb-edge)"},parent);
    row.reqPrevious=textAt("0",reqX+reqW/2-5,cy-5,58,`pcb-mono pcb-number pcb-count ${after?"pcb-accent":""}`,parent);
    row.reqPrevious.setAttribute("opacity",0);row.reqPrevious.setAttribute("data-role","previous-request-count");row.reqPrevious.setAttribute("data-row",index);
    row.reqCount=textAt("0",reqX+reqW/2-5,cy-5,58,`pcb-mono pcb-number pcb-count ${after?"pcb-accent":""}`,parent);
    row.reqCount.setAttribute("data-role","request-count");row.reqCount.setAttribute("data-row",index);
    textAt("회",reqX+reqW-14,cy+10,11,"pcb-muted",parent);
    row.reqSub=textAt(after?"틱 끝 호출":"개별 호출",reqX+reqW/2,reqY+reqH-18,12,"pcb-muted",parent);
    for(let i=0;i<(after?1:4);i++){
      const oy=cy+(after?0:(i-1.5)*14),ox=cx+r+6,ex=reqX-8;
      contact(reqX,oy,"left",parent);
      const outgoing=arrow(`M${ox} ${oy} H${ex}`,ex,oy,"right",parent,{label:after?"":String(i+1),items:after?4:1});
      outgoing.beam.setAttribute("data-role","send-transfer");outgoing.beam.setAttribute("data-row",index);outgoing.beam.setAttribute("data-message",i);
      row.outgoing.push(outgoing);
    }
    const tickX=(cx+r+reqX)/2,tickY=cy-26;
    row.tickGroup=node("g",{opacity:after?1:0},parent);
    if(after){
      rect(tickX-18,tickY-10,36,20,{fill:"var(--pcb-bg)",stroke:"var(--pcb-edge)","stroke-width":1.8},row.tickGroup);
      row.tickLabel=textAt("틱 끝",tickX,tickY,11,"pcb-muted",row.tickGroup);
    }
    return row;
  }
  function draw() {
    const width=Math.max(300,root.getBoundingClientRect().width);
    if(Math.abs(width-lastWidth)<.5&&scene)return;
    lastWidth=width;
    const preview=svg.querySelector("#wsasend-bus-static-preview");if(preview)preview.remove();
    if(scene)scene.remove();
    const previousDefs=svg.querySelector("defs");if(previousDefs)previousDefs.remove();
    const defs=node("defs",{},svg),pattern=node("pattern",{id:"wsasend-bus-grid",width:24,height:24,patternUnits:"userSpaceOnUse"},defs);
    line("M0 12 H24",{stroke:"var(--pcb-edge)","stroke-width":.45,opacity:.15},pattern);
    scene=node("g",{},svg);
    mode=width<660?"mobile":"desktop";
    const mobile=mode==="mobile",h=mobile?772:476;
    svg.setAttribute("viewBox",`0 0 ${width} ${h}`);svg.setAttribute("width",width);svg.setAttribute("height",h);
    rect(0,0,width,h,{fill:"var(--pcb-bg)"},scene);rect(0,0,width,h,{fill:"url(#wsasend-bus-grid)"},scene);
    rows=[drawRow(0,0,width,mobile),drawRow(1,mobile?396:238,width,mobile)];
    line(`M24 ${mobile?380:228} H${width-24}`,{stroke:"var(--pcb-edge)",opacity:.65},scene);
    paint();
  }
