import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  getMyHub,
  getHubMenu,
  updateHubMenu,
  updateMealQuantity,
  deleteHubMeal,
  getHubOrders,
  getAvailableMeals,
} from "../controllers/hubPortal.controller.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get manager's hub
router.get("/my-hub", getMyHub);

// Get hub menu for a meal type
router.get("/menu", getHubMenu);

// Get available meals (to add to menu)
router.get("/available-meals", getAvailableMeals);

// Add/update meal in hub menu
router.post("/menu", updateHubMenu);

// Update meal quantity
router.put("/menu/quantity", updateMealQuantity);

// Delete meal from menu
router.delete("/menu", deleteHubMeal);

// Get hub orders
router.get("/orders", getHubOrders);

export default router;

