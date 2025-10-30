// src/utils/analyticsUtils.js

/**
 * Format number with Indian number system
 */
export function formatNumber(value, decimals = 2) {
  if (!value && value !== 0) return "0";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  }).format(value);
}

/**
 * Format currency in INR
 */
export function formatCurrency(value, decimals = 2) {
  if (!value && value !== 0) return "₹0";
  return "₹" + formatNumber(value, decimals);
}

/**
 * Format percentage
 */
export function formatPercentage(value, decimals = 1) {
  if (!value && value !== 0) return "0%";
  return formatNumber(value, decimals) + "%";
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value, total) {
  if (!total || total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Get color for progress bar based on value
 */
export function getProgressColor(percentage) {
  if (percentage >= 80) return "success";
  if (percentage >= 60) return "info";
  if (percentage >= 40) return "warning";
  return "error";
}

/**
 * Get month colors for charts
 */
export function getMonthColor(monthIndex) {
  const colors = [
    "blue",
    "green",
    "orange",
    "red",
    "purple",
    "teal",
    "indigo",
    "pink",
    "cyan",
    "amber",
    "lime",
    "deep-orange",
  ];
  return colors[(monthIndex - 1) % colors.length];
}

/**
 * Sort array by field
 */
export function sortByField(array, field, order = "desc") {
  return [...array].sort((a, b) => {
    const aVal = a[field] || 0;
    const bVal = b[field] || 0;
    return order === "desc" ? bVal - aVal : aVal - bVal;
  });
}

/**
 * Group array by field
 */
export function groupBy(array, field) {
  return array.reduce((acc, item) => {
    const key = item[field];
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});
}

/**
 * Calculate growth rate
 */
export function calculateGrowth(current, previous) {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Get trend icon based on growth
 */
export function getTrendIcon(growth) {
  if (growth > 0) return "mdi-trending-up";
  if (growth < 0) return "mdi-trending-down";
  return "mdi-trending-neutral";
}

/**
 * Get trend color based on growth
 */
export function getTrendColor(growth) {
  if (growth > 0) return "success";
  if (growth < 0) return "error";
  return "grey";
}

/**
 * Debounce function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Export data to CSV
 */
export function exportToCSV(data, filename = "export.csv") {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Handle values with commas, quotes, and newlines
          if (value === null || value === undefined) return "";
          const stringValue = String(value);
          if (
            stringValue.includes(",") ||
            stringValue.includes('"') ||
            stringValue.includes("\n")
          ) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Format date to locale string
 */
export function formatDate(date, format = "short") {
  if (!date) return "";
  const dateObj = date instanceof Date ? date : new Date(date);

  if (format === "short") {
    return dateObj.toLocaleDateString("en-IN");
  } else if (format === "long") {
    return dateObj.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } else if (format === "time") {
    return dateObj.toLocaleString("en-IN");
  }
  return dateObj.toISOString().split("T")[0];
}

/**
 * Get date range presets
 */
export function getDateRangePresets() {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const startOfLastMonth = new Date(
    today.getFullYear(),
    today.getMonth() - 1,
    1
  );
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
  const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last90Days = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

  return {
    today: { start: today, end: today },
    last7Days: { start: last7Days, end: today },
    last30Days: { start: last30Days, end: today },
    last90Days: { start: last90Days, end: today },
    thisMonth: { start: startOfMonth, end: today },
    lastMonth: { start: startOfLastMonth, end: endOfLastMonth },
    thisYear: { start: startOfYear, end: today },
  };
}

/**
 * Parse API error message
 */
export function parseErrorMessage(error) {
  if (error.response) {
    return (
      error.response.data?.message ||
      error.response.statusText ||
      "Server error occurred"
    );
  } else if (error.request) {
    return "No response from server. Please check your connection.";
  } else {
    return error.message || "An unexpected error occurred";
  }
}

/**
 * Generate color palette
 */
export function generateColorPalette(count) {
  const baseColors = [
    "#1976D2",
    "#388E3C",
    "#F57C00",
    "#D32F2F",
    "#7B1FA2",
    "#00796B",
    "#303F9F",
    "#C2185B",
    "#0097A7",
    "#FBC02D",
    "#689F38",
    "#E64A19",
    "#5D4037",
    "#455A64",
    "#512DA8",
  ];

  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  return colors;
}

/**
 * Throttle function
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Deep clone object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Calculate average
 */
export function calculateAverage(numbers) {
  if (!numbers || numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + (num || 0), 0);
  return sum / numbers.length;
}

/**
 * Calculate sum
 */
export function calculateSum(numbers) {
  if (!numbers || numbers.length === 0) return 0;
  return numbers.reduce((acc, num) => acc + (num || 0), 0);
}

/**
 * Find min value
 */
export function findMin(numbers) {
  if (!numbers || numbers.length === 0) return 0;
  return Math.min(...numbers.filter((n) => n !== null && n !== undefined));
}

/**
 * Find max value
 */
export function findMax(numbers) {
  if (!numbers || numbers.length === 0) return 0;
  return Math.max(...numbers.filter((n) => n !== null && n !== undefined));
}

/**
 * Truncate text
 */
export function truncateText(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * Check if value is empty
 */
export function isEmpty(value) {
  return (
    value === null ||
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === "object" && Object.keys(value).length === 0)
  );
}

/**
 * Format large numbers (K, M, B)
 */
export function formatLargeNumber(value, decimals = 1) {
  if (!value && value !== 0) return "0";

  if (value >= 10000000) {
    // 1 Crore
    return formatNumber(value / 10000000, decimals) + " Cr";
  } else if (value >= 100000) {
    // 1 Lakh
    return formatNumber(value / 100000, decimals) + " L";
  } else if (value >= 1000) {
    // 1 Thousand
    return formatNumber(value / 1000, decimals) + " K";
  }
  return formatNumber(value, decimals);
}

/**
 * Get initials from name
 */
export function getInitials(name) {
  if (!name) return "";
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Validate email
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Indian format)
 */
export function isValidPhone(phone) {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
}
