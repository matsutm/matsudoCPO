// js/components/announcement-modal.js

import { openModal } from './modal.js';
import { saveAnnouncement, updateAnnouncement, markAsRead } from '../services/announcement-service.js';

export function openAnnouncementModal({
  mode,          // 'CREATE' | 'VIEW' | 'EDIT'
  id,            // ★VIEW時に既読登録するための掲示ID
  title,
  body,
  authorId,
  currentUserId, // ★ログイン中のユーザーID
  createdAt,
  onSaved,       // CREATE 完了後
  onUpdated,     // EDIT 完了後
  onClosed       // ★VIEW 閉じ時のコールバック（未読件数再読込用）
}) {

  // ------------------------------
  // CREATE モード（新規投稿）
  // ------------------------------
  if (mode === 'CREATE') {
    const formHTML = `
      <div class="announcement-form">
        <label>タイトル</label>
        <input id="ann-title" type="text" class="input-text">

        <label>本文</label>
        <textarea id="ann-body" class="input-textarea"></textarea>
      </div>
    `;

    openModal({
      title: '新規投稿',
      content: formHTML,
      actions: [
        {
          label: '投稿する',
          type: 'primary',
          onClick: async () => {
            const newTitle = document.getElementById('ann-title').value.trim();
            const newBody  = document.getElementById('ann-body').value.trim();

            await saveAnnouncement({
              title: newTitle,
              body: newBody,
              authorId
            });

            onSaved?.(); // 一覧再描画
          }
        },
        { label: '閉じる', type: 'secondary' }
      ]
    });

    return;
  }

  // ------------------------------
  // VIEW モード（閲覧・自動既読化）
  // ------------------------------
  if (mode === 'VIEW') {
    // ★開いた瞬間にバックグラウンドで既読登録を発火
    if (id && currentUserId) {
      markAsRead(id, currentUserId).catch(err => {
        console.error('自動既読処理エラー:', err);
      });
    }

    openModal({
      title,
      content: `
        <div class="announcement-body">${body}</div>
        <div class="announcement-meta">
          投稿日時：${createdAt}
        </div>
      `,
      actions: [
        { 
          label: '閉じる', 
          type: 'primary',
          onClick: () => {
            onClosed?.(); // モーダル閉鎖時に裏の未読カウントを更新
          }
        }
      ]
    });

    return;
  }

  // ------------------------------
  // EDIT モード（編集）
  // ------------------------------
  if (mode === 'EDIT') {
    const formHTML = `
      <div class="announcement-form">
        <label>タイトル</label>
        <input id="ann-title" type="text" class="input-text" value="${title}">

        <label>本文</label>
        <textarea id="ann-body" class="input-textarea">${body}</textarea>
      </div>
    `;

    openModal({
      title: '投稿を編集',
      content: formHTML,
      actions: [
        {
          label: '保存する',
          type: 'primary',
          onClick: async () => {
            const newTitle = document.getElementById('ann-title').value.trim();
            const newBody  = document.getElementById('ann-body').value.trim();

            await updateAnnouncement({
              title: newTitle,
              body: newBody,
              authorId
            });

            onUpdated?.(); // 一覧再描画
          }
        },
        { label: '閉じる', type: 'secondary' }
      ]
    });

    return;
  }
}