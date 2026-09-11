// js/main.js
import { getCurrentUser } from './services/auth-service.js';
import { renderAuthView, initAuthView } from './views/auth-view.js';
import { renderHomeView, initHomeView } from './views/home-view.js';
import { renderCalendarView, initCalendarView } from './views/calendar-view.js';

const appContent = document.getElementById('app-content');

async function router() {
  const appContent = document.getElementById('app-content');
  const user = getCurrentUser(); // ローカルの認証情報を確認

  const hash = location.hash || '#home';

  // ★未認証の場合はどのハッシュが開かれても強制的にログイン画面にする
  if (!user) {
    appContent.innerHTML = renderAuthView();
    initAuthView(() => {
      location.hash = '#home'; // 認証成功したらホームへ
      router();
    });
    return;
  }

  // ログイン済みの通常ルーティング
  switch (hash) {
    case '#home':
      appContent.innerHTML = renderHomeView();
      await initHomeView();
      break;

    case '#announcement':
      // ... お知らせ描画
      break;

    default:
      appContent.innerHTML = renderHomeView();
      await initHomeView();
      break;
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);


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