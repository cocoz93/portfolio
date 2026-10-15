const DIGEST_ITEMS=9,DIGEST_RESIDENTS=2;
function createDigestProgram(){
  const segments=[];let end=0;
  function add(row,phase,ms,item=-1,recipient=-1){const duration=ms/(row===0?1.25:1);segments.push({row,phase,item,recipient,start:end,end:end+duration});end+=duration;}
  for(let item=0;item<DIGEST_ITEMS;item++){
    add(0,'select',300,item);
    for(let recipient=0;recipient<DIGEST_RESIDENTS;recipient++){add(0,'deliver',500,item,recipient);add(0,'hold',450,item,recipient);}
  }
  add(0,'done',375);add(1,'prepare',400);
  for(let item=0;item<DIGEST_ITEMS;item++){add(1,'concat',500,item);add(1,'joined',120,item);}
  add(1,'digest-ready',900);
  for(let recipient=0;recipient<DIGEST_RESIDENTS;recipient++){add(1,'deliver',750,-1,recipient);add(1,'hold',900,-1,recipient);}
  add(1,'done',700);add(2,'restore',400);
  return {segments,end};
}
function digestFrame(time,program){
  const clamp=v=>Math.max(0,Math.min(1,v)),rows=[0,1].map(()=>({built:Array(9).fill(1),joined:Array(9).fill(0),queues:[Array(9).fill(0),Array(9).fill(0)],calls:[0,0],activeItem:-1,recipient:-1,phase:'idle',progress:0}));let current=null;
  for(const s of program.segments){
    if(time<s.start)break;const progress=clamp((time-s.start)/(s.end-s.start)),complete=time>=s.end;
    if(s.row<2){const r=rows[s.row];if(s.phase==='concat')r.joined[s.item]=progress;
      if(s.phase==='deliver'&&complete){r.calls[s.recipient]++;if(s.row===0)r.queues[s.recipient][s.item]=1;else r.queues[s.recipient]=Array(9).fill(1);}
    }
    if(!complete){current={...s,progress};break;}
  }
  if(current&&current.row<2){const r=rows[current.row];r.phase=current.phase;r.progress=current.progress;r.activeItem=current.item;r.recipient=current.recipient;}
  const done=time>=program.end,activeRow=done?-1:current?.row??-1;let phase='완료 · 예시: 같은 9패킷 · 세션당 적재 9회 → 1회';
  if(current&&current.row<2){const who=current.row===0?'변경 전':'변경 후',item=current.item>=0?'Msg '+(current.item+1):'Digest',recipient=current.recipient>=0?'S'+(current.recipient+1):'';
    const actions={select:item+' 선택',prepare:'R의 유효섹터 9칸 확인',concat:item+' 바이트 모으기',joined:item+' 연접 완료','digest-ready':'R 섹터 Digest 1개 완성',deliver:recipient+' SendQ에 '+item+' 복사',hold:recipient+' 적재 완료',done:'완료'};phase=who+' · '+actions[current.phase];
  }else if(!done)phase='전·후 결과 비교';
  return {rows,current,done,activeRow,phase};
}
function digestPoint(points,progress){
  const distances=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1])),total=distances.reduce((a,b)=>a+b,0);let left=total*Math.max(0,Math.min(1,progress));
  for(let i=0;i<distances.length;i++){if(left<=distances[i]||i===distances.length-1){const t=distances[i]?left/distances[i]:0;return [points[i][0]+(points[i+1][0]-points[i][0])*t,points[i][1]+(points[i+1][1]-points[i][1])*t];}left-=distances[i];}return points[0];
}
function createDigestScene(width){
  width=Math.max(320,Math.round(width));const compact=width<700,rowHeight=compact?938:410,height=rowHeight*2+52,kind='digest-four';
  const C={bg:'var(--pcb-bg)',surface:'var(--pcb-surface)',edge:'var(--pcb-edge)',track:'var(--pcb-track)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',active:'var(--pcb-active)',empty:'var(--pcb-empty)',pin:'var(--pcb-pin)'};
  const out=[],labels=[],bounds=[],rows=[],paths=[],sid=k=>kind+'-'+k;
  const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  function tag(name,attrs,body=''){out.push(`<${name} ${Object.entries(attrs).map(([k,v])=>`${k}="${esc(v)}"`).join(' ')}>${body}</${name}>`);}
  function box(x,y,w,h,fill=C.surface,stroke=null,attrs={}){tag('rect',{x,y,width:w,height:h,fill,...(stroke?{stroke,'stroke-width':1.5}:{}),...attrs});}
  function txt(text,x,y,size=14,color=C.text,anchor='middle',attrs={}){labels.push({text,x,y,size,anchor,local:attrs['data-local']==='true'});tag('text',{x,y,'font-size':size,'dominant-baseline':'middle','text-anchor':anchor,fill:color,...attrs},esc(text));}
  function wire(points,color=C.track,attrs={}){for(let i=1;i<points.length;i++)if(points[i][0]!==points[i-1][0]&&points[i][1]!==points[i-1][1])throw Error('Non-orthogonal circuit');paths.push(points);tag('path',{d:points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' '),fill:'none',stroke:color,'stroke-width':1.5,...attrs});}
  function contact(x,y){tag('circle',{cx:x,cy:y,r:2.5,fill:C.pin});tag('circle',{cx:x,cy:y,r:1.05,fill:C.bg});}
  function arrow(points,key){wire(points,C.track,{opacity:.75});const [x,y]=points.at(-1),[px,py]=points.at(-2),dx=Math.sign(x-px),dy=Math.sign(y-py);tag('polygon',{points:`${x},${y} ${x-dx*6-dy*3},${y-dy*6+dx*3} ${x-dx*6+dy*3},${y-dy*6-dx*3}`,fill:C.track});}
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
  function swordsmanDefinition(){
    const palette={o:'var(--pcb-char-ink)',l:'var(--pcb-char-steel)',m:'var(--pcb-char-steel-mid)',d:'var(--pcb-char-steel-dark)',a:C.active,b:C.active,c:'var(--pcb-char-blue-mid)',v:'var(--pcb-char-blue-dark)',s:'var(--pcb-char-skin)',t:'var(--pcb-char-skin-dark)',h:'var(--pcb-char-hair)'};
    const grid=Array.from({length:36},()=>Array(32).fill(' '));
    function r(x,y,w,h,c){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(grid[yy]&&xx>=0&&xx<32)grid[yy][xx]=c;}
    function p(points,c){const xs=points.map(a=>a[0]),ys=points.map(a=>a[1]);for(let y=Math.min(...ys);y<Math.max(...ys);y++)for(let x=Math.min(...xs);x<Math.max(...xs);x++){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y+.5)!==(b[1]>y+.5)&&(x+.5)<(b[0]-a[0])*(y+.5-a[1])/(b[1]-a[1])+a[0])inside=!inside;}if(inside)r(x,y,1,1,c);}}
    p([[9,16],[23,16],[27,28],[23,32],[15,29],[9,32],[5,29]],'o');p([[10,17],[22,17],[25,28],[22,30],[15,27],[9,30],[7,28]],'v');r(8,20,2,7,'c');r(10,19,2,5,'b');r(23,23,1,5,'c');
    r(12,26,5,6,'o');r(19,26,5,6,'o');r(13,27,3,5,'d');r(20,27,3,5,'d');r(11,32,6,2,'o');r(18,32,6,2,'o');r(12,32,4,1,'m');r(19,32,4,1,'m');
    p([[10,17],[24,17],[27,20],[25,25],[23,26],[22,28],[12,28],[11,25],[8,23],[8,20]],'o');r(12,18,11,7,'d');r(13,18,8,5,'m');r(13,18,3,3,'l');r(12,24,11,2,'v');r(12,26,11,1,'d');r(17,24,2,2,'m');p([[9,18],[12,18],[13,21],[11,23],[9,22]],'m');r(9,18,3,1,'l');p([[22,18],[25,18],[26,21],[24,23],[22,21]],'m');r(22,18,3,1,'l');
    r(15,14,6,4,'o');r(16,15,4,3,'t');r(12,17,10,2,'b');r(13,17,5,1,'a');r(19,19,2,4,'c');
    p([[10,6],[13,3],[22,3],[25,6],[25,12],[23,16],[20,18],[14,17],[11,14],[9,11]],'o');p([[12,7],[22,7],[24,10],[22,15],[19,17],[14,16],[11,13]],'t');r(12,8,11,5,'s');r(14,13,7,3,'s');r(12,11,2,2,'t');r(22,11,1,2,'t');
    p([[11,4],[15,2],[16,3],[23,2],[22,4],[25,5],[26,8],[24,10],[22,8],[19,9],[19,6],[16,8],[13,7],[11,10],[9,9],[10,7]],'h');r(12,4,4,1,'d');r(17,4,6,1,'d');r(12,10,1,2,'h');r(23,9,1,3,'h');r(14,10,2,2,'o');r(20,10,2,2,'o');r(14,10,1,1,'l');r(20,10,1,1,'l');r(17,15,3,1,'t');
    p([[29,10],[31,13],[31,27],[29,28],[28,26],[28,13]],'o');r(29,13,1,14,'l');r(30,14,1,13,'m');r(26,28,7,2,'o');r(27,28,5,1,'m');r(29,30,2,4,'o');r(29,30,1,3,'d');r(24,23,3,3,'o');r(25,23,2,2,'m');
    out.push(`<defs><g id="bundle-swordsman-${kind}-south" shape-rendering="crispEdges">`);
    grid.forEach((row,y)=>{for(let x=0;x<32;){let end=x+1;while(end<32&&row[end]===row[x])end++;if(palette[row[x]])box(x-16,y-20,end-x,1,palette[row[x]]);x=end;}});
    out.push('</g></defs>');
  }
  function swordsman(x,y,size,actor){
    tag('use',{href:`#bundle-swordsman-${kind}-south`,transform:`translate(${x} ${y}) scale(${size/32})`,'data-character':'swordsman','data-facing':'south','data-actor':actor});
  }

  function mage(x,y,size=40,direction="south",actor=""){
    tag("use",{href:`#bundle-mage-${kind}-${direction}`,transform:`translate(${x} ${y}) scale(${size/32})`,id:sid(actor+'-character'),"data-character":"mage","data-facing":direction,"data-actor":actor});
  }


  box(0,0,width,height,C.bg);swordsmanDefinition();
  for(let row=0;row<2;row++){
    const after=row===1,key=after?'after':'before',oy=row*rowHeight;
    const grid={x:compact?(width-180)/2:24,y:oy+(compact?100:126),size:180,cell:60};
    const pw=144,ph=22,px=compact?(width-pw)/2:Math.round(width*.48)-pw/2,packetTop=oy+(compact?354:after?117:93),packetYs=Array.from({length:9},(_,i)=>packetTop+i*(after?22:28));
    const group={x:compact?24:width-192,y:oy+(compact?674:92),w:compact?width-48:168,h:compact?226:252};
    const qx=compact?[width/2-72,width/2+72]:[width-64,width-64],qy=compact?[oy+826,oy+826]:[oy+162,oy+282],radius=34;
    const meta={key,after,grid,px,pw,ph,packetYs,qx,qy,radius,group:sid(key),packets:[],queue:[],source:[],requests:[],deliveries:[],concat:[],traveler:sid(key+'-traveler'),travelerText:sid(key+'-traveler-text'),recipientGroup:sid(key+'-recipient-group')};rows.push(meta);
    out.push(`<g id="${meta.group}">`);txt(after?'변경 후':'변경 전',24,oy+28,13,after?C.active:C.muted,'start');
    txt(after?'9칸에서 모아서, 주민에게 한 번씩':'패킷마다 주민에게 반복 적재',width/2,oy+(compact?49:28),compact?14:16,C.text);
    txt('유효섹터 9칸',grid.x+90,compact?oy+76:oy+76,13,C.muted);
    box(grid.x,grid.y,180,180,C.bg,C.track,{id:sid(key+'-valid-area')});bounds.push({kind:'grid',x:grid.x,y:grid.y,w:180,h:180});
    for(let i=0;i<9;i++){
      const ix=i%3,iy=Math.floor(i/3),x=grid.x+ix*60,y=grid.y+iy*60,cell=sid(key+'-sector-'+i),pending=sid(key+'-pending-'+i);
      box(x,y,60,60,i===4?C.surface:C.bg,C.edge);box(x+1,y+1,58,58,C.active,null,{id:cell,opacity:0});
      if(i===4)box(x+2,y+2,56,56,'none',C.active);
      txt(i===4?'R':'섹터 '+(i+1),x+30,y+13,12,i===4?C.active:C.muted);
      box(x+6,y+24,48,22,C.surface,C.edge);box(x+7,y+25,9,20,C.empty);txt('H',x+11.5,y+35,11,C.muted);
      box(x+17,y+25,36,20,C.active,null,{id:pending});txt('Msg '+(i+1),x+35,y+35,11,C.bg,'middle',{'class':'sector-mono'});meta.source.push({cell,pending});
      // Every source uses its row bus. Branches meet at an explicitly shared collection trace.
      const sx=x+54,sy=y+35,busY=y+54,trunk=compact?width-24:grid.x+204;
      const end=compact?[px+pw+5,packetYs[i]+ph/2]:[px-5,packetYs[i]+ph/2];
      const points=[[sx,sy],[sx+3,sy],[sx+3,busY],[trunk,busY],[trunk,end[1]],end];meta.concat.push(points);
      wire([[sx,sy],[sx+3,sy],[sx+3,busY]],C.edge,{opacity:.7});
    }
    const trunk=compact?width-24:grid.x+204;
    for(let iy=0;iy<3;iy++){const busY=grid.y+iy*60+54;wire([[grid.x+57,busY],[trunk,busY]],C.edge,{opacity:.7});}
    const ys=[...Array.from({length:3},(_,i)=>grid.y+i*60+54),...packetYs.map(y=>y+ph/2)];wire([[trunk,Math.min(...ys)],[trunk,Math.max(...ys)]],C.track,{opacity:.65});
    txt('예시 · 칸당 패킷 1개',grid.x+90,compact?oy+306:oy+366,12,C.muted);
    txt(after?'Digest 하나':'이동·채팅 패킷',px+pw/2,compact?oy+326:oy+76,13,C.muted);
    if(after){box(px-8,packetTop-8,pw+16,ph*9+16,C.bg,C.edge,{id:sid(key+'-digest-frame')});txt('모으기 1회 · 헤더 보존',px+pw/2,compact?packetTop+ph*9+30:oy+366,12,C.muted);}
    else if(!compact)txt('같은 9패킷을 각각 적재',px+pw/2,oy+366,12,C.muted);
    for(let item=0;item<9;item++){
      const py=packetYs[item],cy=py+ph/2,data=sid(key+'-packet-'+item+'-data'),rim=sid(key+'-packet-'+item+'-rim'),label=sid(key+'-packet-'+item+'-text');
      box(px,py,pw,ph,C.surface,C.edge);box(px+1,py+1,25,ph-2,C.empty);txt('H',px+13,cy,11,C.muted);
      box(px+27,py+1,0,ph-2,C.active,null,{id:data});txt('Msg '+(item+1),px+84,cy,12,C.muted,'middle',{id:label,'class':'sector-mono'});box(px,py,pw,ph,'none',C.active,{id:rim,opacity:0});
      const input=compact?[[trunk,cy],[px+pw+5,cy]]:[[trunk,cy],[px-5,cy]];wire(input,C.edge,{opacity:.7});contact(compact?px+pw+2.5:px-2.5,cy);
      meta.packets.push({data,rim,label,fullWidth:pw-28});
      for(let recipient=0;recipient<2;recipient++){
        const end=compact?[qx[recipient],qy[recipient]-radius]:[qx[recipient]-radius,qy[recipient]],busX=compact?24:group.x-26;
        const path=compact?[[px-5,cy],[busX,cy],[busX,oy+772],[qx[recipient],oy+772],end]:[[px+pw+5,cy],[busX,cy],[busX,end[1]],end];
        if(!meta.requests[item])meta.requests[item]=[];meta.requests[item].push(path);
      }
      if(!after){const output=compact?[[px-5,cy],[24,cy]]:[[px+pw+5,cy],[group.x-26,cy]];wire(output,C.track,{opacity:.7});}
    }
    if(!after){const by=compact?oy+772:null,busX=compact?24:group.x-26;if(compact){wire([[busX,packetYs[0]+11],[busX,by]],C.track);wire([[busX,by],[qx[1],by]],C.track);}else wire([[busX,Math.min(packetYs[0]+11,qy[0])],[busX,Math.max(packetYs[8]+11,qy[1])]],C.track);}
    box(group.x,group.y,group.w,group.h,'none',C.track,{id:meta.recipientGroup});bounds.push({kind:'residents',...group});
    txt(compact?'수신 섹터 R · 같은 주민':'섹터 R',compact?group.x+group.w/2:group.x+34,group.y+16,12,C.text);
    if(!compact)txt('같은 섹터 주민',group.x+group.w/2,oy+76,13,C.muted);
    const digestEnd=packetTop+ph*9+8;
    for(let recipient=0;recipient<2;recipient++){
      const cx=qx[recipient],cy=qy[recipient],qkey=key+'-queue-'+recipient,count=sid(qkey+'-count');
      if(compact)swordsman(cx,oy+742,28,key+'-resident-'+recipient);else{swordsman(group.x+32,cy-26,28,key+'-resident-'+recipient);txt('S'+(recipient+1),group.x+32,cy+31,12,C.muted);}
      const end=compact?[cx,cy-radius]:[cx-radius,cy];
      const path=compact?[[px+pw/2,digestEnd],[px+pw/2,oy+772],[cx,oy+772],end]:[[px+pw/2,digestEnd],[px+pw/2,oy+350],[group.x-26,oy+350],[group.x-26,cy],end];meta.deliveries.push(path);
      if(after)arrow(path,key+'-recipient-'+recipient);else arrow(compact?[[cx,oy+772],end]:[[group.x-26,cy],end],key+'-recipient-'+recipient);
      contact(compact?cx:group.x,compact?cy-radius-2.5:cy);
      tag('circle',{cx,cy,r:radius,fill:C.empty,stroke:C.edge,'stroke-width':1.5});const slots=[];
      for(let i=0;i<12;i++){
        const a=-Math.PI/2+i*Math.PI/6+.02,b=a+Math.PI/6-.04,inner=radius-14,p=(r,t)=>[cx+r*Math.cos(t),cy+r*Math.sin(t)],p1=p(radius,a),p2=p(radius,b),p3=p(inner,b),p4=p(inner,a),d=`M${p1.join(' ')} A${radius} ${radius} 0 0 1 ${p2.join(' ')} L${p3.join(' ')} A${inner} ${inner} 0 0 0 ${p4.join(' ')} Z`,id=sid(qkey+'-slot-'+i);
        tag('path',{id,d,fill:C.empty,stroke:C.edge,'stroke-width':1.5});slots.push(id);
        if(i<9){const pt=p(radius-7,(a+b)/2);txt(String(i+1),pt[0],pt[1],11,C.muted,'middle',{id:sid(qkey+'-number-'+i)});}
      }
      txt('S'+(recipient+1),cx,cy,14,C.text,'middle',{'class':'sector-mono'});txt('SendQ',cx,cy-radius-14,12,C.muted);
      txt('적재 0회',cx,cy+radius+14,12,C.muted,'middle',{id:count});
      meta.queue.push({slots,count,key:qkey});bounds.push({kind:'ring',x:cx-radius,y:cy-radius,w:radius*2,h:radius*2});
    }
    out.push(`<g id="${meta.traveler}" opacity="0">`);box(-23,-10,46,20,C.active);txt('1',0,0,12,C.bg,'middle',{id:meta.travelerText,'class':'sector-mono','data-local':'true'});out.push('</g>');
    out.push('</g>');wire([[24,oy+rowHeight],[width-24,oy+rowHeight]],C.edge);
  }
  txt('A/B · 4,000세션 · 적재 요청 18만 → 4천 회/tick',width/2,rowHeight*2+27,12,C.muted);
  return {width,height,compact,markup:out.join('\n'),rows,labels,bounds,paths};
}
function applyDigestFrame(scene,frame,set){
  const ease=p=>p*p*(3-2*p);
  for(let index=0;index<2;index++){
    const r=frame.rows[index],m=scene.rows[index],active=frame.activeRow===index,dim=frame.activeRow>=0&&frame.activeRow<2&&!active;
    set(m.group,{opacity:dim?.27:1,style:dim?'filter:grayscale(1)':'filter:none'});
    for(let i=0;i<9;i++){
      const p=m.packets[i],fill=m.after?r.joined[i]:1,isCurrent=active&&r.activeItem===i;
      set(p.data,{width:p.fullWidth*ease(fill)});set(p.label,{fill:fill>.55?'var(--pcb-bg)':'var(--pcb-muted)'});
      set(p.rim,{opacity:isCurrent||active&&m.after&&r.joined.every(v=>v===1)?1:0});set(m.source[i].cell,{opacity:isCurrent?.23:active&&r.phase==='prepare'?.12:0});
    }
    const joined=r.joined.every(v=>v===1);if(m.after)set('digest-four-after-digest-frame',{stroke:joined?'var(--pcb-active)':'var(--pcb-edge)'});
    set(m.recipientGroup,{stroke:active&&r.recipient>=0?'var(--pcb-active)':'var(--pcb-track)'});
    for(let j=0;j<2;j++){
      const q=m.queue[j];set(q.count,{fill:r.calls[j]?'var(--pcb-text)':'var(--pcb-muted)'},'적재 '+r.calls[j]+'회');
      for(let i=0;i<12;i++){const filled=i<9&&r.queues[j][i]===1;set(q.slots[i],{fill:filled?'var(--pcb-active)':'var(--pcb-empty)'});if(i<9)set('digest-four-'+q.key+'-number-'+i,{fill:filled?'var(--pcb-bg)':'var(--pcb-muted)'});}
    }
    let points=null,progress=0,label='';
    if(active&&['select','concat'].includes(r.phase)){points=m.concat[r.activeItem];progress=r.progress;label='Msg '+(r.activeItem+1);}
    if(active&&r.phase==='deliver'){points=m.after?m.deliveries[r.recipient]:m.requests[r.activeItem][r.recipient];progress=r.progress;label=m.after?'1…9':'Msg '+(r.activeItem+1);}
    if(points){const pt=digestPoint(points,progress);set(m.traveler,{opacity:1,transform:`translate(${pt[0]} ${pt[1]})`});set(m.travelerText,{},label);}else set(m.traveler,{opacity:0});
  }
}
