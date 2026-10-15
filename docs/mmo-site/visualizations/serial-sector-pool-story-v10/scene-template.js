function createSectorReuseScene(width){
  width=Math.max(320,Math.round(width));const compact=width<700,height=compact?1440:800,kind='sector-pool-story-v10';
  const C={bg:'var(--pcb-bg)',surface:'var(--pcb-surface)',edge:'var(--pcb-edge)',track:'var(--pcb-track)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',active:'var(--pcb-active)',focus:'var(--pcb-data-focus)',soft:'var(--pcb-soft)',empty:'var(--pcb-empty)',pin:'var(--pcb-pin)'};
  const out=[],labels=[],bounds=[],rows=[],paths=[],worlds=[],sid=key=>kind+'-'+key;
  const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  function tag(name,attrs,body=''){out.push(`<${name} ${Object.entries(attrs).map(([k,v])=>`${k}="${esc(v)}"`).join(' ')}>${body}</${name}>`);}
  function box(x,y,w,h,fill=C.surface,stroke=null,attrs={}){tag('rect',{x,y,width:w,height:h,fill,...(stroke?{stroke,'stroke-width':1.5}:{}),...attrs});}
  function txt(text,x,y,size=12,color=C.text,anchor='middle',attrs={}){labels.push({text,x,y,size,anchor});tag('text',{x,y,'font-size':size,'dominant-baseline':'middle','text-anchor':anchor,fill:color,...attrs},esc(text));}
  function wire(points,color=C.track,arrow=false,opacity=1,attrs={}){for(let i=1;i<points.length;i++)if(points[i][0]!==points[i-1][0]&&points[i][1]!==points[i-1][1])throw Error('Non-orthogonal trace');paths.push(points);tag('path',{d:points.map((p,i)=>`${i?'L':'M'}${p[0]} ${p[1]}`).join(' '),fill:'none',stroke:color,'stroke-width':1.5,opacity,...attrs});if(arrow){const p=points.at(-1),a=points.at(-2),s=3;tag('polyline',{points:a[0]!==p[0]?`${p[0]-Math.sign(p[0]-a[0])*4},${p[1]-s} ${p.join(',')} ${p[0]-Math.sign(p[0]-a[0])*4},${p[1]+s}`:`${p[0]-s},${p[1]-Math.sign(p[1]-a[1])*4} ${p.join(',')} ${p[0]+s},${p[1]-Math.sign(p[1]-a[1])*4}`,fill:'none',stroke:color,'stroke-width':1.5,opacity});}}
  function footprint(x,y,w,h){for(const [a,b,sx,sy] of [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]])wire([[a,b+sy*6],[a,b],[a+sx*6,b]],C.edge);}
  function component(cx,cy,w,h,role){const x=cx-w/2,y=cy-h/2;bounds.push({x,y,w,h,role});box(x,y,w,h,C.surface,C.edge);footprint(x-4,y-4,w+8,h+8);return {cx,cy,x,y,w,h,left:x,right:x+w,top:y,bottom:y+h};}
/* MAGE_RENDERER */
  box(0,0,width,height,C.bg);mageDefinition();
/* WORLD_RENDERER */
  function pool(cx,cy,key){const b=component(cx,cy,64,64,'msg-pool'),count=sid(key+'-alloc-count');txt('Msg 풀',cx,cy-15,12,C.muted);txt('Alloc 0',cx,cy+12,13,C.active,'middle',{id:count});return {...b,count};}
  function msg(cx,cy,title,key){
    const group=sid(key+'-group'),content=sid(key+'-content'),mask=sid(key+'-mask'),flash=sid(key+'-flash'),returned=sid(key+'-returned');out.push(`<g id="${group}">`);
    const b=component(cx,cy,80,80,'serial-buffer');box(b.x+1,b.y+1,78,19,C.muted,null,{opacity:.08});txt(title,b.x+8,b.y+10,12,C.text,'start');wire([[b.x+1,b.y+20],[b.right-1,b.y+20]],C.edge);
    out.push(`<g id="${content}">`);box(b.x+1,b.y+21,78,15,C.muted,null,{opacity:.18});txt('Header',b.x+8,b.y+28,11,C.muted,'start');wire([[b.x+1,b.y+36],[b.right-1,b.y+36]],C.edge);
    out.push(`<defs><clipPath id="${mask}-clip"><rect id="${mask}" x="${b.x+8}" y="${b.y+44}" width="64" height="28"></rect></clipPath></defs><g clip-path="url(#${mask}-clip)">`);box(b.x+8,b.y+44,64,28,C.focus);box(b.x+8,b.y+44,64,28,C.active,null,{id:flash,opacity:0});txt('A 정보',cx,b.y+58,12);out.push('</g></g>');txt('반환',cx,cy+2,11,C.muted,'middle',{id:returned,opacity:0});out.push('</g>');return {...b,group,content,mask,flash,returned,fullWidth:64};
  }
/* RING_RENDERER */
  function notice(points,key){
    let length=0;for(let i=1;i<points.length;i++)length+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);const trace=sid(key+'-notice-trace'),head=sid(key+'-notice-head');
    tag('path',{d:points.map((p,i)=>`${i?'L':'M'}${p.join(' ')}`).join(' '),fill:'none',stroke:C.active,'stroke-width':1.5,id:trace,'data-role':'notice-arrow',opacity:0,'stroke-dasharray':length,'stroke-dashoffset':length});tag('polyline',{id:head,points:'0,0 0,0 0,0',fill:'none',stroke:C.active,'stroke-width':1.5,opacity:0});return {points,length,trace,head};
  }
  function flight(points,key,type='copy'){
    let length=0;for(let i=1;i<points.length;i++)length+=Math.abs(points[i][0]-points[i-1][0])+Math.abs(points[i][1]-points[i-1][1]);const trace=sid(key+'-trail'),carrier=sid(key+'-parcel');
    wire(points,C.active,false,0,{id:trace,'data-role':'transient-transfer'});
    if(type==='copy')box(-6,-4.5,12,9,C.active,C.text,{id:carrier,opacity:0});
    else{out.push(`<g id="${carrier}" opacity="0">`);box(-10,-14,20,28,C.surface,C.pin);wire([[-8,-6],[8,-6]],C.edge);box(-7,-2,14,12,type==='return'?C.focus:C.empty);out.push('</g>');}
    return {points,length,trace,carrier,type};
  }
  const identity='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0';
  for(let row=0;row<2;row++){
    const after=row===1,key=after?'after':'before',group=sid(key),matrix=sid(key+'-matrix'),offset=compact?row*720:row*400,a={group,matrix,messages:[],queues:[],copies:[],allocations:[],returns:[],ref:sid(key+'-ref')};rows.push(a);
    out.push(`<defs><filter id="${group}-gray" color-interpolation-filters="sRGB"><feColorMatrix id="${matrix}" type="matrix" values="${identity}"></feColorMatrix></filter></defs><g id="${group}" filter="url(#${group}-gray)">`);
    txt(after?'변경 후':'변경 전',24,offset+30,14,after?C.active:C.muted,'start');
    const w=world(compact?(width-216)/2:24,offset+(compact?74:122),key);worlds.push(w);
    const mx=compact?width/2:Math.max(388,width-328),cy=compact?offset+466:offset+230,pcx=compact?width/2:(w.x+w.size+mx-40)/2,pcy=compact?offset+354:cy;a.pool=pool(pcx,pcy,key);
    if(!compact){
      const qx=width-64,ys=[130,230,330].map(y=>y+offset);txt('섹터 이동',w.x+108,offset+76,13,C.muted);txt('Msg',mx,offset+76,13,C.muted);txt('SendQ',qx,offset+76,13,C.muted);
      for(let i=0;i<(after?1:3);i++)a.messages.push(msg(mx,after?cy:ys[i],after?'Msg':'Msg '+(i+1),key+'-msg-'+i));
      for(let i=0;i<3;i++){const m=a.messages[after?0:i],q=ring(qx,ys[i],i,key+'-q-'+i);a.queues.push(q);const rx=mx+114;a.copies.push(flight([[m.right-8,m.cy+18],[rx,m.cy+18],[rx,q.cy],[q.left-6,q.cy]],key+'-copy-'+i));txt('Copy '+(i+1),qx-90,q.cy-16,11,C.muted);txt('SubRef',qx,q.cy+38,11,C.muted);}
      txt(after?'할당·직렬화 1회':'할당·직렬화 3회',mx,offset+384,12,after?C.active:C.muted);
      if(after){txt('AddRef(3)',mx,cy-61,12,C.active);txt('Ref 4',mx,cy+61,16,C.active,'middle',{id:a.ref});}
    }else{
      const xs=[width/2-104,width/2,width/2+104],qcy=offset+608;txt(after?'할당·직렬화 1회':'할당·직렬화 3회',104,offset+30,12,after?C.active:C.muted,'start');
      for(let i=0;i<(after?1:3);i++)a.messages.push(msg(after?mx:xs[i],cy,after?'Msg':'Msg '+(i+1),key+'-msg-'+i));
      for(let i=0;i<3;i++){const m=a.messages[after?0:i],q=ring(xs[i],qcy,i,key+'-q-'+i);a.queues.push(q);a.copies.push(flight([[m.cx,m.bottom-10],[m.cx,offset+538],[q.cx,offset+538],[q.cx,q.top-6]],key+'-copy-'+i));txt('Copy '+(i+1),q.cx+(i===2?-12:12),offset+558,11,C.muted,i===2?'end':'start');txt('SendQ',q.cx,qcy+38,11,C.muted);txt('SubRef',q.cx,qcy+56,11,C.muted);}
      if(after){txt('AddRef(3)',mx+66,cy-38,12,C.active,'start');txt('Ref 4',mx+66,cy+32,16,C.active,'start',{id:a.ref});}
    }
    for(let i=0;i<a.messages.length;i++){
      const m=a.messages[i],rx=(a.pool.right+m.left)/2,points=compact?[[a.pool.cx,a.pool.bottom+12],[a.pool.cx,offset+408],[m.cx,offset+408],[m.cx,m.top-12]]:[[a.pool.right+8,a.pool.cy],[rx,a.pool.cy],[rx,m.cy],[m.left-8,m.cy]];
      a.allocations.push(flight(points,key+'-allocate-'+i,'allocation'));a.returns.push(flight([...points].reverse(),key+'-return-'+i,'return'));
    }
    out.push('</g>');if(!after)wire([[20,compact?710:400],[width-20,compact?710:400]],C.edge);
  }
  return {markup:out.join('\n'),width,height,compact,worlds,rows,labels,bounds,paths,kind};
}

function createReuseProgram(){
  const segments=[];let time=0;function add(row,phase,actor,duration){duration/=row===0?1.25:1;const s={row,phase,actor,start:time,end:time+duration,duration};segments.push(s);time=s.end;}
  for(let row=0;row<2;row++){
    add(row,'prepare',0,250);add(row,'move',0,850);add(row,'notify',0,1000);add(row,'notify-hold',0,450);add(row,'notify-out',0,250);
    if(row===0){for(let i=0;i<3;i++){add(row,'allocate',i,500);add(row,'build',i,500);add(row,'copy',i,650);add(row,'hold',i,650);add(row,'release',i,360);add(row,'rest',i,160);}add(row,'done',0,400);}
    else{add(row,'allocate',0,500);add(row,'build',0,500);add(row,'addref',0,360);for(let i=0;i<3;i++){add(row,'copy',i,650);add(row,'hold',i,650);}add(row,'release',0,560);add(row,'done',0,900);}
  }add(-1,'done',0,800);return {segments,end:time};
}
function sectorFrame(time,program,preview=false){
  const clamp=v=>Math.max(0,Math.min(1,v)),state={time:Math.max(0,Math.min(program.end,time)),preview,activeRow:-1,phase:'같은 수신자 · Msg 할당·직렬화 3회 → 1회',rows:[0,1].map(row=>({messages:Array.from({length:row===0?3:1},()=>({live:preview,build:preview?1:0,ref:preview?(row===0?1:4):0,pulseAt:-99999})),queues:[0,0,0].map(()=>({filled:preview,pulseAt:-99999})),returned:[false,false,false],copy:null,transfer:null,created:preview?(row===0?3:1):0,copies:preview?3:0,worldMove:preview?1:0,moving:false,selected:preview,noticeProgress:preview?[1,1,1]:[0,0,0],noticeOpacity:preview?1:0}))};if(preview)return state;
  for(const s of program.segments){
    if(state.time<s.start)break;const p=clamp((state.time-s.start)/s.duration),done=state.time>=s.end;if(s.row<0){state.activeRow=-1;state.phase='완료 · 할당·직렬화 3회 → 1회 · SendQ의 사본은 유지';continue;}
    const r=state.rows[s.row],m=r.messages[s.row===0?s.actor:0],label=s.row===0?'변경 전':'변경 후';state.activeRow=s.row;
    if(s.phase==='prepare')state.phase=label+' · 이동 준비';
    else if(s.phase==='move'){r.worldMove=p;r.moving=!done;state.phase=label+' · A가 가운데 섹터에서 오른쪽으로 이동';}
    else if(s.phase==='notify'){r.noticeProgress=[0,1,2].map(i=>clamp(p*1.2-i*.08));r.noticeOpacity=1;r.selected=done;state.phase=label+' · S1 · S2 · S3에게 같은 알림';}
    else if(s.phase==='notify-hold')state.phase=label+' · 같은 알림을 받을 세 수신자';
    else if(s.phase==='notify-out'){r.noticeOpacity=1-p;state.phase=label+' · 전송 대상 확인';}
    else if(s.phase==='allocate'){r.noticeOpacity=0;m.ref=1;state.phase=label+' · Msg 풀에서 '+(s.row===0?'Msg '+(s.actor+1):'Msg 하나')+' 할당';if(done){m.live=true;r.created=s.row===0?s.actor+1:1;r.transfer=null;}else r.transfer={kind:'allocation',actor:s.row===0?s.actor:0,p};}
    else if(s.phase==='build'){m.live=true;m.build=p;m.ref=1;state.phase=label+' · 같은 A 정보를 직렬화';if(done)m.pulseAt=s.end;}
    else if(s.phase==='addref'){m.ref=4;state.phase='변경 후 · AddRef(3) · Ref 1 → 4';}
    else if(s.phase==='copy'){if(s.row===0)m.ref=2;state.phase=label+' · '+(s.row===0?'Msg '+(s.actor+1):'같은 Msg')+' → SendQ '+(s.actor+1);if(done){r.queues[s.actor].filled=true;r.queues[s.actor].pulseAt=s.end;r.copies=s.actor+1;m.ref=s.row===0?1:3-s.actor;m.pulseAt=s.end;r.copy=null;}else r.copy={actor:s.actor,p};}
    else if(s.phase==='hold')state.phase=label+' · '+(s.row===0?'Copy 후 SubRef':(s.actor+1)+'회 사용 · Ref '+m.ref+' · 같은 Msg 유지');
    else if(s.phase==='release'){m.ref=0;m.live=false;state.phase=label+' · '+(s.row===0?'Msg '+(s.actor+1)+' 풀 반환':'마지막 SubRef · Ref 0 · 풀 반환');if(done){r.returned[s.row===0?s.actor:0]=true;r.transfer=null;}else r.transfer={kind:'return',actor:s.row===0?s.actor:0,p};}
  }return state;
}
function reusePoint(beam,p){let remaining=beam.length*Math.max(0,Math.min(1,p));for(let i=1;i<beam.points.length;i++){const a=beam.points[i-1],b=beam.points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(remaining<=len){const t=len?remaining/len:0;return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];}remaining-=len;}return beam.points.at(-1);}
function reusePulse(time,at){const age=time-at;return age<0?0:age<40?age/40:age<640?1:age<990?1-(age-640)/350:0;}
function pathSlice(beam,start,end){const points=[reusePoint(beam,start)];let passed=0;for(let i=1;i<beam.points.length;i++){passed+=Math.abs(beam.points[i][0]-beam.points[i-1][0])+Math.abs(beam.points[i][1]-beam.points[i-1][1]);if(passed>start*beam.length&&passed<end*beam.length)points.push(beam.points[i]);}points.push(reusePoint(beam,end));return points.map((p,i)=>`${i?'L':'M'}${p.join(' ')}`).join(' ');}
function applySectorFrame(scene,state,set){
  const identity='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0',gray='.2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 0 0 0 1 0';
  function moveFlight(b,active,p){set(b.trace,{opacity:active?1:0,d:pathSlice(b,Math.max(0,p-24/b.length),p)});set(b.carrier,{opacity:active?1:0,transform:`translate(${reusePoint(b,p).join(' ')})`});}
  for(let i=0;i<2;i++){
    const a=scene.rows[i],r=state.rows[i],w=scene.worlds[i],inactive=state.activeRow!==-1&&state.activeRow!==i;set(a.group,{opacity:inactive?.38:1});set(a.matrix,{values:inactive?gray:identity});
    const dx=(w.end[0]-w.start[0])*(.5-.5*Math.cos(r.worldMove*Math.PI));set(w.hero,{transform:`translate(${dx} 0)`});set(w.face,{href:`#bundle-mage-${scene.kind}-${r.moving?'east':'south'}`,'data-facing':r.moving?'east':'south'});set(w.ghost,{opacity:r.worldMove>0?.18:0});set(w.arrow,{opacity:r.moving?1:0});
    for(let j=0;j<3;j++){
      set(w.halos[j],{opacity:r.selected||r.noticeProgress[j]>=.9?1:.08});const n=w.notices[j],p=r.noticeProgress[j],end=reusePoint(n,p),prev=reusePoint(n,Math.max(0,p-.015)),len=Math.hypot(end[0]-prev[0],end[1]-prev[1])||1,sx=(end[0]-prev[0])/len,sy=(end[1]-prev[1])/len;
      set(n.trace,{opacity:r.noticeOpacity,'stroke-dashoffset':n.length*(1-p)});set(n.head,{opacity:p>0?r.noticeOpacity:0,points:`${end[0]-sx*5-sy*4},${end[1]-sy*5+sx*4} ${end.join(',')} ${end[0]-sx*5+sy*4},${end[1]-sy*5-sx*4}`});
      set(a.queues[j].fill,{opacity:r.queues[j].filled?1:0});set(a.queues[j].flash,{opacity:reusePulse(state.time,r.queues[j].pulseAt)});const copy=r.copy&&r.copy.actor===j;moveFlight(a.copies[j],copy,copy?r.copy.p:0);
    }
    for(let j=0;j<a.messages.length;j++){
      const m=a.messages[j],f=r.messages[j];set(m.group,{opacity:state.preview||f.live?1:r.returned[j]?.45:.16});set(m.content,{opacity:f.live?1:0});set(m.mask,{width:m.fullWidth*f.build});set(m.flash,{opacity:reusePulse(state.time,f.pulseAt)});set(m.returned,{opacity:r.returned[j]?1:0});
      for(const [kind,flights] of [['allocation',a.allocations],['return',a.returns]]){const active=r.transfer&&r.transfer.kind===kind&&r.transfer.actor===j;moveFlight(flights[j],active,active?r.transfer.p:0);}
    }
    set(a.pool.count,{},'Alloc '+r.created);if(i===1){const m=r.messages[0];set(a.ref,{opacity:state.preview||m.live||r.transfer?.kind==='return'||r.returned[0]?1:0},'Ref '+m.ref);}
  }
}
