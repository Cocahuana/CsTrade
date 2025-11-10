import express from "express";
import db from "../models/index.js";

const router = express.Router();
const {
	User,
	CustomCase,
	CaseOpening,
	Transaction,
	UserInventory,
	Item,
	Price,
} = db;

/**
 * GET /api/creator/:userId/stats
 * Get creator dashboard stats
 */
router.get("/:userId/stats", async (req, res) => {
	try {
		const user = await User.findByPk(req.params.userId, {
			attributes: [
				"id",
				"steamName",
				"avatarUrl",
				"balanceCredits",
				"totalEarnedCredits",
				"totalSpentCredits",
				"totalCasesOpened",
				"totalCasesCreated",
			],
		});

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Get total cases created
		const cases = await CustomCase.findAll({
			where: { creatorId: req.params.userId },
			attributes: [
				"id",
				"title",
				"priceCredits",
				"timesOpened",
				"totalRevenueCredits",
				"isActive",
			],
		});

		// Calculate total earnings and stats
		const totalRevenue = cases.reduce(
			(sum, c) => sum + c.totalRevenueCredits,
			0
		);
		const totalOpenings = cases.reduce((sum, c) => sum + c.timesOpened, 0);
		const activeCases = cases.filter((c) => c.isActive).length;

		// Get recent earnings transactions
		const recentEarnings = await Transaction.findAll({
			where: {
				userId: req.params.userId,
				type: "creator_earnings",
			},
			limit: 10,
			order: [["createdAt", "DESC"]],
			include: [
				{
					model: CustomCase,
					as: "relatedCase",
					attributes: ["id", "title"],
				},
			],
		});

		res.json({
			user: user.toJSON(),
			creatorStats: {
				totalCasesCreated: user.totalCasesCreated,
				activeCases,
				totalRevenue,
				totalOpenings,
				totalEarnings: user.totalEarnedCredits,
				averageEarningsPerOpening:
					totalOpenings > 0
						? (user.totalEarnedCredits / totalOpenings).toFixed(2)
						: 0,
			},
			cases: cases.map((c) => {
				const caseJson = c.toJSON();
				return {
					...caseJson,
					earningsPerOpening:
						c.timesOpened > 0
							? (
									(c.totalRevenueCredits * 0.15) /
									c.timesOpened
							  ).toFixed(2)
							: 0,
					totalEarnings: (c.totalRevenueCredits * 0.15).toFixed(2),
				};
			}),
			recentEarnings: recentEarnings.map((t) => t.toJSON()),
		});
	} catch (error) {
		console.error("Error fetching creator stats:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/creator/:userId/cases
 * Get all cases created by user
 */
router.get("/:userId/cases", async (req, res) => {
	try {
		const { page = 1, limit = 20, status = "all" } = req.query;
		const offset = (parseInt(page) - 1) * parseInt(limit);

		const where = { creatorId: req.params.userId };
		if (status === "active") where.isActive = true;
		if (status === "inactive") where.isActive = false;

		const { count, rows: cases } = await CustomCase.findAndCountAll({
			where,
			limit: parseInt(limit),
			offset,
			order: [["createdAt", "DESC"]],
			include: [
				{
					model: db.CaseItem,
					as: "caseItems",
					include: [
						{
							model: Item,
							as: "item",
							include: [
								{
									model: Price,
									as: "price",
								},
							],
						},
					],
				},
			],
		});

		const casesWithStats = cases.map((c) => {
			const caseJson = c.toJSON();
			const expectedValue = c.calculateExpectedValue();
			const houseEdge = c.calculateHouseEdge();
			const totalEarnings = (c.totalRevenueCredits * 0.15).toFixed(2);

			return {
				...caseJson,
				expectedValue,
				houseEdge,
				totalEarnings,
				itemCount: caseJson.caseItems?.length || 0,
			};
		});

		res.json({
			cases: casesWithStats,
			pagination: {
				total: count,
				page: parseInt(page),
				limit: parseInt(limit),
				totalPages: Math.ceil(count / parseInt(limit)),
			},
		});
	} catch (error) {
		console.error("Error fetching creator cases:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/creator/:userId/earnings
 * Get earnings history with details
 */
router.get("/:userId/earnings", async (req, res) => {
	try {
		const { page = 1, limit = 50 } = req.query;
		const offset = (parseInt(page) - 1) * parseInt(limit);

		const { count, rows: earnings } = await Transaction.findAndCountAll({
			where: {
				userId: req.params.userId,
				type: "creator_earnings",
			},
			limit: parseInt(limit),
			offset,
			order: [["createdAt", "DESC"]],
			include: [
				{
					model: CustomCase,
					as: "relatedCase",
					attributes: ["id", "title", "imageUrl", "priceCredits"],
				},
				{
					model: CaseOpening,
					as: "caseOpening",
					include: [
						{
							model: User,
							as: "user",
							attributes: ["id", "steamName", "avatarUrl"],
						},
						{
							model: Item,
							as: "itemWon",
							attributes: ["id", "name"],
						},
					],
				},
			],
		});

		const totalEarnings = earnings.reduce(
			(sum, t) => sum + t.amountCredits,
			0
		);

		res.json({
			earnings: earnings.map((e) => e.toJSON()),
			stats: {
				totalEarnings,
				transactionCount: count,
			},
			pagination: {
				total: count,
				page: parseInt(page),
				limit: parseInt(limit),
				totalPages: Math.ceil(count / parseInt(limit)),
			},
		});
	} catch (error) {
		console.error("Error fetching creator earnings:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/creator/leaderboard
 * Get top creators by earnings
 */
router.get("/leaderboard/top", async (req, res) => {
	try {
		const { limit = 20 } = req.query;

		const topCreators = await User.findAll({
			where: {
				totalCasesCreated: {
					[db.Sequelize.Op.gt]: 0,
				},
			},
			attributes: [
				"id",
				"steamName",
				"avatarUrl",
				"totalCasesCreated",
				"totalEarnedCredits",
			],
			order: [["totalEarnedCredits", "DESC"]],
			limit: parseInt(limit),
		});

		res.json({
			topCreators: topCreators.map((u) => u.toJSON()),
		});
	} catch (error) {
		console.error("Error fetching creator leaderboard:", error);
		res.status(500).json({ error: error.message });
	}
});

export default router;
