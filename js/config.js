// Supabase接続設定（ご自身のプロジェクト設定に書き換えてください）
const SUPABASE_URL = 'https://dylrgcsrlqvyjjggbrdb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nK0_BPPRQ6q22EJZi_JMSA_WTc85mFr';

// 全画面共有のSupabaseクライアントインスタンス
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 汎用ユーティリティ関数（後々の機能でも利用可能）
function formatDateToISO(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toISOString();
}