
import express from "express";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";

import db from "./src/config/db.ts";
import userRoutes from "./src/routes/auth.routes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(clerkMiddleware());

import dashboardRoutes from "./src/routes/dashboard.routes.js";

// Routes
app.use("/api/users", userRoutes);
app.use("/api", dashboardRoutes);

// Start server after database connection
const startServer = async () => {
  try {
    await db();

    app.listen(PORT, () => {
      console.log(`Server is running on ${PORT}...`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();

export default app;
