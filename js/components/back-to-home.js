// js/components/back-to-home.js

export function renderBackToHome() {
  return `<a href="#home" class="back-to-home" data-nav="home">← ホームへ</a>`;
}

export function initBackToHome(navigateTo) {
  document.querySelectorAll('[data-nav="home"]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('home');
    });
  });
}