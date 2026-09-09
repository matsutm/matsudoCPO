/**
 * モーダル表示・状態管理の共通部品
 */
export function setFormDisabled(formSelector, disabled) {
  const inputs = document.querySelectorAll(`${formSelector} .form-control`);
  inputs.forEach(input => input.disabled = disabled);
}

export function renderMapButton(containerId, location, isViewMode) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (location && isViewMode) {
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
    container.innerHTML = `<a href="${mapUrl}" target="_blank" class="btn-map">🗺️ Googleマップで場所を開く</a>`;
  } else {
    container.innerHTML = '';
  }
}

export function renderModalActions(actionsId, mode, handlers) {
  const actions = document.getElementById(actionsId);
  if (!actions) return;

  if (mode === 'CREATE') {
    actions.innerHTML = `
      <button type="button" class="btn-secondary" id="btnCancel">キャンセル</button>
      <button type="submit" class="btn-primary">保存する</button>
    `;
    document.getElementById('btnCancel').addEventListener('click', handlers.onClose);
  } else if (mode === 'VIEW') {
    actions.innerHTML = `
      <button type="button" class="btn-danger" id="btnDelete">削除</button>
      <button type="button" class="btn-secondary" id="btnDuplicate">📋 複製</button>
      <button type="button" class="btn-primary" id="btnEdit">編集する</button>
      <button type="button" class="btn-secondary" id="btnClose">閉じる</button>
    `;
    document.getElementById('btnDelete').addEventListener('click', handlers.onDelete);
    document.getElementById('btnDuplicate').addEventListener('click', handlers.onDuplicate); // 複製イベント
    document.getElementById('btnEdit').addEventListener('click', handlers.onEdit);
    document.getElementById('btnClose').addEventListener('click', handlers.onClose);
  } else if (mode === 'EDIT') {
    actions.innerHTML = `
      <button type="button" class="btn-secondary" id="btnCancel">キャンセル</button>
      <button type="submit" class="btn-primary">更新する</button>
    `;
    document.getElementById('btnCancel').addEventListener('click', handlers.onClose);
  }
}