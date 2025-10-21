const mongoose = require("mongoose");

const wifiDeviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    deviceName: {
      type: String,
      default: "Pet Tracker WiFi",
    },
    petId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pet",
      required: true,
    },
    status: {
      type: String,
      enum: ["online", "offline", "error"],
      default: "offline",
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    signalStrength: {
      type: Number,
      min: 0,
      max: 100,
    },
    ipAddress: String,
    firmwareVersion: {
      type: String,
      default: "1.0.0",
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
wifiDeviceSchema.index({ deviceId: 1 });
wifiDeviceSchema.index({ petId: 1 });
wifiDeviceSchema.index({ status: 1 });
wifiDeviceSchema.index({ lastSeen: -1 });

// Static method to find by deviceId
wifiDeviceSchema.statics.findByDeviceId = function (deviceId) {
  return this.findOne({ deviceId }).populate("petId");
};

// Instance method to update status
wifiDeviceSchema.methods.updateStatus = function (status) {
  this.status = status;
  this.lastSeen = new Date();
  return this.save();
};

module.exports = mongoose.model("WifiDevice", wifiDeviceSchema);
