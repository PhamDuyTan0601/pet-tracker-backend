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
    // Các event listeners sẽ được thêm ở đây nếu cần
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
                <p><strong>Kết nối:</strong> <span class="status--connected">Sẵn sàng</span></p>
            </div>
        `;
  }

  // Hiển thị yêu cầu pairing
  showPairingRequest(data) {
    this.elements.pairingInfo.innerHTML = `
            <div class="pet-card">
                <h4>🎯 Thiết Bị Mới Phát Hiện</h4>
                <p><strong>Tên thiết bị:</strong> ${data.deviceName}</p>
                <p><strong>Địa chỉ MAC:</strong> <code>${data.macAddress}</code></p>
                <p><strong>Mã xác nhận:</strong> <code class="pairing-code">${data.pairingCode}</code></p>
                <p class="text-help">Vui lòng chọn pet để liên kết với thiết bị này</p>
            </div>
        `;

    this.showElement(this.elements.pairingPanel);
    this.elements.pairingCodeInput.value = data.pairingCode;
  }

  // Hiển thị danh sách pet
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
                <h4>${pet.name} <span class="pet-species">(${
          pet.species
        })</span></h4>
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
            </div>
        `
      )
      .join("");
  }

  // Tạo options cho select pet
  generatePetOptions(pets) {
    if (!pets || pets.length === 0) {
      return '<option value="">Không có pet nào</option>';
    }

    return pets
      .map(
        (pet) =>
          `<option value="${pet._id}">${pet.name} (${pet.species}) - ${pet.breed}</option>`
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
                <div class="data-item__value">${data.batteryLevel}%</div>
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
    // Có thể triển khai toast notification ở đây
    console.log(`[${type.toUpperCase()}] ${message}`);
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
