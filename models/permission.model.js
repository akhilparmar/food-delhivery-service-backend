import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema({
  name: String,
  module: String,
  description: String,
}, { timestamps: true });

export default mongoose.model("Permission", permissionSchema);
