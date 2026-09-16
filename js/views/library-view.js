// js/views/library-view.js

import { renderPrimaryLibraryLinks, renderOtherLibraryLinks } from '../components/library-links.js';
import { renderSocialLinks } from '../components/social-links.js';

export function renderLibraryView() {
  return `
    <section id="view-library" class="view-section">
      <div class="card">
        <div class="card-header-title">
          <h2>📁 資料庫</h2>
        </div>
        <div class="card-body">
          
          <!-- 1. 主要資料（config.js の PRIMARY_LIBRARY_LINKS から動的生成） -->
          <div class="library-group">
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

// 内部遷移処理がすべて不要になったため、空の関数として定義
export async function initLibraryView() {}