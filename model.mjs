import {createHash} from 'node:crypto';

export const markets = {us:{label:'United States',currency:'USD'},gb:{label:'United Kingdom',currency:'GBP'},br:{label:'Brazil',currency:'BRL'},ca:{label:'Canada',currency:'CAD'},au:{label:'Australia',currency:'AUD'}};
export const hash = value => createHash('sha256').update(value).digest('hex').slice(0,24);
export const text = (value, limit=600) => typeof value==='string'?value.slice(0,limit).trim():'';
export function safeUrl(value) {
  try { const u=new URL(value); if(!['http:','https:'].includes(u.protocol)||u.username||u.password)return ''; return u.href; } catch { return ''; }
}
export function canonicalUrl(value) {
  const valid=safeUrl(value); if(!valid)return '';
  const u=new URL(valid); for(const key of [...u.searchParams.keys()])if(/^(utm_|srsltid$|gclid$)/i.test(key))u.searchParams.delete(key);
  u.hash=''; u.searchParams.sort(); return u.href;
}
export function inputScope(input) {
  const query=text(input.query,180),country=input.country||'us';
  if(query.length<3)throw Error('Enter a specific product name (at least 3 characters).');
  if(!Object.hasOwn(markets,country))throw Error('Choose a supported market.');
  return {query,country,language:'en',currency:markets[country].currency};
}
export function moneyAmount(value, raw, currency) {
  if(typeof value!=='number'||!Number.isFinite(value)||value<=0||value>10000000)return null;
  const price=text(raw); const expected={USD:/\bUSD\b|US\$|^\$/,CAD:/\bCAD\b|CA?\$|^\$/,AUD:/\bAUD\b|AU?\$|^\$/,BRL:/\bBRL\b|R\$/,GBP:/\bGBP\b|£/}[currency];
  const foreign=price.match(/\b(USD|CAD|AUD|BRL|GBP|EUR)\b/)?.[1];
  if(foreign&&foreign!==currency)return null;
  if(currency!=='BRL'&&/R\$/.test(price)||currency!=='GBP'&&/£/.test(price)||/€/.test(price))return null;
  if(currency!=='CAD'&&/C(?:A)?\$/.test(price)||currency!=='AUD'&&/A(?:U)?\$/.test(price)||currency!=='USD'&&/US\$/.test(price))return null;
  if(!expected?.test(price)||/\b(from|per month|monthly|down|now)\b|\/mo|\d\s*[-–]\s*\d|\d\s*x\s*\$/i.test(price))return null;
  return Math.round(value*100);
}
export function candidates(data,scope) {
  const seen=new Set();
  return (Array.isArray(data.shopping_results)?data.shopping_results:[]).filter(r=>r&&typeof r==='object').slice(0,30).flatMap(r=>{
    const productId=String(r.product_id||''),token=text(r.product_token,20000),title=text(r.title);
    if(!title||!token)return [];
    const id=hash(productId+'|'+title+'|'+token); if(seen.has(id))return [];seen.add(id);
    const inst=r.installment&&typeof r.installment==='object'?r.installment:null,price=text(r.price,100);
    // Google's card may show a monthly installment or an offer count instead of a price; keep that as a hint, never as the item price.
    const hint=inst?{kind:'installment',text:[text(inst.cost_per_month,40),text(inst.months,40)].filter(Boolean).join(' · ')||price}:!price&&text(r.offers,40)?{kind:'offers',text:text(r.offers,40)}:null;
    return [{id,productId,token,title,seller:text(r.seller),price:inst?'':price,priceCents:inst?null:moneyAmount(r.extracted_price,r.price,scope.currency),hint,image:safeUrl(r.thumbnail),url:safeUrl(r.product_link||r.link),rating:typeof r.rating==='number'?r.rating:null,condition:text(r.durability||r.condition,100)}];
  });
}
export function normalizeOffers(data,scope) {
  const seen=new Set();
  return (Array.isArray(data.offers)?data.offers:[]).filter(r=>r&&typeof r==='object').slice(0,40).flatMap(r=>{
    const title=text(r.title),seller=text(r.merchant?.name||r.seller||r.name,180),url=safeUrl(r.link),price=text(r.price,120);
    if(!title||!seller||!url)return [];
    const details=(Array.isArray(r.details)?r.details:[]).map(x=>text(x,160)).filter(Boolean).slice(0,8);
    const condition=text(r.condition||r.durability,80),stock=text(r.stock_information,120);
    const context=[title,condition,stock,...details].join(' ');
    const cents=moneyAmount(r.extracted_price,price,scope.currency);
    const issues=[];
    if(cents===null||r.installment)issues.push('Price or currency needs review');
    if(/out of stock|unavailable|sold out|pre.?order/i.test(context))issues.push('Not available now');
    if(/refurbished|renewed|pre.?owned|used|open.?box/i.test(context))issues.push('Used or refurbished');
    const key=hash([seller.toLowerCase(),canonicalUrl(url),title.toLowerCase(),condition,scope.currency].join('|'));
    if(seen.has(key))return [];seen.add(key);
    return [{key,title,seller,url,price,priceCents:r.installment?null:cents,currency:scope.currency,condition,stock,details,delivery:text(r.delivery_price||r.delivery||details.find(d=>/delivery|shipping/i.test(d)),180),issues,eligible:issues.length===0}];
  });
}
export function acceptedOffers(snapshot) {return snapshot.offers.filter(o=>o.eligible&&snapshot.accepted.includes(o.key));}
export function summarize(product) {
  const latest=product.snapshots.at(-1),previous=product.snapshots.at(-2);
  const offers=latest?acceptedOffers(latest):[],lowest=offers.length?Math.min(...offers.map(o=>o.priceCents)):null;
  const older=previous?acceptedOffers(previous):[];
  const changes=offers.flatMap(o=>{const before=older.find(p=>p.key===o.key);return before&&before.priceCents!==o.priceCents?[{seller:o.seller,key:o.key,before:before.priceCents,after:o.priceCents,delta:o.priceCents-before.priceCents}]:[];});
  const comparable=offers.filter(o=>older.some(p=>p.key===o.key)).length;
  return {lowest,confirmed:offers.length,pending:latest?latest.offers.filter(o=>o.eligible&&!latest.accepted.includes(o.key)).length:0,changes,comparable,targetHit:lowest!==null&&product.targetCents!=null&&lowest<=product.targetCents};
}
export function ownPrice(value,label='Your target price') {
  if(value===null||value===undefined||value==='')return null;
  if(typeof value!=='number'||!Number.isFinite(value)||value<=0||value>10000000)throw Error(`${label} must be a positive amount.`);
  return Math.round(value*100);
}
