import Hub from "../models/hub.model.js";
import HubMeal from "../models/hubMeal.model.js";
import Meal from "../models/meal.model.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";

/**
 * Get hub manager's hub
 */
export const getMyHub = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    console.log("DEBUG: getMyHub called by user:", req.user);

    let hub = await Hub.findOne({ manager_id: userId }).populate("manager_id", "name email");
    console.log("DEBUG: Hub found for manager:", hub);

    // If admin and no hub assigned, get first available hub
    if (!hub && req.user.role === 'admin') {
      console.log("DEBUG: User is admin, fetching first available hub");
      hub = await Hub.findOne().populate("manager_id", "name email");
      console.log("DEBUG: First available hub:", hub);
    }

    if (!hub) {
      return res.status(404).json({ message: "You are not assigned as a hub manager" + (req.user.role === 'admin' ? " and no hubs exist" : "") });
    }

    res.json(hub);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get hub menu (meals with quantities) for a specific meal type
 */
export const getHubMenu = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { meal_type } = req.query; // lunch or dinner

    if (!meal_type || !["breakfast", "lunch", "dinner"].includes(meal_type)) {
      return res.status(400).json({ message: "Valid meal_type (breakfast/lunch/dinner) is required" });
    }

    let hub = await Hub.findOne({ manager_id: userId });

    if (!hub && req.user.role === 'admin') {
      hub = await Hub.findOne();
    }

    if (!hub) {
      return res.status(404).json({ message: "You are not assigned as a hub manager" });
    }

    const hubMeals = await HubMeal.find({
      hub_id: hub._id,
      meal_type
    }).populate("meal_id");

    res.json({
      hub,
      meal_type,
      menu: hubMeals,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Add or update meal in hub menu
 */
export const updateHubMenu = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { meal_id, meal_type, quantity, is_available } = req.body;

    if (!meal_id || !meal_type || !["breakfast", "lunch", "dinner"].includes(meal_type)) {
      return res.status(400).json({ message: "meal_id and valid meal_type (breakfast/lunch/dinner) are required" });
    }

    let hub = await Hub.findOne({ manager_id: userId });

    if (!hub && req.user.role === 'admin') {
      hub = await Hub.findOne();
    }

    if (!hub) {
      return res.status(404).json({ message: "You are not assigned as a hub manager" });
    }

    // Check if meal exists
    const meal = await Meal.findById(meal_id);
    if (!meal) {
      return res.status(404).json({ message: "Meal not found" });
    }

    // Update or create hub meal
    const hubMeal = await HubMeal.findOneAndUpdate(
      { hub_id: hub._id, meal_id, meal_type },
      {
        quantity: quantity !== undefined ? quantity : 0,
        is_available: is_available !== undefined ? is_available : true,
      },
      { upsert: true, new: true }
    ).populate("meal_id");

    res.json({
      message: "Menu updated successfully",
      hubMeal,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Update meal quantity
 */
export const updateMealQuantity = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { hub_meal_id, quantity } = req.body;

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ message: "Valid quantity (>= 0) is required" });
    }

    let hub = await Hub.findOne({ manager_id: userId });

    if (!hub && req.user.role === 'admin') {
      hub = await Hub.findOne();
    }

    if (!hub) {
      return res.status(404).json({ message: "You are not assigned as a hub manager" });
    }

    const hubMeal = await HubMeal.findOne({
      _id: hub_meal_id,
      hub_id: hub._id
    });

    if (!hubMeal) {
      return res.status(404).json({ message: "Hub meal not found" });
    }

    hubMeal.quantity = quantity;
    hubMeal.is_available = quantity > 0;
    await hubMeal.save();

    res.json({
      message: "Quantity updated successfully",
      hubMeal: await HubMeal.findById(hubMeal._id).populate("meal_id"),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Delete meal from hub menu
 */
export const deleteHubMeal = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { hub_meal_id } = req.body;

    if (!hub_meal_id) {
      return res.status(400).json({ message: "hub_meal_id is required" });
    }

    let hub = await Hub.findOne({ manager_id: userId });

    if (!hub && req.user.role === 'admin') {
      hub = await Hub.findOne();
    }

    if (!hub) {
      return res.status(404).json({ message: "You are not assigned as a hub manager" });
    }

    const hubMeal = await HubMeal.findOne({
      _id: hub_meal_id,
      hub_id: hub._id
    });

    if (!hubMeal) {
      return res.status(404).json({ message: "Hub meal not found" });
    }

    await HubMeal.findByIdAndDelete(hub_meal_id);

    res.json({
      message: "Meal removed from menu successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get hub orders
 */
export const getHubOrders = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { status, meal_type } = req.query;

    let hub = await Hub.findOne({ manager_id: userId });

    if (!hub && req.user.role === 'admin') {
      hub = await Hub.findOne();
    }

    if (!hub) {
      return res.status(404).json({ message: "You are not assigned as a hub manager" });
    }

    let query = { hub_id: hub._id };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate("user_id", "name email phone")
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

    // Filter by meal_type if provided (this would need to be stored in order)
    let filteredOrders = orders;
    if (meal_type) {
      // Note: We'd need to add meal_type to Order model for this to work properly
      // For now, we'll return all orders
    }

    res.json({
      hub,
      orders: filteredOrders,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get all available meals (for adding to hub menu)
 */
export const getAvailableMeals = async (req, res) => {
  try {
    const meals = await Meal.find();
    res.json(meals);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

