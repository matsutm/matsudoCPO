// js/services/email-service.js
import { buildDeepLink } from '../utils/deep-link.js';
import { escapeHtml } from '../utils.js';

/**
 * 掲示板投稿時の同時メール通知送信
 */
export async function sendBulletinEmail({ announcementId, title, content, targetScope, targetValue, replyToAuthorId = null }) {
  try {
    // 1. 送信対象の団員メールアドレスを取得
    let query = window.supabaseClient.from('members').select('email').eq('active', true);
    
    // 宛先指定があるのに値が空なら事故防止のため中止
    if (targetScope && targetScope !== 'all' && !targetValue) {
      console.warn('宛先の指定が不完全なため、メールを送信しませんでした。');
      return;
    }

    if (targetScope === 'section') {
      query = query.eq('section', targetValue);
    } else if (targetScope === 'instrument') {
      query = query.eq('instrument', targetValue);
    } else if (targetScope === 'position') {
      query = query.contains('positions', [targetValue]);
    } else if (targetScope === 'member') {
      query = query.eq('id', targetValue);
    }

    const { data: members, error } = await query;
    if (error) {
      console.warn('宛先の取得に失敗しました：', error);
      return;
    }

    const recipients = new Set((members || []).map(m => m.email).filter(Boolean));
    
    // 返信なら、発信者には必ず送る
    if (replyToAuthorId) {
      const { data: sender } = await window.supabaseClient
        .from ('members').select('email')
        .eq('id', replyToAuthorId).eq('active', true).maybeSingle();
      if (sender?.email) recipients.add(sender.email);
    }
    
    if (recipients.size === 0) {
      console.warn('送信対象の宛先が見つかりませんでした。');
      return;
    }
    
    const recipientEmails = [...recipients];
    
    // 2. リンク生成
    const link = announcementId ? buildDeepLink('announcement', announcementId) : null;

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