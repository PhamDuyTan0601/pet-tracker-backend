class WifiManager {
  constructor() {
    this.connectedDevice = null;
    this.isConnected = false;
    this.dataInterval = null;
  }

  // Quét QR code WiFi
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
              <p style="font-size: 12px; color: #666;">(Đang giả lập cho demo)</p>
            </div>
          </div>
          <p>Hoặc nhập thông tin thủ công:</p>
          <button class="btn btn-primary" onclick="wifiManager.showWifiForm()">Nhập Thủ Công</button>
          <button class="btn btn-danger" onclick="this.parentElement.parentElement.remove()">Hủy</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", html);

    // Giả lập quét QR thành công sau 3 giây
    setTimeout(() => {
      document.querySelector(".modal")?.remove();
      this.handleScannedQR({
        deviceId: "PT" + Math.random().toString(36).substr(2, 4).toUpperCase(),
        wifiConfig: {
          ssid: "PetTracker_Network",
          password: "pet123456",
        },
        serverUrl: "https://pet-tracker-md3r.onrender.com",
      });
    }, 3000);
  }

  // Hiển thị form cấu hình WiFi
  showWifiForm() {
    document.querySelector(".modal")?.remove();

    const html = `
      <div class="modal active">
        <div class="modal-content">
          <h3>⚙️ Cấu Hình WiFi</h3>
          <input type="text" id="wifiSSID" placeholder="Tên WiFi (SSID)" class="form-input" value="PetTracker_Network">
          <input type="password" id="wifiPassword" placeholder="Mật khẩu WiFi" class="form-input" value="pet123456">
          <input type="text" id="deviceId" placeholder="ID Thiết bị (VD: PT001)" class="form-input" value="PT${Math.random()
            .toString(36)
            .substr(2, 4)
            .toUpperCase()}">
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-success" onclick="wifiManager.connectToWifi()">Kết Nối</button>
            <button class="btn btn-danger" onclick="this.parentElement.parentElement.remove()">Hủy</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", html);
  }

  // Xử lý QR code đã quét
  handleScannedQR(qrData) {
    ui.showNotification(`✅ Đã quét thiết bị: ${qrData.deviceId}`, "success");

    // Hiển thị thông tin WiFi
    const html = `
      <div class="modal active">
        <div class="modal-content">
          <h3>✅ Đã Quét Thành Công</h3>
          <div class="wifi-info" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Thiết bị:</strong> ${qrData.deviceId}</p>
            <p><strong>WiFi SSID:</strong> ${qrData.wifiConfig.ssid}</p>
            <p><strong>Mật khẩu:</strong> *******</p>
            <p><strong>Server:</strong> ${qrData.serverUrl}</p>
          </div>
          <p>Hãy cấu hình thiết bị với thông tin trên và chọn pet để kết nối:</p>
          <select id="petSelectWifi" class="form-input">
            <option value="">-- Chọn Pet --</option>
          </select>
          <div style="display: flex; gap: 10px; margin-top: 15px;">
            <button class="btn btn-success" onclick="wifiManager.pairDevice('${qrData.deviceId}')">Kết Nối Ngay</button>
            <button class="btn btn-danger" onclick="this.parentElement.parentElement.remove()">Hủy</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", html);
    this.loadPetsForSelection();
  }

  // Kết nối WiFi thủ công
  async connectToWifi() {
    const ssid = document.getElementById("wifiSSID").value;
    const password = document.getElementById("wifiPassword").value;
    const deviceId = document.getElementById("deviceId").value;

    if (!ssid || !password || !deviceId) {
      ui.showNotification("Vui lòng điền đầy đủ thông tin", "error");
      return;
    }

    ui.showNotification(
      `📡 Đang kết nối ${deviceId} đến WiFi ${ssid}...`,
      "info"
    );

    document.querySelector(".modal")?.remove();

    // Giả lập kết nối thành công
    setTimeout(() => {
      this.handleScannedQR({
        deviceId: deviceId,
        wifiConfig: { ssid, password },
        serverUrl: "https://pet-tracker-md3r.onrender.com",
      });
    }, 2000);
  }

  // Tải danh sách pet để chọn
  async loadPetsForSelection() {
    const pets = await petManager.loadPets();
    const select = document.getElementById("petSelectWifi");

    if (pets && pets.length > 0) {
      select.innerHTML =
        '<option value="">-- Chọn Pet --</option>' +
        pets
          .map(
            (pet) =>
              `<option value="${pet._id}">${pet.name} (${pet.species})</option>`
          )
          .join("");
    } else {
      select.innerHTML = '<option value="">Chưa có pet nào</option>';
    }
  }

  // Ghép nối thiết bị với pet
  async pairDevice(deviceId) {
    const petId = document.getElementById("petSelectWifi").value;

    if (!petId) {
      ui.showNotification("Vui lòng chọn pet", "error");
      return;
    }

    try {
      ui.showNotification("🔄 Đang ghép nối thiết bị...", "info");

      // Gọi API ghép nối WiFi
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
        ui.showNotification("✅ Kết nối WiFi thành công!", "success");
        document.querySelectorAll(".modal").forEach((modal) => modal.remove());

        // Bắt đầu nhận dữ liệu
        this.startReceivingData(deviceId);

        // Load lại danh sách pet
        petManager.loadPets();
      } else {
        ui.showNotification(result.message, "error");
      }
    } catch (error) {
      ui.showNotification("❌ Lỗi kết nối đến server", "error");
    }
  }

  // Bắt đầu nhận dữ liệu từ thiết bị WiFi
  startReceivingData(deviceId) {
    this.connectedDevice = deviceId;
    this.isConnected = true;

    ui.showNotification(`📡 Đang chờ dữ liệu từ ${deviceId}...`, "info");

    // Dừng interval cũ nếu có
    if (this.dataInterval) {
      clearInterval(this.dataInterval);
    }

    // Giả lập nhận dữ liệu mỗi 5 giây
    this.dataInterval = setInterval(() => {
      if (this.isConnected) {
        this.handleReceivedData({
          deviceId: deviceId,
          type: "pet_data",
          latitude: 10.8231 + (Math.random() - 0.5) * 0.01,
          longitude: 106.6297 + (Math.random() - 0.5) * 0.01,
          speed: Math.random() * 10,
          battery: 80 + Math.random() * 20,
          timestamp: new Date().toISOString(),
        });
      }
    }, 5000);
  }

  // Xử lý dữ liệu nhận được
  handleReceivedData(data) {
    if (data.type === "pet_data") {
      ui.showPetData(data);
      ui.showNotification(
        `📍 Nhận dữ liệu vị trí từ ${data.deviceId}`,
        "success"
      );
    }
  }

  // Ngắt kết nối
  disconnect() {
    this.isConnected = false;
    this.connectedDevice = null;

    if (this.dataInterval) {
      clearInterval(this.dataInterval);
      this.dataInterval = null;
    }

    ui.showNotification("📴 Đã ngắt kết nối WiFi", "info");
  }
}

const wifiManager = new WifiManager();
