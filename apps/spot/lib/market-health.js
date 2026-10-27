import {signedHeaders} from './market.js';
import {normalizeCandles} from './core.js';
// 固定的只读连接检查资产；绝不代替 AT，也不用于交易报价。
export const CHECK_TOKEN = '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c';
const cache = new Map();
const pending = new Map();
export async function getMarketHealth(kind = 'latest', env = process.env, fetcher = fetch) {
  if (!['latest', 'history'].includes(kind)) return {status:400,body:{error:'INVALID_CHECK'}};
  const configured = ['OKX_API_KEY','OKX_SECRET_KEY','OKX_PASSPHRASE'].every(key => Boolean(env[key]));
  if (!configured) return {status:503,body:{ok:false,error:'MARKET_NOT_CONFIGURED'}};
  const cached=cache.get(kind);
  if(cached?.until>Date.now()) return cached.result;
  if(pending.has(kind)) return pending.get(kind);
  const task = (async () => {
    let result;
    try {
      const params=new URLSearchParams({chainIndex:'56',tokenContractAddress:CHECK_TOKEN,bar:'1H',limit:'10'});
      if(kind==='history') params.set('after',String(Date.now()-86400000));
      const path=`/api/v6/dex/market/${kind==='history'?'historical-candles':'candles'}?${params}`;
      const headers=signedHeaders(new Date().toISOString(),path,env.OKX_SECRET_KEY,env.OKX_API_KEY,env.OKX_PASSPHRASE);
      const response=await fetcher(`https://web3.okx.com${path}`,{headers,signal:AbortSignal.timeout(10000)});
      const payload=await response.json().catch(()=>({}));
      const upstreamCode=/^\d{1,10}$/.test(String(payload.code))?String(payload.code):null;
      const candles=payload.code==='0'?normalizeCandles(payload.data):[];
      const last=candles.at(-1);
      result=response.ok && last ? {status:200,body:{ok:true,source:'OKX',check:kind,symbol:'WBNB',quoteCurrency:'USD',chainId:56,tokenAddress:CHECK_TOKEN,candleCount:candles.length,lastCandleTime:last.time,lastClose:last.close,checkedAt:Date.now(),notice:'Read-only WBNB connectivity check; not AT market data.'}} : {status:502,body:{ok:false,error:'UPSTREAM_CHECK_FAILED',upstreamStatus:response.status,upstreamCode}};
    } catch {result={status:502,body:{ok:false,error:'MARKET_UNAVAILABLE'}};}
    // 缓存成功/失败，限制此固定检查端点的重复调用；不返回凭据或原始错误正文。
    cache.set(kind,{until:Date.now()+60000,result});
    pending.delete(kind);
    return result;
  })();
  pending.set(kind,task);
  return task;
}
