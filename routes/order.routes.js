import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { roleCheck } from "../middleware/roleCheck.js";
import { createOrder, getUserOrders, getAllOrders, getHubOrders, updateOrderStatus, getDrivers, assignDriver } from "../controllers/order.controller.js";

const router = express.Router();

// Create order (authenticated users)
router.post("/", authMiddleware, createOrder);

// Get user's own orders
router.get("/my-orders", authMiddleware, getUserOrders);

// Get hub orders (hub managers)
router.get("/hub-orders", authMiddleware, getHubOrders);

// Get all orders (admin only)
router.get("/", authMiddleware, roleCheck(["admin"]), getAllOrders);

// Update order status (hub managers, drivers, admin)
router.put("/:orderId/status", authMiddleware, updateOrderStatus);

// Get all drivers for order assignment (hub managers, admin)
router.get("/drivers", authMiddleware, getDrivers);

// Assign driver to order (hub managers, admin)
router.post("/:orderId/assign-driver", authMiddleware, assignDriver);

export default router;
