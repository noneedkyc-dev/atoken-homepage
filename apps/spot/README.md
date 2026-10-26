# AToken Spot — AT/USDT

独立现货交易终端。品牌蓝和真实 AToken Logo；响应式中英文界面。原生 JS + ethers + TradingView Lightweight Charts，无业务数据库。

## 运行

```sh
npm ci
npm test
npm run build
npm run dev
```

## 当前状态

AT 合约未公布，默认交易关闭。演示 K 线明确标注，不代表发行价，也不生成兑换报价。生产模式配置真实 AT 后绝不回退到模拟 K 线。钱包支持 EIP-6963 浏览器钱包、OKX Wallet 和注入式 MetaMask；手机请在钱包内置浏览器打开。未接 WalletConnect 二维码。

## 唯一 AT 地址入口

`lib/config.js` 中：

```js
export const AT_TOKEN_ADDRESS = "";
```

地址填入后，余额、报价、图表与合约链接统一使用该值。修改必须重新构建部署。填写地址不自动开交易。

## 开放主网交易前

1. 填入 AT 地址，核验代码、精度、无转账税；核验 BSC USDT 地址。
2. 在 `CONFIG.pool` 填正式池地址、V2/V3 版本和真实 V3 fee。默认 V3 的 2500 仅为待核验配置，不代表已建池。
3. 本版本使用 AT/USDT 单池直连适配器，提供 V2 Router 和 V3 SwapRouter / QuoterV2，不进行跨池最优路径聚合。后续多链替换为聚合适配器。
4. 交易前会核验池子 token0/token1、官方 Router 工厂、工厂 getPair/getPool 返回值、池子费率。滑点最小收到使用整数计算。钱包/网络变化使旧报价失效。授权仅本次额度，必要时先归零。授权完成重新报价，再经用户确认、估算 gas 后签名。
5. 使用真实 AT 做主网小额买入、卖出、授权、失败及网络切换验收；本次因缺少真实 AT/池子，未完成这些主网验收，不应直接开放。
6. 完成验证后关闭演示标记，并手动设置 `tradingEnabled: true`。

## OKX 行情

在 Vercel 项目配置 `OKX_API_KEY`、`OKX_SECRET_KEY`、`OKX_PASSPHRASE`，再部署。不要填中心化交易所交易密钥，也不要提交任何密钥。服务端 `/api/market` 只查询配置的 AT：最新 candles / 历史 historical-candles，数据单位为 USD 参考行情，不声称是指定 AT/USDT 单池行情。

带短缓存、同请求合并、实例内节流和超时；页面后台降低刷新频率。多实例全局限流在增长阶段需补共享存储。API 权限、覆盖、额度、收费及数据展示条款需在生产接入时确认。AT 未被覆盖时显示行情同步中，交易独立。

## Vercel + Git

代码目录：`noneedkyc-dev/atoken-homepage` 仓库的 `atoken-spot` 分支，`apps/spot` 目录。主站 main 分支保持不变。

新建独立 Vercel 项目：

- Name: `atoken-spot`
- Git repository: `noneedkyc-dev/atoken-homepage`
- Production branch: **`atoken-spot`**（首次导入应选择该分支）
- Root Directory: **`apps/spot`**
- Framework: Other
- Install: `npm ci`
- Build: `npm run build`
- Output: `dist`

`api/market.js` 为 Vercel Function。不要只上传 dist 而遗漏 API 源码。未来推送该分支后由 Vercel Git 集成部署。不要向 main 合并本独立项目，除非计划整合主站。

当前项目创建被 Vercel 403 权限阻止；CLI 也没有登录凭据。必须取得项目创建权限，或由账号所有者按上述配置导入。没有声称已经部署成功。

## 验证与后续

自动测试覆盖交易关闭、地址、代币精度、最低收到金额、K 线清洗、未配置市场接口和请求签名。无私钥、无后端代签、无充值托管。交易记录仅为本页会话，不是完整钱包历史；完整记录查 BscScan。

后续可扩展：多链聚合、代币搜索、服务费、多链钱包、跨链、运营数据库。

## Attribution

TradingView Lightweight Charts™ is used for chart rendering. Copyright (c) TradingView, Inc. https://www.tradingview.com/ . Apache-2.0, see `THIRD_PARTY_NOTICES.txt`. The chart keeps its attribution link. No claim of partnership with TradingView, OKX or PancakeSwap.
