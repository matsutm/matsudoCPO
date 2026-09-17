// js/components/announcement-card.js

import { escapeHtml, formatDateShort } from '../utils.js';
import { fetchAnnouncementById } from '../services/announcement-service.js';

/**
 * お知らせ行（1件1行）のHTML生成
 * → UI の型だけを担当（モーダルは呼ばない）
 */
export function createAnnouncementRowHTML(post, isRead, showQuickReadBtn = true) {
  const readClass = isRead ? 'read' : 'unread';
  const badgeHTML = isRead ? '' : '<span class="badge-unread">未読</span>';
  
  const actionHTML = showQuickReadBtn && !isRead
    ? `<button class="btn-quick-read" data-id="${post.id}">既読にする</button>`
    : (isRead ? `<span class="text-read-done">既読</span>` : '');

  return `
    <div class="announcement-row ${readClass}" data-id="${post.id}">
      <div class="row-main">
        <div class="row-title-line">
          ${badgeHTML}
          <span class="row-title">${escapeHtml(post.title)}</span>
        </div>
        <div class="row-meta">
          ${post.members?.name || '不明'} • ${formatDateShort(post.created_at)}
        </div>
      </div>
      <div class="row-action">
        ${actionHTML}
      </div>
    </div>
  `;
}

/**
 * 行クリック時のイベントをバインド
 * → モーダルを呼ぶのは「view 側」
 * → ここでは post を渡すだけ
 */
export function attachAnnouncementClickEvents(container, currentUserId, onClickPost) {
  if (!container) return;

  // .unread-row（ホーム用）と .announcement-row（一覧用）の両方を検索対象にする
  const rows = container.querySelectorAll('.announcement-row, .unread-row');

  rows.forEach(row => {
    const clickTarget = row.querySelector('.row-main') || row;

    // ★ async を追加 ＆ 重複登録防止のため onclick に統一
    clickTarget.onclick = async (e) => {
      // クイック既読ボタンクリック時はモーダルを開かない
      if (e.target.closest('.btn-quick-read')) return;

      const postId = Number(row.dataset.id);

      // キャッシュから取得
      const post = window.__ANNOUNCEMENT_CACHE__?.get(postId);

      // キャッシュがない場合（ホーム画面等）はSupabaseから直接1件取得する
      if (!post) {
        try {
          post = await fetchAnnouncementById(postId);
        } catch (err) {
          console.error('お知らせ詳細の取得に失敗:', err);
          return;
        }
      }

      // モーダルを開くのは view 側
      if (post) {
        onClickPost(post);
      }
    };
  });
}
