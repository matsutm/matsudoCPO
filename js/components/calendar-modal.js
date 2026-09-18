// js/components/calendar-modal.js

import { openModal } from './modal.js';
import { renderMapButton } from './map-button.js';
import { createSchedule, updateSchedule, deleteSchedule } from '../services/calendar-service.js';
import { confirmAndRun } from '../utils/action-utils.js';

export function openCalendarModal({ mode, event, onSaved }) {
  const p = event?.extendedProps || {};

  // ★ FullCalendar の ID を安全に取得
  const scheduleId = event?.id || p.id;

  const titles = {
    CREATE: '予定の新規追加',
    EDIT: '予定の編集',
    DUPLICATE: '予定の複製追加',
    VIEW: '予定の詳細'
  };

  const isEdit = mode === 'EDIT';
  const isView = mode === 'VIEW';

  // 1. 下部アクションボタンの切り替え
  let actions = [];

  if (isView) {
    // VIEWモード：編集・複製・削除・閉じる
    actions = [
      {
        label: '編集',
        type: 'primary',
        onClick: () => openCalendarModal({ mode: 'EDIT', event, onSaved })
      },
      {
        label: '複製',
        type: 'secondary',
        onClick: () => openCalendarModal({ mode: 'DUPLICATE', event, onSaved })
      },
      {
        label: '削除',
        type: 'danger',
        onClick: async () => {
          await confirmAndRun('この予定を削除しますか？', () => deleteSchedule(event.id), '削除しました');
          onSaved?.();
        }
      },
      { label: '閉じる', type: 'secondary' }
    ];
  } else {
    // CREATE / EDIT / DUPLICATE モード：追加 or 保存・閉じる
    actions = [
      {
        label: isEdit ? '保存' : '追加',
        type: 'primary',
        onClick: async () => {
          const data = collectFormData();
          const action = isEdit ? () => updateSchedule(event.id, data) : () => createSchedule(data);
          const msg = isEdit ? '保存しますか？' : '追加しますか？';
          const successMsg = isEdit ? '保存しました' : '追加しました';

          await confirmAndRun(msg, action, successMsg);
          onSaved?.();
        }
      },
      { label: 'キャンセル', type: 'secondary' }
    ];
  }

  // 2. モーダル表示（フォームを共通利用）
  openModal({
    title: titles[mode],
    content: renderForm(p, isView),
    actions: actions
  });
}

/* ------------------------------
 * 共通フォーム（isView のときは disabled）
 * ------------------------------ */
function renderForm(p, isView = false) {
  const disabled = isView ? 'disabled' : '';

  return `
    <div class="form-group">
      <label for="date">日付 *</label>
      <input id="date" type="date" class="form-control" value="${p.raw_date || ''}" ${disabled}>
    </div>

    <div class="form-row">
      <div class="form-group flex-1">
        <label for="start_time">開始時間 *</label>
        <input id="start_time" type="time" class="form-control" value="${p.start_time || '18:00'}" ${disabled}>
      </div>
      <div class="form-group flex-1">
        <label for="end_time">終了時間 *</label>
        <input id="end_time" type="time" class="form-control" value="${p.end_time || '21:00'}" ${disabled}>
      </div>
    </div>

    ${locationInput(p.location || '', disabled)}

    <!-- VIEWモードでもGoogleマップボタンは押せるようにする -->
    ${renderMapButton(p.location || '')}

    <div class="form-group">
      <label for="instructor">指導</label>
      <input id="instructor" type="text" class="form-control" value="${p.instructor || ''}" ${disabled}>
    </div>

    <div class="form-group">
      <label for="program_notes">内容・曲目</label>
      <textarea id="program_notes" class="form-control" rows="3" ${disabled}>${p.notes || ''}</textarea>
    </div>
  `;
}

/* ------------------------------
 * 場所専用 input（datalist 付き）
 * ------------------------------ */
function locationInput(value = '', disabled = '') {
  return `
    <div class="form-group">
      <label for="location">場所 *</label>
      <input id="location" type="text" class="form-control" list="location-list" value="${value}" ${disabled}>
      <datalist id="location-list">
        <option value="森のホール21 リハ室">
        <option value="流山エルズ（生涯学習センター）">
        <option value="きらりホール">
        <option value="けやきプラザ（我孫子市）">
      </datalist>
    </div>
  `;
}

/* ------------------------------
 * フォームデータ収集
 * ------------------------------ */
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