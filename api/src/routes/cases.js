import express from "express";
import db from "../models/index.js";
import {
	calculateFairProbabilities,
	validateProbabilities,
} from "../services/caseOpeningService.js";

const router = express.Router();
const { CustomCase, CaseItem, User, Collection, Item, Price, CaseOpening } = db;

/**
 * GET /api/cases
 * Get all cases with pagination
 */
router.get("/", async (req, res) => {
	try {
		const {
			page = 1,
			limit = 20,
			featured = false,
			collectionId = null,
			creatorId = null,
			sortBy = "popular", // popular, newest, price-low, price-high
		} = req.query;

		const offset = (parseInt(page) - 1) * parseInt(limit);

		// Build where clause
		const where = { isActive: true };
		if (featured === "true") where.isFeatured = true;
		if (collectionId) where.collectionId = collectionId;
		if (creatorId) where.creatorId = creatorId;

		// Build order clause
		let order;
		switch (sortBy) {
			case "popular":
				order = [["timesOpened", "DESC"]];
				break;
			case "newest":
				order = [["createdAt", "DESC"]];
				break;
			case "price-low":
				order = [["priceCredits", "ASC"]];
				break;
			case "price-high":
				order = [["priceCredits", "DESC"]];
				break;
			default:
				order = [["timesOpened", "DESC"]];
		}

		const { count, rows: cases } = await CustomCase.findAndCountAll({
			where,
			limit: parseInt(limit),
			offset,
			order,
			include: [
				{
					model: User,
					as: "creator",
					attributes: ["id", "steamName", "avatarUrl"],
				},
				{
					model: Collection,
					as: "collection",
					attributes: ["id", "name"],
				},
				{
					model: CaseItem,
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

		// Calculate stats for each case
		const casesWithStats = cases.map((c) => {
			const caseJson = c.toJSON();
			const expectedValue = c.calculateExpectedValue();
			const houseEdge = c.calculateHouseEdge();

			return {
				...caseJson,
				expectedValue,
				houseEdge,
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
		console.error("Error fetching cases:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/cases/:id
 * Get single case details
 */
router.get("/:id", async (req, res) => {
	try {
		const customCase = await CustomCase.findByPk(req.params.id, {
			include: [
				{
					model: User,
					as: "creator",
					attributes: [
						"id",
						"steamName",
						"avatarUrl",
						"totalCasesCreated",
					],
				},
				{
					model: Collection,
					as: "collection",
					attributes: ["id", "name"],
				},
				{
					model: CaseItem,
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
					order: [["dropChancePercentage", "ASC"]],
				},
			],
		});

		if (!customCase) {
			return res.status(404).json({ error: "Case not found" });
		}

		const caseJson = customCase.toJSON();
		const expectedValue = customCase.calculateExpectedValue();
		const houseEdge = customCase.calculateHouseEdge();

		res.json({
			...caseJson,
			expectedValue,
			houseEdge,
		});
	} catch (error) {
		console.error("Error fetching case:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * POST /api/cases
 * Create new case
 */
router.post("/", async (req, res) => {
	const transaction = await db.sequelize.transaction();

	try {
		const {
			creatorId, // Can be UUID or Steam ID
			collectionId = null,
			title,
			description,
			imageUrl,
			priceCredits,
			items, // Array of { item_id, drop_chance }
		} = req.body;

		// Validation
		if (
			!creatorId ||
			!title ||
			!priceCredits ||
			!items ||
			items.length === 0
		) {
			await transaction.rollback();
			return res.status(400).json({
				error: "Missing required fields: creatorId, title, priceCredits, items",
			});
		}

		if (title.length < 5 || title.length > 255) {
			await transaction.rollback();
			return res.status(400).json({
				error: "Title must be between 5 and 255 characters",
			});
		}

		if (priceCredits < 50 || priceCredits > 10000) {
			await transaction.rollback();
			return res.status(400).json({
				error: "Price must be between 50 and 10000 credits",
			});
		}

		if (items.length < 2) {
			await transaction.rollback();
			return res.status(400).json({
				error: "Case must have at least 2 items",
			});
		}

		// Validate probabilities sum to 100
		if (!validateProbabilities(items)) {
			await transaction.rollback();
			return res.status(400).json({
				error: "Drop chances must sum to 100%",
			});
		}

		// Find creator by UUID or Steam ID
		let creator = await User.findByPk(creatorId, { transaction });
		if (!creator) {
			// Try finding by Steam ID
			creator = await User.findOne({
				where: { steamId: creatorId },
				transaction,
			});
		}

		if (!creator) {
			await transaction.rollback();
			return res.status(404).json({
				error: "Creator not found. Please create user first by adding credits.",
			});
		}

		// Create case (use creator.id which is the UUID)
		const customCase = await CustomCase.create(
			{
				creatorId: creator.id, // Use the UUID, not the provided creatorId
				collectionId,
				title,
				description,
				imageUrl,
				priceCredits,
			},
			{ transaction }
		);

		// Create case items
		const caseItems = await Promise.all(
			items.map((item) =>
				CaseItem.create(
					{
						caseId: customCase.id,
						itemId: item.item_id,
						dropChancePercentage: item.drop_chance,
						createdAt: new Date(),
					},
					{ transaction }
				)
			)
		);

		// Update creator stats
		creator.totalCasesCreated += 1;
		await creator.save({ transaction });

		await transaction.commit();

		// Fetch full case with items
		const fullCase = await CustomCase.findByPk(customCase.id, {
			include: [
				{
					model: User,
					as: "creator",
					attributes: ["id", "steamName", "avatarUrl"],
				},
				{
					model: Collection,
					as: "collection",
					attributes: ["id", "name"],
				},
				{
					model: CaseItem,
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

		const caseJson = fullCase.toJSON();
		const expectedValue = fullCase.calculateExpectedValue();
		const houseEdge = fullCase.calculateHouseEdge();

		res.status(201).json({
			...caseJson,
			expectedValue,
			houseEdge,
		});
	} catch (error) {
		await transaction.rollback();
		console.error("Error creating case:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * PUT /api/cases/:id
 * Update case (creator only, not yet opened cases)
 */
router.put("/:id", async (req, res) => {
	const transaction = await db.sequelize.transaction();

	try {
		const { title, description, imageUrl, priceCredits, items, isActive } =
			req.body;

		const customCase = await CustomCase.findByPk(req.params.id, {
			transaction,
		});

		if (!customCase) {
			await transaction.rollback();
			return res.status(404).json({ error: "Case not found" });
		}

		// Only allow updates if case hasn't been opened yet
		if (customCase.timesOpened > 0) {
			await transaction.rollback();
			return res.status(403).json({
				error: "Cannot modify case that has already been opened",
			});
		}

		// Update basic fields
		if (title !== undefined) {
			if (title.length < 5 || title.length > 255) {
				await transaction.rollback();
				return res.status(400).json({
					error: "Title must be between 5 and 255 characters",
				});
			}
			customCase.title = title;
		}

		if (description !== undefined) customCase.description = description;
		if (imageUrl !== undefined) customCase.imageUrl = imageUrl;
		if (isActive !== undefined) customCase.isActive = isActive;

		if (priceCredits !== undefined) {
			if (priceCredits < 50 || priceCredits > 10000) {
				await transaction.rollback();
				return res.status(400).json({
					error: "Price must be between 50 and 10000 credits",
				});
			}
			customCase.priceCredits = priceCredits;
		}

		// Update items if provided
		if (items) {
			if (items.length < 2) {
				await transaction.rollback();
				return res.status(400).json({
					error: "Case must have at least 2 items",
				});
			}

			if (!validateProbabilities(items)) {
				await transaction.rollback();
				return res.status(400).json({
					error: "Drop chances must sum to 100%",
				});
			}

			// Delete existing items
			await CaseItem.destroy({
				where: { caseId: customCase.id },
				transaction,
			});

			// Create new items
			await Promise.all(
				items.map((item) =>
					CaseItem.create(
						{
							caseId: customCase.id,
							itemId: item.item_id,
							dropChancePercentage: item.drop_chance,
						},
						{ transaction }
					)
				)
			);
		}

		await customCase.save({ transaction });
		await transaction.commit();

		// Fetch updated case
		const updated = await CustomCase.findByPk(customCase.id, {
			include: [
				{
					model: User,
					as: "creator",
					attributes: ["id", "steamName", "avatarUrl"],
				},
				{
					model: Collection,
					as: "collection",
					attributes: ["id", "name"],
				},
				{
					model: CaseItem,
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

		const caseJson = updated.toJSON();
		const expectedValue = updated.calculateExpectedValue();
		const houseEdge = updated.calculateHouseEdge();

		res.json({
			...caseJson,
			expectedValue,
			houseEdge,
		});
	} catch (error) {
		await transaction.rollback();
		console.error("Error updating case:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * DELETE /api/cases/:id
 * Deactivate case (soft delete)
 */
router.delete("/:id", async (req, res) => {
	try {
		const customCase = await CustomCase.findByPk(req.params.id);

		if (!customCase) {
			return res.status(404).json({ error: "Case not found" });
		}

		customCase.isActive = false;
		await customCase.save();

		res.json({ message: "Case deactivated successfully" });
	} catch (error) {
		console.error("Error deactivating case:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * POST /api/cases/calculate-probabilities
 * Calculate suggested probabilities for items
 */
router.post("/calculate-probabilities", async (req, res) => {
	try {
		const { items, casePrice } = req.body;

		if (!items || !Array.isArray(items) || items.length === 0) {
			return res.status(400).json({ error: "Items array is required" });
		}

		if (!casePrice || casePrice < 50) {
			return res
				.status(400)
				.json({ error: "Valid case price is required" });
		}

		const result = await calculateFairProbabilities(items, casePrice);

		res.json(result);
	} catch (error) {
		console.error("Error calculating probabilities:", error);
		res.status(500).json({ error: error.message });
	}
});

/**
 * GET /api/cases/:id/openings
 * Get recent openings for a case
 */
router.get("/:id/openings", async (req, res) => {
	try {
		const { page = 1, limit = 50 } = req.query;
		const offset = (parseInt(page) - 1) * parseInt(limit);

		const { count, rows: openings } = await CaseOpening.findAndCountAll({
			where: { caseId: req.params.id },
			limit: parseInt(limit),
			offset,
			order: [["openedAt", "DESC"]],
			include: [
				{
					model: User,
					as: "user",
					attributes: ["id", "steamName", "avatarUrl"],
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

		res.json({
			openings,
			pagination: {
				total: count,
				page: parseInt(page),
				limit: parseInt(limit),
				totalPages: Math.ceil(count / parseInt(limit)),
			},
		});
	} catch (error) {
		console.error("Error fetching case openings:", error);
		res.status(500).json({ error: error.message });
	}
});

export default router;
