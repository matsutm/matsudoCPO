// Supabase接続設定（ご自身のプロジェクト設定に書き換えてください）
const SUPABASE_URL = 'https://dylrgcsrlqvyjjggbrdb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5bHJnY3NybHF2eWpqZ2dicmRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MTU3MjEsImV4cCI6MjEwNDM5MTcyMX0.a1wHWtVJYIdihnNqd16AtyB0cczwnH0vtEQctQA98rE';

// 全画面共有のSupabaseクライアントインスタンス
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function formatDateToISO(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toISOString();
}