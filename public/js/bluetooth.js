class BluetoothManager {
  constructor() {
    this.device = null;
    this.server = null;
    this.characteristic = null;
    this.isConnected = false;
    this.pets = [];
  }

  async scanDevices() {
    try {
      if (!navigator.bluetooth) {
        ui.showNotification("Trình duyệt không hỗ trợ Bluetooth", "error");
        return;
      }

      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ name: "PetTracker_" }],
        optionalServices: ["12345678-1234-1234-1234-123456789abc"],
      });

      ui.showNotification(`Tìm thấy: ${this.device.name}`, "success");
      await this.connectToDevice(this.device);
    } catch (error) {
      if (error.name !== "NotFoundError") {
        ui.showNotification("Lỗi quét thiết bị", "error");
      }
    }
  }

  async connectToDevice(deviceOrId) {
    try {
      let device;
      if (typeof deviceOrId === "string") {
        // Connect by device ID
        device = await navigator.bluetooth.requestDevice({
          filters: [{ name: `PetTracker_${deviceOrId}` }],
        });
      } else {
        device = deviceOrId;
      }

      this.server = await device.gatt.connect();
      this.isConnected = true;

      ui.showNotification("Kết nối Bluetooth thành công!", "success");

      // Start listening for data
      this.startDataListening();
    } catch (error) {
      ui.showNotification("Lỗi kết nối Bluetooth", "error");
    }
  }

  startDataListening() {
    // In real implementation, setup characteristic notifications
    setInterval(() => {
      if (this.isConnected) {
        // Simulate receiving data
        this.handleReceivedData({
          type: "pet_data",
          latitude: 10.8231 + (Math.random() - 0.5) * 0.01,
          longitude: 106.6297 + (Math.random() - 0.5) * 0.01,
          speed: Math.random() * 10,
          battery: 80 + Math.random() * 20,
        });
      }
    }, 5000);
  }

  handleReceivedData(data) {
    if (data.type === "pet_data") {
      ui.showPetData(data);
    }
  }
}

const bluetooth = new BluetoothManager();
