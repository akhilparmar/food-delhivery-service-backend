import Role from "../models/role.model.js";
import Permission from "../models/permission.model.js";

/**
 * Create a new permission
 */
export const createPermission = async (req, res) => {
  try {
    const { name, module, description } = req.body;

    const existing = await Permission.findOne({ name });
    if (existing) return res.status(400).json({ message: "Permission already exists" });

    const permission = await Permission.create({ name, module, description });
    res.status(201).json({ message: "Permission created successfully", permission });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get all permissions
 */
export const getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find();
    res.json(permissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Create a new role
 */
export const createRole = async (req, res) => {
  try {
    const { name, permissionIds } = req.body;

    const existing = await Role.findOne({ name });
    if (existing) return res.status(400).json({ message: "Role already exists" });

    const role = await Role.create({
      name,
      permissions: permissionIds || [],
    });

    res.status(201).json({ message: "Role created successfully", role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get all roles (with permissions)
 */
export const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find().populate("permissions");
    console.log("roles +++++++++++++++++++++", roles);
    res.json(roles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Assign permissions to a role
 */
export const assignPermissionsToRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissionIds } = req.body;

    const role = await Role.findById(roleId);
    if (!role) return res.status(404).json({ message: "Role not found" });

    role.permissions = permissionIds;
    await role.save();

    res.json({ message: "Permissions assigned successfully", role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Bootstrap initial roles and permissions (only works if no roles exist)
 * This is a one-time setup endpoint that doesn't require authentication
 */
export const bootstrapRoles = async (req, res) => {
  try {
    // Check if any roles already exist
    const existingRoles = await Role.countDocuments();
    if (existingRoles > 0) {
      return res.status(400).json({ 
        message: "Roles already exist. Use authenticated endpoints to manage roles." 
      });
    }

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

    // Check if permissions already exist
    let permissionDocs = [];
    const existingPermissions = await Permission.countDocuments();
    
    if (existingPermissions > 0) {
      // Use existing permissions
      permissionDocs = await Permission.find();
    } else {
      // Create all permissions
      permissionDocs = await Permission.insertMany(permissions);
    }

    // Get all permission IDs
    const allPermissionIds = permissionDocs.map((p) => p._id);

    // Create initial roles
    const adminRole = await Role.create({ 
      name: "admin", 
      permissions: allPermissionIds // Assign all permissions to admin
    });
    
    const customerRole = await Role.create({ 
      name: "customer", 
      permissions: [] // Keep customer role empty
    });

    // Get hub management permissions
    const hubPermissions = permissionDocs
      .filter((p) => p.module === "Hubs" || p.name === "manage_hub_operations" || p.name === "view_orders")
      .map((p) => p._id);

    const hubManagerRole = await Role.create({
      name: "hub_manager",
      permissions: hubPermissions, // Hub management permissions
    });

    res.status(201).json({ 
      message: "Initial roles and permissions created successfully",
      roles: [adminRole, customerRole, hubManagerRole],
      permissionsCreated: permissionDocs.length,
      adminPermissionsCount: allPermissionIds.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};