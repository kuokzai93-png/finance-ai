/**
 * dashboard.js
 * ------------------------------------------------------------------
 * Renders the Finance AI dashboard using live Supabase data
 * (see supabase.js). Handles loading and error states.
 * ------------------------------------------------------------------
 */

(function () {
  "use strict";

  const currency = (n) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  const signedCurrency = (n) => (n > 0 ? "+" : "") + currency(n);

  /* ---------------------------------------------------------------
   * Today label
   * --------------------------------------------------------------- */
  function renderTodayLabel() {
    const el = document.getElementById("todayLabel");
    if (!el) return;
    const today = new Date();
    el.textContent = today.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  }

  /* ---------------------------------------------------------------
   * Loading skeletons
   * --------------------------------------------------------------- */
  function showLoadingState() {
    const statGrid = document.getElementById("statGrid");
    if (statGrid) {
      statGrid.innerHTML = Array.from({ length: 5 })
        .map(() => `
          <div class="stat-card">
            <div class="skeleton skeleton-icon"></div>
            <div class="skeleton skeleton-line" style="width:60%"></div>
            <div class="skeleton skeleton-line" style="width:80%; height:20px;"></div>
            <div class="skeleton skeleton-line" style="width:50%"></div>
          </div>`)
        .join("");
    }

    const repaymentList = document.getElementById("repaymentList");
    if (repaymentList) {
      repaymentList.innerHTML = Array.from({ length: 4 })
        .map(() => `<li><div class="skeleton skeleton-icon" style="border-radius:10px;"></div>
          <div class="repay-info"><div class="skeleton skeleton-line" style="width:70%"></div>
          <div class="skeleton skeleton-line" style="width:40%"></div></div></li>`)
        .join("");
    }

    const txnBody = document.getElementById("transactionBody");
    if (txnBody) {
      txnBody.innerHTML = Array.from({ length: 5 })
        .map(() => `<tr><td colspan="4"><div class="skeleton skeleton-line" style="width:100%; height:18px;"></div></td></tr>`)
        .join("");
    }

    const legend = document.getElementById("categoryLegend");
    if (legend) {
      legend.innerHTML = Array.from({ length: 4 })
        .map(() => `<li><div class="skeleton skeleton-line" style="width:100%"></div></li>`)
        .join("");
    }
  }

  /* ---------------------------------------------------------------
   * Error banner
   * --------------------------------------------------------------- */
  function showErrorState(message, onRetry) {
    const content = document.querySelector(".content");
    if (!content) return;

    let banner = document.getElementById("errorBanner");
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "errorBanner";
      banner.className = "error-banner";
      content.prepend(banner);
    }

    banner.innerHTML = `
      <span>Unable to load dashboard data: ${message}</span>
      <button class="btn-retry" id="retryBtn">Retry</button>
    `;

    document.getElementById("retryBtn").addEventListener("click", onRetry);

    ["statGrid", "repaymentList", "transactionBody", "categoryLegend"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = "";
    });
  }

  function clearErrorState() {
    const banner = document.getElementById("errorBanner");
    if (banner) banner.remove();
  }

  /* ---------------------------------------------------------------
   * Stat cards
   * --------------------------------------------------------------- */
  const STAT_CONFIG = [
    { key: "totalBalance",   label: "Total Balance",   icon: "wallet",    tone: "blue" },
    { key: "monthlyIncome",  label: "Monthly Income",  icon: "arrowUp",   tone: "green" },
    { key: "monthlyExpense", label: "Monthly Expense", icon: "arrowDown", tone: "red" },
    { key: "savings",        label: "Savings",         icon: "piggy",     tone: "purple" }
  ];

  const ICONS = {
    wallet: '<path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><rect x="3" y="7" width="18" height="12" rx="2" stroke="currentColor" stroke-width="1.8"/><circle cx="16" cy="13" r="1.4" fill="currentColor"/>',
    arrowUp: '<path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    arrowDown: '<path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    piggy: '<path d="M4 12a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1h1.2a.8.8 0 0 1 .7 1.2l-1 1.7a.8.8 0 0 1-.7.4H18v1a2 2 0 0 1-2 2h-1v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5V19H9v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5V18a5 5 0 0 1-2-4v-2Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="15" cy="10.5" r="0.9" fill="currentColor"/>'
  };

  function renderStatCards(data) {
    const grid = document.getElementById("statGrid");
    if (!grid) return;

    const cardsHtml = STAT_CONFIG.map((cfg) => {
      const d = data.summary[cfg.key];
      const deltaHtml = d.deltaPct === null
        ? `<span class="stat-delta up" style="background:var(--bg); color:var(--text-tertiary);">Current balance</span>`
        : `<span class="stat-delta ${d.direction === "up" ? "up" : "down"}">${d.direction === "up" ? "▲" : "▼"} ${d.deltaPct}% vs last month</span>`;

      return `
        <div class="stat-card">
          <div class="stat-icon ${cfg.tone}">
            <svg viewBox="0 0 24 24" fill="none">${ICONS[cfg.icon]}</svg>
          </div>
          <div class="stat-label">${cfg.label}</div>
          <div class="stat-value">${currency(d.value)}</div>
          ${deltaHtml}
        </div>`;
    }).join("");

    const nextRepayment = data.repayments[0];
    const repaymentCard = nextRepayment ? `
      <div class="stat-card">
        <div class="stat-icon amber">
          <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M3 10h18" stroke="currentColor" stroke-width="1.8"/></svg>
        </div>
        <div class="stat-label">Next Repayment</div>
        <div class="stat-value">${currency(nextRepayment.amount)}</div>
        <span class="stat-delta down">${nextRepayment.dueLabel}</span>
      </div>` : "";

    grid.innerHTML = cardsHtml + repaymentCard;
  }

  /* ---------------------------------------------------------------
   * Repayments list (placeholder data — no table yet, see supabase.js)
   * --------------------------------------------------------------- */
  function renderRepayments(data) {
    const list = document.getElementById("repaymentList");
    if (!list) return;

    if (!data.repayments.length) {
      list.innerHTML = `<li class="empty-state">No upcoming repayments.</li>`;
      return;
    }

    list.innerHTML = data.repayments.map((r) => `
      <li>
        <div class="repay-icon">${r.icon}</div>
        <div class="repay-info">
          <div class="repay-name">${r.name}</div>
          <div class="repay-due ${r.dueSoon ? "due-soon" : ""}">${r.dueLabel}</div>
        </div>
        <div class="repay-amount">${currency(r.amount)}</div>
      </li>
    `).join("");
  }

  /* ---------------------------------------------------------------
   * Transactions table
   * --------------------------------------------------------------- */
  function categoryTone(color) {
    return { bg: `${color}1A`, fg: color };
  }

  function renderTransactions(data) {
    const body = document.getElementById("transactionBody");
    if (!body) return;

    if (!data.transactions.length) {
      body.innerHTML = `<tr><td colspan="4" class="empty-state">No transactions found.</td></tr>`;
      return;
    }

    body.innerHTML = data.transactions.map((t) => {
      const tone = categoryTone(t.color || "#6F6E69");
      const isPositive = t.amount > 0;
      return `
        <tr>
          <td>
            <div class="txn-merchant">
              <div class="txn-logo" style="background:${t.color}22; color:${t.color};">${t.logo}</div>
              ${t.merchant}
            </div>
          </td>
          <td><span class="category-pill" style="background:${tone.bg}; color:${tone.fg};">${t.category}</span></td>
          <td>${t.date}</td>
          <td class="align-right txn-amount ${isPositive ? "positive" : "negative"}">
            ${isPositive ? signedCurrency(t.amount) : currency(t.amount)}
          </td>
        </tr>`;
    }).join("");
  }

  /* ---------------------------------------------------------------
   * Category legend (paired with donut chart)
   * --------------------------------------------------------------- */
  function renderCategoryLegend(data) {
    const legend = document.getElementById("categoryLegend");
    if (!legend) return;

    if (!data.categories.length) {
      legend.innerHTML = `<li class="empty-state">No expenses recorded this month.</li>`;
      return;
    }

    legend.innerHTML = data.categories.map((c) => `
      <li>
        <span class="cat-name"><i class="swatch" style="background:${c.color}"></i>${c.name}</span>
        <span class="cat-value">${currency(c.value)}</span>
      </li>
    `).join("");
  }

  /* ---------------------------------------------------------------
   * Charts
   * --------------------------------------------------------------- */
  let trendChartInstance = null;
  let categoryChartInstance = null;

  function renderTrendChart(data) {
    const ctx = document.getElementById("trendChart");
    if (!ctx || typeof Chart === "undefined") return;
    if (trendChartInstance) trendChartInstance.destroy();

    trendChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.trend.labels,
        datasets: [
          {
            label: "Income",
            data: data.trend.income,
            borderColor: "#1B9E6B",
            backgroundColor: "rgba(27,158,107,0.08)",
            tension: 0.35,
            fill: true,
            pointRadius: 0,
            borderWidth: 2.5
          },
          {
            label: "Expense",
            data: data.trend.expense,
            borderColor: "#E5484D",
            backgroundColor: "rgba(229,72,77,0.06)",
            tension: 0.35,
            fill: true,
            pointRadius: 0,
            borderWidth: 2.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#1B1B18",
            padding: 10,
            cornerRadius: 8,
            callbacks: { label: (item) => `${item.dataset.label}: ${currency(item.parsed.y)}` }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: "#9B9A94", font: { size: 11.5 } } },
          y: {
            grid: { color: "#F0EFEB" },
            border: { display: false },
            ticks: { color: "#9B9A94", font: { size: 11.5 }, callback: (v) => "$" + v / 1000 + "k" }
          }
        }
      }
    });
  }

  function renderCategoryChart(data) {
    const ctx = document.getElementById("categoryChart");
    if (!ctx || typeof Chart === "undefined") return;
    if (categoryChartInstance) categoryChartInstance.destroy();

    categoryChartInstance = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: data.categories.map((c) => c.name),
        datasets: [{
          data: data.categories.map((c) => c.value),
          backgroundColor: data.categories.map((c) => c.color),
          borderWidth: 3,
          borderColor: "#FFFFFF",
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#1B1B18",
            padding: 10,
            cornerRadius: 8,
            callbacks: { label: (item) => `${item.label}: ${currency(item.parsed)}` }
          }
        }
      }
    });
  }

  /* ---------------------------------------------------------------
   * Mobile sidebar toggle
   * --------------------------------------------------------------- */
  function bindSidebarToggle() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    const toggle = document.getElementById("menuToggle");
    if (!sidebar || !overlay || !toggle) return;

    const open = () => { sidebar.classList.add("open"); overlay.classList.add("show"); };
    const close = () => { sidebar.classList.remove("open"); overlay.classList.remove("show"); };

    toggle.addEventListener("click", open);
    overlay.addEventListener("click", close);
  }

  /* ---------------------------------------------------------------
   * Render orchestration
   * --------------------------------------------------------------- */
  function renderAll(data) {
    renderStatCards(data);
    renderRepayments(data);
    renderTransactions(data);
    renderCategoryLegend(data);
    renderTrendChart(data);
    renderCategoryChart(data);
  }

  async function loadDashboard() {
    clearErrorState();
    showLoadingState();
    try {
      const data = await SupabaseAPI.fetchDashboardData();
      renderAll(data);
    } catch (err) {
      showErrorState(err.message || "Unknown error", loadDashboard);
    }
  }

  /* ---------------------------------------------------------------
   * Init
   * --------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    renderTodayLabel();
    bindSidebarToggle();
    loadDashboard();
  });
})();
