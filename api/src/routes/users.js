import express from "express";
import db from "../models/index.js";

const router = express.Router();
const {
	User,
	UserInventory,
	Transaction,
	Item,
	Price,
	CaseOpening,
	CustomCase,
} = db;

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
								(
									(user.profitableTradeUps /
										user.totalTradeUps) *
									100
								).toFixed(2)
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
								(
									(user.profitableTradeUps /
										user.totalTradeUps) *
									100
								).toFixed(2)
						  )
						: 0,
			},
		});
	} catch (error) {
		console.error("❌ Error refreshing stats:", error.message);
		next(error);
	}
});

/**
 * GET /api/users/:steamId/inventory
 * Get user's case opening inventory
 */
router.get("/:steamId/inventory", async (req, res, next) => {
	try {
		const { steamId } = req.params;
		const { page = 1, limit = 50, sortBy = "recent" } = req.query;
		const offset = (parseInt(page) - 1) * parseInt(limit);

		const user = await User.findOne({ where: { steamId } });
		if (!user) {
			return res
				.status(404)
				.json({ success: false, error: "User not found" });
		}

		// Build order clause
		let order;
		switch (sortBy) {
			case "recent":
				order = [["acquiredAt", "DESC"]];
				break;
			case "value-high":
				order = [["currentValueCredits", "DESC"]];
				break;
			case "value-low":
				order = [["currentValueCredits", "ASC"]];
				break;
			default:
				order = [["acquiredAt", "DESC"]];
		}

		const { count, rows: inventory } = await UserInventory.findAndCountAll({
			where: { userId: user.id },
			limit: parseInt(limit),
			offset,
			order,
			include: [
				{
					model: Item,
					as: "item",
					include: [{ model: Price, as: "prices" }],
				},
				{
					model: CaseOpening,
					as: "caseOpening",
					attributes: ["id", "caseId", "openedAt"],
					include: [
						{
							model: CustomCase,
							as: "case",
							attributes: ["id", "title", "imageUrl"],
						},
					],
				},
			],
		});

		const totalValue = inventory.reduce(
			(sum, item) => sum + item.currentValueCredits,
			0
		);
		const totalAcquiredValue = inventory.reduce(
			(sum, item) => sum + item.acquiredValueCredits,
			0
		);
		const unrealizedProfit = totalValue - totalAcquiredValue;

		res.json({
			success: true,
			data: {
				inventory: inventory.map((i) => i.toJSON()),
				stats: {
					totalItems: count,
					totalValue,
					totalAcquiredValue,
					unrealizedProfit,
					unrealizedProfitPercentage:
						totalAcquiredValue > 0
							? (
									(unrealizedProfit / totalAcquiredValue) *
									100
							  ).toFixed(2)
							: 0,
				},
				pagination: {
					total: count,
					page: parseInt(page),
					limit: parseInt(limit),
					totalPages: Math.ceil(count / parseInt(limit)),
				},
			},
		});
	} catch (error) {
		console.error("❌ Error fetching inventory:", error.message);
		next(error);
	}
});

/**
 * GET /api/users/:steamId/transactions
 * Get user's transaction history
 */
router.get("/:steamId/transactions", async (req, res, next) => {
	try {
		const { steamId } = req.params;
		const { page = 1, limit = 50, type = null } = req.query;
		const offset = (parseInt(page) - 1) * parseInt(limit);

		const user = await User.findOne({ where: { steamId } });
		if (!user) {
			return res
				.status(404)
				.json({ success: false, error: "User not found" });
		}

		const where = { userId: user.id };
		if (type) where.type = type;

		const { count, rows: transactions } = await Transaction.findAndCountAll(
			{
				where,
				limit: parseInt(limit),
				offset,
				order: [["createdAt", "DESC"]],
				include: [
					{
						model: CustomCase,
						as: "relatedCase",
						attributes: ["id", "title", "imageUrl"],
					},
				],
			}
		);

		res.json({
			success: true,
			data: {
				transactions: transactions.map((t) => t.toJSON()),
				pagination: {
					total: count,
					page: parseInt(page),
					limit: parseInt(limit),
					totalPages: Math.ceil(count / parseInt(limit)),
				},
			},
		});
	} catch (error) {
		console.error("❌ Error fetching transactions:", error.message);
		next(error);
	}
});

/**
 * POST /api/users/:steamId/credits/add
 * Add credits to user balance (deposit)
 * Creates user automatically if they don't exist
 */
router.post("/:steamId/credits/add", async (req, res, next) => {
	const transaction = await db.sequelize.transaction();

	try {
		const { steamId } = req.params;
		const { amount, description = "Credit deposit" } = req.body;

		if (!amount || amount <= 0) {
			await transaction.rollback();
			return res
				.status(400)
				.json({ success: false, error: "Invalid amount" });
		}

		// Find or create user
		let [user, created] = await User.findOrCreate({
			where: { steamId },
			defaults: {
				steamId,
				steamName: steamId, // Use steamId as default name
				avatarUrl: null,
				balanceCredits: 0,
				lastActive: new Date(),
			},
			lock: true,
			transaction,
		});

		if (created) {
			console.log(`👤 New user created: ${steamId}`);
		}

		const balanceBefore = user.balanceCredits;
		user.balanceCredits += amount;
		await user.save({ transaction });

		await Transaction.create(
			{
				userId: user.id,
				type: "deposit",
				amountCredits: amount,
				balanceBefore,
				balanceAfter: user.balanceCredits,
				description,
				createdAt: new Date(),
			},
			{ transaction }
		);

		await transaction.commit();

		console.log(
			`💰 Credits added: ${amount} to ${steamId}${
				created ? " (new user)" : ""
			}`
		);

		res.json({
			success: true,
			data: {
				userCreated: created,
				balanceBefore,
				balanceAfter: user.balanceCredits,
				amountAdded: amount,
			},
		});
	} catch (error) {
		await transaction.rollback();
		console.error("❌ Error adding credits:", error.message);
		next(error);
	}
});

/**
 * GET /api/users/:steamId/balance
 * Get user's current balance
 */
router.get("/:steamId/balance", async (req, res, next) => {
	try {
		const { steamId } = req.params;

		const user = await User.findOne({
			where: { steamId },
			attributes: [
				"id",
				"balanceCredits",
				"totalEarnedCredits",
				"totalSpentCredits",
			],
		});

		if (!user) {
			return res
				.status(404)
				.json({ success: false, error: "User not found" });
		}

		res.json({
			success: true,
			data: {
				balanceCredits: user.balanceCredits,
				balanceUSD: (user.balanceCredits / 100).toFixed(2),
				totalEarnedCredits: user.totalEarnedCredits,
				totalSpentCredits: user.totalSpentCredits,
				netCredits: user.totalEarnedCredits - user.totalSpentCredits,
			},
		});
	} catch (error) {
		console.error("❌ Error fetching balance:", error.message);
		next(error);
	}
});

export default router;
