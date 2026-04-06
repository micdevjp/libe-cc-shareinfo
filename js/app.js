/* ========================================
   ClaudeCode活用報告 - App Logic
   ======================================== */

// GASデプロイ後に実際のURLに差し替える
const API_URL = 'YOUR_GAS_WEB_APP_URL';

// 1ページあたりの表示件数
const PAGE_SIZE = 20;

let allData = [];
let filtered = [];
let displayCount = PAGE_SIZE;

// ---- Init ---- //
document.addEventListener('DOMContentLoaded', () => {
  fetchData();

  document.getElementById('categoryFilter').addEventListener('change', applyFilters);
  document.getElementById('dateFrom').addEventListener('change', applyFilters);
  document.getElementById('dateTo').addEventListener('change', applyFilters);
  document.getElementById('resetBtn').addEventListener('click', resetFilters);
  document.getElementById('loadMoreBtn').addEventListener('click', loadMore);
});

// ---- Fetch ---- //
async function fetchData() {
  showLoading(true);
  try {
    const res = await fetch(API_URL);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    allData = json.data.map(d => ({ ...d, date: normalizeDate(d.date) }))
      .sort((a, b) => b.date.localeCompare(a.date));
    buildCategoryOptions();
    applyFilters();
  } catch (e) {
    document.getElementById('cardList').innerHTML =
      `<div class="text-center py-16 text-slate-500">データの読み込みに失敗しました<br><small>${e.message}</small></div>`;
  } finally {
    showLoading(false);
  }
}

// ---- Filters ---- //
function buildCategoryOptions() {
  const cats = [...new Set(allData.map(d => d.category))].sort();
  const sel = document.getElementById('categoryFilter');
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    sel.appendChild(opt);
  });
}

function applyFilters() {
  const cat = document.getElementById('categoryFilter').value;
  const from = document.getElementById('dateFrom').value.replace(/-/g, '/');
  const to = document.getElementById('dateTo').value.replace(/-/g, '/');

  filtered = allData.filter(d => {
    if (cat && d.category !== cat) return false;
    if (from && d.date < from) return false;
    if (to && d.date > to) return false;
    return true;
  });

  displayCount = PAGE_SIZE;
  render();
}

function resetFilters() {
  document.getElementById('categoryFilter').value = '';
  document.getElementById('dateFrom').value = '';
  document.getElementById('dateTo').value = '';
  applyFilters();
}

// ---- Render ---- //
function render() {
  const list = document.getElementById('cardList');
  const visible = filtered.slice(0, displayCount);

  if (filtered.length === 0) {
    list.innerHTML = '<div class="text-center py-16 text-slate-500">該当する報告がありません</div>';
  } else {
    list.innerHTML = visible.map(cardHTML).join('');
  }

  // Stats
  document.getElementById('totalCount').textContent = `全${allData.length}件`;
  document.getElementById('filteredCount').textContent =
    filtered.length !== allData.length ? `${filtered.length}件表示` : '';

  // Load more
  const btn = document.getElementById('loadMoreBtn');
  btn.classList.toggle('hidden', displayCount >= filtered.length);
  btn.textContent = `もっと見る（残り${filtered.length - displayCount}件）`;
}

function cardHTML(item) {
  const catColors = categoryColors(item.category);
  const linkHtml = item.link && item.link !== '（内容取得不可）'
    ? `<div class="self-center">
        <a href="${escapeAttr(item.link)}" target="_blank" rel="noopener"
          class="inline-flex items-center gap-1 text-xs text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap">
          元投稿 &rarr;
        </a>
      </div>`
    : '';

  return `
    <article class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_auto]">
      <div class="min-w-0">
        <div class="flex items-center gap-2.5 text-xs text-slate-500 mb-1.5">
          <span class="font-semibold whitespace-nowrap">${escape(item.date)}</span>
          <span class="truncate">${escape(item.author)}</span>
        </div>
        <span class="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2 ${catColors}">
          ${escape(item.category)}
        </span>
        <p class="text-sm font-medium leading-relaxed">${escape(item.summary)}</p>
      </div>
      ${linkHtml}
    </article>`;
}

function categoryColors(cat) {
  if (cat.includes('アプリケーション開発')) return 'bg-blue-100 text-blue-700';
  if (cat.includes('個人開発')) return 'bg-green-100 text-green-700';
  if (cat.includes('業務プロセス')) return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-600';
}

function loadMore() {
  displayCount += PAGE_SIZE;
  render();
}

// ---- Helpers ---- //
function showLoading(show) {
  document.getElementById('loading').classList.toggle('hidden', !show);
  document.getElementById('mainContent').classList.toggle('hidden', show);
}

function normalizeDate(str) {
  // "2026/03/19" 形式ならそのまま返す
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(str)) return str;
  // GASのDate文字列などをパースして変換
  const d = new Date(str);
  if (isNaN(d)) return str;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

function escape(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
