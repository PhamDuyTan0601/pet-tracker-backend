const express = require("express");
const { body, validationResult } = require("express-validator");
const WifiDevice = require("../models/wifiDevice");
const Pet = require("../models/pet");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

// Ghép nối thiết bị WiFi với pet
router.post(
  "/pair",
  [
    body("deviceId").notEmpty().withMessage("Device ID is required"),
    body("petId").isMongoId().withMessage("Valid pet ID is required"),
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

      const { deviceId, petId } = req.body;

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

      // Tạo hoặc cập nhật thiết bị WiFi
      let wifiDevice = await WifiDevice.findOne({ deviceId });
      if (!wifiDevice) {
        wifiDevice = new WifiDevice({
          deviceId,
          deviceName: `PetTracker_${deviceId}`,
          petId: petId,
          status: "online",
          lastSeen: new Date(),
        });
      } else {
        wifiDevice.petId = petId;
        wifiDevice.status = "online";
        wifiDevice.lastSeen = new Date();
      }

      await wifiDevice.save();

      // Cập nhật thông tin device trong pet
      pet.bluetoothDevice = {
        macAddress: deviceId,
        deviceName: `WiFi_${deviceId}`,
        isPaired: true,
        pairedAt: new Date(),
        connectionType: "wifi",
      };

      await pet.save();

      res.json({
        success: true,
        message: "WiFi device paired successfully",
        device: {
          id: wifiDevice._id,
          deviceId: wifiDevice.deviceId,
          deviceName: wifiDevice.deviceName,
          petId: pet._id,
          petName: pet.name,
        },
      });
    } catch (error) {
      console.error("WiFi pairing error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during WiFi pairing",
      });
    }
  }
);

// Lấy danh sách thiết bị WiFi của user
router.get("/my-devices", auth, async (req, res) => {
  try {
    const wifiDevices = await WifiDevice.find({})
      .populate("petId", "name species breed")
      .exec();

    // Lọc chỉ thiết bị của pets thuộc user này
    const userDevices = wifiDevices.filter(
      (device) =>
        device.petId &&
        device.petId.owner &&
        device.petId.owner.toString() === req.user._id.toString()
    );

    res.json({
      success: true,
      count: userDevices.length,
      devices: userDevices,
    });
  } catch (error) {
    console.error("Get WiFi devices error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Nhận dữ liệu từ thiết bị WiFi (cho ESP32 gửi data)
router.post(
  "/data",
  [
    body("deviceId").notEmpty().withMessage("Device ID is required"),
    body("latitude")
      .isFloat({ min: -90, max: 90 })
      .withMessage("Valid latitude required"),
    body("longitude")
      .isFloat({ min: -180, max: 180 })
      .withMessage("Valid longitude required"),
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

      const { deviceId, latitude, longitude, speed, batteryLevel } = req.body;

      const wifiDevice = await WifiDevice.findOne({ deviceId }).populate(
        "petId"
      );
      if (!wifiDevice) {
        return res.status(404).json({
          success: false,
          message: "Device not found",
        });
      }

      // Tạo pet data mới
      const PetData = require("../models/petData");
      const petData = new PetData({
        petId: wifiDevice.petId._id,
        latitude,
        longitude,
        speed: speed || 0,
        batteryLevel: batteryLevel || 100,
        source: "wifi",
      });

      await petData.save();

      // Cập nhật last seen
      wifiDevice.lastSeen = new Date();
      wifiDevice.status = "online";
      await wifiDevice.save();

      // Cập nhật last seen cho pet
      await Pet.findByIdAndUpdate(wifiDevice.petId._id, {
        lastSeen: new Date(),
      });

      res.json({
        success: true,
        message: "Data received successfully",
        dataId: petData._id,
      });
    } catch (error) {
      console.error("WiFi data receive error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

module.exports = router;
