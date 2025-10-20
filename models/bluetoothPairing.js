const mongoose = require("mongoose");

const bluetoothPairingSchema = new mongoose.Schema(
  {
    petId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pet",
      required: true,
    },
    pairingCode: {
      type: String,
      required: true,
      unique: true,
    },
    macAddress: {
      type: String,
      required: true,
      uppercase: true,
    },
    deviceName: {
      type: String,
      default: "ESP32_Pet_Tracker",
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
  }
);

bluetoothPairingSchema.index({ pairingCode: 1 });
bluetoothPairingSchema.index({ macAddress: 1 });
bluetoothPairingSchema.index({ petId: 1 });

bluetoothPairingSchema.statics.createPairing = async function (
  petId,
  macAddress,
  deviceName = null
) {
  const pairingCode = Math.random().toString(36).substr(2, 6).toUpperCase();

  const pairing = new this({
    petId,
    pairingCode,
    macAddress: macAddress.toUpperCase(),
    deviceName: deviceName || `PET_DEVICE_${pairingCode}`,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });

  await pairing.save();
  return pairing;
};

bluetoothPairingSchema.statics.findValidPairing = function (
  pairingCode,
  macAddress
) {
  return this.findOne({
    pairingCode: pairingCode.toUpperCase(),
    macAddress: macAddress.toUpperCase(),
    expiresAt: { $gt: new Date() },
    isCompleted: false,
  }).populate("petId");
};

module.exports = mongoose.model("BluetoothPairing", bluetoothPairingSchema);
