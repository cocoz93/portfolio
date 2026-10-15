function createSharingStudy(width,variant){
  width=Math.max(320,Math.round(width));const compact=width<700,height=compact?992:736;
  const C={bg:'var(--pcb-bg)',surface:'var(--pcb-surface)',edge:'var(--pcb-edge)',track:'var(--pcb-track)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',active:'var(--pcb-active)',focus:'var(--pcb-data-focus)',empty:'var(--pcb-empty)',pin:'var(--pcb-pin)'};
  const out=[],labels=[],paths=[],bounds=[];
  const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  function tag(name,attrs,body=''){out.push(`<${name} ${Object.entries(attrs).map(([k,v])=>`${k}="${esc(v)}"`).join(' ')}>${body}</${name}>`);}
  function box(x,y,w,h,fill=C.surface,stroke=null,extra={}){tag('rect',{x,y,width:w,height:h,fill,...(stroke?{stroke,'stroke-width':1.5}:{}),...extra});}
  function txt(text,x,y,size=12,color=C.text,anchor='middle',mono=false){labels.push({text,x,y,size,anchor});tag('text',{x,y,fill:color,'font-size':size,'text-anchor':anchor,'dominant-baseline':'middle',...(mono?{class:'study-mono'}:{})},esc(text));}
  function wire(points,arrow=false,color=C.track,opacity=.75){
    for(let i=1;i<points.length;i++)if(points[i][0]!==points[i-1][0]&&points[i][1]!==points[i-1][1])throw Error('Orthogonal traces only');paths.push(points);
    tag('path',{d:points.map((p,i)=>`${i?'L':'M'}${p[0]} ${p[1]}`).join(' '),fill:'none',stroke:color,'stroke-width':1.5,'stroke-linejoin':'miter',opacity});
    if(arrow){let i=points.length-2;const [x,y]=points.at(-1);while(i>=0&&points[i][0]===x&&points[i][1]===y)i--;if(i<0)return;const [px,py]=points[i],s=3;tag('polyline',{points:x!==px?`${x-Math.sign(x-px)*4},${y-s} ${x},${y} ${x-Math.sign(x-px)*4},${y+s}`:`${x-s},${y-Math.sign(y-py)*4} ${x},${y} ${x+s},${y-Math.sign(y-py)*4}`,fill:'none',stroke:color,'stroke-width':1.5,opacity});}
  }
  function pin(x,y){tag('circle',{cx:x,cy:y,r:3,fill:C.pin});tag('circle',{cx:x,cy:y,r:1.25,fill:C.bg});}
  function corners(x,y,w,h){for(const [a,b,sx,sy] of [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]])wire([[a,b+sy*6],[a,b],[a+sx*6,b]],false,C.edge,.9);}
  function component(x,y,w,h,role){bounds.push({x,y,w,h,role});box(x,y,w,h,C.surface,C.edge,{'data-role':role});corners(x-4,y-4,w+8,h+8);}
  function builder(x,cy){const w=104,h=48;component(x,cy-h/2,w,h,'serialization-work');txt('생성·직렬화',x+w/2,cy,12);pin(x+w+6,cy);return {left:x,right:x+w,cx:x+w/2,cy};}
  function msg(x,cy,w=136,label='Msg'){const h=76,y=cy-h/2;component(x,y,w,h,'serial-buffer');box(x+1,y+1,w-2,21,C.muted,null,{opacity:.1});box(x+1,y+23,w-2,15,C.muted,null,{opacity:.17});wire([[x+1,y+22],[x+w-1,y+22]],false,C.edge);wire([[x+1,y+38],[x+w-1,y+38]],false,C.edge);box(x+6,y+44,w-12,26,C.focus,null,{opacity:.85,'data-role':'identical-payload'});txt(label,x+10,y+11,12,C.text,'start',true);txt('Header',x+10,y+30,11,C.muted,'start',true);txt('같은 내용',x+w/2,y+57,12,C.text);pin(x-6,cy);pin(x+w+6,cy);return {left:x,right:x+w,top:y,bottom:y+h,cx:x+w/2,cy};}
  function port(x,cy,w=88,session=1){component(x,cy-24,w,48,'session-sendq-port');txt(`세션 ${session}`,x+w/2,cy-8,11,C.muted);txt('SendQ',x+w/2,cy+10,12,C.text,'middle',true);pin(x-6,cy);return {left:x,right:x+w,cx:x+w/2,cy,top:cy-24,bottom:cy+24};}
  function ring(cx,cy,r=32,session=1){
    bounds.push({x:cx-r,y:cy-r,w:r*2,h:r*2,role:'session-ring-buffer'});
    const polar=(rr,a)=>[cx+rr*Math.cos(a*Math.PI/180),cy+rr*Math.sin(a*Math.PI/180)];
    for(let i=0;i<8;i++){const a=-180+i*45+1.4,b=a+42.2,p=polar(r,a),q=polar(r,b),s=polar(r*.62,b),t=polar(r*.62,a);tag('path',{d:`M${p.join(',')} A${r},${r} 0 0 1 ${q.join(',')} L${s.join(',')} A${r*.62},${r*.62} 0 0 0 ${t.join(',')} Z`,fill:i===2?C.focus:C.empty,stroke:C.edge,'stroke-width':1.5});}
    txt(`S${session}`,cx,cy,13,C.text,'middle',true);txt('SendQ',cx,cy+r+16,11,C.muted,'middle',true);pin(cx-r-6,cy);return {cx,cy,left:cx-r,right:cx+r,top:cy-r,bottom:cy+r};
  }
  function heading(label,y,after=false){txt(label,24,y,14,after?C.active:C.text,'start');}
  function rule(y){wire([[20,y],[width-20,y]],false,C.edge,.8);}
  function copyLabel(x,y){txt('Copy',x,y,11,C.muted,'middle',true);}
  box(0,0,width,height,C.bg);
  if(variant==='work'){
    heading('변경 전 · 수신자마다 같은 작업',32);
    if(!compact){
      const bx=40,mx=Math.round(width*.41),qx=width-120,ys=[116,212,308];
      txt('생성·직렬화',bx+52,68,12,C.muted);txt('직렬화버퍼',mx+68,68,12,C.muted);txt('수신 세션',qx+44,68,12,C.muted);
      for(let i=0;i<3;i++){const b=builder(bx,ys[i]),m=msg(mx,ys[i],136,`Msg ${i+1}`),q=port(qx,ys[i],88,i+1);wire([[b.right+6,ys[i]],[m.left-6,ys[i]]],true);wire([[m.right+6,ys[i]],[q.left-6,ys[i]]],true);copyLabel((m.right+q.left)/2,ys[i]+16);}
      rule(378);heading('변경 후 · 한 번 만들고 재사용',410,true);
      const cy=548,b=builder(bx,cy),m=msg(mx,cy),trunk=width-160;
      wire([[b.right+6,cy],[m.left-6,cy]],true);wire([[m.right+6,cy],[trunk,cy]]);wire([[trunk,464],[trunk,632]]);
      for(let i=0;i<3;i++){const y=464+i*84,q=port(qx,y,88,i+1);wire([[trunk,y],[q.left-6,y]],true);copyLabel((trunk+q.left)/2,y+16);}
      txt('생성·직렬화 1회',bx+52,cy+50,12,C.text);txt('AddRef(3)',mx+68,cy+62,12,C.active,'middle',true);
      txt('생성 3회 → 1회',width/2,702,13);txt('세션별 Copy는 3회',width-24,702,11,C.muted,'end');
    }else{
      const bx=24,mx=width-160;
      for(let i=0;i<3;i++){const cy=98+i*160,b=builder(bx,cy),m=msg(mx,cy,136,`Msg ${i+1}`),q=port(width-116,cy+80,88,i+1);wire([[b.right+6,cy],[m.left-6,cy]],true);pin(m.cx,m.bottom+6);pin(q.cx,q.top-6);wire([[m.cx,m.bottom+6],[m.cx,q.top-16],[q.cx,q.top-16],[q.cx,q.top-6]],true);copyLabel(q.left-22,cy+80);}
      rule(550);heading('변경 후 · 한 번 생성',586,true);
      const cy=666,b=builder(bx,cy),m=msg(mx,cy);wire([[b.right+6,cy],[m.left-6,cy]],true);txt('AddRef(3)',width/2,742,12,C.active,'middle',true);
      const qy=860,qw=80,g=12,start=(width-qw*3-g*2)/2;pin(m.cx,m.bottom+6);wire([[m.cx,m.bottom+6],[m.cx,784]]);wire([[start+qw/2,784],[Math.max(m.cx,start+2*(qw+g)+qw/2),784]]);
      for(let i=0;i<3;i++){const q=port(start+i*(qw+g),qy,qw,i+1);pin(q.cx,q.top-6);wire([[q.cx,784],[q.cx,q.top-6]],true);copyLabel(q.cx,904);}
      txt('생성·직렬화 3회 → 1회',width/2,950,13);txt('세션별 Copy 3회 유지',width/2,978,12,C.muted);
    }
  }else if(variant==='fanout'){
    heading('변경 전 · 같은 내용의 Msg 세 개',32);
    if(!compact){
      const mx=144,qx=width-146,ys=[124,242,360];
      for(let i=0;i<3;i++){const m=msg(mx,ys[i],156,`Msg ${i+1}`),q=ring(qx,ys[i],30,i+1);wire([[m.right+6,ys[i]],[q.left-6,ys[i]]],true);copyLabel((m.right+q.left)/2,ys[i]+18);}
      rule(424);heading('변경 후 · 같은 Msg에서 팬아웃',454,true);
      const cy=528,m=msg((width-156)/2,cy,156),xs=[width*.24,width/2,width*.76];
      txt('AddRef(3)',m.cx,478,13,C.active,'middle',true);pin(m.cx,m.bottom+6);wire([[m.cx,m.bottom+6],[m.cx,600]]);wire([[xs[0],600],[xs[2],600]]);
      for(let i=0;i<3;i++){const q=ring(xs[i],654,30,i+1);pin(q.cx,q.top-6);wire([[q.cx,600],[q.cx,q.top-6]],true);copyLabel(q.cx+30,610);}
      txt('생성 1회',m.cx-122,528,12,C.muted);txt('Copy 후 SubRef · 마지막 Ref 0에서 풀 반환',width/2,724,11,C.muted);
    }else{
      const mx=24,qx=width-56,ys=[114,250,386];
      for(let i=0;i<3;i++){const m=msg(mx,ys[i],144,`Msg ${i+1}`),q=ring(qx,ys[i],28,i+1);wire([[m.right+6,ys[i]],[q.left-6,ys[i]]],true);copyLabel((m.right+q.left)/2,ys[i]+18);}
      rule(472);heading('변경 후 · Msg 하나 재사용',510,true);
      const m=msg((width-144)/2,620,144),xs=[width/2-104,width/2,width/2+104];txt('AddRef(3)',width/2,560,13,C.active,'middle',true);pin(m.cx,m.bottom+6);wire([[m.cx,m.bottom+6],[m.cx,712]]);wire([[xs[0],712],[xs[2],712]]);
      for(let i=0;i<3;i++){const q=ring(xs[i],812,28,i+1);pin(xs[i],q.top-6);wire([[xs[i],712],[xs[i],q.top-6]],true);copyLabel(xs[i]+30,750);}
      txt('생성·직렬화 1회 · Copy 3회',width/2,900,13);txt('각 Copy 후 SubRef',width/2,936,12,C.muted);
    }
  }else if(variant==='lifetime'){
    const stageNames=['세션 1 처리','세션 2 처리','세션 3 처리'];
    if(!compact){
      const left=104,right=width-74,release=width-38,span=right-left,w=span/3;
      txt('수신자별 처리 순서',24,34,12,C.muted,'start');wire([[left,70],[release,70]],true,C.track,.8);
      for(let i=0;i<3;i++){const x=left+i*w;txt(stageNames[i],x+w/2,100,12,C.muted);wire([[x,64],[x,76]],false,C.track);}
      heading('변경 전',144);
      for(let i=0;i<3;i++){const x=left+i*w+8,bw=w-16;box(x,170,bw,62,C.focus,null,{opacity:.85,'data-role':'separate-buffer-lifetime'});txt(`Msg ${i+1}`,x+bw/2,201,13,C.text,'middle',true);txt('생성',x+4,252,11,C.muted,'start');txt('풀 반환',x+bw-4,252,11,C.muted,'end');}
      rule(306);heading('변경 후',350,true);
      box(left+8,376,span-16,76,C.focus,null,{opacity:.85,'data-role':'retained-buffer-lifetime'});txt('같은 Msg를 세 번의 Copy 동안 유지',left+span/2,414,14,C.text);
      const events=[{x:left+8,label:'4',op:'AddRef(3)'},{x:left+w,label:'3',op:'Copy 1'},{x:left+w*2,label:'2',op:'Copy 2'},{x:right-8,label:'1',op:'Copy 3'},{x:release,label:'0',op:'SubRef()'}];
      txt('Ref',24,494,13,C.muted,'start',true);
      for(let i=0;i<events.length;i++){const e=events[i];wire([[e.x,452],[e.x,470]],false,C.edge);txt(e.label,e.x,494,22,i===4?C.active:C.text,'middle',true);if(i<events.length-1)wire([[e.x+16,494],[events[i+1].x-16,494]],true,C.edge);}
      txt('초기 Ref 1',left+8,548,12,C.muted,'start');txt('AddRef(3) → 4',left+8,574,12,C.text,'start',true);
      txt('Copy마다 SubRef',left+w*1.65,548,12,C.muted);txt('4 → 3 → 2 → 1',left+w*1.65,574,12,C.text,'middle',true);
      txt('빌더 몫 반환',release,548,12,C.muted,'end');txt('1 → 0 · 풀 반환',release,574,12,C.active,'end',true);
      txt('생성 3회 → 1회 · 세션별 Copy는 그대로',width/2,682,13);
    }else{
      const origin=(width-224)/2,bx=origin,ax=origin+116,cw=104,top=160,h=170;
      txt('수신자별 처리 순서',24,34,12,C.muted,'start');txt('변경 전',bx+cw/2,90,14,C.text);txt('변경 후',ax+cw/2,90,14,C.active);txt('AddRef(3)',ax+cw/2,122,12,C.active,'middle',true);txt('Ref 1 → 4',ax+cw/2,143,11,C.muted,'middle',true);
      wire([[origin-24,top],[origin-24,top+h*3+28]],true,C.track,.8);
      box(ax,top,cw,h*3-24,C.focus,null,{opacity:.85,'data-role':'retained-buffer-lifetime'});
      for(let i=0;i<3;i++){const y=top+i*h;wire([[origin-29,y],[origin-19,y]],false,C.track);box(bx,y,cw,h-40,C.focus,null,{opacity:.85,'data-role':'separate-buffer-lifetime'});txt(`Msg ${i+1}`,bx+cw/2,y+45,13,C.text,'middle',true);txt('생성 → 풀 반환',bx+cw/2,y+92,11,C.text);txt(`세션 ${i+1} Copy`,ax+cw/2,y+48,12,C.text);txt(`Ref ${4-i} → ${3-i}`,ax+cw/2,y+88,13,C.text,'middle',true);}
      txt('같은 Msg 유지',ax+cw/2,top+h*3-58,12,C.text);
      wire([[ax+cw/2,top+h*3-24],[ax+cw/2,726]],true,C.track);txt('마지막 빌더 몫 SubRef()',width/2,774,12,C.muted);txt('Ref 1 → 0 · 풀 반환',width/2,810,13,C.active);
      txt('생성 3회 → 1회',width/2,920,13);txt('세션별 Copy는 3회 유지',width/2,950,12,C.muted);
    }
  }else throw Error('Unknown design');
  return {markup:out.join('\n'),width,height,variant,compact,labels,paths,bounds};
}
