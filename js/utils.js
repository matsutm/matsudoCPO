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
 * 日付フォーマット（例: 09/14）
 */
export function formatDateShort(dateString) {
  if (!dateString) return '';
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
  return new Date(dateString).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}