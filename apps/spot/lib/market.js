import {createHmac} from 'node:crypto';
import {CONFIG} from './config.js';
import {isAddress} from './core.js';
const ALLOWED_BARS=new Set(['1m','5m','15m','1H','4H','1D']);
const cache=new Map();
const inFlight=new Map();
let nextRequestAt=0;
export function signedHeaders(timestamp,path,secret,key,passphrase){return {'OK-ACCESS-KEY':key,'OK-ACCESS-SIGN':createHmac('sha256',secret).update(timestamp+'GET'+path).digest('base64'),'OK-ACCESS-TIMESTAMP':timestamp,'OK-ACCESS-PASSPHRASE':passphrase};}
export async function getMarket(query,env=process.env,fetcher=fetch){
  const bar=query.bar||'1H';const after=query.after;
  if(!ALLOWED_BARS.has(bar)||(after!==undefined&&!/^\d{10,16}$/.test(String(after))))return {status:400,body:{error:'INVALID_PARAMETERS'}};
  if(!isAddress(CONFIG.tokenAddress))return {status:503,body:{error:'TOKEN_NOT_CONFIGURED',data:[]}};
  const key=env.OKX_API_KEY,secret=env.OKX_SECRET_KEY,passphrase=env.OKX_PASSPHRASE;
  if(!key||!secret||!passphrase)return {status:503,body:{error:'MARKET_NOT_CONFIGURED',data:[]}};
  const cacheKey=`${CONFIG.chainId}:${CONFIG.tokenAddress.toLowerCase()}:${bar}:${after||'latest'}`;
  const hit=cache.get(cacheKey);if(hit&&hit.until>Date.now())return {status:200,body:hit.body};
  if(inFlight.has(cacheKey))return inFlight.get(cacheKey);
  // 实例内总请求门限；配合 CDN 缓存。扩容时需使用共享限流存储。
  if(Date.now()<nextRequestAt)return {status:429,body:{error:'RATE_LIMITED'}};
  nextRequestAt=Date.now()+1000;
  const task=(async()=>{try{
    const params=new URLSearchParams({chainIndex:String(CONFIG.chainId),tokenContractAddress:CONFIG.tokenAddress.toLowerCase(),bar,limit:'200'});
    if(after)params.set('after',String(after));
    const path=`/api/v6/dex/market/${after?'historical-candles':'candles'}?${params}`;
    const headers=signedHeaders(new Date().toISOString(),path,secret,key,passphrase);
    const response=await fetcher(`https://web3.okx.com${path}`,{headers,signal:AbortSignal.timeout(8000)});
    if(!response.ok)return {status:response.status===429?429:502,body:{error:'MARKET_UNAVAILABLE',data:[]}};
    const payload=await response.json();if(payload.code!=='0'||!Array.isArray(payload.data))return {status:502,body:{error:'MARKET_UNAVAILABLE',data:[]}};
    const body={data:payload.data,source:'OKX',quoteCurrency:'USD',chainId:CONFIG.chainId,tokenAddress:CONFIG.tokenAddress,updatedAt:Date.now()};
    if(cache.size>=250)cache.delete(cache.keys().next().value);cache.set(cacheKey,{until:Date.now()+(after?300000:10000),body});return {status:200,body};
  }catch{return {status:502,body:{error:'MARKET_UNAVAILABLE',data:[]}};}finally{inFlight.delete(cacheKey);}})();
  inFlight.set(cacheKey,task);return task;
}
