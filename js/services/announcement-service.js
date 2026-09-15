// js/services/announcement-service.js

/**
 * 全掲示の取得（投稿者情報付き）
 */
export async function fetchAnnouncements() {
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

// 既読登録処理
export async function markAsRead(postId, memberId) {
  if (!postId || !memberId) return;

  const { error } = await window.supabaseClient
    .from('announcement_reads')
    .insert([{ announcement_id: postId, member_id: memberId }]);

  if (error && error.code !== '23505') throw error;
}

/**
 * CREATE（新規投稿）
 * announcement-modal.js の CREATE モードから呼ばれる
 */
export async function saveAnnouncement({ title, body, authorId }) {
  const postData = {
    author_id: authorId,
    title,
    content: body,
    is_email_sent: false,
    target_scope: null,
    target_value: null,
    created_at: new Date().toISOString()
  };

  const { data, error } = await window.supabaseClient
    .from('announcements')
    .insert([postData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * EDIT（投稿の更新）
 * announcement-modal.js の EDIT モードから呼ばれる
 */
export async function updateAnnouncement(postId, { title, body }) {
  const { data, error } = await window.supabaseClient
    .from('announcements')
    .update({
      title,
      content: body
    })
    .eq('id', postId)
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
  return [...new Set(data.map(item => item[columnName]))].filter(Boolean);
}
