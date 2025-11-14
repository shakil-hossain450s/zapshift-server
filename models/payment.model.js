const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    parcelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parcel",
      required: true,
    },
    email: { type: 'String', required: true },
    amount: { type: Number, required: true },
    transactionId: { type: String, required: true },
    paymentMethod: { type: String, default: "Card" },
    status: { type: String, default: "Paid" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
