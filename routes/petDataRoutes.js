const express = require("express");
const { body, validationResult } = require("express-validator");
const PetData = require("../models/petData");
const Pet = require("../models/pet");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/",
  [
    body("petId").notEmpty().withMessage("Pet ID is required"),
    body("latitude")
      .isFloat({ min: -90, max: 90 })
      .withMessage("Valid latitude is required"),
    body("longitude")
      .isFloat({ min: -180, max: 180 })
      .withMessage("Valid longitude is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const petData = new PetData(req.body);
      await petData.save();

      res.status(201).json({
        success: true,
        message: "Pet data saved successfully",
        data: petData,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

router.post(
  "/by-bluetooth",
  [
    body("macAddress").notEmpty().withMessage("MAC address is required"),
    body("latitude").isFloat({ min: -90, max: 90 }),
    body("longitude").isFloat({ min: -180, max: 180 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { macAddress, latitude, longitude, speed, batteryLevel } = req.body;

      const pet = await Pet.findByMacAddress(macAddress);
      if (!pet) {
        return res.status(404).json({
          success: false,
          message: "No pet found with this Bluetooth device",
        });
      }

      if (!pet.bluetoothDevice.isPaired) {
        return res.status(400).json({
          success: false,
          message: "Bluetooth device is not paired",
        });
      }

      const petData = new PetData({
        petId: pet._id,
        latitude,
        longitude,
        speed: speed || 0,
        batteryLevel: batteryLevel || 100,
        timestamp: new Date(),
      });

      await petData.save();

      pet.lastSeen = new Date();
      pet.deviceInfo.lastSeen = new Date();
      await pet.save();

      res.status(201).json({
        success: true,
        message: "Pet data saved successfully",
        data: {
          petName: pet.name,
          timestamp: petData.timestamp,
        },
      });
    } catch (error) {
      console.error("Bluetooth data error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

router.get("/pet/:petId", auth, async (req, res) => {
  try {
    const { petId } = req.params;
    const { start, end, limit = 1000 } = req.query;

    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    if (pet.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view data of your own pets",
      });
    }

    let query = { petId };
    if (start || end) {
      query.timestamp = {};
      if (start) query.timestamp.$gte = new Date(start);
      if (end) query.timestamp.$lte = new Date(end);
    }

    const petData = await PetData.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: petData.length,
      data: petData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.get("/pet/:petId/latest", auth, async (req, res) => {
  try {
    const { petId } = req.params;

    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    if (pet.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const latestData = await PetData.findOne({ petId }).sort({ timestamp: -1 });
    res.json({
      success: true,
      data: latestData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;
