// js/main.js
import { getCurrentUser, logoutSession, logoutCompletely } from './services/auth-service.js';
import { renderAuthView, initAuthView } from './views/auth-view.js';
import { renderHomeView, initHomeView } from './views/home-view.js';
import { renderCalendarView, initCalendarView } from './views/calendar-view.js';
import { renderAnnouncementView, initAnnouncementView } from './views/announcement-view.js';
import { renderLibraryView, initLibraryView } from './views/library-view.js';
import { openModal } from './components/modal.js'; // ★ openModal をインポート

const appContent = document.getElementById('app-content');

// 画面切り替えの司令塔
export async function navigateTo(viewName, isBrowserBack = false) {
  //一旦退避　updateLoginUserDisplay();
  const user = getCurrentUser();

  // 未認証の場合は強制的にログイン画面へ
  if (!user) {
    appContent.innerHTML = renderAuthView();
    initAuthView(() => {
      updateLoginUserDisplay();
      navigateTo('home'); 
    });
    updateLoginUserDisplay();
    return; // ここで処理を終了して、以降の画面切り替え処理をスキップ
  }

  updateLoginUserDisplay();

  // ルーティング分岐
  switch (viewName) {
    case 'home':
      appContent.innerHTML = renderHomeView();
      await initHomeView(navigateTo);
      break;

    case 'calendar':
      appContent.innerHTML = renderCalendarView();
      await initCalendarView();
      break;

    case 'announcement':
      appContent.innerHTML = renderAnnouncementView();
      await initAnnouncementView(navigateTo);
      break;

    case 'library':
      appContent.innerHTML = renderLibraryView();
      await initLibraryView(navigateTo);
      break;

    default:
      appContent.innerHTML = renderHomeView();
      await initHomeView(navigateTo);
      break;
  }

  if (!isBrowserBack) {
    history.pushState({ view: viewName }, '', `#${viewName}`);
  }
}


//ユーザ名を表示する
function updateLoginUserDisplay() {
  const user = getCurrentUser();
  const elUser = document.getElementById('loginUserDisplay');
  const btnlogout = document.getElementById('btnLogout');

  if (user) {
    if (elUser) elUser.textContent = `${user.name} さん`;
    if (btnlogout) btnlogout.style.display = 'inline-block';
  } else {
    if (elUser) elUser.textContent = '';
    if (btnlogout) btnlogout.style.display = 'none';
  } 
}

/**
 * 選択式ログアウトモーダルの表示ハンドラー
 */
export function handleLogout() {
  openModal({
    title: 'ログアウト',
    content: `
      <p style="margin-bottom: 12px; font-size: 0.95rem; color: #374151;">
        ログアウト方法を選択してください。
      </p>
      <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.85rem; color: #4b5563;">
        <div><strong>【ログアウト】</strong><br>端末に記憶を残します。次回はメールアドレス入力のみで再ログインできます。</div>
        <div><strong>【データ残さない】</strong><br>共有PC等で端末の記憶を消去します。次回は6桁コード（OTP）からやり直します。</div>
      </div>
    `,
    actions: [
      {
        label: 'ログアウト',
        type: 'primary',
        onClick: () => {
          logoutSession();
          navigateTo('auth');
        }
      },
      {
        label: 'データ残さない',
        type: 'danger',
        onClick: async () => {
          await logoutCompletely(); // ★localStorageを消去
          navigateTo('auth');
        }
      },
      {
        label: 'キャンセル',
        type: 'secondary'
      }
    ]
  });
}

// アプリ起動時の初期化
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('navHome')?.addEventListener('click', () => navigateTo('home'));
  document.getElementById('btnLogout')?.addEventListener('click', handleLogout);

  // ブラウザの「戻る・進む」ボタン操作時のイベント
  window.addEventListener('popstate', (event) => {
    const viewName = event.state?.view || 'home';
    navigateTo(viewName, true);
  });

  // URLのハッシュ（例: #announcement）を取得（無ければ 'home'）
  const initialView = location.hash.replace('#', '') || 'home';
  // 履歴の状態を初期セット
  history.replaceState({ view: initialView }, '', `#${initialView}`);
  // URLのハッシュから判定した画面へ遷移させる
  navigateTo(initialView, true);
});