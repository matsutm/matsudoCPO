// js/main.js

document.addEventListener('DOMContentLoaded', () => {
  // 1. 直近2件の練習予定をホームに読み込む
  loadNextTwoSchedules();

  // 2. ナビゲーションイベントのバインド
  setupNavigation();
});

// 画面切替（表示・非表示の切り替え）
function navigateTo(viewId) {
  // すべての画面セクションを非表示にする
  const sections = document.querySelectorAll('.view-section');
  sections.forEach(section => section.style.display = 'none');

  // 指定された画面だけを表示する
  const targetSection = document.getElementById(viewId);
  if (targetSection) {
    targetSection.style.display = 'block';
  }

  // カレンダー画面を開いた場合、FullCalendarの表示崩れを防ぐ再描画
  if (viewId === 'view-calendar' && window.calendar) {
    window.calendar.updateSize();
  }
}

// イベントリスナーのセットアップ
function setupNavigation() {
  // ロゴクリック ➔ ホームへ
  document.getElementById('navHomeLogo')?.addEventListener('click', () => navigateTo('view-home'));

  // ボタン / メニュークリック ➔ 各画面へ
  document.getElementById('btnGoCalendar')?.addEventListener('click', () => navigateTo('view-calendar'));
  document.getElementById('menuCalendar')?.addEventListener('click', () => navigateTo('view-calendar'));
  
  document.getElementById('menuBulletin')?.addEventListener('click', () => navigateTo('view-bulletin'));
  document.getElementById('menuMembers')?.addEventListener('click', () => navigateTo('view-members'));
}

// ホーム画面用：直近2件のスケジュール取得
async function loadNextTwoSchedules() {
  const container = document.getElementById('nextEventsContainer');
  if (!container) return;

  const today = new Date().toISOString().split('T')[0];

  try {
    const { data: schedules, error } = await supabaseClient
      .from('schedules')
      .select('*')
      .gte('date', today)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(2);

    if (error) throw error;

    if (!schedules || schedules.length === 0) {
      container.innerHTML = '<p class="empty-text">今後の予定はまだ登録されていません。</p>';
      return;
    }

    container.innerHTML = schedules.map((item, index) => {
      const labelText = index === 0 ? '次回の予定' : '次々回の予定';
      const startTime = item.start_time ? item.start_time.slice(0, 5) : '';
      const endTime = item.end_time ? item.end_time.slice(0, 5) : '';
      const timeRange = startTime ? `${startTime}〜${endTime}` : '時間未定';
      
      const mapLink = item.location 
        ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}" target="_blank" class="btn-map-inline">🗺 Googleマップを開く</a>`
        : '';

      return `
        <div class="event-item">
          <span class="event-badge">${labelText}</span>
          <div class="event-date">📅 ${item.date} (${timeRange})</div>
          <div class="event-detail">📍 【場所】${item.location || '未定'}</div>
          ${item.instructor ? `<div class="event-detail">👤 【指導】${item.instructor}</div>` : ''}
          ${mapLink}
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error('直近スケジュール取得エラー:', err);
    container.innerHTML = '<p class="error-text">予定の読み込みに失敗しました。</p>';
  }
}