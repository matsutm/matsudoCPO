import { fetchJapaneseHolidays } from '../components/holidays.js';
import { createTooltipText, attachTooltip } from '../components/tooltip.js';
import { setFormDisabled, renderMapButton, renderModalActions } from '../components/modal.js';

let calendar;
let currentMode = 'CREATE';

// 💡 外部（main.jsなど）から呼び出してカレンダーを初期化・起動する関数
export async function initCalendar() {
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
      { events: fetchSchedules },
      { events: holidayEvents }
    ],
    eventDidMount: attachTooltip,
    eventClick: function(info) {
      if (info.event.id) {
        openModalForView(info.event);
      }
    }
  });

  calendar.render();

  document.getElementById('btnOpenCreateModal')?.addEventListener('click', openModalForCreate);
  document.getElementById('scheduleForm')?.addEventListener('submit', handleFormSubmit);
}

// Supabaseからデータ取得
async function fetchSchedules(fetchInfo, successCallback, failureCallback) {
  const { data: schedules, error } = await supabaseClient
    .from('schedules')
    .select('*');

  if (error) {
    console.error('スケジュール取得失敗:', error);
    failureCallback(error);
    return;
  }

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
}

// --- モーダル・CRUD処理（前と同じ） ---
function openModalForCreate() {
  currentMode = 'CREATE';
  document.getElementById('scheduleForm').reset();
  document.getElementById('event_id').value = '';
  document.getElementById('modalTitle').innerText = '予定の新規追加';
  setFormDisabled('#scheduleForm', false);
  renderMapButton('mapContainer', '', false);
  updateModalActions();
  document.getElementById('scheduleModal').classList.add('active');
}

function openModalForView(event) {
  currentMode = 'VIEW';
  const props = event.extendedProps;
  document.getElementById('event_id').value = event.id;
  document.getElementById('date').value = props.raw_date;
  document.getElementById('start_time').value = props.start_time ? props.start_time.slice(0, 5) : '13:00';
  document.getElementById('end_time').value = props.end_time ? props.end_time.slice(0, 5) : '17:00';
  document.getElementById('location').value = props.location || '';
  document.getElementById('instructor').value = props.instructor || '';
  document.getElementById('program_notes').value = props.notes || '';
  document.getElementById('modalTitle').innerText = '予定の詳細';
  setFormDisabled('#scheduleForm', true);
  renderMapButton('mapContainer', props.location, true);
  updateModalActions();
  document.getElementById('scheduleModal').classList.add('active');
}

function switchToEditMode() {
  currentMode = 'EDIT';
  document.getElementById('modalTitle').innerText = '予定の編集';
  setFormDisabled('#scheduleForm', false);
  renderMapButton('mapContainer', '', false);
  updateModalActions();
}

function duplicateSchedule() {
  currentMode = 'CREATE';
  document.getElementById('event_id').value = ''; 
  document.getElementById('modalTitle').innerText = '予定の複製追加';
  setFormDisabled('#scheduleForm', false);
  renderMapButton('mapContainer', '', false);
  updateModalActions();
  document.getElementById('date').focus();
}

function updateModalActions() {
  renderModalActions('modalActions', currentMode, {
    onClose: closeModal,
    onEdit: switchToEditMode,
    onDelete: deleteSchedule,
    onDuplicate: duplicateSchedule
  });
}

function closeModal() {
  document.getElementById('scheduleModal').classList.remove('active');
  document.getElementById('scheduleForm').reset();
}

async function handleFormSubmit(event) {
  event.preventDefault();
  const id = document.getElementById('event_id').value;
  const scheduleData = {
    date: document.getElementById('date').value,
    start_time: document.getElementById('start_time').value,
    end_time: document.getElementById('end_time').value,
    location: document.getElementById('location').value,
    instructor: document.getElementById('instructor').value,
    program_notes: document.getElementById('program_notes').value
  };

  if (currentMode === 'CREATE') {
    if (!confirm('この内容で予定を追加しますか？')) return;
    const { error } = await supabaseClient.from('schedules').insert([scheduleData]);
    if (error) {
      alert('保存に失敗しました: ' + error.message);
    } else {
      alert('予定を追加しました！');
      closeModal();
      calendar.refetchEvents();
    }
  } else if (currentMode === 'EDIT') {
    if (!confirm('変更内容を保存（更新）しますか？')) return;
    const { error } = await supabaseClient.from('schedules').update(scheduleData).eq('id', id);
    if (error) {
      alert('更新に失敗しました: ' + error.message);
    } else {
      alert('予定を更新しました！');
      closeModal();
      calendar.refetchEvents();
    }
  }
}

async function deleteSchedule() {
  const id = document.getElementById('event_id').value;
  if (!id) return;
  if (confirm('この予定を削除してもよろしいですか？')) {
    const { error } = await supabaseClient.from('schedules').delete().eq('id', id);
    if (error) {
      alert('削除に失敗しました: ' + error.message);
    } else {
      alert('予定を削除しました。');
      closeModal();
      calendar.refetchEvents();
    }
  }
}