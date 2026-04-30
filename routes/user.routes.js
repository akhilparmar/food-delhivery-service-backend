import express from "express";
import { registerUser, loginUser, getAllUsers } from "../controllers/user.controller.js";
import { authMiddleware } from "../middleware/auth.js";


const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/", authMiddleware, getAllUsers);


export default router;
