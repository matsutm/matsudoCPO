// js/utils/deep-link.js

/**
 * 画面＋IDから、直接開けるURLを作る
 * 例: buildDeepLink('announcement', 123) → https://.../index.html#announcement/123
 */
export function buildDeepLink(view, id) {
  return `${location.origin}${location.pathname}#${view}/${id}`;
}

/**
 * URLをクリップボードへコピー（失敗時は手動コピー用のダイアログ）
 */
export async function copyLink(url) {
  try {
    await navigator.clipboard.writeText(url);
    alert('URLをコピーしました');
  } catch {
    prompt('このURLをコピーしてください', url);
  }
}