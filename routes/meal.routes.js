import express from "express";
import { getAllMeals, getMealById, createMeal, updateMeal, deleteMeal } from "../controllers/meal.controller.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Get all meals (public or can add auth if needed)
router.get("/", getAllMeals);

// Get meal by ID
router.get("/:id", getMealById);

// Create meal (hub manager or admin only)
router.post("/", authMiddleware, createMeal);

// Update meal (hub manager or admin only)
router.put("/:id", authMiddleware, updateMeal);

// Delete meal (hub manager or admin only)
router.delete("/:id", authMiddleware, deleteMeal);

export default router;

