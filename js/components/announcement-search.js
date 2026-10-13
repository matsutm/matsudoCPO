// js/components/announcement-search.js
import { escapeHtml } from '../utils.js';

/** 検索条件の初期値 */
export function createEmptyFilters() {
  return { keyword: '', unreadOnly: false, audience: '', dateFrom: '', dateTo: '' };
}


/** 条件が1つでも有効か */
export function hasActiveFilters(f) {
  return !!(f.keyword || f.unreadOnly || f.audience || f.dateFrom || f.dateTo);
}

/** 検索用に正規化（全角/半角・大文字小文字の揺れを吸収） */
function normalize(str) {
  return (str || '').normalize('NFKC').toLowerCase();
}

/** 投稿の宛先を 'all' / 'section:弦' / 'instrument:Vn' の形にする */
function audienceKey(post) {
  const scope = post.target_scope;
  if ((scope === 'section' || scope === 'instrument') && post.target_value) {
    return `${scope}:${post.target_value}`;
  }
  return 'all';
}

/**
 * お知らせの絞り込み
 * @param {Array} posts
 * @param {{keyword:string, unreadOnly:boolean, dateFrom:string, dateTo:string}} filters
 * @param {Set<number>} readIds
 */
export function filterAnnouncements(posts, filters, readIds = new Set()) {
  const words = normalize(filters.keyword).split(/\s+/).filter(Boolean);
  // 日付はローカル時間の「その日の0:00〜23:59:59」で比較（To当日の投稿も含める）
  const from = filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00`) : null;
  const to   = filters.dateTo   ? new Date(`${filters.dateTo}T23:59:59.999`) : null;

  return posts.filter(post => {
    if (filters.unreadOnly && readIds.has(post.id)) return false;
    if (filters.audience && audienceKey(post) !== filters.audience) return false;

    if (from || to) {
      const created = new Date(post.created_at);
      if (from && created < from) return false;
      if (to && created > to) return false;
    }

    if (words.length > 0) {
      const haystack = normalize(
        [post.title, post.content, post.author_name, post.attachment_name].join('\n')
      );
      if (!words.every(w => haystack.includes(w))) return false;
    }
    return true;
  });
}

/** 検索UIのHTML */
export function renderAnnouncementSearchBox() {
  return `
    <div class="announcement-search" style="margin-bottom:12px;">
      <input id="search-keyword" type="search" class="form-control"
             placeholder="🔍 タイトル・本文・投稿者で検索（スペースでAND）"
             autocomplete="off">

      <div style="display:flex; align-items:center; gap:12px; margin-top:8px;">
        <label style="display:flex; align-items:center; gap:6px; font-size:0.85rem; cursor:pointer; white-space:nowrap;">
          <input id="search-unread-only" type="checkbox"> 未読のみ
        </label>
        <select id="search-audience" class="form-control" style="width:auto; font-size:0.85rem;">
          <option value="">すべての宛先</option>
        </select>
      </div>

      <details id="search-advanced" style="margin-top:8px; font-size:0.85rem;">
        <summary style="cursor:pointer; color:#475569;">詳細条件（期間）</summary>
        <div style="display:flex; align-items:center; gap:6px; margin-top:6px; flex-wrap:wrap;">
          <input id="search-date-from" type="date" class="form-control" style="width:auto;">
          <span>〜</span>
          <input id="search-date-to" type="date" class="form-control" style="width:auto;">
        </div>
      </details>

      <div style="display:flex; align-items:center; gap:12px; margin-top:8px; min-height:1.2em;">
        <span id="search-count" style="font-size:0.8rem; color:#64748b; display:none;"></span>
        <button id="search-clear" type="button" class="btn-link"
                style="display:none; width:auto; margin-top:0; font-size:0.8rem;">条件をクリア</button>
      </div>
    </div>
  `;
}

/**
 * イベント設定
 * @param {(filters) => void} onChange - 条件が変わるたびに呼ばれる
 */
export function initAnnouncementSearch(onChange) {
  const $ = (id) => document.getElementById(id);
  const keywordEl = $('search-keyword');
  const unreadEl  = $('search-unread-only');
  const fromEl    = $('search-date-from');
  const toEl      = $('search-date-to');
  const clearEl   = $('search-clear');
  const audienceEl = $('search-audience');
  
  if (!keywordEl) return;

  const readFilters = () => ({
    keyword: keywordEl.value.trim(),
    unreadOnly: unreadEl.checked,
	  audience: audienceEl.value,
    dateFrom: fromEl.value,
    dateTo: toEl.value
  });

  // 文字入力のみデバウンス。チェック・日付は即時反映
  let timer = null;
  const fireDebounced = () => {
    clearTimeout(timer);
    timer = setTimeout(() => onChange(readFilters()), 200);
  };
  const fireNow = () => {
    clearTimeout(timer);
    onChange(readFilters());
  };

  // 日本語IME変換中は検索しない
  keywordEl.addEventListener('input', (e) => { if (!e.isComposing) fireDebounced(); });
  keywordEl.addEventListener('compositionend', fireDebounced);
  unreadEl.addEventListener('change', fireNow);
  fromEl.addEventListener('change', fireNow);
  toEl.addEventListener('change', fireNow);

  clearEl.addEventListener('click', () => {
    keywordEl.value = '';
    unreadEl.checked = false;
	  audienceEl.value = '';
    fromEl.value = '';
    toEl.value = '';
    fireNow();
  });
}

/** 件数表示と「条件をクリア」の表示切替 */
export function updateSearchStatus(filters, hitCount, totalCount) {
  const countEl = document.getElementById('search-count');
  const clearEl = document.getElementById('search-clear');
  if (!countEl || !clearEl) return;

  const active = hasActiveFilters(filters);
  countEl.textContent = active 
    ? `全 ${totalCount}件中 ${hitCount}件ヒット` 
    : `全 ${totalCount}件（未読 ${unreadCount}件）`;
  countEl.style.display = 'inline';　　//常に表示
  clearEl.style.display = active ? 'inline-block' : 'none';
}

/** 一覧にある投稿から宛先の選択肢を作り直す（選択中の値は維持） */
export function updateAudienceOptions(posts, selected = '') {
  const select = document.getElementById('search-audience');
  if (!select) return;

  const seen = new Map();   // key -> label
  posts.forEach(p => {
    const key = audienceKey(p);
    if (seen.has(key)) return;
    seen.set(key, key === 'all' ? '全団員宛' : `${p.target_value}宛`);
  });

  select.innerHTML = '<option value="">すべての宛先</option>' +
    [...seen].map(([key, label]) =>
      `<option value="${escapeHtml(key)}">${escapeHtml(label)}</option>`
    ).join('');
  select.value = selected;
}