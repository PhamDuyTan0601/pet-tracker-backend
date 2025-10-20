class BluetoothManager {
  constructor() {
    this.device = null;
    this.server = null;
    this.characteristic = null;
    this.isConnected = false;
    this.pairedPetId = null;
    this.pets = [];

    // UUID services và characteristics
    this.PET_SERVICE_UUID = "12345678-1234-1234-1234-123456789abc";
    this.DATA_CHARACTERISTIC_UUID = "12345678-1234-1234-1234-123456789abd";

    this.init();
  }

  async init() {
    // Kiểm tra browser support
    if (!navigator.bluetooth) {
      ui.updateStatus("Trình duyệt không hỗ trợ Web Bluetooth", "error");
      return;
    }

    // Load danh sách pet
    await this.loadPets();
    ui.updateStatus("Sẵn sàng kết nối", "disconnected");
  }

  // Quét thiết bị Bluetooth
  async scanDevices() {
    try {
      ui.updateStatus("🔍 Đang quét thiết bị...", "scanning");
      ui.showLoading(true);

      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { name: "ESP32_Pet_Tracker" },
          { namePrefix: "PET_" },
          { services: [this.PET_SERVICE_UUID] },
        ],
        optionalServices: [this.PET_SERVICE_UUID],
      });

      ui.updateStatus(`📱 Tìm thấy: ${this.device.name}`, "connected");
      ui.showDeviceInfo(this.device);
      ui.enableButton(ui.elements.connectBtn, true);
    } catch (error) {
      if (error.name !== "NotFoundError") {
        ui.updateStatus("❌ Quét thất bại: " + error.message, "error");
      }
    } finally {
      ui.showLoading(false);
    }
  }

  // Kết nối đến thiết bị
  async connectToDevice() {
    if (!this.device) return;

    try {
      ui.updateStatus("🔄 Đang kết nối...", "scanning");
      ui.showLoading(true);

      this.server = await this.device.gatt.connect();
      const service = await this.server.getPrimaryService(
        this.PET_SERVICE_UUID
      );
      this.characteristic = await service.getCharacteristic(
        this.DATA_CHARACTERISTIC_UUID
      );

      // Lắng nghe dữ liệu
      await this.characteristic.startNotifications();
      this.characteristic.addEventListener(
        "characteristicvaluechanged",
        this.handleDataReceived.bind(this)
      );

      this.isConnected = true;
      this.setupConnectionEvents();

      ui.updateStatus("✅ Đã kết nối!", "connected");
      ui.enableButton(ui.elements.connectBtn, false);
      ui.enableButton(ui.elements.disconnectBtn, true);
    } catch (error) {
      ui.updateStatus("❌ Kết nối thất bại: " + error.message, "error");
    } finally {
      ui.showLoading(false);
    }
  }

  // Xử lý sự kiện kết nối
  setupConnectionEvents() {
    this.device.addEventListener("gattserverdisconnected", () => {
      this.handleDisconnection();
    });
  }

  // Xử lý mất kết nối
  handleDisconnection() {
    this.isConnected = false;
    ui.updateStatus("❌ Đã mất kết nối", "disconnected");
    ui.enableButton(ui.elements.connectBtn, true);
    ui.enableButton(ui.elements.disconnectBtn, false);
    ui.hideElement(ui.elements.dataPanel);
  }

  // Ngắt kết nối
  async disconnectDevice() {
    if (this.server) {
      this.server.disconnect();
    }
    this.handleDisconnection();
  }

  // Xử lý dữ liệu nhận được
  handleDataReceived(event) {
    const value = event.target.value;
    const decoder = new TextDecoder();
    const message = decoder.decode(value);

    try {
      const data = JSON.parse(message);
      this.processBluetoothData(data);
    } catch (error) {
      console.log("Dữ liệu thô:", message);
    }
  }

  // Xử lý dữ liệu Bluetooth theo type
  processBluetoothData(data) {
    console.log("📨 Bluetooth data:", data);

    switch (data.type) {
      case "pairing_request":
        ui.showPairingRequest(data);
        break;

      case "pet_data":
        ui.showPetData(data);
        ui.showDataPanel();
        break;

      case "device_status":
        this.showDeviceStatus(data);
        break;

      case "pairing_success":
        ui.showNotification("Pairing thành công!", "success");
        break;

      default:
        console.log("Unknown message type:", data.type);
    }
  }

  // Xác nhận pairing với server
  async confirmPairing() {
    const pairingCode = ui.elements.pairingCodeInput.value;
    const petId = ui.elements.petSelect.value;
    const macAddress = this.getMacFromDevice();

    if (!pairingCode || !petId) {
      ui.showNotification("Vui lòng nhập mã pairing và chọn pet!", "error");
      return;
    }

    try {
      ui.showLoading(true);
      ui.updateStatus("🔄 Đang xác nhận pairing...", "scanning");

      const response = await fetch("/api/bluetooth/confirm-pairing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pairingCode: pairingCode,
          macAddress: macAddress,
          deviceInfo: {
            firmwareVersion: "1.0.0",
            userAgent: navigator.userAgent,
            connectedVia: "Web Bluetooth",
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        ui.updateStatus("✅ Pairing thành công!", "connected");
        this.pairedPetId = result.pet.id;

        // Gửi xác nhận đến ESP32
        await this.sendPairingConfirmation(result.pet.id);

        // Cập nhật UI
        ui.showDataPanel();
        ui.hidePairingPanel();
        ui.showNotification(
          `Đã kết nối với ${result.pet.name} thành công!`,
          "success"
        );

        // Reload danh sách pet
        await this.loadPets();
      } else {
        ui.updateStatus("❌ Pairing thất bại: " + result.message, "error");
        ui.showNotification("Pairing thất bại: " + result.message, "error");
      }
    } catch (error) {
      ui.updateStatus("❌ Lỗi pairing: " + error.message, "error");
      ui.showNotification("Lỗi kết nối server", "error");
    } finally {
      ui.showLoading(false);
    }
  }

  // Gửi xác nhận pairing đến ESP32
  async sendPairingConfirmation(petId) {
    const message = {
      type: "pairing_confirmation",
      success: true,
      petId: petId,
      message: "Pairing thành công từ Web App",
      timestamp: Date.now(),
    };

    await this.sendMessage(message);
  }

  // Gửi message đến ESP32
  async sendMessage(message) {
    if (!this.characteristic) {
      ui.showNotification("Chưa kết nối đến thiết bị", "error");
      return;
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(message));
      await this.characteristic.writeValue(data);
      console.log("📤 Sent message:", message);
    } catch (error) {
      ui.showNotification("Lỗi gửi dữ liệu: " + error.message, "error");
    }
  }

  // Yêu cầu dữ liệu mới từ ESP32
  async requestData() {
    await this.sendMessage({
      type: "data_request",
      timestamp: Date.now(),
    });
  }

  // Load danh sách pet từ server
  async loadPets() {
    try {
      const response = await fetch("/api/pets/my-pets");
      const result = await response.json();

      if (result.success) {
        this.pets = result.pets;
        ui.displayPetsList(this.pets);
        ui.elements.petSelect.innerHTML = ui.generatePetOptions(this.pets);
      }
    } catch (error) {
      console.error("Lỗi load pets:", error);
      ui.showNotification("Không thể tải danh sách pet", "error");
    }
  }

  // Lấy MAC address từ device
  getMacFromDevice() {
    if (!this.device) return "";
    // Chrome thường cung cấp device ID chứa MAC
    return this.device.id.replace(/[^0-9A-F]/gi, "").toUpperCase();
  }

  // Hiển thị trạng thái thiết bị
  showDeviceStatus(data) {
    console.log("📊 Device status:", data);
    ui.showNotification(
      `Trạng thái thiết bị: Pin ${data.batteryLevel}%`,
      "info"
    );
  }
}

// Khởi tạo Bluetooth manager global
const bluetooth = new BluetoothManager();
