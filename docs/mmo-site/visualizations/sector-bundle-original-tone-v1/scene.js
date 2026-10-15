function createOriginalToneBundle(width){
  const kind="original-tone";
  const compact=width<700,height=compact?1000:650;
  const out=[],labels=[],traces=[];
  const actors=["A","B","C","D"];
  const directions=["east","north","west","south"];
  const C={bg:"var(--pcb-bg)",surface:"var(--pcb-surface)",edge:"var(--pcb-edge)",track:"var(--pcb-track)",text:"var(--pcb-text)",muted:"var(--pcb-muted)",active:"var(--pcb-active)",soft:"var(--pcb-soft)",empty:"var(--pcb-empty)"};
  const escape=value=>String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");
  function tag(name,attrs,body=""){
    out.push(`<${name} ${Object.entries(attrs).map(([key,value])=>`${key}="${escape(value)}"`).join(" ")}>${body}</${name}>`);
  }
  function box(x,y,w,h,fill=C.surface,stroke=null,extra={}){
    tag("rect",{x,y,width:w,height:h,fill,...(stroke?{stroke,"stroke-width":1.4}:{}),...extra});
  }
  function txt(label,x,y,size=13,color=C.text,anchor="middle",mono=false,extra={}){
    labels.push({label,x,y,size,anchor});
    tag("text",{x,y,fill:color,"font-size":size,"dominant-baseline":"middle","text-anchor":anchor,...(mono?{class:"bundle-mono"}:{}),...extra},escape(label));
  }
  function wire(points,color=C.track,arrow=false){
    traces.push(points);
    tag("path",{d:points.map(([x,y],i)=>`${i?"L":"M"}${x} ${y}`).join(" "),fill:"none",stroke:color,"stroke-width":1.4,"stroke-linecap":"butt","stroke-linejoin":"miter"});
    if(arrow){
      const [x,y]=points[points.length-1],[px,py]=points[points.length-2];
      const p=x!==px
        ?`${x-Math.sign(x-px)*5},${y-3} ${x},${y} ${x-Math.sign(x-px)*5},${y+3}`
        :`${x-3},${y-Math.sign(y-py)*5} ${x},${y} ${x+3},${y-Math.sign(y-py)*5}`;
      tag("polygon",{points:p,fill:color});
    }
  }
  function pin(x,y,w,h){box(x,y,w,h,"var(--pcb-pin)",null,{opacity:.55,"data-role":"connection-pin"});}
  function messagePins(x,y,w,h){
    for(let i=0;i<2;i++){
      const py=y+6+i*(h-15);
      pin(x-6,py,4,3);pin(x+w+2,py,4,3);
    }
  }
  function queuePins(x,y,w,h){
    pin(x-6,y+h/2-2,4,4);pin(x+w+2,y+h/2-2,4,4);
    for(let i=0;i<4;i++){
      const px=x+w*(i+1)/5;
      pin(px-2,y-5,4,3);pin(px-2,y+h+2,4,3);
    }
  }
  function bundlePins(x,y,w,h){
    for(let i=0;i<4;i++){
      const py=y+h*(i+1)/5;
      pin(x-6,py-1.5,4,3);pin(x+w+2,py-1.5,4,3);
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
    if(direction==="east")wire([[x+size*.42,y+13],[x+tip,y+13]],C.track,true);
    else if(direction==="west")wire([[x-size*.42,y+13],[x-tip,y+13]],C.track,true);
    else if(direction==="north")wire([[x+side,y+13],[x+side,y-11]],C.track,true);
    else wire([[x+side,y-11],[x+side,y+13]],C.track,true);
  }
  function sector(x,y,w,h,horizontal=false){
    box(x,y,w,h,C.bg,C.edge,{rx:2,"data-role":"single-source-sector"});
    box(x+10,y+10,w-20,h-20,"none",C.edge,{"stroke-width":.8,opacity:.6});
    wire([[x+w/2,y+10],[x+w/2,y+h-10]],C.edge);
    wire([[x+10,y+h/2],[x+w-10,y+h/2]],C.edge);
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
    messagePins(x,y,w,h);
    box(x,y,w,h,C.surface,C.edge,{rx:2,"data-role":"individual-packet","data-actor":actor});
    box(x+1,y+1,head-1,h-2,C.empty);
    wire([[x+head,y],[x+head,y+h]],C.edge);
    txt("헤더",x+head/2,y+h/2,12,C.muted,"middle",true,{"data-role":"packet-header"});
    txt(`${actor} 상태`,x+head+(w-head)/2,y+h/2,13,C.text,"middle",false,{"data-role":"individual-state","data-actor":actor});
  }
  function bundle(x,y,w,h=164,horizontal=false){
    bundlePins(x,y,w,h);
    box(x,y,w,h,C.surface,C.active,{rx:2,"data-role":"bundle-packet","data-count":4});
    if(horizontal){
      const headerW=56,countW=60,entryW=(w-headerW-countW)/4;
      box(x+1,y+1,headerW-1,h-2,C.soft);
      txt("새 H",x+headerW/2,y+h/2,12,C.muted);
      txt("count",x+headerW+countW/2,y+h/2-9,11,C.muted,"middle",true);
      txt("4",x+headerW+countW/2,y+h/2+12,17,C.text,"middle",true);
      wire([[x+headerW,y],[x+headerW,y+h]],C.edge);
      wire([[x+headerW+countW,y],[x+headerW+countW,y+h]],C.edge);
      actors.forEach((actor,i)=>{
        const ex=x+headerW+countW+i*entryW;
        box(ex+5,y+7,entryW-10,h-14,C.soft,null,{rx:1,"data-role":"bundle-entry","data-actor":actor});
        txt(`${actor} 최종 상태`,ex+entryW/2,y+h/2,13);
      });
    }else{
      box(x+1,y+1,w-2,31,C.soft);
      txt("새 헤더",x+32,y+16,12,C.muted);
      txt("count 4",x+w-12,y+16,12,C.text,"end",true);
      wire([[x,y+32],[x+w,y+32]],C.edge);
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
    queuePins(x,y,w,h);
    box(x,y,w,h,C.surface,C.edge,{rx:2});
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
    txt(`×${after?1:4}`,x+w-19,y+h/2,22,after?C.active:C.text,"middle",true);
    out.push("</g>");
  }
  function caption(label,x,y,active=false,anchor="middle"){txt(label,x,y,12,active?C.active:C.muted,anchor);}
  box(0,0,width,height,C.bg);
  mageDefinition();
  if(kind==="original-tone"){
    caption("같은 섹터 · 움직인 4명",24,26,false,"start");
    if(!compact){
      const sourceX=24,sourceW=146,packetW=176,qW=220;
      const gap=(width-48-sourceW-packetW-qW)/2;
      const px=sourceX+sourceW+gap,qx=px+packetW+gap;
      caption("같은 소스 섹터",sourceX+sourceW/2,124);
      sector(sourceX,148,sourceW,324);
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
      wire([[px-12,306],[width-24,306]],C.edge);
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
      wire([[20,608],[width-20,608]],C.edge);
      txt("변경 후",20,638,14,C.active,"start");
      bundle(20,660,width-40,164);
      for(let i=0;i<3;i++)receiver(20,846+i*40,width-40,i+1,true,34);
      caption("수신자마다 1회 Copy",cx,968,true);
    }
  }
  return {markup:out.join("\n"),height,width,kind,compact,labels,traces};
}
