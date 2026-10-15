function createBundleAnimationScene(width,layout='silkscreen',routing='chamfer',material='minimal'){
  width=Math.max(320,width);
  if(layout!=='silkscreen'||routing!=='chamfer'||material!=='minimal')throw Error('Unsupported design');
  const kind='wsasend-ring-color-'+material+'-'+routing+'-'+layout,compact=width<700,height=compact?1080:548;
  const skin={fill:'soft',housing:false};
  const C={focus:'var(--pcb-data-focus)',bg:'var(--pcb-bg)',surface:'var(--pcb-surface)',edge:'var(--pcb-edge)',track:'var(--pcb-track)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',active:'var(--pcb-active)',soft:'var(--pcb-soft)',empty:'var(--pcb-empty)',pin:'var(--pcb-pin)'};
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
    const filledStyle={fill:C.focus,'fill-opacity':.28};
    const addRegion=(index,a,b,role)=>{
      const id=sid(meta.row,'queue-fill',index);
      tag('path',{id,d:ringPath(cx,cy,r,inner,a,b),...filledStyle,'data-role':role,...(after?{'data-entry-count':4}:{})});
      meta.queue.push({id,cx,cy,outer:r,inner,a,b});
      const rim=sid(meta.row,'queue-rim',index);meta.queueRims.push(rim);
      tag('path',{id:rim,d:ringPath(cx,cy,r,inner,a,b),fill:'none',stroke:C.focus,'stroke-width':1.5,opacity:0,'data-role':'queue-lit-outline'});
      if(material==='band'){
        const bandId=sid(meta.row,'queue-band',index),band={id:bandId,cx,cy,outer:r,inner:r-3,a,b};
        tag('path',{id:bandId,d:ringPath(cx,cy,r,r-3,a,b),fill:C.focus,'data-role':'occupied-outer-band'});meta.queueBands.push(band);
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
  function mageDefinition(){
    const palette={o:"var(--pcb-char-ink)",l:"var(--pcb-char-steel)",m:"var(--pcb-char-steel)",d:"var(--pcb-char-steel-dark)",a:C.active,b:C.active,c:"var(--pcb-char-blue-mid)",v:"var(--pcb-char-blue-dark)",s:"var(--pcb-char-skin)",t:"var(--pcb-char-skin-dark)"};
    const pixels=["                                ","                   oooo         ","                  occvo         ","                 occvvo         ","                occcvoo         ","    oo         occcvvo          ","   oooo       occcvvvo          ","  ooacoo     occcvvvvv          ","  oalacoo    occcvvvvao         ","  oalaaco   occcvvvvaaao        ","  ocaacco   occcvvvvvavvo       ","  occccoo  occcvvvvvvvvvo       ","   occoo oobbbbbbbbbbbbbboooo   ","    oooooocccccccccccccccccco   ","    ooo oooooooooooooooooooooo  ","    omo    ooosssssssstoo       ","    omo    ooosoossssoooo       ","    ddo    ooottttttttto        ","    omo     omlmttmmmllm        ","    omo     ommlldddlllmo       ","    omo   oooomlllmmllmooo      ","    omoocccooomlllllllmvooo     ","    omssccccovmmllllllmvcco     ","    omssccccovcmlllllmmocco     ","    omooccooovcmmlllmmvoccoo    ","    omooooooovccmmlmmvvooss     ","    omo  ooooccccmmbavvvoo      ","    omo   oovbccccvbavvvvoo     ","    omo   oovbccccvbavvvvoo     ","    omo  oovvbccccvbavvvvvoo    ","    omo  oovcbccccvbavvvvvoo    ","    omo oovccccccccccccccccoo   ","    omo oooddddddddddddddddo    ","    omo  oooooooooooooooooo     ","    ooo     ddddo    odddd      ","                                "];
    const south=pixels.slice();
    south[33]="    omo   oooooooo  ooooooo";
    south[34]="    ooo    ddddo    oddddoo";
    south[35]="                    oddddo";
    const north=pixels.slice();
    const back=[
      "    omo     oovvvvvvvvvo",
      "    omo     oovvvvvvvvvo",
      "    ddo     ooovvvvvvooo",
      "    omo      ovvvvcccvo",
      "    omo     oovvvvcccvvo",
      "    omo   oooovvvvcccvvooo",
      "    omoocccooovvvvccccvvooo",
      "    omssccccovvvvcccccvccto",
      "    omssccccovvvvcccccvccto",
      "    omooccooovvvvcccccvocoo",
      "    omooooooovvvvcccccvvooss",
      "    omo  oooovvvvcccccvvvoo",
      "    omo   oovbvvvcccccvvvvoo",
      "    omo   oovbvvvcccccvvvvoo",
      "    omo  oovvbvvvcccccvvvvvoo",
      "    omo  oovcbvvvcccccvvvvvoo",
      "    omo oovccvvvvccccccccccoo",
      "    omo oooddddddddddddddddo",
      "    omo  oooooooo  ooooooooo",
      "    ooo    ddddo    oddddoo",
      "                    oddddo"
    ];
    back.forEach((row,i)=>north[15+i]=row.padEnd(32," "));
    const east=[
      "",
      "                    oooo",
      "                   occvo",
      "                  occvvo",
      "                 occcvoo",
      "                occcvvo",
      "               occcvvvo",
      "              occcvvvvo",
      "             occcvvvvao",
      "             occcvvvaao",
      "            occcvvvavvo",
      "            occcvvvvvvo",
      "          oobbbbbbbbbbboooo",
      "         occcccccccccccccco",
      "          oooooooooooooooo",
      "             oovossssto",
      "             oovossoosto",
      "             oovottttttso",
      "             oovomllmttto",
      "              oomllllmmo",
      "             oovvmllllmo     oo",
      "            oovvccmlllmo    oaco",
      "            ovvcccmllmo    oalaco",
      "           oovvcccmmlmoo   occco",
      "           ovvcccccmvcsso   omo",
      "           ovvcccccvvcsssoo omo",
      "           ovvccccvvvoccoo omo",
      "          oovvccccvvvvo    omo",
      "          ovvcccccavvvo    omo",
      "         oovvcccccavvvvo   omo",
      "         ovvccccccavvvvo   omo",
      "        oovvccccccavvvvvo  omo",
      "        oodddddddddddddoo  omo",
      "         oooooooo ooooooo  omo",
      "         oddddo    oddddoo ooo",
      "                   oddddo"
    ].map(row=>row.padEnd(32," ").slice(0,32));
    const views={south,north,east,west:east.map(row=>row.split("").reverse().join(""))};
    out.push("<defs>");
    for(const [direction,rows] of Object.entries(views)){
      out.push(`<g id="bundle-mage-${kind}-${direction}" shape-rendering="crispEdges">`);
      rows.forEach((row,y)=>{
        for(let x=0;x<32;){
          let end=x+1;while(end<32&&row[end]===row[x])end++;
          if(palette[row[x]])box(x-16,y-20,end-x,1,palette[row[x]]);
          x=end;
        }
      });
      out.push("</g>");
    }
    out.push("</defs>");
  }
  function mage(x,y,size=40,direction="south",actor=""){
    tag("use",{href:`#bundle-mage-${kind}-${direction}`,transform:`translate(${x} ${y}) scale(${size/32})`,"data-character":"mage","data-facing":direction,"data-actor":actor});
  }
  function movement(x,y,size,direction){
    const side=size*.60,tip=size*.74;
    if(direction==="east")wire([[x+size*.42,y+13],[x+tip,y+13]],C.track,true);
    else if(direction==="west")wire([[x-size*.42,y+13],[x-tip,y+13]],C.track,true);
    else if(direction==="north")wire([[x+side,y+13],[x+side,y-11]],C.track,true);
    else wire([[x+side,y-11],[x+side,y+13]],C.track,true);
  }

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
    const meta={row,group:sid(row,'row'),matrix:sid(row,'gray-matrix'),packets:[],messages:[],queue:[],queueRims:[],queueBands:[],queueInk:C.text,queueLabels:[],sourceBeams:[],copyBeams:[],outletBeams:[],outletLight:sid(row,'outlet-light'),callCount:sid(row,'call-count'),outletLabel:sid(row,'outlet-label'),kernelBoundary:sid(row,'kernel-boundary'),kernelLabel:sid(row,'kernel-label'),queueCount:sid(row,'queue-count')};rows.push(meta);
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
    tag('path',{id:meta.outletLight,d:`M${start} ${ringY} L${end} ${ringY}`,fill:'none',stroke:C.active,'stroke-width':1.5,opacity:0,'data-role':'outlet-lit-trace'});
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

function bundleClamp(value,min=0,max=1){return Math.min(max,Math.max(min,value));}
function bundlePreviewFrame(program){
  const frame=bundleFrame(program.end,program);
  frame.phase='같은 Msg 4개 · WSASend 4회 → 1회';frame.preview=true;
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
