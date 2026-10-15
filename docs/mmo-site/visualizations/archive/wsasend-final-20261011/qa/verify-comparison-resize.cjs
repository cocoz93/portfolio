const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const dir=path.resolve(__dirname,'..'),checks=[];
function check(name,test){test();checks.push(name);}
const fragment=fs.readFileSync(path.join(dir,'wsasend-design-compare.html'),'utf8');
const runtime=fs.readFileSync(path.join(__dirname,'comparison-runtime.js'),'utf8');
let width=736,insideDelivery=false,writesDuringDelivery=0,layoutWrites=0;
let nextId=1,frameTime=0;
const frames=new Map(),observers=[],redraws=[[],[]],snapshots=[];
function write(){layoutWrites++;if(insideDelivery)writesDuringDelivery++;}
function eventTarget(extra={}){
  const listeners=new Map();
  return {...extra,addEventListener(name,fn){listeners.set(name,fn);},dispatch(name,event){listeners.get(name)?.(event);}};
}
const panels=[0,1].map(i=>eventTarget({hidden:i===1,style:new Proxy({}, {set(target,key,value){write();target[key]=value;return true;}})}));
const buttons=[0,1].map(i=>eventTarget({attrs:{'aria-pressed':String(i===0)},setAttribute(k,v){this.attrs[k]=v;}}));
const comparison={getBoundingClientRect:()=>({width}),querySelectorAll:selector=>selector==='[data-comparison-panel]'?panels:buttons,appendChild(){throw Error('Unexpected startup diagnostic');}};
const states=[0,1].map(()=>({time:0,playing:false,phase:'done',callsBefore:4,callsAfter:1}));
function view(index){
  const state=states[index];
  return {root:{},redraw(w){write();redraws[index].push(w);},animation:{
    timings:{end:22580},getState:()=>({...state}),pause(){state.playing=false;},
    seek(time){state.time=time;state.playing=false;},play(){state.playing=true;}
  }};
}
class Observer{
  constructor(callback){this.callback=callback;observers.push(this);}
  observe(target){this.target=target;}
  deliver(w){insideDelivery=true;try{this.callback([{target:this.target,contentRect:{width:w,height:600}}]);}finally{insideDelivery=false;}}
}
const window=eventTarget({openai:{setWidgetState(snapshot){snapshots.push(snapshot);return Promise.resolve();}}});
const document=eventTarget({getElementById:()=>comparison,createElement(){throw Error('Unexpected startup error');}});
const context=vm.createContext({window,document,ResizeObserver:Observer,
  requestAnimationFrame(fn){const id=nextId++;frames.set(id,fn);return id;},
  cancelAnimationFrame(id){frames.delete(id);},makeView:view});
function flush(){const pending=[...frames.values()];frames.clear();frameTime+=16;for(const fn of pending)fn(frameTime);}
const controlled=runtime.replace('/*INITIALIZERS*/','function initializePrevious(){return makeView(0);} function initializeCurrent(){return makeView(1);}');
new vm.Script(controlled).runInContext(context);

check('one-comparison-observer-no-child-observers',()=>{
  assert.equal(observers.length,1);
  assert.equal((fragment.match(/new ResizeObserver\(/g)||[]).length,1);
});
check('initial-layout-waits-for-animation-frame',()=>{
  assert.equal(layoutWrites,0);assert.equal(frames.size,1);
  assert.deepEqual(states.map(s=>s.time),[22580,22580]);
});
check('observer-delivery-does-not-write-layout',()=>{
  observers[0].deliver(736);assert.equal(writesDuringDelivery,0);assert.equal(layoutWrites,0);
});
check('initial-frame-draws-both-at-visible-width',()=>{
  flush();assert.deepEqual(redraws,[[736],[736]]);
  assert.equal(panels[0].style.minHeight,panels[1].style.minHeight);
});
check('height-only-notification-does-not-redraw',()=>{
  const count=layoutWrites;observers[0].deliver(736);flush();assert.equal(layoutWrites,count);
});
check('resize-burst-is-coalesced-and-uses-latest-width',()=>{
  const count=layoutWrites;observers[0].deliver(700);observers[0].deliver(500);observers[0].deliver(320);
  assert.equal(layoutWrites,count);assert.equal(frames.size,1);flush();
  assert.deepEqual(redraws,[[736,320],[736,320]]);assert.equal(panels[0].style.minHeight,'2354px');
});
check('switch-preserves-time-and-does-not-resize-in-callback',()=>{
  states[0].time=8500;states[0].playing=true;
  const count=layoutWrites;buttons[1].dispatch('click');
  assert.equal(states[0].playing,false);assert.equal(states[1].time,8500);
  assert.deepEqual(panels.map(p=>p.hidden),[true,false]);
  assert.deepEqual(buttons.map(b=>b.attrs['aria-pressed']),['false','true']);
  assert.equal(layoutWrites,count);assert.equal(snapshots.length,1);
});
check('zero-width-hidden-container-does-not-overwrite-layout',()=>{
  const count=layoutWrites;observers[0].deliver(0);assert.equal(frames.size,0);assert.equal(layoutWrites,count);
});
check('restoring-desktop-layout-does-not-loop',()=>{
  observers[0].deliver(1024);flush();
  assert.equal(redraws[0].at(-1),1024);assert.equal(redraws[1].at(-1),1024);
  const count=layoutWrites;
  for(let i=0;i<5;i++){observers[0].deliver(1024);flush();}
  assert.equal(layoutWrites,count);assert.equal(writesDuringDelivery,0);
});
check('saved-design-and-playhead-still-restore',()=>{
  window.dispatch('openai:set_globals',{detail:{globals:{widgetState:{privateContent:{kind:'wsasend-pcb-design-comparison-v2',selected:0,time:4000,playing:true}}}}});
  assert.deepEqual(panels.map(p=>p.hidden),[false,true]);assert.equal(states[0].time,4000);assert.equal(states[0].playing,true);
});
check('real-child-draw-functions-consume-shared-width',()=>{
  assert.equal((fragment.match(/function draw\(width\)/g)||[]).length,2);
  assert.equal((fragment.match(/root\.getBoundingClientRect\(\)/g)||[]).length,0);
});

// Negative control: execute the actual former drawing function inside observer
// delivery. This detects the synchronous height mutation present in both originals.
for(const file of ['wsasend-pcb-previous.html','wsasend-pcb-animation.html']){
  check('former-direct-draw-is-detected-'+file,()=>{
    const source=fs.readFileSync(path.join(dir,file),'utf8');
    const draw=source.slice(source.indexOf('  function draw()'),source.indexOf('  function rowModel'));
    let mutations=0;
    const svg={querySelector:()=>null,setAttribute(){if(insideDelivery)mutations++;}};
    const testContext=vm.createContext({root:{getBoundingClientRect:()=>({width:736})},svg,scene:null,lastWidth:0,mode:'desktop',rows:[],
      node:()=>({setAttribute(){}}),drawRow:()=>({}),textAt(){},line(){},paint(){},ResizeObserver:Observer});
    const observerCount=observers.length;
    new vm.Script(draw+'\nnew ResizeObserver(draw).observe(root);').runInContext(testContext);
    observers[observerCount].deliver(736);
    assert.ok(mutations>0,'The former observer must mutate SVG dimensions during delivery.');
  });
}
fs.writeFileSync(path.join(__dirname,'comparison-resize-verification.json'),JSON.stringify({
  scope:'Controlled observer-delivery regression checks, not a browser or Codex inline-host render.',
  observedHostError:'ResizeObserver loop completed with undelivered notifications.',checks
},null,2));
console.log(JSON.stringify({passed:checks.length,scope:'resize-delivery-regression',writesDuringDelivery}));
