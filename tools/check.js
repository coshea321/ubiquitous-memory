// Smoke test of the built PWA: serves docs/, loads it in headless Chromium, checks for script errors,
// service-worker registration, an offline reload, tap-to-drive, the collapsible sector strip, and switching level mid-animation. Needs: npm i -D playwright (or a Chromium on PATH).
const http=require('http'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright');
const root=path.join(__dirname,'..','docs');
const types={'.html':'text/html','.js':'text/javascript','.png':'image/png','.webmanifest':'application/manifest+json'};
const srv=http.createServer((q,r)=>{let f=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';
  fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});r.end(d);});}).listen(8099);
(async()=>{
  const exe=process.env.CHROMIUM||(fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':undefined);
  const b=await chromium.launch(exe?{executablePath:exe}:{});const ctx=await b.newContext({viewport:{width:400,height:860}});
  const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8099/');await p.waitForFunction(()=>navigator.serviceWorker.controller||new Promise(r=>navigator.serviceWorker.ready.then(()=>r(true))));
  const sw=await p.evaluate(async()=>!!(await navigator.serviceWorker.getRegistration()));
  await p.reload();await ctx.setOffline(true);await p.reload();const offline=await p.locator('#lname').textContent();await ctx.setOffline(false);
  // The sector strip is collapsed by default, opens from its summary and closes again after a pick.
  const shut=await p.locator('#strip button').first().isHidden();
  await p.click('#sectors summary');await p.click('#strip button:nth-child(1)');const reshut=!(await p.evaluate(()=>document.getElementById('sectors').open));
  const box=await p.locator('#cv').boundingBox();const c=box.width/12;
  await p.mouse.click(box.x+c*4.5,box.y+c*1.5);await p.waitForTimeout(800);
  const moves=await p.locator('#count').textContent();
  // Switching level mid-animation: no frame of the old level may be drawn after the switch.
  await p.click('#sectors summary');await p.click('#strip button:nth-child(1)');await p.waitForTimeout(200);
  const frames=await p.evaluate(()=>new Promise(r=>{const cv=document.getElementById('cv'),out=[];
    dispatchEvent(new KeyboardEvent('keydown',{key:' '}));document.querySelector('#strip button:nth-child(2)').click();
    const t=setInterval(()=>{out.push(cv.toDataURL());if(out.length>=40){clearInterval(t);r(out);}},15);}));
  const stale=frames.filter(f=>f!==frames[frames.length-1]).length;
  console.log({errors:errs,sectorsCollapse:shut&&reshut,serviceWorker:sw,offlineTitle:offline,afterTap:moves,staleFramesAfterSwitch:stale});
  await b.close();srv.close();process.exit(errs.length||!shut||!reshut||!sw||!/Moves [1-9]/.test(moves)||stale?1:0);
})();
