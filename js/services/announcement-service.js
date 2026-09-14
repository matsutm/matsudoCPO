// js/services/announcement-service.js

/**
 * ログインユーザーの取得（localStorage連携）
 */
export function getCurrentUser() {
  return JSON.parse(localStorage.getItem('currentUser')) || {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'ゲスト団員',
    role: 'member'
  };
}


/**
 * 全掲示の取得（投稿者情報付き）
 */
export async function fetchAnnouncements() {
  // config.js で定義された window.supabaseClient を利用
  const { data, error } = await window.supabaseClient
    .from('announcements')
    .select('*, members:author_id(name)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}


// ユーザーの既読IDセットの取得
export async function fetchUserReadIds(memberId) {
  if (!memberId) return new Set();

  const { data, error } = await window.supabaseClient
    .from('announcement_reads')
    .select('announcement_id')
    .eq('member_id', memberId);

  if (error) throw error;
  return new Set((data || []).map(r => r.announcement_id));
}

// 単一お知らせデータの取得
export async function fetchAnnouncementById(postId) {
  const { data, error } = await window.supabaseClient
    .from('announcements')
    .select('*, members:author_id(name)')
    .eq('id', postId)
    .single();
  if (error) throw error;
  return data;
}

// 既読登録処理（重複時は無視）
export async function markAsRead(postId, memberId) {
  if (!postId || !memberId) return;

  const { error } = await window.supabaseClient
    .from('announcement_reads')
    .insert([{ announcement_id: postId, member_id: memberId }]);
  if (error && error.code !== '23505') throw error;
}


/**
 * 新規お知らせの投稿
 * @param {Object} postData { author_id, title, content, is_email_sent, target_scope, target_value }
 */
export async function createAnnouncement(postData) {
  const { data, error } = await window.supabaseClient
    .from('announcements')
    .insert([postData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 送信対象（セクション・パート）の選択肢一覧を取得
 */
export async function fetchTargetScopeOptions(scope) {
  const columnName = scope === 'section' ? 'section' : 'instrument';
  const { data, error } = await window.supabaseClient
    .from('members')
    .select(columnName);

  if (error || !data) return [];
  // 重複を除外して配列で返す
  return [...new Set(data.map(item => item[columnName]))].filter(Boolean);
}