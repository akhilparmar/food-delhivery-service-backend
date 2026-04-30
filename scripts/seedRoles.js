import mongoose from "mongoose";
import dotenv from "dotenv";
import Role from "../models/role.model.js";
import Permission from "../models/permission.model.js";

dotenv.config();

// Define all permissions for all modules
const permissions = [
  // Orders Module
  { name: "view_orders", module: "Orders", description: "View all orders" },
  { name: "create_order", module: "Orders", description: "Create new orders" },
  { name: "update_order", module: "Orders", description: "Update existing orders" },
  { name: "delete_order", module: "Orders", description: "Delete orders" },
  { name: "manage_order_status", module: "Orders", description: "Change order status" },
  { name: "cancel_order", module: "Orders", description: "Cancel orders" },
  { name: "refund_order", module: "Orders", description: "Process order refunds" },
  
  // Hubs Module
  { name: "view_hubs", module: "Hubs", description: "View all hubs" },
  { name: "create_hub", module: "Hubs", description: "Create new hubs" },
  { name: "update_hub", module: "Hubs", description: "Update hub information" },
  { name: "delete_hub", module: "Hubs", description: "Delete hubs" },
  { name: "manage_hub_operations", module: "Hubs", description: "Manage hub operations" },
  
  // Users Module
  { name: "view_users", module: "Users", description: "View all users" },
  { name: "create_user", module: "Users", description: "Create new users" },
  { name: "update_user", module: "Users", description: "Update user information" },
  { name: "delete_user", module: "Users", description: "Delete users" },
  { name: "manage_user_roles", module: "Users", description: "Assign roles to users" },
  { name: "activate_deactivate_user", module: "Users", description: "Activate or deactivate users" },
  
  // Drivers Module
  { name: "view_drivers", module: "Drivers", description: "View all drivers" },
  { name: "create_driver", module: "Drivers", description: "Create new driver accounts" },
  { name: "update_driver", module: "Drivers", description: "Update driver information" },
  { name: "delete_driver", module: "Drivers", description: "Delete driver accounts" },
  { name: "assign_driver", module: "Drivers", description: "Assign drivers to orders" },
  { name: "track_driver", module: "Drivers", description: "Track driver locations" },
  
  // Customers Module
  { name: "view_customers", module: "Customers", description: "View all customers" },
  { name: "create_customer", module: "Customers", description: "Create new customer accounts" },
  { name: "update_customer", module: "Customers", description: "Update customer information" },
  { name: "delete_customer", module: "Customers", description: "Delete customer accounts" },
  { name: "manage_customer_subscriptions", module: "Customers", description: "Manage customer subscriptions" },
  
  // Roles & Permissions Module
  { name: "view_roles", module: "Roles & Permissions", description: "View all roles" },
  { name: "create_role", module: "Roles & Permissions", description: "Create new roles" },
  { name: "update_role", module: "Roles & Permissions", description: "Update role information" },
  { name: "delete_role", module: "Roles & Permissions", description: "Delete roles" },
  { name: "assign_permissions", module: "Roles & Permissions", description: "Assign permissions to roles" },
  { name: "view_permissions", module: "Roles & Permissions", description: "View all permissions" },
  { name: "create_permission", module: "Roles & Permissions", description: "Create new permissions" },
  { name: "update_permission", module: "Roles & Permissions", description: "Update permission information" },
  { name: "delete_permission", module: "Roles & Permissions", description: "Delete permissions" },
  
  // Insights Module
  { name: "view_analytics", module: "Insights", description: "View analytics and reports" },
  { name: "view_reports", module: "Insights", description: "View detailed reports" },
  { name: "export_data", module: "Insights", description: "Export data and reports" },
  { name: "view_dashboard", module: "Insights", description: "Access dashboard overview" },
  
  // Settings Module
  { name: "view_settings", module: "Settings", description: "View system settings" },
  { name: "update_settings", module: "Settings", description: "Update system settings" },
  { name: "manage_system_config", module: "Settings", description: "Manage system configuration" },
  
  // Meals Module
  { name: "view_meals", module: "Meals", description: "View all meals" },
  { name: "create_meal", module: "Meals", description: "Create new meals" },
  { name: "update_meal", module: "Meals", description: "Update meal information" },
  { name: "delete_meal", module: "Meals", description: "Delete meals" },
  { name: "manage_meal_menu", module: "Meals", description: "Manage meal menu" },
];

const seedRoles = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Check if roles already exist
    const existingRoles = await Role.countDocuments();
    if (existingRoles > 0) {
      console.log("⚠️  Roles already exist. Skipping seed.");
      await mongoose.connection.close();
      return;
    }

    // Check if permissions already exist
    const existingPermissions = await Permission.countDocuments();
    let permissionDocs = [];

    if (existingPermissions > 0) {
      console.log("⚠️  Permissions already exist. Using existing permissions.");
      permissionDocs = await Permission.find();
    } else {
      // Create all permissions
      console.log("📝 Creating permissions...");
      permissionDocs = await Permission.insertMany(permissions);
      console.log(`✅ Created ${permissionDocs.length} permissions`);
    }

    // Get all permission IDs
    const allPermissionIds = permissionDocs.map((p) => p._id);

    // Get hub management permissions
    const hubPermissions = permissionDocs
      .filter((p) => p.module === "Hubs" || p.name === "manage_hub_operations" || p.name === "view_orders")
      .map((p) => p._id);

    // Create initial roles
    const adminRole = await Role.create({ 
      name: "admin", 
      permissions: allPermissionIds // Assign all permissions to admin
    });
    
    const customerRole = await Role.create({ 
      name: "customer", 
      permissions: [] // Keep customer role empty
    });

    const hubManagerRole = await Role.create({
      name: "hub_manager",
      permissions: hubPermissions, // Hub management permissions
    });

    console.log("✅ Initial roles created successfully:");
    console.log(`   - admin (${allPermissionIds.length} permissions assigned)`);
    console.log("   - customer (no permissions)");
    console.log(`   - hub_manager (${hubPermissions.length} permissions assigned)`);

    await mongoose.connection.close();
    console.log("✅ Database connection closed");
  } catch (error) {
    console.error("❌ Error seeding roles:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedRoles();

