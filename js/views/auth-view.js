// js/views/auth-view.js

import { 
  getCurrentUser, 
  getRememberedUser,
  fetchMemberByEmail, 
  sendOtpEmail, 
  saveCurrentUser, 
  verifyOtpCode,
  logoutCompletely 
} from '../services/auth-service.js';

let targetEmail = '';

export function renderAuthView() {
  return `
    <div class="auth-container">
      <div class="auth-card">
        <h2>松戸シティフィル ポータル</h2>
        <p class="auth-subtitle">団員確認</p>

        <!-- ステップ1: メールアドレス入力 -->
        <form id="auth-email-form" class="auth-form">
          <div class="form-group">
            <label for="auth-email">名簿登録メールアドレス</label>
            <input type="email" id="auth-email" placeholder="example@matsudo-cityphil.jp" required />
         </div>
          <button type="submit" class="btn-primary btn-block" id="btn-send-otp">認証コードを送信</button>
        </form>

        <!-- ステップ2: 6桁コード入力 -->
        <form id="auth-otp-form" class="auth-form" style="display: none;">
          <p class="otp-notice">
            <strong id="sent-email-label"></strong> 宛に届いた<br>6桁の認証コードを入力してください。
          </p>
          <div class="form-group">
            <input type="text" id="auth-otp-code" placeholder="123456" maxlength="6" pattern="[0-9]{6}" required />
          </div>
          <button type="submit" class="btn-primary btn-block" id="btn-verify-otp">確定してログイン</button>
          <button type="button" class="btn-link" id="btn-back-step">メールアドレスをやり直す</button>
        </form>

        <p id="auth-error-msg" class="auth-error" style="display: none;"></p>
      </div>
    </div>
  `;
}

export function initAuthView(onSuccess) {
  const emailForm = document.getElementById('auth-email-form');
  const otpForm = document.getElementById('auth-otp-form');
  const errorMsg = document.getElementById('auth-error-msg');
  const backBtn = document.getElementById('btn-back-step');

  const toggleError = (msg = '') => {
    errorMsg.textContent = msg;
    errorMsg.style.display = msg ? 'block' : 'none';
  };

  // --- ステップ1: メールアドレス入力 & 判定 ---
  emailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    toggleError();

    const inputEmail = document.getElementById('auth-email').value.trim().toLowerCase();
    const btn = document.getElementById('btn-send-otp');
    
    // Supabaseの有効なセッション ＆ ローカル記憶を取得
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    const rememberedUser = getRememberedUser();
    
    console.log('--- 認証処理開始 ---');
    console.log('入力されたEmail:', inputEmail);
    console.log('取得されたrememberedUser:', rememberedUser);

    // ★ パターンA：端末に正規セッションとユーザー情報が残っている場合
    if (session && rememberedUser) {
      if (rememberedUser.email.toLowerCase() === inputEmail) {
      // ① セッションのユーザー情報と入力メールアドレスが一致する場合は、OTP送信をスキップして自動ログイン
        saveCurrentUser(rememberedUser);
        alert(`おかえりなさい、${rememberedUser.name} さん！`);
        onSuccess?.(rememberedUser);
        return;
      } else {
        // メアド不一致：アカウント切り替えの確認
        const confirmSwitch = confirm(
          '前回と異なるメールアドレスです。\n初回ログイン（認証コード送信）へ進みますか？'
        );
        if (confirmSwitch) {
          await logoutCompletely(); // 端末のセッションと記憶を削除
          alert('前回のセッションを終了しました。新しいメールアドレスでログインしてください。');
          // その後、OTP送信処理に進む
        } else {
          return; // ユーザーがキャンセルした場合は処理を中断（なにもしない）
        }
      }
    }

    // ★ パターンB：端末にセッションがない、または初回アクセスの場合
    btn.disabled = true;
    btn.textContent = '送信中...';

    try {
      const member = await fetchMemberByEmail(inputEmail);
      
      // ② DEV_AUTO_LOGINが有効な場合
      if (window.DEV_AUTO_LOGIN) {
        const user = saveCurrentUser(member);
        alert(`認証が完了しました。ようこそ、${user.name} さん！`);
        onSuccess?.(user);
        return;
      }

      // ③ OTP送信
      await sendOtpEmail(member.email);
      targetEmail = member.email;
      emailForm.style.display = 'none';
      otpForm.style.display = 'block';
      document.getElementById('sent-email-label').textContent = member.email;
    } catch (err) {
      toggleError(err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = '認証コードを送信';
    }
  });

  // --- ステップ2: 6桁コード検証 ---
  otpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    toggleError();

    const code = document.getElementById('auth-otp-code').value.trim();
    const btn = document.getElementById('btn-verify-otp');

    btn.disabled = true;
    btn.textContent = '照合中...';

    try {
      // ④ OTPコード検証
      const user = await verifyOtpCode(targetEmail, code);
      alert(`認証が完了しました。ようこそ、${user.name} さん！`);
      onSuccess?.(user);
    } catch (err) {
      toggleError(err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = '確定してログイン';
    }
  });

  // やり直しボタン
  backBtn.addEventListener('click', () => {
    toggleError();
    otpForm.style.display = 'none';
    emailForm.style.display = 'block';
  });
} 
