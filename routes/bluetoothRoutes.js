const express = require("express");
const { body, validationResult } = require("express-validator");
const Pet = require("../models/pet");
const BluetoothPairing = require("../models/bluetoothPairing");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/start-pairing",
  auth,
  [
    body("petId").isMongoId().withMessage("Valid pet ID is required"),
    body("macAddress").notEmpty().withMessage("MAC address is required"),
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

      const { petId, macAddress, deviceName } = req.body;

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

      const existingPet = await Pet.findByMacAddress(macAddress);
      if (existingPet && existingPet._id.toString() !== petId) {
        return res.status(400).json({
          success: false,
          message: "This device is already paired with another pet",
        });
      }

      const pairing = await BluetoothPairing.createPairing(
        petId,
        macAddress,
        deviceName
      );

      res.json({
        success: true,
        pairingInfo: {
          pairingCode: pairing.pairingCode,
          petId: pet._id,
          petName: pet.name,
          macAddress: pairing.macAddress,
          expiresAt: pairing.expiresAt,
        },
      });
    } catch (error) {
      console.error("Bluetooth pairing error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during Bluetooth pairing",
      });
    }
  }
);

router.post(
  "/confirm-pairing",
  [
    body("pairingCode").notEmpty().withMessage("Pairing code is required"),
    body("macAddress").notEmpty().withMessage("MAC address is required"),
    body("deviceInfo").optional().isObject(),
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

      const { pairingCode, macAddress, deviceInfo = {} } = req.body;

      const pairing = await BluetoothPairing.findValidPairing(
        pairingCode,
        macAddress
      );
      if (!pairing) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired pairing code",
        });
      }

      await pairing.petId.pairBluetoothDevice(
        macAddress,
        pairing.deviceName,
        deviceInfo
      );

      pairing.isCompleted = true;
      await pairing.save();

      res.json({
        success: true,
        message: "Bluetooth pairing completed successfully",
        pet: {
          id: pairing.petId._id,
          name: pairing.petId.name,
          macAddress: pairing.macAddress,
        },
      });
    } catch (error) {
      console.error("Confirm pairing error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during pairing confirmation",
      });
    }
  }
);

router.get("/pairable-pets", auth, async (req, res) => {
  try {
    const pets = await Pet.findByOwner(req.user._id);

    const pairablePets = pets.map((pet) => ({
      id: pet._id,
      name: pet.name,
      species: pet.species,
      isPaired: pet.bluetoothDevice.isPaired,
      macAddress: pet.bluetoothDevice.macAddress,
      pairedAt: pet.bluetoothDevice.pairedAt,
    }));

    res.json({
      success: true,
      pets: pairablePets,
    });
  } catch (error) {
    console.error("Get pairable pets error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.post(
  "/unpair",
  auth,
  [body("petId").isMongoId().withMessage("Valid pet ID is required")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { petId } = req.body;

      const pet = await Pet.findById(petId);
      if (!pet || pet.owner.toString() !== req.user._id.toString()) {
        return res.status(404).json({
          success: false,
          message: "Pet not found or access denied",
        });
      }

      await pet.unpairBluetoothDevice();

      res.json({
        success: true,
        message: "Device unpaired successfully",
      });
    } catch (error) {
      console.error("Unpair error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during unpairing",
      });
    }
  }
);

module.exports = router;
