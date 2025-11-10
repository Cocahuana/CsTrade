import express from "express";
import db from "../models/index.js";
import { openCase } from "../services/caseOpeningService.js";

const router = express.Router();
const { CaseOpening, User, CustomCase, Item, Price, UserInventory } = db;

/**
 * POST /api/openings
 * Open a case
 */
router.post("/", async (req, res) => {
	try {
		const { userId, caseId } = req.body;

		if (!userId || !caseId) {
			return res.status(400).json({
				error: "Missing required fields: userId, caseId",
			});
		}

		// Find user by UUID or Steam ID
		let user = await User.findByPk(userId);
		if (!user) {
			user = await User.findOne({
				where: { steamId: userId },
			});
		}

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Use the user's UUID for opening the case
		const result = await openCase(user.id, caseId);

		res.status(201).json(result);
	} catch (error) {
		console.error("Error opening case:", error);

		// Handle specific errors
		if (error.message === "Case not found or inactive") {
			return res.status(404).json({ error: error.message });
		}

		if (error.message === "User not found") {
			return res.status(404).json({ error: error.message });
		}

		if (error.message === "Insufficient credits") {
			return res.status(400).json({ error: error.message });
		}

		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/openings/:id
 * Get opening details with verification data
 */
router.get("/:id", async (req, res) => {
	try {
		const opening = await CaseOpening.findByPk(req.params.id, {
			include: [
				{
					model: User,
					as: "user",
					attributes: ["id", "steamName", "avatarUrl"],
				},
				{
					model: CustomCase,
					as: "case",
					attributes: ["id", "title", "imageUrl", "priceCredits"],
				},
				{
					model: Item,
					as: "itemWon",
					include: [
						{
							model: Price,
							as: "price",
						},
					],
				},
			],
		});

		if (!opening) {
			return res.status(404).json({ error: "Opening not found" });
		}

		res.json(opening);
	} catch (error) {
		console.error("Error fetching opening:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/openings/user/:userId
 * Get user's opening history
 */
router.get("/user/:userId", async (req, res) => {
	try {
		const { page = 1, limit = 50 } = req.query;
		const offset = (parseInt(page) - 1) * parseInt(limit);

		const { count, rows: openings } = await CaseOpening.findAndCountAll({
			where: { userId: req.params.userId },
			limit: parseInt(limit),
			offset,
			order: [["openedAt", "DESC"]],
			include: [
				{
					model: CustomCase,
					as: "case",
					attributes: ["id", "title", "imageUrl", "priceCredits"],
				},
				{
					model: Item,
					as: "itemWon",
					include: [
						{
							model: Price,
							as: "price",
						},
					],
				},
			],
		});

		// Calculate total stats
		const totalSpent = openings.reduce((sum, o) => sum + o.creditsSpent, 0);
		const totalValue = openings.reduce(
			(sum, o) => sum + o.itemValueCredits,
			0
		);
		const profit = totalValue - totalSpent;

		res.json({
			openings,
			stats: {
				totalOpenings: count,
				totalSpent,
				totalValue,
				profit,
				profitPercentage:
					totalSpent > 0
						? ((profit / totalSpent) * 100).toFixed(2)
						: 0,
			},
			pagination: {
				total: count,
				page: parseInt(page),
				limit: parseInt(limit),
				totalPages: Math.ceil(count / parseInt(limit)),
			},
		});
	} catch (error) {
		console.error("Error fetching user openings:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/openings/verify/:id
 * Verify provably fair opening
 */
router.get("/verify/:id", async (req, res) => {
	try {
		const opening = await CaseOpening.findByPk(req.params.id, {
			include: [
				{
					model: CustomCase,
					as: "case",
					include: [
						{
							model: db.CaseItem,
							as: "caseItems",
							include: [
								{
									model: Item,
									as: "item",
								},
							],
						},
					],
				},
				{
					model: Item,
					as: "itemWon",
				},
			],
		});

		if (!opening) {
			return res.status(404).json({ error: "Opening not found" });
		}

		// Build verification data
		const sorted = [...opening.case.caseItems].sort(
			(a, b) =>
				parseFloat(a.dropChancePercentage) -
				parseFloat(b.dropChancePercentage)
		);

		let cumulative = 0;
		const dropTable = sorted.map((item) => {
			const start = cumulative;
			cumulative += parseFloat(item.dropChancePercentage);
			return {
				itemId: item.itemId,
				itemName: item.item.name,
				start,
				end: cumulative,
				dropChance: item.dropChancePercentage,
			};
		});

		// Find which range the random value fell into
		const selectedRange = dropTable.find(
			(r) => opening.randomValue >= r.start && opening.randomValue < r.end
		);

		res.json({
			randomSeed: opening.randomSeed,
			randomValue: opening.randomValue,
			itemWon: opening.itemWon.name,
			dropTable,
			selectedRange,
			verification: {
				seedHex: opening.randomSeed,
				randomNumber: opening.randomValue,
				selectedItem: opening.itemWon.name,
				isValid: selectedRange?.itemId === opening.itemWonId,
			},
		});
	} catch (error) {
		console.error("Error verifying opening:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/openings/recent/all
 * Get recent openings across all cases
 */
router.get("/recent/all", async (req, res) => {
	try {
		const { limit = 100 } = req.query;

		const openings = await CaseOpening.findAll({
			limit: parseInt(limit),
			order: [["openedAt", "DESC"]],
			include: [
				{
					model: User,
					as: "user",
					attributes: ["id", "steamName", "avatarUrl"],
				},
				{
					model: CustomCase,
					as: "case",
					attributes: ["id", "title", "imageUrl"],
				},
				{
					model: Item,
					as: "itemWon",
					include: [
						{
							model: Price,
							as: "price",
						},
					],
				},
			],
		});

		res.json({ openings });
	} catch (error) {
		console.error("Error fetching recent openings:", error);
		res.status(500).json({ error: error.message });
	}
});

export default router;
