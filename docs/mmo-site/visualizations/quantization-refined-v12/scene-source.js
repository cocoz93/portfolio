// Figure 5 shows coordinate wire representation only, not whole packet size.
const QUANT_SCALE=512,COORD_BYTES_BEFORE=8,COORD_BYTES_AFTER=4;
const EXAMPLE={startX:Math.fround(72.1257),x:Math.fround(73.1257),y:Math.fround(24.33333)};
const COORD_FIELDS=[{name:'x',qname:'qx',value:EXAMPLE.x},{name:'y',qname:'qy',value:EXAMPLE.y}];
function quantize(v){return Math.trunc(Math.fround(Math.fround(Math.max(0,Math.fround(v))*QUANT_SCALE)+.5));}
function dequantize(q){return q/QUANT_SCALE;}
function createProgram(){
  function part(side){const segments=[];let end=0;const add=(phase,ms)=>{segments.push({phase,start:end,end:end+ms});end+=ms;};
    add('idle',250);add('move',550);add('settle',200);add('source-form',200);add('source-ready',550);
    if(side==='after'){add('quantize',850);add('quantized',650);}add('deliver',400);add('stored',1150);add('done',250);return {side,segments,end};
  }const before=part('before'),after=part('after'),gap=550;return {before,after,gap,end:before.end+gap+after.end};
}
function partFrame(time,program){
  const clamp=p=>Math.min(1,Math.max(0,p)),ease=p=>p*p*(3-2*p),f={phase:'idle',progress:0,movement:0,sourceForm:0,filled:0,quantized:0,moving:false,done:time>=program.end};
  // One transfer only. The arriving blocks become stored Msg data without refilling.
  for(const s of program.segments){if(time<s.start)break;const p=clamp((time-s.start)/(s.end-s.start));if(s.phase==='move')f.movement=ease(p);if(s.phase==='source-form')f.sourceForm=ease(p);if(s.phase==='quantize')f.quantized=ease(p);if(s.phase==='deliver'&&p===1)f.filled=1;if(time<s.end){f.phase=s.phase;f.progress=p;f.moving=s.phase==='move';break;}}
  if(f.done){f.phase='done';f.progress=1;}f.serverX=Math.fround(EXAMPLE.startX+(EXAMPLE.x-EXAMPLE.startX)*f.movement);f.serverY=EXAMPLE.y;return f;
}
function comparisonFrame(time,program){const offset=program.before.end+program.gap,active=time<program.before.end?'before':time<offset?'transition':time<program.end?'after':'both',before=partFrame(Math.min(time,program.before.end),program.before),after=partFrame(Math.max(0,time-offset),program.after),f=active==='before'?before:after;
  const words={idle:'이동 준비',move:'캐릭터 이동',settle:'최종 서버 좌표','source-form':'전송용 좌표 채움','source-ready':active==='before'?'float 좌표 그대로':'양자화 전 · 각각 4B',quantize:'양자화 · 4B → 2B',quantized:'양자화 완료',deliver:active==='before'?'float 좌표를 Msg에 기록':'눈금값을 Msg에 기록',stored:'Msg에 저장 완료',done:'좌표 표현 완료'};
  return {active,before,after,phase:active==='both'?'완료 · 좌표 8B → 4B':active==='transition'?'변경 후 비교 준비':(active==='before'?'변경 전 · ':'변경 후 · ')+words[f.phase]};
}
function routePoint(route,p){const lengths=route.slice(1).map((point,i)=>Math.hypot(point[0]-route[i][0],point[1]-route[i][1])),total=lengths.reduce((a,b)=>a+b,0);let remaining=total*Math.min(1,Math.max(0,p));for(let i=0;i<lengths.length;i++){if(remaining<=lengths[i]||i===lengths.length-1){const t=lengths[i]?remaining/lengths[i]:0;return [route[i][0]+(route[i+1][0]-route[i][0])*t,route[i][1]+(route[i+1][1]-route[i][1])*t];}remaining-=lengths[i];}return route[0];}
function createScene(width,side='after'){
  width=Math.max(320,Math.round(width));const compact=width<700,height=compact?1116:416,kind='quantization-pcb-'+side,after=side==='after';
  const C={bg:'var(--pcb-bg)',surface:'var(--pcb-surface)',edge:'var(--pcb-edge)',track:'var(--pcb-track)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',active:'var(--pcb-active)',empty:'var(--pcb-empty)',pin:'var(--pcb-pin)'};
  const out=[],labels=[],bounds=[],paths=[],sid=k=>kind+'-'+k,esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  function tag(name,attrs,body=''){out.push(`<${name} ${Object.entries(attrs).map(([k,v])=>`${k}="${esc(v)}"`).join(' ')}>${body}</${name}>`);}
  function box(x,y,w,h,fill=C.surface,stroke=null,attrs={}){tag('rect',{x,y,width:w,height:h,fill,...(stroke?{stroke,'stroke-width':1.5}:{}),...attrs});}
  function txt(text,x,y,size=14,color=C.text,anchor='middle',attrs={}){labels.push({text,x,y,size,anchor});tag('text',{x,y,'font-size':size,'dominant-baseline':'middle','text-anchor':anchor,fill:color,...attrs},esc(text));}
  function wire(points,color=C.track,attrs={}){for(let i=1;i<points.length;i++)if(points[i][0]!==points[i-1][0]&&points[i][1]!==points[i-1][1])throw Error('Non-orthogonal trace');paths.push(points);tag('path',{d:points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' '),fill:'none',stroke:color,'stroke-width':1.5,'stroke-linecap':'butt','stroke-linejoin':'miter',...attrs});}
  function housing(x,y,w,h){box(x,y,w,h,C.surface,C.edge);}
  /*CHARACTERS*/
  box(0,0,width,height,C.bg);mageDefinition();txt(after?'변경 후':'변경 전',24,28,14,after?C.active:C.muted,'start');
  const world={x:compact?(width-168)/2:24,y:106,size:168,cell:56,hero:sid('hero'),arrow:sid('arrow'),xValue:sid('server-x'),yValue:sid('server-y')};
  txt('캐릭터 이동',world.x+84,66,16,C.text);bounds.push({kind:'map',x:world.x,y:world.y,w:168,h:168});box(world.x,world.y,168,168,C.bg,C.edge);
  for(let i=1;i<3;i++){wire([[world.x+i*56,world.y],[world.x+i*56,world.y+168]],C.edge);wire([[world.x,world.y+i*56],[world.x+168,world.y+i*56]],C.edge);}
  out.push(`<g id="${world.arrow}" opacity="0">`);wire([[world.x+35,world.y+84],[world.x+77,world.y+84]],C.active);tag('polygon',{points:`${world.x+77},${world.y+84} ${world.x+72},${world.y+81} ${world.x+72},${world.y+87}`,fill:C.active});out.push('</g>');
  tag('use',{id:world.hero,href:'#bundle-mage-'+kind+'-south',transform:`translate(${world.x+28} ${world.y+84}) scale(1.125)`,'data-character':'mage','data-facing':'south'});
  const server={x:world.x,y:296,w:168,h:96};bounds.push({kind:'server-float',...server});housing(server.x,server.y,server.w,server.h);txt('서버 좌표 · float',server.x+84,server.y+16,12,C.muted);wire([[server.x+1,server.y+30],[server.x+167,server.y+30]],C.edge);
  txt('x '+EXAMPLE.x.toFixed(5),server.x+14,server.y+49,14,C.text,'start',{id:world.xValue,class:'sector-mono'});txt('y '+EXAMPLE.y.toFixed(5),server.x+14,server.y+75,14,C.text,'start',{id:world.yValue,class:'sector-mono'});
  const packet={x:compact?(width-282)/2:width-306,y:compact?806:106,w:282,h:286,rows:[],total:sid('coordinate-total'),heading:sid('Msg-heading'),header:sid('Msg-header'),caption:sid('Msg-caption')};
  const stageW=compact?240:Math.min(208,packet.x-server.x-server.w-32),stage={x:compact?(width-stageW)/2:(server.x+server.w+packet.x-stageW)/2,y:compact?448:106,w:stageW,h:286,rows:[],footer:sid('stage-footer'),error:sid('stage-error'),heading:sid('stage-heading'),header:sid('stage-header')};
  txt(after?'양자화':'좌표 그대로',stage.x+stage.w/2,compact?418:66,16,C.text,'middle',{id:stage.heading});
  bounds.push({kind:'quantization-stage',x:stage.x,y:stage.y,w:stage.w,h:stage.h});housing(stage.x,stage.y,stage.w,stage.h);
  txt(after?'×512 · 반올림':'float 좌표 유지',stage.x+stage.w/2,stage.y+24,14,C.text,'middle',{id:stage.header});wire([[stage.x+16,stage.y+48],[stage.x+stage.w-16,stage.y+48]],C.edge);
  const unit=Math.min(43,(stage.w-32)/4);
  for(let i=0;i<2;i++){const field=COORD_FIELDS[i],y=stage.y+80+i*80,x=stage.x+16,fill=sid('stage-'+i+'-fill'),value=sid('stage-'+i+'-value'),name=sid('stage-'+i+'-name'),type=sid('stage-'+i+'-type'),dividers=[];
    txt(field.name,x,y-14,14,C.text,'start',{id:name,class:'sector-mono'});txt(after?'4B → 2B':'4B',stage.x+stage.w-16,y-14,12,C.muted,'end',{id:type,class:'sector-mono'});
    box(x,y,4*unit,40,C.empty);box(x,y,0,40,C.active,null,{id:fill});for(let j=1;j<4;j++){const id=sid('stage-'+i+'-divider-'+j);wire([[x+j*unit,y],[x+j*unit,y+40]],C.bg,{id,opacity:0});dividers.push({id,position:j*unit});}
    txt(field.value.toFixed(5),x+2*unit,y+20,16,C.bg,'middle',{id:value,class:'sector-mono',opacity:0});stage.rows.push({x,y,unit,fill,value,name,type,dividers});
  }
  wire([[stage.x+16,stage.y+236],[stage.x+stage.w-16,stage.y+236]],C.edge);txt(after?'1/512타일 눈금':'변환 없음',stage.x+stage.w/2,stage.y+(after?252:264),12,C.muted,'middle',{id:stage.footer});
  txt(after?'오차 최대 약 ±0.001타일':'',stage.x+stage.w/2,stage.y+272,12,C.muted,'middle',{id:stage.error});
  txt('Msg',packet.x+141,compact?776:66,16,C.text,'middle',{id:packet.heading});bounds.push({kind:'Msg-coordinate-part',x:packet.x,y:packet.y,w:282,h:286});housing(packet.x,packet.y,282,286);
  txt('좌표 부분',packet.x+141,packet.y+24,14,C.muted,'middle',{id:packet.header});txt('',packet.x+266,packet.y+24,12,C.muted,'end',{id:packet.caption});wire([[packet.x+18,packet.y+48],[packet.x+264,packet.y+48]],C.edge);
  for(let i=0;i<2;i++){const field=COORD_FIELDS[i],y=packet.y+80+i*80,x=packet.x+18,fill=sid('field-'+i+'-fill'),value=sid('field-'+i+'-value'),name=sid('field-'+i+'-name'),type=sid('field-'+i+'-type'),bytes=sid('field-'+i+'-bytes'),dividers=[];
    txt(after?field.qname:field.name,x,y-14,14,C.text,'start',{id:name,class:'sector-mono'});txt(after?'uint16':'float',packet.x+266,y-14,12,C.muted,'end',{id:type,class:'sector-mono'});
    box(x,y,172,40,C.empty);box(x,y,0,40,C.active,null,{id:fill});for(let j=1;j<4;j++){const id=sid('field-'+i+'-divider-'+j);wire([[x+j*43,y],[x+j*43,y+40]],C.bg,{id,opacity:0});dividers.push({id,position:j*43});}
    txt(after?String(quantize(field.value)):field.value.toFixed(5),x+(after?1:2)*43,y+20,16,C.bg,'middle',{id:value,class:'sector-mono',opacity:0});
    txt(after?'2B':'4B',packet.x+266,y+20,24,C.text,'end',{id:bytes,class:'sector-mono',opacity:.35});packet.rows.push({x,y,unit:43,fill,value,name,type,bytes,dividers});
  }
  wire([[packet.x+18,packet.y+236],[packet.x+264,packet.y+236]],C.edge);txt('좌표 합계',packet.x+18,packet.y+264,12,C.muted,'start');txt(after?'4B':'8B',packet.x+266,packet.y+264,32,C.text,'end',{id:packet.total,class:'sector-mono',opacity:.35});
  const carrier={group:sid('carrier'),x:stage.rows[0].x,y:stage.rows[0].y,rows:[],destination:[packet.rows[0].x,packet.rows[0].y]};
  carrier.deliveryRoute=compact?[[carrier.x,carrier.y],[carrier.x,carrier.destination[1]],carrier.destination]:[[carrier.x,carrier.y],carrier.destination];
  out.push(`<g id="${carrier.group}" opacity="0" data-role="converted-coordinate-copy">`);
  for(let i=0;i<2;i++){const y=i*80,fill=sid('carrier-'+i+'-fill'),value=sid('carrier-'+i+'-value'),dividers=[];box(0,y,172,40,C.active,null,{id:fill});for(let j=1;j<4;j++){const id=sid('carrier-'+i+'-divider-'+j);wire([[j*43,y],[j*43,y+40]],C.bg,{id,opacity:0});dividers.push({id,index:j});}txt('',86,y+20,16,C.bg,'middle',{id:value,class:'sector-mono'});carrier.rows.push({fill,value,dividers});}out.push('</g>');
  return {width,height,compact,kind,side,markup:out.join(''),labels,bounds,paths,world,server,stage,packet,carrier};
}
function applyFrame(scene,f,set){
  const after=scene.side==='after',shrink=after?f.quantized:0,converted=shrink>=.5,transition=shrink>0&&shrink<1,w=scene.world,delivery=f.phase==='deliver',departed=delivery||f.filled===1;
  set(w.hero,{transform:`translate(${w.x+28+56*f.movement} ${w.y+84}) scale(1.125)`,href:'#bundle-mage-'+scene.kind+'-'+(f.moving?'east':'south'),'data-facing':f.moving?'east':'south'});set(w.arrow,{opacity:f.moving?1:0});set(w.xValue,{},'x '+f.serverX.toFixed(5));set(w.yValue,{},'y '+f.serverY.toFixed(5));
  // The flying blocks replace the source display; it stays empty after arrival.
  // This is a visual transfer, not deletion of server coordinates or local variables.
  const bytes=4-2*shrink;for(let i=0;i<2;i++){const row=scene.stage.rows[i],field=COORD_FIELDS[i],width=departed?0:bytes*row.unit*f.sourceForm,hide=scene.compact&&delivery;
    set(row.fill,{width,opacity:1});set(row.name,{opacity:hide?0:1},converted?field.qname:field.name);set(row.type,{opacity:hide?0:1});
    set(row.value,{x:row.x+bytes*row.unit/2,opacity:departed?0:f.sourceForm>=.999?(transition?Math.abs(shrink*2-1):1):0},converted?String(quantize(field.value)):field.value.toFixed(5));
    for(const d of row.dividers)set(d.id,{opacity:Math.max(0,Math.min(1,(width-d.position)/10))*.25});
  }
  for(const id of[scene.stage.footer,scene.stage.error])set(id,{opacity:scene.compact&&delivery?0:1});
  for(let i=0;i<2;i++){const row=scene.packet.rows[i],field=COORD_FIELDS[i],size=after?2:4,width=size*43*f.filled;
    set(row.fill,{width});set(row.value,{opacity:f.filled===1?1:0},after?String(quantize(field.value)):field.value.toFixed(5));for(const id of[row.name,row.type,row.bytes])set(id,{opacity:delivery?0:id===row.bytes?(f.filled===1?1:.35):1});
    for(const d of row.dividers)set(d.id,{opacity:Math.max(0,Math.min(1,(width-d.position)/10))*.25});
  }
  set(scene.packet.total,{opacity:f.filled===1?1:.35});for(const id of[scene.packet.heading,scene.packet.header,scene.packet.caption])set(id,{opacity:scene.compact&&delivery?0:1});
  const carrier=scene.carrier,point=delivery?routePoint(carrier.deliveryRoute,f.progress):[carrier.x,carrier.y];set(carrier.group,{opacity:delivery?1:0,transform:`translate(${point[0]} ${point[1]})`});
  for(let i=0;i<2;i++){const row=carrier.rows[i],field=COORD_FIELDS[i],size=after?2:4,unit=scene.stage.rows[i].unit+(43-scene.stage.rows[i].unit)*(delivery?f.progress:0);set(row.fill,{width:size*unit});set(row.value,{x:size*unit/2},after?String(quantize(field.value)):field.value.toFixed(5));for(const d of row.dividers)set(d.id,{d:`M${d.index*unit} ${i*80} L${d.index*unit} ${i*80+40}`,opacity:d.index<size?.25:0});}
}
