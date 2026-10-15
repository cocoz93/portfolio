function createDigestProgram(){
  const segments=[];let end=0;
  function add(row,phase,ms,item=-1,recipient=-1){const duration=ms/(row===0?1.25:1);segments.push({row,phase,item,recipient,start:end,end:end+duration});end+=duration;}
  for(let item=0;item<3;item++){
    add(0,'build',500,item);add(0,'ready',200,item);
    for(let recipient=0;recipient<2;recipient++){
      add(0,'request',500,item,recipient);add(0,'gate',350,item,recipient);
      add(0,'deliver',600,item,recipient);add(0,'hold',600,item,recipient);
    }
    add(0,'rest',100,item);
  }
  add(0,'done',375);
  for(let item=0;item<3;item++){add(1,'build',500,item);add(1,'ready',200,item);}
  for(let item=0;item<3;item++){add(1,'concat',500,item);add(1,'joined',200,item);}
  add(1,'digest-ready',500);
  for(let recipient=0;recipient<2;recipient++){
    add(1,'request',600,-1,recipient);add(1,'gate',400,-1,recipient);
    add(1,'deliver',700,-1,recipient);add(1,'hold',700,-1,recipient);
  }
  add(1,'done',700);add(2,'restore',400);
  return {segments,end};
}
function digestFrame(time,program){
  const clamp=v=>Math.max(0,Math.min(1,v)),rows=[0,1].map(()=>({built:[0,0,0],joined:[0,0,0],queues:[[0,0,0],[0,0,0]],calls:[0,0],activeItem:-1,recipient:-1,phase:'idle',progress:0,gate:0,source:0}));
  let current=null;
  for(const s of program.segments){
    if(time<s.start)break;
    const progress=clamp((time-s.start)/(s.end-s.start)),complete=time>=s.end;
    if(s.row<2){const r=rows[s.row];
      if(s.phase==='build')r.built[s.item]=progress;
      if(s.phase==='concat')r.joined[s.item]=progress;
      if(s.phase==='deliver'&&complete){
        r.calls[s.recipient]++;
        if(s.row===0)r.queues[s.recipient][s.item]=1;else r.queues[s.recipient]=[1,1,1];
      }
    }
    if(!complete){current={...s,progress};break;}
  }
  if(current&&current.row<2){const r=rows[current.row];r.phase=current.phase;r.progress=current.progress;r.activeItem=current.item;r.recipient=current.recipient;
    if(['build','ready','concat','joined'].includes(current.phase))r.source=1;
    if(['gate','deliver','hold'].includes(current.phase))r.gate=1;
  }
  const done=time>=program.end,activeRow=done?-1:current?.row??-1;
  let phase='완료 · 예시: 세션당 적재 요청 3회 → 1회';
  if(current&&current.row<2){const who=current.row===0?'변경 전':'변경 후',item=current.item>=0?'Msg '+(current.item+1):'Digest',recipient=current.recipient>=0?'S'+(current.recipient+1):'';
    const actions={build:item+' 준비',ready:item+' 준비 완료',concat:item+' 바이트 연접',joined:item+' 연접 완료','digest-ready':'R 섹터 Digest 완성',request:recipient+' 적재 요청',gate:recipient+' 세션 찾기·핀',deliver:recipient+' SendQ로 복사',hold:recipient+' 적재 완료',rest:'다음 패킷',done:'완료'};
    phase=who+' · '+actions[current.phase];
  }else if(!done)phase='전·후 결과 비교';
  return {rows,current,done,activeRow,phase};
}
function digestPoint(points,progress){
  const distances=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1])),total=distances.reduce((a,b)=>a+b,0);let left=total*Math.max(0,Math.min(1,progress));
  for(let i=0;i<distances.length;i++){if(left<=distances[i]||i===distances.length-1){const t=distances[i]?left/distances[i]:0;return [points[i][0]+(points[i+1][0]-points[i][0])*t,points[i][1]+(points[i+1][1]-points[i][1])*t];}left-=distances[i];}
  return points[0];
}
function createDigestScene(width){
  width=Math.max(320,Math.round(width));
  const compact=width<700,rowHeight=compact?790:382,height=rowHeight*2+52,kind='digest-four';
  const C={bg:'var(--pcb-bg)',surface:'var(--pcb-surface)',edge:'var(--pcb-edge)',track:'var(--pcb-track)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',active:'var(--pcb-active)',empty:'var(--pcb-empty)',pin:'var(--pcb-pin)'};
  const out=[],labels=[],bounds=[],rows=[],paths=[],sid=k=>kind+'-'+k;
  const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  function tag(name,attrs,body=''){out.push(`<${name} ${Object.entries(attrs).map(([k,v])=>`${k}="${esc(v)}"`).join(' ')}>${body}</${name}>`);}
  function box(x,y,w,h,fill=C.surface,stroke=null,attrs={}){tag('rect',{x,y,width:w,height:h,fill,...(stroke?{stroke,'stroke-width':1.5}:{}),...attrs});}
  function txt(text,x,y,size=14,color=C.text,anchor='middle',attrs={}){labels.push({text,x,y,size,anchor,local:attrs['data-local']==='true'});tag('text',{x,y,'font-size':size,'dominant-baseline':'middle','text-anchor':anchor,fill:color,...attrs},esc(text));}
  function wire(points,color=C.track,attrs={}){for(let i=1;i<points.length;i++)if(points[i][0]!==points[i-1][0]&&points[i][1]!==points[i-1][1])throw Error('Non-orthogonal circuit');paths.push(points);tag('path',{d:points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' '),fill:'none',stroke:color,'stroke-width':1.5,...attrs});}
  function contact(x,y){tag('circle',{cx:x,cy:y,r:2.5,fill:C.pin});tag('circle',{cx:x,cy:y,r:1.05,fill:C.bg});}
  function pin(x,y,dx=1){wire([[x,y],[x+5*dx,y]],C.edge);contact(x+2.5*dx,y);}
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


  box(0,0,width,height,C.bg);mageDefinition();swordsmanDefinition();
  for(let row=0;row<2;row++){
    const after=row===1,key=after?'after':'before',oy=row*rowHeight;
    const grid={x:compact?(width-180)/2:24,y:oy+(compact?100:106),size:180,cell:60};
    const pw=152,ph=52,px=compact?(width-pw)/2:Math.round(width*.49)-pw/2;
    const packetTop=oy+(compact?346:110),packetYs=[0,1,2].map(i=>packetTop+i*(after?ph:66));
    const packetCenters=packetYs.map(y=>y+ph/2),gx=compact?width/2:width-196,gy=oy+(compact?612:202),gateW=62,gateH=60;
    const qx=compact?[width/2-74,width/2+74]:[width-70,width-70],qy=compact?[oy+706,oy+706]:[oy+146,oy+274],radius=34;
    const meta={key,after,grid,px,pw,ph,packetYs,packetCenters,gx,gy,qx,qy,radius,group:sid(key),packets:[],queue:[],source:[],requests:[],deliveries:[],concat:[],traveler:sid(key+'-traveler'),travelerText:sid(key+'-traveler-text'),gate:sid(key+'-gate-active')};
    rows.push(meta);out.push(`<g id="${meta.group}">`);
    txt(after?'변경 후':'변경 전',24,oy+28,13,after?C.active:C.muted,'start');
    txt(after?'수신 섹터에서 한 번 연접':'패킷마다 세션을 다시 찾음',compact?width/2:px+pw/2,oy+(compact?48:28),compact?14:16,C.text);
    txt('R의 유효섹터',grid.x+90,oy+76,13,C.muted);
    box(grid.x,grid.y,180,180,C.bg,C.edge);bounds.push({kind:'grid',x:grid.x,y:grid.y,w:180,h:180});
    for(let iy=0;iy<3;iy++)for(let ix=0;ix<3;ix++){
      const x=grid.x+ix*60,y=grid.y+iy*60;box(x,y,60,60,ix===1&&iy===1?C.surface:C.bg,C.edge);
      if(ix===2){const i=iy,id=sid(key+'-sector-'+i);box(x+1,y+1,58,58,C.active,null,{id,opacity:0});meta.source.push(id);txt(['A','B','C'][i],x+10,y+12,12,C.muted);
        const actorId=sid(key+'-actor-'+i);out.push(`<g id="${actorId}">`);mage(x+32,y+31,24,'south',key+'-source-'+i);out.push('</g>');
        if(after){const pendingId=sid(key+'-pending-'+i);out.push(`<g id="${pendingId}" opacity="0">`);box(x+17,y+45,28,12,C.active);txt(String(i+1),x+31,y+51,11,C.bg);out.push('</g>');}
        pin(x+60,y+30);meta['actor'+i]={id:actorId,x:x+32,y:y+36};
      }
      if(ix===1&&iy===1){box(x+2,y+2,56,56,'none',C.track);txt('R',x+10,y+11,12,C.text);swordsman(x+19,y+33,24,key+'-S1');swordsman(x+43,y+33,24,key+'-S2');txt('S1',x+19,y+53,11,C.muted);txt('S2',x+43,y+53,11,C.muted);}
    }
    txt('S1 · S2는 같은 섹터 주민',grid.x+90,compact?grid.y+202:oy+330,12,C.muted);
    txt(after?'Digest · R 섹터':'이미 만든 패킷',px+pw/2,compact?packetTop-24:oy+76,13,C.muted);
    if(after){
      box(px-8,packetTop-8,pw+16,ph*3+16,C.bg,C.edge,{id:sid(key+'-digest-frame')});
      if(!compact)txt('원래 헤더·데이터 그대로',px+pw/2,oy+330,12,C.muted);
    }else if(!compact)txt('한 패킷씩 적재 요청',px+pw/2,oy+330,12,C.muted);
    for(let item=0;item<3;item++){
      const py=packetYs[item],center=packetCenters[item],pkey=key+'-packet-'+item;
      const group=sid(pkey),data=sid(pkey+'-data'),text=sid(pkey+'-text'),rim=sid(pkey+'-rim'),flash=sid(pkey+'-flash');
      meta.packets.push({group,data,text,rim,flash,fullWidth:pw-2,y:py});
      box(px,py,pw,ph,C.surface,C.edge,{id:group});
      box(px+1,py+1,pw-2,21,C.empty);txt('Msg '+(item+1),px+10,py+12,12,C.text,'start',{'class':'sector-mono'});txt('Header',px+pw-8,py+12,11,C.muted,'end');
      wire([[px+1,py+22],[px+pw-1,py+22]],C.edge);
      box(px+1,py+23,0,ph-24,C.active,null,{id:data});
      box(px+1,py+23,pw-2,ph-24,C.active,null,{id:flash,opacity:0});
      txt(['A 이동','B 채팅','C 이동'][item],px+pw/2,py+37,14,C.muted,'middle',{id:text});
      box(px,py,pw,ph,'none',C.active,{id:rim,opacity:0});
      if(!compact){pin(px,center,-1);pin(px+pw,center);const start=[grid.x+185,grid.y+30+item*60],join=grid.x+200+item*10;
        const route=[start,[join,start[1]],[join,center],[px-5,center]];wire(route,C.edge);meta.concat.push(route);
      }else{
        const start=[grid.x+180,grid.y+30+item*60],bx=width-24-item*10;
        const route=[start,[bx,start[1]],[bx,center],[px+pw+5,center]];wire(route,C.edge);meta.concat.push(route);pin(px+pw,center);
      }
      const req=compact?[[px-5,center],[24+item*8,center],[24+item*8,gy],[gx-gateW/2,gy]]:[[px+pw+5,center],[gx-48-item*9,center],[gx-48-item*9,gy],[gx-gateW/2,gy]];
      meta.requests.push(req);
      if(!after)wire(req,C.track,{opacity:.65});
    }
    const digestReq=compact?[[px+pw/2,packetTop+ph*3+8],[gx,gy-gateH/2]]:[[px+pw+8,packetTop+ph*3-14],[gx-50,packetTop+ph*3-14],[gx-50,gy],[gx-gateW/2,gy]];
    meta.digestRequest=digestReq;if(after)wire(digestReq,C.track,{opacity:.8});
    txt(after?'RequestSendRaw':'RequestSendMsg',compact?gx-gateW/2-6:gx,compact?gy-8:gy-90,12,C.muted,compact?'end':'middle',{'class':'sector-mono'});
    box(gx-gateW/2,gy-gateH/2,gateW,gateH,C.surface,C.edge);
    box(gx-gateW/2+1,gy-gateH/2+1,gateW-2,gateH-2,C.active,null,{id:meta.gate,opacity:0});
    txt('세션',gx,gy-9,13,C.text,'middle',{id:sid(key+'-gate-label')});txt('확인',gx,gy+10,13,C.text,'middle',{id:sid(key+'-gate-label-2')});
    if(!compact){pin(gx-gateW/2,gy,-1);pin(gx+gateW/2,gy);}
    txt('찾기 · 핀 · 복사',gx,gy+(compact?52:64),12,C.muted);
    bounds.push({kind:'gate',x:gx-gateW/2,y:gy-gateH/2,w:gateW,h:gateH});
    if(!compact)txt('각 세션 SendQ',qx[0],oy+76,13,C.muted);
    for(let recipient=0;recipient<2;recipient++){
      const cx=qx[recipient],cy=qy[recipient],qkey=key+'-queue-'+recipient,count=sid(qkey+'-count');
      const route=compact?[[gx,gy+gateH/2],[gx,cy-56],[cx,cy-56],[cx,cy-radius]]:[[gx+gateW/2+5,gy],[gx+gateW/2+32+recipient*10,gy],[gx+gateW/2+32+recipient*10,cy],[cx-radius,cy]];
      meta.deliveries.push(route);wire(route,C.track,{opacity:.7});
      tag('circle',{cx,cy,r:radius,fill:C.empty,stroke:C.edge,'stroke-width':1.5});
      const slots=[];
      for(let i=0;i<8;i++){
        const a=-Math.PI/2+i*Math.PI/4+.023,b=a+Math.PI/4-.046,inner=radius-15;
        const p=(r,t)=>[cx+r*Math.cos(t),cy+r*Math.sin(t)];const p1=p(radius,a),p2=p(radius,b),p3=p(inner,b),p4=p(inner,a),d=`M${p1.join(' ')} A${radius} ${radius} 0 0 1 ${p2.join(' ')} L${p3.join(' ')} A${inner} ${inner} 0 0 0 ${p4.join(' ')} Z`,id=sid(qkey+'-slot-'+i);
        tag('path',{id,d,fill:C.empty,stroke:C.edge,'stroke-width':1.5});slots.push(id);
        if(i<3){const pt=p(radius-7.5,(a+b)/2);txt(String(i+1),pt[0],pt[1],11,C.muted,'middle',{id:sid(qkey+'-number-'+i)});}
      }
      txt('S'+(recipient+1),cx,cy,14,C.text,'middle',{'class':'sector-mono'});
      txt('적재 요청 · 0회',cx,cy+radius+22,12,C.muted,'middle',{id:count});
      meta.queue.push({slots,count,key:qkey});bounds.push({kind:'ring',x:cx-radius,y:cy-radius,w:radius*2,h:radius*2});
    }
    // The traveler carries a packet number, or all three numbers for the raw digest.
    out.push(`<g id="${meta.traveler}" opacity="0">`);
    box(-23,-11,46,22,C.active);txt('1',0,1,12,C.bg,'middle',{id:meta.travelerText,'class':'sector-mono','data-local':'true'});out.push('</g>');
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
    for(let i=0;i<3;i++){
      const p=m.packets[i],fill=m.after?r.joined[i]:r.built[i],isCurrent=active&&r.activeItem===i,pulse=isCurrent||active&&m.after&&['digest-ready','request','gate','deliver','hold'].includes(r.phase)?1:0;
      set(p.data,{width:p.fullWidth*ease(fill)});set(p.flash,{opacity:pulse&&fill===1?.38:0});set(p.rim,{opacity:pulse&&fill>0?1:0});
      set(p.text,{fill:fill>.55?'var(--pcb-bg)':'var(--pcb-muted)'});
      const sourcePulse=isCurrent&&['build','ready','concat','joined'].includes(r.phase);
      set(m.source[i],{opacity:sourcePulse?.3:0});
      const actor=m['actor'+i],moving=sourcePulse&&r.phase==='build'&&i!==1;
      set(actor.id,{transform:`translate(${i===1?0:moving?-10+20*ease(r.progress):r.built[i]===1?10:-10} 0)`});
      set('digest-four-'+m.key+'-source-'+i+'-character',{href:'#bundle-mage-digest-four-'+(moving?'east':'south'),'data-facing':moving?'east':'south'});
      if(m.after)set('digest-four-after-pending-'+i,{opacity:r.built[i]>0&&r.phase!=='done'&&!frame.done?ease(r.built[i]):0});
    }
    if(m.after)set('digest-four-after-digest-frame',{stroke:r.joined.every(v=>v===1)?'var(--pcb-active)':'var(--pcb-edge)'});
    set(m.gate,{opacity:active&&r.gate?.88:0});
    for(const suffix of ['-gate-label','-gate-label-2'])set('digest-four-'+m.key+suffix,{fill:active&&r.gate?'var(--pcb-bg)':'var(--pcb-text)'});
    for(let j=0;j<2;j++){
      const q=m.queue[j];set(q.count,{fill:r.calls[j]?'var(--pcb-text)':'var(--pcb-muted)'},'적재 요청 · '+r.calls[j]+'회');
      for(let i=0;i<8;i++){const filled=i<3&&r.queues[j][i]===1;set(q.slots[i],{fill:filled?'var(--pcb-active)':'var(--pcb-empty)'});if(i<3)set('digest-four-'+q.key+'-number-'+i,{fill:filled?'var(--pcb-bg)':'var(--pcb-muted)'});}
    }
    let points=null,progress=0,label='';
    if(active&&r.phase==='concat'){points=m.concat[r.activeItem];progress=r.progress;label=String(r.activeItem+1);}
    if(active&&r.phase==='request'){points=m.after?m.digestRequest:m.requests[r.activeItem];progress=r.progress;label=m.after?'1|2|3':String(r.activeItem+1);}
    if(active&&r.phase==='deliver'){points=m.deliveries[r.recipient];progress=r.progress;label=m.after?'1|2|3':String(r.activeItem+1);}
    if(points){const pt=digestPoint(points,progress);set(m.traveler,{opacity:1,transform:`translate(${pt[0]} ${pt[1]})`});set(m.travelerText,{},label);}else set(m.traveler,{opacity:0});
  }
}
