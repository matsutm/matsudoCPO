let calendar;
let currentMode = 'CREATE'; // 'CREATE' | 'VIEW' | 'EDIT'

document.addEventListener('DOMContentLoaded', () => {
  const calendarEl = document.getElementById('calendar');

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: window.innerWidth < 768 ? 'listMonth' : 'dayGridMonth',
    locale: 'ja',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,listMonth'
    },
    buttonText: { today: '今日', month: '月', list: 'リスト' },
    events: fetchSchedules,
    // 予定タップ時 ➔ 閲覧モード（インアクティブ）でフォーム表示
    eventClick: function(info) {
      openModalForView(info.event);
    }
  });

  calendar.render();
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

  const events = schedules.map(item => ({
    id: item.id,
    title: `[${item.location}] ${item.program_notes || '予定'}`,
    start: `${item.date}T${item.start_time}`,
    end: `${item.date}T${item.end_time}`,
    extendedProps: {
      concert_name: item.concert_name,
      location: item.location,
      instructor: item.instructor,
      notes: item.program_notes,
      raw_date: item.date,
      start_time: item.start_time,
      end_time: item.end_time
    }
  }));

  successCallback(events);
}

// --- フォームモード切替・モーダル制御 ---

// 1. 新規登録モード
function openModalForCreate() {
  currentMode = 'CREATE';
  document.getElementById('scheduleForm').reset();
  document.getElementById('event_id').value = '';
  document.getElementById('modalTitle').innerText = '予定の新規追加';
  
  setFormDisabled(false);
  renderMapButton('');
  renderButtons();

  document.getElementById('scheduleModal').classList.add('active');
}

// 2. 閲覧モード（インアクティブ化）
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

  setFormDisabled(true);
  renderMapButton(props.location);
  renderButtons();

  document.getElementById('scheduleModal').classList.add('active');
}

// 3. 編集モードへの変更
function switchToEditMode() {
  currentMode = 'EDIT';
  document.getElementById('modalTitle').innerText = '予定の編集';
  
  setFormDisabled(false);
  renderButtons();
}

// 入力状態（disabled）の制御
function setFormDisabled(disabled) {
  const inputs = document.querySelectorAll('#scheduleForm .form-control');
  inputs.forEach(input => input.disabled = disabled);
}

// Google Mapsボタン描画
function renderMapButton(location) {
  const container = document.getElementById('mapContainer');
  if (location && currentMode === 'VIEW') {
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
    container.innerHTML = `<a href="${mapUrl}" target="_blank" class="btn-map">🗺️ Googleマップで場所を開く</a>`;
  } else {
    container.innerHTML = '';
  }
}

// ボタン群の動的切り替え
function renderButtons() {
  const actions = document.getElementById('modalActions');
  
  if (currentMode === 'CREATE') {
    actions.innerHTML = `
      <button type="button" class="btn-secondary" onclick="closeModal()">キャンセル</button>
      <button type="submit" class="btn-primary">保存する</button>
    `;
  } else if (currentMode === 'VIEW') {
    actions.innerHTML = `
      <button type="button" class="btn-danger" onclick="deleteSchedule()">削除</button>
      <button type="button" class="btn-primary" onclick="switchToEditMode()">編集する</button>
      <button type="button" class="btn-secondary" onclick="closeModal()">閉じる</button>
    `;
  } else if (currentMode === 'EDIT') {
    actions.innerHTML = `
      <button type="button" class="btn-secondary" onclick="closeModal()">キャンセル</button>
      <button type="submit" class="btn-primary">更新する</button>
    `;
  }
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
    const { error } = await supabaseClient.from('schedules').insert([scheduleData]);
    if (error) {
      alert('保存に失敗しました: ' + error.message);
    } else {
      alert('予定を追加しました！');
      closeModal();
      calendar.refetchEvents();
    }
  } else if (currentMode === 'EDIT') {
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