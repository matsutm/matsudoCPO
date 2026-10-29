// components/modal.js

let programmaticBack = false;

function closeModal(overlay) {
  overlay.remove();

  // 最後のモーダル閉じたときだけ、積んだエントリを戻す
  if (!document.querySelector('.modal-overlay') && history.state?.modalOpen) {
    programmaticBack = true; //popstate側で「画面遷移しない」判断用
    history.back();
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

  // 最初のモーダルのときだけ履歴を積む（overlay を append する前に判定）
  if (!document.querySelector('.modal-overlay')) {
    history.pushState(
      { ...history.state, depth: (history.state?.depth || 0) + 1, modalOpen: true },
      '', location.href
    );
  }

  actions.forEach(action => {
    const role = document.body.dataset.role;
    if (role === 'member' && ['編集', '複製', '削除'].includes(action.label)) return;
    
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
  return overlay;
}

/**
 * 戻るボタン押下時に main.js から呼ぶ。
 * 開いているモーダルをDOMから直接探して閉じる。
 */
export function closeModalOnBack() {
  // 「閉じる」ボタン由来の back：すでに DOM は消えているので何もしない
  if (programmaticBack) {
    programmaticBack = false;
    return true;
  }
  // 戻るボタン由来：エントリはすでに消えているので、開いているモーダルを全部消す
  const overlays = document.querySelectorAll('.modal-overlay');
  if (overlays.length) {
    overlays.forEach(o => o.remove());
    return true;
  }
  return false;
}

/**
 * ホームボタンによる履歴リセット時に main.js から呼ぶ。
 * フラグが立ったまま残らないようにする。
 */
export function resetModalState() {
  programmaticBack = false;
}