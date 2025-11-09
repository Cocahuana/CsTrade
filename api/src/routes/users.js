import express from "express";
import db from "../models/index.js";

const router = express.Router();
const { User } = db;

/**
 * GET /api/users/:steamId
 * Get user profile and basic stats
 */
router.get("/:steamId", async (req, res, next) => {
	try {
		const { steamId } = req.params;

		console.log(`👤 Fetching user: ${steamId}`);

		const user = await User.findOne({ where: { steamId } });

		if (!user) {
			return res.status(404).json({
				success: false,
				error: "User not found",
			});
		}

		res.json({
			success: true,
			data: {
				steamId: user.steamId,
				steamName: user.steamName,
				avatarUrl: user.avatarUrl,
				totalTradeUps: user.totalTradeUps,
				profitableTradeUps: user.profitableTradeUps,
				totalProfit: parseFloat(user.totalProfit),
				winRate:
					user.totalTradeUps > 0
						? parseFloat(
								((user.profitableTradeUps / user.totalTradeUps) * 100).toFixed(2)
						  )
						: 0,
				lastActive: user.lastActive,
				createdAt: user.createdAt,
			},
		});
	} catch (error) {
		console.error("❌ Error fetching user:", error.message);
		next(error);
	}
});

/**
 * POST /api/users
 * Create or update user profile
 * 
 * @body {string} steamId - Steam ID (required)
 * @body {string} [steamName] - Steam display name
 * @body {string} [avatarUrl] - Avatar URL
 */
router.post("/", async (req, res, next) => {
	try {
		const { steamId, steamName, avatarUrl } = req.body;

		if (!steamId) {
			return res.status(400).json({
				success: false,
				error: "steamId is required",
			});
		}

		console.log(`👤 Creating/updating user: ${steamId}`);

		// Find or create user
		let user = await User.findOne({ where: { steamId } });

		if (user) {
			// Update existing user
			if (steamName) user.steamName = steamName;
			if (avatarUrl) user.avatarUrl = avatarUrl;
			user.lastActive = new Date();
			await user.save();

			console.log(`  ✅ User updated: ${steamId}`);
		} else {
			// Create new user
			user = await User.create({
				steamId,
				steamName: steamName || null,
				avatarUrl: avatarUrl || null,
				lastActive: new Date(),
			});

			console.log(`  ✅ User created: ${steamId}`);
		}

		res.json({
			success: true,
			data: {
				steamId: user.steamId,
				steamName: user.steamName,
				avatarUrl: user.avatarUrl,
				lastActive: user.lastActive,
				createdAt: user.createdAt,
			},
		});
	} catch (error) {
		console.error("❌ Error creating/updating user:", error.message);
		next(error);
	}
});

/**
 * PUT /api/users/:steamId
 * Update user profile
 * 
 * @body {string} [steamName] - Steam display name
 * @body {string} [avatarUrl] - Avatar URL
 */
router.put("/:steamId", async (req, res, next) => {
	try {
		const { steamId } = req.params;
		const { steamName, avatarUrl } = req.body;

		const user = await User.findOne({ where: { steamId } });

		if (!user) {
			return res.status(404).json({
				success: false,
				error: "User not found",
			});
		}

		// Update fields
		if (steamName !== undefined) user.steamName = steamName;
		if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
		user.lastActive = new Date();

		await user.save();

		console.log(`  ✅ User updated: ${steamId}`);

		res.json({
			success: true,
			data: {
				steamId: user.steamId,
				steamName: user.steamName,
				avatarUrl: user.avatarUrl,
				lastActive: user.lastActive,
			},
		});
	} catch (error) {
		console.error("❌ Error updating user:", error.message);
		next(error);
	}
});

/**
 * GET /api/users/:steamId/refresh-stats
 * Manually refresh user statistics
 */
router.get("/:steamId/refresh-stats", async (req, res, next) => {
	try {
		const { steamId } = req.params;

		const user = await User.findOne({ where: { steamId } });

		if (!user) {
			return res.status(404).json({
				success: false,
				error: "User not found",
			});
		}

		// Recalculate stats
		await user.updateStats();

		console.log(`🔄 Stats refreshed for user: ${steamId}`);

		res.json({
			success: true,
			data: {
				totalTradeUps: user.totalTradeUps,
				profitableTradeUps: user.profitableTradeUps,
				totalProfit: parseFloat(user.totalProfit),
				winRate:
					user.totalTradeUps > 0
						? parseFloat(
								((user.profitableTradeUps / user.totalTradeUps) * 100).toFixed(2)
						  )
						: 0,
			},
		});
	} catch (error) {
		console.error("❌ Error refreshing stats:", error.message);
		next(error);
	}
});

export default router;

