const mongoose = require('mongoose');

const RiderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    age: {
      type: Number,
      required: true,
      min: 18,
      max: 65,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    region: {
      type: String,
      required: true,
    },

    district: {
      type: String,
      required: true,
    },

    nid: {
      type: String,
      required: true,
      unique: true,
    },

    bikeBrand: {
      type: String,
      required: true,
    },

    bikeRegNo: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "deactivate"],
      default: "pending",
    },

    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Rider", RiderSchema);


