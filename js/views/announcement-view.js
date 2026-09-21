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
      <div id="more-container" style="text-align: center; margin-top: 1rem; display: none;">
        <button id="btnViewMore" class="btn-secondary" style="width: 100%; max-width: 200px;">もっと見る</button>
      </div>
    </div>
  `;
}

export async function initAnnouncementView(navigateTo) {
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    console.warn('ユーザー情報がないため認証画面にリダイレクトします');
    navigateTo('auth');
    return;
  }

  await renderList(currentUser);

  // ＋ 新規投稿ボタンのイベント設定
  const btn = document.getElementById('btnNewPost');
  if (btn) {
    btn.onclick = () => {
      openAnnouncementModal({
        mode: 'CREATE',
        authorId: currentUser.id,
        currentUserId: currentUser.id,
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
    //console.log('--- お知らせデータ取得開始 ---');
    const posts = await fetchAnnouncements();
    const readIds = await fetchUserReadIds(currentUser.id);
    //console.log('取得されたお知らせデータ:', posts);
    //console.log('取得された既読ID:', readIds);

    if (!posts || posts.length === 0) {
      listContainer.innerHTML = '<p class="empty-text" style="padding: 1rem; text-align: center; color: #64748b;">現在お知らせはありません。</p>';
      return;
    }

    // キャッシュ保存
    window.__ANNOUNCEMENT_CACHE__ = new Map(posts.map(post => [post.id, post]));

    let visibleLimit = PAGE_SIZE;

    const updateListDisplay = () => {
      const targetPosts = posts.slice(0, visibleLimit);

      listContainer.innerHTML = targetPosts
        .map(post => createAnnouncementRowHTML(post, readIds.has(post.id), true))
        .join('');

      // 詳細モーダル表示バインド
      attachAnnouncementClickEvents(listContainer, currentUser.id, (post) => {
        openAnnouncementModal({
          mode: 'VIEW',
          post,
          currentUserId: currentUser.id,
          onUpdated: () => renderList(currentUser),
          onClosed: () => renderList(currentUser)
        });
      });

      // クイック既読ボタン
      listContainer.querySelectorAll('.btn-quick-read').forEach(btn => {
        btn.onclick = async (e) => {
          e.stopPropagation();
          await markAsRead(Number(btn.dataset.id), currentUser.id);
          await renderList(currentUser);
        };
      });

      // クイック未読ボタン
      listContainer.querySelectorAll('.btn-quick-unread').forEach(btn => {
        btn.onclick = async (e) => {
          e.stopPropagation();
          await markAsUnread(Number(btn.dataset.id), currentUser.id);
          await renderList(currentUser);
        };
      });

      // 「もっと見る」ボタン表示制御
      if (moreContainer) {
        if (posts.length > visibleLimit) {
          moreContainer.style.display = 'block';
          btnViewMore.onclick = () => {
            visibleLimit += PAGE_SIZE;
            updateListDisplay();
          };
        } else {
          moreContainer.style.display = 'none';
        }
      }
    };

    updateListDisplay();

  } catch (err) {
    console.error('一覧描画エラー詳細:', err);
    listContainer.innerHTML = `<p class="error-text" style="color: #dc2626; padding: 1rem;">お知らせの読み込みに失敗しました。<br><small>${err.message || ''}</small></p>`;
  }
}