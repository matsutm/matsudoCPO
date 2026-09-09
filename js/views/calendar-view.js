import { fetchJapaneseHolidays } from '../components/holidays.js';
import { createTooltipText, attachTooltip } from '../components/tooltip.js';
import { setFormDisabled, renderMapButton, renderModalActions } from '../components/modal.js';

let calendar;
let currentMode = 'CREATE'; // 'CREATE' | 'VIEW' | 'EDIT'

document.addEventListener('DOMContentLoaded', async () => {
  const calendarEl = document.getElementById('calendar');
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
    displayEventTime: false, // 練習予定の「18時」自動表示をオフにしてtitleで綺麗に表示

    // 💡 複数のデータソース（Supabase練習予定 ＋ 日本の祝日）を指定
    eventSources: [
      // 1. Supabaseから取得する練習スケジュール
      { events: fetchSchedules },
      // 2. 日本の祝日データ (Google公式の祝日カレンダー等のAPI)
      { events: holidayEvents }
    ],

    eventDidMount: attachTooltip,

    // 予定タップ時 ➔ 閲覧モード（インアクティブ）でフォーム表示
    eventClick: function(info) {
      // 祝日以外の練習予定クリック時のみモーダルを開く
      if (info.event.id) {
        openModalForView(info.event);
      }
    }
  });

  calendar.render();

  // イベントリスナーの登録
  document.getElementById('btnOpenCreateModal').addEventListener('click', openModalForCreate);
  document.getElementById('scheduleForm').addEventListener('submit', handleFormSubmit);
});

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

// --- フォームモード切替・モーダル制御 ---

// 1. 新規登録モード
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

// 2. 閲覧モード（インアクティブ化）
function openModalForView(event) {
  currentMode = 'VIEW';
  const props = event.extendedProps;

  document.getElementById('event_id').value = event.id;
  document.getElementById('date').value = props.raw_date;
  document.getElementById('start_time').value = props.start_time ? props.start_time.slice(0, 5) : '18:00';
  document.getElementById('end_time').value = props.end_time ? props.end_time.slice(0, 5) : '21:00';
  document.getElementById('location').value = props.location || '';
  document.getElementById('instructor').value = props.instructor || '';
  document.getElementById('program_notes').value = props.notes || '';

  document.getElementById('modalTitle').innerText = '予定の詳細';

  setFormDisabled('#scheduleForm', true);
  renderMapButton('mapContainer', props.location, true);
  updateModalActions();

  document.getElementById('scheduleModal').classList.add('active');
}

// 3. 編集モードへの変更
function switchToEditMode() {
  currentMode = 'EDIT';
  document.getElementById('modalTitle').innerText = '予定の編集';
  
  setFormDisabled('#scheduleForm', false);
  renderMapButton('mapContainer', '', false);
  updateModalActions();
}

// 複製処理ハンドラー
function duplicateSchedule() {
  currentMode = 'CREATE'; // 新規作成モードに変更
  
  // 編集対象のIDを消去（これを消すことでINSERT扱いになります）
  document.getElementById('event_id').value = ''; 
  
  // モーダルタイトル変更
  document.getElementById('modalTitle').innerText = '予定の複製追加';
  
  // 入力欄を編集可能にする
  setFormDisabled('#scheduleForm', false);
  
  // Googleマップボタンは非表示
  renderMapButton('mapContainer', '', false);
  
  // ボタン群をCREATE（保存/キャンセル）用に更新
  updateModalActions();
  
  // 日付入力欄へフォーカスを当てて変更を促す
  document.getElementById('date').focus();
}


function updateModalActions() {
  renderModalActions('modalActions', currentMode, {
    onClose: closeModal,
    onEdit: switchToEditMode,
    onDelete: deleteSchedule,
    onDuplicate: duplicateSchedule // 💡 複製関数を追加
  });
}


function closeModal() {
  document.getElementById('scheduleModal').classList.remove('active');
  document.getElementById('scheduleForm').reset();
}

// 保存・更新（INSERT / UPDATE）
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
    // 1. 新規追加の確認ステップ
    if (!confirm('この内容で予定を追加しますか？')) {
      return; // キャンセルされたら処理を中断
    }

    const { error } = await supabaseClient.from('schedules').insert([scheduleData]);
    if (error) {
      alert('保存に失敗しました: ' + error.message);
    } else {
      alert('予定を追加しました！');
      closeModal();
      calendar.refetchEvents();
    }
  } else if (currentMode === 'EDIT') {
    // 2. 編集更新の確認ステップ
    if (!confirm('変更内容を保存（更新）しますか？')) {
      return; // キャンセルされたら処理を中断
    }

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

// 削除（DELETE）
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