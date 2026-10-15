function createBundleAnimationScene(width,layout='silkscreen',routing='chamfer',material='minimal'){
  width=Math.max(320,width);
  if(layout!=='silkscreen'||routing!=='chamfer'||material!=='minimal')throw Error('Unsupported design');
  const kind='shared-'+material+'-'+routing+'-'+layout,compact=width<700,height=compact?980:548;
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
    out.push(`<g data-role="recipient-ring" data-comparison="${after?'after':'before'}" data-session="representative">`);
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
    for(let i=0;i<4;i++){const [x,y]=polar(cx,cy,(r+inner)/2,-157.5+i*45),id=sid(meta.row,'queue-label',i);meta.queueLabels.push(id);txt(String(i+1),x,y,11,C.bg,'middle',true,{id});}
    txt(after?'묶음':'개별',cx,cy-5,14,C.text);
    txt(after?'Msg 1개':'Msg 4개',cx,cy+14,11,C.muted,'middle',true,{id:meta.queueCount});
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
  const G={packetH:100,headerH:24,protocolHeaderH:20,dataW:56,dataH:40,columnW:64,columnGap:12,pad:8,lead:8,pitch:6,mapW:72,mapH:218,ringR:50,characterSize:28};
  box(0,0,width,height,C.bg);mageDefinition();
  const groupW=4*G.columnW+3*G.columnGap+10;
  const messageX=compact?(width-groupW)/2:150+(width-700)/2,ringX=compact?width/2:width-154;
  const map={x:compact?(width-G.mapW)/2:24,y:compact?62:189,w:G.mapW,h:G.mapH};
  const mapCenter=map.y+map.h/2;
  const sharedLead=compact?[[width/2,map.y+map.h+G.lead],[width/2,map.y+map.h+28]]:[[map.x+map.w+G.lead,mapCenter],[map.x+map.w+28,mapCenter]];
  const sharedNode=sharedLead.at(-1);
  function terminal(cx,cy,edge,axis){
    wire(axis==='x'?[[edge,cy],[cx+Math.sign(cx-edge)*4,cy]]:[[cx,edge],[cx,cy+Math.sign(cy-edge)*4]],C.track,false,.65);
    pin(cx-2,cy-1.5);
  }
  function divider(x,y,w,bundle){
    out.push(`<g data-role="message-title-divider" data-kind="${bundle?'bundle':'individual'}">`);
    wire([[x+1,y+G.headerH],[x+w-1,y+G.headerH]],C.edge,false,.6);out.push('</g>');
  }
  function protocolHeader(row,index,x,y,w){
    const top=y+G.headerH,label=sid(row,'protocol-header-label',index),key=sid(row,'protocol-header-fill',index),clip=key+'-clip',mask=key+'-mask';
    out.push(`<g data-role="packet-header" data-kind="${row===1?'bundle':'individual'}">`);
    out.push(`<defs><clipPath id="${clip}"><rect id="${mask}" x="${x+1}" y="${top+1}" width="${w-2}" height="${G.protocolHeaderH-2}"></rect></clipPath></defs>`);
    box(x+1,top+1,w-2,G.protocolHeaderH-2,C.muted,null,{id:key,opacity:.18,'clip-path':`url(#${clip})`,'data-role':'packet-header-surface'});
    txt('Header',x+G.pad,top+G.protocolHeaderH/2,11,C.muted,'start',true,{id:label,'data-role':'packet-header-label'});
    wire([[x+1,top+G.protocolHeaderH],[x+w-1,top+G.protocolHeaderH]],C.edge,false,.6);
    out.push('</g>');return {label,mask,fill:key,x:x+1,y:top,width:w-2,height:G.protocolHeaderH};
  }
  txt('캐릭터 이동',map.x+map.w/2,compact?36:map.y-24,12,C.muted);
  if(!compact){txt('이동 메시지',messageX+groupW/2,35,12,C.muted);txt('SendQ',ringX,35,12,C.muted);}
  out.push('<g data-role="shared-movement-source">');
  box(map.x,map.y,map.w,map.h,C.bg,C.edge,{rx:1.5,'data-role':'source-sector'});footprint(map.x-4,map.y-4,map.w+8,map.h+8);
  const grid={x:map.x+9,y:map.y+9,w:map.w-18,h:map.h-18},cellW=grid.w,cellH=grid.h/5;
  const coordinates=[[0,4],[0,3],[0,2],[0,1],[0,0]],positions=coordinates.map(([x,y])=>[grid.x+cellW*(x+.5),grid.y+cellH*(y+.5)]);
  const sourceCell=sid('shared','source-cell'),targetCell=sid('shared','target-cell');
  for(const [i,id,opacity] of [[3,sourceCell,0],[4,targetCell,1]])box(grid.x+1,grid.y+coordinates[i][1]*cellH+1,cellW-2,cellH-2,C.soft,null,{id,opacity});
  box(grid.x,grid.y,grid.w,grid.h,'none',C.edge,{opacity:.45});
  for(let i=1;i<5;i++)wire([[grid.x,grid.y+cellH*i],[grid.x+grid.w,grid.y+cellH*i]],C.edge,false,.45);
  const movementArrows=[];
  for(let i=0;i<4;i++){
    const a=positions[i],b=positions[i+1],id=sid('shared','movement-arrow',i);movementArrows.push(id);
    out.push(`<g id="${id}" data-role="movement-arrow" opacity="0">`);wire([[a[0],a[1]+(b[1]-a[1])*.22],[a[0],a[1]+(b[1]-a[1])*.73]],C.track,true,1);out.push('</g>');
  }
  const sprite=sid('shared','character'),face=sid('shared','character-face');
  out.push(`<g id="${sprite}" transform="translate(0 ${positions[4][1]-positions[0][1]})">`);
  tag('use',{id:face,href:`#bundle-mage-${kind}-south`,transform:`translate(${positions[0][0]} ${positions[0][1]}) scale(${G.characterSize/32})`,'data-character':'mage','data-facing':'south'});out.push('</g>');
  const sharedCharacter={sprite,face,kind,size:G.characterSize,positions,coordinates,directions:['north','north','north','north'],grid,cellW,cellH,sourceCell,targetCell,movementArrows};
  if(compact)terminal(width/2,map.y+map.h+4,map.y+map.h,'y');else terminal(map.x+map.w+4,mapCenter,map.x+map.w,'x');
  wire(sharedLead,C.track,false,.65);via(sharedNode[0],sharedNode[1]);
  if(!compact){const x=map.x+map.w+12;out.push('<g data-role="source-message-divider">');wire([[x,map.y-4],[x,map.y+12]],C.edge,false,.55);wire([[x,map.y+map.h-12],[x,map.y+map.h+4]],C.edge,false,.55);out.push('</g>');}
  out.push('</g>');
  for(let row=0;row<2;row++){
    const after=row===1,offset=row*(compact?346:248),cy=offset+(compact?418:174);
    const msgTop=cy-G.packetH/2,msgBottom=msgTop+G.packetH,ringY=compact?offset+578:cy,queueLeft=ringX-G.ringR-G.lead;
    const meta={row,group:sid(row,'row'),matrix:sid(row,'gray-matrix'),packets:[],messages:[],queue:[],queueBands:[],queueInk:C.text,queueLabels:[],sourceBeams:[],copyBeams:[],outletBeams:[],outletLabel:sid(row,'outlet-label'),kernelBoundary:sid(row,'kernel-boundary'),kernelLabel:sid(row,'kernel-label'),queueCount:sid(row,'queue-count'),character:sharedCharacter,movementArrows,sharedInput:true};rows.push(meta);
    out.push(`<defs><filter id="${sid(row,'gray')}" color-interpolation-filters="sRGB"><feColorMatrix id="${meta.matrix}" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"></feColorMatrix></filter></defs>`);
    out.push(`<g id="${meta.group}" filter="url(#${sid(row,'gray')})" data-role="comparison-row" data-row="${row}">`);
    txt(after?'변경 후':'변경 전',compact?20:messageX,offset+(compact?326:76),14,after?C.active:C.muted,'start');
    if(compact)txt('SendQ',ringX,offset+516,12,C.muted);
    const centers=Array.from({length:4},(_,i)=>messageX+5+i*(G.columnW+G.columnGap)+G.columnW/2);
    if(after){
      const id=sid(row,'packet','bundle')+'-base';box(messageX,msgTop,groupW,G.packetH,C.surface,C.edge,{id,'data-role':'bundle-packet','data-count':4});
      meta.bundle=packetFill(row,'bundle',messageX,msgTop,groupW,G.headerH,false);packetText(meta.bundle,'Msg',messageX+G.pad,msgTop+G.headerH/2,12,C.text,true,'start');
      meta.bundleCount=sid(row,'bundle-count');txt('이동 4개',messageX+groupW-G.pad,msgTop+G.headerH/2,11,C.muted,'end',false,{id:meta.bundleCount});
      divider(messageX,msgTop,groupW,true);meta.bundleProtocolHeader=protocolHeader(row,'bundle',messageX,msgTop,groupW);meta.messages.push({id,x:messageX,y:msgTop,width:groupW,height:G.packetH,titleHeight:G.headerH,protocolHeaderHeight:G.protocolHeaderH});
    }
    for(let i=0;i<4;i++){
      const x=centers[i]-G.columnW/2,index=after?'entry'+i:i;let header=null,packetHeader=null;
      if(!after){
        const id=sid(row,'message-body',i);box(x,msgTop,G.columnW,G.packetH,C.surface,C.edge,{id,'data-role':'individual-packet','data-count':1});
        header=packetFill(row,'header'+i,x,msgTop,G.columnW,G.headerH,false);packetText(header,`Msg ${i+1}`,x+G.pad,msgTop+G.headerH/2,12,C.text,true,'start');
        divider(x,msgTop,G.columnW,false);packetHeader=protocolHeader(row,i,x,msgTop,G.columnW);meta.messages.push({id,x,y:msgTop,width:G.columnW,height:G.packetH,titleHeight:G.headerH,protocolHeaderHeight:G.protocolHeaderH});
      }
      const dataX=x+4,dataY=msgTop+G.headerH+G.protocolHeaderH+G.pad;
      box(dataX,dataY,G.dataW,G.dataH,C.empty,null,{id:sid(row,'packet',index)+'-base','data-role':after?'bundle-entry':'individual-data-entry','data-move':i+1});
      const packet=packetFill(row,index,dataX,dataY,G.dataW,G.dataH);packet.suppressStroke=true;packet.header=header;packet.protocolHeader=packetHeader;packet.payload={move:i+1,x:coordinates[i+1][0],y:coordinates[i+1][1]};meta.packets.push(packet);
      packetText(packet,coordinates[i+1].join(','),centers[i],dataY+G.dataH/2,12,C.text,true);
      terminal(centers[i],msgTop-4,msgTop,'y');if(!after)terminal(centers[i],msgBottom+4,msgBottom,'y');
    }
    const inputY=msgTop-G.lead,busY=inputY-18;
    const trunk=clippedCorners(compact&&after?[sharedNode,[4,sharedNode[1]],[4,busY],[centers[3],busY]]:[sharedNode,[sharedNode[0],busY],[centers[3],busY]]);
    wire(trunk,C.track,false,.65);
    for(const x of centers){wire([[x,busY],[x,inputY]],C.track,false,.65);tag('circle',{cx:x,cy:busY,r:1.5,fill:C.track,opacity:.65,'data-role':'input-bus-junction'});}
    const inputs=centers.map(x=>{
      const branch=clippedCorners(compact&&after?[sharedNode,[4,sharedNode[1]],[4,busY],[x,busY]]:[sharedNode,[sharedNode[0],busY],[x,busY]]);
      return [...sharedLead.slice(0,-1),...branch,[x,inputY]];
    });
    const outputs=[];
    if(!compact){
      if(!after)for(let i=0;i<4;i++){
        const y=msgBottom+16+(3-i)*G.pitch,x=messageX+groupW+16+(3-i)*G.pitch,targetY=ringY+9-i*G.pitch;
        terminal(ringX-G.ringR-4,targetY,ringX-G.ringR,'x');outputs.push(clippedCorners([[centers[i],msgBottom+G.lead],[centers[i],y],[x,y],[x,targetY],[queueLeft,targetY]]));
      }
      else{
        const x=messageX+groupW/2,y=msgBottom+16,edgeX=messageX+groupW-4,diagonal=Math.min(48,queueLeft-messageX-groupW-12),landingX=edgeX+diagonal;
        terminal(x,msgBottom+4,msgBottom,'y');terminal(ringX-G.ringR-4,ringY,ringX-G.ringR,'x');
        outputs.push([[x,msgBottom+G.lead],[x,y-4],[x+4,y],[edgeX,y],[landingX,y-diagonal],[landingX,ringY+8],[landingX+8,ringY],[queueLeft,ringY]]);
      }
    }else{
      if(!after)for(let i=0;i<4;i++){
        const y=msgBottom+16+i*G.pitch,x=12+i*G.pitch,targetY=ringY+9-i*G.pitch;
        terminal(ringX-G.ringR-4,targetY,ringX-G.ringR,'x');outputs.push(clippedCorners([[centers[i],msgBottom+G.lead],[centers[i],y],[x,y],[x,targetY],[queueLeft,targetY]]));
      }
      else{const x=messageX+groupW/2;terminal(x,msgBottom+4,msgBottom,'y');terminal(ringX-G.ringR-4,ringY,ringX-G.ringR,'x');outputs.push(clippedCorners([[x,msgBottom+G.lead],[x,msgBottom+16],[12,msgBottom+16],[12,ringY],[queueLeft,ringY]]));}
    }
    outputs.forEach(points=>wire(points,after?C.active:C.track,false,after?.85:.65));
    if(!compact)txt(after?'4개를 Msg 하나로':'개별 Msg 4개',messageX+groupW/2,cy+108,12,after?C.active:C.muted,'middle',false,{'data-role':'message-caption'});
    ring(ringX,ringY,G.ringR,after,meta);
    const start=ringX+G.ringR+G.lead,end=width-10,boundary=width-22,path=[[start,ringY],[end,ringY]];
    terminal(ringX+G.ringR+4,ringY,ringX+G.ringR,'x');wire(path,C.track,true,.8);meta.boundaryProgress=(boundary-start)/(end-start);
    txt('WSASend',(start+boundary)/2,ringY-19,12,C.muted,'middle',true,{id:meta.outletLabel,'data-role':'outlet-label'});
    tag('path',{id:meta.kernelBoundary,d:`M${boundary} ${ringY-22} L${boundary} ${ringY+22}`,fill:'none',stroke:C.track,'stroke-width':1.5,'data-role':'kernel-boundary'});
    txt('커널',boundary-8,ringY+32,11,C.muted,'middle',false,{id:meta.kernelLabel,'data-role':'kernel-label'});
    meta.sourceBeams=inputs.map((p,i)=>makeBeam(p,sid(row,'source-beam',i)));meta.copyBeams=outputs.map((p,i)=>makeBeam(p,sid(row,'copy-beam',i)));meta.outletBeams=[makeBeam(path,sid(row,'outlet-beam',0),16,10)];
    out.push('</g>');
  }
  wire([[compact?20:messageX-10,compact?654:298],[width-20,compact?654:298]],C.edge,false,.55);
  return {markup:out.join('\n'),width,height,compact,layout,routing,material,metrics:G,labels,traces,rows,sharedCharacter};
}
