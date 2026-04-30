import mongoose from "mongoose";

const deliveryLogSchema = new mongoose.Schema({
  delivery_person_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  hub_id: { type: mongoose.Schema.Types.ObjectId, ref: "Hub" },
  action: { type: String, enum: ["picked_up", "delivered", "cancelled"] },
  timestamp: { type: Date, default: Date.now },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  },
  remarks: String,
}, { timestamps: true });

deliveryLogSchema.index({ location: "2dsphere" });
export default mongoose.model("DeliveryLog", deliveryLogSchema);
