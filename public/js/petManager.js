// File: petManager.js - CẬP NHẬT HIỂN THỊ THỰC TẾ
class PetManager {
  constructor() {
    this.pets = [];
  }

  async loadPets() {
    try {
      const response = await fetch("/api/pets/my-pets", {
        headers: { userId: auth.userId },
      });

      const result = await response.json();

      if (result.success) {
        this.pets = result.pets;
        this.displayPets();
        return this.pets;
      }
    } catch (error) {
      console.error("Error loading pets:", error);
    }
    return [];
  }

  displayPets() {
    const petsList = document.getElementById("petsList");

    if (this.pets.length === 0) {
      petsList.innerHTML = "<p>Chưa có pet nào. Hãy tạo pet mới!</p>";
      return;
    }

    petsList.innerHTML = this.pets
      .map((pet) => {
        const isConnected = pet.bluetoothDevice?.isPaired;
        const deviceId = pet.bluetoothDevice?.macAddress;
        const lastSeen = pet.lastSeen ? new Date(pet.lastSeen) : null;

        // Tính thời gian từ lần cuối
        let lastSeenText = "Chưa có dữ liệu";
        if (lastSeen) {
          const now = new Date();
          const diffMinutes = Math.round((now - lastSeen) / (1000 * 60));
          if (diffMinutes < 1) lastSeenText = "Vài giây trước";
          else if (diffMinutes < 60) lastSeenText = `${diffMinutes} phút trước`;
          else lastSeenText = lastSeen.toLocaleTimeString();
        }

        return `
          <div class="pet-card">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div>
                <h4>${pet.name} (${pet.species})</h4>
                <p>Giống: ${pet.breed} - Tuổi: ${pet.age}</p>
                <p>Kết nối: ${
                  isConnected
                    ? '<span class="status-online">✅ Đang kết nối WiFi</span>'
                    : '<span class="status-offline">❌ Chưa kết nối</span>'
                }</p>
                ${
                  deviceId
                    ? `<p><strong>Device ID:</strong> ${deviceId}</p>`
                    : ""
                }
                <p><strong>Lần cuối:</strong> ${lastSeenText}</p>
              </div>
              ${
                isConnected
                  ? `<button class="btn btn-warning" onclick="wifiManager.disconnect()" style="padding: 8px 12px; font-size: 12px;">Ngắt kết nối</button>`
                  : `<button class="btn btn-primary" onclick="wifiManager.scanWifiQR()" style="padding: 8px 12px; font-size: 12px;">Kết nối WiFi</button>`
              }
            </div>
          </div>
        `;
      })
      .join("");
  }

  // Các hàm khác giữ nguyên...
  showCreateForm() {
    // Giữ nguyên
  }

  async createPet() {
    // Giữ nguyên
  }
}

const petManager = new PetManager();
