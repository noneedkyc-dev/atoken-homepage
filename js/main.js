
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.panel, .social-card, .path-card, .cap, .stat').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
    requestAnimationFrame(() => {
      setTimeout(() => {
        el.style.transition = 'opacity .45s ease, transform .45s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, Math.min(i * 45, 420));
    });
  });
});
