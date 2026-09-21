// js/services/announcement-service.js

/**
 * 全掲示の取得（投稿者情報付き）
 */
export async function fetchAnnouncements() {
  const { data, error } = await window.supabaseClient
    .from('announcements')
    .select('*')
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
    .select('*')
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
    .upsert(
      [{ announcement_id: id, member_id: memberId }],
      { onConflict: 'announcement_id, member_id', ignoreDuplicates: true }
    );

  if (error && error.code !== '23505') throw error;
}

/**
 * CREATE（新規投稿）
 */
export async function createAnnouncement(announcementData) {
  const postData = {
    author_id: announcementData.authorId,
    title: announcementData.title,
    content: announcementData.content,
    is_email_sent: announcementData.isEmailSent || false,
    target_scope: announcementData.targetScope || 'all',
    target_value: announcementData.targetValue || null,
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
export async function updateAnnouncement(id, announcementData) {
  const { data, error } = await window.supabaseClient
    .from('announcements')
    .update(announcementData)
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
  const { error: readError } = await window.supabaseClient
    .from('announcement_reads')
    .delete()
    .eq('announcement_id', id);
  if (readError) throw readError;
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

/**
 * 未読に戻す処理（既読レコードの削除）
 */
export async function markAsUnread(id, memberId) {
  if (!id || !memberId) return;

  const { error } = await window.supabaseClient
    .from('announcement_reads')
    .delete()
    .eq('announcement_id', id)
    .eq('member_id', memberId);

  if (error) throw error;
}
