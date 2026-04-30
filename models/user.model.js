import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  password: String,
  role_id: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
  assigned_hub: { type: mongoose.Schema.Types.ObjectId, ref: "Hub" },
  address: {
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
  status: { type: String, enum: ["active", "inactive"], default: "active" },
}, { timestamps: true });

userSchema.index({ "address.location": "2dsphere" });
export default mongoose.model("User", userSchema);
