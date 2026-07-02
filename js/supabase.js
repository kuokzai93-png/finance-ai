/**
 * supabase.js
 * ------------------------------------------------------------------
 * Data-access module for the Finance AI dashboard.
 * Reads from existing tables: transactions, bank_accounts, categories.
 * Does not create, alter, or drop any table.
 *
 * SCHEMA ASSUMPTION NOTICE
 * ------------------------------------------------------------------
 * The exact column names of transactions / bank_accounts / categories
 * were not provided. The COLUMNS map below is the single place that
 * assumes column names. If a query fails or returns empty data,
 * verify your actual column names in Supabase Table Editor and update
 * ONLY the COLUMNS object — no other code needs to change.
 *
 * Assumed schema:
 *   bank_accounts: id, name, balance
 *   categories:    id, name, color, type ('income' | 'expense')
 *   transactions:  id, account_id, category_id, merchant, amount,
 *                  type ('income' | 'expense'), date
 *
 * There is no "repayments" table in the current schema, so the
 * Upcoming Repayments card still uses placeholder data (clearly
 * marked below) until that table exists.
 * ------------------------------------------------------------------
 */

const SupabaseAPI = (function () {
  "use strict";

  const COLUMNS = {
    accounts: {
      table: "bank_accounts",
      id: "id",
      name: "name",
      balance: "balance"
    },
    categories: {
      table: "categories",
      id: "id",
      name: "name",
      color: "color",
      type: "type"
    },
    transactions: {
      table: "transactions",
      id: "id",
      accountId: "account_id",
      categoryId: "category_id",
      merchant: "merchant",
      amount: "amount",
      type: "type",
      date: "date"
    }
  };

  // Placeholder only — no "repayments" table exists yet.
  const REPAYMENTS_PLACEHOLDER = [
    { name: "Home Loan — DBS",    icon: "🏠", dueLabel: "Due in 3 days",  dueSoon: true,  amount: 1450.00 },
    { name: "Car Loan — Maybank", icon: "🚗", dueLabel: "Due in 9 days",  dueSoon: false, amount: 620.50 },
    { name: "Visa Credit Card",   icon: "💳", dueLabel: "Due in 14 days", dueSoon: false, amount: 380.20 },
    { name: "Personal Loan",      icon: "📄", dueLabel: "Due in 27 days", dueSoon: false, amount: 250.00 }
  ];

  let client = null;

  function getClient() {
    if (client) return client;
    if (typeof supabase === "undefined") {
      throw new Error("Supabase JS SDK not loaded. Check the CDN <script> tag in index.html.");
    }
    client = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    return client;
  }

  async function fetchAll(tableConfig) {
    const db = getClient();
    const { data, error } = await db.from(tableConfig.table).select("*");
    if (error) throw new Error(`Failed to load "${tableConfig.table}": ${error.message}`);
    return data || [];
  }

  function isIncomeRow(row) {
    const c = COLUMNS.transactions;
    if (row[c.type]) return row[c.type] === "income";
    return Number(row[c.amount]) > 0;
  }

  function monthKey(dateStr) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${d.getMonth()}`;
  }

  function isSameMonth(dateStr, ref) {
    const d = new Date(dateStr);
    return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
  }

  function shiftMonth(ref, offset) {
    return new Date(ref.getFullYear(), ref.getMonth() + offset, 1);
  }

  function sumAmount(rows) {
    const c = COLUMNS.transactions;
    return rows.reduce((total, row) => total + Math.abs(Number(row[c.amount]) || 0), 0);
  }

  function pctChange(current, previous) {
    if (!previous) return { pct: 0, direction: "up" };
    const diff = current - previous;
    return {
      pct: Math.round((Math.abs(diff) / previous) * 1000) / 10,
      direction: diff >= 0 ? "up" : "down"
    };
  }

  /**
   * Loads accounts, categories, and transactions, then derives every
   * value the dashboard renders. Returns a plain object with the same
   * shape as the previous dummy DASHBOARD_DATA, so dashboard.js only
   * needed to change its data source, not its render logic.
   */
  async function fetchDashboardData() {
    const c = COLUMNS.transactions;

    const [accounts, categories, transactions] = await Promise.all([
      fetchAll(COLUMNS.accounts),
      fetchAll(COLUMNS.categories),
      fetchAll(COLUMNS.transactions)
    ]);

    const categoryById = new Map(categories.map((cat) => [cat[COLUMNS.categories.id], cat]));

    const now = new Date();
    const prevMonthRef = shiftMonth(now, -1);

    const currentMonthTxns = transactions.filter((t) => isSameMonth(t[c.date], now));
    const prevMonthTxns = transactions.filter((t) => isSameMonth(t[c.date], prevMonthRef));

    const currIncome = sumAmount(currentMonthTxns.filter(isIncomeRow));
    const currExpense = sumAmount(currentMonthTxns.filter((t) => !isIncomeRow(t)));
    const prevIncome = sumAmount(prevMonthTxns.filter(isIncomeRow));
    const prevExpense = sumAmount(prevMonthTxns.filter((t) => !isIncomeRow(t)));

    const incomeChange = pctChange(currIncome, prevIncome);
    const expenseChange = pctChange(currExpense, prevExpense);
    const savingsChange = pctChange(currIncome - currExpense, prevIncome - prevExpense);

    const totalBalance = accounts.reduce(
      (sum, acc) => sum + (Number(acc[COLUMNS.accounts.balance]) || 0),
      0
    );

    // ---- Expense by category (current month) ----
    const categoryTotals = new Map();
    currentMonthTxns.filter((t) => !isIncomeRow(t)).forEach((t) => {
      const cat = categoryById.get(t[c.categoryId]);
      const name = cat ? cat[COLUMNS.categories.name] : "Uncategorized";
      const color = cat ? cat[COLUMNS.categories.color] : "#B7B6B0";
      const key = name;
      const existing = categoryTotals.get(key) || { name, color, value: 0 };
      existing.value += Math.abs(Number(t[c.amount]) || 0);
      categoryTotals.set(key, existing);
    });
    const categoriesOut = Array.from(categoryTotals.values()).sort((a, b) => b.value - a.value);

    // ---- 6-month income/expense trend ----
    const trendMonths = [];
    for (let i = 5; i >= 0; i--) trendMonths.push(shiftMonth(now, -i));

    const trendLabels = trendMonths.map((d) => d.toLocaleDateString("en-US", { month: "short" }));
    const trendIncome = trendMonths.map((refDate) =>
      sumAmount(transactions.filter((t) => isSameMonth(t[c.date], refDate) && isIncomeRow(t)))
    );
    const trendExpense = trendMonths.map((refDate) =>
      sumAmount(transactions.filter((t) => isSameMonth(t[c.date], refDate) && !isIncomeRow(t)))
    );

    // ---- Recent transactions (7 most recent by date) ----
    const accountById = new Map(accounts.map((acc) => [acc[COLUMNS.accounts.id], acc]));
    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b[c.date]) - new Date(a[c.date]))
      .slice(0, 7)
      .map((t) => {
        const cat = categoryById.get(t[c.categoryId]);
        const acc = accountById.get(t[c.accountId]);
        const signedAmount = isIncomeRow(t)
          ? Math.abs(Number(t[c.amount]))
          : -Math.abs(Number(t[c.amount]));
        return {
          merchant: t[c.merchant] || (acc ? acc[COLUMNS.accounts.name] : "Unknown"),
          logo: (t[c.merchant] || "TX").slice(0, 2).toUpperCase(),
          color: cat ? cat[COLUMNS.categories.color] : "#B7B6B0",
          category: cat ? cat[COLUMNS.categories.name] : "Uncategorized",
          date: new Date(t[c.date]).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric"
          }),
          amount: signedAmount
        };
      });

    return {
      summary: {
        totalBalance:   { value: totalBalance, deltaPct: null,             direction: null },
        monthlyIncome:  { value: currIncome,   deltaPct: incomeChange.pct,  direction: incomeChange.direction },
        monthlyExpense: { value: currExpense,  deltaPct: expenseChange.pct, direction: expenseChange.direction },
        savings:        { value: currIncome - currExpense, deltaPct: savingsChange.pct, direction: savingsChange.direction }
      },
      trend: { labels: trendLabels, income: trendIncome, expense: trendExpense },
      categories: categoriesOut,
      repayments: REPAYMENTS_PLACEHOLDER,
      transactions: recentTransactions
    };
  }

  return { fetchDashboardData };
})();
