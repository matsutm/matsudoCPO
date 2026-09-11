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
  if (!email) {
    throw new Error('メールアドレスを入力してください。');
  }

  // 変数宣言: cleanEmail
  const cleanEmail = email.trim().toLowerCase();

  // ① 団員名簿（membersテーブル）に存在するか検索
  const { data: member, error: memberError } = await window.supabaseClient
    .from('members')
    .select('*')
    .ilike('email', cleanEmail)
    .maybeSingle();

  if (memberError) {
    console.error('DB検索エラー:', memberError);
    throw new Error('データベース接続エラーが発生しました。');
  }

  if (!member) {
    throw new Error('名簿に登録されていないメールアドレスです。');
  }

  // ② Supabase Auth で OTP メール送信
  const { error } = await window.supabaseClient.auth.signInWithOtp({
    email: cleanEmail,
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
  if (!email || !code) {
    throw new Error('メールアドレスと認証コードを入力してください。');
  }

  const cleanEmail = email.trim().toLowerCase();

  // ① コード照合
  const { data, error } = await window.supabaseClient.auth.verifyOtp({
    email: cleanEmail,
    token: code,
    type: 'email'
  });

  if (error) {
    console.error('OTP検証エラー:', error);
    throw new Error('認証コードが正しくないか、期限切れです。');
  }

  // ② 照合成功後、members テーブルから詳細な団員情報を取得
  const { data: member, error: memberError } = await window.supabaseClient
    .from('members')
    .select('*')
    .ilike('email', cleanEmail)
    .maybeSingle();

  if (memberError || !member) {
    console.error('団員データ取得失敗:', memberError);
    throw new Error('認証は成功しましたが、団員名簿データの取得に失敗しました。');
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