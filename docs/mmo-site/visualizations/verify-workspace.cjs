const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const pw=require('C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const dir=__dirname,manifest=JSON.parse(fs.readFileSync(path.join(dir,'optimization-figures-current.json'),'utf8'));
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
let browser;
async function main(){
  assert.equal(manifest.figures.length,5);
  browser=await pw.chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const results=[];
  for(const item of manifest.figures){
    assert.equal(hash(item.sourcePath),item.sourceSha256);assert.equal(hash(item.viewerPath),item.viewerSha256);
    const page=await browser.newPage({viewport:{width:768,height:1040},colorScheme:'dark'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('file:///'+item.viewerPath,{waitUntil:'domcontentloaded'});
    const frameLocator=page.frameLocator('#codex-visualization'),play=frameLocator.locator('button[data-action="play"],button[data-study-action="play"]').first();
    await play.waitFor({state:'visible',timeout:10000});await play.click();await page.waitForTimeout(180);assert((await play.textContent()).includes('일시정지'));await play.click();
    const frame=page.frames().find(f=>f.parentFrame());assert(frame);
    const content=await frame.evaluate(()=>({svg:document.querySelectorAll('svg').length,html:document.documentElement.scrollWidth,width:innerWidth}));
    assert(content.svg>0);assert(content.html<=content.width+1);assert.deepEqual(errors,[]);results.push({number:item.number,sourceHashMatches:true,viewerHashMatches:true,standalonePlayPauseVerified:true});await page.close();
  }
  const menu=fs.readFileSync(path.join(dir,'index.html'),'utf8');for(const link of menu.matchAll(/href="([^"]+)"/g))assert(fs.existsSync(path.resolve(dir,link[1])));
  await browser.close();browser=null;
  const report={pass:true,checkedAt:new Date().toISOString(),figureCount:5,standaloneBrowserRuntimeVerified:true,browserHostVerified:false,menuLinksVerified:true,results};
  fs.writeFileSync(path.join(dir,'migration/workspace-verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}
main().catch(async error=>{console.error(error);if(browser)await browser.close();process.exitCode=1;});
