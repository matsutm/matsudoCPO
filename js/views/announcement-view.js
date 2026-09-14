// js/views/announcement-view.js

import { getCurrentUser, fetchAnnouncements, fetchUserReadIds, markAsRead } from '../services/announcement-service.js';
import { createAnnouncementRowHTML } from '../components/announcement-card.js';
import { openAnnouncementModal } from '../components/announcement-modal.js';

export function renderAnnouncementView() {
  return `
    <div class="announcement-container">
      <div class="header-actions">
        <h2>お知らせ・掲示板</h2>
        <button id="btnNewPost" class="btn-primary">＋ 新規投稿</button>
      </div>

      <section class="announcement-list-section">
        <div id="announcement-list" class="announcement-list">
          <p class="loading-text">読み込み中...</p>
        </div>
      </section>
    </div>
  `;
}

export async function initAnnouncementView(navigateTo) {
  const currentUser = getCurrentUser();
  
  // 一覧の描画を実行
  await renderList(currentUser);

  // 新規投稿ボタンのイベント設定
  document.getElementById('btnNewPost')?.addEventListener('click', () => {
    navigateTo('announcement-new');
  });
} // ★ initAnnouncementView の閉じ括弧

// 投稿一覧の取得・描画処理
async function renderList(currentUser) {
  const listContainer = document.getElementById('announcement-list');
  if (!listContainer) return;

  try {
    const [posts, readIds] = await Promise.all([
      fetchAnnouncements(),
      fetchUserReadIds(currentUser.id)
    ]);

    if (!posts || posts.length === 0) {
      listContainer.innerHTML = '<p class="empty-text">現在お知らせはありません。</p>';
      return;
    }

    // 共通カードコンポーネントで行リストを生成
    listContainer.innerHTML = posts.map(post => 
      createAnnouncementRowHTML(post, readIds.has(post.id), true)
    ).join('');

    // 行本体クリック ➔ モーダル起動（閉じたら一覧再読み込み）
    listContainer.querySelectorAll('.announcement-row').forEach(row => {
      row.querySelector('.row-main')?.addEventListener('click', () => {
        const postId = Number(row.dataset.id);
        openAnnouncementModal(postId, currentUser.id, () => {
          renderList(currentUser);
        });
      });
    });

    // クイック既読ボタン ➔ モーダルを開かずにその場でDB更新＆再描画
    listContainer.querySelectorAll('.btn-quick-read').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const postId = Number(btn.dataset.id);
        await markAsRead(postId, currentUser.id);
        await renderList(currentUser);
      });
    });

  } catch (err) {
    console.error('一覧描画エラー:', err);
    listContainer.innerHTML = '<p class="error-text">お知らせの読み込みに失敗しました。</p>';
  }
}