// js/services/email-service.js

/**
 * 掲示板投稿時の同時メール通知送信
 */
export async function sendBulletinEmail({ title, content, targetScope, targetValue }) {
  try {
    // 1. 送信対象の団員メールアドレスを取得
    let query = window.supabaseClient.from('members').select('email');

    if (targetScope === 'section' && targetValue) {
      query = query.eq('section', targetValue);
    } else if (targetScope === 'instrument' && targetValue) {
      query = query.eq('instrument', targetValue);
    }

    const { data: members, error } = await query;
    if (error || !members || members.length === 0) {
      console.warn('送信対象の宛先が見つかりませんでした。');
      return;
    }

    const recipientEmails = members.map(m => m.email).filter(Boolean);

    // 2. Supabase Edge Function (send-email) を呼び出す
    const { data, error: funcError } = await window.supabaseClient.functions.invoke('send-email', {
      body: {
        to: recipientEmails,
        subject: `【楽団連絡】${title}`,
        html: `
          <h3>${title}</h3>
          <p style="white-space: pre-wrap;">${content}</p>
          <hr>
          <p><small>※このメールは松戸シティフィル ポータルより自動送信されています。</small></p>
        `
      }
    });

    if (funcError) throw funcError;
    console.log('Resendメール送信成功:', data);

  } catch (err) {
    console.error('メール送信処理でエラーが発生しました:', err);
    throw err;
  }
}