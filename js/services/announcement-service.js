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

/**
 * ユーザーの既読IDセットの取得
 */
export async function fetchUserReadIds(memberId) {
  if (!memberId) return new Set();

  const { data, error } = await window.supabaseClient
    .from('announcement_reads')
    .select('announcement_id')
    .eq('member_id', memberId);

  if (error) throw error;
  return new Set((data || []).map(r => r.announcement_id));
}

/**
 * 単一お知らせデータの取得
 */
export async function fetchAnnouncementById(id) {
  const { data, error } = await window.supabaseClient
    .from('announcements')
    .select('*, members:author_id(name)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * 既読登録処理
 */
export async function markAsRead(id, memberId) {
  if (!id || !memberId) return;

  const { error } = await window.supabaseClient
    .from('announcement_reads')
    .insert([{ announcement_id: id, member_id: memberId }]);

  if (error && error.code !== '23505') throw error;
}

/**
 * CREATE（新規投稿）
 */
export async function saveAnnouncement({ title, body, authorId }) {
  const postData = {
    author_id: authorId,
    title,
    content: body,
    is_email_sent: false,
    target_scope: 'all',
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
 * UPDATE（投稿の更新）
 * calendar-service の updateSchedule と呼び出しスタイルを統一
 */
export async function updateAnnouncement(id, { title, body }) {
  const { data, error } = await window.supabaseClient
    .from('announcements')
    .update({
      title,
      content: body
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * DELETE（投稿の削除）
 * calendar-service の deleteSchedule と統一
 */
export async function deleteAnnouncement(id) {
  const { error } = await window.supabaseClient
    .from('announcements')
    .delete()
    .eq('id', id);

  if (error) throw error;
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