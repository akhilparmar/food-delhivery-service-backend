import Meal from "../models/meal.model.js";
import HubMeal from "../models/hubMeal.model.js";
import Hub from "../models/hub.model.js";

/**
 * Get all available meals for a hub and meal type
 */
export const getAllMeals = async (req, res) => {
  try {
    const { hubId, meal_type } = req.query;
    
    if (!hubId || !meal_type) {
      // If no hub/meal_type specified, return all meals (for admin/hub manager)
      const meals = await Meal.find().populate("available_hubs", "name");
      return res.json(meals);
    }

    // Get meals available at this hub for the specified meal type
    const hubMeals = await HubMeal.find({
      hub_id: hubId,
      meal_type,
      is_available: true,
      quantity: { $gt: 0 },
    }).populate("meal_id");

    // Format response with availability info
    const meals = hubMeals.map((hubMeal) => ({
      ...hubMeal.meal_id.toObject(),
      available_quantity: hubMeal.quantity,
      hub_meal_id: hubMeal._id,
      is_available: hubMeal.is_available,
    }));

    res.json(meals);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get meal by ID
 */
export const getMealById = async (req, res) => {
  try {
    const { id } = req.params;
    const meal = await Meal.findById(id).populate("available_hubs", "name");
    
    if (!meal) {
      return res.status(404).json({ message: "Meal not found" });
    }
    
    res.json(meal);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Create a new meal (hub manager or admin only)
 */
export const createMeal = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { name, description, price, image_url } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "Name and price are required" });
    }

    // Check if user is hub manager or admin
    const hub = await Hub.findOne({ manager_id: userId });
    if (!hub && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only hub managers and admins can create meals" });
    }

    const meal = new Meal({
      name,
      description: description || "",
      price: parseFloat(price),
      image_url: image_url || "",
      available_hubs: hub ? [hub._id] : [],
    });

    await meal.save();
    res.status(201).json({ message: "Meal created successfully", meal });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Update a meal (hub manager or admin only)
 */
export const updateMeal = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { id } = req.params;
    const { name, description, price, image_url } = req.body;

    const meal = await Meal.findById(id);
    if (!meal) {
      return res.status(404).json({ message: "Meal not found" });
    }

    // Check if user is hub manager or admin
    const hub = await Hub.findOne({ manager_id: userId });
    if (!hub && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only hub managers and admins can update meals" });
    }

    // Update fields
    if (name !== undefined) meal.name = name;
    if (description !== undefined) meal.description = description;
    if (price !== undefined) meal.price = parseFloat(price);
    if (image_url !== undefined) meal.image_url = image_url;

    await meal.save();
    res.json({ message: "Meal updated successfully", meal });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Delete a meal (hub manager or admin only)
 */
export const deleteMeal = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { id } = req.params;

    const meal = await Meal.findById(id);
    if (!meal) {
      return res.status(404).json({ message: "Meal not found" });
    }

    // Check if user is hub manager or admin
    const hub = await Hub.findOne({ manager_id: userId });
    if (!hub && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only hub managers and admins can delete meals" });
    }

    // Check if meal is used in any hub meals
    const hubMeals = await HubMeal.find({ meal_id: id });
    if (hubMeals.length > 0) {
      return res.status(400).json({ 
        message: "Cannot delete meal. It is currently in use in hub menus. Remove it from menus first." 
      });
    }

    await Meal.findByIdAndDelete(id);
    res.json({ message: "Meal deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

