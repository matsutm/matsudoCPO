export async function initHomeView(navigateTo) {
  await loadNextTwoSchedules();

  // イベントリスナーのセット
  document.getElementById('btnGoCalendar')?.addEventListener('click', () => navigateTo('calendar'));
  document.getElementById('menuCalendar')?.addEventListener('click', () => navigateTo('calendar'));
  document.getElementById('menuBulletin')?.addEventListener('click', () => navigateTo('announcement'));
  document.getElementById('menuMembers')?.addEventListener('click', () => navigateTo('members'));
}