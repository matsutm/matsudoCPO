// js/services/announcement-service.js
import { deleteAttachmentFile } from './attachment-service.js';

/**
 * 全掲示の取得
 */
export async function fetchAnnouncements() {
  const { data, error } = await window.supabaseClient
    .from('announcements') // ★ シンプルに全取得
    // ★ author_id をキーにして members テーブルから name を取得
    .select(`*, 
      members:author_id ( name ) 
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase fetchAnnouncements エラー:', error);
    throw error;
  }
  // 取得したデータ整形（author_name プロパティをセットしておく）
  return (data || []).map(post => ({
    ...post,
    author_name: post.members?.name || '不明'
  }));
}

/**
 * ユーザーの既読IDセットの取得
 */
export async function fetchUserReadIds(memberId) {
  if (!memberId) return new Set();

  try {
    const { data, error } = await window.supabaseClient
      .from('announcement_reads')
      .select('announcement_id')
      .eq('member_id', memberId);

    if (error) {
      console.warn('既読取得エラー:', error);
      return new Set();
    }
    return new Set((data || []).map(r => r.announcement_id));
  } catch (err) {
    console.warn('既読取得例外:', err);
    return new Set();
  }
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
  return { ...data, author_name: data.members?.name || '不明' }; // ★author_nameを追加
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
      { onConflict: 'announcement_id,member_id', ignoreDuplicates: true }
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
    attachment_url: announcementData.attachment_url || null,
    attachment_name: announcementData.attachment_name || null,
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
 */
export async function deleteAnnouncement(id) {
  // attachment_url取得
  const { data: existing } = await window.supabaseClient
    .from('announcements')
    .select('attachment_url')
    .eq('id', id)
    .single();

  const { error } = await window.supabaseClient
    .from('announcements')
    .delete()
    .eq('id', id);

  if (error) throw error;

  // urlがあれば、attachmentを削除する
  if (existing?.attachment_url) {
    await deleteAttachmentFile(existing.attachment_url);
  }
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
