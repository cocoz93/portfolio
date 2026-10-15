const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'..'),source=fs.readFileSync(path.resolve(dir,'../sector-bundle-pcb-studies-v4/design-studies-template.html'),'utf8');
const styles=source.slice(0,source.indexOf('</style>')+8),section=source.match(/<section id="bundle-pcb-silkscreen"[\s\S]*?<\/section>/)?.[0],script=source.slice(source.indexOf('<script>'));assert(section);
const template=styles+'\n<div id="sector-bundle-pcb-studies-v4">\n'+section+'\n</div>\n'+script;
fs.writeFileSync(path.join(dir,'design-studies-template.html'),template.replaceAll('sector-bundle-pcb-studies-v4','sector-bundle-sendout-v5').replaceAll('bundle-pcb-silkscreen','bundle-sendout').replaceAll('pcb-silkscreen-title','sendout-title').replaceAll('pcb-silkscreen-desc','sendout-desc'),'utf8');
