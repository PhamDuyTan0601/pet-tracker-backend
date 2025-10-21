const express = require("express");
const { body, validationResult } = require("express-validator");
const WifiDevice = require("../models/wifiDevice");
const Pet = require("../models/pet");
const PetData = require("../models/petData");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

// ==================== ENDPOINTS MỚI CHO THỰC TẾ ====================

// Kiểm tra thiết bị có tồn tại không
router.get("/check/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;

    // Kiểm tra trong database wifi devices
    const wifiDevice = await WifiDevice.findOne({ deviceId });

    // Kiểm tra trong pet data xem device có gửi dữ liệu không
    const recentData = await PetData.findOne({
      $or: [
        { deviceId: deviceId },
        {
          petId: {
            $in: await Pet.find({
              "bluetoothDevice.macAddress": deviceId,
            }).select("_id"),
          },
        },
      ],
    }).sort({ timestamp: -1 });

    const exists = !!(wifiDevice || recentData);

    res.json({
      success: true,
      exists: exists,
      device: wifiDevice || null,
      lastData: recentData
        ? {
            timestamp: recentData.timestamp,
            latitude: recentData.latitude,
            longitude: recentData.longitude,
          }
        : null,
    });
  } catch (error) {
    console.error("Check device error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi kiểm tra thiết bị",
    });
  }
});

// Lấy trạng thái thiết bị
router.get("/status/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;

    const wifiDevice = await WifiDevice.findOne({ deviceId });
    const recentData = await PetData.findOne({
      $or: [
        { deviceId: deviceId },
        {
          petId: {
            $in: await Pet.find({
              "bluetoothDevice.macAddress": deviceId,
            }).select("_id"),
          },
        },
      ],
    }).sort({ timestamp: -1 });

    const now = new Date();
    const isOnline =
      recentData && now - new Date(recentData.timestamp) < 5 * 60 * 1000; // 5 phút

    res.json({
      success: true,
      status: {
        online: isOnline,
        lastSeen: recentData?.timestamp || null,
        device: wifiDevice,
        recentData: recentData
          ? {
              latitude: recentData.latitude,
              longitude: recentData.longitude,
              speed: recentData.speed,
              battery: recentData.batteryLevel,
              satellites: recentData.satellites,
              accuracy: recentData.accuracy,
              timestamp: recentData.timestamp,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Device status error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy trạng thái thiết bị",
    });
  }
});

// Lấy danh sách thiết bị đã đăng ký của user
router.get("/my-devices", auth, async (req, res) => {
  try {
    // Lấy tất cả pets của user
    const userPets = await Pet.find({ owner: req.user._id });
    const petIds = userPets.map((pet) => pet._id);

    // Lấy wifi devices của các pets này
    const wifiDevices = await WifiDevice.find({
      petId: { $in: petIds },
    }).populate("petId", "name species breed lastSeen");

    // Lấy dữ liệu mới nhất cho mỗi device
    const devicesWithStatus = await Promise.all(
      wifiDevices.map(async (device) => {
        const recentData = await PetData.findOne({
          petId: device.petId._id,
        }).sort({ timestamp: -1 });

        const now = new Date();
        const isOnline =
          recentData && now - new Date(recentData.timestamp) < 5 * 60 * 1000;

        return {
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          pet: device.petId,
          status: isOnline ? "online" : "offline",
          lastSeen: recentData?.timestamp || device.lastSeen,
          lastData: recentData
            ? {
                latitude: recentData.latitude,
                longitude: recentData.longitude,
                speed: recentData.speed,
              }
            : null,
        };
      })
    );

    res.json({
      success: true,
      count: devicesWithStatus.length,
      devices: devicesWithStatus,
    });
  } catch (error) {
    console.error("Get my devices error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách thiết bị",
    });
  }
});

// ==================== ENDPOINTS CƠ BẢN ====================

// Ghép nối thiết bị WiFi với pet
router.post(
  "/pair",
  [
    body("deviceId").notEmpty().withMessage("Device ID là bắt buộc"),
    body("petId").isMongoId().withMessage("Pet ID không hợp lệ"),
  ],
  auth,
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
          message: "Không tìm thấy pet",
        });
      }

      if (pet.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền truy cập pet này",
        });
      }

      // Kiểm tra xem device đã được ghép nối với pet khác chưa
      const existingDevice = await WifiDevice.findOne({ deviceId });
      if (existingDevice && existingDevice.petId.toString() !== petId) {
        return res.status(400).json({
          success: false,
          message: "Thiết bị này đã được ghép nối với pet khác",
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

      console.log(`✅ Thiết bị ${deviceId} đã ghép nối với pet ${pet.name}`);

      res.json({
        success: true,
        message: "Ghép nối thiết bị WiFi thành công",
        device: {
          id: wifiDevice._id,
          deviceId: wifiDevice.deviceId,
          deviceName: wifiDevice.deviceName,
          petId: pet._id,
          petName: pet.name,
        },
      });
    } catch (error) {
      console.error("Lỗi ghép nối WiFi:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi ghép nối thiết bị",
      });
    }
  }
);

// Nhận dữ liệu từ thiết bị WiFi THỰC TẾ
router.post(
  "/data",
  [
    body("deviceId").notEmpty().withMessage("Device ID là bắt buộc"),
    body("latitude")
      .isFloat({ min: -90, max: 90 })
      .withMessage("Vĩ độ không hợp lệ"),
    body("longitude")
      .isFloat({ min: -180, max: 180 })
      .withMessage("Kinh độ không hợp lệ"),
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

      const {
        deviceId,
        latitude,
        longitude,
        speed,
        batteryLevel,
        satellites,
        accuracy,
        signalStrength,
      } = req.body;

      console.log("📡 NHẬN DỮ LIỆU THỰC TỪ ESP32:", {
        deviceId,
        latitude,
        longitude,
        speed,
        batteryLevel,
        satellites,
        accuracy,
        signalStrength,
        timestamp: new Date().toISOString(),
      });

      // Tìm device theo deviceId
      const wifiDevice = await WifiDevice.findOne({ deviceId }).populate(
        "petId"
      );
      if (!wifiDevice) {
        console.log(`❌ Thiết bị ${deviceId} chưa được đăng ký`);
        return res.status(404).json({
          success: false,
          message: "Thiết bị chưa được đăng ký. Hãy ghép nối thiết bị trước.",
        });
      }

      // Tạo bản ghi dữ liệu pet THỰC TẾ
      const petData = new PetData({
        petId: wifiDevice.petId._id,
        deviceId: deviceId,
        latitude,
        longitude,
        speed: speed || 0,
        batteryLevel: batteryLevel || 100,
        satellites: satellites || 0,
        accuracy: accuracy || 10.0,
        signalStrength: signalStrength || 0,
        source: "wifi",
        timestamp: new Date(),
      });

      await petData.save();

      // Cập nhật last seen
      wifiDevice.lastSeen = new Date();
      wifiDevice.status = "online";
      if (signalStrength) wifiDevice.signalStrength = signalStrength;
      await wifiDevice.save();

      // Cập nhật last seen cho pet
      await Pet.findByIdAndUpdate(wifiDevice.petId._id, {
        lastSeen: new Date(),
        "deviceInfo.lastSeen": new Date(),
        "deviceInfo.signalStrength": signalStrength || 0,
      });

      console.log(`✅ Đã lưu dữ liệu THỰC cho pet: ${wifiDevice.petId.name}`);

      res.json({
        success: true,
        message: "Đã nhận dữ liệu THỰC thành công",
        dataId: petData._id,
        petName: wifiDevice.petId.name,
      });
    } catch (error) {
      console.error("❌ Lỗi nhận dữ liệu ESP32 THỰC TẾ:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi xử lý dữ liệu thực tế",
      });
    }
  }
);

// Lấy thông tin device
router.get("/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;

    const wifiDevice = await WifiDevice.findOne({ deviceId }).populate("petId");
    if (!wifiDevice) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thiết bị",
      });
    }

    res.json({
      success: true,
      device: wifiDevice,
    });
  } catch (error) {
    console.error("Get device error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông tin thiết bị",
    });
  }
});

// Hủy ghép nối thiết bị
router.delete("/unpair/:deviceId", auth, async (req, res) => {
  try {
    const { deviceId } = req.params;

    const wifiDevice = await WifiDevice.findOne({ deviceId }).populate("petId");
    if (!wifiDevice) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thiết bị",
      });
    }

    if (wifiDevice.petId.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền hủy ghép nối thiết bị này",
      });
    }

    // Cập nhật pet
    await Pet.findByIdAndUpdate(wifiDevice.petId._id, {
      $unset: {
        bluetoothDevice: 1,
        deviceInfo: 1,
      },
    });

    // Xóa wifi device
    await WifiDevice.findByIdAndDelete(wifiDevice._id);

    console.log(`✅ Đã hủy ghép nối thiết bị ${deviceId}`);

    res.json({
      success: true,
      message: "Hủy ghép nối thiết bị thành công",
    });
  } catch (error) {
    console.error("Unpair device error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi hủy ghép nối",
    });
  }
});

module.exports = router;
