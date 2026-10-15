// Both variants already use move-dirty aggregation; Digest changes the enqueue grouping.
const ACTOR_START=[0,2];
const ACTOR_MOVES=[{from:[0,2],to:[0,1],facing:'north'},{from:[0,1],to:[1,1],facing:'east'}];
const AFTER_PACKETS=[{id:1,cell:3,slot:0,type:'채팅'},{id:2,cell:4,slot:0,type:'최종 이동'}];
const RECIPIENTS=[{id:'S1',sector:0,offset:24},{id:'S2',sector:0,offset:60},{id:'S3',sector:2,offset:42}];
const RECEIVE_SECTORS=[{cell:0,residents:[0,1]},{cell:2,residents:[2]}];
const AFTER_SCOPE=[0,1,2].map(rx=>Array.from({length:9},(_,i)=>i).filter(i=>Math.abs(i%3-rx)<=1&&Math.floor(i/3)<=1));
const AFTER_SELECTED=AFTER_SCOPE.map(cells=>AFTER_PACKETS.filter(p=>cells.includes(p.cell)).slice().sort((a,b)=>a.cell-b.cell||a.slot-b.slot));
function packetAction(packet){return packet.type==='채팅'?'채팅!':'최종 이동';}
function moveActor(frame,packet,progress){const eased=progress*progress*(3-2*progress);frame.move=eased;frame.player=packet.from.map((v,i)=>v+(packet.to[i]-v)*eased);}
function digestHeight(count){return 72+34*count;}
function newFrame(time,program){return {phase:'완료',step:'done',progress:1,player:ACTOR_START.slice(),move:0,dirty:false,tick:false,source:[0,0],generated:[0,0],joined:[0,0],queues:[[],[],[]],calls:[0,0,0],completed:[0,0,0],sectorCompleted:[0,0,0],builds:[0,0,0],rx:-1,q:-1,item:-1,action:-1,targets:0,moving:false,facing:'south',done:time>=program.end};}
function createAfterProgram(){
  const segments=[];let end=0;function add(phase,ms,rx=-1,item=-1,q=-1,action=-1,last=false){segments.push({phase,rx,item,q,action,last,start:end,end:end+ms});end+=ms;}
  add('idle',300);add('move',550,-1,-1,-1,0);add('settle',200,-1,-1,-1,0);
  add('born',450,-1,0);add('stored',400,-1,0);
  add('move',550,-1,-1,-1,1);add('settle',200,-1,-1,-1,1);
  add('tick-end',650);add('born',450,-1,1);add('stored',400,-1,1);add('outbox-ready',650);add('targets',650);
  for(const sector of RECEIVE_SECTORS){const rx=sector.cell;add('select',650,rx);for(let i=0;i<AFTER_SELECTED[rx].length;i++){add('concat',400,rx,i);add('joined',100,rx,i);}add('ready',250,rx);
    for(let i=0;i<sector.residents.length;i++){const q=sector.residents[i];add('deliver',350,rx,-1,q);add('hold',650,rx,-1,q,-1,i===sector.residents.length-1);}
    if(rx!==2)add('reset',350,rx);
  }
  add('cleanup',250,2);add('done',700,2);return {segments,end};
}
function afterFrame(time,program){
  const clamp=p=>Math.max(0,Math.min(1,p)),ease=p=>p*p*(3-2*p),f=newFrame(time,program);
  for(const s of program.segments){
    if(time<s.start)break;const progress=clamp((time-s.start)/(s.end-s.start)),complete=time>=s.end;
    if(s.phase==='move'){moveActor(f,ACTOR_MOVES[s.action],progress);f.dirty=true;}
    if(s.phase==='tick-end')f.tick=true;
    if(s.phase==='born'){f.source[s.item]=ease(progress);if(complete)f.generated[s.item]=1;if(s.item===1)f.dirty=false;}
    if(s.phase==='targets')f.targets=ease(progress);
    if(s.phase==='select'){f.rx=s.rx;f.joined=[0,0];}
    if(s.phase==='joined')f.joined[s.item]=ease(progress);
    if(s.phase==='ready')f.builds[s.rx]=1;
    if(s.phase==='deliver'&&complete){f.calls[s.q]=1;f.queues[s.q]=AFTER_SELECTED[s.rx].map(p=>p.id);}
    if(s.phase==='hold'){f.completed[s.q]=ease(progress);if(s.last)f.sectorCompleted[s.rx]=ease(progress);}
    if(s.phase==='reset')f.joined=Array.from({length:2},(_,i)=>i<AFTER_SELECTED[s.rx].length?1-ease(progress):0);
    if(s.phase==='cleanup')f.source=f.source.map(()=>1-ease(progress));
    if(!complete){f.step=s.phase;f.progress=progress;f.rx=s.rx>=0?s.rx:f.rx;f.q=s.q;f.item=s.item;f.action=s.action;f.moving=s.phase==='move';f.facing=f.moving?ACTOR_MOVES[s.action].facing:'south';
      const packet=s.item>=0?(['concat','joined'].includes(s.phase)?AFTER_SELECTED[s.rx][s.item]:AFTER_PACKETS[s.item]):null,label='섹터 '+(s.rx+1),recipient=s.q>=0?RECIPIENTS[s.q].id:'';
      const actions={idle:'왼쪽 맨 아래에서 시작',move:ACTOR_MOVES[s.action]?.facing==='north'?'A 위로 이동 · dirty 등록':'A 오른쪽 이동 · 최종 상태 갱신',settle:'이동 완료 · Msg 생성 대기',born:packet?.type==='채팅'?'A 채팅! · Msg 1 생성':'틱 끝 · 최종 이동 Msg 2 생성',stored:'Msg '+packet?.id+' 발생 섹터에 보관','tick-end':'틱 끝 · dirty A의 최종 이동 상태 읽기','outbox-ready':'발생 섹터별 Msg 보관 완료',targets:'주민이 있는 수신 섹터 순회',select:label+'의 유효범위에서 Msg 선택',concat:'Msg '+packet?.id+' → '+label+' Digest',joined:'Msg '+packet?.id+' 연접 완료',ready:label+' Digest 구성 1회 완료',deliver:label+' Digest → '+recipient+' SendQ · 1회 적재',hold:s.last?label+' 주민 적재 완료 · 회색 전환':recipient+' 완료 · 같은 Digest로 S2 적재',reset:'다음 수신 섹터용 임시버퍼 준비',cleanup:'모든 수신 섹터 완료 · 보관 Msg 해제',done:'같은 섹터 주민마다 한 번 적재 완료'};
      f.phase='변경 후 · '+actions[s.phase];break;
    }
  }
  if(f.done){f.step='done';f.item=-1;f.q=-1;}return f;
}
function afterPoint(points,progress){const distances=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1])),total=distances.reduce((a,b)=>a+b,0);let left=total*Math.max(0,Math.min(1,progress));for(let i=0;i<distances.length;i++){if(left<=distances[i]||i===distances.length-1){const p=distances[i]?left/distances[i]:0;return [points[i][0]+(points[i+1][0]-points[i][0])*p,points[i][1]+(points[i+1][1]-points[i][1])*p];}left-=distances[i];}return points[0];}
function afterTrace(points,progress){const length=points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-points[i][0],p[1]-points[i][1]),0);let left=length*Math.max(0,Math.min(1,progress)),out=[points[0]];for(let i=1;i<points.length;i++){const d=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);if(left>=d){out.push(points[i]);left-=d;}else{const t=d?left/d:0;out.push([points[i-1][0]+(points[i][0]-points[i-1][0])*t,points[i-1][1]+(points[i][1]-points[i-1][1])*t]);break;}}return out.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' ');}
function createAfterScene(width,variant='after'){
  width=Math.max(320,Math.round(width));const compact=width<700,height=compact?912:400,before=variant==='before',kind=before?'digest-before-matched':'digest-after-sector';
  const C={bg:'var(--pcb-bg)',surface:'var(--pcb-surface)',edge:'var(--pcb-edge)',track:'var(--pcb-track)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',active:'var(--pcb-active)',focus:'var(--pcb-data-focus)',soft:'var(--pcb-soft)',empty:'var(--pcb-empty)',pin:'var(--pcb-pin)',target:'var(--pcb-target)',done:'var(--pcb-done)'};
  const out=[],labels=[],bounds=[],paths=[],sid=k=>kind+'-'+k,esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  function tag(name,attrs,body=''){out.push(`<${name} ${Object.entries(attrs).map(([k,v])=>`${k}="${esc(v)}"`).join(' ')}>${body}</${name}>`);}
  function box(x,y,w,h,fill=C.surface,stroke=null,attrs={}){tag('rect',{x,y,width:w,height:h,fill,...(stroke?{stroke,'stroke-width':1.5}:{}),...attrs});}
  function txt(text,x,y,size=14,color=C.text,anchor='middle',attrs={}){labels.push({text,x,y,size,anchor,local:attrs['data-local']==='true'});tag('text',{x,y,'font-size':size,'dominant-baseline':'middle','text-anchor':anchor,fill:color,...attrs},esc(text));}
  function wire(points,color=C.track,attrs={}){for(let i=1;i<points.length;i++)if(points[i][0]!==points[i-1][0]&&points[i][1]!==points[i-1][1])throw Error('Non-orthogonal circuit');paths.push(points);tag('path',{d:points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' '),fill:'none',stroke:color,'stroke-width':1.5,...attrs});}
  function contact(x,y){tag('circle',{cx:x,cy:y,r:2.5,fill:C.pin});tag('circle',{cx:x,cy:y,r:1.05,fill:C.bg});}
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
  function swordsmanDefinition(){
    const palette={o:'var(--pcb-char-ink)',l:'var(--pcb-char-steel)',m:'var(--pcb-char-steel-mid)',d:'var(--pcb-char-steel-dark)',a:C.active,b:C.active,c:'var(--pcb-char-blue-mid)',v:'var(--pcb-char-blue-dark)',s:'var(--pcb-char-skin)',t:'var(--pcb-char-skin-dark)',h:'var(--pcb-char-hair)'};
    const grid=Array.from({length:36},()=>Array(32).fill(' '));
    function r(x,y,w,h,c){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(grid[yy]&&xx>=0&&xx<32)grid[yy][xx]=c;}
    function p(points,c){const xs=points.map(a=>a[0]),ys=points.map(a=>a[1]);for(let y=Math.min(...ys);y<Math.max(...ys);y++)for(let x=Math.min(...xs);x<Math.max(...xs);x++){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y+.5)!==(b[1]>y+.5)&&(x+.5)<(b[0]-a[0])*(y+.5-a[1])/(b[1]-a[1])+a[0])inside=!inside;}if(inside)r(x,y,1,1,c);}}
    p([[9,16],[23,16],[27,28],[23,32],[15,29],[9,32],[5,29]],'o');p([[10,17],[22,17],[25,28],[22,30],[15,27],[9,30],[7,28]],'v');r(8,20,2,7,'c');r(10,19,2,5,'b');r(23,23,1,5,'c');
    r(12,26,5,6,'o');r(19,26,5,6,'o');r(13,27,3,5,'d');r(20,27,3,5,'d');r(11,32,6,2,'o');r(18,32,6,2,'o');r(12,32,4,1,'m');r(19,32,4,1,'m');
    p([[10,17],[24,17],[27,20],[25,25],[23,26],[22,28],[12,28],[11,25],[8,23],[8,20]],'o');r(12,18,11,7,'d');r(13,18,8,5,'m');r(13,18,3,3,'l');r(12,24,11,2,'v');r(12,26,11,1,'d');r(17,24,2,2,'m');p([[9,18],[12,18],[13,21],[11,23],[9,22]],'m');r(9,18,3,1,'l');p([[22,18],[25,18],[26,21],[24,23],[22,21]],'m');r(22,18,3,1,'l');
    r(15,14,6,4,'o');r(16,15,4,3,'t');r(12,17,10,2,'b');r(13,17,5,1,'a');r(19,19,2,4,'c');
    p([[10,6],[13,3],[22,3],[25,6],[25,12],[23,16],[20,18],[14,17],[11,14],[9,11]],'o');p([[12,7],[22,7],[24,10],[22,15],[19,17],[14,16],[11,13]],'t');r(12,8,11,5,'s');r(14,13,7,3,'s');r(12,11,2,2,'t');r(22,11,1,2,'t');
    p([[11,4],[15,2],[16,3],[23,2],[22,4],[25,5],[26,8],[24,10],[22,8],[19,9],[19,6],[16,8],[13,7],[11,10],[9,9],[10,7]],'h');r(12,4,4,1,'d');r(17,4,6,1,'d');r(12,10,1,2,'h');r(23,9,1,3,'h');r(14,10,2,2,'o');r(20,10,2,2,'o');r(14,10,1,1,'l');r(20,10,1,1,'l');r(17,15,3,1,'t');
    p([[29,10],[31,13],[31,27],[29,28],[28,26],[28,13]],'o');r(29,13,1,14,'l');r(30,14,1,13,'m');r(26,28,7,2,'o');r(27,28,5,1,'m');r(29,30,2,4,'o');r(29,30,1,3,'d');r(24,23,3,3,'o');r(25,23,2,2,'m');
    out.push(`<defs><g id="bundle-swordsman-${kind}-south" shape-rendering="crispEdges">`);
    grid.forEach((row,y)=>{for(let x=0;x<32;){let end=x+1;while(end<32&&row[end]===row[x])end++;if(palette[row[x]])box(x-16,y-20,end-x,1,palette[row[x]]);x=end;}});
    out.push('</g></defs>');
  }
  function swordsman(x,y,size,actor){
    tag('use',{href:`#bundle-swordsman-${kind}-south`,transform:`translate(${x} ${y}) scale(${size/32})`,'data-character':'swordsman','data-facing':'south','data-actor':actor});
  }

  function mage(x,y,size=40,direction="south",actor=""){
    tag("use",{href:`#bundle-mage-${kind}-${direction}`,transform:`translate(${x} ${y}) scale(${size/32})`,"data-character":"mage","data-facing":direction,"data-actor":actor});
  }


  box(0,0,width,height,C.bg);mageDefinition();swordsmanDefinition();txt(before?'변경 전':'변경 후',24,28,12,before?C.muted:C.active,'start');
  const world={x:compact?(width-252)/2:24,y:92,size:252,cell:84,hero:sid('hero'),heroLabel:sid('hero-label'),arrow:sid('move-arrow'),northArrow:sid('north-arrow'),eastArrow:sid('east-arrow'),targets:[],cells:[],scope:sid('scope')};
  txt(before?'① 이동 · 채팅':'① 섹터별 Msg',world.x+126,64,14,C.muted,'middle',{id:sid('stage-1')});bounds.push({kind:'sector-map',x:world.x,y:world.y,w:252,h:252});box(world.x,world.y,252,252,C.bg,C.edge,{'data-role':'nine-sector-map','stroke-opacity':.45});
  for(let i=0;i<9;i++){const x=world.x+(i%3)*84,y=world.y+Math.floor(i/3)*84,id=sid('cell-'+i);box(x+1,y+1,82,82,C.bg,null,{'data-role':'sector-cell','data-sector':i});box(x+1,y+1,82,82,C.active,null,{id,opacity:0});world.cells.push({x,y,id});}
  for(let i=1;i<3;i++){wire([[world.x+i*84,world.y],[world.x+i*84,world.y+252]],C.edge,{opacity:.45});wire([[world.x,world.y+i*84],[world.x+252,world.y+i*84]],C.edge,{opacity:.45});}
  for(let j=0;j<3;j++){const x=world.x+j*84,y=world.y,fill=sid('target-'+j+'-fill'),rim=sid('target-'+j+'-rim'),doneFill=sid('target-'+j+'-done-fill'),doneRim=sid('target-'+j+'-done-rim');box(x+2,y+2,80,80,C.target,null,{id:fill,opacity:0});box(x+2,y+2,80,80,C.done,null,{id:doneFill,opacity:0});box(x+2,y+2,80,80,'none',C.target,{id:rim,opacity:0});box(x+2,y+2,80,80,'none',C.done,{id:doneRim,opacity:0});if(j!==1)txt('섹터 '+(j+1),x+42,y+15,12,C.muted);world.targets.push({x,y,fill,rim,doneFill,doneRim});}
  world.residents=RECIPIENTS.map((p,j)=>{const x=world.x+p.sector*84+p.offset,y=world.y,label=sid('resident-'+j+'-label');swordsman(x,y+44,30,p.id);txt(p.id,x,y+70,14,C.text,'middle',{id:label});return {x,y,label,sector:p.sector};});
  box(world.x,world.y,168,168,'none',C.active,{id:world.scope,opacity:0});
  out.push(`<g id="${world.arrow}" opacity="0"><g id="${world.northArrow}" opacity="0">`);wire([[world.x+42,world.y+187],[world.x+42,world.y+151]],C.active);tag('polygon',{points:`${world.x+42},${world.y+151} ${world.x+39},${world.y+156} ${world.x+45},${world.y+156}`,fill:C.active});out.push(`</g><g id="${world.eastArrow}" opacity="0">`);wire([[world.x+65,world.y+126],[world.x+101,world.y+126]],C.active);tag('polygon',{points:`${world.x+101},${world.y+126} ${world.x+96},${world.y+123} ${world.x+96},${world.y+129}`,fill:C.active});out.push('</g></g>');
  tag('use',{id:world.hero,href:'#bundle-mage-'+kind+'-south',transform:`translate(${world.x+42} ${world.y+210}) scale(1.125)`,'data-character':'mage','data-facing':'south'});txt('A',world.x+71,world.y+180,14,C.active,'middle',{id:world.heroLabel});
  // Msgs live in their source cells, not above the receiving players.
  const sourceMsgs=AFTER_PACKETS.map((p,i)=>{const cell=world.cells[p.cell],x=cell.x+6,y=cell.y+58,group=sid('source-'+i+'-Msg'),data=sid('source-'+i+'-data'),label=sid('source-'+i+'-label'),rim=sid('source-'+i+'-rim');out.push(`<g id="${group}" opacity="0" data-role="source-sector-Msg" data-source-sector="${p.cell}" data-msg-id="${p.id}">`);box(x,y,72,24,C.empty,C.edge,{id:rim});box(x+1,y+1,0,22,C.active,null,{id:data});txt('Msg '+p.id,x+36,y+12,14,C.bg,'middle',{id:label,class:'sector-mono'});out.push('</g>');bounds.push({kind:'source-Msg',x,y,w:72,h:24});return {x,y,w:72,h:24,group,data,label,rim};});
  world.note=sid('world-note');txt('이동 → dirty 등록',world.x+126,world.y+276,12,C.muted,'middle',{id:world.note});
  // Chat is emitted by A at its receive-time source sector.
  const event=sid('event'),eventLabel=sid('event-label'),eventPlate=sid('event-plate');out.push(`<g id="${event}" opacity="0" data-role="chat-action">`);box(-33,-13,66,26,C.active,null,{id:eventPlate});box(-1.5,13,3,5,C.active);txt('채팅!',0,0,14,C.bg,'middle',{'data-local':'true',id:eventLabel});out.push('</g>');
  const digest={x:compact?(width-176)/2:Math.round(width*.5)-42,y:(compact?432:114)+(before?56:0),w:176,h:before?96:digestHeight(AFTER_PACKETS.length),title:sid('digest-title'),rim:sid('digest-rim'),count:sid('digest-count'),rows:[]};
  txt(before?'② Msg':'② Digest',digest.x+88,compact?404:64,14,C.muted,'middle',{id:sid('stage-2')});box(digest.x,digest.y,176,digest.h,C.surface,C.edge,{id:digest.rim});box(digest.x+1,digest.y+1,174,27,C.muted,null,{opacity:.14});txt(before?'Msg':'Digest',digest.x+12,digest.y+15,16,C.text,'start',{id:digest.title,class:'sector-mono'});wire([[digest.x+1,digest.y+29],[digest.x+175,digest.y+29]],C.edge);bounds.push({kind:before?'Msg':'Digest',x:digest.x,y:digest.y,w:176,h:digest.h});
  for(let i=0;i<(before?1:AFTER_PACKETS.length);i++){const x=digest.x+10,y=digest.y+38+i*34,group=sid('digest-row-'+i),data=sid('digest-row-'+i+'-data'),label=sid('digest-row-'+i+'-label');out.push(`<g id="${group}" opacity="0">`);box(x,y,156,28,C.empty,C.edge);box(x+1,y+1,23,26,C.empty);txt('H',x+12,y+14,12,C.muted);box(x+25,y+1,0,26,C.active,null,{id:data});txt('Msg 1 · 이동',x+90,y+14,14,C.muted,'middle',{id:label});out.push('</g>');digest.rows.push({x,y,cy:y+14,group,data,label});}
  txt(before?'Msg 준비':'구성 대기',digest.x+88,digest.y+digest.h-14,12,C.muted,'middle',{id:digest.count});
  // Gathering uses a moving packet number and matching Msg emphasis, without a wire or trail.
  const gathers=AFTER_SELECTED.map(packets=>packets.map((p,i)=>{const source=sourceMsgs[AFTER_PACKETS.findIndex(v=>v.id===p.id)];return [[source.x+36,source.y+12],[digest.rows[before?0:i].x+33,digest.rows[before?0:i].cy]];}));
  const queues=[],routes=[],qx=compact?0:width-58,qr=compact?28:34;
  txt('③ SendQ',compact?width/2+18:qx,compact?704:64,14,C.muted,compact?'start':'middle',{id:sid('stage-3')});
  for(let j=0;j<3;j++){const cx=compact?width/2+(j-1)*90:qx,cy=compact?820:114+j*104,slots=[],numbers=[],rim=sid('queue-'+j+'-rim'),count=sid('queue-'+j+'-count');tag('circle',{cx,cy,r:qr,fill:C.empty});
    for(let k=0;k<8;k++){const a=-Math.PI/2+k*Math.PI/4+.025,b=a+Math.PI/4-.05,ri=qr*.55,polar=(r,t)=>[cx+r*Math.cos(t),cy+r*Math.sin(t)],p=polar(qr,a),q=polar(qr,b),s=polar(ri,b),t=polar(ri,a),id=sid('queue-'+j+'-slot-'+k);tag('path',{id,d:`M${p.join(' ')} A${qr} ${qr} 0 0 1 ${q.join(' ')} L${s.join(' ')} A${ri} ${ri} 0 0 0 ${t.join(' ')} Z`,fill:C.empty,stroke:C.edge,'stroke-width':1.5});slots.push(id);if(k<4){const point=polar(qr*.78,(a+b)/2),number=sid('queue-'+j+'-number-'+k);txt('1',...point,11,C.muted,'middle',{id:number,opacity:0});numbers.push(number);}}
    tag('circle',{id:rim,cx,cy,r:qr,fill:'none',stroke:C.active,'stroke-width':1.5,opacity:0});txt('S'+(j+1),cx,cy,16,C.text,'middle',{class:'sector-mono'});txt('적재 0회',cx,compact?cy+63:cy+48,12,C.muted,'middle',{id:count});bounds.push({kind:'ring',x:cx-qr-4,y:cy-qr-4,w:(qr+4)*2,h:(qr+4)*2});queues.push({cx,cy,qr,slots,numbers,rim,count});
    const outputY=digest.y+digest.h/2,bus=compact?748:Math.round((digest.x+176+cx-qr-4)/2);routes.push(compact?[[digest.x+88,digest.y+digest.h+4],[digest.x+88,bus],[cx,bus],[cx,cy-qr-4]]:[[digest.x+180,outputY],[bus,outputY],[bus,cy],[cx-qr-4,cy]]);
  }
  // SendQ delivery is shown by a moving copy of the payload, without a circuit bus.
  const trail=sid('trail'),carrier=sid('carrier'),carrierBox=sid('carrier-box'),carrierText=sid('carrier-text');tag('path',{id:trail,d:'M0 0',fill:'none',stroke:C.active,'stroke-width':1.5,opacity:0});out.push(`<g id="${carrier}" opacity="0">`);box(-8,-8,16,16,C.active,null,{id:carrierBox});txt('1',0,0,11,C.bg,'middle',{'data-local':'true',class:'sector-mono',id:carrierText});out.push('</g>');
  return {width,height,compact,kind,variant,markup:out.join('\n'),world,sourceMsgs,digest,queues,gathers,routes,trail,carrier,carrierBox,carrierText,event,eventLabel,eventPlate,labels,bounds,paths};
}
function applyAfterFrame(scene,f,set){
  const C={active:'var(--pcb-active)',soft:'var(--pcb-soft)',target:'var(--pcb-target)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',bg:'var(--pcb-bg)',empty:'var(--pcb-empty)',edge:'var(--pcb-edge)'},w=scene.world,d=scene.digest,before=scene.variant==='before',heroX=w.x+42+84*f.player[0],heroY=w.y+42+84*f.player[1];
  set(w.hero,{transform:`translate(${heroX} ${heroY}) scale(1.125)`,href:'#bundle-mage-'+scene.kind+'-'+f.facing,'data-facing':f.facing});set(w.heroLabel,{x:heroX+29,y:heroY-30});set(w.arrow,{opacity:f.moving?1:0});set(w.northArrow,{opacity:f.moving&&f.facing==='north'?1:0});set(w.eastArrow,{opacity:f.moving&&f.facing==='east'?1:0});
  set(w.note,{fill:f.dirty||f.tick?C.active:C.muted},f.tick?'틱 끝 · 최종 이동 Msg':f.dirty?'이동 → dirty 등록':'이동 · 채팅');
  const scoped=f.rx>=0,selected=scoped?AFTER_SELECTED[f.rx]:[],scope=scoped?AFTER_SCOPE[f.rx]:[],currentDone=scoped?f.sectorCompleted[f.rx]:0;
  for(let i=0;i<9;i++)set(w.cells[i].id,{opacity:scope.includes(i)&&!f.sectorCompleted[i]?.035*(1-currentDone):0});
  for(let j=0;j<3;j++){const target=w.targets[j],hasResidents=RECIPIENTS.some(p=>p.sector===j),valid=hasResidents&&(!before||AFTER_SELECTED[j].some(p=>p.id===AFTER_PACKETS[f.packet]?.id)),current=scoped&&j===f.rx,done=f.sectorCompleted[j],level=valid?f.targets:0;
    set(target.fill,{opacity:level*(current?.20:.075)*(1-done)});set(target.doneFill,{opacity:level*.12*done});set(target.rim,{opacity:level*(1-done)});set(target.doneRim,{opacity:level*done});
  }
  for(let q=0;q<3;q++)set(w.residents[q].label,{fill:f.completed[q]===1?C.muted:C.text});
  const left=f.rx===2?1:0;set(w.scope,{opacity:scoped?.32*(1-currentDone):0,x:w.x+left*84,width:168});
  for(let i=0;i<scene.sourceMsgs.length;i++){const msg=scene.sourceMsgs[i],p=AFTER_PACKETS[i],current=f.step==='concat'&&selected[f.item]?.id===p.id,level=f.source[i];set(msg.group,{opacity:level>0?1:0});set(msg.data,{width:70*level,fill:current?C.active:C.soft});set(msg.label,{fill:current?C.bg:C.text});set(msg.rim,{stroke:current?C.active:C.edge});}
  set(d.rim,{height:d.h});set(d.count,{y:d.y+d.h-14});
  for(let i=0;i<d.rows.length;i++){const row=d.rows[i],fill=f.joined[i],p=selected[i];set(row.group,{opacity:p&&fill>0?1:0});set(row.data,{width:130*fill});set(row.label,{fill:fill>.9?C.bg:C.text},p?'Msg '+p.id+' · '+packetAction(p):'');}
  const built=scoped&&selected.length>0&&f.joined.slice(0,selected.length).every(v=>v===1),count=f.joined.filter(v=>v===1).length;
  set(d.title,{},scoped?'Digest · 섹터 '+(f.rx+1):'Digest');set(d.rim,{stroke:built?C.active:C.edge});set(d.count,{fill:built?C.text:C.muted},scoped?(built?selected.length+' Msg · 구성 1회':'연접 '+count+' / '+selected.length):'구성 대기');
  for(let q=0;q<3;q++){const ring=scene.queues[q],ids=f.queues[q],current=f.q===q&&['deliver','hold'].includes(f.step);for(let k=0;k<8;k++){const filled=k<ids.length;set(ring.slots[k],{fill:filled?C.active:C.empty});if(k<4)set(ring.numbers[k],{opacity:filled?1:0,fill:C.bg},filled?String(ids[k]):'');}set(ring.rim,{opacity:current?1:0});set(ring.count,{fill:f.calls[q]?C.text:C.muted},'적재 '+f.calls[q]+'회');}
  set(scene.trail,{opacity:0});set(scene.carrier,{opacity:0});
  if(f.step==='concat'){const route=scene.gathers[f.rx][f.item],point=afterPoint(route,f.progress);set(scene.carrierBox,{x:-8,width:16});set(scene.carrierText,{},String(selected[f.item].id));set(scene.carrier,{opacity:1,transform:`translate(${point[0]} ${point[1]})`});}
  const chatting=['born','stored'].includes(f.step)&&AFTER_PACKETS[f.item]?.type==='채팅';set(scene.event,{opacity:chatting?1:0,transform:chatting?`translate(${heroX} ${heroY-31})`:''});set(w.heroLabel,{opacity:chatting?0:1});
  const stage=['deliver','hold','done','cleanup'].includes(f.step)?3:scoped?2:1;
  for(let i=1;i<=3;i++)set(scene.kind+'-stage-'+i,{fill:i===stage?C.active:C.muted});
}

// Digest OFF still aggregates movement at tick end; only chat enqueues immediately.
function createMatchedBeforeProgram(){
  const segments=[];let end=0;function add(phase,ms,item=-1,rx=-1,q=-1,action=-1,last=false){segments.push({phase,item,rx,q,action,last,start:end,end:end+ms});end+=ms;}
  function broadcast(item){add('born',450,item);add('stored',400,item);add('prepare',400,item);add('ready',280,item);add('targets',650,item);
    for(const sector of RECEIVE_SECTORS){if(!AFTER_SELECTED[sector.cell].some(p=>p.id===AFTER_PACKETS[item].id))continue;for(let i=0;i<sector.residents.length;i++){const q=sector.residents[i];add('select',300,item,sector.cell,q);add('deliver',350,item,sector.cell,q);add('hold',item===1?700:280,item,sector.cell,q,-1,item===1&&i===sector.residents.length-1);}}
    add('release',250,item);
  }
  add('idle',300);add('move',550,-1,-1,-1,0);add('settle',200,-1,-1,-1,0);broadcast(0);
  add('move',550,-1,-1,-1,1);add('settle',200,-1,-1,-1,1);add('tick-end',650);broadcast(1);add('done',700,1,2);return {segments,end};
}
function matchedBeforeFrame(time,program){
  const clamp=p=>Math.max(0,Math.min(1,p)),ease=p=>p*p*(3-2*p),f={...newFrame(time,program),packet:-1,buffer:0};
  for(const s of program.segments){
    if(time<s.start)break;const progress=clamp((time-s.start)/(s.end-s.start)),complete=time>=s.end;
    if(s.phase==='move'){moveActor(f,ACTOR_MOVES[s.action],progress);f.dirty=true;f.rx=-1;}
    if(s.phase==='tick-end'){f.tick=true;f.rx=-1;}
    if(s.phase==='born'){f.rx=-1;f.packet=s.item;f.buffer=0;f.source[s.item]=ease(progress);if(complete)f.generated[s.item]=1;if(s.item===1)f.dirty=false;}
    if(s.phase==='prepare'){f.buffer=ease(progress);f.source[s.item]=1-ease(progress);}
    if(s.phase==='ready')f.buffer=1;
    if(s.phase==='targets')f.targets=ease(progress);
    if(s.rx>=0)f.rx=s.rx;
    if(s.phase==='deliver'&&complete){f.queues[s.q].push(AFTER_PACKETS[s.item].id);f.calls[s.q]++;}
    if(s.phase==='hold'&&s.item===1){f.completed[s.q]=ease(progress);if(s.last)f.sectorCompleted[s.rx]=ease(progress);}
    if(s.phase==='release'){f.source[s.item]=0;f.buffer=1-ease(progress);}
    if(!complete){f.step=s.phase;f.progress=progress;f.item=s.item;f.q=s.q;f.action=s.action;f.moving=s.phase==='move';f.facing=f.moving?ACTOR_MOVES[s.action].facing:'south';
      const p=AFTER_PACKETS[s.item],recipient=s.q>=0?RECIPIENTS[s.q].id:'',labels={idle:'왼쪽 맨 아래에서 시작',move:ACTOR_MOVES[s.action]?.facing==='north'?'A 위로 이동 · dirty 등록':'A 오른쪽 이동 · 최종 상태 갱신',settle:'이동 완료 · Msg 생성 대기',born:p?.type==='채팅'?'A 채팅! · Msg 1 생성':'틱 끝 · 최종 이동 Msg 2 생성',stored:'Msg '+p?.id+' 준비',prepare:'Msg '+p?.id+' → 직렬화 버퍼',ready:'Msg '+p?.id+' 준비 완료',targets:'유효범위 주민 순회',select:recipient+' 순회',deliver:'Msg '+p?.id+' → '+recipient+' SendQ',hold:recipient+' · Msg '+p?.id+' 적재 완료',release:'수신자별 적재 완료 · Msg 해제','tick-end':'틱 끝 · dirty A의 최종 이동 상태 읽기',done:'같은 Msg를 개별 적재 완료'};
      f.phase='변경 전 · '+labels[s.phase];break;
    }
  }
  if(f.done){f.step='done';f.item=1;f.q=-1;}return f;
}
function applyMatchedBeforeFrame(scene,f,set){
  applyAfterFrame(scene,{...f,joined:[f.buffer,0]},set);
  const C={active:'var(--pcb-active)',edge:'var(--pcb-edge)',muted:'var(--pcb-muted)',text:'var(--pcb-text)',bg:'var(--pcb-bg)'},p=AFTER_PACKETS[f.packet],d=scene.digest,row=d.rows[0];
  set(d.title,{},p?'Msg '+p.id:'Msg');set(row.group,{opacity:p&&f.buffer>0?1:0});set(row.data,{width:130*f.buffer});set(row.label,{fill:f.buffer>.9?C.bg:C.text},p?'A '+packetAction(p):'');set(d.rim,{stroke:f.buffer===1?C.active:C.edge});set(d.count,{fill:C.muted},f.buffer>0?'Msg마다 개별 적재':'Msg 준비');
  if(f.step==='prepare'){const msg=scene.sourceMsgs[f.packet],route=[[msg.x+36,msg.y+12],[row.x+33,row.cy]],point=afterPoint(route,f.progress);set(scene.carrierBox,{x:-8,width:16});set(scene.carrierText,{},String(p.id));set(scene.carrier,{opacity:1,transform:`translate(${point[0]} ${point[1]})`});}
  const stage=['prepare','ready'].includes(f.step)?2:['select','deliver','hold','release','done'].includes(f.step)?3:1;
  for(let i=1;i<=3;i++)set(scene.kind+'-stage-'+i,{fill:i===stage?C.active:C.muted});
}
function createComparisonProgram(){const before=createMatchedBeforeProgram(),after=createAfterProgram(),gap=700;return {before,after,gap,end:before.end+gap+after.end};}
function comparisonFrame(time,program){
  const afterStart=program.before.end+program.gap,done=time>=program.end;
  return {before:matchedBeforeFrame(Math.min(time,program.before.end),program.before),after:afterFrame(Math.max(0,time-afterStart),program.after),active:done?'both':time<program.before.end?'before':time<afterStart?'transition':'after',phase:done?'완료 · 같은 Msg 유지 · S1·S2 적재 2회 → 1회':time<program.before.end?matchedBeforeFrame(time,program.before).phase:time<afterStart?'변경 전 완료 · 변경 후 비교':afterFrame(time-afterStart,program.after).phase};
}
function comparisonPanelWidth(width){return Math.max(320,Math.round(width));}

// Match the numbered Msg-to-Digest carrier: one Msg before, all Msgs together after.
// The complete source buffer remains visible; only this visual copy travels to SendQ.
function createCopyScene(width,side='after'){
  const scene=createAfterScene(width,side),before=side==='before',count=before?1:AFTER_PACKETS.length;
  const copy=scene.kind+'-payload-copy',copyFrame=scene.kind+'-payload-copy-frame',copyLabels=[],copyTiles=[];
  const tile=16,gap=4,padding=6,copyWidth=padding*2+count*tile+(count-1)*gap,copyHeight=28;
  const rows=scene.digest.rows;
  const copyRoutes=scene.queues.map((q,i)=>{const usedRows=rows.slice(0,before?1:AFTER_SELECTED[RECIPIENTS[i].sector].length),origin=[rows[0].x+90,usedRows.reduce((sum,row)=>sum+row.cy,0)/usedRows.length];return [origin,scene.compact?[q.cx,q.cy-q.qr+8]:[q.cx-q.qr+8,q.cy]];});
  const marks=[`<g id="${copy}" opacity="0" data-role="payload-copy" data-copy-count="${count}">`,
    `<rect id="${copyFrame}" x="${-copyWidth/2}" y="${-copyHeight/2}" width="${copyWidth}" height="${copyHeight}" fill="var(--pcb-surface)" stroke="var(--pcb-active)" stroke-width="1.5"></rect>`];
  for(let i=0;i<count;i++){
    const x=-copyWidth/2+padding+i*(tile+gap),tileId=copy+'-tile-'+i,labelId=copy+'-label-'+i;copyTiles.push(tileId);copyLabels.push(labelId);
    marks.push(`<rect id="${tileId}" x="${x}" y="-8" width="16" height="16" fill="var(--pcb-active)"></rect>`);
    marks.push(`<text id="${labelId}" x="${x+8}" y="0" font-size="11" dominant-baseline="middle" text-anchor="middle" fill="var(--pcb-bg)" class="sector-mono">${i+1}</text>`);
  }
  marks.push('</g>');
  return {...scene,copy,copyFrame,copyLabels,copyTiles,copyRoutes,copyWidth,copyHeight,markup:scene.markup+'\n'+marks.join('\n')};
}
function applyCopyAfterFrame(scene,f,set){applyAfterFrame(scene,f,set);applyPayloadCopy(scene,f,set);}
function applyCopyBeforeFrame(scene,f,set){applyMatchedBeforeFrame(scene,f,set);applyPayloadCopy(scene,f,set);}
function applyPayloadCopy(scene,f,set){
  // The old output carrier and its trail are hidden; gathering keeps its original marks.
  set(scene.trail,{opacity:0});set(scene.copy,{opacity:0});
  if(f.step!=='deliver')return;
  set(scene.carrier,{opacity:0});
  const ids=scene.variant==='before'?[AFTER_PACKETS[f.packet].id]:AFTER_SELECTED[f.rx].map(packet=>packet.id);
  const width=12+ids.length*16+(ids.length-1)*4;set(scene.copyFrame,{x:-width/2,width});
  for(let i=0;i<scene.copyLabels.length;i++){const x=-width/2+6+i*20,visible=i<ids.length;set(scene.copyTiles[i],{x,opacity:visible?1:0});set(scene.copyLabels[i],{x:x+8,opacity:visible?1:0},visible?String(ids[i]):'');}
  const point=afterPoint(scene.copyRoutes[f.q],f.progress);
  // Fade only while entering the queue. The enqueue and ring fill occur on arrival.
  const opacity=f.progress<=.8?1:Math.max(0,(1-f.progress)/.2);
  set(scene.copy,{opacity,transform:`translate(${point[0]} ${point[1]})`,'data-recipient':RECIPIENTS[f.q].id,'data-sector':f.rx,'data-copy-count':ids.length,'data-msg-ids':ids.join(',')});
}
