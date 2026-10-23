/** Real local Chromium + bundled Pyodide test. Synthetic data; no upstream I/O. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const mime={'.mjs':'application/javascript','.js':'application/javascript','.html':'text/html','.json':'application/json','.wasm':'application/wasm','.zip':'application/zip','.py':'text/plain','.css':'text/css'};
const server=http.createServer((req,res)=>{const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1);if(rel.includes('..')){res.writeHead(400).end();return;}const file=rel.startsWith('checks/')?path.join(root,rel):rel==='engine-worker.js'?path.join(root,'server/entrypoints',rel):path.join(root,'public',rel);try{const data=fs.readFileSync(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;
if(process.argv.includes('--serve-only')){console.log(`Synthetic browser harness: http://127.0.0.1:${port}/checks/live/browser.html`);await new Promise(()=>{});}
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ridgeq-live-chromium-'));
const chrome=spawn(process.env.CHROMIUM||'/usr/bin/chromium',['--headless','--disable-gpu','--disable-background-networking','--disable-component-update','--no-first-run','--remote-debugging-port=0','--remote-allow-origins=http://localhost',`--user-data-dir=${tmp}`,'about:blank'],{stdio:['ignore','ignore','pipe']});
let chromeLog='';chrome.stderr.on('data',chunk=>chromeLog+=chunk);
let socket;const pending=new Map();let seq=0;
const command=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
try{
 for(let n=0;n<500&&!fs.existsSync(path.join(tmp,'DevToolsActivePort'));n++)await new Promise(r=>setTimeout(r,20));
 const debugPort=fs.readFileSync(path.join(tmp,'DevToolsActivePort'),'utf8').split('\n')[0];const targets=await(await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
 socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});socket.onmessage=event=>{const message=JSON.parse(event.data);if(message.id){const waiter=pending.get(message.id);pending.delete(message.id);if(message.error)waiter?.reject(new Error(JSON.stringify(message.error)));else waiter?.resolve(message.result);}};
 await command('Network.enable');await command('Network.setBlockedURLs',{urls:['https://*','http://*']});
 // Allow localhost explicitly by intercepting requests instead of broad wildcard policy.
 await command('Network.setBlockedURLs',{urls:[]});await command('Fetch.enable',{patterns:[{urlPattern:'*'}]});
 const original=socket.onmessage;socket.onmessage=event=>{const message=JSON.parse(event.data);if(message.method==='Fetch.requestPaused'){const request=message.params;const local=new URL(request.request.url).hostname==='127.0.0.1';command(local?'Fetch.continueRequest':'Fetch.failRequest',local?{requestId:request.requestId}:{requestId:request.requestId,errorReason:'BlockedByClient'}).catch(()=>{});}else original(event);};
 await command('Page.navigate',{url:`http://127.0.0.1:${port}/checks/live/browser.html`});
 let result;for(let n=0;n<1200;n++){const value=await command('Runtime.evaluate',{expression:'window.__liveTestResult',returnByValue:true});if(value.result?.value){result=value.result.value;break;}await new Promise(r=>setTimeout(r,100));}
 if(!result)throw new Error('Browser test did not finish within 120 seconds');console.log(JSON.stringify(result,null,2));if(result.status!=='PASS')process.exitCode=1;
}catch(error){console.error(error);console.error(chromeLog.slice(-1500));process.exitCode=1;}finally{socket?.close();chrome.kill();server.close();}
