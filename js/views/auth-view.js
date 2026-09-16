// js/views/auth-view.js

import { sendOtpEmail, verifyOtpCode, getCurrentUser } from '../services/auth-service.js';

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

    // 1. 2回目以降：メールアドレス一致 ➔ そのままログイン
    if (savedUser && savedUser.email.toLowerCase() === email) {
      alert(`おかえりなさい、${savedUser.name} さん！`);
      onSuccess?.(savedUser);
      return;
    }

    // 2. 2回目以降：メールアドレス不一致 ➔ 2択の confirm で確認
    if (savedUser) {
      const proceed = confirm(
        '入力されたメールアドレスが前回のログイン情報と異なります。\n初回ログイン（認証コード送信）へ進みますか？'
      );
      
      if (!proceed) {
        toggleError('初回ログインが必要です。名簿に登録されたメールアドレスを入力してください。');
        return; // キャンセルされたら処理中断
      }
    }

    // 3. OTPコード送信手続き（初回、または上記確認で OK を押した場合）
    const btn = document.getElementById('btn-send-otp');
    btn.disabled = true;
    btn.textContent = '送信中...';

    try {
      await sendOtpEmail(email);
      targetEmail = email;
      emailForm.style.display = 'none';
      otpForm.style.display = 'block';
      document.getElementById('sent-email-label').textContent = email;
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