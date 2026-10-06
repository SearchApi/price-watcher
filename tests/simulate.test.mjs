import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createStore} from '../store.mjs';
import {createNotifier} from '../notify.mjs';
import {simulateNext,seedDemo} from '../simulate.mjs';
import {searchFixture,detailFixture} from './fixtures.mjs';
const tick=()=>new Promise(r=>setTimeout(r,10));
async function setup(t,{demo=true,notifier=null}={}){
  const dir=await mkdtemp(join(tmpdir(),'price-watch-sim-'));t.after(()=>rm(dir,{recursive:true,force:true}));let calls=0;
  const store=createStore({path:join(dir,'state.json'),demo,notifier,clock:()=>'2026-10-01T12:00:00.000Z',provider:async p=>{calls++;return structuredClone(p.engine==='google_shopping'?searchFixture:detailFixture);}});
  let s=await store.get();s=await store.act({action:'search',query:'StudioMouse Pro',revision:s.revision});const se=s.searches.at(-1);
  s=await store.act({action:'inspect',searchId:se.id,candidateId:se.candidates[0].id,revision:s.revision});const d=s.drafts.at(-1);
  s=await store.act({action:'watch',draftId:d.id,variant:'Black',accepted:[d.offers[0].key,d.offers[1].key],target:95,revision:s.revision});
  return {dir,store,id:s.products[0].id,get calls(){return calls;}};
}
test('simulated week: calm days, one small move, one drop that reaches a nearby target; no provider calls',async t=>{
  const log=[],notifier=createNotifier({env:{RESEND_API_KEY:'k',ALERT_EMAIL_TO:'a@example.com'},fetcher:async(u,i)=>{log.push(JSON.parse(i.body));return {ok:true,status:200,json:async()=>({})};}});
  const f=await setup(t,{notifier}),before=f.calls;let s=await f.store.get();const lows=[];
  for(let i=0;i<5;i++){s=await f.store.act({action:'simulate',id:f.id,revision:s.revision});await tick();lows.push(s.products[0].summary.lowest);}
  const p=s.products[0];assert.equal(f.calls,before);assert.equal(p.snapshots.length,6);assert.ok(p.snapshots.slice(1).every(x=>x.simulated&&x.source.provider==='Simulation'));
  assert.deepEqual(lows,[9900,9900,9900,9499,9499]);assert.equal(p.summary.targetHit,true);
  assert.equal(p.snapshots[2].offers.find(o=>o.seller==='Example Supply').priceCents,10699);
  assert.equal(Date.parse(p.snapshots[5].capturedAt)-Date.parse(p.snapshots[0].capturedAt),5*86400000);
  assert.equal(log.length,2);assert.ok(log.every(m=>m.subject.startsWith('[Simulated] ')&&/Simulated check in demo mode/.test(m.text)));assert.match(log[1].subject,/target price reached/);
});
test('simulation exists only in demo mode, and demo mode never runs a real check',async t=>{
  const real=await setup(t,{demo:false});await assert.rejects(real.store.act({action:'simulate',id:real.id,revision:(await real.store.get()).revision}),/only in demo mode/);
  const demo=await setup(t),calls=demo.calls;await assert.rejects(demo.store.act({action:'refresh',id:demo.id,revision:(await demo.store.get()).revision}),/Simulate next day/);assert.equal(demo.calls,calls);
});
test('a far target is not forced: the drop is 5% and prices keep a retail look',()=>{
  const offer=(key,seller,priceCents)=>({key,seller,priceCents,price:'',eligible:true});
  const p={scope:{currency:'USD'},targetCents:100000,snapshots:[{capturedAt:'2026-10-01T00:00:00Z',offers:[offer('a','A',144520),offer('b','B',166997)],accepted:['a','b']},{simulated:true},{simulated:true},{simulated:true}].map((x,i,all)=>i?{...all[0],...x}:x)};
  const next=simulateNext(p).snapshot.offers.find(o=>o.key==='a');assert.equal(next.priceCents,137299);assert.equal(next.price,'$1,372.99');
});
test('seeding copies the real workspace once, moves history back and leaves the real file alone',async t=>{
  const f=await setup(t,{demo:false}),real=join(f.dir,'state.json'),demo=join(f.dir,'demo.json'),original=await readFile(real,'utf8'),now=Date.parse('2026-10-10T00:00:00Z');
  assert.equal(await seedDemo(real,demo,{now}),true);assert.equal(await readFile(real,'utf8'),original);
  const d=JSON.parse(await readFile(demo,'utf8'));assert.equal(d.products[0].snapshots.at(-1).capturedAt,'2026-10-06T00:00:00.000Z');assert.equal(d.settings.autoCheck,false);
  await writeFile(demo,'{"kept":true}');assert.equal(await seedDemo(real,demo,{now}),false);assert.equal(await readFile(demo,'utf8'),'{"kept":true}');
});
