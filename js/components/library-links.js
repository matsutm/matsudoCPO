// js/components/library-links.js
import { escapeHtml, formatText, formatDateShort } from '../utils.js';


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

/**
 * ホーム画面用：直近1件だけ、日付+演奏会名の1行リンク
 */
export function renderNextConcertLink(concert) {
  if (!concert) return '';
  const label = `🎼 ${formatDateShort(concert.event_date)} ${concert.title}`;
  return renderLinkList([{ label, url: '#library' }]); // クリックで資料庫へ誘導
}

/**
 * 資料庫画面用：未来の演奏会を全件、複数行の詳細込みでブロック表示
 */
export function renderConcertBlocks(concerts) {
  if (!concerts || concerts.length === 0) {
    return '<p class="empty-text">今後の演奏会予定はありません。</p>';
  }

  return concerts.map(c => `
    <div class="concert-block">
      <div class="concert-date">${formatDateShort(c.event_date)}</div>
      <div class="concert-title">${escapeHtml(c.title)}</div>
      ${c.venue ? `<div class="concert-detail">${formatText(c.venue)}</div>` : ''}
    </div>
  `).join('');
}
