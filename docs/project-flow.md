# 🗺️ Personal Finance Simulator — Project Flow & Architecture

> This document details the internal application flow, component architecture, data lifecycle, and module responsibilities for the Personal Finance Simulator.

---

## 1. Overview

The application is a **Single Page Application (SPA)** built without any framework. The entire UI is rendered and updated through vanilla JavaScript DOM manipulation. State is managed in memory (a JavaScript array/object) and persisted to `localStorage` on every mutation.

---

## 2. File Responsibilities

| File | Role |
|------|------|
| `index.html` | Defines the HTML skeleton: nav, sections (Dashboard, Transactions, Budget, Goals), modals, and form elements |
| `style.css` | All visual styling — layout grids, card components, chart containers, theme variables, animations |
| `script.js` | All logic — state management, CRUD operations, chart rendering, budget calculations, goal simulation, localStorage sync |
| `data/transactions.json` | Seed data loaded on first run to populate a meaningful demo state |

---

## 3. State Management

Application state is stored as a plain JavaScript object in memory:

```js
const AppState = {
  transactions: [],      // Array of transaction objects
  budgets: {},           // { category: limitAmount }
  goals: [],             // Array of goal objects
  settings: {
    currency: "INR",
    theme: "light"
  }
};
```

**State Lifecycle:**

```
App Init
   │
   ▼
Read from localStorage
   │
   ├─── Found ──────► Hydrate AppState from JSON
   │
   └─── Not Found ──► Fetch transactions.json ──► Hydrate AppState
                                                          │
                                                          ▼
                                                  Save to localStorage
```

Every state mutation follows this pattern:

```js
function addTransaction(data) {
  AppState.transactions.push(data);   // 1. Update in-memory state
  saveToLocalStorage();               // 2. Persist to localStorage
  renderAll();                        // 3. Re-render all UI components
}
```

---

## 4. Module Breakdown (within script.js)

The JavaScript file is logically divided into the following modules (using comment blocks or ES module pattern):

### 4.1 Storage Module
- `loadFromLocalStorage()` — Reads and parses saved state
- `saveToLocalStorage()` — Serializes and saves current state

### 4.2 Transaction Module
- `addTransaction(data)` — Validates and appends a new transaction
- `deleteTransaction(id)` — Removes transaction by ID
- `filterTransactions(filters)` — Returns filtered subset (by date, type, category)
- `sortTransactions(key, order)` — Sorts transaction list

### 4.3 Dashboard Module
- `calculateTotals()` — Returns `{ totalIncome, totalExpenses, netBalance }`
- `renderSummaryCards()` — Updates the DOM for the 3 summary cards
- `renderCategoryChart()` — Draws a Chart.js pie/donut chart of expense categories
- `renderTrendChart()` — Draws a Chart.js line chart for monthly income vs. expenses

### 4.4 Budget Module
- `setBudget(category, limit)` — Sets a budget limit for a category
- `getBudgetStatus()` — Returns spent vs. limit for each category
- `renderBudgetBars()` — Updates progress bars and applies warning colors

### 4.5 Goal Simulator Module
- `addGoal(data)` — Creates a new financial goal
- `simulateGoal(goal)` — Calculates months required to hit the target
- `renderGoals()` — Displays goal cards with progress and projected dates

### 4.6 UI / Events Module
- `attachEventListeners()` — Wires all buttons, forms, filters to their handlers
- `showModal(type)` / `closeModal()` — Controls modal visibility
- `toggleTheme()` — Switches dark/light mode
- `renderAll()` — Orchestrates a full re-render of all sections

---

## 5. Data Flow Diagram

```
User Action (e.g., Add Transaction)
         │
         ▼
   Form Validation
   (amount > 0, category selected, date valid)
         │
         ├── FAIL ──► Show inline error message
         │
         └── PASS
                │
                ▼
         AppState.transactions.push(newEntry)
                │
                ▼
         saveToLocalStorage()
         (JSON.stringify → localStorage.setItem)
                │
                ▼
         renderAll()
         ┌──────────────────────────────────┐
         │ renderSummaryCards()             │
         │ renderCategoryChart()            │
         │ renderTrendChart()               │
         │ renderBudgetBars()               │
         │ renderTransactionList()          │
         └──────────────────────────────────┘
```

---

## 6. Chart Rendering Flow

Chart.js is loaded via CDN in `index.html`. Charts are rendered into `<canvas>` elements.

```
calculateTotals() / filterTransactions()
         │
         ▼
   Build Chart Data Object
   { labels: [...], datasets: [{ data: [...] }] }
         │
         ▼
   new Chart(canvasCtx, config)
   OR
   existingChart.data = newData
   existingChart.update()
```

Chart instances are stored in module-level variables to enable updates without full re-creation.

---

## 7. Budget Alert Logic

```js
function renderBudgetBars() {
  for (const [category, limit] of Object.entries(AppState.budgets)) {
    const spent = getSpentForCategory(category);
    const percent = Math.min((spent / limit) * 100, 100);

    progressBar.style.width = `${percent}%`;

    if (percent >= 100) {
      progressBar.classList.add("over-budget");   // Red
    } else if (percent >= 80) {
      progressBar.classList.add("near-budget");   // Yellow/Orange
    } else {
      progressBar.classList.add("on-track");      // Green
    }
  }
}
```

---

## 8. Goal Simulation Logic

```js
function simulateGoal(goal) {
  const { targetAmount, currentAmount, targetDate } = goal;
  const remaining = targetAmount - currentAmount;
  const monthsLeft = getMonthsDiff(new Date(), new Date(targetDate));
  const requiredMonthlySavings = remaining / monthsLeft;
  const avgMonthlySavings = getAverageMonthlyNetSavings(); // from transactions

  return {
    requiredMonthlySavings,
    avgMonthlySavings,
    isOnTrack: avgMonthlySavings >= requiredMonthlySavings,
    projectedCompletionDate: calculateProjectedDate(remaining, avgMonthlySavings)
  };
}
```

---

## 9. Export / Import Flow

### Export
```
User clicks "Export Data"
         │
         ▼
JSON.stringify(AppState)
         │
         ▼
Create Blob → Create anchor tag with download attribute
         │
         ▼
Trigger click → Browser downloads "finance-data.json"
```

### Import
```
User selects .json file via <input type="file">
         │
         ▼
FileReader.readAsText(file)
         │
         ▼
JSON.parse(result)
         │
         ├── FAIL ──► Show error: "Invalid file format"
         │
         └── PASS ──► Overwrite AppState
                              │
                              ▼
                       saveToLocalStorage()
                              │
                              ▼
                         renderAll()
```

---

## 10. Responsive Design Strategy

| Breakpoint | Layout |
|------------|--------|
| `< 480px` | Single column, stacked cards, minimal chart |
| `481px – 768px` | Two-column card grid, compact nav |
| `769px – 1024px` | Three-column grid, side-by-side charts |
| `> 1024px` | Full dashboard layout with sidebar navigation |

CSS Grid and Flexbox are used throughout. Media queries in `style.css` handle all breakpoints.

---

## 11. Event Handling Map

| UI Element | Event | Handler |
|------------|-------|---------|
| Add Transaction Button | `click` | `openAddTransactionModal()` |
| Transaction Form Submit | `submit` | `addTransaction()` |
| Delete Transaction Icon | `click` | `deleteTransaction(id)` |
| Category Filter Dropdown | `change` | `filterTransactions()` |
| Date Range Picker | `change` | `filterTransactions()` |
| Set Budget Button | `click` | `setBudget()` |
| Add Goal Button | `click` | `openAddGoalModal()` |
| Export Button | `click` | `exportData()` |
| Import Input | `change` | `importData()` |
| Theme Toggle | `click` | `toggleTheme()` |

---

*Last Updated: July 2026 — Daksh Bhasin*
