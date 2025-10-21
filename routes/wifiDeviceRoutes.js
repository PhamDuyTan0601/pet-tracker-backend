// CẬP NHẬT ENDPOINT NHẬN DỮ LIỆU
router.post(
  "/data",
  [
    body("deviceId").notEmpty().withMessage("Device ID is required"),
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

      const {
        deviceId,
        latitude,
        longitude,
        speed,
        batteryLevel,
        satellites,
        accuracy,
      } = req.body;

      console.log("📡 NHẬN DỮ LIỆU TỪ ESP32:", {
        deviceId,
        latitude,
        longitude,
        speed,
        batteryLevel,
        satellites,
        accuracy,
      });

      // Tìm device theo deviceId
      const wifiDevice = await WifiDevice.findOne({ deviceId }).populate(
        "petId"
      );
      if (!wifiDevice) {
        return res.status(404).json({
          success: false,
          message: "Thiết bị chưa được đăng ký",
        });
      }

      // Tạo bản ghi dữ liệu pet
      const petData = new PetData({
        petId: wifiDevice.petId._id,
        latitude,
        longitude,
        speed: speed || 0,
        batteryLevel: batteryLevel || 100,
        satellites: satellites || 0,
        accuracy: accuracy || 10.0,
        source: "wifi",
        timestamp: new Date(),
      });

      await petData.save();

      // Cập nhật last seen
      wifiDevice.lastSeen = new Date();
      wifiDevice.status = "online";
      await wifiDevice.save();

      // Cập nhật last seen cho pet
      await Pet.findByIdAndUpdate(wifiDevice.petId._id, {
        lastSeen: new Date(),
        "deviceInfo.lastSeen": new Date(),
      });

      console.log("✅ Đã lưu dữ liệu cho pet:", wifiDevice.petId.name);

      res.json({
        success: true,
        message: "Đã nhận dữ liệu thành công",
        dataId: petData._id,
      });
    } catch (error) {
      console.error("❌ Lỗi nhận dữ liệu ESP32:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi xử lý dữ liệu",
      });
    }
  }
);
