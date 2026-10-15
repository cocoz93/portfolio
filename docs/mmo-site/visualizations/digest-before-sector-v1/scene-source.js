// A single completed movement Msg is delivered to three representative sectors.
// This drawing explains per-recipient enqueue; it does not model WSASend or allocation.
function createBeforeProgram(){
  const segments=[];let end=0;
  function add(phase,ms,recipient=-1){const duration=ms/1.25;segments.push({phase,recipient,start:end,end:end+duration});end+=duration;}
  add('idle',400);add('move',1250);add('settle',300);add('born',600);add('ready',500);add('targets',750);
  for(let j=0;j<3;j++){add('select',400,j);add('deliver',900,j);add('hold',1100,j);}
  add('done',700);return {segments,end};
}
function beforeFrame(time,program){
  const clamp=p=>Math.max(0,Math.min(1,p)),ease=p=>p*p*(3-2*p);
  const f={phase:'완료 · Msg 하나를 수신 섹터별로 순회해 개별 적재',step:'done',progress:1,move:0,born:0,targets:0,recipient:-1,calls:[0,0,0],moving:false,facing:'south',done:time>=program.end};
  for(const s of program.segments){
    if(time<s.start)break;const progress=clamp((time-s.start)/(s.end-s.start)),complete=time>=s.end;
    if(s.phase==='move')f.move=ease(progress);
    if(s.phase==='born')f.born=ease(progress);
    if(s.phase==='targets')f.targets=ease(progress);
    if(s.phase==='deliver'&&complete)f.calls[s.recipient]=1;
    if(!complete){f.step=s.phase;f.progress=progress;f.recipient=s.recipient;f.moving=s.phase==='move';f.facing=f.moving?'east':'south';
      const messages={idle:'이동 준비',move:'A가 왼쪽 중앙 섹터에서 가운데 섹터로 이동',settle:'이동 완료',born:'이동 Msg 생성',ready:'Msg 준비 완료',targets:'유효범위 중 수신 섹터 3곳 선택',select:'R'+(s.recipient+1)+' 순회 · 주민 S'+(s.recipient+1)+' 선택',deliver:'Msg 1 → S'+(s.recipient+1)+' SendQ',hold:'S'+(s.recipient+1)+' 적재 완료',done:'세 수신자 적재 완료'};
      f.phase='변경 전 · '+messages[s.phase];break;
    }
  }
  if(f.done){f.step='done';f.recipient=-1;}return f;
}
function beforePoint(points,progress){
  const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1])),length=lengths.reduce((a,b)=>a+b,0);let remaining=length*Math.max(0,Math.min(1,progress));
  for(let i=0;i<lengths.length;i++){if(remaining<=lengths[i]||i===lengths.length-1){const p=lengths[i]?remaining/lengths[i]:0;return [points[i][0]+(points[i+1][0]-points[i][0])*p,points[i][1]+(points[i+1][1]-points[i][1])*p];}remaining-=lengths[i];}return points[0];
}
function beforeTrace(points,progress){
  const length=points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-points[i][0],p[1]-points[i][1]),0);let remaining=length*Math.max(0,Math.min(1,progress)),out=[points[0]];
  for(let i=1;i<points.length;i++){const d=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);if(remaining>=d){out.push(points[i]);remaining-=d;}else{const p=d?remaining/d:0;out.push([points[i-1][0]+(points[i][0]-points[i-1][0])*p,points[i-1][1]+(points[i][1]-points[i-1][1])*p]);break;}}
  return out.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' ');
}
function createBeforeScene(width){
  width=Math.max(320,Math.round(width));const compact=width<700,height=compact?744:424,kind='digest-before-sector';
  const C={bg:'var(--pcb-bg)',surface:'var(--pcb-surface)',edge:'var(--pcb-edge)',track:'var(--pcb-track)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',active:'var(--pcb-active)',focus:'var(--pcb-data-focus)',soft:'var(--pcb-soft)',empty:'var(--pcb-empty)',pin:'var(--pcb-pin)',target:'var(--pcb-target)'};
  const out=[],labels=[],bounds=[],paths=[],sid=k=>kind+'-'+k,esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  function tag(name,attrs,body=''){out.push(`<${name} ${Object.entries(attrs).map(([k,v])=>`${k}="${esc(v)}"`).join(' ')}>${body}</${name}>`);}
  function box(x,y,w,h,fill=C.surface,stroke=null,attrs={}){tag('rect',{x,y,width:w,height:h,fill,...(stroke?{stroke,'stroke-width':1.5}:{}),...attrs});}
  function txt(text,x,y,size=14,color=C.text,anchor='middle',attrs={}){labels.push({text,x,y,size,anchor,local:attrs['data-local']==='true'});tag('text',{x,y,'font-size':size,'dominant-baseline':'middle','text-anchor':anchor,fill:color,...attrs},esc(text));}
  function wire(points,color=C.track,attrs={}){for(let i=1;i<points.length;i++)if(points[i][0]!==points[i-1][0]&&points[i][1]!==points[i-1][1])throw Error('Non-orthogonal circuit');paths.push(points);tag('path',{d:points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' '),fill:'none',stroke:color,'stroke-width':1.5,...attrs});}
  function contact(x,y){tag('circle',{cx:x,cy:y,r:2.5,fill:C.pin});tag('circle',{cx:x,cy:y,r:1.05,fill:C.bg});}
  /*CHARACTERS*/
  box(0,0,width,height,C.bg);mageDefinition();swordsmanDefinition();
  txt('변경 전',24,28,13,C.muted,'start');
  const world={x:compact?(width-216)/2:24,y:92,size:216,cell:72,hero:sid('hero'),origin:sid('origin'),destination:sid('destination'),arrow:sid('move-arrow'),targets:[]};
  txt('섹터 이동',world.x+108,64,12,C.muted);bounds.push({kind:'sector-map',x:world.x,y:world.y,w:216,h:216});
  box(world.x,world.y,216,216,C.bg,C.edge,{'data-role':'nine-sector-map'});
  for(let i=0;i<9;i++)box(world.x+(i%3)*72+1,world.y+Math.floor(i/3)*72+1,70,70,C.bg,null,{'data-role':'sector-cell','data-sector':i});
  for(let i=1;i<3;i++){wire([[world.x+i*72,world.y],[world.x+i*72,world.y+216]],C.edge);wire([[world.x,world.y+i*72],[world.x+216,world.y+i*72]],C.edge);}
  box(world.x+1,world.y+73,70,70,C.soft,null,{id:world.origin,opacity:.6});box(world.x+73,world.y+73,70,70,C.soft,null,{id:world.destination,opacity:0});
  for(let j=0;j<3;j++){
    const x=world.x+j*72,y=world.y,fill=sid('target-'+j+'-fill'),rim=sid('target-'+j+'-rim'),label=sid('target-'+j+'-label');
    box(x+2,y+2,68,68,C.target,null,{id:fill,opacity:0});box(x+2,y+2,68,68,'none',C.target,{id:rim,opacity:0});txt('R'+(j+1),x+36,y+13,11,C.muted,'middle',{id:label});
    swordsman(x+36,y+36,30,'S'+(j+1));txt('S'+(j+1),x+36,y+61,11,C.muted);world.targets.push({fill,rim,label,x,y,w:72,h:72});
  }
  out.push(`<g id="${world.arrow}" opacity="0">`);wire([[world.x+58,world.y+80],[world.x+79,world.y+80]],C.active);tag('polygon',{points:`${world.x+79},${world.y+80} ${world.x+74},${world.y+77} ${world.x+74},${world.y+83}`,fill:C.active});out.push('</g>');
  tag('use',{id:world.hero,href:'#bundle-mage-'+kind+'-south',transform:`translate(${world.x+36} ${world.y+108}) scale(1.125)`,'data-character':'mage','data-facing':'south','data-moving':'false'});
  txt('A',world.x+36,world.y+138,12,C.active,'middle',{id:sid('hero-label')});
  txt('수신 섹터 3곳 · 주민 1명씩 예시',world.x+108,compact?332:338,11,C.muted);
  const msg={x:compact?(width-160)/2:Math.round(width*.5)-56,y:compact?380:140,w:160,h:96,group:sid('msg'),mask:sid('msg-mask'),rim:sid('msg-rim'),label:sid('msg-label'),placeholder:sid('placeholder'),title:sid('msg-title')};msg.dataCy=msg.y+60;
  txt('직렬화 버퍼',msg.x+80,compact?354:64,12,C.muted);bounds.push({kind:'Msg',x:msg.x,y:msg.y,w:160,h:96});
  box(msg.x,msg.y,160,96,'none',C.edge,{opacity:.35});txt('대기',msg.x+80,msg.y+48,12,C.muted,'middle',{id:msg.placeholder});
  out.push(`<g id="${msg.group}" opacity="0">`);box(msg.x,msg.y,160,96,C.surface,C.edge);box(msg.x+1,msg.y+1,158,27,C.muted,null,{opacity:.14});txt('Msg 1',msg.x+12,msg.y+15,16,C.text,'start',{id:msg.title,class:'sector-mono'});wire([[msg.x+1,msg.y+29],[msg.x+159,msg.y+29]],C.edge);
  box(msg.x+12,msg.y+38,136,44,C.empty);box(msg.x+12,msg.y+38,24,44,C.empty,C.edge);txt('H',msg.x+24,msg.dataCy,11,C.muted);box(msg.x+37,msg.y+38,0,44,C.active,null,{id:msg.mask});txt('A 이동',msg.x+92,msg.dataCy,14,C.muted,'middle',{id:msg.label});box(msg.x,msg.y,160,96,'none',C.active,{id:msg.rim,opacity:0});out.push('</g>');
  if(!compact)txt('같은 Msg · 섹터별 순회',msg.x+80,msg.y+120,12,C.muted);
  const input=compact?[[world.x+220,world.y+108],[world.x+224,world.y+108],[world.x+224,msg.dataCy],[msg.x+164,msg.dataCy]]:[[world.x+220,world.y+108],[msg.x-4,msg.dataCy]];
  wire(input,C.track,{opacity:.7});contact(...input[0]);contact(...input.at(-1));
  const queues=[],routes=[],qcy=compact?620:0,qr=compact?28:34,qx=compact?0:width-58;
  if(compact)txt('SendQ',width/2+32,522,12,C.muted,'start');
  for(let j=0;j<3;j++){
    const cx=compact?width/2+(j-1)*90:qx,cy=compact?qcy:108+j*112,slots=[],rim=sid('queue-'+j+'-rim'),count=sid('queue-'+j+'-count'),numbers=[];
    tag('circle',{cx,cy,r:qr,fill:C.empty,stroke:C.edge,'stroke-width':1.5});
    for(let k=0;k<8;k++){
      const a=-Math.PI/2+k*Math.PI/4+.025,b=a+Math.PI/4-.05,ri=qr*.55,polar=(r,t)=>[cx+r*Math.cos(t),cy+r*Math.sin(t)],p=polar(qr,a),q=polar(qr,b),s=polar(ri,b),t=polar(ri,a),id=sid('queue-'+j+'-slot-'+k);
      tag('path',{id,d:`M${p.join(' ')} A${qr} ${qr} 0 0 1 ${q.join(' ')} L${s.join(' ')} A${ri} ${ri} 0 0 0 ${t.join(' ')} Z`,fill:C.empty,stroke:C.edge,'stroke-width':1.5});slots.push(id);
      if(k===0){const n=polar(qr*.78,(a+b)/2),number=sid('queue-'+j+'-number');txt('1',...n,11,C.muted,'middle',{id:number});numbers.push(number);}
    }
    tag('circle',{id:rim,cx,cy,r:qr+4,fill:'none',stroke:C.active,'stroke-width':1.5,opacity:0});txt('S'+(j+1),cx,cy,14,C.text,'middle',{class:'sector-mono'});txt('R'+(j+1)+' · SendQ',cx,compact?cy+43:cy-48,11,C.muted);txt('적재 0회',cx,compact?cy+63:cy+48,12,C.muted,'middle',{id:count});
    bounds.push({kind:'ring',x:cx-qr-4,y:cy-qr-4,w:(qr+4)*2,h:(qr+4)*2});queues.push({cx,cy,qr,rim,count,slots,numbers});
    const bus=compact?564:Math.round((msg.x+160+cx-qr-4)/2),points=compact?[[msg.x+80,msg.y+100],[msg.x+80,bus],[cx,bus],[cx,cy-qr-4]]:[[msg.x+164,msg.dataCy],[bus,msg.dataCy],[bus,cy],[cx-qr-4,cy]];
    routes.push(points);
  }
  // One shared neutral bus with three branches, using the same orthogonal routing as the transfer.
  if(compact){wire([[msg.x+80,msg.y+100],[msg.x+80,564]],C.track);wire([[queues[0].cx,564],[queues[2].cx,564]],C.track);for(const q of queues)wire([[q.cx,564],[q.cx,q.cy-q.qr-4]],C.track);}
  else{const bus=routes[0][1][0];wire([[msg.x+164,msg.dataCy],[bus,msg.dataCy]],C.track);wire([[bus,queues[0].cy],[bus,queues[2].cy]],C.track);for(const q of queues)wire([[bus,q.cy],[q.cx-q.qr-4,q.cy]],C.track);}
  for(const route of routes){contact(...route.at(-1));const[x,y]=route.at(-1),vertical=compact;tag('polygon',{points:vertical?`${x},${y+1} ${x-3},${y-5} ${x+3},${y-5}`:`${x+1},${y} ${x-5},${y-3} ${x-5},${y+3}`,fill:C.track});}
  const trail=sid('trail'),carrier=sid('carrier');tag('path',{id:trail,d:'M0 0',fill:'none',stroke:C.active,'stroke-width':1.5,opacity:0});out.push(`<g id="${carrier}" opacity="0">`);box(-23,-8,46,16,C.active);txt('Msg 1',0,0,11,C.bg,'middle',{'data-local':'true',class:'sector-mono'});out.push('</g>');
  wire([[24,height-28],[width-24,height-28]],C.edge);txt('유효범위 중 3섹터를 표시한 예시',width/2,height-11,11,C.muted);
  return {width,height,compact,markup:out.join('\n'),world,msg,queues,routes,input,trail,carrier,labels,bounds,paths};
}
function applyBeforeFrame(scene,f,set){
  const C={active:'var(--pcb-active)',muted:'var(--pcb-muted)',text:'var(--pcb-text)',target:'var(--pcb-target)',empty:'var(--pcb-empty)',bg:'var(--pcb-bg)'},w=scene.world,m=scene.msg,heroX=w.x+36+72*f.move;
  set(w.hero,{transform:`translate(${heroX} ${w.y+108}) scale(1.125)`,href:'#bundle-mage-digest-before-sector-'+f.facing,'data-facing':f.facing,'data-moving':String(f.moving)});set('digest-before-sector-hero-label',{x:heroX});set(w.arrow,{opacity:f.moving?1:0});set(w.origin,{opacity:.6*(1-f.move)});set(w.destination,{opacity:.6*f.move});
  for(let j=0;j<3;j++){const target=w.targets[j],current=j===f.recipient;set(target.fill,{opacity:f.targets*(current?.23:.075),fill:current?C.active:C.target});set(target.rim,{opacity:f.targets,stroke:current?C.active:C.target});set(target.label,{fill:current?C.text:f.targets?C.target:C.muted});}
  set(m.group,{opacity:f.born>0?1:0});set(m.placeholder,{opacity:f.born>0?0:1});set(m.mask,{width:111*f.born});set(m.label,{fill:f.born>.85?C.bg:C.text});set(m.rim,{opacity:f.born===1?1:0});
  for(let j=0;j<3;j++){const q=scene.queues[j],filled=f.calls[j]===1,current=j===f.recipient;for(let k=0;k<8;k++)set(q.slots[k],{fill:filled&&k===0?C.active:C.empty});set(q.numbers[0],{fill:filled?C.bg:C.muted});set(q.rim,{opacity:current&&['deliver','hold'].includes(f.step)?1:0});set(q.count,{fill:filled?C.text:C.muted},'적재 '+f.calls[j]+'회');}
  if(f.step==='deliver'){const route=scene.routes[f.recipient],p=beforePoint(route,f.progress);set(scene.carrier,{opacity:1,transform:`translate(${p[0]} ${p[1]})`});set(scene.trail,{opacity:1,d:beforeTrace(route,f.progress)});}
  else if(f.step==='hold'){set(scene.carrier,{opacity:0});set(scene.trail,{opacity:1,d:beforeTrace(scene.routes[f.recipient],1)});}
  else{set(scene.carrier,{opacity:0});set(scene.trail,{opacity:0});}
}
