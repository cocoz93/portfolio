
(() => {
  const root = document.getElementById("wsasend-bus-v1");
  const svg = root.querySelector(".pcb-board");
  const playButton = root.querySelector(".pcb-play");
  const replayButton = root.querySelector(".pcb-replay");
  const status = root.querySelector(".pcb-status");
  const NS = "http://www.w3.org/2000/svg";
  const KIND = "wsasend-bus-animation-v1";
  const M = Object.freeze({main:400,state:200,hold:160,rest:100,result:1200});
  const T = Object.freeze((() => {
    const start=M.main,move=M.main,inputEnd=move+M.main,msgEnd=inputEnd+M.main;
    const queueStart=msgEnd+M.hold,queueOn=queueStart+M.main;
    const sendStart=queueOn+M.state,call=sendStart+M.main;
    const period=call+M.state+M.rest,periodAfter=queueOn+M.state+M.rest;
    const tick=start+4*periodAfter,batchCall=tick+M.main;
    const switchStart=start+3*period+call+M.state+M.main,afterStart=switchStart+M.main;
    const compareStart=afterStart+batchCall+M.state,compareEnd=compareStart+M.main;
    const end=compareEnd+M.result;
    return {start,period,periodAfter,move,inputEnd,msgEnd,queueStart,queueOn,sendStart,call,tick,batchCall,switchStart,afterStart,compareStart,compareEnd,end};
  })());
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let time = 0, playing = !reduced.matches, lastFrame = 0, raf = 0;
  let rows = [], scene = null, lastWidth = 0, mode = "desktop";
  const clamp = (n, low=0, high=1) => Math.min(high, Math.max(low,n));
  const smooth = t => t*t*(3-2*t);
  function motionProgress(elapsed,duration=M.main) {
    const p=clamp(elapsed/duration);
    return reduced.matches?(p>=1?1:0):smooth(p);
  }
  function blendColor(on,off,amount) {
    const p=clamp(amount);
    if(p===0)return off;
    if(p===1)return on;
    return `color-mix(in srgb, ${on} ${p*100}%, ${off})`;
  }
  function node(tag, attrs={}, parent=scene) {
    const el = document.createElementNS(NS,tag);
    for (const [k,v] of Object.entries(attrs)) el.setAttribute(k,String(v));
    parent.appendChild(el);
    return el;
  }
  function textAt(label,x,y,size=30,cls="",parent=scene,anchor="middle") {
    const el = node("text",{x,y,"font-size":size,"text-anchor":anchor,"dominant-baseline":"middle",class:cls},parent);
    el.textContent=label; return el;
  }
  function rect(x,y,width,height,attrs={},parent=scene) {
    return node("rect",{x,y,width,height,...attrs},parent);
  }
  function line(d,attrs={},parent=scene) {
    return node("path",{d,fill:"none",stroke:"var(--pcb-track)","stroke-width":1.8,"stroke-linejoin":"miter","stroke-linecap":"butt",...attrs},parent);
  }
  function trace(d,parent,{label="",items=1}={}) {
    line(d,{opacity:.6},parent);
    const history=line(d,{stroke:"var(--pcb-active)",opacity:0},parent);
    const beam=line(d,{stroke:"var(--pcb-active)",opacity:0},parent);
    const head=node("g",{opacity:0,"data-role":"message-signal","data-items":items},parent);
    let ink=null;
    if(items===1){
      rect(-10,-10,20,20,{rx:0,fill:"var(--pcb-active)"},head);
      ink=textAt(label,0,1,12,"pcb-mono pcb-number",head);
      ink.style.fill="var(--pcb-bg)";
      node("path",{d:"M11 -3 L15 0 L11 3 Z",fill:"var(--pcb-active)"},head);
    }else{
      rect(-14,-10,28,20,{rx:0,fill:"var(--pcb-bg)",stroke:"var(--pcb-active)","stroke-width":1.8},head);
      for(let i=0;i<4;i++)rect(-10+i*6,-6,4,12,{fill:"var(--pcb-active)","data-role":"batch-message"},head);
      node("path",{d:"M15 -3 L19 0 L15 3 Z",fill:"var(--pcb-active)"},head);
    }
    return {beam,head,history,ink,length:beam.getTotalLength()};
  }
  function setTrace(ref,elapsed,duration=M.main,restingOpacity=0) {
    const progress=motionProgress(elapsed,duration);
    const enter=motionProgress(elapsed,M.state);
    const leave=motionProgress(elapsed-duration,M.state);
    const opacity=enter*(1-leave),distance=ref.length*progress;
    const tail=Math.min(24,ref.length);
    ref.beam.setAttribute("opacity",opacity);
    ref.beam.setAttribute("data-motion-progress",progress);
    ref.beam.setAttribute("stroke-dasharray",tail+" "+(ref.length+tail+1));
    ref.beam.setAttribute("stroke-dashoffset",tail-distance);
    ref.history.setAttribute("opacity",restingOpacity*leave);
    ref.head.setAttribute("opacity",opacity);
    ref.head.setAttribute("data-transfer",ref.beam.getAttribute("data-role"));
    ref.head.setAttribute("data-row",ref.beam.getAttribute("data-row"));
    ref.head.setAttribute("data-message",ref.beam.getAttribute("data-message"));
    ref.head.setAttribute("data-motion-progress",progress);
    ref.head.setAttribute("data-path-distance",distance);
    const point=ref.beam.getPointAtLength(distance);
    const before=ref.beam.getPointAtLength(Math.max(0,distance-.1));
    const next=ref.beam.getPointAtLength(Math.min(ref.length,distance+.1));
    const dx=next.x-before.x,dy=next.y-before.y;
    const angle=Math.abs(dx)>=Math.abs(dy)?(dx<0?180:0):(dy<0?-90:90);
    ref.head.setAttribute("transform","translate("+point.x+","+point.y+") rotate("+angle+")");
    if(ref.ink)ref.ink.setAttribute("transform","rotate("+(-angle)+")");
    if(ref.tip){
      const arrival=motionProgress(elapsed-duration+M.state,M.state);
      ref.tip.setAttribute("stroke",blendColor("var(--pcb-active)","var(--pcb-track)",arrival*(1-(1-restingOpacity)*leave)));
    }
  }
  function arrow(d,endX,endY,direction,parent,signal={}) {
    const tr=trace(d,parent,signal), s=4;
    const points=direction==="down"?[[endX-s,endY-s*1.3],[endX,endY],[endX+s,endY-s*1.3]]:[[endX-s*1.3,endY-s],[endX,endY],[endX-s*1.3,endY+s]];
    const tip=node("polyline",{points:points.map(p=>p.join(",")).join(" "),fill:"none",stroke:"var(--pcb-track)","stroke-width":1.8},parent);
    parent.insertBefore(tip,tr.head);
    return {...tr,tip};
  }
  function pin(x,y,w,h,parent) {rect(x,y,w,h,{fill:"var(--pcb-pin)",opacity:.55},parent);}
  function chipPins(x,y,w,h,parent,scale=1) {
    for(let j=0;j<4;j++){
      pin(x-14*scale,y+(30+j*42)*scale,9*scale,7*scale,parent);
      pin(x+w+5*scale,y+(30+j*42)*scale,9*scale,7*scale,parent);
    }
    for(let j=0;j<4;j++){
      pin(x+(34+j*43)*scale,y-14*scale,7*scale,9*scale,parent);
      pin(x+(34+j*43)*scale,y+h+5*scale,7*scale,9*scale,parent);
    }
  }
  function polar(cx,cy,r,degrees) {
    const a=degrees*Math.PI/180;return [cx+Math.cos(a)*r,cy+Math.sin(a)*r];
  }
  function ringPath(cx,cy,outer,inner,a,b) {
    const p1=polar(cx,cy,outer,a),p2=polar(cx,cy,outer,b),p3=polar(cx,cy,inner,b),p4=polar(cx,cy,inner,a);
    return `M${p1.join(",")} A${outer},${outer} 0 0 1 ${p2.join(",")} L${p3.join(",")} A${inner},${inner} 0 0 0 ${p4.join(",")} Z`;
  }
  function makeSprite(parent,size) {
    const sprite=node("g",{"shape-rendering":"crispEdges","data-character":"mage","role":"img","aria-label":"로브 마법사"},parent);
    const palette={o:"var(--pcb-char-ink)",l:"var(--pcb-char-steel)",m:"var(--pcb-char-steel)",d:"var(--pcb-char-steel-dark)",a:"var(--pcb-active)",b:"var(--pcb-active)",c:"var(--pcb-char-blue-mid)",v:"var(--pcb-char-blue-dark)",s:"var(--pcb-char-skin)",t:"var(--pcb-char-skin-dark)"};
    const pixels=["                                ","                   oooo         ","                  occvo         ","                 occvvo         ","                occcvoo         ","    oo         occcvvo          ","   oooo       occcvvvo          ","  ooacoo     occcvvvvv          ","  oalacoo    occcvvvvao         ","  oalaaco   occcvvvvaaao        ","  ocaacco   occcvvvvvavvo       ","  occccoo  occcvvvvvvvvvo       ","   occoo oobbbbbbbbbbbbbboooo   ","    oooooocccccccccccccccccco   ","    ooo oooooooooooooooooooooo  ","    omo    ooosssssssstoo       ","    omo    ooosoossssoooo       ","    ddo    ooottttttttto        ","    omo     omlmttmmmllm        ","    omo     ommlldddlllmo       ","    omo   oooomlllmmllmooo      ","    omoocccooomlllllllmvooo     ","    omssccccovmmllllllmvcco     ","    omssccccovcmlllllmmocco     ","    omooccooovcmmlllmmvoccoo    ","    omooooooovccmmlmmvvooss     ","    omo  ooooccccmmbavvvoo      ","    omo   oovbccccvbavvvvoo     ","    omo   oovbccccvbavvvvoo     ","    omo  oovvbccccvbavvvvvoo    ","    omo  oovcbccccvbavvvvvoo    ","    omo oovccccccccccccccccoo   ","    omo oooddddddddddddddddo    ","    omo  oooooooooooooooooo     ","    ooo     ddddo    odddd      ","                                "];
    const unit=size/32;
    const footL=node("g",{"data-role":"mage-foot-left"},sprite);
    const footR=node("g",{"data-role":"mage-foot-right"},sprite);
    function layer(x,y) {
      if(y>=33&&x>=12&&x<16)return footL;
      if(y>=33&&x>=21&&x<25)return footR;
      return sprite;
    }
    pixels.forEach((row,y)=>{
      let x=0;
      while(x<32){
        const c=row[x],parentLayer=layer(x,y);
        let end=x+1;
        while(end<32&&row[end]===c&&layer(end,y)===parentLayer)end++;
        if(palette[c])rect((x-16)*unit,(y-20)*unit,(end-x)*unit,unit,{fill:palette[c],...(y===16&&(x===15||x===21)?{"data-role":"mage-eye"}:{})},parentLayer);
        x=end;
      }
    });
    return {sprite,footL,footR,unit};
  }
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

  function rowModel(at,after) {
    const period=after?T.periodAfter:T.period;
    const current=clamp(Math.floor((at-T.start)/period),-1,3);
    const local=current<0?-1:at-T.start-current*period;
    let generated=0,queued=0,individualCalls=0;
    for(let i=0;i<4;i++){
      const elapsed=at-T.start-i*period;
      if(elapsed>=T.inputEnd)generated++;
      if(elapsed>=T.queueOn)queued++;
      if(elapsed>=T.call)individualCalls++;
    }
    const calls=after?(at>=T.batchCall?1:0):individualCalls;
    const pending=after?(calls>0?0:queued):queued-calls;
    return {time:at,current,local,generated,queued,calls,pending,period,tickEnd:after&&at>=T.tick};
  }
  function model(at=time) {
    const before=rowModel(Math.min(at,T.switchStart),false);
    const after=rowModel(Math.max(0,at-T.afterStart),true);
    const focusAfter=motionProgress(at-T.switchStart,M.main);
    const compareProgress=motionProgress(at-T.compareStart,M.main);
    const activeRow=at>=T.compareStart?"comparison":at<T.switchStart?"before":at<T.afterStart?"transition":"after";
    const focused=activeRow==="after"?after:before;
    const prefix=activeRow==="after"?"변경 후":"변경 전";
    let phase=prefix+" · 이동 준비";
    if(at>=T.compareStart)phase="완료 · 같은 메시지 · 호출 4회 → 1회";
    else if(at>=T.afterStart+T.batchCall)phase="변경 후 · 호출 1회";
    else if(activeRow==="transition")phase="변경 후 · 이동 준비";
    else if(activeRow==="after"&&after.tickEnd)phase="변경 후 · 틱 끝 · 모은 메시지 송신";
    else if(activeRow==="before"&&before.calls===4)phase="변경 전 · 호출 4회";
    else if(focused.current>=0) {
      const n=focused.current+1,local=focused.local;
      if(local<T.move)phase=prefix+` · 이동 ${n} · 한 칸 이동`;
      else if(local<T.inputEnd)phase=prefix+` · 이동 ${n} · Msg로 전달`;
      else if(local<T.queueStart)phase=prefix+` · 이동 ${n} · Msg 생성`;
      else if(local<T.queueOn)phase=prefix+` · 이동 ${n} · SendQ로 전달`;
      else if(activeRow==="after")phase=prefix+` · 이동 ${n} · 큐에 보관`;
      else if(local<T.sendStart)phase=prefix+` · 이동 ${n} · SendQ 대기`;
      else if(local<T.call)phase=prefix+` · 이동 ${n} · 즉시 송신`;
      else phase=prefix+` · 이동 ${n} · 호출 ${focused.calls}회`;
    }
    return {time:at,before,after,activeRow,focusAfter,compareProgress,callsBefore:before.calls,callsAfter:after.calls,pendingBefore:before.pending,pendingAfter:after.pending,phase,playing,mode};
  }
  function paint() {
    if(!rows.length)return;
    const globalState=model();
    for(const row of rows){
      const after=row.index===1;
      const state=after?globalState.after:globalState.before;
      const rowTime=state.time,period=state.period;
      const {current,local}=state;
      const moving=current>=0&&local>=0&&local<T.move;
      const amount=after?globalState.focusAfter:Math.max(1-globalState.focusAfter,globalState.compareProgress);
      row.parent.setAttribute("opacity",.32+.68*amount);
      row.parent.style.filter=`grayscale(${1-amount})`;
      row.parent.setAttribute("data-active",globalState.activeRow==="comparison"||globalState.activeRow===(after?"after":"before")?"true":"false");
      const from=current<0?3:(current+3)%4,to=current<0?3:current;
      const start=row.points[from],end=row.points[to];
      const progress=motionProgress(local,T.move);
      const x=start.x+(end.x-start.x)*progress,y=start.y+(end.y-start.y)*progress;
      row.character.sprite.setAttribute("transform",`translate(${x},${y})`);
      row.character.sprite.setAttribute("data-motion-progress",progress);
      const walk=moving&&!reduced.matches?Math.sin(progress*Math.PI*2)*row.character.unit*.6:0;
      row.character.footL.setAttribute("transform","translate(0,"+walk+")");
      row.character.footR.setAttribute("transform","translate(0,"+(-walk)+")");
      row.waypoints.forEach((g,i)=>{
        let opacity=1;
        if(current<0&&i===3)opacity=0;
        else if(current>=0&&i===from)opacity=motionProgress(local,M.state);
        else if(current>=0&&i===to)opacity=1-motionProgress(local-(T.move-M.state),M.state);
        g.setAttribute("opacity",opacity);
      });
      row.characterLabel.setAttribute("x",x+22);
      row.characterLabel.setAttribute("y",y-18);
      row.characterLabel.textContent=String(current<0?4:current+1);
      for(let i=0;i<4;i++){
        const t=rowTime-T.start-i*period;
        const fill=motionProgress(t-T.inputEnd,M.main);
        const emphasis=motionProgress(t-T.inputEnd,M.state)*(1-motionProgress(t-T.queueStart,M.state));
        const msg=row.msgs[i];
        msg.fill.setAttribute("width",(msg.w-2)*fill);
        msg.fill.setAttribute("opacity",.14+.86*emphasis);
        msg.body.setAttribute("stroke",blendColor("var(--pcb-active)","var(--pcb-edge)",emphasis));
        msg.frames.forEach(frame=>frame.setAttribute("stroke",blendColor("var(--pcb-active)","var(--pcb-edge)",emphasis)));
        msg.label.style.fill="var(--pcb-text)";
        msg.mask.setAttribute("width",(msg.w-2)*fill);
        msg.inkLabel.setAttribute("opacity",emphasis);
        setTrace(row.input[i],t-T.move,M.main);
        setTrace(row.toQueue[i],t-T.queueStart,M.main);
      }
            const activeIndices=after?Array.from({length:state.pending},(_,i)=>i):state.pending>0?[state.queued-1]:[];
      row.slots.forEach((slot,i)=>{
        const enter=motionProgress(rowTime-T.start-i*period-T.queueOn,M.state);
        const leave=1-motionProgress(after?rowTime-T.batchCall:rowTime-T.start-i*period-T.call,M.state);
        const level=i<4?enter*leave:0;
        slot.setAttribute("fill",blendColor("var(--pcb-active)","var(--pcb-empty)",level));
        slot.setAttribute("stroke",blendColor("var(--pcb-active)","var(--pcb-edge)",level));
        slot.setAttribute("data-light-level",level);
        slot.setAttribute("data-selected",activeIndices.includes(i)?"true":"false");
        if(i<4)row.slotLabels[i].setAttribute("opacity",level);
      });
      row.queueTitle.textContent=after?"누적":"즉시";
      row.queueSub.textContent=`${state.pending}개 대기`;
      const callTime=after?T.batchCall:T.start+Math.max(0,state.calls-1)*T.period+T.call;
      const numberBlend=state.calls>0?motionProgress(rowTime-callTime,M.state):1;
      row.reqCount.textContent=String(state.calls);
      row.reqCount.setAttribute("opacity",numberBlend);
      row.reqPrevious.textContent=String(Math.max(0,state.calls-1));
      row.reqPrevious.setAttribute("opacity",state.calls>0?1-numberBlend:0);
      const callLight=state.calls===0?0:after?numberBlend:numberBlend*(1-motionProgress(rowTime-callTime-M.state,M.state));
      row.reqBody.setAttribute("stroke",blendColor("var(--pcb-active)","var(--pcb-edge)",callLight));
      row.reqFrames.forEach(frame=>frame.setAttribute("stroke",blendColor("var(--pcb-active)","var(--pcb-edge)",callLight)));
      row.reqBody.setAttribute("fill",blendColor("var(--pcb-active)","var(--pcb-surface)",callLight*.16));
      if(after){
        const tickLight=motionProgress(rowTime-T.tick,M.state);
        row.tickLabel.style.fill=blendColor("var(--pcb-active)","var(--pcb-muted)",tickLight);
        row.tickGroup.querySelector("rect").setAttribute("stroke",blendColor("var(--pcb-active)","var(--pcb-edge)",tickLight));
        setTrace(row.outgoing[0],rowTime-T.tick,M.main,1);
      }else{
        for(let i=0;i<4;i++)setTrace(row.outgoing[i],rowTime-T.start-i*period-T.sendStart,M.main,.25);
      }
    }
    if(status.textContent!==globalState.phase)status.textContent=globalState.phase;
    const label=playing?"일시정지":"재생";
    if(playButton.textContent!==label)playButton.textContent=label;
    playButton.setAttribute("aria-label",playing?"애니메이션 일시정지":time>=T.end?"애니메이션 다시 재생":"애니메이션 재생");
  }
  function saveState() {
    if(!window.openai?.setWidgetState)return;
    const state=model();
    window.openai.setWidgetState({modelContent:{kind:KIND,activeRow:state.activeRow,phase:state.phase,callsBefore:state.callsBefore,callsAfter:state.callsAfter},privateContent:{kind:KIND,time,playing}}).catch(()=>{});
  }
  function restore(snapshot) {
    const state=snapshot?.privateContent;
    if(state?.kind!==KIND||!Number.isFinite(state.time))return;
    time=clamp(state.time,0,T.end);playing=Boolean(state.playing)&&time<T.end&&!reduced.matches;
    lastFrame=0;paint();schedule();
  }
  function frame(now) {
    raf=0;
    if(!playing)return;
    if(lastFrame)time=Math.min(T.end,time+Math.min(now-lastFrame,100));
    lastFrame=now;
    if(time>=T.end){playing=false;lastFrame=0;}
    paint();schedule();
  }
  function schedule(){if(playing&&!raf)raf=requestAnimationFrame(frame);}
  function pause(){playing=false;lastFrame=0;if(raf)cancelAnimationFrame(raf);raf=0;paint();}
  function play(){if(time>=T.end)time=0;playing=true;lastFrame=0;paint();schedule();}
  function replay(){time=0;playing=true;lastFrame=0;paint();schedule();}
  playButton.addEventListener("click",()=>{playing?pause():play();saveState();});
  replayButton.addEventListener("click",()=>{replay();saveState();});
  document.addEventListener("visibilitychange",()=>{lastFrame=0;});
  window.addEventListener("openai:set_globals",event=>restore(event.detail?.globals?.widgetState));
  reduced.addEventListener("change",()=>{if(reduced.matches)pause();});
  // A single playhead runs the before scene, then the after scene; inactive scenes stay frozen.
  root.animation=Object.freeze({timings:T,motion:M,getState:()=>model(),seek(ms){pause();time=clamp(ms,0,T.end);paint();return model();},play,pause,replay});
  draw();
  new ResizeObserver(draw).observe(root);
  restore(window.openai?.widgetState);
  schedule();
})();
