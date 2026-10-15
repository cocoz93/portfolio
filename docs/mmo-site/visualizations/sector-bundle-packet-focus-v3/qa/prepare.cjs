const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'..'),previous=fs.readFileSync(path.resolve(dir,'../sector-bundle-layout-studies-v2/design-studies-template.html'),'utf8');
const styles=previous.slice(0,previous.indexOf('</style>')+8),section=previous.match(/<section id="bundle-study-packet"[\s\S]*?<\/section>/)?.[0],script=previous.slice(previous.indexOf('<script>'));
assert(section);const template=styles+'\n<div id="sector-bundle-layout-studies-v2">\n'+section.replace(' hidden>','>')+'\n</div>\n'+script;
fs.writeFileSync(path.join(dir,'design-studies-template.html'),template.replaceAll('sector-bundle-layout-studies-v2','sector-bundle-packet-focus-v3').replaceAll('sector-bundle-design-studies-v2','sector-bundle-packet-focus-v3').replaceAll('bundle-study-packet','bundle-focus-packet').replaceAll('study-packet-title','focus-packet-title').replaceAll('study-packet-desc','focus-packet-desc'),'utf8');
