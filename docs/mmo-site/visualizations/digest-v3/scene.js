// The example contains seven packets. R sees nine of the sixteen sectors,
// including four nonempty sectors with five packets in total.
const DIGEST_PACKETS=[
  {id:1,cell:0,slot:0,type:'이동'},
  {id:2,cell:2,slot:0,type:'채팅'},
  {id:3,cell:2,slot:1,type:'채팅'},
  {id:4,cell:5,slot:0,type:'이동'},
  {id:5,cell:8,slot:0,type:'이동'},
  {id:6,cell:3,slot:0,type:'채팅'},
  {id:7,cell:15,slot:0,type:'이동'}
];
const DIGEST_VALID_CELLS=Array.from({length:16},(_,i)=>i).filter(i=>Math.abs(i%4-1)<=1&&Math.abs(Math.floor(i/4)-1)<=1);
const DIGEST_SELECTED=DIGEST_PACKETS.filter(p=>DIGEST_VALID_CELLS.includes(p.cell));
function createDigestProgram(){
  const segments=[];let end=0;
  function add(row,phase,ms,item=-1,recipient=-1){const duration=ms/(row===0?1.25:1);segments.push({row,phase,item,recipient,start:end,end:end+duration});end+=duration;}
  for(let item=0;item<5;item++)for(let recipient=0;recipient<2;recipient++){add(0,'deliver',500,item,recipient);add(0,'hold',500,item,recipient);}
  add(0,'done',400);
  for(let item=0;item<7;item++){add(1,'born',250,item);add(1,'store',550,item);add(1,'stored',180,item);}
  add(1,'select',850);
  for(let item=0;item<5;item++){add(1,'concat',450,item);add(1,'joined',150,item);}
  add(1,'digest-ready',850);
  for(let recipient=0;recipient<2;recipient++){add(1,'deliver',750,-1,recipient);add(1,'hold',850,-1,recipient);}
  add(1,'done',600);add(2,'restore',400);
  return {segments,end};
}
function digestFrame(time,program){
  const clamp=v=>Math.max(0,Math.min(1,v)),rows=[0,1].map(()=>({pending:Array(7).fill(0),joined:Array(5).fill(0),queues:[Array(5).fill(0),Array(5).fill(0)],calls:[0,0],activeItem:-1,recipient:-1,phase:'idle',progress:0,stage:0,scope:false}));let current=null;
  for(const s of program.segments){
    if(time<s.start)break;const progress=clamp((time-s.start)/(s.end-s.start)),complete=time>=s.end;
    if(s.row<2){const r=rows[s.row];
      if(s.phase==='store'&&complete)r.pending[s.item]=1;
      if(s.phase==='select')r.scope=true;
      if(s.phase==='concat')r.joined[s.item]=progress;
      if(s.phase==='deliver'&&complete){r.calls[s.recipient]++;if(s.row===0)r.queues[s.recipient][s.item]=1;else r.queues[s.recipient]=Array(5).fill(1);}
    }
    if(!complete){current={...s,progress};break;}
  }
  if(current&&current.row<2){const r=rows[current.row];r.phase=current.phase;r.progress=current.progress;r.activeItem=current.item;r.recipient=current.recipient;
    if(current.row===1)r.stage=['born','store','stored'].includes(current.phase)?1:['select','concat','joined','digest-ready'].includes(current.phase)?2:3;
  }
  const done=time>=program.end,activeRow=done?-1:current?.row??-1;let phase='완료 · 섹터별 보관 → R의 유효범위 선택·연접 → 주민별 1회 적재';
  if(current&&current.row<2){const who=current.row===0?'변경 전':'변경 후',p=current.item>=0?(current.phase==='concat'||current.phase==='joined'?DIGEST_SELECTED[current.item]:DIGEST_PACKETS[current.item]):null,item=p?'Msg '+p.id:'Digest R',recipient=current.recipient>=0?'S'+(current.recipient+1):'';
    const actions={born:'① '+item+' 발생',store:'① '+item+'를 발생 섹터에 보관',stored:'① '+item+' 보관 완료',select:'② R의 유효섹터 9칸 선택',concat:'② '+item+' 바이트 연접',joined:'② '+item+' 연접 완료','digest-ready':'② Digest R 하나 완성',deliver:(current.row===1?'③ ':'')+recipient+' SendQ에 '+item+' 적재',hold:(current.row===1?'③ ':'')+recipient+' 적재 완료',done:'완료'};phase=who+' · '+actions[current.phase];
  }else if(!done)phase='전·후 결과 비교';
  return {rows,current,done,activeRow,phase};
}
function digestPoint(points,progress){
  const distances=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1])),total=distances.reduce((a,b)=>a+b,0);let left=total*Math.max(0,Math.min(1,progress));
  for(let i=0;i<distances.length;i++){if(left<=distances[i]||i===distances.length-1){const t=distances[i]?left/distances[i]:0;return [points[i][0]+(points[i+1][0]-points[i][0])*t,points[i][1]+(points[i+1][1]-points[i][1])*t];}left-=distances[i];}return points[0];
}
function createDigestScene(width){
  width=Math.max(320,Math.round(width));const compact=width<700,beforeHeight=compact?472:320,afterHeight=compact?1100:490,height=beforeHeight+afterHeight+52,kind='digest-four';
  const C={bg:'var(--pcb-bg)',surface:'var(--pcb-surface)',edge:'var(--pcb-edge)',track:'var(--pcb-track)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',active:'var(--pcb-active)',empty:'var(--pcb-empty)',pin:'var(--pcb-pin)'};
  const out=[],labels=[],bounds=[],rows=[],paths=[],sid=k=>kind+'-'+k;
  const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  function tag(name,attrs,body=''){out.push(`<${name} ${Object.entries(attrs).map(([k,v])=>`${k}="${esc(v)}"`).join(' ')}>${body}</${name}>`);}
  function box(x,y,w,h,fill=C.surface,stroke=null,attrs={}){tag('rect',{x,y,width:w,height:h,fill,...(stroke?{stroke,'stroke-width':1.5}:{}),...attrs});}
  function txt(text,x,y,size=14,color=C.text,anchor='middle',attrs={}){labels.push({text,x,y,size,anchor,local:attrs['data-local']==='true'});tag('text',{x,y,'font-size':size,'dominant-baseline':'middle','text-anchor':anchor,fill:color,...attrs},esc(text));}
  function wire(points,color=C.track,attrs={}){for(let i=1;i<points.length;i++)if(points[i][0]!==points[i-1][0]&&points[i][1]!==points[i-1][1])throw Error('Non-orthogonal circuit');paths.push(points);tag('path',{d:points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' '),fill:'none',stroke:color,'stroke-width':1.5,...attrs});}
  function contact(x,y){tag('circle',{cx:x,cy:y,r:2.5,fill:C.pin});tag('circle',{cx:x,cy:y,r:1.05,fill:C.bg});}
  function arrow(points){wire(points,C.track,{opacity:.75});const[x,y]=points.at(-1),[px,py]=points.at(-2),dx=Math.sign(x-px),dy=Math.sign(y-py);tag('polygon',{points:`${x},${y} ${x-dx*6-dy*3},${y-dy*6+dx*3} ${x-dx*6+dy*3},${y-dy*6-dx*3}`,fill:C.track});}
  function packet(x,y,w,h,p,key,filled=false){
    const data=sid(key+'-data'),label=sid(key+'-text'),rim=sid(key+'-rim'),group=sid(key+'-group');out.push(`<g id="${group}">`);box(x,y,w,h,C.surface,C.edge);box(x+1,y+1,25,h-2,C.empty);txt('H',x+13,y+h/2,11,C.muted);
    box(x+27,y+1,filled?w-28:0,h-2,C.active,null,{id:data});txt(p.id+' · '+p.type,x+27+(w-28)/2,y+h/2,12,filled?C.bg:C.muted,'middle',{id:label});box(x,y,w,h,'none',C.active,{id:rim,opacity:0});out.push('</g>');return {group,data,label,rim,width:w-28,x,y,w,h};
  }
  function traveler(meta){out.push(`<g id="${meta.traveler}" opacity="0">`);box(-23,-8,46,16,C.active);txt('Msg 1',0,0,11,C.bg,'middle',{id:meta.travelerText,'class':'sector-mono','data-local':'true'});out.push('</g>');}
  function residents(meta,group,centers,after=false){
    box(group.x,group.y,group.w,group.h,'none',C.track,{id:meta.recipientGroup});bounds.push({kind:'residents',...group});
    txt(compact?'수신 섹터 R · 같은 주민':'섹터 R',compact?group.x+group.w/2:group.x+34,group.y+16,12,C.text);
    centers.forEach(([cx,cy],j)=>{
      const qkey=meta.key+'-queue-'+j,count=sid(qkey+'-count'),radius=34;
      if(compact&&after)swordsman(cx,group.y+50,28,meta.key+'-resident-'+j);else if(!compact){swordsman(group.x+32,cy-26,28,meta.key+'-resident-'+j);txt('S'+(j+1),group.x+32,cy+31,12,C.muted);}
      tag('circle',{cx,cy,r:radius,fill:C.empty,stroke:C.edge,'stroke-width':1.5});const slots=[];
      for(let i=0;i<8;i++){
        const a=-Math.PI/2+i*Math.PI/4+.025,b=a+Math.PI/4-.05,inner=radius-14,p=(r,t)=>[cx+r*Math.cos(t),cy+r*Math.sin(t)],p1=p(radius,a),p2=p(radius,b),p3=p(inner,b),p4=p(inner,a),d=`M${p1.join(' ')} A${radius} ${radius} 0 0 1 ${p2.join(' ')} L${p3.join(' ')} A${inner} ${inner} 0 0 0 ${p4.join(' ')} Z`,id=sid(qkey+'-slot-'+i);
        tag('path',{id,d,fill:C.empty,stroke:C.edge,'stroke-width':1.5});slots.push(id);
        if(i<5){const pt=p(radius-7,(a+b)/2);txt(String(i+1),pt[0],pt[1],11,C.muted,'middle',{id:sid(qkey+'-number-'+i)});}
      }
      txt('S'+(j+1),cx,cy,14,C.text,'middle',{'class':'sector-mono'});
      txt('SendQ',cx,compact?cy+47:cy-radius-14,12,C.muted);txt('적재 0회',cx,compact?cy+65:cy+radius+14,12,C.muted,'middle',{id:count});
      meta.queue.push({slots,count,key:qkey,cx,cy,radius});bounds.push({kind:'ring',x:cx-radius,y:cy-radius,w:radius*2,h:radius*2});
    });
  }
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
    tag("use",{href:`#bundle-mage-${kind}-${direction}`,transform:`translate(${x} ${y}) scale(${size/32})`,id:sid(actor+'-character'),"data-character":"mage","data-facing":direction,"data-actor":actor});
  }


  box(0,0,width,height,C.bg);swordsmanDefinition();
  // BEFORE: same five packets, one RequestSendMsg for every packet-resident pair.
  const before={key:'before',group:sid('before'),packets:[],queue:[],requests:[],traveler:sid('before-traveler'),travelerText:sid('before-traveler-text'),recipientGroup:sid('before-residents')};rows.push(before);out.push(`<g id="${before.group}">`);
  txt('변경 전',24,28,13,C.muted,'start');
  const bpx=compact?(width-160)/2:24,bpy=84,bpw=160,bph=26,bcenters=compact?[[width/2-72,350],[width/2+72,350]]:[[width-64,124],[width-64,236]],bg={x:compact?24:width-192,y:compact?264:62,w:compact?width-48:168,h:compact?174:232};
  txt('R에 보낼 5패킷',bpx+80,64,13,C.muted);if(!compact)txt('패킷마다 반복 적재',width*.49,64,13,C.muted);
  for(let i=0;i<5;i++){
    const py=bpy+i*32,cy=py+13;before.packets.push(packet(bpx,py,bpw,bph,DIGEST_SELECTED[i],'before-packet-'+i,true));before.requests[i]=[];
    for(let j=0;j<2;j++){
      const[cx,qcy]=bcenters[j],end=compact?[cx,qcy-34]:[cx-34,qcy],bus=compact?24:bg.x-26;
      const p=compact?[[bpx-5,cy],[bus,cy],[bus,306],[cx,306],end]:[[bpx+bpw+5,cy],[bus,cy],[bus,qcy],end];before.requests[i].push(p);
    }
    wire(compact?[[bpx-5,cy],[24,cy]]:[[bpx+bpw+5,cy],[bg.x-26,cy]],C.track,{opacity:.7});
  }
  wire(compact?[[24,bpy+13],[24,306],[bcenters[1][0],306]]:[[bg.x-26,bpy+13],[bg.x-26,bcenters[1][1]]],C.track);
  bcenters.forEach(([cx,cy])=>arrow(compact?[[cx,306],[cx,cy-34]]:[[bg.x-26,cy],[cx-34,cy]]));residents(before,bg,bcenters);
  if(!compact)txt('패킷 × 주민 수만큼 요청',width*.49,270,12,C.muted);traveler(before);out.push('</g>');wire([[24,beforeHeight],[width-24,beforeHeight]],C.edge);
  // AFTER: storage, spatial selection + concatenation, then one Copy per resident.
  const oy=beforeHeight,grid={x:compact?(width-216)/2:24,y:oy+164,size:216,cell:54},px=compact?(width-144)/2:Math.round(width*.48)-72,digestTop=oy+(compact?526:174),rowTop=digestTop+33;
  const rg={x:compact?24:width-192,y:oy+(compact?852:166),w:compact?width-48:168,h:compact?226:252},acenters=compact?[[width/2-72,oy+974],[width/2+72,oy+974]]:[[width-64,oy+244],[width-64,oy+356]];
  const after={key:'after',group:sid('after'),grid,source:[],sectors:[],validCells:DIGEST_VALID_CELLS,selection:sid('selection'),scopeCells:[],packets:[],queue:[],store:[],concat:[],deliveries:[],generator:{x:grid.x+56,y:oy+92,w:104,h:32,label:sid('generator-label'),data:sid('generator-data')},stageLabels:[1,2,3].map(i=>sid('stage-'+i)),digestFrame:sid('digest-frame'),digestCount:sid('digest-count'),traveler:sid('after-traveler'),travelerText:sid('after-traveler-text'),recipientGroup:sid('after-residents'),stageGroups:[1,2,3].map(i=>sid('stage-group-'+i))};rows.push(after);out.push(`<g id="${after.group}">`);
  txt('변경 후',24,oy+28,13,C.active,'start');
  txt('① 섹터별 보관',grid.x+108,oy+50,14,C.text,'middle',{id:after.stageLabels[0]});
  txt('② 유효범위 선택 · 연접',px+72,oy+(compact?480:50),14,C.text,'middle',{id:after.stageLabels[1]});
  txt('③ 주민별 1회 적재',rg.x+rg.w/2,oy+(compact?824:50),14,C.text,'middle',{id:after.stageLabels[2]});
  out.push(`<g id="${after.stageGroups[0]}">`);
  const gen=after.generator;txt('이동 · 채팅',gen.x+52,oy+79,12,C.muted);box(gen.x,gen.y,gen.w,gen.h,C.surface,C.edge);box(gen.x+1,gen.y+1,25,30,C.empty);txt('H',gen.x+13,gen.y+16,11,C.muted);box(gen.x+27,gen.y+1,0,30,C.active,null,{id:gen.data});txt('패킷 발생',gen.x+65,gen.y+16,12,C.muted,'middle',{id:gen.label});
  arrow([[gen.x+52,gen.y+36],[gen.x+52,grid.y-5]]);
  box(grid.x,grid.y,216,216,C.bg,C.track);bounds.push({kind:'grid',x:grid.x,y:grid.y,w:216,h:216});
  for(let i=0;i<16;i++){
    const x=grid.x+(i%4)*54,y=grid.y+Math.floor(i/4)*54,highlight=sid('cell-'+i);box(x,y,54,54,i===5?C.surface:C.bg,C.edge);box(x+1,y+1,52,52,C.active,null,{id:highlight,opacity:0});after.sectors.push({x,y,highlight});
    const named={0:'A',2:'B',3:'X',5:'R',8:'C',15:'Y'};if(named[i])txt(named[i],x+27,y+9,11,i===5?C.active:C.muted);
    if(i===5)box(x+2,y+2,50,50,'none',C.active);
    if(DIGEST_VALID_CELLS.includes(i))after.scopeCells.push(highlight);
  }
  DIGEST_PACKETS.forEach((p,index)=>{
    const cell=after.sectors[p.cell],x=cell.x+5,y=cell.y+18+p.slot*16,id=sid('pending-'+p.id),label=sid('pending-label-'+p.id),mini=sid('pending-group-'+p.id);
    out.push(`<g id="${mini}">`);box(x,y,44,13,C.surface,C.edge);box(x+1,y+1,7,11,C.empty);txt('H',x+4.5,y+6.5,11,C.muted);box(x+9,y+1,0,11,C.active,null,{id});txt('Msg '+p.id,x+26,y+6.5,11,C.muted,'middle',{id:label,'class':'sector-mono'});out.push('</g>');
    after.source.push({data:id,label,group:mini,width:34,packet:p,x,y,w:44,h:13});
    const cx=x+22,cy=y+6.5,edgeX=cell.x+52;
    after.store.push([[gen.x+52,gen.y+32],[gen.x+52,grid.y-18],[edgeX,grid.y-18],[edgeX,cy],[cx,cy]]);
  });
  box(grid.x-3,grid.y-3,168,168,'none',C.track,{id:after.selection,opacity:0});txt('R · 유효 9칸',grid.x+4,oy+151,12,C.muted,'start',{id:sid('selection-label'),opacity:0});
  txt('섹터마다 패킷 보관',grid.x+108,oy+406,12,C.muted);txt('범위 밖 Msg 6·7은 제외',grid.x+108,oy+425,12,C.muted,'middle',{id:sid('excluded-caption'),opacity:0});
  out.push('</g>');
  out.push(`<g id="${after.stageGroups[1]}">`);
  box(px-8,digestTop,160,212,C.bg,C.edge,{id:after.digestFrame});txt('Digest · raw',px+72,digestTop+15,14,C.text,'middle',{'class':'sector-mono'});wire([[px-7,digestTop+29],[px+151,digestTop+29]],C.edge);
  bounds.push({kind:'digest',x:px-8,y:digestTop,w:160,h:212});
  const trunk=compact?width-24:grid.x+236;
  const selectedPort=[grid.x+165,grid.y+81];
  wire([selectedPort,[trunk,selectedPort[1]]],C.track,{opacity:.65});contact(selectedPort[0],selectedPort[1]);
  wire([[trunk,Math.min(selectedPort[1],rowTop+15)],[trunk,Math.max(selectedPort[1],rowTop+4*32+15)]],C.track,{opacity:.65});
  for(let i=0;i<5;i++){
    const p=DIGEST_SELECTED[i],source=after.source[DIGEST_PACKETS.findIndex(v=>v.id===p.id)],cell=after.sectors[p.cell],cy=rowTop+i*32+15,busY=cell.y+50,cx=source.x+22;
    after.packets.push(packet(px,rowTop+i*32,144,30,p,'after-packet-'+i));
    const dest=compact?[px+152,cy]:[px-8,cy],points=[[cx,source.y+6.5],[cx,busY],[selectedPort[0],busY],selectedPort,[trunk,selectedPort[1]],[trunk,cy],dest];after.concat.push(points);
    wire([[trunk,cy],dest],C.edge,{opacity:.6});contact(dest[0],dest[1]);
  }
  txt('구성 대기',px+72,digestTop+202,12,C.muted,'middle',{id:after.digestCount});txt(compact?'원본 바이트':'기존 헤더·데이터 유지',compact?px+86:px+72,compact?digestTop+242:oy+452,12,C.muted,compact?'start':'middle');
  out.push('</g>');
  out.push(`<g id="${after.stageGroups[2]}">`);residents(after,rg,acenters,true);out.push('</g>');
  for(let j=0;j<2;j++){
    const[cx,cy]=acenters[j],end=compact?[cx,cy-34]:[cx-34,cy],path=compact?[[px+72,digestTop+212],[width-24,digestTop+212],[width-24,oy+934],[cx,oy+934],end]:[[px+72,digestTop+212],[px+72,oy+438],[rg.x-24,oy+438],[rg.x-24,cy],end];after.deliveries.push(path);arrow(path);
  }
  traveler(after);out.push('</g>');wire([[24,beforeHeight+afterHeight],[width-24,beforeHeight+afterHeight]],C.edge);
  txt('A/B · 4,000세션 · 적재 요청 18만 → 4천 회/tick',width/2,height-25,12,C.muted);
  return {width,height,compact,beforeHeight,afterHeight,markup:out.join('\n'),rows,labels,bounds,paths};
}
function applyDigestFrame(scene,frame,set){
  const ease=p=>p*p*(3-2*p),before=scene.rows[0],after=scene.rows[1];
  for(let index=0;index<2;index++){
    const r=frame.rows[index],m=scene.rows[index],active=frame.activeRow===index,dim=frame.activeRow>=0&&frame.activeRow<2&&!active;set(m.group,{opacity:dim?.27:1,style:dim?'filter:grayscale(1)':'filter:none'});
    for(let i=0;i<5;i++){
      const p=m.packets[i],fill=index===0?1:r.joined[i],pulse=active&&(r.activeItem===i||index===1&&r.joined.every(v=>v===1));set(p.group,{opacity:fill>0?1:0});set(p.data,{width:p.width*ease(fill)});set(p.label,{fill:fill>.55?'var(--pcb-bg)':'var(--pcb-muted)'});set(p.rim,{opacity:pulse&&fill>0?1:0});
    }
    set(m.recipientGroup,{stroke:active&&r.recipient>=0?'var(--pcb-active)':'var(--pcb-track)'});
    for(let j=0;j<2;j++){
      const q=m.queue[j];set(q.count,{fill:r.calls[j]?'var(--pcb-text)':'var(--pcb-muted)'},'적재 '+r.calls[j]+'회');
      for(let i=0;i<8;i++){const filled=i<5&&r.queues[j][i]===1;set(q.slots[i],{fill:filled?'var(--pcb-active)':'var(--pcb-empty)'});if(i<5)set('digest-four-'+q.key+'-number-'+i,{fill:filled?'var(--pcb-bg)':'var(--pcb-muted)'});}
    }
    let points=null,progress=0,label='';
    if(active&&index===0&&r.phase==='deliver'){points=before.requests[r.activeItem][r.recipient];progress=r.progress;label='Msg '+DIGEST_SELECTED[r.activeItem].id;}
    if(active&&index===1&&r.phase==='store'){points=after.store[r.activeItem];progress=r.progress;label='Msg '+DIGEST_PACKETS[r.activeItem].id;}
    if(active&&index===1&&r.phase==='concat'){points=after.concat[r.activeItem];progress=r.progress;label='Msg '+DIGEST_SELECTED[r.activeItem].id;}
    if(active&&index===1&&r.phase==='deliver'){points=after.deliveries[r.recipient];progress=r.progress;label='Digest';}
    if(points){const pt=digestPoint(points,progress);set(m.traveler,{opacity:1,transform:`translate(${pt[0]} ${pt[1]})`});set(m.travelerText,{},label);}else set(m.traveler,{opacity:0});
  }
  const r=frame.rows[1],active=frame.activeRow===1,scope=r.scope;
  for(let i=0;i<7;i++){
    const s=after.source[i],selected=DIGEST_SELECTED.some(p=>p.id===s.packet.id),filled=r.pending[i]===1;set(s.data,{width:filled?s.width:0,fill:scope&&!selected?'var(--pcb-track)':'var(--pcb-active)'});set(s.label,{fill:filled?'var(--pcb-bg)':'var(--pcb-muted)'});set(s.group,{opacity:filled?(scope&&!selected?.45:1):0});
  }
  after.sectors.forEach((cell,i)=>{let opacity=scope&&DIGEST_VALID_CELLS.includes(i)?.08:0;if(active&&r.stage===1&&r.activeItem>=0&&DIGEST_PACKETS[r.activeItem].cell===i)opacity=.25;if(active&&r.stage===2&&r.activeItem>=0&&DIGEST_SELECTED[r.activeItem]?.cell===i)opacity=.25;set(cell.highlight,{opacity});});
  set(after.selection,{opacity:scope?1:0,stroke:'var(--pcb-active)'});set('digest-four-selection-label',{opacity:scope?1:0,fill:'var(--pcb-active)'});set('digest-four-excluded-caption',{opacity:scope?1:0});
  for(let stage=1;stage<=3;stage++){
    const isCurrent=active&&r.stage===stage,future=active&&r.stage<stage;set(after.stageLabels[stage-1],{fill:isCurrent?'var(--pcb-active)':'var(--pcb-text)'});set(after.stageGroups[stage-1],{opacity:future?.38:1});
  }
  const generatorActive=active&&['born','store','stored'].includes(r.phase),p=generatorActive?DIGEST_PACKETS[r.activeItem]:null,fill=p?(r.phase==='born'?ease(r.progress):1):0;
  set(after.generator.data,{width:76*fill});set(after.generator.label,{fill:fill>.55?'var(--pcb-bg)':'var(--pcb-muted)'},p?'Msg '+p.id+' '+p.type:'패킷 발생');
  const count=r.joined.filter(v=>v===1).length;set(after.digestFrame,{stroke:count===5?'var(--pcb-active)':'var(--pcb-edge)'});set(after.digestCount,{fill:count===5?'var(--pcb-text)':'var(--pcb-muted)'},count===5?'5패킷 · 구성 1회':count?'연접 '+count+' / 5패킷':'구성 대기');
}
