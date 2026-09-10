// js/main.js
import { renderCalendarView, initCalendar } from './views/calendar-view.js';

const appContent = document.getElementById('app-content');

// 画面切り替えの司令塔
function navigateTo(viewName, isBrowserBack = false) {
  if (viewName === 'home') {
    showHomeScreen();
  } else if (viewName === 'calendar') {
    showCalendarScreen();
  }

  if (!isBrowserBack) {
    history.pushState({ view: viewName }, '', `#${viewName}`);
  }
}

// 1. ホーム画面を描画
function showHomeScreen() {
  appContent.innerHTML = `
    <section class="card">
      <h2>🗓 直近の練習スケジュール</h2>
      <div id="nextEventsContainer"><p>読み込み中...</p></div>
      <button id="btnGoCalendar" class="btn-primary">カレンダー全体を見る ➔</button>
    </section>

    <div class="quick-menu-grid">
      <button class="menu-card" id="menuCalendar">📅 練習カレンダー</button>
      <button class="menu-card" id="menuBulletin">💬 掲示板</button>
      <button class="menu-card" id="menuMembers">👥 団員名簿</button>
    </div>
  `;

  // イベント登録
  document.getElementById('btnGoCalendar')?.addEventListener('click', () => navigateTo('calendar'));
  document.getElementById('menuCalendar')?.addEventListener('click', () => navigateTo('calendar'));
  
  // 直近予定の読み込み
  loadNextTwoSchedules();
}

// 2. カレンダー画面（完全に calendar-view.js に一任）
function showCalendarScreen() {
  // ① calendar-view.js からHTML（モーダル含）を受け取って画面にセット
  appContent.innerHTML = renderCalendarView();

  // ② calendar-view.js のカレンダー起動処理を実行
  initCalendarView();
}

// 直近2件取得
async function loadNextTwoSchedules() {
  const container = document.getElementById('nextEventsContainer');
  if (!container) return;
  const today = new Date().toISOString().split('T')[0];

  const { data: schedules } = await supabaseClient
    .from('schedules')
    .select('*')
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(2);

  if (!schedules || schedules.length === 0) {
    container.innerHTML = '<p>今後の予定はありません。</p>';
    return;
  }

  container.innerHTML = schedules.map(item => `
    <div class="event-item">
      <strong>📅 ${item.date} (${item.start_time?.slice(0,5) || ''}〜)</strong>
      <div>📍 ${item.location || '未定'}</div>
    </div>
  `).join('');
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