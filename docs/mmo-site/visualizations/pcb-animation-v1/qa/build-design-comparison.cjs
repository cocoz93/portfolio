const fs=require('fs'),path=require('path'),vm=require('vm');
const dir=path.resolve(__dirname,'..');
const styles=[],initializers=[];
let markup=fs.readFileSync(path.join(__dirname,'comparison-markup.html'),'utf8');
const faces=new Set();
function buildVariant(file,key,functionName){
  let fragment=fs.readFileSync(path.join(dir,file),'utf8');
  const id='wsasend-pcb-comparison-'+key;
  fragment=fragment.replaceAll('wsasend-pcb-animation-v1',id)
    .replaceAll('pcb-animation-title','pcb-comparison-'+key+'-title')
    .replaceAll('pcb-animation-description','pcb-comparison-'+key+'-description')
    .replaceAll('pcb-msg-clip-','pcb-comparison-'+key+'-msg-clip-');
  fragment=fragment.replaceAll(/<style>([\s\S]*?)<\/style>/g,(_,css)=>{
    styles.push(css.replace(/@font-face\{[^}]+\}/g,face=>{if(faces.has(face))return '';faces.add(face);return face;}));
    return '';
  });
  const scripts=[...fragment.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  if(scripts.length!==1)throw Error('Expected one animation initializer: '+file);
  let body=scripts[0][1].trim();
  if(!body.startsWith('(() => {')||!body.endsWith('})();'))throw Error('Unexpected initializer wrapper');
  body=body.slice('(() => {'.length,-'})();'.length);
  const assignments=body.match(/root\.animation=Object\.freeze/g)||[];
  if(assignments.length!==1)throw Error('Expected one API declaration');
  body=body.replace('root.animation=Object.freeze','const animation=Object.freeze');
  body=body.replace(/  function saveState\(\) \{[\s\S]*?\n  \}\n  function restore\(/,
    '  function saveState(){persistComparison();}\n  function restore(');
  body=body.replace('  window.addEventListener("openai:set_globals",event=>restore(event.detail?.globals?.widgetState));','');
  body=body.replace('  restore(window.openai?.widgetState);','');
  // The comparison owns sizing. Hidden panels cannot provide a useful width,
  // and ResizeObserver callbacks must not rebuild a scene synchronously.
  const drawStart='  function draw() {\n    const width=Math.max(300,root.getBoundingClientRect().width);';
  if(!body.includes(drawStart))throw Error('Expected measured draw function: '+file);
  body=body.replace(drawStart,'  function draw(width) {\n    if(!Number.isFinite(width)||width<=0)return;\n    width=Math.max(300,width);');
  const childSizing='  draw();\n  new ResizeObserver(draw).observe(root);';
  if(!body.includes(childSizing))throw Error('Expected child sizing observer: '+file);
  body=body.replace(childSizing,'');
  initializers.push('function '+functionName+'(){'+body+'\nreturn {root,animation,redraw:draw};\n}');
  fragment=fragment.replace(scripts[0][0],'');
  return fragment.trim();
}
for(const [marker,file,key,name] of [['<!--PREVIOUS-->','wsasend-pcb-previous.html','previous','initializePrevious'],['<!--CURRENT-->','wsasend-pcb-animation.html','current','initializeCurrent']]){
  if(markup.split(marker).length!==2)throw Error('Unique marker missing');
  markup=markup.replace(marker,()=>buildVariant(file,key,name));
}
styles.push(fs.readFileSync(path.join(__dirname,'comparison-navigation.html'),'utf8').match(/<style>([\s\S]*?)<\/style>/)[1]);
let script=fs.readFileSync(path.join(__dirname,'comparison-runtime.js'),'utf8');
if(script.split('/*INITIALIZERS*/').length!==2)throw Error('Unique initializer slot missing');
script=script.replace('/*INITIALIZERS*/',()=>initializers.join('\n'));
new vm.Script(script,{filename:'wsasend-design-compare'});
const content='<style>\n'+styles.join('\n')+'\n</style>\n'+markup+'\n<script>\n'+script+'\n</script>\n';
if(Buffer.byteLength(content)>=256*1024)throw Error('Comparison should fit below 256 KiB');
fs.writeFileSync(path.join(dir,'wsasend-design-compare.html'),content);
fs.writeFileSync(path.join(dir,'wsasend-design-comparison.html'),content);
console.log(JSON.stringify({bytes:Buffer.byteLength(content),scripts:1,styles:1,fontFaces:faces.size}));
