/* ==========================================================================
   PERSONAL FINANCE SIMULATOR — script.js
   Author:  Daksh Bhasin
   Version: 1.0.0
   Modules:
     1.  CONFIG         — Constants, category maps, currency symbols
     2.  STATE          — In-memory application state
     3.  STORAGE        — localStorage read/write/clear
     4.  CALCULATIONS   — Balance, income, expense, savings, trends
     5.  TRANSACTIONS   — Add, delete, filter, sort, paginate
     6.  DASHBOARD      — Render summary cards and hero stats
     7.  CHARTS         — Chart.js trend, donut, and daily bar charts
     8.  BUDGET         — Set budgets, render progress bars, alerts
     9.  GOAL SIMULATOR — Savings projection engine
    10.  UI             — Theme, navbar, modals, toasts
    11.  EVENTS         — All event listener wiring
    12.  INIT           — Application bootstrap
   ========================================================================== */

'use strict';

/* ==========================================================================
   1. CONFIG
   ========================================================================== */

/** Storage keys */
const STORAGE_KEYS = {
  TRANSACTIONS: 'finsim_transactions',
  BUDGETS:      'finsim_budgets',
  SETTINGS:     'finsim_settings',
};

/** Currency symbols map */
const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

/** Category display metadata: label, emoji, chart color */
const CATEGORY_META = {
  food:          { label: 'Food & Dining',   emoji: '🍔', color: '#f59e0b' },
  rent:          { label: 'Rent & Housing',  emoji: '🏠', color: '#6366f1' },
  transport:     { label: 'Transport',        emoji: '🚗', color: '#3b82f6' },
  utilities:     { label: 'Utilities',        emoji: '💡', color: '#0ea5e9' },
  entertainment: { label: 'Entertainment',    emoji: '🎬', color: '#ec4899' },
  health:        { label: 'Health & Medical', emoji: '🏥', color: '#10b981' },
  education:     { label: 'Education',        emoji: '📚', color: '#8b5cf6' },
  shopping:      { label: 'Shopping',         emoji: '🛍️', color: '#f97316' },
  subscriptions: { label: 'Subscriptions',    emoji: '📱', color: '#a855f7' },
  'other-expense':{ label: 'Other',           emoji: '📦', color: '#64748b' },
  salary:        { label: 'Salary',           emoji: '💼', color: '#22c55e' },
  freelance:     { label: 'Freelance',        emoji: '💻', color: '#34d399' },
  investment:    { label: 'Investment',       emoji: '📈', color: '#4ade80' },
  gift:          { label: 'Gift',             emoji: '🎁', color: '#86efac' },
  'other-income':{ label: 'Other Income',     emoji: '💰', color: '#bbf7d0' },
};

/** Pagination: rows per page */
const ROWS_PER_PAGE = 8;

/** Seed data shown when localStorage is empty */
const SEED_TRANSACTIONS = [
  { id: 'seed-1', type: 'income',  amount: 75000, category: 'salary',       description: 'Monthly salary',         date: formatDateForInput(getMonthOffset(-1, 1)),  recurring: true,  recurringInterval: 'monthly' },
  { id: 'seed-2', type: 'expense', amount: 18000, category: 'rent',         description: 'Apartment rent',          date: formatDateForInput(getMonthOffset(-1, 2)),  recurring: true,  recurringInterval: 'monthly' },
  { id: 'seed-3', type: 'expense', amount: 4200,  category: 'food',         description: 'Grocery & dining',        date: formatDateForInput(getMonthOffset(0, 3)),   recurring: false, recurringInterval: null },
  { id: 'seed-4', type: 'expense', amount: 1500,  category: 'transport',    description: 'Metro & cab rides',       date: formatDateForInput(getMonthOffset(0, 5)),   recurring: false, recurringInterval: null },
  { id: 'seed-5', type: 'income',  amount: 12000, category: 'freelance',    description: 'Web dev project',         date: formatDateForInput(getMonthOffset(0, 6)),   recurring: false, recurringInterval: null },
  { id: 'seed-6', type: 'expense', amount: 999,   category: 'subscriptions',description: 'Netflix + Spotify',       date: formatDateForInput(getMonthOffset(0, 7)),   recurring: true,  recurringInterval: 'monthly' },
  { id: 'seed-7', type: 'expense', amount: 3200,  category: 'shopping',     description: 'Clothes & accessories',   date: formatDateForInput(getMonthOffset(0, 9)),   recurring: false, recurringInterval: null },
  { id: 'seed-8', type: 'expense', amount: 850,   category: 'entertainment',description: 'Movie & dining out',      date: formatDateForInput(getMonthOffset(0, 10)),  recurring: false, recurringInterval: null },
  { id: 'seed-9', type: 'income',  amount: 75000, category: 'salary',       description: 'Monthly salary',         date: formatDateForInput(getMonthOffset(0, 1)),   recurring: true,  recurringInterval: 'monthly' },
  { id: 'seed-10',type: 'expense', amount: 18000, category: 'rent',         description: 'Apartment rent',          date: formatDateForInput(getMonthOffset(0, 2)),   recurring: true,  recurringInterval: 'monthly' },
  { id: 'seed-11',type: 'expense', amount: 2200,  category: 'utilities',    description: 'Electricity & water',     date: formatDateForInput(getMonthOffset(0, 8)),   recurring: false, recurringInterval: null },
  { id: 'seed-12',type: 'expense', amount: 1800,  category: 'health',       description: 'Gym membership',          date: formatDateForInput(getMonthOffset(0, 12)),  recurring: true,  recurringInterval: 'monthly' },
];

/* ==========================================================================
   2. STATE
   ========================================================================== */

/** Central application state — single source of truth */
const State = {
  transactions: [],       // Array<Transaction>
  budgets:      {},       // { category: limitAmount }
  settings: {
    currency:   'INR',
    theme:      'dark',
  },
  ui: {
    currentPage:    1,
    dashboardMonth: new Date(),   // Date object for the displayed month
    filters: {
      search:   '',
      type:     'all',
      category: 'all',
      dateFrom: '',
      dateTo:   '',
      sort:     'date-desc',
    },
    pendingDeleteId: null,        // ID staged for deletion confirmation
  },
};

/* ==========================================================================
   3. STORAGE MODULE
   ========================================================================== */

const Storage = {

  /** Save the full state to localStorage */
  save() {
    try {
      localStorage.setItem(
        STORAGE_KEYS.TRANSACTIONS,
        JSON.stringify(State.transactions)
      );
      localStorage.setItem(
        STORAGE_KEYS.BUDGETS,
        JSON.stringify(State.budgets)
      );
      localStorage.setItem(
        STORAGE_KEYS.SETTINGS,
        JSON.stringify(State.settings)
      );
    } catch (err) {
      console.error('[FinSim] localStorage write failed:', err);
      UI.toast('Storage full — some data may not be saved.', 'warning');
    }
  },

  /** Load state from localStorage; fall back to seed data */
  load() {
    try {
      // --- Transactions ---
      const rawTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      State.transactions = rawTx ? JSON.parse(rawTx) : [...SEED_TRANSACTIONS];

      // --- Budgets ---
      const rawBudgets = localStorage.getItem(STORAGE_KEYS.BUDGETS);
      State.budgets = rawBudgets ? JSON.parse(rawBudgets) : {};

      // --- Settings ---
      const rawSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (rawSettings) {
        Object.assign(State.settings, JSON.parse(rawSettings));
      }
    } catch (err) {
      console.error('[FinSim] localStorage read failed:', err);
      State.transactions = [...SEED_TRANSACTIONS];
    }
  },

  /** Wipe all FinSim data from localStorage */
  clear() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    State.transactions = [];
    State.budgets      = {};
    State.settings     = { currency: 'INR', theme: 'dark' };
  },

  /** Return approximate bytes used by this app */
  getBytesUsed() {
    return Object.values(STORAGE_KEYS).reduce((total, key) => {
      return total + (localStorage.getItem(key) || '').length * 2; // UTF-16
    }, 0);
  },
};

/* ==========================================================================
   4. CALCULATIONS MODULE
   ========================================================================== */

const Calc = {

  /**
   * Filter transactions to a specific YYYY-MM month.
   * Pass null to get all transactions.
   * @param {Date|null} monthDate
   * @returns {Transaction[]}
   */
  forMonth(monthDate = null) {
    if (!monthDate) return State.transactions;
    const y = monthDate.getFullYear();
    const m = monthDate.getMonth();
    return State.transactions.filter(tx => {
      const d = new Date(tx.date);
      return d.getFullYear() === y && d.getMonth() === m;
    });
  },

  /** Sum all income transactions in the given array */
  totalIncome(txList) {
    return txList
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
  },

  /** Sum all expense transactions in the given array */
  totalExpense(txList) {
    return txList
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
  },

  /** Net balance = income − expenses */
  netBalance(txList) {
    return this.totalIncome(txList) - this.totalExpense(txList);
  },

  /**
   * Savings rate as a percentage (0–100).
   * Returns 0 if income is zero to avoid division by zero.
   */
  savingsRate(txList) {
    const income  = this.totalIncome(txList);
    const expense = this.totalExpense(txList);
    if (income === 0) return 0;
    return Math.max(0, ((income - expense) / income) * 100);
  },

  /**
   * Percentage change between two values.
   * Returns null if base is 0.
   */
  pctChange(current, previous) {
    if (previous === 0) return null;
    return ((current - previous) / previous) * 100;
  },

  /**
   * Aggregate expenses by category for a given transaction list.
   * @returns {{ [category]: number }}
   */
  byCategory(txList) {
    return txList
      .filter(tx => tx.type === 'expense')
      .reduce((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
        return acc;
      }, {});
  },

  /**
   * Build monthly totals for the last N months.
   * @param {number} months - How many months back to include
   * @returns {{ labels, income, expense }}
   */
  monthlyTrend(months = 6) {
    const labels  = [];
    const income  = [];
    const expense = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);

      labels.push(
        d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
      );

      const txList = this.forMonth(d);
      income.push(this.totalIncome(txList));
      expense.push(this.totalExpense(txList));
    }

    return { labels, income, expense };
  },

  /**
   * Build daily spending totals for the current dashboard month.
   * @returns {{ labels, amounts }}
   */
  dailySpending(monthDate) {
    const y    = monthDate.getFullYear();
    const m    = monthDate.getMonth();
    const days = new Date(y, m + 1, 0).getDate(); // days in month

    const labels  = [];
    const amounts = [];

    for (let d = 1; d <= days; d++) {
      labels.push(String(d));
      const dayStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const total = State.transactions
        .filter(tx => tx.type === 'expense' && tx.date === dayStr)
        .reduce((s, tx) => s + tx.amount, 0);
      amounts.push(total);
    }

    return { labels, amounts };
  },

  /**
   * Average monthly net savings across all stored months.
   * @returns {number}
   */
  avgMonthlySavings() {
    if (State.transactions.length === 0) return 0;

    // Find unique months
    const monthKeys = [...new Set(
      State.transactions.map(tx => tx.date.slice(0, 7))
    )];

    const total = monthKeys.reduce((sum, key) => {
      const [y, m] = key.split('-').map(Number);
      const txList = this.forMonth(new Date(y, m - 1, 1));
      return sum + this.netBalance(txList);
    }, 0);

    return total / monthKeys.length;
  },
};

/* ==========================================================================
   5. TRANSACTIONS MODULE
   ========================================================================== */

const Transactions = {

  /**
   * Add a new transaction to state, save, and re-render.
   * @param {object} data - Form data object
   */
  add(data) {
    const tx = {
      id:                'tx-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      type:              data.type,
      amount:            parseFloat(data.amount),
      category:          data.category,
      description:       (data.description || '').trim() || getCategoryLabel(data.category),
      date:              data.date,
      recurring:         !!data.recurring,
      recurringInterval: data.recurringInterval || null,
      createdAt:         new Date().toISOString(),
    };

    State.transactions.unshift(tx); // newest first
    State.ui.currentPage = 1;
    Storage.save();
    renderAll();
    UI.toast(`Transaction added! ${getCategoryEmoji(tx.category)} ${formatAmount(tx.amount)}`, 'success');
    return tx;
  },

  /**
   * Delete a transaction by ID.
   * @param {string} id
   */
  delete(id) {
    const idx = State.transactions.findIndex(tx => tx.id === id);
    if (idx === -1) return;

    State.transactions.splice(idx, 1);
    if (State.ui.currentPage > totalPages()) {
      State.ui.currentPage = Math.max(1, totalPages());
    }
    Storage.save();
    renderAll();
    UI.toast('Transaction deleted.', 'info');
  },

  /**
   * Apply current filter/sort state to transactions.
   * @returns {Transaction[]}
   */
  filtered() {
    const { search, type, category, dateFrom, dateTo, sort } = State.ui.filters;
    let list = [...State.transactions];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(tx =>
        tx.description.toLowerCase().includes(q) ||
        getCategoryLabel(tx.category).toLowerCase().includes(q)
      );
    }

    // Type
    if (type !== 'all') {
      list = list.filter(tx => tx.type === type);
    }

    // Category
    if (category !== 'all') {
      list = list.filter(tx => tx.category === category);
    }

    // Date range
    if (dateFrom) {
      list = list.filter(tx => tx.date >= dateFrom);
    }
    if (dateTo) {
      list = list.filter(tx => tx.date <= dateTo);
    }

    // Sort
    list.sort((a, b) => {
      switch (sort) {
        case 'date-asc':    return new Date(a.date) - new Date(b.date);
        case 'date-desc':   return new Date(b.date) - new Date(a.date);
        case 'amount-asc':  return a.amount - b.amount;
        case 'amount-desc': return b.amount - a.amount;
        default:            return 0;
      }
    });

    return list;
  },

  /**
   * Get the current page slice of filtered transactions.
   * @returns {Transaction[]}
   */
  currentPage() {
    const all   = this.filtered();
    const start = (State.ui.currentPage - 1) * ROWS_PER_PAGE;
    return all.slice(start, start + ROWS_PER_PAGE);
  },
};

/* ==========================================================================
   6. DASHBOARD MODULE
   ========================================================================== */

const Dashboard = {

  /** Render all four summary cards for the dashboard month */
  renderCards() {
    const month    = State.ui.dashboardMonth;
    const txNow    = Calc.forMonth(month);
    const prevDate = new Date(month.getFullYear(), month.getMonth() - 1, 1);
    const txPrev   = Calc.forMonth(prevDate);

    // ── Month label (always update regardless of empty state) ──
    const monthLabel = month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    setText('dashboard-current-month', monthLabel);
    setText('dashboard-month-display', monthLabel);
    const monthAttr = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
    const dateEl = document.getElementById('dashboard-month-display');
    if (dateEl) dateEl.setAttribute('datetime', monthAttr);

    // ── Empty state handling ──
    const emptyEl   = document.getElementById('dashboard-empty-state');
    const cardsEl   = document.querySelector('.dashboard__cards');
    const hasNoTx   = txNow.length === 0;

    if (emptyEl) emptyEl.hidden = !hasNoTx;
    if (cardsEl) cardsEl.style.opacity = hasNoTx ? '0.45' : '1';

    if (hasNoTx) {
      // Zero out all card values — no hardcoded figures
      const zero = formatAmount(0);
      setText('balance-amount',      zero);
      setText('balance-change-text', 'No transactions for this month.');
      setText('income-amount',       zero);
      setText('income-change-text',  '—');
      setText('expense-amount',      zero);
      setText('expense-change-text', '—');
      setText('savings-rate',        '0%');
      setText('savings-change-text', `${zero} saved this month`);
      updateChangeClass('income-change',  true);
      updateChangeClass('expense-change', true);
      return;
    }

    // ── Compute stats from the selected month's transactions ──
    const income  = Calc.totalIncome(txNow);
    const expense = Calc.totalExpense(txNow);
    const balance = Calc.netBalance(txNow);
    const rate    = Calc.savingsRate(txNow);

    const prevIncome  = Calc.totalIncome(txPrev);
    const prevExpense = Calc.totalExpense(txPrev);

    // Helper: format signed percentage change
    const fmtChange = (curr, prev) => {
      const pct = Calc.pctChange(curr, prev);
      if (pct === null) return { text: '—', positive: true };
      const sign = pct >= 0 ? '+' : '';
      return { text: `${sign}${pct.toFixed(1)}% vs last month`, positive: pct >= 0 };
    };

    // ── Balance card ──
    setText('balance-amount', formatAmount(balance));
    setText('balance-change-text', balance >= 0 ? 'You are in the green this month 🎉' : 'Spending exceeds income ⚠️');

    // ── Income card ──
    setText('income-amount', formatAmount(income));
    const inChg = fmtChange(income, prevIncome);
    setText('income-change-text', inChg.text);
    updateChangeClass('income-change', inChg.positive);

    // ── Expense card ──
    setText('expense-amount', formatAmount(expense));
    const exChg = fmtChange(expense, prevExpense);
    setText('expense-change-text', exChg.text);
    updateChangeClass('expense-change', !exChg.positive); // higher expenses = bad

    // ── Savings card ──
    setText('savings-rate', `${rate.toFixed(1)}%`);
    setText('savings-change-text', `${formatAmount(income - expense)} saved this month`);
  },

  /** Render hero strip stats (all-time) */
  renderHeroStats() {
    const all        = State.transactions;
    const balance    = Calc.netBalance(all);
    const categories = new Set(all.map(tx => tx.category)).size;

    setText('hero-stat-balance',    formatAmount(balance));
    setText('hero-stat-tx-count',   all.length.toString());
    setText('hero-stat-categories', categories.toString());
  },

  /** Navigate dashboard month forward or backward */
  navigateMonth(direction) {
    const d = State.ui.dashboardMonth;
    State.ui.dashboardMonth = new Date(d.getFullYear(), d.getMonth() + direction, 1);
    this.renderCards();
    Charts.renderTrend();
    Charts.renderDonut();
    Charts.renderDaily();
    Budget.renderBars();
  },
};

/* ==========================================================================
   7. CHARTS MODULE
   ========================================================================== */

/** Chart instance references (so we can update without re-creating) */
const ChartInstances = { trend: null, donut: null, daily: null };

/** Shared Chart.js global defaults */
function applyChartDefaults() {
  if (typeof Chart === 'undefined') return;
  Chart.defaults.font.family = 'Poppins, sans-serif';
  Chart.defaults.color       = 'rgba(240,244,255,0.60)';
  Chart.defaults.plugins.legend.display = false;
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(13,17,48,0.92)';
  Chart.defaults.plugins.tooltip.borderColor      = 'rgba(99,102,241,0.35)';
  Chart.defaults.plugins.tooltip.borderWidth      = 1;
  Chart.defaults.plugins.tooltip.padding          = 10;
  Chart.defaults.plugins.tooltip.cornerRadius     = 8;
  Chart.defaults.plugins.tooltip.titleFont        = { weight: '600' };
}

const Charts = {

  /** Income vs Expenses line chart */
  renderTrend() {
    if (typeof Chart === 'undefined') return;
    const rangeEl  = document.getElementById('trend-range-select');
    const months   = rangeEl ? parseInt(rangeEl.value, 10) : 6;
    const data     = Calc.monthlyTrend(months);
    const canvas   = document.getElementById('trend-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const gradIncome  = ctx.createLinearGradient(0, 0, 0, 280);
    gradIncome.addColorStop(0,   'rgba(34, 197, 94, 0.35)');
    gradIncome.addColorStop(1,   'rgba(34, 197, 94, 0.00)');

    const gradExpense = ctx.createLinearGradient(0, 0, 0, 280);
    gradExpense.addColorStop(0,  'rgba(239, 68, 68, 0.35)');
    gradExpense.addColorStop(1,  'rgba(239, 68, 68, 0.00)');

    const config = {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            label:           'Income',
            data:             data.income,
            borderColor:      '#22c55e',
            backgroundColor:  gradIncome,
            borderWidth:      2.5,
            pointRadius:      4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#22c55e',
            tension:          0.4,
            fill:             true,
          },
          {
            label:           'Expenses',
            data:             data.expense,
            borderColor:      '#ef4444',
            backgroundColor:  gradExpense,
            borderWidth:      2.5,
            pointRadius:      4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#ef4444',
            tension:          0.4,
            fill:             true,
          },
        ],
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        interaction:         { mode: 'index', intersect: false },
        plugins: {
          legend:  { display: true, position: 'top', labels: { usePointStyle: true, pointStyleWidth: 8, padding: 16, font: { size: 12 } } },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${formatAmount(ctx.parsed.y)}`,
            },
          },
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' } },
          y: {
            grid:  { color: 'rgba(255,255,255,0.05)' },
            ticks: { callback: v => formatAmount(v, true) },
          },
        },
      },
    };

    if (ChartInstances.trend) {
      ChartInstances.trend.data    = config.data;
      ChartInstances.trend.options = config.options;
      ChartInstances.trend.update('active');
    } else {
      ChartInstances.trend = new Chart(ctx, config);
    }
  },

  /** Expense donut chart */
  renderDonut() {
    if (typeof Chart === 'undefined') return;
    const canvas = document.getElementById('category-chart');
    if (!canvas) return;

    const monthEl = document.getElementById('category-chart-month');
    let txList;
    if (monthEl?.value === 'last') {
      const prev = new Date(State.ui.dashboardMonth);
      prev.setMonth(prev.getMonth() - 1);
      txList = Calc.forMonth(prev);
    } else if (monthEl?.value === 'all') {
      txList = State.transactions;
    } else {
      txList = Calc.forMonth(State.ui.dashboardMonth);
    }

    const byCategory = Calc.byCategory(txList);
    const entries    = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
    const labels     = entries.map(([k]) => getCategoryLabel(k));
    const values     = entries.map(([, v]) => v);
    const colors     = entries.map(([k]) => CATEGORY_META[k]?.color || '#6366f1');
    const total      = values.reduce((s, v) => s + v, 0);

    // Update donut center
    setText('donut-center-value', formatAmount(total));

    // Render legend
    const legendEl = document.getElementById('category-chart-legend');
    if (legendEl) {
      legendEl.innerHTML = entries.map(([cat, amt]) => `
        <div class="chart-legend-item" role="listitem">
          <span class="chart-legend-dot" style="background:${CATEGORY_META[cat]?.color || '#6366f1'}"></span>
          ${getCategoryLabel(cat)} — ${formatAmount(amt)}
        </div>
      `).join('');
    }

    const ctx = canvas.getContext('2d');
    const config = {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data:             values,
          backgroundColor:  colors,
          borderColor:      'rgba(13,17,48,0.8)',
          borderWidth:      3,
          hoverOffset:      8,
        }],
      },
      options: {
        responsive:          true,
        maintainAspectRatio: true,
        cutout:              '68%',
        plugins: {
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${formatAmount(ctx.parsed)} (${total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0}%)`,
            },
          },
        },
      },
    };

    if (ChartInstances.donut) {
      ChartInstances.donut.data = config.data;
      ChartInstances.donut.update('active');
    } else {
      ChartInstances.donut = new Chart(ctx, config);
    }
  },

  /** Daily spending bar chart */
  renderDaily() {
    if (typeof Chart === 'undefined') return;
    const canvas = document.getElementById('daily-spending-chart');
    if (!canvas) return;

    const { labels, amounts } = Calc.dailySpending(State.ui.dashboardMonth);
    const typeEl = document.getElementById('daily-chart-type');
    const chartType = typeEl?.value || 'bar';

    // Update label
    const labelEl = document.getElementById('daily-chart-month-label');
    if (labelEl) {
      labelEl.textContent = State.ui.dashboardMonth.toLocaleDateString(
        'en-IN', { month: 'long', year: 'numeric' }
      );
    }

    const ctx = canvas.getContext('2d');
    const gradDaily = ctx.createLinearGradient(0, 0, 0, 280);
    gradDaily.addColorStop(0, 'rgba(99, 102, 241, 0.80)');
    gradDaily.addColorStop(1, 'rgba(168, 85, 247, 0.20)');

    const config = {
      type: chartType,
      data: {
        labels,
        datasets: [{
          label:           'Spending',
          data:             amounts,
          backgroundColor:  chartType === 'bar' ? gradDaily : 'transparent',
          borderColor:      '#818cf8',
          borderWidth:      chartType === 'line' ? 2 : 0,
          borderRadius:     chartType === 'bar' ? 4 : 0,
          tension:          0.4,
          fill:             chartType === 'line',
          pointRadius:      chartType === 'line' ? 3 : 0,
          pointHoverRadius: 5,
          pointBackgroundColor: '#818cf8',
        }],
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: ctx => ` Spent: ${formatAmount(ctx.parsed.y)}`,
            },
          },
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid:  { color: 'rgba(255,255,255,0.05)' },
            ticks: { callback: v => formatAmount(v, true) },
          },
        },
      },
    };

    // Destroy and recreate if chart type changed
    if (ChartInstances.daily && ChartInstances.daily.config.type !== chartType) {
      ChartInstances.daily.destroy();
      ChartInstances.daily = null;
    }

    if (ChartInstances.daily) {
      ChartInstances.daily.data = config.data;
      ChartInstances.daily.update('active');
    } else {
      ChartInstances.daily = new Chart(ctx, config);
    }
  },

  /** Render all three charts */
  renderAll() {
    this.renderTrend();
    this.renderDonut();
    this.renderDaily();
  },
};

/* ==========================================================================
   8. BUDGET MODULE
   ========================================================================== */

const Budget = {

  /**
   * Save a budget limit for a category.
   * @param {string} category
   * @param {number} limit
   */
  set(category, limit) {
    if (limit <= 0) {
      delete State.budgets[category];
    } else {
      State.budgets[category] = limit;
    }
    Storage.save();
  },

  /** Render all budget category cards and overview totals */
  renderBars() {
    const container  = document.getElementById('budget-cards-container');
    const emptyState = document.getElementById('budget-empty-state');
    const alertsEl   = document.getElementById('budget-alerts-container');
    if (!container) return;

    const txList  = Calc.forMonth(State.ui.dashboardMonth);
    const entries = Object.entries(State.budgets);

    // Overview totals
    const totalLimit    = entries.reduce((s, [, v]) => s + v, 0);
    const totalSpent    = entries.reduce((s, [cat]) => s + (Calc.byCategory(txList)[cat] || 0), 0);
    const totalRemaining = totalLimit - totalSpent;

    setText('budget-total-limit',     formatAmount(totalLimit));
    setText('budget-total-spent',     formatAmount(totalSpent));
    setText('budget-total-remaining', formatAmount(Math.max(0, totalRemaining)));

    // Empty state
    if (entries.length === 0) {
      if (emptyState) emptyState.style.display = 'flex';
      if (alertsEl)   alertsEl.innerHTML = '';
      return;
    }
    if (emptyState) emptyState.style.display = 'none';

    // Build cards
    const spentMap = Calc.byCategory(txList);
    const alerts   = [];

    // Remove old injected cards (keep only the empty-state div)
    [...container.querySelectorAll('.budget-cat-card')].forEach(el => el.remove());

    entries.forEach(([cat, limit]) => {
      const spent   = spentMap[cat] || 0;
      const pct     = Math.min((spent / limit) * 100, 100);
      const meta    = CATEGORY_META[cat] || { label: cat, emoji: '📦', color: '#6366f1' };
      let   barClass = 'on-track';

      if (pct >= 100)      { barClass = 'over-budget'; alerts.push({ cat, spent, limit, type: 'danger' }); }
      else if (pct >= 80)  { barClass = 'near-budget'; alerts.push({ cat, spent, limit, type: 'warning' }); }

      const card = document.createElement('article');
      card.className = 'budget-cat-card glass-card';
      card.setAttribute('role', 'listitem');
      card.innerHTML = `
        <div class="budget-cat-card__header">
          <span class="budget-cat-card__name">${meta.emoji} ${meta.label}</span>
          <span class="budget-cat-card__pct">${pct.toFixed(0)}%</span>
        </div>
        <div class="budget-cat-card__amounts">
          <span class="budget-cat-card__spent">${formatAmount(spent)}</span>
          <span class="budget-cat-card__limit">of ${formatAmount(limit)}</span>
        </div>
        <div class="progress-bar" role="progressbar" aria-valuenow="${pct.toFixed(0)}" aria-valuemin="0" aria-valuemax="100" aria-label="${meta.label} budget usage">
          <div class="progress-bar__fill ${barClass}" style="width:${pct.toFixed(2)}%"></div>
        </div>
      `;
      container.appendChild(card);
    });

    // Render alerts
    if (alertsEl) {
      alertsEl.innerHTML = alerts.map(a => {
        const meta = CATEGORY_META[a.cat] || { label: a.cat, emoji: '📦' };
        const cls  = a.type === 'danger' ? 'budget-alert--danger' : 'budget-alert--warning';
        const msg  = a.type === 'danger'
          ? `${meta.emoji} <strong>${meta.label}</strong> budget exceeded! Spent ${formatAmount(a.spent)} of ${formatAmount(a.limit)}.`
          : `${meta.emoji} <strong>${meta.label}</strong> is at ${((a.spent / a.limit)*100).toFixed(0)}% — approaching limit.`;
        return `<div class="budget-alert ${cls}" role="alert">${msg}</div>`;
      }).join('');
    }
  },

  /** Open budget modal and pre-fill with current budgets */
  openModal() {
    const fieldsEl = document.getElementById('budget-form-fields');
    if (!fieldsEl) return;

    const categories = Object.keys(CATEGORY_META).filter(k =>
      !['salary','freelance','investment','gift','other-income'].includes(k)
    );

    fieldsEl.innerHTML = categories.map(cat => {
      const meta  = CATEGORY_META[cat];
      const value = State.budgets[cat] || '';
      return `
        <div class="budget-form__row">
          <label class="form-label" for="budget-${cat}">${meta.emoji} ${meta.label}</label>
          <div class="form-input-wrapper form-input-wrapper--prefix">
            <span class="form-prefix">${currencySymbol()}</span>
            <input
              type="number"
              class="form-input"
              id="budget-${cat}"
              data-category="${cat}"
              min="0"
              step="100"
              placeholder="0"
              value="${value}"
            />
          </div>
        </div>
      `;
    }).join('');

    UI.openModal('budget-modal');
  },

  /** Read modal values and save budgets */
  saveFromModal() {
    const inputs = document.querySelectorAll('#budget-form-fields input[data-category]');
    inputs.forEach(input => {
      const cat   = input.dataset.category;
      const limit = parseFloat(input.value);
      this.set(cat, isNaN(limit) ? 0 : limit);
    });
    UI.closeModal('budget-modal');
    this.renderBars();
    UI.toast('Budgets saved successfully! 💰', 'success');
  },
};

/* ==========================================================================
   9. GOAL SIMULATOR MODULE
   ========================================================================== */

const GoalSim = {

  /** Run simulation from form values */
  simulate() {
    const title   = document.getElementById('goal-title-input')?.value.trim()  || 'My Goal';
    const target  = parseFloat(document.getElementById('goal-target-input')?.value);
    const current = parseFloat(document.getElementById('goal-current-input')?.value) || 0;
    const dateStr = document.getElementById('goal-date-input')?.value;
    const resultEl = document.getElementById('goal-sim-result');

    // Validate
    if (!target || target <= 0) { UI.toast('Please enter a valid target amount.', 'warning'); return; }
    if (!dateStr)                { UI.toast('Please select a target date.', 'warning'); return; }

    const targetDate = new Date(dateStr);
    if (targetDate <= new Date()) { UI.toast('Target date must be in the future.', 'warning'); return; }

    const remaining = Math.max(0, target - current);
    const months    = monthsDiff(new Date(), targetDate);
    const needed    = months > 0 ? remaining / months : remaining;
    const avgSavings = Calc.avgMonthlySavings();
    const onTrack    = avgSavings >= needed;

    // Projected date based on avg savings
    let projDate = '—';
    if (avgSavings > 0) {
      const projMonths = Math.ceil(remaining / avgSavings);
      const d = new Date();
      d.setMonth(d.getMonth() + projMonths);
      projDate = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    }

    // Populate result panel
    setText('sim-monthly-needed', formatAmount(needed));
    setText('sim-avg-savings',    formatAmount(avgSavings));
    setText('sim-completion-date', projDate);

    const badgeEl = document.getElementById('sim-status-badge');
    if (badgeEl) {
      badgeEl.className = `goal-sim-result__badge ${onTrack ? 'on-track' : 'off-track'}`;
      badgeEl.textContent = onTrack
        ? `✅ You're on track for "${title}"!`
        : `⚠️ You need ₹${formatAmount(needed - avgSavings)} more per month to hit your goal.`;
    }

    if (resultEl) resultEl.hidden = false;
  },
};

/* ==========================================================================
   10. RENDER TRANSACTION LIST
   ========================================================================== */

const TxList = {

  /** Full render of the transaction table */
  render() {
    const tbody      = document.getElementById('tx-table-body');
    const emptyRow   = document.getElementById('tx-empty-state');
    const visibleEl  = document.getElementById('tx-visible-count');
    const totalEl    = document.getElementById('tx-total-count');
    if (!tbody) return;

    const filtered   = Transactions.filtered();
    const page       = Transactions.currentPage();
    const pages      = totalPages();

    // Update counts
    if (visibleEl) visibleEl.textContent = filtered.length.toString();
    if (totalEl)   totalEl.textContent   = State.transactions.length.toString();

    // Empty state
    if (filtered.length === 0) {
      // Remove injected rows
      [...tbody.querySelectorAll('tr.tx-row')].forEach(r => r.remove());
      if (emptyRow) emptyRow.style.display = '';
      this.renderPagination(0, 0);
      return;
    }
    if (emptyRow) emptyRow.style.display = 'none';

    // Build rows
    const html = page.map(tx => this.buildRow(tx)).join('');
    // Replace injected rows
    [...tbody.querySelectorAll('tr.tx-row')].forEach(r => r.remove());
    if (emptyRow) {
      emptyRow.insertAdjacentHTML('beforebegin', html);
    } else {
      tbody.insertAdjacentHTML('beforeend', html);
    }

    this.renderPagination(filtered.length, pages);
  },

  /** Build a single table row HTML string */
  buildRow(tx) {
    const meta   = CATEGORY_META[tx.category] || { label: tx.category, emoji: '📦', color: '#6366f1' };
    const sign   = tx.type === 'income' ? '+' : '−';
    const amtCls = tx.type === 'income' ? 'tx-row__amount--income' : 'tx-row__amount--expense';
    const typeCls= tx.type === 'income' ? 'tx-row__type-badge--income' : 'tx-row__type-badge--expense';
    const dateObj = new Date(tx.date);
    const dateStr = dateObj.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
    const recur  = tx.recurring ? ` <abbr title="Recurring ${tx.recurringInterval || ''}">🔁</abbr>` : '';

    return `
      <tr class="tx-row" data-id="${escapeAttr(tx.id)}">
        <td class="tx-row__date">${dateStr}</td>
        <td>
          <span class="tx-row__desc" title="${escapeAttr(tx.description)}">${escapeHtml(tx.description)}${recur}</span>
        </td>
        <td>
          <span class="tx-row__category-badge" style="border-color:${meta.color}33; color:${meta.color}">
            ${meta.emoji} ${meta.label}
          </span>
        </td>
        <td>
          <span class="tx-row__type-badge ${typeCls}">${capitalise(tx.type)}</span>
        </td>
        <td class="tx-row__amount ${amtCls}">${sign} ${formatAmount(tx.amount)}</td>
        <td>
          <div class="tx-row__actions">
            <button
              class="tx-row__action-btn tx-row__action-btn--delete"
              data-action="delete"
              data-id="${escapeAttr(tx.id)}"
              aria-label="Delete transaction: ${escapeAttr(tx.description)}"
              title="Delete"
            >🗑</button>
          </div>
        </td>
      </tr>
    `;
  },

  /** Render pagination controls */
  renderPagination(total, pages) {
    const prevBtn = document.getElementById('tx-prev-page-btn');
    const nextBtn = document.getElementById('tx-next-page-btn');
    const pagesEl = document.getElementById('tx-page-numbers');
    const cp      = State.ui.currentPage;

    if (prevBtn) prevBtn.disabled = cp <= 1;
    if (nextBtn) nextBtn.disabled = cp >= pages;

    if (!pagesEl) return;
    pagesEl.innerHTML = '';

    if (pages <= 1) return;

    // Show up to 5 page buttons around current page
    const range = getPaginationRange(cp, pages);
    range.forEach(p => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className  = `tx-page-btn${p === cp ? ' active' : ''}`;
      btn.textContent = String(p);
      btn.setAttribute('aria-label', `Page ${p}`);
      if (p === cp) btn.setAttribute('aria-current', 'page');
      btn.addEventListener('click', () => {
        State.ui.currentPage = p;
        TxList.render();
      });
      li.appendChild(btn);
      pagesEl.appendChild(li);
    });
  },
};

/* ==========================================================================
   11. UI MODULE
   ========================================================================== */

const UI = {

  /** Show a toast notification */
  toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'status');
    toast.innerHTML = `
      <span class="toast__icon" aria-hidden="true">${icons[type] || 'ℹ️'}</span>
      <div>
        <p class="toast__title">${escapeHtml(message)}</p>
      </div>
      <button class="toast__close" aria-label="Dismiss notification">×</button>
    `;

    const close = toast.querySelector('.toast__close');
    const dismiss = () => {
      toast.classList.add('removing');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    };
    close.addEventListener('click', dismiss);

    container.appendChild(toast);
    setTimeout(dismiss, 4000);
  },

  /** Open a <dialog> modal */
  openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.showModal?.() || modal.setAttribute('open', '');
  },

  /** Close a <dialog> modal */
  closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.close?.() || modal.removeAttribute('open');
  },

  /** Toggle dark / light theme */
  toggleTheme() {
    const body = document.getElementById('app-body');
    const isDark = body.classList.contains('theme-dark');
    body.classList.toggle('theme-dark', !isDark);
    body.classList.toggle('theme-light', isDark);
    State.settings.theme = isDark ? 'light' : 'dark';
    Storage.save();
  },

  /** Apply saved theme on load */
  applyTheme() {
    const body = document.getElementById('app-body');
    if (State.settings.theme === 'light') {
      body.classList.remove('theme-dark');
      body.classList.add('theme-light');
    } else {
      body.classList.add('theme-dark');
      body.classList.remove('theme-light');
    }
  },

  /** Update currency prefix in the form */
  updateCurrencyPrefix() {
    const sym = currencySymbol();
    setText('currency-prefix', sym);
    // Also update all .form-prefix elements inside cards
    document.querySelectorAll('.form-prefix').forEach(el => {
      el.textContent = sym;
    });
  },

  /** Update footer storage usage */
  updateStorageInfo() {
    const bytes = Storage.getBytesUsed();
    const kb    = (bytes / 1024).toFixed(2);
    setText('storage-used-bytes', `${kb} KB`);
  },

  /** Update year in footer */
  updateFooterYear() {
    setText('footer-year', new Date().getFullYear().toString());
  },

  /** Highlight active navbar link based on scroll position */
  highlightNavLink() {
    const sections = ['hero', 'dashboard', 'add-transaction', 'transactions', 'budget', 'analytics'];
    const scrollY  = window.scrollY + 100;

    let active = 'hero';
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.offsetTop <= scrollY) active = id;
    });

    document.querySelectorAll('.navbar__link').forEach(a => {
      const sec = a.getAttribute('data-section');
      a.classList.toggle('active', sec === active || (sec === 'transactions' && active === 'add-transaction'));
    });
  },

  /** Add scrolled class to navbar */
  handleNavbarScroll() {
    const navbar = document.getElementById('main-navbar');
    if (!navbar) return;
    navbar.classList.toggle('navbar--scrolled', window.scrollY > 20);
  },
};

/* ==========================================================================
   12. FORM MODULE — Validation & Submission
   ========================================================================== */

const Form = {

  /** Read and validate the transaction form */
  submit(e) {
    e.preventDefault();
    if (!Form.validate()) return;

    const data = {
      type:              document.getElementById('tx-type-hidden')?.value      || 'expense',
      amount:            document.getElementById('tx-amount')?.value            || 0,
      category:          document.getElementById('tx-category')?.value          || '',
      date:              document.getElementById('tx-date')?.value               || '',
      description:       document.getElementById('tx-description')?.value        || '',
      recurring:         document.getElementById('tx-recurring')?.checked        || false,
      recurringInterval: document.getElementById('tx-recurring-interval')?.value || null,
    };

    Transactions.add(data);

    // Reset form
    e.target.reset();
    document.getElementById('tx-amount-error').textContent    = '';
    document.getElementById('tx-category-error').textContent  = '';
    document.getElementById('tx-date-error').textContent      = '';
    document.getElementById('tx-recurring-interval').hidden   = true;

    // Reset type toggle to expense
    Form.setType('expense');

    // Set today's date as default
    Form.setDefaultDate();
  },

  /** Validate form fields; returns true if valid */
  validate() {
    let valid = true;

    const amount   = parseFloat(document.getElementById('tx-amount')?.value);
    const category = document.getElementById('tx-category')?.value;
    const date     = document.getElementById('tx-date')?.value;

    // Amount
    if (!amount || amount <= 0) {
      setText('tx-amount-error', 'Please enter a valid amount greater than 0.');
      document.getElementById('tx-amount')?.classList.add('is-invalid');
      valid = false;
    } else {
      setText('tx-amount-error', '');
      document.getElementById('tx-amount')?.classList.remove('is-invalid');
    }

    // Category
    if (!category) {
      setText('tx-category-error', 'Please select a category.');
      document.getElementById('tx-category')?.classList.add('is-invalid');
      valid = false;
    } else {
      setText('tx-category-error', '');
      document.getElementById('tx-category')?.classList.remove('is-invalid');
    }

    // Date
    if (!date) {
      setText('tx-date-error', 'Please select a date.');
      document.getElementById('tx-date')?.classList.add('is-invalid');
      valid = false;
    } else {
      setText('tx-date-error', '');
      document.getElementById('tx-date')?.classList.remove('is-invalid');
    }

    return valid;
  },

  /** Switch the transaction type (income/expense) */
  setType(type) {
    const hidden    = document.getElementById('tx-type-hidden');
    const expBtn    = document.getElementById('type-expense-btn');
    const incBtn    = document.getElementById('type-income-btn');

    if (hidden)  hidden.value                = type;
    if (expBtn) {
      expBtn.classList.toggle('tx-type-toggle__btn--active', type === 'expense');
      expBtn.setAttribute('aria-pressed', String(type === 'expense'));
    }
    if (incBtn) {
      incBtn.classList.toggle('tx-type-toggle__btn--active', type === 'income');
      incBtn.setAttribute('aria-pressed', String(type === 'income'));
    }
  },

  /** Pre-fill date input with today */
  setDefaultDate() {
    const dateInput = document.getElementById('tx-date');
    if (dateInput) dateInput.value = formatDateForInput(new Date());
  },
};

/* ==========================================================================
   13. DATA IMPORT / EXPORT
   ========================================================================== */

const DataIO = {

  /** Export all state data as a JSON file */
  export() {
    const payload = {
      version:      '1.0.0',
      exportedAt:   new Date().toISOString(),
      transactions: State.transactions,
      budgets:      State.budgets,
      settings:     State.settings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `finsim-backup-${formatDateForInput(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    UI.toast('Data exported successfully! 📁', 'success');
  },

  /** Import from a JSON file */
  import(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!Array.isArray(data.transactions)) throw new Error('Invalid format');

        State.transactions = data.transactions;
        State.budgets      = data.budgets      || {};
        if (data.settings) Object.assign(State.settings, data.settings);

        Storage.save();
        renderAll();
        UI.applyTheme();
        UI.toast(`Imported ${data.transactions.length} transactions! 🎉`, 'success');
      } catch {
        UI.toast('Import failed — invalid or corrupted JSON file.', 'error');
      }
    };
    reader.readAsText(file);
  },

  /** Clear all data with confirmation */
  clearAll() {
    Storage.clear();
    State.ui.currentPage = 1;
    renderAll();
    UI.toast('All data cleared.', 'info');
  },
};

/* ==========================================================================
   14. MASTER RENDER
   ========================================================================== */

/** Call all render functions in the correct order */
function renderAll() {
  Dashboard.renderCards();
  Dashboard.renderHeroStats();
  TxList.render();
  Budget.renderBars();
  Charts.renderAll();
  UI.updateStorageInfo();
}

/* ==========================================================================
   15. EVENT WIRING
   ========================================================================== */

function attachEventListeners() {

  /* ── Transaction Form ── */
  document.getElementById('transaction-form')?.addEventListener('submit', Form.submit);
  document.getElementById('tx-form-reset-btn')?.addEventListener('click', () => Form.setDefaultDate());

  /* ── Transaction Type Toggle ── */
  document.getElementById('type-expense-btn')?.addEventListener('click', () => Form.setType('expense'));
  document.getElementById('type-income-btn')?.addEventListener('click', () => Form.setType('income'));

  /* ── Recurring checkbox ── */
  document.getElementById('tx-recurring')?.addEventListener('change', function () {
    const interval = document.getElementById('tx-recurring-interval');
    if (interval) interval.hidden = !this.checked;
  });

  /* ── Transaction Table: Delete / Edit (event delegation) ── */
  document.getElementById('tx-table-body')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id     = btn.dataset.id;
    const action = btn.dataset.action;

    if (action === 'delete') {
      State.ui.pendingDeleteId = id;
      UI.openModal('confirm-delete-modal');
    }
  });

  /* ── Delete Confirmation Modal ── */
  document.getElementById('confirm-delete-confirm')?.addEventListener('click', () => {
    if (State.ui.pendingDeleteId) {
      Transactions.delete(State.ui.pendingDeleteId);
      State.ui.pendingDeleteId = null;
    }
    UI.closeModal('confirm-delete-modal');
  });
  document.getElementById('confirm-delete-cancel')?.addEventListener('click', () => {
    State.ui.pendingDeleteId = null;
    UI.closeModal('confirm-delete-modal');
  });
  document.getElementById('confirm-delete-backdrop')?.addEventListener('click', () => {
    State.ui.pendingDeleteId = null;
    UI.closeModal('confirm-delete-modal');
  });

  /* ── Filters ── */
  document.getElementById('tx-search')?.addEventListener('input', (e) => {
    State.ui.filters.search  = e.target.value;
    State.ui.currentPage     = 1;
    TxList.render();
  });
  document.getElementById('filter-type')?.addEventListener('change', (e) => {
    State.ui.filters.type    = e.target.value;
    State.ui.currentPage     = 1;
    TxList.render();
  });
  document.getElementById('filter-category')?.addEventListener('change', (e) => {
    State.ui.filters.category = e.target.value;
    State.ui.currentPage      = 1;
    TxList.render();
  });
  document.getElementById('filter-date-from')?.addEventListener('change', (e) => {
    State.ui.filters.dateFrom = e.target.value;
    State.ui.currentPage      = 1;
    TxList.render();
  });
  document.getElementById('filter-date-to')?.addEventListener('change', (e) => {
    State.ui.filters.dateTo   = e.target.value;
    State.ui.currentPage      = 1;
    TxList.render();
  });
  document.getElementById('sort-transactions')?.addEventListener('change', (e) => {
    State.ui.filters.sort     = e.target.value;
    TxList.render();
  });
  document.getElementById('clear-filters-btn')?.addEventListener('click', () => {
    State.ui.filters = { search: '', type: 'all', category: 'all', dateFrom: '', dateTo: '', sort: 'date-desc' };
    State.ui.currentPage = 1;
    // Reset filter controls
    ['tx-search','filter-type','filter-category','filter-date-from','filter-date-to'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = el.tagName === 'SELECT' ? 'all' : '';
    });
    document.getElementById('sort-transactions').value = 'date-desc';
    TxList.render();
  });

  /* ── Pagination ── */
  document.getElementById('tx-prev-page-btn')?.addEventListener('click', () => {
    if (State.ui.currentPage > 1) { State.ui.currentPage--; TxList.render(); }
  });
  document.getElementById('tx-next-page-btn')?.addEventListener('click', () => {
    const pages = totalPages();
    if (State.ui.currentPage < pages) { State.ui.currentPage++; TxList.render(); }
  });

  /* ── Dashboard Month Navigation ── */
  document.getElementById('prev-month-btn')?.addEventListener('click', () => Dashboard.navigateMonth(-1));
  document.getElementById('next-month-btn')?.addEventListener('click', () => Dashboard.navigateMonth(+1));

  /* ── Budget ── */
  document.getElementById('set-budget-btn')?.addEventListener('click', () => Budget.openModal());
  document.getElementById('budget-modal-save')?.addEventListener('click', () => Budget.saveFromModal());
  document.getElementById('budget-modal-cancel')?.addEventListener('click', () => UI.closeModal('budget-modal'));
  document.getElementById('budget-modal-close')?.addEventListener('click',  () => UI.closeModal('budget-modal'));
  document.getElementById('budget-modal-backdrop')?.addEventListener('click', () => UI.closeModal('budget-modal'));

  /* ── Goal Simulator ── */
  document.getElementById('goal-simulator-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    GoalSim.simulate();
  });

  /* ── Charts: range / type selectors ── */
  document.getElementById('trend-range-select')?.addEventListener('change', () => Charts.renderTrend());
  document.getElementById('category-chart-month')?.addEventListener('change', () => Charts.renderDonut());
  document.getElementById('daily-chart-type')?.addEventListener('change', () => Charts.renderDaily());

  /* ── Export / Import ── */
  document.getElementById('export-btn')?.addEventListener('click', () => DataIO.export());
  document.getElementById('footer-export-btn')?.addEventListener('click', () => DataIO.export());
  document.getElementById('import-input')?.addEventListener('change', (e) => {
    DataIO.import(e.target.files[0]);
    e.target.value = ''; // reset input
  });
  document.getElementById('clear-all-data-btn')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete ALL your data? This cannot be undone.')) {
      DataIO.clearAll();
    }
  });

  /* ── Theme Toggle ── */
  document.getElementById('theme-toggle-btn')?.addEventListener('click', () => UI.toggleTheme());

  /* ── Currency Selector ── */
  document.getElementById('currency-select')?.addEventListener('change', (e) => {
    State.settings.currency = e.target.value;
    Storage.save();
    UI.updateCurrencyPrefix();
    renderAll();
  });

  /* ── Hamburger ── */
  document.getElementById('hamburger-btn')?.addEventListener('click', function () {
    const expanded = this.getAttribute('aria-expanded') === 'true';
    this.setAttribute('aria-expanded', String(!expanded));
    document.getElementById('navbar-links')?.classList.toggle('is-open', !expanded);
  });

  /* ── Close mobile nav on link click ── */
  document.querySelectorAll('.navbar__link').forEach(link => {
    link.addEventListener('click', () => {
      document.getElementById('navbar-links')?.classList.remove('is-open');
      document.getElementById('hamburger-btn')?.setAttribute('aria-expanded', 'false');
    });
  });

  /* ── Hero CTA: scroll to add-transaction ── */
  document.getElementById('hero-cta-add-tx')?.addEventListener('click', () => {
    document.getElementById('add-transaction')?.scrollIntoView({ behavior: 'smooth' });
  });

  /* ── Scroll Events ── */
  window.addEventListener('scroll', () => {
    UI.handleNavbarScroll();
    UI.highlightNavLink();
  }, { passive: true });

  /* ── Table sort buttons ── */
  document.querySelectorAll('.tx-table__sort-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const key = this.dataset.sort;
      const cur = State.ui.filters.sort;
      if (cur === `${key}-desc`) {
        State.ui.filters.sort = `${key}-asc`;
      } else {
        State.ui.filters.sort = `${key}-desc`;
      }
      TxList.render();
      const sel = document.getElementById('sort-transactions');
      if (sel) sel.value = State.ui.filters.sort;
    });
  });

  /* ── ESC closes open modals ── */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      ['budget-modal', 'edit-tx-modal', 'confirm-delete-modal'].forEach(id => {
        const m = document.getElementById(id);
        if (m?.hasAttribute('open')) UI.closeModal(id);
      });
    }
  });
}

/* ==========================================================================
   16. HELPER UTILITIES
   ========================================================================== */

/** Format a number as currency */
function formatAmount(amount, compact = false) {
  const sym = currencySymbol();
  if (compact) {
    if (Math.abs(amount) >= 100000) return `${sym}${(amount / 100000).toFixed(1)}L`;
    if (Math.abs(amount) >= 1000)   return `${sym}${(amount / 1000).toFixed(1)}K`;
    return `${sym}${amount.toFixed(0)}`;
  }
  return `${sym}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Get current currency symbol */
function currencySymbol() {
  return CURRENCY_SYMBOLS[State.settings.currency] || '₹';
}

/** Get category display label */
function getCategoryLabel(cat) {
  return CATEGORY_META[cat]?.label || cat;
}

/** Get category emoji */
function getCategoryEmoji(cat) {
  return CATEGORY_META[cat]?.emoji || '📦';
}

/** Set text content of an element by ID */
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/** Update income/expense change classes */
function updateChangeClass(id, isPositive) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('summary-card__change--positive', isPositive);
  el.classList.toggle('summary-card__change--negative', !isPositive);
}

/** Format a Date as YYYY-MM-DD for input[type=date] */
function formatDateForInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get a Date offset by months from today, with optional day.
 * Used to generate realistic seed dates.
 */
function getMonthOffset(monthOffset, day = 1) {
  const d = new Date();
  d.setDate(Math.min(day, 28));
  d.setMonth(d.getMonth() + monthOffset);
  return d;
}

/** Number of months between two dates */
function monthsDiff(from, to) {
  return (to.getFullYear() - from.getFullYear()) * 12 +
         (to.getMonth() - from.getMonth());
}

/** Total pages for filtered transaction list */
function totalPages() {
  return Math.ceil(Transactions.filtered().length / ROWS_PER_PAGE) || 1;
}

/** Generate smart pagination range around current page */
function getPaginationRange(current, total) {
  const delta = 2;
  const range = [];
  const left  = Math.max(1, current - delta);
  const right = Math.min(total, current + delta);
  for (let i = left; i <= right; i++) range.push(i);
  return range;
}

/** Capitalise first letter */
function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Escape HTML special characters */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Escape attribute values */
function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ==========================================================================
   17. INIT — Application Bootstrap
   ========================================================================== */

function init() {
  // 1. Load persisted state from localStorage
  Storage.load();

  // 2. Apply saved theme
  UI.applyTheme();

  // 3. Apply saved currency to the selector
  const currSel = document.getElementById('currency-select');
  if (currSel) currSel.value = State.settings.currency;
  UI.updateCurrencyPrefix();

  // 4. Set today's date as default in the form
  Form.setDefaultDate();

  // 5. Set dashboard month to current month
  State.ui.dashboardMonth = new Date();

  // 6. Apply Chart.js global defaults
  applyChartDefaults();

  // 7. Wire all event listeners
  attachEventListeners();

  // 8. Do the initial render of all sections
  renderAll();

  // 9. Footer updates
  UI.updateFooterYear();

  // 10. Initial navbar state
  UI.highlightNavLink();

  console.log(
    '%c💰 FinSim Loaded',
    'color:#818cf8;font-size:16px;font-weight:700;',
    `| ${State.transactions.length} transactions | ${Object.keys(State.budgets).length} budgets`
  );
}

/* --------------------------------------------------------------------------
   Wait for Chart.js to load (it is deferred), then init the app.
   -------------------------------------------------------------------------- */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
