function createSectorBundleDiagram(width) {
  const compact = width < 680;
  const height = compact ? 1776 : 680;
  const parts = [];
  const texts = [];
  const traces = [];
  const actors = ["A", "B", "C", "D"];
  const C = {
    bg: "var(--pcb-bg)", surface: "var(--pcb-surface)", edge: "var(--pcb-edge)",
    track: "var(--pcb-track)", text: "var(--pcb-text)", muted: "var(--pcb-muted)",
    active: "var(--pcb-active)", soft: "var(--pcb-soft)", empty: "var(--pcb-empty)", pin: "var(--pcb-pin)"
  };
  const esc = value => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  function element(tag, attrs, body = "") {
    const attributes = Object.entries(attrs).map(([key, value]) => `${key}="${esc(value)}"`).join(" ");
    parts.push(`<${tag} ${attributes}>${body}</${tag}>`);
  }
  function rect(x, y, w, h, fill, stroke = null, extra = {}) {
    element("rect", {x, y, width:w, height:h, fill, ...(stroke ? {stroke, "stroke-width":1.4} : {}), ...extra});
  }
  function text(label, x, y, size = 13, color = C.text, anchor = "middle", mono = false, extra = {}) {
    texts.push({label, x, y, size, anchor});
    element("text", {x, y, "font-size":size, fill:color, "text-anchor":anchor, "dominant-baseline":"middle", ...(mono ? {class:"bundle-mono"} : {}), ...extra}, esc(label));
  }
  function wire(points, color = C.track, arrow = false, extra = {}) {
    traces.push({points, arrow});
    const d = points.map(([x,y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
    element("path", {d, fill:"none", stroke:color, "stroke-width":1.4, "stroke-linecap":"butt", "stroke-linejoin":"miter", ...extra});
    if (arrow) {
      const [x,y] = points[points.length-1];
      const [px,py] = points[points.length-2];
      const arrowPoints = x !== px ? `${x-5},${y-3} ${x},${y} ${x-5},${y+3}` : `${x-3},${y-5} ${x},${y} ${x+3},${y-5}`;
      element("polygon",{points:arrowPoints,fill:color});
    }
  }
  function terminal(x,y,color=C.pin) { rect(x-2,y-2,4,4,color); }
  const magePixels = [
    "                                ","                   oooo         ","                  occvo         ",
    "                 occvvo         ","                occcvoo         ","    oo         occcvvo          ",
    "   oooo       occcvvvo          ","  ooacoo     occcvvvvv          ","  oalacoo    occcvvvvao         ",
    "  oalaaco   occcvvvvaaao        ","  ocaacco   occcvvvvvavvo       ","  occccoo  occcvvvvvvvvvo       ",
    "   occoo oobbbbbbbbbbbbbboooo   ","    oooooocccccccccccccccccco   ","    ooo oooooooooooooooooooooo  ",
    "    omo    ooosssssssstoo       ","    omo    ooosoossssoooo       ","    ddo    ooottttttttto        ",
    "    omo     omlmttmmmllm        ","    omo     ommlldddlllmo       ","    omo   oooomlllmmllmooo      ",
    "    omoocccooomlllllllmvooo     ","    omssccccovmmllllllmvcco     ","    omssccccovcmlllllmmocco     ",
    "    omooccooovcmmlllmmvoccoo    ","    omooooooovccmmlmmvvooss     ","    omo  ooooccccmmbavvvoo      ",
    "    omo   oovbccccvbavvvvoo     ","    omo   oovbccccvbavvvvoo     ","    omo  oovvbccccvbavvvvvoo    ",
    "    omo  oovcbccccvbavvvvvoo    ","    omo oovccccccccccccccccoo   ","    omo oooddddddddddddddddo    ",
    "    omo  oooooooooooooooooo     ","    ooo     ddddo    odddd      ","                                "
  ];
  function mage(cx,cy,size=34) {
    const palette={o:"var(--pcb-char-ink)",l:"var(--pcb-char-steel)",m:"var(--pcb-char-steel)",d:"var(--pcb-char-steel-dark)",a:C.active,b:C.active,c:"var(--pcb-char-blue-mid)",v:"var(--pcb-char-blue-dark)",s:"var(--pcb-char-skin)",t:"var(--pcb-char-skin-dark)"};
    const unit=size/32;
    parts.push(`<g data-character="mage" shape-rendering="crispEdges" transform="translate(${cx} ${cy})">`);
    magePixels.forEach((row,y)=>{
      for(let x=0;x<32;){
        const color=row[x];
        let end=x+1;
        while(end<32 && row[end]===color) end++;
        if(palette[color]) rect((x-16)*unit,(y-20)*unit,(end-x)*unit,unit,palette[color]);
        x=end;
      }
    });
    parts.push("</g>");
  }
  function sector(x,y,w,h) {
    rect(x,y,w,h,C.bg,C.edge,{rx:2,"data-role":"source-sector"});
    const col=w/2, row=h/2;
    wire([[x+col,y],[x+col,y+h]],C.edge);
    wire([[x,y+row],[x+w,y+row]],C.edge);
    for(let i=0;i<4;i++) {
      const cx=x+col*(i%2+.5), cy=y+row*(Math.floor(i/2)+.5);
      const size=w>=160?40:34;
      rect(cx-22,cy-3,7,6,C.edge);
      wire([[cx-12,cy],[cx+17,cy]],C.track,true);
      mage(cx-2,cy-2,size);
      text(actors[i],cx+col*.31,cy-row*.29,12,C.active,"middle",true);
    }
  }
  function states(x,y,w,h,gap) {
    actors.forEach((actor,i)=> {
      const top=y+i*(h+gap);
      rect(x,top,w,h,C.surface,null,{rx:2,"data-role":"move-state","data-actor":actor});
      text(`${actor} · x, y`,x+w/2,top+h/2,12,C.text,"middle",true);
    });
  }
  function packet(x,y,w,actor) {
    const payloadX=x+30;
    rect(x,y,w,32,C.surface,C.edge,{rx:2,"data-role":"individual-packet","data-actor":actor});
    rect(x+1,y+1,28,30,C.empty);
    wire([[x+30,y],[x+30,y+32]],C.edge);
    text("H",x+15,y+16,12,C.muted,"middle",true,{"data-role":"packet-header"});
    text(`${actor} · 이동`,payloadX+(w-30)/2,y+16,12,C.text,"middle",false,{"data-role":"packet-entry","data-actor":actor});
  }
  function bundle(x,y,w) {
    rect(x,y,w,164,C.surface,C.active,{rx:2,"data-role":"bundle-packet","data-count":4});
    rect(x+1,y+1,w-2,31,C.soft);
    text("H",x+15,y+16,12,C.muted,"middle",true,{"data-role":"packet-header"});
    text("count 4",x+w-13,y+16,12,C.text,"end",true);
    wire([[x,y+32],[x+w,y+32]],C.edge);
    actors.forEach((actor,i)=>{
      const top=y+34+i*32;
      rect(x+8,top,w-16,28,C.soft,null,{rx:1,"data-role":"packet-entry","data-actor":actor});
      text(`${actor} · 최종 상태`,x+w/2,top+14,12,C.text);
    });
  }
  function ringSector(cx,cy,r,inner,start,end,actor) {
    const polar=(radius,degrees)=>[cx+radius*Math.cos(degrees*Math.PI/180),cy+radius*Math.sin(degrees*Math.PI/180)];
    const p1=polar(r,start),p2=polar(r,end),p3=polar(inner,end),p4=polar(inner,start);
    const d=`M${p1.join(" ")} A${r} ${r} 0 0 1 ${p2.join(" ")} L${p3.join(" ")} A${inner} ${inner} 0 0 0 ${p4.join(" ")} Z`;
    element("path",{d,fill:actor?C.active:C.empty,"data-role":"queue-slot",...(actor?{"data-actor":actor}:{})});
    if(actor) {
      const [x,y]=polar((r+inner)/2,(start+end)/2);
      text(actor,x,y,11,C.bg,"middle",true);
    }
  }
  function queue(x,y,w,h,after,vertical=false) {
    rect(x,y,w,h,C.surface,C.edge,{rx:2,"data-role":"session-queue","data-session-count":1});
    const cx=x+w/2, cy=y+h/2-6;
    for(let i=0;i<8;i++)ringSector(cx,cy,49,30,-180+i*45+1,-180+(i+1)*45-1,i<4?actors[i]:null);
    text("4명",cx,cy-5,17,C.text);
    text("상태",cx,cy+13,12,C.muted);
    const count=after?1:4;
    text(String(count),cx-13,y+h-18,25,after?C.active:C.text,"middle",true,{"data-role":"enqueue-count","data-value":count});
    text("회 적재",cx+6,y+h-16,12,C.muted,"start");
    if(vertical) terminal(cx,y);
  }
  if(!compact) {
    text("같은 틱 · 같은 섹터 · 움직인 4명",24,26,12,C.muted,"start");
    text("수신 세션 1개 예시",width-24,26,12,C.muted,"end");
    const margin=24,mapW=144,stateW=100,packetW=142,queueW=142;
    const gap=(width-2*margin-mapW-stateW-packetW-queueW)/3;
    const xMap=margin,xState=xMap+mapW+gap,xPacket=xState+stateW+gap,xQueue=xPacket+packetW+gap;
    for(let row=0;row<2;row++) {
      const after=row===1,offset=row*326,top=120+offset,cy=top+82;
      parts.push(`<g data-comparison="${after?"after":"before"}">`);
      text(after?"변경 후":"변경 전",24,66+offset,14,after?C.active:C.muted,"start");
      for(const [label,x] of [["캐릭터 이동",xMap+mapW/2],["이동 상태",xState+stateW/2],["패킷 구성",xPacket+packetW/2],["세션 SendQ",xQueue+queueW/2]]) text(label,x,94+offset,13,C.muted);
      sector(xMap,top,mapW,164);
      states(xState,top,stateW,32,12);
      const busX=xState-gap*.35;
      wire([[xMap+mapW,cy],[busX,cy]],C.track);
      wire([[busX,top+16],[busX,top+148]],C.track);
      for(let i=0;i<4;i++) {
        const y=top+16+i*44;
        wire([[busX,y],[xState,y]],C.track,true);
        if(!after) {
          packet(xPacket,top+i*44,packetW,actors[i]);
          wire([[xState+stateW,y],[xPacket,y]],C.track,true);
          wire([[xPacket+packetW,y],[xQueue,y]],C.track,true,{"data-role":"enqueue-trace","data-actor":actors[i]});
          terminal(xQueue,y);
        }
      }
      if(after) {
        const mergeX=xPacket-gap*.35;
        wire([[mergeX,top+16],[mergeX,top+148]],C.active);
        for(let i=0;i<4;i++)wire([[xState+stateW,top+16+i*44],[mergeX,top+16+i*44]],C.active);
        wire([[mergeX,cy],[xPacket,cy]],C.active,true);
        bundle(xPacket,top,packetW);
        wire([[xPacket+packetW,cy],[xQueue,cy]],C.active,true,{"data-role":"enqueue-trace","data-items":4});
        // A labeled carrier makes the shared input visually distinct from a bare trace.
        const carrierX=(xPacket+packetW+xQueue)/2;
        rect(carrierX-10,cy-8,20,16,C.bg,C.active,{rx:1});
        text("4",carrierX,cy,11,C.active,"middle",true);
        terminal(xQueue,cy,C.active);
      }
      queue(xQueue,top,queueW,164,after);
      text("같은 섹터",xMap+mapW/2,308+offset,12,C.muted);
      text(after?"최종 상태 수집":"개별 상태",xState+stateW/2,308+offset,12,C.muted);
      text(after?"새 묶음 패킷 1개":"개별 패킷 4개",xPacket+packetW/2,308+offset,12,after?C.active:C.muted);
      text("수신자마다",xQueue+queueW/2,308+offset,12,C.muted);
      parts.push("</g>");
    }
    wire([[24,350],[width-24,350]],C.edge);
    text("H = 패킷 헤더",24,664,11,C.muted,"start");
    text("4명은 예시 · 상한 초과 시 청크 분할",width-24,664,11,C.muted,"end");
  } else {
    text("같은 틱 · 같은 섹터 · 움직인 4명",20,24,12,C.muted,"start");
    const cx=width/2;
    for(let row=0;row<2;row++) {
      const after=row===1,offset=row*842;
      parts.push(`<g data-comparison="${after?"after":"before"}">`);
      text(after?"변경 후":"변경 전",20,66+offset,14,after?C.active:C.muted,"start");
      text("캐릭터 이동",cx,100+offset,13,C.muted);
      sector(cx-88,122+offset,176,176);
      text("패킷 구성",cx,348+offset,13,C.muted);
      const px=cx-78,pw=156,py=372+offset;
      if(after) {
        wire([[cx,298+offset],[cx,332+offset]],C.active);
        wire([[cx,364+offset],[cx,py]],C.active,true);
        bundle(px,py,pw);
        wire([[cx,py+164],[cx,638+offset]],C.active,true,{"data-role":"enqueue-trace","data-items":4});
        rect(cx-11,574+offset,22,16,C.bg,C.active,{rx:1});
        text("4",cx,582+offset,11,C.active,"middle",true);
      } else {
        const inputRail=px-18;
        wire([[cx,298+offset],[cx,326+offset],[inputRail,326+offset],[inputRail,py+148]],C.track);
        actors.forEach((actor,i)=>packet(px,py+i*44,pw,actor));
        for(let i=0;i<4;i++) {
          const y=py+16+i*44;
          wire([[inputRail,y],[px,y]],C.track,true);
          const rail=px+pw+32-i*7, turnY=626+offset-i*14;
          wire([[px+pw,y],[rail,y],[rail,turnY],[cx-33+i*22,turnY],[cx-33+i*22,638+offset]],C.track,true,{"data-role":"enqueue-trace","data-actor":actors[i]});
        }
      }
      text(after?"새 묶음 패킷 1개":"개별 패킷 4개",20,554+offset,12,after?C.active:C.muted,"start");
      text("세션 SendQ",20,616+offset,13,C.muted,"start");
      queue(cx-88,638+offset,176,164,after,true);
      text("수신 세션 1개 예시",cx,822+offset,12,C.muted);
      parts.push("</g>");
    }
    wire([[20,874],[width-20,874]],C.edge);
    text("H = 패킷 헤더",20,1720,11,C.muted,"start");
    text("4명은 예시 · 상한 초과 시 청크 분할",20,1744,11,C.muted,"start");
  }
  // The builder uses the same scene for inline markup and local SVG inspection.
  const markup=parts.join("\n");
  return {markup,height,texts,traces,compact,width};
}

if (typeof module !== "undefined") module.exports = {createSectorBundleDiagram};
