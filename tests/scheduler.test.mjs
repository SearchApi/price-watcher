import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createStore} from '../store.mjs';
import {createScheduler} from '../scheduler.mjs';
import {readLimits} from '../config.mjs';
import {searchFixture,detailFixture,offer} from './fixtures.mjs';
const H=3600000,T0=Date.parse('2026-09-28T12:00:00Z');
async function setup(t,{env={},account}={}){
  const dir=await mkdtemp(join(tmpdir(),'price-watch-sched-'));t.after(()=>rm(dir,{recursive:true,force:true}));
  const limits=readLimits(env);let time=T0,calls=0,failure=null,detail=structuredClone(detailFixture);
  const store=createStore({path:join(dir,'state.json'),limits,clock:()=>new Date(time).toISOString(),account,provider:async p=>{calls++;if(failure)throw failure;return structuredClone(p.engine==='google_shopping'?searchFixture:detail);}});
  const scheduler=createScheduler({store,limits,now:()=>time});
  let s=await store.get();s=await store.act({action:'search',query:'StudioMouse Pro',revision:s.revision});
  const search=s.searches.at(-1);s=await store.act({action:'inspect',searchId:search.id,candidateId:search.candidates[0].id,revision:s.revision});
  const d=s.drafts.at(-1);await store.act({action:'watch',draftId:d.id,variant:'Black',confirmed:true,accepted:[d.offers[0].key],revision:s.revision});
  return {store,scheduler,limits,get calls(){return calls;},get time(){return time;},set time(v){time=v;},set failure(v){failure=v;},set detail(v){detail=v;}};
}
test('limits read from the environment, fall back on invalid values',()=>{
  assert.deepEqual(readLimits({}),{maxProducts:5,maxObservations:60,checkHours:24,hourlyLimit:30,autoCheck:true});
  const l=readLimits({PRICE_WATCH_MAX_PRODUCTS:'12',PRICE_WATCH_CHECK_HOURS:'abc',PRICE_WATCH_AUTO_CHECK:'off'});
  assert.equal(l.maxProducts,12);assert.equal(l.checkHours,24);assert.equal(l.autoCheck,false);
});
test('a product is checked only once its interval has passed, and a new observation is saved',async t=>{
  const f=await setup(t),before=f.calls;
  assert.equal(await f.scheduler.tick(),null);assert.equal(f.calls,before);
  f.time=T0+24*H+1000;f.detail={...detailFixture,offers:[offer('Example Electronics',89)]};
  const out=await f.scheduler.tick();assert.ok(out.checked);
  const p=(await f.store.get()).products[0];assert.equal(p.snapshots.length,2);assert.equal(p.summary.changes[0].delta,-1000);
  assert.equal(await f.scheduler.tick(),null);
});
test('paused automatic checks make no requests',async t=>{
  const f=await setup(t),before=f.calls;f.time=T0+48*H;
  const s=await f.store.get();await f.store.act({action:'auto',enabled:false,revision:s.revision});
  assert.equal(await f.scheduler.tick(),null);assert.equal(f.calls,before);assert.equal((await f.scheduler.status()).enabled,false);
});
test('a spent monthly allowance pauses the scheduler instead of retrying every minute',async t=>{
  const f=await setup(t);f.time=T0+24*H+1000;f.failure=Object.assign(Error('used up'),{code:'quota'});
  const calls=f.calls;assert.ok((await f.scheduler.tick()).failed);assert.equal(f.calls,calls+1);
  assert.equal((await f.scheduler.status()).paused,'quota');
  assert.equal(await f.scheduler.tick(),null);assert.equal(f.calls,calls+1);
  f.failure=null;f.time+=H+1000;assert.ok((await f.scheduler.tick()).checked);
});
test('an ordinary failure backs off for the product and keeps history',async t=>{
  const f=await setup(t);f.time=T0+24*H+1000;f.failure=Error('network');
  assert.ok((await f.scheduler.tick()).failed);const calls=f.calls;
  f.time+=60000;assert.equal(await f.scheduler.tick(),null);assert.equal(f.calls,calls);
  assert.equal((await f.store.get()).products[0].snapshots.length,1);assert.equal((await f.scheduler.status()).lastError,'network');
});
test('usage reads the real balance, estimates the daily cost and survives account failures',async t=>{
  const account=async()=>({account:{current_month_usage:40,monthly_allowance:100,remaining_credits:60},api_usage:{searches_this_hour:2,hourly_rate_limit:100},subscription:{}});
  const f=await setup(t,{account}),u=await f.store.usage();
  assert.equal(u.account.remaining,60);assert.equal(u.account.hourLimit,100);assert.equal(u.estimate.perDay,2);assert.equal(u.estimate.daysLeft,30);
  const g=await setup(t,{account:async()=>{throw Error('HTTP 500');}}),v=await g.store.usage();
  assert.equal(v.account,null);assert.match(v.error,/unavailable/);assert.equal((await g.store.get()).products.length,1);
});
test('product limit follows the configured value',async t=>{
  const f=await setup(t,{env:{PRICE_WATCH_MAX_PRODUCTS:'1'}});
  let s=await f.store.get();s=await f.store.act({action:'search',query:'Another model',revision:s.revision});const search=s.searches.at(-1);
  s=await f.store.act({action:'inspect',searchId:search.id,candidateId:search.candidates[0].id,revision:s.revision});
  await assert.rejects(f.store.act({action:'watch',draftId:s.drafts.at(-1).id,variant:'x',confirmed:true,accepted:[],revision:s.revision}),/holds 1 products/);
});
