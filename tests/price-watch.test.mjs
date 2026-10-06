import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Readable} from 'node:stream';
import {moneyAmount,normalizeOffers,candidates,inputScope,summarize} from '../model.mjs';
import {createStore} from '../store.mjs';
import {createHandler} from '../http.mjs';
import {searchFixture,detailFixture,offer} from './fixtures.mjs';
const scope=inputScope({query:'StudioMouse Pro',country:'us'});
async function fixture(t){const dir=await mkdtemp(join(tmpdir(),'price-watch-test-'));t.after(()=>rm(dir,{recursive:true,force:true}));let search=structuredClone(searchFixture),detail=structuredClone(detailFixture),calls=0,time='2026-09-28T12:00:00Z',failure=false;const store=createStore({path:join(dir,'state.json'),clock:()=>time,provider:async p=>{calls++;if(failure)throw Error('SearchApi fixture failure');return structuredClone(p.engine==='google_shopping'?search:detail);}});return {store,get calls(){return calls;},set search(v){search=v;},set detail(v){detail=v;},set time(v){time=v;},set failure(v){failure=v;}};}
async function prepare(f){let s=await f.store.get();s=await f.store.act({action:'search',query:scope.query,revision:s.revision});const search=s.searches.at(-1);s=await f.store.act({action:'inspect',searchId:search.id,candidateId:search.candidates[0].id,revision:s.revision});return s;}
async function watch(f){let s=await prepare(f),d=s.drafts.at(-1);return f.store.act({action:'watch',draftId:d.id,variant:'Black · standard · new',confirmed:true,accepted:[d.offers[0].key,d.offers[1].key],ownPrice:119,revision:s.revision});}
test('money rejects foreign currency, installments, ranges and missing units',()=>{
  assert.equal(moneyAmount(99,'$99.00','USD'),9900);assert.equal(moneyAmount(99,'R$99,00','BRL'),9900);
  for(const [price,currency] of [['€99','USD'],['CA$99','USD'],['US$99','CAD'],['R$99','USD'],['99','USD'],['$99/mo','USD'],['From $99','USD'],['$99 now','USD'],['$99–100','USD']])assert.equal(moneyAmount(99,price,currency),null,price);
  assert.equal(moneyAmount(NaN,'$NaN','USD'),null);
});
test('only inspectable organic products become candidates; tokens are retained privately',()=>{
  assert.equal(candidates({shopping_ads:[searchFixture.shopping_results[0]],shopping_results:[{title:'No token'},...searchFixture.shopping_results,...searchFixture.shopping_results]},scope).length,1);
  assert.throws(()=>inputScope({query:'x'}));assert.throws(()=>inputScope({query:'mouse',country:'xx'}));
});
test('offers deduplicate tracking URLs and reject risky price/condition/link records',()=>{
  const first=offer('Shop',99),duplicate={...first,link:first.link+'?utm_source=google'},rows=normalizeOffers({offers:[first,duplicate,offer('Used',20,{condition:'Refurbished'}),offer('Plan',10,{installment:{months:12}}),offer('Stock',40,{stock_information:'Out of stock'}),offer('Bad',99,{link:'javascript:alert(1)'})]},scope);
  assert.equal(rows.length,4);assert.equal(rows.filter(o=>o.eligible).length,1);
  assert.equal(normalizeOffers({offers:[{...first,extracted_price:90,price:'$90'}]},scope)[0].key,rows[0].key);
});
test('baseline needs explicit matching offers; reload retains records and no product tokens leak',async t=>{
  const f=await fixture(t);let s=await prepare(f),d=s.drafts.at(-1);
  assert.doesNotMatch(JSON.stringify(s),/PRIVATE_TEST_TOKEN/);
  await assert.rejects(f.store.act({action:'watch',draftId:d.id,revision:s.revision,confirmed:false}),/Confirm/);
  await assert.rejects(f.store.act({action:'watch',draftId:d.id,revision:s.revision,confirmed:true,variant:'Black',accepted:[]}),/at least one/);
  s=await f.store.act({action:'watch',draftId:d.id,revision:s.revision,confirmed:true,variant:'Black',accepted:[d.offers[0].key],ownPrice:110});
  assert.equal(s.products[0].summary.lowest,9900);assert.equal(s.products[0].summary.gap,1100);assert.equal(s.products[0].snapshots.length,1);
  assert.deepEqual((await f.store.get()).products,s.products);assert.equal(f.calls,2);
});
test('refresh compares the same listing and leaves a new cheap variant unconfirmed',async t=>{
  const f=await fixture(t);let s=await watch(f);const p=s.products[0];f.time='2026-09-29T12:00:00Z';f.detail={...detailFixture,offers:[offer('Example Electronics',89),offer('Example Supply',109),offer('Accessory store',5,{title:'Mouse cable only'})]};
  s=await f.store.act({action:'refresh',id:p.id,revision:s.revision});const after=s.products[0];assert.equal(after.summary.lowest,8900);assert.equal(after.summary.pending,1);assert.equal(after.summary.changes[0].delta,-1000);assert.equal(after.summary.comparable,2);assert.equal(after.snapshots[0].offers[0].priceCents,9900);assert.equal(f.calls,4);
});
test('missing or renamed product preserves history and never claims stock loss',async t=>{
  const f=await fixture(t);let s=await watch(f);f.time='2026-09-29T12:00:00Z';f.search={shopping_results:[]};s=await f.store.act({action:'refresh',id:s.products[0].id,revision:s.revision});assert.equal(s.products[0].snapshots.length,1);assert.match(s.products[0].notice,/does not mean/);assert.equal(f.calls,3);
  f.search=searchFixture;f.detail={...detailFixture,product:{title:'Different model'}};s=await f.store.act({action:'refresh',id:s.products[0].id,revision:s.revision});assert.equal(s.products[0].snapshots.length,1);assert.match(s.products[0].notice,/title changed/);
});
test('provider failure and stale revisions cannot overwrite history; archive is reversible',async t=>{
  const f=await fixture(t);let s=await watch(f),id=s.products[0].id;f.time='2026-09-29T12:00:00Z';f.failure=true;
  await assert.rejects(f.store.act({action:'refresh',id,revision:s.revision}),/failure/);assert.equal((await f.store.get()).revision,s.revision);
  await assert.rejects(f.store.act({action:'price',id,revision:0,ownPrice:55}),/another tab/);
  s=await f.store.act({action:'archive',id,revision:s.revision});assert.equal(s.products[0].archived,true);
  s=await f.store.act({action:'restore',id,revision:s.revision});assert.equal(s.products[0].archived,false);assert.equal(s.products[0].snapshots.length,1);
});
test('empty or changed seller sets cannot fabricate price movement',()=>{
  const rows=normalizeOffers({offers:[offer('Shop A',99)]},scope),newRows=normalizeOffers({offers:[offer('Shop B',10)]},scope);
  const p={ownPriceCents:null,snapshots:[{offers:rows,accepted:rows.map(o=>o.key)},{offers:newRows,accepted:newRows.map(o=>o.key)}]};assert.equal(summarize(p).changes.length,0);assert.equal(summarize(p).comparable,0);
  p.snapshots.push({offers:[],accepted:[]});assert.equal(summarize(p).lowest,null);
});
test('HTTP rejects cross-site requests, missing action tokens and non-JSON bodies',async t=>{
  const f=await fixture(t),handler=createHandler({store:f.store,configured:()=>true});
  async function request(method,headers={},body={}){const req=Readable.from([JSON.stringify(body)]);req.method=method;req.headers={host:'127.0.0.1:5192',...headers};const out={};await handler(req,{writeHead(s){out.status=s;},end(b){out.body=JSON.parse(b);}});return out;}
  assert.equal((await request('GET',{origin:'https://evil.example'})).status,403);
  assert.equal((await request('POST',{'content-type':'application/json'})).status,403);
  const info=await request('GET'),csrf=info.body.csrf;
  assert.equal((await request('POST',{'x-price-watch-token':csrf})).status,415);
  const ok=await request('POST',{'x-price-watch-token':csrf,'content-type':'application/json'},{action:'search',query:scope.query,revision:0});assert.equal(ok.status,200);assert.doesNotMatch(JSON.stringify(ok.body),/PRIVATE_TEST_TOKEN/);assert.equal(f.calls,1);
});


test('unexpected provider collections stay empty and unsupported markets are rejected',()=>{
 assert.deepEqual(candidates({shopping_results:{}},scope),[]);
 assert.deepEqual(normalizeOffers({offers:'unavailable'},scope),[]);
 assert.deepEqual(candidates({shopping_results:[null]},scope),[]);
 assert.deepEqual(normalizeOffers({offers:[null]},scope),[]);
 assert.throws(()=>inputScope({query:'mouse',country:'toString'}),/supported market/);
});
