import { fetchAnnouncementById, markAsRead } from '../services/announcement-service.js';

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('currentUser')) || { id: '00000000-0000-0000-0000-000000000000' };
}

export function renderAnnouncementDetailView() {
  return `
    <div class="announcement-container">
      <div class="detail-header">
        <button id="btnBack" class="btn-text">← 戻る</button>
        <h2>お知らせ詳細</h2>
      </div>
      <div class="announcement-form-section readonly-form">
        <div class="form-group">
          <label>タイトル</label>
          <input type="text" id="detail-title" readonly />
        </div>
        <div class="form-group">
          <label>投稿情報</label>
          <div id="detail-meta" class="detail-meta-text"></div>
        </div>
        <div class="form-group">
          <label>本文</label>
          <textarea id="detail-content" rows="8" readonly></textarea>
        </div>
      </div>
    </div>
  `;
}

export async function initAnnouncementDetailView(postId) {
  const currentUser = getCurrentUser();

  // 戻るボタン（元のホームまたは一覧へ帰る）
  document.getElementById('btnBack')?.addEventListener('click', () => history.back());

  // データ取得＆開いた瞬間に自動既読実行
  try {
    const post = await fetchAnnouncementById(postId);
    if (post) {
      document.getElementById('detail-title').value = post.title;
      document.getElementById('detail-content').value = post.content;
      document.getElementById('detail-meta').textContent = 
        `投稿者: ${post.members?.name || '不明'} | 投稿日時: ${new Date(post.created_at).toLocaleString('ja-JP')}`;

      // ★閲覧と同時にサービス層で自動既読化
      await markAsRead(post.id, currentUser.id);
    }
  } catch (err) {
    console.error('詳細取得エラー:', err);
  }
}