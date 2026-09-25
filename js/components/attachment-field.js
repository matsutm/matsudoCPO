// js/components/attachment-field.js

import { uploadAttachment, MAX_ATTACHMENT_SIZE } from '../services/attachment-service.js';

/**
 * 添付ファイル入力欄のHTMLを生成
 * @param {string} existingName - 既存の添付ファイル名（EDIT時）
 */
export function renderAttachmentField(existingName = '') {
  return `
    <div class="form-group">
      <label for="attachment-file">添付ファイル(5MBまで)</label>
      ${existingName
        ? `<div style="font-size:0.85rem; color:#475569; margin-bottom:0.4rem;">現在の添付:${existingName}</div>`
        : ''}
      <input id="attachment-file" type="file" class="form-control">
      <div id="attachment-file-error" style="color:#dc2626; font-size:0.8rem; display:none; margin-top:0.3rem;"></div>
    </div>
  `;
}

/**
 * 選択直後にサイズ超過をその場で警告するイベントを設定
 * モーダル表示直後に1回呼ぶ
 */
export function initAttachmentFieldEvents() {
  const fileInput = document.getElementById('attachment-file');
  const fileError = document.getElementById('attachment-file-error');
  if (!fileInput) return;

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file && file.size > MAX_ATTACHMENT_SIZE) {
      fileError.textContent = 'ファイルサイズは5MBまでです。別のファイルを選んでください。';
      fileError.style.display = 'block';
      fileInput.value = '';
    } else {
      fileError.style.display = 'none';
    }
  });
}

/**
 * 保存時に呼ぶ：ファイルが選択されていればアップロードし、
 * DBに保存する { attachment_url, attachment_name } を返す。
 * 未選択なら既存の値をそのまま引き継ぐ。
 * @param {{attachment_url?: string, attachment_name?: string}} existing
 */
export async function collectAttachmentData(existing = {}) {
  const fileInput = document.getElementById('attachment-file');
  const file = fileInput?.files?.[0];

  if (!file) {
    return {
      attachment_url: existing.attachment_url || null,
      attachment_name: existing.attachment_name || null
    };
  }

  const uploaded = await uploadAttachment(file); // 5MB超は内部でthrow
  return { attachment_url: uploaded.url, attachment_name: uploaded.name };
}

/**
 * 添付ファイルへのリンクHTML（VIEW表示用）
 */
export function renderAttachmentLink(attachmentUrl, attachmentName) {
  if (!attachmentUrl) return '';
  return `
    <div class="form-group">
      <a href="${attachmentUrl}" target="_blank" rel="noopener" class="btn-secondary" style="text-decoration:none; display:inline-block;">
        📎 ${attachmentName || '添付ファイル'} を開く
      </a>
    </div>
  `;
}