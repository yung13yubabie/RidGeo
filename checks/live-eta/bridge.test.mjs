import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {PythonWorkerTransport} from '../../public/transport.js';
import {createPythonEngine} from '../../public/python-engine.mjs';

const payload={gpx_b64:'PHg+PC94Pg==',owner_revision:'route-1',settings:{}};
class FakeWorker {
  sent=[]; terminated=false;
  postMessage(message){this.sent.push(message);}
  terminate(){this.terminated=true;}
  reply(request,result){this.onmessage({data:{type:'result',generation:request.generation,requestId:request.requestId,ok:true,result}});}
}
test('live requests never preempt existing work; stale replies never own result',async()=>{
  const worker=new FakeWorker();const transport=new PythonWorkerTransport({workerFactory:()=>worker});
  const foreground=transport.request('inspect',{gpx_b64:'x'});
  await assert.rejects(transport.request('live_eta',payload),error=>error.code==='worker_busy');
  assert.equal(worker.terminated,false);assert.equal(worker.sent.length,1);
  worker.reply(worker.sent[0],{inspected:true});await foreground;
  const live=transport.request('live_eta',payload);
  worker.reply(worker.sent[0],{stale:true});assert.ok(transport.pending);
  worker.reply(worker.sent[1],{owner_revision:'route-1'});
  assert.deepEqual(await live,{owner_revision:'route-1'});transport.dispose();
});
test('aborting live request terminates active worker without publishing stale result',async()=>{
  const worker=new FakeWorker();const transport=new PythonWorkerTransport({workerFactory:()=>worker});
  const controller=new AbortController();const live=transport.request('live_eta',payload,{signal:controller.signal});
  controller.abort();await assert.rejects(live,error=>error.name==='AbortError');
  assert.equal(worker.terminated,true);assert.equal(transport.pending,null);
});
function engineFixture({admission=true,corrupt=false}={}) {
  const calls=[],written=new Map();
  const runtime={version:'314.0.7',FS:{mkdirTree(){},writeFile(path,bytes){written.set(path,bytes);}},async runPythonAsync(){},globals:{get(name){
    const fn=(...args)=>{calls.push([name,...args]);
      if(name==='_trail_runtime_info')return JSON.stringify({python:'3.14.8',expat:'expat_2.9.0'});
      if(name==='_trail_admission_handle')return JSON.stringify(admission?{ok:true}:{ok:false,error:{code:'rejected',admission_rejected:true}});
      if(name==='_trail_live_eta_handle')return JSON.stringify({ok:true,result:{owner_revision:JSON.parse(args[0]).owner_revision}});
      throw new Error(`Unexpected handler ${name}`);
    };fn.destroy=()=>{};return fn;
  }}};
  const engine=createPythonEngine({loadPyodide:async()=>runtime,indexURL:'unused',readAsset:async path=>{
    const bytes=new Uint8Array(await readFile(new URL('../../public/'+path,import.meta.url)));
    if(corrupt&&path==='python/live_eta.py')bytes[0]^=1;
    return bytes;
  },sha256:async bytes=>createHash('sha256').update(bytes).digest('hex')});
  return {engine,calls,written};
}
test('live engine passes common GPX admission before verified Python adapter',async()=>{
  const {engine,calls,written}=engineFixture();
  assert.deepEqual(await engine.request('live_eta',payload),{ok:true,result:{owner_revision:'route-1'}});
  assert.deepEqual(calls.map(x=>x[0]),['_trail_runtime_info','_trail_admission_handle','_trail_live_eta_handle']);
  assert.equal(calls[1][1],'live_eta');assert.equal(calls[2].length,2);
  assert.ok(written.has('/trail_runtime/live_eta.py'));
});
test('admission rejection never loads or runs live module',async()=>{
  const {engine,calls,written}=engineFixture({admission:false});
  assert.equal((await engine.request('live_eta',payload)).error.admission_rejected,true);
  assert.equal(written.has('/trail_runtime/live_eta.py'),false);
  assert.equal(calls.some(x=>x[0]==='_trail_live_eta_handle'),false);
});
test('live source digest mismatch fails closed',async()=>{
  const {engine,calls}=engineFixture({corrupt:true});
  await assert.rejects(engine.request('live_eta',payload),/integrity mismatch/);
  assert.equal(calls.some(x=>x[0]==='_trail_live_eta_handle'),false);
});
test('malformed outer live payload is rejected before runtime initialization',async()=>{
  const {engine,calls}=engineFixture();
  assert.equal((await engine.request('live_eta',{...payload,extra:true})).error.code,'invalid_request');
  assert.equal(calls.length,0);
});
