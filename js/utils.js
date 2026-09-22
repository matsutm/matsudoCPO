/**
 * XSS対策用HTMLエスケープ
 */
export function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m] || m));
}

/**
 * テキストを安全にHTML化し、URLがあればハイパーリンクにする汎用関数
 */
export function formatText(text) {
  if (!text) return '';

  // 1. 既存の escapeHtml で XSS 対策
  const escaped = escapeHtml(text);

  // 2. 改行コードを <br> に変換
  const formatted = escaped.replace(/\n/g, '<br>');

  // 3. URL（http/https）を <a> タグに置換
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  return formatted.replace(
    urlRegex,
    '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">$1</a>'
  );
}

/**
 * 日付フォーマット（例: 09/14）
 */
export function formatDateShort(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; // 無効な日付の場合は元の文字列を返す
  return new Date(dateString).toLocaleDateString('ja-JP', {
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * 日時フォーマット（例: 2026/09/14 15:30）
 */
export function formatDateTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; // 無効な日付の場合は元の文字列を返す
  return new Date(dateString).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}