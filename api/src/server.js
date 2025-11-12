import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./models/index.js";
import steamRoutes from "./routes/steam.js";
import pricesRoutes from "./routes/prices.js";
import tradeupsRoutes from "./routes/tradeups.js";
import usersRoutes from "./routes/users.js";
import collectionsRoutes from "./routes/collections.js";
import casesRoutes from "./routes/cases.js";
import openingsRoutes from "./routes/openings.js";
import creatorRoutes from "./routes/creator.js";
import analyticsRoutes from "./routes/analytics.js";
import itemsRoutes from "./routes/items.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/logger.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
	cors({
		origin: process.env.FRONTEND_URL || "http://localhost:3000",
		credentials: true,
	})
);
app.use(express.json());
app.use(requestLogger);

// Health check endpoint
app.get("/health", (req, res) => {
	res.json({
		status: "ok",
		message: "CS Trades API Server is running",
		timestamp: new Date().toISOString(),
	});
});

// API Routes
app.use("/api/steam", steamRoutes);
app.use("/api/prices", pricesRoutes);
app.use("/api/tradeups", tradeupsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/collections", collectionsRoutes);
app.use("/api/cases", casesRoutes);
app.use("/api/openings", openingsRoutes);
app.use("/api/creator", creatorRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/items", itemsRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
	try {
		// Test database connection
		await db.sequelize.authenticate();
		console.log("✅ Database connection established successfully");

		// Sync models (only in development - use migrations in production)
		if (process.env.NODE_ENV === "development") {
			// alter: true updates tables without dropping them
			// force: true drops and recreates (CAREFUL!)
			await db.sequelize.sync({ alter: false });
			console.log("✅ Database models synchronized");
		}

		// Start server
		app.listen(PORT, () => {
			console.log(`🚀 CS Trades API Server running on port ${PORT}`);
			console.log(
				`📡 Frontend URL: ${
					process.env.FRONTEND_URL || "http://localhost:3000"
				}`
			);
			console.log(
				`🔑 Steam API Key: ${
					process.env.STEAM_API_KEY
						? "✓ Configured"
						: "✗ Not configured (optional)"
				}`
			);
			console.log(
				`💾 Database: ${process.env.DB_NAME || "cstrades_dev"} @ ${
					process.env.DB_HOST || "localhost"
				}:${process.env.DB_PORT || 5432}`
			);
		});
	} catch (error) {
		console.error("❌ Unable to connect to the database:", error.message);
		console.error(
			"\n💡 Make sure PostgreSQL is running and configured correctly"
		);
		console.error(
			"   Check your .env file for correct database credentials\n"
		);
		process.exit(1);
	}
}

startServer();
