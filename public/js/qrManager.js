class QRManager {
  constructor() {
    this.scanner = null;
  }

  // Show QR scanner
  scanQR() {
    if (!auth.userId) {
      ui.showNotification("Vui lòng đăng nhập", "error");
      return;
    }

    const html = `
            <div class="modal active">
                <div class="modal-content">
                    <h3>📷 Quét QR Code</h3>
                    <p>Đưa camera vào mã QR trên thiết bị</p>
                    <div id="qrReader" style="width: 300px; height: 300px; margin: 20px auto;"></div>
                    <p>Hoặc nhập Device ID:</p>
                    <input type="text" id="manualDeviceId" placeholder="PT001" class="form-input">
                    <button class="btn btn-primary" onclick="qrManager.connectManual()">Kết Nối</button>
                    <button class="btn btn-danger" onclick="this.parentElement.parentElement.remove()">Hủy</button>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", html);

    // In real app, use camera QR scanner library
    // For demo, we'll use manual input
  }

  // Connect with manual device ID
  async connectManual() {
    const deviceId = document.getElementById("manualDeviceId").value;
    if (!deviceId) {
      ui.showNotification("Vui lòng nhập Device ID", "error");
      return;
    }

    await this.connectToDevice(deviceId);
  }

  // Connect to device
  async connectToDevice(deviceId) {
    try {
      ui.showNotification(`Đang kết nối với device ${deviceId}...`, "info");

      // Get device info
      const deviceInfo = await this.getDeviceInfo(deviceId);

      // Show pet selection
      await this.showPetSelection(deviceId, deviceInfo);
    } catch (error) {
      ui.showNotification("Lỗi kết nối: " + error.message, "error");
    }
  }

  async getDeviceInfo(deviceId) {
    const response = await fetch(`/api/qr/device/${deviceId}`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message);
    }

    return result.device;
  }

  async showPetSelection(deviceId, deviceInfo) {
    // Load user's pets
    const pets = await petManager.loadPets();

    const html = `
            <div class="modal active">
                <div class="modal-content">
                    <h3>Chọn Pet để Kết Nối</h3>
                    <p>Device: ${deviceInfo.name}</p>
                    <select id="petSelect" class="form-input">
                        ${pets
                          .map(
                            (pet) =>
                              `<option value="${pet._id}">${pet.name}</option>`
                          )
                          .join("")}
                    </select>
                    <button class="btn btn-success" onclick="qrManager.pairDevice('${deviceId}')">Kết Nối</button>
                    <button class="btn btn-danger" onclick="this.parentElement.parentElement.remove()">Hủy</button>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", html);
  }

  async pairDevice(deviceId) {
    const petId = document.getElementById("petSelect").value;

    try {
      const response = await fetch("/api/qr/pair", {
        method: "POST",
        headers: auth.getAuthHeaders(),
        body: JSON.stringify({
          deviceId: deviceId,
          petId: petId,
          userId: auth.userId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        ui.showNotification("Kết nối thành công!", "success");

        // Close modals
        document.querySelectorAll(".modal").forEach((modal) => modal.remove());

        // Refresh pets list
        petManager.loadPets();

        // Connect via Bluetooth
        bluetooth.connectToDevice(deviceId);
      } else {
        ui.showNotification(result.message, "error");
      }
    } catch (error) {
      ui.showNotification("Lỗi kết nối", "error");
    }
  }
}

const qrManager = new QRManager();
