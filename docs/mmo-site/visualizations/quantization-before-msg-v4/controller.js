(() => {
  const kind='quantization-figure-five-before-msg-v4',root=document.getElementById(kind);if(!root)return;
  const boards={before:root.querySelector('[data-board="before"]'),after:root.querySelector('[data-board="after"]')},play=root.querySelector('[data-action="play"]'),reset=root.querySelector('[data-action="reset"]'),status=root.querySelector('[data-status]'),program=createProgram(),media=matchMedia('(prefers-reduced-motion: reduce)');
  let time=program.end,playing=false,scenes={},nodes={},lastWidth=0,raf=0,timer=0,startedAt=0,startedTime=0,revision=0,lastSaved='';
  const session=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  function setter(side){return(id,attrs,text)=>{const node=nodes[side].get(id);if(!node)throw Error('Missing '+id);for(const[k,v]of Object.entries(attrs))node.setAttribute(k,String(v));if(text!==undefined)node.textContent=text;};}
  function getState(){const f=comparisonFrame(time,program);return {kind,figure:5,time,playing,activePanel:f.active,phase:f.phase,scope:"coordinate fields only",serverBefore:[f.before.serverX,f.before.serverY],serverAfter:[f.after.serverX,f.after.serverY],qx:quantize(EXAMPLE.x),qy:quantize(EXAMPLE.y),coordinateBytesBefore:COORD_BYTES_BEFORE,coordinateBytesAfter:COORD_BYTES_AFTER,quantizationProgress:f.after.quantized,msgStoredBefore:f.before.filled===1,msgStoredAfter:f.after.filled===1,conversionBeforeMsg:true};}
  function render(){if(!scenes.before)return;const f=comparisonFrame(time,program);applyFrame(scenes.before,f.before,setter('before'));applyFrame(scenes.after,f.after,setter('after'));for(const side of['before','after']){const inactive=f.active!=='both'&&(f.active==='transition'?side==='before':side!==f.active);boards[side].style.opacity=inactive?'.32':'1';boards[side].style.filter=inactive?'grayscale(1)':'none';}if(status.textContent!==f.phase)status.textContent=f.phase;play.textContent=playing?'일시정지':time>=program.end?'재생':time>0?'이어 재생':'재생';play.setAttribute('aria-pressed',String(playing));}
  function save(){if(!window.openai?.setWidgetState)return;lastSaved=session+':'+(++revision);window.openai.setWidgetState({modelContent:getState(),privateContent:{kind,revision:lastSaved,time}}).catch(()=>{});}
  function cancel(){if(raf)cancelAnimationFrame(raf);if(timer)clearTimeout(timer);raf=0;timer=0;}
  function update(){if(playing)time=Math.min(program.end,startedTime+Math.max(0,performance.now()-startedAt));}
  function stop(){update();cancel();playing=false;}
  function schedule(){raf=requestAnimationFrame(tick);timer=setTimeout(tick,80);}
  function tick(){cancel();if(!playing)return;update();render();if(time>=program.end){stop();render();save();}else schedule();}
  play.addEventListener('click',()=>{if(playing){stop();render();save();return;}if(time>=program.end)time=0;if(media.matches)time=program.end;else{playing=true;startedAt=performance.now();startedTime=time;schedule();}render();save();});
  reset.addEventListener('click',()=>{stop();time=0;render();save();});
  function draw(width){if(!Number.isFinite(width)||width<=0)return;width=Math.max(320,Math.round(width));if(width===lastWidth)return;const panelWidth=width;root.setAttribute('data-layout','rows');for(const side of['before','after']){const scene=createScene(panelWidth,side),board=boards[side],accessible=Array.from(board.children).filter(el=>['title','desc'].includes(el.tagName.toLowerCase()));scenes[side]=scene;board.replaceChildren(...accessible);board.insertAdjacentHTML('beforeend',scene.markup);board.setAttribute('width',String(panelWidth));board.setAttribute('height',String(scene.height));board.setAttribute('viewBox',`0 0 ${panelWidth} ${scene.height}`);nodes[side]=new Map(Array.from(board.querySelectorAll('[id]')).map(el=>[el.id,el]));}lastWidth=width;render();}
  function restore(snapshot){const s=snapshot?.privateContent;if(!s||s.kind!==kind||s.revision===lastSaved)return;stop();time=Math.max(0,Math.min(program.end,Number(s.time)||0));render();}
  draw(root.getBoundingClientRect().width||736);restore(window.openai?.widgetState);
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(entries=>draw(entries[0].contentRect.width)).observe(root);
  window.addEventListener('openai:set_globals',e=>restore(e.detail?.globals?.widgetState));media.addEventListener('change',()=>{if(media.matches){stop();render();save();}});
  root.animation={getState,seek(t){stop();time=Math.max(0,Math.min(program.end,Number(t)||0));render();},duration:program.end};
})();
