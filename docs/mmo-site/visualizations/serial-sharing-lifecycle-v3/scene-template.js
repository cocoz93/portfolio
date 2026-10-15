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
/* MAGE_RENDERER */
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
