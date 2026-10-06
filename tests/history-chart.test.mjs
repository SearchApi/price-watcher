import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildSeries} from '../public/history-chart.js';
const offer=(key,seller,priceCents)=>({key,seller,priceCents,eligible:true});
const snap=(at,offers,accepted=offers.map(o=>o.key))=>({capturedAt:at,offers,accepted});
const day=n=>`2026-10-0${n}T12:00:00Z`;
test('one series per confirmed listing; a missing listing leaves a gap, never a zero',()=>{
  const p={snapshots:[snap(day(1),[offer('a','Alpha',9900),offer('b','Beta',10900)]),snap(day(2),[offer('a','Alpha',8900)]),snap(day(3),[offer('a','Alpha',8900),offer('b','Beta',10500)])]};
  const d=buildSeries(p);assert.deepEqual(d.series.map(s=>s.label),['Alpha','Beta']);
  assert.deepEqual(d.series[1].values,[10900,null,10500]);assert.deepEqual(d.lowest,[9900,8900,8900]);assert.equal(d.hidden,0);
});
test('only confirmed, eligible offers are drawn',()=>{
  const offers=[offer('a','Alpha',9900),{...offer('b','Beta',100),eligible:false},offer('c','Gamma',5000)];
  const d=buildSeries({snapshots:[snap(day(1),offers,['a','b']),snap(day(2),offers,['a','b'])]});
  assert.deepEqual(d.series.map(s=>s.label),['Alpha']);assert.deepEqual(d.lowest,[9900,9900]);
});
test('color follows the listing: a listing that drops out keeps its slot, and the others do not repaint',()=>{
  const p={snapshots:[snap(day(1),[offer('a','A',100),offer('b','B',200),offer('c','C',300)]),snap(day(2),[offer('a','A',100),offer('c','C',300)])]};
  assert.deepEqual(buildSeries(p).series.map(s=>[s.label,s.slot]),[['A',1],['B',2],['C',3]]);
});
test('same seller twice gets distinct labels',()=>{
  const d=buildSeries({snapshots:[snap(day(1),[offer('a','Shop',100),offer('b','Shop',200)]),snap(day(2),[offer('a','Shop',100),offer('b','Shop',200)])]});
  assert.deepEqual(d.series.map(s=>s.label),['Shop','Shop (2)']);
});
test('more than six listings: six are drawn (current ones first), the rest stay in the table data',()=>{
  const ids=['a','b','c','d','e','f','g','h'],first=ids.map((k,i)=>offer(k,k.toUpperCase(),1000+i)),later=ids.filter(k=>k!=='a').map((k,i)=>offer(k,k.toUpperCase(),1100+i));
  const d=buildSeries({snapshots:[snap(day(1),first),snap(day(2),later)]});
  assert.equal(d.series.length,6);assert.equal(d.hidden,2);assert.equal(d.all.length,8);assert.ok(!d.series.some(s=>s.key==='a'));
  assert.deepEqual(d.series.map(s=>s.slot),[1,2,3,4,5,6]);
});
test('an empty or unconfirmed history has no series',()=>{
  const d=buildSeries({snapshots:[snap(day(1),[offer('a','A',100)],[])]});assert.equal(d.series.length,0);assert.deepEqual(d.lowest,[null]);
});
