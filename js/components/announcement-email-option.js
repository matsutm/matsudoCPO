import { fetchTargetScopeOptions } from '../services/announcement-service.js';
import { escapeHtml } from '../utils.js';
import { EMAIL_NOTIFY_ENABLED } from '../config.js';

/**
 * メール送信設定のHTMLを出力
 */
export function renderEmailOptionUI() {

  if (!EMAIL_NOTIFY_ENABLED) return '';   // ← 明示的に空文字を返す

  return `
    <div id="email-option-section" class="email-option-box" style="margin-top: 1rem; padding: 0.75rem; background: #f8fafc; border-radius: 6px;">
      <label class="checkbox-label" style="font-weight: bold; cursor: pointer;">
        <input type="checkbox" id="send-email-check" /> 同時にメール通知を送信する
      </label>
      
      <div id="email-target-container" style="display: none; margin-top: 0.5rem; padding-left: 1.5rem;">
        <label for="email-target-scope" style="font-size: 0.85rem;">送信範囲：</label>
        <select id="email-target-scope" class="form-control-sm">
          <option value="all">全団員</option>
          <option value="section">特定のセクション（弦・木管など）</option>
          <option value="instrument">特定のパート（ファゴットなど）</option>
        </select>
        <select id="email-target-value" class="form-control-sm" style="display: none; margin-left: 0.3rem;"></select>
      </div>
    </div>
  `;
}

/**
 * メール送信UIのイベントリスナーを設定
 */
export function initEmailOptionEvents() {
  const check = document.getElementById('send-email-check');
  const scopeSelect = document.getElementById('email-target-scope');
  const valueSelect = document.getElementById('email-target-value');
  const container = document.getElementById('email-target-container');

  if (!check) return;

  check.addEventListener('change', (e) => {
    container.style.display = e.target.checked ? 'block' : 'none';
  });

  scopeSelect?.addEventListener('change', async (e) => {
    const scope = e.target.value;
    if (scope === 'all') {
      valueSelect.style.display = 'none';
      valueSelect.innerHTML = '';
    } else {
      valueSelect.style.display = 'inline-block';
      const options = await fetchTargetScopeOptions(scope);
      valueSelect.innerHTML = options.map(opt => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join('');
    }
  });
}

/**
 * 送信データの取得
 */
export function getEmailOptionData() {
  const check = document.getElementById('send-email-check');
  const isEmailSent = check ? check.checked : false;
  const scopeSelect = document.getElementById('email-target-scope');
  const valueSelect = document.getElementById('email-target-value');

  const targetScope = isEmailSent ? scopeSelect.value : 'all';
  const targetValue = (isEmailSent && targetScope !== 'all') ? valueSelect.value : null;

  return { isEmailSent, targetScope, targetValue };
}