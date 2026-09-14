// js/components/calendar-modal.js

import { setFormDisabled, renderMapButton, renderModalActions } from './modal.js';
import { createSchedule, updateSchedule, deleteSchedule } from '../services/calendar-service.js';

let currentMode = 'CREATE';
let onSavedCallback = null;

/**
 * 予定ダイアログ（モーダル）を開く
 * @param {string} mode - 'CREATE' | 'VIEW' | 'EDIT'
 * @param {Object|null} eventData - FullCalendarのイベントオブジェクト
 * @param {Function} onSaved - データの追加・更新・削除完了時のコールバック（再描画用）
 */
export function openCalendarModal(mode = 'CREATE', eventData = null, onSaved = null) {
  currentMode = mode;
  onSavedCallback = onSaved;

  // 既存モーダルの削除（重なり防止）
  document.getElementById('scheduleModal')?.remove();

  const modalHTML = `
    <div id="scheduleModal" class="modal-overlay active">
      <div class="modal-box">
        <h2 id="modalTitle" class="modal-title">予定</h2>
        <form id="scheduleForm">
          <input type="hidden" id="event_id">
          <div class="form-group">
            <label for="date">日付 *</label>
            <input type="date" id="date" class="form-control" required>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label for="start_time">開始時間 *</label>
              <input type="time" id="start_time" class="form-control" value="18:00" required>
            </div>
            <div class="form-group flex-1">
              <label for="end_time">終了時間 *</label>
              <input type="time" id="end_time" class="form-control" value="21:00" required>
            </div>
          </div>
          <div class="form-group">
            <label for="location">場所 *</label>
            <input type="text" id="location" class="form-control" list="location-list" placeholder="会場名を選択または入力" required>
            <datalist id="location-list">
              <option value="森のホール21 リハ室">
              <option value="流山エルズ（生涯学習センター）">
              <option value="きらりホール">
              <option value="けやきプラザ（我孫子市）">
            </datalist>
          </div>
          <div id="mapContainer"></div>
          <div class="form-group">
            <label for="instructor">指導</label>
            <input type="text" id="instructor" class="form-control" placeholder="例: マエストロ〇〇">
          </div>
          <div class="form-group">
            <label for="program_notes">内容・曲目</label>
            <textarea id="program_notes" class="form-control" rows="3" placeholder="例: 前半：ベートーヴェン"></textarea>
          </div>
          <div id="modalActions" class="modal-actions"></div>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // フォームの送信（保存・更新）ハンドラー登録
  const form = document.getElementById('scheduleForm');
  form.addEventListener('submit', handleFormSubmit);

  // 初期モードのセットアップ
  if (currentMode === 'VIEW' && eventData) {
    setupViewMode(eventData);
  } else {
    setupCreateMode();
  }
}

function setupCreateMode() {
  currentMode = 'CREATE';
  document.getElementById('modalTitle').innerText = '予定の新規追加';
  setFormDisabled('#scheduleForm', false);
  renderMapButton('mapContainer', '', false);
  updateModalActions();
}

function setupViewMode(event) {
  currentMode = 'VIEW';
  const props = event.extendedProps || {};
  document.getElementById('event_id').value = event.id || '';
  document.getElementById('date').value = props.raw_date || '';
  document.getElementById('start_time').value = props.start_time ? props.start_time.slice(0, 5) : '18:00';
  document.getElementById('end_time').value = props.end_time ? props.end_time.slice(0, 5) : '21:00';
  document.getElementById('location').value = props.location || '';
  document.getElementById('instructor').value = props.instructor || '';
  document.getElementById('program_notes').value = props.notes || '';
  document.getElementById('modalTitle').innerText = '予定の詳細';

  setFormDisabled('#scheduleForm', true);
  renderMapButton('mapContainer', props.location, true);
  updateModalActions();
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
    onDelete: handleDelete,
    onDuplicate: duplicateSchedule
  });
}

export function closeModal() {
  document.getElementById('scheduleModal')?.remove();
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

  try {
    if (currentMode === 'CREATE') {
      if (!confirm('この内容で予定を追加しますか？')) return;
      await createSchedule(scheduleData);
      alert('予定を追加しました！');
    } else if (currentMode === 'EDIT') {
      if (!confirm('変更内容を保存（更新）しますか？')) return;
      await updateSchedule(id, scheduleData);
      alert('予定を更新しました！');
    }
    closeModal();
    if (typeof onSavedCallback === 'function') onSavedCallback();
  } catch (err) {
    console.error('保存処理エラー:', err);
    alert('操作に失敗しました: ' + (err.message || err));
  }
}

async function handleDelete() {
  const id = document.getElementById('event_id').value;
  if (!id) return;

  if (confirm('この予定を削除してもよろしいですか？')) {
    try {
      await deleteSchedule(id);
      alert('予定を削除しました。');
      closeModal();
      if (typeof onSavedCallback === 'function') onSavedCallback();
    } catch (err) {
      console.error('削除処理エラー:', err);
      alert('削除に失敗しました: ' + (err.message || err));
    }
  }
}