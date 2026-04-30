import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  hub_id: { type: mongoose.Schema.Types.ObjectId, ref: "Hub" },
  delivery_person_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  meal_items: [
    {
      meal_id: { type: mongoose.Schema.Types.ObjectId, ref: "Meal" },
      quantity: Number,
    }
  ],
  total_amount: Number,
  delivery_address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
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
  },
  meal_type: { type: String, enum: ["breakfast", "lunch", "dinner"] },
  status: {
    type: String,
    enum: ["pending", "packed", "assigned", "on_the_way", "delivered", "cancelled"],
    default: "pending"
  },
  payment_status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
  estimated_delivery_time: Date,
  delivered_at: Date,
}, { timestamps: true });

orderSchema.index({ "delivery_address.location": "2dsphere" });

// Pre-save hook: If driver is assigned and status is "packed", automatically set to "assigned"
orderSchema.pre("save", function (next) {
  if (this.delivery_person_id && this.status === "packed") {
    this.status = "assigned";
  }
  // If driver is removed and status is "assigned", revert to "packed"
  if (!this.delivery_person_id && this.status === "assigned") {
    this.status = "packed";
  }
  next();
});

export default mongoose.model("Order", orderSchema);
