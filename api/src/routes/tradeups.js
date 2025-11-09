import express from "express";
import db from "../models/index.js";

const router = express.Router();
const { TradeUp, User } = db;

/**
 * POST /api/tradeups
 * Create a new trade-up (save planned or completed trade-up)
 * 
 * @body {string} steamId - User's Steam ID
 * @body {array} inputs - Array of 10 input items
 * @body {array} predictedOutcomes - Array of predicted outcomes
 * @body {object} stats - Trade-up statistics (cost, expectedValue, etc.)
 * @body {string} [notes] - Optional notes
 */
router.post("/", async (req, res, next) => {
	try {
		const {
			steamId,
			inputs,
			predictedOutcomes,
			stats,
			notes,
			actualOutcome,
			actualPrice,
		} = req.body;

		// Validation
		if (!steamId || !inputs || !predictedOutcomes || !stats) {
			return res.status(400).json({
				success: false,
				error: "Missing required fields: steamId, inputs, predictedOutcomes, stats",
			});
		}

		console.log(`💾 Saving trade-up for user: ${steamId}`);

		// Get or create user
		let user = await User.findOne({ where: { steamId } });

		if (!user) {
			user = await User.create({
				steamId,
				lastActive: new Date(),
			});
			console.log(`  ✅ New user created: ${steamId}`);
		} else {
			user.lastActive = new Date();
			await user.save();
		}

		// Determine status
		let status = "planned";
		let actualProfit = null;

		if (actualOutcome && actualPrice) {
			actualProfit = actualPrice - stats.totalCost;
			status = actualProfit > 0 ? "profit" : actualProfit < 0 ? "loss" : "completed";
		}

		// Create trade-up record
		const tradeUp = await TradeUp.create({
			userId: user.id,
			inputsData: inputs,
			predictedOutcomes,
			totalCost: stats.totalCost,
			expectedValue: stats.expectedValue,
			expectedProfit: stats.expectedProfit || stats.profit,
			profitability: stats.profitability,
			oddsToProfit: stats.oddsToProfit,
			actualOutcome: actualOutcome || null,
			actualPrice: actualPrice || null,
			actualProfit,
			status,
			notes: notes || null,
			completedAt: actualOutcome ? new Date() : null,
		});

		// Update user stats
		await user.updateStats();

		console.log(`  ✅ Trade-up saved with ID: ${tradeUp.id}`);

		res.status(201).json({
			success: true,
			data: {
				id: tradeUp.id,
				userId: user.id,
				steamId: user.steamId,
				status: tradeUp.status,
				profitability: parseFloat(tradeUp.profitability),
				createdAt: tradeUp.createdAt,
			},
		});
	} catch (error) {
		console.error("❌ Error creating trade-up:", error.message);
		next(error);
	}
});

/**
 * GET /api/tradeups/user/:steamId
 * Get all trade-ups for a specific user
 * 
 * @param {string} steamId - User's Steam ID
 * @query {string} [status] - Filter by status (planned, completed, profit, loss)
 * @query {number} [limit=50] - Limit results
 * @query {number} [offset=0] - Offset for pagination
 */
router.get("/user/:steamId", async (req, res, next) => {
	try {
		const { steamId } = req.params;
		const { status, limit = 50, offset = 0 } = req.query;

		console.log(`📊 Fetching trade-ups for user: ${steamId}`);

		// Find user
		const user = await User.findOne({ where: { steamId } });

		if (!user) {
			return res.status(404).json({
				success: false,
				error: "User not found",
			});
		}

		// Build query
		const where = { userId: user.id };
		if (status) {
			where.status = status;
		}

		// Get trade-ups
		const tradeUps = await TradeUp.findAll({
			where,
			order: [["createdAt", "DESC"]],
			limit: parseInt(limit),
			offset: parseInt(offset),
		});

		// Get total count
		const total = await TradeUp.count({ where });

		console.log(`  ✅ Found ${tradeUps.length} trade-ups (total: ${total})`);

		res.json({
			success: true,
			data: tradeUps.map((t) => ({
				id: t.id,
				inputs: t.inputsData,
				predictedOutcomes: t.predictedOutcomes,
				totalCost: parseFloat(t.totalCost),
				expectedValue: parseFloat(t.expectedValue),
				expectedProfit: parseFloat(t.expectedProfit),
				profitability: parseFloat(t.profitability),
				oddsToProfit: parseFloat(t.oddsToProfit),
				actualOutcome: t.actualOutcome,
				actualPrice: t.actualPrice ? parseFloat(t.actualPrice) : null,
				actualProfit: t.actualProfit ? parseFloat(t.actualProfit) : null,
				status: t.status,
				notes: t.notes,
				completedAt: t.completedAt,
				createdAt: t.createdAt,
			})),
			pagination: {
				total,
				limit: parseInt(limit),
				offset: parseInt(offset),
				hasMore: parseInt(offset) + tradeUps.length < total,
			},
		});
	} catch (error) {
		console.error("❌ Error fetching trade-ups:", error.message);
		next(error);
	}
});

/**
 * GET /api/tradeups/:id
 * Get a specific trade-up by ID
 */
router.get("/:id", async (req, res, next) => {
	try {
		const { id } = req.params;

		const tradeUp = await TradeUp.findByPk(id, {
			include: [
				{
					model: User,
					as: "user",
					attributes: ["steamId", "steamName"],
				},
			],
		});

		if (!tradeUp) {
			return res.status(404).json({
				success: false,
				error: "Trade-up not found",
			});
		}

		res.json({
			success: true,
			data: {
				id: tradeUp.id,
				steamId: tradeUp.user.steamId,
				inputs: tradeUp.inputsData,
				predictedOutcomes: tradeUp.predictedOutcomes,
				totalCost: parseFloat(tradeUp.totalCost),
				expectedValue: parseFloat(tradeUp.expectedValue),
				expectedProfit: parseFloat(tradeUp.expectedProfit),
				profitability: parseFloat(tradeUp.profitability),
				oddsToProfit: parseFloat(tradeUp.oddsToProfit),
				actualOutcome: tradeUp.actualOutcome,
				actualPrice: tradeUp.actualPrice ? parseFloat(tradeUp.actualPrice) : null,
				actualProfit: tradeUp.actualProfit ? parseFloat(tradeUp.actualProfit) : null,
				status: tradeUp.status,
				notes: tradeUp.notes,
				completedAt: tradeUp.completedAt,
				createdAt: tradeUp.createdAt,
			},
		});
	} catch (error) {
		console.error("❌ Error fetching trade-up:", error.message);
		next(error);
	}
});

/**
 * PUT /api/tradeups/:id/complete
 * Mark a trade-up as completed with actual outcome
 * 
 * @body {string} actualOutcome - The item received
 * @body {number} actualPrice - The price of the item received
 * @body {string} [notes] - Optional notes
 */
router.put("/:id/complete", async (req, res, next) => {
	try {
		const { id } = req.params;
		const { actualOutcome, actualPrice, notes } = req.body;

		if (!actualOutcome || !actualPrice) {
			return res.status(400).json({
				success: false,
				error: "Missing required fields: actualOutcome, actualPrice",
			});
		}

		console.log(`✅ Completing trade-up: ${id}`);

		const tradeUp = await TradeUp.findByPk(id, {
			include: [{ model: User, as: "user" }],
		});

		if (!tradeUp) {
			return res.status(404).json({
				success: false,
				error: "Trade-up not found",
			});
		}

		// Update trade-up
		await tradeUp.complete(actualOutcome, actualPrice);

		if (notes) {
			tradeUp.notes = notes;
			await tradeUp.save();
		}

		// Update user stats
		await tradeUp.user.updateStats();

		console.log(`  ✅ Trade-up completed: ${tradeUp.status} (profit: $${tradeUp.actualProfit})`);

		res.json({
			success: true,
			data: {
				id: tradeUp.id,
				actualOutcome: tradeUp.actualOutcome,
				actualPrice: parseFloat(tradeUp.actualPrice),
				actualProfit: parseFloat(tradeUp.actualProfit),
				status: tradeUp.status,
				completedAt: tradeUp.completedAt,
			},
		});
	} catch (error) {
		console.error("❌ Error completing trade-up:", error.message);
		next(error);
	}
});

/**
 * PUT /api/tradeups/:id
 * Update trade-up notes or other editable fields
 */
router.put("/:id", async (req, res, next) => {
	try {
		const { id } = req.params;
		const { notes } = req.body;

		const tradeUp = await TradeUp.findByPk(id);

		if (!tradeUp) {
			return res.status(404).json({
				success: false,
				error: "Trade-up not found",
			});
		}

		// Update allowed fields
		if (notes !== undefined) {
			tradeUp.notes = notes;
		}

		await tradeUp.save();

		res.json({
			success: true,
			data: {
				id: tradeUp.id,
				notes: tradeUp.notes,
				updatedAt: tradeUp.updatedAt,
			},
		});
	} catch (error) {
		console.error("❌ Error updating trade-up:", error.message);
		next(error);
	}
});

/**
 * DELETE /api/tradeups/:id
 * Delete a trade-up
 */
router.delete("/:id", async (req, res, next) => {
	try {
		const { id } = req.params;

		const tradeUp = await TradeUp.findByPk(id, {
			include: [{ model: User, as: "user" }],
		});

		if (!tradeUp) {
			return res.status(404).json({
				success: false,
				error: "Trade-up not found",
			});
		}

		await tradeUp.destroy();

		// Update user stats
		await tradeUp.user.updateStats();

		console.log(`🗑️ Trade-up deleted: ${id}`);

		res.json({
			success: true,
			message: "Trade-up deleted successfully",
		});
	} catch (error) {
		console.error("❌ Error deleting trade-up:", error.message);
		next(error);
	}
});

/**
 * GET /api/tradeups/user/:steamId/stats
 * Get statistics for a user's trade-ups
 */
router.get("/user/:steamId/stats", async (req, res, next) => {
	try {
		const { steamId } = req.params;

		console.log(`📊 Fetching stats for user: ${steamId}`);

		const user = await User.findOne({ where: { steamId } });

		if (!user) {
			return res.status(404).json({
				success: false,
				error: "User not found",
			});
		}

		// Get detailed stats
		const stats = await TradeUp.getStats(user.id);

		// Get recent trade-ups
		const recentTradeUps = await TradeUp.findAll({
			where: { userId: user.id },
			order: [["createdAt", "DESC"]],
			limit: 10,
		});

		// Calculate win rate
		const total = parseInt(stats.total) || 0;
		const profitable = parseInt(stats.profitable) || 0;
		const winRate = total > 0 ? (profitable / total) * 100 : 0;

		res.json({
			success: true,
			data: {
				user: {
					steamId: user.steamId,
					steamName: user.steamName,
					totalTradeUps: user.totalTradeUps,
					profitableTradeUps: user.profitableTradeUps,
					totalProfit: parseFloat(user.totalProfit),
					lastActive: user.lastActive,
				},
				stats: {
					total,
					profitable,
					totalProfit: stats.totalProfit ? parseFloat(stats.totalProfit) : 0,
					avgProfitability: stats.avgProfitability
						? parseFloat(stats.avgProfitability)
						: 0,
					winRate: parseFloat(winRate.toFixed(2)),
				},
				recentTradeUps: recentTradeUps.map((t) => ({
					id: t.id,
					totalCost: parseFloat(t.totalCost),
					expectedProfit: parseFloat(t.expectedProfit),
					actualProfit: t.actualProfit ? parseFloat(t.actualProfit) : null,
					status: t.status,
					createdAt: t.createdAt,
				})),
			},
		});
	} catch (error) {
		console.error("❌ Error fetching stats:", error.message);
		next(error);
	}
});

export default router;

