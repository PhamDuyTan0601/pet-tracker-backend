// js/petManager.js
class PetManager {
  constructor() {
    this.pets = [];
  }

  // Hiển thị form tạo pet mới
  showCreatePetForm() {
    const formHTML = `
            <div class="panel panel--pairing">
                <h3>➕ Thêm Pet Mới</h3>
                <div class="form-group">
                    <label class="form-label">Tên pet:</label>
                    <input type="text" id="newPetName" class="form-input" placeholder="Tên pet...">
                </div>
                <div class="form-group">
                    <label class="form-label">Loài:</label>
                    <select id="newPetSpecies" class="form-select">
                        <option value="dog">Chó</option>
                        <option value="cat">Mèo</option>
                        <option value="bird">Chim</option>
                        <option value="rabbit">Thỏ</option>
                        <option value="other">Khác</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Giống:</label>
                    <input type="text" id="newPetBreed" class="form-input" placeholder="Giống...">
                </div>
                <div class="form-group">
                    <label class="form-label">Tuổi:</label>
                    <input type="number" id="newPetAge" class="form-input" placeholder="Tuổi..." min="0" max="50">
                </div>
                <div class="control-panel">
                    <button class="btn btn--success" onclick="petManager.createPet()">
                        <span class="btn__icon">✅</span>
                        Tạo Pet
                    </button>
                    <button class="btn btn--danger" onclick="petManager.hideCreatePetForm()">
                        <span class="btn__icon">❌</span>
                        Hủy
                    </button>
                </div>
            </div>
        `;

    // Thêm form vào danh sách pets
    document
      .getElementById("petsList")
      .insertAdjacentHTML("afterbegin", formHTML);
  }

  // Ẩn form tạo pet
  hideCreatePetForm() {
    const form = document.querySelector("#petsList .panel");
    if (form) {
      form.remove();
    }
  }

  // Tạo pet mới
  async createPet() {
    const name = document.getElementById("newPetName").value;
    const species = document.getElementById("newPetSpecies").value;
    const breed = document.getElementById("newPetBreed").value;
    const age = document.getElementById("newPetAge").value;

    if (!name || !species || !breed || !age) {
      ui.showNotification("Vui lòng điền đầy đủ thông tin", "error");
      return;
    }

    try {
      ui.showLoading(true);

      const response = await fetch("/api/pets", {
        method: "POST",
        headers: auth.getAuthHeaders(),
        body: JSON.stringify({
          name,
          species,
          breed,
          age: parseInt(age),
        }),
      });

      const result = await response.json();

      if (result.success) {
        ui.showNotification(`Đã tạo pet ${name} thành công!`, "success");
        this.hideCreatePetForm();

        // Reload danh sách pets
        if (window.bluetooth) {
          await window.bluetooth.loadPets();
        }
      } else {
        ui.showNotification(result.message || "Tạo pet thất bại", "error");
      }
    } catch (error) {
      ui.showNotification("Lỗi kết nối server", "error");
      console.error("Create pet error:", error);
    } finally {
      ui.showLoading(false);
    }
  }

  // Xóa pet
  async deletePet(petId) {
    if (!confirm("Bạn có chắc muốn xóa pet này?")) {
      return;
    }

    try {
      ui.showLoading(true);

      const response = await fetch(`/api/pets/${petId}`, {
        method: "DELETE",
        headers: auth.getAuthHeaders(),
      });

      const result = await response.json();

      if (result.success) {
        ui.showNotification("Đã xóa pet thành công!", "success");

        // Reload danh sách pets
        if (window.bluetooth) {
          await window.bluetooth.loadPets();
        }
      } else {
        ui.showNotification(result.message || "Xóa pet thất bại", "error");
      }
    } catch (error) {
      ui.showNotification("Lỗi kết nối server", "error");
      console.error("Delete pet error:", error);
    } finally {
      ui.showLoading(false);
    }
  }
}

// Khởi tạo Pet manager global
const petManager = new PetManager();
