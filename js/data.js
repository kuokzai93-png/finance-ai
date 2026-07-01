/**
 * data.js
 * ------------------------------------------------------------------
 * Dummy data source for the Finance AI dashboard.
 * No network calls, no Supabase. Replace this module later with a
 * real data-access layer once backend integration is approved.
 * ------------------------------------------------------------------
 */

const DASHBOARD_DATA = {

  summary: {
    totalBalance:   { value: 48250.32, deltaPct: 4.2,  direction: "up" },
    monthlyIncome:  { value: 9200.00,  deltaPct: 2.1,  direction: "up" },
    monthlyExpense: { value: 5430.75,  deltaPct: 6.4,  direction: "down" },
    savings:        { value: 3769.25,  deltaPct: 12.8, direction: "up" }
  },

  trend: {
    labels: ["Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    income:  [7800, 8100, 8600, 8900, 8950, 9200],
    expense: [5200, 5600, 4900, 6100, 5800, 5431]
  },

  categories: [
    { name: "Housing",       value: 1800, color: "#2F6FED" },
    { name: "Food & Dining", value: 980,  color: "#1B9E6B" },
    { name: "Transport",     value: 420,  color: "#C97A1A" },
    { name: "Shopping",      value: 650,  color: "#7C5CFC" },
    { name: "Utilities",     value: 310,  color: "#E5484D" },
    { name: "Other",         value: 1270.75, color: "#B7B6B0" }
  ],

  repayments: [
    { name: "Home Loan — DBS",        icon: "🏠", dueLabel: "Due in 3 days",  dueSoon: true,  amount: 1450.00 },
    { name: "Car Loan — Maybank",     icon: "🚗", dueLabel: "Due in 9 days",  dueSoon: false, amount: 620.50 },
    { name: "Visa Credit Card",       icon: "💳", dueLabel: "Due in 14 days", dueSoon: false, amount: 380.20 },
    { name: "Personal Loan",          icon: "📄", dueLabel: "Due in 27 days", dueSoon: false, amount: 250.00 }
  ],

  transactions: [
    { merchant: "Whole Foods Market",  logo: "WF", color: "#1B9E6B", category: "Food & Dining", date: "Jun 28, 2026", amount: -86.40 },
    { merchant: "Grab Transport",      logo: "GB", color: "#C97A1A", category: "Transport",     date: "Jun 27, 2026", amount: -18.90 },
    { merchant: "Salary — Acme Corp",  logo: "AC", color: "#2F6FED", category: "Income",         date: "Jun 25, 2026", amount: 9200.00 },
    { merchant: "Netflix",             logo: "NF", color: "#E5484D", category: "Subscriptions", date: "Jun 24, 2026", amount: -17.99 },
    { merchant: "IKEA",                logo: "IK", color: "#7C5CFC", category: "Shopping",       date: "Jun 22, 2026", amount: -212.30 },
    { merchant: "Starbucks",           logo: "SB", color: "#1B9E6B", category: "Food & Dining", date: "Jun 21, 2026", amount: -9.50 },
    { merchant: "SP Utilities",        logo: "SP", color: "#B7B6B0", category: "Utilities",      date: "Jun 20, 2026", amount: -145.00 }
  ]
};
