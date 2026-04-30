import mongoose from "mongoose";

const mealSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  available_hubs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Hub" }],
  image_url: String,
}, { timestamps: true });

export default mongoose.model("Meal", mealSchema);
