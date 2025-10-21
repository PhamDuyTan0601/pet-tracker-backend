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
      .map(
        (pet) => `
            <div class="pet-card">
                <h4>${pet.name} (${pet.species})</h4>
                <p>Giống: ${pet.breed} - Tuổi: ${pet.age}</p>
                <p>Kết nối: ${
                  pet.bluetoothDevice?.isPaired
                    ? "✅ Đã kết nối WiFi"
                    : "❌ Chưa kết nối"
                }</p>
                ${
                  pet.bluetoothDevice?.macAddress
                    ? `<p>Device ID: ${pet.bluetoothDevice.macAddress}</p>`
                    : ""
                }
                ${
                  pet.lastSeen
                    ? `<p>Lần cuối: ${new Date(
                        pet.lastSeen
                      ).toLocaleString()}</p>`
                    : ""
                }
            </div>
        `
      )
      .join("");
  }

  showCreateForm() {
    const html = `
            <div class="modal active">
                <div class="modal-content">
                    <h3>➕ Thêm Pet Mới</h3>
                    <input type="text" id="petName" placeholder="Tên pet" class="form-input">
                    <select id="petSpecies" class="form-input">
                        <option value="dog">Chó</option>
                        <option value="cat">Mèo</option>
                        <option value="bird">Chim</option>
                        <option value="rabbit">Thỏ</option>
                    </select>
                    <input type="text" id="petBreed" placeholder="Giống" class="form-input">
                    <input type="number" id="petAge" placeholder="Tuổi" class="form-input">
                    <button class="btn btn-success" onclick="petManager.createPet()">Tạo Pet</button>
                    <button class="btn btn-danger" onclick="this.parentElement.parentElement.remove()">Hủy</button>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", html);
  }

  async createPet() {
    const name = document.getElementById("petName").value;
    const species = document.getElementById("petSpecies").value;
    const breed = document.getElementById("petBreed").value;
    const age = document.getElementById("petAge").value;

    try {
      const response = await fetch("/api/pets", {
        method: "POST",
        headers: auth.getAuthHeaders(),
        body: JSON.stringify({ name, species, breed, age: parseInt(age) }),
      });

      const result = await response.json();

      if (result.success) {
        ui.showNotification("Đã tạo pet thành công!", "success");
        document.querySelector(".modal").remove();
        this.loadPets();
      } else {
        ui.showNotification(result.message, "error");
      }
    } catch (error) {
      ui.showNotification("Lỗi tạo pet", "error");
    }
  }
}

const petManager = new PetManager();
