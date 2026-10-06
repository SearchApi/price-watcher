import {summarize} from './model.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=(c,cur)=>new Intl.NumberFormat('en-US',{style:'currency',currency:cur}).format(c/100);
// Compares the newest observation with the one before it. Returns an email, or null when nothing worth sending changed.
export function describeAlert(product,url='http://127.0.0.1:5192/') {
  if(product.snapshots.length<2)return null;
  const now=summarize(product),before=summarize({...product,snapshots:product.snapshots.slice(0,-1)}),cur=product.scope.currency,lines=[];
  for(const c of now.changes)lines.push(`${c.seller}: ${money(c.before,cur)} → ${money(c.after,cur)} (${c.delta<0?'down':'up'} ${money(Math.abs(c.delta),cur)})`);
  const undercut=now.gap!==null&&now.gap>0&&(before.gap===null||before.gap<=0);
  if(undercut)lines.push(`You are now above the lowest confirmed offer by ${money(now.gap,cur)} (lowest ${money(now.lowest,cur)}, your price ${money(product.ownPriceCents,cur)}).`);
  // Fires once, when the lowest confirmed offer first reaches the target; staying below it sends nothing new.
  const target=now.targetHit&&!before.targetHit;
  if(target)lines.unshift(`Target reached: the lowest confirmed offer is ${money(now.lowest,cur)}, at or below your target of ${money(product.targetCents,cur)}.`);
  if(!lines.length)return null;
  const subject=`Price Watch: ${target?'target price reached for':undercut?'a competitor undercut you on':'price change for'} ${product.title}`.slice(0,150);
  const when=product.snapshots.at(-1).capturedAt;
  return {subject,
    text:`${product.title}\n${product.variant}\n\n${lines.join('\n')}\n\nObserved ${when}. Item prices before shipping and tax; checkout prices can differ.\nOpen Price Watch: ${url}\n`,
    html:`<h2>${esc(product.title)}</h2><p>${esc(product.variant)}</p><ul>${lines.map(l=>`<li>${esc(l)}</li>`).join('')}</ul><p style="color:#596980;font-size:13px">Observed ${esc(when)}. Item prices before shipping and tax; checkout prices can differ.</p><p><a href="${esc(url)}">Open Price Watch</a></p>`};
}
