// js/services/email-service.js
import { buildDeepLink } from '../utils/deep-link.js';
import { escapeHtml } from '../utils.js';

/**
 * 掲示板投稿時の同時メール通知送信
 */
export async function sendBulletinEmail({ announcementId, title, content, targetScope, targetValue }) {
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
    
    // 2. リンク生成
    const link = announcementId ? buildDeepLink('announcement', annoucementId) : null;

    // 3. Supabase Edge Function (resend-email) を呼び出す
    const { data, error: funcError } = await window.supabaseClient.functions.invoke('resend-email', {
      body: {
        to: recipientEmails,
        subject: `【MCPO連絡】${title}`,
        html: `
          <h3>${escapeHtml(title)}</h3>
          <p style="white-space: pre-wrap;">${escapeHtml(content)}</p>
          ${link ? `<p><a href="${link}">▶ ポータルで開く</a></p>` : ''}
          <hr>
          <p><small>
            ※このメールは松戸シティフィル ポータルより自動送信されています。<br>
            ※iPhoneでは、このリンクはSafariで開かれるため、初回のみ認証コードの入力が必要です。
          </small></p>
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