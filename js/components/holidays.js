/**
 * 日本の祝日データを外部APIから取得するコンポーネント
 */
export async function fetchJapaneseHolidays() {
  try {
    const response = await fetch('https://holidays-jp.github.io/api/v1/date.json');
    if (!response.ok) throw new Error('祝日データの取得に失敗しました');
    
    const data = await response.json();
    const holidays = [];

    for (const date in data) {
      holidays.push({
        title: data[date],
        start: date,
        allDay: true,
        display: 'background',
        className: 'holiday-event'
      });
    }
    return holidays;
  } catch (error) {
    console.error('祝日データ取得エラー:', error);
    return [];
  }
}