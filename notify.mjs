const ENDPOINT='https://api.resend.com/emails';
const mask=a=>a.replace(/^(.).*(@.*)$/,'$1***$2');
// Email through Resend's HTTPS API: no dependency, three environment variables. Swap this file to use another provider.
export function createNotifier({env=process.env,fetcher=fetch}={}) {
  const key=env.RESEND_API_KEY?.trim(),to=env.ALERT_EMAIL_TO?.trim(),from=env.ALERT_EMAIL_FROM?.trim()||'Price Watch <onboarding@resend.dev>';
  const configured=Boolean(key&&/^[^\s@]+@[^\s@]+$/.test(to||''));
  return {
    configured,to:configured?mask(to):'',
    async send({subject,text,html}) {
      if(!configured)throw Error('Email is not configured. Set RESEND_API_KEY and ALERT_EMAIL_TO in .env.');
      let response;
      try{response=await fetcher(ENDPOINT,{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[to],subject,text,html}),signal:AbortSignal.timeout(20000)});}
      catch{throw Error('Resend could not be reached. The price check itself was saved.');}
      if(!response.ok){const body=await response.json().catch(()=>({}));throw Error(`Resend returned HTTP ${response.status}${body.message?`: ${String(body.message).slice(0,160)}`:''}`);}
      return true;
    }
  };
}
