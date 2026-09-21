// js/views/home-view.js

import { fetchAnnouncements, fetchUserReadIds } from '../services/announcement-service.js';
import { getCurrentUser } from '../services/auth-service.js';
import { openAnnouncementModal } from '../components/announcement-modal.js';
import { attachAnnouncementClickEvents } from '../components/announcement-card.js';
import { formatDateShort, escapeHtml } from '../utils.js';
import { createTooltipText, attachTooltip } from '../components/tooltip.js';
import { renderPrimaryLibraryLinks } from '../components/library-links.js';
import { renderSocialLinks } from '../components/social-links.js';
import { openCalendarModal } from '../components/calendar-modal.js';


// 1. ホーム画面のHTMLを出力
export function renderHomeView() {
  return `
    <section id="view-home" class="view-section">
      <div class="home-grid">
        
        <!-- 1. お知らせ・掲示板カード -->
        <div class="card home-card">
          <div class="card-header-title">
            <button class="btn-card-title" id="linkGoAnnouncement">📢 お知らせ・掲示板 ➔</button>
          </div>
          <div id="unreadAnnouncementsContainer" class="card-body">
            <p class="loading-text">お知らせを読み込み中...</p>
          </div>
        </div>

        <!-- 2. 直近の練習スケジュールカード -->
        <div class="card home-card">
          <div class="card-header-title">
            <button class="btn-card-title" id="linkGoCalendar">📅 練習スケジュール ➔</button>
          </div>
          <div id="nextEventsContainer" class="card-body events-list">
            <p class="loading-text">予定を読み込み中...</p>
          </div>
        </div>

        <!-- 3. 資料庫カード -->
        <div class="card home-card">
          <div class="card-header-title">
            <button class="btn-card-title" id="linkGoLibrary">📁 資料庫 ➔</button>
          </div>
          <div class="card-body">
            <ul class="library-quick-links">
              <!-- 主要3リンク（動的生成パーツ） -->
              ${renderPrimaryLibraryLinks()}
              <li>
                <button id="btnGoLibraryOther" class="library-link-button">
                  <span>📁 その他資料一覧</span> ➔
                </button>
              </li>
            </ul>

            <!-- SNS・チケットロゴ（配列データから均等配置） -->
            ${renderSocialLinks()}
          </div>
        </div>

      </div>
    </section>
  `;
}

// 2. 初期化ロジック
export async function initHomeView(navigateTo) {
  const currentUser = getCurrentUser();

  // スケジュールとお知らせ未読の両方を読み込む
  // 1. スケジュール取得とボタンイベント登録を優先して画面をすぐ動かせるようにする
  await loadNextTwoSchedules();

  // 2. お知らせ取得は await せずにバックグラウンドで走らせ、読み込みエラーを回避
  loadUnreadAnnouncements(currentUser, navigateTo);

  // タイトルおよびボタンの遷移イベントを設定
  document.getElementById('linkGoAnnouncement')?.addEventListener('click', () => navigateTo('announcement'));
  document.getElementById('linkGoCalendar')?.addEventListener('click', () => navigateTo('calendar'));
  document.getElementById('linkGoLibrary')?.addEventListener('click', () => navigateTo('library'));
  document.getElementById('btnGoLibraryOther')?.addEventListener('click', () => navigateTo('library'));

  // ★主要資料のリンク先URL（必要に応じてGoogle Drive等の固定URLを割り当て）
  // 例: document.getElementById('linkDolce').href = 'https://drive.google.com/...';
}

// Supabaseから未読お知らせを取得（最大4件）
async function loadUnreadAnnouncements(currentUser, navigateTo) {
  const listContainer = document.getElementById('unreadAnnouncementsContainer');
  if (!listContainer) return;

  try {
    const [posts, readIds] = await Promise.all([
      fetchAnnouncements(),
      fetchUserReadIds(currentUser.id)
    ]);

    // 未読のみ抽出
    const unreadPosts = posts.filter(p => !readIds.has(p.id));

    // 未読が0件の場合
    if (unreadPosts.length === 0) {
      listContainer.innerHTML = `
        <div class="all-read-msg" style="padding: 0.5rem 0; font-size: 0.85rem; color: #4b5563;">
          ✨ 未確認のお知らせはありません
        </div>
      `;
      return;
    }

    // 最大4件表示
    const displayPosts = unreadPosts.slice(0, 4);

    listContainer.innerHTML = displayPosts.map(post => `
      <div class="unread-row" data-id="${post.id}" style="cursor: pointer; padding: 8px 0; border-bottom: 1px solid #fef3c7;">
        <div class="unread-row-title">
          <span class="badge-new-text" style="color: #d97706; font-weight: bold;">[NEW]</span> ${escapeHtml(post.title)}
        </div>
        <span class="unread-row-date" style="font-size: 0.8em; color: #78350f;">${formatDateShort(post.created_at)}</span>
      </div>
    `).join('');

    // ★共通関数を呼び出すだけ！
    attachAnnouncementClickEvents(listContainer, currentUser.id, (post) => {
      openAnnouncementModal({
        mode: 'VIEW',
        post,
        currentUserId: currentUser.id,
        onClosed: () => loadUnreadAnnouncements(currentUser, navigateTo)
      });
    });

  } catch (err) {
    console.error('ホーム未読取得エラー:', err);
    listContainer.innerHTML = '<p class="error-text">お知らせの読み込みに失敗しました。</p>';
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
        ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}" target="_blank" class="btn-map-inline">🗺 Googleマップ</a>`
        : '';

      return `
        <div class="event-item" data-index="${index}" style="margin-bottom: 12px; cursor: pointer;">
          <span class="event-badge">${labelText}</span>
          <div class="event-date">📅 ${item.date} (${timeRange})</div>
          <div class="event-detail">📍 【場所】${item.location || '未定'}</div>
          ${item.instructor ? `<div class="event-detail">👤 【指導】${item.instructor}</div>` : ''}
          ${mapLink}
        </div>
      `;
    }).join('');

    // ★ カレンダーと同じホバー処理（attachTooltip）をセット
    const eventEls = container.querySelectorAll('.event-item');
    eventEls.forEach((el, index) => {
      const item = schedules[index];
      
      // カレンダーの eventDidMount が受け取るオブジェクト構造に合わせて渡す
      attachTooltip({
        el: el,
        event: {
          extendedProps: {
            tooltipText: createTooltipText(item)
          }
        }
      });

      // クリックでカレンダーモーダルを開く
      el.addEventListener('click', () => {
        // Googleマップリンクをクリックした場合はモーダルを開かない
        if (e.target.closest('.btn-map-inline')) return;

        openCalendarModal({
          mode: 'VIEW',
          scheduleId: item.id, // IDのみを渡す
          onSaved: () => loadNextTwoSchedules() // 保存後に再読み込み
        });
      });      
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="error-text">予定の読み込みに失敗しました。</p>';
  }
}