// js/components/calendar-modal.js
import { fetchScheduleById, createSchedule, updateSchedule, deleteSchedule } from '../services/calendar-service.js';
import { openModal } from './modal.js';
import { renderMapButton } from './map-button.js';
import { confirmAndRun } from '../utils/action-utils.js';

export async function openCalendarModal({ mode, scheduleId = null, onSaved }) {
  // 1. データ取得（CREATE以外はIDから一括取得に一本化）
  const scheduleData = (mode !== 'CREATE' && scheduleId) 
    ? await fetchScheduleById(scheduleId) 
    : {};

  const isEdit = mode === 'EDIT';
  const isView = mode === 'VIEW';

  // 2. アクション定義
  const actions = isView ? [
    { label: '編集', type: 'primary', onClick: () => openCalendarModal({ mode: 'EDIT', scheduleId, onSaved }) },
    { label: '複製', type: 'secondary', onClick: () => openCalendarModal({ mode: 'DUPLICATE', scheduleId, onSaved }) },
    { label: '削除', type: 'danger', onClick: async () => {
        const result = await confirmAndRun('この予定を削除しますか？', () => deleteSchedule(scheduleId), '削除しました');
        if (result === false) return false; // ユーザーがキャンセルした場合はモーダルを閉じない
        onSaved?.();
      }
    },
    { label: '閉じる', type: 'secondary' }
  ] : [
    { label: isEdit ? '保存' : '追加', type: 'primary', onClick: async () => {
        const data = collectFormData();
        const action = isEdit ? () => updateSchedule(scheduleId, data) : () => createSchedule(data);
        const result = await confirmAndRun(isEdit ? '保存しますか？' : '追加しますか？', action, isEdit ? '保存しました' : '追加しました');
        if (result === false) return false; // ユーザーがキャンセルした場合はモーダルを閉じない
        onSaved?.();
      }
    },
    { label: 'キャンセル', type: 'secondary' }
  ];

  // 3. 描画
  openModal({
    title: { CREATE: '予定の新規追加', EDIT: '予定の編集', DUPLICATE: '予定の複製追加', VIEW: '予定の詳細' }[mode],
    content: isView ? renderViewContent(scheduleData) : renderFormContent(scheduleData),
    actions
  });
}

// 1. ビュー用のコンテンツ描画
function renderViewContent(data = {}) {
  const startTime = data.start_time?.slice(0, 5) || '18:00';
  const endTime = data.end_time?.slice(0, 5) || '21:00';
  const timeRange = startTime ? `${startTime} ～ ${endTime}` : '時間未定';
  const notesFormatted = data.program_notes ? data.program_notes.replace(/\n/g, '<br>') : 'なし';

  console.log('renderViewContent data:', data);

  return `
    <div class="form-group">
      <label>日付</label>
      <div class="detail-text">📅 ${data.date || ''} (${timeRange})</div>
    </div>

    <div class="form-group">
      <label for="location">場所</label>
      <div class="detail-text">📍 ${data.location || '未定'}</div>
    </div>

    <!--locationInput(disabled)}-->

    <!-- VIEWモードでもGoogleマップボタンは押せるようにする -->
    ${renderMapButton(data.location || '')}

    <div class="form-group">
      <label>指導</label>
      <div class="detail-text">👤 ${data.instructor || 'なし'}</div>
    </div>

    <div class="form-group">
      <label>内容・曲目</label>
      <div class="detail-text" style="white-space: pre-wrap; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">${notesFormatted || 'なし'}</div>
    </div>
  `;
}

// EDIT/CREATE用のフォーム描画
function renderFormContent(data = {}) {
  const startTime = data.start_time?.slice(0, 5) || '18:00';
  const endTime = data.end_time?.slice(0, 5) || '21:00';
  return `
  <div class="form-group">
      <label for="date">日付 *</label>
      <input id="date" type="date" class="form-control" value="${data.date || ''}">
    </div>

    <div class="form-row">
      <div class="form-group flex-1">
        <label for="start_time">開始時間 *</label>
        <input id="start_time" type="time" class="form-control" value="${startTime}">
      </div>
      <div class="form-group flex-1">
        <label for="end_time">終了時間 *</label>
        <input id="end_time" type="time" class="form-control" value="${endTime}">
      </div>
    </div>

    <div class="form-group">
      <label for="location">場所 *</label>
      <input id="location" type="text" class="form-control" list="location-list" value="${data.location || ''}">
      <datalist id="location-list">
        <option value="森のホール21 リハ室">
        <option value="流山エルズ（生涯学習センター）">
        <option value="きらりホール">
        <option value="けやきプラザ（我孫子市）">
      </datalist>
    </div>

    <div class="form-group">
      <label for="instructor">指導</label>
      <input id="instructor" type="text" class="form-control" value="${data.instructor || ''}">
    </div>

    <div class="form-group">
      <label for="program_notes">内容・曲目</label>
      <textarea id="program_notes" class="form-control" rows="3">${data.program_notes || ''}</textarea>
    </div>
  `;
}

/**
 * function renderForm(data = {}, isView = false) {
  const readonly = isView ? 'readonly' : '';
  const startTime = data.start_time?.slice(0, 5) || '18:00';
  const endTime = data.end_time?.slice(0, 5) || '21:00';

  return `
    <div class="form-group">
      <label for="date">日付 *</label>
      <input id="date" type="date" class="form-control" value="${data.date || ''}" ${readonly}>
    </div>

    <div class="form-row">
      <div class="form-group flex-1">
        <label for="start_time">開始時間 *</label>
        <input id="start_time" type="time" class="form-control" value="${startTime}" ${readonly}>
      </div>
      <div class="form-group flex-1">
        <label for="end_time">終了時間 *</label>
        <input id="end_time" type="time" class="form-control" value="${endTime}" ${readonly}>
      </div>
    </div>

    <div class="form-group">
      <label for="location">場所 *</label>
      <input id="location" type="text" class="form-control" list="location-list" value="${data.location || ''}" ${readonly}>
      <datalist id="location-list">
        <option value="森のホール21 リハ室">
        <option value="流山エルズ（生涯学習センター）">
        <option value="きらりホール">
        <option value="けやきプラザ（我孫子市）">
      </datalist>
    </div>

    ${renderMapButton(data.location)}

    <div class="form-group">
      <label for="instructor">指導</label>
      <input id="instructor" type="text" class="form-control" value="${data.instructor || ''}" ${readonly}>
    </div>

    <div class="form-group">
      <label for="program_notes">内容・曲目</label>
      <textarea id="program_notes" class="form-control" rows="3" ${readonly}>${data.program_notes || ''}</textarea>
    </div>
  `;
}
**/

function collectFormData() {
  return {
    date: document.getElementById('date').value,
    start_time: document.getElementById('start_time').value,
    end_time: document.getElementById('end_time').value,
    location: document.getElementById('location').value,
    instructor: document.getElementById('instructor').value,
    program_notes: document.getElementById('program_notes').value
  };
}