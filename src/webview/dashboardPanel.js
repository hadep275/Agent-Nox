/**
 * 📊 Dashboard Panel - Performance Analytics UI
 */

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

class DashboardPanel {
  constructor() {
    this.vscode = acquireVsCodeApi();
    // Expose vscode to window so other scripts can use it
    window.vscode = this.vscode;
    this.currentFilter = "lifetime";
    this.analyticsData = null;
    this.initialize();
  }

  initialize() {
    this.setupUI();
    this.setupEventListeners();
    this.requestAnalyticsData();
  }

  setupUI() {
    this.elements = {
      filterSelect: document.getElementById("filterSelect"),
      exportBtn: document.getElementById("exportBtn"),
      exportMenu: document.getElementById("exportMenu"),
      customDateRange: document.getElementById("customDateRange"),
      customDateStart: document.getElementById("customDateStart"),
      customDateEnd: document.getElementById("customDateEnd"),
      applyCustomBtn: document.getElementById("applyCustomBtn"),
      summaryCards: document.getElementById("summaryCards"),
      chartsGrid: document.getElementById("chartsGrid"),
      tableContainer: document.getElementById("tableContainer"),
      loadingState: document.getElementById("loadingState"),
      costBreakdownChart: document.getElementById("costBreakdownChart"),
      costTrendsChart: document.getElementById("costTrendsChart"),
      messagesPerDayChart: document.getElementById("messagesPerDayChart"),
    };
    this.charts = {};
  }

  setupEventListeners() {
    this.elements.filterSelect?.addEventListener("change", (e) => {
      this.currentFilter = e.target.value;
      if (e.target.value === "custom") {
        // Show custom date range UI
        if (this.elements.customDateRange) {
          this.elements.customDateRange.style.display = "block";
        }
      } else {
        // Hide custom date range UI and request data
        if (this.elements.customDateRange) {
          this.elements.customDateRange.style.display = "none";
        }
        this.requestAnalyticsData();
      }
    });

    this.elements.applyCustomBtn?.addEventListener("click", () => {
      const start = this.elements.customDateStart?.value;
      const end = this.elements.customDateEnd?.value;
      if (start && end) {
        this.requestAnalyticsData("custom", { start, end });
      }
    });

    // Export dropdown menu
    this.elements.exportBtn?.addEventListener("click", () => {
      this.toggleExportMenu();
    });

    // Export menu items
    document.querySelectorAll(".export-menu-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        const format = e.target.dataset.format;
        this.exportData(format);
        this.closeExportMenu();
      });
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (
        !e.target.closest(".export-dropdown-container") &&
        this.elements.exportMenu?.style.display === "block"
      ) {
        this.closeExportMenu();
      }
    });

    // Listen for analytics data from extension
    window.addEventListener("message", (event) => {
      const message = event.data;
      if (message.type === "analyticsData") {
        this.analyticsData = message.data;
        this.renderDashboard();
      } else if (
        message.type === "themeApplied" ||
        message.type === "injectCSS"
      ) {
        // Re-render charts when theme changes to apply new colors
        if (this.analyticsData) {
          this.renderCharts();
        }
      }
    });
  }

  /**
   * Get theme colors from CSS variables
   */
  getThemeColors() {
    const root = document.documentElement;
    const getVar = (varName) => {
      return getComputedStyle(root).getPropertyValue(varName).trim();
    };

    return {
      blue: getVar("--aurora-blue") || "#4c9aff",
      purple: getVar("--aurora-purple") || "#7c3aed",
      green: getVar("--aurora-green") || "#10b981",
      pink: getVar("--aurora-pink") || "#f472b6",
      cyan: getVar("--aurora-cyan") || "#06b6d4",
      orange: getVar("--aurora-orange") || "#f59e0b",
      textPrimary: getVar("--text-primary") || "#e0e0e0",
      bgSecondary: getVar("--bg-secondary") || "#1e1e1e",
    };
  }

  requestAnalyticsData(filterType = "lifetime", customDates = null) {
    this.showLoading(true);
    this.vscode.postMessage({
      type: "getAnalyticsData",
      filterType: filterType || this.currentFilter,
      customDates,
    });
  }

  renderDashboard() {
    this.showLoading(false);
    if (!this.analyticsData) return;

    this.renderSummaryCards();
    this.renderCharts();
    this.renderTables();
  }

  renderSummaryCards() {
    const { stats } = this.analyticsData;
    const html = `
      <div class="summary-card">
        <div class="card-label">Total Messages</div>
        <div class="card-value">${this.analyticsData.messageCount}</div>
      </div>
      <div class="summary-card">
        <div class="card-label">Total Cost</div>
        <div class="card-value">$${stats.totalCost.toFixed(4)}</div>
        <div class="card-subtext">Avg: $${stats.averageCostPerMessage}/msg</div>
      </div>
      <div class="summary-card">
        <div class="card-label">Total Tokens</div>
        <div class="card-value">${stats.totalTokens.toLocaleString()}</div>
        <div class="card-subtext">Avg: ${
          stats.averageTokensPerMessage
        }/msg</div>
      </div>
      <div class="summary-card">
        <div class="card-label">Cost per Token</div>
        <div class="card-value">$${stats.costPerToken}</div>
      </div>
    `;
    this.elements.summaryCards.innerHTML = html;
  }

  renderCharts() {
    if (!this.analyticsData) return;

    // Get theme colors from CSS variables
    const colors = this.getThemeColors();

    // Destroy existing charts
    Object.values(this.charts).forEach((chart) => chart.destroy());
    this.charts = {};

    // Wait for DOM to be ready, then render charts
    setTimeout(() => {
      this.renderCostBreakdownChart(colors);
      this.renderCostTrendsChart(colors);
      this.renderMessagesPerDayChart(colors);
    }, 100);
  }

  renderTables() {
    const { providerBreakdown, dailyBreakdown } = this.analyticsData;

    // Provider breakdown table
    let providerHtml = `
      <div class="table-container">
        <div class="table-title">Provider Breakdown</div>
        <table>
          <thead>
            <tr>
              <th>Provider</th>
              <th>Cost</th>
              <th>Tokens</th>
              <th>Messages</th>
              <th>Avg Cost/Msg</th>
              <th>Cost/Token</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
    `;

    providerBreakdown.forEach((provider) => {
      providerHtml += `
        <tr>
          <td>${provider.provider}</td>
          <td>$${provider.totalCost.toFixed(4)}</td>
          <td>${provider.totalTokens.toLocaleString()}</td>
          <td>${provider.messageCount}</td>
          <td>$${provider.averageCostPerMessage}</td>
          <td>$${provider.costPerToken}</td>
          <td>${provider.percentage}%</td>
        </tr>
      `;
    });

    providerHtml += `
          </tbody>
        </table>
      </div>
    `;

    // Daily breakdown table
    let dailyHtml = `
      <div class="table-container">
        <div class="table-title">Daily Breakdown</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Messages</th>
              <th>Cost</th>
              <th>Tokens</th>
            </tr>
          </thead>
          <tbody>
    `;

    dailyBreakdown.forEach((day) => {
      dailyHtml += `
        <tr>
          <td>${day.date}</td>
          <td>${day.messageCount}</td>
          <td>$${day.totalCost.toFixed(4)}</td>
          <td>${day.totalTokens.toLocaleString()}</td>
        </tr>
      `;
    });

    dailyHtml += `
          </tbody>
        </table>
      </div>
    `;

    this.elements.tableContainer.innerHTML = providerHtml + dailyHtml;
  }

  renderCharts() {
    if (!this.analyticsData) return;

    // Aurora theme colors
    const colors = {
      blue: "#4c9aff",
      purple: "#7c3aed",
      green: "#10b981",
      pink: "#f472b6",
      cyan: "#06b6d4",
      orange: "#f59e0b",
    };

    // Destroy existing charts
    Object.values(this.charts).forEach((chart) => chart.destroy());
    this.charts = {};

    // 1. Cost Breakdown by Provider (Pie Chart)
    this.renderCostBreakdownChart(colors);

    // 2. Cost Trends (Line Chart)
    this.renderCostTrendsChart(colors);

    // 3. Messages per Day (Bar Chart)
    this.renderMessagesPerDayChart(colors);
  }

  renderCostBreakdownChart(colors) {
    const ctx = this.elements.costBreakdownChart?.getContext("2d");
    if (!ctx) return;

    const providers = this.analyticsData.providerBreakdown;
    if (!providers || providers.length === 0) return;

    const colorArray = [
      colors.blue,
      colors.purple,
      colors.green,
      colors.pink,
      colors.cyan,
    ];

    // Parse cost data - ensure it's numeric (use totalCost from AnalyticsEngine)
    const costData = providers.map((p) => {
      const cost =
        typeof p.totalCost === "string"
          ? parseFloat(p.totalCost.replace("$", ""))
          : p.totalCost;
      return cost;
    });

    this.charts.costBreakdown = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: providers.map((p) => p.provider),
        datasets: [
          {
            data: costData,
            backgroundColor: colorArray.slice(0, providers.length),
            borderColor: colors.bgSecondary,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: colors.textPrimary,
              font: { size: 12 },
              padding: 15,
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `$${value.toFixed(4)} (${percentage}%)`;
              },
            },
          },
        },
      },
    });
  }

  renderCostTrendsChart(colors) {
    const ctx = this.elements.costTrendsChart?.getContext("2d");
    if (!ctx) return;

    const dailyData = this.analyticsData.dailyBreakdown;
    if (!dailyData || dailyData.length === 0) return;

    // Parse cost data - ensure it's numeric (use totalCost from AnalyticsEngine)
    const costData = dailyData.map((d) => {
      const cost =
        typeof d.totalCost === "string"
          ? parseFloat(d.totalCost.replace("$", ""))
          : d.totalCost;
      return cost;
    });

    // Get grid and tick colors from CSS variables
    const gridColor =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--bg-tertiary")
        .trim() || "#333333";
    const tickColor =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--text-secondary")
        .trim() || "#a0a0a0";

    this.charts.costTrends = new Chart(ctx, {
      type: "line",
      data: {
        labels: dailyData.map((d) => d.date),
        datasets: [
          {
            label: "Daily Cost",
            data: costData,
            borderColor: colors.blue,
            backgroundColor: `${colors.blue}20`,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: colors.blue,
            pointBorderColor: colors.bgSecondary,
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            labels: {
              color: colors.textPrimary,
              font: { size: 12 },
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => `$${context.parsed.y.toFixed(4)}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: tickColor },
            grid: { color: gridColor },
          },
          x: {
            ticks: { color: tickColor },
            grid: { color: gridColor },
          },
        },
      },
    });
  }

  renderMessagesPerDayChart(colors) {
    const ctx = this.elements.messagesPerDayChart?.getContext("2d");
    if (!ctx) return;

    const dailyData = this.analyticsData.dailyBreakdown;
    if (!dailyData || dailyData.length === 0) return;

    // Parse messages data - ensure it's numeric (use messageCount from AnalyticsEngine)
    const messagesData = dailyData.map((d) => {
      const messages =
        typeof d.messageCount === "string"
          ? parseInt(d.messageCount)
          : d.messageCount;
      return messages;
    });

    // Get grid and tick colors from CSS variables
    const gridColor =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--bg-tertiary")
        .trim() || "#333333";
    const tickColor =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--text-secondary")
        .trim() || "#a0a0a0";

    this.charts.messagesPerDay = new Chart(ctx, {
      type: "bar",
      data: {
        labels: dailyData.map((d) => d.date),
        datasets: [
          {
            label: "Messages",
            data: messagesData,
            backgroundColor: colors.purple,
            borderColor: colors.bgSecondary,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            labels: {
              color: colors.textPrimary,
              font: { size: 12 },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: tickColor },
            grid: { color: gridColor },
          },
          x: {
            ticks: { color: tickColor },
            grid: { color: gridColor },
          },
        },
      },
    });
  }

  toggleExportMenu() {
    const menu = this.elements.exportMenu;
    if (menu.style.display === "none" || menu.style.display === "") {
      menu.style.display = "block";
    } else {
      menu.style.display = "none";
    }
  }

  closeExportMenu() {
    if (this.elements.exportMenu) {
      this.elements.exportMenu.style.display = "none";
    }
  }

  exportData(format = "json") {
    if (!this.analyticsData) return;

    const exportData = {
      exportDate: new Date().toISOString(),
      filterType: this.currentFilter,
      dateRange: this.analyticsData.dateRange,
      stats: this.analyticsData.stats,
      providerBreakdown: this.analyticsData.providerBreakdown,
      dailyBreakdown: this.analyticsData.dailyBreakdown,
    };

    const date = new Date().toISOString().split("T")[0];

    if (format === "json") {
      this.exportJSON(exportData, date);
    } else if (format === "csv") {
      this.exportCSV(exportData, date);
    } else if (format === "pdf") {
      this.exportPDF(exportData, date);
    }
  }

  exportJSON(data, date) {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nox-analytics-${date}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  exportCSV(data, date) {
    let csv = "Nox Analytics Export\n";
    csv += `Export Date: ${data.exportDate}\n`;
    csv += `Filter Type: ${data.filterType}\n\n`;

    // Stats section
    csv += "STATISTICS\n";
    csv += "Metric,Value\n";
    csv += `Total Messages,${data.stats.totalMessages}\n`;
    csv += `Total Cost,$${data.stats.totalCost.toFixed(4)}\n`;
    csv += `Total Tokens,${data.stats.totalTokens}\n`;
    csv += `Avg Cost/Message,$${data.stats.averageCostPerMessage}\n`;
    csv += `Avg Tokens/Message,${data.stats.averageTokensPerMessage}\n`;
    csv += `Cost per Token,$${data.stats.costPerToken}\n\n`;

    // Provider breakdown
    csv += "PROVIDER BREAKDOWN\n";
    csv += "Provider,Cost,Tokens,Messages,Avg Cost/Msg,Cost/Token,Percentage\n";
    data.providerBreakdown.forEach((provider) => {
      csv += `${provider.provider},$${provider.totalCost.toFixed(4)},${
        provider.totalTokens
      },${provider.messageCount},$${provider.averageCostPerMessage},$${
        provider.costPerToken
      },${provider.percentage}%\n`;
    });
    csv += "\n";

    // Daily breakdown
    csv += "DAILY BREAKDOWN\n";
    csv += "Date,Cost,Tokens,Messages\n";
    data.dailyBreakdown.forEach((day) => {
      csv += `${day.date},$${day.totalCost.toFixed(4)},${day.totalTokens},${
        day.messageCount
      }\n`;
    });

    const dataBlob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nox-analytics-${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async exportPDF(data, date) {
    try {
      // Show loading state
      const originalText = this.elements.exportBtn.textContent;
      this.elements.exportBtn.textContent = "📑 Generating PDF...";
      this.elements.exportBtn.disabled = true;

      // Create a temporary container for PDF content
      const pdfContainer = document.createElement("div");
      pdfContainer.style.position = "absolute";
      pdfContainer.style.left = "-9999px";
      pdfContainer.style.width = "800px";
      pdfContainer.style.backgroundColor = "#0f172a";
      pdfContainer.style.color = "#e2e8f0";
      pdfContainer.style.padding = "40px";
      pdfContainer.style.fontFamily = "Arial, sans-serif";

      // Build PDF content
      pdfContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="margin: 0; font-size: 32px; color: #4c9aff;">🦊 Nox Analytics Report</h1>
          <p style="margin: 10px 0 0 0; color: #94a3b8; font-size: 14px;">Generated on ${new Date().toLocaleString()}</p>
        </div>

        <div style="margin-bottom: 30px; padding: 20px; background: rgba(76, 154, 255, 0.1); border-radius: 8px;">
          <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #4c9aff;">Report Summary</h2>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Filter Type:</strong> ${
            data.filterType
          }</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Date Range:</strong> ${new Date(
            data.dateRange.startDate
          ).toLocaleDateString()} to ${new Date(
        data.dateRange.endDate
      ).toLocaleDateString()}</p>
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #4c9aff;">Key Metrics</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr style="background: rgba(76, 154, 255, 0.1);">
              <td style="padding: 10px; border: 1px solid rgba(76, 154, 255, 0.3);"><strong>Total Messages</strong></td>
              <td style="padding: 10px; border: 1px solid rgba(76, 154, 255, 0.3); text-align: right;"><strong>${
                data.stats.totalMessages
              }</strong></td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid rgba(76, 154, 255, 0.3);">Total Cost</td>
              <td style="padding: 10px; border: 1px solid rgba(76, 154, 255, 0.3); text-align: right;">$${data.stats.totalCost.toFixed(
                4
              )}</td>
            </tr>
            <tr style="background: rgba(76, 154, 255, 0.05);">
              <td style="padding: 10px; border: 1px solid rgba(76, 154, 255, 0.3);">Total Tokens</td>
              <td style="padding: 10px; border: 1px solid rgba(76, 154, 255, 0.3); text-align: right;">${
                data.stats.totalTokens
              }</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid rgba(76, 154, 255, 0.3);">Avg Cost/Message</td>
              <td style="padding: 10px; border: 1px solid rgba(76, 154, 255, 0.3); text-align: right;">$${
                data.stats.averageCostPerMessage
              }</td>
            </tr>
            <tr style="background: rgba(76, 154, 255, 0.05);">
              <td style="padding: 10px; border: 1px solid rgba(76, 154, 255, 0.3);">Avg Tokens/Message</td>
              <td style="padding: 10px; border: 1px solid rgba(76, 154, 255, 0.3); text-align: right;">${
                data.stats.averageTokensPerMessage
              }</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid rgba(76, 154, 255, 0.3);">Cost per Token</td>
              <td style="padding: 10px; border: 1px solid rgba(76, 154, 255, 0.3); text-align: right;">$${
                data.stats.costPerToken
              }</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #4c9aff;">Provider Breakdown</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <tr style="background: rgba(76, 154, 255, 0.1);">
              <th style="padding: 10px; border: 1px solid rgba(76, 154, 255, 0.3); text-align: left;"><strong>Provider</strong></th>
              <th style="padding: 10px; border: 1px solid rgba(76, 154, 255, 0.3); text-align: right;"><strong>Cost</strong></th>
              <th style="padding: 10px; border: 1px solid rgba(76, 154, 255, 0.3); text-align: right;"><strong>Tokens</strong></th>
              <th style="padding: 10px; border: 1px solid rgba(76, 154, 255, 0.3); text-align: right;"><strong>Messages</strong></th>
              <th style="padding: 10px; border: 1px solid rgba(76, 154, 255, 0.3); text-align: right;"><strong>%</strong></th>
            </tr>
            ${data.providerBreakdown
              .map(
                (provider, idx) => `
              <tr style="background: ${
                idx % 2 === 0 ? "rgba(76, 154, 255, 0.05)" : "transparent"
              };">
                <td style="padding: 10px; border: 1px solid rgba(76, 154, 255, 0.3);">${
                  provider.provider
                }</td>
                <td style="padding: 10px; border: 1px solid rgba(76, 154, 255, 0.3); text-align: right;">$${provider.totalCost.toFixed(
                  4
                )}</td>
                <td style="padding: 10px; border: 1px solid rgba(76, 154, 255, 0.3); text-align: right;">${
                  provider.totalTokens
                }</td>
                <td style="padding: 10px; border: 1px solid rgba(76, 154, 255, 0.3); text-align: right;">${
                  provider.messageCount
                }</td>
                <td style="padding: 10px; border: 1px solid rgba(76, 154, 255, 0.3); text-align: right;">${
                  provider.percentage
                }%</td>
              </tr>
            `
              )
              .join("")}
          </table>
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #4c9aff;">Daily Breakdown</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <tr style="background: rgba(76, 154, 255, 0.1);">
              <th style="padding: 10px; border: 1px solid rgba(76, 154, 255, 0.3); text-align: left;"><strong>Date</strong></th>
              <th style="padding: 10px; border: 1px solid rgba(76, 154, 255, 0.3); text-align: right;"><strong>Cost</strong></th>
              <th style="padding: 10px; border: 1px solid rgba(76, 154, 255, 0.3); text-align: right;"><strong>Tokens</strong></th>
              <th style="padding: 10px; border: 1px solid rgba(76, 154, 255, 0.3); text-align: right;"><strong>Messages</strong></th>
            </tr>
            ${data.dailyBreakdown
              .map(
                (day, idx) => `
              <tr style="background: ${
                idx % 2 === 0 ? "rgba(76, 154, 255, 0.05)" : "transparent"
              };">
                <td style="padding: 10px; border: 1px solid rgba(76, 154, 255, 0.3);">${
                  day.date
                }</td>
                <td style="padding: 10px; border: 1px solid rgba(76, 154, 255, 0.3); text-align: right;">$${day.totalCost.toFixed(
                  4
                )}</td>
                <td style="padding: 10px; border: 1px solid rgba(76, 154, 255, 0.3); text-align: right;">${
                  day.totalTokens
                }</td>
                <td style="padding: 10px; border: 1px solid rgba(76, 154, 255, 0.3); text-align: right;">${
                  day.messageCount
                }</td>
              </tr>
            `
              )
              .join("")}
          </table>
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(76, 154, 255, 0.3); text-align: center; color: #94a3b8; font-size: 12px;">
          <p style="margin: 0;">Generated by Nox Analytics Dashboard</p>
          <p style="margin: 5px 0 0 0;">© 2025 Nox - Your AI Coding Fox 🦊</p>
        </div>
      `;

      document.body.appendChild(pdfContainer);

      // Convert HTML to canvas
      const canvas = await html2canvas(pdfContainer, {
        backgroundColor: "#0f172a",
        scale: 2,
        logging: false,
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      let heightLeft = canvas.height * (imgWidth / canvas.width);
      let position = 0;

      // Add image to PDF, handling multiple pages if needed
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, heightLeft);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - canvas.height * (imgWidth / canvas.width);
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, heightLeft);
        heightLeft -= pageHeight;
      }

      // Save PDF
      pdf.save(`nox-analytics-${date}.pdf`);

      // Clean up
      document.body.removeChild(pdfContainer);

      // Restore button state
      this.elements.exportBtn.textContent = originalText;
      this.elements.exportBtn.disabled = false;
    } catch (error) {
      console.error("PDF export error:", error);
      alert("Failed to generate PDF. Please try again.");
      this.elements.exportBtn.textContent = originalText;
      this.elements.exportBtn.disabled = false;
    }
  }

  showLoading(show) {
    if (this.elements.loadingState) {
      this.elements.loadingState.style.display = show ? "flex" : "none";
    }
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new DashboardPanel();
});
