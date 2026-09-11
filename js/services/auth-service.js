import { supabase } from '../config.js';

const STORAGE_KEY = 'matsudo_portal_user';

/**
 * 1. ワンタイムパスコード（6桁）をメール送信
 */
export async function sendOtpEmail(email) {
  // まず members テーブルに登録されているメアドか確認
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id')
    .eq('email', email)
    .single();

  if (memberError || !member) {
    throw new Error('名簿に登録されていないメールアドレスです。管理者にお問合せください。');
  }

  // Supabase Auth の OTP 送信（パスコード形式）
  const { error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      shouldCreateUser: true // 初回認証時にAuthユーザーを作成
    }
  });

  if (error) throw error;
  return true;
}

/**
 * 2. 入力された6桁パスコードを検証＆団員情報の紐付け
 */
export async function verifyOtpCode(email, token) {
  // パスコード照合
  const { data: authData, error: authError } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email'
  });

  if (authError) throw new Error('コードが正しくないか、期限切れです。');

  // members テーブルから詳細属性（名前・パート・役職等）を取得
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id, name, email, section, instrument, role')
    .eq('email', email)
    .single();

  if (memberError || !member) {
    throw new Error('団員情報の取得に失敗しました。');
  }

  // ローカルストレージに団員情報を永続化（2回目以降の自動ログイン用）
  localStorage.setItem(STORAGE_KEY, JSON.stringify(member));

  return member;
}

/**
 * 3. 現在端末に保存されているログインユーザー情報を取得
 */
export function getCurrentUser() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
}

/**
 * 4. ログアウト処理
 */
export async function logout() {
  localStorage.removeItem(STORAGE_KEY);
  await supabase.auth.signOut();
}