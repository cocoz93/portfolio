function createPcbDesign(width,design){
  const kind=design;
  if(!["schematic","package","bus"].includes(design))throw new Error("알 수 없는 PCB 디자인: "+design);
  const compact=width<700,height=compact?1000:650;
  const out=[],labels=[],traces=[],circuitTraces=[];
  const actors=["A","B","C","D"];
  const directions=["east","north","west","south"];
  const C={bg:"var(--pcb-bg)",surface:"var(--pcb-surface)",edge:"var(--pcb-edge)",track:"var(--pcb-track)",text:"var(--pcb-text)",muted:"var(--pcb-muted)",active:"var(--pcb-active)",soft:"var(--pcb-soft)",empty:"var(--pcb-empty)"};
  const strokeWidth=design==="schematic"?1.4:1.8;
  const escape=value=>String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");
  function tag(name,attrs,body=""){
    out.push(`<${name} ${Object.entries(attrs).map(([key,value])=>`${key}="${escape(value)}"`).join(" ")}>${body}</${name}>`);
  }
  function box(x,y,w,h,fill=C.surface,stroke=null,extra={}){
    tag("rect",{x,y,width:w,height:h,fill,...(stroke?{stroke,"stroke-width":strokeWidth}:{}),...extra});
  }
  function txt(label,x,y,size=13,color=C.text,anchor="middle",mono=false,extra={}){
    labels.push({label,x,y,size,anchor});
    tag("text",{x,y,fill:color,"font-size":size,"dominant-baseline":"middle","text-anchor":anchor,...(mono?{class:"bundle-mono"}:{}),...extra},escape(label));
  }
  function wire(points,color=C.track,arrow=false,circuit=true){
    traces.push(points);
    if(circuit)circuitTraces.push({points,color});
    tag("path",{d:points.map(([x,y],i)=>`${i?"L":"M"}${x} ${y}`).join(" "),fill:"none",stroke:color,"stroke-width":strokeWidth,"stroke-linecap":"butt","stroke-linejoin":"miter","data-role":circuit?"circuit-trace":"guide"});
    if(arrow){
      let [x,y]=points[points.length-1];
      const [px,py]=points[points.length-2];
      if(circuit){
        const offset=Math.min(10,(Math.abs(x-px)+Math.abs(y-py))*.45);
        if(x!==px)x-=Math.sign(x-px)*offset;else y-=Math.sign(y-py)*offset;
      }
      const p=x!==px
        ?`${x-Math.sign(x-px)*5},${y-3} ${x},${y} ${x-Math.sign(x-px)*5},${y+3}`
        :`${x-3},${y-Math.sign(y-py)*5} ${x},${y} ${x+3},${y-Math.sign(y-py)*5}`;
      tag("polygon",{points:p,fill:color});
    }
  }
  function rule(points,color=C.edge){wire(points,color,false,false);}
  function terminal(x,y,side,color=C.track){
    if(design==="schematic"){
      tag("circle",{cx:x,cy:y,r:2.5,fill:C.bg,stroke:color,"stroke-width":strokeWidth,"data-role":"contact-pad"});
      return;
    }
    const horizontal=side==="left"||side==="right";
    const dx=side==="left"?-7:side==="right"?-1:-3;
    const dy=side==="top"?-7:side==="bottom"?-1:-3;
    if(design==="bus")box(x+(horizontal?dx:dx-1),y+(horizontal?dy-2:dy),horizontal?8:8,horizontal?10:8,color,null,{"data-role":"contact-pad"});
    else box(x+dx,y+dy,horizontal?8:6,horizontal?6:8,color,null,{"data-role":"contact-pad"});
  }
  function chip(x,y,w,h,stroke,extra={},ports="both"){
    if(ports!=="none"){
      terminal(x,y+h/2,"left",stroke===C.active?C.active:C.track);
      if(ports==="both")terminal(x+w,y+h/2,"right",stroke===C.active?C.active:C.track);
    }
    if(design==="package"){
      const leadLength=h<=34?3:h<=80?4:6;
      for(let p=0;p<4;p++){
        const cx=x+w*(p+1)/5;
        box(cx-2.5,y-leadLength,5,leadLength,C.track,null,{"aria-hidden":"true"});
        box(cx-2.5,y+h,5,leadLength,C.track,null,{"aria-hidden":"true"});
      }
      box(x,y,w,h,C.surface,stroke,{...extra,rx:2});
    }else if(design==="bus"){
      box(x,y,w,h,C.surface,null,{...extra,rx:0});
      rule([[x,y],[x+w,y]],stroke);
      rule([[x,y+h],[x+w,y+h]],stroke);
      box(x+1,y+3,2,h-6,stroke);
    }else{
      box(x,y,w,h,C.bg,stroke,{...extra,rx:0});
    }
  }
  function board(){
    const pattern=design==="schematic"
      ?`<path d="M24 0 H0 V24" stroke="${C.edge}" stroke-width=".45" fill="none" opacity=".23"/>`
      :design==="package"?`<circle cx="12" cy="12" r=".7" fill="${C.edge}" opacity=".45"/>`
      :`<path d="M0 12 H24" stroke="${C.edge}" stroke-width=".45" fill="none" opacity=".15"/>`;
    out.push(`<defs><pattern id="bundle-pcb-grid-${kind}" width="24" height="24" patternUnits="userSpaceOnUse">${pattern}</pattern></defs>`);
    box(0,0,width,height,C.bg);
    box(0,0,width,height,`url(#bundle-pcb-grid-${kind})`,null,{"aria-hidden":"true"});
  }
  function junctions(){
    const segments=circuitTraces.flatMap(({points,color})=>points.slice(1).map((point,i)=>({a:points[i],b:point,color})));
    const candidates=new Map();
    for(const {a,b} of segments)for(const point of [a,b])candidates.set(point.join(","),point);
    for(const [x,y] of candidates.values()){
      const branches=new Set(),colors=[];
      for(const {a,b,color} of segments){
        if(a[1]===b[1]&&y===a[1]&&x>=Math.min(a[0],b[0])&&x<=Math.max(a[0],b[0])){
          if(Math.min(a[0],b[0])<x)branches.add("left");
          if(Math.max(a[0],b[0])>x)branches.add("right");
          colors.push(color);
        }else if(a[0]===b[0]&&x===a[0]&&y>=Math.min(a[1],b[1])&&y<=Math.max(a[1],b[1])){
          if(Math.min(a[1],b[1])<y)branches.add("up");
          if(Math.max(a[1],b[1])>y)branches.add("down");
          colors.push(color);
        }
      }
      if(branches.size<3)continue;
      const stroke=colors.includes(C.active)?C.active:C.track;
      if(design==="schematic")tag("circle",{cx:x,cy:y,r:2.1,fill:stroke,"data-role":"junction-pad"});
      else if(design==="bus")box(x-2.5,y-2.5,5,5,stroke,null,{"data-role":"junction-pad"});
      else{
        tag("circle",{cx:x,cy:y,r:3.4,fill:C.bg,stroke,"stroke-width":strokeWidth,"data-role":"junction-pad"});
        tag("circle",{cx:x,cy:y,r:.7,fill:stroke});
      }
    }
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
  function movement(x,y,size,direction){
    const side=size*.60,tip=size*.74;
    if(direction==="east")wire([[x+size*.42,y+13],[x+tip,y+13]],C.track,true,false);
    else if(direction==="west")wire([[x-size*.42,y+13],[x-tip,y+13]],C.track,true,false);
    else if(direction==="north")wire([[x+side,y+13],[x+side,y-11]],C.track,true,false);
    else wire([[x+side,y-11],[x+side,y+13]],C.track,true,false);
  }
  function sector(x,y,w,h,horizontal=false){
    box(x,y,w,h,design==="package"?C.empty:C.bg,C.edge,{rx:design==="package"?2:0,"data-role":"single-source-sector"});
    for(let i=0;i<4;i++){
      const cx=horizontal?x+w*(i+.5)/4:x+w*(i%2+.5)/2;
      const cy=horizontal?y+h/2:y+h*(Math.floor(i/2)+.5)/2;
      const size=horizontal?(compact?30:40):(compact?34:42);
      movement(cx,cy,size,directions[i]);
      mage(cx,cy,size,directions[i],actors[i]);
      txt(actors[i],cx,cy-size*.86,12,C.active,"middle",true);
    }
  }
  function individual(x,y,w,h,actor){
    const head=design==="package"?24:compact?30:36;
    chip(x,y,w,h,C.edge,{"data-role":"individual-packet","data-actor":actor});
    if(design!=="schematic")box(x+1,y+1,head-1,h-2,C.empty);
    rule([[x+head,y],[x+head,y+h]]);
    txt("H",x+head/2,y+h/2,12,C.muted,"middle",true,{"data-role":"packet-header"});
    txt(`${actor} 상태`,x+head+(w-head)/2,y+h/2,13,C.text,"middle",false,{"data-role":"individual-state","data-actor":actor});
    if(design==="package")tag("circle",{cx:x+w-7,cy:y+6,r:1.8,fill:C.edge,"aria-hidden":"true"});
  }
  function bundle(x,y,w,h=164,horizontal=false){
    chip(x,y,w,h,C.active,{"data-role":"bundle-packet","data-count":4});
    if(horizontal){
      const headerW=56,countW=60,entryW=(w-headerW-countW)/4;
      box(x+1,y+1,headerW-1,h-2,C.soft);
      txt("새 H",x+headerW/2,y+h/2,12,C.muted);
      txt("count",x+headerW+countW/2,y+h/2-9,11,C.muted,"middle",true);
      txt("4",x+headerW+countW/2,y+h/2+12,17,C.text,"middle",true);
      rule([[x+headerW,y],[x+headerW,y+h]]);
      rule([[x+headerW+countW,y],[x+headerW+countW,y+h]]);
      actors.forEach((actor,i)=>{
        const ex=x+headerW+countW+i*entryW;
        box(ex+5,y+7,entryW-10,h-14,C.soft,null,{rx:1,"data-role":"bundle-entry","data-actor":actor});
        txt(`${actor} 최종 상태`,ex+entryW/2,y+h/2,13);
      });
    }else{
      if(design!=="schematic")box(x+1,y+1,w-2,31,C.soft);
      txt("새 H",x+19,y+16,12,C.muted);
      txt("count 4",x+w-12,y+16,12,C.text,"end",true);
      rule([[x,y+32],[x+w,y+32]]);
      const entryH=(h-36)/4;
      actors.forEach((actor,i)=>{
        const ey=y+34+i*entryH;
        box(x+8,ey,w-16,entryH-3,design==="schematic"?C.bg:C.soft,design==="schematic"?C.edge:null,{rx:0,"data-role":"bundle-entry","data-actor":actor});
        txt(`${actor} 최종 상태`,x+w/2,ey+(entryH-3)/2,12);
      });
    }
  }
  function receiver(x,y,w,index,after,h=44){
    out.push(`<g data-role="recipient-queue" data-session="${index}" data-enqueues="${after?1:4}">`);
    chip(x,y,w,h,after?C.active:C.edge,{},"input");
    if(design==="bus")box(x+4,y+4,27,h-8,C.empty);
    txt(`Q${index}`,x+18,y+h/2,12,C.muted,"middle",true);
    const start=x+38,end=x+w-43,innerW=end-start,cell=(innerW-9)/4;
    if(after){
      box(start,y+9,innerW,h-18,C.soft,C.active,{rx:1});
      actors.forEach((actor,i)=>txt(actor,start+innerW*(i+.5)/4,y+h/2,11,C.text,"middle",true));
    }else{
      actors.forEach((actor,i)=>{
        box(start+i*(cell+3),y+9,cell,h-18,C.empty,C.edge,{rx:1});
        txt(actor,start+i*(cell+3)+cell/2,y+h/2,11,C.text,"middle",true);
      });
    }
    txt(`×${after?1:4}`,x+w-19,y+h/2,design==="bus"?17:13,after?C.active:C.text,"middle",true);
    out.push("</g>");
  }
  function caption(label,x,y,active=false,anchor="middle"){txt(label,x,y,12,active?C.active:C.muted,anchor);}
  board();
  mageDefinition();
  {
    caption("같은 섹터 · 움직인 4명",24,26,false,"start");
    if(!compact&&design==="bus"){
      const px=24,packetW=176,qW=220,qx=width-24-qW,busX=(px+packetW+qx)/2-12;
      sector(24,58,width-48,108,true);
      txt("변경 전",24,206,14,C.muted,"start");
      caption("개별 패킷",px+packetW/2,224);
      caption("각 세션 SendQ",qx+qW/2,224);
      actors.forEach((actor,i)=>individual(px,246+i*38,packetW,28,actor));
      for(let i=0;i<4;i++)wire([[px+packetW,260+i*38],[busX,260+i*38]],C.track);
      wire([[busX,260],[busX,374]],C.track);
      const beforeCenter=318,rail=qx-22;
      wire([[busX,beforeCenter],[rail,beforeCenter]],C.track);
      wire([[rail,260],[rail,376]],C.track);
      [260,318,376].forEach((cy,i)=>{
        wire([[rail,cy],[qx,cy]],C.track,true);
        receiver(qx,cy-22,qW,i+1,false);
      });
      caption("개별 패킷 4개",px+packetW/2,408);
      caption("수신자마다 4회 Copy",qx+qW/2,408);
      rule([[24,424],[width-24,424]]);
      txt("변경 후",24,438,14,C.active,"start");
      caption("각 세션 SendQ",qx+qW/2,438);
      bundle(px,452,packetW);
      wire([[px+packetW,534],[rail,534]],C.active);
      wire([[rail,476],[rail,592]],C.active);
      [476,534,592].forEach((cy,i)=>{
        wire([[rail,cy],[qx,cy]],C.active,true);
        receiver(qx,cy-22,qW,i+1,true);
      });
      caption("새 묶음 패킷 1개",px+packetW/2,632,true);
      caption("수신자마다 1회 Copy",qx+qW/2,632,true);
    }else if(!compact){
      const sourceX=24,sourceW=146,packetW=176,qW=220;
      const gap=(width-48-sourceW-packetW-qW)/2;
      const px=sourceX+sourceW+gap,qx=px+packetW+gap;
      caption("같은 소스 섹터",sourceX+sourceW/2,124);
      sector(sourceX,148,sourceW,324);
      terminal(sourceX+sourceW,310,"right");
      caption("4명의 변경분",sourceX+sourceW/2,498);
      const splitX=px-24;
      wire([[sourceX+sourceW,310],[splitX,310]],C.track);
      wire([[splitX,190],[splitX,434]],C.track);
      txt("변경 전",px,76,14,C.muted,"start");
      txt("변경 후",px,326,14,C.active,"start");
      caption("각 세션 SendQ",qx+qW/2,84);
      caption("각 세션 SendQ",qx+qW/2,340);
      const inputRail=px-12,outputRail=px+packetW+12;
      wire([[splitX,190],[inputRail,190]],C.track);
      wire([[splitX,434],[px,434]],C.active,true);
      if(design==="package"){
        const smallW=80,smallH=56,rightX=px+96,middleX=px+88,rightCenter=rightX+smallW/2;
        wire([[inputRail,94],[inputRail,230]],C.track);
        actors.forEach((actor,i)=>individual(px+(i%2)*96,110+Math.floor(i/2)*92,smallW,smallH,actor));
        wire([[inputRail,138],[px,138]],C.track,true);
        wire([[inputRail,230],[px,230]],C.track,true);
        wire([[inputRail,94],[rightCenter,94],[rightCenter,110]],C.track,true);
        wire([[inputRail,190],[rightCenter,190],[rightCenter,202]],C.track,true);
        terminal(rightCenter,110,"top");
        terminal(rightCenter,202,"top");
        wire([[px+smallW,138],[middleX,138],[middleX,178],[outputRail,178]],C.track);
        wire([[rightX+smallW,138],[outputRail,138]],C.track);
        wire([[px+smallW,230],[middleX,230],[middleX,270],[outputRail,270]],C.track);
        wire([[rightX+smallW,230],[outputRail,230]],C.track);
        wire([[outputRail,138],[outputRail,270]],C.track);
      }else{
        wire([[inputRail,124],[inputRail,238]],C.track);
        actors.forEach((actor,i)=>individual(px,110+i*38,packetW,28,actor));
        for(let i=0;i<4;i++){
          const cy=124+i*38;
          wire([[inputRail,cy],[px,cy]],C.track,true);
          wire([[px+packetW,cy],[outputRail,cy]],C.track);
        }
        wire([[outputRail,124],[outputRail,238]],C.track);
      }
      bundle(px,352,packetW);
      for(const after of [false,true]){
        const center=after?434:190,rail=qx-22,ys=after?[376,434,492]:[132,190,248];
        wire([[after?px+packetW:outputRail,center],[rail,center]],after?C.active:C.track);
        wire([[rail,ys[0]],[rail,ys[2]]],after?C.active:C.track);
        ys.forEach((cy,i)=>{
          wire([[rail,cy],[qx,cy]],after?C.active:C.track,true);
          receiver(qx,cy-22,qW,i+1,after);
        });
      }
      caption("개별 패킷 4개",px+packetW/2,286);
      caption("새 묶음 패킷 1개",px+packetW/2,542,true);
      caption("수신자마다 4회 Copy",qx+qW/2,286);
      caption("수신자마다 1회 Copy",qx+qW/2,542,true);
      rule([[px-12,306],[width-24,306]]);
      caption("Q1–Q3 = 서로 다른 수신 세션",24,606,false,"start");
      caption("수신자 3명 예시 · 실제로는 주변 시야의 N명",24,630,false,"start");
    }else{
      const cx=width/2;
      caption("같은 소스 섹터",cx,72);
      sector(20,94,width-40,108,true);
      txt("변경 전",20,250,14,C.muted,"start");
      const pw=(width-56)/2;
      actors.forEach((actor,i)=>individual(20+(i%2)*(pw+16),276+Math.floor(i/2)*42,pw,30,actor));
      caption("개별 패킷 4개",cx,372);
      for(let i=0;i<3;i++)receiver(20,402+i*50,width-40,i+1,false,40);
      caption("수신자마다 4회 Copy",cx,574);
      rule([[20,608],[width-20,608]]);
      txt("변경 후",20,638,14,C.active,"start");
      bundle(20,660,width-40,164);
      for(let i=0;i<3;i++)receiver(20,846+i*40,width-40,i+1,true,34);
      caption("수신자마다 1회 Copy",cx,968,true);
    }
  }
  junctions();
  const markup=out.join("\n");
  return {markup,height,width,kind,compact,labels,traces};
}
if(typeof module!=="undefined")module.exports={createPcbDesign};
