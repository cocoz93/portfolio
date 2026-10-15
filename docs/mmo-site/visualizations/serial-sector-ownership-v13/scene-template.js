function createSectorReuseScene(width){
  width=Math.max(320,Math.round(width));
  const compact=width<700,rowHeight=compact?662:400,height=rowHeight*2,kind='sector-ownership-v13',msgWidth=compact?88:136,msgHeight=104;
  const C={bg:'var(--pcb-bg)',surface:'var(--pcb-surface)',edge:'var(--pcb-edge)',track:'var(--pcb-track)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',active:'var(--pcb-active)',focus:'var(--pcb-data-focus)',soft:'var(--pcb-soft)',empty:'var(--pcb-empty)',pin:'var(--pcb-pin)'};
  const out=[],labels=[],bounds=[],rows=[],paths=[],worlds=[],sid=key=>kind+'-'+key;
  const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  function tag(name,attrs,body=''){out.push(`<${name} ${Object.entries(attrs).map(([k,v])=>`${k}="${esc(v)}"`).join(' ')}>${body}</${name}>`);}
  function box(x,y,w,h,fill=C.surface,stroke=null,attrs={}){tag('rect',{x,y,width:w,height:h,fill,...(stroke?{stroke,'stroke-width':1.5}:{}),...attrs});}
  function txt(text,x,y,size=14,color=C.text,anchor='middle',attrs={}){labels.push({text,x,y,size,anchor,exclusive:attrs['data-exclusive'],family:attrs.class==='sector-ref'?'mono':'text'});tag('text',{x,y,'font-size':size,'dominant-baseline':'middle','text-anchor':anchor,fill:color,...attrs},esc(text));}
  function rawText(text,x,y,size=14,color=C.text,anchor='middle',attrs={}){tag('text',{x,y,'font-size':size,'dominant-baseline':'middle','text-anchor':anchor,fill:color,...attrs},esc(text));}
  function wire(points,color=C.edge,attrs={}){for(let i=1;i<points.length;i++)if(points[i][0]!==points[i-1][0]&&points[i][1]!==points[i-1][1])throw Error('Non-orthogonal trace');paths.push(points);tag('path',{d:points.map((p,i)=>`${i?'L':'M'}${p.join(' ')}`).join(' '),fill:'none',stroke:color,'stroke-width':1.5,...attrs});}
  function pin(x,y,side){wire([[x,y],[x+side*5,y]],C.pin,{opacity:.55});}
/* MAGE_RENDERER */
  box(0,0,width,height,C.bg);mageDefinition();
  function notice(points,key){
    const trace=sid(key+'-notice'),head=sid(key+'-notice-head');let length=0;for(let i=1;i<points.length;i++)length+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);
    tag('path',{id:trace,d:points.map((p,i)=>`${i?'L':'M'}${p.join(' ')}`).join(' '),fill:'none',stroke:C.active,'stroke-width':1.5,'stroke-dasharray':length,'stroke-dashoffset':length,opacity:0,'data-role':'notice-arrow'});tag('polygon',{id:head,points:'0,0 0,0 0,0',fill:C.active,opacity:0});return {points,length,trace,head};
  }
/* WORLD_RENDERER */
  function pool(cx,cy,key){
    const w=80,h=36,flash=sid(key+'-pool-flash'),b={cx,cy,x:cx-w/2,y:cy-h/2,w,h,left:cx-w/2,right:cx+w/2};bounds.push({...b,role:'msg-pool'});
    box(b.x+4,b.y-4,w-8,h,C.bg,C.edge,{rx:2});box(b.x,b.y,w,h,C.surface,C.edge,{rx:2});
    for(const px of [cx-12,cx,cx+12])wire([[px,b.y+h],[px,b.y+h+4]],C.pin,{opacity:.55});
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
    for(const px of [cx-12,cx,cx+12]){wire([[px,y-4],[px,y]],C.pin,{opacity:.55});wire([[px,y+msgHeight],[px,y+msgHeight+4]],C.pin,{opacity:.55});}
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
    else glyph=bufferGlyph(0,0,title,key+'-glyph',true,type==='return'?0:1,type==='return');
    out.push('</g>');return {points,length,trace,carrier,type,glyphSize:type==='copy'?[64,24]:[msgWidth,msgHeight],glyph:type==='copy'?null:glyph};
  }
  const identity='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0',contentWidth=Math.min(width,784),pad=(width-contentWidth)/2+24;
  for(let row=0;row<2;row++){
    const after=row===1,key=after?'after':'before',offset=row*rowHeight,group=sid(key),matrix=sid(key+'-matrix');
    const a={group,matrix,messages:[],queues:[],copies:[],allocations:[],returns:[],ref:null,result:sid(key+'-result')};rows.push(a);
    out.push(`<defs><filter id="${group}-gray" color-interpolation-filters="sRGB"><feColorMatrix id="${matrix}" type="matrix" values="${identity}"></feColorMatrix></filter></defs><g id="${group}" filter="url(#${group}-gray)">`);
    const moduleLeft=compact?12:pad+208,moduleRight=compact?width-12:width-pad,mx=(moduleLeft+moduleRight)/2;
    const xs=[moduleLeft+msgWidth/2,mx,moduleRight-msgWidth/2],msgY=offset+(compact?428:184),queueY=offset+(compact?568:320),poolY=offset+(compact?332:84);
    txt(after?'변경 후':'변경 전',compact?24:pad,offset+30,14,after?C.active:C.muted,'start');
    txt(after?'1회 생성 · 3회 사용':'3회 생성',compact?width-24:mx,offset+30,compact?16:20,after?C.active:C.text,compact?'end':'middle',{id:a.result});
    const worldX=compact?(width-180)/2:pad,worldY=offset+(compact?88:132),w=world(worldX,worldY,key);worlds.push(w);
    txt('섹터 이동',worldX+90,worldY-24,12,C.muted);txt('같은 알림 · 수신자 3명',worldX+90,worldY+204,12,C.muted);
    a.pool=pool(mx,poolY,key);
    for(let i=0;i<(after?1:3);i++)a.messages.push(msg(after?mx:xs[i],msgY,after?'Msg':'Msg '+(i+1),key+'-msg-'+i));
    for(let i=0;i<3;i++){
      const m=a.messages[after?0:i],q=ring(xs[i],queueY,i,key+'-q-'+i);a.queues.push(q);
      const busY=offset+(compact?514:270);a.copies.push(flight([[m.cx,m.bottom+12],[m.cx,busY],[q.cx,busY],[q.cx,q.top-6]],key+'-copy-'+i));
    }
    txt('세션 SendQ',mx,queueY+(compact?52:54),13,C.muted);
    for(let i=0;i<a.messages.length;i++){
      const m=a.messages[i],points=[[a.pool.cx,a.pool.cy],[m.cx,m.cy]],title=after?'Msg':'Msg '+(i+1);
      a.allocations.push(flight(points,key+'-allocate-'+i,'allocation',title));a.returns.push(flight([...points].reverse(),key+'-return-'+i,'return',title));
    }
    if(after)a.ref=a.messages[0].ref;
    out.push('</g>');if(!after)wire([[24,rowHeight],[width-24,rowHeight]],C.edge);
  }
  return {markup:out.join('\n'),width,height,compact,worlds,rows,labels,bounds,paths,kind};
}

/* REUSE_ENGINE */

function applySectorFrame(scene,state,set){
  const identity=[1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0],gray=[.2126,.7152,.0722,0,0,.2126,.7152,.0722,0,0,.2126,.7152,.0722,0,0,0,0,0,1,0];
  function moveFlight(b,active,p){
    const t=reuseEase(p),opacity=active?(b.type==='return'?Math.min(1,(1-p)/.08):b.type==='allocation'?Math.min(1,p/.08)*(1-reuseEase((p-.88)/.12)):Math.min(1,p/.1,(1-p)/.08)):0;
    const scale=b.type==='allocation'?.36+.64*t:b.type==='return'?1-.64*t:1;
    set(b.trace,{opacity:active&&b.type==='copy'?.65:0,d:pathSlice(b,Math.max(0,t-22/b.length),t)});set(b.carrier,{opacity,transform:`translate(${reusePoint(b,t).join(' ')}) scale(${scale})`});
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
      const arriving=r.transfer&&r.transfer.kind==='allocation'&&r.transfer.actor===j,arrival=arriving?reuseEase((r.transfer.p-.88)/.12):0;
      set(m.group,{opacity:state.preview||f.live?1:r.returned[j]?.5:.12+.88*arrival});set(m.content,{opacity:f.live?1:0});set(m.mask,{width:m.fullWidth*f.build});set(m.flash,{opacity:pulse});set(m.dataLabel,{fill:pulse>=.5?'var(--pcb-bg)':'var(--pcb-text)'});set(m.rim,{opacity:pulse});set(m.returned,{opacity:r.returned[j]?1:0});
      const refEase=reuseEase((state.time-f.refAt)/180);set(m.ref,{opacity:state.preview||f.live||r.returned[j]?.5+.5*refEase:0},'Ref '+f.ref);
      for(let k=0;k<4;k++)set(m.pips[k],{opacity:k<f.ref&&f.live?1:0});
      for(const [kind,flights] of [['allocation',a.allocations],['return',a.returns]]){const active=r.transfer&&r.transfer.kind===kind&&r.transfer.actor===j;moveFlight(flights[j],active,active?r.transfer.p:0);}
    }
    set(a.pool.flash,{opacity:r.transfer?Math.sin(r.transfer.p*Math.PI):0});set(a.result,{},i===0?`${r.created}회 생성`:`${r.created}회 생성 · ${r.copies}회 사용`);
  }
}
