function createBundleAnimationScene(width){
  width=Math.max(320,width);
  const kind='single-character-v1',compact=width<680,height=compact?818:478;
  const C={bg:'var(--pcb-bg)',surface:'var(--pcb-surface)',edge:'var(--pcb-edge)',track:'var(--pcb-track)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',active:'var(--pcb-active)',soft:'var(--pcb-soft)',empty:'var(--pcb-empty)',pin:'var(--pcb-pin)'};
  const out=[],labels=[],traces=[],rows=[],actors=['1','2','3','4'];
  const sid=(row,name,index='')=>`single-motion-${row}-${name}${index}`;
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
  function countPins(x,y,w,h){
    for(let i=0;i<4;i++){
      const py=y+14+i*(h-28)/3;
      pin(x-6,py);pin(x+w+2,py);
      const px=x+15+i*(w-30)/3;
      pin(px,y-6,3,4);pin(px,y+h+2,3,4);
    }
  }
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
      tag('path',{d:ringPath(cx,cy,r,inner,a,b),fill:C.empty,stroke:C.edge,'stroke-width':.8,'data-role':i<4?'ring-track-region':'empty-ring-region'});
      if(after?i===0:i<4){
        const id=sid(rowMeta.row,'queue-fill',i);
        tag('path',{id,d:ringPath(cx,cy,r,inner,a,b),fill:C.active,stroke:C.edge,'stroke-width':.8,opacity:0,'data-role':after?'final-state-region':'individual-msg-region','data-entry-count':1});
        rowMeta.queue.push({id,cx,cy,outer:r,inner,a,b});
      }
    }
    (after?['4']:actors).forEach((actor,i)=>{
      const [x,y]=polar(cx,cy,(r+inner)/2,-180+i*45+22.5);
      const id=sid(rowMeta.row,'queue-label',i);rowMeta.queueLabels.push(id);
      txt(actor,x,y,11,C.muted,'middle',true,{id,opacity:.42,'data-role':'ring-entry','data-move':actor});
    });
    txt(after?'최종':'개별',cx,cy-5,14,C.text);
    txt('비움',cx,cy+15,11,C.muted,'middle',true,{id:sid(rowMeta.row,'queue-count')});
    out.push('</g>');
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

  box(0,0,width,height,C.bg);
  mageDefinition();
  for(let row=0;row<2;row++){
    const rowMeta={row,group:sid(row,'row'),matrix:sid(row,'gray-matrix'),packets:[],queue:[],queueLabels:[],sourceBeams:[],copyBeams:[],sendBeams:[],queueCount:sid(row,'queue-count'),requestState:sid(row,'request-state'),requestLed:sid(row,'request-led')};
    rows.push(rowMeta);
    out.push(`<defs><filter id="${sid(row,'gray')}" color-interpolation-filters="sRGB"><feColorMatrix id="${rowMeta.matrix}" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"></feColorMatrix></filter></defs>`);
    out.push(`<g id="${rowMeta.group}" filter="url(#${sid(row,'gray')})" data-role="comparison-row" data-row="${row}">`);
    const after=row===1,offset=row*(compact?414:220),accent=after?C.active:C.track;
    const delta=width-736;
    const map={x:compact?24:54,y:offset+(compact?66:62),w:compact?128:144,h:compact?132:149};
    const msgX=compact?width-24-112:254+delta/3,msgY=offset+(compact?70:72),msgW=compact?112:92,msgH=26,msgGap=34,packetHeight=128;
    const cy=offset+(compact?135:136),ringX=compact?88:473+delta*2/3,ringY=compact?offset+318:cy,ringR=58;
    const qX=ringX-ringR,qW=ringR*2;
    const countX=width-(compact?24:32)-102,countY=ringY-48,countW=102,countH=96;
    txt(after?'변경 후':'변경 전',compact?24:54,offset+(compact?20:29),14,after?C.active:C.muted,'start');
    const headerY=offset+(compact?48:50);
    txt('캐릭터 이동',map.x+map.w/2,headerY,12,C.muted);
    txt(after?'묶음 Msg':'이동 메시지',msgX+msgW/2,headerY,12,C.muted);
    txt('SendQ',ringX,compact?offset+236:headerY,12,C.muted);
    txt('WSASend',countX+countW/2,compact?offset+236:headerY,12,C.muted);
    if(!compact){
      for(const x of [(map.x+map.w+msgX)/2-7,(msgX+msgW+qX)/2,(qX+qW+countX)/2]){
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
    const inputRail=compact?(map.x+map.w+msgX)/2:msgX-26;
    const outRail=compact?width-16:msgX+msgW+13;
    const queueLeft=qX-6;
    if(after){
      wire([[map.x+map.w,cy],[inputRail,cy],[msgX-6,cy]],C.track,true,.65);
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
      box(msgX,msgY,msgW,packetHeight,C.surface,C.active,{id:sid(row,'packet',0)+'-base',rx:1.5,'data-role':'bundle-packet','data-count':1});
      box(msgX+1,msgY+1,msgW-2,25,C.soft);
      box(msgX+5,msgY+47,msgW-10,76,C.soft,null,{'data-role':'bundle-payload'});
      const packet=packetFill(row,0,msgX,msgY,msgW,packetHeight);rowMeta.packets.push(packet);
      packetText(packet,'Msg',msgX+msgW/2,msgY+13,13,C.text,true);
      packetText(packet,'헤더 · 1명',msgX+msgW/2,msgY+35,11,C.muted);
      out.push('<g data-role="bundle-entry" data-actor="player">');
      packetText(packet,'최종 위치',msgX+msgW/2,msgY+63,11,C.muted);
      packetText(packet,'(2, 0)',msgX+msgW/2,msgY+87,18,C.text,true);
      packetText(packet,'방향 →',msgX+msgW/2,msgY+110,11,C.muted);
      out.push('</g>');
      for(let i=0;i<4;i++){pin(msgX-6,msgY+13+i*29);pin(msgX+msgW+2,msgY+13+i*29);}
    }else{
      for(let i=0;i<4;i++){
        const y=msgY+i*msgGap;
        messagePins(msgX,y,msgW,msgH);
        box(msgX,y,msgW,msgH,C.surface,C.edge,{id:sid(row,'packet',i)+'-base',rx:1.5,'data-role':'individual-packet','data-move':actors[i]});
        const packet=packetFill(row,i,msgX,y,msgW,msgH);rowMeta.packets.push(packet);
        packetText(packet,`Msg ${actors[i]}`,msgX+msgW*.28,y+msgH/2,12,C.text,true);
        packetText(packet,coordinates[i+1].join(','),msgX+msgW*.76,y+msgH/2,11,C.muted,true);
      }
    }
    txt(after?'틱 끝 · 최종 위치':'이동마다 Msg',msgX+msgW/2,offset+(compact?208:212),11,after?C.active:C.muted);
    ring(ringX,ringY,ringR,after,rowMeta);
    // WSASend posts the queued bytes to the kernel; receiver delivery is not shown.
    countPins(countX,countY,countW,countH);
    box(countX,countY,countW,countH,after?C.soft:C.surface,after?C.active:C.edge,{rx:2.8});
    box(countX+countW/2-3,countY+24,6,6,C.active,null,{id:rowMeta.requestLed,'data-role':'request-led'});
    txt('요청됨',countX+countW/2,countY+52,16,after?C.active:C.text,'middle',false,{id:rowMeta.requestState,'data-role':'request-state'});
    txt('커널 요청',countX+countW/2,countY+countH-14,11,C.muted);
    const sendPath=[[ringX+ringR+6,ringY],[countX-7,ringY]];wire(sendPath,accent,true);
    const inputs=after?[[[map.x+map.w,cy],[inputRail,cy],[msgX-6,cy]]]:msgCenters.map(y=>[[map.x+map.w,cy],[inputRail,cy],[inputRail,y],[msgX-6,y]]);
    const outputs=after?[compact?[[msgX+msgW+7,cy],[outRail,cy],[outRail,offset+220],[14,offset+220],[14,ringY],[queueLeft,ringY]]:[[msgX+msgW+7,cy],[queueLeft,cy]]]:msgCenters.map(y=>compact?[[msgX+msgW+7,y],[outRail,y],[outRail,offset+220],[14,offset+220],[14,ringY],[queueLeft,ringY]]:[[msgX+msgW+7,y],[outRail,y],[outRail,cy],[queueLeft,cy]]);
    rowMeta.sourceBeams=inputs.map((points,i)=>makeBeam(points,sid(row,'source-beam',i)));
    rowMeta.copyBeams=outputs.map((points,i)=>makeBeam(points,sid(row,'copy-beam',i)));
    rowMeta.sendBeams=[makeBeam(sendPath,sid(row,'send-beam',0))];
    out.push('</g>');
  }
  wire([[24,compact?400:226],[width-24,compact?400:226]],C.edge,false,.55);
  txt('한 캐릭터 · 4칸 이동',24,height-14,11,C.muted,'start');
  txt(compact?'Msg 4개 → 최종 Msg 1개':'중간 위치 Msg 4개 → 최종 위치 Msg 1개',width-24,height-14,11,C.muted,'end');
  return {markup:out.join('\n'),width,height,compact,labels,traces,rows};
}

function bundleClamp(value,min=0,max=1){return Math.min(max,Math.max(min,value));}
function bundleEase(value){const p=bundleClamp(value);return p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;}
function createBundleProgram(compact=false){
  const segments=[];let cursor=0;
  const actors=['1','2','3','4'],input=compact?1000:650,copy=compact?1600:900;
  function add(row,phase,duration,actor=-1){
    const name=row===0?'변경 전':'변경 후',subject=actor>=0?`이동 ${actors[actor]} · `:'';
    const captions={warm:'이동 준비',move:subject+'한 칸 이동',source:row===0?subject+'좌표 전달':'틱 끝 · 최종 좌표 전달',message:row===0?`Msg ${actors[actor]} 생성`:'틱 끝 · 최종 위치 Msg 생성',copy:row===0?`Msg ${actors[actor]} → SendQ`:'최종 Msg → SendQ',queue:'SendQ에 쌓기',hold:row===0?'Msg 적재 완료':subject+'마지막 위치 기록',tick:row===0?'틱 끝 · 큐에 쌓인 Msg 전달':'틱 끝 · 마지막 위치만 확정',send:'WSASend 호출 · 커널에 요청',flush:'요청한 데이터는 SendQ에서 비우기',rowEnd:'송신 요청 완료',switch:'변경 후 · 같은 경로 다시 이동',compare:'완료 · 같은 최종 위치 · Msg 4개 → 1개'};
    const label=phase==='switch'||phase==='compare'?captions[phase]:`${name} · ${captions[phase]}`;
    segments.push({id:`${row}-${phase}-${actor}-${segments.length}`,row,phase,actor,start:cursor,end:cursor+duration,duration,label});cursor+=duration;
  }
  add(0,'warm',350);
  for(let actor=0;actor<4;actor++){
    add(0,'move',650,actor);add(0,'source',input,actor);add(0,'message',650,actor);
    add(0,'copy',copy,actor);add(0,'queue',650,actor);add(0,'hold',300,actor);
  }
  add(0,'tick',400);add(0,'send',650);add(0,'flush',650);add(0,'rowEnd',600);add(1,'switch',650);add(1,'warm',300);
  for(let actor=0;actor<4;actor++){add(1,'move',650,actor);add(1,'hold',250,actor);}
  add(1,'tick',400);add(1,'source',input);add(1,'message',650);add(1,'hold',250);
  add(1,'copy',copy);add(1,'queue',650);add(1,'send',650);add(1,'flush',650);add(1,'rowEnd',700);add(1,'compare',650);
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
  const makeRow=()=>({moves:[0,0,0,0],packets:[0,0,0,0],queue:[0,0,0,0],source:null,copy:null,send:null,drain:0,sent:false,request:'대기',opacity:1,gray:0,focus:-1,copies:0});
  const rows=[makeRow(),makeRow()];rows[1].opacity=.28;rows[1].gray=1;
  for(let index=0;index<=position.index;index++){
    const segment=program.segments[index],raw=index===position.index?position.progress:1,p=bundleEase(raw),row=rows[segment.row],live=index===position.index&&t<program.end;
    if(segment.phase==='move'){row.moves[segment.actor]=p;if(live)row.focus=segment.actor;}
    if(segment.phase==='message')row.packets[segment.row===0?segment.actor:0]=p;
    if(segment.phase==='queue')row.queue[segment.row===0?segment.actor:0]=p;
    if(segment.phase==='send'){row.request=raw<1?'호출':'요청됨';row.sent=raw>=1;}
    if(segment.phase==='flush'){row.drain=p;row.request='요청됨';row.sent=true;}
    if(segment.phase==='switch'){
      rows[0].opacity=1-.72*p;rows[0].gray=p;rows[1].opacity=.28+.72*p;rows[1].gray=1-p;
    }
    if(segment.phase==='compare'){rows[0].opacity=.28+.72*p;rows[0].gray=1-p;}
    if(live){
      const beamIndex=segment.row===0?segment.actor:0;
      if(segment.phase==='source')row.source={index:beamIndex,progress:p,opacity:1};
      if(segment.phase==='message')row.source={index:beamIndex,progress:1,opacity:1-p};
      if(segment.phase==='copy')row.copy={index:beamIndex,progress:p,opacity:1};
      if(segment.phase==='queue')row.copy={index:beamIndex,progress:1,opacity:1-p};
      if(segment.phase==='send')row.send={index:0,progress:p,opacity:1};
      if(segment.phase==='flush')row.send={index:0,progress:1,opacity:1-p};
    }
  }
  rows[0].copies=rows[0].queue.filter(value=>value>=1).length;
  rows[1].copies=rows[1].queue[0]>=1?1:0;
  const phase=t>=program.end?'완료 · 같은 최종 위치 · Msg 4개 → 1개':current.label;
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
  const lengths=points.slice(1).map((p,i)=>Math.abs(p[0]-points[i][0])+Math.abs(p[1]-points[i][1]));
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
    set(character.face,{href:`#bundle-mage-${character.kind}-${pose.direction}`,'data-facing':pose.direction});
    for(const [id,index,opacity] of [[character.sourceCell,pose.step,1-pose.progress],[character.targetCell,pose.step+1,pose.progress]]){
      const [x,y]=character.coordinates[index];set(id,{x:character.grid.x+x*character.cellW+1,y:character.grid.y+y*character.cellH+1,opacity});
    }
    meta.packets.forEach((packet,index)=>{
      const p=state.packets[index];set(packet.mask,{width:packet.width*p});
      set(packet.base,{stroke:p>0?'var(--pcb-active)':'var(--pcb-edge)'});
      packet.normal.forEach((id,labelIndex)=>set(id,{opacity:rowIndex===1&&labelIndex>=2?p:.38+.62*p}));packet.ink.forEach(id=>set(id,{opacity:p>0?1:0}));
    });
    meta.queue.forEach((region,index)=>set(region.id,{d:bundleArc(region,state.queue[index]),opacity:state.queue[index]>0?1-state.drain:0}));
    meta.queueLabels.forEach((id,index)=>{
      const filled=state.queue[index]>=.55&&state.drain<.95;
      set(id,{fill:filled?'var(--pcb-bg)':'var(--pcb-muted)',opacity:filled?.42+.58*(1-state.drain):.42});
    });
    set(meta.queueCount,{},state.drain>=1?'비움':`Msg ${state.copies}개`);
    set(meta.requestState,{},state.request);set(meta.requestLed,{opacity:state.request==='대기'?.16:1});
    for(const [beams,active] of [[meta.sourceBeams,state.source],[meta.copyBeams,state.copy],[meta.sendBeams,state.send]])beams.forEach((beam,index)=>{
      const selected=active&&index===active.index,p=selected?active.progress:0,opacity=selected?active.opacity:0;
      const [x,y]=bundlePathPoint(beam.points,p);
      set(beam.trace,{'stroke-dashoffset':beam.length*(1-p),opacity:.8*opacity});
      set(beam.head,{x:x-3.5,y:y-3.5,opacity:p>0&&p<1?opacity:0});
    });
  }
}
