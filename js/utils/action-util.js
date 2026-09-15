// js/utils/action-utils.js

export async function confirmAndRun(message, action, successMessage) {
  if (!confirm(message)) return;

  await action();

  alert(successMessage);
}
