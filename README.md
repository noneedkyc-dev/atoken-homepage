# AToken High-Fidelity Landing Recreation (Final)

This package contains the final high-fidelity recreation of the approved AToken landing hero.

## Included
- `index.html` - landing page hero
- `css/styles.css` - styling and hotspot positioning
- `js/app.js` - Binance WebSocket live ticker + WeChat modal + Discord placeholder toast
- `assets/hero-reference.png` - approved visual reference used for the high-fidelity recreation
- `assets/atoken-logo.png` - logo asset
- `assets/wechatqr.png` - WeChat QR asset (replace with your official QR if needed)
- `favicon.ico` - favicon generated from the AToken logo
- `robots.txt` - search-engine crawl rules

## Links wired
- Launch APP -> https://dex.atoken.xyz
- Explore Markets -> https://dex.atoken.xyz/markets
- Telegram -> https://t.me/atokenxyz
- X -> https://x.com/ATokenxyz
- WeChat -> opens QR modal using `assets/wechatqr.png`
- Discord -> placeholder toast (update in `index.html` once you have the URL)

## Live market ticker
The center ticker connects to Binance WebSocket and streams live prices for:
BTC, ETH, SOL, BNB, XRP, ADA, DOGE, AVAX

## Run locally
Open `index.html` directly in a browser, or serve the folder with any static server.
For best compatibility, use a local server.
