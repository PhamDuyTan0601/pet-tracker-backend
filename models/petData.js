const mongoose = require("mongoose");

const petDataSchema = new mongoose.Schema(
  {
    petId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pet",
      required: [true, "Pet ID is required"],
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
      },
    },
    latitude: {
      type: Number,
      required: [true, "Latitude is required"],
      min: [-90, "Latitude must be between -90 and 90"],
      max: [90, "Latitude must be between -90 and 90"],
    },
    longitude: {
      type: Number,
      required: [true, "Longitude is required"],
      min: [-180, "Longitude must be between -180 and 180"],
      max: [180, "Longitude must be between -180 and 180"],
    },
    speed: {
      type: Number,
      min: [0, "Speed cannot be negative"],
      max: [200, "Speed seems unrealistic"],
      default: 0,
    },
    batteryLevel: { type: Number, min: 0, max: 100, default: 100 },
    signalStrength: { type: Number, default: 0 },
    isMoving: { type: Boolean, default: false },
    activityType: {
      type: String,
      enum: ["resting", "walking", "running", "playing", "unknown"],
      default: "unknown",
    },
  },
  {
    timestamps: true,
  }
);

petDataSchema.index({ petId: 1, timestamp: -1 });
petDataSchema.index({ "location.coordinates": "2dsphere" });

petDataSchema.pre("save", function (next) {
  if (this.latitude && this.longitude) {
    this.location = {
      type: "Point",
      coordinates: [this.longitude, this.latitude],
    };
  }

  this.isMoving = this.speed > 0.5;

  if (this.speed < 0.1) this.activityType = "resting";
  else if (this.speed < 2) this.activityType = "walking";
  else if (this.speed < 5) this.activityType = "running";
  else this.activityType = "playing";

  next();
});

module.exports = mongoose.model("PetData", petDataSchema);
