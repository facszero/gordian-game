import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync('dist/sw.js','utf8');
function worker(){
 const handlers={},deleted=[],cached=[];
 const context={URL,fetch:async request=>({network:request}),caches:{open:async()=>({addAll:async files=>cached.push(...files),match:async key=>key==='./index.html'?{offline:true}:undefined}),keys:async()=>['gordian-old','unrelated-cache'],delete:async key=>deleted.push(key)},self:{location:{origin:'https://game.example'},registration:{scope:'https://game.example/play/'},addEventListener:(type,handler)=>handlers[type]=handler,skipWaiting:()=>{context.skipped=true;}}};
 vm.runInNewContext(source,context);return {handlers,context,deleted,cached};
}
test('offline bundle includes every declared resource and both install icons',async()=>{
 const w=worker();let job;w.handlers.install({waitUntil:p=>job=p});await job;
 for(const file of w.cached)assert.ok(existsSync('dist/'+file.slice(2)),file);
 for(const file of ['./index.html','./src/game.js','./interface.css','./icons/icon-192.png','./icons/icon-512.png'])assert.ok(w.cached.includes(file));
 assert.ok(!w.cached.some(file=>file.includes('preview')));
 assert.ok(!w.cached.some(file=>file.startsWith('./assets/')&&!file.endsWith('.webp')));
 const manifest=JSON.parse(readFileSync('dist/manifest.json','utf8'));assert.equal(manifest.orientation,'landscape');assert.equal(manifest.display,'standalone');
});
test('offline navigation works under a hosting subpath; other origins are untouched',async()=>{
 const w=worker();let response;
 w.handlers.fetch({request:{method:'GET',mode:'navigate',url:'https://game.example/play/?launch=home'},respondWith:p=>response=p});assert.equal((await response).offline,true);
 let intercepted=false;w.handlers.fetch({request:{method:'GET',url:'https://other.example/file'},respondWith:()=>intercepted=true});assert.equal(intercepted,false);
});
test('updates preserve unrelated caches and only activate on explicit request',async()=>{
 const w=worker();let job;w.handlers.activate({waitUntil:p=>job=p});await job;assert.deepEqual(w.deleted,['gordian-old']);assert.equal(w.context.skipped,undefined);w.handlers.message({data:{type:'SKIP_WAITING'}});assert.equal(w.context.skipped,true);
});
