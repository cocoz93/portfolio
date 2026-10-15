function createSectorReuseScene(width){
  width=Math.max(320,Math.round(width));const compact=width<700,height=compact?1340:748,kind='sector-zero-v6';
  const C={bg:'var(--pcb-bg)',surface:'var(--pcb-surface)',edge:'var(--pcb-edge)',track:'var(--pcb-track)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',active:'var(--pcb-active)',focus:'var(--pcb-data-focus)',soft:'var(--pcb-soft)',empty:'var(--pcb-empty)',pin:'var(--pcb-pin)'};
  const out=[],labels=[],bounds=[],rows=[],paths=[],sid=key=>kind+'-'+key;
  const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  function tag(name,attrs,body=''){out.push(`<${name} ${Object.entries(attrs).map(([k,v])=>`${k}="${esc(v)}"`).join(' ')}>${body}</${name}>`);}
  function box(x,y,w,h,fill=C.surface,stroke=null,attrs={}){tag('rect',{x,y,width:w,height:h,fill,...(stroke?{stroke,'stroke-width':1.5}:{}),...attrs});}
  function txt(text,x,y,size=12,color=C.text,anchor='middle',attrs={}){labels.push({text,x,y,size,anchor});tag('text',{x,y,'font-size':size,'dominant-baseline':'middle','text-anchor':anchor,fill:color,...attrs},esc(text));}
  function wire(points,color=C.track,arrow=false,opacity=1,attrs={}){for(let i=1;i<points.length;i++)if(points[i][0]!==points[i-1][0]&&points[i][1]!==points[i-1][1])throw Error('Non-orthogonal trace');paths.push(points);tag('path',{d:points.map((p,i)=>`${i?'L':'M'}${p[0]} ${p[1]}`).join(' '),fill:'none',stroke:color,'stroke-width':1.5,'stroke-linejoin':'miter',opacity,...attrs});if(arrow){const p=points.at(-1);let i=points.length-2;while(i>=0&&p[0]===points[i][0]&&p[1]===points[i][1])i--;if(i<0)return;const a=points[i],s=3;tag('polyline',{points:a[0]!==p[0]?`${p[0]-Math.sign(p[0]-a[0])*4},${p[1]-s} ${p.join(',')} ${p[0]-Math.sign(p[0]-a[0])*4},${p[1]+s}`:`${p[0]-s},${p[1]-Math.sign(p[1]-a[1])*4} ${p.join(',')} ${p[0]+s},${p[1]-Math.sign(p[1]-a[1])*4}`,fill:'none',stroke:color,'stroke-width':1.5,opacity});}}
  function pin(cx,cy){tag('circle',{cx,cy,r:3,fill:C.pin});tag('circle',{cx,cy,r:1.25,fill:C.bg});}
  function footprint(x,y,w,h){for(const [a,b,sx,sy] of [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]])wire([[a,b+sy*6],[a,b],[a+sx*6,b]],C.edge);}
  function component(cx,cy,w,h,role){const x=cx-w/2,y=cy-h/2;bounds.push({x,y,w,h,role});box(x,y,w,h,C.surface,C.edge);footprint(x-4,y-4,w+8,h+8);return {cx,cy,x,y,w,h,left:x,right:x+w,top:y,bottom:y+h};}
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
  const world={x:compact?(width-216)/2:24,y:compact?64:276,size:216,cell:72,group:sid('world'),hero:sid('hero'),face:sid('hero-face'),ghost:sid('ghost'),arrow:sid('movement-arrow'),halos:[]};
  world.start=[world.x+108,world.y+108];world.end=[world.x+180,world.y+108];
  txt('섹터 이동',world.x+108,world.y-26,13,C.muted);
  out.push(`<g id="${world.group}">`);bounds.push({x:world.x,y:world.y,w:216,h:216,role:'nine-sector-map'});box(world.x,world.y,216,216,C.bg,C.edge);footprint(world.x-4,world.y-4,224,224);
  for(let y=0;y<3;y++)for(let x=0;x<3;x++)box(world.x+x*72+1,world.y+y*72+1,70,70,C.bg,null,{'data-role':'sector','data-sector':`${x},${y}`});
  for(let i=1;i<3;i++){wire([[world.x+i*72,world.y],[world.x+i*72,world.y+216]],C.edge);wire([[world.x,world.y+i*72],[world.x+216,world.y+i*72]],C.edge);}
  const gray=sid('world-muted');out.push(`<defs><filter id="${gray}" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"></feColorMatrix></filter></defs>`);
  for(let i=0;i<3;i++){out.push(`<g opacity=".25" filter="url(#${gray})">`);mage(world.x+36,world.y+36+i*72,26,'south','background-'+i);out.push('</g>');}
  const recipients=[[1,0],[2,0],[2,2]];
  for(let i=0;i<3;i++){const [x,y]=recipients[i],cx=world.x+x*72+36,cy=world.y+y*72+36,halo=sid('recipient-halo-'+i);world.halos.push(halo);box(cx-22,cy-25,44,50,C.soft,C.active,{id:halo,opacity:1});mage(cx,cy,28,'south','S'+(i+1));txt('S'+(i+1),cx,cy+30,11,C.active);}
  out.push(`<g id="${world.ghost}" opacity=".2" filter="url(#${gray})">`);mage(world.start[0],world.start[1],32,'south','A-before');out.push('</g>');
  out.push(`<g id="${world.arrow}">`);wire([[world.start[0]+22,world.start[1]],[world.end[0]-26,world.end[1]]],C.active,true);out.push('</g>');
  out.push(`<g id="${world.hero}" transform="translate(72 0)">`);tag('use',{id:world.face,href:`#bundle-mage-${kind}-south`,transform:`translate(${world.start.join(' ')}) scale(1)`,'data-character':'mage','data-facing':'south','data-actor':'A'});txt('A',world.start[0]+29,world.start[1]+7,13,C.active);out.push('</g></g>');
  txt('유효 수신자 S1 · S2 · S3',world.x+108,world.y+242,11,C.muted);txt('수신자 3명은 예시',world.x+108,world.y+262,11,C.muted);
  if(!compact){pin(world.x+222,world.y+108);wire([[world.x+222,world.y+108],[width-450,world.y+108]],C.track,true);}
  function pool(cx,cy,key,w=88,h=80){const b=component(cx,cy,w,h,'buffer-pool');txt('버퍼 풀',cx,b.top+15,12,C.muted);const slots=[];for(let i=0;i<3;i++){const sx=cx+(i-1)*24;box(sx-9,cy-4,18,30,C.empty,C.edge);const group=sid(key+'-slot-'+i);slots.push(group);out.push(`<g id="${group}" transform="translate(${sx} ${cy+11})" opacity="0">`);box(-8,-12,16,24,C.surface,C.pin);for(const y of [-5,0])tag('line',{x1:-7,x2:7,y1:y,y2:y,stroke:C.edge,'stroke-width':1.5});box(-5,3,10,6,C.focus);out.push('</g>');}return {...b,slots};}
  function msg(cx,cy,title,key){const b=component(cx,cy,80,80,'serial-buffer'),content=sid(key+'-content'),mask=sid(key+'-mask'),flash=sid(key+'-flash');out.push(`<g id="${content}" opacity="1">`);box(b.x+1,b.y+1,78,19,C.muted,null,{opacity:.08});box(b.x+1,b.y+21,78,15,C.muted,null,{opacity:.18});wire([[b.x+1,b.y+20],[b.right-1,b.y+20]],C.edge);wire([[b.x+1,b.y+36],[b.right-1,b.y+36]],C.edge);txt(title,b.x+8,b.y+10,12,C.text,'start');txt('Header',b.x+8,b.y+28,11,C.muted,'start');out.push(`<defs><clipPath id="${mask}-clip"><rect id="${mask}" x="${b.x+8}" y="${b.y+44}" width="64" height="28"></rect></clipPath></defs><g clip-path="url(#${mask}-clip)">`);box(b.x+8,b.y+44,64,28,C.focus);box(b.x+8,b.y+44,64,28,C.active,null,{id:flash,opacity:0});txt('A 정보',cx,b.y+58,12);out.push('</g></g>');return {...b,content,mask,flash,fullWidth:64};}
  function ring(cx,cy,index,key){const r=22;bounds.push({x:cx-r,y:cy-r,w:44,h:44,role:'session-ring-buffer'});const polar=(rr,a)=>[cx+rr*Math.cos(a*Math.PI/180),cy+rr*Math.sin(a*Math.PI/180)];let fill,flash;for(let i=0;i<8;i++){const a=-180+i*45+1.4,b=a+42.2,p=polar(r,a),q=polar(r,b),s=polar(r*.6,b),t=polar(r*.6,a),d=`M${p.join(',')} A${r},${r} 0 0 1 ${q.join(',')} L${s.join(',')} A${r*.6},${r*.6} 0 0 0 ${t.join(',')} Z`;tag('path',{d,fill:C.empty,stroke:C.edge,'stroke-width':1.5});if(i===2){fill=sid(key+'-fill');flash=sid(key+'-flash');tag('path',{d,id:fill,fill:C.focus,opacity:1});tag('path',{d,id:flash,fill:C.active,opacity:0});}}txt('S'+(index+1),cx,cy,11);if(compact){txt('SendQ',cx,cy+38,11,C.muted);txt('SubRef',cx,cy+56,11,C.muted);}return {cx,cy,r,fill,flash,left:cx-r,right:cx+r,top:cy-r,bottom:cy+r};}
  function beam(points,kind,key){wire(points,C.track,true);let length=0;for(let i=1;i<points.length;i++)length+=Math.abs(points[i][0]-points[i-1][0])+Math.abs(points[i][1]-points[i-1][1]);const trace=sid(key+'-trace'),carrier=sid(key+'-carrier');wire(points,C.active,false,0,{id:trace});if(kind==='copy')box(-5,-4,10,8,C.active,C.text,{id:carrier,opacity:0});else{out.push(`<g id="${carrier}" opacity="0">`);box(-8,-12,16,24,C.surface,C.pin);for(const y of [-5,0])tag('line',{x1:-7,x2:7,y1:y,y2:y,stroke:C.edge,'stroke-width':1.5});box(-5,3,10,6,C.active);out.push('</g>');}return {points,length,kind,trace,carrier};}
  const identity='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0';
  for(let row=0;row<2;row++){
    const after=row===1,group=sid('row-'+row),matrix=sid('matrix-'+row),a={group,matrix,messages:[],queues:[],copies:[],returns:[],allocations:[],pool:null};rows.push(a);out.push(`<defs><filter id="${group}-gray" color-interpolation-filters="sRGB"><feColorMatrix id="${matrix}" type="matrix" values="${identity}"></feColorMatrix></filter></defs><g id="${group}" filter="url(#${group}-gray)">`);
    txt(after?'변경 후':'변경 전',compact?24:width-436,compact?(after?820:336):(after?404:36),14,after?C.active:C.muted,'start');
    if(!compact){
      const pcx=width-340,mx=width-204,qx=width-64,ys=[100,200,300].map(v=>v+(after?368:0)),cy=after?568:200;a.pool=pool(pcx,cy,(after?'after':'before')+'-pool');
      for(let i=0;i<(after?1:3);i++){const my=after?cy:ys[i],m=msg(mx,my,after?'Msg':'Msg '+(i+1),(after?'after':'before')+'-msg-'+i);a.messages.push(m);pin(a.pool.right+6,a.pool.cy);pin(m.left-6,my);a.allocations.push(beam([[a.pool.right+6,a.pool.cy],[width-270,a.pool.cy],[width-270,my],[m.left-6,my]],'allocation',(after?'after':'before')+'-alloc-'+i));}
      txt('SendQ',qx,after?428:60,12,C.muted);
      for(let i=0;i<3;i++){const m=a.messages[after?0:i],q=ring(qx,ys[i],i,(after?'after':'before')+'-q-'+i);a.queues.push(q);pin(m.right+6,m.cy);pin(q.left-6,q.cy);const points=after?[[m.right+6,m.cy],[width-132,m.cy],[width-132,q.cy],[q.left-6,q.cy]]:[[m.right+6,m.cy],[q.left-6,q.cy]];a.copies.push(beam(points,'copy',(after?'after':'before')+'-copy-'+i));const labelX=after?width-108:(m.right+q.left)/2;txt('Copy '+(i+1),labelX,q.cy-28,11,C.muted);txt('SubRef',labelX,q.cy-12,11,C.muted);}
      txt(after?'할당 1회':'할당 3회',a.pool.left-16,cy+62,12,after?C.active:C.muted,'end');
      pin(a.pool.cx,a.pool.bottom+6);
      for(let i=0;i<(after?1:3);i++){const m=a.messages[i];let points;if(after){pin(m.left-6,m.cy);points=[[m.left-6,m.cy],[width-264,m.cy],[width-264,726],[a.pool.cx,726],[a.pool.cx,a.pool.bottom+6]];}else{pin(m.right+6,m.cy+36);points=[[m.right+6,m.cy+36],[width-18,m.cy+36],[width-18,356],[a.pool.cx,356],[a.pool.cx,a.pool.bottom+6]];}a.returns.push(beam(points,'return',(after?'after':'before')+'-return-'+i));}
      if(after){txt('AddRef(3)',mx,508,12,C.active);txt('RefCount로 유지',mx+16,630,11,C.muted,'middle',{id:sid('ref-caption')});txt('마지막 SubRef',pcx-18,702,11,C.active,'end');}
    }else{
      const pcx=width/2,pcy=after?880:392,mcy=after?1038:548,qcy=after?1214:668,xs=[width/2-104,width/2,width/2+104];a.pool=pool(pcx,pcy,(after?'after':'before')+'-pool',112,72);pin(a.pool.cx,a.pool.bottom+6);
      for(let i=0;i<(after?1:3);i++){const cx=after?width/2:xs[i],m=msg(cx,mcy,after?'Msg':'Msg '+(i+1),(after?'after':'before')+'-msg-'+i);a.messages.push(m);pin(m.cx,m.top-6);a.allocations.push(beam([[a.pool.cx,a.pool.bottom+6],[a.pool.cx,after?962:474],[m.cx,after?962:474],[m.cx,m.top-6]],'allocation',(after?'after':'before')+'-alloc-'+i));}
      for(let i=0;i<3;i++){const m=a.messages[after?0:i],q=ring(xs[i],qcy,i,(after?'after':'before')+'-q-'+i);a.queues.push(q);pin(m.cx,m.bottom+6);pin(q.cx,q.top-6);const points=after?[[m.cx,m.bottom+6],[m.cx,1122],[q.cx,1122],[q.cx,q.top-6]]:[[m.cx,m.bottom+6],[q.cx,q.top-6]];a.copies.push(beam(points,'copy',(after?'after':'before')+'-copy-'+i));txt('Copy '+(i+1),q.cx+(i===2?-16:10),after?1152:620,11,C.muted,i===2?'end':'start');}
      txt(after?'할당 1회':'할당 3회',a.pool.right+12,after?940:448,11,after?C.active:C.muted,'start');
      for(let i=0;i<(after?1:3);i++){const m=a.messages[i];if(after){pin(m.left-6,m.cy);pin(a.pool.left-6,a.pool.cy);a.returns.push(beam([[m.left-6,m.cy],[20,m.cy],[20,a.pool.cy],[a.pool.left-6,a.pool.cy]],'return','after-return'));}else{pin(m.right+6,m.cy);pin(a.pool.right+6,a.pool.cy);const rx=Math.min(m.cx+52,width-10);a.returns.push(beam([[m.right+6,m.cy],[rx,m.cy],[rx,750],[width-10,750],[width-10,a.pool.cy],[a.pool.right+6,a.pool.cy]],'return','before-return-'+i));}}
      if(after){txt('AddRef(3)',a.messages[0].right+16,980,12,C.active,'start');txt('마지막 SubRef',24,970,11,C.active,'start');txt('RefCount로 유지',a.messages[0].right+16,1102,11,C.muted,'start',{id:sid('ref-caption')});}
    }
    out.push('</g>');
    if(!after)wire([[compact?20:width-436,compact?784:372],[width-20,compact?784:372]],C.edge);
  }
  return {markup:out.join('\n'),width,height,compact,world,rows,labels,bounds,paths,kind};
}

function sectorFrame(time,program,preview=false){const intro=1350,f=reuseFrame(Math.max(0,time-intro),program,preview);f.time=Math.max(0,time);f.worldMove=preview?1:Math.max(0,Math.min(1,(time-250)/800));f.selected=preview||time>=1050;f.moving=!preview&&time>250&&time<1050;if(!preview&&time<intro){f.activeRow=-1;f.phase=time<250?'섹터 이동 준비':'A가 가운데 섹터에서 오른쪽 섹터로 이동';}return f;}
function applySectorFrame(scene,state,set){
  const shifted={...state,time:Math.max(0,state.time-1350)};applyReuseFrame(scene,shifted,set);
  const progress=state.worldMove,dx=(scene.world.end[0]-scene.world.start[0])*(.5-.5*Math.cos(progress*Math.PI));set(scene.world.hero,{transform:`translate(${dx} 0)`});set(scene.world.face,{href:`#bundle-mage-${scene.kind}-${state.moving?'east':'south'}`,'data-facing':state.moving?'east':'south'});set(scene.world.ghost,{opacity:progress>0?.2:0});set(scene.world.arrow,{opacity:state.preview||state.moving?1:0});for(const halo of scene.world.halos)set(halo,{opacity:state.selected?1:.08});
  for(let row=0;row<2;row++){const r=state.rows[row],a=scene.rows[row];for(let i=0;i<a.allocations.length;i++){const b=a.allocations[i],m=r.messages[i],active=!state.preview&&m.live&&m.build<1,point=reusePoint(b,m.build);set(b.trace,{opacity:active?1:0});set(b.carrier,{opacity:active?1:0,transform:`translate(${point.join(' ')})`});}}
  const retained=state.rows[1].messages[0];set(scene.kind+'-ref-caption',{opacity:state.preview||retained.live||state.rows[1].returned[0]?1:0},state.preview?'RefCount로 유지':`Ref ${retained.ref}${retained.ref===0?' · 반환':' · 유지'}`);
}

function createReuseProgram(){
  const segments=[];let time=0;
  function add(row,phase,actor,duration){const scale=row===0?1.25:1;duration=duration/scale;const s={row,phase,actor,start:time,end:time+duration,duration};segments.push(s);time=s.end;}
  add(0,'prepare',0,400);for(let i=0;i<3;i++){add(0,'build',i,500);add(0,'copy',i,560);add(0,'hold',i,500);add(0,'return',i,560);add(0,'rest',i,220);}add(0,'done',0,500);add(1,'prepare',0,400);add(1,'build',0,500);add(1,'addref',0,300);for(let i=0;i<3;i++){add(1,'copy',i,560);add(1,'hold',i,500);}add(1,'return',0,560);add(1,'done',0,800);add(-1,'done',0,800);return {segments,end:time};
}
function reuseFrame(time,program,preview=false){
  const clamp=v=>Math.max(0,Math.min(1,v)),state={time:Math.max(0,Math.min(program.end,time)),preview,activeRow:-1,phase:'같은 Msg를 3회 사용 → 마지막에 풀 반환',rows:[0,1].map(row=>({messages:Array.from({length:row===0?3:1},()=>({live:preview,build:preview?1:0,ref:preview?(row===0?1:4):0,pulseAt:-99999})),queues:[0,0,0].map(()=>({filled:preview,pulseAt:-99999})),returned:[false,false,false],copy:null,transfer:null,created:preview?(row===0?3:1):0,copies:preview?3:0}))};
  if(preview)return state;
  for(const s of program.segments){if(state.time<s.start)break;const p=clamp((state.time-s.start)/s.duration),done=state.time>=s.end;if(s.row<0){state.activeRow=-1;state.phase='완료 · Msg 생성 3회 → 1회 · SendQ의 사본은 유지';continue;}const r=state.rows[s.row],m=r.messages[s.row===0?s.actor:0];state.activeRow=s.row;
    if(s.phase==='build'){m.live=true;m.build=p;m.ref=1;r.created=s.row===0?s.actor+1:1;state.phase=s.row===0?`변경 전 · Msg ${s.actor+1} 생성`:'변경 후 · Msg A 한 번 생성';if(done)m.pulseAt=s.end;}
    else if(s.phase==='addref'){m.ref=4;state.phase='변경 후 · 같은 Msg A의 사용권 확보';}
    else if(s.phase==='copy'){if(s.row===0)m.ref=2;state.phase=`${s.row===0?'변경 전':'변경 후'} · ${s.row===0?'Msg '+(s.actor+1):'같은 Msg A'} → SendQ ${s.actor+1}`;if(done){r.queues[s.actor].filled=true;r.queues[s.actor].pulseAt=s.end;r.copies=s.actor+1;m.ref=s.row===0?1:3-s.actor;m.pulseAt=s.end;r.copy=null;}else r.copy={actor:s.actor,p};}
    else if(s.phase==='return'){m.ref=0;m.live=false;state.phase=s.row===0?`변경 전 · Msg ${s.actor+1} 풀 반환`:'변경 후 · 세 번 사용 완료 · Msg A 풀 반환';if(done){r.returned[s.row===0?s.actor:0]=true;r.transfer=null;}else r.transfer={actor:s.row===0?s.actor:0,p};}
    else if(s.phase==='prepare')state.phase=`${s.row===0?'변경 전':'변경 후'} · 준비`;
    else if(s.phase==='hold')state.phase=s.row===0?`변경 전 · Msg ${s.actor+1} 사용 완료`:`변경 후 · ${s.actor+1}회 사용 · 같은 Msg A 유지`;
  }
  return state;
}
function reusePoint(beam,p){let remaining=beam.length*Math.max(0,Math.min(1,p));for(let i=1;i<beam.points.length;i++){const a=beam.points[i-1],b=beam.points[i],len=Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]);if(remaining<=len){const t=len?remaining/len:0;return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];}remaining-=len;}return beam.points.at(-1);}
function reusePulse(time,at){const age=time-at;return age<0?0:age<40?age/40:age<540?1:age<890?1-(age-540)/350:0;}
function applyReuseFrame(scene,state,set){
  const identity='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0',gray='.2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 0 0 0 1 0';
  for(let i=0;i<2;i++){const a=scene.rows[i],r=state.rows[i],inactive=state.activeRow!==-1&&state.activeRow!==i;set(a.group,{opacity:inactive?.38:1});set(a.matrix,{values:inactive?gray:identity});for(let j=0;j<a.messages.length;j++){const m=a.messages[j],f=r.messages[j];set(m.content,{opacity:f.live?1:0});set(m.mask,{width:m.fullWidth*(f.build||0)});set(m.flash,{opacity:reusePulse(state.time,f.pulseAt)});}for(let j=0;j<3;j++){set(a.queues[j].fill,{opacity:r.queues[j].filled?1:0});set(a.queues[j].flash,{opacity:reusePulse(state.time,r.queues[j].pulseAt)});set(a.pool.slots[j],{opacity:r.returned[j]?1:0});}
    for(let j=0;j<a.copies.length;j++){const b=a.copies[j],active=r.copy&&r.copy.actor===j,p=active?r.copy.p:0;set(b.trace,{opacity:active?1:0});set(b.carrier,{opacity:active?1:0,transform:`translate(${reusePoint(b,p).join(' ')})`});}
    for(let j=0;j<a.returns.length;j++){const b=a.returns[j],active=r.transfer&&r.transfer.actor===j,p=active?r.transfer.p:0;set(b.trace,{opacity:active?1:0});set(b.carrier,{opacity:active?1:0,transform:`translate(${reusePoint(b,p).join(' ')})`});}
  }
}
