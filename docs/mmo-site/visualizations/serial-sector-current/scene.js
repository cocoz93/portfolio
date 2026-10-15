function createSectorReuseScene(width){
  width=Math.max(320,Math.round(width));
  const compact=width<700,rowHeight=compact?702:424,height=rowHeight*2,kind='sector-restored-current',msgWidth=compact?128:160,msgHeight=compact?84:96;
  const C={bg:'var(--pcb-bg)',surface:'var(--pcb-surface)',edge:'var(--pcb-edge)',track:'var(--pcb-track)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',active:'var(--pcb-active)',focus:'var(--pcb-data-focus)',soft:'var(--pcb-soft)',empty:'var(--pcb-empty)',pin:'var(--pcb-pin)'};
  const out=[],labels=[],bounds=[],rows=[],paths=[],worlds=[],sid=key=>kind+'-'+key;
  const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  function tag(name,attrs,body=''){out.push(`<${name} ${Object.entries(attrs).map(([k,v])=>`${k}="${esc(v)}"`).join(' ')}>${body}</${name}>`);}
  function box(x,y,w,h,fill=C.surface,stroke=null,attrs={}){tag('rect',{x,y,width:w,height:h,fill,...(stroke?{stroke,'stroke-width':1.5}:{}),...attrs});}
  function txt(text,x,y,size=14,color=C.text,anchor='middle',attrs={}){labels.push({text,x,y,size,anchor,exclusive:attrs['data-exclusive']});tag('text',{x,y,'font-size':size,'dominant-baseline':'middle','text-anchor':anchor,fill:color,...attrs},esc(text));}
  function rawText(text,x,y,size=14,color=C.text,anchor='middle',attrs={}){tag('text',{x,y,'font-size':size,'dominant-baseline':'middle','text-anchor':anchor,fill:color,...attrs},esc(text));}
  function wire(points,color=C.edge,attrs={}){for(let i=1;i<points.length;i++)if(points[i][0]!==points[i-1][0]&&points[i][1]!==points[i-1][1])throw Error('Non-orthogonal trace');paths.push(points);tag('path',{d:points.map((p,i)=>`${i?'L':'M'}${p.join(' ')}`).join(' '),fill:'none',stroke:color,'stroke-width':1.5,...attrs});}
  function contact(x,y,r=2.5){
    tag('circle',{cx:x,cy:y,r,fill:C.pin,opacity:.85,'data-role':'plated-contact'});
    tag('circle',{cx:x,cy:y,r:r*.42,fill:C.bg});
  }
  function pin(x,y,side){wire([[x,y],[x+side*5,y]],C.track,{opacity:.65});contact(x+side*2.5,y);}
  function footprint(x,y,w,h){
    out.push('<g data-role="component-registration">');
    for(const [px,py,sx,sy] of [[x+3,y+3,1,1],[x+w-3,y+3,-1,1],[x+3,y+h-3,1,-1],[x+w-3,y+h-3,-1,-1]])wire([[px,py+sy*7],[px,py],[px+sx*7,py]],C.muted,{opacity:.45});
    out.push('</g>');
  }
  function chamfer(points){
    const p=points.filter((v,i)=>!i||v[0]!==points[i-1][0]||v[1]!==points[i-1][1]),result=[p[0]];
    for(let i=1;i<p.length-1;i++){
      const a=p[i-1],b=p[i],c=p[i+1],ab=Math.hypot(b[0]-a[0],b[1]-a[1]),bc=Math.hypot(c[0]-b[0],c[1]-b[1]);
      if((b[0]-a[0])*(c[1]-b[1])===(b[1]-a[1])*(c[0]-b[0])){result.push(b);continue;}
      const cut=Math.min(6,ab/2,bc/2);result.push([b[0]-(b[0]-a[0])*cut/ab,b[1]-(b[1]-a[1])*cut/ab],[b[0]+(c[0]-b[0])*cut/bc,b[1]+(c[1]-b[1])*cut/bc]);
    }
    result.push(p.at(-1));return result;
  }
  function circuit(points,key){
    for(let i=1;i<points.length;i++)if(points[i][0]!==points[i-1][0]&&points[i][1]!==points[i-1][1])throw Error('Non-orthogonal circuit layout');
    const routed=chamfer(points),id=sid(key+'-circuit');
    tag('path',{id,d:routed.map((p,i)=>`${i?'L':'M'}${p.join(' ')}`).join(' '),fill:'none',stroke:C.track,'stroke-width':1.5,'stroke-linejoin':'miter',opacity:key.includes('-allocation-')?0:.5,'data-role':'functional-circuit'});
    return {id,points:routed,rawPoints:points};
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
    const trace=sid(key+'-notice'),head=sid(key+'-notice-head');let length=0;
    for(let i=1;i<points.length;i++)length+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);
    tag('path',{id:trace,d:points.map((p,i)=>`${i?'L':'M'}${p.join(' ')}`).join(' '),fill:'none',stroke:C.active,'stroke-width':1.5,'stroke-dasharray':length,'stroke-dashoffset':length,opacity:0,'data-role':'notice-arrow'});
    tag('polygon',{id:head,points:'0,0 0,0 0,0',fill:C.active,opacity:0});return {points,length,trace,head};
  }
  function world(x,y,key){
    const size=180,cell=60,w={x,y,size,cell,hero:sid(key+'-hero'),face:sid(key+'-face'),arrow:sid(key+'-arrow'),halos:[],recipientBoxes:[],notices:[],region:sid(key+'-world'),origin:sid(key+'-origin'),destination:sid(key+'-destination')};
    w.start=[x+30,y+90];w.end=[x+90,y+90];
    out.push(`<g id="${w.region}">`);bounds.push({x,y,w:size,h:size,role:'nine-sector-map'});
    box(x,y,size,size,C.bg,C.edge);
    for(let j=0;j<3;j++)for(let i=0;i<3;i++)box(x+i*cell+1,y+j*cell+1,58,58,C.bg,null,{'data-role':'sector','data-sector':`${i},${j}`});
    box(x+1,y+61,58,58,C.soft,null,{id:w.origin,opacity:.5});box(x+61,y+61,58,58,C.soft,null,{id:w.destination,opacity:0});
    for(let i=1;i<3;i++){wire([[x+i*cell,y],[x+i*cell,y+size]]);wire([[x,y+i*cell],[x+size,y+i*cell]]);}footprint(x,y,size,size);
    for(const [i,[col,row]] of [[2,0],[2,1],[2,2]].entries()){
      const cx=x+col*cell+30,cy=y+row*cell+30,halo=sid(key+'-receiver-'+i);w.halos.push(halo);w.recipientBoxes.push({cx,cy,left:cx-18,right:cx+18,top:cy-19,bottom:cy+19});
      box(cx-19,cy-21,38,40,C.soft,C.active,{id:halo,opacity:.18});mage(cx,cy-1,28,'south',key+'-S'+(i+1));txt('S'+(i+1),cx,cy+25,11,C.muted);
    }
    const [sx,sy]=w.end;const arrows=[[[sx+17,sy-17],[x+132,y+48]],[[sx+21,sy],[x+131,sy]],[[sx+17,sy+17],[x+132,y+132]]];
    for(let i=0;i<3;i++)w.notices.push(notice(arrows[i],key+'-'+i));
    out.push(`<g id="${w.arrow}" opacity="0">`);wire([[w.start[0]+21,w.start[1]],[w.end[0]-22,w.end[1]]],C.active);tag('polygon',{points:`${w.end[0]-22},${w.end[1]} ${w.end[0]-27},${w.end[1]-3} ${w.end[0]-27},${w.end[1]+3}`,fill:C.active});out.push('</g>');
    out.push(`<g id="${w.hero}">`);tag('use',{id:w.face,href:`#bundle-mage-${kind}-south`,transform:`translate(${w.start.join(' ')}) scale(.9375)`,'data-character':'mage','data-facing':'south','data-actor':key+'-A'});txt('A',w.start[0]-23,w.start[1]+9,13,C.active);out.push('</g>');out.push('</g>');
    return w;
  }
  function pool(cx,cy,key){
    const count=sid(key+'-alloc-count'),flash=sid(key+'-pool-flash'),b={cx,cy,x:cx-39,y:cy-32,w:78,h:64,left:cx-39,right:cx+39};bounds.push({...b,role:'msg-pool'});
    box(b.x,b.y,b.w,b.h,C.surface,C.edge,{'data-role':'allocation-return-slot'});
    box(b.x+1,b.y+1,b.w-2,23,C.muted,null,{opacity:.14});wire([[b.x+1,b.y+24],[b.x+b.w-1,b.y+24]],C.edge,{opacity:.6});
    box(cx-27,cy-4,54,10,C.bg,C.edge,{'data-role':'pool-slot-opening'});
    wire([[cx-27,cy+8],[cx+27,cy+8]],C.track,{opacity:.4});
    box(b.x,b.y,b.w,b.h,'none',C.active,{id:flash,opacity:0});txt('Msg 풀',cx,cy-17,12,C.muted,'middle',{class:'sector-mono'});txt('할당 0',cx,cy+20,11,C.muted,'middle',{id:count});return {...b,count,flash};
  }
  // Static and traveling buffers share one renderer and the same dimensions.
  function bufferGlyph(cx,cy,title,key,travel=false,payload=false,after=false){
    const x=cx-msgWidth/2,y=cy-msgHeight/2,dataWidth=msgWidth-24,dataHeight=compact?36:44,dataTop=y+(compact?35:38),dataCy=dataTop+dataHeight/2,group=sid(key+'-group'),content=sid(key+'-content'),mask=sid(key+'-mask'),flash=sid(key+'-flash'),returned=sid(key+'-returned'),rim=sid(key+'-rim'),ref=sid(key+'-ref'),dataLabel=sid(key+'-data-label');
    const write=travel?rawText:txt;
    out.push(`<g id="${group}" opacity="${travel?1:0}">`);box(x,y,msgWidth,msgHeight,C.surface,C.edge);
    box(x+1,y+1,msgWidth-2,compact?23:27,C.muted,null,{opacity:.14});write(title,x+12,y+(compact?13:15),compact?14:16,C.text,'start',{class:'sector-mono'});wire([[x+1,y+(compact?25:29)],[x+msgWidth-1,y+(compact?25:29)]],C.edge,{opacity:.6});
    if(after)write(travel?'Ref '+(payload?0:1):'Ref 4',x+msgWidth-12,y+(compact?13:15),compact?12:14,C.active,'end',{id:ref,class:'sector-mono'});
    for(const py of [dataTop+4,dataTop+dataHeight/2,dataTop+dataHeight-4]){pin(x,py,-1);pin(x+msgWidth,py,1);}
    out.push(`<g id="${content}">`);box(x+12,dataTop,dataWidth,dataHeight,C.empty,null,{rx:1});
    out.push(`<defs><clipPath id="${mask}-clip"><rect id="${mask}" x="${x+12}" y="${dataTop}" width="${dataWidth}" height="${dataHeight}"></rect></clipPath></defs><g clip-path="url(#${mask}-clip)">`);
    box(x+12,dataTop,dataWidth,dataHeight,payload||!travel?C.focus:C.empty,null,{rx:1});
    if(payload||!travel)box(x+12,dataTop+dataHeight-2,dataWidth,2,C.active,null,{'data-role':'ready-data-strip'});
    box(x+12,dataTop,dataWidth,dataHeight,C.active,null,{id:flash,opacity:0});
    if(!travel||payload)write('A 정보',cx,dataCy,compact?14:16,C.text,'middle',{'data-exclusive':key,id:dataLabel});out.push('</g></g>');
    write('반환됨',cx,dataCy,12,C.muted,'middle',{id:returned,opacity:0,'data-exclusive':key});box(x,y,msgWidth,msgHeight,'none',C.active,{id:rim,opacity:0});out.push('</g>');
    return {cx,cy,x,y,w:msgWidth,h:msgHeight,left:x,right:x+msgWidth,top:y,bottom:y+msgHeight,group,content,mask,flash,returned,rim,ref,fullWidth:dataWidth,dataCy,dataLabel};
  }
  function msg(cx,cy,title,key,after){const b=bufferGlyph(cx,cy,title,key,false,false,after);bounds.push({...b,role:'serial-buffer'});return b;}
  function ring(cx,cy,index,key){
    const r=compact?30:34,rim=sid(key+'-rim'),caption=sid(key+'-caption'),polar=(rr,a)=>[cx+rr*Math.cos(a*Math.PI/180),cy+rr*Math.sin(a*Math.PI/180)];let fill,flash;
    bounds.push({x:cx-r,y:cy-r,w:r*2,h:r*2,role:'session-ring-buffer'});
    for(let i=0;i<8;i++){
      const a=-180+i*45+1.5,b=a+42,p=polar(r,a),q=polar(r,b),s=polar(r*.55,b),t=polar(r*.55,a),d=`M${p.join(',')} A${r},${r} 0 0 1 ${q.join(',')} L${s.join(',')} A${r*.55},${r*.55} 0 0 0 ${t.join(',')} Z`;
      tag('path',{d,fill:C.empty,stroke:C.edge,'stroke-width':1.5});
      if(i===2){fill=sid(key+'-data');flash=sid(key+'-flash');tag('path',{d,id:fill,fill:C.focus,opacity:0});tag('path',{d,id:flash,fill:C.active,opacity:0});}
    }
    contact(cx-r-4,cy);wire([[cx-r-1.5,cy],[cx-r,cy]],C.track,{opacity:.65});
    tag('circle',{id:rim,cx,cy,r:r+4,fill:'none',stroke:C.active,'stroke-width':1.5,opacity:0});txt('S'+(index+1),cx,cy,14,C.text);txt('Copy',cx,cy+48,11,C.muted,'middle',{id:caption,opacity:0});
    return {cx,cy,r,fill,flash,rim,caption,left:cx-r,right:cx+r,top:cy-r,bottom:cy+r};
  }
  function flight(points,key,type='copy',title='Msg',after=false){
    let length=0;for(let i=1;i<points.length;i++)length+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);const trace=sid(key+'-trail'),carrier=sid(key+'-parcel');
    tag('path',{id:trace,d:'M0 0',fill:'none',stroke:C.active,'stroke-width':1.5,opacity:0,'data-role':'transient-transfer'});out.push(`<g id="${carrier}" opacity="0">`);
    const glyphOffset=type==='allocation'||type==='return'?[0,-(compact?11:12)]:[0,0];
    if(type==='request')box(-3,-3,6,6,C.active);
    else if(type==='copy'){box(-18,-12,36,24,C.active,null,{rx:1});rawText('A',0,0,14,C.bg);}
    else bufferGlyph(...glyphOffset,title,key+'-glyph',true,type==='return',after);
    out.push('</g>');return {points,length,trace,carrier,type,glyphOffset,glyphSize:type==='request'?[6,6]:type==='copy'?[36,24]:[msgWidth,msgHeight]};
  }
  const identity='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0';
  for(let row=0;row<2;row++){
    const after=row===1,key=after?'after':'before',group=sid(key),matrix=sid(key+'-matrix'),offset=row*rowHeight;
    const a={group,matrix,messages:[],queues:[],copies:[],allocations:[],returns:[],requests:[],inputCircuits:[],allocationBranches:[],allocationTrunk:null,reuseCaption:null,ref:null,result:sid(key+'-result')};rows.push(a);
    out.push(`<defs><filter id="${group}-gray" color-interpolation-filters="sRGB"><feColorMatrix id="${matrix}" type="matrix" values="${identity}"></feColorMatrix></filter></defs><g id="${group}" filter="url(#${group}-gray)">`);
    txt(after?'변경 후':'변경 전',24,offset+30,14,after?C.active:C.muted,'start');
    const mx=compact?width/2:width-282,qx=width-(compact?49:58),cy=offset+(compact?492:240),ys=(compact?[384,492,600]:[128,240,352]).map(y=>y+offset);
    txt(after?'0회 생성 · 0회 사용':'0회 생성',compact?width-24:mx,offset+30,compact?16:20,after?C.active:C.text,compact?'end':'middle',{id:a.result});
    const w=world(compact?(width-180)/2:24,offset+(compact?96:150),key);worlds.push(w);
    if(compact){txt('섹터 이동',width/2,offset+70,12,C.muted);txt('수신자 S1 · S2 · S3',width/2,offset+302,11,C.muted);}
    else{txt('섹터 이동',114,offset+64,12,C.muted);txt('수신자 S1 · S2 · S3',114,offset+354,11,C.muted);}
    a.pool=pool(compact?Math.max(49,mx-msgWidth/2-60):mx-msgWidth/2-64,offset+(compact?348:88),key);
    txt('직렬화 버퍼',mx,offset+(compact?322:64),12,C.muted);txt('SendQ',qx,offset+(compact?322:64),12,C.muted);
    for(let i=0;i<(after?1:3);i++)a.messages.push(msg(mx,after?cy:ys[i],after?'Msg':'Msg '+(i+1),key+'-msg-'+i,after));
    for(let i=0;i<3;i++){
      const m=a.messages[after?0:i],q=ring(qx,ys[i],i,key+'-q-'+i);a.queues.push(q);
      const rx=(m.right+q.left)/2;a.copies.push(flight([[m.right-12,m.dataCy],[rx,m.dataCy],[rx,q.cy],[q.left-4,q.cy]],key+'-copy-'+i));
    }
    if(after){a.ref=a.messages[0].ref;a.reuseCaption=sid(key+'-reuse-caption');txt('같은 Msg 재사용',mx,cy+66,13,C.muted,'middle',{id:a.reuseCaption,opacity:0});}
    for(let i=0;i<3;i++){
      const receiver=w.recipientBoxes[i],source=[receiver.right+4,receiver.cy];let points,port;
      if(compact){
        const stem=w.x+w.size+8+i*6,lane=w.y+w.size+8+i*4;port=[a.pool.cx-8+i*8,a.pool.y-4];
        points=[source,[stem,source[1]],[stem,lane],[port[0],lane],port];
        wire([[port[0],port[1]+2.5],[port[0],a.pool.y]],C.track,{opacity:.65});
      }else{
        const step=Math.min(8,(a.pool.left-w.x-w.size-16)/3),stem=w.x+w.size+8+i*step;port=[a.pool.left-4,a.pool.cy-4+i*4];
        points=[source,[stem,source[1]],[stem,port[1]],port];wire([[port[0]+2.5,port[1]],[a.pool.left,port[1]]],C.track,{opacity:.65});
      }
      wire([[receiver.right+1,receiver.cy],[source[0],source[1]]],C.track,{opacity:.65});contact(...source);contact(...port);
      const route=circuit(points,key+'-sector-pool-'+i);a.inputCircuits.push(route);a.requests.push(flight(route.points,key+'-request-'+i,'request'));
    }
    const bus=Math.round((a.pool.right+a.messages[0].left)/2),lastData=a.messages.at(-1).dataCy;
    contact(a.pool.right+2,a.pool.cy,2);wire([[a.pool.right,a.pool.cy],[a.pool.right+2,a.pool.cy]],C.track,{opacity:.65});
    a.allocationTrunk=circuit([[a.pool.right+2,a.pool.cy],[bus,a.pool.cy],[bus,lastData]],key+'-allocation-trunk');
    for(let i=0;i<a.messages.length;i++)a.allocationBranches.push(circuit([[bus,a.messages[i].dataCy],[a.messages[i].left-4,a.messages[i].dataCy]],key+'-allocation-branch-'+i));
    for(let i=0;i<a.messages.length;i++){
      const m=a.messages[i],points=chamfer([[a.pool.cx,a.pool.cy],[bus,a.pool.cy],[bus,m.dataCy],[m.cx,m.dataCy]]),title=after?'Msg':'Msg '+(i+1);
      a.allocations.push(flight(points,key+'-allocate-'+i,'allocation',title,after));a.returns.push(flight([...points].reverse(),key+'-return-'+i,'return',title,after));
    }
    out.push('</g>');if(!after)wire([[24,rowHeight],[width-24,rowHeight]],C.edge);
  }
  return {markup:out.join('\n'),width,height,compact,worlds,rows,labels,bounds,paths,kind,cutCorners:chamfer};
}

function createReuseProgram(){
  const segments=[];let time=0;function add(row,phase,actor,duration){duration/=row===0?1.25:1;const s={row,phase,actor,start:time,end:time+duration,duration};segments.push(s);time=s.end;}
  for(let row=0;row<2;row++){
    add(row,'prepare',0,300);add(row,'move',0,720);add(row,'notify',0,600);add(row,'notify-hold',0,400);add(row,'notify-out',0,220);
    if(row===0){for(let i=0;i<3;i++){add(row,'allocate',i,840);add(row,'build',i,420);add(row,'copy',i,600);add(row,'hold',i,700);add(row,'release',i,640);add(row,'rest',i,140);}add(row,'done',0,350);}
    else{add(row,'allocate',0,840);add(row,'build',0,420);add(row,'addref',0,500);for(let i=0;i<3;i++){add(row,'copy',i,600);add(row,'hold',i,700);}add(row,'release',0,640);add(row,'done',0,700);}
  }add(-1,'done',0,450);return {segments,end:time};
}
function reuseEase(p){p=Math.max(0,Math.min(1,p));return p*p*(3-2*p);}
function sectorFrame(time,program,preview=false){
    const clamp=v=>Math.max(0,Math.min(1,v)),state={time:Math.max(0,Math.min(program.end,time)),preview,activeRow:-1,focusTransition:1,finishTransition:1,phase:'같은 알림 · Msg 생성 3회 → 1회',rows:[0,1].map(row=>({messages:Array.from({length:row===0?3:1},()=>({live:preview,build:preview?1:0,ref:preview?(row===0?1:4):0,refAt:-99999,pulseAt:-99999})),queues:[0,0,0].map(()=>({filled:preview,pulseAt:-99999})),returned:[false,false,false],copy:null,transfer:null,created:preview?(row===0?3:1):0,copies:preview?3:0,worldMove:preview?1:0,moving:false,contextFocus:preview?1:.8,selected:preview,noticeProgress:preview?[1,1,1]:[0,0,0],noticeOpacity:preview?1:0}))};if(preview)return state;
  for(const s of program.segments){
    if(state.time<s.start)break;const p=clamp((state.time-s.start)/s.duration),done=state.time>=s.end;
    if(s.row<0){state.activeRow=-1;state.finishTransition=reuseEase(p);state.phase='완료 · Msg 생성 3회 → 1회 · 세 SendQ의 사본은 유지';continue;}
    const r=state.rows[s.row],m=r.messages[s.row===0?s.actor:0],label=s.row===0?'변경 전':'변경 후';state.activeRow=s.row;state.focusTransition=1;
    if(s.phase==='prepare'){state.focusTransition=reuseEase(p);state.phase=label+' · 이동 준비';}
    else if(s.phase==='move'){r.worldMove=reuseEase(p);r.moving=!done;r.contextFocus=1;state.phase=label+' · A가 왼쪽 중앙에서 가운데 중앙으로 이동';}
    else if(s.phase==='notify'){r.noticeProgress=[0,1,2].map(i=>reuseEase(clamp(p*1.35-i*.15)));r.noticeOpacity=1;r.selected=done;state.phase=label+' · 같은 알림의 수신자 S1 · S2 · S3';}
    else if(s.phase==='notify-hold')state.phase=label+' · 세 수신자에게 같은 알림';
    else if(s.phase==='notify-out'){r.noticeOpacity=1-reuseEase(p);r.contextFocus=1-.34*reuseEase(p);state.phase=label+' · 수신자 선택 완료';}
    else if(s.phase==='allocate'){r.noticeOpacity=0;m.ref=p>=.3?1:0;state.phase=label+' · '+(p<.3?'전달 요청 → Msg 풀':(s.row===0?'Msg '+(s.actor+1):'Msg 하나')+' 할당');if(p>=.3)r.created=s.row===0?s.actor+1:1;if(done){m.live=true;r.transfer=null;}else r.transfer={kind:'allocation',actor:s.row===0?s.actor:0,p};}
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
    const t=reuseEase(p),opacity=active?(b.type==='return'?Math.min(1,(1-p)/.08):b.type==='allocation'?Math.min(1,p/.08)*(1-reuseEase((p-.88)/.12)):Math.min(1,p/.08,(1-p)/.06)):0;
    set(b.trace,{opacity:active?(b.type==='request'?.85:.65):0,d:pathSlice(b,Math.max(0,t-28/b.length),t)});
    const scale=b.type==='allocation'?.44+.56*t:b.type==='return'?1-.56*t:1;
    set(b.carrier,{opacity,transform:`translate(${reusePoint(b,t).join(' ')}) scale(${scale})`});
  }
  for(let i=0;i<2;i++){
    const a=scene.rows[i],r=state.rows[i],w=scene.worlds[i];let dim=0;
    if(state.activeRow>=0){dim=i===state.activeRow?(i===1?1-state.focusTransition:0):state.focusTransition;}
    else if(!state.preview&&state.time>0&&i===0)dim=1-state.finishTransition;
    set(a.group,{opacity:1-.6*dim});set(a.matrix,{values:identity.map((v,j)=>v+(gray[j]-v)*dim).join(' ')});
    const dx=(w.end[0]-w.start[0])*r.worldMove;set(w.hero,{transform:`translate(${dx} 0)`});set(w.face,{href:`#bundle-mage-${scene.kind}-${r.moving?'east':'south'}`,'data-facing':r.moving?'east':'south'});
    set(w.arrow,{opacity:r.moving?Math.sin(Math.PI*r.worldMove):0});set(w.origin,{opacity:.5*(1-r.worldMove)});set(w.destination,{opacity:.5*r.worldMove});set(w.region,{opacity:r.contextFocus});
    const activeMessage=r.transfer?r.transfer.actor:r.messages.findIndex(m=>m.live),outputReady=activeMessage>=0&&(!r.transfer||r.transfer.kind==='return'||r.transfer.p>=.3);
    const trunkEnd=outputReady?a.messages[activeMessage].dataCy:a.pool.cy,trunk=scene.cutCorners([[a.pool.right+2,a.pool.cy],[a.allocationTrunk.rawPoints[1][0],a.pool.cy],[a.allocationTrunk.rawPoints[1][0],trunkEnd]]);
    set(a.allocationTrunk.id,{opacity:outputReady?.5:0,d:trunk.map((p,j)=>`${j?'L':'M'}${p.join(' ')}`).join(' ')});
    for(let j=0;j<a.allocationBranches.length;j++)set(a.allocationBranches[j].id,{opacity:outputReady&&j===activeMessage?.5:0});
    for(let j=0;j<a.requests.length;j++){
      const allocation=r.transfer&&r.transfer.kind==='allocation',active=allocation&&r.transfer.p<.3&&(i===1||r.transfer.actor===j);
      moveFlight(a.requests[j],active,active?r.transfer.p/.3:0);
    }
    for(let j=0;j<3;j++){
      const n=w.notices[j],p=r.noticeProgress[j],end=reusePoint(n,p),prev=reusePoint(n,Math.max(0,p-.015)),len=Math.hypot(end[0]-prev[0],end[1]-prev[1])||1,sx=(end[0]-prev[0])/len,sy=(end[1]-prev[1])/len;
      set(w.halos[j],{opacity:r.selected||p>=.9?1:.12});set(n.trace,{opacity:r.noticeOpacity,'stroke-dashoffset':n.length*(1-p)});set(n.head,{opacity:p>0?r.noticeOpacity:0,points:`${end[0]-sx*5-sy*3},${end[1]-sy*5+sx*3} ${end.join(',')} ${end[0]-sx*5+sy*3},${end[1]-sy*5-sx*3}`});
      const copy=r.copy&&r.copy.actor===j,pulse=reusePulse(state.time,r.queues[j].pulseAt);set(a.queues[j].fill,{opacity:r.queues[j].filled?1:copy?reuseEase((r.copy.p-.9)/.1):0});set(a.queues[j].flash,{opacity:pulse});set(a.queues[j].rim,{opacity:pulse});set(a.queues[j].caption,{opacity:copy?reuseEase(Math.min(1,r.copy.p*5)):0});moveFlight(a.copies[j],copy,copy?r.copy.p:0);
      if(state.preview&&!scene.compact){const q=a.queues[j],x=q.cx-74;set(a.copies[j].carrier,{opacity:1,transform:`translate(${x} ${q.cy})`});set(a.copies[j].trace,{opacity:.65,d:`M${x-34} ${q.cy}L${x-18} ${q.cy}`});}
    }
    for(let j=0;j<a.messages.length;j++){
      const m=a.messages[j],f=r.messages[j],copy=r.copy&&(i===1||r.copy.actor===j),pulse=Math.max(reusePulse(state.time,f.pulseAt),copy?reuseEase(Math.min(1,r.copy.p*r.copy.duration/80)):0);
      const arriving=r.transfer&&r.transfer.kind==='allocation'&&r.transfer.actor===j,local=arriving?Math.max(0,(r.transfer.p-.3)/.7):0,arrival=arriving?reuseEase((local-.88)/.12):0;
      set(m.group,{opacity:state.preview||f.live?1:arrival});set(m.content,{opacity:f.live?1:0});set(m.mask,{width:m.fullWidth*f.build});set(m.flash,{opacity:pulse});set(m.dataLabel,{fill:pulse>=.5?'var(--pcb-bg)':'var(--pcb-text)'});set(m.rim,{opacity:pulse});set(m.returned,{opacity:0});
      for(const [kind,flights] of [['allocation',a.allocations],['return',a.returns]]){const transfer=r.transfer&&r.transfer.kind===kind&&r.transfer.actor===j,active=transfer&&(kind==='return'||r.transfer.p>=.3);moveFlight(flights[j],active,active?(kind==='allocation'?local:r.transfer.p):0);}
    }
    set(a.pool.count,{},'할당 '+r.created);set(a.pool.flash,{opacity:r.transfer?Math.sin(r.transfer.p*Math.PI):0});set(a.result,{},i===0?`${r.created}회 생성`:`${r.created}회 생성 · ${r.copies}회 사용`);
    if(a.reuseCaption)set(a.reuseCaption,{opacity:state.preview||r.messages[0].live?1:0});
    if(i===1){const m=r.messages[0],refEase=reuseEase((state.time-m.refAt)/180);set(a.ref,{opacity:state.preview||m.live||r.returned[0]?.45+.55*refEase:0,transform:`translate(0 ${state.preview?0:3*(1-refEase)})`},'Ref '+m.ref);}
  }
}

