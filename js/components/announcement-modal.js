//announcment-modal.js

import { fetchAnnouncementById, markAsRead } from '../services/announcement-service.js';
import { escapeHtml, formatDateTime } from '../utils.js';

/**
 * 掲示詳細モーダルを表示し、開いた瞬間に自動既読処理を実行する
 * @param {number} postId - 対象のお知らせID
 * @param {string} currentUserId - ログイン中のユーザーID
 * @param {Function} onClosedCallback - モーダル閉鎖後の画面更新用関数
 */
export async function openAnnouncementModal(postId, currentUserId, onClosedCallback = null) {
  // 既存モーダルのクリーンアップ
  document.getElementById('announcement-modal-root')?.remove();

  // モーダル枠の生成（投稿画面UIの流用・全枠readonly）
  const modalHTML = `
    <div id="announcement-modal-root" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>📢 お知らせ詳細</h3>
          <button id="btnCloseModal" class="modal-close-btn">&times;</button>
        </div>
        <div class="modal-body readonly-form">
          <div class="form-group">
            <label>タイトル</label>
            <input type="text" id="modal-title" value="読み込み中..." readonly />
          </div>
          <div class="form-group">
            <label>投稿情報</label>
            <div id="modal-meta" class="detail-meta-text">読み込み中...</div>
          </div>
          <div class="form-group">
            <label>本文</label>
            <textarea id="modal-content" rows="8" readonly>読み込み中...</textarea>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modalRoot = document.getElementById('announcement-modal-root');
  const closeBtn = document.getElementById('btnCloseModal');

  const closeModal = () => {
    modalRoot.remove();
    if (typeof onClosedCallback === 'function') {
      onClosedCallback();
    }
  };

  closeBtn.addEventListener('click', closeModal);
  modalRoot.addEventListener('click', (e) => {
    if (e.target === modalRoot) closeModal();
  });

  // データ読み込み & 自動既読処理
  try {
    const post = await fetchAnnouncementById(postId);
    if (post) {
      document.getElementById('modal-title').value = post.title;
      document.getElementById('modal-content').value = post.content;
      document.getElementById('modal-meta').textContent = 
        `投稿者: ${post.members?.name || '不明'} | 投稿日時: ${formatDateTime(post.created_at)}`;

      // ★閲覧した瞬間に自動で既読DB更新
      await markAsRead(post.id, currentUserId);
    }
  } catch (err) {
    console.error('モーダル表示エラー:', err);
    document.getElementById('modal-title').value = 'エラー';
    document.getElementById('modal-content').value = 'データの読み込みに失敗しました。';
  }
}