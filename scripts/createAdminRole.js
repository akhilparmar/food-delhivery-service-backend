import mongoose from "mongoose";
import dotenv from "dotenv";
import Role from "../models/role.model.js";

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Check if admin role exists
    const existingAdmin = await Role.findOne({ name: "admin" });
    if (existingAdmin) {
      console.log("⚠️  Admin role already exists");
    } else {
      const adminRole = await Role.create({ name: "admin", permissions: [] });
      console.log("✅ Admin role created:", adminRole);
    }

    // Optionally create customer role too
    const existingCustomer = await Role.findOne({ name: "customer" });
    if (!existingCustomer) {
      const customerRole = await Role.create({ name: "customer", permissions: [] });
      console.log("✅ Customer role created:", customerRole);
    }

    await mongoose.connection.close();
    console.log("✅ Done!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
})();

