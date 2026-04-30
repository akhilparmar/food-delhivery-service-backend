import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
import userRoutes from "./routes/user.routes.js";
import orderRoutes from "./routes/order.routes.js";
import hubRoutes from "./routes/hub.routes.js";
import roleRoutes from "./routes/role.routes.js";
import mealRoutes from "./routes/meal.routes.js";
import hubPortalRoutes from "./routes/hubPortal.routes.js";

app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/hubs", hubRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/hub-portal", hubPortalRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
