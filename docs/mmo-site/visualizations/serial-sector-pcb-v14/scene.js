function createSectorReuseScene(width){
  width=Math.max(320,Math.round(width));
  const compact=width<700,rowHeight=compact?662:400,height=rowHeight*2,kind='sector-pcb-v14',msgWidth=compact?88:136,msgHeight=104;
  const C={bg:'var(--pcb-bg)',surface:'var(--pcb-surface)',edge:'var(--pcb-edge)',track:'var(--pcb-track)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',active:'var(--pcb-active)',focus:'var(--pcb-data-focus)',soft:'var(--pcb-soft)',empty:'var(--pcb-empty)',pin:'var(--pcb-pin)'};
  const out=[],labels=[],bounds=[],rows=[],paths=[],worlds=[],sid=key=>kind+'-'+key;
  const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  function tag(name,attrs,body=''){out.push(`<${name} ${Object.entries(attrs).map(([k,v])=>`${k}="${esc(v)}"`).join(' ')}>${body}</${name}>`);}
  function box(x,y,w,h,fill=C.surface,stroke=null,attrs={}){tag('rect',{x,y,width:w,height:h,fill,...(stroke?{stroke,'stroke-width':1.5}:{}),...attrs});}
  function txt(text,x,y,size=14,color=C.text,anchor='middle',attrs={}){labels.push({text,x,y,size,anchor,exclusive:attrs['data-exclusive'],family:attrs.class==='sector-ref'?'mono':'text'});tag('text',{x,y,'font-size':size,'dominant-baseline':'middle','text-anchor':anchor,fill:color,...attrs},esc(text));}
  function rawText(text,x,y,size=14,color=C.text,anchor='middle',attrs={}){tag('text',{x,y,'font-size':size,'dominant-baseline':'middle','text-anchor':anchor,fill:color,...attrs},esc(text));}
  function wire(points,color=C.edge,attrs={}){for(let i=1;i<points.length;i++)if(points[i][0]!==points[i-1][0]&&points[i][1]!==points[i-1][1])throw Error('Non-orthogonal trace');paths.push(points);tag('path',{d:points.map((p,i)=>`${i?'L':'M'}${p.join(' ')}`).join(' '),fill:'none',stroke:color,'stroke-width':1.5,...attrs});}
  function pin(x,y,side){wire([[x,y],[x+side*5,y]],C.pin,{opacity:.55});}
  function cleanRoute(points){return points.filter((p,i)=>!i||p[0]!==points[i-1][0]||p[1]!==points[i-1][1]);}
  function offsetRoute(points,offset){
    const ns=[];for(let i=1;i<points.length;i++){const dx=points[i][0]-points[i-1][0],dy=points[i][1]-points[i-1][1],len=Math.hypot(dx,dy);ns.push([-dy/len,dx/len]);}
    return points.map((p,i)=>{const a=ns[Math.max(0,i-1)],b=ns[Math.min(ns.length-1,i)],den=1+a[0]*b[0]+a[1]*b[1];if(den<.5)throw Error('Reversing bus route');return [p[0]+offset*(a[0]+b[0])/den,p[1]+offset*(a[1]+b[1])/den];});
  }
  function contact(p,vertical){box(p[0]-(vertical?1.5:3.5),p[1]-(vertical?3.5:1.5),vertical?3:7,vertical?7:3,C.pin,null,{opacity:.7,'data-role':'surface-contact'});}
  function circuitBus(raw,key,role){
    const points=cleanRoute(raw),lanes=[];
    for(const distance of [-4,0,4]){
      const route=offsetRoute(points,distance);lanes.push(route);wire(route,C.track,{opacity:.44,'data-role':'pcb-trace','data-bus':key,'data-lane':distance});
      contact(route[0],route[0][0]===route[1][0]);contact(route.at(-1),route.at(-1)[0]===route.at(-2)[0]);
    }
    const vias=[];
    for(let i=1;i<points.length-1;i++){
      const p=points[i],a=points[i-1],b=points[i+1];if((p[0]-a[0])*(b[1]-p[1])===(p[1]-a[1])*(b[0]-p[0]))continue;
      tag('circle',{cx:p[0],cy:p[1],r:2.2,fill:C.bg,stroke:C.pin,'stroke-width':1.5,opacity:.75,'data-role':'pcb-via'});vias.push(p);
    }
    return {points,lanes,vias,role};
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

  box(0,0,width,height,C.bg);mageDefinition();
  function notice(points,key){
    const trace=sid(key+'-notice'),head=sid(key+'-notice-head');let length=0;for(let i=1;i<points.length;i++)length+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);
    tag('path',{id:trace,d:points.map((p,i)=>`${i?'L':'M'}${p.join(' ')}`).join(' '),fill:'none',stroke:C.active,'stroke-width':1.5,'stroke-dasharray':length,'stroke-dashoffset':length,opacity:0,'data-role':'notice-arrow'});tag('polygon',{id:head,points:'0,0 0,0 0,0',fill:C.active,opacity:0});return {points,length,trace,head};
  }
  function world(x,y,key){
    const size=180,cell=60,w={x,y,size,cell,hero:sid(key+'-hero'),face:sid(key+'-face'),ghost:sid(key+'-ghost'),arrow:sid(key+'-arrow'),halos:[],recipientBoxes:[],notices:[],region:sid(key+'-world'),origin:sid(key+'-origin'),destination:sid(key+'-destination')};
    w.start=[x+90,y+90];w.end=[x+150,y+90];
    out.push(`<g id="${w.region}">`);bounds.push({x,y,w:size,h:size,role:'nine-sector-map'});
    box(x,y,size,size,C.bg,C.edge);
    for(let j=0;j<3;j++)for(let i=0;i<3;i++)box(x+i*cell+1,y+j*cell+1,58,58,C.bg,null,{'data-role':'sector','data-sector':`${i},${j}`});
    box(x+61,y+61,58,58,C.soft,null,{id:w.origin,opacity:.5});box(x+121,y+61,58,58,C.soft,null,{id:w.destination,opacity:0});
    for(let i=1;i<3;i++){wire([[x+i*cell,y],[x+i*cell,y+size]]);wire([[x,y+i*cell],[x+size,y+i*cell]]);}
    for(let i=0;i<3;i++){out.push('<g opacity=".3">');mage(x+30,y+30+i*cell,24,'south',key+'-other-'+i);out.push('</g>');}
    for(const [i,[col,row]] of [[1,0],[2,0],[2,2]].entries()){
      const cx=x+col*cell+30,cy=y+row*cell+30,halo=sid(key+'-receiver-'+i);w.halos.push(halo);w.recipientBoxes.push({cx,cy,left:cx-18,right:cx+18,top:cy-19,bottom:cy+19});
      box(cx-19,cy-21,38,40,C.soft,C.active,{id:halo,opacity:.18});mage(cx,cy-1,28,'south',key+'-S'+(i+1));txt('S'+(i+1),cx,cy+25,11,C.muted);
    }
    const [sx,sy]=w.end;const arrows=[[[sx-17,sy-18],[sx-44,sy-43]],[[sx+19,sy-18],[sx+19,sy-42]],[[sx+19,sy+19],[sx+19,sy+39]]];
    for(let i=0;i<3;i++)w.notices.push(notice(arrows[i],key+'-'+i));
    out.push(`<g id="${w.ghost}" opacity="0">`);mage(...w.start,30,'south',key+'-origin-A');out.push('</g>');
    out.push(`<g id="${w.arrow}" opacity="0">`);wire([[w.start[0]+21,w.start[1]],[w.end[0]-22,w.end[1]]],C.active);tag('polygon',{points:`${w.end[0]-22},${w.end[1]} ${w.end[0]-27},${w.end[1]-3} ${w.end[0]-27},${w.end[1]+3}`,fill:C.active});out.push('</g>');
    out.push(`<g id="${w.hero}">`);tag('use',{id:w.face,href:`#bundle-mage-${kind}-south`,transform:`translate(${w.start.join(' ')}) scale(.9375)`,'data-character':'mage','data-facing':'south','data-actor':key+'-A'});txt('A',w.start[0],w.start[1]+25,13,C.active);out.push('</g>');out.push('</g>');
    return w;
  }

  function pool(cx,cy,key){
    const w=80,h=36,flash=sid(key+'-pool-flash'),b={cx,cy,x:cx-w/2,y:cy-h/2,w,h,left:cx-w/2,right:cx+w/2};bounds.push({...b,role:'msg-pool'});
    box(b.x+4,b.y-4,w-8,h,C.bg,C.edge,{rx:2});box(b.x,b.y,w,h,C.surface,C.edge,{rx:2});
    txt('Msg 풀',cx,cy,13,C.muted);box(b.x,b.y,w,h,'none',C.active,{id:flash,opacity:0,rx:2});return {...b,flash};
  }
  // Buffer identity, data geometry and pins remain identical during allocation and return.
  function bufferGlyph(cx,cy,title,key,travel=false,refValue=1,payload=false){
    const x=cx-msgWidth/2,y=cy-msgHeight/2,fullWidth=msgWidth-24,dataCy=y+76;
    const b={cx,cy,x,y,w:msgWidth,h:msgHeight,left:x,right:x+msgWidth,top:y,bottom:y+msgHeight,fullWidth,dataCy,pips:[]};
    for(const name of ['group','content','mask','flash','returned','rim','ref','dataLabel','title'])b[name]=sid(key+'-'+name);
    const write=travel?rawText:txt;out.push(`<g id="${b.group}">`);
    box(x,y,msgWidth,msgHeight,C.surface,C.edge,{rx:2});box(x+1,y+1,msgWidth-2,43,C.muted,null,{opacity:.055});
    write(title,x+(compact?8:12),y+16,compact?12:14,C.text,'start',{id:b.title});
    write('Ref '+refValue,x+msgWidth-(compact?8:12),y+16,compact?12:17,C.active,'end',{id:b.ref,class:'sector-ref'});
    const pipStart=x+msgWidth-12-44;
    for(let i=0;i<4;i++){box(pipStart+i*12,y+32,8,4,C.empty);const id=sid(key+'-reference-'+i);b.pips.push(id);box(pipStart+i*12,y+32,8,4,C.active,null,{id,opacity:i<refValue?1:0,'data-role':'reference-count-mark'});}
    wire([[x+1,y+44],[x+msgWidth-1,y+44]]);
    for(const px of [cx-22,cx-18,cx-14,cx-4,cx,cx+4,cx+14,cx+18,cx+22])contact([px,y+msgHeight],true);
    for(const px of [cx-4,cx,cx+4])contact([px,y],true);
    out.push(`<g id="${b.content}">`);box(x+12,y+58,fullWidth,36,C.empty);
    out.push(`<defs><clipPath id="${b.mask}-clip"><rect id="${b.mask}" x="${x+12}" y="${y+58}" width="${fullWidth}" height="36"></rect></clipPath></defs><g clip-path="url(#${b.mask}-clip)">`);
    box(x+12,y+58,fullWidth,36,travel&&!payload?C.empty:C.focus);box(x+12,y+58,fullWidth,36,C.active,null,{id:b.flash,opacity:0});
    if(!travel||payload)write('A 정보',cx,dataCy,compact?14:16,C.text,'middle',{id:b.dataLabel,'data-exclusive':key});out.push('</g></g>');
    write('반환됨',cx,dataCy,12,C.muted,'middle',{id:b.returned,opacity:0,'data-exclusive':key});box(x,y,msgWidth,msgHeight,'none',C.active,{id:b.rim,opacity:0,rx:2});out.push('</g>');return b;
  }
  function msg(cx,cy,title,key){const b=bufferGlyph(cx,cy,title,key);bounds.push({...b,role:'serial-buffer'});return b;}
  function ring(cx,cy,index,key){
    const r=compact?28:32,rim=sid(key+'-rim'),polar=(rr,a)=>[cx+rr*Math.cos(a*Math.PI/180),cy+rr*Math.sin(a*Math.PI/180)];let fill,flash;bounds.push({x:cx-r,y:cy-r,w:r*2,h:r*2,role:'session-ring-buffer'});
    for(let i=0;i<8;i++){
      const a=-180+i*45+1.5,b=a+42,p=polar(r,a),q=polar(r,b),s=polar(r*.55,b),t=polar(r*.55,a),d=`M${p.join(',')} A${r},${r} 0 0 1 ${q.join(',')} L${s.join(',')} A${r*.55},${r*.55} 0 0 0 ${t.join(',')} Z`;
      tag('path',{d,fill:C.empty,stroke:C.edge,'stroke-width':1.5});
      if(i===2){fill=sid(key+'-data');flash=sid(key+'-flash');tag('path',{d,id:fill,fill:C.focus,opacity:0});tag('path',{d,id:flash,fill:C.active,opacity:0});}
    }
    tag('circle',{id:rim,cx,cy,r:r+4,fill:'none',stroke:C.active,'stroke-width':1.5,opacity:0});txt('S'+(index+1),cx,cy,14,C.text);
    return {cx,cy,r,fill,flash,rim,left:cx-r,right:cx+r,top:cy-r,bottom:cy+r};
  }
  function flight(points,key,type='copy',title='Msg'){
    let length=0;for(let i=1;i<points.length;i++)length+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);const trace=sid(key+'-trail'),carrier=sid(key+'-parcel');
    tag('path',{id:trace,d:'M0 0',fill:'none',stroke:C.active,'stroke-width':1.5,opacity:0,'data-role':'transient-transfer'});out.push(`<g id="${carrier}" opacity="0">`);
    let glyph=null;
    if(type==='copy'){box(-32,-12,64,24,C.active,null,{rx:1});rawText('A 정보',0,0,12,C.bg);}
    else box(-3,-3,6,6,C.active,null,{rx:1});
    out.push('</g>');return {points,length,trace,carrier,type,glyphSize:type==='copy'?[64,24]:[6,6],glyph:null};
  }
  const identity='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0',contentWidth=Math.min(width,784),pad=(width-contentWidth)/2+24;
  for(let row=0;row<2;row++){
    const after=row===1,key=after?'after':'before',offset=row*rowHeight,group=sid(key),matrix=sid(key+'-matrix');
    const a={group,matrix,messages:[],queues:[],copies:[],allocations:[],returns:[],ref:null,result:sid(key+'-result'),buses:[]};rows.push(a);
    out.push(`<defs><filter id="${group}-gray" color-interpolation-filters="sRGB"><feColorMatrix id="${matrix}" type="matrix" values="${identity}"></feColorMatrix></filter></defs><g id="${group}" filter="url(#${group}-gray)">`);
    const moduleLeft=compact?12:pad+208,moduleRight=compact?width-12:width-pad,mx=(moduleLeft+moduleRight)/2;
    const xs=[moduleLeft+msgWidth/2,mx,moduleRight-msgWidth/2],msgY=offset+(compact?428:184),queueY=offset+(compact?568:320),poolY=offset+(compact?332:84);
    txt(after?'변경 후':'변경 전',compact?24:pad,offset+30,14,after?C.active:C.muted,'start');
    txt(after?'1회 생성 · 3회 사용':'3회 생성',compact?width-24:mx,offset+30,compact?16:20,after?C.active:C.text,compact?'end':'middle',{id:a.result});
    const worldX=compact?(width-180)/2:pad,worldY=offset+(compact?88:132),w=world(worldX,worldY,key);worlds.push(w);
    txt('섹터 이동',worldX+90,worldY-24,12,C.muted);txt('같은 알림 · 수신자 3명',worldX+90,worldY+204,12,C.muted);
    a.pool=pool(mx,poolY,key);
    for(let i=0;i<(after?1:3);i++)a.messages.push(msg(after?mx:xs[i],msgY,after?'Msg':'Msg '+(i+1),key+'-msg-'+i));
    for(let i=0;i<3;i++)a.queues.push(ring(xs[i],queueY,i,key+'-q-'+i));
    for(let i=0;i<3;i++){
      const m=a.messages[after?0:i],q=a.queues[i],portX=m.cx+(after?(i-1)*18:0),busY=offset+(compact?(i===0?506:522):(i===0?258:274));
      const circuitPoints=after&&i!==1?[[portX,m.bottom],[portX,busY],[q.cx,busY],[q.cx,q.top]]:[[portX,m.bottom],[q.cx,q.top]];
      const bus=circuitBus(circuitPoints,key+'-copy-'+i,'copy');a.buses.push(bus);
      const travelPoints=after&&i!==1?[[portX,m.bottom+12],[portX,busY],[q.cx,busY],[q.cx,q.top-6]]:[[portX,m.bottom+12],[q.cx,q.top-6]];
      a.copies.push(flight(travelPoints,key+'-copy-'+i));
    }
    txt('세션 SendQ',mx,queueY+(compact?52:54),13,C.muted);
    for(let i=0;i<a.messages.length;i++){
      const m=a.messages[i],poolPort=a.pool.cx+(after?0:(i-1)*24),bridgeY=offset+(compact?360:112);
      const points=after||i===1?[[poolPort,a.pool.y+a.pool.h],[m.cx,m.top]]:[[poolPort,a.pool.y+a.pool.h],[poolPort,bridgeY],[m.cx,bridgeY],[m.cx,m.top]];
      a.buses.push(circuitBus(points,key+'-allocate-'+i,'allocation-return'));
      a.allocations.push(flight(cleanRoute(points),key+'-allocate-'+i,'allocation'));a.returns.push(flight([...cleanRoute(points)].reverse(),key+'-return-'+i,'return'));
    }
    if(after)a.ref=a.messages[0].ref;
    out.push('</g>');if(!after)wire([[24,rowHeight],[width-24,rowHeight]],C.edge);
  }
  return {markup:out.join('\n'),width,height,compact,worlds,rows,labels,bounds,paths,kind};
}

function createReuseProgram(){
  const segments=[];let time=0;function add(row,phase,actor,duration){duration/=row===0?1.25:1;const s={row,phase,actor,start:time,end:time+duration,duration};segments.push(s);time=s.end;}
  for(let row=0;row<2;row++){
    add(row,'prepare',0,300);add(row,'move',0,720);add(row,'notify',0,600);add(row,'notify-hold',0,400);add(row,'notify-out',0,220);
    if(row===0){for(let i=0;i<3;i++){add(row,'allocate',i,480);add(row,'build',i,420);add(row,'copy',i,360);add(row,'hold',i,700);add(row,'release',i,460);add(row,'rest',i,140);}add(row,'done',0,350);}
    else{add(row,'allocate',0,480);add(row,'build',0,420);add(row,'addref',0,500);for(let i=0;i<3;i++){add(row,'copy',i,i===1?360:600);add(row,'hold',i,700);}add(row,'release',0,460);add(row,'done',0,700);}
  }add(-1,'done',0,450);return {segments,end:time};
}
function reuseEase(p){p=Math.max(0,Math.min(1,p));return p*p*(3-2*p);}
function sectorFrame(time,program,preview=false){
    const clamp=v=>Math.max(0,Math.min(1,v)),state={time:Math.max(0,Math.min(program.end,time)),preview,activeRow:-1,focusTransition:1,finishTransition:1,phase:'같은 알림 · Msg 생성 3회 → 1회 · SendQ Copy는 각각 3회',rows:[0,1].map(row=>({messages:Array.from({length:row===0?3:1},()=>({live:preview,build:preview?1:0,ref:preview?1:0,refAt:-99999,pulseAt:-99999})),queues:[0,0,0].map(()=>({filled:preview,pulseAt:-99999})),returned:[false,false,false],copy:null,transfer:null,created:preview?(row===0?3:1):0,copies:preview?3:0,worldMove:preview?1:0,moving:false,contextFocus:preview?1:.8,selected:preview,noticeProgress:preview?[1,1,1]:[0,0,0],noticeOpacity:preview?1:0}))};if(preview)return state;
  for(const s of program.segments){
    if(state.time<s.start)break;const p=clamp((state.time-s.start)/s.duration),done=state.time>=s.end;
    if(s.row<0){state.activeRow=-1;state.finishTransition=reuseEase(p);state.phase='완료 · Msg 생성 3회 → 1회 · 세 SendQ의 사본은 유지';continue;}
    const r=state.rows[s.row],m=r.messages[s.row===0?s.actor:0],label=s.row===0?'변경 전':'변경 후';state.activeRow=s.row;state.focusTransition=1;
    if(s.phase==='prepare'){state.focusTransition=reuseEase(p);state.phase=label+' · 이동 준비';}
    else if(s.phase==='move'){r.worldMove=reuseEase(p);r.moving=!done;r.contextFocus=1;state.phase=label+' · A가 가운데에서 오른쪽 섹터로 이동';}
    else if(s.phase==='notify'){r.noticeProgress=[0,1,2].map(i=>reuseEase(clamp(p*1.35-i*.15)));r.noticeOpacity=1;r.selected=done;state.phase=label+' · 같은 알림의 수신자 S1 · S2 · S3';}
    else if(s.phase==='notify-hold')state.phase=label+' · 세 수신자에게 같은 알림';
    else if(s.phase==='notify-out'){r.noticeOpacity=1-reuseEase(p);r.contextFocus=1-.34*reuseEase(p);state.phase=label+' · 수신자 선택 완료';}
    else if(s.phase==='allocate'){r.noticeOpacity=0;m.ref=1;state.phase=label+' · '+(s.row===0?'Msg '+(s.actor+1):'Msg 하나')+' 할당';if(done){m.live=true;r.created=s.row===0?s.actor+1:1;r.transfer=null;}else r.transfer={kind:'allocation',actor:s.row===0?s.actor:0,p};}
    else if(s.phase==='build'){m.live=true;m.build=reuseEase(p);m.ref=1;state.phase=label+' · A 정보를 직렬화';if(done)m.pulseAt=s.end;}
    else if(s.phase==='addref'){m.ref=4;m.refAt=s.start;state.phase='변경 후 · AddRef(3) · Ref 1 → 4';}
    else if(s.phase==='copy'){if(s.row===0)m.ref=2;state.phase=label+' · '+(s.row===0?'Msg '+(s.actor+1):'같은 Msg')+' → S'+(s.actor+1)+' SendQ';if(done){r.queues[s.actor].filled=true;r.queues[s.actor].pulseAt=s.end;r.copies=s.actor+1;m.ref=s.row===0?1:3-s.actor;m.refAt=s.end;m.pulseAt=s.end;r.copy=null;}else r.copy={actor:s.actor,p,duration:s.duration};}
    else if(s.phase==='hold')state.phase=label+' · '+(s.row===0?'Copy 후 SubRef':(s.actor+1)+'회 사용 · SubRef → '+m.ref+' · 원본 유지');
    else if(s.phase==='release'){m.ref=0;m.refAt=s.start;m.live=false;state.phase=label+' · '+(s.row===0?'Msg '+(s.actor+1)+' 반환':'마지막 SubRef · Ref 0 → 풀 반환');if(done){r.returned[s.row===0?s.actor:0]=true;r.transfer=null;}else r.transfer={kind:'return',actor:s.row===0?s.actor:0,p};}
  }return state;
}
function reusePoint(beam,p){let remaining=beam.length*Math.max(0,Math.min(1,p));for(let i=1;i<beam.points.length;i++){const a=beam.points[i-1],b=beam.points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(remaining<=len){const t=len?remaining/len:0;return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];}remaining-=len;}return beam.points.at(-1);}
function reusePulse(time,at){const age=time-at;return age<0?0:age<80?reuseEase(age/80):age<760?1:age<1000?1-reuseEase((age-760)/240):0;}
function pathSlice(beam,start,end){const points=[reusePoint(beam,start)];let passed=0;for(let i=1;i<beam.points.length;i++){passed+=Math.hypot(beam.points[i][0]-beam.points[i-1][0],beam.points[i][1]-beam.points[i-1][1]);if(passed>start*beam.length&&passed<end*beam.length)points.push(beam.points[i]);}points.push(reusePoint(beam,end));return points.map((p,i)=>`${i?'L':'M'}${p.join(' ')}`).join(' ');}


function applySectorFrame(scene,state,set){
  const identity=[1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0],gray=[.2126,.7152,.0722,0,0,.2126,.7152,.0722,0,0,.2126,.7152,.0722,0,0,0,0,0,1,0];
  function moveFlight(b,active,p){
    const t=reuseEase(p),opacity=active?Math.min(1,p/.1,(1-p)/.08):0,scale=1;
    set(b.trace,{opacity:active?1:0,d:pathSlice(b,Math.max(0,t-(b.type==='copy'?22:16)/b.length),t)});set(b.carrier,{opacity,transform:`translate(${reusePoint(b,t).join(' ')}) scale(${scale})`});
    if(b.glyph){const minimumScale=scene.compact?11/12:11/14,wordOpacity=scale<minimumScale?0:reuseEase((scale-minimumScale)/.09);set(b.glyph.title,{opacity:wordOpacity});set(b.glyph.ref,{opacity:wordOpacity});if(b.type==='return')set(b.glyph.dataLabel,{opacity:wordOpacity});}
  }
  for(let i=0;i<2;i++){
    const a=scene.rows[i],r=state.rows[i],w=scene.worlds[i];let dim=0;
    if(state.activeRow>=0)dim=i===state.activeRow?(i===1?1-state.focusTransition:0):state.focusTransition;else if(!state.preview&&state.time>0&&i===0)dim=1-state.finishTransition;
    set(a.group,{opacity:1-.6*dim});set(a.matrix,{values:identity.map((v,j)=>v+(gray[j]-v)*dim).join(' ')});
    const dx=(w.end[0]-w.start[0])*r.worldMove;set(w.hero,{transform:`translate(${dx} 0)`});set(w.face,{href:`#bundle-mage-${scene.kind}-${r.moving?'east':'south'}`,'data-facing':r.moving?'east':'south'});
    set(w.ghost,{opacity:.12*r.worldMove});set(w.arrow,{opacity:r.moving?Math.sin(Math.PI*r.worldMove):0});set(w.origin,{opacity:.5*(1-r.worldMove)});set(w.destination,{opacity:.5*r.worldMove});set(w.region,{opacity:r.contextFocus});
    for(let j=0;j<3;j++){
      const n=w.notices[j],p=r.noticeProgress[j],end=reusePoint(n,p),prev=reusePoint(n,Math.max(0,p-.015)),len=Math.hypot(end[0]-prev[0],end[1]-prev[1])||1,sx=(end[0]-prev[0])/len,sy=(end[1]-prev[1])/len;
      set(w.halos[j],{opacity:r.selected||p>=.9?1:.12});set(n.trace,{opacity:r.noticeOpacity,'stroke-dashoffset':n.length*(1-p)});set(n.head,{opacity:p>0?r.noticeOpacity:0,points:`${end[0]-sx*5-sy*3},${end[1]-sy*5+sx*3} ${end.join(',')} ${end[0]-sx*5+sy*3},${end[1]-sy*5-sx*3}`});
      const copy=r.copy&&r.copy.actor===j,pulse=reusePulse(state.time,r.queues[j].pulseAt);
      set(a.queues[j].fill,{opacity:r.queues[j].filled?1:copy?reuseEase((r.copy.p-.9)/.1):0});set(a.queues[j].flash,{opacity:pulse});set(a.queues[j].rim,{opacity:pulse});moveFlight(a.copies[j],copy,copy?r.copy.p:0);
    }
    for(let j=0;j<a.messages.length;j++){
      const m=a.messages[j],f=r.messages[j],copy=r.copy&&(i===1||r.copy.actor===j),pulse=Math.max(reusePulse(state.time,f.pulseAt),copy?reuseEase(Math.min(1,r.copy.p*r.copy.duration/80)):0);
      const arriving=r.transfer&&r.transfer.kind==='allocation'&&r.transfer.actor===j,arrival=arriving?reuseEase((r.transfer.p-.55)/.45):0,returning=r.transfer&&r.transfer.kind==='return'&&r.transfer.actor===j;
      set(m.group,{opacity:state.preview||f.live?1:returning?1-.5*reuseEase(r.transfer.p):r.returned[j]?.5:.12+.88*arrival});set(m.content,{opacity:f.live?1:0});set(m.mask,{width:m.fullWidth*f.build});set(m.flash,{opacity:pulse});set(m.dataLabel,{fill:pulse>=.5?'var(--pcb-bg)':'var(--pcb-text)'});set(m.rim,{opacity:pulse});set(m.returned,{opacity:r.returned[j]?1:0});
      const refEase=reuseEase((state.time-f.refAt)/180);set(m.ref,{opacity:state.preview||f.live||r.returned[j]||returning?.5+.5*refEase:0},'Ref '+f.ref);
      for(let k=0;k<4;k++)set(m.pips[k],{opacity:k<f.ref&&f.live?1:0});
      for(const [kind,flights] of [['allocation',a.allocations],['return',a.returns]]){const active=r.transfer&&r.transfer.kind===kind&&r.transfer.actor===j;moveFlight(flights[j],active,active?r.transfer.p:0);}
    }
    set(a.pool.flash,{opacity:r.transfer?Math.sin(r.transfer.p*Math.PI):0});set(a.result,{},i===0?`${r.created}회 생성`:`${r.created}회 생성 · ${r.copies}회 사용`);
  }
}
