//announcement-modal.js

import { fetchAnnouncementById, markAsRead, createAnnouncement } from '../services/announcement-service.js';
import { renderEmailOptionUI, initEmailOptionEvents, getEmailOptionData } from './announcement-email-option.js';
import { formatDateTime } from '../utils.js';
import { EMAIL_NOTIFY_ENABLED } from '../config.js';

/**
 * 掲示板モーダルの起動（CREATE / VIEW）
 */
export async function openAnnouncementModal(mode = 'CREATE', postId = null, currentUserId, onClosedCallback = null) {
  document.getElementById('announcement-modal-root')?.remove();
  const isView = mode === 'VIEW';

  const modalHTML = `
    <div id="announcement-modal-root" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>${isView ? '📢 お知らせ詳細' : '✏️ 新規お知らせ投稿'}</h3>
          <button id="btnCloseModal" class="modal-close-btn">&times;</button>
        </div>
        <form id="announcementModalForm">
          <div class="modal-body">
            <div class="form-group">
              <label for="modal-title">タイトル *</label>
              <input type="text" id="modal-title" class="form-control" placeholder="タイトルを入力" ${isView ? 'readonly' : ''} required />
            </div>

            ${isView ? `
              <div class="form-group">
                <label>投稿情報</label>
                <div id="modal-meta" class="detail-meta-text">読み込み中...</div>
              </div>
            ` : ''}

            <div class="form-group">
              <label for="modal-content">本文 *</label>
              <textarea id="modal-content" class="form-control" rows="7" placeholder="本文を入力" ${isView ? 'readonly' : ''} required></textarea>
            </div>

            <!-- ★新規作成時のみメール送信切り出しパーツを挿入 -->
            ${!isView ? renderEmailOptionUI() : ''}
          </div>

          <div class="modal-footer" style="text-align: right; margin-top: 1rem;">
            ${isView ? `
              <button type="button" id="btnModalClose" class="btn-secondary">閉じる</button>
            ` : `
              <button type="button" id="btnModalCancel" class="btn-secondary">キャンセル</button>
              <button type="submit" id="btnModalSubmit" class="btn-primary">投稿する</button>
            `}
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modalRoot = document.getElementById('announcement-modal-root');
  const form = document.getElementById('announcementModalForm');
  const closeModal = () => {
    modalRoot.remove();
    if (typeof onClosedCallback === 'function') onClosedCallback();
  };

  // イベント接続
  document.getElementById('btnCloseModal')?.addEventListener('click', closeModal);
  document.getElementById('btnModalClose')?.addEventListener('click', closeModal);
  document.getElementById('btnModalCancel')?.addEventListener('click', closeModal);
  modalRoot.addEventListener('click', (e) => { if (e.target === modalRoot) closeModal(); });

  if (isView && postId) {
    // 【閲覧モード】データロード & 自動既読
    try {
      const post = await fetchAnnouncementById(postId);
      if (post) {
        document.getElementById('modal-title').value = post.title;
        document.getElementById('modal-content').value = post.content;
        document.getElementById('modal-meta').textContent = 
          `投稿者: ${post.members?.name || '不明'} | 投稿日時: ${formatDateTime(post.created_at)}`;
        await markAsRead(post.id, currentUserId);
      }
    } catch (err) {
      console.error('詳細取得エラー:', err);
    }
  } else if (mode === 'CREATE') {
    // 【新規作成モード】メールUIイベント初期化 & フォーム送信
    initEmailOptionEvents();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('modal-title').value.trim();
      const content = document.getElementById('modal-content').value.trim();
      const emailOptions = getEmailOptionData();

      try {
        await createAnnouncement({
          author_id: currentUserId,
          title,
          content,
          is_email_sent: emailOptions.isEmailSent,
          target_scope: emailOptions.targetScope,
          target_value: emailOptions.targetValue
        });

        if (EMAIL_NOTIFY_ENABLED && emailOptions.isEmailSent) {
          await sendBulletinEmail({ title, content, targetScope: emailOptions.targetScope, targetValue: emailOptions.targetValue });
        }

        alert('投稿しました。');
        closeModal();
      } catch (err) {
        alert('投稿に失敗しました: ' + err.message);
      }
    });
  }
}