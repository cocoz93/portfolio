// Existing packet bytes are retained per source sector and concatenated per receiving sector.
const AFTER_PACKETS=[{id:1,cell:4,slot:0,type:'이동'},{id:2,cell:3,slot:0,type:'채팅'},{id:3,cell:5,slot:0,type:'채팅'},{id:4,cell:4,slot:1,type:'채팅'}];
const AFTER_SCOPE=[0,1,2].map(rx=>Array.from({length:9},(_,i)=>i).filter(i=>Math.abs(i%3-rx)<=1&&Math.floor(i/3)<=1));
const AFTER_SELECTED=AFTER_SCOPE.map(cells=>AFTER_PACKETS.filter(p=>cells.includes(p.cell)).slice().sort((a,b)=>a.cell-b.cell||a.slot-b.slot));
function createAfterProgram(){
  const segments=[];let end=0;function add(phase,ms,rx=-1,item=-1){segments.push({phase,rx,item,start:end,end:end+ms});end+=ms;}
  add('idle',300);add('move',1000);add('settle',200);
  for(let i=0;i<4;i++){add('born',450,-1,i);add('stored',400,-1,i);}
  add('outbox-ready',650);add('targets',650);
  for(let rx=0;rx<3;rx++){add('select',650,rx);for(let i=0;i<AFTER_SELECTED[rx].length;i++){add('concat',600,rx,i);add('joined',280,rx,i);}add('ready',600,rx);add('deliver',850,rx);add('hold',1050,rx);if(rx<2)add('reset',350,rx);}
  add('done',700,2);return {segments,end};
}
function afterFrame(time,program){
  const clamp=p=>Math.max(0,Math.min(1,p)),ease=p=>p*p*(3-2*p),f={phase:'완료 · 발생 섹터에 보관 → 수신 섹터별 Digest → 주민별 1회 적재',step:'done',progress:1,move:0,source:Array(4).fill(0),joined:Array(4).fill(0),queues:[[],[],[]],calls:[0,0,0],rx:-1,item:-1,targets:0,moving:false,facing:'south',done:time>=program.end};
  for(const s of program.segments){
    if(time<s.start)break;const progress=clamp((time-s.start)/(s.end-s.start)),complete=time>=s.end;
    if(s.phase==='move')f.move=ease(progress);
    if(s.phase==='born')f.source[s.item]=ease(progress);
    if(s.phase==='targets')f.targets=ease(progress);
    if(s.phase==='select'){f.rx=s.rx;f.joined=Array(4).fill(0);}
    if(s.phase==='joined')f.joined[s.item]=ease(progress);
    if(s.phase==='deliver'&&complete){f.calls[s.rx]=1;f.queues[s.rx]=AFTER_SELECTED[s.rx].map(p=>p.id);}
    if(s.phase==='reset')f.joined=Array.from({length:4},(_,i)=>i<AFTER_SELECTED[s.rx].length?1-ease(progress):0);
    if(!complete){f.step=s.phase;f.progress=progress;f.rx=s.rx>=0?s.rx:f.rx;f.item=s.item;f.moving=s.phase==='move';f.facing=f.moving?'east':'south';
      const packet=s.item>=0?(['concat','joined'].includes(s.phase)?AFTER_SELECTED[s.rx][s.item]:AFTER_PACKETS[s.item]):null;
      const label='R'+(s.rx+1),actions={idle:'이동 준비',move:'A가 섹터 안에서 이동',settle:'이동 완료',born:'Msg '+packet?.id+' 발생 · 해당 섹터 보관',stored:'Msg '+packet?.id+' 보관 완료','outbox-ready':'발생 섹터별 Msg 보관 완료',targets:'수신 섹터 3곳 선택',select:label+'의 유효범위 선택',concat:'Msg '+packet?.id+' → Digest '+label,joined:'Msg '+packet?.id+' 연접 완료',ready:'Digest '+label+' 구성 완료',deliver:'Digest '+label+' → S'+(s.rx+1)+' SendQ · 1회 적재',hold:'S'+(s.rx+1)+' 적재 완료',reset:'다음 수신 섹터용 임시버퍼 준비',done:'세 수신자 적재 완료'};
      f.phase='변경 후 · '+actions[s.phase];break;
    }
  }
  if(f.done){f.step='done';f.item=-1;}return f;
}
function afterPoint(points,progress){const distances=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1])),total=distances.reduce((a,b)=>a+b,0);let left=total*Math.max(0,Math.min(1,progress));for(let i=0;i<distances.length;i++){if(left<=distances[i]||i===distances.length-1){const p=distances[i]?left/distances[i]:0;return [points[i][0]+(points[i+1][0]-points[i][0])*p,points[i][1]+(points[i+1][1]-points[i][1])*p];}left-=distances[i];}return points[0];}
function afterTrace(points,progress){const length=points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-points[i][0],p[1]-points[i][1]),0);let left=length*Math.max(0,Math.min(1,progress)),out=[points[0]];for(let i=1;i<points.length;i++){const d=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);if(left>=d){out.push(points[i]);left-=d;}else{const t=d?left/d:0;out.push([points[i-1][0]+(points[i][0]-points[i-1][0])*t,points[i-1][1]+(points[i][1]-points[i-1][1])*t]);break;}}return out.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' ');}
function createAfterScene(width){
  width=Math.max(320,Math.round(width));const compact=width<700,height=compact?940:448,kind='digest-after-sector';
  const C={bg:'var(--pcb-bg)',surface:'var(--pcb-surface)',edge:'var(--pcb-edge)',track:'var(--pcb-track)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',active:'var(--pcb-active)',focus:'var(--pcb-data-focus)',soft:'var(--pcb-soft)',empty:'var(--pcb-empty)',pin:'var(--pcb-pin)',target:'var(--pcb-target)'};
  const out=[],labels=[],bounds=[],paths=[],sid=k=>kind+'-'+k,esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  function tag(name,attrs,body=''){out.push(`<${name} ${Object.entries(attrs).map(([k,v])=>`${k}="${esc(v)}"`).join(' ')}>${body}</${name}>`);}
  function box(x,y,w,h,fill=C.surface,stroke=null,attrs={}){tag('rect',{x,y,width:w,height:h,fill,...(stroke?{stroke,'stroke-width':1.5}:{}),...attrs});}
  function txt(text,x,y,size=14,color=C.text,anchor='middle',attrs={}){labels.push({text,x,y,size,anchor,local:attrs['data-local']==='true'});tag('text',{x,y,'font-size':size,'dominant-baseline':'middle','text-anchor':anchor,fill:color,...attrs},esc(text));}
  function wire(points,color=C.track,attrs={}){for(let i=1;i<points.length;i++)if(points[i][0]!==points[i-1][0]&&points[i][1]!==points[i-1][1])throw Error('Non-orthogonal circuit');paths.push(points);tag('path',{d:points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' '),fill:'none',stroke:color,'stroke-width':1.5,...attrs});}
  function contact(x,y){tag('circle',{cx:x,cy:y,r:2.5,fill:C.pin});tag('circle',{cx:x,cy:y,r:1.05,fill:C.bg});}
  /*CHARACTERS*/
  box(0,0,width,height,C.bg);mageDefinition();swordsmanDefinition();txt('변경 후',24,28,13,C.active,'start');
  const world={x:compact?(width-252)/2:24,y:92,size:252,cell:84,hero:sid('hero'),heroLabel:sid('hero-label'),arrow:sid('move-arrow'),targets:[],cells:[],scope:sid('scope'),caption:sid('scope-caption')};
  txt('① 섹터별 Msg 보관',world.x+126,64,12,C.muted,'middle',{id:sid('stage-1')});bounds.push({kind:'sector-map',x:world.x,y:world.y,w:252,h:252});box(world.x,world.y,252,252,C.bg,C.edge,{'data-role':'nine-sector-map'});
  for(let i=0;i<9;i++){const x=world.x+(i%3)*84,y=world.y+Math.floor(i/3)*84,id=sid('cell-'+i);box(x+1,y+1,82,82,C.bg,null,{'data-role':'sector-cell','data-sector':i});box(x+1,y+1,82,82,C.active,null,{id,opacity:0});world.cells.push({x,y,id});}
  for(let i=1;i<3;i++){wire([[world.x+i*84,world.y],[world.x+i*84,world.y+252]],C.edge);wire([[world.x,world.y+i*84],[world.x+252,world.y+i*84]],C.edge);}
  for(let j=0;j<3;j++){const x=world.x+j*84,y=world.y,fill=sid('target-'+j+'-fill'),rim=sid('target-'+j+'-rim'),label=sid('target-'+j+'-label');box(x+2,y+2,80,80,C.target,null,{id:fill,opacity:0});box(x+2,y+2,80,80,'none',C.target,{id:rim,opacity:0});txt('R'+(j+1),x+42,y+14,11,C.muted,'middle',{id:label});swordsman(x+42,y+42,30,'S'+(j+1));txt('S'+(j+1),x+42,y+70,11,C.muted);world.targets.push({x,y,fill,rim,label});}
  box(world.x,world.y,168,168,'none',C.active,{id:world.scope,opacity:0});
  out.push(`<g id="${world.arrow}" opacity="0">`);wire([[world.x+65,world.y+99],[world.x+101,world.y+99]],C.active);tag('polygon',{points:`${world.x+101},${world.y+99} ${world.x+96},${world.y+96} ${world.x+96},${world.y+102}`,fill:C.active});out.push('</g>');
  tag('use',{id:world.hero,href:'#bundle-mage-'+kind+'-south',transform:`translate(${world.x+42} ${world.y+126}) scale(1.125)`,'data-character':'mage','data-facing':'south'});txt('A',world.x+71,world.y+96,12,C.active,'middle',{id:world.heroLabel});
  const source=[];
  // Msg groups follow the player in SVG paint order, so they remain readable in front of the full-size sprite.
  AFTER_PACKETS.forEach((p,index)=>{const cell=world.cells[p.cell],x=cell.x+14,y=cell.y+44+p.slot*20,group=sid('source-'+p.id),data=sid('source-'+p.id+'-data'),label=sid('source-'+p.id+'-label'),rim=sid('source-'+p.id+'-rim');out.push(`<g id="${group}" opacity="0">`);box(x,y,56,16,C.surface,C.edge);box(x+1,y+1,12,14,C.empty);txt('H',x+7,y+8,11,C.muted);box(x+14,y+1,0,14,C.active,null,{id:data});txt('Msg '+p.id,x+35,y+8,11,C.muted,'middle',{id:label,class:'sector-mono'});box(x,y,56,16,'none',C.active,{id:rim,opacity:0});out.push('</g>');source.push({packet:p,x,y,w:56,h:16,group,data,label,rim});bounds.push({kind:'source-Msg',x,y,w:56,h:16});});
  txt('발생 섹터에 Msg 보관',world.x+126,368,12,C.muted,'middle',{id:world.caption});
  // A compact event marker represents chats in other source sectors without adding another movement panel.
  const event=sid('event'),eventLabel=sid('event-label');out.push(`<g id="${event}" opacity="0">`);box(-24,-10,48,20,C.surface,C.edge);txt('채팅',0,0,11,C.text,'middle',{'data-local':'true',id:eventLabel});out.push('</g>');
  const digest={x:compact?(width-176)/2:Math.round(width*.5)-36,y:compact?432:140,w:176,h:208,title:sid('digest-title'),rim:sid('digest-rim'),count:sid('digest-count'),rows:[]};
  txt('② 수신 섹터별 Digest',digest.x+88,compact?404:64,12,C.muted,'middle',{id:sid('stage-2')});box(digest.x,digest.y,176,208,C.surface,C.edge,{id:digest.rim});box(digest.x+1,digest.y+1,174,27,C.muted,null,{opacity:.14});txt('Digest',digest.x+12,digest.y+15,16,C.text,'start',{id:digest.title,class:'sector-mono'});wire([[digest.x+1,digest.y+29],[digest.x+175,digest.y+29]],C.edge);bounds.push({kind:'Digest',x:digest.x,y:digest.y,w:176,h:208});
  for(let i=0;i<4;i++){const x=digest.x+10,y=digest.y+38+i*34,group=sid('digest-row-'+i),data=sid('digest-row-'+i+'-data'),label=sid('digest-row-'+i+'-label');out.push(`<g id="${group}" opacity="0">`);box(x,y,156,28,C.empty,C.edge);box(x+1,y+1,23,26,C.empty);txt('H',x+12,y+14,11,C.muted);box(x+25,y+1,0,26,C.active,null,{id:data});txt('Msg 1 · 이동',x+90,y+14,12,C.muted,'middle',{id:label});out.push('</g>');digest.rows.push({x,y,cy:y+14,group,data,label});}
  txt('구성 대기',digest.x+88,digest.y+194,12,C.muted,'middle',{id:digest.count});if(!compact)txt('원본 헤더 · 데이터 그대로',digest.x+88,digest.y+228,11,C.muted);
  // Gathering uses a moving packet number and matching Msg emphasis, without a wire or trail.
  const gathers=AFTER_SELECTED.map(packets=>packets.map((p,i)=>{const s=source.find(s=>s.packet.id===p.id);return [[s.x+35,s.y+8],[digest.rows[i].x+33,digest.rows[i].cy]];}));
  const queues=[],routes=[],qx=compact?0:width-58,qr=compact?28:34;
  if(compact)txt('③ 주민별 1회 적재',width/2+18,704,12,C.muted,'start',{id:sid('stage-3')});
  for(let j=0;j<3;j++){const cx=compact?width/2+(j-1)*90:qx,cy=compact?820:108+j*112,slots=[],numbers=[],rim=sid('queue-'+j+'-rim'),count=sid('queue-'+j+'-count');tag('circle',{cx,cy,r:qr,fill:C.empty,stroke:C.edge,'stroke-width':1.5});
    for(let k=0;k<8;k++){const a=-Math.PI/2+k*Math.PI/4+.025,b=a+Math.PI/4-.05,ri=qr*.55,polar=(r,t)=>[cx+r*Math.cos(t),cy+r*Math.sin(t)],p=polar(qr,a),q=polar(qr,b),s=polar(ri,b),t=polar(ri,a),id=sid('queue-'+j+'-slot-'+k);tag('path',{id,d:`M${p.join(' ')} A${qr} ${qr} 0 0 1 ${q.join(' ')} L${s.join(' ')} A${ri} ${ri} 0 0 0 ${t.join(' ')} Z`,fill:C.empty,stroke:C.edge,'stroke-width':1.5});slots.push(id);if(k<4){const point=polar(qr*.78,(a+b)/2),number=sid('queue-'+j+'-number-'+k);txt('1',...point,11,C.muted,'middle',{id:number,opacity:0});numbers.push(number);}}
    tag('circle',{id:rim,cx,cy,r:qr+4,fill:'none',stroke:C.active,'stroke-width':1.5,opacity:0});txt('S'+(j+1),cx,cy,14,C.text,'middle',{class:'sector-mono'});txt('R'+(j+1)+' · SendQ',cx,compact?cy+43:cy-48,11,C.muted);txt('적재 0회',cx,compact?cy+63:cy+48,12,C.muted,'middle',{id:count});bounds.push({kind:'ring',x:cx-qr-4,y:cy-qr-4,w:(qr+4)*2,h:(qr+4)*2});queues.push({cx,cy,qr,slots,numbers,rim,count});
    const bus=compact?748:Math.round((digest.x+176+cx-qr-4)/2);routes.push(compact?[[digest.x+88,digest.y+212],[digest.x+88,bus],[cx,bus],[cx,cy-qr-4]]:[[digest.x+180,digest.y+105],[bus,digest.y+105],[bus,cy],[cx-qr-4,cy]]);
  }
  if(compact){wire([[digest.x+88,digest.y+212],[digest.x+88,748]],C.track);wire([[queues[0].cx,748],[queues[2].cx,748]],C.track);for(const q of queues)wire([[q.cx,748],[q.cx,q.cy-q.qr-4]],C.track);}
  else{const bus=routes[0][1][0];wire([[digest.x+180,digest.y+105],[bus,digest.y+105]],C.track);wire([[bus,queues[0].cy],[bus,queues[2].cy]],C.track);for(const q of queues)wire([[bus,q.cy],[q.cx-q.qr-4,q.cy]],C.track);}
  for(const route of routes){contact(...route.at(-1));const[x,y]=route.at(-1);tag('polygon',{points:compact?`${x},${y+1} ${x-3},${y-5} ${x+3},${y-5}`:`${x+1},${y} ${x-5},${y-3} ${x-5},${y+3}`,fill:C.track});}
  const trail=sid('trail'),carrier=sid('carrier'),carrierBox=sid('carrier-box'),carrierText=sid('carrier-text');tag('path',{id:trail,d:'M0 0',fill:'none',stroke:C.active,'stroke-width':1.5,opacity:0});out.push(`<g id="${carrier}" opacity="0">`);box(-8,-8,16,16,C.active,null,{id:carrierBox});txt('1',0,0,11,C.bg,'middle',{'data-local':'true',class:'sector-mono',id:carrierText});out.push('</g>');
  wire([[24,height-28],[width-24,height-28]],C.edge);txt(compact?'발생 섹터에 보관 · 수신 섹터별 구성':'섹터별 보관 → 수신 섹터별 Digest 구성 → 주민별 1회 적재',width/2,height-11,11,C.muted);
  return {width,height,compact,markup:out.join('\n'),world,source,digest,queues,gathers,routes,trail,carrier,carrierBox,carrierText,event,eventLabel,labels,bounds,paths};
}
function applyAfterFrame(scene,f,set){
  const C={active:'var(--pcb-active)',target:'var(--pcb-target)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',bg:'var(--pcb-bg)',empty:'var(--pcb-empty)',edge:'var(--pcb-edge)',track:'var(--pcb-track)'},w=scene.world,d=scene.digest,heroX=w.x+42+84*f.move,heroY=w.y+126;
  set(w.hero,{transform:`translate(${heroX} ${heroY}) scale(1.125)`,href:'#bundle-mage-digest-after-sector-'+f.facing,'data-facing':f.facing});set(w.heroLabel,{x:heroX+29,y:heroY-30});set(w.arrow,{opacity:f.moving?1:0});
  const scoped=f.rx>=0,selected=scoped?AFTER_SELECTED[f.rx]:[],selectedIds=selected.map(p=>p.id),scope=scoped?AFTER_SCOPE[f.rx]:[];
  for(let i=0;i<9;i++){const sourceCurrent=['born','stored'].includes(f.step)&&AFTER_PACKETS[f.item]?.cell===i;set(w.cells[i].id,{opacity:sourceCurrent?.17:scope.includes(i)?.065:0});}
  for(let j=0;j<3;j++){const target=w.targets[j],current=scoped&&j===f.rx;set(target.fill,{opacity:f.targets*(current?.23:.075),fill:current?C.active:C.target});set(target.rim,{opacity:f.targets,stroke:current?C.active:C.target});set(target.label,{fill:current?C.text:f.targets?C.target:C.muted});}
  const left=f.rx===2?1:0,cols=f.rx===1?3:2;set(w.scope,{opacity:scoped?1:0,x:w.x+left*84,width:cols*84});
  set(w.caption,{fill:scoped?C.active:C.muted},scoped?'R'+(f.rx+1)+' · 유효범위의 Msg '+selected.length+'개':'발생 섹터에 Msg 보관');
  for(let i=0;i<4;i++){const s=scene.source[i],fill=f.source[i],included=!scoped||selectedIds.includes(s.packet.id),current=['concat','joined'].includes(f.step)&&selected[f.item]?.id===s.packet.id;set(s.group,{opacity:fill>0?(included?1:.45):0});set(s.data,{width:41*fill,fill:included?C.active:C.track});set(s.label,{fill:fill>.85?C.bg:C.text});set(s.rim,{opacity:scoped&&included?1:0,stroke:current?C.text:C.active});}
  for(let i=0;i<4;i++){const row=d.rows[i],fill=f.joined[i],p=selected[i];set(row.group,{opacity:p&&fill>0?1:0});set(row.data,{width:130*fill});set(row.label,{fill:fill>.9?C.bg:C.text},p?'Msg '+p.id+' · '+p.type:'');}
  const built=scoped&&selected.length>0&&f.joined.slice(0,selected.length).every(v=>v===1),count=f.joined.filter(v=>v===1).length;set(d.title,{},scoped?'Digest R'+(f.rx+1):'Digest');set(d.rim,{stroke:built?C.active:C.edge});set(d.count,{fill:built?C.text:C.muted},scoped?(built?selected.length+' Msg · 구성 1회':'연접 '+count+' / '+selected.length):'구성 대기');
  for(let j=0;j<3;j++){const q=scene.queues[j],ids=f.queues[j],current=f.rx===j&&['deliver','hold'].includes(f.step);for(let k=0;k<8;k++){const filled=k<ids.length;set(q.slots[k],{fill:filled?C.active:C.empty});if(k<4)set(q.numbers[k],{opacity:filled?1:0,fill:C.bg},filled?String(ids[k]):'');}set(q.rim,{opacity:current?1:0});set(q.count,{fill:f.calls[j]?C.text:C.muted},'적재 '+f.calls[j]+'회');}
  let route=null,progress=f.progress,label='',size=16;if(f.step==='concat'){route=scene.gathers[f.rx][f.item];label=String(selected[f.item].id);}else if(f.step==='deliver'||f.step==='hold'){route=scene.routes[f.rx];label='Digest';size=52;if(f.step==='hold')progress=1;}
  if(route){set(scene.trail,{opacity:f.step==='concat'?0:1,d:f.step==='concat'?'M0 0':afterTrace(route,progress)});set(scene.carrierBox,{x:-size/2,width:size});set(scene.carrierText,{},label);const pt=afterPoint(route,progress);set(scene.carrier,{opacity:f.step==='hold'?0:1,transform:`translate(${pt[0]} ${pt[1]})`});}else{set(scene.trail,{opacity:0});set(scene.carrier,{opacity:0});}
  const chatting=['born','stored'].includes(f.step)&&AFTER_PACKETS[f.item]?.type==='채팅'&&AFTER_PACKETS[f.item]?.cell!==4,eventCell=chatting?w.cells[AFTER_PACKETS[f.item].cell]:null;set(scene.event,{opacity:chatting?1:0,transform:eventCell?`translate(${eventCell.x+42} ${eventCell.y+20})`:''});
  for(let stage=1;stage<=2;stage++)set('digest-after-sector-stage-'+stage,{fill:(stage===1&&!scoped||stage===2&&scoped)?C.active:C.muted});
}
