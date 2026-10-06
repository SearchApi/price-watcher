const int=(v,fallback,min,max)=>{const n=Number(v);return Number.isFinite(n)&&n>=min&&n<=max?Math.floor(n):fallback;};
// Limits come from the environment so a public clone can raise them on a paid plan.
export function readLimits(env=process.env){
  return {
    maxProducts:int(env.PRICE_WATCH_MAX_PRODUCTS,5,1,50),
    maxObservations:int(env.PRICE_WATCH_MAX_OBSERVATIONS,60,2,500),
    checkHours:int(env.PRICE_WATCH_CHECK_HOURS,24,1,168),
    hourlyLimit:int(env.PRICE_WATCH_HOURLY_LIMIT,30,1,10000),
    autoCheck:env.PRICE_WATCH_AUTO_CHECK!=='off'
  };
}
