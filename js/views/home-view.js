// js/views/home-view.js

// js/views/home-view.js

import { getCurrentUser, fetchAnnouncements, fetchUserReadIds } from '../services/announcement-service.js';
import { openAnnouncementModal } from '../components/announcement-modal.js';
import { formatDateShort, escapeHtml } from '../utils.js';

// 1. ホーム画面のHTMLを出力
export function renderHomeView() {
  return `
    <section id="view-home" class="view-section">
      <!-- 未確認メッセージカード -->
      <div class="card card-alert" id="unreadAlertCard" style="display: none;">
        <div class="card-header">
          <span>🔔</span> <strong>未確認の連絡が <span id="unreadCount">0</span> 件あります</strong>
        </div>
        <!-- ★ 不足していたコンテナ要素を追加 -->
        <div id="unreadAnnouncementsContainer" class="unread-list"></div>
      </div>

      <!-- 直近2回の予定 -->
      <div class="card card-schedule">
        <div class="card-header-title">
          <span>🗓 直近の練習スケジュール</span>
          <button class="btn-text" id="btnGoCalendar">月毎表示 ➔</button>
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

// 2. 初期化ロジック
export async function initHomeView(navigateTo) {
  const currentUser = getCurrentUser(); // import した関数を使用

  // スケジュールとお知らせ未読の両方を読み込む
  await Promise.all([
    loadUnreadAnnouncements(currentUser, navigateTo),
    loadNextTwoSchedules()
  ]);

  // イベントリスナーのセット
  document.getElementById('btnGoCalendar')?.addEventListener('click', () => navigateTo('calendar'));
  document.getElementById('menuCalendar')?.addEventListener('click', () => navigateTo('calendar'));
  document.getElementById('menuBulletin')?.addEventListener('click', () => navigateTo('announcement'));
  document.getElementById('menuMembers')?.addEventListener('click', () => navigateTo('members'));
  document.getElementById('menuLibrary')?.addEventListener('click', () => navigateTo('library'));
}

// Supabaseから未読お知らせを取得（最大4件）
async function loadUnreadAnnouncements(currentUser, navigateTo) {
  const alertCard = document.getElementById('unreadAlertCard');
  const countEl = document.getElementById('unreadCount');
  const listContainer = document.getElementById('unreadAnnouncementsContainer');

  if (!alertCard || !countEl || !listContainer) return;

  try {
    const [posts, readIds] = await Promise.all([
      fetchAnnouncements(),
      fetchUserReadIds(currentUser.id)
    ]);

    // 未読のみ抽出
    const unreadPosts = posts.filter(p => !readIds.has(p.id));

    if (unreadPosts.length === 0) {
      alertCard.style.display = 'none';
      return;
    }

    countEl.textContent = unreadPosts.length;
    alertCard.style.display = 'block';

    // 最大4件・1件1行で描画
    const displayPosts = unreadPosts.slice(0, 4);

    listContainer.innerHTML = displayPosts.map(post => `
      <div class="unread-row" data-id="${post.id}" style="cursor: pointer; padding: 8px 0; border-bottom: 1px solid #fef3c7;">
        <div class="unread-row-title">
          <span class="badge-new-text" style="color: #d97706; font-weight: bold;">[NEW]</span> ${escapeHtml(post.title)}
        </div>
        <span class="unread-row-date" style="font-size: 0.8em; color: #78350f;">${formatDateShort(post.created_at)}</span>
      </div>
    `).join('') + `
      <div class="unread-card-footer" style="margin-top: 8px; text-align: right;">
        <button id="btnGoAnnouncementBottom" class="btn-text" style="color: #b45309;">掲示全体 ➔</button>
      </div>
    `;

    // 1行クリックでモーダル起動
    listContainer.querySelectorAll('.unread-row').forEach(row => {
      row.addEventListener('click', () => {
        const postId = Number(row.dataset.id);
        openAnnouncementModal(postId, currentUser.id, () => {
          loadUnreadAnnouncements(currentUser, navigateTo);
        });
      });
    });

    document.getElementById('btnGoAnnouncementBottom')?.addEventListener('click', () => navigateTo('announcement'));

  } catch (err) {
    console.error('ホーム未読取得エラー:', err);
    alertCard.style.display = 'none';
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