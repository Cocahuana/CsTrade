import express from "express";
import db from "../models/index.js";
import { Op } from "sequelize";

const router = express.Router();
const { CaseOpening, CustomCase, User } = db;

/**
 * GET /api/analytics/house-profit
 * Get house profit/loss statistics
 *
 * Query params:
 * - period: "24h" | "7d" | "30d" | "all" (default: "all")
 * - caseId: UUID (optional - filter by specific case)
 * - groupBy: "day" | "case" | "none" (default: "none")
 */
router.get("/house-profit", async (req, res, next) => {
	try {
		const { period = "all", caseId, groupBy = "none" } = req.query;

		// Build date filter
		const whereClause = {};
		if (period !== "all") {
			const now = new Date();
			const periodMap = {
				"24h": 24 * 60 * 60 * 1000,
				"7d": 7 * 24 * 60 * 60 * 1000,
				"30d": 30 * 24 * 60 * 60 * 1000,
			};

			if (periodMap[period]) {
				whereClause.openedAt = {
					[Op.gte]: new Date(now.getTime() - periodMap[period]),
				};
			}
		}

		if (caseId) {
			whereClause.caseId = caseId;
		}

		// Get aggregated statistics
		const stats = await CaseOpening.findAll({
			attributes: [
				[
					db.sequelize.fn(
						"SUM",
						db.sequelize.col("house_profit_credits")
					),
					"totalProfit",
				],
				[
					db.sequelize.fn(
						"AVG",
						db.sequelize.col("house_profit_credits")
					),
					"avgProfit",
				],
				[
					db.sequelize.fn("COUNT", db.sequelize.col("id")),
					"totalOpenings",
				],
				[
					db.sequelize.fn("SUM", db.sequelize.col("credits_spent")),
					"totalRevenue",
				],
				[
					db.sequelize.fn(
						"SUM",
						db.sequelize.col("item_value_credits")
					),
					"totalPaidOut",
				],
				[
					db.sequelize.literal(
						"SUM(CASE WHEN house_profit_credits > 0 THEN 1 ELSE 0 END)"
					),
					"profitableOpenings",
				],
				[
					db.sequelize.literal(
						"SUM(CASE WHEN house_profit_credits < 0 THEN 1 ELSE 0 END)"
					),
					"unprofitableOpenings",
				],
			],
			where: whereClause,
			raw: true,
		});

		const result = stats[0];

		// Get breakdown by groupBy parameter
		let breakdown = null;
		if (groupBy === "case") {
			const rawBreakdown = await CaseOpening.findAll({
				attributes: [
					"caseId",
					[
						db.sequelize.fn(
							"SUM",
							db.sequelize.col("house_profit_credits")
						),
						"profit",
					],
					[
						db.sequelize.fn("COUNT", db.sequelize.col("id")),
						"openings",
					],
				],
				where: whereClause,
				group: ["caseId", "case.id", "case.title"],
				include: [
					{
						model: CustomCase,
						as: "case",
						attributes: ["title", "priceCredits"],
					},
				],
			});

			// Add USD values to breakdown
			breakdown = rawBreakdown.map((item) => ({
				...item.toJSON(),
				profitUSD: (
					parseInt(item.dataValues.profit || 0) / 100
				).toFixed(2),
			}));
		} else if (groupBy === "day") {
			const rawBreakdown = await CaseOpening.findAll({
				attributes: [
					[
						db.sequelize.fn("DATE", db.sequelize.col("opened_at")),
						"date",
					],
					[
						db.sequelize.fn(
							"SUM",
							db.sequelize.col("house_profit_credits")
						),
						"profit",
					],
					[
						db.sequelize.fn("COUNT", db.sequelize.col("id")),
						"openings",
					],
				],
				where: whereClause,
				group: [db.sequelize.fn("DATE", db.sequelize.col("opened_at"))],
				order: [
					[
						db.sequelize.fn("DATE", db.sequelize.col("opened_at")),
						"ASC",
					],
				],
				raw: true,
			});

			// Add USD values to breakdown
			breakdown = rawBreakdown.map((item) => ({
				...item,
				profitUSD: (parseInt(item.profit || 0) / 100).toFixed(2),
			}));
		}

		res.json({
			success: true,
			period,
			data: {
				totalProfit: parseInt(result.totalProfit || 0),
				totalProfitUSD: (
					parseInt(result.totalProfit || 0) / 100
				).toFixed(2),
				avgProfit: parseFloat(result.avgProfit || 0).toFixed(2),
				avgProfitUSD: (parseFloat(result.avgProfit || 0) / 100).toFixed(
					2
				),
				totalOpenings: parseInt(result.totalOpenings || 0),
				totalRevenue: parseInt(result.totalRevenue || 0),
				totalRevenueUSD: (
					parseInt(result.totalRevenue || 0) / 100
				).toFixed(2),
				totalPaidOut: parseInt(result.totalPaidOut || 0),
				totalPaidOutUSD: (
					parseInt(result.totalPaidOut || 0) / 100
				).toFixed(2),
				profitableOpenings: parseInt(result.profitableOpenings || 0),
				unprofitableOpenings: parseInt(
					result.unprofitableOpenings || 0
				),
				profitMargin:
					result.totalRevenue > 0
						? (
								(parseInt(result.totalProfit || 0) /
									parseInt(result.totalRevenue || 0)) *
								100
						  ).toFixed(2)
						: "0.00",
				breakdown,
			},
		});
	} catch (error) {
		console.error("❌ Error fetching house profit stats:", error);
		next(error);
	}
});

/**
 * GET /api/analytics/top-profitable-cases
 * Get cases ranked by house profit
 *
 * Query params:
 * - limit: number (default: 10)
 * - order: "profit" | "margin" | "openings" (default: "profit")
 */
router.get("/top-profitable-cases", async (req, res, next) => {
	try {
		const { limit = 10, order = "profit" } = req.query;

		const orderMap = {
			profit: [
				db.sequelize.fn(
					"SUM",
					db.sequelize.col("house_profit_credits")
				),
				"DESC",
			],
			margin: [
				db.sequelize.literal(
					"CAST(SUM(house_profit_credits) AS FLOAT) / NULLIF(SUM(credits_spent), 0)"
				),
				"DESC",
			],
			openings: [
				db.sequelize.fn("COUNT", db.sequelize.col("CaseOpening.id")),
				"DESC",
			],
		};

		const cases = await CaseOpening.findAll({
			attributes: [
				"caseId",
				[
					db.sequelize.fn(
						"SUM",
						db.sequelize.col("house_profit_credits")
					),
					"totalProfit",
				],
				[
					db.sequelize.fn(
						"COUNT",
						db.sequelize.col("CaseOpening.id")
					),
					"totalOpenings",
				],
				[
					db.sequelize.fn("SUM", db.sequelize.col("credits_spent")),
					"totalRevenue",
				],
				[
					db.sequelize.literal(
						"CAST(SUM(house_profit_credits) AS FLOAT) / NULLIF(SUM(credits_spent), 0) * 100"
					),
					"profitMargin",
				],
			],
			group: ["caseId", "case.id", "case.title", "case.image_url"],
			include: [
				{
					model: CustomCase,
					as: "case",
					attributes: ["title", "imageUrl", "priceCredits"],
				},
			],
			order: [orderMap[order] || orderMap.profit],
			limit: parseInt(limit),
		});

		// Add USD values to results
		const casesWithUSD = cases.map((item) => ({
			...item.toJSON(),
			totalProfitUSD: (
				parseInt(item.dataValues.totalProfit || 0) / 100
			).toFixed(2),
			totalRevenueUSD: (
				parseInt(item.dataValues.totalRevenue || 0) / 100
			).toFixed(2),
		}));

		res.json({
			success: true,
			data: casesWithUSD,
		});
	} catch (error) {
		console.error("❌ Error fetching top profitable cases:", error);
		next(error);
	}
});

/**
 * GET /api/analytics/recent-big-wins
 * Get recent case openings where the house lost significantly
 *
 * Query params:
 * - limit: number (default: 20)
 * - minLoss: number (default: 0) - minimum house loss in credits
 */
router.get("/recent-big-wins", async (req, res, next) => {
	try {
		const { limit = 20, minLoss = 0 } = req.query;

		const bigWins = await CaseOpening.findAll({
			where: {
				houseProfitCredits: {
					[Op.lt]: -parseInt(minLoss),
				},
			},
			include: [
				{
					model: CustomCase,
					as: "case",
					attributes: ["title", "imageUrl", "priceCredits"],
				},
				{
					model: User,
					as: "user",
					attributes: ["username", "steamId"],
				},
				{
					model: db.Item,
					as: "itemWon",
					attributes: ["name"],
					include: [
						{
							model: db.Price,
							as: "prices",
							attributes: ["price"],
						},
					],
				},
			],
			order: [["houseProfitCredits", "ASC"]], // Most negative first (biggest losses)
			limit: parseInt(limit),
		});

		// Add USD values to results
		const bigWinsWithUSD = bigWins.map((item) => ({
			...item.toJSON(),
			houseProfitUSD: (
				parseInt(item.houseProfitCredits || 0) / 100
			).toFixed(2),
			creditsSpentUSD: (parseInt(item.creditsSpent || 0) / 100).toFixed(
				2
			),
			itemValueUSD: (parseInt(item.itemValueCredits || 0) / 100).toFixed(
				2
			),
		}));

		res.json({
			success: true,
			data: bigWinsWithUSD,
		});
	} catch (error) {
		console.error("❌ Error fetching big wins:", error);
		next(error);
	}
});

export default router;
