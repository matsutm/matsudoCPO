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

    btn.addEventListener('click', () => {
      if (action.onClick) {
        try {
          await action.onClick();
          overlay.remove(); // 成功した時だけ消す
        } catch (err) {
          // キャンセルやエラーの時はモーダルを開いたままにする
        }
      } else {
        overlay.remove(); // 単なる「閉じる」ボタンの時
      }
    });
 
    actionsEl.appendChild(btn);

  });

  box.appendChild(actionsEl);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}
