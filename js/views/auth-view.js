// js/views/auth-view.js

import { 
  getCurrentUser, 
  fetchMemberByEmail, 
  sendOtpEmail, 
  saveCurrentUser, 
  verifyOtpCode 
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

    const email = document.getElementById('auth-email').value.trim().toLowerCase();
    const savedUser = getCurrentUser();

    // 分岐: 2回目以降のログインで、LocalStorageにユーザー情報が残っている
    if (savedUser) {
      // A:  LocalStorageのユーザー情報と入力メールアドレスが一致する場合は、OTP送信をスキップして自動ログイン
      if (savedUser.email.toLowerCase() === email) {
        // LocalStorage から最新のユーザー情報を復元してログイン成功扱いにする
        saveCurrentUser(savedUser);
        alert(`おかえりなさい、${savedUser.name} さん！`);
        onSuccess?.(savedUser);
        return;
      } 

      // B: 入力がlocalstrageと異なる場合は、確認ダイアログを表示して、OTP送信を行うかどうかをユーザーに選択させる
      const proceed = confirm(
        `入力されたメールアドレスは、前回ログイン時のメールアドレスと異なります。\n初回ログイン（認証コード送信）へ進みますか？`
      );
      if (!proceed) {
        toggleError('名簿に登録されたご自身のメールアドレスを入力してください。');
        return;
      }
    }

    // ----------------------------------------------------
    // 分岐②: 初回アクセス（または別アドレス切替）
    // ----------------------------------------------------
    const btn = document.getElementById('btn-send-otp');
    btn.disabled = true;
    btn.textContent = '確認中...';

    try {
      // ① メールアドレスが名簿に登録されているか確認
      const member = await fetchMemberByEmail(email);
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
      btn.textContent = 'ログイン / 認証';

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
