// js/components/announcement-modal.js

import { openModal } from './modal.js';
import { saveAnnouncement, updateAnnouncement, markAsRead } from '../services/announcement-service.js';
import { confirmAndRun } from '../utils/action-utils.js';

export function openAnnouncementModal({
  mode,          // 'CREATE' | 'VIEW' | 'EDIT'
  id,            // VIEW時に既読登録するための掲示ID
  title = '',
  body = '',
  authorId,
  currentUserId, // ログイン中のユーザーID
  createdAt = '',
  onSaved,       // CREATE 完了後
  onUpdated,     // EDIT 完了後
  onClosed       // VIEW 閉じ時のコールバック（未読件数再読込用）
}) {

  const isView = mode === 'VIEW';
  const isEdit = mode === 'EDIT';

  const titles = {
    CREATE: '新規投稿',
    EDIT: '投稿を編集',
    VIEW: title
  };

  // VIEW モード：開いた瞬間に自動既読処理
  if (isView && id && currentUserId) {
    markAsRead(id, currentUserId).catch(err => console.error('自動既読処理エラー:', err));
  }

  // アクションボタンの組み立て
  let actions = [];

  if (isView) {
    actions = [
      {
        label: '閉じる',
        type: 'primary',
        onClick: () => onClosed?.()
      }
    ];
  } else {
    actions = [
      {
        label: isEdit ? '保存する' : '投稿する',
        type: 'primary',
        onClick: async () => {
          const newTitle = document.getElementById('ann-title').value.trim();
          const newBody  = document.getElementById('ann-body').value.trim();

          const action = isEdit
            ? () => updateAnnouncement({ id, title: newTitle, body: newBody, authorId })
            : () => saveAnnouncement({ title: newTitle, body: newBody, authorId });

          const msg = isEdit ? '保存しますか？' : '投稿しますか？';
          const successMsg = isEdit ? '保存しました' : '投稿しました';

          await confirmAndRun(msg, action, successMsg);
          (isEdit ? onUpdated : onSaved)?.();
        }
      },
      { label: 'キャンセル', type: 'secondary' }
    ];
  }

  // モーダル生成
  openModal({
    title: titles[mode],
    content: isView ? renderViewContent(body, createdAt) : renderFormContent(title, body),
    actions
  });
}

/* ------------------------------
 * HTMLレンダリング用ヘルパー
 * ------------------------------ */
function renderViewContent(body, createdAt) {
  return `
    <div class="announcement-body">${body}</div>
    <div class="announcement-meta">投稿日時：${createdAt}</div>
  `;
}

function renderFormContent(title, body) {
  return `
    <div class="announcement-form">
      <label for="ann-title">タイトル</label>
      <input id="ann-title" type="text" class="input-text" value="${title}">

      <label for="ann-body">本文</label>
      <textarea id="ann-body" class="input-textarea">${body}</textarea>
    </div>
  `;
}