function createBundleAnimationScene(width,layout='silkscreen'){
  width=Math.max(320,width);
  if(!['silkscreen','chip','connector'].includes(layout))throw Error('Unknown design');
  const kind='data-entries-'+layout,compact=width<700,height=compact?862:548;
  const skin={silkscreen:{entryH:48,afterTop:-48,afterH:100,headerH:26,entryTop:-12,upper:-74,lower:74,fill:'soft',housing:false,footprint:true},chip:{entryH:56,afterTop:-60,afterH:120,headerH:28,entryTop:-5,upper:-84,lower:84,fill:'bright',housing:true,footprint:false},connector:{entryH:64,afterTop:-62,afterH:124,headerH:28,entryTop:-8,upper:-86,lower:88,fill:'soft',housing:false,footprint:false}}[layout];
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
    for(let i=1;i<points.length;i++)if(points[i][0]!==points[i-1][0]&&points[i][1]!==points[i-1][1])throw Error('Diagonal circuit trace');
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
    if(layout==='connector'){
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
  function packetFill(row,index,x,y,w,h){
    const key=sid(row,'packet',index),clip=key+'-clip',mask=key+'-mask';
    out.push(`<defs><clipPath id="${clip}"><rect id="${mask}" x="${x+1}" y="${y+1}" width="${w-2}" height="${h-2}"></rect></clipPath></defs>`);
    const bright=skin.fill==='bright'||layout==='connector'&&index==='bundle';
    box(x+1,y+1,w-2,h-2,bright?C.active:C.soft,null,{'clip-path':`url(#${clip})`});
    if(!bright)box(x+1,y+h-3,w-2,2,C.active,null,{'clip-path':`url(#${clip})`,'data-role':'data-ready-strip'});
    return {clip,mask,width:w-2,base:key+'-base',normal:[],ink:[],inkColor:bright?C.bg:C.text};
  }
  function packetText(packet,label,x,y,size=12,color=C.text,mono=false){
    const n=packet.normal.length,id=packet.base+'-label'+n,ink=id+'-ink';
    txt(label,x,y,size,color,'middle',mono,{id});
    txt(label,x,y,size,packet.inkColor,'middle',mono,{id:ink,'clip-path':`url(#${packet.clip})`,'data-ink-copy':true});
    packet.normal.push(id);packet.ink.push(ink);
  }
  function makeBeam(points,key,headWidth=7,headHeight=7){
    const length=points.slice(1).reduce((sum,p,i)=>sum+Math.abs(p[0]-points[i][0])+Math.abs(p[1]-points[i][1]),0);
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
    if(skin.housing){
      box(cx-r-7,cy-r-7,r*2+14,r*2+14,C.surface,C.edge,{'data-role':'queue-housing'});
      footprint(cx-r-10,cy-r-10,r*2+20,r*2+20);
    }else if(layout==='silkscreen'){
      footprint(cx-r-5,cy-r-5,r*2+10,r*2+10);
    }
    out.push(`<g data-role="recipient-ring" data-comparison="${after?'after':'before'}" data-session="representative">`);
    for(let i=0;i<8;i++){
      const a=-180+i*45+1.3,b=a+42.4;
      if(after&&i<4)continue;
      tag('path',{d:ringPath(cx,cy,r,inner,a,b),fill:C.empty,stroke:C.edge,'stroke-width':1.5});
      if(i<4){const id=sid(meta.row,'queue-fill',i);tag('path',{id,d:ringPath(cx,cy,r,inner,a,b),fill:C.active,stroke:C.edge,'stroke-width':1.5,'data-role':'individual-msg-region'});meta.queue.push({id,cx,cy,outer:r,inner,a,b});}
    }
    if(after){
      const id=sid(meta.row,'queue-fill',0),a=-178.7,b=-1.3;
      tag('path',{d:ringPath(cx,cy,r,inner,a,b),fill:C.empty,stroke:C.edge,'stroke-width':1.5});
      tag('path',{id,d:ringPath(cx,cy,r,inner,a,b),fill:C.active,stroke:C.edge,'stroke-width':1.5,'data-role':'bundle-msg-region','data-entry-count':4});meta.queue.push({id,cx,cy,outer:r,inner,a,b});
    }
    for(let i=0;i<4;i++){const [x,y]=polar(cx,cy,(r+inner)/2,-157.5+i*45),id=sid(meta.row,'queue-label',i);meta.queueLabels.push(id);txt(String(i+1),x,y,11,C.bg,'middle',true,{id});}
    txt(after?'묶음':'개별',cx,cy-5,14,C.text);
    txt(after?'Msg 1개':'Msg 4개',cx,cy+14,11,C.muted,'middle',true,{id:meta.queueCount});
    out.push('</g>');
  }
/* MAGE_RENDERER */
  box(0,0,width,height,C.bg);mageDefinition();
  const horizontal=!compact;
  const mapW=compact?112:120;
  const mapH=compact?132:144,msgW=compact?128:264;
  const radius=compact?56:50;
  const left=compact?20:24;
  const gap=(width-left-20-mapW-msgW-radius*2-84)/2;
  const msgX=compact?width-20-msgW:left+mapW+gap,ringX=compact?width/2:msgX+msgW+gap+radius;
  if(!compact){txt('캐릭터 이동',left+mapW/2,35,12,C.muted);txt('이동 메시지',msgX+msgW/2,35,12,C.muted);txt('SendQ',ringX,35,12,C.muted);}
  for(let row=0;row<2;row++){
    const after=row===1,offset=row*(compact?422:248),cy=offset+(compact?142:174);
    const meta={row,group:sid(row,'row'),matrix:sid(row,'gray-matrix'),packets:[],queue:[],queueLabels:[],sourceBeams:[],copyBeams:[],outletBeams:[],outletLabel:sid(row,'outlet-label'),kernelBoundary:sid(row,'kernel-boundary'),kernelLabel:sid(row,'kernel-label'),queueCount:sid(row,'queue-count')};rows.push(meta);
    out.push(`<defs><filter id="${sid(row,'gray')}" color-interpolation-filters="sRGB"><feColorMatrix id="${meta.matrix}" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"></feColorMatrix></filter></defs>`);
    out.push(`<g id="${meta.group}" filter="url(#${sid(row,'gray')})" data-role="comparison-row" data-row="${row}">`);
    txt(after?'변경 후':'변경 전',left,offset+(compact?23:76),14,after?C.active:C.muted,'start');
    if(compact){txt('캐릭터 이동',left+mapW/2,offset+50,12,C.muted);txt(after?'묶음 Msg':'이동 메시지',msgX+msgW/2,offset+50,12,C.muted);txt('SendQ',ringX,offset+258,12,C.muted);}
    const map={x:left,y:cy-mapH/2,w:mapW,h:mapH};
    if(!compact){
      const dividerX=(map.x+map.w+msgX)/2-7;
      out.push('<g data-role="source-message-divider">');
      wire([[dividerX,offset+94],[dividerX,cy-18]],C.edge,false,.55);
      wire([[dividerX,cy+18],[dividerX,offset+278]],C.edge,false,.55);
      out.push('</g>');
    }
    box(map.x,map.y,map.w,map.h,C.bg,C.edge,{rx:1.5,'data-role':'source-sector'});
    if(skin.footprint)footprint(map.x-4,map.y-4,map.w+8,map.h+8);
    const grid={x:map.x+9,y:map.y+9,w:map.w-18,h:map.h-18},cellW=grid.w/3,cellH=grid.h/3;
    const coordinates=[[0,2],[0,1],[1,1],[1,0],[2,0]],positions=coordinates.map(([x,y])=>[grid.x+cellW*(x+.5),grid.y+cellH*(y+.5)]);
    const sourceCell=sid(row,'source-cell'),targetCell=sid(row,'target-cell');
    for(const [i,id,opacity] of [[3,sourceCell,0],[4,targetCell,1]])box(grid.x+coordinates[i][0]*cellW+1,grid.y+coordinates[i][1]*cellH+1,cellW-2,cellH-2,C.soft,null,{id,opacity});
    box(grid.x,grid.y,grid.w,grid.h,'none',C.edge,{opacity:.45});
    for(let i=1;i<3;i++){wire([[grid.x+cellW*i,grid.y],[grid.x+cellW*i,grid.y+grid.h]],C.edge,false,.45);wire([[grid.x,grid.y+cellH*i],[grid.x+grid.w,grid.y+cellH*i]],C.edge,false,.45);}
    meta.movementArrows=[];
    for(let i=0;i<4;i++){
      const a=positions[i],b=positions[i+1],dx=b[0]-a[0],dy=b[1]-a[1];
      if(meta.movementArrows){const id=sid(row,'movement-arrow',i);meta.movementArrows.push(id);out.push(`<g id="${id}" data-role="movement-arrow" opacity="0">`);}
      wire([[a[0]+dx*.22,a[1]+dy*.22],[a[0]+dx*.73,a[1]+dy*.73]],C.track,true,1);
      if(meta.movementArrows)out.push('</g>');
    }
    const sprite=sid(row,'character'),face=sid(row,'character-face'),size=compact?26:28;
    out.push(`<g id="${sprite}" transform="translate(${positions[4][0]-positions[0][0]} ${positions[4][1]-positions[0][1]})">`);
    tag('use',{id:face,href:`#bundle-mage-${kind}-east`,transform:`translate(${positions[0][0]} ${positions[0][1]}) scale(${size/32})`,'data-character':'mage','data-facing':'east'});out.push('</g>');
    meta.character={sprite,face,kind,size,positions,coordinates,directions:['north','east','north','east'],grid,cellW,cellH,sourceCell,targetCell};
    pin(map.x+map.w+2,cy-1.5);
    const ringY=compact?offset+337:cy,queueLeft=ringX-radius-6;
    const msgY=cy-64,entryCenters=[],inputPaths=[],outputPaths=[];
    const inputRail=compact?(map.x+map.w+msgX)/2:msgX-22,outRail=compact?width-12:msgX+msgW+18;
    const queueRoute=(start)=>compact?[start,[outRail,start[1]],[outRail,offset+233],[12,offset+233],[12,ringY],[queueLeft,ringY]]:[start,[outRail,start[1]],[outRail,cy],[queueLeft,cy]];
    if(horizontal){
      const entryW=56,spacing=10,first=msgX+5,cardH=skin.entryH,cardY=after?cy+skin.entryTop:cy-cardH/2;
      const shellTop=cy+skin.afterTop,shellBottom=shellTop+skin.afterH;
      if(after){
        if(skin.footprint)footprint(msgX-4,shellTop-4,msgW+8,skin.afterH+8);
        box(msgX,shellTop,msgW,skin.afterH,C.surface,C.active,{id:sid(row,'packet','bundle')+'-base',rx:layout==='chip'?2:0,'data-role':'bundle-packet','data-count':4});
        meta.bundle=packetFill(row,'bundle',msgX,shellTop,msgW,skin.headerH);packetText(meta.bundle,'Msg',layout==='silkscreen'?msgX+28:msgX+msgW/2,shellTop+skin.headerH/2,13,C.text,true);
        meta.bundleCount=sid(row,'bundle-count');txt('이동 4개',layout==='silkscreen'?msgX+msgW-41:msgX+msgW/2,layout==='silkscreen'?shellTop+skin.headerH/2:cy-22,11,C.muted,'middle',false,{id:meta.bundleCount});
        if(layout==='silkscreen')wire([[msgX+8,shellTop+skin.headerH+4],[msgX+msgW-8,shellTop+skin.headerH+4]],C.edge,false,.6);
      }
      const lowerBus=cy+skin.lower,upperBus=cy+skin.upper,centers=[],inputY=after?shellTop-9:cardY-9;
      for(let i=0;i<4;i++){
        const x=first+i*(entryW+spacing),index=after?'entry'+i:i;centers.push(x+entryW/2);
        if(!after&&skin.footprint)footprint(x-3,cardY-3,entryW+6,cardH+6);
        box(x,cardY,entryW,cardH,after?C.empty:C.surface,after?null:C.edge,{id:sid(row,'packet',index)+'-base',rx:layout==='chip'?2:0,'data-role':after?'bundle-entry':'individual-packet','data-move':i+1});
        const packet=packetFill(row,index,x,cardY,entryW,cardH);packet.suppressStroke=after;packet.payload={move:i+1,x:coordinates[i+1][0],y:coordinates[i+1][1]};meta.packets.push(packet);
        if(after){
          packetText(packet,coordinates[i+1].join(','),x+entryW/2,cardY+cardH/2,12,C.text,true);
        }else{
          packetText(packet,`Msg ${i+1}`,x+entryW/2,cardY+cardH*.29,12,C.text,true);
          packetText(packet,coordinates[i+1].join(','),x+entryW/2,cardY+cardH*.71,layout==='connector'?13:11,C.muted,true);
        }
        if(layout==='connector')wire([[x+5,cardY+cardH*.48],[x+entryW-5,cardY+cardH*.48]],C.edge,false,.65);
        pin(x+entryW/2-1.5,inputY+2,3,4);
        inputPaths.push([[map.x+map.w,cy],[inputRail,cy],[inputRail,upperBus],[x+entryW/2,upperBus],[x+entryW/2,inputY]]);
        if(!after){pin(x+entryW/2-1.5,cardY+cardH+3,3,4);outputPaths.push([[x+entryW/2,cardY+cardH+9],[x+entryW/2,lowerBus],[outRail,lowerBus],[outRail,cy],[queueLeft,cy]]);}
      }
      wire([[map.x+map.w,cy],[inputRail,cy],[inputRail,upperBus],[centers.at(-1),upperBus]],C.track,false,.65);
      for(const x of centers)wire([[x,upperBus],[x,inputY]],C.track,true,.65);
      centers.forEach(x=>via(x,upperBus));
      if(after){const x=msgX+msgW/2;pin(x-1.5,shellBottom+3,3,4);outputPaths.push([[x,shellBottom+9],[x,lowerBus],[outRail,lowerBus],[outRail,cy],[queueLeft,cy]]);wire(outputPaths[0],C.active,true,.85);via(x,lowerBus);}
      else{for(const x of centers){wire([[x,cardY+cardH+9],[x,lowerBus]],C.track,false,.65);via(x,lowerBus);}wire([[centers[0],lowerBus],[outRail,lowerBus],[outRail,cy],[queueLeft,cy]],C.track,true,.65);}
      if(layout!=='silkscreen'){via(inputRail,upperBus);via(outRail,lowerBus);}
    }else{
      if(after){
        box(msgX,msgY,msgW,128,C.surface,C.active,{id:sid(row,'packet','bundle')+'-base',rx:1.5,'data-role':'bundle-packet','data-count':4});
        meta.bundle=packetFill(row,'bundle',msgX,msgY,msgW,26);packetText(meta.bundle,'Msg',msgX+msgW/2,msgY+13,13,C.text,true);
        meta.bundleCount=sid(row,'bundle-count');txt('이동 4개',msgX+msgW/2,msgY+35,11,C.muted,'middle',false,{id:meta.bundleCount});
      }
      for(let i=0;i<4;i++){
        const y=after?msgY+47+i*19:msgY+i*34,h=after?19:26,x=after?msgX+5:msgX,w=after?msgW-10:msgW,index=after?'entry'+i:i;entryCenters.push(y+h/2);
        box(x,y,w,h,after?C.soft:C.surface,after?null:C.edge,{id:sid(row,'packet',index)+'-base',rx:after?0:1.5,'data-role':after?'bundle-entry':'individual-packet','data-move':i+1});
        const packet=packetFill(row,index,x,y,w,h);packet.suppressStroke=after;packet.payload={move:i+1,x:coordinates[i+1][0],y:coordinates[i+1][1]};meta.packets.push(packet);
        if(after){
          packetText(packet,coordinates[i+1].join(','),x+w/2,y+h/2,12,C.text,true);
        }else{
          packetText(packet,`Msg ${i+1}`,x+w*.3,y+h/2,12,C.text,true);
          packetText(packet,coordinates[i+1].join(','),x+w*.76,y+h/2,11,C.muted,true);
        }
        pin(msgX-6,y+h/2-1.5);if(!after)pin(msgX+msgW+2,y+h/2-1.5);
      }
      const busY=offset+(compact?222:254),sourceStart=[map.x+map.w,cy];
      const useBus=layout==='bus'&&!compact;
      const baseInput=useBus?[sourceStart,[sourceStart[0]+14,cy],[sourceStart[0]+14,busY],[inputRail,busY]]:[sourceStart,[inputRail,cy]];
      wire(baseInput,C.track,false,.65);wire([[inputRail,entryCenters[0]],[inputRail,useBus?busY:entryCenters.at(-1)]],C.track,false,.65);
      for(let i=0;i<4;i++){const y=entryCenters[i];wire([[inputRail,y],[msgX-6,y]],C.track,true,.65);inputPaths.push([...baseInput,[inputRail,y],[msgX-6,y]]);}
      if(useBus){via(inputRail,busY);via(sourceStart[0]+14,busY);}
      if(after){pin(msgX+msgW+2,cy-1.5);outputPaths.push(compact?queueRoute([msgX+msgW+7,cy]):useBus?[[msgX+msgW+7,cy],[outRail,cy],[outRail,busY],[queueLeft-14,busY],[queueLeft-14,cy],[queueLeft,cy]]:[[msgX+msgW+7,cy],[queueLeft,cy]]);wire(outputPaths[0],C.active,true,.85);}
      else{
        for(const y of entryCenters)wire([[msgX+msgW+7,y],[outRail,y]],C.track,false,.65);
        wire([[outRail,entryCenters[0]],[outRail,useBus?busY:entryCenters.at(-1)]],C.track,false,.65);
        const tail=compact?[[outRail,cy],[outRail,offset+233],[12,offset+233],[12,ringY],[queueLeft,ringY]]:useBus?[[outRail,busY],[queueLeft-14,busY],[queueLeft-14,cy],[queueLeft,cy]]:[[outRail,cy],[queueLeft,cy]];
        wire(tail,C.track,true,.65);
        for(const y of entryCenters)outputPaths.push([[msgX+msgW+7,y],[outRail,y],...tail]);
      }
      if(useBus){via(outRail,busY);via(queueLeft-14,busY);}
    }
    txt(after?'4개를 Msg 하나로':'개별 Msg 4개',msgX+msgW/2,compact?offset+220:cy+Math.max(96,skin.lower+18),12,after?C.active:C.muted,'middle',false,{'data-role':'message-caption'});
    ring(ringX,ringY,radius,after,meta);
    const outletStart=ringX+radius+8,outletEnd=compact?width-18:width-10,boundaryX=compact?width-30:width-22,path=[[outletStart,ringY],[outletEnd,ringY]];
    meta.boundaryProgress=(boundaryX-outletStart)/(outletEnd-outletStart);
    pin(ringX+radius+2,ringY-1.5);wire(path,C.track,true,.8);
    txt('WSASend',(outletStart+boundaryX)/2,ringY-19,12,C.muted,'middle',true,{id:meta.outletLabel,'data-role':'outlet-label'});
    tag('path',{id:meta.kernelBoundary,d:`M${boundaryX} ${ringY-22} L${boundaryX} ${ringY+22}`,fill:'none',stroke:C.track,'stroke-width':1.5,'data-role':'kernel-boundary'});
    txt('커널',boundaryX-8,ringY+32,11,C.muted,'middle',false,{id:meta.kernelLabel,'data-role':'kernel-label'});
    meta.sourceBeams=inputPaths.map((p,i)=>makeBeam(p,sid(row,'source-beam',i)));
    meta.copyBeams=outputPaths.map((p,i)=>makeBeam(p,sid(row,'copy-beam',i)));
    meta.outletBeams=[makeBeam(path,sid(row,'outlet-beam',0),16,10)];
    out.push('</g>');
  }
  wire([[20,compact?414:298],[width-20,compact?414:298]],C.edge,false,.55);
  return {markup:out.join('\n'),width,height,compact,layout,labels,traces,rows};
}
function bundlePreviewFrame(program){
  const frame=bundleFrame(program.end,program);
  for(const row of frame.rows){row.release=0;row.requested=false;row.outlet={index:0,progress:.68,opacity:.8};}
  frame.phase='같은 이동 메시지 4개 · Msg 4개 → 1개';frame.preview=true;
  return frame;
}
