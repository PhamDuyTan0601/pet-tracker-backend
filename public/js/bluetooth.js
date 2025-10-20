class UI {
  constructor() {
    this.elements = this.cacheDOM();
    this.bindEvents();
  }

  cacheDOM() {
    return {
      status: document.getElementById("status"),
      scanBtn: document.getElementById("scanBtn"),
      connectBtn: document.getElementById("connectBtn"),
      disconnectBtn: document.getElementById("disconnectBtn"),
      devicesList: document.getElementById("devicesList"),
      pairingPanel: document.getElementById("pairingPanel"),
      pairingInfo: document.getElementById("pairingInfo"),
      pairingCodeInput: document.getElementById("pairingCodeInput"),
      petSelect: document.getElementById("petSelect"),
      dataPanel: document.getElementById("dataPanel"),
      petData: document.getElementById("petData"),
      petsList: document.getElementById("petsList"),
      loadingOverlay: document.getElementById("loadingOverlay"),
    };
  }

  bindEvents() {
    // Enter key để confirm pairing
    if (this.elements.pairingCodeInput) {
      this.elements.pairingCodeInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          bluetooth.confirmPairing();
        }
      });
    }
  }

  // Cập nhật trạng thái kết nối
  updateStatus(message, type = "disconnected") {
    const statusClasses = {
      connected: "status--connected",
      disconnected: "status--disconnected",
      scanning: "status--scanning",
      error: "status--error",
    };

    this.elements.status.className = `status ${statusClasses[type]}`;
    this.elements.status.innerHTML = `
            <div class="status__icon">${this.getStatusIcon(type)}</div>
            <div class="status__text">${message}</div>
        `;
  }

  getStatusIcon(type) {
    const icons = {
      connected: "🟢",
      disconnected: "🔴",
      scanning: "🟡",
      error: "🔴",
    };
    return icons[type] || "⚪";
  }

  // Hiển thị thông tin thiết bị
  showDeviceInfo(device) {
    this.elements.devicesList.innerHTML = `
            <div class="pet-card">
                <h4>📱 Thiết Bị Tìm Thấy</h4>
                <p><strong>Tên:</strong> ${device.name}</p>
                <p><strong>ID:</strong> ${device.id}</p>
                <p><strong>MAC:</strong> ${bluetooth.getMacFromDevice()}</p>
                <p><strong>Kết nối:</strong> <span class="status--connected">Sẵn sàng</span></p>
            </div>
        `;
  }

  // Hiển thị yêu cầu pairing từ ESP32
  showPairingRequest(data) {
    this.elements.pairingInfo.innerHTML = `
            <div class="pet-card">
                <h4>🎯 Thiết Bị Mới Phát Hiện</h4>
                <p><strong>Tên thiết bị:</strong> ${data.deviceName}</p>
                <p><strong>Địa chỉ MAC:</strong> <code>${data.macAddress}</code></p>
                <p><strong>Mã xác nhận:</strong> <code class="pairing-code" style="font-size: 1.2em; background: #fff3cd; padding: 5px 10px; border-radius: 5px;">${data.pairingCode}</code></p>
                <p class="text-help">Vui lòng chọn pet để liên kết với thiết bị này</p>
            </div>
        `;

    this.showElement(this.elements.pairingPanel);
    this.elements.pairingCodeInput.value = data.pairingCode;
  }

  // Hiển thị thông tin pairing khi user khởi tạo
  showPairingInfo(pairingInfo) {
    this.elements.pairingInfo.innerHTML = `
            <div class="pet-card">
                <h4>🔗 Khởi Tạo Pairing</h4>
                <p><strong>Pet:</strong> ${pairingInfo.petName}</p>
                <p><strong>Mã Pairing:</strong> <code class="pairing-code" style="font-size: 1.2em; background: #fff3cd; padding: 5px 10px; border-radius: 5px;">${
                  pairingInfo.pairingCode
                }</code></p>
                <p><strong>Hết hạn:</strong> ${new Date(
                  pairingInfo.expiresAt
                ).toLocaleTimeString()}</p>
                <p class="text-help">Nhập mã này vào thiết bị ESP32 để hoàn tất pairing</p>
            </div>
        `;

    this.showElement(this.elements.pairingPanel);
    this.elements.pairingCodeInput.value = pairingInfo.pairingCode;
  }

  // Hiển thị danh sách pet với action buttons
  displayPetsList(pets) {
    if (!pets || pets.length === 0) {
      this.elements.petsList.innerHTML = `
                <div class="pet-card text-center">
                    <p>🐾 Chưa có pet nào được tạo</p>
                    <p class="text-help">Hãy tạo pet mới để bắt đầu theo dõi</p>
                </div>
            `;
      return;
    }

    this.elements.petsList.innerHTML = pets
      .map(
        (pet) => `
            <div class="pet-card">
                <h4>${
                  pet.name
                } <span class="pet-species">(${this.getSpeciesName(
          pet.species
        )})</span></h4>
                <p><strong>Giống:</strong> ${pet.breed}</p>
                <p><strong>Tuổi:</strong> ${pet.age} năm</p>
                <p><strong>Trạng thái Bluetooth:</strong> 
                    ${
                      pet.bluetoothDevice?.isPaired
                        ? '<span class="status--connected">✅ Đã kết nối</span>'
                        : '<span class="status--disconnected">❌ Chưa kết nối</span>'
                    }
                </p>
                ${
                  pet.bluetoothDevice?.macAddress
                    ? `<p><strong>MAC:</strong> <code>${pet.bluetoothDevice.macAddress}</code></p>`
                    : ""
                }
                ${
                  pet.bluetoothDevice?.pairedAt
                    ? `<p><strong>Kết nối lúc:</strong> ${new Date(
                        pet.bluetoothDevice.pairedAt
                      ).toLocaleString()}</p>`
                    : ""
                }
                <div class="pet-actions">
                    <button class="btn btn--primary btn--small" onclick="bluetooth.startPairing('${
                      pet._id
                    }')" ${bluetooth.isConnected ? "" : "disabled"}>
                        <span class="btn__icon">🔗</span>
                        Pair Bluetooth
                    </button>
                    <button class="btn btn--danger btn--small" onclick="petManager.deletePet('${
                      pet._id
                    }')">
                        <span class="btn__icon">🗑️</span>
                        Xóa
                    </button>
                </div>
            </div>
        `
      )
      .join("");
  }

  // Chuyển đổi species code thành tên tiếng Việt
  getSpeciesName(species) {
    const speciesMap = {
      dog: "Chó",
      cat: "Mèo",
      bird: "Chim",
      rabbit: "Thỏ",
      other: "Khác",
    };
    return speciesMap[species] || species;
  }

  // Tạo options cho select pet
  generatePetOptions(pets) {
    if (!pets || pets.length === 0) {
      return '<option value="">Không có pet nào</option>';
    }

    return pets
      .map(
        (pet) =>
          `<option value="${pet._id}">${pet.name} (${this.getSpeciesName(
            pet.species
          )})</option>`
      )
      .join("");
  }

  // Hiển thị dữ liệu pet
  showPetData(data) {
    const activityType = this.getActivityType(data.speed);
    const activityIcon = this.getActivityIcon(activityType);

    this.elements.petData.innerHTML = `
            <div class="data-item">
                <div class="data-item__label">📍 Vị trí</div>
                <div class="data-item__value">${data.latitude.toFixed(
                  6
                )}, ${data.longitude.toFixed(6)}</div>
            </div>
            <div class="data-item">
                <div class="data-item__label">🎯 Hoạt động</div>
                <div class="data-item__value">${activityIcon} ${activityType}</div>
            </div>
            <div class="data-item">
                <div class="data-item__label">🚀 Tốc độ</div>
                <div class="data-item__value">${data.speed} km/h</div>
            </div>
            <div class="data-item">
                <div class="data-item__label">🔋 Pin</div>
                <div class="data-item__value">
                    <div style="background: #e9ecef; border-radius: 10px; height: 20px; margin: 5px 0;">
                        <div style="background: ${this.getBatteryColor(
                          data.batteryLevel
                        )}; width: ${
      data.batteryLevel
    }%; height: 100%; border-radius: 10px; transition: width 0.3s;"></div>
                    </div>
                    ${data.batteryLevel}%
                </div>
            </div>
            <div class="data-item">
                <div class="data-item__label">📡 Tín hiệu</div>
                <div class="data-item__value">${data.signalStrength} dBm</div>
            </div>
            <div class="data-item">
                <div class="data-item__label">🕒 Cập nhật</div>
                <div class="data-item__value">${new Date().toLocaleTimeString()}</div>
            </div>
        `;
  }

  // Màu pin theo %
  getBatteryColor(level) {
    if (level > 70) return "#28a745";
    if (level > 30) return "#ffc107";
    return "#dc3545";
  }

  getActivityType(speed) {
    if (speed < 0.1) return "Đang nghỉ";
    if (speed < 2) return "Đang đi bộ";
    if (speed < 5) return "Đang chạy";
    return "Đang chơi đùa";
  }

  getActivityIcon(activityType) {
    const icons = {
      "Đang nghỉ": "😴",
      "Đang đi bộ": "🚶",
      "Đang chạy": "🏃",
      "Đang chơi đùa": "🎾",
    };
    return icons[activityType] || "❓";
  }

  // Hiển thị thông báo
  showNotification(message, type = "info") {
    // Tạo toast notification
    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
            <div class="toast__icon">${this.getToastIcon(type)}</div>
            <div class="toast__message">${message}</div>
            <button class="toast__close" onclick="this.parentElement.remove()">×</button>
        `;

    // Thêm styles nếu chưa có
    if (!document.querySelector("#toast-styles")) {
      const styles = document.createElement("style");
      styles.id = "toast-styles";
      styles.textContent = `
                .toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    padding: 15px 20px;
                    border-radius: 8px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    z-index: 10000;
                    max-width: 400px;
                    border-left: 4px solid;
                    animation: slideIn 0.3s ease;
                }
                .toast--success { border-color: #28a745; }
                .toast--error { border-color: #dc3545; }
                .toast--info { border-color: #17a2b8; }
                .toast--warning { border-color: #ffc107; }
                .toast__close { 
                    background: none; 
                    border: none; 
                    font-size: 18px; 
                    cursor: pointer;
                    margin-left: auto;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `;
      document.head.appendChild(styles);
    }

    document.body.appendChild(toast);

    // Tự động xóa sau 5 giây
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 5000);
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

  // Hiển thị/ẩn loading
  showLoading(show = true) {
    this.elements.loadingOverlay.style.display = show ? "flex" : "none";
  }

  // Hiển thị/ẩn element
  showElement(element) {
    element.style.display = "block";
  }

  hideElement(element) {
    element.style.display = "none";
  }

  // Bật/tắt nút
  enableButton(button, enable = true) {
    button.disabled = !enable;
  }

  // Hiển thị panel dữ liệu
  showDataPanel() {
    this.showElement(this.elements.dataPanel);
  }

  // Ẩn panel pairing
  hidePairingPanel() {
    this.hideElement(this.elements.pairingPanel);
  }
}

// Khởi tạo UI global
const ui = new UI();
