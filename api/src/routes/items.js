import express from "express";
import { Sequelize, Op } from "sequelize";
import db from "../models/index.js";

const { Item, Price, Collection, CollectionItem } = db;
const router = express.Router();

/**
 * GET /api/items
 * Get all items with their price ranges (normal and StatTrak)
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 50, max: 100)
 * - search: string (search by name)
 * - collectionId: number (filter by collection)
 * - hasPrice: boolean (only items with prices)
 */
router.get("/", async (req, res) => {
	try {
		const {
			page = "1",
			limit = "50",
			search,
			collectionId,
			hasPrice,
		} = req.query;

		const pageNum = Math.max(1, parseInt(page));
		const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
		const offset = (pageNum - 1) * limitNum;

		// Build where clause
		const where = {};
		if (search) {
			where.name = { [Op.iLike]: `%${search}%` };
		}

		// Get items with associated prices and collections
		const { rows: items, count } = await Item.findAndCountAll({
			where,
			include: [
				{
					model: Collection,
					as: "collections",
					through: { attributes: [] },
					required: collectionId ? true : false,
					where: collectionId ? { id: collectionId } : undefined,
					attributes: ["id", "name"],
				},
			],
			limit: limitNum,
			offset,
			distinct: true,
			order: [["name", "ASC"]],
		});

		// For each item, get price ranges
		const itemsWithPrices = await Promise.all(
			items.map(async (item) => {
				const itemJson = item.toJSON();
				const baseName = itemJson.name;

				// Get all prices for this base item (all exteriors and variants)
				const prices = await Price.findAll({
					where: {
						marketHashName: {
							[Op.or]: [
								{ [Op.eq]: baseName }, // Exact match (cases, stickers, etc.)
								{ [Op.like]: `${baseName} (%` }, // With exterior
								{ [Op.like]: `StatTrak™ ${baseName} (%` }, // StatTrak with exterior
							],
						},
					},
					attributes: [
						"marketHashName",
						"price",
						"lowestPrice",
						"medianPrice",
						"exterior",
						"imageUrl",
					],
				});

				// Separate normal and StatTrak prices
				const normalPrices = prices.filter(
					(p) => !p.marketHashName.includes("StatTrak™")
				);
				const statTrakPrices = prices.filter((p) =>
					p.marketHashName.includes("StatTrak™")
				);

				// Calculate price ranges
				const calculateRange = (priceList) => {
					if (priceList.length === 0) return null;

					const priceValues = priceList
						.map((p) => parseFloat(p.price))
						.filter((p) => !isNaN(p) && p > 0);

					if (priceValues.length === 0) return null;

					return {
						min: Math.min(...priceValues),
						max: Math.max(...priceValues),
						count: priceValues.length,
					};
				};

				const normalRange = calculateRange(normalPrices);
				const statTrakRange = calculateRange(statTrakPrices);

				// Get image URL (prefer Factory New, then any available)
				const getImageUrl = (priceList) => {
					if (priceList.length === 0) return null;

					// Try Factory New first
					const fnPrice = priceList.find((p) =>
						p.marketHashName.includes("(Factory New)")
					);
					if (fnPrice?.imageUrl) return fnPrice.imageUrl;

					// Otherwise use first available
					const priceWithImage = priceList.find((p) => p.imageUrl);
					return priceWithImage?.imageUrl || null;
				};

				const imageUrl =
					getImageUrl(normalPrices) || getImageUrl(statTrakPrices);

				// Skip if hasPrice filter is enabled and no prices found
				if (hasPrice === "true" && !normalRange && !statTrakRange) {
					return null;
				}

				return {
					...itemJson,
					imageUrl,
					priceRange: {
						normal: normalRange,
						statTrak: statTrakRange,
					},
					collection: itemJson.collections?.[0] || null,
				};
			})
		);

		// Filter out null items (from hasPrice filter)
		const filteredItems = itemsWithPrices.filter((item) => item !== null);

		res.json({
			items: filteredItems,
			pagination: {
				page: pageNum,
				limit: limitNum,
				total: count,
				totalPages: Math.ceil(count / limitNum),
			},
		});
	} catch (error) {
		console.error("Error fetching items:", error);
		res.status(500).json({
			error: "Failed to fetch items",
			message: error.message,
		});
	}
});

/**
 * GET /api/items/:id
 * Get a specific item with all its price variants
 */
router.get("/:id", async (req, res) => {
	try {
		const { id } = req.params;

		const item = await Item.findByPk(id, {
			include: [
				{
					model: Collection,
					as: "collections",
					through: { attributes: [] },
					attributes: ["id", "name"],
				},
			],
		});

		if (!item) {
			return res.status(404).json({ error: "Item not found" });
		}

		const itemJson = item.toJSON();
		const baseName = itemJson.name;

		// Get all price variants
		const prices = await Price.findAll({
			where: {
				marketHashName: {
					[Op.or]: [
						{ [Op.eq]: baseName },
						{ [Op.like]: `${baseName} (%` },
						{ [Op.like]: `StatTrak™ ${baseName} (%` },
					],
				},
			},
			order: [
				[
					Sequelize.literal(
						"CASE WHEN market_hash_name LIKE 'StatTrak™%' THEN 1 ELSE 0 END"
					),
					"ASC",
				],
				["exterior", "ASC"],
			],
		});

		// Group by normal and StatTrak
		const normalPrices = [];
		const statTrakPrices = [];

		prices.forEach((price) => {
			const priceJson = price.toJSON();
			if (priceJson.marketHashName.includes("StatTrak™")) {
				statTrakPrices.push(priceJson);
			} else {
				normalPrices.push(priceJson);
			}
		});

		res.json({
			...itemJson,
			prices: {
				normal: normalPrices,
				statTrak: statTrakPrices,
			},
			collection: itemJson.collections?.[0] || null,
		});
	} catch (error) {
		console.error("Error fetching item:", error);
		res.status(500).json({
			error: "Failed to fetch item",
			message: error.message,
		});
	}
});

export default router;
