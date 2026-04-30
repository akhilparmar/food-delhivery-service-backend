import mongoose from "mongoose";

const hubSchema = new mongoose.Schema({
  name: String,
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
  manager_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  contact_number: String,
}, { timestamps: true });

hubSchema.index({ "address.location": "2dsphere" });
export default mongoose.model("Hub", hubSchema);
