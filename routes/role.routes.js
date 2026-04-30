import express from "express";
import {
  createPermission,
  getAllPermissions,
  createRole,
  getAllRoles,
  assignPermissionsToRole,
  bootstrapRoles,
} from "../controllers/role.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import { roleCheck } from "../middleware/roleCheck.js";

const router = express.Router();

// 🔓 Bootstrap endpoint - no auth required (only works if no roles exist)
router.post("/bootstrap", bootstrapRoles);

// ✅ Only Admin can access these
router.post("/permission", authMiddleware, roleCheck(["admin"]), createPermission);
router.get("/permissions", authMiddleware, roleCheck(["admin"]), getAllPermissions);

router.post("/role", authMiddleware, roleCheck(["admin"]), createRole);
router.get("/roles", authMiddleware, roleCheck(["admin"]), getAllRoles);

router.put("/role/:roleId/permissions", authMiddleware, roleCheck(["admin"]), assignPermissionsToRole);

export default router;
