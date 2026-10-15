function createRefScene(width){
  width=Math.max(320,Math.round(width));
  const compact=width<700,kind='serial-sharing-lifecycle-v3',rowHeight=compact?544:372,height=rowHeight*2;
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
    const offset=row*rowHeight,after=row===1,pw=168,ph=112,px=(width-pw)/2,py=offset+(compact?160:118),cy=py+ph/2;
    const sourceX=compact?width/2:64,sourceY=offset+(compact?90:174),qx=compact?null:width-90,qr=compact?20:24;
    const queueCoords=compact?[-100,0,100].map(dx=>[width/2+dx,offset+394]):[132,220,308].map(y=>[qx,offset+y]);
    const pool={x:compact?20:24,y:offset+(compact?482:274),w:80,h:32,group:sid(row,'pool'),flash:sid(row,'pool-flash'),label:sid(row,'pool-label')};
    const key=sid(row,'packet'),clip=key+'-clip',mask=key+'-mask';
    const packet={key,x:px,y:py,w:pw,h:ph,content:key+'-content',placeholder:key+'-placeholder',fill:key+'-fill',flash:key+'-flash',mask,body:key+'-body',title:key+'-title',ref:key+'-ref',refGroup:key+'-ref-group',op:key+'-op'};
    const meta={row,group:sid(row,'group'),source:[],copy:[],returns:[],packets:[packet],queues:[],pool,character:{face:sid(row,'mage'),kind,size:24,x:sourceX,y:sourceY},created:sid(row,'created'),enqueued:sid(row,'enqueued'),caption:sid(row,'caption'),cues:[],creationEvents:program.segments.filter(s=>s.row===row&&s.phase==='build').map(s=>s.end),copyEvents:program.segments.filter(s=>s.row===row&&s.phase==='copy').map(s=>s.start+20)};rows.push(meta);
    out.push(`<g id="${meta.group}" data-comparison="${after?'after':'before'}">`);
    txt(after?'변경 후':'변경 전',24,offset+(compact?32:66),13,after?C.active:C.muted,'start');
    if(!compact&&row===0){txt('동일 정보',64,31,12,C.muted);txt('직렬화버퍼',width/2,31,12,C.muted);txt('세션 SendQ',width-112,31,12,C.muted);}
    tag('use',{id:meta.character.face,href:`#bundle-mage-${kind}-south`,transform:`translate(${sourceX} ${sourceY}) scale(.75)`,'data-character':'mage','data-facing':'south'});
    txt('캐릭터 정보',sourceX,sourceY+40,12,C.muted);
    const sourceEnd=compact?[sourceX,sourceY+54]:[sourceX+50,cy];pin(...sourceEnd);
    footprint(px-5,py-5,pw+10,ph+10);bounds.push({x:px,y:py,w:pw,h:ph,role:'buffer-position'});
    txt('생성 대기',px+pw/2,py+ph/2,12,C.muted,'middle',false,{id:packet.placeholder});
    out.push(`<g id="${packet.content}" data-role="buffer-lifetime">`);
    box(px,py,pw,ph,C.surface,C.edge,{'data-role':'serial-buffer',id:key});
    box(px+1,py+1,pw-2,23,C.muted,null,{opacity:.1});box(px+1,py+25,pw-2,19,C.muted,null,{opacity:.18});
    wire([[px+1,py+24],[px+pw-1,py+24]],C.edge,false,.65);wire([[px+1,py+44],[px+pw-1,py+44]],C.edge,false,.65);
    out.push(`<defs><clipPath id="${clip}"><rect id="${mask}" x="${px+8}" y="${py+52}" width="${pw-16}" height="52"></rect></clipPath></defs>`);
    box(px+8,py+52,pw-16,52,C.focus,null,{id:packet.fill,'clip-path':`url(#${clip})`,opacity:0,'data-role':'payload-lit-fill'});
    box(px+8,py+52,pw-16,52,C.active,null,{id:packet.flash,'clip-path':`url(#${clip})`,opacity:0,'data-role':'packet-read-flash'});
    txt('Msg',px+12,py+12,13,C.text,'start',true,{id:packet.title});txt('Header',px+12,py+34,11,C.muted,'start',true);txt('동일한 정보',px+pw/2,py+78,13,C.muted,'middle',false,{id:packet.body});
    out.push('</g>');
    txt(after?'같은 Msg를 계속 사용':'수신자마다 다시 생성',width/2,py+ph+20,12,C.text,'middle',false,{id:meta.caption});
    out.push(`<g id="${packet.refGroup}" data-role="reference-annotation">`);
    const refY=offset+(compact?320:280);txt('Ref',width/2-26,refY,13,C.muted,'middle',true);txt('0',width/2+19,refY,28,C.muted,'middle',true,{id:packet.ref});txt('',width/2,refY+(compact?25:28),12,C.muted,'middle',true,{id:packet.op});
    out.push('</g>');
    const input=compact?[px+pw/2,py-6]:[px-6,cy];pin(...input);
    const sourcePoints=compact?[sourceEnd,input]:[sourceEnd,input];wire(sourcePoints,C.track,true,.65);
    for(let i=0;i<3;i++)meta.source.push(beam(sourcePoints,sid(row,'source',i)));
    const output=compact?[px+pw-12,py+ph+6]:[px+pw+6,cy];pin(...output);
    for(let i=0;i<3;i++){
      const [cx,qy]=queueCoords[i],key=sid(row,'queue',i),inner=qr*.60,a=-178,b=-92;
      const q={key,cx,cy:qy,r:qr,inner,a,b,fill:key+'-fill',flash:key+'-flash',label:key+'-label'};meta.queues.push(q);bounds.push({x:cx-qr,y:qy-qr,w:qr*2,h:qr*2,role:'queue'});
      out.push(`<g data-role="recipient-ring" data-session="${i+1}">`);
      for(let k=0;k<8;k++)tag('path',{d:arc(cx,qy,qr,inner,-180+k*45+1.3,-180+k*45+43.7),fill:C.empty,stroke:C.edge,'stroke-width':1.5});
      tag('path',{id:q.fill,d:arc(cx,qy,qr,inner,a,b),fill:C.focus,opacity:0,'data-role':'queue-copy'});tag('path',{id:q.flash,d:arc(cx,qy,qr,inner,a,b),fill:C.active,opacity:0,'data-role':'queue-arrival-flash'});
      txt('0',cx,qy,12,C.muted,'middle',true,{id:q.label});txt(`세션 ${i+1}`,cx,compact?qy+qr+18:qy-qr-14,11,C.muted);out.push('</g>');
      const end=compact?[cx,qy-qr-6]:[cx-qr-6,qy];pin(...end);
      const points=compact?chamfer([output,[width/2+148,output[1]],[width/2+148,offset+362],[cx,offset+362],end]):chamfer([output,[width-182,output[1]],[width-182,end[1]],end]);
      wire(points,C.track,true,.65);meta.copy.push(beam(points,sid(row,'copy',i)));
      const cue=sid(row,'copy-cue',i);txt('',compact?cx:(width-182+end[0])/2,compact?offset+446:end[1]+18,11,C.muted,'middle',true,{id:cue});meta.cues.push(cue);
    }
    const returnStart=[px-6,py+ph+6],returnEnd=[pool.x+pool.w+6,pool.y+pool.h/2];
    const returnPoints=compact?chamfer([returnStart,[width/2-140,returnStart[1]],[width/2-140,offset+462],[returnEnd[0],offset+462],returnEnd]):chamfer([returnStart,[116,returnStart[1]],[116,returnEnd[1]],returnEnd]);
    meta.returns.push(beam(returnPoints,sid(row,'return')));
    out.push(`<g id="${pool.group}" data-role="buffer-pool">`);box(pool.x,pool.y,pool.w,pool.h,C.surface,C.edge);footprint(pool.x-3,pool.y-3,pool.w+6,pool.h+6);box(pool.x+1,pool.y+1,pool.w-2,pool.h-2,C.active,null,{id:pool.flash,opacity:0});txt('버퍼 풀',pool.x+pool.w/2,pool.y+pool.h/2,11,C.muted,'middle',false,{id:pool.label});pin(...returnEnd);out.push('</g>');
    bounds.push({x:pool.x,y:pool.y,w:pool.w,h:pool.h,role:'pool'});
    const footer=offset+(compact?516:334);txt('생성·직렬화 0회',width/2,footer,12,C.text,'middle',false,{id:meta.created});txt('적재 0회',width-24,footer,11,C.muted,'end',false,{id:meta.enqueued});
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
  if(current.row>=0){const phases={prepare:'동일한 정보 준비',move:'같은 캐릭터 정보를 준비',source:'같은 캐릭터 정보를 전달',build:current.row===0?`세션 ${actor}용 Msg 생성·직렬화`:'공유 Msg를 한 번만 생성·직렬화',hold:r.copies>0?'SendQ에 바이트 사본 유지':'직렬화된 데이터 유지',addref:current.row===0?'AddRef() · Ref 1 → 2':'AddRef(3) · Ref 1 → 4',copy:`세션 ${actor} SendQ에 Copy → SubRef()`,return:current.row===0?`Msg ${actor} · SubRef() · Ref 1 → 0 · 풀 반환`:'빌더 소유권 SubRef() · Ref 1 → 0 · 풀 반환'};phase=`${prefix} · ${phases[current.phase]}`;}
  else if(current.phase==='switch')phase='변경 후 · 한 Msg를 재사용';
  return {time,rows,opacity,phase,segment:current,progress,preview:false};
}
function refPreview(program){const rows=[refRow(false),refRow(true)];rows.forEach((r,row)=>{r.move=1;r.builds=row===0?3:1;r.packets.forEach(p=>{p.fill=1;p.ref=row===0?1:4;p.alive=true;p.built=true;});});return {time:program.end,rows,opacity:[1,1],phase:'같은 정보 · 수신자 3명 예시 · 생성·직렬화 3회 → 1회',preview:true};}
function refPoint(points,progress){let length=0;const lengths=points.slice(1).map((p,i)=>{const n=Math.hypot(p[0]-points[i][0],p[1]-points[i][1]);length+=n;return n;});let distance=refClamp(progress)*length;for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]||i===lengths.length-1){const p=lengths[i]?distance/lengths[i]:0;return [points[i][0]+(points[i+1][0]-points[i][0])*p,points[i][1]+(points[i+1][1]-points[i][1])*p];}distance-=lengths[i];}return points.at(-1);}
function applyRefFrame(scene,frame,set){
  const C={active:'var(--pcb-active)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',dark:'var(--pcb-char-ink)'};
  function paintBeam(b,p){const on=p>0&&p<1,[x,y]=refPoint(b.points,p);set(b.line,{opacity:on?1:0,'stroke-dashoffset':b.length*(1-p)});set(b.head,{opacity:on?1:0,x:x-3,y:y-3});}
  for(let row=0;row<2;row++){
    const meta=scene.rows[row],state=frame.rows[row],packet=meta.packets[0];set(meta.group,{opacity:frame.opacity[row],filter:frame.opacity[row]===1?'none':'url(#serial-sharing-lifecycle-v3-off)'});
    const selected=row===1?0:frame.preview?2:frame.segment.row===0?frame.segment.actor:Math.max(0,Math.min(2,state.builds-1)),s=state.packets[selected];
    const returning=!frame.preview&&frame.segment.row===row&&frame.segment.phase==='return',returnProgress=returning?frame.progress:0;
    const lifetime=s.alive?refEase(refClamp(s.fill/.2)):returning?1-refEase(refClamp(returnProgress*frame.segment.duration/200)):0;
    set(packet.content,{opacity:frame.preview?1:lifetime});set(packet.placeholder,{opacity:frame.preview||s.alive||lifetime>0?0:1},s.freed?'풀 반환':'생성 대기');
    const reading=Math.max(0,...(row===1?meta.copyEvents:[meta.copyEvents[selected]]).map(time=>refPulse(frame.time,time))),flash=Math.max(refPulse(frame.time,s.born),reading)*(s.alive?1:0),refFlash=refPulse(frame.time,s.refEvent);
    set(packet.mask,{width:(packet.w-16)*s.fill});set(packet.fill,{opacity:.72});set(packet.flash,{opacity:flash});set(packet.body,{fill:flash>=.5?C.dark:C.text},'동일한 정보');
    set(packet.title,{},row===1?'Msg':frame.preview?'Msg':`Msg ${selected+1}`);
    const showRef=row===1&&(frame.preview||s.alive||s.freed);set(packet.refGroup,{opacity:showRef?1:0});set(packet.ref,{fill:refFlash>.2?C.active:s.ref>0?C.text:C.muted},String(s.ref));
    const consumed=state.subEvents.some(time=>time===s.refEvent)&&refFlash>0;set(packet.op,{fill:refPulse(frame.time,s.opEvent)>.2||consumed?C.active:C.muted},frame.preview?'AddRef(3)':s.op||(consumed?'SubRef()':''));
    set(meta.caption,{fill:C.text},row===1?'같은 Msg를 계속 사용':'수신자마다 다시 생성');
    for(let i=0;i<3;i++){
      const q=meta.queues[i],n=state.queues[i],d=scene.arc(q.cx,q.cy,q.r,q.inner,q.a,q.a+(q.b-q.a)*Math.max(.001,n)),pulse=refPulse(frame.time,state.queueEvents[i]);set(q.fill,{d,opacity:n>0?.72:0});set(q.flash,{d,opacity:n>0?pulse:0});set(q.label,{fill:n>=1?C.text:C.muted},n>=1?'Msg':'0');paintBeam(meta.copy[i],state.copy[i]);paintBeam(meta.source[i],state.source[i]);set(meta.cues[i],{fill:C.active},state.copy[i]>0?'Copy':'');
    }
    paintBeam(meta.returns[0],returnProgress);
    const poolVisible=returning||!frame.preview&&state.packets.some(p=>p.freed);set(meta.pool.group,{opacity:poolVisible?1:0});const poolFlash=s.freed?refPulse(frame.time,s.refEvent):0;set(meta.pool.flash,{opacity:poolFlash});set(meta.pool.label,{fill:poolFlash>=.5?C.dark:C.muted});
    set(meta.created,{},`생성·직렬화 ${state.builds}회`);set(meta.enqueued,{},`적재 ${state.copies}회`);
  }
}
