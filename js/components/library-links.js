// js/components/library-links.js
import { escapeHtml } from '../utils.js';

// 汎用リスト描画関数
function renderLinkList(items) {
  if (!items || items.length === 0) return '';
  
  return items.map(item => `
    <li>
      <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener" class="library-link-item">
        <span>${escapeHtml(item.label)}</span> ➔
      </a>
    </li>
  `).join('');
}

/**
 * 主要資料リストHTMLを出力
 */
export function renderPrimaryLibraryLinks() {
  const links = window.APP_CONSTANTS?.PRIMARY_LIBRARY_LINKS || [];
  return renderLinkList(links);
}

/**
 * その他資料・名簿リストHTMLを出力
 */
export function renderOtherLibraryLinks() {
  const links = window.APP_CONSTANTS?.OTHER_LIBRARY_LINKS || [];
  return renderLinkList(links);
}