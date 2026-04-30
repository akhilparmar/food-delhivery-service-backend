import express from "express";
import { findNearestHub, getAllHubs, updateHub, createHub } from "../controllers/hub.controller.js";


import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Public route to find nearest hub
router.get("/nearest", findNearestHub);

// Get all hubs (requires auth)
router.get("/", authMiddleware, getAllHubs);

// Update hub (requires auth)
router.put("/:id", authMiddleware, updateHub);

// Create hub (Admin only)
router.post("/", authMiddleware, createHub);



export default router;
