// js/services/attachment-service.js

export const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024; // 5MB
const BUCKET_NAME = 'attachments';

/**
 * ファイルをStorageにアップロードし、{url, name, path} を返す
 * @param {File} file
 */
export async function uploadAttachment(file) {
  if (!file) return null;

  if (file.size > MAX_ATTACHMENT_SIZE) {
    throw new Error('ファイルサイズは5MBまでです。');
  }

  // ★拡張子だけを取り出す（日本語部分を含む元のファイル名は使わない）
  const extMatch = file.name.match(/\.[^.]+$/);
  const ext = extMatch ? extMatch[0] : '';

  const filePath = `${crypto.randomUUID()}_${ext}`;

  const { error: uploadError } = await window.supabaseClient
    .storage
    .from(BUCKET_NAME)
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = window.supabaseClient
    .storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return { url: data.publicUrl, name: file.name, path: filePath };
}

/**
 * Storageから添付ファイルを削除する
 * @param {string} fileUrl - DBに保存されている公開URL
 */
export async function deleteAttachmentFile(fileUrl) {
  if (!fileUrl) return;

  const filePath = fileUrl.split(`/${BUCKET_NAME}/`)[1];
  if (!filePath) return;

  const { error } = await window.supabaseClient
    .storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) console.error('添付ファイル削除エラー:', error);
}