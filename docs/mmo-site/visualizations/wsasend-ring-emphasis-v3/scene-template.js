function createBundleAnimationScene(width,layout='silkscreen',routing='chamfer',material='minimal'){
  width=Math.max(320,width);
  if(layout!=='silkscreen'||routing!=='chamfer'||material!=='minimal')throw Error('Unsupported design');
  const kind='wsasend-ring-emphasis-'+material+'-'+routing+'-'+layout,compact=width<700,height=compact?1080:548;
  const skin={fill:'soft',housing:false};
  const C={bg:'var(--pcb-bg)',surface:'var(--pcb-surface)',edge:'var(--pcb-edge)',track:'var(--pcb-track)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',active:'var(--pcb-active)',soft:'var(--pcb-soft)',empty:'var(--pcb-empty)',pin:'var(--pcb-pin)'};
  const out=[],labels=[],traces=[],rows=[];
  const sid=(row,name,index='')=>`${kind}-${row}-${name}${index}`;
  const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  function tag(name,attrs,body=''){out.push(`<${name} ${Object.entries(attrs).map(([key,value])=>`${key}="${escape(value)}"`).join(' ')}>${body}</${name}>`);}
  function box(x,y,w,h,fill=C.surface,stroke=null,extra={}){tag('rect',{x,y,width:w,height:h,fill,...(stroke?{stroke,'stroke-width':1.5}:{}),...extra});}
  function txt(label,x,y,size=12,color=C.text,anchor='middle',mono=false,extra={}){
    if(!extra['data-ink-copy'])labels.push({label,x,y,size,anchor});
    tag('text',{x,y,fill:color,'font-size':size,'text-anchor':anchor,'dominant-baseline':'middle',class:mono?'bundle-mono':'',...extra},escape(label));
  }
  function wire(points,color=C.track,arrow=false,opacity=.7){
    for(let i=1;i<points.length;i++){
      const dx=Math.abs(points[i][0]-points[i-1][0]),dy=Math.abs(points[i][1]-points[i-1][1]);
      if(dx&&dy&&(routing!=='chamfer'||Math.abs(dx-dy)>1e-6))throw Error('Invalid circuit trace');
    }
    traces.push(points);
    tag('path',{d:points.map((p,i)=>`${i?'L':'M'}${p[0]} ${p[1]}`).join(' '),fill:'none',stroke:color,'stroke-width':1.5,'stroke-linecap':'butt','stroke-linejoin':'miter',opacity});
    if(arrow){
      const [x,y]=points.at(-1),[px,py]=points.at(-2),s=3;
      const p=x!==px?`${x-Math.sign(x-px)*4},${y-s} ${x},${y} ${x-Math.sign(x-px)*4},${y+s}`:`${x-s},${y-Math.sign(y-py)*4} ${x},${y} ${x+s},${y-Math.sign(y-py)*4}`;
      tag('polyline',{points:p,fill:'none',stroke:color,'stroke-width':1.5,opacity});
    }
  }
  function pin(x,y,w=4,h=3){
    const vertical=h>w,cx=x+w/2,cy=y+h/2;
    if(routing==='bus'){
      box(cx-(vertical?2:4),cy-(vertical?4:2),vertical?4:8,vertical?8:4,C.pin,null,{'data-role':'connection-pin',opacity:.75});
    }else if(routing==='side'){
      box(cx-(vertical?2:4),cy-(vertical?4:2),vertical?4:8,vertical?8:4,C.pin,null,{'data-role':'connection-pin',opacity:.75});
      box(cx-(vertical?1:2),cy-(vertical?2:1),vertical?2:4,vertical?4:2,C.bg);
    }else if(routing==='chamfer'){
      tag('circle',{cx,cy,r:3,fill:C.pin,opacity:.85,'data-role':'connection-pin'});
      tag('circle',{cx,cy,r:1.25,fill:C.bg});
    }else if(layout==='connector'){
      box(cx-(vertical?2.5:5),cy-(vertical?5:2.5),vertical?5:10,vertical?10:5,C.pin,null,{'data-role':'connection-pin',opacity:.8});
      box(cx-.75,cy-.75,1.5,1.5,C.bg);
    }else if(layout==='chip'){
      box(cx-(vertical?3:4),cy-(vertical?4:3),vertical?6:8,vertical?8:6,C.pin,null,{'data-role':'connection-pin',opacity:.8});
      box(cx-(vertical?1.5:3),cy-(vertical?3:1.5),vertical?3:6,vertical?6:3,C.edge);
    }else{
      tag('circle',{cx,cy,r:2.5,fill:C.bg,stroke:C.pin,'stroke-width':1.5,'data-role':'connection-pin'});
    }
  }
  function via(x,y){tag('circle',{cx:x,cy:y,r:2.5,fill:C.bg,stroke:C.track,'stroke-width':1.5,'data-role':'bus-junction'});}
  function footprint(x,y,w,h){
    out.push('<g data-role="component-footprint">');
    for(const [px,py,sx,sy] of [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]])wire([[px,py+sy*7],[px,py],[px+sx*7,py]],C.muted,false,.55);
    out.push('</g>');
  }
  function packetFill(row,index,x,y,w,h,ready=true){
    const key=sid(row,'packet',index),clip=key+'-clip',mask=key+'-mask';
    out.push(`<defs><clipPath id="${clip}"><rect id="${mask}" x="${x+1}" y="${y+1}" width="${w-2}" height="${h-2}"></rect></clipPath></defs>`);
    const bright=skin.fill==='bright'||layout==='connector'&&index==='bundle';
    box(x+1,y+1,w-2,h-2,ready?C.active:C.muted,null,{id:key+'-fill','clip-path':`url(#${clip})`,opacity:ready?.28:.14,'data-role':ready?'payload-lit-fill':'message-title-fill'});
    if(!bright&&ready)box(x+1,y+h-3,w-2,2,C.active,null,{'clip-path':`url(#${clip})`,'data-role':'data-ready-strip',opacity:1});
    return {clip,mask,fill:key+'-fill',width:w-2,base:key+'-base',normal:[],ink:[],inkColor:bright?C.bg:C.text};
  }
  function packetText(packet,label,x,y,size=12,color=C.text,mono=false,anchor='middle'){
    const n=packet.normal.length,id=packet.base+'-label'+n,ink=id+'-ink';
    txt(label,x,y,size,color,anchor,mono,{id});
    txt(label,x,y,size,packet.inkColor,anchor,mono,{id:ink,'clip-path':`url(#${packet.clip})`,'data-ink-copy':true});
    packet.normal.push(id);packet.ink.push(ink);
  }
  function makeBeam(points,key,headWidth=6,headHeight=6){
    const length=points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-points[i][0],p[1]-points[i][1]),0);
    tag('path',{id:key+'-trace',d:points.map((p,i)=>`${i?'L':'M'}${p[0]} ${p[1]}`).join(' '),fill:'none',stroke:C.active,'stroke-width':1.5,'stroke-dasharray':`${length} ${length}`,'stroke-dashoffset':length,opacity:0,'data-role':'transfer-beam'});
    box(points[0][0]-headWidth/2,points[0][1]-headHeight/2,headWidth,headHeight,C.active,null,{id:key+'-head',opacity:0,'data-role':'data-pulse'});
    return {points,length,trace:key+'-trace',head:key+'-head',headWidth,headHeight};
  }
  function polar(cx,cy,r,degrees){const a=degrees*Math.PI/180;return [cx+Math.cos(a)*r,cy+Math.sin(a)*r];}
  function ringPath(cx,cy,outer,inner,a,b){
    const p1=polar(cx,cy,outer,a),p2=polar(cx,cy,outer,b),p3=polar(cx,cy,inner,b),p4=polar(cx,cy,inner,a);
    return `M${p1.join(',')} A${outer},${outer} 0 0 1 ${p2.join(',')} L${p3.join(',')} A${inner},${inner} 0 0 0 ${p4.join(',')} Z`;
  }
  function ring(cx,cy,r,after,meta){
    const inner=r*.60;
    const filledStyle={fill:C.active,'fill-opacity':.28};
    const addRegion=(index,a,b,role)=>{
      const id=sid(meta.row,'queue-fill',index);
      tag('path',{id,d:ringPath(cx,cy,r,inner,a,b),...filledStyle,'data-role':role,...(after?{'data-entry-count':4}:{})});
      meta.queue.push({id,cx,cy,outer:r,inner,a,b});
      if(material==='band'){
        const bandId=sid(meta.row,'queue-band',index),band={id:bandId,cx,cy,outer:r,inner:r-3,a,b};
        tag('path',{id:bandId,d:ringPath(cx,cy,r,r-3,a,b),fill:C.active,'data-role':'occupied-outer-band'});meta.queueBands.push(band);
      }
    };
    if(skin.housing){
      box(cx-r-7,cy-r-7,r*2+14,r*2+14,C.surface,C.edge,{'data-role':'queue-housing'});
      footprint(cx-r-10,cy-r-10,r*2+20,r*2+20);
    }else if(layout==='silkscreen'&&routing==='baseline'){
      footprint(cx-r-5,cy-r-5,r*2+10,r*2+10);
    }else if(routing==='side'){
      box(cx-r-5,cy-r-5,r*2+10,r*2+10,'none',C.edge,{'data-role':'queue-footprint'});
    }
    out.push(`<g data-role="recipient-ring" data-comparison="${meta.row===1?'after':'before'}" data-session="representative">`);
    for(let i=0;i<8;i++){
      const a=-180+i*45+1.3,b=a+42.4;
      if(after&&i<4)continue;
      tag('path',{d:ringPath(cx,cy,r,inner,a,b),fill:C.empty,stroke:C.edge,'stroke-width':1.5});
      if(i<4)addRegion(i,a,b,'individual-msg-region');
    }
    if(after){
      const id=sid(meta.row,'queue-fill',0),a=-178.7,b=-1.3;
      tag('path',{d:ringPath(cx,cy,r,inner,a,b),fill:C.empty,stroke:C.edge,'stroke-width':1.5});
      addRegion(0,a,b,'bundle-msg-region');
    }
    for(let i=0;i<4;i++){const [x,y]=polar(cx,cy,(r+inner)/2,-157.5+i*45),id=sid(meta.row,'queue-label',i);meta.queueLabels.push(id);txt(String(i+1),x,y,13,C.bg,'middle',true,{id});}
    txt('0개',cx,cy-5,26,C.text,'middle',true,{id:meta.queueCount,'data-role':'queue-pending-count'});
    txt('대기',cx,cy+22,12,C.muted,'middle',false,{'data-role':'queue-pending-label'});
    out.push('</g>');
  }
  function clippedCorners(points){
    const result=[points[0]];
    for(let i=1;i<points.length-1;i++){
      const a=points[i-1],b=points[i],c=points[i+1],ab=Math.hypot(b[0]-a[0],b[1]-a[1]),bc=Math.hypot(c[0]-b[0],c[1]-b[1]);
      if(!ab||!bc)continue;
      const cut=Math.min(8,ab/2,bc/2);
      if((b[0]-a[0])*(c[1]-b[1])===(b[1]-a[1])*(c[0]-b[0])){result.push(b);continue;}
      result.push([b[0]-(b[0]-a[0])*cut/ab,b[1]-(b[1]-a[1])*cut/ab],[b[0]+(c[0]-b[0])*cut/bc,b[1]+(c[1]-b[1])*cut/bc]);
    }
    result.push(points.at(-1));return result;
  }
/* MAGE_RENDERER */
  const G={packetH:56,headerH:22,protocolHeaderH:0,dataW:42,dataH:22,columnW:50,columnGap:8,pad:6,lead:8,pitch:6,mapW:96,mapH:120,ringR:76,characterSize:24};
  box(0,0,width,height,C.bg);mageDefinition();
  const groupW=234,left=24,gap=(width-left-20-G.mapW-groupW-G.ringR*2-84)/2;
  const messageX=compact?(width-groupW)/2:left+G.mapW+gap;
  const ringX=compact?width/2:messageX+groupW+gap+G.ringR;
  if(!compact){txt('캐릭터 이동',left+G.mapW/2,35,12,C.muted);txt('이동 메시지',messageX+groupW/2,35,12,C.muted);txt('SendQ · 링버퍼',ringX,35,14,C.text);}
  function terminal(cx,cy,edge,axis){
    wire(axis==='x'?[[edge,cy],[cx+Math.sign(cx-edge)*4,cy]]:[[cx,edge],[cx,cy+Math.sign(cy-edge)*4]],C.track,false,.65);
    pin(cx-2,cy-1.5);
  }
  function divider(x,y,w,bundle){
    out.push(`<g data-role="message-title-divider" data-kind="${bundle?'bundle':'individual'}">`);
    wire([[x+1,y+G.headerH],[x+w-1,y+G.headerH]],C.edge,false,.6);out.push('</g>');
  }
  for(let row=0;row<2;row++){
    const after=row===1,offset=row*(compact?548:248),cy=offset+(compact?134:174);
    const map={x:compact?(width-G.mapW)/2:left,y:cy-G.mapH/2,w:G.mapW,h:G.mapH};
    const msgTop=compact?offset+238:cy-G.packetH/2,msgBottom=msgTop+G.packetH;
    const ringY=compact?offset+434:cy,queueLeft=ringX-G.ringR-G.lead;
    const meta={row,group:sid(row,'row'),matrix:sid(row,'gray-matrix'),packets:[],messages:[],queue:[],queueBands:[],queueInk:C.text,queueLabels:[],sourceBeams:[],copyBeams:[],outletBeams:[],callCount:sid(row,'call-count'),outletLabel:sid(row,'outlet-label'),kernelBoundary:sid(row,'kernel-boundary'),kernelLabel:sid(row,'kernel-label'),queueCount:sid(row,'queue-count')};rows.push(meta);
    out.push(`<defs><filter id="${sid(row,'gray')}" color-interpolation-filters="sRGB"><feColorMatrix id="${meta.matrix}" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"></feColorMatrix></filter></defs>`);
    out.push(`<g id="${meta.group}" filter="url(#${sid(row,'gray')})" data-role="comparison-row" data-row="${row}">`);
    txt(after?'변경 후 · 틱 끝 송신':'변경 전 · 즉시 송신',compact?20:left,offset+(compact?20:76),14,after?C.active:C.muted,'start');
    if(compact){txt('캐릭터 이동',width/2,offset+46,12,C.muted);txt('SendQ · 링버퍼',ringX,offset+338,14,C.text);}
    else{
      const x=map.x+map.w+10;
      out.push('<g data-role="source-message-divider">');
      wire([[x,map.y-4],[x,map.y+12]],C.edge,false,.55);wire([[x,map.y+map.h-12],[x,map.y+map.h+4]],C.edge,false,.55);out.push('</g>');
    }
    box(map.x,map.y,map.w,map.h,C.bg,C.edge,{rx:1.5,'data-role':'source-sector'});footprint(map.x-4,map.y-4,map.w+8,map.h+8);
    const grid={x:map.x+9,y:map.y+9,w:map.w-18,h:map.h-18},cellW=grid.w/3,cellH=grid.h/3;
    const coordinates=[[0,2],[0,1],[1,1],[1,0],[2,0]],positions=coordinates.map(([x,y])=>[grid.x+cellW*(x+.5),grid.y+cellH*(y+.5)]);
    const sourceCell=sid(row,'source-cell'),targetCell=sid(row,'target-cell');
    for(const [i,id,opacity] of [[3,sourceCell,0],[4,targetCell,1]])box(grid.x+coordinates[i][0]*cellW+1,grid.y+coordinates[i][1]*cellH+1,cellW-2,cellH-2,C.soft,null,{id,opacity});
    box(grid.x,grid.y,grid.w,grid.h,'none',C.edge,{opacity:.45});
    for(let i=1;i<3;i++){wire([[grid.x+cellW*i,grid.y],[grid.x+cellW*i,grid.y+grid.h]],C.edge,false,.45);wire([[grid.x,grid.y+cellH*i],[grid.x+grid.w,grid.y+cellH*i]],C.edge,false,.45);}
    meta.movementArrows=[];
    for(let i=0;i<4;i++){
      const a=positions[i],b=positions[i+1],dx=b[0]-a[0],dy=b[1]-a[1],id=sid(row,'movement-arrow',i);meta.movementArrows.push(id);
      out.push(`<g id="${id}" data-role="movement-arrow" opacity="0">`);wire([[a[0]+dx*.22,a[1]+dy*.22],[a[0]+dx*.73,a[1]+dy*.73]],C.track,true,1);out.push('</g>');
    }
    const sprite=sid(row,'character'),face=sid(row,'character-face');
    out.push(`<g id="${sprite}" transform="translate(${positions[4][0]-positions[0][0]} ${positions[4][1]-positions[0][1]})">`);
    tag('use',{id:face,href:`#bundle-mage-${kind}-south`,transform:`translate(${positions[0][0]} ${positions[0][1]}) scale(${G.characterSize/32})`,'data-character':'mage','data-facing':'south'});out.push('</g>');
    meta.character={sprite,face,kind,size:G.characterSize,positions,coordinates,directions:['north','east','north','east'],grid,cellW,cellH,sourceCell,targetCell};
    const centers=Array.from({length:4},(_,i)=>messageX+5+i*(G.columnW+G.columnGap)+G.columnW/2);
    for(let i=0;i<4;i++){
      const x=centers[i]-G.columnW/2,index=i;
      const contentGroup=sid(row,'message-contents',i);
      let header=null,packetHeader=null;
      {
        const id=sid(row,'message-body',i);box(x,msgTop,G.columnW,G.packetH,C.surface,C.edge,{id,'data-role':'individual-packet','data-count':1});
        out.push(`<g id="${contentGroup}" data-role="message-contents">`);
        header=packetFill(row,'header'+i,x,msgTop,G.columnW,G.headerH,false);packetText(header,`Msg ${i+1}`,x+G.pad,msgTop+G.headerH/2,12,C.text,true,'start');
        divider(x,msgTop,G.columnW,false);meta.messages.push({id,x,y:msgTop,width:G.columnW,height:G.packetH,titleHeight:G.headerH,protocolHeaderHeight:0});
      }
      const dataX=x+4,dataY=msgTop+G.headerH+G.protocolHeaderH+G.pad;
      box(dataX,dataY,G.dataW,G.dataH,C.empty,null,{id:sid(row,'packet',index)+'-base','data-role':'individual-data-entry','data-move':i+1});
      const packet=packetFill(row,index,dataX,dataY,G.dataW,G.dataH);packet.contentGroup=contentGroup;packet.suppressStroke=true;packet.header=header;packet.protocolHeader=packetHeader;packet.payload={move:i+1,x:coordinates[i+1][0],y:coordinates[i+1][1]};meta.packets.push(packet);
      packetText(packet,coordinates[i+1].join(','),centers[i],dataY+G.dataH/2,12,C.text,true);
      out.push('</g>');
      terminal(centers[i],msgTop-4,msgTop,'y');
      terminal(centers[i],msgBottom+4,msgBottom,'y');
    }
    const inputs=[],outputs=[];
    if(!compact){
      const inputY=msgTop-G.lead;
      for(let i=0;i<4;i++){
        const sourceY=inputY+13-i*G.pitch,stemX=messageX-8-i*G.pitch,laneY=inputY-8-i*G.pitch;
        terminal(map.x+map.w+4,sourceY,map.x+map.w,'x');
        inputs.push(clippedCorners([[map.x+map.w+G.lead,sourceY],[stemX,sourceY],[stemX,laneY],[centers[i],laneY],[centers[i],inputY]]));
        {
          const y=msgBottom+16+(3-i)*G.pitch,x=messageX+groupW+16+(3-i)*G.pitch,targetY=ringY+9-i*G.pitch;
          terminal(ringX-G.ringR-4,targetY,ringX-G.ringR,'x');
          outputs.push(clippedCorners([[centers[i],msgBottom+G.lead],[centers[i],y],[x,y],[x,targetY],[queueLeft,targetY]]));
        }
      }

    }else{
      for(let i=0;i<4;i++){
        const sourceX=width/2-9+i*G.pitch,laneY=map.y+map.h+(i===0||i===3?8:14);
        terminal(sourceX,map.y+map.h+4,map.y+map.h,'y');
        inputs.push(clippedCorners([[sourceX,map.y+map.h+G.lead],[sourceX,laneY],[centers[i],laneY],[centers[i],msgTop-G.lead]]));
        {
          const y=msgBottom+16+i*G.pitch,x=12+i*G.pitch,targetY=ringY+9-i*G.pitch;
          terminal(ringX-G.ringR-4,targetY,ringX-G.ringR,'x');
          outputs.push(clippedCorners([[centers[i],msgBottom+G.lead],[centers[i],y],[x,y],[x,targetY],[queueLeft,targetY]]));
        }
      }

    }
    inputs.forEach(points=>wire(points,C.track,false,.65));outputs.forEach(points=>wire(points,C.track,false,.65));
    if(!compact)txt('같은 Msg 4개',messageX+groupW/2,cy+78,12,C.muted,'middle',false,{'data-role':'message-caption'});
    ring(ringX,ringY,G.ringR,false,meta);
    const start=ringX+G.ringR+G.lead,end=width-10,boundary=width-22,path=[[start,ringY],[end,ringY]];
    terminal(ringX+G.ringR+4,ringY,ringX+G.ringR,'x');wire(path,C.track,true,.8);
    meta.boundaryProgress=(boundary-start)/(end-start);
    txt('WSASend',(start+boundary)/2,ringY-19,12,C.muted,'middle',true,{id:meta.outletLabel,'data-role':'outlet-label'});
    txt('0회',(start+boundary)/2,ringY+15,12,C.muted,'middle',true,{id:meta.callCount,'data-role':'call-count'});
    tag('path',{id:meta.kernelBoundary,d:`M${boundary} ${ringY-22} L${boundary} ${ringY+22}`,fill:'none',stroke:C.track,'stroke-width':1.5,'data-role':'kernel-boundary'});
    txt('커널',boundary-8,ringY+32,11,C.muted,'middle',false,{id:meta.kernelLabel,'data-role':'kernel-label'});
    meta.sourceBeams=inputs.map((p,i)=>makeBeam(p,sid(row,'source-beam',i)));meta.copyBeams=outputs.map((p,i)=>makeBeam(p,sid(row,'copy-beam',i)));meta.outletBeams=[makeBeam(path,sid(row,'outlet-beam',0),16,10)];
    out.push('</g>');
  }
  wire([[20,compact?530:298],[width-20,compact?530:298]],C.edge,false,.55);
  return {markup:out.join('\n'),width,height,compact,layout,routing,material,metrics:G,labels,traces,rows};
}
