const express = require("express");
const router = express.Router();
const Pet = require("../models/pet");

// Get device info from QR code
router.get("/device/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;

    res.json({
      success: true,
      device: {
        id: deviceId,
        name: `PetTracker_${deviceId}`,
        type: "pet_tracker",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Pair device with pet via QR code
router.post("/pair", async (req, res) => {
  try {
    const { deviceId, petId, userId } = req.body;

    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    if (pet.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    pet.bluetoothDevice = {
      macAddress: deviceId,
      deviceName: `PetTracker_${deviceId}`,
      isPaired: true,
      pairedAt: new Date(),
    };

    await pet.save();

    res.json({
      success: true,
      message: "Device paired successfully via QR code",
      pet: {
        id: pet._id,
        name: pet.name,
        deviceId: deviceId,
      },
    });
  } catch (error) {
    console.error("QR pairing error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during QR pairing",
    });
  }
});

module.exports = router;
