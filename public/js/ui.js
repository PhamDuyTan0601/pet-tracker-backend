// File: ui.js - PHIÊN BẢN THỰC TẾ
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

  // HIỂN THỊ DỮ LIỆU THỰC TẾ
  showRealPetData(data) {
    const dataPanel = document.getElementById("dataPanel");
    const petData = document.getElementById("petData");

    dataPanel.style.display = "block";

    const dataTime = new Date(data.timestamp);
    const now = new Date();
    const diffMinutes = Math.round((now - dataTime) / (1000 * 60));

    let timeText = "";
    if (diffMinutes < 1) {
      timeText = "Vài giây trước";
    } else if (diffMinutes < 60) {
      timeText = `${diffMinutes} phút trước`;
    } else {
      timeText = dataTime.toLocaleTimeString();
    }

    // Tính toán chất lượng tín hiệu
    const signalQuality =
      data.satellites >= 7 ? "Tốt" : data.satellites >= 4 ? "Khá" : "Yếu";
    const signalColor =
      data.satellites >= 7
        ? "#28a745"
        : data.satellites >= 4
        ? "#ffc107"
        : "#dc3545";

    petData.innerHTML = `
      <div class="pet-card data-update">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h4>📍 Vị Trí Thực Tế</h4>
          <span style="background: #28a745; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
            📶 DỮ LIỆU THỰC
          </span>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
          <div>
            <p><strong>Thiết bị:</strong> ${data.deviceId}</p>
            <p><strong>Kinh độ:</strong> ${data.longitude.toFixed(6)}</p>
            <p><strong>Vĩ độ:</strong> ${data.latitude.toFixed(6)}</p>
          </div>
          <div>
            <p><strong>Tốc độ:</strong> ${data.speed.toFixed(1)} km/h</p>
            <p><strong>Pin:</strong> ${Math.round(data.battery)}%</p>
            <p><strong>Cập nhật:</strong> ${timeText}</p>
          </div>
        </div>

        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; border-left: 4px solid ${signalColor};">
          <div style="display: flex; justify-content: space-between;">
            <span><strong>🛰️ Vệ tinh:</strong> ${data.satellites || 0}</span>
            <span><strong>Chất lượng:</strong> ${signalQuality}</span>
            <span><strong>Độ chính xác:</strong> ${
              data.accuracy ? data.accuracy.toFixed(1) + "m" : "N/A"
            }</span>
          </div>
        </div>

        ${this.getGoogleMapsLink(data.latitude, data.longitude)}
      </div>
    `;
  }

  // Tạo link Google Maps
  getGoogleMapsLink(lat, lng) {
    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    return `
      <div style="margin-top: 15px; text-align: center;">
        <a href="${mapsUrl}" target="_blank" style="
          display: inline-block;
          background: #4285f4;
          color: white;
          padding: 10px 20px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: bold;
          font-size: 14px;
        ">
          🗺️ Xem trên Google Maps
        </a>
      </div>
    `;
  }

  // Vẫn giữ hàm cũ cho tương thích
  showPetData(data) {
    this.showRealPetData(data);
  }
}

const ui = new UI();
