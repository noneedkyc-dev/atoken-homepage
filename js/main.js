
const wechatBtn = document.getElementById('wechatBtn');
const wechatModal = document.getElementById('wechatModal');
const wechatClose = document.getElementById('wechatClose');
const wechatCloseTop = document.getElementById('wechatCloseTop');

function openWechat(){
  wechatModal.classList.add('show');
  wechatModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeWechat(){
  wechatModal.classList.remove('show');
  wechatModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

if (wechatBtn) wechatBtn.addEventListener('click', openWechat);
if (wechatClose) wechatClose.addEventListener('click', closeWechat);
if (wechatCloseTop) wechatCloseTop.addEventListener('click', closeWechat);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeWechat();
});
