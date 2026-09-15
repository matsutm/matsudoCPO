// components/modal.js

export function openModal({ title, content, actions }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';

  const box = document.createElement('div');
  box.className = 'modal-box';

  // タイトル
  const titleEl = document.createElement('h3');
  titleEl.className = 'modal-title';
  titleEl.textContent = title;
  box.appendChild(titleEl);

  // 内容
  const contentEl = document.createElement('div');
  contentEl.className = 'modal-content';
  contentEl.innerHTML = content;
  box.appendChild(contentEl);

  // ボタン群
  const actionsEl = document.createElement('div');
  actionsEl.className = 'modal-actions';

  actions.forEach(action => {
    const btn = document.createElement('button');
    btn.textContent = action.label;
    btn.className = action.type === 'primary'
      ? 'btn-primary'
      : action.type === 'danger'
      ? 'btn-danger'
      : 'btn-secondary';

    if (action.onClick) {
      btn.addEventListener('click', () => {
        action.onClick();
        document.body.removeChild(overlay);
      });
    } else {
      btn.addEventListener('click', () => {
        document.body.removeChild(overlay);
      });
    }

    actionsEl.appendChild(btn);
  });

  box.appendChild(actionsEl);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}
