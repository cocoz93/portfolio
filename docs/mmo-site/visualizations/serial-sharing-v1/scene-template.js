function createRefScene(width){
  width=Math.max(320,Math.round(width));
  const compact=width<700,kind='serial-sharing-v1',rowHeight=compact?664:416,height=rowHeight*2;
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
  for(let row=0;row<2;row++){
    const offset=row*rowHeight,after=row===1,mapX=compact?(width-120)/2:24,mapY=offset+(compact?88:144),mapW=120,mapH=144;
    const px=compact?(width-320)/2+24:Math.round(width*.41),pw=compact?128:144,ph=80,qx=compact?px+236:width-90,qr=compact?26:30;
    const ys=(compact?[344,440,536]:[112,216,320]).map(y=>y+offset),cy=ys[1];
    const meta={row,group:sid(row,'group'),source:[],copy:[],packets:[],queues:[],character:{face:sid(row,'mage'),highlight:sid(row,'cell'),arrow:sid(row,'move-arrow'),positions:[[mapX+30,mapY+72],[mapX+90,mapY+72]],kind,size:28},created:sid(row,'created'),enqueued:sid(row,'enqueued'),operation:sid(row,'operation'),cues:[]};rows.push(meta);
    out.push(`<g id="${meta.group}" data-comparison="${after?'after':'before'}">`);
    txt(after?'변경 후':'변경 전',24,offset+(compact?34:74),13,after?C.active:C.muted,'start');
    if(compact){txt('섹터 이동',width/2,offset+66,12,C.muted);txt('직렬화버퍼',px+pw/2,offset+268,12,C.muted);txt('세션 SendQ',qx,offset+268,12,C.muted);}
    else if(row===0){txt('섹터 이동',mapX+mapW/2,35,12,C.muted);txt('직렬화버퍼',px+pw/2,35,12,C.muted);txt('세션 SendQ · 3명',qx-42,35,12,C.muted);}
    box(mapX,mapY,mapW,mapH,C.bg,C.edge,{'data-role':'sector-map'});footprint(mapX-4,mapY-4,mapW+8,mapH+8);bounds.push({x:mapX,y:mapY,w:mapW,h:mapH,role:'map'});
    for(let i=1;i<3;i++)wire([[mapX,mapY+i*48],[mapX+mapW,mapY+i*48]],C.edge,false,.65);
    wire([[mapX+60,mapY],[mapX+60,mapY+mapH]],C.track,false,.8);
    box(mapX+2,mapY+50,56,44,C.focus,null,{id:meta.character.highlight,opacity:.18});
    txt('A',mapX+30,mapY+24,11,C.muted,'middle',true);txt('B',mapX+90,mapY+24,11,C.muted,'middle',true);
    tag('use',{id:meta.character.face,href:`#bundle-mage-${kind}-south`,transform:`translate(${mapX+30} ${mapY+72}) scale(.875)`,'data-character':'mage','data-facing':'south'});
    out.push(`<g id="${meta.character.arrow}" opacity="0">`);wire([[mapX+44,mapY+98],[mapX+76,mapY+98]],C.active,true,1);out.push('</g>');
    txt('같은 캐릭터 정보',mapX+mapW/2,mapY+mapH+22,11,C.muted);
    const packetYs=after?[cy]:ys;
    for(let i=0;i<packetYs.length;i++){
      const y=packetYs[i]-ph/2,key=sid(row,'packet',i),clip=key+'-clip',mask=key+'-mask';
      const packet={key,x:px,y,w:pw,h:ph,fill:key+'-fill',flash:key+'-flash',mask,body:key+'-body',ref:key+'-ref',op:key+'-op'};meta.packets.push(packet);bounds.push({x:px,y,w:pw,h:ph,role:'packet'});
      box(px,y,pw,ph,C.surface,C.edge,{'data-role':'serial-buffer',id:key});footprint(px-4,y-4,pw+8,ph+8);
      box(px+1,y+1,pw-2,21,C.muted,null,{opacity:.1});box(px+1,y+23,pw-2,17,C.muted,null,{opacity:.18});
      wire([[px+1,y+22],[px+pw-1,y+22]],C.edge,false,.65);wire([[px+1,y+40],[px+pw-1,y+40]],C.edge,false,.65);
      out.push(`<defs><clipPath id="${clip}"><rect id="${mask}" x="${px+5}" y="${y+44}" width="${pw-10}" height="32"></rect></clipPath></defs>`);
      box(px+5,y+44,pw-10,32,C.focus,null,{id:packet.fill,'clip-path':`url(#${clip})`,opacity:0,'data-role':'payload-lit-fill'});
      box(px+5,y+44,pw-10,32,C.active,null,{id:packet.flash,'clip-path':`url(#${clip})`,opacity:0,'data-role':'packet-arrival-flash'});
      txt('Msg',px+10,y+11,12,C.text,'start',true);txt('Ref 0',px+pw-10,y+11,11,C.muted,'end',true,{id:packet.ref});
      txt('Header',px+10,y+32,11,C.muted,'start',true);txt('같은 캐릭터 정보',px+pw/2,y+60,11,C.muted,'middle',false,{id:packet.body});
      txt(after?'AddRef(3)':'AddRef()',px+pw/2,y-18,11,C.muted,'middle',true,{id:packet.op});
      pin(px-6,packetYs[i]);pin(px+pw/2,y+ph+6);
    }
    for(let i=0;i<3;i++){
      const y=ys[i],key=sid(row,'queue',i),inner=qr*.6,a=-178,b=-92;
      const q={key,cx:qx,cy:y,r:qr,inner,a,b,fill:key+'-fill',flash:key+'-flash',label:key+'-label',sub:key+'-sub'};meta.queues.push(q);bounds.push({x:qx-qr,y:y-qr,w:qr*2,h:qr*2,role:'queue'});
      out.push(`<g data-role="recipient-ring" data-session="${i+1}">`);
      for(let k=0;k<8;k++)tag('path',{d:arc(qx,y,qr,inner,-180+k*45+1.3,-180+k*45+43.7),fill:C.empty,stroke:C.edge,'stroke-width':1.5});
      tag('path',{id:q.fill,d:arc(qx,y,qr,inner,a,b),fill:C.focus,opacity:0,'data-role':'queue-copy'});tag('path',{id:q.flash,d:arc(qx,y,qr,inner,a,b),fill:C.active,opacity:0,'data-role':'queue-arrival-flash'});
      txt('비움',qx,y,11,C.muted,'middle',true,{id:q.label});txt(`세션 ${i+1}`,qx,y-qr-12,11,C.muted);txt('SubRef()',qx,y+qr+14,11,C.muted,'middle',true,{id:q.sub});
      out.push('</g>');pin(qx-qr-6,y);
      const packet=meta.packets[after?0:i],start=[packet.x+packet.w/2,packet.y+packet.h+6],trunk=compact?px+pw+32:packet.x+packet.w+44;
      const points=chamfer([start,[start[0],start[1]+4],[trunk,start[1]+4],[trunk,y],[qx-qr-6,y]]);
      wire(points,C.track,true,.65);meta.copy.push(beam(points,sid(row,'copy',i)));
      const copyX=(trunk+qx-qr-6)/2;txt('Copy',copyX,y+15,11,C.muted,'middle',true,{id:sid(row,'copy-cue',i)});meta.cues.push(sid(row,'copy-cue',i));
    }
    const mapOut=compact?[mapX+60,mapY+mapH+6]:[mapX+mapW+6,mapY+mapH/2];pin(...mapOut);
    for(let i=0;i<packetYs.length;i++){
      const end=[px-6,packetYs[i]],p=compact?chamfer([mapOut,[mapOut[0],mapOut[1]+6],[px-14,mapOut[1]+6],[px-14,end[1]],end]):chamfer([mapOut,[mapOut[0]+38,mapOut[1]],[mapOut[0]+38,end[1]],end]);
      wire(p,C.track,true,.65);meta.source.push(beam(p,sid(row,'source',i)));
    }
    const footer=offset+(compact?614:388);
    txt(after?'생성·직렬화 1회':'생성·직렬화 3회',px+pw/2,footer,12,C.text,'middle',false,{id:meta.created});txt('적재 3회',qx,footer,11,C.muted,'middle',false,{id:meta.enqueued});
    out.push('</g>');
    if(row===0)wire([[20,rowHeight-10],[width-20,rowHeight-10]],C.edge,false,.65);
  }
  return {markup:out.join('\n'),width,height,compact,rows,labels,traces,bounds,arc};
}
