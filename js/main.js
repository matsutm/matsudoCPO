// js/main.js
import { getCurrentUser } from './services/auth-service.js';
import { renderAuthView, initAuthView } from './views/auth-view.js';
import { renderHomeView, initHomeView } from './views/home-view.js';
import { renderCalendarView, initCalendarView } from './views/calendar-view.js';
import { renderAnnouncementView, initAnnouncementView } from './views/announcement-view.js';
import { renderLibraryView, initLibraryView } from './views/library-view.js';

const appContent = document.getElementById('app-content');

// 画面切り替えの司令塔
export async function navigateTo(viewName, isBrowserBack = false) {
  updateLoginUserDisplay();
  const user = getCurrentUser();

  // 未認証の場合は強制的にログイン画面へ
  if (!user) {
    appContent.innerHTML = renderAuthView();
    initAuthView(() => {
      navigateTo('home');
    });
    return;
  }

  // ルーティング分岐
  switch (viewName) {
    case 'home':
      appContent.innerHTML = renderHomeView();
      await initHomeView(navigateTo);
      break;

    case 'calendar':
      appContent.innerHTML = renderCalendarView();
      await initCalendarView();
      break;

    case 'announcement':
      appContent.innerHTML = renderAnnouncementView();
      await initAnnouncementView(navigateTo);
      break;

    case 'library':
      appContent.innerHTML = renderLibraryView();
      await initLibraryView(navigateTo);
      break;

    default:
      appContent.innerHTML = renderHomeView();
      await initHomeView(navigateTo);
      break;
  }

  if (!isBrowserBack) {
    history.pushState({ view: viewName }, '', `#${viewName}`);
  }
}

//ユーザ名を表示する
function updateLoginUserDisplay() {
  const user = getCurrentUser();
  const el = document.getElementById('loginUserDisplay');
  if (!el) return;

  if (user) {
    el.textContent = `${user.name} さん`;
  } else {
    el.textContent = '';
  }
}

// アプリ起動時の初期化
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('navHome')?.addEventListener('click', () => navigateTo('home'));

  // ブラウザの「戻る・進む」ボタン操作時のイベント
  window.addEventListener('popstate', (event) => {
    const viewName = event.state?.view || 'home';
    navigateTo(viewName, true);
  });

  // URLのハッシュ（例: #announcement）を取得（無ければ 'home'）
  const initialView = location.hash.replace('#', '') || 'home';
  // 履歴の状態を初期セット
  history.replaceState({ view: initialView }, '', `#${initialView}`);
  // URLのハッシュから判定した画面へ遷移させる
  navigateTo(initialView, true);
});