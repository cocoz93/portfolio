function createSectorReuseScene(width,style='gate',interior='stack'){
  width=Math.max(320,Math.round(width));
  const compact=width<700,rowHeight=compact?702:424,height=rowHeight*2,kind='sector-pool-interior-'+interior,msgWidth=compact?128:160,msgHeight=compact?84:96;
  const C={bg:'var(--pcb-bg)',surface:'var(--pcb-surface)',edge:'var(--pcb-edge)',track:'var(--pcb-track)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',active:'var(--pcb-active)',focus:'var(--pcb-data-focus)',soft:'var(--pcb-soft)',empty:'var(--pcb-empty)',pin:'var(--pcb-pin)'};
  const out=[],labels=[],bounds=[],rows=[],paths=[],worlds=[],sid=key=>kind+'-'+key;
  const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  function tag(name,attrs,body=''){out.push(`<${name} ${Object.entries(attrs).map(([k,v])=>`${k}="${esc(v)}"`).join(' ')}>${body}</${name}>`);}
  function box(x,y,w,h,fill=C.surface,stroke=null,attrs={}){tag('rect',{x,y,width:w,height:h,fill,...(stroke?{stroke,'stroke-width':1.5}:{}),...attrs});}
  function txt(text,x,y,size=14,color=C.text,anchor='middle',attrs={}){labels.push({text,x,y,size,anchor,exclusive:attrs['data-exclusive']});tag('text',{x,y,'font-size':size,'dominant-baseline':'middle','text-anchor':anchor,fill:color,...attrs},esc(text));}
  function rawText(text,x,y,size=14,color=C.text,anchor='middle',attrs={}){tag('text',{x,y,'font-size':size,'dominant-baseline':'middle','text-anchor':anchor,fill:color,...attrs},esc(text));}
  function wire(points,color=C.edge,attrs={}){for(let i=1;i<points.length;i++)if(points[i][0]!==points[i-1][0]&&points[i][1]!==points[i-1][1])throw Error('Non-orthogonal trace');paths.push(points);tag('path',{d:points.map((p,i)=>`${i?'L':'M'}${p.join(' ')}`).join(' '),fill:'none',stroke:color,'stroke-width':1.5,...attrs});}
  function contact(x,y,r=2.5){
    tag('circle',{cx:x,cy:y,r,fill:C.pin,opacity:.85,'data-role':'plated-contact'});
    tag('circle',{cx:x,cy:y,r:r*.42,fill:C.bg});
  }
  function pin(x,y,side){wire([[x,y],[x+side*5,y]],C.track,{opacity:.65});contact(x+side*2.5,y);}
  function footprint(x,y,w,h){
    out.push('<g data-role="component-registration">');
    for(const [px,py,sx,sy] of [[x+3,y+3,1,1],[x+w-3,y+3,-1,1],[x+3,y+h-3,1,-1],[x+w-3,y+h-3,-1,-1]])wire([[px,py+sy*7],[px,py],[px+sx*7,py]],C.muted,{opacity:.45});
    out.push('</g>');
  }
  function chamfer(points){
    const p=points.filter((v,i)=>!i||v[0]!==points[i-1][0]||v[1]!==points[i-1][1]),result=[p[0]];
    for(let i=1;i<p.length-1;i++){
      const a=p[i-1],b=p[i],c=p[i+1],ab=Math.hypot(b[0]-a[0],b[1]-a[1]),bc=Math.hypot(c[0]-b[0],c[1]-b[1]);
      if((b[0]-a[0])*(c[1]-b[1])===(b[1]-a[1])*(c[0]-b[0])){result.push(b);continue;}
      const cut=Math.min(6,ab/2,bc/2);result.push([b[0]-(b[0]-a[0])*cut/ab,b[1]-(b[1]-a[1])*cut/ab],[b[0]+(c[0]-b[0])*cut/bc,b[1]+(c[1]-b[1])*cut/bc]);
    }
    result.push(p.at(-1));return result;
  }
  function circuit(points,key){
    for(let i=1;i<points.length;i++)if(points[i][0]!==points[i-1][0]&&points[i][1]!==points[i-1][1])throw Error('Non-orthogonal circuit layout');
    const routed=chamfer(points),id=sid(key+'-circuit');
    tag('path',{id,d:routed.map((p,i)=>`${i?'L':'M'}${p.join(' ')}`).join(' '),fill:'none',stroke:C.track,'stroke-width':1.5,'stroke-linejoin':'miter',opacity:key.includes('-allocation-')?0:.5,'data-role':'functional-circuit'});
    return {id,points:routed,rawPoints:points};
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
    tag("use",{href:`#bundle-mage-${kind}-${direction}`,transform:`translate(${x} ${y}) scale(${size/32})`,"data-character":"mage","data-facing":direction,"data-actor":actor});
  }

  box(0,0,width,height,C.bg);mageDefinition();swordsmanDefinition();
  function notice(points,key){
    const trace=sid(key+'-notice'),head=sid(key+'-notice-head');
    const baseTrace=sid(key+'-notice-idle'),baseHead=sid(key+'-notice-idle-head');
    let length=0;for(let i=1;i<points.length;i++)length+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);
    const end=points.at(-1),prev=points.at(-2),distance=Math.hypot(end[0]-prev[0],end[1]-prev[1])||1;
    const sx=(end[0]-prev[0])/distance,sy=(end[1]-prev[1])/distance;
    const headPoints=`${end[0]-sx*5-sy*3},${end[1]-sy*5+sx*3} ${end.join(',')} ${end[0]-sx*5+sy*3},${end[1]-sy*5-sx*3}`;
    const line={d:points.map((p,i)=>`${i?'L':'M'}${p.join(' ')}`).join(' '),fill:'none','stroke-width':1.5};
    tag('path',{...line,id:baseTrace,stroke:C.muted,opacity:0,'data-role':'recipient-arrow-idle'});
    tag('polygon',{id:baseHead,points:headPoints,fill:C.muted,opacity:0});
    tag('path',{...line,id:trace,stroke:C.active,'stroke-dashoffset':0,opacity:0,'data-role':'notice-arrow'});
    tag('polygon',{id:head,points:headPoints,fill:C.active,opacity:0});
    return {points,length,trace,head,baseTrace,baseHead,headPoints};
  }

  function world(x,y,key){
    const size=180,cell=60,w={x,y,size,cell,hero:sid(key+'-hero'),face:sid(key+'-face'),arrow:sid(key+'-arrow'),halos:[],recipientBoxes:[],notices:[],region:sid(key+'-world'),origin:sid(key+'-origin'),destination:sid(key+'-destination')};
    w.start=[x+30,y+90];w.end=[x+90,y+90];
    out.push(`<g id="${w.region}">`);bounds.push({x,y,w:size,h:size,role:'nine-sector-map'});
    box(x,y,size,size,C.bg,C.edge);
    for(let j=0;j<3;j++)for(let i=0;i<3;i++)box(x+i*cell+1,y+j*cell+1,58,58,C.bg,null,{'data-role':'sector','data-sector':`${i},${j}`});
    box(x+1,y+61,58,58,C.soft,null,{id:w.origin,opacity:.5});box(x+61,y+61,58,58,C.soft,null,{id:w.destination,opacity:0});
    for(let i=1;i<3;i++){wire([[x+i*cell,y],[x+i*cell,y+size]]);wire([[x,y+i*cell],[x+size,y+i*cell]]);}footprint(x,y,size,size);
    for(const [i,[col,row]] of [[2,0],[2,1],[2,2]].entries()){
      const cx=x+col*cell+30,cy=y+row*cell+30,halo=sid(key+'-receiver-'+i);w.halos.push(halo);w.recipientBoxes.push({cx,cy,left:cx-18,right:cx+18,top:cy-19,bottom:cy+19});
      box(cx-19,cy-21,38,40,C.soft,C.active,{id:halo,opacity:.18});swordsman(cx,cy-1,28,key+'-S'+(i+1));txt('S'+(i+1),cx,cy+25,11,C.muted);
    }
    const [sx,sy]=w.end;const arrows=[[[sx+17,sy-17],[x+132,y+48]],[[sx+21,sy],[x+131,sy]],[[sx+17,sy+17],[x+132,y+132]]];
    for(let i=0;i<3;i++)w.notices.push(notice(arrows[i],key+'-'+i));
    out.push(`<g id="${w.arrow}" opacity="0">`);wire([[w.start[0]+21,w.start[1]],[w.end[0]-22,w.end[1]]],C.active);tag('polygon',{points:`${w.end[0]-22},${w.end[1]} ${w.end[0]-27},${w.end[1]-3} ${w.end[0]-27},${w.end[1]+3}`,fill:C.active});out.push('</g>');
    out.push(`<g id="${w.hero}">`);tag('use',{id:w.face,href:`#bundle-mage-${kind}-south`,transform:`translate(${w.start.join(' ')}) scale(.9375)`,'data-character':'mage','data-facing':'south','data-actor':key+'-A'});txt('A',w.start[0]-23,w.start[1]+9,13,C.active);out.push('</g>');out.push('</g>');
    return w;
  }
  function pool(cx,cy,key){
    const b={cx,cy,x:cx-39,y:cy-32,w:78,h:64,left:cx-39,right:cx+39,outputY:cy};
    const ids=Object.fromEntries(['count','flash','slotFill','slotActive','indicator','card','gateLeft','gateRight','interiorClip','available','activeBuffer'].map(name=>[name,sid(key+'-pool-'+name)]));
    bounds.push({...b,role:'msg-pool'});
    box(b.x,b.y,b.w,b.h,C.surface,C.edge,{'data-role':'pool-gate','data-interior':interior});
    txt('Msg 풀',cx,cy-20,12,C.muted,'middle',{class:'sector-mono'});
    wire([[b.x+1,cy-11],[b.right-1,cy-11]],C.edge,{opacity:.7});
    box(b.right-8,b.y+7,3,3,C.active,null,{id:ids.indicator,opacity:0});
    out.push(`<defs><clipPath id="${ids.interiorClip}"><rect x="${b.x+5}" y="${cy-10}" width="68" height="21"></rect></clipPath></defs>`);
    out.push(`<g clip-path="url(#${ids.interiorClip})">`);
    box(cx-31,cy-9,62,19,C.bg,null,{id:ids.slotFill,opacity:.7});
    box(cx-31,cy-9,62,19,C.active,null,{id:ids.slotActive,opacity:0});
    let buffer={x:cx-24,y:cy-4,w:48,h:10},travel=44,gateAxis='x';
    if(interior==='stack'){
      // Overlapping free buffers: only the front buffer is checked out.
      box(cx-25,cy-8,45,11,C.surface,C.track,{opacity:.55});
      box(cx-23,cy-5,45,11,C.surface,C.track,{opacity:.75});
      buffer={x:cx-21,y:cy-2,w:45,h:10};travel=42;
      wire([[cx+25,cy+3],[cx+30,cy+3],[cx+30,cy]],C.track,{opacity:.8});
    }else if(interior==='bank'){
      // Three illustrative slots, with the output slot nearest the existing outlet.
      for(const x of [cx-27,cx-8,cx+11]){
        box(x,cy-8,14,16,C.bg,C.edge);
        wire([[x+3,cy+5],[x+11,cy+5]],C.track,{opacity:.5});
      }
      for(const x of [cx-26,cx-7]){box(x,cy-7,12,14,C.surface,C.track,{opacity:.8});box(x+2,cy-5,8,2,C.muted,null,{opacity:.5});}
      buffer={x:cx+12,y:cy-7,w:12,h:14};travel=23;
    }else if(interior==='chip'){
      // A memory component and an output register, aligned with the existing circuit.
      for(const y of [cy-6,cy,cy+6]){wire([[cx-29,y],[cx-24,y]],C.track);wire([[cx+24,y],[cx+29,y]],C.track);}
      box(cx-24,cy-8,48,16,C.empty,C.track);
      for(const x of [cx-18,cx-12,cx-6])box(x,cy-4,3,8,C.track,null,{opacity:.45});
      wire([[cx+2,cy-5],[cx+2,cy+5]],C.edge);
      buffer={x:cx+6,y:cy-4,w:12,h:8};travel=24;
    }else{
      // A reserve on the left and a visible transfer well on the right.
      for(let i=0;i<3;i++)box(cx-28,cy-8+i*5,18,3,C.track,null,{opacity:.4+i*.2});
      wire([[cx-7,cy],[cx-1,cy]],C.track);
      box(cx+1,cy-8,27,16,C.empty,C.edge);
      buffer={x:cx+5,y:cy-5,w:19,h:10};travel=23;gateAxis='y';
    }
    out.push(`<g id="${ids.available}" opacity="1"><g id="${ids.card}">`);
    box(buffer.x,buffer.y,buffer.w,buffer.h,C.surface,C.track);
    box(buffer.x+2,buffer.y+2,Math.max(3,buffer.w-4),2,C.muted,null,{opacity:.65});
    out.push('</g></g>');
    out.push(`<g id="${ids.activeBuffer}" opacity="0">`);
    box(buffer.x,buffer.y,buffer.w,buffer.h,C.active);
    box(buffer.x+2,buffer.y+2,Math.max(3,buffer.w-4),2,C.text,null,{opacity:.7});
    out.push('</g>');
    out.push(`<g id="${ids.gateLeft}">`);wire([[cx+30,cy-8],[cx+30,cy-3]],C.pin,{opacity:.8});out.push('</g>');
    out.push(`<g id="${ids.gateRight}">`);wire([[cx+30,cy+3],[cx+30,cy+8]],C.pin,{opacity:.8});out.push('</g>');
    out.push('</g>');
    box(b.x,b.y,b.w,b.h,'none',C.active,{id:ids.flash,opacity:0});
    txt('대기',cx,cy+23,11,C.muted,'middle',{id:ids.count});
    return {...b,...ids,interior,buffer,travel,gateAxis};
  }

  // Static and traveling buffers share one renderer and the same dimensions.
  function bufferGlyph(cx,cy,title,key,travel=false,payload=false,after=false){
    const x=cx-msgWidth/2,y=cy-msgHeight/2,dataWidth=msgWidth-24,dataHeight=compact?36:44,dataTop=y+(compact?35:38),dataCy=dataTop+dataHeight/2,group=sid(key+'-group'),content=sid(key+'-content'),mask=sid(key+'-mask'),flash=sid(key+'-flash'),returned=sid(key+'-returned'),rim=sid(key+'-rim'),ref=sid(key+'-ref'),dataLabel=sid(key+'-data-label');
    const write=travel?rawText:txt;
    out.push(`<g id="${group}" opacity="${travel?1:0}">`);box(x,y,msgWidth,msgHeight,C.surface,C.edge);
    box(x+1,y+1,msgWidth-2,compact?23:27,C.muted,null,{opacity:.14});write(title,x+12,y+(compact?13:15),compact?14:16,C.text,'start',{class:'sector-mono'});wire([[x+1,y+(compact?25:29)],[x+msgWidth-1,y+(compact?25:29)]],C.edge,{opacity:.6});
    if(after)write(travel?'Ref '+(payload?0:1):'Ref 4',x+msgWidth-12,y+(compact?13:15),compact?12:14,C.active,'end',{id:ref,class:'sector-mono'});
    for(const py of [dataTop+4,dataTop+dataHeight/2,dataTop+dataHeight-4])pin(x,py,-1);for(const py of [cy-12,cy,cy+12])pin(x+msgWidth,py,1);
    out.push(`<g id="${content}">`);box(x+12,dataTop,dataWidth,dataHeight,C.empty,null,{rx:1});
    out.push(`<defs><clipPath id="${mask}-clip"><rect id="${mask}" x="${x+12}" y="${dataTop}" width="${dataWidth}" height="${dataHeight}"></rect></clipPath></defs><g clip-path="url(#${mask}-clip)">`);
    box(x+12,dataTop,dataWidth,dataHeight,payload||!travel?C.focus:C.empty,null,{rx:1});
    if(payload||!travel)box(x+12,dataTop+dataHeight-2,dataWidth,2,C.active,null,{'data-role':'ready-data-strip'});
    box(x+12,dataTop,dataWidth,dataHeight,C.active,null,{id:flash,opacity:0});
    if(!travel||payload)write('A 정보',cx,dataCy,compact?14:16,C.text,'middle',{'data-exclusive':key,id:dataLabel});out.push('</g></g>');
    write('반환됨',cx,dataCy,12,C.muted,'middle',{id:returned,opacity:0,'data-exclusive':key});box(x,y,msgWidth,msgHeight,'none',C.active,{id:rim,opacity:0});out.push('</g>');
    return {cx,cy,x,y,w:msgWidth,h:msgHeight,left:x,right:x+msgWidth,top:y,bottom:y+msgHeight,group,content,mask,flash,returned,rim,ref,fullWidth:dataWidth,dataCy,dataLabel};
  }
  function msg(cx,cy,title,key,after){const b=bufferGlyph(cx,cy,title,key,false,false,after);bounds.push({...b,role:'serial-buffer'});return b;}
  function ring(cx,cy,index,key){
    const r=compact?30:34,rim=sid(key+'-rim'),caption=sid(key+'-caption'),polar=(rr,a)=>[cx+rr*Math.cos(a*Math.PI/180),cy+rr*Math.sin(a*Math.PI/180)];let fill,flash;
    bounds.push({x:cx-r,y:cy-r,w:r*2,h:r*2,role:'session-ring-buffer'});
    for(let i=0;i<8;i++){
      const a=-180+i*45+1.5,b=a+42,p=polar(r,a),q=polar(r,b),s=polar(r*.55,b),t=polar(r*.55,a),d=`M${p.join(',')} A${r},${r} 0 0 1 ${q.join(',')} L${s.join(',')} A${r*.55},${r*.55} 0 0 0 ${t.join(',')} Z`;
      tag('path',{d,fill:C.empty,stroke:C.edge,'stroke-width':1.5});
      if(i===2){fill=sid(key+'-data');flash=sid(key+'-flash');tag('path',{d,id:fill,fill:C.focus,opacity:0});tag('path',{d,id:flash,fill:C.active,opacity:0});}
    }
    contact(cx-r-4,cy);wire([[cx-r-1.5,cy],[cx-r,cy]],C.track,{opacity:.65});
    tag('circle',{id:rim,cx,cy,r:r+4,fill:'none',stroke:C.active,'stroke-width':1.5,opacity:0});txt('S'+(index+1),cx,cy,14,C.text);txt('Copy',cx,cy+48,11,C.muted,'middle',{id:caption,opacity:0});
    return {cx,cy,r,fill,flash,rim,caption,left:cx-r,right:cx+r,top:cy-r,bottom:cy+r};
  }
  function flight(points,key,type='copy',title='Msg',after=false){
    let length=0;for(let i=1;i<points.length;i++)length+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);const trace=sid(key+'-trail'),carrier=sid(key+'-parcel');
    tag('path',{id:trace,d:'M0 0',fill:'none',stroke:C.active,'stroke-width':1.5,opacity:0,'data-role':'transient-transfer'});out.push(`<g id="${carrier}" opacity="0">`);
    const glyphOffset=type==='allocation'||type==='return'?[0,-(compact?11:12)]:[0,0];
    if(type==='request')box(-3,-3,6,6,C.active);
    else if(type==='copy'){box(-18,-12,36,24,C.active,null,{rx:1});rawText('A',0,0,14,C.bg);}
    else bufferGlyph(...glyphOffset,title,key+'-glyph',true,type==='return',after);
    out.push('</g>');return {points,length,trace,carrier,type,glyphOffset,glyphSize:type==='request'?[6,6]:type==='copy'?[36,24]:[msgWidth,msgHeight]};
  }
  const identity='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0';
  for(let row=0;row<2;row++){
    const after=row===1,key=after?'after':'before',group=sid(key),matrix=sid(key+'-matrix'),offset=row*rowHeight;
    const a={group,matrix,messages:[],queues:[],copies:[],allocations:[],returns:[],requests:[],inputCircuits:[],allocationBranches:[],allocationTrunk:null,reuseCaption:null,ref:null,result:sid(key+'-result')};rows.push(a);
    out.push(`<defs><filter id="${group}-gray" color-interpolation-filters="sRGB"><feColorMatrix id="${matrix}" type="matrix" values="${identity}"></feColorMatrix></filter></defs><g id="${group}" filter="url(#${group}-gray)">`);
    txt(after?'변경 후':'변경 전',24,offset+30,14,after?C.active:C.muted,'start');
    const mx=compact?width/2:width-282,qx=width-(compact?49:58),cy=offset+(compact?492:240),ys=(compact?[384,492,600]:[128,240,352]).map(y=>y+offset);
    txt(after?'0회 생성 · 0회 사용':'0회 생성',compact?width-24:mx,offset+30,compact?16:20,after?C.active:C.text,compact?'end':'middle',{id:a.result});
    const w=world(compact?(width-180)/2:24,offset+(compact?96:150),key);worlds.push(w);
    if(compact){txt('섹터 이동',width/2,offset+70,12,C.muted);txt('수신자 S1 · S2 · S3',width/2,offset+302,11,C.muted);}
    else{txt('섹터 이동',114,offset+64,12,C.muted);txt('수신자 S1 · S2 · S3',114,offset+354,11,C.muted);}
    a.pool=pool(compact?Math.max(49,mx-msgWidth/2-60):mx-msgWidth/2-64,offset+(compact?348:88),key);
    txt('직렬화 버퍼',mx,offset+(compact?322:64),12,C.muted);txt('SendQ',qx,offset+(compact?322:64),12,C.muted);
    for(let i=0;i<(after?1:3);i++)a.messages.push(msg(mx,after?cy:ys[i],after?'Msg':'Msg '+(i+1),key+'-msg-'+i,after));
    for(let i=0;i<3;i++){
      const m=a.messages[after?0:i],q=ring(qx,ys[i],i,key+'-q-'+i);a.queues.push(q);
      const rx=(m.right+q.left)/2;a.copies.push(flight([[m.right-12,m.dataCy],[rx,m.dataCy],[rx,q.cy],[q.left-4,q.cy]],key+'-copy-'+i));
    }
    if(after){a.ref=a.messages[0].ref;a.reuseCaption=sid(key+'-reuse-caption');txt('초기 1 + 수신자 3',mx,cy+66,13,C.muted,'middle',{id:a.reuseCaption,opacity:0});}
    for(let i=0;i<3;i++){
      const receiver=w.recipientBoxes[i],source=[receiver.right+4,receiver.cy];let points,port;
      if(compact){
        const stem=w.x+w.size+8+i*6,lane=w.y+w.size+8+i*4;port=[a.pool.cx-8+i*8,a.pool.y-4];
        points=[source,[stem,source[1]],[stem,lane],[port[0],lane],port];
        wire([[port[0],port[1]+2.5],[port[0],a.pool.y]],C.track,{opacity:.65});
      }else{
        const step=Math.min(8,(a.pool.left-w.x-w.size-16)/3),stem=w.x+w.size+8+i*step;port=[a.pool.left-4,a.pool.cy-4+i*4];
        points=[source,[stem,source[1]],[stem,port[1]],port];wire([[port[0]+2.5,port[1]],[a.pool.left,port[1]]],C.track,{opacity:.65});
      }
      wire([[receiver.right+1,receiver.cy],[source[0],source[1]]],C.track,{opacity:.65});contact(...source);contact(...port);
      const route=circuit(points,key+'-sector-pool-'+i);a.inputCircuits.push(route);a.requests.push(flight(route.points,key+'-request-'+i,'request'));
    }
    const bus=Math.round((a.pool.right+a.messages[0].left)/2),lastData=a.messages.at(-1).dataCy;
    contact(a.pool.right+2,a.pool.outputY,2);wire([[a.pool.right,a.pool.outputY],[a.pool.right+2,a.pool.outputY]],C.track,{opacity:.65});
    a.allocationTrunk=circuit([[a.pool.right+2,a.pool.cy],[bus,a.pool.cy],[bus,lastData]],key+'-allocation-trunk');
    for(let i=0;i<a.messages.length;i++)a.allocationBranches.push(circuit([[bus,a.messages[i].dataCy],[a.messages[i].left-4,a.messages[i].dataCy]],key+'-allocation-branch-'+i));
    for(let i=0;i<a.messages.length;i++){
      const m=a.messages[i],points=chamfer([[a.pool.cx,a.pool.cy],[bus,a.pool.cy],[bus,m.dataCy],[m.cx,m.dataCy]]),title=after?'Msg':'Msg '+(i+1);
      a.allocations.push(flight(points,key+'-allocate-'+i,'allocation',title,after));a.returns.push(flight([...points].reverse(),key+'-return-'+i,'return',title,after));
    }
    a.study=[];
    for(let i=0;i<a.messages.length;i++){
      const m=a.messages[i],keyName=key+'-study-'+i,title=after?'Msg':'Msg '+(i+1);
      const e=Object.fromEntries(['token','tokenClip','msgClip','msgClipPath','ribbon','arrow','outline','front','poolExitClip'].map(n=>[n,sid(keyName+'-'+n)]));
      out.push(`<defs><clipPath id="${e.msgClipPath}" clipPathUnits="userSpaceOnUse"><rect id="${e.msgClip}" x="${m.x-6}" y="${m.y}" width="${m.w+12}" height="${m.h}"></rect></clipPath></defs>`);
      tag('path',{id:e.ribbon,d:'M0 0',fill:'none',stroke:C.active,'stroke-width':1.5,'stroke-linejoin':'miter',opacity:0,'data-role':'allocation-direction'});
      tag('polygon',{id:e.arrow,points:'0,0 -6,-3 -6,3',fill:C.active,opacity:0});
      box(m.x,m.y,m.w,m.h,'none',C.active,{id:e.outline,opacity:0});
      tag('path',{id:e.front,d:'M0 0',fill:'none',stroke:C.active,'stroke-width':1.5,opacity:0});
      out.push(`<defs><clipPath id="${e.poolExitClip}" clipPathUnits="userSpaceOnUse"><rect x="${a.pool.right+1}" y="${offset}" width="${width-a.pool.right-1}" height="${rowHeight}"></rect><rect x="0" y="${offset}" width="${width}" height="${a.pool.y-offset-1}"></rect><rect x="0" y="${a.pool.y+a.pool.h+1}" width="${width}" height="${offset+rowHeight-a.pool.y-a.pool.h-1}"></rect></clipPath></defs><g clip-path="url(#${e.poolExitClip})"><g id="${e.token}" opacity="0">`);
      out.push(`<defs><clipPath id="${e.tokenClip}-path"><rect id="${e.tokenClip}" x="-30" y="-13" width="60" height="26"></rect></clipPath></defs>`);
      out.push(`<g clip-path="url(#${e.tokenClip}-path)">`);
      box(-30,-13,60,26,C.surface,C.active);box(-29,-12,58,3,C.active,null,{opacity:.65});rawText(title,-23,0,compact?14:16,C.text,'start',{class:'sector-mono'});
      out.push('</g></g></g>');a.study.push(e);
    }

    out.push('</g>');if(!after)wire([[24,rowHeight],[width-24,rowHeight]],C.edge);
  }
  return {markup:out.join('\n'),width,height,compact,worlds,rows,labels,bounds,paths,kind,cutCorners:chamfer};
}

function createReuseProgram(){
  const segments=[];let time=0;
  function add(row,phase,actor,duration){duration/=row===0?1.25:1;const s={row,phase,actor,start:time,end:time+duration,duration};segments.push(s);time=s.end;}
  for(let row=0;row<2;row++){
    add(row,'prepare',0,300);add(row,'move',0,720);add(row,'settle',0,220);
    if(row===0){
      for(let i=0;i<3;i++){
        add(row,'recipient',i,500);add(row,'allocate',i,1200);add(row,'build',i,420);
        add(row,'copy',i,600);add(row,'hold',i,700);add(row,'release',i,1000);add(row,'rest',i,140);
      }
      add(row,'done',0,350);
    }else{
      add(row,'allocate',0,840);add(row,'build',0,420);add(row,'addref',0,500);
      for(let i=0;i<3;i++){add(row,'recipient',i,500);add(row,'copy',i,600);add(row,'hold',i,700);}
      add(row,'release',0,1000);add(row,'done',0,700);
    }
  }
  add(-1,'done',0,450);return {segments,end:time};
}
function reuseEase(p){p=Math.max(0,Math.min(1,p));return p*p*(3-2*p);}
function sectorFrame(time,program,preview=false){
  const clamp=v=>Math.max(0,Math.min(1,v));
  const state={time:Math.max(0,Math.min(program.end,time)),preview,activeRow:-1,focusTransition:1,finishTransition:1,phase:'같은 알림 · Msg 생성 3회 → 1회',rows:[0,1].map(row=>({
    messages:Array.from({length:row===0?3:1},()=>({live:preview,build:preview?1:0,ref:preview?(row===0?1:4):0,refAt:-99999,pulseAt:-99999})),
    queues:[0,0,0].map(()=>({filled:preview,pulseAt:-99999})),returned:[false,false,false],copy:null,transfer:null,
    created:preview?(row===0?3:1):0,copies:preview?3:0,worldMove:preview?1:0,moving:false,contextFocus:preview?1:.8,
    selected:false,activeRecipient:-1,noticeProgress:[0,0,0],noticeOpacity:0,targetsOpacity:preview?1:0
  }))};
  if(preview)return state;
  for(const s of program.segments){
    if(state.time<s.start)break;
    const p=clamp((state.time-s.start)/s.duration),done=state.time>=s.end;
    if(s.row<0){state.activeRow=-1;state.finishTransition=reuseEase(p);state.phase='완료 · Msg 생성 3회 → 1회 · 세 SendQ의 사본은 유지';continue;}
    const r=state.rows[s.row],m=r.messages[s.row===0?s.actor:0],label=s.row===0?'변경 전':'변경 후';
    state.activeRow=s.row;state.focusTransition=1;
    if(s.phase==='prepare'){
      state.focusTransition=reuseEase(p);state.phase=label+' · 이동 준비';
    }else if(s.phase==='move'){
      r.worldMove=reuseEase(p);r.moving=!done;r.contextFocus=1;state.phase=label+' · A가 왼쪽 중앙에서 가운데 중앙으로 이동';
    }else if(s.phase==='settle'){
      r.targetsOpacity=reuseEase(p);r.contextFocus=1-.34*reuseEase(p);state.phase=label+' · 섹터 이동 완료';
    }else if(s.phase==='recipient'){
      r.activeRecipient=s.actor;r.noticeProgress=[0,0,0];r.noticeProgress[s.actor]=reuseEase(p);r.noticeOpacity=1;
      r.contextFocus=.66+.34*reuseEase(p);state.phase=label+' · S'+(s.actor+1)+' 수신자 처리';
    }else if(s.phase==='allocate'){
      if(s.row===0){
        m.ref=p>=.3?1:0;r.contextFocus=1-.34*reuseEase(p/.3);
        state.phase=label+' · '+(p<.3?'S'+(s.actor+1)+' 요청 → Msg 풀':'Msg '+(s.actor+1)+' 할당');
        if(p>=.3)r.created=s.actor+1;
      }else{
        m.ref=1;r.created=1;state.phase='변경 후 · 공용 Msg 하나 할당';
      }
      if(done){m.live=true;r.transfer=null;}else r.transfer={kind:'allocation',actor:s.row===0?s.actor:0,p:s.row===0?p:.3+.7*p};
    }else if(s.phase==='build'){
      m.live=true;m.build=reuseEase(p);m.ref=1;r.contextFocus=.66;state.phase=label+' · A 정보를 직렬화';if(done)m.pulseAt=s.end;
    }else if(s.phase==='addref'){
      m.ref=4;m.refAt=s.start;state.phase='변경 후 · AddRef(3) · Ref 1 → 4';
    }else if(s.phase==='copy'){
      if(s.row===0)m.ref=2;
      r.contextFocus=s.row===0?.66:1-.34*reuseEase(p/.3);
      state.phase=label+' · '+(s.row===0?'Msg '+(s.actor+1):'같은 Msg')+' → S'+(s.actor+1)+' SendQ';
      if(done){r.queues[s.actor].filled=true;r.queues[s.actor].pulseAt=s.end;r.copies=s.actor+1;m.ref=s.row===0?1:3-s.actor;m.refAt=s.end;m.pulseAt=s.end;r.copy=null;}
      else r.copy={actor:s.actor,p,duration:s.duration};
    }else if(s.phase==='hold'){
      state.phase=label+' · '+(s.row===0?'S'+(s.actor+1)+' 적재 완료 · Copy 후 SubRef':(s.actor+1)+'회 사용 · Ref '+m.ref+' · 원본 유지');
      if(s.row===1){r.noticeOpacity=1-reuseEase((p-.7)/.3);if(done){r.activeRecipient=-1;r.noticeProgress=[0,0,0];}}
    }else if(s.phase==='release'){
      m.ref=0;m.refAt=s.start;m.live=false;state.phase=label+' · '+(s.row===0?'Msg '+(s.actor+1)+' 반환':'마지막 SubRef · Ref 0 → 풀 반환');
      if(s.row===0)r.noticeOpacity=1-reuseEase((p-.85)/.15);
      if(done){r.returned[s.row===0?s.actor:0]=true;r.transfer=null;r.activeRecipient=-1;r.noticeProgress=[0,0,0];r.noticeOpacity=0;}
      else r.transfer={kind:'return',actor:s.row===0?s.actor:0,p};
    }else if(s.phase==='rest'||s.phase==='done'){
      r.activeRecipient=-1;r.noticeProgress=[0,0,0];r.noticeOpacity=0;
    }
  }
  return state;
}

function reusePoint(beam,p){let remaining=beam.length*Math.max(0,Math.min(1,p));for(let i=1;i<beam.points.length;i++){const a=beam.points[i-1],b=beam.points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(remaining<=len){const t=len?remaining/len:0;return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];}remaining-=len;}return beam.points.at(-1);}
function reusePulse(time,at){const age=time-at;return age<0?0:age<80?reuseEase(age/80):age<760?1:age<1000?1-reuseEase((age-760)/240):0;}
function pathSlice(beam,start,end){const points=[reusePoint(beam,start)];let passed=0;for(let i=1;i<beam.points.length;i++){passed+=Math.hypot(beam.points[i][0]-beam.points[i-1][0],beam.points[i][1]-beam.points[i-1][1]);if(passed>start*beam.length&&passed<end*beam.length)points.push(beam.points[i]);}points.push(reusePoint(beam,end));return points.map((p,i)=>`${i?'L':'M'}${p.join(' ')}`).join(' ');}
function applySectorFrame(scene,state,set){
  const identity=[1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0],gray=[.2126,.7152,.0722,0,0,.2126,.7152,.0722,0,0,.2126,.7152,.0722,0,0,0,0,0,1,0];
  function moveFlight(b,active,p){
    const t=reuseEase(p),opacity=active?(b.type==='return'?Math.min(1,(1-p)/.08):b.type==='allocation'?Math.min(1,p/.08)*(1-reuseEase((p-.88)/.12)):Math.min(1,p/.08,(1-p)/.06)):0;
    set(b.trace,{opacity:active?(b.type==='request'?.85:.65):0,d:pathSlice(b,Math.max(0,t-28/b.length),t)});
    const scale=b.type==='allocation'?.44+.56*t:b.type==='return'?1-.56*t:1;
    set(b.carrier,{opacity,transform:`translate(${reusePoint(b,t).join(' ')}) scale(${scale})`});
  }
  for(let i=0;i<2;i++){
    const a=scene.rows[i],r=state.rows[i],w=scene.worlds[i];let dim=0;
    if(state.activeRow>=0){dim=i===state.activeRow?(i===1?1-state.focusTransition:0):state.focusTransition;}
    else if(!state.preview&&state.time>0&&i===0)dim=1-state.finishTransition;
    set(a.group,{opacity:1-.6*dim});set(a.matrix,{values:identity.map((v,j)=>v+(gray[j]-v)*dim).join(' ')});
    const dx=(w.end[0]-w.start[0])*r.worldMove;set(w.hero,{transform:`translate(${dx} 0)`});set(w.face,{href:`#bundle-mage-${scene.kind}-${r.moving?'east':'south'}`,'data-facing':r.moving?'east':'south'});
    set(w.arrow,{opacity:r.moving?Math.sin(Math.PI*r.worldMove):0});set(w.origin,{opacity:.5*(1-r.worldMove)});set(w.destination,{opacity:.5*r.worldMove});set(w.region,{opacity:r.contextFocus});
    const activeMessage=r.transfer?r.transfer.actor:r.messages.findIndex(m=>m.live),outputReady=activeMessage>=0&&(!r.transfer||r.transfer.kind==='return'||r.transfer.p>=.3);
    const trunkEnd=outputReady?a.messages[activeMessage].dataCy:a.pool.cy,trunk=scene.cutCorners([[a.pool.right+2,a.pool.cy],[a.allocationTrunk.rawPoints[1][0],a.pool.cy],[a.allocationTrunk.rawPoints[1][0],trunkEnd]]);
    set(a.allocationTrunk.id,{opacity:outputReady?.5:0,d:trunk.map((p,j)=>`${j?'L':'M'}${p.join(' ')}`).join(' ')});
    for(let j=0;j<a.allocationBranches.length;j++)set(a.allocationBranches[j].id,{opacity:outputReady&&j===activeMessage?.5:0});
    for(let j=0;j<a.requests.length;j++){
      const allocation=r.transfer&&r.transfer.kind==='allocation',active=allocation&&r.transfer.p<.3&&(i===1||r.transfer.actor===j);
      moveFlight(a.requests[j],active,active?r.transfer.p/.3:0);
    }
    for(let j=0;j<3;j++){
      const n=w.notices[j],p=r.noticeProgress[j],end=reusePoint(n,p),prev=reusePoint(n,Math.max(0,p-.015)),len=Math.hypot(end[0]-prev[0],end[1]-prev[1])||1,sx=(end[0]-prev[0])/len,sy=(end[1]-prev[1])/len;
      set(w.halos[j],{opacity:r.selected||p>=.9?1:.12});set(n.trace,{opacity:r.noticeOpacity,'stroke-dashoffset':n.length*(1-p)});set(n.head,{opacity:p>0?r.noticeOpacity:0,points:`${end[0]-sx*5-sy*3},${end[1]-sy*5+sx*3} ${end.join(',')} ${end[0]-sx*5+sy*3},${end[1]-sy*5-sx*3}`});
      const copy=r.copy&&r.copy.actor===j,pulse=reusePulse(state.time,r.queues[j].pulseAt);set(a.queues[j].fill,{opacity:r.queues[j].filled?1:copy?reuseEase((r.copy.p-.9)/.1):0});set(a.queues[j].flash,{opacity:pulse});set(a.queues[j].rim,{opacity:pulse});set(a.queues[j].caption,{opacity:copy?reuseEase(Math.min(1,r.copy.p*5)):0});moveFlight(a.copies[j],copy,copy?r.copy.p:0);
      if(state.preview&&!scene.compact){const q=a.queues[j],x=q.cx-74;set(a.copies[j].carrier,{opacity:1,transform:`translate(${x} ${q.cy})`});set(a.copies[j].trace,{opacity:.65,d:`M${x-34} ${q.cy}L${x-18} ${q.cy}`});}
    }
    for(let j=0;j<a.messages.length;j++){
      const m=a.messages[j],f=r.messages[j],copy=r.copy&&(i===1||r.copy.actor===j),pulse=Math.max(reusePulse(state.time,f.pulseAt),copy?reuseEase(Math.min(1,r.copy.p*r.copy.duration/80)):0);
      const arriving=r.transfer&&r.transfer.kind==='allocation'&&r.transfer.actor===j,local=arriving?Math.max(0,(r.transfer.p-.3)/.7):0,arrival=arriving?reuseEase((local-.88)/.12):0;
      set(m.group,{opacity:state.preview||f.live?1:arrival});set(m.content,{opacity:f.live?1:0});set(m.mask,{width:m.fullWidth*f.build});set(m.flash,{opacity:pulse});set(m.dataLabel,{fill:pulse>=.5?'var(--pcb-bg)':'var(--pcb-text)'});set(m.rim,{opacity:pulse});set(m.returned,{opacity:0});
      for(const [kind,flights] of [['allocation',a.allocations],['return',a.returns]]){const transfer=r.transfer&&r.transfer.kind===kind&&r.transfer.actor===j,active=transfer&&(kind==='return'||r.transfer.p>=.3);moveFlight(flights[j],active,active?(kind==='allocation'?local:r.transfer.p):0);}
    }
    set(a.pool.count,{},'할당 '+r.created);set(a.pool.flash,{opacity:r.transfer?Math.sin(r.transfer.p*Math.PI):0});set(a.result,{},i===0?`${r.created}회 생성`:`${r.created}회 생성 · ${r.copies}회 사용`);
    if(a.reuseCaption)set(a.reuseCaption,{opacity:state.preview||r.messages[0].live?1:0});
    if(i===1){const m=r.messages[0],refEase=reuseEase((state.time-m.refAt)/180);set(a.ref,{opacity:state.preview||m.live||r.returned[0]?.45+.55*refEase:0,transform:`translate(0 ${state.preview?0:3*(1-refEase)})`},'Ref '+m.ref);}
  }
}


function createPoolStudyScene(width, interior){
  const scene=createSectorReuseScene(width,'gate',interior);
  scene.style='gate';scene.interior=interior;
  for(const row of scene.rows)for(let i=0;i<row.copies.length;i++){
    const m=row.messages[row.messages.length===1?0:i],q=row.queues[i],copy=row.copies[i],bus=(m.right+q.left)/2;
    // Data leaves the centered output pin; one height change uses two right angles.
    copy.points=studyOrthogonalPoints([[m.right-12,m.cy],[bus,m.cy],[bus,q.cy],[q.left-4,q.cy]]);
    copy.length=studyBeam(copy.points).length;
  }
  return scene;
}
function studyRange(value,from,to){return reuseEase((value-from)/(to-from));}
function studyPath(points){return points.map((p,i)=>`${i?'L':'M'}${p.join(' ')}`).join(' ');}
function studyBeam(points){let length=0;for(let i=1;i<points.length;i++)length+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);return {points,length};}
function studyOrthogonalPoints(points){
  const result=[];
  for(const point of points){
    if(result.length&&point[0]===result.at(-1)[0]&&point[1]===result.at(-1)[1])continue;
    while(result.length>1){const a=result.at(-2),b=result.at(-1);if((a[0]===b[0]&&b[0]===point[0]&&(b[1]-a[1])*(point[1]-b[1])>=0)||(a[1]===b[1]&&b[1]===point[1]&&(b[0]-a[0])*(point[0]-b[0])>=0))result.pop();else break;}
    result.push(point);
  }
  return result;
}
function studySlotPoints(a,m,startX,endX,compact){
  const y=m.y+(compact?13:15),bus=a.allocationTrunk.rawPoints[1][0];
  return studyOrthogonalPoints([[startX,a.pool.outputY],[bus,a.pool.outputY],[bus,y],[endX,y]]);
}
function applyPoolStudyFrame(scene,state,set){
  applySectorFrame(scene,state,set);
  for(let row=0;row<2;row++){
    const a=scene.rows[row],r=state.rows[row],pool=a.pool,transfer=r.transfer;
    if(row===1&&a.reuseCaption){const ref=r.messages[0].ref;set(a.reuseCaption,{},ref>1?'초기 1 + 수신자 '+(ref-1):ref===1?'초기 참조 1':'Ref 0 · 풀 반환');}
    for(let recipient=0;recipient<3;recipient++){
      const w=scene.worlds[row],n=w.notices[recipient];
      const intensity=r.activeRecipient===recipient?r.noticeProgress[recipient]*r.noticeOpacity:0;
      // All target paths stay complete; only the current recipient changes color.
      set(n.baseTrace,{opacity:.5*r.targetsOpacity});set(n.baseHead,{opacity:.5*r.targetsOpacity});
      set(n.trace,{opacity:intensity,'stroke-dashoffset':0});
      set(n.head,{opacity:intensity,points:n.headPoints});
      set(w.halos[recipient],{opacity:.12+.88*intensity});
      // Shared Msg construction precedes recipient processing and needs no per-recipient pool request.
      if(row===1){set(a.requests[recipient].carrier,{opacity:0});set(a.requests[recipient].trace,{opacity:0});}
    }
    const leased=r.messages.some(m=>m.live)||transfer?.kind==='return'||transfer?.kind==='allocation'&&transfer.p>=.3;
    const allocating=transfer?.kind==='allocation',returning=transfer?.kind==='return';
    const allocationP=allocating?Math.max(0,(transfer.p-.3)/.7):0;
    const returnP=returning?transfer.p:0;
    const atPool=allocating&&transfer.p>=.3&&allocationP<.18||returning&&returnP>.82;
    const returnedCount=r.returned.filter(Boolean).length;
    set(pool.count,{},allocating&&transfer.p>=.3?'할당 중':returning?'반납 중':leased?'사용 중':returnedCount?'반납 완료':'대기');
    set(pool.flash,{opacity:0});
    set(pool.slotFill,{opacity:leased?.16:.6});
    set(pool.indicator,{opacity:leased?1:0});
    set(pool.slotActive,{opacity:atPool?1:0});
    set(pool.card,{opacity:scene.style==='card'?(leased?.25:1):leased?.25:1,transform:'translate(0 0)'});
    set(pool.gateLeft,{transform:'translate(0 0)'});set(pool.gateRight,{transform:'translate(0 0)'});
    if(scene.style==='slot'){
      const active=transfer?transfer.actor:r.messages.findIndex(m=>m.live),ready=active>=0&&(!transfer||returning||transfer.p>=.3);
      if(ready){const headerY=a.messages[active].y+(scene.compact?13:15),bus=a.allocationTrunk.rawPoints[1][0];set(a.allocationTrunk.id,{d:studyPath(studyOrthogonalPoints([[pool.right+2,pool.outputY],[bus,pool.outputY],[bus,headerY]]))});for(let j=0;j<a.allocationBranches.length;j++)set(a.allocationBranches[j].id,{d:studyPath([[bus,a.messages[j].y+(scene.compact?13:15)],[a.messages[j].left-4,a.messages[j].y+(scene.compact?13:15)]])});}
    }
    for(let i=0;i<a.messages.length;i++){
      const m=a.messages[i],f=r.messages[i],isTransfer=transfer?.actor===i;
      const incoming=isTransfer&&allocating&&transfer.p>=.3,outgoing=isTransfer&&returning;
      const p=incoming?allocationP:outgoing?returnP:0;
      const alloc=a.allocations[i],ret=a.returns[i],extras=a.study[i];
      set(alloc.carrier,{opacity:0});set(ret.carrier,{opacity:0});set(alloc.trace,{opacity:0});set(ret.trace,{opacity:0});
      set(extras.token,{opacity:0});set(extras.tokenClip,{x:-30,y:-13,width:60,height:26});
      set(extras.ribbon,{opacity:0});set(extras.arrow,{opacity:0});
      set(extras.outline,{opacity:0});set(extras.front,{opacity:0});
      set(extras.msgClip,{x:m.x-6,y:m.y,width:m.w+12,height:m.h});
      set(m.group,{opacity:f.live?1:0,transform:'translate(0 0)','clip-path':`url(#${extras.msgClipPath})`});
      if(incoming||outgoing){
        const destinationY=scene.style==='slot'?m.y+(scene.compact?13:15):m.dataCy;
        const points=scene.style==='slot'?studySlotPoints(a,m,pool.right+3,m.left-3,scene.compact):scene.cutCorners([[pool.right+3,pool.cy],[a.allocationTrunk.rawPoints[1][0],pool.cy],[a.allocationTrunk.rawPoints[1][0],destinationY],[m.left-3,destinationY]]);
        const beam=studyBeam(outgoing?[...points].reverse():points);
        // The allocation rail expresses ownership; queue Copy stays unchanged.
        const signalT=scene.style==='slot'?studyRange(p,.12,.76):incoming?studyRange(p,.12,.55):studyRange(p,.4,.84);
        const signalVisible=scene.style==='slot'?p>.12&&p<.78:incoming?p>.12&&p<.62:p>.4&&p<.91;
        const end=reusePoint(beam,signalT),start=reusePoint(beam,Math.max(0,signalT-1/beam.length));
        const dx=end[0]-start[0],dy=end[1]-start[1],angle=Math.atan2(dy,dx)*180/Math.PI;
        set(extras.ribbon,{opacity:signalVisible?.9:0,d:pathSlice(beam,Math.max(0,signalT-48/beam.length),signalT)});
        set(extras.arrow,{opacity:signalVisible?1:0,transform:`translate(${end.join(' ')}) rotate(${angle})`});
        if(scene.style==='slot'){
          // Fixed-size labeled lease: no shrinking lettering along the narrow bus.
          const route=studyBeam(studySlotPoints(a,m,pool.cx,m.x+35,scene.compact));
          const t=incoming?studyRange(p,.05,.76):1-studyRange(p,.22,.92),point=reusePoint(route,t);
          // Header text has identical size, baseline and position at hand-off.
          const handoff=incoming?studyRange(p,.76,.9):studyRange(p,.06,.22);
          const tokenVisible=incoming?p<.9:p>.06&&p<1;
          const alpha=incoming?studyRange(p,0,.08)*(1-handoff):handoff*(1-studyRange(p,.92,1));
          set(extras.token,{opacity:tokenVisible?alpha:0,transform:`translate(${point[0]} ${point[1]})`});
          // The full buffer occupies its final bounds throughout the hand-off.
          set(m.group,{opacity:incoming?handoff:1-handoff});
          set(pool.card,{opacity:incoming?1-studyRange(p,0,.16):studyRange(p,.86,1)});
          set(pool.slotFill,{opacity:.16});
        }else if(scene.style==='gate'){
          const opened=incoming?studyRange(p,.02,.18)*(1-studyRange(p,.62,.82)):studyRange(p,.45,.62)*(1-studyRange(p,.85,1));
          set(pool.gateLeft,{transform:`translate(${-9*opened} 0)`});set(pool.gateRight,{transform:`translate(${9*opened} 0)`});
          const reveal=incoming?studyRange(p,.48,.88):1-studyRange(p,.02,.4);
          set(extras.msgClip,{x:m.x-6,y:m.y,width:(m.w+12)*reveal,height:m.h});
          set(m.group,{opacity:1});
          const frontX=m.x-6+(m.w+12)*reveal;
          set(extras.front,{opacity:reveal>.01&&reveal<.99?1:0,d:`M${frontX} ${m.y}L${frontX} ${m.bottom}`});
          set(pool.slotActive,{opacity:opened});
          set(pool.card,{opacity:incoming?1-studyRange(p,.15,.3):studyRange(p,.85,1)});
        }else{
          // Pool tray and full-size buffer use matching short, vertical strokes.
          const lift=incoming?studyRange(p,.02,.22)*(1-studyRange(p,.8,1)):studyRange(p,.65,.83)*(1-studyRange(p,.84,1));
          set(pool.card,{opacity:incoming?1-studyRange(p,.22,.4):studyRange(p,.65,.85),transform:`translate(0 ${-9*lift})`});
          const reveal=incoming?studyRange(p,.52,.91):1-studyRange(p,.02,.4);
          set(extras.msgClip,{x:m.x-6,y:m.y,width:m.w+12,height:m.h*reveal});
          set(m.group,{opacity:1,transform:`translate(0 ${incoming?8*(1-reveal):-8*(1-reveal)})`});
          const frontY=m.y+m.h*reveal+(incoming?8*(1-reveal):-8*(1-reveal));
          set(extras.front,{opacity:reveal>.01&&reveal<.99?1:0,d:`M${m.x} ${frontY}L${m.right} ${frontY}`});
          set(pool.slotActive,{opacity:lift});
        }
        if(incoming){set(m.content,{opacity:0});if(row===1)set(m.ref,{opacity:1,transform:'translate(0 0)'},'Ref 1');}
        if(outgoing){
          // Serialized bytes remain in the three SendQs after the source is freed.
          set(m.content,{opacity:1-studyRange(p,0,.12)});set(m.rim,{opacity:0});
          if(row===1)set(m.ref,{opacity:1,transform:'translate(0 0)'},'Ref 0');
        }
      }
    }
  }
}

function applyPoolInteriorFrame(scene,state,set){
  applyPoolStudyFrame(scene,state,set);
  for(let row=0;row<2;row++){
    const a=scene.rows[row],r=state.rows[row],pool=a.pool,transfer=r.transfer;
    const checkedOut=r.messages.some(m=>m.live)||transfer?.kind==='return';
    const incoming=transfer?.kind==='allocation'&&transfer.p>=.3,outgoing=transfer?.kind==='return';
    const p=incoming?(transfer.p-.3)/.7:outgoing?transfer.p:0;
    let available=checkedOut?0:1,active=0,offset=0,opening=0;
    if(incoming){
      const exit=studyRange(p,.1,.44);
      available=1-studyRange(p,0,.12);active=studyRange(p,0,.12)*(1-studyRange(p,.28,.44));
      offset=pool.travel*exit;opening=studyRange(p,.02,.14)*(1-studyRange(p,.45,.66));
    }else if(outgoing){
      const entry=studyRange(p,.68,.94);
      offset=pool.travel*(1-entry);active=studyRange(p,.64,.76)*(1-studyRange(p,.92,1));
      available=studyRange(p,.92,1);opening=studyRange(p,.56,.7)*(1-studyRange(p,.92,1));
    }
    set(pool.slotFill,{opacity:.7});set(pool.slotActive,{opacity:0});
    set(pool.available,{opacity:available});set(pool.card,{opacity:1,transform:'translate(0 0)'});
    set(pool.activeBuffer,{opacity:active,transform:`translate(${offset} 0)`});
    set(pool.gateLeft,{transform:`translate(0 ${-3*opening})`});set(pool.gateRight,{transform:`translate(0 ${3*opening})`});
  }
}
