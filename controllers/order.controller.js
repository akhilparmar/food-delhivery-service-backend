import Order from "../models/order.model.js";
import Hub from "../models/hub.model.js";
import Meal from "../models/meal.model.js";
import HubMeal from "../models/hubMeal.model.js";
import User from "../models/user.model.js";
import Role from "../models/role.model.js";

/**
 * Create a new order
 */
export const createOrder = async (req, res) => {
  try {
    const { meal_items, delivery_address, hub_id } = req.body;
    const userId = req.user.id || req.user._id; // From auth middleware

    if (!meal_items || meal_items.length === 0) {
      return res.status(400).json({ message: "At least one meal item is required" });
    }

    if (!delivery_address) {
      return res.status(400).json({ message: "Delivery address is required" });
    }

    let selectedHubId = hub_id;

    // If hub_id not provided, find nearest hub based on delivery address
    if (!selectedHubId && delivery_address.location && delivery_address.location.coordinates) {
      const [lng, lat] = delivery_address.location.coordinates;
      const nearestHub = await Hub.findOne({
        "address.location": {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
            $maxDistance: 50000, // 50km
          },
        },
      });

      if (nearestHub) {
        selectedHubId = nearestHub._id;
      } else {
        return res.status(400).json({ message: "No hub found near the delivery address" });
      }
    }

    if (!selectedHubId) {
      return res.status(400).json({ message: "Hub is required" });
    }

    const { meal_type } = req.body; // breakfast, lunch, or dinner
    
    if (!meal_type || !["breakfast", "lunch", "dinner"].includes(meal_type)) {
      return res.status(400).json({ message: "Valid meal_type (breakfast/lunch/dinner) is required" });
    }

    // Validate meals exist, check availability, and calculate total
    let totalAmount = 0;
    const hubMealsToUpdate = [];
    
    for (const item of meal_items) {
      const meal = await Meal.findById(item.meal_id);
      if (!meal) {
        return res.status(400).json({ message: `Meal with ID ${item.meal_id} not found` });
      }
      
      // Check if meal is available in hub with sufficient quantity
      const hubMeal = await HubMeal.findOne({
        hub_id: selectedHubId,
        meal_id: item.meal_id,
        meal_type,
      });
      
      if (!hubMeal || !hubMeal.is_available) {
        return res.status(400).json({ message: `Meal "${meal.name}" is not available at this hub` });
      }
      
      const requestedQuantity = item.quantity || 1;
      if (hubMeal.quantity < requestedQuantity) {
        return res.status(400).json({ 
          message: `Insufficient quantity for "${meal.name}". Available: ${hubMeal.quantity}, Requested: ${requestedQuantity}` 
        });
      }
      
      totalAmount += meal.price * requestedQuantity;
      hubMealsToUpdate.push({ hubMeal, requestedQuantity });
    }

    // Create order
    const order = new Order({
      user_id: userId,
      hub_id: selectedHubId,
      meal_items,
      meal_type, // Store meal type in order
      delivery_address: {
        ...delivery_address,
        location: delivery_address.location || {
          type: "Point",
          coordinates: [0, 0],
        },
      },
      total_amount: totalAmount,
      status: "pending",
      payment_status: "pending",
    });

    await order.save();
    
    // Decrease quantities from hub meals
    for (const { hubMeal, requestedQuantity } of hubMealsToUpdate) {
      hubMeal.quantity -= requestedQuantity;
      hubMeal.is_available = hubMeal.quantity > 0;
      await hubMeal.save();
    }
    await order.populate("hub_id", "name address");
    await order.populate("user_id", "name email");
    await order.populate("meal_items.meal_id", "name price");

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get user's orders
 */
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const orders = await Order.find({ user_id: userId })
      .populate("hub_id", "name address")
      .populate("meal_items.meal_id", "name price")
      .populate("delivery_person_id", "name email phone")
      .sort({ createdAt: -1 });

    // Ensure status consistency: if driver is assigned, status should be "assigned" or later
    for (const order of orders) {
      if (order.delivery_person_id && order.status === "packed") {
        order.status = "assigned";
        await order.save();
      }
    }

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get all orders (admin)
 */
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user_id", "name email")
      .populate("hub_id", "name address")
      .populate("delivery_person_id", "name email phone")
      .populate("meal_items.meal_id", "name price")
      .sort({ createdAt: -1 });

    // Ensure status consistency: if driver is assigned, status should be "assigned" or later
    for (const order of orders) {
      if (order.delivery_person_id && order.status === "packed") {
        order.status = "assigned";
        await order.save();
      }
    }

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get hub orders (for hub managers)
 */
export const getHubOrders = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);
    
    // Find hub managed by this user
    let hub = await Hub.findOne({ manager_id: userId });
    
    // If admin, get all orders
    if (!hub && req.user.role === 'admin') {
      const orders = await Order.find()
        .populate("user_id", "name email phone")
        .populate("hub_id", "name address")
        .populate("delivery_person_id", "name email phone")
        .populate("meal_items.meal_id", "name price")
        .sort({ createdAt: -1 });
      
      // Ensure status consistency: if driver is assigned, status should be "assigned" or later
      for (const order of orders) {
        if (order.delivery_person_id && order.status === "packed") {
          order.status = "assigned";
          await order.save();
        }
      }
      
      return res.json(orders);
    }
    
    if (!hub) {
      return res.status(404).json({ message: "You are not assigned as a hub manager" });
    }

    const orders = await Order.find({ hub_id: hub._id })
      .populate("user_id", "name email phone")
      .populate("hub_id", "name address")
      .populate("delivery_person_id", "name email phone")
      .populate("meal_items.meal_id", "name price")
      .sort({ createdAt: -1 });

    // Ensure status consistency: if driver is assigned, status should be "assigned" or later
    for (const order of orders) {
      if (order.delivery_person_id && order.status === "packed") {
        order.status = "assigned";
        await order.save();
      }
    }

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const userId = req.user.id || req.user._id;
    
    // Get user with populated role and permissions
    const user = await User.findById(userId).populate({
      path: "role_id",
      populate: {
        path: "permissions",
        select: "name",
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!status || !["pending", "packed", "assigned", "on_the_way", "delivered", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Get role name from populated role_id or from JWT token
    const userRole = user.role_id?.name || req.user.role;
    
    // Check if user has manage_order_status permission
    const permissions = user.role_id?.permissions?.map((p) => p.name) || [];
    const hasPermission = permissions.includes("manage_order_status") || userRole === "admin";

    if (!hasPermission) {
      return res.status(403).json({ message: "You don't have permission to update order status" });
    }

    // Check permissions based on role
    if (userRole === "hub_manager") {
      // Hub manager can only: pending → packed
      // They cannot change to on_the_way - driver must be assigned first
      const allowedTransitions = {
        pending: ["packed"],
        packed: [], // Hub manager cannot change from packed - must assign driver first
        on_the_way: [],
        delivered: [],
        cancelled: [],
      };
      
      if (!allowedTransitions[order.status]?.includes(status)) {
        return res.status(403).json({ 
          message: `Hub manager cannot change status from ${order.status} to ${status}. Please assign a driver first.` 
        });
      }
    } else if (userRole === "driver") {
      // Driver can: on_the_way → delivered
      // Driver can also mark as on_the_way if they are assigned to the order
      if (status === "on_the_way") {
        // Check if driver is assigned to this order
        if (order.delivery_person_id?.toString() !== userId.toString()) {
          return res.status(403).json({ 
            message: "You are not assigned to this order. Only the assigned driver can mark it as on the way." 
          });
        }
        // Driver can mark as on_the_way if order is packed and they are assigned
        if (order.status !== "packed") {
          return res.status(403).json({ 
            message: "Order must be packed before it can be marked as on the way" 
          });
        }
      } else if (status === "delivered") {
        // Driver can mark as delivered if order is on_the_way
        if (order.status !== "on_the_way") {
          return res.status(403).json({ 
            message: "Order must be on the way before it can be marked as delivered" 
          });
        }
        // Check if driver is assigned to this order
        if (order.delivery_person_id?.toString() !== userId.toString()) {
          return res.status(403).json({ 
            message: "You are not assigned to this order" 
          });
        }
        order.delivered_at = new Date();
      } else {
        return res.status(403).json({ 
          message: "Driver can only change status to 'on_the_way' or 'delivered'" 
        });
      }
    } else if (userRole !== "admin") {
      return res.status(403).json({ message: "You don't have permission to update order status" });
    }

    order.status = status;
    await order.save();

    await order.populate("user_id", "name email phone");
    await order.populate("hub_id", "name address");
    await order.populate("delivery_person_id", "name");
    await order.populate("meal_items.meal_id", "name price");

    res.json({ message: "Order status updated successfully", order });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get all drivers for order assignment
 */
export const getDrivers = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    // Get user with populated role
    const user = await User.findById(userId).populate("role_id");
    const userRole = user?.role_id?.name || req.user.role;
    
    // Only hub managers and admins can get drivers
    if (userRole !== "hub_manager" && userRole !== "admin") {
      return res.status(403).json({ message: "You don't have permission to view drivers" });
    }

    // Find Role with name "driver"
    const driverRole = await Role.findOne({ name: "driver" });
    
    if (!driverRole) {
      return res.json([]); // No driver role exists
    }

    // Find all active users with driver role
    const drivers = await User.find({
      role_id: driverRole._id,
      status: "active",
    })
      .populate("role_id", "name")
      .select("name email phone address")
      .sort({ name: 1 }); // Sort alphabetically by name

    const driversList = drivers.map((driver) => ({
      _id: driver._id,
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      address: driver.address,
    }));

    res.json(driversList);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Assign driver to order
 */
export const assignDriver = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { driverId } = req.body;
    const userId = req.user.id || req.user._id;
    
    // Get user with populated role
    const user = await User.findById(userId).populate("role_id");
    const userRole = user?.role_id?.name || req.user.role;
    
    // Only hub managers and admins can assign drivers
    if (userRole !== "hub_manager" && userRole !== "admin") {
      return res.status(403).json({ message: "You don't have permission to assign drivers" });
    }

    if (!driverId) {
      return res.status(400).json({ message: "Driver ID is required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if order is packed or already assigned (for reassignment)
    if (order.status !== "packed" && order.status !== "assigned") {
      return res.status(400).json({ 
        message: "Driver can only be assigned to packed or assigned orders" 
      });
    }

    // Verify driver exists and has driver role
    const driver = await User.findById(driverId).populate("role_id");
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const driverRole = driver.role_id?.name;
    if (driverRole !== "driver") {
      return res.status(400).json({ message: "Selected user is not a driver" });
    }

    // Assign driver to order and update status to "assigned"
    order.delivery_person_id = driverId;
    order.status = "assigned";
    await order.save();

    await order.populate("user_id", "name email phone");
    await order.populate("hub_id", "name address");
    await order.populate("delivery_person_id", "name email phone");
    await order.populate("meal_items.meal_id", "name price");

    res.json({ message: "Driver assigned successfully", order });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

