import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {createHandler} from './http.mjs';
import {createStore} from './store.mjs';
import {createScheduler} from './scheduler.mjs';
import {readLimits} from './config.mjs';
import {createNotifier} from './notify.mjs';
const limits=readLimits(),notifier=createNotifier(),store=createStore({limits,notifier,appUrl:`http://127.0.0.1:${process.env.PORT||5192}/`}),scheduler=createScheduler({store,limits,log:m=>console.log('Price Watch auto-check:',m)});
const root=resolve(import.meta.dirname,'public'),api=createHandler({store,scheduler});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
export async function handler(req,res){
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  try{
    const url=new URL(req.url,'http://localhost');if(url.pathname==='/api/price-watch')return api(req,res);
    if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end();}
    let path=decodeURIComponent(url.pathname).replace(/^\/apps\/price-watch/, '');
    if(path.split('/').some(x=>x.startsWith('.')))throw Error();
    let file=resolve(root,'.'+path);if(!file.startsWith(root+sep)&&file!==root)throw Error();
    if((await stat(file)).isDirectory())file=resolve(file,'index.html');
    const content=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:content);
  }catch{res.writeHead(404);res.end('Not found');}
}
if(process.argv[1]&&resolve(process.argv[1])===import.meta.filename)http.createServer(handler).listen(Number(process.env.PORT||5192),'127.0.0.1',()=>{console.log(`Price Watch: http://127.0.0.1:${process.env.PORT||5192}/`);scheduler.start();});
