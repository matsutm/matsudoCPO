// js/components/announcement-modal.js

import { openModal } from './modal.js';
import { saveAnnouncement, updateAnnouncement, deleteAnnouncement, markAsRead } from '../services/announcement-service.js';
import { confirmAndRun } from '../utils/action-utils.js';

export function openAnnouncementModal({
  mode,          // 'CREATE' | 'VIEW' | 'EDIT'
  post = null,   //お知らせデータオブジェクト（VIEW/EDIT時に渡す）
  authorId;      // CREATEに必要
  currentUserId,
  onSaved,       // CREATE 完了後
  onUpdated,     // EDIT 完了後
  onDeleted,     // DELETE 完了後
  onClosed       // VIEW 閉じ時のコールバック
}) {

  // post から安全に必要な値を取り出す（content ➔ body の変換もここで吸収）
  const id        = post?.id;
  const title     = post?.title || '';
  const body      = post?.content || post?.body || ''; // ★ ここで吸い上げる！
  const createdAt = post?.created_at || '';
  const postAuthorId = post?.author_id || authorId;

  const isView = mode === 'VIEW';
  const isEdit = mode === 'EDIT';

  const titles = {
    CREATE: '新規投稿',
    EDIT: '投稿を編集',
    VIEW: 'お知らせの詳細'
  };

  // VIEW モード：自動既読処理
  if (isView && id && currentUserId) {
    markAsRead(id, currentUserId).catch(err => console.error('自動既読処理エラー:', err));
  }

  // アクションボタンの組み立て（calendar-modal と共通仕様）
  let actions = [];

  if (isView) {
    actions = [
      {
        label: '編集',
        type: 'primary',
        onClick: () => openAnnouncementModal({
          mode: 'EDIT', id, title, body, authorId, currentUserId, createdAt, onUpdated, onDeleted, onClosed
        })
      },
      {
        label: '削除',
        type: 'danger',
        onClick: async () => {
          await confirmAndRun('この投稿を削除しますか？', () => deleteAnnouncement(id), '削除しました');
          onDeleted?.();
        }
      },
      {
        label: '閉じる',
        type: 'secondary',
        onClick: () => onClosed?.()
      }
    ];
  } else {
    actions = [
      {
        label: isEdit ? '保存' : '投稿',
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

  // モーダル表示
  openModal({
    title: titles[mode] || title,
    content: isView ? renderViewContent(title, body, createdAt) : renderFormContent(title, body),
    actions
  });
}

/* ------------------------------
 * HTMLレンダリング（common.css のクラス名に統一）
 * ------------------------------ */
function renderViewContent(title, body, createdAt) {
  return `
    <div class="form-group">
      <h3 style="margin: 0 0 0.75rem 0; font-size: 1.1rem; color: #1e3a8a;">${title}</h3>
    </div>
    <div class="form-group">
      <div class="announcement-body">${body}</div>
    </div>
    <div class="form-group">
      <div class="announcement-meta">投稿日時：${createdAt}</div>
    </div>
  `;
}

function renderFormContent(title, body) {
  return `
    <div class="form-group">
      <label for="ann-title">タイトル *</label>
      <input id="ann-title" type="text" class="form-control" value="${title}">
    </div>

    <div class="form-group">
      <label for="ann-body">本文 *</label>
      <textarea id="ann-body" class="form-control" rows="6">${body}</textarea>
    </div>
  `;
}