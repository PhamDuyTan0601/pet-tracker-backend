class AuthManager {
  constructor() {
    this.currentUser = null;
    this.userId = null;
  }

  init() {
    const savedUser = localStorage.getItem("petTrackerUser");
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      this.userId = this.currentUser.id;
      this.showMainApp();
    }
  }

  showAuthModal() {
    document.getElementById("authModal").style.display = "flex";
    document.getElementById("mainApp").style.display = "none";
  }

  showMainApp() {
    document.getElementById("authModal").style.display = "none";
    document.getElementById("mainApp").style.display = "block";
    document.getElementById("userName").textContent = this.currentUser.name;
  }

  async login() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
      const response = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (result.success) {
        this.currentUser = result.user;
        this.userId = result.user.id;
        localStorage.setItem(
          "petTrackerUser",
          JSON.stringify(this.currentUser)
        );
        this.showMainApp();
        ui.showNotification("Đăng nhập thành công!", "success");
      } else {
        ui.showNotification(result.message, "error");
      }
    } catch (error) {
      ui.showNotification("Lỗi kết nối", "error");
    }
  }

  async register() {
    const name = document.getElementById("registerName").value;
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;

    try {
      const response = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const result = await response.json();

      if (result.success) {
        ui.showNotification("Đăng ký thành công!", "success");
        this.showLogin();
      } else {
        ui.showNotification(result.message, "error");
      }
    } catch (error) {
      ui.showNotification("Lỗi kết nối", "error");
    }
  }

  showRegister() {
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("registerForm").style.display = "block";
  }

  showLogin() {
    document.getElementById("registerForm").style.display = "none";
    document.getElementById("loginForm").style.display = "block";
  }

  logout() {
    this.currentUser = null;
    this.userId = null;
    localStorage.removeItem("petTrackerUser");
    this.showAuthModal();
  }

  getAuthHeaders() {
    return {
      "Content-Type": "application/json",
      userId: this.userId,
    };
  }
}

const auth = new AuthManager();
