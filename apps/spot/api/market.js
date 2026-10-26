import {getMarket} from '../lib/market.js';
export default async function handler(req,res){
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'METHOD_NOT_ALLOWED'});}
  const {status,body}=await getMarket(req.query||{});
  res.setHeader('Cache-Control',status===200?'public, s-maxage=10, stale-while-revalidate=20':'no-store');
  return res.status(status).json(body);
}
