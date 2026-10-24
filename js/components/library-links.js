// js/components/library-links.js
import { escapeHtml, formatText, formatDateShort } from '../utils.js';


// 汎用リスト描画関数
function renderLinkList(items) {
  if (!items || items.length === 0) return '';
  
  return items.map(item => {
    // フォルダ（children あり）
    if (Array.isArray(item.children)) {
      return `
        <li>
          <details class="library-folder">
            <summary class="library-link-item library-folder-summary">
              <span>${escapeHtml(item.label)}</span>
              <span class="library-folder-arrow">▶</span>
            </summary>
            <ul class="library-quick-links library-sub-links">
              ${renderLinkList(item.children)}
            </ul>
          </details>
        </li>
      `;
    }
    
    // 認証付きリンク（Edge Function経由で開く）
    if (item.protectedPath) {
      return `
        <li>
          <button type="button" class="library-link-button js-protected-link"
                  data-path="${escapeHtml(item.protectedPath)}">
            <span>${escapeHtml(item.label)}</span> ➔
          </button>
        </li>
      `;
    }

    // normal link
	  return `
	    <li>
        <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener" class="library-link-item">
          <span>${escapeHtml(item.label)}</span> ➔
        </a>
      </li>
	  `;
  }).join('');
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
  //return renderLinkList([{ label, url: '#library' }]); // クリックで資料庫へ誘導
  return `
    <li>
      <a href="#library" class="library-link-item" id="next-concert-link">
        <span>${escapeHtml(label)}</span> ➔
      </a>
    </li>
  `;
}

/**
 * 資料庫画面用：未来の演奏会を全件、複数行の詳細込みでブロック表示
 */
export function renderConcertBlocks(concerts) {
  if (!concerts || concerts.length === 0) {
    return '<p class="empty-text">今後の演奏会予定はありません。</p>';
  }

  const items = concerts.map(c => `
    <div class="concert-block">
      <div class="concert-date">${formatDateShort(c.event_date)}</div>
      <div class="concert-title">${escapeHtml(c.title)}</div>
      ${c.venue ? `<div class="concert-detail">${formatText(c.venue)}</div>` : ''}
    </div>
  `).join('');
  
  return `<div class="concert-grid">${items}</div>`; //
  
}

// 認証付きリンクのクリック処理（document全体で1回だけ登録）
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.js-protected-link');
  if (!btn) return;

  const win = window.open('', '_blank'); // クリック直後に開く（スマホのブロック対策）
  try {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) throw new Error('no session');

    const res = await fetch(
      `${ }/functions/v1/member-proxy?path=${encodeURIComponent(btn.dataset.path)}`,
      { headers: { Authorization: `Bearer ${session.access_token}`, apikey: SUPABASE_ANON_KEY } }
    );
    if (!res.ok) throw new Error(res.status);

    const blob = await res.blob();
    if (win) win.location = URL.createObjectURL(blob);
  } catch (err) {
    console.error('認証付き資料の取得エラー:', err);
    win?.close();
    alert('資料を開けませんでした。時間を置いて再度お試しください。');
  }
});