import express from "express";
import db from "../models/index.js";
import { scrapeCollections } from "../services/collectionScraper.js";

const router = express.Router();
const { Collection, Item, CollectionItem, Price } = db;

/**
 * GET /api/collections
 * Get all CS2 collections from database
 *
 * Query params:
 * - includeItems: boolean (default: false) - Include items in response
 * - page: number (default: 1)
 * - limit: number (default: 50, max: 100)
 */
router.get("/", async (req, res, next) => {
	try {
		const { includeItems = "false", page = "1", limit = "50" } = req.query;

		const pageNum = Math.max(1, parseInt(page));
		const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
		const offset = (pageNum - 1) * limitNum;

		console.log(
			`📚 Fetching collections (page ${pageNum}, limit ${limitNum})`
		);

		// Build query options
		const queryOptions = {
			limit: limitNum,
			offset,
			order: [["name", "ASC"]],
		};

		// Include items if requested
		if (includeItems === "true") {
			queryOptions.include = [
				{
					model: Item,
					as: "items",
					through: {
						attributes: ["rarity"],
					},
					attributes: ["id", "name"],
				},
			];
		}

		// Get collections and total count
		const { count, rows: collections } = await Collection.findAndCountAll(
			queryOptions
		);

		const totalPages = Math.ceil(count / limitNum);

		console.log(
			`  ✅ Found ${collections.length} collections (${count} total)`
		);

		res.json({
			success: true,
			data: {
				collections,
				pagination: {
					page: pageNum,
					limit: limitNum,
					total: count,
					totalPages,
					hasMore: pageNum < totalPages,
				},
			},
		});
	} catch (error) {
		console.error("❌ Error fetching collections:", error);
		next(error);
	}
});

/**
 * GET /api/collections/:id
 * Get a specific collection by ID with all its items
 */
router.get("/:id", async (req, res, next) => {
	try {
		const { id } = req.params;

		console.log(`📚 Fetching collection ID: ${id}`);

		const collection = await Collection.findByPk(id, {
			include: [
				{
					model: Item,
					as: "items",
					through: {
						attributes: ["rarity"],
					},
					attributes: ["id", "name"],
				},
			],
		});

		if (!collection) {
			console.log(`  ⚠️ Collection ${id} not found`);
			return res.status(404).json({
				success: false,
				error: {
					message: "Collection not found",
					code: "COLLECTION_NOT_FOUND",
				},
			});
		}

		// Group items by rarity
		const itemsByRarity = collection.items.reduce((acc, item) => {
			const rarity = item.CollectionItem.rarity;
			if (!acc[rarity]) {
				acc[rarity] = [];
			}
			acc[rarity].push({
				id: item.id,
				name: item.name,
			});
			return acc;
		}, {});

		console.log(
			`  ✅ Found collection: ${collection.name} (${collection.items.length} items)`
		);

		res.json({
			success: true,
			data: {
				id: collection.id,
				name: collection.name,
				itemCount: collection.items.length,
				itemsByRarity,
				createdAt: collection.createdAt,
				updatedAt: collection.updatedAt,
			},
		});
	} catch (error) {
		console.error("❌ Error fetching collection:", error);
		next(error);
	}
});

/**
 * GET /api/collections/:id/items
 * Get all items from a specific collection with prices
 */
router.get("/:id/items", async (req, res, next) => {
	try {
		const { id } = req.params;

		console.log(`📚 Fetching items for collection ID: ${id}`);

		const collection = await Collection.findByPk(id, {
			include: [
				{
					model: Item,
					as: "items",
					through: {
						attributes: ["rarity"],
					},
					include: [
						{
							model: Price,
							as: "price",
							attributes: ["price", "lowestPrice", "medianPrice"],
						},
					],
				},
			],
		});

		if (!collection) {
			console.log(`  ⚠️ Collection ${id} not found`);
			return res.status(404).json({
				success: false,
				error: "Collection not found",
			});
		}

		// Format items for frontend
		const items = collection.items.map((item) => ({
			id: item.id,
			name: item.name,
			rarity: item.CollectionItem?.rarity || "Unknown",
			price: item.price
				? {
						price: parseFloat(item.price.price),
						lowestPrice: parseFloat(item.price.lowestPrice),
						medianPrice: parseFloat(item.price.medianPrice),
				  }
				: null,
		}));

		console.log(
			`  ✅ Found ${items.length} items in collection: ${collection.name}`
		);

		res.json({
			success: true,
			collectionId: collection.id,
			collectionName: collection.name,
			items,
		});
	} catch (error) {
		console.error("❌ Error fetching collection items:", error);
		next(error);
	}
});

/**
 * POST /api/collections/sync
 * Scrape and synchronize CS2 collections from totalcsgo.com
 *
 * This endpoint will:
 * 1. Scrape all collections from totalcsgo.com
 * 2. Update database with new collections/items
 * 3. Return sync statistics
 *
 * NOTE: This is a long-running operation (~3 minutes)
 */
router.post("/sync", async (req, res, next) => {
	try {
		console.log("🔄 Starting collection synchronization...");

		// Run the scraper service
		const result = await scrapeCollections();

		if (!result.success) {
			console.log("  ❌ Scraping failed:", result.error);
			return res.status(500).json({
				success: false,
				error: {
					message: "Failed to scrape collections",
					details: result.error,
					code: "SCRAPING_FAILED",
				},
			});
		}

		console.log("  ✅ Scraping completed");
		console.log(
			`  📊 Collections scraped: ${result.stats.collectionsScraped}`
		);
		console.log(`  📊 Total items: ${result.stats.totalItems}`);

		// Now sync with database
		const syncResult = await syncCollectionsToDatabase(result.data);

		console.log("  ✅ Database sync completed");
		console.log(`  📊 Collections added: ${syncResult.collectionsAdded}`);
		console.log(`  📊 Items added: ${syncResult.itemsAdded}`);
		console.log(`  📊 Links added: ${syncResult.linksAdded}`);

		res.json({
			success: true,
			data: {
				scraping: {
					collectionsScraped: result.stats.collectionsScraped,
					totalItems: result.stats.totalItems,
					duration: result.stats.duration,
				},
				database: {
					collectionsAdded: syncResult.collectionsAdded,
					collectionsUpdated: syncResult.collectionsUpdated,
					itemsAdded: syncResult.itemsAdded,
					linksAdded: syncResult.linksAdded,
				},
				timestamp: new Date().toISOString(),
			},
		});
	} catch (error) {
		console.error("❌ Error syncing collections:", error);
		next(error);
	}
});

/**
 * Sync scraped collections data to database
 */
async function syncCollectionsToDatabase(scrapedData) {
	const transaction = await db.sequelize.transaction();

	try {
		const stats = {
			collectionsAdded: 0,
			collectionsUpdated: 0,
			itemsAdded: 0,
			linksAdded: 0,
		};

		// Collect all unique items
		const uniqueItemsSet = new Set();
		for (const [collectionName, rarityGroups] of Object.entries(
			scrapedData
		)) {
			for (const items of Object.values(rarityGroups)) {
				items.forEach((itemName) => uniqueItemsSet.add(itemName));
			}
		}

		// Get existing items
		const existingItems = await Item.findAll({
			attributes: ["id", "name"],
			transaction,
		});
		const existingItemNames = new Set(
			existingItems.map((item) => item.name)
		);

		// Insert new items
		const newItemNames = Array.from(uniqueItemsSet).filter(
			(name) => !existingItemNames.has(name)
		);
		if (newItemNames.length > 0) {
			const newItemRecords = newItemNames.map((name) => ({ name }));
			await Item.bulkCreate(newItemRecords, { transaction });
			stats.itemsAdded = newItemNames.length;
		}

		// Get all items with IDs
		const allItems = await Item.findAll({ transaction });
		const itemNameToId = new Map(
			allItems.map((item) => [item.name, item.id])
		);

		// Process collections
		const collectionItemRecords = [];

		for (const [collectionName, rarityGroups] of Object.entries(
			scrapedData
		)) {
			// Create or update collection
			const [collection, created] = await Collection.findOrCreate({
				where: { name: collectionName },
				defaults: { name: collectionName },
				transaction,
			});

			if (created) {
				stats.collectionsAdded++;
			} else {
				stats.collectionsUpdated++;
			}

			// Clear existing collection-item links for this collection
			await CollectionItem.destroy({
				where: { collection_id: collection.id },
				transaction,
			});

			// Prepare new collection-item relationships
			for (const [rarity, items] of Object.entries(rarityGroups)) {
				items.forEach((itemName) => {
					const itemId = itemNameToId.get(itemName);
					if (itemId) {
						collectionItemRecords.push({
							collection_id: collection.id,
							item_id: itemId,
							rarity: rarity,
						});
					}
				});
			}
		}

		// Bulk insert collection-item relationships
		if (collectionItemRecords.length > 0) {
			await CollectionItem.bulkCreate(collectionItemRecords, {
				transaction,
				ignoreDuplicates: true,
			});
			stats.linksAdded = collectionItemRecords.length;
		}

		await transaction.commit();
		return stats;
	} catch (error) {
		await transaction.rollback();
		throw error;
	}
}

export default router;
