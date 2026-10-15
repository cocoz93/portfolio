function createReuseScene(width,variant){
  width=Math.max(320,Math.round(width));const compact=width<700,height=compact?1180:892,K='reuse-v5-'+variant;
  const C={bg:'var(--pcb-bg)',surface:'var(--pcb-surface)',edge:'var(--pcb-edge)',track:'var(--pcb-track)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',active:'var(--pcb-active)',focus:'var(--pcb-data-focus)',empty:'var(--pcb-empty)',pin:'var(--pcb-pin)'};
  const out=[],labels=[],bounds=[],paths=[],rows=[];let serial=0;
  const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),id=name=>K+'-'+name;
  function tag(name,attrs,body=''){out.push(`<${name} ${Object.entries(attrs).map(([k,v])=>`${k}="${esc(v)}"`).join(' ')}>${body}</${name}>`);}
  function box(x,y,w,h,fill=C.surface,stroke=null,attrs={}){tag('rect',{x,y,width:w,height:h,fill,...(stroke?{stroke,'stroke-width':1.5}:{}),...attrs});}
  function txt(text,x,y,size=12,color=C.text,anchor='middle',attrs={}){labels.push({text,x,y,size,anchor,id:attrs.id});tag('text',{x,y,'font-size':size,'dominant-baseline':'middle','text-anchor':anchor,fill:color,...attrs},esc(text));}
  function wire(points,arrow=false,color=C.track,attrs={}){
    for(let i=1;i<points.length;i++)if(points[i][0]!==points[i-1][0]&&points[i][1]!==points[i-1][1])throw Error('Non-orthogonal route');paths.push(points);
    tag('path',{d:points.map((p,i)=>`${i?'L':'M'}${p[0]} ${p[1]}`).join(' '),fill:'none',stroke:color,'stroke-width':1.5,'stroke-linejoin':'miter',...attrs});
    if(arrow){const p=points.at(-1);let i=points.length-2;while(i>=0&&p[0]===points[i][0]&&p[1]===points[i][1])i--;if(i<0)return;const a=points[i],s=3;tag('polyline',{points:a[0]!==p[0]?`${p[0]-Math.sign(p[0]-a[0])*4},${p[1]-s} ${p.join(',')} ${p[0]-Math.sign(p[0]-a[0])*4},${p[1]+s}`:`${p[0]-s},${p[1]-Math.sign(p[1]-a[1])*4} ${p.join(',')} ${p[0]+s},${p[1]-Math.sign(p[1]-a[1])*4}`,fill:'none',stroke:color,'stroke-width':1.5});}
  }
  function pin(x,y){tag('circle',{cx:x,cy:y,r:2.5,fill:C.bg,stroke:C.pin,'stroke-width':1.5});}
  function footprint(x,y,w,h){for(const [a,b,sx,sy] of [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]])wire([[a,b+sy*6],[a,b],[a+sx*6,b]],false,C.edge);}
  function chip(cx,cy,w=136,h=100,role='serial-buffer'){const x=cx-w/2,y=cy-h/2;bounds.push({x,y,w,h,role});box(x,y,w,h,C.surface,C.edge);footprint(x-4,y-4,w+8,h+8);return {cx,cy,x,y,w,h,left:x,right:x+w,top:y,bottom:y+h};}
  function msg(cx,cy,title,key){
    const b=chip(cx,cy),content=id(key+'-content'),mask=id(key+'-mask'),flash=id(key+'-flash');
    out.push(`<g id="${content}" data-role="retained-msg" opacity="1">`);
    box(b.x+1,b.y+1,b.w-2,23,C.muted,null,{opacity:.08});box(b.x+1,b.y+25,b.w-2,18,C.muted,null,{opacity:.18});
    wire([[b.x+1,b.y+24],[b.right-1,b.y+24]],false,C.edge);wire([[b.x+1,b.y+44],[b.right-1,b.y+44]],false,C.edge);
    txt(title,b.x+8,b.y+12,12,C.text,'start');txt('Header',b.x+8,b.y+34,11,C.muted,'start');
    out.push(`<defs><clipPath id="${mask}-clip"><rect id="${mask}" x="${b.x+8}" y="${b.y+52}" width="${b.w-16}" height="40"></rect></clipPath></defs>`);
    out.push(`<g clip-path="url(#${mask}-clip)">`);box(b.x+8,b.y+52,b.w-16,40,C.focus);box(b.x+8,b.y+52,b.w-16,40,C.active,null,{id:flash,opacity:0});txt('이동 데이터',b.cx,b.y+72,12);out.push('</g></g>');
    return {...b,content,mask,flash,fullWidth:b.w-16};
  }
  function ring(cx,cy,r,session,key){
    bounds.push({x:cx-r,y:cy-r,w:r*2,h:r*2,role:'session-ring-buffer'});const polar=(rr,a)=>[cx+rr*Math.cos(a*Math.PI/180),cy+rr*Math.sin(a*Math.PI/180)];let fill,flash;
    for(let i=0;i<8;i++){const a=-180+i*45+1.4,b=a+42.2,p=polar(r,a),q=polar(r,b),s=polar(r*.61,b),t=polar(r*.61,a),d=`M${p.join(',')} A${r},${r} 0 0 1 ${q.join(',')} L${s.join(',')} A${r*.61},${r*.61} 0 0 0 ${t.join(',')} Z`;tag('path',{d,fill:C.empty,stroke:C.edge,'stroke-width':1.5});if(i===2){fill=id(key+'-data');flash=id(key+'-flash');tag('path',{d,fill:C.focus,id:fill,opacity:1});tag('path',{d,fill:C.active,id:flash,opacity:0});}}
    txt(`S${session}`,cx,cy,12);txt('SendQ',cx,cy+r+16,11,C.muted);txt('SubRef',cx,cy+r+34,11,C.muted);return {cx,cy,r,left:cx-r,right:cx+r,top:cy-r,bottom:cy+r,fill,flash};
  }
  function mini(cx,cy,key,filled=false){const group=id(key);out.push(`<g id="${group}" opacity="${filled?1:0}" transform="translate(${cx} ${cy})" data-role="returned-whole-buffer">`);box(-13,-17,26,34,C.surface,C.pin);for(const y of [-8,-1])tag('line',{x1:-12,x2:12,y1:y,y2:y,stroke:C.edge,'stroke-width':1.5});box(-9,3,18,10,C.focus);out.push('</g>');return group;}
  function pool(cx,cy,key,w=156){const b=chip(cx,cy,w,72,'buffer-pool');txt('버퍼 풀',cx,b.top+14,12,C.muted);const slots=[];for(let i=0;i<3;i++){const sx=cx+(i-1)*40;box(sx-14,cy-5,28,36,C.empty,C.edge);slots.push(mini(sx,cy+13,key+'-'+i));}return {...b,slots};}
  function beam(points,kind,key){wire(points,true);let length=0;for(let i=1;i<points.length;i++)length+=Math.abs(points[i][0]-points[i-1][0])+Math.abs(points[i][1]-points[i-1][1]);const trace=id(key+'-trace'),carrier=id(key+'-carrier');wire(points,false,C.active,{id:trace,opacity:0});
    if(kind==='copy')box(-9,-5,18,10,C.active,C.text,{id:carrier,opacity:0,'data-role':'byte-copy-in-flight'});else{out.push(`<g id="${carrier}" opacity="0" data-role="whole-buffer-in-flight">`);box(-13,-17,26,34,C.surface,C.pin);for(const y of [-8,-1])tag('line',{x1:-12,x2:12,y1:y,y2:y,stroke:C.edge,'stroke-width':1.5});box(-9,3,18,10,C.active);out.push('</g>');}
    return {points,length,kind,trace,carrier};
  }
  function portsForCopy(m,q,direction='down'){if(direction==='down'){pin(m.cx,m.bottom+6);pin(q.cx,q.top-6);}else{pin(m.right+6,m.cy);pin(q.left-6,q.cy);}}
  function row(r){const group=id('row-'+r),matrix=id('matrix-'+r);out.push(`<defs><filter id="${group}-gray" color-interpolation-filters="sRGB"><feColorMatrix id="${matrix}" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"></feColorMatrix></filter></defs><g id="${group}" filter="url(#${group}-gray)">`);const item={group,matrix,messages:[],queues:[],copies:[],returns:[],pool:null};rows.push(item);return item;}
  function finishRow(){out.push('</g>');}
  function heading(after,y){txt(after?'변경 후':'변경 전',24,y,14,after?C.active:C.muted,'start');}
  box(0,0,width,height,C.bg);
  function standardBefore(){
    const a=row(0);heading(false,28);
    if(!compact){
      const xs=[width*.22,width/2,width*.78];a.pool=pool(width/2,382,'before-pool');pin(a.pool.cx,a.pool.top-6);
      for(let i=0;i<3;i++){const m=msg(xs[i],124,'Msg '+(i+1),'before-msg-'+i),q=ring(xs[i],236,30,i+1,'before-q-'+i);a.messages.push(m);a.queues.push(q);portsForCopy(m,q);a.copies.push(beam([[m.cx,m.bottom+6],[q.cx,q.top-6]],'copy','before-copy-'+i));txt('Copy '+(i+1),m.cx+18,196,11,C.muted,'start');pin(m.left-6,m.cy);a.returns.push(beam([[m.left-6,m.cy],[m.left-20,m.cy],[m.left-20,328],[a.pool.cx,328],[a.pool.cx,a.pool.top-6]],'return','before-return-'+i));}
      txt('매번 생성 · 매번 반환',width-24,386,12,C.muted,'end');
    }else{
      a.pool=pool(width/2,566,'before-pool');pin(a.pool.right+6,a.pool.cy);
      for(let i=0;i<3;i++){const cy=140+i*146,m=msg(96,cy,'Msg '+(i+1),'before-msg-'+i),q=ring(width-62,cy,28,i+1,'before-q-'+i);a.messages.push(m);a.queues.push(q);portsForCopy(m,q,'right');a.copies.push(beam([[m.right+6,cy],[q.left-6,cy]],'copy','before-copy-'+i));txt('Copy '+(i+1),(m.right+q.left)/2,cy-21,11,C.muted);pin(m.cx,m.bottom+6);a.returns.push(beam([[m.cx,m.bottom+6],[m.cx,cy+80],[width-18,cy+80],[width-18,a.pool.cy],[a.pool.right+6,a.pool.cy]],'return','before-return-'+i));}
    }
    finishRow();wire([[20,compact?620:440],[width-20,compact?620:440]],false,C.edge);return a;
  }
  if(variant==='hub'||variant==='sequence'||compact)standardBefore();
  if(variant==='hub'){
    const a=row(1);heading(true,compact?650:468);
    const m=msg(width/2,compact?742:564,'Msg A','after-msg');a.messages.push(m);txt('AddRef(3)',m.cx,m.top-18,12,C.active);
    const xs=compact?[width/2-104,width/2,width/2+104]:[width*.22,width/2,width*.78],cy=compact?922:676,r=compact?26:30,bus=compact?842:638;
    for(let i=0;i<3;i++){const q=ring(xs[i],cy,r,i+1,'after-q-'+i);a.queues.push(q);portsForCopy(m,q);a.copies.push(beam([[m.cx,m.bottom+6],[m.cx,bus],[q.cx,bus],[q.cx,q.top-6]],'copy','after-copy-'+i));txt('Copy '+(i+1),q.cx+(compact?14:18),compact?868:624,11,C.muted,'start');}
    a.pool=pool(width/2,compact?1070:822,'after-pool');pin(m.left-6,m.cy);pin(a.pool.cx,a.pool.top-6);a.returns.push(beam([[m.left-6,m.cy],[compact?20:60,m.cy],[compact?20:60,compact?1016:768],[a.pool.cx,compact?1016:768],[a.pool.cx,a.pool.top-6]],'return','after-return'));
    txt('마지막 반환',compact?width-24:76,compact?1000:796,12,C.active,compact?'end':'start');txt('SubRef → Ref 0',a.pool.cx,a.pool.bottom+23,11,C.muted);finishRow();
  }else if(variant==='sequence'){
    const a=row(1);heading(true,compact?650:468);const m=msg(compact?96:width*.28,compact?850:640,'Msg A','after-msg');a.messages.push(m);txt('AddRef(3)',m.cx,m.top-18,12,C.active);
    const qx=compact?width-62:width*.76,ys=compact?[750,890,1030]:[520,640,760],r=compact?26:30,trunk=compact?width-116:width*.54;
    for(let i=0;i<3;i++){const q=ring(qx,ys[i],r,i+1,'after-q-'+i);a.queues.push(q);portsForCopy(m,q,'right');a.copies.push(beam([[m.right+6,m.cy],[trunk,m.cy],[trunk,q.cy],[q.left-6,q.cy]],'copy','after-copy-'+i));txt('Copy '+(i+1),compact?q.cx:(trunk+q.left)/2,q.cy-(compact?44:18),11,C.muted);}
    a.pool=pool(m.cx,compact?1080:824,'after-pool',compact?136:156);pin(m.cx,m.bottom+6);pin(a.pool.cx,a.pool.top-6);a.returns.push(beam([[m.cx,m.bottom+6],[m.cx,a.pool.top-6]],'return','after-return'));txt('마지막 반환',m.cx+18,compact?970:736,12,C.active,'start');txt('SubRef → Ref 0',a.pool.cx,a.pool.bottom+22,11,C.muted);finishRow();
  }else if(variant==='loop'){
    if(!compact){
      const a=row(0);heading(false,28);a.pool=pool(108,214,'before-pool');pin(a.pool.cx,a.pool.bottom+6);
      for(let i=0;i<3;i++){const cy=100+i*114,m=msg(width/2,cy,'Msg '+(i+1),'before-msg-'+i),q=ring(width-108,cy,30,i+1,'before-q-'+i);a.messages.push(m);a.queues.push(q);portsForCopy(m,q,'right');a.copies.push(beam([[m.right+6,cy],[q.left-6,cy]],'copy','before-copy-'+i));txt('Copy '+(i+1),(m.right+q.left)/2,cy-18,11,C.muted);pin(m.left-6,m.cy);a.returns.push(beam([[m.left-6,cy],[248,cy],[248,420],[a.pool.cx,420],[a.pool.cx,a.pool.bottom+6]],'return','before-return-'+i));}
      txt('매번 반환',132,362,12,C.muted,'start');finishRow();wire([[20,440],[width-20,440]],false,C.edge);
    }
    const a=row(1);heading(true,compact?650:468);
    const m=msg(width/2,compact?858:654,'Msg A','after-msg');a.messages.push(m);txt('AddRef(3)',compact?m.right+16:m.cx,m.top-18,12,C.active,compact?'start':'middle');a.pool=pool(compact?width/2:108,compact?706:654,'after-pool');
    if(!compact){const ys=[540,654,768];for(let i=0;i<3;i++){const q=ring(width-108,ys[i],30,i+1,'after-q-'+i);a.queues.push(q);portsForCopy(m,q,'right');a.copies.push(beam([[m.right+6,m.cy],[width*.67,m.cy],[width*.67,q.cy],[q.left-6,q.cy]],'copy','after-copy-'+i));txt('Copy '+(i+1),(width*.67+q.left)/2,q.cy-18,11,C.muted);}pin(m.left-6,m.cy);pin(a.pool.cx,a.pool.bottom+6);a.returns.push(beam([[m.left-6,m.cy],[248,m.cy],[248,866],[a.pool.cx,866],[a.pool.cx,a.pool.bottom+6]],'return','after-return'));txt('마지막 반환',150,818,12,C.active,'start');}
    else{const xs=[width/2-104,width/2,width/2+104];for(let i=0;i<3;i++){const q=ring(xs[i],1052,26,i+1,'after-q-'+i);a.queues.push(q);portsForCopy(m,q);a.copies.push(beam([[m.cx,m.bottom+6],[m.cx,964],[q.cx,964],[q.cx,q.top-6]],'copy','after-copy-'+i));txt('Copy '+(i+1),q.cx+14,990,11,C.muted,'start');}pin(a.pool.cx,a.pool.bottom+6);pin(m.cx,m.top-6);wire([[a.pool.cx,a.pool.bottom+6],[m.cx,m.top-6]],true);txt('생성 1회',m.cx+20,768,11,C.muted,'start');pin(m.left-6,m.cy);pin(a.pool.left-6,a.pool.cy);a.returns.push(beam([[m.left-6,m.cy],[20,m.cy],[20,a.pool.cy],[a.pool.left-6,a.pool.cy]],'return','after-return'));txt('마지막 SubRef',30,766,11,C.active,'start');}
    finishRow();
  }else throw Error('Unknown reuse design');
  return {markup:out.join('\n'),width,height,variant,compact,rows,labels,bounds,paths};
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
