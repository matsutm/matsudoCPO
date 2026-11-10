// js/components/announcement-email-option.js
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
        <option value="instrument">特定のパート（Vnなど）</option>
        <option value="position">役職(運営・PartLeaderなど)</option>
      </select>
      <select id="audience-value" class="form-control-sm" style="display: none; margin-left: 0.3rem;"></select>
    </div>
  `;
}

export function initAudienceEvents() {
  const scopeSelect = document.getElementById('audience-scope');
  const valueSelect = document.getElementById('audience-value');
  if (!scopeSelect) return; // 返信モーダルではプルダウンがないので何もしない

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

/**
 * 返信用のお知らせ先UI
 * 返信は常に発信者へ。チェックを入れると元の宛先にも送る
 * @param {{id:string, name:string, scope:string, value:string, allLabel:string, canReplyAll:boolean}} target
 */
export function renderReplyAudienceUI({ id, name, scope, value, allLabel, canReplyAll }) {
  return `
    <div class="form-group" id="reply-audience-group"
         data-author-id="${escapeHtml(id || '')}"
         data-orig-scope="${escapeHtml(scope || 'all')}"
         data-orig-value="${escapeHtml(value || '')}">
      <label>お知らせ先</label>
      <div style="font-size:0.9rem; margin-bottom:0.3rem;">${escapeHtml(name)}さんに返信します</div>
      ${canReplyAll ? `
        <label style="display:flex; align-items:center; gap:6px; font-weight:normal; cursor:pointer;">
          <input type="checkbox" id="reply-include-orig">
          元の宛先（${escapeHtml(allLabel)}）にも送る
        </label>` : ''}
    </div>
  `;
}

export function getAudienceData() {
  // 返信モーダルの場合
  const replyGroup = document.getElementById('reply-audience-group');
  if (replyGroup) {
    if (document.getElementById('reply-include-orig')?.checked) {
      const scope = replyGroup.dataset.origScope || 'all';
      return {
        targetScope: scope,
        targetValue: scope === 'all' ? null : (replyGroup.dataset.origValue || null)
      };
    }
    return { targetScope: 'member', targetValue: replyGroup.dataset.authorId || null };
  }

  // 新規投稿・転送の場合
  const scope = document.getElementById('audience-scope')?.value || 'all';
  const value = scope === 'all' ? null : (document.getElementById('audience-value')?.value || null);
  return { targetScope: scope, targetValue: value };
}

/**
 * メール送信チェック（宛先は「お知らせ先」と同じ）
 * @param {boolean} defaultChecked - 返信・転送のときは初期ONにする
 */
export function renderEmailOptionUI(defaultChecked = false) {
  const isEnabled = window.EMAIL_NOTIFY_ENABLED;
  return `
    <div id="email-option-section" class="email-option-box" style="margin-top: 1rem; padding: 0.75rem; background: #f8fafc; border-radius: 6px;">
      <label class="checkbox-label" style="font-weight: bold; cursor: ${isEnabled ? 'pointer' : 'not-allowed'}; color: ${isEnabled ? 'inherit' : '#94a3b8'};">
        <input type="checkbox" id="send-email-check" ${isEnabled ? '' : 'disabled'} ${isEnabled && defaultChecked ? 'checked' : ''} /> お知らせ先にメールも送る
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