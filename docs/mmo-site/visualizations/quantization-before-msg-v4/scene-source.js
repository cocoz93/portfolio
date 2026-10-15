// Figure 5 focuses on the two coordinate fields. Other Msg fields are omitted.
const QUANT_SCALE=512,COORD_BYTES_BEFORE=8,COORD_BYTES_AFTER=4;
const EXAMPLE={startX:Math.fround(72.1257),x:Math.fround(73.1257),y:Math.fround(24.33333)};
function quantize(v){return Math.trunc(Math.fround(Math.fround(Math.max(0,Math.fround(v))*QUANT_SCALE)+.5));}
function dequantize(q){return q/QUANT_SCALE;}
const COORD_FIELDS=[{name:'x',qname:'qx',value:EXAMPLE.x},{name:'y',qname:'qy',value:EXAMPLE.y}];
function createProgram(){
  function part(side){const segments=[];let end=0;const add=(phase,ms)=>{segments.push({phase,start:end,end:end+ms});end+=ms;};
    add('idle',250);add('move',550);add('settle',200);add('source-form',500);add('source-ready',550);
    if(side==='after'){add('quantize',850);add('quantized',650);}add('deliver',400);add('store',300);add('stored',1150);add('done',250);return {side,segments,end};
  }const before=part('before'),after=part('after'),gap=550;return {before,after,gap,end:before.end+gap+after.end};
}
function partFrame(time,program){
  const clamp=p=>Math.min(1,Math.max(0,p)),ease=p=>p*p*(3-2*p),f={phase:'idle',progress:0,movement:0,sourceForm:0,filled:0,quantized:0,moving:false,done:time>=program.end};
  for(const s of program.segments){if(time<s.start)break;const p=clamp((time-s.start)/(s.end-s.start));if(s.phase==='move')f.movement=ease(p);if(s.phase==='source-form')f.sourceForm=ease(p);if(s.phase==='quantize')f.quantized=ease(p);if(s.phase==='store')f.filled=ease(p);if(time<s.end){f.phase=s.phase;f.progress=p;f.moving=s.phase==='move';break;}}
  if(f.done){f.phase='done';f.progress=1;}f.serverX=Math.fround(EXAMPLE.startX+(EXAMPLE.x-EXAMPLE.startX)*f.movement);f.serverY=EXAMPLE.y;return f;
}
function comparisonFrame(time,program){const offset=program.before.end+program.gap,active=time<program.before.end?'before':time<offset?'transition':time<program.end?'after':'both',before=partFrame(Math.min(time,program.before.end),program.before),after=partFrame(Math.max(0,time-offset),program.after),f=active==='before'?before:after;
  const words={idle:'이동 준비',move:'캐릭터 이동',settle:'최종 서버 좌표','source-form':'전송 전 · x·y 각각 4B','source-ready':active==='before'?'float 좌표 그대로':'Msg 저장 전 · 눈금으로 변환',quantize:'×512 · 반올림 · 각각 4B → 2B',quantized:'눈금값 변환 완료 · Msg 저장 준비',deliver:active==='before'?'float 좌표 → Msg':'2B 눈금값 → Msg',store:active==='before'?'좌표 저장 · 8B':'눈금값 저장 · 4B',stored:'좌표 저장 완료',done:'좌표 표현 완료'};
  return {active,before,after,phase:active==='both'?'완료 · 좌표 8B → 4B':active==='transition'?'변경 후 비교 준비':(active==='before'?'변경 전 · ':'변경 후 · ')+words[f.phase]};
}
function createScene(width,side='after'){
  width=Math.max(320,Math.round(width));const compact=width<700,height=compact?936:416,kind='quantization-pre-msg-'+side,after=side==='after';
  const C={bg:'var(--pcb-bg)',surface:'var(--pcb-surface)',edge:'var(--pcb-edge)',track:'var(--pcb-track)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',active:'var(--pcb-active)',empty:'var(--pcb-empty)',pin:'var(--pcb-pin)'};
  const out=[],labels=[],bounds=[],paths=[],sid=k=>kind+'-'+k,esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  function tag(name,attrs,body=''){out.push(`<${name} ${Object.entries(attrs).map(([k,v])=>`${k}="${esc(v)}"`).join(' ')}>${body}</${name}>`);}
  function box(x,y,w,h,fill=C.surface,stroke=null,attrs={}){tag('rect',{x,y,width:w,height:h,fill,...(stroke?{stroke,'stroke-width':1.5}:{}),...attrs});}
  function txt(text,x,y,size=14,color=C.text,anchor='middle',attrs={}){labels.push({text,x,y,size,anchor});tag('text',{x,y,'font-size':size,'dominant-baseline':'middle','text-anchor':anchor,fill:color,...attrs},esc(text));}
  function wire(points,color=C.track,attrs={}){for(let i=1;i<points.length;i++)if(points[i][0]!==points[i-1][0]&&points[i][1]!==points[i-1][1])throw Error('Non-orthogonal trace');paths.push(points);tag('path',{d:points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' '),fill:'none',stroke:color,'stroke-width':1.5,...attrs});}
  function contact(x,y){tag('circle',{cx:x,cy:y,r:2.5,fill:C.pin});tag('circle',{cx:x,cy:y,r:1,fill:C.bg});}
  /*CHARACTERS*/
  box(0,0,width,height,C.bg);mageDefinition();txt(after?'변경 후':'변경 전',24,28,12,after?C.active:C.muted,'start');
  const world={x:compact?(width-168)/2:24,y:106,size:168,cell:56,hero:sid('hero'),arrow:sid('arrow'),xValue:sid('server-x'),yValue:sid('server-y')};
  txt('캐릭터 이동',world.x+84,66,14,C.muted);bounds.push({kind:'map',x:world.x,y:world.y,w:168,h:168});box(world.x,world.y,168,168,C.bg,C.edge);
  for(let i=1;i<3;i++){wire([[world.x+i*56,world.y],[world.x+i*56,world.y+168]],C.edge);wire([[world.x,world.y+i*56],[world.x+168,world.y+i*56]],C.edge);}
  out.push(`<g id="${world.arrow}" opacity="0">`);wire([[world.x+35,world.y+84],[world.x+77,world.y+84]],C.active);tag('polygon',{points:`${world.x+77},${world.y+84} ${world.x+72},${world.y+81} ${world.x+72},${world.y+87}`,fill:C.active});out.push('</g>');
  tag('use',{id:world.hero,href:'#bundle-mage-'+kind+'-south',transform:`translate(${world.x+28} ${world.y+84}) scale(1.125)`,'data-character':'mage','data-facing':'south'});
  const server={x:world.x,y:296,w:168,h:96};bounds.push({kind:'server-float',...server});box(server.x,server.y,server.w,server.h,C.surface,C.edge);txt('서버 좌표 · float',server.x+84,server.y+16,12,C.muted);wire([[server.x+1,server.y+30],[server.x+167,server.y+30]],C.edge);
  txt('x '+EXAMPLE.x.toFixed(5),server.x+14,server.y+49,14,C.text,'start',{id:world.xValue,class:'sector-mono'});txt('y '+EXAMPLE.y.toFixed(5),server.x+14,server.y+75,14,C.text,'start',{id:world.yValue,class:'sector-mono'});
  const packet={x:compact?(width-282)/2:width-306,y:compact?612:106,w:282,h:286,rows:[],total:sid('coordinate-total'),heading:sid('Msg-heading'),header:sid('Msg-header'),caption:sid('Msg-caption')};
  txt('Msg',packet.x+141,compact?582:66,14,C.muted,'middle',{id:packet.heading});bounds.push({kind:'Msg-coordinate-part',x:packet.x,y:packet.y,w:282,h:286});box(packet.x,packet.y,282,286,C.surface,C.edge);txt('Msg',packet.x+12,packet.y+16,16,C.text,'start',{id:packet.header,class:'sector-mono'});txt(after?'눈금값 · 1/512타일':'좌표 부분',packet.x+270,packet.y+16,12,C.muted,'end',{id:packet.caption});wire([[packet.x+1,packet.y+32],[packet.x+281,packet.y+32]],C.edge);
  const unit=43;for(let i=0;i<2;i++){const field=COORD_FIELDS[i],y=packet.y+64+i*80,x=packet.x+90,group=sid('field-'+i),fill=sid('field-'+i+'-fill'),value=sid('field-'+i+'-value'),name=sid('field-'+i+'-name'),type=sid('field-'+i+'-type'),dividers=[];
    txt(after?field.qname:field.name,packet.x+18,y+20,18,C.active,'start',{id:name});box(x,y,4*unit,40,C.empty);box(x,y,0,40,C.active,null,{id:fill});
    for(let j=1;j<4;j++){const id=sid('field-'+i+'-divider-'+j);wire([[x+j*unit,y],[x+j*unit,y+40]],C.bg,{id,opacity:.55});dividers.push({id,position:j*unit});}
    out.push(`<g id="${group}" opacity="0">`);txt(after?String(quantize(field.value)):field.value.toFixed(5),x+(after?1:2)*unit,y+20,16,C.bg,'middle',{id:value,class:'sector-mono'});out.push('</g>');txt(after?'uint16 · 2B':'float · 4B',x,y+56,12,C.muted,'start',{id:type});packet.rows.push({x,y,fill,group,value,name,type,dividers,unit});}
  wire([[packet.x+1,packet.y+236],[packet.x+281,packet.y+236]],C.edge);txt('좌표',packet.x+18,packet.y+264,14,C.muted,'start');txt('8B',packet.x+268,packet.y+264,24,after?C.active:C.text,'end',{id:packet.total,class:'sector-mono'});
  const route=compact?[[server.x+168,server.y+49],[width-14,server.y+49],[width-14,packet.y+124],[packet.x+282,packet.y+124]]:[[server.x+168,server.y+49],[server.x+184,server.y+49],[server.x+184,packet.y+124],[packet.x,packet.y+124]];
  wire(route);contact(...route[0]);contact(...route.at(-1));
  txt(after?'×512 · 반올림':'좌표 그대로',compact?width/2:(server.x+168+packet.x)/2,compact?418:packet.y+42,12,C.muted,'middle');
  const carrier={group:sid('carrier'),x:compact?width/2:(server.x+168+packet.x)/2,y:compact?500:packet.y+124,rows:[],destination:[packet.rows[0].x+78,packet.y+124]};
  out.push(`<g id="${carrier.group}" opacity="0" data-role="pre-Msg-coordinate-values">`);
  for(let i=0;i<2;i++){const y=-60+i*80,fill=sid('carrier-'+i+'-fill'),value=sid('carrier-'+i+'-value'),name=sid('carrier-'+i+'-name'),dividers=[];
    box(-78,y,172,40,C.active,null,{id:fill});for(let j=1;j<4;j++){const id=sid('carrier-'+i+'-divider-'+j);wire([[-78+j*43,y],[-78+j*43,y+40]],C.bg,{id,opacity:.55});dividers.push({id,position:j*43});}
    txt(COORD_FIELDS[i].name,-100,y+20,14,C.active,'start',{id:name});txt(COORD_FIELDS[i].value.toFixed(5),8,y+20,16,C.bg,'middle',{id:value,class:'sector-mono'});carrier.rows.push({fill,value,name,dividers,y});
  }out.push('</g>');
  carrier.deliveryRoute=compact?[[carrier.x,carrier.y],[carrier.x,carrier.destination[1]],carrier.destination]:[[carrier.x,carrier.y],carrier.destination];
  return {width,height,compact,kind,side,markup:out.join(''),labels,bounds,paths,world,server,packet,route,carrier};
}
function routePoint(route,p){const lengths=route.slice(1).map((point,i)=>Math.hypot(point[0]-route[i][0],point[1]-route[i][1])),total=lengths.reduce((a,b)=>a+b,0);let remaining=total*Math.min(1,Math.max(0,p));for(let i=0;i<lengths.length;i++){if(remaining<=lengths[i]||i===lengths.length-1){const t=lengths[i]?remaining/lengths[i]:0;return [route[i][0]+(route[i+1][0]-route[i][0])*t,route[i][1]+(route[i+1][1]-route[i][1])*t];}remaining-=lengths[i];}return route[0];}
function applyFrame(scene,f,set){const w=scene.world,after=scene.side==='after',shrink=after?f.quantized:0,converted=shrink>=.5,transition=shrink>0&&shrink<1;
  set(w.hero,{transform:`translate(${w.x+28+56*f.movement} ${w.y+84}) scale(1.125)`,href:'#bundle-mage-'+scene.kind+'-'+(f.moving?'east':'south'),'data-facing':f.moving?'east':'south'});set(w.arrow,{opacity:f.moving?1:0});set(w.xValue,{},'x '+f.serverX.toFixed(5));set(w.yValue,{},'y '+f.serverY.toFixed(5));
  for(let i=0;i<2;i++){const row=scene.packet.rows[i],field=COORD_FIELDS[i],bytes=after?2:4,width=bytes*row.unit*f.filled;
    set(row.fill,{width});set(row.value,{x:row.x+bytes*row.unit/2},after?String(quantize(field.value)):field.value.toFixed(5));set(row.group,{opacity:f.filled>=.999?1:0});set(row.name,{opacity:f.phase==='deliver'?0:1},after?field.qname:field.name);
    set(row.type,{opacity:f.phase==='deliver'?0:1},after?'uint16 · 2B':'float · 4B');for(const divider of row.dividers)set(divider.id,{opacity:Math.max(0,Math.min(1,(width-divider.position)/12))*.55});
  }
  set(scene.packet.total,{opacity:f.filled>=.999?1:.38},after?'4B':'8B');for(const id of[scene.packet.heading,scene.packet.header,scene.packet.caption])set(id,{opacity:scene.compact&&f.phase==='deliver'?0:1});
  const carrier=scene.carrier,visible=['source-form','source-ready','quantize','quantized','deliver'].includes(f.phase),point=f.phase==='deliver'?routePoint(carrier.deliveryRoute,f.progress):[carrier.x,carrier.y],arrivalFade=f.phase==='deliver'?Math.max(0,Math.min(1,(1-f.progress)*6)):1;
  set(carrier.group,{opacity:visible?f.sourceForm*arrivalFade:0,transform:`translate(${point[0]} ${point[1]})`});
  for(let i=0;i<2;i++){const row=carrier.rows[i],field=COORD_FIELDS[i],bytes=4-2*shrink,width=bytes*43;
    set(row.fill,{width});set(row.name,{opacity:f.phase==='deliver'?0:1},converted?field.qname:field.name);
    set(row.value,{x:-78+bytes*43/2,opacity:transition?Math.abs(shrink*2-1):1},converted?String(quantize(field.value)):field.value.toFixed(5));
    for(const divider of row.dividers)set(divider.id,{opacity:Math.max(0,Math.min(1,(width-divider.position)/12))*.55});
  }
}
