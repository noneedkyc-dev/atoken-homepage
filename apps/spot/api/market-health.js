import {getMarketHealth} from '../lib/market-health.js';
export default async function handler(req,res){
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'METHOD_NOT_ALLOWED'});}
  const {status,body}=await getMarketHealth(req.query?.check||'latest');
  res.setHeader('Cache-Control','public, s-maxage=60');
  return res.status(status).json(body);
}
