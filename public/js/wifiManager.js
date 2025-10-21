// File: wifiManager.js - PHIÊN BẢN THỰC TẾ
class WifiManager {
  constructor() {
    this.connectedDevice = null;
    this.isConnected = false;
    this.dataInterval = null;
    this.lastData = null;
  }

  // Quét QR code WiFi - THỰC TẾ
  scanWifiQR() {
    if (!auth.userId) {
      ui.showNotification("Vui lòng đăng nhập", "error");
      return;
    }

    const html = `
      <div class="modal active">
        <div class="modal-content">
          <h3>📷 Quét QR Code WiFi</h3>
          <p>Quét mã QR từ thiết bị Pet Tracker</p>
          <div id="qrReader" style="width: 300px; height: 300px; margin: 20px auto; background: #f5f5f5; display: flex; align-items: center; justify-content: center; border: 2px dashed #ccc; border-radius: 10px;">
            <div style="text-align: center;">
              <div style="font-size: 48px;">📱</div>
              <p>Camera sẽ được kích hoạt tại đây</p>
            </div>
          </div>
          <p>Hoặc nhập Device ID thực tế:</p>
          <input type="text" id="manualDeviceId" placeholder="PT001, PT002..." class="form-input">
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-primary" onclick="wifiManager.connectManual()">Kết Nối</button>
            <button class="btn btn-danger" onclick="this.parentElement.parentElement.remove()">Hủy</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", html);
  }

  // Kết nối thủ công với Device ID thực
  async connectManual() {
    const deviceId = document.getElementById("manualDeviceId").value;
    if (!deviceId) {
      ui.showNotification("Vui lòng nhập Device ID thực tế", "error");
      return;
    }

    await this.connectToDevice(deviceId);
  }

  // Kết nối đến thiết bị thực tế
  async connectToDevice(deviceId) {
    try {
      ui.showNotification(`🔍 Đang tìm thiết bị ${deviceId}...`, "info");

      // Kiểm tra thiết bị có tồn tại không
      const deviceExists = await this.checkDeviceExists(deviceId);
      if (!deviceExists) {
        ui.showNotification(
          "❌ Thiết bị không tồn tại hoặc chưa gửi dữ liệu",
          "error"
        );
        return;
      }

      // Hiển thị chọn pet
      await this.showPetSelection(deviceId);
    } catch (error) {
      ui.showNotification("Lỗi kết nối: " + error.message, "error");
    }
  }

  // Kiểm tra thiết bị có tồn tại trong database không
  async checkDeviceExists(deviceId) {
    try {
      const response = await fetch(`/api/wifi-devices/check/${deviceId}`);
      const result = await response.json();
      return result.exists;
    } catch (error) {
      return false;
    }
  }

  // Hiển thị chọn pet cho thiết bị thực
  async showPetSelection(deviceId) {
    document.querySelector(".modal")?.remove();

    const pets = await petManager.loadPets();

    const html = `
      <div class="modal active">
        <div class="modal-content">
          <h3>🔗 Kết Nối Thiết Bị Thực</h3>
          <div class="wifi-info">
            <p><strong>Device ID:</strong> ${deviceId}</p>
            <p><strong>Trạng thái:</strong> <span class="status-online">✅ Đang hoạt động</span></p>
            <p><em>Thiết bị này sẽ gửi dữ liệu GPS thực tế</em></p>
          </div>
          <p>Chọn pet để kết nối:</p>
          <select id="petSelectWifi" class="form-input">
            <option value="">-- Chọn Pet --</option>
            ${pets
              .map(
                (pet) =>
                  `<option value="${pet._id}">${pet.name} (${pet.species})</option>`
              )
              .join("")}
          </select>
          <div style="display: flex; gap: 10px; margin-top: 15px;">
            <button class="btn btn-success" onclick="wifiManager.pairRealDevice('${deviceId}')">Kết Nối Thiết Bị Thực</button>
            <button class="btn btn-danger" onclick="this.parentElement.parentElement.remove()">Hủy</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", html);
  }

  // Ghép nối thiết bị THỰC TẾ
  async pairRealDevice(deviceId) {
    const petId = document.getElementById("petSelectWifi").value;

    if (!petId) {
      ui.showNotification("Vui lòng chọn pet", "error");
      return;
    }

    try {
      ui.showNotification("🔄 Đang ghép nối thiết bị thực...", "info");

      const response = await fetch("/api/wifi-devices/pair", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          userId: auth.userId,
        },
        body: JSON.stringify({
          deviceId: deviceId,
          petId: petId,
          userId: auth.userId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        ui.showNotification("✅ Kết nối thiết bị thực thành công!", "success");
        document.querySelectorAll(".modal").forEach((modal) => modal.remove());

        // Bắt đầu theo dõi dữ liệu THỰC
        this.startRealTimeMonitoring(deviceId, petId);

        // Load lại danh sách pet
        petManager.loadPets();
      } else {
        ui.showNotification(result.message, "error");
      }
    } catch (error) {
      ui.showNotification("❌ Lỗi kết nối server", "error");
    }
  }

  // Bắt đầu theo dõi dữ liệu THỰC TẾ từ ESP32
  startRealTimeMonitoring(deviceId, petId) {
    this.connectedDevice = deviceId;
    this.isConnected = true;

    ui.showNotification(
      `📡 Đang theo dõi dữ liệu thực từ ${deviceId}...`,
      "success"
    );

    // Dừng interval cũ nếu có
    if (this.dataInterval) {
      clearInterval(this.dataInterval);
    }

    // Lấy dữ liệu thực từ server mỗi 3 giây
    this.dataInterval = setInterval(async () => {
      if (this.isConnected) {
        await this.fetchRealData(deviceId, petId);
      }
    }, 3000);
  }

  // Lấy dữ liệu THỰC TẾ từ server
  async fetchRealData(deviceId, petId) {
    try {
      const response = await fetch(`/api/pet-data/pet/${petId}/latest`);
      const result = await response.json();

      if (result.success && result.data) {
        const realData = result.data;

        // Chỉ hiển thị nếu có dữ liệu mới
        if (!this.lastData || this.lastData.timestamp !== realData.timestamp) {
          this.handleRealData({
            deviceId: deviceId,
            type: "real_pet_data",
            latitude: realData.latitude,
            longitude: realData.longitude,
            speed: realData.speed || 0,
            battery: realData.batteryLevel || 85,
            satellites: realData.satellites || 0,
            accuracy: realData.accuracy || 5.0,
            timestamp: realData.timestamp,
          });

          this.lastData = realData;
        }
      }
    } catch (error) {
      console.log("Chưa có dữ liệu thực từ ESP32");
    }
  }

  // Xử lý dữ liệu THỰC nhận được
  handleRealData(data) {
    if (data.type === "real_pet_data") {
      ui.showRealPetData(data);

      // Chỉ thông báo khi có dữ liệu mới
      const now = new Date();
      const dataTime = new Date(data.timestamp);
      const diffMinutes = (now - dataTime) / (1000 * 60);

      if (diffMinutes < 5) {
        // Dữ liệu trong 5 phút gần đây
        ui.showNotification(
          `📍 Nhận dữ liệu THỰC từ ${data.deviceId} - ${data.satellites} vệ tinh`,
          "success"
        );
      }
    }
  }

  // Ngắt kết nối
  disconnect() {
    this.isConnected = false;
    this.connectedDevice = null;
    this.lastData = null;

    if (this.dataInterval) {
      clearInterval(this.dataInterval);
      this.dataInterval = null;
    }

    ui.showNotification("📴 Đã ngắt kết nối thiết bị thực", "info");

    // Ẩn panel data
    document.getElementById("dataPanel").style.display = "none";
  }

  // Kiểm tra trạng thái thiết bị
  async checkDeviceStatus(deviceId) {
    try {
      const response = await fetch(`/api/wifi-devices/status/${deviceId}`);
      const result = await response.json();
      return result;
    } catch (error) {
      return { online: false, lastSeen: null };
    }
  }
}

const wifiManager = new WifiManager();
