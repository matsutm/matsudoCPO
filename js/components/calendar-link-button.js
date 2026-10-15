// js/components/calendar-link-button.js
import { createTooltipText } from './tooltip.js';

/** 'YYYY-MM-DD' + 'HH:MM(:SS)' → 'YYYYMMDDTHHMMSS'（タイムゾーンなしのローカル時刻表記） */
function toLocalStamp(date, time) {
  const d = (date || '').replace(/-/g, '');
  const t = (time || '00:00').slice(0, 5).replace(':', '') + '00';
  return `${d}T${t}`;
}

function buildTitle(s) {
  return `松戸シティフィル 練習${s.location ? ' @' + s.location : ''}`;
}

function buildDetails(s) {
  // カレンダーのホバー表示・お知らせ連携と同じ文面を再利用
  return createTooltipText(s);
}

/** Googleカレンダー「予定を作成」画面へのURL */
export function buildGoogleCalendarUrl(s) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: buildTitle(s),
    dates: `${toLocalStamp(s.date, s.start_time)}/${toLocalStamp(s.date, s.end_time)}`,
    ctz: 'Asia/Tokyo',
    location: s.location || '',
    details: buildDetails(s)
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** .ics の本文（Apple / Outlook 等向け） */
function buildIcs(s) {
  const esc = (v = '') => String(v)
    .replace(/\\/g, '\\\\').replace(/;/g, '\\;')
    .replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Matsudo City Philharmonic//Portal//JA',
    'BEGIN:VEVENT',
    `UID:${s.id}@matsudo-portal`,
    `DTSTAMP:${now}`,
    `DTSTART;TZID=Asia/Tokyo:${toLocalStamp(s.date, s.start_time)}`,
    `DTEND;TZID=Asia/Tokyo:${toLocalStamp(s.date, s.end_time)}`,
    `SUMMARY:${esc(buildTitle(s))}`,
    `LOCATION:${esc(s.location)}`,
    `DESCRIPTION:${esc(buildDetails(s))}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

/** ボタンHTML（VIEWモード用） */
export function renderCalendarLinkButtons(s) {
  if (!s?.date || !s?.start_time || !s?.end_time) return '';
  return `
    <div class="calendar-link-container">
      <a href="${buildGoogleCalendarUrl(s)}" target="_blank" rel="noopener" class="btn-gcal">
        📅 Googleカレンダーに追加
      </a>
      <button type="button" id="btn-download-ics" class="btn-ics">.ics を保存</button>
    </div>
  `;
}

/** モーダル表示後に1回呼ぶ（.ics ダウンロードのイベント設定） */
export function initCalendarLinkEvents(s) {
  const btn = document.getElementById('btn-download-ics');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const blob = new Blob([buildIcs(s)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `practice-${s.date}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
}