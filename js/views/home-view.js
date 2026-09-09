// js/views/home-view.js

// 1. ホーム画面のHTMLを文字列で出力する関数
export function renderHomeView() {
  return `
    <section id="view-home" class="view-section">
      <!-- 未確認メッセージカード -->
      <div class="card card-alert" id="unreadAlertCard" style="display: none;">
        <div class="card-header">
          <span>🔔</span> <strong>未確認の連絡が <span id="unreadCount">0</span> 件あります</strong>
        </div>
      </div>

      <!-- 直近2回の予定 -->
      <div class="card card-schedule">
        <div class="card-header-title">
          <span>🗓 直近の練習スケジュール</span>
          <button class="btn-text" id="btnGoCalendar">カレンダー全体 ➔</button>
        </div>
        <div id="nextEventsContainer" class="events-list">
          <p class="loading-text">予定を読み込み中...</p>
        </div>
      </div>

      <!-- クイックメニュー -->
      <div class="quick-menu-grid">
        <button class="menu-card" id="menuCalendar">
          <span class="menu-icon">📅</span> <span class="menu-label">今後の予定</span>
        </button>
        <button class="menu-card" id="menuBulletin">
          <span class="menu-icon">💬</span> <span class="menu-label">団内掲示板</span>
        </button>
        <button class="menu-card" id="menuLibrary">
          <span class="menu-icon">🎼</span> <span class="menu-label">資料庫</span>
        </button>
        <button class="menu-card" id="menuMembers">
          <span class="menu-icon">👥</span> <span class="menu-label">団員名簿</span>
        </button>
      </div>
    </section>
  `;
}

// 2. ホーム画面が挿入された後に実行する動的処理
export async function initHomeView(navigateTo) {
  await loadNextTwoSchedules();

  // イベントリスナーのセット
  document.getElementById('btnGoCalendar').addEventListener('click', () => navigateTo('calendar'));
  document.getElementById('menuCalendar').addEventListener('click', () => navigateTo('calendar'));
  document.getElementById('menuBulletin').addEventListener('click', () => navigateTo('bulletin'));
  document.getElementById('menuMembers').addEventListener('click', () => navigateTo('members'));
}

// Supabaseから直近2件を取得
async function loadNextTwoSchedules() {
  const container = document.getElementById('nextEventsContainer');
  const today = new Date().toISOString().split('T')[0];

  try {
    const { data: schedules, error } = await supabaseClient
      .from('schedules')
      .select('*')
      .gte('date', today)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(2);

    if (error) throw error;
    if (!schedules || schedules.length === 0) {
      container.innerHTML = '<p class="empty-text">今後の予定はまだありません。</p>';
      return;
    }

    container.innerHTML = schedules.map((item, index) => {
      const labelText = index === 0 ? '次回の予定' : '次々回の予定';
      const timeRange = item.start_time ? `${item.start_time.slice(0, 5)}〜${item.end_time ? item.end_time.slice(0, 5) : ''}` : '時間未定';
      const mapLink = item.location 
        ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}" target="_blank" class="btn-map-inline">🗺 Googleマップを開く</a>`
        : '';

      return `
        <div class="event-item">
          <span class="event-badge">${labelText}</span>
          <div class="event-date">📅 ${item.date} (${timeRange})</div>
          <div class="event-detail">📍 【場所】${item.location || '未定'}</div>
          ${item.instructor ? `<div class="event-detail">👤 【指導】${item.instructor}</div>` : ''}
          ${mapLink}
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="error-text">予定の読み込みに失敗しました。</p>';
  }
}