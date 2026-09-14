//announcement-card.js

import { escapeHtml, formatDateShort } from '../utils.js';

/**
 * お知らせ1件分のリスト行HTMLを生成
 * @param {Object} post - 掲示データ
 * @param {boolean} isRead - 既読状態
 * @param {boolean} showQuickBtn - クイック既読ボタンを表示するかどうか
 */
export function createAnnouncementRowHTML(post, isRead, showQuickBtn = true) {
  const authorName = post.members?.name || '不明';
  const dateStr = formatDateShort(post.created_at);

  return `
    <div class="announcement-row ${isRead ? 'read' : 'unread'}" data-id="${post.id}">
      <div class="row-main>
        <div class="row-title-line">
          ${!isRead ? '<span class="badge-unread">NEW</span>' : ''}
          <strong class="row-title">${escapeHtml(post.title)}</strong>
        </div>
        <div class="row-meta">
          <span>👤 ${escapeHtml(authorName)}</span> | <time>📅 ${dateStr}</time>
        </div>
      </div>
      
      ${showQuickBtn ? `
        <div class="row-action">
          ${!isRead ? `
            <button class="btn-quick-read" data-id="${post.id}">既読にする</button>
          ` : '<span class="text-read-done">既読</span>'}
        </div>
      ` : ''}
    </div>
  `;
}

