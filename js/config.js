//メール送信機能は本番環境のみで実現する。またはテストで切り替える
window.EMAIL_NOTIFY_ENABLED = false; //本番では必ず true
window.DEV_AUTO_LOGIN = true; // 本番では必ず false


// 固定文字列・URLを window に設定
window.APP_CONSTANTS = {
  // 主要資料リスト
  PRIMARY_LIBRARY_LINKS: [
    { label: '📄 Dolce 最新号 (PDF)', url: 'https://drive.google.com/file/d/1MdsqIbn9jNEDx6eE3jxuCcpVy5lfwzd0/view?usp=drive_link' },
    { label: '🎼 今後の演奏会予定（工事中）', url: 'https://drive.google.com/...' },
    { label: '📋 練習予定表 (全体版)', url: 'https://drive.google.com/file/d/1mZwt0_LkNKzkx1_nlkeRz6ynw5t07KjA/view?usp=drive_link' }
  ],

  // その他資料・名簿リスト
  OTHER_LIBRARY_LINKS: [
    { label: '練習録音', url: 'https://drive.google.com/drive/folders/1kr8D0ddeT-WVKzbKHPhH9f1vzGeSuNhd' },
    { label: '👥 団員名簿 (閲覧専用)（工事中）', url: 'https://docs.google.com/...' },
    { label: '📜 団則・規約 (PDF)', url: 'https://matsudo-cpo.info/member/pdf/mcpo_agreement_20230429.pdf' },
    { label: '📝 休団・退団届フォーム（工事中）', url: 'https://forms.google.com/...' }
  ],

  // SNS・チケットロゴリスト（配列化して一括管理）
  SOCIAL_LINKS: [
    { name: 'X', url: 'https://x.com/Matsudocityphil', img: './X-logo.png', class: 'x-img' },
    { name: 'Instagram', url: 'https://www.instagram.com/matsudo_city_orchestra/', img: './Instagram_logo.png', class: 'instagram-img' },
    { name: 'Facebook', url: 'https://www.facebook.com/profile.php?id=100092686631174', img: './Facebook_logo.png', class: 'facebook-img' },
    { name: 'teket', url: 'https://teket.jp/events?word=%E6%9D%BE%E6%88%B8%E3%82%B7%E3%83%86%E3%82%A3%E3%83%95%E3%82%A3%E3%83%AB&category=&region=&event_date_from=&event_date_to=', img: './teket-logo-h.png', class: 'teket-img' }
  ]
};


// テストユーザID
//const DEV_TEST_USER_ID = '320e7ac5-a3e7-4241-94d8-619ad4b1e9f3';
const DEV_TEST_USER_ID = '182409af-df6e-4220-a3c7-64553e0842f7';
// Supabase接続設定
const SUPABASE_URL = 'https://dylrgcsrlqvyjjggbrdb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5bHJnY3NybHF2eWpqZ2dicmRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MTU3MjEsImV4cCI6MjEwNDM5MTcyMX0.a1wHWtVJYIdihnNqd16AtyB0cczwnH0vtEQctQA98rE';

// 全画面共有のSupabaseクライアントインスタンス
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: window.localStorage, // Supabase AuthのセッションをlocalStorageに保存
    persistSession: true, // セッションをsessionStorageに保存
    autoRefreshToken: true, // トークンの自動更新をsessionStorageに保存
  }
});

function formatDateToISO(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toISOString();
}

