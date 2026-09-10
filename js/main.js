// js/main.js
import { renderHomeView, initHomeView } from './views/home-view.js';
import { renderCalendarView, initCalendarView } from './views/calendar-view.js';

const appContent = document.getElementById('app-content');

// 画面切り替えの司令塔
async function navigateTo(viewName, isBrowserBack = false) {
  if (viewName === 'home') {
    appContent.innerHTML = renderHomeView();
    await initHomeView(navigateTo);
  } else if (viewName === 'calendar') {
    appContent.innerHTML = renderCalendarView();
    await initCalendarView();  }

  if (!isBrowserBack) {
    history.pushState({ view: viewName }, '', `#${viewName}`);
  }
}

// 1. ホーム画面を描画
function showHomeScreen() {
  appContent.innerHTML = renderHomeView();
  initHomeView();
}

// 2. カレンダー画面（完全に calendar-view.js に一任）
function showCalendarScreen() {
  // ① calendar-view.js からHTML（モーダル含）を受け取って画面にセット
  appContent.innerHTML = renderCalendarView();
  // ② calendar-view.js のカレンダー起動処理を実行
  initCalendarView();
}


// アプリ起動時はホーム画面を表示
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('navHome')?.addEventListener('click', () => navigateTo('home'));

  window.addEventListener('popstate', (event) => {
    const viewName = event.state?.view || 'home';
    navigateTo(viewName, true);
  });

  const initialView = location.hash.replace('#', '') || 'home';
  history.replaceState({ view: initialView }, '', `#${initialView}`);
  navigateTo(initialView, true);
});