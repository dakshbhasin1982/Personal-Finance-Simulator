# 💰 Personal Finance Simulator

> A browser-based interactive personal finance management tool that helps users track income, expenses, budgets, and financial goals — all without a backend.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Objectives](#3-objectives)
4. [Target Users](#4-target-users)
5. [Features](#5-features)
6. [Tech Stack](#6-tech-stack)
7. [Folder Structure](#7-folder-structure)
8. [Application Flow](#8-application-flow)
9. [Database Structure (Future)](#9-database-structure-future)
10. [Future Improvements](#10-future-improvements)
11. [Resume Description](#11-resume-description)

---

## 1. Project Overview

The **Personal Finance Simulator** is a fully client-side web application designed to empower individuals to take control of their financial lives. Built with vanilla HTML, CSS, and JavaScript, it provides an intuitive interface to:

- Log and categorize daily income and expenses
- Visualize spending patterns through interactive charts
- Set and monitor monthly budgets per category
- Simulate financial goals such as savings targets or debt payoff timelines
- Persist all data locally in the browser using `localStorage`

This project is intentionally lightweight — no server, no database, no sign-up required. It runs entirely in the browser, making it portable, private, and instantly accessible.

---

## 2. Problem Statement

Millions of people struggle with managing their personal finances not because they lack resources, but because existing tools are either:

- **Too complex** — requiring account linking, subscriptions, or steep learning curves (e.g., Mint, YNAB)
- **Too basic** — offering no meaningful insights beyond simple spreadsheets
- **Privacy-invasive** — requiring sensitive banking credentials or personal information
- **Not accessible** — restricted to specific platforms or operating systems

There is a clear gap for a **simple, private, and educational** tool that helps users understand their cash flow, identify poor spending habits, and simulate the impact of better financial decisions — all without leaving their browser.

---

## 3. Objectives

| # | Objective |
|---|-----------|
| 1 | Provide a clean, distraction-free interface for logging daily financial transactions |
| 2 | Automatically categorize and summarize income vs. expenses |
| 3 | Enable users to set monthly spending budgets per category and receive visual alerts |
| 4 | Display interactive charts to visualize spending trends over time |
| 5 | Allow users to simulate financial scenarios (e.g., "What if I save ₹5,000/month?") |
| 6 | Persist all data securely on the client-side using `localStorage` or JSON export |
| 7 | Maintain a fully responsive UI that works seamlessly on mobile and desktop |
| 8 | Serve as an educational tool to build healthy financial habits |

---

## 4. Target Users

| Persona | Description |
|---------|-------------|
| 🎓 **College Students** | Managing a limited stipend or part-time income for the first time |
| 👩‍💼 **Young Professionals** | Early in their careers wanting to build savings habits |
| 👨‍👩‍👧 **Small Families** | Households tracking shared income and joint expenses |
| 🧑‍💻 **Developers / Learners** | Using the project as a reference for frontend JavaScript architecture |
| 📊 **Finance Enthusiasts** | Individuals interested in visualizing and optimizing their money flow |

---

## 5. Features

### ✅ Core Features (MVP)

- **Transaction Logger** — Add income or expense entries with amount, date, category, and description
- **Dashboard Summary** — At-a-glance cards showing total income, total expenses, and net balance
- **Category Breakdown** — Pie or donut chart showing expense distribution by category
- **Monthly Budget Tracker** — Set budget limits per category; progress bars turn red when limits are breached
- **Transaction History** — Filterable and sortable list of all past transactions
- **Data Persistence** — All data stored in browser `localStorage`; survives page refresh
- **JSON Export / Import** — Download your data as a `.json` file or upload a previous session

### 🔧 Extended Features

- **Financial Goal Simulator** — Define a savings goal and see a projected timeline based on current net savings
- **Recurring Transactions** — Mark transactions (e.g., rent, salary) as recurring monthly entries
- **Monthly Trend Chart** — Line chart comparing income vs. expenses across the last 6 months
- **Currency Selector** — Toggle between INR (₹), USD ($), EUR (€), etc.
- **Dark Mode** — Full dark/light theme toggle
- **Responsive Design** — Mobile-first layout for on-the-go use

---

## 6. Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Structure** | HTML5 | Semantic page layout and DOM structure |
| **Styling** | CSS3 (Vanilla) | Responsive design, animations, theming |
| **Logic** | JavaScript (ES6+) | Application state, DOM manipulation, calculations |
| **Charts** | Chart.js (CDN) | Pie, donut, and line chart rendering |
| **Storage** | Browser `localStorage` | Client-side data persistence |
| **Icons** | Custom SVG / PNG icons | UI iconography (stored in `Assets/icons/`) |
| **Data Format** | JSON | Transaction data structure and import/export |

> **No frameworks. No build tools. No dependencies to install.** Open `index.html` in any modern browser and it works.

---

## 7. Folder Structure

```
Personal Finance Simulator/
│
├── index.html                  # Main application entry point (single-page app)
├── style.css                   # Global styles, themes, animations
├── script.js                   # Core application logic and event handlers
│
├── data/
│   └── transactions.json       # Sample/seed transaction data for demo mode
│
├── docs/
│   ├── project-flow.md         # Detailed application flow and architecture notes
│   └── README.md               # (This file) Full project documentation
│
└── Assets/
    ├── icons/                  # SVG and PNG icons used in the UI
    └── images/                 # Screenshots, banners, and illustrative images
```

---

## 8. Application Flow

```
┌─────────────────────────────────────────────────────┐
│                    USER OPENS APP                   │
└─────────────────────────┬───────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│              INITIALIZATION (script.js)             │
│  • Load transactions from localStorage              │
│  • If empty → load seed data from transactions.json │
│  • Render Dashboard, Charts, Budget, History        │
└─────────────────────────┬───────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
   ┌─────────────┐ ┌────────────┐ ┌─────────────────┐
   │  ADD        │ │  VIEW      │ │  SIMULATE       │
   │ Transaction │ │ Dashboard  │ │  Financial Goal │
   └──────┬──────┘ └─────┬──────┘ └────────┬────────┘
          │              │                  │
          ▼              ▼                  ▼
   Validate Input   Recalculate        Calculate
   → Save to        Totals &           Savings
   localStorage     Re-render          Timeline
          │         Charts             & Milestones
          │              │                  │
          └──────────────┴──────────────────┘
                          │
                          ▼
          ┌───────────────────────────────┐
          │     EXPORT / IMPORT DATA      │
          │  • Download as .json file     │
          │  • Upload .json to restore    │
          └───────────────────────────────┘
```

### Step-by-Step Flow

1. **App Launch** — `index.html` loads `style.css` and `script.js`. The JS initializes state by reading from `localStorage`.
2. **Data Seeding** — If no prior session exists, `transactions.json` provides sample data to populate the UI with meaningful demo content.
3. **Dashboard Render** — Summary cards (Total Income, Total Expenses, Net Balance) and charts are computed and rendered immediately.
4. **Add Transaction** — User fills out a form (amount, type, category, date, note) → JS validates input → appends to state array → saves to `localStorage` → updates all UI components reactively.
5. **Budget Check** — After each transaction, category totals are compared against user-set budget limits. Progress bars and color-coded alerts update automatically.
6. **Goal Simulation** — User inputs a target savings amount and deadline → JS calculates required monthly savings and projects the timeline using current net balance data.
7. **Export / Import** — User can download all transactions as a `.json` file for backup, or upload a file to restore a previous session.

---

## 9. Database Structure (Future)

When this project evolves to include a backend (e.g., Node.js + Express + MongoDB or Supabase), the following schema is proposed:

### `users` Collection

```json
{
  "_id": "ObjectId",
  "name": "Daksh Bhasin",
  "email": "daksh@example.com",
  "passwordHash": "bcrypt_hash",
  "currency": "INR",
  "createdAt": "2026-07-20T00:00:00Z",
  "updatedAt": "2026-07-20T00:00:00Z"
}
```

### `transactions` Collection

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: users)",
  "type": "income | expense",
  "amount": 5000,
  "category": "Food | Rent | Salary | Entertainment | ...",
  "description": "Monthly grocery run",
  "date": "2026-07-15",
  "isRecurring": false,
  "recurringInterval": "monthly | weekly | null",
  "createdAt": "2026-07-20T00:00:00Z"
}
```

### `budgets` Collection

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: users)",
  "month": "2026-07",
  "categories": {
    "Food": 8000,
    "Rent": 15000,
    "Entertainment": 3000,
    "Transport": 2000
  },
  "createdAt": "2026-07-01T00:00:00Z"
}
```

### `goals` Collection

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: users)",
  "title": "Emergency Fund",
  "targetAmount": 100000,
  "currentAmount": 25000,
  "targetDate": "2027-01-01",
  "status": "active | completed | paused",
  "createdAt": "2026-07-20T00:00:00Z"
}
```

---

## 10. Future Improvements

| Priority | Feature | Description |
|----------|---------|-------------|
| 🔴 High | **User Authentication** | Login / Sign-up with JWT-based auth to sync data across devices |
| 🔴 High | **Cloud Storage Backend** | Node.js + MongoDB / Supabase to persist data server-side |
| 🟡 Medium | **AI Spending Insights** | Use an LLM API to generate natural-language financial advice based on spending patterns |
| 🟡 Medium | **Bank Statement Import** | Parse CSV exports from Indian banks (HDFC, SBI, ICICI) and auto-import transactions |
| 🟡 Medium | **Notifications / Reminders** | Browser push notifications for budget overruns and bill due dates |
| 🟡 Medium | **Multi-Currency Support** | Real-time exchange rates via a public API (e.g., ExchangeRate-API) |
| 🟢 Low | **PWA (Progressive Web App)** | Add a service worker and manifest for offline-first usage and home screen installation |
| 🟢 Low | **Shared Budgets** | Collaborative budgets for couples or roommates sharing expenses |
| 🟢 Low | **Tax Estimation Module** | Estimate annual tax liability based on Indian income tax slabs |
| 🟢 Low | **Gamification** | Badges and streak rewards for maintaining budgets and hitting savings goals |

---

## 11. Resume Description

> **Personal Finance Simulator** | HTML · CSS · JavaScript · Chart.js · localStorage
>
> Developed a fully client-side personal finance management web application enabling users to log, categorize, and visualize income and expenses in real time. Implemented interactive dashboards with Chart.js for category-wise expense breakdowns and monthly trend analysis. Built a budget tracking system with dynamic progress indicators and threshold alerts. Integrated a financial goal simulator that projects savings timelines based on current net balance. Utilized browser `localStorage` for seamless data persistence with JSON export/import functionality — achieving a zero-backend architecture that requires no installation or sign-up.

---

## Getting Started

```bash
# No installation required.
# Simply open the project folder and launch:
open index.html
# or double-click index.html in your file explorer
```

---

## License

This project is open-source and available under the [MIT License](LICENSE).

---

*Built with ❤️ by Daksh Bhasin — July 2026*
