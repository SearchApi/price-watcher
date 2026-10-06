import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createStore} from '../store.mjs';
import {createNotifier} from '../notify.mjs';
import {describeAlert} from '../alerts.mjs';
import {searchFixture,detailFixture,offer} from './fixtures.mjs';
const env={RESEND_API_KEY:'re_SECRET_TEST_KEY',ALERT_EMAIL_TO:'gabs@example.com'};
const tick=()=>new Promise(r=>setTimeout(r,10));
async function setup(t,{notifier}){
  const dir=await mkdtemp(join(tmpdir(),'price-watch-alerts-'));t.after(()=>rm(dir,{recursive:true,force:true}));
  let time='2026-09-28T12:00:00Z',detail=structuredClone(detailFixture);
  const store=createStore({path:join(dir,'state.json'),notifier,clock:()=>time,provider:async p=>structuredClone(p.engine==='google_shopping'?searchFixture:detail)});
  let s=await store.get();s=await store.act({action:'search',query:'StudioMouse Pro',revision:s.revision});const search=s.searches.at(-1);
  s=await store.act({action:'inspect',searchId:search.id,candidateId:search.candidates[0].id,revision:s.revision});const d=s.drafts.at(-1);
  s=await store.act({action:'watch',draftId:d.id,variant:'Black',accepted:[d.offers[0].key],revision:s.revision});
  return {store,id:s.products[0].id,set time(v){time=v;},set detail(v){detail=v;},get revision(){return store.get().then(x=>x.revision);}};
}
const fake=(status=200,log=[])=>({log,fetcher:async(url,init)=>{log.push({url,init});return {ok:status<400,status,json:async()=>({message:'domain not verified'})};}});
test('notifier is off without both variables, masks the address and never exposes the key',async()=>{
  assert.equal(createNotifier({env:{}}).configured,false);assert.equal(createNotifier({env:{RESEND_API_KEY:'x',ALERT_EMAIL_TO:'bad'}}).configured,false);
  const n=createNotifier({env});assert.equal(n.to,'g***@example.com');
  await assert.rejects(createNotifier({env:{}}).send({}),/not configured/);
  const f=fake(403);await assert.rejects(createNotifier({env,fetcher:f.fetcher}).send({subject:'s',text:'t',html:'h'}),e=>/HTTP 403/.test(e.message)&&!/SECRET/.test(e.message));
});
test('notifier posts one email to Resend with a bearer key',async()=>{
  const f=fake();await createNotifier({env,fetcher:f.fetcher}).send({subject:'s',text:'t',html:'h'});
  assert.equal(f.log[0].url,'https://api.resend.com/emails');assert.equal(f.log[0].init.headers.Authorization,'Bearer re_SECRET_TEST_KEY');
  const body=JSON.parse(f.log[0].init.body);assert.deepEqual(body.to,['gabs@example.com']);assert.match(body.from,/onboarding@resend\.dev/);
});
test('an alert needs a real change, and escapes product text',async t=>{
  const f=await setup(t,{notifier:null});let s=await f.store.get(),p=s.products[0];
  assert.equal(describeAlert(p),null);
  const snap=(price)=>({...p.snapshots[0],id:'n',capturedAt:'2026-09-29T12:00:00Z',offers:[{...p.snapshots[0].offers[0],priceCents:price}]});
  assert.equal(describeAlert({...p,snapshots:[p.snapshots[0],snap(9900)]}),null);
  const drop=describeAlert({...p,title:'<b>Mouse</b>',snapshots:[p.snapshots[0],snap(8900)]});
  assert.match(drop.text,/\$99\.00 → \$89\.00 \(down \$10\.00\)/);assert.doesNotMatch(drop.html,/<b>Mouse/);assert.match(drop.subject,/price change/);
  assert.equal(describeAlert({...p,snapshots:[p.snapshots[0],{...snap(9900),offers:[]}]}),null);
});
test('a refresh with a price drop sends one email; an unchanged refresh and disabled alerts send none',async t=>{
  const f=fake(),notifier=createNotifier({env,fetcher:f.fetcher}),h=await setup(t,{notifier});
  h.time='2026-09-29T12:00:00Z';await h.store.act({action:'refresh',id:h.id,revision:await h.revision});await tick();assert.equal(f.log.length,0);
  h.time='2026-09-30T12:00:00Z';h.detail={...detailFixture,offers:[offer('Example Electronics',89)]};
  let s=await h.store.act({action:'refresh',id:h.id,revision:await h.revision});await tick();assert.equal(f.log.length,1);
  assert.match(JSON.parse(f.log[0].init.body).text,/Example Electronics/);assert.equal((await h.store.get()).email.lastError,'');
  s=await h.store.act({action:'alerts',enabled:false,revision:s.revision});assert.equal(s.email.enabled,false);
  h.time='2026-10-01T12:00:00Z';h.detail={...detailFixture,offers:[offer('Example Electronics',79)]};
  await h.store.act({action:'refresh',id:h.id,revision:s.revision});await tick();assert.equal(f.log.length,1);
});
test('a failing email never loses the saved observation and the failure is reported',async t=>{
  const f=fake(500),h=await setup(t,{notifier:createNotifier({env,fetcher:f.fetcher})});
  h.time='2026-09-29T12:00:00Z';h.detail={...detailFixture,offers:[offer('Example Electronics',80)]};
  const s=await h.store.act({action:'refresh',id:h.id,revision:await h.revision});await tick();
  assert.equal(s.products[0].snapshots.length,2);const after=await h.store.get();assert.match(after.email.lastError,/HTTP 500/);
  await assert.rejects(h.store.act({action:'testEmail',revision:after.revision}),/HTTP 500/);
});
test('test email works only when configured',async t=>{
  const none=await setup(t,{notifier:null});await assert.rejects(none.store.act({action:'testEmail',revision:await none.revision}),/RESEND_API_KEY/);
  const f=fake(),h=await setup(t,{notifier:createNotifier({env,fetcher:f.fetcher})});
  const s=await h.store.act({action:'testEmail',revision:await h.revision});assert.match(s.message,/g\*\*\*@example\.com/);assert.equal(f.log.length,1);assert.doesNotMatch(JSON.stringify(s),/SECRET/);
});
test('target price: saved with the product, validated, hit once, and emailed once',async t=>{
  const f=fake(),h=await setup(t,{notifier:createNotifier({env,fetcher:f.fetcher})});
  await assert.rejects(h.store.act({action:'price',id:h.id,target:-1,revision:await h.revision}),/target price must be a positive amount/);
  let s=await h.store.act({action:'price',id:h.id,target:90,revision:await h.revision});
  assert.equal(s.products[0].targetCents,9000);assert.equal(s.products[0].summary.targetHit,false);
  h.time='2026-09-29T12:00:00Z';h.detail={...detailFixture,offers:[offer('Example Electronics',89)]};
  s=await h.store.act({action:'refresh',id:h.id,revision:await h.revision});await tick();
  assert.equal(s.products[0].summary.targetHit,true);assert.equal(f.log.length,1);
  const mail=JSON.parse(f.log[0].init.body);assert.match(mail.subject,/target price reached/);assert.match(mail.text,/Target reached: the lowest confirmed offer is \$89\.00, at or below your target of \$90\.00/);
  h.time='2026-09-30T12:00:00Z';h.detail={...detailFixture,offers:[offer('Example Electronics',89)]};
  await h.store.act({action:'refresh',id:h.id,revision:await h.revision});await tick();assert.equal(f.log.length,1);
  s=await h.store.act({action:'price',id:h.id,target:null,revision:await h.revision});assert.equal(s.products[0].targetCents,null);assert.equal(s.products[0].summary.targetHit,false);
});
