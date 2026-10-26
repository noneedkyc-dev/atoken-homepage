// AT 合约公布后，仅修改这一行；禁止使用其他代币冒充 AT。
export const AT_TOKEN_ADDRESS = "";

export const CONFIG = {
  chainId: 56,
  chainHex: "0x38",
  chainName: "BNB Smart Chain",
  symbol: "AT",
  tokenAddress: AT_TOKEN_ADDRESS,
  usdtAddress: "0x55d398326f99059ff775485246999027b3197955",
  tradingEnabled: false, // 完成主网验收后，手动开放；填地址不会自动开放。
  demoChart: true, // 正式 AT 地址配置后不再使用模拟行情。
  pool: { version: "v3", address: "", fee: 2500 },
  maxPriceImpactPercent: 5,
  routers: {
    v2: "0x10ed43c718714eb63d5aa57b78b54704e256024e",
    v3: "0x1b81d678ffb9c0263b24a97847620c99d213eb14"
  },
  v3Quoter: "0xb048bbc1ee6b733fffcfb9e9cef7375518e25997",
  rpcUrls: ["https://bsc-dataseed.bnbchain.org"],
  explorer: "https://bscscan.com"
};
