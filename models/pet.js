const mongoose = require("mongoose");

const petSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Pet name is required"],
      trim: true,
      maxlength: [50, "Name cannot be more than 50 characters"],
    },
    species: {
      type: String,
      required: [true, "Species is required"],
      enum: {
        values: ["dog", "cat", "bird", "rabbit", "other"],
        message: "Species must be dog, cat, bird, rabbit, or other",
      },
    },
    breed: {
      type: String,
      required: [true, "Breed is required"],
      trim: true,
      maxlength: [50, "Breed cannot be more than 50 characters"],
    },
    age: {
      type: Number,
      required: [true, "Age is required"],
      min: [0, "Age must be a positive number"],
      max: [50, "Age seems unrealistic"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner ID is required"],
    },
    bluetoothDevice: {
      macAddress: {
        type: String,
        sparse: true,
        uppercase: true,
      },
      deviceName: String,
      isPaired: {
        type: Boolean,
        default: false,
      },
      pairedAt: Date,
    },
    deviceInfo: {
      firmwareVersion: String,
      hardwareModel: String,
      lastSeen: Date,
      signalStrength: Number,
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot be more than 500 characters"],
      default: "",
    },
    color: {
      type: String,
      trim: true,
      default: "",
    },
    weight: {
      type: Number,
      min: [0.1, "Weight must be greater than 0"],
      max: [100, "Weight seems unrealistic"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    safeZones: [
      {
        name: String,
        center: {
          lat: Number,
          lng: Number,
        },
        radius: Number,
        isActive: Boolean,
      },
    ],
  },
  {
    timestamps: true,
  }
);

petSchema.index({ owner: 1 });
petSchema.index({ species: 1 });
petSchema.index({ isActive: 1 });
petSchema.index({ "bluetoothDevice.macAddress": 1 });

petSchema.methods.updateLastSeen = function () {
  this.lastSeen = new Date();
  return this.save();
};

petSchema.methods.pairBluetoothDevice = function (
  macAddress,
  deviceName,
  deviceInfo = {}
) {
  this.bluetoothDevice = {
    macAddress: macAddress.toUpperCase(),
    deviceName: deviceName || `PET_${this.name.toUpperCase()}`,
    isPaired: true,
    pairedAt: new Date(),
  };

  this.deviceInfo = {
    ...this.deviceInfo,
    ...deviceInfo,
    lastSeen: new Date(),
  };

  return this.save();
};

petSchema.methods.unpairBluetoothDevice = function () {
  this.bluetoothDevice = {
    macAddress: null,
    deviceName: null,
    isPaired: false,
    pairedAt: null,
  };
  return this.save();
};

petSchema.statics.findByOwner = function (ownerId) {
  return this.find({ owner: ownerId, isActive: true }).sort({ createdAt: -1 });
};

petSchema.statics.findByMacAddress = function (macAddress) {
  return this.findOne({
    "bluetoothDevice.macAddress": macAddress.toUpperCase(),
    isActive: true,
  });
};

module.exports = mongoose.model("Pet", petSchema);
