// js/views/calendar-view.js

import { fetchJapaneseHolidays } from '../components/holidays.js';
import { createTooltipText, attachTooltip } from '../components/tooltip.js';
import { openCalendarModal } from '../components/calendar-modal.js';
import { fetchSchedulesData } from '../services/calendar-service.js';

let calendar;

export function renderCalendarView() {
  return `
    <div class="calendar-container">
      <div style="margin-bottom: 12px; text-align: right;">
        <button id="btnOpenCreateModal" class="btn-primary">＋ 予定を追加</button>
      </div>
      
      <!-- カレンダー本体 -->
      <div id="calendar"></div>
    </div>
  `;
}

export async function initCalendarView() {
  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) return;

  const holidayEvents = await fetchJapaneseHolidays();

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: window.innerWidth < 768 ? 'listMonth' : 'dayGridMonth',
    locale: 'ja',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,listMonth'
    },
    buttonText: { today: '今日', month: '月', list: 'リスト' },
    displayEventTime: false,
    eventSources: [
      { events: fetchSchedulesForCalendar },
      { events: holidayEvents }
    ],
    eventDidMount: attachTooltip,
    eventClick: function(info) {
      if (info.event.id) {
        openCalendarModal('VIEW', info.event, () => calendar.refetchEvents());
      }
    }
  });

  calendar.render();

  // 新規追加ボタンイベント
  document.getElementById('btnOpenCreateModal')?.addEventListener('click', () => {
    openCalendarModal('CREATE', null, () => calendar.refetchEvents());
  });
}

// FullCalendar用のイベント取得ブリッジ
async function fetchSchedulesForCalendar(fetchInfo, successCallback, failureCallback) {
  try {
    const schedules = await fetchSchedulesData();

    const events = schedules.map(item => {
      const startTime = item.start_time ? item.start_time.slice(0, 5) : '';
      const endTime = item.end_time ? item.end_time.slice(0, 5) : '';
      const timeRange = startTime ? `${startTime}〜${endTime}` : '';

      return {
        id: item.id,
        title: `${timeRange} ${item.location || ''}`.trim(),
        start: `${item.date}T${item.start_time}`,
        end: `${item.date}T${item.end_time}`,
        extendedProps: {
          location: item.location,
          instructor: item.instructor,
          notes: item.program_notes,
          raw_date: item.date,
          start_time: item.start_time,
          end_time: item.end_time,
          tooltipText: createTooltipText(item)
        }
      };
    });

    successCallback(events);
  } catch (err) {
    console.error('スケジュール取得失敗:', err);
    failureCallback(err);
  }
}