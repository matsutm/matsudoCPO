// js/main.js
import { getCurrentUser, logoutSession, logoutCompletely } from './services/auth-service.js';
import { renderAuthView, initAuthView } from './views/auth-view.js';
import { renderHomeView, initHomeView } from './views/home-view.js';
import { renderCalendarView, initCalendarView } from './views/calendar-view.js';
import { renderAnnouncementView, initAnnouncementView } from './views/announcement-view.js';
import { renderLibraryView, initLibraryView } from './views/library-view.js';
import { openModal, closeModalOnBack, resetModalState } from './components/modal.js'; // openModal をインポート
import { fetchAnnouncementById } from './services/announcement-service.js';
import { openAnnouncementModal } from './components/announcement-modal.js';
import { openCalendarModal } from './components/calendar-modal.js';

const appContent = document.getElementById('app-content');

// "#announcement/123" → { view: 'announcement', param: '123' }
function parseHash() {
  const [view, param] = location.hash.replace('#', '').split('/');
  return { view: view || 'home', param: param || null };
}

// 起動時に踏まれたリンク先。ログイン後に1回だけ使う
let pendingEntry = null;

// ホームボタンで履歴を一番底まで巻き戻している最中かどうか
let resettingToHome = false;

// 画面切り替えの司令塔
export async function navigateTo(viewName, isBrowserBack = false, param = null) {
  //一旦退避　updateLoginUserDisplay();
  const user = getCurrentUser();

  // 未認証の場合はリンク先を保持しつつログイン画面へ
  if (!user) {
    // 初回だけ保持（認証画面の再描画で上書きしない）
    // 'auth' は保持対象から外す（ログアウト後の navigateTo('auth') を除く）
    if (!pendingEntry && (param || (viewName !== 'home' && viewName !== 'auth'))) {
      pendingEntry = { view: viewName, param };
    }
    
    appContent.innerHTML = renderAuthView();
    initAuthView(() => {
      updateLoginUserDisplay();
      const entry = pendingEntry;
      pendingEntry = null; // ★使い切る
      navigateTo(entry?.view || 'home', true, entry?.param || null);
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
      await initCalendarView(navigateTo);
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
  
  // 画面切り替え後は常に最上部へ
  window.scrollTo(0, 0);

  if (!isBrowserBack) {
    // ★ 直前の履歴と違う画面名のときだけ、積む
    if (history.state?.view !== viewName) {
      //history.pushState({ view: viewName }, '', `#${viewName}`);
      history.pushState(
        { view: viewName, depth: (history.state?.depth || 0) + 1 },
        '', `#${viewName}`
      );
    }
  }
  
  // 画面描画のあと、IDがあれば該当モーダルを開く
  if (param) await openDeepLink(viewName, param);
}

/*
 * URLから該当リンクを開く
 */
async function openDeepLink(viewName, id) {
  const user = getCurrentUser();

  // 先にURLからIDを消す（再読込・戻るでモーダルが再度開くのを防ぐ）
  history.replaceState({ ...history.state, view: viewName }, '', `#${viewName}`);

  try {
    if (viewName === 'announcement') {
      const post = await fetchAnnouncementById(Number(id));
      if (!post) {
        alert('このお知らせは見つからないか、閲覧できません。');
        return;
      }
      openAnnouncementModal({
        mode: 'VIEW',
        post,
        currentUserId: user.id,
        onUpdated: () => navigateTo('announcement', true),
        onClosed: () => navigateTo('announcement', true)
      });
    } else if (viewName === 'calendar') {
      openCalendarModal({ mode: 'VIEW', scheduleId: id });
    }
  } catch (err) {
    console.error('リンク先を開けませんでした:', err);
    alert('リンク先を開けませんでした。');
  }
}

//ユーザ名を表示する
function updateLoginUserDisplay() {
  const user = getCurrentUser();
  const elUser = document.getElementById('loginUserDisplay');
  const btnlogout = document.getElementById('btnLogout');

  document.body.dataset.role = window.ROLE_CONTROL_ENABLED
    ? (user?.role || 'member')
    : 'author';
  
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
        <div><strong>【データ残さない】</strong><br>共有PC等で端末の記憶を消去します。次回は6桁認証コードによる認証手続きが必要です。</div>
      </div>
    `,
    actions: [
      {
        label: 'ログアウト',
        type: 'primary',
        onClick: () => {
          showConfirmModal(
            '端末に記憶を残してログアウトします。',
            () => {
              pendingEntry = null;
              logoutSession();
              navigateTo('auth');
            }
          );
        }
      },
      {
        label: 'データ残さない',
        type: 'danger',
        onClick: async () => {
          showConfirmModal(
            '端末の記憶を消去してログアウトします。',
            async () => {
              pendingEntry = null;
              await logoutCompletely();
              navigateTo('auth');
            }
          );
        }
      },
      {
        label: 'キャンセル',
        type: 'secondary'
      }
    ]
  });
}

/**
 * ログアウトの最終確認モーダルを表示するヘルパー関数
 */
function showConfirmModal(confirmMessage, onConfirm) {
  openModal({
    title: 'ログアウトの確認',
    content: `
      <p class="logout-guide-text">
        ${confirmMessage}
      </p>
      <p class="logout-confirm-title">
        本当にログアウトしますか？
      </p>
    `,
    actions: [
      {
        label: 'はい',
        type: 'danger',
        onClick: async () => {
          await onConfirm();
        }
      },
      {
        label: 'いいえ',
        type: 'secondary',
        onClick: () => {
          handleLogout();
        }
      }
    ]
  });
}

// ホームへ戻るときの挙動
function goHomeAndReset() {
  const depth = history.state?.depth || 0;
  if (depth === 0) {
    history.replaceState({ view: 'home', depth: 0 }, '', '#home');
    navigateTo('home', true);
    return;
  }
  resettingToHome = true;
  history.go(-depth);
}


// アプリ起動時の初期化
document.addEventListener('DOMContentLoaded', () => {
  // スクロールでヘッダーを縮める
  const header = document.querySelector('.app-header');
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    // 縮む/戻るしきい値をずらす（ヒステリシス）。ヘッダー高さが変わって
    // スクロール位置が揺れ、ちらつくのを防ぐ
    if (y > 40) header.classList.add('is-scrolled');
    else if (y < 10) header.classList.remove('is-scrolled');
  }, { passive: true });
  
  document.getElementById('navHome')?.addEventListener('click', (e) => { //navigateTo('home'));
    e.preventDefault();
    goHomeAndReset();
  });
  document.getElementById('btnLogout')?.addEventListener('click', handleLogout);

  // ブラウザの「戻る・進む」ボタン操作時のイベント
  window.addEventListener('popstate', (event) => {
    // ★ホームボタンによる巻き戻しが完了したとき
    if (resettingToHome) {
      resettingToHome = false;
      resetModalState();
      document.querySelectorAll('.modal-overlay')?.forEach(o => o.remove());
      history.replaceState({ view: 'home', depth: 0 }, '', '#home');
      navigateTo('home', true);
      return;
    }
    // ★モーダルが開いていた場合は閉じるだけにして、画面遷移は行わない
    if (closeModalOnBack()) return;
    
    const viewName = event.state?.view || 'home';
    navigateTo(viewName, true);
  });

  // URLのハッシュ（例: #announcement）を取得（無ければ 'home'）
  const { view: initialView, param: initialParam } = parseHash();
  // 履歴の状態を初期セット
  history.replaceState({ view: initialView, depth: 0 }, '', `#${initialView}`);
  // URLのハッシュから判定した画面へ遷移させる
  navigateTo(initialView, true, initialParam);

});