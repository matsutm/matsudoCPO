// js/main.js
import { getCurrentUser } from './services/auth-service.js';
import { renderAuthView, initAuthView } from './views/auth-view.js';
import { renderHomeView, initHomeView } from './views/home-view.js';
import { renderCalendarView, initCalendarView } from './views/calendar-view.js';
import { renderAnnouncementView, initAnnouncementView } from './views/announcement-view.js';

const appContent = document.getElementById('app-content');

// 画面切り替えの司令塔
export async function navigateTo(viewName, isBrowserBack = false) {
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
      await initAnnouncementView();
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

// アプリ起動時の初期化
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