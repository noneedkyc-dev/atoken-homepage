const tickerTrack = document.getElementById('tickerTrack');
const wsStatus = document.getElementById('wsStatus');
const wechatModal = document.getElementById('wechatModal');
const wechatClose = document.getElementById('wechatClose');
const wechatButton = document.querySelector('.hotspot-wechat');
const discordButton = document.querySelector('.hotspot-discord');
const discordToast = document.getElementById('discordToast');

const symbols = ['btcusdt', 'ethusdt', 'solusdt', 'bnbusdt', 'xrpusdt', 'adausdt', 'dogeusdt', 'avaxusdt'];
const fallback = {
  BTCUSDT: { c: '66842.51', P: '2.35' },
  ETHUSDT: { c: '3128.75', P: '1.85' },
  SOLUSDT: { c: '152.35', P: '4.12' },
  BNBUSDT: { c: '592.41', P: '2.21' },
  XRPUSDT: { c: '0.5287', P: '1.15' },
  ADAUSDT: { c: '0.4612', P: '0.98' },
  DOGEUSDT: { c: '0.1254', P: '3.65' },
  AVAXUSDT: { c: '35.67', P: '2.91' },
};

function formatPrice(symbol, priceStr) {
  const price = Number(priceStr);
  if (symbol === 'DOGEUSDT' || symbol === 'ADAUSDT' || symbol === 'XRPUSDT') {
    return `$${price.toFixed(4)}`;
  }
  if (symbol === 'BTCUSDT') {
    return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }
  return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function renderTickerItems(dataMap) {
  const items = Object.entries(dataMap).map(([symbol, item]) => {
    const pct = Number(item.P || 0);
    const direction = pct >= 0 ? 'up' : 'down';
    const signed = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
    return `
      <div class="ticker-item">
        <span class="ticker-symbol">${symbol.replace('USDT', '')}</span>
        <span class="ticker-price">${formatPrice(symbol, item.c)}</span>
        <span class="ticker-change ${direction}">${signed}</span>
      </div>
    `;
  }).join('');

  tickerTrack.innerHTML = items + items;
}

function connectTicker() {
  renderTickerItems(fallback);

  const stream = `wss://stream.binance.com:9443/stream?streams=${symbols.map(s => `${s}@miniTicker`).join('/')}`;
  let socket;
  let reconnectTimer;

  function updateStatus(text) {
    wsStatus.textContent = text;
  }

  function scheduleReconnect() {
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connectTicker, 2000);
  }

  socket = new WebSocket(stream);

  socket.addEventListener('open', () => updateStatus('Live Binance market feed connected'));

  socket.addEventListener('message', (event) => {
    const payload = JSON.parse(event.data);
    const streamData = payload?.data;
    if (!streamData?.s) return;
    fallback[streamData.s] = { c: streamData.c, P: streamData.P };
    renderTickerItems(fallback);
  });

  socket.addEventListener('close', () => {
    updateStatus('Reconnecting Binance market feed…');
    scheduleReconnect();
  });

  socket.addEventListener('error', () => {
    updateStatus('Using fallback prices while reconnecting…');
    socket.close();
  });
}

function openWechat() {
  wechatModal.classList.add('is-open');
  wechatModal.setAttribute('aria-hidden', 'false');
}

function closeWechat() {
  wechatModal.classList.remove('is-open');
  wechatModal.setAttribute('aria-hidden', 'true');
}

function showDiscordToast() {
  discordToast.classList.add('is-visible');
  discordToast.setAttribute('aria-hidden', 'false');
  clearTimeout(showDiscordToast._timer);
  showDiscordToast._timer = setTimeout(() => {
    discordToast.classList.remove('is-visible');
    discordToast.setAttribute('aria-hidden', 'true');
  }, 2800);
}

wechatButton.addEventListener('click', openWechat);
wechatClose.addEventListener('click', closeWechat);
wechatModal.addEventListener('click', (event) => {
  if (event.target === wechatModal) closeWechat();
});
discordButton.addEventListener('click', showDiscordToast);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeWechat();
});

connectTicker();
