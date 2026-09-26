// js/components/announcement-modal.js

import { openModal } from './modal.js';
import { createAnnouncement, updateAnnouncement, deleteAnnouncement, markAsRead } from '../services/announcement-service.js';
import { renderEmailOptionUI, initEmailOptionEvents, getEmailOptionData } from './announcement-email-option.js';
import { renderAttachmentField, initAttachmentFieldEvents, collectAttachmentData, renderAttachmentLink } from './attachment-field.js'; // ★追加
import { confirmAndRun } from '../utils/action-utils.js';
import { formatText, formatDateTime } from '../utils.js'; // ★ utils.jsからimport

export function openAnnouncementModal({
  mode,          // 'CREATE' | 'VIEW' | 'EDIT'
  post = null,   //お知らせデータオブジェクト（VIEW/EDIT時に渡す）
  authorId,      // CREATEに必要
  currentUserId,
  onSaved,       // CREATE 完了後
  onUpdated,     // EDIT 完了後
  onDeleted,     // DELETE 完了後
  onClosed       // VIEW 閉じ時のコールバック
}) {
  const p = post || {};
  const announcementId = p.id; // カレンダーとお揃いのID取得

  // post から安全に必要な値を取り出す（content ➔ body の変換もここで吸収）
  const id        = post?.id;
  const title     = post?.title || '';
  const body      = post?.content || post?.body || ''; // ★ ここで吸い上げる！
  const createdAt = post?.created_at || '';
  const postAuthorId = post?.author_id || authorId;

  const titles = {
    CREATE: '新規投稿',
    EDIT: '投稿を編集',
    VIEW: 'お知らせの詳細'
  };

  const isView = mode === 'VIEW';
  const isEdit = mode === 'EDIT';

  // VIEW モード：自動既読処理
  if (isView && announcementId && currentUserId) {
    markAsRead(announcementId, currentUserId).catch(err => console.error('自動既読処理エラー:', err));
  }

  // アクションボタンの組み立て（calendar-modal と共通仕様）
  let actions = [];

  if (isView) {
    actions = [
      {
        label: '編集',
        type: 'primary',
        onClick: () => openAnnouncementModal({
          mode: 'EDIT', post, announcementId, title, body, authorId, currentUserId, createdAt, onUpdated, onDeleted, onClosed
        })
      },
      {
        label: '削除',
        type: 'danger',
        onClick: async () => {
          await confirmAndRun('この投稿を削除しますか？', () => deleteAnnouncement(id), '削除しました');
          //onDeleted?.();
          onUpdated?.();
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
          let data;
          // calendar-modal と同じくフォームから一括取得
          try {
            data = await collectFormData({ attachment_url: p.attachment_url, attachment_name:p.attachment_name});
          } catch (err) {
            alert(err.message);
            return false;
          }

          if (!data.title || !data.content) {
            alert('タイトルと本文を入力してください。');
            //throw new Error('VALIDATION_ERROR');
            return false; // バリデーションエラー時はモーダルを閉じない
          }

          // 投稿者IDの確定（新規投稿時は currentUserId または authorId）
          const finalAuthorId = postAuthorId || currentUserId;
         
          if (!isEdit && !finalAuthorId) {
            alert('ログイン情報が取得できていません。再ログインをお試しください。');
            return false; // 投稿者IDが不明な場合はモーダルを閉じない
          }
          
          const action = isEdit
            ? () => updateAnnouncement(announcementId, data)
            : () => createAnnouncement({ ...data, authorId: finalAuthorId });

          const msg = isEdit ? '保存しますか？' : '投稿しますか？';
          const successMsg = isEdit ? '保存しました' : '投稿しました';

          const isSuccess = await confirmAndRun(msg, action, successMsg);

          if (isSuccess === false) return false; // ユーザーがキャンセルした場合はモーダルを閉じない
          
          (isEdit ? onUpdated : onSaved)?.();
        }
      },
      { label: 'キャンセル', type: 'secondary' }
    ];
  }

  // モーダル表示
  openModal({
    title: titles[mode] || title,
    content: isView ? renderViewContent(p) : renderFormContent(p),
    actions
  }); 

  // メール送信オプションのイベント初期化（CREATE時）
  if (!isView && !isEdit) {
    initEmailOptionEvents();
  }
  // 添付ファイル処理初期化
  if (!isView) {
    initAttachmentFieldEvents();
  }

}

/* ------------------------------
 * HTMLレンダリング（common.css のクラス名に統一）
 * ------------------------------ */
function renderViewContent(p) {
  const body = p?.content || p?.body || '';
  const title = p?.title || '';
  const createdAt = p?.created_at || '';
  const authorName = p?.author_name || p?.members?.name || '不明'; //どちらの取得経路でもOK

  return `
    <div class="form-group">
      <h3 style="margin: 0 0 0.75rem 0; font-size: 1.1rem; color: #1e3a8a;">${title}</h3>
    </div>
    <div class="form-group">
      <div class="announcement-body">${formatText(body)}</div>
    </div>
    ${renderAttachmentLink(p?.attachment_url, p?.attachment_name)}
    <div class="form-group">
      <div class="announcement-meta">投稿者：${authorName}　　投稿日時：${formatDateTime(createdAt)}</div>
    </div>
  `;
}

function renderFormContent(p) {
  // p が null や undefined の場合も考慮して安全に変数化
  const title = p?.title || '';
  const body  = p?.content || p?.body || '';
  return `
    <div class="form-group">
      <label for="ann-title">タイトル *</label>
      <input id="ann-title" type="text" class="form-control" value="${title}">
    </div>

    <div class="form-group">
      <label for="ann-body">本文 *</label>
      <textarea id="ann-body" class="form-control" rows="6">${body}</textarea>
    </div>

    <!-- ファイル添付 -->
    ${renderAttachmentField(p?.attachment_name)}
    
    <!-- メール送信オプション（新規投稿時） -->
    ${renderEmailOptionUI()}
  `;
}

/* ------------------------------
 * フォームデータ収集（calendar-modal と同じ作法）
 * ------------------------------ */
async function collectFormData(existingAttachment = {}) {
  const titleEl = document.getElementById('ann-title');
  const bodyEl = document.getElementById('ann-body');

  // .value を直接取得し、空の場合は明示的に空文字 '' にする（null を防ぐ）
  const title = titleEl ? titleEl.value.trim() : '';
  const content = bodyEl ? bodyEl.value.trim() : '';

  // メール設定データも一緒に取り込む
  const emailData = window.EMAIL_NOTIFY_ENABLED ? getEmailOptionData() : {};

  const attachmentData = await collectAttachmentData(existingAttachment); // ★共通関数呼び出し


  return {
    title,
    content,
    ...emailData,
    ...attachmentData
  };
}