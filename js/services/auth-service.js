// js/services/auth-service.js

/**
 * localStorageのユーザー情報を取得
 */
export function getCurrentUser() {
  const userStr = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      console.error('ユーザー情報のパースエラー:', e);
      return null;
    }
  }
  return null;
}

/**
 * 前回ログインした端末の記憶データを取得（簡易ログイン用）
 */
export function getRememberedUser() {
  const userStr = localStorage.getItem('rememberedUser');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
  return null;
}

/**
 * 団員情報を LocalStorage に保存する
 * @param {Object} member - Supabase members テーブルのレコード
 * @returns {Object} 保存されたユーザーオブジェクト
 */
export function saveCurrentUser(member) {
  if (!member || !member.id) {
    console.error('保存しようとしたメンバー情報に id が存在しません:', member);
    return null;
  }

  const currentUserData = {
    id: member.id,
    name: member.name,
    email: member.email,
    role: member.role || 'member',
    section: member.section,
    instrument: member.instrument
  };
  sessionStorage.setItem('currentUser', JSON.stringify(currentUserData));
  localStorage.setItem('rememberedUser', JSON.stringify(currentUserData));
  return currentUserData;
}

/**
 * ① DB（membersテーブル）から団員情報を検索・取得する
 * @param {string} email - メールアドレス
 * @returns {Promise<Object>} 団員情報オブジェクト
 */
export async function fetchMemberByEmail(email) {
  if (!email) {
    throw new Error('メールアドレスを入力してください。');
  }
  const cleanEmail = email.trim().toLowerCase();

  const { data: member, error } = await window.supabaseClient
    .from('members')
    .select('*')
    .ilike('email', cleanEmail)
    .maybeSingle();

  if (error) {
    console.error('DB検索エラー:', error);
    throw new Error('データベース接続エラーが発生しました。');
  }
  if (!member) {
    throw new Error('名簿に登録されていないメールアドレスです。');
  }
  return member;
}

/**
 * ② Supabase Auth で 6桁の認証コード（OTP）をメール送信する
 * @param {string} email - メールアドレス
 * @returns {Promise<boolean>} 送信成功フラグ
 */
export async function sendOtpEmail(email) {
  if (!email) {
    throw new Error('メールアドレスを入力してください。');
  }
  const cleanEmail = email.trim().toLowerCase();

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
 * ③ 入力された 6桁コードを検証し、成功時に団員情報を LocalStorage へ保存する
 * @param {string} email - メールアドレス
 * @param {string} code - 6桁認証コード
 * @returns {Promise<Object>} ログインしたユーザーオブジェクト
 */
export async function verifyOtpCode(email, code) {
  if (!email || !code) {
    throw new Error('メールアドレスと認証コードを入力してください。');
  }

  const cleanEmail = email.trim().toLowerCase();

  //1.supabase Auth で OTP コードを検証
  const { error } = await window.supabaseClient.auth.verifyOtp({
    email: cleanEmail,
    token: code,
    type: 'email'
  });
  if (error) {
    console.error('OTP検証エラー:', error);
    throw new Error('認証コードが正しくないか、期限切れです。');
  } 

  //2.照合成功後、members テーブルから詳細な団員情報を取得
  const member = await fetchMemberByEmail(cleanEmail);

  //3.ログインユーザー情報を LocalStorage に保存
  return saveCurrentUser(member);
}

/**
 * 簡易ログアウト（画面上は未ログイン状態に戻すが、
 * 端末記憶と Supabase セッションは保持する）
 */
export function logoutSession() {
  sessionStorage.removeItem('currentUser');
  localStorage.removeItem('currentUser'); // アクティブユーザー状態を解除（rememberedUser は保持）
} 

/**
 * 完全ログアウト（端末の保存情報・Supabaseセッションを全消去）
 */
export async function logoutCompletely() {
  sessionStorage.removeItem('currentUser');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('rememberedUser');
  
  if (window.supabaseClient?.auth) {
    try {
      await window.supabaseClient.auth.signOut();
    } catch (error) {
      console.error('完全ログアウトエラー:', error);
    }
  }
}

/**
 * 💡 開発環境用：パスワード認証でSupabaseの正規セッションを自動発行する
 */
export async function loginForDev() {
  if (!window.DEV_AUTO_LOGIN || !window.DEV_AUTH_CREDENTIALS) return null;

  const { data, error } = await window.supabaseClient.auth.signInWithPassword({
    email: window.DEV_AUTH_CREDENTIALS.email,
    password: window.DEV_AUTH_CREDENTIALS.password,
  });

  if (error) {
    console.error('開発用自動ログイン（Supabase Auth）に失敗しました:', error);
    return null;
  }

  return data.session;
}