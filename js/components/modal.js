// components/modal.js

function closeModal(overlay) {
  overlay.remove();
  if (history.state?.modalOpen) {
    history.replaceState({ ...history.state, modalOpen: false}, '', location.href);
  }
}

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

  history.pushState({ ...history.state, modalOpen: true }, '', location.href);

  actions.forEach(action => {
    const btn = document.createElement('button');
    btn.textContent = action.label;
    btn.className = action.type === 'primary'
      ? 'btn-primary'
      : action.type === 'danger'
      ? 'btn-danger'
      : 'btn-secondary';

    btn.addEventListener('click', async () => {
      if (action.onClick) {
        const result = await action.onClick();
        // 
        if (result !== false) closeModal(overlay);
      } else {
        closeModal(overlay); // 
      }
    });
    actionsEl.appendChild(btn);
  });

  box.appendChild(actionsEl);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

/**
 * 戻るボタン押下時に main.js から呼ぶ。
 * 開いているモーダルをDOMから直接探して閉じる。
 */
export function closeModalOnBack() {
  const overlay = document.querySelector('.modal-overlay');
  if (overlay) {
    overlay.remove();
    return true;
  }
  return false;
}