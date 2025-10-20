// js/auth.js
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.userId = null;
    this.init();
  }

  init() {
    // Kiểm tra nếu đã đăng nhập trước đó
    const savedUser = localStorage.getItem("petTrackerUser");
    const savedUserId = localStorage.getItem("petTrackerUserId");

    if (savedUser && savedUserId) {
      this.currentUser = JSON.parse(savedUser);
      this.userId = savedUserId;
      this.showMainApp();
    } else {
      this.showAuthModal();
    }
  }

  // Hiển thị modal đăng nhập
  showAuthModal() {
    document.getElementById("authModal").style.display = "flex";
    document.getElementById("mainApp").style.display = "none";
  }

  // Hiển thị app chính
  showMainApp() {
    document.getElementById("authModal").style.display = "none";
    document.getElementById("mainApp").style.display = "block";

    // Cập nhật thông tin user
    if (this.currentUser) {
      document.getElementById("userName").textContent = this.currentUser.name;
    }

    // Khởi tạo Bluetooth manager với userId
    if (window.bluetooth) {
      window.bluetooth.userId = this.userId;
      window.bluetooth.loadPets();
    }
  }

  // Chuyển sang form đăng ký
  showRegister() {
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("registerForm").style.display = "block";
  }

  // Chuyển sang form đăng nhập
  showLogin() {
    document.getElementById("registerForm").style.display = "none";
    document.getElementById("loginForm").style.display = "block";
  }

  // Đăng ký tài khoản
  async register() {
    const name = document.getElementById("registerName").value;
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;

    if (!name || !email || !password) {
      this.showNotification("Vui lòng điền đầy đủ thông tin", "error");
      return;
    }

    if (password.length < 6) {
      this.showNotification("Mật khẩu phải có ít nhất 6 ký tự", "error");
      return;
    }

    try {
      ui.showLoading(true);

      const response = await fetch("/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const result = await response.json();

      if (result.success) {
        this.showNotification(
          "Đăng ký thành công! Vui lòng đăng nhập.",
          "success"
        );
        this.showLogin();
        // Clear form
        document.getElementById("registerName").value = "";
        document.getElementById("registerEmail").value = "";
        document.getElementById("registerPassword").value = "";
      } else {
        this.showNotification(result.message || "Đăng ký thất bại", "error");
      }
    } catch (error) {
      this.showNotification("Lỗi kết nối server", "error");
      console.error("Register error:", error);
    } finally {
      ui.showLoading(false);
    }
  }

  // Đăng nhập
  async login() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
      this.showNotification("Vui lòng điền email và mật khẩu", "error");
      return;
    }

    try {
      ui.showLoading(true);

      const response = await fetch("/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (result.success) {
        this.currentUser = result.user;
        this.userId = result.user.id;

        // Lưu thông tin đăng nhập
        localStorage.setItem(
          "petTrackerUser",
          JSON.stringify(this.currentUser)
        );
        localStorage.setItem("petTrackerUserId", this.userId);

        this.showNotification("Đăng nhập thành công!", "success");
        this.showMainApp();
      } else {
        this.showNotification(result.message || "Đăng nhập thất bại", "error");
      }
    } catch (error) {
      this.showNotification("Lỗi kết nối server", "error");
      console.error("Login error:", error);
    } finally {
      ui.showLoading(false);
    }
  }

  // Đăng xuất
  logout() {
    this.currentUser = null;
    this.userId = null;
    localStorage.removeItem("petTrackerUser");
    localStorage.removeItem("petTrackerUserId");

    this.showNotification("Đã đăng xuất", "info");
    this.showAuthModal();

    // Clear form
    document.getElementById("loginEmail").value = "";
    document.getElementById("loginPassword").value = "";
  }

  // Lấy userId cho các API calls
  getUserId() {
    return this.userId;
  }

  // Lấy headers với authentication
  getAuthHeaders() {
    return {
      "Content-Type": "application/json",
      userId: this.userId,
    };
  }

  // Hiển thị thông báo
  showNotification(message, type = "info") {
    // Sử dụng UI manager để hiển thị thông báo
    if (window.ui) {
      window.ui.showNotification(message, type);
    } else {
      alert(`[${type.toUpperCase()}] ${message}`);
    }
  }
}

// Khởi tạo Auth manager global
const auth = new AuthManager();
