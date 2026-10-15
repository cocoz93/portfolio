// Figure 5: sector-update wire representation only. Server coordinates remain float.
const QUANT_SCALE=512, ENTRY_BEFORE=14, ENTRY_AFTER=9, FIXED_PACKET_BYTES=6, BATCH_COUNT=100;
const EXAMPLE={id:17,startX:Math.fround(72.1257),x:Math.fround(73.1257),y:Math.fround(24.33333),direction:4,state:1};
function quantize(v){return Math.trunc(Math.fround(Math.fround(Math.max(0,Math.fround(v))*QUANT_SCALE)+.5));}
function dequantize(q){return q/QUANT_SCALE;}
function packDirState(direction,state){return (direction&15)|(state<<4);}
const REPRESENTATIONS={before:[{name:'ID',bytes:4,type:'int32',value:String(EXAMPLE.id)},{name:'x',bytes:4,type:'float',value:EXAMPLE.x.toFixed(5)},{name:'y',bytes:4,type:'float',value:EXAMPLE.y.toFixed(5)},{name:'방향·상태',bytes:2,type:'uint8 + uint8',value:'4  |  1'}],after:[{name:'ID',bytes:4,type:'int32',value:String(EXAMPLE.id)},{name:'qx',bytes:2,type:'uint16',value:String(quantize(EXAMPLE.x))},{name:'qy',bytes:2,type:'uint16',value:String(quantize(EXAMPLE.y))},{name:'방향·상태',bytes:1,type:'uint8',value:'0x'+packDirState(EXAMPLE.direction,EXAMPLE.state).toString(16)}]};
function createProgram(){
  function part(side){const segments=[];let end=0;const add=(phase,ms,row=-1)=>{segments.push({phase,row,start:end,end:end+ms});end+=ms;};
    add('idle',250);add('move',550);add('settle',200);add('input',350);add('encode',side==='after'?850:500);add('ready',250);add('output',350);
    for(let row=0;row<4;row++){add('write',400,row);add('hold',120,row);}add('done',850);return {side,segments,end};
  }const before=part('before'),after=part('after'),gap=650;return {before,after,gap,end:before.end+gap+after.end};
}
function partFrame(time,program){
  const clamp=p=>Math.min(1,Math.max(0,p)),ease=p=>p*p*(3-2*p);const f={phase:'idle',progress:0,row:-1,movement:0,encoded:0,fields:[0,0,0,0],moving:false,done:time>=program.end};
  for(const s of program.segments){if(time<s.start)break;const p=clamp((time-s.start)/(s.end-s.start));if(s.phase==='move')f.movement=ease(p);if(s.phase==='encode')f.encoded=ease(p);if(s.phase==='write')f.fields[s.row]=ease(p);if(time<s.end){f.phase=s.phase;f.progress=p;f.row=s.row;f.moving=s.phase==='move';break;}}
  if(f.done){f.phase='done';f.progress=1;f.row=-1;}f.serverX=Math.fround(EXAMPLE.startX+(EXAMPLE.x-EXAMPLE.startX)*f.movement);f.serverY=EXAMPLE.y;return f;
}
function comparisonFrame(time,program){const offset=program.before.end+program.gap,active=time<program.before.end?'before':time<offset?'transition':time<program.end?'after':'both',before=partFrame(Math.min(time,program.before.end),program.before),after=partFrame(Math.max(0,time-offset),program.after),f=active==='before'?before:after;
  const words={idle:'이동 준비',move:'A 오른쪽 이동 · 서버 좌표 갱신',settle:'틱 끝 · 최종 상태 읽기',input:'좌표 → 전송 표현',encode:active==='before'?'float 좌표 · 방향과 상태를 그대로 저장':'좌표는 반올림한 눈금 · 방향과 상태는 한 바이트',ready:'직렬화 준비',output:'전송 표현 → Msg',write:(REPRESENTATIONS[active==='before'?'before':'after'][f.row]?.name??'')+' 필드 저장',hold:'필드 저장 완료',done:'Msg 구성 완료'};
  return {active,before,after,phase:active==='both'?'완료 · 1명분 14B → 9B · 100명 묶음 1,406B → 906B':active==='transition'?'변경 후 비교 준비':(active==='before'?'변경 전 · ':'변경 후 · ')+words[f.phase]};
}
function createScene(width,side='after'){
  width=Math.max(320,Math.round(width));const compact=width<700,height=compact?1100:456,kind='quantization-'+side,after=side==='after';
  const C={bg:'var(--pcb-bg)',surface:'var(--pcb-surface)',edge:'var(--pcb-edge)',track:'var(--pcb-track)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',active:'var(--pcb-active)',empty:'var(--pcb-empty)',pin:'var(--pcb-pin)'};
  const out=[],labels=[],bounds=[],paths=[],sid=k=>kind+'-'+k,esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  function tag(name,attrs,body=''){out.push(`<${name} ${Object.entries(attrs).map(([k,v])=>`${k}="${esc(v)}"`).join(' ')}>${body}</${name}>`);}
  function box(x,y,w,h,fill=C.surface,stroke=null,attrs={}){tag('rect',{x,y,width:w,height:h,fill,...(stroke?{stroke,'stroke-width':1.5}:{}),...attrs});}
  function txt(text,x,y,size=14,color=C.text,anchor='middle',attrs={}){labels.push({text,x,y,size,anchor,local:attrs['data-local']==='true'});tag('text',{x,y,'font-size':size,'dominant-baseline':'middle','text-anchor':anchor,fill:color,...attrs},esc(text));}
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
  txt('① 캐릭터 좌표',world.x+84,66,14,C.muted);bounds.push({kind:'map',x:world.x,y:world.y,w:168,h:168});box(world.x,world.y,168,168,C.bg,C.edge);
  for(let i=1;i<3;i++){wire([[world.x+i*56,world.y],[world.x+i*56,world.y+168]],C.edge);wire([[world.x,world.y+i*56],[world.x+168,world.y+i*56]],C.edge);}
  for(let i=0;i<3;i++)txt(String(72+i),world.x+28+i*56,world.y-12,11,C.muted);
  out.push(`<g id="${world.arrow}" opacity="0">`);wire([[world.x+35,world.y+84],[world.x+77,world.y+84]],C.active);tag('polygon',{points:`${world.x+77},${world.y+84} ${world.x+72},${world.y+81} ${world.x+72},${world.y+87}`,fill:C.active});out.push('</g>');
  tag('use',{id:world.hero,href:'#bundle-mage-'+kind+'-south',transform:`translate(${world.x+28} ${world.y+84}) scale(1.125)`,'data-character':'mage','data-facing':'south'});
  const server={x:world.x,y:296,w:168,h:96};bounds.push({kind:'server-float',...server});box(server.x,server.y,server.w,server.h,C.surface,C.edge);txt('서버 내부 · float',server.x+84,server.y+16,12,C.muted);wire([[server.x+1,server.y+30],[server.x+167,server.y+30]],C.edge);
  txt('x '+EXAMPLE.x.toFixed(5),server.x+14,server.y+49,14,C.text,'start',{id:world.xValue,class:'sector-mono'});txt('y '+EXAMPLE.y.toFixed(5),server.x+14,server.y+75,14,C.text,'start',{id:world.yValue,class:'sector-mono'});
  const packet={x:compact?(width-282)/2:width-306,y:compact?744:106,w:282,h:286,rows:[],rim:sid('Msg-rim'),total:sid('entry-total')};
  const chip={x:compact?(width-136)/2:Math.round((world.x+168+packet.x)/2)-68,y:compact?440:150,w:136,h:196,rim:sid('encoder-rim'),mark:sid('ruler-mark'),trail:sid('ruler-trail'),bits:sid('bits'),bitLeft:sid('bits-left'),bitRight:sid('bits-right')};
  txt('② 전송 표현',chip.x+68,compact?412:66,14,C.muted);bounds.push({kind:'encoder',x:chip.x,y:chip.y,w:136,h:196});box(chip.x,chip.y,136,196,C.surface,C.edge,{id:chip.rim});
  for(const y of[24,52,144,172]){wire([[chip.x-5,chip.y+y],[chip.x,chip.y+y]],C.edge);wire([[chip.x+136,chip.y+y],[chip.x+141,chip.y+y]],C.edge);}
  txt(after?'눈금 변환':'원본 표현',chip.x+68,chip.y+18,14,C.text);wire([[chip.x+1,chip.y+34],[chip.x+135,chip.y+34]],C.edge);
  txt(after?'1/512 타일':'float × 2',chip.x+68,chip.y+53,14,C.muted);
  const centerQ=quantize(EXAMPLE.x),spacing=16,axisY=chip.y+96,axisX=chip.x+20;
  wire([[axisX,axisY],[axisX+96,axisY]],C.edge);for(let i=0;i<=6;i++)if(after)wire([[axisX+i*spacing,axisY-5],[axisX+i*spacing,axisY+5]],C.track);
  if(after){txt(String(centerQ),chip.x+68,chip.y+115,12,C.muted,'middle',{class:'sector-mono'});txt('×512 · 반올림',chip.x+68,chip.y+77,12,C.muted);}else txt('좌표 그대로',chip.x+68,chip.y+77,12,C.muted);
  tag('circle',{cx:axisX+48,cy:axisY,r:4,fill:'none',stroke:C.active,'stroke-width':1.5,id:chip.trail,opacity:0});tag('circle',{cx:axisX+48,cy:axisY,r:4,fill:C.active,id:chip.mark,opacity:0});
  txt(after?'이동 상태 · 방향':'방향 · 이동 상태',chip.x+68,chip.y+144,12,C.muted);
  const bitY=chip.y+162,bitX=chip.x+28;out.push(`<g id="${chip.bits}" opacity="0">`);box(bitX,bitY,80,20,C.active);wire([[bitX+40,bitY],[bitX+40,bitY+20]],C.bg);
  txt(after?'0001':'4',bitX+20,bitY+10,11,C.bg,'middle',{id:chip.bitLeft,class:'sector-mono'});txt(after?'0100':'1',bitX+60,bitY+10,11,C.bg,'middle',{id:chip.bitRight,class:'sector-mono'});out.push('</g>');
  txt(after?'4bit + 4bit':'1B + 1B',chip.x+68,chip.y+188,11,C.muted);
  if(after){txt('클라 복원 · ÷512',chip.x+68,chip.y+219,12,C.muted);txt('오차 약 0.001 타일',chip.x+68,chip.y+243,11,C.muted);}
  txt('③ Msg',packet.x+141,compact?716:66,14,C.muted);bounds.push({kind:'Msg',x:packet.x,y:packet.y,w:282,h:286});box(packet.x,packet.y,282,286,C.surface,C.edge,{id:packet.rim});txt('Msg',packet.x+12,packet.y+16,16,C.text,'start',{class:'sector-mono'});txt('Header 4B · count 2B',packet.x+270,packet.y+16,11,C.muted,'end');wire([[packet.x+1,packet.y+32],[packet.x+281,packet.y+32]],C.edge);
  const unit=43,fields=REPRESENTATIONS[side];for(let i=0;i<4;i++){const field=fields[i],y=packet.y+58+i*46,x=packet.x+90,w=field.bytes*unit,group=sid('field-'+i),fill=sid('field-'+i+'-fill'),value=sid('field-'+i+'-value');
    txt(field.name,packet.x+12,y+11,field.name.length>3?12:14,C.text,'start');box(x,y,4*unit,22,C.empty);box(x,y,0,22,C.active,null,{id:fill});for(let j=1;j<field.bytes;j++)wire([[x+j*unit,y],[x+j*unit,y+22]],C.bg,{opacity:.45});
    out.push(`<g id="${group}" opacity="0">`);txt(field.value,x+w/2,y+11,14,C.bg,'middle',{id:value,class:'sector-mono'});out.push('</g>');txt(field.type+' · '+field.bytes+'B',x,y+35,11,C.muted,'start');packet.rows.push({x,y,w,fill,group,value});}
  wire([[packet.x+1,packet.y+250],[packet.x+281,packet.y+250]],C.edge);txt('1명분',packet.x+12,packet.y+269,12,C.muted,'start');txt((after?ENTRY_AFTER:ENTRY_BEFORE)+'B',packet.x+268,packet.y+269,22,after?C.active:C.text,'end',{id:packet.total,class:'sector-mono'});
  txt('100명 묶음',packet.x+12,packet.y+316,12,C.muted,'start');txt((FIXED_PACKET_BYTES+BATCH_COUNT*(after?ENTRY_AFTER:ENTRY_BEFORE)).toLocaleString('en-US')+'B',packet.x+270,packet.y+316,18,after?C.active:C.text,'end',{class:'sector-mono'});
  const routes=compact?[[[server.x+168,server.y+70],[width-14,server.y+70],[width-14,chip.y+52],[chip.x+136,chip.y+52]],[[chip.x+136,chip.y+144],[width-14,chip.y+144],[width-14,packet.y+84],[packet.x+282,packet.y+84]]]:[[[world.x+168,world.y+84],[chip.x,world.y+84]],[[chip.x+136,world.y+84],[packet.x,world.y+84]]];
  for(const route of routes){wire(route);contact(...route[0]);contact(...route.at(-1));}
  const carrier=sid('carrier');out.push(`<g id="${carrier}" opacity="0">`);box(-6,-5,12,10,C.active);out.push('</g>');
  return {width,height,kind,side,markup:out.join(''),labels,bounds,paths,world,server,chip,packet,routes,carrier,axisX,axisY,centerQ};
}
function routePoint(route,p){const lengths=route.slice(1).map((point,i)=>Math.hypot(point[0]-route[i][0],point[1]-route[i][1])),total=lengths.reduce((a,b)=>a+b,0);let remaining=total*Math.min(1,Math.max(0,p));for(let i=0;i<lengths.length;i++){if(remaining<=lengths[i]||i===lengths.length-1){const t=lengths[i]?remaining/lengths[i]:0;return [route[i][0]+(route[i+1][0]-route[i][0])*t,route[i][1]+(route[i+1][1]-route[i][1])*t];}remaining-=lengths[i];}return route[0];}
function applyFrame(scene,f,set){const C={text:'var(--pcb-text)',muted:'var(--pcb-muted)',edge:'var(--pcb-edge)',active:'var(--pcb-active)'},after=scene.side==='after',w=scene.world,c=scene.chip;
  set(w.hero,{transform:`translate(${w.x+28+56*f.movement} ${w.y+84}) scale(1.125)`,href:'#bundle-mage-'+scene.kind+'-'+(f.moving?'east':'south'),'data-facing':f.moving?'east':'south'});set(w.arrow,{opacity:f.moving?1:0});set(w.xValue,{},'x '+f.serverX.toFixed(5));set(w.yValue,{},'y '+f.serverY.toFixed(5));
  set(c.rim,{stroke:f.phase==='encode'?C.active:C.edge});const raw=scene.axisX+48+(EXAMPLE.x*QUANT_SCALE-scene.centerQ)*16,rounded=scene.axisX+48,x=after?raw+(rounded-raw)*f.encoded:raw;
  set(c.mark,{cx:x,opacity:f.encoded>0||['ready','write','hold','done'].includes(f.phase)?1:0});set(c.trail,{cx:raw,opacity:after&&f.encoded>0?.6:0});set(c.bits,{opacity:f.encoded});
  for(let i=0;i<4;i++){const row=scene.packet.rows[i],p=f.fields[i];set(row.fill,{width:row.w*p});set(row.group,{opacity:p>=.999?1:0});}
  set(scene.packet.rim,{stroke:f.fields.some(p=>p>0)?C.active:C.edge});set(scene.packet.total,{opacity:f.fields.every(p=>p>=.999)?1:.38});
  const route=f.phase==='input'?scene.routes[0]:scene.routes[1],show=['input','output'].includes(f.phase),point=routePoint(route,f.progress);set(scene.carrier,{opacity:show?1:0,transform:`translate(${point[0]} ${point[1]})`});
}
