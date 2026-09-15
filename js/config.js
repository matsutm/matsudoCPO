//メール送信機能は本番環境のみで実現する。またはテストで切り替える
const EMAIL_NOTIFY_ENABLED = false; //本番では必ず true
const DEV_AUTO_LOGIN = false; // 本番では必ず false

const DEV_TEST_USER_ID = '320e7ac5-a3e7-4241-94d8-619ad4b1e9f3';



// Supabase接続設定
const SUPABASE_URL = 'https://dylrgcsrlqvyjjggbrdb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5bHJnY3NybHF2eWpqZ2dicmRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MTU3MjEsImV4cCI6MjEwNDM5MTcyMX0.a1wHWtVJYIdihnNqd16AtyB0cczwnH0vtEQctQA98rE';

// 全画面共有のSupabaseクライアントインスタンス
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function formatDateToISO(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toISOString();
}