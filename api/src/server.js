import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import steamRoutes from "./routes/steam.js";
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

// Error handling middleware (must be last)
app.use(errorHandler);

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
});
