const HOUR=3600000;
// Checks each active product every `checkHours`, one product per tick, using the same refresh action as the button.
export function createScheduler({store,limits,now=()=>Date.now(),log=()=>{}}) {
  let timer=null,running=false,pausedUntil=0,pausedReason='',lastRun='',lastError='',enabled=limits.autoCheck;
  const retry=new Map();
  const dueAt=(p,hours=limits.checkHours)=>Math.max(Date.parse(p.snapshots.at(-1).capturedAt)+hours*HOUR,retry.get(p.id)||0);
  async function tick() {
    if(running)return null;running=true;
    try {
      const state=await store.get();enabled=state.settings.autoCheck;
      if(!enabled||now()<pausedUntil)return null;
      const due=state.products.filter(p=>!p.archived&&dueAt(p,limits.checkHours)<=now()).sort((a,b)=>dueAt(a)-dueAt(b))[0];
      if(!due)return null;
      try {
        await store.act({action:'refresh',id:due.id,revision:state.revision});
        retry.set(due.id,now()+limits.checkHours*HOUR);lastRun=new Date(now()).toISOString();lastError='';pausedReason='';
        log(`checked ${due.title}`);return {checked:due.id};
      } catch(error) {
        lastError=error.message;
        if(error.code==='quota'||error.code==='billing'||error.code==='key'){pausedUntil=now()+HOUR;pausedReason=error.code;}
        else if(error.code==='rate'){pausedUntil=now()+HOUR;pausedReason='rate';}
        else retry.set(due.id,now()+Math.min(HOUR,limits.checkHours*HOUR));
        log(`check failed: ${error.message}`);return {failed:due.id};
      }
    } finally {running=false;}
  }
  return {
    tick,
    start(every=60000){if(timer)return;setTimeout(()=>tick().catch(()=>{}),3000).unref();timer=setInterval(()=>tick().catch(()=>{}),every);timer.unref();},
    stop(){clearInterval(timer);timer=null;},
    // `next` is derived from saved snapshots, so it survives restarts.
    async status(){
      const state=await store.get(),active=state.products.filter(p=>!p.archived);
      const next=active.length?Math.min(...active.map(p=>dueAt(p,limits.checkHours))):null;
      return {enabled:state.settings.autoCheck,running:Boolean(timer),everyHours:limits.checkHours,next:next?new Date(Math.max(next,now())).toISOString():'',lastRun,lastError,paused:now()<pausedUntil?pausedReason:''};
    }
  };
}
