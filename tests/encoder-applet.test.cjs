const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');
const root = path.resolve(__dirname,'../examples/applets/matric-plugin-encoder');
let server,browser,origin;

test.before(async()=>{
  server=http.createServer((request,response)=>{
    response.setHeader('Allow-CSP-From','*');
    if(request.url==='/'){
      response.setHeader('Content-Type','text/html');
      response.end(`<iframe id="encoder" src="/applet.html#encoder-check" style="border:0;width:400px;height:400px"></iframe><script>
        window.events=[];const frame=document.querySelector('iframe');
        window.configure=parameters=>frame.contentWindow.postMessage({messageId:'PARAMSUPDATE',payload:parameters},location.origin);
        window.update=()=>frame.contentWindow.postMessage({messageId:'TOUCHSTRIPUPDATE',payload:{enabled:true,display:{version:1,width:200,height:100,layout:'$B1',items:[{key:'title',type:'text',rect:[16,10,136,24],value:'Volume',font:{size:16,weight:600}}]}}},location.origin);
        addEventListener('message',event=>{if(event.source===frame.contentWindow&&event.data?.messageId==='cce-encoder-check'){events.push(event.data.payload);if(event.data.payload.EventName==='reqvariables'){configure({KnobSize:50,KnobGap:4});update();}}});
        frame.addEventListener('load',()=>{configure({KnobSize:50,KnobGap:4});update();});
      </script>`);return;
    }
    const name=new URL(request.url,'http://localhost').pathname.slice(1);
    if(!['applet.html','applet.js','encoder.js'].includes(name)){response.writeHead(404);response.end();return;}
    response.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':'text/html');response.end(fs.readFileSync(path.join(root,name)));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({headless:true,...(process.env.MATRIC_DOCS_BROWSER?{executablePath:process.env.MATRIC_DOCS_BROWSER}:{})});
});
test.after(async()=>{await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));});

test('downloaded encoder source routes dial and touch through one action event',async t=>{
  const page=await browser.newPage();t.after(()=>page.close());const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.clock.install();await page.goto(origin);
  const frame=page.frameLocator('iframe'),center=frame.locator('#center'),dial=frame.locator('#dial');
  await frame.locator('#message').waitFor({state:'hidden'});
  await dial.focus();await page.keyboard.press('ArrowRight');
  await center.click();await frame.locator('canvas').click({position:{x:100,y:50}});
  await page.waitForFunction(()=>events.filter(event=>event.EventName==='input').length>=4);
  assert.deepEqual(await page.evaluate(()=>events.filter(event=>event.EventName==='input').map(event=>event.Data.type)),['dialRotate','dialDown','dialUp','touchTap']);
  assert.equal(await page.evaluate(()=>events.find(event=>event.Data?.type==='dialRotate').Data.ticks),1);
  assert.deepEqual(errors,[]);
});

test('documented parameter ranges keep rotated artwork and display within resized containers',async t=>{
  const page=await browser.newPage();t.after(()=>page.close());await page.goto(origin);
  const child=page.frames().find(frame=>frame.url().includes('applet.html'));
  await page.frameLocator('iframe').locator('#message').waitFor({state:'hidden'});
  for(const [width,height,KnobSize,KnobGap] of [[400,400,50,4],[800,100,100,100],[100,700,10,0]]){
    await page.evaluate(values=>{const frame=document.querySelector('iframe');frame.style.width=values.width+'px';frame.style.height=values.height+'px';configure({KnobSize:values.KnobSize,KnobGap:values.KnobGap});}, {width,height,KnobSize,KnobGap});
    await child.waitForFunction(([width,height])=>innerWidth===width&&innerHeight===height,[width,height]);
    await page.waitForTimeout(80);
    const geometry=await child.evaluate(()=>{const box=id=>{const b=document.getElementById(id).getBoundingClientRect();return{x:b.x,y:b.y,right:b.right,bottom:b.bottom};};return{strip:box('surface'),dial:box('dial')};});
    for(const box of Object.values(geometry))assert.ok(box.x>=0&&box.y>=0&&box.right<=width+.1&&box.bottom<=height+.1);
    assert.ok(geometry.dial.y>=geometry.strip.bottom);
  }
});

test('downloaded custom layout example renders its raw SVG, background and indicators',async t=>{
  const folder=path.resolve(__dirname,'../examples/stream-deck/layouts');
  const layout=JSON.parse(fs.readFileSync(path.join(folder,'level.json'),'utf8'));
  assert.equal(layout.controller,'Encoder');assert.equal(new Set(layout.items.map(item=>item.key)).size,layout.items.length);
  for(const item of layout.items){const [x,y,w,h]=item.rect;assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=200&&y+h<=100);}
  const display={version:1,width:200,height:100,layout:'layouts/level.json',items:layout.items.map(item=>({...item})),
    background:'data:image/svg+xml;base64,'+fs.readFileSync(path.join(folder,'background.svg')).toString('base64')};
  for(const item of display.items)if(item.type==='pixmap')item.value='data:image/svg+xml;base64,'+Buffer.from(item.value).toString('base64');
  const page=await browser.newPage();t.after(()=>page.close());const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(origin);const child=page.frames().find(frame=>frame.url().includes('applet.html'));
  await page.frameLocator('iframe').locator('#message').waitFor({state:'hidden'});
  await page.evaluate(display=>document.querySelector('iframe').contentWindow.postMessage({messageId:'TOUCHSTRIPUPDATE',payload:{enabled:true,display}},location.origin),display);
  await child.waitForFunction(()=>{const c=document.querySelector('canvas'),ctx=c.getContext('2d'),s=c.width/200;
    const meter=ctx.getImageData(20*s,69*s,1,1).data,bg=ctx.getImageData(1*s,99*s,1,1).data;
    return meter[1]===200&&meter[2]===206&&bg[0]===16&&bg[1]===24&&bg[2]===32;});
  assert.deepEqual(errors,[]);
});
