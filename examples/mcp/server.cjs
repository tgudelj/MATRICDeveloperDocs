/* Standalone synthetic MCP server. Node.js 20+, no dependencies or device access. */
'use strict';
const http = require('node:http');
const readline = require('node:readline');

function createHandler() {
    let value = 0;
    const outputSchema = {type:'object',properties:{value:{type:'number'}},required:['value'],additionalProperties:false};
    const tools = [
        {name:'get_value',description:'Read the in-memory example value.',annotations:{readOnlyHint:true},inputSchema:{type:'object',properties:{},additionalProperties:false},outputSchema},
        {name:'set_value',description:'Set the in-memory example value from 0 to 1.',inputSchema:{type:'object',properties:{value:{type:'number',minimum:0,maximum:1}},required:['value'],additionalProperties:false},outputSchema}
    ];
    return request => {
        const {id,method,params={}} = request;
        if(id === undefined) return null;
        const result = data => ({jsonrpc:'2.0',id,result:{resultType:'complete',...data}});
        if(method === 'server/discover') return result({supportedVersions:['2026-07-28'],capabilities:{tools:{}},_meta:{'io.modelcontextprotocol/serverInfo':{name:'matric-example',version:'1'}}});
        if(method === 'initialize') return {jsonrpc:'2.0',id,result:{protocolVersion:'2025-11-25',capabilities:{tools:{}},serverInfo:{name:'matric-example',version:'1'}}};
        if(method === 'tools/list') return result({tools});
        if(method === 'ping') return {jsonrpc:'2.0',id,result:{}};
        if(method !== 'tools/call' || !tools.some(t=>t.name===params.name)) return {jsonrpc:'2.0',id,error:{code:-32601,message:'Unknown method or tool'}};
        const args = params.arguments || {};
        if(params.name === 'set_value') {
            if(typeof args.value !== 'number' || !Number.isFinite(args.value) || args.value<0 || args.value>1 || Object.keys(args).some(k=>k!=='value')) return result({isError:true,content:[{type:'text',text:'Expected one numeric value from 0 to 1.'}]});
            value = args.value;
        } else if(Object.keys(args).length) return result({isError:true,content:[{type:'text',text:'get_value takes no arguments.'}]});
        return result({content:[{type:'text',text:'Example value: '+value}],structuredContent:{value}});
    };
}

function createServer() {
    const handle = createHandler();
    return http.createServer(async(request,response)=>{
        if(request.url !== '/mcp') {response.writeHead(404);response.end();return;}
        if(request.method !== 'POST') {response.writeHead(request.method==='DELETE'?202:405);response.end();return;}
        let body = '';
        try {
            for await(const chunk of request) {body+=chunk;if(body.length>65536) {response.writeHead(413);response.end();return;}}
            const message = JSON.parse(body), result = handle(message);
            if(!result) {response.writeHead(202);response.end();return;}
            if(message.method === 'tools/call') {response.writeHead(200,{'Content-Type':'text/event-stream'});response.end('data: '+JSON.stringify(result)+'\n\n');}
            else {response.writeHead(200,{'Content-Type':'application/json'});response.end(JSON.stringify(result));}
        } catch {response.writeHead(400);response.end();}
    });
}

if(require.main === module) {
    if(process.argv.includes('--stdio')) {
        const handle = createHandler();
        readline.createInterface({input:process.stdin,crlfDelay:Infinity}).on('line',line=>{
            try {const result=handle(JSON.parse(line));if(result) process.stdout.write(JSON.stringify(result)+'\n');}
            catch {process.stderr.write('Invalid JSON request\n');}
        });
    } else createServer().listen(13509,'127.0.0.1',()=>process.stderr.write('Example MCP endpoint: http://127.0.0.1:13509/mcp\n'));
}
module.exports = {createHandler,createServer};
