function createRefScene(width){
  width=Math.max(320,Math.round(width));
  const compact=width<700,kind='serial-sharing-focus-v2',rowHeight=compact?496:336,height=rowHeight*2;
  const C={bg:'var(--pcb-bg)',surface:'var(--pcb-surface)',edge:'var(--pcb-edge)',track:'var(--pcb-track)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',active:'var(--pcb-active)',focus:'var(--pcb-data-focus)',empty:'var(--pcb-empty)',pin:'var(--pcb-pin)'};
  const out=[],labels=[],traces=[],bounds=[],rows=[];
  const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  const sid=(row,name,index='')=>`${kind}-${row}-${name}${index}`;
  function tag(name,attrs,body=''){out.push(`<${name} ${Object.entries(attrs).map(([k,v])=>`${k}="${esc(v)}"`).join(' ')}>${body}</${name}>`);}
  function box(x,y,w,h,fill=C.surface,stroke=null,extra={}){tag('rect',{x,y,width:w,height:h,fill,...(stroke?{stroke,'stroke-width':1.5}:{}),...extra});}
  function txt(label,x,y,size=12,color=C.text,anchor='middle',mono=false,extra={}){labels.push({label,x,y,size,anchor,id:extra.id});tag('text',{x,y,fill:color,'font-size':size,'text-anchor':anchor,'dominant-baseline':'middle',...(mono?{class:'bundle-mono'}:{}),...extra},esc(label));}
  function path(points){return points.map((p,i)=>`${i?'L':'M'}${p[0]} ${p[1]}`).join(' ');}
  function wire(points,color=C.track,arrow=false,opacity=.7){
    traces.push(points);
    for(let i=1;i<points.length;i++){const dx=Math.abs(points[i][0]-points[i-1][0]),dy=Math.abs(points[i][1]-points[i-1][1]);if(dx&&dy&&Math.abs(dx-dy)>1e-6)throw Error('Circuit trace must be orthogonal or a 45 degree chamfer');}
    tag('path',{d:path(points),fill:'none',stroke:color,'stroke-width':1.5,'stroke-linejoin':'miter',opacity});
    if(arrow){const [x,y]=points.at(-1),[a,b]=points.at(-2),s=3;tag('polyline',{points:x!==a?`${x-Math.sign(x-a)*4},${y-s} ${x},${y} ${x-Math.sign(x-a)*4},${y+s}`:`${x-s},${y-Math.sign(y-b)*4} ${x},${y} ${x+s},${y-Math.sign(y-b)*4}`,fill:'none',stroke:color,'stroke-width':1.5,opacity});}
  }
  function chamfer(points){const result=[points[0]];for(let i=1;i<points.length-1;i++){const a=points[i-1],b=points[i],c=points[i+1],ab=Math.hypot(b[0]-a[0],b[1]-a[1]),bc=Math.hypot(c[0]-b[0],c[1]-b[1]);if(!ab||!bc)continue;if((b[0]-a[0])*(c[1]-b[1])===(b[1]-a[1])*(c[0]-b[0])){result.push(b);continue;}const cut=Math.min(6,ab/2,bc/2);result.push([b[0]-(b[0]-a[0])*cut/ab,b[1]-(b[1]-a[1])*cut/ab],[b[0]+(c[0]-b[0])*cut/bc,b[1]+(c[1]-b[1])*cut/bc]);}result.push(points.at(-1));return result;}
  function pin(x,y){tag('circle',{cx:x,cy:y,r:3,fill:C.pin,opacity:.85,'data-role':'connection-pin'});tag('circle',{cx:x,cy:y,r:1.25,fill:C.bg});}
  function footprint(x,y,w,h){for(const [px,py,sx,sy] of [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]])wire([[px,py+sy*7],[px,py],[px+sx*7,py]],C.muted,false,.55);}
  function beam(points,key){const length=points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-points[i][0],p[1]-points[i][1]),0);tag('path',{id:key+'-line',d:path(points),fill:'none',stroke:C.active,'stroke-width':1.5,'stroke-dasharray':`${length} ${length}`,'stroke-dashoffset':length,opacity:0,'data-role':'transfer-beam'});box(points[0][0]-3,points[0][1]-3,6,6,C.active,null,{id:key+'-head',opacity:0,'data-role':'data-pulse'});return {points,length,line:key+'-line',head:key+'-head'};}
  function arc(cx,cy,outer,inner,a,b){const at=(r,t)=>[cx+r*Math.cos(t*Math.PI/180),cy+r*Math.sin(t*Math.PI/180)],p=at(outer,a),q=at(outer,b),r=at(inner,b),s=at(inner,a);return `M${p.join(',')} A${outer},${outer} 0 0 1 ${q.join(',')} L${r.join(',')} A${inner},${inner} 0 0 0 ${s.join(',')} Z`;}
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


  box(0,0,width,height,C.bg);mageDefinition();
  out.push(`<defs><filter id="${kind}-off"><feColorMatrix type="saturate" values="0"></feColorMatrix></filter></defs>`);
  const program=createRefProgram();
  for(let row=0;row<2;row++){
    const offset=row*rowHeight,after=row===1,pw=compact?88:112,ph=96,gap=compact?16:20,groupW=pw*3+gap*2,gx=(width-groupW)/2;
    const mapX=compact?(width-72)/2:24,mapY=offset+(compact?58:90),mapW=72,mapH=88;
    const packetY=offset+(compact?(after?214:204):(after?86:76)),queueY=offset+(compact?394:258),qr=compact?18:20;
    const packetXs=after?[compact?width/2-136:width/2-104]:[gx,gx+pw+gap,gx+2*(pw+gap)];
    const pool={x:24,y:offset+(compact?452:238),w:compact?76:80,h:compact?28:34,flash:sid(row,'pool-flash'),label:sid(row,'pool-label')};
    const meta={row,group:sid(row,'group'),source:[],copy:[],returns:[],packets:[],queues:[],pool,character:{face:sid(row,'mage'),highlight:sid(row,'cell'),arrow:sid(row,'move-arrow'),positions:[[mapX+18,mapY+57],[mapX+54,mapY+57]],kind,size:24},created:sid(row,'created'),enqueued:sid(row,'enqueued'),cues:[],ownerSlots:[],refBank:null};rows.push(meta);
    out.push(`<g id="${meta.group}" data-comparison="${after?'after':'before'}">`);
    txt(after?'변경 후':'변경 전',24,offset+(compact?30:62),13,after?C.active:C.muted,'start');
    if(row===0&&!compact){txt('섹터 이동',60,30,12,C.muted);txt('직렬화버퍼',width/2,30,12,C.muted);}
    box(mapX,mapY,mapW,mapH,C.bg,C.edge,{'data-role':'sector-map'});footprint(mapX-4,mapY-4,mapW+8,mapH+8);bounds.push({x:mapX,y:mapY,w:mapW,h:mapH,role:'map'});
    wire([[mapX,mapY+44],[mapX+72,mapY+44]],C.edge,false,.6);wire([[mapX+36,mapY],[mapX+36,mapY+88]],C.track,false,.75);
    txt('A',mapX+18,mapY+22,11,C.muted,'middle',true);txt('B',mapX+54,mapY+22,11,C.muted,'middle',true);
    box(mapX+2,mapY+46,32,39,C.focus,null,{id:meta.character.highlight,opacity:.18});
    tag('use',{id:meta.character.face,href:`#bundle-mage-${kind}-south`,transform:`translate(${mapX+18} ${mapY+57}) scale(.75)`,'data-character':'mage','data-facing':'south'});
    out.push(`<g id="${meta.character.arrow}" opacity="0">`);wire([[mapX+23,mapY+78],[mapX+49,mapY+78]],C.active,true,1);out.push('</g>');
    txt(compact?'섹터 이동 · 같은 정보':'같은 정보',mapX+36,compact?mapY-13:mapY+mapH+17,11,C.muted);
    for(let i=0;i<packetXs.length;i++){
      const x=packetXs[i],y=packetY,key=sid(row,'packet',i),clip=key+'-clip',mask=key+'-mask';
      const packet={key,x,y,w:pw,h:ph,fill:key+'-fill',flash:key+'-flash',mask,body:key+'-body',ref:key+'-ref',op:key+'-op',readEvents:program.segments.filter(s=>s.row===row&&s.phase==='copy'&&(after||s.actor===i)).map(s=>s.start+20)};meta.packets.push(packet);bounds.push({x,y,w:pw,h:ph,role:'packet'});
      box(x,y,pw,ph,C.surface,C.edge,{'data-role':'serial-buffer',id:key});footprint(x-4,y-4,pw+8,ph+8);
      box(x+1,y+1,pw-2,21,C.muted,null,{opacity:.10});box(x+1,y+23,pw-2,17,C.muted,null,{opacity:.18});
      wire([[x+1,y+22],[x+pw-1,y+22]],C.edge,false,.65);wire([[x+1,y+40],[x+pw-1,y+40]],C.edge,false,.65);
      out.push(`<defs><clipPath id="${clip}"><rect id="${mask}" x="${x+6}" y="${y+46}" width="${pw-12}" height="44"></rect></clipPath></defs>`);
      box(x+6,y+46,pw-12,44,C.focus,null,{id:packet.fill,'clip-path':`url(#${clip})`,opacity:0,'data-role':'payload-lit-fill'});
      box(x+6,y+46,pw-12,44,C.active,null,{id:packet.flash,'clip-path':`url(#${clip})`,opacity:0,'data-role':'packet-arrival-flash'});
      txt(after?'Msg':`Msg ${i+1}`,x+10,y+11,12,C.text,'start',true);txt('Header',x+10,y+32,11,C.muted,'start',true);
      txt('동일 정보',x+pw/2,y+68,12,C.muted,'middle',false,{id:packet.body});
      if(!after){
        txt('Ref',x+pw/2-20,y+ph+26,12,C.muted,'middle',true);txt('0',x+pw/2+18,y+ph+25,28,C.muted,'middle',true,{id:packet.ref,'data-role':'ref-count'});
        txt('',x+pw/2,y+ph+49,11,C.muted,'middle',true,{id:packet.op});
      }
      pin(compact||!after?x+pw/2:x-6,compact||!after?y-6:y+ph/2);
      pin(after?x+pw/2:x+pw-6,y+ph+6);
    }
    if(after){
      const packet=meta.packets[0],bx=compact?width/2-4:width/2+28,by=offset+(compact?224:104),bw=148,bh=92;
      meta.refBank={x:bx,y:by,w:bw,h:bh};bounds.push({x:bx,y:by,w:bw,h:bh,role:'reference-metadata'});
      box(bx,by,bw,bh,C.bg,C.edge,{'data-role':'reference-metadata'});footprint(bx-4,by-4,bw+8,bh+8);
      txt('Ref',bx+18,by+26,13,C.muted,'start',true);txt('0',bx+bw-24,by+26,28,C.muted,'end',true,{id:packet.ref,'data-role':'ref-count'});
      txt('AddRef(3)',bx+bw/2,by-17,12,C.muted,'middle',true,{id:packet.op});
      const names=['빌더','S1','S2','S3'];
      for(let i=0;i<4;i++){
        const sx=bx+5+i*35,sy=by+56,key=sid(row,'owner',i);box(sx,sy,32,24,C.empty,C.edge);
        box(sx+1,sy+1,30,22,C.focus,null,{id:key+'-fill',opacity:0,'data-role':'owned-reference'});box(sx+1,sy+1,30,22,C.active,null,{id:key+'-flash',opacity:0});
        txt(names[i],sx+16,sy+12,11,C.muted,'middle',i>0,{id:key+'-label'});meta.ownerSlots.push({fill:key+'-fill',flash:key+'-flash',label:key+'-label',owner:i});
      }
      wire([[packet.x+pw+6,packet.y+ph/2],[bx-6,packet.y+ph/2]],C.edge,false,.8);pin(packet.x+pw+6,packet.y+ph/2);pin(bx-6,packet.y+ph/2);
    }
    for(let i=0;i<3;i++){
      const qx=gx+i*(pw+gap)+pw/2,qy=queueY,key=sid(row,'queue',i),inner=qr*.60,a=-178,b=-92;
      const q={key,cx:qx,cy:qy,r:qr,inner,a,b,fill:key+'-fill',flash:key+'-flash',label:key+'-label',sub:key+'-sub'};meta.queues.push(q);bounds.push({x:qx-qr,y:qy-qr,w:qr*2,h:qr*2,role:'queue'});
      out.push(`<g data-role="recipient-ring" data-session="${i+1}">`);
      for(let k=0;k<8;k++)tag('path',{d:arc(qx,qy,qr,inner,-180+k*45+1.3,-180+k*45+43.7),fill:C.empty,stroke:C.edge,'stroke-width':1.5});
      tag('path',{id:q.fill,d:arc(qx,qy,qr,inner,a,b),fill:C.focus,opacity:0,'data-role':'queue-copy'});tag('path',{id:q.flash,d:arc(qx,qy,qr,inner,a,b),fill:C.active,opacity:0,'data-role':'queue-arrival-flash'});
      txt('0',qx,qy,12,C.muted,'middle',true,{id:q.label});txt(`세션 ${i+1} SendQ`,qx,qy+qr+16,11,C.muted);txt('',qx,qy+qr+32,11,C.muted,'middle',true,{id:q.sub});out.push('</g>');pin(qx,qy-qr-6);
      const packet=meta.packets[after?0:i],start=[after?packet.x+pw/2:packet.x+pw-6,packet.y+ph+6],bus=offset+(compact?364:224);
      const points=after?chamfer([start,[start[0],bus],[qx,bus],[qx,qy-qr-6]]):chamfer([start,[packet.x+pw+4,start[1]],[packet.x+pw+4,bus],[qx,bus],[qx,qy-qr-6]]);
      wire(points,C.track,true,.65);meta.copy.push(beam(points,sid(row,'copy',i)));
      const cue=sid(row,'copy-cue',i);txt('',qx,qy-qr-20,11,C.muted,'middle',true,{id:cue});meta.cues.push(cue);
    }
    const mapOut=compact?[mapX+36,mapY+mapH+6]:[mapX+mapW+6,mapY+44];pin(...mapOut);
    for(let i=0;i<meta.packets.length;i++){
      const packet=meta.packets[i],top=compact||!after,end=top?[packet.x+pw/2,packet.y-6]:[packet.x-6,packet.y+ph/2];
      const points=compact?chamfer([mapOut,[mapOut[0],offset+178],[end[0],offset+178],end]):after?chamfer([mapOut,[end[0]-6,mapOut[1]],[end[0]-6,end[1]],end]):chamfer([mapOut,[126,mapOut[1]],[126,offset+58],[end[0],offset+58],end]);
      wire(points,C.track,true,.65);meta.source.push(beam(points,sid(row,'source',i)));
      const returnStart=[packet.x-6,packet.y+ph-12],returnEnd=compact?[pool.x-6,pool.y+pool.h/2]:[pool.x+pool.w+6,pool.y+pool.h/2];
      const returnPoints=compact?chamfer([returnStart,[returnStart[0],offset+440],[returnEnd[0],offset+440],returnEnd]):after?chamfer([returnStart,[packet.x-54,returnStart[1]],[packet.x-54,returnEnd[1]],returnEnd]):chamfer([returnStart,[returnStart[0],offset+236],[120,offset+236],[120,returnEnd[1]],returnEnd]);
      meta.returns.push(beam(returnPoints,sid(row,'return',i)));
    }
    box(pool.x,pool.y,pool.w,pool.h,C.surface,C.edge,{'data-role':'buffer-pool'});footprint(pool.x-3,pool.y-3,pool.w+6,pool.h+6);
    box(pool.x+1,pool.y+1,pool.w-2,pool.h-2,C.active,null,{id:pool.flash,opacity:0});txt('버퍼 풀',pool.x+pool.w/2,pool.y+pool.h/2,11,C.muted,'middle',false,{id:pool.label});pin(compact?pool.x-6:pool.x+pool.w+6,pool.y+pool.h/2);bounds.push({x:pool.x,y:pool.y,w:pool.w,h:pool.h,role:'pool'});
    const footer=offset+(compact?476:316);
    txt(after?'생성·직렬화 1회':'생성·직렬화 3회',width/2,footer,12,C.text,'middle',false,{id:meta.created});
    txt('적재 0회',width-24,footer,11,C.muted,'end',false,{id:meta.enqueued});
    out.push('</g>');if(row===0)wire([[20,rowHeight-8],[width-20,rowHeight-8]],C.edge,false,.65);
  }
  return {markup:out.join('\n'),width,height,compact,rows,labels,traces,bounds,arc};
}

const refClamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const refEase=v=>{v=refClamp(v);return v*v*(3-2*v);};
function refPulse(time,event){const age=time-event;if(!Number.isFinite(event)||age<=0||age>=890)return 0;if(age<40)return refEase(age/40);if(age<=540)return 1;return 1-refEase((age-540)/350);}
function createRefProgram(){
  const segments=[];let end=0;
  const add=(row,phase,duration,actor=0)=>{duration=Math.round(duration/(row===0?1.25:1));const segment={row,phase,actor,start:end,end:end+duration,duration,index:segments.length};segments.push(segment);end=segment.end;};
  add(0,'prepare',300);add(0,'move',750);
  for(let i=0;i<3;i++){add(0,'source',350,i);add(0,'build',650,i);add(0,'hold',550,i);add(0,'addref',550,i);add(0,'copy',700,i);add(0,'hold',550,i);add(0,'return',550,i);}
  add(-1,'switch',700);add(1,'prepare',300);add(1,'move',750);add(1,'source',350);add(1,'build',650);add(1,'hold',550);add(1,'addref',650);
  for(let i=0;i<3;i++){add(1,'copy',700,i);add(1,'hold',550,i);}
  add(1,'return',550);add(1,'hold',650);add(-1,'done',650);
  return {segments,end};
}
function refRow(after){return {after,move:0,moving:false,builds:0,copies:0,packets:Array.from({length:after?1:3},()=>({fill:0,ref:0,alive:false,built:false,freed:false,born:Infinity,refEvent:Infinity,op:'',opEvent:Infinity})),queues:[0,0,0],queueEvents:[Infinity,Infinity,Infinity],subEvents:[Infinity,Infinity,Infinity],source:[0,0,0],copy:[0,0,0]};}
function refSegment(time,program){const index=Math.max(0,program.segments.findIndex(s=>time<s.end));const segment=program.segments[time>=program.end?program.segments.length-1:index];return {index:segment.index,progress:refClamp((time-segment.start)/segment.duration)};}
function refFrame(time,program){
  time=refClamp(time,0,program.end);const rows=[refRow(false),refRow(true)];let current=program.segments[0],progress=0;
  for(const s of program.segments){if(time<s.start)break;current=s;const p=refClamp((time-s.start)/s.duration),done=p>=1;progress=p;
    if(s.row>=0){const r=rows[s.row],packet=r.packets[s.row===0?s.actor:0];
      if(s.phase==='move'){r.move=refEase(p);r.moving=p>0&&!done;}
      if(s.phase==='source'&&!done)r.source[s.row===0?s.actor:0]=p;
      if(s.phase==='build'&&p>0){packet.fill=refEase(p);packet.ref=1;packet.alive=true;if(done){packet.built=true;packet.born=s.end;r.builds++;}}
      if(s.phase==='addref'&&p>0){packet.ref=s.row===0?2:4;packet.refEvent=s.start;packet.op=s.row===0?'AddRef()':'AddRef(3)';packet.opEvent=s.start;}
      if(s.phase==='copy'){
        if(!done)r.copy[s.actor]=p;r.queues[s.actor]=refEase(refClamp((p-.7)/.3));
        if(done){r.copies++;r.queueEvents[s.actor]=s.end;r.subEvents[s.actor]=s.end;packet.ref--;packet.refEvent=s.end;packet.op='';}
      }
      if(s.phase==='return'&&p>0){packet.ref=0;packet.alive=false;packet.freed=true;packet.refEvent=s.start;packet.op='SubRef()';packet.opEvent=s.start;}
    }
    if(!done)break;
  }
  let opacity=[.24,.24];if(current.row>=0)opacity[current.row]=1;else if(current.phase==='switch')opacity=[1-.76*refEase(progress),.24+.76*refEase(progress)];else opacity=[1,1];
  const r=current.row>=0?rows[current.row]:null,actor=current.actor+1,prefix=current.row===0?'변경 전':'변경 후';
  let phase='완료 · 생성·직렬화 3회 → 1회 · SendQ 적재 3회 → 3회';
  if(current.row>=0){const phases={prepare:'섹터 이동 준비',move:'캐릭터가 섹터 경계를 통과',source:'같은 캐릭터 정보를 전달',build:current.row===0?`세션 ${actor}용 Msg 생성·직렬화`:'공유 Msg를 한 번만 생성·직렬화',hold:r.copies>0?'SendQ에 바이트 사본 유지':'직렬화된 데이터 유지',addref:current.row===0?'AddRef() · Ref 1 → 2':'AddRef(3) · Ref 1 → 4',copy:`세션 ${actor} SendQ에 Copy → SubRef()`,return:current.row===0?`Msg ${actor} · SubRef() · Ref 1 → 0 · 풀 반환`:'빌더 소유권 SubRef() · Ref 1 → 0 · 풀 반환'};phase=`${prefix} · ${phases[current.phase]}`;}
  else if(current.phase==='switch')phase='변경 후 · 한 Msg를 재사용';
  return {time,rows,opacity,phase,segment:current,progress,preview:false};
}
function refPreview(program){const rows=[refRow(false),refRow(true)];rows.forEach((r,row)=>{r.move=1;r.builds=row===0?3:1;r.packets.forEach(p=>{p.fill=1;p.ref=row===0?1:4;p.alive=true;p.built=true;});});return {time:program.end,rows,opacity:[1,1],phase:'같은 정보 · 수신자 3명 예시 · 생성·직렬화 3회 → 1회',preview:true};}
function refPoint(points,progress){let length=0;const lengths=points.slice(1).map((p,i)=>{const n=Math.hypot(p[0]-points[i][0],p[1]-points[i][1]);length+=n;return n;});let distance=refClamp(progress)*length;for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]||i===lengths.length-1){const p=lengths[i]?distance/lengths[i]:0;return [points[i][0]+(points[i+1][0]-points[i][0])*p,points[i][1]+(points[i+1][1]-points[i][1])*p];}distance-=lengths[i];}return points.at(-1);}
function applyRefFrame(scene,frame,set){
  const C={active:'var(--pcb-active)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',dark:'var(--pcb-char-ink)'};
  function paintBeam(b,p){const on=p>0&&p<1,[x,y]=refPoint(b.points,p);set(b.line,{opacity:on?1:0,'stroke-dashoffset':b.length*(1-p)});set(b.head,{opacity:on?1:0,x:x-3,y:y-3});}
  for(let row=0;row<2;row++){
    const meta=scene.rows[row],state=frame.rows[row],character=meta.character;set(meta.group,{opacity:frame.opacity[row],filter:frame.opacity[row]===1?'none':'url(#serial-sharing-focus-v2-off)'});
    const a=character.positions[0],b=character.positions[1],x=a[0]+(b[0]-a[0])*state.move,y=a[1];
    set(character.face,{href:`#bundle-mage-${character.kind}-${state.moving?'east':'south'}`,transform:`translate(${x} ${y}) scale(${character.size/32})`,'data-facing':state.moving?'east':'south'});set(character.highlight,{x:x-16,opacity:.18});set(character.arrow,{opacity:state.moving?1:0});
    let poolFlash=0;
    for(let i=0;i<meta.packets.length;i++){
      const packet=meta.packets[i],s=state.packets[i],readFlash=Math.max(0,...packet.readEvents.map(time=>refPulse(frame.time,time))),flash=Math.max(refPulse(frame.time,s.born),readFlash)*(s.alive?1:0),refFlash=refPulse(frame.time,s.refEvent),opFlash=refPulse(frame.time,s.opEvent);
      set(packet.mask,{width:(packet.w-12)*s.fill});set(packet.fill,{opacity:s.alive?.72:0});set(packet.flash,{opacity:flash});set(packet.body,{fill:s.alive?(flash>=.5?C.dark:C.text):C.muted},s.freed?'풀 반환':'동일 정보');
      set(packet.ref,{fill:refFlash>.2?C.active:s.alive?C.text:C.muted},String(s.ref));
      const consuming=state.subEvents.some(time=>time===s.refEvent)&&refFlash>0;
      set(packet.op,{fill:opFlash>.2||consuming?C.active:C.muted},frame.preview?(row===1?'AddRef(3)':''):s.op||(consuming?'SubRef()':''));
      const returning=!frame.preview&&frame.segment.row===row&&frame.segment.phase==='return'&&(row===1||frame.segment.actor===i)?frame.progress:0;paintBeam(meta.returns[i],returning);
      if(s.freed)poolFlash=Math.max(poolFlash,refPulse(frame.time,s.refEvent));
    }
    if(row===1){
      const s=state.packets[0],countPulse=refPulse(frame.time,s.refEvent);
      for(const slot of meta.ownerSlots){const alive=slot.owner===0?s.ref>0:frame.preview||s.ref>=1+4-slot.owner,flash=alive?countPulse:0;set(slot.fill,{opacity:alive?.72:0});set(slot.flash,{opacity:flash});set(slot.label,{fill:alive?(flash>=.5?C.dark:C.text):C.muted});}
    }
    for(let i=0;i<3;i++){
      const q=meta.queues[i],n=state.queues[i],d=scene.arc(q.cx,q.cy,q.r,q.inner,q.a,q.a+(q.b-q.a)*Math.max(.001,n)),flash=refPulse(frame.time,state.queueEvents[i]),subFlash=refPulse(frame.time,state.subEvents[i]);
      set(q.fill,{d,opacity:n>0?.72:0});set(q.flash,{d,opacity:n>0?flash:0});set(q.label,{fill:n>=1?C.text:C.muted},n>=1?'Msg':'0');set(q.sub,{fill:C.muted},'');set(meta.cues[i],{fill:state.copy[i]>0?C.active:C.muted},row===1&&state.copy[i]>0?'Copy':'');paintBeam(meta.copy[i],state.copy[i]);if(meta.source[i])paintBeam(meta.source[i],state.source[i]);
    }
    set(meta.pool.flash,{opacity:poolFlash});set(meta.pool.label,{fill:poolFlash>=.5?C.dark:C.muted});set(meta.created,{},`생성·직렬화 ${state.builds}회`);set(meta.enqueued,{},`적재 ${state.copies}회`);
  }
}
