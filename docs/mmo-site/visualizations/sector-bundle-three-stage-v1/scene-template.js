function createBundleAnimationScene(width){
  width=Math.max(320,width);
  const kind='three-stage-v1',compact=width<680,height=compact?818:478;
  const C={bg:'var(--pcb-bg)',surface:'var(--pcb-surface)',edge:'var(--pcb-edge)',track:'var(--pcb-track)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',active:'var(--pcb-active)',soft:'var(--pcb-soft)',empty:'var(--pcb-empty)',pin:'var(--pcb-pin)'};
  const out=[],labels=[],traces=[],rows=[],actors=['1','2','3','4'];
  const sid=(row,name,index='')=>`three-motion-${row}-${name}${index}`;
  const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  function tag(name,attrs,body=''){out.push(`<${name} ${Object.entries(attrs).map(([key,value])=>`${key}="${escape(value)}"`).join(' ')}>${body}</${name}>`);}
  function box(x,y,w,h,fill=C.surface,stroke=null,extra={}){tag('rect',{x,y,width:w,height:h,fill,...(stroke?{stroke,'stroke-width':1}:{}),...extra});}
  function txt(label,x,y,size=12,color=C.text,anchor='middle',mono=false,extra={}){
    if(!extra['data-ink-copy'])labels.push({label,x,y,size,anchor});
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
  function packetFill(row,index,x,y,w,h){
    const key=sid(row,'packet',index),clip=key+'-clip',mask=key+'-mask';
    out.push(`<defs><clipPath id="${clip}"><rect id="${mask}" x="${x+1}" y="${y+1}" width="${w-2}" height="${h-2}"></rect></clipPath></defs>`);
    box(x+1,y+1,w-2,h-2,C.active,null,{'clip-path':`url(#${clip})`});
    return {clip,mask,width:w-2,base:key+'-base',normal:[],ink:[]};
  }
  function packetText(packet,label,x,y,size=12,color=C.text,mono=false){
    const n=packet.normal.length,id=packet.base+'-label'+n,ink=id+'-ink';
    txt(label,x,y,size,color,'middle',mono,{id});
    txt(label,x,y,size,C.bg,'middle',mono,{id:ink,'clip-path':`url(#${packet.clip})`,'data-ink-copy':true});
    packet.normal.push(id);packet.ink.push(ink);
  }
  function makeBeam(points,key){
    const length=points.slice(1).reduce((sum,p,i)=>sum+Math.abs(p[0]-points[i][0])+Math.abs(p[1]-points[i][1]),0);
    tag('path',{id:key+'-trace',d:points.map((p,i)=>`${i?'L':'M'}${p[0]} ${p[1]}`).join(' '),fill:'none',stroke:C.active,'stroke-width':1.5,'stroke-dasharray':`${length} ${length}`,'stroke-dashoffset':length,opacity:0,'data-role':'transfer-beam'});
    box(points[0][0]-3.5,points[0][1]-3.5,7,7,C.active,null,{id:key+'-head',opacity:0,'data-role':'data-pulse'});
    return {points,length,trace:key+'-trace',head:key+'-head'};
  }
  function polar(cx,cy,r,degrees){
    const angle=degrees*Math.PI/180;
    return [cx+Math.cos(angle)*r,cy+Math.sin(angle)*r];
  }
  function ringPath(cx,cy,outer,inner,a,b){
    const p1=polar(cx,cy,outer,a),p2=polar(cx,cy,outer,b),p3=polar(cx,cy,inner,b),p4=polar(cx,cy,inner,a);
    return `M${p1.join(',')} A${outer},${outer} 0 0 1 ${p2.join(',')} L${p3.join(',')} A${inner},${inner} 0 0 0 ${p4.join(',')} Z`;
  }
  function ring(cx,cy,r,after,rowMeta){
    const inner=r*.6;
    out.push(`<g data-role="recipient-ring" data-session="representative" data-enqueues="${after?1:4}" data-comparison="${after?'after':'before'}">`);
    for(let i=0;i<8;i++){
      const a=-180+i*45+1.3,b=a+42.4;
      if(after&&i<4)continue;
      tag('path',{d:ringPath(cx,cy,r,inner,a,b),fill:C.empty,stroke:C.edge,'stroke-width':.8,'data-role':i<4?'ring-track-region':'empty-ring-region'});
      if(i<4){
        const id=sid(rowMeta.row,'queue-fill',i);
        tag('path',{id,d:ringPath(cx,cy,r,inner,a,b),fill:C.active,stroke:C.edge,'stroke-width':.8,'data-role':'individual-msg-region','data-entry-count':1});
        rowMeta.queue.push({id,cx,cy,outer:r,inner,a,b});
      }
    }
    if(after){
      const id=sid(rowMeta.row,'queue-fill',0),a=-178.7,b=-1.3;
      tag('path',{d:ringPath(cx,cy,r,inner,a,b),fill:C.empty,stroke:C.edge,'stroke-width':.8});
      tag('path',{id,d:ringPath(cx,cy,r,inner,a,b),fill:C.active,stroke:C.edge,'stroke-width':.8,'data-role':'bundle-msg-region','data-entry-count':4});
      rowMeta.queue.push({id,cx,cy,outer:r,inner,a,b});
    }
    actors.forEach((actor,i)=>{
      const [x,y]=polar(cx,cy,(r+inner)/2,-180+i*45+22.5);
      const id=sid(rowMeta.row,'queue-label',i);rowMeta.queueLabels.push(id);
      txt(actor,x,y,12,C.bg,'middle',true,{id,'data-role':'ring-entry','data-move':actor});
    });
    txt(after?'묶음':'개별',cx,cy-5,14,C.text);
    txt(after?'Msg 1개':'Msg 4개',cx,cy+15,11,C.muted,'middle',true,{id:sid(rowMeta.row,'queue-count')});
    out.push('</g>');
  }
/* MAGE_RENDERER */
  box(0,0,width,height,C.bg);
  mageDefinition();
  for(let row=0;row<2;row++){
    const rowMeta={row,group:sid(row,'row'),matrix:sid(row,'gray-matrix'),packets:[],queue:[],queueLabels:[],sourceBeams:[],copyBeams:[],queueCount:sid(row,'queue-count')};
    rows.push(rowMeta);
    out.push(`<defs><filter id="${sid(row,'gray')}" color-interpolation-filters="sRGB"><feColorMatrix id="${rowMeta.matrix}" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"></feColorMatrix></filter></defs>`);
    out.push(`<g id="${rowMeta.group}" filter="url(#${sid(row,'gray')})" data-role="comparison-row" data-row="${row}">`);
    const after=row===1,offset=row*(compact?414:220),accent=after?C.active:C.track;
    const map={x:compact?24:54,y:offset+(compact?66:62),w:compact?128:144,h:compact?132:149};
    const msgW=112,ringR=64,gap=(width-108-map.w-msgW-ringR*2)/2;
    const msgX=compact?width-24-msgW:map.x+map.w+gap,msgY=offset+(compact?70:72),msgH=26,msgGap=34,packetHeight=128;
    const cy=offset+(compact?135:136),ringX=compact?width/2:msgX+msgW+gap+ringR,ringY=compact?offset+318:cy;
    const qX=ringX-ringR,qW=ringR*2;
    txt(after?'변경 후':'변경 전',compact?24:54,offset+(compact?20:29),14,after?C.active:C.muted,'start');
    const headerY=offset+(compact?48:50);
    txt('캐릭터 이동',map.x+map.w/2,headerY,12,C.muted);
    txt(after?'묶음 Msg':'이동 메시지',msgX+msgW/2,headerY,12,C.muted);
    txt('SendQ',ringX,compact?offset+236:headerY,12,C.muted);
    if(!compact){
      for(const x of [(map.x+map.w+msgX)/2-7,(msgX+msgW+qX)/2]){
        wire([[x,offset+45],[x,offset+116]],C.track,false,.12);
        wire([[x,offset+152],[x,offset+216]],C.track,false,.12);
      }
    }
    box(map.x,map.y,map.w,map.h,C.bg,C.edge,{rx:2.4,'data-role':'source-sector','data-comparison':after?'after':'before'});
    const grid={x:map.x+10,y:map.y+10,w:map.w-20,h:map.h-20},cellW=grid.w/3,cellH=grid.h/3;
    const coordinates=[[0,2],[0,1],[1,1],[1,0],[2,0]],positions=coordinates.map(([x,y])=>[grid.x+cellW*(x+.5),grid.y+cellH*(y+.5)]);
    const sourceCell=sid(row,'source-cell'),targetCell=sid(row,'target-cell');
    const drawCell=(index,id,opacity)=>box(grid.x+coordinates[index][0]*cellW+1,grid.y+coordinates[index][1]*cellH+1,cellW-2,cellH-2,C.soft,null,{id,opacity});
    drawCell(3,sourceCell,0);drawCell(4,targetCell,1);
    box(grid.x,grid.y,grid.w,grid.h,'none',C.edge,{'stroke-width':.8,opacity:.6});
    for(let i=1;i<3;i++){
      wire([[grid.x+cellW*i,grid.y],[grid.x+cellW*i,grid.y+grid.h]],C.edge,false,.6);
      wire([[grid.x,grid.y+cellH*i],[grid.x+grid.w,grid.y+cellH*i]],C.edge,false,.6);
    }
    const sprite=sid(row,'character'),face=sid(row,'character-face'),size=compact?27:30;
    out.push(`<g id="${sprite}" transform="translate(${positions[4][0]-positions[0][0]} ${positions[4][1]-positions[0][1]})">`);
    tag('use',{id:face,href:`#bundle-mage-${kind}-east`,transform:`translate(${positions[0][0]} ${positions[0][1]}) scale(${size/32})`,'data-character':'mage','data-facing':'east','data-actor':'player'});
    out.push('</g>');
    rowMeta.character={sprite,face,kind,size,positions,coordinates,directions:['north','east','north','east'],grid,cellW,cellH,sourceCell,targetCell};
    const msgCenters=Array.from({length:4},(_,i)=>msgY+i*msgGap+msgH/2);
    const entryCenters=Array.from({length:4},(_,i)=>msgY+47+i*19+9.5);
    const inputRail=compact?(map.x+map.w+msgX)/2:msgX-26;
    const outRail=compact?width-16:msgX+msgW+13;
    const queueLeft=qX-6;
    if(after){
      wire([[map.x+map.w,cy],[inputRail,cy]],C.track,false,.65);
      wire([[inputRail,entryCenters[0]],[inputRail,entryCenters[3]]],C.track,false,.65);
      for(const y of entryCenters)wire([[inputRail,y],[msgX-6,y]],C.track,true,.65);
      wire(compact?[[msgX+msgW+7,cy],[outRail,cy],[outRail,offset+220],[14,offset+220],[14,ringY],[queueLeft,ringY]]:[[msgX+msgW+7,cy],[queueLeft,cy]],accent,true);
    }else{
      wire([[map.x+map.w,cy],[inputRail,cy]],C.track,false,.65);
      wire([[inputRail,msgCenters[0]],[inputRail,msgCenters[3]]],C.track,false,.65);
      for(const y of msgCenters){
        wire([[inputRail,y],[msgX-6,y]],C.track,true,.65);
        wire([[msgX+msgW+7,y],[outRail,y]],C.track,false,.65);
      }
      wire([[outRail,msgCenters[0]],[outRail,msgCenters[3]]],C.track,false,.65);
      wire(compact?[[outRail,cy],[outRail,offset+220],[14,offset+220],[14,ringY],[queueLeft,ringY]]:[[outRail,cy],[queueLeft,cy]],C.track,true,.65);
    }
    if(after){
      box(msgX,msgY,msgW,packetHeight,C.surface,C.active,{id:sid(row,'packet','bundle')+'-base',rx:1.5,'data-role':'bundle-packet','data-count':4});
      box(msgX+1,msgY+1,msgW-2,25,C.soft);
      box(msgX+5,msgY+47,msgW-10,76,C.soft,null,{'data-role':'bundle-payload'});
      rowMeta.bundle=packetFill(row,'bundle',msgX,msgY,msgW,26);
      packetText(rowMeta.bundle,'Msg',msgX+msgW/2,msgY+13,13,C.text,true);
      rowMeta.bundleCount=sid(row,'bundle-count');
      txt('이동 4개',msgX+msgW/2,msgY+35,11,C.muted,'middle',false,{id:rowMeta.bundleCount});
      for(let i=0;i<4;i++){
        const y=msgY+47+i*19,entryW=msgW-10,index=`entry${i}`;
        out.push(`<g data-role="bundle-entry" data-move="${i+1}" data-x="${coordinates[i+1][0]}" data-y="${coordinates[i+1][1]}">`);
        box(msgX+5,y,entryW,19,C.soft,null,{id:sid(row,'packet',index)+'-base'});
        const packet=packetFill(row,index,msgX+5,y,entryW,19);
        packet.suppressStroke=true;packet.payload={move:i+1,x:coordinates[i+1][0],y:coordinates[i+1][1]};rowMeta.packets.push(packet);
        packetText(packet,`Msg ${actors[i]}`,msgX+5+entryW*.28,y+9.5,12,C.text,true);
        packetText(packet,coordinates[i+1].join(','),msgX+5+entryW*.76,y+9.5,11,C.muted,true);
        if(i)wire([[msgX+5,y],[msgX+msgW-5,y]],C.edge,false,.4);
        pin(msgX-6,y+8);out.push('</g>');
      }
      pin(msgX+msgW+2,cy-1.5);
    }else{
      for(let i=0;i<4;i++){
        const y=msgY+i*msgGap;
        messagePins(msgX,y,msgW,msgH);
        box(msgX,y,msgW,msgH,C.surface,C.edge,{id:sid(row,'packet',i)+'-base',rx:1.5,'data-role':'individual-packet','data-move':actors[i]});
        const packet=packetFill(row,i,msgX,y,msgW,msgH);packet.payload={move:i+1,x:coordinates[i+1][0],y:coordinates[i+1][1]};rowMeta.packets.push(packet);
        packetText(packet,`Msg ${actors[i]}`,msgX+msgW*.28,y+msgH/2,12,C.text,true);
        packetText(packet,coordinates[i+1].join(','),msgX+msgW*.76,y+msgH/2,11,C.muted,true);
      }
    }
    txt(after?'4개를 Msg 하나로':'이동마다 Msg',msgX+msgW/2,offset+(compact?208:212),11,after?C.active:C.muted);
    ring(ringX,ringY,ringR,after,rowMeta);
    const inputs=(after?entryCenters:msgCenters).map(y=>[[map.x+map.w,cy],[inputRail,cy],[inputRail,y],[msgX-6,y]]);
    const outputs=after?[compact?[[msgX+msgW+7,cy],[outRail,cy],[outRail,offset+220],[14,offset+220],[14,ringY],[queueLeft,ringY]]:[[msgX+msgW+7,cy],[queueLeft,cy]]]:msgCenters.map(y=>compact?[[msgX+msgW+7,y],[outRail,y],[outRail,offset+220],[14,offset+220],[14,ringY],[queueLeft,ringY]]:[[msgX+msgW+7,y],[outRail,y],[outRail,cy],[queueLeft,cy]]);
    rowMeta.sourceBeams=inputs.map((points,i)=>makeBeam(points,sid(row,'source-beam',i)));
    rowMeta.copyBeams=outputs.map((points,i)=>makeBeam(points,sid(row,'copy-beam',i)));
    out.push('</g>');
  }
  wire([[24,compact?400:226],[width-24,compact?400:226]],C.edge,false,.55);
  txt('한 캐릭터 · 4칸 이동',24,height-14,11,C.muted,'start');
  txt(compact?'같은 4개 · Msg 하나로':'같은 이동 메시지 4개 · Msg 하나로 묶기',width-24,height-14,11,C.muted,'end');
  return {markup:out.join('\n'),width,height,compact,labels,traces,rows};
}
