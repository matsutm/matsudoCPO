import { fetchTargetScopeOptions } from '../services/announcement-service.js';
import { escapeHtml } from '../utils.js';


/** お知らせ先（表示範囲）UI。メール設定とは独立 */
export function renderAudienceUI() {
  return `
    <div class="form-group">
      <label for="audience-scope">お知らせ先</label>
      <select id="audience-scope" class="form-control-sm">
        <option value="all">全団員</option>
        <option value="section">特定のセクション（弦・木管など）</option>
        <option value="instrument">特定のパート（ファゴットなど）</option>
      </select>
      <select id="audience-value" class="form-control-sm" style="display: none; margin-left: 0.3rem;"></select>
    </div>
  `;
}

export function initAudienceEvents() {
  const scopeSelect = document.getElementById('audience-scope');
  const valueSelect = document.getElementById('audience-value');
  if (!scopeSelect) return;

  scopeSelect.addEventListener('change', async (e) => {
    const scope = e.target.value;
    if (scope === 'all') {
      valueSelect.style.display = 'none';
      valueSelect.innerHTML = '';
      return;
    }
    valueSelect.style.display = 'inline-block';
    const options = await fetchTargetScopeOptions(scope);
    valueSelect.innerHTML = options
      .map(opt => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`)
      .join('');
  });
}


export function getAudienceData() {
  const scope = document.getElementById('audience-scope')?.value || 'all';
  const value = scope === 'all' ? null : (document.getElementById('audience-value')?.value || null);
  return { targetScope: scope, targetValue: value };
}

/** メール送信チェック（宛先は「お知らせ先」と同じ） */
export function renderEmailOptionUI() {
  const isEnabled = window.EMAIL_NOTIFY_ENABLED;
  return `
    <div id="email-option-section" class="email-option-box" style="margin-top: 1rem; padding: 0.75rem; background: #f8fafc; border-radius: 6px;">
      <label class="checkbox-label" style="font-weight: bold; cursor: ${isEnabled ? 'pointer' : 'not-allowed'}; color: ${isEnabled ? 'inherit' : '#94a3b8'};">
        <input type="checkbox" id="send-email-check" ${isEnabled ? '' : 'disabled'} /> お知らせ先にメールも送る
      </label>
      ${!isEnabled ? '<p style="color: #dc2626; font-size: 0.75rem; margin: 4px 0 0 0;">開発環境のためメール通知機能は無効です。</p>' : ''}
    </div>
  `;
}

/**
 * 送信データの取得
 */
export function getEmailOptionData() {
  const check = document.getElementById('send-email-check');
  return { isEmailSent: check ? check.checked : false };
}