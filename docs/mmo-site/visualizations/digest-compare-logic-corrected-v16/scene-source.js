// Both variants already use move-dirty aggregation; Digest changes the enqueue grouping.
const ACTOR_START=[0,2];
const ACTOR_MOVES=[{from:[0,2],to:[0,1],facing:'north'},{from:[0,1],to:[1,1],facing:'east'}];
const AFTER_PACKETS=[{id:1,cell:3,slot:0,type:'채팅'},{id:2,cell:4,slot:0,type:'최종 이동'}];
const RECIPIENTS=[{id:'S1',sector:0,offset:24},{id:'S2',sector:0,offset:60},{id:'S3',sector:2,offset:42}];
const RECEIVE_SECTORS=[{cell:0,residents:[0,1]},{cell:2,residents:[2]}];
const AFTER_SCOPE=[0,1,2].map(rx=>Array.from({length:9},(_,i)=>i).filter(i=>Math.abs(i%3-rx)<=1&&Math.floor(i/3)<=1));
const AFTER_SELECTED=AFTER_SCOPE.map(cells=>AFTER_PACKETS.filter(p=>cells.includes(p.cell)).slice().sort((a,b)=>a.cell-b.cell||a.slot-b.slot));
function packetAction(packet){return packet.type==='채팅'?'채팅!':'최종 이동';}
function moveActor(frame,packet,progress){const eased=progress*progress*(3-2*progress);frame.move=eased;frame.player=packet.from.map((v,i)=>v+(packet.to[i]-v)*eased);}
function digestHeight(count){return 72+34*count;}
function newFrame(time,program){return {phase:'완료',step:'done',progress:1,player:ACTOR_START.slice(),move:0,dirty:false,tick:false,source:[0,0],generated:[0,0],joined:[0,0],queues:[[],[],[]],calls:[0,0,0],completed:[0,0,0],sectorCompleted:[0,0,0],builds:[0,0,0],rx:-1,q:-1,item:-1,action:-1,targets:0,moving:false,facing:'south',done:time>=program.end};}
function createAfterProgram(){
  const segments=[];let end=0;function add(phase,ms,rx=-1,item=-1,q=-1,action=-1,last=false){segments.push({phase,rx,item,q,action,last,start:end,end:end+ms});end+=ms;}
  add('idle',300);add('move',550,-1,-1,-1,0);add('settle',200,-1,-1,-1,0);
  add('born',450,-1,0);add('stored',400,-1,0);
  add('move',550,-1,-1,-1,1);add('settle',200,-1,-1,-1,1);
  add('tick-end',650);add('born',450,-1,1);add('stored',400,-1,1);add('outbox-ready',650);add('targets',650);
  for(const sector of RECEIVE_SECTORS){const rx=sector.cell;add('select',650,rx);for(let i=0;i<AFTER_SELECTED[rx].length;i++){add('concat',400,rx,i);add('joined',100,rx,i);}add('ready',250,rx);
    for(let i=0;i<sector.residents.length;i++){const q=sector.residents[i];add('deliver',350,rx,-1,q);add('hold',650,rx,-1,q,-1,i===sector.residents.length-1);}
    if(rx!==2)add('reset',350,rx);
  }
  add('cleanup',250,2);add('done',700,2);return {segments,end};
}
function afterFrame(time,program){
  const clamp=p=>Math.max(0,Math.min(1,p)),ease=p=>p*p*(3-2*p),f=newFrame(time,program);
  for(const s of program.segments){
    if(time<s.start)break;const progress=clamp((time-s.start)/(s.end-s.start)),complete=time>=s.end;
    if(s.phase==='move'){moveActor(f,ACTOR_MOVES[s.action],progress);f.dirty=true;}
    if(s.phase==='tick-end')f.tick=true;
    if(s.phase==='born'){f.source[s.item]=ease(progress);if(complete)f.generated[s.item]=1;if(s.item===1)f.dirty=false;}
    if(s.phase==='targets')f.targets=ease(progress);
    if(s.phase==='select'){f.rx=s.rx;f.joined=[0,0];}
    if(s.phase==='joined')f.joined[s.item]=ease(progress);
    if(s.phase==='ready')f.builds[s.rx]=1;
    if(s.phase==='deliver'&&complete){f.calls[s.q]=1;f.queues[s.q]=AFTER_SELECTED[s.rx].map(p=>p.id);}
    if(s.phase==='hold'){f.completed[s.q]=ease(progress);if(s.last)f.sectorCompleted[s.rx]=ease(progress);}
    if(s.phase==='reset')f.joined=Array.from({length:2},(_,i)=>i<AFTER_SELECTED[s.rx].length?1-ease(progress):0);
    if(s.phase==='cleanup')f.source=f.source.map(()=>1-ease(progress));
    if(!complete){f.step=s.phase;f.progress=progress;f.rx=s.rx>=0?s.rx:f.rx;f.q=s.q;f.item=s.item;f.action=s.action;f.moving=s.phase==='move';f.facing=f.moving?ACTOR_MOVES[s.action].facing:'south';
      const packet=s.item>=0?(['concat','joined'].includes(s.phase)?AFTER_SELECTED[s.rx][s.item]:AFTER_PACKETS[s.item]):null,label='섹터 '+(s.rx+1),recipient=s.q>=0?RECIPIENTS[s.q].id:'';
      const actions={idle:'왼쪽 맨 아래에서 시작',move:ACTOR_MOVES[s.action]?.facing==='north'?'A 위로 이동 · dirty 등록':'A 오른쪽 이동 · 최종 상태 갱신',settle:'이동 완료 · Msg 생성 대기',born:packet?.type==='채팅'?'A 채팅! · Msg 1 생성':'틱 끝 · 최종 이동 Msg 2 생성',stored:'Msg '+packet?.id+' 발생 섹터에 보관','tick-end':'틱 끝 · dirty A의 최종 이동 상태 읽기','outbox-ready':'발생 섹터별 Msg 보관 완료',targets:'주민이 있는 수신 섹터 순회',select:label+'의 유효범위에서 Msg 선택',concat:'Msg '+packet?.id+' → '+label+' Digest',joined:'Msg '+packet?.id+' 연접 완료',ready:label+' Digest 구성 1회 완료',deliver:label+' Digest → '+recipient+' SendQ · 1회 적재',hold:s.last?label+' 주민 적재 완료 · 회색 전환':recipient+' 완료 · 같은 Digest로 S2 적재',reset:'다음 수신 섹터용 임시버퍼 준비',cleanup:'모든 수신 섹터 완료 · 보관 Msg 해제',done:'같은 섹터 주민마다 한 번 적재 완료'};
      f.phase='변경 후 · '+actions[s.phase];break;
    }
  }
  if(f.done){f.step='done';f.item=-1;f.q=-1;}return f;
}
function afterPoint(points,progress){const distances=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1])),total=distances.reduce((a,b)=>a+b,0);let left=total*Math.max(0,Math.min(1,progress));for(let i=0;i<distances.length;i++){if(left<=distances[i]||i===distances.length-1){const p=distances[i]?left/distances[i]:0;return [points[i][0]+(points[i+1][0]-points[i][0])*p,points[i][1]+(points[i+1][1]-points[i][1])*p];}left-=distances[i];}return points[0];}
function afterTrace(points,progress){const length=points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-points[i][0],p[1]-points[i][1]),0);let left=length*Math.max(0,Math.min(1,progress)),out=[points[0]];for(let i=1;i<points.length;i++){const d=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);if(left>=d){out.push(points[i]);left-=d;}else{const t=d?left/d:0;out.push([points[i-1][0]+(points[i][0]-points[i-1][0])*t,points[i-1][1]+(points[i][1]-points[i-1][1])*t]);break;}}return out.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' ');}
function createAfterScene(width,variant='after'){
  width=Math.max(320,Math.round(width));const compact=width<700,height=compact?912:400,before=variant==='before',kind=before?'digest-before-matched':'digest-after-sector';
  const C={bg:'var(--pcb-bg)',surface:'var(--pcb-surface)',edge:'var(--pcb-edge)',track:'var(--pcb-track)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',active:'var(--pcb-active)',focus:'var(--pcb-data-focus)',soft:'var(--pcb-soft)',empty:'var(--pcb-empty)',pin:'var(--pcb-pin)',target:'var(--pcb-target)',done:'var(--pcb-done)'};
  const out=[],labels=[],bounds=[],paths=[],sid=k=>kind+'-'+k,esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  function tag(name,attrs,body=''){out.push(`<${name} ${Object.entries(attrs).map(([k,v])=>`${k}="${esc(v)}"`).join(' ')}>${body}</${name}>`);}
  function box(x,y,w,h,fill=C.surface,stroke=null,attrs={}){tag('rect',{x,y,width:w,height:h,fill,...(stroke?{stroke,'stroke-width':1.5}:{}),...attrs});}
  function txt(text,x,y,size=14,color=C.text,anchor='middle',attrs={}){labels.push({text,x,y,size,anchor,local:attrs['data-local']==='true'});tag('text',{x,y,'font-size':size,'dominant-baseline':'middle','text-anchor':anchor,fill:color,...attrs},esc(text));}
  function wire(points,color=C.track,attrs={}){for(let i=1;i<points.length;i++)if(points[i][0]!==points[i-1][0]&&points[i][1]!==points[i-1][1])throw Error('Non-orthogonal circuit');paths.push(points);tag('path',{d:points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' '),fill:'none',stroke:color,'stroke-width':1.5,...attrs});}
  function contact(x,y){tag('circle',{cx:x,cy:y,r:2.5,fill:C.pin});tag('circle',{cx:x,cy:y,r:1.05,fill:C.bg});}
  /*CHARACTERS*/
  box(0,0,width,height,C.bg);mageDefinition();swordsmanDefinition();txt(before?'변경 전':'변경 후',24,28,12,before?C.muted:C.active,'start');
  const world={x:compact?(width-252)/2:24,y:92,size:252,cell:84,hero:sid('hero'),heroLabel:sid('hero-label'),arrow:sid('move-arrow'),northArrow:sid('north-arrow'),eastArrow:sid('east-arrow'),targets:[],cells:[],scope:sid('scope')};
  txt(before?'① 이동 · 채팅':'① 섹터별 Msg',world.x+126,64,14,C.muted,'middle',{id:sid('stage-1')});bounds.push({kind:'sector-map',x:world.x,y:world.y,w:252,h:252});box(world.x,world.y,252,252,C.bg,C.edge,{'data-role':'nine-sector-map','stroke-opacity':.45});
  for(let i=0;i<9;i++){const x=world.x+(i%3)*84,y=world.y+Math.floor(i/3)*84,id=sid('cell-'+i);box(x+1,y+1,82,82,C.bg,null,{'data-role':'sector-cell','data-sector':i});box(x+1,y+1,82,82,C.active,null,{id,opacity:0});world.cells.push({x,y,id});}
  for(let i=1;i<3;i++){wire([[world.x+i*84,world.y],[world.x+i*84,world.y+252]],C.edge,{opacity:.45});wire([[world.x,world.y+i*84],[world.x+252,world.y+i*84]],C.edge,{opacity:.45});}
  for(let j=0;j<3;j++){const x=world.x+j*84,y=world.y,fill=sid('target-'+j+'-fill'),rim=sid('target-'+j+'-rim'),doneFill=sid('target-'+j+'-done-fill'),doneRim=sid('target-'+j+'-done-rim');box(x+2,y+2,80,80,C.target,null,{id:fill,opacity:0});box(x+2,y+2,80,80,C.done,null,{id:doneFill,opacity:0});box(x+2,y+2,80,80,'none',C.target,{id:rim,opacity:0});box(x+2,y+2,80,80,'none',C.done,{id:doneRim,opacity:0});if(j!==1)txt('섹터 '+(j+1),x+42,y+15,12,C.muted);world.targets.push({x,y,fill,rim,doneFill,doneRim});}
  world.residents=RECIPIENTS.map((p,j)=>{const x=world.x+p.sector*84+p.offset,y=world.y,label=sid('resident-'+j+'-label');swordsman(x,y+44,30,p.id);txt(p.id,x,y+70,14,C.text,'middle',{id:label});return {x,y,label,sector:p.sector};});
  box(world.x,world.y,168,168,'none',C.active,{id:world.scope,opacity:0});
  out.push(`<g id="${world.arrow}" opacity="0"><g id="${world.northArrow}" opacity="0">`);wire([[world.x+42,world.y+187],[world.x+42,world.y+151]],C.active);tag('polygon',{points:`${world.x+42},${world.y+151} ${world.x+39},${world.y+156} ${world.x+45},${world.y+156}`,fill:C.active});out.push(`</g><g id="${world.eastArrow}" opacity="0">`);wire([[world.x+65,world.y+126],[world.x+101,world.y+126]],C.active);tag('polygon',{points:`${world.x+101},${world.y+126} ${world.x+96},${world.y+123} ${world.x+96},${world.y+129}`,fill:C.active});out.push('</g></g>');
  tag('use',{id:world.hero,href:'#bundle-mage-'+kind+'-south',transform:`translate(${world.x+42} ${world.y+210}) scale(1.125)`,'data-character':'mage','data-facing':'south'});txt('A',world.x+71,world.y+180,14,C.active,'middle',{id:world.heroLabel});
  // Msgs live in their source cells, not above the receiving players.
  const sourceMsgs=AFTER_PACKETS.map((p,i)=>{const cell=world.cells[p.cell],x=cell.x+6,y=cell.y+58,group=sid('source-'+i+'-Msg'),data=sid('source-'+i+'-data'),label=sid('source-'+i+'-label'),rim=sid('source-'+i+'-rim');out.push(`<g id="${group}" opacity="0" data-role="source-sector-Msg" data-source-sector="${p.cell}" data-msg-id="${p.id}">`);box(x,y,72,24,C.empty,C.edge,{id:rim});box(x+1,y+1,0,22,C.active,null,{id:data});txt('Msg '+p.id,x+36,y+12,14,C.bg,'middle',{id:label,class:'sector-mono'});out.push('</g>');bounds.push({kind:'source-Msg',x,y,w:72,h:24});return {x,y,w:72,h:24,group,data,label,rim};});
  world.note=sid('world-note');txt('이동 → dirty 등록',world.x+126,world.y+276,12,C.muted,'middle',{id:world.note});
  // Chat is emitted by A at its receive-time source sector.
  const event=sid('event'),eventLabel=sid('event-label'),eventPlate=sid('event-plate');out.push(`<g id="${event}" opacity="0" data-role="chat-action">`);box(-33,-13,66,26,C.active,null,{id:eventPlate});box(-1.5,13,3,5,C.active);txt('채팅!',0,0,14,C.bg,'middle',{'data-local':'true',id:eventLabel});out.push('</g>');
  const digest={x:compact?(width-176)/2:Math.round(width*.5)-42,y:(compact?432:114)+(before?56:0),w:176,h:before?96:digestHeight(AFTER_PACKETS.length),title:sid('digest-title'),rim:sid('digest-rim'),count:sid('digest-count'),rows:[]};
  txt(before?'② Msg':'② Digest',digest.x+88,compact?404:64,14,C.muted,'middle',{id:sid('stage-2')});box(digest.x,digest.y,176,digest.h,C.surface,C.edge,{id:digest.rim});box(digest.x+1,digest.y+1,174,27,C.muted,null,{opacity:.14});txt(before?'Msg':'Digest',digest.x+12,digest.y+15,16,C.text,'start',{id:digest.title,class:'sector-mono'});wire([[digest.x+1,digest.y+29],[digest.x+175,digest.y+29]],C.edge);bounds.push({kind:before?'Msg':'Digest',x:digest.x,y:digest.y,w:176,h:digest.h});
  for(let i=0;i<(before?1:AFTER_PACKETS.length);i++){const x=digest.x+10,y=digest.y+38+i*34,group=sid('digest-row-'+i),data=sid('digest-row-'+i+'-data'),label=sid('digest-row-'+i+'-label');out.push(`<g id="${group}" opacity="0">`);box(x,y,156,28,C.empty,C.edge);box(x+1,y+1,23,26,C.empty);txt('H',x+12,y+14,12,C.muted);box(x+25,y+1,0,26,C.active,null,{id:data});txt('Msg 1 · 이동',x+90,y+14,14,C.muted,'middle',{id:label});out.push('</g>');digest.rows.push({x,y,cy:y+14,group,data,label});}
  txt(before?'Msg 준비':'구성 대기',digest.x+88,digest.y+digest.h-14,12,C.muted,'middle',{id:digest.count});
  // Gathering uses a moving packet number and matching Msg emphasis, without a wire or trail.
  const gathers=AFTER_SELECTED.map(packets=>packets.map((p,i)=>{const source=sourceMsgs[AFTER_PACKETS.findIndex(v=>v.id===p.id)];return [[source.x+36,source.y+12],[digest.rows[before?0:i].x+33,digest.rows[before?0:i].cy]];}));
  const queues=[],routes=[],qx=compact?0:width-58,qr=compact?28:34;
  txt('③ SendQ',compact?width/2+18:qx,compact?704:64,14,C.muted,compact?'start':'middle',{id:sid('stage-3')});
  for(let j=0;j<3;j++){const cx=compact?width/2+(j-1)*90:qx,cy=compact?820:114+j*104,slots=[],numbers=[],rim=sid('queue-'+j+'-rim'),count=sid('queue-'+j+'-count');tag('circle',{cx,cy,r:qr,fill:C.empty});
    for(let k=0;k<8;k++){const a=-Math.PI/2+k*Math.PI/4+.025,b=a+Math.PI/4-.05,ri=qr*.55,polar=(r,t)=>[cx+r*Math.cos(t),cy+r*Math.sin(t)],p=polar(qr,a),q=polar(qr,b),s=polar(ri,b),t=polar(ri,a),id=sid('queue-'+j+'-slot-'+k);tag('path',{id,d:`M${p.join(' ')} A${qr} ${qr} 0 0 1 ${q.join(' ')} L${s.join(' ')} A${ri} ${ri} 0 0 0 ${t.join(' ')} Z`,fill:C.empty,stroke:C.edge,'stroke-width':1.5});slots.push(id);if(k<4){const point=polar(qr*.78,(a+b)/2),number=sid('queue-'+j+'-number-'+k);txt('1',...point,11,C.muted,'middle',{id:number,opacity:0});numbers.push(number);}}
    tag('circle',{id:rim,cx,cy,r:qr,fill:'none',stroke:C.active,'stroke-width':1.5,opacity:0});txt('S'+(j+1),cx,cy,16,C.text,'middle',{class:'sector-mono'});txt('적재 0회',cx,compact?cy+63:cy+48,12,C.muted,'middle',{id:count});bounds.push({kind:'ring',x:cx-qr-4,y:cy-qr-4,w:(qr+4)*2,h:(qr+4)*2});queues.push({cx,cy,qr,slots,numbers,rim,count});
    const outputY=digest.y+digest.h/2,bus=compact?748:Math.round((digest.x+176+cx-qr-4)/2);routes.push(compact?[[digest.x+88,digest.y+digest.h+4],[digest.x+88,bus],[cx,bus],[cx,cy-qr-4]]:[[digest.x+180,outputY],[bus,outputY],[bus,cy],[cx-qr-4,cy]]);
  }
  // SendQ delivery is shown by a moving copy of the payload, without a circuit bus.
  const trail=sid('trail'),carrier=sid('carrier'),carrierBox=sid('carrier-box'),carrierText=sid('carrier-text');tag('path',{id:trail,d:'M0 0',fill:'none',stroke:C.active,'stroke-width':1.5,opacity:0});out.push(`<g id="${carrier}" opacity="0">`);box(-8,-8,16,16,C.active,null,{id:carrierBox});txt('1',0,0,11,C.bg,'middle',{'data-local':'true',class:'sector-mono',id:carrierText});out.push('</g>');
  return {width,height,compact,kind,variant,markup:out.join('\n'),world,sourceMsgs,digest,queues,gathers,routes,trail,carrier,carrierBox,carrierText,event,eventLabel,eventPlate,labels,bounds,paths};
}
function applyAfterFrame(scene,f,set){
  const C={active:'var(--pcb-active)',soft:'var(--pcb-soft)',target:'var(--pcb-target)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',bg:'var(--pcb-bg)',empty:'var(--pcb-empty)',edge:'var(--pcb-edge)'},w=scene.world,d=scene.digest,before=scene.variant==='before',heroX=w.x+42+84*f.player[0],heroY=w.y+42+84*f.player[1];
  set(w.hero,{transform:`translate(${heroX} ${heroY}) scale(1.125)`,href:'#bundle-mage-'+scene.kind+'-'+f.facing,'data-facing':f.facing});set(w.heroLabel,{x:heroX+29,y:heroY-30});set(w.arrow,{opacity:f.moving?1:0});set(w.northArrow,{opacity:f.moving&&f.facing==='north'?1:0});set(w.eastArrow,{opacity:f.moving&&f.facing==='east'?1:0});
  set(w.note,{fill:f.dirty||f.tick?C.active:C.muted},f.tick?'틱 끝 · 최종 이동 Msg':f.dirty?'이동 → dirty 등록':'이동 · 채팅');
  const scoped=f.rx>=0,selected=scoped?AFTER_SELECTED[f.rx]:[],scope=scoped?AFTER_SCOPE[f.rx]:[],currentDone=scoped?f.sectorCompleted[f.rx]:0;
  for(let i=0;i<9;i++)set(w.cells[i].id,{opacity:scope.includes(i)&&!f.sectorCompleted[i]?.035*(1-currentDone):0});
  for(let j=0;j<3;j++){const target=w.targets[j],hasResidents=RECIPIENTS.some(p=>p.sector===j),valid=hasResidents&&(!before||AFTER_SELECTED[j].some(p=>p.id===AFTER_PACKETS[f.packet]?.id)),current=scoped&&j===f.rx,done=f.sectorCompleted[j],level=valid?f.targets:0;
    set(target.fill,{opacity:level*(current?.20:.075)*(1-done)});set(target.doneFill,{opacity:level*.12*done});set(target.rim,{opacity:level*(1-done)});set(target.doneRim,{opacity:level*done});
  }
  for(let q=0;q<3;q++)set(w.residents[q].label,{fill:f.completed[q]===1?C.muted:C.text});
  const left=f.rx===2?1:0;set(w.scope,{opacity:scoped?.32*(1-currentDone):0,x:w.x+left*84,width:168});
  for(let i=0;i<scene.sourceMsgs.length;i++){const msg=scene.sourceMsgs[i],p=AFTER_PACKETS[i],current=f.step==='concat'&&selected[f.item]?.id===p.id,level=f.source[i];set(msg.group,{opacity:level>0?1:0});set(msg.data,{width:70*level,fill:current?C.active:C.soft});set(msg.label,{fill:current?C.bg:C.text});set(msg.rim,{stroke:current?C.active:C.edge});}
  set(d.rim,{height:d.h});set(d.count,{y:d.y+d.h-14});
  for(let i=0;i<d.rows.length;i++){const row=d.rows[i],fill=f.joined[i],p=selected[i];set(row.group,{opacity:p&&fill>0?1:0});set(row.data,{width:130*fill});set(row.label,{fill:fill>.9?C.bg:C.text},p?'Msg '+p.id+' · '+packetAction(p):'');}
  const built=scoped&&selected.length>0&&f.joined.slice(0,selected.length).every(v=>v===1),count=f.joined.filter(v=>v===1).length;
  set(d.title,{},scoped?'Digest · 섹터 '+(f.rx+1):'Digest');set(d.rim,{stroke:built?C.active:C.edge});set(d.count,{fill:built?C.text:C.muted},scoped?(built?selected.length+' Msg · 구성 1회':'연접 '+count+' / '+selected.length):'구성 대기');
  for(let q=0;q<3;q++){const ring=scene.queues[q],ids=f.queues[q],current=f.q===q&&['deliver','hold'].includes(f.step);for(let k=0;k<8;k++){const filled=k<ids.length;set(ring.slots[k],{fill:filled?C.active:C.empty});if(k<4)set(ring.numbers[k],{opacity:filled?1:0,fill:C.bg},filled?String(ids[k]):'');}set(ring.rim,{opacity:current?1:0});set(ring.count,{fill:f.calls[q]?C.text:C.muted},'적재 '+f.calls[q]+'회');}
  set(scene.trail,{opacity:0});set(scene.carrier,{opacity:0});
  if(f.step==='concat'){const route=scene.gathers[f.rx][f.item],point=afterPoint(route,f.progress);set(scene.carrierBox,{x:-8,width:16});set(scene.carrierText,{},String(selected[f.item].id));set(scene.carrier,{opacity:1,transform:`translate(${point[0]} ${point[1]})`});}
  const chatting=['born','stored'].includes(f.step)&&AFTER_PACKETS[f.item]?.type==='채팅';set(scene.event,{opacity:chatting?1:0,transform:chatting?`translate(${heroX} ${heroY-31})`:''});set(w.heroLabel,{opacity:chatting?0:1});
  const stage=['deliver','hold','done','cleanup'].includes(f.step)?3:scoped?2:1;
  for(let i=1;i<=3;i++)set(scene.kind+'-stage-'+i,{fill:i===stage?C.active:C.muted});
}
