const mongoose = require("mongoose");

const ParcelSchema = new mongoose.Schema({
  trackingId: { type: String, required: true, unique: true },
  parcelName: { type: String, required: true },
  parcelType: { type: String, required: true },
  weight: { type: Number, default: 0 },
  deliveryZone: { type: String, required: true },
  baseCost: { type: Number, default: 0 },
  extraCharges: { type: Number, default: 0 },
  deliveryCost: { type: Number, required: true },
  parcelStatus: { type: String, default: "Processing" },
  paymentStatus: { type: String, default: "Pending" },
  paymentMethod: { type: String, required: true },
  deliveryStatus: { type: String, default: "Not Dispatched" },
  createdBy: { type: String, required: true }, // user email
  createdAt: { type: Date, default: Date.now },
  createdAtReadable: { type: String },
  updatedAt: { type: Date, default: Date.now },
  expectedDeliveryDate: { type: Date },
  pickupInstruction: { type: String, default: "" },
  deliveryInstruction: { type: String, default: "" },
  sender: {
    name: { type: String, required: true },
    contact: { type: String, required: true },
    region: { type: String },
    district: { type: String },
    warehouse: { type: String },
    address: { type: String },
  },
  receiver: {
    name: { type: String, required: true },
    contact: { type: String, required: true },
    region: { type: String },
    district: { type: String },
    warehouse: { type: String },
    address: { type: String },
  },
  assignedRider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Riders", // assuming your Rider model is named 'Riders'
    default: null
  },
  history: [
    {
      status: { type: String },
      time: { type: Date },
      by: { type: String }, // user email
    },
  ],
});

module.exports = mongoose.model("Parcels", ParcelSchema);
