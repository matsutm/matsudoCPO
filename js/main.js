// js/main.js
import { renderHomeView, initHomeView } from './views/home-view.js';
// ※ カレンダーや掲示板も同様にインポート
// import { renderCalendarView, initCalendarView } from './views/calendar-view.js';

const appContent = document.getElementById('app-content');

// 画面切替ルーティング関数
async function navigateTo(viewName) {
  if (viewName === 'home') {
    // 1. ホームのHTMLを差し込む
    appContent.innerHTML = renderHomeView();
    // 2. ホームのJavaScript初期化を実行
    await initHomeView(navigateTo);
  } 
  else if (viewName === 'calendar') {
    appContent.innerHTML = '<h2>📅 カレンダー画面（読み込み中...）</h2>';
    // initCalendarView(); 等を実行
  } 
  else if (viewName === 'bulletin') {
    appContent.innerHTML = '<h2>💬 団内掲示板画面（準備中）</h2>';
  } 
  else if (viewName === 'members') {
    appContent.innerHTML = '<h2>👥 団員名簿画面（準備中）</h2>';
  }
}

// アプリ起動時はホーム画面を表示
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('navHome').addEventListener('click', () => navigateTo('home'));
  navigateTo('home');
});