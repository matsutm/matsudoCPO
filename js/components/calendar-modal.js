// js/components/calendar-modal.js

import { openModal } from './modal.js';
import { renderMapButton } from './map-button.js';
import { createSchedule, updateSchedule, deleteSchedule } from '../services/calendar-service.js';

export function openCalendarModal({ mode, event, onSaved }) {
  const p = event?.extendedProps || {};

  const titles = {
    CREATE: '予定の新規追加',
    EDIT: '予定の編集',
    DUPLICATE: '予定の複製追加',
    VIEW: '予定の詳細'
  };

  const isEdit = mode === 'EDIT';
  const isView = mode === 'VIEW';

  /* ------------------------------
   * VIEW（読み取り専用）
   * ------------------------------ */
  if (isView) {
    openModal({
      title: titles.VIEW,
      content: `
        <div class="detail-meta-text">日付：${p.raw_date}</div>
        <div class="detail-meta-text">時間：${p.start_time}〜${p.end_time}</div>
        <div class="detail-meta-text">場所：${p.location}</div>
        ${renderMapButton(p.location)}
        <div class="detail-meta-text">指導：${p.instructor || ''}</div>
        <div class="detail-meta-text">内容：${p.notes || ''}</div>
      `,
      actions: [
        { label: '編集', type: 'primary', onClick: () => openCalendarModal({ mode: 'EDIT', event, onSaved }) },
        { label: '複製', type: 'secondary', onClick: () => openCalendarModal({ mode: 'DUPLICATE', event, onSaved }) },
        {
          label: '削除',
          type: 'danger',
          onClick: async () => {
            if (!confirm('削除しますか？')) return;
            await deleteSchedule(event.id);
            onSaved?.();
          }
        },
        { label: '閉じる', type: 'secondary' }
      ]
    });
    return;
  }

  /* ------------------------------
   * CREATE / EDIT / DUPLICATE（共通フォーム）
   * ------------------------------ */
  openModal({
    title: titles[mode],
    content: renderForm(p),
    actions: [
      {
        label: isEdit ? '保存' : '追加',
        type: 'primary',
        onClick: async () => {
          const data = collectFormData();
          isEdit ? await updateSchedule(event.id, data) : await createSchedule(data);
          onSaved?.();
        }
      },
      { label: '閉じる', type: 'secondary' }
    ]
  });
}

/* ------------------------------
 * 共通フォーム
 * ------------------------------ */
function renderForm(p) {
  return `
    ${input('date', '日付 *', p.raw_date)}
    <div class="form-row">
      ${input('start_time', '開始時間 *', p.start_time || '18:00')}
      ${input('end_time', '終了時間 *', p.end_time || '21:00')}
    </div>

    ${locationInput(p.location)}

    ${renderMapButton(p.location || '')}

    ${input('instructor', '指導', p.instructor)}
    <div class="form-group">
      <label>内容・曲目</label>
      <textarea id="program_notes" class="form-control" rows="3">${p.notes || ''}</textarea>
    </div>
  `;
}

/* ------------------------------
 * 汎用 input
 * ------------------------------ */
function input(id, label, value = '') {
  const type = id.includes('time') ? 'time' : id === 'date' ? 'date' : 'text';
  return `
    <div class="form-group">
      <label>${label}</label>
      <input id="${id}" type="${type}" class="form-control" value="${value}">
    </div>
  `;
}

/* ------------------------------
 * 場所専用 input（datalist 付き）
 * ------------------------------ */
function locationInput(value = '') {
  return `
    <div class="form-group">
      <label>場所 *</label>
      <input id="location" type="text" class="form-control" list="location-list" value="${value}">
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
