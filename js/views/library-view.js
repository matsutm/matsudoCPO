// js/views/library-view.js

import { renderPrimaryLibraryLinks, renderOtherLibraryLinks, renderConcertBlocks } from '../components/library-links.js';
import { renderSocialLinks } from '../components/social-links.js';
import { fetchUpcomingConcerts } from '../services/concert-service.js';

export function renderLibraryView() {
  return `
    <section id="view-library" class="view-section">
      <div class="card">
        <div class="card-header-title"><h2>📁 資料庫</h2></div>
        <div class="card-body">
          
          <div class="library-group">
            <h3>🎼 今後の演奏会予定</h3>
            <div id="concert-list-container">
              <p class="loading-text">読み込み中...</p>
            </div>
          </div>
          <!-- 1. 主要資料（config.js の PRIMARY_LIBRARY_LINKS から動的生成） -->
          <div class="library-group" style="margin-top: 24px;">
            <h3>主要資料</h3>
            <ul class="library-quick-links">
              ${renderPrimaryLibraryLinks()}
            </ul>
          </div>

          <!-- 2. その他・名簿・各種申請（config.js の OTHER_LIBRARY_LINKS から動的生成） -->
          <div class="library-group" style="margin-top: 24px;">
            <h3>その他・団員名簿・各種申請</h3>
            <ul class="library-quick-links">
              ${renderOtherLibraryLinks()}
            </ul>
          </div>

          <!-- 3. 公式SNS・チケット（最下部に配置） -->
          <div class="library-group" style="margin-top: 32px;">
            <p style="font-size: 0.75rem; color: #64748b; margin-bottom: 4px;">公式SNS / チケット</p>
            ${renderSocialLinks()}
          </div>

        </div>
      </div>
    </section>
  `;
}

// 直近演奏会
export async function initLibraryView() {
    const container = document.getElementById('concert-list-container');
  if (!container) return;

  try {
    const concerts = await fetchUpcomingConcerts(3);
    container.innerHTML = '<div class="concert-grid">${renderConcertBlocks(concerts)}</div>';
  } catch (err) {
    console.error('演奏会予定取得エラー:', err);
    container.innerHTML = '<p class="error-text">読み込みに失敗しました。</p>';
  }
}
