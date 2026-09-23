// js/components/calendar-modal.js
import { fetchScheduleById, createSchedule, updateSchedule, deleteSchedule } from '../services/calendar-service.js';
import { openModal } from './modal.js';
import { renderMapButton } from './map-button.js';
import { confirmAndRun } from '../utils/action-utils.js';
import { createAnnouncement } from '../services/announcement-service.js';
import { getCurrentUser } from '../services/auth-service.js';
import { formatText, formatDateTime } from '../utils.js';

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
        //const action = isEdit ? () => updateSchedule(scheduleId, data) : () => createSchedule(data);
        const isPostToAnnouncement = document.getElementById('sync_announcement')?.checked;
        const action = async () => {
          // カレンダー予定の登録更新
          const savedData = isEdit ? await updateSchedule(scheduleId, data) : await createSchedule(data);
          // チェックボックス有効ならお知らせに登録
          if (!isEdit && isPostToAnnouncement) {
            // Supabaseのユーザー情報を取得
            const newScheduleId = Array.isArray(savedData) ? savedData[0].id : savedData.id;
            await syncToAnnouncement(formData, newScheduleId);
          }
          return savedData;
        };
        
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
    content: isView ? renderForm(scheduleData, true) : renderForm(scheduleData, false),
    actions
  });
}

function renderForm(data = {}, isView = false) {
  const disabled = isView ? 'disabled' : '';
  const startTime = data.start_time?.slice(0, 5) || '18:00';
  const endTime = data.end_time?.slice(0, 5) || '21:00';
  
  return `
    <div class="form-group">
      <label for="date">日付 *</label>
      <input id="date" type="date" class="form-control" value="${data.date || ''}" ${disabled}>
    </div>

    <div class="form-row">
      <div class="form-group flex-1">
        <label for="start_time">開始時間 *</label>
        <input id="start_time" type="time" class="form-control" value="${startTime}" ${disabled}>
      </div>
      <div class="form-group flex-1">
        <label for="end_time">終了時間 *</label>
        <input id="end_time" type="time" class="form-control" value="${endTime}" ${disabled}>
      </div>
    </div>

    <div class="form-group">
      <label for="location">場所 *</label>
      <input id="location" type="text" class="form-control" list="location-list" value="${data.location || ''}" ${disabled}>
      <datalist id="location-list">
        <option value="森のホール21 リハ室">
        <option value="流山エルズ（生涯学習センター）">
        <option value="きらりホール">
        <option value="けやきプラザ（我孫子市）">
      </datalist>
    </div>

    ${renderMapButton(data.location || '')}

    <div class="form-group">
      <label for="instructor">指導</label>
      <input id="instructor" type="text" class="form-control" value="${data.instructor || ''}" ${disabled}>
    </div>

    <div class="form-group">
      <label for="program_notes">内容・曲目</label>
      <textarea id="program_notes" class="form-control" rows="3" ${disabled}>${data.program_notes || ''}</textarea>
    </div>

    ${!isView ? `
      <div class="form-group" style="margin-top": 1rem; padding-top: 0.75rem; border-top: 1px dashed #cbd5e1;">
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: bold; color: #334155;">
          <input type="checkbox" id="sync_announcement" checked style="width: 18px; height: 18px; accent-color: #2563eb;" />
          掲示板・お知らせにも投稿する
        </label>
      </div>
    ` : ''}
  `;
}

function collectFormData() {
  
  return {
    date: document.getElementById('date').value,
    start_time: document.getElementById('start_time').value,
    end_time: document.getElementById('end_time').value,
    location: document.getElementById('location').value,
    instructor: document.getElementById('instructor').value,
    program_notes: formatText(document.getElementById('program_notes').value)
  };
}

/**
 * 独立関数：カレンダー予定をお知らせ（掲示板）へ連携投稿する
 * @param {Object} formData - フォームから取得した予定データ
 * @param {number|string|null} newScheduleId - 作成されたカレンダー予定のID
 */
async function syncToAnnouncement(formData, newScheduleId = null) {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const title = `【スケジュール追加】${formData.date} ${formData.location || ''}`.trim();
  
  // モーダル直呼び出し用リンクの生成（IDがある場合のみ埋め込み）
  const linkHtml = newScheduleId 
    ? `\n\n👉 <a href="#calendar-${newScheduleId}" class="link-calendar-modal" data-schedule-id="${newScheduleId}">カレンダーで詳細を見る</a>` 
    : '';

  const content = `新しい練習スケジュールが追加されました。\n\n` +
    `■ 日時: ${formData.date} ${formData.start_time}〜${formData.end_time}\n` +
    `■ 場所: ${formData.location || '未定'}\n` +
    (formData.instructor ? `■ 指導: ${formData.instructor}\n` : '') +
    (formData.program_notes ? `■ 内容: ${formData.program_notes}\n` : '') +
    linkHtml;

  try {
    await createAnnouncement({
      authorId: currentUser.id,
      title: title,
      content: content,
      targetScope: 'all',
      targetValue: null
    });
  } catch (err) {
    console.error('お知らせ自動連携エラー:', err);
    // カレンダー登録自体は完了しているため、エラーログのみ出力して処理を通す
  }
}