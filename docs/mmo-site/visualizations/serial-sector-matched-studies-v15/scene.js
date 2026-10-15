function createMatchedReuseScene(width, layout = 'aligned') {
  width = Math.max(320, Math.round(width));
  const compact = width < 700, rowH = compact ? 724 : 440, height = rowH * 2;
  const kind = 'reuse-matched-v15-' + layout;
  const C = {bg:'var(--pcb-bg)',surface:'var(--pcb-surface)',edge:'var(--pcb-edge)',track:'var(--pcb-track)',text:'var(--pcb-text)',muted:'var(--pcb-muted)',active:'var(--pcb-active)',focus:'var(--pcb-data-focus)',soft:'var(--pcb-soft)',empty:'var(--pcb-empty)',pin:'var(--pcb-pin)'};
  const out = [], labels = [], components = [], traces = [], rows = [];
  const escape = v => String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  function tag(name, attrs, body='') { out.push(`<${name} ${Object.entries(attrs).map(([k,v])=>`${k}="${escape(v)}"`).join(' ')}>${body}</${name}>`); }
  function box(x,y,w,h,fill=C.surface,stroke=null,extra={}) { tag('rect',{x,y,width:w,height:h,fill,...(stroke?{stroke,'stroke-width':1.5}:{}),...extra}); }
  function txt(text,x,y,size=12,color=C.text,anchor='middle',mono=false,extra={}) {
    labels.push({text,x,y,size,anchor,mono,...extra});
    tag('text',{x,y,'font-size':size,fill:color,'text-anchor':anchor,'dominant-baseline':'middle',...(mono?{class:'reuse-mono'}:{}),...extra},escape(text));
  }
  function wire(points,color=C.track,arrow=false,opacity=.7) {
    traces.push(points);
    tag('path',{d:points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' '),fill:'none',stroke:color,'stroke-width':1.5,'stroke-linecap':'butt','stroke-linejoin':'miter',opacity});
    if (arrow) {
      const p=points.at(-1),a=points.at(-2),dx=p[0]-a[0],dy=p[1]-a[1],n=Math.hypot(dx,dy),sx=dx/n,sy=dy/n;
      tag('polyline',{points:`${p[0]-sx*5-sy*3},${p[1]-sy*5+sx*3} ${p.join(',')} ${p[0]-sx*5+sy*3},${p[1]-sy*5-sx*3}`,fill:'none',stroke:color,'stroke-width':1.5,opacity});
    }
  }
  function chamfer(points) {
    const r=[points[0]];
    for(let i=1;i<points.length-1;i++) {
      const a=points[i-1],b=points[i],c=points[i+1],ab=Math.hypot(b[0]-a[0],b[1]-a[1]),bc=Math.hypot(c[0]-b[0],c[1]-b[1]);
      if(!ab || !bc) continue;
      if((b[0]-a[0])*(c[1]-b[1]) === (b[1]-a[1])*(c[0]-b[0])) {r.push(b);continue;}
      const cut=Math.min(8,ab/2,bc/2);
      r.push([b[0]-(b[0]-a[0])*cut/ab,b[1]-(b[1]-a[1])*cut/ab],[b[0]+(c[0]-b[0])*cut/bc,b[1]+(c[1]-b[1])*cut/bc]);
    }
    r.push(points.at(-1));return r;
  }
  function pin(x,y) { tag('circle',{cx:x,cy:y,r:3,fill:C.pin,opacity:.85});tag('circle',{cx:x,cy:y,r:1.25,fill:C.bg}); }
  function footprint(x,y,w,h) {
    for(const [px,py,sx,sy] of [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]]) wire([[px,py+sy*7],[px,py],[px+sx*7,py]],C.muted,false,.55);
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
  function mage(x,y,size=40,direction="south",actor=""){
    tag("use",{href:`#bundle-mage-${kind}-${direction}`,transform:`translate(${x} ${y}) scale(${size/32})`,"data-character":"mage","data-facing":direction,"data-actor":actor});
  }

  function world(x,y,row) {
    const w=144,h=144,inset=9,cell=42,gx=x+inset,gy=y+inset;
    components.push({x,y,w,h,role:'map',row});
    box(x,y,w,h,C.bg,C.edge,{'data-role':'sector-map','data-row':row});footprint(x-4,y-4,w+8,h+8);
    box(gx+2*cell+1,gy+cell+1,cell-2,cell-2,C.soft);
    box(gx,gy,126,126,'none',C.edge,{opacity:.45});
    for(let i=1;i<3;i++) {wire([[gx+i*cell,gy],[gx+i*cell,gy+126]],C.edge,false,.45);wire([[gx,gy+i*cell],[gx+126,gy+i*cell]],C.edge,false,.45);}
    const cellCenter=(col,r)=>[gx+(col+.5)*cell,gy+(r+.5)*cell];
    for(let i=0;i<3;i++) {out.push('<g opacity=".22">');mage(...cellCenter(0,i),22,'south');out.push('</g>');}
    for(const [j,[col,r]] of [[1,0],[2,0],[2,2]].entries()) {
      const [cx,cy]=cellCenter(col,r);box(gx+col*cell+2,gy+r*cell+2,cell-4,cell-4,C.soft,null,{opacity:.7});
      mage(cx,cy-3,24,'south');txt('S'+(j+1),cx,cy+15,11,C.muted);
    }
    const a=cellCenter(1,1),b=cellCenter(2,1);
    out.push('<g opacity=".2">');mage(...a,26,'south');out.push('</g>');
    wire([[a[0]+7,a[1]+14],[b[0]-10,b[1]+14]],C.active,true,.9);
    mage(b[0],b[1]-4,28,'south','A');txt('A',b[0],b[1]+16,11,C.active,'middle',true);
    txt('섹터 이동',x+w/2,y-24,12,C.muted);
    txt('A 이동 · 수신자 3명',x+w/2,y+h+24,12,C.muted);
    return {x,y,w,h};
  }
  function msg(cx,y,index,after,row) {
    const w=compact?88:112,h=100,x=cx-w/2;
    components.push({x,y,w,h,role:'msg',row});
    box(x,y,w,h,C.surface,C.edge,{'data-role':'serialized-msg','data-message':after?'shared':index+1,'data-row':row});
    box(x+1,y+1,w-2,23,C.muted,null,{opacity:.14});
    txt(after?'Msg':'Msg '+(index+1),x+8,y+12,12,C.text,'start',true);
    txt('Ref 1',x+w-8,y+12,11,C.muted,'end',true);
    wire([[x+1,y+24],[x+w-1,y+24]],C.edge,false,.6);
    box(x+1,y+25,w-2,18,C.muted,null,{opacity:.18});txt('Header',x+8,y+34,11,C.muted,'start',true);
    wire([[x+1,y+44],[x+w-1,y+44]],C.edge,false,.6);
    box(x+8,y+52,w-16,40,C.focus);
    box(x+8,y+90,w-16,2,C.active);
    txt('A 이동',cx,y+72,12,C.text,'middle',true);
    pin(cx,y+104);wire([[cx,y+100],[cx,y+102]],C.track,false,.65);
    return {x,y,w,h,cx,cy:y+50,bottom:y+104};
  }
  function ringPath(cx,cy,ro,ri,a,b) {
    const p=(r,t)=>[cx+Math.cos(t*Math.PI/180)*r,cy+Math.sin(t*Math.PI/180)*r];
    return `M${p(ro,a).join(',')} A${ro},${ro} 0 0 1 ${p(ro,b).join(',')} L${p(ri,b).join(',')} A${ri},${ri} 0 0 0 ${p(ri,a).join(',')} Z`;
  }
  function queue(cx,cy,r,index,row) {
    components.push({x:cx-r,y:cy-r,w:2*r,h:2*r,role:'queue',row});
    out.push(`<g data-role="sendq" data-recipient="S${index+1}" data-row="${row}">`);
    for(let k=0;k<8;k++) tag('path',{d:ringPath(cx,cy,r,r*.60,-180+k*45+1.3,-180+k*45+43.7),fill:C.empty,stroke:C.edge,'stroke-width':1.5});
    tag('path',{d:ringPath(cx,cy,r,r*.60,-178.7,-136.3),fill:C.active,'fill-opacity':.45,'data-role':'queued-copy'});
    txt('S'+(index+1),cx,cy-5,12,C.text,'middle',true);txt('A 사본',cx,cy+13,11,C.muted);
    out.push('</g>');return {cx,cy,r,left:cx-r,top:cy-r};
  }
  box(0,0,width,height,C.bg);mageDefinition();
  const effectiveWidth=Math.min(784,width),left=(width-effectiveWidth)/2+24;
  for(let row=0;row<2;row++) {
    const after=row===1,o=row*rowH,model={messages:[],queues:[],row};rows.push(model);
    const mapX=compact?(width-144)/2:left,mapY=o+(compact?86:layout==='aligned'?148:142);
    txt(after?'변경 후':'변경 전',compact?20:left,o+(compact?24:62),14,after?C.active:C.muted,'start');
    world(mapX,mapY,row);
    if(!compact) {const d=mapX+154;wire([[d,mapY-4],[d,mapY+12]],C.edge,false,.55);wire([[d,mapY+132],[d,mapY+148]],C.edge,false,.55);}
    if(layout==='aligned') {
      const mc=compact?76:left+328,qc=compact?width-62:width-left-80;
      const ys=compact?[358,478,598]:[100,220,340],r=compact?34:38;
      txt('직렬화 Msg',mc,o+(compact?280:26),12,C.muted);txt('세션 SendQ',qc,o+(compact?280:26),12,C.muted);
      for(let i=0;i<3;i++) model.queues.push(queue(qc,o+ys[i],r,i,row));
      if(!after) for(let i=0;i<3;i++) model.messages.push(msg(mc,o+ys[i]-50,i,false,row));
      else model.messages.push(msg(mc,o+ys[1]-50,0,true,row));
      const bus=compact?width/2+20:(mc+56+qc-r)/2;
      if(!after) for(let i=0;i<3;i++) {
        const m=model.messages[i],q=model.queues[i];wire(chamfer([[mc,m.bottom+4],[mc,m.bottom+12],[bus,m.bottom+12],[bus,q.cy],[q.left-8,q.cy]]),C.track,true);pin(q.left-4,q.cy);wire([[q.left-2,q.cy],[q.left,q.cy]],C.track,false,.65);
      } else {
        const m=model.messages[0];
        wire(chamfer([[mc,m.bottom+4],[mc,m.bottom+12],[bus-16,m.bottom+12],[bus-16,m.cy],[bus,m.cy]]),C.track);
        wire([[bus,o+ys[0]],[bus,o+ys[2]]],C.track);
        for(const q of model.queues) {pin(bus,q.cy);wire([[bus+3,q.cy],[q.left-8,q.cy]],C.track,true);pin(q.left-4,q.cy);wire([[q.left-2,q.cy],[q.left,q.cy]],C.track,false,.65);}
        txt('같은 Msg 유지',mc,o+(compact?560:306),12,C.muted);
      }
      txt(after?'1개 생성 · 세 세션에 재사용':'세 세션마다 각각 생성',compact?width/2:mc,o+(compact?680:416),12,after?C.active:C.muted);
    } else {
      const start=compact?width*.18:left+260,end=compact?width*.82:width-left-100,xs=[start,(start+end)/2,end];
      const top=o+(compact?324:116),qy=o+(compact?510:310),r=compact?30:38;
      txt('직렬화 Msg',xs[1],o+(compact?280:78),12,C.muted);
      for(let i=0;i<3;i++) model.queues.push(queue(xs[i],qy,r,i,row));
      if(!after) for(let i=0;i<3;i++) model.messages.push(msg(xs[i],top,i,false,row));
      else model.messages.push(msg(xs[1],top,0,true,row));
      const fork=top+124;
      if(!after) for(let i=0;i<3;i++) {wire([[xs[i],model.messages[i].bottom+4],[xs[i],model.queues[i].top-8]],C.track,true);pin(xs[i],model.queues[i].top-4);}
      else {
        wire([[xs[1],model.messages[0].bottom+4],[xs[1],fork]],C.track);
        wire([[xs[0],fork],[xs[2],fork]],C.track);
        for(const q of model.queues) {pin(q.cx,fork);wire([[q.cx,fork+3],[q.cx,q.top-8]],C.track,true);pin(q.cx,q.top-4);}
      }
      txt('세션 SendQ',xs[1],o+(compact?572:372),12,C.muted);
      txt(after?'1개 생성 · 세 세션에 재사용':'세 세션마다 각각 생성',xs[1],o+(compact?680:416),12,after?C.active:C.muted);
    }
    if(after) {
      const fy=o+(compact?708:432),cx=compact?width/2:layout==='aligned'?left+328:(left+260+width-left-100)/2;
      txt('Ref 1 → 4 → 3 → 2 → 1 → 0 · 풀 반환',cx,fy,11,C.muted,'middle',true);
    }
  }
  wire([[20,rowH],[width-20,rowH]],C.edge,false,.6);
  return {markup:out.join('\n'),width,height,compact,kind,labels,components,traces,rows,layout};
}
