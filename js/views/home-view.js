// js/views/home-view.js

// 1. ホーム画面のHTMLを出力（exportを明記）
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

// 2. 初期化ロジック（exportを明記）
export async function initHomeView(navigateTo) {
  await loadNextTwoSchedules();

  // イベントリスナーのセット
  document.getElementById('btnGoCalendar')?.addEventListener('click', () => navigateTo('calendar'));
  document.getElementById('menuCalendar')?.addEventListener('click', () => navigateTo('calendar'));
  document.getElementById('menuBulletin')?.addEventListener('click', () => navigateTo('announcement'));
  document.getElementById('menuMembers')?.addEventListener('click', () => navigateTo('members'));
}

// Supabaseから未読お知らせを取得（最大4件）
async function loadUnreadAnnouncements(currentUser, navigateTo) {
  const alertCard = document.getElementById('unreadAlertCard');
  const countEl = document.getElementById('unreadCount');
  const listContainer = document.getElementById('unreadAnnouncementsContainer');

  if (!alertCard || !countEl || !listContainer) return;

  try {
    // 1. 最新の投稿を取得（直近20件分）
    const { data: posts, error: postsError } = await window.supabaseClient
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (postsError) throw postsError;
    if (!posts || posts.length === 0) return;

    // 2. ユーザーの既読履歴を取得
    const { data: readData, error: readError } = await window.supabaseClient
      .from('announcement_reads')
      .select('announcement_id')
      .eq('member_id', currentUser.id);

    if (readError) throw readError;

    const readPostIds = new Set((readData || []).map(r => r.announcement_id));

    // 3. 未読投稿のみフィルタリング
    const unreadPosts = posts.filter(p => !readPostIds.has(p.id));

    // 未読がなければ表示なしで終了
    if (unreadPosts.length === 0) {
      alertCard.style.display = 'none';
      return;
    }

    // 未読がある場合はカードを表示
    countEl.textContent = unreadPosts.length;
    alertCard.style.display = 'block';

    // 最大4件に絞り込んで描画
    const displayPosts = unreadPosts.slice(0, 4);

    listContainer.innerHTML = displayPosts.map(post => {
      const dateStr = new Date(post.created_at).toLocaleDateString('ja-JP');

      return `
        <div class="unread-item" style="padding: 0.5rem 0; border-top: 1px dashed #fcd34d; display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 0.9rem; font-weight: bold;">
            <span style="color: #d97706; margin-right: 0.4rem;">[NEW]</span> ${escapeHtml(post.title)}
          </div>
          <span style="font-size: 0.8rem; color: #78350f;">${dateStr}</span>
        </div>
      `;
    }).join('') + `
      <div style="text-align: right; margin-top: 0.5rem;">
        <button id="btnGoAnnouncement" style="background: none; border: none; color: #b45309; font-size: 0.85rem; font-weight: bold; cursor: pointer;">掲示板を開く ➔</button>
      </div>
    `;

    document.getElementById('btnGoAnnouncement')?.addEventListener('click', () => navigateTo('announcement'));

  } catch (err) {
    console.error('未読掲示取得エラー:', err);
  }
}

// Supabaseから直近2件を取得
async function loadNextTwoSchedules() {
  const container = document.getElementById('nextEventsContainer');
  if (!container) return;
  const today = new Date().toISOString().split('T')[0];

  try {
    const { data: schedules, error } = await window.supabaseClient
      .from('schedules')
      .select('*')
      .gte('date', today)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(2);

    if (error) throw error;
    if (!schedules || schedules.length === 0) {
      container.innerHTML = '<p class="empty-text">今後の予定はありません。</p>';
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