import { sendOtpEmail, verifyOtpCode } from '../services/auth-service.js';

let currentStep = 'EMAIL'; // 'EMAIL' または 'OTP'
let targetEmail = '';

export function renderAuthView() {
  return `
    <div class="auth-container">
      <div class="auth-card">
        <h2>松戸シティフィル ポータル</h2>
        <p class="auth-subtitle">団員確認（初回のみ）</p>

        <!-- ステップ1: メールアドレス入力 -->
        <form id="auth-email-form" class="auth-form">
          <div class="form-group">
            <label for="auth-email">名簿登録メールアドレス</label>
            <input type="email" id="auth-email" placeholder="example@matsudo-cityphil.jp" required />
          </div>
          <button type="submit" class="btn-primary btn-block" id="btn-send-otp">認証コードを送信</button>
        </form>

        <!-- ステップ2: 6桁パスコード入力 (初期は非表示) -->
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

  // ステップ1: メアド送信
  emailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const email = document.getElementById('auth-email').value.trim();
    const btn = document.getElementById('btn-send-otp');

    btn.disabled = true;
    btn.textContent = '送信中...';

    try {
      await sendOtpEmail(email);
      targetEmail = email;

      // 画面切り替え
      emailForm.style.display = 'none';
      otpForm.style.display = 'block';
      document.getElementById('sent-email-label').textContent = email;

    } catch (err) {
      showError(err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = '認証コードを送信';
    }
  });

  // ステップ2: コード検証
  otpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const code = document.getElementById('auth-otp-code').value.trim();
    const btn = document.getElementById('btn-verify-otp');

    btn.disabled = true;
    btn.textContent = '照合中...';

    try {
      const user = await verifyOtpCode(targetEmail, code);
      alert(`認証されました。おかえりなさい、${user.name} さん！`);
      
      // 認証成功時コールバック（main.js 側でホーム画面へ切り替え）
      if (onSuccess) onSuccess(user);

    } catch (err) {
      showError(err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = '確定してログイン';
    }
  });

  // やり直しボタン
  backBtn.addEventListener('click', () => {
    hideError();
    otpForm.style.display = 'none';
    emailForm.style.display = 'block';
  });

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.style.display = 'block';
  }

  function hideError() {
    errorMsg.textContent = '';
    errorMsg.style.display = 'none';
  }
}