function createBundleLayout(width,kind){
  const compact=width<700,height=compact?1000:650;
  const out=[],labels=[],traces=[],circuitTraces=[];
  const actors=["A","B","C","D"];
  const directions=["east","north","west","south"];
  const C={bg:"var(--pcb-bg)",surface:"var(--pcb-surface)",edge:"var(--pcb-edge)",track:"var(--pcb-track)",text:"var(--pcb-text)",muted:"var(--pcb-muted)",active:"var(--pcb-active)",soft:"var(--pcb-soft)",empty:"var(--pcb-empty)"};
  const escape=value=>String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");
  function tag(name,attrs,body=""){
    out.push(`<${name} ${Object.entries(attrs).map(([key,value])=>`${key}="${escape(value)}"`).join(" ")}>${body}</${name}>`);
  }
  function box(x,y,w,h,fill=C.surface,stroke=null,extra={}){
    tag("rect",{x,y,width:w,height:h,fill,...(stroke?{stroke,"stroke-width":1.6}:{}),...extra});
  }
  function txt(label,x,y,size=13,color=C.text,anchor="middle",mono=false,extra={}){
    labels.push({label,x,y,size,anchor});
    tag("text",{x,y,fill:color,"font-size":size,"dominant-baseline":"middle","text-anchor":anchor,...(mono?{class:"bundle-mono"}:{}),...extra},escape(label));
  }
  function wire(points,color=C.track,arrow=false,circuit=true){
    traces.push(points);
    if(circuit)circuitTraces.push({points,color});
    tag("path",{d:points.map(([x,y],i)=>`${i?"L":"M"}${x} ${y}`).join(" "),fill:"none",stroke:color,"stroke-width":1.6,"stroke-linecap":"butt","stroke-linejoin":"miter","data-role":circuit?"circuit-trace":"guide"});
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
    const horizontal=side==="left"||side==="right";
    const dx=side==="left"?-7:side==="right"?-1:-3;
    const dy=side==="top"?-7:side==="bottom"?-1:-3;
    box(x+dx,y+dy,horizontal?8:6,horizontal?6:8,color,null,{"data-role":"contact-pad"});
  }
  function chip(x,y,w,h,stroke,extra={},ports="both"){
    if(ports!=="none"){
      terminal(x,y+h/2,"left",stroke===C.active?C.active:C.track);
      if(ports==="both")terminal(x+w,y+h/2,"right",stroke===C.active?C.active:C.track);
    }
    box(x,y,w,h,C.surface,stroke,{...extra,rx:0});
    tag("path",{d:`M${x+8} ${y} v3 h8 v-3`,fill:C.bg,stroke,"stroke-width":1.6,"data-role":"package-notch"});
  }
  function board(){
    out.push(`<defs><pattern id="bundle-pcb-grid-${kind}" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="12" cy="12" r=".65" fill="${C.edge}" opacity=".42"/></pattern></defs>`);
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
      tag("circle",{cx:x,cy:y,r:3.2,fill:C.bg,stroke,"stroke-width":1.6,"data-role":"junction-pad"});
      tag("circle",{cx:x,cy:y,r:.7,fill:stroke});
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
    box(x,y,w,h,C.bg,C.edge,{rx:0,"data-role":"single-source-sector"});
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
    const head=compact?30:36;
    chip(x,y,w,h,C.edge,{"data-role":"individual-packet","data-actor":actor});
    box(x+1,y+1,head-1,h-2,C.empty);
    rule([[x+head,y],[x+head,y+h]]);
    txt("H",x+head/2,y+h/2,12,C.muted,"middle",true,{"data-role":"packet-header"});
    txt(`${actor} 상태`,x+head+(w-head)/2,y+h/2,13,C.text,"middle",false,{"data-role":"individual-state","data-actor":actor});
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
      box(x+1,y+1,w-2,31,C.soft);
      txt("새 H",x+19,y+16,12,C.muted);
      txt("count 4",x+w-12,y+16,12,C.text,"end",true);
      rule([[x,y+32],[x+w,y+32]]);
      const entryH=(h-36)/4;
      actors.forEach((actor,i)=>{
        const ey=y+34+i*entryH;
        box(x+8,ey,w-16,entryH-3,C.soft,null,{rx:1,"data-role":"bundle-entry","data-actor":actor});
        txt(`${actor} 최종 상태`,x+w/2,ey+(entryH-3)/2,12);
      });
    }
  }
  function receiver(x,y,w,index,after,h=44){
    out.push(`<g data-role="recipient-queue" data-session="${index}" data-enqueues="${after?1:4}">`);
    chip(x,y,w,h,after?C.active:C.edge,{},"input");
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
    txt(`×${after?1:4}`,x+w-19,y+h/2,13,after?C.active:C.text,"middle",true);
    out.push("</g>");
  }
  function caption(label,x,y,active=false,anchor="middle"){txt(label,x,y,12,active?C.active:C.muted,anchor);}
  board();
  mageDefinition();
  if(kind==="fanout"){
    caption("같은 섹터 · 움직인 4명",24,26,false,"start");
    if(!compact){
      const sourceX=24,sourceW=146,packetW=176,qW=220;
      const gap=(width-48-sourceW-packetW-qW)/2;
      const px=sourceX+sourceW+gap,qx=px+packetW+gap;
      caption("같은 소스 섹터",sourceX+sourceW/2,124);
      sector(sourceX,148,sourceW,324);
      terminal(sourceX+sourceW,310,"right");
      caption("4명의 변경분",sourceX+sourceW/2,498);
      const splitX=px-24;
      wire([[sourceX+sourceW,310],[splitX,310]],C.track);
      wire([[splitX,182],[splitX,434]],C.track);
      txt("변경 전",px,76,14,C.muted,"start");
      txt("변경 후",px,326,14,C.active,"start");
      caption("각 세션 SendQ",qx+qW/2,84);
      caption("각 세션 SendQ",qx+qW/2,340);
      const inputRail=px-12,outputRail=px+packetW+12;
      wire([[splitX,182],[inputRail,182]],C.track);
      wire([[inputRail,124],[inputRail,238]],C.track);
      wire([[splitX,434],[px,434]],C.active,true);
      actors.forEach((actor,i)=>individual(px,110+i*38,packetW,28,actor));
      for(let i=0;i<4;i++){
        const cy=124+i*38;
        wire([[inputRail,cy],[px,cy]],C.track,true);
        wire([[px+packetW,cy],[outputRail,cy]],C.track);
      }
      wire([[outputRail,124],[outputRail,238]],C.track);
      bundle(px,352,packetW);
      for(const after of [false,true]){
        const center=after?434:182,rail=qx-22,ys=after?[376,434,492]:[132,190,248];
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
  }else if(kind==="anatomy"){
    caption("한 섹터의 4명 · 같은 변경분",24,26,false,"start");
    if(!compact){
      sector(24,64,width-48,84,true);
      txt("변경 전",24,190,14,C.muted,"start");
      caption("수신자마다 4회 Copy",width-24,190,false,"end");
      const gap=16,pw=(width-48-gap*3)/4;
      actors.forEach((actor,i)=>individual(24+i*(pw+gap),222,pw,72,actor));
      caption("패킷마다 헤더 + 한 명의 상태",24,316,false,"start");
      rule([[24,346],[width-24,346]]);
      txt("변경 후",24,376,14,C.active,"start");
      caption("수신자마다 1회 Copy",width-24,376,true,"end");
      bundle(24,408,width-48,76,true);
      caption("S2C_SECTOR_UPDATES",24,506,true,"start");
      const qw=(width-48-32)/3;
      for(let i=0;i<3;i++)receiver(24+i*(qw+16),552,qw,i+1,true,44);
      caption("새 헤더 · count · 상태 엔트리 4개",24,626,false,"start");
    }else{
      const cx=width/2;
      sector(20,64,width-40,106,true);
      txt("변경 전",20,218,14,C.muted,"start");
      const pw=(width-56)/2;
      actors.forEach((actor,i)=>individual(20+(i%2)*(pw+16),250+Math.floor(i/2)*74,pw,56,actor));
      caption("패킷마다 헤더 + 한 명의 상태",20,404,false,"start");
      caption("수신자마다 4회 Copy",20,432,false,"start");
      rule([[20,472],[width-20,472]]);
      txt("변경 후",20,512,14,C.active,"start");
      bundle(20,548,width-40,204);
      caption("S2C_SECTOR_UPDATES",20,780,true,"start");
      for(let i=0;i<3;i++)receiver(20,814+i*44,width-40,i+1,true,36);
      caption("수신자마다 1회 Copy",cx,968,true);
    }
  }else if(kind==="matrix"){
    caption("4명의 변경분 · 수신자 3명 예시",24,26,false,"start");
    const left=compact?20:24,sourceW=compact?62:132;
    const matrixX=compact?104:200,colGap=compact?10:18;
    const colW=(width-(compact?20:24)-matrixX-2*colGap)/3;
    const beforeY=compact?180:150,rowGap=compact?80:52;
    txt("변경 전",left,compact?70:72,14,C.muted,"start");
    caption("이동자",left+sourceW/2,compact?112:112);
    if(compact)caption("각 세션 SendQ",matrixX+(width-20-matrixX)/2,88);
    for(let i=0;i<3;i++)caption(compact?`Q${i+1}`:`Q${i+1} SendQ`,matrixX+i*(colW+colGap)+colW/2,112);
    box(left,beforeY-rowGap/2,sourceW,rowGap*4,C.bg,C.edge,{rx:0,"data-role":"single-source-sector"});
    actors.forEach((actor,i)=>{
      const cy=beforeY+i*rowGap;
      mage(left+(compact?23:45),cy,compact?30:36,directions[i],actor);
      txt(actor,left+sourceW-14,cy,12,C.active,"middle",true);
      wire([[left+sourceW,cy],[width-(compact?20:24),cy]],C.track);
      terminal(left+sourceW,cy,"right");
      for(let q=0;q<3;q++){
        const x=matrixX+q*(colW+colGap);
        chip(x,cy-18,colW,36,C.edge,{"data-role":"copy-operation","data-comparison":"before","data-actor":actor,"data-session":q+1});
        txt("Copy",x+colW/2,cy,13,C.text,"middle",true);
      }
    });
    const countBeforeY=compact?504:374;
    txt("12",width-100,countBeforeY,32,C.text,"middle",true,{"data-role":"copy-count","data-comparison":"before"});
    txt("회 Copy",width-(compact?20:24),countBeforeY,12,C.muted,"end");
    const ruleY=compact?550:408;
    rule([[left,ruleY],[width-(compact?20:24),ruleY]]);
    const afterTop=compact?660:472,afterCenter=afterTop+82;
    txt("변경 후",left,compact?594:444,14,C.active,"start");
    const bw=compact?76:132;
    if(compact){
      chip(left,afterTop,bw,164,C.active,{"data-role":"bundle-packet","data-count":4});
      txt("새 H · 4",left+bw/2,afterTop+17,11,C.muted);
      actors.forEach((actor,i)=>{
        box(left+5,afterTop+36+i*30,bw-10,26,C.soft,null,{"data-role":"bundle-entry","data-actor":actor});
        txt(actor,left+bw/2,afterTop+49+i*30,12,C.text,"middle",true);
      });
    }else bundle(left,afterTop,bw,164);
    wire([[left+bw,afterCenter],[width-(compact?20:24),afterCenter]],C.active);
    for(let q=0;q<3;q++){
      const x=matrixX+q*(colW+colGap);
      caption(compact?`Q${q+1}`:`Q${q+1} SendQ`,x+colW/2,compact?632:476);
      chip(x,afterCenter-22,colW,44,C.active,{"data-role":"copy-operation","data-comparison":"after","data-session":q+1});
      txt("Copy",x+colW/2,afterCenter,13,C.text,"middle",true);
    }
    txt("3",width-100,compact?912:614,32,C.active,"middle",true,{"data-role":"copy-count","data-comparison":"after"});
    txt("회 Copy",width-(compact?20:24),compact?912:614,12,C.muted,"end");
    caption("수신자 수와 전달할 4명 상태는 유지",compact?left:matrixX,compact?968:636,false,"start");
  }else throw new Error("알 수 없는 구도: "+kind);
  junctions();
  const markup=out.join("\n");
  return {markup,height,width,kind,compact,labels,traces};
}
if(typeof module!=="undefined")module.exports={createBundleLayout};
