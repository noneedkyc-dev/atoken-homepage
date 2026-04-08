const modal = document.getElementById('qrModal');
const openBtn = document.querySelector('.wechat');
const closeEls = document.querySelectorAll('[data-close]');

if (openBtn && modal) {
  openBtn.addEventListener('click', () => {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  });
}
closeEls.forEach(el => {
  el.addEventListener('click', () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  });
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.classList.contains('open')) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
});
