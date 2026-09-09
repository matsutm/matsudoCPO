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

// 2. もともと作っていたカレンダー画面を描画（モーダルHTMLも一緒に含める）
function showCalendarScreen() {
  appContent.innerHTML = `
    <div style="margin-bottom: 12px; text-align: right;">
      <button id="btnOpenCreateModal" class="btn-primary">＋ 予定を追加</button>
    </div>
    
    <!-- カレンダー本体 -->
    <div id="calendar"></div>

    <!-- 💡 クリック時に表示される詳細・編集モーダル -->
    <div id="scheduleModal" class="modal-overlay">
      <div class="modal-box">
        <h2 id="modalTitle" class="modal-title">予定</h2>
        
        <form id="scheduleForm">
          <input type="hidden" id="event_id">

          <div class="form-group">
            <label for="date">日付 *</label>
            <input type="date" id="date" class="form-control" required>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label for="start_time">開始時間 *</label>
              <input type="time" id="start_time" class="form-control" value="13:00" required>
            </div>
            <div class="form-group flex-1">
              <label for="end_time">終了時間 *</label>
              <input type="time" id="end_time" class="form-control" value="17:00" required>
            </div>
          </div>

          <div class="form-group">
            <label for="location">練習場所 *</label>
            <input type="text" id="location" class="form-control" list="location-list" placeholder="会場名を選択または入力" required>
            <datalist id="location-list">
              <option value="森のホール21 リハ室">
              <option value="流山エルズ（生涯学習センター）">
              <option value="きらりホール">
              <option value="けやきプラザ">
            </datalist>
          </div>

          <div id="mapContainer"></div>

          <div class="form-group">
            <label for="instructor">指導</label>
            <input type="text" id="instructor" class="form-control" placeholder="例: マエストロ〇〇">
          </div>

          <div class="form-group">
            <label for="program_notes">内容・曲目</label>
            <textarea id="program_notes" class="form-control" rows="3" placeholder="例: 前半：ベートーヴェン"></textarea>
          </div>

          <div id="modalActions" class="modal-actions"></div>
        </form>
      </div>
    </div>
  `;

  // モーダルHTMLが用意された後にカレンダーを起動
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