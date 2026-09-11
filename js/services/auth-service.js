// js/services/auth-service.js

/**
 * 現在ログイン中のユーザー情報を取得
 */
export function getCurrentUser() {
  const userStr = localStorage.getItem('currentUser');
  return userStr ? JSON.parse(userStr) : null;
}

/**
 * ログアウト処理
 */
export async function logout() {
  localStorage.removeItem('currentUser');
  await window.supabaseClient.auth.signOut();
}

/**
 * 1. 認証コード（OTP）をメール送信する
 */
export async function sendOtpEmail(email) {
  // ① 団員名簿（membersテーブル）に存在するメールアドレスか事前確認
  const { data: member, error: memberError } = await window.supabaseClient
    .from('members')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (memberError || !member) {
    throw new Error('名簿に登録されていないメールアドレスです。');
  }

  // ② Supabase Auth で OTP メール送信
  const { error } = await window.supabaseClient.auth.signInWithOtp({
    email: email,
  });

  if (error) {
    console.error('OTP送信エラー:', error);
    throw new Error('認証コードの送信に失敗しました: ' + error.message);
  }

  return true;
}

/**
 * 2. 入力された6桁コードを検証してログインを完了する
 */
export async function verifyOtpCode(email, code) {
  // ① コード照合
  const { data, error } = await window.supabaseClient.auth.verifyOtp({
    email: email,
    token: code,
    type: 'email'
  });

  if (error) {
    console.error('OTP検証エラー:', error);
    throw new Error('認証コードが正しくないか、期限切れです。');
  }

  // ② 照合成功後、members テーブルから詳細な団員情報（名前や役職）を取得
  const { data: member, error: memberError } = await window.supabaseClient
    .from('members')
    .select('*')
    .eq('email', email)
    .single();

  if (memberError || !member) {
    throw new Error('団員情報の取得に失敗しました。');
  }

  // ③ ログインユーザー情報を LocalStorage に保存
  const currentUserData = {
    id: member.id,
    name: member.name,
    email: member.email,
    role: member.role || 'member',
    section: member.section,
    instrument: member.instrument
  };

  localStorage.setItem('currentUser', JSON.stringify(currentUserData));

  return currentUserData;
}