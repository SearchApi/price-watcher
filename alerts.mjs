import {summarize} from './model.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=(c,cur)=>new Intl.NumberFormat('en-US',{style:'currency',currency:cur}).format(c/100);
// Compares the newest observation with the one before it. Returns an email, or null when nothing worth sending changed.
export function describeAlert(product,url='http://127.0.0.1:5192/',{simulated=false}={}) {
  if(product.snapshots.length<2)return null;
  const now=summarize(product),before=summarize({...product,snapshots:product.snapshots.slice(0,-1)}),cur=product.scope.currency,lines=[];
  for(const c of now.changes)lines.push(`${c.seller}: ${money(c.before,cur)} → ${money(c.after,cur)} (${c.delta<0?'down':'up'} ${money(Math.abs(c.delta),cur)})`);
  // Fires once, when the lowest confirmed offer first reaches the target; staying below it sends nothing new.
  const target=now.targetHit&&!before.targetHit;
  if(target)lines.unshift(`Target reached: the lowest confirmed offer is ${money(now.lowest,cur)}, at or below your target of ${money(product.targetCents,cur)}.`);
  if(!lines.length)return null;
  // A simulated check is always labelled, in the subject and in the body.
  const flag=simulated?'Simulated check in demo mode. No store changed its price.':'';
  const subject=`${simulated?'[Simulated] ':''}Price Watch: ${target?'target price reached for':'price change for'} ${product.title}`.slice(0,150);
  const when=product.snapshots.at(-1).capturedAt;
  return {subject,
    text:`${flag?flag+'\n\n':''}${product.title}\n${product.variant}\n\n${lines.join('\n')}\n\nObserved ${when}. Item prices before shipping and tax; checkout prices can differ.\nOpen Price Watch: ${url}\n`,
    html:`${flag?`<p style="background:#fff0d9;color:#653d00;padding:8px 10px;border-radius:6px;font-size:13px">${flag}</p>`:''}<h2>${esc(product.title)}</h2><p>${esc(product.variant)}</p><ul>${lines.map(l=>`<li>${esc(l)}</li>`).join('')}</ul><p style="color:#596980;font-size:13px">Observed ${esc(when)}. Item prices before shipping and tax; checkout prices can differ.</p><p><a href="${esc(url)}">Open Price Watch</a></p>`};
}
