// Global Variables
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let currentEditId = null;
let financialChart = null;

// Initialize Application
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
});

function initializeApp() {
  setupTheme();
  setupEventListeners();

  // Check if user is already logged in (for development)
  if (localStorage.getItem("isLoggedIn") === "true") {
    showDashboard();
  }
}

// Theme Management
function setupTheme() {
  const themeToggle = document.getElementById("themeToggle");
  const body = document.body;

  // Load saved theme
  const savedTheme = localStorage.getItem("theme") || "light";
  body.setAttribute("data-theme", savedTheme);
  updateThemeIcon();

  themeToggle.addEventListener("click", () => {
    const currentTheme = body.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    body.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeIcon();

    // Update chart colors if chart exists
    if (financialChart) {
      updateChart();
    }
  });
}

function updateThemeIcon() {
  const themeToggle = document.getElementById("themeToggle");
  const theme = document.body.getAttribute("data-theme");
  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
}

// Event Listeners Setup
function setupEventListeners() {
  // Login form
  document.getElementById("loginForm").addEventListener("submit", handleLogin);

  // Logout button
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);

  // Add button
  document.getElementById("addBtn").addEventListener("click", () => {
    openModal("Tambah Data");
    document.getElementById("transactionDate").value = new Date()
      .toISOString()
      .split("T")[0];
  });

  // Data form
  document
    .getElementById("dataForm")
    .addEventListener("submit", handleFormSubmit);

  // Auto calculate total price
  document.getElementById("quantity").addEventListener("input", calculateTotal);
  document.getElementById("price").addEventListener("input", calculateTotal);

  // Month filter
  document.getElementById("monthFilter").addEventListener("change", () => {
    updateDashboard();
  });

  // Modal outside click
  document.getElementById("modal").addEventListener("click", (e) => {
    if (e.target.id === "modal") {
      closeModal();
    }
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", handleKeyboardShortcuts);
}

// Authentication Functions
function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const errorMsg = document.getElementById("loginError");

  if (username === "akmal" && password === "alda") {
    localStorage.setItem("isLoggedIn", "true");
    showDashboard();
    errorMsg.classList.add("hidden");
  } else {
    errorMsg.textContent = "Username atau password salah!";
    errorMsg.classList.remove("hidden");

    // Add shake animation
    const loginBox = document.querySelector(".login-box");
    loginBox.style.animation = "shake 0.5s ease-in-out";
    setTimeout(() => {
      loginBox.style.animation = "";
    }, 500);
  }
}

function handleLogout() {
  if (confirm("Apakah Anda yakin ingin logout?")) {
    localStorage.removeItem("isLoggedIn");
    document.getElementById("loginScreen").style.display = "flex";
    document.getElementById("dashboard").classList.remove("active");

    // Clear form
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    document.getElementById("loginError").classList.add("hidden");

    // Destroy chart if exists
    if (financialChart) {
      financialChart.destroy();
      financialChart = null;
    }
  }
}

function showDashboard() {
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("dashboard").classList.add("active");
  loadDashboard();
}

// Dashboard Functions
function loadDashboard() {
  updateStats();
  loadTransactionTable();
  initializeChart();
}

function updateDashboard() {
  updateStats();
  loadTransactionTable();
  updateChart();
}

// Statistics Functions
function updateStats() {
  const selectedMonth = document.getElementById("monthFilter").value;
  const filteredTransactions = filterByMonth(transactions, selectedMonth);

  const totalIncome = filteredTransactions
    .filter((t) => t.type === "masuk")
    .reduce((sum, t) => sum + t.totalPrice, 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === "keluar")
    .reduce((sum, t) => sum + t.totalPrice, 0);

  const balance = totalIncome - totalExpense;

  // Animate stat values
  animateValue("totalIncome", totalIncome, formatCurrency);
  animateValue("totalExpense", totalExpense, formatCurrency);
  animateValue("balance", balance, formatCurrency);

  // Update balance color based on positive/negative
  const balanceElement = document.getElementById("balance");
  balanceElement.className =
    balance >= 0 ? "stat-value income" : "stat-value expense";
}

function animateValue(elementId, targetValue, formatter) {
  const element = document.getElementById(elementId);
  const startValue = 0;
  const duration = 1000; // 1 second
  const startTime = performance.now();

  function updateValue(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const currentValue = startValue + (targetValue - startValue) * easeOut;

    element.textContent = formatter(currentValue);

    if (progress < 1) {
      requestAnimationFrame(updateValue);
    }
  }

  requestAnimationFrame(updateValue);
}

// Filter Functions
function filterByMonth(transactions, month) {
  if (!month) return transactions;
  return transactions.filter((t) => {
    const transactionMonth = new Date(t.date).getMonth() + 1;
    return transactionMonth == month;
  });
}

// Utility Functions
function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Chart Functions
function initializeChart() {
  const ctx = document.getElementById("financialChart");
  if (!ctx) return;

  // Destroy existing chart
  if (financialChart) {
    financialChart.destroy();
  }

  const isDark = document.body.getAttribute("data-theme") === "dark";
  const chartData = getChartData();

  financialChart = new Chart(ctx, {
    type: "bar",
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: isDark ? "#ffffff" : "#333333",
            usePointStyle: true,
            padding: 20,
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
          backgroundColor: isDark ? "#2d2d2d" : "#ffffff",
          titleColor: isDark ? "#ffffff" : "#333333",
          bodyColor: isDark ? "#cccccc" : "#666666",
          borderColor: isDark ? "#404040" : "#e0e0e0",
          borderWidth: 1,
          callbacks: {
            label: function (context) {
              return (
                context.dataset.label + ": " + formatCurrency(context.parsed.y)
              );
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: isDark ? "#404040" : "#e0e0e0",
            borderColor: isDark ? "#404040" : "#e0e0e0",
          },
          ticks: {
            color: isDark ? "#cccccc" : "#666666",
          },
        },
        y: {
          grid: {
            color: isDark ? "#404040" : "#e0e0e0",
            borderColor: isDark ? "#404040" : "#e0e0e0",
          },
          ticks: {
            color: isDark ? "#cccccc" : "#666666",
            callback: function (value) {
              return formatCurrency(value);
            },
          },
        },
      },
      interaction: {
        mode: "nearest",
        axis: "x",
        intersect: false,
      },
      animation: {
        duration: 1000,
        easing: "easeOutQuart",
      },
    },
  });
}

function updateChart() {
  if (!financialChart) {
    initializeChart();
    return;
  }

  const isDark = document.body.getAttribute("data-theme") === "dark";
  const chartData = getChartData();

  // Update data
  financialChart.data = chartData;

  // Update theme colors
  financialChart.options.plugins.legend.labels.color = isDark
    ? "#ffffff"
    : "#333333";
  financialChart.options.plugins.tooltip.backgroundColor = isDark
    ? "#2d2d2d"
    : "#ffffff";
  financialChart.options.plugins.tooltip.titleColor = isDark
    ? "#ffffff"
    : "#333333";
  financialChart.options.plugins.tooltip.bodyColor = isDark
    ? "#cccccc"
    : "#666666";
  financialChart.options.plugins.tooltip.borderColor = isDark
    ? "#404040"
    : "#e0e0e0";

  financialChart.options.scales.x.grid.color = isDark ? "#404040" : "#e0e0e0";
  financialChart.options.scales.x.grid.borderColor = isDark
    ? "#404040"
    : "#e0e0e0";
  financialChart.options.scales.x.ticks.color = isDark ? "#cccccc" : "#666666";

  financialChart.options.scales.y.grid.color = isDark ? "#404040" : "#e0e0e0";
  financialChart.options.scales.y.grid.borderColor = isDark
    ? "#404040"
    : "#e0e0e0";
  financialChart.options.scales.y.ticks.color = isDark ? "#cccccc" : "#666666";

  financialChart.update("active");
}

function getChartData() {
  const selectedMonth = document.getElementById("monthFilter").value;
  const filteredTransactions = filterByMonth(transactions, selectedMonth);

  // Group by date
  const groupedData = {};
  filteredTransactions.forEach((transaction) => {
    const date = transaction.date;
    if (!groupedData[date]) {
      groupedData[date] = { income: 0, expense: 0 };
    }

    if (transaction.type === "masuk") {
      groupedData[date].income += transaction.totalPrice;
    } else {
      groupedData[date].expense += transaction.totalPrice;
    }
  });

  // Sort dates
  const sortedDates = Object.keys(groupedData).sort();
  const labels = sortedDates.map((date) => formatDate(date));
  const incomeData = sortedDates.map((date) => groupedData[date].income);
  const expenseData = sortedDates.map((date) => groupedData[date].expense);

  return {
    labels: labels,
    datasets: [
      {
        label: "Pemasukan",
        data: incomeData,
        backgroundColor: "rgba(16, 185, 129, 0.8)",
        borderColor: "rgba(16, 185, 129, 1)",
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: "Pengeluaran",
        data: expenseData,
        backgroundColor: "rgba(239, 68, 68, 0.8)",
        borderColor: "rgba(239, 68, 68, 1)",
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };
}

// Table Functions
function loadTransactionTable() {
  const selectedMonth = document.getElementById("monthFilter").value;
  const filteredTransactions = filterByMonth(transactions, selectedMonth);
  const tbody = document.getElementById("dataTableBody");

  if (filteredTransactions.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="no-data">Tidak ada data transaksi</td></tr>';
    return;
  }

  // Sort by date (newest first)
  const sortedTransactions = filteredTransactions.sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  tbody.innerHTML = sortedTransactions
    .map(
      (transaction) => `
        <tr class="table-row" data-id="${transaction.id}">
            <td>${formatDate(transaction.date)}</td>
            <td>${escapeHtml(transaction.allocation)}</td>
            <td>${transaction.quantity.toLocaleString("id-ID")}</td>
            <td>${formatCurrency(transaction.price)}</td>
            <td>${formatCurrency(transaction.totalPrice)}</td>
            <td>
                <span class="status-badge ${
                  transaction.type === "masuk" ? "income" : "expense"
                }">
                    ${
                      transaction.type === "masuk"
                        ? "📈 Pemasukan"
                        : "📉 Pengeluaran"
                    }
                </span>
            </td>
            <td title="${escapeHtml(
              transaction.description || ""
            )}">${truncateText(transaction.description || "-", 30)}</td>
            <td class="action-btns">
                <button class="edit-btn" onclick="editTransaction(${
                  transaction.id
                })" title="Edit">
                    ✏️ Edit
                </button>
                <button class="delete-btn" onclick="deleteTransaction(${
                  transaction.id
                })" title="Hapus">
                    🗑️ Hapus
                </button>
            </td>
        </tr>
    `
    )
    .join("");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function truncateText(text, maxLength) {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

// Modal Functions
function openModal(title = "Tambah Data") {
  document.getElementById("modal").classList.add("active");
  document.getElementById("modalTitle").textContent = title;
  document.body.style.overflow = "hidden"; // Prevent background scrolling

  // Focus on first input
  setTimeout(() => {
    document.getElementById("transactionDate").focus();
  }, 100);
}

function closeModal() {
  document.getElementById("modal").classList.remove("active");
  document.getElementById("dataForm").reset();
  document.body.style.overflow = ""; // Restore scrolling
  currentEditId = null;

  // Clear any error messages
  clearFormErrors();
}

function clearFormErrors() {
  const errorMessages = document.querySelectorAll(".error-message");
  errorMessages.forEach((msg) => msg.remove());
}

// Form Functions
function handleFormSubmit(e) {
  e.preventDefault();

  // Clear previous errors
  clearFormErrors();

  const formData = {
    date: document.getElementById("transactionDate").value,
    allocation: document.getElementById("allocation").value.trim(),
    quantity: parseInt(document.getElementById("quantity").value),
    price: parseFloat(document.getElementById("price").value),
    totalPrice: parseFloat(document.getElementById("totalPrice").value),
    type: document.getElementById("transactionType").value,
    description: document.getElementById("description").value.trim(),
  };

  // Validation
  if (!validateFormData(formData)) {
    return;
  }

  try {
    if (currentEditId) {
      // Update existing transaction
      updateTransaction(currentEditId, formData);
      showNotification("Data berhasil diperbarui!", "success");
    } else {
      // Add new transaction
      addTransaction(formData);
      showNotification("Data berhasil ditambahkan!", "success");
    }

    // Save to localStorage
    saveTransactions();

    // Update dashboard
    updateDashboard();
    closeModal();
  } catch (error) {
    console.error("Error saving transaction:", error);
    showNotification("Terjadi kesalahan saat menyimpan data!", "error");
  }
}

function validateFormData(data) {
  let isValid = true;

  // Date validation
  if (!data.date) {
    showFieldError("transactionDate", "Tanggal harus diisi");
    isValid = false;
  }

  // Allocation validation
  if (!data.allocation) {
    showFieldError("allocation", "Alokasi harus diisi");
    isValid = false;
  }

  // Quantity validation
  if (!data.quantity || data.quantity <= 0) {
    showFieldError("quantity", "Jumlah harus lebih dari 0");
    isValid = false;
  }

  // Price validation
  if (!data.price || data.price <= 0) {
    showFieldError("price", "Harga harus lebih dari 0");
    isValid = false;
  }

  // Type validation
  if (!data.type) {
    showFieldError("transactionType", "Tipe transaksi harus dipilih");
    isValid = false;
  }

  return isValid;
}

function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;

  field.parentNode.appendChild(errorDiv);
  field.focus();
}

function calculateTotal() {
  const quantity = parseFloat(document.getElementById("quantity").value) || 0;
  const price = parseFloat(document.getElementById("price").value) || 0;
  const total = quantity * price;
  document.getElementById("totalPrice").value = total;
}

// Transaction CRUD Functions
function addTransaction(formData) {
  const newTransaction = {
    ...formData,
    id: Date.now() + Math.random(), // Ensure unique ID
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  transactions.push(newTransaction);
}

function updateTransaction(id, formData) {
  const index = transactions.findIndex((t) => t.id === id);
  if (index !== -1) {
    transactions[index] = {
      ...transactions[index],
      ...formData,
      updatedAt: new Date().toISOString(),
    };
  }
}

function editTransaction(id) {
  const transaction = transactions.find((t) => t.id === id);
  if (!transaction) {
    showNotification("Transaksi tidak ditemukan!", "error");
    return;
  }

  currentEditId = id;
  openModal("Edit Data");

  // Populate form with animation
  setTimeout(() => {
    document.getElementById("transactionDate").value = transaction.date;
    document.getElementById("allocation").value = transaction.allocation;
    document.getElementById("quantity").value = transaction.quantity;
    document.getElementById("price").value = transaction.price;
    document.getElementById("totalPrice").value = transaction.totalPrice;
    document.getElementById("transactionType").value = transaction.type;
    document.getElementById("description").value =
      transaction.description || "";
  }, 100);
}

function deleteTransaction(id) {
  const transaction = transactions.find((t) => t.id === id);
  if (!transaction) {
    showNotification("Transaksi tidak ditemukan!", "error");
    return;
  }

  const confirmMessage = `Apakah Anda yakin ingin menghapus transaksi "${transaction.allocation}"?`;
  if (confirm(confirmMessage)) {
    transactions = transactions.filter((t) => t.id !== id);
    saveTransactions();
    updateDashboard();
    showNotification("Data berhasil dihapus!", "success");
  }
}

// Data Persistence
function saveTransactions() {
  try {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
    showNotification("Gagal menyimpan data!", "error");
  }
}

// Export/Import Functions (bonus features)
function exportData() {
  const dataStr = JSON.stringify(transactions, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `keuangan-backup-${
    new Date().toISOString().split("T")[0]
  }.json`;
  link.click();

  URL.revokeObjectURL(url);
  showNotification("Data berhasil diekspor!", "success");
}

// Notification System
function showNotification(message, type = "info", duration = 3000) {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll(".notification");
  existingNotifications.forEach((n) => n.remove());

  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;

  // Add styles
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideInRight 0.3s ease-out;
        max-width: 400px;
    `;

  // Set background color based on type
  const colors = {
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b",
    info: "#3b82f6",
  };

  notification.style.backgroundColor = colors[type] || colors.info;

  document.body.appendChild(notification);

  // Auto remove
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = "slideOutRight 0.3s ease-in";
      setTimeout(() => notification.remove(), 300);
    }
  }, duration);
}

// Keyboard Shortcuts
function handleKeyboardShortcuts(e) {
  // Ctrl/Cmd + N: New transaction
  if ((e.ctrlKey || e.metaKey) && e.key === "n") {
    e.preventDefault();
    if (document.getElementById("dashboard").classList.contains("active")) {
      document.getElementById("addBtn").click();
    }
  }

  // Escape: Close modal
  if (e.key === "Escape") {
    if (document.getElementById("modal").classList.contains("active")) {
      closeModal();
    }
  }

  // Ctrl/Cmd + S: Save form
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    if (document.getElementById("modal").classList.contains("active")) {
      document.getElementById("dataForm").dispatchEvent(new Event("submit"));
    }
  }
}

// Add CSS for animations
const style = document.createElement("style");
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
    }
    
    .table-row {
        transition: all 0.3s ease;
    }
    
    .table-row:hover {
        transform: translateX(5px);
    }
`;

document.head.appendChild(style);

