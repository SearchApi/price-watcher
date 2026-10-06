import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {randomUUID} from 'node:crypto';
import {inputScope,candidates,normalizeOffers,ownPrice,summarize,text} from './model.mjs';
import {readLimits} from './config.mjs';
import {describeAlert} from './alerts.mjs';
import {simulateNext} from './simulate.mjs';

const envValue = content => content.split(/\r?\n/).find(l=>/^\s*(?:export\s+)?SEARCHAPI_API_KEY\s*=/.test(l))?.split('=').slice(1).join('=').trim().replace(/^(['"])(.*)\1$/,'$2');
export async function readKey({centralRoot}={}) {
  if(process.env.SEARCHAPI_API_KEY?.trim())return process.env.SEARCHAPI_API_KEY.trim();
  const local=envValue(await readFile(resolve(import.meta.dirname,'.env'),'utf8').catch(()=>''));if(local)return local;
  let path=process.env.SEARCHAPI_ENV_FILE;
  if(!path&&centralRoot){const cfg=await readFile(resolve(centralRoot,'.local-config.json'),'utf8').then(JSON.parse).catch(()=>({}));path=cfg.keyFile||resolve(centralRoot,'.env');}
  return path?envValue(await readFile(path,'utf8').catch(()=>'')):undefined;
}
// 429 covers a spent monthly allowance, the hourly throughput cap and overdue billing; the body tells them apart.
async function providerError(response){
  const body=await response.json().catch(()=>({})),said=text(body.error,300);
  const code=response.status===429?(/all of the searches/i.test(said)?'quota':/throughput/i.test(said)?'rate':/overdue/i.test(said)?'billing':'rate'):response.status===401?'key':'';
  const messages={quota:'Your SearchApi searches for this month are used up. Upgrade your plan to keep checking prices.',rate:'SearchApi\u2019s hourly search limit was reached. Checks resume automatically later.',billing:'SearchApi reports an overdue payment on this account.',key:'SearchApi rejected the API key. Check SEARCHAPI_API_KEY.'};
  return Object.assign(Error(messages[code]||`SearchApi returned HTTP ${response.status}. Check your account and try again.`),{status:response.status,code});
}
export function createAccount(keyReader) {
  return async()=>{
    const key=await keyReader();if(!key)return null;
    const response=await fetch('https://www.searchapi.io/api/v1/me',{headers:{Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw Error(`HTTP ${response.status}`);
    return response.json();
  };
}
export function createProvider(keyReader) {
  return async(params)=>{
    const key=await keyReader();if(!key)throw Error('Set SEARCHAPI_API_KEY in .env and restart.');
    let response;
    try{response=await fetch('https://www.searchapi.io/api/v1/search?'+new URLSearchParams(params),{headers:{Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(45000)});}catch{throw Error('SearchApi could not be reached. Your saved observations are unchanged.');}
    if(!response.ok)throw await providerError(response);
    const data=await response.json();if(data.error||data.search_metadata?.status==='Error')throw Error('SearchApi did not return a successful result. Try a more specific product search.');
    return data;
  };
}
async function atomic(path,value){await mkdir(dirname(path),{recursive:true});const temp=path+'.'+randomUUID()+'.tmp';await writeFile(temp,JSON.stringify(value,null,2),{mode:0o600});await rename(temp,path);}
function clean(value){if(Array.isArray(value))return value.map(clean);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k])=>k!=='token').map(([k,v])=>[k,clean(v)]));return value;}

export function createStore(options={}) {
  const {path=resolve(import.meta.dirname,'private/state.json'),provider=createProvider(()=>readKey()),clock=()=>new Date().toISOString(),limits=readLimits(),notifier=null,appUrl,demo=false}=options;
  // An injected provider (tests, central server) never reaches the account endpoint unless an account reader is injected too.
  const account='account' in options?options.account:'provider' in options?async()=>null:createAccount(()=>readKey());
  let busy=false,calls=[],me=null,meAt=0,mail={lastSent:'',lastError:''};
  const deliver=async(email,kind)=>{try{await notifier.send(email);mail={lastSent:clock(),lastError:'',kind};}catch(e){mail={...mail,lastError:e.message};throw e;}};
  const hoursOf=s=>s.settings.checkHours||limits.checkHours;
  const fresh=()=>({version:1,revision:0,products:[],searches:[],drafts:[],settings:{autoCheck:limits.autoCheck,checkHours:limits.checkHours}});
  const read=async()=>{try{const s=JSON.parse(await readFile(path,'utf8'));s.settings??={autoCheck:limits.autoCheck};return s;}catch(e){if(e.code==='ENOENT')return fresh();throw Error('The saved workspace could not be read. Restore its backup before continuing.');}};
  const publicState=s=>({...clean(s),limits,demo,checkHours:hoursOf(s),email:{configured:Boolean(notifier?.configured),to:notifier?.to||'',enabled:Boolean(notifier?.configured)&&s.settings.alerts!==false,...mail},products:s.products.map(p=>({...clean(p),summary:summarize(p)}))});
  const hourly=()=>me?.api_usage?.hourly_rate_limit||limits.hourlyLimit;
  const call=async params=>{const now=Date.now();calls=calls.filter(t=>now-t<3600000);if(calls.length>=hourly())throw Error(`The limit of ${hourly()} SearchApi requests per hour has been reached. Try again later.`);calls.push(now);return provider(params);};
  // Reads the account's real balance from SearchApi (cached for a minute). A failure never blocks the workspace.
  async function usage(state){
    const s=state||await read(),active=s.products.filter(p=>!p.archived).length,perDay=Math.round(active*2*24/hoursOf(s)*10)/10;
    let error='';
    if(Date.now()-meAt>60000){try{me=await account();meAt=Date.now();}catch(e){error=`Account usage is unavailable (${e.message}).`;}}
    const a=me?.account,remaining=a?.remaining_credits;
    return {account:a?{used:a.current_month_usage,allowance:a.monthly_allowance,remaining,hourUsed:me.api_usage?.searches_this_hour,hourLimit:me.api_usage?.hourly_rate_limit,periodEnd:me.subscription?.period_end||''}:null,
      estimate:{perDay,daysLeft:perDay>0&&Number.isFinite(remaining)?Math.floor(remaining/perDay):null},error};
  }
  async function detail(candidate,scope){
    const data=await call({engine:'google_product',product_token:candidate.token,gl:scope.country,hl:'en'});
    if(!data.product?.title)throw Error('Product details were unavailable. Try another search result.');
    return {id:randomUUID(),candidate,scope,capturedAt:clock(),source:{provider:'SearchApi',engine:'google_product',searchId:text(data.search_metadata?.id,120)},title:text(data.product.title),description:text(data.product.description,1200),offers:normalizeOffers(data,scope)};
  }
  function selection(offers,keys){
    if(!Array.isArray(keys)||keys.length>40||keys.some(k=>!offers.some(o=>o.key===k&&o.eligible)))throw Error('Select only available, comparable offers from this observation.');
    return [...new Set(keys)];
  }
  return {
    usage,
    async get(){return publicState(await read());},
    async act(input){
      if(busy)throw Error('Another action is running. Wait for it to finish.');busy=true;
      try{
        const state=await read();if(input.revision!==state.revision)throw Error('This workspace changed in another tab. Reload before trying again.');
        const action=input.action;let message='Saved.';
        if(action==='search'){
          const scope=inputScope(input),data=await call({engine:'google_shopping',q:scope.query,gl:scope.country,hl:'en',link:'resolved'});
          const search={id:randomUUID(),scope,capturedAt:clock(),source:{provider:'SearchApi',engine:'google_shopping',searchId:text(data.search_metadata?.id,120)},candidates:candidates(data,scope)};
          state.searches=[...state.searches.slice(-4),search];message=`${search.candidates.length} results.`;
        }else if(action==='inspect'){
          const search=state.searches.find(s=>s.id===input.searchId),candidate=search?.candidates.find(c=>c.id===input.candidateId);
          if(!candidate)throw Error('That search result is no longer available. Search again.');
          state.drafts=[...state.drafts.slice(-4),await detail(candidate,search.scope)];message='Tick the listings that match, then add to your watchlist.';
        }else if(action==='watch'){
          if(state.products.filter(p=>!p.archived).length>=limits.maxProducts)throw Error(`Your watchlist holds ${limits.maxProducts} products. Archive one to make room, or raise PRICE_WATCH_MAX_PRODUCTS.`);
          if(state.products.length>=30)throw Error('This local workspace holds 30 products including archives. Export it before starting a new workspace.');
          const d=state.drafts.find(d=>d.id===input.draftId);if(!d)throw Error('Inspect a product before adding it.');
          if(!text(input.variant,240))throw Error('Describe the variant.');
          if(!d.candidate.productId)throw Error('This result has no stable product ID. Choose another result to track.');
          if(state.products.some(p=>!p.archived&&p.productId===d.candidate.productId&&p.scope.country===d.scope.country))throw Error('This product is already in your watchlist.');
          const accepted=selection(d.offers,input.accepted);if(!accepted.length)throw Error('Tick at least one matching listing.');
          state.products.push({id:randomUUID(),productId:d.candidate.productId,title:d.title,candidateTitle:d.candidate.title,image:d.candidate.image,url:d.candidate.url,scope:d.scope,variant:text(input.variant,240),targetCents:ownPrice(input.target),createdAt:clock(),archived:false,notice:'',snapshots:[{id:randomUUID(),capturedAt:d.capturedAt,source:d.source,offers:d.offers,accepted}]});
          state.drafts=state.drafts.filter(x=>x.id!==d.id);message='Product added.';
        }else if(action==='alerts'){
          state.settings.alerts=input.enabled===true;message=state.settings.alerts?'Email alerts are on.':'Email alerts are off.';
        }else if(action==='testEmail'){
          if(!notifier?.configured)throw Error('Set RESEND_API_KEY and ALERT_EMAIL_TO in .env and restart.');
          await deliver({subject:'Price Watch test email',text:'Email alerts are working. You will get a message when a confirmed listing changes price or a competitor undercuts you.',html:'<p>Email alerts are working. You will get a message when a confirmed listing changes price or a competitor undercuts you.</p>'});message=`Test email sent to ${notifier.to}.`;
        }else if(action==='interval'){
          const hours=Number(input.hours);if(!Number.isInteger(hours)||hours<1||hours>168)throw Error('Choose an interval between 1 hour and 7 days.');
          state.settings.checkHours=hours;message=`Prices are checked every ${hours===1?'hour':hours%24===0?(hours===24?'day':`${hours/24} days`):`${hours} hours`}.`;
        }else if(action==='auto'){
          state.settings.autoCheck=input.enabled===true;message=state.settings.autoCheck?'Automatic checks are on.':'Automatic checks are paused.';
        }else{
          const p=state.products.find(p=>p.id===input.id);if(!p)throw Error('Choose a saved product.');
          if(action==='simulate'){
            if(!demo)throw Error('Simulated checks exist only in demo mode. Run npm run demo.');
            if(p.archived)throw Error('Restore this product first.');
            const sim=simulateNext(p);p.snapshots=[...p.snapshots.slice(1-limits.maxObservations),{id:randomUUID(),...sim.snapshot}];p.notice='';message=`Simulated next day. ${sim.note}`;
          }else if(action==='refresh'){
            if(demo)throw Error('Demo mode never calls SearchApi for checks. Use Simulate next day.');
            if(p.archived)throw Error('Restore this product before checking prices.');
            const last=p.snapshots.at(-1);if(Date.parse(clock())-Date.parse(last.capturedAt)<60000)throw Error('Wait one minute between checks of the same product.');
            const data=await call({engine:'google_shopping',q:p.scope.query,gl:p.scope.country,hl:'en',link:'resolved'});
            const choices=candidates(data,p.scope).filter(c=>c.productId===p.productId);
            const c=choices.find(c=>c.title===p.candidateTitle);
            if(!c){p.notice='The confirmed product was not found with the same identity in this search page. Previous observations are preserved; this does not mean it is out of stock.';message=p.notice;}
            else {
              const d=await detail(c,p.scope);
              if(d.title!==p.title){p.notice='The product detail title changed. Previous observations are preserved. Inspect the product again before tracking a different variant.';message=p.notice;}
              else {const accepted=d.offers.filter(o=>o.eligible&&last.accepted.includes(o.key)).map(o=>o.key);p.snapshots=[...p.snapshots.slice(1-limits.maxObservations),{id:randomUUID(),capturedAt:d.capturedAt,source:d.source,offers:d.offers,accepted}];p.notice='';message='Prices checked.';}
            }
          }else if(action==='review'){
            const latest=p.snapshots.at(-1);if(latest.id!==input.snapshotId)throw Error('A newer observation is available. Reload before reviewing.');
            latest.accepted=selection(latest.offers,input.accepted);message='Selection saved.';
          }else if(action==='price'){p.targetCents=ownPrice(input.target);message=p.targetCents===null?'Target cleared.':'Target saved.';}
          else if(action==='archive'){p.archived=true;message='Product archived.';}
          else if(action==='restore'){if(state.products.filter(p=>!p.archived).length>=limits.maxProducts)throw Error(`Archive a product first; ${limits.maxProducts} active products are allowed.`);p.archived=false;message='Product restored.';}
          else throw Error('Unknown action.');
        }
        state.revision++;state.updatedAt=clock();await atomic(path,state);
        if((action==='refresh'||action==='simulate')&&notifier?.configured&&state.settings.alerts!==false){const p=state.products.find(p=>p.id===input.id),email=p&&describeAlert(p,appUrl,{simulated:action==='simulate'});if(email)deliver(email).catch(()=>{});}
        return {...publicState(state),message};
      }finally{busy=false;}
    }
  };
}
