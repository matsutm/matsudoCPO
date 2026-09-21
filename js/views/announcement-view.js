// js/views/announcement-view.js

import { getCurrentUser } from '../services/auth-service.js';
import { fetchAnnouncements, fetchUserReadIds, markAsRead, markAsUnread } from '../services/announcement-service.js';
import { createAnnouncementRowHTML, attachAnnouncementClickEvents } from '../components/announcement-card.js';
import { openAnnouncementModal } from '../components/announcement-modal.js';

const PAGE_SIZE = 10; // 1回あたりの表示件数

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
      <!-- ★ もっと見るボタン領域 -->
      <div id="more-container" style="text-align: center; margin-top: 1rem; display: none;">
        <button id="btnViewMore" class="btn-secondary" style="width: 100%; max-width: 200px;">もっと見る</button>
      </div>
    </div>
  `;
}

export async function initAnnouncementView(navigateTo) {
  const currentUser = getCurrentUser();
  await renderList(currentUser);

  // ＋ 新規投稿 → CREATE モードでモーダルを開く
  const btn = document.getElementById('btnNewPost');
  if (btn) {
    btn.onclick = () => {
      openAnnouncementModal({
        mode: 'CREATE',
        authorId: currentUser.id,
        onSaved: () => renderList(currentUser)
      });
    };
  }
}

async function renderList(currentUser) {
  const listContainer = document.getElementById('announcement-list');
  const moreContainer = document.getElementById('more-container');
  const btnViewMore   = document.getElementById('btnViewMore');


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

    // キャッシュの初期化と保存処理を追加
    window.__ANNOUNCEMENT_CACHE__ = new Map(posts.map(post => [post.id, post]));

    // 初期表示は 10 件まで
    let visibleLimit = PAGE_SIZE;

    // リスト描画用の内部関数
    const updateListDisplay = () => {
      const targetPosts = posts.slice(0, visibleLimit);

      listContainer.innerHTML = targetPosts
        .map(post => createAnnouncementRowHTML(post, readIds.has(post.id), true))
        .join('');

      // 一覧クリック → VIEW モードでモーダルを開く
      attachAnnouncementClickEvents(listContainer, currentUser.id, (post) => {
        openAnnouncementModal({
          mode: 'VIEW',
          post,
          currentUserId: currentUser.id,
          onUpdated: () => renderList(currentUser),
          onClosed: () => renderList(currentUser)
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

      // ★ 追加：クイック未読に戻すボタン
      listContainer.querySelectorAll('.btn-quick-unread').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          await markAsUnread(Number(btn.dataset.id), currentUser.id);
          await renderList(currentUser);
        });
      });

      // 残りの件数があれば「もっと見る」ボタンを表示
      if (moreContainer) {
        if (posts.length > visibleLimit) {
          moreContainer.style.display = 'block';
          btnViewMore.onclick = () => {
            visibleLimit += PAGE_SIZE; // 20件ずつ拡張
            updateListDisplay();
          };
        } else {
          moreContainer.style.display = 'none';
        }
      }
    };

    // 初回描画を実行
    updateListDisplay();


  } catch (err) {
    console.error('一覧描画エラー:', err);
    listContainer.innerHTML = '<p class="error-text">お知らせの読み込みに失敗しました。</p>';
  }
}
