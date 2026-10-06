import {randomBytes} from 'node:crypto';
import {createStore,readKey} from './store.mjs';
export function createHandler({store=createStore(),configured=readKey,scheduler=null}={}) {
  const csrf=randomBytes(24).toString('hex');
  return async(req,res)=>{
    const send=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));};
    const host=req.headers.host||'';
    if(!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)||req.headers['sec-fetch-site']==='cross-site'||req.headers.origin&&req.headers.origin!==`http://${host}`)return send(403,{error:'Price Watch is a local workspace. Open it on localhost.'});
    const info=async state=>({...state,csrf,configured:Boolean(await configured()),usage:await store.usage(),auto:scheduler?await scheduler.status():null});
    try{
      if(req.method==='GET')return send(200,await info(await store.get()));
      if(req.method!=='POST')return send(405,{error:'Use GET or POST.'});
      if(req.headers['x-price-watch-token']!==csrf)return send(403,{error:'Reload Price Watch before trying again.'});
      if(!(req.headers['content-type']||'').startsWith('application/json'))return send(415,{error:'JSON is required.'});
      let body='',bytes=0;for await(const chunk of req){bytes+=Buffer.byteLength(chunk);if(bytes>16000)return send(413,{error:'The request is too large.'});body+=chunk;}
      const input=JSON.parse(body);if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid request.');
      return send(200,await info(await store.act(input)));
    }catch(error){const msg=error instanceof SyntaxError?'Invalid request.':error.message;return send(400,{error:msg});}
  };
}
