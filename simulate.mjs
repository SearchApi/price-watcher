// Demo mode: simulated price checks for recordings and rehearsals. It never calls SearchApi and never touches the real watchlist.
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
const DAY=86400000;
// Prices keep a retail look: $1,372.99 above $100, $18.49 below.
const pretty=cents=>cents>=10000?Math.max(99,Math.round(cents/100)*100-1):Math.max(9,Math.round(cents/10)*10-1);
const label=(cents,currency)=>new Intl.NumberFormat('en-US',{style:'currency',currency}).format(cents/100);

// Pure: the next simulated observation for a product. A calm week with one small move and one real drop.
export function simulateNext(product) {
  const last=product.snapshots.at(-1),step=product.snapshots.filter(s=>s.simulated).length,currency=product.scope.currency;
  const confirmed=last.offers.filter(o=>o.eligible&&last.accepted.includes(o.key)).sort((a,b)=>a.priceCents-b.priceCents);
  const moves=new Map();let note='No price changed.';
  // Day 2: the most expensive confirmed store trims a little; day 4: the cheapest one cuts. Two different stores read better.
  if(confirmed.length&&step===1){const o=confirmed.length>1?confirmed.at(-1):confirmed[0],next=pretty(o.priceCents*0.985);if(next<o.priceCents){moves.set(o.key,next);note=`${o.seller} lowered its price slightly.`;}}
  if(confirmed.length&&step===3){
    const o=confirmed[0],target=product.targetCents;
    // Reach the target when it is a believable distance away (up to 12%); otherwise a 5% cut.
    const next=target!=null&&target<o.priceCents&&target>=o.priceCents*0.88?Math.min(pretty(target),target):pretty(o.priceCents*0.95);
    if(next<o.priceCents){moves.set(o.key,next);note=`${o.seller} cut its price.`;}
  }
  const offers=last.offers.map(o=>moves.has(o.key)?{...o,priceCents:moves.get(o.key),price:label(moves.get(o.key),currency)}:{...o});
  return {note,snapshot:{capturedAt:new Date(Date.parse(last.capturedAt)+DAY).toISOString(),source:{provider:'Simulation',engine:'demo',searchId:''},offers,accepted:[...last.accepted],simulated:true}};
}

// Copies the real workspace into the demo file and moves its history back, so simulated days end around today.
export async function seedDemo(realPath,demoPath,{days=4,now=Date.now(),empty=false}={}) {
  try{await readFile(demoPath);return false;}catch(e){if(e.code!=='ENOENT')throw e;}
  // `empty` starts a clean demo workspace for a one-take recording: search, confirm and save happen live, then the days are simulated.
  let state;try{state=empty?{version:1,revision:0,products:[],searches:[],drafts:[],settings:{}}:JSON.parse(await readFile(realPath,'utf8'));}catch{state={version:1,revision:0,products:[],searches:[],drafts:[],settings:{}};}
  for(const p of state.products){
    const shift=now-days*DAY-Date.parse(p.snapshots.at(-1).capturedAt);
    p.snapshots=p.snapshots.map(s=>({...s,capturedAt:new Date(Date.parse(s.capturedAt)+shift).toISOString()}));
    p.createdAt=p.snapshots[0].capturedAt;p.notice='';
  }
  state.settings={...state.settings,autoCheck:false};
  await mkdir(dirname(demoPath),{recursive:true});await writeFile(demoPath,JSON.stringify(state,null,2),{mode:0o600});return true;
}
if(process.argv[1]&&resolve(process.argv[1])===import.meta.filename&&process.argv.includes('--reset')){
  await rm(resolve(import.meta.dirname,'private/demo-state.json'),{force:true});console.log('Demo workspace cleared. It is rebuilt from your real watchlist the next time you run npm run demo.');
}
