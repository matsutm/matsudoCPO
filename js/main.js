// js/main.js
import { renderHomeView, initHomeView } from './views/home-view.js';
import { renderCalendarView, initCalendarView } from './views/calendar-view.js';

const appContent = document.getElementById('app-content');

async function navigateTo(viewName) {
  if (viewName === 'home') {
    appContent.innerHTML = renderHomeView();
    await initHomeView(navigateTo);
  } else if (viewName === 'calendar') {
    appContent.innerHTML = renderCalendarView();
    await initCalendarView();
  } else if (viewName === 'bulletin') {
    appContent.innerHTML = '<div class="card"><h2>💬 団内掲示板</h2><p>準備中の画面です。</p></div>';
  } else if (viewName === 'members') {
    appContent.innerHTML = '<div class="card"><h2>👥 団員名簿</h2><p>準備中の画面です。</p></div>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // ロゴクリックでホームに戻る
  document.getElementById('navHomeLogo')?.addEventListener('click', () => navigateTo('home'));
  
  // 初期画面としてホームを表示
  navigateTo('home');
});