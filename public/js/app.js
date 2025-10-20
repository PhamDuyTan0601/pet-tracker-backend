class PetTrackerApp {
  constructor() {
    this.init();
  }

  async init() {
    // Initialize auth
    auth.init();

    // Load pets if logged in
    if (auth.userId) {
      await petManager.loadPets();
    }

    console.log("Pet Tracker App initialized");
  }
}

// Start app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new PetTrackerApp();
});
