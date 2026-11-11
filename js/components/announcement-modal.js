// js/components/announcement-modal.js

import { openModal } from './modal.js';
import { createAnnouncement, updateAnnouncement, deleteAnnouncement, markAsRead, isTargeted } from '../services/announcement-service.js'; 
import { renderAudienceUI, initAudienceEvents, getAudienceData, renderReplyAudienceUI, renderEmailOptionUI, getEmailOptionData } from './announcement-email-option.js';
import { renderAttachmentField, initAttachmentFieldEvents, collectAttachmentData, renderAttachmentLink } from './attachment-field.js';
import { confirmAndRun } from '../utils/action-utils.js';
import { formatText, formatDateTime, escapeHtml } from '../utils.js';
import { sendBulletinEmail } from '../services/email-service.js';
import { renderAudienceBadge } from './announcement-card.js';
import { buildDeepLink, copyLink } from '../utils/deep-link.js';

export function openAnnouncementModal({
  mode,          // 'CREATE' | 'VIEW' | 'EDIT'
  post = null,   // お知らせデータオブジェクト（VIEW/EDIT時に渡す）
  authorId,      // CREATEに必要
  currentUserId,
  prefill = null, // 返信・転送の初期値（CREATE時のみ）
  onSaved,       // CREATE 完了後
  onUpdated,     // EDIT 完了後
  onDeleted,     // DELETE 完了後
  onClosed       // VIEW 閉じ時のコールバック
}) {
  const p = post || {};
  const announcementId = p.id;
  const id = post?.id;
  const title = post?.title || '';
  const postAuthorId = post?.author_id || authorId;

  const isView = mode === 'VIEW';
  const isEdit = mode === 'EDIT';

  // モーダルのタイトル（返信・転送のときは専用の見出し）
  const modalTitle = prefill?.replyTarget ? '返信'
    : prefill ? '転送'
    : ({ CREATE: '新規投稿', EDIT: '投稿を編集', VIEW: 'お知らせの詳細' }[mode] || title);

  // VIEW モード：自動既読処理
  if (isView && announcementId && currentUserId) {
    markAsRead(announcementId, currentUserId).catch(err => console.error('自動既読処理エラー:', err));
  }

  let actions = [];

  if (isView) {
    const isMine = p.author_id === currentUserId;
    const openCreateWith = (kind) => openAnnouncementModal({
      mode: 'CREATE',
      authorId: currentUserId,
      currentUserId,
      prefill: buildPrefill(kind, p),
      onSaved: onUpdated
    });

    actions = [
      // 他人の投稿にだけ「返信」
      ...(!isMine ? [{ label: '返信', type: 'primary', onClick: () => openCreateWith('reply') }] : []),
      { label: '転送', type: 'secondary', onClick: () => openCreateWith('forward') },
      // 編集・削除は投稿者本人だけ
      ...(isMine ? [
        {
          label: '編集',
          type: 'primary',
          onClick: () => openAnnouncementModal({
            mode: 'EDIT', post, authorId, currentUserId, onUpdated, onDeleted, onClosed
          })
        }
       ] : []),
      {
        label: 'URL取得',
        type: 'secondary',
        onClick: async () => {
          await copyLink(buildDeepLink('announcement', id));
          return false; // モーダルを閉じない
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
          try {
            data = await collectFormData({ attachment_url: p.attachment_url, attachment_name: p.attachment_name }, isEdit, prefill);
            if (!isEdit && data.target_scope !== 'all' && !data.target_value) {
              alert('お知らせ先を選択してください。');
              return false;
            }
          } catch (err) {
            alert(err.message);
            return false;
          }

          if (!data.title || !data.content) {
            alert('タイトルと本文を入力してください。');
            return false;
          }

          const finalAuthorId = postAuthorId || currentUserId;
          if (!isEdit && !finalAuthorId) {
            alert('ログイン情報が取得できていません。再ログインをお試しください。');
            return false;
          }

          const action = async () => {
            const saved = isEdit
              ? await updateAnnouncement(announcementId, data)
              : await createAnnouncement({ ...data, authorId: finalAuthorId });

            // 新規投稿（返信・転送を含む）でチェックがONの時だけメール送信
            if (!isEdit && data.is_email_sent) {
              try {
                await sendBulletinEmail({
                  announcementId: saved.id,
                  title: data.title,
                  content: data.content,
                  targetScope: data.target_scope,
                  targetValue: data.target_value,
                  replyToAuthorId: data.reply_to_author_id
                });
              } catch (err) {
                console.error('メール送信エラー:', err);
                alert('投稿は完了しましたが、メール送信には失敗しました。');
              }
            }
            return saved;
          };

          const msg = isEdit ? '保存しますか？' : '投稿しますか？';
          const successMsg = isEdit ? '保存しました' : '投稿しました';

          const isSuccess = await confirmAndRun(msg, action, successMsg);
          if (isSuccess === false) return false;

          (isEdit ? onUpdated : onSaved)?.();
        }
      },
      { label: 'キャンセル', type: 'secondary' },
      ...(isEdit ? [{
        label: '削除',
        type: 'danger',
        onClick: async () => {
          const result = await confirmAndRun('この投稿を削除しますか？', () => deleteAnnouncement(id), '削除しました');
          if (result === false) return false; // キャンセル時はモーダルを閉じない
          onUpdated?.();
        }
      }] : [])
    ];
  }

  // モーダル表示
  openModal({
    title: modalTitle,
    content: isView ? renderViewContent(p) : renderFormContent(p, isEdit, prefill),
    actions
  });

  if (!isView && !isEdit) initAudienceEvents(); // 宛先は新規のみ変更可
  if (!isView) initAttachmentFieldEvents();

  // 返信のときは、本文の先頭からすぐ書き始められるようにする
  if (prefill?.replyTarget) {
    const ta = document.getElementById('ann-body');
    ta?.focus();
    ta?.setSelectionRange(0, 0);
  }
}

/* ------------------------------
 * 返信・転送の初期値
 * ------------------------------ */
function buildPrefill(kind, p) {
  const title = p?.title || '';
  const body = p?.content || p?.body || '';

  if (kind === 'reply') {
    const authorName = p.author_name || p.members?.name || '投稿者';
    const targeted = isTargeted(p);
    const origScope = targeted ? p.target_scope : 'all';
    return {
      title: title.startsWith('Re: ') ? title : `Re: ${title}`,
      content: `\n\n----- 元の投稿（${authorName}）-----\n${body}`,
      reply_to: p.id,
      replyTarget: {
        id: p.author_id,
        name: authorName,
        scope: origScope,
        value: targeted ? p.target_value : '',
        allLabel: origScope === 'all' ? '全団員' : p.target_value,
        canReplyAll: origScope !== 'member' // 個人宛への返信は発信者のみ
      }
    };
  }

  return {
    title: title.startsWith('【転送】') ? title : `【転送】${title}`,
    content: body
  };
}

/* ------------------------------
 * HTMLレンダリング
 * ------------------------------ */
function renderViewContent(p) {
  const body = p?.content || p?.body || '';
  const title = p?.title || '';
  const createdAt = p?.created_at || '';
  const authorName = p?.author_name || p?.members?.name || '不明';

  return `
    <div class="form-group">
      <h3 style="margin: 0 0 0.75rem 0; font-size: 1.1rem; color: #1e3a8a;">${escapeHtml(title)}</h3>
      ${renderAudienceBadge(p)}
    </div>
    <div class="form-group announcement-body-scroll">
      <div class="announcement-body">${formatText(body)}</div>
    </div>
    ${renderAttachmentLink(p?.attachment_url, p?.attachment_name)}
    <div class="form-group">
      <div class="announcement-meta">投稿者：${escapeHtml(authorName)}　　投稿日時：${formatDateTime(createdAt)}</div>
    </div>
  `;
}

function renderAudienceLabel(p) {
  const label = p.target_scope === 'member' ? '個人宛'
    : isTargeted(p) ? p.target_value
    : '全団員';
  return `
    <div class="form-group">
      <label>お知らせ先</label>
      <div style="font-size:0.9rem;">${escapeHtml(label)}（投稿後は変更できません）</div>
    </div>
  `;
}

function renderFormContent(p, isEdit = false, prefill = null) {
  const title = p?.title || prefill?.title || '';
  const body  = p?.content || p?.body || prefill?.content || '';

  // お知らせ先：編集＝表示のみ / 返信＝発信者へ / それ以外＝従来の選択UI
  const audienceHTML = isEdit
    ? renderAudienceLabel(p)
    : prefill?.replyTarget
      ? renderReplyAudienceUI(prefill.replyTarget)
      : renderAudienceUI();

  // textarea 直後の改行は無視されるため、先頭に1つ改行を足して引用前の空行を保つ
  return `
    <div class="form-group">
      <label for="ann-title">タイトル *</label>
      <input id="ann-title" type="text" class="form-control" value="${escapeHtml(title)}">
    </div>

    <div class="form-group">
      <label for="ann-body">本文 *</label>
      <textarea id="ann-body" class="form-control" rows="6">
${escapeHtml(body)}</textarea>
    </div>
    ${audienceHTML}

    <!-- ファイル添付 -->
    ${renderAttachmentField(p?.attachment_name)}
    
    <!-- メール送信オプション（新規投稿時。返信・転送は初期ON） -->
    ${isEdit ? '' : renderEmailOptionUI(!!prefill)}
  `;
}

/* ------------------------------
 * フォームデータ収集
 * ------------------------------ */
async function collectFormData(existingAttachment = {}, isEdit = false, prefill = null) {
  const title = document.getElementById('ann-title')?.value.trim() || '';
  const content = document.getElementById('ann-body')?.value.trim() || '';
  const attachmentData = await collectAttachmentData(existingAttachment);

  const base = { title, content, ...attachmentData };
  if (isEdit) return base; // 編集時は表示先・メール設定を触らない

  const audience = getAudienceData();
  const email = getEmailOptionData();

  return {
    ...base,
    target_scope: audience.targetScope,
    target_value: audience.targetValue,
    is_email_sent: email.isEmailSent,
    reply_to: prefill?.reply_to || null,                    // reply_to 列を作らない場合は、この行を削除
    reply_to_author_id: prefill?.replyTarget?.id || null
  };
}