function createPcbStudy(width, design, magePixels) {
  const themes = {
    mask: { bg:'#0d2524', field:'#12312d', component:'#143b35', empty:'#20483f', edge:'#497166', wire:'#72958b', ink:'#edf5ef', muted:'#a8c3b7', pad:'#c3a87a', active:'#87dfca', soft:'#205349' },
    schematic: { bg:'#0e1724', field:'#101c2c', component:'#162536', empty:'#172a3b', edge:'#455e75', wire:'#8ca8be', ink:'#eef4fa', muted:'#b2c3d4', pad:'#b2c3d4', active:'#67c8ff', soft:'#24475f' },
    assembly: { bg:'#111c2b', field:'#16283b', component:'#101b29', empty:'#263d52', edge:'#486980', wire:'#83a5bd', ink:'#edf4fc', muted:'#aec4d7', pad:'#a3b3c0', active:'#67c8ff', soft:'#19415e' }
  };
  const C=themes[design];
  if(!C)throw Error('Unknown PCB design');
  width=Math.max(320,width);
  const mobile=width<680,height=mobile?810:506,offsets=mobile?[0,396]:[0,236];
  const out=[],labels=[],traces=[],roleCounts={};
  const stroke=1.6;
  const count=role=>roleCounts[role]=(roleCounts[role]||0)+1;
  const attrs=values=>Object.entries(values).map(([key,value])=>`${key}="${String(value).replaceAll('&','&amp;').replaceAll('"','&quot;')}"`).join(' ');
  const emit=(tag,values,content='')=>out.push(`<${tag} ${attrs(values)}>${content}</${tag}>`);
  function box(x,y,w,h,fill,edge='none',extra={}){emit('rect',{x,y,width:w,height:h,fill,stroke:edge,'stroke-width':stroke,...extra});}
  function circle(x,y,r,fill,edge='none',extra={}){emit('circle',{cx:x,cy:y,r,fill,stroke:edge,'stroke-width':stroke,...extra});}
  function text(label,x,y,size=12,color=C.ink,anchor='middle',mono=false,extra={}){
    labels.push({label,x,y,size,anchor});
    emit('text',{x,y,'font-size':size,fill:color,'text-anchor':anchor,'dominant-baseline':'middle',class:mono?'pcb-study-mono':'',...extra},label);
  }
  function rule(points,color=C.edge,extra={}){
    const d=points.map((p,i)=>`${i?'L':'M'}${p[0]} ${p[1]}`).join(' ');
    emit('path',{d,fill:'none',stroke:color,'stroke-width':stroke,'stroke-linejoin':'miter','stroke-linecap':'butt',...extra});
  }
  function wire(points,color=C.wire,arrow=false,extra={}){
    for(let i=1;i<points.length;i++)if(points[i][0]!==points[i-1][0]&&points[i][1]!==points[i-1][1])throw Error('Nonorthogonal circuit trace');
    traces.push(points);
    rule(points,color,{'data-role':'circuit-trace',...extra});
    if(arrow){
      const [x,y]=points.at(-1),p=points.at(-2),right=x>p[0],down=y>p[1];
      const d=x!==p[0]?`M${x+(right?-5:5)} ${y-3.5} L${x} ${y} L${x+(right?-5:5)} ${y+3.5}`:`M${x-3.5} ${y+(down?-5:5)} L${x} ${y} L${x+3.5} ${y+(down?-5:5)}`;
      emit('path',{d,fill:'none',stroke:color,'stroke-width':stroke});
    }
  }
  function via(x,y,on=false){
    count('via');
    if(design==='mask'){
      circle(x,y,3.2,C.pad,'none',{'data-role':'via'});circle(x,y,1.3,C.bg);
    }else if(design==='schematic')circle(x,y,2.5,on?C.active:C.wire,'none',{'data-role':'via'});
    else{box(x-2.5,y-2.5,5,5,on?C.active:C.pad,'none',{'data-role':'via'});}
  }
  function pad(x,y,side,on=false){
    count('pad');
    const fill=on?C.active:C.pad;
    const vertical=side==='top'||side==='bottom';
    if(design==='mask'){
      box(x-(vertical?3:5),y-(vertical?5:3),vertical?6:10,vertical?10:6,fill,'none',{rx:3,'data-role':'solder-pad'});
    }else if(design==='schematic'){
      box(x-3,y-3,6,6,C.bg,fill,{'data-role':'solder-pad'});
    }else box(x-(vertical?2.5:5),y-(vertical?5:2.5),vertical?5:10,vertical?10:5,fill,'none',{'data-role':'solder-pad'});
  }
  function component(x,y,w,h,on=false){
    const edge=on?C.active:C.edge;
    if(design==='mask'){
      box(x-3,y-3,w+6,h+6,'none',C.edge,{'stroke-width':.8,rx:1});
      box(x,y,w,h,C.component,'none',{rx:2});
    }else if(design==='schematic'){
      box(x,y,w,h,C.component,edge,{rx:1});
    }else{
      // Orthogonal corner steps are part of the component package.
      const c=5,d=`M${x+c} ${y} H${x+w-c} V${y+c} H${x+w} V${y+h-c} H${x+w-c} V${y+h} H${x+c} V${y+h-c} H${x} V${y+c} H${x+c} Z`;
      emit('path',{d,fill:C.component,stroke:edge,'stroke-width':stroke,'data-role':'component-package'});
      box(x+5,y+5,w-10,h-10,'none',C.edge,{'stroke-width':.6});
    }
  }
  function mageDefinition(){
    const P={o:'#08121e',l:'#dce9f3',m:'#dce9f3',d:'#617e9a',a:C.active,b:C.active,c:'#2579ad',v:'#17466a',s:'#ecd0b5',t:'#bd947a'};
    out.push(`<defs><g id="pcb-study-mage-${design}" shape-rendering="crispEdges">`);
    magePixels.forEach((row,y)=>{
      for(let x=0;x<32;){
        const p=row[x];let end=x+1;while(end<32&&row[end]===p)end++;
        if(P[p])box(x-16,y-20,end-x,1,P[p]);x=end;
      }
    });
    out.push('</g></defs>');
  }
  function ringPath(cx,cy,outer,inner,a,b){
    const point=(r,t)=>[cx+Math.cos(t*Math.PI/180)*r,cy+Math.sin(t*Math.PI/180)*r];
    const p=point(outer,a),q=point(outer,b),u=point(inner,b),v=point(inner,a);
    return `M${p} A${outer},${outer} 0 0 1 ${q} L${u} A${inner},${inner} 0 0 0 ${v} Z`;
  }
  function board(){
    box(0,0,width,height,C.bg);
    if(design==='schematic'){
      for(let x=24;x<width-24;x+=24)for(let y=28;y<height-24;y+=24)circle(x,y,.6,C.edge,'none',{opacity:.24});
    }else if(design==='mask'){
      // A continuous soldermask surface; only functional nets use the brighter copper color.
      box(14,8,width-28,height-44,C.field,'none',{rx:6});
      for(const [x,y] of [[24,18],[width-24,18],[24,height-46],[width-24,height-46]]){
        circle(x,y,4.5,C.pad,'none',{'data-role':'mounting-hole'});circle(x,y,2.3,C.bg);
      }
    }else{
      for(const offset of offsets)box(14,offset+8,width-28,mobile?368:220,C.field,'none',{rx:2});
    }
    const divider=mobile?384:230;
    rule([[24,divider],[width-24,divider]],C.edge,{'stroke-width':.8,opacity:.75});
  }
  board();mageDefinition();
  for(let index=0;index<2;index++){
    const after=index===1,offset=offsets[index],ink=after?C.active:C.wire;
    const mapW=mobile?128:144,msgW=100,msgH=28,msgGap=34,queueW=136,r=58,inner=34,reqW=108,reqH=112;
    const gap=(width-64-mapW-msgW-queueW-reqW)/3;
    const map={x:32,y:offset+(mobile?66:74),w:mapW,h:mapW};
    const msgX=mobile?width-32-msgW:map.x+mapW+gap;
    const msgY=offset+(mobile?65:81),cy=offset+(mobile?290:146);
    const cx=mobile?90:msgX+msgW+gap+queueW/2,reqX=mobile?width-24-reqW:cx+queueW/2+gap,reqY=cy-reqH/2;
    const titleY=offset+48,secondTitleY=offset+213,centers=Array.from({length:4},(_,i)=>msgY+i*msgGap+msgH/2);
    text(after?'변경 후':'변경 전',design==='mask'?40:24,offset+18,13,after?C.active:C.muted,'start');
    text('캐릭터 이동',map.x+map.w/2,titleY,12,C.muted);
    text('이동 메시지',msgX+msgW/2,titleY,12,C.muted);
    text('SendQ',mobile?cx-12:cx,mobile?secondTitleY:titleY,12,C.muted,mobile?'end':'middle',true);
    text('WSASend',reqX+reqW/2,mobile?secondTitleY:titleY,12,C.muted,'middle',true);
    component(map.x,map.y,map.w,map.h);
    const mp=10,left=map.x+mp,top=map.y+mp,iw=map.w-2*mp;
    if(design!=='assembly'){
      box(left,top,iw,iw,'none',C.edge,{'stroke-width':.8,opacity:.6});
      rule([[left+iw/2,top],[left+iw/2,top+iw]],C.edge,{'stroke-width':.8,opacity:.5});
      rule([[left,top+iw/2],[left+iw,top+iw/2]],C.edge,{'stroke-width':.8,opacity:.5});
    }else{
      for(let x=left+iw/4;x<left+iw;x+=iw/2)for(let y=top+iw/4;y<top+iw;y+=iw/2)circle(x,y,2,C.edge);
    }
    const ps=[[left+iw/4,top+iw/4],[left+iw*3/4,top+iw/4],[left+iw*3/4,top+iw*3/4],[left+iw/4,top+iw*3/4]];
    for(let i=0;i<4;i++){
      const a=ps[i],b=ps[(i+1)%4],dx=Math.sign(b[0]-a[0]),dy=Math.sign(b[1]-a[1]);
      wire([[a[0]+dx*17,a[1]+dy*17],[b[0]-dx*17,b[1]-dy*17]],C.wire,true,{opacity:.72,'data-role':'movement-route'});
      if(i<3){circle(a[0],a[1],10,C.component,C.muted,{'stroke-width':1.1});text(String(i+1),a[0],a[1],12,C.muted,'middle',true);}
    }
    const [mx,my]=ps[3],spriteSize=mobile?34:38;
    emit('use',{href:`#pcb-study-mage-${design}`,transform:`translate(${mx} ${my}) scale(${spriteSize/32})`,'data-role':'character','aria-label':'마법사 캐릭터'});count('character');
    text('4',mx+22,my-18,12,C.active,'middle',true);
    const sourceY=map.y+map.h/2,inputRail=mobile?(map.x+map.w+msgX)/2:msgX-22;
    const outputRail=mobile?width-16:msgX+msgW+22;
    const queueExtent=design==='assembly'?queueW/2:r;
    const queueEnd=mobile?[cx,cy-queueExtent-6]:[cx-queueExtent-6,cy];
    for(let i=0;i<4;i++){
      wire([[map.x+map.w,sourceY],[inputRail,sourceY],[inputRail,centers[i]],[msgX-7,centers[i]]],C.wire);
      const route=mobile?[[msgX+msgW+7,centers[i]],[outputRail,centers[i]],[outputRail,offset+201],[cx,offset+201],queueEnd]:[[msgX+msgW+7,centers[i]],[outputRail,centers[i]],[outputRail,cy],queueEnd];
      wire(route,ink,true);
    }
    pad(map.x+map.w,sourceY,'right');
    via(inputRail,sourceY);via(outputRail,mobile?centers[1]:cy,after);
    for(let i=0;i<4;i++){
      const y=msgY+i*msgGap;
      component(msgX,y,msgW,msgH);
      box(msgX+2,y+2,msgW-4,msgH-4,after?C.soft:C.empty,'none',{opacity:after?.68:.55});
      text(`Msg ${i+1}`,msgX+msgW/2,centers[i],13,C.ink,'middle',true,{'data-role':'message'});count('message');
      pad(msgX-3,centers[i],'left');pad(msgX+msgW+3,centers[i],'right',after);
    }
    if(design==='assembly'){
      component(cx-queueW/2,cy-queueW/2,queueW,queueW);
      for(const y of [cy-40,cy+40]){
        pad(cx-queueW/2-4,y,'left');pad(cx+queueW/2+4,y,'right');
      }
    }else if(design==='mask')circle(cx,cy,r+5,'none',C.edge,{'stroke-width':.8});
    if(design==='schematic'){
      circle(cx,cy,inner-4,'none',C.edge,{'stroke-width':.7});
    }
    for(let i=0;i<8;i++){
      const a=-180+i*45+1.5,b=a+42,on=after&&i<4;
      emit('path',{d:ringPath(cx,cy,r,inner,a,b),fill:on?C.active:C.empty,stroke:on?C.active:C.edge,'stroke-width':design==='mask'?1.2:stroke,'data-role':'queue-slot','data-queue':index,'data-lit':on});count('queue-slot');
      if(on){const angle=(-180+i*45+22.5)*Math.PI/180;const rr=(r+inner)/2;text(String(i+1),cx+Math.cos(angle)*rr,cy+Math.sin(angle)*rr,12,C.bg,'middle',true);}
    }
    text(after?'누적':'즉시',cx,cy-5,17,C.ink);
    text(after?'4개 모아':'매번 비움',cx,cy+17,11,C.muted);
    pad(mobile?cx:cx-queueExtent-3,mobile?cy-queueExtent-3:cy,mobile?'top':'left',after);
    component(reqX,reqY,reqW,reqH,after);
    if(design==='assembly'){
      for(let i=0;i<4;i++){
        const px=reqX+21+i*22;
        pad(px,reqY-5,'top');pad(px,reqY+reqH+5,'bottom');
      }
      for(const y of [reqY+22,reqY+reqH-22])pad(reqX+reqW+5,y,'right');
    }else if(design==='mask'){
      rule([[reqX+12,reqY+14],[reqX+22,reqY+14]],C.pad,{'stroke-width':1.2});
    }
    text(after?'1':'4',reqX+reqW/2-5,cy-7,58,after?C.active:C.ink,'middle',true,{'data-role':'call-count','data-calls':after?1:4});count('call-count');
    text('회',reqX+reqW-14,cy+10,11,C.muted);
    text(after?'틱 끝 호출':'개별 호출',reqX+reqW/2,reqY+reqH-17,12,C.muted);
    const startX=cx+queueExtent+7,endX=reqX-8;
    for(let i=0;i<(after?1:4);i++){
      const y=cy+(after?0:(i-1.5)*14);
      wire([[startX,y],[endX,y]],ink,true,{'data-role':'send-trace','data-queue':index});count('send-trace');
      pad(reqX-3,y,'left',after);
      if(design==='assembly')pad(cx+queueExtent+3,y,'right',after);
    }
    if(after){
      const tx=(cx+queueExtent+reqX)/2;
      box(tx-18,cy-35,36,18,C.bg,C.edge,{rx:design==='mask'?2:0});
      text('틱 끝',tx,cy-26,11,C.active);
      // A single carrier containing the four original messages.
      box(tx-12,cy-9,24,18,C.bg,C.active,{'stroke-width':1.2,'data-role':'batch-carrier'});
      for(let i=0;i<4;i++)box(tx-9+i*5,cy-5,3,10,C.active,'none',{'data-role':'batch-message'});
    }
  }
  text('한 수신 세션 · 같은 Msg 4개',24,height-18,12,C.muted,'start');
  text('호출 4회 → 1회',width-24,height-18,12,C.active,'end');
  return {markup:out.join('\n'),width,height,mobile,design,labels,traces,roleCounts,colors:C};
}
