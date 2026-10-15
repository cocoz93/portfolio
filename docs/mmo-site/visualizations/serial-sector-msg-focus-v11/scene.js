function createSectorReuseScene(width){
  width=Math.max(320,Math.round(width));const compact=width<700,height=compact?1680:960,kind='sector-msg-focus-v11';
  const C={bg:'var(--pcb-bg)',surface:'var(--pcb-surface)',edge:'var(--pcb-edge)',track:'var(--pcb-track)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',active:'var(--pcb-active)',focus:'var(--pcb-data-focus)',soft:'var(--pcb-soft)',empty:'var(--pcb-empty)',pin:'var(--pcb-pin)'};
  const out=[],labels=[],bounds=[],rows=[],paths=[],worlds=[],sid=key=>kind+'-'+key;
  const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  function tag(name,attrs,body=''){out.push(`<${name} ${Object.entries(attrs).map(([k,v])=>`${k}="${esc(v)}"`).join(' ')}>${body}</${name}>`);}
  function box(x,y,w,h,fill=C.surface,stroke=null,attrs={}){tag('rect',{x,y,width:w,height:h,fill,...(stroke?{stroke,'stroke-width':1.5}:{}),...attrs});}
  function txt(text,x,y,size=12,color=C.text,anchor='middle',attrs={}){labels.push({text,x,y,size,anchor});tag('text',{x,y,'font-size':size,'dominant-baseline':'middle','text-anchor':anchor,fill:color,...attrs},esc(text));}
  function wire(points,color=C.track,arrow=false,opacity=1,attrs={}){for(let i=1;i<points.length;i++)if(points[i][0]!==points[i-1][0]&&points[i][1]!==points[i-1][1])throw Error('Non-orthogonal trace');paths.push(points);tag('path',{d:points.map((p,i)=>`${i?'L':'M'}${p[0]} ${p[1]}`).join(' '),fill:'none',stroke:color,'stroke-width':1.5,opacity,...attrs});if(arrow){const p=points.at(-1),a=points.at(-2),s=3;tag('polyline',{points:a[0]!==p[0]?`${p[0]-Math.sign(p[0]-a[0])*4},${p[1]-s} ${p.join(',')} ${p[0]-Math.sign(p[0]-a[0])*4},${p[1]+s}`:`${p[0]-s},${p[1]-Math.sign(p[1]-a[1])*4} ${p.join(',')} ${p[0]+s},${p[1]-Math.sign(p[1]-a[1])*4}`,fill:'none',stroke:color,'stroke-width':1.5,opacity});}}
  function footprint(x,y,w,h){for(const [a,b,sx,sy] of [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]])wire([[a,b+sy*6],[a,b],[a+sx*6,b]],C.edge);}
  function component(cx,cy,w,h,role){const x=cx-w/2,y=cy-h/2;bounds.push({x,y,w,h,role});box(x,y,w,h,C.surface,C.edge);footprint(x-4,y-4,w+8,h+8);return {cx,cy,x,y,w,h,left:x,right:x+w,top:y,bottom:y+h};}
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
  function mage(x,y,size=40,direction="south",actor=""){
    tag("use",{href:`#bundle-mage-${kind}-${direction}`,transform:`translate(${x} ${y}) scale(${size/32})`,"data-character":"mage","data-facing":direction,"data-actor":actor});
  }

  box(0,0,width,height,C.bg);mageDefinition();
  function world(x,y,key){
    const w={x,y,size:180,cell:60,hero:sid(key+'-hero'),face:sid(key+'-face'),ghost:sid(key+'-ghost'),arrow:sid(key+'-arrow'),halos:[],recipientBoxes:[],notices:[],region:sid(key+'-world-region')};w.start=[x+90,y+90];w.end=[x+150,y+90];
    out.push(`<g id="${w.region}">`);bounds.push({x,y,w:180,h:180,role:'nine-sector-map'});box(x,y,180,180,C.bg,C.edge);footprint(x-4,y-4,188,188);
    for(let j=0;j<3;j++)for(let i=0;i<3;i++)box(x+i*60+1,y+j*60+1,58,58,C.bg,null,{'data-role':'sector','data-sector':`${i},${j}`});
    for(let i=1;i<3;i++){wire([[x+i*60,y],[x+i*60,y+180]],C.edge);wire([[x,y+i*60],[x+180,y+i*60]],C.edge);}
    for(let i=0;i<3;i++){out.push('<g opacity=".25">');mage(x+30,y+30+i*60,22,'south',key+'-background-'+i);out.push('</g>');}
    for(const [i,[col,row]] of [[1,0],[2,0],[2,2]].entries()){
      const cx=x+col*60+30,cy=y+row*60+30,halo=sid(key+'-recipient-'+i);w.halos.push(halo);w.recipientBoxes.push({cx,cy,left:cx-18,right:cx+18,top:cy-20,bottom:cy+20});box(cx-18,cy-20,36,40,C.soft,C.active,{id:halo,opacity:1});mage(cx,cy,24,'south',key+'-S'+(i+1));txt('S'+(i+1),cx,cy+25,11,C.active);
    }
    const sx=w.end[0],sy=w.end[1];const noticePaths=[[[sx-17,sy-17],[w.recipientBoxes[0].right+3,w.recipientBoxes[0].bottom+2]],[[sx+17,sy-17],[w.recipientBoxes[1].right+3,w.recipientBoxes[1].cy]],[[sx,sy+22],[w.recipientBoxes[2].cx,w.recipientBoxes[2].top-6]]];for(let i=0;i<3;i++)w.notices.push(notice(noticePaths[i],key+'-'+i));
    out.push(`<g id="${w.ghost}" opacity=".18">`);mage(w.start[0],w.start[1],28,'south',key+'-ghost');out.push('</g>');
    out.push(`<g id="${w.arrow}" opacity="0">`);wire([[w.start[0]+22,w.start[1]],[w.end[0]-26,w.end[1]]],C.active,true);out.push('</g>');
    out.push(`<g id="${w.hero}">`);tag('use',{id:w.face,href:`#bundle-mage-${kind}-south`,transform:`translate(${w.start.join(' ')}) scale(.875)`,'data-character':'mage','data-facing':'south','data-actor':key+'-A'});txt('A',w.start[0]-23,w.start[1]+7,13,C.active);out.push('</g>');
    txt('수신자 S1 · S2 · S3 (예시)',x+90,compact?y-22:y+202,11,C.muted);out.push('</g>');return w;
  }

  function pool(cx,cy,key){const b=component(cx,cy,64,64,'msg-pool'),count=sid(key+'-alloc-count');txt('Msg 풀',cx,cy-15,12,C.muted);txt('할당 0',cx,cy+12,12,C.muted,'middle',{id:count});return {...b,count};}
  function msg(cx,cy,title,key){
    const group=sid(key+'-group'),content=sid(key+'-content'),mask=sid(key+'-mask'),flash=sid(key+'-flash'),returned=sid(key+'-returned'),rim=sid(key+'-rim');out.push(`<g id="${group}">`);
    const b=component(cx,cy,112,104,'serial-buffer');box(b.x+1,b.y+1,110,25,C.muted,null,{opacity:.08});txt(title,b.x+12,b.y+13,14,C.text,'start');wire([[b.x+1,b.y+26],[b.right-1,b.y+26]],C.edge);
    out.push(`<g id="${content}">`);box(b.x+12,b.y+40,88,52,C.empty);out.push(`<defs><clipPath id="${mask}-clip"><rect id="${mask}" x="${b.x+12}" y="${b.y+40}" width="88" height="52"></rect></clipPath></defs><g clip-path="url(#${mask}-clip)">`);box(b.x+12,b.y+40,88,52,C.focus);box(b.x+12,b.y+40,88,52,C.active,null,{id:flash,opacity:0});txt('A 정보',cx,cy+14,14);out.push('</g></g>');txt('풀 반환',cx,cy-8,12,C.muted,'middle',{id:returned,opacity:0});box(b.x,b.y,b.w,b.h,'none',C.active,{id:rim,opacity:0});out.push('</g>');return {...b,group,content,mask,flash,returned,rim,fullWidth:88};
  }
  function ring(cx,cy,index,key){
    const r=30,rim=sid(key+'-rim'),caption=sid(key+'-caption');bounds.push({x:cx-r,y:cy-r,w:60,h:60,role:'session-ring-buffer'});const polar=(rr,a)=>[cx+rr*Math.cos(a*Math.PI/180),cy+rr*Math.sin(a*Math.PI/180)];let fill,flash;
    for(let i=0;i<8;i++){const a=-180+i*45+1.4,b=a+42.2,p=polar(r,a),q=polar(r,b),s=polar(r*.54,b),t=polar(r*.54,a),d=`M${p.join(',')} A${r},${r} 0 0 1 ${q.join(',')} L${s.join(',')} A${r*.54},${r*.54} 0 0 0 ${t.join(',')} Z`;tag('path',{d,fill:C.empty,stroke:C.edge,'stroke-width':1.5});if(i===2){fill=sid(key+'-fill');flash=sid(key+'-flash');tag('path',{d,id:fill,fill:C.focus,opacity:1});tag('path',{d,id:flash,fill:C.active,opacity:0});}}
    tag('circle',{cx,cy,r:r+4,fill:'none',stroke:C.active,'stroke-width':1.5,id:rim,opacity:0});txt('S'+(index+1),cx,cy,13);txt('Copy',cx,cy+48,12,C.muted,'middle',{id:caption,opacity:0});return {cx,cy,r,fill,flash,rim,caption,left:cx-r,right:cx+r,top:cy-r,bottom:cy+r};
  }
  function notice(points,key){
    let length=0;for(let i=1;i<points.length;i++)length+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);const trace=sid(key+'-notice-trace'),head=sid(key+'-notice-head');
    tag('path',{d:points.map((p,i)=>`${i?'L':'M'}${p.join(' ')}`).join(' '),fill:'none',stroke:C.active,'stroke-width':1.5,id:trace,'data-role':'notice-arrow',opacity:0,'stroke-dasharray':length,'stroke-dashoffset':length});tag('polyline',{id:head,points:'0,0 0,0 0,0',fill:'none',stroke:C.active,'stroke-width':1.5,opacity:0});return {points,length,trace,head};
  }
  function flight(points,key,type='copy'){
    let length=0;for(let i=1;i<points.length;i++)length+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);const trace=sid(key+'-trail'),carrier=sid(key+'-parcel');
    tag('path',{d:points.map((p,i)=>`${i?'L':'M'}${p.join(' ')}`).join(' '),fill:'none',stroke:C.active,'stroke-width':1.5,id:trace,'data-role':'transient-transfer',opacity:0});
    out.push(`<g id="${carrier}" opacity="0">`);
    if(type==='copy'){box(-14,-10,28,20,C.active,C.text);tag('text',{x:0,y:0,'font-size':14,'dominant-baseline':'middle','text-anchor':'middle',fill:C.text},'A');}
    else{box(-56,-52,112,104,C.surface,C.edge);footprint(-60,-56,120,112);box(-55,-51,110,25,C.muted,null,{opacity:.08});wire([[-55,-26],[55,-26]],C.edge);tag('text',{x:-44,y:-39,'font-size':14,'dominant-baseline':'middle',fill:C.text},esc(key.includes('after')?'Msg':'Msg '+(Number(key.at(-1))+1)));box(-44,-12,88,52,type==='return'?C.focus:C.empty);if(type==='return')tag('text',{x:0,y:14,'font-size':14,'dominant-baseline':'middle','text-anchor':'middle',fill:C.text},'A 정보');}
    out.push('</g>');
    return {points,length,trace,carrier,type,glyphSize:type==='copy'?[28,20]:[112,104]};
  }
  const identity='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0';
  for(let row=0;row<2;row++){
    const after=row===1,key=after?'after':'before',group=sid(key),matrix=sid(key+'-matrix'),offset=compact?row*840:row*480,a={group,matrix,messages:[],queues:[],copies:[],allocations:[],returns:[],ref:sid(key+'-ref'),result:sid(key+'-result')};rows.push(a);
    out.push(`<defs><filter id="${group}-gray" color-interpolation-filters="sRGB"><feColorMatrix id="${matrix}" type="matrix" values="${identity}"></feColorMatrix></filter></defs><g id="${group}" filter="url(#${group}-gray)">`);
    txt(after?'변경 후':'변경 전',24,offset+30,14,after?C.active:C.muted,'start');
    const w=world(compact?(width-180)/2:24,offset+(compact?74:174),key);worlds.push(w);
    const mx=compact?width/2:width-284,cy=compact?offset+548:offset+264,pcx=compact?56:(w.x+w.size+mx-56)/2;a.pool=pool(pcx,cy,key);
    const ys=(compact?[412,548,684]:[136,264,392]).map(y=>y+offset),qx=width-56;
    if(!compact)txt('섹터 이동',w.x+90,w.y-24,12,C.muted);txt('SendQ',qx,ys[0]-64,13,C.muted);
    for(let i=0;i<(after?1:3);i++)a.messages.push(msg(mx,after?cy:ys[i],after?'Msg':'Msg '+(i+1),key+'-msg-'+i));
    for(let i=0;i<3;i++){const m=a.messages[after?0:i],q=ring(qx,ys[i],i,key+'-q-'+i);a.queues.push(q);const rx=(m.right+q.left)/2;a.copies.push(flight([[m.right-12,m.cy+14],[rx,m.cy+14],[rx,q.cy],[q.left-6,q.cy]],key+'-copy-'+i));}
    if(after)txt('Ref 4',mx,cy+76,18,C.active,'middle',{id:a.ref});
    txt(after?'1회 생성 · 3회 사용':'3회 생성',mx,offset+(compact?800:460),20,after?C.active:C.text,'middle',{id:a.result});
    for(let i=0;i<a.messages.length;i++){
      const m=a.messages[i],points=[[a.pool.cx,a.pool.cy],[m.cx,m.cy]];
      a.allocations.push(flight(points,key+'-allocate-'+i,'allocation'));a.returns.push(flight([...points].reverse(),key+'-return-'+i,'return'));
    }
    out.push('</g>');if(!after)wire([[20,compact?830:480],[width-20,compact?830:480]],C.edge);
  }
  return {markup:out.join('\n'),width,height,compact,worlds,rows,labels,bounds,paths,kind};
}

function createReuseProgram(){
  const segments=[];let time=0;function add(row,phase,actor,duration){duration/=row===0?1.25:1;const s={row,phase,actor,start:time,end:time+duration,duration};segments.push(s);time=s.end;}
  for(let row=0;row<2;row++){
    add(row,'prepare',0,250);add(row,'move',0,850);add(row,'notify',0,1000);add(row,'notify-hold',0,450);add(row,'notify-out',0,250);
    if(row===0){for(let i=0;i<3;i++){add(row,'allocate',i,500);add(row,'build',i,500);add(row,'copy',i,650);add(row,'hold',i,650);add(row,'release',i,360);add(row,'rest',i,160);}add(row,'done',0,400);}
    else{add(row,'allocate',0,500);add(row,'build',0,500);add(row,'addref',0,360);for(let i=0;i<3;i++){add(row,'copy',i,650);add(row,'hold',i,650);}add(row,'release',0,560);add(row,'done',0,900);}
  }add(-1,'done',0,800);return {segments,end:time};
}
function sectorFrame(time,program,preview=false){
  const clamp=v=>Math.max(0,Math.min(1,v)),state={time:Math.max(0,Math.min(program.end,time)),preview,activeRow:-1,phase:'같은 수신자 · Msg 할당·직렬화 3회 → 1회',rows:[0,1].map(row=>({messages:Array.from({length:row===0?3:1},()=>({live:preview,build:preview?1:0,ref:preview?(row===0?1:4):0,pulseAt:-99999})),queues:[0,0,0].map(()=>({filled:preview,pulseAt:-99999})),returned:[false,false,false],copy:null,transfer:null,created:preview?(row===0?3:1):0,copies:preview?3:0,worldMove:preview?1:0,moving:false,selected:preview,noticeProgress:preview?[1,1,1]:[0,0,0],noticeOpacity:preview?1:0}))};if(preview)return state;
  for(const s of program.segments){
    if(state.time<s.start)break;const p=clamp((state.time-s.start)/s.duration),done=state.time>=s.end;if(s.row<0){state.activeRow=-1;state.phase='완료 · 할당·직렬화 3회 → 1회 · SendQ의 사본은 유지';continue;}
    const r=state.rows[s.row],m=r.messages[s.row===0?s.actor:0],label=s.row===0?'변경 전':'변경 후';state.activeRow=s.row;
    if(s.phase==='prepare')state.phase=label+' · 이동 준비';
    else if(s.phase==='move'){r.worldMove=p;r.moving=!done;state.phase=label+' · A가 가운데 섹터에서 오른쪽으로 이동';}
    else if(s.phase==='notify'){r.noticeProgress=[0,1,2].map(i=>clamp(p*1.2-i*.08));r.noticeOpacity=1;r.selected=done;state.phase=label+' · S1 · S2 · S3에게 같은 알림';}
    else if(s.phase==='notify-hold')state.phase=label+' · 같은 알림을 받을 세 수신자';
    else if(s.phase==='notify-out'){r.noticeOpacity=1-p;state.phase=label+' · 전송 대상 확인';}
    else if(s.phase==='allocate'){r.noticeOpacity=0;m.ref=1;state.phase=label+' · Msg 풀에서 '+(s.row===0?'Msg '+(s.actor+1):'Msg 하나')+' 할당';if(done){m.live=true;r.created=s.row===0?s.actor+1:1;r.transfer=null;}else r.transfer={kind:'allocation',actor:s.row===0?s.actor:0,p};}
    else if(s.phase==='build'){m.live=true;m.build=p;m.ref=1;state.phase=label+' · 같은 A 정보를 직렬화';if(done)m.pulseAt=s.end;}
    else if(s.phase==='addref'){m.ref=4;state.phase='변경 후 · AddRef(3) · Ref 1 → 4';}
    else if(s.phase==='copy'){if(s.row===0)m.ref=2;state.phase=label+' · '+(s.row===0?'Msg '+(s.actor+1):'같은 Msg')+' → SendQ '+(s.actor+1);if(done){r.queues[s.actor].filled=true;r.queues[s.actor].pulseAt=s.end;r.copies=s.actor+1;m.ref=s.row===0?1:3-s.actor;m.pulseAt=s.end;r.copy=null;}else r.copy={actor:s.actor,p};}
    else if(s.phase==='hold')state.phase=label+' · '+(s.row===0?'Copy 후 SubRef':(s.actor+1)+'회 사용 · Ref '+m.ref+' · 같은 Msg 유지');
    else if(s.phase==='release'){m.ref=0;m.live=false;state.phase=label+' · '+(s.row===0?'Msg '+(s.actor+1)+' 풀 반환':'마지막 SubRef · Ref 0 · 풀 반환');if(done){r.returned[s.row===0?s.actor:0]=true;r.transfer=null;}else r.transfer={kind:'return',actor:s.row===0?s.actor:0,p};}
  }return state;
}
function reusePoint(beam,p){let remaining=beam.length*Math.max(0,Math.min(1,p));for(let i=1;i<beam.points.length;i++){const a=beam.points[i-1],b=beam.points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(remaining<=len){const t=len?remaining/len:0;return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];}remaining-=len;}return beam.points.at(-1);}
function reusePulse(time,at){const age=time-at;return age<0?0:age<40?age/40:age<640?1:age<990?1-(age-640)/350:0;}
function pathSlice(beam,start,end){const points=[reusePoint(beam,start)];let passed=0;for(let i=1;i<beam.points.length;i++){passed+=Math.abs(beam.points[i][0]-beam.points[i-1][0])+Math.abs(beam.points[i][1]-beam.points[i-1][1]);if(passed>start*beam.length&&passed<end*beam.length)points.push(beam.points[i]);}points.push(reusePoint(beam,end));return points.map((p,i)=>`${i?'L':'M'}${p.join(' ')}`).join(' ');}
function applySectorFrame(scene,state,set){
  const identity='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0',gray='.2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 0 0 0 1 0';
  function moveFlight(b,active,p){set(b.trace,{opacity:active&&b.type==='copy'?1:0,d:pathSlice(b,Math.max(0,p-24/b.length),p)});set(b.carrier,{opacity:active?1:0,transform:`translate(${reusePoint(b,p).join(' ')})`});}
  for(let i=0;i<2;i++){
    const a=scene.rows[i],r=state.rows[i],w=scene.worlds[i],inactive=state.activeRow!==-1&&state.activeRow!==i;set(a.group,{opacity:inactive?.38:1});set(a.matrix,{values:inactive?gray:identity});
    const dx=(w.end[0]-w.start[0])*(.5-.5*Math.cos(r.worldMove*Math.PI));set(w.hero,{transform:`translate(${dx} 0)`});set(w.face,{href:`#bundle-mage-${scene.kind}-${r.moving?'east':'south'}`,'data-facing':r.moving?'east':'south'});set(w.ghost,{opacity:r.worldMove>0?.18:0});set(w.arrow,{opacity:r.moving?1:0});
    set(w.region,{opacity:state.preview?.65:r.moving||r.noticeOpacity>0?1:r.created>0?.42:.8});
    for(let j=0;j<3;j++){
      set(w.halos[j],{opacity:r.selected||r.noticeProgress[j]>=.9?1:.08});const n=w.notices[j],p=r.noticeProgress[j],end=reusePoint(n,p),prev=reusePoint(n,Math.max(0,p-.015)),len=Math.hypot(end[0]-prev[0],end[1]-prev[1])||1,sx=(end[0]-prev[0])/len,sy=(end[1]-prev[1])/len;
      set(n.trace,{opacity:r.noticeOpacity,'stroke-dashoffset':n.length*(1-p)});set(n.head,{opacity:p>0?r.noticeOpacity:0,points:`${end[0]-sx*5-sy*4},${end[1]-sy*5+sx*4} ${end.join(',')} ${end[0]-sx*5+sy*4},${end[1]-sy*5-sx*4}`});
      const copy=r.copy&&r.copy.actor===j,pulse=reusePulse(state.time,r.queues[j].pulseAt);set(a.queues[j].fill,{opacity:r.queues[j].filled?1:0});set(a.queues[j].flash,{opacity:pulse});set(a.queues[j].rim,{opacity:copy?1:pulse});set(a.queues[j].caption,{opacity:copy?1:0});moveFlight(a.copies[j],copy,copy?r.copy.p:0);
    }
    for(let j=0;j<a.messages.length;j++){
      const m=a.messages[j],f=r.messages[j],copy=r.copy&&(i===1||r.copy.actor===j),pulse=copy?1:reusePulse(state.time,f.pulseAt);set(m.group,{opacity:state.preview||f.live?1:r.returned[j]?.55:.12});set(m.content,{opacity:f.live?1:0});set(m.mask,{width:m.fullWidth*f.build});set(m.flash,{opacity:pulse});set(m.rim,{opacity:pulse});set(m.returned,{opacity:r.returned[j]?1:0});
      for(const [kind,flights] of [['allocation',a.allocations],['return',a.returns]]){const active=r.transfer&&r.transfer.kind===kind&&r.transfer.actor===j;moveFlight(flights[j],active,active?r.transfer.p:0);}
    }
    set(a.pool.count,{},'할당 '+r.created);set(a.result,{},i===0?`${r.created}회 생성`:`${r.created}회 생성 · ${r.copies}회 사용`);if(i===1){const m=r.messages[0];set(a.ref,{opacity:state.preview||m.live||r.transfer?.kind==='return'||r.returned[0]?1:0},'Ref '+m.ref);}
  }
}
