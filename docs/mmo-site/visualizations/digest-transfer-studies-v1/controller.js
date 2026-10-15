(() => {
  const kind='digest-transfer-studies-v1',root=document.getElementById(kind);if(!root)return;
  const program=createTransferProgram(),media=matchMedia('(prefers-reduced-motion: reduce)'),panels=new Map(),session=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);let revision=0,lastSaved='';
  function allStates(){return TRANSFER_DESIGNS.map(design=>{const panel=panels.get(design.key),frame=transferFrame(panel.time,program);return {design:design.name,key:design.key,time:panel.time,playing:panel.playing,phase:frame.phase,recipient:'S1',queuedMsgIds:frame.queues[0],enqueueCalls:frame.calls[0]};});}
  function save(){if(!window.openai?.setWidgetState)return;lastSaved=session+':'+(++revision);window.openai.setWidgetState({modelContent:{kind,figure:4,scope:'Digest to SendQ animation studies',designs:allStates()},privateContent:{kind,revision:lastSaved,designs:allStates().map(p=>({key:p.key,time:p.time}))}}).catch(()=>{});}
  for(const design of TRANSFER_DESIGNS){
    const element=root.querySelector('[data-study="'+design.key+'"]'),board=element.querySelector('.transfer-board'),play=element.querySelector('[data-action="play"]'),reset=element.querySelector('[data-action="reset"]'),status=element.querySelector('[data-status]'),panel={time:0,playing:false,scene:null,nodes:new Map(),width:0,raf:0,timer:0,startedAt:0,startedTime:0};panels.set(design.key,panel);
    function set(id,attrs,text){const node=panel.nodes.get(id);if(!node)throw Error('Missing '+id);for(const[k,v]of Object.entries(attrs))node.setAttribute(k,String(v));if(text!==undefined)node.textContent=text;}
    function render(){if(!panel.scene)return;const f=transferFrame(panel.time,program);applyTransferFrame(panel.scene,f,set);const line=f.step==='ready'?'Digest S1 · Msg 4개 준비':f.calls[0]?'S1 SendQ · Msg 4개 · 1회 적재 완료':'Digest S1 → S1 SendQ · 1회 적재';if(status.textContent!==line)status.textContent=line;play.textContent=panel.playing?'일시정지':panel.time>0&&panel.time<program.end?'이어 재생':'재생';play.setAttribute('aria-pressed',String(panel.playing));}
    function cancel(){if(panel.raf)cancelAnimationFrame(panel.raf);if(panel.timer)clearTimeout(panel.timer);panel.raf=0;panel.timer=0;}
    function update(){if(panel.playing)panel.time=Math.min(program.end,panel.startedTime+Math.max(0,performance.now()-panel.startedAt));}
    function stop(){update();cancel();panel.playing=false;}
    function schedule(){panel.raf=requestAnimationFrame(tick);panel.timer=setTimeout(tick,80);}
    function tick(){cancel();if(!panel.playing)return;update();render();if(panel.time>=program.end){stop();render();save();}else schedule();}
    play.addEventListener('click',()=>{if(panel.playing){stop();render();save();return;}if(panel.time>=program.end)panel.time=0;if(media.matches)panel.time=program.end;else{panel.playing=true;panel.startedAt=performance.now();panel.startedTime=panel.time;schedule();}render();save();});
    reset.addEventListener('click',()=>{stop();panel.time=0;render();save();});
    function draw(width){if(!Number.isFinite(width)||width<=0)return;width=Math.max(320,Math.round(width));if(width===panel.width)return;panel.scene=createTransferScene(width,design.key);const accessible=Array.from(board.children).filter(e=>['title','desc'].includes(e.tagName.toLowerCase()));board.replaceChildren(...accessible);board.insertAdjacentHTML('beforeend',panel.scene.markup);board.setAttribute('width',String(width));board.setAttribute('height',String(panel.scene.height));board.setAttribute('viewBox',`0 0 ${width} ${panel.scene.height}`);panel.nodes=new Map(Array.from(board.querySelectorAll('[id]')).map(e=>[e.id,e]));panel.width=width;render();}
    panel.stop=stop;panel.render=render;panel.seek=t=>{stop();panel.time=Math.max(0,Math.min(program.end,Number(t)||0));render();};draw(element.getBoundingClientRect().width||736);
    if(typeof ResizeObserver!=='undefined')new ResizeObserver(entries=>draw(entries[0].contentRect.width)).observe(element);
  }
  function restore(snapshot){const state=snapshot?.privateContent;if(!state||state.kind!==kind||state.revision===lastSaved||!Array.isArray(state.designs))return;for(const saved of state.designs){const panel=panels.get(saved.key);if(panel)panel.seek(saved.time);}}
  restore(window.openai?.widgetState);window.addEventListener('openai:set_globals',e=>restore(e.detail?.globals?.widgetState));media.addEventListener('change',()=>{if(media.matches){for(const panel of panels.values()){panel.stop();panel.render();}save();}});
  root.animation={getState:()=>({kind,designs:allStates()}),seek(key,time){panels.get(key)?.seek(time);},duration:program.end};
})();
