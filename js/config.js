//メール送信機能は本番環境のみで実現する。またはテストで切り替える
const EMAIL_NOTIFY_ENABLED = false; //本番では必ず true
const DEV_AUTO_LOGIN = false; // 本番では必ず false


// 固定文字列・URLを window に設定
window.APP_CONSTANTS = {
  // SNS・チケットサイトURL
  SOCIAL_URLS: {
    X: 'https://x.com/Matsudocityphil',
    INSTAGRAM: 'https://www.instagram.com/matsudo_city_orchestra/',
    FACEBOOK: 'https://www.facebook.com/profile.php?id=100092686631174',
    TEKET: 'https://teket.jp/events?word=%E6%9D%BE%E6%88%B8%E3%82%B7%E3%83%86%E3%82%A3%E3%83%95%E3%82%A3%E3%83%AB&category=&region=&event_date_from=&event_date_to='
  },
  // 主要資料リンク先URL
  LIBRARY_URLS: {
    DOLCE: 'https://drive.google.com/file/d/...',
    CONCERT_PLAN: 'https://drive.google.com/file/d/...',
    PRACTICE_SCHEDULE: 'https://drive.google.com/file/d/...'
  }
};

// テストユーザID
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

