function createRingBundle(width){
  width=Math.max(320,width);
  const kind='ring',compact=width<680,height=compact?818:478;
  const C={bg:'var(--pcb-bg)',surface:'var(--pcb-surface)',edge:'var(--pcb-edge)',track:'var(--pcb-track)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',active:'var(--pcb-active)',soft:'var(--pcb-soft)',empty:'var(--pcb-empty)',pin:'var(--pcb-pin)'};
  const out=[],labels=[],traces=[],actors=['A','B','C','D'],directions=['east','north','west','south'];
  const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  function tag(name,attrs,body=''){out.push(`<${name} ${Object.entries(attrs).map(([key,value])=>`${key}="${escape(value)}"`).join(' ')}>${body}</${name}>`);}
  function box(x,y,w,h,fill=C.surface,stroke=null,extra={}){tag('rect',{x,y,width:w,height:h,fill,...(stroke?{stroke,'stroke-width':1}:{}),...extra});}
  function txt(label,x,y,size=12,color=C.text,anchor='middle',mono=false,extra={}){
    labels.push({label,x,y,size,anchor});
    tag('text',{x,y,fill:color,'font-size':size,'text-anchor':anchor,'dominant-baseline':'middle',class:mono?'bundle-mono':'',...extra},escape(label));
  }
  function wire(points,color=C.track,arrow=false,opacity=1){
    for(let i=1;i<points.length;i++)if(points[i][0]!==points[i-1][0]&&points[i][1]!==points[i-1][1])throw Error('Diagonal circuit trace');
    traces.push(points);
    tag('path',{d:points.map((p,i)=>`${i?'L':'M'}${p[0]} ${p[1]}`).join(' '),fill:'none',stroke:color,'stroke-width':1.5,'stroke-linecap':'butt','stroke-linejoin':'miter',opacity});
    if(arrow){
      const [x,y]=points.at(-1),[px,py]=points.at(-2),s=3;
      const p=x!==px?`${x-Math.sign(x-px)*4},${y-s} ${x},${y} ${x-Math.sign(x-px)*4},${y+s}`:`${x-s},${y-Math.sign(y-py)*4} ${x},${y} ${x+s},${y-Math.sign(y-py)*4}`;
      tag('polyline',{points:p,fill:'none',stroke:color,'stroke-width':1.5,opacity});
    }
  }
  function pin(x,y,w=4,h=3){box(x,y,w,h,C.pin,null,{opacity:.55,'data-role':'connection-pin'});}
  function messagePins(x,y,w,h){for(let i=0;i<2;i++){const py=y+5+i*(h-13);pin(x-6,py);pin(x+w+2,py);}}
  function countPins(x,y,w,h){
    for(let i=0;i<4;i++){
      const py=y+14+i*(h-28)/3;
      pin(x-6,py);pin(x+w+2,py);
      const px=x+15+i*(w-30)/3;
      pin(px,y-6,3,4);pin(px,y+h+2,3,4);
    }
  }
  function polar(cx,cy,r,degrees){
    const angle=degrees*Math.PI/180;
    return [cx+Math.cos(angle)*r,cy+Math.sin(angle)*r];
  }
  function ringPath(cx,cy,outer,inner,a,b){
    const p1=polar(cx,cy,outer,a),p2=polar(cx,cy,outer,b),p3=polar(cx,cy,inner,b),p4=polar(cx,cy,inner,a);
    return `M${p1.join(',')} A${outer},${outer} 0 0 1 ${p2.join(',')} L${p3.join(',')} A${inner},${inner} 0 0 0 ${p4.join(',')} Z`;
  }
  function ring(cx,cy,r,after){
    const inner=r*.6;
    out.push(`<g data-role="recipient-ring" data-session="representative" data-enqueues="${after?1:4}" data-comparison="${after?'after':'before'}">`);
    for(let i=0;i<8;i++){
      const a=-180+i*45+1.3,b=a+42.4;
      if(after&&i<4)continue;
      tag('path',{d:ringPath(cx,cy,r,inner,a,b),fill:i<4?C.active:C.empty,stroke:C.edge,'stroke-width':.8,'data-role':i<4?'individual-copy-region':'empty-ring-region'});
    }
    // One continuous region represents one Copy of the new Msg, retaining all four state entries.
    if(after)tag('path',{d:ringPath(cx,cy,r,inner,-178.7,-1.3),fill:C.active,stroke:C.edge,'stroke-width':.8,'data-role':'bundle-copy-region','data-entry-count':4});
    actors.forEach((actor,i)=>{
      const [x,y]=polar(cx,cy,(r+inner)/2,-180+i*45+22.5);
      txt(actor,x,y,11,C.bg,'middle',true,{'data-role':'ring-entry','data-actor':actor});
    });
    txt(after?'묶음':'개별',cx,cy-5,14,C.text);
    txt(after?'Msg 1개':'Msg 4개',cx,cy+15,11,C.muted,'middle',true);
    out.push('</g>');
  }
/* MAGE_RENDERER */
  box(0,0,width,height,C.bg);
  mageDefinition();
  for(let row=0;row<2;row++){
    const after=row===1,offset=row*(compact?414:220),accent=after?C.active:C.track;
    const delta=width-736;
    const map={x:compact?24:54,y:offset+(compact?66:62),w:compact?128:144,h:compact?132:149};
    const msgX=compact?width-24-112:254+delta/3,msgY=offset+(compact?74:75),msgW=compact?112:92,msgH=26,msgGap=32,packetHeight=122;
    const cy=offset+(compact?135:136),ringX=compact?88:473+delta*2/3,ringY=compact?offset+318:cy,ringR=58;
    const qX=ringX-ringR,qW=ringR*2;
    const countX=width-(compact?24:32)-102,countY=offset+(compact?266:86),countW=102,countH=96;
    txt(after?'변경 후':'변경 전',compact?24:54,offset+(compact?20:29),14,after?C.active:C.muted,'start');
    const headerY=offset+(compact?48:50);
    txt('같은 섹터',map.x+map.w/2,headerY,12,C.muted);
    txt(after?'묶음 패킷':'이동 패킷',msgX+msgW/2,headerY,12,C.muted);
    txt('SendQ',ringX,compact?offset+236:headerY,12,C.muted);
    txt('Copy',countX+countW/2,compact?offset+236:headerY,12,C.muted,'middle',true);
    if(!compact){
      for(const x of [(map.x+map.w+msgX)/2-7,(msgX+msgW+qX)/2,(qX+qW+countX)/2]){
        wire([[x,offset+45],[x,offset+116]],C.track,false,.12);
        wire([[x,offset+152],[x,offset+216]],C.track,false,.12);
      }
    }
    box(map.x,map.y,map.w,map.h,C.bg,C.edge,{rx:2.4,'data-role':'source-sector','data-comparison':after?'after':'before'});
    box(map.x+10,map.y+10,map.w-20,map.h-20,'none',C.edge,{'stroke-width':.8,opacity:.6});
    wire([[map.x+map.w/2,map.y+10],[map.x+map.w/2,map.y+map.h-10]],C.edge,false,.6);
    wire([[map.x+10,map.y+map.h/2],[map.x+map.w-10,map.y+map.h/2]],C.edge,false,.6);
    for(let i=0;i<4;i++){
      const x=map.x+10+(map.w-20)*(i%2?.75:.25),y=map.y+10+(map.h-20)*(i<2?.25:.75);
      const size=compact?27:30;
      movement(x,y,size,directions[i]);
      mage(x,y,size,directions[i],actors[i]);
      txt(actors[i],x,y-23,11,C.active,'middle',true);
    }
    const msgCenters=Array.from({length:4},(_,i)=>msgY+i*msgGap+msgH/2);
    const inputRail=compact?(map.x+map.w+msgX)/2:msgX-26;
    const outRail=compact?width-16:msgX+msgW+30;
    const queueLeft=qX-6;
    if(after){
      wire([[map.x+map.w,cy],[inputRail,cy],[msgX-6,cy]],C.track,true,.65);
      wire(compact?[[msgX+msgW+7,cy],[outRail,cy],[outRail,offset+216],[14,offset+216],[14,ringY],[queueLeft,ringY]]:[[msgX+msgW+7,cy],[queueLeft,cy]],accent,true);
    }else{
      wire([[map.x+map.w,cy],[inputRail,cy]],C.track,false,.65);
      wire([[inputRail,msgCenters[0]],[inputRail,msgCenters[3]]],C.track,false,.65);
      for(const y of msgCenters){
        wire([[inputRail,y],[msgX-6,y]],C.track,true,.65);
        wire([[msgX+msgW+7,y],[outRail,y]],C.track,false,.65);
      }
      wire([[outRail,msgCenters[0]],[outRail,msgCenters[3]]],C.track,false,.65);
      wire(compact?[[outRail,cy],[outRail,offset+216],[14,offset+216],[14,ringY],[queueLeft,ringY]]:[[outRail,cy],[queueLeft,cy]],C.track,true,.65);
    }
    if(after){
      box(msgX,msgY,msgW,packetHeight,C.surface,C.active,{rx:1.5,'data-role':'bundle-packet','data-count':4});
      box(msgX+1,msgY+1,msgW-2,23,C.soft);
      txt('Msg',msgX+msgW/2,msgY+12,13,C.text,'middle',true,{'data-role':'bundle-message-label'});
      txt('헤더 · 4명',msgX+msgW/2,msgY+33,11,C.muted);
      for(let i=0;i<4;i++){
        const y=msgY+44+i*19;
        box(msgX+5,y,msgW-10,17,C.soft,null,{rx:1,'data-role':'bundle-entry','data-actor':actors[i]});
        txt(`${actors[i]} 상태`,msgX+msgW/2,y+8.5,12,C.text);
        pin(msgX-6,y+7);pin(msgX+msgW+2,y+7);
      }
    }else{
      for(let i=0;i<4;i++){
        const y=msgY+i*msgGap;
        messagePins(msgX,y,msgW,msgH);
        box(msgX,y,msgW,msgH,C.surface,C.edge,{rx:1.5,'data-role':'individual-packet','data-actor':actors[i]});
        txt(`Msg ${actors[i]}`,msgX+msgW/2,y+msgH/2,13,C.text,'middle',true);
      }
    }
    txt(after?'패킷 1개':'패킷 4개',msgX+msgW/2,offset+(compact?205:212),11,after?C.active:C.muted);
    ring(ringX,ringY,ringR,after);
    // The last column measures Copy operations per receiver; it is not a data-flow stage.
    countPins(countX,countY,countW,countH);
    box(countX,countY,countW,countH,after?C.soft:C.surface,after?C.active:C.edge,{rx:2.8});
    txt(after?'1':'4',countX+countW/2-6,countY+countH/2-7,56,after?C.active:C.text,'middle',false,{'data-role':'copy-count','data-comparison':after?'after':'before'});
    txt('회',countX+countW-13,countY+countH/2+9,11,C.muted);
    txt('세션당 Copy',countX+countW/2,countY+countH-14,11,C.muted);
  }
  wire([[24,compact?400:226],[width-24,compact?400:226]],C.edge,false,.55);
  txt('같은 상태 · 같은 수신자',24,height-14,11,C.muted,'start');
  txt(compact?'수신 세션 1개 예시':'수신 세션 1개를 대표로 표시',width-24,height-14,11,C.muted,'end');
  return {markup:out.join('\n'),width,height,compact,labels,traces};
}
