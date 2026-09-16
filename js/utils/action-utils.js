// js/utils/action-utils.js

/**
 * 標準ダイアログで確認を行い、処理を実行したあとに完了メッセージを表示する
 * @param {string} confirmMsg - 確認メッセージ
 * @param {Function} actionFn - 実行する非同期処理
 * @param {string} successMsg - 完了通知メッセージ
 */

export async function confirmAndRun(confirmMsg, actionFn, successMsg) {
  // 1. キャンセル時は例外を投げて後続のモーダル閉じ・onSavedを阻止
  if (!window.confirm(confirmMsg)) {
    throw new Error('USER_CANCELLED');
  }

  try {
    // 2. 処理実行
    await actionFn();

    // 3. 成功通知
    if (successMsg) {
      window.alert(successMsg);
    }
  } catch (err) {
    // キャンセル以外の通信・サーバーエラー処理
    if (err.message !== 'USER_CANCELLED') {
      console.error('処理エラー:', err);
      window.alert(`エラーが発生しました:\n${err.message || '時間を置いて再度お試しください。'}`);
    }
    // エラー時もモーダル閉じを阻止するため再スロー
    throw err;
  }
}