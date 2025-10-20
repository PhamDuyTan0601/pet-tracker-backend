// File chính - Khởi tạo ứng dụng
class PetTrackerApp {
  constructor() {
    this.init();
  }

  async init() {
    console.log("🚀 Pet Tracker Web App đã khởi động");

    // Kiểm tra authentication
    await this.checkAuth();

    // Khởi tạo service worker (nếu cần)
    this.initServiceWorker();

    // Thêm global error handler
    this.setupErrorHandling();
  }

  // Kiểm tra trạng thái đăng nhập
  async checkAuth() {
    try {
      // Có thể kiểm tra token hoặc session ở đây
      const response = await fetch("/api/auth/check");
      const result = await response.json();

      if (!result.authenticated) {
        this.showLoginPrompt();
      }
    } catch (error) {
      console.log("Không thể kiểm tra auth, tiếp tục với chế độ public");
    }
  }

  // Hiển thị prompt đăng nhập nếu cần
  showLoginPrompt() {
    // Có thể hiển thị modal đăng nhập ở đây
    console.log("Chưa đăng nhập, một số tính năng có thể bị hạn chế");
  }

  // Khởi tạo service worker cho PWA
  async initServiceWorker() {
    if ("serviceWorker" in navigator) {
      try {
        await navigator.serviceWorker.register("/sw.js");
        console.log("Service Worker đã đăng ký");
      } catch (error) {
        console.log("Service Worker registration failed:", error);
      }
    }
  }

  // Xử lý lỗi toàn cục
  setupErrorHandling() {
    window.addEventListener("error", (event) => {
      console.error("Global error:", event.error);
      ui.showNotification("Đã xảy ra lỗi ứng dụng", "error");
    });

    window.addEventListener("unhandledrejection", (event) => {
      console.error("Unhandled promise rejection:", event.reason);
      ui.showNotification("Lỗi xử lý dữ liệu", "error");
    });
  }
}

// Khởi động ứng dụng khi DOM ready
document.addEventListener("DOMContentLoaded", () => {
  new PetTrackerApp();
});

// Utility functions
function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString("vi-VN");
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString("vi-VN");
}

function debounce(func, wait) {
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
