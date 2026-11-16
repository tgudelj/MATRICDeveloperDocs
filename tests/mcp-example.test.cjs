const test = require('node:test');
const assert = require('node:assert/strict');
const {calculateValue,calculateFromVariables} = require('../examples/mcp/calculations.cjs');
const {createServer,createHandler} = require('../examples/mcp/server.cjs');

test('MCP example discovers tools and preserves typed values over JSON and SSE',async t=>{
    const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    t.after(()=>new Promise(resolve=>server.close(resolve)));
    let id=0;
    async function send(method,params) {
        const response=await fetch('http://127.0.0.1:'+server.address().port+'/mcp',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:++id,method,params})});
        assert.equal(response.status,200);
        const text=await response.text();return JSON.parse(text.startsWith('data: ')?text.slice(6):text).result;
    }
    assert.deepEqual((await send('server/discover')).supportedVersions,['2026-07-28']);
    const tools=(await send('tools/list')).tools;assert.equal(tools.length,2);assert.equal(tools[0].annotations.readOnlyHint,true);
    assert.equal((await send('tools/call',{name:'get_value'})).structuredContent.value,0);
    assert.equal((await send('tools/call',{name:'set_value',arguments:{value:calculateValue(50, {}, {value:50})}})).structuredContent.value,0.5);
    assert.equal((await send('tools/call',{name:'set_value',arguments:{value:'0.8'}})).isError,true);
    assert.equal((await send('tools/call',{name:'get_value'})).structuredContent.value,0.5);
    assert.equal((await send('initialize')).protocolVersion,'2025-11-25');
});

test('stdio handler emits no response to notifications and has independent state',()=>{
    const handle=createHandler();assert.equal(handle({method:'notifications/initialized'}),null);
    assert.equal(handle({id:1,method:'tools/call',params:{name:'get_value'}}).result.structuredContent.value,0);
});

test('documented slider function keeps numeric endpoints and clamps overshoot',()=>{
    assert.deepEqual([-20,0,25,50,100,120].map(value=>calculateValue(value,{}, {value})),[0,0,0.25,0.5,1,1]);
});

test('browser-inserted JSON field reference reads the current typed value without changing the variable',()=>{
    const variables={light_status:{brightness:65}};
    assert.equal(calculateFromVariables(null,variables,{}),0.65);
    variables.light_status.brightness=0;
    assert.equal(calculateFromVariables(null,variables,{}),0);
    assert.equal(variables.light_status.brightness,0);
});
