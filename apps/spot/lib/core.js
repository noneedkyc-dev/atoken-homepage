export const isAddress = value => /^0x[0-9a-fA-F]{40}$/.test(value || "") && !/^0x0{40}$/i.test(value);
export function ready(c) {
  return c.chainId === 56 && c.tradingEnabled === true && isAddress(c.tokenAddress) && isAddress(c.usdtAddress) && c.tokenAddress.toLowerCase() !== c.usdtAddress.toLowerCase() && isAddress(c.pool?.address) && ["v2", "v3"].includes(c.pool?.version) && isAddress(c.routers?.[c.pool.version]) && (c.pool.version !== "v3" || [100,500,2500,10000].includes(c.pool.fee));
}
export function minimumOut(amount, bps) {
  if (typeof amount !== "bigint" || amount <= 0n || !Number.isInteger(bps) || bps < 1 || bps > 300) throw new Error("Invalid amount or slippage");
  const minimum = amount * BigInt(10000 - bps) / 10000n;
  if (minimum === 0n) throw new Error("Output too small");
  return minimum;
}
export function parseAmountText(text, decimals) {
  if (!/^(?:0|[1-9]\d*)(?:\.\d*)?$/.test(text) || text.length > 80) throw new Error("Invalid amount");
  const [whole, fraction = ""] = text.split(".");
  if (fraction.length > decimals) throw new Error("Too many decimals");
  return BigInt(whole + fraction.padEnd(decimals, "0"));
}
export const shorten = address => `${address.slice(0,6)}…${address.slice(-4)}`;
export function normalizeCandles(rows) {
  const map = new Map();
  for (const row of rows || []) {
    const [ts,o,h,l,c,v] = row.map(Number);
    if (![ts,o,h,l,c,v].every(Number.isFinite) || ts <= 0 || Math.min(o,h,l,c) <= 0 || h < Math.max(o,l,c) || l > Math.min(o,h,c) || v < 0) continue;
    const time = Math.floor(ts / 1000);
    map.set(time,{time,open:o,high:h,low:l,close:c,volume:v});
  }
  return [...map.values()].sort((a,b)=>a.time-b.time);
}
