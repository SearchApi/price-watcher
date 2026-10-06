// Price history chart: one line per confirmed listing, or the lowest confirmed price.
// Built with DOM methods and textContent because seller names come from provider data.
const SVG='http://www.w3.org/2000/svg',MAX_SERIES=6;
const el=(tag,attrs={},text)=>{const n=document.createElementNS(SVG,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n;};
const html=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};

// Pure: turns a product's snapshots into series. Color slots follow the listing, not its rank.
export function buildSeries(product){
  const snaps=product.snapshots,points=snaps.map(s=>({t:Date.parse(s.capturedAt),at:s.capturedAt,sim:Boolean(s.simulated)}));
  const confirmed=snaps.map(s=>new Map(s.offers.filter(o=>o.eligible&&s.accepted.includes(o.key)).map(o=>[o.key,o])));
  const order=[],labelOf=new Map();
  confirmed.forEach(m=>m.forEach((o,key)=>{if(!labelOf.has(key)){order.push(key);labelOf.set(key,o.seller||'Seller not provided');}}));
  const seen=new Map();for(const key of order){const base=labelOf.get(key),n=(seen.get(base)||0)+1;seen.set(base,n);if(n>1)labelOf.set(key,`${base} (${n})`);}
  const all=order.map(key=>({key,label:labelOf.get(key),values:confirmed.map(m=>m.get(key)?.priceCents??null)}));
  const latest=confirmed.at(-1)||new Map();
  const picked=[...all].sort((a,b)=>(latest.has(b.key)-latest.has(a.key))||order.indexOf(a.key)-order.indexOf(b.key)).slice(0,MAX_SERIES);
  const series=all.filter(s=>picked.includes(s)).map((s,i)=>({...s,slot:i+1}));
  const lowest=confirmed.map(m=>m.size?Math.min(...[...m.values()].map(o=>o.priceCents)):null);
  return {points,all,series,lowest,hidden:all.length-series.length};
}
const niceStep=span=>{const raw=span/3,pow=10**Math.floor(Math.log10(raw)),f=raw/pow;return (f<=1?1:f<=2?2:f<=5?5:10)*pow;};

export function drawChart(host,data,{mode,currency,fmt,fmtDate,fmtDateLong=fmtDate,fmtDateTime=fmtDateLong}){
  host.replaceChildren();
  const lowestOnly=mode==='lowest'||data.series.length<2;
  const series=lowestOnly?[{key:'lowest',label:'Lowest confirmed offer',values:data.lowest,slot:1}]:data.series;
  const {points}=data,valid=series.flatMap(s=>s.values.filter(v=>v!==null));
  if(points.length<2||!valid.length){host.appendChild(html('p','history-baseline',`${points.length} observation${points.length===1?'':'s'} saved. Check prices later to build a real history.`));return;}
  const lo0=Math.min(...valid),hi0=Math.max(...valid),step=niceStep(Math.max(hi0-lo0,100)),lo=Math.floor((lo0-step*.25)/step)*step,hi=Math.ceil((hi0+step*.25)/step)*step;
  const ticks=[];for(let v=lo;v<=hi+1;v+=step)ticks.push(v);
  // The viewBox matches the real width so axis text stays 11px on phones.
  const t0=points[0].t,t1=points.at(-1).t,W=Math.max(300,Math.round(host.clientWidth||720)),H=250,top=14,bottom=34,left=W<420?46:58;
  // A short span (under 48 hours) needs the time on the axis, or both ends can read as the same day.
  const axisDate=t1-t0<48*3600000?fmtDateTime:fmtDate;
  // End labels show the price only (the legend names the series), and only when they stay attached: at most 4 series and clear vertical gaps.
  const ends=series.map(s=>{const i=s.values.findLastIndex(v=>v!==null);return {s,i,v:s.values[i]};}).sort((a,b)=>a.v-b.v);
  const y=v=>H-bottom-(v-lo)/Math.max(hi-lo,1)*(H-bottom-top);
  const direct=!lowestOnly&&W>=560&&series.length<=4&&ends.every((e,k)=>!k||Math.abs(y(e.v)-y(ends[k-1].v))>=15);
  const right=direct?92:18,x=t=>left+(t-t0)/Math.max(t1-t0,1)*(W-left-right);
  if(!lowestOnly){const legend=html('ul','legend');for(const s of series){const li=html('li');const key=el('svg',{width:18,height:8,'aria-hidden':'true'});key.appendChild(el('line',{x1:1,x2:17,y1:4,y2:4,class:`stroke s${s.slot}`}));li.append(key,html('span','',s.label));legend.appendChild(li);}host.appendChild(legend);}
  const svg=el('svg',{viewBox:`0 0 ${W} ${H}`,role:'img',tabindex:'0','aria-label':`${lowestOnly?'Lowest confirmed price':'Confirmed price per store listing'} over time in ${currency}. Arrow keys move between observations. A table with every value follows.`});
  for(const v of ticks){svg.appendChild(el('line',{class:'grid',x1:left,x2:W-right,y1:y(v),y2:y(v)}));svg.appendChild(el('text',{class:'tick',x:left-8,y:y(v)+4,'text-anchor':'end'},fmt(v,true)));}
  svg.appendChild(el('text',{class:'tick',x:left,y:H-10},axisDate(points[0].at)));svg.appendChild(el('text',{class:'tick',x:W-right,y:H-10,'text-anchor':'end'},axisDate(points.at(-1).at)));
  for(const s of series){
    let d='',pen=false;s.values.forEach((v,i)=>{if(v===null){pen=false;return;}d+=`${pen?'L':'M'}${x(points[i].t).toFixed(1)},${y(v).toFixed(1)} `;pen=true;});
    svg.appendChild(el('path',{class:`stroke s${s.slot}`,d,fill:'none'}));
    // A point with no neighbours would draw nothing as a line, so it gets a dot.
    s.values.forEach((v,i)=>{if(v!==null&&s.values[i-1]==null&&s.values[i+1]==null&&i!==s.values.findLastIndex(q=>q!==null))svg.appendChild(el('circle',{class:`dot s${s.slot}`,cx:x(points[i].t),cy:y(v),r:4}));});
  }
  for(const e of ends){svg.appendChild(el('circle',{class:`dot s${e.s.slot}`,cx:x(points[e.i].t),cy:y(e.v),r:4}));
    if(direct)svg.appendChild(el('text',{class:'end-label',x:x(points[e.i].t)+10,y:y(e.v)+4},fmt(e.v)));}
  const cross=el('line',{class:'cross',y1:top,y2:H-bottom,visibility:'hidden'}),hover=el('g',{visibility:'hidden'});svg.append(cross,hover);
  host.appendChild(svg);
  const tip=html('div','tip');tip.hidden=true;host.appendChild(tip);host.classList.add('chart-host');
  function show(i){
    const cx=x(points[i].t);cross.setAttribute('x1',cx);cross.setAttribute('x2',cx);cross.setAttribute('visibility','visible');
    hover.replaceChildren();hover.setAttribute('visibility','visible');tip.replaceChildren();
    tip.appendChild(html('div','tip-date',fmtDateLong(points[i].at)+(points[i].sim?' · simulated':'')));
    const rows=series.map(s=>({s,v:s.values[i]})).filter(r=>r.v!==null).sort((a,b)=>a.v-b.v);
    for(const r of rows){hover.appendChild(el('circle',{class:`dot s${r.s.slot}`,cx,cy:y(r.v),r:4}));
      const row=html('div','tip-row'),key=el('svg',{width:14,height:8,'aria-hidden':'true'});key.appendChild(el('line',{x1:0,x2:14,y1:4,y2:4,class:`stroke s${r.s.slot}`}));row.append(key,html('strong','',fmt(r.v)),html('span','',r.s.label));tip.appendChild(row);}
    if(!rows.length)tip.appendChild(html('div','tip-row','No confirmed offer'));
    tip.hidden=false;const box=host.getBoundingClientRect(),sv=svg.getBoundingClientRect(),px=sv.left-box.left+cx/W*sv.width;
    tip.style.left=Math.min(Math.max(px+12,0),Math.max(box.width-tip.offsetWidth,0))+'px';tip.style.top=(sv.top-box.top+8)+'px';
  }
  const hide=()=>{cross.setAttribute('visibility','hidden');hover.setAttribute('visibility','hidden');tip.hidden=true;};
  const nearest=ev=>{const r=svg.getBoundingClientRect(),vx=(ev.clientX-r.left)/r.width*W;let best=0;points.forEach((p,i)=>{if(Math.abs(x(p.t)-vx)<Math.abs(x(points[best].t)-vx))best=i;});return best;};
  let cursor=points.length-1;
  svg.addEventListener('pointermove',ev=>{cursor=nearest(ev);show(cursor);});svg.addEventListener('pointerleave',()=>{if(document.activeElement!==svg)hide();});
  svg.addEventListener('focus',()=>show(cursor));svg.addEventListener('blur',hide);
  svg.addEventListener('keydown',ev=>{if(ev.key==='ArrowLeft'||ev.key==='ArrowRight'){ev.preventDefault();cursor=Math.min(points.length-1,Math.max(0,cursor+(ev.key==='ArrowLeft'?-1:1)));show(cursor);}else if(ev.key==='Escape')hide();});
}

// Table view: every confirmed listing, including those too many to draw. Nothing depends on hover.
export function historyTable(data,{fmt,fmtDate,fmtDateLong=fmtDate}){
  const table=html('table','history-table'),head=html('tr'),cols=[{label:'Lowest confirmed',values:data.lowest},...data.all];
  head.appendChild(html('th','','Observation'));for(const c of cols)head.appendChild(html('th','',c.label));table.appendChild(html('thead')).appendChild(head);
  const body=html('tbody');for(let i=data.points.length-1;i>=0;i--){const tr=html('tr');tr.appendChild(html('th','',fmtDateLong(data.points[i].at)+(data.points[i].sim?' · simulated':'')));for(const c of cols)tr.appendChild(html('td','',c.values[i]===null?'—':fmt(c.values[i])));body.appendChild(tr);}
  table.appendChild(body);const wrap=html('div','table-wrap');wrap.appendChild(table);return wrap;
}
