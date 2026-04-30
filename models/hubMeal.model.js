import mongoose from "mongoose";

// Hub-specific meal with quantity and meal type
const hubMealSchema = new mongoose.Schema({
  hub_id: { type: mongoose.Schema.Types.ObjectId, ref: "Hub", required: true },
  meal_id: { type: mongoose.Schema.Types.ObjectId, ref: "Meal", required: true },
  meal_type: { type: String, enum: ["breakfast", "lunch", "dinner"], required: true },
  quantity: { type: Number, default: 0, min: 0 },
  is_available: { type: Boolean, default: true },
}, { timestamps: true });

// Ensure one meal per hub per meal type
hubMealSchema.index({ hub_id: 1, meal_id: 1, meal_type: 1 }, { unique: true });

export default mongoose.model("HubMeal", hubMealSchema);

