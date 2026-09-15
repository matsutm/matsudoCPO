//announcement-card.js

import { openAnnouncementModal } from './announcement-modal.js';
import { escapeHtml, formatDateShort } from '../utils.js';

/**
 * お知らせ行（1件1行）のHTML生成
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
 * ★共通化：行クリック時のViewモーダル起動イベントをバインド
 * @param {HTMLElement} container - 対象リストの親要素
 * @param {string} currentUserId - ログインユーザーID
 * @param {Function} onClosedCallback - モーダル閉鎖後の再描画用関数
 */
export function attachAnnouncementClickEvents(container, currentUserId, onClosedCallback) {
  if (!container) return;

  const rows = container.querySelectorAll('.unread-row, .announcement-row');

  rows.forEach(row => {
    // .row-main があればそれを優先、無ければ行全体をクリック対象に
    const clickTarget = row.querySelector('.row-main') || row;

    clickTarget.addEventListener('click', (e) => {
      // クイック既読ボタンクリック時はモーダルを開かない
      if (e.target.closest('.btn-quick-read')) return;

      const postId = Number(row.dataset.id);
      openAnnouncementModal('VIEW', postId, currentUserId, onClosedCallback);
    });
  });
}