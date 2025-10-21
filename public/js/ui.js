class UI {
  constructor() {
    this.toastContainer = null;
  }

  showNotification(message, type = "info") {
    if (!this.toastContainer) {
      this.toastContainer = document.createElement("div");
      this.toastContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
            `;
      document.body.appendChild(this.toastContainer);
    }

    const toast = document.createElement("div");
    toast.style.cssText = `
            background: white;
            padding: 15px 20px;
            margin: 10px 0;
            border-radius: 5px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.2);
            border-left: 4px solid ${this.getToastColor(type)};
            animation: slideIn 0.3s ease;
        `;

    toast.innerHTML = `
            <strong>${this.getToastIcon(
              type
            )} ${type.toUpperCase()}:</strong> ${message}
        `;

    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 5000);
  }

  getToastColor(type) {
    const colors = {
      success: "#28a745",
      error: "#dc3545",
      info: "#17a2b8",
      warning: "#ffc107",
    };
    return colors[type] || "#6c757d";
  }

  getToastIcon(type) {
    const icons = {
      success: "✅",
      error: "❌",
      info: "ℹ️",
      warning: "⚠️",
    };
    return icons[type] || "💡";
  }

  showPetData(data) {
    const dataPanel = document.getElementById("dataPanel");
    const petData = document.getElementById("petData");

    dataPanel.style.display = "block";

    petData.innerHTML = `
            <div class="pet-card">
                <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
                    <h4>📍 Vị Trí Hiện Tại</h4>
                    <span style="background: #28a745; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">WiFi 📶</span>
                </div>
                <p><strong>Thiết bị:</strong> ${data.deviceId}</p>
                <p><strong>Kinh độ:</strong> ${data.longitude.toFixed(6)}</p>
                <p><strong>Vĩ độ:</strong> ${data.latitude.toFixed(6)}</p>
                <p><strong>Tốc độ:</strong> ${data.speed.toFixed(1)} km/h</p>
                <p><strong>Pin:</strong> ${Math.round(data.battery)}%</p>
                <p><strong>Cập nhật:</strong> ${new Date().toLocaleTimeString()}</p>
            </div>
        `;
  }
}

const ui = new UI();
