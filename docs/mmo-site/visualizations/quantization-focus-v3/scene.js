// Figure 5 focuses on the two coordinate fields. Other Msg fields are omitted.
const QUANT_SCALE=512,COORD_BYTES_BEFORE=8,COORD_BYTES_AFTER=4;
const EXAMPLE={startX:Math.fround(72.1257),x:Math.fround(73.1257),y:Math.fround(24.33333)};
function quantize(v){return Math.trunc(Math.fround(Math.fround(Math.max(0,Math.fround(v))*QUANT_SCALE)+.5));}
function dequantize(q){return q/QUANT_SCALE;}
const COORD_FIELDS=[{name:'x',qname:'qx',value:EXAMPLE.x},{name:'y',qname:'qy',value:EXAMPLE.y}];
function createProgram(){
  function part(side){const segments=[];let end=0;const add=(phase,ms)=>{segments.push({phase,start:end,end:end+ms});end+=ms;};
    add('idle',250);add('move',550);add('settle',200);add('deliver',400);add('preview',500);add('source-ready',550);
    if(side==='after'){add('quantize',850);add('quantized',1150);}add('done',650);return {side,segments,end};
  }const before=part('before'),after=part('after'),gap=550;return {before,after,gap,end:before.end+gap+after.end};
}
function partFrame(time,program){
  const clamp=p=>Math.min(1,Math.max(0,p)),ease=p=>p*p*(3-2*p),f={phase:'idle',progress:0,movement:0,filled:0,quantized:0,moving:false,done:time>=program.end};
  for(const s of program.segments){if(time<s.start)break;const p=clamp((time-s.start)/(s.end-s.start));if(s.phase==='move')f.movement=ease(p);if(s.phase==='preview')f.filled=ease(p);if(s.phase==='quantize')f.quantized=ease(p);if(time<s.end){f.phase=s.phase;f.progress=p;f.moving=s.phase==='move';break;}}
  if(f.done){f.phase='done';f.progress=1;}f.serverX=Math.fround(EXAMPLE.startX+(EXAMPLE.x-EXAMPLE.startX)*f.movement);f.serverY=EXAMPLE.y;return f;
}
function comparisonFrame(time,program){const offset=program.before.end+program.gap,active=time<program.before.end?'before':time<offset?'transition':time<program.end?'after':'both',before=partFrame(Math.min(time,program.before.end),program.before),after=partFrame(Math.max(0,time-offset),program.after),f=active==='before'?before:after;
  const words={idle:'이동 준비',move:'캐릭터 이동',settle:'최종 서버 좌표',deliver:'서버 좌표 → Msg',preview:'x·y 각각 4B', 'source-ready':active==='before'?'좌표 그대로 · 8B':'좌표를 눈금으로',quantize:'x·y 각각 4칸 → 2칸',quantized:'좌표 8B → 4B',done:'좌표 표현 완료'};
  return {active,before,after,phase:active==='both'?'완료 · 좌표 8B → 4B':active==='transition'?'변경 후 비교 준비':(active==='before'?'변경 전 · ':'변경 후 · ')+words[f.phase]};
}
function createScene(width,side='after'){
  width=Math.max(320,Math.round(width));const compact=width<700,height=compact?816:416,kind='quantization-focus-'+side,after=side==='after';
  const C={bg:'var(--pcb-bg)',surface:'var(--pcb-surface)',edge:'var(--pcb-edge)',track:'var(--pcb-track)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',active:'var(--pcb-active)',empty:'var(--pcb-empty)',pin:'var(--pcb-pin)'};
  const out=[],labels=[],bounds=[],paths=[],sid=k=>kind+'-'+k,esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  function tag(name,attrs,body=''){out.push(`<${name} ${Object.entries(attrs).map(([k,v])=>`${k}="${esc(v)}"`).join(' ')}>${body}</${name}>`);}
  function box(x,y,w,h,fill=C.surface,stroke=null,attrs={}){tag('rect',{x,y,width:w,height:h,fill,...(stroke?{stroke,'stroke-width':1.5}:{}),...attrs});}
  function txt(text,x,y,size=14,color=C.text,anchor='middle',attrs={}){labels.push({text,x,y,size,anchor});tag('text',{x,y,'font-size':size,'dominant-baseline':'middle','text-anchor':anchor,fill:color,...attrs},esc(text));}
  function wire(points,color=C.track,attrs={}){for(let i=1;i<points.length;i++)if(points[i][0]!==points[i-1][0]&&points[i][1]!==points[i-1][1])throw Error('Non-orthogonal trace');paths.push(points);tag('path',{d:points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' '),fill:'none',stroke:color,'stroke-width':1.5,...attrs});}
  function contact(x,y){tag('circle',{cx:x,cy:y,r:2.5,fill:C.pin});tag('circle',{cx:x,cy:y,r:1,fill:C.bg});}
    function mageDefinition(){
    const palette={o:"var(--pcb-char-ink)",l:"var(--pcb-char-steel)",m:"var(--pcb-char-steel)",d:"var(--pcb-char-steel-dark)",a:C.active,b:C.active,c:"var(--pcb-char-blue-mid)",v:"var(--pcb-char-blue-dark)",s:"var(--pcb-char-skin)",t:"var(--pcb-char-skin-dark)"};
    const pixels=["                                ","                   oooo         ","                  occvo         ","                 occvvo         ","                occcvoo         ","    oo         occcvvo          ","   oooo       occcvvvo          ","  ooacoo     occcvvvvv          ","  oalacoo    occcvvvvao         ","  oalaaco   occcvvvvaaao        ","  ocaacco   occcvvvvvavvo       ","  occccoo  occcvvvvvvvvvo       ","   occoo oobbbbbbbbbbbbbboooo   ","    oooooocccccccccccccccccco   ","    ooo oooooooooooooooooooooo  ","    omo    ooosssssssstoo       ","    omo    ooosoossssoooo       ","    ddo    ooottttttttto        ","    omo     omlmttmmmllm        ","    omo     ommlldddlllmo       ","    omo   oooomlllmmllmooo      ","    omoocccooomlllllllmvooo     ","    omssccccovmmllllllmvcco     ","    omssccccovcmlllllmmocco     ","    omooccooovcmmlllmmvoccoo    ","    omooooooovccmmlmmvvooss     ","    omo  ooooccccmmbavvvoo      ","    omo   oovbccccvbavvvvoo     ","    omo   oovbccccvbavvvvoo     ","    omo  oovvbccccvbavvvvvoo    ","    omo  oovcbccccvbavvvvvoo    ","    omo oovccccccccccccccccoo   ","    omo oooddddddddddddddddo    ","    omo  oooooooooooooooooo     ","    ooo     ddddo    odddd      ","                                "];
    const south=pixels.slice();
    south[33]="    omo   oooooooo  ooooooo";
    south[34]="    ooo    ddddo    oddddoo";
    south[35]="                    oddddo";
    const north=pixels.slice();
    const back=[
      "    omo     oovvvvvvvvvo",
      "    omo     oovvvvvvvvvo",
      "    ddo     ooovvvvvvooo",
      "    omo      ovvvvcccvo",
      "    omo     oovvvvcccvvo",
      "    omo   oooovvvvcccvvooo",
      "    omoocccooovvvvccccvvooo",
      "    omssccccovvvvcccccvccto",
      "    omssccccovvvvcccccvccto",
      "    omooccooovvvvcccccvocoo",
      "    omooooooovvvvcccccvvooss",
      "    omo  oooovvvvcccccvvvoo",
      "    omo   oovbvvvcccccvvvvoo",
      "    omo   oovbvvvcccccvvvvoo",
      "    omo  oovvbvvvcccccvvvvvoo",
      "    omo  oovcbvvvcccccvvvvvoo",
      "    omo oovccvvvvccccccccccoo",
      "    omo oooddddddddddddddddo",
      "    omo  oooooooo  ooooooooo",
      "    ooo    ddddo    oddddoo",
      "                    oddddo"
    ];
    back.forEach((row,i)=>north[15+i]=row.padEnd(32," "));
    const east=[
      "",
      "                    oooo",
      "                   occvo",
      "                  occvvo",
      "                 occcvoo",
      "                occcvvo",
      "               occcvvvo",
      "              occcvvvvo",
      "             occcvvvvao",
      "             occcvvvaao",
      "            occcvvvavvo",
      "            occcvvvvvvo",
      "          oobbbbbbbbbbboooo",
      "         occcccccccccccccco",
      "          oooooooooooooooo",
      "             oovossssto",
      "             oovossoosto",
      "             oovottttttso",
      "             oovomllmttto",
      "              oomllllmmo",
      "             oovvmllllmo     oo",
      "            oovvccmlllmo    oaco",
      "            ovvcccmllmo    oalaco",
      "           oovvcccmmlmoo   occco",
      "           ovvcccccmvcsso   omo",
      "           ovvcccccvvcsssoo omo",
      "           ovvccccvvvoccoo omo",
      "          oovvccccvvvvo    omo",
      "          ovvcccccavvvo    omo",
      "         oovvcccccavvvvo   omo",
      "         ovvccccccavvvvo   omo",
      "        oovvccccccavvvvvo  omo",
      "        oodddddddddddddoo  omo",
      "         oooooooo ooooooo  omo",
      "         oddddo    oddddoo ooo",
      "                   oddddo"
    ].map(row=>row.padEnd(32," ").slice(0,32));
    const views={south,north,east,west:east.map(row=>row.split("").reverse().join(""))};
    out.push("<defs>");
    for(const [direction,rows] of Object.entries(views)){
      out.push(`<g id="bundle-mage-${kind}-${direction}" shape-rendering="crispEdges">`);
      rows.forEach((row,y)=>{
        for(let x=0;x<32;){
          let end=x+1;while(end<32&&row[end]===row[x])end++;
          if(palette[row[x]])box(x-16,y-20,end-x,1,palette[row[x]]);
          x=end;
        }
      });
      out.push("</g>");
    }
    out.push("</defs>");
  }

  box(0,0,width,height,C.bg);mageDefinition();txt(after?'변경 후':'변경 전',24,28,12,after?C.active:C.muted,'start');
  const world={x:compact?(width-168)/2:24,y:106,size:168,cell:56,hero:sid('hero'),arrow:sid('arrow'),xValue:sid('server-x'),yValue:sid('server-y')};
  txt('캐릭터 이동',world.x+84,66,14,C.muted);bounds.push({kind:'map',x:world.x,y:world.y,w:168,h:168});box(world.x,world.y,168,168,C.bg,C.edge);
  for(let i=1;i<3;i++){wire([[world.x+i*56,world.y],[world.x+i*56,world.y+168]],C.edge);wire([[world.x,world.y+i*56],[world.x+168,world.y+i*56]],C.edge);}
  out.push(`<g id="${world.arrow}" opacity="0">`);wire([[world.x+35,world.y+84],[world.x+77,world.y+84]],C.active);tag('polygon',{points:`${world.x+77},${world.y+84} ${world.x+72},${world.y+81} ${world.x+72},${world.y+87}`,fill:C.active});out.push('</g>');
  tag('use',{id:world.hero,href:'#bundle-mage-'+kind+'-south',transform:`translate(${world.x+28} ${world.y+84}) scale(1.125)`,'data-character':'mage','data-facing':'south'});
  const server={x:world.x,y:296,w:168,h:96};bounds.push({kind:'server-float',...server});box(server.x,server.y,server.w,server.h,C.surface,C.edge);txt('서버 좌표 · float',server.x+84,server.y+16,12,C.muted);wire([[server.x+1,server.y+30],[server.x+167,server.y+30]],C.edge);
  txt('x '+EXAMPLE.x.toFixed(5),server.x+14,server.y+49,14,C.text,'start',{id:world.xValue,class:'sector-mono'});txt('y '+EXAMPLE.y.toFixed(5),server.x+14,server.y+75,14,C.text,'start',{id:world.yValue,class:'sector-mono'});
  const packet={x:compact?(width-282)/2:width-306,y:compact?492:106,w:282,h:286,rows:[],total:sid('coordinate-total')};
  txt('Msg',packet.x+141,compact?462:66,14,C.muted);bounds.push({kind:'Msg-coordinate-part',x:packet.x,y:packet.y,w:282,h:286});box(packet.x,packet.y,282,286,C.surface,C.edge);txt('Msg',packet.x+12,packet.y+16,16,C.text,'start',{class:'sector-mono'});txt('좌표 부분',packet.x+270,packet.y+16,12,C.muted,'end');wire([[packet.x+1,packet.y+32],[packet.x+281,packet.y+32]],C.edge);
  const unit=43;for(let i=0;i<2;i++){const field=COORD_FIELDS[i],y=packet.y+64+i*80,x=packet.x+90,group=sid('field-'+i),fill=sid('field-'+i+'-fill'),value=sid('field-'+i+'-value'),name=sid('field-'+i+'-name'),type=sid('field-'+i+'-type'),dividers=[];
    txt(field.name,packet.x+18,y+20,18,C.active,'start',{id:name});box(x,y,4*unit,40,C.empty);box(x,y,0,40,C.active,null,{id:fill});
    for(let j=1;j<4;j++){const id=sid('field-'+i+'-divider-'+j);wire([[x+j*unit,y],[x+j*unit,y+40]],C.bg,{id,opacity:.55});dividers.push({id,position:j*unit});}
    out.push(`<g id="${group}" opacity="0">`);txt(field.value.toFixed(5),x+2*unit,y+20,16,C.bg,'middle',{id:value,class:'sector-mono'});out.push('</g>');txt('float · 4B',x,y+56,12,C.muted,'start',{id:type});packet.rows.push({x,y,fill,group,value,name,type,dividers,unit});}
  wire([[packet.x+1,packet.y+236],[packet.x+281,packet.y+236]],C.edge);txt('좌표',packet.x+18,packet.y+264,14,C.muted,'start');txt('8B',packet.x+268,packet.y+264,24,after?C.active:C.text,'end',{id:packet.total,class:'sector-mono'});
  const route=compact?[[server.x+168,server.y+49],[width-14,server.y+49],[width-14,packet.y+238],[packet.x+282,packet.y+238]]:[[server.x+168,server.y+49],[packet.x,server.y+49]];
  wire(route);contact(...route[0]);contact(...route.at(-1));
  txt(after?'1/512타일 눈금으로':'좌표 그대로',compact?width/2:(server.x+168+packet.x)/2,compact?430:server.y+27,12,C.muted,'middle');
  const carrier=sid('carrier');out.push(`<g id="${carrier}" opacity="0">`);box(-6,-5,12,10,C.active);out.push('</g>');
  return {width,height,kind,side,markup:out.join(''),labels,bounds,paths,world,server,packet,route,carrier};
}
function routePoint(route,p){const lengths=route.slice(1).map((point,i)=>Math.hypot(point[0]-route[i][0],point[1]-route[i][1])),total=lengths.reduce((a,b)=>a+b,0);let remaining=total*Math.min(1,Math.max(0,p));for(let i=0;i<lengths.length;i++){if(remaining<=lengths[i]||i===lengths.length-1){const t=lengths[i]?remaining/lengths[i]:0;return [route[i][0]+(route[i+1][0]-route[i][0])*t,route[i][1]+(route[i+1][1]-route[i][1])*t];}remaining-=lengths[i];}return route[0];}
function applyFrame(scene,f,set){const w=scene.world,after=scene.side==='after',shrink=after?f.quantized:0,converted=shrink>=.5,transition=shrink>0&&shrink<1;
  set(w.hero,{transform:`translate(${w.x+28+56*f.movement} ${w.y+84}) scale(1.125)`,href:'#bundle-mage-'+scene.kind+'-'+(f.moving?'east':'south'),'data-facing':f.moving?'east':'south'});set(w.arrow,{opacity:f.moving?1:0});set(w.xValue,{},'x '+f.serverX.toFixed(5));set(w.yValue,{},'y '+f.serverY.toFixed(5));
  for(let i=0;i<2;i++){const row=scene.packet.rows[i],field=COORD_FIELDS[i],bytes=4-2*shrink,width=bytes*row.unit*f.filled;
    set(row.fill,{width});set(row.value,{x:row.x+bytes*row.unit/2},converted?String(quantize(field.value)):field.value.toFixed(5));set(row.group,{opacity:f.filled>=.999?(transition?Math.abs(shrink*2-1):1):0});set(row.name,{},converted?field.qname:field.name);
    set(row.type,{},transition?'4B → 2B':converted?'uint16 · 2B':'float · 4B');for(const divider of row.dividers)set(divider.id,{opacity:Math.max(0,Math.min(1,(width-divider.position)/12))*.55});
  }
  set(scene.packet.total,{opacity:f.filled>=.999?1:.38},transition?'8 → 4B':shrink>=1?'4B':'8B');
  const point=routePoint(scene.route,f.progress);set(scene.carrier,{opacity:f.phase==='deliver'?1:0,transform:`translate(${point[0]} ${point[1]})`});
}
