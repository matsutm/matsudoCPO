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
        <div id="announcement-list" class="announcement-list"><p class="loading-text">読み込み中...</p></div>
      </section>
    </div>
  `;
}

export async function initAnnouncementView(navigateTo) {
  const currentUser = getCurrentUser();
  await renderList(currentUser);

  // ＋ 新規投稿 ➔ モーダルを「CREATE」モードで起動！
  document.getElementById('btnNewPost')?.addEventListener('click', () => {
    openAnnouncementModal('CREATE', null, currentUser.id, () => renderList(currentUser));
  });
}

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

    listContainer.innerHTML = posts.map(post => createAnnouncementRowHTML(post, readIds.has(post.id), true)).join('');

    // 行クリック ➔ モーダルを「VIEW」モードで起動！
    listContainer.querySelectorAll('.announcement-row').forEach(row => {
      row.querySelector('.row-main')?.addEventListener('click', () => {
        const postId = Number(row.dataset.id);
        openAnnouncementModal('VIEW', postId, currentUser.id, () => renderList(currentUser));
      });
    });

    // クイック既読
    listContainer.querySelectorAll('.btn-quick-read').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await markAsRead(Number(btn.dataset.id), currentUser.id);
        await renderList(currentUser);
      });
    });

  } catch (err) {
    console.error('一覧描画エラー:', err);
    listContainer.innerHTML = '<p class="error-text">お知らせの読み込みに失敗しました。</p>';
  }
}