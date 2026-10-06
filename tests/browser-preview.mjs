// Explicit QA surface. It never uses SearchApi or the real workspace.
import http from 'node:http';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createStore} from '../store.mjs';
import {createHandler} from '../http.mjs';
import {createScheduler} from '../scheduler.mjs';
import {readLimits} from '../config.mjs';
import {handler as staticHandler} from '../server.mjs';
import {searchFixture,detailFixture,offer} from './fixtures.mjs';
const dir=await mkdtemp(join(tmpdir(),'price-watch-browser-'));let observations=0,clockReads=0;
const limits=readLimits(),store=createStore({limits,account:async()=>({account:{current_month_usage:62,monthly_allowance:100,remaining_credits:38},api_usage:{searches_this_hour:0,hourly_rate_limit:100},subscription:{}}),path:join(dir,'state.json'),clock:()=>new Date(Date.UTC(2026,8,28,12)+clockReads++*120000).toISOString(),provider:async p=>{
  if(p.engine==='google_shopping')return structuredClone(searchFixture);
  observations++;return observations===1?structuredClone(detailFixture):{...structuredClone(detailFixture),offers:[offer('Example Electronics',89),offer('Example Supply',109),offer('New seller',5,{title:'StudioMouse cable only'})]};
}});
const api=createHandler({store,configured:()=>true,scheduler:createScheduler({store,limits}),});
const server=http.createServer(async(req,res)=>{
  if(req.url==='/api/price-watch')return api(req,res);
  if(req.url==='/'||req.url==='/index.html'){
    const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');res.setHeader('Content-Type','text/html');return res.end(html.replace('<body>','<body><div style="padding:12px;background:#fff0d9;color:#653d00;font:14px sans-serif;text-align:center">TEST FIXTURE — fictional products and prices. No SearchApi requests.</div>'));
  }
  return staticHandler(req,res);
});
server.listen(0,'127.0.0.1',()=>console.log(`Fictional browser QA: http://127.0.0.1:${server.address().port}/`));
const stop=()=>server.close(()=>rm(dir,{recursive:true,force:true}).then(()=>process.exit()));process.on('SIGINT',stop);process.on('SIGTERM',stop);
