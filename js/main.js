// js/main.js
import { initCalendar } from './views/calendar-view.js';

const appContent = document.getElementById('app-content');

// 画面切り替えの司令塔
function navigateTo(viewName) {
  if (viewName === 'home') {
    showHomeScreen();
  } else if (viewName === 'calendar') {
    showCalendarScreen();
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

// 2. もともと作っていたカレンダー画面を描画
function showCalendarScreen() {
  appContent.innerHTML = `
    <div style="margin-bottom: 12px; text-align: right;">
      <button id="btnOpenCreateModal" class="btn-primary">＋ 予定を追加</button>
    </div>
    <div id="calendar"></div>
  `;

  // 元のカレンダー処理（calendar-view.js）を起動！
  initCalendar();
}

// 直近2件取得
async function loadNextTwoSchedules() {
  const container = document.getElementById('nextEventsContainer');
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
  navigateTo('home');
});