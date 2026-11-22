// js/views/admin-view.js
// 運営委員向け：members / concerts を表形式で編集する簡易メンテ画面

import { getCurrentUser } from '../services/auth-service.js';
import { isExecutive, fetchRows, insertRows, updateRowById, deleteRowById } from '../services/admin-service.js';
import { renderBackToHome, initBackToHome } from '../components/back-to-home.js';
import { confirmAndRun } from '../utils/action-utils.js';
import { escapeHtml } from '../utils.js';

/* ------------------------------
 * テーブル定義（列を増減するときはここだけ直す）
 * type: text | date | textarea | select | tags(カンマ区切り→配列) | bool
 * ------------------------------ */
const TABLES = {
  members: {
    label: '団員名簿',
    orderBy: 'created_at',
    ascending: true,
    nameKey: 'name',
    columns: [
      { key: 'name',       label: '氏名',     type: 'text', required: true },
      { key: 'email',      label: 'メール',   type: 'text', required: true, lower: true },
      { key: 'section',    label: 'セクション', type: 'select', options: ['弦', '木管', '金管', '打'] },
      { key: 'instrument', label: 'パート',   type: 'text' },
      { key: 'role',       label: '権限',     type: 'select', options: ['member', 'author'], required: true },
      { key: 'positions',  label: '役職(,区切り)', type: 'tags' },
      { key: 'active',     label: '有効',     type: 'bool' }
    ],
    defaults: { role: 'member', active: true }
  },
  concerts: {
    label: '演奏会',
    orderBy: 'event_date',
    ascending: false,
    nameKey: 'title',
    columns: [
      { key: 'event_date', label: '開催日',   type: 'date', required: true },
      { key: 'title',      label: '演奏会名', type: 'text', required: true },
      { key: 'venue',      label: '会場・詳細', type: 'textarea' }
    ],
    defaults: {}
  }
};

let currentTable = 'members';
let container = null;
let loadToken = 0;

/* ------------------------------
 * 画面HTML
 * ------------------------------ */
export function renderAdminView() {
  return `
    <section id="view-admin" class="view-section">
      ${renderBackToHome()}
      <div class="header-actions">
        <h2>🛠 運営用メンテナンス</h2>
      </div>
      <div class="admin-tabs">
        ${Object.entries(TABLES).map(([key, t]) =>
          `<button type="button" class="admin-tab" data-table="${key}">${t.label}</button>`
        ).join('')}
      </div>
      <div class="admin-toolbar">
        <button type="button" id="admin-add" class="btn-secondary">＋ 行を追加</button>
        <button type="button" id="admin-save" class="btn-primary" disabled>変更を保存</button>
        <span id="admin-status" class="admin-status"></span>
      </div>
      <div id="admin-table-container" class="admin-table-wrap">
        <p class="loading-text">読み込み中...</p>
      </div>
    </section>
  `;
}

/* ------------------------------
 * 初期化
 * ------------------------------ */
export async function initAdminView(navigateTo) {
  if (!isExecutive(getCurrentUser())) {
    alert('この画面は運営委員のみ利用できます。');
    navigateTo('home');
    return;
  }

  initBackToHome(navigateTo);
  container = document.getElementById('admin-table-container');

  document.querySelectorAll('.admin-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTable(btn.dataset.table));
  });
  document.getElementById('admin-add').addEventListener('click', addRow);
  document.getElementById('admin-save').addEventListener('click', saveChanges);

  // 行の編集・削除（イベント委譲）
  container.addEventListener('input', (e) => markDirty(e.target.closest('tr')));
  container.addEventListener('change', (e) => markDirty(e.target.closest('tr')));
  container.addEventListener('click', (e) => {
    const del = e.target.closest('.admin-row-del');
    if (del) deleteRow(del.closest('tr'));
  });

  await switchTable(currentTable);
}

/* ------------------------------
 * 表の描画
 * ------------------------------ */
async function switchTable(tableKey) {
  if (hasDirty() && !confirm('保存していない変更があります。破棄して切り替えますか？')) return;
  currentTable = tableKey;
  document.querySelectorAll('.admin-tab').forEach(b =>
    b.classList.toggle('active', b.dataset.table === tableKey));
  await loadTable();
}

async function loadTable() {
  const token = ++loadToken;
  const def = TABLES[currentTable];
  container.innerHTML = '<p class="loading-text">読み込み中...</p>';

  try {
    const rows = await fetchRows(currentTable, def.orderBy, def.ascending);
    if (token !== loadToken) return;

    container.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>${def.columns.map(c => `<th>${c.label}${c.required ? ' *' : ''}</th>`).join('')}<th></th></tr>
        </thead>
        <tbody>${rows.map(r => rowHTML(def, r)).join('')}</tbody>
      </table>
      ${rows.length === 0 ? '<p class="empty-text">データがありません。</p>' : ''}
    `;
    updateStatus(rows.length);
  } catch (err) {
    console.error('メンテ画面の読み込みエラー:', err);
    container.innerHTML = `<p class="error-text">読み込みに失敗しました。<br><small>${escapeHtml(err.message || '')}</small></p>`;
  }
}

function rowHTML(def, row = {}, isNew = false) {
  return `
    <tr data-id="${escapeHtml(String(row.id ?? ''))}" ${isNew ? 'data-new="1" class="dirty"' : ''}>
      ${def.columns.map(c => `<td>${cellHTML(c, row[c.key])}</td>`).join('')}
      <td><button type="button" class="admin-row-del" title="削除">🗑</button></td>
    </tr>
  `;
}

function cellHTML(col, value) {
  const key = `data-key="${col.key}"`;
  const v = value ?? '';

  switch (col.type) {
    case 'bool':
      return `<input type="checkbox" ${key} ${value ? 'checked' : ''}>`;
    case 'date':
      return `<input type="date" class="form-control" ${key} value="${escapeHtml(String(v))}">`;
    case 'textarea':
      return `<textarea class="form-control" rows="2" ${key}>${escapeHtml(String(v))}</textarea>`;
    case 'tags':
      return `<input type="text" class="form-control" ${key} value="${escapeHtml((value || []).join(','))}">`;
    case 'select': {
      const opts = [...col.options];
      if (v && !opts.includes(v)) opts.push(v); // 既存値が選択肢外でも消さない
      return `<select class="form-control" ${key}>
        <option value=""></option>
        ${opts.map(o => `<option value="${escapeHtml(o)}" ${o === v ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}
      </select>`;
    }
    default:
      return `<input type="text" class="form-control" ${key} value="${escapeHtml(String(v))}">`;
  }
}

/* ------------------------------
 * 行操作
 * ------------------------------ */
function addRow() {
  const def = TABLES[currentTable];
  const tbody = container.querySelector('tbody');
  if (!tbody) return;
  tbody.insertAdjacentHTML('afterbegin', rowHTML(def, def.defaults, true));
  tbody.querySelector('tr')?.querySelector('input,textarea,select')?.focus();
  refreshSaveButton();
}

function markDirty(tr) {
  if (!tr) return;
  tr.classList.add('dirty');
  refreshSaveButton();
}

function hasDirty() {
  return !!container?.querySelector('tr.dirty');
}

function refreshSaveButton() {
  const n = container.querySelectorAll('tr.dirty').length;
  const btn = document.getElementById('admin-save');
  btn.disabled = n === 0;
  btn.textContent = n ? `変更を保存（${n}件）` : '変更を保存';
}

function updateStatus(count) {
  const el = document.getElementById('admin-status');
  if (el) el.textContent = `${count}件`;
  refreshSaveButton();
}

function readRow(def, tr) {
  const data = {};
  def.columns.forEach(c => {
    const el = tr.querySelector(`[data-key="${c.key}"]`);
    if (!el) return;

    if (c.type === 'bool') {
      data[c.key] = el.checked;
    } else if (c.type === 'tags') {
      data[c.key] = el.value.split(/[,、]/).map(s => s.trim()).filter(Boolean);
    } else {
      let v = el.value.trim();
      if (c.lower) v = v.toLowerCase();
      data[c.key] = v === '' ? null : v;
    }
  });
  return data;
}

async function deleteRow(tr) {
  const def = TABLES[currentTable];

  // 未保存の新規行は画面から消すだけ
  if (tr.dataset.new) {
    tr.remove();
    refreshSaveButton();
    return;
  }

  const name = tr.querySelector(`[data-key="${def.nameKey}"]`)?.value || 'この行';
  const result = await confirmAndRun(
    `「${name}」を削除しますか？\n（元に戻せません）`,
    () => deleteRowById(currentTable, tr.dataset.id),
    '削除しました'
  );
  if (result !== false) await loadTable();
}

/* ------------------------------
 * 保存
 * ------------------------------ */
async function saveChanges() {
  const def = TABLES[currentTable];
  const dirtyRows = [...container.querySelectorAll('tr.dirty')];
  if (dirtyRows.length === 0) return;

  // 必須チェック
  for (const tr of dirtyRows) {
    const data = readRow(def, tr);
    const missing = def.columns.find(c => c.required && (data[c.key] === null || data[c.key] === ''));
    if (missing) {
      alert(`「${missing.label}」は必須です。`);
      tr.querySelector(`[data-key="${missing.key}"]`)?.focus();
      return;
    }
  }

  const result = await confirmAndRun(
    `${dirtyRows.length}件の変更を保存しますか？`,
    async () => {
      const newRows = dirtyRows.filter(tr => tr.dataset.new).map(tr => readRow(def, tr));
      await insertRows(currentTable, newRows);
      for (const tr of dirtyRows.filter(tr => !tr.dataset.new)) {
        await updateRowById(currentTable, tr.dataset.id, readRow(def, tr));
      }
    },
    '保存しました'
  );
  if (result !== false) await loadTable();
}
