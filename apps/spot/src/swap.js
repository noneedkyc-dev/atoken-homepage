import {BrowserProvider,Contract,formatUnits} from 'ethers';
import {minimumOut,parseAmountText,ready} from '../lib/core.js';
const ERC20=['function decimals() view returns(uint8)','function balanceOf(address) view returns(uint256)','function allowance(address,address) view returns(uint256)','function approve(address,uint256) returns(bool)'];
const POOL=['function token0() view returns(address)','function token1() view returns(address)','function factory() view returns(address)','function fee() view returns(uint24)','function getReserves() view returns(uint112,uint112,uint32)','function slot0() view returns(uint160 sqrtPriceX96,int24 tick,uint16,uint16,uint16,uint32,bool)'];
const V2=['function factory() view returns(address)','function getAmountsOut(uint256,address[]) view returns(uint256[])','function swapExactTokensForTokens(uint256,uint256,address[],address,uint256) returns(uint256[])'];
const V3=['function factory() view returns(address)','function exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 deadline,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96)) payable returns(uint256)'];
const QUOTER=['function quoteExactInputSingle((address tokenIn,address tokenOut,uint256 amountIn,uint24 fee,uint160 sqrtPriceLimitX96)) returns(uint256 amountOut,uint160 sqrtPriceX96After,uint32 initializedTicksCrossed,uint256 gasEstimate)'];
export class SwapClient {
  constructor(config,provider){this.config=config;this.raw=provider;this.provider=new BrowserProvider(provider,'any');}
  async network(){if(Number(await this.raw.request({method:'eth_chainId'}))!==56)throw new Error('WRONG_NETWORK');}
  async account(){const accounts=await this.raw.request({method:'eth_accounts'});if(!accounts?.[0])throw new Error('NO_ACCOUNT');return accounts[0];}
  async validatePool(){
    if(!ready(this.config))throw new Error('TRADING_CLOSED');
    await this.network();const c=this.config;
    const pool=new Contract(c.pool.address,POOL,this.provider);
    const [a,b,code]=await Promise.all([pool.token0(),pool.token1(),this.provider.getCode(c.tokenAddress)]);
    if(code==='0x')throw new Error('INVALID_TOKEN');
    const actual=[a.toLowerCase(),b.toLowerCase()].sort().join(',');
    if(actual!==[c.tokenAddress.toLowerCase(),c.usdtAddress.toLowerCase()].sort().join(','))throw new Error('INVALID_POOL');
    const router=new Contract(c.routers[c.pool.version],c.pool.version==='v2'?V2:V3,this.provider);
    const factoryAddress=await router.factory();
    if((await pool.factory()).toLowerCase()!==factoryAddress.toLowerCase())throw new Error('INVALID_FACTORY');
    const factory=new Contract(factoryAddress,['function getPair(address,address) view returns(address)','function getPool(address,address,uint24) view returns(address)'],this.provider);
    const canonical=c.pool.version==='v2'?await factory.getPair(a,b):await factory.getPool(a,b,c.pool.fee);
    if(canonical.toLowerCase()!==c.pool.address.toLowerCase())throw new Error('INVALID_POOL');
    if(c.pool.version==='v3'&&Number(await pool.fee())!==c.pool.fee)throw new Error('INVALID_FEE');
    return {pool,token0:a};
  }
  async balances(address){
    const c=this.config; await this.network();
    const at=c.tokenAddress?new Contract(c.tokenAddress,ERC20,this.provider):null;
    const usdt=new Contract(c.usdtAddress,ERC20,this.provider);
    const [ud,ub,ad,ab]=await Promise.all([usdt.decimals(),usdt.balanceOf(address),at?at.decimals():null,at?at.balanceOf(address):null]);
    return {USDT:{raw:ub,decimals:Number(ud),text:formatUnits(ub,ud)},AT:at?{raw:ab,decimals:Number(ad),text:formatUnits(ab,ad)}:null};
  }
  async quote(buy,text,bps){
    const {pool,token0}=await this.validatePool();const c=this.config;
    const input=buy?c.usdtAddress:c.tokenAddress, output=buy?c.tokenAddress:c.usdtAddress;
    const [di,doo]=await Promise.all([new Contract(input,ERC20,this.provider).decimals(),new Contract(output,ERC20,this.provider).decimals()]);
    const amount=parseAmountText(text,Number(di));if(amount<=0n)throw new Error('INVALID_AMOUNT');
    let out,spot;
    if(c.pool.version==='v2'){
      const router=new Contract(c.routers.v2,V2,this.provider);
      const [amounts,reserves]=await Promise.all([router.getAmountsOut(amount,[input,output]),pool.getReserves()]);
      out=amounts[1];const rIn=token0.toLowerCase()===input.toLowerCase()?reserves[0]:reserves[1],rOut=token0.toLowerCase()===input.toLowerCase()?reserves[1]:reserves[0];
      if(rIn===0n||rOut===0n)throw new Error('NO_LIQUIDITY');spot=Number(rOut)/Number(rIn);
    }else{
      const quoter=new Contract(c.v3Quoter,QUOTER,this.provider);
      const [quoted,slot]=await Promise.all([quoter.quoteExactInputSingle.staticCall({tokenIn:input,tokenOut:output,amountIn:amount,fee:c.pool.fee,sqrtPriceLimitX96:0n}),pool.slot0()]);
      out=quoted.amountOut;const ratio=(Number(slot.sqrtPriceX96)/2**96)**2;spot=token0.toLowerCase()===input.toLowerCase()?ratio:1/ratio;
    }
    const impact=Math.max(0,(1-Number(out)/Number(amount)/spot)*100);
    if(!Number.isFinite(impact)||impact>c.maxPriceImpactPercent)throw new Error('PRICE_IMPACT');
    return {buy,text,bps,input,output,amount,out,di:Number(di),doo:Number(doo),display:formatUnits(out,doo),minimum:minimumOut(out,bps),impact,at:Date.now()};
  }
  async execute(quote,onStage,guard=()=>{}){
    if(!ready(this.config))throw new Error('TRADING_CLOSED');
    await this.network();guard();const account=await this.account();guard();
    const signer=await this.provider.getSigner(account);const c=this.config;const spender=c.routers[c.pool.version];
    const token=new Contract(quote.input,ERC20,signer);
    const [balance,bnb]=await Promise.all([token.balanceOf(account),this.provider.getBalance(account)]);guard();
    if(balance<quote.amount)throw new Error('INSUFFICIENT_BALANCE');if(bnb===0n)throw new Error('NO_GAS');
    let allowance=await token.allowance(account,spender);guard();
    if(allowance<quote.amount){
      // USDT 等代币可能要求先将非零授权归零。
      if(allowance>0n){onStage('resetApproval');guard();await this.network();guard();const reset=await token.approve(spender,0n);await reset.wait();guard();}
      onStage('approving');await this.network();guard();const approval=await token.approve(spender,quote.amount);await approval.wait();guard();
    }
    // 授权耗时不可沿用旧报价；重新询价并再次确认。
    const fresh=await this.quote(quote.buy,quote.text,quote.bps);guard();
    if((await this.account()).toLowerCase()!==account.toLowerCase())throw new Error('ACCOUNT_CHANGED');
    const out=formatUnits(fresh.out,fresh.doo),min=formatUnits(fresh.minimum,fresh.doo);
    onStage('confirming', {out,min,impact:fresh.impact});
    const approved=await onStage('review',{out,min,impact:fresh.impact});if(!approved)throw new Error('USER_CANCELLED');
    guard();await this.network();guard();
    if(Date.now()-fresh.at>30000)throw new Error('QUOTE_EXPIRED');
    if((await this.account()).toLowerCase()!==account.toLowerCase())throw new Error('ACCOUNT_CHANGED');guard();
    const router=new Contract(spender,c.pool.version==='v2'?V2:V3,signer);const deadline=Math.floor(Date.now()/1000)+300;
    const args=c.pool.version==='v2'?[fresh.amount,fresh.minimum,[fresh.input,fresh.output],account,deadline]:[{tokenIn:fresh.input,tokenOut:fresh.output,fee:c.pool.fee,recipient:account,deadline,amountIn:fresh.amount,amountOutMinimum:fresh.minimum,sqrtPriceLimitX96:0n}];
    const method=c.pool.version==='v2'?router.swapExactTokensForTokens:router.exactInputSingle;
    onStage('estimating');const estimate=await method.estimateGas(...args);guard();
    if(Date.now()-fresh.at>30000)throw new Error('QUOTE_EXPIRED');await this.network();guard();
    onStage('signing');const tx=await method(...args,{gasLimit:estimate*120n/100n});
    onStage('submitted',tx.hash);
    // 交易确认状态由回执决定；暂时无法查询时，不把 pending 误判为失败。
    try{const receipt=await tx.wait(1,180000);onStage(receipt?.status===1?'success':'failed',tx.hash);return receipt;}
    catch(error){if(error.code==='TRANSACTION_REPLACED'&&error.receipt){onStage(error.receipt.status===1&&!error.cancelled?'success':'failed',tx.hash);}else if(error.receipt)onStage('failed',tx.hash);else onStage('pending',tx.hash);return null;}
  }
}
