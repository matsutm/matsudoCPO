import { supabase } from '../config.js';
import { sendBulletinEmail } from '../services/email-service.js';

// ※仮のログインユーザー取得処理（実際の認証ロジックに合わせて差し替えてください）
function getCurrentUser() {
  // 例: LocalStorageやグローバル状態から取得
  return JSON.parse(localStorage.getItem('currentUser')) || {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'ゲスト団員',
    role: 'member' // 'admin' または 'member'
  };
}

/**
 * 画面HTMLテンプレートの生成
 */
export function renderAnnouncementView() {
  const currentUser = getCurrentUser();
  const isAdmin = currentUser.role === 'admin';

  return `
    <div class="announcement-container">
      <h2>お知らせ・掲示板</h2>

      <!-- 新規投稿フォーム -->
      <section class="announcement-form-section">
        <h3>新規お知らせ投稿</h3>
        <form id="announcement-form">
          <div class="form-group">
            <input type="text" id="announcement-title" placeholder="タイトルを入力" required />
          </div>
          
          <div class="form-group">
            <textarea id="announcement-content" placeholder="お知らせ内容を入力してください" rows="5" required></textarea>
          </div>

          <!-- 管理者専用：メール送信オプション -->
          ${isAdmin ? `
            <div class="email-option-box">
              <label class="checkbox-label">
                <input type="checkbox" id="send-email-check" />
                同時にメール通知を送信する
              </label>
              
              <div id="email-target-container" class="email-target-container" style="display: none;">
                <label for="email-target-scope">送信範囲：</label>
                <select id="email-target-scope">
                  <option value="all">全団員</option>
                  <option value="section">特定のセクション</option>
                  <option value="instrument">特定のパート（楽器）</option>
                </select>

                <select id="email-target-value" style="display: none;">
                  <!-- 動的に選択肢を挿入 -->
                </select>
              </div>
            </div>
          ` : ''}

          <div class="form-actions">
            <button type="submit" class="btn-primary" id="submit-btn">投稿する</button>
          </div>
        </form>
      </section>

      <!-- 投稿一覧表示エリア -->
      <section class="announcement-list-section">
        <h3>投稿一覧</h3>
        <div id="announcement-list" class="announcement-list">
          <p class="loading-text">読み込み中...</p>
        </div>
      </section>
    </div>
  `;
}

/**
 * 画面ロジックの初期化・イベントリスナー設定
 */
export async function initAnnouncementView() {
  const currentUser = getCurrentUser();
  const form = document.getElementById('announcement-form');
  const sendEmailCheck = document.getElementById('send-email-check');
  const targetScopeSelect = document.getElementById('email-target-scope');
  const targetValueSelect = document.getElementById('email-target-value');
  const emailTargetContainer = document.getElementById('email-target-container');

  // 1. 管理者向け：メールオプションの表示切り替え制御
  if (sendEmailCheck) {
    sendEmailCheck.addEventListener('change', (e) => {
      emailTargetContainer.style.display = e.target.checked ? 'block' : 'none';
    });

    targetScopeSelect.addEventListener('change', async (e) => {
      const scope = e.target.value;
      if (scope === 'all') {
        targetValueSelect.style.display = 'none';
        targetValueSelect.innerHTML = '';
      } else {
        targetValueSelect.style.display = 'inline-block';
        await loadTargetOptions(scope);
      }
    });
  }

  // 2. 初回投稿一覧の取得と描画
  await fetchAndRenderAnnouncements(currentUser);

  // 3. フォーム送信イベント処理
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('announcement-title').value.trim();
    const content = document.getElementById('announcement-content').value.trim();
    const isEmailSent = sendEmailCheck ? sendEmailCheck.checked : false;
    const targetScope = isEmailSent ? targetScopeSelect.value : null;
    const targetValue = (isEmailSent && targetScope !== 'all') ? targetValueSelect.value : null;

    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = '送信中...';

    try {
      // announcements テーブルへ登録
      const { data: newPost, error } = await supabase
        .from('announcements')
        .insert([{
          author_id: currentUser.id,
          title: title,
          content: content,
          is_email_sent: isEmailSent,
          target_scope: targetScope,
          target_value: targetValue
        }])
        .select()
        .single();

      if (error) throw error;

      // メール送信オプションがONの場合はメール配信を実行
      if (isEmailSent) {
        await sendBulletinEmail({
          title: title,
          content: content,
          targetScope: targetScope,
          targetValue: targetValue
        });
      }

      alert('お知らせを投稿しました。');
      form.reset();
      if (emailTargetContainer) emailTargetContainer.style.display = 'none';

      // 一覧を再取得
      await fetchAndRenderAnnouncements(currentUser);

    } catch (err) {
      console.error('投稿エラー:', err);
      alert('投稿処理に失敗しました: ' + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '投稿する';
    }
  });
}

/**
 * DBからセクションまたは楽器の一覧を重複なく取得してドロップダウンに埋める
 */
async function loadTargetOptions(scope) {
  const targetValueSelect = document.getElementById('email-target-value');
  targetValueSelect.innerHTML = '<option value="">読み込み中...</option>';

  const columnName = scope === 'section' ? 'section' : 'instrument';
  const { data, error } = await supabase
    .from('members')
    .select(columnName);

  if (error || !data) {
    targetValueSelect.innerHTML = '<option value="">取得失敗</option>';
    return;
  }

  // 重複を除外してリスト化
  const uniqueItems = [...new Set(data.map(item => item[columnName]))].filter(Boolean);

  targetValueSelect.innerHTML = uniqueItems.map(item => `
    <option value="${escapeHtml(item)}">${escapeHtml(item)}</option>
  `).join('');
}

/**
 * お知らせ一覧の取得・既読チェック・描画
 */
async function fetchAndRenderAnnouncements(currentUser) {
  const listContainer = document.getElementById('announcement-list');

  try {
    // お知らせ一覧と投稿者情報を結合取得
    const { data: posts, error } = await supabase
      .from('announcements')
      .select(`
        *,
        members:author_id ( name )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!posts || posts.length === 0) {
      listContainer.innerHTML = '<p class="empty-text">現在お知らせはありません。</p>';
      return;
    }

    // ログインユーザーの既読一覧を取得
    const { data: readData } = await supabase
      .from('announcement_reads')
      .select('announcement_id')
      .eq('member_id', currentUser.id);

    const readPostIds = new Set((readData || []).map(r => r.announcement_id));

    // HTML描画
    listContainer.innerHTML = posts.map(post => {
      const isRead = readPostIds.has(post.id);
      const authorName = post.members ? post.members.name : '不明な投稿者';
      const formattedDate = new Date(post.created_at).toLocaleString('ja-JP', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
      });

      return `
        <article class="announcement-card ${isRead ? 'read' : 'unread'}" data-id="${post.id}">
          <header class="card-header">
            <div class="header-main">
              ${!isRead ? '<span class="badge-unread">未読</span>' : ''}
              <h4 class="card-title">${escapeHtml(post.title)}</h4>
            </div>
            <div class="card-meta">
              <span>投稿者: ${escapeHtml(authorName)}</span> | 
              <time>${formattedDate}</time>
            </div>
          </header>
          <div class="card-body">
            <p>${escapeHtml(post.content).replace(/\n/g, '<br>')}</p>
          </div>
          ${!isRead ? `
            <footer class="card-footer">
              <button class="btn-read-mark" onclick="markAsRead(${post.id}, '${currentUser.id}')">既読にする</button>
            </footer>
          ` : ''}
        </article>
      `;
    }).join('');

  } catch (err) {
    console.error('一覧取得エラー:', err);
    listContainer.innerHTML = '<p class="error-text">お知らせの読み込みに失敗しました。</p>';
  }
}

/**
 * 既読ボタン押下時の処理（グローバル関数化してHTMLイベントから呼び出し）
 */
window.markAsRead = async function(announcementId, memberId) {
  try {
    const { error } = await supabase
      .from('announcement_reads')
      .insert([{
        announcement_id: announcementId,
        member_id: memberId
      }]);

    if (error && error.code !== '23505') { // 23505はユニーク制約エラー（すでに既読済み）
      throw error;
    }

    // 画面上のカード表示を「既読」へ即時更新
    const card = document.querySelector(`.announcement-card[data-id="${announcementId}"]`);
    if (card) {
      card.classList.remove('unread');
      card.classList.add('read');
      const badge = card.querySelector('.badge-unread');
      if (badge) badge.remove();
      const footer = card.querySelector('.card-footer');
      if (footer) footer.remove();
    }
  } catch (err) {
    console.error('既読登録エラー:', err);
  }
};

/**
 * XSS対策エスケープユーティリティ
 */
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&< me'"]/g, (match) => {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[match] || match;
  });
}