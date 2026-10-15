function createSectorReuseScene(width){
  width=Math.max(320,Math.round(width));const compact=width<700,height=compact?1280:800,kind='sector-separated-v7';
  const C={bg:'var(--pcb-bg)',surface:'var(--pcb-surface)',edge:'var(--pcb-edge)',track:'var(--pcb-track)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',active:'var(--pcb-active)',focus:'var(--pcb-data-focus)',soft:'var(--pcb-soft)',empty:'var(--pcb-empty)',pin:'var(--pcb-pin)'};
  const out=[],labels=[],bounds=[],rows=[],paths=[],worlds=[],sid=key=>kind+'-'+key;
  const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  function tag(name,attrs,body=''){out.push(`<${name} ${Object.entries(attrs).map(([k,v])=>`${k}="${esc(v)}"`).join(' ')}>${body}</${name}>`);}
  function box(x,y,w,h,fill=C.surface,stroke=null,attrs={}){tag('rect',{x,y,width:w,height:h,fill,...(stroke?{stroke,'stroke-width':1.5}:{}),...attrs});}
  function txt(text,x,y,size=12,color=C.text,anchor='middle',attrs={}){labels.push({text,x,y,size,anchor});tag('text',{x,y,'font-size':size,'dominant-baseline':'middle','text-anchor':anchor,fill:color,...attrs},esc(text));}
  function wire(points,color=C.track,arrow=false,opacity=1,attrs={}){for(let i=1;i<points.length;i++)if(points[i][0]!==points[i-1][0]&&points[i][1]!==points[i-1][1])throw Error('Non-orthogonal trace');paths.push(points);tag('path',{d:points.map((p,i)=>`${i?'L':'M'}${p[0]} ${p[1]}`).join(' '),fill:'none',stroke:color,'stroke-width':1.5,'stroke-linejoin':'miter',opacity,...attrs});if(arrow){const p=points.at(-1);let i=points.length-2;while(i>=0&&p[0]===points[i][0]&&p[1]===points[i][1])i--;if(i<0)return;const a=points[i],s=3;tag('polyline',{points:a[0]!==p[0]?`${p[0]-Math.sign(p[0]-a[0])*4},${p[1]-s} ${p.join(',')} ${p[0]-Math.sign(p[0]-a[0])*4},${p[1]+s}`:`${p[0]-s},${p[1]-Math.sign(p[1]-a[1])*4} ${p.join(',')} ${p[0]+s},${p[1]-Math.sign(p[1]-a[1])*4}`,fill:'none',stroke:color,'stroke-width':1.5,opacity});}}
  function pin(cx,cy){tag('circle',{cx,cy,r:3,fill:C.pin});tag('circle',{cx,cy,r:1.25,fill:C.bg});}
  function footprint(x,y,w,h){for(const [a,b,sx,sy] of [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]])wire([[a,b+sy*6],[a,b],[a+sx*6,b]],C.edge);}
  function component(cx,cy,w,h,role){const x=cx-w/2,y=cy-h/2;bounds.push({x,y,w,h,role});box(x,y,w,h,C.surface,C.edge);footprint(x-4,y-4,w+8,h+8);return {cx,cy,x,y,w,h,left:x,right:x+w,top:y,bottom:y+h};}
/* MAGE_RENDERER */
  box(0,0,width,height,C.bg);mageDefinition();
  function world(x,y,key){
    const w={x,y,size:216,cell:72,hero:sid(key+'-hero'),face:sid(key+'-face'),ghost:sid(key+'-ghost'),arrow:sid(key+'-arrow'),halos:[]};w.start=[x+108,y+108];w.end=[x+180,y+108];
    bounds.push({x,y,w:216,h:216,role:'nine-sector-map'});box(x,y,216,216,C.bg,C.edge);footprint(x-4,y-4,224,224);
    for(let j=0;j<3;j++)for(let i=0;i<3;i++)box(x+i*72+1,y+j*72+1,70,70,C.bg,null,{'data-role':'sector','data-sector':`${i},${j}`});
    for(let i=1;i<3;i++){wire([[x+i*72,y],[x+i*72,y+216]],C.edge);wire([[x,y+i*72],[x+216,y+i*72]],C.edge);}
    for(let i=0;i<3;i++){out.push('<g opacity=".25">');mage(x+36,y+36+i*72,26,'south',key+'-background-'+i);out.push('</g>');}
    for(const [i,[col,row]] of [[1,0],[2,0],[2,2]].entries()){
      const cx=x+col*72+36,cy=y+row*72+36,halo=sid(key+'-recipient-'+i);w.halos.push(halo);box(cx-22,cy-25,44,50,C.soft,C.active,{id:halo,opacity:1});mage(cx,cy,28,'south',key+'-S'+(i+1));txt('S'+(i+1),cx,cy+30,11,C.active);
    }
    out.push(`<g id="${w.ghost}" opacity=".18">`);mage(w.start[0],w.start[1],32,'south',key+'-ghost');out.push('</g>');
    out.push(`<g id="${w.arrow}" opacity="0">`);wire([[w.start[0]+22,w.start[1]],[w.end[0]-26,w.end[1]]],C.active,true);out.push('</g>');
    out.push(`<g id="${w.hero}">`);tag('use',{id:w.face,href:`#bundle-mage-${kind}-south`,transform:`translate(${w.start.join(' ')})`,'data-character':'mage','data-facing':'south','data-actor':key+'-A'});txt('A',w.start[0]+28,w.start[1]+7,13,C.active);out.push('</g>');
    txt('수신자 S1 · S2 · S3 (예시)',x+108,compact?y-22:y+238,11,C.muted);return w;
  }
  function msg(cx,cy,title,key){
    const b=component(cx,cy,80,80,'serial-buffer'),content=sid(key+'-content'),mask=sid(key+'-mask'),flash=sid(key+'-flash'),returned=sid(key+'-returned');
    box(b.x+1,b.y+1,78,19,C.muted,null,{opacity:.08});txt(title,b.x+8,b.y+10,12,C.text,'start');wire([[b.x+1,b.y+20],[b.right-1,b.y+20]],C.edge);
    out.push(`<g id="${content}">`);box(b.x+1,b.y+21,78,15,C.muted,null,{opacity:.18});txt('Header',b.x+8,b.y+28,11,C.muted,'start');wire([[b.x+1,b.y+36],[b.right-1,b.y+36]],C.edge);
    out.push(`<defs><clipPath id="${mask}-clip"><rect id="${mask}" x="${b.x+8}" y="${b.y+44}" width="64" height="28"></rect></clipPath></defs><g clip-path="url(#${mask}-clip)">`);box(b.x+8,b.y+44,64,28,C.focus);box(b.x+8,b.y+44,64,28,C.active,null,{id:flash,opacity:0});txt('A 정보',cx,b.y+58,12);out.push('</g></g>');
    txt('반환',cx,cy+2,11,C.muted,'middle',{id:returned,opacity:0});return {...b,content,mask,flash,returned,fullWidth:64};
  }
  function ring(cx,cy,index,key){
    const r=22;bounds.push({x:cx-r,y:cy-r,w:44,h:44,role:'session-ring-buffer'});const polar=(rr,a)=>[cx+rr*Math.cos(a*Math.PI/180),cy+rr*Math.sin(a*Math.PI/180)];let fill,flash;
    for(let i=0;i<8;i++){const a=-180+i*45+1.4,b=a+42.2,p=polar(r,a),q=polar(r,b),s=polar(r*.6,b),t=polar(r*.6,a),d=`M${p.join(',')} A${r},${r} 0 0 1 ${q.join(',')} L${s.join(',')} A${r*.6},${r*.6} 0 0 0 ${t.join(',')} Z`;tag('path',{d,fill:C.empty,stroke:C.edge,'stroke-width':1.5});if(i===2){fill=sid(key+'-fill');flash=sid(key+'-flash');tag('path',{d,id:fill,fill:C.focus,opacity:1});tag('path',{d,id:flash,fill:C.active,opacity:0});}}
    txt('S'+(index+1),cx,cy,11);return {cx,cy,r,fill,flash,left:cx-r,right:cx+r,top:cy-r,bottom:cy+r};
  }
  function beam(points,key){wire(points,C.track,true);let length=0;for(let i=1;i<points.length;i++)length+=Math.abs(points[i][0]-points[i-1][0])+Math.abs(points[i][1]-points[i-1][1]);const trace=sid(key+'-trace'),carrier=sid(key+'-carrier');wire(points,C.active,false,0,{id:trace});box(-5,-4,10,8,C.active,C.text,{id:carrier,opacity:0});return {points,length,trace,carrier};}
  const identity='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0';
  for(let row=0;row<2;row++){
    const after=row===1,key=after?'after':'before',group=sid(key),matrix=sid(key+'-matrix'),offset=compact?row*640:row*400,a={group,matrix,messages:[],queues:[],copies:[],input:null,ref:sid(key+'-ref')};rows.push(a);
    out.push(`<defs><filter id="${group}-gray" color-interpolation-filters="sRGB"><feColorMatrix id="${matrix}" type="matrix" values="${identity}"></feColorMatrix></filter></defs><g id="${group}" filter="url(#${group}-gray)">`);
    txt(after?'변경 후':'변경 전',24,offset+30,14,after?C.active:C.muted,'start');
    const w=world(compact?(width-216)/2:24,offset+(compact?74:122),key);worlds.push(w);
    if(!compact){
      const mx=width-328,qx=width-64,ys=[130,230,330].map(y=>y+offset),cy=offset+230;
      txt('섹터 이동',w.x+108,offset+76,13,C.muted);txt('Msg',mx,offset+76,13,C.muted);txt('SendQ',qx,offset+76,13,C.muted);
      for(let i=0;i<(after?1:3);i++)a.messages.push(msg(mx,after?cy:ys[i],after?'Msg':'Msg '+(i+1),key+'-msg-'+i));
      pin(w.x+222,cy);const ix=w.x+258,first=a.messages[0];
      a.input=beam([[w.x+222,cy],[ix,cy],[ix,first.cy],[first.left-6,first.cy]],key+'-input');
      if(!after)for(let i=1;i<3;i++){const m=a.messages[i];wire([[ix,cy],[ix,m.cy],[m.left-6,m.cy]],C.track,true);}
      for(let i=0;i<3;i++){
        const m=a.messages[after?0:i],q=ring(qx,ys[i],i,key+'-q-'+i);a.queues.push(q);pin(m.right+6,m.cy);pin(q.left-6,q.cy);
        const bus=mx+114,points=after?[[m.right+6,m.cy],[bus,m.cy],[bus,q.cy],[q.left-6,q.cy]]:[[m.right+6,m.cy],[q.left-6,q.cy]];a.copies.push(beam(points,key+'-copy-'+i));
        txt('Copy '+(i+1),qx-90,q.cy-16,11,C.muted);txt('SubRef',qx,q.cy+38,11,C.muted);
      }
      txt(after?'할당·직렬화 1회':'할당·직렬화 3회',mx,offset+384,12,after?C.active:C.muted);
      if(after){txt('AddRef(3)',mx,cy-61,12,C.active);txt('RefCount로 유지',mx,cy+61,11,C.muted,'middle',{id:a.ref});}
    }else{
      const xs=[width/2-104,width/2,width/2+104],mcy=offset+410,qcy=offset+552;
      txt(after?'할당·직렬화 1회':'할당·직렬화 3회',104,offset+30,12,after?C.active:C.muted,'start');
      for(let i=0;i<(after?1:3);i++)a.messages.push(msg(after?width/2:xs[i],mcy,after?'Msg':'Msg '+(i+1),key+'-msg-'+i));
      const first=a.messages[0];a.input=beam([[width/2,w.y+222],[width/2,offset+332],[first.cx,offset+332],[first.cx,first.top-6]],key+'-input');
      if(!after)for(let i=1;i<3;i++)wire([[width/2,offset+332],[a.messages[i].cx,offset+332],[a.messages[i].cx,a.messages[i].top-6]],C.track,true);
      for(let i=0;i<3;i++){
        const m=a.messages[after?0:i],q=ring(xs[i],qcy,i,key+'-q-'+i);a.queues.push(q);pin(m.cx,m.bottom+6);pin(q.cx,q.top-6);
        const points=after?[[m.cx,m.bottom+6],[m.cx,offset+482],[q.cx,offset+482],[q.cx,q.top-6]]:[[m.cx,m.bottom+6],[q.cx,q.top-6]];a.copies.push(beam(points,key+'-copy-'+i));
        txt('Copy '+(i+1),q.cx+(i===2?-12:12),offset+502,11,C.muted,i===2?'end':'start');txt('SendQ',q.cx,qcy+38,11,C.muted);txt('SubRef',q.cx,qcy+56,11,C.muted);
      }
      if(after){txt('AddRef(3)',width/2+66,mcy-38,12,C.active,'start');txt('RefCount로 유지',width/2+66,mcy+32,11,C.muted,'start',{id:a.ref});}
    }
    out.push('</g>');if(!after)wire([[20,compact?630:400],[width-20,compact?630:400]],C.edge);
  }
  return {markup:out.join('\n'),width,height,compact,worlds,rows,labels,bounds,paths,kind};
}

function createReuseProgram(){
  const segments=[];let time=0;
  function add(row,phase,actor,duration){duration/=row===0?1.25:1;const s={row,phase,actor,start:time,end:time+duration,duration};segments.push(s);time=s.end;}
  for(let row=0;row<2;row++){
    add(row,'prepare',0,250);add(row,'move',0,850);add(row,'select',0,250);
    if(row===0){for(let i=0;i<3;i++){add(row,'build',i,500);add(row,'copy',i,650);add(row,'hold',i,500);add(row,'release',i,360);add(row,'rest',i,160);}add(row,'done',0,400);}
    else{add(row,'build',0,500);add(row,'addref',0,320);for(let i=0;i<3;i++){add(row,'copy',i,650);add(row,'hold',i,500);}add(row,'release',0,560);add(row,'done',0,900);}
  }
  add(-1,'done',0,800);return {segments,end:time};
}
function sectorFrame(time,program,preview=false){
  const clamp=v=>Math.max(0,Math.min(1,v)),state={time:Math.max(0,Math.min(program.end,time)),preview,activeRow:-1,phase:'같은 이동 · 같은 수신자 · Msg 생성 3회 → 1회',rows:[0,1].map(row=>({messages:Array.from({length:row===0?3:1},()=>({live:preview,build:preview?1:0,ref:preview?(row===0?1:4):0,pulseAt:-99999})),queues:[0,0,0].map(()=>({filled:preview,pulseAt:-99999})),returned:[false,false,false],copy:null,created:preview?(row===0?3:1):0,copies:preview?3:0,worldMove:preview?1:0,moving:false,selected:preview}))};
  if(preview)return state;
  for(const s of program.segments){
    if(state.time<s.start)break;const p=clamp((state.time-s.start)/s.duration),done=state.time>=s.end;
    if(s.row<0){state.activeRow=-1;state.phase='완료 · Msg 생성 3회 → 1회 · SendQ의 사본은 유지';continue;}
    const r=state.rows[s.row],m=r.messages[s.row===0?s.actor:0],label=s.row===0?'변경 전':'변경 후';state.activeRow=s.row;
    if(s.phase==='prepare')state.phase=label+' · 이동 준비';
    else if(s.phase==='move'){r.worldMove=p;r.moving=!done;state.phase=label+' · A가 가운데 섹터에서 오른쪽으로 이동';}
    else if(s.phase==='select'){r.selected=true;state.phase=label+' · 같은 정보를 보낼 수신자 선택';}
    else if(s.phase==='build'){m.live=true;m.build=p;m.ref=1;r.created=s.row===0?s.actor+1:1;state.phase=label+' · '+(s.row===0?'Msg '+(s.actor+1)+' 생성':'Msg 한 번 생성');if(done)m.pulseAt=s.end;}
    else if(s.phase==='addref'){m.ref=4;state.phase='변경 후 · AddRef(3) · 같은 Msg 유지';}
    else if(s.phase==='copy'){if(s.row===0)m.ref=2;state.phase=label+' · '+(s.row===0?'Msg '+(s.actor+1):'같은 Msg')+' → SendQ '+(s.actor+1);if(done){r.queues[s.actor].filled=true;r.queues[s.actor].pulseAt=s.end;r.copies=s.actor+1;m.ref=s.row===0?1:3-s.actor;m.pulseAt=s.end;r.copy=null;}else r.copy={actor:s.actor,p};}
    else if(s.phase==='hold')state.phase=label+' · '+(s.row===0?'Copy 후 SubRef':(s.actor+1)+'회 사용 · Ref '+m.ref+' · 같은 Msg 유지');
    else if(s.phase==='release'){m.ref=0;m.live=false;r.returned[s.row===0?s.actor:0]=true;state.phase=label+' · '+(s.row===0?'Msg '+(s.actor+1)+' 반환':'마지막 SubRef · Ref 0 · 풀 반환');}
  }
  return state;
}
function reusePoint(beam,p){let remaining=beam.length*Math.max(0,Math.min(1,p));for(let i=1;i<beam.points.length;i++){const a=beam.points[i-1],b=beam.points[i],len=Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]);if(remaining<=len){const t=len?remaining/len:0;return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];}remaining-=len;}return beam.points.at(-1);}
function reusePulse(time,at){const age=time-at;return age<0?0:age<40?age/40:age<540?1:age<890?1-(age-540)/350:0;}
function applySectorFrame(scene,state,set){
  const identity='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0',gray='.2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 0 0 0 1 0';
  for(let i=0;i<2;i++){
    const a=scene.rows[i],r=state.rows[i],w=scene.worlds[i],inactive=state.activeRow!==-1&&state.activeRow!==i;set(a.group,{opacity:inactive?.38:1});set(a.matrix,{values:inactive?gray:identity});
    const dx=(w.end[0]-w.start[0])*(.5-.5*Math.cos(r.worldMove*Math.PI));set(w.hero,{transform:`translate(${dx} 0)`});set(w.face,{href:`#bundle-mage-${scene.kind}-${r.moving?'east':'south'}`,'data-facing':r.moving?'east':'south'});set(w.ghost,{opacity:r.worldMove>0?.18:0});set(w.arrow,{opacity:r.moving?1:0});for(const halo of w.halos)set(halo,{opacity:r.selected?1:.08});
    for(let j=0;j<a.messages.length;j++){const m=a.messages[j],f=r.messages[j];set(m.content,{opacity:f.live?1:0});set(m.mask,{width:m.fullWidth*f.build});set(m.flash,{opacity:reusePulse(state.time,f.pulseAt)});set(m.returned,{opacity:r.returned[j]?1:0});}
    for(let j=0;j<3;j++){set(a.queues[j].fill,{opacity:r.queues[j].filled?1:0});set(a.queues[j].flash,{opacity:reusePulse(state.time,r.queues[j].pulseAt)});const b=a.copies[j],active=r.copy&&r.copy.actor===j,p=active?r.copy.p:0;set(b.trace,{opacity:active?1:0});set(b.carrier,{opacity:active?1:0,transform:`translate(${reusePoint(b,p).join(' ')})`});}
    set(a.input.trace,{opacity:0});set(a.input.carrier,{opacity:0});
    if(i===1){const m=r.messages[0];set(a.ref,{opacity:state.preview||m.live||r.returned[0]?1:0},state.preview?'RefCount로 유지':m.ref===0?'Ref 0 · 풀 반환':`Ref ${m.ref} · 유지`);}
  }
}
